(function(){
  function aplicar(fig, modo){
    var svg = fig.querySelector('svg'); var wrap = fig.querySelector('.fwrap'); if(!svg) return;
    var w = Number(svg.getAttribute('data-w')) || 2000;
    if(modo === 'fit'){ svg.style.width = '100%'; svg.style.minWidth = '0'; }
    else { svg.style.width = (w * Number(modo) * 0.6) + 'px'; svg.style.minWidth = svg.style.width; }
    wrap.scrollLeft = 0;
  }
  var figs = document.querySelectorAll('figure');
  figs.forEach(function(fig){
    aplicar(fig, 'fit');
    fig.querySelectorAll('button[data-z]').forEach(function(b){ b.addEventListener('click', function(){ aplicar(fig, b.getAttribute('data-z')); }); });
  });
})();
