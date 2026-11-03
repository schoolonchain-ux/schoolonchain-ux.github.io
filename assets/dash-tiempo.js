/* Líneas temporales con selector de periodo y detalle por hora. */
(function () {
  const { el, n, m } = C;
  const TIPO_GRUPO = (t) => (t === 'transferencia' ? 'Transferencias' : /contrato/.test(t) ? 'Contratos (depósito / retirada)' : /swap/.test(t) ? 'Cambios (swaps)' : /puente/.test(t) ? 'Puentes' : 'Otros');
  const dd = (h) => String(h).slice(0, 10);
  const etiquetaDia = (d) => { const x = new Date(d + 'T00:00:00Z'); return x.getUTCDate() + ' ' + ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][x.getUTCMonth()]; };

  function selector(dias, alCambiar) {
    const seg = el('div', { class: 'seg' }); let actual = '';
    const op = [['', 'Todo el periodo']].concat(dias.map((d) => [d, etiquetaDia(d)]));
    op.forEach(([v, t], i) => seg.append(el('button', { class: i === 0 ? 'on' : '', onclick: (e) => { actual = v; [...seg.children].forEach((b) => b.classList.remove('on')); e.target.classList.add('on'); alCambiar(v); } }, t)));
    return el('div', { class: 'toolbar' }, el('span', { class: 'muted', style: 'font-size:12.5px' }, 'Periodo (UTC):'), seg);
  }

  Dash.add(50, function ({ d, det, meta }) {
    const s = Dash.sec('tiempo', 'Línea temporal', 'Línea temporal', ['Cuándo se movió el dinero. Todas las horas están en UTC. <b>Elige un periodo</b> para acercarte a un día y <b>pulsa una barra</b> para ver los movimientos concretos de esa hora, con su hash y su destino.']);
    const cont = el('div', { class: 'grid g2' }); s.append(cont);

    /* a) reparto por hora */
    if (d.serieHora && d.serieHora.length) {
      const sh = d.serieHora; let ch;
      const k = UI.tarjeta({ titulo: 'Reparto por hora desde la billetera de reparto', sub: 'Barras: importe repartido (USD) · línea: número de envíos', alto: 270, ayuda: TXT.ay.horaReparto, datos: { titulo: 'Reparto por hora', csv: 'reparto-por-hora', rows: sh, cols: [{ t: 'Hora (UTC)', v: (r) => r.t.replace('T', ' ') + ':00', o: (r) => r.t }, { t: 'Envíos', num: 1, v: (r) => n(r.n), o: (r) => r.n }, { t: 'Importe', num: 1, v: (r) => m(r.v), o: (r) => r.v }] } });
      const pintar = (dia) => {
        const f = sh.filter((x) => !dia || dd(x.t) === dia); if (ch) ch.destroy();
        ch = Dash.mk(k.cv, UI.clicable({ data: { labels: f.map((x) => x.t.slice(5, 10).replace('-', '/') + ' ' + x.t.slice(11) + ':00'), datasets: [{ type: 'bar', label: 'Importe', data: f.map((x) => x.v), backgroundColor: C.pal[0], borderRadius: 3, yAxisID: 'y', order: 2 }, { type: 'line', label: 'Envíos', data: f.map((x) => x.n), borderColor: C.pal[2], backgroundColor: C.pal[2], pointRadius: 2, borderWidth: 2, tension: 0.25, yAxisID: 'y1', order: 1 }] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { x: { ...Dash.ejes.cat(), ticks: { maxTicksLimit: 9, maxRotation: 0 } }, y: { ...Dash.ejes.dinero(), position: 'left' }, y1: { position: 'right', grid: { display: false }, ticks: { precision: 0 } } }, plugins: { tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + (c.dataset.yAxisID === 'y' ? m(c.parsed.y) : n(c.parsed.y)) } } } } }, (e) => {
          const t = f[e.index].t; const h0 = Date.parse(t + ':00:00Z') / 1000; const sem = meta.semilla;
          Ficha.verMovs('Envíos de la billetera de reparto · ' + t.replace('T', ' ') + ':00 UTC', sem || '', (r) => (!sem || Libro.dir[r[1]] === sem) && Math.floor(r[6] / 3600) * 3600 === h0 && Libro.meta.tipos[r[7]] === 'transferencia', 'Envíos de esa hora hechos por la billetera de reparto. Pulsa una dirección para abrir su ficha o un hash para verlo en el explorador.');
        }));
      };
      k.c.insertBefore(selector([...new Set(sh.map((x) => dd(x.t)))], pintar), k.wrap); pintar('');
      cont.append(k.c);
    }

    /* b) USDT congelado acumulado */
    if (d.congelacionTron && d.congelacionTron.serie.length) {
      const sr = d.congelacionTron.serie;
      const k = UI.tarjeta({ titulo: 'USDT congelado por Tether en TRON (acumulado)', sub: n(d.congelacionTron.bloqueadasHoy) + ' de ' + n(d.congelacionTron.direcciones) + ' direcciones siguen bloqueadas · ' + m(d.congelacionTron.usdtVigente) + ' vigentes · pulsa un punto', alto: 270, ayuda: TXT.ay.congelacion, datos: { titulo: 'Bloqueos de Tether en TRON', csv: 'bloqueos', rows: sr, cols: [{ t: 'Fecha (UTC)', v: (r) => UI.fecha(r.t), o: (r) => r.t }, { t: 'Dirección', v: (r) => el('a', { class: 'addr', onclick: () => Ficha.abrir(r.direccion) }, UI.corto(r.direccion, 9, 6)), o: (r) => r.direccion, csv: (r) => r.direccion }, { t: 'USDT', num: 1, v: (r) => n(r.usdt), o: (r) => r.usdt }, { t: 'Acumulado', num: 1, v: (r) => m(r.acumulado), o: (r) => r.acumulado }] } });
      Dash.mk(k.cv, UI.clicable({ type: 'line', data: { datasets: [{ label: 'Acumulado', data: sr.map((x) => ({ x: x.t, y: x.acumulado })), borderColor: C.pal[1], backgroundColor: C.pal[1] + '33', fill: true, stepped: true, pointRadius: 3.5, pointHoverRadius: 6, borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { type: 'linear', ticks: { maxTicksLimit: 6, maxRotation: 0, callback: (v) => C.dm(v) }, grid: { display: false } }, y: { ...Dash.ejes.dinero(), beginAtZero: true } }, plugins: { legend: { display: false }, tooltip: { callbacks: { title: (it) => C.utc(it[0].parsed.x), label: (c) => ' ' + m(c.parsed.y) + ' acumulados · +' + m(sr[c.dataIndex].usdt) + ' · ' + UI.corto(sr[c.dataIndex].direccion, 8, 5) } } } } }, (e) => Ficha.abrir(sr[e.index].direccion)));
      cont.append(k.c);
    }

    /* c) volumen por hora por tipo */
    if (d.porHora && d.porHora.horas.length) {
      const ph = d.porHora, gr = Object.keys(ph.series); let ch;
      const k = UI.tarjeta({ titulo: 'Volumen por hora en TRON, por tipo de movimiento', sub: 'Suma en USD de los movimientos del libro mayor. Pulsa una barra para ver los mayores movimientos de esa hora.', alto: 320, cls: 'span2', ayuda: TXT.ay.porHora, datos: { titulo: 'Volumen por hora y tipo', csv: 'volumen-por-hora', rows: ph.horas.map((h, i) => ({ h, i })), cols: [{ t: 'Hora (UTC)', v: (r) => r.h.replace('T', ' ').replace('Z', ''), o: (r) => r.h }, { t: 'Movimientos', num: 1, v: (r) => n(ph.n[r.i]), o: (r) => ph.n[r.i] }].concat(gr.map((g) => ({ t: g, num: 1, v: (r) => m(ph.series[g][r.i]), o: (r) => ph.series[g][r.i] }))) } });
      const pintar = (dia) => {
        const ix = ph.horas.map((h, i) => i).filter((i) => !dia || dd(ph.horas[i]) === dia); if (ch) ch.destroy();
        ch = Dash.mk(k.cv, UI.clicable({ type: 'bar', data: { labels: ix.map((i) => C.dm(new Date(ph.horas[i]).getTime())), datasets: gr.map((g, gi) => ({ label: g, data: ix.map((i) => ph.series[g][i]), backgroundColor: C.pal[gi % C.pal.length], borderWidth: 0 })) }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { x: { stacked: true, ...Dash.ejes.cat(), ticks: { maxTicksLimit: 12, maxRotation: 0 } }, y: { stacked: true, ...Dash.ejes.dinero() } }, plugins: { tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + m(c.parsed.y) } } } } }, (e) => {
          const h = ph.horas[ix[e.index]]; const h0 = Date.parse(h) / 1000; const g = gr[e.datasetIndex];
          Ficha.verMovs('Movimientos en TRON · ' + h.replace('T', ' ').replace('Z', ' UTC') + ' · ' + g, 'Libro mayor', (r) => !UI.evm(Libro.dir[r[1]]) && Math.floor(r[6] / 3600) * 3600 === h0 && TIPO_GRUPO(Libro.meta.tipos[r[7]]) === g, 'Movimientos de TRON de esa hora y de ese tipo. Ordénalos por USD para ver los mayores.');
        }));
      };
      k.c.insertBefore(selector([...new Set(ph.horas.map(dd))], pintar), k.wrap); pintar('');
      k.c.style.gridColumn = '1 / -1'; cont.append(k.c);
    }
  });
})();
