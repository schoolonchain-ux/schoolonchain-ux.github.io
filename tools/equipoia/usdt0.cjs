'use strict';
// Prepara el fichero de datos de la pestaña «USDT0» de la página de herramientas (data/usdt0.json).
// Solo lectura. Dos orígenes, y cada cosa dice cuál es el suyo:
//   · LECTURA DIRECTA de hoy en la cadena (dos nodos públicos que tienen que coincidir): cuánto USDT0 hay en cada red y cuánto USDT guarda el adaptador de Ethereum.
//   · LO QUE HA ANOTADO EL VIGILANTE de USDT0 de EquipoIA (usdt0-watch): direcciones bloqueadas, mensajes entre redes, firmantes de los Safe, huecos de cobertura.
// Antes de dejar nada se COMPRUEBA: que el resumen del vigilante sea reciente, que las cifras leídas ahora cuadren con las suyas, y que su libro no tenga ninguna línea
// cambiada ni borrada (cada línea con su huella correcta y los números de línea completos). El vigilante tiene además una comprobación más estricta (que la cadena de
// huellas enlace de principio a fin) que desde el 1-nov-2026 no se cumplía por una escritura simultánea de dos ciclos (reparado el 6-nov-2026 con la autorización del
// propietario: el propio libro reconoce esas 2 bifurcaciones y el vigilante comprueba «por padres»). Esa comprobación no se toca ni se da por buena aquí: este exportador
// sigue haciendo la suya, más simple.
// Uso: node usdt0.cjs <salida.json>
const fs = require('node:fs');
const crypto = require('node:crypto');
const RAIZ = 'C:/EquipoIA/usdt0-watch';
const { createRpc } = require(RAIZ + '/src/rpc.cjs');
const { CALLS } = require(RAIZ + '/src/abi.cjs');
const SALIDA = process.argv[2];
if (!SALIDA) { console.error('Uso: node usdt0.cjs <salida.json>'); process.exit(1); }

const fallar = (cod, msg) => { console.error(cod + ': ' + msg); process.exit(cod === 'LIBRO' ? 4 : cod === 'CIFRAS' ? 3 : 2); };
const leerJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, ''));

// ---- 1. comprobación del contenido del libro del vigilante (sin tocarlo) ----
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
function canon(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
function revisarLibro() {
  const L = fs.readFileSync(RAIZ + '/state/libro.jsonl', 'utf8').split('\n').filter((x) => x.trim());
  let mal = 0, ilegibles = 0, bifurcaciones = 0, anterior = null; const vistos = new Set(); let max = 0;
  for (const linea of L) {
    let x; try { x = JSON.parse(linea); } catch { ilegibles++; continue; }
    if (sha(x.prev + '\n' + canon({ seq: x.seq, at: x.at, type: x.type, rec: x.rec })) !== x.hash) mal++;
    if (anterior && x.prev !== anterior) bifurcaciones++;
    anterior = x.hash; vistos.add(x.seq); if (x.seq > max) max = x.seq;
  }
  const faltan = max - vistos.size;       // números de línea que nunca aparecen = líneas borradas
  return { lineas: L.length, huellasMalas: mal, ilegibles, numerosQueFaltan: faltan, bifurcaciones };
}

// ---- 2. lecturas directas ----
async function conReintento(fn, veces = 3) { let r; for (let i = 0; i < veces; i++) { r = await fn(); if (r.ok) return r; if (!r.discrepancy && !r.transient) break; await new Promise((f) => setTimeout(f, 1500 * (i + 1))); } return r; }
async function pool(items, n, fn) { const out = []; let i = 0; await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } })); return out; }

(async () => {
  const cfg = leerJson(RAIZ + '/config/redes.json');
  const resumen = leerJson(RAIZ + '/state/resumen.json');
  const edadH = (Date.now() - Date.parse(resumen.generado)) / 3600e3;
  if (!(edadH >= 0 && edadH <= 3)) fallar('RESUMEN', 'el resumen del vigilante no es reciente (' + edadH.toFixed(1) + ' h)');
  const libro = revisarLibro();
  if (libro.huellasMalas || libro.ilegibles || libro.numerosQueFaltan) fallar('LIBRO', 'el libro del vigilante tiene líneas cambiadas, ilegibles o borradas: ' + JSON.stringify(libro));

  const nets = cfg.redes.filter((n) => n.token);
  const lectura = await pool(nets, 4, async (n) => {
    const rpc = createRpc({ urls: n.rpc, name: n.id, gapMs: n.rpcGapMs || 0 });
    let r = await conReintento(() => rpc.call(n.token, CALLS.totalSupply));
    let prov = r.ok ? (r.single ? 1 : 2) : 0;
    if (!r.ok && r.discrepancy) { r = await rpc.first('eth_call', [{ to: n.token, data: CALLS.totalSupply }, 'latest']); prov = r.ok ? 1 : 0; }
    if (!r.ok) return { id: n.id, nombre: n.nombre, error: String(r.error || 'sin respuesta').slice(0, 80) };
    return { id: n.id, nombre: n.nombre, usdt0: Number(BigInt(r.result)) / 1e6, proveedores: prov, configurados: n.rpc.length };
  });
  const fallidas = lectura.filter((x) => x.error);
  if (fallidas.length) fallar('CIFRAS', 'no se pudo leer el suministro de: ' + fallidas.map((x) => x.id + ' (' + x.error + ')').join('; '));

  const eth = cfg.redes.find((n) => n.id === 'ethereum');
  const rpcEth = createRpc({ urls: eth.rpc, name: 'ethereum' });
  const rb = await conReintento(() => rpcEth.call(eth.usdtNativo, CALLS.balanceOf(eth.oft)));
  if (!rb.ok) fallar('CIFRAS', 'no se pudo leer el USDT del adaptador de Ethereum: ' + rb.error);
  const bloqueado = Number(BigInt(rb.result)) / 1e6;
  const total = lectura.reduce((s, x) => s + x.usdt0, 0);

  // ---- 3. que lo leído ahora cuadre con lo que tiene el vigilante (si no, algo falla en una de las dos lecturas) ----
  const v = resumen.respaldo;
  const dentro = (a, b, tol) => b > 0 && Math.abs(a - b) / b <= tol;
  if (!v || !dentro(total, v.suministroEvm, 0.03) || !dentro(bloqueado, v.bloqueadoAdaptador, 0.03)) fallar('CIFRAS', 'las cifras leídas ahora no cuadran con las del vigilante: total ' + total + ' frente a ' + (v && v.suministroEvm) + ', adaptador ' + bloqueado + ' frente a ' + (v && v.bloqueadoAdaptador));
  if (total < 1e9 || total > 1e11) fallar('CIFRAS', 'el total de USDT0 en circulación es absurdo: ' + total);
  const diferencia = bloqueado - total;

  const nombreRed = Object.fromEntries([...cfg.redes, ...(cfg.nativas || [])].map((n) => [n.id, n.nombre || n.id]));
  const m = resumen.mensajes || {};
  const abiertos = Array.isArray(m.abiertos) ? m.abiertos : [];
  const masViejo = abiertos.reduce((a, b) => (b.edadMin > (a ? a.edadMin : -1) ? b : a), null);
  const bl = resumen.bloqueosPorRed || {};
  const huecos = ((resumen.cobertura || {}).huecosDeHistorial || []).filter((h) => !h.resuelto);
  const sa = (resumen.safes || {}).listado || [];

  const salida = {
    version: 1,
    leidoEn: new Date().toISOString(),
    circulacion: {
      totalUsd: Math.round(total),
      redes: lectura.map((x) => ({ id: x.id, nombre: x.nombre, usdt0: Math.round(x.usdt0), nodosQueCoincidieron: x.proveedores, nodosConfigurados: x.configurados })).sort((a, b) => b.usdt0 - a.usdt0),
      redesLeidas: lectura.length, redesEsperadas: nets.length,
      metodo: 'cantidad total emitida del token USDT0 en cada red (totalSupply), leída hoy a los nodos públicos configurados, que tienen que coincidir',
    },
    respaldo: {
      usdtEnElAdaptador: Math.round(bloqueado), diferenciaUsd: Math.round(diferencia), diferenciaPct: Math.round((diferencia / bloqueado) * 1e5) / 1e3,
      adaptador: eth.oft, usdtEthereum: eth.usdtNativo,
      metodo: 'USDT de Ethereum a nombre del adaptador de USDT0 (balanceOf), leído hoy a dos nodos públicos que tienen que coincidir',
      nota: 'No incluye Stellar, IOTA ni HyperCore, donde también hay USDT0 respaldado por este adaptador. Que haya más USDT guardado que USDT0 medido no es un faltante.',
    },
    vigilante: {
      generadoEn: resumen.generado,
      bloqueos: {
        vigentesTotal: resumen.bloqueosVigentesTotal,
        porRed: Object.entries(bl).filter(([, x]) => x.vigentes > 0).map(([id, x]) => ({ id, nombre: nombreRed[id] || id, vigentes: x.vigentes, liberadas: x.liberadas, destruidoUsd: Math.round(x.destruidoUsd) })).sort((a, b) => b.vigentes - a.vigentes),
        destruidoTotalUsd: Math.round(Object.values(bl).reduce((s, x) => s + (x.destruidoUsd || 0), 0)),
      },
      mensajes: {
        ultimas24h: m.ultimas24h || null, volumenUsd24h: m.volumenUsd24h || null,
        rutasMayores: (m.rutasTop24h || []).slice(0, 5).map((r) => ({ ruta: r.ruta, mensajes: r.mensajes, usd: Math.round(r.usd) })),
        enCursoAhora: m.nAbiertos != null ? m.nAbiertos : null,
        masAntiguoEnCurso: masViejo ? { ruta: masViejo.ruta, horas: Math.round((masViejo.edadMin / 60) * 10) / 10 } : null,
        atascadosNuevos24h: m.nAtascadosNuevos24h != null ? m.nAtascadosNuevos24h : null,
      },
      safes: { total: sa.length, tresDeCinco: sa.filter((x) => x.umbral === 3 && x.firmantes === 5).length },
      huecosDeHistorialAbiertos: huecos.length,
    },
    comprobaciones: {
      resumenEdadHoras: Math.round(edadH * 10) / 10,
      cuadreConVigilante: { circulacionPct: Math.round(((total - v.suministroEvm) / v.suministroEvm) * 1e4) / 100, adaptadorPct: Math.round(((bloqueado - v.bloqueadoAdaptador) / v.bloqueadoAdaptador) * 1e4) / 100 },
      libroDelVigilante: libro,
    },
  };
  fs.writeFileSync(SALIDA, JSON.stringify(salida, null, 1));
  console.log('OK USDT0: ' + Math.round(total / 1e6) + ' M en circulación (' + lectura.length + ' redes), ' + Math.round(bloqueado / 1e6) + ' M de USDT en el adaptador, ' + resumen.bloqueosVigentesTotal + ' direcciones bloqueadas');
})().catch((e) => fallar('ERROR', String(e && e.stack || e).slice(0, 400)));
