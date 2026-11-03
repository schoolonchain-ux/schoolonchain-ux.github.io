'use strict';
// Comprueba en Etherscan (y Arbiscan vía Etherscan v2) que cada llegada que dicen Symbiosis y Chainflip ocurrió: el receptor aparece con esa transacción y ese importe (±0,5 %).
// ETH llega como transferencia interna del contrato → txlistinternal del receptor; USDT/USDC como transferencia de token → tokentx del receptor. Solo lectura.
// Uso: node verificar-llegadas-evm.cjs <carpeta-del-tramo>  → <tramo>/llegadas-verificadas.json  { "<hash de la transacción de llegada>": { ok, importeEncontrado, fuente } }
const fs = require('node:fs'); const path = require('node:path');
const { loadEtherscanKey } = require('../../tether-blacklist/src/adapters/bot.cjs'); const K = loadEtherscanKey({ file: path.join(__dirname, '..', '..', 'tether-blacklist', 'config.secret.json') });
const dir = process.argv[2]; if (!dir) { console.error('uso: node verificar-llegadas-evm.cjs <carpeta-del-tramo>'); process.exit(1); }
const sleep = ms => new Promise(r => setTimeout(r, ms)); const lc = x => String(x || '').toLowerCase(); const CHAIN = { Ethereum: 1, Arbitrum: 42161 };
async function api(chainid, params) { for (let i = 0; i < 6; i++) { try { const r = await fetch('https://api.etherscan.io/v2/api?' + new URLSearchParams({ chainid, apikey: K.key, ...params }), { signal: AbortSignal.timeout(40000) }); const j = await r.json(); if (j.status === '1') return j.result; if (/No transactions found|No records found/i.test(String(j.message))) return []; await sleep(1300 * (i + 1)); } catch { await sleep(1300 * (i + 1)); } } return null; }
(async () => {
  const esperadas = []; // { hash, receptor, importe, activo, cadena }
  const fS = path.join(dir, 'symbiosis-llegadas.json'); if (fs.existsSync(fS)) for (const s of Object.values(JSON.parse(fs.readFileSync(fS, 'utf8')))) { const l = s && s.llegada; if (l && s.estado === 'Success' && (l.cadena === 1 || l.cadena === 42161) && ['ETH', 'USDT', 'USDC'].includes(l.activo)) esperadas.push({ hash: lc(l.tx), receptor: lc(l.receptor), importe: l.importe, activo: l.activo, cadena: l.cadena }); }
  const fC = path.join(dir, 'chainflip-llegadas.json'); if (fs.existsSync(fC)) for (const s of Object.values(JSON.parse(fs.readFileSync(fC, 'utf8')))) { if (!s.nuestro || !s.salida || !s.salida.tx) continue; const m = /^(Ethereum|Arbitrum) (ETH|USDT|USDC)$/.exec(s.destino); if (!m) continue; const dec = m[2] === 'ETH' ? 18 : 6; esperadas.push({ hash: lc(s.salida.tx), receptor: lc(s.direccionDestino), importe: Number(BigInt(s.salida.importe)) / 10 ** dec, activo: m[2], cadena: CHAIN[m[1]] }); }
  const out = path.join(dir, 'llegadas-verificadas.json'); let S = {}; try { S = JSON.parse(fs.readFileSync(out, 'utf8')); } catch { /* primera vez */ }
  const grupos = new Map(); for (const e of esperadas) { if (S[e.hash] && S[e.hash].ok !== undefined) continue; const k = e.cadena + '|' + e.receptor + '|' + (e.activo === 'ETH' ? 'eth' : 'tok'); (grupos.get(k) || grupos.set(k, []).get(k)).push(e); }
  console.log('llegadas a comprobar', esperadas.length, '| consultas (receptor × tipo)', grupos.size); let n = 0;
  for (const [k, lista] of grupos) { const [cadena, receptor, tipo] = k.split('|'); const r = tipo === 'eth' ? await api(+cadena, { module: 'account', action: 'txlistinternal', address: receptor, startblock: 0, endblock: 99999999, page: 1, offset: 1000, sort: 'asc' }) : await api(+cadena, { module: 'account', action: 'tokentx', address: receptor, page: 1, offset: 1000, sort: 'asc' }); await sleep(230);
    for (const e of lista) { if (!Array.isArray(r)) { S[e.hash] = { ok: undefined, error: 'sin lectura' }; continue; }
      // normales: transferencia interna cuyo destino es el receptor, en esa transacción; tokens: contrato genuino omitido (se comprueba hash + receptor + importe)
      const c = r.filter(t => lc(t.hash) === e.hash && lc(t.to) === e.receptor); let hallado = 0; for (const t of c) { const v = tipo === 'eth' ? Number(t.value) / 1e18 : Number(t.value) / 10 ** Number(t.tokenDecimal || 6); hallado += v; }
      const ok = c.length > 0 && Math.abs(hallado - e.importe) <= Math.max(1e-9, e.importe * 0.005); S[e.hash] = { ok, importeEncontrado: hallado, esperado: e.importe, fuente: 'Etherscan v2 ' + (tipo === 'eth' ? 'txlistinternal' : 'tokentx') + ' del receptor' }; }
    if (++n % 25 === 0) { fs.writeFileSync(out, JSON.stringify(S)); console.log('  …', n, '/', grupos.size); } }
  fs.writeFileSync(out, JSON.stringify(S)); const v = Object.values(S); console.log('verificadas', v.filter(x => x.ok === true).length, '| no cuadran', v.filter(x => x.ok === false).length, '| sin lectura', v.filter(x => x.ok === undefined).length);
})();
