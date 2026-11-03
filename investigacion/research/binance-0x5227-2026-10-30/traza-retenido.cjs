'use strict';
// Dónde está el dinero del robo retenido en billeteras del recorrido (tramo 1), a la hora de la foto (23:40 Madrid) y ahora (saldo vivo de las mayores).
const fs = require('fs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const HG = { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronGridKey };
const OUT = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const PX = 0.352, USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const R = JSON.parse(fs.readFileSync(OUT + 'traza-resultado.json', 'utf8')); const { rec } = JSON.parse(fs.readFileSync(OUT + 'traza-cache.json', 'utf8'));
const fmt = n => Math.round(n).toLocaleString('en'); const iso = ms => new Date(ms).toISOString().slice(5, 16).replace('T', ' ');
const filas = Object.entries(R.saldo).map(([w, s]) => ({ w, neto: s.neto, p: R.pureza[w] || 0, ret: Math.max(0, s.neto) * (R.pureza[w] || 0), nivel: rec[w] ? rec[w].nivel : null })).filter(f => f.ret > 0).sort((a, b) => b.ret - a.ret);
const tot = filas.reduce((s, f) => s + f.ret, 0); console.log('retenido total (foto):', fmt(tot), '$ en', filas.length, 'billeteras');
const tramos = [[1e6, 1e12, '≥ 1 M$'], [1e5, 1e6, '100.000 – 1 M$'], [1e4, 1e5, '10.000 – 100.000 $'], [0, 1e4, '< 10.000 $']]; for (const [a, b, n] of tramos) { const s = filas.filter(f => f.ret >= a && f.ret < b); console.log(' ', n.padEnd(20), String(s.length).padStart(4), 'billeteras |', fmt(s.reduce((x, f) => x + f.ret, 0)).padStart(11), '$'); }
const top = filas.slice(0, 15); (async () => {
  for (const f of top) { const j = await (await fetch('https://api.trongrid.io/v1/accounts/' + f.w, { headers: HG })).json(); const d = (j.data || [])[0] || {}; f.trxAhora = Number(d.balance || 0) / 1e6; f.usdtAhora = Number(((d.trc20 || []).map(o => o[USDT]).find(Boolean)) || 0) / 1e6; f.creada = d.create_time || null; f.ultima = d.latest_opration_time || null; await new Promise(r => setTimeout(r, 200));
    console.log(' ', f.w, '| nivel', String(f.nivel).padStart(2), '| foto', fmt(f.ret).padStart(10), '$ | ahora', fmt(f.trxAhora), 'TRX +', fmt(f.usdtAhora), 'USDT | creada', f.creada ? iso(f.creada) : '-', '| último mov', f.ultima ? iso(f.ultima) : '-'); }
  fs.writeFileSync(OUT + 'traza-retenido.json', JSON.stringify({ total: tot, n: filas.length, top }, null, 1));
})();
