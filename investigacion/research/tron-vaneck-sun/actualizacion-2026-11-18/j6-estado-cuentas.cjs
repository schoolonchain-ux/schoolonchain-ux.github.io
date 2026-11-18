'use strict';
// Solo lectura (TronGrid /wallet/getaccount). Seguimiento del 18-nov-2026: saldo libre, congelado, delegado y en descongelación de las cuentas del caso. Uso: node j6-estado-cuentas.cjs <salida.json>
const fs = require('node:fs');
const C = { vaneck: 'TCGVFGDd62LSrfZEaz3M3fYifWWdSDHRL8', segunda_cuenta: 'TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N', financiadora: 'TPyjyZfsYaXStgz2NmAraF1uZcMtkgNan5', cuenta_de_energia: 'TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B', proveedora: 'TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2', TYL7z7VS: 'TYL7z7VSVRShLoJ6YRQMA4t9pSECt9ZLmz', TKpiitwG: 'TKpiitwGUuW5WgsBMg5w5QWUpC6nUTroqa' };
(async () => {
  const res = { version: 1, leidoEn: new Date().toISOString(), fuente: 'TronGrid /wallet/getaccount (visible)', cuentas: {} }, crudo = {};
  for (const [k, a] of Object.entries(C)) {
    let c = null; for (let i = 0; i < 8 && !(c && c.address === a); i++) { if (i) await new Promise((x) => setTimeout(x, 2500)); try { const r = await fetch('https://api.trongrid.io/wallet/getaccount', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: a, visible: true }) }); c = await r.json(); } catch (e) { c = null; } }
    if (!(c && c.address === a)) throw new Error('TronGrid no devolvio la cuenta ' + a + ' (una respuesta vacia NO es un saldo cero)'); crudo[k] = c;
    const fz = Object.fromEntries((c.frozenV2 || []).map((f) => [f.type || 'BANDWIDTH', (f.amount || 0) / 1e6]));
    res.cuentas[k] = { direccion: a, libreTrx: (c.balance || 0) / 1e6, congeladoEnergia: fz.ENERGY || 0, congeladoAncho: fz.BANDWIDTH || 0, delegadoEnergia: ((c.account_resource || {}).delegated_frozenV2_balance_for_energy || 0) / 1e6, delegadoAncho: (c.delegated_frozenV2_balance_for_bandwidth || 0) / 1e6, descongelando: (c.unfrozenV2 || []).map((u) => ({ trx: u.unfreeze_amount / 1e6, libreEl: new Date(u.unfreeze_expire_time).toISOString() })) };
    console.log(k, JSON.stringify(res.cuentas[k])); await new Promise((x) => setTimeout(x, 1500));
  }
  fs.writeFileSync(process.argv[2], JSON.stringify(res, null, 1)); fs.writeFileSync(process.argv[2].replace(/\.json$/, '.crudo.json'), JSON.stringify(crudo));
})().catch((e) => { console.error('FALLO', e.message); process.exit(1); });
