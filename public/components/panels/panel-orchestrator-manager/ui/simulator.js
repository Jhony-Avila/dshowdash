const MODULE_ID = "panel-orchestrator-manager-simulator";
const VERSION = "9.3.0-P2-ENTERPRISE";
const SVGS = {
  target: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
  play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  xCircle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  barChart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
  clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  checkCircle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  warning: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  arrowDown: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="6 9 12 15 18 9"/></svg>'
};
const simulator = {
  renderSimulatorModal(triggers, lastResult) {
    triggers = triggers || [];
    lastResult = lastResult || null;
    return `<div class="pom-modal__header"><h2>${SVGS.target} Intent Simulator</h2><button class="pom-modal__close" data-action="close-modal">${SVGS.x}</button></div><div class="pom-simulator"><div class="pom-simulator__input"><div class="pom-form__group"><label>Selecione um Trigger</label><select class="pom-simulator__select" data-simulator="trigger-select"><option value="">-- Selecione --</option>${this._groupTriggersByComponent(triggers)}</select></div><div class="pom-simulator__or">ou</div><div class="pom-form__group"><label>Digite um Intent ID</label><input type="text" class="pom-simulator__intent-input" data-simulator="intent-input" placeholder="ex: nav.home, header.notifications"></div><div class="pom-simulator__actions"><button class="pom-btn pom-btn--primary" data-action="simulate-preview">${SVGS.search} Preview</button><button class="pom-btn pom-btn--success" data-action="simulate-execute">${SVGS.play} Executar</button></div></div><div class="pom-simulator__result" data-simulator="result">${lastResult ? this.renderResult(lastResult) : this.renderEmptyResult()}</div></div>`;
  },
  _groupTriggersByComponent(triggers) {
    const grouped = {};
    for (let i = 0; i < triggers.length; i++) {
      const t = triggers[i];
      const comp = t.component || "other";
      if (!grouped[comp]) grouped[comp] = [];
      grouped[comp].push(t);
    }
    let result = "";
    for (const compKey in grouped) {
      if (grouped.hasOwnProperty(compKey)) {
        const items = grouped[compKey];
        result += `<optgroup label="${compKey.toUpperCase()}">`;
        for (let j = 0; j < items.length; j++) {
          const item = items[j];
          result += `<option value="${item.trigger_key}" data-intent="${item.intent_id}">${item.trigger_key} ${SVGS.arrowDown} ${item.intent_id}</option>`;
        }
        result += "</optgroup>";
      }
    }
    return result;
  },
  renderEmptyResult() {
    return `<div class="pom-simulator__empty"><span class="pom-simulator__empty-icon">${SVGS.target}</span><p>Selecione um trigger ou digite um intent para simular</p></div>`;
  },
  renderResult(result) {
    const success = result.success;
    const trigger = result.trigger;
    const intent = result.intent;
    const resolution = result.resolution;
    const error = result.error;
    const executionTime = result.executionTime;
    if (error) {
      return `<div class="pom-simulator__error"><h4>${SVGS.xCircle} Erro na Simula\xE7\xE3o</h4><p>${error}</p></div>`;
    }
    const resolutionHtml = resolution ? `<div class="pom-simulator__resolution"><div><span class="pom-label">Action:</span> <span class="pom-badge">${resolution["action"]}</span></div><div><span class="pom-label">Target:</span> <code>${resolution["target"]}</code></div><div><span class="pom-label">Region:</span> ${resolution["region"] || "main"}</div>${resolution["path"] ? `<div><span class="pom-label">Path:</span> <code>${resolution["path"]}</code></div>` : ""}</div>` : '<span class="pom-text--error">Sem regra de resolu\xE7\xE3o</span>';
    return `<div class="pom-simulator__flow"><h4>${SVGS.barChart} Fluxo de Resolu\xE7\xE3o</h4><div class="pom-simulator__step"><span class="pom-simulator__step-num">1</span><div class="pom-simulator__step-content"><strong>Trigger</strong><code>${trigger || "N/A"}</code></div></div><div class="pom-simulator__arrow">${SVGS.arrowDown}</div><div class="pom-simulator__step"><span class="pom-simulator__step-num">2</span><div class="pom-simulator__step-content"><strong>Intent</strong><code>${intent}</code></div></div><div class="pom-simulator__arrow">${SVGS.arrowDown}</div><div class="pom-simulator__step ${resolution ? "" : "pom-simulator__step--error"}"><span class="pom-simulator__step-num">3</span><div class="pom-simulator__step-content"><strong>Resolution</strong>${resolutionHtml}</div></div><div class="pom-simulator__meta"><span>${SVGS.clock} ${executionTime || 0}ms</span><span class="pom-status ${success ? "pom-status--active" : "pom-status--inactive"}">${success ? `${SVGS.checkCircle} Resolvido` : `${SVGS.warning} Fallback`}</span></div></div>`;
  },
  renderExecutionResult(result) {
    return `<div class="pom-simulator__executed"><h4>${SVGS.play} Execu\xE7\xE3o Realizada</h4><div class="pom-simulator__execution-details"><div><span class="pom-label">Intent:</span> <code>${result.intent}</code></div><div><span class="pom-label">Action:</span> <span class="pom-badge pom-badge--success">${result.action}</span></div><div><span class="pom-label">Target:</span> <code>${result.target}</code></div><div><span class="pom-label">Status:</span> ${SVGS.checkCircle} Executado com sucesso</div></div></div>`;
  }
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var simulator_default = simulator;
export {
  MODULE_ID,
  VERSION,
  simulator_default as default,
  healthCheck,
  info,
  simulator
};
