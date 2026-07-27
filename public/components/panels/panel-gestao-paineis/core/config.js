const API = {
  panels: "/api/admin/panels",
  categories: "/api/admin/panels/categories",
  screenshot: (panelId) => `/api/admin/panels/${encodeURIComponent(panelId)}/screenshot`,
  thumbnailBase: "/storage/media/images/thumbnails/panels",
  screenshotBase: "/storage/media/images/screenshots"
};
const CONFIG = {
  refreshInterval: 12e4,
  searchDebounceMs: 300,
  defaultPerPage: 50,
  maxPerPage: 200,
  screenshotPollInterval: 3e3,
  screenshotPollMaxAttempts: 20,
  thumbnailWidth: 400,
  thumbnailHeight: 225,
  cardMinWidth: 260,
  cardMaxWidth: 400
};
export {
  API,
  CONFIG
};
