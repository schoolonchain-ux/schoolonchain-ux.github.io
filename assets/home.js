/* Portada: lista de informes con cifras clave y una barra de reparto con leyenda. */
(async function () {
  const box = document.getElementById('cards');
  let idx;
  try { idx = await (await fetch('reports/index.json', { cache: 'no-cache' })).json(); } catch (e) { box.textContent = 'No se pudo cargar reports/index.json'; return; }
  box.textContent = '';
  const { el, m, n, pct } = C;
  // Novedades (data/novedades.json): la lista general va encima de las tarjetas; cada tarjeta lleva su última actualización.
  const NOV = window.NOVEDADES ? await window.NOVEDADES.cargar() : [];
  const nombres = Object.fromEntries(idx.informes.map((r) => [r.slug, r.caso || r.titulo])); nombres.medium = 'Medium';
  const listaNov = window.NOVEDADES && NOV.length ? window.NOVEDADES.lista(NOV, { limite: 6, titulo: 'Novedades · últimas actualizaciones', nombres }) : null;
  if (listaNov) box.parentNode.insertBefore(listaNov, box);
  // Intro: nº de casos abiertos y fecha de la última actualización (de reports/index.json y data/novedades.json) + la última novedad. Nada de esto se escribe a mano.
  { const k = document.getElementById('hero-kick'), N = window.NOVEDADES, casos = idx.informes.length;
    if (k && casos) k.textContent = (window.CASO ? CASO.resumenCasos(idx.informes) : casos + (casos === 1 ? ' caso' : ' casos')) + (NOV[0] && N ? ' · actualizado el ' + N.fecha(NOV[0].fecha) + ', ' + N.hora(NOV[0].fecha) : '');
    const hn = document.getElementById('hero-nov'); if (hn && NOV[0] && N) hn.append(N.linea(NOV[0])); }
  for (const r of idx.informes) {
    const a = C.el('a', { class: 'rcard' + (r.caso ? ' destacada' : ''), href: r.url || 'report.html?r=' + encodeURIComponent(r.slug) });
    if (r.imagen) a.append(el('div', { class: 'rcard-img' }, el('img', { src: r.imagen, alt: r.imagenAlt || r.titulo, loading: 'lazy', width: '900', height: '560' })));   // imagen de cabecera (opcional, reports/index.json)
    a.append(
      r.caso ? el('span', { class: 'caso' }, 'Caso · ' + r.caso) : null,
      el('div', { class: 'chips' }, (r.cadenas || []).map((c) => el('span', { class: 'chip' }, c)), el('span', { class: 'chip ver' }, r.version || ''), r.aviso ? el('span', { class: 'chip chip-aviso', title: r.aviso.titulo }, r.aviso.corto || 'Aviso') : null, window.CASO ? CASO.chips(r) : null),
      el('h3', null, r.titulo),
      el('p', null, r.resumen || ''));
    const zona = el('div'); a.append(zona);
    const ultima = NOV.find((x) => x.caso === r.slug); if (ultima && window.NOVEDADES) a.append(window.NOVEDADES.linea(ultima, { enlace: false }));
    a.append(el('div', { class: 'foot' }, el('span', null, r.corte ? 'Datos hasta ' + r.corte.replace('T', ' ').slice(0, 16) + ' UTC' : 'Seguimiento en vivo'), el('span', null, 'Abrir panel →')));
    box.append(a);
    if (r.url) continue;
    try {
      const d = await (await fetch('reports/' + r.slug + '/data.json')).json();
      const T = d.tron || {}, p = (T.partidas || []).filter((x) => x.importe > 0), tot = p.reduce((s, x) => s + x.importe, 0);
      zona.append(el('div', { class: 'nums' },
        el('div', null, el('b', null, m(T.capital)), el('span', null, 'capital robado en TRON')),
        el('div', null, el('b', null, m(p[0] && p[0].importe)), el('span', null, 'congelado por Tether')),
        el('div', null, el('b', null, n(d.red && d.red.totalMovimientos)), el('span', null, 'movimientos en el libro'))));
      zona.append(el('div', { class: 'minibar', title: 'Reparto del capital en TRON' }, p.map((x, i) => el('i', { style: 'width:' + (x.importe / tot * 100) + '%;background:' + C.pal[i % C.pal.length], title: x.nombre + ': ' + m(x.importe) }))));
      zona.append(el('div', { class: 'mlegend' }, p.slice(0, 5).map((x, i) => el('span', { style: '--c:' + C.pal[i % C.pal.length] }, x.nombre.split(' (')[0].replace(/^Congelados por Tether.*/, 'Congelado por Tether').replace(/^En protocolos DeFi.*/, 'DeFi y USDD').replace(/^En servicios.*/, 'Servicios y nodos').replace(/^Enviado a otras cadenas.*/, 'Otras cadenas').replace(/^Localizados.*/, 'En billeteras') + ' ' + pct(x.importe / tot, 0)))));
    } catch (e) { /* sin cifras */ }
  }
})();
