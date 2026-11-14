'use strict';
// FASE 6b · De la curva del motor a una CIFRA SEGURA de «USDT que se pueden obtener».
// Regla: vender más nunca da menos USDT que vender una parte (se puede vender la parte y quedarse el resto). Por eso la cifra segura es la ENVOLVENTE:
// el máximo de USDT medido en cualquier tamaño igual o menor. Los puntos en que el motor marca «no cabe» (coste 100 %) no cuentan como medida.
// «Tamaño medido más grande» = hasta dónde el motor ve liquidez; más allá no se afirma nada (puede haber más, pero esta investigación no lo mide).
const path = require('node:path'); const L = require('./lib.cjs');
const v = require('./resultados/11-venta.json'), mk = require('./resultados/04-liquidez-por-mercado.json').mercados;
const envolvente = curva => { let mx = 0, tam = 0; const pts = []; for (const c of curva) { if (c.salidaUsdt != null && c.costePct != null && c.costePct < 99.999 && c.salidaUsdt > mx) { mx = c.salidaUsdt; tam = c.usd; } pts.push({ usd: c.usd, salidaSegura: mx }); } return { maximoUsdt: mx, tamanoDelMaximoUsd: tam, pts }; };
const usarEn = (env, usd) => { let r = 0; for (const p of env.pts) { if (p.usd <= usd * (1 + 1e-9)) r = p.salidaSegura; else break; } return r; };
const filas = [];
for (const f of mk) {
  const sim = f.simbolo === 'jTRX' ? 'WTRX' : null; let t = v.tokens.find(x => x.direccion === f.subyacente) || v.tokens.find(x => x.simbolo === sim);
  if (f.simbolo === 'jUSDT') { filas.push({ jToken: f.jToken, simbolo: f.simbolo, subyacente: 'USDT', cajaUSD: f.cajaUSD, reclamoUSD: f.reclamoUSD, esSalida: true, usdtObtenibles: f.cajaUSD, parteDeLaCaja: 1, nota: 'ya es USDT: no hay que venderlo' }); continue; }
  if (!t || !t.precioReferenciaUsdt) { filas.push({ jToken: f.jToken, simbolo: f.simbolo, subyacente: f.simboloSubyacente, cajaUSD: f.cajaUSD, reclamoUSD: f.reclamoUSD, usdtObtenibles: null, parteDeLaCaja: null, nota: 'sin mercado de venta con USDT/TRX en SUNSwap' }); continue; }
  const env = envolvente(t.curva); const tamCaja = f.caja * t.precioReferenciaUsdt; const obt = usarEn(env, tamCaja);
  filas.push({ jToken: f.jToken, simbolo: f.simbolo, subyacente: f.simboloSubyacente, cajaUSD: f.cajaUSD, reclamoUSD: f.reclamoUSD, tamanoCajaAPrecioDelMotor: tamCaja, usdtObtenibles: obt, parteDeLaCaja: obt / f.cajaUSD, maximoMedidoUsdt: env.maximoUsdt, tamanoMedidoMasGrandeUsd: env.tamanoDelMaximoUsd, costeA1M: (t.tamanosFijos['1000000'] || {}).costePct ?? null, costeA100k: (t.tamanosFijos['100000'] || {}).costePct ?? null, maxCoste05: t.maximos['0.5'] ?? null, maxCoste1: t.maximos['1'] ?? null, maxCoste5: t.maximos['5'] ?? null, nota: null });
}
console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '12-venta-cota.json'), { generado: new Date().toISOString(), nota: 'usdtObtenibles = cota segura (envolvente) de USDT por vender TODA la caja del mercado en SUNSwap, con el estado de la cadena de resultados/11', mercados: filas }));
const f$ = n => n == null ? '   -   ' : n >= 1e6 ? (n / 1e6).toFixed(2) + ' M$' : n >= 1e3 ? (n / 1e3).toFixed(1) + ' k$' : n.toFixed(0) + ' $';
let tc = 0, to = 0; for (const x of filas.sort((a, b) => b.cajaUSD - a.cajaUSD)) { tc += x.cajaUSD; to += x.usdtObtenibles || 0; console.log(x.simbolo.padEnd(9), x.subyacente.padEnd(8), 'caja', f$(x.cajaUSD).padStart(10), '| USDT obtenibles', f$(x.usdtObtenibles).padStart(10), '|', x.parteDeLaCaja == null ? 'sin mercado' : (x.parteDeLaCaja * 100).toFixed(2).padStart(7) + '% de la caja', '| 100k$:', x.costeA100k == null ? '-' : x.costeA100k + '%', '| 1M$:', x.costeA1M == null ? '-' : x.costeA1M + '%', '| tope ≤1%:', f$(x.maxCoste1)); }
console.log('TOTAL caja', f$(tc), '| USDT obtenibles (cota segura)', f$(to), '=>', (to / tc * 100).toFixed(2) + '%');
