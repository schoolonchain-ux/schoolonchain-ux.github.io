'use strict';
const fs = require('fs'); const path = require('path');
const no = JSON.parse(fs.readFileSync(path.join(__dirname, 'polytrop-no-tenemos.json'), 'utf8')).filter(x => x.red === 'tron');
const sleep = ms => new Promise(r => setTimeout(r, ms)); const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
async function jget(u) { for (let i = 0; i < 6; i++) { try { const r = await fetch(u, { signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(2500 * (i + 1)); continue; } return await r.json(); } catch { await sleep(1500); } } return null; }
(async () => {
  const out = [];
  for (const x of no) {
    const a = await jget('https://api.trongrid.io/v1/accounts/' + x.a); await sleep(1100);
    const d = a && a.data && a.data[0]; const usdt = d && (d.trc20 || []).map(o => o[USDT]).filter(Boolean)[0];
    const t = await jget('https://api.trongrid.io/v1/accounts/' + x.a + '/transactions?limit=1&order_by=block_timestamp,asc'); await sleep(1100);
    const u = await jget('https://api.trongrid.io/v1/accounts/' + x.a + '/transactions?limit=1&order_by=block_timestamp,desc'); await sleep(1100);
    const r = { a: x.a, rol: x.rol, existe: !!d, trx: d ? d.balance / 1e6 : null, usdt: usdt ? Number(usdt) / 1e6 : 0, creada: d && d.create_time ? new Date(d.create_time).toISOString().slice(0, 10) : null, primera: t && t.data && t.data[0] ? new Date(t.data[0].block_timestamp).toISOString().slice(0, 16) : null, ultima: u && u.data && u.data[0] ? new Date(u.data[0].block_timestamp).toISOString().slice(0, 16) : null };
    out.push(r); console.log(JSON.stringify(r));
    fs.writeFileSync(path.join(__dirname, 'polytrop-tron.json'), JSON.stringify(out));
  }
})();
