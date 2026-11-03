#!/usr/bin/env bash
# Trabajos que necesitan el historial de TronGrid, en orden, cuando la cuota diaria se renueve (el 2-nov se agotó a las 100.000 consultas).
# Cada paso es reanudable; si uno falla se anota y sigue con el siguiente.
N="/c/Users/Equipo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe"
cd /c/EquipoIA/research/auditoria-adversarial-2026-10-31 || exit 1
paso() { echo "[$(date -u +%H:%M:%S)] $*"; }
paso "esperando a TronGrid"; "$N" /c/EquipoIA/blockchain-investigator/scripts/esperar-trongrid.cjs || exit 1
paso "tramo5: seguir las receptoras de jUSDT (reanuda)"; "$N" traza-tramo5.cjs > tramo5/log6.txt 2>&1 || paso "AVISO traza-tramo5"
paso "tramo5: análisis"; "$N" analisis-tramo5.cjs > tramo5/analisis-log.txt 2>&1 || paso "AVISO analisis-tramo5"
paso "tramo6 (reparto previo a la foto): rastreo"; "$N" traza-tramo6.cjs > tramo6/log.txt 2>&1 || paso "AVISO traza-tramo6"
paso "tramo6: retiradas"; "$N" completar-retiradas-tramo6.cjs > tramo6/retiradas-log.txt 2>&1 || paso "AVISO retiradas6"
paso "tramo6: recolector (solo USDT)"; "$N" completar-recolectores-tramo6.cjs > tramo6/recolectores-log.txt 2>&1 || paso "AVISO recolectores6"
paso "tramo6: justificantes jUSDT (diagnóstico)"; "$N" auxiliares/_jtokens.cjs tramo6 > tramo6/jtokens-log.txt 2>&1 || paso "AVISO jtokens6 diag"
paso "tramo6: justificantes jUSDT (anotar)"; "$N" completar-jtokens-tramo6.cjs > tramo6/jtokens-anotar-log.txt 2>&1 || paso "AVISO jtokens6 anotar"
paso "tramo6: reanudar rastreo"; "$N" traza-tramo6.cjs > tramo6/log2.txt 2>&1 || paso "AVISO traza-tramo6 b"
paso "tramo6: análisis"; "$N" analisis-tramo6.cjs > tramo6/analisis-log.txt 2>&1 || paso "AVISO analisis-tramo6"
paso "FIN de la cadena nocturna"
