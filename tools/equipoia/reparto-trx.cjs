'use strict';
// Prepara el fichero de datos de la pestaña «Reparto» de TRX (data/reparto-trx.json): cómo está repartido el TRX entre casas de cambio, contratos, fondos,
// cuentas grandes sin identificar y el resto de la red. Es el mismo cálculo que research/tron-holders/analyze.py (lo comprueba la prueba de abajo), pero con la lista
// de las 10.000 mayores cuentas leída HOY de TronScan (con la clave local, que solo se usa en memoria y nunca se escribe).
// Dos cosas que añade respecto a analyze.py, y que se dicen en el resultado:
//   · «etiquetas recordadas»: si TronScan ponía nombre a una cuenta en una foto anterior y hoy ya no (entre el 21-oct y el 2-nov desapareció la etiqueta de 8 cuentas de HTX
//     con 8.177 M TRX sin que se movieran), se conserva el último nombre que dio y se cuenta aparte. Se guarda en estado\etiquetas-trx.json (solo lo escribe este programa).
//   · el tipo de cuenta (contrato o normal) de las mayores sin etiqueta se completa con TronGrid y se guarda en estado\tipos-trx.json.
// Uso: node reparto-trx.cjs <salida.json> [--crudo foto.json] [--sin-memoria]
//   --crudo        no usa la red: calcula con una foto de research/tron-holders/snapshots (para comprobar contra analyze.py)
//   --sin-memoria  no aplica ni guarda las etiquetas recordadas (sirve para reproducir analyze.py al céntimo)
const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'C:/EquipoIA';
const INV = ROOT + '/research/tron-holders';
const ESTADO = 'C:/EquipoIA/web-publicador/estado';
const SALIDA = process.argv[2];
if (!SALIDA) { console.error('Uso: node reparto-trx.cjs <salida.json> [--crudo foto.json] [--sin-memoria]'); process.exit(1); }
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const CRUDO = arg('--crudo'), SIN_MEMORIA = process.argv.includes('--sin-memoria') || !!CRUDO;
const leerJson = (f, defecto) => { try { return JSON.parse(fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '')); } catch { return defecto; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SUN = 1e6;

async function get(url, headers = {}, intentos = 3) {
  for (let i = 0; i < intentos; i++) {
    try {
      const r = await fetch(url, { headers: { accept: 'application/json', ...headers }, signal: AbortSignal.timeout(20000) });
      const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch { /* no es JSON */ }
      if (r.status === 429 || (j && /frequency limit/i.test(String(j.Error || '')))) { await sleep(31000); continue; }
      if (r.status >= 500) { await sleep(2000); continue; }
      return { status: r.status, json: j };
    } catch { await sleep(1500); }
  }
  return { status: 0, json: null };
}

async function leerLista() {
  if (CRUDO) { const s = leerJson(CRUDO, null); if (!s || !Array.isArray(s.rows)) throw new Error('foto no válida'); return { rows: s.rows, cuentasEnLaRed: s.total_accounts, leidoEn: s.retrieved_at, fallidas: (s.errors || []).length }; }
  const { leerClaves } = require(ROOT + '/blockchain-investigator/src/claves.cjs');
  const K = leerClaves(); const h = K.tronscanKey ? { 'TRON-PRO-API-KEY': K.tronscanKey } : {};
  const rows = []; let fallidas = 0, cuentas = null;
  for (let p = 0; p < 200; p++) {
    await sleep(230);
    const r = await get('https://apilist.tronscanapi.com/api/account/list?sort=-balance&limit=50&start=' + p * 50, h);
    if (r.status === 200 && r.json && Array.isArray(r.json.data)) { if (cuentas == null) cuentas = r.json.account_number; rows.push(...r.json.data); if (!r.json.data.length) break; } else fallidas++;
  }
  return { rows, cuentasEnLaRed: cuentas, leidoEn: new Date().toISOString(), fallidas };
}

// memoria de etiquetas: se arranca con las fotos guardadas de research/tron-holders/snapshots
function cargarMemoria() {
  const f = ESTADO + '/etiquetas-trx.json'; let m = leerJson(f, null);
  if (m && m.direcciones) return m;
  m = { version: 1, direcciones: {} };
  const dir = INV + '/snapshots';
  for (const nombre of fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []) {
    if (!/^trx-top-\d{4}-\d{2}-\d{2}\.json$/.test(nombre)) continue;
    const s = leerJson(dir + '/' + nombre, null); if (!s || !Array.isArray(s.rows)) continue;
    for (const r of s.rows) { const t = (r.addressTag || '').trim(); if (t) m.direcciones[r.address] = { tag: t, visto: nombre.slice(8, 18) }; }
  }
  return m;
}

(async () => {
  const labels = leerJson(INV + '/labels.json', null); if (!labels) throw new Error('falta labels.json');
  const cats = labels.categorias_por_etiqueta_tronscan, externas = Object.fromEntries((labels.atribuciones_externas || []).map((a) => [a.address, a]));
  const info = leerJson(INV + '/address-info.json', {});
  fs.mkdirSync(ESTADO, { recursive: true });
  const tiposPropios = SIN_MEMORIA ? {} : leerJson(ESTADO + '/tipos-trx.json', {});
  const { rows, cuentasEnLaRed, leidoEn, fallidas } = await leerLista();
  if (rows.length < 5000) { console.error('LISTA_NO_DISPONIBLE ' + rows.length); process.exit(2); }
  const hoy = String(leidoEn).slice(0, 10);
  const primera = rows[0], oferta = Number(primera.trxRatio) > 0 ? Number(primera.totalBalance) / Number(primera.trxRatio) / SUN : null;
  if (!oferta) { console.error('OFERTA_NO_DISPONIBLE'); process.exit(2); }

  // memoria de etiquetas: se actualiza con lo que TronScan etiqueta hoy
  const mem = SIN_MEMORIA ? { direcciones: {} } : cargarMemoria();
  if (!SIN_MEMORIA) for (const r of rows) { const t = (r.addressTag || '').trim(); if (t) mem.direcciones[r.address] = { tag: t, visto: hoy }; }

  // tipo de cuenta de las mayores sin etiqueta que aún no se han comprobado (TronGrid público, sin clave, de una en una)
  let comprobadasAhora = 0;
  if (!CRUDO) {
    for (const r of rows.slice(0, 300)) {
      const a = r.address; if ((r.addressTag || '').trim() || mem.direcciones[a] || info[a] || tiposPropios[a]) continue;
      if (comprobadasAhora >= 40) break;
      await sleep(700);
      const x = await get('https://api.trongrid.io/v1/accounts/' + a);
      const acc = x.json && x.json.data && x.json.data[0];
      if (x.status === 200 && acc) { tiposPropios[a] = { type: acc.type || 'Normal', checked_at: hoy }; comprobadasAhora++; }
    }
    // nombre de los contratos nuevos
    for (const [a, t] of Object.entries(tiposPropios)) {
      if (t.type === 'Contract' && t.name === undefined) {
        await sleep(700);
        try { const r = await fetch('https://api.trongrid.io/wallet/getcontract', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ value: a, visible: true }), signal: AbortSignal.timeout(20000) }); const c = await r.json(); t.name = c.name || null; } catch { /* se reintenta otro día */ }
      }
    }
    fs.writeFileSync(ESTADO + '/tipos-trx.json', JSON.stringify(tiposPropios, null, 1));
    fs.writeFileSync(ESTADO + '/etiquetas-trx.json', JSON.stringify(mem));
  }

  // ---- el reparto (mismas reglas y mismo orden de prioridad que analyze.py) ----
  const G = {}; for (const k of ['exchange', 'fondo_o_institucion', 'otros_etiquetados', 'contrato', 'ballena_sin_identificar', 'atribuido_externo']) G[k] = { cuentas: 0, trx: 0 };
  const detalle = { exchange: {}, contrato: {}, otros_etiquetados: {}, fondo_o_institucion: {} };
  const tramos = [[100e6, '100 M o más'], [10e6, '10 M - 100 M'], [1e6, '1 M - 10 M'], [300e3, '300 k - 1 M'], [0, 'menos de 300 k']];
  const bandas = Object.fromEntries(tramos.map(([, n]) => [n, { cuentas: 0, trx: 0 }]));
  let comprobadas = 0, sinComprobar = 0; const recordadas = { cuentas: 0, trx: 0, ejemplos: [] };
  for (const r of rows) {
    const trx = Number(r.totalBalance) / SUN; let tag = (r.addressTag || '').trim(), recordada = false;
    if (!tag && mem.direcciones[r.address]) { tag = mem.direcciones[r.address].tag; recordada = true; }
    const low = tag.toLowerCase(); let g, nombre = null;
    if (externas[r.address]) { g = 'atribuido_externo'; nombre = externas[r.address].entidad; }
    else if (tag && cats.exchange.some((k) => low.includes(k))) { g = 'exchange'; nombre = tag.split(' ')[0].split('-')[0].replace(/:+$/, ''); }
    else if (tag && cats.fondo_o_institucion.some((k) => low.includes(k))) { g = 'fondo_o_institucion'; nombre = tag; }
    else if (tag) { g = 'otros_etiquetados'; nombre = tag; }
    else {
      const inf = info[r.address] || tiposPropios[r.address];
      if (inf && inf.type === 'Contract') { g = 'contrato'; nombre = inf.name || r.address; }
      else { g = 'ballena_sin_identificar'; const b = tramos.find(([lo]) => trx >= lo)[1]; bandas[b].cuentas++; bandas[b].trx += trx; if (inf) comprobadas++; else sinComprobar++; }
    }
    if (recordada && g !== 'ballena_sin_identificar') { recordadas.cuentas++; recordadas.trx += trx; if (recordadas.ejemplos.length < 12) recordadas.ejemplos.push({ etiqueta: tag, visto: mem.direcciones[r.address].visto, trx: Math.round(trx) }); }
    G[g].cuentas++; G[g].trx += trx;
    if (nombre && detalle[g]) detalle[g][nombre] = (detalle[g][nombre] || 0) + trx;
  }
  const enTop = Object.values(G).reduce((s, x) => s + x.trx, 0), cola = Math.max(oferta - enTop, 0), n = rows.length, ultima = Number(rows[n - 1].totalBalance) / SUN;
  const pct = (x) => Math.round((100 * x / oferta) * 1e3) / 1e3;
  const grupos = Object.fromEntries(Object.entries(G).map(([k, v]) => [k, { cuentas: v.cuentas, trx: Math.round(v.trx), pct: pct(v.trx) }]));
  const conc = {}; for (const k of [1, 10, 50, 100, 500, 1000, 5000, 10000]) if (k <= n) conc['top' + k] = pct(rows.slice(0, k).reduce((s, r) => s + Number(r.totalBalance) / SUN, 0));
  const topN = (o, k) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, k).map(([nombre, trx]) => ({ nombre, trx: Math.round(trx) }));
  const salida = {
    version: 1, leidoEn, cuentasEnLaRed, cuentasAnalizadas: n, ofertaTrx: Math.round(oferta), saldoDeLaCuentaNTrx: Math.round(ultima),
    grupos, cola: { cuentas: cuentasEnLaRed != null ? cuentasEnLaRed - n : null, trx: Math.round(cola), pct: pct(cola) },
    sinIdentificarPorTramo: tramos.map(([, nombre]) => ({ tramo: nombre, cuentas: bandas[nombre].cuentas, trx: Math.round(bandas[nombre].trx), pct: pct(bandas[nombre].trx) })),
    concentracion: conc,
    detalle: { exchange: topN(detalle.exchange, 8), contrato: topN(detalle.contrato, 8), otros_etiquetados: topN(detalle.otros_etiquetados, 6), fondo_o_institucion: topN(detalle.fondo_o_institucion, 4) },
    etiquetasRecordadas: { cuentas: recordadas.cuentas, trx: Math.round(recordadas.trx), pct: pct(recordadas.trx), ejemplos: recordadas.ejemplos },
    cobertura: { paginasFallidas: fallidas, tipoComprobado: comprobadas, tipoSinComprobar: sinComprobar },
    fuentes: ['TronScan /api/account/list (10.000 mayores cuentas por saldo total)', 'TronGrid /v1/accounts (tipo de cuenta de las mayores sin etiqueta)'],
  };
  fs.writeFileSync(SALIDA, JSON.stringify(salida, null, 1));
  console.log('OK reparto: ' + n + ' cuentas · oferta ' + Math.round(oferta / 1e6) + ' M TRX · sin identificar ' + grupos.ballena_sin_identificar.pct + ' % · casas de cambio ' + grupos.exchange.pct + ' % · recordadas ' + recordadas.cuentas);
})().catch((e) => { console.error('ERROR', String(e && e.stack || e).slice(0, 400)); process.exit(1); });
