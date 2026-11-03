'use strict';
// CONSERVACIÓN DE LAS DOS VÍAS DE PUREZA (decisión del propietario, 3-nov-2026: «hay que conservar siempre ambos conservando evidencia, método y resultados»).
// Las vías son: «actual» (la publicada) y «ciclo» (la alternativa que diluye lo que entra de contratos neutros sin enlace y en exceso de lo que la billetera les mandó); «diluida» (cota baja) se conserva también como evidencia.
// Ninguna sustituye a la otra: cualquier método nuevo se AÑADE como una vía más. Este módulo (1) guarda una copia versionada e inmutable de resultados, registros, código y entradas con su hash, y (2) verifica que lo vivo sigue siendo lo registrado.
const fs = require('node:fs'); const path = require('node:path'); const crypto = require('node:crypto');
const A = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/'; const RAIZ = A + 'pureza-dos-vias/';
const VIAS = { actual: '', ciclo: '.ciclo', diluida: '.diluida' }; const OBLIGATORIAS = ['actual', 'ciclo'];
const CODIGO = [A + 'analisis-tramo5.cjs', A + 'analisis-tramo6.cjs', A + '_parche-pureza-dos-vias.cjs', A + '_parche-pureza-ciclo.cjs', A + '_parche-corte-tramo6.cjs', A + 'filtrar-corte-tramo6.cjs', 'C:/EquipoIA/blockchain-investigator/src/libro-mayor/dos-vias.cjs', 'C:/EquipoIA/blockchain-investigator/scripts/conservar-dos-vias.cjs'];
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
// Hash «canónico»: los resultados llevan la hora de generación (`generado`), que cambia en cada ejecución aunque el resultado sea el mismo; se ignora.
function hashArchivo(f) { const b = fs.readFileSync(f); if (!/\.json$/.test(f)) return sha(b); let o; try { o = JSON.parse(b.toString('utf8')); } catch { return sha(b); } if (o && typeof o === 'object' && !Array.isArray(o) && 'generado' in o) { o = { ...o }; delete o.generado; } return sha(JSON.stringify(o)); }
const entradasDe = (dir, pref) => [path.join(dir, pref + '-cache.json'), path.join(dir, 't4.json'), path.join(dir, 'traza-clases.json'), path.join(dir, pref + '-alcanzadas.json'), path.join(dir, pref + '-escontrato.json'), path.join(dir, pref + '-swaps.json'), path.join(dir, 'retiradas-informe.json'), A + 'resultados/contratos-clasificados.json'];
const salidasDe = (dir, pref) => { const o = []; for (const [via, suf] of Object.entries(VIAS)) for (const base of ['-resultado', '-aristas-terminales']) o.push({ via, f: path.join(dir, pref + base + suf + '.json') }); return o; };
const ult = () => { try { return fs.readdirSync(RAIZ).filter(n => /^\d{4}-\d{2}-\d{2}-v\d+$/.test(n)).sort().pop() || null; } catch { return null; } };

// Estado vivo de los resultados de cada tramo: hash por fichero.
function vivo(tramos) { const r = {}; for (const { nombre, dir, pref } of tramos) { r[nombre] = { dir, pref, entradas: {}, salidas: {} }; for (const f of entradasDe(dir, pref)) if (fs.existsSync(f)) r[nombre].entradas[path.basename(f)] = hashArchivo(f); for (const { via, f } of salidasDe(dir, pref)) if (fs.existsSync(f)) r[nombre].salidas[via + ':' + path.basename(f)] = hashArchivo(f); } return r; }

// Guarda una versión NUEVA (nunca sobrescribe): copia resultados, registros y código y escribe MANIFIESTO.json. Si lo vivo es idéntico a la última versión, no hace nada.
function conservar(tramos, { nota = '', metodo = true } = {}) {
  const V = vivo(tramos); const u = ult(); if (u) { const m = JSON.parse(fs.readFileSync(RAIZ + u + '/MANIFIESTO.json', 'utf8')); if (JSON.stringify(m.vivo) === JSON.stringify(V) && CODIGO.every(f => !fs.existsSync(f) || m.codigo[path.basename(f)] === hashArchivo(f))) return { version: u, nueva: false }; }
  const hoy = new Date().toISOString().slice(0, 10); const n = (u && u.startsWith(hoy) ? +u.split('-v')[1] + 1 : u ? 1 : 1); let nombre = hoy + '-v' + n; while (fs.existsSync(RAIZ + nombre)) nombre = hoy + '-v' + (++n);
  const dst = RAIZ + nombre + '/'; fs.mkdirSync(dst + 'codigo', { recursive: true }); const man = { version: nombre, creado: new Date().toISOString(), nota, vias: Object.keys(VIAS), obligatorias: OBLIGATORIAS, vivo: V, copias: {}, codigo: {}, registros: {} };
  for (const { nombre: t, dir, pref } of tramos) { fs.mkdirSync(dst + 'resultados/' + t, { recursive: true }); fs.mkdirSync(dst + 'registros/' + t, { recursive: true });
    for (const { via, f } of salidasDe(dir, pref)) if (fs.existsSync(f)) { const d = dst + 'resultados/' + t + '/' + path.basename(f); fs.copyFileSync(f, d); man.copias[t + '/' + path.basename(f)] = hashArchivo(d); }
    for (const l of fs.readdirSync(dir).filter(x => /^analisis-log.*\.txt$/.test(x))) { fs.copyFileSync(path.join(dir, l), dst + 'registros/' + t + '/' + l); man.registros[t + '/' + l] = sha(fs.readFileSync(dst + 'registros/' + t + '/' + l)); } }
  for (const f of CODIGO) if (fs.existsSync(f)) { fs.copyFileSync(f, dst + 'codigo/' + path.basename(f)); man.codigo[path.basename(f)] = hashArchivo(f); }
  if (metodo && fs.existsSync(RAIZ + 'METODO.md')) { fs.copyFileSync(RAIZ + 'METODO.md', dst + 'METODO.md'); man.metodo = sha(fs.readFileSync(dst + 'METODO.md')); }
  try { const cmp = require('./perdida-rastro.cjs').construirPureza2(tramos); fs.writeFileSync(dst + 'comparacion.json', JSON.stringify(cmp, null, 1)); man.comparacion = sha(fs.readFileSync(dst + 'comparacion.json')); } catch (e) { man.comparacionError = String(e.message); }
  const REV = 'C:/EquipoIA/research/polytrop-2026-11-03/codex/'; man.revision = {}; for (const r of ['CORR-v03-AB-claude-respuesta.md', 'CORR-v03-AB-claude-respuesta-meta.json', 'CORR-v03-AB-prompt.md']) if (fs.existsSync(REV + r)) { fs.mkdirSync(dst + 'revision', { recursive: true }); fs.copyFileSync(REV + r, dst + 'revision/' + r); man.revision[r] = sha(fs.readFileSync(dst + 'revision/' + r)); }
  fs.writeFileSync(dst + 'MANIFIESTO.json', JSON.stringify(man, null, 1)); return { version: nombre, nueva: true, ficheros: Object.keys(man.copias).length };
}

// Verifica lo vivo contra la última versión guardada. Devuelve { estado: OK|AVISO|FALLO, detalle, problemas[] }.
function verificar(tramos) {
  const problemas = [], avisos = []; const V = vivo(tramos);
  for (const { nombre } of tramos) for (const via of OBLIGATORIAS) for (const base of ['-resultado', '-aristas-terminales']) { const k = Object.keys(V[nombre].salidas).find(x => x.startsWith(via + ':') && x.includes(base)); if (!k) problemas.push(nombre + ': falta la vía «' + via + '» (' + base.slice(1) + ')'); }
  const u = ult(); if (!u) { problemas.push('no hay ninguna versión guardada de la evidencia (' + RAIZ + ')'); return { estado: 'FALLO', detalle: problemas.join('; '), problemas }; }
  const m = JSON.parse(fs.readFileSync(RAIZ + u + '/MANIFIESTO.json', 'utf8'));
  for (const { nombre } of tramos) { const a = V[nombre], b = (m.vivo || {})[nombre]; if (!b) { problemas.push(nombre + ': no consta en el manifiesto ' + u); continue; }
    for (const [k, h] of Object.entries(b.salidas)) if (a.salidas[k] !== h) problemas.push(nombre + ': el resultado ' + k + ' ' + (a.salidas[k] ? 'ha cambiado' : 'ha desaparecido') + ' desde ' + u);
    for (const k of Object.keys(a.salidas)) if (!(k in b.salidas)) avisos.push(nombre + ': hay un resultado nuevo (' + k + ') que no consta en ' + u + ' (ejecuta conservar-dos-vias.cjs)');
    for (const [k, h] of Object.entries(b.entradas)) if (a.entradas[k] !== h) avisos.push(nombre + ': la entrada ' + k + ' ' + (a.entradas[k] ? 'ha cambiado' : 'falta') + ' desde ' + u); }
  for (const [k, h] of Object.entries(m.copias)) { const f = RAIZ + u + '/resultados/' + k; if (!fs.existsSync(f) || hashArchivo(f) !== h) problemas.push('la copia guardada ' + k + ' no coincide con su hash (evidencia alterada)'); }
  for (const f of CODIGO) { const h = m.codigo[path.basename(f)]; if (h && fs.existsSync(f) && hashArchivo(f) !== h) avisos.push('el guion ' + path.basename(f) + ' ha cambiado desde ' + u + ' (la evidencia conserva la copia exacta que produjo los resultados)'); }
  if (problemas.length) return { estado: 'FALLO', detalle: 'Evidencia de las dos vías: ' + problemas.slice(0, 4).join('; ') + (problemas.length > 4 ? ' (+' + (problemas.length - 4) + ' más)' : ''), problemas, version: u };
  if (avisos.length) return { estado: 'AVISO', detalle: 'Las dos vías (actual y ciclo) están calculadas y sus resultados coinciden con la versión guardada ' + u + ', pero: ' + avisos.slice(0, 3).join('; '), problemas: avisos, version: u };
  return { estado: 'OK', detalle: 'Las dos vías de pureza (actual y ciclo) están calculadas en los dos tramos, conservadas con método, código, registros y resultados (versión ' + u + ') y los resultados vivos coinciden con su hash', problemas: [], version: u };
}
module.exports = { VIAS, OBLIGATORIAS, RAIZ, conservar, verificar, vivo, hashArchivo };
