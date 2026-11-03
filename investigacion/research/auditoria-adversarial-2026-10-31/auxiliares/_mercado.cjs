const t0 = Date.UTC(2026, 9, 29, 0, 0);
const get = async s => { const r = await fetch('https://api.binance.com/api/v3/klines?symbol=' + s + '&interval=1h&startTime=' + t0 + '&limit=200'); const k = await r.json(); const m = {}; for (const x of k) m[x[0]] = +x[4]; return m; };
(async () => {
  const S = {}; for (const s of ['TRXUSDT', 'BTCUSDT', 'ETHUSDT']) S[s] = await get(s);
  const ult = Math.max(...Object.keys(S.TRXUSDT).map(Number));
  const v = (s, t) => S[s][Math.floor(t / 3600000) * 3600000];
  const ventanas = [['29-oct 21:00 → 30-oct 12:00', Date.UTC(2026, 9, 29, 21), Date.UTC(2026, 9, 30, 12)], ['30-oct 12:00 → 31-oct 10:00', Date.UTC(2026, 9, 30, 12), Date.UTC(2026, 9, 31, 10)], ['31-oct 10:00 → último dato', Date.UTC(2026, 9, 31, 10), ult]];
  for (const [n, a, b] of ventanas) console.log(n.padEnd(30), ['TRXUSDT', 'BTCUSDT', 'ETHUSDT'].map(s => s.slice(0, 3) + ' ' + ((v(s, b) / v(s, a) - 1) * 100).toFixed(2) + '%').join(' | '));
  console.log('último dato', new Date(ult).toISOString().slice(0, 16));
})();
