/* Capítulos 1 a 3 de la página de SUNSwap: lo esencial, dónde está el capital, concentración. */
(function () {
  const { el, n, m, pct, VS, VC } = SS;
  const par0 = (p) => p.replace(/ 0\.\d+ %$/, '');          // «WTRX/USDT 0.05 %» → «WTRX/USDT»
  const col = (x) => VC[x] || SS.GRIS;

  /* ============================== 1 · Lo esencial ============================== */
  SS.add(10, (app, d) => {
    const k = d.kpi, vol = d.volVersion.reduce((a, x) => a + x.uvc, 0), dos = d.titulares.dosMayores;
    const prof = Object.fromEntries(d.cuotas.map((c) => [c.v, c.profundidad])), capi = Object.fromEntries(d.cuotas.map((c) => [c.v, c.capital]));
    app.append(SS.cap(1));
    app.append(SS.llano(
      'SUNSwap es el principal intercambio descentralizado (DEX) de TRON. Reconstruimos <b>desde la propia cadena</b> cuánto capital hay en sus mercados, cómo se reparte, cuánto se puede mover de verdad, cuánto se opera, quién pone la liquidez y cómo cambió en un año (del 11-nov-2025 al 11-nov-2026).',
      'Lo que más sorprende: de <b>' + k.MKT_V1V4 + '</b> mercados registrados solo <b>' + k.ACT_TOT + '</b> están activos; <b>tres mercados reúnen el ' + k.TOP3 + '</b> del capital valorado; y tener capital no es lo mismo que tener liquidez: con el 1 % de movimiento de precio, V3 aporta el <b>' + pct(prof.V3, 1) + '</b> de la profundidad simulada y V4 el <b>' + pct(prof.V4, 1) + '</b>, y V2, con el ' + pct(capi.V2, 1) + ' del capital, solo el ' + pct(prof.V2, 1) + ' (mercados con los dos lados valorados).',
      'Cada cifra lleva su nivel de certeza (<span class="est est-VERIFICADO">VERIFICADO</span>, <span class="est est-ESTIMADO">ESTIMADO</span>, <span class="est est-HIPÓTESIS">HIPÓTESIS</span>, <span class="est est-DESCONOCIDO">DESCONOCIDO</span> o <span class="est est-PENDIENTE">PENDIENTE</span>) y lo que no se sabe está escrito en el capítulo 9. Los importes en dólares son siempre estimados.'));
    const ir = (i) => () => document.getElementById('cap-' + i).scrollIntoView({ behavior: 'smooth' });
    app.append(el('div', { class: 'kpis2' },
      SS.kpi('Capital valorado', k.TVL, 'valoración parcial · ESTIMADO', ir(2)),
      SS.kpi('Mercados activos', k.ACT_TOT, 'de ' + k.MKT_V1V4 + ' registrados: con liquidez y algún evento en 30 días · VERIFICADO', ir(2)),
      SS.kpi('Los tres mayores mercados', k.TOP3, 'del capital valorado · ESTIMADO', ir(3)),
      SS.kpi('Volumen bruto en el año', m(vol), 'suma de lo operado, sin descontar doble recuento · ESTIMADO', ir(5)),
      SS.kpi('Dos cuentas tienen hoy', pct(dos, 1), 'del capital valorado; no se atribuye identidad · ESTIMADO', ir(6)),
      SS.kpi('Capital en el año', '−' + k.CAP_VAR, k.CAP_0 + ' → ' + k.CAP_1 + ' · ESTIMADO', ir(7))));

    app.append(el('h3', { class: 'ss-sub' }, 'Los ' + d.resumen.length + ' hallazgos del resumen ejecutivo'));
    app.append(el('p', { class: 'narr' }, 'Texto del apartado 1 del informe, punto por punto. Pulsa uno para leerlo.'));
    d.resumen.forEach((r) => app.append(el('details', { class: 'ss-det ss-hall' }, el('summary', null, el('span', { class: 'nn' }, String(r.n)), r.titulo.replace(/:$/, ''), el('span', { class: 'ss-peq', style: 'font-weight:400' }, ' · ' + (r.texto.replace(/\*\*|`/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').slice(0, 105).replace(/\s+\S*$/, '') + '…'))), el('div', { class: 'ss-detc' }, el('p', { html: SS.md(r.texto) })))));
    app.append(SS.acordeon('Las 8 preguntas de la investigación y su respuesta corta', SS.tabla('2#0', { pp: 10, buscar: false })));
    app.append(SS.recap(1, [
      'SUNSwap tiene <b>' + k.MKT_V1V4 + ' mercados registrados</b>, pero solo <b>' + k.ACT_TOT + '</b> están activos.',
      'El capital valorado es <b>' + k.TVL + '</b>, con valoración parcial: solo cuenta lo que tiene precio fiable.',
      'Está <b>muy concentrado</b>: tres mercados reúnen el ' + k.TOP3 + ' y dos cuentas tienen aproximadamente el ' + pct(dos, 0) + '.',
      'Capital no es profundidad: <b>cuánto se puede vender de verdad</b> depende de la versión (capítulo 4).'], 'Siguiente: dónde está ese capital.'));
  });

  /* ============================== 2 · Dónde está el capital ============================== */
  SS.add(20, (app, d) => {
    const k = d.kpi, v = d.versiones; app.append(SS.cap(2));
    app.append(SS.llano(
      'Sumamos solo lo que tiene un precio fiable: <b>' + k.TVL + '</b> en total, con <b>V2 ' + pct(v[1].cuota, 1) + '</b>, V3 ' + pct(v[2].cuota, 1) + ', V4 ' + pct(v[3].cuota, 1) + ' y V1 ' + pct(v[0].cuota, 1) + '. Solo 34 tokens tienen un precio fiable; los demás no se valoran ni se inventan (apartado 6.5).',
      'Por monedas, <b>WTRX (el TRX «envuelto»)</b> es casi el 40 % del capital y, agrupando TRX y WTRX, el ' + k.ACT_TOP1 + '.',
      'En V3 y V4 el dinero depositado puede estar <b>fuera del rango de precios</b> donde se opera: está en el mercado, pero no hace de liquidez. Pulsa cualquier gráfico para ver el detalle.'));
    const f1 = el('div', { class: 'ss-fila' }); app.append(f1);
    const verVersion = (x) => UI.abrir('Mayores mercados de ' + x, () => el('div', null, el('p', { class: 'narr' }, 'Los 10 mayores mercados de ' + x + ' por capital valorado el 11-nov-2026. Pulsa una fila para ver su ficha. ', C.est('ESTIMADO')),
      UI.tabla({ pp: 10, buscar: false, csv: 'mayores-' + x, rows: d.mayoresVersion[x], onRow: (r) => SS.fichaMercado(r), cols: [{ t: 'Mercado', v: (r) => par0(r.par), o: (r) => r.par }, { t: 'Capital', num: 1, v: (r) => m(r.usd), o: (r) => r.usd, csv: (r) => Math.round(r.usd) }, { t: 'Cuota de ' + x, num: 1, v: (r) => pct(r.cuota, 2), o: (r) => r.cuota, csv: (r) => r.cuota }, { t: 'Estado', v: (r) => r.estado, o: (r) => r.estado }] })), { ancho: true });
    SS.grafico(f1, { titulo: 'Capital valorado por versión', sub: k.TVL + ' en total · pulsa una porción para ver sus mayores mercados', alto: 250,
      ayuda: [{ k: 'Qué muestra', v: 'Cuánto capital hay en cada versión de SUNSwap el 11-nov-2026, valorado en dólares solo donde hay precio fiable.' }, { k: 'Cómo se lee', l: ['Cada porción es una versión; su tamaño es su capital.', 'Debajo, para cada versión: mercados registrados y activos.', 'Pulsa una porción o una fila para ver los mayores mercados de esa versión.'] }],
      datos: SS.datos('6.1#0', 'Capital valorado por versión', 'La tabla del apartado 6.1 del informe.'),
      extra: SS.leyenda(v.map((x) => ({ id: x.v, nombre: x.v, color: col(x.v), estado: null, desc: n(x.mercados) + ' mercados · ' + n(x.estados.activo || 0) + ' activos', valor: m(x.tvl) + ' · ' + pct(x.cuota, 1) })), (i) => verVersion(i.id)),
      cfg: () => SS.cursor({ type: 'doughnut', data: { labels: VS, datasets: [{ data: v.map((x) => x.tvl), backgroundColor: VS.map(col), borderColor: C.css('--pan'), borderWidth: 2 }] }, options: { cutout: '62%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + m(c.raw) + ' · ' + pct(v[c.dataIndex].cuota, 1) } } } } }, (e) => verVersion(VS[e.index])) });
    const t10 = d.mayores.slice(0, 10);
    SS.grafico(f1, { titulo: 'Los 10 mayores mercados', sub: 'Capital valorado · color = versión · pulsa una barra para ver su ficha', alto: 330,
      ayuda: [{ k: 'Qué muestra', v: 'Los diez mercados con más capital valorado de las cuatro versiones.' }, { k: 'Cómo se lee', l: ['Cada barra es un mercado; el color es su versión (V1 violeta, V2 azul, V3 ámbar, V4 verde).', 'Pulsa una barra para ver su identificador completo y comprobarlo en TronScan.'] }],
      datos: SS.datos('6.2#0', 'Los mayores mercados', 'La tabla del apartado 6.2 del informe (con la observación de cada mercado).'),
      cfg: () => SS.cursor({ type: 'bar', data: { labels: t10.map((x) => par0(x.par) + ' · ' + x.v), datasets: [{ data: t10.map((x) => x.usd), backgroundColor: t10.map((x) => col(x.v)), borderRadius: 4 }] }, options: { indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + m(c.raw) + ' · ' + pct(t10[c.dataIndex].cuota, 2) + ' del total' } } }, scales: { x: SS.eje.dinero(), y: Object.assign(SS.eje.cat(), { ticks: { autoSkip: false } }) } } }, (e) => SS.fichaMercado(t10[e.index])) });

    const f2 = el('div', { class: 'ss-fila' }); app.append(f2);
    const tk = d.tokens;
    SS.grafico(f2, { titulo: 'Capital por token', sub: 'Los 15 tokens con más capital valorado (el valor de cada lado de cada mercado, sumado por token)', alto: 380,
      ayuda: [{ k: 'Qué muestra', v: 'Cuánto capital valorado hay en cada token, sumando todos los mercados en los que aparece.' }, { k: 'Cómo se lee', l: ['Cada mercado reparte su capital entre sus dos tokens; la suma de todos los tokens es el capital valorado total.', 'En ámbar, el TRX y sus formas envueltas; en azul, el resto. La cuota está calculada sobre ese total.'] }],
      datos: SS.datosPropios('Capital por token', 'Los 15 tokens del gráfico, con su dirección completa; el informe (apartado 6.3) publica los 8 mayores.', ['Token', { t: 'Dirección', f: (x) => SS.celda(x) }, { t: 'Capital valorado', num: 1, f: (x) => m(x) }, { t: 'Cuota', num: 1, f: (x) => pct(x, 2) }, { t: 'Mercados', num: 1 }, 'Fiabilidad del precio'], tk.map((t) => [t.simbolo, t.token, t.usd, t.cuota, t.mercados, t.fiabilidad]), 'sunswap-capital-por-token'),
      cfg: () => ({ type: 'bar', data: { labels: tk.map((t) => t.simbolo), datasets: [{ data: tk.map((t) => t.usd), backgroundColor: tk.map((t) => (/^(WTRX|TRX|sTRX)$/.test(t.simbolo) ? '#f59e0b' : '#3b82f6')), borderRadius: 4 }] }, options: { indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + m(c.raw) + ' · ' + pct(tk[c.dataIndex].cuota, 1) + ' · en ' + n(tk[c.dataIndex].mercados) + ' mercados' } } }, scales: { x: SS.eje.dinero(), y: Object.assign(SS.eje.cat(), { ticks: { autoSkip: false } }) } } }) });
    const tp = d.tipos, totTp = tp.reduce((a, x) => a + x.usd, 0), colTp = ['#f59e0b', '#3b82f6', '#64748b'];
    SS.grafico(f2, { titulo: 'Capital por tipo de activo', sub: 'TRX y WTRX, stablecoins y otros tokens con precio fiable', alto: 250,
      ayuda: [{ k: 'Qué muestra', v: 'A qué tipo de activo pertenece el capital valorado.' }, { k: 'Cómo se lee', l: ['TRX y WTRX se agrupan: son el mismo activo (WTRX es TRX «envuelto» para usarlo en contratos).', 'Las stablecoins se identifican por su dirección, no por su nombre: muchas direcciones se llaman «USDT».'] }],
      datos: SS.datos('6.3#1', 'Capital por tipo de activo', 'La tabla del apartado 6.3 del informe.'),
      extra: SS.leyenda(tp.map((x, i) => ({ id: x.tipo, nombre: x.tipo, color: colTp[i], desc: '', valor: m(x.usd) + ' · ' + pct(x.usd / totTp, 1) }))),
      cfg: () => ({ type: 'doughnut', data: { labels: tp.map((x) => x.tipo), datasets: [{ data: tp.map((x) => x.usd), backgroundColor: colTp, borderColor: C.css('--pan'), borderWidth: 2 }] }, options: { cutout: '62%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + m(c.raw) + ' · ' + pct(c.raw / totTp, 1) } } } } }) });

    /* depositado frente a «en rango» (V3 y V4) */
    const rg = d.rango, rv = ['V3', 'V4'];
    app.append(el('h3', { class: 'ss-sub' }, 'Capital depositado frente a liquidez activa'));
    const f3 = el('div', { class: 'ss-fila' }); app.append(f3);
    SS.grafico(f3, { titulo: 'En V3 y V4, ¿cuánto del capital está en rango?', sub: 'Depositado y valorado, dividido en dentro y fuera del rango de precios actual', alto: 190,
      ayuda: [{ k: 'Qué muestra', v: 'En V3 y V4 cada proveedor elige un rango de precios donde su dinero hace de liquidez. Si el precio sale de ese rango, el dinero sigue depositado pero deja de ser liquidez.' }, { k: 'Cómo se lee', l: ['Azul: en rango (liquidez activa). Ámbar: fuera de rango. Gris: resto (comisiones pendientes y otros).', 'V1 y V2 reparten el capital en todo el rango, así que no tienen esta división.'] }],
      datos: SS.datos('6.4#0', 'Capital depositado frente a liquidez activa', 'La tabla del apartado 6.4 del informe.'),
      cfg: () => ({ type: 'bar', data: { labels: rv, datasets: [{ label: 'En rango (liquidez activa)', data: rv.map((x) => rg[x].enRangoUsd), backgroundColor: '#3b82f6' }, { label: 'Fuera de rango', data: rv.map((x) => rg[x].fueraUsd), backgroundColor: '#f59e0b' }, { label: 'Resto (comisiones y otros)', data: rv.map((x) => Math.max(0, Math.round(rg[x].restoUsd))), backgroundColor: '#64748b' }] }, options: { indexAxis: 'y', plugins: { tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + m(c.raw) + ' · ' + pct(c.raw / rg[rv[c.dataIndex]].depositadoValoradoUsd, 1) } } }, scales: { x: Object.assign(SS.eje.dinero(), { stacked: true }), y: { stacked: true, grid: { display: false } } } } }) });
    const fu = rg.V3.mayoresFuera.slice(0, 5);
    const tres = fu.slice(0, 3).reduce((a, x) => a + x.fueraUsd, 0);
    app.append(SS.aviso('El caso más claro:', 'el mercado V3 ' + fu[0].par + ' tiene <b>' + m(fu[0].fueraUsd) + '</b> fuera de rango y solo <b>' + m(fu[0].enRangoUsd) + '</b> en rango: contra él no se puede vender casi nada. Tres mercados de V3 concentran <b>' + m(tres) + '</b> de los ' + m(rg.V3.fueraUsd) + ' que están fuera de rango. ', C.est('ESTIMADO'), ' los importes; el patrón (capital depositado que no es liquidez) es del apartado 6.4.'));
    app.append(SS.herramienta('El monitor calcula, con los mercados vivos de SUNSwap, cuánto cuesta vender el importe que escribas de doce tokens por USDT.'));
    app.append(SS.recap(2, [
      'V2 reúne la mayor parte del capital (<b>' + pct(v[1].cuota, 1) + '</b>); V3 y V4 son más pequeñas pero más profundas.',
      'Los dos mayores mercados son <b>WTRX/USDT en V3 y TRX/USDT en V4</b>: sumados, más del 43 % del capital.',
      'WTRX es casi el 40 % del capital por token; con TRX, el <b>' + k.ACT_TOP1 + '</b>.',
      'En V3, el dinero «fuera de rango» (' + m(rg.V3.fueraUsd) + ') está depositado pero no hace de liquidez.'], 'Siguiente: cuánta parte reúnen los mayores.'));
  });

  /* ============================== 3 · Pocos mercados, pocas cuentas ============================== */
  SS.add(30, (app, d) => {
    const k = d.kpi, ac = d.acumulada, cn = d.concentracion; app.append(SS.cap(3));
    app.append(SS.llano(
      'Los <b>tres mayores mercados reúnen el ' + k.TOP3 + '</b> del capital valorado y los diez mayores el ' + k.TOP10 + '. El mayor, solo, tiene el ' + k.TOP1 + '. El índice HHI (' + k.HHI + ') solo se lee junto a esos porcentajes.',
      'Cuanto más a la derecha de la curva, más mercados hacen falta para reunir el capital. En <b>V3 y V4 un solo mercado reúne más del 80 %</b> del capital de su versión (' + pct(cn.V3.top1, 1) + ' y ' + pct(cn.V4.top1, 1) + '); en V1 hacen falta muchos más.',
      'Por cuentas, la concentración es aún mayor: <b>dos cuentas tienen hoy aproximadamente el ' + pct(d.titulares.dosMayores, 0) + '</b> del capital valorado. Ojo: ser titular hoy no es ser quien lo aportó, y no se atribuye identidad a ninguna dirección.'));
    const f1 = el('div', { class: 'ss-fila' }); app.append(f1);
    const Ns = Object.keys(ac.Conjunto).map(Number).sort((a, b) => a - b).filter((x) => x <= 100);
    const serie = (nombre) => Ns.map((N) => (ac[nombre][N] != null ? ac[nombre][N] * 100 : null));
    SS.grafico(f1, { titulo: '¿Cuántos mercados hacen falta para reunir el capital?', sub: 'Parte acumulada del capital que reúnen los N mayores (eje horizontal por pasos, no lineal)', alto: 300,
      ayuda: [{ k: 'Qué muestra', v: 'Si ordenas los mercados de mayor a menor, cuánto capital reúnen los N primeros.' }, { k: 'Cómo se lee', l: ['Una curva que sube muy rápido a la izquierda es un mercado muy concentrado.', 'Pulsa un nombre de la leyenda para ocultar o mostrar su curva.', 'Pasa el ratón por un punto para ver los datos exactos.'] }],
      datos: SS.datos('7.1#1', 'Parte acumulada del capital por número de mercados', 'La tabla del apartado 7.1 del informe (N = número de mercados mayores).'),
      cfg: () => ({ type: 'line', data: { labels: Ns.map((x) => 'Top ' + n(x)), datasets: ['V1', 'V2', 'V3', 'V4', 'Conjunto'].map((s) => ({ label: s, data: serie(s), borderColor: col(s), backgroundColor: col(s), borderWidth: s === 'Conjunto' ? 3 : 2, borderDash: s === 'Conjunto' ? [6, 4] : [], pointRadius: 3, tension: 0.15, spanGaps: true })) }, options: { interaction: { mode: 'index', intersect: false }, plugins: { tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + n(c.raw, 1) + ' %' } } }, scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + ' %' }, grid: { color: C.css('--line') } }, x: SS.eje.cat() } } }) });
    const cs = ['V1', 'V2', 'V3', 'V4', 'Conjunto'];
    SS.grafico(f1, { titulo: 'Qué parte reúnen el mayor, los 10 y los 50 mayores', sub: 'Por versión y en conjunto · el índice HHI sale al pasar el ratón', alto: 300,
      ayuda: [{ k: 'Qué muestra', v: 'Tres cortes de la misma curva: el mayor mercado, los diez mayores y los cincuenta mayores.' }, { k: 'Cómo se lee', l: ['Cuanto más altas las barras, más concentrado.', 'HHI es un índice de 0 a 10.000: cuanto más alto, más concentrado. Se lee siempre junto a los porcentajes.'] }],
      datos: SS.datos('7.1#0', 'Concentración por mercado', 'La tabla del apartado 7.1 del informe.'),
      cfg: () => ({ type: 'bar', data: { labels: cs, datasets: [{ label: 'El mayor', data: cs.map((s) => cn[s].top1 * 100), backgroundColor: '#ef4444' }, { label: 'Los 10 mayores', data: cs.map((s) => cn[s].top10 * 100), backgroundColor: '#f59e0b' }, { label: 'Los 50 mayores', data: cs.map((s) => cn[s].top50 * 100), backgroundColor: '#3b82f6' }] }, options: { plugins: { tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + n(c.raw, 1) + ' %', afterBody: (it) => 'HHI ' + n(cn[cs[it[0].dataIndex]].hhi) + ' · ' + n(cn[cs[it[0].dataIndex]].mercados) + ' mercados con capital valorado' } } }, scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + ' %' }, grid: { color: C.css('--line') } }, x: SS.eje.cat() } } }) });

    /* titularidad */
    app.append(el('h3', { class: 'ss-sub' }, 'Quién tiene hoy el capital'));
    const tt = d.titulares, a1 = tt.titulares[0], a2 = tt.titulares[1], quem = tt.quemadoParte, resto = Math.max(0, 1 - a1.parte - a2.parte - quem);
    const f2 = el('div', { class: 'ss-fila' }); app.append(f2);
    SS.grafico(f2, { titulo: 'El capital valorado según quién tiene hoy las posiciones', sub: 'Titulares actuales, no aportantes originales · fecha de la foto: ' + tt.dia, alto: 150,
      ayuda: [{ k: 'Qué muestra', v: 'A quién pertenecen hoy las posiciones de liquidez, según las direcciones que figuran como titulares.' }, { k: 'Cómo se lee', l: ['«Titular actual» no es «quien lo aportó»: las posiciones pueden haberse transferido (apartado 10.3 y capítulo 6).', '«Quemado»: tokens de liquidez enviados a una dirección de quema; ese capital no puede retirarse.', '«Resto» es la diferencia hasta el 100 %.'] }],
      datos: SS.datosPropios('Quién tiene hoy el capital', 'Las 8 mayores direcciones titulares de la foto del ' + tt.dia + ' (apartado 10.2 del informe).', ['Dirección', { t: 'Capital valorado', num: 1, f: (x) => m(x) }, { t: 'Parte', num: 1, f: (x) => pct(x, 2) }], tt.titulares.map((x) => [x.a, x.usd, x.parte]).map((r) => r), 'sunswap-titulares'),
      cfg: () => ({ type: 'bar', data: { labels: [''], datasets: [{ label: a1.a.slice(0, 8) + '…', data: [a1.parte * 100], backgroundColor: '#3b82f6' }, { label: a2.a.slice(0, 8) + '…', data: [a2.parte * 100], backgroundColor: '#8b5cf6' }, { label: 'Tokens LP enviados a quema', data: [quem * 100], backgroundColor: '#64748b' }, { label: 'Resto de titulares', data: [resto * 100], backgroundColor: '#10b981' }] }, options: { indexAxis: 'y', plugins: { tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + n(c.raw, 1) + ' %' } } }, scales: { x: { stacked: true, max: 100, ticks: { callback: (v) => v + ' %' }, grid: { color: C.css('--line') } }, y: { stacked: true, display: false } } } }) });
    app.append(el('p', { class: 'narr' }, el('b', null, 'Cuentas: '), 'la primera (', UI.enlace(SS.ts(a1.a), UI.corto(a1.a, 8, 6) + ' ↗', 'addr'), ') tiene el ' + pct(a1.parte, 1) + ' y la segunda (', UI.enlace(SS.ts(a2.a), UI.corto(a2.a, 8, 6) + ' ↗', 'addr'), ') el ' + pct(a2.parte, 1) + '. ', C.est('ESTIMADO'), ' La primera dirección es la que el ', el('a', { href: 'caso-vaneck.html' }, 'caso Vaneck / Justin Sun'), ' llama «la segunda cuenta»; este informe no atribuye identidad a ninguna dirección y el enlace es solo una referencia cruzada entre dos de nuestras investigaciones.'));
    app.append(SS.acordeon('Cómo cambió la concentración durante el año (tabla del apartado 7.4)', SS.tabla('7.4#0', { pp: 13, buscar: false, texto: [1, 2, 3, 4] })));
    app.append(SS.acordeon('Por token y por activo: la concentración de las monedas (apartado 7.2)', el('p', { html: 'El token con más capital es <b>WTRX (' + k.TOK_TOP1 + ')</b>; agrupando TRX y WTRX, el <b>' + k.ACT_TOP1 + '</b>. Hay 34 tokens con precio fiable; su HHI es 2.619 (por activo económico, 4.279).' })));
    app.append(SS.recap(3, [
      'Tres mercados reúnen el <b>' + k.TOP3 + '</b> y diez el <b>' + k.TOP10 + '</b> del capital valorado.',
      'En V3 y V4 un solo mercado reúne más del 80 % del capital de su versión; V1 está mucho más repartida.',
      'Dos cuentas tienen hoy aproximadamente el <b>' + pct(d.titulares.dosMayores, 0) + '</b>: titular actual no es aportante original.'], 'Siguiente: ese capital, ¿se puede vender de verdad?'));
  });
})();
