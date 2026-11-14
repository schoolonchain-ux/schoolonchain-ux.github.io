'use strict';
// Calcula UNA VEZ los selectores (4 primeros bytes del keccak de la firma) de las funciones de solo lectura que usa el panel y los guarda en selectores.json,
// para que el lector no dependa de nada fuera de esta carpeta y del lector por lotes del monitor de sun.io.
const { selector } = require('C:/EquipoIA/chainscope/src/core/keccak.cjs');
const fs = require('node:fs'), path = require('node:path');
const FIRMAS = [
  'getCash()', 'totalBorrows()', 'totalReserves()', 'totalSupply()', 'exchangeRateStored()', 'admin()', 'implementation()', 'comptroller()', 'interestRateModel()',
  'balanceOf(address)', 'delay()', 'v1PriceOracle()', 'getUnderlyingPrice(address)', 'poster()', 'anchorAdmin()',
  'mintGuardianPaused(address)', 'borrowGuardianPaused(address)', 'borrowCaps(address)', 'markets(address)', 'getAllMarkets()',
  'pendingAdmin()', 'pauseGuardian()', 'comptrollerImplementation()', 'oracle()', 'closeFactorMantissa()', 'liquidationIncentiveMantissa()',
  'transferGuardianPaused()', 'seizeGuardianPaused()', 'maxAssets()',
  'getAccountSnapshot(address)', 'getAccountLiquidity(address)', 'getAssetsIn(address)',
];
const out = {};
for (const f of FIRMAS) { const s = selector(f); out[f] = (typeof s === 'string' ? s : Buffer.from(s).toString('hex')).replace(/^0x/, '').slice(0, 8); }
fs.writeFileSync(path.join(__dirname, 'selectores.json'), JSON.stringify(out, null, 1));
console.log(Object.keys(out).length, 'selectores', JSON.stringify(out).slice(0, 300));
