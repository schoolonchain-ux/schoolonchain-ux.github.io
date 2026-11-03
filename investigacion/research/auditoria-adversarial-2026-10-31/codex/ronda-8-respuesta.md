**R8-01 · alta · «Polvo: 5,60 M$» contiene dinero que también continúa por el grafo.**

**Qué afirma:** la tabla suma «Polvo» a los demás destinos para obtener 188,10 M$. [Documento, §4](C:/EquipoIA/docs/auditoria-adversarial-2026-10-31/SEGUIMIENTO-2026-11-02.md:32).

**Por qué está mal:** el [análisis](C:/EquipoIA/research/auditoria-adversarial-2026-10-31/analisis-tramo4.cjs:37) añade cualquier salida inferior a 3.520 $ a `polvo`, incluso cuando su destinatario ya está rastreado. Esa misma transferencia puede figurar en `ent` del receptor y alimentar su pureza, sus siguientes envíos y su retenido. Las categorías no son excluyentes.

**Cómo lo comprobé:** crucé `sal` y `ent` por remitente, destinatario, transacción, token e importe. Encontré **687 coincidencias exactas por 1.185.245,87 $ ponderados**. En total, **1.927.679,32 $** del polvo van a direcciones presentes en `rec`; no pude emparejar íntegramente esa cantidad.

Ejemplo concreto: `TRxrqTAE8xf57FhivFBe5eZXFzxs4pXegf`, con pureza 1, recibe dos transferencias consideradas polvo por **2.450,64 y 2.419,93 $**. Ambas aparecen en sus entradas. Después convierte fondos y envía **19.326,45 USDT** a `TXJgMdj…`, también contabilizados como llegada a nodo.

**Qué corregiría:** considerar continuaciones las transferencias pequeñas efectivamente incorporadas al receptor rastreado. Reservar «polvo» para ramas cuyo seguimiento se abandona y conciliar esas ramas sin volver a incorporarlas aguas abajo.

---

**R8-02 · alta · 13,29 M$ atribuidos al recolector proceden de una extrapolación entre tokens.**

**Qué afirma:** «cada depósito se anotó como un salto» a `TYVWGh8X…`, presentado después como «mayor receptor observado (49,57 M$)». [§3.2](C:/EquipoIA/docs/auditoria-adversarial-2026-10-31/SEGUIMIENTO-2026-11-02.md:20), [§5](C:/EquipoIA/docs/auditoria-adversarial-2026-10-31/SEGUIMIENTO-2026-11-02.md:61).

**Por qué está mal:** la evidencia citada describe **salidas de USDT**. El [script](C:/EquipoIA/research/auditoria-adversarial-2026-10-31/completar-recolectores.cjs:10) transforma también depósitos de **TRX** en llegadas al nodo, conservando token, cantidad, valoración y fecha del depósito. No comprueba conversión, importe recibido, barrido posterior ni existencia de saldo pendiente al corte.

**Cómo lo comprobé:** desglosé los 683 saltos `recolector`:

| Depósitos | Número | Bruto | Ponderado |
|---|---:|---:|---:|
| USDT | 350 | 37.627.123,05 $ | 36.277.028,33 $ |
| TRX | 333 | 14.244.221,28 $ | **13.294.859,23 $** |

Los depósitos están dentro de la ventana observada; no encontré una extrapolación temporal efectiva en esos 683 registros. Sí encontré la extrapolación entre tokens.

**Qué corregiría:** separar «depósitos atribuidos bajo hipótesis de barrido» de «recepciones verificadas». Para los TRX, exigir las conversiones y salidas reales. La concentración del USDT saliente hace plausible la hipótesis; **no demuestra esas recepciones ni sus importes**. La advertencia actual identifica incertidumbre sobre el servicio, pero no explica suficientemente esta incertidumbre monetaria.

---

**R8-03 · alta · la pureza puede atribuir fondos sin financiación registrada; el −1,1 % oculta compensaciones importantes.**

**Qué afirma:** presenta un reparto del dinero de entrada y atribuye la diferencia a «pureza estática por billetera». [Documento, §4](C:/EquipoIA/docs/auditoria-adversarial-2026-10-31/SEGUIMIENTO-2026-11-02.md:38).

**Por qué está mal:** además de la mezcla estática, hay saldos iniciales omitidos e ingresos de contratos que heredan pureza sin procedencia enlazada. La regla de [neutralidad](C:/EquipoIA/research/auditoria-adversarial-2026-10-31/analisis-tramo4.cjs:29) y el cálculo de [retenido](C:/EquipoIA/research/auditoria-adversarial-2026-10-31/analisis-tramo4.cjs:46) no conservan un principal marcado por billetera.

**Cómo lo comprobé:**

- `TXTE9fqkXzkNkZ199XunzZqjT2T1kwyXFu` tiene **42.155,57 $ de entradas**, **645.876,07 $ de salidas**, ninguna `via` y pureza **1**. Se atribuyen **603.720,50 $ adicionales** sin financiación registrada. Su saldo negativo se elimina del retenido mediante `neto > 0`.
- `TUUcxUt…` recibe dos entradas de `UniversalRouter` por **406.890,53 $**, sin una financiación enlazada en `sal`/`via`. Conserva pureza **1**. No puedo demostrar que sean fondos ajenos; sí que el grafo no demuestra su procedencia.
- Encontré **640 entradas neutralizadas por 6.501.170,23 $ ponderados** sin ese enlace por transacción.
- Construí una conciliación local: destinos, polvo, contratos sin resolver, retenido y continuaciones, menos entradas procedentes del grafo. Los desajustes positivos suman **9.601.351,44 $** y los negativos **−11.698.819,20 $**. Se compensan hasta producir el desfase publicado.

**Qué corregiría:** incorporar saldo inicial y procedencia, mantener principal marcado disponible y enlazar las devoluciones de contratos con su financiación. Los fondos sin procedencia demostrada deben quedar como desconocidos. **El −1,1 % no mide ni limita el error de atribución.**

---

**R8-04 · media · la comparación «101,6 → 188,1 M$» mezcla dos sumas distintas.**

**Qué afirma:** «Antes de cerrar los dos huecos […] la suma era de 101,6 M$ (faltaban 88,6 M$)». [Documento, §4](C:/EquipoIA/docs/auditoria-adversarial-2026-10-31/SEGUIMIENTO-2026-11-02.md:38).

**Por qué está mal:** el resultado anterior no incluye `sinResolver`; la suma nueva incorpora **31,42 M$ sin salida resuelta**. Parte de la mejora consiste en añadir una categoría contable, no en recuperar un recorrido.

**Cómo lo comprobé:** sumé los resultados guardados:

- Antes: **101.581.401,46 $**, sin `sinResolver`.
- Después, excluyendo también `sinResolver`: **156.683.624,74 $**.
- Incremento comparable: **55.102.223,28 $**.
- Los restantes **31.418.785,01 $** del aumento publicado son la categoría nueva.

**Qué corregiría:** mostrar ambas comparaciones con las mismas categorías. No presentar los 86,52 M$ de aumento de la suma como efecto conjunto de resolver las dos rutas.

**«comprobé y cuadra»**

Recalculé en memoria desde `rec`, incluyendo el punto fijo de purezas, sin ejecutar los scripts del proyecto. Con mayor precisión de convergencia obtuve:

| Categoría | Millones de dólares |
|---|---:|
| Nodos | 113,424672 |
| USDD | 23,642777 |
| Préstamos | 6,704252 |
| Puentes | 0,266399 |
| Casas | 0,007034 |
| Retenido | 7,033909 |
| Polvo | 5,604584 |
| Sin resolver | 31,418786 |
| **Suma** | **188,102413** |

La diferencia respecto al resultado guardado es inferior a **3 $**. **Reproducir la aritmética no valida su contabilidad.**

También cuadra:

- 7.572 registros, incluida la semilla; 7.571 excluyéndola. Cero `ok:false`, cero parciales y cero llegadas conocidas ≥3.520 $ anteriores a `desde−120 s`.
- Ningún duplicado exacto `sal`/`via`, ni entre saltos `via`. Todas las retiradas anotadas encuentran una recepción real compatible.
- Retiradas: **54.708.518,50 $**. Las 138 llamadas candidatas producen 124 saltos; no son 138 pagos.
- La exclusión global `RET_CONTRATOS` es demasiado amplia como regla, pero aquí los depósitos excluidos y retiradas difieren aproximadamente **1.905 $**: no encontré ahí una objeción material.
- El documento declara expresamente que los nodos son paradas. El umbral general `HUB=5000` explica la parada en `TYVWGh8X…`; no encontré una excepción hecha para esa dirección.

**«no pude comprobar»**

- **Ninguna muestra en cadena.** Intenté TronGrid y TronScan, incluido el depósito `7f799c3c177c40abd0e474872da5bf1667829cf2f29e0bbbeb6afa8b98723a25`. Las API resultaron inaccesibles; la web de TronScan devolvió 403.
- Las cifras manuales del §5 —61,6 M$, 2.909 destinatarios y la secuencia 43,27 → 43,27 → 47,97 M$— están incrustadas en el generador, sin evidencia reproducible guardada. La cautela sobre titularidad es adecuada; **«reenvió íntegros» queda sin demostrar**.
- La procedencia íntegramente ilícita del saldo previo y de ambos depósitos a `TRBdWq…`. El archivo de estado confirma dos entradas grandes durante su ventana y no encontré retornos a la semilla en el grafo; eso no verifica su pureza histórica.
- La integridad real de la paginación de retiradas, llamadas efectuadas por terceros y pagos descartados por `from_address !== contrato`. Seguir `meta.links.next` no presenta una incoherencia evidente, pero faltan páginas y respuestas originales para auditarlo.
- La ausencia real de retiradas de `TEcDijvKSX…`, los barridos individuales del recolector y las entradas de sus demás clientes.

No escribí ficheros ni revisé `tramo5/`.