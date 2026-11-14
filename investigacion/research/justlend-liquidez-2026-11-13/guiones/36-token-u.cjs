'use strict';
// ¿Qué es el token «U» de JustLend (TFNirp6PbqYE1ZTtWuCMUKJWLNZkoCoeFJ)? Ficha pública de TronScan + lecturas del propio contrato (solo lectura).
const L = require('./lib.cjs'); L.usar('36-2026-11-13'); const A = require('./abi.cjs'); const path = require('node:path');
const U = 'TFNirp6PbqYE1ZTtWuCMUKJWLNZkoCoeFJ';
(async () => {
  const out = { token: U }; const t = await L.get('https://apilist.tronscanapi.com/api/token_trc20?contract=' + U); const x = t.trc20_tokens && t.trc20_tokens[0];
  out.tronscan = x ? { nombre: x.name, simbolo: x.symbol, decimales: x.decimals, emisor: x.issue_address, creado: x.issue_time, titulares: x.holders_count, oferta: x.total_supply_with_decimals, descripcion: (x.token_desc || '').slice(0, 400), web: x.home_page, marca: x.vip, nivel: x.level, tipo: x.token_type } : null;
  for (const f of ['name()', 'symbol()', 'decimals()', 'totalSupply()', 'owner()']) { const r = await A.llamar(U, f); out[f] = r.ok ? (f === 'owner()' ? A.dirDe(r.hex) : /name|symbol/.test(f) ? A.texto(r.hex) : String(A.u(r.hex))) : null; }
  const c = await L.post('https://api.trongrid.io/wallet/getcontract', { value: U, visible: true }); out.contrato = { nombre: c.name || null, creador: c.origin_address || null, funciones: ((c.abi && c.abi.entrys) || []).filter(e => /function/i.test(e.type)).map(e => e.name) };
  const ac = await L.get('https://apilist.tronscanapi.com/api/accountv2?address=' + U); out.cuenta = { etiqueta: ac.addressTag || ac.publicTag || null, nombre: ac.name || null, creada: ac.date_created ? new Date(ac.date_created).toISOString() : null };
  const h = await L.get('https://apilist.tronscanapi.com/api/token_trc20/holders?contract_address=' + U + '&start=0&limit=5'); out.mayores = (h.trc20_tokens || []).map(z => ({ a: z.holder_address, saldo: Number(z.balance) / 1e18, etiqueta: z.addressTag || null })); out.totalTitulares = h.total;
  console.log(JSON.stringify(out, null, 1)); console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '36-token-u.json'), { leido: new Date().toISOString(), ...out }));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });
