const KEY = "koala.theme";
function readTheme() {
  try {
    const t = localStorage.getItem(KEY);
    if (t === "light" || t === "dark") return t;
  } catch {
  }
  try {
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
}
function setTheme(t) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
  }
  applyTheme(t);
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY && (e.newValue === "light" || e.newValue === "dark")) {
      applyTheme(e.newValue);
      try {
        window.dispatchEvent(new CustomEvent("koala:theme", { detail: e.newValue }));
      } catch {
      }
    }
  });
}
export {
  applyTheme,
  readTheme,
  setTheme
};
