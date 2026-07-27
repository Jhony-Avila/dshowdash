const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-chip";
const CHIP_VARIANT = { DEFAULT: "default", PRIMARY: "primary", SUCCESS: "success", WARNING: "warning", DANGER: "danger", INFO: "info" };
const CHIP_SIZE = { SM: "sm", MD: "md", LG: "lg" };
function createChip(options = {}) {
  const {
    label = "",
    variant = CHIP_VARIANT.DEFAULT,
    size = CHIP_SIZE.MD,
    icon = null,
    removable = false,
    clickable = false,
    selected = false,
    disabled = false,
    className = "",
    onRemove,
    onClick
  } = options;
  const chip = document.createElement("span");
  chip.className = `dsd-chip dsd-chip--${variant} dsd-chip--${size} ${clickable ? "dsd-chip--clickable" : ""} ${selected ? "dsd-chip--selected" : ""} ${disabled ? "dsd-chip--disabled" : ""} ${className}`.trim();
  chip.setAttribute("role", clickable ? "button" : "status");
  if (clickable) chip.tabIndex = disabled ? -1 : 0;
  if (disabled) chip.setAttribute("aria-disabled", "true");
  const iconHtml = icon ? `<span class="dsd-chip__icon" aria-hidden="true">${icon}</span>` : "";
  const removeHtml = removable ? `<button type="button" class="dsd-chip__remove" aria-label="Remover ${label}">\xD7</button>` : "";
  chip.innerHTML = `${iconHtml}<span class="dsd-chip__label">${label}</span>${removeHtml}`;
  if (removable) {
    chip.querySelector(".dsd-chip__remove")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!disabled) {
        onRemove?.();
        chip.remove();
      }
    });
  }
  if (clickable && !disabled) {
    chip.addEventListener("click", () => onClick?.());
    chip.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.();
      }
    });
  }
  return {
    element: chip,
    setLabel(text) {
      const el = chip.querySelector(".dsd-chip__label");
      if (el) el.textContent = text;
      return this;
    },
    setSelected(sel) {
      chip.classList.toggle("dsd-chip--selected", sel);
      return this;
    },
    isSelected() {
      return chip.classList.contains("dsd-chip--selected");
    },
    setDisabled(dis) {
      chip.classList.toggle("dsd-chip--disabled", dis);
      chip.setAttribute("aria-disabled", dis ? "true" : "false");
      if (clickable) chip.tabIndex = dis ? -1 : 0;
      return this;
    },
    remove() {
      chip.remove();
    },
    getElement() {
      return chip;
    }
  };
}
function createChipGroup(options = {}) {
  const { chips = [], selectable = false, multiple = false, onChange } = options;
  const group = document.createElement("div");
  group.className = "dsd-chip-group";
  group.setAttribute("role", "group");
  const _chips = [];
  let _selected = /* @__PURE__ */ new Set();
  chips.forEach((chipOpts, i) => {
    const chip = createChip({
      ...chipOpts,
      clickable: selectable,
      onClick: () => {
        if (!selectable) return;
        if (multiple) {
          if (_selected.has(i)) {
            _selected.delete(i);
            chip.setSelected(false);
          } else {
            _selected.add(i);
            chip.setSelected(true);
          }
        } else {
          _chips.forEach((c, idx) => {
            c.setSelected(idx === i);
            _selected = idx === i ? /* @__PURE__ */ new Set([i]) : /* @__PURE__ */ new Set();
          });
        }
        onChange?.([..._selected]);
      }
    });
    _chips.push(chip);
    group.appendChild(chip.element);
  });
  return {
    element: group,
    getSelected() {
      return [..._selected];
    },
    addChip(opts) {
      const c = createChip(opts);
      _chips.push(c);
      group.appendChild(c.element);
      return this;
    },
    getElement() {
      return group;
    }
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
var chip_default = { createChip, createChipGroup, info, healthCheck, VERSION, MODULE_ID, CHIP_VARIANT, CHIP_SIZE };
export {
  CHIP_SIZE,
  CHIP_VARIANT,
  MODULE_ID,
  VERSION,
  createChip,
  createChipGroup,
  chip_default as default,
  healthCheck,
  info
};
