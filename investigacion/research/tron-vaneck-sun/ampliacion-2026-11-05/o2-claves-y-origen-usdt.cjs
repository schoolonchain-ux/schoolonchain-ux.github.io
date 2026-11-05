'use strict';
// LÍNEA B · O2 — Seguimiento de O1: (a) quién alimenta de USDT a TFSd14UQ… (la «recolectora» que paga a la proveedora) con el reparto completo por origen;
// (b) las OTRAS llaves de los dos multifirma (la pareja TSzSgxRi… y TWPpxPd5…): ¿existen como cuentas?, ¿qué son?, ¿aparecen en el historial de la proveedora?;
// (c) quién activó la proveedora y quiénes son sus primeras contrapartes; (d) etiquetas de los grandes orígenes de la pareja.
// SOLO LECTURA. Reproducible: REPRODUCIR=1 node o2-claves-y-origen-usdt.cjs
const fs = require('node:fs'), path = require('node:path'), readline = require('node:readline'); const L = require('./lib.cjs'); const C = require('./cadena.cjs'); L.usar('o2-2026-11-05');
const D = path.join(__dirname, 'b-proveedora'); const TS = 'https://apilist.tronscanapi.com/api'; const TG = 'https://api.trongrid.io'; const M = x => Math.round(x * 100) / 100; const iso = C.iso; const ANCLA = 1793870328000; const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const PROV = 'TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2', COLEC = 'TFSd14UQUp6HPamdMGJsWBxfWKMrLYxRmp'; const O1 = JSON.parse(fs.readFileSync(path.join(D, 'dueno-proveedora.json'), 'utf8'));
const info = async a => { const t = await L.get(TS + '/accountv2?address=' + a).catch(() => ({})); return { etiqueta: t.publicTag || t.addressTag || null, creada: t.date_created ? iso(t.date_created) : null, operaciones: t.totalTransactionCount != null ? t.totalTransactionCount : null, balance_trx: t.balance != null ? M(t.balance / 1e6) : null }; };
(async () => {
  // (a)
  const tk = await C.trc20Cuenta(COLEC, { hasta: ANCLA, contrato: USDT }); const por = {}; let totalIn = 0, totalOut = 0, nIn = 0, nOut = 0; for (const r of tk.filas) { if (r.a === COLEC) { const o = por[r.de] = por[r.de] || { usdt: 0, n: 0, primera: r.t, ultima: r.t }; o.usdt += r.cantidad; o.n++; o.ultima = Math.max(o.ultima, r.t); totalIn += r.cantidad; nIn++; } else { totalOut += r.cantidad; nOut++; } }
  const orden = Object.entries(por).sort((a, b) => b[1].usdt - a[1].usdt); const origenes = []; let bin = 0, otros = 0;
  for (const [c, v] of orden) { const i = orden.indexOf(orden.find(x => x[0] === c)) < 40 ? await info(c) : { etiqueta: null }; const esBin = /^Binance/i.test(i.etiqueta || ''); if (esBin) bin += v.usdt; else otros += v.usdt; if (origenes.length < 40) origenes.push({ cuenta: c, etiqueta: i.etiqueta, usdt: M(v.usdt), n: v.n, primera: iso(v.primera), ultima: iso(v.ultima) }); }
  const nBin = origenes.filter(o => /^Binance/i.test(o.etiqueta || '')).length; const colector = { entradas_n: nIn, salidas_n: nOut, origenes_con_etiqueta_Binance: nBin, origenes_sin_etiqueta_Binance: orden.length - nBin, transferencias_usdt_leidas: tk.filas.length, entra_total: M(totalIn), sale_total: M(totalOut), origenes_distintos: orden.length, de_cuentas_con_etiqueta_Binance_entre_las_40_mayores: M(bin), resto: M(otros), mayores_origenes: origenes };
  // (b) las otras llaves
  const llaves = new Set(); for (const a of ['TSzSgxRisS5VBXXDcAezTDvnPGi9CbsXvJ', 'TWPpxPd5PpU5FQk6F6F3HMN5VdufxnVA8K']) for (const k of O1.permisos[a].propietario.claves) if (k.clave !== a) llaves.add(k.clave);
  const dentro = {}; for (const k of llaves) dentro[k] = 0; for (const f of ['tx', 'trc20']) { const rl = readline.createInterface({ input: fs.createReadStream(path.join(D, 'datos', f + '.jsonl')), crlfDelay: Infinity }); for await (const l of rl) { if (!l) continue; for (const k of llaves) if (l.includes(k)) dentro[k]++; } }
  const detalle = []; for (const k of llaves) { const i = await info(k); const g = await L.post(TG + '/wallet/getaccount', { address: k, visible: true }).catch(() => ({})); detalle.push({ clave: k, ...i, existe_en_cadena: !!g.address, aparece_en_el_historial_de_la_proveedora: dentro[k] }); }
  // (c) activación de la proveedora
  const act = []; for (const a of ['TLaeRVedMLANJzVnZD8jkJAiQL3XwirQdS', 'TQ8CEdBYYtATdyedFbwLgz3xMKskNuN5J4']) act.push({ cuenta: a, ...(await info(a)) });
  // (d) grandes orígenes de la pareja
  const pareja = []; for (const a of [...new Set(O1.financiacion_de_vecinas_clave['TSzSgxRisS5VBXXDcAezTDvnPGi9CbsXvJ'].mayores_origenes_usdt.map(o => o.cuenta))]) { try { pareja.push({ cuenta: a, ...(await info(a)) }); } catch (e) { pareja.push({ cuenta: a, error: e.message }); } }
  const res = { recolectora_TFSd14UQ: colector, llaves_de_los_multifirma: detalle, activacion_de_la_proveedora: act, grandes_origenes_de_la_pareja: pareja };
  const h = L.guardar(path.join(D, 'claves-y-origen-usdt.json'), res);
  console.log('RECOLECTORA: transferencias', colector.transferencias_usdt_leidas, '| entra', M(totalIn / 1e6) + ' M | sale', M(totalOut / 1e6) + ' M | origenes', colector.origenes_distintos, '| de etiquetadas Binance (entre las 40 mayores)', M(bin / 1e6) + ' M | resto', M(otros / 1e6) + ' M'); for (const o of origenes.slice(0, 16)) console.log('  ', o.cuenta.slice(0, 10), (o.etiqueta || '-').padEnd(16), o.usdt, 'n', o.n, o.primera.slice(0, 10), '→', o.ultima.slice(0, 10));
  console.log('\nLLAVES DE LOS MULTIFIRMA:'); for (const d of detalle) console.log('  ', d.clave.slice(0, 10), 'existe', d.existe_en_cadena, '| etiqueta', d.etiqueta, '| creada', (d.creada || '-').slice(0, 10), '| ops', d.operaciones, '| en la proveedora:', d.aparece_en_el_historial_de_la_proveedora);
  console.log('\nACTIVACIÓN:'); for (const a of act) console.log('  ', a.cuenta.slice(0, 10), JSON.stringify(a)); console.log('PAREJA orígenes:'); for (const a of pareja) console.log('  ', a.cuenta.slice(0, 10), JSON.stringify(a)); console.log(h, 'llamadas', L.metricas.llamadas, 'red', L.metricas.red);
})().catch(e => { console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });
