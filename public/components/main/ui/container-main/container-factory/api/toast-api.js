const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.container-factory.api.toast-api";
function createToastAPI(context) {
  const getComponents = context.getComponents;
  return {
    toast(message, type = "info") {
      return getComponents().toast?.show?.(message, type);
    },
    toastSuccess(message) {
      return getComponents().toast?.success?.(message);
    },
    toastError(message) {
      return getComponents().toast?.error?.(message);
    },
    toastWarning(message) {
      return getComponents().toast?.warning?.(message);
    },
    toastInfo(message) {
      return getComponents().toast?.info?.(message);
    }
  };
}
var toast_api_default = { createToastAPI };
export {
  MODULE_ID,
  VERSION,
  createToastAPI,
  toast_api_default as default
};
