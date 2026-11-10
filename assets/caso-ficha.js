/* Ficha común de caso: los dos estados (investigación y seguimiento), la ficha de ocho apartados y el archivo de versiones.
   Los textos y los estados son datos de cada caso en reports/index.json; aquí solo se pintan. Las cifras entre llaves ({verificados}, {ultima}…)
   las pone cada página con lo que acaba de leer; si una no llega, se escribe «sin dato», nunca un número inventado. */
(function () {
  const { el } = window.C;
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const dia = (iso) => { const d = new Date(iso); return isNaN(d) ? null : d.getUTCDate() + ' ' + MES[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
  const diaHora = (iso) => { const d = new Date(iso); return isNaN(d) ? null : dia(iso) + ', ' + String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0') + ' UTC'; };
  const n = (v) => (typeof v === 'number' ? v.toLocaleString('es-ES') : v);

  // Etiquetas de los dos estados. Son independientes: un caso puede tener la investigación cerrada y el seguimiento activo.
  function etiquetas(r) {
    const out = []; const i = r.investigacion, s = r.seguimiento;
    if (i) out.push({ clase: i.estado === 'cerrada' ? 'cerrada' : 'curso', texto: i.estado === 'cerrada' ? 'Investigación cerrada' : 'Investigación en curso', titulo: i.nota || '' });
    if (s) out.push({ clase: s.estado === 'activo' ? 'activo' : 'sin', texto: (s.estado === 'activo' ? 'Seguimiento activo' : 'Sin seguimiento') + (s.etiqueta ? ' (' + s.etiqueta + ')' : ''), titulo: s.alcance || '' });
    return out;
  }
  const chips = (r) => etiquetas(r).map((e) => el('span', { class: 'chip est-caso est-' + e.clase, title: e.titulo }, e.texto));

  function resumenCasos(informes) {
    const c = informes.length, curso = informes.filter((r) => r.investigacion && r.investigacion.estado !== 'cerrada').length, cerr = informes.filter((r) => r.investigacion && r.investigacion.estado === 'cerrada').length;
    return c + (c === 1 ? ' investigación' : ' investigaciones') + (curso || cerr ? ': ' + [curso ? curso + ' en curso' : null, cerr ? cerr + (cerr === 1 ? ' cerrada' : ' cerradas') : null].filter(Boolean).join(' y ') : '');
  }

  // Sustituye {clave} por su valor. Devuelve también si faltó alguno.
  function rellenar(texto, v) { let falta = false; const t = String(texto || '').replace(/\{(\w+)\}/g, (_, k) => { const x = v ? v[k] : undefined; if (x === undefined || x === null || x === '') { falta = true; return 'sin dato'; } return n(x); }); return { t, falta }; }

  function ficha(r, valores) {
    if (!r || (!r.investigacion && !r.seguimiento && !r.ficha)) return null;
    const v = Object.assign({}, valores); if (v.ultima) v.ultima = diaHora(v.ultima) || v.ultima;
    const i = r.investigacion, s = r.seguimiento;
    const cab = el('div', { class: 'fc-est' });
    if (i) cab.append(el('div', { class: 'fc-e' }, el('span', { class: 'chip est-caso est-' + (i.estado === 'cerrada' ? 'cerrada' : 'curso') }, i.estado === 'cerrada' ? 'Investigación cerrada' : 'Investigación en curso'), el('div', { class: 'fc-d' }, i.datosHasta ? el('b', null, 'Datos hasta el ' + diaHora(i.datosHasta) + '. ') : null, i.nota || '')));
    if (s) cab.append(el('div', { class: 'fc-e' }, el('span', { class: 'chip est-caso est-' + (s.estado === 'activo' ? 'activo' : 'sin') }, (s.estado === 'activo' ? 'Seguimiento activo' : 'Sin seguimiento') + (s.etiqueta ? ' (' + s.etiqueta + ')' : '')), el('div', { class: 'fc-d' }, v.ultima ? el('b', null, 'Última comprobación publicada: ' + v.ultima + '. ') : (s.estado === 'activo' ? el('b', null, 'Última comprobación: sin dato. ') : null), s.alcance || '', s.siHayMovimientos ? ' ' + s.siHayMovimientos : '')));
    const w = el('section', { class: 'ficha-caso', id: 'ficha-caso', 'aria-label': 'Ficha del caso' }, el('div', { class: 'fc-t' }, 'Ficha del caso'), cab);
    if ((r.ficha || []).length) {
      w.append(el('details', { class: 'fc-mas' }, el('summary', null, 'Ver la ficha completa: ', el('span', null, r.ficha.map((f) => f.t.toLowerCase()).join(', '))), el('dl', { class: 'fc-l' }, r.ficha.map((f) => { const x = rellenar(f.texto, v); return [el('dt', null, f.t), el('dd', { class: x.falta ? 'fc-falta' : null }, x.t, f.enlace ? [' ', el('a', { href: f.enlace }, f.enlaceT || 'Ver')] : null)]; }))));
    }
    return w;
  }

  // Archivo de versiones: cada edición publicada sigue accesible con sus datos y su huella.
  function versiones(r) {
    const V = r.versiones; if (!V || !(V.ediciones || []).length) return null;
    const corta = (h) => h.slice(0, 12) + '…' + h.slice(-6);
    const copiar = (h, b) => { const ok = () => { b.textContent = 'Copiada'; setTimeout(() => { b.textContent = 'Copiar huella'; }, 1500); }; if (navigator.clipboard) navigator.clipboard.writeText(h).then(ok).catch(() => { b.textContent = h; }); else b.textContent = h; };
    const fila = (e) => el('tr', null,
      el('td', null, el('b', null, e.version), el('div', { class: 'muted' }, dia(e.fecha) || e.fecha)),
      el('td', null, e.papel || ''),
      el('td', null, (e.archivos || []).length ? el('ul', { class: 'av-arch' }, e.archivos.map((a) => { const b = a.sha256 ? el('button', { class: 'btn mini', title: 'SHA-256 completa: ' + a.sha256 }, 'Copiar huella') : null; if (b) b.onclick = () => copiar(a.sha256, b); return el('li', null, el('a', { href: a.ruta }, a.t), a.sha256 ? [' ', el('code', { title: a.sha256 }, corta(a.sha256)), ' ', b] : null); })) : el('span', { class: 'muted' }, 'No se conserva el informe.'), e.resumen ? el('div', null, el('a', { href: e.resumen }, 'Resumen de esa versión (texto)')) : null));
    return el('div', { class: 'arch-ver', id: 'archivo-versiones' },
      el('h3', null, 'Ediciones publicadas y conservadas'),
      el('p', { class: 'narr' }, V.nota || 'Cada edición publicada sigue accesible tal como salió, con sus datos y su huella (SHA-256), para poder comprobar qué se publicó en cada fecha.'),
      el('div', { class: 'tw' }, el('table', { class: 'tb' }, el('thead', null, el('tr', null, el('th', null, 'Edición'), el('th', null, 'Qué es'), el('th', null, 'Ficheros y huella'))), el('tbody', null, V.ediciones.map(fila)))),
      V.noPublicadas ? el('p', { class: 'narr' }, el('b', null, 'No publicadas: '), V.noPublicadas.texto, V.noPublicadas.enlace ? [' ', el('a', { href: V.noPublicadas.enlace }, V.noPublicadas.enlaceT || 'Ver')] : null) : null,
      el('p', { class: 'muted', style: 'font-size:12.5px' }, 'Para comprobar una huella: descarga el fichero y calcula su SHA-256 (en Windows, «certutil -hashfile fichero SHA256»; en Linux y macOS, «sha256sum fichero»).'));
  }

  window.CASO = { chips, etiquetas, resumenCasos, ficha, versiones, dia, diaHora };
})();
