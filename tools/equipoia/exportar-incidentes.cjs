/* Exporta a la web la base de hackeos documentados (los incidentes que ya usa el bot @blacklistusdtbot) en un formato compacto:
   data/incidentes-defi.json del repositorio público. Lo lee la zona «Comprobar» para decir si una dirección aparece como participante de un hackeo.
   Es una base FIJA (la revisa el propietario a mano, última revisión indicada en el propio fichero): no se refresca sola.
   Uso:  node exportar-incidentes.cjs [ruta_salida]
   Solo lee tether-blacklist/config/incidents.json y escribe un fichero; no toca red ni claves. La fuente original es DeFiHackLabs (SunWeb3Sec, licencia MIT). */
const fs = require('fs');
const path = require('path');
const origen = path.resolve(__dirname, '..', '..', 'tether-blacklist', 'config', 'incidents.json');
const salida = path.resolve(process.argv[2] || path.join(__dirname, '..', 'repo', 'data', 'incidentes-defi.json'));
const base = JSON.parse(fs.readFileSync(origen, 'utf8'));
if (!Array.isArray(base.incidents) || base.incidents.length < 100) throw new Error('la base de incidentes parece vacía o rota (' + (base.incidents || []).length + ')');

const roles = []; const incidentes = []; const direcciones = {}; const redes = {};
base.incidents.forEach((inc, i) => {
  redes[inc.network] = (redes[inc.network] || 0) + 1;
  incidentes.push({ id: inc.id, n: inc.name, f: inc.date, r: inc.network, s: inc.source, p: inc.loss || null });
  for (const a of inc.addresses || []) {
    const dir = String(a.address || '').toLowerCase(); if (!/^0x[0-9a-f]{40}$/.test(dir)) continue;
    let k = roles.indexOf(a.role); if (k < 0) { roles.push(a.role); k = roles.length - 1; }
    (direcciones[dir] = direcciones[dir] || []).push([i, k]);
  }
});
const doc = {
  version: 1,
  revisadoEn: base.reviewedAt,
  fuente: 'DeFiHackLabs (SunWeb3Sec, licencia MIT), recopilada por EquipoIA',
  nota: 'Lista fija de hackeos documentados. Solo cubre ' + Object.keys(redes).join(' y ') + '. Que una dirección no aparezca no demuestra que esté limpia.',
  n: incidentes.length, redes, roles, incidentes, direcciones,
};
fs.mkdirSync(path.dirname(salida), { recursive: true });
fs.writeFileSync(salida, JSON.stringify(doc));
console.log('escrito', salida, '·', incidentes.length, 'incidentes ·', Object.keys(direcciones).length, 'direcciones ·', fs.statSync(salida).size, 'bytes');
