/* Red de direcciones interactiva (con fichas, búsqueda, filtros y expansión) + explorador de todas las direcciones. */
(function () {
  const { el, n, m } = C;

  Dash.add(60, function ({ d }) {
    if (!d.red || !d.red.nodes.length || !window.d3) return;
    const s = Dash.sec('red', 'Red de direcciones', 'Red', ['Un mapa de las direcciones que más dinero han movido y de los envíos entre ellas. <b>Pulsa un círculo</b> para abrir su ficha (saldo, quién le envía, a quién envía y todos sus movimientos). <b>Doble clic</b> añade sus conexiones; con el <b>buscador</b> puedes traer al mapa cualquier dirección del libro (' + n(d.red.totalCuentas) + ' billeteras en TRON). Rueda del ratón para acercar.']);
    const k = UI.tarjeta({ titulo: 'Mapa de direcciones y envíos', sub: 'Tamaño = volumen · color = tipo de dirección · flecha = sentido · borde rojo = congelada', alto: 600, ayuda: TXT.ay.red });
    k.cv.remove(); k.wrap.style.cssText = 'position:relative;height:auto'; k.c.id = 'red';

    /* ---------- estado ---------- */
    const W = 1100, H = 620;
    const estado = { nodos: new Map(), enlaces: [], red: 'todas', ocultas: new Set(), minUsd: 0, etiquetas: true, ledger: false, resaltar: null };
    const base = d.red.nodes.map((x) => ({ ...x }));
    const inicial = () => { estado.nodos = new Map(base.map((x) => [x.id.toLowerCase(), { ...x }])); estado.enlaces = d.red.links.map((l) => ({ ...l })); estado.ledger = false; };
    inicial();
    let sim, svg, raiz, gEn, gNo, gLb, zoom;

    /* ---------- controles ---------- */
    const tools = el('div', { class: 'gtools' });
    const seg = el('div', { class: 'seg' });
    [['todas', 'Todas'], ['tron', 'TRON'], ['ethereum', 'Ethereum']].forEach(([v, t]) => seg.append(el('button', { class: v === 'todas' ? 'on' : '', onclick: (e) => { estado.red = v; [...seg.children].forEach((b) => b.classList.remove('on')); e.target.classList.add('on'); dibujar(); } }, t)));
    const buscador = el('input', { class: 'q', type: 'search', placeholder: 'Buscar dirección o nombre…', oninput: (e) => buscar(e.target.value) });
    const res = el('div', { class: 'sres', style: 'display:none' });
    const etq = el('input', { type: 'checkbox', checked: true, onchange: (e) => { estado.etiquetas = e.target.checked; gLb.style('display', estado.etiquetas ? null : 'none'); } });
    const rng = el('input', { type: 'range', min: 0, max: 100, value: 0, style: 'width:110px', oninput: (e) => { const v = +e.target.value; estado.minUsd = v === 0 ? 0 : Math.pow(10, 3 + v * 0.05); lab.textContent = estado.minUsd ? 'envíos ≥ ' + m(estado.minUsd) : 'todos los envíos'; }, onchange: () => dibujar() });
    const lab = el('span', { class: 'muted', style: 'font-size:12px;min-width:110px' }, 'todos los envíos');
    const cuenta = el('span', { class: 'muted', style: 'font-size:12.3px' });
    // Quitar la selección: todos los puntos y enlaces vuelven a su color. Se activa con el botón, con Esc o pulsando en el fondo del mapa.
    const btnTodo = el('button', { class: 'mini', title: 'Quita la selección: todo el mapa vuelve a verse en color (también: pulsa en el fondo o la tecla Esc)', disabled: true, onclick: () => quitarSeleccion() }, '◎ Ver todo en color');
    const quitarSeleccion = () => { estado.resaltar = null; if (estado.aplicar) estado.aplicar(null); sincBtn(); };
    const sincBtn = () => { btnTodo.disabled = !estado.resaltar; };
    tools.append(seg, buscador, res, el('label', null, etq, 'Etiquetas'), el('label', null, 'Mostrar:', rng, lab), btnTodo,
      el('button', { class: 'mini', title: 'Vuelve a la vista inicial: quita la selección, los filtros por tipo y las conexiones añadidas', onclick: () => { inicial(); estado.ocultas.clear(); estado.resaltar = null; sincBtn(); dibujar(); leyenda(); } }, '↺ Reiniciar mapa'), cuenta);
    k.c.insertBefore(tools, k.wrap);
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && estado.resaltar && !document.querySelector('.drawer.on')) quitarSeleccion(); });

    function buscar(q) {
      res.textContent = ''; if (q.trim().length < 3) { res.style.display = 'none'; return; }
      res.style.display = ''; res.append(el('div', { class: 'muted' }, 'Buscando…'));
      Libro.cargar().then(() => {
        const r = Libro.buscar(q, 10); res.textContent = '';
        if (!r.length) { res.append(el('div', { class: 'muted' }, 'Sin resultados en el libro mayor.')); return; }
        r.forEach((x) => { const c = Libro.cuenta(Libro.dir[x.i]); res.append(el('div', { onclick: () => { res.style.display = 'none'; buscador.value = ''; anadir(Libro.dir[x.i], false, true); } }, el('span', { class: 'addr' }, UI.corto(Libro.dir[x.i], 12, 8)), ' ', el('small', null, (C.claseNombre[c.clase] || c.clase) + (c.nombre ? ' · ' + c.nombre : '') + ' · ' + m(x.vol)))); });
      });
    }
    document.addEventListener('click', (e) => { if (!tools.contains(e.target)) res.style.display = 'none'; });

    /* ---------- añadir direcciones / conexiones desde el libro ---------- */
    function nodoDe(dir) {
      const f = Libro.ficha(dir), c = Libro.cuenta(dir) || { clase: UI.evm(dir) ? 'ethereum' : 'desconocida', nombre: '' };
      return { id: dir, corto: UI.corto(dir, 6, 4), clase: c.clase, nombre: c.nombre, usd: f ? f.entra + f.sale : 0, congelada: c.congelada === 1, red: UI.evm(dir) ? 'ethereum' : 'tron' };
    }
    function recalcularEnlaces() {
      const set = new Set([...estado.nodos.values()].map((x) => Libro.i(x.id)));
      estado.enlaces = Libro.aristas(set).map((e) => ({ source: Libro.dir[e.a], target: Libro.dir[e.b], usd: e.usd, n: e.n }));
      estado.ledger = true;
    }
    function anadir(dir, conexiones, abrirFicha) {
      Libro.cargar().then(() => {
        if (Libro.i(dir) == null) return;
        const nuevos = [dir]; if (conexiones) Libro.vecinos(dir, 12).forEach((v) => nuevos.push(Libro.dir[v.i]));
        let hay = 0; nuevos.forEach((x) => { if (!estado.nodos.has(x.toLowerCase())) { estado.nodos.set(x.toLowerCase(), nodoDe(x)); hay++; } });
        if (estado.nodos.size > 260) { alert('El mapa tiene muchos nodos; usa «Reiniciar mapa» para empezar de nuevo.'); }
        recalcularEnlaces(); estado.resaltar = dir.toLowerCase(); dibujar(true);
        if (abrirFicha) Ficha.abrir(dir);
        zoomA(dir);
      });
    }
    Ficha.alGrafo = (dir, con) => { document.getElementById('red').scrollIntoView({ behavior: 'smooth' }); UI.cerrar(); anadir(dir, con, false); };

    /* ---------- dibujo ---------- */
    svg = d3.select(k.wrap).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('cursor', 'grab');
    const defs = svg.append('defs'); defs.append('marker').attr('id', 'ar').attr('viewBox', '0 -4 8 8').attr('refX', 9).attr('refY', 0).attr('markerUnits', 'userSpaceOnUse').attr('markerWidth', 8).attr('markerHeight', 8).attr('orient', 'auto').append('path').attr('d', 'M0,-4L8,0L0,4').attr('fill', C.css('--mut'));
    raiz = svg.append('g'); gEn = raiz.append('g'); gNo = raiz.append('g'); gLb = raiz.append('g').style('pointer-events', 'none');
    zoom = d3.zoom().scaleExtent([0.3, 8]).on('zoom', (ev) => raiz.attr('transform', ev.transform)); svg.call(zoom).on('dblclick.zoom', null);
    svg.on('click', (ev) => { if (ev.defaultPrevented) return; if (ev.target === svg.node()) quitarSeleccion(); });   // un arrastre del fondo no cuenta (d3-zoom lo suprime)
    k.wrap.append(el('div', { class: 'zoomtools' },
      el('button', { class: 'ibtn', title: 'Acercar', onclick: () => svg.transition().duration(200).call(zoom.scaleBy, 1.5) }, '+'),
      el('button', { class: 'ibtn', title: 'Alejar', onclick: () => svg.transition().duration(200).call(zoom.scaleBy, 1 / 1.5) }, '−'),
      el('button', { class: 'mini', onclick: () => svg.transition().duration(250).call(zoom.transform, d3.zoomIdentity) }, 'Vista inicial')));
    const lg = el('div', { class: 'legend i', style: 'flex-direction:row;flex-wrap:wrap;gap:4px 14px;margin-top:10px' }); k.c.append(lg);
    k.c.append(el('p', { class: 'hint' }, el('kbd', null, 'Clic'), ' ficha · ', el('kbd', null, 'Clic en el fondo'), ' o ', el('kbd', null, 'Esc'), ' quitar la selección · ', el('kbd', null, 'Doble clic'), ' añadir conexiones · ', el('kbd', null, 'Arrastrar'), ' recolocar · ', el('kbd', null, 'Rueda'), ' zoom · pulsa un tipo de la leyenda para ocultarlo.'));
    function leyenda() {
      lg.textContent = ''; const clases = [...new Set([...estado.nodos.values()].map((x) => x.clase))];
      clases.forEach((c) => lg.append(el('div', { class: 'li' + (estado.ocultas.has(c) ? ' off' : ''), title: C.claseNombre[c] ? '' : '', onclick: () => { estado.ocultas.has(c) ? estado.ocultas.delete(c) : estado.ocultas.add(c); leyenda(); dibujar(); } }, el('span', { class: 'sw', style: 'background:' + (C.clase[c] || '#64748b') }), el('span', { class: 'ln' }, C.claseNombre[c] || c))));
      lg.append(el('div', { class: 'li', style: 'cursor:default' }, el('span', { class: 'sw', style: 'background:none;border:2px solid #ef4444;border-radius:50%' }), el('span', { class: 'ln' }, 'Congelada por Tether')));
    }
    let cacheNodos = [];
    function dibujar(conservar) {
      if (sim) sim.stop();
      const previos = new Map(cacheNodos.map((x) => [x.id.toLowerCase(), x]));
      const nodos = [...estado.nodos.values()].filter((x) => (estado.red === 'todas' || x.red === estado.red) && !estado.ocultas.has(x.clase)).map((x) => { const p = previos.get(x.id.toLowerCase()); return { ...x, x: p ? p.x : undefined, y: p ? p.y : undefined, fx: null, fy: null }; });
      cacheNodos = nodos; const ids = new Set(nodos.map((x) => x.id.toLowerCase()));
      const enlaces = estado.enlaces.filter((l) => ids.has(l.source.toLowerCase ? l.source.toLowerCase() : l.source.id.toLowerCase()) && ids.has(l.target.toLowerCase ? l.target.toLowerCase() : l.target.id.toLowerCase()) && l.usd >= estado.minUsd).map((l) => ({ ...l, source: (l.source.id || l.source), target: (l.target.id || l.target) }));
      cuenta.textContent = n(nodos.length) + ' direcciones · ' + n(enlaces.length) + ' enlaces' + (estado.ledger ? '' : ' (vista inicial)');
      const r = d3.scaleSqrt().domain([0, d3.max(nodos, (x) => x.usd) || 1]).range([4, 30]);
      const wd = d3.scaleLog().domain([Math.max(1, d3.min(enlaces, (l) => l.usd) || 1), Math.max(10, d3.max(enlaces, (l) => l.usd) || 10)]).range([0.6, 5]).clamp(true);
      gEn.selectAll('*').remove(); gNo.selectAll('*').remove(); gLb.selectAll('*').remove();
      const lk = gEn.selectAll('line').data(enlaces).join('line').attr('stroke', C.css('--mut')).attr('stroke-opacity', 0.45).attr('stroke-width', (l) => wd(l.usd)).attr('marker-end', 'url(#ar)').style('cursor', 'pointer')
        .on('mousemove', (ev, l) => C.tip('<b>' + (l.source.corto || '') + ' → ' + (l.target.corto || '') + '</b><br>' + m(l.usd) + ' en ' + n(l.n) + ' envíos<br><i>Pulsa para ver los movimientos</i>', ev)).on('mouseleave', () => C.tip(null))
        .on('click', (ev, l) => { const a = Libro.i(l.source.id), b = Libro.i(l.target.id); if (a == null || b == null) { Libro.cargar().then(() => dibujar()); return; } Ficha.verMovs('Envíos de ' + UI.corto(l.source.id, 8, 5) + ' a ' + UI.corto(l.target.id, 8, 5), 'Libro mayor', (r2) => r2[1] === a && r2[2] === b, 'Todos los movimientos entre estas dos direcciones, en este sentido.'); });
      const resalta = (id) => { if (!id) { nd.attr('opacity', 1); lk.attr('opacity', 1); lb.attr('opacity', 1); return; } const vec = new Set([id]); enlaces.forEach((l) => { if (l.source.id.toLowerCase() === id) vec.add(l.target.id.toLowerCase()); if (l.target.id.toLowerCase() === id) vec.add(l.source.id.toLowerCase()); }); nd.attr('opacity', (x) => (vec.has(x.id.toLowerCase()) ? 1 : 0.15)); lb.attr('opacity', (x) => (vec.has(x.id.toLowerCase()) ? 1 : 0.1)); lk.attr('opacity', (l) => (l.source.id.toLowerCase() === id || l.target.id.toLowerCase() === id ? 1 : 0.06)); };
      const nd = gNo.selectAll('circle').data(nodos).join('circle').attr('r', (x) => r(x.usd)).attr('fill', (x) => C.clase[x.clase] || '#64748b').attr('fill-opacity', 0.92)
        .attr('stroke', (x) => (x.congelada ? '#ef4444' : x.id.toLowerCase() === estado.resaltar ? C.css('--fg') : C.css('--pan'))).attr('stroke-width', (x) => (x.congelada ? 3 : x.id.toLowerCase() === estado.resaltar ? 3 : 1.5)).style('cursor', 'pointer')
        .on('mouseenter', (ev, x) => resalta(x.id.toLowerCase())).on('mouseleave', () => { resalta(estado.resaltar); C.tip(null); })
        .on('mousemove', (ev, x) => C.tip('<b>' + (x.nombre || x.corto) + '</b><br><span class="mono">' + x.id + '</span><br>' + (C.claseNombre[x.clase] || x.clase) + ' · ' + m(x.usd) + ' de volumen' + (x.congelada ? '<br><b>Congelada por Tether</b>' : '') + '<br><i>Clic: ficha · doble clic: conexiones</i>', ev))
        .on('click', (ev, x) => { if (ev.defaultPrevented) return; estado.resaltar = x.id.toLowerCase(); sincBtn(); clearTimeout(estado.tc); estado.tc = setTimeout(() => Ficha.abrir(x.id), 260); })   // se espera por si es un doble clic
        .on('dblclick', (ev, x) => { ev.stopPropagation(); clearTimeout(estado.tc); anadir(x.id, true, false); })
        .call(d3.drag().on('start', (ev, x) => { if (!ev.active) sim.alphaTarget(0.25).restart(); x.fx = x.x; x.fy = x.y; }).on('drag', (ev, x) => { x.fx = ev.x; x.fy = ev.y; }).on('end', (ev, x) => { if (!ev.active) sim.alphaTarget(0); x.fx = null; x.fy = null; }));
      const lb = gLb.selectAll('text').data(nodos.filter((x) => r(x.usd) > 13 || x.nombre)).join('text').text((x) => Dash.corto(x.nombre || x.corto, 22)).attr('font-size', 10.5).attr('fill', C.css('--fg')).attr('text-anchor', 'middle').attr('paint-order', 'stroke').attr('stroke', C.css('--pan')).attr('stroke-width', 3);
      gLb.style('display', estado.etiquetas ? null : 'none');
      sim = d3.forceSimulation(nodos).force('link', d3.forceLink(enlaces).id((x) => x.id).distance(70).strength(0.35)).force('charge', d3.forceManyBody().strength(-170)).force('center', d3.forceCenter(W / 2, H / 2)).force('x', d3.forceX(W / 2).strength(0.05)).force('y', d3.forceY(H / 2).strength(0.07)).force('collide', d3.forceCollide((x) => r(x.usd) + 3));
      const pos = () => { lk.attr('x1', (l) => l.source.x).attr('y1', (l) => l.source.y).attr('x2', (l) => l.target.x).attr('y2', (l) => l.target.y); nd.attr('cx', (x) => x.x).attr('cy', (x) => x.y); lb.attr('x', (x) => x.x).attr('y', (x) => x.y - r(x.usd) - 4); };
      sim.on('tick', pos);
      if (conservar) sim.alpha(0.5).restart(); else { for (let i = 0; i < 260; i++) sim.tick(); pos(); encajar(nodos, r); }
      leyenda(); estado.aplicar = resalta; resalta(estado.resaltar); sincBtn();
    }
    // ajusta el zoom para que todo el mapa quepa en el recuadro
    function encajar(nodos, r) {
      if (!nodos.length) return; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      nodos.forEach((x) => { const rr = r(x.usd) + 6; x0 = Math.min(x0, x.x - rr); x1 = Math.max(x1, x.x + rr); y0 = Math.min(y0, x.y - rr); y1 = Math.max(y1, x.y + rr); });
      const k = Math.min(1.4, 0.96 * Math.min(W / (x1 - x0), H / (y1 - y0))); const tx = W / 2 - k * (x0 + x1) / 2, ty = H / 2 - k * (y0 + y1) / 2;
      svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
    }
    function zoomA(dir) {
      setTimeout(() => { const x = cacheNodos.find((q) => q.id.toLowerCase() === dir.toLowerCase()); if (!x || x.x == null) return; svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity.translate(W / 2, H / 2).scale(1.6).translate(-x.x, -x.y)); }, 600);
    }
    s.append(k.c);
    dibujar();
  });

  /* ---------- explorador de todas las direcciones ---------- */
  Dash.add(65, function ({ d }) {
    const s = Dash.sec('direcciones', 'Explorador de direcciones', 'Direcciones', ['Todas las direcciones que aparecen en el libro mayor, en una tabla que se puede <b>buscar, filtrar y ordenar</b>. <b>Pulsa una fila</b> para abrir su ficha: quién le envía, a quién envía, su saldo y todos sus movimientos. Los datos se descargan la primera vez que abres esta sección.']);
    const cont = el('div', { class: 'card' }, el('div', { class: 'head' }, el('div', { class: 'ht' }, el('h3', null, 'Todas las direcciones del libro mayor'), el('div', { class: 'cs' }, n(d.red.totalCuentas) + ' billeteras en TRON y las direcciones de Ethereum que aparecen en el libro'))), UI.cargando('Cargando el libro mayor (unos 2 MB)…'));
    s.append(cont);
    const cargar = () => Libro.cargar().then(() => {
      const vol = new Map();
      Libro.movs.forEach((r) => { const u = r[5] || 0; const a = vol.get(r[1]) || vol.set(r[1], [0, 0, 0]).get(r[1]); a[1] += u; a[2]++; if (r[2] !== r[1]) { const b = vol.get(r[2]) || vol.set(r[2], [0, 0, 0]).get(r[2]); b[0] += u; b[2]++; } });
      const rows = Libro.dir.map((dir, i) => { const c = Libro.cuenta(dir), v = vol.get(i) || [0, 0, 0]; return { dir, clase: c.clase, nombre: c.nombre || '', entra: v[0], sale: v[1], n: v[2], congelada: c.congelada === 1, trx: c.trx, usdt: c.usdt, red: UI.evm(dir) ? 'Ethereum' : 'TRON' }; });
      cont.lastChild.remove();
      cont.append(UI.tabla({ pp: 15, csv: 'direcciones', ph: 'Buscar por dirección, nombre o tipo…', orden: [3, -1], onRow: (r) => Ficha.abrir(r.dir),
        filtros: [{ t: 'Red', opciones: ['TRON', 'Ethereum'], fn: (r, op) => r.red === op }, { t: 'Tipo', opciones: Object.keys(C.claseNombre), fn: (r, op) => r.clase === op }, { t: 'Estado', opciones: ['Congelada', 'No congelada'], fn: (r, op) => (op === 'Congelada') === r.congelada }],
        cols: [
          { t: 'Dirección', v: (r) => el('span', null, el('a', { class: 'addr' }, UI.corto(r.dir, 10, 8)), r.nombre ? el('div', { class: 'muted', style: 'font-size:11.5px' }, Dash.corto(r.nombre, 30)) : null), o: (r) => r.dir, csv: (r) => r.dir },
          { t: 'Tipo', v: (r) => el('span', { class: 'tag', style: 'background:' + (C.clase[r.clase] || '#64748b') }, C.claseNombre[r.clase] || r.clase), o: (r) => r.clase, csv: (r) => r.clase },
          { t: 'Recibido', num: 1, v: (r) => m(r.entra), o: (r) => r.entra, csv: (r) => Math.round(r.entra) },
          { t: 'Enviado', num: 1, v: (r) => m(r.sale), o: (r) => r.sale, csv: (r) => Math.round(r.sale) },
          { t: 'Movs.', num: 1, v: (r) => n(r.n), o: (r) => r.n },
          { t: 'Saldo hoy', num: 1, v: (r) => (r.trx != null && r.trx >= 0 ? m(r.trx * Libro.meta.precioTRX + r.usdt) : '—'), o: (r) => (r.trx != null && r.trx >= 0 ? r.trx * Libro.meta.precioTRX + r.usdt : -1) },
          { t: 'Estado', v: (r) => (r.congelada ? el('span', { class: 'chipx bad' }, '❄ Congelada') : ''), o: (r) => (r.congelada ? 1 : 0), csv: (r) => (r.congelada ? 'Congelada' : '') }],
        rows }));
    });
    // se carga al verla o al pulsar; evita descargar 2 MB si nadie baja hasta aquí
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { io.disconnect(); cargar(); } }, { rootMargin: '400px' }); io.observe(cont);
    if (Dash.q.get('solo') && Dash.q.get('solo').split(',').includes('direcciones')) cargar();
  });
})();
