// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.6.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-command-palette
// PURPOSE: Sidebar Features - Command Palette
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   capabilities — exported value
//   init() — exported function
//   cleanup() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   getMetrics() — exported function
//   show() — exported function
//   hide() — exported function
//   toggle() — exported function
//   registerCommand() — exported function
//   search() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.COMMAND_PALETTE_CLOSED
//   SIDEBAR_EVENTS.COMMAND_PALETTE_EXECUTED
//   SIDEBAR_EVENTS.COMMAND_PALETTE_INITIALIZED
//   SIDEBAR_EVENTS.COMMAND_PALETTE_OPENED
// LISTENS (eventos):
//   'click'
//   'input'
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


const MODULE_ID = 'sidebar-command-palette';
const VERSION = '6.6.0-ES6';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const CP_SVGS = {
  chevronLeft: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  folder: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  folderOpen: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M22 10H2"/></svg>',
  palette: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="8.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.12 0 4.07.74 5.62 1.97"/></svg>',
  pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>',
  play: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
};

const _state = { initialized: false, ctx: null as DynObj, modal: null as HTMLElement | null, input: null as DynObj, results: null as DynObj, commands: [] as DynObj[], registered: [] as DynObj[], filtered: [] as DynObj[], selectedIndex: 0, opens: 0, executions: 0, errors: 0, cleanups: [] as DynObj[] };

function _envelope(ok: DynObj, data?: DynObj, errors?: Error[]) {
  return { ok, data: data || null, meta: { moduleId: MODULE_ID, version: VERSION, timestamp: new Date().toISOString() }, errors: errors || [] };
}

const DEFAULT_COMMANDS = [
  { id: 'toggle-sidebar', label: 'Alternar Barra Lateral', shortcut: 'Ctrl+B', icon: CP_SVGS.chevronLeft, keywords: ['toggle','sidebar','barra','lateral','menu','recolher'], action() { const s = _getPort('sidebar'); if (s && s.toggle) s.toggle(); } },
  { id: 'collapse-all', label: 'Recolher Todas as Seções', icon: CP_SVGS.folder, keywords: ['collapse','recolher','fechar','secoes','grupos'], action() { const s = _getPort('sidebar'); if (s && s.collapseAllSections) s.collapseAllSections(); } },
  { id: 'expand-all', label: 'Expandir Todas as Seções', icon: CP_SVGS.folderOpen, keywords: ['expand','expandir','abrir','secoes','grupos'], action() { const s = _getPort('sidebar'); if (s && s.expandAllSections) s.expandAllSections(); } },
  { id: 'toggle-theme', label: 'Alternar Tema', icon: CP_SVGS.palette, keywords: ['theme','tema','claro','escuro','dark','light','modo'], action() { const s = _getPort('sidebar'); if (s && s.toggleTheme) s.toggleTheme(); } },
  { id: 'mini-mode', label: 'Alternar Modo Compacto', icon: CP_SVGS.pin, keywords: ['mini','compacto','colapsar','estreito'], action() { const s = _getPort('sidebar'); if (s && s.toggleMiniMode) s.toggleMiniMode(); } }
];

function buildNavCommands() {
  const out: DynObj[] = [];
  const seen: DynObj = {};
  try {
    const links = document.querySelectorAll('.dsd-sidebar__link');
    links.forEach((a: DynObj) => {
      const href = (a.getAttribute('href') || '').trim();
      const label = (a.querySelector('.dsd-sidebar__item-text')?.textContent || '').trim();
      if (!label || !href || href === '#' || href.indexOf('#/') !== 0) return;
      const id = 'nav:' + href;
      if (seen[id]) return;
      seen[id] = 1;
      const linkEl = a;
      out.push({
        id, label, icon: CP_SVGS.play, shortcut: '',
        keywords: ['ir', 'abrir', 'navegar', 'painel', 'pagina', href.replace('#/', '')],
        action() {
          if (linkEl && linkEl.isConnected && linkEl.click) { linkEl.click(); return; }
          const link = document.querySelector('.dsd-sidebar__link[href="' + href + '"]') as DynObj;
          if (link && link.click) link.click();
          else window.location.href = href;
        }
      } as DynObj);
    });
  } catch (e) { /* noop */ }
  return out;
}

function globalKeydownHandler(e: DynObj) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    toggle();
  }
}

function show() {
  _state.opens++;
  createModal();
  if (_state.modal) {
    _state.modal.classList.add('dsd-command-palette--visible');
    if (_state.input) { _state.input.value = ''; _state.input.focus(); }
    _state.commands = DEFAULT_COMMANDS.concat(_state.registered, buildNavCommands());
    _state.selectedIndex = 0;
    renderCommands(_state.commands);
  }
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.COMMAND_PALETTE_OPENED);
}

function hide() {
  if (_state.modal) _state.modal.classList.remove('dsd-command-palette--visible');
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.COMMAND_PALETTE_CLOSED);
}

function toggle() {
  if (_state.modal && _state.modal.classList.contains('dsd-command-palette--visible')) hide();
  else show();
}

function createModal() {
  if (_state.modal) return;
  _state.modal = document.createElement('div');
  _state.modal.className = 'dsd-command-palette';
  _state.modal.innerHTML = '<div class="dsd-command-palette__backdrop"></div><div class="dsd-command-palette__container"><input type="text" class="dsd-command-palette__input" placeholder="Buscar comando ou painel..." /><div class="dsd-command-palette__results"></div></div>';
  document.body.appendChild(_state.modal);
  _state.input = _state.modal.querySelector('.dsd-command-palette__input');
  _state.results = _state.modal.querySelector('.dsd-command-palette__results');
  
  const backdrop = _state.modal.querySelector('.dsd-command-palette__backdrop');
  const backdropHandler = () => { hide(); };
  backdrop!.addEventListener('click', backdropHandler);
  _state.cleanups.push(() => { backdrop!.removeEventListener('click', backdropHandler); });
  
  const inputHandler = () => { search(_state.input.value); };
  _state.input.addEventListener('input', inputHandler);
  _state.cleanups.push(() => { _state.input.removeEventListener('input', inputHandler); });
  
  const keyHandler = (e: KeyboardEvent) => {
    const items = _state.results.querySelectorAll('.dsd-command-palette__item');
    if (e.key === 'ArrowDown') { e.preventDefault(); _state.selectedIndex = Math.min(_state.selectedIndex + 1, items.length - 1); updateSelection(items); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); _state.selectedIndex = Math.max(_state.selectedIndex - 1, 0); updateSelection(items); }
    else if (e.key === 'Enter') { e.preventDefault(); executeItem(_state.selectedIndex); }
    else if (e.key === 'Escape') { e.preventDefault(); hide(); }
  };
  _state.input.addEventListener('keydown', keyHandler);
  _state.cleanups.push(() => { _state.input.removeEventListener('keydown', keyHandler); });
}

function search(query: string) {
  const q = query.toLowerCase();
  const filtered = _state.commands.filter((c: DynObj) => c.label.toLowerCase().indexOf(q) !== -1 || c.id.toLowerCase().indexOf(q) !== -1 || (c.keywords && c.keywords.some((k: DynObj) => (k || '').toLowerCase().indexOf(q) !== -1)));
  _state.selectedIndex = 0;
  renderCommands(filtered);
}

function renderCommands(commands: DynObj) {
  if (!_state.results) return;
  _state.filtered = commands;
  _state.results.innerHTML = commands.map((c: DynObj, i: number) => `<div class="dsd-command-palette__item${i === _state.selectedIndex ? ' dsd-command-palette__item--selected' : ''}" data-index="${i}"><span class="dsd-command-palette__icon">${c.icon || CP_SVGS.play}</span><span class="dsd-command-palette__label">${c.label}</span>${c.shortcut ? `<kbd class="dsd-command-palette__shortcut">${c.shortcut}</kbd>` : ''}</div>`).join('');
  const items = _state.results.querySelectorAll('.dsd-command-palette__item');
  items.forEach((item: DynObj, idx: DynObj) => { item.addEventListener('click', () => { executeItem(idx); }); });
}

function updateSelection(items: DynObj[]) {
  items.forEach((item: DynObj, i: number) => {
    if (i === _state.selectedIndex) item.classList.add('dsd-command-palette__item--selected');
    else item.classList.remove('dsd-command-palette__item--selected');
  });
}

function executeItem(index: number) {
  const filtered = (_state.filtered && _state.filtered.length ? _state.filtered : _state.commands) as DynObj;
  if (index >= 0 && index < filtered.length) {
    const cmd = filtered[index];
    _state.executions++;
    hide();
    if (cmd.action) cmd.action();
    const eb = _getPort('eventBus');
    if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.COMMAND_PALETTE_EXECUTED, { commandId: cmd.id });
  }
}

function registerCommand(command: DynObj) {
  if (!command || !command.id) return _envelope(false, null, [{ code: 'INVALID', message: 'Command must have id' } as DynObj]);
  const existing = _state.registered.findIndex((c: DynObj) => c.id === command.id);
  if (existing >= 0) _state.registered[existing] = command;
  else _state.registered.push(command);
  return _envelope(true, { commandId: command.id });
}

function init(ctx: DynObj) {
  if (_state.initialized) return _envelope(true, { alreadyInitialized: true });
  try {
    _state.ctx = ctx;
    if (ctx && ctx.ports) Ports.inject(ctx.ports);
    _initPorts();
    _state.commands = DEFAULT_COMMANDS.slice();
    document.addEventListener('keydown', globalKeydownHandler);
    _state.cleanups.push(() => { document.removeEventListener('keydown', globalKeydownHandler); });
    _state.initialized = true;
    const eb = _getPort('eventBus');
    if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.COMMAND_PALETTE_INITIALIZED, { version: VERSION });
    return _envelope(true, { initialized: true });
  } catch (e: any) {
    _state.errors++;
    return _envelope(false, null, [{ code: 'INIT_ERROR', message: e.message } as DynObj]);
  }
}

function cleanup() {
  for (let i = 0; i < _state.cleanups.length; i++) { try { _state.cleanups[i](); } catch (e: any) { } }
  _state.cleanups = [];
  if (_state.modal && _state.modal.parentNode) _state.modal.parentNode.removeChild(_state.modal);
  _state.modal = null;
  _state.input = null;
  _state.results = null;
  _state.initialized = false;
  return _envelope(true, { cleanedUp: true });
}

function healthCheck() {
  const checks = {
    initialized: _state.initialized,
    commandsRegistered: _state.commands.length > 0,
    noErrors: _state.errors === 0
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (!_state.initialized) status = 'NOT_INITIALIZED';
  else if (passed < total) status = 'DEGRADED';
  
  return {
    status,
    score: { passed, total, percentage: Math.round((passed / total) * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    checks,
    metrics: { opens: _state.opens, executions: _state.executions, commandsCount: _state.commands.length, errors: _state.errors },
    timestamp: Date.now()
  };
}

function info() {
  return _envelope(true, {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    initialized: _state.initialized,
    commandsCount: _state.commands.length,
    opens: _state.opens,
    executions: _state.executions
  });
}

function getMetrics() {
  return { opens: _state.opens, executions: _state.executions, commandsCount: _state.commands.length, errors: _state.errors };
}

const capabilities = { singleton: true, critical: false, rendersUI: true, category: 'search', priority: 'high' };

export { MODULE_ID, VERSION, capabilities, init, cleanup, healthCheck, info, getMetrics, show, hide, toggle, registerCommand, search };
export default { id: MODULE_ID, version: VERSION, capabilities, init, cleanup, healthCheck, info, getMetrics, show, hide, toggle, registerCommand };
