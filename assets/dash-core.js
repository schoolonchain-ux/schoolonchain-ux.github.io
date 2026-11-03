/* Núcleo del panel: carga de datos, cabecera, resumen para cualquier lector, cronología y reparto del dinero. */
(function () {
  const { el, n, m, pct } = C;
  const Dash = (window.Dash = { partes: [], charts: [], nav: [] });
  Dash.add = (orden, fn) => Dash.partes.push({ orden, fn });
  Dash.mk = (cv, cfg) => { const c = new Chart(cv, cfg); Dash.charts.push(c); return c; };
  Dash.corto = (s, k = 34) => (s && s.length > k ? s.slice(0, k - 1) + '…' : s || '');
  Dash.ejes = {
    dinero: () => ({ ticks: { callback: (v) => m(v) }, grid: { color: C.css('--line') } }),
    cat: () => ({ grid: { display: false } }),
    logTick: (fmt) => (v) => { const e = Math.pow(10, Math.floor(Math.log10(v))); return Math.abs(v / e - 1) < 1e-9 ? fmt(v) : ''; },
    log: () => ({ type: 'logarithmic', ticks: { callback: Dash.ejes.logTick(m), autoSkip: false, maxRotation: 0 }, grid: { color: C.css('--line') } }),
  };

  /* leyenda interactiva: clic en una fila = abrir detalle; ojo = ocultar de la gráfica */
  Dash.leyenda = (items, onClick) => el('div', { class: 'legend i' }, items.map((i) => el('div', { class: 'li', title: 'Pulsa para ver el detalle', onclick: () => onClick(i) },
    el('span', { class: 'sw', style: 'background:' + i.color }), el('span', { class: 'ln' }, i.nombre, ' ', i.estado ? C.est(i.estado) : null, i.desc ? el('span', { class: 'ld' }, i.desc) : null), el('span', { class: 'lv' }, i.valor))));

  /* ---------- carga ---------- */
  async function iniciar() {
    const app = document.getElementById('app');
    const q = new URLSearchParams(location.search);
    let idx;
    try { idx = await (await fetch('reports/index.json', { cache: 'no-cache' })).json(); } catch (e) { app.textContent = 'No se pudo cargar reports/index.json'; return; }
    const meta = idx.informes.find((r) => r.slug === q.get('r')) || idx.informes[0];
    if (!meta) { app.textContent = 'No hay informes publicados.'; return; }
    const base = 'reports/' + meta.slug + '/';
    let d, det;
    try { [d, det] = await Promise.all([fetch(base + 'data.json').then((r) => r.json()), fetch(base + 'detalle.json').then((r) => r.json()).catch(() => ({}))]); } catch (e) { app.textContent = 'No se pudo cargar ' + base + 'data.json'; return; }
    Object.assign(Dash, { d, det, base, meta, app, q });
    Libro.configurar(base);
    document.title = meta.titulo + ' · Informes on-chain';
    C.chartDefaults(); if (q.has('static')) window.__sinAnimacion = true; C.chartDefaults();
    app.textContent = '';
    cabecera();
    for (const p of Dash.partes.sort((a, b) => a.orden - b.orden)) { try { await p.fn(Dash); } catch (e) { console.error(e); app.append(el('p', { class: 'muted' }, 'Error al dibujar una sección: ' + e.message)); } }
    const nav = document.getElementById('nav');
    Dash.nav.forEach(([id, t]) => nav.append(el('a', { href: '#' + id }, t)));
    pie();
    modoCaptura();
    if (!q.has('nolibro')) setTimeout(() => Libro.cargar().catch(() => {}), 1500); // precarga en segundo plano
  }
  document.addEventListener('DOMContentLoaded', iniciar);

  Dash.sec = function (id, titulo, navTxt, llano) {
    const s = el('section', { class: 'blk', id }, el('h2', null, titulo));
    if (llano) s.append(el('div', { class: 'resumen-llano' }, el('b', { class: 'h' }, 'En pocas palabras'), llano.map ? llano.map((t) => el('p', { html: t })) : el('p', { html: llano })));
    Dash.app.append(s); return s;
  };

  /* ---------- detalle de una partida del balance (panel lateral) ---------- */
  Dash.fuentePartida = function (p, ambito) {
    const det = Dash.det, nom = p.nombre;
    const tDir = (rows, extra = []) => UI.tabla({ pp: 12, ph: 'Buscar dirección o nombre…', csv: 'direcciones', onRow: (r) => Ficha.abrir(r.direccion), rows, cols: [{ t: 'Dirección', v: (r) => el('span', null, el('a', { class: 'addr' }, UI.corto(r.direccion, 9, 6)), r.nombre ? el('div', { class: 'muted', style: 'font-size:11.5px' }, r.nombre) : null), o: (r) => r.direccion, csv: (r) => r.direccion }, ...extra] });
    const usd = (k) => ({ t: 'Importe', num: 1, v: (r) => m(r[k]), o: (r) => r[k], csv: (r) => Math.round(r[k]) });
    const cuando = { t: 'Último', v: (r) => UI.fecha(r.ultima), o: (r) => r.ultima || 0 };
    if (/Congelados por Tether/.test(nom)) return ['Direcciones bloqueadas por Tether en TRON', 'Cada fila es una dirección en la lista negra. Pulsa para abrir su ficha. El importe es el USDT que conserva hoy.', tDir((det.congeladas || []).map((c) => ({ direccion: c.direccion, nombre: c.bloqueadaHoy ? 'Bloqueada hoy' : 'Ya no figura bloqueada', usdt: c.usdt, ultima: c.t, tx: c.tx })), [usd('usdt'), { t: 'Bloqueada el', v: (r) => UI.fecha(r.ultima), o: (r) => r.ultima }, { t: 'Evento', v: (r) => UI.enlace(UI.urlTx(r.tx), UI.corto(r.tx, 6, 4) + ' ↗', 'addr'), o: (r) => r.tx }])];
    if (/Localizados/.test(nom)) return ['Billeteras con dinero retenido', 'Billeteras del recorrido donde se quedó dinero (entró − salió), con la parte atribuida al robo.', tDir((det.retenido || []).map((r) => ({ ...r, nombre: '' })), [{ t: 'TRX', num: 1, v: (r) => n(r.trx), o: (r) => r.trx }, { t: 'USDT', num: 1, v: (r) => n(r.usdt), o: (r) => r.usdt }, usd('atribuido'), { t: 'Pureza', num: 1, v: (r) => n(r.pureza * 100, 1) + ' %', o: (r) => r.pureza }])];
    const dest = (clases) => (det.destinos || []).filter((x) => clases.includes(x.clase)).map((x) => ({ ...x, direccion: x.direccion }));
    const colD = [usd('atribuido'), { t: 'Llegadas', num: 1, v: (r) => n(r.n), o: (r) => r.n }, cuando];
    if (/DeFi/.test(nom)) return ['Destinos DeFi (préstamos y USDD)', 'Direcciones y contratos de JustLend y del sistema USDD donde se detiene el rastreo.', tDir(dest(['prestamo', 'usdd']), colD)];
    if (/servicios, nodos/.test(nom)) return ['Servicios, nodos y casas de cambio', 'Direcciones donde el rastreo se detiene. Son puntos de parada, no destinos finales demostrados.', tDir(dest(['nodo', 'casa']), colD)];
    if (/otras cadenas|puentes/i.test(nom)) return ['Puentes hacia otras cadenas', 'Contratos de puente que recibieron dinero del recorrido.', tDir(dest(['puente']), colD)];
    if (/Sin localizar/.test(nom)) return ['Dónde se pierde el rastro', 'Direcciones y contratos donde el seguimiento se corta, con la causa. Incluye contratos cuya salida no se pudo decodificar.', tDir((det.perdida || []).filter((p2) => p2.direccion).map((p2) => ({ direccion: p2.direccion, nombre: p2.nombre, atribuido: p2.atribuido, causa: p2.causa, ultima: 0 })), [usd('atribuido'), { t: 'Causa', v: (r) => Dash.corto(r.causa, 120), o: (r) => r.causa }])];
    return null;
  };

  Dash.detallePartida = function (p, capital, ambito, faseResaltada) {
    const w = el('div');
    w.append(el('div', { class: 'fkpis' },
      el('div', { class: 'fk' }, el('div', { class: 'kl' }, 'Importe'), el('div', { class: 'kv' }, m(p.importe))),
      el('div', { class: 'fk' }, el('div', { class: 'kl' }, '% del capital'), el('div', { class: 'kv' }, pct(p.importe / capital))),
      el('div', { class: 'fk' }, el('div', { class: 'kl' }, 'Estado'), el('div', { class: 'kv', style: 'font-size:14px' }, C.est(p.estado)))));
    if (p.nota) w.append(el('p', { class: 'narr' }, p.nota));
    if (p.fuente) w.append(el('p', { class: 'narr' }, el('b', null, 'Fuente: '), p.fuente));
    if ((p.desglose || []).length) {
      w.append(el('h4', { style: 'margin:14px 0 4px' }, 'Desglose'));
      w.append(UI.tabla({ pp: 10, buscar: false, rows: p.desglose, cols: [{ t: 'Parte', v: (r) => (r.fase.length > 25 ? el('a', { class: 'addr', onclick: () => Ficha.abrir(r.fase) }, UI.corto(r.fase, 10, 8)) : (faseResaltada && r.fase === faseResaltada ? el('b', null, r.fase + ' ◄') : r.fase)), o: (r) => r.fase }, { t: 'Importe', num: 1, v: (r) => m(r.importe), o: (r) => r.importe }, { t: '% de la partida', num: 1, v: (r) => pct(r.importe / p.importe), o: (r) => r.importe }] }));
    }
    const rel = Dash.fuentePartida(p, ambito);
    if (rel) { w.append(el('h4', { style: 'margin:16px 0 2px' }, rel[0]), el('p', { class: 'narr' }, rel[1]), rel[2]); }
    return w;
  };
  Dash.abrirPartida = (p, capital, ambito, fase) => UI.abrir(p.nombre, () => Dash.detallePartida(p, capital, ambito, fase), { sub: 'Partida del balance · ' + p.estado, ancho: true });

  /* ---------- cabecera ---------- */
  function cabecera() {
    const { d, meta, base, app } = Dash;
    const ult = (d.novedades || []).slice(-1)[0];
    app.append(el('header', { class: 'rhead' },
      meta.caso ? el('div', { class: 'caso' }, 'Caso · ' + meta.caso) : null,
      el('h1', null, d.titulo),
      el('div', { class: 'sub' }, 'Datos hasta ', el('b', null, C.utc(new Date(d.corte).getTime())), ' · generado el ', C.utc(new Date(d.generado).getTime()), ult ? ' · versión ' : '', ult ? el('b', null, ult.version) : null),
      el('div', { class: 'actions' },
        el('a', { class: 'btn primary', href: base + 'informe-completo.html' }, 'Abrir el informe original completo'),
        (meta.archivos || []).filter((a) => a.ruta !== 'informe-completo.html').map((a) => el('a', { class: 'btn', href: base + a.ruta }, a.nombre)),
        el('button', { class: 'btn', onclick: () => Dash.glosario() }, 'Glosario'),
        el('a', { class: 'btn', href: 'herramientas.html' }, 'Herramientas en vivo'),
        el('button', { class: 'btn', onclick: () => document.getElementById('metodo').scrollIntoView() }, 'Método y decisiones')),
      el('div', { class: 'toc', id: 'toc' })));
  }
  function pie() {
    const { d, base, app } = Dash;
    app.append(el('footer', { class: 'site' }, d.revision || '', el('div', null, 'Todos los datos de este panel están en ', el('a', { href: base + 'data.json' }, 'data.json'), ', ', el('a', { href: base + 'detalle.json' }, 'detalle.json'), ' y el libro mayor completo en ', el('a', { href: base + 'libro/movs.json' }, 'libro/movs.json'), '.')));
    const toc = document.getElementById('toc'); toc.textContent = ''; toc.className = 'guia'; toc.append(el('div', { class: 'guiat' }, 'Cómo leer este informe: ' + Dash.caps.length + ' capítulos, de arriba abajo'), el('ol', null, Dash.caps.map((c) => el('li', null, el('a', { onclick: () => Dash.irCap(c.n) }, el('b', null, c.t), el('span', null, c.d))))));
  }
  function modoCaptura() {
    const q = Dash.q;
    // parámetros auxiliares (capturas y enlaces profundos): ?abrir=ficha:<dirección> | partida:<n> | grafico:<n>  ·  ?ayudas
    const ab = q.get('abrir');
    if (ab) { const i = ab.indexOf(':'), t = ab.slice(0, i), v = ab.slice(i + 1); try { if (t === 'ficha') Ficha.abrir(v); else if (t === 'partida') Dash.abrirPartida(Dash.d.tron.partidas[+v], Dash.d.tron.capital, 'tron'); else if (t === 'grafico') { const ch = Dash.charts[+v]; ch.options.onClick({ native: { target: ch.canvas } }, [{ index: 0, datasetIndex: 0 }], ch); } } catch (e) { console.error(e); } }
    if (q.has('ayudas')) document.querySelectorAll('.tbtn').forEach((b) => { if (/Cómo leerlo/.test(b.textContent)) b.click(); });
    if (q.get('capitulo')) { const want = q.get('capitulo').split(',').map(Number); let cur = 0; [...Dash.app.children].forEach((e) => { if (e.classList.contains('cap')) cur = +e.id.replace('cap-', ''); else if (e.matches('header.rhead,footer.site')) cur = want.includes(0) ? 0 : -1; if (!want.includes(cur)) e.style.display = 'none'; }); return; }
    if (!q.get('solo')) return;
    const ok = q.get('solo').split(',');
    document.querySelectorAll('section.blk').forEach((s) => { if (!ok.includes(s.id)) s.style.display = 'none'; });
    if (!ok.includes('top')) document.querySelectorAll('.rhead,.kpis').forEach((s) => (s.style.display = 'none'));
    const f = document.querySelector('footer.site'); if (f) f.style.display = 'none';
  }

  Dash.glosario = () => UI.abrir('Glosario', () => el('div', null, el('p', { class: 'narr' }, 'Los términos que aparecen en el panel, explicados sin jerga.'), el('dl', { class: 'gloss' }, TXT.glosario.map(([t, x]) => [el('dt', null, t), el('dd', null, x)]))), { sub: 'Para lectores sin conocimientos previos' });

  /* ---------- 0. resumen para cualquier lector ---------- */
  Dash.add(10, function ({ d, det, app }) {
    const T = d.tron || {}, E = d.ethereum || {}, G = d.global || {};
    const congelado = (G.partidas || [])[0] ? G.partidas[0].importe : null;
    const casas = ((d.faseB && d.faseB.terminales.casa) || { importe: 0 }).importe + ((d.faseA && d.faseA.terminales.casa) || { importe: 0 }).importe;
    const quieto = d.ethereumQuieto;
    const ver = (det.casasVerificadas || []); const verTot = ver.reduce((a, x) => a + x.enviado, 0); const casasNom = [...new Set(ver.map((x) => x.casa.replace(/ Hot Wallet.*| d+$/g, '')))].join(', ');
    const kp = [];
    if (T.capital) kp.push(['Capital robado en TRON', m(T.capital), d.capital ? n(d.capital.robadoUSDT / 1e6, 1) + ' M USDT + ' + n(d.capital.trxDirecto / 1e6, 1) + ' M TRX' : '', () => Dash.irA('reparto')]);
    if (E.capital) kp.push(['Capital en Ethereum y otras redes', m(E.capital), 'USDT, USDC, ETH y otros activos', () => Dash.irA('ethereum')]);
    if (congelado != null) kp.push(['Congelado por los emisores', m(congelado), pct(congelado / G.capital, 0) + ' del total · VERIFICADO hoy', () => Dash.irA('reparto')]);
    if (T.partidas) kp.push(['Congelado por Tether en TRON', m(T.partidas[0].importe), pct(T.partidas[0].importe / T.capital, 0) + ' del capital robado en TRON', () => Dash.abrirPartida(T.partidas[0], T.capital, 'tron')]);
    if (d.red) kp.push(['Movimientos en el libro mayor', n(d.red.totalMovimientos), n(d.red.totalCuentas) + ' billeteras en TRON · pulsa para buscarlas', () => Dash.irA('direcciones')]);
    if (d.puentes && d.puentes.usdt0) kp.push(['Puentes USDT0 entregados', n(d.puentes.usdt0.entregados) + ' / ' + n(d.puentes.usdt0.n), m(d.puentes.usdt0.enviado) + ' enviados', () => Dash.irA('puentes')]);
    const s = Dash.sec('resumen', 'Resumen para cualquier lector', 'Resumen', [
      'Del robo en Binance salieron, en <b>Ethereum</b> y otras redes, unos <b>' + m(E.capital) + '</b> (USDT, USDC, ETH y otros activos) y, en <b>TRON</b>, <b>' + m(T.capital) + '</b>. Los emisores <b>congelaron ' + m(congelado) + '</b>: es lo único recuperado de verdad, y se comprueba hoy preguntando a cada contrato.',
      'Lo que no se congeló <b>no ha desaparecido ni se ha movido</b> en su mayor parte' + (quieto ? ': ' + n(quieto.eth) + ' ETH (' + m(quieto.usd) + ' a precio de hoy) siguen quietos en billeteras de Ethereum' : '') + '. En TRON, el dinero que sí se movió se repartió por <b>' + n(d.red.totalCuentas) + ' direcciones</b>: casi todo acaba en puntos de parada (concentradores y servicios sin etiqueta), USDD, préstamos o puentes. <b>A casas de cambio identificadas han llegado ' + (verTot ? 'al menos ' + m(verTot) + ' con llegada comprobada (' + casasNom + ')' : m(casas)) + ' y, tras la foto, solo ' + m(casas) + '</b>; un depósito en una casa de cambio no prueba que se haya identificado a nadie.',
      'La cuenta <b>no cuadra del todo</b> y se muestra tal cual: en TRON la suma de las partidas ' + (T.diferencia < 0 ? '<b>supera</b> al capital en <b>' + m(-T.diferencia) + '</b>' : 'deja <b>' + m(T.diferencia) + '</b> sin explicar') + ' (' + pct(Math.abs(T.porcentaje), 1) + '). Es una limitación del modelo de reparto, no una pérdida demostrada.',
    ]);
    s.append(el('div', { class: 'kpis' }, kp.map(([l, v, sb, fn]) => el('div', { class: 'kpi', style: 'cursor:pointer', title: 'Pulsa para profundizar', onclick: fn }, el('div', { class: 'kl' }, l), el('div', { class: 'kv' }, v), el('div', { class: 'kn' }, sb)))));
    s.append(el('div', { class: 'grid g2' },
      el('div', { class: 'card' }, el('h3', null, 'Qué se puede afirmar'), el('ul', { class: 'narr', style: 'margin:6px 0 0 18px;padding:0' }, [
        'Cuánto está congelado hoy y en qué direcciones (se lee del contrato del emisor).', 'Qué direcciones recibieron dinero de qué otras y cuándo (cada movimiento enlaza con su transacción).', 'Que las llegadas por Symbiosis y USDT0 a su destino se comprobaron en la cadena de destino.', 'Qué partes del seguimiento son verificadas y cuáles estimadas: cada cifra lleva su estado.'].map((t) => el('li', null, t)))),
      el('div', { class: 'card' }, el('h3', null, 'Qué NO se puede afirmar'), el('ul', { class: 'narr', style: 'margin:6px 0 0 18px;padding:0' }, TXT.limites.slice(0, 4).map((t) => el('li', null, t))), el('button', { class: 'tbtn', style: 'margin-top:8px', onclick: () => Dash.irA('metodo') }, 'Ver todas las limitaciones →'))));
    s.append(el('p', { class: 'hint' }, 'Cómo usar este panel: todo lo que ves se puede pulsar. Los gráficos abren su detalle al hacer clic, ', el('b', null, 'ⓘ Cómo leerlo'), ' explica cada gráfico, ', el('b', null, '▦ Datos'), ' muestra la tabla que hay detrás y cada dirección tiene su ficha.'));
  });
  Dash.irA = (id) => { const t = document.getElementById(id); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); } };

  /* ---------- 1. cronología ---------- */
  Dash.add(20, function ({ d, det }) {
    const ev = [];
    const eth = (det.ethActivos || []).flatMap((a) => a.entradas.map((x) => ({ ...x, activo: a.activo }))).concat(((det.ethDirecto && det.ethDirecto.entradas) || []).map((x) => ({ ...x, activo: 'ETH' }))).sort((a, b) => a.t - b.t);
    if (eth.length) ev.push([eth[0].t, 'v', 'Primera entrada registrada a la dirección principal en Ethereum', 'Llegan ' + n(eth[0].cantidad) + ' ' + eth[0].activo + ' desde una billetera etiquetada como Binance. Hash: ', UI.enlace(UI.urlTx(eth[0].hash, true), UI.corto(eth[0].hash, 8, 6) + ' ↗', 'addr')]);
    const cg = (det.congeladas || []).filter((c) => c.usdt >= 1e6).sort((a, b) => a.t - b.t);   // los dos bloqueos grandes
    if (cg[0]) ev.push([cg[0].t, 'v', 'Tether bloquea la primera dirección grande del robo en TRON', n(cg[0].usdt / 1e6, 1) + ' M USDT bloqueados en ', el('a', { class: 'addr', onclick: () => Ficha.abrir(cg[0].direccion) }, UI.corto(cg[0].direccion, 8, 6))]);
    if (cg[1]) ev.push([cg[1].t, 'v', 'Tether bloquea la segunda dirección grande', n(cg[1].usdt / 1e6, 1) + ' M USDT en ', el('a', { class: 'addr', onclick: () => Ficha.abrir(cg[1].direccion) }, UI.corto(cg[1].direccion, 8, 6))]);
    const sh = d.serieHora || [];
    if (sh.length) { ev.push([Date.parse(sh[0].t + ':00:00Z'), 'd', 'Empieza el reparto desde la billetera de reparto', 'Primera hora con envíos: ' + n(sh[0].n) + (sh[0].n === 1 ? ' envío' : ' envíos') + ', ' + m(sh[0].v) + '.']); ev.push([Date.parse(sh[sh.length - 1].t + ':00:00Z'), 'd', 'Última hora con envíos de la billetera de reparto', 'Después de esta hora la billetera de reparto no envía más; el dinero ya repartido sigue moviéndose.']); }
    ev.push([Date.UTC(2026, 9, 30, 22, 40), 'd', 'La «foto»: corte entre los tramos 5 y 6', 'Separa el reparto anterior del posterior en el seguimiento.']);
    ev.push([new Date(d.corte).getTime(), 'd', 'Corte de los datos de TRON de este informe', 'Lo que ocurra después no está en las cifras de TRON.']);
    if (d.arkham) ev.push([Date.parse(d.arkham.desde), 'd', 'Ventana de las 35 transacciones de Arkham', 'Entre ' + d.arkham.desde.replace('T', ' ').slice(0, 16) + ' y ' + d.arkham.hasta.replace('T', ' ').slice(0, 16) + ' UTC, casi todas posteriores al corte.']);
    ev.push([new Date(d.generado).getTime(), 'd', 'Este informe se generó', 'Versión ' + ((d.novedades || []).slice(-1)[0] || {}).version]);
    ev.sort((a, b) => a[0] - b[0]);
    const s = Dash.sec('cronologia', 'Cronología', 'Cronología', ['Los hechos fechados que sostienen el informe. Verde: hecho comprobado en cadena. Naranja: fecha fijada por el método del informe.']);
    s.append(el('div', { class: 'card' }, el('div', { class: 'tl2' }, ev.map((e) => el('div', { class: 'ev ' + e[1] }, el('div', { class: 'tm' }, C.utc(e[0])), el('b', null, e[2]), el('div', null, e.slice(3)))))));
  });

  /* ---------- 2. reparto: donas + antes/después ---------- */
  Dash.add(30, function ({ d }) {
    const T = d.tron || {}, G = d.global || {};
    const s = Dash.sec('reparto', '¿Dónde está el dinero hoy?', 'Reparto', ['Aquí se ve cómo se reparte el capital robado. Los estados indican cuánto se puede demostrar: lo congelado se verifica leyendo el contrato de Tether; el resto es un seguimiento estimado con un modelo declarado. <b>Pulsa cualquier porción o fila de la leyenda</b> para ver qué contiene y qué direcciones hay detrás.']);
    const dona = (titulo, sub, partidas, capital, ambito, ayuda, ayuda2) => {
      const p = partidas.filter((x) => x.importe > 0); const tot = p.reduce((a, x) => a + x.importe, 0);
      const k = UI.tarjeta({ titulo, sub, alto: 250, ayuda, datos: { titulo: titulo + ' · datos', csv: 'balance', rows: partidas, cols: [{ t: 'Partida', v: (r) => r.nombre, o: (r) => r.nombre }, { t: 'Importe', num: 1, v: (r) => m(r.importe), o: (r) => r.importe }, { t: '% del capital', num: 1, v: (r) => pct(r.importe / capital, 1), o: (r) => r.importe }, { t: 'Estado', v: (r) => C.est(r.estado), o: (r) => r.estado, csv: (r) => r.estado }, { t: 'Fuente', v: (r) => r.fuente || '', o: (r) => r.fuente || '' }], nota: 'Balance tal como lo calcula el informe. Pulsa una fila para ver su nota.' } });
      Dash.mk(k.cv, UI.clicable({ type: 'doughnut', data: { labels: p.map((x) => x.nombre), datasets: [{ data: p.map((x) => x.importe), backgroundColor: p.map((_, i) => C.pal[i % C.pal.length]), borderColor: C.css('--pan'), borderWidth: 2, hoverOffset: 8 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + m(c.parsed) + ' (' + pct(c.parsed / tot) + ')' } } } } }, (e) => Dash.abrirPartida(p[e.index], capital, ambito)));
      k.c.append(Dash.leyenda(p.map((x, i) => ({ nombre: x.nombre, estado: x.estado, color: C.pal[i % C.pal.length], valor: m(x.importe) + ' · ' + pct(x.importe / tot, 0), p: x })), (i) => Dash.abrirPartida(i.p, capital, ambito)));
      k.c.append(el('div', { class: 'foot' }, 'Suma de partidas ' + m(partidas.reduce((a, x) => a + x.importe, 0)) + ' frente a un capital de ' + m(capital) + ' (diferencia ' + m(partidas.reduce((a, x) => a + x.importe, 0) - capital) + '). Es un descuadre del modelo, no una pérdida demostrada.'));
      return k.c;
    };
    const fila = [];
    if (T.partidas) fila.push(dona('TRON · tras convertir el robo', 'Capital ' + m(T.capital) + ' · pulsa para profundizar', T.partidas, T.capital, 'tron', TXT.ay.reparto));
    if (G.partidas) fila.push(dona('Visión global · todas las cadenas', 'Capital ' + m(G.capital), G.partidas, G.capital, 'global', TXT.ay.global));
    if (fila.length) s.append(el('div', { class: 'grid g2' }, fila));

    const conFase = (T.partidas || []).filter((p) => (p.desglose || []).some((x) => /foto/i.test(x.fase)));
    if (conFase.length) {
      const f = (rx) => conFase.map((p) => (p.desglose.find((x) => rx.test(x.fase)) || {}).importe || 0);
      const k = UI.tarjeta({ titulo: 'Antes y después de la «foto» (30-oct, 22:40 UTC)', sub: 'La «foto» es un corte fijo en el tiempo (se explica en el capítulo 2). Importe atribuido al robo por destino · pulsa una barra.', alto: 300, ayuda: TXT.ay.antesDespues, datos: { titulo: 'Antes y después de la foto', csv: 'antes-despues', rows: conFase, cols: [{ t: 'Partida', v: (r) => r.nombre, o: (r) => r.nombre }, { t: 'Después de la foto', num: 1, v: (r) => m((r.desglose.find((x) => /despu/i.test(x.fase)) || {}).importe || 0), o: (r) => (r.desglose.find((x) => /despu/i.test(x.fase)) || {}).importe || 0 }, { t: 'Antes de la foto', num: 1, v: (r) => m((r.desglose.find((x) => /antes/i.test(x.fase)) || {}).importe || 0), o: (r) => (r.desglose.find((x) => /antes/i.test(x.fase)) || {}).importe || 0 }] } });
      Dash.mk(k.cv, UI.clicable({ type: 'bar', data: { labels: conFase.map((p) => Dash.corto(p.nombre, 36)), datasets: [{ label: 'Después de la foto', data: f(/despu/i), backgroundColor: C.pal[0], borderRadius: 4 }, { label: 'Antes de la foto', data: f(/antes/i), backgroundColor: C.pal[2], borderRadius: 4 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, ...Dash.ejes.dinero() }, y: { stacked: true, ...Dash.ejes.cat() } }, plugins: { tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + m(c.parsed.x) } } } } }, (e, ch) => Dash.abrirPartida(conFase[e.index], T.capital, 'tron', e.datasetIndex === 0 ? 'Después de la foto' : 'Antes de la foto')));
      s.append(el('div', { style: 'margin-top:14px' }, k.c));
    }
  });
})();
