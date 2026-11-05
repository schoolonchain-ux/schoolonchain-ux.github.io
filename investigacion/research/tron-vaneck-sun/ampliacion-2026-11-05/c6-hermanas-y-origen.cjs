'use strict';
// EXPEDIENTE TU3rMHyW… (3.ª parte). (1) La «desconocida» TKpiitwG… (100 M a TEF9ZV el 2-feb-2026) fue delegante de TU3rMHyW en 2024: ¿de dónde sacó los 100 M? y TWpMnUh9… (17,58 M ese mismo día).
// (2) El día 8-nov-2021 TTXeVETa… repartió ~5.460 M TRX en dos horas entre TPyjyZ, TM3sTVya y otras: ¿quién es TTXeVETa y de dónde sacó el dinero (TNCmcTdy…)? (3) Todo el reparto de esa jornada y lo que
// hacen hoy sus receptoras. (4) TLntW9Z5… (owner de 11 contratos, 896 M TRX): cambios de permisos y entradas grandes. SOLO LECTURA. Reproducible: REPRODUCIR=1 node c6-hermanas-y-origen.cjs
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); const C = require('./cadena.cjs');
L.usar('c6-2026-11-05'); const OUT = path.join(__dirname, 'c-tu3rmhyw'); const TG = 'https://api.trongrid.io', TS = 'https://apilist.tronscanapi.com/api'; const M = x => Math.round(x * 100) / 100;
const rd = (...p) => JSON.parse(fs.readFileSync(path.join(__dirname, ...p), 'utf8')); const tAncla = Date.parse(rd('linea-base', 'anclas.json').bloque_hora_utc);
const TKP = 'TKpiitwGUuW5WgsBMg5w5QWUpC6nUTroqa', TWP = 'TWpMnUh9pZS1Mf8yyw9WPiS82WYevKzQo2', TTX = 'TTXeVETaU1wSV9cYutUgyg7x1gtrfCiDiW', TNC = 'TNCmcTdyrYKMtmE1KU2itzeCX76jGm5Not', TLN = 'TLntW9Z59LYY5KEi9cmwk3PKjQga828ird', TPY = 'TPyjyZfsYaXStgz2NmAraF1uZcMtkgNan5';
async function tag(a) { const t = await L.get(TS + '/accountv2?address=' + a).catch(() => ({})); return { etiqueta: t.publicTag || t.addressTag || null, n_tx: t.totalTransactionCount || null, creada: t.date_created ? new Date(t.date_created).toISOString().slice(0, 10) : null }; }
async function flujos(dir, min, max) { const w = await C.txCuenta(dir, { desde: 0, hasta: tAncla, maxPaginas: max || 60 }); return { lectura: { filas: w.filas.length, paginas: w.paginas, parcial: w.truncado }, grandes: w.filas.filter(f => f.tipo === 'Transfer' && f.ok && f.trx >= min).map(f => ({ t: C.iso(f.t), de: f.de, a: f.a, trx: M(f.trx), tx: f.tx })), permisos: w.filas.filter(f => f.tipo === 'AccountPermissionUpdate').length, tipos: w.filas.reduce((o, f) => { o[f.tipo] = (o[f.tipo] || 0) + 1; return o; }, {}) }; }
(async () => {
  const res = {};
  // (1)
  res.TKpiitwG = { ...(await tag(TKP)), ...(await flujos(TKP, 1e6)) }; res.TWpMnUh9 = { ...(await tag(TWP)), ...(await flujos(TWP, 1e6)) };
  // (2) TTXeVETa, su origen y el reparto del 8-nov-2021
  res.TNCmcTdy = await tag(TNC); res.TTXeVETa = { ...(await tag(TTX)), ...(await flujos(TTX, 10e6)) };
  const reparto = res.TTXeVETa.grandes.filter(g => g.de === TTX && g.t.startsWith('2021-11-08')); const receptoras = []; const vistos = new Set();
  for (const g of reparto) { if (vistos.has(g.a)) continue; vistos.add(g.a); const a = await L.post(TG + '/wallet/getaccount', { address: g.a, visible: true }); const t = await tag(g.a); const recibido = reparto.filter(x => x.a === g.a).reduce((s, x) => s + x.trx, 0); receptoras.push({ cuenta: g.a, recibio_el_8nov2021: M(recibido), etiqueta: t.etiqueta, creada: t.creada, n_tx: t.n_tx, trx_libre_hoy: M((a.balance || 0) / 1e6), congelado_hoy: M((a.frozenV2 || []).reduce((s, f) => s + (f.amount || 0), 0) / 1e6) }); }
  res.reparto_8nov2021 = { desde: reparto[0] && reparto[0].t, hasta: reparto[reparto.length - 1] && reparto[reparto.length - 1].t, total_trx: M(reparto.reduce((s, g) => s + g.trx, 0)), receptoras };
  // (4) TLntW9Z5: permisos, entradas grandes
  res.TLntW9Z5 = { ...(await tag(TLN)), ...(await flujos(TLN, 20e6)) };
  const h = L.guardar(path.join(OUT, 'hermanas-y-origen.json'), res);
  const cp = x => x.grandes.map(g => g.t.slice(0, 10) + ' ' + g.de.slice(0, 8) + '→' + g.a.slice(0, 8) + ' ' + M(g.trx / 1e6) + 'M').join(' | ') || '—';
  console.log('TKpiitwG:', res.TKpiitwG.etiqueta, 'creada', res.TKpiitwG.creada, 'tx', res.TKpiitwG.n_tx, JSON.stringify(res.TKpiitwG.tipos), '\n   ≥1M:', cp(res.TKpiitwG));
  console.log('TWpMnUh9:', res.TWpMnUh9.etiqueta, 'creada', res.TWpMnUh9.creada, 'tx', res.TWpMnUh9.n_tx, '\n   ≥1M:', cp(res.TWpMnUh9));
  console.log('TNCmcTdy (origen de TTXeVETa):', JSON.stringify(res.TNCmcTdy)); console.log('TTXeVETa:', res.TTXeVETa.etiqueta, 'creada', res.TTXeVETa.creada, 'tx', res.TTXeVETa.n_tx, '\n   ≥10M:', cp(res.TTXeVETa));
  console.log('Reparto 8-nov-2021:', res.reparto_8nov2021.desde, '→', res.reparto_8nov2021.hasta, 'total', res.reparto_8nov2021.total_trx.toLocaleString('es-ES')); for (const r of receptoras) console.log('  ', r.cuenta, M(r.recibio_el_8nov2021 / 1e6) + 'M | creada', r.creada, '| tx', r.n_tx, '| libre hoy', M(r.trx_libre_hoy / 1e6) + 'M | congelado', M(r.congelado_hoy / 1e6) + 'M');
  console.log('TLntW9Z5:', res.TLntW9Z5.etiqueta, 'creada', res.TLntW9Z5.creada, 'tx', res.TLntW9Z5.n_tx, 'cambios de permisos', res.TLntW9Z5.permisos, JSON.stringify(res.TLntW9Z5.tipos), '\n   ≥20M:', cp(res.TLntW9Z5)); console.log(h, 'llamadas', L.metricas.llamadas, 'red', L.metricas.red);
})().catch(e => { console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });
