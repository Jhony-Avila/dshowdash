const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.error-handler.component-boundary";
function createComponentBoundaryFactory(options = {}) {
  const { wrappers, errorStore, logger } = options;
  return {
    // Cria boundary para componente
    create(componentId, boundaryOptions = {}) {
      const { onError, fallbackUI, maxRetries = 3 } = boundaryOptions;
      let _errorState = null;
      let _retryCount = 0;
      return {
        wrap(method) {
          return wrappers.withErrorBoundary(method, {
            moduleId: componentId,
            onError: (errorInfo) => {
              _errorState = errorInfo;
              onError?.(errorInfo);
            },
            recover: true,
            fallback: fallbackUI
          });
        },
        hasError: () => _errorState !== null,
        getError: () => _errorState,
        clearError: () => {
          _errorState = null;
          _retryCount = 0;
        },
        async retry(fn) {
          if (_retryCount >= maxRetries) {
            logger?.warn(`Max retries (${maxRetries}) reached for ${componentId}`);
            return false;
          }
          _retryCount++;
          _errorState = null;
          try {
            await fn();
            return true;
          } catch (e) {
            _errorState = errorStore.createErrorInfo(e, { moduleId: componentId, retryCount: _retryCount });
            return false;
          }
        },
        getRetryCount: () => _retryCount,
        canRetry: () => _retryCount < maxRetries
      };
    }
  };
}
var component_boundary_default = { createComponentBoundaryFactory };
export {
  MODULE_ID,
  VERSION,
  createComponentBoundaryFactory,
  component_boundary_default as default
};
