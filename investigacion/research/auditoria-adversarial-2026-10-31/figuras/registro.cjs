'use strict';
// Registro de hashes y direcciones completas conocidos (a partir de los datos guardados y de los informes) para poner el texto completo en los grafos y en los tooltips.
const fs = require('fs'), path = require('path');
const RUTAS = ['C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/', 'C:/EquipoIA/research/binance-0x5227-2026-10-30/raw/', 'C:/EquipoIA/docs/'];
const CACHE = path.join(__dirname, 'registro.json');
let R = null;
function cargar() {
  if (R) return R;
  if (fs.existsSync(CACHE)) { R = JSON.parse(fs.readFileSync(CACHE, 'utf8')); return R; }
  const h = new Set(), t = new Set(), e = new Set();
  for (const d of RUTAS) { for (const f of fs.readdirSync(d)) { if (!/\.(json|csv|md|jsonl)$/.test(f)) continue; let s; try { s = fs.readFileSync(d + f, 'utf8'); } catch { continue; } for (const m of s.match(/\b0?x?[0-9a-fA-F]{64}\b/g) || []) h.add(m.replace(/^0x/, '').toLowerCase()); for (const m of s.match(/\bT[1-9A-HJ-NP-Za-km-z]{33}\b/g) || []) t.add(m); for (const m of s.match(/0x[0-9a-fA-F]{40}\b/g) || []) e.add(m.toLowerCase()); } }
  R = { hashes: [...h], tron: [...t], evm: [...e] }; fs.writeFileSync(CACHE, JSON.stringify(R)); return R;
}
const A = (p, cadena) => { const r = cargar(); const lista = (cadena === 'evm' || /^0x/i.test(p)) ? r.evm.filter(a => a.startsWith(p.toLowerCase())) : r.tron.filter(a => a.startsWith(p)); return lista; };
const unica = (p) => { const l = A(p); return l.length === 1 ? l[0] : (l.length ? l[0] : p + '…'); };
const HH = p => { const r = cargar(); const l = r.hashes.filter(x => x.startsWith(p.toLowerCase().replace(/^0x/, ''))); return l; };
// añade <title> con el texto completo a los <text> que contienen abreviaturas
function conTooltips(svg) {
  const r = cargar();
  return svg.replace(/<text([^>]*)>([^<]*…[^<]*)<\/text>/g, (m, attrs, txt) => {
    const t = txt.replace(/&amp;/g, '&'); const completos = new Set();
    for (const x of t.matchAll(/(?<![0-9a-zA-Z])(0x)?([0-9a-f]{8})…/g)) { const pre = x[2]; if (x[1]) { for (const a of r.evm.filter(a => a.startsWith('0x' + pre)).slice(0, 2)) completos.add(a); for (const h of r.hashes.filter(h => h.startsWith(pre)).slice(0, 2)) completos.add('0x' + h); } else { for (const h of r.hashes.filter(h => h.startsWith(pre)).slice(0, 2)) completos.add(h); } }
    for (const x of t.matchAll(/(?<![0-9a-zA-Z])(0x[0-9a-f]{4,10})…/g)) for (const a of r.evm.filter(a => a.startsWith(x[1])).slice(0, 2)) completos.add(a);
    for (const x of t.matchAll(/(?<![0-9a-zA-Z])(T[1-9A-HJ-NP-Za-km-z]{5,9})…/g)) for (const a of r.tron.filter(a => a.startsWith(x[1])).slice(0, 2)) completos.add(a);
    if (!completos.size) return m;
    return '<text' + attrs + '>' + txt + '<title>' + [...completos].join('\n') + '</title></text>';
  });
}
module.exports = { A, unica, HH, conTooltips, cargar };
