'use strict';
const { Grafo } = require('./lib.cjs');
const OUT = 'C:/EquipoIA/docs/grafos';
const H = t => ({ t, c: '#888' });
const g = new Grafo({ cadenaDef: 'ETHEREUM', cadenaImg: 'ETHEREUM (con un salto a Arbitrum)', w: 3420, h: 1500, titulo: '4/4 · Ethereum — De Binance 14 y 16 a las siete billeteras con 508.854 ETH', sub: 'El mismo robo, la otra cadena. Horas UTC del 29-oct salvo que se diga otra cosa. ETH a 2.253 $. Solo hechos de las dos investigaciones del 30-oct; sin cambios en el ETH desde entonces.', pie: 'Fuente: Etherscan v2 leído en vivo el 30 y el 31-oct (INVESTIGACION-BINANCE-0x5227-2026-10-30.md e INFORME-COMPLETO). Hashes completos en esos informes.', legend: [['origen', 'Binance'], ['ladron', 'billetera del ladrón'], ['bloqueada', 'congelado'], ['eth', 'billetera / contrato'], ['quieta', 'ETH quieto hoy'], ['nodo', 'billetera auxiliar'], ['nota', 'evento / límite']] });
g.pagina = '4/4';
g.region(20, 80, 3380, 1320, '');
const w = m => 1.5 + Math.sqrt(m) * 0.9;

g.node('b14', { x: 40, y: 250, kind: 'origen', title: 'Binance 14', lines: ['0x28c6c06298d514db089934071355e5743bf21d60', 'etiqueta de la comunidad de Etherscan', { t: 'Tether la congela a las 22:06:39', c: '#a61e4d', b: true }] });
g.node('b16', { x: 40, y: 480, kind: 'origen', title: 'Binance 16', lines: ['0xdfd5293d8e347dfe59e90efd55b2956a1343963d', 'etiqueta de la comunidad de Etherscan'] });
g.node('usdc', { x: 40, y: 660, kind: 'eth', title: '0xee7ae85f…4055 (sin etiqueta)', lines: ['780 M USDC a las 20:41:23', '43 M USDC a las 20:59:47'] });
g.node('x5227', { x: 920, y: 330, kind: 'ladron', title: '0x5227…2f8c · dirección del ladrón', lines: ['0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c', 'creada esa tarde; recibe entre 20:24:23 y 21:44:11:', '1.875,46 M USDT · 823 M USDC · 196.138 ETH · 61 tokens', 'hoy: 4,81 ETH; sigue vendiendo tokens menores (31-oct)'], badge: 'USDT CONGELADO 21:01:35 · 1.175,46 M' });

g.edge('b14', 'x5227', { sa: 'r', sb: 'l:0.3', color: '#c9a100', w: 4, k: 200, label: [{ t: '20:24:23 · 1.615,4 M USDT + 167.464 ETH + 60 tokens', b: true }, H('0x53bd38b8…8e2f3 (una sola transacción, función sweep)'), { t: '21:04:23 · 3,9 M USDT' }, H('0x31c4c9fe…a91d'), { t: '21:44:11 · 200,4 M USDT (ya congelada)' }, H('0x55ba4dab…0556')], at: 0.5 });
g.edge('b16', 'x5227', { sa: 'r', sb: 'l:0.6', color: '#c9a100', w: 2.5, k: 200, label: [{ t: '20:24:47 · 55,7 M USDT + 28.006 ETH + 5 tokens' }, H('0xd4e08d3e…6c49c y 7 más')], at: 0.5 });
g.edge('usdc', 'x5227', { sa: 'r', sb: 'l:0.85', color: '#c9a100', w: 3, k: 200, label: [{ t: '823 M USDC' }], at: 0.5 });

// congelaciones
g.node('fr', { x: 920, y: 760, kind: 'bloqueada', title: 'Lo que congelaron los emisores (dentro de la dirección)', lines: ['USDT  1.175,46 M · Tether · 21:01:35 · 0x7baba482077843514d9c72bac0110ba0916b0814288a72917e2c3bb27a9d8659', 'USDC  823 M · Circle · 21:04:59 · 0xc954c86f118e8e410e6a3eb9e3b38ff4a95fbdae9d2d58e13166afb7a1f4fc5f', 'XAUt 12.574 · 21:11:23 · USD1 27,8 M · 22:10:35', 'PAXG 1.907 · 22:30:47 · FDUSD 3,45 M · 00:46:11 (30-oct)', { t: 'RLUSD 88,5 M: Ripple NO llegó; se vendió entre 21:12 y 21:47', c: '#a61e4d' }, { t: 'Total congelado en Ethereum: 1.380 M USDT (incl. 205 M en otras) + 823 M USDC', b: true }] });
g.edge('x5227', 'fr', { sa: 'b', sb: 't', color: '#6b1d1d', w: 3, dash: true, label: ['congelado antes de que saliera nada'], dx: 150 });

// ramas de 700 M
g.node('r500', { x: 1720, y: 130, kind: 'eth', title: "0x9749…c762 · rama de 500 M USDT", lines: ["0x9749292d74fd460982d0912ea9515ea24736c762","21:01–21:36 · vende por ETH en DEX · congelada 21:01:35"] });
g.node('r200', { x: 1720, y: 280, kind: 'eth', title: "0x0ddf…697e · rama de 200 M USDT", lines: ["0x0ddf0480016e6bcb2c1f5d190d221fba1320697e","congelada 21:01:47 · sale a intermedias congeladas:","0x8d53903625b8e839b9df4bd28b0efb1cd6b8639a (21:02:47)","0x7aa4d3029e4c6a8e916300014ad95b6d6c03bfd1 (21:12:35)","0xaa246bf639586a6ba46762d378ce50ca4fc654a0 (21:14:59)","0xccbef95633adb5cd2b5038db5a38d77e726ca263 (21:16:47)","0xb171ca86f82070282138352ff7111b494060c8c3 (21:18:59)"] });
g.edge('x5227', 'r500', { sa: 'r:0.15', sb: 'l', color: '#4c5fd1', w: w(500) * 0.3, k: 160, label: ['500 M USDT'], at: 0.5 });
g.edge('x5227', 'r200', { sa: 'r:0.3', sb: 'l', color: '#4c5fd1', w: w(200) * 0.3, k: 160, label: ['200 M USDT'], at: 0.5 });
g.node('res700', { x: 2420, y: 180, kind: 'nota', title: 'Destino de esos 700 M USDT (cuadra)', lines: ['435 M cambiados a ETH (≈ 160.451 ETH)', '205 M congelados (175 M en 0xaa246bf6…, 30 M en 0xb171ca86…)', '60 M depositados en Aave como garantía (deuda de 19.762 ETH)'] });
g.edge('r500', 'res700', { sa: 'r', sb: 'l:0.3', color: '#888', k: 100 }); g.edge('r200', 'res700', { sa: 'r', sb: 'l:0.7', color: '#888', k: 100 });

// auxiliares y receptores
g.node('aux', { x: 1720, y: 470, kind: 'nodo', title: "14 billeteras auxiliares (reciben gas)", lines: ["venden los otros 61 tokens (PEPE, ENA, RSR, ZAMA, wBETH…) en Uniswap V2/V3","más de 90 ventas en alguna de ellas · ejemplos:","0x7f9dc988b46336ad536828fad50fa8fa1e5415e3 (ENA, wBETH)","0x42cdf00c85005630cc8605731b9364f712077810","0x600d6f00eadabdb514561ceeb43730a7103e8298 (PEPE)","0xb58bf76d209fa71f60013ce1933ca331177a4f08 (RSR)","0x0084847bb9384d2fc5e8836e663689467e3e4c81 (ZAMA)"] });
g.edge('x5227', 'aux', { sa: 'r:0.6', sb: 'l', color: '#4c5fd1', w: 3, k: 160, label: ['61 tokens + 2 ETH de gas', 'a cada auxiliar'], at: 0.5, dy: 30 });
const rec = [['q1', 'Receptor 1', '0x8532fa14acaf483729c449b8458aeddb900543d4', '197.460 ETH', 197460], ['q2', 'Receptor 2', '0x03b0ee5d82990cff1bda48651ac3e436d1a020ea', '17.260 ETH', 17260], ['qa', 'Consolidación A', '0xc887af690e0301cd4edbbce8f8d31b4ec65b286a', '137.602 ETH', 137602], ['qb', 'Consolidación B', '0x897c80d1a9729e94460e2bd93178bd5215158df3', '78.415 ETH', 78415], ['qc', 'Consolidación C', '0x54401f80da97893a15d43566184635b6674bc942', '40.601 ETH', 40601], ['qd', 'Consolidación D', '0x79e70d139fc05aa75f75611fdf2680e9952b544a', '34.280 ETH', 34280], ['qe', 'Consolidación E', '0x8d4b8ee62124b7ee140a51ddd07390a56f1c9e19', '3.237 ETH', 3237]];
rec.forEach(([id, n, a, e], i) => g.node(id, { x: 2640, y: 480 + i * 120, kind: 'quieta', title: n + ' · ' + e, lines: [a, 'sin ninguna salida hasta hoy'] }));
g.edge('x5227', 'q1', { sa: 'b:0.9', sb: 'l', color: '#e07b00', w: 6, k: 260, c1: [0, 120], label: [{ t: '29-oct 20:38 · 195.460 ETH', b: true }, { t: '30-oct 01:14 · 2.000 ETH', b: true }], at: 0.9, dy: -34 });
g.edge('x5227', 'q2', { sa: 'b:0.7', sb: 'l', color: '#e07b00', w: 3, k: 260, c1: [0, 100], label: [{ t: '30-oct 05:15 · 17.260 ETH' }], at: 0.88, dy: 8 });
const ax = { qa: ['0x7f9dc988… 15.292 ETH (30-oct 00:59) + más'], qb: ['0xb171 57.892 ETH (21:36) + 0x42cdf00c… 20.523'], qc: ['0xb58bf76d… 1.855 ETH + 2 vendedoras 10.374'], qd: ['0x600d6f00… 14.050 ETH'], qe: ['0x0084847b… 806 ETH + 274'] };
for (const id of ['qa', 'qb', 'qc', 'qd', 'qe']) g.edge('aux', id, { sa: 'r', sb: 'l', color: '#e07b00', w: 2.2, k: 140, label: ax[id], at: 0.5, fs: 10.5 });

// Arbitrum
g.node('arb', { cadena: 'ARBITRUM + AVALANCHE', x: 920, y: 1030, kind: 'eth', title: "Arbitrum, Avalanche y Polygon", lines: ["29-oct 20:30–20:33: 8.426 ETH + 74,56 M ARB a la dirección (Arbitrum):","0xf92402bb795fd7cd08fb83839689db79099c8c9c 3.478 ETH · 0xc45dd9f9…","0x1b5b4e441f5a22bfd91b7772c780463f66a74b35 2.959 ETH · 0x31a4acf9…","0x3931dab967c3e2dbb492fe12460a66d0fe4cc857 1.989 ETH · 0xd3be30c8…","0xb38e8c17e38363af6ebdcb3dae12e0243582891d 74.559.805 ARB · 0xa18e5702…","Polygon 23:05: 6.185.900 USDT0 de 0xe7804c37c13166ff0b37f5ae0bb07a3aebb6e245","Avalanche: 8.409.928 USDt + 2,26 M AVAX · USDt BLOQUEADO 21:07:55 (0x5c7395a1…)","21:29 la dirección da 0,5 ETH de gas a 0x3e2bf1ac6bf0934bbba6456c341c2ecbced632d5","21:36–21:38: 8.425 ETH + 74,56 M ARB → 0x3e2b… (Arbitrum)"], cadena: "ARBITRUM + AVALANCHE + POLYGON" });
g.node('da0', { x: 1720, y: 1030, cadena: 'ARBITRUM', kind: 'quieta', title: '0x…0da0 · cuenta de Arbitrum', lines: ['0x0000000000000000000000000000000000000da0', '30-oct 00:18: 8.426 ETH + 74,56 M ARB', 'no es contrato; aparcó 30.766 ETH en abril; sin salidas', 'hoy 8.426,05 ETH (≈ 19 M$) y 74,56 M ARB'] });
g.edge('x5227', 'arb', { sa: 'l:0.97', sb: 'l:0.3', color: '#4c5fd1', dash: true, pts: [[860, 400], [860, 1100]], label: ['⇄ ETHEREUM → ARBITRUM', 'por un agregador de puentes', '(0,5 ETH de gas a 0x3e2b…)'], at: 0.93, dx: -2 });
g.edge('arb', 'da0', { sa: 'r', sb: 'l', color: '#e07b00', w: 3, label: [{ t: '30-oct 00:18 · 8.426 ETH + 74,56 M ARB' }, H('0x410af166…15f70')], at: 0.5 });

g.node('tot', { x: 2640, y: 1330, kind: 'cifra', title: 'Total ETH quieto hoy: 508.854 ETH ≈ 1.147 M$', lines: ['siete billeteras · mismas cifras a las 21:00 del 30-oct y a las 10:30 del 31-oct', '+ 8.426 ETH (≈ 19 M$) en Arbitrum · el ETH no se puede congelar, solo vigilar'] });
g.note(1720, 1230, [{ t: 'Los avisos de Ethereum del bot', b: true }, 'son 9 salidas de tokens menores de 0x5227… (31-oct 04:29–07:39):', 'PROM, ZAMA, SOPH, NIL, LSK, FUN, RE, ZKP y BLUR. Sin valorar.'], { kind: 'nota' });
g.note(40, 880, [{ t: 'Cautelas', b: true }, 'Las etiquetas «Binance 14/16» vienen de la comunidad de Etherscan,', 'no de Binance. «Congelado» = bloqueo en el contrato del token.', 'Quién es el ladrón no consta en la cadena.'], { kind: 'nota' });
console.log(g.guardar(OUT, '4de4-ethereum', 1.25).ok);
