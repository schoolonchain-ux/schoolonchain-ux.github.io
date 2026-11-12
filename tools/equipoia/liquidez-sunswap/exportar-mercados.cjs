'use strict';
// Exporta a mercados.json (en esta carpeta) los mercados de SUNSwap V1–V4 que el monitor de liquidez necesita, leyéndolos en SOLO LECTURA del inventario de la investigación
// (research/sunswap-2026-11-11/inventario/inventario.sqlite y fase3.sqlite, foto del 11-nov-2026). No escribe nada en la carpeta de la investigación.
// Se ejecuta a mano cuando se quiera refrescar la lista de mercados (los nuevos mercados de V2/V3 también se buscan en cada lectura con las fábricas; ver liquidez.cjs).
// Qué entra: para cada token pedido, sus mercados con USDT (ruta directa) y con WTRX/TRX (primer salto de la ruta de dos saltos); y los mercados WTRX/TRX–USDT (segundo salto).
const fs = require('fs'), path = require('path'); const { DatabaseSync } = require('node:sqlite');
const R = 'C:/EquipoIA/research/sunswap-2026-11-11/inventario/'; const AQUI = __dirname.split(String.fromCharCode(92)).join('/') + '/';
const TOKENS = JSON.parse(fs.readFileSync(AQUI + 'tokens.json', 'utf8'));
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', WTRX = 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR', TRX = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb';
const inv = new DatabaseSync(R + 'inventario.sqlite', { readOnly: true }), f3 = new DatabaseSync(R + 'fase3.sqlite', { readOnly: true });
const capital = id => f3.prepare('select sum(usd) u from lados where mercado_id = ? and valorable = 1').get(id).u || 0;
const filas = (a, b) => inv.prepare("select * from mercados where ((token_a = ? and token_b = ?) or (token_a = ? and token_b = ?)) and estado in ('activo','inactivo')").all(a, b, b, a);
const sel = new Map();
const poner = (m, rol, token) => { const id = m.mercado_id; const v = sel.get(id) || { m, roles: new Set(), tokens: new Set() }; v.roles.add(rol); v.tokens.add(token); sel.set(id, v); };
const MAXPORPAR = 6;   // como mucho los 6 mercados con más capital de cada pareja
const topPar = (a, b) => filas(a, b).map(m => ({ m, cap: capital(m.mercado_id) })).filter(x => x.cap >= 200 && !(x.m.hooks && x.m.hooks !== '' && x.m.hooks !== '0x0000000000000000000000000000000000000000' && x.m.hooks !== TRX)).sort((x, y) => y.cap - x.cap).slice(0, MAXPORPAR);
for (const t of TOKENS.tokens) {
  if (t.direccion !== USDT) for (const x of topPar(t.direccion, USDT)) poner(x.m, 'directo', t.simbolo);
  if (t.direccion !== WTRX) { for (const x of topPar(t.direccion, WTRX)) poner(x.m, 'salto1', t.simbolo); for (const x of topPar(t.direccion, TRX)) poner(x.m, 'salto1', t.simbolo); }
}
for (const x of topPar(WTRX, USDT)) poner(x.m, 'salto2', 'WTRX'); for (const x of topPar(TRX, USDT)) poner(x.m, 'salto2', 'TRX');
const out = { generado: 'desde el inventario de la investigación (11-nov-2026)', mercados: [] };
for (const { m, roles, tokens } of sel.values()) {
  out.mercados.push({ id: m.mercado_id, version: m.version, direccion: m.version === 'V4' ? m.pool_id : m.direccion, token0: m.token_a, token1: m.token_b, simbolo0: m.simbolo_a, simbolo1: m.simbolo_b, dec0: m.decimales_a, dec1: m.decimales_b, feePpm: m.fee_ppm, tickSpacing: m.tick_spacing, parametros: m.parameters || null, hooks: m.hooks || null, capital11nov: Math.round(capital(m.mercado_id)), roles: [...roles], tokens: [...tokens], estado11nov: m.estado });
}
out.mercados.sort((a, b) => b.capital11nov - a.capital11nov);
fs.writeFileSync(AQUI + 'mercados.json', JSON.stringify(out, null, 1));
const porV = {}; for (const m of out.mercados) porV[m.version] = (porV[m.version] || 0) + 1;
console.log('mercados exportados:', out.mercados.length, JSON.stringify(porV)); console.log(out.mercados.slice(0, 6).map(m => m.version + ' ' + m.simbolo0 + '/' + m.simbolo1 + ' ' + m.capital11nov + ' ' + m.roles.join('+')).join(' | '));
const v1 = out.mercados.find(m => m.version === 'V1'), v4 = out.mercados.find(m => m.version === 'V4'); console.log('ejemplo V1:', JSON.stringify(v1)); console.log('ejemplo V4:', JSON.stringify(v4));
