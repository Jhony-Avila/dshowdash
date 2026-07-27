import { CSS_PREFIX } from "../core/constants.js";
function renderSkeletonCard() {
  return `
    <div class="${CSS_PREFIX}-skeleton-card">
      <div class="${CSS_PREFIX}-skeleton-thumb ${CSS_PREFIX}-shimmer"></div>
      <div class="${CSS_PREFIX}-skeleton-body">
        <div class="${CSS_PREFIX}-skeleton-line ${CSS_PREFIX}-shimmer" style="width:70%"></div>
        <div class="${CSS_PREFIX}-skeleton-line ${CSS_PREFIX}-shimmer" style="width:40%"></div>
        <div class="${CSS_PREFIX}-skeleton-line ${CSS_PREFIX}-shimmer" style="width:55%"></div>
      </div>
    </div>`;
}
function renderSkeleton(count = 8) {
  return `
    <div class="${CSS_PREFIX}-grid">
      ${Array.from({ length: count }, () => renderSkeletonCard()).join("")}
    </div>`;
}
export {
  renderSkeleton
};
