/* PRUEBA · se ejecuta DENTRO de cada página al fotografiarla (lo inyecta capturar.cjs). Solo mide; no cambia datos.
   Regla: la página se trocea de forma que cada trozo pertenece a UN solo título. Dos tarjetas nunca enseñan lo mismo.
   - Si el título vive solo dentro de una caja (una tarjeta de gráfico), su trozo es la caja.
   - Si no, su trozo va desde el título hasta donde empieza el título siguiente.
   - En una pestaña con un solo título, el trozo es la pestaña entera. Lo que una pestaña enseña antes de su primer título es un trozo aparte («resumen»). */
window.__ix = (() => {
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  const visible = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const T = 'h2, h3, h4';
  const limpio = (h) => { const c = h.cloneNode(true); c.querySelectorAll('.ix-enl').forEach((b) => b.remove()); return c.textContent.replace(/\s+/g, ' ').trim(); };
  const zonaDe = (e) => { const zp = e.closest('.zp'), k = zp && zp.querySelector('.kick'); return k ? k.textContent.replace(/^[0-9\s·.]+/, '').trim() : ''; };
  function tabDe(e) {
    const pan = e.closest('.zpan'); if (!pan) return null;
    const zp = pan.closest('.zp'), bt = zp && zp.querySelector('.ztabs button[data-tab="' + pan.dataset.tab + '"]');
    return { pan, zp, bt, clave: pan.dataset.tab, nombre: bt ? bt.textContent.trim() : '' };
  }
  const cajaSola = (h) => { let u = null, a = h.parentElement; while (a && !a.matches('main, body') && a.querySelectorAll(T).length === 1) { u = a; a = a.parentElement; } return u; };

  function preparar() {
    const st = document.createElement('style'); st.textContent = '.topbar,.ticker{display:none!important} html,*{scroll-behavior:auto!important}'; document.head.append(st);
    document.querySelectorAll('body *').forEach((e) => { const p = getComputedStyle(e).position; if (p === 'fixed') e.style.setProperty('display', 'none', 'important'); else if (p === 'sticky') e.style.setProperty('position', 'static', 'important'); });
    return true;
  }
  const ids = () => [...document.querySelectorAll('[data-ix]')].map((h) => h.id);

  async function abrir(id) {
    const h = document.getElementById(id); if (!h) return false;
    const t = tabDe(h); if (t && t.pan.hidden && t.bt) { t.bt.click(); await dormir(800); }
    const d = h.closest('details:not([open])'); if (d) { d.open = true; await dormir(200); }
    h.scrollIntoView({ block: 'start' }); await dormir(450);
    return visible(h);
  }

  // El trozo de página que pertenece a este título (coordenadas de la ventana en este instante).
  function trozo(h) {
    const t = tabDe(h);
    if (!t && h.closest('.zp') && h.closest('.zp').querySelector('.ztabs')) return { l: 0, r: 0, t: 0, b: 0, modo: 'zona' };   // título de una zona con pestañas: sus pestañas ya tienen tarjeta
    if (t && [...t.pan.querySelectorAll(T)].filter(visible).length === 1) { const r = t.pan.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, modo: 'pestana' }; }
    const cajaDe = (x) => (cajaSola(x) || x).getBoundingClientRect();
    const ambito = (t ? t.pan : h.closest('section, article, main')) || document.body, ar = ambito.getBoundingClientRect(), mia = cajaDe(h);
    const otros = [...ambito.querySelectorAll(T)].filter((x) => x !== h && visible(x));
    // ¿Hay otro título a su lado, en la misma fila (rejilla de tarjetas)? Entonces su trozo es su propia caja.
    const alLado = otros.some((x) => { const c = cajaDe(x), solape = Math.min(c.bottom, mia.bottom) - Math.max(c.top, mia.top); return solape > 0.5 * Math.min(c.height, mia.height) && (c.left >= mia.right - 4 || c.right <= mia.left + 4); });
    if ((alLado || mia.height >= 200) && cajaSola(h)) return { l: mia.left, r: mia.right, t: mia.top, b: Math.min(mia.bottom, ar.bottom), modo: 'caja' };   // nunca más abajo que su pestaña o sección
    // Si no, va desde su título (o su caja) hasta donde empieza el título siguiente; así no queda nada sin dueño ni nada repetido.
    let fin = ar.bottom;
    for (const x of otros) {
      if (!(h.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
      const xt = cajaDe(x).top;
      if (xt >= mia.top + 8) { fin = Math.min(fin, xt - 6); break; }
    }
    return { l: ar.left, r: ar.right, t: mia.top - 4, b: Math.max(fin, mia.bottom), modo: 'tramo' };
  }
  function contenido(ambito, z) {
    const dentro = (e) => { const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false; const cy = (r.top + r.bottom) / 2, cx = (r.left + r.right) / 2; return cy >= z.t && cy <= z.b && cx >= z.l - 2 && cx <= z.r + 2; };
    const n = (q, extra) => [...ambito.querySelectorAll(q)].filter((e) => dentro(e) && (!extra || extra(e))).length;
    const p = [...ambito.querySelectorAll('p, .sub, .cs')].find((e) => dentro(e) && e.textContent.trim().length > 20);
    return { svg: n('svg', (e) => e.getBoundingClientRect().width > 150), canvas: n('canvas'), tabla: n('table'), campo: n('input, select, textarea'), barras: n('[class*="bar"], [class*="calor"], [class*="kpi"]'), desc: p ? p.textContent.replace(/\s+/g, ' ').trim().slice(0, 220) : '' };
  }
  const aDoc = (z) => ({ x: z.l + scrollX, y: z.t + scrollY, w: z.r - z.l, h: z.b - z.t });

  function medir(id) {
    const h = document.getElementById(id); if (!h || !visible(h)) return null;
    const z = trozo(h), t = tabDe(h), ambito = (z.modo === 'pestana' ? t.pan : h.closest('.zpan, section, article, main')) || document.body;
    return { id, t: limpio(h), n: +h.tagName[1], modo: z.modo, zona: zonaDe(h), pestana: t ? t.nombre : '', tab: t ? t.clave : '', ...aDoc(z), ...contenido(ambito, z) };
  }
  const rect = (id) => { const h = document.getElementById(id); return h && visible(h) ? aDoc(trozo(h)) : null; };

  // Lo que cada pestaña (con varios títulos) enseña antes de su primer título.
  const pestanas = () => [...document.querySelectorAll('.zp .ztabs button')].map((b) => ({ zp: b.closest('.zp').id, tab: b.dataset.tab }));
  function zonaResumen(zp, tab) {
    const pan = document.getElementById(zp).querySelector('.zpan[data-tab="' + tab + '"]'), hs = [...pan.querySelectorAll(T)].filter(visible);
    if (hs.length < 2) return null;
    const pr = pan.getBoundingClientRect(), c = cajaSola(hs[0]), ft = Math.min(hs[0].getBoundingClientRect().top, c ? c.getBoundingClientRect().top : Infinity);
    return { pan, z: { l: pr.left, r: pr.right, t: pr.top, b: ft - 6 } };
  }
  async function abrirPestana(zp, tab) { const z = document.getElementById(zp), b = z.querySelector('.ztabs button[data-tab="' + tab + '"]'); b.click(); await dormir(900); z.querySelector('.zpan[data-tab="' + tab + '"]').scrollIntoView({ block: 'start' }); await dormir(450); return true; }
  function medirResumen(zp, tab) {
    const q = zonaResumen(zp, tab); if (!q || q.z.b - q.z.t < 140) return null;
    const t = tabDe(q.pan.firstElementChild || q.pan);
    return { id: 'pestana-' + tab, t: (t ? t.nombre : tab) + ': resumen', n: 3, modo: 'resumen', zona: zonaDe(q.pan), pestana: t ? t.nombre : '', tab, ...aDoc(q.z), ...contenido(q.pan, q.z) };
  }
  const rectResumen = (zp, tab) => { const q = zonaResumen(zp, tab); return q ? aDoc(q.z) : null; };
  return { preparar, ids, abrir, medir, rect, pestanas, abrirPestana, medirResumen, rectResumen };
})();
