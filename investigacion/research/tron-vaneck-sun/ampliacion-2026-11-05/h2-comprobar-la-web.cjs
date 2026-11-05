'use strict';
// LÍNEA H · H2 — Comprobación automática del borrador de la página «caso-vaneck» (copia de trabajo de la web) ANTES de publicar.
// (1) Toda dirección TRON que aparece en el borrador (JS, datos y nota pública) debe ser válida (base58check) y salir de algún dato nuestro (resultados o datos ya publicados): una dirección inventada o con una letra cambiada falla.
// (2) Las cifras escritas a mano en el texto se cruzan con los resultados guardados. (3) Los hashes de transacción tienen 64 hex. SOLO LECTURA. Uso: node h2-comprobar-la-web.cjs [carpeta-borrador]
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const WEB = process.argv[2] || 'C:/EquipoIA/web-publicador/borrador'; const RES = __dirname; const rd = (...p) => JSON.parse(fs.readFileSync(path.join(RES, ...p), 'utf8'));
const AL = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'; const sha = b => crypto.createHash('sha256').update(b).digest();
function valida(a) { let n = 0n; for (const c of a) { const i = AL.indexOf(c); if (i < 0) return false; n = n * 58n + BigInt(i); } let h = n.toString(16); if (h.length % 2) h = '0' + h; const b = Buffer.from(h.padStart(50, '0'), 'hex'); if (b.length !== 25 || b[0] !== 0x41) return false; return sha(sha(b.subarray(0, 21))).subarray(0, 4).equals(b.subarray(21)); }
const fallos = [], avisos = []; const ok = (c, m) => { if (!c) fallos.push(m); };
// ---- (1) direcciones
const ARCHIVOS = ['assets/caso-vaneck.js', 'reports/caso-vaneck-sun/energia.json', 'investigacion/docs/articulos/NOTA-AMPLIACION-VANECK-SUN-2026-11-05.md'].map(f => path.join(WEB, f)).filter(f => fs.existsSync(f));
const re = /\bT[1-9A-HJ-NP-Za-km-z]{33}\b/g; const usadas = new Map();
for (const f of ARCHIVOS) for (const m of fs.readFileSync(f, 'utf8').matchAll(re)) { if (!usadas.has(m[0])) usadas.set(m[0], new Set()); usadas.get(m[0]).add(path.basename(f)); }
// fuentes de verdad: todos los JSON/JSONL de resultados (sin raw/ ni b-proveedora/datos), datos ya publicados de la web y el directorio de direcciones de la investigación original
const fuentes = []; const recorre = (d, filtra) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (filtra(p)) recorre(p, filtra); } else if (/\.(json|jsonl|md|txt|cjs)$/.test(e.name)) fuentes.push(p); } };
recorre(RES, p => !/[\\/](raw|datos|node_modules)$/.test(p)); for (const f of ['reports/caso-vaneck-sun/hechos.json', 'reports/caso-vaneck-sun/seguimiento.json', 'investigacion/docs/articulos/DIRECTORIO-DIRECCIONES-TRON-2026-10-29.md', 'investigacion/docs/INVESTIGACION-VANECK-SUN-TRX-2026-10-29.md']) if (fs.existsSync(path.join(WEB, f))) fuentes.push(path.join(WEB, f));
const corpus = fuentes.map(f => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } }).join('\n');
let invalidas = 0, sinFuente = 0; for (const [a, en] of usadas) { if (!valida(a)) { invalidas++; fallos.push('dirección con checksum inválido: ' + a + ' en ' + [...en].join(',')); } else if (!corpus.includes(a)) { sinFuente++; fallos.push('dirección válida pero que no sale de ningún dato nuestro: ' + a + ' en ' + [...en].join(',')); } }
// ---- (3) hashes
const hx = JSON.stringify(JSON.parse(fs.readFileSync(path.join(WEB, 'reports/caso-vaneck-sun/energia.json'), 'utf8'))); let hashes = 0; for (const m of hx.matchAll(/"tx":"([^"]*)"/g)) { hashes++; ok(/^[0-9a-f]{64}$/.test(m[1]), 'hash de transacción mal formado: ' + m[1]); }
// ---- (2) cifras escritas a mano en el texto (JS de la página)
const js = fs.readFileSync(path.join(WEB, 'assets/caso-vaneck.js'), 'utf8'); const tiene = (s, m) => ok(js.includes(s), 'el texto de la página ya no contiene «' + s + '» (' + m + ')');
const ap = rd('b-proveedora', 'analisis-proveedora.json'), g2 = rd('g-vinculos', 'proveedora-y-poloniex.json'), ct = rd('d-historia', 'contraste-de-terceros.json');
const M = (x, d) => (x / 1e6).toFixed(d);
const cmp = (txt, valor, d, msg) => { const v = M(valor, d).replace('.', ','); ok(String(txt).replace(/\./g, '').replace(',', '.') == v.replace(',', '.') || String(txt) === v, msg + ': texto «' + txt + '» frente a dato ' + v); };
// 22,2 M TRX a TRON Inc.
cmp('22,2', ap.ciclo.TRX_proveedora_a_TRON_Inc, 1, 'TRX de la proveedora a TRON Inc.'); tiene('22,2 M TRX', 'cifra de TRON Inc.');
// 9,25 M USDT de Binance a la proveedora
cmp('9,25', ap.ciclo.USDT_Binance_a_proveedora, 2, 'USDT de Binance a la proveedora'); tiene('9,25 M', 'USDT de Binance');
// 1,15 M USDT de la cuenta «Poloniex» a la proveedora
cmp('1,15', g2.flujos_NC_proveedora.USDT.NC_a_proveedora.total, 2, 'USDT de la cuenta Poloniex a la proveedora'); tiene('1,15 M USDT', 'cifra de Poloniex');
// 7.091 M USDT
ok(Math.round(ap.totales.USDT.in / 1e6) === 7091 && Math.round(ap.totales.USDT.out / 1e6) === 7091, 'los 7.091 M USDT de entrada y salida'); tiene('7.091 M', 'USDT que mueve la proveedora');
// 750 M TRX en tres envíos
ok(Math.round(ap.ciclo.TRX_proveedora_a_TEF9ZV / 1e6) === 750, '750 M TRX a la cuenta de energía'); tiene('750 M', 'relevo');
// 803,2 M a HTX 4 en 7 envíos (envíos de la segunda cuenta a billeteras puente cuyo primer destino es HTX 4)
const pu = rd('f0-3-pistas', 'envios-tt2t17-y-primer-reenvio.json'); const aHtx = pu.filter(x => x.primer_destino && x.primer_destino.a === 'TFTWNgDBkQ5wQoP8RXpRznnHvAVV8x5jLu'); const sumHtx = aHtx.reduce((s, x) => s + x.tt2t17_a_puente.trx, 0);
ok(aHtx.length === 7, 'se esperaban 7 envíos cuyo primer destino es HTX 4, hay ' + aHtx.length); ok(M(sumHtx, 1) === '803.2', 'suma a HTX 4 = ' + M(sumHtx, 1) + ' M, la página dice 803,2'); tiene('803,2 M', 'HTX 4'); ok(!/>778,2 M TRX hacia/.test(js) && !/\b778\.2,/.test(js), 'queda el 778,2 antiguo en el cuerpo');
// el envío de 25 M del 2-mar-2026 está en la tabla de billeteras puente de la página
ok(js.includes("['2026-03-02', 25, 'HTX 4', 'TRXttocg4mhE18wGfPtk9JtTYLkmdZcsU4']"), 'falta el envío de 25 M del 2-mar-2026 en la tabla de billeteras puente'); const e25 = pu.find(x => x.fecha.startsWith('2026-03-02')); ok(e25 && e25.tt2t17_a_puente.a === 'TRXttocg4mhE18wGfPtk9JtTYLkmdZcsU4' && e25.tt2t17_a_puente.trx === 25e6, 'el envío del 2-mar-2026 no coincide con los datos');
// contraste de terceros: 14 afirmaciones (1/7/1/5)
ok(ct.filas.length === 14 && ct.resumen.CUADRA === 1 && ct.resumen['CUADRA EN PARTE'] === 7 && ct.resumen['NO CUADRA'] === 1 && ct.resumen['NO COMPROBABLE'] === 5, 'contraste de terceros distinto de 14 = 1+7+1+5');
// energia.json: coherencia interna
const en = JSON.parse(fs.readFileSync(path.join(WEB, 'reports/caso-vaneck-sun/energia.json'), 'utf8')); const e7 = en.cap7, e8 = en.cap8, e9 = en.cap9;
ok(Math.round(e7.cadena_2_nov.llega_a_binance_hot_12 / 1e5) === 1380, 'a Hot 12 no llegan ≈ 138,0 M'); ok(Math.round(e7.devolucion_3_nov.total / 1e5) === 1100, 'la devolución no es ≈ 110 M'); ok(e7.relevos_a_tef9zv.length === 3 && e7.relevos_a_tef9zv.reduce((s, x) => s + x.trx, 0) === ap.ciclo.TRX_proveedora_a_TEF9ZV, 'los 3 relevos no suman lo que dice el ciclo');
const pasos = e7.cadena_2_nov.tramos.flatMap(t => t.filas); ok(pasos.length === 9, 'la cadena del 2-nov debería tener 9 filas de USDT (2+2+5, incluye 100 USDT que se queda la billetera nueva), tiene ' + pasos.length);
ok(e8.lista_oficial.coinciden_cuenta_e_importe === 1000 && e8.lista_oficial.direcciones === 1000, 'lista oficial 1000/1000'); ok(e8.gasto.envios_salientes === 1543, '1.543 envíos'); ok(Math.abs(e8.primer_salto.etiquetadas_pct + e8.primer_salto.sin_etiqueta_pct - 100) < 0.2, 'los porcentajes del primer salto no suman 100');
ok(e9.cambios_de_permiso.length === 3 && e9.cuenta_poloniex.claves_actuales.length === 1, 'permisos de la cuenta Poloniex'); ok(e9.cambios_de_permiso[0].firmado_por === 'TNCmcTdyrYKMtmE1KU2itzeCX76jGm5Not' && e9.cambios_de_permiso[1].firmado_por === e9.poloniex_2.direccion && e9.cambios_de_permiso[2].firmado_por === e9.poloniex_2.direccion, 'quién firmó los tres cambios'); ok(e9.cambios_de_permiso[2].nueva_clave[0] === 'TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2', 'la última clave no es la proveedora');
ok(e9.comprobacion_de_firmas.control_UG === '8/8' && e9.comprobacion_de_firmas.control_proveedora === '8/8', 'las firmas de control no son 8/8'); ok(e9.sin_vinculo_de_claves.cuentas_examinadas === 77, '77 cuentas examinadas');
// páginas: no debe quedar «proveedora de TRON Inc.» presentada como hecho
ok(!/Proveedora de TRON Inc\./.test(js), 'queda el rótulo «Proveedora de TRON Inc.»');
// ---- añadido tras la revisión externa
ok(e7.energia_de_tef9zv.energia_trx_M === 1500.5 && e7.energia_de_tef9zv.receptores_con_energia === 79 && e7.energia_de_tef9zv.ancho_de_banda_trx_M === 28.8, 'energía de la cuenta de energía: 1.500,5 M a 79 cuentas (+28,8 M de ancho de banda)');
ok(e8.ruta_28_jun_2025.length === 4 && e8.ruta_28_jun_2025[3].trx === 365096845 && e8.ruta_28_jun_2025[3].a === 'TEySEZLJf6rs2mCujGpDEsgoMVWKLAk9mT', 'la ruta del 28-jun-2025 debe tener 4 pasos y terminar con 365.096.845 TRX en la tesorería');
for (const frase of ['Casi no lo han gastado', 'Casi no gastaron', 'dos multifirmas de la proveedora', 'Bloomberg informó', 'es el comportamiento de un responsable', 'hotfix.coindesk.com', 'vchawla@theblock.co', 'benzinga.com']) ok(!js.includes(frase), 'la página aún contiene una frase corregida por la revisión: «' + frase + '»');
const nota = fs.existsSync(path.join(WEB, 'investigacion/docs/articulos/NOTA-AMPLIACION-VANECK-SUN-2026-11-05.md')) ? fs.readFileSync(path.join(WEB, 'investigacion/docs/articulos/NOTA-AMPLIACION-VANECK-SUN-2026-11-05.md'), 'utf8') : '';
for (const frase of ['Casi no han gastado', 'las dos multifirmas 3 de 5 de la proveedora', 'Bloomberg informó', 'es el comportamiento de un responsable', 'hotfix.coindesk.com', 'benzinga.com', 'informe a la SEC']) ok(!nota.includes(frase), 'la nota aún contiene una frase corregida por la revisión: «' + frase + '»');
const res = { web: WEB, archivos: ARCHIVOS.map(f => path.basename(f)), direcciones_distintas: usadas.size, invalidas, sin_fuente: sinFuente, hashes_comprobados: hashes, fallos, avisos };
fs.mkdirSync(path.join(RES, 'h-comprobaciones'), { recursive: true }); fs.writeFileSync(path.join(RES, 'h-comprobaciones', 'comprobacion-de-la-web.json'), JSON.stringify(res, null, 1));
console.log('direcciones distintas:', usadas.size, '| inválidas:', invalidas, '| sin fuente:', sinFuente, '| hashes:', hashes, '| FALLOS:', fallos.length); for (const f of fallos) console.log('  ✗', f); if (!fallos.length) console.log('  ✓ todo coincide');
process.exit(fallos.length ? 1 : 0);
