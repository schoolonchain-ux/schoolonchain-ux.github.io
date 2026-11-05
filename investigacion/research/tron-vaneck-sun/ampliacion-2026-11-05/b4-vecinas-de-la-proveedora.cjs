'use strict';
// LÍNEA B · B4 — Las contrapartes grandes de la proveedora (las 20 mayores por USDT + las de los últimos días): ¿quiénes son? etiqueta de TronScan, antigüedad, número de operaciones,
// y, como MUESTRA DECLARADA (sus últimos 200 envíos de USDT), a quién mandan después y si ahí hay billeteras de Binance conocidas o con etiqueta Binance. SOLO LECTURA.
// Es una muestra, no el historial completo de cada vecina: el resultado lo dice. Reproducible: REPRODUCIR=1 node b4-vecinas-de-la-proveedora.cjs
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); L.usar('b4-2026-11-05');
const D = path.join(__dirname, 'b-proveedora'); const TG = 'https://api.trongrid.io', TS = 'https://apilist.tronscanapi.com/api'; const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; const M = x => Math.round(x * 100) / 100; const iso = ms => new Date(ms).toISOString().replace('.000Z', 'Z');
const A = JSON.parse(fs.readFileSync(path.join(D, 'analisis-proveedora.json'), 'utf8')); const PROV = 'TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2';
const BIN = new Set(); for (const x of Object.values(JSON.parse(fs.readFileSync(path.join(__dirname, 'a2-a4-a5', 'receptores-81.json'), 'utf8')))) if (/Binance/i.test(x.etiqueta || '')) BIN.add(x.receptor); for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'vigilante-energia-binance', 'config', 'conocidas.json'), 'utf8')).nombres)) if (/^Binance/i.test(typeof v === 'string' ? v : JSON.stringify(v))) BIN.add(k);
const EXTRA = ['TVpNiLp3HhhDJHc7eBsqXeZFvqWdPfzCEt', 'TKVnVyJiTzyCDgTkZRYc5LM4q8B7xXEbh5', 'TWPpxPd5PpU5FQk6F6F3HMN5VdufxnVA8K', 'TFvgoqKbv4fu2RBp7215AR2eDupMhCdxkH', 'TCFfQYygyfTTYE8So6wQbpNk7BEMomJH9J', 'TKV6xqB7VPTThF3Ru8VrNh7QQLVReTNvuV'];
const cuentas = [...new Set([...A.mayores_por_USDT.map(o => o.cuenta), ...EXTRA])].filter(a => a !== PROV);
const info = async a => { const t = await L.get(TS + '/accountv2?address=' + a).catch(() => ({})); return { etiqueta: t.publicTag || t.addressTag || null, creada: t.date_created ? iso(t.date_created) : null, operaciones_tronscan: t.totalTransactionCount != null ? t.totalTransactionCount : (t.transactions || null), es_contrato: !!(t.accountType && t.accountType === 2) }; };
for (const a of JSON.parse(fs.readFileSync(path.join(__dirname, 'a0-binance', 'lista-binance.json'), 'utf8')).direcciones) BIN.add(a); /* lista ampliada (A0) */
(async () => {
  const salida = []; const etDest = {}; const infoDest = {};
  for (const a of cuentas) {
    const f = A.mayores_por_USDT.find(o => o.cuenta === a) || {}; const inf = await info(a);
    const j = await L.get(TG + '/v1/accounts/' + a + '/transactions/trc20?limit=200&only_confirmed=true&only_from=true&contract_address=' + USDT).catch(() => ({ data: [] }));
    const todos = (j.data || []).map(t => ({ t: t.block_timestamp, a: t.to, v: Number(t.value) / 1e6, tx: t.transaction_id })); const raros = todos.filter(e => e.v > 1e12); const env = todos.filter(e => e.v <= 1e12); const por = {}; for (const e of env) { const o = por[e.a] = por[e.a] || { n: 0, usdt: 0 }; o.n++; o.usdt += e.v; }
    const top = Object.entries(por).sort((x, y) => y[1].usdt - x[1].usdt).slice(0, 5); const destinos = [];
    for (const [d, o] of top) { if (!(d in etDest)) { const id = await info(d); etDest[d] = BIN.has(d) ? 'Binance (lista conocida)' : id.etiqueta; infoDest[d] = id; } destinos.push({ cuenta: d, etiqueta: etDest[d], creada: infoDest[d] ? infoDest[d].creada : null, operaciones_tronscan: infoDest[d] ? infoDest[d].operaciones_tronscan : null, n: o.n, usdt: M(o.usdt), a_proveedora: d === PROV }); }
    const hacia_bin = env.filter(e => BIN.has(e.a)).reduce((s, e) => s + e.v, 0);
    salida.push({ cuenta: a, ...inf, con_la_proveedora: { usdt_que_la_proveedora_le_manda: f.USDT_out != null ? M(f.USDT_out) : null, usdt_que_la_proveedora_recibe_de_ella: f.USDT_in != null ? M(f.USDT_in) : null }, muestra_ultimos_envios: { eventos_con_valor_absurdo_no_contados: raros.map(e => ({ tx: e.tx, a: e.a, t: iso(e.t) })), n: env.length, desde: env.length ? iso(Math.min(...env.map(e => e.t))) : null, hasta: env.length ? iso(Math.max(...env.map(e => e.t))) : null, usdt: M(env.reduce((s, e) => s + e.v, 0)), hacia_binance_conocidas: M(hacia_bin), mayores_destinos: destinos } });
    console.log(a.slice(0, 10), (inf.etiqueta || '-').padEnd(14), 'creada', (inf.creada || '?').slice(0, 10), 'ops', inf.operaciones_tronscan, '| muestra', env.length, 'env', M(env.reduce((s, e) => s + e.v, 0) / 1e6) + ' M', '| absurdos', raros.length, '| →Binance', M(hacia_bin), '| destinos:', destinos.map(d => d.cuenta.slice(0, 6) + (d.etiqueta ? '(' + d.etiqueta + ')' : '') + (d.a_proveedora ? '(PROV)' : '') + ' ' + M(d.usdt / 1e6) + 'M').join(', '));
  }
  const h = L.guardar(path.join(D, 'vecinas-proveedora.json'), { nota: 'La muestra son los últimos 200 envíos de USDT de cada vecina (límite de una página de TronGrid), no su historial completo.', cuentas: salida }); console.log(h, 'llamadas', L.metricas.llamadas, 'red', L.metricas.red);
})().catch(e => { console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });
