const BASE = "/api/koala";
let csrf = null;
function goLogin() {
  window.location.href = "/";
}
async function ensureCsrf() {
  if (csrf) return csrf;
  try {
    const r = await fetch("/api/auth/check.php", { credentials: "include", cache: "no-store" });
    const ct = r.headers.get("content-type") || "";
    if (r.ok && ct.includes("application/json")) {
      const j = await r.json();
      csrf = j?.csrf_token ?? j?.data?.csrf_token ?? j?.data?.session?.csrf_token ?? "";
    } else {
      csrf = "";
    }
  } catch {
    csrf = "";
  }
  return csrf || "";
}
async function parse(r) {
  if (r.status === 401) {
    goLogin();
    throw new Error("AUTH");
  }
  const j = await r.json().catch(() => ({ ok: false, error: "PARSE_ERROR" }));
  if (!j.ok) {
    const err = new Error(j.error || "ERRO");
    err.meta = j.meta ?? null;
    throw err;
  }
  return j.data;
}
async function apiGet(path) {
  return parse(await fetch(BASE + path, { credentials: "include", cache: "no-store" }));
}
async function apiUpload(path, form) {
  const token = await ensureCsrf();
  return parse(
    await fetch(BASE + path, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "X-CSRF-Token": token },
      body: form
    })
  );
}
async function apiSend(method, path, body) {
  const token = await ensureCsrf();
  return parse(
    await fetch(BASE + path, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": token },
      body: body !== void 0 ? JSON.stringify(body) : void 0
    })
  );
}
export {
  apiGet,
  apiSend,
  apiUpload,
  goLogin
};
