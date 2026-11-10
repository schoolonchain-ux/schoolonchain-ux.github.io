/* Marca del sitio: nombre, lema, redes y aviso legal. Se edita aquí y se aplica en la portada y en todos los paneles. */
(function () {
  const M = (window.MARCA = {
    nombre: 'School On-Chain',
    sub: 'The On-Chain Observatory',
    lema: 'Blockchain intelligence. Evidence over speculation.',
    lemaEs: 'Sin hype. Sin señales. Sin conclusiones sin demostrar.',
    enlaces: [
      { t: 'Telegram', u: 'https://t.me/SchoolOnChainIntel', k: 'tg' },
      { t: '@School_On_Chain', u: 'https://x.com/School_On_Chain', k: 'x' },
      { t: '@TRX_TRONSCHOOL', u: 'https://x.com/TRX_TRONSCHOOL', k: 'x' },
    ],
    // Barra principal y enlaces del pie: se definen aquí una vez y valen para todas las páginas.
    nav: [
      { t: 'Investigaciones', u: './#informes', k: 'inv' },
      { t: 'Herramientas', u: 'herramientas.html', k: 'her' },
      { t: 'Fundamentales', u: 'fundamentales.html', k: 'fun' },
      { t: 'Método', u: 'como-investigamos.html', k: 'met', titulo: 'Cómo investigamos, de dónde sale cada cifra y el registro de cambios' },
      { t: 'Acerca', u: 'acerca.html', k: 'ace' },
      { t: 'Buscar', u: 'buscar.html', k: 'bus', titulo: 'Buscar en informes, documentos y novedades, o por dirección o transacción' },
    ],
    pie: [
      ['Investigaciones', [['Casos', './#informes'], ['Archivo por fecha', 'archivo.html'], ['Registro de cambios', 'cambios.html']]],
      ['Herramientas', [['Herramientas en vivo', 'herramientas.html'], ['Laboratorio de fundamentales', 'fundamentales.html'], ['Buscar', 'buscar.html']]],
      ['Método', [['Cómo investigamos', 'como-investigamos.html'], ['De dónde sale cada cifra', 'datos.html'], ['Registro de cambios', 'cambios.html']]],
      ['El proyecto', [['Acerca y contacto', 'acerca.html'], ['Novedades y RSS', 'novedades.html'], ['Repositorio y datos', 'https://github.com/schoolonchain-ux/schoolonchain-ux.github.io']]],
    ],
    aviso: 'Proyecto independiente. Las marcas de terceros que aparecen (Binance, TRON, Tether…) pertenecen a sus titulares; este sitio no está afiliado a ellas. Nada de lo publicado es consejo de inversión.',
  });
  const SVG = {
    x: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    tg: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>',
  };
  M.icono = (k) => SVG[k] || '';
  // enlaces como elementos (para usarlos desde cualquier página)
  M.enlacesEl = (cls) => M.enlaces.map((e) => { const a = document.createElement('a'); a.className = cls || 'soc'; a.href = e.u; a.target = '_blank'; a.rel = 'noopener'; a.innerHTML = SVG[e.k] + '<span>' + e.t + '</span>'; a.title = e.t; return a; });
  // Qué entrada de la barra corresponde a la página abierta (las páginas de caso cuentan como Investigaciones).
  M.paginaActual = () => { const f = (location.pathname.split('/').pop() || 'index.html').toLowerCase(); return { 'herramientas.html': 'her', 'fundamentales.html': 'fun', 'datos.html': 'met', 'como-investigamos.html': 'met', 'cambios.html': 'met', 'acerca.html': 'ace', 'novedades.html': 'ace', 'buscar.html': 'bus', 'index.html': 'inv', 'report.html': 'inv', 'caso-vaneck.html': 'inv', 'archivo.html': 'inv' }[f] || ''; };
  M.navEl = () => { const act = M.paginaActual(); const enPortada = /^(index\.html)?$/.test((location.pathname.split('/').pop() || '').toLowerCase()); return M.nav.map((e) => { const a = document.createElement('a'); a.className = 'nv-sitio' + (e.k === act ? ' on' : ''); a.href = e.k === 'inv' && enPortada ? '#informes' : e.u; a.textContent = e.t; if (e.titulo) a.title = e.titulo; return a; }); };
  document.addEventListener('DOMContentLoaded', () => {
    // barra principal: la misma en todas las páginas; las que tienen capítulos propios los añaden después de estos enlaces
    const nv = document.querySelector('.topbar nav'); if (nv) nv.replaceChildren(...M.navEl());
    // marca en la barra superior
    const b = document.querySelector('.topbar .brand');
    if (b) { b.innerHTML = '<span class="dot"></span><span class="bn">' + M.nombre + '<small>' + M.sub + '</small></span>'; }
    const tb = document.querySelector('.topbar .wrap');
    if (tb) { const box = document.createElement('div'); box.className = 'socs'; M.enlacesEl('soc').forEach((a) => box.append(a)); { const r = document.createElement('a'); r.className = 'soc'; r.href = 'novedades.html'; r.title = 'Novedades y canal RSS: qué hay de nuevo y cómo recibirlo'; r.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><circle cx="5" cy="19" r="2.6"/><path d="M2.4 9.6v3.5a8.5 8.5 0 0 1 8.5 8.5h3.5c0-6.6-5.4-12-12-12z"/><path d="M2.4 2.4v3.5c8.7 0 15.7 7 15.7 15.7h3.5C21.6 11 13 2.4 2.4 2.4z"/></svg><span>RSS</span>'; box.append(r); } const th = document.getElementById('theme'); tb.insertBefore(box, th); }
    // pie de marca
    const main = document.querySelector('main.wrap');
    if (main) {
      const f = document.createElement('footer'); f.className = 'marca';
      f.innerHTML = '<div class="mt"><b>' + M.nombre + '</b> · ' + M.sub + '<div class="ml">' + M.lema + '</div><div class="ml2">' + M.lemaEs + '</div></div>';
      const pn = document.createElement('nav'); pn.className = 'pie-nav'; pn.setAttribute('aria-label', 'Secciones del sitio'); M.pie.forEach(([tit, enl]) => { const c = document.createElement('div'); const b = document.createElement('b'); b.textContent = tit; c.append(b); enl.forEach(([t, u]) => { const a = document.createElement('a'); a.href = u; a.textContent = t; if (/^https?:/.test(u)) { a.target = '_blank'; a.rel = 'noopener'; } c.append(a); }); pn.append(c); }); f.append(pn);
      const s = document.createElement('div'); s.className = 'ms'; M.enlacesEl('soc big').forEach((a) => s.append(a)); f.append(s);
      const av = document.createElement('p'); av.className = 'av'; av.textContent = M.aviso; f.append(av);
      // En la portada el contenido principal va dentro de .lay con los dos laterales; el pie se pone DESPUÉS de todo
      // (si fuera dentro de <main>, en pantallas normales y móvil los laterales saldrían debajo del pie).
      const lay = document.querySelector('.lay');
      // El pie va siempre DESPUÉS del contenido principal y fuera de él: las páginas de caso y el visor vacían <main> al pintar y se lo llevaban por delante.
      const w = document.createElement('div'); w.className = 'wrap pie-sitio'; w.append(f); (lay || main).after(w);
    }
  });
})();
