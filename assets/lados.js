/* Laterales de la portada. Nada aquí es texto fijo: cada bloque se alimenta de un fichero de datos de la web o de una lectura
   en vivo desde el navegador, dice de cuándo es su lectura y avisa si está anticuada. Si una fuente no se puede leer, el bloque
   lo dice (o no se pinta), nunca inventa cifras.
   Izquierda «Ahora en la cadena»: artículos de Medium (data/medium.json, rotan solos), descongelaciones de TRX (data/desbloqueos-trx.json),
   últimos bloqueos de Tether (eventos del contrato de USDT en TRON y Ethereum, en vivo).
   Derecha «Compruébalo tú»: comprobador rápido de bloqueos (nodos públicos, en vivo), paridad de stablecoins (DefiLlama, en vivo),
   estado de los casos (reports/index.json + data.json + data/novedades.json) y accesos a las demás herramientas. */
(function () {
  const izq = document.getElementById('lado-izq'), der = document.getElementById('lado-der');
  if (!izq || !der || !window.C || !window.USDT) return;
  const { el, n } = C;
  const N = window.NOVEDADES;
  const DIA = 86400000, HORA = 3600000;
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cargar = (u, ms = 12000) => fetch(u, { cache: 'no-cache', signal: AbortSignal.timeout(ms) }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const bloque = (titulo, ...kids) => el('div', { class: 'lb' }, el('b', { class: 'lt' }, titulo), ...kids);
  const pie = (texto, estado, extra) => el('span', { class: 'lv ' + (estado || '') }, texto, extra || null);
  const fila = (k, v, cls) => el('div', { class: 'lr' }, el('span', null, k), el('span', { class: cls || '' }, v));
  const hhmm = (t) => { const d = new Date(t); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0') + ' UTC'; };
  const ddmm = (t) => { const d = new Date(t); return String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0'); };
  const hace = (t) => { const m = (Date.now() - t) / 60000; if (m < 1) return 'ahora mismo'; if (m < 60) return 'hace ' + Math.round(m) + ' min'; const h = m / 60; if (h < 36) return 'hace ' + Math.round(h) + ' h'; const d = h / 24; return d < 2 ? 'ayer' : 'hace ' + Math.round(d) + ' días'; };
  const corta = (dir) => dir.slice(0, 6) + '…' + dir.slice(-5);
  const mt = (x) => (x >= 1e6 ? n(x / 1e6, 1) + ' M' : n(x / 1e3, 0) + ' k');
  const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  // lectura anticuada: los ficheros diarios se consideran viejos a partir de 48 h (igual que la barra de arriba)
  const antiguedad = (iso, fuente) => { const h = (Date.now() - Date.parse(iso)) / HORA; return h > 48 ? pie('⚠ ' + fuente + ' sin actualizar desde hace ' + Math.round(h / 24) + ' días', 'warn') : pie(fuente + ' · lectura del ' + ddmm(iso) + ' ' + hhmm(iso)); };
  const cada = (ms, fn) => { const tic = () => { if (!document.hidden) fn(); }; setInterval(tic, ms); };

  /* =============== 1 · artículos de Medium (rotan solos) =============== */
  async function medium() {
    const d = await cargar('data/medium.json');
    const arts = d && Array.isArray(d.articulos) ? d.articulos.filter((a) => a && a.titulo && a.url && a.fecha) : [];
    if (!arts.length) return null;
    const CADA = 8000; let i = 0, timer = null;
    const img = el('div', { class: 'limg', role: 'img' }), ti = el('b', { class: 'lti' }), fe = el('div', { class: 'lfe' });
    const a = el('a', { class: 'lmed', target: '_blank', rel: 'noopener' }, img, ti, fe);
    const pts = arts.map((_, k) => el('i', { title: 'Artículo ' + (k + 1), onclick: () => { ir(k); arrancar(); } }));
    const cnt = el('span', { class: 'cnt' });
    const nav = (txt, paso, t) => el('button', { class: 'nav', type: 'button', title: t, 'aria-label': t, onclick: () => { ir(i + paso); arrancar(); } }, txt);
    const dots = el('div', { class: 'ldots' }, nav('‹', -1, 'Artículo anterior'), pts, nav('›', 1, 'Artículo siguiente'), cnt);
    for (const x of arts) if (x.imagen) { const p = new Image(); p.src = x.imagen; }   // precarga: así el cambio no parpadea
    function pintar() {
      const x = arts[i];
      a.href = x.url; a.title = 'Leer en Medium: ' + x.titulo;
      img.style.backgroundImage = 'url("' + (x.imagen || 'assets/brand/compartir.jpg') + '")'; img.setAttribute('aria-label', x.titulo);
      ti.textContent = x.titulo; fe.textContent = (N ? N.fecha(x.fecha) : x.fecha.slice(0, 10)) + ' · medium.com/' + (d.cuenta || '@SchoolOnChain');
      pts.forEach((p, k) => { p.className = k === i ? 'on' : ''; }); cnt.textContent = (i + 1) + ' / ' + arts.length;
    }
    function ir(k) { i = (k + arts.length) % arts.length; if (reducido) { pintar(); return; } a.classList.add('fade'); setTimeout(() => { pintar(); a.classList.remove('fade'); }, 180); }
    const parar = () => { if (timer) clearInterval(timer); timer = null; };
    const arrancar = () => { parar(); if (arts.length > 1 && !reducido && !document.hidden) timer = setInterval(() => ir(i + 1), CADA); };
    const box = bloque('Artículos de School On-Chain', a, dots, antiguedad(d.leidoEn, 'Lista de Medium'));
    box.addEventListener('mouseenter', parar); box.addEventListener('mouseleave', arrancar);   // con el ratón encima no cambia
    box.addEventListener('focusin', parar); box.addEventListener('focusout', arrancar);
    document.addEventListener('visibilitychange', () => (document.hidden ? parar() : arrancar()));
    pintar(); arrancar();
    return box;
  }

  /* =============== 2 · descongelaciones de TRX (próximos 7 días) =============== */
  async function desbloqueos() {
    const D = await cargar('data/desbloqueos-trx.json?v=' + Math.floor(Date.now() / 600000));
    const K = D && D.calendario; if (!K || !Array.isArray(K.porFecha) || !K.porFecha.length) return null;
    const hoy = (D.leidoEn || '').slice(0, 10);
    const dias = K.porFecha.slice(0, 7); const max = Math.max(...dias.map((x) => x.trx));
    const cal = el('div', { class: 'lcal', title: 'TRX que terminan de descongelarse cada día (UTC), en millones' }, dias.map((x) => {
      const d = new Date(x.dia + 'T12:00:00Z');
      return el('div', { class: (x.dia === hoy ? 'hoy ' : '') + (x.trx === max && x.trx >= 1e6 ? 'hot' : ''), title: x.dia + ': ' + n(x.trx, 0) + ' TRX · ' + n(x.cuentas, 0) + (x.cuentas === 1 ? ' cuenta' : ' cuentas') }, DIAS[d.getUTCDay()], el('b', null, n(x.trx / 1e6, 1)), String(d.getUTCDate()));
    }));
    const leyenda = el('p', { class: 'ldesc' }, 'Millones de TRX que terminan de descongelarse cada día. El día marcado es el mayor de la semana.');
    const resto = K.porFecha.slice(7); const mayor = resto.length ? resto.reduce((a, b) => (b.trx > a.trx ? b : a)) : null;
    const total7 = dias.reduce((s, x) => s + x.trx, 0), cuentas7 = dias.reduce((s, x) => s + x.cuentas, 0);
    const a = el('a', { class: 'lt', href: 'herramientas.html#desbloqueos' }, 'Descongelaciones de TRX · próximos 7 días');
    const box = el('div', { class: 'lb' }, el('b', { class: 'lt' }, a), leyenda, cal,
      el('div', { style: 'margin-top:8px' }, fila('Suman estos 7 días', mt(total7) + ' TRX · ' + n(cuentas7, 0) + ' cuentas'),
        K.yaDisponible ? fila('Ya retirables (sin retirar)', mt(K.yaDisponible.trx) + ' TRX · ' + n(K.yaDisponible.cuentas, 0) + ' cuentas', 'warn') : null,
        mayor && mayor.trx >= 1e6 ? fila('Mayor día siguiente: ' + DIAS[new Date(mayor.dia + 'T12:00:00Z').getUTCDay()] + ' ' + mayor.dia.slice(8), mt(mayor.trx) + ' TRX · ' + n(mayor.cuentas, 0) + ' cuentas') : null),
      antiguedad(D.leidoEn, 'Lista de TronScan'));
    return box;
  }

  /* =============== 3 · últimos bloqueos de Tether (en vivo) =============== */
  function bloqueosTether() {
    const cuerpo = el('div'); const foot = el('div');
    const box = el('div', { class: 'lb' }, el('b', { class: 'lt' }, el('a', { href: 'herramientas.html#recientes' }, 'Últimos bloqueos de Tether')), cuerpo, foot);
    async function leer() {
      cuerpo.replaceChildren(); foot.replaceChildren(pie('Leyendo los eventos del contrato de USDT…', 'wait'));
      let r; try { r = await USDT.recientes({ spanEth: 20000, tronLimite: 50, marcasEth: 6 }); } catch (e) { r = { filas: [], avisos: ['TRON', 'Ethereum'] }; }
      const bloqueadas = r.filas.filter((f) => f.tipo === 'Bloqueada');
      cuerpo.replaceChildren();
      if (!bloqueadas.length) { foot.replaceChildren(pie('No se pudo leer ahora mismo (' + r.avisos.join(' y ') + ')', 'bad', el('button', { class: 'mini', type: 'button', onclick: leer }, '↻ Reintentar'))); return; }
      for (const f of bloqueadas.slice(0, 5)) cuerpo.append(el('a', { class: 'lr', href: 'herramientas.html?dir=' + f.dir + '#comprobar', title: 'Comprobar ' + f.dir + ' en todas las redes' }, el('span', { class: 'mono' }, corta(f.dir), ' · ', f.red), el('span', { title: C.utc(f.t) + (f.estimado ? ' (hora estimada)' : '') }, hace(f.t))));
      const d24 = bloqueadas.filter((f) => Date.now() - f.t < DIA);
      cuerpo.append(el('p', { class: 'hint' }, 'Bloqueos en las últimas 24 h: ' + n(d24.length) + ' (TRON ' + n(d24.filter((f) => f.red === 'TRON').length) + ' · Ethereum ' + n(d24.filter((f) => f.red === 'Ethereum').length) + ')' + (r.avisos.length ? ' · no se pudo leer ' + r.avisos.join(' ni ') : '')));
      foot.replaceChildren(pie('Leído en directo desde tu navegador · ' + hhmm(r.leidoEn), r.avisos.length ? 'warn' : ''));
    }
    leer(); cada(10 * 60000, leer);
    return box;
  }

  /* =============== 4 · comprobador rápido de bloqueos =============== */
  function comprobador() {
    const inp = el('input', { type: 'text', placeholder: 'Pega una dirección 0x… o T…', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Dirección a comprobar' });
    const btn = el('button', { type: 'submit' }, 'Comprobar');
    const out = el('div', { class: 'lout', hidden: true });
    const form = el('form', { class: 'lin', onsubmit: (ev) => { ev.preventDefault(); ir(inp.value.trim()); } }, inp, btn);
    const foot = el('div');
    USDT.redes().then((rs) => { const evm = rs.filter((r) => r.tipo === 'evm').length; foot.replaceChildren(pie('Sin claves · sin guardar nada · ' + (evm ? evm + ' redes + TRON' : 'varias redes + TRON'))); });
    let ronda = 0;
    async function ir(dir) {
      out.hidden = false; out.className = 'lout'; out.replaceChildren();
      if (!dir) { out.hidden = true; return; }
      if (USDT.parecePrivada(dir)) { out.className = 'lout warn'; out.append(el('b', null, 'Eso parece una clave privada o una frase semilla.'), ' No se ha procesado ni enviado a ningún sitio. Pega solo una dirección pública.'); return; }
      const evm = USDT.esEvm(dir); const tron = !evm && USDT.pareceTron(dir) && (await USDT.tronAHex20(dir));
      if (!evm && !tron) { out.className = 'lout warn'; out.append(el('b', null, 'No reconozco esa dirección.'), ' Debe ser 0x seguido de 40 caracteres, o una dirección TRON que empiece por T (34 caracteres).'); return; }
      const lista = (await USDT.redes()).filter((r) => (evm ? r.tipo === 'evm' : r.tipo === 'tron'));
      if (!lista.length) { out.className = 'lout warn'; out.append('No se pudo cargar la lista de redes.'); return; }
      const mi = ++ronda; btn.disabled = true; out.append('Consultando ' + lista.length + (lista.length > 1 ? ' redes…' : ' red…'));
      const res = await Promise.all(lista.map(async (r) => ({ r, ...(await USDT.consultar(r, dir)) })));
      if (mi !== ronda) return; btn.disabled = false;
      const bl = res.filter((x) => x.estado === 'bloqueada'), er = res.filter((x) => x.estado === 'error');
      const congelado = bl.reduce((s, x) => s + (x.saldo || 0), 0);
      out.className = 'lout ' + (bl.length ? 'bad' : er.length ? 'warn' : 'ok'); out.replaceChildren();
      out.append(el('b', { class: bl.length ? 'bad' : er.length ? 'warn' : 'ok' }, bl.length ? '🔴 En blacklist' : er.length ? '⚪ No consta bloqueada' : '🟢 No está en la blacklist de USDT'),
        bl.length ? ' en ' + bl.map((x) => x.r.nombre).join(', ') + (congelado ? ' · ' + n(congelado, 2) + ' USDT congelados' : '') : er.length ? ', pero no se pudo comprobar en ' + er.length + (er.length > 1 ? ' redes' : ' red') : (res.length > 1 ? ' en las ' + res.length + ' redes consultadas' : ' en TRON'),
        ' · ' + hhmm(Date.now()), el('br'), el('a', { href: 'herramientas.html?dir=' + dir + '#comprobar' }, 'Ver el detalle por red →'));
    }
    return el('div', { class: 'lb' }, el('b', { class: 'lt' }, el('a', { href: 'herramientas.html#comprobar' }, '¿Está bloqueada esta dirección?')), form, out, foot);
  }

  /* =============== 5 · paridad de stablecoins (en vivo, DefiLlama) =============== */
  function paridad() {
    // USDD (la de TRON) no tiene serie horaria en DefiLlama (/chart); para ella, y para cualquiera que venga corta o vieja,
    // se pide el precio más cercano a cada marca horaria (/batchHistorical), que sí existe para todas. Mismo criterio que la herramienta completa.
    const MONEDAS = [{ s: 'USDT', id: 'coingecko:tether' }, { s: 'USDC', id: 'coingecko:usd-coin' }, { s: 'DAI', id: 'coingecko:dai' }, { s: 'USDD', id: 'coingecko:usdd' }];
    const BANDA = 0.005, HORAS = 72;
    const cuerpo = el('div'); const foot = el('div');
    const box = el('div', { class: 'lb' }, el('b', { class: 'lt' }, el('a', { href: 'herramientas.html#paridad-stablecoins' }, '¿Siguen cerca de 1 USD?')), cuerpo, foot);
    const limpiar = (pts, ahora) => (Array.isArray(pts) ? pts : []).filter((x) => x.price > 0 && x.timestamp * 1000 <= ahora).map((x) => ({ t: x.timestamp * 1000, p: x.price })).sort((a, b) => a.t - b.t);
    async function leer() {
      foot.replaceChildren(pie('Leyendo los precios por hora…', 'wait'));
      const ahora = Date.now(), fin = Math.floor(ahora / 1000), start = fin - HORAS * 3600;
      const j = await cargar('https://coins.llama.fi/chart/' + MONEDAS.map((m) => m.id).join(',') + '?start=' + start + '&span=' + HORAS + '&period=1h', 15000);
      const series = {};
      for (const m of MONEDAS) series[m.id] = limpiar(j && j.coins && j.coins[m.id] && j.coins[m.id].prices, ahora);
      // segundo camino, en una sola llamada, para las que no tienen serie suficiente (≥ 80 % de las horas y último precio de hace ≤ 3 h)
      const cortas = MONEDAS.filter((m) => { const s = series[m.id]; return s.length < HORAS * 0.8 || ahora - s[s.length - 1].t > 3 * HORA; });
      if (cortas.length) {
        const marcas = Array.from({ length: HORAS }, (_, i) => fin - (HORAS - 1 - i) * 3600);
        const pedido = {}; for (const m of cortas) pedido[m.id] = marcas;
        const j2 = await cargar('https://coins.llama.fi/batchHistorical?coins=' + encodeURIComponent(JSON.stringify(pedido)) + '&searchWidth=2h', 15000);
        for (const m of cortas) {
          const vistos = new Set();
          series[m.id] = series[m.id].concat(limpiar(j2 && j2.coins && j2.coins[m.id] && j2.coins[m.id].prices, ahora)).filter((x) => !vistos.has(x.t) && vistos.add(x.t)).sort((a, b) => a.t - b.t);
        }
      }
      cuerpo.replaceChildren(); let viejo = 0, sin = 0;
      for (const m of MONEDAS) {
        const s = series[m.id];
        if (!s.length) { sin++; cuerpo.append(el('div', { class: 'lrow2' }, el('span', null, m.s), el('span', { class: 'warn' }, 'sin dato'))); continue; }
        const ult = s[s.length - 1], edadH = (ahora - ult.t) / HORA, desv = ult.p - 1;
        if (edadH > 3) { viejo++; cuerpo.append(el('div', { class: 'lrow2' }, el('span', null, m.s), el('span', { class: 'warn', title: 'Último precio de ' + C.utc(ult.t) }, 'dato viejo (' + hace(ult.t) + ')'))); continue; }
        // cuántas horas seguidas lleva dentro (o fuera) de la banda del 0,5 %, contando hacia atrás desde el último precio
        const dentro = Math.abs(desv) < BANDA; let k = 0; for (let q = s.length - 1; q >= 0 && (Math.abs(s[q].p - 1) < BANDA) === dentro; q--) k++;
        const horasTxt = (k >= s.length ? '≥ ' : '') + n(Math.round(k * HORAS / Math.max(s.length, 1))) + ' h';
        const nivel = Math.abs(desv) >= 0.02 ? 'bad' : Math.abs(desv) >= BANDA ? 'warn' : 'ok';
        const pos = Math.max(2, Math.min(98, 50 + desv / 0.02 * 50));
        cuerpo.append(el('div', { class: 'lrow2' }, el('span', null, m.s), el('span', { class: nivel }, n(ult.p, 4) + ' $ · ' + (dentro ? horasTxt + ' dentro' : 'fuera ' + horasTxt))),
          el('div', { class: 'lbar', title: m.s + ': ' + (desv >= 0 ? '+' : '−') + n(Math.abs(desv) * 100, 3) + ' % frente a 1 USD · último precio ' + C.utc(ult.t) }, el('i', { class: nivel, style: 'left:' + pos + '%' })));
      }
      cuerpo.append(el('p', { class: 'hint' }, 'Banda del 0,5 % · «dentro» = horas seguidas sin salirse (lectura de 72 h)'));
      foot.replaceChildren(sin === MONEDAS.length ? pie('No se pudo leer DefiLlama ahora mismo', 'bad', el('button', { class: 'mini', type: 'button', onclick: leer }, '↻ Reintentar')) : pie('DefiLlama · precio por hora · ' + hhmm(ahora), viejo || sin ? 'warn' : ''));
    }
    leer(); cada(10 * 60000, leer);
    return box;
  }

  /* =============== 6 · estado de los casos abiertos =============== */
  async function casos() {
    const idx = await cargar('reports/index.json'); const NOV = N ? await N.cargar() : [];
    if (!idx || !Array.isArray(idx.informes) || !idx.informes.length) return null;
    const box = bloque('Estado de los casos abiertos'); let ultima = null;
    for (const r of idx.informes) {
      const nov = NOV.find((x) => x.caso === r.slug); if (nov && (!ultima || Date.parse(nov.fecha) > Date.parse(ultima))) ultima = nov.fecha;
      const a = el('a', { class: 'lcaso', href: r.url || 'report.html?r=' + encodeURIComponent(r.slug) }, el('b', null, r.caso || r.titulo),
        el('div', { class: 'lc2' }, (r.version ? r.version + ' · ' : '') + (nov ? 'actualizado el ' + N.fecha(nov.fecha) : r.corte ? 'datos hasta ' + ddmm(r.corte) : 'seguimiento en vivo')));
      box.append(a);
      if (r.url) continue;
      try {
        const d = await cargar('reports/' + r.slug + '/data.json'); const T = d && d.tron || {}; const p = (T.partidas || []).filter((x) => x.importe > 0);
        if (T.capital) a.append(el('div', { class: 'lc3' }, el('span', null, el('b', null, C.m(T.capital)), ' robado en TRON'), p[0] ? el('span', null, el('b', null, C.m(p[0].importe)), ' congelado por Tether') : null, d.red && d.red.totalMovimientos ? el('span', null, el('b', null, n(d.red.totalMovimientos)), ' movimientos') : null));
      } catch (e) { /* sin cifras */ }
    }
    box.append(ultima ? pie('De los informes publicados · última novedad ' + N.fecha(ultima) + ' ' + N.hora(ultima)) : pie('De los informes publicados'));
    return box;
  }

  /* =============== 6b · cifras de las zonas (mercado, USDT0, TRX) =============== */
  const mUsd = (x) => (Math.abs(x) >= 1e9 ? n(x / 1e6, 0) : n(x / 1e6, 1)) + ' M $';
  const mTrx = (x) => (Math.abs(x) >= 1e8 ? n(x / 1e6, 0) : n(x / 1e6, 1)) + ' M TRX';
  const ACTIVOS = [{ s: 'BTC', b: 'BTCUSDT' }, { s: 'ETH', b: 'ETHUSDT' }, { s: 'TRX', b: 'TRXUSDT' }];
  const CLASE = { 'Extreme Fear': 'miedo extremo', Fear: 'miedo', Neutral: 'neutral', Greed: 'codicia', 'Extreme Greed': 'codicia extrema' };
  function mercadoMini() {
    const cuerpo = el('div'), foot = el('div');
    const box = el('div', { class: 'lb' }, el('b', { class: 'lt' }, el('a', { href: 'herramientas.html#z-mercado' }, 'Mercado hoy')), cuerpo, foot);
    async function leer() {
      const ver = (u) => fetch(u, { cache: 'no-cache', signal: AbortSignal.timeout(9000) }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      const [bin, fng] = await Promise.all([ver('https://data-api.binance.vision/api/v3/ticker/24hr?symbols=' + encodeURIComponent(JSON.stringify(ACTIVOS.map((a) => a.b)))), ver('https://api.alternative.me/fng/?limit=1')]);
      const por = Object.fromEntries((Array.isArray(bin) ? bin : []).map((x) => [x.symbol, x]));
      const filas = [];
      for (const a of ACTIVOS) {
        const x = por[a.b]; if (!x) continue;
        const p = Number(x.lastPrice), d = Number(x.priceChangePercent);
        filas.push(el('div', { class: 'lr' }, el('span', null, a.s), el('span', null, (p >= 100 ? n(p, 0) : p >= 1 ? n(p, 2) : n(p, 4)) + ' $ ', el('span', { class: d >= 0 ? 'ok' : 'bad' }, (d >= 0 ? '+' : '−') + n(Math.abs(d), 1) + ' %'))));
      }
      const f0 = fng && fng.data && fng.data[0];
      if (f0) filas.push(fila('Miedo y codicia', n(Number(f0.value), 0) + ' · ' + (CLASE[f0.value_classification] || f0.value_classification)));
      cuerpo.replaceChildren(...filas);
      foot.replaceChildren(filas.length ? pie('Binance y alternative.me · leído en directo ' + hhmm(Date.now()), !Array.isArray(bin) || !f0 ? 'warn' : '') : pie('No se pudo leer el mercado ahora mismo', 'bad', el('button', { class: 'mini', type: 'button', onclick: leer }, '↻ Reintentar')));
    }
    leer(); cada(60000, leer);
    return box;
  }
  async function usdt0Mini() {
    const D = await cargar('data/usdt0.json?v=' + Math.floor(Date.now() / 600000));
    if (!D || D.version !== 1 || !D.circulacion || !D.respaldo || !D.vigilante) return null;
    const R = D.respaldo, M = D.vigilante.mensajes && D.vigilante.mensajes.ultimas24h;
    return el('div', { class: 'lb' }, el('b', { class: 'lt' }, el('a', { href: 'herramientas.html#usdt0' }, 'USDT0 · circulación y respaldo')),
      fila('En circulación (' + n(D.circulacion.redesLeidas) + ' redes)', mUsd(D.circulacion.totalUsd)),
      fila('USDT guardado en Ethereum', mUsd(R.usdtEnElAdaptador)),
      fila('Diferencia', (R.diferenciaUsd >= 0 ? '+' : '−') + mUsd(Math.abs(R.diferenciaUsd)) + ' · ' + n(Math.abs(R.diferenciaPct), 2) + ' %'),
      fila('Direcciones bloqueadas', n(D.vigilante.bloqueos.vigentesTotal)),
      M ? fila('Mensajes entre redes (24 h)', n(M.total)) : null,
      antiguedad(D.leidoEn, 'Lectura directa en las redes'));
  }
  async function trxMini() {
    const [Q, R] = await Promise.all([cargar('data/quema-trx.json?v=' + Math.floor(Date.now() / 600000)), cargar('data/reparto-trx.json?v=' + Math.floor(Date.now() / 600000))]);
    const q = Q && Q.version === 1 && Q.actual ? Q : null, r = R && R.version === 1 && R.grupos ? R : null;
    if (!q && !r) return null;
    const filas = [];
    if (q) { const crece = q.actual.neto30d > 0; filas.push(fila('Neto de 30 días', (crece ? '+' : '−') + mTrx(Math.abs(q.actual.neto30d)), crece ? '' : 'ok'), fila('La oferta de TRX', crece ? 'crece' : 'baja'), fila('Quema del último día', mTrx(q.actual.quemaDia))); }
    if (r) { const my = r.sinIdentificarPorTramo[0]; filas.push(fila('Mayores sin identificar (' + n(my.cuentas) + ' cuentas)', n(my.pct, 1) + ' %'), fila('En casas de cambio', n(r.grupos.exchange.pct, 1) + ' %')); }
    const viejo = [q && q.leidoEn, r && r.leidoEn].filter(Boolean).sort()[0];
    return el('div', { class: 'lb' }, el('b', { class: 'lt' }, el('a', { href: 'herramientas.html#z-trx' }, 'TRX · quema y reparto')), ...filas, antiguedad(viejo, 'TronScan'));
  }

  /* =============== 7 · más herramientas =============== */
  function masHerramientas() {
    const l = (h, k, v) => el('a', { class: 'lr', href: h }, el('span', null, k), el('span', { class: 'acc' }, v));
    return bloque('Más herramientas',
      l('herramientas.html#z-comprobar', 'Comprobar una dirección o un contrato', 'Abrir →'),
      l('herramientas.html#z-tether', 'Bloqueos de Tether, paridad y USDT0', 'Ver →'),
      l('herramientas.html#z-cartera', 'Riesgo, prueba de estrés y coste de vender', 'Calcular →'),
      l('herramientas.html#z-mercado', 'Mercado hoy', 'Ver →'),
      l('herramientas.html#z-trx', 'TRX: descongelaciones, reparto y quema', 'Ver →'),
      l('datos.html', 'De dónde sale cada cifra', 'Datos y método →'),
      pie('Todas leen la cadena o el mercado en directo'));
  }

  /* =============== montaje =============== */
  (async () => {
    // cada apartado lleva su propio título: Medium NO va bajo «Ahora en la cadena» (son artículos, no datos de la cadena)
    const apartado = (titulo, cls, ...kids) => el('section', { class: 'lsec' + (cls ? ' ' + cls : '') }, el('h4', { class: 'lh' }, titulo), ...kids.filter(Boolean));
    const derSec = apartado('Compruébalo tú', '', comprobador(), paridad());
    der.append(derSec);
    let [med, des, cas, u0, trx] = await Promise.all([medium(), desbloqueos(), casos(), usdt0Mini(), trxMini()]);
    if (med) izq.append(apartado('En Medium', 'uno', med));
    izq.append(apartado('Ahora en la cadena', 'ahora', des, bloqueosTether()));
    if (cas) derSec.append(cas);
    derSec.append(masHerramientas());
    der.append(apartado('En cifras', '', mercadoMini(), u0, trx));
    // los ficheros diarios se vuelven a leer cada hora, por si la tarea de las 07:00 ha publicado algo nuevo
    cada(60 * 60000, async () => {
      const [m2, d2] = await Promise.all([medium(), desbloqueos()]);
      if (m2 && med) { med.replaceWith(m2); med = m2; }
      if (d2 && des) { des.replaceWith(d2); des = d2; }
    });
  })();
})();
