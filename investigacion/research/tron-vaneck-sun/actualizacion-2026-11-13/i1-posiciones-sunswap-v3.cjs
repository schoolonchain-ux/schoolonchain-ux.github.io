'use strict';
// Solo lectura (TronGrid). Comprobación propia del 13-nov-2026 de una cifra del informe «SUNSwap bajo el microscopio» (11-nov):
// cuántas posiciones de SUNSwap V3 con liquidez > 0 tiene hoy cada una de las dos cuentas del caso.
// Método: balanceOf(address) y tokenOfOwnerByIndex(address,i) del gestor de posiciones de V3 (TLSWrv7e…, el que cita el informe) y positions(id).liquidity.
// Un NFT sin liquidez (posición vaciada) sigue contando en balanceOf: por eso se cuenta aparte «NFT en propiedad» y «con liquidez > 0».
// Uso: node i1-posiciones-sunswap-v3.cjs <salida.json>
const fs = require('node:fs');
const A = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const dec = (s) => { let n = 0n; for (const ch of s) { const i = A.indexOf(ch); if (i < 0) throw new Error('direccion no valida ' + s); n = n * 58n + BigInt(i); } return n.toString(16).padStart(50, '0').slice(0, 42); };
const GESTOR = 'TLSWrv7eC1AZCXkRjpqMZUmvgd99cj7pPF';
const CUENTAS = { segunda_cuenta: 'TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N', financiadora_de_vaneck: 'TPyjyZfsYaXStgz2NmAraF1uZcMtkgNan5' };
const pad = (h) => h.replace(/^0x/, '').padStart(64, '0');
const pausa = (ms) => new Promise((x) => setTimeout(x, ms));
const crudo = [];
async function llamar(fn, param, dueno) {
  for (let i = 0; i < 5; i++) {
    const r = await fetch('https://api.trongrid.io/wallet/triggerconstantcontract', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ owner_address: dec(dueno), contract_address: dec(GESTOR), function_selector: fn, parameter: param }) });
    const j = await r.json();
    if (j.constant_result && j.constant_result[0] !== undefined) { crudo.push({ fn, param, respuesta: j.constant_result[0] }); return j.constant_result[0]; }
    await pausa(1500);
  }
  throw new Error('TronGrid no respondio a ' + fn);
}
(async () => {
  const salida = process.argv[2]; if (!salida) throw new Error('Uso: node i1-posiciones-sunswap-v3.cjs <salida.json>');
  const res = { version: 1, leidoEn: new Date().toISOString(), gestorV3: GESTOR, fuente: 'TronGrid /wallet/triggerconstantcontract (solo lectura)', cuentas: {} };
  for (const [clave, cta] of Object.entries(CUENTAS)) {
    const p = pad(dec(cta).slice(2));
    const nft = parseInt(await llamar('balanceOf(address)', p, cta), 16); await pausa(350);
    const conLiquidez = [];
    for (let i = 0; i < nft; i++) {
      const id = BigInt('0x' + await llamar('tokenOfOwnerByIndex(address,uint256)', p + pad(i.toString(16)), cta)); await pausa(350);
      const pos = await llamar('positions(uint256)', pad(id.toString(16)), cta); await pausa(350);
      if (BigInt('0x' + pos.slice(7 * 64, 8 * 64)) > 0n) conLiquidez.push(Number(id));
    }
    res.cuentas[clave] = { direccion: cta, nftEnPropiedad: nft, posicionesConLiquidez: conLiquidez.length, idsConLiquidez: conLiquidez.sort((a, b) => a - b) };
  }
  res.respuestasEnBruto = crudo.length;
  fs.writeFileSync(salida, JSON.stringify(res, null, 1));
  fs.writeFileSync(salida.replace(/\.json$/, '.crudo.json'), JSON.stringify(crudo));
  console.log(JSON.stringify(res.cuentas));
})().catch((e) => { console.error('FALLO', e.message); process.exit(1); });
