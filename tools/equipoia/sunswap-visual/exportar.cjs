'use strict';
// EXPORTA los datos de la página interactiva de «SUNSwap bajo el microscopio» (reports/sunswap-microscopio/data.json).
// SOLO LECTURA: lee los archivos de la investigación (C:\EquipoIA\research\sunswap-2026-11-11, derivados/f3-f6) y el informe público ya validado; no escribe nada fuera de la carpeta de salida que se le pasa.
// Todas las tablas del informe se copian TAL CUAL (texto exacto) y los gráficos usan los números de los mismos archivos de los que salió el informe. Antes de escribir, el programa COMPRUEBA que las cifras
// que la página muestra en grande aparecen en el informe y que los números de los gráficos coinciden con las tablas del informe; si algo no coincide, se para y no escribe.
// Uso: node exportar.cjs <carpeta-de-salida>
const fs = require('fs'); const md = require('./md.cjs');
const R = 'C:/EquipoIA/research/sunswap-2026-11-11/', REP = 'C:/EquipoIA/web-publicador/repo/investigacion/docs/SUNSWAP-INFORME-FINAL-2026-11-12.md';
const J = (f) => JSON.parse(fs.readFileSync(R + f, 'utf8'));
const OUT = process.argv[2]; if (!OUT) { console.error('Uso: node exportar.cjs <carpeta-de-salida>'); process.exit(2); }
const texto = fs.readFileSync(REP, 'utf8'); const S = md.leer(REP);
const sec = (id) => { const s = S.find((x) => x.id === id); if (!s) throw new Error('falta el apartado ' + id); return s; };
const tabla = (id, k = 0) => { const t = sec(id).tablas[k]; if (!t) throw new Error('falta la tabla ' + id + '#' + k); return t; };
const de = (n, d = 0) => Number(n).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const problemas = []; const ok = (cond, msg) => { if (!cond) problemas.push(msg); };

// número en formato del informe → número (dólares, o porcentaje tal cual si lleva %)
function pn(s) { s = String(s).replace(/`/g, '').trim(); if (/^—|^-$|^$/.test(s)) return null; const m = /(-?[\d.]+(?:,\d+)?)\s*(mil M\$|M\$|mil \$|\$|%|×)?/.exec(s); if (!m) return null; const v = parseFloat(m[1].replace(/\./g, '').replace(',', '.')); const u = m[2]; return u === 'mil M$' ? v * 1e9 : u === 'M$' ? v * 1e6 : u === 'mil $' ? v * 1e3 : v; }

// ---------- fuentes ----------
const g = J('derivados/f6/graficos-datos.json'), V = { ...J('derivados/f5/valores.json'), ...J('derivados/f6/valores.json') };
const r2 = J('derivados/resumen.json'), f3 = J('derivados/f3/resumen.json'), f4 = J('derivados/f4/resumen.json'), f5 = J('derivados/f5/resumen.json');
const VS = ['V1', 'V2', 'V3', 'V4'];

// ---------- cifras en grande: las que el informe ya escribe (valores.json), comprobadas contra el texto del informe ----------
const KPI_USADOS = ['TVL', 'ACT_TOT', 'TOP3', 'HHI', 'VOL12', 'VOL30', 'CAP_0', 'CAP_1', 'CAP_VAR', 'TOK_TOP1', 'ACT_TOP1', 'TIPO_TRX', 'C100K_V3', 'C100K_V4', 'C100K_V2', 'C100K_V1', 'CIRP', 'CIRN', 'CIRU', 'TOP10', 'TOP1', 'V3VOLP', 'TOP1VOL', 'RE_N', 'RE_EX', 'RE_D2', 'RE_DI', 'DOBLE_MAS'];
const kpi = {}; for (const k of KPI_USADOS) { ok(V[k] != null, 'falta la cifra ' + k); kpi[k] = V[k]; }
const nMk = V.MKT_V1V4; ok(nMk != null, 'falta MKT_V1V4'); kpi.MKT_V1V4 = nMk;
for (const [k, v] of Object.entries(kpi)) ok(texto.includes(String(v).replace(/ \(.*$/, '')), 'la cifra ' + k + ' = «' + v + '» no aparece en el informe');

// ---------- resumen ejecutivo (lista numerada del apartado 1) ----------
const resumen = sec('1').lineas.map((l) => /^(\d+)\.\s+\*\*(.+?)\*\*\s*(.*)$/.exec(l)).filter(Boolean).map((m) => ({ n: +m[1], titulo: m[2].replace(/\.$/, ''), texto: m[3] }));
ok(resumen.length >= 9 && resumen.every((r, i) => r.n === i + 1 && r.titulo && r.texto), 'el resumen ejecutivo no se leyó entero (puntos leídos: ' + resumen.length + ')');

// ---------- versiones, mayores, tokens, rango ----------
const versiones = VS.map((v) => ({ v, mercados: r2.versiones[v].mercados, estados: r2.versiones[v].porEstado, tvl: f3.tvlValoradoUsd.porVersion[v], cuota: f3.cuotaPorVersion[v] }));
const mk = (m) => ({ id: m.id, v: m.id.slice(0, 2).toUpperCase(), par: m.par, usd: m.usd, cuota: m.cuota, estado: m.estado, completitud: m.completitud });
const mayores = f3.concentracionGlobal.mayores.slice(0, 20).map(mk);
const mayoresVersion = Object.fromEntries(VS.map((v) => [v, f3.concentracionPorVersion[v].mayores.slice(0, 10).map(mk)]));
const tokens = f3.concentracionPorToken.mayores.map((t) => ({ simbolo: t.simbolo, token: t.token, usd: t.usd, cuota: t.cuota, mercados: t.mercados, fiabilidad: t.fiabilidad }));
const tipos = Object.entries(f3.distribucionPorTipo).map(([k, usd]) => ({ tipo: k, usd }));
const rango = Object.fromEntries(['V3', 'V4'].map((v) => [v, { ...f3.rango[v], mayoresFuera: (f3.rango[v].mayoresFuera || []).slice(0, 6) }]));
const acumulada = { ...Object.fromEntries(VS.map((v) => [v, f3.concentracionPorVersion[v].acumulada])), Conjunto: f3.concentracionGlobal.acumulada };
const concentracion = { ...Object.fromEntries(VS.map((v) => { const c = f3.concentracionPorVersion[v]; return [v, { mercados: c.mercadosConCapitalValorado, top1: c.top1, top10: c.top10, top20: c.top20, top50: c.top50, hhi: c.hhiPuntos }]; })), Conjunto: { mercados: f3.concentracionGlobal.mercadosConCapitalValorado, top1: f3.concentracionGlobal.top1, top10: f3.concentracionGlobal.top10, top20: f3.concentracionGlobal.top20, top50: f3.concentracionGlobal.top50, hhi: f3.concentracionGlobal.hhiPuntos } };
const titulares = { ...f5.quienAporta };

// ---------- profundidad ----------
const cuotas = g.cuotas; const eficiencia = f4.eficienciaPorVersion.map((e) => ({ v: e.version, mercados: e.mercados, capital: e.capital, enRango: e.capitalEnRango, r05: e.razon05, r1: e.razon1, r2: e.razon2, r5: e.razon5 }));
const TAM = [100, 1e3, 1e4, 1e5, 1e6, 1e7];
const t85 = tabla('8.5', 0); const costes = t85.filas.map((f) => ({ mercado: md.limpia(f[0]).replace(/\s+\S+…$/, ''), etiqueta: md.limpia(f[0]), puntos: TAM.map((usd, i) => ({ usd, coste: pn(f[i + 1]) })) }));
const maximos = tabla('8.5', 1);
const enganosos = f4.enganosos.map((e) => ({ id: e.id, v: e.version, par: e.par, capital: e.capital, enRango: e.enRango, prof1: e.prof1, motivos: e.motivos }));
const validacion = f4.validacionContratos, niveles = f4.nivelesEvidencia;

// ---------- volumen ----------
const volMes = g.volMes; const volVersion = f5.volumen.map((x) => ({ v: x.v, mercados: x.mercados, s30: x.s30, svc: x.svc, u1: x.u1, u7: x.u7, u30: x.u30, u90: x.u90, uvc: x.uvc }));
const circular = { principal: f5.actividadCircular.principal, enrutado: f5.enrutado };

// ---------- proveedores (aportes mensuales del apartado 10.1) ----------
const t101m = tabla('10.1', 2); const aportesMes = t101m.filas.map((f) => ({ mes: f[0], V1: [pn(f[1]), pn(f[2])], V2: [pn(f[3]), pn(f[4])], V3: [pn(f[5]), pn(f[6])], V4: [pn(f[7]), pn(f[8])] }));

// ---------- historia ----------
const capitalDia = g.capitalDia, profV3 = g.profV3;
const efectos = tabla('11.2', 1).filas.map((f) => ({ v: f[0], variacion: pn(f[1]), cantidades: pn(f[2]), precios: pn(f[3]) }));

// ---------- todas las tablas del informe, tal cual ----------
const tablas = {}; for (const s of S) s.tablas.forEach((t, k) => { tablas[s.id + '#' + k] = t; });
const parrafos = (id) => sec(id).lineas.filter((l) => l.trim()).map((l) => l);
const textos = { metodologia: parrafos('3'), conclusiones: parrafos('14'), limitaciones: parrafos('15') };
const huella = (/huella `([0-9a-f]{16})`/.exec(texto) || [])[1];

// ---------- comprobaciones cruzadas: gráficos frente a tablas del informe ----------
{ const t = tabla('6.1', 0); for (const v of versiones) { const f = t.filas.find((x) => x[0] === v.v); ok(f && Math.abs(pn(f[2]) - v.tvl) < 6e4, 'capital de ' + v.v + ' del gráfico (' + v.tvl + ') no coincide con la tabla 6.1 (' + (f && f[2]) + ')'); } }
{ const t = tabla('6.2', 0); mayores.slice(0, 10).forEach((m, i) => { ok(t.filas[i] && Math.round(pn(t.filas[i][3])) === Math.round(m.usd), 'mercado nº ' + (i + 1) + ' del gráfico (' + de(m.usd) + ') no coincide con la tabla 6.2 (' + (t.filas[i] && t.filas[i][3]) + ')'); }); }
{ const t = tabla('8.4', 0); for (const c of cuotas) { const e = eficiencia.find((x) => x.v === c.v); const f = t.filas.find((x) => x[0] === c.v); ok(f && Math.abs(pn(f[5]) - e.r1 * 100) < 0.006, 'razón de profundidad de ' + c.v + ' no coincide con la tabla 8.4'); } }
{ const t = tabla('9.2', 1); for (const x of volVersion) { const f = t.filas.find((r) => r[0] === x.v); ok(f && Math.abs(pn(f[3]) / x.u30 - 1) < 0.01, 'volumen 30 d de ' + x.v + ' no coincide con la tabla 9.2'); } }
{ const t = tabla('11.1', 1); for (const v of VS.slice(0, 3)) { const f = t.filas.find((r) => r[0] === v); const ult = capitalDia[v][capitalDia.dias.length - 1]; ok(f && Math.abs(pn(f[2].split('·')[1]) - ult) < 6e3, 'último día de ' + v + ' del gráfico no coincide con la tabla 11.1'); } }
{ const sumaDia = (dia) => VS.reduce((a, v) => a + (capitalDia[v][capitalDia.dias.indexOf(dia)] || 0), 0); ok(Math.abs(sumaDia('2025-12-01') / 1e6 - 440.62) < 0.01 && Math.abs(sumaDia('2026-11-01') / 1e6 - 619.31) < 0.01 && Math.abs(sumaDia('2025-11-11') / 1e6 - 592.74) < 0.01 && Math.abs(sumaDia('2026-11-11') / 1e6 - 559.90) < 0.01, 'los hitos de la serie diaria (592,74 / 440,6 / 619,3 / 559,9 M$) no coinciden con el informe'); ok(texto.includes('440,6 M$ el 1-dic-2025') && texto.includes('619,3 M$ el 1-nov-2026'), 'el informe ya no cita los hitos del 1-dic-2025 y 1-nov-2026'); }
{ ok(capitalDia.dias.length === 366 && capitalDia.dias[0] === '2025-11-11' && capitalDia.dias[365] === '2026-11-11', 'la serie diaria no cubre 2025-11-11 → 2026-11-11'); }
{ const sumMes = volMes.meses.reduce((a, _, i) => a + VS.reduce((b, v) => b + volMes[v][i], 0), 0); const ref = f5.volumen.reduce((a, x) => a + x.uvc, 0); ok(Math.abs(sumMes / ref - 1) < 0.001, 'la suma del volumen mensual (' + de(sumMes) + ') no coincide con el volumen de la ventana completa (' + de(ref) + ')'); }
{ const sumV = VS.reduce((a, v) => a + f3.tvlValoradoUsd.porVersion[v], 0); ok(Math.abs(sumV / f3.tvlValoradoUsd.global - 1) < 1e-6, 'la suma de capitales por versión no da el total'); }
{ ok(titulares.titulares[0].a === 'TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N', 'la mayor titular ya no es TT2T17…: hay que revisar la referencia cruzada con el caso Vaneck'); ok(texto.includes('TT2T17KZ') , 'el informe ya no cita TT2T17…'); }
{ const t = tabla('12.3', 0); ok(t.filas.length >= 10, 'faltan picos de volumen'); }
// cifras escritas a mano en los textos de la página (llano, recapitulaciones, avisos): todas deben aparecer en el informe
const CITADAS = ['440,6 M$ el 1-dic-2025', '619,3 M$ el 1-nov-2026', '68,2 %', '110,18 M$', '108,82 M$', '137,20 M$', '131,54 M$', '423 M$', '17 veces', '30.000.000 USDT', '11 minutos', '15.100', '34 tokens', '88 mercados', '2.619', '4.279', '15,3 M$', '27.313', '27.091', '55 de 55', '0,25 %', '3,36 %', '4,82 %', '6,73 M$', '15,4 M$', '95,3 %', '95,6 %', 'dos cuentas', '26.904', '1.524', '59,95 %', '83,3 %'];
for (const c of CITADAS) ok(texto.includes(c), 'la cifra citada en los textos de la página «' + c + '» no aparece en el informe');
if (problemas.length) { console.error('NO SE ESCRIBE. Problemas:\n - ' + problemas.join('\n - ')); process.exit(1); }

const out = { version: 1, generado: new Date().toISOString(), informe: { titulo: S[0] && texto.split(/\r?\n/)[0].replace(/^# /, ''), huella, edicion: '4.ª edición, 12-nov-2026', ventana: { desde: '2025-11-11', hasta: '2026-11-11' }, bloque: r2.bloqueLectura && r2.bloqueLectura.n }, kpi, resumen, preguntas: tabla('2', 0), versiones, mayores, mayoresVersion, tokens, tipos, rango, acumulada, concentracion, titulares, cuotas, eficiencia, costes, maximos, enganosos, validacion, niveles, volMes, volVersion, circular, aportesMes, capitalDia, profV3, efectos, textos, tablas };
fs.mkdirSync(OUT, { recursive: true }); const s = JSON.stringify(out); fs.writeFileSync(OUT + '/data.json', s);
console.log('OK: data.json', Math.round(s.length / 1024), 'KB | resumen', resumen.length, '| mayores', mayores.length, '| costes', costes.length, '| tablas', Object.keys(tablas).length, '| huella', huella, '| comprobaciones sin problemas');
