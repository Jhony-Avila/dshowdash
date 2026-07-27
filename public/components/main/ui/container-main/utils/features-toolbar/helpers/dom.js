import { addCleanup, executeAction, hasAction } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.features-toolbar.helpers.dom";
const THROTTLE_MS = 200;
let _lastClickTimes = {};
function _isThrottled(buttonId) {
  const now = Date.now();
  const last = _lastClickTimes[buttonId] || 0;
  if (now - last < THROTTLE_MS) return true;
  _lastClickTimes[buttonId] = now;
  return false;
}
function resetThrottles() {
  _lastClickTimes = {};
}
function _buildAriaLabel(tooltip, shortcut) {
  if (!tooltip) return "";
  if (!shortcut) return tooltip;
  return `${tooltip} (${shortcut})`;
}
function _closeAllDropdowns(exceptEl) {
  const openDropdowns = document.querySelectorAll(".features-toolbar__dropdown.open, .features-toolbar__overflow.open");
  for (let i = 0; i < openDropdowns.length; i++) {
    if (exceptEl && openDropdowns[i] === exceptEl) continue;
    openDropdowns[i].classList.remove("open");
    const trigger = openDropdowns[i].querySelector("[aria-expanded]");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  }
}
let _outsideClickRegistered = false;
function _setupDelegatedOutsideClick() {
  if (_outsideClickRegistered) return;
  _outsideClickRegistered = true;
  const handler = (e) => {
    const openEls = document.querySelectorAll(".features-toolbar__dropdown.open, .features-toolbar__overflow.open");
    for (let i = 0; i < openEls.length; i++) {
      if (!openEls[i].contains(e.target)) {
        openEls[i].classList.remove("open");
        const trigger = openEls[i].querySelector("[aria-expanded]");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
      }
    }
  };
  document.addEventListener("click", handler);
  addCleanup(() => {
    document.removeEventListener("click", handler);
    _outsideClickRegistered = false;
  });
}
function _getNavigableButtons(toolbar) {
  if (!toolbar) return [];
  const allBtns = toolbar.querySelectorAll(".features-toolbar__btn");
  const navigable = [];
  for (let i = 0; i < allBtns.length; i++) {
    const btn = allBtns[i];
    if (btn.closest(".features-toolbar__dropdown-menu") || btn.closest(".features-toolbar__overflow-menu")) continue;
    const group = btn.closest(".features-toolbar__group");
    if (group && group.style.display === "none") continue;
    const overflowParent = btn.closest(".features-toolbar__overflow");
    if (overflowParent && overflowParent.style.display === "none") continue;
    navigable.push(btn);
  }
  return navigable;
}
function _setRovingTabindex(buttons, activeIndex) {
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].setAttribute("tabindex", i === activeIndex ? "0" : "-1");
  }
}
function setupKeyboardNavigation(toolbar) {
  if (!toolbar) return;
  const buttons = _getNavigableButtons(toolbar);
  if (buttons.length === 0) return;
  _setRovingTabindex(buttons, 0);
  const keydownHandler = (e) => {
    const focused = document.activeElement;
    if (!focused || !toolbar.contains(focused)) return;
    if (!focused.classList.contains("features-toolbar__btn")) return;
    const navButtons = _getNavigableButtons(toolbar);
    if (navButtons.length === 0) return;
    let currentIndex = -1;
    for (let i = 0; i < navButtons.length; i++) {
      if (navButtons[i] === focused) {
        currentIndex = i;
        break;
      }
    }
    if (currentIndex === -1) return;
    let newIndex = currentIndex;
    let handled = false;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        newIndex = (currentIndex + 1) % navButtons.length;
        handled = true;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        newIndex = (currentIndex - 1 + navButtons.length) % navButtons.length;
        handled = true;
        break;
      case "Home":
        newIndex = 0;
        handled = true;
        break;
      case "End":
        newIndex = navButtons.length - 1;
        handled = true;
        break;
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      _setRovingTabindex(navButtons, newIndex);
      navButtons[newIndex].focus();
    }
  };
  toolbar.addEventListener("keydown", keydownHandler);
  addCleanup(() => {
    toolbar.removeEventListener("keydown", keydownHandler);
  });
  const focusHandler = (e) => {
    const btn = e.target;
    if (!btn || !btn.classList.contains("features-toolbar__btn")) return;
    if (btn.closest(".features-toolbar__dropdown-menu") || btn.closest(".features-toolbar__overflow-menu")) return;
    const navButtons = _getNavigableButtons(toolbar);
    let idx = -1;
    for (let i = 0; i < navButtons.length; i++) {
      if (navButtons[i] === btn) {
        idx = i;
        break;
      }
    }
    if (idx !== -1) _setRovingTabindex(navButtons, idx);
  };
  toolbar.addEventListener("focusin", focusHandler);
  addCleanup(() => {
    toolbar.removeEventListener("focusin", focusHandler);
  });
}
function _createButton(id, icon, tooltip, shortcut) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "features-toolbar__btn";
  btn.id = `ft-btn-${id}`;
  btn.innerHTML = icon;
  btn.setAttribute("data-tooltip", tooltip);
  btn.setAttribute("data-button-id", id);
  if (shortcut) btn.setAttribute("data-shortcut", shortcut);
  btn.setAttribute("aria-label", _buildAriaLabel(tooltip, shortcut));
  btn.setAttribute("tabindex", "-1");
  const badge = document.createElement("span");
  badge.className = "features-toolbar__badge";
  badge.style.display = "none";
  btn.appendChild(badge);
  const dot = document.createElement("span");
  dot.className = "features-toolbar__dot";
  dot.style.display = "none";
  btn.appendChild(dot);
  btn.disabled = !hasAction(id);
  const handler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (_isThrottled(id)) return;
    executeAction(id, e, btn);
  };
  btn.addEventListener("click", handler);
  addCleanup(() => {
    btn.removeEventListener("click", handler);
  });
  return btn;
}
function _createGroup(buttons, groupId) {
  const group = document.createElement("div");
  group.className = "features-toolbar__group";
  if (groupId) {
    group.setAttribute("data-group-id", groupId);
  }
  buttons.forEach((btn) => {
    group.appendChild(btn);
  });
  return group;
}
function _createDropdown(id, icon, tooltip, items) {
  const dropdown = document.createElement("div");
  dropdown.className = "features-toolbar__dropdown";
  dropdown.id = `ft-dropdown-${id}`;
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "features-toolbar__btn";
  trigger.id = `ft-btn-${id}`;
  trigger.innerHTML = icon;
  trigger.setAttribute("data-tooltip", tooltip);
  trigger.setAttribute("data-button-id", id);
  trigger.setAttribute("aria-label", tooltip);
  trigger.setAttribute("aria-haspopup", "true");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("tabindex", "-1");
  const triggerBadge = document.createElement("span");
  triggerBadge.className = "features-toolbar__badge";
  triggerBadge.style.display = "none";
  trigger.appendChild(triggerBadge);
  const triggerDot = document.createElement("span");
  triggerDot.className = "features-toolbar__dot";
  triggerDot.style.display = "none";
  trigger.appendChild(triggerDot);
  trigger.disabled = !hasAction(id);
  const menu = document.createElement("div");
  menu.className = "features-toolbar__dropdown-menu";
  menu.setAttribute("role", "menu");
  items.forEach((item) => {
    const menuItem = document.createElement("div");
    menuItem.className = "features-toolbar__dropdown-item";
    menuItem.setAttribute("role", "menuitem");
    menuItem.setAttribute("data-action", item.actionId || "");
    const iconHtml = item.icon ? item.icon : '<span class="features-toolbar__dropdown-icon-placeholder"></span>';
    menuItem.innerHTML = `${iconHtml}<span>${item.label}</span>`;
    menuItem.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
      if (item.actionId) {
        if (_isThrottled(item.actionId)) return;
        executeAction(item.actionId, e, menuItem);
      }
    });
    menu.appendChild(menuItem);
  });
  const toggleHandler = (e) => {
    e.stopPropagation();
    const willOpen = !dropdown.classList.contains("open");
    if (willOpen) _closeAllDropdowns(dropdown);
    const isOpen = dropdown.classList.toggle("open");
    trigger.setAttribute("aria-expanded", String(isOpen));
  };
  trigger.addEventListener("click", toggleHandler);
  addCleanup(() => {
    trigger.removeEventListener("click", toggleHandler);
  });
  const escapeHandler = (e) => {
    if (e.key === "Escape" && dropdown.classList.contains("open")) {
      e.stopPropagation();
      dropdown.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
      trigger.focus();
    }
  };
  dropdown.addEventListener("keydown", escapeHandler);
  addCleanup(() => {
    dropdown.removeEventListener("keydown", escapeHandler);
  });
  _setupDelegatedOutsideClick();
  dropdown.appendChild(trigger);
  dropdown.appendChild(menu);
  return dropdown;
}
function _createOverflowButton() {
  const overflow = document.createElement("div");
  overflow.className = "features-toolbar__overflow";
  overflow.id = "ft-overflow";
  overflow.style.display = "none";
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "features-toolbar__btn features-toolbar__overflow-trigger";
  trigger.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>';
  trigger.setAttribute("data-tooltip", "Mais opcoes");
  trigger.setAttribute("aria-label", "Mais opcoes");
  trigger.setAttribute("aria-haspopup", "true");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("tabindex", "-1");
  const menu = document.createElement("div");
  menu.className = "features-toolbar__overflow-menu";
  menu.setAttribute("role", "menu");
  const toggleHandler = (e) => {
    e.stopPropagation();
    const willOpen = !overflow.classList.contains("open");
    if (willOpen) _closeAllDropdowns(overflow);
    const isOpen = overflow.classList.toggle("open");
    trigger.setAttribute("aria-expanded", String(isOpen));
  };
  trigger.addEventListener("click", toggleHandler);
  addCleanup(() => {
    trigger.removeEventListener("click", toggleHandler);
  });
  const escapeHandler = (e) => {
    if (e.key === "Escape" && overflow.classList.contains("open")) {
      e.stopPropagation();
      overflow.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
      trigger.focus();
    }
  };
  overflow.addEventListener("keydown", escapeHandler);
  addCleanup(() => {
    overflow.removeEventListener("keydown", escapeHandler);
  });
  _setupDelegatedOutsideClick();
  overflow.appendChild(trigger);
  overflow.appendChild(menu);
  return overflow;
}
export {
  MODULE_ID,
  VERSION,
  _createButton,
  _createDropdown,
  _createGroup,
  _createOverflowButton,
  resetThrottles,
  setupKeyboardNavigation
};
