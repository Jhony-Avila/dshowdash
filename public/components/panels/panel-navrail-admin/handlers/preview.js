let _container = null;
let _expanded = false;
function init(container, state) {
  _container = container;
  update(container, state);
}
function update(container, state) {
  const previewSection = container.querySelector('[data-slot="preview"]');
  if (!previewSection) return;
  const items = state.items.filter((i) => i._raw?.is_active === 1);
  const grouped = {};
  items.forEach((item) => {
    const group = item.group || "outros";
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(item);
  });
  Object.keys(grouped).forEach((group) => {
    grouped[group].sort((a, b) => (a.order || 0) - (b.order || 0));
  });
  const groupOrder = ["operations", "analytics", "data", "integrations", "admin", "system"];
  const sortedGroups = Object.keys(grouped).sort((a, b) => {
    const aIdx = groupOrder.indexOf(a);
    const bIdx = groupOrder.indexOf(b);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });
  const mainGroups = sortedGroups.filter((g) => g !== "system");
  const systemGroup = sortedGroups.includes("system") ? "system" : null;
  const previewContent = previewSection.querySelector(".pna-preview-content");
  if (previewContent) {
    previewContent.innerHTML = `
            <div class="pna-preview-navrail">
                <div class="pna-preview-navrail__main">
                    ${mainGroups.map((group) => `
                        <div class="pna-preview-group" data-preview-group="${group}">
                            ${grouped[group].map((item) => `
                                <div class="pna-preview-item" title="${item.label}">
                                    <span class="pna-preview-item__icon">
                                        ${getIconSvg(item.icon)}
                                    </span>
                                </div>
                            `).join("")}
                        </div>
                    `).join("")}
                </div>
                ${systemGroup ? `
                    <div class="pna-preview-navrail__footer">
                        <div class="pna-preview-group" data-preview-group="system">
                            ${grouped[systemGroup].map((item) => `
                                <div class="pna-preview-item" title="${item.label}">
                                    <span class="pna-preview-item__icon">
                                        ${getIconSvg(item.icon)}
                                    </span>
                                </div>
                            `).join("")}
                        </div>
                    </div>
                ` : ""}
            </div>
        `;
  }
  const statsEl = previewSection.querySelector(".pna-preview-stats");
  if (statsEl) {
    const totalActive = items.length;
    const totalGroups = Object.keys(grouped).length;
    statsEl.innerHTML = `
            <span class="pna-preview-stat">${totalActive} ativos</span>
            <span class="pna-preview-stat">${totalGroups} grupos</span>
        `;
  }
}
function toggleExpand(container) {
  const preview = container.querySelector('[data-slot="preview"]');
  if (preview) {
    _expanded = !_expanded;
    preview.classList.toggle("pna-preview--expanded", _expanded);
  }
}
function getIconSvg(iconName) {
  const icons = {
    "home": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    "grid": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    "dollar-sign": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    "briefcase": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    "users": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    "bar-chart-2": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    "bell": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    "settings": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    "help-circle": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    "sidebar": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>'
  };
  return icons[iconName] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { previewReady: true } };
}
export {
  healthCheck,
  info,
  init,
  toggleExpand,
  update
};
