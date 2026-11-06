/* Núcleo compartido del comprobador de bloqueos de USDT: direcciones (base58 de TRON ↔ hex), lectura de nodos públicos
   y la consulta «¿está bloqueada esta dirección en esta red?». Lo usan la página de herramientas (herramientas.js) y los
   laterales de la portada (lados.js). Todo se lee en vivo desde el navegador; no hay claves y no se guarda nada. */
(function () {
  const TRON_USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
  const GRID = 'https://api.trongrid.io';
  const ETH_USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

  /* ---------- direcciones: base58 / hex ---------- */
  const A58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const sha = async (b) => new Uint8Array(await crypto.subtle.digest('SHA-256', b));
  function b58dec(s) { let x = 0n; for (const c of s) { const i = A58.indexOf(c); if (i < 0) return null; x = x * 58n + BigInt(i); } let h = x.toString(16); if (h.length % 2) h = '0' + h; const by = h === '0' ? [] : h.match(/../g).map((v) => parseInt(v, 16)); let z = 0; for (const c of s) { if (c === '1') z++; else break; } return Uint8Array.from([...new Array(z).fill(0), ...by]); }
  function b58enc(by) { let x = 0n; for (const b of by) x = x * 256n + BigInt(b); let s = ''; while (x > 0n) { s = A58[Number(x % 58n)] + s; x /= 58n; } for (const b of by) { if (b === 0) s = '1' + s; else break; } return s; }
  async function tronAHex20(t) { const b = b58dec(t); if (!b || b.length !== 25 || b[0] !== 0x41) return null; const c = await sha(await sha(b.slice(0, 21))); for (let i = 0; i < 4; i++) if (c[i] !== b[21 + i]) return null; return [...b.slice(1, 21)].map((v) => v.toString(16).padStart(2, '0')).join(''); }
  async function hex20ATron(h) { const p = Uint8Array.from([0x41, ...h.replace(/^0x/, '').match(/../g).map((v) => parseInt(v, 16))]); const c = await sha(await sha(p)); return b58enc(Uint8Array.from([...p, ...c.slice(0, 4)])); }
  const esEvm = (s) => /^0x[0-9a-fA-F]{40}$/.test(s);
  const pareceTron = (s) => /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(s);
  const parecePrivada = (s) => /^(0x)?[0-9a-fA-F]{64}$/.test(s) || s.split(/\s+/).length >= 12;

  /* ---------- red ---------- */
  async function json(url, opt = {}, ms = 9000) {
    const r = await fetch(url, { ...opt, signal: AbortSignal.timeout(ms) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  async function jsonReintento(url, opt = {}, ms = 9000, intentos = 4) {
    let ult;
    for (let i = 1; i <= intentos; i++) { try { return await json(url, opt, ms); } catch (e) { ult = e; if (!/429|50d/.test(String(e.message))) throw e; await dormir(1300 * i); } }
    throw ult;
  }
  async function rpc(urls, method, params, ms = 8000) {
    let ult;
    for (const u of urls) {
      try { const j = await json(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }, ms); if (j.error) throw new Error(j.error.message || 'RPC'); return j.result; } catch (e) { ult = e; }
    }
    throw ult || new Error('sin respuesta');
  }
  const pad32 = (a) => a.replace(/^0x/, '').toLowerCase().padStart(64, '0');
  async function tronCall(selector, hex20) {
    const j = await json(GRID + '/wallet/triggerconstantcontract', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ owner_address: TRON_USDT, contract_address: TRON_USDT, function_selector: selector, parameter: pad32(hex20), visible: true }) });
    if (!j.constant_result || !j.constant_result[0]) throw new Error('sin resultado');
    return j.constant_result[0];
  }
  const aBool = (h) => /[1-9a-f]/i.test(h.replace(/^0x/, ''));
  const aNum = (h) => Number(BigInt('0x' + (h.replace(/^0x/, '') || '0'))) / 1e6;

  // consulta una red: { estado:'bloqueada'|'libre'|'error', saldo? }
  async function consultar(red, dir) {
    try {
      let bloq, hex = null;
      if (red.tipo === 'tron') { hex = await tronAHex20(dir); if (!hex) return { estado: 'error', motivo: 'dirección TRON no válida' }; bloq = aBool(await tronCall('isBlackListed(address)', hex)); }
      else bloq = aBool(await rpc(red.rpc, 'eth_call', [{ to: red.contrato, data: '0x' + red.selector + pad32(dir) }, 'latest']));
      let saldo = null;
      if (bloq) { try { saldo = red.tipo === 'tron' ? aNum(await tronCall('balanceOf(address)', hex)) : aNum(await rpc(red.rpc, 'eth_call', [{ to: red.contrato, data: '0x70a08231' + pad32(dir) }, 'latest'])); } catch (e) { /* sin saldo */ } }
      return { estado: bloq ? 'bloqueada' : 'libre', saldo };
    } catch (e) { return { estado: 'error', motivo: String(e.message || e).slice(0, 60) }; }
  }

  // lista de redes (data/redes-usdt.json), leída una sola vez
  let redesP = null;
  const redes = () => (redesP ||= json('data/redes-usdt.json').then((j) => (j && Array.isArray(j.redes) ? j.redes : [])).catch(() => { redesP = null; return []; }));

  // últimos bloqueos/liberaciones de Tether en TRON (eventos del contrato, hasta 100) y en Ethereum (registros de los últimos `spanEth` bloques)
  async function recientes({ spanEth = 20000, tronLimite = 100, marcasEth = 8 } = {}) {
    const filas = []; const avisos = [];
    const tronEv = async (ev, tipo) => { const j = await jsonReintento(GRID + '/v1/contracts/' + TRON_USDT + '/events?event_name=' + ev + '&only_confirmed=true&limit=' + tronLimite + '&order_by=block_timestamp,desc'); for (const d of j.data || []) { const u = d.result && (d.result._user || d.result['0']); if (!u) continue; filas.push({ t: d.block_timestamp, red: 'TRON', tipo, dirHex: u, tx: d.transaction_id }); } };
    const ethLogs = async () => {
      const urls = ['https://rpc.mevblocker.io'];
      const ult = parseInt(await rpc(urls, 'eth_blockNumber', []), 16);
      const logs = await rpc(urls, 'eth_getLogs', [{ fromBlock: '0x' + (ult - spanEth).toString(16), toBlock: 'latest', address: ETH_USDT, topics: [['0x42e160154868087d6bfdc0ca23d96a1c1cfa32f1b72ba9ba27b69b98a0d819dc', '0xd7e9ec6e6ecd65492dce6bf513cd6867560d49544421d0783ddf06e76c24470c']] }], 25000);
      const ordenados = [...logs].sort((a, b) => parseInt(b.blockNumber, 16) - parseInt(a.blockNumber, 16));
      const bloques = [...new Set(ordenados.slice(0, marcasEth).map((l) => l.blockNumber))]; const ts = {};
      await Promise.all(bloques.map(async (b) => { try { const bl = await rpc(urls, 'eth_getBlockByNumber', [b, false]); ts[b] = parseInt(bl.timestamp, 16) * 1000; } catch (e) { /* se estima abajo */ } }));
      for (const l of ordenados) filas.push({ t: ts[l.blockNumber] || Date.now() - (ult - parseInt(l.blockNumber, 16)) * 12000, estimado: !ts[l.blockNumber], red: 'Ethereum', tipo: l.topics[0].startsWith('0x42e16') ? 'Bloqueada' : 'Liberada', dirEvm: '0x' + (l.topics[1] || l.data).slice(-40), tx: l.transactionHash });
    };
    const rs = await Promise.allSettled([tronEv('AddedBlackList', 'Bloqueada'), tronEv('RemovedBlackList', 'Liberada'), ethLogs()]);
    if (rs[0].status === 'rejected' && rs[1].status === 'rejected') avisos.push('TRON');
    if (rs[2].status === 'rejected') avisos.push('Ethereum');
    for (const f of filas) f.dir = f.dirEvm || await hex20ATron(f.dirHex);
    filas.sort((a, b) => b.t - a.t);
    return { filas, avisos, leidoEn: Date.now() };
  }

  window.USDT = { TRON_USDT, GRID, ETH_USDT, b58dec, b58enc, tronAHex20, hex20ATron, esEvm, pareceTron, parecePrivada, json, dormir, jsonReintento, rpc, pad32, tronCall, aBool, aNum, consultar, redes, recientes };
})();
