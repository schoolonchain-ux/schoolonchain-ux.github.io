'use strict';
// Pata de CHAINFLIP del libro mayor. El USDT que entra en la bóveda de Chainflip en TRON llega por «canales de depósito» (un contrato por cambio). Para cada cambio, el explorador y la API de estado de Chainflip dan
// el hash del depósito en TRON, el hash de la salida en la cadena de destino, la dirección de destino y los importes. Un cambio es UN grupo «puente»: el depósito (envío) se enlaza con la salida (recibo) y se concilian
// en dólares (el activo cambia; la diferencia son comisiones y deslizamiento, ESTIMADO). Si el hash del depósito no coincide con ninguna transferencia ya anotada, el cambio NO se enlaza (se cuenta aparte).
const fs = require('node:fs'); const path = require('node:path');
const j = f => JSON.parse(fs.readFileSync(f, 'utf8')); const existe = f => fs.existsSync(f);
const ACTIVO = { 'Ethereum ETH': ['ETH', 18, 'ethereum'], 'Ethereum USDT': ['USDT', 6, 'ethereum'], 'Ethereum USDC': ['USDC', 6, 'ethereum'], 'Bitcoin BTC': ['BTC', 8, 'bitcoin'], 'Solana SOL': ['SOL', 9, 'solana'], 'Solana USDC': ['USDC', 6, 'solana'], 'Solana USDT': ['USDT', 6, 'solana'], 'Arbitrum USDC': ['USDC', 6, 'arbitrum'], 'Arbitrum USDT': ['USDT', 6, 'arbitrum'], 'Arbitrum ETH': ['ETH', 18, 'arbitrum'], 'Tron USDT': ['USDT', 6, 'tron'], 'Tron TRX': ['TRX', 6, 'tron'] };
const NOMBRE = { ethereum: 'Ethereum', bitcoin: 'Bitcoin', solana: 'Solana', arbitrum: 'Arbitrum', tron: 'TRON' };

// `verificadas`: mapa hash-de-salida → true si el explorador de la cadena de destino confirmó que el receptor recibió ese importe.
function añadirAlLibro(L, T5, { verificadas = null } = {}) {
  const fD = path.join(T5, 'chainflip-destinos.json'), fL = path.join(T5, 'chainflip-llegadas.json'); if (!existe(fD) || !existe(fL)) return null;
  const D = j(fD), LL = j(fL); const resumen = { elegibles: 0, verificadas: 0, reembolsos: 0, reembolsoUsd: 0, reembolsadosEnteros: 0, ajenos: 0, cambios: 0, enlazados: 0, noEnlazados: 0, sinSalida: 0, otrosActivos: 0, entradaUsd: 0, salidaUsd: 0, porDestino: {}, destinos: new Map(), noEnlazadosUsd: 0 };
  const porTx = new Map(); for (const m of L.movs) { if (m.cadena !== 'tron') continue; const k = m.tx; (porTx.get(k) || porTx.set(k, []).get(k)).push(m); }
  for (const [canal, v] of Object.entries(D)) for (const c of v.canales || []) for (const s of c.cambios) {
    const a = LL[String(s.nativeId)]; if (!a || a.error || a.noEncontrada) continue; resumen.cambios++; if (!a.nuestro) { resumen.ajenos++; continue; }   // un canal puede recibir depósitos de otras personas: solo se anotan los cambios cuyo depósito hizo una billetera del recorrido
    const reemb = a.reembolso && a.reembolso.tx ? a.reembolso : null; const dep0 = a.deposito && a.deposito.tx; const env0 = (porTx.get(dep0) || []).find(m => m.a === canal);
    let recReemb = null; if (reemb) { const imp = Number(BigInt(reemb.importe)) / 1e6; const decOrigen = /USDT$/.test(a.origen || '') ? 'USDT' : null;
      if (decOrigen) { recReemb = L.mov({ cadena: 'tron', tx: reemb.tx, indice: 'cf-reemb:' + s.nativeId, activo: 'USDT', importe: imp, de: 'puente:chainflip', a: a.direccionReembolso || 'dirección de reembolso desconocida', t: reemb.hora, tipo: 'puente_recibo', estado: 'ESTIMADO', usd: imp, usdEstado: 'ESTIMADO', grupo: 'puente:cf:' + s.nativeId, fuente: 'API de estado de Chainflip (reembolso)', nota: 'REEMBOLSO del cambio ' + s.nativeId + ': el dinero vuelve a la cadena de origen' }); resumen.reembolsos++; resumen.reembolsoUsd += imp; } }
    const info = ACTIVO[a.destino]; if (!info) { resumen.otrosActivos++; continue; }
    if (!a.salida || !a.salida.tx) { resumen.sinSalida++; if (recReemb && env0) { env0.tipo = 'puente_envio'; env0.nota = 'Chainflip: cambio ' + s.nativeId + ' REEMBOLSADO entero en TRON'; const dif0 = s.entradaUsd - recReemb.usd; L.grupos.set('puente:cf:' + s.nativeId, { id: 'puente:cf:' + s.nativeId, tipo: 'puente', envio: env0.id, recibo: recReemb.id, comision: null, diferencia: dif0, diferenciaUsd: dif0, enviadoUsd: s.entradaUsd, recibidoUsd: recReemb.usd, revertido: true, estado: Math.abs(dif0) / Math.max(1, s.entradaUsd) <= 0.05 ? 'ESTIMADO' : 'DESCONOCIDO', nota: 'reembolso entero' }); resumen.reembolsadosEnteros++; } continue; }
    const dep = a.deposito && a.deposito.tx; const env = (porTx.get(dep) || []).find(m => m.a === canal);
    if (!env) { resumen.noEnlazados++; resumen.noEnlazadosUsd += s.entradaUsd; }
    const [activo, dec, cadena] = info; const importe = Number(BigInt(a.salida.importe)) / 10 ** dec; const t = a.salida.hora; const usd = s.salida ? s.salida.usd : null;
    const verif = verificadas ? !!verificadas[a.salida.tx] : null;
    const rec = L.mov({ cadena, tx: a.salida.tx, indice: 'cf:' + s.nativeId, activo, importe, de: 'puente:chainflip', a: a.direccionDestino, t, tipo: 'puente_recibo', estado: verif === true ? 'VERIFICADO' : 'ESTIMADO', ...(usd != null ? { usd, usdEstado: 'ESTIMADO' } : {}), grupo: 'puente:cf:' + s.nativeId, fuente: 'API de estado de Chainflip' + (verif === true ? ' + llegada confirmada en el explorador de ' + NOMBRE[cadena] : ''), nota: 'Chainflip · cambio ' + s.nativeId + ' · depósito en TRON ' + dep });
    if (env) { env.tipo = 'puente_envio'; env.nota = 'Chainflip → ' + NOMBRE[cadena] + ' (' + activo + ') · cambio ' + s.nativeId; }
    const usdTotal = usd == null ? null : usd + (recReemb ? recReemb.usd : 0); const dif = usdTotal == null ? null : s.entradaUsd - usdTotal; const g = { id: 'puente:cf:' + s.nativeId, tipo: 'puente', envio: env ? env.id : null, recibo: rec.id, comision: null, diferencia: dif, diferenciaUsd: dif, enviadoUsd: s.entradaUsd, recibidoUsd: usdTotal, revertido: false, reembolsoParcial: !!recReemb, estado: !env ? 'PENDIENTE' : (dif == null ? 'DESCONOCIDO' : (Math.abs(dif) / Math.max(1, s.entradaUsd) <= 0.05 ? 'ESTIMADO' : 'DESCONOCIDO')), nota: !env ? 'el hash del depósito (' + dep + ') no coincide con ninguna transferencia ya anotada' : '' };
    L.grupos.set(g.id, g); if (env) resumen.enlazados++;
    if (['ethereum', 'arbitrum'].includes(cadena) && ['ETH', 'USDT', 'USDC'].includes(activo)) { resumen.elegibles++; if (verif === true) resumen.verificadas++; }
    resumen.entradaUsd += s.entradaUsd; resumen.salidaUsd += usd || 0; const k = NOMBRE[cadena] + ' ' + activo; const x = resumen.porDestino[k] || (resumen.porDestino[k] = { cadena: NOMBRE[cadena], activo, n: 0, entradaUsd: 0, salidaUsd: 0 }); x.n++; x.entradaUsd += s.entradaUsd; x.salidaUsd += usd || 0;
    const dk = cadena + ':' + a.direccionDestino.toLowerCase(); const d = resumen.destinos.get(dk) || { cadena, direccion: a.direccionDestino, activo, n: 0, usd: 0, importe: 0, primera: t, ultima: t }; d.n++; d.usd += usd || 0; d.importe += importe; d.primera = Math.min(d.primera, t); d.ultima = Math.max(d.ultima, t); resumen.destinos.set(dk, d);
  }
  resumen.destinos = [...resumen.destinos.values()].sort((x, y) => y.usd - x.usd); return resumen;
}

// Relevos por la bóveda: depósito sin cambio registrado + pago de la bóveda de importe = depósito − comisión fija (completar-relevos-chainflip.cjs). Es una INFERENCIA por importe y hora: ESTIMADO.
function añadirRelevos(L, T5) {
  const f = path.join(T5, 'relevos-informe.json'); if (!existe(f)) return null; const R = j(f); const res = { parejas: 0, enlazadas: 0, usd: 0, comisionUsdt: 0, sinPareja: R.sinPareja, depositosSinCambio: R.depositosSinCambio };
  const porTx = new Map(); for (const m of L.movs) { if (m.cadena !== 'tron') continue; (porTx.get(m.tx) || porTx.set(m.tx, []).get(m.tx)).push(m); }
  for (const p of R.parejasLista) { const env = (porTx.get(p.deposito) || []).find(m => m.a === p.canal); const t = p.hora + p.minutos * 60000;
    const rec = L.mov({ cadena: 'tron', tx: p.pago, indice: 'relevo', activo: 'USDT', importe: p.pagado, de: 'puente:chainflip', a: p.receptor, t, tipo: 'puente_recibo', estado: 'ESTIMADO', usd: p.pagado, usdEstado: 'ESTIMADO', grupo: 'puente:relevo:' + p.deposito, fuente: 'pago de la bóveda de Chainflip (TronScan) emparejado por importe y hora', nota: 'Relevo: depósito ' + p.deposito + ' de ' + p.importe.toLocaleString('es-ES') + ' USDT; pago ' + p.minutos + ' min después con comisión de ' + p.comision + ' USDT' });
    if (env) { env.tipo = 'puente_envio'; env.nota = 'Chainflip (relevo): el pago de vuelta llegó a ' + p.receptor; res.enlazadas++; }
    L.grupos.set('puente:relevo:' + p.deposito, { id: 'puente:relevo:' + p.deposito, tipo: 'puente', envio: env ? env.id : null, recibo: rec.id, comision: p.comision, diferencia: p.comision, diferenciaUsd: p.comision, enviadoUsd: p.importe, recibidoUsd: p.pagado, revertido: false, estado: env ? 'ESTIMADO' : 'PENDIENTE', nota: 'emparejado por importe (depósito − comisión fija) y hora; no hay referencia de transacción que lo demuestre' });
    res.parejas++; res.usd += p.importe; res.comisionUsdt += p.comision; }
  return res;
}
module.exports = { añadirAlLibro, añadirRelevos, ACTIVO };
