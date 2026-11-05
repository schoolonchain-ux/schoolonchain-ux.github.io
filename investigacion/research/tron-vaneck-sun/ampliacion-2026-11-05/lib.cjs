'use strict';
// Biblioteca de LECTURA de la cadena TRON para la investigación de la energía de Binance (5-nov-2026).
// Reglas: solo lee (TronGrid/TronScan); guarda cada respuesta EN BRUTO con fecha y huella SHA-256 en raw/<sesion>/;
// con REPRODUCIR=1 no sale a internet: reconstruye todo desde raw/. Las claves de API se leen del fichero de configuración del
// propietario en memoria y NUNCA se escriben en ningún resultado.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const DIR = __dirname; const REPRO = process.env.REPRODUCIR === '1';
let sesion = 'sin-sesion', keys = null; const metricas = { llamadas: 0, red: 0, desdeRaw: 0, ms: 0, errores: 0, reintentos: 0 };
const sleep = ms => new Promise(r => setTimeout(r, ms)); const sha = s => crypto.createHash('sha256').update(s).digest('hex');
function usar(s) { sesion = s; fs.mkdirSync(path.join(DIR, 'raw', s), { recursive: true }); }
function claves() { if (!keys) { const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs'); keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' }); } return keys; }
function cabeceras(url) { const h = { accept: 'application/json', 'content-type': 'application/json' }; const k = claves(); if (/trongrid/.test(url) && k.tronGridKey) h['TRON-PRO-API-KEY'] = k.tronGridKey; if (/tronscan/.test(url) && k.tronscanKey) h['TRON-PRO-API-KEY'] = k.tronscanKey; return h; }
async function llamar(metodo, url, body, opc) {
  opc = opc || {}; const pedido = { metodo, url, body: body || null }; const id = sha(JSON.stringify(pedido)).slice(0, 20); const f = path.join(DIR, 'raw', sesion, id + '.json'); metricas.llamadas++;
  if (fs.existsSync(f)) { metricas.desdeRaw++; return JSON.parse(fs.readFileSync(f, 'utf8')).respuesta; }
  if (REPRO) throw new Error('REPRODUCIR=1 pero falta en raw/' + sesion + ': ' + metodo + ' ' + url + ' ' + JSON.stringify(body));
  let ultimo = null;
  for (let i = 0; i < 6; i++) {
    await sleep(opc.pausa || 350); const t0 = Date.now();
    try {
      const r = await fetch(url, { method: metodo, headers: cabeceras(url), body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
      if (r.status === 429 || r.status >= 500) { metricas.reintentos++; await sleep(2000 * (i + 1)); continue; }
      const txt = await r.text(); let j; try { j = JSON.parse(txt); } catch { j = { _noJson: txt.slice(0, 500) }; }
      metricas.red++; metricas.ms += Date.now() - t0;
      fs.writeFileSync(f, JSON.stringify({ pedido, fecha: new Date().toISOString(), http: r.status, sha256: sha(txt), respuesta: j }));
      return j;
    } catch (e) { ultimo = e; metricas.reintentos++; await sleep(1500 * (i + 1)); }
  }
  metricas.errores++; throw new Error('sin respuesta tras 6 intentos: ' + url + ' (' + (ultimo && ultimo.message) + ')');
}
const post = (url, body, o) => llamar('POST', url, body, o), get = (url, o) => llamar('GET', url, null, o);
function guardar(ruta, obj) { fs.mkdirSync(path.dirname(ruta), { recursive: true }); fs.writeFileSync(ruta, JSON.stringify(obj, null, 1)); return sha(fs.readFileSync(ruta, 'utf8')); }
module.exports = { usar, post, get, guardar, sha, sleep, metricas, REPRO, DIR };
