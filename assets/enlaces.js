/* Enlace propio para cada título de la página (gráfico, tabla, bloque). Lo usan el índice (indice.html) y el botón de copiar enlace.
   No cambia nada de la página: solo añade un nombre a cada título, un botón de «copiar enlace» y, al llegar con un enlace, baja hasta él. */
(() => {
  const PRUEBA = false;
  const raiz = () => document.querySelector('main') || document.body;
  const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
  const texto = (h) => { const c = h.cloneNode(true); c.querySelectorAll('.ix-enl').forEach((x) => x.remove()); return c.textContent.replace(/\s+/g, ' ').trim(); };
  const esTitulo = (e) => /^H[234]$/.test(e.tagName);
  const marcado = (b) => b.classList.contains('on') || b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-selected') === 'true';
  const ICONO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>';

  // Lo que cuelga directamente de un título: lo que hay entre él y el siguiente título.
  function propios(h) {
    const out = []; let s = h.nextElementSibling;
    while (s && !esTitulo(s)) { out.push(s); s = s.nextElementSibling; }
    if (!out.length && h.parentElement && h.parentElement !== raiz()) { s = h.parentElement.nextElementSibling; while (s && !esTitulo(s) && !s.querySelector('h2,h3,h4')) { out.push(s); s = s.nextElementSibling; } }
    return out;
  }
  function tipo(els) {
    const hay = (q) => els.some((e) => e.matches(q) || e.querySelector(q));
    const svgs = els.flatMap((e) => (e.matches('svg') ? [e] : [...e.querySelectorAll('svg')]));
    const grande = svgs.some((s) => { const vb = (s.getAttribute('viewBox') || '').split(/[ ,]+/).map(Number); return (vb[2] || 0) > 150 || parseFloat(s.getAttribute('width')) > 150 || s.getBoundingClientRect().width > 150; });
    if (grande || hay('canvas')) return 'grafico';
    if (hay('form, input[type="text"], input[type="number"], input[type="search"], input:not([type]), select, textarea')) return 'calculadora';
    if (hay('table')) return 'tabla';
    return 'texto';
  }
  // Botones de elegir (7 días / 30 días, En dólares / En porcentaje): los que están encendidos dentro de un grupo de dos o más.
  function grupos(h) { return propios(h).flatMap((e) => [...e.querySelectorAll('button')]).filter((b) => !b.classList.contains('ix-enl') && b.parentElement.querySelectorAll(':scope > button').length >= 2); }
  const elegidos = (h) => grupos(h).filter(marcado).map((b) => slug(b.textContent)).filter(Boolean);

  const titulos = () => [...raiz().querySelectorAll('h2, h3, h4')].filter((h) => !h.closest('nav, table, .zona, dialog, .topbar, [data-ix-no]') && texto(h).length > 2);
  const PORDEFECTO = new Map();   // cómo estaba cada bloque la primera vez que se vio (para no alargar el enlace si no has cambiado nada)

  function tostada(titulo, enlace) {
    let o = document.querySelector('.ix-tostada'); if (!o) { o = document.createElement('div'); o.className = 'ix-tostada'; document.body.append(o); }
    o.textContent = ''; const b = document.createElement('b'); b.textContent = titulo; const s = document.createElement('span'); s.textContent = enlace; o.append(b, s);
    o.classList.add('on'); clearTimeout(tostada.t); tostada.t = setTimeout(() => o.classList.remove('on'), 3200);
  }
  function enlaceDe(h) {
    const u = new URL(location.href); u.hash = ''; u.searchParams.delete('ver');
    const ahora = elegidos(h), def = PORDEFECTO.get(h.id) || [];
    if (ahora.length && ahora.join('.') !== def.join('.')) u.searchParams.set('ver', ahora.join('.'));
    return u.toString().replace(/\+/g, '%20') + '#' + h.id;
  }
  async function copiar(h, boton) {
    const enlace = enlaceDe(h);
    try { await navigator.clipboard.writeText(enlace); boton.classList.add('ok'); setTimeout(() => boton.classList.remove('ok'), 1500); tostada('Enlace copiado · ' + texto(h), enlace); }
    catch (e) { tostada('No se pudo copiar solo; este es el enlace:', enlace); }
    try { history.replaceState(null, '', enlace); } catch (e) { /* ok */ }
  }

  /* ---------- una pasada: nombra cada título y le pone su botón ---------- */
  function pasada() {
    const usados = new Set(), lista = [], pila = [];
    for (const h of titulos()) {
      const t = texto(h);
      if (!h.dataset.ix && h.id) h.dataset.ixFijo = h.id;                    // el título ya tenía nombre propio en la web: se respeta
      let base = h.dataset.ixFijo || slug(t) || 'bloque', id = base, n = 2;
      const ajeno = (x) => { const o = document.getElementById(x); return o && o !== h && !o.dataset.ix; };
      while (usados.has(id) || ajeno(id)) id = base + '-' + (n++);
      usados.add(id);
      if (h.id !== id) h.id = id;
      if (h.dataset.ix !== id) h.dataset.ix = id;
      if (!h.querySelector(':scope > .ix-enl')) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'ix-enl'; b.title = 'Copiar el enlace directo a esto'; b.setAttribute('aria-label', 'Copiar el enlace directo a: ' + t); b.innerHTML = ICONO;
        b.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); copiar(h, b); });
        h.append(b);
      }
      if (!PORDEFECTO.has(id)) PORDEFECTO.set(id, elegidos(h));
      // para el índice: de quién cuelga (título de arriba y, si está en una pestaña, cuál)
      const nv = +h.tagName[1]; while (pila.length && pila[pila.length - 1].nv >= nv) pila.pop();
      const migas = pila.map((p) => p.t); const pan = h.closest('.zpan');
      if (pan) { const bt = pan.closest('.zp') && pan.closest('.zp').querySelector('.ztabs button[data-tab="' + pan.dataset.tab + '"]'); if (bt) migas.push('Pestaña ' + bt.textContent.trim()); }
      const els = propios(h); const p = els.find((e) => e.matches('p, .sub') && e.textContent.trim().length > 20);
      lista.push({ id, t, n: nv, migas, x: ((h.previousElementSibling && h.previousElementSibling.matches('.kick') ? h.previousElementSibling.textContent.trim() + '. ' : '') + (p ? p.textContent.replace(/\s+/g, ' ').trim().slice(0, 200) : '')) });
      pila.push({ nv, t });
    }
    llegar(); guardar(lista);
  }

  /* ---------- llegar con un enlace: abre la pestaña si hace falta, pone los botones como estaban y baja hasta el título ---------- */
  const destino = decodeURIComponent((location.hash || '').slice(1));
  const quiero = (new URLSearchParams(location.search).get('ver') || '').split('.').filter(Boolean);
  let intentos = 0, colocado = false, movido = false;
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) => addEventListener(ev, () => { movido = true; }, { once: true, passive: true }));
  function llegar() {
    if (!destino || colocado) return;
    if (destino.startsWith('pestana-')) {   // enlace al principio de una pestaña (su resumen)
      const pan = document.querySelector('.zpan[data-tab="' + destino.slice(8).replace(/[^a-z0-9-]/gi, '') + '"]'); if (!pan) return;
      const bt = pan.closest('.zp') && pan.closest('.zp').querySelector('.ztabs button[data-tab="' + pan.dataset.tab + '"]');
      if (pan.hidden && bt && intentos < 10) { intentos++; bt.click(); setTimeout(pasada, 300); return; }
      colocado = true; const ir = () => { if (!movido) (bt || pan).scrollIntoView({ block: 'start', behavior: 'instant' }); }; ir(); [500, 1300, 2600].forEach((ms) => setTimeout(ir, ms)); return;
    }
    const h = document.getElementById(destino); if (!h || !h.dataset.ix) return;
    const pan = h.closest('.zpan[hidden]');
    if (pan && intentos < 10) { const bt = pan.closest('.zp') && pan.closest('.zp').querySelector('.ztabs button[data-tab="' + pan.dataset.tab + '"]'); if (bt) { intentos++; bt.click(); setTimeout(pasada, 300); return; } }
    const det = h.closest('details:not([open])'); if (det) det.open = true;
    if (quiero.length && intentos < 10) {
      const falta = grupos(h).find((b) => quiero.includes(slug(b.textContent)) && !marcado(b));
      if (falta) { intentos++; falta.click(); setTimeout(pasada, 350); return; }
    }
    colocado = true;
    const bajar = () => { if (movido) return; const o = document.getElementById(destino); if (o) o.scrollIntoView({ block: 'start', behavior: 'instant' }); };
    const luz = () => { const o = document.getElementById(destino); if (o) { o.classList.remove('ix-luz'); void o.offsetWidth; o.classList.add('ix-luz'); } };
    bajar(); luz(); [500, 1300, 2600].forEach((ms) => setTimeout(bajar, ms)); setTimeout(luz, 1400);
  }

  /* ---------- (solo en la prueba) guarda la lista de títulos de esta página para el índice ---------- */
  let tGuardar = null, ultima = '';
  function guardar(lista) {
    if (!PRUEBA || !lista.length) return;
    const q = new URLSearchParams(location.search), keep = new URLSearchParams(); ['r', 'f', 'token'].forEach((k) => { if (q.get(k)) keep.set(k, q.get(k)); });
    const pag = location.pathname.replace(/^\//, '') || 'index.html', u = pag + (keep.toString() ? '?' + keep : '');
    const cuerpo = JSON.stringify({ u, titulo: /^School On-Chain/.test(document.title) ? 'Portada' : document.title.replace(/\s*·\s*(School On-Chain|Informes on-chain).*$/, ''), entradas: lista });
    if (cuerpo === ultima) return; ultima = cuerpo;
    clearTimeout(tGuardar); tGuardar = setTimeout(() => { fetch('/_ix/guardar', { method: 'POST', body: cuerpo }).catch(() => { /* la prueba sigue */ }); }, 1500);
  }

  function enMenu() { const nav = document.querySelector('.topbar nav'); if (nav && !nav.querySelector('.ix-nav')) { const a = document.createElement('a'); a.className = 'ix-nav'; a.href = 'indice.html'; a.textContent = 'Índice'; nav.prepend(a); } }
  function arrancar() {
    enMenu(); [300, 1200, 3000].forEach((ms) => setTimeout(enMenu, ms));
    pasada();
    let t = null; new MutationObserver(() => { clearTimeout(t); t = setTimeout(pasada, 250); }).observe(raiz(), { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})();
