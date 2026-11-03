'use strict';
// ¿Quién contabiliza mejor lo retenido en las billeteras intermedias: el informe (11,2 M$) o el inventario cronológico (≈ 25 M$)?
// Para las 25 billeteras con mayor diferencia se reconstruye el saldo REAL a las 22:40 UTC: saldo de hoy menos los movimientos posteriores (TronGrid + TronScan).
const fs = require('fs'); const path = require('path');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs'); const k = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const HS = { accept: 'application/json', 'TRON-PRO-API-KEY': k.tronscanKey }, HG = { accept: 'application/json', 'TRON-PRO-API-KEY': k.tronGridKey };
const sleep = ms => new Promise(r => setTimeout(r, ms)); const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', PX = 0.352, TSTAR = Date.UTC(2026, 9, 30, 22, 40);
async function S(u) { for (let i = 0; i < 5; i++) { try { await sleep(330); const r = await fetch('https://apilist.tronscanapi.com' + u, { headers: HS, signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(2000 * (i + 1)); continue; } return await r.json(); } catch { await sleep(1000 * (i + 1)); } } return null; }
const fmt = n => Math.round(n).toLocaleString('en');
(async () => {
  const dif = JSON.parse(fs.readFileSync(path.join(__dirname, 'resultados/retenido-diferencias-tramo1.json'), 'utf8')).slice(0, 25); const out = [];
  for (const d of dif) {
    const g = await (await fetch('https://api.trongrid.io/v1/accounts/' + d.w, { headers: HG })).json(); const a = (g.data || [])[0] || {}; const trxHoy = (a.balance || 0) / 1e6; const usdtHoy = Number(((a.trc20 || []).find(x => x[USDT]) || {})[USDT] || 0) / 1e6;
    // movimientos posteriores a la foto
    let dTrx = 0, dUsdt = 0, completo = true;
    for (let p = 0; p < 40; p++) { const j = await S('/api/transfer?address=' + d.w + '&limit=50&start=' + (p * 50) + '&sort=timestamp&count=true&start_timestamp=' + (TSTAR + 1) + '&end_timestamp=' + Date.now()); if (!j) { completo = false; break; } const l = j.data || []; for (const t of l) { if (t.tokenName !== '_' || t.contractRet !== 'SUCCESS') continue; if (t.transferToAddress === d.w) dTrx += t.amount / 1e6; if (t.transferFromAddress === d.w) dTrx -= t.amount / 1e6; } if (l.length < 50) break; }
    for (let p = 0; p < 40; p++) { const j = await S('/api/token_trc20/transfers?limit=50&start=' + (p * 50) + '&sort=timestamp&count=true&contract_address=' + USDT + '&relatedAddress=' + d.w + '&start_timestamp=' + (TSTAR + 1) + '&end_timestamp=' + Date.now()); if (!j) { completo = false; break; } const l = j.token_transfers || []; for (const t of l) { if (t.contractRet !== 'SUCCESS') continue; const q = Number(t.quant) / 1e6; if (t.to_address === d.w) dUsdt += q; if (t.from_address === d.w) dUsdt -= q; } if (l.length < 50) break; }
    // el saldo propio de gas de TRX (comisiones) no se cuenta: es una aproximación
    const saldoFoto = (trxHoy - dTrx) * PX + (usdtHoy - dUsdt);
    const r = { w: d.w, nivel: d.nivel, pureza: d.p, simulacion: d.sim, simulacionBruto: d.simTotal, informe: d.informe, saldoRealALaFoto: saldoFoto, trxHoy, usdtHoy, completo }; out.push(r);
    console.log(d.w.slice(0, 12), 'nivel', d.nivel, '| inventario simulado (bruto)', fmt(d.simTotal).padStart(10), '| informe (neto×pureza)', fmt(d.informe / (d.p || 1)).padStart(9), '| SALDO REAL a la foto', fmt(saldoFoto).padStart(10), completo ? '' : '(lectura incompleta)');
  }
  fs.writeFileSync(path.join(__dirname, 'resultados/retenido-verificacion.json'), JSON.stringify(out, null, 1));
  const ok = out.filter(r => r.completo); const e1 = ok.reduce((s, r) => s + Math.abs(r.simulacionBruto - r.saldoRealALaFoto), 0), e2 = ok.reduce((s, r) => s + Math.abs(r.informe / (r.pureza || 1) - r.saldoRealALaFoto), 0);
  console.log('\nerror absoluto total frente al saldo real (', ok.length, 'billeteras ): inventario simulado', fmt(e1), '| método del informe', fmt(e2));
})();
