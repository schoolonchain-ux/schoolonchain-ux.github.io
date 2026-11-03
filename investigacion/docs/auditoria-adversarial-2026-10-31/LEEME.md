# Auditoría adversarial — qué hay aquí

Versión del 2026-10-31. Original intacto en `docs/articulos/ORIGINAL-INTACTO/` (checksums en `SHA256SUMS.txt`). Todo lo de aquí sale de los scripts de `research/auditoria-adversarial-2026-10-31/`.

| Entregable | Archivo |
|---|---|
| Informe original intacto | `docs/articulos/ORIGINAL-INTACTO/` |
| Informe revisado (HTML) | `docs/articulos/ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.html` |
| Informe de la auditoría | `AUDITORIA-ADVERSARIAL-ROBO-BINANCE-2026-10-31.md` |
| Tabla de diferencias | `TABLA-DIFERENCIAS-2026-10-31.md` |
| Comparativa de modelos | `COMPARATIVA-MODELOS-ATRIBUCION-2026-10-31.md` |
| Catálogo revisado | `docs/articulos/CATALOGO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.xlsx` (hojas «AUD …» nuevas; las anteriores sin tocar) |
| Preguntas sin resolver | `PREGUNTAS-ABIERTAS-2026-10-31.md` |
| Scripts reproducibles | `research/auditoria-adversarial-2026-10-31/` (cada script escribe su JSON en `resultados/`) |

## Cómo repetirlo

Desde `research/auditoria-adversarial-2026-10-31/` con Node (el de `C:\Users\Equipo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin`): `atribucion.cjs`, `retenido-verificacion.cjs`, `prueba-preventana.cjs`, `rellenar-hueco.cjs`, `custodia-tg5.cjs`, `puentes-usdt0.cjs`, `thorchain-recibido.cjs`, `nodos.cjs`, `nodos-ventana.cjs`, `nodos-serie-diaria.cjs`, `exchanges-auditoria.cjs`, `remitentes-casas.cjs`, `universalrouter-cuenta.cjs`, `prestamo-auditoria.cjs`, y por último `armar-entregables.cjs`. Los scripts de red (TronScan/TronGrid/Etherscan/LayerZero) dan resultados que pueden variar con el tiempo; los de la caché del informe son deterministas. Corrección del 1-nov (Codex R1-10): `atribucion.cjs` ya regenera `resultados/preventana-tramo1.json` (112 billeteras). Scripts añadidos el 1-nov: `reproducir-tramo2.cjs` (repite sin red el guion original del 2.º tramo), `traza-tramo3.cjs` y `analisis-tramo3.cjs` (rastreo a fondo del reparto posterior a la foto, datos en `tramo3/`), `diag-lectura.cjs` (diagnóstico de lecturas fallidas) y `precio-trx-y-ventas.cjs` (precio de TRX frente a lo enviado a intercambios). Reanudar `traza-tramo3.cjs` ya reintenta también las billeteras alcanzadas a través de cambios (antes no).
