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
    aviso: 'Proyecto independiente. Las marcas de terceros que aparecen (Binance, TRON, Tether…) pertenecen a sus titulares; este sitio no está afiliado a ellas. Nada de lo publicado es consejo de inversión.',
  });
  const SVG = {
    x: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    tg: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>',
  };
  M.icono = (k) => SVG[k] || '';
  // enlaces como elementos (para usarlos desde cualquier página)
  M.enlacesEl = (cls) => M.enlaces.map((e) => { const a = document.createElement('a'); a.className = cls || 'soc'; a.href = e.u; a.target = '_blank'; a.rel = 'noopener'; a.innerHTML = SVG[e.k] + '<span>' + e.t + '</span>'; a.title = e.t; return a; });
  document.addEventListener('DOMContentLoaded', () => {
    // marca en la barra superior
    const b = document.querySelector('.topbar .brand');
    if (b) { b.innerHTML = '<span class="dot"></span><span class="bn">' + M.nombre + '<small>' + M.sub + '</small></span>'; }
    const tb = document.querySelector('.topbar .wrap');
    if (tb) { const box = document.createElement('div'); box.className = 'socs'; M.enlacesEl('soc').forEach((a) => box.append(a)); const th = document.getElementById('theme'); tb.insertBefore(box, th); }
    // pie de marca
    const main = document.querySelector('main.wrap');
    if (main) {
      const f = document.createElement('footer'); f.className = 'marca';
      f.innerHTML = '<div class="mt"><b>' + M.nombre + '</b> · ' + M.sub + '<div class="ml">' + M.lema + '</div><div class="ml2">' + M.lemaEs + '</div></div>';
      const s = document.createElement('div'); s.className = 'ms'; M.enlacesEl('soc big').forEach((a) => s.append(a)); f.append(s);
      const av = document.createElement('p'); av.className = 'av'; av.textContent = M.aviso; f.append(av);
      main.append(f);
    }
  });
})();
