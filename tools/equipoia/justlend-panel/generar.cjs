'use strict';
// GENERADOR DEL PANEL «¿PUEDO RECUPERAR MI DINERO DE JUSTLEND?» (solo lectura). Une tres cosas y escribe data/justlend-panel.json:
//   1) la lectura EN VIVO de los 24 mercados y del gobierno (lector.cjs: caja, deuda, precios, pausas, dueños, PSM de USDD),
//   2) las curvas de venta por USDT en sun.io de los 23 tokens (el mismo motor del monitor de liquidez, validado contra los contratos),
//   3) la parte FIJA de la investigación del 13-nov-2026 (catalogo.json: poderes de cada emisor y concentración de titulares) y la referencia de gobierno (base-gobierno.json).
// Se niega a escribir si falta algo esencial (lectura con fallos, mercado sin datos, caja que no coincide con el saldo real, motor con errores). Uso: node generar.cjs <salida.json> [--sin-venta]
const fs = require('node:fs'), path = require('node:path');
const CAT = require('./catalogo.json'), BASE = require(process.env.JL_BASE_GOB || './base-gobierno.json');   // JL_BASE_GOB: solo para pruebas (referencia de gobierno alternativa)
const { leer } = require('./lector.cjs');
const MON = 'C:/EquipoIA/web-publicador/liquidez-sunswap/'; const C = require(MON + 'curvas.cjs'); const { leerEstado } = require(MON + 'lector.cjs');
const SALIDA = process.argv[2]; if (!SALIDA || SALIDA.startsWith('--')) { console.error('Uso: node generar.cjs <salida.json> [--sin-venta]'); process.exit(1); }
const SIN_VENTA = process.argv.includes('--sin-venta');
const MM = JSON.parse(fs.readFileSync(path.join(__dirname, 'mercados.json'), 'utf8')).mercados, TT = JSON.parse(fs.readFileSync(path.join(__dirname, 'tokens.json'), 'utf8')).tokens;
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', WTRX = 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR', CEROS = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb';
const r = (x, d = 0) => (x == null || !isFinite(x) ? null : Math.round(x * 10 ** d) / 10 ** d);
const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));
const iguales = (a, b) => (a || null) === (b || null) || ((a === CEROS || a == null) && (b === CEROS || b == null));

async function precioTRX() {
  for (let i = 0; i < 3; i++) {
    try { const x = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=TRXUSDT', { signal: AbortSignal.timeout(15000) }); const j = await x.json(); const p = Number(j.price); if (p > 0 && p < 10) return p; } catch (e) { /* reintento */ }
    await dormir(1500 * (i + 1));
  }
  return null;
}
// coste (%) y salida (USDT) de vender `usd` según la curva [[usd, coste, salida], …] (interpolación en el logaritmo del tamaño)
function aCurva(c, usd) { if (!c || !c.length) return null; if (usd <= c[0][0]) return { coste: c[0][1], salida: c[0][2] * usd / c[0][0] }; for (let i = 1; i < c.length; i++) { if (usd <= c[i][0]) { const a = c[i - 1], b = c[i]; const t = (Math.log(usd) - Math.log(a[0])) / (Math.log(b[0]) - Math.log(a[0])); return { coste: a[1] + (b[1] - a[1]) * t, salida: a[2] + (b[2] - a[2]) * t }; } } return null; }

(async () => {
  const t0 = Date.now(); const errores = [], avisos = [];
  // ---------- 1) lectura en vivo ----------
  const L = await leer(); errores.push(...L.errores);
  const trxBinance = await precioTRX();
  // ---------- 2) motor de venta (23 tokens) ----------
  let venta = null, refWTRX = null;
  if (!SIN_VENTA) {
    const decs = new Map(); for (const m of MM) { decs.set(m.token0, m.dec0); decs.set(m.token1, m.dec1); }
    const est = await leerEstado(MM, { log: () => {} });
    if (est.errores && est.errores.length) errores.push('motor de venta: ' + est.errores.length + ' errores de lectura de sun.io');
    const base = C.tamanosPorDefecto(80, 100, 5e9), fijos = [1e4, 1e5, 1e6, 1e7, 1e8];
    const cajaTok = new Map(); for (const m of L.mercados) { const cm = CAT.mercados.find((x) => x.jToken === m.jToken); const dec = m.simbolo === 'jTRX' ? 6 : cm.decimales; const k = m.simbolo === 'jTRX' ? WTRX : cm.tokenDir; cajaTok.set(k, (cajaTok.get(k) || []).concat([Number(m.cashRaw) / 10 ** dec])); }
    venta = { bloque: est.bloqueFin || est.bloqueInicio, tokens: {} };
    for (const t of TT) {
      const tok = { ...t, decimales: decs.get(t.direccion) ?? 6 };
      try {
        const p0 = C.perfil(tok, MM, est, { tamanos: [1000], trozos: 32 }); const ref = p0.precioReferenciaUsdt;
        if (t.direccion === WTRX) refWTRX = ref;
        const extra = (cajaTok.get(t.direccion) || []).map((c) => c * (ref || 0)).filter((v) => v > 100);
        const tam = [...new Set([...base, ...fijos, ...extra])].sort((a, b) => a - b);
        const p = C.perfil(tok, MM, est, { tamanos: tam, trozos: 32 });
        venta.tokens[t.direccion] = { simbolo: t.simbolo, ref: ref, directos: p.mercadosDirectos, salto1: p.mercadosSalto1, curva: p.curva.filter((c) => c.salidaUsdt != null && c.costePct != null).map((c) => [r(c.usd, 0), r(c.costePct, 3), r(c.salidaUsdt, 0)]) };
      } catch (e) { errores.push('motor de venta ' + t.simbolo + ': ' + e.message); }
    }
  }
  const trxUsd = trxBinance || refWTRX; const fuenteTRX = trxBinance ? 'Binance spot TRXUSDT' : (refWTRX ? 'precio de WTRX en sun.io (Binance no respondió)' : null);
  if (!trxUsd) errores.push('no hay precio de TRX en dólares (ni Binance ni sun.io)');
  if (!trxBinance && trxUsd) avisos.push('Binance no respondió: el precio de TRX sale de sun.io');
  // ---------- 3) montaje ----------
  const mercados = []; const cambios = []; let nCuadre = 0;
  for (const m of L.mercados) {
    const cm = CAT.mercados.find((x) => x.jToken === m.jToken); const trx = m.simbolo === 'jTRX'; const dec = trx ? 6 : cm.decimales, dv = 10 ** dec;
    if (m.fallos.length) continue;
    const reclamoRaw = m.supplyRaw * m.exchRaw / (10n ** 18n);
    const caja = Number(m.cashRaw) / dv, prest = Number(m.borrowsRaw) / dv, res = Number(m.reservesRaw) / dv, reclamo = Number(reclamoRaw) / dv, real = Number(m.cajaRealRaw) / dv;
    const precioTRXm = Number(m.precioRaw) / 10 ** (33 - dec); const precioUSD = trxUsd ? precioTRXm * trxUsd : null;
    const cuadre = reclamo > 0 ? (caja + prest - res - reclamo) / reclamo : 0; if (Math.abs(cuadre) > 0.02) { nCuadre++; avisos.push(m.simbolo + ': caja + deuda − reservas se desvía un ' + r(cuadre * 100, 2) + ' % del reclamo'); }
    const dif = caja > 0 ? (real - caja) / caja : (real > 0 ? 1 : 0);
    if (Math.abs(dif) > 0.10) errores.push(m.simbolo + ': la caja declarada no coincide con el saldo real del token (' + r(dif * 100, 2) + ' %)'); else if (Math.abs(dif) > 0.01) avisos.push(m.simbolo + ': la caja declarada difiere un ' + r(dif * 100, 2) + ' % del saldo real (los dos se leyeron con segundos de diferencia)');
    const abierto = !(m.mintPausado && m.borrowPausado);
    if (abierto !== cm.abierto) cambios.push({ donde: m.simbolo, campo: 'estado del mercado', antes: cm.abierto ? 'abierto' : 'cerrado a nuevos depósitos y préstamos', ahora: abierto ? 'abierto' : 'cerrado a nuevos depósitos y préstamos' });
    const claveV = trx ? WTRX : cm.tokenDir; const v = venta && venta.tokens[claveV]; const esUSDT = cm.tokenDir === USDT;
    let ventaM = null;
    if (esUSDT) ventaM = { esUSDT: true };
    else if (v) {
      // «USDT obtenibles» = cifra SEGURA de la investigación (fase 6b): la envolvente, es decir, el máximo de USDT medido en cualquier tamaño igual o menor que la caja
      // (vender más nunca da menos que vender una parte); los puntos en que el motor marca «no cabe» no cuentan. Más allá del mayor tamaño medido no se afirma nada.
      const x = caja * (v.ref || 0); const sin = !v.curva.length; let env = 0; if (v.ref && x > 0) for (const p of v.curva) { if (p[0] <= x * (1 + 1e-9) && p[1] < 99.999 && p[2] > env) env = p[2]; }
      const a = v.ref && x > 0 ? aCurva(v.curva, x) : null;
      ventaM = { simboloMotor: v.simbolo, ref: r(v.ref, 6), sinMercado: sin, usdtObtenibles: sin || !v.ref ? null : r(env, 0), costeCaja: a ? r(a.coste, 3) : null, curva: v.curva };
    }
    mercados.push({
      jToken: m.jToken, simbolo: m.simbolo, token: cm.token, tokenDir: cm.tokenDir, decimales: dec, abierto, caja: r(caja, 6), cajaUSD: precioUSD ? r(caja * precioUSD, 2) : null, reclamo: r(reclamo, 6), reclamoUSD: precioUSD ? r(reclamo * precioUSD, 2) : null,
      prestado: r(prest, 6), prestadoUSD: precioUSD ? r(prest * precioUSD, 2) : null, reservas: r(res, 6), utilizacion: reclamo > 0 ? r(prest / reclamo, 4) : null, cobertura: reclamo > 0 ? r(Math.min(1, caja / reclamo), 4) : null,
      precioUSD: precioUSD ? r(precioUSD, 10) : null, factorGarantia: m.factorGarantiaRaw == null ? null : r(Number(m.factorGarantiaRaw) / 1e18, 4), tope: m.topeRaw && m.topeRaw > 0n ? r(Number(m.topeRaw) / dv, 2) : null,
      pausas: { mint: m.mintPausado, borrow: m.borrowPausado }, cajaReal: r(real, 6), difCajaReal: r(dif, 6), cuadre: r(cuadre, 6), admin: m.admin, implementacion: m.implementacion, modeloTipos: m.modeloTipos, venta: ventaM,
    });
    const b = BASE.mercados[m.jToken];
    if (b) { for (const [k, nombre] of [['admin', 'dueño del mercado'], ['implementacion', 'implementación del mercado'], ['modeloTipos', 'modelo de tipos de interés'], ['comptroller', 'Comptroller del mercado']]) if (!iguales(b[k], m[k])) cambios.push({ donde: m.simbolo, campo: nombre, antes: b[k] || null, ahora: m[k] || null }); }
    else avisos.push(m.simbolo + ': no está en la referencia de gobierno');
  }
  // gobierno: comparación con la referencia del 13-nov
  const G = L.gobierno, B = BASE.comp;
  for (const [k, kb, nombre] of [['admin', 'admin', 'dueño del Comptroller'], ['pendiente', 'pendingAdmin', 'dueño pendiente del Comptroller'], ['guardian', 'pauseGuardian', 'guardián de pausas'], ['implementacion', 'implementacion', 'implementación del Comptroller'], ['oraculo', 'oraculo', 'oráculo de precios']])
    if (!iguales(G[k], B[kb])) cambios.push({ donde: 'Comptroller', campo: nombre, antes: B[kb] || null, ahora: G[k] || null });
  if (G.oraculoV1 !== CAT.gobierno.oraculoV1) cambios.push({ donde: 'Oráculo', campo: 'oráculo v1 que publica los precios', antes: CAT.gobierno.oraculoV1, ahora: G.oraculoV1 });
  if (G.poster !== CAT.gobierno.poster) cambios.push({ donde: 'Oráculo', campo: 'cuenta que publica los precios', antes: CAT.gobierno.poster, ahora: G.poster });
  if (G.anchorAdmin !== CAT.gobierno.anchorAdmin) cambios.push({ donde: 'Oráculo', campo: 'administrador de los anclajes de precio', antes: CAT.gobierno.anchorAdmin, ahora: G.anchorAdmin });
  if (G.timelockAdmin !== BASE.timelock.admin) cambios.push({ donde: 'Timelock', campo: 'administrador del Timelock', antes: BASE.timelock.admin, ahora: G.timelockAdmin });
  if (G.retardoTimelockSeg !== BASE.timelock.retardoSeg) cambios.push({ donde: 'Timelock', campo: 'plazo de aviso (segundos)', antes: BASE.timelock.retardoSeg, ahora: G.retardoTimelockSeg });
  if (G.closeFactor !== Number(B.closeFactorRaw) / 1e18) cambios.push({ donde: 'Comptroller', campo: 'porcentaje liquidable por operación', antes: Number(B.closeFactorRaw) / 1e18, ahora: G.closeFactor });
  if (G.incentivo !== Number(B.incentivoLiquidacionRaw) / 1e18) cambios.push({ donde: 'Comptroller', campo: 'incentivo de liquidación', antes: Number(B.incentivoLiquidacionRaw) / 1e18, ahora: G.incentivo });
  if (G.transferPausado || G.seizePausado) cambios.push({ donde: 'Comptroller', campo: 'pausa global', antes: 'sin pausa', ahora: (G.transferPausado ? 'transferencias pausadas ' : '') + (G.seizePausado ? 'embargos pausados' : '') });
  const conocidos = new Set(CAT.mercados.map((x) => x.jToken)); const nuevos = G.mercadosListados.filter((j) => !conocidos.has(j)), quitados = [...conocidos].filter((j) => !G.mercadosListados.includes(j));
  for (const j of nuevos) cambios.push({ donde: 'Lista de mercados', campo: 'mercado nuevo sin analizar', antes: null, ahora: j });
  for (const j of quitados) cambios.push({ donde: 'Lista de mercados', campo: 'mercado que ya no figura', antes: j, ahora: null });
  if (G.mercadosListados.length !== 24 && !nuevos.length && !quitados.length) errores.push('la lista de mercados no tiene 24 elementos');
  if (mercados.length !== CAT.mercados.length) errores.push('solo ' + mercados.length + ' de ' + CAT.mercados.length + ' mercados completos');
  if (venta && Object.keys(venta.tokens).length !== TT.length) errores.push('el motor de venta solo trajo ' + Object.keys(venta.tokens).length + ' de ' + TT.length + ' tokens');
  const tot = { cajaUSD: 0, reclamoUSD: 0, prestadoUSD: 0, vendibleUSD: 0 };
  for (const m of mercados) { tot.cajaUSD += m.cajaUSD || 0; tot.reclamoUSD += m.reclamoUSD || 0; tot.prestadoUSD += m.prestadoUSD || 0; if (m.venta) tot.vendibleUSD += m.venta.esUSDT ? (m.cajaUSD || 0) : (m.venta.usdtObtenibles || 0); }
  for (const k of Object.keys(tot)) tot[k] = r(tot[k], 0);
  const out = {
    version: 1, generado: new Date().toISOString(), ok: errores.length === 0, segundos: Math.round((Date.now() - t0) / 1000),
    bloque: L.bloqueFin, bloqueInicial: L.bloqueIni, trxUsd: r(trxUsd, 6), fuentePrecioTRX: fuenteTRX,
    lecturas: { mercados: { desde: L.bloqueIni, hasta: L.bloqueFin }, venta: venta ? { bloque: venta.bloque } : null },
    referencia: { fecha: CAT.fecha, informe: CAT.informe, huella: CAT.huellaInforme, nota: 'Poderes del emisor, concentración de titulares y gobierno de referencia: foto de la investigación del 13-nov-2026; no se releen cada hora.' },
    gobierno: G, cambios, psm: { ...L.psm, usdtEnPSMreferencia: CAT.psm.usdtEnPSMfoto }, totales: tot, mercados,
    poderes: Object.fromEntries(CAT.mercados.map((m) => [m.jToken, { poderes: m.poderes, parteTop3: m.parteTop3, reclamoUSDfoto: m.reclamoUSDfoto }])),
    avisos, errores,
  };
  if (errores.length) { console.error('NO SE ESCRIBE. Errores:\n - ' + errores.join('\n - ')); process.exit(2); }
  fs.writeFileSync(SALIDA, JSON.stringify(out));
  console.log('escrito', SALIDA, fs.statSync(SALIDA).size, 'bytes en', out.segundos, 's | bloque', out.bloque.n, '| caja', tot.cajaUSD, '| vendible', tot.vendibleUSD, '| TRX/USD', out.trxUsd, '|', cambios.length, 'cambios de gobierno,', avisos.length, 'avisos');
  for (const a of avisos) console.log(' aviso:', a); for (const c of cambios) console.log(' CAMBIO:', JSON.stringify(c));
})().catch((e) => { console.error('ERROR', e.stack || e.message); process.exit(1); });
