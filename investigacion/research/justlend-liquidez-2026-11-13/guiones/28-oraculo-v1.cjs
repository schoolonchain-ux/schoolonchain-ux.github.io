'use strict';
// El PriceOracleProxy delega en «v1PriceOracle». Se lee su dirección, su lista de funciones y quién puede poner precios.
const L = require('./lib.cjs'); L.usar('28-2026-11-13'); const A = require('./abi.cjs'); const path = require('node:path');
const OR = 'TGnYnSn4G9PgWFj7QQemh4YMZKp3fkympJ';
(async () => {
  const out = { proxy: OR };
  for (const f of ['v1PriceOracle()', 'guardian()', 'cUsdtAddress()', 'cUsdcAddress()', 'cEthAddress()']) { const r = await A.llamar(OR, f); out[f] = r.ok ? A.dirDe(r.hex) : null; }
  console.log(JSON.stringify(out));
  const v1 = out['v1PriceOracle()']; if (v1) {
    const c = await L.post('https://api.trongrid.io/wallet/getcontract', { value: v1, visible: true }); const fn = ((c.abi && c.abi.entrys) || []).filter(e => e.type === 'Function' || e.type === 'function').map(e => e.name + '(' + (e.inputs || []).map(i => i.type).join(',') + ')' + (/view|pure/i.test(e.stateMutability || '') ? '' : ' *escribe*'));
    out.v1 = { direccion: v1, nombre: c.name || null, funciones: fn }; console.log('v1PriceOracle', v1, c.name, fn.length, 'funciones\n' + fn.join('\n'));
    for (const f of ['admin()', 'owner()', 'poster()', 'anchorAdmin()', 'pendingAnchorAdmin()']) { const r = await A.llamar(v1, f); if (r.ok) { out.v1[f] = A.dirDe(r.hex); console.log(f, out.v1[f]); } }
  }
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '28-oraculo-v1.json'), { leido: new Date().toISOString(), ...out }));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });
