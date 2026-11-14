'use strict';
// R1-05 de Codex: «el selector no identifica por sí solo la función». Se lee el ABI publicado de los dos contratos de token y se comprueba si define issue(uint256) y quién puede llamarla (owner/minter, si el ABI lo expone).
const L = require('./lib.cjs'); L.usar('34-2026-11-13'); const A = require('./abi.cjs'); const path = require('node:path');
const TOK = { ETH: 'THb4CqiFdwNHsWsQCs4JhzwjMWys4aqCbF', BTC: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9' };
(async () => {
  const out = {}; const sel = A.selector('issue(uint256)');
  for (const [k, a] of Object.entries(TOK)) {
    const c = await L.post('https://api.trongrid.io/wallet/getcontract', { value: a, visible: true });
    const fn = ((c.abi && c.abi.entrys) || []).filter(e => e.type === 'Function' || e.type === 'function'); const tieneIssue = fn.filter(e => e.name === 'issue').map(e => e.name + '(' + (e.inputs || []).map(i => i.type).join(',') + ')' + (e.stateMutability ? ' ' + e.stateMutability : ''));
    const nombres = fn.map(e => e.name);
    const lee = {}; for (const f of ['owner()', 'getOwner()', 'admin()', 'minter()', 'paused()', 'deprecated()']) { const r = await A.llamar(a, f); lee[f] = r.ok ? (/owner|admin|minter/i.test(f) ? A.dirDe(r.hex) : String(A.u(r.hex))) : null; }
    out[k] = { direccion: a, nombre: c.name || null, creador: c.origin_address || null, nFunciones: fn.length, definenIssue: tieneIssue, selectorIssue: sel, funciones: nombres, lecturas: lee };
    console.log(k, a, c.name, '| origin_address', c.origin_address, '| funciones', fn.length, '| issue en el ABI:', tieneIssue.join(', ') || 'NO', '| lecturas', JSON.stringify(lee)); console.log('   funciones:', nombres.filter(n => /issue|redeem|burn|mint|pause|black|owner|deprecate|destroy|transfer/i.test(n)).join(', '));
  }
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '34-abi-tokens.json'), { leido: new Date().toISOString(), ...out }));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });
