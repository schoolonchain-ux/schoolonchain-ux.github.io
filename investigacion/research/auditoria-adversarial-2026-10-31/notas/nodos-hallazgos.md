# Nodos de servicio — hallazgos de la auditoría (31-oct-2026)

Scripts: `nodos.cjs`, `nodos-ventana.cjs`, `nodos-serie-diaria.cjs` → `resultados/nodos*.json`. Fuente: TronScan + TronGrid, solo lectura.

## Hechos (VERIFICADO con los datos consultados)
- Las 5 carteras del 11-oct (THPaGKe6…, TGSNahJv…, TBAPnuwE…, TLKfB2go…, TH1YKH9M…) se crearon el 2026-10-11 y recibieron su primer TRX entre 23:35 y 23:36 UTC de 5 fondeadores distintos
  (TXXkfDww…, TXXCjsqR…, TQFZuXmT…, TCanhfMg…, TJ35bL49…). Esos 5 fondeadores se crearon el 2026-10-08 entre 18:50 y 18:53 UTC y cada uno recibió su primer fondeo de una dirección DISTINTA
  (TYfRt7Xn…, TV4aaBJE…, TNi9Rzrf…, TU13Q3eq…, TLfoEPJU…). Importes del primer TRX muy distintos (172 → 242.955 TRX).
- Sin claves compartidas visibles: en las 7 cuentas con permisos guardados (TGSNahJv… y TZG47zhb… no tienen datos utilizables) ninguna tiene una clave owner/active que sea de otra cuenta (todas usan su propia dirección). No hay multifirma ni delegación visible → no hay prueba on-chain de control común por permisos.
- Actividad previa al robo: estimador de intensidad (extrapola a 24 h el intervalo de las últimas 50 transferencias de cada fecha; NO es un conteo diario; no se conservaron las muestras): ≈ 40–340/día desde el 12-oct hasta el 29-oct para las 5. El 30-oct sube a ≈ 1.000–2.600/día y el 31-oct sigue alto.
  TZG47… ya movía ≈ 350–960/día antes; TM8uyBjR… ≈ 30–110/día; TQ5SdemH… ≈ 5.500–10.900/día (distribuidor: 3 entradas y 197 salidas en la muestra del 30-oct).
- Solapamiento de contrapartes entre las 5 (muestra de 200 transferencias de las últimas horas del 31-oct): 4,1 %–6,3 % (Jaccard). Latencia mediana entrada→salida: 117–231 s.
- Ventana del incidente (30-oct): 92–99 % de la entrada USDT de las 5 viene de carteras del propio recorrido. ATENCIÓN: ese porcentaje es en parte circular (el recorrido se construyó siguiendo precisamente esas aristas); no demuestra por sí solo que no tuvieran otros clientes.
  Tras el incidente (31-oct) solo el 38–51 % de su entrada viene del recorrido: el resto procede de otras carteras (clientes ajenos o ampliación posterior del recorrido que no está en la caché).

## Lo que NO queda demostrado
- Identidad u operador. No hay etiqueta pública en ninguna de las 9 cuentas.
- Que sean un «mezclador»: el patrón (alta rotación, importes ~100–1.500 USDT, reenvío en 2–4 min) encaja con mezclador, procesador de pagos, OTC o cuenta de depósito comercial. No se ha podido discriminar.

## Clasificación propuesta para el informe revisado
- Observado: proximidad temporal de creación/fondeo (84 s entre 23:35:12 y 23:36:36 el primer TRX; fondeadores creados el 8-oct en 3 min); la coordinación es un INDICIO. Actividad previa (no se prueba que las contrapartes fueran terceros independientes).
- (antes) aprovisionamiento simultáneo de las 5 (fondeadores creados en 3 min, primer TRX en 1 min) y actividad estable previa al robo. VERIFICADO.
- Relación transaccional probada: las 5 reciben y reenvían entre la red del recorrido y 128–172 contrapartes distintas. VERIFICADO.
- Control común: HIPÓTESIS (probable por el aprovisionamiento coordinado; sin claves compartidas ni primer fondeador común).
- Identidad: DESCONOCIDO.
- Consecuencia para las cifras: al tener tráfico previo y ajeno, el modelo de «pureza proporcional» sobre estos nodos mezcla fondos del robo con fondos de otros clientes; el reparto a casas de cambio atribuido por pureza es una ESTIMACIÓN, no una cantidad verificada.
