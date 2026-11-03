'use strict';
// Actualiza data/desbloqueos-trx.json (calendario de descongelaciones de TRX). Necesita EquipoIA en C:/EquipoIA (usa su modulo onchain-core y sus claves locales; las claves nunca se escriben).
// Uso: node tools/equipoia/actualizar-desbloqueos.cjs data/desbloqueos-trx.json
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'C:/EquipoIA';
const { leerClaves } = require(ROOT + '/blockchain-investigator/src/claves.cjs');
const { resumirCuentaTron } = require(ROOT + '/onchain-core/src/cadena.cjs');
const { calcular, normalizarCuentas, normalizarSerieStake } = require(ROOT + '/onchain-core/src/desbloqueos.cjs');

const SALIDA = process.argv[2];
if (!SALIDA) { console.error('Uso: node snapshot-desbloqueos.cjs <salida.json>'); process.exit(1); }
const K = leerClaves(); const hTS = K.tronscanKey ? { 'TRON-PRO-API-KEY': K.tronscanKey } : {}, hTG = K.tronGridKey ? { 'TRON-PRO-API-KEY': K.tronGridKey } : {};
console.log('claves: TronScan', !!K.tronscanKey, '· TronGrid', !!K.tronGridKey);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LISTA = 'https://apilist.tronscanapi.com/api/account/list?sort=-balance&limit=50&start=', SERIE = 'https://apilist.tronscanapi.com/api/freezeresource', GRID = 'https://api.trongrid.io';
const DAY = 86400000;

async function get(url, headers, intentos = 3) {
  for (let i = 0; i < intentos; i++) {
    try {
      const r = await fetch(url, { headers: { accept: 'application/json', ...headers }, signal: AbortSignal.timeout(20000) });
      const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch {}
      if (r.status === 429 || (j && /frequency limit/i.test(String(j.Error || '')))) { await sleep(31000); continue; }
      if (r.status >= 500) { await sleep(2000); continue; }
      return { status: r.status, json: j };
    } catch { await sleep(1500); }
  }
  return { status: 0, json: null };
}
async function post(url, body, headers) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
      const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch {}
      if (r.status === 429) { await sleep(5000); continue; }
      if (r.status >= 500) { await sleep(2000); continue; }
      return { status: r.status, json: j };
    } catch { await sleep(1500); }
  }
  return { status: 0, json: null };
}

(async () => {
  const t0 = Date.now(); const ahora = t0;
  // 1. las 10.000 mayores cuentas
  const filas = []; let fallidas = 0;
  for (let p = 0; p < 200; p++) {
    await sleep(230);
    const r = await get(LISTA + p * 50, hTS);
    if (r.status === 200 && r.json && Array.isArray(r.json.data)) { filas.push(...r.json.data); if (!r.json.data.length) break; } else fallidas++;
    if (p % 25 === 0) console.log('lista página', p, 'filas', filas.length, 'fallidas', fallidas);
  }
  if (filas.length < 5000) { console.error('LISTA_NO_DISPONIBLE', filas.length); process.exit(2); }
  const cuentas = normalizarCuentas(filas.map((f) => ({ address: f.address, addressTag: f.addressTag || null, unstakingBalance: f.unstakingBalance, totalBalance: f.totalBalance, trxRatio: f.trxRatio })));
  const primera = filas[0]; const suministro = primera && Number(primera.trxRatio) > 0 ? Number(primera.totalBalance) / 1e6 / Number(primera.trxRatio) : null;
  // 2. plazo de descongelación
  let diasDemora = 14, plazoLeido = false;
  const pp = await get(GRID + '/wallet/getchainparameters', hTG);
  const lst = pp.json && (pp.json.chainParameter || pp.json); const x = Array.isArray(lst) && lst.find((c) => c.key === 'getUnfreezeDelayDays');
  if (x && Number.isInteger(x.value) && x.value > 0 && x.value < 60) { diasDemora = x.value; plazoLeido = true; }
  // 3. serie diaria de stake
  let serieStake = [];
  const hasta = new Date(t0).toISOString().slice(0, 10), desde = new Date(t0 - 40 * DAY).toISOString().slice(0, 10);
  const s = await get(SERIE + '?start_day=' + desde + '&end_day=' + hasta, hTS);
  if (s.status === 200 && s.json) serieStake = normalizarSerieStake(s.json);
  // 4. estado de cada cuenta con desbloqueo en curso
  const objetivo = cuentas.filter((c) => c.desbloqueandoTrx > 0).sort((a, c) => c.desbloqueandoTrx - a.desbloqueandoTrx);
  console.log('cuentas con desbloqueo en curso:', objetivo.length);
  const estados = new Map(), errores = [];
  for (const c of objetivo) {
    await sleep(110);
    const r = await post(GRID + '/wallet/getaccount', { address: c.address, visible: true }, hTG);
    if (r.status === 200 && r.json) { const e = resumirCuentaTron(r.json); if (e.activada) { estados.set(c.address, e); continue; } }
    errores.push(c.address);
  }
  console.log('leídas', estados.size, 'errores', errores.length);
  const r = calcular({ cuentas, estados, errores, suministro, serieStake, ahora, diasDemora, fuente: { leido: new Date(t0).toISOString() } });
  // 5. eventos individuales (para el calendario detallado de la web)
  const tag = new Map(cuentas.map((c) => [c.address, c.tag]));
  const eventos = [];
  for (const [address, e] of estados) for (const u of e.pendienteDeRetirar) eventos.push({ a: address, t: tag.get(address) || null, e: u.expira, x: Math.round(u.trx * 100) / 100 });
  eventos.sort((a, b) => (a.e || 9e15) - (b.e || 9e15));
  const out = {
    version: 1, leidoEn: new Date(t0).toISOString(), listaDe: new Date(t0).toISOString(), diasDemora, plazoLeido, activo: 'TRX',
    total: r.total, calendario: r.calendario, principales: r.principales, sinRetirar: r.sinRetirar, concentracion3: r.concentracion3,
    cobertura: { ...r.cobertura, paginasFallidas: fallidas }, tendencia: r.tendencia, avisos: r.avisos, descuadres: r.descuadres.length,
    eventos, fuentes: ['TronScan /api/account/list (10.000 mayores cuentas)', 'TronGrid /wallet/getaccount (unfrozenV2)', 'TronScan /api/freezeresource', 'TronGrid /wallet/getchainparameters'],
  };
  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, JSON.stringify(out));
  console.log('OK', SALIDA, (fs.statSync(SALIDA).size / 1024).toFixed(0) + ' KB', 'ms', Date.now() - t0);
  console.log('próximos 14 días:', Math.round(r.calendario.proximos14.trx), 'TRX en', r.calendario.proximos14.cuentas, 'cuentas · ya disponibles', Math.round(r.calendario.yaDisponible.trx));
})().catch((e) => { console.error('ERROR', String(e && e.message).slice(0, 200)); process.exit(1); });
