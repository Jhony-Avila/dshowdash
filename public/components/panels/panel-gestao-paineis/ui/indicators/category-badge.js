import { CSS_PREFIX, CATEGORY_COLORS } from "../../core/constants.js";
function getCategoryColor(category) {
  return CATEGORY_COLORS[category?.toLowerCase()] || CATEGORY_COLORS.default;
}
function renderCategoryBadge(category) {
  if (!category) return "";
  const color = getCategoryColor(category);
  return `<span class="${CSS_PREFIX}-category-badge" style="--cat-color: ${color}">${category}</span>`;
}
export {
  getCategoryColor,
  renderCategoryBadge
};
