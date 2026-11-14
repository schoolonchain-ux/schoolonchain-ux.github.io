/* Página interactiva de «JustLend: ¿cuánto se puede recuperar de verdad?» (justlend.html).
   Los datos salen de reports/justlend-liquidez/data.json, que genera el programa justlend-visual/exportar.cjs a partir de los resultados de la propia investigación; antes de escribir el fichero el programa comprueba que las cifras coinciden con las del informe.
   Esta página no cambia ni reinterpreta el informe: lo enseña de otra forma. El texto íntegro sigue en doc.html y cada gráfico dice de dónde sale (apartado del informe, fichero de datos y TronScan). Los capítulos viven en justlend-c1.js, -c2.js y -c3.js. */
(function () {
  const { el: el0, n, m, pct } = C;
  const ETIQ = /<\/?(?:b|i|a|em|strong|br|span|sub|sup|code|u)\b[^>]*>/i;
  const aNodos = (k) => { if (typeof k === 'string' && ETIQ.test(k)) { const t = document.createElement('template'); t.innerHTML = k; return t.content; } return Array.isArray(k) ? k.map(aNodos) : k; };
  const el = (tag, attrs, ...kids) => el0(tag, attrs, ...kids.map(aNodos));
  const JL = (window.JL = { partes: [], charts: [], el, n, m, pct });
  JL.add = (orden, fn) => JL.partes.push({ orden, fn });
  JL.GRIS = '#64748b';
  /* un color distinto para cada token, el mismo en todos los gráficos (los 12 mayores, bien separados; el resto en tonos claros). El gris queda solo para «caja», «otros» y lo que no es un token. */
  JL.COLTOK = { TRX: '#ef4444', WIN: '#f97316', BTC: '#facc15', WBTC: '#a16207', SUN: '#a3e635', USDT: '#22c55e', USDD: '#14b8a6', U: '#06b6d4', TUSD: '#3b82f6', ETH: '#6366f1', JST: '#a855f7', sTRX: '#ec4899', BTT: '#fb7185', HTX: '#7dd3fc', NFT: '#d946ef', USD1: '#86efac', USDC: '#a5b4fc', wstUSDT: '#fdba74', WBTT: '#c4b5fd', USDJ: '#fca5a5', BUSD: '#d6d3d1' };
  JL.colTok = (t) => JL.COLTOK[t] || '#f1f5f9';
  JL.VER = { recuperable: ['rec', 'RECUPERABLE'], parcial: ['par', 'PARCIAL'], comprometido: ['com', 'COMPROMETIDO'], desconocido: ['des', 'DESCONOCIDO'] };
  JL.VCOL = { recuperable: '#10b981', parcial: '#d97706', comprometido: '#ef4444', desconocido: '#64748b' };
  JL.ver = (k) => el('span', { class: 'jl-ver ' + JL.VER[k][0] }, JL.VER[k][1]);
  const cargar = (u) => fetch(u, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  JL.ts = (a) => 'https://tronscan.org/#/address/' + a; JL.txu = (h) => 'https://tronscan.org/#/transaction/' + h;
  JL.dir = (a, completo) => UI.enlace(JL.ts(a), (completo ? a : UI.corto(a, 8, 6)) + ' ↗', 'addr');
  JL.tx = (h) => UI.enlace(JL.txu(h), UI.corto(h, 8, 6) + ' ↗', 'addr');
  JL.fecha = (iso) => String(iso).replace('T', ' ').slice(0, 16) + ' UTC';
  /* enlaces al informe y a los datos originales */
  JL.doc = (k) => JL.d.informe.doc + (JL.d.informe.anclas[k] ? '#' + JL.d.informe.anclas[k] : '');
  JL.dato = (f) => JL.d.informe.datos + 'resultados/' + f;
  JL.fich = (nn) => (JL.d.ficheros || []).find((f) => f.startsWith(nn + '-')) || nn;
  JL.origen = (secciones, ficheros, extra) => el('div', { class: 'jl-origen' }, 'Origen: ', (secciones || []).map((s, i) => [i ? ', ' : '', el('a', { href: JL.doc(s), target: '_blank', rel: 'noopener' }, 'informe §' + s)]), ficheros && ficheros.length ? ' · datos: ' : '', (ficheros || []).map((f, i) => [i ? ' ' : '', el('a', { href: JL.dato(JL.fich(f)), target: '_blank', rel: 'noopener', title: JL.fich(f) }, f)]), extra ? [' · ', extra] : '');
  JL.cols = (cab) => cab;

  /* ---------- tarjeta de gráfico ---------- */
  JL.datosPropios = (titulo, nota, cab, filas, csv) => ({ titulo, nota, csv, rows: filas, cols: cab.map((c, i) => ({ t: c.t || c, num: c.num ? 1 : 0, v: (r) => (c.f ? c.f(r[i], r) : r[i]), o: (r) => (typeof r[i] === 'number' ? r[i] : String(r[i]).toLowerCase()), csv: (r) => (c.csv ? c.csv(r[i], r) : r[i]) })) });
  JL.grafico = (padre, o) => { const extra = Array.isArray(o.extra) ? el('div', null, ...o.extra) : o.extra; const t = UI.tarjeta({ titulo: o.titulo, sub: o.sub, alto: o.alto || 280, ayuda: o.ayuda, datos: o.datos, extra, filtros: o.filtros, cls: o.cls }); padre.append(t.c);
    const cfg = typeof o.cfg === 'function' ? o.cfg(t) : o.cfg; cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false }, cfg.options || {});
    /* leyendas con rectángulos (no círculos) y con aire, en todos los gráficos que la muestran */
    const lg = cfg.options.plugins && cfg.options.plugins.legend; if (lg && lg.display !== false) lg.labels = Object.assign({ usePointStyle: false, boxWidth: 18, boxHeight: 10, padding: 16, font: { size: 13 } }, lg.labels || {});
    t.chart = new Chart(t.cv, cfg); JL.charts.push(t.chart); return t; };
  JL.fila = (...k) => el('div', { class: 'jl-fila' }, ...k);
  JL.eje = { dinero: (f, tipo) => ({ type: tipo || 'linear', ticks: { maxRotation: 0, callback: (v) => { if (tipo === 'logarithmic') { const l = Math.log10(v); if (Math.abs(l - Math.round(l)) > 1e-9) return ''; } return (f || m)(v); } }, grid: { color: C.css('--line') } }), cat: () => ({ grid: { display: false } }) };
  JL.cursor = (cfg, onClick) => UI.clicable(cfg, onClick);
  JL.leyenda = (items, onClick) => el('div', { class: 'legend i' }, items.map((i) => el('div', { class: 'li', title: onClick ? 'Pulsa para ver el detalle' : null, onclick: onClick ? () => onClick(i) : null },
    el('span', { class: 'sw', style: 'background:' + i.color }), el('span', { class: 'ln' }, i.nombre, ' ', i.estado ? C.est(i.estado) : null, i.desc ? el('span', { class: 'ld' }, i.desc) : null), el('span', { class: 'lv' }, i.valor))));
  /* leyenda explicada para barras: cada fila = muestra + qué significa; y una fila de colores por token */
  JL.leyendaBarras = (filas, tokens) => el('div', { class: 'jl-ley' }, filas.map((f) => el('div', { class: 'jl-ley-f' }, el('span', { class: 'jl-ley-b', style: 'background:' + f.fondo }), el('span', { html: f.texto }))), tokens && tokens.length ? el('div', { class: 'jl-ley-t' }, tokens.map((t) => el('span', { class: 'jl-ley-k' }, el('i', { style: 'background:' + JL.colTok(t.token) }), t.nombre))) : null);
  JL.interruptores =(items, onChange) => el('div', { class: 'jl-chips', role: 'group' }, items.map((i) => { const b = el('button', { type: 'button', class: 'jl-chip' + (i.off ? '' : ' on'), 'aria-pressed': i.off ? 'false' : 'true', style: '--c:' + i.color, onclick: () => { const on = !b.classList.contains('on'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); onChange(i.id, on); } }, el('span', { class: 'sw', style: 'background:' + i.color }), i.nombre); return b; }));

  /* ---------- piezas de capítulo ---------- */
  JL.CAPS = [
    { n: 1, t: 'Lo esencial', d: 'Qué es JustLend, qué medimos y lo que más sorprende, en una página.' },
    { n: 2, t: 'Dónde está el dinero', d: 'Cuánto debe JustLend, cuánto tiene en caja y cuánto está prestado, mercado a mercado.' },
    { n: 3, t: 'Pocas cuentas', d: 'Quién tiene el dinero y qué pasaría si las mayores cuentas salieran a la vez.' },
    { n: 4, t: 'El «ETH» y el «BTC»', d: 'De dónde sale el dinero más grande de JustLend y quién puede crear, congelar o pausar esos tokens.' },
    { n: 5, t: 'Vender en sun.io', d: 'Si JustLend te devuelve el token, ¿cuánto USDT sacas vendiéndolo? Con tu importe.' },
    { n: 6, t: 'Otras salidas', d: 'Salidas oficiales (PSM de USDD, sTRX) y lo que cada emisor puede hacer con su token.' },
    { n: 7, t: 'Quién manda', d: 'Timelock, guardián de pausas, oráculo de precios: qué puede cambiar y con cuánto aviso.' },
    { n: 8, t: 'Deudas y garantías', d: 'Quién debe, con qué lo respalda y qué pasa si el USDD se desvía.' },
    { n: 9, t: 'Revisión adversarial', d: 'Un segundo revisor intentó refutar este informe: 11 objeciones, 9 escenarios y lo que cambió.' },
    { n: 10, t: 'Controles, límites y panel', d: 'Qué se comprobó, qué no se sabe, los errores míos y el panel que se propone.' },
  ];
  JL.cap = (i, lead) => el('div', { class: 'cap', id: 'cap-' + i }, el('div', { class: 'capn' }, 'Capítulo ' + i + ' de ' + JL.CAPS.length), el('h2', { class: 'capt' }, JL.CAPS[i - 1].t), el('p', { class: 'capl', html: lead || JL.CAPS[i - 1].d }));
  JL.recap = (i, items, prox) => el('div', { class: 'recap' }, el('b', { class: 'rh' }, 'Lo que hemos visto en el capítulo ' + i), el('ul', null, items.map((t) => el('li', { html: t }))), JL.CAPS[i] ? el('div', { class: 'sig' }, el('span', { class: 'muted' }, prox || ''), el('button', { class: 'btn primary', onclick: () => document.getElementById('cap-' + (i + 1)).scrollIntoView({ behavior: 'smooth' }) }, 'Siguiente: ' + JL.CAPS[i].t + ' →')) : null);
  JL.llano = (...t) => el('div', { class: 'resumen-llano' }, el('b', { class: 'h' }, 'En pocas palabras'), ...t.map((x) => el('p', { html: x })));
  JL.kpi = (l, v, s, onclick) => el('div', { class: 'kpi' + (onclick ? ' clk' : ''), onclick: onclick || null, role: onclick ? 'button' : null, tabindex: onclick ? '0' : null }, el('div', { class: 'kl' }, l), el('div', { class: 'kv' }, v), el('div', { class: 'kn' }, s));
  JL.aviso = (t, ...k) => el('div', { class: 'jl-nota' + (t && /^!/.test(t) ? ' warn' : '') }, t ? el('b', null, t.replace(/^!/, '') + ' ') : null, ...k);
  JL.acordeon = (resumen, ...cuerpo) => el('details', { class: 'jl-det' }, el('summary', null, resumen), el('div', { class: 'jl-detc' }, ...cuerpo));
  JL.ir = (i) => () => document.getElementById('cap-' + i).scrollIntoView({ behavior: 'smooth' });

  /* ---------- ficha de un mercado (panel lateral) ---------- */
  JL.mercado = (jt) => JL.d.mercados.find((x) => x.jToken === jt);
  JL.fichaMercado = (mk) => UI.abrir(mk.simbolo + ' · ' + mk.token + (mk.abierto ? '' : ' (mercado viejo)'), () => { const fila = (k, v) => el('tr', null, el('th', { scope: 'row' }, k), el('td', null, v)); const v = mk.venta || {};
    const costes = v.sinMercado ? 'Sin mercado de venta con USDT ni con TRX en sun.io' : v.esUSDT ? 'Ya es USDT' : ['10 mil $: ' + pct((v.coste10k || 0) / 100, 2), '100 mil $: ' + pct((v.coste100k || 0) / 100, 2), '1 M$: ' + pct((v.coste1M || 0) / 100, 2)].join(' · ');
    const p = mk.poderes; const pod = !p ? 'No consultado' : p.nativo ? 'TRX es el token nativo de la red: nadie puede congelarlo ni crearlo' : p.proxy ? 'Proxy actualizable: el ABI visible es el del proxy; poderes del token desconocidos' : !p.abiPublicado ? 'ABI no publicado: desconocido' : [p.crear ? 'crear' : null, p.congelar ? 'congelar direcciones' : null, p.destruir ? 'destruir saldos congelados' : null, p.pausar ? 'pausar' : null].filter(Boolean).join(', ') || 'ninguno visible en el ABI';
    return el('div', null, el('p', { class: 'narr' }, 'Mercado de JustLend leído el ' + JL.fecha(JL.d.informe.bloqueHora) + ' (bloque ' + n(JL.d.informe.bloque) + '). ', C.est('VERIFICADO'), ' la caja, el reclamo y lo prestado; ', C.est('ESTIMADO'), ' el valor en dólares.'),
      el('table', { class: 'tb' }, el('tbody', null,
        fila('Mercado (jToken)', JL.dir(mk.jToken, true)), fila('Token', mk.tokenDir ? JL.dir(mk.tokenDir, true) : 'TRX (nativo)'), fila('Estado', mk.abierto ? 'Abierto' : 'Cerrado a nuevos depósitos y préstamos: solo salida'),
        fila('Caja (lo retirable de golpe)', n(mk.caja, 2) + ' ' + mk.token + ' · ' + m(mk.cajaUSD)), fila('Reclamo de los depositantes', m(mk.reclamoUSD)), fila('Prestado', m(mk.prestadoUSD) + ' · utilización ' + pct(mk.utilizacion, 1)), fila('Cobertura de caja', pct(mk.cobertura, 1) + ' de lo que se debe a los depositantes está en caja'),
        fila('Precio del oráculo', '$' + (mk.precioUSD < 0.01 ? mk.precioUSD.toPrecision(4) : n(mk.precioUSD, 4)) + ' por ' + mk.token + ' · factor de garantía ' + pct(mk.factorGarantia, 0) + (mk.tope ? ' · tope de préstamo ' + n(mk.tope, 0) + ' ' + mk.token : '')),
        mk.oferta ? fila('Oferta total del token', n(mk.oferta.total, 0) + ' · el ' + pct(mk.oferta.parteEnJustLend, 1) + ' está dentro de JustLend') : null,
        fila('Venta en sun.io', costes), v.usdtObtenibles != null ? fila('USDT obtenibles vendiendo toda la caja', m(v.usdtObtenibles) + ' (' + pct(v.parte, 1) + ' de la caja), estimación individual') : null,
        fila('Poderes del dueño del token', pod), fila('Titulares', n(mk.titulares.total, 0) + ' · el mayor tiene el ' + pct(mk.titulares.parteTop1, 1) + ', los 3 mayores el ' + pct(mk.titulares.parteTop3, 1) + ', los 10 mayores el ' + pct(mk.titulares.parteTop10, 1)))),
      el('h4', { style: 'margin:14px 0 4px' }, 'Los 10 mayores titulares (pulsa una dirección para verla en TronScan)'),
      UI.tabla({ pp: 10, buscar: false, rows: mk.titulares.lista, cols: [{ t: 'Cuenta', v: (r) => el('span', null, JL.dir(r.a, true), r.etiqueta ? ' «' + r.etiqueta + '»' : ''), o: (r) => r.a }, { t: 'Reclamo', num: 1, v: (r) => m(r.usd), o: (r) => r.usd }, { t: 'Parte', num: 1, v: (r) => pct(r.parte, 2), o: (r) => r.parte }] }),
      el('p', { class: 'narr' }, el('a', { href: JL.doc('2'), target: '_blank', rel: 'noopener' }, 'Ver el apartado 2 del informe →'), ' · ', el('a', { href: JL.doc('5'), target: '_blank', rel: 'noopener' }, 'apartado 5 (venta) →'))); }, { ancho: false });
  /* ficha de una cuenta: lo que se sabe de ella en esta investigación */
  JL.fichaCuenta = (a) => UI.abrir('Cuenta ' + UI.corto(a, 8, 6), () => { const pos = []; for (const mk of JL.d.mercados) { const t = mk.titulares.lista.find((x) => x.a === a); if (t) pos.push([mk, t]); }
    const deu = JL.d.deudas.mayores.find((x) => x.a === a); const gig = JL.d.deudas.gigantes.find((x) => x.a === a); const et = (JL.d.titularesEtiquetas || []).find((x) => x.a === a);
    return el('div', null, el('p', { class: 'narr' }, 'Dirección completa: ', JL.dir(a, true), et ? ' · etiqueta pública de TronScan: «' + et.etiqueta + '»' : ' · sin etiqueta pública (esta investigación no atribuye identidad a ninguna cuenta).'),
      pos.length ? UI.tabla({ pp: 8, buscar: false, rows: pos, cols: [{ t: 'Mercado', v: (r) => r[0].simbolo + ' ' + r[0].token, o: (r) => r[0].simbolo }, { t: 'Reclamo', num: 1, v: (r) => m(r[1].usd), o: (r) => r[1].usd }, { t: 'Parte del mercado', num: 1, v: (r) => pct(r[1].parte, 2), o: (r) => r[1].parte }] }) : el('p', { class: 'narr' }, 'No figura entre los 10 mayores titulares de ningún mercado.'),
      deu ? el('p', { class: 'narr' }, 'Deuda: ', el('b', null, m(deu.deudaUSD)), ' (', deu.debe.map((x) => x[0] + ' ' + m(x[1])).join(', '), '). Garantía puesta: ', deu.garantia.map((x) => x[0] + ' ' + m(x[1])).join(', ') || '—', '.') : null,
      gig ? el('p', { class: 'narr' }, 'Posición leída: depósitos ', el('b', null, m(gig.depositosUSD)), ' y deuda ', el('b', null, m(gig.deudaUSD)), '.') : null,
      el('p', { class: 'narr' }, el('a', { href: JL.doc('3'), target: '_blank', rel: 'noopener' }, 'Ver el apartado 3 del informe →'))); }, { ancho: false });

  /* ---------- arranque ---------- */
  document.addEventListener('DOMContentLoaded', async () => {
    const app = document.getElementById('app');
    const [d, idx] = await Promise.all([cargar('reports/justlend-liquidez/data.json'), cargar('reports/index.json')]);
    if (!d) { app.textContent = 'No se pudieron cargar los datos de la investigación (reports/justlend-liquidez/data.json).'; return; }
    JL.d = d; JL.meta = idx && idx.informes.find((r) => r.slug === 'justlend-liquidez'); C.chartDefaults(); app.textContent = '';
    document.title = 'JustLend: ¿cuánto se puede recuperar de verdad? · School On-Chain';
    const T = d.totales;
    app.append(el('header', { class: 'rhead' }, el('span', { class: 'caso' }, 'Caso · JustLend · TRON · 13 nov 2026'),
      el('h1', null, 'JustLend: ¿cuánto dinero se puede recuperar de verdad?'),
      el('div', { class: 'sub' }, 'Foto del 13-nov-2026 (bloque ' + n(d.informe.bloque) + '), solo lectura de la cadena TRON. JustLend dice tener ' + m(T.cajaUSD) + ' en caja; aquí se mide qué parte puede salir de JustLend, cuánta se convierte en USDT y qué riesgos conviene vigilar. Todo lo que ves se puede pulsar y cada gráfico dice de dónde sale.'),
      el('div', { class: 'actions' }, el('a', { class: 'btn primary', href: d.informe.doc }, 'Leer el informe completo'), el('a', { class: 'btn', href: d.informe.md, target: '_blank', rel: 'noopener' }, 'Texto (.md) ↗'), el('a', { class: 'btn', href: d.informe.datos + 'LEEME.md', target: '_blank', rel: 'noopener' }, 'Datos originales ↗'), el('a', { class: 'btn', href: d.codex.respuesta, target: '_blank', rel: 'noopener' }, 'Revisión de Codex (texto íntegro) ↗'), el('a', { class: 'btn', href: 'reports/justlend-liquidez/data.json', target: '_blank', rel: 'noopener' }, 'Datos de esta página (JSON) ↗'))));
    try { const N0 = window.NOVEDADES ? await window.NOVEDADES.cargar() : []; const K0 = await cargar('data/cambios.json');
      const fc = JL.meta && window.CASO ? CASO.ficha(JL.meta, { huella: d.informe.huella, novedades: N0.filter((x) => x.caso === 'justlend-liquidez').length || null, cambios: K0 && K0.cambios ? K0.cambios.filter((c) => c.caso === 'justlend-liquidez').length : null }) : null; if (fc) app.append(fc);
      const mias = N0.filter((x) => x.caso === 'justlend-liquidez'); if (mias.length) { app.append(window.NOVEDADES.linea(mias[0])); const l = window.NOVEDADES.lista(mias, { caso: 'justlend-liquidez', limite: 8, titulo: 'Novedades de este caso' }); if (l) app.append(l); } } catch (e) { console.error(e); }
    app.append(el('div', { class: 'res-head warn', style: 'margin-top:14px' }, el('div', { class: 'big', style: 'font-size:17px' }, 'Antes de leer: lo que este estudio NO afirma'),
      el('div', { class: 'sub2', html: 'Que el «ETH» o el «BTC» de JustLend <b>carezcan de respaldo</b> (la cadena de TRON no puede probarlo ni desmentirlo), que alguien <b>vaya a</b> retirar, atacar o ser liquidado, ni quién está detrás de ninguna dirección: <b>no se atribuye identidad a ninguna</b>. Es una foto de un instante, sin historial; los escenarios son estrés, no predicciones. No es consejo de inversión.' })));
    app.append(el('div', { class: 'guia' }, el('div', { class: 'guiat' }, 'Cómo leer esta investigación: ' + JL.CAPS.length + ' capítulos, de arriba abajo'), el('ol', null, JL.CAPS.map((c) => el('li', null, el('a', { onclick: () => document.getElementById('cap-' + c.n).scrollIntoView({ behavior: 'smooth' }) }, el('b', null, c.t), el('span', null, c.d)))))));
    for (const p of JL.partes.sort((a, b) => a.orden - b.orden)) { try { await p.fn(app, d); } catch (e) { console.error(e); app.append(el('p', { class: 'muted' }, 'Error al dibujar un capítulo: ' + e.message)); } }
    app.append(el('p', { class: 'muted', style: 'margin:40px 0 20px;font-size:12.5px' }, 'Esta página enseña de otra forma el informe «' + d.informe.titulo + '» (huella ' + d.informe.huella + '); no lo modifica. Los datos de los gráficos salen de los ficheros de la investigación y se comprueban contra el informe antes de publicarse. Nada de esto es consejo de inversión.'));
  });
})();
