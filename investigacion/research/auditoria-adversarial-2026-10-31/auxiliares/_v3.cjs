const fs=require('fs');const D='C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/';
const j=JSON.parse(fs.readFileSync(D+'trb-posfoto-envios.json','utf8'));const arr=Array.isArray(j)?j:(j.envios||j.filas||Object.values(j));console.log('n',arr.length,JSON.stringify(arr[0]).slice(0,250));
