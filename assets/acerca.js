/* Página «Acerca»: las redes y el aviso legal salen de la marca del sitio (assets/marca.js), para no escribirlos dos veces. */
document.addEventListener('DOMContentLoaded', () => {
  const M = window.MARCA; if (!M) return;
  const lista = () => { const f = document.createDocumentFragment(); M.enlaces.forEach((e, i) => { if (i) f.append(' · '); const a = document.createElement('a'); a.href = e.u; a.target = '_blank'; a.rel = 'noopener'; a.textContent = e.k === 'tg' ? 'Telegram (' + e.u.split('://').pop() + ')' : 'X: ' + e.t; f.append(a); }); return f; };
  for (const id of ['acerca-redes', 'acerca-contacto']) { const c = document.getElementById(id); if (c) c.replaceChildren(lista()); }
  const av = document.getElementById('acerca-aviso'); if (av) av.textContent = M.aviso;
  const b = document.getElementById('copiar-rss');
  if (b) b.addEventListener('click', () => { const u = b.getAttribute('data-url'); const ok = () => { b.textContent = 'Copiada'; setTimeout(() => { b.textContent = 'Copiar la dirección'; }, 1500); }; if (navigator.clipboard) navigator.clipboard.writeText(u).then(ok).catch(() => { b.textContent = u; }); else b.textContent = u; });
});
