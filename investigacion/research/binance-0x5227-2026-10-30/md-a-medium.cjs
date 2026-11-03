'use strict';
// Convierte el informe Markdown en un HTML listo para copiar y pegar en Medium.
// Medium no tiene tablas: cada tabla se convierte en texto alineado por espacios dentro de un bloque <pre>, que Medium
// pega como bloque de código. Títulos, negritas, listas, enlaces y código en línea se conservan. Las rayas «---» se quitan.
// Uso: node md-a-medium.cjs ENTRADA.md SALIDA.html
const fs = require('node:fs');
const [entrada, salida] = process.argv.slice(2);
if (!entrada || !salida) { console.error('uso: node md-a-medium.cjs entrada.md salida.html'); process.exit(2); }
const ANCHO_MAX = 44;   // ancho máximo de una columna; lo que sobra baja de línea dentro de la misma fila

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Markdown en línea → HTML (negrita, código, enlaces). El texto llega ya escapado.
function inline(s) {
  return esc(s)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
// Markdown en línea → texto plano (para las tablas).
const plano = s => s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1').replace(/\*\*/g, '').replace(/`/g, '').trim();
// Parte un texto en líneas de hasta n caracteres sin romper palabras (si una palabra es más larga, se corta).
function partir(texto, n) {
  const out = []; let linea = '';
  for (const palabra of texto.split(/\s+/)) {
    if (!palabra) continue;
    if (palabra.length > n) { if (linea) { out.push(linea); linea = ''; } for (let i = 0; i < palabra.length; i += n) out.push(palabra.slice(i, i + n)); continue; }
    if ((linea + ' ' + palabra).trim().length > n) { out.push(linea); linea = palabra; } else linea = (linea + ' ' + palabra).trim();
  }
  if (linea) out.push(linea);
  return out.length ? out : [''];
}
function tablaATexto(filas) {
  const celdas = filas.map(f => f.replace(/^\||\|$/g, '').split('|').map(c => plano(c)));
  const cab = celdas[0], cuerpo = celdas.slice(2);   // la segunda fila es la de guiones
  const ncol = cab.length;
  const anchos = cab.map((_, i) => Math.min(ANCHO_MAX, Math.max(cab[i].length, ...cuerpo.map(r => Math.min(ANCHO_MAX, (r[i] || '').length)))));
  const linea = r => { const partes = r.map((c, i) => partir(c || '', anchos[i])); const alto = Math.max(...partes.map(p => p.length)); const ls = []; for (let k = 0; k < alto; k++) ls.push(partes.map((p, i) => (p[k] || '').padEnd(anchos[i])).join('  ').replace(/\s+$/, '')); return ls; };
  const sep = anchos.map(a => '-'.repeat(a)).join('  ');
  const out = [...linea(cab), sep];
  for (const r of cuerpo) { while (r.length < ncol) r.push(''); out.push(...linea(r)); }
  return out.join('\n');
}

const lineas = fs.readFileSync(entrada, 'utf8').replace(/^﻿/, '').split(/\r?\n/);
const html = [];
let i = 0, lista = null;
const cerrarLista = () => { if (lista) { html.push(lista === 'ul' ? '</ul>' : '</ol>'); lista = null; } };
while (i < lineas.length) {
  const l = lineas[i];
  if (/^\s*$/.test(l) || /^---\s*$/.test(l)) { cerrarLista(); i++; continue; }
  if (/^\|/.test(l)) { cerrarLista(); const filas = []; while (i < lineas.length && /^\|/.test(lineas[i])) filas.push(lineas[i++]); html.push('<pre>' + esc(tablaATexto(filas)) + '</pre>'); continue; }
  const h = /^(#{1,3})\s+(.*)$/.exec(l);
  if (h) { cerrarLista(); const n = h[1].length; html.push('<h' + n + '>' + inline(h[2]) + '</h' + n + '>'); i++; continue; }
  const li = /^\s*[-*]\s+(.*)$/.exec(l);
  if (li) { if (lista !== 'ul') { cerrarLista(); html.push('<ul>'); lista = 'ul'; } html.push('<li>' + inline(li[1]) + '</li>'); i++; continue; }
  const num = /^\s*\d+\.\s+(.*)$/.exec(l);
  if (num) { if (lista !== 'ol') { cerrarLista(); html.push('<ol>'); lista = 'ol'; } html.push('<li>' + inline(num[1]) + '</li>'); i++; continue; }
  cerrarLista();
  // Párrafo: líneas seguidas hasta una en blanco.
  const p = [l]; i++;
  while (i < lineas.length && lineas[i].trim() && !/^(#|\||\s*[-*]\s|\s*\d+\.\s|---)/.test(lineas[i])) p.push(lineas[i++]);
  html.push('<p>' + inline(p.join(' ')) + '</p>');
}
cerrarLista();
const doc = '<!doctype html>\n<html lang="es"><head><meta charset="utf-8"><title>Informe para Medium</title>\n<style>body{font-family:Georgia,serif;max-width:740px;margin:40px auto;line-height:1.5;color:#222}pre{background:#f4f4f4;padding:12px;overflow-x:auto;font-size:13px;line-height:1.35}code{background:#f4f4f4;padding:1px 4px}h1{font-size:30px}h2{font-size:24px;margin-top:36px}h3{font-size:19px}</style></head><body>\n' + html.join('\n') + '\n</body></html>\n';
fs.writeFileSync(salida, doc);
const tablas = (doc.match(/<pre>/g) || []).length;
console.log('escrito ' + salida + ' · ' + tablas + ' tablas convertidas a bloques de texto · ' + (doc.match(/<h2>/g) || []).length + ' apartados');
