# Revisión independiente (ronda 2): intenta REFUTAR las correcciones y lo que queda

Sigues siendo un revisor forense hostil. **No apruebes: busca errores.** En la ronda 1 (tu respuesta está en `research/auditoria-adversarial-2026-10-31/codex/ronda-1-respuesta.md`) formulaste 19 objeciones (R1-01…R1-19). Las comprobé una a una contra los datos; he aceptado las 19 (ninguna rechazada) y he corregido `objeciones.cjs`, `armar-entregables.cjs` y, regenerados, la auditoría en `docs/auditoria-adversarial-2026-10-31/`, el HTML `docs/articulos/ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.html` y el Excel revisado. Se añadió una objeción nueva mía, O-20, derivada de tu R1-02.

Modo solo lectura, igual que antes (puedes calcular en memoria con `node -e`, Node en `C:\Users\Equipo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`; no escribas en disco ni uses la red).

## Qué hice con cada objeción tuya (qué verifiqué yo y qué no)

- Verificado por mí contra los datos: R1-01 (JustLend duplicado, hash `0af27aba…`), R1-02 (99 aristas repetidas: 87 nodos, 8 puentes, 3 USDD, 1 préstamo), R1-09 (2 de las 22 aristas del hueco ya estaban en `traza-cache.json.sal`), R1-15 (OKX 8.000 USDT, pureza 0,806), R1-19 (420 direcciones únicas), R1-11/R1-17/R1-18 (leí el código: fórmula `informe/pureza`, `usd` = valor del activo de entrada con ETH a 2.253 $, falta de filtro `l.address`), R1-06 (el umbral del simulador es 3.520, `SEGUIR`). Para R1-18 repetí `puentes-usdt0.cjs` registrando el contrato emisor de cada evento: 165 eventos del USDT de Ethereum (`0xdac17f95…`) y 18 del contrato `0xfd086bc7…` en Arbitrum (resultado en `resultados/puentes-usdt0-log.txt`).
- Aceptado SIN reejecutar yo, por tu cálculo: R1-03 (reproducción exacta del segundo tramo con el guion original), R1-04 (2,293 M$ con prioridad mixta), R1-05 (rerun con `--hip=limpio`: nodos 24,807–25,492 M$, préstamos 4,790–4,812 M$), R1-08 (el residuo por modelo ≈ 0,5 M$ con su propio retenido; 5,166–7,217 mezclando), R1-14 (rangos de las muestras), R1-16 (9.825.409 USDT + 7.599.052 TRX; 2,19 %).
- Aceptado como corrección de redacción/alcance: R1-07, R1-10 (documentado en LEEME, NO corregido el script), R1-12, R1-13.

## Qué quiero de ti ahora

1. **Reejecuta tú los cálculos que acepté sin repetir** (R1-03, R1-04, R1-05, R1-08, R1-14, R1-16) y dime si coinciden con lo que ahora escribo en la auditoría/revisado, o si me equivoqué al trasladarlos. Da los números exactos.
2. **Busca errores introducidos por mis correcciones:** cifras mal trasladadas, frases del HTML revisado o de la auditoría que contradicen otra (por ejemplo restos de «cota inferior», «423 billeteras», «118 aristas», «4,81 M$», «5,2–5,7», «19 objeciones», «validado» sobre el retenido, «máximo teórico», «robusto»). Haz una búsqueda de texto exhaustiva en `docs/auditoria-adversarial-2026-10-31/*.md` y en el HTML revisado (sin las partes SVG/tablas del original).
3. **Las clases VERIFICADO/ESTIMADO/HIPÓTESIS/DESCONOCIDO** de las objeciones O-01…O-20 (`research/auditoria-adversarial-2026-10-31/objeciones.cjs`): ¿alguna sigue sobreclasificada?
4. **Áreas que no cubriste en la ronda 1:** (a) investigación de nodos de servicio (`resultados/nodos*.json`, `notas/nodos-hallazgos.md`): ¿la serie diaria «transferencias/día ≈» (ritmo estimado con las 50 últimas del día, `nodos-serie-diaria.cjs`) es un estimador legítimo? ¿los fondeadores y fechas de creación coinciden con lo guardado? (b) remitentes a las casas (`exchanges-auditoria.cjs` y mi script ad hoc que no está guardado: TStvMPH7wv…, TXYiPCELFd…, TFL9UDVKRt…): ¿qué afirmo sin base? (c) el apartado de THORChain y el contrato `TQqgNg13…`. (d) las figuras (`research/binance-0x5227-2026-10-30/grafos/g*.cjs`): ¿alguna cifra escrita a mano contradice los CSV/JSON de datos o mi auditoría?
5. **Conclusiones del informe revisado que sigan sin respaldo** aunque la auditoría no las toque.

## Formato

`R2-nn · gravedad · qué afirma (cita corta + archivo) · por qué está mal/sin respaldo · cómo lo comprobaste · qué corregirías`. Al final: lista de «comprobé y cuadra» y lista de «no pude comprobar». No inventes datos.
