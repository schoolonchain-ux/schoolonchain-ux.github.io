'use strict';
// Estado de cada envío del puente USDT0 (LayerZero) según LayerZero Scan: ¿llegó, está en camino o lo han parado?
// Uso: node lz-estado.cjs → lee tron/puentes-decodificados.json y escribe tron/lz-estado.json
const fs = require('fs');
const OUT = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmt = n => Math.round(n).toLocaleString('en');
async function lz(tx) { for (let i = 0; i < 5; i++) { try { await sleep(220); const r = await fetch('https://scan.layerzero-api.com/v1/messages/tx/0x' + tx, { signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(2500 * (i + 1)); continue; } if (r.status === 404) return { noEncontrado: true }; if (!r.ok) { await sleep(1500); continue; } return await r.json(); } catch { await sleep(1500); } } return null; }
(async () => {
  const F = JSON.parse(fs.readFileSync(OUT + 'puentes-decodificados.json', 'utf8')).filter(f => f.ok && f.dstEid); const res = []; let n = 0;
  for (const f of F) {
    const j = await lz(f.tx); const m = j && j.data && j.data[0];
    const r = { tx: f.tx, tramo: f.tramo, desde: f.desde, evm: f.evm, cadena: f.cadena, at: f.at, v: f.v, p: f.p, enviado: f.cantidadEnviada };
    if (!j) r.estado = 'SIN RESPUESTA'; else if (j.noEncontrado || !m) r.estado = 'NO ENCONTRADO';
    else {
      r.estado = m.status && m.status.name; r.mensaje = m.status && m.status.message; r.destino = m.destination && m.destination.status; r.dstTx = m.destination && m.destination.tx && m.destination.tx.txHash; r.dstHora = m.destination && m.destination.tx && m.destination.tx.blockTimestamp;
      r.nilify = !!(m.destination && m.destination.nilify); r.dvn = m.verification && m.verification.dvn && m.verification.dvn.status; r.dvns = m.verification && m.verification.dvn && m.verification.dvn.dvns ? Object.values(m.verification.dvn.dvns).map(d => d.status) : null;
      r.dstEid = m.pathway && m.pathway.dstEid; const pl = (m.source && m.source.tx && m.source.tx.payload || '').toLowerCase(); r.cadenaCoincide = r.dstEid === f.dstEid; r.direccionCoincide = !!f.evm && pl.includes(f.evm.slice(2).toLowerCase()); r.importeLZ = pl.length >= 16 ? Number(BigInt('0x' + pl.slice(-16))) / 1e6 : null; r.importeCoincide = r.importeLZ !== null && Math.abs(r.importeLZ - f.cantidadEnviada) < 0.01; r.destinatario = m.source && m.source.tx && m.source.tx.payload ? '0x' + m.source.tx.payload.slice(m.source.tx.payload.length - 8 - 40 - 0, m.source.tx.payload.length - 16).slice(-40) : null;
    }
    res.push(r); if (++n % 40 === 0) console.log('  …', n, '/', F.length);
  }
  fs.writeFileSync(OUT + 'lz-estado.json', JSON.stringify(res, null, 1));
  const por = {}; for (const r of res) { const k = r.estado + (r.nilify ? ' + anulado (nilify)' : ''); const x = por[k] || (por[k] = { n: 0, v: 0, robo: 0 }); x.n++; x.v += r.v; x.robo += r.v * (r.p ?? 0); }
  console.log('\nEnvíos por USDT0 (LayerZero):', res.length); for (const [k, x] of Object.entries(por).sort((a, b) => b[1].v - a[1].v)) console.log('  ', k.padEnd(38), String(x.n).padStart(4), 'envíos |', fmt(x.v).padStart(10), '$ brutos |', fmt(x.robo).padStart(10), '$ robo est.');
  const ent = res.filter(r => r.estado !== 'SIN RESPUESTA' && r.estado !== 'NO ENCONTRADO'); console.log('\nLectura de la llamada frente al mensaje de LayerZero (' + ent.length + '): cadena de destino coincide', ent.filter(r => r.cadenaCoincide).length, '| dirección coincide', ent.filter(r => r.direccionCoincide).length, '| importe coincide', ent.filter(r => r.importeCoincide).length); for (const r of ent.filter(r => !r.cadenaCoincide || !r.direccionCoincide || !r.importeCoincide).slice(0, 8)) console.log('   ✗', r.tx.slice(0, 12), r.cadena, 'eid LZ', r.dstEid, 'dir', r.direccionCoincide, 'importe', r.importeCoincide, r.importeLZ, r.enviado);
const raros = res.filter(r => r.estado !== 'DELIVERED'); console.log('\nno entregados:', raros.length); for (const r of raros.slice(0, 40)) console.log('  ', new Date(r.at).toISOString().slice(5, 16), r.cadena.padEnd(9), fmt(r.v).padStart(9), '$', r.evm, '|', r.estado, '|', r.destino, '| nilify', r.nilify, '| DVN', JSON.stringify(r.dvns), '|', r.tramo);
})().catch(e => { console.error('ERROR', e.stack); process.exit(1); });
