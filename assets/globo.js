/* Fondo decorativo «pirata del Caribe»: el mismo globo de siempre (puntos de tierra firme, gira despacio detrás de todo el contenido,
   rutas entre puertos y reacción al ratón), pero vestido de carta náutica: tinta roja sobre negro, rutas de puntos como las de un mapa del tesoro,
   unos 50 puertos de todo el mundo marcados con una «X» y su nombre (los refugios de piratas y las grandes rutas de la historia: Flota de Indias,
   Galeón de Manila, Carrera de la India, la costa berberisca, el estrecho de Malaca…), galeones con bandera pirata (calavera y dos tibias) que
   recorren las rutas en los dos sentidos, y una rosa de los vientos alrededor del globo.
   Es un adorno: no representa datos ni flujos reales. Misma mecánica que globo.js:
   - No lee nada de Internet: los continentes van en este fichero como una máscara (un bit por punto, Natural Earth 1:110m, dominio público).
   - Lienzo fijo por detrás del contenido (z-index:-1, sin recibir clics).
   - El ratón inclina y gira el globo; pinchar en el fondo libre lanza una onda; al bajar por la página el globo gira un poco más.
   - Con «reducir movimiento» activado en el sistema se dibuja quieto. No se imprime.
   Ajustes: GIRO_COMPLETO = true da la vuelta entera al mundo (como el original); false lo balancea como un barco alrededor del Caribe. */
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
  var RAD = Math.PI / 180, TAU = Math.PI * 2;

  // ---- ajustes del movimiento ----
  var CENTRO = 1.25;         // radianes: empieza con el Caribe (longitud ≈ −72°) mirando de frente
  var GIRO_COMPLETO = true;  // true = vuelta entera al mundo (≈ 2 min); false = balanceo de ±43° alrededor del Caribe
  var BALANCEO = 0.75;       // amplitud del balanceo, en radianes, si GIRO_COMPLETO es false
  var VEL_RELOJ = 0.07;      // velocidad del balanceo (periodo ≈ 90 s)

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

  // ---- puertos y rutas (decorativos): nombre, latitud, longitud ----
  function vec(lat, lon) { var cl = Math.cos(lat * RAD); return [cl * Math.sin(lon * RAD), Math.sin(lat * RAD), cl * Math.cos(lon * RAD)]; }
  var PUERTOS = [
    ['LA HABANA', 23.13, -82.38], ['PORT ROYAL', 17.94, -76.84], ['TORTUGA', 20.05, -72.8], ['NASSAU', 25.05, -77.35],
    ['CARTAGENA', 10.39, -75.51], ['PORTOBELO', 9.55, -79.65], ['VERACRUZ', 19.2, -96.13], ['SANTO DOMINGO', 18.47, -69.9],
    ['SAN JUAN', 18.47, -66.1], ['BRIDGETOWN', 13.1, -59.6], ['CHARLESTON', 32.78, -79.93], ['NUEVA YORK', 40.71, -74.0],
    ['NUEVA ORLEANS', 29.95, -90.07], ['CÁDIZ', 36.53, -6.29], ['LISBOA', 38.72, -9.14], ['LONDRES', 51.5, -0.1],
    ['ÁMSTERDAM', 52.37, 4.9], ['ARGEL', 36.75, 3.06], ['GÉNOVA', 44.41, 8.93], ['ESTAMBUL', 41.01, 28.98],
    ['ALEJANDRÍA', 31.2, 29.92], ['CABO VERDE', 14.93, -23.51], ['DAKAR', 14.69, -17.45], ['CIUDAD DEL CABO', -33.92, 18.42],
    ['ZANZÍBAR', -6.17, 39.2], ['ISLA SANTA MARÍA', -16.88, 49.85], ['ADÉN', 12.78, 45.04], ['MASCATE', 23.59, 58.41],
    ['GOA', 15.5, 73.83], ['BOMBAY', 19.08, 72.88], ['COLOMBO', 6.93, 79.86], ['MALACA', 2.19, 102.25],
    ['SINGAPUR', 1.35, 103.82], ['BATAVIA', -6.2, 106.85], ['MACAO', 22.2, 113.54], ['MANILA', 14.6, 120.98],
    ['NAGASAKI', 32.75, 129.88], ['SÍDNEY', -33.87, 151.21], ['AUCKLAND', -36.85, 174.76], ['PAPEETE', -17.54, -149.57],
    ['HONOLULU', 21.31, -157.86], ['SAN FRANCISCO', 37.77, -122.42], ['ACAPULCO', 16.85, -99.92], ['CALLAO', -12.05, -77.15],
    ['VALPARAÍSO', -33.05, -71.62], ['CABO DE HORNOS', -55.98, -67.27], ['BUENOS AIRES', -34.6, -58.38], ['RÍO DE JANEIRO', -22.9, -43.17],
    ['SALVADOR DE BAHÍA', -12.97, -38.5]
  ];
  var IDX = {}; PUERTOS.forEach(function (p, i) { IDX[p[0]] = i; });
  var NODOS = PUERTOS.map(function (p) { return vec(p[1], p[2]); });
  // qué nombre se escribe primero cuando dos se pisarían: primero los más piratas y los más lejanos entre sí
  var PRIORIDAD = ['PORT ROYAL', 'TORTUGA', 'LA HABANA', 'CARTAGENA', 'CÁDIZ', 'LONDRES', 'CIUDAD DEL CABO', 'MALACA', 'MANILA', 'ACAPULCO', 'ISLA SANTA MARÍA',
    'ESTAMBUL', 'ARGEL', 'ZANZÍBAR', 'GOA', 'MACAO', 'CABO DE HORNOS', 'NUEVA YORK', 'SAN FRANCISCO', 'RÍO DE JANEIRO', 'SÍDNEY', 'NASSAU', 'CHARLESTON', 'VERACRUZ',
    'BRIDGETOWN', 'LISBOA', 'ÁMSTERDAM', 'NAGASAKI', 'HONOLULU', 'CALLAO', 'BUENOS AIRES', 'DAKAR', 'ADÉN', 'MASCATE', 'COLOMBO', 'BATAVIA', 'PAPEETE', 'AUCKLAND',
    'SALVADOR DE BAHÍA', 'VALPARAÍSO', 'GÉNOVA', 'ALEJANDRÍA', 'NUEVA ORLEANS', 'SANTO DOMINGO', 'SAN JUAN', 'PORTOBELO', 'CABO VERDE', 'BOMBAY', 'SINGAPUR']
    .map(function (n) { return IDX[n]; }).filter(function (i) { return i != null; });
  var RUTAS = [
    // Caribe y Flota de Indias
    ['CÁDIZ', 'LA HABANA'], ['CÁDIZ', 'CARTAGENA'], ['CARTAGENA', 'LA HABANA'], ['PORTOBELO', 'CARTAGENA'], ['VERACRUZ', 'LA HABANA'], ['PORT ROYAL', 'TORTUGA'],
    ['TORTUGA', 'NASSAU'], ['NASSAU', 'CHARLESTON'], ['PORT ROYAL', 'CARTAGENA'], ['PORT ROYAL', 'PORTOBELO'], ['SANTO DOMINGO', 'SAN JUAN'], ['SAN JUAN', 'BRIDGETOWN'],
    ['LA HABANA', 'NASSAU'], ['TORTUGA', 'SANTO DOMINGO'], ['LA HABANA', 'PORT ROYAL'], ['NUEVA ORLEANS', 'LA HABANA'], ['VERACRUZ', 'NUEVA ORLEANS'], ['CHARLESTON', 'NUEVA YORK'],
    // Atlántico norte y Europa
    ['BRIDGETOWN', 'LONDRES'], ['LONDRES', 'CÁDIZ'], ['CHARLESTON', 'LONDRES'], ['NUEVA YORK', 'LONDRES'], ['ÁMSTERDAM', 'LONDRES'], ['LISBOA', 'CÁDIZ'], ['NASSAU', 'LONDRES'],
    // Atlántico sur y África
    ['LISBOA', 'RÍO DE JANEIRO'], ['RÍO DE JANEIRO', 'SALVADOR DE BAHÍA'], ['SALVADOR DE BAHÍA', 'LISBOA'], ['BUENOS AIRES', 'RÍO DE JANEIRO'], ['CABO VERDE', 'BRIDGETOWN'],
    ['DAKAR', 'CABO VERDE'], ['CIUDAD DEL CABO', 'SALVADOR DE BAHÍA'], ['LISBOA', 'CIUDAD DEL CABO'], ['CARTAGENA', 'CABO VERDE'],
    // Mediterráneo
    ['ARGEL', 'CÁDIZ'], ['ARGEL', 'GÉNOVA'], ['GÉNOVA', 'ESTAMBUL'], ['ALEJANDRÍA', 'ESTAMBUL'], ['ALEJANDRÍA', 'ARGEL'],
    // Índico y Asia (Carrera de la India, VOC, Madagascar, Malaca)
    ['CIUDAD DEL CABO', 'ZANZÍBAR'], ['ZANZÍBAR', 'ADÉN'], ['ADÉN', 'MASCATE'], ['MASCATE', 'GOA'], ['GOA', 'BOMBAY'], ['BOMBAY', 'COLOMBO'], ['COLOMBO', 'MALACA'],
    ['MALACA', 'MACAO'], ['MALACA', 'SINGAPUR'], ['SINGAPUR', 'BATAVIA'], ['MACAO', 'MANILA'], ['MACAO', 'NAGASAKI'], ['BATAVIA', 'SÍDNEY'], ['MANILA', 'SÍDNEY'],
    ['ISLA SANTA MARÍA', 'ZANZÍBAR'], ['ISLA SANTA MARÍA', 'CIUDAD DEL CABO'], ['ISLA SANTA MARÍA', 'COLOMBO'], ['ÁMSTERDAM', 'BATAVIA'], ['LISBOA', 'GOA'], ['ESTAMBUL', 'ADÉN'],
    // Pacífico y Américas del sur y oeste
    ['ACAPULCO', 'MANILA'], ['ACAPULCO', 'SAN FRANCISCO'], ['SAN FRANCISCO', 'HONOLULU'], ['HONOLULU', 'NAGASAKI'], ['HONOLULU', 'PAPEETE'], ['PAPEETE', 'AUCKLAND'], ['AUCKLAND', 'SÍDNEY'],
    ['ACAPULCO', 'CALLAO'], ['CALLAO', 'VALPARAÍSO'], ['VALPARAÍSO', 'CABO DE HORNOS'], ['CABO DE HORNOS', 'BUENOS AIRES'], ['PORTOBELO', 'CALLAO'], ['PAPEETE', 'CALLAO']
  ];
  var TRAMO_PX = 9;
  var ARCOS = [];
  RUTAS.forEach(function (r, i) {
    var ia = IDX[r[0]], ib = IDX[r[1]]; if (ia == null || ib == null) return;
    var a = NODOS[ia], b = NODOS[ib];
    var w = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))), sw = Math.sin(w) || 1, pts = [];
    var tr = Math.max(8, Math.min(80, Math.round(w * 500 / TRAMO_PX)));   // un punto cada ≈ 9 px: las rutas largas llevan más
    for (var k = 0; k <= tr; k++) {
      var t = k / tr, s0 = Math.sin((1 - t) * w) / sw, s1 = Math.sin(t * w) / sw, h = 1 + 0.12 * w * Math.sin(Math.PI * t);
      pts.push([(a[0] * s0 + b[0] * s1) * h, (a[1] * s0 + b[1] * s1) * h, (a[2] * s0 + b[2] * s1) * h]);
    }
    // pocos barcos, para que el fondo respire: ninguno en los saltos cortos entre puertos vecinos, uno en la mitad de las rutas medias y dos en las largas
    var nb = w > 1.1 ? 2 : w > 0.22 ? (i % 2 === 0 ? 1 : 0) : 0, barcos = [];
    for (var j = 0; j < nb; j++) {
      // velocidad angular casi constante (unos 15-25 px/s en pantalla): los trayectos largos tardan más que los cortos
      var v = Math.min(0.35, (0.03 + ((i * 7 + j * 3) % 5) * 0.004) / Math.max(0.05, w));
      barcos.push({ o: ((i * 0.37) + j / nb) % 1, v: v, dir: (j % 2) ? -1 : 1 });
    }
    ARCOS.push({ pts: pts, tr: tr, w: w, barcos: barcos, px: new Array(tr + 1), py: new Array(tr + 1), pz: new Array(tr + 1), pv: new Array(tr + 1) });
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

  var reloj = 0, ultimo = 0, giroLibre = 0;
  var cubos = [[], [], [], []], detras = [], calientes = [], puntosRuta = [[], [], []];
  var ca = 1, sa = 0, ct = 1, st = 0, esc = 1;
  var cPunto = '#d61f26', cFondo = '#8f1519', cVivo = '#ffe6d9', cArco = '#ff5a5e', cHueso = '#eadfd0', cPano = '#060505';
  var I = 0.7;
  var pos = { x: 0, y: 0, z: 0, dx: 0 };

  // rosa de los vientos alrededor del globo: dos anillos con marcas cada 5°, y 16 puntas
  function rosa(giro) {
    var r0 = R * 1.1;
    x.save(); x.translate(cx, cy); x.rotate(giro); x.strokeStyle = cArco; x.fillStyle = cArco; x.lineWidth = 1 * esc;
    x.globalAlpha = I * 0.34; x.beginPath(); x.arc(0, 0, r0, 0, TAU); x.stroke();
    x.globalAlpha = I * 0.22; x.beginPath(); x.arc(0, 0, r0 * 1.06, 0, TAU); x.stroke();
    var k, an, c, s, l;
    x.globalAlpha = I * 0.3; x.beginPath();
    for (k = 0; k < 72; k++) {
      an = k * 5 * RAD - Math.PI / 2; c = Math.cos(an); s = Math.sin(an);
      l = k % 18 === 0 ? 0.085 : k % 6 === 0 ? 0.055 : 0.027;
      x.moveTo(c * r0 * 1.06, s * r0 * 1.06); x.lineTo(c * r0 * (1.06 + l), s * r0 * (1.06 + l));
    }
    x.stroke();
    for (k = 0; k < 16; k++) {
      an = k * 22.5 * RAD - Math.PI / 2; c = Math.cos(an); s = Math.sin(an);
      var punta = k % 4 === 0 ? 1.34 : k % 2 === 0 ? 1.25 : 1.18, ab = 0.05 * R, bx = c * r0 * 1.06, by = s * r0 * 1.06;
      x.globalAlpha = I * (k % 4 === 0 ? 0.42 : 0.28);
      x.beginPath(); x.moveTo(bx - s * ab, by + c * ab); x.lineTo(c * r0 * punta, s * r0 * punta); x.lineTo(bx + s * ab, by - c * ab); x.closePath(); x.stroke();
      if (k % 2 === 0) { x.globalAlpha = I * 0.1; x.fill(); }
    }
    x.restore();
  }

  // galeón con bandera pirata: casco con proa, bauprés, mástil, dos velas y, arriba, un paño negro con calavera y dos tibias que ondea hacia atrás.
  // sgn = +1 si navega hacia la derecha de la pantalla, −1 si hacia la izquierda (se dibuja en espejo).
  function galeon(px, py, s, al, sgn, ts, fase) {
    x.save(); x.translate(px, py); x.scale(sgn, 1);
    x.globalAlpha = al; x.fillStyle = cHueso; x.strokeStyle = cHueso;
    x.beginPath(); x.moveTo(-5 * s, 0); x.lineTo(6.2 * s, -0.9 * s); x.lineTo(4 * s, 3 * s); x.lineTo(-3.6 * s, 3 * s); x.closePath(); x.fill();
    x.lineWidth = 0.5 * s; x.beginPath(); x.moveTo(6.2 * s, -0.9 * s); x.lineTo(9 * s, -2.6 * s); x.stroke();
    x.fillRect(-0.4 * s, -11 * s, 0.8 * s, 11 * s);
    x.beginPath(); x.moveTo(0.9 * s, -9.6 * s); x.lineTo(5.6 * s, -2 * s); x.lineTo(0.9 * s, -2 * s); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(-0.9 * s, -8 * s); x.lineTo(-4.4 * s, -2.4 * s); x.lineTo(-0.9 * s, -2.4 * s); x.closePath(); x.fill();
    // bandera: paño negro con filo claro
    var fw = 7 * s, fh = 5.4 * s, fy = -12.4 * s, on = Math.sin(ts / 230 + fase) * 0.6 * s, mx = -0.4 * s, fx = mx - fw;
    x.beginPath(); x.moveTo(mx, fy); x.lineTo(fx, fy + on); x.lineTo(fx, fy + fh + on); x.lineTo(mx, fy + fh); x.closePath();
    x.fillStyle = cPano; x.fill(); x.lineWidth = 0.45 * s; x.stroke();
    // dos tibias cruzadas y, encima, la calavera
    var bx = fx + fw * 0.52, by = fy + 3.5 * s + on * 0.5;
    x.lineWidth = 0.65 * s; x.lineCap = 'round'; x.beginPath();
    x.moveTo(bx - 2.2 * s, by - 0.9 * s); x.lineTo(bx + 2.2 * s, by + 0.9 * s); x.moveTo(bx + 2.2 * s, by - 0.9 * s); x.lineTo(bx - 2.2 * s, by + 0.9 * s); x.stroke();
    var kx = bx, ky = fy + 1.85 * s + on * 0.5;
    x.fillStyle = cHueso; x.beginPath(); x.arc(kx, ky, 1.3 * s, 0, TAU); x.fill(); x.fillRect(kx - 0.65 * s, ky + 0.7 * s, 1.3 * s, 1 * s);
    x.fillStyle = cPano; x.beginPath(); x.arc(kx - 0.5 * s, ky - 0.1 * s, 0.33 * s, 0, TAU); x.arc(kx + 0.5 * s, ky - 0.1 * s, 0.33 * s, 0, TAU); x.fill();
    x.restore();
  }

  // posición en pantalla de un punto de la ruta, dada la fracción f (0..1) del recorrido; false si no se ve
  function sobreRuta(arco, f) {
    var fi = f * arco.tr, i0 = Math.min(arco.tr - 1, fi | 0), fr = fi - i0, i1 = i0 + 1;
    if (!arco.pv[i0] || !arco.pv[i1]) return false;
    pos.x = arco.px[i0] + (arco.px[i1] - arco.px[i0]) * fr; pos.y = arco.py[i0] + (arco.py[i1] - arco.py[i0]) * fr;
    pos.z = arco.pz[i0] + (arco.pz[i1] - arco.pz[i0]) * fr; pos.dx = arco.px[i1] - arco.px[i0];
    return true;
  }

  function pinta(ts) {
    if (!quieto) requestAnimationFrame(pinta);
    if (ultimo && ts - ultimo < 30) return; // unos 30 dibujos por segundo: suficiente y gasta poco
    var dt = ultimo ? Math.min(0.1, (ts - ultimo) / 1000) : 0; ultimo = ts;

    // el ratón inclina y gira un poco el globo; al salir vuelve solo a su sitio
    raton.fuerza += ((raton.dentro ? 1 : 0) - raton.fuerza) * Math.min(1, dt * 5);
    var gObj = raton.dentro ? (raton.x / W - 0.5) * 0.7 : 0, iObj = raton.dentro ? (raton.y / H - 0.5) * 0.4 : 0;
    giroRaton += (gObj - giroRaton) * Math.min(1, dt * 2.2); inclRaton += (iObj - inclRaton) * Math.min(1, dt * 2.2);
    reloj += dt * VEL_RELOJ; giroLibre += dt * 0.05;
    var base = GIRO_COMPLETO ? CENTRO + giroLibre : CENTRO + BALANCEO * Math.sin(reloj);
    var a = base + giroRaton + (window.pageYOffset || 0) * 0.00035, incl = 0.32 + (GIRO_COMPLETO ? 0 : 0.022 * Math.sin(reloj * 2.3)) + inclRaton;
    ca = Math.cos(a); sa = Math.sin(a); ct = Math.cos(incl); st = Math.sin(incl);
    esc = Math.max(0.8, Math.min(1.5, R / 440));
    var mf = raton.fuerza, mx = raton.x, my = raton.y, A2 = ALCANCE * ALCANCE;

    for (var w = ondas.length - 1; w >= 0; w--) {
      var edad = (ts - ondas[w].t0) / 1000;
      if (edad >= VIDA_ONDA) { ondas.splice(w, 1); continue; }
      ondas[w].r = Math.max(0, edad) * VEL_ONDA; ondas[w].v = 1 - Math.max(0, edad) / VIDA_ONDA;
    }

    x.clearRect(0, 0, W, H);
    rosa(-(a - CENTRO) * 0.6);

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
    x.fillStyle = cFondo; x.globalAlpha = I * 0.16;
    var q = detras, t1 = 1.3 * esc, k, n;
    for (k = 0, n = q.length; k < n; k += 2) x.fillRect(q[k] - t1 / 2, q[k + 1] - t1 / 2, t1, t1);
    // cara de delante: más viva cuanto más de frente
    x.fillStyle = cPunto;
    for (var b = 0; b < 4; b++) {
      q = cubos[b]; if (!q.length) continue;
      var r = (0.85 + 0.22 * b) * esc;
      x.globalAlpha = I * (0.3 + 0.23 * b);
      x.beginPath();
      for (k = 0, n = q.length; k < n; k += 2) { x.moveTo(q[k] + r, q[k + 1]); x.arc(q[k], q[k + 1], r, 0, TAU); }
      x.fill();
    }
    // puntos junto al ratón: se apartan, crecen y se encienden
    q = calientes;
    for (k = 0, n = q.length; k < n; k += 4) {
      var fz = q[k + 3];
      x.globalAlpha = Math.min(1, I * (0.3 + 0.7 * q[k + 2]) + fz * 0.75);
      x.fillStyle = fz > 0.45 ? cVivo : cPunto;
      x.beginPath(); x.arc(q[k], q[k + 1], (0.85 + 0.66 * q[k + 2]) * esc + fz * 2.4, 0, TAU); x.fill();
    }

    // el aro de cada onda, muy fino
    x.strokeStyle = cPunto; x.lineWidth = 1.2 * esc;
    for (k = 0; k < ondas.length; k++) {
      x.globalAlpha = I * ondas[k].v * 0.55;
      x.beginPath(); x.arc(ondas[k].x, ondas[k].y, ondas[k].r, 0, TAU); x.stroke();
    }

    // rutas: senderos de puntos que avanzan despacio (se agrupan en tres tonos para dibujar rápido)
    var fase = quieto ? 0 : (ts / 1000 * 0.9) % 1, rp = 1.05 * esc, e, arco, pts, tr;
    puntosRuta[0].length = puntosRuta[1].length = puntosRuta[2].length = 0;
    for (e = 0; e < ARCOS.length; e++) {
      arco = ARCOS[e]; pts = arco.pts; tr = arco.tr;
      for (k = 0; k <= tr; k++) {
        var p = pts[k], aX = p[0] * ca + p[2] * sa, aZ = p[2] * ca - p[0] * sa, aY = p[1] * ct - aZ * st, aZ2 = p[1] * st + aZ * ct;
        arco.px[k] = cx + aX * R; arco.py[k] = cy - aY * R; arco.pz[k] = aZ2;
        // visible si está en la cara de delante o si, al ir levantado, asoma por fuera del borde
        arco.pv[k] = aZ2 >= 0 || aX * aX + aY * aY > 1;
      }
      for (k = 0; k < tr; k++) {
        if (!arco.pv[k] || !arco.pv[k + 1]) continue;
        var u0 = arco.px[k], v0 = arco.py[k], prof = Math.max(0.22, Math.min(1, (arco.pz[k] + arco.pz[k + 1]) * 1.5 + 0.25));
        puntosRuta[prof < 0.45 ? 0 : prof < 0.75 ? 1 : 2].push(u0 + (arco.px[k + 1] - u0) * fase, v0 + (arco.py[k + 1] - v0) * fase);
      }
    }
    x.fillStyle = cArco;
    for (var tono = 0; tono < 3; tono++) {
      q = puntosRuta[tono]; if (!q.length) continue;
      x.globalAlpha = I * [0.22, 0.42, 0.64][tono]; x.beginPath();
      for (k = 0, n = q.length; k < n; k += 2) x.rect(q[k] - rp, q[k + 1] - rp, rp * 2, rp * 2);
      x.fill();
    }

    // puertos: una «X» de tesoro con el latido de siempre, y el nombre (solo si no tapa a otro)
    var conRotulo = 'letterSpacing' in x, ocupado = [], vistos = [];
    for (k = 0; k < NODOS.length; k++) {
      var nd = NODOS[k], nX = nd[0] * ca + nd[2] * sa, nZ = nd[2] * ca - nd[0] * sa, nY = nd[1] * ct - nZ * st, nZ2 = nd[1] * st + nZ * ct;
      if (nZ2 < 0.02) continue;
      var nx = cx + nX * R, ny = cy - nY * R, vis = Math.min(1, nZ2 * 3);
      vistos[k] = { x: nx, y: ny, z: nZ2 }; ocupado.push([nx - 6 * esc, ny - 6 * esc, nx + 6 * esc, ny + 6 * esc]);
      var lat = quieto ? 0.5 : (ts / 1000 * 0.5 + k * 0.23) % 1;
      x.strokeStyle = cPunto; x.lineWidth = 1 * esc;
      x.globalAlpha = I * vis * (1 - lat) * 0.9;
      x.beginPath(); x.arc(nx, ny, (3 + lat * 9) * esc, 0, TAU); x.stroke();
      var br = 4.2 * esc;
      x.strokeStyle = cArco; x.lineWidth = 2 * esc; x.lineCap = 'round'; x.globalAlpha = Math.min(1, I * 1.5) * vis;
      x.beginPath(); x.moveTo(nx - br, ny - br); x.lineTo(nx + br, ny + br); x.moveTo(nx + br, ny - br); x.lineTo(nx - br, ny + br); x.stroke();
    }
    x.font = '500 ' + Math.round(10 * esc) + 'px "IBM Plex Mono", ui-monospace, Consolas, monospace';
    if (conRotulo) x.letterSpacing = (1.2 * esc) + 'px';
    x.fillStyle = cHueso;
    for (var pr = 0; pr < PRIORIDAD.length; pr++) {
      var kk = PRIORIDAD[pr], v = vistos[kk]; if (!v || v.z < 0.25) continue;
      var tw = x.measureText(PUERTOS[kk][0]).width, bx0 = v.x + 8 * esc, by0 = v.y - 7 * esc, bx1 = bx0 + tw, by1 = by0 + 13 * esc, choca = false;
      for (var oc = 0; oc < ocupado.length && !choca; oc++) { var bb = ocupado[oc]; choca = bx0 < bb[2] && bx1 > bb[0] && by0 < bb[3] && by1 > bb[1]; }
      if (choca) continue;
      ocupado.push([bx0, by0, bx1, by1]);
      x.globalAlpha = I * 0.85 * Math.min(1, (v.z - 0.25) * 4);
      x.fillText(PUERTOS[kk][0], bx0, v.y + 3.5 * esc);
    }
    // galeones (encima de todo, para que se lean bien): unos por cada sentido de cada ruta, con una pequeña estela de dos puntos
    var sB = 1.2 * esc;
    for (e = 0; e < ARCOS.length; e++) {
      arco = ARCOS[e];
      for (var bj = 0; bj < arco.barcos.length; bj++) {
        var bq = arco.barcos[bj];
        if (!quieto) bq.o = (bq.o + dt * bq.v) % 1;
        var fb = bq.dir > 0 ? bq.o : 1 - bq.o;
        if (!sobreRuta(arco, fb)) continue;
        var vg = Math.max(0.25, Math.min(1, pos.z * 3)), gx = pos.x, gy = pos.y, sg = (pos.dx * bq.dir) >= 0 ? 1 : -1;
        x.fillStyle = cVivo;
        for (var c = 1; c <= 2; c++) {
          var fe = fb - bq.dir * c * 0.012; if (fe < 0 || fe > 1) continue;
          if (!sobreRuta(arco, fe)) continue;
          x.globalAlpha = Math.min(1, I * 1.2) * vg * (1 - c * 0.35);
          x.beginPath(); x.arc(pos.x, pos.y, (1.6 - c * 0.3) * esc, 0, TAU); x.fill();
        }
        galeon(gx, gy - 2 * esc, sB, Math.min(1, I * 1.5) * vg, sg, ts, e * 0.9 + bj);
      }
    }
    x.globalAlpha = 1;
  }

  function redibuja() { if (quieto) { ultimo = 0; requestAnimationFrame(pinta); } }
  medir();
  window.addEventListener('resize', function () { medir(); redibuja(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redibuja);
  requestAnimationFrame(pinta);
})();
