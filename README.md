# School On-Chain · Informes on-chain

**Blockchain intelligence. Evidence over speculation.**
Sin hype. Sin señales. Sin conclusiones sin demostrar.

Web con informes de trazabilidad on-chain pensados para que los entienda cualquiera: gráficos que se pueden pulsar, una ficha por cada dirección, cada cifra con su nivel de evidencia y todo el método a la vista.

- Web (GitHub Pages): https://schoolonchain-ux.github.io/
- Telegram: https://t.me/SchoolOnChainIntel
- X: [@School_On_Chain](https://x.com/School_On_Chain) · [@TRX_TRONSCHOOL](https://x.com/TRX_TRONSCHOOL)

## Informe publicado

**Caso Binance Hack · 29 oct 2026** — trazabilidad del robo en TRON y Ethereum (informe v0.7, datos hasta el 2-nov-2026 09:23 UTC).
Se lee de arriba abajo en 8 capítulos: lo esencial, cómo leer, el caso, dónde está el dinero, cómo se movió en TRON, a dónde salió, qué tan fiable es, y método y fuentes.

## Qué hay en este repositorio

| Carpeta | Contenido |
|---|---|
| `index.html`, `report.html`, `assets/` | La web (HTML, CSS y JavaScript sin servidor; gráficos con Chart.js y D3, copias locales en `assets/vendor/`). |
| `reports/<informe>/` | Datos de cada informe: `data.json` (resumen), `detalle.json` (tablas de detalle), `libro/` (libro mayor completo: direcciones y movimientos) e `informe-completo.html` (el informe original). |
| `herramientas.html`, `data/` | Herramientas en vivo: comprobador de bloqueos de USDT en 21 redes, últimos bloqueos de Tether y calendario de descongelaciones de TRX (`data/desbloqueos-trx.json`, lectura de EquipoIA). |
| `tools/` | Herramientas para generar los datos de un informe nuevo (Node 18 o superior, sin dependencias). `tools/equipoia/` actualiza el calendario de TRX y necesita EquipoIA. |
| `investigacion/` | El código, los documentos y la evidencia de la investigación, tal como estaban en el repositorio de trabajo. Ver abajo. |

### `investigacion/`

- `blockchain-investigator/`: generador del informe de trazabilidad y su libro mayor.
- `research/auditoria-adversarial-2026-10-31/`: el seguimiento por tramos (copias congeladas v03 de los tramos 5 y 6), las dos vías de pureza con su método y huellas SHA-256, las rondas de revisión adversarial y el informe entregado.
- `research/binance-0x5227-2026-10-30/`: datos y trazas de la investigación original.
- `research/polytrop-2026-11-03/`: cruce con las listas de Polytrop y la exportación de Arkham.
- `docs/`: informes, catálogo, grafos y artículos del caso.

**No incluido por tamaño o por ser borrador:** las lecturas en bruto de Etherscan (`resultados/eth-raw`, unos 390 MB), las carpetas de trabajo `tramo4`, `tramo5` y `tramo6` y las copias intermedias v01 y v02. Se pueden volver a leer de la cadena.
Los scripts guardan rutas absolutas de la máquina donde se ejecutaron (`C:/EquipoIA/...`); hay que ajustarlas para repetirlos en otro equipo.

## Cómo añadir un informe (para quien mantiene el sitio)

Solo pueden publicar en este repositorio las cuentas con permiso de escritura; cualquiera puede hacer un fork y probarlo en su copia.

```bash
node tools/add-report.mjs ruta/al/INFORME.html --slug mi-informe --titulo "Título corto" --resumen "Una frase" --caso "Nombre del caso"
git add . && git commit -m "Nuevo informe" && git push
```

El informe debe llevar sus datos en `window.DATOS` (el formato que produce `blockchain-investigator`). Después se publica solo con GitHub Pages.

## Aviso

Proyecto independiente. Las marcas de terceros que aparecen (Binance, TRON, Tether…) pertenecen a sus titulares; este sitio no está afiliado a ellas. Nada de lo publicado es consejo de inversión. Una dirección no es una persona: el informe sigue dinero entre direcciones y no identifica a nadie. Las cifras en dólares son estimaciones salvo donde se marcan como VERIFICADO.

## Mantenimiento

Antes de cada commit que cambie algo de `assets/`, ejecuta `node tools/version-assets.mjs`: añade a cada enlace de la web una huella del contenido (`?v=…`) para que nadie vea una versión vieja guardada en su navegador. Es idempotente.

## Novedades (desde el 4-nov-2026)

Cada vez que se publica o amplía un informe, una nota o una página, se añade una entrada en `data/novedades.json` (la más reciente primero: fecha UTC, caso, título de una línea y enlace). La portada muestra la lista general y la última actualización de cada caso; cada página de caso muestra las suyas. Lo que no esté en ese fichero no aparece como novedad.
