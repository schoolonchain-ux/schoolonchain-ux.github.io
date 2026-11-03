'use strict';
// Añade (o sustituye) la entrada v0.5 en state/informe-trazabilidad/novedades.json
const fs = require('fs'); const f = 'C:/EquipoIA/blockchain-investigator/state/informe-trazabilidad/novedades.json';
const N = JSON.parse(fs.readFileSync(f, 'utf8')).filter(x => x.version !== 'v0.5');
N.push({ version: 'v0.5', fecha: '2026-11-03', cambios: [
  'NUEVO · Sección 17 «Dos vías de pureza en paralelo»: se mantiene la vía ACTUAL (la de todas las cifras del informe, sin cambios) y se calcula siempre a su lado la vía CICLO, que arregla el fallo de TB7pUXywPH… (una billetera que cobra pagos de otros desde una bóveda se quedaba con pureza 0,999). En la vía CICLO, lo que entra de un contrato neutro en exceso de lo que la propia billetera le mandó, y que no está enlazado con una salida nuestra, diluye la pureza. Resultado: TB7p… pasa de pureza 0,999 a 0,052; el tramo 6 pasa de repartir el 105,6 % de lo que entra a repartir el 96,2 %; el tramo 5, del 98,2 % al 95,9 %. Destinos finales: tramo 6 de 43,9 a 39,5 M$; tramo 5 de 160,7 a 157,4 M$.',
  'La sección 17 incluye también una tercera cifra, «diluida (cota baja)», que diluye TODO lo que entra de contratos sin enlace: deja los dos tramos en el 80 % de lo que entra, así que corrige de más y se enseña solo como límite inferior (muchas devoluciones legítimas de cambios no tienen su enlace registrado).',
  'Cómo se mantienen en paralelo: analisis-tramo5.cjs y analisis-tramo6.cjs admiten PUREZA=actual (por defecto, comprobado idéntico al resultado publicado en los dos tramos), PUREZA=ciclo y PUREZA=diluida; cada una escribe sus propios ficheros (tramoN-resultado.ciclo.json, etc.) y no toca los publicados.',
  'Sigue pendiente de decisión del propietario si alguna vez la vía CICLO sustituye a la ACTUAL en el resto del informe. Ninguna de las dos vías está revisada por una fuente externa.'
] });
fs.writeFileSync(f, JSON.stringify(N, null, 1)); console.log('novedades:', N.map(x => x.version).join(', '));
