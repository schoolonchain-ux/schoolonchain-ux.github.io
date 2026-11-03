/* Utilidades compartidas: tema, formatos, tooltip y colores. */
(function () {
  const root = document.documentElement;
  try { const t = localStorage.getItem('tema'); if (t) root.setAttribute('data-theme', t); } catch (e) {}
  const nf = (d) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: d, minimumFractionDigits: 0, useGrouping: 'always' });
  const C = window.C = {
    n: (x, d = 0) => (x == null || isNaN(x) ? '—' : nf(d).format(x)),
    // dinero abreviado: 1.234,5 M$ · 85 k$ · 12 $
    m(x) {
      if (x == null || isNaN(x)) return '—';
      const a = Math.abs(x);
      if (a >= 1e9) return nf(0).format(x / 1e6) + ' M$';
      if (a >= 1e6) return nf(a >= 1e8 ? 0 : 1).format(x / 1e6) + ' M$';
      if (a >= 1e3) return nf(0).format(x / 1e3) + ' k$';
      return nf(0).format(x) + ' $';
    },
    pct: (x, d = 1) => (x == null ? '—' : nf(d).format(x * 100) + ' %'),
    utc(t) { return new Date(t).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'; },
    dm(t) { const d = new Date(t); return String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + ' ' + String(d.getUTCHours()).padStart(2, '0') + ':00'; },
    el(tag, attrs, ...kids) {
      const e = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs || {})) {
        if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v);
      }
      for (const k of kids.flat(Infinity)) if (k != null) e.append(k.nodeType ? k : document.createTextNode(k));
      return e;
    },
    css(name) { return getComputedStyle(root).getPropertyValue(name).trim(); },
    // paleta categórica (distinguible, válida en claro y oscuro)
    pal: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#64748b'],
    clase: { origen: '#38bdf8', billetera: '#94a3b8', nodo: '#f43f5e', casa: '#34d399', contrato: '#a78bfa', prestamo: '#fbbf24', puente: '#fb923c', usdd: '#2dd4bf', ethereum: '#6382f4', desconocida: '#64748b' },
    claseNombre: { origen: 'Origen / reparto', billetera: 'Billetera del recorrido', nodo: 'Nodo de servicio', casa: 'Casa de cambio', contrato: 'Contrato', prestamo: 'Préstamo (JustLend)', puente: 'Puente', usdd: 'USDD', ethereum: 'Billetera en Ethereum', desconocida: 'Desconocida' },
    tip(html, ev) {
      const t = document.getElementById('tip'); if (!t) return;
      if (html == null) { t.style.opacity = 0; return; }
      t.innerHTML = html; t.style.opacity = 1;
      const x = Math.min(window.innerWidth - t.offsetWidth - 10, ev.clientX + 14), y = Math.min(window.innerHeight - t.offsetHeight - 10, ev.clientY + 14);
      t.style.left = x + 'px'; t.style.top = y + 'px';
    },
    est(e) { return C.el('span', { class: 'est est-' + e }, e); },
    explorer(dir) { return /^0x/.test(dir) ? 'https://etherscan.io/address/' + dir : 'https://tronscan.org/#/address/' + dir; },
    chartDefaults() {
      if (!window.Chart) return;
      Chart.defaults.color = C.css('--soft'); Chart.defaults.borderColor = C.css('--line');
      Chart.defaults.font.family = getComputedStyle(document.body).fontFamily; Chart.defaults.font.size = 12;
      Chart.defaults.animation = window.__sinAnimacion ? false : { duration: 500 };
      Chart.defaults.plugins.legend.labels.boxWidth = 10; Chart.defaults.plugins.legend.labels.boxHeight = 10; Chart.defaults.plugins.legend.labels.usePointStyle = true;
      Chart.defaults.plugins.tooltip.padding = 9; Chart.defaults.plugins.tooltip.cornerRadius = 8;
    },
  };
  document.addEventListener('DOMContentLoaded', () => {
    const b = document.getElementById('theme');
    if (b) b.addEventListener('click', () => {
      const cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
      const nxt = cur === 'dark' ? 'light' : 'dark'; root.setAttribute('data-theme', nxt);
      try { localStorage.setItem('tema', nxt); } catch (e) {}
      location.reload();
    });
  });
})();
