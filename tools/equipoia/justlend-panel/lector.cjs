'use strict';
// LECTOR EN VIVO DE JUSTLEND (SOLO LECTURA, sin claves, sin enviar nada): lee de TronGrid, por lotes de eth_call, el estado ACTUAL de los 24 mercados (caja, deuda, reservas, depósitos,
// precio del oráculo, pausas, topes) y del gobierno (dueño, implementación, oráculo, guardián, Timelock, PSM de USDD). Es el mismo cálculo que la investigación del 13-nov-2026
// (guiones 01, 02, 04 y 30), pero en lotes para que la foto sea rápida (unos segundos). Una respuesta vacía o con error es un FALLO declarado, nunca un cero.
const { lote, llamada, wa, bloque } = require('C:/EquipoIA/web-publicador/liquidez-sunswap/lector.cjs');
const B58 = require('./b58.cjs');
const SEL = require('./selectores.json');
const CAT = require('./catalogo.json');
const s = (f) => SEL[f];
const W = (r, i = 0) => (r && r.ok && r.hex && r.hex.length >= (i + 1) * 64 ? r.hex.slice(i * 64, (i + 1) * 64) : null);
const num = (r, i = 0) => { const w = W(r, i); return w == null ? null : BigInt('0x' + w); };
const dir = (r, i = 0) => { const w = W(r, i); if (w == null || /^0+$/.test(w)) return null; return B58('41' + w.slice(24)); };
const bool = (r, i = 0) => { const n = num(r, i); return n == null ? null : n !== 0n; };

async function leer() {
  const G = CAT.gobierno, COMP = G.comptroller, TL = 'TRWNvb15NmfNKNLhQpxefFz7cNjrYjEw7x', USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
  const out = { errores: [], avisos: [] };
  out.bloqueIni = await bloque();
  // ---------- 1) gobierno y lista de mercados ----------
  const g = [
    ['lista', llamada(COMP, s('getAllMarkets()'))], ['admin', llamada(COMP, s('admin()'))], ['pendiente', llamada(COMP, s('pendingAdmin()'))], ['guardian', llamada(COMP, s('pauseGuardian()'))],
    ['impl', llamada(COMP, s('comptrollerImplementation()'))], ['oraculo', llamada(COMP, s('oracle()'))], ['closeFactor', llamada(COMP, s('closeFactorMantissa()'))],
    ['incentivo', llamada(COMP, s('liquidationIncentiveMantissa()'))], ['transferPausado', llamada(COMP, s('transferGuardianPaused()'))], ['seizePausado', llamada(COMP, s('seizeGuardianPaused()'))],
    ['timelockRetardo', llamada(TL, s('delay()'))], ['timelockAdmin', llamada(TL, s('admin()'))],
    ['psmUsdt', llamada(USDT, s('balanceOf(address)'), wa(CAT.psm.gemJoin))],
  ];
  const rg = await lote(g.map((x) => x[1])); const R = Object.fromEntries(g.map((x, i) => [x[0], rg[i]]));
  for (const [k, r] of Object.entries(R)) if (!r.ok) out.errores.push('gobierno.' + k + ': ' + (r.error || 'sin respuesta'));
  const nLista = num(R.lista, 1); const lista = [];
  if (R.lista.ok && nLista != null) for (let i = 0; i < Number(nLista); i++) lista.push(dir(R.lista, 2 + i));
  const oraculoProxy = dir(R.oraculo);
  const r2 = await lote([llamada(oraculoProxy || G.oraculo, s('v1PriceOracle()'))]); const oraculoV1 = dir(r2[0]);
  const r3 = oraculoV1 ? await lote([llamada(oraculoV1, s('poster()')), llamada(oraculoV1, s('anchorAdmin()'))]) : [{ ok: false }, { ok: false }];
  out.gobierno = {
    comptroller: COMP, admin: dir(R.admin), pendiente: dir(R.pendiente), guardian: dir(R.guardian), implementacion: dir(R.impl), oraculo: oraculoProxy, oraculoV1, poster: dir(r3[0]), anchorAdmin: dir(r3[1]),
    closeFactor: num(R.closeFactor) == null ? null : Number(num(R.closeFactor)) / 1e18, incentivo: num(R.incentivo) == null ? null : Number(num(R.incentivo)) / 1e18,
    transferPausado: bool(R.transferPausado), seizePausado: bool(R.seizePausado), timelockAdmin: dir(R.timelockAdmin), retardoTimelockSeg: num(R.timelockRetardo) == null ? null : Number(num(R.timelockRetardo)),
    mercadosListados: lista,
  };
  out.psm = { psm: CAT.psm.psm, gemJoin: CAT.psm.gemJoin, usdtEnPSM: num(R.psmUsdt) == null ? null : Number(num(R.psmUsdt)) / 1e6 };
  // ---------- 2) cada mercado ----------
  const mk = CAT.mercados; const subs = []; const idx = [];
  for (const m of mk) {
    const j = m.jToken, trx = m.simbolo === 'jTRX', a = wa(j);
    const base = subs.length;
    subs.push(llamada(j, s('getCash()')), llamada(j, s('totalBorrows()')), llamada(j, s('totalReserves()')), llamada(j, s('totalSupply()')), llamada(j, s('exchangeRateStored()')),
      llamada(j, s('admin()')), llamada(j, s('implementation()')), llamada(j, s('comptroller()')), llamada(j, s('interestRateModel()')),
      llamada(COMP, s('mintGuardianPaused(address)'), a), llamada(COMP, s('borrowGuardianPaused(address)'), a), llamada(COMP, s('borrowCaps(address)'), a), llamada(COMP, s('markets(address)'), a),
      llamada(oraculoProxy || G.oraculo, s('getUnderlyingPrice(address)'), a),
      trx ? { metodo: 'eth_getBalance', a: j } : llamada(m.tokenDir, s('balanceOf(address)'), a));
    idx.push(base);
  }
  const rs = await lote(subs);
  out.mercados = mk.map((m, i) => {
    const b = idx[i], r = (k) => rs[b + k]; const fallos = [];
    const core = { cash: r(0), borrows: r(1), reserves: r(2), supply: r(3), exch: r(4) };
    for (const [k, x] of Object.entries(core)) if (!x.ok || W(x) == null) fallos.push(k);
    const precio = r(13); if (!precio.ok || W(precio) == null) fallos.push('precio');
    const real = r(14); const cajaReal = !real.ok ? null : (m.simbolo === 'jTRX' ? BigInt('0x' + (real.hex || '0')) : num(real));
    if (cajaReal == null) fallos.push('cajaReal');
    const mkt = r(12);
    return {
      jToken: m.jToken, simbolo: m.simbolo, fallos,
      cashRaw: num(core.cash), borrowsRaw: num(core.borrows), reservesRaw: num(core.reserves), supplyRaw: num(core.supply), exchRaw: num(core.exch), precioRaw: num(precio), cajaRealRaw: cajaReal,
      admin: dir(r(5)), implementacion: dir(r(6)), comptroller: dir(r(7)), modeloTipos: dir(r(8)),
      mintPausado: bool(r(9)), borrowPausado: bool(r(10)), topeRaw: num(r(11)), listado: mkt.ok ? bool(mkt, 0) : null, factorGarantiaRaw: mkt.ok ? num(mkt, 1) : null,
    };
  });
  for (const m of out.mercados) if (m.fallos.length) out.errores.push(m.simbolo + ': faltan ' + m.fallos.join(', '));
  out.bloqueFin = await bloque();
  return out;
}
module.exports = { leer };
if (require.main === module) leer().then((o) => { console.log(JSON.stringify({ bloqueIni: o.bloqueIni, bloqueFin: o.bloqueFin, errores: o.errores, gobierno: o.gobierno, psm: o.psm, n: o.mercados.length }, (k, v) => typeof v === 'bigint' ? String(v) : v, 1).slice(0, 3500)); }).catch((e) => { console.error('ERROR', e.stack || e.message); process.exit(1); });
