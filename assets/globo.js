/* Fondo decorativo: un globo de puntos naranjas (solo tierra firme) que gira despacio detrás de todo el contenido,
   con arcos entre ciudades y reacción al ratón. Es un adorno: no representa datos ni flujos reales.
   - No lee nada de Internet. Los continentes van dentro de este fichero como una máscara (un bit por punto),
     generada con tools/globo-mascara.cjs a partir de Natural Earth 1:110m (dominio público).
   - Va en un lienzo fijo por detrás del contenido (z-index:-1, sin recibir clics).
   - Con «reducir movimiento» activado en el sistema se dibuja quieto. No se imprime. */
(function () {
  'use strict';
  if (window.__globoFondo || !document.body) return;
  var lienzo = document.createElement('canvas');
  var x = lienzo.getContext && lienzo.getContext('2d');
  if (!x) return;
  window.__globoFondo = true;

  var PASO = 1.5; // grados entre puntos (debe coincidir con el de la máscara)
  var M = '________z___-P-___wP9n___h_8L____A_-A____-A__wH____4ABP4A_____4AAAEAP_____wAAAGAAf_7___gAAADAAAD_P__4AAAAAAAAAH8__-AAAAAAQAAAAMAFlgAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAABxgAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAMAAAAAAAAD4AAAAAAAAAAAAAAAAAAwAAAAAAAAD4AAAAAAAAAAAAAAAAEACAAAAAAAAAeAAAAAAAAAAAAAAAAAMADAAAAAAAAAH4AAAAAAAAAAAAAAAAAAACAAAAAAAAAH-AAAAAAAAAAAAAAAAAUAAwAAAAAAAAA_4AAAAAAAAAAAAAAAAA-AAAAAAAAAAAAP8AAAAAAAAAAAAAAAAAP4AEAAAAAAAAAAf-AAAAAAHgAAAAAAAHwL-AAAAAAAAAAAAD_4AAAAAAfgAAAAAAAPw_-AAAAAAAAAAAAD_8AAAAAAfwAAAAAAAH___gAAAAAAAAAAAAf_wAAAAAD_gAAAAAAAf___AAAAAAAAAAAAAf_wAAAAAD_wAAAAAAAP___gAAAAAAAAAAAAD_-AAAAAAf_AAAAAAAA____AAAAAAAAAAAAAD__AAAAAAP_wMAAAAAAP___gAAAAAAAAAAAAAf_-AAAAAB__BwAAAAAA___-AAAAAAAAAAAAAAf__gAAAAB__BwAAAAAAP__-AEAAAAAAAAAAAAH__4AAAAAf_wOAAAAAAAf__gAAAAAAAAAAAAAA___gAAAAD__g8AAAAAAAf_-AAAAAAAAAAAAAAB___wAAAAD__4cAAAAAAAP_uAAAAAAAAAAAAAAB___8AAAAA___DAAAAAAAA_xwAAAAAAAAAAAAAAf___gAAAAD__-CAAAAAAAAvDAAAAAAAAAAAAAAA____gAAAAB__8AAAAAAAAAHiAAAAAAAAAAAAAAA____wAAAAB__-AAAAAAAAAABAAAAAAAAAAAAAAAf___-AAAAAf__gAAAAAAABIAAgAAAAAAAAAAAAAD____4AAAAB__8AAAAAAADAAHkBAAAAAAAAAAAAAf____gAAAAP__wAAAAAADQAAPgQAAAAAAAAAAAAB____-AAAAA___AAAAAAAIAAA-AAAAAAAAAAAAAAD____wAAAAB___AAAAAABwAgP4AAAAAAAAAAAAAAH___4AAAAAH___AAAAAADj7ALAAAAAAAAAAAAAAAH___wAAAAAH___gAAAAADD4CQAAAAAAAAAAAAAAAD___AAAAAAH___wAAAAAHD9yAAAAAAAAAAAAAAAAB__-AAAAAAH___8AAAAANB8AAAAAAAAAAAAAAAAAB__-AAAAAAH___8AAAAAWA4AAAAAAAAAAAAAAAAAD__4AAAAfh____8AAAABMA4AAAAAAAAAAAAAAAAAH_8AAAAD______4AABAAgBDAAAAAAAAAAAAAAAAC__gAAAAf______gAAUAEAAcAAAAAAAAAAAAAAABg34AAAAD______-AADAAhASAAAAAAAAAAAAAAAAYDgAAAAB______xgABwAJwFQAAAAAAAAAAAAAAAcAAAAAAB______4AABwAL4AgAAAAAAAAAAAAAAD8AAAAAAD______eAADgAfwCAAAAAAAAAAAAAABfgAAAAAAH_____5-AAeAD-AwAAAAAAAAAAAAAB_gAAAAAAB_____8_4APwD_AIAAAAAAAAAAAAAD4wAwAAAAB_____5_4Af4H8gAAAAAAAAAAAAAAfhgYAAAAAH_____n_wB_x_wAAAAAAAAAAAAAAD4AMAAAAAB_____z_8B_-__gAAAAAAAAAAAAAD4AAAAAAAA_____n_8D____5AAAAAAAAAAAABPwAAAAAAAD____8_yA_____oAAAAAAAAAAAAv4AQAAAAAB____9_g______gAAAAAAAAAAAC_wDAAAAAAH____v8______8AAAAAAAAAAAA_8RAAAAAAA_____5______8AAAAAAAAAAAD__8AAAAAAH__v_________AAAAAAAAAAAD___AAAAAAD__GB________BAAAAAAAAAAf__-AAAAAAH_gAH_______wWAAAAAAAAAf___wAAAAAC_gIH_______CeAAAAAAAAD___-AAAAAAx4A7_______zDAAAAAAAAH___8AAAAAPgA3_5_____4wIAAAAAAAD___-AAAAAHgAn_5_____6gQAAAAAAAP___8AAAAA-DPO-f_____4IAAAAAAAf___4AAAAD458Dj______DAAAAAAAH___-gAAAAf38HP______iAAAAAAA_____AAAAH_-Xz______gAAAAAAD____hgAAB__________4AAAAAAD____mAAAH__________wAAAAAD____KAAAB_________9AAAAAAf__3_AAAHf________-CAAAAD__-_8AADz________8DAAIAH__9_gAAKA_______8AwACAH__h-AAAQp_______AcAAwP_-B8AAAgx______8DAA4P_-B0AAAHz______5IAPv__g4BAAHv______94B___4IBgADn_______4D___Qw4EA7_______7AAABHh8_iIAAAAAAOAAAMYP_4CAgAAAAwAGhnA_-BQAAAAAPldDH8AOBf__8UAFnw4f_9P_7wAAbMH4AAl_4AABAB_AAQeAAACIPwAEHCAAAX-AAAAAAH_hAAAAAf4QCAAD_AAAABAAAAAAAAAAA';
  var ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  var RAD = Math.PI / 180;

  // ---- puntos de tierra firme sobre la esfera (x derecha, y arriba, z hacia quien mira) ----
  var PX = [], PY = [], PZ = [];
  (function () {
    var filas = Math.round(180 / PASO), k = 0;
    for (var i = 0; i < filas; i++) {
      var lat = (-90 + (i + 0.5) * PASO) * RAD, cl = Math.cos(lat), sl = Math.sin(lat);
      var n = Math.max(1, Math.round((360 / PASO) * cl));
      for (var j = 0; j < n; j++, k++) {
        if (!((ABC.indexOf(M.charAt((k / 6) | 0)) >> (5 - (k % 6))) & 1)) continue;
        var lon = (-180 + ((j + 0.5) * 360) / n) * RAD;
        PX.push(cl * Math.sin(lon)); PY.push(sl); PZ.push(cl * Math.cos(lon));
      }
    }
  })();
  var N = PX.length;
  if (!N) return;

  // ---- nodos (ciudades) y arcos entre ellos: puramente decorativos ----
  function vec(lat, lon) { var cl = Math.cos(lat * RAD); return [cl * Math.sin(lon * RAD), Math.sin(lat * RAD), cl * Math.cos(lon * RAD)]; }
  var NODOS = [[40.7, -74], [37.8, -122.4], [-23.5, -46.6], [51.5, -0.1], [50.1, 8.7], [6.5, 3.4], [-26.2, 28], [41, 29], [25.2, 55.3],
    [19.1, 72.9], [1.35, 103.8], [22.3, 114.2], [37.6, 127], [35.7, 139.7], [-33.9, 151.2], [19.4, -99.1], [-34.6, -58.4], [40.4, -3.7]].map(function (c) { return vec(c[0], c[1]); });
  var PARES = [[0, 3], [0, 1], [0, 2], [0, 15], [1, 13], [3, 4], [3, 5], [17, 16], [4, 7], [7, 8], [8, 9], [8, 6], [9, 10], [10, 11], [11, 12], [12, 13], [10, 14], [3, 8], [2, 5], [13, 14], [17, 0], [1, 15]];
  var TRAMOS = 36;
  var ARCOS = PARES.map(function (p, i) {
    var a = NODOS[p[0]], b = NODOS[p[1]];
    var w = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))), sw = Math.sin(w) || 1, pts = [];
    for (var k = 0; k <= TRAMOS; k++) {
      var t = k / TRAMOS, s0 = Math.sin((1 - t) * w) / sw, s1 = Math.sin(t * w) / sw, h = 1 + 0.16 * w * Math.sin(Math.PI * t);
      pts.push([(a[0] * s0 + b[0] * s1) * h, (a[1] * s0 + b[1] * s1) * h, (a[2] * s0 + b[2] * s1) * h]);
    }
    return { pts: pts, o: (i * 0.37) % 1, v: 0.1 + ((i * 7) % 5) * 0.025 };
  });

  // ---- lienzo fijo por detrás de todo ----
  lienzo.id = 'globo-fondo';
  lienzo.setAttribute('aria-hidden', 'true');
  lienzo.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block';
  var estilo = document.createElement('style');
  estilo.textContent = '@media print{#globo-fondo{display:none!important}}';
  document.head.appendChild(estilo);
  document.body.insertBefore(lienzo, document.body.firstChild);

  var W = 0, H = 0, D = 1, R = 1, cx = 0, cy = 0;
  function medir() {
    W = window.innerWidth; H = window.innerHeight;
    D = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 2);
    lienzo.width = Math.round(W * D); lienzo.height = Math.round(H * D);
    x.setTransform(D, 0, 0, D, 0, 0);
    R = Math.max(220, Math.min(W * 0.46, H * 0.66));
    cx = W * 0.5; cy = H * 0.56;
  }

  var quieto = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var mqOscuro = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function oscuro() { var t = document.documentElement.getAttribute('data-theme'); return t ? t === 'dark' : !!(mqOscuro && mqOscuro.matches); }

  // ---- ratón ----
  var raton = { x: 0, y: 0, dentro: false, fuerza: 0 }, giroRaton = 0, inclRaton = 0;
  var ALCANCE = 120;
  if (!quieto) {
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      raton.x = e.clientX; raton.y = e.clientY; raton.dentro = true;
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { raton.dentro = false; });
    window.addEventListener('blur', function () { raton.dentro = false; });
    // pinchar (o tocar) en el fondo libre lanza una onda. Si debajo del clic hay una tarjeta, un botón, un enlace
    // o cualquier cosa con fondo propio, el clic es suyo y aquí no pasa nada.
    window.addEventListener('pointerdown', function (e) {
      if (e.button || !fondoLibre(e.target)) return;
      if (ondas.length >= 4) ondas.shift();
      ondas.push({ x: e.clientX, y: e.clientY, t0: performance.now(), r: 0, v: 1 });
    }, { passive: true });
  }
  var ondas = [], VEL_ONDA = 430, VIDA_ONDA = 1.7, BANDA = 46;
  var CONTROLES = /^(A|BUTTON|INPUT|SELECT|TEXTAREA|LABEL|SUMMARY|IMG|SVG|CANVAS|VIDEO|IFRAME)$/i;
  function fondoLibre(el) {
    for (; el && el.nodeType === 1 && el !== document.body && el !== document.documentElement; el = el.parentElement) {
      if (CONTROLES.test(el.tagName)) return false;
      var s = getComputedStyle(el), c = s.backgroundColor;
      if (s.backgroundImage !== 'none') return false;
      if (c && c !== 'transparent' && !/^rgba\([^)]*,\s*0\)$/.test(c)) return false;
    }
    return true;
  }

  var ang = 0.35, ultimo = 0;
  var cubos = [[], [], [], []], detras = [], calientes = [];
  var proy = new Array(TRAMOS + 1);

  function pinta(ts) {
    if (!quieto) requestAnimationFrame(pinta);
    if (ultimo && ts - ultimo < 30) return; // unos 30 dibujos por segundo: suficiente y gasta poco
    var dt = ultimo ? Math.min(0.1, (ts - ultimo) / 1000) : 0; ultimo = ts;

    var osc = oscuro();
    var I = osc ? 0.62 : 0.42;
    var cPunto = osc ? '#ff8a3f' : '#e4570b', cFondo = osc ? '#ef5e0e' : '#e4570b', cVivo = osc ? '#ffe2cc' : '#8a2e02', cArco = osc ? '#ffb37a' : '#c94a08';

    // el ratón inclina y gira un poco el globo; al salir vuelve solo a su sitio
    raton.fuerza += ((raton.dentro ? 1 : 0) - raton.fuerza) * Math.min(1, dt * 5);
    var gObj = raton.dentro ? (raton.x / W - 0.5) * 0.7 : 0, iObj = raton.dentro ? (raton.y / H - 0.5) * 0.4 : 0;
    giroRaton += (gObj - giroRaton) * Math.min(1, dt * 2.2); inclRaton += (iObj - inclRaton) * Math.min(1, dt * 2.2);
    ang += dt * 0.05;
    var a = ang + giroRaton + (window.pageYOffset || 0) * 0.00035, incl = 0.32 + inclRaton;
    var ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(incl), st = Math.sin(incl);
    var esc = Math.max(0.8, Math.min(1.5, R / 440));
    var mf = raton.fuerza, mx = raton.x, my = raton.y, A2 = ALCANCE * ALCANCE;

    for (var w = ondas.length - 1; w >= 0; w--) {
      var edad = (ts - ondas[w].t0) / 1000;
      if (edad >= VIDA_ONDA) { ondas.splice(w, 1); continue; }
      ondas[w].r = Math.max(0, edad) * VEL_ONDA; ondas[w].v = 1 - Math.max(0, edad) / VIDA_ONDA;
    }

    x.clearRect(0, 0, W, H);
    cubos[0].length = cubos[1].length = cubos[2].length = cubos[3].length = detras.length = calientes.length = 0;
    for (var i = 0; i < N; i++) {
      var X1 = PX[i] * ca + PZ[i] * sa, Z1 = PZ[i] * ca - PX[i] * sa;
      var Y1 = PY[i] * ct - Z1 * st, Z2 = PY[i] * st + Z1 * ct;
      var sx = cx + X1 * R, sy = cy - Y1 * R;
      if (sx < -8 || sx > W + 8 || sy < -8 || sy > H + 8) continue;
      if (Z2 < 0) { detras.push(sx, sy); continue; }
      var ox = 0, oy = 0, fc = 0, dx, dy, d, f;
      if (mf > 0.02) {
        dx = sx - mx; dy = sy - my; var d2 = dx * dx + dy * dy;
        if (d2 < A2) {
          d = Math.sqrt(d2) || 1; f = 1 - d / ALCANCE; var emp = f * f * 20 * mf;
          ox = (dx / d) * emp; oy = (dy / d) * emp; fc = f * mf;
        }
      }
      for (var o = 0; o < ondas.length; o++) { // ondas de los clics: encienden y empujan los puntos al pasar
        var on = ondas[o]; dx = sx - on.x; dy = sy - on.y; d = Math.sqrt(dx * dx + dy * dy) || 1;
        var dif = Math.abs(d - on.r);
        if (dif < BANDA) { f = (1 - dif / BANDA) * on.v; ox += (dx / d) * f * 12; oy += (dy / d) * f * 12; if (f > fc) fc = f; }
      }
      if (fc > 0.01) { calientes.push(sx + ox, sy + oy, Z2, fc); continue; }
      cubos[Math.min(3, (Z2 * 4) | 0)].push(sx, sy);
    }
    // cara de atrás: muy tenue, deja ver que es una esfera
    x.fillStyle = cFondo; x.globalAlpha = I * 0.13;
    var q = detras, t1 = 1.3 * esc, k, n;
    for (k = 0, n = q.length; k < n; k += 2) x.fillRect(q[k] - t1 / 2, q[k + 1] - t1 / 2, t1, t1);
    // cara de delante: más viva cuanto más de frente
    x.fillStyle = cPunto;
    for (var b = 0; b < 4; b++) {
      q = cubos[b]; if (!q.length) continue;
      var r = (0.85 + 0.22 * b) * esc;
      x.globalAlpha = I * (0.3 + 0.23 * b);
      x.beginPath();
      for (k = 0, n = q.length; k < n; k += 2) { x.moveTo(q[k] + r, q[k + 1]); x.arc(q[k], q[k + 1], r, 0, 6.2832); }
      x.fill();
    }
    // puntos junto al ratón: se apartan, crecen y se encienden
    q = calientes;
    for (k = 0, n = q.length; k < n; k += 4) {
      var fz = q[k + 3];
      x.globalAlpha = Math.min(1, I * (0.3 + 0.7 * q[k + 2]) + fz * 0.75);
      x.fillStyle = fz > 0.45 ? cVivo : cPunto;
      x.beginPath(); x.arc(q[k], q[k + 1], (0.85 + 0.66 * q[k + 2]) * esc + fz * 2.4, 0, 6.2832); x.fill();
    }

    // el aro de cada onda, muy fino
    x.strokeStyle = cPunto; x.lineWidth = 1.2 * esc;
    for (k = 0; k < ondas.length; k++) {
      x.globalAlpha = I * ondas[k].v * 0.55;
      x.beginPath(); x.arc(ondas[k].x, ondas[k].y, ondas[k].r, 0, 6.2832); x.stroke();
    }

    // arcos entre ciudades, con una luz que los recorre
    x.lineWidth = 1 * esc; x.lineCap = 'round';
    for (var e = 0; e < ARCOS.length; e++) {
      var arco = ARCOS[e], pts = arco.pts;
      for (k = 0; k <= TRAMOS; k++) {
        var p = pts[k], aX = p[0] * ca + p[2] * sa, aZ = p[2] * ca - p[0] * sa, aY = p[1] * ct - aZ * st, aZ2 = p[1] * st + aZ * ct;
        // visible si está en la cara de delante o si, al ir levantado, asoma por fuera del borde
        proy[k] = [cx + aX * R, cy - aY * R, aZ2, aZ2 >= 0 || aX * aX + aY * aY > 1];
      }
      x.strokeStyle = cArco;
      for (k = 0; k < TRAMOS; k++) {
        var p0 = proy[k], p1 = proy[k + 1];
        if (!p0[3] || !p1[3]) continue;
        x.globalAlpha = I * 0.5 * Math.max(0.25, Math.min(1, (p0[2] + p1[2]) * 1.5 + 0.25));
        x.beginPath(); x.moveTo(p0[0], p0[1]); x.lineTo(p1[0], p1[1]); x.stroke();
      }
      if (!quieto) arco.o = (arco.o + dt * arco.v) % 1;
      for (var c = 0; c < 4; c++) { // la luz y una pequeña estela
        var pos = arco.o - c * 0.018; if (pos < 0) continue;
        var fi = pos * TRAMOS, i0 = Math.min(TRAMOS - 1, fi | 0), fr = fi - i0, u = proy[i0], v = proy[i0 + 1];
        if (!u[3] || !v[3]) continue;
        x.globalAlpha = Math.min(1, I * 1.5) * (1 - c * 0.27);
        x.fillStyle = cVivo;
        x.beginPath(); x.arc(u[0] + (v[0] - u[0]) * fr, u[1] + (v[1] - u[1]) * fr, (2.1 - c * 0.4) * esc, 0, 6.2832); x.fill();
      }
    }
    // nodos
    for (k = 0; k < NODOS.length; k++) {
      var nd = NODOS[k], nX = nd[0] * ca + nd[2] * sa, nZ = nd[2] * ca - nd[0] * sa, nY = nd[1] * ct - nZ * st, nZ2 = nd[1] * st + nZ * ct;
      if (nZ2 < 0.02) continue;
      var nx = cx + nX * R, ny = cy - nY * R, vis = Math.min(1, nZ2 * 3);
      var lat = quieto ? 0.5 : (ts / 1000 * 0.5 + k * 0.23) % 1;
      x.strokeStyle = cPunto; x.lineWidth = 1 * esc;
      x.globalAlpha = I * vis * (1 - lat) * 0.9;
      x.beginPath(); x.arc(nx, ny, (3 + lat * 9) * esc, 0, 6.2832); x.stroke();
      x.globalAlpha = Math.min(1, I * 1.5) * vis; x.fillStyle = cPunto;
      x.beginPath(); x.arc(nx, ny, 2.8 * esc, 0, 6.2832); x.fill();
    }
    x.globalAlpha = 1;
  }

  function redibuja() { if (quieto) { ultimo = 0; requestAnimationFrame(pinta); } }
  medir();
  window.addEventListener('resize', function () { medir(); redibuja(); });
  if (quieto) {
    if (mqOscuro && mqOscuro.addEventListener) mqOscuro.addEventListener('change', redibuja);
    if (window.MutationObserver) new MutationObserver(redibuja).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
  requestAnimationFrame(pinta);
})();
