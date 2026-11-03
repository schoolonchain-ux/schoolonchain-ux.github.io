#!/usr/bin/env bash
# Cierra el circuito de Chainflip para un tramo hasta que no aparezcan canales ni relevos nuevos:
#   investigar/clasificar contratos → recolectores → canales y cambios de Chainflip → relevos y reembolsos → rastreo de las billeteras nuevas → análisis
# Uso: bash iterar-chainflip.sh tramo5   (no ejecutar mientras otro rastreador escribe la misma caché)
N="/c/Users/Equipo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe"
cd /c/EquipoIA/research/auditoria-adversarial-2026-10-31 || exit 1
T=${1:-tramo5}; B=/c/EquipoIA/blockchain-investigator/scripts; R="C:/EquipoIA/research/auditoria-adversarial-2026-10-31/$T"
for ronda in 1 2 3 4 5 6; do
  echo "=== ronda $ronda ($T) $(date +%H:%M:%S)"
  "$N" investigar-contratos-sin-resolver.cjs $T > /dev/null 2>&1; "$N" clasificar-contratos-sin-resolver.cjs | head -1
  "$N" completar-recolectores-$T.cjs | tail -1
  "$N" $B/chainflip-destinos.cjs $R | grep "canales leídos"
  "$N" $B/chainflip-llegadas.cjs $R | tail -1
  "$N" completar-relevos-chainflip.cjs $T | tail -1
  NUEVAS=$("$N" -e "const r=JSON.parse(require('fs').readFileSync('$T/relevos-informe.json','utf8'));console.log(r.parejasLista.filter(p=>p.nueva).length)")
  echo "parejas nuevas: $NUEVAS"
  if [ "$NUEVAS" = "0" ]; then echo "estable"; break; fi
  "$N" traza-$T.cjs > $T/log-iter$ronda.txt 2>&1; tail -1 $T/log-iter$ronda.txt | cut -c1-120
done
"$N" analisis-$T.cjs > $T/analisis-log-final.txt 2>&1; echo "análisis hecho"
