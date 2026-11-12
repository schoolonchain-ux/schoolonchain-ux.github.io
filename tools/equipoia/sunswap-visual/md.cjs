'use strict';
// Lector mínimo del informe en Markdown: apartados (## y ###), tablas, lista numerada del resumen y párrafos. Solo lectura del informe publicado.
const fs = require('fs');
const celdas = (l) => { const t = l.trim().replace(/^\|/, '').replace(/\|$/, ''); const out = []; let cur = ''; for (let i = 0; i < t.length; i++) { if (t[i] === '\\' && t[i + 1] === '|') { cur += '|'; i++; } else if (t[i] === '|') { out.push(cur.trim()); cur = ''; } else cur += t[i]; } out.push(cur.trim()); return out; };
function leer(ruta) {
  const L = fs.readFileSync(ruta, 'utf8').split(/\r?\n/); const sec = []; let actual = { id: '0', titulo: '(inicio)', nivel: 2, lineas: [], tablas: [] };
  const num = (t) => { const m = /^(\d+(?:\.\d+)*)\.?\s/.exec(t); return m ? m[1] : null; };
  for (let i = 0; i < L.length; i++) {
    const m = /^(#{2,4}) (.+)$/.exec(L[i]);
    if (m) { sec.push(actual); const titulo = m[2].trim(); actual = { id: num(titulo) || titulo.slice(0, 20), titulo, nivel: m[1].length, lineas: [], tablas: [] }; continue; }
    if (/^\|/.test(L[i]) && i + 1 < L.length && /^\|[\s:|-]+\|?\s*$/.test(L[i + 1])) {
      const cab = celdas(L[i]); const filas = []; let j = i + 2; while (j < L.length && /^\|/.test(L[j])) { filas.push(celdas(L[j])); j++; }
      actual.tablas.push({ cab, filas }); i = j - 1; continue;
    }
    actual.lineas.push(L[i]);
  }
  sec.push(actual); return sec;
}
// quita el formato en línea (negritas, código, enlaces) para mostrar texto plano
const limpia = (s) => String(s).replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
module.exports = { leer, celdas, limpia };
if (require.main === module) {
  const S = leer(process.argv[2]); const q = process.argv[3];
  for (const s of S) { if (q && s.id !== q) continue; console.log('\n##', s.id, '|', s.titulo.slice(0, 80), '| líneas', s.lineas.length, '| tablas', s.tablas.length); if (q) { s.tablas.forEach((t, k) => { console.log('  tabla', k, 'cab:', JSON.stringify(t.cab)); t.filas.slice(0, 4).forEach((f) => console.log('     ', JSON.stringify(f).slice(0, 300))); }); } }
}
