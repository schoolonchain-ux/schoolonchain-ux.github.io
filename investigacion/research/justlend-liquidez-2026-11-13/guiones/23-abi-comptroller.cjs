'use strict';
// ¿Qué interruptores de pausa y qué poderes tiene REALMENTE el Comptroller de JustLend? Se lee la lista de funciones del contrato de implementación (ABI publicado en la cadena).
const L = require('./lib.cjs'); L.usar('23-2026-11-13'); const path = require('node:path');
const IMPL = 'TETm1bMHUm9135d5NmUgfkvqZQ4bk6DgWs', UNI = 'TGjYzgCyPobsNS9n6WcbdLVR9dH7mWqFx7';
(async () => {
  const out = {};
  for (const [k, a] of [['implementacion', IMPL], ['proxy', UNI]]) { const c = await L.post('https://api.trongrid.io/wallet/getcontract', { value: a, visible: true }); const fn = ((c.abi && c.abi.entrys) || []).filter(e => e.type === 'Function' || e.type === 'function').map(e => e.name + '(' + (e.inputs || []).map(i => i.type).join(',') + ')' + (/view|pure/i.test(e.stateMutability || '') ? '' : ' *escribe*')); out[k] = { direccion: a, nombre: c.name || null, nFunciones: fn.length, funciones: fn }; console.log(k, a, c.name, fn.length, 'funciones'); }
  const f = out.implementacion.funciones; const interesantes = f.filter(x => /paus|guardian|redeem|borrow|mint|seize|transfer|close|liquidat|oracle|market|cap|implementation|admin|_set|_support|_become/i.test(x));
  console.log(interesantes.join('\n'));
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '23-abi-comptroller.json'), { leido: new Date().toISOString(), out }));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });
