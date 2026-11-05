'use strict';
// LÍNEA C · C3-C4 — (1) nombre de la función interna de cada llamada (ABI de DssProxyActions → selector); (2) USDD emitido y devuelto en cada llamada (eventos de la red);
// (3) ESTADO ACTUAL de las bóvedas (CDP) del apoderado TLLEN en el gestor DssCdpManager: colateral, deuda, tipo de colateral — leído con consultas al contrato, sin etiquetas.
// SOLO LECTURA. Reproducible: REPRODUCIR=1 node l3-boveda-estado-y-usdd.cjs (usa raw/l3-2026-11-05/ y la caché de l2).
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); const b58 = require('./b58.cjs'); const { selector } = require('./keccak.cjs');
const OUT = path.join(__dirname, 'l-contrato'); const TG = 'https://api.trongrid.io'; const rd = (...p) => JSON.parse(fs.readFileSync(path.join(__dirname, ...p), 'utf8'));
const TLL = 'TLLENiMpZvGZD2C1ZQ2FzBinrYevmGco6p', TT2 = 'TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N', DPA = 'TEk9usYZsunkc5oYijyMte6sGurspik2Js', MGR = 'TDDWjmQaquEtUn1Pa8wCd8dfWFPdQLGPYL';
const AL = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'; function deB58(s) { let n = 0n; for (const c of s) n = n * 58n + BigInt(AL.indexOf(c)); let h = n.toString(16); if (h.length % 2) h = '0' + h; return h; }
const addrWord = a => '000000000000000000000000' + deB58(a).slice(2, 42), uintWord = n => BigInt(n).toString(16).padStart(64, '0'), deW = (h, i) => h.slice(i * 64, i * 64 + 64);
const wad = (hex, dec) => Number(BigInt('0x' + hex)) / Math.pow(10, dec);
async function llamar(contrato, firma, args) { const q = await L.post(TG + '/wallet/triggerconstantcontract', { owner_address: TT2, contract_address: contrato, function_selector: firma, parameter: (args || []).join(''), visible: true }); return (q.constant_result && q.constant_result[0]) || null; }
(async () => {
  L.usar('l3-2026-11-05');
  // (1) selectores de DssProxyActions
  const k = await L.post(TG + '/wallet/getcontract', { value: DPA, visible: true }); const map = {}; for (const e of (k.abi && k.abi.entrys) || []) if (e.type === 'Function' || e.type === 'function' || e.inputs) { if (!e.name) continue; const sig = e.name + '(' + (e.inputs || []).map(i => i.type).join(',') + ')'; map[selector(sig)] = sig; }
  const libro = rd('l-contrato', 'tllen-libro-de-llamadas.json'); const calls = libro.llamadas;
  // (2) eventos de cada llamada (caché de l2)
  L.usar('l2-2026-11-05'); const filas = [];
  for (const c of calls) {
    const ev = await L.get(TG + '/v1/transactions/' + c.tx + '/events').catch(() => ({ data: [] })); const mov = [];
    for (const e of (ev.data || [])) { const r = e.result || {}; if (e.event_name === 'Transfer') { const de = r.from || r.src || r._from, a = r.to || r.dst || r._to, v = r.value !== undefined ? r.value : (r.wad !== undefined ? r.wad : r._value); mov.push({ contrato: e.contract_address, de, a, valor_bruto: String(v), claves: Object.keys(r) }); } }
    const info = await L.post(TG + '/wallet/gettransactioninfobyid', { value: c.tx }); const trx = (info.internal_transactions || []).filter(i => i.callValueInfo && i.callValueInfo[0] && i.callValueInfo[0].callValue).map(i => ({ de: b58(i.caller_address), a: b58(i.transferTo_address), trx: Number(i.callValueInfo[0].callValue) / 1e6 }));
    const deposito = trx.filter(i => i.a === 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR' && i.de === TLL).reduce((s, i) => s + i.trx, 0), retiro = trx.filter(i => i.de === 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR' && i.a === TLL).reduce((s, i) => s + i.trx, 0);
    filas.push({ t: c.t, tx: c.tx, ok: c.ok, llamador: c.llamador, funcion: map[c.funcion_interna] || c.funcion_interna || '(sin datos: llamada fallida)', trx_depositado_en_WTRX: deposito, trx_retirado_de_WTRX: retiro, transferencias_de_tokens: mov });
  }
  // (3) estado de las bóvedas de TLLEN
  L.usar('l3-2026-11-05'); const estado = { gestor: MGR }; const vat = await llamar(MGR, 'vat()'); estado.vat = vat ? b58('41' + vat.slice(24, 64)) : null; const cuenta = await llamar(MGR, 'count(address)', [addrWord(TLL)]); estado.n_boveda = cuenta ? Number(BigInt('0x' + cuenta)) : null;
  const first = await llamar(MGR, 'first(address)', [addrWord(TLL)]), last = await llamar(MGR, 'last(address)', [addrWord(TLL)]); estado.primera_boveda = first ? Number(BigInt('0x' + first)) : null; estado.ultima_boveda = last ? Number(BigInt('0x' + last)) : null;
  const bov = []; let cdp = estado.first_bov = estado.primera_boveda; let guard = 0;
  while (cdp && guard++ < 50) { const urn = await llamar(MGR, 'urns(uint256)', [uintWord(cdp)]), ilk = await llamar(MGR, 'ilks(uint256)', [uintWord(cdp)]), dueno = await llamar(MGR, 'owns(uint256)', [uintWord(cdp)]), lst = await llamar(MGR, 'list(uint256)', [uintWord(cdp)]);
    const o = { id: cdp, urn: urn ? b58('41' + urn.slice(24, 64)) : null, dueno: dueno ? b58('41' + dueno.slice(24, 64)) : null, tipo_de_colateral: ilk ? Buffer.from(ilk, 'hex').toString('utf8').replace(/\0+$/, '') : null, ilk_hex: ilk };
    if (estado.vat && ilk && urn) { const u = await llamar(estado.vat, 'urns(bytes32,address)', [ilk, addrWord(o.urn)]); const i = await llamar(estado.vat, 'ilks(bytes32)', [ilk]); if (u) { o.colateral_bloqueado = wad(deW(u, 0), 18); o.deuda_normalizada_art = wad(deW(u, 1), 18); } if (i) { o.rate = wad(deW(i, 1), 27); o.deuda_USDD = o.deuda_normalizada_art * o.rate; o.limite_de_deuda_global_del_tipo = wad(deW(i, 3), 45); } }
    bov.push(o); const next = lst ? Number(BigInt('0x' + lst.slice(64, 128))) : 0; cdp = next && next !== cdp ? next : 0; }
  estado.bovedas = bov;
  const resumen = { selectores_de_DssProxyActions: map, llamadas: filas, estado_actual: estado, totales: { depositado_trx: filas.reduce((s, f) => s + f.trx_depositado_en_WTRX, 0), retirado_trx: filas.reduce((s, f) => s + f.trx_retirado_de_WTRX, 0) } };
  const h = L.guardar(path.join(OUT, 'tllen-funciones-y-boveda.json'), resumen);
  console.log('funciones internas (por selector):'); const cnt = {}; for (const f of filas) cnt[f.funcion] = (cnt[f.funcion] || 0) + 1; for (const [k, v] of Object.entries(cnt)) console.log('  ', v + '×', k);
  console.log('\nLibro (TRX en WTRX): depositado', resumen.totales.depositado_trx.toLocaleString('es-ES'), '| retirado', resumen.totales.retirado_trx.toLocaleString('es-ES'));
  for (const f of filas) console.log(new Date(f.t).toISOString().slice(0, 16), f.tx.slice(0, 6), (f.ok ? '' : 'FALLÓ ') + f.funcion.slice(0, 44).padEnd(44), '↓', f.trx_depositado_en_WTRX.toLocaleString('es-ES'), '↑', f.trx_retirado_de_WTRX.toLocaleString('es-ES'), '| tokens:', f.transferencias_de_tokens.map(m => m.contrato.slice(0, 6) + ' ' + (/^[0-9]+$/.test(m.valor_bruto) ? (BigInt(m.valor_bruto) / 10n ** 12n).toString() : '?' + m.claves.join('|')) + 'e12 ' + String(m.de).slice(0, 6) + '→' + String(m.a).slice(0, 6)).join(' ; ').slice(0, 150));
  console.log('\nESTADO ACTUAL:', JSON.stringify({ vat: estado.vat, n_boveda: estado.n_boveda, primera: estado.primera_boveda, ultima: estado.ultima_boveda })); for (const b of bov) console.log('  bóveda', b.id, '| colateral', b.tipo_de_colateral, '| dueño', b.dueno, '| urn', b.urn, '| colateral bloqueado', b.colateral_bloqueado, '| deuda USDD', b.deuda_USDD, '| rate', b.rate);
  console.log(h, 'llamadas API', L.metricas.llamadas, 'red', L.metricas.red);
})().catch(e => { console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });
