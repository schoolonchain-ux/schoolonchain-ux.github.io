# Página interactiva de SUNSwap: los programas

Copia de transparencia de lo que prepara los datos de `sunswap.html` (la versión interactiva de «SUNSwap bajo el microscopio»). El informe validado no se modifica: esta página lo enseña de otra forma.

- `exportar.cjs`: lee los archivos de la propia investigación (solo lectura) y el informe publicado, y escribe `reports/sunswap-microscopio/data.json`. **Antes de escribir comprueba** que los números de los gráficos coinciden con las tablas del informe (capital por versión, mayores mercados, profundidad, volumen, serie diaria…) y que cada cifra citada en los textos de la página aparece en el informe; si algo no coincide, no escribe nada.
- `md.cjs`: lector mínimo del informe en Markdown (apartados y tablas). Todas las tablas de la página son las del informe, copiadas tal cual.

Los datos de los gráficos que no están en tablas (series diarias, cuotas, recuentos de validación) salen de los resúmenes que dejó la propia investigación (`derivados/f3`–`f6`). No se calcula nada nuevo: se reordena y se dibuja. Nada de esto es consejo de inversión.
