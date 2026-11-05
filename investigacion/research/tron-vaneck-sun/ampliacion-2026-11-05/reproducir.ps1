# Reproduce TODOS los resultados de la fase 0 y la línea A SIN INTERNET, a partir de las respuestas en bruto guardadas en raw/.
# Uso:  powershell -File reproducir.ps1   (desde esta carpeta)
# Después compara las huellas de MANIFIESTO.json con las de MANIFIESTO-reproducido.json: tienen que coincidir salvo f0-4-medicion (mide tiempos reales y no es reproducible por naturaleza).
$ErrorActionPreference = 'Stop'
$node = 'C:\Users\Equipo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (-not (Test-Path $node)) { $node = 'node' }
Set-Location $PSScriptRoot
$env:REPRODUCIR = '1'
foreach ($s in 'a0-lista-binance.cjs','f0-1-linea-base.cjs','a1-historial-tef9zv.cjs','f0-3-verificar-pistas.cjs','a2-a4-a5-receptores-relevo-permisos.cjs','a6-origen-y-claves.cjs','a6c-verificar-y-un-salto-mas.cjs','a3-0-recompensas.cjs','a3-libro-y-origen.cjs','a7-energia.cjs','a7b-otros-delegantes.cjs','b-permisos-historia.cjs','c-tu3rmhyw.cjs','c2-contratos-de-tu3rmhyw.cjs','c3-etiquetas.cjs','c4-expediente-tu3rmhyw.cjs','c5-circulo-tu3rmhyw.cjs','c6-hermanas-y-origen.cjs','c7-tqwh1zdb.cjs','c8-entradas-de-tt2t17.cjs','l1-tllen-codigo-y-llamadas.cjs','l2-tllen-libro.cjs','l3-boveda-estado-y-usdd.cjs','l4-piezas-del-circuito.cjs','b5-tron-inc.cjs','b5b-tron-inc-wtrx.cjs','b5c-tron-inc-strx.cjs','b2-analisis-proveedora.cjs','b3-flujos-clave.cjs','b4-vecinas-de-la-proveedora.cjs','b4b-cadena-138m.cjs','b4c-hot12-y-devolucion.cjs','o1-dueno-proveedora.cjs','o2-claves-y-origen-usdt.cjs','o3-ciclo-con-binance.cjs','d1-flujos-y-huellas.cjs','d4-contraste-de-terceros.cjs','d5-conclusion-por-pareja.cjs','f1-genesis-zion.cjs','f1b-zion-tronscan.cjs','f2-nivel1-y-las-mil.cjs','f2b-lista-oficial-vs-cadena.cjs','f3-destino-de-las-mil.cjs','f3b-puntos-de-reunion.cjs','f4-segundo-nivel.cjs','f5-de-zion-a-tron-inc.cjs','f6-puente-a-tron-inc.cjs','f7-origen-en-twpmnuh9.cjs','f8-de-las-mil-al-circulo.cjs','f9-hub-poloniex-2021.cjs','g1-claves-casas-de-cambio.cjs','g2-proveedora-y-poloniex.cjs','h1-datos-para-la-web.cjs','e1-cruce-con-el-robo.cjs','d-matriz-confianza.cjs','e-registro-calidad.cjs') {
  Write-Host "== $s"; & $node --no-warnings $s | Out-Null; if ($LASTEXITCODE -ne 0) { throw "falló $s" }
}
& $node --no-warnings manifiesto.cjs (Join-Path $PSScriptRoot 'MANIFIESTO-reproducido.json')
