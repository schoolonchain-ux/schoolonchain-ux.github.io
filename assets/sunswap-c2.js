/* Capítulos 4 a 6 de la página de sun.io: profundidad, volumen y actividad, proveedores de liquidez. */
(function () {
  const { el, n, m, pct, VS, VC } = SS;
  const col = (x) => VC[x] || SS.GRIS, pn = SS.pn;
  const T = (k) => SS.d.tablas[k];
  const limpia = (s) => String(s).replace(/`[^`]*`/g, '').replace(/\s+/g, ' ').trim();
  const PAL = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#64748b', '#f97316', '#14b8a6', '#a855f7', '#eab308', '#0ea5e9', '#f43f5e'];
  const logY = (min, max, f) => ({ type: 'logarithmic', min, max, ticks: { maxRotation: 0, callback: (v) => { const e = Math.pow(10, Math.round(Math.log10(v))); return Math.abs(v / e - 1) < 1e-9 ? f(v) : ''; } }, grid: { color: C.css('--line') } });

  /* ============================== 4 · Capital no es profundidad ============================== */
  SS.add(40, (app, d) => {
    const k = d.kpi, cu = Object.fromEntries(d.cuotas.map((c) => [c.v, c])); app.append(SS.cap(4));
    app.append(SS.llano(
      'Un mercado puede tener mucho dinero y aun así costar caro vender en él. Medimos <b>cuánto cuesta vender importes crecientes</b> simulando la operación con el estado real de cada mercado (comisión + deslizamiento del precio).',
      'Con un movimiento de precio del 1 % (en los 88 mercados con los dos lados valorados), <b>V3 aporta el ' + pct(cu.V3.profundidad, 1) + ' de la profundidad con el ' + pct(cu.V3.capital, 1) + ' del capital</b> y V4 el ' + pct(cu.V4.profundidad, 1) + ' con el ' + pct(cu.V4.capital, 1) + '; <b>V2 aporta el ' + pct(cu.V2.profundidad, 1) + ' con el ' + pct(cu.V2.capital, 1) + '</b> y V1 el ' + pct(cu.V1.profundidad, 1) + ' con el ' + pct(cu.V1.capital, 1) + '.',
      'Es una <b>simulación</b>, contrastada con los cotizadores oficiales de los contratos y con intercambios reales (capítulo 9). La profundidad que se podría <b>ejecutar</b> de verdad no se afirma para ningún mercado: no se envió ninguna transacción.'));
    app.append(el('div', { class: 'kpis2' }, SS.kpi('Vender 100.000 $ en TRX/USDT de V3', k.C100K_V3, 'comisión + deslizamiento · ESTIMADO'), SS.kpi('… en V4', k.C100K_V4, 'ESTIMADO'), SS.kpi('… en V2', k.C100K_V2, 'ESTIMADO'), SS.kpi('… en V1', k.C100K_V1, 'ESTIMADO')));
    const f1 = el('div', { class: 'ss-fila' }); app.append(f1);
    SS.grafico(f1, { titulo: 'Capital frente a profundidad', sub: 'Qué parte del capital y qué parte de la profundidad simulada (±1 %) aporta cada versión', alto: 290,
      ayuda: [{ k: 'Qué muestra', v: 'Para los 88 mercados con los dos lados valorados: la cuota de cada versión en el capital (gris) y en la profundidad a ±1 % (color).' }, { k: 'Cómo se lee', l: ['Si la barra de color es mucho mayor que la gris, esa versión da más liquidez por dólar depositado.', 'V2 tiene casi la mitad del capital pero apenas el 4 % de la profundidad.', 'Profundidad = cuánto se puede mover antes de que el precio cambie un 1 %. Es simulada, no ejecutable.'] }],
      datos: SS.datosPropios('Capital frente a profundidad', 'Cuotas de los 88 mercados con los dos lados valorados (apartado 8.4 del informe).', ['Versión', { t: 'Cuota del capital', num: 1, f: (x) => pct(x, 1) }, { t: 'Cuota de la profundidad ±1 %', num: 1, f: (x) => pct(x, 1) }], d.cuotas.map((c) => [c.v, c.capital, c.profundidad]), 'sunswap-capital-profundidad'),
      cfg: () => ({ type: 'bar', data: { labels: VS, datasets: [{ label: 'Cuota del capital', data: VS.map((v) => cu[v].capital * 100), backgroundColor: '#64748b' }, { label: 'Cuota de la profundidad (±1 %)', data: VS.map((v) => cu[v].profundidad * 100), backgroundColor: VS.map(col) }] }, options: { plugins: { legend: { labels: { generateLabels: () => [{ text: 'Cuota del capital', fillStyle: '#64748b', strokeStyle: '#64748b', fontColor: C.css('--soft'), pointStyle: 'rect' }, { text: 'Cuota de la profundidad (color de la versión)', fillStyle: '#f59e0b', strokeStyle: '#f59e0b', fontColor: C.css('--soft'), pointStyle: 'rect' }] } }, tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + n(c.raw, 1) + ' %' } } }, scales: { y: { min: 0, max: 60, ticks: { callback: (v) => v + ' %' }, grid: { color: C.css('--line') } }, x: SS.eje.cat() } } }) });
    const ef = d.eficiencia;
    SS.grafico(f1, { titulo: 'De cada 100 $ depositados, ¿cuánto es profundidad?', sub: 'Profundidad a ±1 % ÷ capital, por versión (mercados con 100.000 $ o más)', alto: 290,
      ayuda: [{ k: 'Qué muestra', v: 'La razón entre la profundidad simulada a ±1 % y el capital depositado, agregada por versión.' }, { k: 'Cómo se lee', l: ['0,25 % significa que de cada 100 $ depositados solo 0,25 $ están disponibles dentro de un movimiento del 1 % del precio.', 'V1 y V2 reparten el capital en toda la curva: casi todo queda lejos del precio.', 'En V3 la mediana por mercado (3,36 %) es menor que la razón agregada (4,82 %): depende de qué mercados se miren (apartado 8.4).'] }],
      datos: SS.datos('8.4#0', 'Capital y profundidad por versión', 'La tabla del apartado 8.4 del informe.'),
      cfg: () => ({ type: 'bar', data: { labels: ef.map((e) => e.v + ' · ' + n(e.mercados) + ' mercados'), datasets: [{ data: ef.map((e) => e.r1 * 100), backgroundColor: ef.map((e) => col(e.v)), borderRadius: 4 }] }, options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + n(c.raw, 2) + ' % del capital', afterLabel: (c) => 'Capital de los mercados: ' + m(ef[c.dataIndex].capital) } } }, scales: { y: { min: 0, ticks: { callback: (v) => v + ' %' }, grid: { color: C.css('--line') } }, x: SS.eje.cat() } } }) });

    /* curvas de coste */
    app.append(el('h3', { class: 'ss-sub' }, '¿Cuánto cuesta vender 100 $, 1 mil, 10 mil…?'));
    const cs = d.costes, TAMS = ['100 $', '1 mil $', '10 mil $', '100 mil $', '1 M$', '10 M$'];
    const fc = el('div', { class: 'ss-fila', style: 'grid-template-columns:1fr' }); app.append(fc);
    let tc;
    const chips = SS.interruptores(cs.map((c, i) => ({ id: i, nombre: c.mercado, color: PAL[i % PAL.length], off: i >= 6 })), (i, on) => { tc.chart.setDatasetVisibility(i, on); tc.chart.update(); });
    tc = SS.grafico(fc, { titulo: 'Coste de vender, según el importe y el mercado', sub: 'Coste total (comisión + deslizamiento) en % de lo vendido · eje vertical logarítmico · simulación', alto: 360, filtros: chips,
      ayuda: [{ k: 'Qué muestra', v: 'Para los 15 mercados con más capital, cuánto cuesta vender un importe de 100 $ a 10 M$ según la simulación.' }, { k: 'Cómo se lee', l: ['Cada línea es un mercado; pulsa su nombre arriba para mostrarla u ocultarla. Empiezan visibles los 6 primeros.', 'La línea punteada gris marca el 1 %.', 'Una línea plana en 0,05 % o 0,30 % es solo la comisión: el mercado absorbe ese importe sin mover el precio.', 'Cuando la línea sube, el coste es deslizamiento: el importe ya es grande para ese mercado.'] }],
      datos: SS.datos('8.5#0', 'Coste de ejecutar por importe', 'La tabla del apartado 8.5 del informe: coste total, comisión y deslizamiento («imp.») de cada importe.', { texto: [0] }),
      cfg: () => ({ type: 'line', data: { labels: TAMS, datasets: cs.map((c, i) => ({ label: c.mercado, data: c.puntos.map((p) => p.coste), borderColor: PAL[i % PAL.length], backgroundColor: PAL[i % PAL.length], borderWidth: 2, pointRadius: 3, tension: 0.1, hidden: i >= 6, borderDash: i >= 9 ? [5, 3] : [] })).concat([{ label: '1 %', data: TAMS.map(() => 1), borderColor: '#94a3b8', borderDash: [2, 4], pointRadius: 0, borderWidth: 1.5 }]) }, options: { interaction: { mode: 'nearest', intersect: false }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + (c.raw == null ? 'no cabe' : n(c.raw, 3) + ' %') } } }, scales: { y: logY(0.01, 100, (v) => n(v, 2) + ' %'), x: SS.eje.cat() } } }) });

    const mx = T('8.5#1').filas.slice(0, 8).map((f) => ({ mercado: limpia(f[0]), v05: pn(f[2].split('/')[0]) || 0, v1: pn(f[3].split('/')[0]) || 0 }));
    SS.grafico(fc, { titulo: '¿Cuánto se puede vender con un coste de hasta el 0,5 % o el 1 %?', sub: 'Importe máximo de venta, en los 8 mayores mercados · eje horizontal logarítmico · simulación', alto: 340,
      ayuda: [{ k: 'Qué muestra', v: 'El importe más grande que se podría vender en cada mercado sin que el coste total (comisión + deslizamiento) pase del 0,5 % o del 1 %.' }, { k: 'Cómo se lee', l: ['Una barra ausente significa que ni el menor importe probado cabe dentro de ese límite (la comisión del mercado ya lo supera).', 'Es el lado de la venta; el informe da también el de la compra.', 'No es profundidad ejecutable: es una simulación.'] }],
      datos: SS.datos('8.5#1', 'Importe máximo con un coste dado', 'La tabla del apartado 8.5 del informe (venta / compra).', { texto: [0] }),
      cfg: () => ({ type: 'bar', data: { labels: mx.map((x) => x.mercado), datasets: [{ label: 'Hasta 0,5 %', data: mx.map((x) => x.v05 || null), backgroundColor: '#3b82f6' }, { label: 'Hasta 1 %', data: mx.map((x) => x.v1 || null), backgroundColor: '#10b981' }] }, options: { indexAxis: 'y', plugins: { tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + m(c.raw) } } }, scales: { x: logY(1e4, 1e8, (v) => m(v)), y: Object.assign(SS.eje.cat(), { ticks: { autoSkip: false } }) } } }) });
    app.append(SS.herramienta('Este capítulo es una foto del 11-nov-2026. La herramienta repite el cálculo cada hora con los mercados de ese momento y te deja escribir tu importe.'));

    /* profundidad engañosa */
    app.append(el('h3', { class: 'ss-sub' }, 'Cuando el capital engaña'));
    const en = d.enganosos;
    app.append(el('p', { class: 'narr' }, 'Hay mercados con mucho capital y casi nada de profundidad utilizable. El informe los llama «profundidad engañosa» (apartado 8.6) y ', C.est('VERIFICADO'), ' el patrón: tres pools de V3 con 15,3 M$ casi sin liquidez cerca del precio, pools de un solo tick cuya «profundidad» es un valor teórico, y V1 y V2, cuya profundidad a ±1 % es siempre el 0,25 % de su capital por construcción de la fórmula.'));
    const fe = el('div', { class: 'ss-fila', style: 'grid-template-columns:1fr' }); app.append(fe);
    SS.grafico(fe, { titulo: 'Capital, capital en rango y profundidad ±1 % de los mercados más engañosos', sub: 'Eje horizontal logarítmico · pasa el ratón para ver por qué se marcan', alto: 230,
      ayuda: [{ k: 'Qué muestra', v: 'Cinco mercados cuya profundidad a ±1 % es mínima respecto a su capital.' }, { k: 'Cómo se lee', l: ['La barra gris es el capital depositado; la azul, el capital en rango; la ámbar, la profundidad a ±1 %.', 'El eje es logarítmico: cada marca vale diez veces la anterior.'] }],
      datos: SS.datosPropios('Mercados con profundidad engañosa', 'Los cinco mercados del apartado 8.6 con su capital, su capital en rango, su profundidad ±1 % y el motivo.', ['Mercado', { t: 'Capital', num: 1, f: (x) => m(x) }, { t: 'En rango', num: 1, f: (x) => m(x) }, { t: 'Profundidad ±1 %', num: 1, f: (x) => m(x) }, 'Por qué'], en.map((x) => [x.v + ' ' + x.par, x.capital, x.enRango, x.prof1, x.motivos.join(' · ')]), 'sunswap-profundidad-enganosa'),
      cfg: () => ({ type: 'bar', data: { labels: en.map((x) => x.v + ' ' + x.par), datasets: [{ label: 'Capital', data: en.map((x) => Math.max(x.capital, 1)), backgroundColor: '#64748b' }, { label: 'En rango', data: en.map((x) => Math.max(x.enRango, 1)), backgroundColor: '#3b82f6' }, { label: 'Profundidad ±1 %', data: en.map((x) => Math.max(x.prof1, 1)), backgroundColor: '#f59e0b' }] }, options: { indexAxis: 'y', plugins: { tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + m(c.raw), afterBody: (it) => en[it[0].dataIndex].motivos } } }, scales: { x: logY(1, 1e8, (v) => m(v)), y: Object.assign(SS.eje.cat(), { ticks: { autoSkip: false } }) } } }) });
    app.append(SS.aviso('Ojo con el cuarto mercado:', 'V3 USDT/SUEDE 0.01 % sale con una «profundidad» (' + m(en[3].prof1) + ') muy superior a su capital (' + m(en[3].capital) + '). No es un error del gráfico: es un pool de un solo tick con un token sin precio a precio fijo, cuya profundidad nominal es el valor teórico de la oferta de ese token, <b>no liquidez aprovechable</b>. Que sea un mecanismo de lanzamiento a precio fijo es <span class="est est-HIPÓTESIS">HIPÓTESIS</span> (apartado 8.6).'));
    app.append(SS.recap(4, [
      'Con el 1 % de movimiento, <b>V3 y V4 dan casi toda la profundidad</b>; V2 tiene la mayor parte del capital y poca profundidad.',
      'Vender <b>100.000 $</b> en TRX/USDT cuesta ' + k.C100K_V3 + ' en V3, ' + k.C100K_V4 + ' en V4, ' + k.C100K_V2 + ' en V2 y ' + k.C100K_V1 + ' en V1 (simulación).',
      'El capital fuera de rango <b>no es liquidez</b>: un ranking por capital no mide profundidad.',
      'Nada de esto es profundidad ejecutable: no se envió ninguna transacción.'], 'Siguiente: cuánto se opera.'));
  });

  /* ============================== 5 · Volumen y actividad ============================== */
  SS.add(50, (app, d) => {
    const k = d.kpi, vv = d.volVersion, tot = vv.reduce((a, x) => a + x.uvc, 0), vm = d.volMes; app.append(SS.cap(5));
    app.append(SS.llano(
      'En el año completo se operaron <b>' + m(tot) + '</b> brutos (la suma de lo que cada swap movió): V3 el ' + pct(vv[2].uvc / tot, 1) + ', V4 el ' + pct(vv[3].uvc / tot, 1) + ', V2 el ' + pct(vv[1].uvc / tot, 1) + ' y V1 el ' + pct(vv[0].uvc / tot, 1) + '. En los últimos 30 días, ' + k.VOL30.replace(' millones de dólares', ' M$') + ', y <b>un solo mercado (V3 WTRX/USDT) hace el ' + k.TOP1VOL + '</b>.',
      'Hay <b>' + k.CIRN + ' mercados pequeños</b> que cumplen a la vez cuatro criterios («lo que entra vuelve a salir», criterios C1–C4) y mueven <b>' + k.CIRU.replace(' millones de dólares', ' M$') + '</b>, el ' + k.CIRP + ' del volumen bruto. <b>No es «volumen real», ni prueba de manipulación, ni un seguimiento de fondos</b>: es una clasificación de mercados con umbrales fijados por la investigación.'));
    const f1 = el('div', { class: 'ss-fila', style: 'grid-template-columns:1fr' }); app.append(f1);
    let tm; const chips = SS.interruptores(VS.map((v) => ({ id: v, nombre: v, color: col(v) })), (v, on) => { tm.chart.setDatasetVisibility(VS.indexOf(v), on); tm.chart.update(); });
    tm = SS.grafico(f1, { titulo: 'Volumen bruto mensual por versión', sub: 'Suma de lo operado cada mes (noviembre de 2025 y de 2026 son meses parciales)', alto: 320, filtros: chips,
      ayuda: [{ k: 'Qué muestra', v: 'Cuánto se operó cada mes en sun.io, dividido por versión.' }, { k: 'Cómo se lee', l: ['Cada barra apila las versiones; pulsa una versión arriba para ocultarla.', 'El volumen bruto suma las patas de cada swap: en operaciones que pasan por varios mercados cuenta más de una vez (apartado 9.5).'] }],
      datos: SS.datosPropios('Volumen bruto mensual por versión', 'Los datos del gráfico (apartado 9.2 del informe, figura del volumen mensual).', ['Mes', ...VS.map((v) => ({ t: v, num: 1, f: (x) => m(x) })), { t: 'Total', num: 1, f: (x) => m(x) }], vm.meses.map((mes, i) => [mes, ...VS.map((v) => vm[v][i]), VS.reduce((a, v) => a + vm[v][i], 0)]), 'sunswap-volumen-mensual'),
      cfg: () => ({ type: 'bar', data: { labels: vm.meses, datasets: VS.map((v) => ({ label: v, data: vm[v], backgroundColor: col(v) })) }, options: { plugins: { legend: { display: false }, tooltip: { mode: 'index', callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + m(c.raw), footer: (it) => 'Total: ' + m(it.reduce((a, x) => a + x.raw, 0)) } } }, scales: { x: Object.assign(SS.eje.cat(), { stacked: true }), y: Object.assign(SS.eje.dinero((v) => (v >= 1e9 ? n(v / 1e9, 1) + ' mil M$' : m(v))), { stacked: true }) } } }) });

    const f2 = el('div', { class: 'ss-fila' }); app.append(f2);
    SS.grafico(f2, { titulo: 'Reparto del volumen por versión', sub: m(tot) + ' en la ventana completa · pulsa una fila para ver los números', alto: 240,
      ayuda: [{ k: 'Qué muestra', v: 'Qué parte del volumen bruto de todo el año corresponde a cada versión.' }, { k: 'Cómo se lee', l: ['V3 y V4 concentran casi todo el volumen: son también las que tienen más profundidad.', 'La tabla «Datos» trae el volumen a 1, 7, 30 y 90 días.'] }],
      datos: SS.datos('9.2#1', 'Volumen bruto por versión', 'La tabla del apartado 9.2 del informe.'),
      extra: SS.leyenda(vv.map((x) => ({ id: x.v, nombre: x.v, color: col(x.v), desc: n(x.mercados) + ' mercados con swaps · ' + m(x.u30) + ' en 30 d', valor: m(x.uvc) + ' · ' + pct(x.uvc / tot, 1) }))),
      cfg: () => ({ type: 'doughnut', data: { labels: VS, datasets: [{ data: vv.map((x) => x.uvc), backgroundColor: VS.map(col), borderColor: C.css('--pan'), borderWidth: 2 }] }, options: { cutout: '62%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + m(c.raw) + ' · ' + pct(c.raw / tot, 1) } } } } }) });
    const tv = T('9.3#0').filas.map((f) => ({ mercado: limpia(f[1]), vol30: pn(f[4]), capital: pn(f[2]), ratio: f[6], swaps: f[3] }));
    SS.grafico(f2, { titulo: 'Los 10 mercados con más volumen en 30 días', sub: 'Volumen bruto de los últimos 30 días', alto: 330,
      ayuda: [{ k: 'Qué muestra', v: 'Los diez mercados que más operaron en los últimos 30 días.' }, { k: 'Cómo se lee', l: ['Al pasar el ratón ves su capital, sus swaps y cuánto de su capital rota cada día (volumen medio diario ÷ capital).'] }],
      datos: SS.datos('9.3#0', 'Los mercados con más actividad', 'La tabla del apartado 9.3 del informe.', { texto: [1] }),
      cfg: () => ({ type: 'bar', data: { labels: tv.map((x) => x.mercado), datasets: [{ data: tv.map((x) => x.vol30), backgroundColor: tv.map((x) => col(x.mercado.slice(0, 2))), borderRadius: 4 }] }, options: { indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + m(c.raw) + ' en 30 días', afterLabel: (c) => ['Capital: ' + m(tv[c.dataIndex].capital), 'Swaps: ' + tv[c.dataIndex].swaps, 'Rotación diaria: ' + tv[c.dataIndex].ratio] } } }, scales: { x: SS.eje.dinero((v) => (v >= 1e9 ? n(v / 1e9, 1) + ' mil M$' : m(v))), y: Object.assign(SS.eje.cat(), { ticks: { autoSkip: false } }) } } }) });
    app.append(SS.acordeon('¿Cuánto se concentra el volumen? (tabla del apartado 9.3)', SS.tabla('9.3#1', { pp: 6, buscar: false })));

    /* mucha liquidez, poco volumen */
    app.append(el('h3', { class: 'ss-sub' }, 'Mucha liquidez y poco volumen'));
    const pv = T('9.4#0').filas.map((f) => ({ mercado: limpia(f[0]), capital: pn(f[1]), vol30: pn(f[2]), ratio: f[3], ultimo: f[4] }));
    const f3 = el('div', { class: 'ss-fila', style: 'grid-template-columns:1fr' }); app.append(f3);
    const sin0 = pv.every((x) => !x.vol30);
    SS.grafico(f3, { titulo: sin0 ? 'Mercados con mucho capital y ningún swap en los últimos 30 días' : 'Capital frente a volumen de 30 días en mercados con mucho dinero y poca actividad', sub: sin0 ? 'Capital de cada mercado el 11-nov-2026 · su volumen de los últimos 30 días es de 0 $ · eje horizontal logarítmico' : 'Eje horizontal logarítmico', alto: 300,
      ayuda: [{ k: 'Qué muestra', v: 'Ocho mercados con capital alto pero un volumen muy bajo en los últimos 30 días.' }, { k: 'Cómo se lee', l: ['Si la barra de volumen es mucho más corta que la de capital, ese dinero apenas se usa.', 'Es un hecho de actividad; no dice por qué.'] }],
      datos: SS.datos('9.4#0', 'Mucha liquidez y poco volumen', 'La tabla del apartado 9.4 del informe.', { texto: [0, 4] }),
      cfg: () => ({ type: 'bar', data: { labels: pv.map((x) => x.mercado), datasets: [{ label: 'Capital', data: pv.map((x) => Math.max(1, x.capital)), backgroundColor: '#64748b' }].concat(sin0 ? [] : [{ label: 'Volumen 30 d', data: pv.map((x) => Math.max(1, x.vol30)), backgroundColor: '#3b82f6' }]) }, options: { indexAxis: 'y', plugins: { tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + m(c.raw), afterBody: (it) => 'Rotación diaria: ' + pv[it[0].dataIndex].ratio + ' · último swap: ' + pv[it[0].dataIndex].ultimo } } }, scales: { x: logY(1, 1e9, (v) => m(v)), y: Object.assign(SS.eje.cat(), { ticks: { autoSkip: false } }) } } }) });

    /* C1-C4 */
    app.append(el('h3', { class: 'ss-sub' }, '«Lo que entra vuelve a salir»: los mercados que cumplen C1–C4'));
    const ci = T('9.6#1').filas.filter((f) => /^V\d$/.test(f[0])).map((f) => ({ v: f[0], bruto: pn(f[1]), mercados: f[2], esos: pn(f[3]), parte: f[4] }));
    const f4 = el('div', { class: 'ss-fila' }); app.append(f4);
    SS.grafico(f4, { titulo: 'Volumen de los mercados que cumplen C1–C4, por versión', sub: 'Del volumen bruto de cada versión, la parte que mueven esos mercados', alto: 270,
      ayuda: [{ k: 'Qué muestra', v: 'Cuánto del volumen bruto de cada versión lo mueven mercados que cumplen a la vez los cuatro criterios C1–C4 (mercado pequeño, mucha rotación, lo que entra vuelve a salir…): la tabla de al lado los explica.' }, { k: 'Cómo se lee', l: ['Es una clasificación con umbrales fijados por la investigación, <b>no</b> una acusación ni una prueba de manipulación.', 'Pulsa «Datos» para ver los criterios y la sensibilidad a los umbrales en el informe (apartado 9.6).'] }],
      datos: SS.datos('9.6#1', 'Volumen de los mercados que cumplen C1–C4', 'La tabla del apartado 9.6 del informe.'),
      cfg: () => ({ type: 'bar', data: { labels: ci.map((x) => x.v), datasets: [{ label: 'Resto del volumen', data: ci.map((x) => x.bruto - x.esos), backgroundColor: '#3b82f6' }, { label: 'Mercados que cumplen C1–C4', data: ci.map((x) => x.esos), backgroundColor: '#ef4444' }] }, options: { plugins: { tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + m(c.raw), afterBody: (it) => ci[it[0].dataIndex].mercados + ' mercados cumplen · ' + ci[it[0].dataIndex].parte + ' del volumen de la versión' } } }, scales: { x: Object.assign(SS.eje.cat(), { stacked: true }), y: Object.assign(SS.eje.dinero((v) => (v >= 1e9 ? n(v / 1e9, 1) + ' mil M$' : m(v))), { stacked: true }) } } }) });
    f4.append(SS.caja('Los cuatro criterios', el('div', { class: 'cs' }, 'Tabla del apartado 9.6 del informe'), SS.tabla('9.6#0', { pp: 6, buscar: false, texto: [0, 1, 2] })));
    app.append(SS.aviso('Cuidado al leerlo:', 'esto es una <b>clasificación de mercados</b>, no un seguimiento de fondos. Que un mercado cumpla C1–C4 no demuestra manipulación ni «volumen falso»; el informe da las variantes y la sensibilidad a los umbrales (apartado 9.6).'));
    app.append(SS.acordeon('Los 12 mercados que cumplen C1–C4 con más volumen (tabla del apartado 9.6)', SS.tabla('9.6#4', { pp: 12, buscar: false, texto: [0, 5, 6] })));
    app.append(SS.acordeon('Relación estadística entre liquidez y volumen (apartado 9.7)', SS.tabla('9.7#0', { pp: 6, buscar: false }), el('p', { class: 'narr' }, 'Correlaciones de Pearson (sobre logaritmos) y de Spearman entre el capital y el volumen de cada mercado.')));
    app.append(SS.recap(5, [
      'Se operaron <b>' + m(tot) + '</b> brutos en el año; V3 y V4 hacen casi todo.',
      'Un solo mercado, <b>V3 WTRX/USDT</b>, hace el ' + k.TOP1VOL + ' del volumen de los últimos 30 días.',
      'Hay mercados con <b>mucho capital y casi nada de volumen</b>, y ' + k.CIRN + ' mercados pequeños donde «lo que entra vuelve a salir»: una clasificación, no una acusación.'], 'Siguiente: quién pone la liquidez.'));
  });

  /* ============================== 6 · Quién pone la liquidez ============================== */
  SS.add(60, (app, d) => {
    const ap = T('10.1#0').filas, tt = d.titulares; app.append(SS.cap(6));
    const mayorV = (v) => ap.find((f) => f[0] === v)[6];
    app.append(SS.llano(
      'Aportar liquidez es depositar dinero en un mercado; retirarla, sacarlo. En V3 y V4 el <b>mayor aportante puso el ' + mayorV('V3') + ' y el ' + mayorV('V4') + '</b> de todo lo añadido en el año; en V2, el ' + mayorV('V2') + '; en V1, el ' + mayorV('V1') + '.',
      'Ojo con dos cosas distintas: <b>quién aportó</b> durante el año y <b>quién tiene hoy</b> las posiciones. Hoy dos cuentas tienen aproximadamente el ' + pct(tt.dosMayores, 0) + ' del capital, pero ser titular hoy no es haberlo aportado: las posiciones se pueden transferir. El informe mira la procedencia con las transferencias de la ventana (apartado 10.3).',
      '<b>No se atribuye identidad a ninguna dirección.</b> Una dirección no es una persona.'));
    const f1 = el('div', { class: 'ss-fila' }); app.append(f1);
    const dirV = ap.map((f) => ({ v: f[0], distintas: pn(f[1]), altas: pn(f[2]), retiradas: pn(f[3]), activas: pn(f[5]), mayor: f[6], cinco: f[7] }));
    SS.grafico(f1, { titulo: 'Quién aporta y quién retira, por versión', sub: 'Direcciones distintas que hicieron altas, retiradas o estuvieron activas en los últimos 90 días', alto: 290,
      ayuda: [{ k: 'Qué muestra', v: 'Cuántas direcciones distintas aparecen como aportantes en cada versión durante la ventana completa.' }, { k: 'Cómo se lee', l: ['«Con altas»: direcciones que añadieron liquidez alguna vez.', 'En V1 casi todas las direcciones aparecen solo con retiradas y pocas con altas; en V2 ocurre al revés. El informe da las cifras, no la causa.', 'Al pasar el ratón ves cuánto de lo añadido puso la mayor dirección y las 5 mayores.'] }],
      datos: SS.datos('10.1#0', 'Aportantes históricos observados', 'La tabla del apartado 10.1 del informe.', { texto: [10] }),
      cfg: () => ({ type: 'bar', data: { labels: VS, datasets: [{ label: 'Con altas', data: dirV.map((x) => x.altas), backgroundColor: '#3b82f6' }, { label: 'Con retiradas', data: dirV.map((x) => x.retiradas), backgroundColor: '#ef4444' }, { label: 'Activas en 90 días', data: dirV.map((x) => x.activas), backgroundColor: '#10b981' }] }, options: { plugins: { tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + n(c.raw), afterBody: (it) => 'Mayor aportante: ' + dirV[it[0].dataIndex].mayor + ' de lo añadido · 5 mayores: ' + dirV[it[0].dataIndex].cinco } } }, scales: { y: { grid: { color: C.css('--line') }, ticks: { callback: (v) => n(v) } }, x: SS.eje.cat() } } }) });
    const am = d.aportesMes; let tf;
    const chips = SS.interruptores(VS.map((v) => ({ id: v, nombre: v, color: col(v) })), (v, on) => { const i = VS.indexOf(v); tf.chart.setDatasetVisibility(i * 2, on); tf.chart.setDatasetVisibility(i * 2 + 1, on); tf.chart.update(); });
    tf = SS.grafico(f1, { titulo: 'Liquidez que entra y que sale cada mes', sub: 'Arriba, lo añadido; abajo, lo retirado (en dólares, valoración al precio del día)', alto: 290, filtros: chips,
      ayuda: [{ k: 'Qué muestra', v: 'Cuánto dinero se añadió a los mercados cada mes y cuánto se retiró, por versión.' }, { k: 'Cómo se lee', l: ['Las barras de arriba son altas; las de abajo, retiradas, con el color más claro.', 'Pulsa una versión arriba para ocultarla. V4 empieza en diciembre de 2025.'] }],
      datos: SS.datos('10.1#2', 'Liquidez que entra y sale por mes', 'La tabla del apartado 10.1 del informe.'),
      cfg: () => ({ type: 'bar', data: { labels: am.map((x) => x.mes), datasets: VS.flatMap((v) => [{ label: v + ' entra', data: am.map((x) => x[v][0] || 0), backgroundColor: col(v), stack: 's' }, { label: v + ' sale', data: am.map((x) => -(x[v][1] || 0)), backgroundColor: col(v) + '88', stack: 's' }]) }, options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + m(Math.abs(c.raw)) } } }, scales: { x: Object.assign(SS.eje.cat(), { stacked: true }), y: Object.assign(SS.eje.dinero((v) => m(Math.abs(v))), { stacked: true }) } } }) });

    app.append(el('h3', { class: 'ss-sub' }, 'Quién tiene hoy las posiciones'));
    app.append(el('p', { class: 'narr' }, 'Las diez mayores direcciones titulares y su parte del capital reconstruido (apartado 10.2). ', C.est('ESTIMADO'), ' «Titular actual» no es «aportante original».'));
    app.append(SS.tabla('10.2#2', { pp: 10, buscar: false, texto: [6] }));
    app.append(SS.acordeon('Tabla: el mayor titular de cada versión (apartado 10.2)', SS.tabla('10.2#1', { pp: 10, buscar: false, texto: [5] })));
    app.append(SS.acordeon('Procedencia de lo que tienen hoy los titulares (apartado 10.3, verificado con las transferencias de la ventana)', el('p', { class: 'narr' }, 'De dónde le llegó a cada titular el saldo actual: la posición la creó él mismo en la ventana, se la cedió otra dirección, o es anterior a la ventana (origen no observable).'), SS.tabla('10.3#0', { pp: 8, buscar: false, texto: [1, 2] }), SS.tabla('10.3#1', { pp: 8, buscar: false, texto: [2] })));
    app.append(SS.acordeon('Cuentas, contratos y enrutadores que llaman a los mercados (apartado 10.4)', SS.tabla('10.4#0', { pp: 6, buscar: false, texto: [3, 4, 5] })));
    app.append(SS.aviso('Una referencia cruzada, no una atribución:', 'la dirección que más capital tiene hoy en sun.io es la que el <a href="caso-vaneck.html">caso Vaneck / Justin Sun</a> llama «la segunda cuenta». Este informe no atribuye identidad a ninguna dirección; allí están los hechos, las atribuciones de terceros y las hipótesis.'));
    app.append(SS.recap(6, [
      'La liquidez nueva la ponen <b>muy pocas direcciones</b>: en V3 y V4, una sola puso más del 95 % de lo añadido.',
      'Titular actual no es aportante original: las posiciones pueden haberse transferido.',
      'No se atribuye identidad a ninguna dirección: una dirección no es una persona.'], 'Siguiente: un año de historia.'));
  });
})();
