const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
(async()=>{const r=await fetch('https://api.trongrid.io/v1/accounts/'+process.argv[2],{headers:{'TRON-PRO-API-KEY':keys.tronGridKey}});const j=await r.json();const d=j.data&&j.data[0];
 console.log('TRX',d?d.balance/1e6:null);console.log(JSON.stringify((d&&d.trc20)||[]).slice(0,900));})();
