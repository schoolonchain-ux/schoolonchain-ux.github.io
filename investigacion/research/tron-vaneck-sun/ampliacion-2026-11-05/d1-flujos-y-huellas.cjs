'use strict';
// LÍNEA D · D1-D3 — Las cuentas del caso, de dos en dos, con su historial COMPLETO hasta el corte del expediente (5-nov 09:18:48 UTC):
//  D2: matriz de flujos dirigidos entre ellas (TRX, USDT, energía delegada), con primera y última fecha;
//  D3: huellas por cuenta (alta, primer ingreso, estructura de claves, votos a representantes, horas de actividad, «1 TRX menos»). Cada huella es DÉBIL y no suma.
//  D1: los primeros ingresos de cada cuenta (de dónde nace cada una).
// SOLO LECTURA. Reproducible: REPRODUCIR=1 node d1-flujos-y-huellas.cjs
const fs = require('node:fs'), path = require('node:path'), readline = require('node:readline'); const L = require('./lib.cjs'); const C = require('./cadena.cjs'); L.usar('d1-2026-11-05');
const OUT = path.join(__dirname, 'd-historia'); fs.mkdirSync(OUT, { recursive: true }); const D = path.join(__dirname, 'b-proveedora'); const TG = 'https://api.trongrid.io'; const M = x => Math.round(x * 100) / 100; const iso = C.iso; const ANCLA = 1793870328000; const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const CUENTAS = { TT2T17: 'TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N', TEF9ZV: 'TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B', TPyjyZ: 'TPyjyZfsYaXStgz2NmAraF1uZcMtkgNan5', TQwh1ZDB: 'TQwh1ZDBdqMKDtGWEeDdrRUUbtgaVL1Se2', TYL7z7VS: 'TYL7z7VSVRShLoJ6YRQMA4t9pSECt9ZLmz', TKpiitwG: 'TKpiitwGUuW5WgsBMg5w5QWUpC6nUTroqa', TWpMnUh9: 'TWpMnUh9pZS1Mf8yyw9WPiS82WYevKzQo2', TScVwVTj: 'TScVwVTjqoqPEJ6atnvGCtErWnCyNbzmUL', TM3sTVya: 'TM3sTVyahiGWYktKg8G6miHpTzRurKDt7b', TJNtFduS: 'TJNtFduS4oebw3jgGKCYmgSpTdyPieb6Ha', TU32XvjD: 'TU32XvjDNkxEkqxCgQQWEKmoMxTz8NECUV', TRzQrtxr: 'TRzQrtxrEJbSbQNwAsgAHkBMxTX47yNmjo', TLbkcH7Q: 'TLbkcH7QLcULY8dpPAbD9EYGLUWKbeRxuB', TFKSWmnR: 'TFKSWmnRJkzCfWUr56DQ1zqGCxZLW9dKSv', TPhGmczy: 'TPhGmczy3wkUGafFT8QMXPLN2rzdxeChME', TCGVFGDd: 'TCGVFGDd62LSrfZEaz3M3fYifWWdSDHRL8', TU3rMHyW: 'TU3rMHyWHzeEJBReWLzHko728hbz6MtfNg', TUTtLtGj: 'TUTtLtGjXWqkTAow7jj7oMhTGLe9XB9YMA' };
const PROV = 'TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2'; const corto = Object.fromEntries(Object.entries(CUENTAS).map(([k, v]) => [v, k])); corto[PROV] = 'PROVEEDORA';
const sumar = (m, k, v, t) => { const o = m[k] = m[k] || { total: 0, n: 0, primera: t, ultima: t }; o.total += v; o.n++; o.primera = Math.min(o.primera, t); o.ultima = Math.max(o.ultima, t); };
(async () => {
  const flujos = { TRX: {}, USDT: {}, energia_delegada_TRX: {} }; const huellas = {}; const nodos = Object.values(CUENTAS);
  for (const [k, a] of Object.entries(CUENTAS)) {
    const tx = await C.txCuenta(a, { hasta: ANCLA }); const tk = await C.trc20Cuenta(a, { hasta: ANCLA, contrato: USDT });
    const acc = await L.post(TG + '/wallet/getaccount', { address: a, visible: true }).catch(() => ({}));
    const hrs = new Array(24).fill(0); let salidas = 0, menosUno = 0, primeraEntrada = null, activacion = null, redondas = 0;
    for (const r of tx.filas) { if (!r.ok) continue;
      if (r.tipo === 'Transfer') { const par = r.de === a ? r.a : r.de; if (nodos.includes(par) && par !== a) { const clave = (r.de === a ? k + '→' + corto[par] : corto[par] + '→' + k); if (r.de === a) sumar(flujos.TRX, clave, r.trx, r.t); }
        if (r.a === a && !primeraEntrada) primeraEntrada = { t: iso(r.t), de: r.de, trx: r.trx }; if (r.a === a && r.trx >= 1 && !activacion) activacion = { t: iso(r.t), de: r.de, trx: r.trx };
        if (r.de === a) { salidas++; hrs[new Date(r.t).getUTCHours()]++; if (r.trx >= 1e6 && Math.abs((r.trx + 1) % 1e6) < 1e-6) menosUno++; if (r.trx >= 1e6 && r.trx % 1e6 === 0) redondas++; } }
      else if (r.tipo === 'DelegateResource' && r.de === a && r.recurso === 'ENERGY' && nodos.includes(r.a)) sumar(flujos.energia_delegada_TRX, k + '→' + corto[r.a], r.trx, r.t); }
    for (const r of tk.filas) { if (r.de === a && nodos.includes(r.a)) sumar(flujos.USDT, k + '→' + corto[r.a], r.cantidad, r.t); }
    const own = acc.owner_permission; const votos = (acc.votes || []).map(v => ({ para: v.vote_address, n: v.vote_count }));
    const top = hrs.map((n, h) => [h, n]).sort((x, y) => y[1] - x[1]).slice(0, 3).map(x => x[0]);
    huellas[k] = { direccion: a, tx_leidas: tx.filas.length, tx_truncada: !!tx.truncado, usdt_leidas: tk.filas.length, creada: acc.create_time ? iso(acc.create_time) : null, primera_entrada_de_TRX: primeraEntrada, primera_entrada_de_1_TRX_o_mas: activacion, claves: own ? { umbral: own.threshold, n_claves: (own.keys || []).length, propias_solo: (own.keys || []).length === 1 && own.keys[0].address === a } : 'sin permiso explícito', votos, salidas_de_TRX: salidas, horas_UTC_con_mas_salidas: top, salidas_de_1M_o_mas_redondas: redondas, salidas_de_1M_o_mas_con_1_TRX_menos: menosUno };
    console.log(k.padEnd(9), 'tx', String(tx.filas.length).padStart(5), 'usdt', String(tk.filas.length).padStart(5), '| 1.ª entrada', primeraEntrada ? primeraEntrada.t.slice(0, 10) + ' ' + corto[primeraEntrada.de] + '/' + primeraEntrada.de.slice(0, 6) + ' ' + primeraEntrada.trx : '-', '| claves', JSON.stringify(huellas[k].claves), '| votos', votos.map(v => v.para.slice(0, 6)).join(','), '| horas', top.join('/'), '| -1TRX', menosUno + '/' + redondas);
  }
  // Flujos con la proveedora desde sus datos compactos (en ambos sentidos)
  for (const f of ['tx', 'trc20']) { const rl = readline.createInterface({ input: fs.createReadStream(path.join(D, 'datos', f + '.jsonl')), crlfDelay: Infinity }); for await (const l of rl) { if (!l) continue; const r = JSON.parse(l); const otro = r.a === PROV ? r.de : r.a; if (!corto[otro] || otro === PROV) continue; const k1 = r.a === PROV ? corto[otro] + '→PROVEEDORA' : 'PROVEEDORA→' + corto[otro]; if (f === 'tx') sumar(flujos.TRX, k1, r.sun / 1e6, r.t); else if (r.s === 'USDT') sumar(flujos.USDT, k1, Number(r.v) / Math.pow(10, Number(r.d) || 0), r.t); } }
  const fmt = o => Object.fromEntries(Object.entries(o).sort((x, y) => y[1].total - x[1].total).map(([k, v]) => [k, { total: M(v.total), n: v.n, primera: iso(v.primera).slice(0, 10), ultima: iso(v.ultima).slice(0, 10) }]));
  const res = { corte: iso(ANCLA), flujos_dirigidos_entre_cuentas_del_caso: { TRX: fmt(flujos.TRX), USDT: fmt(flujos.USDT), energia_delegada_TRX: fmt(flujos.energia_delegada_TRX) }, huellas_por_cuenta: huellas, aviso: 'Las huellas (hora, «1 TRX menos», forma de alta, votos) son DÉBILES: nunca bastan solas para afirmar control común.' };
  const h = L.guardar(path.join(OUT, 'flujos-y-huellas.json'), res);
  for (const [t, o] of Object.entries(res.flujos_dirigidos_entre_cuentas_del_caso)) { console.log('\n' + t + ' (≥ 1 M):'); for (const [k, v] of Object.entries(o).filter(([, v]) => v.total >= 1e6).slice(0, 40)) console.log('  ', k.padEnd(24), String(Math.round(v.total / 1e6)).padStart(6) + ' M', 'n', String(v.n).padStart(4), v.primera, '→', v.ultima); }
  console.log(h, 'llamadas', L.metricas.llamadas, 'red', L.metricas.red);
})().catch(e => { console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });
