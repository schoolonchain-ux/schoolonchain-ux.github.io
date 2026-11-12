/* Interpolación de la curva coste–tamaño para el importe que escribe el usuario. UMD: lo usa la página (window.LIQ) y las pruebas (require).
   La curva trae el coste (%) de vender cada tamaño de la cuadrícula; entre dos puntos se interpola de forma lineal en el logaritmo del tamaño. En la prueba (138 tamaños fuera de la cuadrícula,
   probar-interpolacion.cjs) la diferencia máxima con el cálculo exacto fue de 0,013 puntos porcentuales con costes de hasta el 5 % y de 0,37 con un coste del 60 %. Si el tamaño pedido cae entre un punto que cabe y uno que no, se dice que no cabe entero (no se inventa un coste). */
(function (raiz, fabrica) { if (typeof module === 'object' && module.exports) module.exports = fabrica(); else raiz.LIQ = fabrica(); })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const cabe = (p) => p && p.ruta != null && p.salidaUsdt != null;
  // devuelve { estado: 'ok'|'no-cabe'|'fuera', costePct, salidaUsdt, ruta, partes, desde, hasta }
  function evaluar(curva, usd) {
    if (!curva || !curva.length || !(usd > 0)) return { estado: 'fuera' };
    const a0 = curva[0], zN = curva[curva.length - 1];
    if (usd < a0.usd) return { estado: 'fuera', motivo: 'por debajo de ' + a0.usd };
    if (usd > zN.usd) return { estado: 'fuera', motivo: 'por encima de ' + zN.usd };
    for (let i = 0; i < curva.length; i++) { if (curva[i].usd === usd) { const p = curva[i]; return cabe(p) ? { estado: 'ok', costePct: p.costePct, salidaUsdt: p.salidaUsdt, ruta: p.ruta, partes: p.partes, exacto: true } : { estado: 'no-cabe', desde: i > 0 ? curva[i - 1].usd : null, hasta: p.usd }; } }
    let i = 0; while (i < curva.length - 1 && curva[i + 1].usd < usd) i++;
    const a = curva[i], b = curva[i + 1];
    if (!cabe(a)) return { estado: 'no-cabe', desde: null, hasta: b.usd };
    if (!cabe(b)) return { estado: 'no-cabe', desde: a.usd, hasta: b.usd };
    const t = (Math.log(usd) - Math.log(a.usd)) / (Math.log(b.usd) - Math.log(a.usd));
    const coste = a.costePct + t * (b.costePct - a.costePct);
    const mas = t < 0.5 ? a : b;
    return { estado: 'ok', costePct: coste, salidaUsdt: usd * (1 - coste / 100), ruta: mas.ruta, partes: mas.partes, exacto: false };
  }
  // semáforo: verde ≤ verde %, ámbar ≤ ambar %, rojo si más o si no cabe
  function semaforo(ev, verde, ambar) { if (!ev || ev.estado !== 'ok') return 'rojo'; return ev.costePct <= verde ? 'verde' : ev.costePct <= ambar ? 'ambar' : 'rojo'; }
  return { evaluar, semaforo, cabe };
});
