'use strict';
// ANÁLISIS DE CONTRATOS (EVM, solo lectura): ¿es un contrato?, ¿es un proxy y hacia qué implementación?, ¿quién lo controla?, ¿qué funciones de control contiene su código? y ¿hay código fuente verificado?
// Se separa SIEMPRE lo observado en cadena de lo deducido del bytecode:
//   · OBSERVADO: el código existe (hash), el valor de las ranuras de proxy, el resultado de owner()/name()/symbol()/paused()…, el estado de verificación en Sourcify.
//   · DEDUCIDO: que un selector aparezca en el bytecode indica que el contrato PUEDE tener esa función; no prueba que esté activa, que alguien pueda llamarla ni que se haya usado. Sin código verificado no se confirma nada más.
//   · Un proxy delega en su implementación: las funciones reales están en la implementación (se analiza también) y la implementación puede cambiarse por quien tenga el permiso de actualización.
const crypto = require('node:crypto');
const { keccak256, selector } = require('../../onchain-core/src/keccak.cjs');
const { selectoresDeBytecode, clasificar } = require('../../onchain-core/src/contratos.cjs');
const { dir, textoAbi, uint } = require('./abi.cjs');

const H = s => keccak256(s).toString('hex');
const slot = (hex, restar = 0n) => '0x' + (BigInt('0x' + hex) - restar).toString(16).padStart(64, '0');
const SLOTS = Object.freeze({
  eip1967_implementacion: slot(H('eip1967.proxy.implementation'), 1n), eip1967_admin: slot(H('eip1967.proxy.admin'), 1n), eip1967_beacon: slot(H('eip1967.proxy.beacon'), 1n),
  eip1822_proxiable: slot(H('PROXIABLE')), zos_implementacion: slot(H('org.zeppelinos.proxy.implementation')), zos_admin: slot(H('org.zeppelinos.proxy.admin'))
});
const FIRMAS_CONTROL = Object.freeze({
  mint: ['mint(address,uint256)', 'issue(uint256)'], burn: ['burn(uint256)', 'burn(address,uint256)', 'redeem(uint256)'], pausar: ['pause()', 'unpause()'],
  lista_negra: ['blacklist(address)', 'unBlacklist(address)', 'addBlackList(address)', 'removeBlackList(address)', 'destroyBlackFunds(address)', 'isBlackListed(address)', 'isBlocked(address)', 'blockAccount(address)', 'unblockAccount(address)'],
  congelar: ['freeze(address)', 'unfreeze(address)', 'freezeAccount(address,bool)'],
  propiedad: ['transferOwnership(address)', 'renounceOwnership()', 'owner()'],
  actualizacion: ['upgradeTo(address)', 'upgradeToAndCall(address,bytes)', 'changeAdmin(address)', 'setImplementation(address)'],
  roles: ['grantRole(bytes32,address)', 'revokeRole(bytes32,address)', 'renounceRole(bytes32,address)']
});
const SEL_CONTROL = Object.freeze(Object.fromEntries(Object.entries(FIRMAS_CONTROL).flatMap(([g, fs]) => fs.map(f => ['0x' + selector(f), { grupo: g, firma: f }]))));
const EVENTOS_CONTROL = Object.freeze({
  Upgraded: 'Upgraded(address)', AdminChanged: 'AdminChanged(address,address)', OwnershipTransferred: 'OwnershipTransferred(address,address)', AddedBlackList: 'AddedBlackList(address)', RemovedBlackList: 'RemovedBlackList(address)',
  DestroyedBlackFunds: 'DestroyedBlackFunds(address,uint256)', Pause: 'Pause()', Unpause: 'Unpause()', Paused: 'Paused(address)', Unpaused: 'Unpaused(address)', Issue: 'Issue(uint256)', Redeem: 'Redeem(uint256)', Mint: 'Mint(address,uint256)', Burn: 'Burn(address,uint256)',
  BlockPlaced: 'BlockPlaced(address)', BlockReleased: 'BlockReleased(address)',   // USDT0 (TetherTokenV2)
  RoleGranted: 'RoleGranted(bytes32,address,address)', RoleRevoked: 'RoleRevoked(bytes32,address,address)', Frozen: 'AddressFrozen(address)'
});
const TOPIC_EVENTO = Object.freeze(Object.fromEntries(Object.entries(EVENTOS_CONTROL).map(([n, f]) => [n, '0x' + keccak256(f).toString('hex')])));
const VISTAS = Object.freeze({ owner: '0x8da5cb5b', name: '0x06fdde03', symbol: '0x95d89b41', decimals: '0x313ce567', total_supply: '0x18160ddd', paused: '0x5c975abb', implementation: '0x5c60da1b' });
const CERO = '0x' + '0'.repeat(40);
const dirNoCero = w => { const d = typeof w === 'string' && /^0x[0-9a-fA-F]{64}$/.test(w) ? dir(w) : null; return d && d !== CERO ? d : null; };

async function analizarContrato(rpc, red, direccion, { http = null, chainId = null } = {}) {
  const a = String(direccion).toLowerCase(), consultado = new Date().toISOString(), crudos = [], limites = [];
  const guarda = (tipo, r) => { if (r && r.crudo) crudos.push({ tipo, crudo: r.crudo }); return r; };
  const cod = guarda('eth_getCode', await rpc.codigo(red, a));
  if (!cod.ok) return { ok: false, no_disponible: true, red, direccion: a, consultado_utc: consultado, error: 'no se pudo leer el código: ' + cod.error, crudos };
  const code = String(cod.resultado || '0x');
  if (code === '0x') return { ok: true, red, direccion: a, consultado_utc: consultado, es_contrato: false, nota: 'cuenta sin código (dirección normal) en el bloque más reciente', crudos, limites: ['Una cuenta sin código hoy pudo tener un contrato antes (autodestrucción) o puede delegar vía EIP-7702 en el futuro.'] };
  const bytes = (code.length - 2) / 2, hash = crypto.createHash('sha256').update(Buffer.from(code.slice(2), 'hex')).digest('hex');
  const delegacion = /^0xef0100[0-9a-f]{40}$/i.test(code) ? dir(code.slice(8)) : null;
  const out = { ok: true, red, direccion: a, consultado_utc: consultado, es_contrato: !delegacion, delegacion_7702: delegacion, bytecode: { bytes, sha256: hash }, proxy: { es_proxy: false, tipo: null, implementacion: null, admin: null, beacon: null, evidencia: [] }, crudos, limites };
  if (delegacion) { out.limites.push('Es una cuenta que delega su código en otro contrato (EIP-7702): no es un contrato propio.'); return out; }

  // ---- proxy: lo que dicen las ranuras estándar y el patrón de bytecode ----
  const m1167 = /^0x363d3d373d3d3d363d73([0-9a-f]{40})5af43d82803e903d91602b57fd5bf3$/i.exec(code);
  if (m1167) { out.proxy = { es_proxy: true, tipo: 'EIP-1167 (clon mínimo)', implementacion: '0x' + m1167[1].toLowerCase(), admin: null, beacon: null, evidencia: ['el bytecode es el patrón de clon mínimo EIP-1167'] }; }
  else {
    const leer = async (nombre, s) => { const r = guarda('eth_getStorageAt:' + nombre, await rpc.almacenamiento(red, a, s)); return r.ok ? dirNoCero(r.resultado) : null; };
    const [impl, adm, bea, zosI, zosA, prox] = await Promise.all([leer('eip1967_implementacion', SLOTS.eip1967_implementacion), leer('eip1967_admin', SLOTS.eip1967_admin), leer('eip1967_beacon', SLOTS.eip1967_beacon), leer('zos_implementacion', SLOTS.zos_implementacion), leer('zos_admin', SLOTS.zos_admin), leer('eip1822_proxiable', SLOTS.eip1822_proxiable)]);
    if (impl) out.proxy = { es_proxy: true, tipo: 'EIP-1967 (transparente / UUPS)', implementacion: impl, admin: adm, beacon: null, evidencia: [`ranura EIP-1967 de implementación = ${impl}`, ...(adm ? [`ranura EIP-1967 de administrador = ${adm}`] : [])] };
    else if (bea) { const b = guarda('eth_call:beacon.implementation()', await rpc.call(red, bea, VISTAS.implementation)); out.proxy = { es_proxy: true, tipo: 'EIP-1967 beacon', implementacion: b.ok ? dirNoCero(b.resultado) : null, admin: adm, beacon: bea, evidencia: [`ranura EIP-1967 de beacon = ${bea}`] }; }
    else if (zosI) out.proxy = { es_proxy: true, tipo: 'ZeppelinOS / OpenZeppelin antiguo (p. ej. USDC)', implementacion: zosI, admin: zosA, beacon: null, evidencia: [`ranura org.zeppelinos.proxy.implementation = ${zosI}`, ...(zosA ? [`ranura org.zeppelinos.proxy.admin = ${zosA}`] : [])] };
    else if (prox) out.proxy = { es_proxy: true, tipo: 'EIP-1822 (UUPS antiguo)', implementacion: prox, admin: null, beacon: null, evidencia: [`ranura PROXIABLE = ${prox}`] };
    else out.proxy.evidencia.push('ninguna ranura estándar de proxy (EIP-1967, ZOS, EIP-1822) contiene una dirección; no descarta un proxy con ranuras propias');
  }

  // ---- funciones: las del propio código y, si es un proxy, las de su implementación ----
  const selA = new Set(selectoresDeBytecode(code)); let selI = new Set(), codImpl = null;
  if (out.proxy.implementacion) { const c = guarda('eth_getCode(implementación)', await rpc.codigo(red, out.proxy.implementacion)); if (c.ok && c.resultado && c.resultado !== '0x') { codImpl = c.resultado; selI = new Set(selectoresDeBytecode(c.resultado)); out.implementacion = { direccion: out.proxy.implementacion, bytes: (c.resultado.length - 2) / 2, sha256: crypto.createHash('sha256').update(Buffer.from(c.resultado.slice(2), 'hex')).digest('hex') }; } else out.limites.push('No se pudo leer el código de la implementación: las funciones reales del proxy no están analizadas.'); }
  out.funciones_control = [];
  for (const [s, info] of Object.entries(SEL_CONTROL)) { const en = [selA.has(s.slice(2)) && 'contrato', selI.has(s.slice(2)) && 'implementacion'].filter(Boolean); if (en.length) out.funciones_control.push({ grupo: info.grupo, firma: info.firma, selector: s, en }); }
  out.selectores = { contrato: selA.size, implementacion: selI.size };
  limites.push('Un selector presente en el bytecode indica que el contrato PUEDE tener esa función; no prueba que esté activa, quién puede llamarla ni que se haya usado.');

  // ---- vistas (OBSERVADO: lo que el propio contrato contesta) ----
  const v = {}, vista = async (n, sel, f) => { const r = guarda('eth_call:' + n + '()', await rpc.call(red, a, sel)); v[n] = r.ok ? f(r.resultado) : null; };
  await Promise.all([vista('owner', VISTAS.owner, x => dirNoCero(x)), vista('name', VISTAS.name, textoAbi), vista('symbol', VISTAS.symbol, textoAbi), vista('decimals', VISTAS.decimals, x => (/^0x[0-9a-fA-F]{64}$/.test(x) ? Number(uint(x.slice(2))) : null)), vista('total_supply', VISTAS.total_supply, x => (/^0x[0-9a-fA-F]{64}$/.test(x) ? uint(x.slice(2)).toString() : null)), vista('paused', VISTAS.paused, x => (/^0x[0-9a-fA-F]{64}$/.test(x) ? uint(x.slice(2)) !== 0n : null))]);
  out.vistas = v;

  // ---- código fuente verificado (Sourcify, gratuito) ----
  out.verificacion = { sourcify: 'no_consultado' };
  if (http && chainId) {
    try { const r = await http({ url: `https://sourcify.dev/server/v2/contract/${chainId}/${a}`, method: 'GET', timeoutMs: 15000 }); crudos.push({ tipo: 'sourcify:check-by-addresses', crudo: JSON.stringify({ consultado_utc: new Date().toISOString(), status: r.status, respuesta: r.json }) });
      // API v2: 200 = hay código verificado (match: «exact_match» o «match»); 404 = Sourcify no lo tiene (no verificado AHÍ: otro explorador podría tenerlo).
      out.verificacion = { sourcify: r.status === 200 && r.json && r.json.match ? (r.json.match === 'exact_match' ? 'verificado_exacto' : 'verificado_parcial') : r.status === 404 ? 'no_verificado' : 'error_http_' + r.status };
    } catch (e) { out.verificacion = { sourcify: 'error: ' + String(e && e.message).slice(0, 60) }; }
  }
  if (!['verificado_exacto', 'verificado_parcial'].includes(out.verificacion.sourcify)) limites.push('Sin código fuente verificado (según Sourcify; otro explorador podría tenerlo): lo dicho sobre funciones sale solo del bytecode y no se puede confirmar más.');
  // ---- clasificación por funciones (de onchain-core) ----
  try { out.clasificacion = clasificar({ nombre: v.name, selectores: [...new Set([...selA, ...selI])], proxy: out.proxy.es_proxy }); } catch { out.clasificacion = null; }
  out.limites = [...out.limites, ...limites];
  return out;
}

// Eventos de control históricos (Etherscan getLogs, con clave gratuita): quién cambió la implementación, el dueño, la lista negra, pausas, emisión/quema.
async function eventosControl(http, claveEtherscan, chainId, direccion, { nombres = null, maxPorEvento = 1000, desdeBloque = 0 } = {}) {
  if (!claveEtherscan) return { ok: false, no_disponible: true, error: 'falta la clave gratuita de Etherscan' };
  const out = [], crudos = [], consultado = new Date().toISOString();
  const pausa = ms => new Promise(r => setTimeout(r, ms));   // Etherscan gratuito: 3 consultas por segundo
  for (const n of nombres || Object.keys(TOPIC_EVENTO)) {
    const t = TOPIC_EVENTO[n]; if (!t) continue; await pausa(380);
    const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=logs&action=getLogs&address=${direccion}&topic0=${t}&fromBlock=${desdeBloque}&toBlock=latest&page=1&offset=${maxPorEvento}&apikey=${claveEtherscan}`;
    try {
      let r = await http({ url, method: 'GET', timeoutMs: 25000 });
      if (r.json && /rate limit|max calls per sec/i.test(String(r.json.result || r.json.message))) { await pausa(1500); r = await http({ url, method: 'GET', timeoutMs: 25000 }); }
      crudos.push({ tipo: 'etherscan:getLogs:' + n, crudo: JSON.stringify({ consultado_utc: new Date().toISOString(), evento: n, topic0: t, status: r.status, respuesta: r.json }) });
      const lista = r.json && Array.isArray(r.json.result) ? r.json.result : null;
      if (!lista) { out.push({ evento: n, estado: /no records/i.test(String(r.json && r.json.message)) ? 'sin_registros' : 'error', detalle: String((r.json && (r.json.result || r.json.message)) || 'sin respuesta').slice(0, 80) }); continue; }
      out.push({ evento: n, estado: 'ok', total: lista.length, truncado: lista.length >= maxPorEvento, desde_bloque: desdeBloque, registros: lista.slice(0, 20).map(l => ({ tx: l.transactionHash, bloque: parseInt(l.blockNumber, 16), utc: new Date(parseInt(l.timeStamp, 16) * 1000).toISOString().replace('.000Z', 'Z'), topics: l.topics.slice(1), data: l.data })) });
    } catch (e) { out.push({ evento: n, estado: 'error', detalle: String(e && e.message).slice(0, 60) }); }
  }
  return { ok: true, direccion, consultado_utc: consultado, eventos: out, crudos, limites: ['Etherscan devuelve como mucho ' + maxPorEvento + ' registros por consulta, desde el bloque indicado hacia delante (los más antiguos primero); si «truncado» es verdadero faltan los posteriores: acota con desdeBloque.'] };
}

// ¿Está la dirección en la lista de bloqueo del token AHORA? Es una lectura del propio contrato (OBSERVADO en el bloque consultado). Prueba las funciones que usan los tokens de Tether y de Circle:
// isBlackListed(address) (USDT clásico), isBlocked(address) (USDT0) e isBlacklisted(address) (USDC). Dice cuál contestó; si ninguna contesta NO afirma «no bloqueada»: dice que no pudo comprobarlo.
// Un bloqueo congela los tokens de ESE contrato; no impide a la dirección operar con otros activos ni con otras redes.
async function estadoBloqueo(rpc, red, token, direccion) {
  const a = String(direccion).toLowerCase().replace(/^0x/, '').padStart(64, '0'), consultado = new Date().toISOString(), intentos = [], crudos = [];
  for (const [nombre, sel] of [['isBlackListed(address)', '0x' + selector('isBlackListed(address)')], ['isBlocked(address)', '0x' + selector('isBlocked(address)')], ['isBlacklisted(address)', '0x' + selector('isBlacklisted(address)')]]) {
    const r = await rpc.call(red, token, sel + a); if (r.crudo) crudos.push({ tipo: 'eth_call:' + nombre, crudo: r.crudo });
    if (r.ok && /^0x[0-9a-fA-F]{64}$/.test(r.resultado || '')) return { ok: true, red, token: String(token).toLowerCase(), direccion: '0x' + a.slice(24), funcion: nombre, bloqueada: uint(r.resultado.slice(2)) !== 0n, consultado_utc: consultado, crudos, limites: ['Es el estado en el momento de la consulta; no dice cuándo se bloqueó (eso lo dicen los eventos).', 'Un bloqueo afecta solo a los tokens de este contrato.'] };
    intentos.push(nombre + ': ' + (r.ok ? 'respuesta vacía (la función no existe)' : r.error));
  }
  return { ok: false, no_disponible: true, red, token: String(token).toLowerCase(), direccion: '0x' + a.slice(24), consultado_utc: consultado, error: 'el contrato no contestó a isBlackListed, isBlocked ni isBlacklisted (' + intentos.join(' | ') + '): no se pudo comprobar su lista de bloqueo', crudos };
}

module.exports = { analizarContrato, eventosControl, estadoBloqueo, SLOTS, SEL_CONTROL, TOPIC_EVENTO, FIRMAS_CONTROL };
