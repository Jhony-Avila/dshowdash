const VERSION = "0.1.0-TRACK-D-W2";
const MODULE_ID = "app-shell.responsive-adapter.mobile-shell";
let _ligado = false;
let _cleanups = [];
const q = (s, r = document) => {
  try {
    return r.querySelector(s);
  } catch {
    return null;
  }
};
const qa = (s, r = document) => {
  try {
    return [...r.querySelectorAll(s)];
  } catch {
    return [];
  }
};
const on = (el, ev, fn, opts) => {
  if (!el) return;
  el.addEventListener(ev, fn, opts);
  _cleanups.push(() => el.removeEventListener(ev, fn, opts));
};
const FOCAVEIS = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
let _origemFoco = null;
const inertAlvos = () => ["header", "ticker", "nav-rail", "main", "footer"].map((r) => q(`.dsd-shell__region--${r}`)).filter(Boolean);
function drawerAberto() {
  const d = q(".dsd-sidebar");
  return !!d && d.classList.contains("dsd-sidebar--mobile-open");
}
function abrirDrawer() {
  const drawer = q(".dsd-sidebar");
  if (!drawer) return;
  _origemFoco = document.activeElement || null;
  drawer.classList.add("dsd-sidebar--mobile-open");
  drawer.setAttribute("role", "dialog");
  drawer.setAttribute("aria-modal", "true");
  const ov = q(".dsd-sidebar-overlay");
  if (ov) {
    ov.classList.add("dsd-sidebar-overlay--visible");
    ov.hidden = false;
  }
  document.body.classList.add("sidebar-mobile-open");
  inertAlvos().forEach((el) => {
    el.setAttribute("aria-hidden", "true");
    el.inert = true;
  });
  const btnToggle = q('[aria-controls="app-sidebar"],[data-action="sidebar.toggle"]');
  if (btnToggle) btnToggle.setAttribute("aria-expanded", "true");
  const primeiro = q(FOCAVEIS, drawer) || drawer;
  try {
    primeiro.setAttribute("tabindex", primeiro === drawer ? "-1" : primeiro.getAttribute("tabindex") || "0");
    primeiro.focus();
  } catch {
  }
}
function fecharDrawer() {
  const drawer = q(".dsd-sidebar");
  if (!drawer) return;
  drawer.classList.remove("dsd-sidebar--mobile-open");
  drawer.removeAttribute("aria-modal");
  const ov = q(".dsd-sidebar-overlay");
  if (ov) {
    ov.classList.remove("dsd-sidebar-overlay--visible");
    ov.hidden = true;
  }
  document.body.classList.remove("sidebar-mobile-open");
  inertAlvos().forEach((el) => {
    el.removeAttribute("aria-hidden");
    el.inert = false;
  });
  const btnToggle = q('[aria-controls="app-sidebar"],[data-action="sidebar.toggle"]');
  if (btnToggle) btnToggle.setAttribute("aria-expanded", "false");
  try {
    _origemFoco?.focus();
  } catch {
  }
  _origemFoco = null;
}
let _drawerWired = false;
function wireDrawer() {
  if (_drawerWired) return;
  _drawerWired = true;
  on(document, "keydown", (e) => {
    const ev = e;
    if (!drawerAberto()) return;
    if (ev.key === "Escape") {
      ev.preventDefault();
      fecharDrawer();
      return;
    }
    if (ev.key === "Tab") {
      const drawer = q(".dsd-sidebar");
      if (!drawer) return;
      const foc = qa(FOCAVEIS, drawer).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!foc.length) return;
      const primeiro = foc[0], ultimo = foc[foc.length - 1];
      if (ev.shiftKey && document.activeElement === primeiro) {
        ev.preventDefault();
        ultimo.focus();
      } else if (!ev.shiftKey && document.activeElement === ultimo) {
        ev.preventDefault();
        primeiro.focus();
      }
    }
  });
  on(window, "hashchange", () => {
    if (drawerAberto()) fecharDrawer();
  });
  on(window, "orientationchange", () => {
    if (drawerAberto()) fecharDrawer();
  });
  on(document, "click", (e) => {
    const tgt = e.target;
    if (tgt?.closest?.('[data-action="sidebar.toggle"],[data-navrail-id="toggle-sidebar"]')) {
      e.preventDefault();
      drawerAberto() ? fecharDrawer() : abrirDrawer();
      return;
    }
    if (tgt?.closest?.(".dsd-sidebar-overlay")) {
      if (drawerAberto()) fecharDrawer();
    }
  });
  _cleanups.push(() => {
    _drawerWired = false;
    if (drawerAberto()) fecharDrawer();
  });
}
const STRIP_KEYS = ["errors-status", "real-time-clock", "environment-chip", "weather-sp", "currency-rotator"];
const BAND1_KEEP = ["notifications", "user-menu"];
const HIDE_KEYS = ["logo"];
const WRAP_SEL = ".header-component-wrapper,.header-component-fallback";
const EXTRA_STRIP_SEL = "[data-hdr-strip-extra]";
const isWrap = (n) => n.classList.contains("header-component-wrapper") || n.classList.contains("header-component-fallback");
const keyOf = (w) => w.getAttribute("data-component-key") || w.getAttribute("data-component") || "";
function wireCompactHeader() {
  const header = q(".site-header");
  if (!header) return;
  const inner = q(".header-inner", header) || header;
  const right = q(".header-right", header);
  const left = q(".header-left", header);
  const host = q("#app-shell") || document.body;
  const moveTo = (target, n) => {
    if (n.parentNode === target) return;
    const anchor = document.createComment("avst6");
    n.parentNode?.insertBefore(anchor, n);
    target.appendChild(n);
    _cleanups.push(() => {
      try {
        anchor.parentNode?.insertBefore(n, anchor);
        anchor.remove();
      } catch {
      }
    });
  };
  const moveAfter = (ref, n) => {
    if (n === ref) return;
    const anchor = document.createComment("avst6");
    n.parentNode?.insertBefore(anchor, n);
    ref.parentNode?.insertBefore(n, ref.nextSibling);
    _cleanups.push(() => {
      try {
        anchor.parentNode?.insertBefore(n, anchor);
        anchor.remove();
      } catch {
      }
    });
  };
  if (!q(".avst6-hdr-menu", header)) {
    const menuBtn2 = document.createElement("button");
    menuBtn2.type = "button";
    menuBtn2.className = "avst6-hdr-menu";
    menuBtn2.setAttribute("data-action", "sidebar.toggle");
    menuBtn2.setAttribute("aria-controls", "sidebar");
    menuBtn2.setAttribute("aria-haspopup", "dialog");
    menuBtn2.setAttribute("aria-expanded", "false");
    menuBtn2.setAttribute("aria-label", "Abrir menu de navega\xE7\xE3o");
    menuBtn2.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
    inner.insertBefore(menuBtn2, inner.firstChild);
    _cleanups.push(() => menuBtn2.remove());
  }
  const menuBtn = q(".avst6-hdr-menu", header);
  const maisBtnExist = q(".avst6-mais-btn", header);
  const identity = q('.header-component-wrapper[data-component-key="user-menu"],.header-component-fallback[data-component="user-menu"]', header);
  if (identity && menuBtn && identity.parentNode !== inner) moveAfter(menuBtn, identity);
  let strip = q(".avst6-hdr-strip", header);
  const stripAlvos = [];
  STRIP_KEYS.forEach((k) => qa(`.header-component-wrapper[data-component-key="${k}"],.header-component-fallback[data-component="${k}"]`, header).forEach((n) => {
    if (!n.closest(".avst6-hdr-strip,.avst6-mais-sheet")) stripAlvos.push(n);
  }));
  qa(EXTRA_STRIP_SEL, header).forEach((n) => {
    if (!n.closest(".avst6-hdr-strip,.avst6-mais-sheet")) stripAlvos.push(n);
  });
  if (stripAlvos.length) {
    if (!strip) {
      strip = document.createElement("div");
      strip.className = "avst6-hdr-strip";
      strip.setAttribute("role", "group");
      strip.setAttribute("aria-label", "Indicadores de status");
      header.appendChild(strip);
      host.setAttribute("data-hdr-strip", "1");
      const s0 = strip;
      _cleanups.push(() => {
        s0.remove();
        host.removeAttribute("data-hdr-strip");
      });
    }
    const s1 = strip;
    stripAlvos.forEach((n) => moveTo(s1, n));
  }
  let sheet = q(".avst6-mais-sheet", host);
  const sheetAlvos = [];
  qa(WRAP_SEL, header).forEach((n) => {
    const k = keyOf(n);
    if (STRIP_KEYS.includes(k) || BAND1_KEEP.includes(k) || HIDE_KEYS.includes(k)) return;
    if (n.closest(".avst6-hdr-strip,.avst6-mais-sheet")) return;
    if (n.parentElement && n.parentElement.closest(WRAP_SEL)) return;
    sheetAlvos.push(n);
  });
  if (sheetAlvos.length) {
    if (!sheet) {
      sheet = document.createElement("div");
      sheet.className = "avst6-mais-sheet";
      sheet.id = "avst6-mais-sheet";
      sheet.setAttribute("role", "dialog");
      sheet.setAttribute("aria-label", "Mais op\xE7\xF5es");
      sheet.hidden = true;
      const backdrop = document.createElement("div");
      backdrop.className = "avst6-mais-backdrop";
      backdrop.hidden = true;
      const maisBtn = document.createElement("button");
      maisBtn.type = "button";
      maisBtn.className = "avst6-mais-btn";
      maisBtn.setAttribute("aria-haspopup", "dialog");
      maisBtn.setAttribute("aria-expanded", "false");
      maisBtn.setAttribute("aria-controls", "avst6-mais-sheet");
      maisBtn.setAttribute("aria-label", "Mais op\xE7\xF5es");
      maisBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
      const sh = sheet, bd = backdrop;
      let origem = null;
      const fechar = () => {
        sh.hidden = true;
        bd.hidden = true;
        maisBtn.setAttribute("aria-expanded", "false");
        try {
          origem?.focus();
        } catch {
        }
      };
      const abrir = () => {
        origem = document.activeElement;
        sh.hidden = false;
        bd.hidden = false;
        maisBtn.setAttribute("aria-expanded", "true");
        const f = q(FOCAVEIS, sh);
        try {
          (f || sh).focus();
        } catch {
        }
      };
      on(maisBtn, "click", () => sh.hidden ? abrir() : fechar());
      on(bd, "click", () => fechar());
      on(sh, "keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          fechar();
        }
      });
      on(document, "click", (e) => {
        const a = e.target?.closest?.(".avst6-mais-sheet .header-component-wrapper,.avst6-mais-sheet .header-component-fallback,.avst6-mais-sheet a,.avst6-mais-sheet button");
        if (a && a !== maisBtn) fechar();
      });
      if (right) right.appendChild(maisBtn);
      else inner.appendChild(maisBtn);
      host.appendChild(bd);
      host.appendChild(sh);
      _cleanups.push(() => {
        maisBtn.remove();
        bd.remove();
        sh.remove();
      });
    }
    const sh1 = sheet;
    sheetAlvos.forEach((n) => moveTo(sh1, n));
  }
}
function wireTicker() {
  const comp = q(".news-ticker-component");
  const track = q(".ticker-track");
  if (!comp || !track) return;
  if (q(".avst6-ticker-ctrl", comp)) return;
  const barra = document.createElement("div");
  barra.className = "avst6-ticker-ctrl";
  const mk = (label, cls) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `avst6-tk ${cls}`;
    b.setAttribute("aria-label", label);
    b.textContent = { "avst6-tk-prev": "\u2039", "avst6-tk-next": "\u203A", "avst6-tk-pause": "\u23F8" }[cls] || label;
    return b;
  };
  const prev = mk("Not\xEDcia anterior", "avst6-tk-prev");
  const pause = mk("Pausar", "avst6-tk-pause");
  pause.setAttribute("aria-pressed", "false");
  const next = mk("Pr\xF3xima not\xEDcia", "avst6-tk-next");
  barra.append(prev, pause, next);
  comp.appendChild(barra);
  const setPausa = (p) => {
    comp.setAttribute("data-ticker-paused", p ? "1" : "0");
    pause.setAttribute("aria-pressed", p ? "true" : "false");
    pause.setAttribute("aria-label", p ? "Retomar" : "Pausar");
    pause.textContent = p ? "\u25B6" : "\u23F8";
  };
  const passo = (dir) => {
    setPausa(true);
    try {
      track.scrollBy({ left: dir * Math.max(160, comp.clientWidth * 0.6), behavior: "smooth" });
    } catch {
    }
  };
  on(pause, "click", () => setPausa(comp.getAttribute("data-ticker-paused") !== "1"));
  on(prev, "click", () => passo(-1));
  on(next, "click", () => passo(1));
  on(comp, "focusin", () => setPausa(true));
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPausa(true);
  } catch {
  }
  _cleanups.push(() => {
    barra.remove();
    comp.removeAttribute("data-ticker-paused");
  });
}
const BOTTOMNAV_MAX = 5;
function wireBottomNav() {
  const host = q("#app-shell");
  if (!host) return;
  if (q(".avst6-bottomnav", host)) return;
  const sidebar = q(".dsd-sidebar");
  if (!sidebar) return;
  const links = qa(".dsd-sidebar__link[href]", sidebar).filter((a) => {
    const href = a.getAttribute("href") || "";
    return href && href !== "#" && a.getAttribute("aria-disabled") !== "true";
  }).slice(0, BOTTOMNAV_MAX);
  if (!links.length) return;
  const here = (location.pathname + location.search).replace(/\/+$/, "") || "/";
  const nav = document.createElement("nav");
  nav.className = "avst6-bottomnav";
  nav.setAttribute("role", "navigation");
  nav.setAttribute("aria-label", "Atalhos de navega\xE7\xE3o");
  links.forEach((src) => {
    const href = src.getAttribute("href") || "#";
    const label = (q(".dsd-sidebar__item-text", src)?.textContent || src.textContent || "").trim().replace(/\s+/g, " ");
    const iconSrc = q(".dsd-sidebar__item-icon", src);
    const a = document.createElement("a");
    a.className = "avst6-bn-item";
    a.setAttribute("href", href);
    const norm = href.replace(/\/+$/, "") || "/";
    if (norm === here || src.getAttribute("aria-current") === "page" || src.closest(".dsd-sidebar__item")?.classList.contains("is-active")) {
      a.classList.add("avst6-bn-item--active");
      a.setAttribute("aria-current", "page");
    }
    const ico = document.createElement("span");
    ico.className = "avst6-bn-icon";
    ico.setAttribute("aria-hidden", "true");
    ico.innerHTML = iconSrc ? iconSrc.innerHTML : "";
    const txt = document.createElement("span");
    txt.className = "avst6-bn-label";
    txt.textContent = label || "\u2014";
    a.title = label;
    a.setAttribute("aria-label", label);
    a.append(ico, txt);
    nav.appendChild(a);
  });
  host.appendChild(nav);
  host.setAttribute("data-bottomnav", "1");
  _cleanups.push(() => {
    nav.remove();
    host.removeAttribute("data-bottomnav");
  });
}
function enhanceMobileShell() {
  if (!q("#app-shell[data-mobile]")) return;
  _ligado = true;
  try {
    wireDrawer();
  } catch {
  }
  try {
    wireCompactHeader();
  } catch {
  }
  try {
    wireTicker();
  } catch {
  }
  try {
    wireBottomNav();
  } catch {
  }
}
function teardownMobileShell() {
  if (!_ligado) return;
  _cleanups.splice(0).reverse().forEach((fn) => {
    try {
      fn();
    } catch {
    }
  });
  _ligado = false;
}
function isEnhanced() {
  return _ligado;
}
var mobile_shell_default = { enhanceMobileShell, teardownMobileShell, isEnhanced };
export {
  MODULE_ID,
  VERSION,
  mobile_shell_default as default,
  enhanceMobileShell,
  isEnhanced,
  teardownMobileShell
};
