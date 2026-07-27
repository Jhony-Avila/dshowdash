import { PANELS_API, PANELS_API_QUERY } from "./constants.js";
async function fetchRealPanels(opts = {}) {
  try {
    const res = await fetch(`${PANELS_API}${PANELS_API_QUERY}`, {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal: opts.signal
    });
    if (!res.ok) return [];
    const json = await res.json();
    const data = Array.isArray(json?.data) ? json.data : [];
    return data.map(
      (p) => ({
        panel_id: String(p.panel_id),
        title: String(p.title ?? p.panel_id),
        category: String(p.category ?? ""),
        icon: p.icon ?? null,
        is_active: Boolean(p.is_active)
      })
    );
  } catch {
    return [];
  }
}
export {
  fetchRealPanels
};
