'use strict';
// Objeciones de la auditoría adversarial al informe «ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31» (original congelado en docs/articulos/ORIGINAL-INTACTO).
// Cada objeción lleva: qué afirma el informe, evidencia a favor y en contra, alternativas, confianza y qué datos faltan. Las cifras salen de resultados/*.json (scripts de esta carpeta).
// Clases: VERIFICADO (visto en la cadena/recibos y repetible), ESTIMADO (modelo; ordena pero no es importe comprobado), HIPÓTESIS (encaja, no se prueba), DESCONOCIDO (no hay datos).
module.exports = [
  {
    id: 'O-01', sev: 'Alta', clase: 'VERIFICADO', tema: 'Atribución',
    titulo: 'La «mezcla proporcional» no conserva el dinero del robo',
    afirmacion: 'Si una billetera recibe un 90 % de dinero del robo, el 90 % de lo que envía es del robo (apartado «Método»).',
    aFavor: 'Es un criterio simple y transparente; reproduzco los terminales del primer tramo con un 1 % de diferencia (préstamos 4,75 M$ exacto).',
    enContra: 'Al aplicar la pureza fija de cada billetera a todas sus salidas, 102 billeteras del primer tramo sacan más «dinero del robo» del que entró (exceso total 4,46 M$; entrada atribuida total 214,3 M$ frente a salida 199,2 M$ y 19,5 M$ de defecto en otras). Un modelo de inventario (FIFO, LIFO, mezcla móvil, «lo manchado primero» y «lo limpio primero») que conserva el valor agregado en dólares de cada billetera da otro reparto por billetera. Salvedad (revisión Codex R1-07): mi inventario guarda dólares agregados por billetera, sin separar TRX y USDT, así que «conserva» se refiere al agregado de la simulación y no demuestra conservación de los fondos en cadena.',
    alternativas: 'FIFO, LIFO, mezcla móvil, extremo alto observado (manchado primero) y extremo bajo observado (limpio primero): todos dan totales por clase parecidos salvo en puentes (ver O-02). Hipótesis por defecto del simulador sobre entradas de origen desconocido: «misma pureza que la billetera»; con la hipótesis «limpio» (rerun de la revisión Codex) los nodos bajan a 24,8–25,5 M$ y los préstamos a 4,78–4,81 M$. Mis ficheros históricos «-limpio» y «-pool» son de versiones intermedias del script y no son comparaciones controladas: no se usan.',
    confianza: 'Alta en que el modelo no conserva; media en que los totales por clase son estables (nodos 24,8–25,8 M$, préstamos 4,78–4,87, USDD 0,32–0,33 según modelo e hipótesis).',
    faltan: 'Una lectura de las 1.347 billeteras que incluya todo su historial anterior (ver O-04) para poder fijar un único modelo de inventario.',
    efecto: 'Se mantienen las cifras por clase como ESTIMADO con rango; se retira la idea de que la mezcla proporcional «reparte» exactamente el dinero.'
  },
  {
    id: 'O-02', sev: 'Media', clase: 'ESTIMADO', tema: 'Atribución',
    titulo: 'Puentes: 2,36 M$ quedan por encima del rango de las cinco estrategias ensayadas',
    afirmacion: '≈ 2,36 M$ del robo llegan al puente USDT0/UsdtOFT (5 % de lo repartido).',
    aFavor: 'El importe bruto enviado al puente está comprobado envío a envío (ver O-09).',
    enContra: 'Con los cinco modelos de inventario el resultado es 0,97 M$ (lo limpio primero) – 2,28 M$ (lo manchado primero, extremo alto observado); FIFO 1,61, LIFO 2,23, móvil 1,68. La cifra publicada queda 0,08 M$ por encima del máximo de esas cinco estrategias. Corrección de la revisión Codex (R1-04): «lo manchado primero» no es un máximo teórico; una prioridad mixta (manchado primero hacia destinos a ≤ 5 pasos de un puente, limpio primero en el resto) da 2,293 M$, aún por debajo de 2,36 pero por encima de 2,275. Por tanto no se puede decir que 2,36 sea imposible.',
    alternativas: 'Rango observado 1,0–2,3 M$ según el orden en que se consuma el dinero «manchado»; no es un límite demostrado.',
    confianza: 'Media: depende del modelo; la ventana previa incompleta (O-04) añade incertidumbre.',
    faltan: 'Historial completo anterior de las billeteras que alimentan el puente.',
    efecto: 'El informe revisado da «≈ 1,0–2,3 M$ (rango observado, no límite demostrado)»; el 2,36 M$ original no se declara imposible.'
  },
  {
    id: 'O-03', sev: 'Media', clase: 'ESTIMADO', tema: 'Atribución',
    titulo: '«22 % retenido en billeteras del recorrido»: contraste aproximado del saldo, la atribución no está validada',
    afirmacion: '11,18 M$ del robo siguen retenidos en billeteras del primer tramo.',
    aFavor: 'Al reconstruir el saldo real a la foto (saldo actual menos movimientos posteriores) de 25 billeteras elegidas por mayor discrepancia, el saldo bruto implícito del informe (retenido ÷ pureza) se desvía en total ≈ 255.000 $ en valor absoluto, frente a ≈ 5,0 M$ del inventario simulado.',
    enContra: 'Mis modelos de inventario dan 15,8–17,9 M$ retenidos, pero no son fiables (≈ 4,9 M$ de inventario «huérfano»). Corrección (Codex R1-06): no se debe a «movimientos <350 $»; el simulador solo sigue aristas ≥ 3.520 $ y descarta antes de acreditar al inventario las transferencias menores a una billetera simulada (hay 2.260 aristas de 350 a 3.520 $, 3,10 M$ brutos, hacia billeteras leídas), así que parte del huérfano lo provoca el propio simulador. Además (R1-11) la comparación con saldos reales valida un saldo BRUTO aproximado (retenido ÷ pureza) de 25 cuentas seleccionadas por discrepancia, no la procedencia ni el total de 11,2 M$; no incorpora comisiones y aparece un saldo «real» negativo de −1,79 $ marcado completo.',
    alternativas: 'Una parte del «retenido» puede ser dinero ajeno ya presente en esas billeteras (mezcla).',
    confianza: 'Baja-media: contraste del saldo bruto en 25 de 1.347 cuentas, sin validar la atribución.',
    faltan: 'Saldos reales a la foto de todas las billeteras (histórico de saldos por bloque).',
    efecto: 'Se mantiene 11,2 M$ como ESTIMADO con contraste aproximado del saldo bruto en 25 cuentas; la atribución no está validada ni se extrapola; tampoco se sustituye por la simulación.'
  },
  {
    id: 'O-04', sev: 'Media', clase: 'VERIFICADO', tema: 'Reproducibilidad',
    titulo: 'Ventana de lectura incompleta: se leyó cada billetera desde su primera entrada rastreada',
    afirmacion: '«Todo el recorrido está congelado a las 22:40 UTC del 30-oct; cada billetera se lee después». No se declara que la lectura empiece en la primera entrada conocida de cada una.',
    aFavor: 'El hueco es pequeño.',
    enContra: 'Para 112 billeteras (lista regenerada el 1-nov; antes se citaban 123 y esa lista se había sobrescrito) había entradas y salidas anteriores a la primera entrada rastreada que no se leyeron. Rellenando el hueco aparecieron 22 aristas (1,30 M$ brutos), pero 2 (298.919 $, entre ellas un envío de puente de 244.103 $) ya estaban en las salidas originales (Codex R1-09, verificado): quedan 20 aristas nuevas por 1.003.290 $ brutos, ninguna a una casa de cambio. El relleno pidió una sola página por activo y filtró por debajo de 3.520 $, así que es lo encontrado bajo esos filtros, no un tope del hueco.',
    alternativas: 'Ninguna: es una limitación de datos.',
    confianza: 'Alta (medido).',
    faltan: 'Relectura completa de las 112 billeteras sin el filtro de importe.',
    efecto: 'Se declara el hueco y lo encontrado (20 aristas nuevas, 1,00 M$ brutos, sin tope demostrado) en el método. Corrección del 1-nov: atribucion.cjs dejaba preventana-tramo1.json vacío (la variable preVentanaPorW nunca se asignaba); ahora la calcula desde las salidas de los remitentes y la lista tiene 112 billeteras (297 entradas, 13,99 M$ brutos, 13,77 M$ manchados). rellenar-hueco.cjs ahora pagina (200 por página, hasta 10 páginas) y da el mismo resultado: 22 aristas, 1.302.209 $ brutos, 0 a casas de cambio, 0 incompletas. Los resultados de atribución no cambian. No he podido comprobar por qué antes se citaban 123 billeteras: esa lista se perdió. Copias de lo anterior en respaldo-antes-de-arreglar/.'
  },
  {
    id: 'O-05', sev: 'Alta', clase: 'VERIFICADO (conteos y brutos) / ESTIMADO (importes atribuidos)', tema: 'Reproducibilidad',
    titulo: 'Billeteras que no se pudieron leer: no aparecen en el informe y en el segundo tramo son grandes',
    afirmacion: 'El informe no menciona lecturas fallidas.',
    aFavor: 'En el primer tramo son pocas: 81 billeteras, 24.161 $ atribuidos.',
    enContra: 'En el segundo tramo 342 billeteras no se pudieron leer. Les entran 32,15 M$ brutos y, con las purezas del propio informe, ≈ 10,67 M$ atribuidos (por ejemplo TYRXKm9WJx7NTS8eCRgEZNvKQCVHHQuZsq: 13,5 M$ brutos, 2,68 M$ atribuidos). El rastreo se detiene en ellas: ese dinero no es terminal ni «retenido». Los ficheros de resultados sí guardan los conteos (81 y 342), pero el artículo no los menciona.',
    alternativas: 'Parte puede haber llegado a casas de cambio o nodos no detectados; no se sabe.',
    confianza: 'Alta en los conteos; media en el importe atribuido (usa las purezas del informe).',
    faltan: 'Releer esas 342 billeteras con otra fuente o con paginación mayor.',
    efecto: 'Nueva limitación en el método y en «Qué no se puede afirmar»; las cifras del segundo tramo se declaran con cobertura incompleta (el rastreo se detiene en esas billeteras; no es una cota inferior ni superior). Son 423 registros de lectura fallida que corresponden a 420 direcciones distintas (3 fallan en ambos tramos).'
  },
  {
    id: 'O-06', sev: 'Media', clase: 'DESCONOCIDO', tema: 'Atribución',
    titulo: 'El «11 % sin explicar» se atribuye a causas que no se han demostrado',
    afirmacion: '5,5 M$ son «cambios sin decodificar, diferencias de precio TRX/USDT y entradas ajenas pequeñas».',
    aFavor: 'Con el método del informe el residuo es ≈ 5,5 M$ (11 %); el punto fijo reproducido da 5,24 M$. Corrección (Codex R1-08): el rango «5,2–5,7 M$ con todos los modelos» que escribí no se reproduce: con el retenido de cada modelo el residuo sale 0,46–0,52 M$ (hipótesis por defecto) y 0,92–0,97 M$ (entradas desconocidas limpias) y mezclando el retenido publicado sale 5,2–7,2 M$; se retira.',
    enContra: 'Nadie ha medido qué parte es cada causa. Sí se han medido otras: el hueco previo (20 movimientos adicionales encontrados bajo filtros, 1,00 M$ brutos; cobertura incompleta, no una parte conciliada del residuo) y las billeteras sin leer del primer tramo (24 k$). El resto queda sin explicar.',
    alternativas: 'Filtros del simulador y movimientos no guardados, errores de conservación (O-01) y precios fijos (O-07).',
    confianza: 'Media en la cifra (depende del método); baja en la causa.',
    faltan: 'Desglose por causa.',
    efecto: 'Se mantiene el 11 % y se retira la lista de causas como explicación; se declara «composición no demostrada».'
  },
  {
    id: 'O-07', sev: 'Baja', clase: 'VERIFICADO', tema: 'Reproducibilidad',
    titulo: 'TRX valorado siempre a 0,352 $',
    afirmacion: 'Precio fijo, ya declarado como límite.',
    aFavor: 'Declarado. Corrección (Codex R1-16): el 10 % solo afecta a la parte valorada en TRX; en las casas de cambio hay 9,83 M USDT y 7,60 M TRX brutos y pasar de 0,352 a 0,316 $ baja el bruto ≈ 0,27 M$ (≈ 2,2 %), no un 10 %. Las magnitudes mixtas habría que recalcularlas. No he comprobado el precio histórico de 0,316 $.',
    enContra: '634 de las 4.605 aristas finales están en TRX, y las conversiones TRX↔USDT que atraviesan swaps se valoran con el mismo precio fijo en ambos lados.',
    alternativas: 'Precio histórico por hora.',
    confianza: 'Alta.',
    faltan: 'Serie de precios por hora.',
    efecto: 'Sin cambio de cifras; se enlaza en la sección de incertidumbres.'
  },
  {
    id: 'O-08', sev: 'Baja', clase: 'VERIFICADO', tema: 'Cadena de custodia',
    titulo: 'La diferencia 46.394.098 → 46.383.069 TRX está totalmente explicada, pero el informe no la explicaba',
    afirmacion: 'En TRON salieron 46.394.098 TRX; a la billetera de reparto llegaron 46.383.069.',
    aFavor: 'Cuadra al TRX. Entrada desde Binance: 10.000 + 46.384.098 = 46.394.098. Salida: 10.000 (hash aa89eeab…) y 1.000 (hash 1aa73423…) a TPBkSjkCMn2ckrMuAP8n2J1jdjbw76bKN4, 46.383.069,129019 a la billetera de reparto (hash 6adfc066…) y 28,871 TRX de comisiones. 10.000 + 1.000 + 28,871 = 11.028,871 = 46.394.098 − 46.383.069,129 (los 0,032 TRX de saldo actual coinciden con una entrada de polvo de 0,032007 TRX posterior).',
    enContra: 'Los hashes de los 10.000 y 1.000 TRX a TPBkSj… no están en la tabla de evidencia del artículo (el artículo sí cita TPBkSj… como billetera que cambia USDT por TRX).',
    alternativas: 'Ninguna.',
    confianza: 'Alta.',
    faltan: 'Seguir TPBkSj… (1.000 TRX).',
    efecto: 'Se añade la conciliación exacta a la cadena de custodia.'
  },
  {
    id: 'O-09', sev: 'Baja', clase: 'VERIFICADO', tema: 'Puentes',
    titulo: 'Puente USDT0: 183 de 186 envíos verificados en el recibo del destino',
    afirmacion: '186 envíos, 8,0 M$ brutos, 183 llegaron y 3 no (157.220 $).',
    aFavor: 'Comprobado: enviado 8.003.291 USDT; entregados 183 (7.846.071 enviados, 7.843.786 recibidos según el recibo de la cadena de destino, comisión total 2.285 USDT, media 12,5); no entregados 3 (122.714 + 33.506 + 1.000 = 157.220), todos «en camino».',
    enContra: 'Mi cálculo previo de «comisión media 0,567 %» era erróneo (un valor atípico); queda corregido con los recibos.',
    alternativas: 'Ninguna.',
    confianza: 'Alta en las sumas (coinciden con el payload de LayerZero); la prueba del recibo sumaba cualquier evento Transfer al receptor sin filtrar el contrato emisor (Codex R1-18): se repitió registrando el contrato que emite cada evento contado (resultados/puentes-usdt0-log.txt).',
    faltan: 'Destino de los 3 envíos parados si se liberan.',
    efecto: 'Sin cambio de cifras; se añade el recibo de destino como fuente.'
  },
  {
    id: 'O-10', sev: 'Media', clase: 'ESTIMADO', tema: 'Puentes',
    titulo: 'THORChain: coincidencia agregada entre valor de entradas y recepciones; el remitente es un enrutador genérico',
    afirmacion: 'Las operaciones de THORChain (11,8 M$) devuelven dinero a 11 direcciones de TRON; no se puede decir qué parte es del robo.',
    aFavor: 'El valor de los activos de ENTRADA de las operaciones con memo a TRON (no el importe de salida pedido; el ETH se valora a 2.253 $ fijos, Codex R1-17) suma 11.813.819 $ y desde el 30-oct 14:00 las 11 direcciones reciben 11.825.868 $ del contrato TQqgNg13s2DjvXhW1ky4v6TsR8wZGvb7Y4 (0,1 % de diferencia); por dirección, en tres de las mayores el recibido desde ese contrato es del 93 %, 100 % y 104 % de lo pedido, pero en otras es del 113 %, del 150 % o de solo el 12 % (llegan otros remitentes), así que la coincidencia por dirección es irregular.',
    enContra: 'Ese contrato se llama UniversalRouter (1,7 M de operaciones según la consulta a TronScan del 31-oct guardada en resultados/universalrouter-cuenta.json): está clasificado como enrutador de cambios de uso general (no se ha establecido su papel en estas liquidaciones), así que la correspondencia es agregada, no operación a operación. Además las 11 direcciones recibieron en total 27,19 M$ de todas las fuentes (USDT 13,90 M + TRX 37,75 M).',
    alternativas: 'Que la salida de THORChain llegue vía otro enrutador y la coincidencia sea casual; no se puede valorar su probabilidad sin vincular operación por operación.',
    confianza: 'Media.',
    faltan: 'Enlazar cada salida de THORChain (hash de salida del vault) con su recepción en TRON.',
    efecto: 'Se añade la comparación pedido/recibido y se mantiene la cautela del informe.'
  },
  {
    id: 'O-11', sev: 'Alta', clase: 'HIPÓTESIS', tema: 'Nodos de servicio',
    titulo: 'El grupo del 11-oct: creación y fondeo próximos en el tiempo (coordinación inferida); «infraestructura propia de este blanqueo» no demostrada',
    afirmacion: 'Cinco billeteras creadas con menos de dos minutos de diferencia; el 64 % del USDT que entra en una muestra de 8 horas viene del recorrido, «lo que sugiere infraestructura propia del blanqueo y no un servicio de uso general».',
    aFavor: 'Las cinco recibieron su primer TRX entre las 23:35 y las 23:36 del 11-oct de cinco fondeadores distintos (TXXkfDwwHUrHnTAx1Sfn1Kp7b3qZ35kcQj, TXXCjsqRqa3WdjUMiesyAG72pSFfjhX8Th, TQFZuXmTssrCoAPU4bMTEBz5sNBSS1hxnP, TCanhfMgr9RsFRoxkJ8YkJD8Faha85a14p, TJ35bL49kvnQLCXW5wioEN5a6ZGw78Z6ET) que se crearon el 8-oct entre las 18:50 y las 18:53 y recibieron su propio primer fondeo de cinco direcciones distintas. Las fechas y direcciones están verificadas; que eso indique aprovisionamiento coordinado es un INDICIO (Codex R1-13), no una verificación de la causa.',
    enContra: 'Un estimador de intensidad (extrapola a 24 h el intervalo de las últimas 50 transferencias de cada fecha; no es un conteo diario y no se conservaron las muestras) da unas 40–340 transferencias/día desde el 12-oct, diecisiete días antes del robo, y ≈ 1.000–2.600 el 30-oct: tenían actividad previa con otras direcciones antes del robo. El 64 % es en parte circular (el recorrido se construyó siguiendo esas mismas aristas). Muestras de las últimas 200 transferencias de cada cuenta (Codex R1-14): la del 30-oct cubre desde ≈ 18:43–20:53 hasta ≈ 23:59 UTC (incluye actividad posterior a la foto de las 22:40) y da 92–99 % de entrada del recorrido; la del 31-oct (mañana-tarde) da 38–51 %; TQ5SdemHp… figura con 100 % pero su muestra (23:14–23:59) es íntegramente posterior a la foto. En las siete cuentas con permisos guardados no aparecen claves compartidas (TGSNahJv… y TZG47zhb… quedan sin cobertura verificable) ni primer fondeador común (esto no descarta que un mismo operador tenga todas las claves); solapamiento de contrapartes entre ellas 4–6 %. Que las contrapartes previas fueran «terceros» independientes tampoco está demostrado: solo se ve que había tráfico.',
    alternativas: 'Servicio comercial (procesador de pagos, OTC, mezclador de pago) preexistente que el ladrón usó; o infraestructura del ladrón preparada semanas antes del robo (el aprovisionamiento es del 8–11 oct, entre 18 y 21 días antes del robo).',
    confianza: 'Alta en los hechos; baja en cualquier conclusión de control común o identidad.',
    faltan: 'Etiquetas de analítica forense independiente; tráfico de las cinco con clientes ajenos antes del 29-oct (conteo por contraparte).',
    efecto: 'Se retira «no un servicio de uso general». Clasificación: fechas, direcciones y tráfico previo VERIFICADOS; aprovisionamiento coordinado, control común y servicio a terceros HIPÓTESIS; identidad DESCONOCIDO.'
  },
  {
    id: 'O-12', sev: 'Alta', clase: 'HIPÓTESIS', tema: 'Casas de cambio',
    titulo: '«Casi con seguridad direcciones de depósito de clientes» no está demostrado',
    afirmacion: 'Los remitentes a las casas son «billeteras de un solo uso o de poca actividad… casi con seguridad direcciones de depósito de clientes. Ahí está la persona identificable».',
    aFavor: 'En las últimas 50 transferencias USDT de cada remitente (resultados/remitentes-casas.json, consultado el 31-oct) sus salidas van a una única dirección (la caliente de la casa), patrón típico de una dirección de depósito que barre sus fondos.',
    enContra: 'Las 7 casas reciben en una sola dirección etiquetada (no hay depósitos de cliente identificados). Los remitentes de las mayores llegadas no son de un solo uso: TStvMPH7wv… (Gate) tiene 4.509 operaciones y 41 de sus últimas 50 transferencias USDT son entradas, de varios remitentes distintos; TFL9UDVKRt… (Bybit) 728 operaciones desde 2021; TXYiPCELFd… (Bybit, 2,46 M$ brutos) 360. Eso encaja también con una cuenta consolidadora de la propia casa, una mesa OTC o un procesador de pagos.',
    alternativas: 'Billetera consolidadora de la casa, mesa OTC, procesador de pagos, depósito de un cliente.',
    confianza: 'Baja en «depósito de cliente»; alta en que el destino final es la billetera caliente de la casa.',
    faltan: 'Confirmación de la casa (solicitud legal) o etiquetas forenses de pago.',
    efecto: 'Se cambia el título y el texto: «direcciones que barren a la casa; titular desconocido». Clase HIPÓTESIS.'
  },
  {
    id: 'O-13', sev: 'Alta', clase: 'ESTIMADO', tema: 'Casas de cambio',
    titulo: '4,15 M$ «llegados a casas de cambio»: bruto, atribuido y sensibilidad',
    afirmacion: '≈ 4,15 M$ del robo llegan a Bybit, OKX, Gate, KuCoin, Bitget, MXC y Kraken.',
    aFavor: 'Reproducido: 249 aristas, 12.500.275 $ brutos, 4.153.524 $ atribuidos; el atribuido es bruto × pureza en 246 de 249 aristas (±2 %).',
    enContra: 'La cifra es 100 % del segundo tramo, que reproduce exactamente el guion original según la revisión Codex (O-19). Con pureza ≥ 0,5 serían 2,65 M$, con ≥ 0,75 serían 0,08 M$ y con ≥ 0,9 serían 0. Las 10 mayores aristas son el 43,6 %; una sola (3,35 M$ brutos a Gate, pureza 0,163) aporta 0,55 M$. 342 billeteras sin leer (O-05) pueden contener llegadas no vistas, pero corregir purezas, ventanas y solapamientos también podría reducir lo atribuido: no es una cota inferior ni superior (Codex R1-12). Quitar aristas de pureza baja cambia el subconjunto contado, no da un intervalo de incertidumbre. Hay además una excepción a «ninguna casa recibe por billeteras de pureza alta»: 8.000 USDT a OKX Hot Wallet 8 desde TKNJbXPG5F9GSmps1vkHZugao2zrm1ao1F con pureza 0,806 (hash 0eed828b399b77c25ba32fea8eb495fd84a4c7fbb16980179f7d458a8f3be8b8; 6.446 $ atribuidos).',
    alternativas: 'Rango 2,7–4,2 M$ según el filtro de pureza mínima (sensibilidad al filtro, no intervalo de confianza); el bruto (12,5 M$) no es atribuible.',
    confianza: 'Media-baja.',
    faltan: 'Pureza medida con inventario real (O-01) en el segundo tramo y lectura de las 342 billeteras.',
    efecto: 'Se presenta como «≈ 4,15 M$ (estimación del recorrido observado, cobertura incompleta; 2,7 M$ si se exige pureza ≥ 0,5; beneficiarios no identificados)».'
  },
  {
    id: 'O-14', sev: 'Media', clase: 'ESTIMADO', tema: 'Préstamos',
    titulo: 'JustLend: ≈ 4,75 M$ depositados en 117 movimientos únicos, sin retiradas vistas; titular desconocido',
    afirmacion: '4.754.785 $ del robo depositados por 74 billeteras en 117 envíos; «puede retirarse».',
    aFavor: 'Reproduzco 4.754.777 $ en el primer tramo (el artículo cuenta 117 envíos). Corrección (Codex R1-01, verificada): la «arista del segundo tramo» que sumé hasta 118/4,81 M$ es el mismo depósito del primer tramo (hash 0af27abba980e0fd0ee8a101b226e1c9f725821e23ecff83e78b84b5cd5d6c41, TBAKNiq… → TXJgMd…, 60.837 USDT), atribuido 58.019 $ en el tramo 1 y 59.017 $ en el 2: lo había contado dos veces. Movimientos únicos: 117; bruto 4.769.850 USDT. En los 25 mayores pares remitente→protocolo no se ven retiradas de USDT del protocolo al mismo remitente desde el depósito.',
    enContra: 'No se ha seguido el token jUSDT (quien lo tenga puede retirar): el depósito es una posición en el protocolo, no un destino final; y una retirada por otra billetera del mismo operador no se vería con esta prueba.',
    alternativas: 'Posiciones que se retiran después; reciclaje.',
    confianza: 'Alta en los depósitos; baja en «dónde acaba».',
    faltan: 'Saldos jUSDT por billetera y eventos Redeem.',
    efecto: 'Se añade el control de retiradas y la salvedad.'
  },
  {
    id: 'O-15', sev: 'Media', clase: 'VERIFICADO', tema: 'Reproducibilidad',
    titulo: 'Las figuras se dibujan con cifras escritas a mano',
    afirmacion: 'Los grafos 1/4 a 4/4 reproducen los datos.',
    aFavor: 'Comprobado: las cifras de casas de cambio del grafo 2/4 (Bybit 2,21 M$ · 87, OKX 0,95 M$ · 120, Gate 0,74 M$ · 19) coinciden con el CSV.',
    enContra: 'Los guiones g2–g5 no leen ningún fichero (0 lecturas, 4–60 literales numéricos); cualquier cambio de datos exige editarlos a mano. No se ha verificado cada literal.',
    alternativas: 'Generar las figuras desde los JSON.',
    confianza: 'Media.',
    faltan: 'Comprobación literal a literal.',
    efecto: 'Las figuras se conservan sin alterar y cada nota de la auditoría indica qué texto queda superado.'
  },
  {
    id: 'O-16', sev: 'Baja', clase: 'VERIFICADO', tema: 'Reproducibilidad',
    titulo: 'Etiquetas de terceros y hora local',
    afirmacion: 'Los nombres de las 7 casas están confirmados con la etiqueta pública de TronScan.',
    aFavor: 'Recomprobado hoy en TronScan: Bybit, Gate, OKX Hot Wallet 8, Kucoin 4 y Bitget 9 (5 de las 7; MXC y Kraken no se han vuelto a consultar).',
    enContra: 'Dependen de un tercero que puede cambiar; las etiquetas no se han contrastado con una segunda fuente.',
    alternativas: 'Contraste con las propias casas o con bases forenses.',
    confianza: 'Media-alta.',
    faltan: 'Segunda fuente de etiquetas.',
    efecto: 'Se declara la dependencia. Hora: Madrid = UTC+1 (desde el 25-oct), coherente en todo el informe.'
  },
  {
    id: 'O-17', sev: 'Media', clase: 'VERIFICADO', tema: 'Reproducibilidad',
    titulo: 'La muestra de auditoría no cubre las lecturas fallidas ni el hueco previo',
    afirmacion: '70 billeteras de 1.347 y 2.898 y 120 aristas de 4.605: «sin ninguna omisión».',
    aFavor: 'Es una muestra aleatoria.',
    enContra: 'Una muestra de lo leído no puede detectar lo que no se leyó (O-04, O-05): 423 registros de lectura fallida (420 direcciones únicas).',
    alternativas: 'Muestreo estratificado incluyendo billeteras sin leer.',
    confianza: 'Alta.',
    faltan: 'Auditoría de las 420 direcciones sin leer.',
    efecto: 'Se declara la cobertura real de la auditoría original.'
  },
  {
    id: 'O-18', sev: 'Baja', clase: 'VERIFICADO', tema: 'Mi propia auditoría',
    titulo: 'Límites y errores de esta auditoría',
    afirmacion: '—',
    aFavor: 'Cada cifra de este informe sale de un script de esta carpeta.',
    enContra: 'El conteo por rangos de fechas de TronScan se corta en 10.000 e ignora el rango, así que usé muestras y ritmos estimados (marcados «≈»). Mi primera reconstrucción de «retenido» dio 26 M$ por errores míos (cambios y ventana) y se descartó. La muestra de contrapartes de los nodos es de 200 transferencias, no del historial completo.',
    alternativas: '—',
    confianza: 'Alta.',
    faltan: 'Un indexador completo.',
    efecto: 'Se declaran en la sección de método.'
  },
  {
    id: 'O-19', sev: 'Media', clase: 'VERIFICADO', tema: 'Reproducibilidad',
    titulo: 'Segundo tramo: mi reproducción no coincidía; la revisión Codex lo reproduce exacto (diferencia de mi adaptación)',
    afirmacion: 'Segundo tramo: nodos 22,8 M$, casas 4,15 M$, retenido 21,0 M$.',
    aFavor: 'Las 4,15 M$ de casas sí se reproducen sumando las aristas del CSV publicado (249 aristas).',
    enContra: 'Mi reconstrucción desde la caché daba nodos 19,35, casas 2,70 y retenido 10,5 M$. La revisión Codex (R1-03) ejecutó en memoria el guion original traza-post-analisis.cjs y reprodujo exactamente los resultados publicados: casas 4.153.525,16 $, nodos 22.809.101,90 $, retenido 21.004.188,78 $, 2.898 billeteras, purezas idénticas. La diferencia era de mi adaptación (caché de contratos neutros y exclusión de salidas a semillas). Esta reproducción la hizo Codex y la repetí yo personalmente el 1-nov con reproducir-tramo2.cjs (guion original traza-post-analisis.cjs, misma caché, sin red; el guion original no escribe nada, solo se guarda resultados/reproduccion-tramo2.json): 0 llamadas de red, todos los campos iguales (casas 4.153.525,16; nodos 22.809.101,90; retenido 21.004.188,78; 2.898 billeteras; diferencia máxima de pureza 0). Confirma el cálculo, no la validez económica del modelo.',
    alternativas: '—',
    confianza: 'Media-alta en que el cálculo es reproducible.',
    faltan: 'Nada sobre el cálculo; la validez económica del modelo es otra cuestión (ver la comparativa de modelos).',
    efecto: 'Se cierra como discrepancia de mi implementación; el segundo tramo es ESTIMADO reproducible con el guion original.'
  },
  {
    id: 'O-20', sev: 'Alta', clase: 'VERIFICADO', tema: 'Reproducibilidad',
    titulo: 'Los dos tramos comparten 99 aristas terminales: no se pueden sumar sin más',
    afirmacion: 'El artículo presenta los dos tramos como recorridos sucesivos y cita totales de cada uno (2.020 + 2.585 = 4.605 aristas).',
    aFavor: 'Cada tramo es coherente por separado y las casas de cambio no están en el solapamiento (0 de 99).',
    enContra: 'Revisión Codex R1-02, verificada con los CSV: 99 aristas idénticas (mismo hash, remitente, destino, token e importe) están en los dos tramos: 87 a nodos, 8 a puentes (1.147.488 USDT brutos; 451.153 $ atribuidos en el tramo 1 y 921.477 $ en el 2), 3 a USDD y 1 a préstamo. Las purezas de los dos cálculos son distintas, así que sumar tramos cuenta dos veces la misma transferencia con dos atribuciones.',
    alternativas: 'Presentar movimientos únicos con una atribución conjunta.',
    confianza: 'Alta.',
    faltan: 'Recalcular una atribución conjunta sin solapamiento.',
    efecto: 'Se advierte que 4.605 aristas no son 4.605 movimientos únicos y que los totales de ambos tramos no deben sumarse; las cifras por tramo se mantienen separadas.'
  }
];
