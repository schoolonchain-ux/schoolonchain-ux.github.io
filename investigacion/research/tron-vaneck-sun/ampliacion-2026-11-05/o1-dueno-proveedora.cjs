'use strict';
// LÍNEA B · O1 — ¿Quién es el dueño de la proveedora TWhDfwC8…? Tres pruebas, de más a menos fuertes:
// 1) CLAVES: permisos (propietario y activos) de la proveedora y de sus vecinas grandes; ¿comparten alguna clave? (prueba fuerte de control común)
// 2) ACTIVACIÓN y primeros pasos: quién la creó y de dónde vinieron sus primeras entradas (de b-proveedora/datos).
// 3) FINANCIACIÓN de las vecinas clave (pareja TSzSgxRi…, TFSd14UQ…, TNXpb7aB…): primeras entradas de cada una (lectura completa si tienen < 3.000 operaciones).
// SOLO LECTURA. Reproducible: REPRODUCIR=1 node o1-dueno-proveedora.cjs
const fs = require('node:fs'), path = require('node:path'), readline = require('node:readline'); const L = require('./lib.cjs'); const C = require('./cadena.cjs'); const b58 = require('./b58.cjs'); L.usar('o1-2026-11-05');
const D = path.join(__dirname, 'b-proveedora'); const TG = 'https://api.trongrid.io', TS = 'https://apilist.tronscanapi.com/api'; const M = x => Math.round(x * 100) / 100; const iso = C.iso; const ANCLA = 1793870328000;
const PROV = 'TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2';
const VEC = JSON.parse(fs.readFileSync(path.join(D, 'vecinas-proveedora.json'), 'utf8')).cuentas.map(c => c.cuenta);
const EXTRA = ['TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N', 'TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B', 'TVpNiLp3HhhDJHc7eBsqXeZFvqWdPfzCEt', 'TJHKNV4Jwmk7YQht2LFrkQZd9pzvSuN543', 'TFaboiG8EBqZUoiSTz4ZcwkpJUE7f5YMWx', 'TQRBxpS5V1KZW8g3oJ1YNLqtj1j733Mc33', 'TNQKXEB7ExvxGXoE2gue2w42q2bscTGwGH'];
const CUENTAS = [...new Set([PROV, ...VEC, ...EXTRA])];
const claves = p => (p ? (p.keys || []).map(k => ({ clave: typeof k.address === 'string' && k.address.startsWith('T') ? k.address : (k.address ? b58(k.address) : null), peso: k.weight })) : []);
(async () => {
  const perm = {};
  for (const a of CUENTAS) {
    const r = await L.post(TG + '/wallet/getaccount', { address: a, visible: true }).catch(() => ({}));
    const own = r.owner_permission, act = r.active_permission || [];
    perm[a] = { creada: r.create_time ? iso(r.create_time) : null, existe: !!r.address, propietario: own ? { umbral: own.threshold, claves: claves(own) } : { nota: 'sin permiso explícito: la única clave es la propia cuenta' }, activos: act.map(p => ({ nombre: p.permission_name, umbral: p.threshold, claves: claves(p) })), }; }
  // ¿Qué claves se repiten entre cuentas distintas (excluyendo la propia dirección de la cuenta)?
  const porClave = {}; for (const [a, p] of Object.entries(perm)) { const todas = [...(p.propietario.claves || []), ...p.activos.flatMap(x => x.claves)]; for (const k of todas) { if (!k.clave || k.clave === a) continue; (porClave[k.clave] = porClave[k.clave] || new Set()).add(a); } }
  const compartidas = Object.entries(porClave).filter(([, s]) => s.size > 1).map(([k, s]) => ({ clave: k, cuentas: [...s] }));
  const cambiadas = Object.entries(perm).filter(([a, p]) => p.propietario.claves && p.propietario.claves.length && !(p.propietario.claves.length === 1 && p.propietario.claves[0].clave === a)).map(([a, p]) => ({ cuenta: a, propietario: p.propietario, activos: p.activos }));
  // 2) Primeras filas de la proveedora
  const primeras = { tx: [], trc20: [] }; for (const f of ['tx', 'trc20']) { const rl = readline.createInterface({ input: fs.createReadStream(path.join(D, 'datos', f + '.jsonl')), crlfDelay: Infinity }); for await (const l of rl) { if (!l) continue; const r = JSON.parse(l); primeras[f].push(f === 'tx' ? { t: iso(r.t), sentido: r.a === PROV ? 'sale a' : 'entra de', otra: r.a === PROV ? r.a : r.de, trx: r.sun / 1e6, tx: r.tx } : { t: iso(r.t), sentido: r.a === PROV ? 'entra de' : 'sale a', otra: r.a === PROV ? r.de : r.a, moneda: r.s, cantidad: Number(r.v) / Math.pow(10, Number(r.d) || 0), tx: r.tx }); if (primeras[f].length >= 25) break; } }
  for (const x of primeras.tx) x.otra = x.sentido === 'entra de' ? x.otra : x.otra; // (el sentido ya indica la dirección)
  // 3) Historial completo de las vecinas clave pequeñas: quién las financia
  const nombre = async a => { const t = await L.get(TS + '/accountv2?address=' + a).catch(() => ({})); return t.publicTag || t.addressTag || null; };
  const CLAVE = ['TSzSgxRisS5VBXXDcAezTDvnPGi9CbsXvJ', 'TFSd14UQUp6HPamdMGJsWBxfWKMrLYxRmp', 'TNXpb7aBoxow5X9drTskkjSo1mgKpNFnD1'];
  const fin = {};
  for (const a of CLAVE) { const tx = await C.txCuenta(a, { hasta: ANCLA, maxPaginas: 15 }); const tk = await C.trc20Cuenta(a, { hasta: ANCLA, contrato: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' }); /* USDT: puede ser largo */
    const entradas = {}; for (const r of tx.filas) if (r.tipo === 'Transfer' && r.ok && r.a === a) { const o = entradas[r.de] = entradas[r.de] || { trx: 0, n: 0, primera: r.t }; o.trx += r.trx; o.n++; }
    const usdt = {}; for (const r of tk.filas) if (r.a === a) { const o = usdt[r.de] = usdt[r.de] || { usdt: 0, n: 0, primera: r.t }; o.usdt += r.cantidad; o.n++; }
    const top = x => Object.entries(x).sort((p, q) => (q[1].trx || q[1].usdt) - (p[1].trx || p[1].usdt)).slice(0, 8);
    const primeraFila = tx.filas[0]; fin[a] = { primeras_filas_tx: tx.filas.slice(0, 6).map(r => ({ t: iso(r.t), tipo: r.tipo, de: r.de, a: r.a, trx: r.trx })), tx_leidas: tx.filas.length, tx_truncada: tx.truncado, usdt_filas: tk.filas.length, mayores_origenes_trx: await Promise.all(top(entradas).map(async ([c, v]) => ({ cuenta: c, etiqueta: await nombre(c), trx: M(v.trx), n: v.n, primera: iso(v.primera) }))), mayores_origenes_usdt: await Promise.all(top(usdt).map(async ([c, v]) => ({ cuenta: c, etiqueta: await nombre(c), usdt: M(v.usdt), n: v.n, primera: iso(v.primera) }))) }; }
  const res = { permisos: perm, claves_compartidas_entre_cuentas: compartidas, cuentas_con_clave_distinta_de_si_mismas: cambiadas, primeras_filas_proveedora: primeras, financiacion_de_vecinas_clave: fin };
  const h = L.guardar(path.join(D, 'dueno-proveedora.json'), res);
  console.log('Cuentas con permisos leídos:', Object.keys(perm).length, '| con clave distinta de sí mismas:', cambiadas.length, '| claves COMPARTIDAS entre cuentas:', compartidas.length); for (const c of compartidas) console.log('  compartida', c.clave.slice(0, 10), '→', c.cuentas.map(x => x.slice(0, 8)).join(', ')); for (const c of cambiadas) console.log('  clave ajena', c.cuenta.slice(0, 10), JSON.stringify(c.propietario).slice(0, 160));
  console.log('Proveedora creada', perm[PROV].creada); console.log('Primeras filas TRX:'); for (const x of primeras.tx.slice(0, 8)) console.log('  ', x.t, x.sentido, x.otra, x.trx, x.tx.slice(0, 10)); console.log('Primeras filas TRC-20:'); for (const x of primeras.trc20.slice(0, 5)) console.log('  ', x.t, x.sentido, x.otra, x.moneda, x.cantidad);
  for (const [a, f] of Object.entries(fin)) { console.log('\n' + a.slice(0, 10), 'primeras:', f.primeras_filas_tx.slice(0, 3).map(r => r.t.slice(0, 16) + ' ' + r.tipo + ' ' + (r.de || '').slice(0, 8) + '→' + (r.a || '').slice(0, 8) + ' ' + r.trx).join(' | ')); console.log('   TRX de:', f.mayores_origenes_trx.map(o => o.cuenta.slice(0, 8) + (o.etiqueta ? '(' + o.etiqueta + ')' : '') + ' ' + o.trx).join(', ')); console.log('   USDT de:', f.mayores_origenes_usdt.map(o => o.cuenta.slice(0, 8) + (o.etiqueta ? '(' + o.etiqueta + ')' : '') + ' ' + M(o.usdt / 1e6) + 'M').join(', ')); }
  console.log(h, 'llamadas', L.metricas.llamadas, 'red', L.metricas.red);
})().catch(e => { console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });
