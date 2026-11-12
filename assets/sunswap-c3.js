/* Capítulos 7 a 9 de la página de sun.io: historia, anomalías y riesgos, método y evidencia. */
(function () {
  const { el, n, m, pct, VS, VC } = SS;
  const col = (x) => VC[x] || SS.GRIS, pn = SS.pn;
  const T = (k) => SS.d.tablas[k];
  const limpia = (s) => String(s).replace(/`[^`]*`/g, '').replace(/\s+/g, ' ').trim();
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const dd = (s) => s.slice(8).replace(/^0/, '') + ' ' + MES[+s.slice(5, 7) - 1] + ' ' + s.slice(2, 4);
  const logY = (min, max, f) => ({ type: 'logarithmic', min, max, ticks: { maxRotation: 0, callback: (v) => { const e = Math.pow(10, Math.round(Math.log10(v))); return Math.abs(v / e - 1) < 1e-9 ? f(v) : ''; } }, grid: { color: C.css('--line') } });

  /* ============================== 7 · Un año de historia ============================== */
  SS.add(70, (app, d) => {
    const k = d.kpi, cd = d.capitalDia, dias = cd.dias, N = dias.length; app.append(SS.cap(7));
    const suma = dias.map((_, i) => VS.reduce((a, v) => a + (cd[v][i] || 0), 0));
    app.append(SS.llano(
      'El capital total reconstruido pasó de <b>' + k.CAP_0 + '</b> el 11-nov-2025 a <b>' + k.CAP_1 + '</b> el 11-nov-2026: <b>−' + k.CAP_VAR + '</b>. El camino no fue una línea recta: bajó a 440,6 M$ el 1-dic-2025, subió a 619,3 M$ el 1-nov-2026 y cayó con las retiradas de los primeros días de noviembre de 2026.',
      '<b>V1 perdió el 68,2 % de su capital</b>; V3 retiró 110,18 M$ en un solo día en noviembre de 2025 (y repuso 108,82 M$ ese mismo día) y 137,20 M$ el 8-may-2026; <b>V4 nació en diciembre de 2025</b> y el 11-nov-2026 tenía 131,54 M$.',
      'Para cada día se reconstruye el capital con las cantidades de los eventos y el precio del día (V1 y V2: reservas; V3 y V4: principal de las posiciones). Es una reconstrucción ' + '<span class="est est-ESTIMADO">ESTIMADO</span>' + '; el método es <span class="est est-VERIFICADO">VERIFICADO</span>.'));
    const EV = [{ dia: '2025-11-21', t: 'V3: retira 110,2 M$ y repone 108,8 M$' }, { dia: '2025-12-01', t: 'Mínimo: 440,6 M$' }, { dia: '2025-12-30', t: 'V4 empieza a tener capital' }, { dia: '2026-05-08', t: 'V3: retira 137,2 M$' }, { dia: '2026-11-01', t: 'Máximo reciente: 619,3 M$' }];
    const plugin = { id: 'hitos', afterDatasetsDraw(ch) { const x = ch.scales.x, a = ch.chartArea, c = ch.ctx; c.save(); c.font = '11px sans-serif'; c.fillStyle = C.css('--mut'); c.strokeStyle = C.css('--mut'); c.setLineDash([3, 3]); c.lineWidth = 1;
      for (const e of EV) { const i = dias.indexOf(e.dia); if (i < x.min || i > x.max) continue; const px = x.getPixelForValue(i); c.beginPath(); c.moveTo(px, a.top); c.lineTo(px, a.bottom); c.stroke(); c.save(); c.translate(px + 4, a.top + 4); c.rotate(Math.PI / 2); c.textAlign = 'left'; c.fillText(e.t, 0, 0); c.restore(); } c.restore(); } };
    const f1 = el('div', { class: 'ss-fila', style: 'grid-template-columns:1fr' }); app.append(f1);
    let th; const per = el('div', { class: 'ss-per' }, 'Periodo: ');
    const PER = [['Todo el año', 0], ['Últimos 6 meses', N - 183], ['3 meses', N - 92], ['30 días', N - 31]];
    PER.forEach(([t, i0], j) => { const b = el('button', { type: 'button', class: j === 0 ? 'on' : '', onclick: () => { per.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); th.chart.options.scales.x.min = i0; th.chart.options.scales.x.max = N - 1; th.chart.update(); } }, t); per.append(b); });
    const chips = SS.interruptores([...VS.map((v) => ({ id: v, nombre: v, color: col(v) })), { id: 'Suma', nombre: 'Suma', color: C.css('--fg') || '#e2e8f0' }], (v, on) => { th.chart.setDatasetVisibility(v === 'Suma' ? 4 : VS.indexOf(v), on); th.chart.update(); });
    th = SS.grafico(f1, { titulo: 'Capital reconstruido por versión, día a día', sub: '11-nov-2025 → 11-nov-2026 · 366 días · las líneas verticales marcan los hitos que cuenta el informe', alto: 380, filtros: el('div', null, per, chips),
      ayuda: [{ k: 'Qué muestra', v: 'El capital valorado de cada versión en cada día de la ventana, y su suma.' }, { k: 'Cómo se lee', l: ['Pasa el ratón por el gráfico para ver el valor de cada versión ese día.', 'Los botones de periodo acercan el gráfico; los de versión ocultan líneas.', 'V1 y V2 usan las reservas de cada día; V3 y V4, el principal de las posiciones. V4 no existe antes de diciembre de 2025.', 'Las rayas verticales son hitos que el informe cita (apartados 11.1 y 12.4).'] }],
      datos: SS.datosPropios('Capital reconstruido por día', 'Los 366 valores diarios que dibuja el gráfico. El informe (apartado 11.1) publica el primer día de cada mes; las tablas están más abajo.', ['Día', ...VS.map((v) => ({ t: v, num: 1, f: (x) => (x == null ? '—' : m(x)) })), { t: 'Suma', num: 1, f: (x) => m(x) }], dias.map((x, i) => [x, ...VS.map((v) => cd[v][i]), suma[i]]), 'sunswap-capital-diario'),
      cfg: () => ({ type: 'line', plugins: [plugin], data: { labels: dias, datasets: [...VS.map((v) => ({ label: v, data: cd[v], borderColor: col(v), backgroundColor: col(v), borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.15, spanGaps: false })), { label: 'Suma', data: suma, borderColor: C.css('--fg') || '#e2e8f0', backgroundColor: C.css('--fg') || '#e2e8f0', borderWidth: 2.5, borderDash: [6, 4], pointRadius: 0, pointHoverRadius: 4 }] }, options: { interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: { callbacks: { title: (it) => dd(it[0].label) + ' 20' + it[0].label.slice(2, 4), label: (c) => ' ' + c.dataset.label + ': ' + (c.raw == null ? '—' : m(c.raw)) } } }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 12, autoSkip: true, maxRotation: 0, callback(v) { return dd(this.getLabelForValue(v)); } } }, y: SS.eje.dinero() } } }) });
    app.append(SS.acordeon('Tablas del apartado 11.1: el primer día de cada mes y los extremos de cada versión', SS.tabla('11.1#0', { pp: 13, buscar: false }), el('p', { class: 'narr' }, 'Mínimo, máximo y variación de cada versión:'), SS.tabla('11.1#1', { pp: 6, buscar: false, texto: [1, 2, 3, 4, 5] })));

    const ef = d.efectos; const f2 = el('div', { class: 'ss-fila' }); app.append(f2);
    SS.grafico(f2, { titulo: '¿Por qué cambió el capital: por cantidades o por precios?', sub: 'Variación del capital de cada versión en la ventana, separada en dos efectos', alto: 290,
      ayuda: [{ k: 'Qué muestra', v: 'Si el capital de una versión bajó porque hay menos tokens (cantidades) o porque los tokens valen menos (precios).' }, { k: 'Cómo se lee', l: ['Efecto cantidades: lo que cambió por entradas y salidas de tokens.', 'Efecto precios: lo que cambió por el precio de los tokens.', 'En V3 casi toda la caída es de cantidades (retiradas); en V1, se reparte entre cantidades y precios.', 'V4 no aparece: nace dentro de la ventana, y la variación «desde cero» no es comparable.'] }],
      datos: SS.datos('11.2#1', 'Cantidades frente a precios', 'La tabla del apartado 11.2 del informe.'),
      cfg: () => ({ type: 'bar', data: { labels: ef.map((x) => x.v), datasets: [{ label: 'Variación del capital', data: ef.map((x) => x.variacion), backgroundColor: '#64748b' }, { label: 'Efecto cantidades', data: ef.map((x) => x.cantidades), backgroundColor: '#3b82f6' }, { label: 'Efecto precios', data: ef.map((x) => x.precios), backgroundColor: '#f59e0b' }] }, options: { plugins: { tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + (c.raw < 0 ? '−' : '') + m(Math.abs(c.raw)) } } }, scales: { y: SS.eje.dinero((v) => (v < 0 ? '−' : '') + m(Math.abs(v))), x: SS.eje.cat() } } }) });
    const pv = d.profV3;
    SS.grafico(f2, { titulo: 'Profundidad estimada del mercado principal de V3', sub: 'WTRX/USDT 0,05 % · profundidad a ±1 %, media de venta y compra, fin de cada día', alto: 290,
      ayuda: [{ k: 'Qué muestra', v: 'Cuánto se podía mover en el mercado principal de V3 sin cambiar el precio más de un 1 %, día a día.' }, { k: 'Cómo se lee', l: ['Es una estimación simulada, no profundidad ejecutable.', 'Cuando los proveedores retiran o recolocan su liquidez, la profundidad cae o se mueve aunque el capital total apenas cambie.'] }],
      datos: SS.datosPropios('Profundidad ±1 % del mercado principal de V3', 'Un valor por día (figura del apartado 8.7 del informe).', ['Día', { t: 'Profundidad ±1 %', num: 1, f: (x) => m(x) }], pv.map((x) => [x.dia, x.usd]), 'sunswap-profundidad-v3'),
      cfg: () => ({ type: 'line', data: { labels: pv.map((x) => x.dia), datasets: [{ label: 'Profundidad ±1 %', data: pv.map((x) => x.usd), borderColor: VC.V3, backgroundColor: VC.V3 + '33', fill: true, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.1 }] }, options: { interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: { callbacks: { title: (it) => dd(it[0].label) + ' 20' + it[0].label.slice(2, 4), label: (c) => ' ' + m(c.raw) } } }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 8, autoSkip: true, maxRotation: 0, callback(v) { return dd(this.getLabelForValue(v)); } } }, y: Object.assign(SS.eje.dinero(), { min: 0 }) } } }) });
    app.append(SS.acordeon('Creación e inactividad de mercados (apartado 11.3)', SS.tabla('11.3#0', { pp: 6, buscar: false })));
    app.append(SS.acordeon('Cambios de régimen y volatilidad (apartado 11.4)', SS.tabla('11.4#0', { pp: 6, buscar: false, texto: [2] }), SS.tabla('11.4#1', { pp: 6, buscar: false, texto: [5] })));
    app.append(SS.aviso('Lo que falta:', 'el informe indica los periodos y partes sin datos y no presenta históricos parciales como completos (apartado 11.6); el contraste con DefiLlama está en el apartado 11.5.'));
    app.append(SS.recap(7, [
      'El capital total pasó de <b>' + k.CAP_0 + '</b> a <b>' + k.CAP_1 + '</b> (−' + k.CAP_VAR + ') con un camino muy irregular.',
      '<b>V1 perdió el 68,2 %</b>; V3 hizo dos retiradas gigantes (noviembre de 2025 y 8-may-2026); V4 nació en diciembre de 2025.',
      'En V3 la caída es casi toda de <b>cantidades</b> (retiradas), no de precios.'], 'Siguiente: lo raro.'));
  });

  /* ============================== 8 · Anomalías y riesgos ============================== */
  SS.add(80, (app, d) => {
    app.append(SS.cap(8));
    app.append(SS.llano(
      'Buscamos cosas raras en los datos: días con un volumen enorme frente a lo normal, retiradas gigantes, desequilibrios entre los dos lados de un mercado y tokens que podrían alterar un intercambio. <b>Cada una se describe y se clasifica por su certeza; ninguna se califica de manipulación.</b>',
      'Por ejemplo: el 29-oct-2026 V3 WTRX/USDT movió 423 M$ en un día (17 veces su mediana), con dos compras de exactamente 30.000.000 USDT, una en V3 WTRX/USDT y otra en V4 TRX/USDT, con 11 minutos de diferencia; y las mayores retiradas del año son de una misma cuenta.'));
    app.append(el('div', { class: 'res-head warn', style: 'margin:12px 0' }, el('div', { class: 'big', style: 'font-size:17px' }, 'Una anomalía no es una acusación'), el('div', { class: 'sub2', html: 'Son hechos medidos en la cadena (<span class="est est-VERIFICADO">VERIFICADO</span> el hecho) con sus causas posibles como <span class="est est-HIPÓTESIS">HIPÓTESIS</span>. El informe da, para cada una, las explicaciones alternativas y lo que no se sabe.' })));
    app.append(el('h3', { class: 'ss-sub' }, 'Los hallazgos, uno por uno'));
    app.append(el('p', { class: 'narr' }, 'Tabla del apartado 12.2. Filtra por nivel de certeza con el desplegable.'));
    app.append(SS.tabla('12.2#0', { pp: 14, buscar: true, texto: [1, 2, 4], extra: { filtros: [{ t: 'Certeza', opciones: ['VERIFICADO', 'ESTIMADO', 'HIPÓTESIS', 'DESCONOCIDO'], fn: (r, op) => SS.norm(r[3]).includes(op) }], ph: 'Buscar un hallazgo…' } }));

    const pk = T('12.3#0').filas.map((f) => ({ mercado: f[0], dia: f[1], vol: f[2], med: f[3], veces: pn(f[4]) || 1, mayor: f[5], parte: f[6] }));
    const f1 = el('div', { class: 'ss-fila' }); app.append(f1);
    SS.grafico(f1, { titulo: 'Los mayores picos de volumen', sub: 'Cuántas veces su volumen normal movió un mercado en un solo día · eje logarítmico', alto: 360,
      ayuda: [{ k: 'Qué muestra', v: 'Los doce días en que un mercado movió muchas veces más de lo que suele (volumen del día ÷ máximo entre la mediana de los 30 días anteriores y 1.000 $).' }, { k: 'Cómo se lee', l: ['Cuanto más a la derecha, más veces su volumen normal.', 'Los picos de más de mil veces son de mercados casi vacíos: la mediana previa era de unos pocos cientos de dólares.', 'Pasa el ratón para ver el volumen del día, la mediana previa y la mayor operación.'] }],
      datos: SS.datos('12.3#0', 'Picos de volumen', 'La tabla del apartado 12.3 del informe, con la transacción de la mayor operación de cada día.', { texto: [0] }),
      cfg: () => ({ type: 'bar', data: { labels: pk.map((x) => x.mercado + ' · ' + x.dia), datasets: [{ data: pk.map((x) => x.veces), backgroundColor: pk.map((x) => col(x.mercado.slice(0, 2))), borderRadius: 4 }] }, options: { indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + n(c.raw) + ' veces su volumen normal', afterLabel: (c) => ['Volumen del día: ' + pk[c.dataIndex].vol, 'Mediana de los 30 días anteriores: ' + pk[c.dataIndex].med, 'Mayor operación: ' + pk[c.dataIndex].mayor + ' (' + pk[c.dataIndex].parte + ' del día)'] } } }, scales: { x: logY(1, 1e5, (v) => n(v) + '×'), y: Object.assign(SS.eje.cat(), { ticks: { autoSkip: false } }) } } }) });
    const rt = T('12.4#0').filas.map((f) => ({ v: f[0], dia: f[1], ret: pn(f[2]), n: f[3], add: pn(f[4]), altas: f[5] }));
    SS.grafico(f1, { titulo: 'Las mayores retiradas de liquidez en un día', sub: 'Retirado frente a lo añadido ese mismo día', alto: 360,
      ayuda: [{ k: 'Qué muestra', v: 'Los diez días de mayor retirada, con lo retirado y lo añadido ese día.' }, { k: 'Cómo se lee', l: ['Si la barra azul casi iguala a la roja, el dinero salió y volvió a entrar el mismo día (recolocación).', 'Si no, fue una salida neta.', 'Abajo, la tabla del apartado 12.4 con las transacciones de las mayores retiradas individuales.'] }],
      datos: SS.datos('12.4#0', 'Retiradas extraordinarias', 'La tabla del apartado 12.4 del informe.'),
      cfg: () => ({ type: 'bar', data: { labels: rt.map((x) => x.v + ' · ' + x.dia), datasets: [{ label: 'Retirado', data: rt.map((x) => x.ret), backgroundColor: '#ef4444', borderRadius: 3 }, { label: 'Añadido ese día', data: rt.map((x) => x.add), backgroundColor: '#3b82f6', borderRadius: 3 }] }, options: { indexAxis: 'y', plugins: { tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + m(c.raw), afterBody: (it) => rt[it[0].dataIndex].n + ' retiradas · ' + rt[it[0].dataIndex].altas + ' altas ese día' } } }, scales: { x: SS.eje.dinero(), y: Object.assign(SS.eje.cat(), { ticks: { autoSkip: false } }) } } }) });
    app.append(SS.acordeon('Las mayores retiradas individuales, con su transacción (tabla del apartado 12.4)', SS.tabla('12.4#1', { pp: 10, buscar: false, texto: [1] })));
    app.append(SS.acordeon('Desequilibrios entre los dos lados de un mercado V1 y V2 (apartado 12.5)', SS.tabla('12.5#0', { pp: 10, buscar: false })));
    app.append(SS.acordeon('Tokens que podrían alterar un intercambio (apartado 12.7)', el('p', { class: 'narr' }, 'Tokens cuyo contrato tiene señales de impuestos, bloqueos u otros mecanismos que podrían cambiar lo que recibe quien intercambia. Es una lista de señales, no una acusación.'), SS.tabla('12.7#0', { pp: 8, buscar: false, texto: [2, 3, 4] })));
    app.append(SS.recap(8, [
      'El <b>29-oct-2026</b> hubo un día de 423 M$ en V3 WTRX/USDT (17 veces lo normal), con dos compras de exactamente 30 M USDT.',
      'Las mayores retiradas del año son de <b>una misma cuenta</b>; en dos casos el dinero volvió a entrar el mismo día.',
      'Ninguna anomalía se califica de manipulación: están descritas, con sus explicaciones alternativas.'], 'Siguiente: cómo se hizo y qué no se sabe.'));
  });

  /* ============================== 9 · Método, límites y evidencia ============================== */
  SS.add(90, (app, d) => {
    const k = d.kpi, v = d.validacion; app.append(SS.cap(9));
    const tot = VS.reduce((a, x) => a + v[x].tot, 0), comp = VS.reduce((a, x) => a + v[x].coi + v[x].dif, 0), sinq = VS.reduce((a, x) => a + v[x].cpu + v[x].rev, 0), fuera = VS.reduce((a, x) => a + v[x].ven, 0);
    app.append(SS.llano(
      'Los importes en dólares son siempre <b>estimados</b>: las cantidades (saldos, eventos, volúmenes) salen de la cadena y se valoran con precios de DefiLlama contrastados con Binance. Para que se pueda <b>comprobar</b>, el motor que simula las operaciones se contrastó con los contratos oficiales de sun.io y con intercambios reales.',
      'De <b>' + n(tot) + '</b> cotizaciones pedidas a los contratos (sin enviar ninguna transacción), ' + n(comp) + ' se pudieron comparar y <b>solo 2 salieron distintas</b> (las dos del mercado V4 con un «hook» sin caracterizar); de <b>' + k.RE_N + ' intercambios reales</b> re-ejecutados, ' + k.RE_EX + ' coinciden exactos.',
      '<b>Lo que no se sabe</b> está escrito: el TVL completo (faltan precios fiables de unos 15.100 tokens menores), la profundidad realmente ejecutable, el origen del capital anterior a la ventana, la identidad de cualquier dirección y las causas de los grandes movimientos.'));
    app.append(el('div', { class: 'kpis2' }, SS.kpi('Cotizaciones de los contratos', n(tot), 'sin enviar ninguna transacción · VERIFICADO'), SS.kpi('Comparables', n(comp), 'idénticas salvo 2 (hook de V4) · VERIFICADO'), SS.kpi('Intercambios reales reproducidos', k.RE_EX + ' de ' + k.RE_N, k.RE_D2 + ' con diferencia de hasta 2 unidades mínimas; ' + k.RE_DI + ' «redondos» · VERIFICADO')));
    const f1 = el('div', { class: 'ss-fila' }); app.append(f1);
    const cat = [['coi', 'Idénticas', '#10b981'], ['dif', 'Distintas', '#ef4444'], ['sinq', 'Sin cotización del contrato', '#f59e0b'], ['ven', 'Fuera de la ventana del motor', '#64748b']];
    const val = (x, c) => (c === 'sinq' ? v[x].cpu + v[x].rev : v[x][c]);
    SS.grafico(f1, { titulo: 'El motor frente a los cotizadores oficiales de los contratos', sub: 'Cotizaciones por versión, en % de las pedidas (' + n(tot) + ' en total)', alto: 260,
      ayuda: [{ k: 'Qué muestra', v: 'Para cada versión, qué pasó al comparar lo que calcula el motor con lo que cotiza el contrato oficial.' }, { k: 'Cómo se lee', l: ['Verde: idénticas al último decimal. Rojo: distintas (solo 2, en V4).', 'Ámbar: el contrato no devolvió cotización (límite de cómputo o «REVERT»).', 'Gris: la operación sale del mapa de ticks que leyó el motor; de esas, las 55 en que el contrato sí cotizó coinciden al usar el mapa completo.'] }],
      datos: SS.datosPropios('Motor frente a los contratos', 'Recuentos por versión (apartado 8.2 del informe).', ['Versión', { t: 'Pedidas', num: 1, f: (x) => n(x) }, { t: 'Idénticas', num: 1, f: (x) => n(x) }, { t: 'Distintas', num: 1, f: (x) => n(x) }, { t: 'Sin cotización del contrato', num: 1, f: (x) => n(x) }, { t: 'Fuera de la ventana', num: 1, f: (x) => n(x) }], VS.map((x) => [x, v[x].tot, v[x].coi, v[x].dif, v[x].cpu + v[x].rev, v[x].ven]), 'sunswap-validacion-contratos'),
      cfg: () => ({ type: 'bar', data: { labels: VS, datasets: cat.map(([c, t, co]) => ({ label: t, data: VS.map((x) => (val(x, c) / v[x].tot) * 100), backgroundColor: co })) }, options: { indexAxis: 'y', plugins: { tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + n(val(VS[c.dataIndex], cat[c.datasetIndex][0])) + ' (' + n(c.raw, 1) + ' %)' } } }, scales: { x: { stacked: true, max: 100, ticks: { callback: (x) => x + ' %' }, grid: { color: C.css('--line') } }, y: { stacked: true, grid: { display: false } } } } }) });
    f1.append(SS.caja('Los tres niveles de evidencia de la profundidad', el('div', { class: 'cs' }, 'Tabla del apartado 8.1 del informe'), SS.tabla('8.1#0', { pp: 6, buscar: false, texto: [0] }), el('p', { class: 'narr' }, 'Ningún mercado alcanza el nivel «ejecutable demostrada»: haría falta enviar transacciones.')));

    app.append(el('h3', { class: 'ss-sub' }, 'Ejemplos que se pueden comprobar ahora mismo'));
    app.append(el('p', { class: 'narr' }, '14 transacciones del informe, con su hash completo y enlace a TronScan (apartado 16.1). Pulsa el hash para abrirla.'));
    app.append(SS.tabla('16.1#0', { pp: 7, buscar: true, texto: [1, 2], extra: { ph: 'Buscar una transacción…' } }));
    app.append(SS.acordeon('Los contratos oficiales de sun.io, verificados (apartado 5.1)', SS.tabla('5.1#0', { pp: 10, buscar: false, texto: [0, 2, 3] })));
    app.append(SS.acordeon('Mercados clave con su identificador completo (apartado 16.2)', SS.tabla('16.2#0', { pp: 6, buscar: false, texto: [0, 1] })));
    app.append(SS.acordeon('Cuántos mercados hay y en qué estado (apartado 5.2)', SS.tabla('5.2#0', { pp: 6, buscar: false })));
    app.append(el('h3', { class: 'ss-sub' }, 'Método, conclusiones y límites'));
    app.append(SS.acordeon('Metodología (apartado 3)', SS.texto(d.textos.metodologia)));
    app.append(SS.acordeon('Conclusiones (apartado 14)', SS.texto(d.textos.conclusiones)));
    app.append(SS.acordeon('Limitaciones: lo que no se sabe y lo que no se midió (apartado 15)', SS.texto(d.textos.limitaciones)));
    app.append(SS.acordeon('Historial de correcciones y revisiones externas (apartado 16.7)', el('p', { class: 'narr' }, 'Los fallos que se encontraron, su causa y cómo se arreglaron, y las tres revisiones externas con sus puntos.'), SS.tabla('16.7#0', { pp: 6, buscar: false, texto: [1, 2, 3] }), SS.tabla('16.7#1', { pp: 8, buscar: false, texto: [0, 1, 2, 3] }), SS.tabla('16.7#2', { pp: 6, buscar: false, texto: [0, 1, 2] }), SS.tabla('16.7#3', { pp: 6, buscar: false, texto: [0, 1, 2] })));
    app.append(SS.acordeon('Informes de fase y huellas (apartado 16.3)', SS.tabla('16.3#0', { pp: 6, buscar: false, texto: [0, 1, 2, 3] })));
    app.append(el('div', { class: 'card', style: 'margin:16px 0' }, el('h3', null, 'Descargas y verificación'),
      el('p', { class: 'narr' }, 'Edición pública del informe validado (huella ', el('code', null, d.informe.huella), '). Si hay cambios se publica una edición nueva; esta no se retoca.'),
      el('div', { class: 'actions' }, el('a', { class: 'btn primary', href: SS.INFORME }, 'Leer el informe completo'), el('a', { class: 'btn', href: 'investigacion/docs/SUNSWAP-INFORME-FINAL-2026-11-12.md', target: '_blank', rel: 'noopener' }, 'Texto original (.md) ↗'), el('a', { class: 'btn', href: 'reports/sunswap-microscopio/data.json', target: '_blank', rel: 'noopener' }, 'Datos de esta página (JSON) ↗'), el('a', { class: 'btn', href: 'herramientas.html#liquidez-sunswap' }, 'Herramienta «Liquidez sun.io»'))));
    app.append(SS.recap(9, [
      'Los importes en dólares son <b>estimados</b>; el cálculo se contrastó con los contratos (' + n(comp) + ' cotizaciones comparables, solo 2 distintas) y con ' + k.RE_N + ' intercambios reales.',
      'La profundidad <b>ejecutable</b> no se afirma para ningún mercado.',
      'Lo que no se sabe está escrito: el TVL completo, el origen del capital anterior a la ventana y la identidad de cualquier dirección.'], ''));
  });
})();
