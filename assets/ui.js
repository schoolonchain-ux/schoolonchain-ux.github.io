/* Componentes de interfaz compartidos: panel lateral, tablas con búsqueda/orden/CSV, ayudas por gráfico. */
(function () {
  const { el, n, m } = C;
  const UI = (window.UI = {});

  /* ---------- panel lateral con historial ---------- */
  let scrim, dr, titleEl, subEl, bodyEl, backBtn;
  const pila = [];
  function montar() {
    if (dr) return;
    scrim = el('div', { class: 'scrim', onclick: () => UI.cerrar() });
    backBtn = el('button', { class: 'ibtn', title: 'Volver', onclick: () => UI.atras() }, '←');
    titleEl = el('h3'); subEl = el('div', { class: 'st' });
    bodyEl = el('div', { class: 'body' });
    dr = el('aside', { class: 'drawer', role: 'dialog', 'aria-modal': 'true' },
      el('header', null, backBtn, el('div', { class: 'tt' }, titleEl, subEl), el('button', { class: 'ibtn', title: 'Cerrar (Esc)', onclick: () => UI.cerrar() }, '✕')),
      bodyEl);
    document.body.append(scrim, dr);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') UI.cerrar(); });
  }
  function pintar() {
    const p = pila[pila.length - 1];
    titleEl.textContent = p.titulo; subEl.textContent = p.sub || '';
    bodyEl.textContent = ''; bodyEl.append(typeof p.contenido === 'function' ? p.contenido() : p.contenido);
    bodyEl.scrollTop = 0; backBtn.disabled = pila.length < 2;
    dr.classList.toggle('wide', !!p.ancho);
  }
  UI.abrir = function (titulo, contenido, o = {}) {
    montar(); pila.push({ titulo, contenido, sub: o.sub, ancho: o.ancho });
    pintar(); scrim.classList.add('on'); dr.classList.add('on');
  };
  /* Lista de todo lo que lleva una etiqueta de evidencia en la página actual, agrupado por capítulo, con «Ir allí». El informe la sustituye por la lista de sus datos. */
  C.alNivel = (k) => {
    const NOMBRE = { ATRIBUCION: 'ATRIBUCIÓN DE TERCEROS', HIPOTESIS: 'HIPÓTESIS' };
    const marcas = [...document.querySelectorAll('.est-' + k)].filter((b) => !b.closest('.drawer') && !b.closest('[data-def]') && !b.closest('.guia') && b.offsetParent !== null);
    const caps = [...document.querySelectorAll('.cap')];
    const capDe = (b) => { let c = null; for (const x of caps) { if (x.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) c = x; } return c ? (c.querySelector('.capt') || {}).textContent || '' : 'Cabecera'; };
    const contexto = (b) => { const f = b.closest('tr, li, p, .card') || b.parentElement; const t = (f.textContent || '').replace(/s+/g, ' ').replace(b.textContent, '').trim(); const h = f.closest('.card') && f.closest('.card').querySelector('h3'); return (h && h !== f && !f.matches('.card') ? h.textContent + ' — ' : '') + (t.length > 190 ? t.slice(0, 190) + '…' : t); };
    UI.abrir('Todo lo que lleva «' + (NOMBRE[k] || k) + '» en esta página', () => {
      const w = el('div'); const g = new Map();
      marcas.forEach((b) => { const c = capDe(b); (g.get(c) || g.set(c, []).get(c)).push(b); });
      w.append(el('p', { class: 'narr', html: 'Esta etiqueta aparece <b>' + marcas.length + (marcas.length === 1 ? ' vez' : ' veces') + '</b> en esta página. Pulsa «Ir allí» para verla en su sitio.' }));
      if (!marcas.length) w.append(el('p', { class: 'narr' }, 'Ahora mismo ningún dato de esta página lleva esta etiqueta.'));
      g.forEach((bs, c) => w.append(el('h4', { style: 'margin:14px 0 4px' }, c + ' (' + bs.length + ')'), UI.tabla({ pp: 8, buscar: false, rows: bs, cols: [{ t: 'Dónde', v: (b) => contexto(b), o: (b) => contexto(b) }, { t: '', v: (b) => el('button', { class: 'mini', onclick: () => { UI.cerrar(); b.scrollIntoView({ behavior: 'smooth', block: 'center' }); const f = b.closest('tr, li, p, .card') || b; f.classList.add('flash'); setTimeout(() => f.classList.remove('flash'), 1800); } }, 'Ir allí →') }] })));
      return w;
    }, { sub: 'Etiqueta de evidencia' });
  };
  UI.atras = () => { if (pila.length > 1) { pila.pop(); pintar(); } };
  UI.cerrar = () => { if (!dr) return; pila.length = 0; scrim.classList.remove('on'); dr.classList.remove('on'); };
  UI.cargando = (t) => el('div', { class: 'loading' }, t || 'Cargando…');

  /* ---------- utilidades ---------- */
  UI.csv = function (nombre, cols, rows) {
    const esc = (v) => { v = v == null ? '' : String(v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    const txt = '﻿' + cols.map((c) => esc(c.t)).join(',') + '\n' + rows.map((r) => cols.map((c) => esc(c.csv ? c.csv(r) : c.o ? c.o(r) : textoDe(c.v(r)))).join(',')).join('\n');
    const a = el('a', { href: URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' })), download: nombre.endsWith('.csv') ? nombre : nombre + '.csv' });
    document.body.append(a); a.click(); a.remove();
  };
  const textoDe = (v) => (v == null ? '' : v.nodeType ? v.textContent : String(v));
  UI.copiar = function (t, btn) {
    const ok = () => { if (btn) { const o = btn.textContent; btn.textContent = '✓ Copiado'; setTimeout(() => (btn.textContent = o), 1200); } };
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok, ok); else ok();
  };
  UI.enlace = (href, t, cls) => el('a', { href, target: '_blank', rel: 'noopener', class: cls || null }, t);
  UI.evm = (d) => typeof d === 'string' && /^0x/i.test(d);
  UI.urlDir = (d) => (UI.evm(d) ? 'https://etherscan.io/address/' + d : 'https://tronscan.org/#/address/' + d);
  UI.urlTx = (tx, evm) => (evm || /^0x/i.test(tx) ? 'https://etherscan.io/tx/' + tx : 'https://tronscan.org/#/transaction/' + tx);
  UI.corto = (s, a = 8, b = 6) => (s && s.length > a + b + 2 ? s.slice(0, a) + '…' + s.slice(-b) : s || '');
  UI.fecha = (t) => (t ? new Date(t).toISOString().replace('T', ' ').slice(0, 16) : '—'); // t en ms
  UI.fechaS = (t) => (t ? new Date(t * 1000).toISOString().replace('T', ' ').slice(0, 16) : '—'); // t en segundos

  /* ---------- tabla ---------- */
  // opts: { cols:[{t, v(r)->nodo|texto, o(r)->valor de orden, num, csv(r)}], rows, pp, buscar, csv, onRow(r), filtros:[{t, opciones:[...], fn(r,op)}], orden:[col, dir], vacio }
  UI.tabla = function (opts) {
    const cols = opts.cols; let rows = opts.rows.slice(); const pp = opts.pp || 12; let pag = 0, q = '', ord = opts.orden || null, fil = {};
    const wrap = el('div', { class: 'dt' }); const bar = el('div', { class: 'bar' }); const sc = el('div', { class: 'sc' }); const pg = el('div', { class: 'pg' });
    const inp = el('input', { class: 'q', type: 'search', placeholder: opts.ph || 'Buscar…', oninput: (e) => { q = e.target.value.trim().toLowerCase(); pag = 0; dib(); } });
    if (opts.buscar !== false) bar.append(inp);
    (opts.filtros || []).forEach((f) => {
      const s = el('select', { onchange: (e) => { fil[f.t] = e.target.value; pag = 0; dib(); } }, el('option', { value: '' }, f.t + ': todos'), f.opciones.map((o) => el('option', { value: o }, o)));
      bar.append(s);
    });
    if (opts.csv) bar.append(el('button', { class: 'mini', onclick: () => UI.csv(opts.csv, cols, filtradas()) }, '⤓ CSV'));
    wrap.append(bar, sc, pg);
    const texto = (r) => (r.__t || (r.__t = cols.map((c) => textoDe(c.csv ? c.csv(r) : c.v(r))).join(' ').toLowerCase()));
    function filtradas() {
      let x = rows;
      if (q) x = x.filter((r) => texto(r).includes(q));
      for (const f of opts.filtros || []) if (fil[f.t]) x = x.filter((r) => f.fn(r, fil[f.t]));
      if (ord) { const c = cols[ord[0]], k = ord[1]; const val = (r) => (c.o ? c.o(r) : textoDe(c.v(r))); x = x.slice().sort((a, b) => { const va = val(a), vb = val(b); return (va < vb ? -1 : va > vb ? 1 : 0) * k; }); }
      return x;
    }
    function dib() {
      const x = filtradas(); const pags = Math.max(1, Math.ceil(x.length / pp)); pag = Math.min(pag, pags - 1);
      const th = el('tr', null, cols.map((c, i) => el('th', { class: c.num ? 'n' : null, style: c.num ? 'text-align:right' : null, onclick: () => { ord = ord && ord[0] === i ? [i, -ord[1]] : [i, c.num ? -1 : 1]; dib(); } }, c.t, el('span', { class: 'ar' }, ord && ord[0] === i ? (ord[1] > 0 ? '▲' : '▼') : ''))));
      const tb = x.slice(pag * pp, pag * pp + pp).map((r) => el('tr', { class: opts.onRow ? 'clk' : null, onclick: opts.onRow ? (ev) => { if (ev.target.closest('a[href]')) return; if (ev.target.closest('a[data-propio]')) return; opts.onRow(r); } : null }, cols.map((c) => el('td', { class: c.num ? 'n' : null }, c.v(r)))));
      sc.textContent = ''; sc.append(el('table', null, el('thead', null, th), el('tbody', null, tb.length ? tb : el('tr', null, el('td', { colspan: cols.length, class: 'muted' }, opts.vacio || 'Sin resultados.')))));
      pg.textContent = '';
      pg.append(el('span', null, n(x.length) + (x.length === rows.length ? ' filas' : ' de ' + n(rows.length) + ' filas')), el('span', { class: 'sp' }),
        el('button', { class: 'mini', disabled: pag === 0, onclick: () => { pag--; dib(); } }, '‹'), el('span', null, 'Pág. ' + (pag + 1) + ' / ' + pags), el('button', { class: 'mini', disabled: pag >= pags - 1, onclick: () => { pag++; dib(); } }, '›'));
    }
    dib();
    wrap.cambiar = (nuevas) => { rows = nuevas.slice(); pag = 0; dib(); };
    return wrap;
  };

  /* ---------- ayuda desplegable por gráfico ---------- */
  // items: [{k:'Qué muestra', v:'texto o html', l:[...lista]}]
  UI.ayuda = function (items) {
    return el('div', { class: 'ayuda' }, items.filter(Boolean).map((i) => el('div', { class: 'ai' }, el('b', null, i.k + '. '), i.v ? el('span', { html: i.v }) : null, i.l ? el('ul', null, i.l.map((x) => el('li', { html: x }))) : null)));
  };

  /* ---------- tarjeta estándar con herramientas ---------- */
  // opts: { titulo, sub, alto, ayuda:[...], datos:{cols, rows, csv, titulo}, extra: nodo(s) bajo el gráfico }
  UI.tarjeta = function (opts) {
    const cv = el('canvas'); const wrap = el('div', { class: 'cv', style: 'height:' + (opts.alto || 260) + 'px' }, cv);
    const tools = el('div', { class: 'tools' });
    const c = el('div', { class: 'card ' + (opts.cls || '') });
    const head = el('div', { class: 'head' }, el('div', { class: 'ht' }, el('h3', null, opts.titulo), opts.sub ? el('div', { class: 'cs' }, opts.sub) : null), tools);
    c.append(head);
    let ay = null;
    if (opts.ayuda) {
      const b = el('button', { class: 'tbtn', title: 'Qué es esto y cómo se lee', onclick: () => { if (ay) { ay.remove(); ay = null; b.classList.remove('on'); } else { ay = UI.ayuda(opts.ayuda); head.after(ay); b.classList.add('on'); } } }, 'ⓘ Cómo leerlo');
      tools.append(b);
    }
    if (opts.datos) tools.append(el('button', { class: 'tbtn', title: 'Ver los datos de este gráfico', onclick: () => UI.abrir(opts.datos.titulo || opts.titulo, () => el('div', null, el('p', { class: 'narr' }, opts.datos.nota || 'Estos son los datos exactos que dibuja el gráfico.'), UI.tabla({ pp: 15, ...opts.datos })), { ancho: true }) }, '▦ Datos'));
    if (opts.filtros) c.append(opts.filtros);
    c.append(wrap);
    if (opts.extra) c.append(opts.extra);
    return { c, cv, wrap, tools };
  };

  /* cursor y clic en gráficos de Chart.js */
  UI.clicable = (cfg, onClick) => {
    cfg.options = cfg.options || {};
    cfg.options.onClick = (ev, els, chart) => { if (els.length) onClick(els[0], chart, ev); };
    cfg.options.onHover = (ev, els) => { ev.native.target.style.cursor = els.length ? 'pointer' : 'default'; };
    return cfg;
  };
})();
