// Ordena las tarjetas del índice POR TEMA según indice-temas.json (escrito a mano). Lo usa indice.cjs.
// Entra: las tarjetas tal como salen de recorrer la web ({ t, desc, u, foto }) y las investigaciones. Sale: { temas, avisos }.
// - Cada función va en un solo tema, con el título, la frase y el «dónde está» que dice indice-temas.json.
// - Una función de la web que no esté en ese fichero va al tema «Sin clasificar» (al final), con su título de la web, y se avisa.
// - Una función del fichero que ya no esté en la web se avisa (y no sale).
'use strict';
function organizar(tarjetas, investigaciones, conf) {
  const avisos = [], porTema = new Map(conf.temas.map((t) => [t.id, []])), vistas = new Set(), sueltas = [];
  for (const c of tarjetas) {
    const f = conf.funciones[c.u]; vistas.add(c.u);
    if (f && f.oculta) continue;
    if (!f || !porTema.has(f.tema)) { sueltas.push({ t: c.t, et: 'Sin clasificar', desc: c.desc || '', u: c.u, foto: c.foto }); avisos.push('función sin clasificar en indice-temas.json: ' + c.u + ' («' + c.t + '»)'); continue; }
    porTema.get(f.tema).push({ grupo: f.grupo || '', orden: Object.keys(conf.funciones).indexOf(c.u), t: f.t, et: f.lugar || '', desc: f.desc || '', u: c.u, foto: c.foto });
  }
  for (const [u, f] of Object.entries(conf.funciones)) if (!f.oculta && !vistas.has(u)) avisos.push('función de indice-temas.json que ya no está en la web: ' + u);
  const temas = [];
  for (const t of conf.temas) {
    const ts = porTema.get(t.id).sort((a, b) => a.orden - b.orden), grupos = [];
    for (const c of ts) { let g = grupos.find((x) => x.nombre === c.grupo); if (!g) { g = { nombre: c.grupo, tarjetas: [] }; grupos.push(g); } const { grupo, orden, ...resto } = c; g.tarjetas.push(resto); }
    const tema = { id: t.id, nombre: t.nombre, desc: t.desc || '', grupos };
    if (t.investigaciones) tema.investigaciones = investigaciones;
    if (grupos.length || (tema.investigaciones && tema.investigaciones.length)) temas.push(tema);
  }
  if (sueltas.length) temas.push({ id: 'sin-clasificar', nombre: 'Sin clasificar', desc: 'Funciones nuevas de la web que todavía no están colocadas en su tema.', grupos: [{ nombre: '', tarjetas: sueltas }] });
  return { temas, avisos, sinClasificar: sueltas.length, clasificadas: [...porTema.values()].reduce((n, a) => n + a.length, 0) };
}
module.exports = { organizar };
