/* Laboratorio de fundamentales (fundamentales.html).
   Escribes un token y el cuadro de mando se monta en vivo desde tu navegador con fuentes públicas, sin IA y sin guardar nada:
   CoinGecko (precio, capitalización, oferta), DefiLlama (comisiones, ingresos, valor para el token, TVL, stablecoins, DEX, con su texto de método),
   Coin Metrics comunidad (direcciones activas, transacciones, emisión, oferta, titulares), TronScan/TronGrid (TRX), ultrasound.money (ETH), GitHub (desarrollo).
   El único fichero diario es data/fundamentales-indice.json (qué cadena y protocolos de DefiLlama corresponden a cada token, cobertura de Coin Metrics
   y los cambios de método o cobertura detectados). Cada cifra, fila, punto del gráfico y trozo de la tarta se pulsa y lleva a su serie y a la respuesta
   en bruto de la fuente. Lo que no hay gratis se dice. Sin nota ni recomendaciones. */
(function () {
  const { el, n, m } = C;
  const raiz = document.getElementById('ficha'); if (!raiz) return;
  const DIA = 86400000, HOY0 = () => Math.floor(Date.now() / DIA) * DIA;
  const fh = (t) => new Date(t).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const fd = (t) => new Date(t).toISOString().slice(0, 10);
  const MES3 = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const fechaLarga = (d) => { const t = typeof d === 'string' ? d : fd(d); return Number(t.slice(8, 10)) + ' ' + MES3[Number(t.slice(5, 7)) - 1] + ' ' + t.slice(0, 4); };
  // formato para la ventanita de un minigráfico: se deduce del texto que ya muestra la celda (dinero, símbolo del token o número)
  const fmtDesde = (txt) => { const t = String(txt == null ? '' : txt).trim(); if (/%$/.test(t)) return (v) => (Math.abs(v) >= 1e4 ? nt(v) : n(v, Math.abs(v) >= 100 ? 0 : 2)); if (/\$/.test(t)) return (v) => (Math.abs(v) < 100 ? usd(v) : m(v)); const u = t.match(/\s([A-Z]{2,6})$/); if (u) return (v) => nt(v, u[1]); return (v) => (Math.abs(v) >= 1e4 ? nt(v) : Math.abs(v) >= 100 ? n(v, 0) : Math.abs(v) >= 1 ? n(v, 2) : n(v, 4)); };
  const usd = (x) => (x == null || isNaN(x) ? '—' : (Math.abs(x) >= 100 ? n(x, 0) : Math.abs(x) >= 1 ? n(x, 2) : Math.abs(x) >= 0.01 ? n(x, 4) : n(x, 6)) + ' $');
  const pct = (x, d = 1) => (x == null || isNaN(x) ? '—' : (x > 0 ? '+' : x < 0 ? '−' : '') + n(Math.abs(x) * 100, d) + ' %');
  const pctA = (x, d) => pct(x, d == null ? (Math.abs(x) < 0.01 ? 2 : 1) : d);
  const pctAbs = (x, d = 1) => (x == null || isNaN(x) ? '—' : n(x, d) + ' %');
  const nt = (x, s) => (x == null || isNaN(x) ? '—' : (Math.abs(x) >= 1e8 ? n(x / 1e6, 0) + ' M' : Math.abs(x) >= 1e6 ? n(x / 1e6, 1) + ' M' : Math.abs(x) >= 1e4 ? n(x / 1e3, 0) + ' k' : n(x, 0)) + (s ? ' ' + s : ''));
  const ext = (href, texto) => el('a', { class: 'lnk', href, target: '_blank', rel: 'noopener', title: 'Se abre en otra pestaña (datos en bruto)' }, texto);
  const quizas = (p) => p.then((v) => ({ ok: true, v }), (e) => ({ ok: false, e }));
  const traer = (u, ms = 20000) => fetch(u, { cache: 'no-cache', signal: AbortSignal.timeout(ms) }).then((r) => { if (!r.ok) { console.warn('fundamentales: ' + r.status + ' en ' + u); const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; } return r.json(); });
  // 400/404 de DefiLlama = «esta cadena no tiene ese dato» (p. ej. stablecoins en Bitcoin), no un fallo de la fuente
  const noExiste = (r) => !!(r && !r.ok && r.e && (r.e.status === 400 || r.e.status === 404));
  const dormir = (ms) => new Promise((s) => setTimeout(s, ms));
  const estado = document.getElementById('fb-estado');
  const avisar = (t) => { if (estado) estado.textContent = t || ''; };

  /* ---- CoinGecko: una llamada a la vez con pausa; si responde 429 se espera y se reintenta una vez (límite por visitante) ---- */
  let colaCG = Promise.resolve(), ultimaCG = 0;
  const cg = (ruta) => (colaCG = colaCG.catch(() => {}).then(async () => {
    const espera = 1300 - (Date.now() - ultimaCG); if (espera > 0) await dormir(espera);
    const u = 'https://api.coingecko.com/api/v3/' + ruta;
    for (let i = 0; ; i++) {
      ultimaCG = Date.now();
      let r;
      // cuando CoinGecko limita, su respuesta 429 llega sin cabecera CORS y el navegador la ve como «Failed to fetch»: se trata igual que un 429
      try { r = await fetch(u, { signal: AbortSignal.timeout(20000) }); } catch (e) { if (i === 0 && e.name !== 'TimeoutError') { avisar('CoinGecko no responde o ha pedido esperar (límite por visitante). Se reintenta en 25 segundos…'); await dormir(25000); continue; } avisar(''); throw new Error('CoinGecko no responde (' + (e.name === 'TimeoutError' ? 'tiempo agotado' : 'límite por visitante o red') + ')'); }
      if (r.status === 429 && i === 0) { avisar('CoinGecko ha pedido esperar (límite por visitante). Se reintenta en 25 segundos…'); await dormir(25000); continue; }
      if (!r.ok) { avisar(''); throw new Error('HTTP ' + r.status + ' (CoinGecko)'); }
      avisar(''); return r.json();
    }
  }));
  /* ---- Coin Metrics: una métrica por llamada (si se piden varias y una no existe, falla todo) ---- */
  let colaCM = Promise.resolve();
  const cm = (asset, metrica) => (colaCM = colaCM.catch(() => {}).then(async () => {
    await dormir(650);                            // la cuota de la comunidad es de unas 10 lecturas cada 6 segundos por visitante
    const desde = fd(Date.now() - 760 * DIA);   // dos años: la variación a 365 días necesita el año anterior entero
    const u = 'https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=' + asset + '&metrics=' + metrica + '&frequency=1d&start_time=' + desde + '&page_size=1000';
    let r = await fetch(u, { signal: AbortSignal.timeout(20000) });
    if (r.status === 429) { await dormir(6500); r = await fetch(u, { signal: AbortSignal.timeout(20000) }); }
    if (!r.ok) throw new Error('HTTP ' + r.status + ' (Coin Metrics)');
    const d = await r.json();
    return { url: u, serie: (d.data || []).map((x) => [Date.parse(x.time), Number(x[metrica])]).filter((x) => isFinite(x[1])) };
  }));

  /* ---- series: [[ms, valor]…] ordenadas; flujos (comisiones, operaciones) y saldos (capitalización, TVL, oferta) se comparan distinto ---- */
  const deLlama = (chart) => (chart || []).map((x) => [Number(x[0]) * (Number(x[0]) < 1e12 ? 1000 : 1), Number(x[1])]).filter((x) => isFinite(x[1])).sort((a, b) => a[0] - b[0]);
  const completos = (s) => s.filter((x) => x[0] < HOY0());                         // sin el día de hoy, que está a medias
  const ultimo = (s) => (s && s.length ? s[s.length - 1] : null);
  const suma = (s, desde, hasta) => s.filter((x) => x[0] >= desde && x[0] < hasta).reduce((a, x) => a + x[1], 0);
  const cuenta = (s, desde, hasta) => s.filter((x) => x[0] >= desde && x[0] < hasta).length;
  const enFecha = (s, t) => { let mejor = null; for (const x of s) { if (!mejor || Math.abs(x[0] - t) < Math.abs(mejor[0] - t)) mejor = x; } return mejor && Math.abs(mejor[0] - t) <= 4 * DIA ? mejor : null; };
  const desde = (s, dias) => s.filter((x) => x[0] >= Date.now() - dias * DIA);
  // suma móvil de d días (solo días completos; exige al menos el 80 % de los días en la ventana)
  function acumulado(serie, d) { const s = completos(serie || []), out = [], q = []; let suma = 0; for (const x of s) { q.push(x); suma += x[1]; while (q.length && q[0][0] <= x[0] - d * DIA) suma -= q.shift()[1]; if (q.length >= d * 0.8) out.push([x[0], suma]); } return out; }
  const porDia = (s) => { const mp = new Map(); for (const x of s) mp.set(fd(x[0]), x[1]); return mp; };
  // cociente día a día de dos series alineadas por fecha; devuelve [t, a/b, a, b]
  function cociente(A, B) { const mb = porDia(B), out = []; for (const [t, a] of A) { const b = mb.get(fd(t)); if (b != null && b > 0) out.push([t, a / b, a, b]); } return out; }
  // marcas verticales en los gráficos en las fechas en que la fuente cambió de método o de cobertura (del índice diario)
  const marcasPlugin = (fechas) => ({ id: 'marcas', afterDatasetsDraw(chart) { const x = chart.scales.x, y = chart.scales.y; if (!x || !y || !fechas.length) return; const ctx = chart.ctx; ctx.save(); ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.strokeStyle = C.css('--warn') || '#f6cd4d'; ctx.fillStyle = ctx.strokeStyle; ctx.font = '10px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif'); for (const f of fechas) { const i = chart.data.labels.indexOf(f); if (i < 0) continue; const px = x.getPixelForValue(i); ctx.beginPath(); ctx.moveTo(px, y.top); ctx.lineTo(px, y.bottom); ctx.stroke(); ctx.fillText('cambio de método', px + 3, y.top + 10); } ctx.restore(); } });
  // línea guía vertical mientras la ventanita está abierta (ratón o dedo)
  const cruzPlugin = { id: 'cruz', afterDraw(chart) { const t = chart.tooltip; if (!t || !t.opacity) return; const act = t.getActiveElements(); const y = chart.scales.y; if (!act.length || !y) return; const ctx = chart.ctx; ctx.save(); ctx.globalAlpha = t.opacity; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.strokeStyle = C.css('--mut') || '#8b9ab4'; ctx.beginPath(); ctx.moveTo(act[0].element.x, y.top); ctx.lineTo(act[0].element.x, y.bottom); ctx.stroke(); ctx.restore(); } };
  // ventanita de los gráficos de líneas: el día en letras, una fila por serie, y responde al dedo igual que al ratón
  const tipLineas = (label) => ({ mode: 'index', intersect: false, animation: false, usePointStyle: true, boxPadding: 4, callbacks: { title: (it) => (it.length && it[0].label ? fechaLarga(it[0].label) : ''), label } });
  const puntoHover = { pointHoverRadius: 4.5, pointHoverBorderWidth: 2, pointHoverBackgroundColor: '#fff' };
  const fechasCambio = (F) => [...new Set((F.cambios || []).map((c) => c.fecha))];
  const PLAZOS = [7, 30, 90, 365];
  function variacion(serie, tipo, d) {
    if (!serie || serie.length < 2) return null;
    if (tipo === 'flujo') {
      const s = completos(serie), fin = HOY0(), a = suma(s, fin - d * DIA, fin), b = suma(s, fin - 2 * d * DIA, fin - d * DIA);
      if (cuenta(s, fin - 2 * d * DIA, fin - d * DIA) < d * 0.8) return null;
      if (!(b > 0)) { if (a === 0) return { v: 0, a, b, de: fin - d * DIA, hasta: fin }; return null; }   // de cero a cero: sin cambio; de cero a algo: no hay base
      return { v: a / b - 1, a, b, de: fin - d * DIA, hasta: fin };
    }
    const u = ultimo(serie), p = enFecha(serie, u[0] - d * DIA);
    if (!p || !(p[1] > 0)) return null;
    return { v: u[1] / p[1] - 1, a: u[1], b: p[1], de: p[0], hasta: u[0] };
  }
  const tend = (v) => (v == null ? 'nd' : v > 0.05 ? 'up' : v < -0.05 ? 'dn' : '');
  const flecha = (v) => (v == null ? '' : v > 0.05 ? '▲ ' : v < -0.05 ? '▼ ' : '→ ');
  const varTxt = (v) => (v == null ? el('span', { class: 'nd' }, 'sin dato') : el('span', { class: tend(v) }, flecha(v) + pctA(v)));
  function chips(serie, tipo, abrir, soloPlazos) {
    const w = el('div', { class: 'kt' });
    for (const d of soloPlazos || PLAZOS) {
      const r = variacion(serie, tipo, d);
      const t = tipo === 'flujo' ? 'Últimos ' + d + ' días frente a los ' + d + ' anteriores' : 'Hoy frente a hace ' + d + ' días';
      w.append(el('span', { class: 'tv ' + tend(r && r.v), title: t + (r ? '' : ' · sin datos suficientes'), onclick: abrir ? (e) => { e.stopPropagation(); abrir(); } : null, style: abrir ? 'cursor:pointer' : null }, d + ' d ' + (r ? flecha(r.v) + pctA(r.v) : 'sin dato')));
    }
    return w;
  }
  /* minigráfico de tendencia (90 días) dibujado a mano: sin librería, rápido y en el color de la variación */
  function spark(serie, color, dias = 90, o = {}) {
    const cv = el('canvas', { width: 220, height: 56, 'aria-hidden': 'true' });
    const s = serie ? desde(serie, dias) : [];
    if (s.length < 3) return null;
    const ctx = cv.getContext('2d'); const vs = s.map((x) => x[1]); let lo = Math.min(...vs), hi = Math.max(...vs); if (hi === lo) { hi += 1; lo -= 1; }
    const X = (i) => 4 + (i / (s.length - 1)) * 212, Y = (v) => 50 - ((v - lo) / (hi - lo)) * 44;
    const col = color || C.css('--acc') || '#8bb4ee', fmt = o.fmt || fmtDesde(o.muestra);
    const pintar = (sel) => {
      ctx.clearRect(0, 0, 220, 56); ctx.setLineDash([]);
      ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.strokeStyle = col;
      ctx.beginPath(); s.forEach((x, i) => (i ? ctx.lineTo(X(i), Y(x[1])) : ctx.moveTo(X(i), Y(x[1])))); ctx.stroke();
      const g = ctx.createLinearGradient(0, 0, 0, 56); g.addColorStop(0, col + '55'); g.addColorStop(1, col + '00');
      ctx.lineTo(X(s.length - 1), 56); ctx.lineTo(X(0), 56); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      if (sel == null) return;
      ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(sel), 2); ctx.lineTo(X(sel), 54); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(X(sel), Y(s[sel][1]), 4.5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
    };
    pintar(null);
    const punto = (ev) => (ev.touches && ev.touches[0]) || ev;
    const indice = (ev) => { const r = cv.getBoundingClientRect(); const x = (punto(ev).clientX - r.left) / Math.max(1, r.width) * 220; return Math.max(0, Math.min(s.length - 1, Math.round((x - 4) / 212 * (s.length - 1)))); };
    const mostrar = (ev) => { const i = indice(ev); pintar(i); C.tip('<b>' + fechaLarga(s[i][0]) + '</b><br>' + (o.nombre ? o.nombre + ': ' : '') + fmt(s[i][1]), punto(ev)); };
    const quitar = () => { pintar(null); C.tip(null); };
    cv.addEventListener('mousemove', mostrar); cv.addEventListener('mouseleave', quitar);
    cv.addEventListener('touchstart', mostrar, { passive: true }); cv.addEventListener('touchmove', mostrar, { passive: true }); cv.addEventListener('touchend', quitar); cv.addEventListener('touchcancel', quitar);
    return cv;
  }
  const colorTend = (v) => (v == null ? (C.css('--mut') || '#8b9ab4') : v > 0.05 ? (C.css('--ok') || '#a9d884') : v < -0.05 ? (C.css('--bad') || '#ff6b83') : (C.css('--acc') || '#8bb4ee'));

  /* ---- etiquetas de dinero (nunca se suman entre sí) ---- */
  const ETQ = {
    fees: ['etq-fees', 'Comisiones de usuarios', 'lo que pagan quienes usan la red o la aplicación (Fees en DefiLlama)'],
    rev: ['etq-rev', 'Ingresos del protocolo', 'lo que se queda el protocolo o su tesorería (Revenue en DefiLlama)'],
    hold: ['etq-hold', 'Valor para el token', 'lo que llega a los titulares: quema, recompra o reparto (HoldersRevenue en DefiLlama)'],
    val: ['etq-val', 'Ingresos de validadores', 'emisión nueva más las comisiones que no se queman'],
    tvl: ['etq-tvl', 'Capital depositado (TVL)', 'valor de lo depositado en las aplicaciones, no es dinero del protocolo'],
  };
  const etq = (k) => el('span', { class: 'etq ' + ETQ[k][0], title: ETQ[k][2] }, ETQ[k][1]);

  /* ---- panel lateral con la serie entera, la regla de la tendencia y el enlace al dato en bruto ---- */
  function abrirSerie(o) {
    UI.abrir(o.titulo, () => {
      const w = el('div');
      if (o.etiqueta) w.append(el('p', { class: 'serie-nota' }, etq(o.etiqueta), ETQ[o.etiqueta][2] + '.'));
      if (o.metodo) w.append(el('p', { class: 'serie-nota' }, el('b', null, 'Método de la fuente: '), o.metodo));
      if (o.nota) w.append(el('p', { class: 'serie-nota' }, o.nota));
      const s = o.serie || [];
      if (s.length) {
        const tipo = o.tipo || 'flujo';
        const regla = tipo === 'flujo' ? 'Tendencia: se suman los últimos 7, 30, 90 o 365 días completos y se comparan con los mismos días anteriores. Flecha arriba si varía más de un +5 %, abajo si menos de un −5 %, plana entre medias. El día de hoy, a medias, no cuenta.' : 'Tendencia: el último valor frente al de hace 7, 30, 90 o 365 días. Flecha arriba si varía más de un +5 %, abajo si menos de un −5 %, plana entre medias.';
        w.append(el('div', { class: 'regla' }, regla));
        const filas = PLAZOS.map((d) => ({ d, r: variacion(s, tipo, d) })).filter((x) => x.r);
        if (filas.length) w.append(UI.tabla({ pp: 4, buscar: false, rows: filas, cols: [{ t: 'Plazo', v: (x) => x.d + ' días' }, { t: tipo === 'flujo' ? 'Suma del periodo' : 'Hoy', v: (x) => o.fmt(x.r.a), num: true }, { t: tipo === 'flujo' ? 'Periodo anterior' : 'Hace ese tiempo', v: (x) => o.fmt(x.r.b), num: true }, { t: 'Variación', v: (x) => varTxt(x.r.v), num: true }] }));
        const rows = s.slice().reverse().map((x, i, arr) => ({ t: x[0], v: x[1], d: arr[i + 1] && arr[i + 1][1] ? x[1] / arr[i + 1][1] - 1 : null }));
        w.append(el('h4', { style: 'margin:14px 0 4px' }, 'La serie completa (' + n(rows.length) + ' días)'), UI.tabla({ pp: 15, ph: 'Buscar una fecha…', csv: o.csv || 'serie', rows, cols: [{ t: 'Día', v: (r) => fd(r.t), o: (r) => r.t }, { t: o.unidad || 'Valor', v: (r) => o.fmt(r.v), o: (r) => r.v, num: true, csv: (r) => r.v }, { t: 'Frente al día anterior', v: (r) => (r.d == null ? '—' : pctA(r.d)), o: (r) => r.d, num: true }] }));
      } else w.append(el('p', { class: 'serie-nota' }, 'Esta fuente no da serie histórica para este dato: solo el valor actual.'));
      if (o.fuentes && o.fuentes.length) w.append(el('p', { class: 'fuente' }, 'De dónde sale: ', ...o.fuentes.flatMap((f, i) => [i ? ' · ' : '', ext(f[0], f[1])]), '.'));
      return w;
    }, { sub: o.sub || 'Cada cifra, hasta su origen', ancho: true });
  }
  const abrirTexto = (titulo, parrafos, fuentes, sub) => UI.abrir(titulo, () => el('div', null, parrafos.map((p) => (typeof p === 'string' ? el('p', { class: 'serie-nota' }, p) : p)), fuentes && fuentes.length ? el('p', { class: 'fuente' }, 'De dónde sale: ', ...fuentes.flatMap((f, i) => [i ? ' · ' : '', ext(f[0], f[1])]), '.') : null), { sub: sub || 'Sin dato gratuito' });

  /* ================= índice diario ================= */
  let IDX = null, idxError = null;
  const pIdx = traer('data/fundamentales-indice.json?v=' + Math.floor(Date.now() / 600000), 30000).then((d) => { IDX = d; return d; }).catch((e) => { idxError = e; return null; });

  /* ================= buscador ================= */
  const inp = document.getElementById('fb-q'), sug = document.getElementById('fb-sug'), form = document.getElementById('fb');
  const EJEMPLOS = [['tron', 'TRX'], ['ethereum', 'ETH'], ['bitcoin', 'BTC'], ['solana', 'SOL'], ['binancecoin', 'BNB'], ['aave', 'AAVE'], ['uniswap', 'UNI']];
  const ej = document.getElementById('fb-ej'); if (ej) EJEMPLOS.forEach(([g, s]) => ej.append(el('button', { type: 'button', class: 'chip', onclick: () => cargar(g) }, s)));
  function candidatos(q) {
    if (!IDX) return [];
    q = q.trim().toLowerCase(); if (!q) return [];
    const vistos = new Set(), out = [];
    const mete = (id, s, nm, rank, peso) => { if (vistos.has(id)) return; vistos.add(id); out.push({ id, s, nm, rank, peso }); };
    for (const [id, s, nm, rank] of IDX.top) { const S = (s || '').toLowerCase(), N = (nm || '').toLowerCase(); if (S === q) mete(id, s, nm, rank, 0); else if (S.startsWith(q) || id === q) mete(id, s, nm, rank, 1); else if (N.startsWith(q)) mete(id, s, nm, rank, 2); else if (N.includes(q)) mete(id, s, nm, rank, 3); }
    for (const [id, t] of Object.entries(IDX.tokens)) { const S = (t.s || '').toLowerCase(), N = (t.n || '').toLowerCase(); if (S === q) mete(id, t.s, t.n, null, 0.5); else if (S.startsWith(q) || id === q) mete(id, t.s, t.n, null, 1.5); else if (N.startsWith(q)) mete(id, t.s, t.n, null, 2.5); else if (q.length >= 3 && N.includes(q)) mete(id, t.s, t.n, null, 3.5); }
    return out.sort((a, b) => a.peso - b.peso || (a.rank || 9999) - (b.rank || 9999) || String(a.nm).localeCompare(String(b.nm))).slice(0, 8);
  }
  // sugerencias bajo una caja de texto: con el teclado (flechas, Intro, Escape) o con el ratón; onPick(id, simbolo)
  function autocompletar(input, lista, onPick) {
    let marcado = -1;
    const pintar = () => {
      const c = candidatos(input.value); lista.replaceChildren(); marcado = -1;
      if (!c.length) { lista.hidden = true; return; }
      c.forEach((x) => lista.append(el('button', { type: 'button', role: 'option', onclick: () => { lista.hidden = true; onPick(x.id, x.s || x.id); } }, el('b', null, x.s || '—'), x.nm, el('span', { class: 'mut' }, x.rank ? 'nº ' + x.rank + ' por capitalización' : 'en DefiLlama'))));
      lista.hidden = false;
    };
    input.addEventListener('input', pintar);
    input.addEventListener('focus', pintar);
    input.addEventListener('keydown', (e) => { const bs = [...lista.querySelectorAll('button')]; if (!bs.length || lista.hidden) return; if (e.key === 'ArrowDown') { e.preventDefault(); marcado = Math.min(bs.length - 1, marcado + 1); } else if (e.key === 'ArrowUp') { e.preventDefault(); marcado = Math.max(0, marcado - 1); } else if (e.key === 'Enter' && marcado >= 0) { e.preventDefault(); bs[marcado].click(); return; } else if (e.key === 'Escape') { lista.hidden = true; return; } else return; bs.forEach((b, i) => b.classList.toggle('on', i === marcado)); });
    document.addEventListener('click', (e) => { if (!input.parentElement.contains(e.target)) lista.hidden = true; });
  }
  // texto escrito → identificador de CoinGecko: primero el índice diario, si no, la búsqueda de CoinGecko (una llamada)
  async function resolverToken(q) {
    const c = candidatos(q); if (c.length) return c[0].id;
    avisar('No está en el índice diario; se pregunta a CoinGecko…');
    const r = await cg('search?query=' + encodeURIComponent(q)); const hit = (r.coins || [])[0];
    avisar(hit ? '' : 'CoinGecko no encuentra «' + q + '».'); return hit ? hit.id : null;
  }
  if (inp) {
    autocompletar(inp, sug, (id, s) => { inp.value = s; cargar(id); });
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); sug.hidden = true;
      const q = inp.value.trim(); if (!q) return;
      try { const id = await resolverToken(q); if (id) cargar(id); } catch (err) { avisar('No se pudo buscar ahora (' + err.message + ').'); }
    });
  }

  /* ================= comparar hasta 4 tokens ================= */
  let comparando = [];
  const cmpBox = el('div', { class: 'fb-cmp', id: 'fb-cmp' });
  const cmpChips = el('div', { class: 'chips' });
  const cmpInp = el('input', { type: 'search', placeholder: 'Comparar con… (escribe un token y elige)', 'aria-label': 'Token para comparar', autocomplete: 'off', spellcheck: 'false' });
  const cmpSug = el('div', { class: 'fb-sug', role: 'listbox', hidden: true });
  const cmpBtn = el('button', { type: 'button', class: 'btn', onclick: () => comparar() }, 'Comparar');
  cmpBox.append(el('span', { class: 'lbl' }, 'Comparar:'), cmpChips, el('div', { class: 'cmp-in' }, cmpInp, cmpSug), cmpBtn);
  if (ej) ej.after(cmpBox);
  autocompletar(cmpInp, cmpSug, (id) => { cmpInp.value = ''; anadirComparar(id); });
  cmpInp.addEventListener('keydown', async (e) => { if (e.key !== 'Enter' || !cmpSug.hidden) return; e.preventDefault(); const q = cmpInp.value.trim(); if (!q) { comparar(); return; } try { const id = await resolverToken(q); if (id) { cmpInp.value = ''; anadirComparar(id); } } catch (err) { avisar('No se pudo buscar ahora (' + err.message + ').'); } });
  function nombreDe(gid) { const F = cache[gid]; if (F) return F.simbolo; const t = IDX && IDX.tokens[gid]; const top = IDX && IDX.top.find((x) => x[0] === gid); return (t && t.s) || (top && top[1]) || gid; }
  function pintarChips() {
    cmpChips.replaceChildren(...comparando.map((g) => el('span', { class: 'chip cmpchip' }, nombreDe(g), el('button', { type: 'button', title: 'Quitar', 'aria-label': 'Quitar ' + nombreDe(g), onclick: () => { comparando = comparando.filter((x) => x !== g); pintarChips(); if (modo === 'comparar') comparar(); } }, '×'))));
    cmpBtn.disabled = comparando.length < 2; cmpBtn.textContent = comparando.length < 2 ? 'Comparar (elige 2 o más)' : 'Comparar ' + comparando.length + ' tokens';
    cmpInp.disabled = comparando.length >= 4; cmpInp.placeholder = comparando.length >= 4 ? 'Máximo 4 tokens' : 'Comparar con… (escribe un token y elige)';
  }
  function anadirComparar(gid) { if (!comparando.includes(gid) && comparando.length < 4) comparando.push(gid); pintarChips(); if (comparando.length >= 2) comparar(); else cmpInp.focus(); }
  async function comparar() {
    if (comparando.length < 2) { cmpInp.focus(); return; }
    modo = 'comparar'; activo = null; if (temporizadorPrecio) { clearInterval(temporizadorPrecio); temporizadorPrecio = null; }
    const lista = comparando.slice();
    try { history.replaceState(null, '', location.pathname + '?comparar=' + lista.map(encodeURIComponent).join(',')); } catch (e) { /* sin historial */ }
    const prog = el('div', { class: 'cargando' }, el('span', { class: 'spin' }), 'Leyendo…');
    raiz.replaceChildren(prog); raiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const Fs = [], fallidos = [];
    for (let i = 0; i < lista.length; i++) {
      prog.replaceChildren(el('span', { class: 'spin' }), 'Leyendo ' + (i + 1) + ' de ' + lista.length + ': ' + nombreDe(lista[i]) + '…');
      try { const F = await leerToken(lista[i], { cancelado: () => modo !== 'comparar' || comparando.join() !== lista.join(), progreso: (t) => prog.replaceChildren(el('span', { class: 'spin' }), (i + 1) + ' de ' + lista.length + ' · ' + t) }); if (!F) return; Fs.push(F); } catch (e) { fallidos.push(nombreDe(lista[i]) + ' (' + e.message + ')'); }
    }
    if (modo !== 'comparar' || comparando.join() !== lista.join()) return;
    pintarChips();
    if (Fs.length < 2) { raiz.replaceChildren(el('div', { class: 'res-head warn' }, el('div', { class: 'big' }, 'No se pudieron leer suficientes tokens'), el('div', { class: 'sub2' }, 'Sin respuesta: ' + fallidos.join(', ') + '. CoinGecko limita las lecturas por visitante; espera un minuto y vuelve a pulsar «Comparar».'))); return; }
    try { pintarComparacion(Fs, fallidos); } catch (e) { raiz.replaceChildren(el('p', { class: 'fallo' }, 'No se pudo montar la comparación: ' + e.message)); console.error(e); }
  }

  /* celdas comparables: la misma definición para todos los tokens; cada una con su valor, variación 30 d, minigráfico, capa y panel */
  const SIN = (motivo) => ({ sin: true, motivo });
  function celdas(F) {
    const s = F.simbolo, md = F.md, G = F.G, c = {};
    const capa = F.cad ? 'Red' : F.pf.length ? 'Protocolo' : null;
    c.precio = { v: usd(F.precio), serie: F.precioS, tipo: 'saldo', abrir: () => abrirSerie({ titulo: 'Precio · ' + s + ' (365 días)', serie: F.precioS || [], tipo: 'saldo', fmt: usd, fuentes: [[F.urlChart, '365 días de CoinGecko']], csv: s + '-precio', sub: F.nombre }) };
    c.cap = { v: m(F.mcap), serie: F.mcapS, tipo: 'saldo', abrir: () => abrirSerie({ titulo: 'Capitalización · ' + s, serie: F.mcapS || [], tipo: 'saldo', fmt: m, fuentes: [[F.urlChart, '365 días de CoinGecko']], csv: s + '-capitalizacion', sub: F.nombre }) };
    c.fdv = { v: m(F.fdv), sub: F.fdv && F.mcap ? 'cap / FDV ' + n(F.mcap / F.fdv * 100, 0) + ' %' : 'sin FDV', abrir: () => abrirTexto('FDV de ' + s, ['FDV ' + m(F.fdv) + ' frente a ' + m(F.mcap) + ' de capitalización. Circulante ' + nt(md.circulating_supply, s) + ' · total ' + nt(md.total_supply, s) + ' · máximo ' + (md.max_supply ? nt(md.max_supply, s) : 'sin máximo') + '.'], [[F.urlCG, 'ficha de CoinGecko']], 'CoinGecko') };
    c.circ = { v: nt(md.circulating_supply, s), sub: md.max_supply ? pctAbs(md.circulating_supply / md.max_supply * 100, 1) + ' del máximo' : 'sin máximo fijado', serie: F.cm.SplyCur, tipo: 'saldo', abrir: F.cm.SplyCur ? abrirCM(F, 'SplyCur', 'Oferta existente · ' + s, (v) => nt(v, s), 'saldo', 'Oferta existente según Coin Metrics (monedas ya creadas, bloqueadas o no); puede ser mayor que el circulante de CoinGecko.') : () => abrirTexto('Oferta de ' + s, ['Circulante ' + nt(md.circulating_supply, s) + ' · total ' + nt(md.total_supply, s) + ' · máximo ' + (md.max_supply ? nt(md.max_supply, s) : 'sin máximo') + ' (CoinGecko). Coin Metrics no da serie de oferta para ' + s + '.'], [[F.urlCG, 'ficha de CoinGecko']], 'CoinGecko') };
    // emisión de 30 días en la propia moneda y anualizada sobre la oferta
    let em = null, emNota = '';
    if (F.x.quema) { em = F.x.quema.actual.emision30d; emNota = 'serie diaria de TronScan'; }
    else if (F.x.recompensas && F.x.staked) { em = F.x.recompensas.issuance.apr * F.x.staked.sum / 1e9 / 365.25 * 30; emNota = 'estimación de ultrasound.money'; }
    else if (F.cm.IssTotNtv) { const sI = completos(F.cm.IssTotNtv), fin = HOY0(); if (cuenta(sI, fin - 30 * DIA, fin) >= 24) { em = suma(sI, fin - 30 * DIA, fin); emNota = 'Coin Metrics'; } }
    const sply = F.cm.SplyCur ? ultimo(F.cm.SplyCur)[1] : md.circulating_supply;
    c.emision = em == null ? SIN('ninguna fuente gratuita publica la emisión de ' + s) : { v: nt(em, s), sub: emNota, serie: F.cm.IssTotNtv, tipo: 'flujo', abrir: F.cm.IssTotNtv ? abrirCM(F, 'IssTotNtv', 'Emisión diaria de ' + s, (v) => nt(v, s)) : () => abrirTexto('Emisión de ' + s + ' en 30 días', [nt(em, s) + ' según ' + emNota + '.'], F.urls.filter((u) => /TronGrid|recompensas|staking/.test(u[1])), emNota) };
    c.inflacion = em == null || !sply ? SIN('sin emisión medible gratis') : { v: pct((em / 30 * 365.25) / sply, 2), sub: 'bruta, 30 d anualizados' + (F.x.quema ? ' · neta ' + pct((F.x.quema.actual.neto30d / 30 * 365.25) / F.x.quema.actual.ofertaTrx, 2) : ''), abrir: () => abrirTexto('Inflación bruta observada · ' + s, ['Emisión de 30 días (' + nt(em, s) + ', ' + emNota + ') multiplicada por 365,25/30 y dividida por la oferta (' + nt(sply, s) + '). Es la emisión bruta: no descuenta la quema, que va en su propia fila para que sea comparable entre tokens.'], [], 'Regla escrita') };
    const quema = G && G.hold && G.m.hold && /burn|quema/i.test(G.m.hold);
    c.quema = quema ? { v: m(G.t30.hold), etq: 'hold', sub: 'en dólares (DefiLlama)', serie: G.hold, tipo: 'flujo', capa, abrir: abrirLlama(F, G, 'hold', 'Quemado · ' + G.nombre) } : SIN(G && G.m.hold ? 'la fuente no habla de quema: «' + G.m.hold.slice(0, 90) + '»' : 'sin fuente de quema para ' + s);
    c.adr = F.cm.AdrActCnt ? { v: nt(ultimo(F.cm.AdrActCnt)[1]), serie: F.cm.AdrActCnt, tipo: 'flujo', abrir: abrirCM(F, 'AdrActCnt', 'Direcciones activas al día · ' + s) } : SIN('Coin Metrics (comunidad) no cubre ' + s);
    c.tx = F.cm.TxCnt ? { v: nt(ultimo(F.cm.TxCnt)[1]), serie: F.cm.TxCnt, tipo: 'flujo', abrir: abrirCM(F, 'TxCnt', 'Transacciones al día · ' + s) } : SIN('Coin Metrics (comunidad) no cubre ' + s);
    c.stables = F.stablesS ? { v: m(ultimo(F.stablesS)[1]), serie: F.stablesS, tipo: 'saldo', abrir: () => abrirSerie({ titulo: 'Stablecoins en ' + F.cadena.nombre, serie: F.stablesS, tipo: 'saldo', fmt: m, fuentes: [[F.urlStables, 'DefiLlama']], csv: s + '-stablecoins', sub: F.cadena.nombre }) } : SIN(F.cadena ? 'DefiLlama no registra stablecoins en ' + F.cadena.nombre : 'solo para cadenas');
    c.dex = F.dexS ? { v: m(F.dex24) + '/24 h', serie: F.dexS, tipo: 'flujo', abrir: () => abrirSerie({ titulo: 'Volumen DEX en ' + F.cadena.nombre, serie: F.dexS, fmt: m, fuentes: [[F.urlDex, 'DefiLlama']], csv: s + '-dex', sub: F.cadena.nombre }) } : SIN(F.cadena ? 'DefiLlama no registra DEX en ' + F.cadena.nombre : 'solo para cadenas');
    const tvl = F.cadena ? (F.tvlS ? ultimo(F.tvlS)[1] : F.cadena.tvl) : (F.prots[0] ? F.prots[0][4] : null);
    c.tvl = F.cadena ? { v: m(tvl), etq: 'tvl', sub: 'la cadena', capa: 'Red', serie: F.tvlS, tipo: 'saldo', abrir: () => abrirSerie({ titulo: 'TVL en ' + F.cadena.nombre, serie: F.tvlS || [], tipo: 'saldo', fmt: m, fuentes: [[F.urlTvl, 'DefiLlama']], csv: s + '-tvl', sub: F.cadena.nombre }) } : F.prots[0] ? { v: m(tvl), etq: 'tvl', sub: 'el protocolo (diario)', capa: 'Protocolo', var: F.prots[0][7] ? F.prots[0][4] / F.prots[0][7] - 1 : null, abrir: () => abrirProtocolo(F, F.prots[0]) } : SIN('sin cadena ni protocolo en DefiLlama');
    const g3 = (k, titulo) => (G && G[k] ? { v: m(G.t30[k]), etq: k, sub: G.nombre, capa, serie: G[k], tipo: 'flujo', abrir: abrirLlama(F, G, k, titulo + ' · ' + G.nombre) } : SIN(G ? 'la fuente no registra este dato para ' + G.nombre + (k === 'hold' && G.m.hold ? ': «' + G.m.hold.slice(0, 80) + '»' : '') : 'sin cadena ni protocolo con comisiones en DefiLlama'));
    c.fees = g3('fees', 'Comisiones de usuarios'); c.rev = g3('rev', 'Ingresos del protocolo'); c.hold = g3('hold', 'Valor para el token');
    c.revPct = G && G.t30.fees && G.t30.rev != null ? { v: pctAbs(G.t30.rev / G.t30.fees * 100, 0), sub: 'de las comisiones', capa, abrir: c.rev.abrir } : SIN('sin comisiones o ingresos registrados');
    c.holdPct = G && G.t30.fees && G.t30.hold != null ? { v: pctAbs(G.t30.hold / G.t30.fees * 100, 0), sub: 'de las comisiones', capa, abrir: c.hold.abrir } : SIN('sin comisiones o valor para el token registrados');
    if (F.x.quema && F.x.testigos) c.val = { v: nt(F.x.quema.actual.emisionDia, 'TRX') + '/día', etq: 'val', sub: 'solo emisión: las comisiones se queman', abrir: () => abrirTestigos(F) };
    else if (F.x.recompensas && F.x.staked) { const r = F.x.recompensas, st = F.x.staked.sum / 1e9; c.val = { v: nt((r.issuance.apr + r.tips.apr + r.mev.apr) * st, 'ETH') + '/año', etq: 'val', sub: 'emisión + propinas + MEV (estimación)', abrir: () => abrirTexto('Ingresos de los validadores de Ethereum', ['Emisión ' + pctAbs(r.issuance.apr * 100, 2) + ' + propinas ' + pctAbs(r.tips.apr * 100, 2) + ' + MEV ' + pctAbs(r.mev.apr * 100, 2) + ' sobre ' + nt(st, 'ETH') + ' en staking. Las comisiones base se queman.'], [[F.urlRec, 'ultrasound.money']], 'Estimación') }; }
    else if (!F.cadena) c.val = { v: 'no aplica', sub: 'vive sobre otras cadenas', abrir: () => abrirTexto('Validadores y ' + s, [s + ' no tiene validadores propios: su seguridad la pagan las cadenas donde vive.']) };
    else c.val = em != null && F.cm.IssTotNtv ? { v: nt(em, s) + ' en 30 d', etq: 'val', sub: 'emisión (Coin Metrics); las comisiones que cobran no se separan', serie: F.cm.IssTotNtv, tipo: 'flujo', abrir: abrirCM(F, 'IssTotNtv', 'Emisión diaria de ' + s, (v) => nt(v, s)) } : SIN('sin fuente gratuita de recompensas de validadores');
    const em30 = emision30Usd(F), origen = origenEmision(F);
    c.revEm = em30 === 0 ? { v: 'sin emisión', sub: 'no hay coste de seguridad propio', abrir: () => abrirTexto('Emisión de ' + s, ['0 ' + s + ' emitidos en 30 días según ' + (origen || 'Coin Metrics') + '.']) } : G && G.t30.rev != null && em30 ? { v: n(G.t30.rev / em30, 2) + ' ×', sub: m(G.t30.rev) + ' / ' + m(em30), capa, abrir: () => abrirTexto('Ingresos frente a emisión · ' + s, [el('p', { class: 'serie-nota' }, etq('rev'), m(G.t30.rev) + ' en 30 días («' + (G.m.rev || 'sin texto') + '»).'), el('p', { class: 'serie-nota' }, etq('val'), 'Emisión en 30 días: ' + m(em30) + ' según ' + origen + '.'), el('div', { class: 'regla' }, 'Regla escrita: ingresos ÷ emisión. Por encima de 1, las comisiones cubren lo que se emite para pagar a validadores; por debajo, la seguridad se paga con inflación.')], [[G.urls.rev, 'DefiLlama']], 'Dos capas, comparadas') } : SIN(em30 ? 'sin ingresos registrados' : 'sin emisión medible gratis');
    c.feesEm = em30 === 0 ? c.revEm : G && G.t30.fees != null && em30 ? { v: n(G.t30.fees / em30, 2) + ' ×', sub: m(G.t30.fees) + ' / ' + m(em30), capa, abrir: c.revEm.abrir } : SIN(em30 ? 'sin comisiones registradas' : 'sin emisión medible gratis');
    c.revTvl = G && G.t1a && G.t1a.rev != null && tvl ? { v: pctAbs(G.t1a.rev / tvl * 100, 2), sub: m(G.t1a.rev) + ' / ' + m(tvl) + ' · no descuenta incentivos', capa, abrir: () => abrirTexto('Rendimiento del capital depositado · ' + s, [el('p', { class: 'serie-nota' }, etq('rev'), 'Ingresos en 1 año: ' + m(G.t1a.rev) + '.'), el('p', { class: 'serie-nota' }, etq('tvl'), 'Capital depositado hoy: ' + m(tvl) + '.'), el('div', { class: 'regla' }, 'Ingresos de 1 año ÷ TVL de hoy. Sustituto rotulado: no descuenta incentivos (sin fuente gratuita).')], [], 'Sustituto rotulado') } : SIN('sin ingresos o sin TVL');
    const mult = (k) => (G && G.t1a[k] > 0 && F.mcap ? { v: n(F.mcap / G.t1a[k], 1) + ' ×', etq: k, sub: G.nombre + ' · 365 d reales', capa, abrir: () => abrirTexto('Capitalización / ' + ETQ[k][1].toLowerCase() + ' · ' + s, [el('p', { class: 'serie-nota' }, el('b', null, 'Numerador: '), 'capitalización ' + m(F.mcap) + ' (CoinGecko).'), el('p', { class: 'serie-nota' }, el('b', null, 'Denominador: '), etq(k), 'de ' + G.nombre + ' en 365 días = ' + m(G.t1a[k]) + '.'), el('p', { class: 'serie-nota' }, el('b', null, 'Beneficiario según la fuente: '), '«' + (G.m[k] || 'sin texto') + '».'), el('p', { class: 'serie-nota' }, el('b', null, 'Capa: '), capa === 'Red' ? 'valoración de la red.' : 'valoración del protocolo.'), el('div', { class: 'regla' }, m(F.mcap) + ' ÷ ' + m(G.t1a[k]) + ' = ' + n(F.mcap / G.t1a[k], 1) + ' veces. Solo comparable con otro múltiplo de la misma capa, denominador, periodo y beneficiario.')], [[F.urlCG, 'CoinGecko'], [G.urls[k], 'DefiLlama']], 'Cuatro etiquetas') } : SIN(G ? 'sin ' + ETQ[k][1].toLowerCase() + ' en 365 días' : 'sin comisiones registradas: no se calcula'));
    c.mFees = mult('fees'); c.mRev = mult('rev'); c.mHold = mult('hold');
    c.volCap = { v: F.mcap && md.total_volume ? pctAbs(md.total_volume.usd / F.mcap * 100, 1) : '—', sub: m(md.total_volume && md.total_volume.usd) + ' en 24 h', serie: F.volS, fmt: m, spNombre: 'Volumen negociado en 24 h', tipo: 'flujo', abrir: () => abrirSerie({ titulo: 'Volumen negociado · ' + s, serie: F.volS || [], fmt: m, fuentes: [[F.urlChart, 'CoinGecko']], csv: s + '-volumen', sub: F.nombre }) };
    c.ath = { v: md.ath_change_percentage ? pct(md.ath_change_percentage.usd / 100) : '—', sub: 'máximo ' + usd(md.ath && md.ath.usd) + (md.ath_date && md.ath_date.usd ? ' el ' + fd(Date.parse(md.ath_date.usd)) : ''), abrir: c.precio.abrir };
    if (F.x.reparto) c.conc = { v: pctAbs(F.x.reparto.concentracion.top100, 1), sub: 'las 100 mayores cuentas (diario)', abrir: () => window.open('herramientas.html#reparto', '_blank', 'noopener') };
    else if (F.cm.AdrBalCnt) c.conc = { v: nt(ultimo(F.cm.AdrBalCnt)[1]) + ' direcciones', sub: 'con saldo; no se sabe cuánto cada una', serie: F.cm.AdrBalCnt, tipo: 'saldo', abrir: abrirCM(F, 'AdrBalCnt', 'Direcciones con saldo · ' + s, (v) => n(v, 0), 'saldo') };
    else c.conc = SIN('la lista de titulares exige clave');
    if (F.x.testigos) { const T = F.x.testigos.data || [], prod = T.filter((x) => x.producer).sort((a, b) => b.votes - a.votes), tot = T.reduce((a, x) => a + (x.votes || 0), 0); c.control = { v: pctAbs(prod.slice(0, 27).reduce((a, x) => a + x.votes, 0) / tot * 100, 1), sub: 'de los votos en los 27 productores', abrir: () => abrirTestigos(F) }; c.seg = { v: pctAbs(tot / md.circulating_supply * 100, 1), sub: 'de la oferta votando (en stake)', abrir: () => abrirTestigos(F) }; }
    else if (F.x.staked) { const st = F.x.staked.sum / 1e9, lido = F.x.lido && F.precio ? F.x.lido / F.precio : null; c.control = lido ? { v: pctAbs(lido / st * 100, 1), sub: 'cuota de Lido en el staking (aprox.)', abrir: () => abrirTexto('Cuota de Lido', ['TVL de Lido al precio de hoy frente al ETH en staking. Aproximación.'], [[F.urlLido, 'DefiLlama'], [F.urlStaked, 'ultrasound.money']], 'Aproximación') } : SIN('sin respuesta de Lido'); c.seg = { v: pctAbs(st / md.circulating_supply * 100, 1), sub: 'de la oferta en staking', abrir: () => abrirTexto('ETH en staking', [nt(st, 'ETH') + ' en staking.'], [[F.urlStaked, 'ultrasound.money']], 'ultrasound.money') }; }
    else { c.control = SIN(F.cadena ? 'validadores de ' + F.cadena.nombre + ': sin fuente gratuita sin clave' : 'token sobre otra cadena: la controla esa cadena'); c.seg = F.cm.HashRate ? { v: n(ultimo(F.cm.HashRate)[1] / 1e6, 0) + ' EH/s', sub: 'potencia de minado', serie: F.cm.HashRate, tipo: 'saldo', abrir: abrirCM(F, 'HashRate', 'Potencia de minado · ' + s, (v) => n(v / 1e6, 1) + ' EH/s', 'saldo') } : SIN(F.cadena ? 'sin fuente gratuita' : 'la seguridad es la de la cadena donde vive'); }
    const gh = F.R.gh, rel = F.R.rel;
    c.dev = F.repo ? { v: gh && gh.ok ? n(gh.v.commits) + ' commits' : 'sin respuesta', sub: '28 d · ' + F.repo + (rel && rel.ok ? ' · ' + (rel.v.tag_name || rel.v.name) : ''), abrir: () => abrirTexto('Desarrollo de ' + s + ' (sin interpretar)', ['Commits en 28 días en la rama por defecto de ' + F.repo + ': ' + (gh && gh.ok ? n(gh.v.commits) : 'sin respuesta') + '. Última versión: ' + (rel && rel.ok ? (rel.v.tag_name || rel.v.name) + ' el ' + fd(Date.parse(rel.v.published_at)) : 'ninguna publicada o sin respuesta') + '. Los commits son una aproximación débil; por eso no hay color ni nota.'], [[F.urlGh, 'GitHub']], 'GitHub') } : SIN('CoinGecko no indica repositorio');
    return c;
  }
  const FILAS_CMP = [
    { paso: 0, k: 'precio', t: 'Precio' }, { paso: 0, k: 'cap', t: 'Capitalización' }, { paso: 0, k: 'fdv', t: 'FDV' },
    { paso: 1, k: 'circ', t: 'En circulación' }, { paso: 1, k: 'emision', t: 'Emisión en 30 días' }, { paso: 1, k: 'inflacion', t: 'Emisión anualizada sobre la oferta' }, { paso: 1, k: 'quema', t: 'Quemado en 30 días' },
    { paso: 2, k: 'adr', t: '1 · Direcciones activas / día' }, { paso: 2, k: 'tx', t: '1 · Transacciones / día' }, { paso: 2, k: 'stables', t: '2 · Stablecoins en la cadena' }, { paso: 2, k: 'dex', t: '2 · Volumen DEX 24 h' }, { paso: 2, k: 'tvl', t: '2 · Capital depositado (TVL)', capas: true }, { paso: 2, k: 'fees', t: '3 · Comisiones de usuarios (30 d)', capas: true }, { paso: 2, k: 'hold', t: '4 · Valor para el token (30 d)', capas: true },
    { paso: 3, k: 'rev', t: 'Ingresos del protocolo (30 d)', capas: true }, { paso: 3, k: 'revPct', t: 'Ingresos / comisiones', capas: true },
    { paso: 4, k: 'holdPct', t: 'Valor para el token / comisiones', capas: true }, { paso: 4, k: 'val', t: 'Ingresos de validadores' },
    { paso: 5, k: 'revEm', t: 'Ingresos / emisión (30 d)', capas: true }, { paso: 5, k: 'feesEm', t: 'Comisiones / emisión (30 d)', capas: true }, { paso: 5, k: 'revTvl', t: 'Ingresos / capital depositado (1 año)', capas: true },
    { paso: 6, k: 'mFees', t: 'Capitalización / comisiones (365 d)', capas: true }, { paso: 6, k: 'mRev', t: 'Capitalización / ingresos (365 d)', capas: true }, { paso: 6, k: 'mHold', t: 'Capitalización / valor para el token (365 d)', capas: true }, { paso: 6, k: 'volCap', t: 'Volumen / capitalización (24 h)' }, { paso: 6, k: 'ath', t: 'Distancia al máximo histórico' }, { paso: 6, k: 'conc', t: 'Quién tiene el token' }, { paso: 6, k: 'control', t: 'Quién controla la red' }, { paso: 6, k: 'seg', t: 'Seguridad' }, { paso: 6, k: 'dev', t: 'Desarrollo (sin semáforo)' },
  ];
  const PASOS_CMP = { 0: 'Mercado', 1: '1 · Economía del token', 2: '2 · Actividad y demanda (la escalera)', 3: '3 · Monetización', 4: '4 · Captura de valor', 5: '5 · Sostenibilidad', 6: '6 · Valoración y riesgo' };
  function pintarComparacion(Fs, fallidos) {
    const Cs = Fs.map(celdas);
    const cab = el('div', { class: 'ft' }, el('div', { class: 'ftt' }, el('h2', null, 'Comparar: ' + Fs.map((F) => F.simbolo).join(' · ')), el('p', { class: 'sub' }, 'Las mismas filas y las mismas etiquetas para todos. Cuando una fila mezcla una red con un protocolo se avisa: no son comparables directamente. Pulsa una celda para ver su serie, su regla y su origen; pulsa el nombre de un token para abrir su ficha.')), el('div', { class: 'fp' }, el('button', { type: 'button', class: 'btn', onclick: () => { comparando = []; pintarChips(); cargar(Fs[0].gid); } }, 'Volver a la ficha de ' + Fs[0].simbolo)));
    const th = el('tr', null, el('th', null, 'Métrica'), Fs.map((F) => el('th', { class: 'tok' }, el('button', { type: 'button', class: 'tokbtn', onclick: () => { cargar(F.gid); } }, (F.cg.image || {}).thumb ? el('img', { src: F.cg.image.thumb, alt: '' }) : null, el('b', null, F.simbolo), el('small', null, F.cadena && F.pf.length ? 'red y protocolo' : F.cadena ? 'red: ' + F.cadena.nombre : F.pf.length ? 'protocolo: ' + F.pf[0].nombre : 'sin DefiLlama')))));
    const tb = el('table', { class: 'tb cmp' }, el('thead', null, th)); const tbody = el('tbody'); tb.append(tbody);
    for (const p of Object.keys(PASOS_CMP)) {
      tbody.append(el('tr', { class: 'paso' }, el('td', { colspan: Fs.length + 1 }, PASOS_CMP[p])));
      for (const f of FILAS_CMP.filter((x) => String(x.paso) === p)) {
        const cs = Cs.map((c) => c[f.k] || SIN('sin dato'));
        const capas = f.capas ? [...new Set(cs.filter((c) => !c.sin && c.capa).map((c) => c.capa))] : [];
        const aviso = capas.length > 1 ? el('small', { class: 'aviso' }, 'capas distintas (red frente a protocolo): no comparables directamente') : null;
        tbody.append(el('tr', null, el('td', { class: 'met' }, f.t, aviso), cs.map((c) => {
          if (c.sin) return el('td', { class: 'cell sin clk', onclick: () => abrirTexto(f.t, [c.motivo + '.']) }, el('span', { class: 'nd' }, 'sin dato gratuito'), el('small', null, c.motivo));
          const v = c.var !== undefined ? c.var : (c.serie ? (variacion(c.serie, c.tipo || 'flujo', 30) || {}).v : undefined);
          const sp = c.serie ? spark(c.serie, colorTend(v), 90, { nombre: c.spNombre || (typeof f.t === 'string' ? f.t : ''), fmt: c.fmt, muestra: c.v }) : null;
          return el('td', { class: 'cell clk', onclick: c.abrir || null, title: 'Ver la serie y el origen' }, el('div', { class: 'cv1' }, el('b', null, c.v), v !== undefined ? varTxt(v == null ? null : v) : null), el('small', null, c.etq ? etq(c.etq) : null, c.capa && f.capas ? el('span', { class: 'capa' }, c.capa + ' · ') : null, c.sub || ''), sp ? el('div', { class: 'sp' }, sp) : null);
        })));
      }
    }
    const fuentes = Fs.map((F) => el('p', { class: 'fuente' }, F.simbolo + ': ', ...F.urls.flatMap((u, i) => [i ? ' · ' : '', ext(u[0], u[1])]), '.'));
    raiz.replaceChildren(cab, el('div', { class: 'card', style: 'margin:0 0 14px' }, el('div', { class: 'tbw' }, tb), el('p', { class: 'hint' }, 'Variación 30 d: flujos frente a los 30 días anteriores; saldos frente a hace 30 días. Minigráfico: últimos 90 días. Un múltiplo solo se compara con otro de la misma capa, denominador, periodo y beneficiario.'), fallidos.length ? el('p', { class: 'fallo' }, 'No se pudo leer: ' + fallidos.join(', ') + '.') : null),
      el('div', { class: 'card', style: 'margin:0 0 18px' }, el('h4', null, 'De dónde sale cada columna'), ...fuentes));
  }

  /* ================= carga de un token ================= */
  let activo = null, temporizadorPrecio = null, refrescarPrecio = null, modo = 'ficha';
  const cache = {};   // F de cada token ya leído (vale 5 minutos), para comparar sin volver a pedirlo todo
  async function cargar(gid) {
    activo = gid; modo = 'ficha';
    try { history.replaceState(null, '', location.pathname + '?token=' + encodeURIComponent(gid)); } catch (e) { /* sin historial */ }
    if (temporizadorPrecio) { clearInterval(temporizadorPrecio); temporizadorPrecio = null; }
    raiz.replaceChildren(el('div', { class: 'cargando' }, el('span', { class: 'spin' }), 'Leyendo CoinGecko…'));
    raiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    let F;
    try {
      F = await leerToken(gid, { cancelado: () => activo !== gid || modo !== 'ficha', cabecera: (F0) => pintarCabecera(F0), progreso: (t) => { let c = raiz.querySelector('.cargando'); if (!c) { c = el('div', { class: 'cargando' }); raiz.append(c); } c.replaceChildren(el('span', { class: 'spin' }), t); } });
    } catch (e) { avisar(''); raiz.replaceChildren(el('div', { class: 'res-head warn' }, el('div', { class: 'big' }, 'No se pudo leer la ficha de CoinGecko'), el('div', { class: 'sub2' }, e.message + '. Si acabas de abrir varias fichas seguidas, CoinGecko limita las lecturas por visitante durante un minuto. Vuelve a intentarlo en un momento.'))); return; }
    if (!F) return;
    raiz.querySelectorAll('.cargando').forEach((x) => x.remove());
    try { pintarTablero(F); } catch (e) { raiz.append(el('p', { class: 'fallo' }, 'No se pudo montar el cuadro de mando: ' + e.message)); console.error(e); }
    // precio en vivo cada minuto mientras la pestaña está a la vista
    const refrescar = async () => { if (document.hidden || activo !== gid) return; try { const d = await traer('https://coins.llama.fi/prices/current/coingecko:' + gid, 10000); const c = d.coins && d.coins['coingecko:' + gid]; if (c && F.precioEl) { F.precioEl.textContent = usd(c.price); F.precioSub.textContent = 'precio en vivo · ' + fh(c.timestamp * 1000).slice(11) + ' · coins.llama.fi'; } } catch (e) { /* se mantiene el último precio */ } };
    refrescarPrecio = refrescar;
    temporizadorPrecio = setInterval(refrescar, 60000); refrescar();
  }
  // Lee todo lo de un token y devuelve F preparado (sin pintar). H: { cancelado(), cabecera(F), progreso(texto) }. Lanza error si CoinGecko falla.
  async function leerToken(gid, H) {
    H = H || {}; const cancelado = H.cancelado || (() => false);
    if (cache[gid] && Date.now() - cache[gid].ahora < 5 * 60000) { if (H.cabecera) H.cabecera(cache[gid]); return cache[gid]; }
    await pIdx;
    const t = (IDX && IDX.tokens[gid]) || {};
    const F = { gid, t, cadena: t.c ? { nombre: t.c[0], tvl: t.c[1], fees: t.c[2] } : null, prots: t.p || [], urls: [] };
    const U = (u, nombre) => { F.urls.push([u, nombre]); return u; };

    // 1) CoinGecko: ficha y 365 días (dos llamadas; la cuota es por visitante)
    const CG = await cg('coins/' + encodeURIComponent(gid) + '?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false');
    if (cancelado()) return null;
    F.cg = CG; F.simbolo = (CG.symbol || '').toUpperCase(); F.nombre = CG.name; F.md = CG.market_data || {};
    F.urlCG = U('https://api.coingecko.com/api/v3/coins/' + gid + '?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false', 'ficha de ' + F.nombre + ' en CoinGecko');
    if (H.cabecera) H.cabecera(F);
    const pChart = quizas(cg('coins/' + encodeURIComponent(gid) + '/market_chart?vs_currency=usd&days=365&interval=daily'));
    F.urlChart = U('https://api.coingecko.com/api/v3/coins/' + gid + '/market_chart?vs_currency=usd&days=365&interval=daily', '365 días de precio y capitalización en CoinGecko');

    // 2) DefiLlama: cadena y protocolos del índice
    const L = 'https://api.llama.fi/';
    const feesDe = (slug) => { const urls = { fees: U(L + 'summary/fees/' + slug + '?dataType=dailyFees', 'comisiones de usuarios de ' + slug + ' en DefiLlama'), rev: U(L + 'summary/fees/' + slug + '?dataType=dailyRevenue', 'ingresos del protocolo de ' + slug + ' en DefiLlama'), hold: U(L + 'summary/fees/' + slug + '?dataType=dailyHoldersRevenue', 'valor para el token de ' + slug + ' en DefiLlama') }; return { fees: quizas(traer(urls.fees)), rev: quizas(traer(urls.rev)), hold: quizas(traer(urls.hold)), urls }; };
    const P = {};
    if (F.cadena) {
      const nm = encodeURIComponent(F.cadena.nombre);
      if (F.cadena.fees) P.cad = feesDe(F.cadena.fees);
      P.tvl = quizas(traer(F.urlTvl = U(L + 'v2/historicalChainTvl/' + nm, 'TVL histórico de la cadena en DefiLlama')));
      P.stables = quizas(traer(F.urlStables = U('https://stablecoins.llama.fi/stablecoincharts/' + nm, 'stablecoins en la cadena en DefiLlama'), 30000));
      P.dex = quizas(traer(F.urlDex = U(L + 'overview/dexs/' + nm + '?excludeTotalDataChartBreakdown=true', 'volumen de intercambios descentralizados de la cadena en DefiLlama')));
      P.apps = quizas(traer(F.urlApps = U(L + 'overview/fees/' + nm + '?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true', 'aplicaciones de la cadena con comisiones en DefiLlama')));
    }
    F.protsFees = F.prots.filter((p) => p[8]).slice(0, 2);
    P.prot = F.protsFees.map((p) => feesDe(p[0]));

    // 3) Coin Metrics: solo las métricas que el índice dice que existen para este activo
    const asset = F.simbolo.toLowerCase();
    const cob = (IDX && IDX.cobertura && IDX.cobertura[asset]) || [];
    F.cobertura = cob;
    const QUIERO = ['AdrActCnt', 'TxCnt', 'TxTfrCnt', 'FeeTotNtv', 'IssTotNtv', 'IssTotUSD', 'SplyCur', 'AdrBalCnt', 'HashRate'];
    P.cm = {}; for (const k of QUIERO) if (cob.includes(k)) P.cm[k] = quizas(cm(asset, k));

    // 4) extras por activo
    P.x = {};
    if (gid === 'tron') {
      P.x.quema = quizas(traer('data/quema-trx.json?v=' + Math.floor(Date.now() / 600000)));
      P.x.reparto = quizas(traer('data/reparto-trx.json?v=' + Math.floor(Date.now() / 600000)));
      P.x.desbloqueos = quizas(traer('data/desbloqueos-trx.json?v=' + Math.floor(Date.now() / 600000)));
      P.x.tron = quizas(traer(F.urlTron = U('https://apilist.tronscanapi.com/api/stats/overview?limit=31', 'actividad diaria de TRON en TronScan (31 días)')));
      P.x.testigos = quizas(traer(F.urlTestigos = U('https://apilist.tronscanapi.com/api/pagewitness?witnesstype=0', 'validadores (testigos) de TRON en TronScan'), 30000));
      P.x.params = quizas(traer(F.urlParams = U('https://api.trongrid.io/wallet/getchainparameters', 'parámetros de la red TRON en TronGrid')));
    }
    if (gid === 'ethereum') {
      P.x.staked = quizas(traer(F.urlStaked = U('https://ultrasound.money/api/v2/fees/effective-balance-sum', 'ETH en staking (ultrasound.money)')));
      P.x.recompensas = quizas(traer(F.urlRec = U('https://ultrasound.money/api/v2/fees/validator-rewards', 'recompensas de validadores (ultrasound.money)')));
      P.x.lido = quizas(traer(F.urlLido = U(L + 'tvl/lido', 'TVL de Lido en DefiLlama')));
    }
    // 5) GitHub (2 llamadas, 60 por hora y visitante)
    const repos = ((CG.links || {}).repos_url || {}).github || [];
    const repo = repos.map((r) => (String(r).match(/github\.com\/([^/]+\/[^/#?]+)/) || [])[1]).filter(Boolean)[0];
    F.repos = repos; F.repo = repo;
    if (repo) {
      const d28 = new Date(Date.now() - 28 * DIA).toISOString();
      P.gh = quizas(fetch(F.urlGh = U('https://api.github.com/repos/' + repo + '/commits?since=' + d28 + '&per_page=1', 'commits de 28 días de ' + repo + ' en GitHub'), { signal: AbortSignal.timeout(15000) }).then(async (r) => { if (r.status === 403 || r.status === 429) throw new Error('límite de GitHub alcanzado'); if (!r.ok) throw new Error('HTTP ' + r.status); const link = r.headers.get('Link') || ''; const mm = link.match(/[?&]page=(\d+)>;\s*rel="last"/); const cuerpo = await r.json(); return { commits: mm ? Number(mm[1]) : (Array.isArray(cuerpo) ? cuerpo.length : 0) }; }));
      P.rel = quizas(traer(F.urlRel = U('https://api.github.com/repos/' + repo + '/releases/latest', 'última versión publicada de ' + repo + ' en GitHub'), 15000));
    }

    if (H.progreso) H.progreso('Leyendo DefiLlama, Coin Metrics y las demás fuentes de ' + F.nombre + '…');
    const R = { chart: await pChart };
    const resolver = async (o) => { const out = {}; for (const [k, v] of Object.entries(o)) out[k] = v && typeof v.then === 'function' ? await v : v; return out; };
    R.cad = P.cad ? await resolver(P.cad) : null; R.prot = []; for (const p of P.prot) R.prot.push(await resolver(p));
    R.tvl = P.tvl ? await P.tvl : null; R.stables = P.stables ? await P.stables : null; R.dex = P.dex ? await P.dex : null; R.apps = P.apps ? await P.apps : null;
    R.cm = await resolver(P.cm); R.x = await resolver(P.x); R.gh = P.gh ? await P.gh : null; R.rel = P.rel ? await P.rel : null;
    if (cancelado()) return null;
    F.R = R; F.ahora = Date.now();
    preparar(F);
    cache[gid] = F;
    return F;
  }

  /* ---- series listas para pintar ---- */
  function preparar(F) {
    const R = F.R, ok = (r) => r && r.ok && r.v;
    const serieLlama = (r) => (ok(r) ? deLlama(r.v.totalDataChart) : null);
    const metodo = (r, campo) => { if (!ok(r)) return null; const m = r.v.methodology && r.v.methodology[campo]; if (m) return m; const hs = (r.v.childProtocols || []).map((h) => h.methodology && h.methodology[campo]).filter(Boolean); return hs.length ? [...new Set(hs)].join(' · ') : null; };
    const total = (r, k) => (ok(r) && r.v[k] != null ? Number(r.v[k]) : null);
    const grupo = (G, nombre) => (G ? { nombre, fees: serieLlama(G.fees), rev: serieLlama(G.rev), hold: serieLlama(G.hold), m: { fees: metodo(G.fees, 'Fees') || metodo(G.fees, 'UserFees'), rev: metodo(G.rev, 'Revenue') || metodo(G.rev, 'ProtocolRevenue'), hold: metodo(G.hold, 'HoldersRevenue') }, t24: { fees: total(G.fees, 'total24h'), rev: total(G.rev, 'total24h'), hold: total(G.hold, 'total24h') }, t30: { fees: total(G.fees, 'total30d'), rev: total(G.rev, 'total30d'), hold: total(G.hold, 'total30d') }, t1a: { fees: total(G.fees, 'total1y'), rev: total(G.rev, 'total1y'), hold: total(G.hold, 'total1y') }, url: (G.fees.ok && G.fees.v.methodologyURL) || (G.rev.ok && G.rev.v.methodologyURL) || null, urls: G.urls, fallo: [G.fees, G.rev, G.hold].some((x) => !x.ok && !noExiste(x)) } : null);
    F.cad = grupo(R.cad, F.cadena && F.cadena.nombre);
    F.pf = R.prot.map((G, i) => grupo(G, F.protsFees[i][1]));
    F.G = F.cad || F.pf[0] || null;
    F.tvlS = ok(R.tvl) ? R.tvl.v.map((x) => [x.date * 1000, x.tvl]).sort((a, b) => a[0] - b[0]) : null;
    F.stablesS = ok(R.stables) ? R.stables.v.map((x) => [Number(x.date) * 1000, Number((x.totalCirculatingUSD || {}).peggedUSD || 0)]).filter((x) => isFinite(x[1])).sort((a, b) => a[0] - b[0]) : null;
    F.dexS = ok(R.dex) ? deLlama(R.dex.v.totalDataChart) : null; F.dex24 = ok(R.dex) ? R.dex.v.total24h : null;
    F.apps = ok(R.apps) ? (R.apps.v.protocols || []).filter((p) => p.total24h != null && p.category !== 'Chain' && p.protocolType !== 'chain').sort((a, b) => (b.total30d || 0) - (a.total30d || 0)) : null;
    F.cm = {}; F.cmUrl = {}; for (const [k, r] of Object.entries(R.cm)) if (ok(r) && r.v.serie.length >= 2) { F.cm[k] = r.v.serie; F.cmUrl[k] = r.v.url; }
    F.mcapS = ok(R.chart) ? R.chart.v.market_caps.map((x) => [x[0], x[1]]) : null; F.precioS = ok(R.chart) ? R.chart.v.prices.map((x) => [x[0], x[1]]) : null; F.volS = ok(R.chart) ? R.chart.v.total_volumes.map((x) => [x[0], x[1]]) : null;
    F.precio = F.md.current_price && F.md.current_price.usd; F.mcap = F.md.market_cap && F.md.market_cap.usd; F.fdv = F.md.fully_diluted_valuation && F.md.fully_diluted_valuation.usd;
    F.x = {}; for (const [k, r] of Object.entries(R.x)) if (ok(r)) F.x[k] = r.v;
    F.fallos = []; const nombreR = { tvl: 'TVL de la cadena (DefiLlama)', stables: 'stablecoins (DefiLlama)', dex: 'intercambios (DefiLlama)', apps: 'aplicaciones (DefiLlama)', chart: 'historial de CoinGecko' };
    for (const [k, r] of Object.entries(R)) if (r && typeof r === 'object' && 'ok' in r && !r.ok && !noExiste(r) && nombreR[k]) F.fallos.push(nombreR[k]);
    if (F.cad && F.cad.fallo) F.fallos.push('comisiones de la cadena (DefiLlama)');
    for (const [k, r] of Object.entries(R.cm)) if (!r.ok) F.fallos.push('Coin Metrics ' + k);
    for (const [k, r] of Object.entries(R.x)) if (!r.ok && !noExiste(r)) F.fallos.push({ quema: 'quema diaria de TRX', reparto: 'reparto de TRX', desbloqueos: 'descongelaciones de TRX', tron: 'TronScan', testigos: 'validadores de TronScan', params: 'TronGrid', staked: 'ultrasound (staking)', recompensas: 'ultrasound (recompensas)', lido: 'Lido (DefiLlama)' }[k] || k);
    if (R.gh && !R.gh.ok) F.fallos.push('GitHub (' + (R.gh.e && R.gh.e.message) + ')');
    const claves = new Set(); if (F.cadena && F.cadena.fees) claves.add('cadena:' + F.cadena.fees); for (const p of F.prots) { claves.add('protocolo:' + p[0]); for (const h of p[10] || []) claves.add('protocolo:' + h[0]); } claves.add('coinmetrics:' + F.simbolo.toLowerCase());
    F.cambios = ((IDX && IDX.cambios) || []).filter((c) => claves.has(c.clave));
  }
  const abrirCM = (F, k, titulo, fmt, tipo, nota) => () => abrirSerie({ titulo, serie: F.cm[k], fmt: fmt || ((v) => n(v, 0)), tipo: tipo || 'flujo', nota, fuentes: [[F.cmUrl[k], 'serie diaria de Coin Metrics (comunidad), métrica ' + k]], csv: F.simbolo + '-' + k, sub: F.nombre });
  const abrirLlama = (F, G, k, titulo) => () => abrirSerie({ titulo, etiqueta: k, metodo: G.m[k], serie: G[k], fmt: (v) => m(v), tipo: 'flujo', fuentes: [[G.urls[k], 'respuesta en bruto de DefiLlama (con su texto de método)'], G.url ? [G.url, 'código del adaptador de DefiLlama (cómo se mide)'] : null].filter(Boolean), csv: F.simbolo + '-' + k, sub: G.nombre });
  // emisión de 30 días en dólares: TRX por quema-trx (precio del día), ETH por ultrasound (precio de hoy), resto Coin Metrics IssTotUSD
  function emision30Usd(F) {
    if (F.x.quema) return F.x.quema.actual.emision30d * F.x.quema.actual.precioUsd;
    if (F.x.recompensas && F.x.staked && F.precio) return (F.x.recompensas.issuance.apr * F.x.staked.sum / 1e9) / 365.25 * 30 * F.precio;
    if (F.cm.IssTotUSD) { const s = completos(F.cm.IssTotUSD), fin = HOY0(); return cuenta(s, fin - 30 * DIA, fin) >= 24 ? suma(s, fin - 30 * DIA, fin) : null; }
    return null;
  }
  const origenEmision = (F) => (F.x.quema ? 'la serie diaria de TronScan (con el precio de cada día)' : F.x.recompensas ? 'ultrasound.money (rentabilidad por emisión × ETH en staking, al precio de hoy: estimación)' : F.cm.IssTotUSD ? 'Coin Metrics (IssTotUSD)' : null);

  /* ================= cabecera ================= */
  function pintarCabecera(F) {
    const md = F.md, img = (F.cg.image || {}).small;
    const tipo = F.cadena && F.prots.length ? 'Cadena y protocolo en DefiLlama' : F.cadena ? 'Cadena: ' + F.cadena.nombre + ' en DefiLlama' : F.prots.length ? 'Protocolo: ' + F.prots[0][1] + ' en DefiLlama' : 'Sin cadena ni protocolo en DefiLlama';
    const cats = (F.cg.categories || []).filter((c) => c && !/Portfolio|Index|Alleged|Made in|Holdings|Ecosystem$|Launchpad/i.test(c)).slice(0, 4).join(' · ');
    F.cab = el('div', { class: 'ft' }, img ? el('img', { src: img, alt: '' }) : null,
      el('div', { class: 'ftt' }, el('h2', null, F.nombre, el('small', null, F.simbolo), el('span', { class: 'tipo' }, tipo)), el('p', { class: 'sub' }, (F.cg.market_cap_rank ? 'Nº ' + F.cg.market_cap_rank + ' por capitalización · ' : '') + (cats || 'sin categoría en CoinGecko'))),
      el('div', { class: 'fp' }, F.precioEl = el('b', null, usd(md.current_price && md.current_price.usd)), F.precioSub = el('span', null, (md.price_change_percentage_24h != null ? pct(md.price_change_percentage_24h / 100) + ' en 24 h · ' : '') + 'CoinGecko ' + fh(Date.parse(F.cg.last_updated || Date.now())).slice(11)),
        el('span', { class: 'cap' }, 'Capitalización ' + m(md.market_cap && md.market_cap.usd) + (md.fully_diluted_valuation && md.fully_diluted_valuation.usd ? ' · FDV ' + m(md.fully_diluted_valuation.usd) : '') + (F.cg.market_cap_rank ? ' · nº ' + F.cg.market_cap_rank : '')),
        el('div', null, el('button', { type: 'button', class: 'chip', style: 'margin-top:6px', onclick: () => { anadirComparar(F.gid); cmpInp.focus(); cmpBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, 'Comparar con otro token →'))));
    raiz.replaceChildren(F.cab);
  }

  /* ================= cuadro de mando ================= */
  function pintarTablero(F) {
    const s = F.simbolo, G = F.G;
    if (F.cambios.length) F.cab.append(el('button', { type: 'button', class: 'cm', onclick: () => abrirCambios(F) }, 'Método o cobertura cambiados: ' + [...new Set(F.cambios.map((c) => c.fecha))].sort().slice(-3).join(', ')));
    if (idxError) F.cab.append(el('span', { class: 'cm' }, 'El índice diario no se pudo leer: DefiLlama y Coin Metrics no se consultan'));
    // tres niveles: resumen (lectura ejecutiva) → una sección por dimensión → evidencia (tabla completa, fuentes)
    F.rel = calcularRelaciones(F);
    raiz.append(navegacion(F),
      seccion('resumen', 'Resumen', '¿Cómo funciona económicamente ' + F.nombre + '?', 'Lo esencial de las seis dimensiones en una pantalla. Cada sección de abajo entra en una; la evidencia completa está al final.', tarjetasResumen(F), el('div', { class: 'tab' }, graficoClave(F), el('div', { class: 'lado' }, preguntaGuia(F)))),
      seccion('economia', '1 · Economía del token', 'Cuánto hay, cuánto se crea y cuánto se destruye', 'Emisión · inflación · quema · dilución. El balance del periodo y, debajo, emisión y quema día a día.', secEconomia(F)),
      seccion('actividad', '2 · Actividad y demanda', 'De la actividad al valor que llega al token, en cuatro etapas', 'Millones de operaciones no son, por sí solas, demanda económica. Cada etapa con su gráfico; las dos últimas llevan a su sección.', secActividad(F)),
      seccion('monetizacion', '3 · Monetización', 'Cuánto pagan los usuarios y cuánto se queda el protocolo', 'El diagrama de flujos sigue el dinero de 30 días según la metodología de la fuente; lo que la fuente no desglosa se dice.', secMonetizacion(F)),
      seccion('captura', '4 · Captura de valor', 'Qué parte de ese dinero llega de verdad al token', 'Quema, recompra o reparto, y qué cobran los validadores: otra capa, que no se suma.', secCaptura(F)),
      seccion('sostenibilidad', '5 · Sostenibilidad', '¿Cubren los ingresos lo que se emite para pagar la seguridad?', 'Dos series y su cociente, para ver si mejora o empeora, no solo dónde está hoy.', secSostenibilidad(F)),
      seccion('valoracion', '6 · Valoración y riesgo', 'Múltiplos, concentración, seguridad y ecosistema', 'Cuatro paneles, sin nota ni radar: los matices se conservan.', secValoracion(F)),
      seccion('evidencia', 'Evidencia', 'Todas las cifras, su serie, su regla y su fuente', 'La tabla completa por los seis pasos, para auditar. Cada fila se pulsa y abre la serie entera y la respuesta en bruto.', tablaDetalle(F), piebar(F)));
    espiar(F);
  }
  const seccion = (id, kick, titulo, sub, ...kids) => el('section', { class: 'zp fsec', id: 's-' + id, 'data-sec': id }, el('span', { class: 'kick' }, kick), el('h3', null, titulo), sub ? el('p', { class: 'sub' }, sub) : null, ...kids.flat(Infinity).filter(Boolean));
  const SECS = [['resumen', 'Resumen'], ['economia', 'Economía'], ['actividad', 'Actividad'], ['monetizacion', 'Monetización'], ['captura', 'Captura'], ['sostenibilidad', 'Sostenibilidad'], ['valoracion', 'Valoración y riesgo'], ['evidencia', 'Evidencia']];
  function navegacion(F) {
    const ir = (id) => (e) => { e.preventDefault(); const s = document.getElementById('s-' + id); if (s) { s.scrollIntoView({ behavior: 'smooth', block: 'start' }); try { history.replaceState(null, '', location.pathname + location.search + '#' + id); } catch (x) { /* sin historial */ } } };
    F.nav = el('nav', { class: 'fnav', 'aria-label': 'Dimensiones' }, SECS.map(([id, t], i) => el('a', { href: '#' + id, 'data-sec': id, class: i === 0 ? 'on' : '', onclick: ir(id) }, t)), el('span', { class: 'nivel' }, 'Resumen → dimensiones → evidencia'));
    return F.nav;
  }
  // marca en la navegación la sección que está a la vista
  function espiar(F) {
    if (!('IntersectionObserver' in window) || !F.nav) return;
    const vistos = new Map();
    const io = new IntersectionObserver((es) => { for (const e of es) vistos.set(e.target.dataset.sec, e.isIntersecting ? e.boundingClientRect.top : Infinity); let mejor = null; for (const [k, top] of vistos) if (top !== Infinity && (mejor == null || Math.abs(top - 120) < Math.abs(vistos.get(mejor) - 120))) mejor = k; if (mejor) F.nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.sec === mejor)); }, { rootMargin: '-100px 0px -55% 0px', threshold: [0, 0.2] });
    raiz.querySelectorAll('.fsec').forEach((s) => io.observe(s));
    const h = location.hash.replace('#', ''); if (h && SECS.some(([id]) => id === h)) setTimeout(() => { const s = document.getElementById('s-' + h); if (s) s.scrollIntoView({ block: 'start' }); }, 300);
  }

  /* ---- gráficos auxiliares ---- */
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const ejeFecha = (labels, largo) => ({ ticks: { maxTicksLimit: largo ? 12 : 6, callback: (v, i) => { const d = labels[i]; return d ? MESES[Number(d.slice(5, 7)) - 1] + (d.slice(5, 7) === '01' || i === 0 ? ' ' + d.slice(2, 4) : '') : ''; } }, grid: { display: false } });
  // líneas de una o varias series (mismo eje), con marcas de cambio de método y clic → panel del día
  function graficoLineas(F, o) {
    const dias = o.dias || 365, series = o.series.filter((s) => s.serie && s.serie.length > 2);
    const cv = el('canvas'); const wrap = el('div', { class: o.clase || 'cvm' }, cv);
    if (!series.length) { wrap.replaceChildren(el('div', { class: 'sd' }, el('b', null, 'Sin serie gratuita. '), o.sin || '')); return wrap; }
    const labels = [...new Set(series.flatMap((s) => desde(s.serie, dias).map((x) => fd(x[0]))))].sort();
    const mapas = series.map((s) => porDia(s.serie));
    const cfg = { type: o.tipo || 'line', data: { labels, datasets: series.map((s, i) => ({ label: s.t, data: labels.map((d) => (mapas[i].has(d) ? mapas[i].get(d) : null)), borderColor: s.color || C.pal[i], backgroundColor: (s.color || C.pal[i]) + (o.tipo === 'bar' ? 'cc' : '22'), fill: !!s.relleno, borderWidth: 1.6, pointRadius: 0, pointHitRadius: 8, tension: .25, spanGaps: true, yAxisID: s.eje || 'y', ...puntoHover })) },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: series.length > 1, position: 'bottom' }, tooltip: tipLineas((c) => ' ' + series[c.datasetIndex].t + ': ' + (series[c.datasetIndex].fmt || o.fmt || m)(c.parsed.y)) },
        scales: Object.assign({ x: ejeFecha(labels, dias > 120), y: { ticks: { maxTicksLimit: 5, callback: (v) => (o.fmt || m)(v) }, grid: { color: C.css('--line') } } }, o.eje2 ? { y2: { position: 'right', ticks: { maxTicksLimit: 5, callback: (v) => (o.fmt2 || m)(v) }, grid: { drawOnChartArea: false } } } : {}) } };
    // dos series con la misma cifra día a día se taparían: la segunda va a trazos y se avisa debajo
    const coinciden = [];
    cfg.data.datasets.forEach((dj, j) => { for (let i = 0; i < j; i++) { const di = cfg.data.datasets[i]; let iguales = 0, ambos = 0; dj.data.forEach((v, k) => { const u = di.data[k]; if (v == null || u == null) return; ambos++; if (Math.abs(v - u) <= Math.max(Math.abs(v), Math.abs(u)) * 1e-6) iguales++; }); if (ambos >= 20 && iguales / ambos >= 0.98) { dj.borderDash = [6, 4]; dj.borderWidth = 2.2; dj.fill = false; coinciden.push([series[i].t, series[j].t, Math.round(iguales / ambos * 100)]); } } });
    let salida = wrap;
    if (coinciden.length) salida = el('div', null, wrap, el('p', { class: 'coinciden' }, coinciden.map((c) => 'Las líneas «' + c[0] + '» y «' + c[1] + '» coinciden (misma cifra el ' + c[2] + ' % de los días): la segunda se dibuja a trazos para que se vea.').join(' ')));
    UI.clicable(cfg, (e) => { const dia = labels[e.index]; UI.abrir((o.titulo || 'Valores') + ' · ' + dia, () => el('div', null, UI.tabla({ pp: 10, buscar: false, rows: series.map((s, i) => ({ s, v: mapas[i].get(dia) })), cols: [{ t: 'Serie', v: (r) => r.s.t }, { t: 'Valor', v: (r) => (r.v == null ? '—' : (r.s.fmt || o.fmt || m)(r.v)), num: true }, { t: 'Fuente', v: (r) => (r.s.fuente ? ext(r.s.fuente[0], r.s.fuente[1]) : '—') }] }), o.nota ? el('p', { class: 'serie-nota' }, o.nota) : null), { sub: F.nombre, ancho: true }); });
    cfg.plugins = [marcasPlugin(fechasCambio(F)), cruzPlugin];
    C.chartDefaults(); new Chart(cv, cfg);
    return salida;
  }

  /* ---- nivel 1: tres tarjetas priorizadas ---- */
  function tarjetasResumen(F) {
    const s = F.simbolo, G = F.G, t = [];
    if (F.x.quema) { const A = F.x.quema.actual; t.push(tarjeta({ l: '1 · Economía: oferta en 30 d', v: pct(A.neto30d / A.ofertaTrx, 2), n: 'emisión ' + nt(A.emision30d, 'TRX') + ' · quema ' + nt(A.quema30d, 'TRX') + ' · neto ' + (A.neto30d > 0 ? '+' : '') + nt(A.neto30d, 'TRX'), serie: G && G.hold, fmt: m, spNombre: 'Quema diaria en dólares (valor para el token)', tipo: 'flujo', dias: 30, abrir: () => irSeccion('economia') })); }
    else if (F.cm.SplyCur) { const r = variacion(F.cm.SplyCur, 'saldo', 30); t.push(tarjeta({ l: '1 · Economía: oferta en 30 d', v: r ? pct(r.v, 2) : '—', n: 'oferta existente ' + nt(ultimo(F.cm.SplyCur)[1], s) + ' (Coin Metrics)', serie: F.cm.SplyCur, fmt: (v) => nt(v, s), spNombre: 'Oferta existente', tipo: 'saldo', dias: 30, abrir: () => irSeccion('economia') })); }
    else t.push(tarjeta({ l: '1 · Economía: emitido', v: F.md.max_supply ? pctAbs(F.md.circulating_supply / F.md.max_supply * 100, 1) + ' del máximo' : nt(F.md.circulating_supply, s), n: 'sin serie gratuita de oferta', abrir: () => irSeccion('economia') }));
    if (F.cm.AdrActCnt) t.push(tarjeta({ l: '2 · Demanda: direcciones activas / día', v: nt(ultimo(F.cm.AdrActCnt)[1]), serie: F.cm.AdrActCnt, tipo: 'flujo', dias: 30, abrir: () => irSeccion('actividad') }));
    else if (F.stablesS) t.push(tarjeta({ l: '2 · Demanda: stablecoins en la cadena', v: m(ultimo(F.stablesS)[1]), serie: F.stablesS, tipo: 'saldo', dias: 30, abrir: () => irSeccion('actividad') }));
    else if (F.prots[0]) t.push(tarjeta({ l: '2 · Demanda: capital depositado', v: m(F.prots[0][4]), var: F.prots[0][7] ? F.prots[0][4] / F.prots[0][7] - 1 : null, abrir: () => irSeccion('actividad') }));
    else t.push(tarjeta({ l: '2 · Demanda', v: 'sin dato gratuito', sin: true, abrir: () => irSeccion('actividad') }));
    if (G && G.hold) t.push(tarjeta({ l: el('span', null, etq('hold'), '30 d'), v: m(G.t30.hold), n: G.t30.fees ? pctAbs(G.t30.hold / G.t30.fees * 100, 0) + ' de ' + m(G.t30.fees) + ' pagados por los usuarios' : '', serie: G.hold, spNombre: 'Valor para el token / día', tipo: 'flujo', dias: 30, abrir: () => irSeccion('captura') }));
    else if (G && G.fees) t.push(tarjeta({ l: el('span', null, etq('fees'), '30 d'), v: m(G.t30.fees), n: 'la fuente no registra valor para el token', serie: G.fees, spNombre: 'Comisiones de usuarios / día', tipo: 'flujo', dias: 30, abrir: () => irSeccion('monetizacion') }));
    else t.push(tarjeta({ l: '4 · Captura de valor', v: 'sin dato gratuito', n: 'sin comisiones registradas en DefiLlama', sin: true, abrir: () => irSeccion('captura') }));
    return el('div', { class: 'kp3' }, t);
  }
  const irSeccion = (id) => { const s = document.getElementById('s-' + id); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  /* ---- 1 · Economía del token: balance de oferta y emisión frente a quema ---- */
  function seriesEmisionQuema(F) {
    const s = F.simbolo; let em = null, qu = null, nota = [], fuentes = [];
    if (F.x.quema && F.x.quema.ultimos400) { em = F.x.quema.ultimos400.map((r) => [Date.parse(r[0] + 'T00:00:00Z'), r[1]]); qu = F.x.quema.ultimos400.map((r) => [Date.parse(r[0] + 'T00:00:00Z'), r[2]]); nota.push('Emisión y quema en TRX, día a día, de la serie de TronScan.'); fuentes.push(['https://apilist.tronscanapi.com/api/turnover?type=0&from=issuance', 'serie diaria de TronScan']); }
    else {
      if (F.cm.IssTotNtv) { em = F.cm.IssTotNtv; nota.push('Emisión diaria en ' + s + ' según Coin Metrics.'); fuentes.push([F.cmUrl.IssTotNtv, 'emisión diaria (Coin Metrics)']); }
      const G = F.G;
      if (G && G.hold && G.m.hold && /burn|quema/i.test(G.m.hold) && F.precioS) { const mp = porDia(F.precioS); qu = G.hold.map((x) => { const p = mp.get(fd(x[0])); return p ? [x[0], x[1] / p] : null; }).filter(Boolean); nota.push('Quema: dólares quemados según DefiLlama («' + G.m.hold.slice(0, 90) + '») convertidos a ' + s + ' con el precio de cada día: estimación.'); fuentes.push([G.urls.hold, 'valor quemado (DefiLlama)']); }
    }
    return { em, qu, nota: nota.join(' '), fuentes };
  }
  function secEconomia(F) {
    const s = F.simbolo, md = F.md, { em, qu, nota, fuentes } = seriesEmisionQuema(F);
    const fin = F.cm.SplyCur ? ultimo(F.cm.SplyCur)[1] : (F.x.quema ? F.x.quema.actual.ofertaTrx : md.circulating_supply);
    const card = el('div', { class: 'card' });
    if (em && em.length > 30) {
      let d = 30; const cont = el('div'); const lineas = el('div'); const pie = el('p', { class: 'regla2' });
      const per = el('div', { class: 'per' }, [30, 90, 365].map((x) => el('button', { type: 'button', class: x === d ? 'on' : '', onclick: (e) => { d = x; per.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); pintar(); pintarLineas(); } }, x === 365 ? '1 año' : x + ' d')));
      const pintar = () => {
        const sE = completos(em), sQ = qu ? completos(qu) : [], f = HOY0(), E = suma(sE, f - d * DIA, f), Q = sQ.length ? suma(sQ, f - d * DIA, f) : 0, neto = E - Q, ini = fin - neto;
        const abrirB = (titulo, texto) => () => abrirTexto(titulo, [texto, nota], fuentes, 'Regla escrita');
        cont.replaceChildren(el('div', { class: 'bal' },
          el('div', { onclick: abrirB('Oferta al inicio del periodo', 'Oferta de hoy (' + nt(fin, s) + ') menos el neto del periodo (' + (neto >= 0 ? '+' : '') + nt(neto, s) + '). No es una lectura directa: se deduce.') }, el('span', null, 'Oferta hace ' + d + ' días'), el('b', null, nt(ini, s))),
          el('div', { class: 'mas', onclick: abrirB('Emisión en ' + d + ' días', 'Suma de la emisión diaria de los últimos ' + d + ' días completos: ' + nt(E, s) + '.') }, el('span', null, 'Emisión'), el('b', null, '+' + nt(E, s))),
          el('div', { class: 'menos', onclick: qu ? abrirB('Quema en ' + d + ' días', 'Suma de la quema diaria de los últimos ' + d + ' días: ' + nt(Q, s) + '.') : abrirB('Quema', 'Ninguna fuente gratuita registra quema para ' + s + '.') }, el('span', null, 'Quema'), el('b', null, qu ? '−' + nt(Q, s) : 'sin dato')),
          el('div', { class: neto > 0 ? 'mas' : 'menos', onclick: abrirB('Variación neta', 'Emisión menos quema en ' + d + ' días: ' + (neto >= 0 ? '+' : '') + nt(neto, s) + ' (' + pct(neto / ini, 2) + ' de la oferta inicial; ' + pct((neto / d * 365.25) / ini, 2) + ' anualizado).') }, el('span', null, 'Variación neta'), el('b', null, (neto >= 0 ? '+' : '') + nt(neto, s)), el('span', null, pct(neto / ini, 2) + ' · ' + pct((neto / d * 365.25) / ini, 2) + ' anualizado')),
          el('div', { onclick: abrirB('Oferta hoy', F.cm.SplyCur ? 'Oferta existente según Coin Metrics (monedas creadas, bloqueadas o no).' : F.x.quema ? 'Oferta de TRX según la serie de TronScan.' : 'Circulante según CoinGecko.') }, el('span', null, 'Oferta hoy'), el('b', null, nt(fin, s)), el('span', null, md.max_supply ? pctAbs(fin / md.max_supply * 100, 1) + ' del máximo' : 'sin máximo fijado'))));
      };
      // el gráfico sigue al periodo elegido (30 / 90 días / 1 año), igual que las cajas
      const pintarLineas = () => { const viejo = lineas.querySelector('canvas'); if (viejo && Chart.getChart(viejo)) Chart.getChart(viejo).destroy(); lineas.replaceChildren(graficoLineas(F, { titulo: 'Emisión y quema diarias', dias: d, series: [{ t: 'Emisión / día', serie: em, color: C.pal[1], fmt: (v) => nt(v, s), fuente: fuentes[0] }, qu ? { t: 'Quema / día', serie: qu, color: C.pal[3], fmt: (v) => nt(v, s), fuente: fuentes[fuentes.length - 1] } : null].filter(Boolean), fmt: (v) => nt(v, s), nota })); pie.textContent = 'Las dos líneas, día a día (' + (d === 365 ? 'último año' : 'últimos ' + d + ' días') + '). ' + nota + ' Pasa el ratón para ver cada día; pulsa un punto para ver las cifras y su origen.'; };
      pintar(); pintarLineas();
      card.append(el('h4', null, 'Balance de oferta', per), cont, lineas, pie);
    } else if (em && em.length) card.append(el('h4', null, 'Balance de oferta'), el('div', { class: 'sd' }, el('b', null, 'Serie corta. '), 'La fuente da menos de un mes de emisión para ' + s + '.'));
    else {
      // sin emisión medible: la oferta se enseña como barra de circulante / emitido no circulante / sin emitir
      const circ = md.circulating_supply, tot = md.total_supply, max = md.max_supply, base = max || tot || circ;
      const partes = [['En circulación', circ, C.pal[0]], tot && tot > circ * 1.001 ? ['Emitido pero no circulante (bloqueado, tesorería o vesting; CoinGecko no lo separa)', tot - circ, C.pal[2]] : null, max && max > (tot || circ) * 1.001 ? ['Aún sin emitir', max - (tot || circ), C.pal[8]] : null].filter(Boolean);
      const cv = el('canvas');
      card.append(el('h4', null, 'Reparto de la oferta'), el('p', { class: 'cs' }, F.cm.IssTotNtv ? s + ' no ha emitido monedas nuevas en los últimos dos años según Coin Metrics: la oferta se reparte así.' : 'Ninguna fuente gratuita publica la emisión de ' + s + ': se muestra lo que da CoinGecko.'), el('div', { class: 'cvs', style: 'height:90px' }, cv));
      C.chartDefaults(); new Chart(cv, UI.clicable({ type: 'bar', data: { labels: [s], datasets: partes.map((p) => ({ label: p[0], data: [p[1]], backgroundColor: p[2], borderWidth: 0 })) }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false, axis: 'y' }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + nt(c.parsed.x, s) + ' (' + pctAbs(c.parsed.x / base * 100, 1) + ')' } } }, scales: { x: { stacked: true, ticks: { callback: (v) => nt(v, s) } }, y: { stacked: true, display: false } } } }, (e) => abrirTexto('Oferta de ' + s, [partes[e.datasetIndex][0] + ': ' + nt(partes[e.datasetIndex][1], s) + ' (' + pctAbs(partes[e.datasetIndex][1] / base * 100, 1) + ').'], [[F.urlCG, 'ficha de CoinGecko']], 'CoinGecko')));
    }
    const lado = el('div', { class: 'pila' },
      el('div', { class: 'card' }, el('h4', null, 'Dilución'), el('div', { class: 'ahora' }, F.fdv && F.mcap ? n(F.mcap / F.fdv * 100, 0) + ' %' : '—', el('small', null, 'capitalización / FDV')), el('p', { class: 'regla2' }, F.fdv && F.mcap ? (F.mcap / F.fdv < 0.95 ? 'El ' + pctAbs((1 - F.mcap / F.fdv) * 100, 0) + ' del valor a precio de hoy está en monedas aún no emitidas (FDV ' + m(F.fdv) + ').' : 'Casi todo lo que existirá ya circula (FDV ' + m(F.fdv) + ').') : 'CoinGecko no da FDV para este token.'), el('p', { class: 'regla2' }, 'Circulante ' + nt(md.circulating_supply, s) + ' · total ' + nt(md.total_supply, s) + ' · máximo ' + (md.max_supply ? nt(md.max_supply, s) : 'sin máximo fijado') + '.')),
      el('div', { class: 'sd' }, el('b', null, 'Calendario de desbloqueos (vesting): sin dato gratuito. '), 'DefiLlama lo cobra. La dilución de arriba dice cuánto valor está en monedas aún no emitidas.' + (F.x.desbloqueos ? ' En TRX lo que sí hay es TRX que sale del stake: ' + nt(F.x.desbloqueos.calendario.porFecha.slice(0, 14).reduce((a, x) => a + x.trx, 0), 'TRX') + ' en 14 días (ver descongelaciones en Herramientas).' : '')));
    return el('div', { class: 'grid2-1' }, card, lado);
  }

  /* ---- 2 · Actividad y demanda: cuatro etapas ---- */
  function secActividad(F) {
    const s = F.simbolo, G = F.G;
    const mini = (serie, color, fmt, fuente, titulo) => graficoLineas(F, { titulo, series: [{ t: titulo, serie, color, fmt, fuente }], fmt, dias: 90, clase: 'cvs' });
    const etapa = (num, titulo, que, cifra, sub, abrir, grafico, ir) => el('div', { class: 'etapa' }, el('span', { class: 'n' }, num), el('h4', null, titulo), el('p', { class: 'que' }, que), el('div', { class: 'cif', onclick: abrir, role: abrir ? 'button' : null, tabindex: abrir ? '0' : null }, cifra, el('small', null, sub)), grafico, ir ? el('a', { class: 'ir', href: '#' + ir, onclick: (e) => { e.preventDefault(); irSeccion(ir); } }, 'Ver la sección →') : null);
    const e1 = F.cm.AdrActCnt ? etapa(1, 'Actividad', 'Direcciones activas y transacciones al día. Una dirección no es una persona.', nt(ultimo(F.cm.AdrActCnt)[1]) + ' direcciones/día', F.cm.TxCnt ? nt(ultimo(F.cm.TxCnt)[1]) + ' transacciones/día' + (F.cm.TxTfrCnt ? ' · ' + nt(ultimo(F.cm.TxTfrCnt)[1]) + ' transferencias' : '') : 'el ' + fd(ultimo(F.cm.AdrActCnt)[0]), abrirCM(F, 'AdrActCnt', 'Direcciones activas al día · ' + s), mini(F.cm.AdrActCnt, C.pal[1], (v) => n(v, 0), [F.cmUrl.AdrActCnt, 'Coin Metrics'], 'Direcciones activas / día'))
      : F.cm.TxCnt ? etapa(1, 'Actividad', 'Transacciones al día.', nt(ultimo(F.cm.TxCnt)[1]) + ' transacciones/día', '', abrirCM(F, 'TxCnt', 'Transacciones al día · ' + s), mini(F.cm.TxCnt, C.pal[1], (v) => n(v, 0), [F.cmUrl.TxCnt, 'Coin Metrics'], 'Transacciones / día'))
      : etapa(1, 'Actividad', 'Direcciones activas y transacciones al día.', 'sin dato gratuito', 'Coin Metrics (comunidad) no cubre ' + s, () => abrirTexto('Actividad de ' + s, ['Coin Metrics (comunidad) no publica direcciones activas ni transacciones de ' + s + '. Las fuentes que sí lo dan exigen clave o son de pago. No se estima.']), null);
    if (F.x.tron) { const d = F.x.tron.data || [], u = d[d.length - 1]; if (u) e1.append(el('p', { class: 'regla2' }, 'TronScan: ' + n(u.active_account_number, 0) + ' cuentas activas, ' + n(u.newAddressSeen, 0) + ' nuevas y ' + n(u.usdt_transaction, 0) + ' transacciones de USDT el ' + u.dateDayStr + '.')); }
    let e2;
    if (F.stablesS || F.dexS) e2 = etapa(2, 'Uso económico', 'Dinero que la gente decide tener y mover en esta red: stablecoins y volumen de los intercambios descentralizados.', F.stablesS ? m(ultimo(F.stablesS)[1]) + ' en stablecoins' : m(F.dex24) + '/24 h en DEX', F.stablesS && F.dexS ? m(F.dex24) + ' negociados en 24 h en los DEX' : '', F.stablesS ? () => abrirSerie({ titulo: 'Stablecoins en ' + F.cadena.nombre, serie: F.stablesS, tipo: 'saldo', fmt: m, fuentes: [[F.urlStables, 'DefiLlama']], csv: s + '-stablecoins', sub: F.cadena.nombre }) : () => abrirSerie({ titulo: 'Volumen DEX en ' + F.cadena.nombre, serie: F.dexS, fmt: m, fuentes: [[F.urlDex, 'DefiLlama']], csv: s + '-dex', sub: F.cadena.nombre }), graficoLineas(F, { titulo: 'Uso económico', series: [F.stablesS ? { t: 'Stablecoins', serie: F.stablesS, color: C.pal[5], fmt: m, fuente: [F.urlStables, 'DefiLlama'] } : null, F.dexS ? { t: 'Volumen DEX / día', serie: F.dexS, color: C.pal[6], fmt: m, fuente: [F.urlDex, 'DefiLlama'], eje: F.stablesS ? 'y2' : 'y' } : null].filter(Boolean), fmt: m, eje2: !!(F.stablesS && F.dexS), fmt2: m, dias: 90, clase: 'cvs' }));
    else if (F.prots[0]) { const p = F.prots[0]; e2 = etapa(2, 'Uso económico', 'Capital depositado por los usuarios en ' + p[1] + ' (dato diario del índice; sin serie gratuita).', m(p[4]) + ' TVL', 'ayer ' + m(p[5]) + ' · hace 7 d ' + m(p[6]) + ' · hace 30 d ' + m(p[7]), () => abrirProtocolo(F, p), null); }
    else e2 = etapa(2, 'Uso económico', 'Stablecoins, volumen transferido y DEX.', 'sin dato gratuito', 'el valor transferido lo cobra Coin Metrics; ' + s + ' no es cadena ni protocolo en DefiLlama', () => abrirTexto('Uso económico de ' + s, ['El valor transferido en la propia moneda lo reserva Coin Metrics a su plan de pago, y ' + s + ' no es una cadena ni un protocolo con datos en DefiLlama.']), null);
    const e3 = G && G.fees ? etapa(3, 'Monetización', 'Comisiones que pagan los usuarios: lo que la actividad convierte en dinero.', m(G.t30.fees) + ' en 30 d', G.nombre + ' · ' + m(G.t24.fees) + ' en 24 h', abrirLlama(F, G, 'fees', 'Comisiones de usuarios · ' + G.nombre), mini(G.fees, C.pal[2], m, [G.urls.fees, 'DefiLlama'], 'Comisiones de usuarios / día'), 'monetizacion') : etapa(3, 'Monetización', 'Comisiones que pagan los usuarios.', 'sin dato gratuito', s + ' no tiene cadena ni protocolo con comisiones en DefiLlama', () => abrirTexto('Comisiones de ' + s, [s + ' no tiene cadena ni protocolo con comisiones registradas en DefiLlama, la única fuente gratuita con metodología publicada.']), null, 'monetizacion');
    const e4 = G && G.hold ? etapa(4, 'Captura de valor', 'Lo que de todo eso llega al token: quema, recompra o reparto.', m(G.t30.hold) + ' en 30 d', G.t30.fees ? pctAbs(G.t30.hold / G.t30.fees * 100, 0) + ' de las comisiones' : '', abrirLlama(F, G, 'hold', 'Valor que llega al token · ' + G.nombre), mini(G.hold, C.pal[3], m, [G.urls.hold, 'DefiLlama'], 'Valor para el token / día'), 'captura') : etapa(4, 'Captura de valor', 'Lo que llega al token.', G && G.fees ? 'nada registrado' : 'sin dato gratuito', G && G.m.hold ? '«' + G.m.hold.slice(0, 70) + '…»' : '', () => abrirTexto('Captura de valor · ' + s, [G && G.fees ? 'La fuente registra comisiones pero no quema, recompra ni reparto a los titulares de ' + s + (G.m.hold ? '. Texto de la fuente: «' + G.m.hold + '».' : '.') : 'Sin comisiones registradas no hay forma gratuita de medir lo que llega al token.']), null, 'captura');
    return el('div', { class: 'etapas' }, e1, e2, e3, e4);
  }

  /* ---- 3 · Monetización: diagrama de flujos de 30 días ---- */
  function secMonetizacion(F) {
    const s = F.simbolo, G = F.G;
    if (!G || !G.fees) return el('div', { class: 'sd' }, el('b', null, 'Sin comisiones registradas. '), s + ' no tiene cadena ni protocolo con comisiones en DefiLlama, la única fuente gratuita con metodología publicada. Las alternativas (Token Terminal, Artemis, Messari) son de pago.');
    const Fe = G.t30.fees || 0, Re = G.t30.rev != null ? G.t30.rev : null, Ho = G.t30.hold != null ? G.t30.hold : null, em30 = emision30Usd(F);
    const nodos = [], enlaces = [], ids = {};
    const nodo = (id, nombre, color, abrir, detalle) => { ids[id] = nodos.length; nodos.push({ id, name: nombre, color, abrir, detalle }); };
    const enlace = (a, b, v, color) => { if (v > 0) enlaces.push({ source: ids[a], target: ids[b], value: v, color }); };
    nodo('u', 'Pagan los usuarios · ' + m(Fe), C.pal[0], abrirLlama(F, G, 'fees', 'Comisiones de usuarios · ' + G.nombre), 'Comisiones de 30 días: «' + (G.m.fees || 'sin texto') + '».');
    if (Re != null) {
      nodo('p', 'Retiene el protocolo · ' + m(Re), C.pal[4], abrirLlama(F, G, 'rev', 'Ingresos del protocolo · ' + G.nombre), 'Ingresos del protocolo de 30 días: «' + (G.m.rev || 'sin texto') + '».');
      if (Fe - Re > 0) { const quien = F.x.recompensas ? 'Validadores (propinas y MEV)' : 'No lo retiene el protocolo'; nodo('r', quien + ' · ' + m(Fe - Re), C.pal[8], () => abrirTexto(quien, ['Comisiones de usuarios (' + m(Fe) + ') menos ingresos del protocolo (' + m(Re) + ') = ' + m(Fe - Re) + '. La fuente no lo desglosa en este dato: según su método, va a quien produce bloques, a los proveedores de liquidez o a los prestamistas. Texto de la fuente para las comisiones: «' + (G.m.fees || 'sin texto') + '»; para los ingresos: «' + (G.m.rev || 'sin texto') + '».'], [[G.urls.fees, 'comisiones (DefiLlama)'], [G.urls.rev, 'ingresos (DefiLlama)']], 'Según la fuente'), 'Diferencia entre lo que pagan los usuarios y lo que retiene el protocolo.'); }
      enlace('u', 'p', Math.min(Fe, Re), C.pal[4]); enlace('u', 'r', Fe - Re, C.pal[8]);
      if (Ho != null) {
        const base = Math.min(Re, Fe);
        nodo('t', 'Llega al token · ' + m(Ho), C.pal[1], abrirLlama(F, G, 'hold', 'Valor para el token · ' + G.nombre), 'Valor para los titulares de 30 días: «' + (G.m.hold || 'sin texto') + '».');
        if (base - Ho > 0) nodo('o', 'Tesorería u otros usos · ' + m(base - Ho), C.pal[7], () => abrirTexto('Tesorería u otros usos', ['Ingresos del protocolo (' + m(base) + ') menos lo que llega al token (' + m(Ho) + ') = ' + m(base - Ho) + '. Según la fuente, lo que el protocolo retiene y no reparte ni quema. Texto de la fuente: «' + (G.m.rev || 'sin texto') + '».'], [[G.urls.rev, 'ingresos (DefiLlama)']], 'Según la fuente'), 'Lo que el protocolo retiene y no llega al token.');
        enlace('p', 't', Math.min(Ho, base), C.pal[1]); enlace('p', 'o', base - Ho, C.pal[7]);
        if (Ho > base) nodo('x', 'Aviso: la fuente da más valor para el token que ingresos', C.pal[3], null, '');
      } else nodo('t0', 'Valor para el token: no registrado', C.pal[8], null, '');
    }
    if (em30 && F.cadena) { nodo('e', 'Emisión nueva (30 d, otra capa) · ' + m(em30), C.pal[2], () => abrirTexto('Emisión frente a comisiones', ['Emisión de 30 días en dólares: ' + m(em30) + ' según ' + origenEmision(F) + '. Es otra capa: dinero nuevo para pagar la seguridad, no comisiones. Se dibuja aparte para compararla a simple vista con lo que pagan los usuarios; no se suma.'], [], 'Otra capa'), 'Emisión en dólares, para comparar el tamaño; no es un flujo de comisiones.'); nodo('v', 'Validadores (por la emisión)', C.pal[2], null, ''); enlace('e', 'v', em30, C.pal[2]); }
    const card = el('div', { class: 'card' }, el('h4', null, 'El dinero de 30 días, según la metodología de ' + G.nombre + ' en DefiLlama'), el('p', { class: 'cs' }, 'De izquierda a derecha: lo que pagan los usuarios, lo que retiene el protocolo y lo que llega al token. La banda gris es lo que la fuente no atribuye al protocolo. La emisión, si la hay, va aparte: es otra capa y no se suma. Pulsa un nodo o una banda para ver su serie y su texto de método.'));
    const sk = el('div', { class: 'sk' }); card.append(sk);
    if (window.d3 && d3.sankey && enlaces.length) {
      const W = 920, H = Math.max(220, 60 + nodos.length * 34);
      const g = d3.sankey().nodeWidth(16).nodePadding(18).nodeAlign(d3.sankeyJustify).extent([[8, 10], [W - 8, H - 10]])({ nodes: nodos.map((x) => ({ ...x })), links: enlaces.map((x) => ({ ...x })) });
      const svg = d3.select(sk).append('svg').attr('viewBox', '0 0 ' + W + ' ' + H).attr('role', 'img').attr('aria-label', 'Diagrama de flujos del dinero de 30 días');
      svg.append('g').selectAll('path').data(g.links).join('path').attr('d', d3.sankeyLinkHorizontal()).attr('fill', 'none').attr('stroke', (l) => l.color).attr('stroke-opacity', .4).attr('stroke-width', (l) => Math.max(1.5, l.width)).style('cursor', 'pointer').on('click', (ev, l) => { const n2 = g.nodes[l.target.index]; if (n2.abrir) n2.abrir(); }).on('mousemove touchstart', (ev, l) => C.tip('<b>' + g.nodes[l.source.index].name.split(' · ')[0] + ' → ' + g.nodes[l.target.index].name.split(' · ')[0] + '</b><br>' + m(l.value) + ' en 30 días', (ev.touches && ev.touches[0]) || ev)).on('mouseleave touchend', () => C.tip(null));
      const gn = svg.append('g').selectAll('g').data(g.nodes).join('g').style('cursor', (d) => (d.abrir ? 'pointer' : 'default')).on('click', (ev, d) => { if (d.abrir) d.abrir(); }).on('mousemove touchstart', (ev, d) => C.tip('<b>' + d.name + '</b>' + (d.detalle ? '<br>' + d.detalle : '') + (d.abrir ? '<br><small>pulsa para ver el origen</small>' : ''), (ev.touches && ev.touches[0]) || ev)).on('mouseleave touchend', () => C.tip(null));
      gn.append('rect').attr('x', (d) => d.x0).attr('y', (d) => d.y0).attr('height', (d) => Math.max(2, d.y1 - d.y0)).attr('width', (d) => d.x1 - d.x0).attr('fill', (d) => d.color).attr('rx', 3);
      gn.append('text').attr('x', (d) => (d.x0 < W / 2 ? d.x1 + 6 : d.x0 - 6)).attr('y', (d) => (d.y1 + d.y0) / 2).attr('dy', '0.35em').attr('text-anchor', (d) => (d.x0 < W / 2 ? 'start' : 'end')).text((d) => d.name);
    } else sk.append(el('div', { class: 'sd' }, el('b', null, 'Sin flujo que dibujar. '), 'La fuente solo da comisiones (' + m(Fe) + ') sin desglose de ingresos.'));
    const ley = el('div', { class: 'sk-leyenda' }, nodos.filter((x) => x.detalle).map((x) => el('span', null, el('i', { style: 'background:' + x.color }), x.name.split(' · ')[0])));
    card.append(ley);
    const met = el('div', { class: 'ayuda' }, el('div', { class: 'ai' }, el('b', null, 'Qué cuenta la fuente como comisiones. '), G.m.fees || 'DefiLlama no da el texto.'), el('div', { class: 'ai' }, el('b', null, 'Qué cuenta como ingresos del protocolo. '), G.m.rev || 'DefiLlama no da el texto.'), el('div', { class: 'ai' }, el('b', null, 'Qué cuenta como valor para el token. '), G.m.hold || 'DefiLlama no registra este dato para ' + G.nombre + '.'), G.url ? el('div', { class: 'ai' }, el('b', null, 'Cómo se mide. '), ext(G.url, 'código del adaptador de DefiLlama')) : null);
    const lineas = el('div', { class: 'card' }, el('h4', null, 'Comisiones e ingresos, día a día (1 año)'), graficoLineas(F, { titulo: 'Comisiones e ingresos', series: [{ t: 'Comisiones de usuarios', serie: G.fees, color: C.pal[0], fmt: m, fuente: [G.urls.fees, 'DefiLlama'] }, G.rev ? { t: 'Ingresos del protocolo', serie: G.rev, color: C.pal[4], fmt: m, fuente: [G.urls.rev, 'DefiLlama'] } : null].filter(Boolean), fmt: m }), el('p', { class: 'regla2' }, 'Datos diarios de DefiLlama. ' + (F.pf.length && F.cad ? 'Se muestra la cadena; el protocolo ' + F.pf[0].nombre + ' está en la evidencia.' : '') + ' Los incentivos (pagos en tokens a los usuarios) no tienen fuente gratuita y no aparecen.'));
    return [el('div', { class: 'grid2-1' }, card, el('div', { class: 'pila' }, met, el('div', { class: 'sd' }, el('b', null, 'Incentivos: sin dato gratuito. '), 'DefiLlama los publica solo en su API de pago. Sin ese dato no se puede separar la demanda orgánica de la comprada con incentivos.'))), lineas];
  }

  /* ---- 4 · Captura de valor ---- */
  function secCaptura(F) {
    const s = F.simbolo, G = F.G, md = F.md, fechas = fechasCambio(F);
    const partes = [];
    if (G && G.hold) partes.push(el('div', { class: 'card' }, el('h4', null, 'Valor que llega al token, día a día (1 año)'), el('div', { class: 'ahora' }, m(G.t30.hold), el('small', null, 'en 30 d · ' + m(G.t1a.hold) + ' en 1 año' + (G.t30.fees ? ' · ' + pctAbs(G.t30.hold / G.t30.fees * 100, 0) + ' de las comisiones' : ''))), graficoLineas(F, { titulo: 'Valor para el token', series: [{ t: 'Valor para el token / día', serie: G.hold, color: C.pal[1], fmt: m, fuente: [G.urls.hold, 'DefiLlama'], relleno: true }], fmt: m }), el('p', { class: 'regla2' }, etq('hold'), '«' + (G.m.hold || 'sin texto de método') + '». Pulsa una cifra para abrir la serie con su regla y su origen.')));
    else partes.push(el('div', { class: 'sd' }, el('b', null, 'Valor para el token: ' + (G && G.fees ? 'nada registrado. ' : 'sin dato gratuito. ')), G && G.fees ? 'La fuente registra comisiones pero no quema, recompra ni reparto a los titulares de ' + s + (G && G.m.hold ? '. Texto de la fuente: «' + G.m.hold + '».' : '.') : 'Sin comisiones registradas en DefiLlama no hay forma gratuita de medir lo que llega al token.'));
    const r1 = F.rel.find((r) => r.k === 'captura'); if (r1) partes.push(tarjetaRelacion(F, r1, fechas));
    // validadores: otra capa
    let val;
    if (F.x.quema && F.x.testigos) { const prod = (F.x.testigos.data || []).filter((x) => x.producer), tasas = prod.map((x) => Number(x.annualizedRate)).filter((x) => x > 0), media = tasas.length ? tasas.reduce((a, b) => a + b, 0) / tasas.length : null; val = el('div', { class: 'card' }, el('h4', null, etq('val'), 'TRON'), el('div', { class: 'ahora' }, nt(F.x.quema.actual.emisionDia, 'TRX') + '/día', el('small', null, 'solo emisión: todas las comisiones se queman')), el('p', { class: 'regla2' }, 'Rentabilidad anual media que los 27 productores dan al votante: ' + (media != null ? pctAbs(media, 2) : '—') + '. ', el('a', { class: 'lnk', onclick: () => abrirTestigos(F) }, 'Ver los validadores →'))); }
    else if (F.x.recompensas && F.x.staked) { const r = F.x.recompensas, st = F.x.staked.sum / 1e9; val = el('div', { class: 'card' }, el('h4', null, etq('val'), 'Ethereum'), el('div', { class: 'ahora' }, nt((r.issuance.apr + r.tips.apr + r.mev.apr) * st, 'ETH') + '/año', el('small', null, 'estimación de ultrasound.money')), el('p', { class: 'regla2' }, 'Emisión ' + pctAbs(r.issuance.apr * 100, 2) + ' + propinas ' + pctAbs(r.tips.apr * 100, 2) + ' + MEV ' + pctAbs(r.mev.apr * 100, 2) + ' sobre ' + nt(st, 'ETH') + ' en staking (' + pctAbs(st / md.circulating_supply * 100, 1) + ' de la oferta). Las comisiones base no las cobran: se queman. ', ext(F.urlRec, 'recompensas (ultrasound.money)'))); }
    else if (!F.cadena) val = el('div', { class: 'sd' }, el('b', null, 'Validadores: no aplica. '), s + ' vive sobre otras cadenas y su seguridad la pagan ellas.');
    else if (F.cm.IssTotNtv) { const sI = completos(F.cm.IssTotNtv), fin = HOY0(); val = el('div', { class: 'card' }, el('h4', null, etq('val'), s), el('div', { class: 'ahora' }, nt(suma(sI, fin - 30 * DIA, fin), s), el('small', null, 'emisión en 30 d (Coin Metrics)')), el('p', { class: 'regla2' }, 'Las comisiones que cobran los validadores o mineros no se separan en la fuente gratuita. ', el('a', { class: 'lnk', onclick: abrirCM(F, 'IssTotNtv', 'Emisión diaria de ' + s, (v) => nt(v, s)) }, 'Ver la serie →'))); }
    else val = el('div', { class: 'sd' }, el('b', null, 'Ingresos de validadores: sin dato gratuito. '), 'Ninguna fuente gratuita publica la emisión ni las recompensas de los validadores de ' + s + '.');
    return el('div', { class: 'grid2-1' }, el('div', { class: 'pila' }, partes), el('div', { class: 'pila' }, el('p', { class: 'cs', style: 'margin:0' }, 'Qué cobran los validadores: otra capa, que no se suma a lo anterior.'), val));
  }

  /* ---- 5 · Sostenibilidad: dos series y su cociente ---- */
  function secSostenibilidad(F) {
    const s = F.simbolo, G = F.G, fechas = fechasCambio(F), r2 = F.rel.find((r) => r.k === 'emision'), r3 = F.rel.find((r) => r.k === 'tvl');
    const partes = [];
    if (r2 && !r2.sin) partes.push(el('div', { class: 'card' }, el('h4', null, 'Ingresos del protocolo frente a emisión (sumas de 30 días, en dólares)'), graficoLineas(F, { titulo: 'Ingresos frente a emisión (30 d acumulados)', series: [{ t: 'Ingresos del protocolo (30 d)', serie: r2.serie.map((x) => [x[0], x[2]]), color: C.pal[4], fmt: m, fuente: r2.fuentes[0] }, { t: 'Emisión (30 d)', serie: r2.serie.map((x) => [x[0], x[3]]), color: C.pal[2], fmt: m, fuente: r2.fuentes[1] }], fmt: m }), el('p', { class: 'regla2' }, etq('rev'), 'frente a ', etq('val'), ' Dos capas: lo que entra por comisiones y lo que la red emite para pagar la seguridad. Cuando la primera línea va por encima, las comisiones cubren la emisión.')));
    if (r2) partes.push(tarjetaRelacion(F, r2, fechas));
    const lado = [];
    if (r3) lado.push(tarjetaRelacion(F, r3, fechas));
    if (F.x.quema) { const A = F.x.quema.actual; lado.push(el('div', { class: 'res-head ' + (A.neto30d > 0 ? 'warn' : 'ok'), style: 'margin:0' }, el('div', { class: 'big', style: 'font-size:17px' }, A.neto30d > 0 ? 'Hoy TRON emite más de lo que quema' : 'Hoy TRON quema más de lo que emite'), el('div', { class: 'sub2' }, 'Emisión 30 d ' + nt(A.emision30d, 'TRX') + ' · quema ' + nt(A.quema30d, 'TRX') + ' · neto ' + (A.neto30d > 0 ? '+' : '') + nt(A.neto30d, 'TRX') + ' (' + pct((A.neto30d / 30 * 365.25) / A.ofertaTrx, 2) + ' anualizado). Hecho de la serie diaria, no una opinión.'))); }
    lado.push(el('div', { class: 'sd' }, el('b', null, 'Dependencia de incentivos: sin dato gratuito. '), 'Los pagos en tokens a los usuarios solo están en la API de pago de DefiLlama. El rendimiento del capital depositado es un sustituto rotulado que no los descuenta.'));
    if (!partes.length) partes.push(el('div', { class: 'sd' }, el('b', null, 'Sin ingresos frente a emisión. '), (r2 && r2.sin ? r2.sin : 'sin datos suficientes') + '.'));
    return el('div', { class: 'grid2-1' }, el('div', { class: 'pila' }, partes), el('div', { class: 'pila' }, lado));
  }

  /* ---- 6 · Valoración y riesgo: cuatro paneles ---- */
  function secValoracion(F) {
    const s = F.simbolo, G = F.G, md = F.md;
    // valoración: múltiplos + evolución del múltiplo capitalización / comisiones (365 d) a lo largo del último año
    const valor = el('div', { class: 'pila' }, multiplos(F));
    if (G && G.fees && F.mcapS) { const ac = acumulado(G.fees, 365), c = cociente(F.mcapS, ac); if (c.length > 30) valor.append(el('div', { class: 'card' }, el('h4', null, 'Capitalización / comisiones de 365 días, a lo largo del último año'), graficoLineas(F, { titulo: 'Capitalización / comisiones (365 d)', series: [{ t: 'veces', serie: c.map((x) => [x[0], x[1]]), color: C.pal[0], fmt: (v) => n(v, 0) + ' ×', fuente: [G.urls.fees, 'DefiLlama'] }], fmt: (v) => n(v, 0) + ' ×', clase: 'cvs', nota: 'Capitalización de cada día (CoinGecko) dividida por las comisiones de usuarios de los 365 días anteriores (DefiLlama).' }), el('p', { class: 'regla2' }, 'Mismo numerador, denominador, periodo y beneficiario cada día: por eso la línea es comparable consigo misma. Pulsa un punto para ver las dos cifras.'))); }
    // concentración
    const conc = el('div', { class: 'card' }, el('h4', null, 'Concentración: quién tiene el token'));
    if (F.x.reparto) { const R = F.x.reparto, Gp = R.grupos, NOM = { exchange: 'Casas de cambio', contrato: 'Contratos', fondo_o_institucion: 'Fondos y gestoras', otros_etiquetados: 'Otras con nombre', ballena_sin_identificar: 'Sin nombre en TronScan', atribuido_externo: 'Atribuidas por otras fuentes' }; const filas = Object.keys(NOM).filter((k) => Gp[k] && Gp[k].cuentas > 0).map((k) => [NOM[k], Gp[k].pct, Gp[k].cuentas]); filas.push(['Resto de la red', R.cola.pct, R.cola.cuentas]); const cv = el('canvas'); conc.append(el('p', { class: 'cs' }, 'Las 10.000 mayores cuentas según TronScan, agrupadas por lo que TronScan dice que son, frente a todo el TRX. Las 100 mayores tienen el ' + pctAbs(R.concentracion.top100, 1) + '; la mayor sola, el ' + pctAbs(R.concentracion.top1, 1) + '. Lectura del ' + fd(Date.parse(R.leidoEn)) + '. Pulsa una barra para ver las cuentas.'), el('div', { class: 'cvm' }, cv)); C.chartDefaults(); new Chart(cv, UI.clicable({ type: 'bar', data: { labels: filas.map((f) => f[0]), datasets: [{ data: filas.map((f) => f[1]), backgroundColor: filas.map((f, i) => C.pal[i % C.pal.length]), borderWidth: 0, minBarLength: 3 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false, axis: 'y' }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + pctAbs(c.parsed.x, 1) + ' del TRX · ' + n(filas[c.dataIndex][2]) + (filas[c.dataIndex][2] === 1 ? ' cuenta' : ' cuentas') } } }, scales: { x: { ticks: { callback: (v) => v + ' %' } } } } }, () => window.open('herramientas.html#reparto', '_blank', 'noopener'))); }
    else if (F.x.staked) { const st = F.x.staked.sum / 1e9, lido = F.x.lido && F.precio ? F.x.lido / F.precio : null, circ = md.circulating_supply; const filas = [lido ? ['En staking a través de Lido (aprox.)', lido / circ * 100] : null, ['Resto en staking', (st - (lido || 0)) / circ * 100], ['Sin staking', (circ - st) / circ * 100]].filter(Boolean); const cv = el('canvas'); conc.append(el('p', { class: 'cs' }, 'La lista de titulares de ETH exige clave. Lo que sí hay gratis: cuánto ETH asegura la red y qué parte pasa por Lido (TVL al precio de hoy: aproximación). ' + (F.cm.AdrBalCnt ? n(ultimo(F.cm.AdrBalCnt)[1], 0) + ' direcciones tienen algo de ETH (Coin Metrics).' : '')), el('div', { class: 'cvm' }, cv)); C.chartDefaults(); new Chart(cv, UI.clicable({ type: 'bar', data: { labels: filas.map((f) => f[0]), datasets: [{ data: filas.map((f) => f[1]), backgroundColor: filas.map((f, i) => C.pal[i]), borderWidth: 0, minBarLength: 3 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false, axis: 'y' }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + pctAbs(c.parsed.x, 1) + ' de la oferta' } } }, scales: { x: { ticks: { callback: (v) => v + ' %' } } } } }, () => abrirTexto('ETH en staking y fuera', ['En staking: ' + nt(st, 'ETH') + ' (' + pctAbs(st / circ * 100, 1) + ' de la oferta)' + (lido ? '; a través de Lido ≈ ' + nt(lido, 'ETH') + ' (aproximación con el precio de hoy)' : '') + '.'], [[F.urlStaked, 'ultrasound.money'], F.urlLido ? [F.urlLido, 'TVL de Lido (DefiLlama)'] : null].filter(Boolean), 'Aproximación'))); }
    else if (F.cm.AdrBalCnt) conc.append(el('div', { class: 'ahora' }, nt(ultimo(F.cm.AdrBalCnt)[1]), el('small', null, 'direcciones con saldo (Coin Metrics)')), graficoLineas(F, { titulo: 'Direcciones con saldo', series: [{ t: 'Direcciones con saldo', serie: F.cm.AdrBalCnt, color: C.pal[0], fmt: (v) => n(v, 0), fuente: [F.cmUrl.AdrBalCnt, 'Coin Metrics'] }], fmt: (v) => n(v, 0), clase: 'cvs' }), el('p', { class: 'regla2' }, 'La fuente gratuita no dice cuánto tiene cada una: la lista de titulares exige clave en los exploradores.'));
    else conc.append(el('div', { class: 'sd' }, el('b', null, 'Sin dato gratuito. '), 'La lista de titulares de ' + s + ' exige clave en los exploradores y Coin Metrics (comunidad) no da direcciones con saldo.'));
    // seguridad
    const seg = el('div', { class: 'card' }, el('h4', null, 'Seguridad: quién controla la red y con cuánto'));
    if (F.x.testigos) { const T = F.x.testigos.data || [], prod = T.filter((x) => x.producer).sort((a, b) => b.votes - a.votes), tot = T.reduce((a, x) => a + (x.votes || 0), 0), top = (kk) => prod.slice(0, kk).reduce((a, x) => a + (x.votes || 0), 0) / tot * 100, seQuedan = prod.filter((x) => x.brokerage >= 50).length; const filas = [['El primer productor', top(1)], ['Los 5 primeros', top(5)], ['Los 27 productores', top(27)]]; const cv = el('canvas'); seg.append(el('p', { class: 'cs' }, nt(tot, 'TRX') + ' votando (' + pctAbs(tot / md.circulating_supply * 100, 1) + ' de la oferta) respaldan a ' + n(T.length) + ' candidatos; los 27 con más votos producen bloques. ' + n(seQuedan) + ' de los 27 se quedan la mitad o más de la recompensa; el resto la reparte a sus votantes. Pulsa una barra para ver la lista.'), el('div', { class: 'cvs' }, cv)); C.chartDefaults(); new Chart(cv, UI.clicable({ type: 'bar', data: { labels: filas.map((f) => f[0]), datasets: [{ data: filas.map((f) => f[1]), backgroundColor: [C.pal[3], C.pal[2], C.pal[0]], borderWidth: 0, minBarLength: 3 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false, axis: 'y' }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + pctAbs(c.parsed.x, 1) + ' de los votos' } } }, scales: { x: { min: 0, max: 100, ticks: { callback: (v) => v + ' %' } } } } }, () => abrirTestigos(F))); }
    else if (F.x.staked) { const st = F.x.staked.sum / 1e9, lido = F.x.lido && F.precio ? F.x.lido / F.precio : null; seg.append(el('div', { class: 'ahora' }, pctAbs(st / md.circulating_supply * 100, 1), el('small', null, 'de la oferta en staking · ' + nt(st, 'ETH'))), el('p', { class: 'regla2' }, (lido ? 'Cuota de Lido en el staking ≈ ' + pctAbs(lido / st * 100, 1) + ' (aproximación con el TVL de Lido al precio de hoy). ' : '') + 'La lista de validadores exige clave (beaconcha.in): no se cuenta. Fuente: ', ext(F.urlStaked, 'ultrasound.money'), '.')); }
    else if (F.cm.HashRate) seg.append(el('div', { class: 'ahora' }, n(ultimo(F.cm.HashRate)[1] / 1e6, 0) + ' EH/s', el('small', null, 'potencia de minado, media del día ' + fd(ultimo(F.cm.HashRate)[0]))), graficoLineas(F, { titulo: 'Potencia de minado', series: [{ t: 'EH/s', serie: F.cm.HashRate.map((x) => [x[0], x[1] / 1e6]), color: C.pal[2], fmt: (v) => n(v, 0) + ' EH/s', fuente: [F.cmUrl.HashRate, 'Coin Metrics'] }], fmt: (v) => n(v, 0), clase: 'cvs' }));
    else seg.append(el('div', { class: 'sd' }, el('b', null, 'Sin dato gratuito. '), F.cadena ? 'Validadores y capital en stake de ' + F.cadena.nombre + ': sin fuente gratuita sin clave.' : s + ' es un token sobre otra cadena: su seguridad es la de esa cadena y la de su contrato.'));
    seg.append(el('p', { class: 'regla2' }, 'Hackeos y riesgo de contrato: ', el('a', { href: 'herramientas.html#comprobar' }, 'comprueba una dirección o un contrato en Herramientas →')));
    // ecosistema
    const eco = el('div', { class: 'pila' });
    if (F.cadena) eco.append(el('div', { class: 'card' }, el('h4', null, etq('tvl'), 'Capital depositado en ' + F.cadena.nombre + ' (1 año)'), el('div', { class: 'ahora' }, m(F.tvlS ? ultimo(F.tvlS)[1] : F.cadena.tvl), el('small', null, (F.apps ? n(F.apps.length) + ' aplicaciones con comisiones' : '') + (F.dex24 != null ? ' · DEX ' + m(F.dex24) + '/24 h' : ''))), graficoLineas(F, { titulo: 'TVL de la cadena', series: [{ t: 'TVL', serie: F.tvlS, color: C.pal[8], fmt: m, fuente: [F.urlTvl, 'DefiLlama'], relleno: true }], fmt: m, clase: 'cvs', sin: 'DefiLlama no respondió con el TVL histórico.' })));
    eco.append(aplicaciones(F));
    if (F.repo) { const gh = F.R.gh, rel = F.R.rel; eco.append(el('div', { class: 'card' }, el('h4', null, 'Desarrollo (sin semáforo)'), el('div', { class: 'ahora' }, gh && gh.ok ? n(gh.v.commits) : '—', el('small', null, 'commits en 28 días en la rama por defecto de ' + F.repo)), el('p', { class: 'regla2' }, 'Última versión publicada: ', rel && rel.ok ? el('span', null, ext(rel.v.html_url, rel.v.tag_name || rel.v.name), ' el ' + fd(Date.parse(rel.v.published_at))) : 'ninguna publicada o sin respuesta', '. Repositorios según CoinGecko: ', ...F.repos.slice(0, 5).flatMap((r, i) => [i ? ', ' : '', ext(r, String(r).replace('https://github.com/', ''))]), '. GitHub sin clave (60 lecturas por hora y visitante). Los commits son una aproximación débil: por eso no hay color ni nota.'))); }
    return el('div', { class: 'paneles' }, valor, conc, seg, eco);
  }

  /* ---- relaciones entre métricas: tres cocientes a lo largo de un año, con su regla escrita ---- */
  function calcularRelaciones(F) {
    const s = F.simbolo, G = F.G;
    // emisión diaria en dólares: TRX del fichero diario (emisión × precio del día), resto Coin Metrics IssTotUSD
    let emUsd = null, emFuente = null;
    if (F.x.quema && F.x.quema.ultimos400) { emUsd = F.x.quema.ultimos400.map((r) => [Date.parse(r[0] + 'T00:00:00Z'), r[1] * r[3]]); emFuente = ['data/quema-trx.json', 'lectura diaria de TronScan (emisión × precio del día)']; }
    else if (F.cm.IssTotUSD) { emUsd = F.cm.IssTotUSD; emFuente = [F.cmUrl.IssTotUSD, 'emisión diaria en dólares (Coin Metrics, IssTotUSD)']; }
    const R = [];
    // 1) valor para el token / comisiones (30 días acumulados)
    if (G && G.hold && G.fees) { const c = cociente(acumulado(G.hold, 30), acumulado(G.fees, 30)); if (c.length > 10) R.push({ k: 'captura', t: 'Valor para el token / comisiones de usuarios', num: ['hold', 'valor para el token'], den: ['fees', 'comisiones de usuarios'], serie: c, fmt: (v) => pctAbs(v * 100, 0), fmtAB: m, regla: 'Suma de 30 días de lo que llega al token dividida por la suma de 30 días de lo que pagan los usuarios. Dice qué parte de cada dólar pagado acaba en los titulares (quema, recompra o reparto).', fuentes: [[G.urls.hold, 'valor para el token (DefiLlama)'], [G.urls.fees, 'comisiones de usuarios (DefiLlama)']] }); }
    else R.push({ k: 'captura', t: 'Valor para el token / comisiones de usuarios', sin: G && G.fees ? 'la fuente no registra valor para los titulares de ' + s : 'sin comisiones registradas en DefiLlama' });
    // 2) ingresos del protocolo / emisión (30 días acumulados, en dólares)
    const emAc = emUsd ? acumulado(emUsd, 30) : [];
    if (G && G.rev && emUsd && emAc.length && ultimo(emAc)[1] === 0) R.push({ k: 'emision', t: 'Ingresos del protocolo / emisión', sin: s + ' no ha emitido monedas nuevas en los últimos 30 días: no hay coste de seguridad propio que cubrir, no aplica' });
    else if (G && G.rev && emUsd) { const c = cociente(acumulado(G.rev, 30), emAc); if (c.length > 10) R.push({ k: 'emision', t: 'Ingresos del protocolo / emisión', num: ['rev', 'ingresos del protocolo'], den: ['val', 'emisión en dólares'], serie: c, fmt: (v) => n(v, 2) + ' ×', fmtAB: m, regla: 'Suma de 30 días de ingresos dividida por la suma de 30 días de emisión (monedas nuevas × precio de cada día). Por encima de 1, las comisiones cubren lo que se emite para pagar la seguridad; por debajo, la seguridad se paga con inflación.', fuentes: [[G.urls.rev, 'ingresos del protocolo (DefiLlama)'], emFuente] }); else R.push({ k: 'emision', t: 'Ingresos del protocolo / emisión', sin: 'la emisión no tiene serie suficiente' }); }
    else R.push({ k: 'emision', t: 'Ingresos del protocolo / emisión', sin: !F.cadena ? s + ' no emite para pagar una seguridad propia: no aplica' : !emUsd ? 'sin serie gratuita de emisión en dólares para ' + s : 'sin ingresos registrados en DefiLlama' });
    // 3) ingresos anualizados / capital depositado
    if (G && G.rev && F.tvlS) { const c = cociente(acumulado(G.rev, 30).map((x) => [x[0], x[1] / 30 * 365.25]), F.tvlS); if (c.length > 10) R.push({ k: 'tvl', t: 'Ingresos anualizados / capital depositado', num: ['rev', 'ingresos de 30 días × 365,25/30'], den: ['tvl', 'capital depositado (TVL)'], serie: c, fmt: (v) => pctAbs(v * 100, 2), fmtAB: m, regla: 'Ingresos de 30 días anualizados divididos por el TVL de ese día. Cuánto rinde para el protocolo el dinero depositado. No descuenta incentivos: sin fuente gratuita.', fuentes: [[G.urls.rev, 'ingresos del protocolo (DefiLlama)'], [F.urlTvl, 'TVL histórico (DefiLlama)']] }); }
    else R.push({ k: 'tvl', t: 'Ingresos anualizados / capital depositado', sin: F.cadena ? 'sin serie de TVL o de ingresos' : 'el TVL de un protocolo solo está como dato diario en el índice, sin serie gratuita' });
    return R;
  }
  function tarjetaRelacion(F, r, fechas) {
      const s = F.simbolo;
      const card = el('div', { class: 'card' }, el('h4', null, r.t));
      if (r.sin) { card.append(el('div', { class: 'sd', style: 'margin:8px 0 0' }, el('b', null, 'Sin dato gratuito. '), r.sin + '.')); return card; }
      const ult = desde(r.serie, 365), u = ultimo(r.serie), hace = enFecha(r.serie, u[0] - 365 * DIA);
      card.append(el('div', { class: 'ahora' }, r.fmt(u[1]), el('small', null, 'hoy' + (hace ? ' · hace un año ' + r.fmt(hace[1]) : ''))));
      const cv = el('canvas'); card.append(el('div', { class: 'relcv' }, cv), el('p', { class: 'regla2' }, el('span', null, etq(r.num[0]), '÷ ', etq(r.den[0])), ' ' + r.regla + ' Pulsa un punto para ver las dos cifras de ese día.'));
      const labels = ult.map((x) => fd(x[0]));
      const abrir = (i) => { const x = ult[i]; UI.abrir(r.t + ' · ' + fd(x[0]), () => el('div', null, el('p', { class: 'serie-nota' }, etq(r.num[0]), r.num[1] + ' (30 días hasta ese día): ' + r.fmtAB(x[2]) + '.'), el('p', { class: 'serie-nota' }, etq(r.den[0]), r.den[1] + ': ' + r.fmtAB(x[3]) + '.'), el('div', { class: 'regla' }, r.fmtAB(x[2]) + ' ÷ ' + r.fmtAB(x[3]) + ' = ' + r.fmt(x[1]) + '. ' + r.regla), UI.tabla({ pp: 15, ph: 'Buscar una fecha…', csv: s + '-relacion', rows: r.serie.slice().reverse(), cols: [{ t: 'Día', v: (y) => fd(y[0]), o: (y) => y[0] }, { t: r.num[1], v: (y) => r.fmtAB(y[2]), o: (y) => y[2], num: true, csv: (y) => y[2] }, { t: r.den[1], v: (y) => r.fmtAB(y[3]), o: (y) => y[3], num: true, csv: (y) => y[3] }, { t: 'Cociente', v: (y) => r.fmt(y[1]), o: (y) => y[1], num: true, csv: (y) => y[1] }] }), el('p', { class: 'fuente' }, 'De dónde sale: ', ...r.fuentes.filter(Boolean).flatMap((f, k) => [k ? ' · ' : '', ext(f[0], f[1])]), '.')), { sub: F.nombre, ancho: true }); };
      const cfg = UI.clicable({ type: 'line', data: { labels, datasets: [{ data: ult.map((x) => x[1]), borderColor: C.pal[2], backgroundColor: C.pal[2] + '22', fill: true, borderWidth: 1.6, pointRadius: 0, pointHitRadius: 8, tension: .25, ...puntoHover }] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: tipLineas((c) => ' ' + r.t + ': ' + r.fmt(c.parsed.y)) }, scales: { x: { ticks: { maxTicksLimit: 6, callback: (v, i) => (labels[i] ? labels[i].slice(2, 7) : '') }, grid: { display: false } }, y: { ticks: { maxTicksLimit: 4, callback: (v) => r.fmt(v) }, grid: { color: C.css('--line') } } } } }, (e) => abrir(e.index));
      cfg.plugins = [marcasPlugin(fechas), cruzPlugin];
      C.chartDefaults(); new Chart(cv, cfg);
      return card;
  }

  /* ---- 1) cinco tarjetas con minigráfico ---- */
  function tarjeta(o) {
    const r = o.serie ? variacion(o.serie, o.tipo || 'saldo', o.dias || 30) : null;
    const v = o.var !== undefined ? o.var : (r ? r.v : null);
    const k = el('div', { class: 'kc' + (o.sin ? ' sin' : ''), role: 'button', tabindex: '0', title: o.pista || 'Ver la serie y el origen' }, el('div', { class: 'kl' }, o.l), el('div', { class: 'kv' }, o.v), el('div', { class: 'kn' }, o.n != null ? o.n : (v == null ? (o.serie ? 'sin variación calculable' : '') : el('span', null, el('span', { class: tend(v) }, flecha(v) + pctA(v)), ' en ' + (o.dias || 30) + ' d'))));
    const sp = o.serie ? spark(o.serie, colorTend(v), o.dias || 30, { nombre: o.spNombre || (typeof o.l === 'string' ? o.l : ''), fmt: o.fmt, muestra: typeof o.v === 'string' ? o.v : '' }) : null; if (sp) k.append(sp);
    const go = () => o.abrir && o.abrir();
    k.addEventListener('click', go); k.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    return k;
  }
  function tarjetas(F) {
    const s = F.simbolo, G = F.G, md = F.md, t = [];
    t.push(tarjeta({ l: 'Precio', v: usd(F.precio), serie: F.precioS, tipo: 'saldo', dias: 30, abrir: () => abrirSerie({ titulo: 'Precio · ' + s + ' (365 días)', serie: F.precioS || [], tipo: 'saldo', fmt: (v) => usd(v), fuentes: [[F.urlChart, '365 días de CoinGecko']], csv: s + '-precio', sub: F.nombre }) }));
    t.push(tarjeta({ l: 'Capitalización', v: m(F.mcap), serie: F.mcapS, tipo: 'saldo', dias: 30, abrir: () => abrirSerie({ titulo: 'Capitalización · ' + s + ' (365 días)', serie: F.mcapS || [], tipo: 'saldo', fmt: (v) => m(v), nota: 'Capitalización = precio × circulante.', fuentes: [[F.urlChart, '365 días de CoinGecko'], [F.urlCG, 'ficha de CoinGecko']], csv: s + '-capitalizacion', sub: F.nombre }) }));
    t.push(tarjeta({ l: 'FDV', v: m(F.fdv), n: F.fdv && F.mcap ? 'capitalización / FDV ' + n(F.mcap / F.fdv * 100, 0) + ' %' + (F.mcap / F.fdv < 0.95 ? ' · ' + pctAbs((1 - F.mcap / F.fdv) * 100, 0) + ' aún sin emitir' : '') : 'CoinGecko no da FDV', abrir: () => abrirTexto('FDV de ' + s, ['FDV = precio × oferta total o máxima: lo que valdría el token si todo lo previsto estuviera ya emitido. Hoy ' + m(F.fdv) + ' frente a ' + m(F.mcap) + ' de capitalización.', 'Circulante ' + nt(md.circulating_supply, s) + ' · total ' + nt(md.total_supply, s) + ' · máximo ' + (md.max_supply ? nt(md.max_supply, s) : 'sin máximo fijado') + '.', 'Calendario de desbloqueos (vesting): sin dato gratuito (DefiLlama lo cobra). La diferencia entre capitalización y FDV dice cuánto valor está en monedas aún no emitidas.'], [[F.urlCG, 'ficha de CoinGecko']], 'CoinGecko, ahora') }));
    if (F.x.quema) { const A = F.x.quema.actual; t.push(tarjeta({ l: 'Quema (30 d)', v: nt(A.quema30d, 'TRX'), n: el('span', null, 'emisión ' + nt(A.emision30d, 'TRX') + ' · neto ', el('span', { class: A.neto30d > 0 ? 'dn' : 'up' }, (A.neto30d > 0 ? '+' : '') + nt(A.neto30d, 'TRX'))), serie: G && G.hold, fmt: m, spNombre: 'Quema diaria en dólares (valor para el token)', tipo: 'flujo', dias: 30, abrir: G && G.hold ? abrirLlama(F, G, 'hold', 'TRX quemado (en dólares) · Tron') : null })); }
    else if (G && G.fees) t.push(tarjeta({ l: el('span', null, etq('fees'), '30 d'), v: m(G.t30.fees), serie: G.fees, spNombre: 'Comisiones de usuarios / día', tipo: 'flujo', dias: 30, abrir: abrirLlama(F, G, 'fees', 'Comisiones de usuarios · ' + G.nombre) }));
    else t.push(tarjeta({ l: 'Comisiones de usuarios', v: 'sin dato gratuito', n: 'no hay cadena ni protocolo con comisiones en DefiLlama', sin: true, abrir: () => abrirTexto('Comisiones de ' + s, [s + ' no tiene cadena ni protocolo con comisiones registradas en DefiLlama, la única fuente gratuita con metodología publicada.']) }));
    if (F.cm.AdrActCnt) { const u = ultimo(F.cm.AdrActCnt); t.push(tarjeta({ l: 'Direcciones activas / día', v: nt(u[1]), serie: F.cm.AdrActCnt, tipo: 'flujo', dias: 30, abrir: abrirCM(F, 'AdrActCnt', 'Direcciones activas al día · ' + s, (v) => n(v, 0), 'flujo', 'Direcciones que enviaron o recibieron ese día, según Coin Metrics. Es actividad, no demanda económica.') })); }
    else if (F.stablesS) { const u = ultimo(F.stablesS); t.push(tarjeta({ l: 'Stablecoins en la cadena', v: m(u[1]), serie: F.stablesS, tipo: 'saldo', dias: 30, abrir: () => abrirSerie({ titulo: 'Stablecoins en ' + F.cadena.nombre, serie: F.stablesS, tipo: 'saldo', fmt: (v) => m(v), fuentes: [[F.urlStables, 'stablecoins en DefiLlama']], csv: s + '-stablecoins', sub: F.cadena.nombre }) })); }
    else if (F.prots[0]) { const p = F.prots[0]; t.push(tarjeta({ l: el('span', null, etq('tvl'), p[1]), v: m(p[4]), var: p[7] ? p[4] / p[7] - 1 : null, dias: 30, abrir: () => abrirProtocolo(F, p) })); }
    else t.push(tarjeta({ l: 'Actividad', v: 'sin dato gratuito', n: 'Coin Metrics (comunidad) no cubre ' + s, sin: true, abrir: () => abrirTexto('Actividad de ' + s, ['Coin Metrics (comunidad) no publica direcciones activas ni transacciones de ' + s + '. Las fuentes que sí lo dan exigen clave o son de pago. No se estima.']) }));
    return el('div', { class: 'kp5' }, t);
  }

  /* ---- 2) gráfico grande: cada serie en porcentaje sobre el primer día del periodo ---- */
  function graficoClave(F) {
    const s = F.simbolo;
    const series = [
      F.precioS && { k: 'precio', t: 'Precio', serie: F.precioS, fmt: usd, color: C.pal[0], fuente: [F.urlChart, 'CoinGecko'] },
      F.mcapS && { k: 'mcap', t: 'Capitalización', serie: F.mcapS, fmt: m, color: C.pal[4], fuente: [F.urlChart, 'CoinGecko'] },
      (F.cm.AdrActCnt || F.cm.TxCnt) && { k: 'act', t: F.cm.AdrActCnt ? 'Direcciones activas' : 'Transacciones', serie: F.cm.AdrActCnt || F.cm.TxCnt, fmt: (v) => n(v, 0), color: C.pal[1], fuente: [F.cmUrl.AdrActCnt || F.cmUrl.TxCnt, 'Coin Metrics'] },
      F.G && F.G.fees && { k: 'fees', t: 'Comisiones de usuarios', serie: F.G.fees, fmt: m, color: C.pal[2], fuente: [F.G.urls.fees, 'DefiLlama'] },
      F.G && F.G.hold && { k: 'hold', t: 'Valor para el token', serie: F.G.hold, fmt: m, color: C.pal[3], fuente: [F.G.urls.hold, 'DefiLlama'] },
      F.stablesS && { k: 'stables', t: 'Stablecoins en la cadena', serie: F.stablesS, fmt: m, color: C.pal[5], fuente: [F.urlStables, 'DefiLlama'] },
      F.tvlS && { k: 'tvl', t: 'TVL de la cadena', serie: F.tvlS, fmt: m, color: C.pal[8], fuente: [F.urlTvl, 'DefiLlama'] },
    ].filter(Boolean);
    const card = el('div', { class: 'card' });
    if (!series.length) { card.append(el('h4', null, 'Evolución clave'), el('p', { class: 'sd' }, 'Ninguna fuente gratuita da series históricas para ' + s + '.')); return card; }
    const apagadas = new Set(['stables', 'tvl', 'mcap'].filter((k) => series.length > 4));
    let dias = 365, grafico = null;
    const cv = el('canvas'); const wrap = el('div', { class: 'gcv' }, cv);
    const per = el('div', { class: 'per' }, [7, 30, 90, 365].map((d) => el('button', { type: 'button', class: d === dias ? 'on' : '', onclick: (e) => { dias = d; per.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); dibujar(); } }, d === 365 ? '1 año' : d + ' d')));
    const leyenda = el('div', { class: 'leyenda' }, series.map((x) => el('button', { type: 'button', class: apagadas.has(x.k) ? 'off' : '', onclick: (e) => { if (apagadas.has(x.k)) apagadas.delete(x.k); else apagadas.add(x.k); e.currentTarget.classList.toggle('off', apagadas.has(x.k)); dibujar(); } }, el('i', { style: 'background:' + x.color }), x.t)));
    card.append(el('h4', null, 'Evolución clave', el('span', { class: 'muted', style: 'font-weight:400;font-size:12px' }, 'cada línea en % sobre su primer día del periodo'), per), wrap, leyenda, el('p', { class: 'hint' }, 'Pulsa un punto para ver los valores reales de ese día y de dónde salen. Los flujos diarios (comisiones, valor para el token) se suavizan con la media de 7 días para que se lean; la tabla de abajo tiene el dato diario exacto.'));
    const media7 = (serie) => serie.map((x, i) => { const w = serie.slice(Math.max(0, i - 6), i + 1); return [x[0], w.reduce((a, y) => a + y[1], 0) / w.length]; });
    function dibujar() {
      const d0 = HOY0() - dias * DIA;
      const sets = series.filter((x) => !apagadas.has(x.k)).map((x) => {
        const base = (x.k === 'fees' || x.k === 'hold') ? media7(x.serie) : x.serie;
        const pts = base.filter((p) => p[0] >= d0 - DIA); const first = pts.find((p) => p[1] > 0);
        return { x, pts, first, data: pts.map((p) => ({ x: p[0], y: first ? (p[1] / first[1]) * 100 : null, raw: p[1] })) };
      }).filter((d) => d.first && d.pts.length > 1);
      const dias_ = [...new Set(sets.flatMap((d) => d.data.map((p) => fd(p.x))))].sort();
      const cfg = { type: 'line', data: { labels: dias_, datasets: sets.map((d) => ({ label: d.x.t, data: dias_.map((dia) => { const p = d.data.find((q) => fd(q.x) === dia); return p ? p.y : null; }), borderColor: d.x.color, backgroundColor: d.x.color, borderWidth: 1.8, pointRadius: dias <= 30 ? 2.5 : 0, pointHitRadius: 8, tension: .25, spanGaps: true, ...puntoHover })) },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: tipLineas((c) => { const d = sets[c.datasetIndex]; const p = d.data.find((q) => fd(q.x) === c.label); return ' ' + d.x.t + ': ' + (p && p.raw != null ? d.x.fmt(p.raw) : '—') + ' (' + n(c.parsed.y, 0) + ' %)'; }) },
          scales: { x: { ticks: { maxTicksLimit: 12, callback: (v, i) => { const d = dias_[i]; return d ? (dias > 90 ? ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][Number(d.slice(5, 7)) - 1] + (d.slice(5, 7) === '01' ? ' ' + d.slice(0, 4) : '') : d.slice(5)) : ''; } }, grid: { display: false } }, y: { ticks: { callback: (v) => n(v, 0) + ' %' }, grid: { color: C.css('--line') } } } } };
      UI.clicable(cfg, (e) => { const dia = dias_[e.index]; abrirDia(F, series, dia); });
      cfg.plugins = [marcasPlugin(fechasCambio(F)), cruzPlugin];
      if (grafico) grafico.destroy();
      C.chartDefaults(); grafico = new Chart(cv, cfg);
    }
    dibujar();
    return card;
  }
  function abrirDia(F, series, dia) {
    const t0 = Date.parse(dia + 'T00:00:00Z');
    UI.abrir('Valores del ' + dia, () => el('div', null, el('p', { class: 'serie-nota' }, 'Cada serie con su valor real ese día (o el punto más cercano) y su fuente. En el gráfico se dibujan en porcentaje sobre el primer día del periodo para que quepan en un mismo eje.'),
      UI.tabla({ pp: 10, buscar: false, rows: series.map((x) => { const p = enFecha(x.serie, t0 + 12 * 3600000); return { t: x.t, p, x }; }), cols: [{ t: 'Serie', v: (r) => r.t }, { t: 'Valor', v: (r) => (r.p ? r.x.fmt(r.p[1]) : '—'), num: true }, { t: 'Día del dato', v: (r) => (r.p ? fd(r.p[0]) : '—') }, { t: 'Fuente', v: (r) => ext(r.x.fuente[0], r.x.fuente[1]) }] })), { sub: F.nombre, ancho: true });
  }

  /* ---- 3) tarta: de quién es el token ---- */
  function tarta(F) {
    const s = F.simbolo, md = F.md, card = el('div', { class: 'card' });
    let trozos = [], titulo = 'Reparto del suministro', nota = '', fuentes = [], onTrozo = null;
    if (F.x.reparto) {
      const R = F.x.reparto, G = R.grupos, NOM = { exchange: 'Casas de cambio', contrato: 'Contratos', fondo_o_institucion: 'Fondos y gestoras', otros_etiquetados: 'Otras con nombre', ballena_sin_identificar: 'Sin nombre en TronScan (10.000 mayores)', atribuido_externo: 'Atribuidas por otras fuentes' };
      trozos = Object.keys(NOM).filter((k) => G[k] && G[k].cuentas > 0).map((k) => ({ t: NOM[k], v: G[k].trx, p: G[k].pct, sub: n(G[k].cuentas) + ' cuentas' }));
      trozos.push({ t: 'Resto de la red', v: R.cola.trx, p: R.cola.pct, sub: n(R.cola.cuentas) + ' cuentas pequeñas' });
      titulo = 'De quién es el TRX'; nota = 'Las 10.000 mayores cuentas según TronScan, agrupadas por lo que TronScan dice que son, frente a todo el TRX. Lectura diaria del ' + fd(Date.parse(R.leidoEn)) + '. Pulsa un trozo para ver las cuentas.';
      fuentes = [['https://apilist.tronscanapi.com/api/account/list?sort=-balance&limit=50&start=0', 'lista de cuentas de TronScan']];
      onTrozo = () => window.open('herramientas.html#reparto', '_blank', 'noopener');
    } else if (F.x.staked && md.circulating_supply) {
      const st = F.x.staked.sum / 1e9, lido = F.x.lido && F.precio ? F.x.lido / F.precio : null;
      trozos = [lido ? { t: 'En staking a través de Lido (aprox.)', v: lido, p: lido / md.circulating_supply * 100, sub: 'TVL de Lido al precio de hoy' } : null, { t: lido ? 'Resto en staking' : 'En staking', v: st - (lido || 0), p: (st - (lido || 0)) / md.circulating_supply * 100, sub: 'ultrasound.money' }, { t: 'Sin staking', v: md.circulating_supply - st, p: (md.circulating_supply - st) / md.circulating_supply * 100, sub: 'circulante menos staking' }].filter(Boolean);
      titulo = 'ETH en staking y fuera'; nota = 'La lista de titulares de ETH exige clave: lo que sí hay gratis es cuánto ETH asegura la red y cuánto de eso pasa por Lido (aproximación con el precio de hoy).';
      fuentes = [[F.urlStaked, 'ETH en staking (ultrasound.money)'], F.urlLido ? [F.urlLido, 'TVL de Lido (DefiLlama)'] : null].filter(Boolean);
    } else if (F.x.testigos && md.circulating_supply) {
      const tot = (F.x.testigos.data || []).reduce((a, x) => a + (x.votes || 0), 0);
      trozos = [{ t: 'Votando (en stake)', v: tot, p: tot / md.circulating_supply * 100 }, { t: 'Sin votar', v: md.circulating_supply - tot, p: (md.circulating_supply - tot) / md.circulating_supply * 100 }];
    } else {
      const circ = md.circulating_supply, tot = md.total_supply, max = md.max_supply;
      trozos = [{ t: 'En circulación', v: circ, p: 100 * circ / (max || tot || circ), sub: 'CoinGecko' }];
      if (tot && tot > circ * 1.001) trozos.push({ t: 'Emitido pero no circulante', v: tot - circ, p: 100 * (tot - circ) / (max || tot), sub: 'bloqueado, tesorería o vesting (CoinGecko no lo separa)' });
      if (max && max > (tot || circ) * 1.001) trozos.push({ t: 'Aún sin emitir', v: max - (tot || circ), p: 100 * (max - (tot || circ)) / max, sub: 'hasta el máximo' });
      nota = (F.cm.AdrBalCnt ? n(ultimo(F.cm.AdrBalCnt)[1], 0) + ' direcciones tienen algo de ' + s + ' (Coin Metrics), pero la fuente gratuita no dice cuánto cada una. ' : 'La lista de titulares de ' + s + ' exige clave en los exploradores. ') + 'Por eso la tarta reparte la oferta en circulante, emitido no circulante y aún sin emitir.';
      fuentes = [[F.urlCG, 'ficha de CoinGecko'], F.cmUrl.AdrBalCnt ? [F.cmUrl.AdrBalCnt, 'direcciones con saldo (Coin Metrics)'] : null].filter(Boolean);
    }
    const cv = el('canvas'); const ul = el('ul');
    const abrir = (i) => { if (onTrozo) return onTrozo(trozos[i]); abrirTexto(titulo + ' · ' + trozos[i].t, [nt(trozos[i].v, s) + ' (' + pctAbs(trozos[i].p, 1) + '). ' + (trozos[i].sub || ''), nota], fuentes, F.nombre); };
    trozos.forEach((t, i) => ul.append(el('li', { onclick: () => abrir(i) }, el('i', { style: 'background:' + C.pal[i % C.pal.length] }), el('span', null, t.t, t.sub ? el('small', null, ' · ' + t.sub) : null), el('b', null, pctAbs(t.p, 1)))));
    card.append(el('h4', null, titulo), el('div', { class: 'tarta' }, el('div', { class: 'cv' }, cv), ul), nota ? el('p', { class: 'hint' }, nota) : null);
    C.chartDefaults();
    new Chart(cv, UI.clicable({ type: 'doughnut', data: { labels: trozos.map((t) => t.t), datasets: [{ data: trozos.map((t) => t.v), backgroundColor: trozos.map((t, i) => C.pal[i % C.pal.length]), borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + nt(c.parsed, s) + ' · ' + pctAbs(trozos[c.dataIndex].p, 1) } } } } }, (e) => abrir(e.index)));
    return card;
  }

  /* ---- 4) la pregunta guía en cinco líneas, con su cifra ---- */
  function preguntaGuia(F) {
    const G = F.G, C30 = (k) => (G && G.t30 && G.t30[k] != null ? G.t30[k] : null), em30 = emision30Usd(F);
    let e1 = null;
    if (F.x.quema) e1 = 'Oferta ' + pct(F.x.quema.actual.neto30d / F.x.quema.actual.ofertaTrx, 2) + ' en 30 días (emisión menos quema)';
    else if (F.cm.SplyCur) { const r = variacion(F.cm.SplyCur, 'saldo', 30); e1 = r ? 'Oferta ' + pct(r.v, 2) + ' en 30 días' : null; }
    if (!e1 && F.md.max_supply && F.md.circulating_supply) e1 = 'Emitido el ' + pctAbs(F.md.circulating_supply / F.md.max_supply * 100, 1) + ' del máximo';
    let e2 = null;
    if (F.cm.AdrActCnt) { const u = ultimo(F.cm.AdrActCnt), r = variacion(F.cm.AdrActCnt, 'flujo', 30); e2 = nt(u[1]) + ' direcciones activas/día' + (r ? ' · ' + flecha(r.v) + pctA(r.v) + ' en 30 d' : ''); }
    else if (F.stablesS) e2 = m(ultimo(F.stablesS)[1]) + ' en stablecoins en la cadena';
    else if (F.prots[0] && F.prots[0][4]) e2 = m(F.prots[0][4]) + ' depositados (TVL) en ' + F.prots[0][1];
    const filas = [
      ['¿Cómo funciona su economía?', e1 || 'Sin serie de oferta gratuita'],
      ['¿De dónde procede su demanda?', e2 || 'Sin actividad on-chain gratuita'],
      ['¿Cómo genera ingresos?', C30('fees') != null ? m(C30('fees')) + ' en comisiones de usuarios en 30 d' + (C30('rev') != null ? ' · ' + m(C30('rev')) + ' para el protocolo' : '') : 'Sin fuente de comisiones'],
      ['¿Qué parte captura el token?', C30('hold') != null ? m(C30('hold')) + ' para el token en 30 d' + (C30('fees') ? ' · ' + pctAbs(C30('hold') / C30('fees') * 100, 0) + ' de las comisiones' : '') : 'La fuente no registra valor para el token'],
      ['¿Es sostenible su modelo?', em30 === 0 ? 'Sin emisión en 30 d: no hay coste de seguridad propio' : C30('rev') != null && em30 ? 'Ingresos 30 d = ' + n(C30('rev') / em30, 2) + ' × la emisión de 30 d' : em30 ? 'Emisión de 30 d ≈ ' + m(em30) + ' (sin ingresos para comparar)' : 'Sin emisión medible gratis'],
    ];
    return el('div', { class: 'card' }, el('h4', null, 'La pregunta guía, en cinco partes'), el('div', { class: 'fq' }, filas.map(([q, v], i) => el('a', { href: '#paso-' + (i + 1), onclick: (e) => { e.preventDefault(); const f = document.getElementById('paso-' + (i + 1)); if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'center' }); f.classList.add('flash'); setTimeout(() => f.classList.remove('flash'), 1800); } } }, el('span', { class: 'n' }, i + 1), el('span', null, el('b', null, q), el('span', { class: 'v' }, v))))), el('p', { class: 'hint' }, 'Cifras, no juicios: cada línea lleva a su paso en la tabla de abajo.'));
  }

  /* ---- 5) tabla de detalle por los seis pasos ---- */
  const ESTADO = { vivo: ['', 'En vivo'], dia: ['dia', 'Diario'], sin: ['sin', 'Sin dato gratuito'] };
  function tablaDetalle(F) {
    const s = F.simbolo, G = F.G, md = F.md, rows = [];
    const fila = (paso, o) => rows.push({ paso, ...o });
    const serieCM = (k) => F.cm[k] || null;
    // 1 · Economía del token
    fila(1, { t: 'En circulación', v: nt(md.circulating_supply, s), sub: md.max_supply ? 'de un máximo de ' + nt(md.max_supply, s) + ' (' + pctAbs(md.circulating_supply / md.max_supply * 100, 1) + ' emitido)' : md.total_supply && md.total_supply > md.circulating_supply * 1.001 ? 'de ' + nt(md.total_supply, s) + ' emitidos; sin máximo' : 'sin máximo fijado: todo lo emitido circula', serie: serieCM('SplyCur'), tipo: 'saldo', fuente: serieCM('SplyCur') ? 'CoinGecko + Coin Metrics' : 'CoinGecko', estado: 'vivo', abrir: () => abrirSerie({ titulo: 'Oferta de ' + s, serie: serieCM('SplyCur') || [], tipo: 'saldo', fmt: (v) => nt(v, s), nota: 'Circulante, total y máximo según CoinGecko hoy: ' + nt(md.circulating_supply, s) + ' · ' + nt(md.total_supply, s) + ' · ' + (md.max_supply ? nt(md.max_supply, s) : 'sin máximo') + '. La serie, si la hay, es la oferta existente según Coin Metrics (monedas ya creadas, bloqueadas o no): por eso puede ser mayor que el circulante.', fuentes: [[F.urlCG, 'ficha de CoinGecko'], F.cmUrl.SplyCur ? [F.cmUrl.SplyCur, 'oferta diaria en Coin Metrics'] : null].filter(Boolean), csv: s + '-oferta', sub: F.nombre }) });
    if (F.x.quema) { const A = F.x.quema.actual, Q = F.x.quema; const verQ = () => window.open('herramientas.html#quema', '_blank', 'noopener');
      fila(1, { t: 'Emisión diaria', v: nt(A.emisionDia, 'TRX'), sub: nt(A.emision30d, 'TRX') + ' en 30 d · recompensas a validadores y votantes', fuente: 'TronScan (EquipoIA)', estado: 'dia', abrir: verQ, pista: 'Ver quema y emisión' });
      fila(1, { t: 'Quema diaria', v: nt(A.quemaDia, 'TRX'), sub: nt(A.quema30d, 'TRX') + ' en 30 d · comisiones destruidas · tendencia en dólares (DefiLlama)', serie: G && G.hold, fmt: m, spNombre: 'Quema diaria en dólares (valor para el token)', tipo: 'flujo', fuente: 'TronScan (EquipoIA) · DefiLlama', estado: 'dia', abrir: verQ });
      fila(1, { t: (A.neto30d > 0 ? 'Inflación' : 'Deflación') + ' observada (30 d, anualizada)', v: pct((A.neto30d / 30 * 365.25) / A.ofertaTrx, 2), sub: 'neto de 30 días ' + (A.neto30d > 0 ? '+' : '') + nt(A.neto30d, 'TRX') + ' · régimen ' + (A.neto30d > 0 ? 'inflacionario' : 'deflacionario') + ' · serie hasta el ' + Q.hasta, fuente: 'TronScan (EquipoIA)', estado: 'dia', abrir: verQ });
      if (F.x.params) { const p = Object.fromEntries((F.x.params.chainParameter || []).map((x) => [x.key, x.value])); const porBloque = (Number(p.getWitnessPayPerBlock || 0) + Number(p.getWitness127PayPerBlock || 0)) / 1e6; fila(1, { t: 'Emisión confirmada en la red', v: nt(porBloque * 28800, 'TRX') + '/día', sub: n(Number(p.getWitnessPayPerBlock || 0) / 1e6) + ' TRX al productor + ' + n(Number(p.getWitness127PayPerBlock || 0) / 1e6) + ' TRX a los 127 candidatos por bloque × 28.800 bloques', fuente: 'TronGrid', estado: 'vivo', abrir: () => abrirTexto('Emisión confirmada en los parámetros de la red TRON', ['Cada bloque (uno cada 3 segundos, 28.800 al día) paga ' + n(Number(p.getWitnessPayPerBlock || 0) / 1e6) + ' TRX al productor y reparte ' + n(Number(p.getWitness127PayPerBlock || 0) / 1e6) + ' TRX entre los 127 candidatos con más votos: ' + n(porBloque) + ' TRX por bloque, ' + nt(porBloque * 28800, 'TRX') + ' al día. Es el dato confirmado; la serie diaria de TronScan lo observa a posteriori.'], [[F.urlParams, 'parámetros de la red en TronGrid']], 'Confirmado') }); }
      if (F.x.desbloqueos) fila(1, { t: 'TRX que sale del stake (14 días)', v: nt(F.x.desbloqueos.calendario.porFecha.slice(0, 14).reduce((a, x) => a + x.trx, 0), 'TRX'), sub: 'descongelaciones ya pedidas; no es un calendario de inversores (eso no existe gratis)', fuente: 'TronScan (EquipoIA)', estado: 'dia', abrir: () => window.open('herramientas.html#desbloqueos', '_blank', 'noopener') });
    } else if (F.x.recompensas && F.x.staked) { const apr = F.x.recompensas.issuance.apr, st = F.x.staked.sum / 1e9; fila(1, { t: 'Emisión anual (estimada)', v: nt(apr * st, 'ETH'), sub: pctAbs(apr * 100, 2) + ' de rentabilidad por emisión sobre ' + nt(st, 'ETH') + ' en staking', serie: serieCM('IssTotNtv'), tipo: 'flujo', fuente: 'ultrasound.money' + (serieCM('IssTotNtv') ? ' · Coin Metrics' : ''), estado: 'vivo', abrir: () => abrirSerie({ titulo: 'Emisión de ETH', serie: serieCM('IssTotNtv') || [], fmt: (v) => nt(v, 'ETH'), nota: 'ultrasound.money da la rentabilidad por emisión (' + pctAbs(apr * 100, 2) + ' anual) y el ETH en staking (' + nt(st, 'ETH') + '); su producto es la emisión anual estimada. La serie, si la hay, es la emisión diaria según Coin Metrics.', fuentes: [[F.urlRec, 'recompensas de validadores (ultrasound.money)'], [F.urlStaked, 'ETH en staking (ultrasound.money)'], F.cmUrl.IssTotNtv ? [F.cmUrl.IssTotNtv, 'emisión diaria en Coin Metrics'] : null].filter(Boolean), csv: 'ETH-emision', sub: F.nombre }) }); }
    else if (serieCM('IssTotNtv')) { const sI = completos(serieCM('IssTotNtv')), fin = HOY0(), e30 = suma(sI, fin - 30 * DIA, fin), sply = serieCM('SplyCur') ? ultimo(serieCM('SplyCur'))[1] : md.circulating_supply; fila(1, { t: 'Emisión en 30 días', v: nt(e30, s), sub: sply ? pct((e30 / 30 * 365.25) / sply, 2) + ' anualizado sobre la oferta (observado)' : 'monedas nuevas', serie: serieCM('IssTotNtv'), tipo: 'flujo', fuente: 'Coin Metrics', estado: 'vivo', abrir: abrirCM(F, 'IssTotNtv', 'Emisión diaria de ' + s, (v) => nt(v, s)) }); }
    else fila(1, { t: 'Emisión y quema diarias', estado: 'sin', motivo: 'Coin Metrics (comunidad) no publica la emisión de ' + s + (F.cobertura.length ? '.' : ' ni ninguna otra métrica on-chain.') + ' Se muestra solo lo que da CoinGecko.', fuente: '—' });
    if (!F.x.quema && G && G.hold && G.m.hold && /burn|quema/i.test(G.m.hold)) fila(1, { t: 'Quemado o recomprado (30 d)', etq: 'hold', v: m(G.t30.hold), sub: '«' + (G.m.hold.length > 140 ? G.m.hold.slice(0, 140) + '…' : G.m.hold) + '»', serie: G.hold, tipo: 'flujo', fuente: 'DefiLlama', estado: 'vivo', abrir: abrirLlama(F, G, 'hold', 'Valor que llega al token · ' + G.nombre) });
    fila(1, { t: 'Capitalización / FDV', v: F.fdv && F.mcap ? n(F.mcap / F.fdv * 100, 0) + ' %' : '—', sub: F.fdv && F.mcap ? (F.mcap / F.fdv < 0.95 ? pctAbs((1 - F.mcap / F.fdv) * 100, 0) + ' del valor en monedas aún no emitidas' : 'casi todo lo que existirá ya circula') : 'CoinGecko no da FDV', serie: F.mcapS, fmt: m, spNombre: 'Capitalización', tipo: 'saldo', fuente: 'CoinGecko', estado: 'vivo', abrir: () => abrirSerie({ titulo: 'Capitalización · ' + s, serie: F.mcapS || [], tipo: 'saldo', fmt: (v) => m(v), nota: 'FDV ' + m(F.fdv) + ' = precio × oferta total o máxima. Calendario de desbloqueos (vesting): sin dato gratuito (DefiLlama lo cobra).', fuentes: [[F.urlChart, '365 días de CoinGecko'], [F.urlCG, 'ficha de CoinGecko']], csv: s + '-capitalizacion', sub: F.nombre }) });
    if (!F.x.quema) fila(1, { t: 'Calendario de desbloqueos (vesting)', estado: 'sin', motivo: 'No hay fuente gratuita fiable (DefiLlama lo cobra). La diferencia entre capitalización y FDV dice cuánto valor está en monedas aún no emitidas.', fuente: '—' });
    // 2 · Actividad y demanda (escalera)
    if (serieCM('AdrActCnt')) fila(2, { t: '1 · Actividad: direcciones activas / día', v: nt(ultimo(serieCM('AdrActCnt'))[1]), sub: 'el ' + fd(ultimo(serieCM('AdrActCnt'))[0]) + ' · una dirección no es una persona', serie: serieCM('AdrActCnt'), tipo: 'flujo', fuente: 'Coin Metrics', estado: 'vivo', abrir: abrirCM(F, 'AdrActCnt', 'Direcciones activas al día · ' + s, (v) => n(v, 0), 'flujo', 'Direcciones que enviaron o recibieron ese día. Es actividad, no demanda económica.') });
    if (serieCM('TxCnt')) fila(2, { t: '1 · Actividad: transacciones / día', v: nt(ultimo(serieCM('TxCnt'))[1]), sub: serieCM('TxTfrCnt') ? n(ultimo(serieCM('TxTfrCnt'))[1], 0) + ' transferencias' : '', serie: serieCM('TxCnt'), tipo: 'flujo', fuente: 'Coin Metrics', estado: 'vivo', abrir: abrirCM(F, 'TxCnt', 'Transacciones al día · ' + s) });
    if (!serieCM('AdrActCnt') && !serieCM('TxCnt')) fila(2, { t: '1 · Actividad: direcciones y transacciones', estado: 'sin', motivo: 'Coin Metrics (comunidad) no cubre ' + s + '. Las fuentes que sí lo dan (exploradores, Dune, Artemis, Token Terminal) exigen clave o son de pago. No se estima.', fuente: '—' });
    if (F.x.tron) { const d = F.x.tron.data || [], u = d[d.length - 1]; if (u) { const serieU = d.map((x) => [x.date, x.usdt_transaction]); fila(2, { t: '1 · Actividad: TronScan, cuentas activas y USDT', v: nt(u.active_account_number) + ' cuentas', sub: n(u.newAddressSeen, 0) + ' cuentas nuevas · ' + n(u.usdt_transaction, 0) + ' transacciones de USDT · energía ' + n(u.energy_usage / 1e9, 1) + ' G · ' + u.dateDayStr, serie: serieU, tipo: 'flujo', dias: 7, fuente: 'TronScan', estado: 'vivo', abrir: () => abrirSerie({ titulo: 'Transacciones de USDT al día en TRON', serie: serieU, fmt: (v) => n(v, 0), nota: 'Operaciones del contrato de USDT (TRC-20) cada día según TronScan (31 días). Cuentas activas: ' + n(u.active_account_number, 0) + '; nuevas: ' + n(u.newAddressSeen, 0) + ' el ' + u.dateDayStr + '.', fuentes: [[F.urlTron, 'actividad diaria en TronScan']], csv: 'TRX-usdt-transacciones', sub: 'TRON' }) }); } }
    if (F.stablesS) fila(2, { t: '2 · Uso económico: stablecoins en la cadena', v: m(ultimo(F.stablesS)[1]), sub: 'dinero que la gente decide tener en esta red', serie: F.stablesS, tipo: 'saldo', fuente: 'DefiLlama', estado: 'vivo', abrir: () => abrirSerie({ titulo: 'Stablecoins en ' + F.cadena.nombre, serie: F.stablesS, tipo: 'saldo', fmt: (v) => m(v), fuentes: [[F.urlStables, 'stablecoins en DefiLlama']], csv: s + '-stablecoins', sub: F.cadena.nombre }) });
    if (F.dexS) fila(2, { t: '2 · Uso económico: volumen en intercambios descentralizados', v: m(F.dex24) + '/24 h', sub: 'negociado en los DEX de la cadena', serie: F.dexS, tipo: 'flujo', fuente: 'DefiLlama', estado: 'vivo', abrir: () => abrirSerie({ titulo: 'Volumen DEX en ' + F.cadena.nombre, serie: F.dexS, fmt: (v) => m(v), fuentes: [[F.urlDex, 'DEX de la cadena en DefiLlama']], csv: s + '-volumen-dex', sub: F.cadena.nombre }) });
    for (const p of F.prots.slice(0, 2)) fila(2, { t: '2 · Uso económico: ' + p[1], etq: 'tvl', v: m(p[4]), sub: 'en ' + n(p[3]) + ' cadenas' + (p[10] ? ' · ' + n(p[10].length) + ' partes' : ''), var: p[7] ? p[4] / p[7] - 1 : null, fuente: 'DefiLlama (índice diario)', estado: 'dia', abrir: () => abrirProtocolo(F, p) });
    if (!F.stablesS && !F.dexS && !F.prots.length) fila(2, { t: '2 · Uso económico: valor transferido, stablecoins, DEX', estado: 'sin', motivo: 'El valor transferido en la propia moneda lo reserva Coin Metrics a su plan de pago, y ' + s + ' no es una cadena ni un protocolo con datos en DefiLlama.', fuente: '—' });
    if (G && G.fees) fila(2, { t: '3 · Monetización (30 d)', etq: 'fees', v: m(G.t30.fees), sub: G.nombre, serie: G.fees, spNombre: 'Comisiones de usuarios / día', tipo: 'flujo', fuente: 'DefiLlama', estado: 'vivo', abrir: abrirLlama(F, G, 'fees', 'Comisiones de usuarios · ' + G.nombre) });
    else fila(2, { t: '3 · Monetización: comisiones de usuarios', estado: 'sin', motivo: s + ' no tiene cadena ni protocolo con comisiones registradas en DefiLlama.', fuente: '—' });
    if (G && G.hold) fila(2, { t: '4 · Captura (30 d)', etq: 'hold', v: m(G.t30.hold), sub: G.t30.fees ? pctAbs(G.t30.hold / G.t30.fees * 100, 0) + ' de las comisiones' : '', serie: G.hold, spNombre: 'Valor para el token / día', tipo: 'flujo', fuente: 'DefiLlama', estado: 'vivo', abrir: abrirLlama(F, G, 'hold', 'Valor que llega al token · ' + G.nombre) });
    else fila(2, { t: '4 · Captura: lo que llega al token', estado: 'sin', motivo: G && G.fees ? 'La fuente registra comisiones pero no quema, recompra ni reparto a los titulares de ' + s + (G.m.hold ? '. Texto de la fuente: «' + G.m.hold + '».' : '.') : 'Sin comisiones registradas no hay forma gratuita de medir lo que llega al token.', fuente: '—' });
    // 3 · Monetización
    for (const Gi of [F.cad, ...F.pf].filter(Boolean)) {
      if (Gi.fees) fila(3, { t: Gi.nombre + ' · 24 h', etq: 'fees', v: m(Gi.t24.fees) + '/24 h', sub: m(Gi.t30.fees) + ' en 30 d · ' + m(Gi.t1a.fees) + ' en 1 año · «' + (Gi.m.fees || 'sin texto de método').slice(0, 120) + (Gi.m.fees && Gi.m.fees.length > 120 ? '…' : '') + '»', serie: Gi.fees, tipo: 'flujo', fuente: 'DefiLlama', estado: 'vivo', abrir: abrirLlama(F, Gi, 'fees', 'Comisiones de usuarios · ' + Gi.nombre) });
      if (Gi.rev) fila(3, { t: Gi.nombre + ' · 24 h', etq: 'rev', v: m(Gi.t24.rev) + '/24 h', sub: m(Gi.t30.rev) + ' en 30 d · ' + m(Gi.t1a.rev) + ' en 1 año' + (Gi.t30.fees ? ' · ' + pctAbs(Gi.t30.rev / Gi.t30.fees * 100, 0) + ' de las comisiones' : '') + ' · «' + (Gi.m.rev || 'sin texto de método').slice(0, 120) + (Gi.m.rev && Gi.m.rev.length > 120 ? '…' : '') + '»', serie: Gi.rev, tipo: 'flujo', fuente: 'DefiLlama', estado: 'vivo', abrir: abrirLlama(F, Gi, 'rev', 'Ingresos del protocolo · ' + Gi.nombre) });
    }
    fila(3, { t: 'Incentivos (pagos en tokens a los usuarios)', estado: 'sin', motivo: 'DefiLlama los publica solo en su API de pago. Sin ese dato no se puede separar la demanda orgánica de la comprada con incentivos.', fuente: '—' });
    // 4 · Captura de valor
    for (const Gi of [F.cad, ...F.pf].filter(Boolean)) if (Gi.hold) fila(4, { t: Gi.nombre + ' · 24 h', etq: 'hold', v: m(Gi.t24.hold) + '/24 h', sub: m(Gi.t30.hold) + ' en 30 d · ' + m(Gi.t1a.hold) + ' en 1 año · «' + (Gi.m.hold || 'sin texto').slice(0, 140) + (Gi.m.hold && Gi.m.hold.length > 140 ? '…' : '') + '»', serie: Gi.hold, tipo: 'flujo', fuente: 'DefiLlama', estado: 'vivo', abrir: abrirLlama(F, Gi, 'hold', 'Valor que llega al token · ' + Gi.nombre) });
    if (F.x.quema && F.x.testigos) { const prod = (F.x.testigos.data || []).filter((x) => x.producer), tasas = prod.map((x) => Number(x.annualizedRate)).filter((x) => x > 0), media = tasas.length ? tasas.reduce((a, b) => a + b, 0) / tasas.length : null; fila(4, { t: 'TRON', etq: 'val', v: nt(F.x.quema.actual.emisionDia, 'TRX') + '/día', sub: 'solo emisión: todas las comisiones se queman · rentabilidad media al votante ' + (media != null ? pctAbs(media, 2) : '—'), fuente: 'TronScan', estado: 'vivo', abrir: () => abrirTestigos(F) }); }
    else if (F.x.recompensas && F.x.staked) { const r = F.x.recompensas, st = F.x.staked.sum / 1e9; fila(4, { t: 'Ethereum', etq: 'val', v: nt((r.issuance.apr + r.tips.apr + r.mev.apr) * st, 'ETH') + '/año', sub: 'emisión ' + pctAbs(r.issuance.apr * 100, 2) + ' + propinas ' + pctAbs(r.tips.apr * 100, 2) + ' + MEV ' + pctAbs(r.mev.apr * 100, 2) + ' sobre ' + nt(st, 'ETH') + ' en staking (estimación)', fuente: 'ultrasound.money', estado: 'vivo', abrir: () => abrirTexto('Ingresos de los validadores de Ethereum', [el('p', { class: 'serie-nota' }, etq('val'), 'Los validadores cobran tres cosas: la emisión nueva (' + pctAbs(r.issuance.apr * 100, 2) + ' anual), las propinas (' + pctAbs(r.tips.apr * 100, 2) + ') y el MEV (' + pctAbs(r.mev.apr * 100, 2) + '). Las comisiones base no las cobran: se queman. ETH en staking: ' + nt(st, 'ETH') + ' (' + pctAbs(st / md.circulating_supply * 100, 1) + ' de la oferta).')], [[F.urlRec, 'recompensas (ultrasound.money)'], [F.urlStaked, 'ETH en staking (ultrasound.money)']], 'Estimación de ultrasound.money') }); }
    else if (!F.cadena) fila(4, { t: 'Ingresos de validadores', v: 'no aplica', sub: s + ' vive sobre otras cadenas: su seguridad la pagan ellas', fuente: '—', estado: 'vivo', abrir: () => abrirTexto('Validadores y ' + s, [s + ' no tiene validadores propios: es un token que vive sobre otras cadenas y su seguridad la pagan ellas. Lo que sí tiene es su propia emisión (paso 1) y lo que llega al token (paso 4).']) });
    else if (serieCM('IssTotNtv')) { const sI = completos(serieCM('IssTotNtv')), fin = HOY0(); fila(4, { t: 'Emisión (30 d)', etq: 'val', v: nt(suma(sI, fin - 30 * DIA, fin), s), sub: 'emisión nueva según Coin Metrics; las comisiones que cobran no se separan en la fuente gratuita', serie: serieCM('IssTotNtv'), tipo: 'flujo', fuente: 'Coin Metrics', estado: 'vivo', abrir: abrirCM(F, 'IssTotNtv', 'Emisión diaria de ' + s, (v) => nt(v, s)) }); }
    else fila(4, { t: 'Ingresos de validadores', estado: 'sin', motivo: 'Ninguna fuente gratuita publica la emisión ni las recompensas de los validadores de ' + s + '.', fuente: '—' });
    // 5 · Sostenibilidad
    const em30 = emision30Usd(F), origen = origenEmision(F);
    const tvl = F.cadena ? (F.tvlS ? ultimo(F.tvlS)[1] : F.cadena.tvl) : (F.prots[0] ? F.prots[0][4] : null);
    if (em30 === 0) fila(5, { t: 'Emisión en 30 días', v: '0 ' + s, sub: F.cadena ? 'la red no ha emitido monedas nuevas este mes según ' + origen.split(' (')[0] : 'no emite monedas nuevas según ' + origen.split(' (')[0] + ': no paga una seguridad propia', fuente: 'Coin Metrics', estado: 'vivo', abrir: serieCM('IssTotNtv') ? abrirCM(F, 'IssTotNtv', 'Emisión diaria de ' + s, (v) => nt(v, s)) : null });
    else if (G && G.t30.rev != null && em30) fila(5, { t: 'Ingresos del protocolo frente a emisión (30 d)', v: n(G.t30.rev / em30, 2) + ' ×', sub: m(G.t30.rev) + ' de ingresos frente a ' + m(em30) + ' emitidos para pagar la seguridad · por encima de 1 las comisiones cubren la emisión', fuente: 'DefiLlama · ' + origen.split(' (')[0], estado: 'vivo', abrir: () => abrirTexto('Ingresos frente a emisión · ' + s, [el('p', { class: 'serie-nota' }, etq('rev'), 'Ingresos del protocolo en 30 días: ' + m(G.t30.rev) + ' («' + (G.m.rev || 'sin texto') + '»).'), el('p', { class: 'serie-nota' }, etq('val'), 'Emisión en 30 días: ' + m(em30) + ' según ' + origen + '.'), el('div', { class: 'regla' }, 'Regla escrita: ingresos ÷ emisión. Por encima de 1, lo que entra por comisiones cubre lo que se emite para pagar a validadores; por debajo, la seguridad se paga con inflación. No es una nota: es una relación entre dos cifras con sus etiquetas.')], [[G.urls.rev, 'ingresos del protocolo en DefiLlama']], 'Dos capas distintas, comparadas') });
    else if (!em30 && em30 !== 0) fila(5, { t: 'Emisión en dólares (para comparar con ingresos)', estado: 'sin', motivo: origen ? 'La serie está incompleta este mes.' : 'Ninguna fuente gratuita publica la emisión de ' + s + '.', fuente: '—' });
    if (G && G.t30.fees != null && em30) fila(5, { t: 'Comisiones de usuarios frente a emisión (30 d)', v: n(G.t30.fees / em30, 2) + ' ×', sub: m(G.t30.fees) + ' pagados por los usuarios frente a ' + m(em30) + ' emitidos', fuente: 'DefiLlama · ' + origen.split(' (')[0], estado: 'vivo', abrir: () => abrirTexto('Comisiones frente a emisión · ' + s, [el('p', { class: 'serie-nota' }, etq('fees'), 'Comisiones de usuarios en 30 días: ' + m(G.t30.fees) + '.'), el('p', { class: 'serie-nota' }, etq('val'), 'Emisión en 30 días: ' + m(em30) + ' según ' + origen + '.'), el('div', { class: 'regla' }, 'Regla escrita: comisiones ÷ emisión. Compara lo que pagan los usuarios con lo que la red emite para pagar su seguridad. No se suman: son dos capas.')], [[G.urls.fees, 'comisiones en DefiLlama']], 'Dos capas distintas, comparadas') });
    if (G && G.t1a && G.t1a.rev != null && tvl) fila(5, { t: 'Ingresos del protocolo / capital depositado (1 año)', v: pctAbs(G.t1a.rev / tvl * 100, 2), sub: m(G.t1a.rev) + ' en 1 año sobre ' + m(tvl) + ' depositados (TVL) · sustituto rotulado: no descuenta incentivos', fuente: 'DefiLlama', estado: 'vivo', abrir: () => abrirTexto('Rendimiento del capital depositado · ' + s, [el('p', { class: 'serie-nota' }, etq('rev'), 'Ingresos del protocolo en 1 año: ' + m(G.t1a.rev) + '.'), el('p', { class: 'serie-nota' }, etq('tvl'), 'Capital depositado hoy: ' + m(tvl) + '.'), el('div', { class: 'regla' }, 'Regla escrita: ingresos de 1 año ÷ TVL de hoy. Dice cuánto rinde de verdad el dinero depositado para el protocolo. Un TVL alto con rendimiento bajo puede estar sostenido por incentivos, que no tienen fuente gratuita: por eso es un sustituto rotulado.')], [[G.urls.rev, 'ingresos en DefiLlama']], 'Sustituto rotulado') });
    if (F.x.recompensas && F.x.staked && F.cad && F.cad.t30.hold != null && F.precio) { const emEth = (F.x.recompensas.issuance.apr * F.x.staked.sum / 1e9) / 365.25 * 30, quemaEth = F.cad.t30.hold / F.precio; fila(5, { t: 'Emisión frente a quema (30 d, en ETH)', v: nt(emEth, 'ETH') + ' / ' + nt(quemaEth, 'ETH'), sub: (emEth > quemaEth ? 'se emitió más de lo que se quemó' : 'se quemó más de lo que se emitió') + ' · estimación con dos fuentes y el precio de hoy', fuente: 'ultrasound.money · DefiLlama', estado: 'vivo', abrir: () => abrirTexto('Emisión frente a quema · Ethereum', ['Emisión ≈ ' + nt(emEth, 'ETH') + ' en 30 días (rentabilidad por emisión × ETH en staking, ultrasound.money). Quema ≈ ' + nt(quemaEth, 'ETH') + ' (comisiones base quemadas según DefiLlama, ' + m(F.cad.t30.hold) + ', convertidas al precio de hoy). Es una estimación y se rotula así.'], [[F.urlRec, 'ultrasound.money'], [F.cad.urls.hold, 'quema en DefiLlama']], 'Estimación') }); }
    fila(5, { t: 'Dependencia de incentivos', estado: 'sin', motivo: 'Los pagos en tokens a los usuarios solo están en la API de pago de DefiLlama. Sin ese dato no se puede decir qué parte del uso es orgánica; el rendimiento del capital depositado es un sustituto que no lo descuenta.', fuente: '—' });
    // 6 · Valoración y riesgo
    fila(6, { t: 'Volumen / capitalización (24 h)', v: F.mcap && md.total_volume ? pctAbs(md.total_volume.usd / F.mcap * 100, 1) : '—', sub: 'negociado en 24 h: ' + m(md.total_volume && md.total_volume.usd) + ' (incluye casas de cambio centralizadas)', serie: F.volS, fmt: m, spNombre: 'Volumen negociado en 24 h', tipo: 'flujo', fuente: 'CoinGecko', estado: 'vivo', abrir: () => abrirSerie({ titulo: 'Volumen negociado al día · ' + s, serie: F.volS || [], fmt: (v) => m(v), fuentes: [[F.urlChart, '365 días de CoinGecko']], csv: s + '-volumen', sub: F.nombre }) });
    fila(6, { t: 'Distancia al máximo histórico', v: md.ath_change_percentage ? pct(md.ath_change_percentage.usd / 100) : '—', sub: 'máximo ' + usd(md.ath && md.ath.usd) + ' el ' + (md.ath_date && md.ath_date.usd ? fd(Date.parse(md.ath_date.usd)) : '—'), serie: F.precioS, fmt: usd, spNombre: 'Precio', tipo: 'saldo', fuente: 'CoinGecko', estado: 'vivo', abrir: () => abrirSerie({ titulo: 'Precio · ' + s + ' (365 días)', serie: F.precioS || [], tipo: 'saldo', fmt: (v) => usd(v), fuentes: [[F.urlChart, '365 días de CoinGecko']], csv: s + '-precio', sub: F.nombre }) });
    if (F.x.reparto) { const R = F.x.reparto; fila(6, { t: 'Quién tiene el TRX: las 100 mayores cuentas', v: pctAbs(R.concentracion.top100, 1), sub: 'la mayor sola ' + pctAbs(R.concentracion.top1, 1) + ' · casas de cambio ' + pctAbs(R.grupos.exchange.pct, 1) + ' · contratos ' + pctAbs(R.grupos.contrato.pct, 1), fuente: 'TronScan (EquipoIA)', estado: 'dia', abrir: () => window.open('herramientas.html#reparto', '_blank', 'noopener') }); }
    else if (serieCM('AdrBalCnt')) fila(6, { t: 'Quién tiene el token: direcciones con saldo', v: nt(ultimo(serieCM('AdrBalCnt'))[1]), sub: 'la fuente gratuita no dice cuánto tiene cada una', serie: serieCM('AdrBalCnt'), tipo: 'saldo', fuente: 'Coin Metrics', estado: 'vivo', abrir: abrirCM(F, 'AdrBalCnt', 'Direcciones con saldo · ' + s, (v) => n(v, 0), 'saldo') });
    else fila(6, { t: 'Quién tiene el token', estado: 'sin', motivo: 'La lista de titulares de ' + s + ' exige clave en los exploradores; Coin Metrics (comunidad) tampoco da direcciones con saldo.', fuente: '—' });
    if (F.x.testigos) { const T = F.x.testigos.data || [], prod = T.filter((x) => x.producer).sort((a, b) => b.votes - a.votes), tot = T.reduce((a, x) => a + (x.votes || 0), 0), top = (kk) => prod.slice(0, kk).reduce((a, x) => a + (x.votes || 0), 0) / tot * 100, seQuedan = prod.filter((x) => x.brokerage >= 50).length;
      fila(6, { t: 'Quién controla la red: los 27 productores', v: pctAbs(top(27), 1) + ' de los votos', sub: 'el primero ' + pctAbs(top(1), 1) + ', los 5 primeros ' + pctAbs(top(5), 1) + ' · ' + n(T.length) + ' candidatos', fuente: 'TronScan', estado: 'vivo', abrir: () => abrirTestigos(F) });
      fila(6, { t: 'Quién cobra la emisión', v: n(seQuedan) + ' de 27 se quedan ≥ 50 %', sub: 'de la recompensa; el resto la reparte a sus votantes', fuente: 'TronScan', estado: 'vivo', abrir: () => abrirTestigos(F) });
      fila(6, { t: 'Seguridad: TRX votando (en stake)', v: pctAbs(tot / md.circulating_supply * 100, 1) + ' de la oferta', sub: nt(tot, 'TRX') + ' respaldan a los validadores', fuente: 'TronScan', estado: 'vivo', abrir: () => abrirTestigos(F) }); }
    else if (F.x.staked) { const st = F.x.staked.sum / 1e9, lidoEth = F.x.lido && F.precio ? F.x.lido / F.precio : null;
      fila(6, { t: 'Quién controla la red: cuota de Lido (aproximación)', v: lidoEth ? pctAbs(lidoEth / st * 100, 1) : '—', sub: 'TVL de Lido al precio de hoy frente al ETH en staking · la lista de validadores exige clave', fuente: 'DefiLlama · ultrasound.money', estado: 'vivo', abrir: () => abrirTexto('Cuota de Lido en el staking de Ethereum', ['Aproximación rotulada: el TVL de Lido en dólares (DefiLlama) se convierte a ETH con el precio de hoy y se compara con el ETH en staking (ultrasound.money). No es un recuento de validadores.'], [[F.urlLido, 'TVL de Lido'], [F.urlStaked, 'ETH en staking']], 'Aproximación') });
      fila(6, { t: 'Seguridad: ETH en staking', v: pctAbs(st / md.circulating_supply * 100, 1) + ' de la oferta', sub: nt(st, 'ETH') + ' asegurando la red', fuente: 'ultrasound.money', estado: 'vivo', abrir: () => abrirTexto('ETH en staking', [nt(st, 'ETH') + ' en staking, el ' + pctAbs(st / md.circulating_supply * 100, 1) + ' de la oferta en circulación.'], [[F.urlStaked, 'ETH en staking (ultrasound.money)']], 'ultrasound.money, en vivo') }); }
    else if (serieCM('HashRate')) fila(6, { t: 'Seguridad: potencia de minado', v: n(ultimo(serieCM('HashRate'))[1] / 1e6, 0) + ' EH/s', sub: 'media del día ' + fd(ultimo(serieCM('HashRate'))[0]), serie: serieCM('HashRate'), tipo: 'saldo', fuente: 'Coin Metrics', estado: 'vivo', abrir: abrirCM(F, 'HashRate', 'Potencia de minado · ' + s, (v) => n(v / 1e6, 1) + ' EH/s', 'saldo') });
    else fila(6, { t: 'Quién controla la red y seguridad', estado: 'sin', motivo: F.cadena ? 'Validadores y capital en stake de ' + F.cadena.nombre + ': sin fuente gratuita sin clave.' : s + ' es un token sobre otra cadena: su seguridad es la de esa cadena y la de su contrato (compruébalo en Herramientas).', fuente: '—' });
    if (F.cadena) fila(6, { t: 'Ecosistema: ' + F.cadena.nombre, etq: 'tvl', v: m(F.tvlS ? ultimo(F.tvlS)[1] : F.cadena.tvl), sub: (F.apps ? n(F.apps.length) + ' aplicaciones con comisiones registradas' : '') + (F.dex24 != null ? ' · DEX ' + m(F.dex24) + '/24 h' : ''), serie: F.tvlS, tipo: 'saldo', fuente: 'DefiLlama', estado: 'vivo', abrir: () => abrirSerie({ titulo: 'TVL en ' + F.cadena.nombre, serie: F.tvlS || [], tipo: 'saldo', fmt: (v) => m(v), nota: 'Valor depositado en las aplicaciones de la cadena. No es dinero del protocolo ni del token.', fuentes: [[F.urlTvl, 'TVL histórico en DefiLlama']], csv: s + '-tvl', sub: F.cadena.nombre }) });
    if (F.repo) { const gh = F.R.gh, rel = F.R.rel; fila(6, { t: 'Desarrollo: commits en 28 días (sin semáforo)', v: gh && gh.ok ? n(gh.v.commits) : 'sin respuesta', sub: 'rama por defecto de ' + F.repo + (rel && rel.ok ? ' · última versión ' + (rel.v.tag_name || rel.v.name) + ' el ' + fd(Date.parse(rel.v.published_at)) : ' · sin versiones publicadas') + ' · ' + n(F.repos.length) + ' repositorios en CoinGecko', fuente: 'GitHub', estado: 'vivo', abrir: () => abrirTexto('Desarrollo de ' + s + ' (sin interpretar)', ['Commits en 28 días: ' + (gh && gh.ok ? n(gh.v.commits) : 'sin respuesta (' + (gh && gh.e ? gh.e.message : '—') + ')') + ' en la rama por defecto de ' + F.repo + '.', el('p', { class: 'serie-nota' }, 'Última versión publicada: ', rel && rel.ok ? el('span', null, ext(rel.v.html_url, rel.v.tag_name || rel.v.name), ' el ' + fd(Date.parse(rel.v.published_at))) : 'ninguna publicada o sin respuesta.'), el('p', { class: 'serie-nota' }, 'Repositorios que CoinGecko asocia al token: ', ...F.repos.slice(0, 6).flatMap((r, i) => [i ? ', ' : '', ext(r, String(r).replace('https://github.com/', ''))]), '. Solo se miden los commits del primero.'), 'Fuente y límites: GitHub sin clave (60 lecturas por hora y visitante). Los commits son una aproximación débil: un repositorio puede tener muchos commits y poco desarrollo relevante, o al revés. Por eso no hay color ni nota.'], [[F.urlGh, 'commits en GitHub'], [F.urlRel, 'última versión en GitHub']], 'GitHub, en vivo') }); }
    else fila(6, { t: 'Desarrollo', estado: 'sin', motivo: 'CoinGecko no indica ningún repositorio público para ' + s + '.', fuente: '—' });

    // --- dibujar
    const PASOS = { 1: ['Economía del token', 'emisión · inflación · quema · dilución'], 2: ['Actividad y demanda', 'la escalera: actividad → uso económico → monetización → captura'], 3: ['Monetización', 'comisiones · ingresos · incentivos'], 4: ['Captura de valor', 'quema · reparto · recompensas · valor para los titulares'], 5: ['Sostenibilidad', 'emisión frente a ingresos · incentivos · coste de la seguridad'], 6: ['Valoración y riesgo', 'concentración · seguridad · ecosistema · desarrollo (los múltiplos, abajo, con sus cuatro etiquetas)'] };
    const tb = el('table', { class: 'tb' }, el('thead', null, el('tr', null, el('th', null, 'Métrica'), el('th', { class: 'r' }, 'Valor'), el('th', { class: 'r' }, 'Variación 30 d'), el('th', null, 'Tendencia 90 d'), el('th', null, 'Fuente'), el('th', null, 'Estado'))));
    const tbody = el('tbody'); tb.append(tbody);
    for (let p = 1; p <= 6; p++) {
      tbody.append(el('tr', { class: 'paso', id: 'paso-' + p }, el('td', { colspan: 6 }, p + ' · ' + PASOS[p][0], el('span', null, PASOS[p][1]))));
      for (const r of rows.filter((x) => x.paso === p)) {
        if (r.estado === 'sin') { tbody.append(el('tr', { class: 'clk', onclick: () => abrirTexto(r.t, [r.motivo]) }, el('td', { class: 'met' }, r.t), el('td', { class: 'v r', style: 'font-weight:400;color:var(--mut)' }, 'sin dato gratuito'), el('td', { class: 'r nd' }, '—'), el('td', { class: 'sp' }, el('span', { class: 'sinSerie' }, (r.motivo || '').slice(0, 70) + '…')), el('td', { class: 'muted' }, r.fuente), el('td', null, el('span', { class: 'est sin' }, ESTADO.sin[1])))); continue; }
        const v = r.var !== undefined ? r.var : (r.serie ? (variacion(r.serie, r.tipo || 'flujo', r.dias || 30) || {}).v : undefined);
        const sp = r.serie ? spark(r.serie, colorTend(v), 90, { nombre: r.spNombre || (typeof r.t === 'string' ? r.t : ''), fmt: r.fmt, muestra: typeof r.v === 'string' ? r.v : '' }) : null;
        tbody.append(el('tr', { class: r.abrir ? 'clk' : '', onclick: r.abrir || null, title: r.abrir ? (r.pista || 'Ver la serie y el origen') : null }, el('td', { class: 'met' }, r.etq ? etq(r.etq) : null, r.t), el('td', { class: 'v r' }, r.v, r.sub ? el('small', null, r.sub) : null), el('td', { class: 'r' }, v === undefined ? el('span', { class: 'nd' }, '—') : varTxt(v == null ? null : v)), el('td', { class: 'sp' }, sp || el('span', { class: 'sinSerie' }, r.serie ? 'serie corta' : 'sin serie gratuita')), el('td', { class: 'muted' }, r.fuente), el('td', null, el('span', { class: 'est ' + ESTADO[r.estado][0] }, ESTADO[r.estado][1]))));
      }
    }
    return el('div', { class: 'card', style: 'margin:0 0 14px' }, el('h4', { style: 'margin:0;font-size:15.5px' }, 'Fundamentales en detalle, por los seis pasos'), el('p', { class: 'cs', style: 'margin:2px 0 0;color:var(--mut);font-size:12.5px' }, 'Variación 30 d: flujos frente a los 30 días anteriores; saldos frente a hace 30 días. Pulsa una fila para ver la serie entera, la regla y la respuesta en bruto de la fuente.'), el('div', { class: 'tbw' }, tb), F.fallos.length ? el('p', { class: 'fallo' }, 'Sin respuesta ahora mismo: ' + F.fallos.join(', ') + '. Esas cifras no se inventan; vuelve a cargar en un momento.') : null);
  }

  /* ---- 6) múltiplos con sus cuatro etiquetas ---- */
  function multiplos(F) {
    const s = F.simbolo, filas = [];
    const fila = (capa, num, numV, denK, G, periodo, denV, dias) => { if (numV && denV > 0) filas.push({ capa, num, numV, denK, G, periodo, denV, dias, x: numV / (periodo === '30 d anualizado' ? denV / 30 * 365.25 : denV) }); };
    const porGrupo = (G, capa) => { if (!G) return; for (const k of ['fees', 'rev', 'hold']) { if (G.t1a[k] != null) fila(capa, 'Capitalización', F.mcap, k, G, '365 d reales', G.t1a[k], 365); if (G.t30[k] != null) fila(capa, 'Capitalización', F.mcap, k, G, '30 d anualizado', G.t30[k], 30); if (F.fdv && F.mcap && F.fdv / F.mcap > 1.05 && G.t1a[k] != null) fila(capa, 'FDV', F.fdv, k, G, '365 d reales', G.t1a[k], 365); } };
    porGrupo(F.cad, 'Red'); F.pf.forEach((G) => porGrupo(G, 'Protocolo'));
    const benef = (r) => (r.denK === 'hold' ? 'los titulares del token · «' + (r.G.m.hold || 'sin texto') + '»' : r.denK === 'rev' ? 'el protocolo o su tesorería · «' + (r.G.m.rev || 'sin texto') + '»' : 'las pagan los usuarios («' + (r.G.m.fees || 'sin texto') + '»); se queda el protocolo: «' + (r.G.m.rev || 'sin texto') + '»; el resto, validadores o mineros');
    const card = el('div', { class: 'card' }, el('h4', null, 'Múltiplos, con sus cuatro etiquetas'));
    if (!filas.length) { card.append(el('div', { class: 'sd' }, el('b', null, 'Sin múltiplos. '), 'Sin comisiones ni ingresos registrados en DefiLlama para ' + s + ' no se calcula ninguno: un múltiplo sin su denominador etiquetado induce a error.')); return card; }
    card.append(el('p', { class: 'cs' }, 'Qué va arriba, qué va abajo, de qué periodo y quién recibe ese dinero. ' + (F.cad && F.pf.length ? 'Red y protocolo se valoran por separado.' : F.cad ? 'Valoración de la red: el token de la cadena frente a lo que paga o recibe la cadena. Los ingresos de las aplicaciones que corren encima no se usan aquí.' : 'Valoración del protocolo: el token frente a lo que paga o recibe esa aplicación.') + ' Pulsa una fila para ver el cálculo.'),
      el('table', { class: 'mult' }, el('thead', null, el('tr', null, el('th', null, 'Capa'), el('th', null, 'Numerador'), el('th', null, 'Denominador'), el('th', null, 'Periodo'), el('th', { class: 'r' }, 'Múltiplo'))),
        el('tbody', null, filas.map((r) => el('tr', { class: 'clk', title: 'Ver el cálculo y el beneficiario', onclick: () => UI.abrir('Múltiplo: ' + r.num + ' / ' + ETQ[r.denK][1].toLowerCase() + ' de ' + r.G.nombre, () => el('div', null, el('p', { class: 'serie-nota' }, el('b', null, 'Numerador: '), r.num + ' de ' + s + ' = ' + m(r.numV) + ' (CoinGecko, ahora).'), el('p', { class: 'serie-nota' }, el('b', null, 'Denominador: '), etq(r.denK), 'de ' + r.G.nombre + ' = ' + m(r.denV) + ' en ' + (r.dias === 365 ? 'los últimos 365 días' : 'los últimos 30 días') + (r.periodo === '30 d anualizado' ? ', multiplicado por 365,25/30 = ' + m(r.denV / 30 * 365.25) : '') + '.'), el('p', { class: 'serie-nota' }, el('b', null, 'Beneficiario económico: '), benef(r)), el('p', { class: 'serie-nota' }, el('b', null, 'Capa: '), r.capa === 'Red' ? 'valoración de la red: el token de la cadena frente a lo que paga o recibe la propia cadena.' : 'valoración del protocolo: el token de la aplicación frente a lo que paga o recibe esa aplicación.'), el('div', { class: 'regla' }, 'Múltiplo = ' + m(r.numV) + ' ÷ ' + m(r.periodo === '30 d anualizado' ? r.denV / 30 * 365.25 : r.denV) + ' = ' + n(r.x, 1) + ' veces. Solo se compara con otro que tenga el mismo numerador, denominador, periodo y beneficiario.'), el('p', { class: 'fuente' }, 'De dónde sale: ', ext(F.urlCG, 'ficha de CoinGecko'), ' · ', ext(r.G.urls[r.denK], 'serie de DefiLlama con su método'), '.')), { sub: 'Cuatro etiquetas, siempre', ancho: true }) },
          el('td', null, r.capa), el('td', null, r.num, el('span', { class: 'cap' }, m(r.numV))), el('td', null, etq(r.denK), el('span', { class: 'cap' }, 'de ' + r.G.nombre + ' · ' + m(r.denV) + (r.periodo === '30 d anualizado' ? ' en 30 d' : ' en 365 d'))), el('td', null, r.periodo), el('td', { class: 'r' }, el('b', null, n(r.x, 1) + ' ×')))))));
    return card;
  }

  /* ---- 7) las aplicaciones de su cadena, aparte: ese dinero no llega al token ---- */
  function aplicaciones(F) {
    const s = F.simbolo, card = el('div', { class: 'card' });
    if (F.cadena && F.apps && F.apps.length) {
      card.append(el('h4', null, 'Las aplicaciones de ' + F.cadena.nombre + ' (aparte: ese dinero no llega a ' + s + ')'), el('p', { class: 'cs' }, n(F.apps.length) + ' aplicaciones con comisiones registradas en DefiLlama. Son ingresos de las aplicaciones, no del token: por eso no entran en los múltiplos de arriba. Pulsa una fila para ver su ficha en DefiLlama.'),
        UI.tabla({ pp: 8, ph: 'Buscar una aplicación…', csv: s + '-aplicaciones', rows: F.apps.slice(0, 60), orden: [3, -1], onRow: (p) => window.open('https://defillama.com/protocol/' + p.slug, '_blank', 'noopener'), cols: [{ t: 'Aplicación', v: (p) => el('span', null, el('b', null, p.name), el('br'), el('span', { class: 'muted', style: 'font-size:12px' }, p.category || '')), o: (p) => p.name, csv: (p) => p.name }, { t: 'Comisiones 24 h', v: (p) => m(p.total24h), o: (p) => p.total24h || 0, num: true, csv: (p) => p.total24h }, { t: '7 d', v: (p) => m(p.total7d), o: (p) => p.total7d || 0, num: true, csv: (p) => p.total7d }, { t: '30 d', v: (p) => m(p.total30d), o: (p) => p.total30d || 0, num: true, csv: (p) => p.total30d }, { t: 'Cambio 30 d', v: (p) => (p.change_1m == null ? '—' : pctA(p.change_1m / 100)), o: (p) => p.change_1m || 0, num: true }] }),
        el('p', { class: 'fuente' }, 'De dónde sale: ', ext(F.urlApps, 'aplicaciones de la cadena en DefiLlama'), (F.dex24 != null ? [' · volumen DEX de la cadena ', ext(F.urlDex, m(F.dex24) + ' en 24 h')] : null), '.'));
    } else if (F.prots.length) {
      const p = F.prots[0];
      card.append(el('h4', null, 'Las partes de ' + p[1] + ' en DefiLlama'), el('p', { class: 'cs' }, 'Capital depositado por partes (dato diario del índice). El TVL es dinero de los usuarios, no del protocolo ni del token.'),
        p[10] && p[10].length ? UI.tabla({ pp: 8, buscar: false, rows: p[10].slice().sort((a, b) => b[3] - a[3]), onRow: (h) => window.open('https://defillama.com/protocol/' + h[0], '_blank', 'noopener'), cols: [{ t: 'Parte', v: (h) => h[1] }, { t: 'Categoría', v: (h) => h[2] || '—' }, { t: 'TVL', v: (h) => m(h[3]), o: (h) => h[3], num: true }] }) : el('p', { class: 'hint' }, p[1] + ': ' + m(p[4]) + ' depositados en ' + n(p[3]) + ' cadenas.'),
        F.prots.length > 1 ? el('p', { class: 'hint' }, 'También en DefiLlama: ' + F.prots.slice(1).map((q) => q[1] + ' (TVL ' + m(q[4]) + ')').join(', ') + '.') : null,
        el('p', { class: 'fuente' }, 'De dónde sale: ', ext('https://defillama.com/protocol/' + p[0], 'ficha de ' + p[1] + ' en DefiLlama'), ' · ', ext('https://api.llama.fi/protocols', 'lista completa de protocolos (fuente del índice diario)'), '.'));
    } else card.append(el('h4', null, 'Aplicaciones y ecosistema'), el('div', { class: 'sd' }, el('b', null, 'Sin dato. '), s + ' no es una cadena ni un protocolo con datos en DefiLlama.'));
    return card;
  }
  function abrirProtocolo(F, p) {
    UI.abrir('Capital depositado en ' + p[1], () => el('div', null, el('p', { class: 'serie-nota' }, etq('tvl'), 'TVL de ' + p[1] + ' según el índice diario (DefiLlama): hoy ' + m(p[4]) + ', ayer ' + m(p[5]) + ', hace una semana ' + m(p[6]) + ', hace un mes ' + m(p[7]) + '. Es dinero de los usuarios depositado en la aplicación, no del protocolo.'), p[10] ? UI.tabla({ pp: 10, buscar: false, rows: p[10].slice().sort((a, b) => b[3] - a[3]), cols: [{ t: 'Parte', v: (h) => h[1] }, { t: 'Categoría', v: (h) => h[2] || '—' }, { t: 'TVL', v: (h) => m(h[3]), o: (h) => h[3], num: true }] }) : null, el('p', { class: 'fuente' }, 'De dónde sale: ', ext('https://defillama.com/protocol/' + p[0], 'ficha de ' + p[1] + ' en DefiLlama'), ' · ', ext('https://api.llama.fi/protocols', 'lista completa de protocolos (fuente del índice diario)'), '.')), { ancho: true, sub: 'Dato diario' });
  }

  /* ---- 8) pie: fuentes, hora, método ---- */
  function piebar(F) {
    const fuentes = [...new Set(F.urls.map((u) => (u[1].match(/CoinGecko|DefiLlama|Coin Metrics|TronScan|TronGrid|ultrasound\.money|GitHub/) || [''])[0]).filter(Boolean))];
    if (F.x.quema || F.x.reparto) fuentes.push('lecturas diarias de EquipoIA (TronScan)');
    return el('div', { class: 'piebar' + (F.fallos.length ? ' warn' : '') }, el('span', null, 'Fuentes: ' + fuentes.join(', ') + ' · montado ' + fh(F.ahora) + (F.fallos.length ? ' · sin respuesta: ' + F.fallos.join(', ') : '')), el('span', { class: 'lnks' }, 'Respuestas en bruto: ', ...F.urls.slice(0, 40).flatMap((u, i) => [i ? ' · ' : '', ext(u[0], u[1])])), el('a', { class: 'btn', href: 'datos.html#fundamentales' }, 'Ver datos y método →'));
  }

  /* ---- paneles compartidos ---- */
  function abrirTestigos(F) {
    const T = (F.x.testigos.data || []).slice().sort((a, b) => b.votes - a.votes), prod = T.filter((x) => x.producer), totalVotos = T.reduce((a, x) => a + (x.votes || 0), 0);
    const acum = (k) => prod.slice(0, k).reduce((a, x) => a + (x.votes || 0), 0) / totalVotos * 100;
    UI.abrir('Validadores de TRON: quién controla y quién cobra', () => el('div', null,
      el('p', { class: 'serie-nota' }, n(T.length) + ' candidatos con votos; los 27 con más votos producen bloques y cobran la mayor parte de la emisión. Votos totales: ' + nt(totalVotos, 'TRX') + ' (1 voto = 1 TRX en stake). El primero reúne el ' + n(acum(1), 1) + ' %, los 5 primeros el ' + n(acum(5), 1) + ' % y los 27 el ' + n(acum(27), 1) + ' %. «Se queda» es la parte de la recompensa que el validador no reparte a sus votantes.'),
      UI.tabla({ pp: 12, ph: 'Buscar un validador…', csv: 'TRX-validadores', rows: T, orden: [2, -1], onRow: (x) => window.open('https://tronscan.org/#/address/' + x.address, '_blank', 'noopener'), cols: [{ t: 'Puesto', v: (x) => n(x.ranking || 0), o: (x) => x.ranking || 0, num: true }, { t: 'Validador', v: (x) => el('span', null, el('b', null, x.name || UI.corto(x.address)), x.producer ? el('span', { class: 'muted' }, ' · produce bloques') : null, el('br'), el('a', { class: 'addr mono', href: 'https://tronscan.org/#/address/' + x.address, target: '_blank', rel: 'noopener', style: 'font-size:11.5px' }, x.address)), o: (x) => x.name || x.address, csv: (x) => (x.name || '') + ' ' + x.address }, { t: 'Votos', v: (x) => nt(x.votes, 'TRX'), o: (x) => x.votes, num: true, csv: (x) => x.votes }, { t: '% de los votos', v: (x) => n(x.votes / totalVotos * 100, 2) + ' %', o: (x) => x.votes, num: true }, { t: 'Se queda', v: (x) => n(x.brokerage, 0) + ' %', o: (x) => x.brokerage, num: true }, { t: 'Rentabilidad anual al votante', v: (x) => (Number(x.annualizedRate) > 0 ? n(Number(x.annualizedRate), 2) + ' %' : '—'), o: (x) => Number(x.annualizedRate) || 0, num: true }] }),
      el('p', { class: 'fuente' }, 'De dónde sale: ', ext(F.urlTestigos, 'lista de validadores en TronScan'), '.')), { ancho: true, sub: 'TronScan, en vivo' });
  }
  function abrirCambios(F) {
    UI.abrir('Cambios de método o de cobertura que afectan a ' + F.nombre, () => el('div', null, el('p', { class: 'serie-nota' }, 'El índice diario guarda cada día el texto de método de DefiLlama y la lista de métricas de Coin Metrics. Cuando cambian, se anota aquí: un salto de la serie en esas fechas puede deberse a la fuente, no al activo.'),
      UI.tabla({ pp: 10, rows: F.cambios.slice().reverse(), csv: 'cambios-' + F.simbolo, cols: [{ t: 'Fecha', v: (c) => c.fecha }, { t: 'Qué', v: (c) => (c.tipo === 'metodo' ? 'Método · ' : 'Cobertura · ') + c.clave }, { t: 'Antes', v: (c) => (typeof c.antes === 'string' ? c.antes : c.antes ? Object.entries(c.antes).map(([k, v]) => k + ': ' + v).join(' | ') : '—') }, { t: 'Después', v: (c) => (typeof c.despues === 'string' ? c.despues : c.despues ? Object.entries(c.despues).map(([k, v]) => k + ': ' + v).join(' | ') : '—') }] })), { ancho: true, sub: 'Índice diario de EquipoIA' });
  }

  /* ================= arranque ================= */
  document.addEventListener('DOMContentLoaded', async () => {
    C.chartDefaults && C.chartDefaults();
    await pIdx;
    if (idxError) avisar('El índice diario no se pudo leer (' + idxError.message + '): el buscador preguntará a CoinGecko y la ficha no tendrá DefiLlama ni Coin Metrics.');
    const qs = new URLSearchParams(location.search), q = qs.get('token'), cmp = (qs.get('comparar') || '').split(',').map((x) => x.trim()).filter(Boolean);
    pintarChips();
    if (cmp.length >= 2) { comparando = cmp.slice(0, 4); pintarChips(); comparar(); }
    else if (q) { if (inp) inp.value = (IDX && IDX.tokens[q] && IDX.tokens[q].s) || q; cargar(q); }
    document.addEventListener('visibilitychange', () => { if (!document.hidden && refrescarPrecio) refrescarPrecio(); });
  });
})();
