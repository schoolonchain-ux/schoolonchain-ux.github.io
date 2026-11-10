# Contraste independiente de los calculos del Observatorio de mercado.
# Recalcula con numpy, sobre el mismo data/mercado.json, lo que la pagina calcula con assets/mercado-calc.js,
# y compara con el volcado que hace tools/contraste-mercado.cjs. No comparte codigo con la pagina.
# Uso: py tools/contraste-mercado.py data/mercado.json volcado.json
import json, sys, math
import numpy as np

datos = json.load(open(sys.argv[1], encoding='utf-8'))
volc = json.load(open(sys.argv[2], encoding='utf-8'))

def serie(a):
    return np.array([np.nan if x is None else float(x) for x in a['c']], dtype=float)

def retornos(c):
    r = np.full(len(c), np.nan)
    ok = (~np.isnan(c[1:])) & (~np.isnan(c[:-1])) & (c[1:] > 0) & (c[:-1] > 0)
    r[1:][ok] = np.log(c[1:][ok] / c[:-1][ok])
    return r

def ultimo(c):
    idx = np.where(~np.isnan(c))[0]
    return int(idx[-1]) if len(idx) else -1

def vol_en(r, n, fin):
    if fin - n + 1 < 1: return None
    v = r[fin - n + 1: fin + 1]
    if np.isnan(v).any(): return None
    return float(np.std(v, ddof=1) * math.sqrt(365) * 100)

def pares(a, b, n, salto=0):
    ra, rb = retornos(a), retornos(b)
    fin = min(ultimo(a), ultimo(b)) - salto
    x, y = [], []
    i = fin
    while i >= 1 and len(x) < n:
        if not np.isnan(ra[i]) and not np.isnan(rb[i]):
            x.append(ra[i]); y.append(rb[i])
        i -= 1
    return (np.array(x), np.array(y)) if len(x) == n else None

def corr(a, b, n, salto=0):
    p = pares(a, b, n, salto)
    if p is None: return None
    x, y = p
    if np.var(x) == 0 or np.var(y) == 0: return None
    return float(np.corrcoef(x, y)[0, 1])

def beta(a, ref, n):
    p = pares(a, ref, n)
    if p is None: return None
    x, y = p
    vy = np.var(y, ddof=1)
    return float(np.cov(x, y, ddof=1)[0, 1] / vy) if vy > 0 else None

btc = serie(datos['activos'][0])
peor = {}
faltan = 0
hechas = 0
def cmp(clave, s, mio, suyo):
    global faltan, hechas
    hechas += 1
    if mio is None or suyo is None:
        if mio is not suyo: faltan += 1; print('DISTINTO (uno sin dato):', s, clave, mio, suyo)
        return
    d = abs(mio - suyo)
    if d > peor.get(clave, (0, ''))[0]: peor[clave] = (d, s)

for a in datos['activos']:
    s = a['s']; c = serie(a); r = retornos(c); u = ultimo(c); v = volc[s]
    for n in (7, 30, 90):
        cmp('vol%d' % n, s, vol_en(r, n, u), v['vol%d' % n])
        i = u - n
        cmp('rend%d' % n, s, (float(c[u] / c[i] - 1) if i >= 0 and not np.isnan(c[i]) else None), v['rend%d' % n])
    sv = [vol_en(r, 30, i) for i in range(30, len(c))]
    sv = [x for x in sv if x is not None]
    cmp('percentil30', s, (float(sum(1 for x in sv if x <= sv[-1]) / len(sv) * 100) if len(sv) >= 60 else None), v['percentil30'])
    for n in (30, 90):
        cmp('corr%d' % n, s, corr(c, btc, n), v['corr%d' % n])
    cmp('corr30previa', s, corr(c, btc, 30, 30), v['corr30previa'])
    cmp('beta90', s, beta(c, btc, 90), v['beta90'])

# --- entrega 1: rendimiento a un ano, mediana por sector (np.median) y cambios por cadena
por_s = {a['s']: serie(a) for a in datos['activos']}
def rend(c, n):
    u = ultimo(c); i = u - n
    if u < 0 or i < 0 or np.isnan(c[i]) or c[i] <= 0: return None
    return float(c[u] / c[i] - 1)
for a in datos['activos']:
    cmp('rend365', a['s'], rend(por_s[a['s']], 365), volc[a['s']]['rend365'])
n_sec = 0
for x in datos.get('sectoresCesta', []):
    if 'miembros' not in x: continue
    n_sec += 1; v = volc['__sectores'][x['id']]
    for n in (7, 30, 90, 365):
        rs = [r for r in (rend(por_s[m], n) for m in x['miembros']) if r is not None]
        hay = len(rs) >= 3
        cmp('sector_mediana%d' % n, x['id'], (float(np.median(np.array(rs))) if hay else None), v['m%d' % n])
        cmp('sector_n%d' % n, x['id'], (float(len(rs)) if hay else None), v['n%d' % n])
        cmp('sector_suben%d' % n, x['id'], (float(sum(1 for r in rs if r >= 0)) if hay else None), v['s%d' % n])
    # camino a 30 dias: mediana, dia a dia, de lo que lleva cada activo desde hace 30 dias
    base = []
    for m in x['miembros']:
        c = por_s[m]; u = ultimo(c)
        if u >= 30 and not np.isnan(c[u - 30]) and c[u - 30] > 0: base.append((c, u))
    for k in range(30, -1, -1):
        vals = [float(c[u - k] / c[u - 30] - 1) for (c, u) in base if not np.isnan(c[u - k])]
        cmp('sector_camino30', x['id'], (float(np.median(np.array(vals))) if len(vals) >= 3 else None), v['camino30'][30 - k])
n_red = 0
for r in datos.get('redes', {}).get('filas', []):
    v = volc['__redes'][r['nombre']]; n_red += 1
    for k in ('tvl', 'st'):
        if k not in r: continue
        c = np.array([np.nan if q is None else float(q) for q in r[k]], dtype=float)
        for n in (1, 7, 30, 90, 365):
            cmp('red_%s%d' % (k, n), r['nombre'], rend(c, n), v['%s%d' % (k, n)])
print('sectores contrastados:', n_sec, '| cadenas contrastadas:', n_red)
print('comparaciones hechas:', hechas)
print('activos:', len(datos['activos']), '| casos con dato en un lado y no en el otro:', faltan)
for k in sorted(peor): print('  diferencia maxima en %-13s %.3e  (%s)' % (k, peor[k][0], peor[k][1]))
mx = max([p[0] for p in peor.values()] or [0])
print('RESULTADO:', 'COINCIDEN' if faltan == 0 and mx < 1e-8 else 'NO COINCIDEN', '(mayor diferencia %.3e)' % mx)
sys.exit(0 if faltan == 0 and mx < 1e-8 else 1)
