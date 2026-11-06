'use strict';
// Lee la lista pública de artículos de Medium de School On-Chain (https://medium.com/feed/@SchoolOnChain) y la deja en un fichero
// para que la portada de la web los muestre rotando. Solo lectura, sin claves. Medium no deja leer esa lista desde el navegador
// del visitante (no envía cabeceras CORS), por eso la lee el publicador diario y la publica como data/medium.json.
// Uso: node medium.cjs <salida.json>
const fs = require('node:fs');
const CUENTA = '@SchoolOnChain';
const FEED = 'https://medium.com/feed/' + CUENTA;
const SALIDA = process.argv[2];
if (!SALIDA) { console.error('Uso: node medium.cjs <salida.json>'); process.exit(1); }

const ent = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&nbsp;/g, ' ');
const cdata = (s) => { const m = /<!\[CDATA\[([\s\S]*?)\]\]>/.exec(s || ''); return (m ? m[1] : ent(s || '')).trim(); };
const campo = (item, tag) => { const m = new RegExp(String.raw`<${tag}(?:\s[^>]*)?>([\s\S]*?)</${tag}>`, 'i').exec(item); return m ? cdata(m[1]) : ''; };
const sinRastreo = (u) => { try { const x = new URL(u); x.search = ''; return x.toString(); } catch { return u; } };
const texto = (html) => ent(html.replace(/<figure[\s\S]*?<\/figure>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

(async () => {
  let r, xml;
  for (let i = 1; i <= 3; i++) {
    try {
      r = await fetch(FEED, { headers: { 'user-agent': 'Mozilla/5.0 (School On-Chain web publisher)', accept: 'application/rss+xml, text/xml' }, signal: AbortSignal.timeout(20000) });
      xml = await r.text();
      if (r.ok && /<item>/i.test(xml)) break;
    } catch (e) { r = null; xml = ''; }
    await new Promise((f) => setTimeout(f, 2500 * i));
  }
  if (!r || !r.ok) { console.error('FEED_NO_DISPONIBLE', r ? r.status : 'sin respuesta'); process.exit(2); }
  const items = xml.split(/<item>/i).slice(1).map((s) => s.split(/<\/item>/i)[0]);
  const articulos = [];
  for (const it of items) {
    const titulo = campo(it, 'title'), url = sinRastreo(campo(it, 'link') || campo(it, 'guid')), fecha = campo(it, 'pubDate');
    const d = new Date(fecha);
    if (!titulo || !/^https:\/\/medium\.com\//.test(url) || isNaN(d)) continue;
    const cont = campo(it, 'content:encoded');
    const img = /<img[^>]+src="(https:\/\/cdn-images-1\.medium\.com\/[^"]+)"/i.exec(cont);
    const temas = [...it.matchAll(/<category>([\s\S]*?)<\/category>/gi)].map((m) => cdata(m[1])).filter(Boolean).slice(0, 6);
    const resumen = texto(cont).slice(0, 220);
    articulos.push({ titulo, url, fecha: d.toISOString(), imagen: img ? img[1].replace(/\/max\/\d+\//, '/max/800/') : null, temas, resumen });
  }
  articulos.sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));
  if (!articulos.length) { console.error('SIN_ARTICULOS'); process.exit(2); }
  const salida = { version: 1, leidoEn: new Date().toISOString(), cuenta: CUENTA, url: 'https://medium.com/' + CUENTA, fuente: FEED, nota: 'Lista pública de artículos de Medium, leída por el publicador diario (tools/equipoia/medium.cjs). Medium solo entrega los últimos 10.', articulos };
  fs.writeFileSync(SALIDA, JSON.stringify(salida, null, 1) + '\n');
  console.log('artículos:', articulos.length, '· último:', articulos[0].fecha.slice(0, 10), articulos[0].titulo.slice(0, 60));
})().catch((e) => { console.error('ERROR', e && e.message); process.exit(2); });
