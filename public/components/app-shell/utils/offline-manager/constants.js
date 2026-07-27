const VERSION = "1.0.0-AAA";
const MODULE_ID = "app-shell-offline-manager";
const CONNECTION_STATUS = Object.freeze({
  ONLINE: "online",
  OFFLINE: "offline",
  SLOW: "slow",
  UNKNOWN: "unknown"
});
const SYNC_STATUS = Object.freeze({
  IDLE: "idle",
  SYNCING: "syncing",
  COMPLETE: "complete",
  ERROR: "error"
});
export {
  CONNECTION_STATUS,
  MODULE_ID,
  SYNC_STATUS,
  VERSION
};
