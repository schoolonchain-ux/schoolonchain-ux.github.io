'use strict';
// Genera data/busqueda.json: el índice del buscador de la web. Es una transformación de ficheros YA publicados en el repositorio
// (no lee nada de Internet): páginas y sus apartados, informes y capítulos, documentos, novedades, registro de cambios,
// artículos, y las direcciones y transacciones que citan los informes, con lo que se dice de cada una y de dónde sale.
// Una atribución de terceros se indexa como atribución (quién la hace), no como hecho.
// Comprobaciones: si falta un fichero base o el índice sale vacío en algún grupo esencial, termina con error y NO escribe nada.
// Uso: node busqueda-indice.cjs <carpeta-del-repositorio>
const fs = require('node:fs'); const path = require('node:path');
const REPO = process.argv[2]; if (!REPO) { console.error('Uso: node busqueda-indice.cjs <carpeta-del-repositorio>'); process.exit(1); }
const p = (...x) => path.join(REPO, ...x); const existe = (f) => fs.existsSync(p(f)); const lee = (f) => fs.readFileSync(p(f), 'utf8'); const j = (f) => JSON.parse(lee(f));
const sinMd = (s) => String(s || '').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]{1,3}/g, '').replace(/^\s*>\s*/gm, '').replace(/^#+\s*/gm, '');   // quita las marcas de Markdown de un texto que se va a enseñar tal cual
const limpia = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&laquo;/g, '«').replace(/&raquo;/g, '»').replace(/\s+/g, ' ').trim();
const corta = (s, n) => { s = limpia(s); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
const entradas = []; const E = (k, t, u, d, x, f) => { if (t && u) entradas.push({ k, t: corta(t, 160), u, ...(d ? { d: corta(d, 220) } : {}), ...(x ? { x: corta(x, 900) } : {}), ...(f ? { f } : {}) }); };

/* ---------- páginas y sus apartados (se leen los encabezados del propio HTML) ---------- */
const PAGINAS = [['index.html', './', 'Portada'], ['herramientas.html', 'herramientas.html', 'Herramientas'], ['fundamentales.html', 'fundamentales.html', 'Laboratorio de fundamentales'], ['datos.html', 'datos.html', 'De dónde sale cada cifra'], ['como-investigamos.html', 'como-investigamos.html', 'Cómo investigamos'], ['cambios.html', 'cambios.html', 'Registro de cambios'], ['archivo.html', 'archivo.html', 'Archivo'], ['acerca.html', 'acerca.html', 'Acerca de School On-Chain']];
for (const [f, u, nombre] of PAGINAS) {
  if (!existe(f)) continue; const h = lee(f); const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  E('pag', nombre, u, desc, limpia((h.match(/<main[\s\S]*<\/main>/) || [''])[0]).slice(0, 900));
  const re = /<(section|div|h2|h3)[^>]*\bid="([^"]+)"[^>]*>|<h([23])[^>]*>([\s\S]*?)<\/h\3>/g; let m, id = null;
  while ((m = re.exec(h))) { if (m[2]) { id = m[2]; if (m[1] === 'h2' || m[1] === 'h3') { const t = limpia(h.slice(m.index).match(/>([\s\S]*?)<\/h[23]>/)[1]); if (t) E('pag', nombre + ' · ' + t, u + '#' + id); } continue; } const t = limpia(m[4]); if (t && t.length > 3 && id) { E('pag', nombre + ' · ' + t, u + '#' + id); id = null; } }
}

/* ---------- informes, capítulos y ficha ---------- */
const idx = j('reports/index.json'); const casoDe = {};
for (const r of idx.informes) {
  const u = r.url || 'report.html?r=' + encodeURIComponent(r.slug); casoDe[r.slug] = { nombre: r.caso || r.titulo, u };
  E('inf', r.titulo, u, r.resumen, [r.caso, (r.cadenas || []).join(' '), r.version, r.aviso ? r.aviso.titulo + ' ' + r.aviso.resumen : '', (r.ficha || []).map((x) => x.t + ' ' + x.texto).join(' ')].join(' '));
  if (r.aviso) E('inf', r.aviso.titulo, u + '#aviso', r.aviso.resumen, (r.aviso.puntos || []).map((x) => x.t + ' ' + x.d).join(' '));
}
if (existe('assets/dash-capitulos.js')) for (const f of fs.readdirSync(p('assets')).filter((x) => /^dash-.*\.js$/.test(x))) { const s = lee('assets/' + f); const re = /Dash\.sec\('([a-z0-9-]+)',\s*'([^']+)'/g; let m; while ((m = re.exec(s))) E('inf', 'Informe del robo a Binance · ' + m[2], 'report.html?r=trazabilidad-binance-0x5227#' + m[1]); }
if (existe('assets/caso-vaneck.js')) { const s = lee('assets/caso-vaneck.js'); const re = /\{ n: (\d+), t: '([^']+)', d: '([^']+)' \}/g; let m; while ((m = re.exec(s))) E('inf', 'Caso Vaneck / Justin Sun · capítulo ' + m[1] + ': ' + m[2], 'caso-vaneck.html?cap=' + m[1], m[3]); }

/* ---------- documentos de investigación ---------- */
(function docs(dir) { for (const f of fs.readdirSync(p(dir), { withFileTypes: true })) { const r = dir + '/' + f.name; if (f.isDirectory()) { if (!/^(node_modules|codigo|bin|src|test|config)$/.test(f.name)) docs(r); continue; } if (!/\.md$/.test(f.name)) continue; const s = lee(r); const t = (s.match(/^#\s+(.+)$/m) || [])[1]; if (!t) continue; E('doc', sinMd(t), 'doc.html?f=' + r, sinMd((s.replace(/^#.*$/m, '').match(/^[^\n#|>`-][^\n]{60,}/m) || [''])[0]), sinMd((s.match(/^##+\s+.+$/gm) || []).join(' · '))); } })('investigacion/docs');
if (existe('investigacion/audits')) for (const d of fs.readdirSync(p('investigacion/audits'))) { const f = 'investigacion/audits/' + d + '/01-INFORME-AUDITORIA.md'; if (existe(f)) { const s = lee(f); E('doc', (s.match(/^#\s+(.+)$/m) || [])[1], 'doc.html?f=' + f, 'Auditoría con sus cuentas, la evidencia por transacción y las lecturas de la cadena.', (s.match(/^##+\s+.+$/gm) || []).join(' · ')); } }

/* ---------- novedades, cambios y artículos ---------- */
for (const x of j('data/novedades.json').novedades || []) E('nov', x.titulo, x.url || './', casoDe[x.caso] ? casoDe[x.caso].nombre : '', '', x.fecha);
if (existe('data/cambios.json')) { const K = j('data/cambios.json'); for (const c of K.cambios || []) E('cam', (K.tipos[c.tipo] || c.tipo) + ': ' + c.titulo, 'cambios.html#c-' + c.id, c.ahora, [c.antes, c.porque, c.detectado, casoDe[c.caso] ? casoDe[c.caso].nombre : ''].join(' '), c.fecha); }
if (existe('data/medium.json')) for (const a of j('data/medium.json').articulos || []) E('doc', 'Medium · ' + a.titulo, a.url, a.resumen, (a.temas || []).join(' '), a.fecha);

/* ---------- direcciones y transacciones citadas ---------- */
const esDir = (s) => typeof s === 'string' && (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(s) || /^0x[0-9a-fA-F]{40}$/.test(s));
const esTx = (s) => typeof s === 'string' && /^(0x)?[0-9a-fA-F]{64}$/.test(s);
const dirs = new Map(); const D = (a, t, f, u) => { if (!esDir(a) || !t) return; const k = a.toLowerCase(); const o = dirs.get(k) || dirs.set(k, { a, r: [], u: u || null }).get(k); if (!o.u && u) o.u = u; if (!o.r.some((x) => x.t === t)) o.r.push({ t: corta(t, 240), f }); };
const txs = new Map(); const T = (h, d, u) => { if (!esTx(h) || !d) return; const k = h.toLowerCase().replace(/^0x/, ''); if (!txs.has(k)) txs.set(k, { h, d: corta(d, 260), u }); };
const n0 = (v, d = 0) => Number(v).toLocaleString('es-ES', { maximumFractionDigits: d }); const fecha = (ms) => new Date(ms).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

const BIN = 'trazabilidad-binance-0x5227', FB = 'Informe del robo a Binance (v0.7)', ficha = (a) => 'report.html?r=' + BIN + '&abrir=ficha:' + encodeURIComponent(a);
const b = idx.informes.find((r) => r.slug === BIN);
if (b && existe('reports/' + BIN + '/detalle.json')) {
  const det = j('reports/' + BIN + '/detalle.json');
  if (b.semilla) D(b.semilla, 'Billetera desde la que se repartió el TRX del robo; el rastreo de TRON empieza en ella.', FB, ficha(b.semilla));
  for (const c of det.congeladas || []) { D(c.direccion, 'Bloqueada por Tether en TRON (lista negra de USDT)' + (c.usdt ? '; conserva ' + n0(c.usdt) + ' USDT' : '') + (c.bloqueadaHoy === false ? '; ya no figura bloqueada' : '') + '.', FB, ficha(c.direccion)); T(c.tx, 'Tether añade ' + c.direccion + ' a la lista negra de USDT en TRON el ' + fecha(c.t) + '.', 'report.html?r=' + BIN + '#reparto'); }
  const CL = { nodo: 'Punto de parada del rastreo: servicio o nodo', casa: 'Casa de cambio', puente: 'Contrato de puente hacia otra cadena', prestamo: 'JustLend (préstamos)', usdd: 'Sistema de la moneda USDD' };
  for (const x of det.destinos || []) D(x.direccion, (CL[x.clase] || x.clase) + (x.nombre ? ' («' + x.nombre + '»)' : '') + ': recibe ' + n0(x.atribuido) + ' $ atribuidos al robo en ' + n0(x.n) + ' llegadas (estimación).', FB, ficha(x.direccion));
  for (const x of det.retenido || []) D(x.direccion, 'Billetera del recorrido donde se quedó dinero: ' + n0(x.atribuido) + ' $ atribuidos al robo (estimación).', FB, ficha(x.direccion));
  for (const x of det.perdida || []) if (x.direccion) D(x.direccion, 'Punto donde se pierde el rastro (' + (x.clase || 'sin clasificar') + ')' + (x.nombre ? ', «' + x.nombre + '»' : '') + ': ' + n0(x.atribuido || 0) + ' $ atribuidos.' + (x.causa ? ' Causa: ' + x.causa : ''), FB, ficha(x.direccion));
  for (const x of det.symbiosisReceptores || []) D(x.receptor, 'Recibe en ' + x.cadena + ' dinero cruzado por el puente Symbiosis: ' + n0(x.usd) + ' $ en ' + x.n + ' llegadas.', FB, 'report.html?r=' + BIN + '#puentes');
  for (const x of det.chainflipDestinos || []) D(x.direccion, 'Destino en ' + x.cadena + ' de cambios hechos por Chainflip: ' + n0(x.usd) + ' $ en ' + x.n + ' llegadas.', FB, 'report.html?r=' + BIN + '#puentes');
  for (const x of det.casasVerificadas || []) { D(x.deposito, 'Dirección de depósito en ' + x.casa + ': ' + x.llegadas + ' llegadas por ' + n0(x.enviado) + ' $ (verificado en la cadena).', FB, ficha(x.deposito)); D(x.destino, 'Billetera de ' + x.casa + ' a la que barre una dirección de depósito del recorrido.', FB, ficha(x.destino)); for (const t of x.tx || []) T(t.tx || t, 'Llegada a una dirección de depósito de ' + x.casa + ' (' + x.deposito + ').', 'report.html?r=' + BIN + '#destinos'); }
  for (const x of det.ethQuieto || []) D(x.direccion, x.nombre + ': tiene hoy ' + n0(x.hoy, 2) + ' ETH; le entraron ' + n0(x.entra, 2) + ' y le salieron ' + n0(x.sale, 2) + ' (lectura del informe).', FB, 'report.html?r=' + BIN + '#ethereum');
  for (const x of det.ethTokens || []) D(x.direccion, 'Tiene ' + n0(x.saldoHoy) + ' ' + x.simbolo + ' en ' + x.cadena + (x.bloqueadaHoy ? ', bloqueados por el emisor' : '') + '.', FB, 'report.html?r=' + BIN + '#ethereum');
  for (const x of det.ethOrigen || []) D(x.direccion, 'Origen de fondos que entraron en la dirección del robo en Ethereum. Tipo: ' + x.tipo + '.', FB, 'report.html?r=' + BIN + '#ethereum');
  for (const x of det.sinResolverContratos || []) D(x.contrato, 'Contrato cuya salida no se pudo leer' + (x.nombre ? ' («' + x.nombre + '»)' : '') + ': ' + n0(x.importe) + ' $ atribuidos.', FB, ficha(x.contrato));
  for (const x of det.usdt0 || []) { T(x.tx, 'Envío por el puente USDT0 hacia ' + x.cadena + ': ' + n0(x.enviado, 2) + ' $ enviados, ' + (x.recibido ? n0(x.recibido, 2) + ' $ recibidos' : 'sin llegada registrada') + ' (' + x.estado + ').', 'report.html?r=' + BIN + '#puentes'); D(x.destino, 'Recibe en ' + x.cadena + ' un envío del puente USDT0.', FB, 'report.html?r=' + BIN + '#puentes'); }
  for (const x of det.arkham || []) T(x.tx, 'Transferencia que cita Arkham y que el informe contrasta (' + (x.t || '').slice(0, 10) + '). La etiqueta es de Arkham, no nuestra.', 'report.html?r=' + BIN + '#cruces');
  for (const x of det.capitalItems || []) for (const t of [].concat(x.tx || [])) T(typeof t === 'string' ? t : t && t.tx, 'Parte del capital robado: ' + x.nombre + '.', 'report.html?r=' + BIN + '#resumen');
  for (const a of det.ethActivos || []) for (const e of a.entradas || []) T(e.hash, 'Entrada de ' + a.activo + ' en la dirección del robo en Ethereum.', 'report.html?r=' + BIN + '#ethereum');
  for (const e of (det.ethDirecto && det.ethDirecto.entradas) || []) T(e.hash, 'Entrada de ETH en la dirección del robo en Ethereum.', 'report.html?r=' + BIN + '#ethereum');
}
const FV = 'Caso Vaneck / Justin Sun';
if (existe('data/direcciones-conocidas.json')) for (const [a, x] of Object.entries(j('data/direcciones-conocidas.json').direcciones || {})) D(a, (x.nombre ? x.nombre + '. ' : '') + (x.papel || '') + (x.atribucion ? ' Atribución: ' + x.atribucion + '.' : ''), x.fuente || FV, 'caso-vaneck.html');
if (existe('reports/caso-vaneck-sun/hechos.json')) for (const t of j('reports/caso-vaneck-sun/hechos.json').transferencias || []) { T(t.tx, n0(t.valor) + ' ' + t.simbolo + ' de ' + t.de + ' a ' + t.a + ' el ' + t.fecha + ' (verificado en la cadena).', 'caso-vaneck.html?cap=3'); D(t.de, 'Envía ' + n0(t.valor) + ' ' + t.simbolo + ' a ' + t.a + ' el ' + t.fecha + '.', FV, 'caso-vaneck.html?cap=3'); D(t.a, 'Recibe ' + n0(t.valor) + ' ' + t.simbolo + ' de ' + t.de + ' el ' + t.fecha + '.', FV, 'caso-vaneck.html?cap=3'); }
if (existe('reports/caso-vaneck-sun/energia.json')) (function rec(o, cap) { if (Array.isArray(o)) return o.forEach((x) => rec(x, cap)); if (!o || typeof o !== 'object') return; const a = o.direccion || o.cuenta; const t = o.nombre || o.etiqueta || o.papel; if (esDir(a) && typeof t === 'string') D(a, t + (o.nota && typeof o.nota === 'string' ? '. ' + o.nota : ''), FV + ' (ampliación del 5-nov)', 'caso-vaneck.html?cap=' + cap); for (const [k, v] of Object.entries(o)) rec(v, /^cap(\d+)$/.test(k) ? k.slice(3) : cap); })(j('reports/caso-vaneck-sun/energia.json'), 7);
for (const [slug, f, u] of [[BIN, 'reports/' + BIN + '/seguimiento.json', 'report.html?r=' + BIN + '#ficha-caso']]) if (existe(f)) { const s = j(f); for (const a of (s.ethereum && s.ethereum.direcciones) || []) D(a, 'Dirección de Ethereum vigilada en el seguimiento del caso (cada ' + s.ethereum.cadaMinutos + ' minutos).', 'Seguimiento del caso', u); for (const a of (s.tron && s.tron.direcciones) || []) D(a, s.tron.activo ? 'Cuenta de TRON vigilada en el seguimiento del caso.' : 'Cuenta de TRON del robo; su vigilancia está parada desde el ' + s.tron.paradoEl + '.', 'Seguimiento del caso', u); }

/* ---------- comprobaciones y escritura ---------- */
const cuenta = (k) => entradas.filter((e) => e.k === k).length;
const problemas = []; if (cuenta('pag') < 6) problemas.push('pocas páginas (' + cuenta('pag') + ')'); if (cuenta('inf') < 10) problemas.push('pocos informes y capítulos (' + cuenta('inf') + ')'); if (cuenta('nov') < 1) problemas.push('sin novedades'); if (dirs.size < 50) problemas.push('pocas direcciones (' + dirs.size + ')'); if (txs.size < 20) problemas.push('pocas transacciones (' + txs.size + ')');
const urls = new Set(); for (const e of entradas) { const u = e.u.split('#')[0]; if (/^https?:/.test(u)) continue; const f = u.startsWith('doc.html?f=') ? u.slice(11) : u.split('?')[0] || 'index.html'; if (f !== './' && !existe(f === './' ? 'index.html' : f)) urls.add(f); }
if (urls.size) problemas.push('enlaces a ficheros que no existen: ' + [...urls].slice(0, 5).join(', '));
if (problemas.length) { console.error('ERROR busqueda-indice: ' + problemas.join('; ') + '. No se escribe nada.'); process.exit(1); }
// La fecha del índice es la de su contenido más reciente (no la de hoy): así el fichero solo cambia cuando cambia lo indexado.
const ultima = entradas.map((e) => e.f).filter(Boolean).sort().pop() || null;
const out = { version: 1, generado: ultima, nota: 'Índice del buscador de la web. Se genera de los ficheros publicados (tools/equipoia/busqueda-indice.cjs). Las direcciones llevan lo que dicen de ellas los informes, con su fuente; una atribución de terceros es una atribución, no un hecho.', entradas, direcciones: [...dirs.values()], transacciones: [...txs.values()] };
fs.writeFileSync(p('data', 'busqueda.json'), JSON.stringify(out) + '\n');
console.log('OK busqueda.json: ' + entradas.length + ' entradas (' + ['pag', 'inf', 'doc', 'cam', 'nov'].map((k) => k + ' ' + cuenta(k)).join(', ') + '), ' + dirs.size + ' direcciones, ' + txs.size + ' transacciones, ' + Math.round(fs.statSync(p('data', 'busqueda.json')).size / 1024) + ' KB');
