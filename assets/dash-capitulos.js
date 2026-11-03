/* Estructura narrativa: 8 capítulos con introducción, «cómo leer», resúmenes de cierre y enlace al siguiente.
   Se lee de arriba abajo; cada capítulo usa solo lo que ya se explicó en los anteriores. */
(function () {
  const { el, n, m, pct } = C;
  const CAPS = (Dash.caps = [
    { n: 1, id: 'cap-1', t: 'Lo esencial', corto: 'Lo esencial', d: 'Una página: cuánto dinero salió, cuánto se recuperó de verdad y qué no sabemos.' },
    { n: 2, id: 'cap-2', t: 'Cómo leer este informe', corto: 'Cómo leer', d: 'Cinco ideas y cinco palabras que ahorran dudas en el resto.' },
    { n: 3, id: 'cap-3', t: 'El caso, paso a paso', corto: 'El caso', d: 'Los hechos fechados sobre los que se apoya todo lo demás.' },
    { n: 4, id: 'cap-4', t: 'Dónde está el dinero', corto: 'Dónde está', d: 'La foto fija de hoy: qué está congelado, qué sigue quieto y cómo se repartió el resto en TRON.' },
    { n: 5, id: 'cap-5', t: 'Cómo se movió en TRON', corto: 'Cómo se movió', d: 'La película: cuándo se movió el dinero y por qué direcciones pasó. Aquí puedes abrir la ficha de cualquiera.' },
    { n: 6, id: 'cap-6', t: 'A dónde salió', corto: 'A dónde salió', d: 'Los puentes hacia otras cadenas y los puntos donde el seguimiento se detiene.' },
    { n: 7, id: 'cap-7', t: 'Qué tan fiable es', corto: 'Fiabilidad', d: 'La incertidumbre del modelo, dónde se pierde el rastro y qué dicen fuentes externas.' },
    { n: 8, id: 'cap-8', t: 'Método, calidad y fuentes', corto: 'Método', d: 'Cómo se hizo, por qué, qué comprobaciones pasa y cómo repetirlo.' },
  ]);
  Dash.irCap = (n2) => { const t = document.getElementById('cap-' + n2); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  function cabeceraCap(i, lead) {
    const c = CAPS[i - 1];
    Dash.nav.push([c.id, c.n + ' · ' + c.corto]);
    Dash.app.append(el('div', { class: 'cap', id: c.id },
      el('div', { class: 'capn' }, 'Capítulo ' + c.n + ' de ' + CAPS.length),
      el('h2', { class: 'capt' }, c.t),
      el('p', { class: 'capl', html: lead || c.d })));
  }
  // cierre de capítulo: lo visto + qué viene
  function cierre(i, visto, proximo) {
    const sig = CAPS[i];
    Dash.app.append(el('div', { class: 'recap' },
      el('b', { class: 'rh' }, 'Lo que hemos visto en el capítulo ' + i),
      el('ul', null, visto.map((t) => el('li', { html: t }))),
      sig ? el('div', { class: 'sig' }, el('span', { class: 'muted' }, proximo || ''), el('button', { class: 'btn primary', onclick: () => Dash.irCap(sig.n) }, 'Siguiente: ' + sig.t + ' →')) : null));
  }

  /* ---------- 1 · Lo esencial (el resumen se dibuja en dash-core con orden 10) ---------- */
  Dash.add(9, () => cabeceraCap(1, 'Empieza aquí. <b>Si solo lees un capítulo, que sea este.</b> En una página: cuánto dinero salió, cuánto se recuperó de verdad y qué no sabemos. Los capítulos siguientes explican cada cifra, en orden; cada uno usa solo lo que ya se ha contado antes.'));

  Dash.add(11, function ({ d }) {
    cierre(1, ['Lo congelado es lo único recuperado de verdad; el resto está quieto o se movió, y su seguimiento es una estimación.', 'La cuenta no cuadra del todo y se muestra tal cual.', 'Una dirección no es una persona: el informe sigue dinero, no identifica a nadie.'], 'Ya tienes la idea general. Antes de los detalles, cinco palabras que conviene conocer.');
  });

  /* ---------- 2 · Cómo leer este informe ---------- */
  Dash.add(12, function ({ d, meta }) {
    cabeceraCap(2, 'Antes de entrar en detalle, <b>cinco ideas y cinco palabras</b>. Con esto se entiende todo lo demás, y no hace falta saber de cadenas de bloques.');
    const s = el('section', { class: 'blk', id: 'comoleer' });
    const nivel = Object.entries(d.estados || {});
    s.append(el('div', { class: 'grid g2' },
      el('div', { class: 'card' }, el('h3', null, 'Idea 1 · Cada cifra dice cuánto puede fiarse uno de ella'),
        el('p', { class: 'narr' }, 'Verás etiquetas de colores junto a los números. De más a menos sólido:'),
        el('div', { class: 'narr' }, nivel.map(([k, v]) => Dash.filaNivel(k, v, 'margin:7px 0'))), el('p', { class: 'hint' }, 'Pulsa una etiqueta para ver todo lo que la lleva.')),
      el('div', { class: 'card' }, el('h3', null, 'Ideas 2 a 5 · Cómo funciona el informe'),
        el('ol', { class: 'narr', style: 'margin:6px 0 0 18px;padding:0' }, [
          ['Una dirección no es una persona.', ' Una dirección es un «número de cuenta». El informe sigue dinero entre direcciones; no identifica a nadie.'],
          ['Los dólares son una estimación.', ' Cada movimiento se valora al precio de su hora. Lo verificado en la cadena se dice VERIFICADO.'],
          ['Lo que no se sabe se dice.', ' Donde el seguimiento se corta, aparece como DESCONOCIDO o como punto de parada, con su motivo.'],
          ['Todo se puede comprobar.', ' Cada transacción y cada dirección enlaza con el explorador público; los datos se pueden descargar.']].map(([a, b]) => el('li', { style: 'margin:7px 0' }, el('b', null, a), b))))));
    const pal = [
      ['Congelado', 'Una dirección que el emisor de la moneda (por ejemplo Tether) ha bloqueado: lo que tenga no se puede mover. Es lo único recuperado de verdad.'],
      ['La «foto»', 'Un corte fijo en el tiempo: 30-oct, 22:40 UTC. Separa el reparto anterior (tramo 6) del posterior (tramo 5) para poder comprobar cada parte por separado.'],
      ['Pureza', 'La parte del dinero de una billetera que el modelo atribuye al robo. Si una billetera mezcla dinero del robo con otro, se asume que lo que envía sale con la misma proporción.'],
      ['Punto de parada', 'Un lugar donde el seguimiento termina a propósito, por ejemplo una dirección de servicio con muchísima actividad. No es un destino final demostrado.'],
      ['Puente', 'Un servicio que mueve dinero de una cadena (por ejemplo TRON) a otra (por ejemplo Ethereum): Symbiosis, Chainflip, Across o USDT0.'],
    ];
    s.append(el('div', { class: 'card', style: 'margin-top:14px' }, el('h3', null, 'Las cinco palabras que verás'), el('div', { class: 'grid g2', style: 'margin-top:8px' }, pal.map(([t, x]) => el('div', { class: 'narr' }, el('b', null, t), el('div', null, x)))), el('button', { class: 'tbtn', style: 'margin-top:8px', onclick: () => Dash.glosario() }, 'Ver el glosario completo →')));
    s.append(el('div', { class: 'card', style: 'margin-top:14px' }, el('h3', null, 'Cómo moverte por el panel'),
      el('ul', { class: 'narr', style: 'margin:6px 0 0 18px;padding:0' }, [
        'Lee de arriba abajo: cada capítulo empieza diciendo qué vas a ver y termina con un resumen de lo visto.',
        'Todo lo que ves se puede pulsar: un gráfico abre su detalle; una dirección abre su ficha.',
        'El botón «ⓘ Cómo leerlo» de cada gráfico explica qué muestra y cómo se lee. El botón «▦ Datos» muestra la tabla que hay detrás.',
        'Esc cierra el panel lateral; la flecha ← de su cabecera vuelve a lo anterior.'].map((t) => el('li', { style: 'margin:5px 0' }, t))),
      meta.semilla ? el('button', { class: 'btn', style: 'margin-top:10px', onclick: () => Ficha.abrir(meta.semilla) }, 'Probar ahora: abrir la ficha de la billetera de reparto') : null));
    Dash.app.append(s);
  });

  Dash.add(13, function () {
    cierre(2, ['Cada cifra lleva una etiqueta de evidencia: VERIFICADO, ESTIMADO, HIPÓTESIS, DESCONOCIDO o PENDIENTE.', 'Ya conoces cinco palabras: congelado, foto, pureza, punto de parada y puente.', 'Todo lo que ves se puede pulsar; cada gráfico tiene «Cómo leerlo» y «Datos».'], 'Ya puedes seguir sin tropezar con términos nuevos. Empezamos por los hechos.');
  });

  /* ---------- 3 · El caso (cronología, orden 20 en dash-core) ---------- */
  Dash.add(19, () => cabeceraCap(3, 'Los hechos con fecha y hora, en orden. Lo marcado en verde se comprobó directamente en la cadena. Es la base de los capítulos siguientes.'));
  Dash.add(26, function ({ d }) {
    cierre(3, ['El robo ocurrió a la vez en dos cadenas: Ethereum y TRON.', 'Tether bloqueó las dos primeras direcciones de TRON esa misma noche; después fue añadiendo más.', 'El resto de fechas (la foto y el corte de datos) las fija el método del informe, no la cadena.'], 'Ya sabes qué pasó y cuándo. Ahora, dónde está el dinero hoy.');
  });

  /* ---------- 4 · Dónde está el dinero (reparto 30 · ethereum 35 · flujo 40) ---------- */
  Dash.add(29, () => cabeceraCap(4, 'La <b>foto fija de hoy</b>. Primero, para todas las cadenas: cuánto está congelado y cuánto sigue quieto. Después, en Ethereum, el dinero que no se puede congelar. Por último, cómo se repartió el tramo que sí se movió en TRON. Aquí aparecen la «foto» y la «pureza» que acabas de leer en el capítulo 2.'));
  Dash.add(45, function ({ d, det }) {
    const T = d.tron || {}, G = d.global || {}, q = d.ethereumQuieto;
    const v = [];
    if (G.partidas && G.partidas[0]) v.push('De <b>' + m(G.capital) + '</b> que se siguen en total, <b>' + m(G.partidas[0].importe) + '</b> están congelados (' + pct(G.partidas[0].importe / G.capital, 0) + '), verificado hoy en cada contrato.');
    if (q) v.push('<b>' + n(q.eth) + ' ETH</b> (' + m(q.usd) + ') siguen quietos en Ethereum. No se pueden congelar; solo vigilar.');
    if (T.partidas) v.push('En TRON, <b>' + m(T.partidas[0].importe) + '</b> están congelados y el resto se repartió. La suma de partidas supera al capital en <b>' + m(Math.abs(T.diferencia)) + '</b>; ese descuadre se muestra tal cual.');
    cierre(4, v, 'Sabes dónde está el dinero. Ahora, cómo llegó el tramo de TRON hasta ahí.');
  });

  /* ---------- 5 · Cómo se movió en TRON (tiempo 50 · red 60 · direcciones 65) ---------- */
  Dash.add(48, () => cabeceraCap(5, 'Ahora la <b>película</b>. Primero el tiempo: cuándo se movió el dinero y a qué ritmo. Después la red: por qué direcciones pasó. Al final, el explorador con <b>todas</b> las direcciones, donde cada una tiene su ficha.'));
  Dash.add(68, function ({ d, det }) {
    const sh = d.serieHora || [], ct = d.congelacionTron;
    const v = [];
    if (sh.length) { const dias = (Date.parse(sh[sh.length - 1].t + ':00:00Z') - Date.parse(sh[0].t + ':00:00Z')) / 86400000; v.push('El reparto salió de <b>una sola billetera</b> en <b>' + n(sh.reduce((a, x) => a + x.n, 0)) + ' envíos</b> a lo largo de ' + (dias > 2 ? 'más de dos días' : 'unas ' + n(dias * 24) + ' horas') + ', en oleadas y no de golpe.'); }
    if (ct) v.push('Tether fue bloqueando direcciones: <b>' + n(ct.bloqueadasHoy) + ' de ' + n(ct.direcciones) + '</b> siguen bloqueadas hoy.');
    if (d.red) v.push('El libro mayor contiene <b>' + n(d.red.totalMovimientos) + ' movimientos</b> y <b>' + n(d.red.totalCuentas) + ' billeteras</b> de TRON; cada una tiene ficha con quién le envía y a quién envía.');
    cierre(5, v, 'Sabes cómo se movió dentro de TRON. Ahora, a dónde salió de TRON.');
  });

  /* ---------- 6 · A dónde salió (puentes 80 · destinos 90) ---------- */
  Dash.add(75, () => cabeceraCap(6, 'Parte del dinero <b>salió de TRON</b> por puentes y parte <b>se detuvo</b> en servicios. Aquí se ve qué se pudo comprobar en la cadena de destino y qué no, y por qué el seguimiento termina donde termina.'));
  Dash.add(95, function ({ d }) {
    const P = d.puentes || {}, dc = d.destinosPorClase || {};
    const v = [];
    if (P.usdt0) v.push('Por USDT0 salieron <b>' + m(P.usdt0.enviado) + '</b>; <b>' + n(P.usdt0.entregados) + ' de ' + n(P.usdt0.n) + '</b> envíos tienen recibo comprobado en destino.');
    if (P.symbiosis) v.push('Symbiosis: <b>' + n(P.symbiosis.envios) + ' envíos</b>; las llegadas a Ethereum y Arbitrum se comprobaron en Etherscan.');
    if (dc.nodo) v.push('La mayor parte del reparto se detiene en <b>nodos de servicio</b> (' + m(dc.nodo.atribuido) + '): direcciones de uso muy alto, donde seguir cada salida mezclaría el dinero con el de otros clientes.');
    v.push('Un depósito en una casa de cambio es un <b>depósito detectado</b>: no identifica a nadie.');
    cierre(6, v, 'Sabes a dónde fue. Falta lo importante: qué tan seguro es todo esto.');
  });

  /* ---------- 7 · Qué tan fiable es (pureza 100 · rastro 110 · cruces 120) ---------- */
  Dash.add(98, () => cabeceraCap(7, 'Un modelo no es una verdad: tiene <b>incertidumbre</b>. Aquí se muestra sin esconderla: las dos formas de calcular la pureza, los sitios donde se pierde el rastro y lo que dicen fuentes externas (Arkham y Polytrop).'));
  Dash.add(125, function ({ d }) {
    const pz = d.pureza, pd = d.perdida, ar = d.arkham;
    const v = [];
    if (pz) { const rel = pz.tramos.flatMap((t) => Object.values(t.vias).map((x) => x.relacion)); v.push('Con las tres vías de pureza, lo repartido va del <b>' + n(Math.min(...rel) * 100, 0) + ' %</b> al <b>' + n(Math.max(...rel) * 100, 0) + ' %</b> de lo que entra. Ese rango es la incertidumbre del modelo.'); }
    if (pd) v.push('Hay <b>' + n(pd.total) + ' direcciones o contratos</b> donde el rastro se corta, cada uno con su motivo.');
    if (ar) v.push('Arkham marca <b>' + n(ar.total) + ' transacciones</b> recientes; <b>' + n(ar.hashNuestro) + '</b> ya estaban en nuestro libro. Una coincidencia es una pista, no una prueba.');
    cierre(7, v, 'Ya sabes qué se afirma y con qué margen. Queda el cómo: método, comprobaciones y datos.');
  });

  /* ---------- 8 · Método, calidad y fuentes (200+) ---------- */
  Dash.add(195, () => cabeceraCap(8, 'Cómo se hizo todo lo anterior y <b>por qué se tomó cada decisión</b>. Aquí están las reglas, las comprobaciones automáticas que pasa el informe, de dónde salen los datos y cómo repetirlo.'));
  Dash.add(240, function () {
    Dash.app.append(el('div', { class: 'recap' }, el('b', { class: 'rh' }, 'Fin del recorrido'),
      el('p', { class: 'narr' }, 'Has visto qué pasó, dónde está el dinero, cómo se movió, a dónde salió y con qué margen de error se afirma. Desde aquí puedes:'),
      el('div', { class: 'sig', style: 'justify-content:flex-start' },
        el('button', { class: 'btn', onclick: () => Dash.irCap(1) }, '↑ Volver al resumen'),
        el('button', { class: 'btn', onclick: () => document.getElementById('direcciones').scrollIntoView() }, 'Explorar direcciones'),
        el('a', { class: 'btn primary', href: Dash.base + 'informe-completo.html' }, 'Abrir el informe original completo'))));
  });
})();
