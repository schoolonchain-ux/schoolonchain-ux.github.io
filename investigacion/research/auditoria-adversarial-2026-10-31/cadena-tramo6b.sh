#!/usr/bin/env bash
# Continuación del tramo 6 (2-nov, 23:30): tras anotar los justificantes jUSDT (el tipo de cambio ya va con lector sin clave si la cuota con clave está agotada) se reanuda el rastreo
# y se repiten los cruces con las billeteras nuevas. Cada paso es reanudable.
N="/c/Users/Equipo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe"; B=/c/EquipoIA/blockchain-investigator/scripts; R=C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo6
cd /c/EquipoIA/research/auditoria-adversarial-2026-10-31 || exit 1
paso() { echo "[$(date -u +%H:%M:%S)] $*"; }
paso "tramo6b: reanudar rastreo (jUSDT)"; "$N" traza-tramo6.cjs > tramo6/log12.txt 2>&1 || paso "AVISO traza-tramo6 c"
paso "tramo6b: recolectores y retiradas nuevos"; "$N" completar-retiradas-tramo6.cjs > tramo6/retiradas-log2.txt 2>&1 || paso "AVISO retiradas6 b"; "$N" completar-recolectores-tramo6.cjs > tramo6/recolectores-log2.txt 2>&1 || paso "AVISO recolectores6 b"
paso "tramo6b: reanudar rastreo"; "$N" traza-tramo6.cjs > tramo6/log13.txt 2>&1 || paso "AVISO traza-tramo6 d"
paso "tramo6b: cruces Symbiosis"; "$N" $B/decodificar-metarouter.cjs $R > tramo6/metarouter-log.txt 2>&1; "$N" $B/decodificar-metarouter-destino.cjs $R > tramo6/metarouter-destino-log.txt 2>&1; "$N" $B/symbiosis-llegadas.cjs $R > tramo6/symbiosis-llegadas-log.txt 2>&1 || paso "AVISO symbiosis6"
paso "tramo6b: Chainflip"; bash iterar-chainflip.sh tramo6 > tramo6/chainflip-iter-log2.txt 2>&1 || paso "AVISO chainflip6"
paso "tramo6b: Across y verificación"; "$N" $B/across-llegadas.cjs $R > tramo6/across-log.txt 2>&1 || paso "AVISO across6"; "$N" $B/verificar-llegadas-evm.cjs $R > tramo6/log-verif.txt 2>&1 || paso "AVISO verif6"; "$N" $B/seguir-llegadas-ethereum.cjs $R > tramo6/log-eth-llegadas.txt 2>&1 || paso "AVISO eth-llegadas6"
paso "tramo6b: análisis"; "$N" analisis-tramo6.cjs > tramo6/analisis-log.txt 2>&1 || paso "AVISO analisis-tramo6"
paso "FIN de la cadena del tramo 6b"
