/* Página interactiva de «SUNSwap bajo el microscopio» (sunswap.html).
   Los datos salen de reports/sunswap-microscopio/data.json, que genera el programa sunswap-visual/exportar.cjs a partir de los archivos de la propia investigación y del informe validado:
   todas las tablas son las del informe, copiadas tal cual, y antes de escribir el fichero el programa comprueba que los números de los gráficos coinciden con las tablas del informe.
   Esta página no cambia ni reinterpreta el informe: lo enseña de otra forma. El texto íntegro sigue en doc.html. Los capítulos viven en sunswap-c1.js, sunswap-c2.js y sunswap-c3.js. */
(function () {
  const { el: el0, n, m, pct } = C;
  /* Las frases con <b>, <a>, <code>… llegan a veces como cadena: se convierten en HTML real; el resto de cadenas sigue siendo texto. */
  const ETIQ = /<\/?(?:b|i|a|em|strong|br|span|sub|sup|code|u)\b[^>]*>/i;
  const aNodos = (k) => { if (typeof k === 'string' && ETIQ.test(k)) { const t = document.createElement('template'); t.innerHTML = k; return t.content; } return Array.isArray(k) ? k.map(aNodos) : k; };
  const el = (tag, attrs, ...kids) => el0(tag, attrs, ...kids.map(aNodos));
  const SS = (window.SS = { partes: [], charts: [], el, n, m, pct });
  SS.add = (orden, fn) => SS.partes.push({ orden, fn });
  SS.VS = ['V1', 'V2', 'V3', 'V4'];
  SS.VC = { V1: '#8b5cf6', V2: '#3b82f6', V3: '#f59e0b', V4: '#10b981', Conjunto: '#94a3b8' };
  SS.GRIS = '#64748b';
  SS.INFORME = 'doc.html?f=investigacion/docs/SUNSWAP-INFORME-FINAL-2026-11-12.md';
  SS.ts = (a) => 'https://tronscan.org/#/address/' + a; SS.txu = (h) => 'https://tronscan.org/#/transaction/' + h;
  const cargar = (u) => fetch(u, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  /* ---------- texto: Markdown mínimo del informe → HTML ---------- */
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const ESTR = /\b(?:(VERIFICAD|ESTIMAD|DESCONOCID)[OA]|HIPÓTESIS|PENDIENTE)\b/g;   // el informe escribe a veces «VERIFICADA», «ESTIMADA», «DESCONOCIDA»: misma etiqueta, otro género
  SS.nivel = (t, p) => (p ? p + 'O' : t);
  SS.norm = (s) => String(s).replace(/(VERIFICAD|ESTIMAD|DESCONOCID)A/g, '$1O');
  const url = (h) => (/^https?:/.test(h) ? h : /^#/.test(h) ? SS.INFORME + h : 'investigacion/docs/' + h.replace(/^\.\//, ''));
  SS.md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, h) => '<a href="' + esc(url(h.replace(/&amp;/g, '&'))) + '" target="_blank" rel="noopener">' + t + '</a>').replace(ESTR, (t, p) => '<span class="est est-' + SS.nivel(t, p) + ' est-click" role="button" tabindex="0" data-nivel="' + SS.nivel(t, p) + '" title="Pulsa para ver todo lo que lleva esta etiqueta">' + t + '</span>');
  SS.html = (s) => el('span', { html: SS.md(s) });

  /* ---------- números en formato del informe (para ordenar tablas) ---------- */
  SS.pn = (s) => { s = String(s).replace(/`/g, '').trim(); if (/^—|^$/.test(s)) return null; const k = /(-?[\d.]+(?:,\d+)?)\s*(mil M\$|M\$|mil \$|\$|%|×)?/.exec(s); if (!k) return null; const v = parseFloat(k[1].replace(/\./g, '').replace(',', '.')); const u = k[2]; return u === 'mil M$' ? v * 1e9 : u === 'M$' ? v * 1e6 : u === 'mil $' ? v * 1e3 : v; };

  /* ---------- celdas de las tablas del informe: hashes y direcciones completas con enlace; etiquetas de certeza pulsables ---------- */
  const H64 = /^`?([0-9a-f]{64})`?$/, ADR = /^`?(T[1-9A-HJ-NP-Za-km-z]{33})`?$/;
  SS.celda = (t) => { t = String(t); let k;
    if ((k = H64.exec(t))) return UI.enlace(SS.txu(k[1]), UI.corto(k[1], 8, 6) + ' ↗', 'addr');
    if ((k = ADR.exec(t))) return UI.enlace(SS.ts(k[1]), UI.corto(k[1], 8, 6) + ' ↗', 'addr');
    return SS.html(t); };
  /* las etiquetas de certeza que salen dentro de un texto abren la lista de todo lo que lleva ese nivel */
  const abre = (ev) => { const s = ev.target.closest && ev.target.closest('.est[data-nivel]'); if (!s) return; if (ev.type === 'keydown' && ev.key !== 'Enter' && ev.key !== ' ') return; ev.preventDefault(); C.alNivel(s.dataset.nivel); };
  document.addEventListener('click', abre); document.addEventListener('keydown', abre);
  const esNum = (filas, i) => filas.length && filas.every((r) => /^[-—]|^`?\d/.test(String(r[i] || '').trim()) && SS.pn(r[i]) !== null || /^—$/.test(String(r[i] || '').trim()));
  /* columnas para UI.tabla a partir de una tabla del informe (key = «apartado#número») */
  SS.cols = (key, o = {}) => { const t = SS.d.tablas[key]; if (!t) throw new Error('falta la tabla ' + key);
    return t.cab.map((c, i) => { const num = o.texto && o.texto.includes(i) ? false : esNum(t.filas, i); return { t: c, num: num ? 1 : 0, v: (r) => SS.celda(r[i]), o: (r) => { const x = SS.pn(r[i]); return num ? (x === null ? -Infinity : x) : String(r[i]).replace(/`/g, '').toLowerCase(); }, csv: (r) => String(r[i]).replace(/`/g, '') }; }); };
  SS.rows = (key) => SS.d.tablas[key].filas.map((f) => f.slice());
  SS.tabla = (key, o = {}) => UI.tabla(Object.assign({ cols: SS.cols(key, o), rows: SS.rows(key), pp: o.pp || 12, csv: 'sunswap-' + key.replace('#', '-'), buscar: o.buscar }, o.extra || {}));
  SS.datos = (key, titulo, nota, o = {}) => Object.assign({ cols: SS.cols(key, o), rows: SS.rows(key), csv: 'sunswap-' + key.replace('#', '-'), titulo, nota }, o.extra || {});
  /* para gráficos que no salen de una sola tabla: columnas y filas a mano */
  SS.datosPropios = (titulo, nota, cab, filas, csv) => ({ titulo, nota, csv, rows: filas, cols: cab.map((c, i) => ({ t: c.t || c, num: c.num ? 1 : 0, v: (r) => (c.f ? c.f(r[i], r) : r[i]), o: (r) => (typeof r[i] === 'number' ? r[i] : String(r[i]).toLowerCase()), csv: (r) => r[i] })) });

  /* ---------- tarjeta de gráfico ---------- */
  SS.grafico = (padre, o) => { const t = UI.tarjeta({ titulo: o.titulo, sub: o.sub, alto: o.alto || 280, ayuda: o.ayuda, datos: o.datos, extra: o.extra, filtros: o.filtros, cls: o.cls }); padre.append(t.c);
    const cfg = typeof o.cfg === 'function' ? o.cfg(t) : o.cfg; cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false }, cfg.options || {});
    t.chart = new Chart(t.cv, cfg); SS.charts.push(t.chart); return t; };
  SS.fila = (...k) => el('div', { class: 'ss-fila' }, ...k);
  SS.eje = { dinero: (f) => ({ ticks: { callback: (v) => (f || m)(v) }, grid: { color: C.css('--line') } }), cat: () => ({ grid: { display: false } }) };
  SS.cursor = (cfg, onClick) => UI.clicable(cfg, onClick);
  /* leyenda en filas: pulsar una fila abre su detalle */
  SS.leyenda = (items, onClick) => el('div', { class: 'legend i' }, items.map((i) => el('div', { class: 'li', title: onClick ? 'Pulsa para ver el detalle' : null, onclick: onClick ? () => onClick(i) : null },
    el('span', { class: 'sw', style: 'background:' + i.color }), el('span', { class: 'ln' }, i.nombre, ' ', i.estado ? C.est(i.estado) : null, i.desc ? el('span', { class: 'ld' }, i.desc) : null), el('span', { class: 'lv' }, i.valor))));
  /* botones para mostrar u ocultar series */
  SS.interruptores = (items, onChange) => el('div', { class: 'ss-chips', role: 'group' }, items.map((i) => { const b = el('button', { type: 'button', class: 'ss-chip' + (i.off ? '' : ' on'), 'aria-pressed': i.off ? 'false' : 'true', style: '--c:' + i.color, onclick: () => { const on = !b.classList.contains('on'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); onChange(i.id, on); } }, el('span', { class: 'sw', style: 'background:' + i.color }), i.nombre); return b; }));

  /* ---------- piezas de capítulo ---------- */
  SS.CAPS = [
    { n: 1, t: 'Lo esencial', d: 'Qué es SUNSwap, qué medimos y lo que más sorprende, en una página.' },
    { n: 2, t: 'Dónde está el capital', d: 'Cuánto hay, en qué versión, en qué mercados y en qué monedas.' },
    { n: 3, t: 'Pocos mercados, pocas cuentas', d: 'Cuánta parte del capital reúnen los mayores mercados y los mayores titulares.' },
    { n: 4, t: 'Capital no es profundidad', d: 'Cuánto se puede vender de verdad antes de mover el precio, según la simulación.' },
    { n: 5, t: 'Volumen y actividad', d: 'Cuánto se opera, dónde, y qué parte parece rotación sin sentido económico.' },
    { n: 6, t: 'Quién pone la liquidez', d: 'Aportantes, titulares actuales y de dónde viene lo que tienen.' },
    { n: 7, t: 'Un año de historia', d: 'Capital reconstruido día a día, cantidades frente a precios y profundidad en el tiempo.' },
    { n: 8, t: 'Anomalías y riesgos', d: 'Picos, retiradas extraordinarias y tokens raros: señales, no acusaciones.' },
    { n: 9, t: 'Método, límites y evidencia', d: 'Qué se midió y qué no, cómo se contrastó el motor, ejemplos verificables y correcciones.' },
  ];
  SS.cap = (i, lead) => el('div', { class: 'cap', id: 'cap-' + i }, el('div', { class: 'capn' }, 'Capítulo ' + i + ' de ' + SS.CAPS.length), el('h2', { class: 'capt' }, SS.CAPS[i - 1].t), el('p', { class: 'capl', html: lead || SS.CAPS[i - 1].d }));
  SS.recap = (i, items, prox) => el('div', { class: 'recap' }, el('b', { class: 'rh' }, 'Lo que hemos visto en el capítulo ' + i), el('ul', null, items.map((t) => el('li', { html: t }))), SS.CAPS[i] ? el('div', { class: 'sig' }, el('span', { class: 'muted' }, prox || ''), el('button', { class: 'btn primary', onclick: () => document.getElementById('cap-' + (i + 1)).scrollIntoView({ behavior: 'smooth' }) }, 'Siguiente: ' + SS.CAPS[i].t + ' →')) : null);
  SS.llano = (...t) => el('div', { class: 'resumen-llano' }, el('b', { class: 'h' }, 'En pocas palabras'), ...t.map((x) => el('p', { html: x })));
  SS.caja = (t, ...k) => el('div', { class: 'card', style: 'margin:12px 0' }, t ? el('h3', null, t) : null, ...k);
  SS.kpi = (l, v, s, onclick) => el('div', { class: 'kpi' + (onclick ? ' clk' : ''), onclick: onclick || null, role: onclick ? 'button' : null, tabindex: onclick ? '0' : null }, el('div', { class: 'kl' }, l), el('div', { class: 'kv' }, v), el('div', { class: 'kn' }, s));
  SS.aviso = (t, ...k) => el('div', { class: 'ss-nota' }, t ? el('b', null, t + ' ') : null, ...k);
  SS.acordeon = (resumen, ...cuerpo) => el('details', { class: 'ss-det' }, el('summary', null, resumen), el('div', { class: 'ss-detc' }, ...cuerpo));
  /* enlace a la herramienta viva */
  SS.herramienta = (texto) => el('div', { class: 'ss-cta' }, el('div', null, el('b', null, 'Pruébalo con tu importe. '), texto), el('a', { class: 'btn primary', href: 'herramientas.html#liquidez-sunswap' }, 'Abrir la herramienta «Liquidez SUNSwap» →'));
  /* bloque de texto del informe (lista de párrafos en Markdown) */
  SS.texto = (lineas) => { const w = el('div', { class: 'ss-md' }); let lista = null, tipo = null; for (const l of lineas) { const t = l.trim(); if (!t) { lista = null; continue; }
      const b = /^[-*]\s+(.*)/.exec(t), nu = /^(\d+)\.\s+(.*)/.exec(t);
      if (b || nu) { const k = b ? 'ul' : 'ol'; if (!lista || tipo !== k) { lista = el(k); tipo = k; w.append(lista); } lista.append(el('li', { html: SS.md((b || nu)[b ? 1 : 2]) })); continue; }
      lista = null; const h = /^(#{3,5})\s+(.*)/.exec(t); if (h) { w.append(el('h4', { html: SS.md(h[2]) })); continue; } w.append(el('p', { html: SS.md(t) })); } return w; };

  /* ---------- «todo lo que lleva esta etiqueta»: lista de los hallazgos y respuestas por nivel de certeza ---------- */
  C.alNivel = (k) => UI.abrir('Todo lo que lleva «' + k + '» en esta página', () => { const w = el('div', null, el('p', { class: 'narr' }, 'Las respuestas a las ocho preguntas y los hallazgos principales del informe, con su nivel de certeza. Pulsa «Leer el informe completo» para ver cada cifra en su contexto.'));
    const filas = []; for (const f of SS.d.tablas['2#0'].filas) filas.push(['Pregunta ' + f[0], f[1], f[3]]); for (const f of SS.d.tablas['13#0'].filas) filas.push(['Hallazgo ' + f[0], f[1], f[2]]);
    const mias = filas.filter((f) => SS.norm(f[2]).includes(k)); w.append(mias.length ? UI.tabla({ pp: 10, buscar: false, rows: mias, cols: [{ t: 'Dónde', v: (r) => r[0], o: (r) => r[0] }, { t: 'Qué', v: (r) => SS.html(r[1]), o: (r) => r[1] }, { t: 'Certeza', v: (r) => SS.html(r[2]), o: (r) => r[2] }] }) : el('p', { class: 'muted' }, 'Ninguna de las preguntas ni de los hallazgos principales lleva exactamente esta etiqueta; aparece dentro de los apartados del informe.')); return w; }, { ancho: true });

  /* ---------- ficha de un mercado (panel lateral) ---------- */
  SS.fichaMercado = (mk) => UI.abrir(mk.par + ' · ' + mk.v, () => { const dir = mk.id.slice(3);
    const fila = (k, v) => el('tr', null, el('th', { scope: 'row' }, k), el('td', null, v));
    return el('div', null, el('p', { class: 'narr' }, 'Mercado de SUNSwap ' + mk.v + '. Capital valorado el 11-nov-2026 (valoración parcial: solo lo que tiene precio fiable). ', C.est('ESTIMADO')),
      el('table', { class: 'tb' }, el('tbody', null, fila('Par', mk.par), fila('Versión', mk.v), fila('Capital valorado', C.m(mk.usd) + ' (' + n(Math.round(mk.usd)) + ' $)'), fila('Parte del capital valorado', pct(mk.cuota, 2)), fila('Estado', mk.estado + (mk.completitud ? ' · valoración ' + mk.completitud : '')),
        fila(mk.v === 'V4' ? 'Identificador del mercado (pool id)' : 'Contrato', el('span', { style: 'word-break:break-all' }, dir)))),
      mk.v === 'V4' ? el('p', { class: 'narr' }, 'En V4 todos los mercados viven en un único contrato (el gestor de mercados); cada uno se distingue por su identificador, que no es una dirección.') : el('p', null, UI.enlace(SS.ts(dir), 'Comprobar el contrato en TronScan ↗', 'btn primary')),
      el('p', { class: 'narr' }, el('a', { href: SS.INFORME + '#6-distribucion-de-liquidez' }, 'Ver el apartado 6 del informe →'))); }, { ancho: false });

  /* ---------- arranque ---------- */
  document.addEventListener('DOMContentLoaded', async () => {
    const app = document.getElementById('app');
    const [d, idx] = await Promise.all([cargar('reports/sunswap-microscopio/data.json'), cargar('reports/index.json')]);
    if (!d) { app.textContent = 'No se pudieron cargar los datos de la investigación (reports/sunswap-microscopio/data.json).'; return; }
    SS.d = d; SS.meta = idx && idx.informes.find((r) => r.slug === 'sunswap-microscopio'); C.chartDefaults(); app.textContent = '';
    document.title = 'SUNSwap bajo el microscopio · School On-Chain';
    app.append(el('header', { class: 'rhead' }, el('span', { class: 'caso' }, 'Caso · SUNSwap V1–V4 · TRON · 11 nov 2026'),
      el('h1', null, 'SUNSwap bajo el microscopio: distribución del capital, titularidad y profundidad en V1–V4'),
      el('div', { class: 'sub' }, 'Estudio de un periodo cerrado, del 11-nov-2025 al 11-nov-2026, con datos leídos de la cadena TRON. Informe final validado el 12-nov-2026 (' + d.informe.edicion + '). Todo lo que ves se puede pulsar: cada gráfico tiene su botón «Datos» y las tablas son las del informe, tal cual.'),
      el('div', { class: 'actions' }, el('a', { class: 'btn primary', href: SS.INFORME }, 'Leer el informe completo'), el('a', { class: 'btn', href: 'herramientas.html#liquidez-sunswap' }, 'Herramienta «Liquidez SUNSwap»'), el('a', { class: 'btn', href: 'investigacion/docs/SUNSWAP-INFORME-FINAL-2026-11-12.md', target: '_blank', rel: 'noopener' }, 'Texto original (.md) ↗'), el('a', { class: 'btn', href: 'reports/sunswap-microscopio/data.json', target: '_blank', rel: 'noopener' }, 'Datos de esta página (JSON) ↗'))));
    /* ficha del caso: dos estados y ocho apartados, como en las otras investigaciones */
    try { const N0 = window.NOVEDADES ? await window.NOVEDADES.cargar() : []; const K0 = await cargar('data/cambios.json');
      const fc = SS.meta && window.CASO ? CASO.ficha(SS.meta, { reejecutados: d.kpi.RE_N, exactos: d.kpi.RE_EX, huella: d.informe.huella, novedades: N0.filter((x) => x.caso === 'sunswap-microscopio').length || null, cambios: K0 && K0.cambios ? K0.cambios.filter((c) => c.caso === 'sunswap-microscopio').length : null }) : null; if (fc) app.append(fc);
      const mias = N0.filter((x) => x.caso === 'sunswap-microscopio'); if (mias.length) { app.append(window.NOVEDADES.linea(mias[0])); const l = window.NOVEDADES.lista(mias, { caso: 'sunswap-microscopio', limite: 8, titulo: 'Novedades de este caso' }); if (l) app.append(l); } } catch (e) { console.error(e); }
    app.append(el('div', { class: 'res-head warn', style: 'margin-top:14px' }, el('div', { class: 'big', style: 'font-size:17px' }, 'Antes de leer: lo que este estudio NO afirma'),
      el('div', { class: 'sub2', html: 'Que el capital en dólares sea el «TVL» completo (solo se valora lo que tiene precio fiable), que la profundidad simulada sea <b>ejecutable</b> (no se envió ninguna transacción), que los mercados que «rotan» sean manipulación, ni quién es el dueño de ninguna dirección: <b>no se atribuye identidad a ninguna</b>. Una anomalía no es una acusación. No es consejo de inversión.' })));
    app.append(el('div', { class: 'guia' }, el('div', { class: 'guiat' }, 'Cómo leer esta investigación: ' + SS.CAPS.length + ' capítulos, de arriba abajo'), el('ol', null, SS.CAPS.map((c) => el('li', null, el('a', { onclick: () => document.getElementById('cap-' + c.n).scrollIntoView({ behavior: 'smooth' }) }, el('b', null, c.t), el('span', null, c.d)))))));
    const etiquetar = () => document.querySelectorAll('.est:not([data-nivel]):not(.est-click)').forEach((s) => { const t = SS.norm(s.textContent.trim()); if (/^(VERIFICADO|ESTIMADO|HIPÓTESIS|DESCONOCIDO|PENDIENTE)$/.test(t)) { s.dataset.nivel = t; s.classList.add('est-click'); s.setAttribute('role', 'button'); s.setAttribute('tabindex', '0'); s.title = 'Pulsa para ver todo lo que lleva esta etiqueta'; } });
    for (const p of SS.partes.sort((a, b) => a.orden - b.orden)) { try { await p.fn(app, d); etiquetar(); } catch (e) { console.error(e); app.append(el('p', { class: 'muted' }, 'Error al dibujar un capítulo: ' + e.message)); } }
    app.append(el('p', { class: 'muted', style: 'margin:40px 0 20px;font-size:12.5px' }, 'Esta página enseña de otra forma el informe «' + d.informe.titulo + '» (huella ' + d.informe.huella + '); no lo modifica. Los datos de los gráficos salen de los archivos de la investigación y se comprueban contra las tablas del informe antes de publicarse. Nada de esto es consejo de inversión.'));
  });
})();
