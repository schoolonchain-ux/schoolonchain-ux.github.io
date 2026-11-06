'use strict';
// Genera feed.xml (RSS 2.0) de la web a partir de data/novedades.json, el registro de novedades que ya mantiene el sitio.
// Es una simple transformación de un fichero de la copia local: no lee nada de Internet. El resultado solo cambia cuando cambia una novedad
// (la fecha de construcción es la de la novedad más reciente), así que el publicador diario no sube nada si no hay novedades nuevas.
// Uso: node feed.cjs <carpeta-del-repositorio>
const fs = require('node:fs');
const path = require('node:path');
const REPO = process.argv[2];
if (!REPO) { console.error('Uso: node feed.cjs <carpeta-del-repositorio>'); process.exit(1); }
const BASE = 'https://schoolonchain-ux.github.io/';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const enlace = (u) => { try { return new URL(String(u || './'), BASE).toString(); } catch { return BASE; } };

const j = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'novedades.json'), 'utf8').replace(/^﻿/, ''));
const items = (j.novedades || []).filter((x) => x && x.fecha && x.titulo && !isNaN(Date.parse(x.fecha))).sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha)).slice(0, 30);
if (!items.length) { console.error('SIN_NOVEDADES'); process.exit(2); }
const rfc = (t) => new Date(t).toUTCString();
const xml = ['<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>',
  '<title>School On-Chain · Novedades</title>',
  '<link>' + BASE + '</link>',
  '<atom:link href="' + BASE + 'feed.xml" rel="self" type="application/rss+xml"/>',
  '<description>Informes on-chain, ampliaciones y herramientas nuevas de School On-Chain. Blockchain intelligence. Evidence over speculation.</description>',
  '<language>es</language>',
  '<lastBuildDate>' + rfc(items[0].fecha) + '</lastBuildDate>',
  ...items.map((x) => '<item><title>' + esc(x.titulo.length > 140 ? x.titulo.slice(0, 137) + '…' : x.titulo) + '</title><link>' + esc(enlace(x.url)) + '</link><guid isPermaLink="false">' + esc((x.caso || 'sitio') + '|' + x.fecha) + '</guid><pubDate>' + rfc(x.fecha) + '</pubDate><description>' + esc(x.titulo) + '</description></item>'),
  '</channel></rss>', ''].join('\n');
fs.writeFileSync(path.join(REPO, 'feed.xml'), xml);
console.log('OK feed.xml: ' + items.length + ' novedades, la última ' + items[0].fecha);
