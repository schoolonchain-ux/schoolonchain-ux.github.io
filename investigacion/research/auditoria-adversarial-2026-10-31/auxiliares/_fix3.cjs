const fs=require('fs');const f='traza-tramo4.cjs';let s=fs.readFileSync(f,'utf8');
const a="if (v.via === 'retirada') {";if(s.split(a).length!==2)throw new Error('ancla');
s=s.replace(a,"if (v.via === 'retirada' || v.via === 'recolector') {");
s=s.replace("via: 'retirada' }); if (c.tipo","via: v.via }); if (c.tipo");
fs.writeFileSync(f,s);
