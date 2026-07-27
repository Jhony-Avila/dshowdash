// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/duplicate
// PURPOSE: Panel-01 - Duplicar Requisicao
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createDuplicateManager() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/utils/duplicate';

export class DuplicateManager {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    this.onDuplicate = options.onDuplicate || (() => {});
    this.excludeFields = options.excludeFields || ['id', 'Id_Requisicao', 'data_requisicao', 'Data_Requisicao', 'created_at', 'updated_at'];
    this.defaultValues = options.defaultValues || { id_situacao: 1304 };
  }

  prepare(item: Record<string, unknown>) {
    const duplicate: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(item)) {
      if (!this.excludeFields.includes(key)) {
        duplicate[key] = value;
      }
    }
    for (const [key, value] of Object.entries(this.defaultValues)) {
      duplicate[key] = value;
    }
    duplicate._duplicatedFrom = item.id || item.Id_Requisicao;
    duplicate._duplicatedAt = new Date().toISOString();
    return duplicate;
  }

  async execute(item: Record<string, unknown>, apiClient: Record<string, (...args: unknown[]) => unknown>) {
    const data = this.prepare(item);
    try {
      const result = await apiClient.post('/api/requisicoes', data);
      this.onDuplicate({ original: item, duplicate: result });
      return result;
    } catch (error) {
      throw new Error(`Falha ao duplicar: ${(error as Error).message}`);
    }
  }

  renderConfirmation(item: Record<string, unknown>) {
    const id = item.id || item.Id_Requisicao;
    const desc = String(item.descricao || item.Descricao_Requisicao || '').substring(0, 50);
    return `<div class="p01-duplicate-confirm"><p>Duplicar requisicao <strong>#${id}</strong>?</p><p class="p01-text-muted">${desc}</p><div class="p01-duplicate-actions"><button class="p01-btn p01-btn--secondary" data-action="cancel">Cancelar</button><button class="p01-btn p01-btn--primary" data-action="confirm">Duplicar</button></div></div>`;
  }
}

export function createDuplicateManager(options: Record<string, unknown> = {}) { return new DuplicateManager(options); }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { DuplicateManager, createDuplicateManager };
