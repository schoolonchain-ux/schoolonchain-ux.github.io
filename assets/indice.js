/* Índice de funciones (indice.html): pinta las tarjetas de data/indice.json, que genera tools/equipoia/indice.cjs.
   El índice va por TEMAS (de qué trata cada cosa), no por la página donde vive: el orden, los títulos y las frases
   están escritos a mano en tools/equipoia/indice-temas.json. Cada tarjeta lleva su foto y su enlace directo. */
(() => {
  const $ = (s) => document.querySelector(s);
  const el = (t, a = {}, ...k) => { const e = document.createElement(t); for (const [x, v] of Object.entries(a)) { if (x === 'class') e.className = v; else if (x.startsWith('on')) e.addEventListener(x.slice(2), v); else e.setAttribute(x, v); } e.append(...k.filter((c) => c !== null && c !== undefined && c !== '')); return e; };
  const ICONO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/></svg>';
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const fecha = (iso) => { const d = new Date(iso); return d.getUTCDate() + '-' + MESES[d.getUTCMonth()] + '-' + d.getUTCFullYear(); };

  function tostada(titulo, enlace) {
    let o = $('.ix-tostada'); if (!o) { o = el('div', { class: 'ix-tostada', role: 'status' }); document.body.append(o); }
    o.textContent = ''; o.append(el('b', {}, titulo), el('span', {}, enlace)); o.classList.add('on'); clearTimeout(tostada.t); tostada.t = setTimeout(() => o.classList.remove('on'), 3200);
  }
  // «Compartir»: copia el enlace directo (dirección completa de la web publicada).
  function compartir(u, titulo) {
    const b = el('button', { class: 'ix-comp', type: 'button', title: 'Copiar el enlace directo', 'aria-label': 'Copiar el enlace directo a: ' + titulo, onclick: async (ev) => {
      ev.preventDefault(); ev.stopPropagation(); const abs = new URL(u, location.href).href;
      try { await navigator.clipboard.writeText(abs); b.classList.add('ok'); setTimeout(() => b.classList.remove('ok'), 1500); tostada('Enlace copiado · ' + titulo, abs); } catch (x) { tostada('No se pudo copiar solo; este es el enlace:', abs); }
    } });
    b.innerHTML = ICONO + '<span>Compartir</span>'; return b;
  }
  // Una función: foto, título propio, para qué sirve y, en pequeño, dónde está en la web.
  const tarjeta = (t) => el('article', { class: 'ix-c' }, compartir(t.u, t.t),
    el('div', { class: 'im' }, el('img', { src: 'assets/img/indice/' + encodeURIComponent(t.foto), alt: '', loading: 'lazy', decoding: 'async' })),
    el('div', { class: 'tx' }, el('a', { class: 'ti', href: t.u }, t.t), t.desc && t.desc !== t.t ? el('p', {}, t.desc) : null, t.et ? el('div', { class: 'lugar' }, t.et) : null));
  function grupos(caja, gs) { gs.forEach((g) => { if (g.nombre) caja.append(el('div', { class: 'ix-sub' }, g.nombre)); const rej = el('div', { class: 'ix-rej' }); g.tarjetas.forEach((t) => rej.append(tarjeta(t))); caja.append(rej); }); }
  const cuantas = (gs) => gs.reduce((n, g) => n + g.tarjetas.length, 0);

  // Las investigaciones: una tarjeta cada una, con su portada; sus gráficos y tablas se despliegan solo si se piden.
  function investigaciones(sec, inv) {
    const rej = el('div', { class: 'ix-rej inv' }), dets = []; sec.append(rej);
    inv.forEach((i) => {
      const n = cuantas(i.grupos), det = el('div', { class: 'ix-det', hidden: '' }, el('h3', {}, i.titulo)); grupos(det, i.grupos); dets.push(det);
      const rotulo = 'Ver sus ' + n + ' gráficos y tablas';
      const mas = el('button', { class: 'ix-mas', type: 'button', 'aria-expanded': 'false', onclick: (ev) => {
        ev.preventDefault(); const abrir = det.hidden;
        dets.forEach((x) => { x.hidden = true; }); sec.querySelectorAll('.ix-mas').forEach((m) => { m.textContent = m.dataset.t + ' ▾'; m.setAttribute('aria-expanded', 'false'); });
        if (abrir) { det.hidden = false; mas.textContent = 'Ocultar sus gráficos ▴'; mas.setAttribute('aria-expanded', 'true'); det.scrollIntoView({ block: 'start' }); }
      } }, rotulo + ' ▾'); mas.dataset.t = rotulo;
      rej.append(el('article', { class: 'ix-c' }, compartir(i.u, i.titulo),
        el('div', { class: 'im' }, i.portada ? el('img', { src: i.portada, alt: '', loading: 'lazy', decoding: 'async', class: 'portada' }) : null),
        el('div', { class: 'tx' }, el('a', { class: 'ti', href: i.u }, i.titulo), i.resumen ? el('p', {}, i.resumen) : null, n ? mas : null)));
    });
    dets.forEach((x) => sec.append(x));
  }

  function pintar(d) {
    const todo = $('#ix-todo'), nav = $('#ix-pags'); todo.textContent = ''; nav.textContent = ''; let total = 0, nInv = 0;
    (d.temas || []).forEach((t) => {
      const n = cuantas(t.grupos), inv = t.investigaciones || []; if (!n && !inv.length) return; total += n; nInv += inv.length;
      nav.append(el('a', { href: '#' + t.id }, t.nombre, el('b', {}, String(n || inv.length))));
      const sec = el('section', { class: 'ix-pag', id: t.id }, el('h2', {}, t.nombre), t.desc ? el('p', { class: 'ix-de' }, t.desc) : null);
      grupos(sec, t.grupos); if (inv.length) investigaciones(sec, inv); todo.append(sec);
    });
    const dias = (Date.now() - new Date(d.generado).getTime()) / 864e5;
    $('#ix-resumen').textContent = total + ' funciones y ' + nInv + ' investigaciones, ordenadas por tema. Pulsa una tarjeta para abrirla justo ahí, o «Compartir» para copiar su enlace directo.';
    const nota = $('#ix-nota'); nota.textContent = 'Las fotos de las tarjetas son del ' + fecha(d.generado) + ' y se renuevan solas cada semana; lo que abres al pulsar es siempre la herramienta en vivo.' + (dias > 10 ? ' Aviso: llevan ' + Math.floor(dias) + ' días sin renovarse.' : '');
    nota.classList.toggle('viejo', dias > 10);
  }

  fetch('data/indice.json', { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(pintar)
    .catch((e) => { $('#ix-todo').textContent = ''; $('#ix-todo').append(el('p', { class: 'muted' }, 'No se pudo cargar el índice (' + e.message + '). Mientras tanto, todo sigue en Herramientas, Mercado y la portada.')); });
})();
