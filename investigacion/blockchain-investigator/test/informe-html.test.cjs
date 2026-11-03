'use strict';
const test = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs'); const path = require('node:path'); const vm = require('node:vm');
const { renderizar } = require('../src/libro-mayor/informe-html.cjs');
const DIR = path.join(__dirname, '..', 'src', 'libro-mayor');
const DATOS = { titulo: 'Prueba </script><script>alert(1)</script>', corte: '2026-11-02T10:00:00.000Z', generado: '2026-11-02T11:00:00.000Z', novedades: [{ version: 'v9.9' }], cadenas: ['tron', 'ethereum'], nota: 'línea separada' };

test('el programa del navegador y las secciones son JavaScript válido', () => {
  for (const f of ['informe-cliente.js', 'informe-secciones.js']) assert.doesNotThrow(() => new vm.Script(fs.readFileSync(path.join(DIR, f), 'utf8'), { filename: f }), f);
});
test('los datos incrustados no pueden cerrar el <script> y se recuperan idénticos', () => {
  const html = renderizar(DATOS); const m = /<script>window\.DATOS=(.*?);<\/script><script>/s.exec(html); assert.ok(m, 'no se encuentra el bloque de datos');
  assert.ok(!m[1].includes('</script>') && !m[1].includes('<'), 'queda un < sin escapar dentro de los datos');
  const vuelta = vm.runInNewContext('(' + m[1] + ')'); assert.equal(vuelta.titulo, DATOS.titulo); assert.equal(vuelta.nota, DATOS.nota);
});
test('la página lleva la versión y el índice de las secciones, sin enlaces a redes externas', () => {
  const html = renderizar(DATOS); assert.match(html, /versión <b>v9\.9<\/b>/); for (const id of ['s1', 's5', 's7', 's12', 'fichas']) assert.ok(html.includes('href="#' + id + '"'), id);
  const externos = (html.match(/(?:src|href)="https?:\/\/[^"]+"/g) || []); assert.deepEqual(externos, [], 'el informe debe ser autocontenido (los enlaces a exploradores los crea el programa del navegador)');
});
