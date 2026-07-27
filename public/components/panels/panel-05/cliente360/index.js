import { render } from "./render.js";
import { IconRegistry } from "/components/icon-registry/index.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:cliente360";
const ICONS = {
  get arrowLeft() {
    return IconRegistry.get("ui:arrow-left") || "";
  },
  get star() {
    return IconRegistry.get("ui:star") || "";
  },
  get phone() {
    return IconRegistry.get("business:phone") || "";
  },
  get mail() {
    return IconRegistry.get("business:mail") || "";
  },
  get messageCircle() {
    return IconRegistry.get("business:message") || "";
  },
  get mapPin() {
    return IconRegistry.get("business:map-pin") || "";
  },
  get building() {
    return IconRegistry.get("business:building") || "";
  },
  get dollarSign() {
    return IconRegistry.get("business:dollar") || "";
  },
  get fileText() {
    return IconRegistry.get("business:file-text") || "";
  },
  get trendingUp() {
    return IconRegistry.get("charts:trending-up") || "";
  },
  get trendingDown() {
    return IconRegistry.get("charts:trending-down") || "";
  },
  get alertTriangle() {
    return IconRegistry.get("system:alert-triangle") || "";
  },
  get users() {
    return IconRegistry.get("business:users") || "";
  },
  get calendar() {
    return IconRegistry.get("business:calendar") || "";
  },
  get activity() {
    return IconRegistry.get("charts:activity") || "";
  }
};
function _getToast() {
  if (window.Core?.windowAdapter?.get) {
    const wt = window.Core.windowAdapter.get("Toast");
    if (wt) return wt;
  }
  if (isStrict()) return null;
  if (window.Toast) {
    recordViolation("WINDOW_TOAST_FALLBACK", { module: MODULE_ID });
    return window.Toast;
  }
  return null;
}
class Cliente360 {
  constructor(container, options = {}) {
    this._container = container;
    this._options = options;
    this._data = null;
    this._activeTab = "geral";
    this._onBack = options.onBack || (() => {
    });
    this._onFavorito = options.onFavorito || (() => {
    });
  }
  show(data) {
    this._data = this._normalize(data);
    this._container.innerHTML = render(this._data, ICONS, this._activeTab);
    this._container.style.display = "block";
    this._bindEvents();
  }
  hide() {
    this._container.style.display = "none";
    this._container.innerHTML = "";
    this._data = null;
  }
  _normalize(data) {
    const c = data?.cliente || data || {};
    return {
      id: c.Id_Organizacao || c.id,
      nome: c.Nome_Empresa || c.nome || "",
      cnpj: c.Cnpj || c.cnpj || "",
      telefone: c.Telefone_Principal || c.telefone || "",
      email: c.Email_Principal || c.email || "",
      cidade: c.Municipio_Endereco || c.cidade || "",
      uf: c.Uf_Endereco || c.uf || "",
      cep: c.Cep_Endereco || c.cep || "",
      bairro: c.Bairro_Endereco || c.bairro || "",
      endereco: c.Logradouro_Endereco || c.endereco || "",
      porte: c.Porte_Empresa || c.porte || "",
      setor: c.Setor_Atuacao || c.setor || "",
      status: c.status || (c.Flag_Ativo === -1 ? "ativo" : "inativo"),
      receita: parseFloat(String(c.Receita_Gerada || c.receita || 0)),
      aReceber: parseFloat(String(c.A_Receber || c.aReceber || 0)),
      ultimaCompra: c.Data_Ultima_Compra || c.ultimaCompra || null,
      dataCadastro: c.Data_Cadastro || c.dataCadastro || null,
      orcamentos: c.orcamentos || [],
      contatos: c.contatos || [],
      historico: c.historico || [],
      metricas: c.metricas || {},
      risco: c.risco || null
    };
  }
  _bindEvents() {
    this._container.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;
      const action = target.dataset.action;
      switch (action) {
        case "back":
          this._onBack();
          break;
        case "toggle-fav":
          this._onFavorito(this._data?.id);
          break;
        case "tab":
          this._switchTab(target.dataset.tab);
          break;
        case "copy":
          this._copyToClipboard(target.dataset.value);
          break;
      }
    });
  }
  _switchTab(tab) {
    if (tab === this._activeTab) return;
    this._activeTab = tab;
    this._container.querySelectorAll('[data-action="tab"]').forEach((btn) => {
      const el = btn;
      el.classList.toggle("p05-active", el.dataset.tab === tab);
    });
    this._container.querySelectorAll("[data-tab-content]").forEach((content) => {
      const el = content;
      el.style.display = el.dataset.tabContent === tab ? "block" : "none";
    });
  }
  _copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      const toast = _getToast();
      toast?.show?.({ type: "success", message: "Copiado!" });
    });
  }
  destroy() {
    this._container.innerHTML = "";
    this._data = null;
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, hasData: !!this._data, source: "IconRegistry" };
  }
  healthCheck() {
    return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
  }
}
var cliente360_default = Cliente360;
export {
  Cliente360,
  MODULE_ID,
  VERSION,
  cliente360_default as default
};
