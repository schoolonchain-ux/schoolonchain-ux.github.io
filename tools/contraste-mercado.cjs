'use strict';
// Vuelca lo que calcula la página (assets/mercado-calc.js) para cada activo de data/mercado.json, para contrastarlo con numpy (contraste-mercado.py).
// Uso: node tools/contraste-mercado.cjs data/mercado.json volcado.json
const fs = require('node:fs'); const M = require('../assets/mercado-calc.js');
const D = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const btc = D.activos[0].c; const out = {};
for (const a of D.activos) { const c = a.c; const o = {}; for (const n of [7, 30, 90]) { o['vol' + n] = M.vol(c, n); o['rend' + n] = M.rend(c, n); } o.percentil30 = M.percentil(M.serieVol(c, 30)); o.corr30 = M.corr(c, btc, 30); o.corr90 = M.corr(c, btc, 90); o.corr30previa = M.corr(c, btc, 30, 30); o.beta90 = M.beta(c, btc, 90); out[a.s] = o; }
fs.writeFileSync(process.argv[3], JSON.stringify(out)); console.log('volcado de ' + D.activos.length + ' activos');
