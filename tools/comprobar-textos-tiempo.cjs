// CONTROL DE TEXTOS DE TIEMPO. Evita que la web diga «hoy», «ahora», «ayer» o «en vivo» sobre un dato que no lo es.
//
// Por qué existe (16-nov-2026): la columna «Bloqueadas hoy» de USDT0 enseñaba las direcciones que SIGUEN bloqueadas desde 2022
// (el dato era bueno; el rótulo, falso). La auditoría de ese día encontró el mismo tipo de fallo en decenas de sitios: palabras de
// tiempo escritas a mano sobre datos que son una foto de las 06:00 UTC, del corte de un informe o un acumulado.
//
// Qué hace: busca en las páginas (assets/*.js y *.html) esas palabras dentro de los textos y las compara con la lista de
// tools/textos-tiempo.json. Si aparece una que NO está en la lista, termina con error y la enseña.
//   - «heredado»: ya estaba el 16-nov-2026 y está pendiente de revisar. No bloquea, pero se cuenta.
//   - cualquier otro motivo: alguien la revisó y explica por qué es verdad (p. ej. «se lee en vivo desde el navegador»).
//
// Regla al escribir un texto nuevo: no pongas «hoy/ahora/ayer/en vivo» a mano. Di DE CUÁNDO es el dato con su fecha de lectura
// («leído el 16-nov, 06:05 UTC», «con cierres hasta el 15-nov», «en el corte del informe, 2-nov»). Solo vale «ahora/en vivo» si la
// página lo lee de verdad en ese momento desde el navegador del visitante, y entonces se apunta aquí con ese motivo.
//
// Uso (desde la raíz de la web):
//   node tools/comprobar-textos-tiempo.cjs                      comprueba; código 1 si hay textos nuevos sin revisar
//   node tools/comprobar-textos-tiempo.cjs --aceptar "<clave>" "<motivo>"   apunta UNO como revisado (el motivo es obligatorio)
//   node tools/comprobar-textos-tiempo.cjs --base               solo la primera vez: crea la lista con lo que hay como «heredado»
'use strict';
const fs = require('fs'), path = require('path');
const RAIZ = path.resolve(__dirname, '..'), LISTA = path.join(__dirname, 'textos-tiempo.json');
const PALABRAS = /(?<![\p{L}\p{N}_])(hoy|ayer|anteayer|ahora|en vivo|en directo|actualmente|en este momento|en tiempo real)(?![\p{L}\p{N}_])/giu;
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[\s;{}(),])\/\/[^\n]*/g, (m, a) => a + ' '.repeat(m.length - a.length));
const sinComentariosHtml = (s) => s.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' ')).replace(/<script[\s\S]*?<\/script>/gi, (m) => m.replace(/[^\n]/g, ' '));

function hallazgos() {
  const out = [], ficheros = [...fs.readdirSync(path.join(RAIZ, 'assets')).filter((f) => f.endsWith('.js')).map((f) => 'assets/' + f), ...fs.readdirSync(RAIZ).filter((f) => f.endsWith('.html'))].sort();
  for (const f of ficheros) {
    const bruto = fs.readFileSync(path.join(RAIZ, f), 'utf8'), limpio = f.endsWith('.html') ? sinComentariosHtml(bruto) : sinComentarios(bruto);
    let m; PALABRAS.lastIndex = 0; const vistos = new Map();
    while ((m = PALABRAS.exec(limpio))) {
      // la clave es el fichero + el texto de alrededor (no el número de línea, que cambia con cualquier edición)
      const trozo = limpio.slice(Math.max(0, m.index - 34), m.index + m[0].length + 34).replace(/\s+/g, ' ').trim();
      let clave = f + ' | ' + trozo; const n = (vistos.get(clave) || 0) + 1; vistos.set(clave, n); if (n > 1) clave += ' #' + n;
      out.push({ clave, f, linea: limpio.slice(0, m.index).split('\n').length, palabra: m[0].toLowerCase() });
    }
  }
  return out;
}
const leer = () => (fs.existsSync(LISTA) ? JSON.parse(fs.readFileSync(LISTA, 'utf8')) : null);
const guardar = (j) => fs.writeFileSync(LISTA, JSON.stringify(j, null, 1) + '\n');
const NOTA = 'Lista del control de textos de tiempo (tools/comprobar-textos-tiempo.cjs). Clave = fichero | texto de alrededor. Valor = por qué ese «hoy/ahora/en vivo» es verdad, o «heredado» si ya estaba el 16-nov-2026 y nadie lo ha revisado todavía. Un texto que no esté aquí hace fallar el control.';

const args = process.argv.slice(2), hs = hallazgos();
if (args[0] === '--base') {
  if (leer()) { console.error('La lista ya existe: --base solo vale la primera vez. Usa --aceptar para apuntar un texto revisado.'); process.exit(1); }
  guardar({ _nota: NOTA, textos: Object.fromEntries(hs.map((h) => [h.clave, 'heredado'])) });
  console.log('Lista creada con ' + hs.length + ' textos heredados (pendientes de revisar).'); process.exit(0);
}
const lista = leer(); if (!lista) { console.error('Falta tools/textos-tiempo.json (créala una sola vez con --base).'); process.exit(1); }
if (args[0] === '--aceptar') {
  const [, clave, motivo] = args;
  if (!clave || !motivo || motivo.trim().length < 12 || /^heredado$/i.test(motivo.trim())) { console.error('uso: --aceptar "<clave tal como la enseña el control>" "<por qué es verdad, en una frase>"'); process.exit(1); }
  if (!hs.some((h) => h.clave === clave)) { console.error('Esa clave no está en las páginas ahora mismo: ' + clave); process.exit(1); }
  lista.textos[clave] = motivo.trim(); guardar(lista); console.log('Apuntado como revisado.'); process.exit(0);
}
const nuevos = hs.filter((h) => !(h.clave in lista.textos)), actuales = new Set(hs.map((h) => h.clave));
const sobran = Object.keys(lista.textos).filter((k) => !actuales.has(k));
if (sobran.length) { for (const k of sobran) delete lista.textos[k]; guardar(lista); }   // textos que ya no existen (se corrigieron o se quitaron)
const heredados = hs.filter((h) => lista.textos[h.clave] === 'heredado').length;
console.log(hs.length + ' textos con palabras de tiempo: ' + (hs.length - heredados - nuevos.length) + ' revisados, ' + heredados + ' heredados sin revisar, ' + nuevos.length + ' NUEVOS' + (sobran.length ? ' (' + sobran.length + ' ya no existen y salen de la lista)' : ''));
if (nuevos.length) {
  console.error('\nTEXTOS NUEVOS con «hoy/ahora/ayer/en vivo» sin revisar. Di de cuándo es el dato con su fecha, o apúntalo con --aceptar y su motivo:');
  for (const h of nuevos) console.error(' - ' + h.f + ':' + h.linea + '  «' + h.palabra + '»\n     clave: ' + h.clave);
  process.exit(1);
}
