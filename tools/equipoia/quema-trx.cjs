'use strict';
// Prepara el fichero de datos de la pestaña «Quema y emisión» de TRX (data/quema-trx.json): cuántos TRX se crean y cuántos se queman, por trimestre y por año,
// y si la oferta de TRX está creciendo o bajando ahora. Mismo cálculo que research/tron-burn/analyze.py (la prueba de abajo lo compara), con la serie diaria
// leída HOY de TronScan (/api/turnover?type=0&from=issuance, una sola llamada, sin clave).
//   emisión = pago por bloque a los validadores + recompensa a votantes ; neto = emisión − quema ; si el neto es positivo la oferta crece.
// Uso: node quema-trx.cjs <salida.json> [--crudo serie.json]   (--crudo no usa la red: calcula con una serie guardada, para comprobar contra analyze.py)
const fs = require('node:fs');
const SALIDA = process.argv[2];
if (!SALIDA) { console.error('Uso: node quema-trx.cjs <salida.json> [--crudo serie.json]'); process.exit(1); }
const i = process.argv.indexOf('--crudo'), CRUDO = i > 0 ? process.argv[i + 1] : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mediana = (a) => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

async function leer() {
  if (CRUDO) return { data: JSON.parse(fs.readFileSync(CRUDO, 'utf8').replace(/^﻿/, '')).data, leidoEn: new Date().toISOString() };
  for (let k = 1; k <= 3; k++) {
    try {
      const r = await fetch('https://apilist.tronscanapi.com/api/turnover?type=0&from=issuance', { headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0 (School On-Chain web publisher)' }, signal: AbortSignal.timeout(60000) });
      if (r.ok) { const j = await r.json(); if (j && Array.isArray(j.data)) return { data: j.data, leidoEn: new Date().toISOString() }; }
    } catch { /* se reintenta */ }
    await sleep(3000 * k);
  }
  console.error('SERIE_NO_DISPONIBLE'); process.exit(2);
}

(async () => {
  const { data, leidoEn } = await leer();
  const filas = data.map((x) => ({ dia: x.day, emision: Number(x.total_produce), quema: Number(x.total_burn), oferta: Number(x.total_turn_over), precio: Number(x.price) }))
    .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.dia) && [r.emision, r.quema, r.oferta].every(Number.isFinite)).sort((a, b) => (a.dia < b.dia ? -1 : 1));
  if (filas.length < 1500) { console.error('SERIE_CORTA ' + filas.length); process.exit(2); }
  for (const r of filas) r.neto = r.emision - r.quema;
  // coherencia: lo que cambia la oferta de un día al siguiente debe ser (casi siempre) la emisión menos la quema
  const desv = filas.slice(1).map((r, k) => Math.abs(r.oferta - filas[k].oferta - r.neto));
  const coherencia = { desviacionMedianaTrx: Math.round(mediana(desv)), desviacionMaximaTrx: Math.round(Math.max(...desv)), diasConMasDe5Trx: desv.filter((x) => x > 5).length, de: desv.length };
  const tr = {}, an = {};
  for (const r of filas) {
    const y = r.dia.slice(0, 4), m = Number(r.dia.slice(5, 7)), q = y + '-T' + (Math.floor((m - 1) / 3) + 1);
    const a = (tr[q] ||= { dias: 0, emision: 0, quema: 0, quemaUsd: 0 }); a.dias++; a.emision += r.emision; a.quema += r.quema; a.quemaUsd += r.quema * r.precio;
    const b = (an[y] ||= { dias: 0, emision: 0, quema: 0 }); b.dias++; b.emision += r.emision; b.quema += r.quema;
  }
  const trimestres = Object.entries(tr).map(([q, a]) => ({ q, dias: a.dias, emision: Math.round(a.emision), quema: Math.round(a.quema), neto: Math.round(a.emision - a.quema), quemaUsd: Math.round(a.quemaUsd) }));
  const anios = Object.entries(an).map(([y, a]) => ({ y, dias: a.dias, emision: Math.round(a.emision), quema: Math.round(a.quema), neto: Math.round(a.emision - a.quema) }));
  // suma móvil de 30 días del neto → cuándo cambió de signo y cuánto lleva así
  const roll = []; let suma = 0;
  filas.forEach((r, k) => { suma += r.neto; if (k >= 30) suma -= filas[k - 30].neto; if (k >= 29) roll.push({ dia: r.dia, v: suma }); });
  const ultNeg = roll.filter((x) => x.v < 0).map((x) => x.dia).pop() || null;
  const primPos = ultNeg ? (roll.find((x) => x.dia > ultNeg && x.v > 0) || {}).dia || null : null;
  const desde = primPos ? roll.filter((x) => x.dia >= primPos) : [];
  const u = filas[filas.length - 1], f30 = filas.slice(-30), h30 = filas[filas.length - 31];
  const salida = {
    version: 1, leidoEn, desde: filas[0].dia, hasta: u.dia, dias: filas.length, coherencia,
    actual: {
      dia: u.dia, emisionDia: Math.round(u.emision), quemaDia: Math.round(u.quema), netoDia: Math.round(u.neto), ofertaTrx: Math.round(u.oferta), precioUsd: u.precio,
      emision30d: Math.round(f30.reduce((s, r) => s + r.emision, 0)), quema30d: Math.round(f30.reduce((s, r) => s + r.quema, 0)), neto30d: Math.round(f30.reduce((s, r) => s + r.neto, 0)),
      cambioOferta30d: h30 ? Math.round(u.oferta - h30.oferta) : null,
    },
    regimen: { ultimoDiaDeflacionario30d: ultNeg, primerDiaInflacionario30d: primPos, diasInflacionarios: desde.filter((x) => x.v > 0).length, diasDesdeEntonces: desde.length },
    trimestres, anios,
    // los últimos 400 días, día a día (emisión y quema en TRX, precio en dólares): los usa la página de fundamentales para dibujar ingresos frente a emisión; campo añadido el 9-nov-2026, el resto del fichero no cambia
    ultimos400: filas.slice(-400).map((r) => [r.dia, Math.round(r.emision), Math.round(r.quema), r.precio]),
    fuente: 'TronScan /api/turnover?type=0&from=issuance (serie diaria de emisión, quema y oferta)',
  };
  fs.writeFileSync(SALIDA, JSON.stringify(salida, null, 1));
  console.log('OK quema: ' + filas.length + ' días hasta ' + u.dia + ' · neto 30 d ' + Math.round(salida.actual.neto30d / 1e6 * 10) / 10 + ' M TRX · coherencia: ' + coherencia.diasConMasDe5Trx + ' de ' + coherencia.de + ' días difieren más de 5 TRX');
})().catch((e) => { console.error('ERROR', String(e && e.stack || e).slice(0, 400)); process.exit(1); });
