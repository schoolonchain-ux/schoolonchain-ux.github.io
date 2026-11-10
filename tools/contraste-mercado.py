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
# --- entrega 2: maximo de un ano y de toda la serie (valor, hace cuanto, caida) y volatilidad esperada (Deribit) frente a la realizada
def maximo(c, n):
    u = ultimo(c)
    if u < 0: return None
    ini = max(0, u - n + 1); w = c[ini:u + 1].copy(); w[~(w > 0)] = np.nan
    if np.isnan(w).all(): return None
    k = len(w) - 1 - int(np.nanargmax(w[::-1]))  # con empate, el mas reciente
    return (float(w[k]), float(u - (ini + k)), float(c[u] / w[k] - 1))
for a in datos['activos']:
    c = por_s[a['s']]; v = volc[a['s']]
    for n, k in ((365, 'max365'), (len(datos['dias']), 'maxTodo')):
        m = maximo(c, n)
        for j, campo in enumerate(('valor', 'hace', 'caida')): cmp(k + '_' + campo, a['s'], (m[j] if m else None), v[k + campo])
n_esp = 0
for x in datos.get('esperada', {}).get('filas', []):
    if 'v' not in x or x['s'] not in por_s: continue
    n_esp += 1; v = volc['__esperada'][x['s']]; c = por_s[x['s']]; r = retornos(c); u = ultimo(c)
    e = np.array([np.nan if q is None else float(q) for q in x['v']], dtype=float)
    real = np.array([np.nan if (i < 30 or vol_en(r, 30, i) is None) else vol_en(r, 30, i) for i in range(len(c))], dtype=float)
    hist = e[~np.isnan(e)]
    cmp('esp_hoy', x['s'], float(hist[-1]), v['hoy'])
    cmp('esp_percentil', x['s'], (float((hist <= hist[-1]).sum() / len(hist) * 100) if len(hist) >= 60 else None), v['percentil'])
    cmp('esp_dif_hoy', x['s'], float(hist[-1] - vol_en(r, 30, u)), v['dif'])
    antes = e[:-30]; desp = real[30:]; ok = (~np.isnan(antes)) & (~np.isnan(desp)); dif = antes[ok] - desp[ok]
    hay = len(dif) >= 60
    cmp('esp_pares', x['s'], (float(len(dif)) if hay else None), v['n'])
    cmp('esp_mas', x['s'], (float((dif > 0).sum()) if hay else None), v['mas'])
    cmp('esp_mediana_dif', x['s'], (float(np.median(dif)) if hay else None), v['medianaDif'])
    cmp('esp_ult_esperada', x['s'], (float(antes[ok][-1]) if hay else None), v['ultEsperada'])
    cmp('esp_ult_ocurrida', x['s'], (float(desp[ok][-1]) if hay else None), v['ultOcurrida'])
# --- entrega 3: matriz de correlacion de toda la cesta y correlacion de una pareja dia a dia (np.corrcoef sobre los n dias comunes que acaban cada dia)
ret = {k: retornos(v) for k, v in por_s.items()}; ult = {k: ultimo(v) for k, v in por_s.items()}
def corr_fin(ra, rb, n, fin):
    ok = np.where((~np.isnan(ra[1:fin + 1])) & (~np.isnan(rb[1:fin + 1])))[0] + 1
    if len(ok) < n: return None
    k = ok[-n:]; x = ra[k]; y = rb[k]
    if np.var(x) == 0 or np.var(y) == 0: return None
    return float(np.corrcoef(x, y)[0, 1])
orden = volc['__matriz']['orden']; n_par = 0
for i, a in enumerate(orden):
    for j, b in enumerate(orden):
        if j < i: continue
        n_par += 1; fin = min(ult[a], ult[b])
        for clave, n, salto in (('m30', 30, 0), ('m30prev', 30, 30), ('m90', 90, 0), ('m90prev', 90, 90)):
            cmp('matriz_' + clave, a + '-' + b, corr_fin(ret[a], ret[b], n, fin - salto), volc['__matriz'][clave][i][j])
            if volc['__matriz'][clave][i][j] != volc['__matriz'][clave][j][i]: faltan += 1; print('MATRIZ NO SIMETRICA:', clave, a, b)
n_ser = 0
for clave, serie_pag in volc['__serieCorr'].items():
    a, b = clave.split('|'); n_ser += 1; fin = min(ult[a], ult[b])
    for i in range(len(serie_pag)):
        cmp('serie_corr30', clave, (corr_fin(ret[a], ret[b], 30, i) if 30 <= i <= fin else None), serie_pag[i])
print('sectores contrastados:', n_sec, '| cadenas contrastadas:', n_red, '| monedas con volatilidad esperada:', n_esp, '| parejas de la matriz:', n_par, '| parejas dia a dia:', n_ser)
print('comparaciones hechas:', hechas)
print('activos:', len(datos['activos']), '| casos con dato en un lado y no en el otro:', faltan)
for k in sorted(peor): print('  diferencia maxima en %-13s %.3e  (%s)' % (k, peor[k][0], peor[k][1]))
mx = max([p[0] for p in peor.values()] or [0])
print('RESULTADO:', 'COINCIDEN' if faltan == 0 and mx < 1e-8 else 'NO COINCIDEN', '(mayor diferencia %.3e)' % mx)
sys.exit(0 if faltan == 0 and mx < 1e-8 else 1)
