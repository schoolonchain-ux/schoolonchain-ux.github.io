'use strict';
// LÍNEA B · B4b — La cadena de los ~138 M de USDT del 2-nov: TCFfQYygyf… (60 M) y TKV6xqB7VP… (80 M) → proveedora → TVpNiLp3Hh… → Binance-Hot 12.
// Lee el historial COMPLETO (son cuentas de 8 a 12 operaciones, creadas el 2-nov) de las tres cuentas nuevas: de dónde les llega el dinero y a dónde va. SOLO LECTURA.
// Reproducible: REPRODUCIR=1 node b4b-cadena-138m.cjs
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); const C = require('./cadena.cjs'); L.usar('b4b-2026-11-05');
const D = path.join(__dirname, 'b-proveedora'); const M = x => Math.round(x * 100) / 100; const iso = C.iso;
const TS = 'https://apilist.tronscanapi.com/api'; const ANCLA = 1793870328000; /* 5-nov 09:18:48 UTC: el corte fijo del expediente; sin él la URL cambiaría en cada lectura y no se podría repetir */
const CUENTAS = { TCFfQYygyf: 'TCFfQYygyfTTYE8So6wQbpNk7BEMomJH9J', TKV6xqB7VP: 'TKV6xqB7VPTThF3Ru8VrNh7QQLVReTNvuV', TVpNiLp3Hh: 'TVpNiLp3HhhDJHc7eBsqXeZFvqWdPfzCEt' };
const BIN = new Set(); for (const x of Object.values(JSON.parse(fs.readFileSync(path.join(__dirname, 'a2-a4-a5', 'receptores-81.json'), 'utf8')))) if (/Binance/i.test(x.etiqueta || '')) BIN.add(x.receptor); for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'vigilante-energia-binance', 'config', 'conocidas.json'), 'utf8')).nombres)) if (/^Binance/i.test(typeof v === 'string' ? v : JSON.stringify(v))) BIN.add(k);
for (const a of JSON.parse(fs.readFileSync(path.join(__dirname, 'a0-binance', 'lista-binance.json'), 'utf8')).direcciones) BIN.add(a); /* lista ampliada (A0) */
(async () => {
  const res = {}; const etiq = {};
  const nombre = async a => { if (a in etiq) return etiq[a]; if (BIN.has(a)) return (etiq[a] = 'Binance (lista conocida)'); const t = await L.get(TS + '/accountv2?address=' + a).catch(() => ({})); return (etiq[a] = t.publicTag || t.addressTag || null); };
  for (const [corto, a] of Object.entries(CUENTAS)) {
    const tk = await C.trc20Cuenta(a, { hasta: ANCLA }); const tx = await C.txCuenta(a, { hasta: ANCLA }); const filas = [];
    for (const r of tk.filas) { const entra = r.a === a; const o = entra ? r.de : r.a; filas.push({ t: iso(r.t), sentido: entra ? 'entra de' : 'sale a', otra: o, etiqueta: await nombre(o), moneda: r.simbolo, cantidad: M(r.cantidad), tx: r.tx }); }
    for (const r of tx.filas) { const otra = r.de === a ? (r.a || null) : r.de; filas.push({ t: iso(r.t), sentido: r.de === a ? 'ejecuta ' + r.tipo : 'recibe ' + r.tipo, otra, etiqueta: otra ? await nombre(otra) : null, moneda: 'TRX', cantidad: r.trx != null ? M(r.trx) : null, ok: r.ok, tx: r.tx }); }
    filas.sort((x, y) => x.t.localeCompare(y.t)); res[a] = { corto, operaciones_trc20: tk.filas.length, operaciones_tx: tx.filas.length, filas };
    console.log('\n' + corto, 'trc20', tk.filas.length, 'tx', tx.filas.length); for (const f of filas) console.log('  ', f.t, f.sentido.padEnd(18), (f.otra || '-').slice(0, 10), (f.etiqueta || '').slice(0, 24).padEnd(24), f.moneda, f.cantidad, f.tx.slice(0, 10));
  }
  const h = L.guardar(path.join(D, 'cadena-138m.json'), res); console.log(h, 'llamadas', L.metricas.llamadas, 'red', L.metricas.red);
})().catch(e => { console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });
