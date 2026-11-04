/* Herramientas de mercado. Fuentes públicas de solo lectura, consultadas desde el navegador. */
(() => {
"use strict";
const VENUES = [
  { nombre: "Binance", quote: "USDT", url: b => 'https://data-api.binance.vision/api/v3/depth?symbol=' + b + 'USDT&limit=1000', parse: (j, status) => (status === 400 && j && j.code === -1121 ? { notListed: true } : j && Array.isArray(j.bids) && Array.isArray(j.asks) ? { bids: j.bids, asks: j.asks } : null) },
  { nombre: "Kraken", quote: "USD", url: b => 'https://api.kraken.com/0/public/Depth?pair=' + ({ BTC: 'XBT', DOGE: 'XDG' }[b] || b) + 'USD&count=500', parse: j => { if (!j || !Array.isArray(j.error)) return null; if (j.error.some(e => /Unknown asset pair/i.test(String(e)))) return { notListed: true }; if (j.error.length) return null; const k = j.result && Object.keys(j.result); const bk = k && k.length === 1 ? j.result[k[0]] : null; return bk && Array.isArray(bk.bids) && Array.isArray(bk.asks) ? { bids: bk.bids, asks: bk.asks } : null; } }
];
const CATALOGO = {
  "USDT": {
    "gecko": "tether",
    "llama": "1",
    "nombre": "Tether"
  },
  "USDC": {
    "gecko": "usd-coin",
    "llama": "2",
    "nombre": "USD Coin"
  },
  "DAI": {
    "gecko": "dai",
    "llama": "5",
    "nombre": "Dai"
  },
  "USDE": {
    "gecko": "ethena-usde",
    "llama": "146",
    "nombre": "Ethena USDe"
  },
  "FDUSD": {
    "gecko": "first-digital-usd",
    "llama": "119",
    "nombre": "First Digital USD"
  },
  "PYUSD": {
    "gecko": "paypal-usd",
    "llama": "120",
    "nombre": "PayPal USD"
  },
  "TUSD": {
    "gecko": "true-usd",
    "llama": "7",
    "nombre": "TrueUSD"
  },
  "USDD": {
    "gecko": "usdd",
    "llama": "14",
    "nombre": "USDD"
  },
  "FRAX": {
    "gecko": "frax",
    "llama": "6",
    "nombre": "Frax"
  },
  "USDS": {
    "gecko": "usds",
    "llama": "209",
    "nombre": "Sky USDS"
  }
};
const num = Number.isFinite;
async function horario(getJson, gecko, { horas = 72, now = Date.now() } = {}) {
  const id = 'coingecko:' + gecko, start = Math.floor(now / 1000) - horas * 3600;
  let j; try { j = await getJson(`https://coins.llama.fi/chart/${id}?start=${start}&span=${horas}&period=1h`); } catch (e) { return { ok: false, reason: 'RED', detalle: String(e && e.message || e).slice(0, 80) }; }
  const pts = j && j.coins && j.coins[id] && j.coins[id].prices;
  if (!Array.isArray(pts) || !pts.length) return { ok: false, reason: 'SIN_DATOS' };
  const serie = pts.filter(x => num(x.timestamp) && num(x.price) && x.price > 0).map(x => ({ t: x.timestamp * 1000, p: x.price }));
  return serie.length ? { ok: true, serie, fuente: 'DefiLlama (precio por hora)' } : { ok: false, reason: 'SIN_DATOS' };
}

// Circulación y variaciones (DefiLlama stablecoins): { circ, d1, w1, m1, price } en USD.
async function circulacion(getJson, llamaId) {
  let j; try { j = await getJson('https://stablecoins.llama.fi/stablecoins?includePrices=true'); } catch (e) { return { ok: false, reason: 'RED', detalle: String(e && e.message || e).slice(0, 80) }; }
  const a = j && Array.isArray(j.peggedAssets) && j.peggedAssets.find(x => String(x.id) === String(llamaId));
  if (!a || !a.circulating) return { ok: false, reason: 'SIN_DATOS' };
  const usd = o => (o && num(o.peggedUSD) ? o.peggedUSD : null);
  return { ok: true, circ: usd(a.circulating), d1: usd(a.circulatingPrevDay), w1: usd(a.circulatingPrevWeek), m1: usd(a.circulatingPrevMonth), price: num(a.price) ? a.price : null, fuente: 'DefiLlama (stablecoins)' };
}


const NIVELES = Object.freeze([{ id: 'atencion', dev: 0.005, icono: '🟡' }, { id: 'tension', dev: 0.01, icono: '🟠' }, { id: 'alerta', dev: 0.02, icono: '🔴' }]);
const SOSTENIDO = 3;          // observaciones horarias seguidas por encima del umbral
const MAX_ANTIGUEDAD_H = 3;   // una última cotización más vieja que esto no vale como «ahora»
const HOUR = 3600000;

const nivelDe = d => { let n = 'normal'; for (const l of NIVELES) if (d >= l.dev) n = l.id; return n; };
const dev = p => Math.abs(p - 1);

function precioAhora(serie, now = Date.now(), { k = SOSTENIDO } = {}) {
  const s = serie.filter(x => num(x.t) && num(x.p) && x.p > 0).sort((a, b) => a.t - b.t);
  if (s.length < k) return { ok: false, reason: 'POCOS_PUNTOS', n: s.length };
  const last = s[s.length - 1], edadH = (now - last.t) / HOUR;
  if (edadH > MAX_ANTIGUEDAD_H) return { ok: false, reason: 'DATO_VIEJO', edadH, ultima: last.t };
  const win = s.slice(-k), nivel = nivelDe(Math.min(...win.map(x => dev(x.p))));
  const d24 = s.filter(x => x.t >= last.t - 24 * HOUR), h6 = s.filter(x => x.t >= last.t - 6 * HOUR);
  const tendencia = h6.length >= 3 ? last.p - h6[0].p : null;
  return { ok: true, p: last.p, desv: last.p - 1, lado: last.p < 1 ? 'debajo' : 'encima', nivel, nivelUltimo: nivelDe(dev(last.p)), min24: Math.min(...d24.map(x => x.p)), max24: Math.max(...d24.map(x => x.p)), tendencia6h: tendencia, ultima: last.t, edadH, n: s.length };
}



async function fetchJson(url) {
  const response = await fetch(url, {signal: AbortSignal.timeout(9000), redirect:'error'});
  return {status: response.status, data: await response.json()};
}

async function compareSale(symbol, amount) {
  const venues = await Promise.all(VENUES.map(async venue => {
    const pair = symbol + '/' + venue.quote;
    const row = {name: venue.nombre, pair, quote: venue.quote};
    try {
      const response = await fetchJson(venue.url(symbol));
      const book = venue.parse(response.data, response.status);
      if (book?.notListed) return {...row, unavailable:'El par no cotiza en este exchange.'};
      if (response.status !== 200 || !book) throw Error('Libro no disponible');
      const bids = book.bids.map(([price, size]) => [Number(price), Number(size)])
        .filter(([price, size]) => Number.isFinite(price) && Number.isFinite(size) && price > 0 && size > 0)
        .sort((a, b) => b[0] - a[0]);
      if (!bids.length) throw Error('Libro vacío');
      let remaining = amount;
      let proceeds = 0;
      for (const [price, size] of bids) {
        const units = Math.min(size, remaining);
        proceeds += price * units;
        remaining -= units;
        if (remaining === 0) break;
      }
      const filled = amount - remaining;
      const average = proceeds / filled;
      return {...row, filled, remaining, proceeds, average, slip: Math.max(0, 1 - average / bids[0][0]), readAt: new Date().toISOString()};
    } catch {
      return {...row, unavailable:'No se pudo leer el libro en este momento.'};
    }
  }));
  return {symbol, amount, venues};
}

async function stablecoin(symbol) {
  const coin = CATALOGO[symbol];
  const now = Date.now();
  const get = async url => {
    const {status, data} = await fetchJson(url);
    if (status !== 200) throw Error('HTTP ' + status);
    return data;
  };
  const [prices, supply] = await Promise.all([
    horario(get, coin.gecko, {now}),
    circulacion(get, coin.llama)
  ]);
  const series = prices.ok ? prices.serie.filter(point => point.t <= now).sort((a,b) => a.t - b.t) : [];
  const price = precioAhora(series, now);
  let hours = null;
  if (price.ok && Math.abs(price.desv) >= 0.005) {
    const sign = Math.sign(price.desv);
    let start = series.at(-1).t;
    for (let i = series.length - 2; i >= 0; i--) {
      const point = series[i];
      if (Math.floor(start / HOUR) - Math.floor(point.t / HOUR) !== 1 || (point.p - 1) * sign < 0.005) break;
      start = point.t;
    }
    hours = Math.floor((price.ultima - start) / HOUR);
  }
  return {symbol, name:coin.nombre, price, hours, supply:supply.ok ? supply.circ : null, source:'DefiLlama'};
}


const assetsById = {
  BTC:'bitcoin', ETH:'ethereum', TRX:'tron',
  ADA:'cardano', AVAX:'avalanche-2', BCH:'bitcoin-cash', BNB:'binancecoin',
  DOGE:'dogecoin', DOT:'polkadot', HYPE:'hyperliquid', LINK:'chainlink',
  LTC:'litecoin', PAXG:'pax-gold', SOL:'solana', SUI:'sui',
  TON:'the-open-network', XMR:'monero', XRP:'ripple'
};
const dailyCache = new Map();
const daySeconds = 86400;

function dailyReturns(asset, cutoff) {
  const key = cutoff + ':' + asset;
  if (dailyCache.has(key)) return dailyCache.get(key);
  const request = (async () => {
    const id = 'coingecko:' + assetsById[asset];
    const start = cutoff - 367 * daySeconds;
    const {status, data} = await fetchJson('https://coins.llama.fi/chart/' + id + '?start=' + start + '&span=367&period=1d');
    const prices = data?.coins?.[id]?.prices;
    if (status !== 200 || !Array.isArray(prices)) throw Error('Histórico no disponible');
    const closes = new Map();
    for (const point of prices) {
      // La fuente puede fechar el cierre unos segundos antes o después de medianoche.
      const day = Math.round(point.timestamp / daySeconds) * daySeconds;
      const offset = Math.abs(point.timestamp - day);
      if (!Number.isFinite(offset) || offset > 300 || day >= cutoff || !Number.isFinite(point.price) || point.price <= 0) continue;
      if (!closes.has(day) || closes.get(day).offset > offset) closes.set(day, {price: point.price, offset});
    }
    const returns = new Map();
    for (let day = cutoff - 365 * daySeconds; day < cutoff; day += daySeconds) {
      if (closes.has(day) && closes.has(day - daySeconds)) returns.set(day, closes.get(day).price / closes.get(day - daySeconds).price - 1);
    }
    return returns;
  })().catch(error => { dailyCache.delete(key); throw error; });
  dailyCache.set(key, request);
  return request;
}

async function historicalSample(assets) {
  const cutoff = Math.floor(Date.now() / (daySeconds * 1000)) * daySeconds;
  const returns = await Promise.all(assets.map(asset => dailyReturns(asset, cutoff)));
  return [...returns[0].keys()].filter(day => returns.every(series => series.has(day))).map(day => ({
    day: new Date(day * 1000).toISOString().slice(0,10),
    ...Object.fromEntries(assets.map((asset, i) => [asset, returns[i].get(day)]))
  }));
}


(() => {
  const get = id => document.getElementById(id);
  const rows = get('positions');
  const add = get('add-position');
  const result = get('risk-result');
  const error = get('risk-error');
  const assets = Object.keys(assetsById);
  get('risk-asset-count').textContent = assets.length;
  const money = new Intl.NumberFormat('es-ES', {style:'currency',currency:'USD',maximumFractionDigits:2});
  let nextId = 0;

  function invalidate() {
    revision++;
    result.hidden = true;
    error.hidden = true;
  }

  function updateRows() {
    const positions = [...rows.children];
    positions.forEach((row, index) => {
      row.querySelector('select').setAttribute('aria-label', 'Moneda de la posición ' + (index + 1));
      row.querySelector('input').setAttribute('aria-label', 'Valor actual en USD de la posición ' + (index + 1));
      row.querySelector('button').hidden = positions.length === 1;
    });
    add.disabled = positions.length === assets.length;
  }

  function addRow(focus = true) {
    if (rows.children.length >= assets.length) return;
    const used = [...rows.querySelectorAll('select')].map(select => select.value);
    const row = document.createElement('div');
    row.className = 'var-row';
    row.innerHTML = '<label>Moneda<select name="asset"></select></label><label>Valor actual en USD<input name="amount" inputmode="decimal" placeholder="Ej. 5000" required></label><button type="button" class="btn">Quitar</button>';
    const select = row.querySelector('select');
    select.replaceChildren(...assets.map(asset => new Option(asset, asset)));
    select.value = assets.find(asset => !used.includes(asset)) || assets[0];
    row.querySelector('button').addEventListener('click', () => {
      row.remove();
      updateRows();
      invalidate();
      add.focus();
    });
    row.id = 'position-' + (++nextId);
    rows.append(row);
    updateRows();
    invalidate();
    if (focus) row.querySelector('input').focus();
  }

  const submit = get('risk-form').querySelector('button[type=submit]');
  let revision = 0;

  function fail(message, field) {
    error.textContent = message;
    error.hidden = false;
    field.focus();
  }

  get('risk-form').addEventListener('submit', async event => {
    event.preventDefault();
    invalidate();
    const values = new Map();
    for (const [index, row] of [...rows.children].entries()) {
      const select = row.querySelector('select');
      const input = row.querySelector('input');
      const typed = input.value.trim();
      const value = Number(typed.replace(',', '.'));
      if (!/^\d+(?:[.,]\d{1,2})?$/.test(typed) || !Number.isFinite(value) || value <= 0 || value > 1e12) {
        fail('Escribe un importe positivo en USD en la posición ' + (index + 1) + ', sin separador de miles. Por ejemplo, 5000 o 5000,50.', input);
        return;
      }
      if (values.has(select.value)) {
        fail(select.value + ' aparece dos veces. Suma ambas posiciones en una sola fila.', select);
        return;
      }
      values.set(select.value, value);
    }
    const positions = [...values];
    const version = revision;
    submit.disabled = true;
    submit.textContent = 'Cargando histórico…';
    let sample;
    try {
      sample = await historicalSample(positions.map(([asset]) => asset));
    } catch {
      if (version === revision) fail('No se pudo leer el histórico de los activos elegidos. Vuelve a intentarlo.', rows.querySelector('select'));
      return;
    } finally {
      submit.disabled = false;
      submit.textContent = 'Calcular riesgo';
    }
    if (version !== revision) return;
    if (sample.length < 120) {
      fail('Hacen falta al menos 120 movimientos diarios en común para esta consulta.', rows.querySelector('select'));
      return;
    }
    const losses = sample.map(day => -positions.reduce((pnl, [asset, amount]) => pnl + day[asset] * amount, 0)).sort((a,b) => a-b);
    const rank = .99 * (losses.length - 1);
    const lower = Math.floor(rank);
    const threshold = losses[lower] + (losses[lower + 1] - losses[lower]) * (rank - lower);
    const tail = losses.filter(loss => loss >= threshold);
    const average = tail.reduce((sum, loss) => sum + loss, 0) / tail.length;
    get('risk-basis').textContent = [...values].map(([asset, amount]) => asset + ' · ' + money.format(amount)).join(' + ');
    get('var-value').textContent = money.format(threshold);
    get('es-value').textContent = money.format(average);
    const formatDay = day => day.split('-').reverse().join('/');
    get('risk-sample').textContent = 'Fuente: DefiLlama · ' + formatDay(sample[0].day) + '–' + formatDay(sample.at(-1).day) + ' (UTC) · ' + sample.length + ' retornos diarios alineados · ' + tail.length + ' días en la cola.';
    get('var-reading').textContent = 'Con las posiciones actuales, en ' + tail.length + ' de los ' + sample.length + ' días del histórico la pérdida habría alcanzado o superado este importe.';
    get('es-reading').textContent = 'Es la pérdida media de esos ' + tail.length + ' días. En un día concreto podrías perder más.';
    result.hidden = false;
  });

  rows.addEventListener('input', invalidate);
  rows.addEventListener('change', invalidate);
  add.addEventListener('click', () => addRow());
  addRow(false);
})();


(() => {
  const number = (value, digits = 2) => new Intl.NumberFormat('es-ES',{maximumFractionDigits:digits}).format(value);
  const time = value => new Intl.DateTimeFormat('es-ES',{timeZone:'UTC',dateStyle:'short',timeStyle:'short'}).format(new Date(value)) + ' UTC';
  function line(parent, tag, text) {
    const node = document.createElement(tag);
    node.textContent = text;
    parent.append(node);
  }
  function bind(formId, resultId, query, render) {
    const form = document.getElementById(formId);
    const result = document.getElementById(resultId);
    const button = form.querySelector('button');
    const fields = [...form.querySelectorAll('input,select')];
    form.addEventListener('input', () => result.replaceChildren());
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const values = new URLSearchParams(new FormData(form));
      values.set('asset', values.get('asset').trim().toUpperCase());
      if (values.has('units')) values.set('units', values.get('units').trim());
      const symbol = values.get('asset');
      const units = values.get('units') || '';
      const amount = Number(units.replace(',', '.'));
      if (query === compareSale && (!/^[A-Z0-9]{2,12}$/.test(symbol) || !/^\d+(?:[.,]\d{1,8})?$/.test(units) || amount < 1e-8 || amount > 1e12)) {
        result.textContent = 'Introduce un símbolo y una cantidad positiva sin separador de miles.';
        return;
      }
      button.disabled = true;
      fields.forEach(field => { field.disabled = true; });
      result.textContent = 'Consultando las fuentes…';
      try {
        const data = await query(symbol, amount);
        result.replaceChildren();
        render(result, data);
      } catch {
        result.textContent = 'No se pudo completar la consulta. Puedes volver a intentarlo.';
      } finally {
        button.disabled = false;
        fields.forEach(field => { field.disabled = false; });
      }
    });
  }
  bind('sale-form','sale-result',compareSale,(result,data) => {
    line(result,'p','Venta solicitada: ' + number(data.amount,8) + ' ' + data.symbol);
    for (const venue of data.venues) {
      const box = document.createElement('article');
      result.append(box);
      line(box,'h3',venue.name + ' · ' + venue.pair);
      if (venue.unavailable) { line(box,'p',venue.unavailable); continue; }
      line(box,'p','Importe bruto estimado: ' + number(venue.proceeds,8) + ' ' + venue.quote);
      line(box,'p','Precio medio: ' + number(venue.average,10) + ' ' + venue.quote + ' por ' + data.symbol + ' · Deslizamiento: ' + number(venue.slip * 100,4) + ' %');
      line(box,'p',number(venue.filled,8) + ' ' + data.symbol + ' cubiertos · ' + number(venue.remaining,8) + ' pendientes.');
      line(box,'small','Libro consultado: ' + time(venue.readAt));
    }
  });
  bind('peg-form','peg-result',stablecoin,(result,data) => {
    const price = data.price;
    const box = document.createElement('article');
    result.append(box);
    line(box,'h3',data.name + ' · ' + data.symbol);
    if (price.ok) {
      line(box,'p',number(price.p,6) + ' USD · ' + (price.desv >= 0 ? '+' : '−') + number(Math.abs(price.desv) * 100,4) + ' % frente a 1 USD');
      line(box,'p',data.hours === null ? 'El último punto está dentro de la banda del 0,5 %.' : 'Fuera de la banda durante al menos ' + data.hours + ' h consecutivas observadas.');
      line(box,'p','Rango en 24 h: ' + number(price.min24,6) + '–' + number(price.max24,6) + ' USD.');
      line(box,'small','Último precio horario: ' + time(price.ultima));
    } else {
      line(box,'p',price.reason === 'DATO_VIEJO' ? 'El último precio disponible es antiguo: ' + time(price.ultima) + '.' : 'No hay suficientes precios horarios recientes para comprobar la paridad.');
    }
    if (data.supply !== null) line(box,'p','Oferta en circulación: ' + number(data.supply,0) + ' ' + data.symbol + '.');
    else line(box,'small','Oferta en circulación sin dato disponible.');
  });
})();

})();
