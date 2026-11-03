@echo off
rem Un ciclo a mano del vigilante de salidas de TRX (lo normal es que lo lance la tarea de Windows cada 10 minutos).
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0Ejecutar-Vigilante.ps1"
