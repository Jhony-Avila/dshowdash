import { store } from "../state/store.js";
import { modalsManager } from "../ui/modals.js";
import * as ModalController from "../managers/modal-controller.js";
import { themeManager } from "../utils/theme-manager.js";
import { toastManager } from "../ui/toast.js";
import { loadClientes } from "./data.js";
const VERSION = "9.3.2-P2-ENTERPRISE";
const MODULE_ID = "panel-05:handlers:modals";
const today = () => {
  const d = /* @__PURE__ */ new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
let _dp = { start: null, end: null, preset: null, month: today().getMonth(), year: today().getFullYear() };
const PRESETS = {
  today: () => ({ start: today(), end: today() }),
  yesterday: () => {
    const d = today();
    d.setDate(d.getDate() - 1);
    return { start: d, end: d };
  },
  "7d": () => {
    const s = today();
    s.setDate(s.getDate() - 7);
    return { start: s, end: today() };
  },
  "30d": () => {
    const s = today();
    s.setDate(s.getDate() - 30);
    return { start: s, end: today() };
  },
  "90d": () => {
    const s = today();
    s.setDate(s.getDate() - 90);
    return { start: s, end: today() };
  },
  thisMonth: () => {
    const d = today();
    return { start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 0) };
  },
  lastMonth: () => {
    const d = today();
    return { start: new Date(d.getFullYear(), d.getMonth() - 1, 1), end: new Date(d.getFullYear(), d.getMonth(), 0) };
  },
  thisYear: () => {
    const d = today();
    return { start: new Date(d.getFullYear(), 0, 1), end: d };
  },
  custom: () => null
};
function getDateRange() {
  return { ..._dp };
}
const _reopenDatePicker = () => ModalController.show("date-picker", { startDate: _dp.start, endDate: _dp.end, selectedPreset: _dp.preset, month: _dp.month, year: _dp.year });
const _reopenSettings = () => ModalController.show("settings");
function applySettings(settings, refs) {
  const theme = String(settings.theme || "system");
  try {
    themeManager.init();
    themeManager.setTheme(theme);
  } catch {
  }
  const panel = refs?.panel || document.querySelector(".p05-panel");
  if (panel) panel.classList.toggle("p05-compact", !!settings.compactMode);
}
function _readSettingsFromModal(modal) {
  const out = {};
  modal.querySelectorAll("[data-setting]").forEach((el) => {
    const key = el.dataset.setting;
    if (el.type === "checkbox") out[key] = el.checked;
    else {
      const v = el.value;
      out[key] = /^\d+$/.test(v) ? Number(v) : v;
    }
  });
  return out;
}
function handleClick(e, refs) {
  const target = e.target?.closest("[data-action]");
  if (!target) return false;
  const modal = target.closest(".p05-modal-wrapper");
  if (!modal) return false;
  const action = target.dataset.action;
  switch (action) {
    case "set-theme": {
      const theme = target.dataset.theme || "system";
      const s = modalsManager.saveSettings({ theme });
      applySettings(s, refs);
      _reopenSettings();
      return true;
    }
    case "save-settings": {
      const s = modalsManager.saveSettings(_readSettingsFromModal(modal));
      applySettings(s, refs);
      ModalController.close();
      toastManager.success("Configura\xE7\xF5es salvas");
      return true;
    }
    case "reset-settings": {
      const s = modalsManager.resetSettings();
      applySettings(s, refs);
      _reopenSettings();
      toastManager.info("Configura\xE7\xF5es restauradas");
      return true;
    }
    case "select-preset": {
      const id = target.dataset.preset || "custom";
      const r = PRESETS[id] ? PRESETS[id]() : null;
      _dp = { ..._dp, preset: id, start: r ? iso(r.start) : _dp.start, end: r ? iso(r.end) : _dp.end };
      if (r) {
        _dp.month = r.end.getMonth();
        _dp.year = r.end.getFullYear();
      }
      _reopenDatePicker();
      return true;
    }
    case "select-date": {
      const d = target.dataset.date || null;
      if (!d) return true;
      if (!_dp.start || _dp.start && _dp.end) {
        _dp = { ..._dp, start: d, end: null, preset: "custom" };
      } else if (d < _dp.start) {
        _dp = { ..._dp, start: d, preset: "custom" };
      } else {
        _dp = { ..._dp, end: d, preset: "custom" };
      }
      _reopenDatePicker();
      return true;
    }
    case "prev-month":
    case "next-month": {
      let m = Number(target.dataset.month ?? _dp.month) + (action === "prev-month" ? -1 : 1);
      let y = Number(target.dataset.year ?? _dp.year);
      if (m < 0) {
        m = 11;
        y--;
      }
      if (m > 11) {
        m = 0;
        y++;
      }
      _dp = { ..._dp, month: m, year: y };
      _reopenDatePicker();
      return true;
    }
    case "clear-dates": {
      _dp = { start: null, end: null, preset: null, month: today().getMonth(), year: today().getFullYear() };
      store.setFilters({ dataInicio: "", dataFim: "" });
      _reopenDatePicker();
      return true;
    }
    case "apply-dates": {
      if (!_dp.start) {
        toastManager.warning("Escolha a data inicial");
        return true;
      }
      const end = _dp.end || _dp.start;
      store.setFilters({ dataInicio: _dp.start, dataFim: end });
      ModalController.close();
      loadClientes();
      toastManager.success(`Per\xEDodo aplicado: ${_dp.start} at\xE9 ${end}`);
      return true;
    }
    default:
      return false;
  }
}
function handleChange(e) {
  const el = e.target;
  if (!el || !el.classList?.contains("p05-date-input") || !el.closest(".p05-modal-wrapper")) return false;
  if (el.dataset.type === "start") _dp = { ..._dp, start: el.value || null, preset: "custom" };
  if (el.dataset.type === "end") _dp = { ..._dp, end: el.value || null, preset: "custom" };
  return true;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, dateRange: getDateRange() };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { modalsReady: true } };
}
var modals_default = { handleClick, handleChange, getDateRange, applySettings, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  applySettings,
  modals_default as default,
  getDateRange,
  handleChange,
  handleClick,
  healthCheck,
  info
};
