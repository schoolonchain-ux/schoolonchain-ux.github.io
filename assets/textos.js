/* Textos explicativos del panel (lenguaje llano). Se basan en el método y las decisiones documentadas en el propio informe. */
(function () {
  const TXT = (window.TXT = {});

  /* Ayudas por gráfico: se muestran con «ⓘ Cómo leerlo» */
  TXT.ay = {
    reparto: [
      { k: 'Qué muestra', v: 'Cómo se reparte hoy el capital robado en TRON entre las partidas del balance: lo que Tether congeló, lo que queda en billeteras del recorrido, lo que está en servicios o puentes, lo que no se sabe dónde está y el efecto del precio.' },
      { k: 'Cómo leerlo', l: ['Cada porción es una partida y su tamaño es su importe en dólares.', 'La etiqueta de estado dice cuánta evidencia hay: <b>VERIFICADO</b> se puede comprobar en la cadena; <b>ESTIMADO</b> sale de un modelo que se declara.', 'Pulsa una porción o una fila de la leyenda para ver qué contiene, su fuente y las direcciones implicadas.'] },
      { k: 'Decisión de método', v: 'Lo congelado se verifica preguntando hoy al contrato de Tether. El resto se estima siguiendo el dinero billetera a billetera con un reparto proporcional (la «pureza»). Cada movimiento se valora al precio horario de Binance; USDT, USDC, USD1 y FDUSD, a su valor nominal.' },
      { k: 'Qué NO dice', v: 'Un punto de parada (servicio, nodo, casa de cambio) no es el destino final demostrado ni significa recuperación. La diferencia entre la suma de partidas y el capital es un descuadre del modelo, no una pérdida demostrada.' },
    ],
    global: [
      { k: 'Qué muestra', v: 'La misma cuenta para todas las cadenas a la vez: lo congelado, lo que sigue quieto sin congelar (sobre todo ETH), lo repartido en TRON que se ha seguido y los efectos de precio.' },
      { k: 'Cómo leerlo', l: ['Lo <b>congelado</b> y lo <b>quieto</b> se leen hoy directamente en cada cadena (verificado).', 'Lo «repartido en TRON y seguido» es una estimación.', 'Pulsa una porción para ver su detalle.'] },
      { k: 'Qué NO dice', v: 'Que el ETH esté quieto no significa que esté a salvo: ETH y POL son monedas nativas y nadie puede congelarlas; solo se puede vigilarlas.' },
    ],
    antesDespues: [
      { k: 'Qué muestra', v: 'Para cada destino, cuánto del dinero atribuido al robo se repartió <b>antes</b> y <b>después</b> de la «foto». La foto es un corte fijo: <b>30-oct 22:40 UTC</b>.' },
      { k: 'Por qué se separa', v: 'Se siguió el dinero en dos tramos con el mismo método: el tramo 5 (después de la foto) y el tramo 6 (antes). Separarlos permite ver cuándo se hizo cada parte del reparto y comprobar cada tramo por separado.' },
      { k: 'Cómo leerlo', l: ['Azul: después de la foto. Naranja: antes.', 'Pulsa una barra para abrir el detalle de esa partida.'] },
      { k: 'Límite', v: 'Lo retenido del tramo 6 es lo que había en cada billetera <b>a la hora de la foto</b>, no hoy; de lo que estaba en tránsito en ese momento no se sigue el destino posterior. El saldo real de cada billetera se lee aparte en su ficha.' },
    ],
    sankey: [
      { k: 'Qué muestra', v: 'El recorrido del capital de izquierda a derecha: del capital robado a cada partida, y de cada partida a su fase (antes o después de la foto) o a las direcciones congeladas.' },
      { k: 'Cómo leerlo', l: ['El <b>ancho</b> de cada banda es proporcional al importe.', 'Cada <b>color</b> es una partida; los nombres y los importes están junto a cada bloque y en la leyenda de abajo.', 'Pasa el ratón para ver importe y porcentaje; pulsa un bloque o una banda para abrir su detalle.', '<b>Zoom</b>: rueda del ratón o botones + / −; arrastra el fondo para moverte; «Reiniciar» vuelve a la vista inicial.'] },
      { k: 'Qué NO dice', v: 'La suma de las partidas no coincide exactamente con el capital: el informe declara esa diferencia en lugar de forzarla.' },
    ],
    horaReparto: [
      { k: 'Qué muestra', v: 'El dinero que la billetera de reparto (<span class="addr">TRBdWq…</span>) fue enviando, hora a hora. Barras: importe en dólares. Línea: número de envíos.' },
      { k: 'Cómo leerlo', l: ['Cada barra es una hora UTC.', 'Pulsa una barra para ver los envíos concretos de esa hora, con su hash y su destino.', 'Usa el selector de periodo para acercarte a un día.'] },
      { k: 'Por qué importa', v: 'Muestra el ritmo del reparto: se hizo en cientos de envíos a lo largo de unas 30 horas, con subidas y bajadas, no en un único movimiento. El ritmo no dice por sí solo quién lo hace.' },
    ],
    congelacion: [
      { k: 'Qué muestra', v: 'El USDT que Tether ha ido bloqueando en TRON, sumado en el tiempo. Cada punto es un bloqueo de una dirección (evento «AddedBlackList»).' },
      { k: 'Cómo leerlo', l: ['El eje vertical empieza en cero a propósito, para no exagerar los saltos.', 'Los dos primeros bloqueos concentran casi todo el importe; después se añaden direcciones con importes pequeños.', 'Pulsa un punto para abrir la ficha de la dirección bloqueada.'] },
      { k: 'Verificación', v: 'Se comprobó <b>hoy</b>, preguntando al contrato de Tether, que cada dirección sigue bloqueada y qué saldo conserva. Es lo único recuperado de verdad.' },
    ],
    porHora: [
      { k: 'Qué muestra', v: 'Volumen por hora de todos los movimientos del libro mayor en TRON, separados por tipo: transferencias, depósitos y retiradas de contratos, cambios de moneda, puentes y otros.' },
      { k: 'Cómo leerlo', l: ['Cada color es un tipo de movimiento (la leyenda es interactiva: pulsa un tipo para ocultarlo o mostrarlo).', 'Un mismo dinero puede aparecer en varios tipos al pasar por contratos, por eso la suma no es «dinero único».', 'Pulsa una barra para ver los mayores movimientos de esa hora.'] },
    ],
    red: [
      { k: 'Qué muestra', v: 'Un mapa de las direcciones que más dinero han movido y de los envíos entre ellas. Es solo la «punta»: el libro completo tiene miles de direcciones y se puede explorar desde aquí.' },
      { k: 'Cómo leerlo', l: ['<b>Círculo</b> = una dirección. Cuanto más grande, más volumen (recibido + enviado).', '<b>Color</b> = tipo de dirección (leyenda de abajo; púlsala para ocultar un tipo).', '<b>Flecha</b> = sentido del envío; cuanto más gruesa, mayor importe.', '<b>Borde rojo</b> = dirección congelada por Tether.'] },
      { k: 'Cómo explorarlo', l: ['<b>Clic</b> en un círculo: abre su ficha (saldo, quién le envía, a quién envía, todos sus movimientos).', '<b>Doble clic</b>: añade al mapa sus principales conexiones.', '<b>Buscar</b>: escribe parte de una dirección o de un nombre para añadirla al mapa.', 'Rueda del ratón para acercar; arrastra el fondo para moverte; arrastra un círculo para recolocarlo.'] },
      { k: 'Qué NO dice', v: 'Una dirección no es una persona. El color y el nombre son una clasificación del rastreo, no una identificación de titular.' },
    ],
    ethPartidas: [
      { k: 'Qué muestra', v: 'Qué hay en Ethereum y otras redes compatibles, partida a partida, valorado a precios de hoy.' },
      { k: 'Cómo leerlo', l: ['<b>Verde</b>: verificado leyendo la cadena (saldos, estado de bloqueo en el contrato del emisor).', '<b>Azul</b>: estimado (por ejemplo, el ETH que salió de convertir USDT y tokens).', 'Pulsa una barra para ver las direcciones y los contratos implicados.'] },
      { k: 'Qué NO dice', v: 'Que algo esté «quieto» no significa que esté seguro. El ETH y el POL no se pueden congelar: nadie puede bloquearlos; solo se puede vigilarlos.' },
    ],
    ethEntradas: [
      { k: 'Qué muestra', v: 'Cada punto es una transferencia registrada hacia Ethereum, por activo, en el tiempo. El eje vertical es logarítmico: cada marca es diez veces la anterior.' },
      { k: 'Cómo leerlo', l: ['Los puntos grandes (arriba) son las salidas de las billeteras calientes de Binance; la nube roja son entradas de ETH de importe medio.', 'Pulsa un punto para ver la transacción y abrirla en Etherscan.'] },
      { k: 'Límite', v: 'Es la lista de entradas que el informe registra por activo; puede no incluir todas las transferencias menores.' },
    ],
    usdt0: [
      { k: 'Qué muestra', v: 'Los envíos de USDT por el puente USDT0 (LayerZero): cuántos llegaron a su destino y cuántos siguen en tránsito.' },
      { k: 'Cómo leerlo', l: ['Verde: entregados (con recibo en la cadena de destino).', 'Amarillo: en tránsito o sin entregar.', 'Pulsa el gráfico para ver los 186 envíos con su hash de origen y de destino.'] },
      { k: 'Verificación', v: 'Para USDT0 sí se ha comprobado el recibo en destino: lo enviado y lo recibido difieren solo por comisiones.' },
    ],
    symbiosis: [
      { k: 'Qué muestra', v: 'Dinero que salió de TRON por Symbiosis y llegó a Ethereum o Arbitrum, por cadena y activo.' },
      { k: 'Cómo se comprobó', l: ['La cadena final y el receptor se leen de los datos de la propia llamada al puente.', 'Cada llegada se comprobó en Etherscan (el receptor aparece con ese hash y ese importe, con un margen de ±0,5 %).', 'Los envíos revertidos no son un destino: su recibo es la devolución en TRON.'] },
      { k: 'Cómo leerlo', v: 'Pulsa una barra para ver los receptores finales y los hashes.' },
    ],
    chainflip: [
      { k: 'Qué muestra', v: 'Cambios hechos con Chainflip desde el recorrido: lo que entró en el canal de depósito y lo que salió hacia la cadena de destino. Eje logarítmico.' },
      { k: 'Decisión de método', l: ['Los canales de Chainflip se reutilizan y reciben depósitos de otras personas: solo cuentan los cambios cuyo hash de depósito es una salida de una billetera del recorrido.', 'Un reembolso no es un destino: es un recibo en TRON.', 'Los «relevos» (depósitos sin cambio registrado que la bóveda responde en minutos con un pago casi igual) se emparejan por una regla y se marcan <b>ESTIMADO</b>: no existe una referencia que los demuestre.'] },
      { k: 'Cómo leerlo', v: 'Pulsa una barra para ver las direcciones de destino.' },
    ],
    destinos: [
      { k: 'Qué muestra', v: 'Los destinos donde el seguimiento del dinero repartido (tras la foto) se detiene, ordenados por importe atribuido al robo. Eje logarítmico: una barra dos marcas más larga es cien veces mayor.' },
      { k: 'Cómo leerlo', l: ['El color indica el tipo de destino (leyenda de la dona de al lado).', '«(sin nombre)» son nodos de servicio sin etiqueta pública: direcciones con muchísima actividad.', 'Pulsa una barra para ver las direcciones concretas que forman ese destino.'] },
      { k: 'Qué NO dice', v: 'Un destino es un <b>punto de parada del rastreo</b>, no la identificación del beneficiario ni una prueba de que el dinero se haya ido definitivamente.' },
    ],
    destinosClase: [
      { k: 'Qué muestra', v: 'El mismo reparto agrupado por tipo de destino: nodos de servicio, USDD, puentes, préstamos y casas de cambio.' },
      { k: 'Cómo leerlo', v: 'Pulsa una porción para ver todas las direcciones de ese tipo.' },
    ],
    casas: [
      { k: 'Qué muestra', v: 'Dinero que ha llegado a direcciones etiquetadas como casas de cambio, por plataforma: lo recibido en bruto y la parte que el modelo atribuye al robo.' },
      { k: 'Qué NO dice', v: 'Una llegada a una casa de cambio es un <b>depósito detectado</b>, no una cuenta de cliente confirmada ni una identificación de la persona.' },
      { k: 'Cómo leerlo', v: 'Pulsa una plataforma para ver los depósitos comprobados, con fechas y hashes.' },
    ],
    swaps: [
      { k: 'Qué muestra', v: 'Los contratos de cambio de moneda (enrutadores) por los que pasó el dinero: lo que entró y lo que salió de cada uno.' },
      { k: 'Decisión de método', v: 'Cada cambio se guarda como una pareja entrada-salida; no se suman como si fueran dos dineros distintos.' },
      { k: 'Cómo leerlo', v: 'Que la salida supere a la entrada se debe a cómo se valoran los activos al precio de cada hora y a que el rastreo incluye todo el recorrido, no a que se «cree» dinero.' },
    ],
    pureza1: [
      { k: 'Qué muestra', v: 'Cuánto de lo que entra en el reparto se acaba repartiendo entre destinos (la «relación»), según cada vía de cálculo de la pureza.' },
      { k: 'Qué es la pureza', v: 'La parte del dinero de una billetera que el modelo atribuye al robo. Cuando esa billetera envía dinero, se asume que sale con el mismo porcentaje.' },
      { k: 'Cómo leerlo', l: ['Una relación del 100 % significa que lo repartido iguala a lo que entra. <b>Por encima de 100 % hay sobreatribución</b> (el modelo atribuye más de lo que entró).', 'Hay tres vías: <b>actual</b> (la de las cifras del informe), <b>ciclo</b> (corrige un caso concreto) y <b>diluida</b> (cota inferior, corrige de más).', 'El rango entre vías es la incertidumbre del modelo.'] },
      { k: 'Decisión', v: 'Las dos vías (actual y ciclo) se conservan siempre, con su método, su evidencia y sus resultados. Un método nuevo se añade como una vía más; nunca sustituye ni borra lo anterior (decisión del propietario, 3-nov-2026).' },
    ],
    pureza2: [
      { k: 'Qué muestra', v: 'Los mismos resultados en dólares atribuidos a destinos con cada vía, por tramo.' },
      { k: 'Cómo leerlo', v: 'Pulsa una barra para ver las billeteras donde más cambia el resultado de una vía a otra.' },
    ],
    rastro: [
      { k: 'Qué muestra', v: 'Cada tipo de lugar donde el seguimiento del dinero se corta, con el importe atribuido que se queda allí.' },
      { k: 'Tres grupos', l: ['<b>PARADA</b> (azul): el rastro termina a propósito en un servicio reconocido o por un límite declarado.', '<b>DESCONOCIDO</b> (rojo): no hay dato público que aclare qué pasó después.', '<b>PENDIENTE</b>: se está investigando ahora.'] },
      { k: 'Cómo leerlo', v: 'Eje logarítmico. Pulsa una barra para ver la lista de direcciones y contratos de esa causa; se puede descargar completa en CSV.' },
    ],
    arkham: [
      { k: 'Qué muestra', v: 'Transacciones recientes etiquetadas «Binance Hacker» por Arkham (una exportación aportada por el propietario), por red.' },
      { k: 'Cómo leerlo', l: ['Eje logarítmico.', 'Casi todo lo importante ocurrió <b>después</b> del corte de nuestros datos de TRON (2-nov 09:23 UTC) o en redes que no cubrimos.', 'Pulsa una barra para ver las transacciones de esa red y si ya las teníamos.'] },
      { k: 'Qué NO dice', v: 'Coincidir con una lista de terceros no demuestra por sí solo la titularidad de una dirección.' },
    ],
    polytrop: [
      { k: 'Qué muestra', v: 'Direcciones que publica Polytrop (polytrop.io) y que no teníamos, por red y tipo de lista («source» y «flagged»).' },
      { k: 'Límite', v: 'Es un cruce de direcciones: sus listas no traen importes ni horas. No hay documentación pública de su método; el significado de «source» (origen) y «flagged» (marcada) es una deducción.' },
    ],
  };

  /* Decisiones de método (sección «Método y decisiones») */
  TXT.decisiones = [
    ['Un solo libro mayor', 'Cada movimiento es una fila con su hash, fecha, activo, importe y estado. No se suman movimientos duplicados y el libro se recalcula de forma independiente para comprobar que reproduce los totales del análisis.', 'Evita contar dos veces el mismo dinero y permite que cualquiera repita las cifras.'],
    ['Cada cifra lleva su estado y su fuente', 'VERIFICADO (evidencia directa), ESTIMADO (modelo declarado), HIPÓTESIS (por demostrar), DESCONOCIDO (sin datos), PENDIENTE (investigación abierta). El estado se lee del dato, no se escribe a mano.', 'Quien lee sabe en cada número cuánto puede fiarse.'],
    ['La «foto» del 30-oct 22:40 UTC', 'El reparto se sigue en dos tramos con el mismo método: tramo 5 (después de la foto) y tramo 6 (antes de la foto).', 'Permite comprobar cada tramo por separado y situar en el tiempo cada parte del reparto.'],
    ['Reparto proporcional («pureza»)', 'Cuando una billetera mezcla dinero del robo con otro, se asume que lo que envía sale con la misma proporción que lo que recibió. Se aplica billetera a billetera.', 'No hay forma de «marcar» dólares concretos en una cadena; un reparto proporcional es un criterio explícito y repetible.'],
    ['Las dos vías de pureza se conservan siempre', 'La vía actual trata como neutro lo que entra desde contratos de cambio, puentes o bóvedas. La vía ciclo corrige el caso en que una billetera cobra pagos de otra gente desde una bóveda. La diluida es una cota baja. Se calculan y se guardan todas, con huella digital (SHA-256) de cada fichero.', 'La revisión independiente localizó el exceso del tramo 6 en una sola billetera. Con dos vías se ve la incertidumbre real en lugar de ocultarla. Decisión del propietario, 3-nov-2026.'],
    ['Precios', 'Cada movimiento se valora al precio horario de Binance de su hora; lo que sigue quieto, al precio de hoy; USDT, USDC, USD1 y FDUSD, a su valor nominal. El análisis de atribución usa un precio fijo de 0,352 $/TRX.', 'Los precios cambian; la fecha y el criterio de cada importe quedan declarados.'],
    ['Límite de seguimiento', 'Las transferencias menores de unos 3.520 $ (≈ 10.000 TRX al precio fijo) no se siguen y se suman como «polvo».', 'Sin un umbral, el rastreo se haría inabarcable sin aportar importe relevante.'],
    ['Nodos de servicio', 'Una dirección con más de 5.000 operaciones se trata como punto de parada: el rastreo termina ahí.', 'Mezcla dinero de muchos usuarios; seguir más allá atribuiría al robo dinero que no es suyo.'],
    ['Una casa de cambio no es una identificación', 'La llegada a una dirección etiquetada como casa de cambio se llama «depósito detectado».', 'No se puede saber quién hay detrás de una cuenta sin la colaboración de la plataforma.'],
    ['Cruces entre cadenas', 'Symbiosis: destino leído de la llamada y llegada comprobada en Etherscan. Chainflip: solo cuentan los cambios cuyo depósito es del recorrido; un reembolso no es un destino; los relevos son ESTIMADO. Across: el rastro termina en un contrato «Executor» cuyas instrucciones están cifradas.', 'Se prefiere decir «desconocido» a inventar un destino.'],
    ['Ethereum hacia adelante', 'Solo se sigue una salida si ocurre después de la primera entrada trazada a esa billetera (menos 1 hora). Cierra en contratos, billeteras de uso muy alto y billeteras quietas.', 'Las salidas anteriores a la primera entrada trazada no son del robo: esto redujo una diferencia de 364 ETH a 4 ETH.'],
    ['Revisión adversarial', 'Revisores independientes (otros modelos de IA) intentan refutar el informe por rondas, y el sistema de revisión conserva sus respuestas. Las lecciones se incorporan al método y al control de calidad.', 'Un informe solo revisado por quien lo escribe tiene puntos ciegos. Ninguna vía de pureza tiene todavía revisión externa.'],
  ];

  TXT.limites = [
    'No se identifica a ninguna persona: una dirección no es una persona y una etiqueta de terceros es una pista, no una prueba.',
    'Los importes en dólares son estimaciones (precio y hora elegidos). Lo verificado en cadena se dice VERIFICADO.',
    'Las cifras de «dónde está el dinero» en TRON son un modelo: la suma de partidas no coincide con el capital y esa diferencia se muestra tal cual.',
    'Los puntos de parada no son destinos finales demostrados ni significan recuperación.',
    'Las instrucciones del contrato «Executor» de Across están cifradas; los depósitos prefinanciados y los relevos de Chainflip sin pareja son DESCONOCIDO.',
    'Hay enrutadores de cambio (BWSwap, SmartExchange, UniversalRouter…) cuya salida no se pudo decodificar. Lo habitual es que el resultado vuelva al remitente en otro token, pero no está demostrado para estos envíos.',
    'El corte de datos de TRON es el 2-nov-2026 09:23 UTC: lo ocurrido después no está en este informe.',
    'Un informe no es una prueba judicial. Las direcciones y transacciones están enlazadas al explorador para que cualquiera pueda comprobarlas.',
  ];

  TXT.glosario = [
    ['Dirección / billetera', 'El «número de cuenta» en una cadena de bloques. Una dirección no dice quién la controla.'],
    ['Libro mayor', 'La base de datos de este informe: todos los movimientos que el rastreo ha visto, uno por fila.'],
    ['USDT, USDC y otras monedas estables', 'Monedas ligadas al dólar. Sus emisores (Tether, Circle…) pueden bloquear direcciones; las monedas nativas como TRX, ETH o POL no se pueden bloquear.'],
    ['Congelado / lista negra', 'Una dirección que el emisor ha bloqueado: lo que tenga no se puede mover. Es lo único recuperado de verdad.'],
    ['Billetera caliente (hot wallet)', 'Billetera conectada a internet que una casa de cambio usa para los pagos del día a día.'],
    ['La «foto»', 'Corte fijo del 30-oct 22:40 UTC. Separa el reparto anterior (tramo 6) del posterior (tramo 5).'],
    ['Pureza', 'La parte del dinero de una billetera que el modelo atribuye al robo. Hay varias vías de cálculo (actual, ciclo, diluida).'],
    ['Importe «atribuido» y «bruto»', 'Bruto es lo que llegó; atribuido es la parte que el modelo achaca al robo según la pureza.'],
    ['Nodo de servicio', 'Dirección con más de 5.000 operaciones, por ejemplo un concentrador. El rastreo se detiene aquí.'],
    ['Punto de parada', 'Lugar donde el seguimiento termina a propósito. No es un destino final demostrado.'],
    ['Casa de cambio (exchange)', 'Plataforma donde se compra y vende cripto, como Bybit, OKX o Bitget. Un depósito detectado no identifica a nadie.'],
    ['Puente (bridge)', 'Servicio que mueve dinero de una cadena a otra: Symbiosis, Chainflip, Across, USDT0 (LayerZero), Bridgers.'],
    ['Swap / cambio', 'Cambiar un activo por otro, por ejemplo TRX por USDT, mediante un contrato.'],
    ['DeFi, JustLend y jUSDT', 'Finanzas descentralizadas. Depositar USDT en JustLend da un justificante (jUSDT) que se puede mandar a otra billetera y retirar desde allí.'],
    ['USDD', 'Moneda estable del ecosistema TRON. Convertir a USDD detiene el rastreo en este informe.'],
    ['Relevo (Chainflip)', 'Pago que la bóveda hace minutos después de un depósito sin cambio registrado, con una comisión casi fija. Se empareja por una regla y es ESTIMADO.'],
    ['Polvo', 'Importes pequeños que no se siguen y se suman aparte.'],
    ['VERIFICADO / ESTIMADO / HIPÓTESIS / DESCONOCIDO / PENDIENTE', 'Cinco niveles de evidencia. De más a menos sólido: verificado en cadena, estimado con un modelo declarado, hipótesis por demostrar, desconocido y pendiente de investigar.'],
    ['Revisión adversarial', 'Un revisor independiente intenta encontrar fallos del informe. Sus objeciones y las respuestas se conservan.'],
    ['TronScan / Etherscan', 'Exploradores públicos de las cadenas TRON y Ethereum. Cada hash y cada dirección de este panel enlaza con ellos.'],
  ];
})();
