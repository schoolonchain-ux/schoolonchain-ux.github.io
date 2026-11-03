'use strict';
// Chainflip (protocolo de cambio entre cadenas): el USDT que entra en su bóveda de TRON viene de «canales de depósito» (un contrato por cambio). El explorador público de Chainflip guarda para cada canal
// el activo y la dirección de DESTINO y lo que el protocolo entregó (egreso). Este script consulta cada canal del conjunto y deja el destino de cada uno. Solo lectura.
// Uso: node chainflip-destinos.cjs <carpeta-del-tramo> [direcciones.json]  → <tramo>/chainflip-destinos.json (reanudable)
// Por defecto las direcciones son los recolectores hacia la bóveda de Chainflip de resultados/contratos-clasificados.json + los remitentes directos a la bóveda del caché del tramo.
const fs = require('node:fs'); const path = require('node:path');
const dir = process.argv[2]; if (!dir) { console.error('uso: node chainflip-destinos.cjs <carpeta-del-tramo> [direcciones.json]'); process.exit(1); }
const BOVEDA = 'TEcDijvKSXcfWT7S6rd44H5vNgufm7Y4XC'; const GQL = 'https://explorer-service-processor.chainflip.io/graphql'; const sleep = ms => new Promise(r => setTimeout(r, ms));
const pref = path.basename(dir.replace(/[\\/]+$/, '')).replace(/-v\d+$/, '');
async function q(query) { for (let i = 0; i < 6; i++) { try { const r = await fetch(GQL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query }), signal: AbortSignal.timeout(40000) }); const j = await r.json(); if (j.data) return j.data; if (j.errors) { console.error('error GraphQL', JSON.stringify(j.errors).slice(0, 300)); return null; } } catch {} await sleep(1500 * (i + 1)); } return null; }
const consulta = lote => `{ allSwapChannels(first: 50, filter:{depositAddress:{in:[${lote.map(a => JSON.stringify(a)).join(',')}]}}){ nodes { id depositAddress destinationAddress sourceAsset destinationAsset swapRequestsByDepositChannelId { nodes { id nativeId depositAmount depositValueUsd sourceAsset destinationAsset destinationAddress requestedBlockTimestamp completedBlockTimestamp egressByEgressId { amount valueUsd asset } transactionRefsBySwapRequestId { nodes { ref } } } } } } }`;
(async () => {
  let dirs = new Set();
  if (process.argv[3]) for (const a of JSON.parse(fs.readFileSync(process.argv[3], 'utf8'))) dirs.add(a);
  else {
    const K = JSON.parse(fs.readFileSync('C:/EquipoIA/research/auditoria-adversarial-2026-10-31/resultados/contratos-clasificados.json', 'utf8')); for (const [a, d] of Object.entries(K.recolectores)) if (d === BOVEDA) dirs.add(a);
    const { rec } = JSON.parse(fs.readFileSync(path.join(dir, pref + '-cache.json'), 'utf8')); for (const [w, r] of Object.entries(rec)) for (const e of r.sal || []) if (e.a === BOVEDA) dirs.add(w);
  }
  const out = path.join(dir, 'chainflip-destinos.json'); let S = {}; try { S = JSON.parse(fs.readFileSync(out, 'utf8')); } catch { /* primera vez */ }
  const cola = [...dirs].filter(a => !S[a]); console.log('canales', dirs.size, '| por consultar', cola.length);
  for (let i = 0; i < cola.length; i += 10) {
    const lote = cola.slice(i, i + 10);
    const d = await q(consulta(lote));
    if (!d) { for (const a of lote) S[a] = { error: 'sin lectura' }; continue; }
    const por = {}; for (const c of d.allSwapChannels.nodes) (por[c.depositAddress] = por[c.depositAddress] || []).push(c);
    for (const a of lote) if (!por[a]) { const u = await q(consulta([a])); if (u && u.allSwapChannels.nodes.length) por[a] = u.allSwapChannels.nodes.filter(c => c.depositAddress === a); await sleep(150); }   // un lote grande puede devolver solo una parte: lo que falte se pregunta de uno en uno antes de darlo por inexistente
    for (const a of lote) { const cs = por[a]; if (!cs) { S[a] = { sinCanal: true }; continue; }
      S[a] = { canales: cs.map(c => ({ id: c.id, destino: c.destinationAddress, activoDestino: c.destinationAsset, activoOrigen: c.sourceAsset, cambios: c.swapRequestsByDepositChannelId.nodes.map(s => ({ id: s.id, nativeId: s.nativeId, entrada: Number(s.depositAmount) / 1e6, entradaUsd: Math.round(Number(s.depositValueUsd)), destino: s.destinationAddress, activoDestino: s.destinationAsset, pedido: s.requestedBlockTimestamp, completado: s.completedBlockTimestamp, refs: s.transactionRefsBySwapRequestId.nodes.map(x => x.ref), salida: s.egressByEgressId ? { importe: s.egressByEgressId.amount, usd: Math.round(Number(s.egressByEgressId.valueUsd)), activo: s.egressByEgressId.asset } : null })) })), leidoEn: new Date().toISOString() }; }
    fs.writeFileSync(out, JSON.stringify(S)); await sleep(300); if ((i / 10) % 5 === 0) console.log('  …', Math.min(i + 10, cola.length));
  }
  const porActivo = {}, destinos = new Set(); let sin = 0, err = 0; for (const [a, v] of Object.entries(S)) { if (v.error) { err++; continue; } if (v.sinCanal) { sin++; continue; } for (const c of v.canales) for (const s of c.cambios) { const k = c.activoOrigen + ' → ' + (s.activoDestino || c.activoDestino); const x = porActivo[k] || (porActivo[k] = { n: 0, entradaUsd: 0, salidaUsd: 0, destinos: new Set() }); x.n++; x.entradaUsd += s.entradaUsd; x.salidaUsd += s.salida ? s.salida.usd : 0; x.destinos.add(s.destino || c.destino); destinos.add(s.destino || c.destino); } }
  console.log('canales leídos', Object.keys(S).length, '| sin canal en el explorador', sin, '| errores', err, '| destinos distintos', destinos.size); for (const [k, x] of Object.entries(porActivo).sort((a, b) => b[1].entradaUsd - a[1].entradaUsd)) console.log('  ', k.padEnd(16), String(x.n).padStart(5), 'cambios | entrada', String(x.entradaUsd).padStart(10), '$ | salida', String(x.salidaUsd).padStart(10), '$ |', x.destinos.size, 'destinos');
})();
