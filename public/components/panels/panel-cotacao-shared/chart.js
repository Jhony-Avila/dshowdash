/**
 * panel-cotacao-shared/chart.js — Renderer SVG estilo Google Finance. @version 3.0.0
 * Área/linha/velas, volume, overlays (SMA/EMA/Bollinger), marcadores Máx/Mín, comparação (rebase %),
 * osciladores em sub-painéis (RSI, MACD), crosshair+tooltip. Sem dependências.
 */
const NS = "http://www.w3.org/2000/svg";
const el = (n, attrs) => { const e = document.createElementNS(NS, n); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

function pad2(n) { return n < 10 ? "0" + n : "" + n; }
function fmtDateUTC(ms, withTime) {
  const d = new Date(ms); const base = d.getUTCDate() + "/" + (d.getUTCMonth() + 1);
  if (withTime) return base + ", " + pad2(d.getUTCHours()) + ":" + pad2(d.getUTCMinutes()) + " UTC";
  return base + "/" + String(d.getUTCFullYear()).slice(2);
}
function fmtPrice(v, fmt) {
  if (v == null || isNaN(v)) return "--";
  if (fmt === "usd") return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}
function fmtPct(v) { if (v == null || isNaN(v)) return ""; return (v >= 0 ? "+" : "") + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%"; }
function fmtVol(v) { if (v == null || isNaN(v)) return ""; const a = Math.abs(v); if (a >= 1e12) return (v / 1e12).toFixed(1) + "T"; if (a >= 1e9) return (v / 1e9).toFixed(1) + "B"; if (a >= 1e6) return (v / 1e6).toFixed(1) + "M"; if (a >= 1e3) return (v / 1e3).toFixed(1) + "K"; return "" + Math.round(v); }

export function computeSMA(points, period) {
  if (!points || points.length < period) return [];
  const out = []; let sum = 0;
  for (let i = 0; i < points.length; i++) { sum += points[i][1]; if (i >= period) sum -= points[i - period][1]; if (i >= period - 1) out.push([points[i][0], sum / period]); }
  return out;
}
export function computeEMA(points, period) {
  if (!points || points.length < period) return [];
  const k = 2 / (period + 1); const out = [];
  let ema = points.slice(0, period).reduce((a, p) => a + p[1], 0) / period; out.push([points[period - 1][0], ema]);
  for (let i = period; i < points.length; i++) { ema = points[i][1] * k + ema * (1 - k); out.push([points[i][0], ema]); }
  return out;
}
export function computeBollinger(points, period, mult) {
  mult = mult || 2; if (!points || points.length < period) return { upper: [], mid: [], lower: [] };
  const upper = [], mid = [], lower = [];
  for (let i = period - 1; i < points.length; i++) {
    let sum = 0; for (let j = i - period + 1; j <= i; j++) sum += points[j][1]; const m = sum / period;
    let vs = 0; for (let j = i - period + 1; j <= i; j++) vs += (points[j][1] - m) ** 2; const sd = Math.sqrt(vs / period);
    const t = points[i][0]; mid.push([t, m]); upper.push([t, m + mult * sd]); lower.push([t, m - mult * sd]);
  }
  return { upper, mid, lower };
}
export function computeRSI(points, period) {
  period = period || 14; if (!points || points.length <= period) return [];
  const out = []; let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) { const d = points[i][1] - points[i - 1][1]; if (d >= 0) gain += d; else loss -= d; }
  gain /= period; loss /= period;
  const rsi = (g, l) => l === 0 ? 100 : 100 - 100 / (1 + g / l);
  out.push([points[period][0], rsi(gain, loss)]);
  for (let i = period + 1; i < points.length; i++) {
    const d = points[i][1] - points[i - 1][1]; const g = d > 0 ? d : 0, l = d < 0 ? -d : 0;
    gain = (gain * (period - 1) + g) / period; loss = (loss * (period - 1) + l) / period;
    out.push([points[i][0], rsi(gain, loss)]);
  }
  return out;
}
function emaSeq(vals, period) { const k = 2 / (period + 1); const out = []; let e = vals.slice(0, period).reduce((a, b) => a + b, 0) / period; out[period - 1] = e; for (let i = period; i < vals.length; i++) { e = vals[i] * k + e * (1 - k); out[i] = e; } return out; }
export function computeMACD(points, fast, slow, sig) {
  fast = fast || 12; slow = slow || 26; sig = sig || 9;
  if (!points || points.length <= slow + sig) return { macd: [], signal: [], hist: [] };
  const vals = points.map(p => p[1]); const ef = emaSeq(vals, fast), es = emaSeq(vals, slow);
  const macdV = []; for (let i = 0; i < vals.length; i++) macdV[i] = (ef[i] != null && es[i] != null) ? ef[i] - es[i] : null;
  const firstM = macdV.findIndex(v => v != null); const macdComp = macdV.slice(firstM);
  const sigC = emaSeq(macdComp, sig);
  const macd = [], signal = [], hist = [];
  for (let i = 0; i < macdComp.length; i++) {
    const t = points[firstM + i][0]; macd.push([t, macdComp[i]]);
    if (sigC[i] != null) { signal.push([t, sigC[i]]); hist.push([t, macdComp[i] - sigC[i]]); }
  }
  return { macd, signal, hist };
}

export function renderChart(mount, opts) {
  mount.innerHTML = "";
  const rect = mount.getBoundingClientRect();
  const W = Math.max(320, Math.round(rect.width || 620));
  const H = Math.max(180, Math.round(rect.height || 260));
  const padL = 8, padR = 64, padT = 12, padB = 22;
  const plotW = W - padL - padR, fullPlotH = H - padT - padB;

  const compareOn = !!(opts.compare && opts.compare.points && opts.compare.points.length);
  const type = compareOn ? "line" : (opts.type || "area");
  const isCandle = type === "candle" && opts.candles && opts.candles.length;
  const volume = (!compareOn && opts.volume && opts.volume.length) ? opts.volume : null;
  const overlays = (!compareOn && opts.overlays) ? opts.overlays : [];
  const markers = !compareOn && opts.markers;
  const oscillators = (!compareOn && opts.oscillators) ? opts.oscillators.filter(o => (o.points && o.points.length) || (o.macd && o.macd.length)) : [];

  const gap = 6, volH = volume ? 42 : 0, oscH = 62;
  const mainH = Math.max(80, fullPlotH - volH - oscillators.length * oscH - (((volume ? 1 : 0) + oscillators.length) * gap));
  const withTime = opts.intraday || opts.range === "1D" || opts.range === "5D";
  const primary = opts.points || [];
  const candles = isCandle ? opts.candles : [];

  let tMin = Infinity, tMax = -Infinity;
  const scanX = (arr) => { for (const p of arr) { if (p[0] < tMin) tMin = p[0]; if (p[0] > tMax) tMax = p[0]; } };
  scanX(isCandle ? candles : primary); if (compareOn) scanX(opts.compare.points);
  if (!isFinite(tMin) || tMin === tMax) { tMin = (tMin || 0) - 1; tMax = (tMax || 0) + 1; }

  const rebase = (pts) => { if (!pts.length) return []; const b = pts[0][1]; return pts.map(p => [p[0], b ? ((p[1] - b) / b) * 100 : 0]); };
  const primVals = compareOn ? rebase(primary) : primary;
  const cmpVals = compareOn ? rebase(opts.compare.points) : [];

  let yMin = Infinity, yMax = -Infinity;
  const scanY = (pts) => { for (const p of pts) { if (p[1] < yMin) yMin = p[1]; if (p[1] > yMax) yMax = p[1]; } };
  if (isCandle) { for (const c of candles) { if (c[3] < yMin) yMin = c[3]; if (c[2] > yMax) yMax = c[2]; } } else scanY(primVals);
  if (compareOn) scanY(cmpVals);
  if (!compareOn && opts.prevClose != null) { if (opts.prevClose < yMin) yMin = opts.prevClose; if (opts.prevClose > yMax) yMax = opts.prevClose; }
  for (const ov of overlays) { if (ov.points) scanY(ov.points); if (ov.upper) { scanY(ov.upper); scanY(ov.lower); } }
  if (!isFinite(yMin)) { yMin = 0; yMax = 1; } if (yMin === yMax) { yMin -= 1; yMax += 1; }
  const yp = (yMax - yMin) * 0.08; yMin -= yp; yMax += yp;

  const xOf = (t) => padL + ((t - tMin) / (tMax - tMin)) * plotW;
  const yOf = (v) => padT + (1 - (v - yMin) / (yMax - yMin)) * mainH;
  const mainBottom = padT + mainH;
  const bottomOfSubs = padT + fullPlotH;

  const svg = el("svg", { class: "cp-chart-svg", width: W, height: H, viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none" });
  const defs = el("defs");
  const gid = "cp-grad-" + Math.round((tMin % 100000 + 100000));
  const grad = el("linearGradient", { id: gid, x1: "0", y1: "0", x2: "0", y2: "1" });
  grad.appendChild(el("stop", { offset: "0%", "stop-color": "currentColor", "stop-opacity": "0.28" }));
  grad.appendChild(el("stop", { offset: "100%", "stop-color": "currentColor", "stop-opacity": "0" }));
  defs.appendChild(grad); svg.appendChild(defs);

  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const v = yMin + (i / yTicks) * (yMax - yMin), y = yOf(v);
    svg.appendChild(el("line", { class: "cp-grid", x1: padL, y1: y, x2: padL + plotW, y2: y }));
    const lbl = el("text", { class: "cp-axis-y", x: W - padR + 6, y: y + 3 }); lbl.textContent = compareOn ? fmtPct(v) : fmtPrice(v, opts.fmt); svg.appendChild(lbl);
  }
  const xTicks = Math.min(6, Math.max(2, (isCandle ? candles.length : primary.length) - 1));
  for (let i = 0; i <= xTicks; i++) {
    const t = tMin + (i / xTicks) * (tMax - tMin), x = xOf(t);
    svg.appendChild(el("line", { class: "cp-grid", x1: x, y1: padT, x2: x, y2: bottomOfSubs }));
    const lbl = el("text", { class: "cp-axis-x", x, y: H - 6, "text-anchor": i === 0 ? "start" : (i === xTicks ? "end" : "middle") }); lbl.textContent = fmtDateUTC(t, withTime && opts.range === "1D"); svg.appendChild(lbl);
  }

  if (!compareOn && opts.prevClose != null) {
    const y = yOf(opts.prevClose);
    svg.appendChild(el("line", { class: "cp-prevclose", x1: padL, y1: y, x2: padL + plotW, y2: y }));
    const tag = el("text", { class: "cp-prevclose-label", x: W - padR + 6, y: y - 4 }); tag.textContent = "Cot. fecho " + fmtPrice(opts.prevClose, opts.fmt); svg.appendChild(tag);
  }

  const toPath = (vals, yf) => vals.map((p, i) => (i ? "L" : "M") + xOf(p[0]).toFixed(1) + "," + (yf || yOf)(p[1]).toFixed(1)).join(" ");

  if (volume) {
    let vMax = 0; for (const v of volume) if (v[1] > vMax) vMax = v[1];
    const vTop = mainBottom + gap, vBot = vTop + volH, yVol = (v) => vBot - (vMax ? (v / vMax) : 0) * (vBot - vTop);
    const bw = Math.max(1, (plotW / volume.length) * 0.7), gv = el("g", { class: "cp-volume" });
    for (const v of volume) { const x = xOf(v[0]); gv.appendChild(el("rect", { x: (x - bw / 2).toFixed(1), y: yVol(v[1]).toFixed(1), width: bw.toFixed(1), height: Math.max(0, vBot - yVol(v[1])).toFixed(1) })); }
    svg.appendChild(gv);
  }

  for (const ov of overlays) {
    if (ov.kind === "bollinger" && ov.upper && ov.upper.length) {
      svg.appendChild(el("path", { class: "cp-boll-band", d: toPath(ov.upper) + " L" + [...ov.lower].reverse().map(p => xOf(p[0]).toFixed(1) + "," + yOf(p[1]).toFixed(1)).join(" L") + " Z" }));
      svg.appendChild(el("path", { class: "cp-boll-line", d: toPath(ov.upper) })); svg.appendChild(el("path", { class: "cp-boll-line", d: toPath(ov.lower) }));
    }
  }

  const gPrim = el("g", { class: "cp-series " + (opts.direction === "down" ? "is-down" : "is-up") });
  if (isCandle) {
    const bw = Math.max(1.2, (plotW / candles.length) * 0.6);
    for (const c of candles) {
      const x = xOf(c[0]), up = c[4] >= c[1], g = el("g", { class: "cp-candle " + (up ? "cup" : "cdown") });
      g.appendChild(el("line", { class: "cp-wick", x1: x.toFixed(1), y1: yOf(c[2]).toFixed(1), x2: x.toFixed(1), y2: yOf(c[3]).toFixed(1) }));
      const yO = yOf(c[1]), yC = yOf(c[4]);
      g.appendChild(el("rect", { class: "cp-body", x: (x - bw / 2).toFixed(1), y: Math.min(yO, yC).toFixed(1), width: bw.toFixed(1), height: Math.max(1, Math.abs(yC - yO)).toFixed(1) }));
      gPrim.appendChild(g);
    }
  } else if (primVals.length) {
    if (type === "area") { const areaD = toPath(primVals) + ` L${xOf(primVals[primVals.length - 1][0]).toFixed(1)},${mainBottom.toFixed(1)} L${xOf(primVals[0][0]).toFixed(1)},${mainBottom.toFixed(1)} Z`; gPrim.appendChild(el("path", { class: "cp-area", d: areaD, fill: `url(#${gid})` })); }
    gPrim.appendChild(el("path", { class: "cp-line", d: toPath(primVals) }));
  }
  svg.appendChild(gPrim);

  for (const ov of overlays) {
    if (ov.kind === "sma" || ov.kind === "ema") { if (ov.points && ov.points.length) { const p = el("path", { class: "cp-ovl cp-ovl-" + ov.kind, d: toPath(ov.points) }); if (ov.color) p.setAttribute("style", "color:" + ov.color); svg.appendChild(p); } }
    else if (ov.kind === "bollinger" && ov.mid && ov.mid.length) svg.appendChild(el("path", { class: "cp-boll-mid", d: toPath(ov.mid) }));
  }

  if (compareOn && cmpVals.length) { const pth = el("path", { class: "cp-line cp-compare-line", d: toPath(cmpVals) }); pth.setAttribute("style", "color:" + (opts.compare.color || "var(--accent-primary)")); svg.appendChild(pth); }

  if (markers && primary.length) {
    let hi = primary[0], lo = primary[0]; for (const p of primary) { if (p[1] > hi[1]) hi = p; if (p[1] < lo[1]) lo = p; }
    [{ p: hi, cls: "hi" }, { p: lo, cls: "lo" }].forEach(({ p, cls }) => {
      const x = xOf(p[0]), y = yOf(p[1]);
      svg.appendChild(el("circle", { class: "cp-marker cp-marker-" + cls, cx: x.toFixed(1), cy: y.toFixed(1), r: 3 }));
      const t = el("text", { class: "cp-marker-label", x: x.toFixed(1), y: (cls === "hi" ? y - 7 : y + 14).toFixed(1), "text-anchor": "middle" }); t.textContent = fmtPrice(p[1], opts.fmt); svg.appendChild(t);
    });
  }

  // osciladores (sub-painéis)
  let oscCursor = mainBottom + (volume ? volH + gap : 0);
  for (const osc of oscillators) {
    const top = oscCursor + gap, bot = top + oscH; oscCursor = bot;
    svg.appendChild(el("line", { class: "cp-osc-sep", x1: padL, y1: top - gap / 2, x2: padL + plotW, y2: top - gap / 2 }));
    const label = el("text", { class: "cp-osc-label", x: padL + 2, y: top + 11 }); label.textContent = osc.kind.toUpperCase(); svg.appendChild(label);
    if (osc.kind === "rsi") {
      const yR = (v) => bot - (v / 100) * (bot - top);
      [30, 50, 70].forEach(g => { svg.appendChild(el("line", { class: g === 50 ? "cp-osc-grid" : "cp-osc-band", x1: padL, y1: yR(g), x2: padL + plotW, y2: yR(g), "stroke-dasharray": g === 50 ? "1 3" : "3 3" })); });
      svg.appendChild(el("path", { class: "cp-osc-line cp-rsi-line", d: toPath(osc.points, yR) }));
    } else if (osc.kind === "macd") {
      let m = 1e-9; const all = [].concat(osc.macd, osc.signal, osc.hist); for (const p of all) m = Math.max(m, Math.abs(p[1]));
      const mid = (top + bot) / 2, yM = (v) => mid - (v / m) * ((bot - top) / 2) * 0.9;
      svg.appendChild(el("line", { class: "cp-osc-grid", x1: padL, y1: mid, x2: padL + plotW, y2: mid }));
      const bw = Math.max(1, (plotW / Math.max(1, osc.hist.length)) * 0.7), gh = el("g", { class: "cp-macd-hist" });
      for (const p of osc.hist) { const x = xOf(p[0]), y = yM(p[1]); const r = el("rect", { class: p[1] >= 0 ? "up" : "down", x: (x - bw / 2).toFixed(1), y: Math.min(mid, y).toFixed(1), width: bw.toFixed(1), height: Math.max(0.5, Math.abs(y - mid)).toFixed(1) }); gh.appendChild(r); }
      svg.appendChild(gh);
      svg.appendChild(el("path", { class: "cp-macd-line", d: toPath(osc.macd, yM) }));
      svg.appendChild(el("path", { class: "cp-macd-signal", d: toPath(osc.signal, yM) }));
    }
  }

  const cross = el("line", { class: "cp-crosshair", x1: 0, y1: padT, x2: 0, y2: bottomOfSubs, visibility: "hidden" });
  const dot = el("circle", { class: "cp-dot", r: 3.5, visibility: "hidden" });
  svg.appendChild(cross); svg.appendChild(dot);
  const tip = document.createElement("div"); tip.className = "cp-tooltip"; tip.style.visibility = "hidden"; mount.appendChild(tip);
  const overlay = el("rect", { class: "cp-overlay", x: padL, y: padT, width: plotW, height: fullPlotH, fill: "transparent" });
  svg.appendChild(overlay); mount.appendChild(svg);

  const nearestIndex = (t, arr) => { if (!arr.length) return -1; let lo = 0, hi = arr.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid][0] < t) lo = mid + 1; else hi = mid; } if (lo > 0 && Math.abs(arr[lo - 1][0] - t) < Math.abs(arr[lo][0] - t)) lo--; return lo; };

  function onMove(ev) {
    const b = svg.getBoundingClientRect(); const mx = (ev.clientX - b.left) * (W / b.width);
    const t = tMin + ((mx - padL) / plotW) * (tMax - tMin); let html, px, py;
    if (isCandle) {
      const idx = nearestIndex(t, candles); if (idx < 0) return; const c = candles[idx]; px = xOf(c[0]); py = yOf(c[4]);
      html = `<span class="cp-tip-date">${fmtDateUTC(c[0], withTime)}</span><span class="cp-tip-val">A ${fmtPrice(c[1], opts.fmt)} · M ${fmtPrice(c[2], opts.fmt)}</span><span class="cp-tip-val">m ${fmtPrice(c[3], opts.fmt)} · F ${fmtPrice(c[4], opts.fmt)}</span>`;
    } else {
      const idx = nearestIndex(t, primary); if (idx < 0) return; const rawP = primary[idx]; px = xOf(rawP[0]); py = yOf(compareOn ? primVals[idx][1] : rawP[1]);
      html = `<span class="cp-tip-date">${fmtDateUTC(rawP[0], withTime)}</span>`;
      if (compareOn) { html += `<span class="cp-tip-val">${opts.pair || ""}: ${fmtPct(primVals[idx][1])}</span>`; const ci = nearestIndex(rawP[0], opts.compare.points); if (ci >= 0) html += `<span class="cp-tip-val cp-tip-cmp">${opts.compare.label}: ${fmtPct(cmpVals[ci][1])}</span>`; }
      else { const base = opts.prevClose || primary[0][1], pct = base ? ((rawP[1] - base) / base) * 100 : 0; html += `<span class="cp-tip-val">Preço: ${fmtPrice(rawP[1], opts.fmt)} <em class="${pct >= 0 ? "up" : "down"}">(${fmtPct(pct)})</em></span>`; }
      if (volume) { const vi = nearestIndex(rawP[0], volume); if (vi >= 0) html += `<span class="cp-tip-vol">Vol: ${fmtVol(volume[vi][1])}</span>`; }
    }
    cross.setAttribute("x1", px); cross.setAttribute("x2", px); cross.setAttribute("visibility", "visible");
    dot.setAttribute("cx", px); dot.setAttribute("cy", py); dot.setAttribute("visibility", "visible");
    tip.innerHTML = html; const bm = mount.getBoundingClientRect();
    let left = (px / W) * bm.width + 12; if (left + 160 > bm.width) left = (px / W) * bm.width - 160;
    tip.style.left = Math.max(4, left) + "px"; tip.style.top = Math.max(4, (py / H) * bm.height - 10) + "px"; tip.style.visibility = "visible";
  }
  function onLeave() { cross.setAttribute("visibility", "hidden"); dot.setAttribute("visibility", "hidden"); tip.style.visibility = "hidden"; }
  overlay.addEventListener("mousemove", onMove); overlay.addEventListener("mouseleave", onLeave);
  return { destroy() { overlay.removeEventListener("mousemove", onMove); overlay.removeEventListener("mouseleave", onLeave); mount.innerHTML = ""; } };
}
