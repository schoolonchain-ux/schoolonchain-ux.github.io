'use strict';
// Parche 9 (1-nov, Codex R6-01): una billetera ya leída se vuelve a leer, desde antes, si luego se descubre que recibió dinero antes de su ventana de lectura.
const fs = require('fs'); const f = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/traza-tramo3.cjs'; let s = fs.readFileSync(f, 'utf8'); const fallos = [];
const R1 = (a, b, n = 1) => { const k = s.split(a).length - 1; if (k !== n) { fallos.push(k + ' · ' + a.slice(0, 90)); return; } s = s.split(a).join(b); };
// cola principal: también entra la billetera ya leída si la llegada es anterior a su ventana
R1("if (c.tipo === 'billetera' && !proc.has(e.a)) { const x = nuevos.get(e.a) || { desde: e.at };", "if (c.tipo === 'billetera' && (!proc.has(e.a) || (rec[e.a] && e.at < rec[e.a].desde - 120000))) { const x = nuevos.get(e.a) || { desde: e.at };");
R1("if (c.tipo === 'billetera' && !proc.has(o.a)) { const x = nuevos.get(o.a) || { desde: e.at };", "if (c.tipo === 'billetera' && (!proc.has(o.a) || (rec[o.a] && e.at < rec[o.a].desde - 120000))) { const x = nuevos.get(o.a) || { desde: e.at };");
// atajo de lectura guardada: solo si la ventana ya cubre la primera llegada conocida
R1("if (rec[w] && rec[w].ok) { for (const e of rec[w].sal) if (e.v >= SEGUIR_USD) siguiente.push({ w, e }); continue; }", "if (rec[w] && rec[w].ok && info.desde >= rec[w].desde - 120000) { for (const e of rec[w].sal) if (e.v >= SEGUIR_USD) siguiente.push({ w, e }); continue; }");
R1("const r = await leer(w, info.desde - 120000, lectores[k]); rec[w] = { nivel, ...r, desde: info.desde };", "const previa = rec[w]; const desde0 = previa && previa.desde ? Math.min(info.desde, previa.desde) : info.desde; const r = await leer(w, desde0 - 120000, lectores[k]); rec[w] = { nivel: previa && previa.nivel ? previa.nivel : nivel, ...r, desde: desde0, ampliada: previa && previa.ok ? true : undefined };");
fs.writeFileSync(f, s); console.log(fallos.length ? 'NO ENCONTRADOS:\n' + fallos.join('\n') : 'ok');
