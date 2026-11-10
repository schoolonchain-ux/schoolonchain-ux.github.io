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
# --- entrega 5: los hechos de la lectura del dia (ultimo dia cerrado, estado y desacoples de hoy y con los datos hasta ayer, capital y libros)
import os
lec = volc.get('__lectura') or {}; n_lec = 0
fin = len(datos['dias']) - 1
def r1(s):
    c = por_s[s]
    if ultimo(c) != fin or np.isnan(c[fin - 1]) or c[fin - 1] <= 0: return None
    return float(c[fin] / c[fin - 1] - 1)
def num(x): return None if x is None else float(x)
dia = [(a['s'], r1(a['s'])) for a in datos['activos']]; dia = [q for q in dia if q[1] is not None]
if lec.get('dia') or len(dia) >= 10:
    v = lec['dia']; rs = np.array([q[1] for q in dia]); n_lec += 1
    cmp('lec_dia_n', 'cesta', float(len(rs)), num(v['n'])); cmp('lec_dia_suben', 'cesta', float((rs >= 0).sum()), num(v['suben'])); cmp('lec_dia_mediana', 'cesta', float(np.median(rs)), v['mediana'])
    cmp('lec_dia_btc', 'BTC', r1('BTC'), v['btc']); cmp('lec_dia_eth', 'ETH', r1('ETH') if 'ETH' in por_s else None, v['eth']); cmp('lec_dia_mejor', 'cesta', float(rs.max()), v['mejor']); cmp('lec_dia_peor', 'cesta', float(rs.min()), v['peor'])
    vistos = 0
    for x in datos.get('sectoresCesta', []):
        q = [r for r in (r1(m) for m in x.get('miembros', []) if m in por_s) if r is not None]; suyo = v['sectores'].get(x['id'])
        if len(q) >= 3:
            vistos += 1; cmp('lec_sector_dia', x['id'], float(np.median(np.array(q))), suyo['mediana'] if suyo else None); cmp('lec_sector_dia_n', x['id'], float(len(q)), num(suyo['n']) if suyo else None)
        elif suyo is not None: faltan += 1; print('SECTOR DE MAS EN LA LECTURA:', x['id'])
    cmp('lec_sectores', 'cesta', float(vistos), float(len(v['sectores'])))
hoy = str(datos.get('leidoEn', ''))[:10]; filas = []
try: filas = json.load(open(os.path.join(os.path.dirname(sys.argv[1]), 'mercado-serie.json'), encoding='utf-8')).get('filas', [])
except Exception: filas = []
antes = sorted([f for f in filas if f.get('dia') and f['dia'] < hoy], key=lambda f: f['dia']); previa = antes[-1] if antes else None
if lec.get('capital'):
    v = lec['capital']; g = datos['global']; st = datos['stables']; n_lec += 1; y = st['serie']
    cmp('lec_cap_stables', 'mercado', float(st['totalUsd'] / g['capTotalUsd'] * 100), v['st'])
    cmp('lec_cap_stables30', 'mercado', (float(y[-1][1] / y[-31][1] - 1) if len(y) > 30 else None), v['c30'])
    cmp('lec_cap_previa', 'mercado', (float(g['dominanciaPct']['btc'] - previa['btcPct']) if previa and previa.get('btcPct') is not None else None), v['previaDif'])
if lec.get('liquidez'):
    v = lec['liquidez']; n_lec += 1; L = [x for x in datos['liquidez']['filas'] if not x.get('fallo') and x.get('compras') is not None and x.get('ventas') is not None]
    C = float(sum(x['compras'] for x in L)); V = float(sum(x['ventas'] for x in L))
    cmp('lec_liq_n', 'libros', float(len(L)), num(v['n'])); cmp('lec_liq_compras', 'libros', C, num(v['compras'])); cmp('lec_liq_ventas', 'libros', V, num(v['ventas'])); cmp('lec_liq_deseq', 'libros', (C - V) / (C + V), v['desequilibrio']); cmp('lec_liq_mas', 'libros', float(sum(1 for x in L if x['compras'] > x['ventas'])), num(v['masComprador']))
    lp = (previa or {}).get('libros') or {}; com = [x for x in L if x['s'] in lp and lp[x['s']].get('compras') is not None and lp[x['s']].get('ventas') is not None]
    a = float(sum(x['compras'] + x['ventas'] for x in com)); b = float(sum(lp[x['s']]['compras'] + lp[x['s']]['ventas'] for x in com))
    cmp('lec_liq_previa', 'libros', (a / b - 1 if com and b > 0 else None), v['previaCambio'])
def perc_estado(c, quita):
    r = retornos(c); tope = len(c) - quita
    sv = [vol_en(r, 30, i) for i in range(30, tope)]; sv = [x for x in sv if x is not None]
    if len(sv) < 60: return None, None
    p = float(sum(1 for x in sv if x <= sv[-1]) / len(sv) * 100)
    return p, ('extremo' if p >= 95 else 'agitado' if p >= 75 else 'normal' if p >= 25 else 'calma')
if lec.get('vol'):
    v = lec['vol']; n_lec += 1; alt = 0; alt_a = 0; con = 0; con_a = 0
    for a in datos['activos']:
        p, e = perc_estado(por_s[a['s']], 0); pa, ea = perc_estado(por_s[a['s']], 1)
        cmp('lec_vol_percentil_ayer', a['s'], pa, v['pAyer'].get(a['s']))
        con += e is not None; con_a += ea is not None; alt += e in ('agitado', 'extremo'); alt_a += ea in ('agitado', 'extremo')
    cmp('lec_vol_n', 'cesta', float(con), num(v['n'])); cmp('lec_vol_altos', 'cesta', float(alt), num(v['altos'])); cmp('lec_vol_n_ayer', 'cesta', float(con_a), num(v['nAyer'])); cmp('lec_vol_altos_ayer', 'cesta', float(alt_a), num(v['altosAyer']))
    xe = [x for x in datos.get('esperada', {}).get('filas', []) if x.get('s') == datos['activos'][0]['s'] and 'v' in x]
    if xe:
        e = np.array([np.nan if q is None else float(q) for q in xe[0]['v']], dtype=float); ue = ultimo(e); cb = por_s[datos['activos'][0]['s']]
        cmp('lec_vol_esperada', 'BTC', (float(e[ue] - vol_en(retornos(cb), 30, ultimo(cb))) if ue >= fin - 1 else None), v['espDif'])
if lec.get('des'):
    v = lec['des']; n_lec += 1; c30s = []; prevs = []; nl = 0; ne = 0; ns = 0
    for a in datos['activos'][1:]:
        c = por_s[a['s']]; k = corr(c, btc, 30); p = corr(c, btc, 30, 30); ka = corr(c, btc, 30, 1); pa = corr(c, btc, 30, 31)
        h = None if k is None or p is None else (1.0 if k - p <= -0.2 else 0.0); ay = None if ka is None or pa is None else (1.0 if ka - pa <= -0.2 else 0.0)
        cmp('lec_des_hoy', a['s'], h, num(v['hoy'].get(a['s']))); cmp('lec_des_ayer', a['s'], ay, num(v['ayer'].get(a['s'])))
        if h is None: continue
        c30s.append(k); prevs.append(p); nl += h == 1.0; ne += (h == 1.0 and ay == 0.0); ns += (h == 0.0 and ay == 1.0)
    cmp('lec_des_n', 'cesta', float(len(c30s)), num(v['n'])); cmp('lec_des_lista', 'cesta', float(nl), num(v['lista'])); cmp('lec_des_entran', 'cesta', float(ne), num(v['entran'])); cmp('lec_des_salen', 'cesta', float(ns), num(v['salen']))
    cmp('lec_des_mediana', 'cesta', float(np.median(np.array(c30s))), v['medianaHoy']); cmp('lec_des_mediana_antes', 'cesta', float(np.median(np.array(prevs))), v['medianaAntes'])
print('puntos de la lectura del dia contrastados:', n_lec)
print('sectores contrastados:', n_sec, '| cadenas contrastadas:', n_red, '| monedas con volatilidad esperada:', n_esp, '| parejas de la matriz:', n_par, '| parejas dia a dia:', n_ser)
print('comparaciones hechas:', hechas)
print('activos:', len(datos['activos']), '| casos con dato en un lado y no en el otro:', faltan)
for k in sorted(peor): print('  diferencia maxima en %-13s %.3e  (%s)' % (k, peor[k][0], peor[k][1]))
mx = max([p[0] for p in peor.values()] or [0])
print('RESULTADO:', 'COINCIDEN' if faltan == 0 and mx < 1e-8 else 'NO COINCIDEN', '(mayor diferencia %.3e)' % mx)
sys.exit(0 if faltan == 0 and mx < 1e-8 else 1)
