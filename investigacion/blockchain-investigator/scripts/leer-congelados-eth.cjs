'use strict';
// Congelaciones y saldos HOY en las cadenas EVM del robo (Ethereum, Polygon, Avalanche): para cada token y dirección lee el saldo actual, pregunta al propio contrato si la dirección está bloqueada/congelada
// y busca el evento de bloqueo en los registros del contrato (hash, bloque y hora). Solo lectura. Salida: research/auditoria-adversarial-2026-10-31/resultados/congelados-multicadena.json
const fs = require('node:fs'); const path = require('node:path'); const { selector, keccakHex } = require('../../chainscope/src/core/keccak.cjs');
const { loadEtherscanKey } = require('../../tether-blacklist/src/adapters/bot.cjs'); const K = loadEtherscanKey({ file: path.join(__dirname, '..', '..', 'tether-blacklist', 'config.secret.json') }); if (!K.ok) { console.error(K.reason); process.exit(1); }
const sleep = ms => new Promise(r => setTimeout(r, ms)); const BASE = 'https://api.etherscan.io/v2/api';
async function api(chainid, params) { for (let i = 0; i < 6; i++) { try { const u = BASE + '?' + new URLSearchParams({ chainid, apikey: K.key, ...params }); const r = await fetch(u, { signal: AbortSignal.timeout(30000) }); const j = await r.json(); await sleep(260); if (j && typeof j.result === 'string' && /rate limit/i.test(j.result)) { await sleep(1500 * (i + 1)); continue; } return j; } catch { await sleep(1500 * (i + 1)); } } return { status: '0', message: 'sin respuesta' }; }
const pad = a => '0x' + '0'.repeat(24) + a.toLowerCase().replace(/^0x/, '');
const FN = ['isBlackListed(address)', 'isBlacklisted(address)', 'isBlocked(address)', 'isFrozen(address)', 'frozen(address)', 'blacklisted(address)', 'isBlocklisted(address)'];
async function estaBloqueada(chainid, token, dir) { for (const f of FN) { const j = await api(chainid, { module: 'proxy', action: 'eth_call', to: token, data: selector(f).replace(/^(0x)?/, '0x') + pad(dir).slice(2), tag: 'latest' }); const r = j && j.result; if (typeof r === 'string' && /^0x[0-9a-f]{64}$/.test(r)) return { funcion: f, bloqueada: BigInt(r) !== 0n }; } return { funcion: null, bloqueada: null }; }
async function saldo(chainid, token, dir, dec) { const j = await api(chainid, { module: 'account', action: 'tokenbalance', contractaddress: token, address: dir, tag: 'latest' }); const v = j && j.status === '1' ? Number(j.result) / Math.pow(10, dec) : null; return { saldo: v, error: v === null ? (j && (j.result || j.message)) : null }; }
async function eventoBloqueo(chainid, token, dir, nombres, desdeTs) {
  const b = await api(chainid, { module: 'block', action: 'getblocknobytime', timestamp: Math.floor(desdeTs / 1000), closest: 'before' }); const desde = Number(b.result) || 0;
  for (const nombre of nombres) { const t0 = '0x' + keccakHex(nombre + '(address)'); const j = await api(chainid, { module: 'logs', action: 'getLogs', address: token, topic0: t0, topic1: pad(dir), topic0_1_opr: 'and', fromBlock: desde, toBlock: 'latest' }); if (j && Array.isArray(j.result) && j.result.length) { const l = j.result[0]; return { evento: nombre, tx: l.transactionHash, bloque: parseInt(l.blockNumber, 16), t: parseInt(l.timeStamp, 16) * 1000 }; } }
  return null;
}
const D0 = Date.UTC(2026, 9, 29, 0, 0, 0); const A5227 = '0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c';
const TOK = [
  { cadena: 1, nombre: 'Ethereum', simbolo: 'USDT', contrato: '0xdac17f958d2ee523a2206206994597c13d831ec7', dec: 6, ev: ['AddedBlackList'] },
  { cadena: 1, nombre: 'Ethereum', simbolo: 'USDC', contrato: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', dec: 6, ev: ['Blacklisted'] },
  { cadena: 1, nombre: 'Ethereum', simbolo: 'XAUt', contrato: '0x68749665ff8d2d112fa859aa293f07a622782f38', dec: 6, ev: ['BlockPlaced', 'AddedBlackList'] },
  { cadena: 1, nombre: 'Ethereum', simbolo: 'USD1', contrato: '0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d', dec: 18, ev: ['Freeze', 'AddressFrozen', 'Blacklisted', 'AccountFrozen'] },
  { cadena: 1, nombre: 'Ethereum', simbolo: 'PAXG', contrato: '0x45804880de22913dafe09f4980848ece6ecbaf78', dec: 18, ev: ['FreezeAddress'] },
  { cadena: 1, nombre: 'Ethereum', simbolo: 'FDUSD', contrato: '0xc5f0f7b66764f6ec8c8dff7ba683102295e16409', dec: 18, ev: ['Freeze', 'AddressFrozen', 'Blacklisted'] },
  { cadena: 137, nombre: 'Polygon', simbolo: 'USDT0', contrato: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', dec: 6, ev: ['AddedBlackList', 'BlockPlaced', 'Blacklisted'] },
  { cadena: 43114, nombre: 'Avalanche', simbolo: 'USDt', contrato: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', dec: 6, ev: ['BlockPlaced', 'AddedBlackList'] },
];
const OTRAS_ETH = ['0x9749292d74fd460982d0912ea9515ea24736c762', '0x0ddf0480016e6bcb2c1f5d190d221fba1320697e', '0x8d53903625b8e839b9df4bd28b0efb1cd6b8639a', '0x7aa4d3029e4c6a8e916300014ad95b6d6c03bfd1', '0xaa246bf639586a6ba46762d378ce50ca4fc654a0', '0xccbef95633adb5cd2b5038db5a38d77e726ca263', '0xb171ca86f82070282138352ff7111b494060c8c3', '0x28c6c06298d514db089934071355e5743bf21d60'];
const ETH_QUIETO = JSON.parse(fs.readFileSync('C:/EquipoIA/research/binance-0x5227-2026-10-30/eth-saldos-21h.json', 'utf8')).filas;
(async () => {
  const R = { leidoEn: new Date().toISOString(), tokens: [], tetherEthereum: [], ethQuieto: [] };
  for (const t of TOK) { const dirs = t.simbolo === 'USDT' && t.cadena === 1 ? [A5227, ...OTRAS_ETH] : [A5227]; for (const d of dirs) { const s = await saldo(t.cadena, t.contrato, d, t.dec); const b = await estaBloqueada(t.cadena, t.contrato, d); const e = await eventoBloqueo(t.cadena, t.contrato, d, t.ev, D0); R.tokens.push({ cadena: t.nombre, simbolo: t.simbolo, contrato: t.contrato, direccion: d, saldoHoy: s.saldo, errorSaldo: s.error, bloqueadaHoy: b.bloqueada, funcionUsada: b.funcion, eventoBloqueo: e }); console.log(t.nombre.padEnd(9), t.simbolo.padEnd(5), d.slice(0, 10), 'saldo', s.saldo === null ? 'ERR ' + s.error : Math.round(s.saldo).toLocaleString('en'), '| bloqueada', b.bloqueada, '(' + b.funcion + ')', '| evento', e ? e.evento + ' ' + e.tx.slice(0, 12) + ' ' + new Date(e.t).toISOString().slice(5, 16) : 'no hallado'); } }
  for (const f of ETH_QUIETO) { const j = await api(1, { module: 'account', action: 'balance', address: f.a, tag: 'latest' }); R.ethQuieto.push({ nombre: f.nombre, direccion: f.a, a21h: f.ahora, hoy: j.status === '1' ? Number(j.result) / 1e18 : null }); console.log('ETH', f.nombre.padEnd(26), 'a las 21h', Math.round(f.ahora), 'hoy', j.status === '1' ? Math.round(Number(j.result) / 1e18) : 'ERR'); }
  fs.writeFileSync('C:/EquipoIA/research/auditoria-adversarial-2026-10-31/resultados/congelados-multicadena.json', JSON.stringify(R, null, 1)); console.log('guardado');
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
