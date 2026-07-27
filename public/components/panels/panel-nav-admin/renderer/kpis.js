const VERSION = "13.3.0-VISUAL-ENHANCEMENTS";
const MODULE_ID = "panel-nav-admin:renderer:kpis";
function _animateCountTo(el, targetValue, duration) {
  var start = parseInt(el.textContent || "0", 10) || 0;
  var diff = targetValue - start;
  if (diff === 0) {
    el.textContent = String(targetValue);
    return;
  }
  var startTime = performance.now();
  function step(now) {
    var elapsed = now - startTime;
    var progress = Math.min(elapsed / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = String(Math.round(start + diff * eased));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function updateKPIs(refs, kpis) {
  if (!refs || !kpis) return;
  const updates = [{ ref: refs.kpiTotalItems, value: kpis.totalItems }, { ref: refs.kpiTotalSections, value: kpis.totalSections }, { ref: refs.kpiActiveItems, value: kpis.activeItems }, { ref: refs.kpiAdminItems, value: kpis.adminItems }];
  updates.forEach(({ ref, value }) => {
    if (ref) {
      if (value == null) {
        if (ref.textContent !== "\u2014") ref.textContent = "\u2014";
        return;
      }
      var numVal = typeof value === "number" ? value : parseInt(String(value), 10);
      if (!isNaN(numVal)) {
        _animateCountTo(ref, numVal, 800);
      } else {
        var text = String(value);
        if (ref.textContent !== text) ref.textContent = text;
      }
    }
  });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
var kpis_default = { updateKPIs, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  kpis_default as default,
  healthCheck,
  info,
  updateKPIs
};
