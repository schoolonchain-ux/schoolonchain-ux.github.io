/* Zona 2 · pestaña USDT0: cuánto USDT0 hay en cada red, qué lo respalda, qué direcciones están bloqueadas y cómo van los mensajes entre redes.
   Lee data/usdt0.json, que prepara cada día el publicador de EquipoIA. Cada cifra dice de dónde sale y SE PUEDE PULSAR para llegar a su origen: el contrato de cada red en su
   explorador, cada dirección bloqueada con la transacción del bloqueo, cada mensaje entre redes en LayerZero Scan. «Lectura directa» es una lectura de la cadena hecha ese día
   a dos nodos públicos que tuvieron que coincidir; «vigilante» es lo que ha anotado el vigilante de USDT0 de EquipoIA. Sin IA. Si no hay fichero, la pestaña lo dice y no inventa nada. */
(function () {
  const { el, n } = C;
  const raiz = document.getElementById('usdt0-raiz'); if (!raiz) return;
  const fh = (t) => new Date(t).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const mm = (x) => (Math.abs(x) >= 1e9 ? n(x / 1e6, 0) + ' M $' : Math.abs(x) >= 1e6 ? n(x / 1e6, 1) + ' M $' : n(x) + ' $');
  const cuando = (h) => (h < 1 ? 'hace menos de 1 hora' : h < 48 ? 'hace ' + n(Math.round(h)) + ' horas' : 'hace ' + n(Math.round(h / 24)) + ' días');
  const caja = (titulo, ...k) => el('div', { class: 'card', style: 'margin:12px 0' }, titulo ? el('h3', null, titulo) : null, ...k);
  const ext = (href, texto, cls) => el('a', { class: cls || 'addr', href, target: '_blank', rel: 'noopener', title: 'Se abre en otra pestaña' }, texto);
  const corto = (a) => (a.length > 18 ? a.slice(0, 8) + '…' + a.slice(-6) : a);
  const irA = (nodo) => { nodo.scrollIntoView({ behavior: 'smooth', block: 'start' }); nodo.classList.add('flash'); setTimeout(() => nodo.classList.remove('flash'), 1800); };
  // una cifra grande que se puede pulsar: lleva a la tabla o al origen de donde sale
  const kp = (l, v, s, accion, pista) => { const t = el('div', { class: 'kpi' + (accion ? ' clk' : ''), role: accion ? 'button' : null, tabindex: accion ? '0' : null }, el('div', { class: 'kl' }, l), el('div', { class: 'kv' }, v), el('div', { class: 'kn' }, s), accion ? el('div', { class: 'ko' }, (pista || 'Ver de dónde sale') + ' →') : null); if (accion) { t.addEventListener('click', accion); t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); accion(); } }); } return t; };

  function pintar(D) {
    const edad = (Date.now() - Date.parse(D.leidoEn)) / 3600000;
    const C0 = D.circulacion, R = D.respaldo, V = D.vigilante, M = V.mensajes, B = V.bloqueos;
    const cuerpo = el('div');
    cuerpo.append(el('details', { class: 'como' }, el('summary', null, 'En pocas palabras: ¿qué es esto y cómo funciona?'),
      el('p', { html: '<b>USDT0</b> es el dólar digital de Tether preparado para viajar entre muchas redes con el sistema LayerZero. El <b>USDT de verdad queda guardado en un contrato de Ethereum</b> (el «adaptador») y en cada red se crea una cantidad igual de USDT0. Si todo cuadra, el USDT guardado es <b>igual o mayor</b> que el USDT0 que anda por las redes.' }),
      el('p', { html: 'Aquí ves cuánto hay en cada red, si el respaldo cuadra, qué direcciones tienen el USDT0 bloqueado y cómo van los mensajes que mueven el dinero de una red a otra. <b>Cada cifra se puede pulsar</b> para llegar a la tabla de la que sale, y cada fila lleva a su contrato, dirección o mensaje en un explorador público.' })));
    cuerpo.append(el('div', { class: 'res-head ' + (edad > 48 ? 'warn' : '') }, el('div', { class: 'sub2' }, el('b', null, 'Lectura del ' + fh(Date.parse(D.leidoEn))), ' (' + cuando(edad) + ') · las cifras de circulación y respaldo se leyeron entonces directamente en la cadena; lo de bloqueos y mensajes lo anotó el vigilante de USDT0 a las ' + fh(Date.parse(V.generadoEn)).slice(11) + '.')));

    /* ---- las cajas de detalle (se crean antes para que las cifras puedan llevar a ellas) ---- */
    const total = C0.totalUsd;
    const cajaRedes = caja('USDT0 en circulación por red', el('div', { class: 'cs' }, 'Cantidad total de USDT0 que existe en cada red, leída hoy directamente en el contrato del token en los nodos públicos de esa red; deben dar el mismo número. Pulsa una red para abrir ese contrato en su explorador.'),
      UI.tabla({ pp: 10, buscar: false, csv: 'usdt0-circulacion-por-red', rows: C0.redes.map((r) => ({ ...r })), orden: [1, -1], onRow: (r) => { if (r.enlace) window.open(r.enlace, '_blank', 'noopener'); },
        cols: [{ t: 'Red', v: (r) => el('span', null, el('b', null, r.nombre), el('br'), r.contrato ? (r.enlace ? ext(r.enlace, 'contrato ' + corto(r.contrato) + ' ↗') : el('span', { class: 'mono', style: 'font-size:11.5px', title: 'Esta red no tiene explorador enlazado: copia la dirección' }, 'contrato ' + r.contrato + ' (sin explorador enlazado)')) : el('span', { class: 'muted' }, 'sin contrato')), o: (r) => r.nombre, csv: (r) => r.nombre + (r.contrato ? ' ' + r.contrato : '') },
          { t: 'USDT0 en circulación', v: (r) => mm(r.usdt0), o: (r) => r.usdt0, csv: (r) => r.usdt0 }, { t: '% del total', v: (r) => n((r.usdt0 / total) * 100, 1) + ' %', o: (r) => r.usdt0 },
          { t: 'Nodos que dieron ese número', v: (r) => (r.nodosQueCoincidieron === r.nodosConfigurados ? n(r.nodosQueCoincidieron) + ' de ' + n(r.nodosConfigurados) : '1 de ' + n(r.nodosConfigurados) + ' (el otro no respondió)'), o: (r) => r.nodosQueCoincidieron }] }),
      el('p', { class: 'hint', style: 'margin:8px 0 0' }, 'Cómo se lee: la función totalSupply() del contrato del token USDT0 de cada red. Lectura del ' + fh(Date.parse(D.leidoEn)) + '.'));

    const cajaRespaldo = caja('¿Cuadra el respaldo?', el('p', { class: 'cs', style: 'margin:0 0 8px' }, 'Se compara el USDT que guarda el adaptador de Ethereum con la suma del USDT0 de las redes de arriba, leído hoy a dos nodos públicos de Ethereum que deben dar el mismo número.'),
      el('p', { style: 'margin:6px 0' }, 'Adaptador de USDT0 en Ethereum (donde se guarda el USDT): ', ext(R.enlaceAdaptador || ('https://etherscan.io/address/' + R.adaptador), R.adaptador)),
      el('p', { style: 'margin:6px 0' }, 'Contrato del USDT en Ethereum: ', ext(R.enlaceUsdt || ('https://etherscan.io/address/' + R.usdtEthereum), R.usdtEthereum)),
      el('p', { style: 'margin:6px 0' }, 'Cómo se lee: la función balanceOf() del USDT a nombre del adaptador. Para comprobarlo en Etherscan: abre el contrato del USDT, pestaña «Read Contract», balanceOf con la dirección del adaptador.'),
      el('p', { class: 'hint', style: 'margin:8px 0 0' }, R.nota));

    // direcciones bloqueadas: la tabla de redes lleva a la lista de direcciones (cada una con su transacción de bloqueo)
    const dirs = (B.direcciones || []).map((x) => ({ ...x }));
    const cuerpoDirs = el('div'); const estadoDirs = el('p', { class: 'cs', style: 'margin:0 0 8px' });
    let tablaDirs = null;
    const pintarDirs = (filtroRed) => {
      const filas = filtroRed ? dirs.filter((x) => x.red === filtroRed) : dirs;
      estadoDirs.replaceChildren(filtroRed ? el('span', null, 'Mostrando las ' + n(filas.length) + ' direcciones bloqueadas en ' + (filas[0] ? filas[0].nombreRed : filtroRed) + '. ', el('a', { href: '#', onclick: (e) => { e.preventDefault(); pintarDirs(null); } }, 'Ver todas las redes')) : 'Las ' + n(filas.length) + ' direcciones bloqueadas hoy, con la transacción en la que Tether las bloqueó. Pulsa una dirección o una transacción para verla en el explorador de esa red.');
      const t = UI.tabla({ pp: 10, ph: 'Buscar una dirección…', csv: 'usdt0-direcciones-bloqueadas', rows: filas, orden: [2, -1],
        cols: [{ t: 'Red', v: (r) => r.nombreRed, o: (r) => r.nombreRed }, { t: 'Dirección', v: (r) => (r.enlace ? ext(r.enlace, r.direccion) : el('span', { class: 'mono', title: 'Sin explorador enlazado' }, r.direccion)), o: (r) => r.direccion, csv: (r) => r.direccion },
          { t: 'Bloqueada el', v: (r) => (r.bloqueadaEl ? fh(Date.parse(r.bloqueadaEl)) : '—'), o: (r) => r.bloqueadaEl || '' }, { t: 'Transacción del bloqueo', v: (r) => (r.tx ? (r.enlaceTx ? ext(r.enlaceTx, corto(r.tx) + ' ↗') : el('span', { class: 'mono' }, corto(r.tx))) : '—'), o: (r) => r.tx || '', csv: (r) => r.tx || '' },
          { t: 'Fondos destruidos', v: (r) => (r.destruidoUsd ? mm(r.destruidoUsd) : '—'), o: (r) => r.destruidoUsd }] });
      if (tablaDirs) tablaDirs.replaceWith(t); else cuerpoDirs.append(t); tablaDirs = t;
    };
    if (dirs.length) pintarDirs(null); else cuerpoDirs.append(el('p', { class: 'muted' }, 'La lista de direcciones no está en esta lectura.'));
    const cajaBloq = caja('Direcciones con el USDT bloqueado, por red', el('div', { class: 'cs' }, 'Según el vigilante: bloqueos vigentes hoy, los que se levantaron y el dinero de cuentas bloqueadas que Tether ha destruido. Aquí entran Avalanche y Kaia, que usan el USDT nativo de Tether, no el USDT0. Pulsa una red para ver sus direcciones.'),
      UI.tabla({ pp: 10, buscar: false, rows: B.porRed.map((r) => ({ ...r })), orden: [1, -1], onRow: (r) => { if (dirs.length) { pintarDirs(r.id); irA(cuerpoDirs); } },
        cols: [{ t: 'Red', v: (r) => r.nombre, o: (r) => r.nombre }, { t: 'Bloqueadas hoy', v: (r) => n(r.vigentes), o: (r) => r.vigentes }, { t: 'Liberadas', v: (r) => n(r.liberadas), o: (r) => r.liberadas }, { t: 'Fondos destruidos', v: (r) => (r.destruidoUsd ? mm(r.destruidoUsd) : '—'), o: (r) => r.destruidoUsd }] }),
      el('h3', { style: 'margin:16px 0 4px;font-size:15px' }, 'Las direcciones, una a una'), estadoDirs, cuerpoDirs,
      el('p', { class: 'hint', style: 'margin:8px 0 0' }, 'Cómo se lee: los avisos BlockPlaced / BlockReleased / DestroyedBlockedFunds que emite el contrato del USDT0 de cada red (y el del USDT en Avalanche y Kaia), recogidos por el vigilante. Para ver si UNA dirección concreta está bloqueada ahora mismo, usa la zona «Comprobar»: lo lee en vivo de la cadena.'));

    // mensajes entre redes: cada ruta lleva a sus mensajes, cada mensaje a LayerZero Scan
    const cuerpoMsgs = el('div');
    const pintarRuta = (r) => {
      const ej = r.ejemplos || [];
      cuerpoMsgs.replaceChildren(el('p', { class: 'cs', style: 'margin:0 0 8px' }, 'Ruta ' + r.ruta.replace('→', ' → ') + ': ' + (ej.length ? 'los ' + n(ej.length) + ' mensajes con más dinero de las últimas 24 h. Pulsa uno para verlo en LayerZero Scan (quién lo envió, cuándo salió y cuándo llegó).' : 'no hay mensajes guardados de esta ruta en la lectura.')),
        ej.length ? UI.tabla({ pp: 8, buscar: false, csv: 'usdt0-mensajes-' + r.ruta.replace('→', '-'), rows: ej.map((x) => ({ ...x })), onRow: (x) => window.open(x.enlace, '_blank', 'noopener'),
          cols: [{ t: 'Salió', v: (x) => fh(Date.parse(x.cuando)), o: (x) => x.cuando }, { t: 'Dinero', v: (x) => mm(x.usd), o: (x) => x.usd }, { t: 'Estado', v: (x) => (x.estado === 'DELIVERED' ? 'entregado' : x.estado === 'INFLIGHT' ? 'en curso' : String(x.estado).toLowerCase()), o: (x) => x.estado },
            { t: 'Mensaje (LayerZero Scan)', v: (x) => ext(x.enlace, corto(x.guid) + ' ↗'), o: (x) => x.guid, csv: (x) => x.guid }, { t: 'Transacción de origen', v: (x) => (x.enlaceTxOrigen ? ext(x.enlaceTxOrigen, corto(x.txOrigen) + ' ↗') : el('span', { class: 'mono' }, corto(x.txOrigen || '—'))), o: (x) => x.txOrigen || '', csv: (x) => x.txOrigen || '' }] }) : null);
    };
    const enCurso = M.enCurso || [];
    const cajaMsgs = M.rutasMayores && M.rutasMayores.length ? caja('Mensajes entre redes: las rutas con más dinero (24 h)', el('div', { class: 'cs' }, 'Cada traspaso de USDT0 de una red a otra viaja en un mensaje de LayerZero. Fuente: ', ext('https://layerzeroscan.com', 'LayerZero Scan', 'lnk'), ', anotado por el vigilante. Pulsa una ruta para ver sus mensajes.'),
      UI.tabla({ pp: 5, buscar: false, rows: M.rutasMayores.map((r) => ({ ...r })), orden: [2, -1], onRow: (r) => { pintarRuta(r); irA(cuerpoMsgs); },
        cols: [{ t: 'Ruta', v: (r) => r.ruta.replace('→', ' → '), o: (r) => r.ruta }, { t: 'Mensajes', v: (r) => n(r.mensajes), o: (r) => r.mensajes }, { t: 'Dinero movido', v: (r) => mm(r.usd), o: (r) => r.usd }] }),
      cuerpoMsgs,
      enCurso.length ? el('div', null, el('h3', { style: 'margin:16px 0 4px;font-size:15px' }, 'Mensajes que siguen en curso'), el('p', { class: 'cs', style: 'margin:0 0 8px' }, (M.enCursoAhora != null ? n(M.enCursoAhora) + ' mensajes siguen en curso' : 'Mensajes en curso') + (M.masAntiguoEnCurso ? ' (el más antiguo, en la ruta ' + M.masAntiguoEnCurso.ruta.replace('→', ' → ') + ', lleva ' + n(M.masAntiguoEnCurso.horas, 1) + ' horas)' : '') + '. Aquí los ' + n(enCurso.length) + ' más antiguos; pulsa uno para verlo en LayerZero Scan. Un mensaje que tarda no significa por sí solo que el dinero se haya perdido.'),
        UI.tabla({ pp: 6, buscar: false, rows: enCurso.map((x) => ({ ...x })), orden: [1, -1], onRow: (x) => window.open(x.enlace, '_blank', 'noopener'), cols: [{ t: 'Ruta', v: (x) => x.ruta.replace('→', ' → '), o: (x) => x.ruta }, { t: 'Lleva', v: (x) => n(x.horas, 1) + ' h', o: (x) => x.horas }, { t: 'Dinero', v: (x) => (x.usd == null ? '—' : mm(x.usd)), o: (x) => x.usd || 0 }, { t: 'Mensaje (LayerZero Scan)', v: (x) => ext(x.enlace, corto(x.guid) + ' ↗'), o: (x) => x.guid, csv: (x) => x.guid }] })) : null) : null;
    if (cajaMsgs) pintarRuta(M.rutasMayores[0]);

    /* ---- las cifras grandes, cada una pulsable ---- */
    const m24 = M.ultimas24h;
    cuerpo.append(el('div', { class: 'kpis2' },
      kp('USDT0 en circulación', mm(total), 'sumado en ' + n(C0.redesLeidas) + ' redes · lectura directa', () => irA(cajaRedes), 'Ver por red y contrato'),
      kp('USDT guardado en Ethereum', mm(R.usdtEnElAdaptador), (R.diferenciaUsd >= 0 ? '+' : '−') + mm(Math.abs(R.diferenciaUsd)) + ' (' + n(Math.abs(R.diferenciaPct), 2) + ' %) ' + (R.diferenciaUsd >= 0 ? 'más que el USDT0 medido' : 'menos que el USDT0 medido') + ' · lectura directa', () => irA(cajaRespaldo), 'Ver el adaptador en Etherscan'),
      kp('Direcciones bloqueadas', n(B.vigentesTotal), 'en ' + n(B.porRed.length) + ' redes · fondos destruidos hasta hoy ' + mm(B.destruidoTotalUsd) + ' · vigilante', () => { if (dirs.length) pintarDirs(null); irA(cajaBloq); }, 'Ver las direcciones'),
      m24 ? kp('Mensajes entre redes (24 h)', n(m24.total), (M.volumenUsd24h != null ? mm(M.volumenUsd24h) + ' movidos · ' : '') + n(m24.enCurso) + ' en curso · ' + n(m24.conProblema) + ' con problema · vigilante', cajaMsgs ? () => irA(cajaMsgs) : null, 'Ver rutas y mensajes') : null));

    cuerpo.append(cajaRedes, cajaRespaldo, cajaBloq); if (cajaMsgs) cuerpo.append(cajaMsgs);
    cuerpo.append(el('div', { class: 'ayuda' }, [
      { k: 'De dónde sale', v: 'Circulación y respaldo: leídos directamente en cada red con los nodos públicos configurados, que tienen que dar el mismo número (la tabla dice cuántos lo dieron). Bloqueos y mensajes: el vigilante de USDT0 de EquipoIA (' + n(V.safes.total) + ' cuentas multifirma leídas en las redes, ' + (V.safes.tresDeCinco === V.safes.total ? 'todas con 3 firmas de 5' : n(V.safes.tresDeCinco) + ' con 3 firmas de 5') + '; lectura de ' + fh(Date.parse(V.generadoEn)) + ').' },
      { k: 'Qué NO cubre', v: 'No mide Stellar, IOTA ni HyperCore. En ' + n(V.huecosDeHistorialAbiertos) + ' puntos de la historia (redes cuyos nodos públicos no guardan todo el pasado) el vigilante no ha podido leer los bloqueos antiguos, así que los bloqueos viejos de esas redes pueden faltar. La cifra de «bloqueadas hoy» es la que consta en lo que sí se ha leído. Cuatro redes (Stable, Tempo, MegaETH y Hedera) no tienen explorador enlazado: se enseña la dirección para copiarla.' },
      { k: 'Cuándo se actualiza', v: 'Una vez al día. Para una dirección o contrato concreto, usa «Comprobar»: eso sí se lee en vivo.' }].map((i) => el('div', { class: 'ai' }, el('b', null, i.k + '. '), el('span', { html: i.v })))));
    raiz.replaceChildren(cuerpo);
  }

  function fallo(msg) {
    raiz.replaceChildren(el('div', { class: 'res-head warn' }, el('div', { class: 'big' }, 'Todavía no hay lectura de USDT0 publicada'), el('div', { class: 'sub2' }, msg + ' Mientras tanto puedes comprobar una dirección o un contrato en la zona «Comprobar».')));
  }

  document.addEventListener('DOMContentLoaded', () => {
    fetch('data/usdt0.json?v=' + Math.floor(Date.now() / 600000), { signal: AbortSignal.timeout(15000) })
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then((D) => { if (!D || D.version !== 1 || !D.circulacion || !D.respaldo || !D.vigilante) throw new Error('formato inesperado'); pintar(D); })
      .catch((e) => fallo('No se pudo cargar la lectura (' + String(e.message).slice(0, 40) + ').'));
  });
})();
