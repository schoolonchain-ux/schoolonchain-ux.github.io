const fs=require('fs');const f='C:/EquipoIA/research/auditoria-adversarial-2026-10-31/armar-entregables.cjs';let s=fs.readFileSync(f,'utf8');
const a="rep('</style>', ";if(s.split(a).length!==2)throw new Error('a');
s=s.replace(a,()=>"  rep('Todos, con hash, en el libro («Mensajes ETH-ARB»).', 'Todos, con hash, en el libro («Mensajes ETH-ARB») y en la tabla desplegable de abajo.');\n"+a);
fs.writeFileSync(f,s);console.log('ok');
