'use strict';
// FASE 6 · CAPA DE VENTA: si JustLend te devuelve el token, ¿cuántos USDT sacas vendiéndolo en SUNSwap?
// Usa el motor del monitor de liquidez de SUNSwap (solo lectura; el mismo que se validó contra los contratos) sobre los 76 mercados de los 24 tokens de JustLend.
// Para cada token calcula: lo que se obtiene al vender toda la caja de su mercado de JustLend, lo que se obtiene con tamaños fijos (10 mil, 100 mil, 1 M, 10 M, 100 M$)
// y el techo (venta de hasta 5.000 M$ del token). Ni el tamaño de venta ni el precio los pone esta investigación: son los del motor sobre el estado de la cadena en el momento de leer.
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs');
const MON = 'C:/EquipoIA/web-publicador/liquidez-sunswap/'; const C = require(MON + 'curvas.cjs'); const { leerEstado } = require(MON + 'lector.cjs');
const M = JSON.parse(fs.readFileSync(__dirname + '/venta/mercados.json', 'utf8')).mercados; const T = JSON.parse(fs.readFileSync(__dirname + '/venta/tokens.json', 'utf8')).tokens;
const decs = new Map(); for (const m of M) { decs.set(m.token0, m.dec0); decs.set(m.token1, m.dec1); }
(async () => {
  const mk = require('./resultados/04-liquidez-por-mercado.json').mercados;
  const est = await leerEstado(M, { log: s => console.log(s) });
  const base = C.tamanosPorDefecto(80, 100, 5e9);
  const fijos = [1e4, 1e5, 1e6, 1e7, 1e8];
  const out = { leido: new Date().toISOString(), bloque: est.bloqueFin || est.bloqueInicio, fuente: 'motor del monitor de liquidez de SUNSwap (solo lectura) sobre ' + M.length + ' mercados', tokens: [] };
  for (const t of T) {
    const tok = { ...t, decimales: decs.get(t.direccion) ?? 6 };
    // primera pasada para conocer el precio de referencia del motor
    const p0 = C.perfil(tok, M, est, { tamanos: [1000], trozos: 32 }); const ref = p0.precioReferenciaUsdt;
    const mercadosJL = mk.filter(f => f.subyacente === t.direccion || (t.simbolo === 'WTRX' && f.simbolo === 'jTRX'));
    const extra = mercadosJL.map(f => f.caja * (ref || 0)).filter(v => v > 100);
    const tam = [...new Set([...base, ...fijos, ...extra])].sort((a, b) => a - b);
    const p = C.perfil(tok, M, est, { tamanos: tam, trozos: 32 });
    const en = x => { const pt = p.curva.find(c => Math.abs(c.usd - x) < 1e-6 * x + 1e-9); return pt ? { usd: pt.usd, salidaUsdt: pt.salidaUsdt, costePct: pt.costePct, ruta: pt.ruta } : null; };
    const techo = p.curva.filter(c => c.salidaUsdt != null).slice(-1)[0];
    out.tokens.push({
      simbolo: t.simbolo, direccion: t.direccion, precioReferenciaUsdt: ref, mercadosDirectos: p.mercadosDirectos, mercadosSalto1: p.mercadosSalto1, maximos: p.maximos,
      tamanosFijos: Object.fromEntries(fijos.map(f => [f, en(f)])), techo: techo ? { usd: techo.usd, salidaUsdt: techo.salidaUsdt, costePct: techo.costePct } : null,
      ventaDeLaCaja: mercadosJL.map(f => ({ jToken: f.jToken, simboloJ: f.simbolo, cajaTokens: f.caja, tamanoUsdAPrecioDelMotor: f.caja * (ref || 0), venta: ref ? en(f.caja * ref) : null })),
      curva: p.curva.map(c => ({ usd: c.usd, salidaUsdt: c.salidaUsdt, costePct: c.costePct, ruta: c.ruta })),
    });
    const v = out.tokens[out.tokens.length - 1]; console.log(t.simbolo.padEnd(11), 'ref', String(ref && ref.toPrecision(5)).padEnd(10), '| 100k$', v.tamanosFijos[1e5] ? v.tamanosFijos[1e5].costePct + '%' : '-', '| 1M$', v.tamanosFijos[1e6] ? v.tamanosFijos[1e6].costePct + '%' : '-', '| techo', v.techo ? Math.round(v.techo.salidaUsdt).toLocaleString('en') + ' USDT por ' + v.techo.usd.toExponential(1) + '$' : '-', '| caja entera:', v.ventaDeLaCaja.map(x => x.venta ? Math.round(x.venta.salidaUsdt).toLocaleString('en') + ' USDT de ' + Math.round(x.tamanoUsdAPrecioDelMotor).toLocaleString('en') + '$ (' + x.venta.costePct + '%)' : 'sin dato').join(' / '));
  }
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '11-venta.json'), out));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });
