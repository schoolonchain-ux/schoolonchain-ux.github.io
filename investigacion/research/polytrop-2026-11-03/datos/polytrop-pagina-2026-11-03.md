# Página de Polytrop leída el 2026-11-03 (copia de lo que muestra, sin editar las cifras)

Dirección: https://polytrop.io/scanner/incident/binance-hack (leída con el Chrome del propietario; la web no se deja leer por descarga directa: 403).
No he encontrado documentación del método de Polytrop; el significado de «source» y «flagged» es deducción mía a partir de la página.

- Título: «Binance Hack». Tipo: stolen coins. Redes: tron, evm, bitcoin, solana.
- «Polytrop flagged 3219 addresses across 9 hops, on average 7.2 hours before the funds moved on.»
- Total del incidente: $6.30B. «$246.1M traced · 7.55K wallets under watch».
- Enlaces: «Get the addresses CSV» (7.06K), «Get the services CSV» (8), «Obtain API keys».
- Primera fuente marcada: 30-oct 01:38, TSpe5…mtkyZ8A. Primeros fondos movidos: 30-oct 04:12, al salto 1. Primer destino alcanzado: 30-oct 04:41, Thorchain. Salto más profundo: 1-nov 02:31, salto 9. Último movimiento: 2-nov 22:19, al salto 2.
- «Traced from 3848 addresses · 23 sent funds».
- Servicios alcanzados: «$142K + $??», 6 transferencias: 0 a casas de cambio y servicios de pago, 6 a swaps DeFi y puentes, 0 a mezcladores, 0 a otros servicios. Aviso medio 8,8 min antes de que llegaran los fondos.
- Congelado: «$??» en 2 direcciones bloqueadas por el emisor del token o una autoridad.
- En direcciones contaminadas: «up to $245.9M». Aclaración de la página: la cifra real es menor porque 3 transferencias a servicios o direcciones congeladas no tienen importe registrado.
- «587 of 3,219 transfers carry 85% of the recorded money; 602 addresses on those routes.»
- Tabla «Where the funds landed» (destino, dirección abreviada, salto, USD, hora UTC, aviso previo):
  - Thorchain, TBAPn…SbYQMUM, salto 3, $3,437, 30-oct 04:41:42, 1,9 min
  - Meson, TKWqp…zfNndH4, salto 5, $??, 30-oct 05:03:09, 5,7 min
  - Thorchain, THPaG…cJAbpun, salto 2, $8,286, 30-oct 07:06:24, 8,0 min
  - Thorchain, TLKfB…rkCxCeW, salto 2, $49,557, 30-oct 08:02:42, 21 min
  - Thorchain, TH1YK…pPrMv8B, salto 2, $50,998, 30-oct 08:11:06, 7,3 min
  - enforcement_action, TNWy..Z7wh9, salto 4, $??, 30-oct 12:30:00, 41 min
  - enforcement_action, THAR..w8opL, salto 5, $??, 30-oct 19:36:24, 7,1 h
  - ACROSS, TANdm…j1XNUG1, salto 4, $30,000, 31-oct 05:30:39, desconocido
- «Case in numbers»: fuentes 3848 (tron evm bitcoin solana); direcciones marcadas 3,219 en 9 saltos; destinos con etiqueta 4 (Thorchain, Meson, enforcement_action, ACROSS); congeladas 2 de 7067; total del incidente $6,300,000,000; trazado $246,063,084 «first transfers out of 3848 sources»; aviso medio 7.2 h.
- El gráfico «Flow of funds» tiene columnas SOURCES y HOP 1…HOP 9 (602 direcciones en «Main routes»).

# Lo que contiene el CSV de direcciones (medido, ver guiones/)
- Dos columnas: address, role. Sin importes, sin horas, sin red, sin saltos.
- 7.067 filas: 3.848 «source» y 3.219 «flagged».
- Por tipo de dirección: source = 1.920 TRON + 1.916 EVM + 11 Bitcoin (bc1q…) + 1 que no es ninguna de esas (9Skj…, parece Solana); flagged = 3.097 TRON + 122 EVM.
- Las direcciones EVM van en minúsculas; ninguna dirección está repetida.
