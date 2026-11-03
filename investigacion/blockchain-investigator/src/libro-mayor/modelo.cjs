'use strict';
// LIBRO MAYOR de trazabilidad: modelo de datos y reglas contables. Solo datos y cálculo; nada de red ni de HTML.
//  · Cada movimiento es una fila del libro con identificador único (determinista): cadena, hash de transacción, activo, importe, origen, destino, fecha.
//  · Un mismo dinero se cuenta UNA vez en «fondos únicos»: lo que pasa por cinco billeteras son cinco movimientos pero un solo capital.
//  · Swaps (entrada + salida enlazadas) y puentes (envío + recibo enlazados, con comisiones y diferencia) son GRUPOS de movimientos.
//  · Todo importe lleva un ESTADO (VERIFICADO / ESTIMADO / HIPOTESIS / DESCONOCIDO / PENDIENTE). Los descuadres se muestran con su importe, nunca se ajustan.
const crypto = require('node:crypto'); const precios = require('./precios.cjs');

const ESTADOS = Object.freeze({
  VERIFICADO: 'Evidencia directa contrastable (transacción o lectura de cadena).',
  ESTIMADO: 'Cálculo mediante un modelo explícito (atribución, precio fijo…); el modelo se declara.',
  HIPOTESIS: 'Interpretación pendiente de demostrar.',
  DESCONOCIDO: 'No existen datos suficientes para determinarlo.',
  PENDIENTE: 'Investigación todavía abierta.',
});
const TIPOS = Object.freeze(['transferencia', 'deposito_contrato', 'retirada_contrato', 'swap_entrada', 'swap_salida', 'puente_envio', 'puente_recibo', 'comision', 'congelacion', 'transferencia_justificante']);
const CAMPOS_OBLIGATORIOS = ['cadena', 'tx', 'activo', 'importe', 'de', 'a', 't', 'tipo'];

// Precio: todo valor en dólares lleva su método. TRX a precio FIJO (declarado) hasta que haya serie horaria; USDT/USDC nominales 1 $.
const PRECIOS = Object.freeze({
  TRX: { usd: 0.352, metodo: 'precio fijo 0,352 $ por TRX (sin serie horaria): ESTIMADO' },
  USDT: { usd: 1, metodo: 'nominal 1 $: ESTIMADO (no se ha comprobado la paridad en cada instante)' },
  USDC: { usd: 1, metodo: 'nominal 1 $: ESTIMADO' },
});
// Con serie horaria: precio de apertura de la hora del movimiento. Sin serie para ese instante: precio fijo declarado. Sin precio: null = DESCONOCIDO, no 0.
const valorUsd = (activo, importe, t) => { if (t != null) { const p = precios.precio(activo, t); if (p != null) return importe * p; } return PRECIOS[activo] ? importe * PRECIOS[activo].usd : null; };

const idDe = m => 'm-' + crypto.createHash('sha256').update([m.cadena, m.tx, m.indice ?? '', m.activo, m.de, m.a, String(m.importe), m.tipo].join('|')).digest('hex').slice(0, 20);

class Libro {
  constructor({ nombre, corte, descripcion } = {}) { this.nombre = nombre || 'libro'; this.corte = corte || null; this.descripcion = descripcion || ''; this.movs = []; this.porId = new Map(); this.grupos = new Map(); this.cuentas = new Map(); this.avisos = []; }

  // Alta de una cuenta (billetera, contrato…) con su ficha mínima; el resto de datos se añade con `ficha`.
  cuenta(cadena, direccion, datos = {}) { const k = cadena + ':' + direccion; const c = this.cuentas.get(k) || { cadena, direccion }; Object.assign(c, datos); this.cuentas.set(k, c); return c; }

  // Añade un movimiento. Rechaza lo incompleto y lo duplicado (mismo id): un mismo movimiento no puede sumarse dos veces.
  mov(m) {
    for (const k of CAMPOS_OBLIGATORIOS) if (m[k] === undefined || m[k] === null || m[k] === '') throw new Error('movimiento sin ' + k);
    if (!TIPOS.includes(m.tipo)) throw new Error('tipo desconocido: ' + m.tipo);
    if (!(Number.isFinite(m.importe) && m.importe >= 0)) throw new Error('importe no válido');
    const id = m.id || idDe(m); const previo = this.porId.get(id);
    if (previo) { this.avisos.push({ tipo: 'duplicado', id }); return previo; }
    const usd = m.usd !== undefined ? m.usd : valorUsd(m.activo, m.importe, m.t);
    const fila = { ...m, id, usd, usdEstado: usd === null ? 'DESCONOCIDO' : (m.usdEstado || 'ESTIMADO'), estado: m.estado || 'VERIFICADO' };
    this.movs.push(fila); this.porId.set(id, fila); return fila;
  }

  // Un swap: lo que sale y lo que entra son UNA conversión (no dos dineros). `comision` se anota aparte si se conoce.
  swap({ id, cadena, tx, de, entrada, salida, t, comision, estado }) {
    const e = this.mov({ cadena, tx, indice: 'e', tipo: 'swap_entrada', activo: entrada.activo, importe: entrada.importe, de, a: entrada.a || 'contrato', t, estado, grupo: id || tx });
    const s = this.mov({ cadena, tx, indice: 's', tipo: 'swap_salida', activo: salida.activo, importe: salida.importe, de: salida.de || 'contrato', a: salida.a, t, estado, grupo: id || tx });
    const g = { id: id || tx, tipo: 'swap', entrada: e.id, salida: s.id, comision: comision || null }; this.grupos.set(g.id, g); return g;
  }

  // Un puente: envío y recibo se concilian con comisiones y diferencia. Si no hay recibo del lado destino, queda PENDIENTE (no se da por recibido).
  puente({ id, enviado, recibido, comision, nota }) {
    const g = { id, tipo: 'puente', envio: enviado.id, recibo: recibido ? recibido.id : null, comision: comision ?? null, nota: nota || '' };
    if (!recibido) { g.estado = 'PENDIENTE'; g.diferencia = null; }
    else { const dif = enviado.importe - recibido.importe - (comision || 0); g.diferencia = dif; g.estado = Math.abs(dif) <= Math.max(1e-9, enviado.importe * 1e-9) ? 'VERIFICADO' : 'DESCONOCIDO'; if (g.estado === 'DESCONOCIDO') g.nota = (nota ? nota + ' · ' : '') + 'diferencia sin explicar: ' + dif; }
    this.grupos.set(id, g); return g;
  }

  // Balance de MOVIMIENTOS: todo el volumen observado (incluye repeticiones del mismo dinero). Es VERIFICADO como suma de lo observado; su valor en dólares es ESTIMADO.
  balanceMovimientos() {
    const por = {}; let usd = 0, sinPrecio = 0;
    for (const m of this.movs) { const k = m.cadena + '|' + m.activo + '|' + m.tipo; const x = por[k] || (por[k] = { cadena: m.cadena, activo: m.activo, tipo: m.tipo, n: 0, importe: 0, usd: 0 }); x.n++; x.importe += m.importe; if (m.usd !== null) { x.usd += m.usd; usd += m.usd; } else sinPrecio++; }
    return { n: this.movs.length, usdTotal: usd, movimientosSinPrecio: sinPrecio, filas: Object.values(por), estado: 'VERIFICADO', nota: 'Volumen bruto: el mismo dinero que pasa por varias billeteras se cuenta en cada paso. No es el capital.' };
  }
  // Camino hacia atrás de una cifra: dado un filtro, devuelve los movimientos que la componen (auditoría hasta la transacción).
  componentes(filtro) { return this.movs.filter(filtro); }
  duplicadosExactos() { const vistos = new Map(); const dup = []; for (const m of this.movs) { const k = [m.cadena, m.tx, m.activo, m.de, m.a, m.importe].join('|'); if (vistos.has(k)) dup.push([vistos.get(k), m.id]); else vistos.set(k, m.id); } return dup; }
}

// Tabla de conciliación del capital: NO fuerza la igualdad; la diferencia es lo que realmente queda por explicar.
function conciliar(capital, partidas) {
  const filas = partidas.map(p => ({ ...p, importe: p.importe === null || p.importe === undefined ? null : p.importe }));
  const suma = filas.reduce((s, p) => s + (p.importe || 0), 0); const desconocidas = filas.filter(p => p.importe === null).map(p => p.nombre);
  const diferencia = capital.importe - suma;
  return { capital, partidas: filas, sumaPartidas: suma, diferencia, porcentajeDiferencia: capital.importe ? diferencia / capital.importe : null, partidasSinImporte: desconocidas, cuadra: Math.abs(diferencia) <= Math.max(1, capital.importe * 1e-9) && desconocidas.length === 0, nota: 'La diferencia se muestra tal cual: es lo que no se ha podido explicar con los datos y el modelo usados. Un descuadre del modelo de atribución no es una pérdida económica demostrada.' };
}
module.exports = { ESTADOS, TIPOS, PRECIOS, valorUsd, idDe, Libro, conciliar };
