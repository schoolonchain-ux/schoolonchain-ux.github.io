#!/usr/bin/env node
// Añade (o actualiza) un informe en la web: copia el HTML, genera sus datos y lo registra en reports/index.json.
//
//   node tools/add-report.mjs INFORME.html --slug mi-informe --titulo "Título corto" --resumen "Una frase" --caso "Nombre del caso" [--semilla DIRECCION] [--csv fichero.csv]
//
// Sin dependencias (Node 18 o superior). Después: git add . && git commit && git push.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extraerDatos, construir } from './build-data.mjs';
import { construirDetalle, construirLibro, estadosDelLibro } from './build-all.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const entrada = args.find((a) => !a.startsWith('--') && /\.html?$/i.test(a));
const opt = (k) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
if (!entrada || !fs.existsSync(entrada)) { console.error('Uso: node tools/add-report.mjs INFORME.html --slug mi-informe --titulo "…" --resumen "…" --caso "…"'); process.exit(1); }

const D = extraerDatos(fs.readFileSync(entrada, 'utf8'));
const slug = (opt('slug') || path.basename(entrada, path.extname(entrada))).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const salida = path.join(raiz, 'reports', slug);
fs.mkdirSync(path.join(salida, 'libro'), { recursive: true });
const w = (f, o) => fs.writeFileSync(path.join(salida, f), JSON.stringify(o));
w('data.json', construir(D)); w('detalle.json', construirDetalle(D));
const L = construirLibro(D); w('libro/cuentas.json', L.cuentas); w('libro/movs.json', L.movs); w('libro/estados.json', estadosDelLibro(L));
fs.copyFileSync(entrada, path.join(salida, 'informe-completo.html'));
const archivos = [{ nombre: 'Informe completo (HTML)', ruta: 'informe-completo.html' }, { nombre: 'Datos del panel (JSON)', ruta: 'data.json' }];
if (opt('csv') && fs.existsSync(opt('csv'))) { fs.copyFileSync(opt('csv'), path.join(salida, 'tabla.csv')); archivos.splice(1, 0, { nombre: 'Tabla (CSV)', ruta: 'tabla.csv' }); }

const ult = (D.novedades || []).slice(-1)[0];
const ficha = { slug, caso: opt('caso') || undefined, semilla: opt('semilla') || undefined, titulo: opt('titulo') || D.titulo, resumen: opt('resumen') || '', version: ult ? ult.version : '', cadenas: (opt('cadenas') || 'TRON,Ethereum').split(','), corte: D.corte, generado: D.generado, archivos };
const f = path.join(raiz, 'reports', 'index.json');
const idx = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { informes: [] };
const i = idx.informes.findIndex((r) => r.slug === slug);
if (i >= 0) idx.informes[i] = { ...idx.informes[i], ...ficha }; else idx.informes.unshift(ficha);
fs.writeFileSync(f, JSON.stringify(idx, null, 2));
console.log('Informe «' + slug + '» listo en reports/' + slug + '/. Ábrelo en report.html?r=' + slug);
