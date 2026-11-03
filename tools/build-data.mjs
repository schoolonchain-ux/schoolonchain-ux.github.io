#!/usr/bin/env node
// Convierte un informe de trazabilidad (HTML autocontenido con `window.DATOS`) en un `data.json`
// pequeño y ya agregado, listo para dibujar gráficos. No necesita dependencias (solo Node >= 18).
//
//   node tools/build-data.mjs <informe.html> <carpeta-salida>
//
// Escribe en <carpeta-salida>: data.json  (y devuelve por consola un resumen).
import fs from 'node:fs';
import path from 'node:path';

export function extraerDatos(html) {
  const i = html.indexOf('window.DATOS=');
  if (i < 0) throw new Error('El HTML no contiene window.DATOS: no es un informe con este formato.');
  const s = html.indexOf('{', i);
  let depth = 0, inStr = false, esc = false, e = -1;
  for (let k = s; k < html.length; k++) {
    const c = html.charCodeAt(k);
    if (inStr) { if (esc) esc = false; else if (c === 92) esc = true; else if (c === 34) inStr = false; continue; }
    if (c === 34) { inStr = true; continue; }
    if (c === 123) depth++;
    else if (c === 125) { depth--; if (depth === 0) { e = k; break; } }
  }
  if (e < 0) throw new Error('No se pudo cerrar el objeto window.DATOS.');
  return JSON.parse(html.slice(s, e + 1));
}

const r2 = (x) => (x == null || Number.isNaN(x) ? null : Math.round(x * 100) / 100);
const hora = (t) => new Date(t).toISOString().slice(0, 13) + ':00Z';
const esEvm = (d) => typeof d === 'string' && d.startsWith('0x');

export function construir(D) {
  const out = {
    schema: 1,
    titulo: D.titulo, corte: D.corte, generado: D.generado,
    precioTRX: D.precioTRX, precioETH: D.precioETH,
    estados: D.estados,
  };

  // ---- balances (conciliación): dónde está el dinero
  const part = (c) => c && ({
    capital: r2(c.capital), suma: r2(c.suma), diferencia: r2(c.diferencia), porcentaje: c.porcentaje ?? null, nota: c.nota || null,
    partidas: (c.partidas || []).map((p) => ({ nombre: p.nombre, importe: r2(p.importe), estado: p.estado, nota: p.nota || '', fuente: p.fuente || '', desglose: (p.desglose || []).map((d) => ({ fase: d.fase, importe: r2(d.importe) })) })),
  });
  out.tron = part(D.conciliacion);
  out.ethereum = part(D.conciliacionEth);
  out.global = part(D.global);
  out.capital = D.capital && D.capital.resumen ? D.capital.resumen : null;

  // ---- fases (antes / después de la «foto» del 30-oct 22:40 UTC)
  const fase = (f) => f && ({ nombre: f.nombre, capitalUsd: r2(f.capitalUsd), capitalTRX: r2(f.capitalTRX), polvo: r2(f.polvo), sinResolver: r2(f.sinResolver), retenido: r2(f.retenido), suma: r2(f.suma), descuadre: r2(f.descuadre), terminales: Object.fromEntries(Object.entries(f.terminales || {}).map(([k, v]) => [k, { importe: r2(v.importe), n: v.n }])) });
  out.faseA = fase(D.faseA);
  out.faseB = fase(D.faseB);

  // ---- línea temporal: salidas por hora de la billetera de reparto
  out.serieHora = (D.serieHora || []).map((x) => ({ t: x.t, v: r2(x.v), n: x.n }));

  // ---- línea temporal: volumen por hora en TRON por tipo de movimiento + nº de movimientos
  const ADDR = D.dir || [];
  const tipos = D.tipos || [];
  const grupo = (nombre) => /^transferencia$/.test(nombre) ? 'Transferencias' : /contrato/.test(nombre) ? 'Contratos (depósito / retirada)' : /swap/.test(nombre) ? 'Cambios (swaps)' : /puente/.test(nombre) ? 'Puentes' : 'Otros';
  const dias = new Map();
  const mv = D.movs || [];
  for (const m of mv) {
    if (!m[7] || esEvm(ADDR[m[2]])) continue;
    const d = hora(m[7]); const g = grupo(tipos[m[8]] || '');
    const x = dias.get(d) || { n: 0, usd: {} };
    x.n++; x.usd[g] = (x.usd[g] || 0) + (m[6] || 0);
    dias.set(d, x);
  }
  const ordenDias = [...dias.keys()].sort();
  const grupos = ['Transferencias', 'Contratos (depósito / retirada)', 'Cambios (swaps)', 'Puentes', 'Otros'];
  out.porHora = { horas: ordenDias, n: ordenDias.map((d) => dias.get(d).n), series: Object.fromEntries(grupos.map((g) => [g, ordenDias.map((d) => r2(dias.get(d).usd[g] || 0))])) };

  // ---- línea temporal: USDT congelado acumulado en TRON (eventos AddedBlackList)
  if (D.congTron && D.congTron.filas) {
    const ev = D.congTron.filas.filter((f) => f.t && f.usdt != null).sort((a, b) => a.t - b.t);
    let acum = 0;
    out.congelacionTron = {
      direcciones: D.congTron.direcciones, bloqueadasHoy: D.congTron.bloqueadasHoy, usdtVigente: r2(D.congTron.usdtCongeladoVigente), leidoEn: D.congTron.leidoEn,
      serie: ev.map((f) => { acum += f.usdt; return { t: f.t, direccion: f.direccion, usdt: r2(f.usdt), acumulado: r2(acum) }; }),
    };
  }

  // ---- Ethereum
  if (D.eth) {
    const ent = [];
    for (const a of D.eth.activos || []) {
      const stable = ['USDT', 'USDC', 'USD1', 'FDUSD'].includes(a.activo);
      for (const x of a.txEntrada || []) ent.push({ t: x.t, activo: a.activo, usd: stable ? x.cantidad : x.cantidad * (D.precioETH || 0) * (a.activo === 'ETH' ? 1 : 0) });
    }
    for (const x of (D.eth.ethDirecto && D.eth.ethDirecto.entradas) || []) ent.push({ t: x.t, activo: 'ETH', usd: x.cantidad * (D.precioETH || 0) });
    ent.sort((a, b) => a.t - b.t);
    out.ethereumEntradas = ent.filter((x) => x.usd > 0).map((x) => ({ t: x.t, activo: x.activo, usd: r2(x.usd) }));
    out.ethereumCongelado = D.eth.congeladoPorActivo || null;
    out.ethereumActivos = (D.eth.activos || []).map((a) => ({ activo: a.activo, entro: r2(a.entro), salio: r2(a.salio), usdEntro: r2(a.usdEntro), nE: a.nE, nS: a.nS }));
    out.ethereumQuieto = { eth: r2(D.eth.ethQuietoHoy), usd: r2(D.eth.ethQuietoUsd) };
  }

  // ---- puentes entre cadenas
  const cr = D.cruces || {};
  out.puentes = {
    usdt0: D.puentesResumen ? { n: D.puentesResumen.n, enviado: r2(D.puentesResumen.enviado), recibido: r2(D.puentesResumen.recibido), entregados: D.puentesResumen.entregados, sinEntregar: (D.puentesResumen.sinEntregar || []).length } : null,
    symbiosis: cr.symbiosis ? { envios: cr.symbiosis.envios, ok: cr.symbiosis.ok, revertidos: cr.symbiosis.revertidos, enviadoUsd: r2(cr.symbiosis.enviadoUsd), recibidoUsd: r2(cr.symbiosis.recibidoUsd), porActivoDestino: (cr.symbiosis.porActivoDestino || []).map((x) => ({ cadena: x.cadena, activo: x.activo, n: x.n, usd: r2(x.usd) })) } : null,
    chainflip: cr.chainflip ? { cambiosNuestros: cr.chainflip.cambiosNuestros, cambiosAjenos: cr.chainflip.cambiosAjenos, entradaUsd: r2(cr.chainflip.entradaUsd), salidaUsd: r2(cr.chainflip.salidaUsd), porDestino: (cr.chainflip.porDestino || []).map((x) => ({ cadena: x.cadena, activo: x.activo, n: x.n, entradaUsd: r2(x.entradaUsd), salidaUsd: r2(x.salidaUsd) })) } : null,
    across: cr.across ? { envios: cr.across.envios, bruto: r2(cr.across.bruto) } : null,
    prefunded: cr.prefunded ? { n: cr.prefunded.n, atribuido: r2(cr.prefunded.atribuido) } : null,
  };

  // ---- destinos: casas de cambio, nodos, DeFi (por nombre)
  const porNombre = new Map();
  const T = (D.items && D.items.terminales) || {};
  for (const [clase, lista] of Object.entries(T)) {
    for (const e of lista) {
      const k = clase + '|' + (e.nombre || '(sin nombre)');
      const x = porNombre.get(k) || { clase, nombre: e.nombre || '(sin nombre)', atribuido: 0, n: 0 };
      x.atribuido += e.atribuido || 0; x.n++; porNombre.set(k, x);
    }
  }
  out.destinos = [...porNombre.values()].sort((a, b) => b.atribuido - a.atribuido).slice(0, 25).map((x) => ({ ...x, atribuido: r2(x.atribuido) }));
  out.destinosPorClase = Object.fromEntries(Object.entries(T).map(([c, l]) => [c, { atribuido: r2(l.reduce((s, e) => s + (e.atribuido || 0), 0)), n: l.length }]));

  if (D.casas) {
    out.casas = {
      porCasa: (D.casas.tramo2 || []).map((c) => ({ nombre: c.nombre, n: c.n, bruto: r2(c.bruto), atribuido: r2(c.atribuido), remitentes: c.remitentes })).sort((a, b) => b.bruto - a.bruto),
      verificadas: Object.values((D.casas.verificadas || []).reduce((acc, v) => { const x = acc[v.casa] || (acc[v.casa] = { casa: v.casa, depositos: 0, llegadas: 0, enviado: 0, primera: v.primera, ultima: v.ultima }); x.depositos++; x.llegadas += v.llegadas; x.enviado += v.enviado; x.primera = Math.min(x.primera, v.primera); x.ultima = Math.max(x.ultima, v.ultima); return acc; }, {})).sort((a, b) => b.enviado - a.enviado),
    };
  }

  out.swaps = D.swaps ? { grupos: D.swaps.grupos, porContrato: (D.swaps.porContrato || []).slice(0, 12).map((x) => ({ contrato: x.contrato, nombre: x.nombre, n: x.n, entradaUsd: r2(x.entradaUsd), salidaUsd: r2(x.salidaUsd) })) } : null;

  // ---- pureza: las dos (tres) vías
  if (D.pureza2) out.pureza = { fecha: D.pureza2.fecha, tramos: D.pureza2.tramos.map((t) => ({ nombre: t.nombre, entrada: r2(t.entrada), vias: Object.fromEntries(Object.entries(t.vias).map(([k, v]) => [k, { destinos: r2(v.destinos), retenido: r2(v.retenido), polvo: r2(v.polvo), sinResolver: r2(v.sinResolver), suma: r2(v.suma), relacion: v.relacion }])), billeterasCambian: t.billeterasCambian, billeterasTotal: t.billeterasTotal })) };

  // ---- dónde se pierde el rastro
  if (D.perdida) {
    const por = {};
    for (const p of D.perdida) { const k = p.grupo + ' · ' + p.clase; const x = por[k] || (por[k] = { grupo: p.grupo, clase: p.clase, n: 0, atribuido: 0 }); x.n++; x.atribuido += p.atribuido || 0; }
    out.perdida = { total: D.perdida.length, grupos: Object.values(por).map((x) => ({ ...x, atribuido: r2(x.atribuido) })).sort((a, b) => b.atribuido - a.atribuido), top: D.perdida.slice().sort((a, b) => (b.atribuido || 0) - (a.atribuido || 0)).slice(0, 15).map((p) => ({ direccion: p.direccion, nombre: p.nombre, grupo: p.grupo, red: p.red, atribuido: r2(p.atribuido), envios: p.envios })) };
  }

  // ---- cruces externos
  if (D.arkham) out.arkham = { total: D.arkham.total, usd: r2(D.arkham.usd), porRed: Object.fromEntries(Object.entries(D.arkham.porRed || {}).map(([k, v]) => [k, { n: v.n, usd: r2(v.usd), hashNuestro: v.hashNuestro }])), hashNuestro: D.arkham.hashNuestro, desde: D.arkham.desde, hasta: D.arkham.hasta };
  if (D.polytrop) out.polytrop = { fecha: D.polytrop.fecha, csvDirecciones: D.polytrop.csvDirecciones, cuenta: D.polytrop.cuenta, noTenemosPorRed: D.polytrop.noTenemosPorRed, tronCreadas: D.polytrop.tron && D.polytrop.tron.creadas };
  if (D.gas) out.gas = { cuenta: D.gas.cuenta, desde: D.gas.desde, hasta: D.gas.hasta, tipos: D.gas.tipos };

  out.calidad = (D.calidad || []).map((c) => ({ id: c.id, titulo: c.titulo, estado: c.estado, detalle: c.detalle }));
  out.pendientes = (D.pendientes || []).map((p) => ({ id: p.id, t: p.t, est: p.est, causa: p.causa }));
  out.fuentes = D.fuentes || [];
  out.novedades = D.novedades || [];
  out.revision = D.revision || null;

  // ---- grafo de la red de billeteras (las N con más volumen y los enlaces entre ellas)
  out.red = construirRed(D);
  return out;
}

function construirRed(D, N = 90, L = 260) {
  const ADDR = D.dir || [], cuentas = D.cuentas || [], clases = D.clases || [];
  const cta = new Map(cuentas.map((c) => [c[0], c]));
  const vol = new Map(), arista = new Map();
  for (const m of D.movs || []) {
    const a = m[2], b = m[3], u = m[6] || 0;
    if (a === b || u <= 0) continue;
    vol.set(a, (vol.get(a) || 0) + u); vol.set(b, (vol.get(b) || 0) + u);
    const k = a + '>' + b; const x = arista.get(k) || { a, b, usd: 0, n: 0 }; x.usd += u; x.n++; arista.set(k, x);
  }
  const top = new Set([...vol.entries()].sort((x, y) => y[1] - x[1]).slice(0, N).map((x) => x[0]));
  const nodes = [...top].map((i) => {
    const c = cta.get(i); const d = ADDR[i];
    return { id: d, corto: d.slice(0, 6) + '…' + d.slice(-4), clase: c ? clases[c[1]] : (esEvm(d) ? 'ethereum' : 'desconocida'), nombre: (c && c[2]) || '', usd: r2(vol.get(i)), congelada: !!(c && c[17] === 1), red: esEvm(d) ? 'ethereum' : 'tron' };
  });
  const links = [...arista.values()].filter((e) => top.has(e.a) && top.has(e.b)).sort((x, y) => y.usd - x.usd).slice(0, L).map((e) => ({ source: ADDR[e.a], target: ADDR[e.b], usd: r2(e.usd), n: e.n }));
  const usados = new Set(links.flatMap((l) => [l.source, l.target]));
  return { nodes: nodes.filter((n) => usados.has(n.id)), links, totalCuentas: cuentas.length, totalMovimientos: (D.movs || []).length };
}

// ---- ejecución por línea de comandos
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  const [, , entrada, salida] = process.argv;
  if (!entrada || !salida) { console.error('Uso: node tools/build-data.mjs <informe.html> <carpeta-salida>'); process.exit(1); }
  const D = extraerDatos(fs.readFileSync(entrada, 'utf8'));
  const data = construir(D);
  fs.mkdirSync(salida, { recursive: true });
  const f = path.join(salida, 'data.json');
  fs.writeFileSync(f, JSON.stringify(data));
  console.log('OK', f, (fs.statSync(f).size / 1024).toFixed(0) + ' KB', '| nodos', data.red.nodes.length, '| enlaces', data.red.links.length, '| horas', data.porHora.horas.length);
}
