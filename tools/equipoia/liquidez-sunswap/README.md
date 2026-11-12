# Monitor de liquidez de sun.io: los programas

Copia de transparencia de lo que calcula la pestaña «Liquidez sun.io» de Herramientas. Los programas que se ejecutan de verdad viven fuera de este repositorio; aquí están para que cualquiera pueda leerlos.

- `mercados.json` y `tokens.json`: los mercados de sun.io (V1–V4) con liquidez para los 12 tokens y los propios tokens. Salen del inventario de la investigación «sun.io bajo el microscopio» (`exportar-mercados.cjs`).
- `lector.cjs`: lee el estado de cada mercado directamente en la cadena TRON (nodo público de TronGrid, solo lectura): reservas en V1 y V2; precio, liquidez y mapa de ticks en V3 y V4.
- `motor.cjs`: el mismo motor de enteros exactos de la investigación; simula una venta contra cada mercado.
- `curvas.cjs`: para cada token calcula el coste de vender una cuadrícula de tamaños (de 100 $ a 50 M$), repartiendo la venta entre los mercados y comparando la ruta directa con la de dos saltos.
- `liquidez.cjs`: junta lo anterior y escribe `data/liquidez-sunswap.json`, que es lo que lee la página.
- `interp.js`: lo que hace la página con el importe que escribes (interpola entre dos puntos de la cuadrícula; error medido: menos de 0,02 puntos con costes de hasta el 5 %).
- `validar.cjs`: compara el motor con los cotizadores oficiales de los contratos (solo lectura); se repite una vez al día.
- `decidir.cjs`: decide si una lectura es válida y si hay que renovar la página.

Es una simulación, no una venta real: no incluye la energía de TRON ni lo que cambie el mercado entre la lectura y la operación. Nada de esto es consejo de inversión.
