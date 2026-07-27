class ApiClient {
  constructor(panelId, logger) {
    this.panelId = panelId;
    this.logger = logger;
    this.activeController = null;
    this.baseURL = "/api/modules/panels";
  }
  async fetchData(options = {}) {
    const { signal, timeout = 1e4 } = options;
    const controller = signal ? null : new AbortController();
    const abortSignal = signal || controller?.signal;
    if (!signal) {
      this.activeController = controller;
    }
    const timeoutId = setTimeout(() => {
      if (controller) controller.abort();
    }, Number(timeout));
    const url = `${this.baseURL}/${this.panelId}/api.php`;
    try {
      this.logger.debug("api.fetch-start", { url });
      const response = await fetch(url, {
        method: "GET",
        signal: abortSignal,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Panel-Id": this.panelId,
          "X-Request-Time": Date.now().toString()
        }
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        this.logger.warn("api.http-error", { status: response.status });
        return {
          success: false,
          error: `HTTP_${response.status}`,
          message: `Erro HTTP: ${response.status}`
        };
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        this.logger.error("api.invalid-content-type", { contentType });
        return {
          success: false,
          error: "INVALID_CONTENT_TYPE",
          message: "Resposta n\xE3o \xE9 JSON"
        };
      }
      const data = await response.json();
      this.logger.debug("api.fetch-success", {
        dataSize: JSON.stringify(data).length
      });
      return {
        success: true,
        payload: data
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        this.logger.debug("api.aborted");
        return {
          success: false,
          error: "REQUEST_ABORTED",
          message: "Requisi\xE7\xE3o cancelada"
        };
      }
      this.logger.error("api.fetch-error", {
        error: error.message,
        stack: error.stack
      });
      return {
        success: false,
        error: "NETWORK_ERROR",
        message: error.message || "Erro de rede"
      };
    } finally {
      if (controller) {
        this.activeController = null;
      }
    }
  }
  cancel() {
    if (this.activeController) {
      this.logger.debug("api.cancel");
      this.activeController.abort();
      this.activeController = null;
    }
  }
}
var api_default = ApiClient;
const MODULE_ID = "panel-02/services/api";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { apiReady: true } };
}
export {
  ApiClient,
  MODULE_ID,
  VERSION,
  api_default as default,
  healthCheck,
  info
};
