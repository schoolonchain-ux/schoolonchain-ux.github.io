const fs=require('fs');const f='C:/EquipoIA/research/auditoria-adversarial-2026-10-31/armar-entregables.cjs';let s=fs.readFileSync(f,'utf8');
const a="  ['Reproducción personal del 2.º tramo',";if(s.split(a).length!==2)throw new Error('a');
s=s.replace(a,()=>"  ['Mensajes, polvo y tokens falsos: tablas', 'Se citaban 896 mensajes, 650 + 151 transferencias de polvo y 32 + 60 transferencias de tokens, pero la página mostraba unas pocas filas', 'Tablas completas desplegables con remitente, destinatario, hash y texto: 896, 650, 151, 32 y 60 filas (de las hojas del libro original, sin cambiar datos)', 'Añadido a petición del propietario (1-nov).', 'Petición del propietario 1-nov'],\n"+a);
fs.writeFileSync(f,s);console.log('ok');
