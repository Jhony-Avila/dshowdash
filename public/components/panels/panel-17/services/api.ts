// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-17/services/api
// PURPOSE: API Client - Panel-17
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export class ApiClient {
  [key: string]: any;
  constructor(panelId: string, logger: Record<string, unknown>) {
    this.panelId = panelId;
    this.logger = logger;
    this.activeController = null;
    this.baseURL = '/api/modules/panels';
  }

  async fetchData(options: Record<string, unknown> = {}) {
    const { signal, timeout = 10000 } = options;

    // Criar AbortController se não fornecido
    const controller = signal ? null : new AbortController();
    const abortSignal = signal || controller?.signal;

    if (!signal) {
      this.activeController = controller;
    }

    // Timeout automático
    const timeoutId = setTimeout(() => {
      if (controller) controller.abort();
    }, Number(timeout));

    const url = `${this.baseURL}/${this.panelId}/api.php`;

    try {
      this.logger.debug('api.fetch-start', { url });

      const response = await fetch(url, {
        method: 'GET',
        signal: abortSignal as AbortSignal,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Panel-Id': this.panelId,
          'X-Request-Time': Date.now().toString()
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        this.logger.warn('api.http-error', { status: response.status });
        return {
          success: false,
          error: `HTTP_${response.status}`,
          message: `Erro HTTP: ${response.status}`
        };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        this.logger.error('api.invalid-content-type', { contentType });
        return {
          success: false,
          error: 'INVALID_CONTENT_TYPE',
          message: 'Resposta não é JSON'
        };
      }

      const data = await response.json();

      this.logger.debug('api.fetch-success', {
        dataSize: JSON.stringify(data).length
      });

      return {
        success: true,
        payload: data
      };

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        this.logger.debug('api.aborted');
        return {
          success: false,
          error: 'REQUEST_ABORTED',
          message: 'Requisição cancelada'
        };
      }

      this.logger.error('api.fetch-error', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error.message || 'Erro de rede'
      };
    } finally {
      if (controller) {
        this.activeController = null;
      }
    }
  }

  cancel() {
    if (this.activeController) {
      this.logger.debug('api.cancel');
      this.activeController.abort();
      this.activeController = null;
    }
  }
}

export default ApiClient;

export const MODULE_ID = 'panel-17/services/api';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { apiReady: true } }; }
