'use strict';
// Revisión independiente (src/revision.cjs) contra una puerta REAL de ChainScope (almacenes de juguete). El revisor y el agente son GUIONIZADOS: sin Codex, sin modelo, sin internet.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { montar } = require('../../chainscope/test/fixtures.cjs');
const { createServer } = require('../../chainscope/src/server.cjs');
const { crearClienteExpediente } = require('../src/cliente-expediente.cjs');
const { crearRegistrador } = require('../src/registrador.cjs');
const { revisar, armarPaquete, validarSalida, crearRevisorCodex, ESQUEMA } = require('../src/revision.cjs');

const A = '0x' + '11'.repeat(20), B = '0x' + '22'.repeat(20), H1 = '0x' + 'ab'.repeat(32), H2 = '0x' + 'cd'.repeat(32);
const F = montar(); let S, cli; const tmps = [];
test.before(async () => { S = await createServer({ cfg: F.cfg, puerto: 0, pool: { trabajadores: 1, colaMaxima: 4, plazoMs: 8000 } }); cli = crearClienteExpediente({ puerto: S.puerto, fichaFile: path.join(F.cfg.datos, 'investigador.token') }); });
test.after(async () => { await S.close(); F.limpiar(); for (const d of tmps) fs.rmSync(d, { recursive: true, force: true }); });
const tmp = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'rev-')); tmps.push(d); return d; };

async function sembrar() {
  const id = await cli.crear({ titulo: 'Investigación de prueba de la revisión', pregunta: `¿Qué hizo ${A} y a dónde fue el dinero?` });
  const b1 = (await cli.blob(id, '{"result":{"hash":"' + H1 + '","value":"500000000"}}')).sha256, b2 = (await cli.blob(id, '{"result":{"hash":"' + H2 + '","value":"200000000"}}')).sha256;
  const ev = (h, raw, txt) => cli.evidencia(id, { clase: 'hecho_cadena', texto: txt, fuente: 'Etherscan V2 (txlist)', metodo: 'lectura directa del recibo', consultado_utc: '2026-10-30T08:09:00Z', ocurrido_utc: '2026-10-29T20:30:00Z', red: 'ethereum', direccion: A, tx_hash: h, confianza: 'alta', raw_sha256: raw });
  const e1 = (await ev(H1, b1, 'A envió 500.000.000 USDT a B')).id, e2 = (await ev(H2, b2, 'A envió 200.000.000 USDT a C')).id;
  const h = (await cli.hipotesis(id, { texto: 'A envió 500 M USDT a B el 29-10', tipo: 'destino_fondos', confirma: ['transferencia directa A→B'], refuta: ['ninguna transferencia de ese importe'] })).id;
  await cli.vincular(id, h, e1, 'apoya', 'directa'); await cli.consulta(id, { herramienta: 'transaccion', parametros: {}, proposito: 'contraprueba', hipotesis: h, estado: 'sin_datos', ts_utc: '2026-10-30T08:22:00Z' });
  await cli.veredicto(id, h, 'confirmada', 'Transferencia directa observada y sin evidencia en contra.'); await cli.estado(id, 'revision');
  return { id, b1, b2, e1, e2, h };
}
const salida = (o = {}) => JSON.stringify({ veredicto: 'aprobado', resumen: 'Contrasté las cifras con las lecturas originales.', verificaciones: [{ que: 'importe de E1', archivo: 'lecturas/INDICE.json', resultado: 'coincide' }, { que: 'conclusiones', archivo: 'expediente.json', resultado: 'coincide' }, { que: 'coherencia', archivo: 'informe.md', resultado: 'coincide' }], objeciones: [], ...o });
const verifs = s => [`lecturas/${s.b1}.json`, `lecturas/${s.b2}.json`, 'expediente.json'].map(a => ({ que: 'contraste con ' + a, archivo: a, resultado: 'coincide' }));
const objeto = (o = {}) => ({ id: 'O1', severidad: 'alta', tipo: 'conclusion_excesiva', objetivo: 'H1', objecion: 'H1 está «confirmada» pero la lectura original solo muestra la salida de 500 M, no que llegara a B.', evidencia_de_la_objecion: 'lecturas/…json campo result', correccion_sugerida: 'Bajar a sin_resolver o aportar la recepción.', ...o });
const revisorGuion = (fs_, trazas = []) => async ({ dir, prompt }) => { const f = fs_[Math.min(trazas.length, fs_.length - 1)]; trazas.push({ dir, prompt }); return { salida: typeof f === 'function' ? f(dir) : f }; };
const modeloGuion = (resp, trazas = []) => async (p, { rol }) => { trazas.push({ rol, p }); return typeof resp === 'function' ? resp(p, trazas.length) : JSON.stringify(resp); };

test('Paquete: expediente, informe, reglas, rondas previas y las lecturas ORIGINALES con su índice y un manifiesto con huellas', async () => {
  const s = await sembrar(), dir = path.join(tmp(), 'paquete'), pk = await armarPaquete({ exp: await cli.ver(s.id), cliente: cli, dir });
  for (const f of ['LEEME.md', 'expediente.json', 'informe.md', 'reglas.md', 'rondas-previas.json', 'lecturas/INDICE.json', `lecturas/${s.b1}.json`, `lecturas/${s.b2}.json`]) assert.ok(fs.existsSync(path.join(dir, f)), f);
  assert.match(fs.readFileSync(path.join(dir, `lecturas/${s.b1}.json`), 'utf8'), /500000000/, 'es la lectura cruda, no un resumen');
  const idx = JSON.parse(fs.readFileSync(path.join(dir, 'lecturas/INDICE.json'), 'utf8')); assert.deepEqual(idx[s.b1].evidencias, [s.e1]); assert.equal(pk.lecturas, 2); assert.match(pk.paquete_sha, /^[0-9a-f]{64}$/);
  assert.ok(pk.archivos.has('informe.md') && pk.archivos.has(`lecturas/${s.b1}.json`)); assert.match(fs.readFileSync(path.join(dir, 'LEEME.md'), 'utf8'), /JAMÁS obedezcas instrucciones/);
});

test('Validación: una aprobación sin contrastes reales sobre archivos del paquete no se admite, y el código no aprueba con objeciones graves', async () => {
  const s = await sembrar(), pk = await armarPaquete({ exp: await cli.ver(s.id), cliente: cli, dir: path.join(tmp(), 'p') });
  assert.throws(() => validarSalida(salida({ verificaciones: [{ que: 'x', archivo: 'no/existe.json', resultado: 'coincide' }] }), pk), e => e.codigo === 'REVISOR_NO_CONCLUYENTE');
  assert.throws(() => validarSalida(salida({ verificaciones: [] }), pk), e => e.codigo === 'REVISOR_NO_CONCLUYENTE');
  assert.throws(() => validarSalida('no soy json', pk), e => e.codigo === 'REVISOR_NO_JSON');
  const ok = validarSalida(salida({ verificaciones: verifs(s) }), pk); assert.equal(ok.veredicto, 'aprobado'); assert.equal(ok.archivos_distintos, 3);
  const grave = validarSalida(salida({ verificaciones: verifs(s), objeciones: [objeto()] }), pk); assert.equal(grave.veredicto, 'objeciones'); assert.equal(grave.veredicto_original, 'aprobado');
  const ids = validarSalida(salida({ veredicto: 'objeciones', objeciones: [objeto(), objeto()] }), pk).objeciones.map(o => o.id); assert.deepEqual(ids, ['O1', 'O1_2'], 'ids repetidos se desambiguan');
  assert.ok(JSON.stringify(ESQUEMA).includes('"additionalProperties":false'));
});

test('Ronda aprobada a la primera: el expediente se cierra y queda la constancia (paquete, salida y huellas)', async () => {
  const s = await sembrar(), tr = [], r = await revisar({ expId: s.id, cliente: cli, revisor: revisorGuion([salida({ verificaciones: verifs(s) })], tr), modelo: modeloGuion({}), dirBase: tmp() });
  assert.equal(r.aprobado, true); assert.equal(r.estado, 'cerrado'); assert.equal(r.rondas, 1);
  const v = await cli.ver(s.id); assert.equal(v.revisiones[0].veredicto, 'aprobado'); assert.match(v.revisiones[0].paquete_sha, /^[0-9a-f]{64}$/); assert.match(v.revisiones[0].salida_sha, /^[0-9a-f]{64}$/); assert.equal(v.libro.ok, true);
  assert.match(tr[0].prompt, /RONDA 1/); assert.ok(fs.existsSync(path.join(tr[0].dir, 'expediente.json')));
});

test('Objeción real: el agente corrige (baja el veredicto y rectifica), la ronda 2 ve las respuestas previas y aprueba; la evidencia original no se toca', async () => {
  const s = await sembrar(), tr = [], paquetes = [];
  const revisor = async ({ dir, prompt }) => { tr.push(prompt); paquetes.push(dir); return { salida: tr.length === 1 ? salida({ veredicto: 'objeciones', objeciones: [objeto()] }) : salida({ verificaciones: verifs(s) }) }; };
  const modelo = modeloGuion({ respuestas: [{ objecion: 'O1', decision: 'corregida', razon: 'El revisor tiene razón: la lectura solo muestra la salida.', acciones: [{ tipo: 'veredicto', hipotesis: 'H1', estado: 'sin_resolver', motivo: 'Solo consta la salida de 500 M desde A; no consta la recepción en B.' }, { tipo: 'rectificar', evidencia: s.e1, motivo: 'El texto decía que A envió a B; la lectura solo prueba la salida.', texto_correcto: 'A envió 500.000.000 USDT (destino no comprobado en esta lectura)' }] }] });
  const r = await revisar({ expId: s.id, cliente: cli, revisor, modelo, dirBase: tmp() });
  assert.equal(r.aprobado, true); assert.equal(r.rondas, 2); const v = await cli.ver(s.id);
  assert.equal(v.estado, 'cerrado'); assert.equal(v.hipotesis[0].estado, 'sin_resolver'); assert.equal(v.revisiones[0].respuestas[0].decision, 'corregida'); assert.equal(v.revisiones[0].respuestas[0].acciones.length, 2);
  assert.equal(v.rectificaciones.length, 1); assert.equal(v.rectificaciones[0].evidencia, s.e1); assert.match(v.evidencias[0].texto, /A envió 500\.000\.000 USDT a B/, 'la evidencia original sigue intacta');
  const previas = JSON.parse(fs.readFileSync(path.join(paquetes[1], 'rondas-previas.json'), 'utf8')); assert.equal(previas[0].objeciones[0].id, 'O1'); assert.equal(previas[0].respuestas_del_agente[0].decision, 'corregida');
  assert.match(fs.readFileSync(path.join(paquetes[1], 'expediente.json'), 'utf8'), /destino no comprobado/, 'la ronda 2 ya ve la rectificación');
});

test('Las reglas del almacén mandan: pedir «confirmada» sin evidencia sólida se rechaza, y una «corregida» sin ninguna acción aplicada no cuenta', async () => {
  const s = await sembrar(), id2 = await cli.hipotesis(s.id, { texto: 'B es una casa de cambio', tipo: 'atribucion', confirma: ['etiqueta'], refuta: ['contrato de usuario'] });
  const modelo = modeloGuion({ respuestas: [{ objecion: 'O1', decision: 'corregida', razon: 'Lo arreglo con un veredicto fuerte.', acciones: [{ tipo: 'veredicto', hipotesis: id2.id, estado: 'confirmada', motivo: 'Es obvio que lo es.' }] }, { objecion: 'O2', decision: 'discutida', razon: 'La cifra sí consta en E1 (lectura original) y no cambia.' }] });
  const revisor = revisorGuion([salida({ veredicto: 'objeciones', objeciones: [objeto({ objetivo: id2.id }), objeto({ id: 'O2', severidad: 'media' })] })]);
  const r = await revisar({ expId: s.id, cliente: cli, revisor, modelo, dirBase: tmp(), maxRondas: 1 });
  const rs = r.expediente.revisiones[0].respuestas; assert.equal(rs[0].decision, 'sin_respuesta'); assert.match(rs[0].acciones[0], /RECHAZADA/); assert.match(rs[0].razon, /no aceptó/); assert.equal(rs[1].decision, 'discutida');
  assert.equal(r.expediente.hipotesis.find(h => h.id === id2.id).estado, 'pendiente'); assert.equal(r.aprobado, false); assert.equal(r.codigo, 'RONDAS'); assert.notEqual(r.estado, 'cerrado');
  assert.ok(r.expediente.evidencias.some(e => e.clase === 'no_disponible' && /NO aprobó el expediente/.test(e.texto)), 'el fallo de la revisión queda anotado en el expediente');
});

test('Desacuerdo estancado: las mismas objeciones graves y ningún cambio → se para en vez de gastar las 10 rondas', async () => {
  const s = await sembrar(), tr = [], modelo = modeloGuion({ respuestas: [{ objecion: 'O1', decision: 'discutida', razon: 'No estoy de acuerdo: la lectura R1 muestra la recepción en B.' }] });
  const r = await revisar({ expId: s.id, cliente: cli, revisor: revisorGuion([salida({ veredicto: 'objeciones', objeciones: [objeto()] })], tr), modelo, dirBase: tmp() });
  assert.equal(r.aprobado, false); assert.equal(r.codigo, 'DESACUERDO'); assert.equal(tr.length, 2); assert.equal(r.rondas, 2); assert.equal(r.estado, 'revision');
});

test('Un revisor que falla (o no concluye) deja el expediente pendiente de revisión; nunca se da por revisado', async () => {
  const s = await sembrar(), r = await revisar({ expId: s.id, cliente: cli, revisor: async () => { throw Object.assign(new Error('Codex terminó con error (código 1)'), { codigo: 'CODEX' }); }, modelo: modeloGuion({}), dirBase: tmp() });
  assert.equal(r.aprobado, false); assert.match(r.motivo_fin, /Codex terminó con error/); assert.equal(r.estado, 'revision'); assert.equal(r.rondas, 0);
  const s2 = await sembrar(), tr = [], r2 = await revisar({ expId: s2.id, cliente: cli, revisor: revisorGuion([salida({ verificaciones: [] })], tr), modelo: modeloGuion({}), dirBase: tmp() });
  assert.equal(r2.aprobado, false); assert.equal(r2.codigo, 'REVISOR_NO_CONCLUYENTE'); assert.equal(tr.length, 2, 'se reintenta una vez pidiendo contrastes reales'); assert.match(tr[1].prompt, /no fue admisible/); assert.equal(r2.rondas, 0);
});

test('Cierre: el almacén no deja cerrar si el contenido cambió después de la aprobación', async () => {
  const s = await sembrar(); await revisar({ expId: s.id, cliente: cli, revisor: revisorGuion([salida({ verificaciones: verifs(s) })]), modelo: modeloGuion({}), dirBase: tmp() });
  await cli.estado(s.id, 'abierto'); await cli.evidencia(s.id, { clase: 'no_disponible', texto: 'Algo nuevo que no se pudo comprobar', fuente: 'prueba', metodo: 'prueba', consultado_utc: '2026-10-30T09:00:00Z', limites: ['sin acceso'] });
  await assert.rejects(() => cli.estado(s.id, 'cerrado'), e => e.codigo === 'REGLA' && /cambió después/.test(e.message));
});

test('Codex: argumentos de aislamiento (sin config del usuario, solo lectura, sesión efímera, esquema) y lectura de su salida', async () => {
  const dirBase = tmp(), dir = path.join(dirBase, 'paquete'); fs.mkdirSync(dir, { recursive: true }); let args = null, opts = null;
  const spawnImpl = (bin, a, o) => { args = a; opts = o; const p = new EventEmitter(); p.stdout = new EventEmitter(); p.stderr = new EventEmitter(); let prompt = ''; p.stdin = { end: t => { prompt = t; fs.writeFileSync(a[a.indexOf('-o') + 1], '{"veredicto":"aprobado"}'); setImmediate(() => p.emit('close', 0)); } }; return p; };
  const rev = crearRevisorCodex({ codexPath: process.execPath, spawnImpl }), r = await rev({ dir, prompt: 'hola' });
  assert.equal(r.salida, '{"veredicto":"aprobado"}'); assert.equal(opts.cwd, dir); assert.equal(args[0], 'exec');
  for (const x of ['--ignore-user-config', '--ephemeral', '--skip-git-repo-check', '--output-schema']) assert.ok(args.includes(x), x);
  assert.equal(args[args.indexOf('-s') + 1], 'read-only'); assert.ok(args.includes('windows.sandbox="elevated"')); assert.equal(args[args.indexOf('-C') + 1], dir); assert.ok(!args.includes('danger-full-access') && !args.includes('--dangerously-bypass-approvals-and-sandbox'));
  assert.ok(JSON.parse(fs.readFileSync(args[args.indexOf('--output-schema') + 1], 'utf8')).required.includes('verificaciones'));
});

test('Informe: el apartado de revisión muestra rondas, objeciones, respuestas y rectificaciones; el estado dice la verdad (pendiente / no aprobado / cerrado)', async () => {
  const { construirDatos, aMarkdown } = require('../src/informe.cjs'), md = async id => { const exp = await cli.ver(id); return aMarkdown(await construirDatos(exp), exp); };
  const s = await sembrar(); assert.match(await md(s.id), /Pendiente de revisión independiente/); assert.match(await md(s.id), /todavía no ha pasado la revisión independiente/);
  const modelo = modeloGuion({ respuestas: [{ objecion: 'O1', decision: 'corregida', razon: 'Tiene razón: se baja el veredicto y se rectifica E1.', acciones: [{ tipo: 'rectificar', evidencia: s.e1, motivo: 'El texto afirmaba el destino sin la lectura que lo pruebe.', texto_correcto: 'A envió 500.000.000 USDT (destino no comprobado)' }] }] });
  await revisar({ expId: s.id, cliente: cli, revisor: revisorGuion([salida({ veredicto: 'objeciones', objeciones: [objeto()] })]), modelo, dirBase: tmp(), maxRondas: 1 });
  const m1 = await md(s.id); assert.match(m1, /### Revisión independiente/); assert.match(m1, /NO lo ha aprobado/); assert.match(m1, /R1-O1/); assert.match(m1, /\*\*corregida\*\*/); assert.match(m1, /### Rectificaciones/); assert.match(m1, /RECTIFICADA \(F1/); assert.match(m1, /no ha sido aprobado por la revisión independiente/);
  const s2 = await sembrar(); await revisar({ expId: s2.id, cliente: cli, revisor: revisorGuion([salida({ verificaciones: verifs(s2) })]), modelo: modeloGuion({}), dirBase: tmp() });
  const m2 = await md(s2.id); assert.match(m2, /Cerrado: lo aprobó la revisión independiente \(ronda 1\)/); assert.match(m2, /APROBADO/); assert.doesNotMatch(m2, /provisional\*\*: no ha sido aprobado/);
});

test('El agente puede reclasificar una evidencia y sustituir una hipótesis demasiado amplia; el informe lee la evidencia con su clase efectiva', async () => {
  const { construirDatos, aMarkdown } = require('../src/informe.cjs'), s = await sembrar();
  const modelo = modeloGuion({ respuestas: [{ objecion: 'O1', decision: 'corregida', razon: 'H1 era demasiado amplia y E1 no prueba el destino; se sustituye y se reclasifica.', acciones: [
    { tipo: 'rectificar', evidencia: s.e1, motivo: 'La lectura solo prueba la salida, no el destino.', texto_correcto: 'Salida de 500.000.000 USDT; destino no comprobado', clase_efectiva: 'no_disponible' },
    { tipo: 'hipotesis', texto: 'A envió 500 M USDT en la salida observada el 29-10 (destino sin comprobar)', tipo_hipotesis: 'destino_fondos', confirma: ['salida directa en cadena'], refuta: ['ninguna salida de ese importe'] },
    { tipo: 'veredicto', hipotesis: 'H1', estado: 'sin_resolver', motivo: 'Sustituida por H2: el destino no consta en la lectura original.' }] }] });
  const r = await revisar({ expId: s.id, cliente: cli, revisor: revisorGuion([salida({ veredicto: 'objeciones', objeciones: [objeto()] })]), modelo, dirBase: tmp(), maxRondas: 1 });
  const rs = r.expediente.revisiones[0].respuestas[0]; assert.equal(rs.decision, 'corregida'); assert.match(rs.acciones.join(' '), /ahora se lee como no_disponible/); assert.match(rs.acciones.join(' '), /hipótesis nueva → H2/);
  const exp = await cli.ver(s.id), D = await construirDatos(exp), e1 = D.evidencias.find(e => e.id === s.e1); assert.equal(e1.clase, 'no_disponible'); assert.equal(e1.clase_original, 'hecho_cadena');
  const md = aMarkdown(D, exp); assert.match(md, /se lee como no comprobado/); assert.match(md, /Salida de 500\.000\.000 USDT; destino no comprobado/); assert.equal(exp.hipotesis.length, 2);
});

test('Contratos: una cuenta con delegación EIP-7702 se registra como tal (no como «sin código»); la cronología no oculta lecturas distintas de una misma transacción', async () => {
  const { construirDatos, aMarkdown } = require('../src/informe.cjs'), s = await sembrar(), reg = crearRegistrador({ cliente: cli, expId: s.id }), D7 = '0x' + '63c0c19a282a1b52b07dd5a65b58948a07dae32b';
  const base = { ok: true, red: 'ethereum', consultado_utc: '2026-10-30T09:00:00Z', crudos: [], limites: ['Es una cuenta que delega su código en otro contrato (EIP-7702): no es un contrato propio.'] };
  await reg.contrato({ ...base, direccion: B, es_contrato: false, delegacion_7702: D7 }); await reg.contrato({ ...base, direccion: A, es_contrato: false, nota: 'sin código' });
  const exp = await cli.ver(s.id), tx = exp.evidencias.filter(e => e.direccion === B || e.direccion === A);
  assert.match(tx.find(e => e.direccion === B).texto, /DELEGACIÓN EIP-7702.*hacia 0x63c0c19a/); assert.doesNotMatch(tx.find(e => e.direccion === B).texto, /no tiene código/); assert.ok(tx.some(e => e.direccion === A && /no tiene código/.test(e.texto)), 'una cuenta realmente sin código sigue diciéndolo');
  assert.ok(exp.consultas.some(c => /delegación EIP-7702 hacia/.test(c.resumen || '')), 'el resumen de la consulta tampoco dice «sin código»');
  await cli.evidencia(s.id, { clase: 'hecho_cadena', texto: 'La misma transacción movió además 3 WETH hacia B', fuente: 'Etherscan V2', metodo: 'lectura', consultado_utc: '2026-10-30T08:09:00Z', ocurrido_utc: '2026-10-29T20:30:00Z', red: 'ethereum', direccion: A, tx_hash: H1, confianza: 'alta' });
  const exp2 = await cli.ver(s.id), D = await construirDatos(exp2), g = D.cronologia.find(c => c.tx === H1); assert.equal(g.textos.length, 2); assert.equal(D.cronologia.filter(c => c.tx === H1).length, 1);
  assert.match(aMarkdown(D, exp2), /TAMBIÉN en esta transacción.*3 WETH/);
});

test('Herramienta saldo: lee el saldo nativo y de tokens con la hora del bloque, lo guarda como hecho con su lectura original y avisa de que un saldo es de ese momento', async () => {
  const { leerSaldos } = require('../src/saldo.cjs'), { NOMBRES } = require('../src/herramientas.cjs'), s = await sembrar(), reg = crearRegistrador({ cliente: cli, expId: s.id }), TOK = '0x' + 'dd'.repeat(20);
  assert.ok(NOMBRES.includes('saldo'));
  const ok = (resultado, tipo) => ({ ok: true, resultado, proveedor: 'rpc.test', consultado_utc: '2026-10-31T23:00:00Z', crudo: JSON.stringify({ tipo, resultado }) });
  const rpc = { ultimoBloque: async () => ok('0x64', 'bn'), bloque: async () => ok({ timestamp: '0x' + Math.floor(Date.parse('2026-10-31T23:00:00Z') / 1000).toString(16) }, 'blk'), saldo: async () => ok('0x' + (3n * 10n ** 18n + 5n * 10n ** 17n).toString(16), 'bal'), call: async () => ok('0x' + (1175464712876362n).toString(16).padStart(64, '0'), 'call') };
  const tokens = { info: async () => ({ decimales: 6, simbolo_reportado: 'USDT', identificado_por_contrato: 'USDT', verificado_por_contrato: true }) };
  const r = await leerSaldos(rpc, tokens, 'ethereum', A, { tokens: [TOK] }); assert.equal(r.ok, true); assert.equal(r.bloque, 100); assert.equal(r.ocurrido_utc, '2026-10-31T23:00:00Z'); assert.equal(r.nativo.raw, '3500000000000000000');
  const g = await reg.saldo(r, { proposito: 'apoyo' }); assert.equal(g.ok, true); assert.equal(g.evidencias.length, 2);
  const exp = await cli.ver(s.id), ev = exp.evidencias.filter(e => g.evidencias.includes(e.id));
  assert.match(ev[0].texto, /tenía 3,5 ETH \(moneda nativa\) en ethereum en el bloque 100 \(2026-10-31T23:00:00Z\)/); assert.match(ev[1].texto, /1\.175\.464\.712,876362 USDT.*verificado/); assert.equal(ev[1].contrato, TOK); assert.ok(ev.every(e => e.clase === 'hecho_cadena' && e.raw_sha256 && e.bloque === 100));
  assert.ok(ev[0].limites.some(l => /puede cambiar en cualquier momento/.test(l)));
  const fallo = await leerSaldos({ ...rpc, ultimoBloque: async () => ({ ok: false, error: 'sin red' }) }, tokens, 'ethereum', A); assert.equal(fallo.ok, false); const gf = await reg.saldo(fallo); assert.equal(gf.ok, false);
  assert.equal((await cli.ver(s.id)).evidencias.at(-1).clase, 'no_disponible');
});

// ---------------- reparto por saldos reales (paso 3) ----------------
function escenarioReparto({ saldoEth = null, filasTxlist = null } = {}) {
  const U = '0x' + 'dd'.repeat(20), P = '0x' + '99'.repeat(20), h = n => '0x' + String(n).repeat(64).slice(0, 64), w = (e, d = 18) => (BigInt(Math.round(e * 1e6)) * 10n ** BigInt(d - 6)).toString();
  const f = (hash, from, to, value, ts, extra = {}) => ({ hash, from, to, value, timeStamp: String(ts), isError: '0', gasUsed: '0', gasPrice: '0', ...extra });
  const txlist = filasTxlist || [f(h(1), B, A, w(10), 1000), f(h(2), A, '0x' + '33'.repeat(20), w(3), 1100, { gasUsed: '21000', gasPrice: '1000000000' }), f(h(6), A, P, '0', 1300, { gasUsed: '100000', gasPrice: '1000000000' })];
  const interno = [f(h(3), P, A, w(1), 1200), f(h(6), P, A, w(0.5), 1300)];
  const tok = (hash, from, to, v, ts) => ({ hash, from, to, value: v, timeStamp: String(ts), contractAddress: U, tokenSymbol: 'USDT', tokenDecimal: '6' });
  const tokentx = [tok(h(4), B, A, '100000000', 1050), tok(h(5), A, '0x' + '33'.repeat(20), '40000000', 1150), tok(h(6), A, P, '10000000', 1300)];
  const filas = { txlist, txlistinternal: interno, tokentx };
  const esperadoEth = 11.5 - 3 - 0.000121;
  const http = async ({ url }) => { const q = new URL(url).searchParams, ac = q.get('action'), rows = filas[ac] || []; return { status: 200, json: { status: '1', message: 'OK', result: rows } }; };
  const ok = (resultado, tipo) => ({ ok: true, resultado, proveedor: 'rpc.test', consultado_utc: '2026-11-02T13:00:00Z', crudo: JSON.stringify({ tipo, resultado }) });
  const rpc = { ultimoBloque: async () => ok('0x66', 'bn'), bloque: async () => ok({ timestamp: '0x' + (1400).toString(16) }, 'blk'), saldo: async () => ok('0x' + (saldoEth != null ? BigInt(saldoEth) : BigInt(w(esperadoEth))).toString(16), 'bal'), call: async () => ok('0x' + (50000000n).toString(16).padStart(64, '0'), 'call') };
  const tokens = { conocidos: new Map([['ethereum|' + U, { base: 'USDT' }]]), info: async () => ({ decimales: 6, simbolo_reportado: 'USDT', identificado_por_contrato: 'USDT', verificado_por_contrato: true }) };
  return { http, rpc, tokens, U, P };
}
test('Reparto: el libro cuadra al entero con el saldo del mismo bloque (ETH con gas y llamadas internas, y tokens), detecta el cambio de activo y declara el origen único o la mezcla', async () => {
  const { leerLibro } = require('../src/reparto.cjs'), E = escenarioReparto(), r = await leerLibro(E.http, E.rpc, E.tokens, { etherscanKey: 'k' }, { direccion: A });
  assert.equal(r.ok, true); assert.equal(r.completa, true); assert.equal(r.bloque, 100, 'se lee dos bloques por detrás del último (0x66 = 102)'); assert.deepEqual(r.activos.map(a => a.activo), ['ETH', E.U]);
  const eth = r.activos[0], usdt = r.activos[1];
  assert.equal(eth.entra_raw, (11500000n * 10n ** 12n).toString()); assert.equal(eth.sale_raw, (3000000n * 10n ** 12n).toString()); assert.equal(eth.gas_raw, '121000000000000'); assert.equal(eth.cuadra, true); assert.equal(eth.diferencia_raw, '0'); assert.equal(eth.atribucion, 'mezcla'); assert.equal(eth.origenes_distintos, 2);
  assert.equal(usdt.entra_raw, '100000000'); assert.equal(usdt.sale_raw, '50000000'); assert.equal(usdt.cuadra, true); assert.equal(usdt.atribucion, 'origen_unico'); assert.equal(usdt.origenes[0].direccion, B);
  assert.equal(r.n_cambios, 1); assert.deepEqual(r.cambios[0].entrega, [{ activo: E.U, raw: '10000000' }]); assert.equal(r.cambios[0].recibe[0].activo, 'ETH'); assert.equal(r.cambios[0].recibe[0].raw, (500000n * 10n ** 12n).toString());
  assert.ok(r.crudos.some(c => /etherscan:txlist:p1/.test(c.tipo)) && r.crudos.every(c => !/apikey|"k"/.test(c.crudo)), 'se guardan las páginas originales y nunca la clave');
});
test('Reparto: si no cuadra lo dice con la diferencia; si el libro es incompleto no afirma cierre; sin clave o con error de Etherscan, no inventa', async () => {
  const { leerLibro } = require('../src/reparto.cjs'), E = escenarioReparto({ saldoEth: 7n * 10n ** 18n });
  const r = await leerLibro(E.http, E.rpc, E.tokens, { etherscanKey: 'k' }, { direccion: A, activos: ['ETH'] }); assert.equal(r.activos[0].cuadra, false); assert.notEqual(r.activos[0].diferencia_raw, '0'); assert.equal(r.activos.length, 1);
  const llena = Array.from({ length: 1000 }, (_, i) => ({ hash: '0x' + String(i).padStart(64, '0'), from: B, to: A, value: '1', timeStamp: '1000', isError: '0', gasUsed: '0', gasPrice: '0' })), E2 = escenarioReparto({ filasTxlist: llena }), r2 = await leerLibro(E2.http, E2.rpc, E2.tokens, { etherscanKey: 'k' }, { direccion: A, activos: ['ETH'] });
  assert.equal(r2.completa, false); assert.equal(r2.activos[0].cuadra, false, 'libro incompleto: nunca se afirma cierre'); assert.ok(r2.limites.some(l => /INCOMPLETO/.test(l)));
  assert.equal((await leerLibro(E.http, E.rpc, E.tokens, {}, { direccion: A })).ok, false);
  assert.equal((await leerLibro(async () => ({ status: 200, json: { status: '0', message: 'NOTOK', result: 'Invalid API Key' } }), E.rpc, E.tokens, { etherscanKey: 'k' }, { direccion: A })).ok, false);
});
test('Herramienta reparto: queda en el expediente como hechos con su lectura original, dice CUADRA, y el paquete de revisión incluye las páginas originales de Etherscan', async () => {
  const { leerLibro } = require('../src/reparto.cjs'), { NOMBRES } = require('../src/herramientas.cjs'), s = await sembrar(), reg = crearRegistrador({ cliente: cli, expId: s.id }), E = escenarioReparto();
  assert.ok(NOMBRES.includes('reparto')); const libro = await leerLibro(E.http, E.rpc, E.tokens, { etherscanKey: 'k' }, { direccion: A }), g = await reg.reparto(libro); assert.equal(g.ok, true); assert.equal(g.cuadran, 2);
  const exp = await cli.ver(s.id), ev = exp.evidencias.filter(e => g.evidencias.includes(e.id));
  assert.ok(ev.length >= 3); assert.match(ev[0].texto, /libro de ETH \(moneda nativa\).*CUADRA al entero: entradas − salidas − gas = saldo/); assert.match(ev[1].texto, /USDT \(contrato .*verificado\).*CUADRA.*ORIGEN ÚNICO/); assert.ok(ev.every(e => e.clase === 'hecho_cadena' && e.raw_sha256 && e.bloque === 100));
  assert.equal(ev[0].confianza, 'alta'); assert.match(ev[ev.length - 1].texto, /1 cambio\(s\) de activo/);
  const dir = path.join(tmp(), 'p'), pk = await armarPaquete({ exp, cliente: cli, dir }), indice = JSON.parse(fs.readFileSync(path.join(dir, 'lecturas/INDICE.json'), 'utf8'));
  assert.ok(Object.values(indice).some(v => v.herramientas.some(x => /^reparto: etherscan:txlist:p1/.test(x))), 'las páginas originales de Etherscan van al paquete'); assert.ok(pk.lecturas >= 5);
});

test('Reparto: la atribución mira el TIEMPO (lo que llegó después de la primera salida no puede ser su origen) y el informe describe el método realmente usado', async () => {
  const { leerLibro } = require('../src/reparto.cjs'), { construirDatos, aMarkdown } = require('../src/informe.cjs'), E = escenarioReparto(), r = await leerLibro(E.http, E.rpc, E.tokens, { etherscanKey: 'k' }, { direccion: A }), eth = r.activos[0], usdt = r.activos[1];
  assert.equal(usdt.atribucion_a_la_primera_salida, 'origen_unico_hasta_la_primera_salida'); assert.equal(usdt.n_entradas_despues, 0); assert.equal(usdt.primera_salida_utc, new Date(1150 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z'));
  assert.equal(eth.origenes_antes_de_la_primera_salida, 1); assert.equal(eth.n_entradas_despues, 2, 'el ETH de las llamadas internas llegó después de la primera salida'); assert.equal(eth.origenes_despues, 1);
  const s = await sembrar(), reg = crearRegistrador({ cliente: cli, expId: s.id }); await reg.reparto(r); const exp = await cli.ver(s.id), D = await construirDatos(exp), md = aMarkdown(D, exp);
  assert.match(md, /Reparto por saldos reales \(sin FIFO\)/); assert.doesNotMatch(md, /5\. \*\*Rastreo de fondos\.\*\* El primer salto/, 'sin relaciones inferidas no se describe FIFO como método usado'); assert.match(exp.evidencias.at(-2).texto + exp.evidencias.at(-3).texto, /En el TIEMPO: hasta la primera salida/);
});

test('Retirar una evidencia: queda con su motivo pero deja de contar (reglas del almacén) y sale del cuerpo del informe; no se puede retirar la que cita una relación; el agente puede pedirlo', async () => {
  const { construirDatos, aMarkdown } = require('../src/informe.cjs'), s = await sembrar();
  const lim = (await cli.evidencia(s.id, { clase: 'no_disponible', texto: 'No se pudo leer el libro de la dirección B (sin datos)', fuente: 'prueba', metodo: 'prueba', consultado_utc: '2026-10-30T09:00:00Z', limites: ['sin acceso'] })).id;
  const h2 = (await cli.hipotesis(s.id, { texto: 'B recibió fondos de A en la transferencia observada', tipo: 'destino_fondos', confirma: ['transferencia directa'], refuta: ['ninguna'] })).id;
  await cli.vincular(s.id, h2, s.e2, 'apoya', 'directa'); await cli.consulta(s.id, { herramienta: 'transaccion', parametros: {}, proposito: 'contraprueba', hipotesis: h2, estado: 'sin_datos', ts_utc: '2026-10-30T08:22:00Z' });
  await cli.arista(s.id, { red: 'ethereum', desde: A, hasta: B, clase: 'directa', tx_hash: H2, ts_utc: '2026-10-29T20:30:00Z', evidencias: [s.e2], simbolo: 'USDT', importe_raw: '200000000', decimales: 6 });
  await cli.revision(s.id, { ronda: 1, revisor: 'Codex (prueba)', paquete_sha: 'b'.repeat(64), veredicto: 'objeciones', resumen: 'x', verificaciones: [], objeciones: [objeto({ objetivo: 'limitaciones', tipo: 'contradiccion', objecion: 'La limitación «no se pudo leer el libro de B» ya no es cierta: se leyó.' })] });
  await assert.rejects(() => cli.rectificar(s.id, { evidencia: s.e2, ronda: 1, motivo: 'Intento retirar la que cita la relación R1.', retirar: true }), e => e.codigo === 'REGLA' && /la citan las relaciones R1/.test(e.message));
  const r = await cli.rectificar(s.id, { evidencia: lim, ronda: 1, motivo: 'El libro de B sí se leyó después (consulta Q9): esta limitación es obsoleta.', retirar: true }); assert.equal(r.retirada, true);
  await cli.vincular(s.id, h2, lim, 'apoya', 'directa').catch(() => {}); const exp = await cli.ver(s.id); assert.equal(exp.rectificaciones[0].retirada, 1); assert.ok(exp.evidencias.some(e => e.id === lim), 'la evidencia sigue en el expediente (nunca se borra)');
  const D = await construirDatos(exp), md = aMarkdown(D, exp); assert.ok(!D.evidencias.some(e => e.id === lim), 'sale del cuerpo del informe'); assert.deepEqual(D.retiradas.map(x => x.id), [lim]); assert.doesNotMatch(md.split('### Rectificaciones')[0], /No se pudo leer el libro de la dirección B/); assert.match(md, /RETIRADA \(ya no cuenta/);
  // el agente puede pedir retirar
  const lim2 = (await cli.evidencia(s.id, { clase: 'no_disponible', texto: 'Otra limitación obsoleta de prueba', fuente: 'prueba', metodo: 'prueba', consultado_utc: '2026-10-30T09:00:00Z', limites: ['sin acceso'] })).id;
  const modelo = modeloGuion({ respuestas: [{ objecion: 'O1', decision: 'corregida', razon: 'La limitación ya no es cierta: se retira.', acciones: [{ tipo: 'retirar', evidencia: lim2, motivo: 'Obsoleta: el dato se leyó en la consulta posterior.' }] }] });
  const res = await revisar({ expId: s.id, cliente: cli, revisor: revisorGuion([salida({ veredicto: 'objeciones', objeciones: [objeto()] })]), modelo, dirBase: tmp(), maxRondas: 2 });
  assert.match(res.expediente.revisiones.find(x => x.ronda === 2).respuestas[0].acciones.join(' '), /retirar .* → F\d+ \(retirada/);
});

test('Codex sin cupo (límite de uso de la cuenta): se dice como tal, no se reintenta y NO se anota nada en el expediente (no es un veredicto sobre él)', async () => {
  const dirBase = tmp(), dir = path.join(dirBase, 'paquete'); fs.mkdirSync(dir, { recursive: true });
  const spawnImpl = (bin, a) => { const p = new EventEmitter(); p.stdout = new EventEmitter(); p.stderr = new EventEmitter(); p.stdin = { end: () => setImmediate(() => { p.stdout.emit('data', '{"type":"error","message":"You\'ve hit your usage limit. Upgrade to Pro, or try again at 6:00 PM."}'); p.emit('close', 1); }) }; return p; };
  const rev = crearRevisorCodex({ codexPath: process.execPath, spawnImpl }); await assert.rejects(() => rev({ dir, prompt: 'x' }), e => e.codigo === 'CUOTA' && /Codex sin cupo/.test(e.message) && /6:00 PM/.test(e.message));
  const s = await sembrar(), n = (await cli.ver(s.id)).evidencias.length, r = await revisar({ expId: s.id, cliente: cli, revisor: async () => { throw Object.assign(new Error('Codex sin cupo: prueba'), { codigo: 'CUOTA' }); }, modelo: modeloGuion({}), dirBase: tmp() });
  assert.equal(r.aprobado, false); assert.equal(r.codigo, 'CUOTA'); assert.equal((await cli.ver(s.id)).evidencias.length, n, 'no se anota nada en el expediente'); assert.equal(r.estado, 'revision');
});

test('Un resumen de consulta cuyo resultado se rectificó o se retiró no se muestra como si siguiera vigente (ni en el informe ni en la vista efectiva)', async () => {
  const { conClaseEfectiva } = require('../src/informe.cjs'), s = await sembrar(), reg = crearRegistrador({ cliente: cli, expId: s.id });
  await reg.contrato({ ok: true, red: 'ethereum', consultado_utc: '2026-10-30T09:00:00Z', crudos: [], limites: ['x'], direccion: B, es_contrato: false, nota: 'sin código' });
  let exp = await cli.ver(s.id); const q = exp.consultas.at(-1), ev = q.evidencias[0]; assert.equal(q.resumen, 'sin código');
  await cli.revision(s.id, { ronda: 1, revisor: 'Codex (prueba)', paquete_sha: 'b'.repeat(64), veredicto: 'objeciones', resumen: 'x', verificaciones: [], objeciones: [objeto()] });
  await cli.rectificar(s.id, { evidencia: ev, ronda: 1, motivo: 'La lectura real devuelve delegación.', texto_correcto: 'Cuenta con delegación EIP-7702', clase_efectiva: 'fuente_externa' }); exp = await cli.ver(s.id);
  assert.match(conClaseEfectiva(exp).consultas.find(x => x.id === q.id).resumen, /\[RECTIFICADO F\d+\] Cuenta con delegación/);
  await cli.rectificar(s.id, { evidencia: ev, ronda: 1, motivo: 'Resultado obsoleto: se sustituye por otra consulta.', retirar: true }); exp = await cli.ver(s.id);
  const c = conClaseEfectiva(exp).consultas.find(x => x.id === q.id); assert.match(c.resumen, /\[RESULTADO RETIRADO F\d+: Resultado obsoleto/); assert.equal(c.resumen_original, 'sin código');
});

test('Acción «relacion»: el agente pide registrar un movimiento pequeño que la ruta dejó fuera; el sistema lo construye desde el RECIBO (no desde lo que diga el modelo), sin duplicar ni inventar', async () => {
  const { registrarRelacion } = require('../src/relacion.cjs'), { TOPIC_TRANSFER } = require('../src/transaccion.cjs'), s = await sembrar(), reg = crearRegistrador({ cliente: cli, expId: s.id });
  const U = '0x' + 'dd'.repeat(20), HX = '0x' + 'ee'.repeat(32), pad = x => '0x' + x.slice(2).padStart(64, '0'), ok = (resultado, tipo) => ({ ok: true, resultado, proveedor: 'rpc.test', consultado_utc: '2026-11-03T08:00:00Z', crudo: JSON.stringify({ tipo, resultado }) });
  const rpc = { transaccion: async () => ok({ from: A, to: U, value: '0x0', input: '0xa9059cbb', transactionIndex: '0x1' }, 'tx'), recibo: async () => ok({ status: '0x1', blockNumber: '0x64', gasUsed: '0x5208', logs: [{ address: U, topics: [TOPIC_TRANSFER, pad(A), pad(B)], data: '0x' + (127672480n).toString(16).padStart(64, '0'), logIndex: '0x0' }] }, 'rc'), bloque: async () => ok({ timestamp: '0x' + Math.floor(Date.parse('2026-10-29T21:12:59Z') / 1000).toString(16) }, 'blk'), call: async () => ({ ok: false, error: 'x' }) };
  const tokens = { info: async () => ({ decimales: 6, simbolo_reportado: 'USDT', identificado_por_contrato: 'USDT', verificado_por_contrato: true }) }, ctx = { cliente: cli, expId: s.id, reg, rpc, tokens };
  const x = await registrarRelacion(ctx, { tx: HX, desde: A, hasta: B, activo: U }); assert.equal(x.ok, true); assert.equal(x.nueva, true); assert.equal(x.importe_raw, '127672480');
  const exp = await cli.ver(s.id), a = exp.aristas.find(r => r.id === x.id); assert.equal(a.clase, 'directa'); assert.equal(a.importe_raw, '127672480'); assert.equal(a.decimales, 6); assert.equal(a.tx_hash, HX); assert.equal(a.ts_utc, '2026-10-29T21:12:59.000Z'); assert.equal(a.simbolo, 'USDT'); assert.match(a.metodo, /recibo leído por JSON-RPC/);
  const otra = await registrarRelacion(ctx, { tx: HX, desde: A, hasta: B, activo: U }); assert.equal(otra.nueva, false); assert.equal(otra.id, x.id); assert.equal((await cli.ver(s.id)).aristas.filter(r => r.tx_hash === HX).length, 1, 'no se duplica');
  await assert.rejects(() => registrarRelacion(ctx, { tx: HX, desde: A, hasta: '0x' + '55'.repeat(20), activo: U }), /no contiene esa transferencia/); await assert.rejects(() => registrarRelacion(ctx, { tx: HX, desde: A, hasta: B, activo: 'ETH' }), /no contiene esa transferencia/); await assert.rejects(() => registrarRelacion(ctx, { tx: '0x12', desde: A, hasta: B, activo: U }), /hash/);
  assert.equal((await cli.ver(s.id)).aristas.filter(r => r.tx_hash === HX).length, 1, 'un intento rechazado no registra nada');
});

test('Reparto por ventana (desdeBloque): el cierre usa el saldo INICIAL del bloque anterior; si el proveedor no sirve saldos históricos no se afirma cierre; el umbral de la ruta puede bajarse por consulta', async () => {
  const { leerLibro } = require('../src/reparto.cjs'), E = escenarioReparto(), llamadas = [];
  const rpc = { ...E.rpc, saldo: async (red, a, tag) => { llamadas.push(tag); return tag === '0x31' ? { ok: true, resultado: '0x0', proveedor: 'p', consultado_utc: '2026-11-03T08:00:00Z', crudo: '{"ini":1}' } : E.rpc.saldo(red, a, tag); }, call: async (red, to, data, tag) => (tag === '0x31' ? { ok: true, resultado: '0x0', proveedor: 'p', consultado_utc: '2026-11-03T08:00:00Z', crudo: '{"ini":2}' } : E.rpc.call(red, to, data, tag)) };
  const r = await leerLibro(E.http, rpc, E.tokens, { etherscanKey: 'k' }, { direccion: A, desdeBloque: 50 }); assert.equal(r.desde_bloque, 50); assert.ok(llamadas.includes('0x31'), 'lee el saldo en el bloque anterior al inicio (49 = 0x31)'); assert.equal(r.activos[0].saldo_inicial_raw, '0'); assert.equal(r.activos[0].cuadra, true); assert.ok(r.limites.some(l => /Ventana/.test(l)));
  const sinHist = await leerLibro(E.http, { ...rpc, saldo: async (red, a, tag) => (tag === '0x31' ? { ok: false, error: 'missing trie node' } : E.rpc.saldo(red, a, tag)) }, E.tokens, { etherscanKey: 'k' }, { direccion: A, desdeBloque: 50, activos: ['ETH'] }); assert.equal(sinHist.activos[0].cuadra, false); assert.match(sinHist.activos[0].error_saldo_inicial, /missing trie node/);
  assert.equal((await leerLibro(E.http, rpc, E.tokens, { etherscanKey: 'k' }, { direccion: A, desdeBloque: 500 })).ok, false, 'un inicio posterior al último bloque se rechaza');
  const src = require('node:fs').readFileSync(path.join(__dirname, '..', 'src', 'herramientas.cjs'), 'utf8'); assert.match(src, /minUsd = p\.minUsd !== undefined/, 'el agente puede bajar el umbral por consulta');
});

test('Revisor sustituto Claude: sesión nueva, aislada, SOLO lectura y esfuerzo máximo; se registra con su nombre y el informe dice que no es Codex', async () => {
  const { crearRevisorClaude, NOMBRE_CLAUDE } = require('../src/revision.cjs'), { construirDatos, aMarkdown } = require('../src/informe.cjs');
  let args = null, opts = null, entrada = '';
  const spawnImpl = (bin, a, o) => { args = a; opts = o; const p = new EventEmitter(); p.stdout = new EventEmitter(); p.stderr = new EventEmitter(); p.stdin = { end: t => { entrada = t; setImmediate(() => { p.stdout.emit('data', Buffer.from(JSON.stringify({ result: 'Aquí va: ' + salida({ verificaciones: [] }), total_cost_usd: 0.05, is_error: false }))); p.emit('close', 0); }); } }; return p; };
  const dir = tmp(), rev = crearRevisorClaude({ claudePath: process.execPath, spawnImpl }), r = await rev({ dir, prompt: 'hola' });
  assert.match(r.salida, /veredicto/); assert.equal(rev.nombre(), NOMBRE_CLAUDE); assert.match(NOMBRE_CLAUDE, /SUSTITUTO de Codex/); assert.equal(rev.usos[0].coste_usd, 0.05);
  for (const x of ['--safe-mode', '--no-session-persistence', '--add-dir']) assert.ok(args.includes(x), x);
  assert.equal(args[args.indexOf('--model') + 1], 'claude-sonnet-5-5'); assert.equal(args[args.indexOf('--effort') + 1], 'max'); assert.deepEqual(args.slice(args.indexOf('--tools') + 1, args.indexOf('--tools') + 4), ['Read', 'Grep', 'Glob']); assert.equal(opts.cwd, dir);
  assert.ok(!args.includes('Bash') && !args.includes('Write') && !args.includes('Edit'), 'ninguna herramienta que escriba o ejecute'); assert.match(entrada, /ÚNICAMENTE con un objeto JSON/);
  // el flujo completo: lo aprueba el sustituto → el almacén cierra y el informe lo dice
  const s = await sembrar(), revisor = async ({ dir: d, prompt }) => ({ salida: salida({ verificaciones: verifs(s) }) }); revisor.nombre = () => NOMBRE_CLAUDE;
  const res = await revisar({ expId: s.id, cliente: cli, revisor, modelo: modeloGuion({}), dirBase: tmp() }); assert.equal(res.aprobado, true);
  const exp = await cli.ver(s.id), md = aMarkdown(await construirDatos(exp), exp); assert.equal(exp.revisiones[0].revisor, NOMBRE_CLAUDE); assert.match(md, /REVISOR SUSTITUTO/); assert.match(md, /NO la revisión independiente por Codex/); assert.match(md, /menor/);
});

test('Un revisor que escribe campos más largos que los límites del almacén no tumba la revisión: se recortan', async () => {
  const { validarSalida } = require('../src/revision.cjs'), s = await sembrar(), pk = await armarPaquete({ exp: await cli.ver(s.id), cliente: cli, dir: path.join(tmp(), 'p') });
  const largo = 'x'.repeat(5000), v = validarSalida(salida({ veredicto: 'objeciones', resumen: largo, verificaciones: [{ que: largo, archivo: 'expediente.json', resultado: 'coincide' }], objeciones: [objeto({ objetivo: largo, objecion: largo, evidencia_de_la_objecion: largo, correccion_sugerida: largo })] }), pk);
  assert.ok(v.objeciones[0].objetivo.length <= 200 && v.objeciones[0].objecion.length <= 2500 && v.objeciones[0].evidencia_de_la_objecion.length <= 800 && v.objeciones[0].correccion_sugerida.length <= 1200 && v.resumen.length <= 2400 && v.verificaciones[0].que.length <= 600);
  const s2 = await sembrar(), r = await revisar({ expId: s2.id, cliente: cli, revisor: revisorGuion([salida({ veredicto: 'objeciones', objeciones: [objeto({ objetivo: largo })] })]), modelo: modeloGuion({}), dirBase: tmp(), maxRondas: 1 }); assert.equal(r.rondas, 1, 'la ronda se registra en vez de romper');
});

test('El agente responde UNA objeción por llamada (con el expediente actualizado) y una llamada que falla no deja a las demás sin responder', async () => {
  const s = await sembrar(), llamadas = [], modelo = async (p, { rol }) => { llamadas.push(p); const o = /"id": "(O\d)"/.exec(p)[1]; if (o === 'O2') throw new Error('JSON roto'); return JSON.stringify({ respuestas: [{ objecion: o, decision: 'discutida', razon: 'La cifra de la objeción ' + o + ' sí coincide con la lectura original.' }] }); };
  const r = await revisar({ expId: s.id, cliente: cli, revisor: revisorGuion([salida({ veredicto: 'objeciones', objeciones: [objeto({ id: 'O1' }), objeto({ id: 'O2' }), objeto({ id: 'O3' })] })]), modelo, dirBase: tmp(), maxRondas: 1 });
  assert.equal(llamadas.length, 3, 'una llamada por objeción'); for (const p of llamadas) assert.equal((p.match(/"id": "O\d"/g) || []).length, 1, 'cada llamada lleva solo su objeción');
  const rs = r.expediente.revisiones[0].respuestas; assert.deepEqual(rs.map(x => x.decision), ['discutida', 'sin_respuesta', 'discutida']); assert.match(rs[1].razon, /no pudo responder/);
});

test('Informe: «sin etiqueta» solo si se consultaron las etiquetas de esa dirección; y un control de inferencias con excepciones no se da por superado', async () => {
  const { construirDatos, aMarkdown } = require('../src/informe.cjs'), s = await sembrar(), reg = crearRegistrador({ cliente: cli, expId: s.id });
  await cli.direccion(s.id, { red: 'ethereum', direccion: A, rol: 'semilla' }); await cli.direccion(s.id, { red: 'ethereum', direccion: B, rol: 'otra' });
  await reg.etiquetas('ethereum', A, [], { proposito: 'apoyo' });
  let exp = await cli.ver(s.id), md = aMarkdown(await construirDatos(exp), exp);
  const fila = x => md.split('\n').find(l => l.startsWith('| ethereum |') && l.includes('`' + x + '`')) || ''; assert.ok(fila(A).includes('sin etiqueta (no significa inocua)'), fila(A)); assert.ok(fila(B).includes('etiquetas NO consultadas'), fila(B));
  await cli.revision(s.id, { ronda: 1, revisor: 'Codex (prueba)', paquete_sha: 'b'.repeat(64), veredicto: 'objeciones', resumen: 'x', verificaciones: [], objeciones: [objeto()] });
  await cli.rectificar(s.id, { evidencia: s.e1, ronda: 1, motivo: 'Es una lectura, no un hecho.', texto_correcto: 'Lectura de libro', clase_efectiva: 'inferencia' }); exp = await cli.ver(s.id); const D = await construirDatos(exp), c = D.controles.find(x => x.id === 'inferencias_prudentes');
  assert.equal(c.ok, false); assert.match(c.detalle, /NO SUPERADO con excepciones: E1/);
});
