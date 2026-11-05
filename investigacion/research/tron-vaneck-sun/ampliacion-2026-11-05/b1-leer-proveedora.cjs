'use strict';
// LÍNEA B · B1 — Lectura COMPLETA de la proveedora TWhDfwC8… (creada 2023-11-28) hasta la línea base: (a) transacciones nativas (guardamos las transferencias de TRX fila a fila y contamos el resto por tipo y día),
// (b) todas las transferencias TRC-20 (USDT y otras). Por tamaño (≈3,4 M filas) NO se archivan las páginas en bruto: se guarda cada fila ya reducida (fecha, hash, de, a, importe) y la HUELLA SHA-256 de cada página
// (pages.jsonl) para poder volver a descargar y comprobar. Se reanuda solo si se corta (estado.json). SOLO LECTURA.
// Uso: node b1-leer-proveedora.cjs        (hasta terminar; muestra progreso en progreso.txt)
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'); const b58 = require('./b58.cjs');
const OUT = path.join(__dirname, 'b-proveedora'); fs.mkdirSync(path.join(OUT, 'datos'), { recursive: true }); const TG = 'https://api.trongrid.io'; const PROV = 'TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2';
const ancla = JSON.parse(fs.readFileSync(path.join(__dirname, 'linea-base', 'anclas.json'), 'utf8')); const HASTA = Date.parse(ancla.bloque_hora_utc);
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs'); const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' }); const H = { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronGridKey };
const sleep = ms => new Promise(r => setTimeout(r, ms)); const sha = s => crypto.createHash('sha256').update(s).digest('hex'); const EST = path.join(OUT, 'estado.json');
let est = fs.existsSync(EST) ? JSON.parse(fs.readFileSync(EST, 'utf8')) : { hasta_ms: HASTA, tx: { fp: null, paginas: 0, filas: 0, fin: false }, trc20: { fp: null, paginas: 0, filas: 0, fin: false }, tipos_por_dia: {} };
if (est.hasta_ms !== HASTA) throw new Error('la línea base cambió: borra b-proveedora/ para empezar de nuevo');
const guardarEst = () => fs.writeFileSync(EST, JSON.stringify(est));
async function pagina(url) { for (let i = 0; i < 8; i++) { await sleep(130); try { const r = await fetch(url, { headers: H, signal: AbortSignal.timeout(40000) }); if (r.status === 429 || r.status >= 500) { await sleep(2500 * (i + 1)); continue; } const txt = await r.text(); return { txt, j: JSON.parse(txt) }; } catch (e) { await sleep(2000 * (i + 1)); } } throw new Error('sin respuesta: ' + url); }
async function leer(nombre, base, fila) {
  const s = est[nombre]; if (s.fin) return; const fT = path.join(OUT, 'datos', nombre + '.jsonl'), fP = path.join(OUT, 'pages.jsonl');
  while (true) {
    const url = base + (s.fp ? '&fingerprint=' + s.fp : ''); const { txt, j } = await pagina(url); if (!j || j.success === false) throw new Error('TronGrid: ' + txt.slice(0, 200));
    const data = j.data || []; let out = '', t0 = null, t1 = null; for (const t of data) { const r = fila(t); if (r) out += JSON.stringify(r) + '\n'; const ts = Number(t.block_timestamp); t0 = t0 === null || ts < t0 ? ts : t0; t1 = t1 === null || ts > t1 ? ts : t1; }
    if (out) fs.appendFileSync(fT, out); fs.appendFileSync(fP, JSON.stringify({ flujo: nombre, n: s.paginas + 1, sha256: sha(txt), filas: data.length, desde: t0, hasta: t1 }) + '\n');
    s.paginas++; s.filas += data.length; s.fp = (j.meta && j.meta.fingerprint) || null; if (!s.fp) s.fin = true; guardarEst();
    if (s.paginas % 50 === 0) fs.writeFileSync(path.join(OUT, 'progreso.txt'), new Date().toISOString() + ' ' + nombre + ' pág ' + s.paginas + ' filas ' + s.filas + ' hasta ' + (t1 ? new Date(t1).toISOString() : '') + '\n', { flag: 'a' });
    if (s.fin) break;
  }
}
const filaTx = t => { const c = t.raw_data.contract[0], v = c.parameter.value, tipo = c.type.replace('Contract', ''); const ok = !!(t.ret && t.ret[0] && t.ret[0].contractRet === 'SUCCESS'); const dia = new Date(Number(t.block_timestamp)).toISOString().slice(0, 10); const d = est.tipos_por_dia[dia] = est.tipos_por_dia[dia] || {}; d[tipo + (ok ? '' : '!')] = (d[tipo + (ok ? '' : '!')] || 0) + 1; if (tipo === 'Transfer' && ok) return { t: Number(t.block_timestamp), tx: t.txID, de: b58(v.owner_address), a: b58(v.to_address), sun: v.amount }; return null; };
const filaTk = t => ({ t: Number(t.block_timestamp), tx: t.transaction_id, de: t.from, a: t.to, c: t.token_info && t.token_info.address, s: t.token_info && t.token_info.symbol, d: t.token_info && t.token_info.decimals, v: t.value });
(async () => {
  const p = 'limit=200&only_confirmed=true&order_by=block_timestamp,asc&min_timestamp=0&max_timestamp=' + HASTA;
  await leer('trc20', TG + '/v1/accounts/' + PROV + '/transactions/trc20?' + p, filaTk);
  await leer('tx', TG + '/v1/accounts/' + PROV + '/transactions?' + p, filaTx);
  fs.writeFileSync(path.join(OUT, 'progreso.txt'), new Date().toISOString() + ' TERMINADO tx ' + est.tx.filas + ' trc20 ' + est.trc20.filas + '\n', { flag: 'a' }); console.log('terminado', JSON.stringify({ tx: est.tx, trc20: est.trc20 }));
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
