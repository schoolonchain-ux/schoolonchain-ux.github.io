/* Regla del semáforo de JustLend (window.JLR): ¿se puede recuperar un importe de un mercado de JustLend?
   Es la MISMA regla que propone el capítulo 10 del informe y que ya usa la calculadora de justlend.html (assets/justlend-c2.js); aquí trabaja con los datos EN VIVO del panel
   (data/justlend-panel.json) y añade la regla 1 (lecturas antiguas), que no tiene sentido en una foto fija. Las reglas se aplican por orden y gana la primera que se cumple.
   Sin IA: solo comparaciones. Entradas de un mercado m: cajaUSD, reclamoUSD, token, abierto, venta {esUSDT, sinMercado, curva [[usd, coste %, salida USDT], …]}, poderes (de la investigación),
   parteTop3 (parte de los 3 mayores titulares, foto del 13-nov). ctx: { psm: USDT en la PSM de USDD, edadH: horas desde la lectura (null = sin lectura) }. */
(function () {
  const LIMITE_EDAD_H = 3;   // más antigua que esto, el panel no clasifica (regla 1)
  const pct = (x, d = 1) => (x == null || isNaN(x) ? '—' : (Math.round(x * 10 ** d) / 10 ** d).toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d }));
  const dolar = (x) => (x >= 1e9 ? pct(x / 1e9, 2) + ' mil M$' : x >= 1e6 ? pct(x / 1e6, x >= 1e7 ? 0 : 1) + ' M$' : x >= 1e3 ? pct(x / 1e3, x >= 1e5 ? 0 : 1) + ' k$' : pct(x, 0) + ' $');

  // coste (%) de vender `usd` dólares según la curva (interpolación en el logaritmo del tamaño); null si el importe supera el mayor tamaño que mide el motor
  function costeA(curva, usd) {
    if (!curva || !curva.length || !(usd > 0)) return null;
    if (usd <= curva[0][0]) return curva[0][1];
    for (let i = 1; i < curva.length; i++) {
      if (usd <= curva[i][0]) { const a = curva[i - 1], b = curva[i]; const t = (Math.log(usd) - Math.log(a[0])) / (Math.log(b[0]) - Math.log(a[0])); return a[1] + (b[1] - a[1]) * t; }
    }
    return null;
  }
  // USDT que se reciben al vender `usd` dólares (misma interpolación sobre la tercera columna de la curva)
  function salidaA(curva, usd) {
    if (!curva || !curva.length || !(usd > 0)) return null;
    if (usd <= curva[0][0]) return curva[0][2] * usd / curva[0][0];
    for (let i = 1; i < curva.length; i++) {
      if (usd <= curva[i][0]) { const a = curva[i - 1], b = curva[i]; const t = (Math.log(usd) - Math.log(a[0])) / (Math.log(b[0]) - Math.log(a[0])); return a[2] + (b[2] - a[2]) * t; }
    }
    return null;
  }
  // salida oficial (sin pasar por el mercado)
  function oficial(m, ctx) {
    const v = m.venta || {}, psm = ctx && ctx.psm;
    if (v.esUSDT) return { tipo: 'Ya es USDT', corto: 'Ya es USDT', capacidadUSD: Infinity, verificable: true };
    if (m.token === 'USDD' && m.abierto) return { tipo: 'PSM de USDD: 1:1 sin comisión, ' + (psm == null ? 'reserva sin leer' : dolar(psm) + ' de USDT') + ', compartidos con todos los que la usan', corto: 'PSM de USDD' + (psm == null ? '' : ' · ' + dolar(psm)), capacidadUSD: psm == null ? 0 : psm, verificable: psm != null };
    if (m.token === 'sTRX') return { tipo: 'Desatar en JustLend: 14 días (según la documentación; no verificado en el contrato)', corto: 'Desatar: 14 días', lenta: true, capacidadUSD: Infinity, verificable: false };
    if ((m.token === 'ETH' || m.token === 'BTC') && m.abierto) return { tipo: 'Canje con el emisor: no verificable en la cadena', corto: 'Canje con el emisor (no verificable)', capacidadUSD: 0, verificable: false };
    if (m.token === 'TRX') return { tipo: 'Sin salida oficial propia (TRX es el token nativo): se vende en el mercado', corto: 'Sin salida propia', capacidadUSD: 0, verificable: false };
    return { tipo: 'No investigada', corto: 'No investigada', capacidadUSD: 0, verificable: false };
  }
  // texto corto de los poderes del emisor
  function poderesTexto(p) {
    if (!p) return { corto: 'Sin datos', largo: 'No se investigaron los poderes de este token.', nivel: 'des' };
    if (p.nativo) return { corto: 'Token nativo', largo: 'Es el token nativo de la cadena: no tiene emisor que pueda congelarlo.', nivel: 'ok' };
    if (!p.abiPublicado) return { corto: p.proxy ? 'Proxy: desconocido' : 'ABI no publicado', largo: p.proxy ? 'Es un proxy actualizable: su código visible es el del proxy y no se sabe qué puede hacer su dueño.' : 'El contrato no publica su ABI: no se sabe qué puede hacer su dueño.', nivel: 'des' };
    const l = []; if (p.congelar) l.push('congelar cuentas'); if (p.pausar) l.push('pausar'); if (p.crear) l.push('crear'); if (p.destruir) l.push('destruir saldos');
    const dañino = p.congelar || p.pausar;
    return { corto: l.length ? 'Puede ' + l.slice(0, 2).join(' y ') + (l.length > 2 ? '…' : '') : 'Sin poderes visibles', largo: l.length ? 'El dueño del token puede: ' + l.join(', ') + '.' : 'No se ven funciones de congelar, pausar ni crear.', nivel: dañino ? 'mal' : l.length ? 'med' : 'ok' };
  }

  function veredicto(m, usd, ctx) {
    const v = m.venta || {}, p = m.poderes, of = oficial(m, ctx), razones = [];
    const caja = m.cajaUSD, top3Caja = (m.parteTop3 || 0) * (m.reclamoUSDfoto || m.reclamoUSD || 0) / (caja || 1);
    const coste = v.esUSDT ? 0 : v.sinMercado ? null : costeA(v.curva, usd);
    const poderes = !!(p && p.abiPublicado && (p.congelar || p.pausar));
    const base = { coste, of, poderes, top3Caja, salida: v.esUSDT ? usd : (coste == null ? null : salidaA(v.curva, usd)) };
    // regla 1: lecturas ausentes o antiguas
    const edad = ctx && ctx.edadH;
    if (edad == null || edad > LIMITE_EDAD_H || caja == null) { razones.push(edad == null || caja == null ? 'Falta la lectura de este mercado.' : 'La lectura tiene ' + pct(edad, 1) + ' horas: más de ' + LIMITE_EDAD_H + ' h, el panel no clasifica con datos viejos.'); return { v: 'desconocido', razones, ...base }; }
    // regla 2: la caja es un hecho (menos que el importe → no se puede sacar entero)
    if (usd > caja) { razones.push('La caja del mercado (' + dolar(caja) + ') es menor que el importe.'); return { v: 'comprometido', razones, ...base }; }
    // regla 3: sin medida de venta y sin salida oficial verificable
    if (!v.esUSDT && (v.sinMercado || coste === null) && !(of.verificable && of.capacidadUSD >= usd)) { razones.push(v.sinMercado ? 'No hay mercado de venta con USDT ni con TRX en sun.io.' : 'El importe supera el mayor tamaño que el motor de venta puede medir.'); return { v: 'desconocido', razones, ...base }; }
    // regla 4: vender cuesta demasiado y no hay salida oficial
    if (!v.esUSDT && coste !== null && coste > 5 && !(of.verificable && of.capacidadUSD >= usd)) { razones.push('Vender cuesta un ' + pct(coste, 1) + ' % y no hay una salida oficial verificable con capacidad suficiente.'); return { v: 'comprometido', razones, ...base }; }
    // regla 5: parcial
    let par = false;
    if (usd * 10 > caja) { par = true; razones.push('El importe es más de una décima parte de la caja.'); }
    if (coste !== null && coste > 1 && coste <= 5) { par = true; razones.push('Vender cuesta entre el 1 % y el 5 % (' + pct(coste, 1) + ' %).'); }
    if (of.lenta && !(coste !== null && coste <= 1)) { par = true; razones.push('La única salida limpia es lenta (14 días).'); }
    if (top3Caja >= 0.8) { par = true; razones.push('Las 3 mayores cuentas reclaman el ' + pct(top3Caja * 100, 0) + ' % de la caja: una salida conjunta la agotaría (concentración de la foto del 13-nov).'); }
    if (poderes) { par = true; razones.push('El dueño del token puede congelarlo o pausarlo (se avisa aparte).'); }
    if (p && !p.nativo && !p.abiPublicado) { par = true; razones.push(p.proxy ? 'El token es un proxy actualizable: su ABI visible es el del proxy y no se sabe qué puede hacer su dueño.' : 'No se sabe qué puede hacer el dueño del token: no publica su ABI.'); }
    return { v: par ? 'parcial' : 'recuperable', razones: razones.length ? razones : ['Caja holgada, coste de venta ≤ 1 % y sin condiciones de concentración.'], ...base };
  }
  window.JLR = { LIMITE_EDAD_H, costeA, salidaA, oficial, poderesTexto, veredicto, pct, dolar };
})();
