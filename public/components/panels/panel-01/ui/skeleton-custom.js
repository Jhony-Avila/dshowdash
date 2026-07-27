const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/skeleton-custom";
function SkeletonCustomManager(options = {}) {
  options = options || {};
  this.container = options.container || null;
  this.rows = options.rows || 10;
  this.columns = options.columns || 7;
  this.animated = options.animated !== false;
}
SkeletonCustomManager.prototype.show = function(container) {
  const target = container || this.container;
  if (!target) return;
  target.innerHTML = this._render();
};
SkeletonCustomManager.prototype._render = function() {
  let html = `<div class="p01-skeleton${this.animated ? " p01-skeleton--animated" : ""}">`;
  html += '<div class="p01-skeleton-header"><div class="p01-skeleton-bar" style="width: 200px; height: 24px;"></div><div class="p01-skeleton-bar" style="width: 150px; height: 32px;"></div></div>';
  html += '<div class="p01-skeleton-table"><div class="p01-skeleton-thead"><div class="p01-skeleton-row">';
  for (let c = 0; c < this.columns; c++) {
    html += `<div class="p01-skeleton-cell"><div class="p01-skeleton-bar" style="width: ${60 + Math.random() * 40}%;"></div></div>`;
  }
  html += '</div></div><div class="p01-skeleton-tbody">';
  for (let r = 0; r < this.rows; r++) {
    html += '<div class="p01-skeleton-row">';
    for (let c = 0; c < this.columns; c++) {
      html += `<div class="p01-skeleton-cell"><div class="p01-skeleton-bar" style="width: ${50 + Math.random() * 50}%;"></div></div>`;
    }
    html += "</div>";
  }
  html += "</div></div></div>";
  return html;
};
SkeletonCustomManager.prototype.hide = function(container) {
  const target = container || this.container;
  if (target) {
    const skeleton = target.querySelector(".p01-skeleton");
    if (skeleton) skeleton.remove();
  }
};
SkeletonCustomManager.prototype.destroy = function() {
  this.container = null;
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var skeleton_custom_default = { SkeletonCustomManager, info, healthCheck };
export {
  MODULE_ID,
  SkeletonCustomManager,
  VERSION,
  skeleton_custom_default as default,
  healthCheck,
  info
};
