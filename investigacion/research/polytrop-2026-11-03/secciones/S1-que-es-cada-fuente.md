# S1 · Qué es cada fuente y qué podemos decir de ella

## Polytrop
- Es un «escáner» web (polytrop.io/scanner/incident/binance-hack) con un caso «Binance Hack». Ofrece dos descargas: un CSV de direcciones (7.067) y un CSV de servicios (8), y un enlace para obtener claves de API (condiciones de acceso y funcionamiento no comprobados).
- **Qué declara**: Polytrop declara 3.219 direcciones marcadas («flagged») en 9 saltos desde 3.848 direcciones de origen («source»), marcadas de media 7,2 horas antes de que el dinero se moviera; total del incidente 6.300 M$ y 246,1 M$ rastreados («first transfers out of 3848 sources»; 23 de las fuentes enviaron fondos). El CSV confirma el número de direcciones etiquetadas (3.848 + 3.219); no permite validar saltos, importes ni la anticipación.
- **Qué contiene el CSV**: solo dos columnas (dirección y rol). No trae importes, horas, red ni salto. Por eso del CSV solo se puede cruzar **qué direcciones nombra**, no cuánto dinero ni cuándo.
- **Lo que no sabemos**: cómo decide Polytrop que una dirección es «source» o «flagged». No hay documentación pública que haya podido leer. La interpretación «source = dirección donde nace el rastro; flagged = receptora posterior» es **deducción mía** a partir de la página y de la dirección `TSpe5…` (que aparece como primera fuente marcada y que es una de nuestras 5 billeteras de arranque).

## EquipoIA (lo nuestro, en este tema)
- Rastreo propio de TRON por tramos (3, 4 y 5 = reparto posterior a la foto del 30-oct 22:40 UTC; 6 = reparto anterior; las fechas clasifican los envíos de arranque, no todos los movimientos posteriores de sus ramas), con importes atribuidos, conciliación y estados (verificado / estimado / hipótesis / desconocido).
- En Ethereum: 8 cuentas vigiladas (7 receptoras o consolidadoras de ETH y la dirección principal del robo) más el seguimiento hacia adelante de lo que llegó por Symbiosis y Chainflip: 584 direcciones alcanzadas (580 billeteras y 4 contratos terminales); 113 billeteras cumplen el criterio del modelo (saldo atribuible mayor de 0,01 ETH sin salidas seguidas en la ventana analizada, lecturas del 2-nov).
- Vigilantes automáticos de salidas (TRON y ETH) y un informe de trazabilidad con libro mayor.

## Cómo se comprueba
- Cifras de la página: `datos/polytrop-pagina-2026-11-03.md` (copia de lo que muestra).
- Estructura del CSV: `datos/polytrop-binance-hack-addresses.csv` (7.068 líneas con cabecera).
