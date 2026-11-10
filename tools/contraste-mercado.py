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
def cmp(clave, s, mio, suyo):
    global faltan
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

print('activos:', len(datos['activos']), '| casos con dato en un lado y no en el otro:', faltan)
for k in sorted(peor): print('  diferencia maxima en %-13s %.3e  (%s)' % (k, peor[k][0], peor[k][1]))
mx = max([p[0] for p in peor.values()] or [0])
print('RESULTADO:', 'COINCIDEN' if faltan == 0 and mx < 1e-8 else 'NO COINCIDEN', '(mayor diferencia %.3e)' % mx)
sys.exit(0 if faltan == 0 and mx < 1e-8 else 1)
