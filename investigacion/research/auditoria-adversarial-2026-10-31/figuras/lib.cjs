'use strict';
// Mini-biblioteca para dibujar grafos en SVG con disposición manual (nodos con nombre, flechas con etiqueta) y pasarlos a PNG con Chrome sin cabeza.
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const { conTooltips } = require('./registro.cjs');
const FONT = "'Segoe UI', Arial, sans-serif";
const KIND = {   // relleno, borde, texto
  origen: ['#fff3c4', '#c9a100', '#4a3a00'], ladron: ['#fde2e0', '#d1453b', '#5c1410'], bloqueada: ['#e9e9ee', '#6b1d1d', '#2b2b33'], quieta: ['#dbeafe', '#2f6fd1', '#0e2a57'],
  reparto: ['#ffe8cc', '#e07b00', '#5a2f00'], paso: ['#f1f1f1', '#9a9a9a', '#333'], nodo: ['#ece3fb', '#7b4dc9', '#2a1555'], casa: ['#d9f5e0', '#2f9e55', '#0d3b1e'],
  puente: ['#d6f3f2', '#1d9a97', '#07403f'], contrato: ['#eeeeee', '#8a8a8a', '#333'], prestamo: ['#fff0f6', '#c2255c', '#5c0d2c'], eth: ['#e3e7ff', '#4c5fd1', '#161e57'],
  nota: ['#fffbe6', '#d9b800', '#4a3f00'], nuevo: ['#e6fcf5', '#0ca678', '#073d2e'], cifra: ['#ffffff', '#444', '#111']
};
const chipColor = t => /⇄|→/.test(t) ? '#343a40' : /^TRON/.test(t) ? '#c92a2a' : /^ETHEREUM/.test(t) ? '#4263eb' : /^ARBITRUM/.test(t) ? '#1098ad' : /^OTRAS/.test(t) ? '#7048e8' : '#495057';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tw = (s, fs, bold) => String(s).length * fs * (bold ? 0.6 : 0.54);

class Grafo {
  constructor(o) { this.w = o.w; this.h = o.h; this.titulo = o.titulo; this.sub = o.sub; this.nodes = {}; this.edges = []; this.regions = []; this.notes = []; this.legend = o.legend || null; this.cadenaDef = o.cadenaDef || null; this.cadenaImg = o.cadenaImg || null; this.pie = o.pie || null; }
  region(x, y, w, h, titulo, color = '#f6f7f9', borde = '#d5d8de') { this.regions.push({ x, y, w, h, titulo, color, borde }); return this; }
  node(id, o) {
    const fsT = o.fs || 15, fsL = o.fsl || 12.5, lines = o.lines || [], pad = 10;
    let w = o.w || Math.max(tw(o.title, fsT, true), o.badge ? tw(o.badge, fsL, true) + 14 : 0, ...lines.map(l => tw(typeof l === 'string' ? l : l.t, fsL, l.b))) + pad * 2 + 6;
    const h = o.h || pad * 2 + fsT + 4 + lines.length * (fsL + 5) + (o.badge ? fsL + 12 : 0);
    this.nodes[id] = { id, ...o, cadena: o.cadena !== undefined ? o.cadena : this.cadenaDef, w, h, lines, fsT, fsL, pad, cx: o.x + w / 2, cy: o.y + h / 2 };
    return this;
  }
  anchor(id, side, frac = 0.5) { const n = this.nodes[id]; if (!n) throw new Error('nodo desconocido ' + id); if (side === 'r') return { x: n.x + n.w, y: n.y + n.h * frac, d: [1, 0] }; if (side === 'l') return { x: n.x, y: n.y + n.h * frac, d: [-1, 0] }; if (side === 't') return { x: n.x + n.w * frac, y: n.y, d: [0, -1] }; return { x: n.x + n.w * frac, y: n.y + n.h, d: [0, 1] }; }
  // a, b: 'id' o 'id:lado:fracción'
  edge(a, b, o = {}) { this.edges.push({ a, b, ...o }); return this; }
  note(x, y, lines, o = {}) { this.notes.push({ x, y, lines, ...o }); return this; }
  parse(s, defSide) { const [id, side, fr] = s.split(':'); const [ds, dfr] = String(defSide).split(':'); return this.anchor(id, side || ds, fr !== undefined ? Number(fr) : (!side && dfr !== undefined ? Number(dfr) : 0.5)); }
  svg() {
    const out = []; const colors = new Set(); const defs = [];
    const edgeSvgs = [], labelSvgs = [];
    for (const e of this.edges) {
      const col = e.color || '#555'; colors.add(col);
      const A = this.parse(e.a, e.sa || 'r'), B = this.parse(e.b, e.sb || 'l');
      if (e.pts) { const P = [[A.x, A.y], ...e.pts, [B.x, B.y]]; const R = e.r ?? 16; let d = 'M' + P[0][0] + ',' + P[0][1]; const segs = []; let tot = 0; for (let i = 1; i < P.length; i++) { const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); segs.push(l); tot += l; } for (let i = 1; i < P.length - 1; i++) { const [px, py] = P[i - 1], [cx, cy] = P[i], [nx, ny] = P[i + 1]; const l1 = Math.hypot(cx - px, cy - py), l2 = Math.hypot(nx - cx, ny - cy), r = Math.min(R, l1 / 2, l2 / 2); const a = [cx - (cx - px) / l1 * r, cy - (cy - py) / l1 * r], b = [cx + (nx - cx) / l2 * r, cy + (ny - cy) / l2 * r]; d += ' L' + a[0] + ',' + a[1] + ' Q' + cx + ',' + cy + ' ' + b[0] + ',' + b[1]; } d += ' L' + P[P.length - 1][0] + ',' + P[P.length - 1][1]; const sw0 = e.w || 2, dash0 = e.dash ? ' stroke-dasharray="' + (e.dash === true ? '7 5' : e.dash) + '"' : ''; edgeSvgs.push('<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + sw0 + '"' + dash0 + ' marker-end="url(#m' + col.slice(1) + ')" opacity="0.9"/>'); if (e.label && e.label.length) { let want = (e.at ?? 0.5) * tot, px = P[0][0], py = P[0][1]; for (let i = 1; i < P.length; i++) { if (want <= segs[i - 1] || i === P.length - 1) { const f = Math.min(1, want / segs[i - 1]); px = P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f; py = P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f; break; } want -= segs[i - 1]; } const fsz = e.fs || 11.5, lh = fsz + 3.5, ls = e.label.map(l => typeof l === 'string' ? { t: l } : l), wd = Math.max(...ls.map(l => tw(l.t, fsz, l.b))) + 12, ht = ls.length * lh + 6; const lx = px + (e.dx || 0) - wd / 2, ly = py + (e.dy || 0) - ht / 2; labelSvgs.push('<g><rect x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" width="' + wd.toFixed(1) + '" height="' + ht + '" rx="5" fill="#fff" fill-opacity="0.95" stroke="' + col + '" stroke-opacity="0.45"/>' + ls.map((l, i) => '<text x="' + (lx + wd / 2).toFixed(1) + '" y="' + (ly + 3 + (i + 1) * lh - 4).toFixed(1) + '" font-size="' + fsz + '" text-anchor="middle" fill="' + (l.c || '#222') + '" ' + (l.b ? 'font-weight="700"' : '') + '>' + esc(l.t) + '</text>').join('') + '</g>'); } continue; }
      const dist = Math.hypot(B.x - A.x, B.y - A.y), k = Math.max(40, Math.min(dist * 0.5, e.k || 220));
      const c1 = { x: A.x + A.d[0] * k, y: A.y + A.d[1] * k }, c2 = { x: B.x + B.d[0] * k, y: B.y + B.d[1] * k };
      if (e.c1) { c1.x += e.c1[0]; c1.y += e.c1[1]; } if (e.c2) { c2.x += e.c2[0]; c2.y += e.c2[1]; }
      const sw = e.w || 2, dash = e.dash ? ` stroke-dasharray="${e.dash === true ? '7 5' : e.dash}"` : '';
      edgeSvgs.push(`<path d="M${A.x},${A.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${B.x},${B.y}" fill="none" stroke="${col}" stroke-width="${sw}"${dash} marker-end="url(#m${col.slice(1)})" opacity="0.9"/>`);
      if (e.label && e.label.length) {
        const t = e.at ?? 0.5, mt = 1 - t; const px = mt ** 3 * A.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t ** 3 * B.x, py = mt ** 3 * A.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t ** 3 * B.y;
        const fsz = e.fs || 11.5, lh = fsz + 3.5, ls = e.label.map(l => typeof l === 'string' ? { t: l } : l), wd = Math.max(...ls.map(l => tw(l.t, fsz, l.b))) + 12, ht = ls.length * lh + 6;
        const lx = px + (e.dx || 0) - wd / 2, ly = py + (e.dy || 0) - ht / 2;
        labelSvgs.push(`<g><rect x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" width="${wd.toFixed(1)}" height="${ht}" rx="5" fill="#fff" fill-opacity="0.93" stroke="${col}" stroke-opacity="0.45"/>` + ls.map((l, i) => `<text x="${(lx + wd / 2).toFixed(1)}" y="${(ly + 3 + (i + 1) * lh - 4).toFixed(1)}" font-size="${fsz}" text-anchor="middle" fill="${l.c || '#222'}" ${l.b ? 'font-weight="700"' : ''}>${esc(l.t)}</text>`).join('') + '</g>');
      }
    }
    for (const c of colors) defs.push(`<marker id="m${c.slice(1)}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="13" markerHeight="13" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`);
    out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${this.w}" height="${this.h}" viewBox="0 0 ${this.w} ${this.h}" font-family="${FONT}"><defs>${defs.join('')}</defs><rect width="100%" height="100%" fill="#ffffff"/>`);
    out.push(`<text x="30" y="40" font-size="26" font-weight="700" fill="#111">${esc(this.titulo)}</text>`); if (this.pagina) out.push('<text x="' + (this.w - 30) + '" y="52" font-size="44" font-weight="800" fill="#c2255c" text-anchor="end">' + esc(this.pagina) + '</text>'); if (this.cadenaImg) { const ct = 'CADENA: ' + this.cadenaImg, cw = tw(ct, 17, true) + 30, pw = this.pagina ? tw(this.pagina, 44, true) + 24 : 0; out.push('<rect x="' + (this.w - 30 - cw - pw) + '" y="22" width="' + cw + '" height="30" rx="15" fill="' + chipColor(this.cadenaImg) + '"/><text x="' + (this.w - 30 - pw - cw / 2) + '" y="43" font-size="17" font-weight="700" fill="#fff" text-anchor="middle">' + esc(ct) + '</text>'); } if (this.sub) out.push(`<text x="30" y="64" font-size="14" fill="#555">${esc(this.sub)}</text>`);
    for (const r of this.regions) { out.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="12" fill="${r.color}" stroke="${r.borde}"/>`); if (r.titulo) out.push(`<text x="${r.x + 14}" y="${r.y + 22}" font-size="13" font-weight="700" fill="#555" letter-spacing="0.6">${esc(r.titulo.toUpperCase())}</text>`); }
    out.push(...edgeSvgs);
    for (const n of Object.values(this.nodes)) {
      const [f, b, t] = KIND[n.kind || 'paso']; const dash = n.dash ? ' stroke-dasharray="6 4"' : '';
      out.push(`<g><rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10" fill="${f}" stroke="${b}" stroke-width="${n.bw || 2}"${dash}/>`);
      let y = n.y + n.pad + n.fsT; out.push(`<text x="${n.x + n.pad + 3}" y="${y}" font-size="${n.fsT}" font-weight="700" fill="${t}">${esc(n.title)}</text>`);
      for (const l of n.lines) { y += n.fsL + 5; const o = typeof l === 'string' ? { t: l } : l; out.push(`<text x="${n.x + n.pad + 3}" y="${y}" font-size="${n.fsL}" fill="${o.c || t}" ${o.b ? 'font-weight="700"' : ''}>${esc(o.t)}</text>`); }
      if (n.badge) { const bw = tw(n.badge, n.fsL, true) + 14, by = n.y + n.h - n.fsL - 14; out.push(`<rect x="${n.x + n.pad - 2}" y="${by}" width="${bw}" height="${n.fsL + 8}" rx="6" fill="${n.badgeBg || '#6b1d1d'}"/><text x="${n.x + n.pad + 5}" y="${by + n.fsL + 1}" font-size="${n.fsL}" font-weight="700" fill="#fff">${esc(n.badge)}</text>`); }
      if (n.cadena) { const ct = n.cadena, cw = tw(ct, 10.5, true) + 14, cx = n.x + n.w - cw - 8, cy = n.y - 9; out.push('<rect x="' + cx + '" y="' + cy + '" width="' + cw + '" height="19" rx="9.5" fill="' + chipColor(ct) + '"/><text x="' + (cx + cw / 2) + '" y="' + (cy + 13.5) + '" font-size="10.5" font-weight="700" fill="#fff" text-anchor="middle">' + esc(ct) + '</text>'); }
      out.push('</g>');
    }
    out.push(...labelSvgs);
    for (const nt of this.notes) { const fsz = nt.fs || 12.5, lh = fsz + 5, ls = nt.lines.map(l => typeof l === 'string' ? { t: l } : l), wd = nt.w || Math.max(...ls.map(l => tw(l.t, fsz, l.b))) + 22, ht = ls.length * lh + 16; const [f, b, t] = KIND[nt.kind || 'nota']; out.push(`<g><rect x="${nt.x}" y="${nt.y}" width="${wd}" height="${ht}" rx="8" fill="${f}" stroke="${b}"/>` + ls.map((l, i) => `<text x="${nt.x + 11}" y="${nt.y + 13 + (i + 1) * lh - 5}" font-size="${fsz}" fill="${l.c || t}" ${l.b ? 'font-weight="700"' : ''}>${esc(l.t)}</text>`).join('') + '</g>'); }
    if (this.legend) { let x = 30; const y = this.h - 38; for (const [k, txt] of this.legend) { const [f, b] = KIND[k]; out.push(`<rect x="${x}" y="${y}" width="16" height="16" rx="4" fill="${f}" stroke="${b}" stroke-width="2"/><text x="${x + 22}" y="${y + 13}" font-size="12.5" fill="#333">${esc(txt)}</text>`); x += 22 + tw(txt, 12.5) + 26; } }
    if (this.pie) out.push(`<text x="${this.w - 30}" y="${this.h - 14}" font-size="11.5" fill="#777" text-anchor="end">${esc(this.pie)}</text>`);
    out.push('</svg>'); return conTooltips(out.join('\n'));
  }
  guardar(dir, nombre, escala = 1.6) {
    fs.mkdirSync(dir, { recursive: true }); const svgP = path.join(dir, nombre + '.svg'), pngP = path.join(dir, nombre + '.png'); fs.writeFileSync(svgP, this.svg());
    const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
    const r = spawnSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-sandbox', `--screenshot=${pngP}`, `--window-size=${this.w},${this.h}`, `--force-device-scale-factor=${escala}`, 'file:///' + svgP.replace(/\\/g, '/')], { encoding: 'utf8', timeout: 60000 });
    return { svgP, pngP, ok: fs.existsSync(pngP), err: r.stderr && r.stderr.slice(0, 200) };
  }
}
module.exports = { Grafo };
