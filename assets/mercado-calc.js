/* Cálculos del Observatorio de mercado. Funciones puras: reciben series de cierres diarios (números; null donde no hay dato) y devuelven números o null.
   Nunca inventan: si no hay datos suficientes devuelven null y la página escribe «sin dato».
   Definiciones (las mismas que explica la página):
   - Rendimiento a n días: cierre de hoy / cierre de hace n días − 1.
   - Rendimiento diario logarítmico: ln(cierre de un día / cierre del día anterior), solo entre dos días seguidos con dato.
   - Volatilidad realizada a n días: desviación típica (muestral, n−1) de los últimos n rendimientos diarios × raíz de 365, en %.
   - Percentil de volatilidad: qué parte de las volatilidades a n días de toda la historia disponible es menor o igual que la de hoy.
   - Correlación a n días: Pearson entre los rendimientos diarios de dos activos en los últimos n días en que ambos tienen dato.
   - Sensibilidad (beta) a n días: covarianza con el activo de referencia / varianza del de referencia, en esos mismos días.
   - Cambio a n días de una serie diaria (dinero depositado, stablecoins): último dato / dato de n posiciones antes − 1.
   - Mediana: el valor central de los que tienen dato (con un número par, la media de los dos centrales).
   - Rendimiento de un grupo (sector): la mediana de los rendimientos de sus activos; con menos de tres activos con dato no hay cifra.
   - Camino de un grupo: esa misma mediana calculada cada día del periodo, contando desde el primer día.
   Vale en el navegador (window.MCALC) y en Node (module.exports), para poder probarlo. */
(function (raiz) {
  const num = (x) => typeof x === 'number' && isFinite(x);
  const ultimo = (c) => { for (let i = c.length - 1; i >= 0; i--) if (num(c[i])) return i; return -1; };
  function rend(c, n) { const i = ultimo(c); if (i < 0 || i - n < 0 || !num(c[i - n]) || c[i - n] <= 0) return null; return c[i] / c[i - n] - 1; }
  function retornos(c) { const r = new Array(c.length).fill(null); for (let i = 1; i < c.length; i++) if (num(c[i]) && num(c[i - 1]) && c[i] > 0 && c[i - 1] > 0) r[i] = Math.log(c[i] / c[i - 1]); return r; }
  function media(a) { let s = 0; for (const x of a) s += x; return s / a.length; }
  function desv(a) { if (a.length < 2) return null; const m = media(a); let s = 0; for (const x of a) s += (x - m) * (x - m); return Math.sqrt(s / (a.length - 1)); }
  // volatilidad con los n rendimientos que terminan en la posición «fin» (por defecto, el último día con dato); exige los n completos
  function volEn(r, n, fin) { if (fin - n + 1 < 1) return null; const v = []; for (let i = fin - n + 1; i <= fin; i++) { if (!num(r[i])) return null; v.push(r[i]); } const d = desv(v); return d == null ? null : d * Math.sqrt(365) * 100; }
  function vol(c, n) { const r = retornos(c); const i = ultimo(c); return i < 0 ? null : volEn(r, n, i); }
  function serieVol(c, n) { const r = retornos(c); const s = new Array(c.length).fill(null); for (let i = n; i < c.length; i++) s[i] = volEn(r, n, i); return s; }
  // percentil (0–100) del último valor dentro de su propia serie; exige al menos «minimo» valores
  function percentil(serie, minimo) { const v = serie.filter(num); if (v.length < (minimo || 60)) return null; const hoy = v[v.length - 1]; let k = 0; for (const x of v) if (x <= hoy) k++; return (k / v.length) * 100; }
  function estadoVol(p) { if (!num(p)) return null; return p >= 95 ? 'extremo' : p >= 75 ? 'agitado' : p >= 25 ? 'normal' : 'calma'; }
  // pares de rendimientos de los últimos n días en que los dos tienen dato; «salto» desplaza la ventana hacia atrás (para comparar con la anterior)
  function pares(a, b, n, salto) { const ra = retornos(a), rb = retornos(b); const fin = Math.min(ultimo(a), ultimo(b)) - (salto || 0); const x = [], y = []; for (let i = fin; i >= 1 && x.length < n; i--) if (num(ra[i]) && num(rb[i])) { x.push(ra[i]); y.push(rb[i]); } return x.length === n ? [x, y] : null; }
  function corr(a, b, n, salto) { const p = pares(a, b, n, salto); if (!p) return null; const [x, y] = p; const mx = media(x), my = media(y); let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) * (x[i] - mx); syy += (y[i] - my) * (y[i] - my); } if (!(sxx > 0) || !(syy > 0)) return null; return sxy / Math.sqrt(sxx * syy); }
  function beta(a, ref, n) { const p = pares(a, ref, n); if (!p) return null; const [x, y] = p; const mx = media(x), my = media(y); let sxy = 0, syy = 0; for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); syy += (y[i] - my) * (y[i] - my); } return syy > 0 ? sxy / syy : null; }
  function caidaDesdeMaximo(c, n) { const i = ultimo(c); if (i < 0) return null; let mx = null; for (let k = Math.max(0, i - n + 1); k <= i; k++) if (num(c[k]) && (mx == null || c[k] > mx)) mx = c[k]; return mx ? c[i] / mx - 1 : null; }
  // profundidad de un libro de órdenes a ±pct del precio medio: dinero esperando a cada lado y desequilibrio (−1 todo ventas … +1 todo compras)
  function profundidad(bids, asks, pct) { if (!bids || !asks || !bids.length || !asks.length) return null; const mb = Number(bids[0][0]), ma = Number(asks[0][0]); if (!(mb > 0) || !(ma > 0) || ma < mb) return null; const medio = (mb + ma) / 2, lo = medio * (1 - pct), hi = medio * (1 + pct); let c = 0, v = 0; for (const [p, q] of bids) { const P = Number(p); if (P < lo) break; c += P * Number(q); } for (const [p, q] of asks) { const P = Number(p); if (P > hi) break; v += P * Number(q); } const cubreC = Number(bids[bids.length - 1][0]) <= lo, cubreV = Number(asks[asks.length - 1][0]) >= hi; return { medio, diferencialPct: (ma - mb) / medio * 100, compras: c, ventas: v, desequilibrio: c + v > 0 ? (c - v) / (c + v) : null, completo: cubreC && cubreV }; }
  // último dato de una serie y el de n posiciones antes: { hoy, antes, i } o null si falta alguno de los dos
  function atras(c, n) { const i = ultimo(c); if (i < 0 || i - n < 0 || !num(c[i - n])) return null; return { hoy: c[i], antes: c[i - n], i }; }
  function cambio(c, n) { const a = atras(c, n); return a && a.antes > 0 ? a.hoy / a.antes - 1 : null; }
  function mediana(a) { const v = (a || []).filter(num).sort((x, y) => x - y); if (!v.length) return null; const m = v.length >> 1; return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; }
  // resumen de un grupo de rendimientos: cuántos tienen dato, cuántos suben, mediana; null si hay menos de «minimo» con dato (3 por defecto)
  function grupo(rends, minimo) { const v = (rends || []).filter(num); if (v.length < (minimo == null ? 3 : minimo)) return null; return { n: v.length, suben: v.filter((x) => x >= 0).length, mediana: mediana(v) }; }
  // camino de un grupo en los últimos n días: para cada día, la mediana de lo que lleva ganado o perdido cada activo desde hace n días.
  // Cada serie se cuenta desde su propio último dato; solo entran las que tienen dato hace n días. El último valor coincide con grupo(rendimientos a n días).
  function caminoGrupo(series, n, minimo) { const base = []; for (const c of series || []) { const i = ultimo(c); if (i >= 0 && i - n >= 0 && num(c[i - n]) && c[i - n] > 0) base.push([c, i]); } const y = []; for (let k = n; k >= 0; k--) { const v = []; for (const [c, i] of base) if (num(c[i - k])) v.push(c[i - k] / c[i - n] - 1); y.push(v.length >= (minimo == null ? 3 : minimo) ? mediana(v) : null); } return y; }
  const M = { atras, cambio, mediana, grupo, caminoGrupo, rend, retornos, desv, vol, serieVol, percentil, estadoVol, corr, beta, caidaDesdeMaximo, profundidad, ultimo };
  if (typeof module !== 'undefined' && module.exports) module.exports = M; else raiz.MCALC = M;
})(typeof window !== 'undefined' ? window : globalThis);
