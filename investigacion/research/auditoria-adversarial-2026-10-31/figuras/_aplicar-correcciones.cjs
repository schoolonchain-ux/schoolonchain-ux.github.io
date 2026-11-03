'use strict';
// Aplica a las COPIAS de los guiones de las figuras las correcciones de la auditoría adversarial (no toca los originales en research/binance-0x5227-2026-10-30/grafos).
const fs = require('fs'); const dir = __dirname + '/'; const fallos = [];
const mk = f => { let s = fs.readFileSync(dir + f, 'utf8'); return { R(a, b) { const n = s.split(a).length - 1; if (n < 1) { fallos.push(f + ' · ' + a.slice(0, 80)); return; } s = s.split(a).join(b); }, save() { fs.writeFileSync(dir + f, s); } }; };
const G = ['g1-mapa-general.cjs', 'g2-custodia-tron.cjs', 'g3-blanqueo-tron.cjs', 'g4-puentes.cjs', 'g5-ethereum.cjs'].map(mk);
const [g1, g2, g3, g4, g5] = G;
for (const g of G) g.R("const OUT = 'C:/EquipoIA/docs/grafos';", "const OUT = 'C:/EquipoIA/docs/grafos-revisados';");
// ---- portada
g1.R("THORChain y CoW; mezclan dinero ajeno (imagen 3/4)", "THORChain y CoW; origen del resto no determinado (imagen 3/4)");
g1.R("'THORChain devuelve 1.580 operaciones a 11 direcciones TRON'", "'THORChain: 1.600 solicitudes con destino TRON (ejecución sin enlazar)'");
g1.R("(y vuelta por THORChain)", "(y solicitudes de vuelta por THORChain)");
g1.R("Es el mismo robo ejecutado a la vez en dos cadenas, cada una con sus billeteras.", "Movimientos a la vez en dos cadenas, cada una con sus billeteras (que sea un solo robo es la premisa de los informes).");
g1.R("por el puente USDT0 y vuelve a TRON por THORChain (imagen 3/4).", "por el puente USDT0 y se solicita volver a TRON por THORChain (imagen 3/4).");
g1.R("'(≈ 4,2 M$) y lo que cruzó el puente (≈ 3,9 M$), ambos estimados.'", "'(≈ 4,15 M$) y lo que cruzó el puente (1,0–2,3 M$ en el 1.er tramo; los dos tramos se', 'solapan en 8 envíos y no se suman), ambos estimados.'");
g1.R("3/4 · Puentes, THORChain, THORChain y regreso a TRON", "3/4 · Puentes, THORChain y solicitudes de regreso a TRON");
// ---- 2/4
g3.R("title: 'DESPUÉS de la foto (22:41 → 10:11 UTC)'", "title: 'DESPUÉS de la foto (22:41 → 10:11:59 UTC)'");
g3.R("label: [{ t: '22:41 → 10:11 · 352 envíos', b: true }, '58,5 M$']", "label: [{ t: '22:41 → 10:11:59 · 353 envíos', b: true }, '58,7 M$']");
g3.R("lines: ['cambios sin decodificar, diferencias de precio', 'TRX/USDT y entradas ajenas pequeñas']", "lines: ['residuo del método (5,2–5,5 M$); su composición', 'no está demostrada ni medida por causas']");
g3.R("'2,35 M$ · 30 envíos'", "'2,35 M$ (1,0–2,3 según modelo) · 30 envíos'");
g3.R("hipótesis: infraestructura del blanqueo (no probado)", "creación y fondeo próximos (coordinación inferida); actividad previa al robo");
g3.R("AQUÍ SE DETIENE EL RASTREO: mezcla dinero ajeno", "AQUÍ SE DETIENE EL RASTREO: entradas de origen no determinado");
g3.R("title: 'Billeteras de depósito de un solo uso', lines: ['casi seguro direcciones de depósito de clientes', 'de cada casa · 249 envíos, 12,5 M$ brutos', 'pureza del 16 al 74 % (todo pasó antes por el grupo)',", "title: 'Billeteras que envían a la casa (titular desconocido)', lines: ['hipótesis: depósitos de clientes (no confirmado; algunas', 'tienen miles de operaciones y muchos remitentes)', '249 envíos, 12,5 M$ brutos · pureza de 0,006 a 0,806',");
g3.R("'UsdtOFT 1,60 M$ · Rango y Bridgers 0,14 M$ → imagen 3/4'", "'UsdtOFT 1,60 M$ · Rango y Bridgers 0,14 M$ (se solapa con el 1.er tramo) → 3/4'");
g3.R("{ t: 'Ninguna billetera de paso envía directo a una casa', b: true }, 'Siempre pasa antes por un nodo de servicio.',", "{ t: 'En el 1.er tramo ninguna billetera de paso envía directo a una casa', b: true }, 'Las llegadas a casas están todas en el 2.º tramo.',");
g3.R("'ya mezcla dinero ajeno (pureza del 65 al 81 %).', 'No se da un total de «retenido» para el tramo 2.'", "'recibe entradas no atribuidas al recorrido (pureza del 65 al 81 %).', 'No se da un total de «retenido» para el tramo 2.', '420 direcciones sin leer (≈ 10,7 M$ atribuidos en el tramo 2).'");
g3.R("'Abajo a la izquierda: lo posterior a la foto, aún sin rastrear.'", "'Abajo a la izquierda: lo posterior a la foto (rastreo a fondo: ver tramo 3).'");
// ---- 3/4
g4.R("'primer tramo 2,35 M$ + segundo tramo 1,60 M$', '+ lo posterior a la foto (35 envíos)', { t: 'dentro del rastreo: 149 envíos, ≈ 3,9 M$ del robo', b: true }", "'atribuido: tramo 1 rango 1,0–2,3 M$ · tramo 2 1,60 M$', 'los dos tramos comparten 8 envíos: no se suman', { t: '37 envíos «solo vigilante» sin tramo asignado', b: true }");
g4.R("pero solo 7,8 M$ vienen de TRON: mezclan dinero ajeno.", "pero solo 7,8 M$ vienen de TRON; el origen del resto no se ha determinado.");
g4.R("Es otra forma de romper el rastro: sale, se cambia y entra por direcciones nuevas.", "Posible forma de romper el rastro: sale, se cambia y entra por direcciones nuevas.");
g4.R("2. THORChain · Ethereum → TRON (1.580 operaciones). Una dirección de Ethereum paga al router; el memo «=:tr:<dirección TRON>»", "2. THORChain · Ethereum → TRON (1.600 solicitudes). Una dirección de Ethereum paga al router; el memo «=:tr:<dirección TRON>»");
g4.R("dice a quién se paga en TRON.", "pide pagar en TRON (la ejecución no está enlazada).");
g4.R("titulo: '3/4 · Los puentes: del dinero que sale de TRON a Ethereum, Arbitrum y de vuelta a TRON'", "titulo: '3/4 · Los puentes: del dinero que sale de TRON a Ethereum y Arbitrum, y solicitudes de vuelta a TRON'");
for (const g of G) g.save();
console.log(fallos.length ? 'NO ENCONTRADOS:\n' + fallos.join('\n') : 'todas las correcciones aplicadas');
