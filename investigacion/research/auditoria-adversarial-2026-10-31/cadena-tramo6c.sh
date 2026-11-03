#!/usr/bin/env bash
# Pasos posteriores al rastreo del tramo 6 (3-nov): lista negra, saldos de hoy, bóveda Chainflip y seguimiento hacia adelante en Ethereum. Cada paso es reanudable.
N="/c/Users/Equipo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe"; B=/c/EquipoIA/blockchain-investigator/scripts; R=C:/EquipoIA/research/auditoria-adversarial-2026-10-31
cd /c/EquipoIA/research/auditoria-adversarial-2026-10-31 || exit 1
paso() { echo "[$(date -u +%H:%M:%S)] $*"; }
paso "tramo6c: lista negra"; "$N" $B/leer-lista-negra-tron.cjs $R/tramo6 > tramo6/lista-negra-log.txt 2>&1 || paso "AVISO lista-negra"
paso "tramo6c: bóveda Chainflip"; "$N" $B/leer-saldo-boveda-chainflip.cjs $R/tramo6 > tramo6/vault-log.txt 2>&1 || paso "AVISO vault"
paso "tramo6c: saldos"; "$N" $B/leer-saldos.cjs $R/tramo6 > tramo6/saldos-log.txt 2>&1 || paso "AVISO saldos"
paso "tramo6c: Ethereum hacia adelante"; "$N" $B/rastrear-eth-adelante.cjs $R/tramo6 > tramo6/eth-adelante-log.txt 2>&1 || paso "AVISO eth-adelante"
paso "FIN de la cadena del tramo 6c"
