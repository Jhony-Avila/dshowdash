import { DATA_SOURCE, ITEM_ACTION_TYPE, VISIBILITY_MODE, createModel } from "../domain/accordion.contracts.js";
const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "components.accordion.mock";
const MOCK_SECTIONS = [
  {
    id: "sec-dashboard",
    label: "Dashboard",
    icon: "dashboard",
    order: 10,
    defaultOpen: true,
    collapsible: true,
    items: [
      {
        id: "item-dashboard-home",
        label: "Home",
        icon: "home",
        order: 10,
        type: ITEM_ACTION_TYPE.PANEL,
        target: { panelId: "panel-dashboard", containerId: "container-main" }
      },
      {
        id: "item-dashboard-analytics",
        label: "Analytics",
        icon: "chart-bar",
        order: 20,
        type: ITEM_ACTION_TYPE.PANEL,
        target: { panelId: "panel-analytics", containerId: "container-main" },
        badge: { type: "count", value: 5, variant: "info" }
      },
      {
        id: "item-dashboard-reports",
        label: "Relat\xF3rios",
        icon: "file-text",
        order: 30,
        type: ITEM_ACTION_TYPE.PANEL,
        target: { panelId: "panel-reports", containerId: "container-main" }
      }
    ]
  },
  {
    id: "sec-operacional",
    label: "Operacional",
    icon: "settings",
    order: 20,
    defaultOpen: false,
    collapsible: true,
    items: [
      {
        id: "item-op-clientes",
        label: "Clientes",
        icon: "users",
        order: 10,
        type: ITEM_ACTION_TYPE.PANEL,
        target: { panelId: "panel-clientes", containerId: "container-main" }
      },
      {
        id: "item-op-produtos",
        label: "Produtos",
        icon: "box",
        order: 20,
        type: ITEM_ACTION_TYPE.PANEL,
        target: { panelId: "panel-produtos", containerId: "container-main" }
      },
      {
        id: "item-op-pedidos",
        label: "Pedidos",
        icon: "shopping-cart",
        order: 30,
        type: ITEM_ACTION_TYPE.PANEL,
        target: { panelId: "panel-pedidos", containerId: "container-main" },
        badge: { type: "dot", pulse: true, variant: "warning" }
      },
      {
        id: "item-op-estoque",
        label: "Estoque",
        icon: "package",
        order: 40,
        type: ITEM_ACTION_TYPE.PANEL,
        target: { panelId: "panel-estoque", containerId: "container-main" }
      }
    ]
  },
  {
    id: "sec-admin",
    label: "Administra\xE7\xE3o",
    icon: "shield",
    order: 30,
    defaultOpen: false,
    collapsible: true,
    visibilityPolicy: {
      mode: VISIBILITY_MODE.DISABLE,
      triggerId: "admin.access",
      fallback: VISIBILITY_MODE.DISABLE,
      reason: "Requer permiss\xE3o de administrador"
    },
    items: [
      {
        id: "item-admin-users",
        label: "Usu\xE1rios",
        icon: "user-cog",
        order: 10,
        type: ITEM_ACTION_TYPE.PANEL,
        target: { panelId: "panel-usuarios", containerId: "container-main" },
        visibilityPolicy: {
          mode: VISIBILITY_MODE.DISABLE,
          triggerId: "admin.users.manage",
          fallback: VISIBILITY_MODE.DISABLE
        }
      },
      {
        id: "item-admin-permissions",
        label: "Permiss\xF5es",
        icon: "key",
        order: 20,
        type: ITEM_ACTION_TYPE.PANEL,
        target: { panelId: "panel-permissoes", containerId: "container-main" },
        visibilityPolicy: {
          mode: VISIBILITY_MODE.DISABLE,
          triggerId: "admin.permissions.manage",
          fallback: VISIBILITY_MODE.DISABLE
        }
      },
      {
        id: "item-admin-config",
        label: "Configura\xE7\xF5es",
        icon: "sliders",
        order: 30,
        type: ITEM_ACTION_TYPE.PANEL,
        target: { panelId: "panel-config", containerId: "container-main" }
      },
      {
        id: "item-admin-logs",
        label: "Logs do Sistema",
        icon: "terminal",
        order: 40,
        type: ITEM_ACTION_TYPE.PANEL,
        target: { panelId: "panel-logs", containerId: "container-main" },
        badge: { type: "label", label: "Beta", variant: "secondary" }
      }
    ]
  }
];
const MOCK_MODEL = {
  version: "1.0.0",
  source: DATA_SOURCE.MOCK,
  generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
  context: {
    tenantId: "mock-tenant",
    environment: "development",
    featureFlags: {
      accordionEnabled: true,
      uarpsEnforcement: "e0"
    }
  },
  defaults: {
    mode: "multi",
    persist: {
      enabled: true,
      scope: "user",
      precedence: ["local", "model"]
    }
  },
  sections: MOCK_SECTIONS,
  meta: {
    description: "Mock data para desenvolvimento do Accordion",
    author: "DshowDash Team",
    warning: "N\xC3O USAR EM PRODU\xC7\xC3O - Substituir por dados do NCS Admin"
  }
};
function getMockModel() {
  return createModel({
    ...MOCK_MODEL,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
function getMockSections() {
  return [...MOCK_SECTIONS];
}
function getMockSection(sectionId) {
  return MOCK_SECTIONS.find((s) => s.id === sectionId) ?? null;
}
function getMockItem(itemId) {
  for (const section of MOCK_SECTIONS) {
    const item = section.items?.find((i) => i.id === itemId);
    if (item) return item;
  }
  return null;
}
const MINIMAL_MOCK_MODEL = {
  version: "1.0.0",
  source: DATA_SOURCE.MOCK,
  sections: [
    {
      id: "sec-test-1",
      label: "Test Section 1",
      defaultOpen: true,
      items: [
        {
          id: "item-test-1",
          label: "Test Item 1",
          type: ITEM_ACTION_TYPE.PANEL,
          target: { panelId: "panel-test-1" }
        }
      ]
    },
    {
      id: "sec-test-2",
      label: "Test Section 2",
      defaultOpen: false,
      items: [
        {
          id: "item-test-2",
          label: "Test Item 2",
          type: ITEM_ACTION_TYPE.PANEL,
          target: { panelId: "panel-test-2" }
        }
      ]
    }
  ]
};
function getMinimalMockModel() {
  return createModel({
    ...MINIMAL_MOCK_MODEL,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
const EMPTY_MOCK_MODEL = {
  version: "1.0.0",
  source: DATA_SOURCE.MOCK,
  sections: []
};
function getEmptyMockModel() {
  return createModel({
    ...EMPTY_MOCK_MODEL,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    mockSectionsCount: MOCK_SECTIONS.length,
    mockItemsCount: MOCK_SECTIONS.reduce((acc, s) => acc + (s.items?.length ?? 0), 0),
    warning: "Mock data - n\xE3o usar em produ\xE7\xE3o"
  };
}
function healthCheck() {
  const sectionsValid = MOCK_SECTIONS.length > 0;
  const allSectionsHaveId = MOCK_SECTIONS.every((s) => s.id && s.label);
  return {
    status: sectionsValid && allSectionsHaveId ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      sectionsValid,
      allSectionsHaveId,
      isMockData: true
    },
    timestamp: Date.now()
  };
}
var accordion_mock_default = {
  VERSION,
  MODULE_ID,
  MOCK_SECTIONS,
  MOCK_MODEL,
  MINIMAL_MOCK_MODEL,
  EMPTY_MOCK_MODEL,
  getMockModel,
  getMockSections,
  getMockSection,
  getMockItem,
  getMinimalMockModel,
  getEmptyMockModel,
  info,
  healthCheck
};
export {
  EMPTY_MOCK_MODEL,
  MINIMAL_MOCK_MODEL,
  MOCK_MODEL,
  MOCK_SECTIONS,
  MODULE_ID,
  VERSION,
  accordion_mock_default as default,
  getEmptyMockModel,
  getMinimalMockModel,
  getMockItem,
  getMockModel,
  getMockSection,
  getMockSections,
  healthCheck,
  info
};
