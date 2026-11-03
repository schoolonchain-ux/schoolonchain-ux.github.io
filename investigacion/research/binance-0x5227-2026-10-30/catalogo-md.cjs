'use strict';
// Escribe docs/CATALOGO-ROBO-BINANCE-2026-10-31.md con las tablas principales a partir del libro Excel.
const fs = require('fs'); const XLSX = require('C:/EquipoIA/n8n/node_modules/@e965/xlsx');
const wb = XLSX.readFile('C:/EquipoIA/docs/catalogo/CATALOGO-COMPLETO-ROBO-BINANCE-2026-10-31.xlsx'); const rows = n => XLSX.utils.sheet_to_json(wb.Sheets[n] || {});
const esc = v => String(v === undefined ? '' : v).replace(/\|/g, '\\|').replace(/\n/g, ' '); const fmt = n => Number(n).toLocaleString('es-ES', { maximumFractionDigits: 2 });
const tabla = (cols, filas) => '| ' + cols.join(' | ') + ' |\n|' + cols.map(() => '---').join('|') + '|\n' + filas.map(f => '| ' + f.map(esc).join(' | ') + ' |').join('\n');
const cnt = (arr, k) => { const c = {}; for (const x of arr) c[x[k]] = (c[x[k]] || 0) + 1; return Object.entries(c).sort((a, b) => b[1] - a[1]); };
const bt = s => '`' + s + '`';
const o = [];
const mT = rows('Mensajes TRON'), mE = rows('Mensajes ETH-ARB'), pT = rows('Envenenamiento TRON'), pE = rows('Envenenamiento ETH-ARB'), tT = rows('Tokens basura TRON'), fE = rows('Tokens falsos ETH-ARB'), cs = rows('Contratos inteligentes'), ca = rows('Casas de cambio'), bE = rows('Bloqueos Tether ETH'), bT = rows('Bloqueos Tether TRON'), dr = rows('Direcciones'), tk = rows('Tokens');
o.push('# Catálogo completo del robo a Binance (TRON y Ethereum): direcciones, hashes, mensajes, envenenamiento, contratos, casas de cambio y tokens\n');
o.push('**Qué es.** El índice legible del catálogo. **Todo el detalle está en el libro Excel `docs/catalogo/CATALOGO-COMPLETO-ROBO-BINANCE-2026-10-31.xlsx`** (con filtros en cada hoja) y en los mismos datos en CSV (`docs/catalogo/csv/`). Aquí van las tablas que más se consultan, con **direcciones y hashes completos**. Horas UTC.\n');
o.push('**Cadena de cada dato:** TRON · ETHEREUM · ARBITRUM (BSC y Solana solo como destino leído en Bridgers). Cada fila lo indica.\n');
o.push('## Límites (leer antes)\n');
o.push('- **Dónde se ha buscado.** Mensajes, polvo y tokens basura: en las **10 billeteras del ladrón en TRON** y en las **8 de Ethereum + la de Arbitrum**, desde las 19:00 UTC del 29-oct hasta la mañana del 31-oct. **No** en las miles de billeteras intermedias del recorrido.');
o.push('- **Mensajes.** Solo existen en transacciones que llevan texto (notas en TRON, datos de entrada en Ethereum). Las transferencias de tokens (TRC20 y ERC20) no llevan nota.');
o.push('- **Categorías de los mensajes.** Las he puesto con reglas de palabras; el texto completo va al lado para que las corrijas.');
o.push('- **«Imita a».** Dirección real del caso que comparte el comienzo y/o el final con el remitente. Es un **indicio** de envenenamiento, no una prueba.');
o.push('- **Una afirmación de mi informe anterior no se sostiene:** el informe del 30-oct decía que las billeteras de TRON reciben polvo «desde direcciones que imitan sus últimas letras». Medido ahora, **ninguna de las ' + pT.length + ' transferencias de polvo imita la dirección de su destinatario**; solo 2 comparten las últimas 4 letras con otra contraparte. Lo que sí es masivo es el **polvo en sí** (apartado 2.1). En Ethereum, en cambio, el envenenamiento por imitación sí existe y está confirmado (apartado 2.2).\n');

// 1. Ofrecen ayuda
o.push('## 1. Mensajes que ofrecen ayuda\n');
const ayT = mT.filter(m => /Ofrece/.test(m['Categoría']));
o.push('### 1.1 TRON: quién escribe, a qué billetera y en qué transacción\n');
o.push(tabla(['Hora (UTC)', 'Remitente (completa)', 'Destinatario (completa)', 'Papel del destinatario', 'TRX', 'Hash', 'Texto'], ayT.map(m => [m['Hora (UTC)'], bt(m['Remitente (completa)']), bt(m['Destinatario (completa)']), m['Destinatario (papel)'], m.Cantidad, bt(m.Hash), m['Texto del mensaje']])));
o.push('\n- ' + bt('TQrWFCvcngriESyNHi6v7pGAGdtubVan6o') + ' escribe 3 veces («let me help you transfer funds…»), una de ellas ofreciendo «Tornado/Near/Change». ' + bt('TYrd3cjfNaYzVwPaSxj1xtzpLVPTA88888') + ' escribe 2 veces («May I help you bro?») y ' + bt('TA9vfEWEpfkF5dBdmDQLe9PheZfzmjbAKn') + ' una. Son desconocidos: **en la cadena no consta ningún mensaje de respuesta** desde las billeteras del ladrón.');
const otros = mT.filter(m => !/Ofrece/.test(m['Categoría']));
if (otros.length) { o.push('\nOtro mensaje en TRON (no ofrece ayuda):\n'); o.push(tabla(['Hora (UTC)', 'Remitente', 'Destinatario', 'Hash', 'Texto'], otros.map(m => [m['Hora (UTC)'], bt(m['Remitente (completa)']), bt(m['Destinatario (completa)']), bt(m.Hash), m['Texto del mensaje']]))); }
const ayE = mE.filter(m => /Ofrece/.test(m['Categoría']));
o.push('\n### 1.2 Ethereum: oferta de ayuda a cambio de 1.000 ETH (posible estafa)\n');
o.push('El mismo texto llegó a las **7 billeteras del botín** entre las 03:55 y las 04:08 UTC del 30-oct desde ' + bt('0xcb3fde484d2bbde1136d3d2341d32609fce34684') + ', que pide que se le transfieran 1.000 ETH a esa misma dirección a cambio de «despejar todos los obstáculos» y «garantizar la retirada». Texto:\n');
if (ayE[0]) o.push('> ' + ayE[0]['Texto del mensaje'].replace(/\n/g, ' ') + '\n');
o.push(tabla(['Hora (UTC)', 'Remitente (completa)', 'Destinatario (completa)', 'Papel', 'Hash'], ayE.map(m => [m['Hora (UTC)'], bt(m['Remitente (completa)']), bt(m['Destinatario (completa)']), m['Destinatario (papel)'], bt(m.Hash)])));
o.push('\n### 1.3 Los demás mensajes de Ethereum y Arbitrum, por categoría\n');
o.push(tabla(['Categoría', 'Mensajes', 'Remitentes distintos'], cnt(mE, 'Categoría').map(([k, n]) => [k, n, new Set(mE.filter(m => m['Categoría'] === k).map(m => m['Remitente (completa)'])).size])));
const recl = mE.filter(m => /Reclam/.test(m['Categoría'])); const rg = {}; for (const m of recl) { const k = m['Remitente (completa)']; (rg[k] = rg[k] || []).push(m); }
o.push('\n**Reclamaciones y negociación** (alguien dice ser víctima o pide devolver los fondos):\n');
o.push(tabla(['Remitente (completa)', 'Mensajes', 'Primer mensaje (UTC)', 'Hash del primero', 'Texto (principio)'], Object.entries(rg).map(([a, l]) => [bt(a), l.length, l[0]['Hora (UTC)'], bt(l[0].Hash), l[0]['Texto del mensaje'].slice(0, 220)])));
const ins = mE.filter(m => /Insulto/.test(m['Categoría']));
o.push('\n**Insulto o ruido:** ' + ins.length + ' mensajes de ' + new Set(ins.map(m => m['Remitente (completa)'])).size + ' remitente(s); el principal repite un mismo texto 699 veces. Están en la hoja «Mensajes ETH-ARB».');
const pid = mE.filter(m => /Pide/.test(m['Categoría']));
o.push('\n**Peticiones de dinero:** ' + pid.length + ' mensajes de ' + new Set(pid.map(m => m['Remitente (completa)'])).size + ' direcciones, todos con hash en la hoja.\n');

// 2. Envenenamiento
o.push('## 2. Envenenamiento de direcciones y polvo\n');
o.push('### 2.1 TRON\n');
const microT = pT.filter(p => p.Cantidad < 0.001);
o.push('- **' + pT.length + ' transferencias de polvo** recibidas por las billeteras del ladrón, de **' + new Set(pT.map(p => p['Remitente (completa)'])).size + ' direcciones distintas**. **' + microT.length + '** son de menos de 0,001 TRX y **' + pT.filter(p => p.Cantidad === 0.000002).length + '** son exactamente 0,000002 TRX.');
o.push('- Por billetera de destino: ' + cnt(pT, 'Destinatario (papel)').map(([k, n]) => k + ': ' + n).join(' · ') + '.');
o.push('- Patrón: un goteo constante en `TRBdWq…` (hasta 46 por hora, más de madrugada del 31-oct), casi siempre un remitente distinto. **No imita la dirección del destinatario.** Hipótesis, no comprobada: envío masivo de «polvo» a todo el que recibe fondos grandes (marcado o rastreo de billeteras).');
const imT = pT.filter(p => p['Imita a (dirección real parecida)']);
o.push('- **Imitaciones detectadas (últimas 4 letras iguales a otra contraparte del destinatario):**\n');
o.push(tabla(['Hora (UTC)', 'Remitente (completa)', 'Imita a', 'Destinatario (completa)', 'TRX', 'Hash'], imT.map(p => [p['Hora (UTC)'], bt(p['Remitente (completa)']), p['Imita a (dirección real parecida)'], bt(p['Destinatario (completa)']), p.Cantidad, bt(p.Hash)])));
o.push('\n### 2.2 Ethereum y Arbitrum (confirmado)\n');
const imE = pE.filter(p => p['Imita a (dirección real parecida)']);
o.push(pE.length + ' transferencias de polvo o de 0 recibidas por las billeteras del botín; **' + imE.length + ' imitan una dirección real del caso** (mismo comienzo de 4 caracteres y mismo final). Ejemplo: ' + bt('0x9749f766186d9544a421f5414c92182fa50dc762') + ' imita a ' + bt('0x9749292d74fd460982d0912ea9515ea24736c762') + ', la intermedia de la rama de 500 M USDT. Todas:\n');
o.push(tabla(['Hora (UTC)', 'Cadena', 'Tipo', 'Remitente (completa)', 'Imita a (completa)', 'Destinatario (completa)', 'Token', 'Cantidad', 'Hash'], imE.map(p => [p['Hora (UTC)'], p.Cadena, p.Tipo, bt(p['Remitente (completa)']), bt(p['Imita a (dirección real parecida)']), bt(p['Destinatario (completa)']), p.Token, p.Cantidad, bt(p.Hash)])));
o.push('\nLas otras ' + (pE.length - imE.length) + ' (polvo sin imitación evidente) están en la hoja «Envenenamiento ETH-ARB».\n');

// 3. Tokens basura
o.push('## 3. Tokens basura y falsos\n');
o.push('### 3.1 TRON: tokens con publicidad en el nombre (TRC10) y otros\n');
const tg = {}; for (const t of tT) { const k = t['Token (id/contrato)']; const x = tg[k] || (tg[k] = { id: k, sim: t['Símbolo'], nom: t['Nombre del token'], red: t.Cadena, n: 0, rem: new Set(), dest: new Set(), ej: t.Hash }); x.n++; x.rem.add(t['Remitente (completa)']); x.dest.add(t['Destinatario (completa)']); }
o.push(tabla(['Cadena', 'Id / contrato', 'Símbolo', 'Nombre', 'Transferencias', 'Remitentes', 'Destinatarios', 'Hash de ejemplo'], Object.values(tg).map(x => [x.red, bt(x.id), x.sim, x.nom, x.n, x.rem.size, x.dest.size, bt(x.ej)])));
o.push('\n- El TRC10 **1005092 «BanList»** es el que TronScan muestra como falsos «312.729.468 TRX»: lo manda un robot tres segundos después de cada bloqueo de Tether, por el importe congelado. No es TRX.');
o.push('- El resto (`gas.bi`, `swapgo.io`, `567u.com`, `U212com`, `T990com`, «SaveGasfeeOnZapzeeIO», «BestAdsCoin», `TG:JF4888`) son tokens cuyo **nombre es publicidad** (webs o Telegram). El remitente de cada uno está en la hoja «Tokens basura TRON».');
o.push('\n### 3.2 Ethereum, Arbitrum y Polygon: tokens falsos o ajenos\n');
const fg = {}; for (const f of fE) { const k = f.Cadena + '|' + f['Contrato del token falso (completo)']; const x = fg[k] || (fg[k] = { cad: f.Cadena, c: f['Contrato del token falso (completo)'], s: f['Símbolo'], n: f['Nombre del token'], mot: f.Motivo, cnt: 0, rem: new Set(), ej: f.Hash }); x.cnt++; x.rem.add(f['Remitente (completa)']); }
o.push(tabla(['Cadena', 'Símbolo', 'Nombre', 'Contrato (completo)', 'Motivo', 'Transferencias', 'Remitentes', 'Hash de ejemplo'], Object.values(fg).sort((a, b) => b.cnt - a.cnt).map(x => [x.cad, x.s, x.n, bt(x.c), x.mot, x.cnt, x.rem.size, bt(x.ej)])));
o.push('\n**«Origen distinto de Binance»** significa que el token no llegó de Binance 14/16 ni del emisor de USDC; puede ser airdrop/spam o una devolución de una billetera auxiliar. Revisar a mano. Los claramente falsos (imitan a DAI o ETH, o llevan caracteres invisibles) están marcados como tales.\n');

// 4. Contratos
o.push('## 4. Contratos inteligentes (nombre, dirección completa y qué hacen)\n');
const nombrados = cs.filter(c => c.Nombre && !/sin nombre/.test(c.Nombre)); const tr = nombrados.filter(c => c.Cadena === 'TRON');
o.push('### 4.1 TRON (' + tr.length + ' con nombre; los ' + (cs.filter(c => c.Cadena === 'TRON').length - tr.length) + ' sin nombre público están en la hoja)\n');
o.push(tabla(['Nombre', 'Tipo', 'Qué hace', 'Dirección completa', 'Envíos del rastreo'], tr.sort((a, b) => a.Tipo.localeCompare(b.Tipo) || a.Nombre.localeCompare(b.Nombre)).map(c => [c.Nombre, c.Tipo, c['Qué hace'], bt(c['Dirección completa']), c['Envíos del rastreo que pasan por él']])));
o.push('\n### 4.2 Ethereum y Arbitrum\n');
o.push(tabla(['Cadena', 'Nombre', 'Qué hace', 'Dirección completa'], cs.filter(c => c.Cadena !== 'TRON').map(c => [c.Cadena, c.Nombre, c['Qué hace'], bt(c['Dirección completa'])])));

// 5. Casas
o.push('\n## 5. Casas de cambio (billeteras con dirección completa)\n');
o.push(tabla(['Cadena', 'Casa', 'Dirección completa', 'Tipo', 'Para qué aparece', 'Fuente'], ca.map(c => [c.Cadena, c.Casa, bt(c['Dirección completa']), c.Tipo, c['Para qué aparece'], c.Fuente])));
const llegadas = rows('Llegadas a casas (atribuidas)'); const porCasa = {};
for (const l of llegadas) { const x = porCasa[l.Casa] || (porCasa[l.Casa] = { n: 0, robo: 0 }); x.n++; x.robo += l['Robo estimado (USD)']; }
o.push('\n**Llegadas atribuidas al robo (estimación).** Cada envío con su remitente y su hash está en la hoja «Llegadas a casas (atribuidas)»:\n');
o.push(tabla(['Casa', 'Envíos', 'Robo estimado (USD)'], Object.entries(porCasa).sort((a, b) => b[1].robo - a[1].robo).map(([k, x]) => [k, x.n, fmt(x.robo)])));

// 6. Bloqueos
o.push('\n## 6. Bloqueos de Tether\n');
o.push('### 6.1 Ethereum (con hash)\n');
o.push(tabla(['Hora (UTC)', 'Dirección bloqueada (completa)', 'Qué es', 'Destino del puente', 'Hash'], bE.map(b => [b['Hora (UTC, según Etherscan)'], bt(b['Dirección bloqueada (completa)']), b['Qué es'], b['Es destino del puente USDT0'], bt(b['Hash del evento AddedBlackList'])])));
o.push('\n- **Hallazgo:** ' + bt('0xed17ca397ac96f55ea8f2f626a5ff1af0086bd7a') + ', una de las direcciones a las que llega el dinero de TRON por el puente USDT0, fue **bloqueada por Tether el 30-oct a las 13:36:23 UTC** (tenía ≈ 206.000 $ de stablecoins). Es el único bloqueo posterior a la primera noche que coincide con las direcciones del puente.');
const fm = bE.find(b => b['Firmante / multifirma']); if (fm) o.push('- Firmante y multifirma del primer bloqueo: ' + fm['Firmante / multifirma'].split(' → ').map(bt).join(' → ') + '.');
o.push('\n### 6.2 TRON\n');
o.push('**' + bT.length + ' bloqueos** (hoja «Bloqueos Tether TRON», con la dirección y el hash de cada evento). Los tres del robo: ' + bt('TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi') + ' (' + bt('71b0ec0fe873fe820c37cc3ecbab4e83087f87e833d191012a0a4027d20594e1') + '), ' + bt('TPBkSjkCMn2ckrMuAP8n2J1jdjbw76bKN4') + ' (' + bt('bc4e4a76bd262307a4d005d9745e2e8cf3bfe7d38e2ae4d5fcfaa40376721f40') + ') y ' + bt('TCzBTkqn66yApqbYoPezaEQosM5DAd7Y62') + ' (' + bt('176a5783fd70f5abbae9569f60398afe5307eefa9d06982ae5a9351e2cbc0f13') + ').\n');

// 7-9
o.push('## 7. Tokens del botín (resumen; todos en la hoja «Tokens»)\n');
const legit = tk.filter(t => /botín/.test(t.Tipo));
o.push('La hoja lista **' + tk.length + ' tokens** (' + legit.length + ' del botín en Ethereum/Arbitrum/Polygon, el resto ajenos o falsos), con contrato completo y cantidades recibidas y enviadas. En TRON: TRX y USDT (' + bt('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t') + ').\n');
o.push('## 8. Catálogo de direcciones (hoja «Direcciones»)\n');
o.push('**' + dr.length + ' direcciones** en total, cada una con categoría, nombre o etiqueta, notas y fuente. Por categoría:\n');
o.push(tabla(['Categoría', 'Direcciones'], cnt(dr, 'Categoría').slice(0, 25)));
o.push('\n## 9. Todas las hojas del libro\n');
o.push(tabla(['Hoja', 'Filas'], wb.SheetNames.slice(1).map(n => [n, rows(n).length])));
fs.writeFileSync('C:/EquipoIA/docs/CATALOGO-ROBO-BINANCE-2026-10-31.md', o.join('\n') + '\n');
console.log('escrito', o.join('\n').length, 'caracteres');
