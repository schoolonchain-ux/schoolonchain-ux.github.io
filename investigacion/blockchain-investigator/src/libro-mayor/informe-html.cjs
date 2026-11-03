'use strict';
// Arma la página HTML AUTOCONTENIDA del informe de trazabilidad: estilos + datos (JSON) + programa del navegador. Sin red, sin librerías externas.
const fs = require('node:fs'); const path = require('node:path');
const CSS = `
:root{--bg:#f6f7f9;--pan:#fff;--fg:#14181f;--soft:#45505f;--mut:#6b7686;--line:#dfe3ea;--acc:#0b6fb8;--ok:#13795b;--warn:#a86a00;--bad:#b3261e;--vio:#6b4fbb;--mono:ui-monospace,Menlo,Consolas,monospace}
@media (prefers-color-scheme:dark){:root{--bg:#0b0e13;--pan:#10151c;--fg:#e6eaf0;--soft:#aab4c3;--mut:#8f9aab;--line:#232a36;--acc:#5cc8fe;--ok:#5fd3a0;--warn:#f2b84b;--bad:#ff5c7a;--vio:#b58cff}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:var(--acc);word-break:break-all}.mono{font-family:var(--mono);font-size:12.5px}.muted{color:var(--mut)}.peq{font-size:12px}
header.top{padding:22px 24px 10px;max-width:1200px;margin:0 auto}header.top h1{margin:0 0 4px;font-size:24px}header.top .sub{color:var(--soft)}
nav.idx{position:sticky;top:0;z-index:20;background:var(--pan);border-bottom:1px solid var(--line);padding:8px 24px;display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px}nav.idx a{text-decoration:none;word-break:normal}
main{max-width:1200px;margin:0 auto;padding:0 24px 60px}.sec{margin:28px 0;padding:18px 20px;background:var(--pan);border:1px solid var(--line);border-radius:14px}
.sec h2{margin:0 0 10px;font-size:19px}.sec h3{margin:18px 0 6px;font-size:14px;color:var(--soft);text-transform:uppercase;letter-spacing:.04em}.sec h4{margin:14px 0 6px;font-size:13px;color:var(--soft)}
.llano{background:rgba(11,111,184,.07);border-left:4px solid var(--acc);padding:10px 14px;border-radius:8px;margin:0 0 12px}.llano.grande{font-size:16.5px}.llano p{margin:6px 0}
.nota{color:var(--mut);font-size:13px;margin:8px 0}.total{font-size:15px;margin:10px 0}
.kpis{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}.kpi{flex:1 1 150px;border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--bg)}.kpi .kv{font-size:20px;font-weight:650}.kpi .kl{color:var(--mut);font-size:12.5px;margin-bottom:4px}
.est{display:inline-block;font-size:10.5px;font-weight:700;letter-spacing:.03em;border-radius:6px;padding:1px 7px;border:1px solid;white-space:nowrap}
.est-VERIFICADO{color:var(--ok);border-color:var(--ok)}.est-ESTIMADO{color:var(--acc);border-color:var(--acc)}.est-HIPOTESIS{color:var(--vio);border-color:var(--vio)}.est-DESCONOCIDO{color:var(--bad);border-color:var(--bad)}.est-PENDIENTE{color:var(--warn);border-color:var(--warn)}
.tabla{margin:10px 0;overflow-x:auto}.barra{display:flex;gap:10px;align-items:center;margin:6px 0}.filtro{flex:0 1 340px;padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg);font:inherit}
table{border-collapse:collapse;width:100%;font-size:13px}th,td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}th{cursor:pointer;white-space:nowrap;color:var(--soft);font-weight:600;position:sticky;top:0;background:var(--pan)}th:hover{color:var(--acc)}.num{text-align:right;white-space:nowrap}
tr.desp{cursor:pointer}tr.desp:hover{background:rgba(11,111,184,.06)}tr.det td{background:var(--bg)}.det-in{padding:6px 4px}
.btn{border:1px solid var(--line);background:var(--bg);color:var(--fg);border-radius:8px;padding:4px 10px;cursor:pointer;font:inherit;font-size:12.5px}.btn:hover{border-color:var(--acc)}.btn:disabled{opacity:.4;cursor:default}.nav{display:flex;gap:8px;margin-top:6px}
.grafwrap{margin:10px 0}.graf{width:100%;height:auto}.graf .gt{fill:#fff;font:600 13px system-ui}.graf .gl{fill:var(--mut);font:11.5px system-ui}
.ficha{border:1px solid var(--line);border-radius:12px;padding:14px;margin-top:14px;background:var(--bg)}.ficha .cab{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.ficha .grande{font-size:14px;word-break:break-all}
.tag{display:inline-block;border-radius:6px;padding:1px 9px;font-size:11.5px;font-weight:700;color:#08121a;background:#8795aa}.cl-origen{background:#5cc8fe}.cl-nodo{background:#ff5c7a}.cl-casa{background:#5fd3a0}.cl-contrato{background:#b58cff}.cl-prestamo{background:#f2b84b}.cl-puente{background:#ff9f43}.cl-usdd{background:#3dd6c6}
.kv{display:grid;grid-template-columns:240px 1fr;gap:5px 14px;margin:10px 0}.kv dt{color:var(--mut)}.kv dd{margin:0}
.nov-v{border-left:3px solid var(--acc);padding:2px 12px;margin:10px 0}.nov-v ul{margin:6px 0 0 18px;padding:0}
footer{max-width:1200px;margin:0 auto;padding:0 24px 40px;color:var(--mut);font-size:12.5px}
@media (max-width:720px){.kv{grid-template-columns:1fr}header.top h1{font-size:20px}.sec{padding:14px 12px}}
`;
function renderizar(DATOS) {
  const cliente = fs.readFileSync(path.join(__dirname, 'informe-cliente.js'), 'utf8'); const secciones = fs.readFileSync(path.join(__dirname, 'informe-secciones.js'), 'utf8');
  const BS = String.fromCharCode(92); const json = JSON.stringify(DATOS).split('<').join(BS + 'u003c').split(String.fromCharCode(8232)).join(BS + 'u2028').split(String.fromCharCode(8233)).join(BS + 'u2029');   // nunca puede cerrarse el <script> desde los datos
  const idx = [['resumen', 'Lo esencial'], ['s1', '1 Estado'], ['s2', '2 Congelados'], ['s3', '3 No congelados'], ['s4', '4 Exchanges'], ['s5', '5 Cross-chain'], ['s6', '6 Sin localizar'], ['s7', '7 Balance y libro'], ['s8', '8 Retenidos'], ['s9', '9 Swaps'], ['s10', '10 DeFi'], ['s11', '11 Tras la foto'], ['s12', '12 Pendientes'], ['s13', '13 Rastro perdido (NUEVO)'], ['s14', '14 Polytrop (NUEVO)'], ['s15', '15 Arkham (NUEVO)'], ['s16', '16 Cuenta de gas (NUEVO v0.3)'], ['s17', '17 Dos vías de pureza (NUEVO v0.5)'], ['fichas', 'Fichas'], ['libro', 'Libro mayor'], ['calidad', 'Calidad'], ['fuentes', 'Fuentes'], ['novedades', 'Novedades']];
  const nov = DATOS.novedades.length ? DATOS.novedades[DATOS.novedades.length - 1] : null;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${DATOS.titulo}</title><style>${CSS}</style></head><body>
<header class="top"><h1>${DATOS.titulo}</h1><div class="sub">Datos hasta <b>${DATOS.corte.replace('T', ' ').slice(0, 16)} UTC</b> · generado el ${DATOS.generado.replace('T', ' ').slice(0, 16)} UTC${nov ? ' · versión <b>' + nov.version + '</b>' : ''} · los datos de cada sección llevan su fecha y su estado.</div>
<p class="muted peq">Estados: <span class="est est-VERIFICADO">VERIFICADO</span> evidencia directa · <span class="est est-ESTIMADO">ESTIMADO</span> cálculo con un modelo declarado · <span class="est est-HIPOTESIS">HIPOTESIS</span> por demostrar · <span class="est est-DESCONOCIDO">DESCONOCIDO</span> sin datos · <span class="est est-PENDIENTE">PENDIENTE</span> investigación abierta. Pulsa una fila con borde para desplegarla; pulsa una cabecera para ordenar.</p></header>
${DATOS.parcial ? '<div class="sec" style="margin:0 24px 0;border-color:var(--warn)"><b>VERSIÓN PARCIAL.</b> El reparto anterior a la foto (tramo 6) y la lectura de las direcciones EVM de Polytrop siguen en curso cuando se generó este informe; las cifras de esas partes pueden cambiar. Lo marcado <b>NUEVO</b> se añadió en esta versión.</div>' : ''}<nav class="idx">${idx.map(([id, t]) => `<a href="#${id}">${t}</a>`).join('')}</nav><main id="contenido"></main>
<footer>Informe generado por ChainScope · libro mayor de trazabilidad. Un descuadre del modelo de atribución no es una pérdida económica demostrada. ${DATOS.revision || 'Revisión adversarial externa pendiente.'}</footer>
<script>window.DATOS=${json};</script><script>${cliente}</script><script>${secciones}</script></body></html>`;
}
module.exports = { renderizar };
