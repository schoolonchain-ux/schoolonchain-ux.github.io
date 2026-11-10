/* Lectura del día del Observatorio de mercado. La escribe este programa con reglas fijas: sin IA y sin opinión.
   Dos pasos, los dos puros (no leen nada de fuera):
   - hechos(D, filas): saca de la lectura diaria (data/mercado.json) y de la serie propia (data/mercado-serie.json) las cifras que se van a decir.
   - frases(H): con esas cifras escribe cinco puntos (el día, el capital, la liquidez, la volatilidad y los desacoples). Cada cifra lleva una
     referencia («ref») para que la página abra su ficha de origen. Lo que no se puede calcular no se dice: la frase se acorta o el punto no sale.
   Las reglas (umbrales y palabras) están en REGLAS y son las mismas que la página enseña en «Cómo se escribe esta lectura».
   Todos los cálculos numéricos son de mercado-calc.js (con pruebas y contraste con numpy). */
(function (raiz) {
  'use strict';
  const nodo = typeof module !== 'undefined' && module.exports;
  const M = nodo ? require('./mercado-calc.js') : raiz.MCALC;
  const num = (x) => typeof x === 'number' && isFinite(x);

  // ---- reglas fijas ----
  const MIN_CESTA = 10;      // con menos activos con cierre del día no se habla del día
  const MIN_SECTOR = 3;      // con menos activos con dato un sector no tiene cifra (igual que en el resto de la página)
  const AMPLITUD = [[0.8, 'Día de subidas casi generales'], [0.6, 'Día con más subidas que bajadas'], [0.4, 'Día repartido'], [0.2, 'Día con más bajadas que subidas'], [-1, 'Día de bajadas casi generales']];
  const PAREJO = 0.05;       // desequilibrio de los libros por debajo del cual los dos lados se dan por parejos
  const IGUAL_PUNTOS = 0.05; // diferencia de peso de bitcoin (en puntos) por debajo de la cual se dice «el mismo»
  const UMBRAL_DES = 0.2;    // caída de la correlación a 30 días con bitcoin para decir «se desacopla» (la misma regla que el bloque de desacoples)
  const ALTOS = ['agitado', 'extremo'];
  const NOMBRES = 5;         // cuántos activos desacoplados se nombran antes de «y n más»
  const REGLAS = [
    ['El día', 'Se cuenta el último día cerrado (en UTC) de cada activo de la cesta: cuántos cerraron por encima del cierre anterior y cuál es la mediana de los cambios. Con el ' + AMPLITUD[0][0] * 100 + ' % o más al alza se dice «subidas casi generales»; del ' + AMPLITUD[1][0] * 100 + ' al ' + AMPLITUD[0][0] * 100 + ' %, «más subidas que bajadas»; entre el ' + AMPLITUD[2][0] * 100 + ' y el ' + AMPLITUD[1][0] * 100 + ' %, «repartido»; y lo mismo al revés para las bajadas. Un activo sin cierre ese día no cuenta. Con menos de ' + MIN_CESTA + ' activos no se dice nada. El sector es la mediana de sus activos, con ' + MIN_SECTOR + ' como mínimo.'],
    ['El capital', 'Capitalización total y peso de bitcoin y ether según CoinGecko; las stablecoins, según DefiLlama. El peso de bitcoin se compara con la última foto de otro día guardada en la serie propia; si la diferencia es menor de ' + String(IGUAL_PUNTOS).replace('.', ',') + ' puntos se dice que es el mismo.'],
    ['La liquidez', 'Se suman los libros de Binance de la lectura diaria: dinero esperando para comprar y para vender a menos de un 1 % del precio. Si la diferencia entre los dos lados es menor del ' + PAREJO * 100 + ' % de la suma se dice que están parejos. La comparación con otro día usa solo los libros que están en las dos fotos.'],
    ['La volatilidad', 'Estado de bitcoin según el percentil de su volatilidad a 30 días dentro de su propia historia (calma, normal, agitado, extremo), hoy y el día anterior: si cambia se dice «pasa de… a…». Se cuentan los activos agitados o en extremo. La volatilidad esperada es el índice de Deribit del último día cerrado.'],
    ['Los desacoples', 'Un activo «se desacopla» cuando su correlación a 30 días con bitcoin ha caído ' + String(UMBRAL_DES).replace('.', ',') + ' o más respecto a los 30 días anteriores. La misma cuenta se hace con los datos hasta el día anterior para decir quién entra en la lista y quién sale.'],
  ];

  // ---- formato (el mismo que el resto de la página) ----
  const nf = (x, d = 0) => Number(x).toLocaleString('es-ES', { useGrouping: 'always', minimumFractionDigits: d, maximumFractionDigits: d });
  const pct = (x, d = 1) => (Number(Math.abs(x * 100).toFixed(d)) === 0 ? '' : x >= 0 ? '+' : '−') + nf(Math.abs(x * 100), d) + ' %';
  const mUsd = (x) => (x >= 1e6 ? nf(x / 1e6, x >= 1e9 ? 0 : 1) + ' M$' : nf(x) + ' $');
  const dinero = (x) => (x >= 1e12 ? nf(x / 1e12, 2) + ' billones de dólares' : mUsd(x));
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const fd = (d) => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(d || ''); return m ? Number(m[3]) + '-' + MES[Number(m[2]) - 1] : String(d); };
  const c2 = (x) => (x < 0 ? '−' : '') + nf(Math.abs(x), 2);

  function tonoAmplitud(suben, n) { const k = suben * 10; return AMPLITUD[k >= 8 * n ? 0 : k >= 6 * n ? 1 : k > 4 * n ? 2 : k > 2 * n ? 3 : 4][1]; }
  function ladoLibros(des) { return des > PAREJO ? 'pesa más el lado comprador' : des < -PAREJO ? 'pesa más el lado vendedor' : 'los dos lados están parejos'; }

  // ---- 1 · los hechos ----
  function hechos(D, filas) {
    const H = { leidoEn: (D && D.leidoEn) || null, dia: null, capital: null, liquidez: null, vol: null, des: null };
    if (!D || !Array.isArray(D.activos) || !Array.isArray(D.dias) || !D.dias.length) return H;
    const A = D.activos.filter((a) => a && Array.isArray(a.c)); const fin = D.dias.length - 1; const btc = A[0]; const porS = new Map(A.map((a) => [a.s, a]));
    const hoy = String(D.leidoEn || '').slice(0, 10);
    const F = (Array.isArray(filas) ? filas : []).filter((f) => f && f.dia && f.dia < hoy).sort((a, b) => (a.dia < b.dia ? -1 : 1)); const previa = F.length ? F[F.length - 1] : null;

    // el día: último día cerrado; un activo sin cierre ese día no cuenta
    const r1 = (a) => (a && M.ultimo(a.c) === fin ? M.rend(a.c, 1) : null);
    const R = A.map((a) => ({ s: a.s, n: a.n, r: r1(a) })).filter((x) => num(x.r)).sort((p, q) => q.r - p.r);
    const g = M.grupo(R.map((x) => x.r), MIN_CESTA);
    if (g) {
      const S = (D.sectoresCesta || []).map((x) => { const ms = (x.miembros || []).map((s) => porS.get(s)).filter(Boolean); const q = M.grupo(ms.map(r1), MIN_SECTOR); return q ? { id: x.id, nombre: x.nombre, n: q.n, suben: q.suben, mediana: q.mediana } : null; }).filter(Boolean).sort((p, q) => q.mediana - p.mediana);
      const uno = (s) => { const x = R.find((q) => q.s === s); return x ? x.r : null; };
      H.dia = { dia: D.dias[fin], n: g.n, suben: g.suben, bajan: g.n - g.suben, mediana: g.mediana, tono: tonoAmplitud(g.suben, g.n), btc: uno('BTC'), eth: uno('ETH'), mejor: R[0], peor: R[R.length - 1], lista: R, sectores: S, sectorMejor: S.length >= 2 ? S[0] : null, sectorPeor: S.length >= 2 ? S[S.length - 1] : null };
    }

    // el capital
    const G = D.global, St = D.stables;
    if (G && num(G.capTotalUsd) && G.capTotalUsd > 0 && G.dominanciaPct && num(G.dominanciaPct.btc)) {
      const st = St && num(St.totalUsd) ? St.totalUsd / G.capTotalUsd * 100 : null; const y = St && Array.isArray(St.serie) ? St.serie : [];
      const c30 = y.length > 30 && num(y[y.length - 1][1]) && num(y[y.length - 31][1]) && y[y.length - 31][1] > 0 ? { hoy: y[y.length - 1][1], antes: y[y.length - 31][1], diaAntes: y[y.length - 31][0], cambio: y[y.length - 1][1] / y[y.length - 31][1] - 1 } : null;
      const p = previa && num(previa.btcPct) ? { dia: previa.dia, btc: previa.btcPct, dif: G.dominanciaPct.btc - previa.btcPct, total: num(previa.capTotalUsd) ? previa.capTotalUsd : null } : null;
      H.capital = { total: G.capTotalUsd, btc: G.dominanciaPct.btc, eth: num(G.dominanciaPct.eth) ? G.dominanciaPct.eth : null, st, stUsd: st == null ? null : St.totalUsd, c30, previa: p };
    }

    // la liquidez: libros de Binance a ±1 %
    const L = ((D.liquidez && D.liquidez.filas) || []).filter((x) => x && !x.fallo && num(x.compras) && num(x.ventas));
    if (L.length) {
      const C = L.reduce((t, x) => t + x.compras, 0), V = L.reduce((t, x) => t + x.ventas, 0);
      let p = null; const lp = previa && previa.libros ? previa.libros : null;
      if (lp) { const com = L.filter((x) => lp[x.s] && num(lp[x.s].compras) && num(lp[x.s].ventas)); const a = com.reduce((t, x) => t + x.compras + x.ventas, 0), b = com.reduce((t, x) => t + lp[x.s].compras + lp[x.s].ventas, 0); if (com.length && b > 0) p = { dia: previa.dia, n: com.length, hoy: a, antes: b, cambio: a / b - 1 }; }
      H.liquidez = { n: L.length, compras: C, ventas: V, desequilibrio: C + V > 0 ? (C - V) / (C + V) : 0, lado: ladoLibros(C + V > 0 ? (C - V) / (C + V) : 0), masComprador: L.filter((x) => x.compras > x.ventas).length, alMenos: L.some((x) => x.completo === false), hora: L[0].hora || null, libros: L.map((x) => ({ s: x.s, par: x.par, url: x.url, compras: x.compras, ventas: x.ventas })), previa: p };
    }

    // la volatilidad: estado de hoy y del día anterior (la misma serie sin su último día)
    const estado = (a) => { const sv = M.serieVol(a.c, 30); const p = M.percentil(sv), pa = M.percentil(sv.slice(0, sv.length - 1)); return { s: a.s, n: a.n, v30: M.vol(a.c, 30), p, e: M.estadoVol(p), pAyer: pa, eAyer: M.estadoVol(pa) }; };
    const E = A.map(estado); const con = E.filter((x) => x.e);
    if (btc && con.length) {
      const eb = E[0]; const conAyer = E.filter((x) => x.eAyer);
      let esp = null; const xe = ((D.esperada && D.esperada.filas) || []).find((x) => x && x.s === btc.s && Array.isArray(x.v));
      if (xe && num(eb.v30)) { const u = M.ultimo(xe.v); if (u >= fin - 1 && u >= 0) esp = { s: xe.s, dia: D.dias[u], esperada: xe.v[u], realizada: eb.v30, dif: xe.v[u] - eb.v30 }; }
      H.vol = { btc: eb.e ? eb : null, n: con.length, altos: con.filter((x) => ALTOS.includes(x.e)).map((x) => x.s), nAyer: conAyer.length, altosAyer: conAyer.filter((x) => ALTOS.includes(x.eAyer)).map((x) => x.s), lista: E, esperada: esp };
    }

    // los desacoples: la regla del bloque, hoy y con los datos hasta el día anterior
    if (btc && A.length > 1) {
      const T = A.slice(1).map((a) => { const c30 = M.corr(a.c, btc.c, 30), prev = M.corr(a.c, btc.c, 30, 30), cy = M.corr(a.c, btc.c, 30, 1), py = M.corr(a.c, btc.c, 30, 31); const d = c30 != null && prev != null ? c30 - prev : null, dy = cy != null && py != null ? cy - py : null; return { s: a.s, n: a.n, c30, prev, d, hoy: d == null ? null : d <= -UMBRAL_DES, ayer: dy == null ? null : dy <= -UMBRAL_DES }; });
      const con = T.filter((x) => x.d != null);
      if (con.length) {
        const lista = con.filter((x) => x.hoy).sort((p, q) => p.d - q.d);
        H.des = { n: con.length, tabla: T, lista, entran: lista.filter((x) => x.ayer === false).map((x) => x.s), salen: con.filter((x) => !x.hoy && x.ayer === true).map((x) => x.s), medianaHoy: M.mediana(con.map((x) => x.c30)), medianaAntes: M.mediana(con.map((x) => x.prev)) };
      }
    }
    return H;
  }

  // ---- 2 · las frases ----
  // Cada punto: { k, titulo, ancla, partes }. Una parte es un texto o { t, ref, ... }: una cifra que la página convierte en botón hacia su ficha.
  function frases(H) {
    const out = []; if (!H) return out;
    const lista = (v) => v.map((x, i) => [i ? (i === v.length - 1 ? ' y ' : ', ') : '', x]).flat();

    if (H.dia) {
      const d = H.dia; const p = [d.tono + ': el ' + fd(d.dia) + ' cerraron al alza ', { t: d.suben + ' de ' + d.n + ' activos', ref: 'amplitud' }, ' de la cesta y la mediana fue ', { t: pct(d.mediana, 1), ref: 'amplitud' }, '.'];
      if (num(d.btc)) { p.push(' Bitcoin, ', { t: pct(d.btc, 1), ref: 'activo', s: 'BTC' }); if (num(d.eth)) p.push('; ether, ', { t: pct(d.eth, 1), ref: 'activo', s: 'ETH' }); p.push('.'); }
      if (d.n >= 2 && d.mejor.s !== d.peor.s) p.push(' El que más subió fue ', { t: d.mejor.s + ' (' + pct(d.mejor.r, 1) + ')', ref: 'activo', s: d.mejor.s }, ' y el que más bajó, ', { t: d.peor.s + ' (' + pct(d.peor.r, 1) + ')', ref: 'activo', s: d.peor.s }, '.');
      if (d.sectorMejor && d.sectorPeor) p.push(' Por sectores, el mejor fue ', { t: '«' + d.sectorMejor.nombre + '» (' + pct(d.sectorMejor.mediana, 1) + ')', ref: 'sector', id: d.sectorMejor.id }, ' y el peor, ', { t: '«' + d.sectorPeor.nombre + '» (' + pct(d.sectorPeor.mediana, 1) + ')', ref: 'sector', id: d.sectorPeor.id }, '.');
      out.push({ k: 'dia', titulo: 'El día', ancla: 'calor', partes: p });
    }

    if (H.capital) {
      const c = H.capital; const p = ['El mercado vale ', { t: dinero(c.total), ref: 'capital' }, '. De cada 100 $, ', { t: nf(c.btc, 0), ref: 'capital' }, ' están en bitcoin'];
      if (num(c.eth)) p.push(c.st == null ? ' y ' : ', ', { t: nf(c.eth, 0), ref: 'capital' }, ' en ether');
      if (c.st != null) p.push(' y ', { t: nf(c.st, 0), ref: 'capital' }, ' en stablecoins');
      p.push('.');
      if (c.previa) p.push(Math.abs(c.previa.dif) < IGUAL_PUNTOS ? [' El peso de bitcoin es ', { t: 'el mismo', ref: 'capital' }, ' que en la foto del ' + fd(c.previa.dia) + '.'] : [' El peso de bitcoin ha ' + (c.previa.dif > 0 ? 'subido ' : 'bajado '), { t: nf(Math.abs(c.previa.dif), 1) + ' puntos', ref: 'capital' }, ' desde la foto del ' + fd(c.previa.dia) + '.']);
      if (c.c30) p.push(' Las stablecoins en circulación han ' + (c.c30.cambio >= 0 ? 'subido' : 'bajado') + ' un ', { t: nf(Math.abs(c.c30.cambio * 100), 1) + ' %', ref: 'stables' }, ' en 30 días.');
      out.push({ k: 'capital', titulo: 'El capital', ancla: 'capital', partes: p.flat() });
    }

    if (H.liquidez) {
      const l = H.liquidez; const mas = l.alMenos ? 'al menos ' : '';
      const p = ['En ' + (l.n === 1 ? 'el libro' : 'los ' + l.n + ' libros') + ' de Binance de la foto diaria había ' + mas, { t: mUsd(l.compras), ref: 'liquidez' }, ' esperando para comprar y ' + mas, { t: mUsd(l.ventas), ref: 'liquidez' }, ' para vender a menos de un 1 % del precio: ' + l.lado + '.'];
      if (l.previa) p.push(' Sumados los dos lados, es un ', { t: nf(Math.abs(l.previa.cambio * 100), 1) + ' % ' + (l.previa.cambio >= 0 ? 'más' : 'menos'), ref: 'liquidez' }, ' que en la foto del ' + fd(l.previa.dia) + '.');
      out.push({ k: 'liquidez', titulo: 'La liquidez', ancla: 'liquidez', partes: p });
    }

    if (H.vol) {
      const v = H.vol; const p = [];
      if (v.btc) {
        const b = v.btc; if (b.eAyer && b.eAyer !== b.e) p.push('Bitcoin pasa de «' + b.eAyer + '» a ', { t: '«' + b.e + '»', ref: 'estado', s: b.s }); else p.push('Bitcoin ' + (b.eAyer ? 'sigue en ' : 'está en '), { t: '«' + b.e + '»', ref: 'estado', s: b.s });
        p.push(': su volatilidad de 30 días es del ', { t: nf(b.v30, 1) + ' % anual', ref: 'estado', s: b.s }, ', igual o mayor que la del ', { t: nf(b.p, 0) + ' %', ref: 'estado', s: b.s }, ' de los días de su historia. ');
      }
      p.push({ t: v.altos.length + ' de ' + v.n + ' activos', ref: 'volCesta' }, ' están agitados o en extremo' + (v.nAyer && v.altosAyer.length !== v.altos.length ? ' (el día anterior, ' + v.altosAyer.length + ')' : '') + '.');
      if (v.esperada) { const e = v.esperada; p.push(' Para los próximos 30 días el mercado de opciones espera en bitcoin un ', { t: nf(e.esperada, 1) + ' % anual', ref: 'esperada', s: e.s }, Number(Math.abs(e.dif).toFixed(1)) === 0 ? ', lo mismo que lo ocurrido en los últimos 30.' : ', ' + nf(Math.abs(e.dif), 1) + ' puntos ' + (e.dif > 0 ? 'más' : 'menos') + ' que lo ocurrido en los últimos 30.'); }
      out.push({ k: 'vol', titulo: 'La volatilidad', ancla: 'volatilidad', partes: p });
    }

    if (H.des) {
      const d = H.des; const p = []; const nom = (s) => ({ t: s, ref: 'par', s });
      if (!d.lista.length) p.push({ t: 'Ninguno de los ' + d.n + ' activos', ref: 'desacoples' }, ' se ha desacoplado de bitcoin.');
      else { p.push({ t: d.lista.length + ' de ' + d.n + ' activos', ref: 'desacoples' }, d.lista.length === 1 ? ' se mueve estos 30 días menos pegado a bitcoin que los 30 anteriores: ' : ' se mueven estos 30 días menos pegados a bitcoin que los 30 anteriores: ', ...lista(d.lista.slice(0, d.lista.length > NOMBRES ? NOMBRES : d.lista.length).map((x) => nom(x.s)))); if (d.lista.length > NOMBRES) p.push(' y ' + (d.lista.length - NOMBRES) + ' más'); p.push('.'); }
      if (d.entran.length) p.push(d.entran.length === 1 ? ' Entra hoy en la lista ' : ' Entran hoy en la lista ', ...lista(d.entran.map(nom)), '.');
      if (d.salen.length) p.push(d.salen.length === 1 ? ' Sale de ella ' : ' Salen de ella ', ...lista(d.salen.map(nom)), '.');
      if (num(d.medianaHoy) && num(d.medianaAntes)) p.push(' La correlación mediana de la cesta con bitcoin es ', { t: c2(d.medianaHoy), ref: 'desacoples' }, ' (en los 30 días anteriores, ' + c2(d.medianaAntes) + ').');
      out.push({ k: 'des', titulo: 'Los desacoples', ancla: 'desacoples', partes: p });
    }
    return out;
  }

  const texto = (punto) => punto.partes.map((x) => (typeof x === 'string' ? x : x.t)).join('');
  const L = { hechos, frases, texto, tonoAmplitud, ladoLibros, REGLAS, MIN_CESTA, MIN_SECTOR, PAREJO, IGUAL_PUNTOS, UMBRAL_DES, NOMBRES };
  if (nodo) module.exports = L; else raiz.MLECTURA = L;
})(typeof window !== 'undefined' ? window : globalThis);
