/* Zona 3 · pestaña «Prueba de estrés»: con las mismas posiciones que el riesgo diario (el cuadro «Tus posiciones» de arriba) enseña
   cuánto habría perdido esa cartera en los peores días del último año, qué pasa si todo cae de golpe y cuál fue el peor día de cada moneda.
   Usa el mismo histórico de precios diarios de DefiLlama que el riesgo diario (window.MERCADO, de assets/mercado.js). Solo aritmética sobre datos reales; sin IA y sin guardar nada. */
(function () {
  const { el, n } = C;
  const form = document.getElementById('estres-form'), rows = document.getElementById('positions');
  if (!form || !rows) return;
  const res = document.getElementById('estres-result'), err = document.getElementById('estres-error'), boton = form.querySelector('button[type=submit]');
  const usd = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const pct = (x, d = 1) => (x >= 0 ? '+' : '−') + n(Math.abs(x) * 100, d) + ' %';
  const dia = (d) => d.split('-').reverse().join('/');
  let revision = 0;

  const limpiar = () => { revision++; res.replaceChildren(); err.hidden = true; };
  rows.addEventListener('input', limpiar); rows.addEventListener('change', limpiar);
  document.getElementById('add-position').addEventListener('click', limpiar);
  rows.addEventListener('click', (e) => { if (e.target.closest('button')) limpiar(); });
  const fallo = (msg, campo) => { err.textContent = msg; err.hidden = false; if (campo) campo.focus(); };

  // lee las posiciones del cuadro compartido con las mismas reglas que el riesgo diario
  function leerPosiciones() {
    const valores = new Map();
    for (const [i, fila] of [...rows.children].entries()) {
      const sel = fila.querySelector('select'), inp = fila.querySelector('input'), escrito = inp.value.trim(), v = Number(escrito.replace(',', '.'));
      if (!/^\d+(?:[.,]\d{1,2})?$/.test(escrito) || !Number.isFinite(v) || v <= 0 || v > 1e12) { fallo('Escribe un importe positivo en USD en la posición ' + (i + 1) + ', sin separador de miles. Por ejemplo, 5000 o 5000,50.', inp); return null; }
      if (valores.has(sel.value)) { fallo(sel.value + ' aparece dos veces. Suma ambas posiciones en una sola fila.', sel); return null; }
      valores.set(sel.value, v);
    }
    return [...valores];
  }

  function pintar(posiciones, muestra) {
    const total = posiciones.reduce((s, [, v]) => s + v, 0);
    const dias = muestra.map((d) => ({ dia: d.day, d, pnl: posiciones.reduce((s, [a, v]) => s + d[a] * v, 0) }));
    const peores = [...dias].sort((a, b) => a.pnl - b.pnl).slice(0, 5);
    const malos5 = dias.filter((x) => x.pnl < -0.05 * total).length, malos10 = dias.filter((x) => x.pnl < -0.10 * total).length;
    const kp = (l, v, s) => el('div', { class: 'kpi' }, el('div', { class: 'kl' }, l), el('div', { class: 'kv' }, v), el('div', { class: 'kn' }, s));
    const caja = (titulo, ...k) => el('div', { class: 'card', style: 'margin:12px 0' }, el('h3', null, titulo), ...k);
    const tabla = (cfg) => UI.tabla({ pp: 8, buscar: false, ...cfg });
    const peor = peores[0];

    const out = el('div');
    out.append(el('div', { class: 'res-head' }, el('div', { class: 'big' }, 'Tu peor día del último año habría sido ' + usd.format(peor.pnl) + ' (' + pct(peor.pnl / total) + ')'), el('div', { class: 'sub2' }, 'El ' + dia(peor.dia) + ', con una cartera de ' + usd.format(total) + ' repartida como la de arriba.')));
    out.append(el('div', { class: 'kpis2' },
      kp('Tu cartera hoy', usd.format(total), n(posiciones.length) + (posiciones.length === 1 ? ' moneda' : ' monedas')),
      kp('Días con pérdida de más del 5 %', n(malos5), 'de ' + n(dias.length) + ' días del último año'),
      kp('Días con pérdida de más del 10 %', n(malos10), 'de ' + n(dias.length) + ' días del último año'),
      kp('Si todo cae un 30 %', usd.format(-0.3 * total), 'te quedarían ' + usd.format(0.7 * total))));

    out.append(caja('Los 5 peores días del último año para tu cartera', el('div', { class: 'cs' }, 'Se aplican los importes de hoy a lo que se movió cada moneda ese día.'),
      tabla({ rows: peores.map((x) => ({ ...x })), cols: [
        { t: 'Día (UTC)', v: (r) => dia(r.dia), o: (r) => r.dia }, { t: 'Pérdida', v: (r) => usd.format(r.pnl), o: (r) => r.pnl }, { t: '% de tu cartera', v: (r) => pct(r.pnl / total), o: (r) => r.pnl },
        { t: 'Qué se movió ese día', v: (r) => posiciones.map(([a]) => a + ' ' + pct(r.d[a])).join(' · '), o: (r) => r.dia }] })));

    const golpes = [0.1, 0.2, 0.3, 0.5].map((s) => ({ s, perdida: -s * total, queda: (1 - s) * total }));
    out.append(caja('Si todo cae de golpe', el('div', { class: 'cs' }, 'Ejemplos, no previsiones: todas las monedas bajan lo mismo a la vez.'),
      tabla({ rows: golpes, cols: [{ t: 'Caída', v: (r) => '−' + n(r.s * 100) + ' %', o: (r) => r.s }, { t: 'Pierdes', v: (r) => usd.format(r.perdida), o: (r) => r.perdida }, { t: 'Te quedan', v: (r) => usd.format(r.queda), o: (r) => r.queda }] })));

    const porMoneda = posiciones.map(([a, v]) => { const m = dias.reduce((p, x) => (x.d[a] < p.r ? { r: x.d[a], dia: x.dia } : p), { r: Infinity, dia: null }); return { a, v, r: m.r, dia: m.dia, perdida: m.r * v }; });
    const suma = porMoneda.reduce((s, x) => s + x.perdida, 0);
    out.append(caja('El peor día de cada moneda', el('div', { class: 'cs' }, 'La mayor caída diaria de cada una en el último año y lo que habría perdido tu posición en ella ese día.'),
      tabla({ rows: porMoneda, orden: [3, 1], cols: [{ t: 'Moneda', v: (r) => r.a, o: (r) => r.a }, { t: 'Tu posición', v: (r) => usd.format(r.v), o: (r) => r.v }, { t: 'Peor día', v: (r) => dia(r.dia) + ' · ' + pct(r.r), o: (r) => r.dia }, { t: 'Habrías perdido', v: (r) => usd.format(r.perdida), o: (r) => r.perdida }] }),
      posiciones.length > 1 ? el('p', { class: 'hint', style: 'margin:8px 0 0' }, 'Si el peor día de cada moneda hubiera sido el mismo día (no ha ocurrido así) la pérdida sería ' + usd.format(suma) + ' (' + pct(suma / total) + '). Sirve solo para ver el techo teórico.') : null));

    out.append(el('p', { class: 'hint' }, 'Fuente: DefiLlama · ' + dia(muestra[0].day) + '–' + dia(muestra[muestra.length - 1].day) + ' (UTC) · ' + n(muestra.length) + ' días con precio de todas tus monedas. Es el pasado aplicado a lo que tienes hoy: un día futuro puede ser peor que cualquiera de estos. No es una previsión ni un consejo de inversión.'));
    res.replaceChildren(out);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); limpiar();
    if (!window.MERCADO) { fallo('La prueba de estrés no está disponible ahora (falta cargar el histórico). Recarga la página.'); return; }
    const posiciones = leerPosiciones(); if (!posiciones) return;
    const version = revision; boton.disabled = true; boton.textContent = 'Cargando histórico…';
    let muestra;
    try { muestra = await window.MERCADO.historicalSample(posiciones.map(([a]) => a)); }
    catch { if (version === revision) fallo('No se pudo leer el histórico de las monedas elegidas. Vuelve a intentarlo.', rows.querySelector('select')); return; }
    finally { boton.disabled = false; boton.textContent = 'Hacer la prueba de estrés'; }
    if (version !== revision) return;
    if (muestra.length < 120) { fallo('Hacen falta al menos 120 días con precio de todas las monedas elegidas para esta prueba.', rows.querySelector('select')); return; }
    pintar(posiciones, muestra);
  });
})();
