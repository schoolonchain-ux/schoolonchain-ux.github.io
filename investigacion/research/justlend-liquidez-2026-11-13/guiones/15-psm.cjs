'use strict';
const L = require('./lib.cjs'); L.usar('15-2026-11-13'); const A = require('./abi.cjs'); const path = require('node:path');
const PSM = 'TBXW4hS5KYjjbJXDpnrPf4zhkLwrpUjbyz'; const out = { psm: PSM, selectores: {} };
(async () => {
  for (const f of ['buyGem(address,uint256)', 'sellGem(address,uint256)', 'execute(bytes,uint256)']) { out.selectores[f] = A.selector(f); }
  console.log('selectores', JSON.stringify(out.selectores), '(vistos en las salidas: 8d7ef9bb y 3593564c)');
  const g = async f => { const r = await A.llamar(PSM, f); return r.ok ? r.hex : null; };
  const tin = await g('tin()'), tout = await g('tout()'), gj = await g('gemJoin()'), dj = await g('daiJoin()'), ilk = await g('ilk()'), vat = await g('vat()');
  out.tin = tin ? String(A.u(tin)) : null; out.tout = tout ? String(A.u(tout)) : null; out.gemJoin = gj ? A.dirDe(gj) : null; out.daiJoin = dj ? A.dirDe(dj) : null;
  console.log('PSM tin (comisión al entrar, 1e18=100%)', out.tin, '| tout (comisión al SALIR de USDD a USDT)', out.tout, '| gemJoin', out.gemJoin, '| daiJoin', out.daiJoin);
  const c = await L.post('https://api.trongrid.io/wallet/getcontract', { value: PSM, visible: true }); out.nombre = c.name || null; out.funciones = ((c.abi && c.abi.entrys) || []).filter(e => e.type === 'Function').map(e => e.name);
  console.log('nombre', out.nombre, '| funciones', out.funciones.join(', ').slice(0, 400));
  const ac = await L.get('https://apilist.tronscanapi.com/api/accountv2?address=' + PSM); out.etiqueta = ac.addressTag || ac.publicTag || ac.name || null; console.log('etiqueta TronScan', out.etiqueta);
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '15-psm.json'), { leido: new Date().toISOString(), ...out }));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });
