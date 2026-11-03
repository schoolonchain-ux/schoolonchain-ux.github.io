'use strict';
const { Grafo } = require('./lib.cjs');
const OUT = 'C:/EquipoIA/docs/grafos-revisados';
const H = t => ({ t, c: '#888' });
const g = new Grafo({ cadenaDef: 'TRON', cadenaImg: 'TRON', w: 3560, h: 1330, titulo: '2/4 · TRON — El blanqueo: de la billetera de reparto a los destinos (a las 22:40 UTC del 30-oct) y lo posterior', sub: 'Rastreo billetera por billetera, sin tope de saltos. Importes = parte del robo (mezcla proporcional). El grosor de la flecha es proporcional al importe. TRX a 0,352 $.', pie: 'Fuente: TronGrid y TronScan; rastreo del 31-oct (traza*.cjs). Las cifras del tramo 2 son estimaciones.', legend: [['reparto', 'reparto'], ['paso', 'billeteras de paso'], ['nodo', 'nodo de servicio'], ['casa', 'casa de cambio'], ['prestamo', 'préstamo'], ['puente', 'puente a otra cadena'], ['contrato', 'conversión'], ['nuevo', 'dato posterior a la foto'], ['nota', 'límite / aviso']] });
g.pagina = '2/4';
g.region(20, 80, 3520, 1150, '');
const w = m => 1.5 + Math.sqrt(m) * 0.95;   // grosor según M$

g.node('trb', { x: 40, y: 560, kind: 'reparto', title: 'TRBdWq… · reparto', lines: ['TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki', 'recibe 406,4 M TRX en total', 'hoy conserva ≈ 95 M TRX', 'reparte en trozos de 200.000 a 500.000 TRX'] });
g.node('paso', { x: 560, y: 470, kind: 'paso', title: '1.347 billeteras de paso · 18 niveles', lines: ['billeteras de un solo uso que reenvían en horas', 'cambian TRX↔USDT en SunSwap, BWSwapRouterV1,', 'UniversalRouter, MetaRouterGateway (el cambio', 'manda el resultado a OTRA billetera)', { t: 'billeteras por nivel: 1 · 122 · 299 · 480 · 230 · 74 · 48 ·', c: '#666' }, { t: '33 · 16 · 12 · 10 · 7 · 6 · 4 · 2 · 1 · 1 · 1', c: '#666' }, 'solo siguen envíos de ≥ 10.000 TRX (3.520 $)'] });
g.node('post', { x: 40, y: 880, kind: 'nuevo', title: 'DESPUÉS de la foto (22:41 → 10:11:59 UTC)', lines: ['353 envíos · 166,6 M TRX = 58,7 M$ · 49 billeteras', 'ritmo: 5,1 M$ por hora', 'mayores: THMg4J1sytc6fgFZwqTgiiWJYwyWc3YpYk 6,8 M$', 'TB3viNboTwfjZ5ohzHjSBxwSRr6T6duU5b 6,8 M$', 'TXSt1DTjju4UQxeNo5s6yxz1cjx7698Rmd 6,5 M$', { t: 'RASTREO A FONDO (tramo 3, hasta 17:20 UTC del 31-oct)', b: true, c: '#0b7285' }, '4.481 billeteras leídas, 0 lecturas fallidas', 'llegadas: nodos 51,1 · USDD 7,5 · préstamo 2,4 · puente 0,2 M$', 'retenido 3,6 M$ · el modelo suma 6,2 M$ de más (7,7 con polvo)'], badge: 'tramo 3', badgeBg: '#0b7285' });

// destinos del tramo 1 (columna C)
const X1 = 1560;
g.node('tm8', { x: X1, y: 110, kind: 'nodo', title: 'TM8uyBjRKz… · receptor de los cambios', lines: ['TM8uyBjRKzFtQdMC7tQLvKeeWieaFvXDyc · 23.900 operaciones', 'recibe el resultado de cambios hechos en BWSwapRouterV1', 'desde 371 billeteras · el 93 % de lo que sale va a TZG47zhb8k…'] });
g.node('grp', { x: X1, y: 270, kind: 'nodo', title: "Grupo del 11-oct · 5 billeteras creadas en 84 s", lines: ["THPaGKe6aZkUcNht24hcscZPLwtcJAbpun","TGSNahJvAdh86aR5pdcxiep1mBWSRK3HHL","TBAPnuwEht65McDbxDvDYs2XLRSSbYQMUM","TLKfB2goHRY1SykEpVbiGdsesACrkCxCeW","TH1YKH9MUuJtDmekPia4x9fZXAcpPrMv8B","8.400–9.300 operaciones cada una (23:35:09–23:36:33 UTC)","creación y fondeo próximos (coordinación inferida); actividad previa al robo"] });
g.node('ret', { x: X1, y: 460, kind: 'paso', title: 'Retenido en billeteras del recorrido', lines: ['TRBdWq… 7,79 M$ · 11 billeteras con 0,1–1 M$: 2,35 M$', '23 con 10.000–100.000 $: 0,91 M$ · 1.063 menores: 0,12 M$'] });
g.node('jl', { x: X1, y: 580, kind: 'prestamo', title: 'JustLend · CErc20Delegator', lines: ['TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd', 'depósito de USDT por 74 billeteras (retirable)'] });
g.node('pu', { x: X1, y: 700, cadena: 'TRON ⇄ ETH/ARB', kind: 'puente', title: 'Puente USDT0 · UsdtOFT', lines: ['TFG4wBaDQ8sHWWP1ACeSGnoNR6RRzevLPt', '30 envíos de 19 billeteras → imagen 3/4'] });
g.node('nod', { x: X1, y: 820, kind: 'nodo', title: "Otros nodos de servicio", lines: ["TZG47zhb8kcriWQ2rE719yHs1KqgzwMrvF  0,91 M$ (317.000 ops)","TKfz7Pu3jtxWrfHzVeozQjXsb3RfuUHGE2  0,17","TX5XiRXdyz7sdFwF5mnhT1QoGCpbkncpke  0,13","TCPPRajgXVBkR5Qvpd3RHh4xUvibhzrqSa  0,11","TMXawuHt4RoYUQ9pynNsyzqpTxxxLKZHsY  0,004"] });
g.node('usdd', { x: X1, y: 940, kind: 'contrato', title: "USDD · AuthGemJoin5 / Bridgers", lines: ["TSUYvQ5tdd3DijCD1uGunGLpftHuSZ12sQ (USDD)","BridgersSwap TSVLdWvSWK2z8uQ1P1kwGvNLvLvwNRb15Y","Bridgers TJ4KeiGTvTX4wRUgLARiwr8rGLaurmVkdZ","2 envíos de Bridgers, 0,008 M$"] });
g.node('men', { x: X1, y: 1060, kind: 'nota', title: 'Envíos menores de 10.000 TRX: 1,4 M$ (3 %)', lines: ['no se siguen: se cuentan aparte'] });
g.node('sin', { x: X1, y: 1160, kind: 'nota', title: 'SIN EXPLICAR: 5,5 M$ (11 %)', lines: ['residuo del método (5,2–5,5 M$); su composición', 'no está demostrada ni medida por causas'] });

g.edge('trb', 'paso', { sa: 'r', sb: 'l', color: '#e07b00', w: 6, label: [{ t: '02:19 → 22:40 UTC · 379 envíos', b: true }, '50,8 M$ · 122 billeteras'], at: 0.5 });
g.edge('trb', 'post', { sa: 'b', sb: 't', color: '#0ca678', w: 5, dash: true, label: [{ t: '22:41 → 10:11:59 · 353 envíos', b: true }, '58,7 M$'], dx: 105 });
const ds = [['tm8', 'tm8:l:0.5', 12.16, '12,16 M$ · 1.069 envíos', '#7b4dc9'], ['grp', 'grp:l:0.5', 11.85, '11,85 M$ · 603 envíos', '#7b4dc9'], ['ret', 'ret:l:0.5', 11.2, '11,2 M$ retenidos', '#888'], ['jl', 'jl:l:0.5', 4.75, '4,75 M$ · 117 envíos', '#c2255c'], ['pu', 'pu:l:0.5', 2.35, '2,35 M$ (1,0–2,3 según modelo) · 30 envíos', '#1d9a97'], ['nod', 'nod:l:0.5', 1.32, '1,32 M$ · 224 envíos', '#7b4dc9'], ['usdd', 'usdd:l:0.5', 0.34, '0,34 M$', '#888'], ['men', 'men:l:0.5', 1.4, '1,4 M$', '#bbb'], ['sin', 'sin:l:0.5', 5.5, '5,5 M$', '#d9b800']];
for (const [id, b, m, lab, c] of ds) g.edge('paso', b, { sa: 'r', color: c, w: w(m), k: 200, label: [lab], at: 0.78 });

// tramo 2 (columna D y E)
const X2 = 2520;
g.node('tz', { x: X2, y: 110, kind: 'nodo', title: 'TZG47zhb8k… · mayor nodo receptor observado', lines: ['TZG47zhb8kcriWQ2rE719yHs1KqgzwMrvF', 'creada 23-dic-2025 · 317.000 operaciones', 'recibe 11,44 M$ (estim.) en 1.050 envíos: 96 % de TM8uy…', 'AQUÍ SE DETIENE EL RASTREO: entradas de origen no determinado'] });
g.node('dep', { x: X2, y: 300, kind: 'paso', title: 'Billeteras que envían a la casa (titular desconocido)', lines: ['hipótesis: depósitos de clientes (no confirmado; algunas', 'tienen miles de operaciones y muchos remitentes)', '249 envíos, 12,5 M$ brutos · pureza de 0,006 a 0,806', 'ej.: TXYiPCELFdqELhQ4vGhniwJeNqEjruZCKv → Bybit, 31 envíos'] });
g.node('o2', { x: X2, y: 540, kind: 'nodo', title: "Otros nodos de servicio (tramo 2)", lines: ["TLQh52eDXwkHyWLQLmQzSoW4shogGKwjow  3,44 M$","TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2  0,96","TQ5SdemHpBawdb31DiwcwSVMQB7iduXgSu  0,79","otros 480 nodos: 6,2 M$"] });
g.node('p2', { x: X2, y: 680, cadena: 'TRON ⇄ otras', kind: 'puente', title: 'Puentes (tramo 2)', lines: ['UsdtOFT 1,60 M$ · Rango y Bridgers 0,14 M$ (se solapa con el 1.er tramo) → 3/4'] });
g.node('u2', { x: X2, y: 780, kind: 'contrato', title: 'USDD 0,22 M$ · JustLend 0,06 M$', lines: [] });
g.edge('tm8', 'tz', { sa: 'r', sb: 'l', color: '#7b4dc9', w: w(11.4), label: [{ t: '93 % de lo que sale', b: true }, '11,44 M$ (estim.)'], at: 0.5 });
g.edge('tm8', 'dep:l:0.15', { sa: 'r:0.8', color: '#2f9e55', w: 3, k: 150, label: ['de TM8uy… y del grupo salen', 'los ≈ 24 M$ de este tramo'], at: 0.5 });
g.edge('grp', 'dep', { sa: 'r', sb: 'l:0.6', color: '#2f9e55', w: 4, k: 150, label: ['trozos de unos 100.000 USDT', 'a billeteras nuevas'], at: 0.5 });
g.edge('grp', 'o2', { sa: 'r:0.9', sb: 'l', color: '#7b4dc9', w: w(10.4), k: 150, label: ['10,4 M$ (estim.)'], at: 0.6 });
g.edge('grp', 'p2', { sa: 'r:0.95', sb: 'l', color: '#1d9a97', w: 3, k: 120, label: ['1,74 M$'], at: 0.7 });
g.edge('grp', 'u2', { sa: 'b:0.9', sb: 'l', color: '#888', w: 2, k: 100, label: ['0,28 M$'], at: 0.7 });

// casas de cambio
const X3 = 3170, ys = 130;
const casas = [['bb', 'Bybit', 'TU4vEruvZwLLkSfV9bNw12EJTPvNr7Pvaa', '2,21 M$ · 87 envíos'], ['ok', 'OKX Hot Wallet 8', 'TLaGjwhvA8XQYSxFAcAXy7Dvuue9eGYitv', '0,95 M$ · 120 envíos'], ['ga', 'Gate', 'TBA6CypYJizwA9XdC7Ubgc5F1bxrQ7SqPt', '0,74 M$ · 19 envíos'], ['ku', 'Kucoin 4', 'TUpHuDkiCCmwaTZBHZvQdwWzGNm5t8J2b9', '0,14 M$ · 6 envíos'], ['bg', 'Bitget 9', 'TJ7hhYhVhaxNx6BPyq7yFpqZrQULL3JSdb', '0,08 M$ · 9 envíos'], ['mx', 'MXC', 'TEPSrSYPDSQ7yXpMFPq91Fb1QEWpMkRGfn', '0,02 M$ · 6 envíos'], ['kr', 'Kraken Hot Wallet', 'TG2CMGxnTPgQ6V58kiKd7wbyN8ewtAmY76', '0,005 M$ · 2 envíos']];
casas.forEach(([id, n, a, l], i) => { g.node(id, { x: X3, y: ys + i * 112, kind: 'casa', title: n, lines: [a, { t: l, b: true }] }); });
const mm = { bb: 2.21, ok: 0.95, ga: 0.74, ku: 0.14, bg: 0.08, mx: 0.02, kr: 0.005 };
casas.forEach(([id, , , l], i) => g.edge('dep', id, { sa: 'r', sb: 'l', color: '#2f9e55', w: 1.6 + Math.sqrt(mm[id]) * 2.5, k: 100, label: i === 0 ? [{ t: 'total ≈ 4,15 M$ del robo (estim.)', b: true }, '249 envíos a 7 casas'] : null, at: 0.22 }));

g.note(3170, 930, [{ t: 'Billeteras de paso (1.er tramo):', b: true }, 'ninguna envía directo a una casa.', 'Las llegadas a casas están en el 2.º tramo.', 'Las casas pueden identificar al cliente', 'y congelar lo que llega a su depósito.'], { kind: 'cifra' });
g.note(2520, 880, [{ t: 'Cautela', b: true }, 'Las cifras de este tramo son estimaciones: el grupo del 11-oct', 'recibe entradas no atribuidas al recorrido (pureza del 65 al 81 %).', 'No se da un total de «retenido» para el tramo 2.', '420 direcciones sin leer (≈ 10,7 M$ atribuidos en el tramo 2).'], { kind: 'nota' });
g.note(560, 780, [{ t: 'Cómo leer el mapa', b: true }, 'Izquierda: el reparto. Centro: adónde acaba el dinero a las 22:40 del 30-oct.', 'Derecha: de los nodos mayores a las casas de cambio (segundo tramo).', 'Abajo a la izquierda: lo posterior a la foto (rastreo a fondo: ver tramo 3).'], { kind: 'cifra' });
console.log(g.guardar(OUT, '2de4-blanqueo-tron', 1.3).ok);
