'use strict';
// Saca de la foto del informe (reports/justlend-liquidez/data.json, 13-nov-2026) la parte FIJA de cada mercado: identidad (jToken, token, decimales), poderes del emisor,
// concentración de los titulares y el estado de gobierno de referencia. El lector en vivo la completa cada hora con lo que sí cambia (caja, deuda, precios, pausas…).
// Uso: node hacer-catalogo.cjs <data.json del informe>
const fs = require('node:fs'), path = require('node:path');
const f = process.argv[2]; if (!f) { console.error('Uso: node hacer-catalogo.cjs <data.json>'); process.exit(1); }
const d = JSON.parse(fs.readFileSync(f, 'utf8'));
const mercados = d.mercados.map((m) => ({
  jToken: m.jToken, simbolo: m.simbolo, token: m.token, tokenDir: m.tokenDir, decimales: m.decimales, abierto: m.abierto, factorGarantia: m.factorGarantia,
  poderes: m.poderes || null, parteTop3: m.titulares ? m.titulares.parteTop3 : null, reclamoUSDfoto: m.reclamoUSD, cajaUSDfoto: m.cajaUSD,
}));
const g = d.gobierno;
const out = {
  version: 1, fuente: 'foto del informe de JustLend del 13-nov-2026 (reports/justlend-liquidez/data.json)', fecha: d.informe.bloqueHora, bloque: d.informe.bloque, informe: d.informe.doc, huellaInforme: d.informe.huella,
  trxUsdFoto: d.informe.trxUsd,
  gobierno: { comptroller: g.comptroller, implementacion: g.impl, admin: g.admin, pendiente: g.pendiente, guardian: g.guardian, oraculo: g.oraculo, oraculoV1: g.oraculoV1, poster: g.poster, anchorAdmin: g.anchorAdmin, retardoTimelockSeg: 172800 },
  psm: { psm: d.psm.psm, gemJoin: d.psm.gemJoin, usdtEnPSMfoto: d.psm.usdtEnPSM },
  mercados,
};
fs.writeFileSync(path.join(__dirname, 'catalogo.json'), JSON.stringify(out, null, 1));
console.log('catalogo.json:', mercados.length, 'mercados | abiertos', mercados.filter((m) => m.abierto).length, '| gobierno', JSON.stringify(out.gobierno).slice(0, 200));
