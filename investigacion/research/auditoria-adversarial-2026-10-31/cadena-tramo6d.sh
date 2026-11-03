#!/usr/bin/env bash
# Regenera, con el corte de la foto ya aplicado, los dos ficheros de Ethereum del tramo 6 (tramo6-v03): llegadas a Ethereum y seguimiento hacia adelante.
N="/c/Users/Equipo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe"; B=/c/EquipoIA/blockchain-investigator/scripts; R=C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo6-v03
cd /c/EquipoIA/research/auditoria-adversarial-2026-10-31 || exit 1
paso() { echo "[$(date -u +%H:%M:%S)] $*"; }
paso "v03: llegadas a Ethereum"; "$N" $B/seguir-llegadas-ethereum.cjs $R > tramo6-v03/log-eth-llegadas.txt 2>&1 || paso "AVISO seguir-llegadas"
paso "v03: Ethereum hacia adelante"; "$N" $B/rastrear-eth-adelante.cjs $R > tramo6-v03/eth-adelante-log.txt 2>&1 || paso "AVISO eth-adelante"
paso "FIN cadena v03 Ethereum"
