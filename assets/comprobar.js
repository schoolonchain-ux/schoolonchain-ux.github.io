/* Zona «Comprobar»: las tres comprobaciones que acompañan a la de bloqueos de Tether (esa vive en herramientas.js):
   · ¿es una cuenta normal o un contrato?, y si es un contrato, ¿es el USDT oficial o una imitación?
   · ¿aparece entre los hackeos documentados? (lista fija en data/incidentes-defi.json: solo Ethereum y Polygon)
   · ficha básica: TRON (creación, saldo, stake, últimos movimientos de tokens y contrapartes) o Ethereum (saldo y transacciones enviadas).
   Todo son lecturas públicas de solo lectura desde el navegador (nodos RPC, TronGrid y un fichero de la propia web), sin IA, sin claves y sin guardar nada.
   Cada función devuelve { clase, icono, titulo, texto, extra, fuente }; quien la llama la pinta. Si una lectura falla, lanza el error: nunca se inventa un resultado. */
(function () {
  const { el, n } = C;
  const U = window.USDT;
  const GRID = 'https://api.trongrid.io';
  const TRON_USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
  // «Se hace pasar por USDT»: símbolo que empieza por USDT / USD₮, o nombre «Tether USD…». (Otros productos de Tether, como Tether Gold, no cuentan.)
  const imita = (sim, nom) => /^usd[t₮]/i.test(String(sim).trim()) || /^tether\s*usd/i.test(String(nom).trim());
  const post = (url, cuerpo) => U.jsonReintento(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) }, 9000, 3);
  const corto = (a) => a.slice(0, 6) + '…' + a.slice(-5);
  const hace = (t) => { const d = (Date.now() - t) / 86400000; if (d < 1) return 'hoy'; if (d < 60) return 'hace ' + n(Math.round(d)) + ' días'; if (d < 700) return 'hace ' + n(Math.round(d / 30.4)) + ' meses'; return 'hace ' + n(d / 365.25, 1) + ' años'; };
  const fecha = (t) => new Date(t).toISOString().slice(0, 10);
  const enlace = (u, t) => el('a', { href: u, target: '_blank', rel: 'noopener' }, t);

  // texto de una respuesta ABI (string dinámico o bytes32 de los tokens antiguos)
  function aTexto(hex) {
    hex = String(hex || '').replace(/^0x/, ''); if (!hex) return '';
    const bytes = (h) => Uint8Array.from(h.match(/../g) || [], (v) => parseInt(v, 16));
    try {
      if (hex.length === 64) return new TextDecoder().decode(bytes(hex)).replace(/\0+$/, '');
      const len = parseInt(hex.slice(64, 128), 16); if (!(len > 0 && len < 200)) return '';
      return new TextDecoder().decode(bytes(hex.slice(128, 128 + len * 2)));
    } catch (e) { return ''; }
  }

  /* ---------- 2 · cuenta o contrato ---------- */
  async function contrato(dir, tron, redes) {
    if (!tron) {
      const eth = redes.find((r) => r.id === 'ethereum');
      const oficial = redes.find((r) => r.tipo === 'evm' && r.contrato.toLowerCase() === dir.toLowerCase());
      if (oficial) return { clase: 'verde', icono: '✅', titulo: 'Es el contrato oficial de ' + oficial.token + ' en ' + oficial.nombre, texto: 'Coincide con el contrato que esta web consulta en esa red.', fuente: 'Lista de contratos de la web · data/redes-usdt.json' };
      const cod = await U.rpc(eth.rpc, 'eth_getCode', [dir, 'latest']);
      const deleg = /^0xef0100([0-9a-f]{40})$/i.exec(cod || '');   // EIP-7702: una cuenta normal que delega su comportamiento en un contrato
      if (deleg) return { clase: 'amar', icono: '🟡', titulo: 'Es una cuenta normal que delega su comportamiento en un contrato (EIP-7702)', texto: 'No es un contrato en sí: es una cuenta de persona que ha activado una función de Ethereum para comportarse como el contrato 0x' + deleg[1] + '. No indica nada malo por sí sola, pero conviene saber a quién delega.', extra: el('p', { class: 'sec-p' }, enlace('https://etherscan.io/address/0x' + deleg[1], 'ver el contrato delegado ↗')), fuente: 'Lectura en vivo · nodo público de Ethereum' };
      if (!cod || cod === '0x') return { clase: 'verde', icono: '🟢', titulo: 'Es una cuenta normal, no un contrato (en Ethereum)', texto: 'Si fuera un contrato, aquí diría si es el USDT oficial o una imitación que se hace pasar por él. La misma dirección puede ser un contrato en otra red: esto mira Ethereum.', fuente: 'Lectura en vivo · nodo público de Ethereum' };
      let sim = '', nom = '';
      try { sim = aTexto(await U.rpc(eth.rpc, 'eth_call', [{ to: dir, data: '0x95d89b41' }, 'latest'])); } catch (e) { /* sin symbol() */ }
      try { nom = aTexto(await U.rpc(eth.rpc, 'eth_call', [{ to: dir, data: '0x06fdde03' }, 'latest'])); } catch (e) { /* sin name() */ }
      const nombre = [nom, sim].filter(Boolean).join(' · ');
      if (imita(sim, nom)) return { clase: 'rojo', icono: '🔴', titulo: 'Es un contrato que se hace pasar por USDT: se llama «' + (sim || nom) + '» pero no es ninguno de los oficiales', texto: 'No coincide con ningún contrato oficial de USDT ni USDT0 de la lista. Un token con ese nombre en otra dirección es una imitación.', fuente: 'Lectura en vivo · nodo público de Ethereum' };
      return { clase: 'amar', icono: '🟡', titulo: 'Es un contrato' + (nombre ? ': ' + nombre : ''), texto: 'No es ninguno de los contratos oficiales de USDT o USDT0 de la lista. Esta comprobación no dice si el contrato es seguro, solo qué es.', fuente: 'Lectura en vivo · nodo público de Ethereum' };
    }
    if (dir === TRON_USDT) return { clase: 'verde', icono: '✅', titulo: 'Es el contrato oficial de USDT en TRON', texto: 'Coincide con el contrato que esta web consulta en TRON.', fuente: 'Lista de contratos de la web · data/redes-usdt.json' };
    const c = await post(GRID + '/wallet/getcontract', { value: dir, visible: true });
    if (!c || !c.contract_address) return { clase: 'verde', icono: '🟢', titulo: 'Es una cuenta normal, no un contrato', texto: 'Si fuera un contrato, aquí diría si es el USDT oficial o una imitación que se hace pasar por él.', fuente: 'Lectura en vivo · TronGrid' };
    let sim = ''; try { const r = await post(GRID + '/wallet/triggerconstantcontract', { owner_address: dir, contract_address: dir, function_selector: 'symbol()', visible: true }); sim = aTexto(r && r.constant_result && r.constant_result[0]); } catch (e) { /* sin symbol() */ }
    const nom = c.name || '';
    const nombre = [nom, sim].filter(Boolean).join(' · ');
    if (imita(sim, nom)) return { clase: 'rojo', icono: '🔴', titulo: 'Es un contrato que se hace pasar por USDT: se llama «' + (sim || nom) + '» pero no es el oficial', texto: 'El USDT oficial de TRON es ' + TRON_USDT + '. Un token con ese nombre en otra dirección es una imitación.', fuente: 'Lectura en vivo · TronGrid' };
    return { clase: 'amar', icono: '🟡', titulo: 'Es un contrato' + (nombre ? ': ' + nombre : ''), texto: 'No es el contrato oficial de USDT. Esta comprobación no dice si el contrato es seguro, solo qué es.', fuente: 'Lectura en vivo · TronGrid' };
  }

  /* ---------- 3 · hackeos documentados ---------- */
  let cacheInc = null;
  const incidentes = () => cacheInc || (cacheInc = U.json('data/incidentes-defi.json', {}, 15000).catch((e) => { cacheInc = null; throw e; }));
  async function hackeos(dir, tron) {
    const D = await incidentes();
    const base = 'Lista fija de ' + n(D.n) + ' hackeos de DeFiHackLabs · última revisión ' + D.revisadoEn;
    if (tron) return { clase: 'amar', icono: '🟡', titulo: 'La base de hackeos no cubre TRON', texto: 'Solo recoge casos de ' + Object.keys(D.redes).map((r) => r[0].toUpperCase() + r.slice(1)).join(' y ') + ', así que para una dirección de TRON esto no descarta nada.', fuente: base };
    const hit = D.direcciones[dir.toLowerCase()];
    if (!hit) return { clase: 'amar', icono: '🟡', titulo: 'No aparece entre los ' + n(D.n) + ' hackeos documentados', texto: 'La base solo recoge casos de Ethereum y Polygon: que no aparezca no significa que esté limpia.', fuente: base };
    const lista = el('ul', { class: 'sec-lista' }, hit.map(([i, k]) => { const x = D.incidentes[i]; return el('li', null, enlace(x.s, x.n), ' · ' + x.f + (x.p ? ' · pérdida declarada ' + x.p : '') + ' — ' + D.roles[k]); }));
    return { clase: 'rojo', icono: '🔴', titulo: 'Aparece en ' + hit.length + ' hackeo' + (hit.length > 1 ? 's' : '') + ' documentado' + (hit.length > 1 ? 's' : ''), texto: 'Que aparezca no dice por sí solo que sea culpable: la lista incluye atacantes atribuidos por la fuente, pero también contratos o cuentas que participaron en la transacción.', extra: lista, fuente: base };
  }

  /* ---------- 4 · ficha ---------- */
  async function ficha(dir, tron, redes, ctx) {
    if (tron) {
      const a = await post(GRID + '/wallet/getaccount', { address: dir, visible: true });
      const ver = enlace('https://tronscan.org/#/address/' + dir, 'ver en TronScan ↗');
      if (!a || !a.address) return { clase: '', icono: '📇', titulo: 'Ficha de TRON · cuenta no activada', texto: 'Esta dirección todavía no ha recibido nada en TRON, o no existe.', extra: el('p', { class: 'sec-p' }, ver), fuente: 'Lectura en vivo · TronGrid' };
      const trx = (Number(a.balance) || 0) / 1e6, stake = (a.frozenV2 || []).reduce((s, f) => s + (Number(f.amount) || 0), 0) / 1e6;
      const pend = (a.unfrozenV2 || []).reduce((s, u) => s + (Number(u.unfreeze_amount) || 0), 0) / 1e6;
      let movs = null; try { const j = await U.jsonReintento(GRID + '/v1/accounts/' + dir + '/transactions/trc20?limit=50&only_confirmed=true', {}, 9000, 3); movs = j.data || []; } catch (e) { /* sin movimientos */ }
      const cuenta = {}; for (const m of movs || []) { const o = m.from === dir ? m.to : m.from; if (o && o !== dir) cuenta[o] = (cuenta[o] || 0) + 1; }
      const top = Object.entries(cuenta).sort((x, y) => y[1] - x[1]).slice(0, 3);
      const chips = top.length ? el('div', { class: 'mini' }, top.map(([o, k]) => el('button', { type: 'button', class: 'chip', title: 'Comprobar esta dirección', onclick: () => ctx.irA(o) }, corto(o) + ' · ' + k + ' mov.'))) : null;
      const ult = movs && movs[0] ? movs[0].block_timestamp : null;
      const partes = [a.create_time ? 'Creada ' + hace(a.create_time) + ' (' + fecha(a.create_time) + ')' : null, 'saldo libre ' + n(trx, trx < 100 ? 2 : 0) + ' TRX', stake ? 'en stake ' + n(stake, 0) + ' TRX' : null, pend ? n(pend, 0) + ' TRX descongelándose' : null, ult ? 'último movimiento de tokens ' + hace(ult) : (movs ? 'sin movimientos de tokens recientes' : 'movimientos de tokens no disponibles ahora')].filter(Boolean);
      return { clase: '', icono: '📇', titulo: 'Ficha de TRON', texto: partes.join(' · ') + '.' + (top.length ? ' Contrapartes más frecuentes en sus últimos ' + movs.length + ' movimientos de tokens (pulsa una para comprobarla):' : ''), extra: el('div', null, chips, el('p', { class: 'sec-p' }, ver)), fuente: 'Lectura en vivo · TronGrid' };
    }
    const eth = redes.find((r) => r.id === 'ethereum');
    const [bal, nonce] = await Promise.all([U.rpc(eth.rpc, 'eth_getBalance', [dir, 'latest']), U.rpc(eth.rpc, 'eth_getTransactionCount', [dir, 'latest'])]);
    const e = Number(BigInt(bal)) / 1e18, k = parseInt(nonce, 16);
    return { clase: '', icono: '📇', titulo: 'Ficha en Ethereum', texto: 'Saldo ' + n(e, e < 1 ? 4 : 2) + ' ETH · ' + n(k) + ' transacciones enviadas desde esta dirección. Para ver sus movimientos y contrapartes, ábrela en el explorador.', extra: el('p', { class: 'sec-p' }, enlace('https://etherscan.io/address/' + dir, 'ver en Etherscan ↗')), fuente: 'Lectura en vivo · nodo público de Ethereum' };
  }

  window.COMPROBAR = { contrato, hackeos, ficha, aTexto, imita };
})();
