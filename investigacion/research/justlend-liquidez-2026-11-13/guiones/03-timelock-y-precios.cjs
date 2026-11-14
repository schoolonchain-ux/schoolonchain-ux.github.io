'use strict';
// FASE 2b · Plazo del Timelock + naturaleza del guardián de pausas + precios de referencia externos (para contrastar el oráculo de JustLend).
const L = require('./lib.cjs'); L.usar('03-2026-11-13'); const A = require('./abi.cjs'); const path = require('node:path');
const TL = 'TRWNvb15NmfNKNLhQpxefFz7cNjrYjEw7x', GUARD = 'TLntW9Z59LYY5KEi9cmwk3PKjQga828ird';
(async () => {
  const num = async (c, f) => { const r = await A.llamar(c, f); return r.ok ? A.u(r.hex) : null; };
  const dir = async (c, f) => { const r = await A.llamar(c, f); return r.ok ? A.dirDe(r.hex) : null; };
  const tl = { admin: await dir(TL, 'admin()'), pendingAdmin: await dir(TL, 'pendingAdmin()'), delaySeg: String(await num(TL, 'delay()')), graciaSeg: String(await num(TL, 'GRACE_PERIOD()')), minDelaySeg: String(await num(TL, 'MINIMUM_DELAY()')), maxDelaySeg: String(await num(TL, 'MAXIMUM_DELAY()')) };
  console.log('Timelock', JSON.stringify(tl), '=> plazo horas', Number(tl.delaySeg) / 3600);
  const g = await L.post('https://api.trongrid.io/wallet/getcontract', { value: GUARD, visible: true }); tl.guardianEsContrato = !!(g && (g.bytecode || g.contract_address)); tl.guardianNombre = g && g.name || null;
  const ga = await L.get('https://api.trongrid.io/v1/accounts/' + GUARD); tl.guardianTRX = ga && ga.data && ga.data[0] ? ga.data[0].balance : null;
  console.log('guardián de pausas es contrato:', tl.guardianEsContrato, tl.guardianNombre);
  // Precios externos: Binance spot (contraste del oráculo de JustLend, que va en TRX)
  const ext = {}; for (const s of ['TRXUSDT', 'BTCUSDT', 'ETHUSDT', 'SUNUSDT', 'JSTUSDT', 'WINUSDT', 'BTTCUSDT', 'USDCUSDT', 'TUSDUSDT', 'HTUSDT']) { try { const r = await L.get('https://api.binance.com/api/v3/ticker/price?symbol=' + s); ext[s] = r && r.price ? Number(r.price) : (r && r.msg) || null; } catch (e) { ext[s] = 'ERROR ' + e.message.slice(0, 80); } }
  console.log('Binance spot', JSON.stringify(ext));
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '03-timelock-y-precios.json'), { leido: new Date().toISOString(), timelock: tl, binance: ext }));
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
