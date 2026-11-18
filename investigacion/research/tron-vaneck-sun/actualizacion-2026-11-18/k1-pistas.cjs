'use strict';
// Solo lectura (TronGrid). Seguimiento del 18-nov-2026, pistas que quedaron abiertas:
//  P1 · movimientos de TKpiitwG… desde el 13-nov (TRX y TRC20)        P2 · quién es TU4vEruv… (la cuenta a la que la cuenta de energía dio 150 M TRX de energía el 8-nov)
//  P3 · las dos transacciones que cambian firmantes (TSzSgxRi… 12-nov, TU3rMHyW… 13-nov) y los permisos que tienen ahora
//  P4 · la operación de la segunda cuenta del 13-nov 14:37:03 UTC en el par stUSDT/USDT de sun.io V2
// Guarda todo en bruto. Uso: node k1-pistas.cjs <salida.json>
const fs = require('node:fs'), c = require('node:crypto');
const A = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const b58 = (h) => { const b = Buffer.from(h, 'hex'); const ck = c.createHash('sha256').update(c.createHash('sha256').update(b).digest()).digest().subarray(0, 4); let n = BigInt('0x' + Buffer.concat([b, ck]).toString('hex')); let s = ''; while (n > 0n) { s = A[Number(n % 58n)] + s; n /= 58n; } return s; };
const pausa = (ms) => new Promise((r) => setTimeout(r, ms)), crudo = [];
// Una respuesta vacía NO es un dato: «valida» dice si la respuesta sirve; si no, se reintenta y al final se falla.
async function pide(url, body, valida) {
  for (let i = 0; i < 8; i++) {
    if (i) await pausa(2500);
    try { const r = await fetch(url, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : undefined); if (!r.ok) continue; const j = await r.json(); if (valida(j)) { crudo.push({ url, body: body || null, respuesta: j }); return j; } } catch (e) {}
  }
  throw new Error('TronGrid no dio una respuesta válida: ' + url + ' ' + JSON.stringify(body || ''));
}
const G = 'https://api.trongrid.io';
async function paginas(url) { let out = [], fp = ''; for (let i = 0; i < 40; i++) { const j = await pide(url + (fp ? '&fingerprint=' + fp : ''), null, (x) => x && x.success === true && Array.isArray(x.data)); out = out.concat(j.data); fp = j.meta && j.meta.fingerprint; await pausa(600); if (!fp) return { filas: out, completo: true }; } return { filas: out, completo: false }; }
const cuenta = (a) => pide(G + '/wallet/getaccount', { address: a, visible: true }, (x) => x && x.address === a);
const tx = (h) => pide(G + '/wallet/gettransactionbyid', { value: h, visible: true }, (x) => x && x.txID === h);
const info = (h) => pide(G + '/wallet/gettransactioninfobyid', { value: h }, (x) => x && x.id === h);
const permisos = (c0) => ({ owner: c0.owner_permission ? { umbral: c0.owner_permission.threshold, claves: c0.owner_permission.keys.map((k) => ({ direccion: k.address, peso: k.weight })) } : null, activos: (c0.active_permission || []).map((p) => ({ id: p.id, nombre: p.permission_name, umbral: p.threshold, operaciones: p.operations, claves: p.keys.map((k) => ({ direccion: k.address, peso: k.weight })) })), testigo: c0.witness_permission || null });
(async () => {
  const salida = process.argv[2]; if (!salida) throw new Error('Uso: node k1-pistas.cjs <salida.json>');
  const DESDE = Date.parse('2026-11-13T00:00:00Z'), res = { version: 1, leidoEn: new Date().toISOString(), fuente: 'TronGrid (solo lectura)', desde: new Date(DESDE).toISOString() };

  // P1
  const K = 'TKpiitwGUuW5WgsBMg5w5QWUpC6nUTroqa', kt = await paginas(G + '/v1/accounts/' + K + '/transactions?limit=200&order_by=block_timestamp,asc&min_timestamp=' + DESDE), k20 = await paginas(G + '/v1/accounts/' + K + '/transactions/trc20?limit=200&order_by=block_timestamp,asc&min_timestamp=' + DESDE), kc = await cuenta(K);
  res.p1 = { cuenta: K, creada: new Date(kc.create_time).toISOString(), libreTrx: (kc.balance || 0) / 1e6, completo: kt.completo && k20.completo,
    transacciones: kt.filas.map((t) => { const ct = t.raw_data.contract[0], v = ct.parameter.value; return { hora: new Date(t.block_timestamp).toISOString(), tipo: ct.type, de: v.owner_address ? b58(v.owner_address) : null, a: v.to_address ? b58(v.to_address) : (v.contract_address ? b58(v.contract_address) : null), trx: v.amount != null ? v.amount / 1e6 : null, resultado: t.ret && t.ret[0] && t.ret[0].contractRet, tx: t.txID }; }),
    trc20: k20.filas.map((t) => ({ hora: new Date(t.block_timestamp).toISOString(), token: t.token_info && t.token_info.symbol, decimales: t.token_info && t.token_info.decimals, de: t.from, a: t.to, valor: t.value, tx: t.transaction_id })) };

  // P2
  const U4 = 'TU4vEruvZwLLkSfV9bNw12EJTPvNr7Pvaa', uc = await cuenta(U4);   // su historial no se lee: tiene decenas de millones de transacciones y ya estaba identificada el 5-nov (receptores-81.json)
  const d = await tx('d1d5d3806c8343c52a91f7940df529291c29fa5ec5689ae6f5fa2383b45b8658'), dv = d.raw_data.contract[0];
  res.p2 = { cuenta: U4, creada: uc.create_time ? new Date(uc.create_time).toISOString() : null, libreTrx: (uc.balance || 0) / 1e6, esContrato: uc.type === 'Contract', permisos: permisos(uc), energiaRecibidaTrx: ((uc.account_resource || {}).acquired_delegated_frozenV2_balance_for_energy || 0) / 1e6,
    delegacion: { tx: d.txID, hora: new Date(d.raw_data.timestamp).toISOString(), tipo: dv.type, de: dv.parameter.value.owner_address, a: dv.parameter.value.receiver_address, trx: (dv.parameter.value.balance || 0) / 1e6, recurso: dv.parameter.value.resource || 'BANDWIDTH', bloqueada: !!dv.parameter.value.lock } };

  // P3
  res.p3 = [];
  for (const [a, h] of [['TSzSgxRisS5VBXXDcAezTDvnPGi9CbsXvJ', 'd549741db9d81e01975ced9e25ebe37a3e0842cb3add450153eb4edb8be21f03'], ['TU3rMHyWHzeEJBReWLzHko728hbz6MtfNg', 'd8758f857d6879c9481acdeb61007b58b7df1407165cf91bd5efe989db7c9cca']]) {
    const t = await tx(h), i = await info(h), ct = t.raw_data.contract[0], v = ct.parameter.value, ahora = await cuenta(a); await pausa(600);
    res.p3.push({ cuenta: a, tx: h, hora: new Date(i.blockTimeStamp).toISOString(), tipo: ct.type, permisoUsado: ct.Permission_id || 0, firmas: (t.signature || []).length,
      nuevo: ct.type === 'AccountPermissionUpdateContract' ? { owner: v.owner ? { umbral: v.owner.threshold, claves: v.owner.keys.map((k) => ({ direccion: k.address, peso: k.weight })) } : null, activos: (v.actives || []).map((p) => ({ nombre: p.permission_name, umbral: p.threshold, operaciones: p.operations, claves: p.keys.map((k) => ({ direccion: k.address, peso: k.weight })) })) } : null,
      permisosEnLaLectura: permisos(ahora) });
  }

  // P4
  const h4 = '0e1943ba5a65e6a33eb35d365129c8b6142e55147faa6e8291274ffe28b3a16b', t4 = await tx(h4), i4 = await info(h4), TRANSFER = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  res.p4 = { tx: h4, hora: new Date(i4.blockTimeStamp).toISOString(), bloque: i4.blockNumber, resultado: i4.receipt && i4.receipt.result, firmante: t4.raw_data.contract[0].parameter.value.owner_address, contrato: t4.raw_data.contract[0].parameter.value.contract_address, selector: (t4.raw_data.contract[0].parameter.value.data || '').slice(0, 8),
    traspasos: (i4.log || []).filter((l) => l.topics[0] === TRANSFER && l.topics.length === 3).map((l) => ({ token: b58('41' + l.address), de: b58('41' + l.topics[1].slice(24)), a: b58('41' + l.topics[2].slice(24)), valor: BigInt('0x' + (l.data || '0')).toString() })) };

  fs.writeFileSync(salida, JSON.stringify(res, null, 1)); fs.writeFileSync(salida.replace(/\.json$/, '.crudo.json'), JSON.stringify(crudo));
  console.log('P1', res.p1.creada, res.p1.libreTrx, 'tx', res.p1.transacciones.length, 'trc20', res.p1.trc20.length, 'completo', res.p1.completo);
  for (const t of res.p1.transacciones) console.log('  ', t.hora.slice(5, 16), t.tipo.replace('Contract', ''), t.trx, t.de === K ? '-> ' + t.a : '<- ' + t.de, t.resultado);
  for (const t of res.p1.trc20) console.log('  ', t.hora.slice(5, 16), t.token, Number(BigInt(t.valor) / 10n ** BigInt(t.decimales || 0)), t.de === K ? '-> ' + t.a : '<- ' + t.de);
  console.log('P2', JSON.stringify(res.p2));
  console.log('P3', JSON.stringify(res.p3));
  console.log('P4', JSON.stringify(res.p4));
})().catch((e) => { console.error('FALLO', e.message); process.exit(1); });
