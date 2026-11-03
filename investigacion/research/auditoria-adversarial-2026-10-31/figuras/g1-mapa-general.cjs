'use strict';
const { Grafo } = require('./lib.cjs');
const OUT = 'C:/EquipoIA/docs/grafos-revisados';
const g = new Grafo({ cadenaDef: 'TRON', cadenaImg: 'TRON + ETHEREUM (dos cadenas)', w: 3300, h: 1300, titulo: 'Portada · El robo a Binance del 29-oct-2026 — mapa general (Ethereum y TRON)', sub: 'Qué se congeló, qué escapó y dónde está hoy (31-oct, 10:17 UTC). Cada bloque remite a su imagen de detalle (1/4 a 4/4). Importes en M$ con ETH a 2.253 $ y TRX a 0,352 $.', pie: 'Fuente: informes del 30 y 31-oct (INFORME-COMPLETO, INFORME-TRAZABILIDAD, HISTORIA-TRON). Las cifras con «estim.» son estimaciones.', legend: [['origen', 'Binance'], ['ladron', 'billetera del ladrón'], ['bloqueada', 'congelado'], ['quieta', 'quieto hoy'], ['nodo', 'en blanqueo (TRON)'], ['casa', 'casa de cambio'], ['puente', 'puente'], ['nuevo', 'posterior a la foto (tramo 3)'], ['nota', 'aviso']] });
g.pagina = 'Portada';
g.region(20, 80, 3260, 1130, '');
const w = m => 1.5 + Math.sqrt(m) * 0.35;

g.node('e0', { cadena: 'ETHEREUM', x: 40, y: 230, kind: 'origen', title: 'ETHEREUM · Binance 14 y 16', lines: ['hot wallets de Binance', '20:24 UTC del 29-oct: «barrido» a una', 'dirección nueva (4 transacciones)'] });
g.node('t0', { x: 40, y: 800, kind: 'origen', title: 'TRON · Binance-Hot 7', lines: ['TDqSquXBgUCLYvYC4XZgrprLK589dkhSCf', '20:20 UTC, 4 minutos antes que Ethereum:', '612,7 M USDT + 46,4 M TRX en 3 envíos'] });
g.node('e1', { cadena: 'ETHEREUM', x: 640, y: 230, kind: 'ladron', title: '0x5227…2f8c', lines: ['recibe 1.875 M USDT + 823 M USDC', '+ 196.138 ETH + 61 tokens'] });
g.node('t1', { x: 640, y: 800, kind: 'ladron', title: 'TG5iBMQ… (1.ª billetera)', lines: ['recibe 612,7 M USDT + 46,4 M TRX', 'cambia 234 M USDT por 638,19 M TRX'] });

// Ethereum
g.node('ef', { cadena: 'ETHEREUM', x: 1280, y: 110, kind: 'bloqueada', title: 'ETH · CONGELADO', lines: ['USDT 1.380 M (Tether) · USDC 823 M (Circle)', 'XAUt, USD1, PAXG, FDUSD (otros emisores)', 'RLUSD 88,5 M: Ripple no llegó'] });
g.node('eq', { cadena: 'ETHEREUM', x: 1280, y: 300, kind: 'quieta', title: 'ETH · 508.854 ETH QUIETOS ≈ 1.147 M$', lines: ['7 billeteras, sin ningún movimiento desde el 30-oct', 'no se puede congelar; solo vigilar'] });
g.node('ea', { cadena: 'ARBITRUM', x: 1280, y: 430, kind: 'quieta', title: 'ETH · 8.426 ETH + 74,56 M ARB en Arbitrum', lines: ['≈ 19 M$ en 0x…0da0, sin salidas'] });
g.edge('e0', 'e1', { color: '#c9a100', w: 6, label: [{ t: '≈ 2.700 M$ en stablecoins + 196 k ETH', b: true }], at: 0.5 });
g.edge('e1', 'ef', { sa: 'r:0.2', sb: 'l', color: '#6b1d1d', w: 5, k: 150, label: ['congelado en la dirección', '(21:01–22:30)'], at: 0.5 });
g.edge('e1', 'eq', { sa: 'r:0.5', sb: 'l', color: '#e07b00', w: 6, k: 150, label: ['vendido a ETH y consolidado'], at: 0.5 });
g.edge('e1', 'ea', { sa: 'r:0.8', sb: 'l', color: '#4c5fd1', w: 3, k: 150, dash: true, at: 0.5 });
g.node('ref', { cadena: '', x: 1900, y: 330, kind: 'cifra', title: 'Detalle: imagen 4/4 (Ethereum)', lines: ['700 M USDT: 435 M a ETH, 205 M congelados, 60 M en Aave', '14 billeteras auxiliares venden los otros 61 tokens', '9 salidas de tokens menores el 31-oct (los avisos de ETH)'] });

// TRON
g.node('tf', { x: 1280, y: 700, kind: 'bloqueada', title: 'TRON · CONGELADO: 378,7 M USDT', lines: ['TG5iBMQ… 312,7 M (21:09) · TCzBTk… 66 M (21:21)', 'el 61,8 % del USDT robado'] });
g.node('te', { x: 1280, y: 880, kind: 'ladron', title: 'TRON · ESCAPÓ ≈ 241 M$ (684,6 M TRX)', lines: ['TSpe5HC3… lo aparca 13 horas y lo reparte', 'en 5 depósitos el 30-oct (10:15–10:20 UTC)', '→ detalle: imagen 1/4'] });
g.edge('t0', 't1', { color: '#c9a100', w: 4, label: [{ t: '20:20–20:22 · 612,7 M USDT + 46,4 M TRX', b: true }], at: 0.5 });
g.edge('t1', 'tf', { sa: 'r:0.2', sb: 'l', color: '#6b1d1d', w: 5, k: 150, label: ['bloqueado en 2 billeteras'], at: 0.5 });
g.edge('t1', 'te', { sa: 'r:0.8', sb: 'l', color: '#d1453b', w: 6, k: 150, label: ['234 M USDT → TRX + 46,4 M TRX'], at: 0.5 });

g.node('q', { x: 1900, y: 790, kind: 'quieta', title: '97,9 M$ · quietos en 2 depósitos', lines: ['TJajtPqD… 120 M TRX + TKkH2vH6… 158,2 M TRX', 'sin una sola transacción propia'] });
g.node('rp', { x: 1900, y: 910, kind: 'quieta', title: '33,4 M$ · en la billetera de reparto', lines: ['TRBdWq… ≈ 95 M TRX, pendientes de repartir'] });
g.node('rr', { x: 1900, y: 1010, kind: 'nodo', title: '109,4 M$ · ya repartidos por TRBdWq…', lines: ['50,8 M$ hasta las 22:40 UTC del 30-oct (rastreados)', '+ 58,7 M$ desde entonces (5,1 M$ por hora)'] });
g.edge('te', 'q', { sa: 'r:0.2', sb: 'l', color: '#2f6fd1', w: w(97.9), k: 100, label: ['40,6 %'], at: 0.5 });
g.edge('te', 'rp', { sa: 'r:0.5', sb: 'l', color: '#e07b00', w: w(33.4), k: 100, label: ['13,9 %'], at: 0.5 });
g.edge('te', 'rr', { sa: 'r:0.9', sb: 'l', color: '#7b4dc9', w: w(109.3), k: 100, label: ['45,5 %'], at: 0.5 });

g.node('d1', { x: 2560, y: 640, kind: 'nodo', title: '25,3 M$ · nodos de servicio', lines: ['TM8uyBjRKz… 12,2 · grupo del 11-oct 11,9', 'TZG47zhb8k… 0,9 · otros 0,4 (imagen 2/4)'] });
g.node('d2', { x: 2560, y: 760, kind: 'paso', title: '11,2 M$ · retenidos · 5,5 M$ sin explicar', lines: ['1,4 M$ en envíos menores no seguidos'] });
g.node('d3', { x: 2560, y: 860, kind: 'casa', title: '≈ 4,15 M$ · llegaron a casas de cambio (estim.)', lines: ['Bybit 2,2 · OKX 1,0 · Gate 0,7 · otras 0,25', 'ninguna directa desde billeteras de paso'] });
g.node('d4', { cadena: 'TRON ⇄ ETH/ARB', x: 2560, y: 980, kind: 'puente', title: '≈ 3,9 M$ · salieron por el puente USDT0', lines: ['186 envíos, 8,0 M$ brutos → Ethereum y Arbitrum', '3 envíos (157 k$) no han llegado (imagen 3/4)'] });
g.node('d5', { x: 2560, y: 1100, kind: 'prestamo', title: '4,8 M$ · en JustLend (retirables)', lines: [] });
g.node('d6', { x: 2560, y: 1170, kind: 'nuevo', title: '58,7 M$ · RASTREADOS (tramo 3)', lines: ['nodos 51,1 · USDD 7,5 · préstamo 2,4', 'puente 0,2 · retenido 3,6 M$', '(terminales + retenido: +6,2 M$ de más;', '+7,7 M$ contando el polvo)'], badge: undefined });
g.edge('rr', 'd1', { sa: 'r:0.1', sb: 'l', color: '#7b4dc9', w: w(25.3), k: 90, at: 0.5 });
g.edge('rr', 'd2', { sa: 'r:0.3', sb: 'l', color: '#888', w: w(16.7), k: 90, at: 0.5 });
g.edge('rr', 'd3', { sa: 'r:0.5', sb: 'l', color: '#2f9e55', w: w(4.15) + 1, k: 90, at: 0.5 });
g.edge('rr', 'd4', { sa: 'r:0.7', sb: 'l', color: '#1d9a97', w: w(3.9) + 1, k: 90, at: 0.5 });
g.edge('rr', 'd5', { sa: 'r:0.85', sb: 'l', color: '#c2255c', w: w(4.8), k: 90, at: 0.5 });
g.edge('rr', 'd6', { sa: 'r:1', sb: 'l', color: '#0ca678', w: w(58.7), dash: true, k: 90, at: 0.5 });
// bucle puentes
g.node('pe', { cadena: 'ETHEREUM + ARBITRUM', x: 2560, y: 400, kind: 'eth', title: '52 direcciones NUEVAS en Ethereum/Arbitrum', lines: ['no son las del ladrón: reenvían en minutos a Uniswap,', 'THORChain y CoW; origen del resto no determinado (imagen 3/4)', 'THORChain: 1.600 solicitudes con destino TRON (ejecución sin enlazar)'] });
g.edge('d4', 'pe', { sa: 'r', sb: 'r', color: '#1d9a97', dash: true, pts: [[3200, 1010], [3200, 440]], label: ['⇄ TRON → ETHEREUM/ARBITRUM', '168 + 18 envíos por LayerZero', '(y solicitudes de vuelta por THORChain)'], at: 0.5, dx: 0 });
g.note(1900, 560, [{ t: 'Qué se ha perdido de verdad (de lo rastreado)', b: true }, 'No hay una cifra exacta: lo seguro es lo que llegó a una casa de cambio', '(≈ 4,15 M$) y lo que cruzó el puente (1,0–2,3 M$ en el 1.er tramo; los dos tramos se', 'solapan en 8 envíos y no se suman), ambos estimados.', 'La mayor parte (≈ 190 M$) sigue en TRON, quieta o en movimiento.'], { kind: 'nota' });
g.note(40, 560, [{ t: '¿SE MEZCLAN LAS DOS CADENAS?', b: true }, 'Movimientos a la vez en dos cadenas, cada una con sus billeteras (que sea un solo robo es la premisa de los informes).', 'No he encontrado ningún enlace directo entre ellos: ninguna de las 8 direcciones', 'del ladrón en Ethereum recibe dinero del puente de TRON.', 'Solo se tocan en un punto: parte del dinero de TRON cruza a Ethereum y Arbitrum', 'por el puente USDT0 y se solicita volver a TRON por THORChain (imagen 3/4).', 'Dentro de Ethereum, el ETH pasa a Arbitrum con un agregador de puentes (imagen 4/4).'], { kind: 'cifra' });
g.note(40, 1010, [{ t: 'Imágenes de detalle', b: true }, '1/4 · TRON: de Binance al reparto (custodia, hashes, Tether)', '2/4 · TRON: el blanqueo y las casas de cambio', '3/4 · Puentes, THORChain y solicitudes de regreso a TRON', '4/4 · Ethereum: de Binance 14 y 16 a las 7 billeteras'], { kind: 'cifra' });
console.log(g.guardar(OUT, '0-mapa-general', 1.25).ok);
