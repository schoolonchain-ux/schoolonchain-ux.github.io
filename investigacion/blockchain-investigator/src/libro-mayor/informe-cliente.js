/* Informe de trazabilidad · parte del navegador. Todo se pinta desde el MISMO objeto DATOS (gráficos y tablas comparten datos). Sin red, sin librerías. */
(function () {
  'use strict';
  var D = window.DATOS, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var nf0 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }), nf2 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
  function m(v) { v = +v || 0; var a = Math.abs(v); return a >= 1e9 ? nf0.format(v / 1e6) + ' M$' : a >= 1e6 ? nf2.format(v / 1e6) + ' M$' : a >= 1e4 ? nf0.format(v / 1e3) + ' k$' : nf0.format(v) + ' $'; }
  function n(v) { return nf0.format(+v || 0); }
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = String(txt); return e; }
  function add(p) { for (var i = 1; i < arguments.length; i++) if (arguments[i]) p.append(arguments[i]); return p; }
  function utc(t) { if (!t) return '—'; var d = new Date(t); function p(x) { return String(x).padStart(2, '0'); } return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()) + ' ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ' UTC'; }
  function badge(est) { var s = h('span', 'est est-' + est, est); s.title = D.estados[est] || ''; return s; }
  var EXPL = { tron: { tx: 'https://tronscan.org/#/transaction/', dir: 'https://tronscan.org/#/address/' }, ethereum: { tx: 'https://etherscan.io/tx/', dir: 'https://etherscan.io/address/' }, arbitrum: { tx: 'https://arbiscan.io/tx/', dir: 'https://arbiscan.io/address/' }, bnb: { tx: 'https://bscscan.com/tx/', dir: 'https://bscscan.com/address/' }, bitcoin: { tx: 'https://mempool.space/tx/', dir: 'https://mempool.space/address/' }, solana: { tx: 'https://solscan.io/tx/', dir: 'https://solscan.io/account/' } };
  function enlTx(tx, cadena) { if (!tx) return h('span', 'muted', '—'); var a = h('a', 'mono', tx); a.href = (EXPL[cadena] || EXPL.tron).tx + tx; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; }
  function enlDir(dir, cadena) { var a = h('a', 'mono', dir); a.href = (EXPL[cadena] || EXPL.tron).dir + dir; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; }
  var ADDR = D.dir, CLASES = D.clases, TIPOS = D.tipos, ESTADOS = D.estadosCod, ACT = D.activos;

  // ---------- tabla genérica: ordenable, con filtro de texto y paginada; cada fila puede ser desplegable
  function tabla(cols, filas, opc) {
    opc = opc || {}; var cont = h('div', 'tabla'); var q = h('input', 'filtro'); q.type = 'search'; q.placeholder = opc.ph || 'Filtrar…'; var info = h('span', 'muted peq');
    var barra = add(h('div', 'barra'), q, info); if (opc.extra) barra.append(opc.extra); var t = h('table'), th = h('thead'), tb = h('tbody'); var hr = h('tr'); var orden = { k: opc.orden != null ? opc.orden : -1, d: -1 }; var pag = 0, PP = opc.pp || 100;
    cols.forEach(function (c, i) { var x = h('th', c.num ? 'num' : '', c.t); x.title = 'Ordenar'; x.addEventListener('click', function () { orden = { k: i, d: orden.k === i ? -orden.d : (c.num ? -1 : 1) }; pag = 0; pintar(); }); hr.append(x); }); th.append(hr); t.append(th, tb);
    var nav = h('div', 'nav'); add(cont, barra, t, nav);
    function texto(f) { return f.__t || (f.__t = cols.map(function (c) { var v = c.v(f); return typeof v === 'object' && v ? '' : String(v == null ? '' : v); }).join(' ').toLowerCase() + ' ' + (opc.buscar ? opc.buscar(f) : '')); }
    function pintar() {
      var s = q.value.trim().toLowerCase(); var l = s ? filas.filter(function (f) { return texto(f).indexOf(s) >= 0; }) : filas.slice();
      if (orden.k >= 0) { var c = cols[orden.k]; l.sort(function (a, b) { var x = c.o ? c.o(a) : c.v(a), y = c.o ? c.o(b) : c.v(b); return (x > y ? 1 : x < y ? -1 : 0) * orden.d; }); }
      var tot = l.length, ini = pag * PP; info.textContent = n(tot) + ' filas' + (tot > PP ? ' · página ' + (pag + 1) + ' de ' + Math.ceil(tot / PP) : ''); tb.replaceChildren();
      l.slice(ini, ini + PP).forEach(function (f) { var r = h('tr'); cols.forEach(function (c) { var td = h('td', c.num ? 'num' : ''); var v = c.v(f); if (v instanceof Node) td.append(v); else td.textContent = v == null ? '' : v; r.append(td); }); if (opc.detalle) { r.classList.add('desp'); r.addEventListener('click', function (e) { if (e.target.closest('a')) return; var sig = r.nextSibling; if (sig && sig.classList && sig.classList.contains('det')) { sig.remove(); return; } var d = h('tr', 'det'), td = h('td'); td.colSpan = cols.length; td.append(opc.detalle(f)); d.append(td); r.after(d); }); } tb.append(r); });
      nav.replaceChildren(); if (tot > PP) { var a = h('button', 'btn', '← anterior'), b = h('button', 'btn', 'siguiente →'); a.disabled = pag === 0; b.disabled = ini + PP >= tot; a.onclick = function () { pag--; pintar(); }; b.onclick = function () { pag++; pintar(); }; nav.append(a, b); }
    }
    q.addEventListener('input', function () { pag = 0; pintar(); }); pintar(); return cont;
  }
  window.__tabla = tabla;

  // ---------- gráficos SVG (derivados de los mismos datos que las tablas)
  function barraApilada(partes, ancho) {
    var tot = partes.reduce(function (s, p) { return s + Math.max(0, p.v); }, 0) || 1; var W = ancho || 900, x = 0, svg = '<svg viewBox="0 0 ' + W + ' 110" class="graf" role="img" aria-label="Distribución del dinero">';
    partes.forEach(function (p) { var w = Math.max(0, p.v) / tot * W; if (w <= 0) return; svg += '<g><rect x="' + x.toFixed(1) + '" y="8" width="' + w.toFixed(1) + '" height="46" fill="' + p.c + '"><title>' + p.t + ': ' + m(p.v) + ' (' + (p.v / tot * 100).toFixed(1) + ' %)</title></rect>'; if (w > 64) svg += '<text x="' + (x + 6).toFixed(1) + '" y="36" class="gt">' + (p.v / tot * 100).toFixed(0) + ' %</text>'; svg += '</g>'; x += w; });
    var ly = 76, lx = 0; partes.forEach(function (p) { if (p.v <= 0) return; svg += '<rect x="' + lx + '" y="' + (ly - 9) + '" width="10" height="10" fill="' + p.c + '"/><text x="' + (lx + 14) + '" y="' + ly + '" class="gl">' + p.t + '</text>'; lx += 14 + p.t.length * 6.2 + 14; if (lx > W - 150) { lx = 0; ly += 17; } }); svg += '</svg>'; var d = h('div', 'grafwrap'); d.innerHTML = svg; return d;
  }
  function barrasHora(serie, color) {
    var W = 900, H = 150, mx = Math.max.apply(null, serie.map(function (s) { return s.v; })) || 1, bw = W / serie.length; var svg = '<svg viewBox="0 0 ' + W + ' ' + (H + 28) + '" class="graf" role="img" aria-label="Actividad por hora">';
    serie.forEach(function (s, i) { var hh = s.v / mx * H; svg += '<rect x="' + (i * bw + 1).toFixed(1) + '" y="' + (H - hh).toFixed(1) + '" width="' + Math.max(1, bw - 2).toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + color + '"><title>' + s.t + ': ' + m(s.v) + ' en ' + n(s.n) + ' envíos</title></rect>'; if (i % 6 === 0) svg += '<text x="' + (i * bw).toFixed(1) + '" y="' + (H + 14) + '" class="gl">' + s.t.slice(5, 13).replace('T', ' ') + 'h</text>'; }); svg += '</svg>'; var d = h('div', 'grafwrap'); d.innerHTML = svg; return d;
  }
  window.__graf = { barraApilada: barraApilada, barrasHora: barrasHora };

  // ---------- ficha de una billetera/contrato
  var porDir = {}; D.cuentas.forEach(function (c, i) { porDir[ADDR[c[0]]] = i; });
  var movPorDir = null; function indexarMovs() { if (movPorDir) return; movPorDir = {}; D.movs.forEach(function (mv, i) { (movPorDir[mv[2]] = movPorDir[mv[2]] || []).push(i); if (mv[3] !== mv[2]) (movPorDir[mv[3]] = movPorDir[mv[3]] || []).push(i); }); }
  function ficha(idx) {
    indexarMovs(); var c = D.cuentas[idx], dir = ADDR[c[0]], w = h('div', 'ficha'); var cab = h('div', 'cab'); add(cab, h('span', 'tag cl-' + CLASES[c[1]], D.nombreClase[CLASES[c[1]]] || CLASES[c[1]]), h('b', 'mono grande', dir)); w.append(cab);
    var kv = h('dl', 'kv'); function f(k, v, est) { var dd = h('dd'); if (v instanceof Node) dd.append(v); else dd.textContent = v == null || v === '' ? '—' : v; if (est) dd.append(' ', badge(est)); kv.append(h('dt', null, k), dd); }
    f('Dirección completa', enlDir(dir, 'tron')); f('Cadena', 'TRON'); f('Etiqueta / nombre', c[2] || 'sin etiqueta pública', c[2] ? 'ESTIMADO' : null);
    f('Procedencia de la etiqueta', c[2] ? 'clasificación del rastreo (TronGrid/TronScan); no es identificación de titular' : 'ninguna');
    f('Fecha de creación', c[7] ? utc(c[7]) : 'no determinada', c[7] ? 'VERIFICADO' : 'DESCONOCIDO'); f('Primera / última actividad observada', c[9] ? utc(c[9]) + ' → ' + utc(c[10]) : '—', c[9] ? 'VERIFICADO' : null);
    f('Entradas relacionadas con el incidente', c[11] ? m(c[11]) + ' en ' + n(c[13]) + ' movimientos' : '—', 'VERIFICADO'); f('Salidas relacionadas con el incidente', c[12] ? m(c[12]) + ' en ' + n(c[14]) + ' movimientos' : '—', 'VERIFICADO');
    f('Saldo actual (TRX / USDT)', c[15] >= 0 ? n(c[15]) + ' TRX · ' + n(c[16]) + ' USDT (leído ' + (D.saldosFecha || '') + ')' : 'no leído todavía', c[15] >= 0 ? 'VERIFICADO' : 'PENDIENTE');
    f('Valor aproximado en USD', c[15] >= 0 ? m(c[15] * D.precioTRX + c[16]) : '—', c[15] >= 0 ? 'ESTIMADO' : 'PENDIENTE');
    f('Parte atribuida al robo (modelo proporcional)', c[5] >= 0 && c[4] ? Math.round(c[5] * 100) + ' % de lo que le llega; retenido por flujos: ' + m(Math.max(0, c[6] || 0) * c[5]) : (c[4] ? 'sin dato' : 'billetera no leída'), c[4] ? 'ESTIMADO' : 'DESCONOCIDO');
    f('Estado de congelación', c[17] === 1 ? 'En la lista negra de Tether (evento AddedBlackList)' : c[17] === 0 ? 'No consta en los eventos de bloqueo leídos (30-oct)' : 'sin comprobar', c[17] === 1 ? 'VERIFICADO' : 'PENDIENTE');
    w.append(kv);
    var lista = (movPorDir[idxDir(dir)] || []); w.append(h('h4', null, 'Relaciones con otras direcciones (mayores, por importe)'));
    var rel = {}; lista.forEach(function (i) { var mv = D.movs[i]; var otro = mv[2] === ADDR.indexOf(dir) ? mv[3] : mv[2]; var dirn = mv[2] === ADDR.indexOf(dir) ? 'sale' : 'entra'; var k = otro + '|' + dirn; var x = rel[k] || (rel[k] = { o: otro, d: dirn, v: 0, n: 0 }); x.v += mv[6] || 0; x.n++; });
    var top = Object.keys(rel).map(function (k) { return rel[k]; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 12); w.append(tabla([{ t: 'Sentido', v: function (x) { return x.d === 'sale' ? 'envía a' : 'recibe de'; } }, { t: 'Dirección', v: function (x) { return enlDir(ADDR[x.o], 'tron'); } }, { t: 'Importe', num: 1, v: function (x) { return m(x.v); }, o: function (x) { return x.v; } }, { t: 'Mov.', num: 1, v: function (x) { return n(x.n); }, o: function (x) { return x.n; } }], top, { pp: 12, ph: 'Filtrar relaciones…' }));
    w.append(h('h4', null, 'Historial de movimientos (' + n(lista.length) + ')')); w.append(tablaMovs(lista.map(function (i) { return D.movs[i]; }), 20)); return w;
  }
  function idxDir(dir) { return ADDR.indexOf(dir); }
  window.__ficha = ficha;

  // ---------- tabla del libro de movimientos
  function tablaMovs(movs, pp) {
    return tabla([
      { t: 'Fecha', v: function (r) { return utc(r[7]); }, o: function (r) { return r[7]; } },
      { t: 'Tipo', v: function (r) { return TIPOS[r[8]]; } }, { t: 'Activo', v: function (r) { return ACT[r[4]]; } },
      { t: 'Importe', num: 1, v: function (r) { return n(r[5]); }, o: function (r) { return r[5]; } }, { t: 'Valor USD', num: 1, v: function (r) { return r[6] == null ? '—' : m(r[6]); }, o: function (r) { return r[6] || 0; } },
      { t: 'Origen', v: function (r) { return enlDir(ADDR[r[2]], 'tron'); } }, { t: 'Destino', v: function (r) { return enlDir(ADDR[r[3]], 'tron'); } }, { t: 'Estado', v: function (r) { return badge(ESTADOS[r[9]]); } }, { t: 'Transacción', v: function (r) { return enlTx(r[1], 'tron'); } }, { t: 'Id', v: function (r) { return r[0]; } }
    ], movs, { pp: pp || 100, ph: 'Filtrar por dirección, hash, tipo, activo, estado…', orden: 0, buscar: function (r) { return ADDR[r[2]] + ' ' + ADDR[r[3]]; } });
  }
  window.__movs = tablaMovs;
  window.__u = { m: m, n: n, h: h, add: add, utc: utc, badge: badge, enlTx: enlTx, enlDir: enlDir, tabla: tabla, ficha: ficha, porDir: porDir };
})();
