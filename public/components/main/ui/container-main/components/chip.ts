// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-chip
// PURPOSE: Container Chip/Tag Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CHIP_VARIANT — exported value
//   CHIP_SIZE — exported value
//   createChip() — exported function
//   createChipGroup() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-chip';

export const CHIP_VARIANT = { DEFAULT: 'default', PRIMARY: 'primary', SUCCESS: 'success', WARNING: 'warning', DANGER: 'danger', INFO: 'info' };
export const CHIP_SIZE = { SM: 'sm', MD: 'md', LG: 'lg' };

export function createChip(options: Record<string, any> = {}) {
  const {
    label = '',
    variant = CHIP_VARIANT.DEFAULT,
    size = CHIP_SIZE.MD,
    icon = null,
    removable = false,
    clickable = false,
    selected = false,
    disabled = false,
    className = '',
    onRemove,
    onClick
  } = options;
  
  const chip = document.createElement('span');
  chip.className = `dsd-chip dsd-chip--${variant} dsd-chip--${size} ${clickable ? 'dsd-chip--clickable' : ''} ${selected ? 'dsd-chip--selected' : ''} ${disabled ? 'dsd-chip--disabled' : ''} ${className}`.trim();
  chip.setAttribute('role', clickable ? 'button' : 'status');
  if (clickable) chip.tabIndex = disabled ? -1 : 0;
  if (disabled) chip.setAttribute('aria-disabled', 'true');
  
  const iconHtml = icon ? `<span class="dsd-chip__icon" aria-hidden="true">${icon}</span>` : '';
  const removeHtml = removable ? `<button type="button" class="dsd-chip__remove" aria-label="Remover ${label}">×</button>` : '';
  
  chip.innerHTML = `${iconHtml}<span class="dsd-chip__label">${label}</span>${removeHtml}`;
  
  if (removable) {
    chip.querySelector('.dsd-chip__remove')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!disabled) { onRemove?.(); chip.remove(); }
    });
  }
  
  if (clickable && !disabled) {
    chip.addEventListener('click', () => onClick?.());
    chip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } });
  }
  
  return {
    element: chip,
    setLabel(text: string) { const el = chip.querySelector('.dsd-chip__label'); if (el) el.textContent = text; return this; },
    setSelected(sel: boolean) { chip.classList.toggle('dsd-chip--selected', sel); return this; },
    isSelected() { return chip.classList.contains('dsd-chip--selected'); },
    setDisabled(dis: boolean) { chip.classList.toggle('dsd-chip--disabled', dis); chip.setAttribute('aria-disabled', dis ? 'true' : 'false'); if (clickable) chip.tabIndex = dis ? -1 : 0; return this; },
    remove() { chip.remove(); },
    getElement() { return chip; }
  };
}

export function createChipGroup(options: Record<string, any> = {}) {
  const { chips = [], selectable = false, multiple = false, onChange } = options;
  
  const group = document.createElement('div');
  group.className = 'dsd-chip-group';
  group.setAttribute('role', 'group');
  
  const _chips: ReturnType<typeof createChip>[] = [];
  let _selected = new Set();
  
  chips.forEach((chipOpts: unknown, i: number) => {
    const chip = createChip({
      ...(chipOpts as Record<string, unknown>),
      clickable: selectable,
      onClick: () => {
        if (!selectable) return;
        if (multiple) {
          if (_selected.has(i)) { _selected.delete(i); chip.setSelected(false); }
          else { _selected.add(i); chip.setSelected(true); }
        } else {
          _chips.forEach((c, idx) => { (c as ReturnType<typeof createChip>).setSelected(idx === i); _selected = idx === i ? new Set([i]) : new Set(); });
        }
        onChange?.([..._selected]);
      }
    });
    _chips.push(chip);
    group.appendChild(chip.element);
  });
  
  return {
    element: group,
    getSelected() { return [..._selected]; },
    addChip(opts: Record<string, unknown>) { const c = createChip(opts); _chips.push(c); group.appendChild(c.element); return this; },
    getElement() { return group; }
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID }; }

export default { createChip, createChipGroup, info, healthCheck, VERSION, MODULE_ID, CHIP_VARIANT, CHIP_SIZE };
