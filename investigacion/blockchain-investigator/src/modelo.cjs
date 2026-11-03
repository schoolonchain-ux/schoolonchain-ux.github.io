'use strict';
// Llamada al modelo para el uso desde la línea de comandos: la CLI de Claude con el MISMO modelo fijado y el mismo aislamiento que usa el puente (agent-cli-args.cjs): sin herramientas, sin sesión y sin CLAUDE.md.
// Dentro del puente se usa su propio invokeAgent (con respaldo y registro); esta función es solo para ejecutar el agente fuera de él.
const os = require('node:os');
const { spawn } = require('node:child_process');
const { buildClaudeArgs, DEFAULT_CLAUDE_MODEL } = require('../../agent-cli-args.cjs');
const { locateClaude } = require('../../cli-locator.cjs');

function crearModeloClaude({ model = DEFAULT_CLAUDE_MODEL, timeoutMs = 300000, claudePath = locateClaude(), cwd = os.tmpdir() } = {}) {
  if (!claudePath) throw new Error('no encuentro la CLI de Claude (claude.exe)');
  const usos = [];
  const fn = prompt => new Promise((ok, ko) => {
    const p = spawn(claudePath, buildClaudeArgs({ model }), { cwd, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }), out = [], err = []; let fin = false;
    const t = setTimeout(() => { if (!fin) { fin = true; p.kill(); ko(Object.assign(new Error('el modelo no contestó a tiempo'), { codigo: 'TIEMPO' })); } }, timeoutMs);
    p.stdout.on('data', d => out.push(d)); p.stderr.on('data', d => err.push(d));
    p.on('error', e => { if (!fin) { fin = true; clearTimeout(t); ko(e); } });
    p.on('close', () => {
      if (fin) return; fin = true; clearTimeout(t); const s = Buffer.concat(out).toString('utf8');
      try { const j = JSON.parse(s); if (j.is_error) return ko(Object.assign(new Error(String(j.result || 'error del modelo').slice(0, 300)), { codigo: 'MODELO' })); usos.push({ coste_usd: j.total_cost_usd ?? null, entrada: j.usage && j.usage.input_tokens, salida: j.usage && j.usage.output_tokens }); ok(String(j.result || '')); }
      catch { ko(Object.assign(new Error('respuesta de la CLI no válida: ' + (Buffer.concat(err).toString('utf8') || s).slice(0, 200)), { codigo: 'CLI' })); }
    });
    p.stdin.end(prompt);
  });
  fn.usos = () => usos.slice();
  return fn;
}
module.exports = { crearModeloClaude };
