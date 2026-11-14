'use strict';
// FASE 8 · VALIDACIÓN con el propio contrato: ¿qué responde JustLend si los mayores depositantes piden retirar TODO su dinero ahora?
// Se usa triggerconstantcontract (simulación, como eth_call): NO envía nada ni firma nada. owner_address = el depositante. Resultado: 0 = permitido; otro número = código de error de Compound.
// Códigos de error de Compound ErrorReporter (los que importan): 0 NO_ERROR · 3 COMPTROLLER_REJECTION · 9 MATH_ERROR (aquí suele ser pedir más de lo que tiene) · 14 TOKEN_INSUFFICIENT_CASH (el mercado no tiene tanto en caja) · 2 BAD_INPUT.
const L = require('./lib.cjs'); L.usar('16-2026-11-13-' + Date.now()); const A = require('./abi.cjs'); const path = require('node:path');
const PSM = 'TBXW4hS5KYjjbJXDpnrPf4zhkLwrpUjbyz';
const CODIGOS = { 0: 'permitido', 1: 'error desconocido', 2: 'entrada no válida', 3: 'el Comptroller lo rechaza (dejaría la cuenta en déficit)', 4: 'comptroller: no listado', 9: 'error de cuentas (pide más de lo que tiene)', 14: 'la caja del mercado no alcanza' };
const sim = async (from, contrato, firma, args) => { const r = await L.post('https://api.trongrid.io/wallet/triggerconstantcontract', { owner_address: from, contract_address: contrato, function_selector: firma, parameter: args.join(''), visible: true }); const ok = r && r.result && r.result.result; const res = r && r.constant_result && r.constant_result[0]; return { ok: !!ok, codigo: res ? Number(A.u(res)) : null, mensaje: ok ? null : (r && r.result && (r.result.message ? Buffer.from(r.result.message, 'hex').toString('utf8') : '')) || JSON.stringify(r).slice(0, 160), energia: r && r.energy_used }; };
(async () => {
  const out = { leido: new Date().toISOString(), psm: {}, pruebas: [] };
  const be = await A.llamar(PSM, 'buyEnabled()'), se = await A.llamar(PSM, 'sellEnabled()'); out.psm = { buyEnabled: be.ok ? A.u(be.hex) !== 0n : null, sellEnabled: se.ok ? A.u(se.hex) !== 0n : null }; console.log('PSM buyEnabled (USDD→USDT):', out.psm.buyEnabled, '| sellEnabled', out.psm.sellEnabled);
  const h = require('./resultados/08-titulares.json'), d = require('./resultados/04-liquidez-por-mercado.json');
  for (const s of ['jUSDT', 'jTRX', 'jETH', 'jBTC', 'jSTRX', 'jUSDD']) {
    const cand = h.mercados.filter(m => m.simbolo === s).sort((a, b) => b.titulares[0].reclamoUSD - a.titulares[0].reclamoUSD)[0]; const f = d.mercados.find(x => x.jToken === cand.jToken);
    for (const t of cand.titulares.slice(0, 3)) {
      const dv = 10 ** f.decimales; const raw = BigInt(Math.floor(t.reclamo * dv * 0.999999)); const peque = BigInt(10 ** Math.min(f.decimales, 6));
      const a1 = await sim(t.titular, cand.jToken, 'redeemUnderlying(uint256)', [A.argU(peque)]);
      const a2 = await sim(t.titular, cand.jToken, 'redeemUnderlying(uint256)', [A.argU(raw)]);
      const mas = await sim(t.titular, cand.jToken, 'redeemUnderlying(uint256)', [A.argU(BigInt(Math.floor(f.caja * dv * 1.01)))]);   // más que toda la caja
      out.pruebas.push({ mercado: s, jToken: cand.jToken, titular: t.titular, reclamoUSD: t.reclamoUSD, cajaUSD: f.cajaUSD, pideUnPoco: a1, pideTodoSuReclamo: a2, pideMasQueLaCaja: mas });
      console.log(s.padEnd(7), t.titular, (t.reclamoUSD / 1e6).toFixed(2).padStart(8) + ' M$ (caja ' + (f.cajaUSD / 1e6).toFixed(1) + ' M$) | un poco:', a1.codigo, '| TODO su reclamo:', a2.codigo, a2.codigo === null ? '(' + a2.mensaje + ')' : '(' + (CODIGOS[a2.codigo] || '?') + ')', '| más que la caja:', mas.codigo, mas.codigo === null ? '(' + mas.mensaje + ')' : '(' + (CODIGOS[mas.codigo] || '?') + ')');
    }
  }
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '16-simular-retiradas.json'), out));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });
