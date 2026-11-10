'use strict';
// Publica el ESTADO DEL SEGUIMIENTO del caso del robo a Binance: reports/trazabilidad-binance-0x5227/seguimiento.json.
// Solo LEE el estado de los vigilantes de EquipoIA (no los toca ni escribe en sus carpetas) y dice lo que hay:
//  - Ethereum: vigilante eth-salidas-watch (cuántas direcciones, última comprobación, último movimiento avisado).
//  - TRON: las cinco cuentas del robo están en pausa desde el 4-nov-2026 (config/cuentas.binance-pausadas.json); se declara tal cual.
// Si un vigilante no ha completado un ciclo en las últimas 2 horas, se publica como «sin ciclo reciente» en vez de darlo por activo.
// Uso: node seguimiento-binance.cjs <carpeta-del-repositorio>
const fs = require('node:fs'); const path = require('node:path');
const REPO = process.argv[2]; if (!REPO) { console.error('Uso: node seguimiento-binance.cjs <carpeta-del-repositorio>'); process.exit(1); }
const EIA = process.env.EQUIPOIA_RAIZ || 'C:/EquipoIA';
const j = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const lineas = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []);
const ahora = Date.now();

// ---- Ethereum
const dE = path.join(EIA, 'eth-salidas-watch');
const est = j(path.join(dE, 'state', 'estado.json')); const cfg = j(path.join(dE, 'config', 'cuentas.json'));
const cuentas = (cfg.cuentas || []).map((c) => c.direccion).filter(Boolean);
if (!cuentas.length) throw new Error('el vigilante de Ethereum no tiene cuentas configuradas');
if (!est.ultimoCiclo || isNaN(Date.parse(est.ultimoCiclo))) throw new Error('el vigilante de Ethereum no tiene fecha de último ciclo');
const horas = (ahora - Date.parse(est.ultimoCiclo)) / 3600000;
// Si el propietario paró la vigilancia de Ethereum, queda anotado en config/pausa.json (nota que escribe quien la para; el vigilante no la lee).
const fPE = path.join(dE, 'config', 'pausa.json'); const pausaE = fs.existsSync(fPE) ? j(fPE) : null;
const avisos = lineas(path.join(dE, 'state', 'avisos.jsonl'));
const clase = (a) => String(a.clase || String(a.clave || '').split('|')[0] || '');
const movs = avisos.filter((a) => clase(a) && !['fallo', 'activacion'].includes(clase(a)));   // todo aviso que no sea un fallo de lectura ni la activación es un movimiento observado (entrada, salida, salida_token…)
const porClase = {}; for (const a of movs) porClase[clase(a)] = (porClase[clase(a)] || 0) + 1;
const ult = movs.length ? movs[movs.length - 1] : null;
const ethereum = {
  activo: !pausaE && horas <= 2,
  ...(pausaE ? { paradoEl: pausaE.paradoEl || null, motivo: 'La vigilancia de las direcciones de Ethereum se paró el ' + (pausaE.paradoEl || 'día anotado') + ': el caso se da por cerrado.' } : horas > 2 ? { motivo: 'sin ciclo completo en las últimas 2 horas (último: ' + est.ultimoCiclo + ')' } : {}),
  direcciones: cuentas, vigilaDesde: est.arrancado || null, ultimaComprobacion: est.ultimoCiclo, ultimoBloque: est.ultimoBloque || null,
  cadaMinutos: 10, umbralEth: cfg.umbralEth || null,
  avisa: 'Si alguna envía o recibe ' + (cfg.umbralEth || 100) + ' ETH o más, o saca cualquier token.',
  movimientosAvisados: movs.length, porClase, ultimoMovimientoAvisado: ult ? { fecha: ult.at, clase: clase(ult) } : null,
  ultimoCiclo: est.ultimoResumen || null,
  fuente: 'Vigilante eth-salidas-watch de EquipoIA (lee Etherscan v2); los avisos se envían en privado al propietario',
};

// ---- TRON
const fP = path.join(EIA, 'tron-salidas-watch', 'config', 'cuentas.binance-pausadas.json'); const fA = path.join(EIA, 'tron-salidas-watch', 'config', 'cuentas.json');
const activas = new Set((j(fA).cuentas || []).map((c) => c.direccion)); const pausa = fs.existsSync(fP) ? j(fP) : null;
const delRobo = pausa ? (pausa.cuentas || []).map((c) => c.direccion) : [];
const siguen = delRobo.filter((d) => activas.has(d));
const tron = siguen.length
  ? { activo: true, direcciones: siguen, fuente: 'Vigilante tron-salidas-watch de EquipoIA' }
  : { activo: false, direcciones: delRobo, paradoEl: (pausa && pausa.paradoEl) || null, motivo: 'La vigilancia de las cinco cuentas del robo en TRON se paró el 4-nov-2026: el seguimiento de cada billetera nueva llegó a 64.000 billeteras y dejó de ser manejable.', fuente: 'tron-salidas-watch/config/cuentas.binance-pausadas.json' };

// Con las dos vigilancias paradas el fichero ya no cambia: su fecha es la de la última comprobación, para que repetir el programa dé lo mismo.
const parado = !!pausaE && !tron.activo;
const out = { version: 1, generado: parado ? ethereum.ultimaComprobacion : new Date(ahora).toISOString(), ...(parado ? { parado: true } : {}), caso: 'trazabilidad-binance-0x5227', ultimaComprobacion: ethereum.ultimaComprobacion, ethereum, tron };
const dst = path.join(REPO, 'reports', 'trazabilidad-binance-0x5227', 'seguimiento.json');
if (!fs.existsSync(path.dirname(dst))) throw new Error('no existe la carpeta del informe en el repositorio');
fs.writeFileSync(dst, JSON.stringify(out, null, 1) + '\n');
console.log('OK seguimiento Binance: Ethereum ' + (ethereum.activo ? 'activo' : pausaE ? 'parado desde ' + pausaE.paradoEl : 'SIN CICLO RECIENTE') + ', ' + cuentas.length + ' direcciones, ultima comprobacion ' + ethereum.ultimaComprobacion + ', ' + movs.length + ' movimientos avisados; TRON ' + (tron.activo ? 'activo' : 'parado desde ' + tron.paradoEl));
