'use strict';
// Para cada cambio de Chainflip (chainflip-destinos.json) pregunta a la API pública de estado de Chainflip: estado, hash del depósito en TRON, hash de la SALIDA en la cadena de destino, importes, comisiones y dirección de reembolso.
// Un canal de Chainflip puede haber recibido depósitos de otras personas: solo se marcan como «nuestro» los cambios cuyo hash de depósito es una salida de una billetera del recorrido (caché del tramo).
// El hash de la salida permite comprobar la llegada en el explorador de la cadena de destino. Solo lectura.
// Uso: node chainflip-llegadas.cjs <carpeta-del-tramo>  → <tramo>/chainflip-llegadas.json (reanudable)
const fs = require('node:fs'); const path = require('node:path');
const dir = process.argv[2]; if (!dir) { console.error('uso: node chainflip-llegadas.cjs <carpeta-del-tramo>'); process.exit(1); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function api(id) { for (let i = 0; i < 6; i++) { try { const r = await fetch('https://chainflip-swap.chainflip.io/v2/swaps/' + id, { signal: AbortSignal.timeout(30000) }); if (r.status === 429) { await sleep(3000 * (i + 1)); continue; } if (r.status === 404) return { noEncontrada: true }; return await r.json(); } catch { await sleep(1500 * (i + 1)); } } return { error: 'sin lectura' }; }
(async () => {
  const CF = JSON.parse(fs.readFileSync(path.join(dir, 'chainflip-destinos.json'), 'utf8')); const ids = new Map();
  for (const [canal, v] of Object.entries(CF)) for (const c of v.canales || []) for (const s of c.cambios) ids.set(String(s.nativeId), { canal, entradaUsd: s.entradaUsd });
  const pref = path.basename(dir.replace(/[\\/]+$/, '')).replace(/-v\d+$/, ''); const { rec } = JSON.parse(fs.readFileSync(path.join(dir, pref + '-cache.json'), 'utf8'));
  const nuestros = new Map(); for (const [w, r] of Object.entries(rec)) for (const e of r.sal || []) nuestros.set(e.tx, { remitente: w, a: e.a, v: e.v, at: e.at, sim: e.sim });
  const out = path.join(dir, 'chainflip-llegadas.json'); let S = {}; try { S = JSON.parse(fs.readFileSync(out, 'utf8')); } catch { /* primera vez */ }
  const cola = [...ids.keys()].filter(i => !S[i] || S[i].error); console.log('cambios', ids.size, '| por consultar', cola.length); let n = 0;
  async function trab() { while (cola.length) { const id = cola.shift(); const j = await api(id);
    if (j.error || j.noEncontrada) S[id] = j.error ? { error: j.error } : { noEncontrada: true };
    else S[id] = { canal: ids.get(id).canal, estado: j.state, origen: j.srcChain + ' ' + j.srcAsset, destino: j.destChain + ' ' + j.destAsset, direccionDestino: j.destAddress, deposito: j.deposit ? { importe: Number(j.deposit.amount), tx: j.deposit.txRef, hora: j.deposit.witnessedAt } : null, salida: j.swapEgress ? { importe: j.swapEgress.amount, tx: j.swapEgress.txRef, hora: j.swapEgress.witnessedAt } : null, reembolso: j.refundEgress ? { importe: j.refundEgress.amount, tx: j.refundEgress.txRef, hora: j.refundEgress.witnessedAt } : null, direccionReembolso: j.fillOrKillParams && j.fillOrKillParams.refundAddress, comisiones: (j.fees || []).map(f => ({ tipo: f.type, activo: f.asset, importe: f.amount })), broker: (j.brokers || []).map(b => b.commissionBps), leidoEn: new Date().toISOString() };
    await sleep(250); if (++n % 50 === 0) { fs.writeFileSync(out, JSON.stringify(S)); console.log('  …', n); } } }
  await Promise.all([trab(), trab()]);
  for (const v of Object.values(S)) { if (v.error || v.noEncontrada) continue; const o = v.deposito && nuestros.get(v.deposito.tx); if (o && o.a === v.canal) v.nuestro = o; else delete v.nuestro; }
  fs.writeFileSync(out, JSON.stringify(S));
  const est = {}; let conSalida = 0, sin = 0; for (const v of Object.values(S)) { if (v.error || v.noEncontrada) { sin++; continue; } est[v.estado] = (est[v.estado] || 0) + 1; if (v.salida && v.salida.tx) conSalida++; }
  const nu = Object.values(S).filter(v => v.nuestro);
  console.log('consultados', Object.keys(S).length, '| sin dato', sin, '| estados', JSON.stringify(est), '| con hash de salida', conSalida);
  console.log('del recorrido (depósito hecho por una billetera seguida):', nu.length, 'cambios, por', Math.round(nu.reduce((t, v) => t + v.nuestro.v, 0)), 'USDT');
})();
