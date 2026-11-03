<!-- Revisión independiente con Claude (claude-sonnet-5-5, esfuerzo max, --safe-mode, con node). Respuesta sin editar. Coste: 3.3395 $; turnos: 33 -->
Reviso A y B sin escribir nada: todos los cálculos con node fueron en memoria. Tres cosas, antes del detalle:
- **Diagnóstico de A:** el mecanismo es correcto, pero la frase «ya están en el tramo 5» solo vale para el 86,7 %.
- **El +5,6 %:** no es un residuo. Una sola billetera lo explica entero.
- **Cortar en la foto:** es correcto para quitar el duplicado, pero deja sin seguir lo que estaba en tránsito en la foto.

## 1) OBJECIONES

**1. [A · lógica / sin evidencia · ALTA]**
- **Cita:** «el tramo 6 reparte 53,6 M$ sobre 50,8 M$ de entrada (+5,6 %), un residuo del modelo de mezcla proporcional» (`novedades.json`, v0.3, «Límites que siguen abiertos»).
- **Lo que encuentro:** el exceso es 2.824.952 $, un 5,564 %. Una suma de partidas que supera a la entrada es dinero creado, no redondeo. Lo recalculé con la caché del tramo 6 cortada en la foto. La billetera `TB7pUXywPHA4UUhyVbX4U9hsBCFQm14z31` lo explica entera:
  - Recibe 27 pagos de la bóveda de Chainflip (`TEcDijvK…`), entre las 17:03 y las 21:08 del 30-oct, por 3.197.675 $. Los reenvía a UsdtOFT por los mismos importes y en el mismo minuto.
  - Solo 2 pagos están enlazados con salidas nuestras (74.266 $ y 91.884 $, vía «cambio»). Son 166.150 $, el 5,2 %.
  - Aun así el modelo le da pureza 0,9992. Las entradas de contratos «neutros» no la diluyen, así que ese 5,2 % enlazado tiñe todo lo demás.
  - Sus 27 aristas terminales suman 3.195.093 $. Eso es el 41,0 % de UsdtOFT (7.799.694 $) y el 20,5 % de «puente» (15.604.593 $).
  - La parte sin enlazar son 3.029.077 $, el 107 % del exceso. Sin ella la suma es 50.569.092 $, un −0,40 %.
- **Corrección:**
  - Reescribir la frase: «3,03 M$ proceden de una sola billetera que reenvía pagos de la bóveda de Chainflip no enlazados con nuestras salidas».
  - Arreglar el modelo para que la entrada neutra sin enlazar diluya, o para que el taint saliente no pueda superar al entrante más el saldo.
  - Recalcular v03. Estimación: UsdtOFT pasaría de 7,80 a unos 4,77 M$, «puente» de 15,6 a unos 12,6 M$ y los destinos de 43,9 a unos 40,9 M$.
- **Reservas:** otras billeteras con sobreatribución bruta alta (`TRshfHZw…`, `TNWyDsFm…`, `TEz8jzee…`) no las he confirmado como artefactos, porque esa métrica incluye viajes de ida y vuelta por intercambios que se compensan. Tampoco sé si `TB7p…` es del ladrón (ver sección 3).

**2. [A · dato / redacción · MEDIA]**
- **Cita:** «contaba como «anterior a la foto» unos 137 M$ de movimientos posteriores, que ya están en el tramo 5». La nota de `tramo6-v03/t4.json` dice lo mismo.
- **Lo que encuentro:** las 4.633 aristas posteriores de v02 suman 136.833.128 $. Cruzadas por `tx` con las 6.057 del tramo 5:
  - 4.330 aristas (118.648.544 $, el 86,7 %) están en los dos tramos.
  - 303 aristas (18.184.585 $) no están en el tramo 5.
  - De esas 303, 89 aristas (14.091.178 $) son de `TB7p…`. Esa billetera no está en las alcanzadas del tramo 5.
  - Las otras 214 aristas (4.093.407 $ con la pureza de v02) no tienen explicación. No las recalculé con la pureza de v03.
- **Corrección:** decir «unos 119 M$ duplicados con el tramo 5, unos 14 M$ del artefacto de `TB7p…` y unos 4 M$ sin explicar».

**3. [A · lógica · MEDIA]**
- **Cita:** «Con el corte en la foto el tramo 6 reparte 53,6 M$…» y la nota «solo cuenta lo ocurrido hasta esa hora».
- **Lo que encuentro:** el corte quita bien el duplicado. Las 2.393 aristas de v03 tienen 0 `tx` en común con el tramo 5, y la caché del tramo 5 no tiene ningún evento ≤ foto (el más antiguo es de las 22:41:09). Pero lo que seguía en tránsito en la foto queda sin destino en ambos tramos:
  - retenido 3.435.756 $ en 1.250 billeteras;
  - sin resolver 4.696.385 $;
  - polvo 1.559.726 $.
- **Una cota superior para el retenido:** sumando, por billetera, min(neto, salidas posteriores a la foto) × pureza, hasta 3.219.385 $ (el 94 %) ya salieron de esas billeteras antes del 2-nov. Fue un cálculo sobre `tramo6-cache.json` sin cortar.
- **Ejemplo:** hay 8 envíos (221.671 $ brutos) entre las 22:40:00 y las 22:41:09 que no están en ninguna de las dos cachés.
- **Efecto fuera de A/B:** `informe-trazabilidad.cjs:93` describe el retenido de ambas fases como «Unidades que quedaron en cada billetera (entró − salió)… valoradas al precio de hoy» y cita `tramo5-cache.json`. Para el tramo 6 ese dato es «a la foto».
- **Corrección:** etiquetar el retenido del tramo 6 como «a la foto, no hoy». Añadir una fase que siga hacia adelante, con libro por tiempo, las 1.250 billeteras con saldo en la foto.

**4. [B · dato · MEDIA]**
- **Cita:** `reembolsosEnteros: RV.reembolsosEnteros !== undefined && P.some(x => x.reembolsoEntero !== undefined) ? reemb : RV.reembolsosEnteros` (`filtrar-corte-tramo6.cjs`, línea 33).
- **Lo que encuentro:**
  - Los elementos no tienen el campo `reembolsoEntero`, así que la condición es siempre falsa. v03 conserva `reembolsosEnteros: 1` y `reembolsosEnterosUsdt: 84596,78`.
  - Ese reembolso es el swap 1990221, con depósito el 31-oct 02:26Z y reembolso a las 02:38Z. Es posterior a la foto y v03 lo quitó (es el único candidato de v02).
  - El tramo 5 ya lo cuenta: sus 4 reembolsos suman 216.022,21 $ e incluyen el 1990221 (84.597 $).
  - `informe-trazabilidad.cjs:62` suma ambos ficheros. Saldrían 5 reembolsos y 300.619 $ en vez de 4 y 216.022 $.
- **Corrección:** poner 0 y 0 en v03. Recalcular los agregados desde `chainflip-llegadas.json` filtrado, no desde un campo inexistente.

**5. [B · redacción / dato · MEDIA]**
- **Cita:** «se conservan solo los cruces cuyo envío en TRON ocurrió hasta la foto». El comentario del guion dice «llegadas por hora del depósito en TRON». La novedad dice «130 de Chainflip».
- **Lo que encuentro:**
  - Los conteos son correctos (702 → 572), pero de las 572 solo 42 son cruces de nuestro dinero, las marcadas `nuestro`. Suman 3.414.247 $ y todas son desde el 30-oct 02:19.
  - Las otras 530 son swaps de terceros en los mismos canales, de antes del 30-oct (desde el 17-jun-2026).
  - Las 130 quitadas son 88 `nuestro` y 42 ajenas.
  - La hora usada es `deposito.hora` de Chainflip, no la de TRON. En las 130 comprobables va 63–75 s por detrás, con una mediana de 66 s. No cambia nada aquí: el último depósito conservado es de las 22:37 y el primero quitado, de las 22:53.
  - 299 de esos swaps están también en el fichero de `tramo5-v02` (8.120.357 $ en equivalente USDT).
- **Corrección:** informar «Chainflip: 130 → 42 cambios nuestros» y llamar «contexto del canal» al resto. Documentar que el corte usa la hora de Chainflip. Comprobar que el informe no suma esos 299 dos veces; no pude comprobarlo (ver sección 3).

**6. [A/B · lógica (herramientas) · MEDIA]**
- **Cita:** `const OUT = process.env.TRAMO_DIR || '…/tramo6/'` (`analisis-tramo6.cjs`) y `T6 = process.env.INFORME_T6 || (A + 'tramo6')` (`informe-trazabilidad.cjs:7`).
- **Lo que encuentro:** `tramo6/` sigue sin corregir. Su `t4.json` tiene t3 = 2-nov 09:23 y su `tramo6-resultado.json` suma 180.075.719 $ de destinos y 5.194.848 $ de retenido. Ejecutar cualquiera de los dos guiones sin la variable de entorno reproduce el fallo.
- **Corrección:** poner v03 por defecto o corregir `tramo6/`.

**7. [A · redacción · BAJA]**
- **Cita:** `// TRAMO 4 (auditoría 2-nov): … después de la foto` y `// foto común: 23:40 hora de Madrid del 30-oct; ninguna lectura empezó antes`. Están en `analisis-tramo6.cjs`.
- **Lo que encuentro:** el segundo comentario también está en `analisis-tramo5.cjs`, donde t3 es la hora de lectura (2-nov 09:23). Ese comentario falso pudo ocultar el fallo original.
- **Corrección:** reescribir ambos comentarios.

**8. [B · redacción · BAJA]**
- **Cita:** «se regenera con su script a partir de los ficheros ya filtrados» (`CORTE-FOTO.json`).
- **Lo que encuentro:** `llegadas-eth.json` y `eth-adelante-v2.json` sí están en v03. `metarouter-destino-resumen.json` y `symbiosis-llegadas-resumen.json` no, y ningún guion los lee según mi búsqueda. No tiene efecto.
- **Corrección:** ajustar la nota.

**9. [A · dato · BAJA]**
- **Cita:** `polvo 1,559,726` (`analisis-log.txt`).
- **Lo que encuentro:** 369.590 $ de ese polvo van a billeteras que el modelo también sigue, así que se cuentan como salida y además se propagan. Explica unos 0,7 puntos del 5,6 %. Quitándolo, la suma queda en 53.228.580 $ (+4,84 %).
- **Corrección:** excluir de «polvo» lo que va a billeteras trazadas.

## 2) COMPROBADO CORRECTO

**A**
- **T3:** v02 = 1793611380033 (2026-11-02T09:23:00.033Z). v03 = 1793400000000 (2026-10-30T22:40:00.000Z), igual a `Date.UTC(2026,9,30,22,40)`. El guion filtra `ent`, `sal` y `via` con `e.at <= TSTAR`, y TSTAR sale de `t4.json`.
- **Caché del tramo 6:** 71.375 eventos, de los que 57.911 (81,1 %) son posteriores a la foto. TRBdWq tiene 379 envíos, todos ≤ foto (de las 02:19 a las 22:36), por 50.773.217 $.
- **Aristas del tramo 5 (v02):** 6.057, todas posteriores a la foto (de las 22:42:51 del 30-oct a las 09:18:06 del 2-nov), 160.724.446 $.
- **Aristas del tramo 6 (v02):** 7.026 en total (180.075.719 $). 2.393 son ≤ foto (43.242.591 $) y 4.633 son > foto (136.833.128 $).
- **Aristas del tramo 6 (v03):** 2.393, todas ≤ foto, 43.906.303 $. Son las mismas (`tx|de|a`) que las anteriores de v02; difiere la pureza.
- **Conciliación de v03:** destinos 43.906.303 + retenido 3.435.756 + polvo 1.559.726 + sin resolver 4.696.385 = 53.598.169 $, un +5,564 %.
- **Reproducción en memoria:**
  - La pureza guardada es punto fijo sobre los datos ≤ foto (residuo 7,6e-7).
  - El retenido recalculado coincide: 3.435.756 $.
  - El polvo recalculado coincide: 1.559.726 $.
  - El sin resolver recalculado coincide: 4.696.385 $ en 390 envíos.
  - La diferencia de netos con el fichero es 0.
- **Cifra de v02:** la suma de categorías es 194,85 M$, que coincide con los «194,9» de las novedades.
- **Convergencia:** v03 necesitó 75 vueltas, más que el tope antiguo de 60, así que el parche era necesario. El tramo 5 sigue con tope 60 pero converge (residuo 3,1e-7).

**B**
- **Conteos:**
  - Symbiosis 376 → 316 (`metarouter-resumen`, `-destino` y `-decodificado` con las mismas 316 claves).
  - Chainflip llegadas 702 → 572; destinos 702 → 572 cambios, con el mismo conjunto de `nativeId`.
  - Across 55 → 40.
  - Relevos 215 (134+81) → 109 (74+35).
  - Llegadas-verificadas 486 → 342.
- **Horas:** en v03 no hay ningún cruce conservado con hora > foto, y ninguno de los quitados tiene hora ≤ foto, en ninguno de los ficheros. Para Symbiosis lo comprobé por tres horas distintas. En Across, las 55 horas coinciden con la caché. En Chainflip, las 130 `nuestro` concuerdan con la hora de TRON.
- **Coincidencias exactas:**
  - Los 316 Symbiosis son los 316 envíos al `MetaRouterGateway` ≤ foto de la caché.
  - Los 40 Across son exactamente las 40 aristas Across de v03.
- **Relevos:** `total` = Σpagado + Σcomisión, exacto en v02 (11.330.984,56) y en v03 (5.755.544,58). El bruto también cuadra (18.024.135,57 y 8.066.879,33).
- **`estadisticas`:** su ausencia en v03 es inocua; el informe las recalcula en la línea 66.
- **Regla de llegadas-verificadas:**
  - Las 486 claves son llegada de algún cruce: 342 de cruces conservados y 144 solo de quitados, sin huérfanas.
  - Ningún hash comparte cruces conservados y quitados.
  - No se pierde nada por el prefijo `0x`.
  - Las 29 entradas con error son las mismas antes y después.
  - No deja nada indebido. Nota de cobertura: no hay verificación para las 40 llegadas de Across, 15 de Symbiosis y 527 de Chainflip conservadas, y eso ya era así antes del filtro.

## 3) NO VERIFICABLE POR MÍ

- **Pureza 1 de TRBdWq:** la caché no trae entradas de TRBdWq (`ent` = 0), así que no puedo comprobar que los 50.773.217 $ sean todo robado.
- **Quién es `TB7p…`:** sin internet no puedo ver el origen de los pagos de la bóveda. Mi tesis es que los enlaces no respaldan esa atribución, no que el dinero sea ajeno.
- **Qué carpeta usó la última ejecución del informe:** solo vi los valores por defecto y el texto de las novedades.
- **Cómo se calculan `ajenos` y `cambiosEnExplorador` en el informe:** no leí las líneas 41–47, así que no sé si los 299 swaps comunes se duplican.
- **Destino real del retenido tras la foto:** los 3,22 M$ son una cota por salida directa, sin libro por tiempo. Los 221.671 $ de los 69 segundos son brutos, sin ponderar por pureza.
- **Lado Ethereum del tramo 6:** si el seguimiento llega hasta el 3-nov mezcla definiciones de fase con TRON. Está fuera de A y B y no lo miré.
- **Hora real de la lectura:** solo vi que la última arista es de las 09:18:06, antes de las 09:23:00. No miré el máximo de todos los eventos de la caché ni los registros de ejecución.
- **Que `TEcDijvK…` sea la bóveda de Chainflip:** depende de `contratos-clasificados.json`; la clase base dice «Vault» (swap).
- **Datos externos:** transacciones reales, saldos y el precio fijo de TRX (0,352) quedan sin comprobar.
