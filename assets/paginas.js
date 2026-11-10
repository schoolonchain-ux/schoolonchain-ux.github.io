/* Páginas de la fase de credibilidad: registro de cambios (cambios.html), archivo cronológico (archivo.html) y buscador (buscar.html).
   Todo se lee de ficheros publicados en este mismo sitio; nada se inventa aquí. Cada parte se activa si la página tiene su contenedor. */
(function () {
  const { el } = window.C;
  const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const dia = (iso) => { const d = new Date(iso); return isNaN(d) ? String(iso || '') : d.getUTCDate() + ' ' + MES[d.getUTCMonth()].slice(0, 3) + ' ' + d.getUTCFullYear(); };
  const leer = (u) => fetch(u, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(u + ': HTTP ' + r.status); return r.json(); });
  const q = new URLSearchParams(location.search);
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const fallo = (caja, e) => { caja.replaceChildren(el('p', { class: 'aviso-fallo' }, 'No se pudo leer: ' + (e && e.message ? e.message : e) + '. Recarga la página; si sigue igual, el fichero no está publicado.')); };
  const externo = (h) => /^https?:/.test(h);
  const enlace = (h, t, cls) => el('a', Object.assign({ href: h, class: cls || null }, externo(h) ? { target: '_blank', rel: 'noopener' } : {}), t);
  const chipsFiltro = (opciones, actual, alElegir) => el('div', { class: 'filtros', role: 'group' }, opciones.map(([k, t, nn]) => el('button', { class: 'chipf' + (k === actual ? ' on' : ''), type: 'button', 'aria-pressed': k === actual ? 'true' : 'false', onclick: () => alElegir(k) }, t, nn != null ? el('span', { class: 'cn' }, String(nn)) : null)));

  /* ============================== Registro de cambios ============================== */
  async function registro(caja) {
    let D, I;
    try { [D, I] = await Promise.all([leer('data/cambios.json'), leer('reports/index.json')]); } catch (e) { return fallo(caja, e); }
    const casos = Object.fromEntries(I.informes.map((r) => [r.slug, r]));
    const nomCaso = (s) => (casos[s] ? casos[s].caso || casos[s].titulo : s);
    const urlCaso = (s) => (casos[s] ? casos[s].url || 'report.html?r=' + encodeURIComponent(s) : null);
    const est = { tipo: D.tipos[q.get('tipo')] ? q.get('tipo') : '', caso: casos[q.get('caso')] ? q.get('caso') : '' };
    const lista = el('div', { class: 'reg-l' }), cab = el('div');
    function pintar() {
      const porCaso = D.cambios.filter((c) => !est.caso || c.caso === est.caso);
      const vis = porCaso.filter((c) => !est.tipo || c.tipo === est.tipo);
      cab.replaceChildren(
        el('div', { class: 'filtro-fila' }, el('span', { class: 'fl' }, 'Tipo'), chipsFiltro([['', 'Todos', porCaso.length]].concat(Object.entries(D.tipos).map(([k, t]) => [k, t, porCaso.filter((c) => c.tipo === k).length])), est.tipo, (k) => { est.tipo = k; pintar(); })),
        el('div', { class: 'filtro-fila' }, el('span', { class: 'fl' }, 'Caso'), chipsFiltro([['', 'Todos', D.cambios.length]].concat(Object.keys(casos).map((s) => [s, nomCaso(s), D.cambios.filter((c) => c.caso === s).length])), est.caso, (k) => { est.caso = k; pintar(); })),
        el('p', { class: 'muted cuenta' }, vis.length + (vis.length === 1 ? ' entrada' : ' entradas') + (est.tipo || est.caso ? ' con este filtro' : '') + ' · la más reciente primero'));
      lista.replaceChildren(...(vis.length ? vis.map(tarjeta) : [el('p', { class: 'muted' }, 'No hay entradas con este filtro.')]));
      const u = new URL(location.href); ['tipo', 'caso'].forEach((k) => { if (est[k]) u.searchParams.set(k, est[k]); else u.searchParams.delete(k); }); history.replaceState(null, '', u);
    }
    function tarjeta(c) {
      return el('article', { class: 'reg', id: 'c-' + c.id },
        el('div', { class: 'reg-c' }, el('span', { class: 'reg-f' }, dia(c.fecha)), el('span', { class: 'chip tipo-' + c.tipo }, D.tipos[c.tipo] || c.tipo), urlCaso(c.caso) ? el('a', { class: 'chip', href: urlCaso(c.caso) }, nomCaso(c.caso)) : null, el('a', { class: 'reg-a', href: '#c-' + c.id, title: 'Enlace a esta entrada' }, '#' + c.id)),
        el('h3', null, c.titulo),
        el('div', { class: 'reg-aa' }, el('div', null, el('b', null, 'Qué decíamos'), el('p', null, c.antes || 'sin dato')), el('div', null, el('b', null, 'Qué decimos ahora'), el('p', null, c.ahora || 'sin dato'))),
        c.porque ? el('p', { class: 'reg-p' }, el('b', null, 'Por qué cambia. '), c.porque) : null,
        el('p', { class: 'reg-p' }, el('b', null, 'Quién lo detectó. '), c.detectado || 'No consta.'),
        c.versionAntes || c.versionAhora ? el('p', { class: 'reg-p' }, el('b', null, 'Versiones. '), (c.versionAntes ? 'Anterior: ' + c.versionAntes + '. ' : '') + (c.versionAhora ? 'Nueva: ' + c.versionAhora + '.' : '')) : null,
        el('div', { class: 'reg-e' }, el('b', null, 'Evidencia'), el('div', { class: 'actions' }, (c.evidencia || []).map((e) => enlace(e.href, e.t, 'btn')))));
    }
    caja.replaceChildren(cab, lista); pintar();
    if (location.hash && document.getElementById(location.hash.slice(1))) document.getElementById(location.hash.slice(1)).scrollIntoView();
  }

  /* ============================== Archivo cronológico ============================== */
  async function archivo(caja) {
    let N, I, M, K;
    try { [N, I, M, K] = await Promise.all([leer('data/novedades.json'), leer('reports/index.json'), leer('data/medium.json').catch(() => null), leer('data/cambios.json').catch(() => null)]); } catch (e) { return fallo(caja, e); }
    const casos = Object.fromEntries(I.informes.map((r) => [r.slug, r]));
    const TIPOS = { inv: 'Investigaciones y seguimientos', cam: 'Registro de cambios', med: 'Artículos en Medium', web: 'Web y herramientas' };
    const items = [];
    for (const x of N.novedades || []) items.push({ fecha: x.fecha, tipo: casos[x.caso] ? 'inv' : 'web', caso: casos[x.caso] ? x.caso : '', titulo: x.titulo, url: x.url || './' });
    for (const c of (K && K.cambios) || []) if (c.tipo !== 'ampliacion') items.push({ fecha: c.fecha + 'T00:00:00Z', tipo: 'cam', caso: casos[c.caso] ? c.caso : '', titulo: (K.tipos[c.tipo] || c.tipo) + ': ' + c.titulo, url: 'cambios.html#c-' + c.id, soloDia: true });
    for (const a of (M && M.articulos) || []) items.push({ fecha: a.fecha, tipo: 'med', caso: '', titulo: a.titulo, url: a.url });
    items.sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));
    const cadenasDe = (s) => (casos[s] && casos[s].cadenas) || [];
    const todasCadenas = [...new Set(I.informes.flatMap((r) => r.cadenas || []))];
    const est = { tipo: TIPOS[q.get('tipo')] ? q.get('tipo') : '', caso: casos[q.get('caso')] ? q.get('caso') : '', cadena: todasCadenas.includes(q.get('cadena')) ? q.get('cadena') : '' };
    const cab = el('div'), lista = el('div', { class: 'arch-l' });
    function pintar() {
      const ok = (x, sin) => (sin === 'tipo' || !est.tipo || x.tipo === est.tipo) && (sin === 'caso' || !est.caso || x.caso === est.caso) && (sin === 'cadena' || !est.cadena || cadenasDe(x.caso).includes(est.cadena));
      const vis = items.filter((x) => ok(x));
      cab.replaceChildren(
        el('div', { class: 'filtro-fila' }, el('span', { class: 'fl' }, 'Tipo'), chipsFiltro([['', 'Todo', items.filter((x) => ok(x, 'tipo')).length]].concat(Object.entries(TIPOS).map(([k, t]) => [k, t, items.filter((x) => ok(x, 'tipo') && x.tipo === k).length])), est.tipo, (k) => { est.tipo = k; pintar(); })),
        el('div', { class: 'filtro-fila' }, el('span', { class: 'fl' }, 'Caso'), chipsFiltro([['', 'Todos', null]].concat(Object.keys(casos).map((s) => [s, casos[s].caso || casos[s].titulo, items.filter((x) => ok(x, 'caso') && x.caso === s).length])), est.caso, (k) => { est.caso = k; pintar(); })),
        el('div', { class: 'filtro-fila' }, el('span', { class: 'fl' }, 'Cadena'), chipsFiltro([['', 'Todas', null]].concat(todasCadenas.map((c) => [c, c, items.filter((x) => ok(x, 'cadena') && cadenasDe(x.caso).includes(c)).length])), est.cadena, (k) => { est.cadena = k; pintar(); })),
        el('p', { class: 'muted cuenta' }, vis.length + (vis.length === 1 ? ' publicación' : ' publicaciones') + ' · de ' + dia(items[items.length - 1].fecha) + ' a ' + dia(items[0].fecha) + (est.cadena ? ' · el filtro de cadena solo alcanza a lo que pertenece a un caso' : '')));
      const grupos = new Map(); for (const x of vis) { const d = new Date(x.fecha); const k = MES[d.getUTCMonth()] + ' de ' + d.getUTCFullYear(); (grupos.get(k) || grupos.set(k, []).get(k)).push(x); }
      lista.replaceChildren(...(vis.length ? [...grupos].map(([mes, xs]) => el('section', { class: 'arch-m' }, el('h3', null, mes.charAt(0).toUpperCase() + mes.slice(1), el('span', { class: 'cn' }, String(xs.length))), el('ul', null, xs.map((x) => el('li', null, el('span', { class: 'arch-f' }, dia(x.fecha)), el('span', { class: 'chip tipo-a-' + x.tipo }, TIPOS[x.tipo]), x.caso ? el('span', { class: 'chip' }, casos[x.caso].caso || x.caso) : null, enlace(x.url, x.titulo, 'arch-t')))))) : [el('p', { class: 'muted' }, 'No hay publicaciones con este filtro.')]));
      const u = new URL(location.href); ['tipo', 'caso', 'cadena'].forEach((k) => { if (est[k]) u.searchParams.set(k, est[k]); else u.searchParams.delete(k); }); history.replaceState(null, '', u);
    }
    caja.replaceChildren(cab, lista); pintar();
  }

  /* ============================== Buscador ============================== */
  async function buscador(caja) {
    const inp = document.getElementById('q'), res = el('div', { class: 'bus-r' }), estado = el('p', { class: 'muted cuenta' }, 'Cargando el índice…');
    caja.replaceChildren(estado, res);
    let IDX; try { IDX = await leer('data/busqueda.json'); } catch (e) { return fallo(caja, e); }
    const LIBRO = 'reports/trazabilidad-binance-0x5227/libro/'; let libro = null;
    const cargarLibro = () => libro || (libro = Promise.all([leer(LIBRO + 'cuentas.json'), leer(LIBRO + 'movs.json')]).then(([c, m]) => ({ c, m })));
    const esDir = (s) => /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(s) || /^0x[0-9a-fA-F]{40}$/.test(s);
    const esTx = (s) => /^(0x)?[0-9a-fA-F]{64}$/.test(s);
    const sinPref = (s) => s.toLowerCase().replace(/^0x/, '');
    const explorador = (d) => (/^0x/.test(d) ? 'https://etherscan.io/address/' + d : 'https://tronscan.org/#/address/' + d);
    const expTx = (h) => (/^0x/.test(h) ? 'https://etherscan.io/tx/' + h : 'https://tronscan.org/#/transaction/' + h);
    const GR = { dir: 'Direcciones', tx: 'Transacciones', inf: 'Informes y capítulos', doc: 'Documentos', cam: 'Registro de cambios', nov: 'Novedades', pag: 'Páginas y herramientas' };
    const tarjetaDir = (d) => el('div', { class: 'bus-i' }, el('div', { class: 'bus-d' }, d.a), el('ul', null, d.r.map((r) => el('li', null, r.t, r.f ? el('span', { class: 'muted' }, ' · ' + r.f) : null))), el('div', { class: 'actions' }, d.u ? enlace(d.u, 'Abrir en nuestro informe', 'btn primary') : null, enlace('herramientas.html?dir=' + encodeURIComponent(d.a), 'Comprobar si está bloqueada por Tether', 'btn'), enlace(explorador(d.a), 'Ver en el explorador', 'btn')));
    const tarjetaTx = (t) => el('div', { class: 'bus-i' }, el('div', { class: 'bus-d' }, t.h), el('p', null, t.d), el('div', { class: 'actions' }, t.u ? enlace(t.u, 'Dónde aparece', 'btn primary') : null, enlace(expTx(t.h), 'Ver en el explorador', 'btn')));
    const fechaS = (s) => new Date(s * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    async function enLibro(texto, cajaL) {
      cajaL.replaceChildren(el('p', { class: 'muted' }, 'Buscando en el libro mayor del informe de Binance (unos 6 MB la primera vez)…'));
      let L; try { L = await cargarLibro(); } catch (e) { return fallo(cajaL, e); }
      const { c, m } = L; const n0 = (v, d) => Number(v).toLocaleString('es-ES', { maximumFractionDigits: d == null ? 2 : d });
      const fila = (r) => el('tr', null, el('td', null, fechaS(r[6])), el('td', { class: 'mono' }, c.dir[r[1]]), el('td', { class: 'mono' }, c.dir[r[2]]), el('td', { class: 'num' }, n0(r[4]) + ' ' + c.activos[r[3]]), el('td', { class: 'num' }, r[5] ? n0(r[5], 0) + ' $' : '—'), el('td', null, c.tipos[r[7]].replace(/_/g, ' ')), el('td', null, el('span', { class: 'est est-' + c.estados[r[8]] }, c.estados[r[8]])), el('td', null, enlace(expTx(r[0]), 'ver', 'lnk')));
      const tabla = (rows) => el('div', { class: 'tw' }, el('table', { class: 'tb' }, el('thead', null, el('tr', null, ['Hora', 'De', 'A', 'Importe', 'Valor', 'Tipo', 'Evidencia', ''].map((t) => el('th', null, t)))), el('tbody', null, rows.map(fila))));
      if (esTx(texto)) {
        const h = sinPref(texto); const rows = m.filter((r) => sinPref(String(r[0])) === h);
        if (!rows.length) return cajaL.replaceChildren(el('p', { class: 'muted' }, 'Esa transacción no está entre los ' + m.length.toLocaleString('es-ES') + ' movimientos del libro mayor del informe de Binance.'));
        return cajaL.replaceChildren(el('p', null, el('b', null, 'En el libro mayor del informe de Binance: '), rows.length + (rows.length === 1 ? ' movimiento' : ' movimientos') + ' de esta transacción.'), tabla(rows));
      }
      const i = c.dir.findIndex((d) => d.toLowerCase() === texto.toLowerCase());
      if (i < 0) return cajaL.replaceChildren(el('p', { class: 'muted' }, 'Esa dirección no está entre las ' + c.dir.length.toLocaleString('es-ES') + ' del libro mayor del informe de Binance.'));
      const sal = m.filter((r) => r[1] === i), ent = m.filter((r) => r[2] === i); const k = c.cuentas.find((x) => x[0] === i); const clase = k ? c.clases[k[1]] : null;   // fila de cuenta: [índice de dirección, clase, nombre, …]
      const todos = sal.concat(ent).sort((a, b) => a[6] - b[6]);
      cajaL.replaceChildren(el('p', null, el('b', null, 'En el libro mayor del informe de Binance: '), 'aparece en ' + todos.length.toLocaleString('es-ES') + ' movimientos (' + ent.length.toLocaleString('es-ES') + ' de entrada y ' + sal.length.toLocaleString('es-ES') + ' de salida)' + (clase ? '; clasificada como «' + (window.C.claseNombre[clase] || clase) + '»' : '') + '.'),
        el('div', { class: 'actions' }, enlace('report.html?r=trazabilidad-binance-0x5227&abrir=ficha:' + encodeURIComponent(c.dir[i]), 'Abrir su ficha en el informe', 'btn primary')),
        todos.length ? tabla(todos.slice(0, 50)) : null, todos.length > 50 ? el('p', { class: 'muted' }, 'Se muestran los 50 primeros por hora. La ficha del informe los tiene todos.') : null);
    }
    function buscar() {
      const texto = inp.value.trim(); const u = new URL(location.href); if (texto) u.searchParams.set('q', texto); else u.searchParams.delete('q'); history.replaceState(null, '', u);
      if (!texto) { estado.textContent = 'Índice del ' + dia(IDX.generado) + ': ' + IDX.entradas.length.toLocaleString('es-ES') + ' páginas, capítulos, documentos y novedades, ' + IDX.direcciones.length.toLocaleString('es-ES') + ' direcciones y ' + IDX.transacciones.length.toLocaleString('es-ES') + ' transacciones citadas en lo publicado.'; res.replaceChildren(); return; }
      const out = [];
      if (esDir(texto) || esTx(texto)) {
        const exacta = esDir(texto) ? IDX.direcciones.filter((d) => d.a.toLowerCase() === texto.toLowerCase()) : []; const txs = esTx(texto) ? IDX.transacciones.filter((t) => sinPref(t.h) === sinPref(texto)) : [];
        if (exacta.length) out.push(el('section', { class: 'bus-g' }, el('h3', null, 'Lo que dicen de esta dirección nuestros informes'), exacta.map(tarjetaDir)));
        if (txs.length) out.push(el('section', { class: 'bus-g' }, el('h3', null, 'Esta transacción en lo publicado'), txs.map(tarjetaTx)));
        const cajaL = el('div', { class: 'bus-libro' }); out.push(el('section', { class: 'bus-g' }, el('h3', null, 'Libro mayor del informe de Binance'), cajaL)); enLibro(texto, cajaL);
        if (!exacta.length && !txs.length) out.unshift(el('p', { class: 'muted' }, 'No aparece citada en las páginas ni en los documentos publicados. Abajo se mira además en el libro mayor.'));
        if (esDir(texto) && !exacta.length) out.push(el('div', { class: 'actions' }, enlace('herramientas.html?dir=' + encodeURIComponent(texto), 'Comprobar si está bloqueada por Tether', 'btn'), enlace(explorador(texto), 'Ver en el explorador', 'btn')));
        estado.textContent = esDir(texto) ? 'Búsqueda exacta de una dirección.' : 'Búsqueda exacta de una transacción.'; res.replaceChildren(...out); return;
      }
      const terms = norm(texto).split(/\s+/).filter((t) => t.length > 1); if (!terms.length) { estado.textContent = 'Escribe al menos dos letras.'; res.replaceChildren(); return; }
      const puntua = (titulo, cuerpo) => { const t = norm(titulo), c = norm(cuerpo); let p = 0; for (const w of terms) { if (t.includes(w)) p += 3; else if (c.includes(w)) p += 1; else return 0; } return p; };
      const porGrupo = {};
      for (const e of IDX.entradas) { const p = puntua(e.t, e.x || e.d || ''); if (p) (porGrupo[e.k] = porGrupo[e.k] || []).push([p, e]); }
      const dirs = IDX.direcciones.map((d) => [puntua(d.a, d.r.map((r) => r.t + ' ' + (r.f || '')).join(' ')), d]).filter((x) => x[0]);
      const txs = IDX.transacciones.map((t) => [puntua(t.h, t.d), t]).filter((x) => x[0]);
      let total = dirs.length + txs.length;
      for (const k of ['inf', 'doc', 'cam', 'nov', 'pag']) { const xs = (porGrupo[k] || []).sort((a, b) => b[0] - a[0] || String(b[1].f || '').localeCompare(String(a[1].f || ''))); if (!xs.length) continue; total += xs.length; out.push(el('section', { class: 'bus-g' }, el('h3', null, GR[k], el('span', { class: 'cn' }, String(xs.length))), el('ul', { class: 'bus-l' }, xs.slice(0, 15).map(([, e]) => el('li', null, enlace(e.u, e.t, 'bus-t'), e.f ? el('span', { class: 'arch-f' }, dia(e.f)) : null, e.d ? el('p', { class: 'muted' }, e.d) : null))), xs.length > 15 ? el('p', { class: 'muted' }, 'Y ' + (xs.length - 15) + ' más: añade otra palabra para acotar.') : null)); }
      if (dirs.length) out.push(el('section', { class: 'bus-g' }, el('h3', null, GR.dir, el('span', { class: 'cn' }, String(dirs.length))), dirs.sort((a, b) => b[0] - a[0]).slice(0, 10).map(([, d]) => tarjetaDir(d)), dirs.length > 10 ? el('p', { class: 'muted' }, 'Y ' + (dirs.length - 10) + ' más.') : null));
      if (txs.length) out.push(el('section', { class: 'bus-g' }, el('h3', null, GR.tx, el('span', { class: 'cn' }, String(txs.length))), txs.sort((a, b) => b[0] - a[0]).slice(0, 10).map(([, t]) => tarjetaTx(t)), txs.length > 10 ? el('p', { class: 'muted' }, 'Y ' + (txs.length - 10) + ' más.') : null));
      estado.textContent = total ? total + (total === 1 ? ' resultado' : ' resultados') + ' para «' + texto + '».' : 'Nada para «' + texto + '». Prueba con otra palabra, o pega una dirección o el identificador de una transacción completos.';
      res.replaceChildren(...out);
    }
    let t0; inp.addEventListener('input', () => { clearTimeout(t0); t0 = setTimeout(buscar, 180); });
    const f = document.getElementById('form-buscar'); if (f) f.addEventListener('submit', (ev) => { ev.preventDefault(); clearTimeout(t0); buscar(); });
    if (q.get('q')) inp.value = q.get('q'); buscar(); inp.focus();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const r = document.getElementById('reg-cambios'); if (r) registro(r);
    const a = document.getElementById('archivo'); if (a) archivo(a);
    const b = document.getElementById('buscador'); if (b) buscador(b);
  });
})();
