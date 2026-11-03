'use strict';
// De las receptoras de gas de la cuenta financiadora que NO están ni en nuestros datos ni en Polytrop: qué hicieron con tokens (primeras 30 transferencias/aprobaciones TRC20, guardadas tal cual)
// y si tocaron contratos de puente/cambio conocidos o direcciones nuestras/de Polytrop. Solo lectura, TronGrid sin clave.
const fs = require('fs'); const path = require('path'); const sl = ms => new Promise(r => setTimeout(r, ms));
const D = path.join(__dirname, '..', 'datos') + '/'; const R = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
const F = JSON.parse(fs.readFileSync(D + 'financiadora-gas.json', 'utf8')); const nuevas = F.receptoras.filter(x => !x.nuestra && !x.polytrop);
const cach = ['tramo3', 'tramo4', 'tramo5', 'tramo6'].map(t => fs.readFileSync(R + t + '/' + t + '-cache.json', 'utf8')); const csv = fs.readFileSync(D + 'polytrop-binance-hack-addresses.csv', 'utf8');
const CONOCIDOS = { TPuaJ6gnYfE9gLUDFrbWbPx3tMnjG8max1: 'Symbiosis MetaRouterGateway', TJeqGqHXjDNiad6nV9rf1oL6rvmdWN9XPa: 'Across Gateway', TANdmAmc5jyNEFB1gXbEBfaG7Ftj1XNUG1: 'Across Executor', TEcDijvKSXcfWT7S6rd44H5vNgufm7Y4XC: 'Chainflip bóveda', TTu9T4ff4zvNPz1dfAd36gUeB3xJgYz4G9: 'BWSwapRouterV1', TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd: 'JustLend jUSDT' };
async function g(u) { for (let i = 0; i < 5; i++) { try { const r = await fetch(u, { signal: AbortSignal.timeout(30000) }); if (r.status === 429) { await sl(2500 * (i + 1)); continue; } return { http: r.status, cuerpo: await r.json() }; } catch { await sl(1500); } } return { http: 0, cuerpo: null }; }
(async () => {
  const out = [];
  for (const x of nuevas) {
    const c = await g('https://api.trongrid.io/v1/accounts/' + x.a); await sl(1100); const e = await g('https://api.trongrid.io/v1/accounts/' + x.a + '/transactions/trc20?limit=30&order_by=block_timestamp,asc'); await sl(1100);
    const d = c.cuerpo && c.cuerpo.data && c.cuerpo.data[0]; const ev = e.cuerpo && Array.isArray(e.cuerpo.data) ? e.cuerpo.data.map(t => ({ tx: t.transaction_id, tipo: t.type, t: t.block_timestamp, de: t.from, a: t.to, v: t.value, simbolo: t.token_info && t.token_info.symbol, dec: t.token_info && t.token_info.decimals })) : null;
    const contrapartes = new Set((ev || []).flatMap(t => [t.de, t.a]).filter(a => a && a !== x.a)); const tocados = [...contrapartes].filter(a => CONOCIDOS[a]).map(a => CONOCIDOS[a]);
    const enNuestros = [...contrapartes].filter(a => cach.some(s => s.includes(a))).length, enPolytrop = [...contrapartes].filter(a => csv.includes(a)).length;
    out.push({ a: x.a, recibioGasDe: x.n + ' envíos / ' + x.trx + ' TRX', creada: d && d.create_time, httpCuenta: c.http, httpEventos: e.http, eventos: ev, tocaConocidos: [...new Set(tocados)], contrapartesNuestras: enNuestros, contrapartesPolytrop: enPolytrop }); }
  fs.writeFileSync(D + 'receptoras-gas.json', JSON.stringify(out, null, 1));
  const con = out.filter(x => x.eventos && x.eventos.length); console.log('receptoras sin presencia en nuestros datos ni en Polytrop:', out.length, '| con algún movimiento TRC20:', con.length, '| con fallo de consulta:', out.filter(x => x.httpCuenta !== 200 || x.httpEventos !== 200).length);
  console.log('tocan contratos de puente/cambio conocidos:', out.filter(x => x.tocaConocidos.length).length, '| tienen contrapartes que son nuestras:', out.filter(x => x.contrapartesNuestras).length, '| contrapartes de Polytrop:', out.filter(x => x.contrapartesPolytrop).length);
  const por = {}; for (const x of out) for (const k of x.tocaConocidos) por[k] = (por[k] || 0) + 1; console.log('por contrato:', JSON.stringify(por));
  const sim = {}; for (const x of out) for (const t of x.eventos || []) { const k = (t.simbolo || '?') + ' ' + t.tipo; sim[k] = (sim[k] || 0) + 1; } console.log('movimientos:', JSON.stringify(Object.entries(sim).sort((a, b) => b[1] - a[1]).slice(0, 6)));
})();
