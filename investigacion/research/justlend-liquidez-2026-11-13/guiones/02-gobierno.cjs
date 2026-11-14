'use strict';
// FASE 2 · Quién controla JustLend y qué puede hacer sobre las retiradas (solo lectura).
// Lee: dueño (admin) y guardián de pausas del Comptroller, su implementación (el contrato es un «proxy» cambiable), parones globales,
// y por cada mercado: dueño, implementación actual, modelo de tipos de interés, y a qué Comptroller pertenece.
const L = require('./lib.cjs'); L.usar('02-2026-11-13'); const A = require('./abi.cjs'); const path = require('node:path');
const C = 'TGjYzgCyPobsNS9n6WcbdLVR9dH7mWqFx7';
const dir = async (c, f) => { const r = await A.llamar(c, f); return r.ok ? A.dirDe(r.hex) : null; };
const bool = async (c, f) => { const r = await A.llamar(c, f); return r.ok ? A.u(r.hex) !== 0n : null; };
const num = async (c, f) => { const r = await A.llamar(c, f); return r.ok ? String(A.u(r.hex)) : null; };
(async () => {
  const m = require('./resultados/01-mercados.json');
  const comp = {
    admin: await dir(C, 'admin()'), pendingAdmin: await dir(C, 'pendingAdmin()'), pauseGuardian: await dir(C, 'pauseGuardian()'), implementacion: await dir(C, 'comptrollerImplementation()'),
    oraculo: await dir(C, 'oracle()'), closeFactorRaw: await num(C, 'closeFactorMantissa()'), incentivoLiquidacionRaw: await num(C, 'liquidationIncentiveMantissa()'),
    transferPausado: await bool(C, 'transferGuardianPaused()'), seizePausado: await bool(C, 'seizeGuardianPaused()'),
    maxAssets: await num(C, 'maxAssets()'),
  };
  // ¿Existe alguna pausa de retirada? Probamos nombres habituales; si el contrato no los tiene, queda «null» (no existe).
  comp.pruebaPausaRetirada = {}; for (const f of ['redeemGuardianPaused()', 'redeemPaused()', 'paused()', 'protocolPaused()']) comp.pruebaPausaRetirada[f] = await bool(C, f);
  console.log('Comptroller', JSON.stringify(comp, null, 1));
  const mercados = [];
  for (const x of m.mercados) {
    const j = x.jToken; mercados.push({ jToken: j, simbolo: x.simbolo, admin: await dir(j, 'admin()'), implementacion: await dir(j, 'implementation()'), comptroller: await dir(j, 'comptroller()'), modeloTipos: await dir(j, 'interestRateModel()'), reservaPorBloqueTope: null });
    process.stdout.write('.');
  }
  console.log();
  const admins = [...new Set(mercados.map(x => x.admin).concat([comp.admin]))];
  const info = {}; for (const a of admins) { if (!a) continue; const cod = await L.post('https://api.trongrid.io/wallet/getcontract', { value: a, visible: true }); info[a] = { esContrato: !!(cod && (cod.bytecode || cod.contract_address)), nombre: cod && cod.name || null }; const ac = await L.get('https://api.trongrid.io/v1/accounts/' + a); info[a].cuenta = ac && ac.data && ac.data[0] ? { creada: ac.data[0].create_time ? new Date(ac.data[0].create_time).toISOString() : null, permisosOwner: ac.data[0].owner_permission || null } : null; }
  const out = { leido: new Date().toISOString(), comptroller: C, comp, mercados, quienesSonLosAdmin: info };
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '02-gobierno.json'), out));
  console.log('admins distintos:', admins);
  for (const x of mercados) console.log(x.simbolo.padEnd(9), x.jToken, 'impl', x.implementacion, 'admin', x.admin, 'comptroller', x.comptroller === C ? 'el mismo' : x.comptroller);
  console.log('info admins', JSON.stringify(info, null, 1));
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
