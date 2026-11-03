'use strict';
// Vigila los dos lectores de saldos del tramo 6 (TronScan por delante, nodo público por detrás). Cuando entre los dos cubren todas las billeteras sin error:
// para ambos, une los resultados en tramo6/saldos-actuales.json (si una billetera está en los dos se queda la fila de TronScan, que trae más tokens) y lo anota en tramo6/saldos-union-log.txt.
// Solo lee y escribe ficheros del tramo 6; nunca toca otra cosa.
const fs = require('fs'); const { execSync } = require('child_process');
const D = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo6/'; const A = D + 'saldos-actuales.json', B = D + 'saldos-nodo-parcial.json';
const { rec, term } = JSON.parse(fs.readFileSync(D + 'tramo6-cache.json', 'utf8'));
const dirs = [...new Set([...Object.keys(rec), ...Object.keys(term)])].filter(a => /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a));
const leer = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return {}; } };
const ok = x => x && !x.error; const sl = ms => new Promise(r => setTimeout(r, ms));
const log = s => { console.log(s); fs.appendFileSync(D + 'saldos-union-log.txt', new Date().toISOString() + ' ' + s + '\n'); };
(async () => {
  for (;;) {
    const a = leer(A), b = leer(B); let faltan = 0, soloA = 0, soloB = 0;
    for (const d of dirs) { const x = ok(a[d]), y = ok(b[d]); if (!x && !y) faltan++; else if (x && !y) soloA++; else if (!x && y) soloB++; }
    log('billeteras ' + dirs.length + ' | por leer ' + faltan + ' | TronScan ' + soloA + ' | solo nodo ' + soloB);
    if (!faltan) {
      for (const f of ['leer-saldos.cjs', 'leer-saldos-nodo.cjs']) { try { execSync('powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name=\'node.exe\'\\" | Where-Object { $_.CommandLine -like \'*' + f + '*\' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"', { stdio: 'ignore' }); } catch { /* ya había terminado */ } }
      await sl(3000); const a2 = leer(A), b2 = leer(B); const u = {}; let nodo = 0, scan = 0;
      for (const d of dirs) { if (ok(a2[d])) { u[d] = a2[d]; scan++; } else if (ok(b2[d])) { u[d] = b2[d]; nodo++; } }
      for (const d of Object.keys(a2)) if (!(d in u) && !dirs.includes(d)) u[d] = a2[d];
      fs.copyFileSync(A, D + 'saldos-actuales.solo-tronscan.json'); fs.writeFileSync(A, JSON.stringify(u));
      log('UNIDO: ' + Object.keys(u).length + ' filas | de TronScan ' + scan + ' | del nodo público ' + nodo); return;
    }
    await sl(60000);
  }
})();
