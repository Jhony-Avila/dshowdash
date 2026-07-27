import { CONNECTION_STATUS } from "../constants.js";
import { state, config } from "../state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.offline-manager.connection.detection";
function updateConnectionInfo() {
  if (typeof navigator === "undefined") return;
  state.isOnline = navigator.onLine;
  if (navigator.connection) {
    state.effectiveType = navigator.connection.effectiveType;
    state.downlink = navigator.connection.downlink;
    state.rtt = navigator.connection.rtt;
    if (state.isOnline && state.rtt && state.rtt > config.slowThreshold) {
      state.connectionStatus = CONNECTION_STATUS.SLOW;
    } else {
      state.connectionStatus = state.isOnline ? CONNECTION_STATUS.ONLINE : CONNECTION_STATUS.OFFLINE;
    }
  } else {
    state.connectionStatus = state.isOnline ? CONNECTION_STATUS.ONLINE : CONNECTION_STATUS.OFFLINE;
  }
}
export {
  MODULE_ID,
  VERSION,
  updateConnectionInfo
};
