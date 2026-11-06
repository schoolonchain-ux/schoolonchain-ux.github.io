/* Herramientas on-chain: comprobador de bloqueos de USDT, bloqueos recientes de Tether y calendario de descongelaciones de TRX.
   Todo se lee en vivo desde el navegador con nodos públicos; el calendario usa una lectura de EquipoIA guardada en data/desbloqueos-trx.json. */
(function () {
  const { el, n, m } = C;
  const TRON_USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
  const GRID = 'https://api.trongrid.io';
  const ETH_USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
  const EXPLORER = { ethereum: 'https://etherscan.io', avalanche: 'https://snowtrace.io', arbitrum: 'https://arbiscan.io', polygon: 'https://polygonscan.com' };
  const q = new URLSearchParams(location.search);
  const ahoraMs = () => Date.now();
  const fh = (t) => new Date(t).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

  /* direcciones, lectura de nodos y consulta por red: en assets/usdt-core.js (compartido con la portada) */
  const { tronAHex20, hex20ATron, esEvm, parecePrivada, json, dormir, jsonReintento, rpc, pad32, tronCall, aBool, aNum, consultar } = window.USDT;

  /* ---------- estructura: cinco zonas con pestañas ---------- */
  const TABS = []; let redes = null;
  const montado = {};   // montado[id]: contenedor ya dibujado de cada herramienta que monta este fichero
  const RAIZ = { comprobar: 'comprobar-raiz', recientes: 'recientes-raiz', desbloqueos: 'desbloqueos-raiz' };
  // Enlaces antiguos y nuevos → zona (y pestaña) a la que llevan. Los antiguos (#comprobar, #recientes, #desbloqueos, #riesgo-mercado,
  // #liquidez-venta, #paridad-stablecoins) los usan la portada, el teletipo y los informes: tienen que seguir funcionando.
  const RUTAS = {
    comprobar: { zona: 'comprobar' }, 'z-comprobar': { zona: 'comprobar' },
    recientes: { zona: 'tether', tab: 'recientes' }, 'z-tether': { zona: 'tether' }, 'paridad-stablecoins': { zona: 'tether', tab: 'paridad' },
    'z-cartera': { zona: 'cartera' }, 'riesgo-mercado': { zona: 'cartera', tab: 'riesgo' }, 'liquidez-venta': { zona: 'cartera', tab: 'salida' },
    'z-mercado': { zona: 'mercado' },
    desbloqueos: { zona: 'trx', tab: 'desbloqueos' }, 'z-trx': { zona: 'trx' },
  };
  const cifra = (zona, texto) => { const c = document.querySelector('[data-cifra="' + zona + '"]'); if (c) c.textContent = texto; };
  function pestana(zona, tab) {
    const sec = document.getElementById('z-' + zona); if (!sec || !tab) return;
    sec.querySelectorAll('.ztabs button').forEach((b) => { const on = b.dataset.tab === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
    sec.querySelectorAll('.zpan').forEach((p) => { p.hidden = p.dataset.tab !== tab; });
  }
  function irAZona(clave, { bajar = true, hash = true } = {}) {
    const r = RUTAS[clave]; if (!r) return false;
    if (r.tab) pestana(r.zona, r.tab);
    if (bajar) document.getElementById('z-' + r.zona).scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (hash) { try { history.replaceState(null, '', location.pathname + location.search + '#' + clave); } catch (e) { /* sin historial */ } }
    return true;
  }
  function abrirTab(id) { irAZona(id); }
  // Las herramientas largas (últimos bloqueos, descongelaciones) enseñan lo principal y el resto se abre con «Ver todo».
  const ALTO = { recientes: 600, desbloqueos: 620 }, vigias = {};
  function plegable(id) {
    const w = document.getElementById(RAIZ[id]); if (!w || !ALTO[id]) return;
    w.classList.add('plegable'); w.style.setProperty('--alto', ALTO[id] + 'px');
    let b = w.nextElementSibling && w.nextElementSibling.classList.contains('ver-mas') ? w.nextElementSibling : null;
    if (!b) { b = el('button', { type: 'button', class: 'btn ver-mas', hidden: true }, 'Ver todo ↓'); w.after(b); b.addEventListener('click', () => { const ab = w.classList.toggle('abierto'); b.textContent = ab ? 'Ver menos ↑' : 'Ver todo ↓'; if (!ab) w.closest('.zp').scrollIntoView({ behavior: 'smooth', block: 'start' }); }); }
    const ajustar = () => { const largo = w.firstElementChild && w.firstElementChild.getBoundingClientRect().height > ALTO[id] + 40; w.classList.toggle('corta', !largo); b.hidden = !largo; };
    if (vigias[id]) vigias[id].disconnect();
    if (typeof ResizeObserver === 'function' && w.firstElementChild) { vigias[id] = new ResizeObserver(ajustar); vigias[id].observe(w.firstElementChild); }
    ajustar(); [1500, 4000].forEach((ms) => setTimeout(ajustar, ms));   // por si el contenido llega sin que el vigía lo note
  }
  function remontar(id) {
    const t = TABS.find((x) => x.id === id); if (!t) return;
    montado[id] = el('div'); t.render(montado[id]); document.getElementById(RAIZ[id]).replaceChildren(montado[id]); plegable(id);
  }
  const caja = (titulo, ...k) => el('div', { class: 'card', style: 'margin:12px 0' }, titulo ? el('h3', null, titulo) : null, ...k);
  const llano = (...t) => el('details', { class: 'como' }, el('summary', null, 'En pocas palabras: ¿qué es esto y cómo funciona?'), ...t.map((x) => el('p', { html: x })));

  /* =============== 1 · Comprobar =============== */
  TABS.push({ id: 'comprobar', titulo: '1 · Comprobar', render(root) {
    const out = el('div');
    const inp = el('input', { type: 'text', id: 'dir', placeholder: 'Pega una dirección: 0x… (Ethereum y otras 19 redes) o T… (TRON)', autocomplete: 'off', spellcheck: 'false' });
    const btn = el('button', { class: 'btn primary', onclick: () => ir(inp.value.trim()) }, 'Comprobar');
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') ir(inp.value.trim()); });
    const ejemplos = el('div', { class: 'ex' }, 'Ejemplos reales del caso Binance Hack:', [['Bloqueada en TRON', 'TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi'], ['Dirección principal en Ethereum', '0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c']].map(([t, a]) => el('button', { onclick: () => { inp.value = a; ir(a); } }, t)));
    root.append(
      el('div', { class: 'buscar' }, el('h2', null, 'Pega una dirección'), el('p', { class: 'sub' }, 'Según lo que pegues salen unas comprobaciones u otras: una dirección 0x… se mira en las 20 redes compatibles con Ethereum (es la misma en todas) y una dirección T… se mira en TRON.'), el('div', { class: 'tool-in sbox' }, inp, btn), ejemplos, el('p', { class: 'hint' }, 'No pegues claves privadas ni frases semilla: no hace falta y no se procesan. La consulta sale de tu navegador a nodos públicos; no se guarda nada.')),
      out,
      el('details', { class: 'como' },
        el('summary', null, 'Cómo leer cada comprobación'),
        el('div', { class: 'ayuda' },
          el('div', { class: 'ai', html: '<b>1 · Bloqueo de Tether.</b> Pregunta al contrato de USDT (o USDT0) de cada red si la dirección está en su lista negra. Si lo está y hay saldo, queda inmovilizado. Consulta <code>isBlackListed</code> en Ethereum y TRON y <code>isBlocked</code> en las demás redes. <a href="data/redes-usdt.json">Ver los contratos y nodos por red</a>.' }),
          el('div', { class: 'ai', html: '<b>2 · Cuenta o contrato.</b> Mira si la dirección es una cuenta normal o un contrato. Si es un contrato, dice si es uno de los USDT oficiales de la lista o si se hace pasar por USDT con otro contrato. No dice si un contrato es seguro. Para direcciones 0x mira Ethereum.' }),
          el('div', { class: 'ai', html: '<b>3 · Hackeos documentados.</b> Busca la dirección en una lista fija de hackeos de DeFiHackLabs (solo Ethereum y Polygon). Aparecer no prueba culpabilidad; no aparecer no prueba que esté limpia.' }),
          el('div', { class: 'ai', html: '<b>4 · Ficha.</b> Datos básicos leídos de la cadena: en TRON, creación, saldo, stake y contrapartes más frecuentes; en Ethereum, saldo y transacciones enviadas.' }),
          el('div', { class: 'ai', html: '<b>Qué no hace.</b> No dice quién es el titular, no evalúa la seguridad de la dirección y no mira los demás tokens de la billetera.' }))));

    // una fila de resultado: icono, título, texto, detalle opcional y, abajo, de dónde sale y a qué hora se leyó
    const hhmm = () => new Date().toISOString().slice(11, 16) + ' UTC';
    const secc = (clase, icono, titulo, texto, fuente, extra) => el('div', { class: 'sec ' + (clase || '') }, el('div', { class: 'ic' }, icono), el('div', { class: 'sb' }, el('b', null, titulo), texto ? el('p', null, texto) : null, extra || null, fuente ? el('div', { class: 'pie' }, fuente + ' · ' + hhmm()) : null));
    const pintaR = (r) => secc(r.clase, r.icono, r.titulo, r.texto, r.fuente, r.extra);
    const enEspera = (titulo) => el('div', { class: 'sec esp' }, el('div', { class: 'ic' }, el('span', { class: 'spin' })), el('div', { class: 'sb' }, el('b', null, titulo)));
    const fallo = (que, e) => secc('amar', '⚪', 'No se pudo comprobar ahora: ' + que, 'La lectura falló (' + String(e && e.message || e).slice(0, 50) + '). Prueba de nuevo en un momento: los nodos públicos a veces se saturan.', null);

    let ronda = 0;
    async function ir(dir) {
      out.textContent = '';
      if (!dir) return;
      if (parecePrivada(dir)) { out.append(el('div', { class: 'res-head warn' }, el('div', { class: 'big' }, 'Eso parece una clave privada o una frase semilla'), el('div', { class: 'sub2' }, 'No se ha procesado ni enviado a ningún sitio. No la compartas con nadie y no la pegues en webs. Pega solo una dirección pública.'))); return; }
      const evm = esEvm(dir); const tron = !evm && /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(dir) && (await tronAHex20(dir));
      if (!evm && !tron) { out.append(el('div', { class: 'res-head warn' }, el('div', { class: 'big' }, 'No reconozco esa dirección'), el('div', { class: 'sub2' }, 'Debe ser 0x seguido de 40 caracteres (Ethereum y redes EVM) o una dirección TRON que empiece por T (34 caracteres).'))); return; }
      const lista = redes.filter((r) => (evm ? r.tipo === 'evm' : r.tipo === 'tron'));
      const mi = ++ronda; try { history.replaceState(null, '', '?dir=' + dir + (location.hash || '#comprobar')); } catch (e) { /* ok */ }
      const ranuras = [el('div'), el('div'), el('div'), el('div')];
      const pon = (i, nodo) => { if (mi === ronda) ranuras[i].replaceChildren(nodo); };
      ranuras[0].append(enEspera('Preguntando al contrato de USDT en ' + lista.length + ' red' + (lista.length > 1 ? 'es' : '') + '…'));
      ranuras[1].append(enEspera('Mirando si es una cuenta o un contrato…'));
      ranuras[2].append(enEspera('Buscando en los hackeos documentados…'));
      ranuras[3].append(enEspera('Leyendo la ficha de la dirección…'));
      out.append(el('p', { class: 'hint', style: 'margin:12px 0 0' }, 'Detectado: ' + (tron ? 'dirección de TRON' : 'dirección compatible con Ethereum (0x…)') + ' · se aplican 4 comprobaciones · ', el('span', { class: 'mono' }, dir)), el('div', { class: 'res' }, ranuras));

      // 1 · bloqueo de Tether (es la lectura de siempre: una pregunta por red, y las celdas se rellenan según llegan)
      const grid = el('div', { class: 'netgrid' }); const celdas = new Map();
      lista.forEach((r) => { const c = el('div', { class: 'net' }, el('div', { class: 'nn' }, r.nombre, el('span', { class: 'tk' }, r.token)), el('div', { class: 'st' }, 'consultando…')); celdas.set(r.id, c); grid.append(c); });
      const bloqueo = (async () => {
        const res = await Promise.all(lista.map(async (r) => { const x = await consultar(r, dir); if (mi !== ronda) return x; const c = celdas.get(r.id); c.className = 'net ' + (x.estado === 'bloqueada' ? 'bad' : x.estado === 'libre' ? 'ok' : 'err'); c.querySelector('.st').textContent = x.estado === 'bloqueada' ? '🔴 EN BLACKLIST' + (x.saldo != null ? ' · ' + n(x.saldo, 2) + ' ' + r.token + ' congelados' : '') : x.estado === 'libre' ? '🟢 No está en blacklist' : '⚪ No se pudo comprobar'; return { r, ...x }; }));
        if (mi !== ronda) return;
        const bl = res.filter((x) => x.estado === 'bloqueada'), er = res.filter((x) => x.estado === 'error'), li = res.filter((x) => x.estado === 'libre');
        const congelado = bl.reduce((s, x) => s + (x.saldo || 0), 0);
        const verRedes = res.length > 1 ? el('details', { class: 'sec-det', open: bl.length || er.length ? true : null }, el('summary', null, 'Ver las ' + res.length + ' redes una a una'), grid) : null;
        let clase, icono, titulo, texto;
        if (bl.length) { clase = 'rojo'; icono = '🔴'; titulo = 'Bloqueada por Tether en ' + bl.map((x) => x.r.nombre).join(', ') + (congelado ? ' · ' + n(congelado, 2) + ' USDT congelados' : ''); texto = 'Consultado en directo al contrato de USDT.' + (res.length === 1 ? ' En las otras 20 redes no aplica: es una dirección de TRON.' : ' ' + (er.length ? 'En ' + li.length + ' de las otras ' + (res.length - bl.length) + ' redes figura libre y en ' + er.length + ' no se pudo comprobar.' : 'En las otras ' + li.length + ' redes figura libre.')); }
        else if (er.length) { clase = 'amar'; icono = '⚪'; titulo = 'No consta bloqueada, pero no se pudo comprobar en ' + er.length + ' red' + (er.length > 1 ? 'es' : ''); texto = li.length + ' de ' + res.length + ' redes la dan como libre; el resto no respondió.'; }
        else { clase = 'verde'; icono = '🟢'; titulo = 'No está en la lista negra de USDT'; texto = res.length === 1 ? 'Consultado en directo al contrato de USDT en TRON.' : 'Las ' + res.length + ' redes consultadas la dan como libre. Esto solo mira el USDT de cada red, no los demás tokens.'; }
        pon(0, secc(clase, icono, titulo, texto, 'Lectura en vivo · nodos públicos', verRedes));
      })().catch((e) => pon(0, fallo('bloqueo de Tether', e)));

      // 2, 3 y 4 · llegan cuando llegan (las lecturas a TronGrid van en fila: ver usdt-core.js)
      const t2 = COMPROBAR.contrato(dir, !!tron, redes).then((r) => pon(1, pintaR(r)), (e) => pon(1, fallo('cuenta o contrato', e)));
      const t3 = COMPROBAR.hackeos(dir, !!tron).then((r) => pon(2, pintaR(r)), (e) => pon(2, fallo('hackeos documentados', e)));
      const t4 = COMPROBAR.ficha(dir, !!tron, redes, { irA: (d) => { inp.value = d; ir(d); } }).then((r) => pon(3, pintaR(r)), (e) => pon(3, fallo('ficha', e)));
      await Promise.all([bloqueo, t2, t3, t4]);
    }
    if (q.get('dir')) { inp.value = q.get('dir'); ir(q.get('dir')); }
    root.irA = (d) => { inp.value = d; ir(d); };
  } });

  /* =============== 2 · Últimos bloqueos =============== */
  TABS.push({ id: 'recientes', titulo: '2 · Últimos bloqueos de Tether', render(root) {
    root.append(llano('Cada vez que Tether bloquea o libera una dirección, el contrato de USDT deja un registro público (<b>AddedBlackList</b> / <b>RemovedBlackList</b>). Aquí se leen <b>los más recientes en TRON y en Ethereum</b>, en directo.',
      'Pulsa una dirección para <b>comprobar al momento</b> en cuántas redes sigue bloqueada y cuánto USDT tiene congelado.'));
    const cuerpo = el('div', null, el('p', { class: 'loading' }, el('span', { class: 'spin' }), 'Leyendo los últimos bloqueos de TRON y Ethereum…'));
    root.append(cuerpo);
    (async () => {
      const filas = []; const avisos = [];
      const tronEv = async (ev, tipo) => { const j = await jsonReintento(GRID + '/v1/contracts/' + TRON_USDT + '/events?event_name=' + ev + '&only_confirmed=true&limit=100&order_by=block_timestamp,desc'); for (const d of j.data || []) { const u = d.result && (d.result._user || d.result['0']); if (!u) continue; filas.push({ t: d.block_timestamp, red: 'TRON', tipo, dirHex: u, tx: d.transaction_id }); } };
      const ethLogs = async () => {
        const urls = ['https://rpc.mevblocker.io'];
        const ult = parseInt(await rpc(urls, 'eth_blockNumber', []), 16); let logs = null, span = 100000;
        for (const sp of [100000, 100000, 50000, 50000, 20000, 9000]) { try { logs = await rpc(urls, 'eth_getLogs', [{ fromBlock: '0x' + (ult - sp).toString(16), toBlock: 'latest', address: ETH_USDT, topics: [['0x42e160154868087d6bfdc0ca23d96a1c1cfa32f1b72ba9ba27b69b98a0d819dc', '0xd7e9ec6e6ecd65492dce6bf513cd6867560d49544421d0783ddf06e76c24470c']] }], 25000); span = sp; break; } catch (e) { await dormir(900); } }
        if (!logs) throw new Error('sin respuesta del nodo');
        const bloques = [...new Set(logs.map((l) => l.blockNumber))]; const ts = {};
        await Promise.all(bloques.map(async (b) => { try { const bl = await rpc(urls, 'eth_getBlockByNumber', [b, false]); ts[b] = parseInt(bl.timestamp, 16) * 1000; } catch (e) { ts[b] = ahoraMs() - (ult - parseInt(b, 16)) * 12000; } }));
        for (const l of logs) filas.push({ t: ts[l.blockNumber], red: 'Ethereum', tipo: l.topics[0].startsWith('0x42e16') ? 'Bloqueada' : 'Liberada', dirEvm: '0x' + (l.topics[1] || l.data).slice(-40), tx: l.transactionHash });
        return span;
      };
      const rs = []; rs.push(await tronEv('AddedBlackList', 'Bloqueada').then(() => ({ status: 'fulfilled' }), (e) => ({ status: 'rejected', reason: e }))); rs.push(await tronEv('RemovedBlackList', 'Liberada').then(() => ({ status: 'fulfilled' }), (e) => ({ status: 'rejected', reason: e }))); rs.push(await ethLogs().then((v) => ({ status: 'fulfilled', value: v }), (e) => ({ status: 'rejected', reason: e })));
      if (rs[0].status === 'rejected' || rs[1].status === 'rejected') avisos.push('No se pudo leer parte de los eventos de TRON (' + String((rs[0].reason || rs[1].reason).message).slice(0, 40) + ').');
      if (rs[2].status === 'rejected') avisos.push('No se pudo leer Ethereum ahora mismo (' + String(rs[2].reason.message).slice(0, 40) + '); se muestran solo los de TRON.');
      const spanEth = rs[2].status === 'fulfilled' ? rs[2].value : null;
      for (const f of filas) f.dir = f.dirEvm || await hex20ATron(f.dirHex);
      filas.sort((a, b) => b.t - a.t);
      cuerpo.textContent = '';
      if (avisos.length) cuerpo.append(el('div', { class: 'res-head warn' }, el('div', { class: 'sub2' }, avisos.join(' '), ' ', el('button', { class: 'mini', onclick: () => remontar('recientes') }, '↻ Reintentar'))));
      const ahora = ahoraMs(), d24 = filas.filter((f) => f.tipo === 'Bloqueada' && ahora - f.t < 86400000), d7 = filas.filter((f) => f.tipo === 'Bloqueada' && ahora - f.t < 7 * 86400000);
      const tronAdd = filas.filter((f) => f.red === 'TRON' && f.tipo === 'Bloqueada'); const tronTope = tronAdd.length >= 100 ? tronAdd[tronAdd.length - 1].t : 0;   // si la lectura llegó al tope de 100, lo anterior a esa fecha no se ha visto
      const cap = (dias) => (tronTope && tronTope > ahora - dias * 86400000 ? '≥ ' : '');
      cifra('tether', cap(1) + n(d24.length) + ' bloqueos en 24 h · el último ' + (filas[0] ? fh(filas[0].t).slice(5, 16) + ' UTC' : '—'));
      const kp = (l, v, s) => el('div', { class: 'kpi' }, el('div', { class: 'kl' }, l), el('div', { class: 'kv' }, v), el('div', { class: 'kn' }, s));
      cuerpo.append(el('div', { class: 'kpis2' }, kp('Bloqueos en las últimas 24 h', cap(1) + n(d24.length), 'TRON ' + cap(1) + n(d24.filter((f) => f.red === 'TRON').length) + ' · Ethereum ' + n(d24.filter((f) => f.red === 'Ethereum').length)),
        kp('Bloqueos en los últimos 7 días', cap(7) + n(d7.length), 'TRON ' + cap(7) + n(d7.filter((f) => f.red === 'TRON').length) + ' · Ethereum ' + n(d7.filter((f) => f.red === 'Ethereum').length)),
        kp('Último evento', filas[0] ? fh(filas[0].t) : '—', filas[0] ? filas[0].red + ' · ' + filas[0].tipo.toLowerCase() : ''),
        kp('Ventana leída', tronTope ? 'TRON: desde ' + fh(tronTope).slice(0, 10) : 'TRON: completa', 'Ethereum: ' + (spanEth ? 'últimos ' + n(Math.round(spanEth / 7200)) + ' días' : 'sin dato'))));
      // gráfico por día
      const dias = []; for (let i = 13; i >= 0; i--) dias.push(new Date(ahora - i * 86400000).toISOString().slice(0, 10));
      const diaTope = tronTope ? new Date(tronTope).toISOString().slice(0, 10) : null;   // antes de esta fecha TRON no se ha leído entero
      const cnt = (red) => dias.map((d) => (red === 'TRON' && diaTope && d < diaTope ? null : filas.filter((f) => f.tipo === 'Bloqueada' && f.red === red && new Date(f.t).toISOString().slice(0, 10) === d).length));
      const cv = el('canvas'); cuerpo.append(caja('Bloqueos por día (últimos 14 días, UTC)', el('div', { class: 'cs' }, 'Cada barra es el número de direcciones bloqueadas ese día.' + (diaTope ? ' De TRON solo se leen los últimos 100 bloqueos, así que antes del ' + diaTope.slice(8) + '/' + diaTope.slice(5, 7) + ' no hay barra roja: no es que no hubiera bloqueos, es que no se han leído.' : '')), el('div', { class: 'cv', style: 'height:230px' }, cv)));
      C.chartDefaults();
      new Chart(cv, { type: 'bar', data: { labels: dias.map((d) => d.slice(8) + '/' + d.slice(5, 7)), datasets: [{ label: 'TRON', data: cnt('TRON'), backgroundColor: C.pal[3], borderRadius: 3 }, { label: 'Ethereum', data: cnt('Ethereum'), backgroundColor: C.pal[0], borderRadius: 3 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, ticks: { precision: 0 }, grid: { color: C.css('--line') } } } } });
      cuerpo.append(caja('Eventos recientes', el('div', { class: 'cs' }, 'Pulsa una fila para comprobar esa dirección en vivo.'), UI.tabla({
        pp: 12, csv: 'bloqueos-recientes-tether', ph: 'Buscar dirección o transacción…', rows: filas, orden: [0, -1],
        filtros: [{ t: 'Red', opciones: ['TRON', 'Ethereum'], fn: (r, op) => r.red === op }, { t: 'Evento', opciones: ['Bloqueada', 'Liberada'], fn: (r, op) => r.tipo === op }],
        onRow: (r) => { abrirTab('comprobar'); montado.comprobar.irA(r.dir); },
        cols: [{ t: 'Fecha (UTC)', v: (r) => fh(r.t), o: (r) => r.t }, { t: 'Red', v: (r) => r.red, o: (r) => r.red }, { t: 'Evento', v: (r) => el('span', { class: 'pillb ' + (r.tipo === 'Bloqueada' ? 'bad' : 'ok') }, r.tipo), o: (r) => r.tipo, csv: (r) => r.tipo },
          { t: 'Dirección', v: (r) => el('a', { class: 'addr' }, UI.corto(r.dir, 10, 8)), o: (r) => r.dir, csv: (r) => r.dir }, { t: 'Transacción', v: (r) => UI.enlace(r.red === 'TRON' ? 'https://tronscan.org/#/transaction/' + r.tx : 'https://etherscan.io/tx/' + r.tx, UI.corto(r.tx, 6, 4) + ' ↗', 'addr'), o: (r) => r.tx, csv: (r) => r.tx }] })));
      cuerpo.append(el('div', { class: 'ayuda' }, [{ k: 'Qué NO dice', v: 'Que una dirección aparezca aquí no dice quién es ni si es culpable de nada: Tether bloquea por decisión propia o a petición de autoridades. «Liberada» significa que Tether la retiró de la lista negra. Solo se leen los eventos más recientes, no todo el historial.' }].map((i) => el('div', { class: 'ai' }, el('b', null, i.k + '. '), el('span', { html: i.v })))));
    })().catch((e) => { cifra('tether', 'TRON y Ethereum no responden ahora'); cuerpo.textContent = ''; cuerpo.append(el('div', { class: 'res-head warn' }, el('div', { class: 'big' }, 'No se pudieron leer los bloqueos ahora'), el('div', { class: 'sub2' }, String(e.message || e) + '. Prueba de nuevo en un minuto: los nodos públicos a veces se saturan.'))); });
  } });

  /* =============== 3 · Descongelaciones de TRX =============== */
  TABS.push({ id: 'desbloqueos', titulo: '3 · Descongelaciones de TRX', render(root) {
    root.append(llano('Quien tiene TRX en <b>stake</b> (congelado para votar y obtener recursos) y decide sacarlo debe <b>descongelarlo</b>, y la red tarda un plazo fijo —hoy <b>14 días</b>— en dejarlo retirar. Por eso todo lo que se podrá retirar en los próximos 14 días <b>ya ha empezado a descongelarse</b> y su fecha exacta se puede leer de la cadena.',
      'Aquí ves ese calendario para las 10.000 mayores cuentas de TRON y puedes consultar <b>cualquier dirección en vivo</b>. Que unos TRX se puedan retirar <b>no significa que se vayan a vender</b>.'));
    const cuerpo = el('div', null, el('p', { class: 'loading' }, el('span', { class: 'spin' }), 'Cargando el calendario…'));
    root.append(cuerpo);
    json('data/desbloqueos-trx.json?v=' + Math.floor(ahoraMs() / 600000), {}, 15000).then((D) => {
      cuerpo.textContent = '';
      const edad = (ahoraMs() - Date.parse(D.leidoEn)) / 3600000;
      cuerpo.append(el('div', { class: 'res-head ' + (edad > 48 ? 'warn' : '') }, el('div', { class: 'sub2' }, el('b', null, 'Lectura del ' + fh(Date.parse(D.leidoEn))), ' (hace ' + (edad < 1 ? 'menos de 1 hora' : edad < 48 ? n(Math.round(edad)) + ' horas' : n(Math.round(edad / 24)) + ' días') + '). Es una foto: quien retire o cancele después cambia las cifras. ' + (edad > 48 ? 'Estos datos están anticuados; la consulta de dirección de abajo sí es en vivo.' : 'La consulta de dirección de abajo es en vivo.'))));
      const T = D.total, K = D.calendario, tr = D.tendencia, cob = D.cobertura;
      cifra('trx', (K.yaDisponible.trx >= 1e6 ? n(K.yaDisponible.trx / 1e6, 1) + ' M' : n(K.yaDisponible.trx)) + ' TRX ya retirables');
      const kp = (l, v, s) => el('div', { class: 'kpi' }, el('div', { class: 'kl' }, l), el('div', { class: 'kv' }, v), el('div', { class: 'kn' }, s));
      const mt = (x) => (x >= 1e6 ? n(x / 1e6, 1) + ' M TRX' : n(x) + ' TRX');
      cuerpo.append(el('div', { class: 'kpis2' },
        kp('Se podrán retirar en 14 días', mt(K.proximos14.trx), n(K.proximos14.cuentas) + ' cuentas · con fecha leída de la cadena'),
        kp('Ya retirables sin retirar', mt(K.yaDisponible.trx), n(K.yaDisponible.cuentas) + ' cuentas'),
        kp('En proceso de desbloqueo', mt(T.listaTrx), n(T.cuentas) + ' de las 10.000 mayores cuentas'),
        tr ? kp('TRX en stake en toda la red', mt(tr.stakeTrx), (tr.pct7 != null ? (tr.pct7 >= 0 ? '+' : '−') + n(Math.abs(tr.pct7), 2) + ' % en 7 días' : '') + (tr.pct30 != null ? ' · ' + (tr.pct30 >= 0 ? '+' : '−') + n(Math.abs(tr.pct30), 2) + ' % en 30 días' : '')) : null));
      // calendario por día
      const base = Date.parse(D.leidoEn); const dias = []; for (let i = 0; i <= D.diasDemora; i++) dias.push(new Date(base + i * 86400000).toISOString().slice(0, 10));
      const por = Object.fromEntries(dias.map((d) => [d, 0])); const yaT = D.eventos.filter((e) => e.e && e.e <= base).reduce((s, e) => s + e.x, 0);
      for (const e of D.eventos) { if (!e.e || e.e <= base) continue; const d = new Date(e.e).toISOString().slice(0, 10); if (d in por) por[d] += e.x; }
      const cv = el('canvas'); cuerpo.append(caja('TRX que se podrán retirar cada día (UTC)', el('div', { class: 'cs' }, 'Cada barra suma los TRX cuya descongelación termina ese día en las cuentas leídas. Pulsa una barra para ver las cuentas.'), el('div', { class: 'cv', style: 'height:260px' }, cv)));
      C.chartDefaults();
      const ch = new Chart(cv, UI.clicable({ type: 'bar', data: { labels: dias.map((d) => d.slice(8) + '/' + d.slice(5, 7)), datasets: [{ data: dias.map((d) => por[d]), backgroundColor: C.pal[1], borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { ticks: { callback: (v) => (v >= 1e6 ? n(v / 1e6, 1) + ' M' : n(v / 1e3) + ' k') }, grid: { color: C.css('--line') } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + n(c.parsed.y) + ' TRX' } } } } }, (e) => { const d = dias[e.index]; filtro.value = d; tabla.cambiar(filas.filter((r) => new Date(r.e).toISOString().slice(0, 10) === d)); }));
      // tabla de eventos
      const filas = D.eventos.filter((e) => e.e && e.e > base).map((e) => ({ ...e }));
      const tabla = UI.tabla({ pp: 12, csv: 'descongelaciones-trx', ph: 'Buscar cuenta o etiqueta…', rows: filas, orden: [0, 1], filtros: [{ t: 'Importe', opciones: ['≥ 10.000 TRX', '≥ 100.000 TRX', '≥ 1 M TRX'], fn: (r, op) => r.x >= (op.startsWith('≥ 1 M') ? 1e6 : op.includes('100.000') ? 1e5 : 1e4) }],
        onRow: (r) => { abrirTab('comprobar'); montado.comprobar.irA(r.a); },
        cols: [{ t: 'Se podrá retirar', v: (r) => fh(r.e), o: (r) => r.e }, { t: 'En', v: (r) => { const h = (r.e - ahoraMs()) / 3600000; return h < 1 ? 'menos de 1 h' : h < 48 ? n(Math.round(h)) + ' h' : n(Math.round(h / 24)) + ' días'; }, o: (r) => r.e }, { t: 'Cuenta', v: (r) => el('span', null, el('a', { class: 'addr', href: 'https://tronscan.org/#/address/' + r.a, target: '_blank', rel: 'noopener' }, UI.corto(r.a, 9, 6)), r.t ? el('div', { class: 'muted', style: 'font-size:11.5px' }, r.t) : null), o: (r) => r.a, csv: (r) => r.a }, { t: 'TRX', num: 1, v: (r) => n(r.x), o: (r) => r.x }] });
      const filtro = { value: '' };
      cuerpo.append(caja('Calendario detallado', el('div', { class: 'cs' }, n(filas.length) + ' desbloqueos con fecha leída en ' + n(new Set(filas.map((f) => f.a)).size) + ' cuentas. Pulsa una fila para comprobar esa dirección.'), tabla));
      // mayores cuentas
      if (D.principales && D.principales.length) cuerpo.append(caja('Las mayores de los próximos 14 días', el('div', { class: 'cs' }, 'Concentración: las 3 mayores suman ' + (D.concentracion3 != null ? n(D.concentracion3 * 100, 0) + ' %' : '—') + ' del total.'), UI.tabla({ pp: 10, buscar: false, rows: D.principales, cols: [{ t: 'Cuenta', v: (r) => el('span', null, el('a', { class: 'addr', href: 'https://tronscan.org/#/address/' + r.address, target: '_blank', rel: 'noopener' }, UI.corto(r.address, 9, 6)), r.tag ? el('div', { class: 'muted', style: 'font-size:11.5px' }, r.tag) : null), o: (r) => r.address }, { t: 'TRX', num: 1, v: (r) => n(r.trx), o: (r) => r.trx }, { t: 'Primera', v: (r) => fh(r.primera), o: (r) => r.primera }, { t: 'Última', v: (r) => fh(r.ultima), o: (r) => r.ultima }] })));
      // consulta en vivo
      const inp = el('input', { type: 'text', placeholder: 'Pega una dirección TRON (T…) para ver SUS descongelaciones en vivo', autocomplete: 'off', spellcheck: 'false' });
      const res = el('div');
      const buscar = async () => {
        const d = inp.value.trim(); res.textContent = ''; if (!d) return;
        if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(d) || !(await tronAHex20(d))) { res.append(el('div', { class: 'res-head warn' }, el('div', { class: 'sub2' }, 'Esa no es una dirección TRON válida (debe empezar por T y tener 34 caracteres).'))); return; }
        res.append(el('p', { class: 'loading' }, el('span', { class: 'spin' }), 'Leyendo la cuenta en TronGrid…'));
        try {
          const a = await json(GRID + '/wallet/getaccount', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: d, visible: true }) });
          res.textContent = '';
          if (!a || !a.address) { res.append(el('div', { class: 'res-head warn' }, el('div', { class: 'sub2' }, 'La cuenta no está activada en TRON o no existe.'))); return; }
          const pend = (a.unfrozenV2 || []).filter((u) => Number(u.unfreeze_amount) > 0).map((u) => ({ x: Number(u.unfreeze_amount) / 1e6, e: u.unfreeze_expire_time, r: u.type || 'BANDWIDTH' })).sort((p, q) => (p.e || 0) - (q.e || 0));
          const stake = (a.frozenV2 || []).reduce((s, f) => s + (Number(f.amount) || 0), 0) / 1e6;
          res.append(el('div', { class: 'res-head ' + (pend.length ? '' : 'ok') }, el('div', { class: 'big' }, pend.length ? n(pend.reduce((s, p) => s + p.x, 0)) + ' TRX en proceso de desbloqueo' : 'Sin desbloqueos en curso'), el('div', { class: 'sub2' }, el('span', { class: 'mono' }, d), ' · saldo libre ' + n((Number(a.balance) || 0) / 1e6) + ' TRX · en stake ' + n(stake) + ' TRX · consultado ' + fh(ahoraMs()))));
          if (pend.length) res.append(UI.tabla({ pp: 10, buscar: false, rows: pend, cols: [{ t: 'Se podrá retirar', v: (r) => (r.e ? fh(r.e) : 'sin fecha'), o: (r) => r.e || 0 }, { t: 'Estado', v: (r) => (r.e && r.e <= ahoraMs() ? el('span', { class: 'pillb ok' }, 'Ya retirable') : el('span', { class: 'pillb bad' }, 'En ' + (r.e ? n(Math.round((r.e - ahoraMs()) / 86400000 * 10) / 10) + ' días' : '—'))), o: (r) => r.e || 0, csv: (r) => (r.e && r.e <= ahoraMs() ? 'Ya retirable' : 'Pendiente') }, { t: 'Recurso', v: (r) => r.r, o: (r) => r.r }, { t: 'TRX', num: 1, v: (r) => n(r.x, 2), o: (r) => r.x }] }));
        } catch (e) { res.textContent = ''; res.append(el('div', { class: 'res-head warn' }, el('div', { class: 'sub2' }, 'No se pudo leer la cuenta ahora (' + String(e.message).slice(0, 40) + '). Prueba de nuevo en un momento.'))); }
      };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') buscar(); });
      cuerpo.append(caja('Consultar una dirección en vivo', el('div', { class: 'tool-in' }, inp, el('button', { class: 'btn primary', onclick: buscar }, 'Consultar')), res));
      // límites
      cuerpo.append(el('div', { class: 'ayuda' }, [
        { k: 'Cobertura', v: 'La lista pública de TronScan solo da las <b>10.000 cuentas con más saldo</b> (' + (cob.parteDeOferta != null ? n(cob.parteDeOferta * 100, 0) + ' % de la oferta' : 'la mayor parte de la oferta') + '). El resto no se mide. Se leyeron ' + n(cob.cuentasLeidas) + ' de las ' + n(cob.cuentasConDesbloqueo) + ' cuentas con desbloqueo en curso' + (cob.paginasFallidas ? ' (' + n(cob.paginasFallidas) + ' páginas de la lista fallaron)' : '') + '.' },
        { k: 'Qué NO dice', v: 'Lo que alguien <b>empiece</b> a descongelar a partir de hoy llegará después de ' + D.diasDemora + ' días y no se puede conocer todavía. Quien tiene unos TRX retirables puede volver a ponerlos en stake, moverlos o dejarlos quietos; quien cancele la descongelación antes de su fecha los devuelve al stake.' },
        { k: 'De dónde sale', v: (D.fuentes || []).join(' · ') + '. Cálculo hecho con el módulo de desbloqueos de EquipoIA; la consulta de dirección usa TronGrid en vivo.' }].map((i) => el('div', { class: 'ai' }, el('b', null, i.k + '. '), el('span', { html: i.v })))));
      (D.avisos || []).forEach((a) => cuerpo.append(el('p', { class: 'hint' }, '⚠ ' + a)));
    }).catch((e) => { cifra('trx', 'calendario no disponible ahora'); cuerpo.textContent = ''; cuerpo.append(el('div', { class: 'res-head warn' }, el('div', { class: 'big' }, 'Todavía no hay calendario publicado'), el('div', { class: 'sub2' }, 'No se pudo cargar data/desbloqueos-trx.json (' + String(e.message).slice(0, 40) + '). La consulta de una dirección sigue disponible abajo.'))); });
  } });

  /* ---------- zona marcada en las fichas de arriba según lo que se está viendo ---------- */
  function seguirZona() {
    const secs = [...document.querySelectorAll('.zp[id^="z-"]')]; if (!secs.length) return;
    let tope = null; for (const s of secs) { const t = s.getBoundingClientRect().top; if (t <= 150 && (tope === null || t > tope)) tope = t; }
    const activas = new Set(tope === null ? [secs[0].id] : secs.filter((s) => Math.abs(s.getBoundingClientRect().top - tope) < 8).map((s) => s.id));
    document.querySelectorAll('.zona').forEach((a) => a.classList.toggle('on', activas.has('z-' + a.dataset.z)));
  }

  /* ---------- arranque ---------- */
  document.addEventListener('DOMContentLoaded', async () => {
    // fichas de arriba: bajan a su zona sin recargar
    document.querySelectorAll('.zona').forEach((a) => a.addEventListener('click', (ev) => { ev.preventDefault(); irAZona('z-' + a.dataset.z); }));
    document.querySelectorAll('.ztabs button').forEach((b) => b.addEventListener('click', () => pestana(b.closest('.zp').id.slice(2), b.dataset.tab)));
    let tick = false; window.addEventListener('scroll', () => { if (tick) return; tick = true; requestAnimationFrame(() => { tick = false; seguirZona(); }); }, { passive: true });
    try { redes = (await json('data/redes-usdt.json', {}, 15000)).redes; cifra('comprobar', n(redes.length) + ' redes · respuesta en segundos'); }
    catch (e) { document.getElementById(RAIZ.comprobar).textContent = 'No se pudo cargar la lista de redes: ' + e.message; cifra('comprobar', 'lista de redes no disponible'); }
    for (const t of TABS) { if (t.id === 'comprobar' && !redes) continue; remontar(t.id); }
    const h = (location.hash || '').replace('#', '');
    if (RUTAS[h]) {
      // al abrir un enlace directo la página sigue creciendo mientras cargan las lecturas: se baja a la zona de inmediato y se vuelve a
      // colocar unas veces mientras el usuario no haya movido la página él mismo (si lo hace, se le deja en paz)
      irAZona(h, { bajar: false, hash: false });
      const zona = document.getElementById('z-' + RUTAS[h].zona); let movido = false;
      ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) => window.addEventListener(ev, () => { movido = true; }, { once: true, passive: true }));
      const bajar = () => { if (!movido) zona.scrollIntoView({ block: 'start', behavior: 'instant' }); };   // «instant»: el CSS de la web pone scroll-behavior:smooth y un desplazamiento suave se pierde si la página crece a la vez
      bajar(); [700, 1800, 3500].forEach((ms) => setTimeout(bajar, ms));
    }
    window.addEventListener('hashchange', () => { const x = (location.hash || '').replace('#', ''); if (RUTAS[x]) irAZona(x, { hash: false }); });
    seguirZona();
  });
})();
