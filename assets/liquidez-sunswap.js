/* Zona 3 · pestaña «Liquidez SUNSwap»: ¿cuánto cuesta vender X dólares de cada token por USDT en SUNSwap (V1–V4)?
   El importe se escribe a mano. Lee data/liquidez-sunswap.json, que prepara el publicador de EquipoIA leyendo la cadena (TronGrid) y simulando la venta con el mismo motor de la investigación
   «SUNSwap bajo el microscopio» (enteros exactos; contrastado con los cotizadores de los contratos). El fichero trae, para cada token, el coste de vender una cuadrícula de tamaños (de 100 $ a 50 M$);
   para el importe que escribes se interpola entre dos puntos de esa cuadrícula (assets/interp.js). Coste = comisión + deslizamiento de la curva. Sin IA. Si no hay fichero, la pestaña lo dice. */
(function () {
  const { el, n } = C;
  const raiz = document.getElementById('sunswap-raiz'); if (!raiz) return;
  const LIQ = window.LIQ; if (!LIQ) { raiz.replaceChildren(el('p', { class: 'muted' }, 'No se pudo cargar el cálculo de la pestaña.')); return; }
  const lee = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const guarda = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) { /* sin almacenamiento */ } };
  let importe = Number(lee('liq-importe', '1000000')) || 1000000, umbral = Number(lee('liq-umbral', '0.5')) || 0.5, datos = null, abierto = new Set();
  const usd = (x) => (x == null || isNaN(x) ? '—' : n(x, x < 100 ? 2 : 0) + ' $');
  const corto = (x) => (x >= 1e6 ? n(x / 1e6, x >= 1e7 ? 0 : 1) + ' M$' : x >= 1e3 ? n(x / 1e3, x >= 1e5 ? 0 : 1) + ' mil $' : n(x) + ' $');
  const hace = (t) => { const h = (Date.now() - new Date(t).getTime()) / 36e5; return h < 1 ? 'hace menos de 1 hora' : h < 48 ? 'hace ' + n(Math.round(h)) + ' horas' : 'hace ' + n(Math.round(h / 24)) + ' días'; };
  const fh = (t) => new Date(t).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const pct = (x) => (x < 0.1 ? n(x, 3) : x < 10 ? n(x, 2) : n(x, 1)) + ' %';
  const ext = (href, texto, cls) => el('a', { class: cls || 'addr', href, target: '_blank', rel: 'noopener', title: 'Se abre en otra pestaña' }, texto);

  // Tamaño máximo con coste ≤ u (%) a partir de la curva (interpolando en el logaritmo del tamaño); null si ni el menor tamaño lo cumple
  function maximo(curva, u) {
    let ult = -1; for (let i = 0; i < curva.length; i++) { const p = curva[i]; if (LIQ.cabe(p) && p.costePct <= u) ult = i; else if (LIQ.cabe(p)) break; else break; }
    if (ult < 0) return 0; const a = curva[ult], b = curva[ult + 1]; if (!b || !LIQ.cabe(b)) return a.usd;
    const t = (u - a.costePct) / (b.costePct - a.costePct); return Math.exp(Math.log(a.usd) + Math.max(0, Math.min(1, t)) * (Math.log(b.usd) - Math.log(a.usd)));
  }
  function veredicto(ev) { const s = LIQ.semaforo(ev, umbral, umbral * 4); return s; }
  const TXT = { verde: 'Sí', ambar: 'Caro', rojo: 'No' };

  // mini gráfico: coste frente al tamaño (escala de raíz del coste para ver bien los costes bajos), con el importe escrito y el límite aceptado
  function grafico(t, ev) {
    const W = 300, H = 92, pad = 6, c = t.curva, x0 = Math.log(c[0].usd), x1 = Math.log(c[c.length - 1].usd);
    const X = (u) => pad + (Math.log(u) - x0) / (x1 - x0) * (W - 2 * pad), Y = (p) => H - 16 - Math.sqrt(Math.min(100, Math.max(0, p)) / 100) * (H - 26);
    const ns = 'http://www.w3.org/2000/svg'; const mk = (tag, a) => { const e = document.createElementNS(ns, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'liq-graf', role: 'img', 'aria-label': 'Coste de vender frente al tamaño de la venta' });
    svg.append(mk('line', { x1: pad, y1: H - 16, x2: W - pad, y2: H - 16, class: 'ej' }));
    svg.append(mk('line', { x1: pad, y1: Y(umbral), x2: W - pad, y2: Y(umbral), class: 'lim' }));
    let d = ''; c.forEach((p) => { if (!LIQ.cabe(p)) return; d += (d ? 'L' : 'M') + X(p.usd).toFixed(1) + ' ' + Y(p.costePct).toFixed(1); }); svg.append(mk('path', { d, class: 'cur' }));
    if (importe >= c[0].usd && importe <= c[c.length - 1].usd) { svg.append(mk('line', { x1: X(importe), y1: 4, x2: X(importe), y2: H - 16, class: 'imp' })); if (ev && ev.estado === 'ok') svg.append(mk('circle', { cx: X(importe), cy: Y(ev.costePct), r: 3.5, class: 'pt' })); }
    [[c[0].usd, 'start'], [c[c.length - 1].usd, 'end']].forEach(([u, an]) => { const tx = mk('text', { x: X(u), y: H - 3, 'text-anchor': an, class: 'et' }); tx.textContent = corto(u); svg.append(tx); });
    const tl = mk('text', { x: W - pad, y: Y(umbral) - 3, 'text-anchor': 'end', class: 'et' }); tl.textContent = 'límite ' + n(umbral, 1) + ' %'; svg.append(tl);
    return svg;
  }
  function detalle(t, ev) {
    const caja = el('div', { class: 'liq-det' });
    const izq = el('div', null);
    if (!ev || ev.estado === 'fuera') izq.append(el('p', { class: 'muted' }, 'Importe fuera del rango calculado (de ' + usd(t.curva[0].usd) + ' a ' + usd(t.curva[t.curva.length - 1].usd) + ').'));
    else if (ev.estado === 'no-cabe') izq.append(el('p', null, el('b', null, 'No cabe entera. '), 'Hasta ' + (ev.desde ? usd(ev.desde) : 'el menor tamaño probado') + ' se puede vender; con ' + usd(ev.hasta) + ' ya no hay liquidez suficiente en el rango de precios leído (o el mercado la cobra a un precio absurdo).'));
    else {
      izq.append(el('p', null, el('b', null, 'Vendes ' + usd(importe) + ' de ' + t.simbolo + ' y recibes ' + usd(ev.salidaUsdt) + ' (coste ' + pct(ev.costePct) + '). ')));
      if (ev.salidaUsdt > importe * 1.00005) izq.append(el('p', { class: 'muted' }, 'Recibes algo más que el valor de referencia porque uno de los mercados paga un poco por encima del precio del mercado más profundo (diferencia de precio entre mercados); el coste se muestra como 0.'));
      izq.append(el('p', null, el('b', null, 'Ruta: '), ev.ruta === 'directa' ? 'directamente token → USDT' : 'en dos saltos, token → TRX/WTRX → USDT'));
      const filas = (ev.partes || []).map((p) => { const m = datos.mercados[p[0]]; const quien = m.version === 'V4' ? 'V4 ' + m.par : m.version + ' ' + m.par; const enlace = m.version === 'V4' ? null : ext('https://tronscan.org/#/contract/' + m.direccion, quien); return el('li', null, (p[2] ? 'salto ' + p[2] + ': ' : '') + n(p[1] * 100, p[1] < 0.1 ? 1 : 0) + ' % en ', enlace || quien, ' ', el('span', { class: 'muted' }, '(comisión ' + n(m.comisionPpm / 1e4, 2) + ' %, capital el 11-nov ' + corto(m.capital11nov) + ')')); });
      izq.append(el('ul', { class: 'liq-partes' }, filas));
      if (!ev.exacto) izq.append(el('p', { class: 'muted' }, 'Coste interpolado entre dos tamaños calculados (error medido: menos de 0,02 puntos con costes de hasta el 5 %).'));
    }
    izq.append(el('p', { class: 'muted' }, 'Precio de referencia: ' + n(t.precioReferenciaUsdt, t.precioReferenciaUsdt < 0.001 ? 9 : t.precioReferenciaUsdt < 1 ? 5 : 3) + ' USDT por ' + t.simbolo + ' (el del mercado más profundo). Token: ', ext('https://tronscan.org/#/token20/' + t.direccion, t.direccion.slice(0, 6) + '…' + t.direccion.slice(-4))));
    caja.append(izq, grafico(t, ev)); return caja;
  }

  function pintaTabla() {
    const filas = datos.tokens.map((t) => { const sin = t.sinMercado || !t.curva.length; const ev = sin ? null : LIQ.evaluar(t.curva, importe); return { t, ev, sin, s: sin ? 'rojo' : veredicto(ev), max: sin ? 0 : maximo(t.curva, umbral) }; });
    filas.sort((a, b) => { const ca = a.sin || !a.ev || a.ev.estado !== 'ok' ? Infinity : a.ev.costePct, cb = b.sin || !b.ev || b.ev.estado !== 'ok' ? Infinity : b.ev.costePct; return ca === cb ? a.t.simbolo.localeCompare(b.t.simbolo) : ca - cb; });
    const cuerpo = el('tbody');
    for (const f of filas) {
      const { t, ev } = f, ab = abierto.has(t.simbolo);
      const res = f.sin ? el('span', { class: 'liq-b rojo' }, 'No') : el('span', { class: 'liq-b ' + f.s }, TXT[f.s]);
      const coste = f.sin ? 'sin mercado con USDT' : !ev || ev.estado === 'fuera' ? '—' : ev.estado === 'no-cabe' ? 'no cabe' : pct(ev.costePct);
      const recibes = f.sin || !ev || ev.estado !== 'ok' ? '—' : usd(ev.salidaUsdt);
      const ruta = f.sin ? 'Solo hay mercados casi vacíos con TRX' : !ev || ev.estado !== 'ok' ? '—' : (ev.ruta === 'directa' ? 'directa' : 'dos saltos') + ' · ' + (ev.partes || []).filter((p) => !p[2] || p[2] === 1).map((p) => datos.mercados[p[0]].version).filter((v, i, a) => a.indexOf(v) === i).join('+');
      const tr = el('tr', { class: 'liq-fila' + (ab ? ' abierta' : ''), tabindex: '0', 'aria-expanded': ab ? 'true' : 'false', title: 'Pulsa para ver los mercados y la curva' },
        el('td', { class: 'liq-tok' }, el('b', null, t.simbolo)), el('td', null, res), el('td', { class: 'num' }, coste), el('td', { class: 'num' }, recibes), el('td', { class: 'liq-ruta' }, ruta), el('td', { class: 'num' }, f.sin ? '—' : (f.max <= 0 ? 'menos de ' + usd(t.curva[0].usd) : usd(Math.round(f.max)))));
      const alterna = () => { if (abierto.has(t.simbolo)) abierto.delete(t.simbolo); else abierto.add(t.simbolo); pinta(); };
      tr.addEventListener('click', alterna); tr.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alterna(); } });
      cuerpo.append(tr);
      if (ab) cuerpo.append(el('tr', { class: 'liq-detf' }, el('td', { colspan: '6' }, f.sin ? el('p', { class: 'muted' }, t.simbolo + ' no tiene ningún mercado con USDT en SUNSwap ni con TRX/WTRX con liquidez medible: no se puede vender por USDT en SUNSwap.') : detalle(t, ev))));
    }
    return el('div', { class: 'liq-caja' }, el('table', { class: 'liq-tabla' }, el('thead', null, el('tr', null, el('th', null, 'Token'), el('th', null, '¿Cabe?'), el('th', { class: 'num' }, 'Coste de vender'), el('th', { class: 'num' }, 'Recibirías'), el('th', null, 'Ruta'), el('th', { class: 'num' }, 'Máximo con coste ≤ ' + n(umbral, 1) + ' %'))), cuerpo));
  }

  function pinta() {
    if (!datos) return;
    const viejo = (Date.now() - new Date(datos.generado).getTime()) / 36e5;
    const inp = el('input', { id: 'liq-importe', name: 'importe', inputmode: 'decimal', autocomplete: 'off', value: n(importe), 'aria-label': 'Importe a vender en dólares' });
    const aplica = () => { const v = Number(String(inp.value).replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '')); if (v > 0) { importe = v; guarda('liq-importe', v); } else { inp.value = n(importe); return; } pinta(); };
    inp.addEventListener('change', aplica); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); aplica(); } });
    const rapidos = [1e4, 1e5, 1e6, 1e7].map((v) => el('button', { type: 'button', class: 'liq-q' + (v === importe ? ' on' : ''), onclick: () => { importe = v; guarda('liq-importe', v); pinta(); } }, corto(v)));
    const sel = el('select', { id: 'liq-umbral', 'aria-label': 'Coste máximo que acepto' }, [0.1, 0.5, 1, 2, 5].map((v) => el('option', { value: String(v), selected: v === umbral ? 'selected' : null }, n(v, 1) + ' %')));
    sel.addEventListener('change', () => { umbral = Number(sel.value); guarda('liq-umbral', umbral); pinta(); });
    const aviso = viejo > 4 ? el('p', { class: 'liq-aviso' }, 'Atención: estos datos son de ' + hace(datos.generado) + ' (' + fh(datos.generado) + '); el monitor no se ha actualizado desde entonces.') : null;
    const mn = datos.tamanosUsd; const fuera = importe < mn[0] || importe > mn[mn.length - 1];
    raiz.replaceChildren(...[
      el('div', { class: 'liq-cab' }, el('h3', null, '¿Cuánto cuesta vender en SUNSwap?'), el('p', { class: 'sub' }, 'Escribe cuántos dólares quieres vender de cada token y lo cambiamos por USDT. Calculamos cuánto perderías por la comisión y por el deslizamiento de la curva, repartiendo la venta entre los mercados de SUNSwap (V1, V2, V3 y V4) donde sale mejor.')),
      el('form', { class: 'liq-form', onsubmit: (e) => e.preventDefault() }, el('label', null, 'Importe a vender (USD)', inp), el('div', { class: 'liq-qs', role: 'group', 'aria-label': 'Importes habituales' }, rapidos), el('label', null, 'Coste máximo que acepto', sel)),
      fuera ? el('p', { class: 'liq-aviso' }, 'El cálculo cubre de ' + usd(mn[0]) + ' a ' + usd(mn[mn.length - 1]) + '. Para ese importe no hay dato.') : null,
      aviso, pintaTabla(),
      el('p', { class: 'liq-pie' }, 'Leído el ' + fh(datos.generado) + ' (' + hace(datos.generado) + '), bloque ' + n(datos.bloque.n) + ' de TRON. «Sí»: cuesta hasta tu límite; «Caro»: hasta cuatro veces tu límite; «No»: más, o no cabe entero. El monitor relee la cadena cada hora y renueva esta página cuando cambia algún veredicto o, como mucho, cada 3 horas.'),
      el('details', { class: 'liq-met' }, el('summary', null, 'Cómo se calcula y qué no dice'),
        el('ul', null,
          el('li', null, el('b', null, 'Es una simulación, no una venta real. '), 'Se lee el estado de cada mercado (reservas en V1 y V2; precio, liquidez y mapa de ticks en V3 y V4) y se calcula, con enteros exactos, lo que daría vender ese importe. El mismo motor reprodujo los cotizadores oficiales de los contratos en ' + (datos.validacion ? datos.validacion : 'la comparación del día') + '.'),
          el('li', null, el('b', null, 'Coste = comisión + deslizamiento. '), 'No incluye la energía/gas de TRON ni las aprobaciones, ni lo que cambie el mercado entre que miras y que operas.'),
          el('li', null, el('b', null, 'El importe se valora al precio del mercado más profundo. '), 'Para vender «1 M$ de JST» se vende la cantidad de JST que valía 1 M$ a ese precio; lo que recibes es lo que devuelve la curva.'),
          el('li', null, el('b', null, 'Dos rutas. '), 'Directa (token → USDT, repartida entre los mercados token/USDT) y de dos saltos (token → TRX/WTRX → USDT). Se muestra la que más da; una mezcla de las dos podría dar algo más. WTRX y TRX se tratan como equivalentes 1 a 1 (envolver y desenvolver no tiene coste de mercado; sí algo de energía).'),
          el('li', null, el('b', null, 'Capital no es liquidez vendible. '), 'Un mercado puede tener millones depositados fuera del rango de precios actual y no admitir una venta: aquí cuenta lo que realmente absorbe la venta.'),
          el('li', null, el('b', null, 'Límites. '), 'Mapa de ticks leído en una ventana alrededor del precio actual (60 palabras del bitmap a cada lado); lo que quede fuera cuenta como «no cabe». Mercados con hooks que alteran el intercambio, y mercados con menos de 200 $, no se incluyen.')),
          el('p', null, 'Método completo en el informe ', el('a', { href: 'doc.html?f=investigacion/docs/SUNSWAP-INFORME-FINAL-2026-11-12.md#8-profundidad-y-eficiencia' }, 'SUNSwap bajo el microscopio (apartado 8)'), '. Nada de esto es consejo de inversión.'))].filter(Boolean));
  }
  fetch('data/liquidez-sunswap.json', { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then((d) => { datos = d; pinta(); })
    .catch((e) => raiz.replaceChildren(el('p', { class: 'muted' }, 'Todavía no hay datos del monitor (' + e.message + '). Se publican cuando el publicador de EquipoIA los lee de la cadena.')));
})();
