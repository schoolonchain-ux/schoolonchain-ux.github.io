'use strict';
// JSON canónico (claves ordenadas): el mismo contenido da siempre el mismo texto y la misma huella.
const crypto = require('node:crypto');
function canon(v) {
  if (typeof v === 'bigint') return JSON.stringify(v.toString());
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
module.exports = { canon, sha256 };
