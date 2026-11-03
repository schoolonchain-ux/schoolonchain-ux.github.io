const fs=require('fs');const L=fs.readFileSync('analisis-tramo4.cjs','utf8').split('\n');
const i=L.findIndex(l=>l==="  console.log('");if(i<0)throw new Error('no');
L.splice(i,2,"  console.log('\n"+L[i+1]);
fs.writeFileSync('analisis-tramo4.cjs',L.join('\n'));
