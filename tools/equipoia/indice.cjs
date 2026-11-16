// ÍNDICE DE FUNCIONES de la web (indice.html): recorre una copia local de la web con un navegador sin ventana y, de cada herramienta,
// gráfico y tabla, saca su foto y su enlace directo. Escribe data/indice.json y assets/img/indice/*.webp en la carpeta de salida.
//
// Uso: node indice.cjs <carpeta de la copia de la web> <carpeta de salida>
//   - Solo LEE la copia de la web (la sirve él mismo en 127.0.0.1, puerto libre) y lo que esas páginas lean por su cuenta.
//   - No escribe nada en la salida si el resultado no pasa las comprobaciones del final (código de salida 2).
//   - Cada página se carga UNA vez. Tarda unos 6 minutos.
// La regla de troceo (cada trozo de página pertenece a un solo título, dos tarjetas nunca enseñan lo mismo) está en indice-en-pagina.js.
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os'), http = require('http');
const [REPO, SALIDA] = process.argv.slice(2).map((p) => path.resolve(p));
if (!REPO || !SALIDA || !fs.existsSync(path.join(REPO, 'herramientas.html'))) { console.error('uso: node indice.cjs <copia de la web> <salida>'); process.exit(1); }
const NAVEGADORES = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'];
const NAVEGADOR = NAVEGADORES.find((p) => fs.existsSync(p));
const EN_PAGINA = fs.readFileSync(path.join(__dirname, 'indice-en-pagina.js'), 'utf8');
const ANCHO = 1280, ALTO = 900, TOPE = 760, ESCALA = 0.5;   // fotos de 640 px de ancho como mucho, en WebP
const PUERTO_NAV = 9300 + Math.floor(Math.random() * 400);

// Qué páginas se recorren y cómo se enseñan en el índice.
const FUNCIONES = [
  { id: 'herramientas', titulo: 'Herramientas', u: 'herramientas.html', espera: 14000 },
  { id: 'mercado', titulo: 'Mercado', u: 'mercado.html', espera: 10000, plano: true },
];
// Páginas que son UNA función en sí mismas (su contenido depende de lo que escriba el visitante): una tarjeta con la foto de su cabecera.
const SUELTAS = [{ u: 'fundamentales.html', t: 'Laboratorio de fundamentales', et: 'Página propia', grupo: 'Fundamentales', seccion: 'herramientas', espera: 5000 }];
// Las investigaciones salen de reports/index.json (título e imagen de portada); aquí solo se dice en qué página vive cada una.
const PAGINA_DE = { 'caso-vaneck-sun': 'caso-vaneck.html', 'sunswap-microscopio': 'sunswap.html', 'justlend-liquidez': 'justlend.html' };
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.csv': 'text/csv; charset=utf-8', '.md': 'text/plain; charset=utf-8' };

function servir() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(REPO, p);
      if (req.method !== 'GET' || !(f === REPO || f.startsWith(REPO + path.sep))) { res.writeHead(403); return res.end(); }
      fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(b); });
    });
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}
const dibujo = (e) => e.svg || e.canvas || e.tabla || e.campo || e.barras;

// De los trozos medidos de una página, cuáles tienen tarjeta y cómo se agrupan.
// Entran: toda pestaña (ninguna se queda sin tarjeta), su resumen si lo tiene, y todo trozo con gráfico, tabla o calculadora. Los de solo texto, no.
function tarjetas(u, entradas, { conPestanas, plano }) {
  const vale = (e) => e.foto && e.modo !== 'zona' && (e.modo === 'pestana' || e.modo === 'resumen' || dibujo(e) || (plano && e.h >= 300));
  const res = new Map(entradas.filter((e) => e.modo === 'resumen').map((e) => [e.tab, e]));
  const orden = [], vistos = new Set();
  for (const e of entradas) { if (e.modo === 'resumen') continue; if (e.tab && res.has(e.tab) && !vistos.has(e.tab)) { vistos.add(e.tab); orden.push(res.get(e.tab)); } orden.push(e); }
  const forzadas = new Set();
  if (conPestanas) for (const tab of new Set(orden.map((e) => e.tab).filter(Boolean))) if (!orden.some((e) => e.tab === tab && vale(e))) { const e = orden.find((x) => x.tab === tab && x.foto); if (e) forzadas.add(e); }
  return orden.filter((e) => vale(e) || forzadas.has(e)).map((e) => {
    const entera = e.modo === 'pestana' || forzadas.has(e), miga = e.migas[e.migas.length - 1] || '';
    const grupo = conPestanas ? e.zona : (plano ? '' : (e.migas[0] || ''));
    return { t: entera ? e.pestana : e.t, et: conPestanas ? (entera || !e.tab ? 'Herramienta' : 'Pestaña ' + e.pestana) : (miga !== grupo ? miga : ''), desc: entera ? e.t : e.desc, u: u + '#' + e.id, foto: e.foto, principal: conPestanas && (entera || !e.tab), grupo, tab: e.tab || '' };
  });
}
const agrupar = (ts) => { const gs = []; for (const t of ts) { let g = gs[gs.length - 1]; if (!g || g.nombre !== t.grupo) { g = { nombre: t.grupo, tarjetas: [] }; gs.push(g); } const { grupo, tab, ...resto } = t; g.tarjetas.push(resto); } return gs; };

(async () => {
  if (!NAVEGADOR) throw new Error('no se encuentra Edge ni Chrome en este equipo');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ix-')), FOTOS = path.join(tmp, 'fotos'), perfil = path.join(tmp, 'perfil'); fs.mkdirSync(FOTOS);
  const servidor = await servir(), BASE = 'http://127.0.0.1:' + servidor.address().port + '/';
  const nav = spawn(NAVEGADOR, ['--headless=new', '--remote-debugging-port=' + PUERTO_NAV, '--user-data-dir=' + perfil, '--window-size=' + ANCHO + ',' + ALTO, '--hide-scrollbars', '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
  let ws, n = 0; const espera = new Map();
  const cdp = (method, params = {}) => new Promise((ok, mal) => { const id = ++n; espera.set(id, { ok, mal }); ws.send(JSON.stringify({ id, method, params })); });
  const evalua = async (expr) => { const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text); return r.result.value; };
  const J = JSON.stringify;
  // Foto de un trozo: se baja hasta él, se vuelve a medir ya colocado y se fotografía tal como está en pantalla (sin redimensionar la página).
  async function foto(nombre, exprRect) {
    let r = await evalua(exprRect); if (!r || r.h < 110 || r.w < 200) return null;
    await evalua(`scrollTo(0, ${Math.max(0, Math.floor(r.y) - 20)})`); await pausa(450);
    // Hacer una foto provoca que algunas tablas se plieguen («Ver todo»): se hace una de prueba, se espera y se mide DESPUÉS.
    await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 10, clip: { x: 0, y: Math.max(0, Math.floor(r.y)), width: 20, height: 20, scale: 1 } }); await pausa(350);
    r = await evalua(exprRect); if (!r || r.h < 110) return null;
    await evalua(`scrollTo(0, ${Math.max(0, Math.floor(r.y) - 20)})`); await pausa(200);
    r = await evalua(exprRect); if (!r || r.h < 110) return null;
    const x = Math.max(0, Math.floor(r.x) - 14), y = Math.max(0, Math.floor(r.y) - 12);
    const f = await cdp('Page.captureScreenshot', { format: 'webp', quality: 78, clip: { x, y, width: Math.min(ANCHO - x, Math.ceil(r.w) + 28), height: Math.min(TOPE, Math.ceil(r.h) + 24), scale: ESCALA } });
    fs.writeFileSync(path.join(FOTOS, nombre), Buffer.from(f.data, 'base64')); return nombre;
  }
  async function abrirPagina(u, ms) { await cdp('Page.navigate', { url: BASE + u }); await pausa(ms); await evalua(EN_PAGINA + '; __ix.preparar()'); await pausa(500); }
  // Recorre una página y devuelve sus trozos medidos, cada uno con su foto.
  async function recorrer(u, ms, clave) {
    await abrirPagina(u, ms);
    const entradas = [], pila = [];
    for (const id of await evalua('__ix.ids()')) {
      if (!(await evalua(`__ix.abrir(${J(id)})`))) continue;
      const m = await evalua(`__ix.medir(${J(id)})`); if (!m) continue;
      while (pila.length && pila[pila.length - 1].n >= m.n) pila.pop(); m.migas = pila.map((q) => q.t); pila.push({ n: m.n, t: m.t });
      if (m.modo !== 'zona') m.foto = await foto(clave + '--' + id.replace(/[^a-z0-9-]/gi, '-') + '.webp', `__ix.rect(${J(id)})`);
      entradas.push(m);
    }
    for (const tb of await evalua('__ix.pestanas()')) {
      await evalua(`__ix.abrirPestana(${J(tb.zp)}, ${J(tb.tab)})`);
      const m = await evalua(`__ix.medirResumen(${J(tb.zp)}, ${J(tb.tab)})`); if (!m) continue;
      m.migas = []; m.foto = await foto(clave + '--' + m.id.replace(/[^a-z0-9-]/gi, '-') + '.webp', `__ix.rectResumen(${J(tb.zp)}, ${J(tb.tab)})`);
      entradas.push(m);
    }
    return entradas;
  }
  let salida;
  try {
    let lista = null; for (let i = 0; i < 60 && !lista; i++) { await pausa(250); try { lista = await (await fetch('http://127.0.0.1:' + PUERTO_NAV + '/json/list')).json(); } catch (e) { /* aún arrancando */ } }
    const pag = lista && lista.find((t) => t.type === 'page'); if (!pag) throw new Error('el navegador no arrancó');
    ws = new WebSocket(pag.webSocketDebuggerUrl); await new Promise((ok, mal) => { ws.onopen = ok; ws.onerror = () => mal(new Error('sin conexión con el navegador')); });
    ws.onmessage = (m) => { const j = JSON.parse(m.data); const e = espera.get(j.id); if (!e) return; espera.delete(j.id); if (j.error) e.mal(new Error(j.error.message)); else e.ok(j.result); };
    await cdp('Page.enable');
    await cdp('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: ALTO, deviceScaleFactor: 1, mobile: false });
    await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });

    // 1) Herramientas y Mercado: una tarjeta por función
    const secciones = [], avisos = [];
    for (const p of FUNCIONES) {
      const entradas = await recorrer(p.u, p.espera, p.id), ts = tarjetas(p.u, entradas, { conPestanas: !p.plano, plano: !!p.plano });
      const tabs = [...new Set(entradas.map((e) => e.tab).filter(Boolean))], sin = tabs.filter((t) => !ts.some((x) => x.tab === t));
      if (sin.length) avisos.push('pestañas sin tarjeta en ' + p.u + ': ' + sin.join(', '));
      secciones.push({ id: p.id, titulo: p.titulo, u: p.u, ts }); console.error(p.u, '·', entradas.length, 'títulos ·', ts.length, 'tarjetas');
    }
    // En la web hay dos cosas llamadas «Mercado»: una zona de Herramientas (los precios de hoy) y la página Mercado. En el índice van juntas.
    const herr = secciones.find((s) => s.id === 'herramientas'), merc = secciones.find((s) => s.id === 'mercado');
    if (herr && merc) {
      const suyas = herr.ts.filter((t) => t.grupo === 'Mercado'); herr.ts = herr.ts.filter((t) => t.grupo !== 'Mercado');
      merc.ts = [...suyas.map((t) => ({ ...t, grupo: '', t: t.t === 'Hoy' ? 'Mercado hoy: precios y miedo y codicia' : t.t, et: 'Está en Herramientas', desc: '', principal: false })), ...merc.ts];
    }
    // 2) Páginas que son una función en sí mismas
    for (const s of SUELTAS) {
      if (!fs.existsSync(path.join(REPO, s.u))) continue;
      await abrirPagina(s.u, s.espera);
      const f = await foto(s.u.replace(/\.html$/, '') + '--pagina.webp', `(() => { const m = document.querySelector('main'); if (!m) return null; const r = m.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: Math.min(r.height, ${TOPE}) }; })()`);
      const desc = await evalua(`(document.querySelector('meta[name="description"]') || {}).content || ''`);
      const sec = secciones.find((x) => x.id === s.seccion); if (f && sec) sec.ts.push({ t: s.t, et: s.et, desc: desc.slice(0, 220), u: s.u, foto: f, principal: true, grupo: s.grupo, tab: '' });
    }
    // 3) Investigaciones: una tarjeta por investigación (con su portada) y dentro, plegados, sus gráficos y tablas
    const informes = JSON.parse(fs.readFileSync(path.join(REPO, 'reports', 'index.json'), 'utf8')).informes || [], investigaciones = [];
    for (const inf of informes) {
      const u = PAGINA_DE[inf.slug] || ('report.html?r=' + inf.slug), fichero = u.split('?')[0];
      if (!fs.existsSync(path.join(REPO, fichero))) { avisos.push('no existe ' + fichero + ' (' + inf.slug + ')'); continue; }
      const entradas = await recorrer(u, 10000, inf.slug), ts = tarjetas(u, entradas, { conPestanas: false, plano: false });
      investigaciones.push({ titulo: inf.titulo, resumen: inf.resumen || '', u, portada: inf.imagen || '', grupos: agrupar(ts) }); console.error(u, '·', entradas.length, 'títulos ·', ts.length, 'tarjetas');
    }
    salida = { version: 1, generado: new Date().toISOString(), secciones: secciones.map((s) => ({ id: s.id, titulo: s.titulo, u: s.u, grupos: agrupar(s.ts) })), investigaciones };

    // 4) Comprobaciones: si algo no cuadra, NO se escribe nada (la web sigue con el índice anterior)
    const todas = [...salida.secciones, ...salida.investigaciones].flatMap((s) => s.grupos.flatMap((g) => g.tarjetas));
    const cuenta = (id) => (salida.secciones.find((s) => s.id === id) || { grupos: [] }).grupos.reduce((k, g) => k + g.tarjetas.length, 0);
    const problemas = [...avisos];
    if (cuenta('herramientas') < 20) problemas.push('Herramientas solo tiene ' + cuenta('herramientas') + ' tarjetas (mínimo 20)');
    if (cuenta('mercado') < 8) problemas.push('Mercado solo tiene ' + cuenta('mercado') + ' tarjetas (mínimo 8)');
    if (investigaciones.length < informes.length) problemas.push('faltan investigaciones: ' + investigaciones.length + ' de ' + informes.length);
    const enlaces = todas.map((t) => t.u), repes = enlaces.filter((x, i) => enlaces.indexOf(x) !== i); if (repes.length) problemas.push('enlaces repetidos: ' + repes.slice(0, 5).join(', '));
    for (const t of todas) { const f = path.join(FOTOS, t.foto); if (!fs.existsSync(f)) problemas.push('falta la foto ' + t.foto); else if (fs.statSync(f).size < 1500) problemas.push('foto casi vacía: ' + t.foto); if (!t.t || t.t.length < 3) problemas.push('tarjeta sin título: ' + t.u); }
    for (const i of investigaciones) if (i.portada && !fs.existsSync(path.join(REPO, i.portada))) problemas.push('no existe la portada ' + i.portada);
    if (problemas.length) { console.error('NO VÁLIDO:\n - ' + problemas.join('\n - ')); process.exitCode = 2; return; }

    // 5) Escribir: solo las fotos que usa alguna tarjeta
    const dImg = path.join(SALIDA, 'assets', 'img', 'indice'), dDat = path.join(SALIDA, 'data');
    fs.rmSync(dImg, { recursive: true, force: true }); fs.mkdirSync(dImg, { recursive: true }); fs.mkdirSync(dDat, { recursive: true });
    let peso = 0; for (const t of todas) { const b = fs.readFileSync(path.join(FOTOS, t.foto)); peso += b.length; fs.writeFileSync(path.join(dImg, t.foto), b); }
    fs.writeFileSync(path.join(dDat, 'indice.json'), JSON.stringify(salida, null, 1) + '\n');
    console.log(JSON.stringify({ ok: true, funciones: cuenta('herramientas') + cuenta('mercado'), investigaciones: investigaciones.length, fotos: todas.length, kb: Math.round(peso / 1024) }));
  } finally {
    try { if (ws) ws.close(); } catch (e) { /* ok */ }
    nav.kill(); servidor.close(); await pausa(700); try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* el navegador aún lo suelta */ }
  }
})().catch((e) => { console.error('ERROR', e.message); process.exit(1); });
