'use strict';
// Parche 15 (1-nov): las tablas completas se veían mal (hash partido letra a letra, filas altísimas, desplegable poco visible).
const fs = require('fs'); const f = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/armar-entregables.cjs'; let s = fs.readFileSync(f, 'utf8'); const fallos = [];
const R1 = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) { fallos.push(n + ' · ' + a.slice(0, 80)); return; } s = s.replace(a, () => b); };
// tabla ancha, sin partir hashes, texto con saltos de línea, cabecera fija
R1("'</summary><div class=\"tw\"><table><thead><tr>' + cs.map(", "'</summary><div class=\"tw larga\"><table><thead><tr>' + cs.map(");
R1("'<details><summary>' + esc(titulo)", "'<details class=\"todos\"><summary>▶ ' + esc(titulo)");
// estilo (una vez): se añade antes de </style> del HTML
R1("{ const LIB = XLSX.readFile(", "rep('</style>', '.larga table{min-width:1700px}.larga td{vertical-align:top;padding:5px 8px}.larga td code{white-space:nowrap;word-break:normal;font-size:12px}.larga td:last-child{min-width:420px;white-space:pre-wrap;word-break:break-word}.larga{max-height:75vh}details.todos{border:2px solid var(--acc);background:var(--soft)}details.todos>summary{font-weight:700;color:var(--acc);padding:10px 4px;cursor:pointer;font-size:1.02em}</style>');\n{ const LIB = XLSX.readFile(");
// el párrafo anterior remite a la tabla de abajo
R1("Todos, con hash, en el libro («Mensajes ETH-ARB»).", "Todos, con hash, en el libro («Mensajes ETH-ARB») y en la tabla desplegable de abajo.");
fs.writeFileSync(f, s); console.log(fallos.length ? 'NO ENCONTRADOS:\n' + fallos.join('\n') : 'ok');
