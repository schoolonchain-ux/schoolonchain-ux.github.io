'use strict';
const { Grafo } = require('./lib.cjs');
const OUT = 'C:/EquipoIA/docs/grafos-revisados';
const H = t => ({ t, c: '#888' });   // línea de hash en gris
const g = new Grafo({ cadenaDef: 'TRON', cadenaImg: 'TRON', w: 2900, h: 1290, titulo: '1/4 · TRON — De Binance al reparto (29-oct a 31-oct 2026)', sub: 'Cadena de custodia con nombres, hashes, eventos de Tether y estado a las 10:17 UTC del 31-oct. Horas UTC. Los hashes van abreviados; completos en el informe.', pie: 'Fuente: TronGrid y TronScan (auditados el 31-oct). TRX a 0,352 $.', legend: [['origen', 'Binance'], ['ladron', 'billetera del ladrón'], ['bloqueada', 'congelada por Tether'], ['contrato', 'contrato / DEX'], ['paso', 'depósito vaciado'], ['quieta', 'TRX quieto'], ['reparto', 'billetera de reparto'], ['nota', 'evento / nota']] });
g.pagina = '1/4';
g.region(20, 80, 2860, 1140, '');

g.node('hot7', { x: 40, y: 340, kind: 'origen', title: 'Binance-Hot 7', lines: ['TDqSquXBgUCLYvYC4XZgrprLK589dkhSCf', 'etiqueta pública de TronScan', 'única salida grande ajena', 'entre las 19:00 y las 24:00'] });
g.node('tg5', { x: 520, y: 340, kind: 'bloqueada', title: 'TG5iBMQ… · 1.ª billetera del ladrón', lines: ['TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi', 'creada 29-oct 20:19', 'recibe 612,7 M USDT + 46,4 M TRX'], badge: 'CONGELADA 21:09:12 · 312.729.468 USDT dentro' });
g.node('tsp', { x: 1180, y: 340, kind: 'ladron', title: 'TSpe5HC3… · aparca el TRX', lines: ['TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A', 'entran 638.200.929 TRX (3 envíos grandes)', 'salen 638.200.900 en 5 envíos · saldo 37 TRX', 'duerme 13 h; reparte 10:15–10:20 del 30-oct'] });
g.node('tpb', { x: 520, y: 730, kind: 'bloqueada', title: 'TPBkSj… · cambia USDT por TRX', lines: ['TPBkSjkCMn2ckrMuAP8n2J1jdjbw76bKN4', 'recibe 300 M USDT: 234 M cambiados,', '65,99 M apartados, 10.000 a JustLend'], badge: 'CONGELADA 21:17:39 (ya vacía)' });
g.node('tcz', { x: 1180, y: 730, kind: 'bloqueada', title: 'TCzBTk… · USDT apartados', lines: ['TCzBTkqn66yApqbYoPezaEQosM5DAd7Y62', 'aparta 65,99 M USDT a las 21:16'], badge: 'CONGELADA 21:21:12 · 65.990.000 USDT dentro' });
g.node('sun', { x: 520, y: 1010, kind: 'contrato', title: 'SunSwap (DEX)', lines: ['16 cambios, 20:47–21:14', '234 M USDT → 638,19 M TRX'] });
const dep = [['d1', 140, 'paso', 'TAk1xJNW…', 'TAk1xJNWuBYvJHLsUiBFLeuK6xvpQUFYP5', '120 M TRX · lo pasa en 33 s'], ['d2', 310, 'paso', 'TL2F4Ghn… · VACIADA', 'TL2F4GhnaFVZBZPncHYjwfYZFW44NcfVwj', '120 M TRX · movida 31-oct 01:01:15'], ['d3', 480, 'paso', 'TCBAz7it… · VACIADA', 'TCBAz7itvtX5CjBzVMPQdrbwQLN63ao1fk', '120 M TRX · movida 31-oct 07:58:48'], ['d4', 650, 'quieta', 'TJajtPqD… · QUIETA', 'TJajtPqDqUGh1Sr1j8ugHoSXBVpaFLLHKT', '120.000.000 TRX = 42,2 M$ · sin movimientos'], ['d5', 820, 'quieta', 'TKkH2vH6… · QUIETA', 'TKkH2vH6kyi2QKcMbqym53WMuvdd1xvw6K', '158.200.902 TRX = 55,7 M$ · sin movimientos']];
for (const [id, y, k, t, a, l] of dep) g.node(id, { x: 1760, y, kind: k, title: t, lines: [a, l] });
g.node('trb', { x: 2420, y: 380, kind: 'reparto', title: 'TRBdWq… · reparto', lines: ['TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki', 'creada 30-oct 00:06', 'recibido en total: 406,4 M TRX', 'hoy conserva ≈ 95 M TRX', 'reparte desde las 02:19 del 30-oct'] });

g.edge('hot7', 'tg5', { w: 3, color: '#c9a100', at: 0.5, label: [{ t: '20:20:00 · 10.000 TRX (prueba)' }, H('6f983ab7…'), { t: '20:21:12 · 46.384.098 TRX' }, H('72f5fbed…'), { t: '20:22:45 · 612.729.468 USDT', b: true }, H('4203af9c…')] });
g.edge('tg5', 'tpb', { sa: 'b:0.35', sb: 't:0.35', color: '#d1453b', w: 2.5, label: [{ t: '20:45:51 · 100 M USDT' }, H('fd8061aa…'), { t: '20:56:09 · 200 M USDT' }, H('d40f96e2…'), { t: '+ 10.000 TRX de comisiones' }], dx: 160 });
g.edge('tpb', 'sun', { sa: 'b:0.2', sb: 't:0.2', color: '#888', label: ['234 M USDT'], dx: 70 });
g.edge('sun', 'tpb', { sa: 'l', sb: 'l:0.75', color: '#888', dash: true, pts: [[470, 1060], [470, 930]], label: ['638,19 M TRX'], at: 0.35, dx: -76 });
g.edge('tpb', 'tcz', { sa: 'r:0.75', sb: 'l:0.5', color: '#d1453b', label: ['21:16 · 65,99 M USDT'], at: 0.5, dy: -22 });
g.edge('tpb', 'tsp', { sa: 'r:0.2', sb: 'l:0.85', color: '#d1453b', w: 3, label: [{ t: '20:56:12 · 288.330.000 TRX' }, H('4b329d44…'), { t: '21:42:42 · 349.860.942 TRX', b: true }, H('fb5089f5…')], at: 0.5, k: 120 });
g.edge('tcz', 'tsp', { sa: 't:0.5', sb: 'b:0.5', color: '#d1453b', label: [{ t: '21:43:27 · 9.987 TRX' }, H('f4d4e4c6…')], dx: 90 });
g.edge('tg5', 'trb', { sa: 't:0.5', sb: 't:0.5', color: '#e07b00', w: 2.5, pts: [[740, 118], [2600, 118]], label: [{ t: '30-oct 00:06:09 · 46.383.069 TRX (robo directo, no pasa por TSpe5HC3…) · 6adfc066…', b: true }], at: 0.5 });
const env = { d1: ['10:15:21', '120.000.000', '9d0904db…'], d2: ['10:18:09', '120.000.000', '16585e96…'], d3: ['10:18:42', '120.000.000', '03742851…'], d4: ['10:19:24', '120.000.000', '3db47d89…'], d5: ['10:20:18', '158.200.900', 'aff887c4…'] };
for (const d of ['d1', 'd2', 'd3', 'd4', 'd5']) g.edge('tsp', d, { sa: 'r', sb: 'l', color: d === 'd4' || d === 'd5' ? '#2f6fd1' : '#777', w: 2.2, k: 110, at: 0.62, label: [env[d][0] + ' · ' + env[d][1] + ' TRX', H(env[d][2])] });
g.edge('d1', 'trb', { sa: 'r', sb: 'l:0.2', color: '#e07b00', w: 2.2, k: 80, label: ['30-oct 10:20:48 · 120 M', H('0ae2b5a4…')], at: 0.5 });
g.edge('d2', 'trb', { sa: 'r', sb: 'l:0.4', color: '#e07b00', w: 2.2, k: 80, label: ['31-oct 01:01:15 · 120 M', H('bb05d43b…')], at: 0.5 });
g.edge('d3', 'trb', { sa: 'r', sb: 'l:0.6', color: '#e07b00', w: 2.2, k: 80, label: ['31-oct 07:58:48 · 120 M', H('d3684f76…')], at: 0.5 });

g.note(40, 640, [{ t: 'Eventos de Tether en TRON', b: true }, '29-oct 21:09 · 21:17 · 21:21: los tres bloqueos del mapa', '30-oct 17:00–17:30: 37 bloqueos sin relación visible', '30-oct 22:05–22:12: 6 bloqueos más (2 ya vigiladas)', 'Total hoy: 67 bloqueos de 66 direcciones', 'Congelado del robo: 378.719.468 USDT (61,8 %)'], { kind: 'nota' });
g.note(1180, 990, [{ t: 'Mensajes de desconocidos a TSpe5HC3…', b: true }, '30-oct 07:54 «Hey, brother, let me help you transfer funds…»', '30-oct 08:18 «May I help you bro?»', 'además, 646 transferencias de polvo en las 10 billeteras', '(casi todas de 0,000002 TRX; no imitan la dirección)'], { kind: 'nota' });
g.note(1760, 1010, [{ t: 'Estado hoy: 278,2 M TRX (97,9 M$) quietos en 2 depósitos', b: true }, 'Los otros dos se vaciaron hacia TRBdWq… esta madrugada'], { kind: 'nuevo' });
g.note(2420, 590, [{ t: 'Desde aquí empieza el blanqueo (imagen 2/4)', b: true }, 'Hasta las 22:40 UTC del 30-oct: 379 envíos, 50,8 M$, 122 billeteras', 'Desde entonces: 353 envíos, 58,7 M$, 49 billeteras (5,1 M$/h)'], { kind: 'cifra' });

g.note(40, 850, [{ t: 'Conciliación de TG5iBMQ… (auditoría)', b: true }, 'Entra de Binance: 10.000 + 46.384.098 TRX', 'Sale: 46.383.069,129 al reparto', '+ 10.000 y 1.000 a TPBkSj… + 28,871 de comisión', '= 46.394.098 TRX (cuadra al TRX)'], { kind: 'nota' });
console.log(g.guardar(OUT, '1de4-custodia-tron', 1.4).ok);
