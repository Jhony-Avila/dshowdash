const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/duplicate";
class DuplicateManager {
  constructor(options = {}) {
    this.onDuplicate = options.onDuplicate || (() => {
    });
    this.excludeFields = options.excludeFields || ["id", "Id_Requisicao", "data_requisicao", "Data_Requisicao", "created_at", "updated_at"];
    this.defaultValues = options.defaultValues || { id_situacao: 1304 };
  }
  prepare(item) {
    const duplicate = {};
    for (const [key, value] of Object.entries(item)) {
      if (!this.excludeFields.includes(key)) {
        duplicate[key] = value;
      }
    }
    for (const [key, value] of Object.entries(this.defaultValues)) {
      duplicate[key] = value;
    }
    duplicate._duplicatedFrom = item.id || item.Id_Requisicao;
    duplicate._duplicatedAt = (/* @__PURE__ */ new Date()).toISOString();
    return duplicate;
  }
  async execute(item, apiClient) {
    const data = this.prepare(item);
    try {
      const result = await apiClient.post("/api/requisicoes", data);
      this.onDuplicate({ original: item, duplicate: result });
      return result;
    } catch (error) {
      throw new Error(`Falha ao duplicar: ${error.message}`);
    }
  }
  renderConfirmation(item) {
    const id = item.id || item.Id_Requisicao;
    const desc = String(item.descricao || item.Descricao_Requisicao || "").substring(0, 50);
    return `<div class="p01-duplicate-confirm"><p>Duplicar requisicao <strong>#${id}</strong>?</p><p class="p01-text-muted">${desc}</p><div class="p01-duplicate-actions"><button class="p01-btn p01-btn--secondary" data-action="cancel">Cancelar</button><button class="p01-btn p01-btn--primary" data-action="confirm">Duplicar</button></div></div>`;
  }
}
function createDuplicateManager(options = {}) {
  return new DuplicateManager(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var duplicate_default = { DuplicateManager, createDuplicateManager };
export {
  DuplicateManager,
  MODULE_ID,
  VERSION,
  createDuplicateManager,
  duplicate_default as default,
  healthCheck,
  info
};
