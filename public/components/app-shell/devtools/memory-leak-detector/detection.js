const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.memory-leak-detector.detection";
function checkForLeaks(state) {
  const leaks = [];
  const now = Date.now();
  state.trackedListeners.forEach((entry, id) => {
    const target = entry.target;
    if (target && target.nodeType === 1) {
      if (!document.contains(target)) {
        leaks.push({
          type: "detached-listener",
          id,
          targetName: entry.targetName,
          eventType: entry.type,
          age: now - entry.addedAt,
          stack: entry.stack
        });
      }
    }
  });
  state.trackedIntervals.forEach((entry, id) => {
    const age = now - entry.createdAt;
    if (age > 3e5) {
      leaks.push({
        type: "long-interval",
        id,
        delay: entry.delay,
        age,
        stack: entry.stack
      });
    }
  });
  state.trackedTimeouts.forEach((entry, id) => {
    const age = now - entry.createdAt;
    const expectedDuration = entry.delay + 1e4;
    if (age > expectedDuration && age > 6e4) {
      leaks.push({
        type: "orphan-timeout",
        id,
        delay: entry.delay,
        age,
        stack: entry.stack
      });
    }
  });
  state.metrics.checksPerformed++;
  state.metrics.lastCheck = now;
  if (leaks.length > 0) {
    state.metrics.leaksDetected += leaks.length;
    const report = {
      timestamp: now,
      leakCount: leaks.length,
      leaks,
      summary: {
        detachedListeners: leaks.filter((l) => l.type === "detached-listener").length,
        longIntervals: leaks.filter((l) => l.type === "long-interval").length,
        orphanTimeouts: leaks.filter((l) => l.type === "orphan-timeout").length
      }
    };
    state.leakReports.push(report);
    while (state.leakReports.length > state.config.maxReports) {
      state.leakReports.shift();
    }
    return report;
  }
  return null;
}
export {
  MODULE_ID,
  VERSION,
  checkForLeaks
};
