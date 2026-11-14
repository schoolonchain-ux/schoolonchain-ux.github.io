'use strict';
// FASE 5 · Posición completa (depósitos y deudas) de las cuentas con más dinero en JustLend.
// Universo: la unión de los 50 mayores titulares de cada mercado (resultados/08). Por cada cuenta: mercados en los que participa (getAssetsIn),
// su margen o déficit según el Comptroller (getAccountLiquidity) y, por mercado, saldo depositado y deuda (getAccountSnapshot). Solo lectura.
const L = require('./lib.cjs'); L.usar('09-2026-11-13'); const A = require('./abi.cjs'); const path = require('node:path'); const fs = require('node:fs');
const C = 'TGjYzgCyPobsNS9n6WcbdLVR9dH7mWqFx7';
(async () => {
  const h = require('./resultados/08-titulares.json'), d = require('./resultados/04-liquidez-por-mercado.json'), m = require('./resultados/01-mercados.json');
  const info = {}; for (const f of d.mercados) info[f.jToken] = f; const er = {}; for (const x of m.mercados) er[x.jToken] = BigInt(x.tipoCambioRaw);
  const cuentas = new Set(); for (const mk of h.mercados) for (const t of mk.titulares) cuentas.add(t.titular);
  console.log('cuentas distintas:', cuentas.size);
  const out = []; let n = 0; const t0 = Date.now();
  for (const c of cuentas) {
    const as = await A.llamar(C, 'getAssetsIn(address)', [A.argAddr(c)]); const lista = [];
    if (as.ok) { const k = Number(A.u(as.hex, 1)); for (let i = 0; i < k; i++) lista.push(A.dirDe(as.hex, 2 + i)); }
    const lq = await A.llamar(C, 'getAccountLiquidity(address)', [A.argAddr(c)]);
    const pos = []; let supUSD = 0, debUSD = 0;
    // Se miran los mercados «entrados» y además aquellos donde la cuenta figura entre los mayores titulares (depositar no obliga a «entrar» como garantía)
    const mercadosDeTitular = new Set(h.mercados.filter(mk => mk.titulares.some(t => t.titular === c)).map(mk => mk.jToken));
    for (const j of new Set([...lista, ...mercadosDeTitular])) {
      const s = await A.llamar(j, 'getAccountSnapshot(address)', [A.argAddr(c)]); if (!s.ok) continue;
      const jt = A.u(s.hex, 1), deuda = A.u(s.hex, 2), tc = A.u(s.hex, 3); const f = info[j]; const dv = 10 ** f.decimales;
      const sup = Number(jt * tc / (10n ** 18n)) / dv, deu = Number(deuda) / dv; if (sup === 0 && deu === 0) continue;
      pos.push({ jToken: j, simbolo: f.simbolo, subyacente: f.simboloSubyacente, entradoComoGarantia: lista.includes(j), deposito: sup, depositoUSD: sup * f.precioUSD, deuda: deu, deudaUSD: deu * f.precioUSD, factorGarantia: f.factorGarantia });
      supUSD += sup * f.precioUSD; debUSD += deu * f.precioUSD;
    }
    const colUSD = pos.filter(p => p.entradoComoGarantia).reduce((s, p) => s + p.depositoUSD * p.factorGarantia, 0);
    out.push({ cuenta: c, liquidezComptrollerRaw: lq.ok ? String(A.u(lq.hex, 1)) : null, deficitComptrollerRaw: lq.ok ? String(A.u(lq.hex, 2)) : null, errorComptroller: lq.ok ? String(A.u(lq.hex, 0)) : null, depositosUSD: supUSD, deudaUSD: debUSD, poderDePrestamoUSD: colUSD, posiciones: pos });
    if (++n % 25 === 0) console.log(n, '/', cuentas.size, ((Date.now() - t0) / 60000).toFixed(1), 'min');
  }
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '09-cuentas.json'), { leido: new Date().toISOString(), cuentas: out }));
  console.log('listo', JSON.stringify(L.metricas));
})().catch(e => { console.error('ERROR', e.message, e.stack); process.exit(1); });
