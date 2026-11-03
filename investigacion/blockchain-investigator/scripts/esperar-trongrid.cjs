'use strict';
// Espera a que TronGrid vuelva a contestar con la clave del proyecto (la cuota diaria de 100.000 consultas se renueva; el 2-nov se agotó). Sale con código 0 cuando responde 200. No imprime la clave.
const path = require('node:path'); const { loadTronKeys } = require('../../tether-blacklist/src/adapters/bot.cjs'); const keys = loadTronKeys({ file: path.join(__dirname, '..', '..', 'tether-blacklist', 'config.secret.json') });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { for (let i = 0; i < 12 * 30; i++) { try { const r = await fetch('https://api.trongrid.io/v1/accounts/TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki', { headers: { 'TRON-PRO-API-KEY': keys.tronGridKey }, signal: AbortSignal.timeout(20000) }); if (r.status === 200) { console.log('TronGrid responde', new Date().toISOString()); process.exit(0); } } catch { /* sin red un momento */ } await sleep(5 * 60 * 1000); } console.log('TronGrid no volvió a responder en 30 h'); process.exit(1); })();
