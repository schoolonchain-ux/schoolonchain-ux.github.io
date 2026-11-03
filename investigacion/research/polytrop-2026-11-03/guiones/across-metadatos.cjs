'use strict';
// Metadatos de las llamadas a Across en TRON: contrato llamado, función (4 primeros bytes), tamaño de los datos, marca de «integrator id» de Across (delimitador 1dc0de + 2 bytes al final de los datos),
// límite de comisión, caducidad frente a la hora del bloque, energía/ancho de banda y quién los pagó. Compara llamadas del ladrón (30-oct) con las de usuarios anteriores. Solo lectura, TronGrid sin clave.
const fs = require('fs'); const path = require('path'); const sl = ms => new Promise(r => setTimeout(r, ms));
const D = path.join(__dirname, '..', 'datos') + '/'; const o = JSON.parse(fs.readFileSync(D + 'across-ejecutor.json', 'utf8')); const EJ = 'TANdmAmc5jyNEFB1gXbEBfaG7Ftj1XNUG1';
const AL = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const b58 = hex => { const b = Buffer.from(hex, 'hex'); const c = require('crypto'); const h = c.createHash('sha256').update(c.createHash('sha256').update(b).digest()).digest().slice(0, 4); let n = BigInt('0x' + Buffer.concat([b, h]).toString('hex')), s = ''; while (n > 0n) { s = AL[Number(n % 58n)] + s; n /= 58n; } return s; };
async function post(u, v) { for (let i = 0; i < 4; i++) { try { const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ value: v }), signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sl(2500 * (i + 1)); continue; } return await r.json(); } catch { await sl(1500); } } return null; }
const ev = o.usoPrevio.filter(e => e.tipo === 'Transfer' && e.a === EJ && e.de !== EJ);
const pick = []; const vistos = new Set(); for (const e of ev) { if (vistos.has(e.tx)) continue; vistos.add(e.tx); pick.push(e); }
const quienes = ['TCSvYrAhw', 'TGTRJoQtg', 'TDzNk9PZw', 'TX7DqFHBC', 'TDk9Ho4PY', 'TZ274LXvx', 'TAfpoKQJf', 'TB6QHSqmo', 'TF8hfWoLx'];
(async () => {
  const filas = [];
  for (const q of quienes) { const lista = pick.filter(e => e.de.startsWith(q)).slice(0, 2); for (const e of lista) {
    const t = await post('https://api.trongrid.io/wallet/gettransactionbyid', e.tx); await sl(1100); const i = await post('https://api.trongrid.io/wallet/gettransactioninfobyid', e.tx); await sl(1100); if (!t || !t.raw_data) continue;
    const c = t.raw_data.contract[0], v = c.parameter.value; const data = v.data || ''; const k = data.toLowerCase().lastIndexOf('1dc0de');
    filas.push({ quien: q, tx: e.tx, hora: new Date(e.t).toISOString().slice(0, 19), llamaA: v.contract_address ? b58(v.contract_address) : null, funcion: data.slice(0, 8), bytesDatos: data.length / 2, marcaIntegrador: k >= 0 && k >= data.length - 24 ? data.slice(k, k + 12) : (k >= 0 ? 'presente_en_' + k / 2 : 'no'), feeLimitTRX: t.raw_data.fee_limit ? t.raw_data.fee_limit / 1e6 : null, caducaTrasMin: ((t.raw_data.expiration - t.raw_data.timestamp) / 60000).toFixed(1), energiaTotal: i && i.receipt && i.receipt.energy_usage_total, energiaPropia: i && i.receipt && i.receipt.energy_usage, energiaPagadaTRX: i && i.receipt && i.receipt.energy_fee ? i.receipt.energy_fee / 1e6 : 0, origenEnergia: i && i.receipt && i.receipt.origin_energy_usage, anchoBanda: i && i.receipt && i.receipt.net_usage, comisionTRX: i && i.fee ? i.fee / 1e6 : 0 }); } }
  fs.writeFileSync(D + 'across-metadatos.json', JSON.stringify(filas, null, 1)); for (const f of filas) console.log(JSON.stringify(f));
})();
