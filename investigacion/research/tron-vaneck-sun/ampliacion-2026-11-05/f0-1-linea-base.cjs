'use strict';
// FASE 0.1 — Línea base congelada del 5-nov-2026: estado de las cuentas del caso, delegaciones de energía de las dos cuentas
// que dan energía, contratos auxiliares y parámetros de la red. SOLO LECTURA. Reproducible: REPRODUCIR=1 node f0-1-linea-base.cjs
const path = require('node:path'); const L = require('./lib.cjs'); const b58 = require('./b58.cjs');
const SES = 'linea-base-2026-11-05'; L.usar(SES); const OUT = path.join(__dirname, 'linea-base');
const TG = 'https://api.trongrid.io', TS = 'https://apilist.tronscanapi.com/api';
const CUENTAS = {
  'Vaneck': 'TCGVFGDd62LSrfZEaz3M3fYifWWdSDHRL8', 'Segunda cuenta (TT2T17)': 'TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N',
  'Financiadora 1 (TPyjyZ)': 'TPyjyZfsYaXStgz2NmAraF1uZcMtkgNan5', 'Financiadora 2 (TUTtLt)': 'TUTtLtGjXWqkTAow7jj7oMhTGLe9XB9YMA',
  'Cuenta de energia (TEF9ZV)': 'TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B', 'Proveedora TRON Inc (TWhDfwC8)': 'TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2',
  'Pareja de la proveedora (TSzSgxRi)': 'TSzSgxRisS5VBXXDcAezTDvnPGi9CbsXvJ', 'Recolectora (TFSd14UQ)': 'TFSd14UQUp6HPamdMGJsWBxfWKMrLYxRmp',
  'HTX 4': 'TFTWNgDBkQ5wQoP8RXpRznnHvAVV8x5jLu', 'HTX-Cold 6': 'TAuUCiH4JVNBZmDnEDZkXEUXDARdGpXTmX', 'HTX 3': 'TU1ZA8T2g8PvLK8BfM7N94xpmSSpyfxZoK',
  'TYL7z7VS (2022)': 'TYL7z7VSVRShLoJ6YRQMA4t9pSECt9ZLmz', 'Multifirma 2 USDD': 'TPcnRbpuB89eKKkfH2E7iJooAqeEZPpdGb',
  'Contrato auxiliar (TLLEN)': 'TLLENiMpZvGZD2C1ZQ2FzBinrYevmGco6p', 'Contrato grande (TNUC9)': 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR',
  'Billetera puente D': 'TQRBxpS5V1KZW8g3oJ1YNLqtj1j733Mc33', 'Binance-Hot 12': 'TJTKCzQpsG19CSMYF9TPtxz6wSHPSyeKfa',
  'Receptor sin identificar (TU3rMHyW)': 'TU3rMHyWHzeEJBReWLzHko728hbz6MtfNg', 'GasFree': 'TFNX7TKYCm1kUYDECjkrogBwYZvt69XQNy', 'Bybit': 'TU4vEruvZwLLkSfV9bNw12EJTPvNr7Pvaa',
  'TRON Inc (segun Protos)': 'TEySEZLJf6rs2mCujGpDEsgoMVWKLAk9mT'
};
const trx = n => (Number(n) || 0) / 1e6;
function resumenCuenta(nombre, a, rec, ts) {
  const frz = (a.frozenV2 || []).reduce((o, f) => { const t = f.type || 'BANDWIDTH'; o[t] = (o[t] || 0) + trx(f.amount); return o; }, {});
  const unf = (a.unfrozenV2 || []).map(u => ({ tipo: u.type || 'BANDWIDTH', trx: trx(u.unfreeze_amount), libre_el: u.unfreeze_expire_time ? new Date(u.unfreeze_expire_time).toISOString() : null }));
  const perm = p => p ? { nombre: p.permission_name, umbral: p.threshold, claves: (p.keys || []).map(k => ({ direccion: k.address, peso: k.weight })) } : null;
  return {
    nombre, direccion: a.address || null, existe: !!(a.address || a.balance !== undefined), creada: a.create_time ? new Date(a.create_time).toISOString().slice(0, 10) : null,
    trx_libre: trx(a.balance), bloqueado_v2: frz, descongelando: unf,
    delegado_a_otros: { energia: trx(a.account_resource && a.account_resource.delegated_frozenV2_balance_for_energy), ancho_banda: trx(a.delegated_frozenV2_balance_for_bandwidth) },
    recibido_en_delegacion: { energia: trx(a.account_resource && a.account_resource.acquired_delegated_frozenV2_balance_for_energy), ancho_banda: trx(a.acquired_delegated_frozenV2_balance_for_bandwidth) },
    votos: (a.votes || []).map(v => ({ para: v.vote_address, votos: v.vote_count })),
    permiso_propietario: perm(a.owner_permission), permisos_activos: (a.active_permission || []).map(perm),
    energia: rec ? { limite: rec.EnergyLimit || 0, usada: rec.EnergyUsed || 0, limite_total_red: rec.TotalEnergyLimit, peso_total_red: rec.TotalEnergyWeight } : null,
    tronscan: ts ? { etiqueta_publica: ts.publicTag || null, etiqueta: ts.addressTag || null, tipo: ts.accountType, es_contrato: !!ts.contractInfo } : null
  };
}
function decodificaTexto(hex) { if (!hex || hex.length < 128) return null; try { const n = parseInt(hex.slice(64, 128), 16); return Buffer.from(hex.slice(128, 128 + n * 2), 'hex').toString('utf8'); } catch { return null; } }
(async () => {
  const ancla = await L.post(TG + '/wallet/getnowblock', {}); const bloque = ancla.block_header.raw_data.number, tBloque = ancla.block_header.raw_data.timestamp;
  const anclas = { sesion: SES, bloque, bloque_hora_utc: new Date(tBloque).toISOString(), nota: 'Todas las lecturas de esta carpeta son del estado de la cadena en o justo después de este bloque.' };
  const cuentas = [];
  for (const [nombre, dir] of Object.entries(CUENTAS)) {
    const a = await L.post(TG + '/wallet/getaccount', { address: dir, visible: true });
    const r = await L.post(TG + '/wallet/getaccountresource', { address: dir, visible: true });
    let ts = null; try { ts = await L.get(TS + '/accountv2?address=' + dir); } catch { ts = null; }
    cuentas.push(Object.assign(resumenCuenta(nombre, a, r, ts), { direccion_consultada: dir }));
  }
  const delegaciones = {};
  for (const [nombre, dir] of [['Cuenta de energia (TEF9ZV)', CUENTAS['Cuenta de energia (TEF9ZV)']], ['Segunda cuenta (TT2T17)', CUENTAS['Segunda cuenta (TT2T17)']]]) {
    const idx = await L.post(TG + '/wallet/getdelegatedresourceaccountindexv2', { value: dir, visible: true }); const filas = [];
    for (const to of idx.toAccounts || []) {
      const d = await L.post(TG + '/wallet/getdelegatedresourcev2', { fromAddress: dir, toAddress: to, visible: true });
      const rs = d.delegatedResource || []; filas.push({ receptor: to, energia: trx(rs.reduce((s, x) => s + (x.frozen_balance_for_energy || 0), 0)), ancho_banda: trx(rs.reduce((s, x) => s + (x.frozen_balance_for_bandwidth || 0), 0)), expira_energia: rs.map(x => x.expire_time_for_energy ? new Date(x.expire_time_for_energy).toISOString() : null).filter(Boolean) });
    }
    filas.sort((x, y) => y.energia - x.energia);
    for (const f of filas) if (f.energia + f.ancho_banda >= 1e6) { try { const t = await L.get(TS + '/accountv2?address=' + f.receptor); f.etiqueta = t.publicTag || t.addressTag || null; f.creada = t.date_created ? new Date(t.date_created).toISOString().slice(0, 10) : null; } catch { f.etiqueta = '(error de lectura)'; } }
    const desde = await L.post(TG + '/wallet/getdelegatedresourceaccountindexv2', { value: dir, visible: true });
    delegaciones[nombre] = { emisor: dir, n_receptores: filas.length, total_energia: filas.reduce((s, f) => s + f.energia, 0), total_ancho_banda: filas.reduce((s, f) => s + f.ancho_banda, 0), quien_le_delega_a_ella: desde.fromAccounts || [], receptores: filas };
  }
  const contratos = {};
  for (const [nombre, dir] of [['Contrato auxiliar (TLLEN)', CUENTAS['Contrato auxiliar (TLLEN)']], ['Contrato grande (TNUC9)', CUENTAS['Contrato grande (TNUC9)']]]) {
    const c = await L.post(TG + '/wallet/getcontract', { value: dir, visible: true }); const info = await L.post(TG + '/wallet/getcontractinfo', { value: dir, visible: true });
    const consultas = {};
    for (const sel of ['owner()', 'name()', 'symbol()', 'decimals()', 'authority()', 'cache()', 'totalSupply()']) {
      const q = await L.post(TG + '/wallet/triggerconstantcontract', { owner_address: CUENTAS['Cuenta de energia (TEF9ZV)'], contract_address: dir, function_selector: sel, parameter: '', visible: true });
      const hex = q.constant_result && q.constant_result[0]; let val = null;
      if (hex) { if (/owner|authority|cache/.test(sel) && hex.length >= 64) val = b58('41' + hex.slice(24, 64)); else if (/name|symbol/.test(sel)) val = decodificaTexto(hex); else val = hex.replace(/^0+/, '') || '0'; }
      consultas[sel] = { resultado: val, hex: hex || null, estado: q.result && q.result.result ? 'ok' : (q.result ? (q.result.message ? Buffer.from(q.result.message, 'hex').toString('utf8') : 'fallo') : 'sin resultado') };
    }
    contratos[nombre] = { direccion: dir, nombre_en_cadena: c.name || null, creador: c.origin_address || null, tiene_codigo: !!c.bytecode, bytes_codigo: c.bytecode ? c.bytecode.length / 2 : 0, huella_codigo_sha256: c.bytecode ? L.sha(c.bytecode) : null, funciones_abi: (c.abi && c.abi.entrys ? c.abi.entrys.map(e => e.name).filter(Boolean) : []).slice(0, 80), creacion: info.smart_contract ? null : null, consultas };
  }
  const par = await L.post(TG + '/wallet/getchainparameters', {}); const parametros = Object.fromEntries((par.chainParameter || []).filter(p => /Energy|TransactionFee|TotalEnergy|FreeNet|BandwidthFee|MaintenanceTime/i.test(p.key)).map(p => [p.key, p.value]));
  const h = {};
  h['anclas.json'] = L.guardar(path.join(OUT, 'anclas.json'), anclas); h['cuentas.json'] = L.guardar(path.join(OUT, 'cuentas.json'), cuentas);
  h['delegaciones.json'] = L.guardar(path.join(OUT, 'delegaciones.json'), delegaciones); h['contratos.json'] = L.guardar(path.join(OUT, 'contratos.json'), contratos); h['parametros-red.json'] = L.guardar(path.join(OUT, 'parametros-red.json'), parametros);
  console.log('bloque', bloque, anclas.bloque_hora_utc, '| llamadas', L.metricas.llamadas, '(red', L.metricas.red + ', desde raw', L.metricas.desdeRaw + ', reintentos', L.metricas.reintentos + ')'); console.log(JSON.stringify(h, null, 1));
  for (const [n, d] of Object.entries(delegaciones)) console.log(n, '→ receptores', d.n_receptores, '| energía delegada', d.total_energia.toLocaleString('es-ES'), 'TRX | ancho de banda', d.total_ancho_banda.toLocaleString('es-ES'));
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
