/* Índice de funciones (indice.html): pinta las tarjetas de data/indice.json.
   El índice va por TEMAS (de qué trata cada cosa), no por la página donde vive. El orden, los títulos y las frases
   están escritos a mano en tools/equipoia/indice-temas.json; data/indice.json sale de ahí con tools/equipoia/indice-construir.cjs.
   Las tarjetas de las funciones son de texto (sin imágenes). Las investigaciones llevan su portada. */
(() => {
  const $ = (s) => document.querySelector(s);
  const el = (t, a = {}, ...k) => { const e = document.createElement(t); for (const [x, v] of Object.entries(a)) { if (x === 'class') e.className = v; else if (x.startsWith('on')) e.addEventListener(x.slice(2), v); else e.setAttribute(x, v); } e.append(...k.filter((c) => c !== null && c !== undefined && c !== '')); return e; };
  const ICONO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/></svg>';

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
  // Una función: título propio, para qué sirve, dónde está en la web y el botón de compartir.
  const tarjeta = (t) => el('article', { class: 'ix-c' },
    el('div', { class: 'tx' }, el('a', { class: 'ti', href: t.u }, t.t), t.desc ? el('p', {}, t.desc) : null),
    el('div', { class: 'pie' }, t.et ? el('span', { class: 'lugar' }, t.et) : null, compartir(t.u, t.t)));
  // Una investigación: su portada, su título y su resumen.
  const investigacion = (i) => el('article', { class: 'ix-c inv' },
    i.portada ? el('div', { class: 'im' }, el('img', { src: i.portada, alt: '', loading: 'lazy', decoding: 'async' })) : null,
    el('div', { class: 'tx' }, el('a', { class: 'ti', href: i.u }, i.titulo), i.resumen ? el('p', {}, i.resumen) : null),
    el('div', { class: 'pie' }, el('span', { class: 'lugar sin' }, 'Investigación'), compartir(i.u, i.titulo)));
  const cuantas = (gs) => gs.reduce((n, g) => n + g.tarjetas.length, 0);

  function pintar(d) {
    const todo = $('#ix-todo'), nav = $('#ix-pags'); todo.textContent = ''; nav.textContent = ''; let total = 0, nInv = 0;
    (d.temas || []).forEach((t) => {
      const n = cuantas(t.grupos), inv = t.investigaciones || []; if (!n && !inv.length) return; total += n; nInv += inv.length;
      nav.append(el('a', { href: '#' + t.id }, t.nombre, el('b', {}, String(n || inv.length))));
      const sec = el('section', { class: 'ix-pag', id: t.id }, el('h2', {}, t.nombre), t.desc ? el('p', { class: 'ix-de' }, t.desc) : null);
      t.grupos.forEach((g) => { if (g.nombre) sec.append(el('div', { class: 'ix-sub' }, g.nombre)); const rej = el('div', { class: 'ix-rej' }); g.tarjetas.forEach((c) => rej.append(tarjeta(c))); sec.append(rej); });
      if (inv.length) { const rej = el('div', { class: 'ix-rej inv' }); inv.forEach((i) => rej.append(investigacion(i))); sec.append(rej); }
      todo.append(sec);
    });
    $('#ix-resumen').textContent = total + ' funciones y ' + nInv + ' investigaciones, ordenadas por tema. Pulsa una tarjeta para abrirla justo ahí, o «Compartir» para copiar su enlace directo.';
  }

  fetch('data/indice.json', { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(pintar)
    .catch((e) => { $('#ix-todo').textContent = ''; $('#ix-todo').append(el('p', { class: 'muted' }, 'No se pudo cargar el índice (' + e.message + '). Mientras tanto, todo sigue en Herramientas, Mercado y la portada.')); });
})();
