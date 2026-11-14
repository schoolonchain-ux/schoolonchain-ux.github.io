'use strict';
const L = require('./lib.cjs'); L.usar('00-2026-11-13'); const A = require('./abi.cjs');
const JUSDT = 'TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd';
(async () => {
  console.log('selector comptroller()=', A.selector('comptroller()'), '| getAllMarkets()=', A.selector('getAllMarkets()'));
  const c = await A.llamar(JUSDT, 'comptroller()');
  console.log('comptroller() de jUSDT ->', c.ok ? A.dirDe(c.hex) : c);
  const s = await A.llamar(JUSDT, 'symbol()'); console.log('symbol', s.ok ? A.texto(s.hex) : s);
  const u = await A.llamar(JUSDT, 'underlying()'); console.log('underlying', u.ok ? A.dirDe(u.hex) : u);
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
