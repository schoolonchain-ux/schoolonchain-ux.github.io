/* Observatorio de mercado (mercado.html). Fase 2, sin publicar: entrega 1 hecha (capital y mapa de calor por activo, sector y cadena).
   Lee data/mercado.json y data/mercado-serie.json (los genera cada día tools/equipoia/mercado.cjs con lecturas públicas) y, en vivo desde
   el navegador, el precio de ahora (una lectura ligera por minuto) y un libro de órdenes de Binance solo cuando se pide. Todos los cálculos están en assets/mercado-calc.js (con pruebas y contraste con numpy). Sin IA.
   Cada cifra se puede pulsar: abre su regla, su serie y el enlace a la respuesta en bruto del servicio. Si falta un dato, se dice. */
(function () {
  const { el } = window.C; const M = window.MCALC; const raiz = document.getElementById('ob-raiz'); if (!raiz || !M) return;
  const nf = (x, d = 0) => Number(x).toLocaleString('es-ES', { useGrouping: 'always', minimumFractionDigits: d, maximumFractionDigits: d });
  const SD = 'sin dato';
  const sg = (x, d = 2) => (x == null || !isFinite(x) ? SD : (x < 0 ? '−' : '') + nf(Math.abs(x), d));
  const pct = (x, d = 1) => (x == null || !isFinite(x) ? SD : (Number(Math.abs(x * 100).toFixed(d)) === 0 ? '' : x >= 0 ? '+' : '−') + nf(Math.abs(x * 100), d) + ' %'); // un cambio que redondea a cero va sin signo
  const mUsd = (x) => (x == null ? SD : x >= 1e6 ? nf(x / 1e6, x >= 1e9 ? 0 : 1) + ' M$' : nf(x) + ' $');
  const precio = (x) => (x == null ? SD : (x >= 100 ? nf(x, 0) : x >= 1 ? nf(x, 2) : x >= 0.01 ? nf(x, 4) : nf(x, 8)) + ' $');
  const signo = (x) => (x == null || !isFinite(x) ? '' : x >= 0 ? 'ob-sube' : 'ob-baja');
  const fh = (iso) => { const d = new Date(iso); return isNaN(d) ? SD : d.getUTCDate() + '-' + ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][d.getUTCMonth()] + '-' + d.getUTCFullYear() + ', ' + String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0') + ' UTC'; };
  const fd = (d) => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(d || ''); return m ? Number(m[3]) + '-' + ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][Number(m[2]) - 1] + '-' + m[1] : SD; };
  const traer = (u, ms = 15000) => fetch(u, { cache: 'no-cache', signal: AbortSignal.timeout(ms) }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  let D = null, SP = null, vivo = null, vivoError = null, periodo = '24h';

  /* ---------- panel de origen: toda cifra abre el suyo ---------- */
  const dlg = el('dialog', { class: 'ob-panel' }); document.body.append(dlg);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  const fx = (v) => (/^\d{4}-\d\d-\d\d$/.test(v) ? fd(v) : v === 'ahora' ? 'momento de la lectura en vivo' : v);
  function grafico(x, y, fmt, y2, nombres) {
    const marcas = (q) => { const p = []; for (let i = 0; i < (q || []).length; i++) if (typeof q[i] === 'number' && isFinite(q[i])) p.push([i, q[i]]); return p; };
    const p = marcas(y), p2 = marcas(y2); const dos = p2.length > 1;
    if (p.length < 2) return el('p', { class: 'ob-nota' }, 'No hay serie suficiente para dibujarla.');
    const W = 680, H = 150, mi = 6, ms = 8, mb = 8; let lo = Infinity, hi = -Infinity; for (const q of (dos ? p.concat(p2) : p)) { if (q[1] < lo) lo = q[1]; if (q[1] > hi) hi = q[1]; } if (hi === lo) { hi += 1; lo -= 1; }
    const i0 = dos ? Math.min(p[0][0], p2[0][0]) : p[0][0], i1 = dos ? Math.max(p[p.length - 1][0], p2[p2.length - 1][0]) : p[p.length - 1][0];
    const X = (i) => mi + (i - i0) / (i1 - i0) * (W - 2 * mi), Y = (v) => ms + (1 - (v - lo) / (hi - lo)) * (H - ms - mb);
    const linea = (q, cls) => '<polyline' + (cls ? ' class="' + cls + '"' : '') + ' fill="none" stroke="currentColor" stroke-width="1.8" points="' + q.map((r) => X(r[0]).toFixed(1) + ',' + Y(r[1]).toFixed(1)).join(' ') + '"/>';
    const svg = '<svg class="ob-graf" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (dos ? 'Dos series' : 'Serie') + '">' + (dos ? linea(p2, 's2') : '') + linea(p) + '</svg>';
    return el('div', null, dos ? leyenda([['var(--acc)', (nombres || [])[0] || 'Primera serie'], ['var(--mut)', (nombres || [])[1] || 'Segunda serie']]) : null, el('div', { html: svg }), el('p', { class: 'ob-nota', style: 'margin-top:0' }, (dos ? 'Entre ' + fmt(lo) + ' y ' + fmt(hi) : 'Máximo ' + fmt(hi) + ' · mínimo ' + fmt(lo)) + ' · del ' + fx(x[i0]) + ' al ' + fx(x[i1]) + '.'));
  }
  function abrir(o) {
    const c = el('div', { class: 'ob-pc' }, el('button', { class: 'cerrar', title: 'Cerrar', 'aria-label': 'Cerrar', onclick: () => dlg.close() }, '×'), el('h3', null, o.t), o.sub ? el('p', { class: 'sub' }, o.sub) : null);
    if (o.cifras && o.cifras.length) c.append(el('dl', null, o.cifras.map(([k, v]) => [el('dt', null, k), el('dd', null, v)])));
    if (o.serie) c.append(grafico(o.serie.x, o.serie.y, o.serie.fmt || ((v) => nf(v, 2)), o.serie.y2, o.serie.nombres), o.serie.pie ? el('p', { class: 'ob-nota' }, o.serie.pie) : null);
    if (o.regla) c.append(el('p', { class: 'regla' }, el('b', null, 'Cómo se calcula. '), o.regla));
    if (o.limite) c.append(el('p', { class: 'regla' }, el('b', null, 'Qué no dice. '), o.limite));
    c.append(el('p', { class: 'ob-nota', style: 'margin-top:12px' }, el('b', null, 'De dónde sale')), el('ul', { class: 'fu' }, (o.fuentes || []).map((f) => el('li', null, f.t + ': ', el('a', { href: f.u, target: '_blank', rel: 'noopener' }, f.e || 'respuesta en bruto del servicio')))));
    dlg.replaceChildren(c); if (!dlg.open) dlg.showModal();
  }
  const fuenteDe = (re) => { const f = (D.fuentes || []).find((x) => re.test(x.que)); return f ? [{ t: f.que, u: f.url }] : []; };

  /* ---------- series con el precio de ahora al final (si hay lectura en vivo) ---------- */
  const serieDe = (a) => { const v = vivo && vivo.get(a.par); return v ? a.c.concat([v.ultimo]) : a.c; };
  const diasDe = (a) => (vivo && vivo.get(a.par) ? D.dias.concat(['ahora']) : D.dias);
  function rendPeriodo(a, k) { if (k === '24h') { const v = vivo && vivo.get(a.par); return v && v.apertura > 0 ? v.ultimo / v.apertura - 1 : null; } return M.rend(serieDe(a), Number(k)); }
  const PERIODOS = [['24h', '24 horas', 0.08], ['7', '7 días', 0.15], ['30', '30 días', 0.3], ['90', '90 días', 0.5], ['365', '1 año', 1]];

  /* ---------- serie propia: lo que no tiene histórico gratuito (una lectura al día, la guarda el programa diario) ---------- */
  const filasSerie = () => (SP && Array.isArray(SP.filas) ? SP.filas : []).filter((x) => x && x.dia);
  function bloqueSerie() {
    const F = filasSerie(); const porque = 'La dominancia y el capital total no tienen histórico gratuito, así que el observatorio guarda su propia lectura, una al día. ';
    if (!F.length) return el('p', { class: 'ob-nota' }, porque + 'Todavía no hay ninguna guardada.');
    const cuantas = 'Serie propia: ' + F.length + (F.length === 1 ? ' lectura' : ' lecturas') + ', desde el ' + fd(F[0].dia) + '. ';
    if (F.length < 2) return el('p', { class: 'ob-nota' }, porque + cuantas + 'Hacen falta al menos dos días para poder comparar.');
    const x = F.map((q) => q.dia), u = F[F.length - 1], p = F[0];
    const o = (t, campo, fmt, regla) => ({ t, sub: 'Serie propia del observatorio · ' + F.length + ' lecturas, del ' + fd(p.dia) + ' al ' + fd(u.dia), cifras: [['Primera lectura (' + fd(p.dia) + ')', fmt(p[campo])], ['Última lectura (' + fd(u.dia) + ')', fmt(u[campo])]], serie: { x, y: F.map((q) => q[campo]), fmt, pie: 'Un punto por cada día leído. Si un día no se pudo leer, no se rellena.' }, regla, limite: 'Es una lectura al día, a la hora en que se actualiza la web: no recoge lo que pasa entre una y otra. La serie empieza el día de la primera lectura; lo anterior no existe gratis.', fuentes: fuenteDe(/Capitalización total/).concat([{ t: 'Serie propia del observatorio', u: 'data/mercado-serie.json', e: 'fichero completo' }]) });
    const b = (t, ob) => el('button', { class: 'btn mini', onclick: () => abrir(ob) }, t);
    return el('p', { class: 'ob-nota' }, porque + cuantas, b('Dominancia de bitcoin', o('Dominancia de bitcoin, serie propia', 'btcPct', (v) => nf(v, 2) + ' %', 'Porcentaje del capital total del mercado que es bitcoin, según CoinGecko, guardado una vez al día.')), ' ', b('Capital total', o('Capital total del mercado, serie propia', 'capTotalUsd', mUsd, 'Capitalización total del mercado según CoinGecko, guardada una vez al día.')));
  }

  /* ---------- 1 · capital ---------- */
  function capital() {
    pintarRedes();
    const G = D.global, S = D.stables; const pSt = S.totalUsd / G.capTotalUsd * 100, pB = G.dominanciaPct.btc, pE = G.dominanciaPct.eth, pR = 100 - pB - pE - pSt;
    const seg = (cls, t, p, o) => el('button', { class: cls, style: 'width:' + Math.max(p, 0).toFixed(2) + '%', title: t + ' ' + nf(p, 1) + ' %', onclick: () => abrir(o) }, (p >= 15 ? t + ' ' : '') + nf(p, 0) + ' %');
    const fG = fuenteDe(/Capitalización total/), fS = fuenteDe(/Stablecoins en circulación, serie/);
    const reglaCap = { Stablecoins: 'Stablecoins ancladas al dólar en circulación (DefiLlama) divididas entre el capital total del mercado (CoinGecko). Son dos fuentes distintas, así que el porcentaje es aproximado.', 'Todo lo demás': '100 menos las partes de bitcoin, ether y stablecoins.', 'Capital total del mercado': 'Suma de la capitalización de todos los activos que sigue CoinGecko.' };
    const oCap = (t, p, extra) => ({ t, sub: 'Lectura de CoinGecko del ' + fh(G.leidoEn), cifras: [['Parte del capital total', nf(p, 2) + ' %'], ['En dólares', mUsd(G.capTotalUsd * p / 100)], ['Capital total del mercado', mUsd(G.capTotalUsd)]].concat(extra || []), regla: reglaCap[t] || 'CoinGecko suma la capitalización de todos los activos que sigue y da el porcentaje de cada uno. ' + t + ' es ese porcentaje.', limite: 'Capitalización es precio por unidades en circulación: no es dinero que haya entrado. El histórico no es gratuito, así que el observatorio guarda su propia lectura, una al día.', fuentes: fG });
    const ySt = S.serie.map((x) => x[1]), xSt = S.serie.map((x) => x[0]); const cSt = (n) => (ySt.length > n ? ySt[ySt.length - 1] / ySt[ySt.length - 1 - n] - 1 : null);
    const oSt = (n) => ({ t: 'Stablecoins en circulación', sub: 'Serie diaria de DefiLlama hasta el ' + S.dia, cifras: [['Hoy', mUsd(S.totalUsd)], ['Hace ' + n + ' días', mUsd(ySt[ySt.length - 1 - n])], ['Cambio', pct(cSt(n), 2) + ' (' + mUsd(Math.abs(ySt[ySt.length - 1] - ySt[ySt.length - 1 - n])) + (cSt(n) >= 0 ? ' más' : ' menos') + ')']], serie: { x: xSt, y: ySt, fmt: (v) => mUsd(v), pie: 'Stablecoins ancladas al dólar en circulación, últimos ' + ySt.length + ' días.' }, regla: 'Suma de todas las stablecoins ancladas al dólar que sigue DefiLlama, en todas las cadenas. El cambio compara hoy con el mismo dato de hace ' + n + ' días.', limite: 'Que haya más stablecoins indica dólares que han entrado al sistema, pero no dice adónde van ni si se usan para comprar.', fuentes: fS });
    const k = (t, v, s, o, cls) => el('button', { class: 'ob-k', onclick: () => abrir(o) }, el('span', { class: 'k' }, t), el('span', { class: 'v ' + (cls || '') }, v), s ? el('span', { class: 's' }, s) : null);
    const filaRed = (k) => (r) => { const c = r[k], i = M.ultimo(c); const td = (n) => { const v = M.cambio(c, n); return el('td', { class: signo(v) }, pct(v)); }; return el('tr', { class: 'cl', onclick: () => fichaRed(r, k) }, el('td', null, r.nombre), el('td', null, mUsd(c[i] * 1e6)), td(7), td(30), td(90), td(365)); };
    const redesCon = (k) => D.redes.filas.filter((r) => r[k]).sort((a, b) => b[k][M.ultimo(b[k])] - a[k][M.ultimo(a[k])]);
    const sinRed = (k, que) => { const L = D.redes.filas.filter((r) => !r[k]); return L.length ? el('p', { class: 'ob-nota' }, 'DefiLlama no da serie de ' + que + ' para: ' + L.map((r) => r.nombre).join(', ') + '. No se rellena.') : null; };
    const CAB = ['Cadena', 'Último dato', '7 días', '30 días', '90 días', '1 año'];
    const cab = (a) => el('thead', null, el('tr', null, a.map((t) => el('th', null, t))));
    return el('section', { class: 'zp', id: 'capital' }, el('p', { class: 'kick' }, 'Pregunta 1'), el('h2', null, '¿Dónde está el capital?'),
      el('p', { class: 'ob-sub' }, 'De cada 100 dólares que vale hoy el mercado, cuántos están en bitcoin, en ether, en stablecoins y en todo lo demás. Pulsa cualquier trozo o cifra para ver de dónde sale.'),
      el('div', { class: 'ob-barra' }, seg('ob-seg-btc', 'BTC', pB, oCap('Bitcoin', pB)), seg('ob-seg-eth', 'ETH', pE, oCap('Ether', pE)), seg('ob-seg-st', 'Stablecoins', pSt, oCap('Stablecoins', pSt, [['Stablecoins en circulación (DefiLlama)', mUsd(S.totalUsd)], ['Aviso', 'El total es de CoinGecko y las stablecoins, de DefiLlama: dos fuentes distintas.']])), seg('ob-seg-re', 'Resto', pR, oCap('Todo lo demás', pR))),
      el('div', { class: 'ob-ley' }, [['ob-seg-btc', 'Bitcoin', pB], ['ob-seg-eth', 'Ether', pE], ['ob-seg-st', 'Stablecoins', pSt], ['ob-seg-re', 'Todo lo demás', pR]].map(([cls, t, p]) => el('span', null, el('i', { class: cls }), t + ' ' + nf(p, 1) + ' %'))),
      el('div', { class: 'ob-kpis' }, k('Capital total', mUsd(G.capTotalUsd), pct(G.cambio24hPct / 100, 2) + ' en 24 h', oCap('Capital total del mercado', 100), ''), k('Stablecoins · 7 días', pct(cSt(7), 2), mUsd(S.totalUsd) + ' hoy', oSt(7), signo(cSt(7))), k('Stablecoins · 30 días', pct(cSt(30), 2), '', oSt(30), signo(cSt(30))), k('Stablecoins · 90 días', pct(cSt(90), 2), '', oSt(90), signo(cSt(90))), k('Stablecoins · 1 año', pct(cSt(365), 2), '', oSt(365), signo(cSt(365)))),
      el('h3', { class: 'ob-h3' }, 'Stablecoins por cadena'), cajaRedSt, plegada(el('table', { class: 'ob-t' }, cab(CAB), el('tbody', null, redesCon('st').map(filaRed('st'))))), sinRed('st', 'stablecoins'),
      el('h3', { class: 'ob-h3' }, 'Dinero depositado en aplicaciones, por cadena'), cajaRedTvl, plegada(el('table', { class: 'ob-t' }, cab(CAB), el('tbody', null, redesCon('tvl').map(filaRed('tvl'))))), sinRed('tvl', 'dinero depositado'),
      el('p', { class: 'ob-nota' }, 'Son las cadenas con más dinero depositado o más stablecoins. Pulsa una barra, o una fila de la tabla, para ver su serie de más de un año. Si una cadena tiene menos historia que el plazo, se dice «sin dato».'),
      bloqueSerie());
  }

  /* ---------- mapa de calor: por activo, por sector y por cadena ---------- */
  const cajaCalor = el('div'), cajaVista = el('div', { class: 'ob-per' }), cajaPer = el('div', { class: 'ob-per' }), notaCalor = el('p', { class: 'ob-nota' }); let vista = 'activos';
  const VISTAS = [['activos', 'Por activo'], ['sectores', 'Por sector'], ['cadenas', 'Por cadena']];
  const MIN_SECTOR = 3; // con menos activos con dato no se da cifra de sector
  const escala = () => PERIODOS.find((p) => p[0] === periodo)[2];
  const tPer = () => PERIODOS.find((p) => p[0] === periodo)[1];
  const nPer = () => (periodo === '24h' ? 1 : Number(periodo));
  const fondo = (r) => { if (r == null || !isFinite(r)) return 'var(--bg)'; const i = Math.min(1, Math.abs(r) / escala()); return 'color-mix(in srgb, var(' + (r >= 0 ? '--ok' : '--bad') + ') ' + Math.round(12 + 58 * i) + '%, var(--pan))'; };
  function fichaActivo(a) {
    const c = serieDe(a), x = diasDe(a); const v = vivo && vivo.get(a.par);
    abrir({ t: a.n + ' (' + a.s + ')', sub: 'Par ' + a.par + ' en Binance · puesto ' + a.rango + ' por capitalización (CoinGecko)', cifras: [['Precio ' + (v ? 'ahora' : 'al cierre de ayer'), precio(c[M.ultimo(c)])]].concat(PERIODOS.map(([k, t]) => [t, pct(rendPeriodo(a, k), 2)]), [['Volatilidad a 30 días', M.vol(a.c, 30) == null ? SD : nf(M.vol(a.c, 30), 1) + ' % anual'], ['Días con dato', nf(a.dias)]]), serie: { x, y: c, fmt: precio, pie: 'Cierres diarios en UTC' + (v ? ' y, al final, el precio de ahora.' : '.') }, regla: 'Rendimiento a n días = precio de ahora dividido entre el cierre de hace n días, menos 1. El de 24 horas es la ventana móvil de Binance. Si no hay lectura en vivo se usa el cierre de ayer y se avisa.', limite: 'Es el precio en una sola casa de cambio (Binance). Un rendimiento pasado no anticipa el siguiente.', fuentes: [{ t: 'Cierres y volumen diarios de ' + a.par + ' (Binance)', u: a.url }].concat(v ? [{ t: 'Precio de ahora y ventana de 24 horas (Binance)', u: urlVivo([a.par]) }] : []) });
  }
  // sectores: qué activos de la cesta pone CoinGecko en cada sector de la lista fija; la cifra del sector es la mediana de sus rendimientos
  const porSimbolo = () => new Map(D.activos.map((a) => [a.s, a]));
  function gruposSector() { const m = porSimbolo(); return (D.sectoresCesta || []).map((x) => ({ x, ms: (x.miembros || []).map((s) => m.get(s)).filter(Boolean) })); }
  const rendSector = (g, k) => M.grupo(g.ms.map((a) => rendPeriodo(a, k)), MIN_SECTOR);
  const ordenSector = (G, k) => G.map((g) => ({ g, r: rendSector(g, k) })).sort((a, b) => (b.r ? b.r.mediana : -9) - (a.r ? a.r.mediana : -9));
  function fichaSector(g, kp) {
    const kq = kp || periodo, tq = PERIODOS.find((p) => p[0] === kq)[1]; const x = g.x; const filas = g.ms.map((a) => [a, rendPeriodo(a, kq)]).sort((p, q) => (q[1] == null ? -9 : q[1]) - (p[1] == null ? -9 : p[1]));
    const cif = PERIODOS.map(([k, t]) => { const r = rendSector(g, k); return ['Sector, ' + t, r ? pct(r.mediana, 2) + ' · suben ' + r.suben + ' de ' + r.n : SD + (k === '24h' && !vivo ? ' (falta la lectura en vivo)' : ' (menos de ' + MIN_SECTOR + ' activos con dato)')]; });
    abrir({ t: x.nombre, sub: 'Sector «' + x.original + '» de CoinGecko · ' + (x.fallo ? 'la lectura diaria falló' : g.ms.length + (g.ms.length === 1 ? ' activo' : ' activos') + ' de la cesta'),
      cifras: x.fallo ? [['Lectura de CoinGecko', 'falló (' + x.fallo + '). No se muestra nada en su lugar.']] : cif.concat(filas.map(([a, r]) => [a.s + ' · ' + a.n + ', ' + tq, pct(r, 2)])),
      serie: x.fallo || !g.ms.length ? null : (() => { const n = kq === '24h' ? 30 : Number(kq); const eje = diasDe(g.ms[0]).slice(-(n + 1)); return { x: eje, y: M.caminoGrupo(g.ms.map(serieDe), n, MIN_SECTOR), fmt: (v) => pct(v, 1), pie: 'Camino del sector en ' + (kq === '24h' ? 'los últimos 30 días' : tq) + ': para cada día, la mediana de lo que lleva ganado o perdido cada activo desde el primer día.' }; })(),
      regla: 'CoinGecko dice qué activos pertenecen al sector. De ellos se toman los que están en la cesta y se calcula el rendimiento de cada uno con precios de Binance. La cifra del sector es la mediana (el valor central) de esos rendimientos. Con menos de ' + MIN_SECTOR + ' activos con dato no se da cifra.',
      limite: 'El sector es una etiqueta que pone CoinGecko, no un hecho, y un mismo activo puede estar en varios. Solo cuentan los activos de la cesta, no el sector entero. La mediana trata igual a un activo grande que a uno pequeño.',
      fuentes: [{ t: 'Activos del sector «' + x.original + '» (CoinGecko)', u: x.url }].concat(fuenteDe(/Cierres y volumen diarios de cada activo/)) });
  }
  // redes: dinero depositado (tvl) y stablecoins (st) de cada cadena, serie diaria de DefiLlama en millones de dólares
  const PR = [[1, '1 día'], [7, '7 días'], [30, '30 días'], [90, '90 días'], [365, 'un año']];
  function fichaRed(r, k) {
    const c = r[k], esT = k === 'tvl', i = M.ultimo(c); const usd = (v) => (v == null ? SD : mUsd(v * 1e6));
    abrir({ t: (esT ? 'Dinero depositado en ' : 'Stablecoins en ') + r.nombre, sub: 'DefiLlama · serie diaria, último dato del ' + fd(D.redes.dias[i]),
      cifras: [['Último dato', usd(c[i])]].concat(PR.map(([n, t]) => { const a = M.atras(c, n); return ['Hace ' + t, a ? usd(a.antes) + ' · cambio ' + pct(M.cambio(c, n), 2) : SD + ' (la serie no llega tan atrás o falta ese día)']; })),
      serie: { x: D.redes.dias, y: c.map((v) => (v == null ? null : v * 1e6)), fmt: mUsd, pie: (esT ? 'Dinero depositado en las aplicaciones de ' : 'Stablecoins ancladas al dólar emitidas en ') + r.nombre + ', día a día.' },
      regla: (esT ? 'Valor en dólares de lo depositado en las aplicaciones de esa cadena (lo que DefiLlama llama TVL). ' : 'Stablecoins ancladas al dólar emitidas en esa cadena. ') + 'El cambio a n días compara el último dato con el de n días antes.',
      limite: esT ? 'Sube y baja también con el precio de lo depositado, aunque nadie meta ni saque nada.' : 'Un traspaso entre cadenas baja una y sube otra sin que entre dinero nuevo.',
      fuentes: [{ t: (esT ? 'Dinero depositado en ' : 'Stablecoins en ') + r.nombre + ', serie diaria (DefiLlama)', u: esT ? r.urlTvl : r.urlSt }] });
  }
  function pintarCalor() {
    cajaVista.replaceChildren(...VISTAS.map(([k, t]) => el('button', { class: k === vista ? 'on' : '', onclick: () => { vista = k; pintarCalor(); } }, t)));
    cajaPer.replaceChildren(...PERIODOS.map(([k, t]) => el('button', { class: k === periodo ? 'on' : '', onclick: () => { periodo = k; pintarCalor(); } }, t)));
    const precioDe = periodo === '24h' && !vivo ? 'Sin lectura en vivo no hay cifra de 24 horas para los precios: elige otro periodo.' : vivo ? 'Precios: con el de ahora en Binance.' : 'Precios: con el cierre de ayer, porque ahora mismo no se pudo leer el precio en vivo.';
    if (vista === 'activos') {
      cajaCalor.className = 'ob-calor';
      cajaCalor.replaceChildren(...D.activos.map((a) => { const r = rendPeriodo(a, periodo); return el('button', { class: 'ob-c', style: 'background:' + fondo(r), title: a.n, onclick: () => fichaActivo(a) }, el('span', { class: 's' }, a.s), el('span', { class: 'v' }, r == null ? SD : pct(r, 1))); }));
      const con = D.activos.map((a) => rendPeriodo(a, periodo)).filter((x) => x != null); const sub = con.filter((x) => x >= 0).length;
      notaCalor.textContent = (con.length ? sub + ' de ' + con.length + ' activos suben y ' + (con.length - sub) + ' bajan en este periodo. Ordenados por capitalización. ' : '') + precioDe;
    } else if (vista === 'sectores') {
      const O = ordenSector(gruposSector(), periodo);
      cajaCalor.className = 'ob-calor sec';
      cajaCalor.replaceChildren(...O.map(({ g, r }) => el('button', { class: 'ob-c', style: 'background:' + fondo(r && r.mediana), title: 'Sector «' + g.x.original + '» de CoinGecko', onclick: () => fichaSector(g) }, el('span', { class: 's' }, g.x.nombre), el('span', { class: 'v' }, r ? pct(r.mediana, 1) : SD), el('span', { class: 'n' }, g.x.fallo ? 'lectura fallida' : g.ms.length + (g.ms.length === 1 ? ' activo' : ' activos') + ' de la cesta'))));
      const con = O.filter((o) => o.r); const sub = con.filter((o) => o.r.mediana >= 0).length;
      notaCalor.textContent = (O.length ? (con.length ? sub + ' de ' + con.length + ' sectores suben y ' + (con.length - sub) + ' bajan en este periodo. ' : '') + 'La cifra de cada sector es la mediana del rendimiento de los activos de la cesta que CoinGecko pone en él; con menos de ' + MIN_SECTOR + ' no se da cifra. Un activo puede estar en varios sectores. ' : 'La lectura diaria no trae los sectores de la cesta. ') + precioDe;
    } else {
      const m = porSimbolo(), n = nPer();
      const celda = (v, abre, vacio) => el('td', Object.assign({ class: 'ob-cc' + (v == null ? ' vacia' : '') }, v == null ? {} : { style: 'background:' + fondo(v) }, abre ? { onclick: abre, title: 'Ver la serie y de dónde sale' } : {}), v == null ? (vacio || SD) : pct(v, 1));
      cajaCalor.className = 'ob-tw';
      cajaCalor.replaceChildren(el('table', { class: 'ob-t ob-tc' }, el('thead', null, el('tr', null, ['Cadena', 'Su moneda (precio)', 'Dinero depositado', 'Stablecoins'].map((t) => el('th', null, t)))), el('tbody', null, D.redes.filas.map((r) => { const a = r.token ? m.get(String(r.token).toUpperCase()) : null;
        return el('tr', null, el('td', null, r.nombre, a ? el('span', { class: 'n2' }, a.s) : null),
          celda(a ? rendPeriodo(a, periodo) : null, a ? () => fichaActivo(a) : null, a ? SD : r.token ? r.token + ' no está en la cesta' : 'sin moneda propia'),
          celda(r.tvl ? M.cambio(r.tvl, n) : null, r.tvl ? () => fichaRed(r, 'tvl') : null, r.tvl ? SD : 'sin serie'),
          celda(r.st ? M.cambio(r.st, n) : null, r.st ? () => fichaRed(r, 'st') : null, r.st ? SD : 'sin serie')); }))));
      notaCalor.textContent = 'Las cadenas con más dinero depositado o más stablecoins. «Su moneda» es el precio de la moneda propia de la cadena en Binance, solo si está en la cesta. El dinero depositado y las stablecoins son datos diarios de DefiLlama' + (periodo === '24h' ? ': en «24 horas» comparan el último dato con el del día anterior' : '') + '. Las tres columnas usan la misma escala de color. ' + precioDe;
    }
  }
  function calor() { return el('section', { class: 'zp', id: 'calor' }, el('p', { class: 'kick' }, 'Vista general'), el('h2', null, 'Mapa de calor'), el('p', { class: 'ob-sub' }, 'Cuánto ha subido o bajado cada activo, cada sector y cada cadena. Verde sube, rojo baja; cuanto más intenso, más movimiento. Pulsa cualquier casilla para ver su serie y de dónde sale.'), cajaVista, cajaPer, cajaCalor, notaCalor); }

  /* ---------- 2 · liquidez: foto diaria (la toma el programa diario) y lectura en vivo de UN libro cuando se pide ----------
     Una lectura profunda del libro cuenta 250 de los 6.000 puntos por minuto que Binance da a cada visitante: leer ocho al abrir la página
     agota el límite con un par de recargas y Binance bloquea al visitante unos minutos. Por eso la página NO lee libros al abrirse. */
  const cuerpoLiq = el('tbody'), notaLiq = el('p', { class: 'ob-nota' }); let pausaLiq = 0;
  const filasLiq = () => ((D.liquidez && D.liquidez.filas) || []);
  function fichaLibro(x) { const dif = x.medio * x.diferencialPct / 100; abrir({ t: 'Libro de órdenes de ' + x.par, sub: 'Binance · ' + (x.enVivo ? 'leído ahora, el ' : 'foto de la lectura diaria, el ') + fh(x.hora), cifras: [['Precio medio', precio(x.medio)], ['Diferencial entre compra y venta', nf(x.diferencialPct, 5) + ' % (' + nf(dif, dif >= 0.01 ? 2 : 6) + ' $)'], ['Esperando para comprar (hasta −1 %)', mUsd(x.compras)], ['Esperando para vender (hasta +1 %)', mUsd(x.ventas)], ['Desequilibrio', sg(x.desequilibrio, 2) + ' (−1 todo ventas · +1 todo compras)'], ['¿El libro leído llega al ±1 %?', x.completo ? 'sí' : 'no: hay más órdenes de las que devuelve la lectura; la cifra es un mínimo']], regla: 'Se suman, en dólares, las órdenes de compra entre el precio medio y un 1 % por debajo, y las de venta hasta un 1 % por encima. Desequilibrio = (compras − ventas) / (compras + ventas).', limite: 'Es una foto de un instante en una sola casa de cambio. Las órdenes se pueden retirar antes de ejecutarse, y hay liquidez que no aparece en el libro.', fuentes: [{ t: 'Libro de órdenes de ' + x.par + ' (Binance)', u: x.url }] }); }
  async function leerUnLibro(x, boton) {
    if (Date.now() < pausaLiq) { notaLiq.textContent = 'Espera unos segundos entre lectura y lectura: Binance limita las consultas por visitante.'; return; }
    pausaLiq = Date.now() + 15000; boton.disabled = true; boton.textContent = 'Leyendo…';
    try { const r = await fetch(x.url, { cache: 'no-cache', signal: AbortSignal.timeout(20000) }); if (r.status === 418 || r.status === 429) throw new Error('Binance pide esperar (límite por visitante); no se reintenta solo'); if (!r.ok) throw new Error('HTTP ' + r.status); const j = await r.json(); const p = M.profundidad(j.bids, j.asks, 0.01); if (!p) throw new Error('libro vacío'); Object.assign(x, { hora: new Date().toISOString(), medio: p.medio, diferencialPct: p.diferencialPct, compras: p.compras, ventas: p.ventas, desequilibrio: p.desequilibrio, completo: p.completo, enVivo: true, fallo: null }); notaLiq.textContent = 'Leído ' + x.s + ' ahora mismo, el ' + fh(x.hora) + '.'; } catch (e) { notaLiq.textContent = 'No se pudo leer ' + x.s + ' ahora: ' + e.message + '. Se mantiene la foto anterior.'; }
    pintarLiquidez(); pintarPreguntas();
  }
  function pintarLiquidez() {
    pintarGraficoLiq(); const F = filasLiq(); if (!F.length) { cuerpoLiq.replaceChildren(el('tr', null, el('td', { colspan: 7 }, 'La lectura diaria no trae la foto de los libros' + (D.liquidez && D.liquidez.fallo ? ' (' + D.liquidez.fallo + ')' : '') + '. No se muestra nada en su lugar.'))); return; }
    cuerpoLiq.replaceChildren(...F.map((x) => { const b = el('button', { class: 'btn mini', title: 'Leer ahora este libro en Binance' }, 'Leer ahora'); b.onclick = (e) => { e.stopPropagation(); leerUnLibro(x, b); };
      if (x.fallo || x.compras == null) return el('tr', null, el('td', null, x.s), el('td', { colspan: 5 }, 'Sin foto en la lectura diaria' + (x.fallo ? ' (' + x.fallo + ')' : '')), el('td', null, b));
      const c = x.compras / (x.compras + x.ventas) * 100;
      return el('tr', { class: 'cl', onclick: () => fichaLibro(x) }, el('td', null, x.s, el('span', { class: 'n2' }, x.enVivo ? 'ahora' : 'foto diaria')), el('td', null, nf(x.diferencialPct, 5) + ' %'), el('td', null, (x.completo ? '' : '≥ ') + mUsd(x.compras)), el('td', null, (x.completo ? '' : '≥ ') + mUsd(x.ventas)), el('td', null, el('span', { class: 'ob-deseq', title: nf(c, 0) + ' % compras' }, el('i', { class: 'c', style: 'width:' + c.toFixed(1) + '%' }), el('i', { class: 'v', style: 'width:' + (100 - c).toFixed(1) + '%' }))), el('td', { class: signo(x.desequilibrio) }, sg(x.desequilibrio, 2)), el('td', null, b)); }));
  }
  function fraseLiquidez() { const b = filasLiq()[0]; return b && b.compras != null ? (b.enVivo ? 'Ahora mismo hay ' : 'En la última foto había ') + mUsd(b.compras) + ' esperando para comprar bitcoin a menos de un 1 % del precio y ' + mUsd(b.ventas) + ' para venderlo.' : 'La lectura diaria no trae la foto de los libros.'; }
  function liquidez() { const F = filasLiq(); const h = F.find((x) => x.hora); pintarLiquidez(); if (h) notaLiq.textContent = 'Foto de la lectura diaria, tomada el ' + fh(h.hora) + '. Dinero esperando a menos de un 1 % del precio.';
    return el('section', { class: 'zp', id: 'liquidez' }, el('p', { class: 'kick' }, 'Pregunta 2'), el('h2', null, '¿Dónde aumenta la liquidez?'), el('p', { class: 'ob-sub' }, 'Cuánto dinero hay esperando para comprar y para vender cerca del precio en Binance, para los ocho mayores activos de la cesta. La otra mitad de la respuesta está arriba: las stablecoins que entran o salen de cada cadena.'), cajaLiq, plegada(el('table', { class: 'ob-t' }, el('thead', null, el('tr', null, ['Activo', 'Diferencial', 'Para comprar (−1 %)', 'Para vender (+1 %)', 'Reparto', 'Desequilibrio', ''].map((t) => el('th', null, t)))), cuerpoLiq)), notaLiq, el('p', { class: 'ob-nota' }, 'La foto la toma la lectura diaria, no tu navegador: Binance limita las lecturas profundas por visitante. «Leer ahora» lee un solo libro en el momento. No existe histórico gratuito de la profundidad: para saber si la liquidez AUMENTA hay que comparar con días anteriores, y esa comparación se hará con la serie propia del observatorio (una foto al día) cuando tenga días suficientes.')); }

  /* ---------- 3 · sectores ---------- */
  const RUIDO = /portfolio|ecosystem|holdings|index|alleged|made in|ftx|fund\b/i;
  const sectoresUtiles = () => (D.sectores || []).filter((s) => !RUIDO.test(s.nombre)).slice(0, 20);
  const cuerpoSecCesta = el('tbody');
  function pintarTablaSectores() {
    pintarGraficoSectores();
    const O = ordenSector(gruposSector(), '30');
    cuerpoSecCesta.replaceChildren(...O.map(({ g }) => el('tr', { class: 'cl', onclick: () => fichaSector(g) }, el('td', null, g.x.nombre), g.x.fallo ? el('td', { colspan: 6, style: 'text-align:left' }, 'La lectura diaria de CoinGecko falló para este sector; sin dato') : [el('td', null, String(g.ms.length))].concat(PERIODOS.map(([k]) => { const r = rendSector(g, k); return el('td', { class: signo(r && r.mediana) }, r ? pct(r.mediana, 1) : SD); })))));
  }
  function fraseSectores(L, sb) {
    const O = ordenSector(gruposSector(), '30').filter((o) => o.r); const out = [];
    if (O.length) { const s30 = O.filter((o) => o.r.mediana >= 0).length; out.push('En 30 días suben ', el('b', null, String(s30)), ' de los ', String(O.length), ' sectores de la cesta con cifra. El que mejor va: ', O[0].g.x.nombre, ' (', pct(O[0].r.mediana, 1), '); el que peor: ', O[O.length - 1].g.x.nombre, ' (', pct(O[O.length - 1].r.mediana, 1), '). '); }
    if (L.length) out.push('En 24 horas, según CoinGecko, suben ', el('b', null, String(sb)), ' de sus ', String(L.length), ' mayores sectores.');
    return out.length ? out : 'La lectura de sectores no llegó en la última actualización.';
  }
  function sectores() {
    const L = sectoresUtiles(); const fu = fuenteDe(/Sectores:/);
    pintarTablaSectores(); const hay = (D.sectoresCesta || []).length > 0;
    const fichaCG = (s) => abrir({ t: s.nombre, sub: 'Sector según CoinGecko · lectura diaria del ' + fh(D.leidoEn), cifras: [['Capitalización', mUsd(s.capUsd)], ['Cambio en 24 horas', pct(s.cambio24hPct / 100, 2)], ['Negociado en 24 horas', mUsd(s.volumen24hUsd)], ['Negociado / capitalización', nf(s.volumen24hUsd / s.capUsd * 100, 2) + ' %']], regla: 'Las cifras son las que publica CoinGecko para cada categoría. «Negociado / capital» divide el volumen de 24 horas entre la capitalización: cuánto se mueve el sector en relación con su tamaño.', limite: 'El sector es una etiqueta que pone CoinGecko, no un hecho. Las categorías se solapan (bitcoin está en varias). Estas cifras de CoinGecko solo existen a 24 horas; para plazos más largos está la tabla de sectores de la cesta.', fuentes: fu });
    const mx = Math.max(...L.map((s) => Math.abs(s.cambio24hPct)), 1);
    const graficoCG = !L.length ? null : barras(L.slice().sort((a, b) => b.cambio24hPct - a.cambio24hPct).map((x) => ({ t: x.nombre, sub: mUsd(x.capUsd), v: x.cambio24hPct / 100, txt: pct(x.cambio24hPct / 100, 2), abre: () => fichaCG(x) })), 'Cuánto ha cambiado en 24 horas la capitalización de cada sector, según CoinGecko. Del que más sube al que más baja; junto al nombre, su capitalización. Pulsa una barra para ver sus datos.');
    return el('section', { class: 'zp', id: 'sectores' }, el('p', { class: 'kick' }, 'Pregunta 3'), el('h2', null, '¿Qué sectores ganan actividad?'), el('p', { class: 'ob-sub' }, 'Dos miradas. Primero, los sectores que se siguen en la cesta, a varios plazos: la cifra es la mediana del rendimiento de sus activos. Después, los veinte mayores sectores según CoinGecko, con lo que ha cambiado su capitalización y lo que se ha negociado en 24 horas. Un mismo activo puede estar en varios sectores.'),
      el('h3', { class: 'ob-h3' }, 'Sectores de la cesta, por plazo'),
      hay ? [cajaSecCesta, plegada(el('table', { class: 'ob-t' }, el('thead', null, el('tr', null, ['Sector', 'Activos'].concat(PERIODOS.map((p) => p[1])).map((t) => el('th', null, t)))), cuerpoSecCesta)), el('p', { class: 'ob-nota' }, 'Lista fija de ' + D.sectoresCesta.length + ' sectores; con menos de ' + MIN_SECTOR + ' activos de la cesta con dato no se da cifra. La tabla trae todos los plazos a la vez, ordenada por el rendimiento a 30 días.')] : el('p', { class: 'ob-nota' }, 'La lectura diaria no trae los sectores de la cesta. No se muestra nada en su lugar.'),
      el('h3', { class: 'ob-h3' }, 'Los veinte mayores sectores según CoinGecko, en 24 horas'),
      graficoCG,
      !L.length ? el('p', { class: 'ob-nota' }, 'La lectura de sectores de CoinGecko no llegó en la última actualización' + (D.sectoresFallo ? ' (' + D.sectoresFallo + ')' : '') + '. No se muestra nada en su lugar.') : plegada(el('table', { class: 'ob-t' }, el('thead', null, el('tr', null, ['Sector (CoinGecko)', 'Capitalización', 'Cambio 24 h', '', 'Negociado 24 h', 'Negociado / capital'].map((t) => el('th', null, t)))), el('tbody', null, L.map((s) => { const w = Math.abs(s.cambio24hPct) / mx * 100; return el('tr', { class: 'cl', onclick: () => fichaCG(s) }, el('td', null, s.nombre), el('td', null, mUsd(s.capUsd)), el('td', { class: signo(s.cambio24hPct) }, pct(s.cambio24hPct / 100, 2)), el('td', null, el('span', { class: 'ob-deseq', style: 'width:90px' }, el('i', { class: s.cambio24hPct >= 0 ? 'c' : 'v', style: 'width:' + w.toFixed(0) + '%' }))), el('td', null, mUsd(s.volumen24hUsd)), el('td', null, nf(s.volumen24hUsd / s.capUsd * 100, 2) + ' %')); })))),
      !L.length ? null : el('p', { class: 'ob-nota' }, 'Lectura diaria del ' + fh(D.leidoEn) + ' (CoinGecko limita las consultas por visitante, así que esto no se lee desde tu navegador). Se han quitado las categorías que son carteras de fondos o ecosistemas de una cadena.'));
  }

  /* ---------- volatilidad y estado del mercado ---------- */
  const ESTADOS = ['extremo', 'agitado', 'normal', 'calma']; const NOMBRE_ESTADO = { calma: 'En calma', normal: 'Normal', agitado: 'Agitado', extremo: 'En extremo' };
  const REGLA_VOL = 'Volatilidad: desviación típica de los rendimientos diarios de los últimos 7, 30 o 90 días, multiplicada por la raíz de 365 para expresarla en un año. El percentil dice qué parte de los días de su propia historia tuvo una volatilidad a 30 días igual o menor que la de hoy. Estados: calma (menos de 25), normal (25 a 75), agitado (75 a 95), extremo (95 o más).';
  const LIMITE_VOL = 'La volatilidad mide cuánto se mueve, no hacia dónde. La pasada no predice la futura. Con menos de dos años de historia el percentil es menos fiable.';
  const va = (v, d = 1) => (v == null ? SD : nf(v, d) + ' % anual'); const v0 = (v) => (v == null ? SD : nf(v, 0) + ' %');
  const puntos = (d) => (d == null ? SD : (Number(Math.abs(d).toFixed(1)) === 0 ? '' : d >= 0 ? '+' : '−') + nf(Math.abs(d), 1));
  let FV = null; // una fila por activo; se calcula una vez porque usa cierres hasta ayer
  function filasVol() { if (!FV) FV = D.activos.map((a) => { const sv = M.serieVol(a.c, 30); const p = M.percentil(sv); return { a, v7: M.vol(a.c, 7), v30: M.vol(a.c, 30), v90: M.vol(a.c, 90), p, e: M.estadoVol(p), sv, m1: M.maximo(a.c, 365), m2: M.maximo(a.c, D.dias.length) }; }).sort((x, y) => (y.p == null ? -1 : y.p) - (x.p == null ? -1 : x.p)); return FV; }
  const txtMax = (m) => (m ? precio(m.valor) + ', el ' + fd(D.dias[m.i]) + (m.hace === 0 ? ' (es su último cierre)' : m.hace === 1 ? ' (un día antes de su último cierre)' : ' (' + nf(m.hace) + ' días antes de su último cierre)') : SD);
  function fichaVol(f) {
    abrir({ t: 'Volatilidad de ' + f.a.n + ' (' + f.a.s + ')', sub: 'Con cierres diarios de Binance hasta ayer',
      cifras: [['Volatilidad a 7 días', va(f.v7)], ['Volatilidad a 30 días', va(f.v30)], ['Volatilidad a 90 días', va(f.v90)], ['Percentil en su propia historia (30 días)', f.p == null ? SD + ' (hacen falta 60 valores)' : nf(f.p, 0) + ' de 100'], ['Estado', f.e || SD],
        ['Máximo de un año', txtMax(f.m1)], ['Caída desde ese máximo', f.m1 ? pct(f.m1.caida, 1) : SD], ['Máximo de toda su serie (' + nf(f.a.dias) + ' días)', txtMax(f.m2)], ['Caída desde ese máximo', f.m2 ? pct(f.m2.caida, 1) : SD]],
      serie: { x: D.dias, y: f.sv, fmt: (v) => nf(v, 0) + ' %', pie: 'Volatilidad a 30 días, día a día, en toda la historia disponible (' + nf(f.a.dias) + ' días).' },
      regla: REGLA_VOL + ' La caída desde el máximo es el último cierre dividido entre el cierre más alto del periodo, menos uno.', limite: LIMITE_VOL, fuentes: [{ t: 'Cierres diarios de ' + f.a.par + ' (Binance)', u: f.a.url }] });
  }
  function fichaCestaVol() {
    const F = filasVol(); const lista = (e) => { const L = F.filter((f) => f.e === e).map((f) => f.a.s); return L.length + (L.length ? ': ' + L.slice(0, 14).join(', ') + (L.length > 14 ? ' y ' + (L.length - 14) + ' más' : '') : ''); };
    abrir({ t: 'Estado de la cesta', sub: D.activos.length + ' activos, con cierres diarios de Binance hasta ayer',
      cifras: ESTADOS.map((e) => [NOMBRE_ESTADO[e], lista(e)]).concat([['Sin historia suficiente', String(F.filter((f) => !f.e).length)], ['Volatilidad a 30 días, mediana de la cesta', va(M.mediana(F.map((f) => f.v30)))], ['Volatilidad a 90 días, mediana de la cesta', va(M.mediana(F.map((f) => f.v90)))]]),
      regla: REGLA_VOL + ' Cada activo se compara solo consigo mismo: «agitado» quiere decir agitado para lo que ese activo acostumbra.', limite: LIMITE_VOL + ' La cesta son los mayores de hoy.', fuentes: fuenteDe(/Cierres y volumen diarios/) });
  }

  /* volatilidad esperada (Deribit) frente a la realizada, para bitcoin y ether */
  let espViva = null, espError = null; const MONEDA = { BTC: 'bitcoin', ETH: 'ether' };
  const filasEsp = () => ((D.esperada && D.esperada.filas) || []).map((x) => ({ x, a: D.activos.find((a) => a.s === x.s) })).filter((q) => q.a);
  function datosEsp(q) {
    const { x, a } = q; const viva = espViva && espViva.get(x.s); const u = x.v ? M.ultimo(x.v) : -1; const ayer = u >= 0 ? x.v[u] : null; const ahora = viva ? viva.v : ayer;
    const sv = M.serieVol(a.c, 30); const real = M.vol(a.c, 30);
    return { x, a, viva, ayer, diaAyer: u >= 0 ? D.dias[u] : null, ahora, real, dif: ahora != null && real != null ? ahora - real : null, p: x.v ? M.percentil(x.v) : null, e: x.v ? M.esperadaFrenteAReal(x.v, sv, 30) : null, sv };
  }
  function fichaEsp(d) {
    const e = d.e; const n = MONEDA[d.x.s] || d.x.s;
    abrir({ t: 'Volatilidad esperada y realizada de ' + n, sub: 'La esperada sale de las opciones de Deribit; la realizada, de los cierres de Binance hasta ayer. Las dos en % anual.',
      cifras: [[d.viva ? 'Esperada ahora' : 'Esperada al cierre de ayer', va(d.ahora) + (d.viva ? ' (leída de Deribit el ' + fh(d.viva.hora) + ')' : d.diaAyer ? ' (cierre del ' + fd(d.diaAyer) + '; la lectura en vivo no llegó' + (espError ? ': ' + espError : '') + ')' : '')],
        ['Realizada en los últimos 30 días', va(d.real)],
        ['Diferencia', d.dif == null ? SD : puntos(d.dif) + ' puntos: el mercado espera ' + (d.dif >= 0 ? 'más' : 'menos') + ' movimiento del que ha habido'],
        ['Percentil de la esperada en su propia historia', d.p == null ? SD : nf(d.p, 0) + ' de 100 (cierre de ayer, entre ' + nf(d.x.dias) + ' días)'],
        ['Hace 30 días se esperaba', e ? va(e.ultimo.esperada) + ' (cierre del ' + fd(D.dias[e.ultimo.i - 30]) + ')' : SD],
        ['Lo que pasó en esos 30 días', e ? va(e.ultimo.ocurrida) : SD],
        ['Días en que se esperó más de lo que luego pasó', e ? nf(e.mas) + ' de ' + nf(e.n) + ' (' + nf(e.mas / e.n * 100, 0) + ' %)' : SD],
        ['Diferencia mediana entre lo esperado y lo ocurrido', e ? puntos(e.medianaDif) + ' puntos' : SD]],
      serie: d.x.v ? { x: D.dias, y: d.x.v, y2: d.sv, nombres: ['Esperada para los 30 días siguientes (Deribit)', 'Realizada en los 30 días anteriores (Binance)'], fmt: (v) => nf(v, 0) + ' %', pie: 'Las dos series, día a día, con cierres hasta ayer.' } : null,
      regla: 'La esperada es el índice de volatilidad de Deribit (DVOL): se calcula con los precios de las opciones de ' + n + ' y dice, en % anual, cuánto movimiento descuenta ese mercado para los 30 días siguientes. La realizada es la desviación típica de los 30 últimos rendimientos diarios en Binance, por la raíz de 365. Para comparar lo esperado con lo ocurrido se empareja la esperada de un día con la realizada 30 días después.',
      limite: 'La esperada no es una previsión de esta web ni dice hacia dónde irá el precio: es lo que cuesta asegurarse en un solo mercado de opciones. Que lo esperado suela quedar por encima de lo ocurrido es habitual: quien vende ese seguro cobra por el riesgo. Los periodos de 30 días se pisan unos con otros, así que los días no son casos independientes.',
      fuentes: [{ t: 'Índice de volatilidad diario de ' + d.x.s + ' (Deribit)', u: d.x.url }].concat(d.viva ? [{ t: 'Lectura en vivo (Deribit)', u: d.viva.u }] : [], [{ t: 'Cierres diarios de ' + d.a.par + ' (Binance)', u: d.a.url }]) });
  }
  const urlEsp = (s) => 'https://www.deribit.com/api/v2/public/get_volatility_index_data?currency=' + s + '&start_timestamp=' + (Date.now() - 2 * 86400000) + '&end_timestamp=' + Date.now() + '&resolution=1D';
  async function leerEsperada() {
    const Q = filasEsp(); if (!Q.length) return; const m = new Map();
    try { for (const q of Q) { const u = urlEsp(q.x.s); const j = await traer(u); const d = j && j.result && j.result.data; const k = Array.isArray(d) && d.length ? d[d.length - 1] : null; const c = k ? Number(k[4]) : NaN; if (!(c > 0 && c < 1000)) throw new Error('respuesta sin dato'); if (Date.now() - k[0] > 86400000) throw new Error('la respuesta no trae el día en curso'); m.set(q.x.s, { v: c, u, hora: new Date().toISOString() }); } espViva = m; espError = null; } catch (e) { espViva = null; espError = e.message; }
    pintarVol();
  }
  const cajaVolK = el('div', { class: 'ob-kpis' }), cajaEsp = el('div');
  function pintarVol() {
    const F = filasVol(); const kV = (t, v, s, alPulsar) => el('button', { class: 'ob-k', onclick: alPulsar }, el('span', { class: 'k' }, t), el('span', { class: 'v' }, v), s ? el('span', { class: 's' }, s) : null);
    const agit = F.filter((f) => f.e === 'agitado' || f.e === 'extremo').length; const E = filasEsp().map(datosEsp);
    cajaVolK.replaceChildren(
      ...['BTC', 'ETH'].map((s) => F.find((f) => f.a.s === s)).filter(Boolean).map((f) => kV(f.a.n, f.e ? NOMBRE_ESTADO[f.e] : SD, v0(f.v30) + ' anual a 30 días' + (f.p == null ? '' : ' · percentil ' + nf(f.p, 0)), () => fichaVol(f))),
      kV('Activos agitados o en extremo', agit + ' de ' + F.length, 'mediana de la cesta: ' + v0(M.mediana(F.map((f) => f.v30))) + ' anual a 30 días', fichaCestaVol),
      ...E.filter((d) => d.ahora != null).map((d) => kV('Esperada de ' + (MONEDA[d.x.s] || d.x.s) + (d.viva ? ', ahora' : ', ayer'), va(d.ahora), d.dif == null ? '' : puntos(d.dif) + ' puntos frente a la realizada', () => fichaEsp(d))));
    const vivas = E.filter((d) => d.viva); const hora = vivas.length ? vivas[0].viva.hora : null;
    if (!E.length) { cajaEsp.replaceChildren(el('p', { class: 'ob-nota' }, 'La lectura diaria no trae la volatilidad esperada de Deribit. No se muestra nada en su lugar.')); return; }
    const fila = (d) => (d.ahora == null ? el('tr', null, el('td', null, d.x.s, el('span', { class: 'n2' }, d.a.n)), el('td', { colspan: '6', style: 'text-align:left;white-space:normal' }, 'La lectura de Deribit no llegó (' + (d.x.fallo || 'sin dato') + '). No se muestra nada en su lugar.'))
      : el('tr', { class: 'cl', onclick: () => fichaEsp(d) }, el('td', null, d.x.s, el('span', { class: 'n2' }, d.a.n)), el('td', null, nf(d.ahora, 1) + ' %' + (d.viva ? '' : ' (ayer)')), el('td', null, d.real == null ? SD : nf(d.real, 1) + ' %'), el('td', null, puntos(d.dif)), el('td', null, d.p == null ? SD : nf(d.p, 0)), el('td', null, d.e ? nf(d.e.ultimo.esperada, 1) + ' %' : SD), el('td', null, d.e ? nf(d.e.ultimo.ocurrida, 1) + ' %' : SD)));
    const b = E.find((d) => d.e);
    cajaEsp.replaceChildren(
      el('div', { class: 'ob-tw' }, el('table', { class: 'ob-t' }, el('thead', null, el('tr', null, ['Moneda', 'Esperada', 'Realizada 30 d', 'Diferencia (puntos)', 'Percentil de la esperada', 'Hace 30 días se esperaba', 'Lo que pasó'].map((t) => el('th', null, t)))), el('tbody', null, E.map(fila)))),
      el('p', { class: 'ob-nota' }, 'Esperada: lo que descuentan las opciones para los 30 días siguientes (índice de volatilidad de Deribit), ' + (hora ? 'leída de Deribit el ' + fh(hora) + ' y releída cada cinco minutos' : 'al cierre de ayer; la lectura en vivo no llegó' + (espError ? ' (' + espError + ')' : '')) + '. Realizada: lo que se ha movido de verdad en los últimos 30 días, con cierres de Binance hasta ayer. Las dos en % anual.' + (b ? ' En ' + nf(b.e.mas / b.e.n * 100, 0) + ' de cada 100 días de esta serie, el mercado esperó para ' + (MONEDA[b.x.s] || b.x.s) + ' más movimiento del que luego hubo.' : '') + ' Pulsa una fila para ver las dos series.'));
  }
  function volatilidad() {
    const F = filasVol(); const cuenta = {}; for (const f of F) if (f.e) cuenta[f.e] = (cuenta[f.e] || 0) + 1; pintarVol();
    const fila = (f) => el('tr', { class: 'cl', onclick: () => fichaVol(f) }, el('td', null, f.a.s, el('span', { class: 'n2' }, f.a.n)), el('td', null, v0(f.v7)), el('td', null, v0(f.v30)), el('td', null, v0(f.v90)), el('td', null, f.p == null ? SD : nf(f.p, 0)), el('td', null, f.e ? el('span', { class: 'ob-chip ' + f.e }, f.e) : SD), el('td', { class: signo(f.m1 && f.m1.caida) }, f.m1 ? pct(f.m1.caida, 0) : SD), el('td', { class: signo(f.m2 && f.m2.caida) }, f.m2 ? pct(f.m2.caida, 0) : SD));
    return el('section', { class: 'zp', id: 'volatilidad' }, el('p', { class: 'kick' }, 'Contexto'), el('h2', null, 'Volatilidad: ¿está el mercado tranquilo o agitado?'), el('p', { class: 'ob-sub' }, 'Cuánto se mueve cada activo comparado con su propia historia, y cuánto movimiento espera el mercado para bitcoin y ether. Hoy: ' + ESTADOS.map((e) => (cuenta[e] || 0) + ' en ' + e).join(', ') + '.'),
      cajaVolK,
      el('h3', { class: 'ob-h3' }, 'Bitcoin y ether: lo que el mercado espera frente a lo que ha pasado'), cajaEsp,
      el('h3', { class: 'ob-h3' }, 'Activo por activo'),
      el('div', { class: 'ob-tw' }, el('table', { class: 'ob-t' }, el('thead', null, el('tr', null, el('th', { rowspan: '2' }, 'Activo'), el('th', { colspan: '3', class: 'g' }, 'Volatilidad anual'), el('th', { rowspan: '2' }, 'Percentil'), el('th', { rowspan: '2' }, 'Estado'), el('th', { colspan: '2', class: 'g' }, 'Desde su máximo')), el('tr', { class: 'sub' }, ['7 días', '30 días', '90 días', 'de 1 año', 'de 2 años'].map((t) => el('th', null, t)))), el('tbody', null, F.map(fila)))),
      el('p', { class: 'ob-nota' }, 'Volatilidad en % anual, con cierres hasta ayer. El percentil y el estado salen de la volatilidad a 30 días. Regla fija del estado: calma por debajo del percentil 25, normal entre 25 y 75, agitado entre 75 y 95, extremo a partir de 95. «Desde su máximo» es cuánto está el último cierre por debajo del más alto del periodo; quien lleva menos de dos años cotizando se compara con toda su serie. Pulsa una fila para ver sus datos.'));
  }

  /* ---------- 4 · desacoples ---------- */
  const UMBRAL = 0.2;
  function filasCorr() { const btc = D.activos[0].c; return D.activos.slice(1).map((a) => { const c30 = M.corr(a.c, btc, 30), prev = M.corr(a.c, btc, 30, 30), c90 = M.corr(a.c, btc, 90), b = M.beta(a.c, btc, 90); const d = c30 != null && prev != null ? c30 - prev : null; return { a, c30, prev, c90, b, d, e: d == null ? null : d <= -UMBRAL ? 'desacopla' : d >= UMBRAL ? 'acopla' : null }; }).sort((x, y) => (x.d == null ? 9 : x.d) - (y.d == null ? 9 : y.d)); }
  function desacoples() {
    const btc = D.activos[0]; const F = filasCorr(); const f2 = (x) => sg(x, 2);
    const serieCorr = (a) => { const y = []; for (let k = 330; k >= 0; k--) y.push(M.corr(a.c, btc.c, 30, k)); return y; };
    const ficha = (f) => abrir({ t: f.a.n + ' frente a bitcoin', sub: 'Con cierres diarios de Binance hasta ayer', cifras: [['Correlación, últimos 30 días', f2(f.c30)], ['Correlación, los 30 días anteriores', f2(f.prev)], ['Cambio', f.d == null ? SD : (f.d >= 0 ? '+' : '−') + nf(Math.abs(f.d), 2)], ['Correlación a 90 días', f2(f.c90)], ['Sensibilidad a bitcoin (90 días)', f.b == null ? SD : 'cuando bitcoin se mueve un 1 %, se mueve un ' + sg(f.b, 2) + ' %']], serie: { x: D.dias.slice(-331), y: serieCorr(f.a), fmt: (v) => sg(v, 2), pie: 'Correlación a 30 días con bitcoin, día a día, en el último año.' }, regla: 'Correlación de Pearson entre los rendimientos diarios del activo y los de bitcoin, en los últimos 30 días en que ambos tienen dato: 1 es moverse igual, 0 es no tener relación, −1 es moverse al revés. «Se desacopla» cuando esa correlación ha caído ' + nf(UMBRAL, 2) + ' o más respecto a los 30 días anteriores; «se acopla» cuando ha subido otro tanto.', limite: 'Correlación no es causa, y con 30 días cambia mucho de una semana a otra. Dice que se mueven menos juntos, no que el activo vaya mejor ni peor.', fuentes: [{ t: 'Cierres diarios de ' + f.a.par + ' (Binance)', u: f.a.url }, { t: 'Cierres diarios de ' + btc.par + ' (Binance)', u: btc.url }] });
    const fila = (f) => el('tr', { class: 'cl', onclick: () => ficha(f) }, el('td', null, f.a.s, el('span', { class: 'n2' }, f.a.n)), el('td', null, f2(f.c30)), el('td', null, f2(f.prev)), el('td', { class: signo(f.d) }, f.d == null ? SD : (f.d >= 0 ? '+' : '−') + nf(Math.abs(f.d), 2)), el('td', null, f.e ? el('span', { class: 'ob-chip ' + f.e }, f.e === 'desacopla' ? 'se desacopla' : 'se acopla') : ''), el('td', null, f2(f.c90)), el('td', null, f2(f.b)));
    return el('section', { class: 'zp', id: 'desacoples' }, el('p', { class: 'kick' }, 'Pregunta 4'), el('h2', null, '¿Qué activos se están desacoplando?'), el('p', { class: 'ob-sub' }, 'Cuánto se mueve cada activo al compás de bitcoin estos 30 días, comparado con los 30 anteriores. Arriba, los que más se han separado.'),
      el('div', { class: 'ob-tw' }, el('table', { class: 'ob-t' }, el('thead', null, el('tr', null, ['Activo', 'Con BTC, 30 d', '30 d anteriores', 'Cambio', '', 'Con BTC, 90 d', 'Sensibilidad'].map((t) => el('th', null, t)))), el('tbody', null, F.map(fila)))),
      el('p', { class: 'ob-nota' }, 'Regla fija: «se desacopla» si la correlación a 30 días ha caído ' + nf(UMBRAL, 2) + ' o más; «se acopla» si ha subido otro tanto. Con cierres hasta ayer.'));
  }

  /* ---------- gráficos de conjunto: el gráfico va primero; cada marca abre sus datos completos y la tabla queda plegada debajo ---------- */
  const plegada = (tabla) => el('details', { class: 'ob-datos' }, el('summary', null, 'Ver la tabla de datos'), el('div', { class: 'ob-tw' }, tabla));
  const selector = (ops, actual, alElegir) => el('div', { class: 'ob-per' }, ops.map(([k, t]) => el('button', { class: k === actual ? 'on' : '', onclick: () => alElegir(k) }, t)));
  const leyenda = (pares) => el('div', { class: 'ob-ley' }, pares.map(([color, t]) => el('span', null, el('i', { style: 'background:' + color }), t)));
  // barras desde un eje: a la derecha lo que sube y a la izquierda lo que baja. filas: [{ t, sub, v, txt, abre }]; v null = sin dato (se dice, sin barra)
  function barras(filas, pie) {
    const con = filas.filter((f) => f.v != null && isFinite(f.v)); const neg = Math.max(0, ...con.map((f) => -f.v)), pos = Math.max(0, ...con.map((f) => f.v)); const tot = neg + pos || 1; const eje = neg / tot * 100;
    return el('div', null, el('div', { class: 'ob-bars' }, filas.map((f) => { const hay = f.v != null && isFinite(f.v); const w = hay ? Math.abs(f.v) / tot * 100 : 0;
      return el('button', { class: 'ob-br', title: f.t + ': ' + f.txt + '. Pulsa para ver sus datos.', onclick: f.abre }, el('span', { class: 'et' }, f.t, f.sub ? el('span', { class: 'n2' }, f.sub) : null), el('span', { class: 'pista' }, el('i', { class: 'eje', style: 'left:' + eje.toFixed(2) + '%' }), hay ? el('i', { class: 'b ' + (f.v >= 0 ? 'sube' : 'baja'), style: 'left:' + (f.v >= 0 ? eje : eje - w).toFixed(2) + '%;width:' + Math.max(w, 0.4).toFixed(2) + '%' }) : null), el('span', { class: 'va' + (hay ? '' : ' sd') }, f.txt)); })), pie ? el('p', { class: 'ob-nota' }, pie) : null);
  }
  // cadenas: cuánto ha cambiado lo que hay en cada una, en dólares o en porcentaje, en el plazo elegido
  let perRed = 30, uniRed = 'usd'; const cajaRedSt = el('div'), cajaRedTvl = el('div'); const PLAZOS_RED = [[7, '7 días'], [30, '30 días'], [90, '90 días'], [365, '1 año']];
  function pintarRedes() {
    const tp = PLAZOS_RED.find((p) => p[0] === perRed)[1];
    for (const [k, caja, que] of [['st', cajaRedSt, 'las stablecoins de'], ['tvl', cajaRedTvl, 'el dinero depositado en']]) {
      const F = D.redes.filas.filter((r) => r[k]).map((r) => { const a = M.atras(r[k], perRed), c = M.cambio(r[k], perRed); const dif = a ? (a.hoy - a.antes) * 1e6 : null;
        return { t: r.nombre, sub: mUsd(r[k][M.ultimo(r[k])] * 1e6), v: c == null ? null : uniRed === 'usd' ? dif : c, txt: c == null ? SD : uniRed === 'usd' ? (dif >= 0 ? '+' : '−') + mUsd(Math.abs(dif)) : pct(c), abre: () => fichaRed(r, k) }; }).sort((x, y) => (y.v == null ? -Infinity : y.v) - (x.v == null ? -Infinity : x.v));
      caja.replaceChildren(el('div', { class: 'ob-sels' }, selector(PLAZOS_RED, perRed, (q) => { perRed = q; pintarRedes(); }), selector([['usd', 'En dólares'], ['pct', 'En porcentaje']], uniRed, (q) => { uniRed = q; pintarRedes(); })),
        barras(F, 'Cuánto ha cambiado ' + que + ' cada cadena en ' + tp + ', ' + (uniRed === 'usd' ? 'en dólares' : 'en porcentaje') + '. De la que más gana a la que más pierde; junto al nombre, lo que hay hoy. Pulsa una barra para ver su serie y de dónde sale.'));
    }
  }
  // sectores de la cesta: rendimiento de cada sector en el plazo elegido
  let perSec = '30'; const cajaSecCesta = el('div');
  function pintarGraficoSectores() {
    const O = ordenSector(gruposSector(), perSec); const tp = PERIODOS.find((p) => p[0] === perSec)[1];
    cajaSecCesta.replaceChildren(selector(PERIODOS.map((p) => [p[0], p[1]]), perSec, (q) => { perSec = q; pintarGraficoSectores(); }),
      barras(O.map(({ g, r }) => ({ t: g.x.nombre, sub: g.x.fallo ? 'lectura fallida' : g.ms.length + (g.ms.length === 1 ? ' activo' : ' activos'), v: r ? r.mediana : null, txt: r ? pct(r.mediana, 1) : perSec === '24h' && !vivo ? 'sin lectura en vivo' : 'sin cifra', abre: () => fichaSector(g, perSec) })),
        'Rendimiento de cada sector en ' + tp + ': la mediana de lo que han subido o bajado sus activos de la cesta. Del que mejor va al que peor. Pulsa una barra para ver sus activos y de dónde sale.'));
  }
  // liquidez: lo que espera para comprar (a la izquierda) frente a lo que espera para vender (a la derecha), en dólares
  const cajaLiq = el('div');
  function pintarGraficoLiq() {
    const F = ((D.liquidez && D.liquidez.filas) || []).filter((x) => !x.fallo && x.compras != null); if (!F.length) { cajaLiq.replaceChildren(); return; }
    const mx = Math.max(...F.map((x) => Math.max(x.compras, x.ventas))) || 1; const w = (v) => (v / mx * 50).toFixed(2);
    cajaLiq.replaceChildren(leyenda([['var(--ok)', 'Esperando para comprar, hasta un 1 % por debajo del precio'], ['var(--bad)', 'Esperando para vender, hasta un 1 % por encima']]),
      el('div', { class: 'ob-bars' }, F.map((x) => el('button', { class: 'ob-br mar', title: x.s + ': ' + mUsd(x.compras) + ' para comprar y ' + mUsd(x.ventas) + ' para vender. Pulsa para ver sus datos.', onclick: () => fichaLibro(x) }, el('span', { class: 'et' }, x.s, el('span', { class: 'n2' }, x.enVivo ? 'ahora' : 'foto diaria')), el('span', { class: 'va' }, (x.completo ? '' : '≥ ') + mUsd(x.compras)),
        el('span', { class: 'pista' }, el('i', { class: 'eje', style: 'left:50%' }), el('i', { class: 'b izq', style: 'left:' + (50 - Number(w(x.compras))).toFixed(2) + '%;width:' + w(x.compras) + '%' }), el('i', { class: 'b der', style: 'left:50%;width:' + w(x.ventas) + '%' })), el('span', { class: 'va izda' }, (x.completo ? '' : '≥ ') + mUsd(x.ventas))))),
      el('p', { class: 'ob-nota' }, 'Dinero esperando en el libro de órdenes de Binance a menos de un 1 % del precio. Pulsa una fila para ver sus datos. Para releer un libro en el momento, abre la tabla de datos y pulsa «Leer ahora».'));
  }

  /* ---------- las cuatro preguntas, arriba ---------- */
  const cajaPreg = el('div', { class: 'ob-preg' });
  function pintarPreguntas() {
    const G = D.global, S = D.stables; const pSt = S.totalUsd / G.capTotalUsd * 100; const y = S.serie.map((x) => x[1]); const c30 = y.length > 30 ? y[y.length - 1] / y[y.length - 31] - 1 : null;
    const L = sectoresUtiles(); const sb = L.filter((s) => s.cambio24hPct >= 0).length;
    const F = filasCorr(); const des = F.filter((f) => f.e === 'desacopla'); const conDato = F.filter((f) => f.d != null).length;
    const p = (id, q, r) => el('a', { class: 'ob-p', href: '#' + id }, el('p', { class: 'q' }, q), el('p', { class: 'r' }, r), el('span', { class: 'mas' }, 'Ver el detalle ↓'));
    cajaPreg.replaceChildren(
      p('capital', '1 · ¿Dónde está el capital?', ['De cada 100 $ del mercado, ', el('b', null, nf(G.dominanciaPct.btc, 0)), ' están en bitcoin, ', el('b', null, nf(G.dominanciaPct.eth, 0)), ' en ether, ', el('b', null, nf(pSt, 0)), ' en stablecoins y ', el('b', null, nf(100 - G.dominanciaPct.btc - G.dominanciaPct.eth - pSt, 0)), ' en todo lo demás.']),
      p('liquidez', '2 · ¿Dónde aumenta la liquidez?', [c30 == null ? '' : ['Las stablecoins en circulación han ', c30 >= 0 ? 'subido' : 'bajado', ' un ', el('b', null, nf(Math.abs(c30 * 100), 1) + ' %'), ' en 30 días. '], fraseLiquidez()]),
      p('sectores', '3 · ¿Qué sectores ganan actividad?', fraseSectores(L, sb)),
      p('desacoples', '4 · ¿Qué activos se están desacoplando?', [el('b', null, String(des.length)), ' de ', String(conDato), ' activos se mueven estos 30 días menos pegados a bitcoin que los 30 anteriores', des.length ? [': ', des.slice(0, 5).map((f) => f.a.s).join(', '), des.length > 5 ? ' y ' + (des.length - 5) + ' más' : '', '.'] : '.']));
  }

  /* ---------- lectura en vivo del precio ---------- */
  const estado = el('div', { class: 'ob-estado' });
  const urlVivo = (pares) => 'https://data-api.binance.vision/api/v3/ticker/24hr?type=MINI&symbols=' + encodeURIComponent(JSON.stringify(pares));
  function pintarEstado() { const edad = (Date.now() - Date.parse(D.leidoEn)) / 3600000; estado.replaceChildren(el('span', null, el('b', null, 'Datos diarios: '), fh(D.leidoEn), edad > 36 ? ' · ¡tienen más de un día y medio!' : ''), el('span', null, el('i', { class: 'ob-vivo' + (vivo ? '' : ' mal') }), el('b', null, 'Precio en vivo: '), vivo ? 'Binance, leído el ' + fh(vivo.hora) + ' (se relee cada minuto)' : 'no se pudo leer ahora' + (vivoError ? ' (' + vivoError + ')' : '') + '; se usan los cierres de ayer'), el('span', null, el('b', null, 'Cesta: '), D.activos.length + ' activos')); }
  let pausaVivo = 0; // si Binance pide esperar (418 o 429) no se insiste durante diez minutos: insistir alarga el bloqueo
  async function leerVivo() { if (Date.now() < pausaVivo) return; try { const j = await traer(urlVivo(D.activos.map((a) => a.par))); const m = new Map(); for (const t of j) { const u = Number(t.lastPrice), o = Number(t.openPrice); if (u > 0) m.set(t.symbol, { ultimo: u, apertura: o }); } if (m.size < D.activos.length * 0.8) throw new Error('respuesta incompleta'); m.hora = new Date().toISOString(); vivo = m; vivoError = null; } catch (e) { vivoError = e.message; if (/HTTP (418|429)/.test(e.message)) { pausaVivo = Date.now() + 600000; vivoError = 'Binance pide esperar; se volverá a intentar en diez minutos'; } } pintarEstado(); pintarCalor(); pintarTablaSectores(); pintarPreguntas(); }

  /* ---------- montaje ---------- */
  function limites() { return el('section', { class: 'zp', id: 'limites' }, el('p', { class: 'kick' }, 'Antes de leer nada'), el('h2', null, 'Qué es esto y qué no'), el('ul', { class: 'ob-reglas' }, [
    ['Es contexto, no consejo. ', 'Aquí no hay señales de compra ni de venta, ni previsiones.'],
    ['La cesta son los mayores de hoy. ', D.metodo.cesta],
    ['Un solo mercado para los precios. ', 'Los precios y los libros de órdenes son de Binance. ' + D.metodo.series],
    ['Los sectores son una etiqueta de terceros. ', D.metodo.sectores],
    ['Lo que no hay gratis se dice. ', 'No existe histórico gratuito de la dominancia ni de la profundidad de los libros: el observatorio guarda su propia lectura, una al día' + (filasSerie().length ? ' (' + filasSerie().length + ' hasta hoy, desde el ' + fd(filasSerie()[0].dia) + ').' : '.')],
    ['Las cifras las hace un programa. ', 'Sin IA. Los cálculos tienen pruebas y se contrastan con una segunda herramienta independiente sobre los mismos datos.'],
  ].map(([b, t]) => el('li', null, el('b', null, b), t))), el('details', { style: 'margin-top:10px' }, el('summary', { class: 'ob-nota', style: 'cursor:pointer' }, 'Activos que no entran en la cesta y por qué (' + D.excluidos.length + ')'), el('div', { class: 'ob-tw' }, el('table', { class: 'ob-t' }, el('tbody', null, D.excluidos.map((e) => el('tr', null, el('td', null, e.s, el('span', { class: 'n2' }, e.n || '')), el('td', { style: 'text-align:left;white-space:normal' }, e.motivo)))))))); }
  // la serie propia es un añadido: si no se puede leer, la página sigue y lo dice en su sitio
  const leeSerie = fetch('data/mercado-serie.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((j) => (j && j.version === 1 && Array.isArray(j.filas) ? j : null)).catch(() => null);
  fetch('data/mercado.json', { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then((j) => leeSerie.then((q) => { SP = q; return j; })).then((j) => {
    if (!j || j.version !== 2 || !j.redes || !Array.isArray(j.redes.filas) || !Array.isArray(j.activos) || j.activos.length < 10 || !j.global || !j.stables) throw new Error('formato inesperado');
    D = j; pintarEstado(); pintarPreguntas(); pintarCalor();
    raiz.replaceChildren(estado, cajaPreg, capital(), calor(), liquidez(), sectores(), volatilidad(), desacoples(), limites());
    leerVivo(); setInterval(() => { if (!document.hidden) leerVivo(); }, 60000);
    leerEsperada(); setInterval(() => { if (!document.hidden) leerEsperada(); }, 300000);
  }).catch((e) => { raiz.replaceChildren(el('div', { class: 'ob-aviso' }, el('b', null, 'No se pudieron leer los datos del observatorio. '), 'Motivo: ' + e.message + '. No se muestra nada en su lugar.')); });
})();
