import { CSS_PREFIX } from "../../core/constants.js";
function getScreenshotAge(isoDate) {
  if (!isoDate) {
    return { text: "Sem screenshot", colorClass: `${CSS_PREFIX}-age--none` };
  }
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  if (isNaN(then)) {
    return { text: "Data inv\xE1lida", colorClass: `${CSS_PREFIX}-age--none` };
  }
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 6e4);
  const diffHours = Math.floor(diffMs / 36e5);
  const diffDays = Math.floor(diffMs / 864e5);
  if (diffMin < 60) {
    return { text: `h\xE1 ${diffMin} minuto${diffMin !== 1 ? "s" : ""}`, colorClass: `${CSS_PREFIX}-age--fresh` };
  }
  if (diffHours < 24) {
    return { text: `h\xE1 ${diffHours} hora${diffHours !== 1 ? "s" : ""}`, colorClass: `${CSS_PREFIX}-age--fresh` };
  }
  if (diffDays <= 3) {
    return { text: `h\xE1 ${diffDays} dia${diffDays !== 1 ? "s" : ""}`, colorClass: `${CSS_PREFIX}-age--warning` };
  }
  if (diffDays <= 7) {
    return { text: `h\xE1 ${diffDays} dias`, colorClass: `${CSS_PREFIX}-age--old` };
  }
  return { text: `h\xE1 ${diffDays} dias`, colorClass: `${CSS_PREFIX}-age--stale` };
}
function renderScreenshotAge(isoDate) {
  const { text, colorClass } = getScreenshotAge(isoDate);
  return `<span class="${CSS_PREFIX}-age ${colorClass}">${text}</span>`;
}
export {
  getScreenshotAge,
  renderScreenshotAge
};
