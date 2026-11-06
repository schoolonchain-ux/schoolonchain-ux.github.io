/* Zona 2 · pestaña USDT0: cuánto USDT0 hay en cada red, qué lo respalda, qué direcciones están bloqueadas y cómo van los mensajes entre redes.
   Lee data/usdt0.json, que prepara cada día el publicador de EquipoIA. Cada cifra dice de dónde sale: «lectura directa» es una lectura de la cadena hecha ese día a dos nodos
   públicos que tuvieron que coincidir; «vigilante» es lo que ha anotado el vigilante de USDT0 de EquipoIA. Sin IA. Si no hay fichero, la pestaña lo dice y no inventa nada. */
(function () {
  const { el, n } = C;
  const raiz = document.getElementById('usdt0-raiz'); if (!raiz) return;
  const fh = (t) => new Date(t).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const mm = (x) => (Math.abs(x) >= 1e9 ? n(x / 1e6, 0) + ' M $' : Math.abs(x) >= 1e6 ? n(x / 1e6, 1) + ' M $' : n(x) + ' $');
  const cuando = (h) => (h < 1 ? 'hace menos de 1 hora' : h < 48 ? 'hace ' + n(Math.round(h)) + ' horas' : 'hace ' + n(Math.round(h / 24)) + ' días');
  const kp = (l, v, s) => el('div', { class: 'kpi' }, el('div', { class: 'kl' }, l), el('div', { class: 'kv' }, v), el('div', { class: 'kn' }, s));
  const caja = (titulo, ...k) => el('div', { class: 'card', style: 'margin:12px 0' }, titulo ? el('h3', null, titulo) : null, ...k);
  const enlace = (dir) => el('a', { class: 'addr mono', href: 'https://etherscan.io/address/' + dir, target: '_blank', rel: 'noopener' }, dir);

  function pintar(D) {
    const edad = (Date.now() - Date.parse(D.leidoEn)) / 3600000;
    const C0 = D.circulacion, R = D.respaldo, V = D.vigilante, M = V.mensajes, B = V.bloqueos;
    const cuerpo = el('div');
    cuerpo.append(el('details', { class: 'como' }, el('summary', null, 'En pocas palabras: ¿qué es esto y cómo funciona?'),
      el('p', { html: '<b>USDT0</b> es el dólar digital de Tether preparado para viajar entre muchas redes con el sistema LayerZero. El <b>USDT de verdad queda guardado en un contrato de Ethereum</b> (el «adaptador») y en cada red se crea una cantidad igual de USDT0. Si todo cuadra, el USDT guardado es <b>igual o mayor</b> que el USDT0 que anda por las redes.' }),
      el('p', { html: 'Aquí ves cuánto hay en cada red, si el respaldo cuadra, qué direcciones tienen el USDT0 bloqueado y cómo van los mensajes que mueven el dinero de una red a otra.' })));
    cuerpo.append(el('div', { class: 'res-head ' + (edad > 48 ? 'warn' : '') }, el('div', { class: 'sub2' }, el('b', null, 'Lectura del ' + fh(Date.parse(D.leidoEn))), ' (' + cuando(edad) + ') · las cifras de circulación y respaldo se leyeron entonces directamente en la cadena; lo de bloqueos y mensajes lo anotó el vigilante de USDT0 a las ' + fh(Date.parse(V.generadoEn)).slice(11) + '.')));
    const m24 = M.ultimas24h;
    cuerpo.append(el('div', { class: 'kpis2' },
      kp('USDT0 en circulación', mm(C0.totalUsd), 'sumado en ' + n(C0.redesLeidas) + ' redes · lectura directa'),
      kp('USDT guardado en Ethereum', mm(R.usdtEnElAdaptador), (R.diferenciaUsd >= 0 ? '+' : '−') + mm(Math.abs(R.diferenciaUsd)) + ' (' + n(Math.abs(R.diferenciaPct), 2) + ' %) ' + (R.diferenciaUsd >= 0 ? 'más que el USDT0 medido' : 'menos que el USDT0 medido') + ' · lectura directa'),
      kp('Direcciones bloqueadas', n(B.vigentesTotal), 'en ' + n(B.porRed.length) + ' redes · fondos destruidos hasta hoy ' + mm(B.destruidoTotalUsd) + ' · vigilante'),
      m24 ? kp('Mensajes entre redes (24 h)', n(m24.total), (M.volumenUsd24h != null ? mm(M.volumenUsd24h) + ' movidos · ' : '') + n(m24.enCurso) + ' en curso · ' + n(m24.conProblema) + ' con problema · vigilante') : null));

    const total = C0.totalUsd;
    cuerpo.append(caja('USDT0 en circulación por red', el('div', { class: 'cs' }, 'Cantidad total de USDT0 que existe en cada red, leída hoy directamente en el contrato del token en los nodos públicos de esa red; deben dar el mismo número.'),
      UI.tabla({ pp: 10, buscar: false, csv: 'usdt0-circulacion-por-red', rows: C0.redes.map((r) => ({ ...r })), orden: [1, -1],
        cols: [{ t: 'Red', v: (r) => r.nombre, o: (r) => r.nombre }, { t: 'USDT0 en circulación', v: (r) => mm(r.usdt0), o: (r) => r.usdt0 }, { t: '% del total', v: (r) => n((r.usdt0 / total) * 100, 1) + ' %', o: (r) => r.usdt0 },
          { t: 'Nodos que dieron ese número', v: (r) => (r.nodosQueCoincidieron === r.nodosConfigurados ? n(r.nodosQueCoincidieron) + ' de ' + n(r.nodosConfigurados) : '1 de ' + n(r.nodosConfigurados) + ' (el otro no respondió)'), o: (r) => r.nodosQueCoincidieron }] })));

    cuerpo.append(caja('¿Cuadra el respaldo?', el('p', { class: 'cs', style: 'margin:0 0 8px' }, 'Se compara el USDT que guarda el adaptador de Ethereum con la suma del USDT0 de las redes de arriba, leído hoy a dos nodos públicos de Ethereum que deben dar el mismo número.'),
      el('p', { style: 'margin:6px 0' }, 'Adaptador de USDT0 en Ethereum: ', enlace(R.adaptador)),
      el('p', { style: 'margin:6px 0' }, 'Contrato del USDT en Ethereum: ', enlace(R.usdtEthereum)),
      el('p', { class: 'hint', style: 'margin:8px 0 0' }, R.nota)));

    if (B.porRed.length) cuerpo.append(caja('Direcciones con el USDT bloqueado, por red', el('div', { class: 'cs' }, 'Según el vigilante: bloqueos vigentes hoy, los que se levantaron y el dinero de cuentas bloqueadas que Tether ha destruido. Aquí entran Avalanche y Kaia, que usan el USDT nativo de Tether, no el USDT0.'),
      UI.tabla({ pp: 10, buscar: false, rows: B.porRed.map((r) => ({ ...r })), orden: [1, -1],
        cols: [{ t: 'Red', v: (r) => r.nombre, o: (r) => r.nombre }, { t: 'Bloqueadas hoy', v: (r) => n(r.vigentes), o: (r) => r.vigentes }, { t: 'Liberadas', v: (r) => n(r.liberadas), o: (r) => r.liberadas }, { t: 'Fondos destruidos', v: (r) => (r.destruidoUsd ? mm(r.destruidoUsd) : '—'), o: (r) => r.destruidoUsd }] }),
      el('p', { class: 'hint', style: 'margin:8px 0 0' }, 'Para ver si UNA dirección concreta está bloqueada, usa la zona «Comprobar» de arriba: lo lee en vivo de la cadena.')));

    if (M.rutasMayores && M.rutasMayores.length) {
      const atasc = M.atascadosNuevos24h, viejo = M.masAntiguoEnCurso;
      cuerpo.append(caja('Mensajes entre redes: las rutas con más dinero (24 h)', el('div', { class: 'cs' }, 'Cada traspaso de USDT0 de una red a otra viaja en un mensaje de LayerZero. Fuente de los mensajes: LayerZero Scan, anotados por el vigilante.'),
        UI.tabla({ pp: 5, buscar: false, rows: M.rutasMayores.map((r) => ({ ...r })), orden: [2, -1],
          cols: [{ t: 'Ruta', v: (r) => r.ruta.replace('→', ' → '), o: (r) => r.ruta }, { t: 'Mensajes', v: (r) => n(r.mensajes), o: (r) => r.mensajes }, { t: 'Dinero movido', v: (r) => mm(r.usd), o: (r) => r.usd }] }),
        el('p', { class: 'hint', style: 'margin:8px 0 0' }, (M.enCursoAhora != null ? n(M.enCursoAhora) + ' mensajes siguen en curso ahora' + (viejo ? ' (el más antiguo, en la ruta ' + viejo.ruta.replace('→', ' → ') + ', lleva ' + n(viejo.horas, 1) + ' horas)' : '') + '. ' : '') + (atasc != null ? n(atasc) + ' llevan más tiempo del normal para su ruta (se han marcado como «atascados» en las últimas 24 h). ' : '') + 'Un mensaje que tarda no significa por sí solo que el dinero se haya perdido.')));
    }

    cuerpo.append(el('div', { class: 'ayuda' }, [
      { k: 'De dónde sale', v: 'Circulación y respaldo: leídos directamente en cada red con los nodos públicos configurados, que tienen que dar el mismo número (la tabla dice cuántos lo dieron). Bloqueos y mensajes: el vigilante de USDT0 de EquipoIA (' + n(V.safes.total) + ' cuentas multifirma leídas en las redes, ' + (V.safes.tresDeCinco === V.safes.total ? 'todas con 3 firmas de 5' : n(V.safes.tresDeCinco) + ' con 3 firmas de 5') + '; lectura de ' + fh(Date.parse(V.generadoEn)) + ').' },
      { k: 'Qué NO cubre', v: 'No mide Stellar, IOTA ni HyperCore. En ' + n(V.huecosDeHistorialAbiertos) + ' puntos de la historia (redes cuyos nodos públicos no guardan todo el pasado) el vigilante no ha podido leer los bloqueos antiguos, así que los bloqueos viejos de esas redes pueden faltar. La cifra de «bloqueadas hoy» es la que consta en lo que sí se ha leído.' },
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
