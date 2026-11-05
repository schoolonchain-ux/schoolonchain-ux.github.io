'use strict';
// Lectura paginada de historiales de TronGrid con decodificación. SOLO LECTURA. Cada página queda en raw/<sesion>/ (ver lib.cjs).
const L = require('./lib.cjs'); const b58 = require('./b58.cjs'); const TG = 'https://api.trongrid.io';
const trx = n => (Number(n) || 0) / 1e6;
function decodificar(t) {
  const c = t.raw_data.contract[0], v = c.parameter.value, tipo = c.type.replace('Contract', ''); const ok = !!(t.ret && t.ret[0] && t.ret[0].contractRet === 'SUCCESS');
  const f = { tx: t.txID, t: t.block_timestamp, ok, tipo, de: b58(v.owner_address) };
  if (tipo === 'Transfer') { f.a = b58(v.to_address); f.trx = trx(v.amount); }
  else if (tipo === 'DelegateResource') { f.a = b58(v.receiver_address); f.trx = trx(v.balance); f.recurso = v.resource || 'BANDWIDTH'; f.bloqueo = !!v.lock; if (v.lock_period) f.periodo_bloqueo = v.lock_period; }
  else if (tipo === 'UnDelegateResource') { f.a = b58(v.receiver_address); f.trx = trx(v.balance); f.recurso = v.resource || 'BANDWIDTH'; }
  else if (tipo === 'FreezeBalanceV2') { f.trx = trx(v.frozen_balance); f.recurso = v.resource || 'BANDWIDTH'; }
  else if (tipo === 'UnfreezeBalanceV2') { f.trx = trx(v.unfreeze_balance); f.recurso = v.resource || 'BANDWIDTH'; }
  else if (tipo === 'VoteWitness') { f.votos = (v.votes || []).map(x => ({ para: b58(x.vote_address), n: x.vote_count })); }
  else if (tipo === 'TriggerSmart') { f.a = b58(v.contract_address); f.trx = trx(v.call_value); f.datos = (v.data || '').slice(0, 8); f.datos_len = (v.data || '').length / 2; }
  else if (tipo === 'AccountPermissionUpdate') { f.permisos = { propietario: v.owner, activos: v.actives }; }
  else if (tipo === 'TransferAsset') { f.a = b58(v.to_address); f.activo = v.asset_name; f.cantidad = v.amount; }
  else { f.valor = v; }
  return f;
}
// Historial de transacciones de una cuenta (TRX/stake/contratos) entre dos instantes (ms UTC). Devuelve filas decodificadas.
async function txCuenta(dir, o) {
  o = o || {}; const desde = o.desde || 0, hasta = o.hasta || Date.now(); const out = []; let pag = 0, hayMas = true;
  const base = TG + '/v1/accounts/' + dir + '/transactions?limit=200&only_confirmed=true&order_by=block_timestamp,asc&min_timestamp=' + desde + '&max_timestamp=' + hasta;
  let url = base;
  let truncado = false;
  while (url) { const j = await L.get(url); pag++; if (!j || !j.data) { if (j && j.success === false) throw new Error('TronGrid: ' + JSON.stringify(j).slice(0, 200)); break; } for (const t of j.data) { const f = decodificar(t); if (o.energia) f.e = { uso: t.energy_usage || 0, fee: t.energy_fee || 0, total: t.energy_usage_total || 0, red: t.net_usage || 0, red_fee: t.net_fee || 0 }; out.push(f); } url = j.meta && j.meta.fingerprint ? base + '&fingerprint=' + j.meta.fingerprint : null; if (url && o.maxPaginas && pag >= o.maxPaginas) { truncado = true; break; } }
  return { filas: out, paginas: pag, truncado };
}
// Transferencias TRC-20 de una cuenta (USDT, etc.) entre dos instantes.
async function trc20Cuenta(dir, o) {
  o = o || {}; const desde = o.desde || 0, hasta = o.hasta || Date.now(); const out = []; let pag = 0;
  const base = TG + '/v1/accounts/' + dir + '/transactions/trc20?limit=200&only_confirmed=true&order_by=block_timestamp,asc&min_timestamp=' + desde + '&max_timestamp=' + hasta + (o.contrato ? '&contract_address=' + o.contrato : '');
  let url = base;
  while (url) { const j = await L.get(url); pag++; if (!j || !j.data) break; for (const t of j.data) out.push({ tx: t.transaction_id, t: t.block_timestamp, de: t.from, a: t.to, simbolo: t.token_info && t.token_info.symbol, contrato: t.token_info && t.token_info.address, cantidad: Number(t.value) / Math.pow(10, (t.token_info && t.token_info.decimals) || 0) }); url = j.meta && j.meta.fingerprint ? base + '&fingerprint=' + j.meta.fingerprint : null; }
  return { filas: out, paginas: pag };
}
const iso = ms => new Date(ms).toISOString().replace('.000Z', 'Z');
module.exports = { txCuenta, trc20Cuenta, decodificar, iso, trx };
