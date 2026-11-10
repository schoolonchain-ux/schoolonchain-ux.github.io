/* Página «Datos y método»: rellena con datos vivos el número de redes y de incidentes y el estado (hora de lectura) de cada fichero diario. Si algo no se puede leer, esa fila lo dice. */
(function () {
  const { el, n } = C;
  const fh = (t) => new Date(t).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const cuando = (h) => (h < 1 ? 'hace menos de 1 hora' : h < 48 ? 'hace ' + n(Math.round(h)) + ' horas' : 'hace ' + n(Math.round(h / 24)) + ' días');
  const traer = (u) => fetch(u + '?v=' + Math.floor(Date.now() / 600000), { signal: AbortSignal.timeout(15000) }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  const DIARIOS = [
    { r: 'data/usdt0.json', t: 'USDT0 (circulación, respaldo, bloqueos y mensajes)' },
    { r: 'data/reparto-trx.json', t: 'Reparto del TRX entre cuentas' },
    { r: 'data/quema-trx.json', t: 'Quema y emisión de TRX', extra: (D) => ' · serie hasta el ' + D.hasta },
    { r: 'data/desbloqueos-trx.json', t: 'Descongelaciones de TRX' },
    { r: 'data/fundamentales-indice.json', t: 'Índice del Laboratorio de fundamentales (token → cadena y protocolos, cobertura, cambios de método)', extra: (D) => (D.comprobaciones ? ' · ' + D.comprobaciones.tokens + ' tokens, ' + D.comprobaciones.cadenas + ' cadenas' + (D.cambios && D.cambios.length ? ', ' + D.cambios.length + ' cambios de método o cobertura anotados' : '') : '') },
    { r: 'data/mercado.json', t: 'Observatorio de mercado (cierres, capital, sectores, liquidez y volatilidad esperada)', extra: (D) => (Array.isArray(D.activos) && Array.isArray(D.dias) ? ' · ' + D.activos.length + ' activos, cierres hasta el ' + D.dias[D.dias.length - 1] : '') },
    { r: 'data/medium.json', t: 'Artículos de Medium' },
    { r: 'reports/caso-vaneck-sun/seguimiento.json', t: 'Seguimiento del caso Vaneck / Sun' },
  ];
  document.addEventListener('DOMContentLoaded', async () => {
    traer('data/redes-usdt.json').then((D) => { const x = document.getElementById('dm-redes'); if (x && Array.isArray(D.redes)) x.textContent = n(D.redes.length) + ' redes'; }).catch(() => {});
    traer('data/incidentes-defi.json').then((D) => { const x = document.getElementById('dm-incidentes'); if (x && D.n) x.textContent = n(D.n) + ' incidentes, revisada el ' + String(D.revisadoEn).split('-').reverse().join('/'); }).catch(() => {});
    const cont = document.getElementById('estado-datos'); if (!cont) return;
    const filas = await Promise.all(DIARIOS.map(async (d) => {
      try {
        const D = await traer(d.r); const iso = D.leidoEn || D.listaDe; if (!iso || isNaN(Date.parse(iso))) throw new Error('sin fecha');
        const h = (Date.now() - Date.parse(iso)) / 3600000;
        return el('div', { class: 'dm-row' }, el('b', null, el('span', { class: 'dm-punto' + (h > 48 ? ' warn' : '') }), d.t), el('span', null, 'Lectura del ' + fh(Date.parse(iso)) + ' (' + cuando(h) + ')' + (d.extra ? d.extra(D) : '') + (h > 48 ? ' · anticuada' : '')));
      } catch (e) {
        return el('div', { class: 'dm-row' }, el('b', null, el('span', { class: 'dm-punto bad' }), d.t), el('span', null, 'No se pudo leer ahora (' + String(e.message).slice(0, 40) + ')'));
      }
    }));
    cont.replaceChildren(...filas);
  });
})();
