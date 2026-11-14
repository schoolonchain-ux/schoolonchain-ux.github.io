'use strict';
// ¿Las diferencias de jTRX y jSTRX son un desfase temporal entre lecturas o son reales? Se lee getCash y saldo real JUNTOS, 4 veces, sin caché.
const L = require('./lib.cjs'); L.usar('06-2026-11-13-' + Date.now()); const A = require('./abi.cjs');
const JSTRX = 'TJQ9rbVe9ei3nNtyGgBL22Fuu2xYjZaLAQ', STRX = 'TU3kjFuhtEo42tsCBtfYUAZxoqQ4yuSLQ5', JTRX = 'TE2RzoSV3wFK99w6J9UnnZ4vLfXYoxvRwP';
(async () => {
  for (let i = 0; i < 4; i++) {
    const t = new Date().toISOString();
    const c1 = A.u((await A.llamar(JSTRX, 'getCash()')).hex), b1 = A.u((await A.llamar(STRX, 'balanceOf(address)', [A.argAddr(JSTRX)])).hex);
    const c2 = A.u((await A.llamar(JTRX, 'getCash()')).hex), a2 = await L.get('https://api.trongrid.io/v1/accounts/' + JTRX + '?_=' + i + Date.now());
    const b2 = BigInt(a2.data[0].balance);
    console.log(t, '| jSTRX getCash', c1, 'saldo sTRX', b1, 'dif(saldo-caja)', b1 - c1, '| jTRX getCash', c2, 'saldo TRX', b2, 'dif', b2 - c2);
    await L.sleep(2500);
  }
  // ¿Qué hace getCash en jSTRX? Se mira si el contrato tiene otras funciones de «caja» (p. ej. dinero prestado a un gestor externo)
  for (const f of ['getCash()', 'totalBorrows()', 'totalReserves()']) { const r = await A.llamar(JSTRX, f); console.log('jSTRX', f, r.ok ? A.u(r.hex) : r); }
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
