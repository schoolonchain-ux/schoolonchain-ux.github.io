#!/usr/bin/env bash
# Revisión independiente (Codex, solo lectura) de una sección del informe Polytrop vs EquipoIA. Uso: bash revisar-con-codex.sh S1-que-es-cada-fuente
# Cada ronda recibe el encargo de REFUTAR, no de aprobar. Las respuestas se guardan sin editar en research/polytrop-2026-11-03/codex/.
B="/c/Users/Equipo/AppData/Local/OpenAI/Codex/bin/22cfb1d302613eae/codex.exe"; cd /c/EquipoIA || exit 1
S="$1"; D=research/polytrop-2026-11-03; F="$D/secciones/$S.md"; [ -f "$F" ] || { echo "no existe $F"; exit 1; }
cat > "$D/codex/$S-prompt.md" <<EOF
Eres un revisor independiente y esceptico. Tu encargo es REFUTAR, no aprobar: busca errores de dato, errores de logica, afirmaciones sin evidencia y redaccion que engane.
Contexto: comparamos las direcciones y servicios que publica Polytrop (polytrop.io, caso "Binance Hack") con lo que tiene el sistema propio EquipoIA (rastreo del robo a Binance de octubre de 2026). Lee primero research/polytrop-2026-11-03/datos/polytrop-pagina-2026-11-03.md (lo que muestra la web de Polytrop) y despues la seccion a revisar: $F
Los datos de partida estan en research/polytrop-2026-11-03/datos/ (los CSV originales de Polytrop y los resultados de mis calculos) y los guiones en research/polytrop-2026-11-03/guiones/. Nuestras cachés de rastreo estan en research/auditoria-adversarial-2026-10-31/tramo{3,4,5,6}/tramoN-cache.json (claves rec y term) y otros ficheros del repositorio.
Reglas: solo lectura (no modifiques ni crees ficheros en el repositorio; puedes calcular con node o awk sobre copias en memoria). Sin acceso a internet: lo que no puedas comprobar en disco dilo como "no verificable por mi".
Para CADA afirmacion con cifras o nombres de la seccion: recomprueba contra los ficheros. Responde en espanol llano con este formato:
1) OBJECIONES: lista numerada. Cada una: tipo (dato / logica / sin evidencia / redaccion), cita exacta de la seccion, lo que encuentras tu (con fichero y comando o calculo), y la correccion propuesta.
2) COMPROBADO CORRECTO: lista breve de afirmaciones que has recalculado y coinciden (con el numero que has obtenido).
3) NO VERIFICABLE: lo que no has podido comprobar y por que.
No suavices: si algo esta mal, dilo tal cual.
EOF
"$B" exec --sandbox read-only --skip-git-repo-check -C /c/EquipoIA -o "$D/codex/$S-respuesta.md" - < "$D/codex/$S-prompt.md" > "$D/codex/$S-log.txt" 2>&1
echo "FIN $S $(date -u +%H:%M:%S)"
