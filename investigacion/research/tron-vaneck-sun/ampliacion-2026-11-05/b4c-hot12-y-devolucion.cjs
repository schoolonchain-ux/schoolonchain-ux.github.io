'use strict';
// LÍNEA B · B4c — ¿Qué pasó con los ~138 M de USDT en Binance-Hot 12 (TJTKCzQpsG…) y de dónde vino el USDT que la proveedora devolvió a TT2T17 el 3-nov (110 M)?
// 1) Binance-Hot 12: todas las transferencias de USDT >= 5 M entre el 2-nov 00:00 UTC y el ancla del expediente (entradas y salidas, con etiqueta de TronScan de la otra parte).
// 2) Proveedora: todas las salidas de USDT del 2-nov 09:34 al 3-nov 23:59 que NO van a la pareja TSzSgxRi (para ver el destino de los 2 M que no llegaron a TVpNiLp3Hh).
// SOLO LECTURA. Reproducible: REPRODUCIR=1 node b4c-hot12-y-devolucion.cjs
const fs = require('node:fs'), path = require('node:path'), readline = require('node:readline'); const L = require('./lib.cjs'); const C = require('./cadena.cjs'); L.usar('b4c-2026-11-05');
const D = path.join(__dirname, 'b-proveedora'); const M = x => Math.round(x * 100) / 100; const iso = C.iso; const TS = 'https://apilist.tronscanapi.com/api';
const HOT12 = 'TJTKCzQpsG19CSMYF9TPtxz6wSHPSyeKfa', PROV = 'TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2', USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; const DESDE = Date.parse('2026-11-02T00:00:00Z'), ANCLA = 1793870328000;
(async () => {
  const etiq = {}; const nombre = async a => { if (a in etiq) return etiq[a]; const t = await L.get(TS + '/accountv2?address=' + a).catch(() => ({})); return (etiq[a] = t.publicTag || t.addressTag || null); };
  const tk = await C.trc20Cuenta(HOT12, { desde: DESDE, hasta: ANCLA, contrato: USDT }); const grandes = tk.filas.filter(r => r.cantidad >= 5e6).sort((a, b) => a.t - b.t); const hot = [];
  for (const r of grandes) { const entra = r.a === HOT12; const o = entra ? r.de : r.a; hot.push({ t: iso(r.t), sentido: entra ? 'entra de' : 'sale a', otra: o, etiqueta: await nombre(o), usdt: M(r.cantidad), tx: r.tx }); }
  const sumIn = tk.filas.filter(r => r.a === HOT12).reduce((s, r) => s + r.cantidad, 0), sumOut = tk.filas.filter(r => r.de === HOT12).reduce((s, r) => s + r.cantidad, 0);
  const salidas = []; const rl = readline.createInterface({ input: fs.createReadStream(path.join(D, 'datos', 'trc20.jsonl')), crlfDelay: Infinity });
  for await (const l of rl) { if (!l) continue; const r = JSON.parse(l); if (r.s !== 'USDT' || r.de !== PROV || r.t < Date.parse('2026-11-02T09:34:00Z') || r.t > Date.parse('2026-11-03T23:59:59Z')) continue; salidas.push({ t: iso(r.t), a: r.a, usdt: M(Number(r.v) / 1e6), tx: r.tx }); }
  const res = { hot12: { desde: iso(DESDE), hasta: iso(ANCLA), paginas: tk.paginas, transferencias_usdt: tk.filas.length, entra_total: M(sumIn), sale_total: M(sumOut), de_5M_o_mas: hot }, proveedora_salidas_usdt_2_3_nov: salidas.sort((a, b) => a.t.localeCompare(b.t)) };
  const h = L.guardar(path.join(D, 'hot12-y-devolucion.json'), res);
  console.log('Hot 12 desde 2-nov: transferencias USDT', tk.filas.length, '| entra', M(sumIn / 1e6) + ' M | sale', M(sumOut / 1e6) + ' M | >=5M:', hot.length); for (const x of hot.filter(x => x.usdt >= 20e6 || /TVpNiL|TWhDfw/.test(x.otra))) console.log('  ', x.t, x.sentido.padEnd(9), x.otra.slice(0, 10), (x.etiqueta || '').slice(0, 22).padEnd(22), x.usdt);
  console.log('Salidas de USDT de la proveedora (2-nov 09:34 → 3-nov) :', salidas.length); for (const s of res.proveedora_salidas_usdt_2_3_nov.filter(s => s.usdt >= 1e6)) console.log('  ', s.t, s.a.slice(0, 10), s.usdt, s.tx.slice(0, 10)); console.log(h, 'llamadas', L.metricas.llamadas, 'red', L.metricas.red);
})().catch(e => { console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });
