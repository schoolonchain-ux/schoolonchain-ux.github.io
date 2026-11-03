'use strict';
// Seguimiento del caso Vaneck / Justin Sun para la web: estado actual de las dos cuentas (TronGrid, solo lectura), lo que han movido desde el 29-oct
// y los hechos que el vigilante de EquipoIA (tron-salidas-watch) ha anotado sobre ellas. Escribe un JSON público (sin claves).
// Necesita EquipoIA en C:/EquipoIA. Las claves se leen de la configuración local, se usan en memoria y no se escriben ni se imprimen.
// Uso: node tools/equipoia/seguimiento-vaneck.cjs <salida.json>
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const ROOT = 'C:/EquipoIA';
const { resumirCuentaTron } = require(ROOT + '/onchain-core/src/cadena.cjs');

const SALIDA = process.argv[2];
if (!SALIDA) { console.error('Uso: node seguimiento-vaneck.cjs <salida.json>'); process.exit(1); }
const hTG = {};   // TronGrid sin clave a propósito: la clave de EquipoIA supera su cuota diaria (la usan los vigilantes) y se limita a 1 consulta/s
const GRID = 'https://api.trongrid.io';
const DESDE = Date.UTC(2026, 9, 29);   // 29-oct-2026 00:00 UTC (día de la investigación)
const CUENTAS = [
  { direccion: 'TCGVFGDd62LSrfZEaz3M3fYifWWdSDHRL8', nombre: '«Vaneck» (etiqueta de TronScan)' },
  { direccion: 'TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N', nombre: 'Segunda cuenta (atribuida a Justin Sun por terceros; él lo niega)' },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function http(url, body) {
  for (let i = 0; i < 5; i++) {
    await sleep(400);
    try {
      const r = await fetch(url, { method: body ? 'POST' : 'GET', headers: { accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}), ...hTG }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(25000) });
      if (r.status === 429 || r.status >= 500) { await sleep(2500 * (i + 1)); continue; }
      return { status: r.status, json: await r.json().catch(() => null) };
    } catch { await sleep(2000); }
  }
  return { status: 0, json: null };
}
// dirección TRON (base58) <-> hex para comparar con raw_data
const A58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function b58dec(s) { let x = 0n; for (const c of s) x = x * 58n + BigInt(A58.indexOf(c)); let h = x.toString(16); if (h.length % 2) h = '0' + h; return Buffer.from(h, 'hex'); }
const hexDe = (t) => b58dec(t).subarray(0, 21).toString('hex');

async function cuenta(c) {
  const a = await http(GRID + '/wallet/getaccount', { address: c.direccion, visible: true });
  if (!(a.status === 200 && a.json && a.json.address)) throw new Error('no se pudo leer ' + c.direccion.slice(0, 8));
  const e = resumirCuentaTron(a.json);
  const ahora = Date.now();
  const enStake = e.congeladoV2.BANDWIDTH + e.congeladoV2.ENERGY + e.congeladoV2.TRON_POWER + e.congeladoV1.BANDWIDTH + e.congeladoV1.ENERGY + e.delegadoAOtros.ancho + e.delegadoAOtros.energia;
  const pendiente = e.pendienteDeRetirar.map((u) => ({ trx: Math.round(u.trx * 100) / 100, expira: u.expira, retirable: !!u.expira && u.expira <= ahora }));
  // transacciones desde el 29-oct (todas las clases): para saber si ha retirado o enviado TRX
  const mia = hexDe(c.direccion); const movs = []; const tipos = {};
  let url = GRID + '/v1/accounts/' + c.direccion + '/transactions?limit=200&order_by=block_timestamp,desc&min_timestamp=' + DESDE;
  for (let pag = 0; pag < 6 && url; pag++) {
    const r = await http(url); if (r.status !== 200 || !r.json) throw new Error('no se pudo leer el historial de ' + c.direccion.slice(0, 8));
    for (const t of r.json.data || []) {
      const ct = t.raw_data && t.raw_data.contract && t.raw_data.contract[0]; if (!ct) continue;
      const v = ct.parameter.value || {}; const propio = (v.owner_address || '').toLowerCase() === mia.toLowerCase();
      tipos[ct.type] = (tipos[ct.type] || 0) + 1;
      if (!propio || !(t.ret && t.ret[0] && t.ret[0].contractRet === 'SUCCESS')) continue;
      const trx = ct.type === 'TransferContract' ? Number(v.amount) / 1e6 : ct.type === 'TriggerSmartContract' ? Number(v.call_value || 0) / 1e6 : ct.type === 'UnfreezeBalanceV2Contract' ? Number(v.unfreeze_balance || 0) / 1e6 : null;
      if (['TransferContract', 'WithdrawExpireUnfreezeContract', 'UnfreezeBalanceV2Contract', 'CancelAllUnfreezeV2Contract'].includes(ct.type) || (ct.type === 'TriggerSmartContract' && trx >= 1e6))
        movs.push({ at: t.block_timestamp, tipo: ct.type, trx: trx == null ? null : Math.round(trx * 100) / 100, tx: t.txID });
    }
    url = r.json.meta && r.json.meta.links && r.json.meta.links.next || null;
  }
  const enviosTrx = movs.filter((m) => m.tipo === 'TransferContract' && (m.trx || 0) >= 1e6);          // TRX enviado a otra dirección
  const contratosTrx = movs.filter((m) => m.tipo === 'TriggerSmartContract' && (m.trx || 0) >= 1e6);    // TRX adjunto a una llamada a contrato (liquidez, depósitos…)
  const retiradas = movs.filter((m) => m.tipo === 'WithdrawExpireUnfreezeContract');
  return { ...c, saldoLibreTrx: Math.round(e.saldoLibreTrx), enStakeTrx: Math.round(enStake), delegadoTrx: Math.round(e.delegadoAOtros.energia + e.delegadoAOtros.ancho), pendiente,
    retirableTrx: Math.round(pendiente.filter((p) => p.retirable).reduce((s, p) => s + p.trx, 0)), pendienteTrx: Math.round(pendiente.filter((p) => !p.retirable).reduce((s, p) => s + p.trx, 0)),
    retiradas, enviosTrx, contratosTrx, descongelaciones: movs.filter((m) => m.tipo === 'UnfreezeBalanceV2Contract'), movimientos: movs.slice(0, 60), tiposDesde29oct: tipos };
}

// hechos que anotó el vigilante de EquipoIA sobre estas dos cuentas (solo datos de cadena; sin ningún dato del bot)
async function eventosVigilante() {
  const f = ROOT + '/tron-salidas-watch/state/eventos.jsonl'; const out = [];
  if (!fs.existsSync(f)) return out;
  const rl = readline.createInterface({ input: fs.createReadStream(f, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const l of rl) {
    if (!l.includes(CUENTAS[0].direccion) && !l.includes(CUENTAS[1].direccion)) continue;
    let e; try { e = JSON.parse(l); } catch { continue; }
    if (!CUENTAS.some((c) => c.direccion === e.cuenta)) continue;
    out.push({ cuenta: e.cuenta, clase: e.clase, at: e.at, tx: e.tx, trx: e.trx != null ? Math.round(e.trx) : null, destino: e.destino || null, nombreDestino: e.nombreDestino || null, nombreOrigen: e.nombreOrigen || null, entrega: e.entrega ? { cantidad: Math.round(e.entrega.cantidad), simbolo: e.entrega.simbolo } : null });
  }
  return out.sort((a, b) => a.at - b.at);
}

(async () => {
  const t0 = Date.now(); const cs = [];
  for (const c of CUENTAS) cs.push(await cuenta(c));
  const ev = await eventosVigilante();
  const retiro = cs.some((c) => c.retiradas.length), envios = cs.some((c) => c.enviosTrx.length), contratos = cs.some((c) => c.contratosTrx.length), nuevas = cs.reduce((n, c) => n + c.descongelaciones.length, 0);
  const estado = { retirada: retiro, enviosTrx: envios, contratosTrx: contratos, nuevasDescongelaciones: nuevas, sinSalida: !retiro && !envios,
    resumen: !retiro && !envios ? 'Desde el 29-oct ninguna de las dos cuentas ha retirado el TRX desbloqueado ni ha enviado TRX (≥ 1 M) a otra dirección.' : 'Hay retiradas o envíos de TRX desde el 29-oct: ver el detalle de cada cuenta.' };
  const out = { version: 1, leidoEn: new Date(t0).toISOString(), desde: new Date(DESDE).toISOString(), cuentas: cs, eventosVigilante: ev, estado,
    fuentes: ['TronGrid /wallet/getaccount y /v1/accounts/{dirección}/transactions (lectura en vivo)', 'tron-salidas-watch de EquipoIA (hechos anotados por el vigilante)'] };
  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, JSON.stringify(out));
  console.log('OK', SALIDA, (fs.statSync(SALIDA).size / 1024).toFixed(0) + ' KB', 'ms', Date.now() - t0);
  for (const c of cs) console.log(c.direccion.slice(0, 8), 'libres', c.saldoLibreTrx, 'retirable', c.retirableTrx, 'pendiente', c.pendienteTrx, 'retiradas', c.retiradas.length, 'envíos≥1M', c.enviosTrx.length, 'contratos≥1M', c.contratosTrx.length, 'tipos', JSON.stringify(c.tiposDesde29oct));
  console.log('estado:', estado.resumen, '· eventos vigilante:', ev.length);
})().catch((e) => { console.error('ERROR', String(e && e.message).slice(0, 200)); process.exit(1); });
