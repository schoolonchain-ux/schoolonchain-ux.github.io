'use strict';
// FASE 7 · Salidas OFICIALES (sin pasar por el mercado): reservas de USDT de la PSM de USDD y funciones del contrato de sTRX.
const L = require('./lib.cjs'); L.usar('13-2026-11-13'); const A = require('./abi.cjs'); const path = require('node:path');
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', GEMJOIN = 'TSUYvQ5tdd3DijCD1uGunGLpftHuSZ12sQ', STRX = 'TU3kjFuhtEo42tsCBtfYUAZxoqQ4yuSLQ5', USDD = 'TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz';
(async () => {
  const out = {};
  const rd = async (c, f, a) => { const r = await A.llamar(c, f, a); return r.ok ? r.hex : null; };
  // PSM de USDD
  out.gemJoin = { direccion: GEMJOIN };
  for (const f of ['gem()', 'vat()', 'ilk()', 'dec()', 'live()']) { const h = await rd(GEMJOIN, f); out.gemJoin[f] = h; }
  out.gemJoin.gem = out.gemJoin['gem()'] ? A.dirDe(out.gemJoin['gem()']) : null;
  const bal = await rd(USDT, 'balanceOf(address)', [A.argAddr(GEMJOIN)]); out.gemJoin.usdtEnLaPSM = bal ? String(A.u(bal)) : null;
  console.log('GemJoin gem =', out.gemJoin.gem, '| USDT dentro =', bal ? Number(A.u(bal)) / 1e6 : null);
  const ts = await rd(USDD, 'totalSupply()'); out.usddOferta = ts ? String(A.u(ts)) : null; console.log('USDD oferta total', ts ? Number(A.u(ts)) / 1e18 : null);
  // ¿quién es la PSM? Se busca entre las cuentas con permiso (wards) no consta; se pregunta a TronScan por la etiqueta del GemJoin
  const ac = await L.get('https://apilist.tronscanapi.com/api/accountv2?address=' + GEMJOIN); out.gemJoin.etiqueta = ac.addressTag || ac.publicTag || ac.name || null; out.gemJoin.tx = ac.totalTransactionCount; console.log('etiqueta TronScan del GemJoin:', out.gemJoin.etiqueta, 'tx', ac.totalTransactionCount);
  // sTRX: lista de funciones públicas del contrato (ABI publicado) para ver cómo se sale oficialmente
  const c = await L.post('https://api.trongrid.io/wallet/getcontract', { value: STRX, visible: true });
  const fn = ((c.abi && c.abi.entrys) || []).filter(e => e.type === 'Function').map(e => e.name + '(' + (e.inputs || []).map(i => i.type).join(',') + ')' + (e.stateMutability === 'View' || e.stateMutability === 'view' ? ' [lectura]' : ''));
  out.sTRX = { contrato: STRX, nombre: c.name, funciones: fn }; console.log('sTRX funciones:', fn.join(' | ').slice(0, 900));
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '13-salidas-oficiales.json'), { leido: new Date().toISOString(), ...out }));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });
