/* Observatorio de mercado (mercado.html). BOCETO de la fase 2.
   Lee data/mercado.json (lo genera cada día tools/equipoia/mercado.cjs con lecturas públicas) y, en vivo desde el navegador, el precio
   de ahora y el libro de órdenes de Binance. Todos los cálculos están en assets/mercado-calc.js (con pruebas y contraste con numpy). Sin IA.
   Cada cifra se puede pulsar: abre su regla, su serie y el enlace a la respuesta en bruto del servicio. Si falta un dato, se dice. */
(function () {
  const { el } = window.C; const M = window.MCALC; const raiz = document.getElementById('ob-raiz'); if (!raiz || !M) return;
  const nf = (x, d = 0) => Number(x).toLocaleString('es-ES', { useGrouping: 'always', minimumFractionDigits: d, maximumFractionDigits: d });
  const SD = 'sin dato';
  const sg = (x, d = 2) => (x == null || !isFinite(x) ? SD : (x < 0 ? '−' : '') + nf(Math.abs(x), d));
  const pct = (x, d = 1) => (x == null || !isFinite(x) ? SD : (x >= 0 ? '+' : '−') + nf(Math.abs(x * 100), d) + ' %');
  const mUsd = (x) => (x == null ? SD : x >= 1e6 ? nf(x / 1e6, x >= 1e9 ? 0 : 1) + ' M$' : nf(x) + ' $');
  const precio = (x) => (x == null ? SD : (x >= 100 ? nf(x, 0) : x >= 1 ? nf(x, 2) : x >= 0.01 ? nf(x, 4) : nf(x, 8)) + ' $');
  const signo = (x) => (x == null || !isFinite(x) ? '' : x >= 0 ? 'ob-sube' : 'ob-baja');
  const fh = (iso) => { const d = new Date(iso); return isNaN(d) ? SD : d.getUTCDate() + '-' + ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][d.getUTCMonth()] + '-' + d.getUTCFullYear() + ', ' + String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0') + ' UTC'; };
  const traer = (u, ms = 15000) => fetch(u, { cache: 'no-cache', signal: AbortSignal.timeout(ms) }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  let D = null, vivo = null, vivoError = null, periodo = '24h';

  /* ---------- panel de origen: toda cifra abre el suyo ---------- */
  const dlg = el('dialog', { class: 'ob-panel' }); document.body.append(dlg);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  function grafico(x, y, fmt) {
    const p = []; for (let i = 0; i < y.length; i++) if (typeof y[i] === 'number' && isFinite(y[i])) p.push([i, y[i]]);
    if (p.length < 2) return el('p', { class: 'ob-nota' }, 'No hay serie suficiente para dibujarla.');
    const W = 680, H = 150, mi = 6, ms = 8, mb = 8; let lo = Infinity, hi = -Infinity; for (const q of p) { if (q[1] < lo) lo = q[1]; if (q[1] > hi) hi = q[1]; } if (hi === lo) { hi += 1; lo -= 1; }
    const X = (i) => mi + (i - p[0][0]) / (p[p.length - 1][0] - p[0][0]) * (W - 2 * mi), Y = (v) => ms + (1 - (v - lo) / (hi - lo)) * (H - ms - mb);
    const pts = p.map((q) => X(q[0]).toFixed(1) + ',' + Y(q[1]).toFixed(1)).join(' ');
    const svg = '<svg class="ob-graf" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Serie"><polyline fill="none" stroke="currentColor" stroke-width="1.8" points="' + pts + '"/>' +
      '</svg>';
    return el('div', null, el('div', { html: svg }), el('p', { class: 'ob-nota', style: 'margin-top:0' }, 'Máximo ' + fmt(hi) + ' · mínimo ' + fmt(lo) + ' · de ' + x[p[0][0]] + ' a ' + x[p[p.length - 1][0]] + '.'));
  }
  function abrir(o) {
    const c = el('div', { class: 'ob-pc' }, el('button', { class: 'cerrar', title: 'Cerrar', 'aria-label': 'Cerrar', onclick: () => dlg.close() }, '×'), el('h3', null, o.t), o.sub ? el('p', { class: 'sub' }, o.sub) : null);
    if (o.cifras && o.cifras.length) c.append(el('dl', null, o.cifras.map(([k, v]) => [el('dt', null, k), el('dd', null, v)])));
    if (o.serie) c.append(grafico(o.serie.x, o.serie.y, o.serie.fmt || ((v) => nf(v, 2))), o.serie.pie ? el('p', { class: 'ob-nota' }, o.serie.pie) : null);
    if (o.regla) c.append(el('p', { class: 'regla' }, el('b', null, 'Cómo se calcula. '), o.regla));
    if (o.limite) c.append(el('p', { class: 'regla' }, el('b', null, 'Qué no dice. '), o.limite));
    c.append(el('p', { class: 'ob-nota', style: 'margin-top:12px' }, el('b', null, 'De dónde sale')), el('ul', { class: 'fu' }, (o.fuentes || []).map((f) => el('li', null, f.t + ': ', el('a', { href: f.u, target: '_blank', rel: 'noopener' }, 'respuesta en bruto del servicio')))));
    dlg.replaceChildren(c); if (!dlg.open) dlg.showModal();
  }
  const fuenteDe = (re) => { const f = (D.fuentes || []).find((x) => re.test(x.que)); return f ? [{ t: f.que, u: f.url }] : []; };

  /* ---------- series con el precio de ahora al final (si hay lectura en vivo) ---------- */
  const serieDe = (a) => { const v = vivo && vivo.get(a.par); return v ? a.c.concat([v.ultimo]) : a.c; };
  const diasDe = (a) => (vivo && vivo.get(a.par) ? D.dias.concat(['ahora']) : D.dias);
  function rendPeriodo(a, k) { if (k === '24h') { const v = vivo && vivo.get(a.par); return v && v.apertura > 0 ? v.ultimo / v.apertura - 1 : null; } return M.rend(serieDe(a), Number(k)); }
  const PERIODOS = [['24h', '24 horas', 0.08], ['7', '7 días', 0.15], ['30', '30 días', 0.3], ['90', '90 días', 0.5], ['365', '1 año', 1]];

  /* ---------- 1 · capital ---------- */
  function capital() {
    const G = D.global, S = D.stables; const pSt = S.totalUsd / G.capTotalUsd * 100, pB = G.dominanciaPct.btc, pE = G.dominanciaPct.eth, pR = 100 - pB - pE - pSt;
    const seg = (cls, t, p, o) => el('button', { class: cls, style: 'width:' + Math.max(p, 0).toFixed(2) + '%', title: t + ' ' + nf(p, 1) + ' %', onclick: () => abrir(o) }, (p >= 15 ? t + ' ' : '') + nf(p, 0) + ' %');
    const fG = fuenteDe(/Capitalización total/), fS = fuenteDe(/Stablecoins en circulación, serie/);
    const reglaCap = { Stablecoins: 'Stablecoins ancladas al dólar en circulación (DefiLlama) divididas entre el capital total del mercado (CoinGecko). Son dos fuentes distintas, así que el porcentaje es aproximado.', 'Todo lo demás': '100 menos las partes de bitcoin, ether y stablecoins.', 'Capital total del mercado': 'Suma de la capitalización de todos los activos que sigue CoinGecko.' };
    const oCap = (t, p, extra) => ({ t, sub: 'Lectura de CoinGecko del ' + fh(G.leidoEn), cifras: [['Parte del capital total', nf(p, 2) + ' %'], ['En dólares', mUsd(G.capTotalUsd * p / 100)], ['Capital total del mercado', mUsd(G.capTotalUsd)]].concat(extra || []), regla: reglaCap[t] || 'CoinGecko suma la capitalización de todos los activos que sigue y da el porcentaje de cada uno. ' + t + ' es ese porcentaje.', limite: 'Capitalización es precio por unidades en circulación: no es dinero que haya entrado. Solo hay la lectura de hoy; el histórico no es gratuito, así que la serie propia empezará el día que se publique el observatorio.', fuentes: fG });
    const ySt = S.serie.map((x) => x[1]), xSt = S.serie.map((x) => x[0]); const cSt = (n) => (ySt.length > n ? ySt[ySt.length - 1] / ySt[ySt.length - 1 - n] - 1 : null);
    const oSt = (n) => ({ t: 'Stablecoins en circulación', sub: 'Serie diaria de DefiLlama hasta el ' + S.dia, cifras: [['Hoy', mUsd(S.totalUsd)], ['Hace ' + n + ' días', mUsd(ySt[ySt.length - 1 - n])], ['Cambio', pct(cSt(n), 2) + ' (' + mUsd(Math.abs(ySt[ySt.length - 1] - ySt[ySt.length - 1 - n])) + (cSt(n) >= 0 ? ' más' : ' menos') + ')']], serie: { x: xSt, y: ySt, fmt: (v) => mUsd(v), pie: 'Stablecoins ancladas al dólar en circulación, últimos ' + ySt.length + ' días.' }, regla: 'Suma de todas las stablecoins ancladas al dólar que sigue DefiLlama, en todas las cadenas. El cambio compara hoy con el mismo dato de hace ' + n + ' días.', limite: 'Que haya más stablecoins indica dólares que han entrado al sistema, pero no dice adónde van ni si se usan para comprar.', fuentes: fS });
    const k = (t, v, s, o, cls) => el('button', { class: 'ob-k', onclick: () => abrir(o) }, el('span', { class: 'k' }, t), el('span', { class: 'v ' + (cls || '') }, v), s ? el('span', { class: 's' }, s) : null);
    const filaCad = (c) => { const v = (h) => (h > 0 ? c.usd / h - 1 : null); const td = (h) => el('td', { class: signo(v(h)) }, pct(v(h))); return el('tr', { class: 'cl', onclick: () => abrir({ t: 'Stablecoins en ' + c.nombre, sub: 'DefiLlama, dato del ' + (c.dia || S.dia), cifras: [['Hoy', mUsd(c.usd)], ['Hace 7 días', mUsd(c.hace7)], ['Hace 30 días', mUsd(c.hace30)], ['Hace 90 días', mUsd(c.hace90)]], regla: 'Stablecoins ancladas al dólar emitidas en esa cadena. El cambio compara hoy con el dato de hace 7, 30 o 90 días.', limite: 'Un traspaso entre cadenas baja una y sube otra sin que entre dinero nuevo.', fuentes: fuenteDe(new RegExp('Stablecoins en ' + c.nombre + ',')) }) }, el('td', null, c.nombre), el('td', null, mUsd(c.usd)), td(c.hace7), td(c.hace30), td(c.hace90)); };
    const filaTvl = (c) => { const v = (h) => (h > 0 ? c.tvl / h - 1 : null); const td = (h) => el('td', { class: signo(v(h)) }, pct(v(h))); return el('tr', { class: 'cl', onclick: () => abrir({ t: 'Dinero depositado en ' + c.nombre, sub: 'DefiLlama, dato del ' + (c.dia || ''), cifras: [['Hoy', mUsd(c.tvl)], ['Hace 7 días', mUsd(c.hace7)], ['Hace 30 días', mUsd(c.hace30)], ['Hace 90 días', mUsd(c.hace90)]], regla: 'Valor en dólares de lo depositado en las aplicaciones de esa cadena (lo que DefiLlama llama TVL).', limite: 'Sube y baja también con el precio de lo depositado, aunque nadie meta ni saque nada.', fuentes: fuenteDe(new RegExp('Dinero depositado en ' + c.nombre + ',')) }) }, el('td', null, c.nombre), el('td', null, mUsd(c.tvl)), td(c.hace7), td(c.hace30), td(c.hace90)); };
    const cab = (a) => el('thead', null, el('tr', null, a.map((t) => el('th', null, t))));
    return el('section', { class: 'zp', id: 'capital' }, el('p', { class: 'kick' }, 'Pregunta 1'), el('h2', null, '¿Dónde está el capital?'),
      el('p', { class: 'ob-sub' }, 'De cada 100 dólares que vale hoy el mercado, cuántos están en bitcoin, en ether, en stablecoins y en todo lo demás. Pulsa cualquier trozo o cifra para ver de dónde sale.'),
      el('div', { class: 'ob-barra' }, seg('ob-seg-btc', 'BTC', pB, oCap('Bitcoin', pB)), seg('ob-seg-eth', 'ETH', pE, oCap('Ether', pE)), seg('ob-seg-st', 'Stablecoins', pSt, oCap('Stablecoins', pSt, [['Stablecoins en circulación (DefiLlama)', mUsd(S.totalUsd)], ['Aviso', 'El total es de CoinGecko y las stablecoins, de DefiLlama: dos fuentes distintas.']])), seg('ob-seg-re', 'Resto', pR, oCap('Todo lo demás', pR))),
      el('div', { class: 'ob-ley' }, [['ob-seg-btc', 'Bitcoin', pB], ['ob-seg-eth', 'Ether', pE], ['ob-seg-st', 'Stablecoins', pSt], ['ob-seg-re', 'Todo lo demás', pR]].map(([cls, t, p]) => el('span', null, el('i', { class: cls }), t + ' ' + nf(p, 1) + ' %'))),
      el('div', { class: 'ob-kpis' }, k('Capital total', mUsd(G.capTotalUsd), pct(G.cambio24hPct / 100, 2) + ' en 24 h', oCap('Capital total del mercado', 100), ''), k('Stablecoins · 7 días', pct(cSt(7), 2), mUsd(S.totalUsd) + ' hoy', oSt(7), signo(cSt(7))), k('Stablecoins · 30 días', pct(cSt(30), 2), '', oSt(30), signo(cSt(30))), k('Stablecoins · 90 días', pct(cSt(90), 2), '', oSt(90), signo(cSt(90)))),
      el('h3', { class: 'ob-h3' }, 'Stablecoins por cadena'), el('div', { class: 'ob-tw' }, el('table', { class: 'ob-t' }, cab(['Cadena', 'Hoy', '7 días', '30 días', '90 días']), el('tbody', null, S.porCadena.map(filaCad)))),
      el('h3', { class: 'ob-h3' }, 'Dinero depositado en aplicaciones, por cadena'), el('div', { class: 'ob-tw' }, el('table', { class: 'ob-t' }, cab(['Cadena', 'Hoy', '7 días', '30 días', '90 días']), el('tbody', null, D.cadenas.map(filaTvl)))),
      el('p', { class: 'ob-nota' }, 'La dominancia solo tiene lectura de hoy: su histórico no es gratuito. Cuando el observatorio se publique empezará a guardar una lectura propia al día.'));
  }

  /* ---------- mapa de calor ---------- */
  const cajaCalor = el('div', { class: 'ob-calor' }), cajaPer = el('div', { class: 'ob-per' }), notaCalor = el('p', { class: 'ob-nota' });
  function fichaActivo(a) {
    const c = serieDe(a), x = diasDe(a); const v = vivo && vivo.get(a.par);
    abrir({ t: a.n + ' (' + a.s + ')', sub: 'Par ' + a.par + ' en Binance · puesto ' + a.rango + ' por capitalización (CoinGecko)', cifras: [['Precio ' + (v ? 'ahora' : 'al cierre de ayer'), precio(c[M.ultimo(c)])]].concat(PERIODOS.map(([k, t]) => [t, pct(rendPeriodo(a, k), 2)]), [['Volatilidad a 30 días', M.vol(a.c, 30) == null ? SD : nf(M.vol(a.c, 30), 1) + ' % anual'], ['Días con dato', nf(a.dias)]]), serie: { x, y: c, fmt: precio, pie: 'Cierres diarios en UTC' + (v ? ' y, al final, el precio de ahora.' : '.') }, regla: 'Rendimiento a n días = precio de ahora dividido entre el cierre de hace n días, menos 1. El de 24 horas es la ventana móvil de Binance. Si no hay lectura en vivo se usa el cierre de ayer y se avisa.', limite: 'Es el precio en una sola casa de cambio (Binance). Un rendimiento pasado no anticipa el siguiente.', fuentes: [{ t: 'Cierres y volumen diarios de ' + a.par + ' (Binance)', u: a.url }].concat(v ? [{ t: 'Precio de ahora y ventana de 24 horas (Binance)', u: urlVivo([a.par]) }] : []) });
  }
  function pintarCalor() {
    cajaPer.replaceChildren(...PERIODOS.map(([k, t]) => el('button', { class: k === periodo ? 'on' : '', onclick: () => { periodo = k; pintarCalor(); } }, t)));
    const esc = PERIODOS.find((p) => p[0] === periodo)[2];
    cajaCalor.replaceChildren(...D.activos.map((a) => { const r = rendPeriodo(a, periodo); const i = r == null ? 0 : Math.min(1, Math.abs(r) / esc); const fondo = r == null ? 'var(--bg)' : 'color-mix(in srgb, var(' + (r >= 0 ? '--ok' : '--bad') + ') ' + Math.round(12 + 58 * i) + '%, var(--pan))'; return el('button', { class: 'ob-c', style: 'background:' + fondo, title: a.n, onclick: () => fichaActivo(a) }, el('span', { class: 's' }, a.s), el('span', { class: 'v' }, r == null ? SD : pct(r, 1))); }));
    const con = D.activos.map((a) => rendPeriodo(a, periodo)).filter((x) => x != null); const sub = con.filter((x) => x >= 0).length;
    notaCalor.textContent = con.length ? sub + ' de ' + con.length + ' activos suben y ' + (con.length - sub) + ' bajan en este periodo. Ordenados por capitalización. ' + (periodo === '24h' && !vivo ? 'Sin lectura en vivo no hay cifra de 24 horas.' : vivo ? 'Con el precio de ahora en Binance.' : 'Con el cierre de ayer: ahora mismo no se pudo leer el precio en vivo.') : 'Sin lectura en vivo no hay cifra de 24 horas: elige otro periodo.';
  }
  function calor() { return el('section', { class: 'zp', id: 'calor' }, el('p', { class: 'kick' }, 'Vista general'), el('h2', null, 'Mapa de calor'), el('p', { class: 'ob-sub' }, 'Cuánto ha subido o bajado cada activo de la cesta. Verde sube, rojo baja; cuanto más intenso, más movimiento. Pulsa un activo para ver su serie.'), cajaPer, cajaCalor, notaCalor); }

  /* ---------- 2 · liquidez (en vivo) ---------- */
  const cuerpoLiq = el('tbody'), notaLiq = el('p', { class: 'ob-nota' }), fraseLiq = { t: null };
  const urlLibro = (par) => 'https://data-api.binance.vision/api/v3/depth?symbol=' + par + '&limit=5000';
  async function leerLiquidez() {
    const lista = D.activos.slice(0, 8); cuerpoLiq.replaceChildren(el('tr', null, el('td', { colspan: 6 }, 'Leyendo los libros de órdenes en Binance…')));
    const filas = []; let hora = null;
    for (const a of lista) { let p = null, err = null; try { const j = await traer(urlLibro(a.par), 20000); p = M.profundidad(j.bids, j.asks, 0.01); hora = new Date().toISOString(); } catch (e) { err = e.message; } filas.push({ a, p, err }); }
    cuerpoLiq.replaceChildren(...filas.map(({ a, p, err }) => { if (!p) return el('tr', null, el('td', null, a.s), el('td', { colspan: 5 }, 'No se pudo leer ahora' + (err ? ' (' + err + ')' : ''))); const c = p.compras / (p.compras + p.ventas) * 100;
      return el('tr', { class: 'cl', onclick: () => abrir({ t: 'Libro de órdenes de ' + a.par, sub: 'Binance · leído el ' + fh(hora), cifras: [['Precio medio', precio(p.medio)], ['Diferencial entre compra y venta', nf(p.diferencialPct, 5) + ' % (' + nf(p.medio * p.diferencialPct / 100, p.medio * p.diferencialPct / 100 >= 0.01 ? 2 : 6) + ' $)'], ['Esperando para comprar (hasta −1 %)', mUsd(p.compras)], ['Esperando para vender (hasta +1 %)', mUsd(p.ventas)], ['Desequilibrio', sg(p.desequilibrio, 2) + ' (−1 todo ventas · +1 todo compras)'], ['¿El libro leído llega al ±1 %?', p.completo ? 'sí' : 'no: hay más órdenes de las que devuelve la lectura; la cifra es un mínimo']], regla: 'Se suman, en dólares, las órdenes de compra entre el precio medio y un 1 % por debajo, y las de venta hasta un 1 % por encima. Desequilibrio = (compras − ventas) / (compras + ventas).', limite: 'Es una foto de un instante en una sola casa de cambio. Las órdenes se pueden retirar antes de ejecutarse, y hay liquidez que no aparece en el libro.', fuentes: [{ t: 'Libro de órdenes de ' + a.par + ' (Binance)', u: urlLibro(a.par) }] }) }, el('td', null, a.s), el('td', null, nf(p.diferencialPct, 5) + ' %'), el('td', null, (p.completo ? '' : '≥ ') + mUsd(p.compras)), el('td', null, (p.completo ? '' : '≥ ') + mUsd(p.ventas)), el('td', null, el('span', { class: 'ob-deseq', title: nf(c, 0) + ' % compras' }, el('i', { class: 'c', style: 'width:' + c.toFixed(1) + '%' }), el('i', { class: 'v', style: 'width:' + (100 - c).toFixed(1) + '%' }))), el('td', { class: signo(p.desequilibrio) }, sg(p.desequilibrio, 2))); }));
    notaLiq.textContent = hora ? 'Leído el ' + fh(hora) + '. Dinero esperando a menos de un 1 % del precio. Es una foto: cambia cada segundo.' : 'No se pudo leer ningún libro ahora.';
    const b = filas[0]; fraseLiq.t = b && b.p ? 'Ahora mismo hay ' + mUsd(b.p.compras) + ' esperando para comprar bitcoin a menos de un 1 % del precio y ' + mUsd(b.p.ventas) + ' para venderlo.' : null; pintarPreguntas();
  }
  function liquidez() { return el('section', { class: 'zp', id: 'liquidez' }, el('p', { class: 'kick' }, 'Pregunta 2'), el('h2', null, '¿Dónde aumenta la liquidez?'), el('p', { class: 'ob-sub' }, 'Cuánto dinero hay esperando para comprar y para vender cerca del precio, leído ahora mismo en Binance para los ocho mayores activos de la cesta. La otra mitad de la respuesta está arriba: las stablecoins que entran o salen de cada cadena.'), el('div', { class: 'ob-tw' }, el('table', { class: 'ob-t' }, el('thead', null, el('tr', null, ['Activo', 'Diferencial', 'Para comprar (−1 %)', 'Para vender (+1 %)', 'Reparto', 'Desequilibrio'].map((t) => el('th', null, t)))), cuerpoLiq)), el('p', { style: 'margin:10px 0 0' }, el('button', { class: 'btn', onclick: leerLiquidez }, 'Leer otra vez')), notaLiq, el('p', { class: 'ob-nota' }, 'No existe histórico gratuito de la profundidad de los libros. Para saber si la liquidez AUMENTA hace falta comparar con días anteriores: el observatorio guardará una lectura propia al día desde que se publique. En este boceto solo hay la foto de ahora.')); }

  /* ---------- 3 · sectores ---------- */
  const RUIDO = /portfolio|ecosystem|holdings|index|alleged|made in|ftx|fund\b/i;
  const sectoresUtiles = () => (D.sectores || []).filter((s) => !RUIDO.test(s.nombre)).slice(0, 20);
  function sectores() {
    const L = sectoresUtiles(); const fu = fuenteDe(/Sectores:/);
    if (!L.length) return el('section', { class: 'zp', id: 'sectores' }, el('p', { class: 'kick' }, 'Pregunta 3'), el('h2', null, '¿Qué sectores ganan actividad?'), el('p', { class: 'ob-sub' }, 'La lectura de sectores de CoinGecko no llegó en la última actualización' + (D.sectoresFallo ? ' (' + D.sectoresFallo + ')' : '') + '. No se muestra nada en su lugar.'));
    const mx = Math.max(...L.map((s) => Math.abs(s.cambio24hPct)), 1);
    return el('section', { class: 'zp', id: 'sectores' }, el('p', { class: 'kick' }, 'Pregunta 3'), el('h2', null, '¿Qué sectores ganan actividad?'), el('p', { class: 'ob-sub' }, 'Los veinte mayores sectores según la clasificación de CoinGecko: cuánto ha cambiado su capitalización en 24 horas y cuánto se ha negociado. Un mismo activo puede estar en varios sectores.'),
      el('div', { class: 'ob-tw' }, el('table', { class: 'ob-t' }, el('thead', null, el('tr', null, ['Sector (CoinGecko)', 'Capitalización', 'Cambio 24 h', '', 'Negociado 24 h', 'Negociado / capital'].map((t) => el('th', null, t)))), el('tbody', null, L.map((s) => { const w = Math.abs(s.cambio24hPct) / mx * 100; return el('tr', { class: 'cl', onclick: () => abrir({ t: s.nombre, sub: 'Sector según CoinGecko · lectura diaria del ' + fh(D.leidoEn), cifras: [['Capitalización', mUsd(s.capUsd)], ['Cambio en 24 horas', pct(s.cambio24hPct / 100, 2)], ['Negociado en 24 horas', mUsd(s.volumen24hUsd)], ['Negociado / capitalización', nf(s.volumen24hUsd / s.capUsd * 100, 2) + ' %']], regla: 'Las cifras son las que publica CoinGecko para cada categoría. «Negociado / capital» divide el volumen de 24 horas entre la capitalización: cuánto se mueve el sector en relación con su tamaño.', limite: 'El sector es una etiqueta que pone CoinGecko, no un hecho. Las categorías se solapan (bitcoin está en varias). En este boceto solo hay 24 horas; los periodos largos necesitan asignar cada activo a un sector, que es la entrega siguiente.', fuentes: fu }) }, el('td', null, s.nombre), el('td', null, mUsd(s.capUsd)), el('td', { class: signo(s.cambio24hPct) }, pct(s.cambio24hPct / 100, 2)), el('td', null, el('span', { class: 'ob-deseq', style: 'width:90px' }, el('i', { class: s.cambio24hPct >= 0 ? 'c' : 'v', style: 'width:' + w.toFixed(0) + '%' }))), el('td', null, mUsd(s.volumen24hUsd)), el('td', null, nf(s.volumen24hUsd / s.capUsd * 100, 2) + ' %')); })))),
      el('p', { class: 'ob-nota' }, 'Lectura diaria del ' + fh(D.leidoEn) + ' (CoinGecko limita las consultas por visitante, así que esto no se lee desde tu navegador). Se han quitado las categorías que son carteras de fondos o ecosistemas de una cadena.'));
  }

  /* ---------- volatilidad ---------- */
  function volatilidad() {
    const F = D.activos.map((a) => { const sv = M.serieVol(a.c, 30); const p = M.percentil(sv); return { a, v30: M.vol(a.c, 30), v90: M.vol(a.c, 90), p, e: M.estadoVol(p), sv, caida: M.caidaDesdeMaximo(a.c, 365) }; }).sort((x, y) => (y.p == null ? -1 : y.p) - (x.p == null ? -1 : x.p));
    const cuenta = {}; for (const f of F) if (f.e) cuenta[f.e] = (cuenta[f.e] || 0) + 1;
    const fila = (f) => el('tr', { class: 'cl', onclick: () => abrir({ t: 'Volatilidad de ' + f.a.n + ' (' + f.a.s + ')', sub: 'Con cierres diarios de Binance hasta ayer', cifras: [['Volatilidad a 30 días', f.v30 == null ? SD : nf(f.v30, 1) + ' % anual'], ['Volatilidad a 90 días', f.v90 == null ? SD : nf(f.v90, 1) + ' % anual'], ['Percentil en su propia historia', f.p == null ? SD + ' (hacen falta 60 valores)' : nf(f.p, 0) + ' de 100'], ['Estado', f.e || SD], ['Caída desde su máximo de un año', pct(f.caida, 1)]], serie: { x: D.dias, y: f.sv, fmt: (v) => nf(v, 0) + ' %', pie: 'Volatilidad a 30 días, día a día, en toda la historia disponible (' + f.a.dias + ' días).' }, regla: 'Desviación típica de los últimos 30 rendimientos diarios, multiplicada por la raíz de 365 para expresarla en un año. El percentil dice qué parte de los días de su propia historia tuvo una volatilidad igual o menor que la de hoy. Estados: calma (menos de 25), normal (25 a 75), agitado (75 a 95), extremo (95 o más).', limite: 'La volatilidad mide cuánto se mueve, no hacia dónde. La pasada no predice la futura. Con menos de dos años de historia el percentil es menos fiable.', fuentes: [{ t: 'Cierres diarios de ' + f.a.par + ' (Binance)', u: f.a.url }] }) }, el('td', null, f.a.s, el('span', { class: 'n2' }, f.a.n)), el('td', null, f.v30 == null ? SD : nf(f.v30, 0) + ' %'), el('td', null, f.p == null ? SD : nf(f.p, 0)), el('td', null, f.e ? el('span', { class: 'ob-chip ' + f.e }, f.e) : SD), el('td', null, f.v90 == null ? SD : nf(f.v90, 0) + ' %'), el('td', { class: signo(f.caida) }, pct(f.caida, 0)));
    return el('section', { class: 'zp', id: 'volatilidad' }, el('p', { class: 'kick' }, 'Contexto'), el('h2', null, 'Volatilidad: ¿está el mercado tranquilo o agitado?'), el('p', { class: 'ob-sub' }, 'Cuánto se mueve cada activo estos 30 días comparado con su propia historia. Hoy: ' + ['extremo', 'agitado', 'normal', 'calma'].map((e) => (cuenta[e] || 0) + ' en ' + e).join(', ') + '.'),
      el('div', { class: 'ob-tw' }, el('table', { class: 'ob-t' }, el('thead', null, el('tr', null, ['Activo', 'Volatilidad 30 d', 'Percentil', 'Estado', 'Volatilidad 90 d', 'Desde su máximo (1 año)'].map((t) => el('th', null, t)))), el('tbody', null, F.map(fila)))),
      el('p', { class: 'ob-nota' }, 'Regla fija: calma por debajo del percentil 25, normal entre 25 y 75, agitado entre 75 y 95, extremo a partir de 95. Con cierres hasta ayer.'));
  }

  /* ---------- 4 · desacoples ---------- */
  const UMBRAL = 0.2;
  function filasCorr() { const btc = D.activos[0].c; return D.activos.slice(1).map((a) => { const c30 = M.corr(a.c, btc, 30), prev = M.corr(a.c, btc, 30, 30), c90 = M.corr(a.c, btc, 90), b = M.beta(a.c, btc, 90); const d = c30 != null && prev != null ? c30 - prev : null; return { a, c30, prev, c90, b, d, e: d == null ? null : d <= -UMBRAL ? 'desacopla' : d >= UMBRAL ? 'acopla' : null }; }).sort((x, y) => (x.d == null ? 9 : x.d) - (y.d == null ? 9 : y.d)); }
  function desacoples() {
    const btc = D.activos[0]; const F = filasCorr(); const f2 = (x) => sg(x, 2);
    const serieCorr = (a) => { const y = []; for (let k = 330; k >= 0; k--) y.push(M.corr(a.c, btc.c, 30, k)); return y; };
    const fila = (f) => el('tr', { class: 'cl', onclick: () => abrir({ t: f.a.n + ' frente a bitcoin', sub: 'Con cierres diarios de Binance hasta ayer', cifras: [['Correlación, últimos 30 días', f2(f.c30)], ['Correlación, los 30 días anteriores', f2(f.prev)], ['Cambio', f.d == null ? SD : (f.d >= 0 ? '+' : '−') + nf(Math.abs(f.d), 2)], ['Correlación a 90 días', f2(f.c90)], ['Sensibilidad a bitcoin (90 días)', f.b == null ? SD : 'cuando bitcoin se mueve un 1 %, se mueve un ' + sg(f.b, 2) + ' %']], serie: { x: D.dias.slice(-331), y: serieCorr(f.a), fmt: (v) => sg(v, 2), pie: 'Correlación a 30 días con bitcoin, día a día, en el último año.' }, regla: 'Correlación de Pearson entre los rendimientos diarios del activo y los de bitcoin, en los últimos 30 días en que ambos tienen dato: 1 es moverse igual, 0 es no tener relación, −1 es moverse al revés. «Se desacopla» cuando esa correlación ha caído ' + nf(UMBRAL, 2) + ' o más respecto a los 30 días anteriores; «se acopla» cuando ha subido otro tanto.', limite: 'Correlación no es causa, y con 30 días cambia mucho de una semana a otra. Dice que se mueven menos juntos, no que el activo vaya mejor ni peor.', fuentes: [{ t: 'Cierres diarios de ' + f.a.par + ' (Binance)', u: f.a.url }, { t: 'Cierres diarios de ' + btc.par + ' (Binance)', u: btc.url }] }) }, el('td', null, f.a.s, el('span', { class: 'n2' }, f.a.n)), el('td', null, f2(f.c30)), el('td', null, f2(f.prev)), el('td', { class: signo(f.d) }, f.d == null ? SD : (f.d >= 0 ? '+' : '−') + nf(Math.abs(f.d), 2)), el('td', null, f.e ? el('span', { class: 'ob-chip ' + f.e }, f.e === 'desacopla' ? 'se desacopla' : 'se acopla') : ''), el('td', null, f2(f.c90)), el('td', null, f2(f.b)));
    return el('section', { class: 'zp', id: 'desacoples' }, el('p', { class: 'kick' }, 'Pregunta 4'), el('h2', null, '¿Qué activos se están desacoplando?'), el('p', { class: 'ob-sub' }, 'Cuánto se mueve cada activo al compás de bitcoin estos 30 días, comparado con los 30 anteriores. Arriba, los que más se han separado.'),
      el('div', { class: 'ob-tw' }, el('table', { class: 'ob-t' }, el('thead', null, el('tr', null, ['Activo', 'Con BTC, 30 d', '30 d anteriores', 'Cambio', '', 'Con BTC, 90 d', 'Sensibilidad'].map((t) => el('th', null, t)))), el('tbody', null, F.map(fila)))),
      el('p', { class: 'ob-nota' }, 'Regla fija: «se desacopla» si la correlación a 30 días ha caído ' + nf(UMBRAL, 2) + ' o más; «se acopla» si ha subido otro tanto. Con cierres hasta ayer.'));
  }

  /* ---------- las cuatro preguntas, arriba ---------- */
  const cajaPreg = el('div', { class: 'ob-preg' });
  function pintarPreguntas() {
    const G = D.global, S = D.stables; const pSt = S.totalUsd / G.capTotalUsd * 100; const y = S.serie.map((x) => x[1]); const c30 = y.length > 30 ? y[y.length - 1] / y[y.length - 31] - 1 : null;
    const L = sectoresUtiles(); const sb = L.filter((s) => s.cambio24hPct >= 0).length; const orden = L.slice().sort((a, b) => b.cambio24hPct - a.cambio24hPct);
    const F = filasCorr(); const des = F.filter((f) => f.e === 'desacopla'); const conDato = F.filter((f) => f.d != null).length;
    const p = (id, q, r) => el('a', { class: 'ob-p', href: '#' + id }, el('p', { class: 'q' }, q), el('p', { class: 'r' }, r), el('span', { class: 'mas' }, 'Ver el detalle ↓'));
    cajaPreg.replaceChildren(
      p('capital', '1 · ¿Dónde está el capital?', ['De cada 100 $ del mercado, ', el('b', null, nf(G.dominanciaPct.btc, 0)), ' están en bitcoin, ', el('b', null, nf(G.dominanciaPct.eth, 0)), ' en ether, ', el('b', null, nf(pSt, 0)), ' en stablecoins y ', el('b', null, nf(100 - G.dominanciaPct.btc - G.dominanciaPct.eth - pSt, 0)), ' en todo lo demás.']),
      p('liquidez', '2 · ¿Dónde aumenta la liquidez?', [c30 == null ? '' : ['Las stablecoins en circulación han ', c30 >= 0 ? 'subido' : 'bajado', ' un ', el('b', null, nf(Math.abs(c30 * 100), 1) + ' %'), ' en 30 días. '], fraseLiq.t || 'Leyendo los libros de órdenes…']),
      p('sectores', '3 · ¿Qué sectores ganan actividad?', L.length ? ['De los ', String(L.length), ' mayores sectores, ', el('b', null, String(sb)), ' suben y ', el('b', null, String(L.length - sb)), ' bajan en 24 horas. El que más sube: ', orden[0].nombre, ' (', pct(orden[0].cambio24hPct / 100, 1), '); el que más baja: ', orden[orden.length - 1].nombre, ' (', pct(orden[orden.length - 1].cambio24hPct / 100, 1), ').'] : 'La lectura de sectores no llegó en la última actualización.'),
      p('desacoples', '4 · ¿Qué activos se están desacoplando?', [el('b', null, String(des.length)), ' de ', String(conDato), ' activos se mueven estos 30 días menos pegados a bitcoin que los 30 anteriores', des.length ? [': ', des.slice(0, 5).map((f) => f.a.s).join(', '), des.length > 5 ? ' y ' + (des.length - 5) + ' más' : '', '.'] : '.']));
  }

  /* ---------- lectura en vivo del precio ---------- */
  const estado = el('div', { class: 'ob-estado' });
  const urlVivo = (pares) => 'https://data-api.binance.vision/api/v3/ticker/24hr?type=MINI&symbols=' + encodeURIComponent(JSON.stringify(pares));
  function pintarEstado() { const edad = (Date.now() - Date.parse(D.leidoEn)) / 3600000; estado.replaceChildren(el('span', null, el('b', null, 'Datos diarios: '), fh(D.leidoEn), edad > 36 ? ' · ¡tienen más de un día y medio!' : ''), el('span', null, el('i', { class: 'ob-vivo' + (vivo ? '' : ' mal') }), el('b', null, 'Precio en vivo: '), vivo ? 'Binance, leído el ' + fh(vivo.hora) + ' (se relee cada minuto)' : 'no se pudo leer ahora' + (vivoError ? ' (' + vivoError + ')' : '') + '; se usan los cierres de ayer'), el('span', null, el('b', null, 'Cesta: '), D.activos.length + ' activos')); }
  async function leerVivo() { try { const j = await traer(urlVivo(D.activos.map((a) => a.par))); const m = new Map(); for (const t of j) { const u = Number(t.lastPrice), o = Number(t.openPrice); if (u > 0) m.set(t.symbol, { ultimo: u, apertura: o }); } if (m.size < D.activos.length * 0.8) throw new Error('respuesta incompleta'); m.hora = new Date().toISOString(); vivo = m; vivoError = null; } catch (e) { vivoError = e.message; } pintarEstado(); pintarCalor(); }

  /* ---------- montaje ---------- */
  function limites() { return el('section', { class: 'zp', id: 'limites' }, el('p', { class: 'kick' }, 'Antes de leer nada'), el('h2', null, 'Qué es esto y qué no'), el('ul', { class: 'ob-reglas' }, [
    ['Es contexto, no consejo. ', 'Aquí no hay señales de compra ni de venta, ni previsiones.'],
    ['La cesta son los mayores de hoy. ', D.metodo.cesta],
    ['Un solo mercado para los precios. ', 'Los precios y los libros de órdenes son de Binance. ' + D.metodo.series],
    ['Los sectores son una etiqueta de terceros. ', D.metodo.sectores],
    ['Lo que no hay gratis se dice. ', 'No existe histórico gratuito de la dominancia ni de la profundidad de los libros: el observatorio guardará su propia lectura diaria desde el día en que se publique.'],
    ['Las cifras las hace un programa. ', 'Sin IA. Los cálculos tienen pruebas y se contrastan con una segunda herramienta independiente sobre los mismos datos.'],
  ].map(([b, t]) => el('li', null, el('b', null, b), t))), el('details', { style: 'margin-top:10px' }, el('summary', { class: 'ob-nota', style: 'cursor:pointer' }, 'Activos que no entran en la cesta y por qué (' + D.excluidos.length + ')'), el('div', { class: 'ob-tw' }, el('table', { class: 'ob-t' }, el('tbody', null, D.excluidos.map((e) => el('tr', null, el('td', null, e.s, el('span', { class: 'n2' }, e.n || '')), el('td', { style: 'text-align:left;white-space:normal' }, e.motivo)))))))); }
  fetch('data/mercado.json', { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then((j) => {
    if (!j || j.version !== 1 || !Array.isArray(j.activos) || j.activos.length < 10 || !j.global || !j.stables) throw new Error('formato inesperado');
    D = j; pintarEstado(); pintarPreguntas(); pintarCalor();
    raiz.replaceChildren(estado, cajaPreg, capital(), calor(), liquidez(), sectores(), volatilidad(), desacoples(), limites());
    leerVivo(); leerLiquidez(); setInterval(() => { if (!document.hidden) leerVivo(); }, 60000);
  }).catch((e) => { raiz.replaceChildren(el('div', { class: 'ob-aviso' }, el('b', null, 'No se pudieron leer los datos del observatorio. '), 'Motivo: ' + e.message + '. No se muestra nada en su lugar.')); });
})();
