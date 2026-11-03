param([string]$Root = 'C:\EquipoIA\tron-salidas-watch', [string]$Orden = 'ejecutar')
$ErrorActionPreference = 'Stop'
# Un ciclo del vigilante de salidas de TRX: lee TronGrid (solo lectura), anota lo nuevo en state\ y avisa al propietario por Telegram si hay movimientos.
# Lo lanza la tarea de Windows «EquipoIA - Vigilante salidas TRX» cada 10 minutos a traves de Oculto.vbs (sin ventana). A mano: Ejecutar-Vigilante.cmd.
# Un cerrojo (state\run.lock) impide dos ciclos a la vez. Si se corta, el siguiente ciclo sigue donde se quedo (el cursor solo avanza con lecturas completas).
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$node = 'C:\Users\Equipo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (!(Test-Path -LiteralPath $node)) { $node = 'node' }
$state = Join-Path $Root 'state'
New-Item -ItemType Directory -Force -Path $state | Out-Null
$log = Join-Path $state 'vigilante.log.jsonl'
$t0 = Get-Date
$out = & $node (Join-Path $Root 'src\cli.cjs') $Orden 2>&1 | Out-String
$code = $LASTEXITCODE
$rec = [ordered]@{ at = (Get-Date).ToUniversalTime().ToString('o'); orden = $Orden; segundos = [math]::Round(((Get-Date) - $t0).TotalSeconds, 1); codigo = $code; salida = ($out.Trim() -split "`n" | Select-Object -First 4) -join ' | ' }
Add-Content -LiteralPath $log -Value ($rec | ConvertTo-Json -Compress) -Encoding UTF8
exit $code
