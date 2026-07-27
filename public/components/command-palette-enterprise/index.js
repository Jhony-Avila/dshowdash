import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { NAV_INTENTS } from "/core/runtime/events/catalog/nav.events.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { escapeHtml } from "/core/utils/html-sanitizer.js";
const MODULE_ID = "command-palette-enterprise";
const VERSION = "3.11.0-P2-ENTERPRISE";
const CMD_PALETTE_EVENTS = { EXECUTED: "command-palette:executed", OPENED: "command-palette:opened", CLOSED: "command-palette:closed", READY: "command-palette-enterprise:ready" };
const CP_SVGS = { arrowUp: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>', arrowDown: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>', arrowLeft: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>', arrowRight: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>', chevronLeft: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>', fullscreen: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>', play: '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>' };
const EXEC_STATUS = { PENDING: "pending", RUNNING: "running", SUCCESS: "success", ERROR: "error", CANCELLED: "cancelled", DENIED: "denied" };
const CATEGORIES = { navigation: { label: "Navega\xE7\xE3o", icon: "\u{1F9ED}", priority: 100 }, layout: { label: "Layout", icon: "\u{1F4D0}", priority: 90 }, actions: { label: "A\xE7\xF5es", icon: "\u26A1", priority: 80 }, system: { label: "Sistema", icon: "\u2699\uFE0F", priority: 70 }, search: { label: "Busca", icon: "\u{1F50D}", priority: 60 }, theme: { label: "Tema", icon: "\u{1F3A8}", priority: 50 }, debug: { label: "Debug", icon: "\u{1F41B}", priority: 10 } };
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args);
};
const _state = { initialized: false, commands: /* @__PURE__ */ new Map(), history: [], maxHistory: 50, executionId: 0, modal: null, input: null, results: null, selectedIndex: 0, currentFilter: "", metrics: { executions: 0, successes: 0, errors: 0, denied: 0 }, cleanups: [] };
const _envelope = (ok, data, errors) => ({ ok, data: data || null, meta: { moduleId: MODULE_ID, version: VERSION, timestamp: (/* @__PURE__ */ new Date()).toISOString() }, errors: errors || [] });
const _health = (status, score, issues) => ({ status, score, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "crit" }, commandsLoaded: { ok: _state.commands.size > 0, severity: "warn" } }, issues: issues || [], metrics: _state.metrics, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() });
const _track = (eventName, payload) => {
  try {
    const tk = _getPort("telemetry");
    tk?.track?.(eventName, { moduleId: MODULE_ID, ...payload });
  } catch (e) {
  }
};
const _emit = (eventName, data) => {
  try {
    const eb = _getPort("eventBus");
    eb?.emit?.(eventName, { source: MODULE_ID, timestamp: Date.now(), ...data });
  } catch (e) {
  }
};
const _genExecId = () => `${MODULE_ID}-exec-${++_state.executionId}-${Date.now()}`;
const registerCommand = (commandDef) => {
  if (!commandDef?.id || !commandDef?.title) return _envelope(false, null, [{ code: "INVALID", message: "Command must have id and title" }]);
  const cat = CATEGORIES[commandDef.category];
  const cmd = { id: commandDef.id, title: commandDef.title, description: commandDef.description || "", category: commandDef.category || "actions", keywords: commandDef.keywords || [], priority: commandDef.priority || "normal", shortcuts: commandDef.shortcuts || (commandDef.shortcut ? [commandDef.shortcut] : []), icon: commandDef.icon || (cat?.icon || CP_SVGS.play), capabilitiesRequired: commandDef.capabilitiesRequired || [], permissionPolicy: commandDef.permissionPolicy || null, sideEffects: commandDef.sideEffects || [], canExecute: commandDef.canExecute || (() => true), run: commandDef.run || commandDef.execute || (() => _envelope(true, null)), registeredAt: Date.now() };
  _state.commands.set(cmd.id, cmd);
  _track("command:registered", { commandId: cmd.id, category: cmd.category });
  return _envelope(true, { commandId: cmd.id, registered: true });
};
const unregisterCommand = (commandId) => {
  if (!_state.commands.has(commandId)) return _envelope(false, null, [{ code: "NOT_FOUND", message: `Command not found: ${commandId}` }]);
  _state.commands.delete(commandId);
  return _envelope(true, { commandId, unregistered: true });
};
const listCommands = (filter) => {
  const list = [];
  const f = filter || {};
  const ctx = { ports: Ports.snapshot() };
  for (const [, cmd] of _state.commands) {
    let include = true;
    if (f.category && cmd.category !== f.category) include = false;
    if (f.query) {
      const q = f.query.toLowerCase();
      const match = cmd.title.toLowerCase().includes(q) || cmd.id.toLowerCase().includes(q) || cmd.description?.toLowerCase()?.includes(q) || cmd.keywords.some((k) => k.toLowerCase().includes(q));
      if (!match) include = false;
    }
    if (include) {
      let canExec = true;
      try {
        canExec = cmd.canExecute(ctx);
      } catch (e) {
        canExec = false;
      }
      list.push({ id: cmd.id, title: cmd.title, description: cmd.description, category: cmd.category, shortcuts: cmd.shortcuts, icon: cmd.icon, canExecute: canExec });
    }
  }
  list.sort((a, b) => {
    const pa = CATEGORIES[a.category]?.priority || 0;
    const pb = CATEGORIES[b.category]?.priority || 0;
    if (pb !== pa) return pb - pa;
    return a.title.localeCompare(b.title);
  });
  return _envelope(true, { commands: list, count: list.length });
};
const execute = (commandId, input) => {
  const cmd = _state.commands.get(commandId);
  if (!cmd) return _envelope(false, null, [{ code: "NOT_FOUND", message: `Command not found: ${commandId}` }]);
  const execId = _genExecId();
  const startTime = Date.now();
  const ctx = { ports: Ports.snapshot(), input, executionId: execId };
  const execution = { executionId: execId, commandId, status: EXEC_STATUS.PENDING, startTime, endTime: null, durationMs: null, input, result: null };
  try {
    if (!cmd.canExecute(ctx)) {
      execution.status = EXEC_STATUS.DENIED;
      execution.endTime = Date.now();
      execution.durationMs = execution.endTime - startTime;
      _state.metrics.denied++;
      _track("command:denied", { commandId, executionId: execId });
      _recordHistory(execution);
      return _envelope(false, { execution }, [{ code: "DENIED", message: "Command not allowed" }]);
    }
  } catch (e) {
    execution.status = EXEC_STATUS.ERROR;
    execution.endTime = Date.now();
    _state.metrics.errors++;
    _recordHistory(execution);
    return _envelope(false, null, [{ code: "VALIDATE_ERROR", message: e.message }]);
  }
  if (cmd.permissionPolicy?.required?.length > 0) {
    const pg = _getPort("permissions");
    if (pg?.hasPermission) {
      const hasAllPerms = cmd.permissionPolicy.required.every((p) => {
        try {
          return pg.hasPermission(p);
        } catch (e) {
          return false;
        }
      });
      if (!hasAllPerms) {
        const fallback = cmd.permissionPolicy.fallback || "deny";
        if (fallback === "deny") {
          execution.status = EXEC_STATUS.DENIED;
          execution.endTime = Date.now();
          _state.metrics.denied++;
          _track("command:permission-denied", { commandId, permissions: cmd.permissionPolicy.required });
          _recordHistory(execution);
          return _envelope(false, { execution }, [{ code: "PERMISSION_DENIED", message: "Missing permissions" }]);
        }
        _track("command:permission-fallback", { commandId, fallback });
      }
    }
  }
  execution.status = EXEC_STATUS.RUNNING;
  try {
    const result = cmd.run(ctx, input);
    execution.status = EXEC_STATUS.SUCCESS;
    execution.result = result;
    execution.endTime = Date.now();
    execution.durationMs = execution.endTime - startTime;
    _state.metrics.executions++;
    _state.metrics.successes++;
    _track("command:executed", { commandId, executionId: execId, durationMs: execution.durationMs, success: true });
    _emit(CMD_PALETTE_EVENTS.EXECUTED, { commandId, result });
    _recordHistory(execution);
    return _envelope(true, { execution, result });
  } catch (e) {
    execution.status = EXEC_STATUS.ERROR;
    execution.endTime = Date.now();
    execution.durationMs = execution.endTime - startTime;
    _state.metrics.executions++;
    _state.metrics.errors++;
    _track("command:error", { commandId, executionId: execId, error: e.message });
    _recordHistory(execution);
    return _envelope(false, { execution }, [{ code: "EXECUTE_ERROR", message: e.message }]);
  }
};
const _recordHistory = (execution) => {
  _state.history.push(execution);
  if (_state.history.length > _state.maxHistory) _state.history = _state.history.slice(-_state.maxHistory);
};
const getHistory = (limit) => {
  const n = limit || 10;
  return _envelope(true, { history: _state.history.slice(-n), count: Math.min(n, _state.history.length) });
};
const createUI = () => {
  if (_state.modal) return;
  _state.modal = document.createElement("div");
  _state.modal.className = "dsd-cmd-palette-enterprise";
  _state.modal.innerHTML = `<div class="dsd-cmd-palette-enterprise__backdrop"></div><div class="dsd-cmd-palette-enterprise__container"><div class="dsd-cmd-palette-enterprise__header"><input type="text" class="dsd-cmd-palette-enterprise__input" placeholder="Digite um comando..." autocomplete="off" /></div><div class="dsd-cmd-palette-enterprise__results"></div><div class="dsd-cmd-palette-enterprise__footer"><span class="dsd-cmd-palette-enterprise__hint">${CP_SVGS.arrowUp}${CP_SVGS.arrowDown} navegar - Enter executar - Esc fechar</span></div></div>`;
  document.body.appendChild(_state.modal);
  _state.input = _state.modal.querySelector(".dsd-cmd-palette-enterprise__input");
  _state.results = _state.modal.querySelector(".dsd-cmd-palette-enterprise__results");
  const backdrop = _state.modal.querySelector(".dsd-cmd-palette-enterprise__backdrop");
  const backdropHandler = () => hide();
  backdrop.addEventListener("click", backdropHandler);
  _state.cleanups.push(() => backdrop.removeEventListener("click", backdropHandler));
  const inputHandler = () => search(_state.input.value);
  _state.input.addEventListener("input", inputHandler);
  _state.cleanups.push(() => _state.input.removeEventListener("input", inputHandler));
  const keyHandler = (e) => {
    const items = _state.results.querySelectorAll(".dsd-cmd-palette-enterprise__item");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      _state.selectedIndex = Math.min(_state.selectedIndex + 1, items.length - 1);
      updateSelection();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      _state.selectedIndex = Math.max(_state.selectedIndex - 1, 0);
      updateSelection();
    } else if (e.key === "Enter") {
      e.preventDefault();
      executeSelected();
    } else if (e.key === "Escape") {
      e.preventDefault();
      hide();
    }
  };
  _state.input.addEventListener("keydown", keyHandler);
  _state.cleanups.push(() => _state.input.removeEventListener("keydown", keyHandler));
};
const search = (query) => {
  _state.currentFilter = query;
  _state.selectedIndex = 0;
  const result = listCommands({ query });
  if (result.ok) renderResults(result.data.commands);
};
const renderResults = (commands) => {
  if (!_state.results) return;
  if (commands.length === 0) {
    _state.results.innerHTML = '<div class="dsd-cmd-palette-enterprise__empty">Nenhum comando encontrado</div>';
    return;
  }
  let currentCategory = "";
  const html = [];
  commands.forEach((cmd, idx) => {
    if (cmd.category !== currentCategory) {
      currentCategory = cmd.category;
      const cat = CATEGORIES[currentCategory] || { label: currentCategory, icon: "\u{1F4C1}" };
      html.push(`<div class="dsd-cmd-palette-enterprise__category">${cat.icon} ${escapeHtml(cat.label)}</div>`);
    }
    const selected = idx === _state.selectedIndex ? " dsd-cmd-palette-enterprise__item--selected" : "";
    const disabled = !cmd.canExecute ? " dsd-cmd-palette-enterprise__item--disabled" : "";
    html.push(`<div class="dsd-cmd-palette-enterprise__item${selected}${disabled}" data-cmd-id="${escapeHtml(cmd.id)}" data-index="${idx}"><span class="dsd-cmd-palette-enterprise__item-icon">${cmd.icon || CP_SVGS.play}</span><div class="dsd-cmd-palette-enterprise__item-content"><span class="dsd-cmd-palette-enterprise__item-title">${escapeHtml(cmd.title)}</span>${cmd.description ? `<span class="dsd-cmd-palette-enterprise__item-desc">${escapeHtml(cmd.description)}</span>` : ""}</div>${cmd.shortcuts?.[0] ? `<kbd class="dsd-cmd-palette-enterprise__item-shortcut">${escapeHtml(cmd.shortcuts[0])}</kbd>` : ""}</div>`);
  });
  _state.results.innerHTML = html.join("");
  _state.results.querySelectorAll(".dsd-cmd-palette-enterprise__item").forEach((el) => {
    el.addEventListener("click", () => {
      const cmdId = el.dataset.cmdId;
      if (cmdId) {
        execute(cmdId);
        hide();
      }
    });
  });
};
const updateSelection = () => {
  if (!_state.results) return;
  const items = _state.results.querySelectorAll(".dsd-cmd-palette-enterprise__item");
  items.forEach((el, i) => {
    if (i === _state.selectedIndex) el.classList.add("dsd-cmd-palette-enterprise__item--selected");
    else el.classList.remove("dsd-cmd-palette-enterprise__item--selected");
  });
  const selected = items[_state.selectedIndex];
  selected?.scrollIntoView({ block: "nearest" });
};
const executeSelected = () => {
  const items = _state.results.querySelectorAll(".dsd-cmd-palette-enterprise__item");
  const selected = items[_state.selectedIndex];
  if (selected?.dataset?.cmdId) {
    execute(selected.dataset.cmdId);
    hide();
  }
};
const show = () => {
  createUI();
  _state.modal.classList.add("dsd-cmd-palette-enterprise--visible");
  _state.input.value = "";
  _state.input.focus();
  search("");
  _emit(CMD_PALETTE_EVENTS.OPENED);
};
const hide = () => {
  _state.modal?.classList.remove("dsd-cmd-palette-enterprise--visible");
  _emit(CMD_PALETTE_EVENTS.CLOSED);
};
const toggle = () => {
  if (_state.modal?.classList.contains("dsd-cmd-palette-enterprise--visible")) hide();
  else show();
};
const globalKeydownHandler = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "p") {
    e.preventDefault();
    toggle();
  }
};
const _navigateHistory = (direction) => {
  const eb = _getPort("eventBus");
  eb?.emit?.(NAV_INTENTS.NAVIGATE, { type: direction === "back" ? "BACK" : "FORWARD", source: MODULE_ID, meta: { reason: "command-palette" }, timestamp: Date.now() });
  const broker = _getPort("navigationBroker");
  if (broker?.dispatch) {
    broker.dispatch({ type: direction === "back" ? "BACK" : "FORWARD", source: MODULE_ID });
    return _envelope(true, { navigated: direction, via: "NavigationBroker" });
  }
  const r = _getPort("router");
  if (r?.[direction]) {
    r[direction]();
    return _envelope(true, { navigated: direction, via: "RouterGlobal" });
  }
  const hns = _getPort("hardNavService");
  if (hns) {
    if (direction === "back" && hns.historyBack) {
      hns.historyBack(MODULE_ID, "command-palette");
      return _envelope(true, { navigated: direction, via: "HardNavService" });
    }
    if (direction === "forward" && hns.historyForward) {
      hns.historyForward(MODULE_ID, "command-palette");
      return _envelope(true, { navigated: direction, via: "HardNavService" });
    }
  }
  _track("navigation:no-owner", { direction, source: MODULE_ID });
  return _envelope(false, { navigated: false }, [{ code: "NO_NAV_OWNER", message: `No navigation owner available for ${direction}` }]);
};
const registerDefaultCommands = () => {
  registerCommand({ id: "nav:home", title: "Ir para Home", category: "navigation", icon: "\u{1F3E0}", shortcuts: ["Alt+H"], run: (ctx) => {
    const r = ctx.ports.router;
    r?.navigate?.("#/");
    return _envelope(true, { navigated: "#/" });
  } });
  registerCommand({ id: "nav:back", title: "Voltar", category: "navigation", icon: CP_SVGS.arrowLeft, shortcuts: ["Alt+Seta Esq"], run: () => _navigateHistory("back") });
  registerCommand({ id: "nav:forward", title: "Avan\xE7ar", category: "navigation", icon: CP_SVGS.arrowRight, shortcuts: ["Alt+Seta Dir"], run: () => _navigateHistory("forward") });
  registerCommand({ id: "layout:toggle-sidebar", title: "Alternar Sidebar", category: "layout", icon: CP_SVGS.chevronLeft, shortcuts: ["Ctrl+B"], run: (ctx) => {
    const sk = ctx.ports.sidebarKernel;
    if (sk?.getFeatureStatus) _track("command:kernel-used", { kernel: "SidebarKernel", action: "toggle" });
    const s = ctx.ports.sidebar;
    if (s?.toggle) {
      s.toggle();
      return _envelope(true, { toggled: true });
    }
    return _envelope(false, null, [{ code: "NO_SIDEBAR", message: "Sidebar not available" }]);
  } });
  registerCommand({ id: "layout:mini-mode", title: "Modo Mini", category: "layout", icon: "\u{1F4CC}", run: (ctx) => {
    const s = ctx.ports.sidebar;
    if (s?.toggleMiniMode) {
      s.toggleMiniMode();
      return _envelope(true, null);
    }
    return _envelope(false, null, [{ code: "NOT_SUPPORTED", message: "Mini mode not supported" }]);
  } });
  registerCommand({ id: "layout:fullscreen", title: "Tela Cheia", category: "layout", icon: CP_SVGS.fullscreen, shortcuts: ["F11"], run: () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
    return _envelope(true, null);
  } });
  registerCommand({ id: "theme:toggle", title: "Alternar Tema", category: "theme", icon: "\u{1F313}", shortcuts: ["Alt+T"], run: (ctx) => {
    ctx.ports.sidebar?.toggleTheme?.();
    return _envelope(true, null);
  } });
  registerCommand({ id: "theme:light", title: "Tema Claro", category: "theme", icon: "\u2600\uFE0F", run: () => {
    document.documentElement.setAttribute("data-theme", "light");
    return _envelope(true, null);
  } });
  registerCommand({ id: "theme:dark", title: "Tema Escuro", category: "theme", icon: "\u{1F319}", run: () => {
    document.documentElement.setAttribute("data-theme", "dark");
    return _envelope(true, null);
  } });
  registerCommand({ id: "system:reload", title: "Recarregar P\xE1gina", category: "system", icon: "\u{1F504}", shortcuts: ["Ctrl+R"], run: (ctx) => {
    const hns = ctx.ports.hardNavService;
    if (hns?.reload) {
      hns.reload("command-palette", MODULE_ID);
      return _envelope(true, { reloaded: true });
    }
    _emit(UI_EVENTS.HARD_NAV, { action: "reload", reason: "command-palette", source: MODULE_ID });
    if (typeof window !== "undefined") window.location.reload();
    return _envelope(true, { reloaded: true, fallback: true });
  } });
  registerCommand({ id: "system:clear-cache", title: "Limpar Cache Local", category: "system", icon: "\u{1F5D1}\uFE0F", sideEffects: ["localStorage", "sessionStorage"], run: () => {
    localStorage.clear();
    sessionStorage.clear();
    return _envelope(true, { cleared: true });
  } });
  registerCommand({ id: "system:health", title: "Ver Health do Sistema", category: "system", icon: "\u{1F49A}", run: (ctx) => {
    const tk = ctx.ports.telemetry;
    if (tk?.summary) {
      const s = tk.summary();
      _log("info", "Health Summary:", s);
      if (s.ok && s.data) alert(`Score: ${s.data.score}
Status: ${s.data.status}
M\xF3dulos: ${s.data.modules}`);
      return s;
    }
    return _envelope(false, null, [{ code: "NO_TELEMETRY", message: "TelemetryKernel not available" }]);
  } });
  registerCommand({ id: "debug:modules", title: "Listar M\xF3dulos", category: "debug", icon: "\u{1F4E6}", run: (ctx) => {
    const tk = ctx.ports.telemetry;
    if (tk?.listModules) {
      const m = tk.listModules();
      _log("info", "Modules:", m.data?.modules || []);
      return m;
    }
    return _envelope(false, null, [{ code: "NO_TELEMETRY" }]);
  } });
  registerCommand({ id: "debug:events", title: "Ver Eventos", category: "debug", icon: "\u{1F4CB}", run: (ctx) => {
    const tk = ctx.ports.telemetry;
    if (tk?.getEvents) {
      const e = tk.getEvents(20);
      _log("info", "Events:", e.data?.events || []);
      return e;
    }
    return _envelope(false, null, [{ code: "NO_TELEMETRY" }]);
  } });
  registerCommand({ id: "debug:sidebar-kernel", title: "SidebarKernel Info", category: "debug", icon: "\u{1F527}", run: (ctx) => {
    const sk = ctx.ports.sidebarKernel;
    if (sk?.info) {
      const i = sk.info();
      _log("info", "SidebarKernel:", i);
      return i;
    }
    return _envelope(false, null, [{ code: "NO_KERNEL" }]);
  } });
  registerCommand({ id: "debug:overlay-kernel", title: "OverlayKernel Info", category: "debug", icon: "\u{1F3AD}", run: (ctx) => {
    const ok = ctx.ports.overlayKernel;
    if (ok?.info) {
      const i = ok.info();
      _log("info", "OverlayKernel:", i);
      return i;
    }
    return _envelope(false, null, [{ code: "NO_KERNEL" }]);
  } });
};
const init = (ctx) => {
  if (_state.initialized) return _envelope(true, { alreadyInitialized: true });
  try {
    _initPorts();
    if (ctx?.ports) Ports.inject(ctx.ports);
    const tk = _getPort("telemetry");
    tk?.register?.({ id: MODULE_ID, version: VERSION, healthCheck, info });
    registerDefaultCommands();
    document.addEventListener("keydown", globalKeydownHandler);
    _state.cleanups.push(() => document.removeEventListener("keydown", globalKeydownHandler));
    _state.initialized = true;
    _track("command-palette:init", { version: VERSION, commandsCount: _state.commands.size });
    _emit(CMD_PALETTE_EVENTS.READY, { version: VERSION, commandsCount: _state.commands.size });
    return _envelope(true, { initialized: true, commandsCount: _state.commands.size });
  } catch (e) {
    return _envelope(false, null, [{ code: "INIT_ERROR", message: e.message }]);
  }
};
const cleanup = () => {
  for (const fn of _state.cleanups) {
    try {
      fn();
    } catch (e) {
    }
  }
  _state.cleanups = [];
  if (_state.modal?.parentNode) _state.modal.parentNode.removeChild(_state.modal);
  _state.modal = null;
  _state.input = null;
  _state.results = null;
  _state.commands.clear();
  _state.history = [];
  _state.initialized = false;
  return _envelope(true, { cleanedUp: true });
};
const destroy = () => cleanup();
const shutdown = () => cleanup();
const healthCheck = () => {
  const issues = [];
  let score = 100;
  if (!_state.initialized) {
    issues.push({ code: "NOT_INIT", severity: "crit", message: "Not initialized" });
    score -= 50;
  }
  if (_state.commands.size === 0) {
    issues.push({ code: "NO_COMMANDS", severity: "warn", message: "No commands" });
    score -= 20;
  }
  if (_state.metrics.errors > _state.metrics.successes * 0.1) {
    issues.push({ code: "HIGH_ERROR_RATE", severity: "warn", message: "High error rate" });
    score -= 15;
  }
  if (!_getPort("hardNavService")) {
    issues.push({ code: "NO_HARD_NAV", severity: "info", message: "HardNavService not available" });
    score -= 5;
  }
  const status = score >= 80 ? "HEALTHY" : score >= 50 ? "DEGRADED" : "UNHEALTHY";
  return _health(status, Math.max(0, score), issues);
};
const info = () => _envelope(true, { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, commandsCount: _state.commands.size, metrics: _state.metrics, historySize: _state.history.length, hasHardNavService: !!_getPort("hardNavService"), hasNavigationBroker: !!_getPort("navigationBroker"), portsInitialized: Ports.isInitialized(), timestamp: Date.now() });
const metrics = () => _envelope(true, _state.metrics);
if (typeof window !== "undefined") {
  if (!isStrict()) {
    window.CommandPalette = { MODULE_ID, VERSION, EXEC_STATUS, CMD_PALETTE_EVENTS, init, cleanup, destroy, shutdown, registerCommand, unregisterCommand, listCommands, execute, getHistory, show, hide, toggle, healthCheck, info, metrics, injectPorts, getPorts };
  } else {
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, target: "window.CommandPalette" });
  }
  window.__dev = window.__dev || {};
  window.__dev.commandPalette = { MODULE_ID, VERSION, healthCheck, info, metrics, listCommands, getHistory };
}
var command_palette_enterprise_default = { MODULE_ID, VERSION, CMD_PALETTE_EVENTS, init, cleanup, destroy, shutdown, registerCommand, unregisterCommand, listCommands, execute, getHistory, show, hide, toggle, healthCheck, info, metrics, injectPorts, getPorts };
export {
  CMD_PALETTE_EVENTS,
  EXEC_STATUS,
  MODULE_ID,
  VERSION,
  cleanup,
  command_palette_enterprise_default as default,
  destroy,
  execute,
  getHistory,
  getPorts,
  healthCheck,
  hide,
  info,
  init,
  injectPorts,
  listCommands,
  metrics,
  registerCommand,
  show,
  shutdown,
  toggle,
  unregisterCommand
};
