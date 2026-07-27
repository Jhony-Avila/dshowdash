import { CSS_PREFIX, CLASSES, STUB_PANEL_ID } from "../../core/constants.js";
function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function renderItem(item) {
  const stateClass = item.isActive ? CLASSES.itemActive : CLASSES.itemInactive;
  const isStub = item.panelId === STUB_PANEL_ID;
  const panelBadge = item.panelId ? `<span class="${CSS_PREFIX}-item__panel${isStub ? ` ${CSS_PREFIX}-item__panel--stub` : ""}">${esc(item.panelId)}</span>` : `<span class="${CSS_PREFIX}-item__panel ${CSS_PREFIX}-item__panel--none">\u2014</span>`;
  const statusLabel = item.isActive ? "Ativo" : "Inativo";
  return `
    <li class="${CSS_PREFIX}-item ${stateClass}" data-item-id="${esc(item.id)}">
      <span class="${CSS_PREFIX}-item__icon" aria-hidden="true">${esc(item.icon || "\u2022")}</span>
      <span class="${CSS_PREFIX}-item__label">${esc(item.label)}</span>
      <span class="${CSS_PREFIX}-item__route">${esc(item.href || "")}</span>
      ${panelBadge}
      <span class="${CSS_PREFIX}-item__status" data-active="${item.isActive ? "1" : "0"}">${statusLabel}</span>
      <span class="${CSS_PREFIX}-item__controls">
        <button type="button" class="${CSS_PREFIX}-btn-icon" data-action="edit" data-item-id="${esc(item.id)}" title="Editar">\u270E</button>
        <button type="button" class="${CSS_PREFIX}-btn-icon" data-action="toggle" data-item-id="${esc(item.id)}" title="${item.isActive ? "Desativar" : "Ativar"}">${item.isActive ? "\u23FB" : "\u25CB"}</button>
      </span>
    </li>`;
}
function renderGroup(group) {
  const body = group.items.length > 0 ? `<ul class="${CSS_PREFIX}-group__items">${group.items.map(renderItem).join("")}</ul>` : `<p class="${CSS_PREFIX}-group__empty">Sem bot\xF5es neste grupo</p>`;
  return `
    <section class="${CSS_PREFIX}-group" data-group-key="${esc(group.group_key)}">
      <h3 class="${CSS_PREFIX}-group__title">
        ${esc(group.label)}
        <span class="${CSS_PREFIX}-group__count">${group.items.length}</span>
      </h3>
      ${body}
    </section>`;
}
function renderGroupList(groups) {
  if (!groups || groups.length === 0) return "";
  return `<div class="${CSS_PREFIX}-list">${groups.map(renderGroup).join("")}</div>`;
}
export {
  renderGroupList
};
