'use strict';
// Cliente de la PUERTA DEL INVESTIGADOR de ChainScope (chainscope/src/servicio-investigador.cjs): lee y escribe expedientes. Solo 127.0.0.1; ficha propia en chainscope/data/investigador.token.
// Nunca lanza por un rechazo de las reglas del almacén sin dar su motivo: el error lleva el código (DATO_NO_VALIDO, REGLA, CERRADO…) y el mensaje exacto.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const FICHA = path.join(__dirname, '..', '..', 'chainscope', 'data', 'investigador.token');

function crearClienteExpediente({ puerto = 5720, fichaFile = FICHA, token = null, httpImpl = http, fsImpl = fs } = {}) {
  const ficha = () => token || String(fsImpl.readFileSync(fichaFile, 'utf8')).trim();
  function llamar(metodo, op, { cuerpo = null, consulta = '' } = {}) {
    return new Promise((ok, ko) => {
      let t; try { t = ficha(); } catch { return ko(Object.assign(new Error('no encuentro la ficha del investigador (chainscope/data/investigador.token): ChainScope aún no la ha creado'), { codigo: 'SIN_FICHA' })); }
      const data = cuerpo == null ? null : Buffer.from(JSON.stringify(cuerpo));
      const h = { host: `127.0.0.1:${puerto}`, authorization: 'Bearer ' + t, ...(data ? { 'content-type': 'application/json', 'content-length': data.length } : {}) };
      const r = httpImpl.request({ host: '127.0.0.1', port: puerto, path: `/servicio/investigador/v1/${op}${consulta}`, method: metodo, headers: h, timeout: 60000 }, res => {
        const c = []; res.on('data', d => c.push(d));
        res.on('end', () => {
          const txt = Buffer.concat(c).toString('utf8'); let j = null; try { j = JSON.parse(txt); } catch { /* no es JSON */ }
          if (res.statusCode >= 200 && res.statusCode < 300 && j && j.ok) return ok(j);
          ko(Object.assign(new Error((j && j.error && j.error.mensaje) || `ChainScope contestó ${res.statusCode}`), { codigo: (j && j.error && j.error.codigo) || 'HTTP_' + res.statusCode, http: res.statusCode }));
        });
      });
      r.on('timeout', () => r.destroy(Object.assign(new Error('ChainScope no contestó a tiempo'), { codigo: 'TIEMPO' })));
      r.on('error', e => ko(e.codigo ? e : Object.assign(new Error('ChainScope no responde (¿está en marcha?): ' + e.message), { codigo: 'NO_DISPONIBLE' })));
      if (data) r.write(data); r.end();
    });
  }
  const P = (op, cuerpo) => llamar('POST', op, { cuerpo });
  return {
    listar: () => llamar('GET', 'listar').then(r => r.expedientes),
    ver: id => llamar('GET', 'ver', { consulta: '?id=' + encodeURIComponent(id) }).then(r => r.expediente),
    verificar: id => llamar('GET', 'verificar', { consulta: '?id=' + encodeURIComponent(id) }).then(r => r.libro),
    leerBlob: (id, sha) => llamar('GET', 'blob', { consulta: `?id=${encodeURIComponent(id)}&sha=${sha}` }).then(r => Buffer.from(r.contenido, 'base64')),
    crear: d => P('crear', d).then(r => r.id),
    estado: (id, estado) => P('estado', { id, estado }), cola: (id, cola) => P('cola', { id, cola }), config: (id, config) => P('config', { id, config }),
    direccion: (id, d) => P('direccion', { id, ...d }), evidencia: (id, e) => P('evidencia', { id, ...e }), arista: (id, a) => P('arista', { id, ...a }), hipotesis: (id, h) => P('hipotesis', { id, ...h }),
    vincular: (id, hipotesis, evidencia, efecto, relacion) => P('vincular', { id, hipotesis, evidencia, efecto, relacion }), veredicto: (id, hipotesis, estado, motivo) => P('veredicto', { id, hipotesis, estado, motivo }),
    consulta: (id, c) => P('consulta', { id, ...c }), revision: (id, r) => P('revision', { id, ...r }), respuesta: (id, ronda, respuestas) => P('respuesta', { id, ronda, respuestas }), rectificar: (id, r) => P('rectificar', { id, ...r }), derivar: id => P('derivar', { id }), blob: (id, contenido) => P('blob', { id, contenido: Buffer.from(contenido).toString('base64'), codificacion: 'base64' })
  };
}
module.exports = { crearClienteExpediente, FICHA };
