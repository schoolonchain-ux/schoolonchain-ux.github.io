/* Visor de documentos: doc.html?f=investigacion/docs/....md
   Lee el fichero Markdown de este mismo sitio y lo muestra con el diseño de la web (antes el navegador lo enseñaba como texto plano).
   Solo abre ficheros .md de la carpeta investigacion/. No ejecuta HTML que venga dentro del documento. */
(function () {
  const { el } = window.C;
  const app = document.getElementById('app');
  const REPO = 'https://github.com/schoolonchain-ux/schoolonchain-ux.github.io';
  const f = new URLSearchParams(location.search).get('f') || '';
  const valido = /^investigacion\/[A-Za-z0-9_\-./]+\.md$/.test(f) && !f.includes('..') && !f.includes('//');

  function error(titulo, texto) {
    app.replaceChildren(el('div', { class: 'doc-err' }, el('h2', null, titulo), el('p', { class: 'narr' }, texto), el('div', { class: 'actions', style: 'margin-top:10px' }, el('a', { class: 'btn primary', href: './' }, 'Ir a la portada'), el('a', { class: 'btn', href: 'caso-vaneck.html' }, 'Caso Vaneck / Justin Sun'))));
    document.title = 'Documento no disponible · School On-Chain';
  }
  if (!valido) return error('Documento no válido', 'Este visor solo abre los documentos de investigación publicados en esta web (carpeta investigacion/, ficheros .md).');

  const dir = f.slice(0, f.lastIndexOf('/') + 1);
  const nombre = f.slice(f.lastIndexOf('/') + 1);
  // De qué caso viene, para el botón de volver.
  const caso = /VANECK|vaneck/.test(f) ? { href: 'caso-vaneck.html', t: '← Volver al caso Vaneck / Justin Sun' } : /BINANCE|binance|0x5227|TRAZABILIDAD|HISTORIA-TRON|CATALOGO/.test(f) ? { href: 'report.html?r=trazabilidad-binance-0x5227', t: '← Volver al informe del hackeo' } : { href: './', t: '← Volver a la portada' };

  // Resuelve una ruta relativa al directorio del documento (sin salir del sitio).
  function resolver(h) {
    if (/^(https?:|mailto:|#)/i.test(h)) return h;
    const partes = (dir + h).split('/'); const out = [];
    for (const p of partes) { if (p === '..') out.pop(); else if (p !== '.' && p !== '') out.push(p); }
    return out.join('/');
  }
  function slug(t) { return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'seccion'; }
  const escapar = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  fetch(f, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }).then((md) => {
    if (!window.marked) throw new Error('No se pudo cargar el conversor de Markdown.');
    marked.use({ gfm: true, breaks: false, renderer: { html(tok) { return escapar(typeof tok === 'string' ? tok : tok.text || ''); } } });
    const cuerpo = el('article', { class: 'doc', html: marked.parse(md) });

    // Título: el primer encabezado del documento.
    const h1 = cuerpo.querySelector('h1');
    const titulo = h1 ? h1.textContent.trim() : nombre.replace(/\.md$/, '');
    document.title = titulo + ' · School On-Chain';
    const og = document.querySelector('meta[property="og:title"]'); if (og) og.setAttribute('content', titulo + ' · School On-Chain');

    // Enlaces: externos en pestaña nueva; otros .md del sitio pasan por este visor; el resto se resuelve respecto al documento.
    for (const a of cuerpo.querySelectorAll('a[href]')) {
      const h = a.getAttribute('href');
      if (/^https?:/i.test(h)) { a.target = '_blank'; a.rel = 'noopener'; continue; }
      if (h.startsWith('#') || /^mailto:/i.test(h)) continue;
      const r = resolver(h);
      a.setAttribute('href', /\.md(#.*)?$/.test(r) ? 'doc.html?f=' + encodeURIComponent(r.replace(/#.*$/, '')) + (r.includes('#') ? r.slice(r.indexOf('#')) : '') : r);
    }
    for (const img of cuerpo.querySelectorAll('img[src]')) { const s = img.getAttribute('src'); if (!/^(https?:|data:)/i.test(s)) img.setAttribute('src', resolver(s)); img.loading = 'lazy'; }
    // Tablas con desplazamiento horizontal (direcciones y hashes largos).
    for (const t of cuerpo.querySelectorAll('table')) { const w = el('div', { class: 'tabla' }); t.replaceWith(w); w.append(t); }
    // Índice a partir de los encabezados.
    const usados = new Set(); const toc = [];
    for (const h of cuerpo.querySelectorAll('h2, h3')) {
      let id = slug(h.textContent); let i = 2; while (usados.has(id)) id = slug(h.textContent) + '-' + i++; usados.add(id); h.id = id;
      toc.push(el('a', { href: '#' + id, class: h.tagName === 'H3' ? 'h3' : '' }, h.textContent));
    }

    const cabecera = el('header', { class: 'doc-head' },
      el('span', { class: 'kick' }, 'Documento de investigación · ' + nombre),
      el('h1', null, titulo),
      el('div', { class: 'actions' },
        el('a', { class: 'btn primary', href: caso.href }, caso.t),
        el('a', { class: 'btn', href: f, target: '_blank', rel: 'noopener' }, 'Ver el texto original (.md) ↗'),
        el('a', { class: 'btn', href: REPO + '/blob/main/' + f, target: '_blank', rel: 'noopener' }, 'Ver en GitHub ↗')));
    const lateral = toc.length ? el('aside', { class: 'doc-toc' }, el('div', { class: 't' }, 'Contenido'), toc) : null;
    const pie = el('p', { class: 'doc-foot' }, 'Las atribuciones a personas o entidades son de terceros, no son prueba legal, y nada de lo publicado es consejo de inversión. Cada dirección y cada hash se pueden comprobar en TronScan o Etherscan.');
    app.replaceChildren(cabecera, lateral ? el('div', { class: 'doc-grid' }, lateral, cuerpo) : cuerpo, pie);
    if (location.hash) { const o = document.getElementById(location.hash.slice(1)); if (o) o.scrollIntoView(); }
  }).catch((e) => error('No se pudo abrir el documento', 'El fichero ' + f + ' no se ha podido leer (' + e.message + '). Puede que se haya movido; prueba desde la portada o en el repositorio: ' + REPO));
})();
