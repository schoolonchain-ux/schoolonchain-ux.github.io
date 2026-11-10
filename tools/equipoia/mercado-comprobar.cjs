'use strict';
// Comprueba una lectura del Observatorio de mercado ANTES de darla por buena. No lee Internet ni escribe nada.
// Uso: node mercado-comprobar.cjs <carpeta con data/mercado.json y data/mercado-serie.json> <serie anterior, o - si no hay>
// Sale con 0 y una línea «OK …» si todo cuadra; con 1 y los motivos si algo no cuadra.
const fs = require('node:fs'); const path = require('node:path');
const dir = process.argv[2]; const fAnt = process.argv[3];
if (!dir) { console.error('Uso: node mercado-comprobar.cjs <carpeta> <serie anterior o ->'); process.exit(2); }
const fallos = []; let M = null, S = null, A = null;
const leer = (f, que) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { fallos.push(que + ' no se puede leer (' + e.message + ')'); return null; } };
M = leer(path.join(dir, 'data', 'mercado.json'), 'la lectura nueva');
S = leer(path.join(dir, 'data', 'mercado-serie.json'), 'la serie propia nueva');
if (fAnt && fAnt !== '-') A = leer(fAnt, 'la serie propia anterior');
if (M) {
  if (M.version !== 2) fallos.push('versión distinta de 2');
  if (!Array.isArray(M.activos) || M.activos.length < 30) fallos.push('menos de 30 activos');
  else if (M.activos[0].s !== 'BTC') fallos.push('el primer activo no es BTC');
  if (!Array.isArray(M.dias) || M.dias.length < 700) fallos.push('menos de 700 días de serie');
  if (!M.redes || !Array.isArray(M.redes.filas) || M.redes.filas.filter((x) => x.tvl).length < 6) fallos.push('menos de 6 cadenas con dinero depositado');
  if (!M.global || !(M.global.capTotalUsd > 1e11)) fallos.push('capital total ausente o absurdo');
  if (!M.stables || !(M.stables.totalUsd > 1e10)) fallos.push('stablecoins ausentes o absurdas');
  const edad = (Date.now() - Date.parse(M.leidoEn)) / 60000;
  if (!(edad >= -5 && edad <= 120)) fallos.push('la lectura no es de las últimas dos horas (' + Math.round(edad) + ' min)');
}
if (S) {
  if (S.version !== 1 || !Array.isArray(S.filas) || !S.filas.length) fallos.push('la serie propia nueva no tiene el formato esperado');
  else {
    for (let i = 1; i < S.filas.length; i++) if (!(S.filas[i - 1].dia < S.filas[i].dia)) { fallos.push('la serie propia no está ordenada por día o repite uno (' + S.filas[i].dia + ')'); break; }
    if (M && M.leidoEn && !S.filas.some((x) => x.dia === String(M.leidoEn).slice(0, 10))) fallos.push('la serie propia no tiene la fila del día de la lectura');
    if (A) {
      if (A.version !== 1 || !Array.isArray(A.filas)) fallos.push('la serie propia anterior no tiene el formato esperado');
      else {
        if (S.filas.length < A.filas.length || S.filas.length > A.filas.length + 1) fallos.push('la serie propia pasa de ' + A.filas.length + ' a ' + S.filas.length + ' filas (solo puede quedarse igual o ganar una)');
        for (let i = 0; i < A.filas.length; i++) if (JSON.stringify(A.filas[i]) !== JSON.stringify(S.filas[i])) { fallos.push('ha cambiado una fila ya escrita de la serie propia (' + A.filas[i].dia + ')'); break; }
      }
    }
  }
}
// la lectura del día: con estos datos el programa de la página tiene que poder escribirla, y al menos el punto del día (los cierres del último día)
let puntos = 0;
if (M && !fallos.length) { try { const fl = [path.join(__dirname, 'mercado-lectura.js'), path.join(__dirname, '..', '..', 'assets', 'mercado-lectura.js')].find((q) => fs.existsSync(q)); if (!fl) throw new Error('falta mercado-lectura.js'); const L = require(fl); const P = L.frases(L.hechos(M, S ? S.filas : [])); puntos = P.length; if (!P.some((x) => x.k === 'dia')) fallos.push('con esta lectura no se puede escribir el punto del día (faltan cierres del último día)'); for (const x of P) if (/null|NaN|undefined|Infinity/.test(L.texto(x))) fallos.push('la lectura del día sale con una cifra vacía en «' + x.titulo + '»'); } catch (e) { fallos.push('no se puede escribir la lectura del día (' + e.message + ')'); } }
if (fallos.length) { console.error('NO VALE: ' + fallos.join('; ')); process.exit(1); }
const esp = ((M.esperada && M.esperada.filas) || []).filter((x) => x.v).map((x) => x.s);
console.log('OK ' + M.activos.length + ' activos, ' + M.dias.length + ' días, serie propia de ' + S.filas.length + ' días' + (A ? (S.filas.length > A.filas.length ? ' (una fila nueva)' : ' (sin fila nueva: la de hoy ya estaba)') : ' (primera)') + ', volatilidad esperada de ' + (esp.join(' y ') || 'ninguna moneda') + ', lectura del día de ' + puntos + ' puntos');
