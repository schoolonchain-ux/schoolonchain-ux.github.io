'use strict';
// Serie diaria de transferencias USDT (conteo exacto de TronScan por día UTC) de los nodos, del 11-oct al 31-oct: ¿existían antes del robo o aparecen con él? Solo lectura.
const fs = require('fs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const k = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const HS = { accept: 'application/json', 'TRON-PRO-API-KEY': k.tronscanKey };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const S = async u => { for (let i = 0; i < 4; i++) { try { await sleep(330); const r = await fetch('https://apilist.tronscanapi.com' + u, { headers: HS, signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(2000); continue; } return await r.json(); } catch { await sleep(900); } } return null; };
const prev = JSON.parse(fs.readFileSync(__dirname + '/resultados/nodos.json', 'utf8'));
const A = Object.keys(prev).slice(0, 5).concat(['TZG47zhb8kcriWQ2rE719yHs1KqgzwMrvF', 'TM8uyBjRKzFtQdMC7tQLvKeeWieaFvXDyc', 'TQ5SdemHpBawdb31DiwcwSVMQB7iduXgSu']);
(async () => {
  const dias = []; for (let d = 11; d <= 31; d++) dias.push(d);
  const res = {};
  for (const a of A) {
    res[a] = {};
    for (const d of dias) {
      const t0 = Date.UTC(2026, 9, d), t1 = t0 + 86400000;
      // el conteo total de TronScan topa en 10.000 e ignora el rango; se estima el ritmo con las 50 últimas del día: 50 / horas que abarcan (si hay menos de 50, es el total del día)
      const j = await S('/api/token_trc20/transfers?limit=50&start=0&sort=-timestamp&contract_address=' + USDT + '&relatedAddress=' + a + '&start_timestamp=' + t0 + '&end_timestamp=' + t1);
      const l = (j && j.token_transfers) || [];
      if (!j) res[a][d] = null;
      else if (l.length < 50) res[a][d] = l.length;
      else { const h = Math.max((l[0].block_ts - l[l.length - 1].block_ts) / 3600000, 1 / 60); res[a][d] = Math.round(50 / h * 24); }
    }
    console.log(a.slice(0, 8), prev[a].rol.padEnd(20), dias.map(d => (res[a][d] === null ? '?' : res[a][d])).join(' '));
  }
  console.log('transferencias/día (≈, ritmo de las 50 últimas del día; si <50 es exacto). días:', dias.join(' '));
  fs.writeFileSync(__dirname + '/resultados/nodos-serie-diaria.json', JSON.stringify(res, null, 1));
})().catch(e => { console.error('ERROR', String(e.message)); process.exit(1); });
