# Matriz de confianza (generada; no se suman puntos)

## R1 · TT2T17 → TEF9ZV (dinero)
**Clase propuesta:** DINERO: hay flujo directo y repetido

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Coincidencia de importes | Débil-media | Importes iguales (±1 TRX) entre lo que sale de TT2T17 y lo que entra en TEF9ZV, en 6 episodios | f0-3-pistas, a6-origen |
| Coincidencia temporal | Débil | Cada reenvío de la billetera intermedia tarda 1–2.55 min; la entrada en TEF9ZV llega 1–15 min después del reenvío en los episodios comprobados dentro de HTX 4 y la proveedora (f0-3, a6c) | f0-3-pistas, a6-origen |
| Flujos recurrentes | Media | 6 episodios entre oct-2025 y nov-2026 que suman 794 M TRX (47.31 % de lo recibido por TEF9ZV) | a3-libro/entradas-con-origen.json |
| Exclusividad financiera | Media-alta | TT2T17 es el mayor origen de TEF9ZV pero NO el único (47.31 %; el resto: TYL7z7VS 29.79 %, HTX-Cold 6 10.72 %, TPyjyZ 5.96 %, desconocida 5.96 %) | a3-libro |

**Qué falta:** Ninguna prueba de las dos más fuertes (permisos o contrato en común).

## R2 · TT2T17 ↔ TEF9ZV (trabajo: relevo de la energía a Binance)
**Clase propuesta:** TRABAJO: relación operativa con indicios fuertes

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Relevo de funciones sincronizado | Media | Víspera del robo: Binance recibía 648.73 M entre las dos; hoy 729.98 M solo de TEF9ZV. La retirada de TT2T17 (1-nov 07:34–07:37) llega horas después de que TEF9ZV empiece (01:29), no en minutos | a2-a4-a5/relevo-por-fecha.json |
| Clientes comunes | Media | Ambas dan energía a GasFree (TT2T17 187,5 M y TEF9ZV 339,1 M) | linea-base/delegaciones.json |
| Huella de procedimiento | Débil | Billeteras intermedias que reenvían en minutos y envío de importe −1 TRX en ambos | f0-3-pistas |
| Financiador común | Media | HTX-Cold 6 alimenta a TEF9ZV (180 M, 7-may-2026, vía TPznYuGC y HTX 4) y mandó a TT2T17: 2026-05-08 500 M (65a9e99c11) | a6-origen; historial de TT2T17 (raw a2) |

**Qué falta:** Nada impide que sean dos clientes de los mismos proveedores sin ser la misma mano.

## R3 · TT2T17 y TEF9ZV (control común)
**Clase propuesta:** CONTROL COMÚN: NO DEMOSTRADO

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Permisos compartidos verificables (ausente) | Muy alta | NINGÚN firmante en común entre las dos cuentas (TEF9ZV tiene 5 claves entre propietario y permisos; TT2T17 solo la suya) | b-permisos |
| Control contractual verificable (ausente) | Muy alta | No hay ningún contrato que una a las dos; el proxy TLLEN es de TT2T17 solamente | linea-base/contratos.json |

**Qué falta:** Haría falta una clave o contrato común, o un patrón de operación idéntico y demostrable.

## R4 · TPyjyZ → TEF9ZV (financiación, directa y por TYL7z7VS)
**Clase propuesta:** DINERO con ruta parcialmente conocida

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Coincidencia de importes | Débil-media | Directo: 100 M el 2-mar-2026 por billetera de un día y HTX 4 | a6-origen |
| Flujos recurrentes | Media | Indirecto: TYL7z7VS recibió 971 M de TPyjyZ (2022) y 950 M de TQwh1Z (2024) y mandó 500 M el 2-nov-2026; cuál de los dos pesa más es indeterminable (el TRX es intercambiable) | a6-origen/origen-entradas-sin-pareja.json |

**Qué falta:** Seguir el resto de las salidas de TYL7z7VS y el origen de TQwh1Z.

## R5 · TEF9ZV → billeteras nuevas de Binance (infraestructura y beneficio)
**Clase propuesta:** PRESTACIÓN verificada; contraprestación DESCONOCIDA

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Hecho verificable en cadena | Muy alta (como hecho, no como relación de control) | 715.2 M TRX de energía delegada (solo energía; con el ancho de banda 730 M); disponible 7975.44 M energía/día; consumida en 24 h 10535.27 M; ahorrado ≈924408.06 TRX/día a precio de quema (MODELO: techo) | a7-energia |
| Pago visible (ausente) | — | No hay ningún pago de Binance a TEF9ZV en la cadena | a3-libro |

**Qué falta:** Qué recibe quien presta la energía a cambio es DESCONOCIDO.

## R6 · TEF9ZV → TU3rMHyW → TM3sTVya ← TPyjyZ
**Clase propuesta:** CONTROL de TU3rMHyW por TM3sTVya VERIFICADO; vínculo con TPyjyZ = DINERO (400 M en 2023)

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Propiedad de una cuenta por la clave de otra | Muy alta | Desde 2024-08-23 la clave de propietario de TU3rMHyW es TM3sTVya (cambio de permisos en cadena) | b-permisos |
| Flujos recurrentes / importe | Débil-media | TPyjyZ mandó 400 M TRX a TM3sTVya el 2023-05-29 (importe −1 TRX) | c-tu3rmhyw/perfil-TM3sTVya.json |
| Coincidencia temporal | Débil | La primera delegación de TEF9ZV a TU3rMHyW (2026-03-02T16:10, 80 M) llega 70 min después de que entrasen en TEF9ZV los 100 M de TPyjyZ | c-tu3rmhyw, a3-libro |
| Hecho verificable en cadena | Muy alta (como hecho) | TU3rMHyW creó 41 contratos (routers/launchpad/gestor de pools); en 24 h sus contratos recibieron 10223 llamadas de 3278 direcciones y gastaron ≈2019.01 M de energía suya (estimación) de 1995.34 M disponibles | c-tu3rmhyw/contratos-y-llamadores.json |

**Qué falta:** No hay etiqueta pública de los contratos: no se afirma que sean oficiales de SunSwap/SunPump ni de nadie.

## R7 · TT2T17 ↔ proxy TLLEN
**Clase propuesta:** CONTROL CONTRACTUAL VERIFICADO (de TT2T17 sobre su propio apoderado)

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Control contractual verificable | Muy alta | owner() de TLLEN devuelve TT2T17 (consulta reproducible); authority() es la dirección cero; cache() = TM8Zpv6badmQnw6uo3jLhnRtYD5zoNY4Cj | linea-base/contratos.json |

**Qué falta:** Comparar el código con un proxy conocido; no cambia la relación, solo su tipo.

## R8 · Pareja de la proveedora (TSzSgxRi) ↔ Poloniex 2 y TWPpxPd5
**Clase propuesta:** FIRMANTE COMPARTIDO verificado; significado DESCONOCIDO

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Permisos compartidos verificables | Muy alta (como hecho) pero de alcance incierto | La clave TUgSgCQL (etiqueta TronScan «Poloniex 2», atribución de terceros) firma en la multifirma 3-de-5 de TSzSgxRi desde 2024-08-29 y en la de TWPpxPd5 (receptor de 0,37 M) | b-permisos/firmantes.json |
| Cautela (ausente) | — | Un mismo firmante puede servir a muchas cuentas de un custodio; sin el índice inverso de TRON no podemos contar en cuántas aparece | e-calidad/no-leido.json |

**Qué falta:** Qué relación hay entre quien opera Poloniex 2 y TSzSgxRi.

## R9 · TTXeVETa → TPyjyZ, TM3sTVya y otras 4 cuentas (reparto del 8-nov-2021)
**Clase propuesta:** FINANCIACIÓN COMÚN verificada (mismo origen, mismo día); control común NO demostrado

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Financiador común | Media-alta | TTXeVETa mandó 5456.89 M TRX a 6 cuentas entre 13:49 y 15:57 UTC del 2021-11-08: TPyjyZfs 997.88 M, TScVwVTj 950 M, TPhGmczy 960 M, TM3sTVya 970 M, TU32XvjD 950 M, TJNtFduS 629 M. Cinco de las seis nacieron ese día (TPyjyZ es de mayo de 2021) | c-tu3rmhyw/hermanas-y-origen.json |
| Atribución de terceros | Débil (es lo que dicen otros) | TTXeVETa había recibido 5789.32 M TRX de TNCmcTdy…, etiquetada «Poloniex» por TronScan; Protos dice que TPyjyZ «se fundó desde una dirección etiquetada Poloniex»; OKLink etiqueta a TPyjyZ «Justin Sun» | c-tu3rmhyw/hermanas-y-origen.json; docs/articulos/CITAS-MEDIOS-2026-10-29.md |
| Coincidencia temporal | Débil | Todo en 2 h 7 min | c-tu3rmhyw |

**Qué falta:** Que dos cuentas reciban del mismo distribuidor el mismo día no prueba el mismo dueño (podría ser un cliente grande con varios monederos, una casa de cambio o un custodio).

## R10 · TM3sTVya ↔ contratos de SUN.io (Universal Router, Permit2, LaunchPadProxy)
**Clase propuesta:** CONTROL de TM3sTVya sobre TU3rMHyW y sobre 2 contratos VERIFICADO; que sean los de SUN.io/SunPump = ATRIBUCIÓN DE TERCEROS

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Propiedad de una cuenta por la clave de otra | Muy alta | TM3sTVya es owner de TU3rMHyW (permisos) y owner() de LaunchPadProxy (TTfvyrAz…) y SafeVault (TG9nDZMU…) por consulta al contrato | b-permisos; c-tu3rmhyw/administradores-de-los-contratos.json |
| Atribución de terceros | Media | El centro de ayuda de SUN.io (sunio.zendesk.com, art. 54899665032601) lista como direcciones TRON el Universal Router TSJEtPuqHp… y Permit2 TTJxU3P8rH…; ambos los creó TU3rMHyW (2025-12-28). Bitquery (docs, SunPump) usa TTfvyrAz86… como el contrato de SunPump en sus consultas sin etiquetarlo expresamente (una sola fuente). El 19-may-2026 SUN.io anunció un Universal Router nuevo con «hasta 99 % de subsidio de energía» (KuCoin); TU3rMHyW creó un UniversalRouter el 8-may-2026 con coste de usuario del 1 % | c-tu3rmhyw/contratos-y-llamadores.json |

**Qué falta:** Confirmar con SUN.io (no con etiquetas) quién es su deployer; las páginas citadas se leyeron hoy y no se archivaron en bruto.

## R11 · TT2T17 → TEF9ZV: segundo relevo de energía (esta vez a TU3rMHyW)
**Clase propuesta:** TRABAJO: relevo repetido (refuerza R2)

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Relevo de funciones sincronizado | Media | TT2T17 delegó energía a TU3rMHyW en 27 altas y 38 bajas entre 2024-08-11 y 2026-05-07; TEF9ZV empezó el 2026-03-02 (solape de ~2 meses). Mismo patrón que con Binance en nov-2026: TEF9ZV empieza, TT2T17 retira después | c-tu3rmhyw/historia-de-la-energia-recibida.json |
| Flujos recurrentes | Media | Los dos clientes que cambian de proveedor (TU3rMHyW y Binance) pasan de TT2T17 a TEF9ZV | a2-a4-a5, c-tu3rmhyw |

**Qué falta:** Sigue sin haber clave ni contrato en común entre TT2T17 y TEF9ZV.

## R12 · Los 15 delegantes de TU3rMHyW (2024-2026) además de TEF9ZV
**Clase propuesta:** CÍRCULO con financiación común; control común NO demostrado

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Financiador común | Media-alta | De los 15 delegantes: 4 recibieron del reparto de TTXeVETa de 2021 (TPyjyZfs, TPhGmczy, TU32XvjD, TJNtFduS); 3 fueron fundadas por TPyjyZ en 2022 (TYL7z7VS, TLbkcH7Q, TFKSWmnR); 2 por TQwh1ZDB en 2023-24 (TWpMnUh9, TKpiitwG); 1 es TT2T17; 5 otras (TRzQrtxr, TXjbXLdJ, TU4hymfS, TFrT3EMH, TAibbFBA) | c-tu3rmhyw/circulo-delegantes.json, hermanas-y-origen.json |
| Flujos recurrentes | Media | TQwh1ZDB (cuenta de 2021) mandó 1.471 M a TKpiitwG el 20-ago-2024, que ese día mandó 600 M a TT2T17; 625 M a TWpMnUh9 en 2023 (que mandó 500 M a TT2T17 el 29-jul-2025 y recibió 310 M de TT2T17 en ene-2025) y 950 M a TYL7z7VS en dic-2024 (de donde salieron los 500 M de TEF9ZV) | c-tu3rmhyw/hermanas-y-origen.json, a6-origen |
| Coincidencia temporal | Débil | Nueve de estas cuentas empezaron a delegar energía a TU3rMHyW entre el 19 y el 21-ago-2024 y la mayoría la retiró el 2-sep (13 días después) (lanzamiento de SunPump: dato de contexto, no probado aquí) | c-tu3rmhyw/historia-de-la-energia-recibida.json |

**Qué falta:** Es un círculo operativo probable; cada pareja necesita su propia prueba fuerte para hablar de dueño común.

## R13 · TQwh1ZDB → TPyjyZ, TKpiitwG, TYL7z7VS, TRzQrtxr, TWpMnUh9 (nodo de reparto)
**Clase propuesta:** FINANCIACIÓN COMÚN verificada; origen del dinero de TQwh1ZDB sin seguir

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Financiador común | Media-alta | TQwh1ZDB (creada 2021-01-28; su primera operación fue recibir 9.999,99 TRX de TNCmcTdy…, la cuenta etiquetada «Poloniex» por TronScan) envió a cuentas del círculo: TKpiitwG 1471.08 M; TPyjyZ 1074.56 M; TYL7z7VS 950 M; TRzQrtxr 900 M; TWpMnUh9 625 M; TT2T17 (segunda cuenta) 91.32 M; y a otras tres sin etiqueta THUE6WTL 2563.11 M, TDqMwZVT 2027.4 M, TFsuFNs5 1900 M | c-tu3rmhyw/TQwh1ZDB-y-cabos.json |
| Coincidencia temporal | Débil | El 4-dic-2024 mandó 950 M a TYL7z7VS, 900 M a TRzQrtxr y 2.563 M a THUE6WTLaE; ese mismo día TPyjyZ mandó 900 M a TT2T17 | c-tu3rmhyw |
| Cautela (ausente) | — | Solo 2.378 M entraron en TQwh1ZDB como transferencias directas; el resto de lo que sacó (≈ 11.700 M) entró por llamadas a contratos (1.413) y no se ha reconstruido | e-calidad |

**Qué falta:** De dónde salió el dinero que reparte TQwh1ZDB.

## R14 · Origen del TRX que entra en TT2T17 (entradas ≥ 1 M, 7.939 M)
**Clase propuesta:** EL CÍRCULO es el mayor origen de TT2T17 (≈ 57 % con «Vaneck»); ni Binance ni HTX lo son

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Exclusividad financiera | Media-alta | círculo 44.86 %; Binance 20.56 %; «Vaneck» (círculo) 11.87 %; otras 6.68 %; HTX-Cold 6 6.3 %; HTX 3 5.2 %; HTX 4 4.52 %. Atención: «círculo» lo define el propio método de investigación (cuentas halladas en c4–c7), así que su peso puede estar inflado por selección | c-tu3rmhyw/entradas-de-TT2T17.json |
| Flujos recurrentes | Media | El dinero va y viene dentro del círculo: TT2T17 mandó 500 M a TJNtFduS (17-feb-2025) y 310 M a TWpMnUh9 (ene-2025) y recibió de ellas y de TScVwVTj 1.170 M, de TKpiitwG 600 M y de TPyjyZ 900 M | c-tu3rmhyw |

**Qué falta:** Sigue sin haber clave ni contrato en común: es un patrón de financiación y de operación, no una prueba de dueño.

## R15 · TGGykSTh (2.º proveedor de energía de dos billeteras de Binance)
**Clase propuesta:** ENERGÍA con probable origen en Binance (HIPÓTESIS)

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Flujos recurrentes | Media | Creada 2025-07-03; su único contacto grande es «Binance-Cold 2» (TronScan): recibió de ella 220 M y le devolvió 90 M; delega 110,9 M a Binance-Hot 14 y 15 | c-tu3rmhyw/TQwh1ZDB-y-cabos.json; a7-energia |

**Qué falta:** Que sea energía propia de Binance es una lectura; no hay etiqueta de la cuenta.

## R16 · TT2T17 ↔ TLLEN ↔ bóvedas de deuda del sistema USDD (Vat, DssCdpManager, adaptadores GemJoin)
**Clase propuesta:** CONTROL CONTRACTUAL VERIFICADO; mecanismo = PRÉSTAMO CON GARANTÍA (CDP tipo Maker) VERIFICADO

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Control contractual verificable | Muy alta | owner() de TLLEN = TT2T17; el código contiene las funciones de un DSProxy (execute x2, setOwner, setAuthority, owner, authority, cache); las 15 llamadas correctas de TT2T17 son `execute` hacia el contrato DssProxyActions (TEk9usYZ…) | l-contrato/tllen-codigo-y-llamadas.json |
| Hecho verificable en cadena | Muy alta (como hecho) | Funciones internas llamadas: 3× openLockTRXAndDraw, 5× lockTRXAndDraw, 1× openLockGemAndDraw, 1× safeLockTRX, 2× wipeAndFreeTRX, 3× wipeAllAndFreeTRX. El gestor DssCdpManager (TDDWjmQa…) lista 4 bóvedas de TLLEN: #11 TRX-B, #12 TRX-A, #13 TRX-C, #14 USDT-A | l-contrato/tllen-funciones-y-boveda.json |
| Hecho verificable en cadena | Muy alta (como hecho) | TRX metido en WTRX por el apoderado 1203 M y sacado 1203 M: cierra a cero. USDD emitido (todas las bóvedas) 135.71 M y quemado 135.9 M. Las bóvedas de TRX están hoy a cero | l-contrato/tllen-funciones-y-boveda.json |
| Hecho verificable en cadena | Muy alta (como hecho) | La bóveda USDT-A (#14) sigue abierta desde 23-ene-2025: 500000 USDT de garantía y 407110.21 USDD de deuda | l-contrato/tllen-funciones-y-boveda.json |

**Qué falta:** Para qué se usó el USDD (se ve que acabó convertido a USDT y enviado a la proveedora) sigue siendo una lectura, no un hecho.

## R17 · Tesorería de TRON Inc. (TEySEZLJ…, según Protos) ↔ proveedora TWhDfwC8… y HTX 4
**Clase propuesta:** DINERO pequeño: la proveedora NO es sobre todo proveedora de TRON Inc.

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Hecho verificable en cadena | Muy alta (como hecho) | TEySEZLJ recibió 677.6 M TRX de TFZZx3HX… (2 envíos, jun-ago 2025) y metió 719.37 M TRX en el contrato sTRX (JustLend) con deposit(): hoy 581.68 M sTRX y 2.74 M TRX libres | b-proveedora/tron-inc.json, tron-inc-strx.json |
| Flujos recurrentes | Media | Compras diarias posteriores: HTX 4 20.48 M TRX (ene-may 2026) y la proveedora 22.25 M TRX (jun-nov 2026, 148 envíos). Frente a los 750 M TRX que la proveedora mandó a TEF9ZV, es el 3 % | b-proveedora/tron-inc.json, a3-libro |

**Qué falta:** Protos atribuye la dirección a TRON Inc.; la cadena no lo confirma ni lo desmiente.

## R18 · Proveedora TWhDfwC8… ↔ cuenta de energía TEF9ZV, segunda cuenta TT2T17 y Binance (qué papel hace la proveedora)
**Clase propuesta:** RELACIÓN OPERATIVA VERIFICADA (la proveedora hace de paso/relevo de TRX y USDT); CONTROL COMÚN NO DEMOSTRADO

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Hecho verificable en cadena | Muy alta (como hecho) | Historial completo (2023-11-28 → 2026-11-05, 1245011 transferencias TRC-20 y 592582 de TRX): USDT entra 7091.21 M y sale 7090.73 M; TRX entra 3318.48 M y sale 3317.87 M. Cierra casi a cero: es una cuenta de paso, no un depósito | b-proveedora/analisis-proveedora.json |
| Hecho verificable en cadena | Muy alta (como hecho) | Los 750 M TRX que mandó a TEF9ZV salieron en tres envíos (20-oct, 2-nov, 4-nov), cada uno el mismo día en que recibió de otra cuenta ese mismo importe: 10-20T12:03 sale a TEF9ZVUx 100 M; 11-02T09:55 entra de TJHKNV4J 500 M; 11-02T09:59 sale a TEF9ZVUx 500 M; 11-04T10:41 entra de TQRBxpS5 150 M; 11-04T10:55 sale a TEF9ZVUx 150 M (siempre 1 TRX menos que lo recibido) | b-proveedora/flujos-clave.json |
| Flujos recurrentes | Media | Con TT2T17 solo hay un sentido directo: proveedora → TT2T17 (65 envíos de USDT, 151.83 M, 2024-2026) y lotes de tokens del ecosistema de Sun (NFT, BTT, WIN, SUN, JST, HTX, USDJ, TUSD, USDD antiguo) en cinco fechas de 2024. Nunca de TT2T17 directamente a la proveedora: lo que TT2T17 le manda a ella pasa antes por cuentas nuevas de un solo uso | b-proveedora/flujos-clave.json |
| Coincidencia temporal | Débil | 2-nov: TT2T17 manda 60 M y 80 M de USDT a dos cuentas creadas ese día (TCFfQYygyf…, TKV6xqB7VP…); cada una reenvía todo a la proveedora; la proveedora manda 138 M a una tercera cuenta nueva (TVpNiLp3Hh…) que lo ingresa en Binance-Hot 12. 3-nov: la proveedora devuelve 110 M de USDT a TT2T17. Cada eslabón de esa cadena es un hecho de la cadena; lo débil es leer de ahí una unidad de mando: que el 2-nov y el 4-nov la misma proveedora sirva además 500 M y 150 M de TRX a TEF9ZV es solo coincidencia de fechas | b-proveedora/cadena-138m.json, flujos-clave.json |
| Hecho verificable en cadena | Muy alta (como hecho) | La proveedora SÍ tiene contacto directo con 10 de las 25 billeteras de Binance conocidas, pero pequeño: recibe 9.25 M USDT (de 7.091 M) y manda 0.25 M TRX; no recibe TRX de Binance. (La versión anterior decía «ninguno» porque solo cargaba Hot 12–21; corregido tras la revisión externa.) Además llega a ellas en dos saltos (TVpNiLp3Hh → Hot 12: 138 M; en muestra, TFvgoqKb, TEVD7K98 y TPEfWM9Z → Binance-Hot 7) | b-proveedora/flujos-clave.json, vecinas-proveedora.json, hot12-y-devolucion.json |
| Permisos compartidos verificables (ausente) | Muy alta | No se ha comprobado ninguna clave, permiso ni contrato compartido entre la proveedora y TEF9ZV o TT2T17; la energía de las cuentas de un solo uso del 2-nov la alquiló TNQKXEB7Ex… (servicio de alquiler de energía, ~1,08 M de operaciones), no TEF9ZV | b-proveedora/cadena-138m.json |

**Qué falta:** Quién es el dueño de la proveedora (7.000 M USDT de paso en 3 años) y de TVpNiLp3Hh…; qué hace Binance con los 138 M dentro de Hot 12 (4.167 M de entradas y 4.169 M de salidas desde el 2-nov: es una masa indistinguible); el 2-nov la proveedora recibió 80 M y envió 78 M a TVpNiLp3Hh (la diferencia no se ha seguido).

## R19 · Entorno operativo de la proveedora: la pareja TSzSgxRi…, TWPpxPd5…, la «recolectora» TFSd14UQ…, Poloniex 2 (TUgSgCQL…) y las billeteras de Binance
**Clase propuesta:** ENTORNO OPERATIVO con un firmante común verificado (Poloniex 2 en dos multifirmas); DUEÑO DE LA PROVEEDORA NO IDENTIFICADO

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Permisos compartidos verificables | Muy alta | TSzSgxRi… (la pareja, creada un día después de la proveedora) y TWPpxPd5… son multifirmas 3 de 5 y las dos tienen entre sus cinco firmantes (peso 1 cada uno, umbral 3: un firmante común, NO control por sí solo) a TUgSgCQL… (etiqueta de TronScan «Poloniex 2», cuenta de clave simple). De las otras 8 llaves, 4 nunca se activaron como cuenta y 4 existen con 3–10 operaciones; tres se crearon el mismo día que la cuenta que firman y una (2025) años después | b-proveedora/dueno-proveedora.json, claves-y-origen-usdt.json |
| Flujos recurrentes | Media-alta | TFSd14UQ… (creada el 6-ago-2026) recibió 886.16 M USDT de 22 orígenes: 20 con etiqueta Binance (todo salvo 9,22 USDT) y 2 direcciones que imitan a la de la proveedora (envenenamiento de direcciones); 461 entradas y 456 salidas; lo mandó TODO a la proveedora en pagos de 5–10 M. Salida a Binance en dos saltos, solo con vecinas leídas enteras: 389.6 M (mínimo, más 92 M en una muestra) | b-proveedora/claves-y-origen-usdt.json, ciclo-con-binance.json |
| Coincidencia temporal | Débil | Casi todas las cuentas de este entorno se crearon entre el 5-jun y el 22-ago-2026 (y las de un solo uso el 2-nov), justo cuando el volumen de la proveedora se multiplica | b-proveedora/dueno-proveedora.json |
| Permisos compartidos verificables (ausente) | Muy alta | La proveedora tiene clave simple (su propia dirección, umbral 1): no hay ninguna clave visible que la una con la pareja, con TWPpxPd5…, con TT2T17… o con TEF9ZV…. Su primera transferencia de TRX recibida (3 s después de crearse) fue 1 TRX de TLaeRVed… (cuenta de 2021, 110 operaciones) y la primera financiación, 110 TRX de otra recién creada (TQ8CEdBY…, 8 operaciones): no identifican a nadie | b-proveedora/dueno-proveedora.json, claves-y-origen-usdt.json |

**Qué falta:** Quién controla la clave de la proveedora; si Poloniex es dueño, custodio o solo un firmante de los multifirmas; y si quien mueve la recolectora es Binance, un cliente de Binance o un tercero. Nada de esto se ve en la cadena.

## R20 · El círculo de 2020-2026 (TPyjyZ, TQwh1ZDB, TT2T17, TYL7z7VS, TKpiitwG, TWpMnUh9 y las demás) entre sí y con TU3rMHyW y TEF9ZV
**Clase propuesta:** DINERO entre 33 parejas y TRABAJO en 2 (regla del plan v2, tras la revisión externa); CONTROL COMÚN verificado solo en TM3sTVya → TU3rMHyW; el resto, no demostrado

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Propiedad de una cuenta por la clave de otra | Muy alta | TM3sTVya… figura como clave del permiso de TU3rMHyW…: TM3sTVya es clave de TU3rMHyW. Ninguna de las demás cuentas del círculo tiene como clave a otra cuenta del caso (todas, clave simple propia) | d-historia/conclusion-por-pareja.json |
| Exclusividad financiera | Media-alta | Primera financiación de las 18 cuentas leídas: TNCmcTdy → 4 (TPyjyZ, TQwh1ZDB, TRzQrtxr, TUTtLtGj); TPyjyZfs → 4 (TYL7z7VS, TLbkcH7Q, TFKSWmnR, TCGVFGDd); TTXeVETa → 5 (TScVwVTj, TM3sTVya, TJNtFduS, TU32XvjD, TPhGmczy). TNCmcTdy y TTXeVETa son la misma cadena (TNCmcTdy, hoy etiquetada «Poloniex», financió a TTXeVETa el 8-nov-2021); atención: «el círculo» lo define el propio método | d-historia/flujos-y-huellas.json |
| Flujos recurrentes | Media | Once cuentas del círculo delegaron energía a TU3rMHyW desde agosto de 2024, nueve de ellas de una vez entre el 19 y el 21-ago-2024 (11 delegantes en total; TT2T17 27 veces, 3.347 M TRX; TPyjyZ 5 veces, 2.156 M) y TEF9ZV les relevó desde el 2-mar-2026 (207 M, 6 veces) | d-historia/flujos-y-huellas.json |
| Huella de procedimiento | Débil | TT2T17 y TM3sTVya comparten 2 de sus votos a representantes (de 7 y 6); TU32XvjD, TLbkcH7Q y TFKSWmnR concentran su actividad en las horas 0–2 UTC; las dotaciones de 2021 terminan en 999/1999/3000 TRX y la primera entrada de TT2T17 fue 1.999 TRX. Estas huellas no suben de escalón por sí solas | d-historia/flujos-y-huellas.json |
| Coincidencia temporal | Débil | Seis cuentas nacen el 8-nov-2021 con 400–970 M cada una; dos más el 16-jun-2022 con 970 M cada una (de TPyjyZ); nueve cuentas delegan a TU3rMHyW entre el 19 y el 21-ago-2024 | d-historia/flujos-y-huellas.json |

**Qué falta:** Una clave, un contrato o un permiso compartidos entre las cuentas que mueven el dinero (TT2T17, TPyjyZ, TQwh1ZDB, TEF9ZV): hoy no hay ninguno. La identidad de quien está detrás sigue fuera de lo que la cadena prueba.

## R21 · Robo a Binance (billeteras del rastreo) ↔ proveedora, cuenta de energía, segunda cuenta y el resto de cuentas leídas
**Clase propuesta:** SIN CONTACTO DIRECTO VERIFICADO (no hay relación visible entre el robo y estas cuentas)

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Hecho verificable en cadena (ausente) | Muy alta (como hecho) | De 81 billeteras del robo (nodos del rastreo, cuentas del vigilante pausado y direcciones bloqueadas hoy por Tether, sin casas de cambio) ninguna aparece como contraparte directa en 1837593 filas del historial completo de la proveedora ni en 4087 páginas de historiales de 113 cuentas (TEF9ZV, TT2T17, el círculo, la pareja, las vecinas grandes…) | e-cruce/cruce-con-el-robo.json |

**Qué falta:** No se han mirado contactos de segundo salto (robo → X → estas cuentas) ni las 64.000 billeteras del modo árbol del vigilante pausado; que ambos sistemas usen billeteras de Binance no es relación entre ellos.

## R22 · TRX del génesis / antigua TRON Foundation (Zion, TSnjgPDQ…, las 1.000 direcciones) ↔ el círculo ↔ HTX 4 ↔ tesorería de TRON Inc. (TEySEZLJ…)
**Clase propuesta:** FINANCIACIÓN VERIFICADA (cadena de transferencias hasta la tesorería de TRON Inc.); que ese TRX sea «de Zion» NO se sostiene en la entrega de junio (0 % con dos modelos, 11,6 % con el proporcional); CONTROL COMÚN NO DEMOSTRADO

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Hecho verificable en cadena | Muy alta (como hecho) | El bloque 0 da 99.000 M TRX a Zion (TLLM21wt…). El 25-jun-2018 Zion manda 33251.81 M TRX a TSnjgPDQ…, que los reparte a 1000 cuentas: coinciden 1000 de 1000 con la lista que la cuenta «TRON DAO» publicó en Medium el 1-jul-2018 (mismo importe cada una; suma 33251.81 M). Eso identifica a Zion y a TSnjgPDQ… como las cuentas de la Foundation por su propia publicación | f-fundacion/lista-oficial-vs-cadena.json, nivel1-y-las-mil.json |
| Hecho verificable en cadena | Muy alta (como hecho) | Zion manda 429,75 M TRX a TWpMnUh9… (cuenta del círculo) el 3-ago-2023 y 269 M a TVxiBzCR… el 30-may-2023 (que los pasa el mismo día a Binance-Hot 2). Es de las pocas salidas de Zion tras 2019 | f-fundacion/zion-tronscan.json, segundo-nivel.json |
| Hecho verificable en cadena | Muy alta (como hecho) | El 28-jun-2025 TWpMnUh9… → THxg4UEz… (11:10) → HTX 4 (11:14) → TFZZx3HX… (11:16) → TEySEZLJ… (11:19): 365096845 TRX en 8,5 minutos. La cifra coincide con los 365.096.845 TRX que SRM Entertainment/Tron Inc. declaró tener el 30-jun-2025 (8-K, atribución de la propia empresa). El 28-ago-2025 TPyjyZ… manda 321,5 M a THxg4UEz…, que los ingresa en HTX 4; de HTX 4 salen 312,5 M a TFZZx3HX… y de ahí a TEySEZLJ…: aquí el importe cambia (−9 M) al pasar por la casa de cambio, así que el enlace es de importe aproximado y hora, no el mismo dinero demostrado | f-fundacion/puente-a-tron-inc.json |
| Coincidencia de importes | Débil-media | Cuánto de esos 365,1 M es TRX «de Zion» depende del modelo: primero-en-entrar 0 M (0 %), último-en-entrar 0 M (0 %), proporcional 42.47 M (11.63 %). El TRX es intercambiable: la cadena no dice cuál moneda se envía | f-fundacion/libro-twpmnuh9.json |
| Permisos compartidos verificables (ausente) | Muy alta | Ninguna clave, permiso ni contrato compartido entre Zion, TWpMnUh9…, TPyjyZ…, THxg4UEz…, TFZZx3HX… y TEySEZLJ… (todas con su propia clave, umbral 1; HTX 4 también) | f-fundacion/puente-a-tron-inc.json |

**Qué falta:** Qué es THxg4UEz… (24 operaciones, solo este uso) y TFZZx3HX… (37), y si la entrega a TRON Inc. fue una venta, una aportación o un reparto. Quién controla Zion hoy (conserva 30,6 TRX y activos). El destino del TRX de las 1.000 direcciones (lectura de F3 en curso).

## R23 · Las 1.000 direcciones de la antigua TRON Foundation ↔ sus cuentas de reunión ↔ casas de cambio (Binance, OKX, Poloniex) ↔ el círculo (TWpMnUh9…, TJNtFduS…, TRzQrtxr…)
**Clase propuesta:** FINANCIACIÓN VERIFICADA parcial: TRX de la Foundation concentrado en 14 cuentas de reunión; de ahí, ≈ 14,4 miles de millones a Binance-Hot 2, 0,7 a Binance-Hot 1, 2,9 a OKX 1 y 3,9 a TNCmcTdy… (Poloniex), en el primer salto; CIRCULO recibe de 3 cuentas de reunión (1.131 M a TWpMnUh9…); CONTROL COMÚN NO DEMOSTRADO

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Hecho verificable en cadena | Muy alta (como hecho) | Las 1.000 cuentas (1543 envíos salientes de TRX, 33.29 miles de millones) concentraron su TRX en 15 cuentas; 9 reciben de 20 o más de ellas. Las mayores: TJkgTCg9… 12334.52 M (370 cuentas, 2022-05); TFDeweDK… 5324.75 M (160 cuentas, 2020-09); TNzhS9jb… 4036.4 M (120 cuentas, 2020-08); TJ5GHePd… 3000.14 M (91 cuentas, 2020-05); TYSZXcgP… 2931.1 M (92 cuentas, 2022-02) | f-fundacion/destino-de-las-mil.json |
| Hecho verificable en cadena | Muy alta (como hecho) | Primer salto desde las cuentas de reunión (envíos ≥ 100 M): 14.39 miles de millones a Binance-Hot 2, 0.69 a Binance-Hot 1, 2.88 a OKX 1 y 3.88 a TNCmcTdy… (Poloniex); el resto pasa por cuentas sin etiqueta con 200–1.000 operaciones que NO se han seguido. Total del primer salto: 37.22 miles de millones, frente a 33.21 recibidos de las 1.000: el TRX es intercambiable y no se puede atribuir cada destino a la Foundation | f-fundacion/de-las-mil-al-circulo.json |
| Hecho verificable en cadena | Muy alta (como hecho) | Tres cuentas de reunión mandan TRX a TWpMnUh9…: TVJVQtD1… 370 M (2023-07-15); TTXojNiH… 387 M (2023-07-15); TDirN49r… 374.23 M (2024-07-13) = 1131.23 M. Las dos primeras (15-jul-2023) y la tercera (13-jul-2024) habían recibido TRX de las 1.000 el 30-mar-2021. TT2T17… recibe 3,3 M de dos de ellas el 2-jun-2025 | f-fundacion/de-las-mil-al-circulo.json |
| Coincidencia temporal | Débil | El 8-nov-2021 (el día en que nace parte del círculo) la cuenta de reunión TV6qo5vZ… manda 1.708,56 M a TNCmcTdy… (Poloniex) entre las 16:18 y las 16:54 UTC; en esa franja TNCmcTdy… manda 300 M a TJNtFduS… (16:23) y 400 M a TRzQrtxr… (17:13), cuentas del círculo. La lectura de ese día es PARCIAL (1.179 de 2.405 transferencias: tope de paginación de TronScan) y el TRX de una casa de cambio es intercambiable: es una coincidencia de hora e importes, no una prueba de origen | f-fundacion/hub-poloniex-2021.json |
| Permisos compartidos verificables (ausente) | Muy alta | Sin clave, permiso ni contrato compartido entre las cuentas de reunión y las del círculo (las 14 cuentas de reunión se examinaron en g1: todas con su sola clave propia. Excepción de otra relación: la cuenta etiquetada «Poloniex» TNCmcTdy… la controla la proveedora, ver R24) | f-fundacion/puente-a-tron-inc.json |

**Qué falta:** Adónde fue el TRX en las cuentas intermedias sin etiqueta (TPmiBjv6Th 5,3 miles de millones, TE9GVXi1zj/TGuxFggKBk 4,0, etc.), de quién es la cuenta de reunión TV6qo5vZ… (24.200 M de entradas y salidas en 7.875 operaciones: parece una cuenta de paso con rotación) y quién es TEQBe7Mdnf… que le mandó los 1.708 M del 8-nov-2021.

## R24 · La cuenta etiquetada «Poloniex» (TNCmcTdy…) ↔ «Poloniex 2» (TUgSgCQL…) ↔ la proveedora (TWhDfwC8…) y su pareja multifirma (TSzSgxRi…, TWPpxPd5…)
**Clase propuesta:** CONTROL COMÚN VERIFICADO POR CLAVE: la única clave de TNCmcTdy… es la proveedora desde el 8-ene-2024, instalada con la firma de «Poloniex 2», que además firma en las dos multifirmas de la proveedora. QUIÉN HAY DETRÁS: DESCONOCIDO; las etiquetas «Poloniex» y «Poloniex 2» son de TronScan (atribución de terceros)

| Evidencia | Fuerza | Hecho | Fichero |
|---|---|---|---|
| Propiedad de una cuenta por la clave de otra | Muy alta | TNCmcTdy… (TronScan: «Poloniex», creada 22-abr-2019, 5752021 operaciones) tiene hoy como ÚNICA clave de propietario y de actividad la dirección de la proveedora (peso 3, umbral 3). TronGrid y TronScan coinciden | g-vinculos/claves-casas-de-cambio.json |
| Propiedad de una cuenta por la clave de otra | Muy alta | Historial de permisos de TNCmcTdy… (3 cambios desde el 31-oct-2023; antes no leído): 2023-11-11T17:13:30Z firmado por TNCmcTdy… → clave TUgSgCQL…; 2024-01-08T16:29:27Z firmado por TUgSgCQL… → clave TUgSgCQL…; 2024-01-08T16:33:30Z firmado por TUgSgCQL… → clave TWhDfwC8… | g-vinculos/proveedora-y-poloniex.json |
| Permisos compartidos verificables | Muy alta | El firmante se recupera de la firma ECDSA de cada transacción (método comprobado con cuentas de clave propia: 8/8 y 8/8). Desde el 8-ene-2024 16:33 las transacciones enviadas por TNCmcTdy… (1028 leídas) las firma la proveedora; antes de la rotación, la propia clave de TNCmcTdy… | g-vinculos/proveedora-y-poloniex.json |
| Permisos compartidos verificables | Muy alta | «Poloniex 2» (TUgSgCQL…, clave propia) firma en las multifirmas 3 de 5 de la pareja de la proveedora (desde 2024-08-29) y de TWPpxPd5… (2026-07-28 06:11 UTC, dos horas y media después de crearla). Una de cinco llaves por cuenta: señal, no control por sí sola; pero encaja con la cadena de arriba | g-vinculos/claves-casas-de-cambio.json |
| Coincidencia temporal | Débil-media | La primera rotación de la clave de TNCmcTdy… es del 11-nov-2023, un día después del hackeo público de Poloniex (10-nov-2023, según prensa: The Block, FXStreet). Es coherente con que la etiqueta «Poloniex» sea correcta, pero no la verifica | g-vinculos/proveedora-y-poloniex.json |
| Flujos recurrentes | Media | TNCmcTdy… manda a la proveedora 160 pagos de USDT (1152501.44 USDT, 8-ene-2024 → 9-oct-2026) y 10 de TRX (93907.51 TRX); la proveedora le manda 161 pagos de TRX (2441.09 TRX). Es poco frente a los 7.091 M USDT que mueve la proveedora: «Poloniex» (esta cuenta) no es su fuente principal | g-vinculos/proveedora-y-poloniex.json |
| Permisos compartidos verificables (ausente) | Muy alta | Sin clave compartida entre HTX (3 cuentas), OKX (6), Binance (25) o las 14 cuentas de reunión de la Foundation y ninguna cuenta del caso: todas tienen solo su clave propia. El vínculo de HTX con Sun es público (declaraciones), no de claves en cadena. La proveedora es clave únicamente de TNCmcTdy… entre sus 197 contrapartes mayores | g-vinculos/claves-casas-de-cambio.json |

**Qué falta:** Quién controla la clave de «Poloniex 2» (si el operador de la casa de cambio, su dueño u otra parte); el historial de permisos de TNCmcTdy… anterior al 31-oct-2023 (tope de 60.000 transacciones); cuánto del USDT de la proveedora viene de otras billeteras de Poloniex sin etiquetar; si la etiqueta «Poloniex» de TronScan sigue vigente.
