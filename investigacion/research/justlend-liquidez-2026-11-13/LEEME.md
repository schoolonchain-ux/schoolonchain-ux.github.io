# JustLend: datos originales de la investigación (13-nov-2026)

Informe: `../../docs/JUSTLEND-LIQUIDEZ-2026-11-13.md` (visor: `doc.html?f=investigacion/docs/JUSTLEND-LIQUIDEZ-2026-11-13.md`). Texto original sin cambios de nombre: `INFORME-original.md`.

- `resultados/`: lo que sale de cada paso de la investigación (JSON). El informe y la página se generan SOLO desde estos ficheros.
- `guiones/`: los programas (`NN-nombre.cjs`) que leen la cadena y calculan cada resultado; `lib.cjs` (lector) y `abi.cjs` (llamadas a contratos).
- `raw/<sesión>/`: la respuesta en bruto de cada consulta (fecha, petición y SHA-256 del texto original). **No se publican** las sesiones `09` (4.715 respuestas, 24 MB; el resultado derivado sí está en `resultados/09-cuentas.json`) ni `18` (lectura parcial del historial de ETH, superada por `19`).
- `codex/ronda-1/`: el encargo (`LEEME.md`) y la respuesta íntegra, sin editar, del revisor independiente.

Aviso sobre las huellas: hasta las ≈ 20:05 UTC del 13-nov los ficheros de `raw/` guardan la respuesta ya interpretada y la huella es la del texto HTTP original, de modo que **solo una parte se puede recalcular** (21 de 365 en una muestra). Desde la sesión `30` el fichero conserva el texto original cuando hace falta y todas las huellas se pueden verificar.
