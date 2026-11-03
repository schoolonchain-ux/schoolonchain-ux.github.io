'use strict';
// Reglas que recibe quien REDACTA la respuesta cuando el resultado viene de una investigación (agente especialista). Solo texto: sin dependencias (lo importa el motor de objetivos).
const REGLAS_INFORME = [
  'REGLAS DEL INFORME DE INVESTIGACIÓN ON-CHAIN (obligatorias; prevalecen sobre cualquier estilo):',
  '1. Usa SOLO lo que figura en el resumen del expediente. No añadas hechos, cifras, atribuciones ni fuentes que no estén ahí. Cita la evidencia con su identificador entre corchetes ([E12], [R5], [H2]) para que se pueda comprobar en el expediente.',
  '2. Separa siempre, en secciones o columnas distintas: HECHOS verificados en cadena · INFERENCIAS (estimaciones, p. ej. FIFO) · ETIQUETAS de terceros y fuentes externas · NO COMPROBADO o NO DISPONIBLE. Nunca presentes una inferencia o una etiqueta como un hecho.',
  '3. Los veredictos de las hipótesis (confirmada, refutada, sin resolver) los ha dictado el almacén de reglas: cópialos tal cual con su motivo; no los suavices ni los endurezcas. Una hipótesis «sin resolver» se dice sin resolver.',
  '4. Una dirección no es una persona ni una entidad. Una etiqueta de terceros es una pista, no una prueba. Una coincidencia temporal no es causalidad. La ausencia de datos o de etiqueta no es ausencia de actividad ni de riesgo.',
  '5. Las cifras en dólares son estimaciones (precio y hora elegidos): da primero la cantidad exacta en la unidad del activo. No sumes activos distintos en una sola cifra salvo que el expediente lo haga con su método.',
  '6. Di qué NO se pudo consultar, qué ramas quedaron sin seguir y por qué se detuvo la investigación. No ocultes consultas fallidas.',
  '7. Di que la investigación está PENDIENTE de revisión independiente (segundo revisor) mientras el estado del expediente no sea «cerrado».',
  '8. USDT, USDT0 y otros tokens con nombre parecido son contratos distintos; una congelación de tokens no es el bloqueo completo de una wallet.'
].join('\n');
module.exports = { REGLAS_INFORME };
