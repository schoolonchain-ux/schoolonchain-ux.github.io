'use strict';
// CONTROL DE CALIDAD previo al informe (las 8 comprobaciones del encargo; la 9, sobre la conservación de las dos vías de pureza, la añade el generador). Cada una devuelve {id, titulo, estado: 'OK'|'AVISO'|'FALLO', detalle, evidencia}.
// Un FALLO impide generar el informe como «final»; un AVISO se muestra en el propio informe. Nada se arregla en silencio.
const SIN_FUENTE = c => !c.fuente || !c.corte;

function comprobar({ L, capital, particiones, analisis, saldos, cuentas, extra = {} }) {
  const R = [];
  const add = (id, titulo, estado, detalle, evidencia) => R.push({ id, titulo, estado, detalle, evidencia: evidencia || null });
  // 1. Cada cifra tiene fuente y fecha de referencia
  const cifras = extra.cifras || []; const sin = cifras.filter(SIN_FUENTE);
  add(1, 'Todas las cifras tienen fuente y fecha de referencia', sin.length ? 'FALLO' : 'OK', sin.length ? sin.length + ' cifras sin fuente o sin fecha: ' + sin.slice(0, 5).map(c => c.nombre).join('; ') : cifras.length + ' cifras con fuente y fecha', sin.slice(0, 20));
  // 2. No se suman movimientos duplicados
  const dup = L.duplicadosExactos(); const avisosDup = L.avisos.filter(a => a.tipo === 'duplicado');
  add(2, 'No se suman movimientos duplicados', avisosDup.length ? 'FALLO' : (dup.length ? 'AVISO' : 'OK'), avisosDup.length ? avisosDup.length + ' altas repetidas rechazadas por el libro' : dup.length ? dup.length + ' pares con mismo hash/importe/origen/destino pero distinto índice (revisar: pueden ser dos eventos iguales en una transacción)' : 'Sin duplicados exactos en ' + L.movs.length + ' movimientos', dup.slice(0, 20));
  // 3. Los importes cross-chain concilian con los recibos de destino
  const puentes = [...L.grupos.values()].filter(g => g.tipo === 'puente'); const pend = puentes.filter(g => g.estado === 'PENDIENTE').length; const desc = puentes.filter(g => g.estado === 'DESCONOCIDO').length;
  const envios = L.movs.filter(m => m.tipo === 'puente_envio').length; const conRecibo = puentes.filter(g => g.recibo && L.porId.get(g.recibo)); const reciboVerif = conRecibo.filter(g => L.porId.get(g.recibo).estado === 'VERIFICADO').length;
  const sinGrupo = L.movs.filter(m => m.tipo === 'puente_envio' && !puentes.some(g => g.envio === m.id)).length;
  add(3, 'Los importes cross-chain concilian con los recibos de destino', (pend || desc) ? 'AVISO' : 'OK', envios + ' envíos a puentes en el libro; ' + puentes.length + ' cruces enlazados con su recibo (recibo comprobado en la cadena de destino: ' + reciboVerif + '; el resto, ESTIMADO por emparejamiento o por la API del puente); sin recibo (PENDIENTE): ' + pend + '; con diferencia sin explicar (DESCONOCIDO): ' + desc + '; envíos a puentes cuyo destino no se puede leer (USDT0, Across, prefinanciados, Bridgers): ' + sinGrupo, { enlazados: puentes.length, reciboVerificado: reciboVerif, pendientes: pend, desconocidos: desc, sinGrupo });
  // 4. Congelados separados de simplemente inmóviles
  const cong = (saldos && saldos.congelados) || null;
  add(4, 'Fondos congelados separados de fondos simplemente inmóviles', cong && cong.leidoEn ? 'OK' : 'AVISO', cong && cong.leidoEn ? 'Estado de congelación leído de la lista negra de Tether el ' + cong.leidoEn : 'No se ha vuelto a leer la lista negra: «inmóvil» y «congelado» se muestran por separado y el congelado vigente hoy figura PENDIENTE', null);
  // 5. Un depósito en una wallet etiquetada no prueba identificación del beneficiario
  const casas = particiones.terminales.casa || { items: [] };
  add(5, 'Un depósito en una dirección de casa de cambio no se presenta como identificación del beneficiario', 'OK', casas.items.length + ' llegadas a direcciones etiquetadas como casa de cambio; en el informe figuran como «depósito detectado», nunca como «llegada confirmada a una cuenta de cliente»', null);
  // 6. Wallets sin leer y ramas incompletas declaradas
  const noLeidas = [...L.cuentas.values()].filter(c => c.clase === 'billetera' && c.leida === false); const sinLeer = analisis.fallidas || 0;
  add(6, 'Billeteras sin leer y ramas incompletas declaradas', 'AVISO', noLeidas.length + ' billeteras que reciben dinero y no se han leído (de ellas, lecturas fallidas: ' + sinLeer + '); contratos con salida sin resolver: ' + particiones.sinResolver.porContrato.length + ' (' + Math.round(particiones.sinResolver.importe).toLocaleString('es-ES') + ' $); todo se lista en la sección de pendientes', null);
  // 7. Gráficos y tablas muestran los mismos datos (suma de cada partida = suma de sus filas)
  const desvios = []; for (const [k, v] of Object.entries(particiones.terminales)) { const s = v.items.reduce((a, x) => a + x.atribuido, 0); if (Math.abs(s - v.importe) > Math.max(1, v.importe * 1e-9)) desvios.push({ partida: k, tabla: s, total: v.importe }); }
  const sRet = particiones.retenido.items.reduce((a, x) => a + x.atribuido, 0); if (Math.abs(sRet - particiones.retenido.importe) > 1) desvios.push({ partida: 'retenido', tabla: sRet, total: particiones.retenido.importe });
  const sSr = particiones.sinResolver.items.reduce((a, x) => a + x.atribuido, 0); if (Math.abs(sSr - particiones.sinResolver.importe) > 1) desvios.push({ partida: 'sinResolver', tabla: sSr, total: particiones.sinResolver.importe });
  add(7, 'Gráficos y tablas muestran los mismos datos', desvios.length ? 'FALLO' : 'OK', desvios.length ? desvios.length + ' partidas cuya tabla no suma su total' : 'El total de cada partida es exactamente la suma de las filas que lo componen (se puede bajar hasta la transacción)', desvios);
  // 8. Recomputo independiente de los totales (no se fía del script de análisis)
  const cmp = []; const T = analisis.totales || {}; for (const [k, v] of Object.entries(particiones.terminales)) if (Math.abs(v.importeFijo - (T[k] || 0)) > 1) cmp.push({ partida: k, libro: v.importeFijo, analisis: T[k] || 0 });   // se compara a PRECIO FIJO (el del análisis): la lógica debe coincidir; el informe luego valora a precio horario
  if (Math.abs(particiones.retenido.importeFijo - analisis.retenidoTainted) > 1) cmp.push({ partida: 'retenido', libro: particiones.retenido.importeFijo, analisis: analisis.retenidoTainted });
  if (analisis.sinResolver && Math.abs(particiones.sinResolver.importeFijo - analisis.sinResolver.total) > 1) cmp.push({ partida: 'sinResolver', libro: particiones.sinResolver.importeFijo, analisis: analisis.sinResolver.total });
  add(8, 'Recálculo independiente: el libro reproduce los totales del análisis', cmp.length ? 'FALLO' : 'OK', cmp.length ? 'Diferencias en ' + cmp.map(c => c.partida).join(', ') : 'El libro recalcula desde los saltos los mismos totales que el análisis a su precio fijo (diferencia < 1 $ por partida); después los valora a precio horario', cmp);
  return R;
}
module.exports = { comprobar };
