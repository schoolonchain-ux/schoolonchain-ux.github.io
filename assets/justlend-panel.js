/* Zona 3 · pestaña «Recuperar de JustLend»: ¿puedo recuperar mi dinero de JustLend?
   Lee data/justlend-panel.json, que prepara cada hora el publicador de EquipoIA leyendo la cadena (TronGrid, solo lectura): caja, deuda y precios de los 24 mercados, gobierno (dueño, implementación,
   oráculo, guardián, Timelock), la reserva de la PSM de USDD y el coste de vender cada token por USDT en sun.io. Los poderes del emisor de cada token y la concentración de los titulares NO se releen
   cada hora: son la foto de la investigación del 13-nov-2026 (la pestaña lo dice). El semáforo es la regla de assets/justlend-regla.js (la misma del informe). «Mi cuenta» lee en TU navegador
   la posición de una dirección en los 24 mercados (nodo público de TronGrid) y no guarda nada. Sin IA. */
(function () {
  const { el, n, m } = C;
  const raiz = document.getElementById('justlend-raiz'); if (!raiz) return;
  const R = window.JLR; if (!R) { raiz.replaceChildren(el('p', { class: 'muted' }, 'No se pudo cargar el cálculo de la pestaña.')); return; }
  const lee = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const guarda = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) { /* sin almacenamiento */ } };
  const TS = (a) => 'https://tronscan.org/#/address/' + a;
  const esDir = (x) => typeof x === 'string' && /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(x);
  const val = (x) => (x == null || x === '' ? 'nada' : esDir(x) ? ext(TS(x), x) : String(x));   // direcciones con enlace a TronScan; el resto (números, textos) tal cual
  const ext = (href, texto, cls) => el('a', { class: cls || 'addr', href, target: '_blank', rel: 'noopener', title: 'Se abre en otra pestaña' }, texto);
  const fh = (t) => new Date(t).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const hace = (h) => (h < 1 ? 'hace ' + n(Math.max(1, Math.round(h * 60))) + ' min' : h < 48 ? 'hace ' + n(Math.round(h * 10) / 10, 1) + ' h' : 'hace ' + n(Math.round(h / 24)) + ' días');
  const pc = (x, d = 1) => (x == null ? '—' : n(x, d) + ' %');
  const NOMBRE = { recuperable: 'Recuperable', parcial: 'Parcial', comprometido: 'Comprometido', desconocido: 'Desconocido' };
  const CLASE = { recuperable: 'verde', parcial: 'ambar', comprometido: 'rojo', desconocido: 'gris' };
  const badge = (v) => el('span', { class: 'liq-b ' + CLASE[v] }, NOMBRE[v].toUpperCase());
  let datos = null, importe = Number(lee('jl-importe', '100000')) || 100000, cerrados = lee('jl-cerrados', '0') === '1', abiertos = new Set();
  const cuerpo = { tabla: el('div'), resumen: el('p', { class: 'jlp-resumen' }) };

  const edadH = () => (datos && datos.lecturas && datos.lecturas.mercados ? (Date.now() - Date.parse(datos.lecturas.mercados.hasta.ts)) / 36e5 : null);
  const merge = (mk) => { const p = datos.poderes[mk.jToken] || {}; return { ...mk, poderes: p.poderes || null, parteTop3: p.parteTop3, reclamoUSDfoto: p.reclamoUSDfoto }; };
  const ctx = () => ({ psm: datos.psm ? datos.psm.usdtEnPSM : null, edadH: edadH() });

  // mini gráfico: coste de vender frente al tamaño (escala de raíz del coste), con el importe y las líneas del 1 % y del 5 %
  function grafico(mk, usd) {
    const c = (mk.venta && mk.venta.curva) || []; if (c.length < 2) return null;
    const W = 300, H = 92, pad = 6, x0 = Math.log(c[0][0]), x1 = Math.log(c[c.length - 1][0]);
    const X = (u) => pad + (Math.log(u) - x0) / (x1 - x0) * (W - 2 * pad), Y = (p) => H - 16 - Math.sqrt(Math.min(100, Math.max(0, p)) / 100) * (H - 26);
    const ns = 'http://www.w3.org/2000/svg'; const mkS = (tag, a) => { const e = document.createElementNS(ns, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const svg = mkS('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'liq-graf', role: 'img', 'aria-label': 'Coste de vender frente al tamaño de la venta' });
    svg.append(mkS('line', { x1: pad, y1: H - 16, x2: W - pad, y2: H - 16, class: 'ej' }));
    for (const lim of [1, 5]) { svg.append(mkS('line', { x1: pad, y1: Y(lim), x2: W - pad, y2: Y(lim), class: 'lim' })); const t = mkS('text', { x: W - pad, y: Y(lim) - 3, 'text-anchor': 'end', class: 'et' }); t.textContent = lim + ' %'; svg.append(t); }
    let d = ''; c.forEach((p) => { d += (d ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }); svg.append(mkS('path', { d, class: 'cur' }));
    if (usd >= c[0][0] && usd <= c[c.length - 1][0]) { svg.append(mkS('line', { x1: X(usd), y1: 4, x2: X(usd), y2: H - 16, class: 'imp' })); const co = R.costeA(c, usd); if (co != null) svg.append(mkS('circle', { cx: X(usd), cy: Y(co), r: 3.5, class: 'pt' })); }
    [[c[0][0], 'start'], [c[c.length - 1][0], 'end']].forEach(([u, an]) => { const tx = mkS('text', { x: X(u), y: H - 3, 'text-anchor': an, class: 'et' }); tx.textContent = R.dolar(u); svg.append(tx); });
    return svg;
  }

  function celdaVenta(mk, ev) {
    const v = mk.venta || {};
    if (v.esUSDT) return el('td', null, el('b', null, 'Ya es USDT'), el('div', { class: 'jlp-sub' }, 'No hay que venderlo'));
    if (v.sinMercado) return el('td', null, el('b', null, 'Sin mercado'), el('div', { class: 'jlp-sub' }, 'Ni con USDT ni con TRX en sun.io'));
    if (ev.coste == null) return el('td', null, el('b', null, 'No medible'), el('div', { class: 'jlp-sub' }, 'El importe supera lo que mide el motor'));
    return el('td', null, el('b', null, pc(ev.coste, ev.coste < 1 ? 2 : 1)), el('div', { class: 'jlp-sub' }, 'recibes ≈ ' + R.dolar(ev.salida)));
  }
  function detalle(mk, ev, usd) {
    const pt = R.poderesTexto(mk.poderes), gr = grafico(mk, usd), v = mk.venta || {};
    const filas = [
      ['Caja (lo que se retira de golpe)', m(mk.cajaUSD) + ' · ' + n(mk.caja, mk.caja < 1000 ? 2 : 0) + ' ' + mk.token],
      ['Lo depositado en total (reclamo)', m(mk.reclamoUSD) + ' · cobertura de la caja ' + pc((mk.cobertura || 0) * 100, 2)],
      ['Prestado', m(mk.prestadoUSD) + ' · utilización ' + pc((mk.utilizacion || 0) * 100, 2)],
      ['Precio que usa JustLend (oráculo)', mk.precioUSD == null ? '—' : '≈ ' + n(mk.precioUSD, mk.precioUSD < 1 ? 4 : 2) + ' $'],
      ['Si se vende toda la caja en sun.io', v.esUSDT ? 'Ya es USDT' : v.usdtObtenibles == null ? 'No medible' : '≈ ' + m(v.usdtObtenibles) + ' de USDT como mucho (cifra segura)'],
      ['Mercado', mk.abierto ? 'abierto' : 'cerrado a nuevos depósitos y préstamos (solo salida)'],
    ];
    return el('tr', { class: 'liq-detf' }, el('td', { colspan: 6 }, el('div', { class: 'liq-det' },
      el('div', null,
        el('p', null, el('b', null, 'Por qué sale ' + NOMBRE[ev.v].toLowerCase() + ' con ' + m(usd) + ':')),
        el('ul', { class: 'liq-partes' }, ev.razones.map((x) => el('li', null, x))),
        el('p', { class: 'jlp-sub' }, ev.of.tipo + '.'), el('p', { class: 'jlp-sub' }, pt.largo + (mk.poderes && mk.poderes.owner ? ' Dueño del token: ' : ''), mk.poderes && mk.poderes.owner ? ext(TS(mk.poderes.owner), mk.poderes.owner) : null),
        el('table', { class: 'jlp-mini' }, filas.map((f) => el('tr', null, el('th', null, f[0]), el('td', null, f[1])))),
        el('p', { class: 'jlp-sub' }, 'Contrato del mercado: ', ext(TS(mk.jToken), mk.jToken), mk.tokenDir && mk.tokenDir !== 'TRX' ? [' · Token: ', ext(TS(mk.tokenDir), mk.tokenDir)] : ' · Token nativo'),
        mk.admin ? el('p', { class: 'jlp-sub' }, 'Dueño del mercado: ', ext(TS(mk.admin), mk.admin), mk.implementacion ? [' · Implementación: ', ext(TS(mk.implementacion), mk.implementacion)] : null) : null),
      el('div', null, gr, gr ? el('p', { class: 'jlp-sub' }, 'Coste de vender frente al tamaño de la venta (el punto es tu importe).') : null))));
  }
  function pintarTabla() {
    const c = ctx(); const todos = datos.mercados.map(merge).sort((a, b) => (b.cajaUSD || 0) - (a.cajaUSD || 0)); const lista = todos.filter((x) => x.abierto || cerrados);
    const evs = new Map(lista.map((x) => [x.jToken, R.veredicto(x, importe, c)]));
    const cuenta = { recuperable: 0, parcial: 0, comprometido: 0, desconocido: 0 }; for (const e of evs.values()) cuenta[e.v]++;
    cuerpo.resumen.replaceChildren(el('b', null, 'Con ' + m(importe) + ' en cada token: '), ...['recuperable', 'parcial', 'comprometido', 'desconocido'].map((k) => el('span', { class: 'jlp-cuenta' }, badge(k), ' ' + cuenta[k])), el('span', { class: 'jlp-sub' }, ' de ' + lista.length + ' mercados'));   // replaceChildren no aplana arrays
    const filas = [];
    for (const x of lista) {
      const ev = evs.get(x.jToken), pt = R.poderesTexto(x.poderes), ab = abiertos.has(x.jToken);
      const tr = el('tr', { class: 'liq-fila' + (ab ? ' abierta' : ''), tabindex: 0, role: 'button', 'aria-expanded': ab ? 'true' : 'false' },
        el('td', { class: 'liq-tok' }, el('b', null, x.token), el('div', { class: 'jlp-sub' }, x.simbolo + (x.abierto ? '' : ' · cerrado'))),
        el('td', null, el('b', null, m(x.cajaUSD)), el('div', { class: 'jlp-sub' }, pc((x.cobertura || 0) * 100, 1) + ' de lo depositado')),
        celdaVenta(x, ev),
        el('td', null, el('span', { class: ev.of.verificable ? '' : 'jlp-sub' }, ev.of.corto)),
        el('td', null, el('span', { class: 'jlp-pod ' + pt.nivel }, pt.corto)),
        el('td', null, badge(ev.v)));
      const alternar = () => { if (abiertos.has(x.jToken)) abiertos.delete(x.jToken); else abiertos.add(x.jToken); pintarTabla(); };
      tr.addEventListener('click', alternar); tr.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); } });
      filas.push(tr); if (ab) filas.push(detalle(x, ev, importe));
    }
    const th = (t, num) => el('th', { class: num ? 'num' : '' }, t);
    cuerpo.tabla.replaceChildren(el('div', { class: 'jlp-scroll' }, el('table', { class: 'jlp-tabla' }, el('thead', null, el('tr', null, th('Token'), th('1 · Caja de JustLend'), th('2 · Venta en sun.io'), th('3 · Salida oficial'), th('4 · Poderes del emisor'), th('Veredicto'))), el('tbody', null, filas))));
  }

  // ---------- Mi cuenta (se lee en el navegador de quien la usa) ----------
  const cuentaBox = el('div', { class: 'panel jlp-cuenta-box' });
  const hex20 = new Map();
  async function dirHex(a) { if (!hex20.has(a)) hex20.set(a, await window.USDT.tronAHex20(a)); return hex20.get(a); }
  async function leerCuenta(addr) {
    const U = window.USDT; if (!U || !U.tronAHex20) throw new Error('falta el módulo de direcciones');
    const h = await U.tronAHex20(addr.trim()); if (!h) throw new Error('No parece una dirección de TRON válida (empieza por T y tiene 34 caracteres).');
    const w = h.padStart(64, '0'); const mk = datos.mercados; const cuerpoRpc = [];
    for (let i = 0; i < mk.length; i++) cuerpoRpc.push({ jsonrpc: '2.0', id: i + 1, method: 'eth_call', params: [{ to: '0x' + await dirHex(mk[i].jToken), data: '0xc37f68e2' + w }, 'latest'] });
    let res = null; for (let t = 0; t < 3 && !res; t++) { try { const r = await fetch('https://api.trongrid.io/jsonrpc', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpoRpc) }); if (r.status === 429) { await new Promise((ok) => setTimeout(ok, 2500 * (t + 1))); continue; } const j = await r.json(); if (Array.isArray(j) && j.length === mk.length) res = j; } catch (e) { /* reintento */ } }
    if (!res) throw new Error('TronGrid no respondió (límite de consultas). Vuelve a probar en un minuto.');
    const por = new Map(res.map((x) => [x.id, x])); const filas = []; let fallos = 0;
    mk.forEach((x, i) => {
      const r = por.get(i + 1); const hx = r && r.result ? String(r.result).replace(/^0x/, '') : ''; if (hx.length < 256) { fallos++; return; }
      const e = BigInt('0x' + hx.slice(0, 64)); if (e !== 0n) { fallos++; return; }
      const bal = BigInt('0x' + hx.slice(64, 128)), deu = BigInt('0x' + hx.slice(128, 192)), exch = BigInt('0x' + hx.slice(192, 256)); const dv = 10 ** x.decimales;
      const dep = Number(bal * exch / (10n ** 18n)) / dv, deuda = Number(deu) / dv; if (dep > 0 || deuda > 0) filas.push({ m: x, dep, deuda });
    });
    return { filas, fallos };
  }
  function pintarCuenta(addr, r) {
    const c = ctx(); const sal = [];
    const grandes = r.filas.filter((f) => { const p = f.m.precioUSD || 0; return f.dep * p >= 0.5 || f.deuda * p >= 0.5; }), polvo = r.filas.length - grandes.length;   // se ignoran las posiciones de menos de 0,5 $ (restos)
    if (!grandes.length) sal.push(el('p', null, 'Esta dirección no tiene depósitos ni deudas de más de 0,5 $ en ninguno de los 24 mercados de JustLend' + (r.fallos ? ' (' + r.fallos + ' mercados no se pudieron leer)' : '') + '.'));
    else {
      let totDep = 0, totRet = 0, totSal = 0, deuda = 0, hayDeuda = false;
      const trs = grandes.sort((a, b) => b.dep * (b.m.precioUSD || 0) - a.dep * (a.m.precioUSD || 0)).map((f) => {
        const mk = merge(f.m); const usd = f.dep * (mk.precioUSD || 0), dUsd = f.deuda * (mk.precioUSD || 0); deuda += dUsd; if (f.deuda > 0) hayDeuda = true;
        if (!(usd > 0)) return el('tr', null, el('td', { class: 'liq-tok' }, el('b', null, mk.token), el('div', { class: 'jlp-sub' }, mk.simbolo)), el('td', { class: 'num' }, '—'), el('td', { class: 'num' }, m(mk.cajaUSD)), el('td', { class: 'num' }, '—'), el('td', { class: 'num' }, m(dUsd)), el('td', null, el('span', { class: 'jlp-sub' }, 'sin depósito')));
        const ev = R.veredicto(mk, usd, c); const ret = Math.min(usd, mk.cajaUSD || 0); totDep += usd; totRet += ret;
        const rv = R.veredicto(mk, ret, c); if (rv.salida != null) totSal += rv.salida;
        return el('tr', null, el('td', { class: 'liq-tok' }, el('b', null, mk.token), el('div', { class: 'jlp-sub' }, mk.simbolo)), el('td', { class: 'num' }, m(usd), el('div', { class: 'jlp-sub' }, n(f.dep, f.dep < 1000 ? 2 : 0) + ' ' + mk.token)),
          el('td', { class: 'num' }, m(mk.cajaUSD)), el('td', { class: 'num' }, m(ret), el('div', { class: 'jlp-sub' }, pc(usd > 0 ? ret / usd * 100 : 0, 0) + ' de lo tuyo')), el('td', { class: 'num' }, f.deuda > 0 ? m(dUsd) : '—'), el('td', null, badge(ev.v)));
      });
      const nDep = grandes.filter((f) => f.dep * (f.m.precioUSD || 0) >= 0.5).length;
      sal.push(el('p', null, el('b', null, 'Tienes ' + m(totDep) + ' depositados'), ' en ' + nDep + (nDep === 1 ? ' mercado' : ' mercados') + '. ', el('b', null, 'Retirable ahora, de golpe: ' + m(totRet)), ' (' + pc(totDep > 0 ? totRet / totDep * 100 : 0, 0) + '). Vendiendo en sun.io eso daría ≈ ' + m(totSal) + ' en USDT (cada token por separado: las ventas comparten mercados, así que es una cifra optimista).'));
      if (hayDeuda) sal.push(el('p', { class: 'liq-aviso' }, 'Tienes deuda (' + m(deuda) + ' en total). Retirar depósitos que la respaldan puede ser rechazado por JustLend si te dejara sin garantía suficiente: este panel no calcula tu margen.'));
      sal.push(el('div', { class: 'jlp-scroll' }, el('table', { class: 'jlp-tabla' }, el('thead', null, el('tr', null, ['Mercado', 'Tu depósito', 'Caja del mercado', 'Retirable ahora', 'Tu deuda', 'Veredicto'].map((t, i) => el('th', { class: i > 0 && i < 5 ? 'num' : '' }, t)))), el('tbody', null, trs))));
    }
    if (polvo && grandes.length) sal.push(el('p', { class: 'jlp-sub' }, polvo + (polvo === 1 ? ' posición de menos de 0,5 $ no se muestra.' : ' posiciones de menos de 0,5 $ no se muestran.')));
    if (r.fallos) sal.push(el('p', { class: 'liq-aviso' }, r.fallos + ' de 24 mercados no se pudieron leer: la cuenta puede tener más posiciones de las que se ven.'));
    sal.push(el('p', { class: 'jlp-sub' }, 'Cuenta: ', ext(TS(addr), addr), ' · lectura de ahora mismo en TronGrid desde tu navegador; no se guarda.'));
    return sal;
  }
  function montarCuenta() {
    const inp = el('input', { type: 'text', placeholder: 'Dirección de TRON (T…)', 'aria-label': 'Dirección de TRON', spellcheck: 'false', autocomplete: 'off', maxlength: 64 });
    const btn = el('button', { type: 'button', class: 'btn primary' }, 'Ver mi posición'); const salida = el('div', { 'aria-live': 'polite' });
    const ir = async () => {
      const a = inp.value.trim(); if (!a) { salida.replaceChildren(el('p', { class: 'liq-aviso' }, 'Escribe una dirección.')); return; }
      btn.disabled = true; salida.replaceChildren(el('p', { class: 'muted' }, 'Leyendo los 24 mercados…'));
      try { const r = await leerCuenta(a); salida.replaceChildren(...pintarCuenta(a, r)); } catch (e) { salida.replaceChildren(el('p', { class: 'liq-aviso' }, e.message)); }
      btn.disabled = false;
    };
    btn.addEventListener('click', ir); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') ir(); });
    cuentaBox.replaceChildren(el('h4', { style: 'margin:0 0 4px' }, 'Mi cuenta'), el('p', { class: 'sub' }, 'Pega una dirección y verás qué tiene depositado y debe en JustLend y cuánto podría retirar ahora. Solo lectura: la consulta sale de tu navegador hacia el nodo público de TronGrid y no se guarda.'), el('div', { class: 'liq-form' }, el('label', null, 'Dirección', inp), btn), salida);
  }

  function pintarTodo() {
    const e = edadH(), c = datos.cambios || [];
    const estado = el('div', { class: 'jlp-estado' }, el('b', null, 'Lectura en vivo: '), e == null ? 'sin fecha' : hace(e) + ' · bloque ' + n(datos.bloque.n) + ' (' + fh(datos.bloque.ts) + ')', ' · ', ext('data/justlend-panel.json', 'datos en bruto', 'addr'), ' · ', el('a', { href: 'justlend.html' }, 'la investigación completa →'));
    const avisoEdad = e != null && e > R.LIMITE_EDAD_H ? el('p', { class: 'liq-aviso' }, 'La lectura tiene ' + n(Math.round(e * 10) / 10, 1) + ' horas. Con más de ' + R.LIMITE_EDAD_H + ' h el panel no clasifica: todo sale «desconocido» hasta que se renueve.') : null;
    const cambios = c.length
      ? el('div', { class: 'jlp-alerta' }, el('b', null, '⚠ ' + c.length + (c.length === 1 ? ' cambio' : ' cambios') + ' respecto a la investigación del 13-nov'), el('ul', null, c.map((x) => el('li', null, el('b', null, x.donde + ' · ' + x.campo + ': '), val(x.antes), ' → ', val(x.ahora)))), el('p', { class: 'jlp-sub' }, 'Un cambio de dueño, de implementación o de oráculo puede cambiar quién controla el dinero: revisa qué ha pasado antes de fiarte del semáforo.'))
      : el('p', { class: 'jlp-ok' }, '✓ Sin cambios de gobierno desde la investigación del 13-nov: mismo dueño, implementación, oráculo, guardián y plazo del Timelock (' + n(datos.gobierno.retardoTimelockSeg / 3600) + ' h) en el Comptroller y en los ' + datos.mercados.length + ' mercados.');
    const t = datos.totales, kpi = (titulo, valor, sub) => el('div', { class: 'jlp-kpi' }, el('span', null, titulo), el('strong', null, valor), el('small', null, sub));
    const kpis = el('div', { class: 'jlp-kpis' },
      kpi('Caja de JustLend', m(t.cajaUSD), 'lo que hay ahora para retirar de golpe'),
      kpi('Prestado', m(t.prestadoUSD), pc(t.reclamoUSD ? t.prestadoUSD / t.reclamoUSD * 100 : 0, 1) + ' de lo depositado'),
      kpi('Vendible por USDT en sun.io', m(t.vendibleUSD), pc(t.cajaUSD ? t.vendibleUSD / t.cajaUSD * 100 : 0, 1) + ' de la caja (suma de estimaciones por separado)'),
      kpi('USDT en la PSM de USDD', datos.psm.usdtEnPSM == null ? '—' : m(datos.psm.usdtEnPSM), 'salida oficial de USDD, compartida'));
    const inp = el('input', { type: 'text', inputmode: 'decimal', value: n(importe), 'aria-label': 'Importe en dólares' });
    const poner = (v) => { importe = Math.max(1, Math.round(v)); guarda('jl-importe', importe); inp.value = n(importe); qs.forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === importe)); pintarTabla(); };
    const qs = [[1e4, '10 mil'], [1e5, '100 mil'], [1e6, '1 M'], [1e7, '10 M'], [1e8, '100 M']].map(([v, t2]) => el('button', { type: 'button', class: 'liq-q' + (v === importe ? ' on' : ''), 'data-v': v, onclick: () => poner(v) }, t2 + ' $'));
    inp.addEventListener('change', () => { const v = Number(String(inp.value).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.')); if (v > 0) poner(v); else inp.value = n(importe); });
    inp.addEventListener('input', () => { const v = Number(String(inp.value).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.')); if (v > 0) { importe = Math.round(v); guarda('jl-importe', importe); qs.forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === importe)); pintarTabla(); } });
    const chk = el('input', { type: 'checkbox' }); chk.checked = cerrados; chk.addEventListener('change', () => { cerrados = chk.checked; guarda('jl-cerrados', cerrados ? 1 : 0); pintarTabla(); });
    const nCerr = datos.mercados.filter((x) => !x.abierto).length;
    const form = el('div', { class: 'liq-form' }, el('label', null, 'Cuánto quieres recuperar de cada token (dólares)', inp), el('div', { class: 'liq-qs' }, qs), el('label', { class: 'jlp-chk' }, chk, ' Incluir los ' + nCerr + ' mercados cerrados (solo salida)'));
    const reglas = el('details', { class: 'jlp-reglas' }, el('summary', null, 'Cómo se decide el semáforo'), el('ol', null,
      el('li', null, el('b', null, 'Desconocido'), ' si falta la lectura o tiene más de ' + R.LIMITE_EDAD_H + ' h.'), el('li', null, el('b', null, 'Comprometido'), ' si la caja es menor que tu importe (es un hecho, no una estimación).'),
      el('li', null, el('b', null, 'Desconocido'), ' si no hay mercado de venta o tu importe supera lo que mide el motor, y no hay salida oficial verificable.'), el('li', null, el('b', null, 'Comprometido'), ' si vender cuesta más del 5 % y no hay salida oficial.'),
      el('li', null, el('b', null, 'Parcial'), ' si tu importe es más de una décima parte de la caja, si vender cuesta entre el 1 % y el 5 %, si la única salida es lenta, si 3 cuentas reclaman ≥ 80 % de la caja, o si el dueño del token puede congelarlo o pausarlo (o no se sabe).'),
      el('li', null, el('b', null, 'Recuperable'), ' si nada de lo anterior se cumple.')), el('p', { class: 'jlp-sub' }, 'Las reglas se aplican por orden y gana la primera. Los umbrales (10 veces, 1 %, 5 %, 80 %) son un punto de partida, no están calibrados con datos históricos. Es la misma regla de la calculadora de la investigación.'));
    const pie = el('div', { class: 'jlp-pie' }, el('p', null, el('b', null, 'Qué se lee cada hora y qué no. '), 'En vivo: caja, deuda, precios del oráculo, pausas, dueños e implementaciones, PSM de USDD y el coste de vender cada token en sun.io. De la foto del 13-nov (no se relee): qué puede hacer el dueño de cada token (congelar, pausar, crear) y cuánto concentran los tres mayores titulares; por eso un token puede cambiar de poderes sin que este panel lo note todavía.'),
      el('p', null, el('b', null, 'Lo que NO es. '), 'No es una predicción ni un consejo financiero: es lo que la cadena dice ahora. El coste de venta es una estimación sobre el estado actual de sun.io; la suma de varios tokens no es una venta conjunta. Los canjes con el emisor de ETH y BTC y el plazo de sTRX no se pueden comprobar en la cadena (se dice en cada fila).'));
    raiz.replaceChildren(...[
      el('div', { class: 'liq-cab' }, el('h3', null, '¿Puedo recuperar mi dinero de JustLend?'), el('p', { class: 'sub' }, 'Para cada token: cuánta caja hay ahora para retirar, cuánto USDT sacarías vendiéndolo, qué salida oficial tiene y qué puede hacer el dueño del token. El semáforo se calcula con tu importe.')),
      estado, avisoEdad, cambios, kpis, form, cuerpo.resumen, cuerpo.tabla, reglas, cuentaBox, pie].filter(Boolean));   // replaceChildren(null) pinta «null»
    montarCuenta(); pintarTabla();
  }

  async function cargar() {
    try {
      const r = await fetch('data/justlend-panel.json?v=' + Math.floor(Date.now() / 600000), { cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status);
      datos = await r.json(); if (!datos.mercados || !datos.mercados.length) throw new Error('fichero vacío');
      pintarTodo();
    } catch (e) { raiz.replaceChildren(el('p', { class: 'liq-aviso' }, 'No se pudo leer el panel de JustLend (' + e.message + '). La investigación completa sigue disponible: ', el('a', { href: 'justlend.html' }, 'justlend.html'), '.')); }
  }
  cargar();
})();
