import { getAppShell, getBootstrap, formatDate, statusClass } from "./helpers.js";
const VERSION = "1.0.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.panel.health-tracker";
let _healthHistory = [];
const _HEALTH_HISTORY_MAX = 50;
let _lastKnownStatus = null;
const _METRICS_CAP = 1e4;
function recordHealthStatus(handleError, panelElement, flashStatusChange2) {
  const shell = getAppShell();
  const bs = getBootstrap();
  let shellStatus = "N/A";
  let bsStatus = "N/A";
  try {
    if (shell) shellStatus = shell.healthCheck().status;
  } catch (e) {
    shellStatus = "ERROR";
  }
  try {
    if (bs && bs.healthCheck) bsStatus = bs.healthCheck().status;
  } catch (e) {
    bsStatus = "ERROR";
  }
  const currentStatus = `${shellStatus}|${bsStatus}`;
  const lastEntry = _healthHistory.length > 0 ? _healthHistory[_healthHistory.length - 1] : null;
  if (!lastEntry || lastEntry.combined !== currentStatus) {
    _healthHistory.push({
      timestamp: Date.now(),
      shell: shellStatus,
      bootstrap: bsStatus,
      combined: currentStatus,
      issueCount: getIssueCount(handleError)
    });
    if (_healthHistory.length > _HEALTH_HISTORY_MAX) {
      _healthHistory = _healthHistory.slice(-_HEALTH_HISTORY_MAX);
    }
    if (_lastKnownStatus !== null && _lastKnownStatus !== currentStatus && panelElement) {
      flashStatusChange2(shellStatus);
    }
    _lastKnownStatus = currentStatus;
    if (shellStatus !== "HEALTHY" || bsStatus !== "HEALTHY") {
      autoSnapshotOnIssue(shellStatus, bsStatus, handleError);
    }
  }
}
function autoSnapshotOnIssue(shellStatus, bsStatus, handleError) {
  const shell = getAppShell();
  if (!shell || !shell.stateSnapshots) return;
  try {
    const label = `auto:issue:${shellStatus}/${bsStatus}`;
    shell.stateSnapshots.capture(label);
  } catch (e) {
    handleError("_autoSnapshotOnIssue", e);
  }
}
function getIssueCount(handleError) {
  let issues = 0;
  const shell = getAppShell();
  const bs = getBootstrap();
  if (shell) {
    try {
      const health = shell.healthCheck();
      if (health.status !== "HEALTHY") issues++;
      const adapters = health.adapters || {};
      Object.keys(adapters).forEach((name) => {
        if (adapters[name] !== "HEALTHY") issues++;
      });
      if (shell.regionMetrics) {
        const problematic = shell.regionMetrics.getProblematicRegions();
        issues += problematic.length;
      }
      if (shell.apiMetrics) {
        const apisWithErrors = shell.apiMetrics.getAPIsWithErrors();
        issues += apisWithErrors.length;
      }
      if (shell.memoryLeaks) {
        const lastReport = shell.memoryLeaks.getLastReport();
        if (lastReport && lastReport.potentialLeaks) issues += lastReport.potentialLeaks.length;
      }
    } catch (e) {
      handleError("_getIssueCount:shell", e);
    }
  }
  if (bs) {
    try {
      const bsHealth = bs.healthCheck ? bs.healthCheck() : {};
      if (bsHealth.status && bsHealth.status !== "HEALTHY") issues++;
      if (bs.isBootCancelled && bs.isBootCancelled()) issues++;
    } catch (e) {
      handleError("_getIssueCount:bs", e);
    }
  }
  return issues;
}
function getTabIssues() {
  const shell = getAppShell();
  const bs = getBootstrap();
  const tabIssues = {};
  if (shell) {
    try {
      const health = shell.healthCheck();
      if (health.status !== "HEALTHY") {
        tabIssues.overview = true;
      }
      const adapters = health.adapters || {};
      Object.keys(adapters).forEach((name) => {
        if (adapters[name] !== "HEALTHY") tabIssues.overview = true;
      });
    } catch (e) {
    }
    try {
      if (shell.regionMetrics) {
        const prob = shell.regionMetrics.getProblematicRegions();
        if (prob.length > 0) tabIssues.regionMetrics = true;
      }
    } catch (e) {
    }
    try {
      if (shell.apiMetrics) {
        const errs = shell.apiMetrics.getAPIsWithErrors();
        if (errs.length > 0) tabIssues.apiMetrics = true;
      }
    } catch (e) {
    }
    try {
      if (shell.memoryLeaks) {
        const lr = shell.memoryLeaks.getLastReport();
        if (lr && lr.potentialLeaks && lr.potentialLeaks.length > 0) tabIssues.memory = true;
      }
    } catch (e) {
    }
  }
  if (bs) {
    try {
      const bsH = bs.healthCheck ? bs.healthCheck() : {};
      if (bsH.status && bsH.status !== "HEALTHY") tabIssues.bootstrap = true;
      if (bs.isBootCancelled && bs.isBootCancelled()) tabIssues.bootstrap = true;
    } catch (e) {
    }
  }
  return tabIssues;
}
function getHealthHistory() {
  return _healthHistory;
}
function getLastKnownStatus() {
  return _lastKnownStatus;
}
function getMetricsCap() {
  return _METRICS_CAP;
}
function flashStatusChange(status, panelElement) {
  if (!panelElement) return;
  const header = panelElement.querySelector(".dsd-ui-header");
  if (!header) return;
  const flashClass = status === "HEALTHY" ? "dsd-ui-flash--healthy" : status === "DEGRADED" ? "dsd-ui-flash--degraded" : "dsd-ui-flash--unhealthy";
  header.classList.add(flashClass);
  setTimeout(() => {
    header.classList.remove(flashClass);
  }, 2e3);
}
function renderHealthHistoryHtml() {
  if (_healthHistory.length === 0) return "";
  const histItems = _healthHistory.slice(-10).reverse().map((entry) => `<div class="dsd-ui-log-item"><span class="dsd-ui-log-time">${formatDate(entry.timestamp)}</span><span class="${statusClass(entry.shell)}">${entry.shell}</span><span class="${statusClass(entry.bootstrap)}">${entry.bootstrap}</span><span>Issues: ${entry.issueCount}</span></div>`).join("");
  return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">Health History (last 10)</div><div class="dsd-ui-log">${histItems}</div></div>`;
}
var health_tracker_default = { VERSION, recordHealthStatus, getIssueCount, getTabIssues, getHealthHistory, flashStatusChange, renderHealthHistoryHtml, getMetricsCap };
export {
  MODULE_ID,
  VERSION,
  autoSnapshotOnIssue,
  health_tracker_default as default,
  flashStatusChange,
  getHealthHistory,
  getIssueCount,
  getLastKnownStatus,
  getMetricsCap,
  getTabIssues,
  recordHealthStatus,
  renderHealthHistoryHtml
};
