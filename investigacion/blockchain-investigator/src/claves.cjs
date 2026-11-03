'use strict';
// Claves gratuitas del propietario (las mismas que usan el bot de blacklist y ChainScope). Se leen SOLO estos campos del archivo; el resto (p. ej. el token de Telegram) no se toca ni se devuelve.
const fs = require('node:fs');
const path = require('node:path');

const ARCHIVO = path.join(__dirname, '..', '..', 'tether-blacklist', 'config.secret.json');
const CAMPOS = Object.freeze(['etherscanKey', 'blockscoutKey', 'tronGridKey', 'tronscanKey']);

function leerClaves(archivo = ARCHIVO) {
  let j = {}; try { j = JSON.parse(fs.readFileSync(archivo, 'utf8')); } catch { return Object.fromEntries(CAMPOS.map(c => [c, null])); }
  return Object.fromEntries(CAMPOS.map(c => [c, typeof j[c] === 'string' && /^[A-Za-z0-9_-]{16,120}$/.test(j[c]) ? j[c] : null]));
}
module.exports = { leerClaves, CAMPOS };
