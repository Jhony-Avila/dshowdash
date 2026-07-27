import { CONNECTION_STATUS } from "../constants.js";
import { state, config, incrementMetric, notifySubscribers } from "../state.js";
import { showBanner } from "../ui/banner.js";
import { updateConnectionInfo } from "./detection.js";
import { syncPending } from "../sync/manager.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.offline-manager.connection.handlers";
function handleOnline() {
  state.isOnline = true;
  state.lastOnline = Date.now();
  incrementMetric("onlineEvents", 1);
  updateConnectionInfo();
  showBanner("Conexao restaurada", "online");
  notifySubscribers({
    type: "online",
    connectionStatus: state.connectionStatus,
    timestamp: Date.now()
  });
  if (config.syncOnReconnect && state.pendingActions.length > 0) {
    syncPending(void 0);
  }
}
function handleOffline() {
  state.isOnline = false;
  state.lastOffline = Date.now();
  state.connectionStatus = CONNECTION_STATUS.OFFLINE;
  incrementMetric("offlineEvents", 1);
  showBanner("Voce esta offline. Alteracoes serao sincronizadas ao reconectar.", "offline");
  notifySubscribers({
    type: "offline",
    timestamp: Date.now()
  });
}
function handleConnectionChange() {
  updateConnectionInfo();
  if (state.connectionStatus === CONNECTION_STATUS.SLOW) {
    showBanner("Conexao lenta detectada", "slow");
  }
  notifySubscribers({
    type: "connection-change",
    connectionStatus: state.connectionStatus,
    effectiveType: state.effectiveType,
    rtt: state.rtt,
    timestamp: Date.now()
  });
}
export {
  MODULE_ID,
  VERSION,
  handleConnectionChange,
  handleOffline,
  handleOnline
};
