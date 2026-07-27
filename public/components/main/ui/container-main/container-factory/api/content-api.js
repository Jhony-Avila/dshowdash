const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.container-factory.api.content-api";
function createContentAPI(context) {
  const refs = context.refs;
  const getComponents = context.getComponents;
  return {
    setContent(content) {
      const contentEl = refs.contentEl;
      if (!contentEl) return this;
      if (typeof content === "string") contentEl.innerHTML = content;
      else if (content instanceof HTMLElement) {
        contentEl.innerHTML = "";
        contentEl.appendChild(content);
      }
      return this;
    },
    getContent() {
      return refs.contentEl;
    },
    setTitle(title) {
      getComponents().header?.setTitle?.(title);
      return this;
    },
    setIcon(icon) {
      getComponents().header?.setIcon?.(icon);
      return this;
    }
  };
}
var content_api_default = { createContentAPI };
export {
  MODULE_ID,
  VERSION,
  createContentAPI,
  content_api_default as default
};
