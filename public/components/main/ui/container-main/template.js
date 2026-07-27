const VERSION = "8.1.0-DI-STRICT";
const MODULE_ID = "container-main-template";
const UARPS_REGION = "region:app:container-main";
const ICONS = {
  minimize: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  maximize: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2.5" y="2.5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/></svg>',
  restore: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M4 4V3a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-1" stroke="currentColor" stroke-width="1.5"/></svg>',
  close: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  menu: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="3" r="1" fill="currentColor"/><circle cx="7" cy="7" r="1" fill="currentColor"/><circle cx="7" cy="11" r="1" fill="currentColor"/></svg>',
  fullscreen: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 5V2h3M9 2h3v3M12 9v3H9M5 12H2V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  exitFullscreen: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2v3H2M9 5h3V2M9 12V9h3M2 9h3v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
};
function createContainerTemplate(options = {}) {
  const {
    id = "container",
    title = "Container",
    icon = "",
    variant = "default",
    state = "ready",
    showControls = true,
    showStatus = true,
    collapsible = true,
    closable = false,
    fullscreenable = true,
    className = ""
  } = options;
  const statusClass = `dsd-container__status--${state}`;
  const variantClass = variant !== "default" ? `dsd-container--${variant}` : "";
  let controlsHtml = "";
  if (showControls) {
    controlsHtml = '<div class="dsd-container__controls">';
    if (collapsible) {
      controlsHtml += `<button type="button" class="dsd-container__control dsd-container__control--minimize" data-action="minimize" aria-label="Minimizar" title="Minimizar"><span class="dsd-container__control-icon">${ICONS.minimize}</span></button>`;
    }
    if (fullscreenable) {
      controlsHtml += `<button type="button" class="dsd-container__control dsd-container__control--maximize" data-action="fullscreen" aria-label="Tela cheia" title="Tela cheia"><span class="dsd-container__control-icon">${ICONS.fullscreen}</span></button>`;
    }
    if (closable) {
      controlsHtml += `<button type="button" class="dsd-container__control dsd-container__control--close" data-action="close" aria-label="Fechar" title="Fechar"><span class="dsd-container__control-icon">${ICONS.close}</span></button>`;
    }
    controlsHtml += `<button type="button" class="dsd-container__control dsd-container__control--menu" data-action="menu" aria-label="Menu" title="Mais op\xE7\xF5es"><span class="dsd-container__control-icon">${ICONS.menu}</span></button>`;
    controlsHtml += "</div>";
  }
  return `<div id="${id}" class="dsd-container ${variantClass} ${className} dsd-container--animate-in" data-container-id="${id}" data-state="${state}" data-uarps-region="${UARPS_REGION}" role="region" aria-labelledby="${id}-title" tabindex="0">
    <header class="dsd-container__header" data-draggable="true">
      ${showStatus ? `<div class="dsd-container__status ${statusClass}" aria-label="Status: ${state}"></div>` : ""}
      ${icon ? `<span class="dsd-container__icon" aria-hidden="true">${icon}</span>` : ""}
      <h2 id="${id}-title" class="dsd-container__title">${title}</h2>
      ${controlsHtml}
    </header>
    <div class="dsd-container__body">
      <div class="dsd-container__content" data-slot="content"></div>
      <div class="dsd-container__loading-overlay" aria-hidden="true">
        <div class="dsd-container__spinner"></div>
        <span class="dsd-container__loading-text">Carregando...</span>
      </div>
      <div class="dsd-container__error">
        <span class="dsd-container__error-icon">${ICONS.warning}</span>
        <span class="dsd-container__error-title">Erro ao carregar</span>
        <span class="dsd-container__error-message"></span>
        <button type="button" class="dsd-container__error-retry" data-action="retry">Tentar novamente</button>
      </div>
    </div>
  </div>`;
}
function createSkeletonTemplate(type = "dashboard") {
  if (type === "dashboard") {
    return `<div class="dsd-container__skeleton dsd-skeleton-dashboard">
      <div class="dsd-skeleton-dashboard__header">
        <div class="dsd-skeleton dsd-skeleton--title"></div>
        <div class="dsd-skeleton dsd-skeleton--button"></div>
      </div>
      <div class="dsd-skeleton-dashboard__cards">
        <div class="dsd-skeleton dsd-skeleton--card-sm"></div>
        <div class="dsd-skeleton dsd-skeleton--card-sm"></div>
        <div class="dsd-skeleton dsd-skeleton--card-sm"></div>
        <div class="dsd-skeleton dsd-skeleton--card-sm"></div>
      </div>
      <div class="dsd-skeleton-dashboard__main">
        <div class="dsd-skeleton dsd-skeleton--chart"></div>
        <div class="dsd-skeleton-stack">
          <div class="dsd-skeleton dsd-skeleton--text"></div>
          <div class="dsd-skeleton dsd-skeleton--text-sm"></div>
          <div class="dsd-skeleton dsd-skeleton--text"></div>
          <div class="dsd-skeleton dsd-skeleton--text-lg"></div>
        </div>
      </div>
    </div>`;
  }
  if (type === "list") {
    let rows = "";
    for (let i = 0; i < 5; i++) {
      rows += `<div class="dsd-skeleton-row">
        <div class="dsd-skeleton dsd-skeleton--avatar"></div>
        <div class="dsd-skeleton-stack" style="flex:1">
          <div class="dsd-skeleton dsd-skeleton--text-lg"></div>
          <div class="dsd-skeleton dsd-skeleton--text-sm"></div>
        </div>
      </div>`;
    }
    return `<div class="dsd-container__skeleton">${rows}</div>`;
  }
  if (type === "cards") {
    return `<div class="dsd-container__skeleton">
      <div class="dsd-skeleton-grid">
        <div class="dsd-skeleton dsd-skeleton--card"></div>
        <div class="dsd-skeleton dsd-skeleton--card"></div>
        <div class="dsd-skeleton dsd-skeleton--card"></div>
        <div class="dsd-skeleton dsd-skeleton--card"></div>
        <div class="dsd-skeleton dsd-skeleton--card"></div>
        <div class="dsd-skeleton dsd-skeleton--card"></div>
      </div>
    </div>`;
  }
  return `<div class="dsd-container__skeleton">
    <div class="dsd-skeleton dsd-skeleton--title"></div>
    <div class="dsd-skeleton dsd-skeleton--text"></div>
    <div class="dsd-skeleton dsd-skeleton--text-lg"></div>
    <div class="dsd-skeleton dsd-skeleton--text-sm"></div>
  </div>`;
}
function createEmptyTemplate(options = {}) {
  const {
    icon = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
    title = "Nenhum conte\xFAdo",
    hint = "Selecione um item no menu para come\xE7ar"
  } = options;
  return `<div class="dsd-container__empty">
    <span class="dsd-container__empty-icon">${icon}</span>
    <span class="dsd-container__empty-title">${title}</span>
    <span class="dsd-container__empty-hint">${hint}</span>
  </div>`;
}
function createErrorTemplate(options = {}) {
  const {
    icon = ICONS.warning,
    title = "Erro ao carregar",
    message = "Ocorreu um erro inesperado",
    showRetry = true
  } = options;
  return `<div class="dsd-container__error" style="display:flex">
    <span class="dsd-container__error-icon">${icon}</span>
    <span class="dsd-container__error-title">${title}</span>
    <span class="dsd-container__error-message">${message}</span>
    ${showRetry ? '<button type="button" class="dsd-container__error-retry" data-action="retry">Tentar novamente</button>' : ""}
  </div>`;
}
function getIcons() {
  return { ...ICONS };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    uarpsRegion: UARPS_REGION,
    templates: ["createContainerTemplate", "createSkeletonTemplate", "createEmptyTemplate", "createErrorTemplate"],
    diStrict: true
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    templates: ["createContainerTemplate", "createSkeletonTemplate", "createEmptyTemplate", "createErrorTemplate"],
    uarpsRegion: UARPS_REGION,
    diStrict: true
  };
}
var template_default = {
  createContainerTemplate,
  createSkeletonTemplate,
  createEmptyTemplate,
  createErrorTemplate,
  getIcons,
  info,
  healthCheck,
  VERSION,
  MODULE_ID,
  ICONS,
  UARPS_REGION
};
export {
  MODULE_ID,
  VERSION,
  createContainerTemplate,
  createEmptyTemplate,
  createErrorTemplate,
  createSkeletonTemplate,
  template_default as default,
  getIcons,
  healthCheck,
  info
};
