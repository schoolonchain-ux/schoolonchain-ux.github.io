/* Página «Novedades y canal RSS»: pinta la lista completa de novedades (data/novedades.json, vía assets/novedades.js) y el botón de copiar la dirección del canal.
   Nada aquí es texto fijo de datos: si el registro de novedades no se puede leer, se dice. */
document.addEventListener('DOMContentLoaded', async () => {
  const destino = document.getElementById('novedades-lista');
  const b = document.getElementById('copiar-rss');
  if (b) b.addEventListener('click', () => {
    const u = b.getAttribute('data-url'); const ok = () => { b.textContent = 'Copiada'; setTimeout(() => { b.textContent = 'Copiar la dirección'; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(ok, () => window.prompt('Copia esta dirección:', u));
    else window.prompt('Copia esta dirección:', u);
  });
  if (!destino) return;
  try {
    const NOV = window.NOVEDADES ? await window.NOVEDADES.cargar() : [];
    let nombres = { portada: 'Portada', herramientas: 'Herramientas', fundamentales: 'Fundamentales' };
    try { const idx = await (await fetch('reports/index.json', { cache: 'no-cache' })).json(); for (const r of idx.informes || []) nombres[r.slug] = r.caso || r.titulo; } catch (e) { /* sin nombres de caso */ }
    const caja = NOV.length ? window.NOVEDADES.lista(NOV, { limite: 200, titulo: 'Novedades · todas, de la más reciente a la más antigua', nombres }) : null;
    destino.replaceChildren(...(caja ? [caja] : []));
    if (!caja) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'No se ha podido leer el registro de novedades ahora mismo.'; destino.append(p); }
  } catch (e) {
    destino.textContent = 'No se ha podido leer el registro de novedades ahora mismo.';
  }
});
