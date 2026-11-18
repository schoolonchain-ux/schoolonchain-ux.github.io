'use strict';
// Solo lee movimientos-desde-13-nov.json (salida de j3) y lo pone en orden de tiempo, una línea por movimiento. Uso: node j4-resumen-movimientos.cjs
const fs = require('node:fs'), path = require('node:path');
const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'movimientos-desde-13-nov.json'), 'utf8'));
const DEC = { USDT: 6, HTX: 18, SUN: 18, USDD: 18, TRX: 6 };
for (const [k, c] of Object.entries(D.cuentas)) {
  console.log('\n== ' + k + ' ' + c.direccion);
  const f = [];
  for (const t of c.transacciones) f.push([t.hora, (t.sale ? 'SALE ' : 'ENTRA') + ' ' + t.tipo + ' ' + (t.trx != null ? t.trx.toLocaleString('es-ES') + ' TRX ' : '') + (t.sale ? '-> ' + t.a : '<- ' + t.de) + ' ' + t.tx.slice(0, 10)]);
  for (const t of c.trc20) { const d = DEC[t.token] ?? 0; f.push([t.hora, '   ' + (t.sale ? 'sale ' : 'entra') + ' ' + (Number(BigInt(t.valor) / 10n ** BigInt(Math.max(d - 2, 0))) / 100).toLocaleString('es-ES') + ' ' + t.token + ' ' + (t.sale ? '-> ' + t.a : '<- ' + t.de) + ' ' + t.tx.slice(0, 10)]); }
  f.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  for (const x of f) console.log(x[0].slice(5, 19) + ' ' + x[1]);
}
