const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.navigation-history.helpers.entry";
function createEntry(panelId, state = {}, title = "", config) {
  return {
    id: `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    panelId,
    state,
    title: title || panelId,
    timestamp: Date.now(),
    url: config.useBrowserHistory ? `${config.baseUrl}/${panelId}` : null
  };
}
export {
  MODULE_ID,
  VERSION,
  createEntry
};
