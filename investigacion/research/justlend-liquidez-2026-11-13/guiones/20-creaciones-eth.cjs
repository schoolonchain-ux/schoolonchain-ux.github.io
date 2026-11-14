'use strict';
// FASE 9c · ¿Quién ordenó las creaciones de «ETH» y con qué función? Se leen las transacciones completas (quién firma, a qué contrato, qué método) de las creaciones y de los depósitos a JustLend.
const L = require('./lib.cjs'); L.usar('20-2026-11-13'); const b58 = require('./b58.cjs'); const path = require('node:path'); const A = require('./abi.cjs');
(async () => {
  const j = require('./resultados/19-eth-cuenta-grande.json'); const out = [];
  const objetivo = [...j.creacionesYQuemas.filter(t => t.de === 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb'), ...j.cuentaGrande.filter(t => t.a === 'TR7BUFRQeq1w5jAZf1FKx85SHuX6PfMqsV' || t.de === 'TR7BUFRQeq1w5jAZf1FKx85SHuX6PfMqsV')];
  const vistos = new Set();
  for (const t of objetivo) {
    if (vistos.has(t.tx)) continue; vistos.add(t.tx);
    const x = await L.post('https://api.trongrid.io/wallet/gettransactionbyid', { value: t.tx }); const c = x.raw_data && x.raw_data.contract && x.raw_data.contract[0]; const v = c && c.parameter && c.parameter.value;
    const sel = v && v.data ? v.data.slice(0, 8) : null; const quien = v && v.owner_address ? b58(v.owner_address) : null; const dst = v && v.contract_address ? b58(v.contract_address) : null;
    const nombres = { [A.selector('mint(address,uint256)')]: 'mint(address,uint256)', [A.selector('transfer(address,uint256)')]: 'transfer(address,uint256)', [A.selector('burn(uint256)')]: 'burn(uint256)', [A.selector('mint(uint256)')]: 'mint(uint256)', [A.selector('issue(uint256)')]: 'issue(uint256)', [A.selector('redeem(uint256)')]: 'redeem(uint256)' };
    out.push({ tx: t.tx, cuando: t.cuando, eth: t.eth, de: t.de, a: t.a, firma: quien, llamaA: dst, selector: sel, metodoProbable: nombres[sel] || null, resultado: x.ret && x.ret[0] && x.ret[0].contractRet });
    console.log(t.cuando, String(Math.round(t.eth)).padStart(8), 'ETH', t.de.slice(0, 8), '→', t.a.slice(0, 8), '| firma', quien, '| llama a', dst, '| método', nombres[sel] || sel, '|', t.tx);
  }
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '20-creaciones-eth.json'), { leido: new Date().toISOString(), transacciones: out }));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });
