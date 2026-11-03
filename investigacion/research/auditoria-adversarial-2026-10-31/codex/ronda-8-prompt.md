# Revisión independiente (ronda 8) — intenta ROMPER el seguimiento del dinero tras la foto

Eres un revisor hostil. Tu objetivo es **refutar** lo que sigue, no confirmarlo. Si algo solo "parece razonable", dilo; si puedes demostrar que está mal, demuéstralo con un cálculo propio sobre los datos. Solo lectura, sin escribir en el repositorio. Haz los cálculos en memoria (no guardes ficheros en el repo). Si tienes red, contrasta muestras en cadena (TronScan/TronGrid públicos) y di cuáles; si no, dilo.

## Qué se afirma (documento a atacar)
`docs/auditoria-adversarial-2026-10-31/SEGUIMIENTO-2026-11-02.md`, generado por `research/auditoria-adversarial-2026-10-31/armar-seguimiento-2nov.cjs` a partir de `research/auditoria-adversarial-2026-10-31/tramo4/` (corte común 2026-11-02 00:28:23 UTC; TRX valorado a 0,352 $ fijo).

Afirmaciones principales:
1. La billetera de reparto `TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki` envió, desde la foto, 733 envíos (≥ 3.520 $) por 190.199.878 $ a 112 billeteras (`tramo4/semillas.json`, `tramo4/tramo4-resultado.json → repartoSalida`).
2. El rastreo cubre 7.572 billeteras, 0 lecturas fallidas, 0 llegadas anteriores a su ventana de lectura.
3. Reparto final (mezcla proporcional): nodos 113,42 M$, USDD 23,64, préstamos 6,70, puentes 0,27, casas 0,007, retenido 7,03, polvo 5,60, "entra en contratos y no se ve salir" 31,42; suma 188,10 M$ (−1,1 % frente a la entrada).
4. Dos huecos del método cerrados: (a) `completar-retiradas.cjs`: llamadas `withdraw/redeem` sin valor a JustLend vía `TMDENHFS…` pagan a un "receptor" distinto (54,7 M$ recuperados en 138 llamadas); (b) `completar-recolectores.cjs`: el contrato `TXtEs6t2…` (depositErc20) barre todo a `TYVWGh8XkmU49Hi9PkGAZXiiJPB3J5zJZy` (cada depósito se anota como salto hacia esa dirección, 51,87 M$ brutos).
5. Antes de cerrar esos dos huecos, la suma de destinos era 101,6 M$ y faltaban 88,6 M$.

## Dónde creo que está lo más débil (compruébalo, y busca más)
- **Contabilidad del modelo**: `analisis-tramo4.cjs` (pureza por punto fijo, neutralidad de contratos, bloque "3b" `sinResolver`, `RET_CONTRATOS`). ¿Puede la suma 188,10 M$ cuadrar *por casualidad* (errores que se compensan)? ¿Hay doble recuento entre `sal` hacia contratos (neutrales) y saltos `via`/`retirada`/`recolector`? ¿Los saltos `retirada` pueden duplicar envíos ya presentes en `sal`? ¿El criterio `viaTx.has(e.tx)` / `outs.some(o=>o.a===w)` clasifica bien "resuelto/no resuelto"?
- **Regla del recolector**: se basa en que, en una ventana de ~2 días, 58.826.752 de 58.826.875 USDT salieron del contrato a una única dirección. ¿Justifica eso asignar *cada* depósito a ese destino? ¿Qué pasa con depósitos de TRX, con depósitos fuera de esa ventana, o con el hecho de que el contrato tiene ~2.278 depositantes distintos (el 88 % del flujo es del recorrido, pero ¿la pureza de `TYVWGh8X…` queda bien calculada con las demás entradas?).
- **Retiradas**: `completar-retiradas.cjs` (lee `/v1/accounts/{w}/transactions` con `min_timestamp`/`max_timestamp`; ¿se pierden páginas? ¿`order_by` + paginación coherente? ¿se omiten llamadas hechas por otra dirección en nombre de la billetera, o retiradas cuyo receptor es un contrato o la propia billetera? ¿`tr.from_address !== x.contrato` descarta salidas legítimas?). Solo se consideraron dos contratos (`TMDENHFS…`, `TEcDijvKSX…`); el segundo no dio llamadas: ¿es creíble?
- **Origen del dinero repartido**: los 190,2 M$ vienen del saldo previo a la foto más dos depósitos del 31-oct (120 M TRX desde `TJajtPqD…` a las 14:50:51 y 158,2 M TRX desde `TKkH2vH6…` a las 18:44:36). El análisis asigna pureza 1 a `TRBdWq…`. ¿Está justificado? ¿Hay alguna entrada a `TRBdWq…` que no sea dinero del robo (o que sea circular) que invalide "pureza 1"? Revisa `research/auditoria-adversarial-2026-10-31/resultados/estado-actual-2026-11-02.json` y `tramo4/semillas.json`.
- **Nodos como puntos de parada**: el documento dice que no son destinos finales. ¿Algún párrafo los presenta como finales? ¿La clasificación "nodo" (umbral `HUB` de operaciones) hace que `TYVWGh8X…` pare el rastreo justo donde conviene?
- **Cifras del §5 (comprobación manual fuera del modelo)**: 61,6 M$ de `TYVWGh8X…` a 2.909 direcciones; 43,27 M$ a `TAYmju2Z…`, reenviados íntegros a `TB8h4xAu…`, que envió 47,97 M$ a `TLaGjwhv…`. No están en los ficheros del repo (salieron de consultas puntuales): dime si el documento las presenta con la cautela adecuada y, si tienes red, intenta reproducirlas.
- **Datos que tú puedes cruzar sin fiarte de mí**: `tramo4/tramo4-cache.json` (`rec` por billetera: `ent`, `sal`, `via`, `desde`, `ok`, `parcial`; `term`), `tramo4/traza-clases.json`, `tramo4/tramo4-swaps.json`, `tramo4/retiradas-informe.json`, `tramo4/recolectores-informe.json`, `tramo4/tramo4-aristas-terminales.json`. Recalcula tú los totales por clase y la conciliación desde `rec` sin usar mi script.
- Los scripts auxiliares `auxiliares/_diag-t4*.cjs` son mis diagnósticos (no producto final): úsalos solo como pista.

## Fuera de alcance (NO lo revises)
`tramo5/` y los ficheros `*-tramo5.cjs`: es un rastreo en curso con un corte posterior; sus ficheros cambian mientras lees. Tampoco las figuras ni el HTML revisado (aún no incorporan este trabajo).

## Entrega
Solo objeciones **materiales**. Formato: `R8-nn · gravedad · qué afirma (cita + archivo) · por qué está mal · cómo lo comprobaste · qué corregirías`. Después: «comprobé y cuadra» y «no pude comprobar». Si no encuentras nada material, escribe literalmente «sin objeciones materiales» y enumera lo que no pudiste comprobar. No suavices: prefiero una objeción dura y falsa que un silencio.
