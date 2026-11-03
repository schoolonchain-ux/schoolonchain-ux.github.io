/* Portada: lista de informes con cifras clave y una barra de reparto con leyenda. */
(async function () {
  const box = document.getElementById('cards');
  let idx;
  try { idx = await (await fetch('reports/index.json', { cache: 'no-cache' })).json(); } catch (e) { box.textContent = 'No se pudo cargar reports/index.json'; return; }
  box.textContent = '';
  const { el, m, n, pct } = C;
  for (const r of idx.informes) {
    const a = C.el('a', { class: 'rcard' + (r.caso ? ' destacada' : ''), href: 'report.html?r=' + encodeURIComponent(r.slug) });
    a.append(
      r.caso ? el('span', { class: 'caso' }, 'Caso · ' + r.caso) : null,
      el('div', { class: 'chips' }, (r.cadenas || []).map((c) => el('span', { class: 'chip' }, c)), el('span', { class: 'chip ver' }, r.version || '')),
      el('h3', null, r.titulo),
      el('p', null, r.resumen || ''));
    const zona = el('div'); a.append(zona);
    a.append(el('div', { class: 'foot' }, el('span', null, 'Datos hasta ' + (r.corte || '').replace('T', ' ').slice(0, 16) + ' UTC'), el('span', null, 'Abrir panel →')));
    box.append(a);
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
