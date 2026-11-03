/* Diagrama de flujo (Sankey) con leyenda, zoom/arrastre y detalle al pulsar. */
(function () {
  const { el, n, m, pct } = C;
  Dash.add(40, function ({ d }) {
    const T = d.tron || {};
    if (!T.partidas || !window.d3 || !d3.sankey) return;
    const s = Dash.sec('flujo', 'Cómo se reparte el capital', 'Flujo', ['Este diagrama sigue el dinero de izquierda a derecha: <b>capital robado → dónde está hoy cada parte → en qué fase (antes o después de la foto) o en qué direcciones congeladas</b>. Cuanto más ancha es una banda, más dinero. <b>Pulsa un bloque o una banda</b> para ver su detalle; usa la rueda del ratón para acercar.']);
    const partidas = T.partidas.filter((p) => p.importe > 0);
    const desc = {
      'Congelados': 'Bloqueado por Tether: no se puede mover. Verificado hoy.',
      'Localizados': 'Dinero que quedó parado en billeteras del recorrido.',
      'En protocolos': 'Depositado en préstamos (JustLend) o entregado al sistema USDD.',
      'En servicios': 'Puntos de parada: concentradores, servicios y casas de cambio.',
      'Enviado a otras': 'Salió de TRON por puentes (Symbiosis, Chainflip, Across…).',
      'Sin localizar': 'No se sabe adónde fue: salidas pequeñas o contratos sin salida visible.',
      'Efecto de precio': 'Diferencia de valoración al convertir USDT en TRX; no es dinero de nadie.',
    };
    const descDe = (p) => { const k = Object.keys(desc).find((x) => p.nombre.startsWith(x)); return k ? desc[k] : ''; };
    const nodes = [{ name: 'Capital robado', cap: true }], links = [], ix = new Map([['Capital robado', 0]]);
    const nodo = (nm, extra) => { if (!ix.has(nm)) { ix.set(nm, nodes.length); nodes.push({ name: nm, ...extra }); } return ix.get(nm); };
    partidas.forEach((p, pi) => {
      const pn = Dash.corto(p.nombre, 38); const a = nodo(pn, { p, pi }); links.push({ source: 0, target: a, value: p.importe, p, pi });
      (p.desglose || []).filter((x) => x.importe > 0).forEach((x) => {
        const esFase = /foto/i.test(x.fase); const nm = esFase ? x.fase : Dash.corto(x.fase, 14);
        const b = nodo(nm, esFase ? { fase: x.fase } : { dir: x.fase }); links.push({ source: a, target: b, value: x.importe, p, pi, x });
      });
    });
    const k = UI.tarjeta({ titulo: 'Del capital robado a cada destino', sub: 'Rueda = zoom · arrastrar = mover · clic = detalle', alto: 480, ayuda: TXT.ay.sankey, datos: { titulo: 'Flujo del capital', csv: 'flujo', nota: 'Cada fila es una banda del diagrama.', rows: links.slice(1), cols: [{ t: 'Desde', v: (r) => nodes[typeof r.source === 'object' ? r.source.index : r.source].name, o: (r) => 0 }, { t: 'Hacia', v: (r) => nodes[typeof r.target === 'object' ? r.target.index : r.target].name, o: (r) => 0 }, { t: 'Importe', num: 1, v: (r) => m(r.value), o: (r) => r.value }] } });
    k.cv.remove(); k.wrap.style.cssText = 'position:relative;height:auto'; k.c.id = 'sankey';
    const W = 1100, H = 470, mg = { l: 8, r: 250, t: 8, b: 8 };
    const sk = d3.sankey().nodeWidth(14).nodePadding(12).nodeAlign(d3.sankeyLeft).extent([[mg.l, mg.t], [W - mg.r, H - mg.b]]);
    const g = sk({ nodes: nodes.map((x) => ({ ...x })), links: links.map((x) => ({ ...x })) });
    const svg = d3.select(k.wrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('cursor', 'grab');
    const raiz = svg.append('g');
    const col = (i) => C.pal[i % C.pal.length];
    const todos = raiz.append('g');
    const lk = todos.selectAll('path').data(g.links).join('path').attr('d', d3.sankeyLinkHorizontal()).attr('fill', 'none').attr('stroke', (l) => col(l.pi)).attr('stroke-opacity', 0.38).attr('stroke-width', (l) => Math.max(1.5, l.width)).style('cursor', 'pointer')
      .on('mousemove', (ev, l) => { lk.attr('stroke-opacity', (o) => (o === l ? 0.7 : 0.15)); C.tip('<b>' + l.source.name + ' → ' + l.target.name + '</b><br>' + m(l.value) + ' · ' + pct(l.value / T.capital) + ' del capital<br><i>Pulsa para ver el detalle</i>', ev); })
      .on('mouseleave', () => { lk.attr('stroke-opacity', 0.38); C.tip(null); })
      .on('click', (ev, l) => { if (ev.defaultPrevented) return; Dash.abrirPartida(l.p, T.capital, 'tron', l.x ? l.x.fase : null); });
    const nd = raiz.append('g').selectAll('g').data(g.nodes).join('g').style('cursor', 'pointer')
      .on('mousemove', (ev, x) => C.tip('<b>' + x.name + '</b><br>' + m(x.cap ? T.capital : x.value) + (x.cap ? '' : ' · ' + pct(x.value / T.capital) + ' del capital') + '<br><i>Pulsa para ver el detalle</i>', ev))
      .on('mouseleave', () => C.tip(null))
      .on('click', (ev, x) => {
        if (x.p) return Dash.abrirPartida(x.p, T.capital, 'tron');
        if (x.dir) return Ficha.abrir(x.dir);
        if (x.fase) return UI.abrir(x.fase, () => el('div', null, el('p', { class: 'narr' }, 'Partidas del balance que se repartieron en esta fase. Pulsa una fila para abrir su detalle.'), UI.tabla({ pp: 10, buscar: false, onRow: (r) => Dash.abrirPartida(r.p, T.capital, 'tron', x.fase), rows: partidas.filter((p) => (p.desglose || []).some((y) => y.fase === x.fase)).map((p) => ({ p, importe: p.desglose.find((y) => y.fase === x.fase).importe })), cols: [{ t: 'Partida', v: (r) => r.p.nombre, o: (r) => r.p.nombre }, { t: 'Importe', num: 1, v: (r) => m(r.importe), o: (r) => r.importe }] })), { sub: 'Fase del reparto' });
        UI.abrir('Capital robado', () => el('p', { class: 'narr' }, 'Capital inicial del robo en TRON: ' + m(T.capital) + ' (' + (d.capital ? n(d.capital.robadoUSDT) + ' USDT y ' + n(d.capital.trxDirecto) + ' TRX' : '') + '). Cada banda que sale de aquí es una partida del balance.'));
      });
    nd.append('rect').attr('x', (x) => x.x0).attr('y', (x) => x.y0).attr('width', (x) => x.x1 - x.x0).attr('height', (x) => Math.max(1.5, x.y1 - x.y0)).attr('rx', 3).attr('fill', (x) => (x.cap ? C.css('--fg') : x.fase ? C.css('--mut') : col(x.pi != null ? x.pi : 0))).attr('opacity', 0.92);
    nd.append('text').attr('x', (x) => x.x1 + 7).attr('y', (x) => (x.y0 + x.y1) / 2).attr('dy', '0.35em').attr('text-anchor', 'start').attr('fill', C.css('--fg')).attr('font-size', 12)
      .text((x) => x.name + ' · ' + m(x.cap ? T.capital : x.value));
    const zoom = d3.zoom().scaleExtent([1, 8]).translateExtent([[-60, -40], [W + 60, H + 40]]).on('zoom', (ev) => raiz.attr('transform', ev.transform));
    svg.call(zoom).on('dblclick.zoom', null);
    const zt = el('div', { class: 'zoomtools' },
      el('button', { class: 'ibtn', title: 'Acercar', onclick: () => svg.transition().duration(200).call(zoom.scaleBy, 1.5) }, '+'),
      el('button', { class: 'ibtn', title: 'Alejar', onclick: () => svg.transition().duration(200).call(zoom.scaleBy, 1 / 1.5) }, '−'),
      el('button', { class: 'mini', title: 'Volver a la vista inicial', onclick: () => svg.transition().duration(250).call(zoom.transform, d3.zoomIdentity) }, 'Reiniciar'));
    k.wrap.append(zt);
    // leyenda explicada
    k.c.append(el('div', { class: 'sk-legend' }, partidas.map((p, i) => el('div', { class: 'li', onclick: () => Dash.abrirPartida(p, T.capital, 'tron') },
      el('span', { class: 'sw', style: 'background:' + col(i) }), el('span', null, el('b', null, p.nombre), ' ', C.est(p.estado), el('div', { class: 'muted', style: 'font-size:11.8px' }, descDe(p), ' · ', m(p.importe), ' (', pct(p.importe / T.capital, 0), ')'))))),
    );
    k.c.append(el('div', { class: 'foot' }, 'La suma de las partidas (' + m(T.suma) + ') no coincide con el capital (' + m(T.capital) + '); el informe declara esa diferencia en lugar de forzarla. Los bloques grises de la derecha son fases (antes/después de la foto); los de color vivo, direcciones congeladas.'));
    s.append(k.c);
  });
})();
