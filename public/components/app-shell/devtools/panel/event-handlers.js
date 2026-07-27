const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.panel.event-handlers";
function attachEventListeners(panel, state, callbacks) {
  if (!panel) return;
  const closeBtn = panel.querySelector("#dsd-debug-close");
  if (closeBtn) closeBtn.onclick = callbacks.close;
  const refreshBtn = panel.querySelector("#dsd-debug-refresh");
  if (refreshBtn) refreshBtn.onclick = callbacks.forceRender;
  const exportBtn = panel.querySelector("#dsd-debug-export");
  if (exportBtn) exportBtn.onclick = callbacks.exportDiagnostic;
  const copyBtn = panel.querySelector("#dsd-debug-copy");
  if (copyBtn) copyBtn.onclick = callbacks.copyTabData;
  const compactBtn = panel.querySelector("#dsd-debug-compact");
  if (compactBtn) compactBtn.onclick = callbacks.toggleCompact;
  const pinBtn = panel.querySelector("#dsd-debug-pin");
  if (pinBtn) pinBtn.onclick = callbacks.togglePinTab;
  const themeBtn = panel.querySelector("#dsd-debug-theme");
  if (themeBtn) themeBtn.onclick = callbacks.toggleTheme;
  const tabBtns = panel.querySelectorAll(".dsd-ui-tab");
  tabBtns.forEach((btn) => {
    btn.onclick = () => {
      const tabId = btn.getAttribute("data-tab");
      if (tabId) callbacks.switchTab(tabId);
    };
  });
  const searchInput = panel.querySelector("#dsd-debug-search");
  if (searchInput) {
    searchInput.value = state.searchQuery || "";
    searchInput.oninput = (e) => {
      callbacks.onSearchInput(e.target.value);
    };
  }
  const sectionTitles = panel.querySelectorAll(".dsd-ui-section__title--collapsible");
  sectionTitles.forEach((title) => {
    title.onclick = () => {
      const sectionId = title.getAttribute("data-section");
      if (sectionId) callbacks.toggleSection(sectionId);
    };
  });
  const clearNetworkBtn = panel.querySelector("#dsd-debug-clear-network");
  if (clearNetworkBtn) clearNetworkBtn.onclick = callbacks.clearNetwork;
  const scanIdbBtn = panel.querySelector("#dsd-debug-scan-idb");
  if (scanIdbBtn) scanIdbBtn.onclick = callbacks.scanIdb;
  const diffLeftSelect = panel.querySelector("#dsd-diff-left");
  const diffRightSelect = panel.querySelector("#dsd-diff-right");
  const diffRunBtn = panel.querySelector("#dsd-diff-run");
  if (diffRunBtn && diffLeftSelect && diffRightSelect) {
    diffRunBtn.onclick = () => {
      callbacks.runDiff(diffLeftSelect.value, diffRightSelect.value);
    };
  }
  const otelExportBtn = panel.querySelector("#dsd-otel-export");
  if (otelExportBtn && callbacks.otelExport) {
    otelExportBtn.onclick = callbacks.otelExport;
  }
  const validateManifestBtn = panel.querySelector("#dsd-validate-manifest");
  if (validateManifestBtn && callbacks.validateManifest) {
    validateManifestBtn.onclick = callbacks.validateManifest;
  }
  const cancelBootBtn = panel.querySelector("#dsd-cancel-boot");
  if (cancelBootBtn && callbacks.cancelBoot) {
    cancelBootBtn.onclick = callbacks.cancelBoot;
  }
  const snapshotBtns = panel.querySelectorAll("[data-snapshot-action]");
  snapshotBtns.forEach((btn) => {
    btn.onclick = () => {
      const action = btn.getAttribute("data-snapshot-action");
      const id = btn.getAttribute("data-snapshot-id");
      if (callbacks.snapshotAction) callbacks.snapshotAction(action, id);
    };
  });
  const metricsBtns = panel.querySelectorAll("[data-metrics-action]");
  metricsBtns.forEach((btn) => {
    btn.onclick = () => {
      const action = btn.getAttribute("data-metrics-action");
      if (callbacks.metricsAction) callbacks.metricsAction(action);
    };
  });
  const presetBtns = panel.querySelectorAll(".dsd-ui-preset-btn");
  presetBtns.forEach((btn) => {
    btn.onclick = () => {
      const preset = btn.getAttribute("data-preset");
      if (callbacks.applyPreset) callbacks.applyPreset(preset);
    };
  });
  const apiMetricsBtns = panel.querySelectorAll("[data-api-action]");
  apiMetricsBtns.forEach((btn) => {
    btn.onclick = () => {
      const action = btn.getAttribute("data-api-action");
      if (callbacks.apiAction) callbacks.apiAction(action);
    };
  });
  const memoryBtns = panel.querySelectorAll("[data-memory-action]");
  memoryBtns.forEach((btn) => {
    btn.onclick = () => {
      const action = btn.getAttribute("data-memory-action");
      if (callbacks.memoryAction) callbacks.memoryAction(action);
    };
  });
  const docExampleBtns = panel.querySelectorAll("[data-doc-example]");
  docExampleBtns.forEach((btn) => {
    btn.onclick = () => {
      const example = btn.getAttribute("data-doc-example");
      if (callbacks.runDocExample) callbacks.runDocExample(example);
    };
  });
}
var event_handlers_default = { attachEventListeners };
export {
  MODULE_ID,
  VERSION,
  attachEventListeners,
  event_handlers_default as default
};
