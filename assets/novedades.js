/* Novedades del sitio: lee data/novedades.json (cada publicación o ampliación añade allí una entrada) y pinta listas y líneas de «última actualización».
   Lo usan la portada (todas las novedades y la última de cada caso) y las páginas de caso (las suyas). Nada aquí es texto fijo: si el fichero no se puede leer, no se pinta nada. */
(function () {
  const { el } = window.C;
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const DIA = 86400000;
  let cache = null;
  async function cargar() {
    if (cache) return cache;
    try { const d = await (await fetch('data/novedades.json', { cache: 'no-cache' })).json(); cache = (d.novedades || []).filter((n) => n && n.fecha && n.titulo).sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha)); }
    catch (e) { cache = []; }
    return cache;
  }
  const fecha = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.getUTCDate() + ' ' + MES[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
  const hora = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0') + ' UTC'; };
  const reciente = (iso, dias = 7) => Date.now() - Date.parse(iso) < dias * DIA;
  // Una línea: «Actualizado 4 nov 2026 · título» con la etiqueta NUEVO si tiene menos de 7 días.
  function linea(n, { enlace = true } = {}) {
    const t = enlace && n.url ? el('a', { class: 'nov-t', href: n.url }, n.titulo) : el('span', { class: 'nov-t' }, n.titulo);
    return el('div', { class: 'nov-linea' }, reciente(n.fecha) ? el('span', { class: 'nov-nuevo' }, 'NUEVO') : null, el('span', { class: 'nov-fecha' }, 'Actualizado ' + fecha(n.fecha)), t);
  }
  // Lista (caja) con las últimas novedades, opcionalmente solo de un caso.
  function lista(novedades, { caso = null, limite = 6, titulo = 'Novedades', nombres = {} } = {}) {
    const xs = novedades.filter((n) => !caso || n.caso === caso).slice(0, limite);
    if (!xs.length) return null;
    const box = el('section', { class: 'novedades' }, el('h2', null, titulo));
    for (const n of xs) box.append(el('div', { class: 'nov-item' },
      el('div', { class: 'nov-cuando' }, reciente(n.fecha) ? el('span', { class: 'nov-nuevo' }, 'NUEVO') : null, el('b', null, fecha(n.fecha)), el('span', { class: 'nov-hora' }, hora(n.fecha))),
      el('div', { class: 'nov-que' }, !caso && nombres[n.caso] ? el('span', { class: 'nov-caso' }, nombres[n.caso]) : null, n.url ? el('a', { href: n.url }, n.titulo) : el('span', null, n.titulo))));
    return box;
  }
  window.NOVEDADES = { cargar, linea, lista, fecha, hora, reciente };
})();
