/* Método y decisiones, limitaciones, control de calidad, fuentes, glosario, historial y descargas. */
(function () {
  const { el, n, m } = C;

  Dash.add(200, function ({ d, base, meta }) {
    const s = Dash.sec('metodo', 'Método y decisiones', 'Método', ['Cómo se ha hecho este informe y <b>por qué se tomó cada decisión</b>. Un informe de trazabilidad no «descubre» dinero: aplica reglas explícitas a datos públicos. Aquí están las reglas, el motivo de cada una y lo que no se puede afirmar. Cualquier persona puede repetirlas con los datos y el código que se publican junto a este panel.']);
    s.append(el('div', { class: 'card' }, el('h3', null, 'Decisiones de método'), el('div', { class: 'cs' }, 'Pulsa una para ver su motivo.'),
      el('div', null, TXT.decisiones.map(([t, que, por], i) => el('details', { style: 'border-top:1px solid var(--line);padding:8px 0' + (i === 0 ? ';border-top:0' : '') }, el('summary', { style: 'cursor:pointer;font-weight:600' }, (i + 1) + '. ' + t), el('p', { class: 'narr' }, el('b', null, 'Qué se hace: '), que), el('p', { class: 'narr' }, el('b', null, 'Por qué: '), por))))));
    s.append(el('div', { class: 'grid g2', style: 'margin-top:14px' },
      el('div', { class: 'card' }, el('h3', null, 'Qué NO se puede afirmar'), el('ul', { class: 'narr', style: 'margin:6px 0 0 18px;padding:0' }, TXT.limites.map((t) => el('li', null, t)))),
      el('div', { class: 'card' }, el('h3', null, 'Los cinco niveles de evidencia'), el('div', { class: 'narr' }, Object.entries(d.estados || {}).map(([k, v]) => el('p', { style: 'margin:8px 0' }, C.est(k), ' ', v))), el('p', { class: 'hint' }, 'Cada cifra del informe lleva su nivel. Los niveles se leen del dato, no se escriben a mano.'))));
  });

  Dash.add(210, function ({ d }) {
    if (!d.calidad || !d.calidad.length) return;
    const s = Dash.sec('calidad', 'Control de calidad y trabajo pendiente', 'Calidad', ['El informe pasa <b>' + d.calidad.length + ' comprobaciones automáticas</b> cada vez que se genera, para que ninguna cifra se publique sin respaldo. <b>Verde</b>: superada. <b>Amarillo</b>: aviso, con lo que falta. Debajo, los puntos que siguen abiertos: <b>no se esconde nada</b>.']);
    s.append(el('div', { class: 'checks' }, d.calidad.map((c) => el('div', { class: 'check ' + c.estado, style: 'cursor:pointer', title: 'Pulsa para leer el detalle', onclick: () => UI.abrir(c.id + '. ' + c.titulo, () => el('div', null, el('p', { class: 'narr' }, el('b', null, 'Resultado: '), c.estado === 'OK' ? 'Superada' : c.estado), el('p', { class: 'narr' }, c.detalle)), { sub: 'Comprobación de calidad' }) }, el('span', { class: 'ic' }, c.estado === 'OK' ? '✓' : '!'), el('div', null, el('b', null, c.id + '. ' + c.titulo), el('div', { class: 'muted', style: 'font-size:12px' }, Dash.corto(c.detalle || '', 120)))))));
    if (d.pendientes && d.pendientes.length) s.append(el('div', { class: 'card', style: 'margin-top:14px' }, el('h3', null, 'Puntos abiertos'), el('div', { class: 'cs' }, 'Lo que falta por saber o por leer, y por qué.'), el('table', { class: 't' }, el('tbody', null, d.pendientes.map((p) => el('tr', null, el('td', null, C.est(p.est)), el('td', null, el('b', null, p.t), el('div', { class: 'muted', style: 'font-size:12.5px' }, p.causa))))))));
  });

  Dash.add(220, function ({ d, base }) {
    const s = Dash.sec('fuentes', 'Fuentes, evidencia y descargas', 'Fuentes', ['De dónde sale cada dato y cómo repetirlo. Todos los datos de este panel se publican en ficheros abiertos; cada dirección y cada transacción enlazan con el explorador público de su cadena.']);
    const hijos = [];
    if (d.fuentes && d.fuentes.length) hijos.push(el('div', { class: 'card' }, el('h3', null, 'Fuentes de datos'), UI.tabla({ pp: 12, buscar: false, rows: d.fuentes, cols: [{ t: 'Id', v: (r) => r.id, o: (r) => r.id }, { t: 'Fuente', v: (r) => r.t, o: (r) => r.t }, { t: 'Corte', v: (r) => (r.corte || '').replace('T', ' ').slice(0, 16), o: (r) => r.corte }] })));
    hijos.push(el('div', { class: 'card' }, el('h3', null, 'Descargas'), el('div', { class: 'chips2', style: 'flex-direction:column;align-items:flex-start' },
      el('a', { class: 'btn primary', href: base + 'informe-completo.html' }, 'Informe original completo (HTML, 11 MB)'),
      el('a', { class: 'btn', href: base + 'perdida-de-rastro.csv' }, 'Rastro perdido (CSV)'),
      el('a', { class: 'btn', href: base + 'data.json' }, 'Datos del panel (JSON)'),
      el('a', { class: 'btn', href: base + 'detalle.json' }, 'Tablas de detalle (JSON)'),
      el('a', { class: 'btn', href: base + 'libro/movs.json' }, 'Libro mayor: movimientos (JSON)'),
      el('a', { class: 'btn', href: base + 'libro/cuentas.json' }, 'Libro mayor: direcciones (JSON)')), el('p', { class: 'hint' }, 'Los movimientos del libro tienen la forma [hash, de, a, activo, cantidad, usd, hora, tipo, estado, nota]; los índices de «de» y «a» apuntan a la lista de direcciones.')));
    s.append(el('div', { class: 'grid g2' }, hijos));
    s.append(el('div', { class: 'card', style: 'margin-top:14px' }, el('h3', null, 'Glosario'), el('div', { class: 'cs' }, 'Los términos del panel, sin jerga.'), el('dl', { class: 'gloss' }, TXT.glosario.slice(0, 6).map(([t, x]) => [el('dt', null, t), el('dd', null, x)])), el('button', { class: 'tbtn', style: 'margin-top:8px', onclick: () => Dash.glosario() }, 'Ver el glosario completo →')));
  });

  Dash.add(230, function ({ d }) {
    if (!d.novedades || !d.novedades.length) return;
    const s = Dash.sec('novedades', 'Historial de versiones', 'Versiones');
    s.append(el('div', { class: 'tl' }, d.novedades.slice().reverse().map((v) => el('div', { class: 'it' }, el('b', null, v.version), ' ', el('span', { class: 'muted' }, v.fecha), el('ul', null, (v.cambios || []).slice(0, 5).map((c) => el('li', null, Dash.corto(c, 260))))))));
  });
})();
