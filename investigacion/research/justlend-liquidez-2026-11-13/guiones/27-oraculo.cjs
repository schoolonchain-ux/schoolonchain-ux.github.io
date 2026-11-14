'use strict';
// ¿Cómo fija el oráculo el precio de USDD/TUSD/BUSD? Lista de funciones del oráculo y de su posible implementación, y lectura de las que den pistas.
const L = require('./lib.cjs'); L.usar('27-2026-11-13'); const A = require('./abi.cjs'); const path = require('node:path');
const OR = 'TGnYnSn4G9PgWFj7QQemh4YMZKp3fkympJ';
(async () => {
  const c = await L.post('https://api.trongrid.io/wallet/getcontract', { value: OR, visible: true });
  const fn = ((c.abi && c.abi.entrys) || []).filter(e => e.type === 'Function' || e.type === 'function').map(e => e.name + '(' + (e.inputs || []).map(i => i.type).join(',') + ')' + (/view|pure/i.test(e.stateMutability || '') ? '' : ' *escribe*'));
  console.log('oráculo', OR, c.name, fn.length, 'funciones\n' + fn.join('\n'));
  const out = { oraculo: OR, nombre: c.name || null, funciones: fn, lecturas: {} };
  for (const f of ['admin()', 'owner()', 'priceFeed()', 'oracle()', 'trxPrice()', 'usdtPrice()', 'getPrice(address)']) { const args = f.includes('address') ? [A.argAddr('TKFRELGGoRgiayhwJTNNLqCNjFoLBh3Mnf')] : []; const r = await A.llamar(OR, f, args); out.lecturas[f] = r.ok ? r.hex.slice(0, 66) : null; }
  console.log(JSON.stringify(out.lecturas));
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '27-oraculo.json'), { leido: new Date().toISOString(), ...out }));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });
