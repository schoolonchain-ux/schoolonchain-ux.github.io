'use strict';
// Auditoría del lector: (F) las lecturas guardadas de una muestra de billeteras frente a una lectura nueva de TronScan, y
// (R) el reparto de TRBdWq… recalculado desde cero. Uso: node auditoria-lector.cjs [F] [R] → tron/auditoria-lector.json
const fs = require('fs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const HS = { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronscanKey };
const D = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const sleep = ms => new Promise(r => setTimeout(r, ms));
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', PX = 0.352, MIN = 350, TFOTO = Date.UTC(2026, 9, 30, 22, 40), TRB = 'TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki';
const fmt = n => Math.round(n).toLocaleString('en');
const quiero = process.argv.slice(2).map(s => s.toUpperCase()); const toca = p => !quiero.length || quiero.includes(p);
async function S(u) { for (let i = 0; i < 5; i++) { try { await sleep(320); const r = await fetch('https://apilist.tronscanapi.com' + u, { headers: HS, signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(2000 * (i + 1)); continue; } return await r.json(); } catch { await sleep(1000 * (i + 1)); } } return null; }
// todas las transferencias (TRX nativo y USDT) de una billetera entre dos instantes, por TronScan
async function leerTodo(a, desde, hasta) {
  const out = []; let incompleto = false;
  for (const tipo of ['trx', 'usdt']) {
    for (let p = 0; p < 200; p++) {
      const u = tipo === 'trx' ? `/api/transfer?address=${a}&limit=50&start=${p * 50}&sort=timestamp&count=true&start_timestamp=${desde}&end_timestamp=${hasta}` : `/api/token_trc20/transfers?limit=50&start=${p * 50}&sort=timestamp&count=true&contract_address=${USDT}&relatedAddress=${a}&start_timestamp=${desde}&end_timestamp=${hasta}`;
      const j = await S(u); if (!j) { incompleto = true; console.log('     (sin respuesta:', tipo, 'pagina', p, ')'); break; }
      const d = tipo === 'trx' ? j.data || [] : j.token_transfers || [];
      for (const t of d) {
        if (tipo === 'trx') { if (t.tokenName !== '_' || t.contractRet !== 'SUCCESS') continue; out.push({ tx: t.transactionHash, at: t.timestamp, from: t.transferFromAddress, to: t.transferToAddress, sim: 'TRX', cant: t.amount / 1e6, v: t.amount / 1e6 * PX }); }
        else { if (t.contractRet !== 'SUCCESS' || t.contract_address !== USDT) continue; out.push({ tx: t.transaction_id, at: t.block_ts, from: t.from_address, to: t.to_address, sim: 'USDT', cant: Number(t.quant) / 1e6, v: Number(t.quant) / 1e6 }); }
      }
      if (d.length < 50) break; if (p === 199) { incompleto = true; console.log('     (tope de 200 paginas:', tipo, ')'); }
    }
  }
  return { out, incompleto };
}
(async () => {
  const t0 = Date.now(); const R = {};
  if (toca('R')) {
    console.log('== R. El reparto de TRBdWq…: recalculado desde cero con TronScan');
    const desde = Date.UTC(2026, 9, 30, 2, 19), { out, incompleto } = await leerTodo(TRB, desde, TFOTO);
    const env = out.filter(t => t.from === TRB && t.to !== TRB && t.v >= MIN), env10 = env.filter(t => t.v >= 3520);
    const usd = env.reduce((s, t) => s + t.v, 0), dest = new Set(env.map(t => t.to));
    const cierre = JSON.parse(fs.readFileSync(D + 'traza-cierre.json', 'utf8')).reparto;
    R.reparto = { fuente: 'TronScan', incompleto, envios: env.length, enviosDe10000TRXomas: env10.length, usd, destinos: dest.size, informe: cierre, informeDestinos: 122 };
    console.log('   TronScan: envíos ≥350 $:', env.length, '| ≥10.000 TRX (3.520 $):', env10.length, '| importe:', fmt(usd), '$ | billeteras distintas:', dest.size, '| lectura incompleta:', incompleto);
    console.log('   informe : envíos', cierre.envios, '| ≥3.520 $', cierre.sobre3520, '| importe', fmt(cierre.usd), '$ | billeteras 122');
    // lo mismo con la lectura guardada del propio rastreo (tramo 1)
    const c = JSON.parse(fs.readFileSync(D + 'traza-cache.json', 'utf8')).rec[TRB]; const cs = (c.sal || []).filter(e => e.at <= TFOTO && e.v >= MIN);
    console.log('   lectura guardada del rastreo: envíos', cs.length, '| importe', fmt(cs.reduce((s, e) => s + e.v, 0)), '$ | billeteras', new Set(cs.map(e => e.a)).size);
    const idsF = new Set(env.map(t => t.tx + '|' + t.to)), idsC = new Set(cs.map(e => e.tx + '|' + e.a));
    const soloF = [...idsF].filter(x => !idsC.has(x)).length, soloC = [...idsC].filter(x => !idsF.has(x)).length;
    console.log('   envíos que están en TronScan y no en la lectura guardada:', soloF, '| que están en la guardada y no en TronScan:', soloC);
    R.reparto.guardada = { envios: cs.length, usd: cs.reduce((s, e) => s + e.v, 0), soloTronScan: soloF, soloGuardada: soloC };
    // entradas de TRBdWq hasta la foto
    const ent = out.filter(t => t.to === TRB && t.from !== TRB && t.v >= MIN); console.log('   entradas a TRBdWq ≥350 $ hasta la foto:', ent.map(t => `${new Date(t.at).toISOString().slice(5, 16)} ${t.sim} ${fmt(t.cant)} de ${t.from.slice(0, 8)}…`).join(' ; '));
    // desde la foto hasta hoy
    const ahora = Date.now(), post = await leerTodo(TRB, TFOTO + 1, ahora); const pe = post.out.filter(t => t.from === TRB && t.to !== TRB && t.v >= MIN), pi = post.out.filter(t => t.to === TRB && t.from !== TRB && t.v >= MIN);
    console.log('   DESDE LA FOTO hasta ahora: envíos ≥350 $:', pe.length, '| importe', fmt(pe.reduce((s, t) => s + t.v, 0)), '$ | billeteras', new Set(pe.map(t => t.to)).size, '| entradas', pi.map(t => `${new Date(t.at).toISOString().slice(5, 16)} ${t.sim} ${fmt(t.cant)} de ${t.from.slice(0, 8)}…`).join(' ; '));
    R.postFoto = { desde: TFOTO, hasta: ahora, envios: pe.length, usd: pe.reduce((s, t) => s + t.v, 0), destinos: new Set(pe.map(t => t.to)).size, entradas: pi.map(t => ({ at: t.at, sim: t.sim, cant: t.cant, de: t.from, tx: t.tx })), primeras: pe.slice(0, 3).map(t => t.tx), incompleto: post.incompleto };
    fs.writeFileSync(D + 'trb-posfoto-envios.json', JSON.stringify(pe.map(t => ({ at: t.at, a: t.to, sim: t.sim, cant: t.cant, v: t.v, tx: t.tx })), null, 0));
  }
  if (toca('F')) {
    console.log('\n== F. Lecturas guardadas del rastreo frente a una lectura nueva de TronScan (muestra al azar con semilla fija)');
    let sem = 31102026; const rnd = () => (sem = (sem * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const c1 = JSON.parse(fs.readFileSync(D + 'traza-cache.json', 'utf8')).rec, c2 = JSON.parse(fs.readFileSync(D + 'traza-post-cache.json', 'utf8')).rec;
    const pool = [...Object.entries(c1).filter(([a, r]) => r.ok && !r.seed && !r.deposito && a !== TRB).map(([a, r]) => ['tramo 1', a, r]), ...Object.entries(c2).filter(([a, r]) => r.ok && !r.seed && a !== TRB).map(([a, r]) => ['tramo 2', a, r])];
    const mezcla = pool.slice(); for (let i = mezcla.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [mezcla[i], mezcla[j]] = [mezcla[j], mezcla[i]]; }
    const muestra = [...mezcla.filter(x => x[0] === 'tramo 1').slice(0, 45), ...mezcla.filter(x => x[0] === 'tramo 2').slice(0, 25)];
    const tot = { billeteras: 0, aristasGuardadas: 0, aristasTronScan: 0, iguales: 0, soloGuardada: 0, soloTronScan: 0, importeDistinto: 0, internasSoloGuardada: 0, noAuditadas: 0 }; const detalle = []; const faltan = [];
    for (const [tramo, a, r] of muestra) {
      const desde = r.desde || Date.UTC(2026, 9, 29, 20, 0); const f = await leerTodo(a, desde, TFOTO);
      if (f.incompleto) { tot.noAuditadas++; detalle.push({ tramo, a, motivo: 'lectura incompleta' }); continue; }
      const fresco = new Map(); for (const t of f.out) { if (t.v < MIN || t.from === t.to) continue; if (t.from !== a && t.to !== a) continue; fresco.set(t.tx + '|' + t.from + '|' + t.to + '|' + t.sim, t); }
      const guardado = new Map(); for (const e of [...(r.ent || []).map(x => ({ ...x, from: x.de, to: a })), ...(r.sal || []).map(x => ({ ...x, from: a, to: x.a }))]) { if (e.at > TFOTO || e.at < desde) continue; guardado.set(e.tx + '|' + e.from + '|' + e.to + '|' + e.sim, e); }
      let ig = 0, sg = 0, sf = 0, im = 0, interna = 0;
      for (const [k, e] of guardado) { const t = fresco.get(k); if (!t) { sg++; if (e.flujo && e.flujo !== 'nativo' && e.flujo !== 'trc20') interna++; else faltan.push({ a, k: k.slice(0, 20), flujo: e.flujo, v: e.v }); continue; } if (Math.abs(t.cant - e.cant) > 0.01) im++; else ig++; }
      for (const k of fresco.keys()) if (!guardado.has(k)) { sf++; const t = fresco.get(k); faltan.push({ a, solo: 'TronScan', tx: t.tx.slice(0, 12), sim: t.sim, v: Math.round(t.v), at: new Date(t.at).toISOString().slice(5, 16) }); }
      tot.billeteras++; tot.aristasGuardadas += guardado.size; tot.aristasTronScan += fresco.size; tot.iguales += ig; tot.soloGuardada += sg; tot.soloTronScan += sf; tot.importeDistinto += im; tot.internasSoloGuardada += interna;
      detalle.push({ tramo, a, guardadas: guardado.size, tronscan: fresco.size, iguales: ig, soloGuardada: sg, soloTronScan: sf, importeDistinto: im });
      if (tot.billeteras % 10 === 0) console.log('   …', tot.billeteras, 'billeteras |', Math.round((Date.now() - t0) / 1000), 's');
    }
    R.lector = { tot, detalle, discrepancias: faltan.slice(0, 80) };
    console.log('   billeteras auditadas:', tot.billeteras, '| no auditadas (lectura incompleta):', tot.noAuditadas);
    console.log('   aristas ≥350 $ hasta la foto: guardadas', tot.aristasGuardadas, '| TronScan', tot.aristasTronScan, '| iguales (misma tx, de, a, importe)', tot.iguales, '| importe distinto', tot.importeDistinto);
    console.log('   solo en lo guardado:', tot.soloGuardada, '(de ellas internas de contrato, que /api/transfer no lista:', tot.internasSoloGuardada + ')', '| solo en TronScan (el rastreo no las tiene):', tot.soloTronScan);
    for (const x of faltan.slice(0, 25)) console.log('     ', JSON.stringify(x));
  }
  fs.writeFileSync(D + 'auditoria-lector.json', JSON.stringify({ generado: new Date().toISOString(), minutos: +((Date.now() - t0) / 60000).toFixed(1), ...R }, null, 1));
  console.log('\nlisto en', Math.round((Date.now() - t0) / 1000), 's');
})().catch(e => { console.error('ERROR', e.stack); process.exit(1); });
