const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.container-factory.api.loading-api";
function createLoadingAPI(context) {
  const state = context.state;
  const refs = context.refs;
  const getComponents = context.getComponents;
  return {
    showLoading() {
      state.loading = true;
      refs.container?.classList?.add("dsd-container--loading");
      const pb = getComponents().progressBar;
      if (pb?.show) {
        const shown = pb.show();
        shown?.setIndeterminate?.(true);
      }
      getComponents().accessibility?.setAriaBusy?.(true);
      return this;
    },
    hideLoading() {
      state.loading = false;
      refs.container?.classList?.remove("dsd-container--loading");
      getComponents().progressBar?.hide?.();
      getComponents().accessibility?.setAriaBusy?.(false);
      return this;
    },
    setProgress(value, variant) {
      const progressBar = getComponents().progressBar;
      if (progressBar?.show) {
        const shown = progressBar.show();
        shown?.setIndeterminate?.(false);
        shown?.setValue?.(value);
      }
      if (variant) progressBar?.setVariant?.(variant);
      return this;
    }
  };
}
var loading_api_default = { createLoadingAPI };
export {
  MODULE_ID,
  VERSION,
  createLoadingAPI,
  loading_api_default as default
};
