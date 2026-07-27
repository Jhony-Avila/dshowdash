import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { escapeHtml } from "../security/escape-html.js";
import { isEnabled } from "../config/feature-flags.js";
const VERSION = "10.5.0-MIGRATION-PHASE9";
const MODULE_ID = "panel-nav-admin.collaboration.mentions";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[Mentions]";
  if (level === "error") logger.error?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const MENTION_RE = /@([a-zA-Z0-9_]{2,30})/g;
const CSS = {
  mention: "pna-mention",
  mentionSelf: "pna-mention-self",
  dropdown: "pna-mention-dropdown",
  dropdownItem: "pna-mention-dropdown-item",
  dropdownItemActive: "pna-mention-dropdown-item-active"
};
function parseMentions(text) {
  if (!text || typeof text !== "string") return [];
  const mentions = /* @__PURE__ */ new Set();
  let match;
  const re = new RegExp(MENTION_RE.source, "g");
  while ((match = re.exec(text)) !== null) {
    mentions.add(match[1]);
  }
  return [...mentions];
}
function renderMentions(text, options = {}) {
  if (!text) return "";
  const { currentUser } = options;
  const escaped = escapeHtml(text);
  return escaped.replace(/@([a-zA-Z0-9_]{2,30})/g, (fullMatch, username) => {
    const isSelf = currentUser && username.toLowerCase() === currentUser.toLowerCase();
    const cls = isSelf ? `${CSS.mention} ${CSS.mentionSelf}` : CSS.mention;
    return `<span class="${cls}" data-mention="${escapeHtml(username)}">@${escapeHtml(username)}</span>`;
  });
}
function MentionManager(options = {}) {
  const {
    fetchUsers = () => Promise.resolve([]),
    onMention = () => {
    },
    minChars = 1,
    maxSuggestions = 8
  } = options;
  let _dropdownEl = null;
  let _activeIndex = -1;
  let _suggestions = [];
  let _targetInput = null;
  let _abortController = null;
  function attach(inputEl, attachOptions = {}) {
    if (!inputEl || !isEnabled("mentions")) return;
    _targetInput = inputEl;
    const signal = attachOptions.signal;
    const onInput = () => {
      const cursorPos = inputEl.selectionStart;
      const textBefore = inputEl.value.substring(0, cursorPos);
      const mentionMatch = textBefore.match(/@([a-zA-Z0-9_]{0,30})$/);
      if (mentionMatch && mentionMatch[1].length >= minChars) {
        _showSuggestions(mentionMatch[1], inputEl);
      } else {
        _hideSuggestions();
      }
    };
    const onKeydown = (e) => {
      if (!_dropdownEl) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        _activeIndex = Math.min(_activeIndex + 1, _suggestions.length - 1);
        _updateActiveItem();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        _activeIndex = Math.max(_activeIndex - 1, 0);
        _updateActiveItem();
      } else if (e.key === "Enter" && _activeIndex >= 0) {
        e.preventDefault();
        _selectSuggestion(_activeIndex);
      } else if (e.key === "Escape") {
        _hideSuggestions();
      }
    };
    const onBlur = () => {
      setTimeout(() => _hideSuggestions(), 200);
    };
    const opts = signal ? { signal } : {};
    inputEl.addEventListener("input", onInput, opts);
    inputEl.addEventListener("keydown", onKeydown, opts);
    inputEl.addEventListener("blur", onBlur, opts);
  }
  async function _showSuggestions(query, inputEl) {
    if (_abortController) _abortController.abort();
    _abortController = new AbortController();
    try {
      const users = await fetchUsers(query);
      _suggestions = users.filter((u) => {
        const name = (u.username || u.name || "").toLowerCase();
        return name.includes(query.toLowerCase());
      }).slice(0, maxSuggestions);
      if (_suggestions.length === 0) {
        _hideSuggestions();
        return;
      }
      _activeIndex = 0;
      _renderDropdown(inputEl);
    } catch {
      _hideSuggestions();
    }
  }
  function _renderDropdown(inputEl) {
    _hideSuggestions();
    _dropdownEl = document.createElement("div");
    _dropdownEl.className = CSS.dropdown;
    _dropdownEl.setAttribute("role", "listbox");
    _suggestions.forEach((user, index) => {
      const item = document.createElement("div");
      item.className = `${CSS.dropdownItem}${index === _activeIndex ? ` ${CSS.dropdownItemActive}` : ""}`;
      item.setAttribute("role", "option");
      item.textContent = `@${user.username || user.name}`;
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        _selectSuggestion(index);
      });
      _dropdownEl.appendChild(item);
    });
    const rect = inputEl.getBoundingClientRect();
    _dropdownEl.style.position = "absolute";
    _dropdownEl.style.left = `${rect.left}px`;
    _dropdownEl.style.top = `${rect.bottom + 2}px`;
    _dropdownEl.style.minWidth = `${Math.min(rect.width, 250)}px`;
    document.body.appendChild(_dropdownEl);
  }
  function _updateActiveItem() {
    if (!_dropdownEl) return;
    const items = _dropdownEl.querySelectorAll(`.${CSS.dropdownItem}`);
    items.forEach((item, i) => {
      item.classList.toggle(CSS.dropdownItemActive, i === _activeIndex);
    });
  }
  function _selectSuggestion(index) {
    const user = _suggestions[index];
    if (!user || !_targetInput) return;
    const username = user.username || user.name;
    const cursorPos = _targetInput.selectionStart;
    const text = _targetInput.value;
    const beforeCursor = text.substring(0, cursorPos);
    const afterCursor = text.substring(cursorPos);
    const mentionStart = beforeCursor.lastIndexOf("@");
    if (mentionStart !== -1) {
      _targetInput.value = beforeCursor.substring(0, mentionStart) + `@${username} ` + afterCursor;
      const newPos = mentionStart + username.length + 2;
      _targetInput.setSelectionRange(newPos, newPos);
    }
    _hideSuggestions();
    onMention(user);
    _log("debug", `Mention inserted: @${username}`);
  }
  function _hideSuggestions() {
    if (_dropdownEl) {
      _dropdownEl.remove();
      _dropdownEl = null;
    }
    _activeIndex = -1;
    _suggestions = [];
  }
  function detach() {
    _hideSuggestions();
    _targetInput = null;
    if (_abortController) _abortController.abort();
  }
  return { attach, detach, parseMentions, renderMentions };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  const result = parseMentions("Hello @admin, check this");
  const selfTestPassed = result.length === 1 && result[0] === "admin";
  return {
    status: selfTestPassed ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    selfTestPassed
  };
}
var mentions_default = { MentionManager, parseMentions, renderMentions, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  MentionManager,
  VERSION,
  mentions_default as default,
  healthCheck,
  info,
  injectPorts,
  parseMentions,
  renderMentions
};
