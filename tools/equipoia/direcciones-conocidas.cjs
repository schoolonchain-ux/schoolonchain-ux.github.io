'use strict';
// Prepara data/direcciones-conocidas.json: lo que NUESTROS INFORMES YA PUBLICADOS dicen de cada dirección, con su fuente, para enseñarlo junto a las listas de cuentas
// (por ejemplo, en la pestaña «Reparto» de TRX). No inventa nada: copia el texto del «Directorio de direcciones» del caso Vaneck/Sun (investigacion/docs/articulos) y añade a
// mano UNAS POCAS entradas que el capítulo 7 del caso ya describe (cada una con su texto y su enlace). Una atribución de terceros se guarda como atribución (quién la hace),
// nunca como un hecho. Es un fichero fijo: se vuelve a generar a mano cuando se amplíe el directorio.
// Uso: node direcciones-conocidas.cjs <carpeta-del-repositorio>
const fs = require('node:fs');
const path = require('node:path');
const REPO = process.argv[2];
if (!REPO) { console.error('Uso: node direcciones-conocidas.cjs <carpeta-del-repositorio>'); process.exit(1); }
const DIR_MD = 'investigacion/docs/articulos/DIRECTORIO-DIRECCIONES-TRON-2026-10-29.md';
const ENLACE_DIR = 'https://github.com/schoolonchain-ux/schoolonchain-ux.github.io/blob/main/' + DIR_MD;
const TRON = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const limpiar = (s) => String(s || '').replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim();

const md = fs.readFileSync(path.join(REPO, DIR_MD), 'utf8').replace(/\r\n/g, '\n');
const out = {};
for (const linea of md.split('\n')) {
  if (!linea.startsWith('|')) continue;
  const c = linea.split('|').slice(1, -1).map((x) => x.trim());
  if (c.length < 5 || !TRON.test(c[1])) continue;
  out[c[1]] = { nombre: limpiar(c[0]), atribucion: limpiar(c[3]), papel: limpiar(c[4]), fuente: 'Directorio de direcciones del caso Vaneck/Sun (29-oct-2026)', enlace: ENLACE_DIR, fecha: '2026-10-29' };
}
const n0 = Object.keys(out).length;
if (n0 < 30) { console.error('DIRECTORIO_CORTO ' + n0); process.exit(2); }

// Entradas que el capítulo 7 del caso describe y el directorio no recoge (texto tomado de reports/caso-vaneck-sun/energia.json y de la propia página)
const energia = JSON.parse(fs.readFileSync(path.join(REPO, 'reports/caso-vaneck-sun/energia.json'), 'utf8'));
const es1 = (x) => Number(x).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const E = energia.cap7 && energia.cap7.energia_de_tef9zv;
if (E && E.direccion) {
  const bin = E.por_familia && E.por_familia['Binance — billeteras nuevas (creadas tras el robo)'];
  out[E.direccion] = { nombre: 'Cuenta de energía', atribucion: 'Sin nombre en TronScan. El capítulo 7 del caso la describe por lo que hace: reparte energía.',
    papel: 'Tiene delegados ' + es1(E.total_trx_M) + ' M TRX (energía y ancho de banda) a ' + E.receptores + ' receptores' + (bin ? '; el ' + es1(bin.pct) + ' % de lo delegado va a billeteras nuevas de Binance' : '') + '. Datos del corte del 5-nov-2026.',
    fuente: 'Caso Vaneck/Sun, capítulo 7', enlace: 'caso-vaneck.html?cap=7', fecha: '2026-11-05' };
}
out['TM3sTVyahiGWYktKg8G6miHpTzRurKDt7b'] = { nombre: 'Cuenta que controla a otra de energía', atribucion: 'Sin nombre en TronScan. El capítulo 7 del caso la describe por su relación con otra cuenta.',
  papel: 'Control común: es clave de TU3rMHyWHzeEJBReWLzHko728hbz6MtfNg, una cuenta que reparte energía a contratos de SUN.io (la controla).', fuente: 'Caso Vaneck/Sun, capítulo 7', enlace: 'caso-vaneck.html?cap=7', fecha: '2026-11-05' };

// El TRX de la antigua TRON Foundation (capítulo 8 del caso): las cuentas a las que fueron los envíos de las 1.000 direcciones bloqueadas en 2018 y que TronScan no nombra.
// Los destinos que TronScan SÍ nombra (Binance, OKX, Poloniex…) ya tienen su nombre y no se tocan. Datos: el fichero publicado de la investigación (corte del 5-nov-2026).
const FUND = 'investigacion/research/tron-vaneck-sun/ampliacion-2026-11-05/f-fundacion/destino-de-las-mil.json';
let nFund = 0;
try {
  const F = JSON.parse(fs.readFileSync(path.join(REPO, FUND), 'utf8'));
  const mes = (iso) => String(iso).split('-').reverse().join('/');
  for (const d of F.mayores_destinos || []) {
    if (d.etiqueta || !TRON.test(d.cuenta) || out[d.cuenta]) continue;
    out[d.cuenta] = { nombre: 'Destino del TRX de la antigua TRON Foundation', atribucion: 'Sin nombre en TronScan. Es una cuenta a la que enviaron TRX direcciones de las 1.000 que la TRON Foundation bloqueó en 2018 (lo dice la cadena; no es una atribución a nadie).',
      papel: 'Recibió ' + es1(d.trx_M) + ' M TRX en ' + d.envios + (d.envios === 1 ? ' envío' : ' envíos') + ' de ' + d.miembros_distintos + (d.miembros_distintos === 1 ? ' de esas direcciones' : ' de esas direcciones distintas') + ' (' + (d.primera === d.ultima ? 'el ' + mes(d.primera) : 'entre el ' + mes(d.primera) + ' y el ' + mes(d.ultima)) + '). Datos del corte del 5-nov-2026.',
      fuente: 'Caso Vaneck/Sun, capítulo 8', enlace: 'caso-vaneck.html?cap=8', fecha: '2026-11-05' };
    nFund++;
  }
} catch (e) { console.error('AVISO: no se pudo leer el destino de las 1.000: ' + String(e.message).slice(0, 80)); }

const salida = { version: 1, nota: 'Lo que los informes publicados de School On-Chain dicen de cada dirección, con su fuente. Una atribución de terceros es una atribución (quién la hace), no un hecho. Fichero fijo, generado de los informes; no se actualiza solo.', generadoDe: [DIR_MD, 'reports/caso-vaneck-sun/energia.json', FUND], direcciones: out };
fs.writeFileSync(path.join(REPO, 'data/direcciones-conocidas.json'), JSON.stringify(salida, null, 1));
console.log('OK direcciones-conocidas.json: ' + Object.keys(out).length + ' direcciones (' + n0 + ' del directorio + ' + (Object.keys(out).length - n0 - nFund) + ' del capítulo 7 + ' + nFund + ' destinos de la TRON Foundation del capítulo 8)');
