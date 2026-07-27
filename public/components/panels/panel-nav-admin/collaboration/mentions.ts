

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.5.0-MIGRATION-PHASE9)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.collaboration.mentions
// PURPOSE: Mentions (@) — Sistema de menções em notas/comentários
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   escapeHtml from ../security/escape-html.js
//   isEnabled from ../config/feature-flags.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   MentionManager — Factory function
//   parseMentions() — Extract @mentions from text
//   renderMentions() — Render text with highlighted mentions
//   info(), healthCheck()
//
// @origin Adapted from panel-01 mentions system for nav-admin domain
// @changelog
//   10.5.0-MIGRATION-PHASE9: Initial creation — FASE 9 J.2
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { escapeHtml } from '../security/escape-html.js';
import { isEnabled } from '../config/feature-flags.js';

export const VERSION = '10.5.0-MIGRATION-PHASE9';
export const MODULE_ID = 'panel-nav-admin.collaboration.mentions';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[Mentions]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * Regex for detecting @mentions.
 * Matches @username where username is alphanumeric + underscores, 2-30 chars.
 * @private
 * @type {RegExp}
 */
const MENTION_RE = /@([a-zA-Z0-9_]{2,30})/g;

/**
 * CSS classes for mentions.
 * @private
 */
const CSS = {
  mention: 'pna-mention',
  mentionSelf: 'pna-mention-self',
  dropdown: 'pna-mention-dropdown',
  dropdownItem: 'pna-mention-dropdown-item',
  dropdownItemActive: 'pna-mention-dropdown-item-active'
};

/**
 * Extract @mentions from a text string.
 *
 * @param {string} text — Input text
 * @returns {Array<string>} Unique usernames mentioned (without @)
 */
export function parseMentions(text: string) {
  if (!text || typeof text !== 'string') return [];

  const mentions = new Set();
  let match;
  const re = new RegExp(MENTION_RE.source, 'g');

  while ((match = re.exec(text)) !== null) {
    mentions.add(match[1]);
  }

  return [...mentions];
}

/**
 * Render text with highlighted @mentions.
 * Escapes HTML and wraps mentions in styled spans.
 *
 * @param {string} text — Input text
 * @param {Object} [options]
 * @param {string} [options.currentUser] — Current user for self-highlight
 * @returns {string} HTML string with highlighted mentions
 */
export function renderMentions(text: string, options: Record<string, string> = {}) {
  if (!text) return '';

  const { currentUser } = options;
  const escaped = escapeHtml(text);

  return escaped.replace(/@([a-zA-Z0-9_]{2,30})/g, (fullMatch, username) => {
    const isSelf = currentUser && username.toLowerCase() === currentUser.toLowerCase();
    const cls = isSelf ? `${CSS.mention} ${CSS.mentionSelf}` : CSS.mention;
    return `<span class="${cls}" data-mention="${escapeHtml(username)}">@${escapeHtml(username)}</span>`;
  });
}

/**
 * Factory: creates a MentionManager for an input element.
 * Provides autocomplete dropdown for @mentions while typing.
 *
 * @param {Object} [options]
 * @param {Function} [options.fetchUsers] — Async function to fetch user list: (query) => [{id, name, username}]
 * @param {Function} [options.onMention] — Callback when a mention is inserted
 * @param {number} [options.minChars=1] — Min chars after @ before showing suggestions
 * @param {number} [options.maxSuggestions=8] — Max suggestions in dropdown
 * @returns {Object} MentionManager instance
 */
export function MentionManager(options: Record<string, any> = {}) {
  const {
    fetchUsers = () => Promise.resolve([]),
    onMention = () => {},
    minChars = 1,
    maxSuggestions = 8
  } = options;

  /** @private */
  let _dropdownEl: HTMLElement | null = null;
  let _activeIndex = -1;
  let _suggestions: Record<string, string>[] = [];
  let _targetInput: HTMLInputElement | null = null;
  let _abortController: AbortController | null = null;

  /**
   * Attach the mention manager to an input/textarea element.
   *
   * @param {HTMLElement} inputEl — Input or textarea element
   * @param {Object} [attachOptions]
   * @param {AbortSignal} [attachOptions.signal] — For cleanup
   */
  function attach(inputEl: HTMLInputElement, attachOptions: Record<string, unknown> = {}) {
    if (!inputEl || !isEnabled('mentions')) return;

    _targetInput = inputEl;
    const signal = attachOptions.signal as AbortSignal | undefined;

    const onInput = () => {
      const cursorPos = inputEl.selectionStart;
      // @ts-expect-error strict migration — TS2345
      const textBefore = inputEl.value.substring(0, cursorPos);
      const mentionMatch = textBefore.match(/@([a-zA-Z0-9_]{0,30})$/);

      if (mentionMatch && mentionMatch[1].length >= minChars) {
        _showSuggestions(mentionMatch[1], inputEl);
      } else {
        _hideSuggestions();
      }
    };

    const onKeydown = (e: KeyboardEvent) => {
      if (!_dropdownEl) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        _activeIndex = Math.min(_activeIndex + 1, _suggestions.length - 1);
        _updateActiveItem();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        _activeIndex = Math.max(_activeIndex - 1, 0);
        _updateActiveItem();
      } else if (e.key === 'Enter' && _activeIndex >= 0) {
        e.preventDefault();
        _selectSuggestion(_activeIndex);
      } else if (e.key === 'Escape') {
        _hideSuggestions();
      }
    };

    const onBlur = () => {
      setTimeout(() => _hideSuggestions(), 200);
    };

    const opts: AddEventListenerOptions = signal ? { signal } : {};
    inputEl.addEventListener('input', onInput, opts);
    inputEl.addEventListener('keydown', onKeydown, opts);
    inputEl.addEventListener('blur', onBlur, opts);
  }

  /**
   * Show user suggestions dropdown.
   * @private
   */
  async function _showSuggestions(query: string, inputEl: HTMLInputElement) {
    // Cancel previous fetch
    if (_abortController) _abortController.abort();
    _abortController = new AbortController();

    try {
      const users = await fetchUsers(query);
      _suggestions = (users as Record<string, string>[])
        .filter((u: Record<string, string>) => {
          const name = (u.username || u.name || '').toLowerCase();
          return name.includes(query.toLowerCase());
        })
        .slice(0, maxSuggestions);

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

  /**
   * Render the dropdown.
   * @private
   */
  function _renderDropdown(inputEl: HTMLInputElement) {
    _hideSuggestions();

    _dropdownEl = document.createElement('div');
    _dropdownEl.className = CSS.dropdown;
    _dropdownEl.setAttribute('role', 'listbox');

    _suggestions.forEach((user: Record<string, string>, index: number) => {
      const item = document.createElement('div');
      item.className = `${CSS.dropdownItem}${index === _activeIndex ? ` ${CSS.dropdownItemActive}` : ''}`;
      item.setAttribute('role', 'option');
      item.textContent = `@${user.username || user.name}`;
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        _selectSuggestion(index);
      });
      _dropdownEl!.appendChild(item);
    });

    // Position near the input
    const rect = inputEl.getBoundingClientRect();
    _dropdownEl.style.position = 'absolute';
    _dropdownEl.style.left = `${rect.left}px`;
    _dropdownEl.style.top = `${rect.bottom + 2}px`;
    _dropdownEl.style.minWidth = `${Math.min(rect.width, 250)}px`;

    document.body.appendChild(_dropdownEl);
  }

  /**
   * Update active item highlight.
   * @private
   */
  function _updateActiveItem() {
    if (!_dropdownEl) return;
    const items = _dropdownEl.querySelectorAll(`.${CSS.dropdownItem}`);
    items.forEach((item: Element, i: number) => {
      item.classList.toggle(CSS.dropdownItemActive, i === _activeIndex);
    });
  }

  /**
   * Select a suggestion and insert into input.
   * @private
   */
  function _selectSuggestion(index: number) {
    const user = _suggestions[index];
    if (!user || !_targetInput) return;

    const username = user.username || user.name;
    const cursorPos = _targetInput.selectionStart;
    const text = _targetInput.value;
    // @ts-expect-error strict migration — TS2345
    const beforeCursor = text.substring(0, cursorPos);
    // @ts-expect-error strict migration — TS2345
    const afterCursor = text.substring(cursorPos);
    const mentionStart = beforeCursor.lastIndexOf('@');

    if (mentionStart !== -1) {
      _targetInput.value = beforeCursor.substring(0, mentionStart) + `@${username} ` + afterCursor;
      const newPos = mentionStart + username.length + 2;
      _targetInput.setSelectionRange(newPos, newPos);
    }

    _hideSuggestions();
    onMention(user);
    _log('debug', `Mention inserted: @${username}`);
  }

  /**
   * Hide the suggestions dropdown.
   * @private
   */
  function _hideSuggestions() {
    if (_dropdownEl) {
      _dropdownEl.remove();
      _dropdownEl = null;
    }
    _activeIndex = -1;
    _suggestions = [];
  }

  /**
   * Detach and cleanup.
   */
  function detach() {
    _hideSuggestions();
    _targetInput = null;
    if (_abortController) _abortController.abort();
  }

  return { attach, detach, parseMentions, renderMentions };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  // Self-test: parse a mention
  const result = parseMentions('Hello @admin, check this');
  const selfTestPassed = result.length === 1 && result[0] === 'admin';
  return {
    status: selfTestPassed ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    selfTestPassed
  };
}

export default { MentionManager, parseMentions, renderMentions, injectPorts, info, healthCheck, VERSION, MODULE_ID };
