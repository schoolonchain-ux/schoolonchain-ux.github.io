/* Zona 5 · pestañas «Reparto» y «Quema y emisión» de TRX.
   Leen data/reparto-trx.json y data/quema-trx.json, que prepara cada día el publicador de EquipoIA con TronScan y TronGrid (sin IA).
   Cada pestaña dice qué día se leyó y de dónde sale; si no hay fichero, lo dice y no inventa nada. */
(function () {
  const { el, n } = C;
  const rReparto = document.getElementById('reparto-raiz'), rQuema = document.getElementById('quema-raiz');
  if (!rReparto && !rQuema) return;
  const fh = (t) => new Date(t).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const cuando = (h) => (h < 1 ? 'hace menos de 1 hora' : h < 48 ? 'hace ' + n(Math.round(h)) + ' horas' : 'hace ' + n(Math.round(h / 24)) + ' días');
  const mt = (x) => (Math.abs(x) >= 1e8 ? n(x / 1e6, 0) + ' M TRX' : Math.abs(x) >= 1e6 ? n(x / 1e6, 1) + ' M TRX' : n(x) + ' TRX');
  const kp = (l, v, s, accion, pista) => { const t = el('div', { class: 'kpi' + (accion ? ' clk' : ''), role: accion ? 'button' : null, tabindex: accion ? '0' : null }, el('div', { class: 'kl' }, l), el('div', { class: 'kv' }, v), el('div', { class: 'kn' }, s), accion ? el('div', { class: 'ko' }, (pista || 'Ver de dónde sale') + ' →') : null); if (accion) { t.addEventListener('click', accion); t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); accion(); } }); } return t; };
  const irA = (nodo) => { nodo.scrollIntoView({ behavior: 'smooth', block: 'start' }); nodo.classList.add('flash'); setTimeout(() => nodo.classList.remove('flash'), 1800); };
  const ext = (href, texto) => el('a', { class: 'lnk', href, target: '_blank', rel: 'noopener', title: 'Se abre en otra pestaña' }, texto);
  const caja = (titulo, ...k) => el('div', { class: 'card', style: 'margin:12px 0' }, titulo ? el('h3', null, titulo) : null, ...k);
  const lectura = (iso, extra) => { const h = (Date.now() - Date.parse(iso)) / 3600000; return el('div', { class: 'res-head ' + (h > 48 ? 'warn' : '') }, el('div', { class: 'sub2' }, el('b', null, 'Lectura del ' + fh(Date.parse(iso))), ' (' + cuando(h) + '). ' + extra)); };
  const aviso = (cont, titulo, msg) => cont.replaceChildren(el('div', { class: 'res-head warn' }, el('div', { class: 'big' }, titulo), el('div', { class: 'sub2' }, msg)));
  const traer = (u) => fetch(u + '?v=' + Math.floor(Date.now() / 600000), { signal: AbortSignal.timeout(15000) }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });

  /* ================= Reparto ================= */
  const NOMBRE = {
    exchange: ['Casas de cambio', 'Sobre todo dinero de sus clientes, no de la casa.'],
    contrato: ['Contratos', 'Fondos de muchísimos usuarios juntos (préstamos, TRX envuelto…); no son una persona.'],
    fondo_o_institucion: ['Fondos y gestoras', 'Con nombre en TronScan.'],
    otros_etiquetados: ['Otras con nombre en TronScan', 'Validadores, loterías, pagos, custodia…'],
    ballena_sin_identificar: ['Sin nombre en TronScan', 'TronScan no les pone nombre (no es que nadie sepa quiénes son). NO son todas ballenas: mira el desglose por tamaño y la lista de las mayores.'],
    atribuido_externo: ['Atribuidas por otras fuentes', 'Con fuente anotada.'],
  };
  function pintarReparto(D) {
    const G = D.grupos, T = D.ofertaTrx, cuerpo = el('div');
    cuerpo.append(el('details', { class: 'como' }, el('summary', null, 'En pocas palabras: ¿qué es esto y cómo funciona?'),
      el('p', { html: 'TronScan da la lista de las <b>10.000 cuentas con más TRX</b>. Aquí se agrupan según lo que TronScan dice que son (casa de cambio, contrato, fondo…) y se compara con todo el TRX que existe. Lo que queda fuera de esas 10.000 cuentas es el resto de la red.' }),
      el('p', { html: '<b>Un saldo grande no dice de quién es</b>: las casas de cambio guardan dinero de clientes y los contratos de muchos usuarios. Y que una cuenta aparezca «sin nombre en TronScan» no significa que nadie sepa quién es: más abajo ves cuáles son las mayores y qué dicen de ellas nuestros informes.' })));
    cuerpo.append(lectura(D.leidoEn, 'Es una foto del día: las cuentas se leen una a una y cambian a diario.'));
    const sin = G.ballena_sin_identificar, mayores = D.sinIdentificarPorTramo[0];
    cuerpo.append(el('div', { class: 'kpis2' },
      kp('TRX que existen', mt(T), n(D.cuentasEnLaRed) + ' cuentas en la red', () => irA(cajaOrigenR), 'Ver de dónde sale'),
      kp('Sin nombre en TronScan, las mayores', n(mayores.pct, 1) + ' %', n(mayores.cuentas) + ' cuentas con ' + mayores.tramo.replace(' o más', '') + ' o más de TRX cada una', () => seleccionar('ballena_sin_identificar'), 'Ver esas cuentas'),
      kp('Casas de cambio', n(G.exchange.pct, 1) + ' %', n(G.exchange.cuentas) + ' cuentas con nombre de casa de cambio', () => seleccionar('exchange'), 'Ver esas cuentas'),
      kp('Las 100 mayores cuentas', n(D.concentracion.top100, 1) + ' %', 'la mayor sola: ' + n(D.concentracion.top1, 1) + ' %', () => irA(cajaTop100), 'Ver las 100 cuentas')));

    const filas = Object.keys(NOMBRE).filter((k) => G[k] && (G[k].cuentas > 0 || k === 'ballena_sin_identificar')).map((k) => ({ k, nombre: NOMBRE[k][0], que: NOMBRE[k][1], ...G[k] }));
    filas.push({ k: 'cola', nombre: 'Resto de la red', que: 'Todas las demás cuentas, cada una con menos de ' + n(D.saldoDeLaCuentaNTrx) + ' TRX: particulares pequeños.', cuentas: D.cola.cuentas, trx: D.cola.trx, pct: D.cola.pct });
    const cv = el('canvas');
    cuerpo.append(caja('¿De quién es el TRX?', el('div', { class: 'cs' }, 'Cada trozo es una parte de todo el TRX que existe (' + mt(T) + '). Pulsa un trozo del gráfico, su nombre en la leyenda o una fila de la tabla para ver las cuentas de ese grupo.'),
      el('div', { class: 'cv', style: 'height:260px;max-width:520px;margin:0 auto' }, cv),
      UI.tabla({ pp: 8, buscar: false, rows: filas, orden: [2, -1], csv: 'reparto-trx', onRow: (r) => seleccionar(r.k),
        cols: [{ t: 'Grupo', v: (r) => el('span', null, el('b', null, r.nombre), el('br'), el('span', { class: 'muted', style: 'font-size:12px' }, r.que)), o: (r) => r.nombre, csv: (r) => r.nombre }, { t: 'Cuentas', v: (r) => n(r.cuentas), o: (r) => r.cuentas },
          { t: 'TRX', v: (r) => mt(r.trx), o: (r) => r.trx }, { t: '% del TRX', v: (r) => n(r.pct, 1) + ' %', o: (r) => r.pct }] })));
    const panel = el('div', { style: 'scroll-margin-top:90px' }); cuerpo.append(panel);
    C.chartDefaults();
    const grafico = new Chart(cv, UI.clicable({ type: 'doughnut', data: { labels: filas.map((r) => r.nombre), datasets: [{ data: filas.map((r) => r.trx), backgroundColor: C.pal.slice(0, filas.length), borderWidth: 0, offset: filas.map(() => 0) }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '58%', plugins: { legend: { position: 'right', labels: { boxWidth: 12 }, onClick: (ev, it) => seleccionar(filas[it.index].k) }, tooltip: { callbacks: { label: (c) => ' ' + mt(c.parsed) + ' · ' + n((c.parsed / T) * 100, 1) + ' %' } } } } }, (e) => seleccionar(filas[e.index].k)));

    cuerpo.append(caja('Dentro de «sin nombre en TronScan»: por tamaño de cuenta', el('div', { class: 'cs' }, 'No es un bloque de ballenas: unas pocas cuentas enormes y miles de cuentas medianas, donde caben particulares con cientos de miles de TRX.'),
      UI.tabla({ pp: 6, buscar: false, rows: D.sinIdentificarPorTramo.map((r) => ({ ...r })), onRow: () => seleccionar('ballena_sin_identificar'), cols: [{ t: 'Saldo de la cuenta', v: (r) => r.tramo + ' TRX', o: (r) => r.tramo }, { t: 'Cuentas', v: (r) => n(r.cuentas), o: (r) => r.cuentas }, { t: 'TRX', v: (r) => mt(r.trx), o: (r) => r.trx }, { t: '% del TRX', v: (r) => n(r.pct, 2) + ' %', o: (r) => r.pct }] })));

    // Al pulsar un grupo (trozo, leyenda o fila) se enseñan sus cuentas, enteras y con enlace, y lo que sabemos de cada una con su fuente: nuestros informes, los anuncios de SUN.io y la lectura de la cadena (data/direcciones-conocidas.json).
    // Al abrir la pestaña se ve ya el de «Sin nombre en TronScan».
    const conocidasP = fetch('data/direcciones-conocidas.json?v=' + Math.floor(Date.now() / 600000), { signal: AbortSignal.timeout(15000) }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then((j) => (j && j.direcciones ? j.direcciones : null)).catch(() => null);
    let elegido = null;
    function seleccionar(k, { bajar = true } = {}) {
      const g = filas.find((x) => x.k === k); if (!g) return;
      elegido = k;
      grafico.data.datasets[0].offset = filas.map((x) => (x.k === k ? 18 : 0)); grafico.update('none');
      const titulo = 'Cuentas de «' + g.nombre + '»';
      panel.replaceChildren(caja(titulo, el('p', { class: 'loading' }, el('span', { class: 'spin' }), 'Cargando las cuentas…')));
      if (bajar) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      conocidasP.then((conocidas) => {
        if (elegido !== k) return;                                   // se pulsó otro grupo mientras tanto
        const lista = (D.cuentasPorGrupo || {})[k];
        if (k === 'cola') { panel.replaceChildren(caja(titulo, el('p', { style: 'margin:0' }, 'Son ' + n(g.cuentas) + ' cuentas, cada una con menos de ' + n(D.saldoDeLaCuentaNTrx) + ' TRX: no se pueden enseñar una a una (TronScan solo da la lista de las 10.000 mayores). Es lo que queda de todo el TRX tras restar las 10.000 mayores cuentas.'))); return; }
        if (!lista || !lista.length) { panel.replaceChildren(caja(titulo, el('p', { class: 'muted', style: 'margin:0' }, 'La lista de cuentas de este grupo no está en esta lectura.'))); return; }
        const desc = (a) => conocidas && conocidas[a];
        const sinNombre = k === 'ballena_sin_identificar';
        const partes = [];
        if (sinNombre) {
          const grandes = lista.filter((x) => x.trx >= 100e6), conD = grandes.filter((x) => desc(x.a)), pD = conD.reduce((s2, x) => s2 + x.pct, 0), pG = grandes.reduce((s2, x) => s2 + x.pct, 0);
          partes.push('Se muestran las ' + n(lista.length) + ' mayores de las ' + n(g.cuentas) + ' que TronScan no nombra. ' + n(grandes.length) + ' tienen 100 millones de TRX o más (' + n(pG, 1) + ' % de todo el TRX).' + (conocidas ? ' De esas ' + n(grandes.length) + ', ' + n(conD.length) + ' tienen una descripción con su fuente (nuestros informes, los anuncios de SUN.io o la cadena: ' + n(pD, 1) + ' % del TRX); de las otras ' + n(grandes.length - conD.length) + ' no hay nada documentado (' + n(pG - pD, 1) + ' % del TRX).' : ' No se pudo cargar lo que dicen nuestros informes; la lista de cuentas sí es de hoy.'));
        } else partes.push('Las ' + n(lista.length) + ' cuentas de este grupo (de las 10.000 mayores), de mayor a menor.');
        const cols = [
          { t: 'Puesto', v: (r) => n(r.puesto), o: (r) => r.puesto },
          { t: 'Dirección', v: (r) => el('span', null, el('a', { class: 'addr mono', href: 'https://tronscan.org/#/address/' + r.a, target: '_blank', rel: 'noopener', title: 'Comprobar en TronScan' }, r.a), el('br'), el('a', { class: 'muted', style: 'font-size:12px', href: 'herramientas.html?dir=' + r.a + '#comprobar' }, 'Comprobar aquí →')), o: (r) => r.a, csv: (r) => r.a }];
        if (!sinNombre) cols.push({ t: 'Nombre', v: (r) => el('span', null, r.etiqueta || '—', r.recordada ? el('span', { class: 'muted', style: 'font-size:12px' }, ' (nombre que TronScan le dio antes)') : null), o: (r) => r.etiqueta || '', csv: (r) => r.etiqueta || '' });
        cols.push({ t: 'TRX', v: (r) => n(r.trx), o: (r) => r.trx, csv: (r) => r.trx }, { t: '% del TRX', v: (r) => n(r.pct, 2) + ' %', o: (r) => r.pct, csv: (r) => r.pct },
          { t: 'Qué sabemos (con su fuente)', v: (r) => { const d = desc(r.a); if (!d) return el('span', { class: 'muted' }, sinNombre ? (conocidas ? 'Nada documentado' : '—') : '—');
              return el('span', { style: 'font-size:12.5px;line-height:1.45' }, el('b', null, d.nombre + '. '), d.atribucion + (d.papel ? ' · ' + d.papel : ''), ' ', el('a', { href: d.enlace, target: d.enlace.startsWith('http') ? '_blank' : null, rel: 'noopener' }, 'Fuente: ' + d.fuente + ' →')); },
            o: (r) => (desc(r.a) ? 0 : 1), csv: (r) => { const d = desc(r.a); return d ? d.nombre + ': ' + d.atribucion + ' · ' + d.papel + ' (' + d.fuente + ')' : (sinNombre ? 'Nada documentado' : ''); } });
        panel.replaceChildren(caja(titulo, el('p', { style: 'margin:0 0 8px' }, partes.join(' ') + ' Pulsa la dirección para comprobarla en TronScan o «Comprobar aquí» para verla en esta web.'),
          UI.tabla({ pp: 10, ph: 'Buscar una dirección o un nombre…', csv: 'cuentas-' + k.replace(/_/g, '-'), rows: lista.map((x) => ({ ...x })), orden: [sinNombre ? 2 : 3, -1], cols }),
          el('p', { class: 'hint', style: 'margin:8px 0 0' }, '«Sin nombre en TronScan» es lo que dice TronScan hoy. Una atribución de terceros (un medio, un analista) es una atribución: dice quién la hace, no es un hecho comprobado en cadena. «Nada documentado» significa que no tenemos nada publicado sobre esa cuenta. Un «vínculo comprobado en la cadena» (por ejemplo, haber delegado energía a la cuenta que despliega los contratos de SUN.io) es un hecho que se puede comprobar en TronScan; no dice quién controla la cuenta.')));
      });
    }
    seleccionar('ballena_sin_identificar', { bajar: false });

    const esDir = (x) => /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(x);
    const lista = (arr) => { const out = []; arr.forEach((x, i) => { if (i) out.push(' · '); out.push(esDir(x.nombre) ? el('a', { class: 'addr mono', href: 'https://tronscan.org/#/address/' + x.nombre, target: '_blank', rel: 'noopener' }, x.nombre) : x.nombre, ' ' + mt(x.trx)); }); return out; };
    cuerpo.append(caja('Quiénes son, con nombre', el('p', { style: 'margin:6px 0' }, el('b', null, 'Casas de cambio: '), lista(D.detalle.exchange)), el('p', { style: 'margin:6px 0' }, el('b', null, 'Contratos: '), lista(D.detalle.contrato)),
      D.detalle.fondo_o_institucion.length ? el('p', { style: 'margin:6px 0' }, el('b', null, 'Fondos y gestoras: '), lista(D.detalle.fondo_o_institucion)) : null));

    // las 100 mayores cuentas de la red, de todos los grupos, con enlace
    const GN = Object.fromEntries(Object.entries(NOMBRE).map(([k, v]) => [k, v[0]]));
    const top100 = [].concat(...Object.entries(D.cuentasPorGrupo || {}).map(([g, arr]) => arr.filter((x) => x.puesto <= 100).map((x) => ({ ...x, grupo: GN[g] || g })))).sort((a, b) => a.puesto - b.puesto);
    const cajaTop100 = caja('Las 100 mayores cuentas de TRON', el('div', { class: 'cs' }, 'Las ' + n(top100.length) + ' cuentas con más TRX según TronScan hoy, con el grupo en el que las contamos. Pulsa la dirección para verla en TronScan.'),
      UI.tabla({ pp: 10, ph: 'Buscar cuenta, nombre o grupo…', csv: 'trx-100-mayores-cuentas', rows: top100, orden: [0, 1],
        cols: [{ t: 'Puesto', v: (r) => n(r.puesto), o: (r) => r.puesto }, { t: 'Cuenta', v: (r) => el('span', null, el('a', { class: 'addr mono', href: 'https://tronscan.org/#/address/' + r.a, target: '_blank', rel: 'noopener' }, r.a), r.etiqueta ? el('span', { class: 'muted' }, ' · ' + r.etiqueta) : null), o: (r) => r.a, csv: (r) => r.a + (r.etiqueta ? ' ' + r.etiqueta : '') }, { t: 'Grupo', v: (r) => r.grupo, o: (r) => r.grupo }, { t: 'TRX', v: (r) => n(r.trx), o: (r) => r.trx, csv: (r) => r.trx }, { t: '% del TRX', v: (r) => n(r.pct, 2) + ' %', o: (r) => r.pct }] }));
    cuerpo.append(cajaTop100);
    const cajaOrigenR = caja('De dónde sale cada cifra', el('p', { style: 'margin:6px 0' }, 'La lista de las 10.000 cuentas con más TRX, con su saldo y el nombre que les pone TronScan: ', ext('https://apilist.tronscanapi.com/api/account/list?sort=-balance&limit=50&start=0', 'lista pública de TronScan'), ' (200 páginas de 50 cuentas; esta es la primera). Es la fuente de todos los recuentos y porcentajes de esta pestaña.'),
      el('p', { style: 'margin:6px 0' }, 'Todo el TRX que existe (' + mt(D.ofertaTrx) + '): se deduce de esa misma lista (saldo total de la primera cuenta dividido por la proporción que TronScan indica), no es un dato directo.'),
      el('p', { style: 'margin:6px 0' }, 'Si una cuenta es un contrato o una cuenta normal: ', ext('https://developers.tron.network/reference/get-account-info-by-address', 'consulta de cuenta de TronGrid'), ', solo para las mayores sin nombre (la ayuda de abajo dice cuántas).'),
      el('p', { class: 'hint', style: 'margin:8px 0 0' }, 'Lectura del ' + fh(Date.parse(D.leidoEn)) + '. Lo que dicen los informes de cada cuenta sale de un fichero fijo con la fuente de cada descripción (ver «Datos y método»).'));
    cuerpo.append(cajaOrigenR);
    const R = D.etiquetasRecordadas, items = [];
    if (R && R.cuentas) { const vs = R.ejemplos.map((e) => e.visto).sort(); items.push({ k: 'Cuentas con el nombre recordado', v: n(R.cuentas) + ' cuentas (' + mt(R.trx) + ', el ' + n(R.pct, 1) + ' %) llevan hoy el nombre que TronScan les puso en una foto anterior (vistas con ese nombre entre el ' + vs[0] + ' y el ' + vs[vs.length - 1] + '). TronScan ya no las etiqueta; si no se contaran así, aparecerían como «sin identificar» y las casas de cambio saldrían con mucho menos de lo que TronScan les atribuía hasta entonces.' }); }
    items.push({ k: 'Qué NO dice', v: 'No separa «instituciones», «Justin Sun» y «particulares» dentro de las cuentas grandes: con TronScan y TronGrid no se puede. Sin una fuente anotada no se asigna nada a nadie.' });
    items.push({ k: 'Cobertura', v: 'Se leen las 10.000 mayores cuentas (' + n(D.cuentasAnalizadas) + ' leídas, ' + n(D.cobertura.paginasFallidas) + ' páginas fallidas). El tipo de cuenta (contrato o normal) está comprobado en ' + n(D.cobertura.tipoComprobado) + ' de las ' + n(sin.cuentas) + ' sin nombre (las mayores); en el resto no se ha comprobado y cuentan como «sin nombre». La oferta es la que se deduce de TronScan (saldo total ÷ su proporción), no un dato directo.' });
    items.push({ k: 'De dónde sale', v: D.fuentes.join(' · ') + '. Estudio original: «Cómo está repartido el TRX» (EquipoIA, 21-oct-2026).' });
    cuerpo.append(el('div', { class: 'ayuda' }, items.map((i) => el('div', { class: 'ai' }, el('b', null, i.k + '. '), el('span', { html: i.v })))));
    rReparto.replaceChildren(cuerpo);
  }

  /* ================= Quema y emisión ================= */
  function pintarQuema(D) {
    const A = D.actual, cuerpo = el('div'), crece = A.neto30d > 0;
    cuerpo.append(el('details', { class: 'como' }, el('summary', null, 'En pocas palabras: ¿qué es esto y cómo funciona?'),
      el('p', { html: 'Cada día la red <b>crea TRX nuevos</b> (el pago a los validadores y a los que votan: la <b>emisión</b>) y <b>destruye</b> otros: los que la gente paga en comisiones desaparecen para siempre (la <b>quema</b>). La diferencia es el <b>neto</b>: si es positivo, hay más TRX que ayer; si es negativo, hay menos.' })));
    cuerpo.append(lectura(D.leidoEn, 'Serie diaria desde el ' + D.desde + ' hasta el ' + D.hasta + '.'));
    cuerpo.append(el('div', { class: 'res-head' }, el('div', { class: 'big' }, crece ? 'Ahora se crea más TRX del que se quema: la oferta crece' : 'Ahora se quema más TRX del que se crea: la oferta baja'),
      el('div', { class: 'sub2' }, 'En los últimos 30 días: ' + mt(A.emision30d) + ' creados y ' + mt(A.quema30d) + ' quemados, neto ' + (A.neto30d >= 0 ? '+' : '−') + mt(Math.abs(A.neto30d)) + '.' + (crece && D.regimen.primerDiaInflacionario30d ? ' El neto a 30 días es positivo desde el ' + D.regimen.primerDiaInflacionario30d + ' (' + n(D.regimen.diasInflacionarios) + ' de ' + n(D.regimen.diasDesdeEntonces) + ' días desde entonces).' : ''))));
    cuerpo.append(el('div', { class: 'kpis2' },
      kp('TRX que existen', mt(A.ofertaTrx), 'al cierre del ' + A.dia, () => irA(cajaTrim), 'Ver la serie y su fuente'),
      kp('Emisión de ese día', mt(A.emisionDia), 'pago a validadores y a votantes', () => irA(cajaTrim), 'Ver la serie y su fuente'),
      kp('Quema de ese día', mt(A.quemaDia), 'comisiones destruidas', () => irA(cajaTrim), 'Ver la serie y su fuente'),
      kp('Neto de ese día', (A.netoDia >= 0 ? '+' : '−') + mt(Math.abs(A.netoDia)), A.netoDia >= 0 ? 'la oferta creció' : 'la oferta bajó', () => irA(cajaTrim), 'Ver la serie y su fuente')));

    const T = D.trimestres, etq = (t) => t.q + (t.dias < 80 ? '*' : ''), cv = el('canvas');
    // la tabla por trimestre es el origen del gráfico: una barra pulsada la muestra; la fuente es la serie diaria pública de TronScan
    const estadoTrim = el('p', { class: 'cs', style: 'margin:0 0 8px' });
    const filasTrim = T.map((t) => ({ ...t }));
    const tablaTrim = UI.tabla({ pp: 8, buscar: false, csv: 'quema-emision-trx-por-trimestre', rows: filasTrim, orden: [0, -1],
      cols: [{ t: 'Trimestre', v: (r) => etq(r), o: (r) => r.q }, { t: 'Días', v: (r) => n(r.dias), o: (r) => r.dias }, { t: 'Emisión', v: (r) => mt(r.emision), o: (r) => r.emision, csv: (r) => r.emision }, { t: 'Quema', v: (r) => mt(r.quema), o: (r) => r.quema, csv: (r) => r.quema }, { t: 'Neto', v: (r) => (r.neto >= 0 ? '+' : '−') + mt(Math.abs(r.neto)), o: (r) => r.neto, csv: (r) => r.neto }, { t: 'Quema en dólares', v: (r) => (r.quemaUsd >= 1e6 ? n(r.quemaUsd / 1e6, 1) + ' M $' : n(r.quemaUsd) + ' $'), o: (r) => r.quemaUsd, csv: (r) => r.quemaUsd }] });
    const mostrarTrim = (q) => { tablaTrim.cambiar(q ? filasTrim.filter((r) => r.q === q) : filasTrim); estadoTrim.replaceChildren(q ? el('span', null, 'Mostrando el trimestre ' + q + '. ', el('a', { href: '#', onclick: (e) => { e.preventDefault(); mostrarTrim(null); } }, 'Ver todos')) : ''); irA(cajaTrim); };
    const cajaTrim = caja('Por trimestre: la serie de la que sale el gráfico', el('p', { style: 'margin:0 0 8px' }, 'Fuente: ', ext('https://apilist.tronscanapi.com/api/turnover?type=0&from=issuance', 'serie diaria pública de TronScan'), ' (emisión, quema y oferta de cada día; la lectura de hoy va del ' + D.desde + ' al ' + D.hasta + '). Cada trimestre suma sus días; los dólares, con el precio de cada día. * trimestre incompleto.'), estadoTrim, tablaTrim);
    cuerpo.append(caja('Emisión y quema por trimestre (millones de TRX)', el('div', { class: 'cs' }, 'Barras: TRX creados (verde) y quemados (rojo). Línea: el neto. Por debajo de cero la oferta baja. Pulsa una barra para ver ese trimestre en la tabla. * trimestre incompleto (menos de 80 días de datos).'),
      el('div', { class: 'cv', style: 'height:300px' }, cv)));
    C.chartDefaults();
    new Chart(cv, UI.clicable({ data: { labels: T.map(etq), datasets: [
      { type: 'bar', label: 'Emisión', data: T.map((t) => t.emision / 1e6), backgroundColor: C.pal[1], borderRadius: 3 },
      { type: 'bar', label: 'Quema', data: T.map((t) => t.quema / 1e6), backgroundColor: C.pal[3], borderRadius: 3 },
      { type: 'line', label: 'Neto', data: T.map((t) => t.neto / 1e6), borderColor: C.pal[0], backgroundColor: C.pal[0], pointRadius: 2, tension: 0.2 }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: { maxRotation: 60, autoSkip: true } }, y: { ticks: { callback: (v) => n(v) + ' M' }, grid: { color: C.css('--line') } } },
      plugins: { tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + n(c.parsed.y, 1) + ' M TRX' } } } } }, (e) => mostrarTrim(T[e.index].q)));
    cuerpo.append(cajaTrim);

    cuerpo.append(caja('Por año', el('div', { class: 'cs' }, 'El primer año de la serie y el actual están incompletos: la columna «Días» dice cuántos hay.'),
      UI.tabla({ pp: 8, buscar: false, rows: D.anios.map((r) => ({ ...r })), orden: [0, -1], csv: 'quema-emision-trx-por-anio',
        cols: [{ t: 'Año', v: (r) => r.y, o: (r) => r.y }, { t: 'Días', v: (r) => n(r.dias), o: (r) => r.dias }, { t: 'Emisión', v: (r) => mt(r.emision), o: (r) => r.emision }, { t: 'Quema', v: (r) => mt(r.quema), o: (r) => r.quema },
          { t: 'Neto', v: (r) => (r.neto >= 0 ? '+' : '−') + mt(Math.abs(r.neto)), o: (r) => r.neto, csv: (r) => r.neto }] })));

    cuerpo.append(caja('Un dato histórico: la propuesta 104', el('p', { style: 'margin:6px 0' }, 'La propuesta 104, votada por los 27 validadores y en vigor hacia el 29-ago-2025, bajó el precio de la energía de 210 a 100 sun. En los 30 días siguientes la quema diaria (mediana) bajó de 6,5 M a 3,9 M de TRX, un 41 %, mientras el uso de la red subía. Es una correlación fuerte, no una prueba: no se puede separar del todo de otros cambios (más TRX en stake, energía dinámica…).'),
      el('p', { class: 'hint', style: 'margin:6px 0 0' }, 'Dato fijo de un análisis de EquipoIA (21-oct-2026), no se actualiza solo.')));
    cuerpo.append(el('div', { class: 'ayuda' }, [
      { k: 'Cómo se comprueba', v: 'Cada día, lo que cambia la oferta de un día al siguiente debe ser la emisión menos la quema: hoy coincide al TRX en ' + n(D.coherencia.de - D.coherencia.diasConMasDe5Trx) + ' de ' + n(D.coherencia.de) + ' días (diferencia mediana ' + n(D.coherencia.desviacionMedianaTrx) + ' TRX; en el resto difiere, como mucho ' + n(D.coherencia.desviacionMaximaTrx) + ' TRX en un día).' },
      { k: 'De dónde sale', v: D.fuente + '. Los dólares de la quema de cada trimestre se calculan con el precio de cada día.' }].map((i) => el('div', { class: 'ai' }, el('b', null, i.k + '. '), el('span', { html: i.v })))));
    rQuema.replaceChildren(cuerpo);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (rReparto) traer('data/reparto-trx.json').then((D) => { if (!D || D.version !== 1 || !D.grupos) throw new Error('formato inesperado'); pintarReparto(D); }).catch((e) => aviso(rReparto, 'Todavía no hay reparto publicado', 'No se pudo cargar la lectura (' + String(e.message).slice(0, 40) + ').'));
    if (rQuema) traer('data/quema-trx.json').then((D) => { if (!D || D.version !== 1 || !D.trimestres) throw new Error('formato inesperado'); pintarQuema(D); }).catch((e) => aviso(rQuema, 'Todavía no hay datos de quema publicados', 'No se pudo cargar la lectura (' + String(e.message).slice(0, 40) + ').'));
  });
})();
