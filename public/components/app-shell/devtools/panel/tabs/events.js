import { icon, sanitizeAttr, getAppShell } from "../helpers.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.panel.tabs.events";
function renderEventsTab() {
  const shell = getAppShell();
  if (!shell) return '<div class="dsd-ui-empty">AppShell not available</div>';
  try {
    const eventsInfo = shell.events.info();
    const history = shell.events.getHistory({ limit: 20 });
    const logHtml = history.reverse().map((e) => {
      const time = new Date(e.timestamp).toLocaleTimeString();
      return `<div class="dsd-ui-log-item"><span class="dsd-ui-log-time">${time}</span><span class="dsd-ui-status--accent">${sanitizeAttr(e.region)}</span><span>${sanitizeAttr(e.type)}</span></div>`;
    }).join("");
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("events")} Event System</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Emitted</div><div class="dsd-ui-card__value">${eventsInfo.metrics.eventsEmitted}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Listeners</div><div class="dsd-ui-card__value">${eventsInfo.metrics.listenersAdded}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("clock")} Recent Events</div><div class="dsd-ui-log">${logHtml}</div></div>`;
  } catch (e) {
    return `<div class="dsd-ui-empty">Error rendering events: ${sanitizeAttr(e.message)}</div>`;
  }
}
export {
  MODULE_ID,
  VERSION,
  renderEventsTab
};
