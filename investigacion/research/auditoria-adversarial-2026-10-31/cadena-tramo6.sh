#!/usr/bin/env bash
# Sustituye a cadena-nocturna.sh desde el paso del tramo 6 (2-nov, 20:30): el rastreador va ahora con un lector SIN clave de TronGrid (límite propio de 1 consulta/s) además del lector con clave,
# que está sin cuota diaria; así se duplica el ritmo. Cada paso es reanudable; si uno falla se anota y sigue con el siguiente.
N="/c/Users/Equipo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe"; B=/c/EquipoIA/blockchain-investigator/scripts; R=C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo6
cd /c/EquipoIA/research/auditoria-adversarial-2026-10-31 || exit 1
paso() { echo "[$(date -u +%H:%M:%S)] $*"; }
paso "tramo6: rastreo"; "$N" traza-tramo6.cjs > tramo6/log10.txt 2>&1 || paso "AVISO traza-tramo6"
paso "tramo6: retiradas"; "$N" completar-retiradas-tramo6.cjs > tramo6/retiradas-log.txt 2>&1 || paso "AVISO retiradas6"
paso "tramo6: recolector"; "$N" completar-recolectores-tramo6.cjs > tramo6/recolectores-log.txt 2>&1 || paso "AVISO recolectores6"
paso "tramo6: justificantes jUSDT (diagnóstico)"; "$N" auxiliares/_jtokens.cjs tramo6 > tramo6/jtokens-log.txt 2>&1 || paso "AVISO jtokens6 diag"
paso "tramo6: justificantes jUSDT (anotar)"; "$N" completar-jtokens-tramo6.cjs > tramo6/jtokens-anotar-log.txt 2>&1 || paso "AVISO jtokens6 anotar"
paso "tramo6: reanudar rastreo"; "$N" traza-tramo6.cjs > tramo6/log11.txt 2>&1 || paso "AVISO traza-tramo6 b"
paso "tramo6: cruces Symbiosis"; "$N" $B/decodificar-metarouter.cjs $R > tramo6/metarouter-log.txt 2>&1; "$N" $B/decodificar-metarouter-destino.cjs $R > tramo6/metarouter-destino-log.txt 2>&1; "$N" $B/symbiosis-llegadas.cjs $R > tramo6/symbiosis-llegadas-log.txt 2>&1 || paso "AVISO symbiosis6"
paso "tramo6: Chainflip (circuito completo)"; bash iterar-chainflip.sh tramo6 > tramo6/chainflip-iter-log.txt 2>&1 || paso "AVISO chainflip6"
paso "tramo6: análisis"; "$N" analisis-tramo6.cjs > tramo6/analisis-log.txt 2>&1 || paso "AVISO analisis-tramo6"
paso "FIN de la cadena del tramo 6"
