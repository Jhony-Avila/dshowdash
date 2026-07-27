function money(v, currency = "BRL") {
  const n = Number(v ?? 0);
  const cur = currency === "USD" ? "USD" : "BRL";
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: cur }).format(n);
  } catch {
    return (cur === "USD" ? "US$ " : "R$ ") + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
function parseNum(v) {
  if (v === null || v === void 0) return null;
  let s = String(v).trim().replace(/[^\d.,\-]/g, "");
  if (s === "" || s === "-") return null;
  if (s.indexOf(",") !== -1) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function dateBr(v) {
  if (!v) return "\u2014";
  const s = String(v);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
}
function dateTimeBr(v) {
  if (!v) return "\u2014";
  const s = String(v);
  const dt = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (dt) return `${dt[3]}/${dt[2]}/${dt[1]} ${dt[4]}:${dt[5]}`;
  return dateBr(s);
}
export {
  dateBr,
  dateTimeBr,
  money,
  parseNum
};
