#!/usr/bin/env bash
# Seguimiento en Ethereum de los dos tramos juntos: semillas de tramo5-v03 y tramo6-v03, resultado en tramo5-v03/eth-adelante-v2.json (lo que lee el informe). Reanudable.
N="/c/Users/Equipo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe"; R=C:/EquipoIA/research/auditoria-adversarial-2026-10-31
cd /c/EquipoIA/research/auditoria-adversarial-2026-10-31 || exit 1
"$N" /c/EquipoIA/blockchain-investigator/scripts/rastrear-eth-adelante.cjs $R/tramo5-v03 $R/tramo6-v03 > tramo5-v03/eth-adelante-log.txt 2>&1 || echo "AVISO eth-adelante" > tramo5-v03/eth-adelante-aviso.txt
echo "FIN $(date -u +%H:%M:%S)" > tramo5-v03/eth-adelante-fin.txt
