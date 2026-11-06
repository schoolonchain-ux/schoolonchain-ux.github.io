/* Zona 4 · Mercado: precios de BTC, ETH y TRX con su cambio en 24 h, la diferencia entre exchanges y el índice de miedo y codicia.
   Todo son lecturas públicas de solo lectura desde el navegador (Binance, Coinbase y alternative.me), sin IA y sin guardar nada.
   Cada bloque dice de dónde sale y a qué hora se leyó; si una fuente no responde, esa celda lo dice y no se inventa nada. Se relee cada minuto mientras la pestaña está a la vista. */
(function () {
  const { el, n } = C;
  const raiz = document.getElementById('mercado-raiz'); if (!raiz) return;
  const ACTIVOS = [{ s: 'BTC', b: 'BTCUSDT', c: 'BTC-USD' }, { s: 'ETH', b: 'ETHUSDT', c: 'ETH-USD' }, { s: 'TRX', b: 'TRXUSDT', c: 'TRX-USD' }];
  const CLASE = { 'Extreme Fear': 'miedo extremo', Fear: 'miedo', Neutral: 'neutral', Greed: 'codicia', 'Extreme Greed': 'codicia extrema' };
  const hhmm = (t) => new Date(t).toISOString().slice(11, 16) + ' UTC';
  const usd = (x) => (x >= 100 ? n(x, 0) : x >= 1 ? n(x, 2) : n(x, 4)) + ' $';
  const pct = (x, d = 1) => (x >= 0 ? '+' : '−') + n(Math.abs(x), d) + ' %';
  const traer = (u, ms = 9000) => fetch(u, { cache: 'no-cache', signal: AbortSignal.timeout(ms) }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  const quizas = (p) => p.then((v) => ({ ok: true, v }), (e) => ({ ok: false, e }));

  async function leer() {
    const binanceUrl = 'https://data-api.binance.vision/api/v3/ticker/24hr?symbols=' + encodeURIComponent(JSON.stringify(ACTIVOS.map((a) => a.b)));
    const [bin, fng, ...cb] = await Promise.all([quizas(traer(binanceUrl)), quizas(traer('https://api.alternative.me/fng/?limit=1')), ...ACTIVOS.map((a) => quizas(traer('https://api.coinbase.com/v2/prices/' + a.c + '/spot')))]);
    return { bin, fng, cb, t: Date.now() };
  }

  function pintar(L) {
    const por = bin => Object.fromEntries((bin.ok ? bin.v : []).map((x) => [x.symbol, x]));
    const B = por(L.bin);
    const filas = ACTIVOS.map((a, i) => {
      const x = B[a.b]; const p = x ? Number(x.lastPrice) : null, d = x ? Number(x.priceChangePercent) : null;
      const cbp = L.cb[i].ok ? Number(L.cb[i].v && L.cb[i].v.data && L.cb[i].v.data.amount) : null;
      const dif = p != null && cbp ? (p - cbp) / cbp * 100 : null;
      return el('tr', null, el('td', null, el('b', null, a.s)), el('td', { class: 'r' }, p != null ? usd(p) : '—'),
        el('td', { class: 'r ' + (d == null ? '' : d >= 0 ? 'ok' : 'bad') }, d != null ? pct(d) : '—'),
        el('td', { class: 'r', title: 'Precio en Binance (en USDT) frente al de Coinbase (en USD)' }, dif != null ? pct(dif, 2) : '—'));
    });
    const tabla = el('table', { class: 'mh' }, el('thead', null, el('tr', null, el('th', null, 'Activo'), el('th', { class: 'r' }, 'Precio'), el('th', { class: 'r' }, '24 h'), el('th', { class: 'r' }, 'Binance vs Coinbase'))), el('tbody', null, filas));
    let bloque = null;
    if (L.fng.ok && L.fng.v && L.fng.v.data && L.fng.v.data[0]) {
      const f = L.fng.v.data[0]; const v = Number(f.value);
      bloque = el('div', null,
        el('div', { class: 'mh-fng' }, el('b', null, n(v, 0)), el('span', null, 'Miedo y codicia · ' + (CLASE[f.value_classification] || f.value_classification))),
        el('div', { class: 'mh-bar', 'aria-hidden': 'true' }, el('i', { style: 'left:' + Math.max(1, Math.min(99, v)) + '%' })),
        el('p', { class: 'hint', style: 'margin:0' }, '0 = miedo extremo, 100 = codicia extrema. Índice diario de alternative.me (mezcla volatilidad, volumen, redes sociales y otros datos).'));
    } else bloque = el('p', { class: 'hint' }, 'El índice de miedo y codicia no respondió ahora mismo.');
    const fallos = [!L.bin.ok && 'Binance', !L.fng.ok && 'alternative.me', L.cb.some((c) => !c.ok) && 'Coinbase (alguna moneda)'].filter(Boolean);
    const pie = el('div', { class: 'mh-pie' + (fallos.length ? ' warn' : '') }, 'Binance, Coinbase y alternative.me · leído ' + hhmm(L.t) + (fallos.length ? ' · sin respuesta: ' + fallos.join(', ') : '') + ' · la diferencia compara USDT con USD, no es un arbitraje');
    raiz.replaceChildren(el('div', { class: 'mh-grid' }, tabla, bloque), pie);
    const c = document.querySelector('[data-cifra="mercado"]');
    if (c) c.textContent = L.fng.ok && L.fng.v && L.fng.v.data && L.fng.v.data[0] ? 'Miedo y codicia ' + L.fng.v.data[0].value : (B.BTCUSDT ? 'BTC ' + usd(Number(B.BTCUSDT.lastPrice)) : 'sin respuesta ahora');
  }

  let ocupado = false;
  async function ciclo() { if (ocupado || document.hidden) return; ocupado = true; try { pintar(await leer()); } catch (e) { raiz.replaceChildren(el('p', { class: 'hint' }, 'No se pudo leer el mercado ahora (' + String(e.message).slice(0, 40) + '). Se reintenta solo.')); } finally { ocupado = false; } }
  document.addEventListener('DOMContentLoaded', () => { ciclo(); setInterval(ciclo, 60000); document.addEventListener('visibilitychange', () => { if (!document.hidden) ciclo(); }); });
})();
