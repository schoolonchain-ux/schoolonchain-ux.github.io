'use strict';
// CAPA 4 · Poderes del emisor sobre cada TOKEN subyacente (independientes de JustLend): ¿puede crear unidades, congelar direcciones, pausar o destruir saldos? Se lee el ABI publicado de cada contrato de token y su `owner()`.
// El ABI dice QUÉ funciones existen, no quién puede llamarlas: los permisos se atribuyen al diseño estándar «TetherToken» (onlyOwner) solo cuando el ABI coincide con él.
const L = require('./lib.cjs'); L.usar('35-2026-11-13'); const A = require('./abi.cjs'); const path = require('node:path');
(async () => {
  const d04 = require('./resultados/04-liquidez-por-mercado.json').mercados; const vistos = new Map(); for (const m of d04) if (m.simbolo !== 'jTRX' && !vistos.has(m.subyacente)) vistos.set(m.subyacente, { simbolo: m.simboloSubyacente, mercados: [] }); for (const m of d04) if (vistos.has(m.subyacente)) vistos.get(m.subyacente).mercados.push(m.jToken);
  const out = [];
  for (const [dir, info] of vistos) {
    const c = await L.post('https://api.trongrid.io/wallet/getcontract', { value: dir, visible: true }); const fn = ((c.abi && c.abi.entrys) || []).filter(e => e.type === 'Function' || e.type === 'function').map(e => e.name); const tiene = re => fn.filter(n => re.test(n));
    const lista = tiene(/^(addBlackList|addBlacklist|blacklist|addToBlacklist|setBlacklist|freeze|addBlackListed|blockAccount)$/i), destruye = tiene(/^(destroyBlackFunds|destroyBlackFunds|wipeBlacklistedAddress|burnBlackFunds)$/i), pausa = tiene(/^(pause|setPaused|pauseToken)$/i), crea = tiene(/^(issue|mint|mintTo|issueTokens)$/i), proxy = tiene(/^(upgradeTo|implementation|proxiableUUID)$/i);
    let owner = null; for (const f of ['owner()', 'getOwner()', 'admin()']) { const r = await A.llamar(dir, f); if (r.ok) { owner = A.dirDe(r.hex); break; } }
    out.push({ token: info.simbolo, direccion: dir, nombreContrato: c.name || null, verificadoAbi: fn.length > 0, nFunciones: fn.length, congelar: lista, destruirSaldos: destruye, pausa, crear: crea, esProxy: proxy, owner, mercados: info.mercados });
    console.log(info.simbolo.padEnd(9), dir, '| ABI', String(fn.length).padStart(3), '| congelar:', lista.join('/') || '—', '| destruir:', destruye.join('/') || '—', '| pausa:', pausa.join('/') || '—', '| crear:', crea.join('/') || '—', '| owner:', owner || '—');
  }
  // estado concreto en los dos tokens «tipo Tether» de ETH y BTC: ¿están congelados los contratos de JustLend o la cuenta grande?
  const est = {}; const chk = async (tok, who, nom) => { const r = await A.llamar(tok, 'isBlackListed(address)', [A.argAddr(who)]); est[tok + ':' + nom] = r.ok ? A.u(r.hex) !== 0n : null; };
  await chk('THb4CqiFdwNHsWsQCs4JhzwjMWys4aqCbF', 'TR7BUFRQeq1w5jAZf1FKx85SHuX6PfMqsV', 'jETH'); await chk('THb4CqiFdwNHsWsQCs4JhzwjMWys4aqCbF', 'TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb', 'TCQQ'); await chk('TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9', 'TLeEu311Cbw63BcmMHDgDLu7fnk9fqGcqT', 'jBTC'); await chk('TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9', 'TUjx6w55Nx9G4GjjRNEB4e7w5BUH3WmJTZ', 'TUjx');
  console.log('¿en lista negra?', JSON.stringify(est));
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '35-poderes-de-token.json'), { leido: new Date().toISOString(), tokens: out, listaNegra: est }));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });
