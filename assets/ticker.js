/* Barra de novedades (teletipo). Fila 1: comprobador de bloqueos de USDT. Fila 2: descongelaciones de TRX con fechas.
   Los números salen de los ficheros de datos de la web (data/redes-usdt.json y data/desbloqueos-trx.json); si no se pueden leer, la barra lo dice y no inventa cifras. */
(function () {
  const el = (t, a, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(a || {})) { if (n === 'class') e.className = v; else if (n.startsWith('on')) e.addEventListener(n.slice(2), v); else if (v != null && v !== false) e.setAttribute(n, v); } for (const x of k.flat(Infinity)) if (x != null) e.append(x.nodeType ? x : document.createTextNode(x)); return e; };
  const SEP = () => el('span', { class: 'tk-sep', 'aria-hidden': 'true' }, '◆');
  const num = (x, d = 1) => x.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
  const mt = (x) => (x >= 1e6 ? num(x / 1e6, 1) + ' M TRX' : num(x, 0) + ' TRX');
  const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const fecha = (iso) => { const d = new Date(iso + 'T12:00:00Z'); return DIAS[d.getUTCDay()] + ' ' + iso.slice(8, 10) + '/' + iso.slice(5, 7); };
  const cargar = (u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const enHerramientas = /herramientas\.html$/.test(location.pathname);
  // En la propia página de herramientas, el enlace cambia de pestaña sin recargar.
  const enlace = (tab, ...k) => el('a', { class: 'tk-it', href: 'herramientas.html#' + tab, title: 'Abrir la herramienta', onclick: (ev) => { if (enHerramientas) { ev.preventDefault(); location.hash = tab; } } }, k);

  function fila(clase, etiqueta, items, aria) {
    const track = el('div', { class: 'tk-track' });
    const mitad = (copia) => el('span', { class: 'tk-mitad' + (copia ? ' tk-copia' : ''), 'aria-hidden': copia ? 'true' : null }, items().map((i, n) => [n ? SEP() : null, i]));
    const view = el('div', { class: 'tk-view' }, track);
    const raiz = el('div', { class: 'tk-row ' + clase, role: 'group', 'aria-label': aria }, el('span', { class: 'tk-tag ' + (clase === 'tk-b' ? 'tk-trx' : '') }, etiqueta), view);
    // se repite el contenido hasta cubrir el ancho, y se duplica para que el bucle no se note
    const armar = () => {
      track.textContent = ''; const a = mitad(false); track.append(a, SEP()); let veces = 1;
      while (a.offsetWidth * veces < view.clientWidth + 40 && veces < 8) { a.append(SEP(), ...items().map((i, n) => [n ? SEP() : null, i]).flat()); veces++; }
      const b = a.cloneNode(true); b.classList.add('tk-copia'); b.setAttribute('aria-hidden', 'true'); b.querySelectorAll('a').forEach((x) => x.setAttribute('tabindex', '-1')); track.append(b, SEP());
      const ancho = track.scrollWidth / 2; track.style.setProperty('--tk-dur', Math.max(25, ancho / 55) + 's');
    };
    return { raiz, armar };
  }

  async function montar() {
    if (document.querySelector('.ticker')) return;
    const [redes, calendario] = await Promise.all([cargar('data/redes-usdt.json'), cargar('data/desbloqueos-trx.json?v=' + Math.floor(Date.now() / 600000))]);
    const nEvm = redes && redes.redes ? redes.redes.filter((r) => r.tipo === 'evm').length : null;
    const redesTxt = nEvm ? nEvm + ' redes + TRON' : 'varias redes + TRON';

    // Fila 1: la herramienta, contada como una noticia (varias titulares seguidos)
    const f1 = fila('tk-a', 'USDT bloqueados', () => [
      enlace('comprobar', el('b', null, '¿Está bloqueada esta dirección?'), ' Compruébalo en USDT en ' + redesTxt),
      enlace('comprobar', 'Comprobador de bloqueos de Tether · ', el('b', null, redesTxt), ' · lectura en directo desde tu navegador'),
      enlace('comprobar', 'Pega una dirección ', el('b', null, '0x…'), ' o ', el('b', null, 'T…'), ' y míralo al instante · sin claves, sin guardar nada'),
    ], 'Comprobador de bloqueos de USDT');

    // Fila 2: las descongelaciones de TRX, con fechas, del calendario publicado
    const f2 = fila('tk-b', 'Desbloqueos TRX', () => {
      const K = calendario && calendario.calendario;
      if (!K || !K.porFecha) return [enlace('desbloqueos', el('b', null, 'Descongelaciones de TRX'), ' · calendario por fechas · pulsa para consultarlo')];
      const horas = (Date.now() - Date.parse(calendario.leidoEn)) / 36e5;
      const hoy = (calendario.leidoEn || '').slice(0, 10);
      const its = [];
      if (horas > 48) its.push(enlace('desbloqueos', '⚠ calendario sin actualizar desde hace ' + Math.round(horas / 24) + ' días'));
      if (K.yaDisponible) its.push(enlace('desbloqueos', el('b', null, 'Ya retirables:'), el('span', { class: 'tk-dato' }, mt(K.yaDisponible.trx) + ' · ' + num(K.yaDisponible.cuentas, 0) + ' cuentas')));
      K.porFecha.forEach((d) => its.push(enlace('desbloqueos', el('b', { class: d.dia === hoy ? 'tk-hoy' : '' }, d.dia === hoy ? 'HOY ' + fecha(d.dia) : fecha(d.dia)), el('span', { class: 'tk-dato' }, mt(d.trx) + ' · ' + num(d.cuentas, 0) + (d.cuentas === 1 ? ' cuenta' : ' cuentas')))));
      its.push(enlace('desbloqueos', 'Lectura del ' + calendario.leidoEn.slice(8, 10) + '/' + calendario.leidoEn.slice(5, 7) + ' ' + calendario.leidoEn.slice(11, 16) + ' UTC'));
      return its;
    }, 'Calendario de descongelaciones de TRX');

    const barra = el('div', { class: 'ticker', role: 'region', 'aria-label': 'Novedades de las herramientas on-chain' }, f1.raiz, f2.raiz);
    document.body.insertBefore(barra, document.body.firstChild);
    f1.armar(); f2.armar();
    let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { f1.armar(); f2.armar(); }, 250); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
