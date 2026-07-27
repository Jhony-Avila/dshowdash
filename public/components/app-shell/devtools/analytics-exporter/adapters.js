const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.analytics-exporter.adapters";
const BUILT_IN_ADAPTERS = {
  console: {
    name: "console",
    send(events) {
      console.group(`[Analytics Export] ${events.length} events`);
      for (let i = 0; i < events.length; i++) {
        console.log(events[i]);
      }
      console.groupEnd();
      return Promise.resolve({ success: true, count: events.length });
    }
  },
  localStorage: {
    name: "localStorage",
    send(events) {
      try {
        const existing = JSON.parse(localStorage.getItem("app-shell-analytics") || "[]");
        let combined = existing.concat(events);
        if (combined.length > 500) {
          combined = combined.slice(-500);
        }
        localStorage.setItem("app-shell-analytics", JSON.stringify(combined));
        return Promise.resolve({ success: true, count: events.length, stored: combined.length });
      } catch (e) {
        return Promise.reject(e);
      }
    }
  },
  beacon: {
    name: "beacon",
    endpoint: null,
    send(events) {
      const endpoint = this.endpoint;
      if (!endpoint) return Promise.reject(new Error("Beacon endpoint not configured"));
      const data = JSON.stringify({ events, timestamp: Date.now() });
      const success = navigator.sendBeacon(endpoint, data);
      if (success) return Promise.resolve({ success: true, count: events.length });
      return Promise.reject(new Error("Beacon failed"));
    }
  },
  fetch: {
    name: "fetch",
    endpoint: null,
    headers: {},
    send(events) {
      const endpoint = this.endpoint;
      if (!endpoint) return Promise.reject(new Error("Fetch endpoint not configured"));
      const headers = Object.assign({ "Content-Type": "application/json" }, this.headers);
      return fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ events, timestamp: Date.now() })
      }).then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return { success: true, count: events.length };
      });
    }
  }
};
function registerAdapter(name, adapter, adaptersMap) {
  if (!adapter || typeof adapter.send !== "function") return false;
  adaptersMap.set(name, {
    name,
    adapter,
    enabled: true,
    sentCount: 0,
    errorCount: 0,
    lastSent: null,
    lastError: null
  });
  return true;
}
function unregisterAdapter(name, adaptersMap) {
  return adaptersMap.delete(name);
}
function enableAdapter(name, adaptersMap) {
  const entry = adaptersMap.get(name);
  if (entry) {
    entry.enabled = true;
    return true;
  }
  return false;
}
function disableAdapter(name, adaptersMap) {
  const entry = adaptersMap.get(name);
  if (entry) {
    entry.enabled = false;
    return true;
  }
  return false;
}
function getAdapters(adaptersMap) {
  const result = [];
  adaptersMap.forEach((entry) => {
    result.push({
      name: entry.name,
      enabled: entry.enabled,
      sentCount: entry.sentCount,
      errorCount: entry.errorCount,
      lastSent: entry.lastSent,
      lastError: entry.lastError
    });
  });
  return result;
}
function useBuiltInAdapter(name, options, adaptersMap) {
  const builtin = BUILT_IN_ADAPTERS[name];
  if (!builtin) return false;
  const adapter = Object.assign({}, builtin);
  if (options) Object.assign(adapter, options);
  return registerAdapter(name, adapter, adaptersMap);
}
export {
  MODULE_ID,
  VERSION,
  disableAdapter,
  enableAdapter,
  getAdapters,
  registerAdapter,
  unregisterAdapter,
  useBuiltInAdapter
};
