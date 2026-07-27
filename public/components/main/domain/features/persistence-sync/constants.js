const MODULE_ID = "main.feature.persistence-sync.constants";
const VERSION = "1.2.0-ENTERPRISE";
const STATE_VERSION = 2;
const STORAGE_KEYS = Object.freeze({
  NAVIGATION_STATE: "dsd:main:navigation",
  CONTAINER_STATE: "dsd:main:containers",
  USER_PREFERENCES: "dsd:main:preferences",
  STATE_META: "dsd:main:meta"
});
const SYNC_DEBOUNCE_MS = 500;
const MAX_HISTORY_SIZE = 20;
const SCHEMAS = {
  navigation: {
    required: ["current", "history"],
    types: {
      current: ["string", "null"],
      history: "array"
    }
  },
  containers: {
    required: [],
    types: {
      layout: "string",
      panels: "array"
    }
  },
  preferences: {
    required: [],
    types: {
      theme: "string",
      language: "string"
    }
  }
};
export {
  MAX_HISTORY_SIZE,
  MODULE_ID,
  SCHEMAS,
  STATE_VERSION,
  STORAGE_KEYS,
  SYNC_DEBOUNCE_MS,
  VERSION
};
