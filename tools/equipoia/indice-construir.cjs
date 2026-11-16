// ÍNDICE DE FUNCIONES de la web (indice.html), SIN capturas: escribe data/indice.json a partir de dos ficheros de texto.
//   - indice-temas.json (junto a este guion, escrito a mano): los temas y, de cada función, su título, su frase, su enlace y dónde está.
//   - reports/index.json de la copia de la web: las investigaciones (título, resumen e imagen de portada, que ya existen).
// No abre ningún navegador, no lee Internet y no hace fotos. Uso: node indice-construir.cjs <carpeta de la copia de la web>
'use strict';
const fs = require('fs'), path = require('path');
const REPO = process.argv[2] && path.resolve(process.argv[2]);
if (!REPO || !fs.existsSync(path.join(REPO, 'reports', 'index.json'))) { console.error('uso: node indice-construir.cjs <copia de la web>'); process.exit(1); }
const conf = JSON.parse(fs.readFileSync(path.join(__dirname, 'indice-temas.json'), 'utf8'));
const { organizar } = require('./indice-organizar.cjs');
const PAGINA_DE = { 'caso-vaneck-sun': 'caso-vaneck.html', 'sunswap-microscopio': 'sunswap.html', 'justlend-liquidez': 'justlend.html' };

const problemas = [];
const funciones = Object.entries(conf.funciones).filter(([, f]) => !f.oculta).map(([u, f]) => ({ u, t: f.t, desc: f.desc }));
for (const [u, f] of Object.entries(conf.funciones)) {
  if (f.oculta) continue;
  if (!f.t || !f.desc || !f.lugar || !f.tema) problemas.push('a esta función le falta tema, título, frase o lugar: ' + u);
  if (!conf.temas.some((t) => t.id === f.tema)) problemas.push('tema desconocido «' + f.tema + '» en ' + u);
  if (!fs.existsSync(path.join(REPO, u.split('#')[0].split('?')[0]))) problemas.push('la página no existe en la web: ' + u);
}
const titulos = funciones.map((f) => f.t.toLowerCase()), repes = titulos.filter((x, i) => titulos.indexOf(x) !== i);
if (repes.length) problemas.push('títulos repetidos: ' + repes.join(', '));
const investigaciones = [];
for (const inf of JSON.parse(fs.readFileSync(path.join(REPO, 'reports', 'index.json'), 'utf8')).informes || []) {
  const u = PAGINA_DE[inf.slug] || ('report.html?r=' + inf.slug);
  if (!fs.existsSync(path.join(REPO, u.split('?')[0]))) { problemas.push('no existe la página de la investigación ' + inf.slug); continue; }
  if (inf.imagen && !fs.existsSync(path.join(REPO, inf.imagen))) problemas.push('no existe la portada ' + inf.imagen);
  investigaciones.push({ titulo: inf.titulo, resumen: inf.resumen || '', u, portada: inf.imagen || '' });
}
const org = organizar(funciones, investigaciones, conf);
if (problemas.length) { console.error('NO VÁLIDO:\n - ' + problemas.join('\n - ')); process.exit(2); }
// Sin fecha dentro: el fichero solo cambia cuando cambia el índice (así no se sube nada si no hay nada nuevo).
const salida = JSON.stringify({ version: 3, temas: org.temas }, null, 1) + '\n', destino = path.join(REPO, 'data', 'indice.json');
const antes = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8') : '';
if (antes !== salida) fs.writeFileSync(destino, salida);
console.log((antes !== salida ? 'OK indice.json escrito: ' : 'OK indice.json sin cambios: ') + org.clasificadas + ' funciones en ' + org.temas.length + ' temas, ' + investigaciones.length + ' investigaciones');
