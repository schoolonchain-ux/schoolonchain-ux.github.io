/* Libro mayor completo (direcciones y movimientos). Se descarga bajo demanda la primera vez que se abre una ficha. */
(function () {
  const Libro = (window.Libro = { listo: false, _p: null });
  let base = '';
  // columnas de movimiento: [tx, de, a, activo, cantidad, usd, t(seg), tipo, estado, nota]
  Libro.configurar = (b) => { base = b; };
  Libro.cargar = function () {
    if (Libro._p) return Libro._p;
    Libro._p = Promise.all([fetch(base + 'libro/cuentas.json').then((r) => r.json()), fetch(base + 'libro/movs.json').then((r) => r.json())]).then(([c, mv]) => {
      Libro.dir = c.dir; Libro.meta = c; Libro.movs = mv;
      Libro.idx = new Map(c.dir.map((d, i) => [d.toLowerCase(), i]));
      Libro.cta = new Map(c.cuentas.map((x) => [x[0], x]));
      // movimientos por dirección
      Libro.por = new Map();
      mv.forEach((r, i) => { (Libro.por.get(r[1]) || Libro.por.set(r[1], []).get(r[1])).push(i); if (r[2] !== r[1]) (Libro.por.get(r[2]) || Libro.por.set(r[2], []).get(r[2])).push(i); });
      Libro.listo = true; return Libro;
    });
    return Libro._p;
  };
  Libro.i = (d) => Libro.idx.get(String(d).toLowerCase());
  // datos de cuenta (si el libro la conoce)
  Libro.cuenta = function (d) {
    const i = Libro.i(d); if (i == null) return null; const c = Libro.cta.get(i);
    if (!c) return { i, dir: Libro.dir[i], clase: /^0x/i.test(Libro.dir[i]) ? 'ethereum' : 'desconocida', nombre: '' };
    return { i, dir: Libro.dir[i], clase: Libro.meta.clases[c[1]], nombre: c[2] || '', nivel: c[3], leida: c[4], pureza: c[5], neto: c[6], creada: c[7], ops: c[8], prim: c[9], ult: c[10], entra: c[11], sale: c[12], nEn: c[13], nSa: c[14], trx: c[15], usdt: c[16], congelada: c[17] };
  };
  Libro.nombre = (i) => { const c = Libro.cta.get(i); return c && c[2] ? c[2] : ''; };
  Libro.clase = (i) => { const c = Libro.cta.get(i); return c ? Libro.meta.clases[c[1]] : (/^0x/i.test(Libro.dir[i]) ? 'ethereum' : 'desconocida'); };
  // resumen de una dirección a partir de sus movimientos
  Libro.ficha = function (d) {
    const i = Libro.i(d); if (i == null) return null;
    const ids = Libro.por.get(i) || []; const ent = new Map(), sal = new Map();
    let entra = 0, sale = 0, nEn = 0, nSa = 0, primera = Infinity, ultima = 0; const horas = new Map();
    for (const k of ids) {
      const r = Libro.movs[k], usd = r[5] || 0; primera = Math.min(primera, r[6]); ultima = Math.max(ultima, r[6]);
      const h = Math.floor(r[6] / 3600) * 3600; const hh = horas.get(h) || { e: 0, s: 0 };
      if (r[1] === i && r[2] !== i) { sale += usd; nSa++; hh.s += usd; const x = sal.get(r[2]) || { i: r[2], usd: 0, n: 0, p: r[6], u: r[6] }; x.usd += usd; x.n++; x.p = Math.min(x.p, r[6]); x.u = Math.max(x.u, r[6]); sal.set(r[2], x); }
      else if (r[2] === i && r[1] !== i) { entra += usd; nEn++; hh.e += usd; const x = ent.get(r[1]) || { i: r[1], usd: 0, n: 0, p: r[6], u: r[6] }; x.usd += usd; x.n++; x.p = Math.min(x.p, r[6]); x.u = Math.max(x.u, r[6]); ent.set(r[1], x); }
      horas.set(h, hh);
    }
    return { i, dir: Libro.dir[i], ids, entra, sale, nEn, nSa, primera: isFinite(primera) ? primera : 0, ultima, remitentes: [...ent.values()].sort((a, b) => b.usd - a.usd), receptores: [...sal.values()].sort((a, b) => b.usd - a.usd), horas: [...horas.entries()].sort((a, b) => a[0] - b[0]) };
  };
  // vecinos principales (por volumen) para expandir el grafo
  Libro.vecinos = function (d, k = 12) {
    const f = Libro.ficha(d); if (!f) return [];
    const mapa = new Map();
    for (const x of f.remitentes) mapa.set(x.i, { i: x.i, usd: x.usd });
    for (const x of f.receptores) { const y = mapa.get(x.i) || { i: x.i, usd: 0 }; y.usd += x.usd; mapa.set(x.i, y); }
    return [...mapa.values()].sort((a, b) => b.usd - a.usd).slice(0, k);
  };
  // aristas agregadas entre un conjunto de índices
  Libro.aristas = function (setIdx) {
    const out = new Map();
    for (const i of setIdx) for (const k of Libro.por.get(i) || []) {
      const r = Libro.movs[k]; if (r[1] === r[2] || !setIdx.has(r[1]) || !setIdx.has(r[2])) continue;
      const key = r[1] + '>' + r[2]; const x = out.get(key) || { a: r[1], b: r[2], usd: 0, n: 0 }; x.usd += r[5] || 0; x.n++; out.set(key, x);
    }
    return [...out.values()];
  };
  Libro.buscar = function (q, max = 10) {
    q = q.trim().toLowerCase(); if (q.length < 3) return [];
    const res = [];
    for (let i = 0; i < Libro.dir.length; i++) {
      const d = Libro.dir[i]; const c = Libro.cta.get(i); const nom = c && c[2] ? c[2].toLowerCase() : '';
      if (d.toLowerCase().includes(q) || nom.includes(q)) res.push({ i, vol: c ? (c[11] || 0) + (c[12] || 0) : 0 });
    }
    return res.sort((a, b) => b.vol - a.vol).slice(0, max);
  };
})();
