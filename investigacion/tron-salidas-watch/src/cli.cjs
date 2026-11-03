'use strict';
// Línea de mandos del vigilante de salidas de TRX.
//   node src/cli.cjs ejecutar        un ciclo (lo lanza la tarea de Windows cada 10 min; un cerrojo evita dos a la vez)
//   node src/cli.cjs activar         manda al propietario el aviso de que el vigilante queda en marcha (sirve de prueba de entrega) y hace el primer ciclo
//   node src/cli.cjs estado          qué vigila, última comprobación, billeteras seguidas, últimos avisos
//   node src/cli.cjs probar          lee las cuentas y muestra lo que HABRÍA avisado, sin mandar nada ni guardar nada
// Secretos: clave de TronGrid/TronScan y clave del bot de la blacklist, leídos de tether-blacklist/config.secret.json con los mismos lectores del bot. Nunca se imprimen.
const fs = require('node:fs');
const path = require('node:path');
const V = require('./vigilante.cjs');
const { createChainReader } = require(path.join(V.EQUIPOIA, 'onchain-core', 'src', 'cadena.cjs'));
const { loadBotToken, loadTronKeys } = require(path.join(V.EQUIPOIA, 'tether-blacklist', 'src', 'adapters', 'bot.cjs'));
const { createTelegram } = require(path.join(V.EQUIPOIA, 'telegram-gateway', 'src', 'telegram.cjs'));
const lock = require(path.join(V.EQUIPOIA, 'process-lock.cjs'));

const STATE = path.join(V.ROOT, 'state');
const SECRET = path.join(V.EQUIPOIA, 'tether-blacklist', 'config.secret.json');
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
const log = (ev, data) => { try { fs.mkdirSync(STATE, { recursive: true }); fs.appendFileSync(path.join(STATE, 'ciclos.log.jsonl'), JSON.stringify({ at: new Date().toISOString(), ev, ...data }) + '\n'); } catch { /* el registro no debe tumbar el ciclo */ } };

function armar({ enviarReal = true } = {}) {
  const config = readJson(path.join(V.ROOT, 'config', 'cuentas.json'));
  const conocidas = readJson(path.join(V.ROOT, 'config', 'conocidas.json'));
  const bot = readJson(path.join(V.EQUIPOIA, 'tether-blacklist', 'config', 'bot.json'));
  const keys = loadTronKeys({ file: SECRET });
  const http = async ({ url, method = 'GET', body = null, timeoutMs = 15000 }) => {
    const headers = body ? { 'content-type': 'application/json', accept: 'application/json' } : { accept: 'application/json' };
    if (/api\.trongrid\.io/.test(url) && keys.tronGridKey) headers['TRON-PRO-API-KEY'] = keys.tronGridKey;
    const r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeoutMs) });
    let json = null; try { json = await r.json(); } catch { json = null; }
    return { status: r.status, json };
  };
  const reader = createChainReader({ http, tronscanKey: keys.tronscanKey, log: () => {} });
  // Etiqueta pública de TronScan de una dirección (con clave; sin ella TronScan devuelve HTML y se declara «no leído»).
  const tronscan = async addr => {
    if (!keys.tronscanKey) return { ok: false };
    try {
      const r = await fetch('https://apilist.tronscanapi.com/api/accountv2?address=' + addr, { headers: { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronscanKey }, signal: AbortSignal.timeout(12000) });
      if (r.status !== 200) return { ok: false }; const j = await r.json();
      const tag = j && (j.publicTag || j.addressTag || (j.redTag ? 'Aviso rojo de TronScan: ' + j.redTag : null)); return { ok: true, tag: tag ? String(tag).slice(0, 60) : null };
    } catch { return { ok: false }; }
  };
  const E = V.crearEstado(STATE);
  const nombres = V.crearNombres({ conocidas, etiquetasDb: path.join(V.EQUIPOIA, 'tether-blacklist', 'state', 'etiquetas.sqlite'), lista: (() => { try { return readJson(path.join(V.EQUIPOIA, 'tether-blacklist', 'state', 'desbloqueos-lista.json')); } catch { return null; } })(), tronscan, cache: E.estado.etiquetasVivas, log });
  let enviar;
  if (enviarReal) {
    const tk = loadBotToken({ file: SECRET });
    if (!tk.ok) throw Error('sin clave del bot de la blacklist: ' + tk.reason);
    const tg = createTelegram({ botToken: tk.token, log: () => {} });
    enviar = text => tg.sendMessage({ chat_id: bot.owner_user_id, text });
  } else enviar = async text => { console.log('\n--- AVISO (no enviado) ---\n' + text.replace(/<[^>]+>/g, '')); return { ok: true, simulado: true }; };
  return { config, reader, nombres, enviar, E, precio: V.precioTrx(), ownerId: bot.owner_user_id, keys: { tronGrid: keys.from.tronGrid, tronscan: keys.from.tronscan } };
}

async function conCerrojo(fn) {
  fs.mkdirSync(STATE, { recursive: true });
  const f = path.join(STATE, 'run.lock');
  const l = lock.acquire(f, { que: 'tron-salidas-watch' }, { timeoutMs: 0 });
  if (!l.ok) { console.log('Hay otro ciclo en marcha (pid ' + (l.holder && l.holder.pid) + '); este se salta.'); return 0; }
  try { return await fn(); } finally { lock.release(f); }
}

async function main() {
  const cmd = process.argv[2] || 'estado';
  if (cmd === 'ejecutar' || cmd === 'activar') {
    return conCerrojo(async () => {
      const a = armar();
      if (cmd === 'activar') {
        const lista = a.config.cuentas.map(c => '• <b>' + c.nombre.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</b> ' + V.enlace(c.direccion) + (c.esperado || []).map(e => ' — libres ' + V.fmtTrx(e.trx) + ' el ' + e.fecha.slice(8, 10) + '-' + e.fecha.slice(5, 7)).join('')).join('\n');
        const r = await a.enviar('✅ <b>Vigilante de salidas de TRX en marcha</b>\n' + lista + '\nCada 10 minutos miro si retiran el TRX desbloqueado, si envían o reciben 1 M TRX o más y a dónde va; sigo cada billetera nueva hasta ' + a.config.diasSeguimientoDestinos + ' días para ver si acaba en una casa de cambio. El día del desbloqueo mando un recordatorio por la mañana. Si no hay movimientos, no mando nada.');
        a.E.anotarAviso({ clase: 'activacion', ok: V.entregado(r), message_id: V.idMensaje(r) });
        a.E.estado.arrancado = new Date().toISOString();
        if (!V.entregado(r)) { console.error('No se pudo entregar el aviso de activación: ' + JSON.stringify(r).slice(0, 200)); return 2; }
        console.log('Aviso de activación entregado al propietario.');
      }
      const r = await V.ejecutarCiclo({ reader: a.reader, nombres: a.nombres, enviar: a.enviar, estado: a.E, config: a.config, precio: a.precio, log });
      console.log('Ciclo hecho: ' + r.cuentas + ' cuentas, ' + r.destinos + ' billeteras seguidas, ' + r.hechos + ' hechos nuevos, ' + r.avisos + ' avisos' + (r.errores.length ? ', errores: ' + r.errores.join(' | ') : '') + '. Peticiones a TronGrid: ' + a.reader.requests + '.');
      return r.errores.length ? 1 : 0;
    });
  }
  if (cmd === 'probar') {
    const a = armar({ enviarReal: false });
    // Lectura de las últimas 24 h sin tocar el estado real: estado en memoria aparte.
    const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'tsw-')); const E = V.crearEstado(tmp);
    for (const c of a.config.cuentas) E.estado.cursores[c.direccion] = Date.now() - 24 * 3600000;
    const r = await V.ejecutarCiclo({ reader: a.reader, nombres: a.nombres, enviar: a.enviar, estado: E, config: { ...a.config, horaRecordatorioLocal: 99 }, precio: a.precio, log: () => {} });
    console.log('\nPrueba (últimas 24 h, nada guardado ni enviado): ' + r.hechos + ' hechos' + (r.errores.length ? '; errores: ' + r.errores.join(' | ') : '') + '. Peticiones: ' + a.reader.requests + '. Claves: TronGrid ' + a.keys.tronGrid + ', TronScan ' + a.keys.tronscan + '.');
    fs.rmSync(tmp, { recursive: true, force: true });
    return 0;
  }
  // estado
  const E = V.crearEstado(STATE), S = E.estado, config = readJson(path.join(V.ROOT, 'config', 'cuentas.json'));
  console.log('Vigilante de salidas de TRX');
  console.log('Arrancado: ' + (S.arrancado || 'nunca (ejecuta «activar»)') + ' · último ciclo: ' + (S.ultimoCiclo || '-'));
  for (const c of config.cuentas) console.log('• ' + c.nombre + ' ' + c.direccion + ' · leído hasta ' + (S.cursores[c.direccion] ? new Date(S.cursores[c.direccion]).toISOString() : '-') + (c.esperado || []).map(e => ' · libres ' + V.fmtTrx(e.trx) + ' el ' + e.fecha).join(''));
  const ds = Object.values(S.destinos || {});
  console.log('Billeteras seguidas: ' + ds.filter(d => !d.cerrado).length + ' activas, ' + ds.filter(d => d.cerrado).length + ' cerradas');
  for (const d of ds) console.log('  ' + (d.cerrado ? '✓ ' : '… ') + d.direccion + ' (' + V.fmtTrx(d.trx) + ' desde ' + d.nombreRaiz + ', nivel ' + d.nivel + ')' + (d.cerrado ? ' — ' + d.cerrado : ' — hasta ' + new Date(d.hasta).toISOString().slice(0, 10)));
  if (S.ultimoResumen) console.log('Último ciclo: ' + JSON.stringify(S.ultimoResumen));
  let avisos = []; try { avisos = fs.readFileSync(E.ficheros.avisos, 'utf8').trim().split('\n').filter(Boolean).slice(-5).map(l => JSON.parse(l)); } catch { /* sin avisos */ }
  console.log('Últimos avisos: ' + (avisos.length ? avisos.map(a => a.at.slice(0, 16) + ' ' + a.clase + (a.ok === false ? ' (FALLÓ)' : '')).join(' · ') : 'ninguno'));
  console.log('Fallos seguidos de lectura: ' + (S.fallosSeguidos || 0));
  return 0;
}

main().then(c => process.exit(c), e => { console.error('Error: ' + (e && e.message)); log('error', { error: String(e && e.message).slice(0, 200) }); process.exit(3); });
