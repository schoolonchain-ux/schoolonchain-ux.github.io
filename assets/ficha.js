/* Ficha de una dirección: quién es (según el rastreo), cuánto movió, con quién, y todos sus movimientos. */
(function () {
  const { el, n, m, pct } = C;
  const Ficha = (window.Ficha = { alGrafo: null, expandir: null });

  const TIPO = { transferencia: 'Transferencia', deposito_contrato: 'Depósito en contrato', retirada_contrato: 'Retirada de contrato', swap_entrada: 'Cambio (entra)', swap_salida: 'Cambio (sale)', puente_envio: 'Envío por puente', puente_recibo: 'Recibo de puente', comision: 'Comisión', congelacion: 'Congelación', transferencia_justificante: 'Justificante (jUSDT)' };
  const DESC = {
    origen: 'Billetera de origen o de reparto del robo: de aquí sale el dinero hacia el resto del recorrido.',
    billetera: 'Billetera intermedia del recorrido: ni servicio ni contrato. Recibe y reenvía.',
    nodo: 'Nodo de servicio: dirección con muchísima actividad (más de 5.000 operaciones). El rastreo se detiene aquí porque mezcla dinero de muchos usuarios.',
    casa: 'Dirección etiquetada como casa de cambio. Un depósito aquí NO identifica a la persona beneficiaria.',
    contrato: 'Contrato inteligente (intercambio, enrutador u otro). Lo que entra suele volver al remitente en otro activo.',
    prestamo: 'Protocolo de préstamos (JustLend): el dinero depositado queda allí o se retira con un justificante.',
    puente: 'Puente entre cadenas: el dinero sale de TRON hacia otra red.',
    usdd: 'Sistema USDD (conversión): el rastreo se detiene.',
    ethereum: 'Dirección en Ethereum (leída con Etherscan).',
    desconocida: 'Dirección sin clasificar.',
  };
  Ficha.TIPO = TIPO; Ficha.DESC = DESC;

  const tagClase = (cl) => el('span', { class: 'tag', style: 'background:' + (C.clase[cl] || '#64748b') }, C.claseNombre[cl] || cl);
  const badge = (e) => C.est(e);

  let ultimo = { d: '', t: 0 };
  Ficha.abrir = function (dir, o = {}) {
    const ahora = Date.now(); if (ultimo.d === dir && ahora - ultimo.t < 500) return; ultimo = { d: dir, t: ahora }; // evita abrir dos veces si el clic llega a la celda y a la fila
    const corto = UI.corto(dir, 8, 6);
    UI.abrir(o.titulo || 'Dirección ' + corto, () => {
      const cont = el('div', null, UI.cargando('Cargando el libro mayor completo (unos 2 MB la primera vez)…'));
      Libro.cargar().then(() => { cont.textContent = ''; cont.append(cuerpo(dir, o)); }).catch((e) => { cont.textContent = 'No se pudo cargar el libro mayor: ' + e; });
      return cont;
    }, { sub: dir, ancho: true });
  };

  function cuerpo(dir, o) {
    const evm = UI.evm(dir);
    const c = Libro.cuenta(dir), f = Libro.ficha(dir);
    const raiz = el('div');
    const cl = c ? c.clase : evm ? 'ethereum' : 'desconocida';
    // cabecera
    const acciones = el('div', { class: 'chips2' },
      el('button', { class: 'mini', onclick: (e) => UI.copiar(dir, e.target) }, '⧉ Copiar dirección'),
      UI.enlace(UI.urlDir(dir), (evm ? 'Abrir en Etherscan ↗' : 'Abrir en TronScan ↗'), 'mini'),
      Ficha.alGrafo ? el('button', { class: 'mini', onclick: () => { Ficha.alGrafo(dir, false); } }, '◎ Ver en el grafo') : null,
      Ficha.alGrafo ? el('button', { class: 'mini', onclick: () => { Ficha.alGrafo(dir, true); } }, '⇄ Añadir sus conexiones al grafo') : null);
    raiz.append(el('div', { class: 'chips2' }, tagClase(cl), c && c.nombre ? el('span', { class: 'chipx' }, c.nombre) : null,
      c && c.congelada === 1 ? el('span', { class: 'chipx bad' }, '❄ Congelada por Tether') : null, c && c.nivel >= 0 && c.nivel != null ? el('span', { class: 'chipx' }, 'Salto ' + c.nivel + ' desde la billetera de reparto') : null,
      el('span', { class: 'chipx' }, evm ? 'Ethereum' : 'TRON')), el('p', { class: 'narr' }, DESC[cl] || ''), acciones);

    const hs = hechos(dir);
    if (hs.length) raiz.append(el('div', { class: 'card', style: 'margin:10px 0' }, el('h3', null, 'Lo que dice el informe sobre esta dirección'), el('div', { class: 'cs' }, 'Datos de las tablas del informe (bloqueos, saldos, destinos, cruces…).'), el('div', { class: 'narr' }, hs.map((h) => el('div', { style: 'margin:7px 0;padding-left:10px;border-left:3px solid var(--line)' }, el('b', null, h.t, ' '), h.e ? C.est(h.e) : null, el('div', null, h.n))))));
    if (!f) {
      raiz.append(el('div', { class: 'ayuda' }, el('div', { class: 'ai' }, el('b', null, 'Sin movimientos propios en el libro mayor. '), 'El libro mayor registra los envíos entre direcciones del recorrido; esta dirección no tiene ninguno propio' + (hs.length ? ', pero el informe la menciona (arriba)' : '') + '. Para ver toda su actividad usa el explorador.')));
      return raiz;
    }
    // narrativa
    const t0 = UI.fechaS(f.primera), t1 = UI.fechaS(f.ultima);
    const nota = [];
    if (c && c.congelada === 1) nota.push('Tether la tiene en su <b>lista negra</b>: el USDT que conserve está bloqueado.');
    if (c && c.pureza != null && c.pureza >= 0) nota.push('El modelo atribuye al robo el <b>' + n(c.pureza * 100, 1) + ' %</b> del dinero que pasa por ella (ver «pureza» en el glosario).');
    raiz.append(el('p', { class: 'narr', html: 'Entre <b>' + t0 + '</b> y <b>' + t1 + '</b> UTC recibió <b>' + m(f.entra) + '</b> en ' + n(f.nEn) + ' movimientos desde ' + n(f.remitentes.length) + ' direcciones, y envió <b>' + m(f.sale) + '</b> en ' + n(f.nSa) + ' movimientos hacia ' + n(f.receptores.length) + ' direcciones. ' + nota.join(' ') }));
    // cifras
    const fk = (l, v, s) => el('div', { class: 'fk' }, el('div', { class: 'kl' }, l), el('div', { class: 'kv' }, v), s ? el('div', { class: 'kn' }, s) : null);
    const saldoOk = c && c.trx != null && c.trx >= 0;
    raiz.append(el('div', { class: 'fkpis' },
      fk('Recibido', m(f.entra), n(f.nEn) + ' movimientos'), fk('Enviado', m(f.sale), n(f.nSa) + ' movimientos'),
      fk('Diferencia', m(f.entra - f.sale), 'recibido − enviado'),
      fk('Saldo de hoy', saldoOk ? m(c.trx * Libro.meta.precioTRX + c.usdt) : '—', saldoOk ? n(c.trx) + ' TRX · ' + n(c.usdt) + ' USDT' : evm ? 'no se lee en TRON' : 'no leído'),
      fk('Pureza (modelo)', c && c.pureza != null && c.pureza >= 0 ? n(c.pureza * 100, 1) + ' %' : '—', 'parte atribuida al robo'),
      fk('Creada', c && c.creada ? UI.fecha(c.creada) : '—', 'UTC')));
    // gráfico de actividad por hora
    if (f.horas.length > 1) {
      const cv = el('canvas'); const caja = el('div', { class: 'card', style: 'margin:8px 0' }, el('h3', null, 'Actividad por hora (USD)'), el('div', { class: 'cs' }, 'Verde: recibido · naranja: enviado. Pulsa una barra para ver los movimientos de esa hora.'), el('div', { class: 'cv', style: 'height:170px' }, cv));
      raiz.append(caja);
      const lab = f.horas.map(([h]) => C.dm(h * 1000));
      const ch = new Chart(cv, UI.clicable({ type: 'bar', data: { labels: lab, datasets: [{ label: 'Recibido', data: f.horas.map(([, v]) => v.e), backgroundColor: C.css('--ok'), borderRadius: 2 }, { label: 'Enviado', data: f.horas.map(([, v]) => -v.s), backgroundColor: C.pal[2], borderRadius: 2 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, grid: { display: false }, ticks: { maxTicksLimit: 8, maxRotation: 0 } }, y: { stacked: true, ticks: { callback: (v) => m(Math.abs(v)) }, grid: { color: C.css('--line') } } }, plugins: { tooltip: { callbacks: { label: (x) => ' ' + x.dataset.label + ': ' + m(Math.abs(x.parsed.y)) } } } } }, (e) => { const h = f.horas[e.index][0]; pestaña('mov'); filtroHora(h); }));
    }
    // pestañas
    const tabs = el('div', { class: 'tabs' }); const cuerpoTabs = el('div'); raiz.append(tabs, cuerpoTabs);
    const filaContraparte = (x, lado) => ({ ...x, lado });
    const colCP = [
      { t: 'Dirección', v: (r) => { const cu = Libro.nombre(r.i); return el('span', null, el('a', { class: 'addr', onclick: () => Ficha.abrir(Libro.dir[r.i]) }, UI.corto(Libro.dir[r.i], 9, 6)), cu ? el('div', { class: 'muted', style: 'font-size:11.5px' }, cu) : null); }, o: (r) => Libro.dir[r.i], csv: (r) => Libro.dir[r.i] },
      { t: 'Tipo', v: (r) => tagClase(Libro.clase(r.i)), o: (r) => Libro.clase(r.i), csv: (r) => Libro.clase(r.i) },
      { t: 'Importe', num: 1, v: (r) => m(r.usd), o: (r) => r.usd, csv: (r) => Math.round(r.usd) },
      { t: 'Movs.', num: 1, v: (r) => n(r.n), o: (r) => r.n },
      { t: 'Primero', v: (r) => UI.fechaS(r.p), o: (r) => r.p },
      { t: 'Último', v: (r) => UI.fechaS(r.u), o: (r) => r.u }];
    const tablaMov = UI.tabla({
      pp: 12, csv: 'movimientos-' + UI.corto(dir, 6, 4), ph: 'Buscar por dirección, hash, activo…', orden: [0, -1],
      filtros: [{ t: 'Tipo', opciones: Object.values(TIPO), fn: (r, op) => TIPO[Libro.meta.tipos[r[7]]] === op }, { t: 'Activo', opciones: Libro.meta.activos, fn: (r, op) => Libro.meta.activos[r[3]] === op }, { t: 'Sentido', opciones: ['Recibido', 'Enviado'], fn: (r, op) => (op === 'Enviado') === (r[1] === f.i) }],
      cols: [
        { t: 'Fecha (UTC)', v: (r) => UI.fechaS(r[6]), o: (r) => r[6] },
        { t: 'Sentido', v: (r) => (r[1] === f.i ? el('span', { style: 'color:' + C.pal[2] }, '↗ Envía a') : el('span', { style: 'color:' + C.css('--ok') }, '↙ Recibe de')), o: (r) => (r[1] === f.i ? 1 : 0), csv: (r) => (r[1] === f.i ? 'Envía' : 'Recibe') },
        { t: 'Contraparte', v: (r) => { const o2 = r[1] === f.i ? r[2] : r[1]; const nm = Libro.nombre(o2); return el('span', null, el('a', { class: 'addr', onclick: () => Ficha.abrir(Libro.dir[o2]) }, UI.corto(Libro.dir[o2], 8, 6)), nm ? el('span', { class: 'muted' }, ' · ' + UI.corto(nm, 22, 0)) : null); }, o: (r) => Libro.dir[r[1] === f.i ? r[2] : r[1]], csv: (r) => Libro.dir[r[1] === f.i ? r[2] : r[1]] },
        { t: 'Tipo', v: (r) => TIPO[Libro.meta.tipos[r[7]]] || Libro.meta.tipos[r[7]], o: (r) => r[7] },
        { t: 'Activo', v: (r) => Libro.meta.activos[r[3]], o: (r) => r[3] },
        { t: 'Cantidad', num: 1, v: (r) => n(r[4], r[4] < 100 ? 2 : 0), o: (r) => r[4] },
        { t: 'USD', num: 1, v: (r) => (r[5] == null ? '—' : m(r[5])), o: (r) => r[5] || 0 },
        { t: 'Estado', v: (r) => badge(Libro.meta.estados[r[8]]), o: (r) => r[8], csv: (r) => Libro.meta.estados[r[8]] },
        { t: 'Transacción', v: (r) => UI.enlace(UI.urlTx(r[0], evm), UI.corto(r[0], 6, 4) + ' ↗', 'addr'), o: (r) => r[0] },
      ],
      rows: f.ids.map((k) => Libro.movs[k]),
    });
    const defs = [
      ['rem', 'Quién le envía (' + n(f.remitentes.length) + ')', () => el('div', null, el('p', { class: 'narr' }, 'Direcciones que le enviaron dinero, ordenadas por importe. Pulsa una fila para abrir su ficha y seguir el rastro hacia atrás.'), UI.tabla({ pp: 10, csv: 'remitentes-' + UI.corto(dir, 6, 4), cols: colCP, rows: f.remitentes, onRow: (r) => Ficha.abrir(Libro.dir[r.i]), ph: 'Buscar dirección…' }))],
      ['rec', 'A quién envía (' + n(f.receptores.length) + ')', () => el('div', null, el('p', { class: 'narr' }, 'Direcciones a las que envió dinero, ordenadas por importe. Pulsa una fila para seguir el rastro hacia adelante.'), UI.tabla({ pp: 10, csv: 'receptores-' + UI.corto(dir, 6, 4), cols: colCP, rows: f.receptores, onRow: (r) => Ficha.abrir(Libro.dir[r.i]), ph: 'Buscar dirección…' }))],
      ['mov', 'Movimientos (' + n(f.ids.length) + ')', () => el('div', null, el('p', { class: 'narr' }, 'Todos los movimientos de esta dirección en el libro mayor. Puedes filtrar por tipo, activo y sentido, ordenar por cualquier columna y descargar el resultado.'), tablaMov)],
      ['tec', 'Datos técnicos', () => tecnicos(dir, c, f, evm)],
    ];
    const bs = {};
    defs.forEach(([k, t]) => { bs[k] = el('button', { onclick: () => pestaña(k) }, t); tabs.append(bs[k]); });
    function pestaña(k) { Object.entries(bs).forEach(([kk, b]) => b.classList.toggle('on', kk === k)); cuerpoTabs.textContent = ''; cuerpoTabs.append(defs.find((d) => d[0] === k)[2]()); }
    function filtroHora(h) {
      const sel = f.ids.map((k) => Libro.movs[k]).filter((r) => Math.floor(r[6] / 3600) * 3600 === h);
      tablaMov.cambiar(sel); tablaMov.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    pestaña(f.remitentes.length ? 'rem' : 'mov');
    return raiz;
  }

  // lo que las tablas del informe saben de una dirección (aunque no tenga movimientos propios en el libro)
  function hechos(dir) {
    const out = []; const D = window.Dash && Dash.d, det = (window.Dash && Dash.det) || {}; if (!D) return out;
    const eq = (x) => x && String(x).toLowerCase() === dir.toLowerCase();
    const tx = (h, evm) => (h ? [' ', UI.enlace(UI.urlTx(h, evm), UI.corto(h, 6, 4) + ' ↗', 'addr')] : null);
    (det.congeladas || []).filter((c) => eq(c.direccion)).forEach((c) => out.push({ t: 'Bloqueada por Tether en TRON', e: 'VERIFICADO', n: ['Bloqueo del ' + UI.fecha(c.t) + ' UTC. Hoy ' + (c.bloqueadaHoy ? 'sigue bloqueada' : 'ya no figura bloqueada') + ' y conserva ' + n(c.usdt) + ' USDT. Evento:', tx(c.tx)] }));
    (det.ethTokens || []).filter((t) => eq(t.direccion)).forEach((t) => out.push({ t: 'Saldo comprobado hoy · ' + t.simbolo + ' (' + t.cadena + ')', e: 'VERIFICADO', n: [n(t.saldoHoy) + ' ' + t.simbolo + ' · ' + (t.bloqueadaHoy ? '❄ bloqueada en el contrato del emisor' : 'no bloqueada') + (t.funcion ? ' (comprobado con ' + t.funcion + ')' : '')] }));
    (det.ethQuieto || []).filter((q) => eq(q.direccion)).forEach((q) => out.push({ t: 'ETH quieto · ' + q.nombre, e: 'VERIFICADO', n: [n(q.hoy, 2) + ' ETH hoy; recibió ' + n(q.entra, 2) + ' y envió ' + n(q.sale, 2) + '. Última actividad: ' + UI.fecha(q.ultima) + ' UTC.'] }));
    (det.perdida || []).filter((p) => eq(p.direccion)).forEach((p) => out.push({ t: 'Aquí se corta el rastro (' + p.grupo + (p.tramo ? ', ' + p.tramo.replace('tramo', 'tramo ') : '') + ')', e: p.grupo === 'DESCONOCIDO' ? 'DESCONOCIDO' : 'ESTIMADO', n: [p.clase + '. ' + m(p.atribuido) + ' atribuidos en ' + n(p.envios) + ' envíos. ' + (p.causa || '')] }));
    (det.destinos || []).filter((x) => eq(x.direccion)).forEach((x) => out.push({ t: 'Destino del reparto · ' + (C.claseNombre[x.clase] || x.clase), e: 'ESTIMADO', n: [m(x.atribuido) + ' atribuidos al robo en ' + n(x.n) + ' llegadas (' + x.simbolos + ') entre ' + UI.fecha(x.primera) + ' y ' + UI.fecha(x.ultima) + ' UTC.'] }));
    (det.retenido || []).filter((r) => eq(r.direccion)).forEach((r) => out.push({ t: 'Dinero retenido en esta billetera', e: 'ESTIMADO', n: [n(r.trx) + ' TRX y ' + n(r.usdt) + ' USDT en los flujos; atribuido al robo: ' + m(r.atribuido) + ' (pureza ' + n(r.pureza * 100, 1) + ' %).'] }));
    (det.casasVerificadas || []).filter((v) => eq(v.deposito) || eq(v.destino)).forEach((v) => out.push({ t: 'Depósito detectado en ' + v.casa, e: 'VERIFICADO', n: [eq(v.deposito) ? 'Dirección de depósito: ' : 'Destino final de los depósitos: ', n(v.llegadas) + ' llegadas, ' + m(v.enviado) + ' enviados. No identifica a ninguna persona.'] }));
    (det.symbiosisReceptores || []).filter((r) => eq(r.receptor)).forEach((r) => out.push({ t: 'Receptor final de Symbiosis (' + r.cadena + ')', e: 'VERIFICADO', n: [n(r.n) + ' envíos, ' + m(r.usd) + ' (' + r.activo + '). Llegadas comprobadas en Etherscan: ' + n(r.verificadas) + '.'] }));
    (det.chainflipDestinos || []).filter((r) => eq(r.direccion)).forEach((r) => out.push({ t: 'Destino de cambios de Chainflip (' + r.cadena + ')', e: 'VERIFICADO', n: [n(r.n) + ' cambios, ' + m(r.usd) + ' (' + r.activo + ').'] }));
    ((det.across && det.across.receptores) || []).filter((r) => eq(r.receptor)).forEach((r) => out.push({ t: 'Contrato «Executor» de Across', e: 'DESCONOCIDO', n: ['Recibe ' + n(r.n) + ' envíos (' + m(r.usdt) + '). Ejecuta el siguiente paso con instrucciones cifradas: el rastro termina aquí.'] }));
    (det.arkham || []).filter((r) => eq(r.de) || eq(r.a)).forEach((r) => out.push({ t: 'Aparece en una transacción de Arkham (' + r.red + ')', e: null, n: [UI.fecha(Date.parse(r.t)) + ' UTC · ' + m(r.usd) + ' (' + r.token + ') · ' + (r.aEtiqueta || '') + '.', tx(r.tx, r.red !== 'tron')] }));
    ((D.swaps && D.swaps.porContrato) || []).filter((x) => eq(x.contrato)).forEach((x) => out.push({ t: 'Contrato de cambio · ' + x.nombre, e: 'ESTIMADO', n: [n(x.n) + ' operaciones: entrada ' + m(x.entradaUsd) + ', salida ' + m(x.salidaUsd) + '.'] }));
    (det.capitalItems || []).filter((i) => i.nombre && i.nombre.includes(dir.slice(0, 7)) && !/…$/.test(dir)).forEach((i) => out.push({ t: 'Origen del robo', e: i.estado, n: [i.nombre + ': ' + n(i.cantidad) + ' ' + i.unidad + ' (' + m(i.usd) + ').'].concat((i.tx || []).slice(0, 2).map((h) => tx(h))) }));
    if (D.pureza) ((det.purezaTop || [])).forEach((t) => (t.top || []).filter((x) => eq(x.direccion)).forEach((x) => out.push({ t: 'Billetera donde cambia la pureza · ' + t.nombre, e: 'ESTIMADO', n: ['Pureza actual ' + n(x.puraActual * 100, 1) + ' % frente a ' + n(x.puraCiclo * 100, 1) + ' % con la vía ciclo; envió ' + m(x.salidas) + '; efecto ' + m(x.efecto) + '.'] })));
    return out;
  }

  // tabla genérica de movimientos del libro (filas de Libro.movs): Fecha, De, A, Tipo, Activo, Cantidad, USD, Estado, Tx
  Ficha.tablaMovs = function (rows, o = {}) {
    const lnk = (i) => { const nm = Libro.nombre(i); return el('span', null, el('a', { class: 'addr', onclick: () => Ficha.abrir(Libro.dir[i]) }, UI.corto(Libro.dir[i], 8, 6)), nm ? el('span', { class: 'muted' }, ' · ' + UI.corto(nm, 20, 0)) : null); };
    return UI.tabla({
      pp: o.pp || 12, csv: o.csv || 'movimientos', ph: 'Buscar por dirección, hash, activo…', orden: o.orden || [0, -1],
      filtros: [{ t: 'Tipo', opciones: Object.values(TIPO), fn: (r, op) => TIPO[Libro.meta.tipos[r[7]]] === op }, { t: 'Activo', opciones: Libro.meta.activos, fn: (r, op) => Libro.meta.activos[r[3]] === op }],
      cols: [
        { t: 'Fecha (UTC)', v: (r) => UI.fechaS(r[6]), o: (r) => r[6] },
        { t: 'De', v: (r) => lnk(r[1]), o: (r) => Libro.dir[r[1]], csv: (r) => Libro.dir[r[1]] },
        { t: 'A', v: (r) => lnk(r[2]), o: (r) => Libro.dir[r[2]], csv: (r) => Libro.dir[r[2]] },
        { t: 'Tipo', v: (r) => TIPO[Libro.meta.tipos[r[7]]] || Libro.meta.tipos[r[7]], o: (r) => r[7] },
        { t: 'Activo', v: (r) => Libro.meta.activos[r[3]], o: (r) => r[3] },
        { t: 'Cantidad', num: 1, v: (r) => n(r[4], r[4] < 100 ? 2 : 0), o: (r) => r[4] },
        { t: 'USD', num: 1, v: (r) => (r[5] == null ? '—' : m(r[5])), o: (r) => r[5] || 0 },
        { t: 'Estado', v: (r) => badge(Libro.meta.estados[r[8]]), o: (r) => r[8], csv: (r) => Libro.meta.estados[r[8]] },
        { t: 'Transacción', v: (r) => UI.enlace(UI.urlTx(r[0], UI.evm(Libro.dir[r[1]])), UI.corto(r[0], 6, 4) + ' ↗', 'addr'), o: (r) => r[0] },
      ],
      rows,
    });
  };
  // abre un panel con los movimientos que cumplen un filtro (carga el libro si hace falta)
  Ficha.verMovs = function (titulo, sub, filtro, nota) {
    UI.abrir(titulo, () => {
      const cont = el('div', null, UI.cargando('Cargando el libro mayor (unos 2 MB la primera vez)…'));
      Libro.cargar().then(() => { cont.textContent = ''; const rows = Libro.movs.filter(filtro); cont.append(el('p', { class: 'narr' }, nota || ''), el('p', { class: 'narr' }, el('b', null, n(rows.length) + ' movimientos'), ' · ', el('b', null, m(rows.reduce((a, r) => a + (r[5] || 0), 0))), ' en total'), Ficha.tablaMovs(rows, { csv: 'movimientos' })); });
      return cont;
    }, { sub, ancho: true });
  };

  function tecnicos(dir, c, f, evm) {
    const fila = (k, v) => el('tr', null, el('td', { style: 'color:var(--mut);white-space:nowrap' }, k), el('td', null, v));
    const t = el('table', { class: 't', style: 'width:100%;border-collapse:collapse;font-size:13px' });
    const filas = [['Dirección', el('span', { class: 'addr' }, dir)], ['Cadena', evm ? 'Ethereum (y redes compatibles)' : 'TRON']];
    if (c) {
      filas.push(['Clase del rastreo', (C.claseNombre[c.clase] || c.clase) + ' — es una clasificación del rastreo, no una identificación de titular'], ['Etiqueta pública', c.nombre || 'ninguna'], ['Billetera leída por el rastreo', c.leida ? 'Sí' : 'No'], ['Salto desde el reparto', c.nivel >= 0 ? String(c.nivel) : '—'], ['Operaciones totales en cadena', c.ops ? n(c.ops) : '—'],
        ['Primera / última actividad observada', c.prim ? UI.fecha(c.prim) + ' → ' + UI.fecha(c.ult) : '—'], ['Entradas relacionadas con el incidente', c.entra ? m(c.entra) + ' en ' + n(c.nEn) + ' movimientos' : '—'], ['Salidas relacionadas con el incidente', c.sale ? m(c.sale) + ' en ' + n(c.nSa) + ' movimientos' : '—'],
        ['Retenido por flujos (neto)', c.neto ? n(c.neto) + ' unidades' : '—'], ['Estado de congelación', c.congelada === 1 ? 'En la lista negra de Tether' : c.congelada === 0 ? 'No consta en los eventos de bloqueo leídos' : 'sin comprobar']);
    }
    filas.forEach(([k, v]) => t.append(fila(k, v)));
    t.querySelectorAll('td').forEach((td) => (td.style.cssText += 'padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top'));
    return el('div', null, el('p', { class: 'narr' }, 'Campos tal como los guarda el libro mayor. «Entradas/salidas relacionadas con el incidente» cuenta solo lo que el rastreo atribuye al recorrido del robo; las cifras de la cabecera cuentan todos los movimientos de la dirección en el libro.'), t);
  }
})();
