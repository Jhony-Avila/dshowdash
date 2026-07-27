import { Icons } from "./icons.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-templates-regions";
function regionMatrix(regions, grantedRegions = []) {
  if (!regions.length) return `<div class="uarps-matrix__empty">${Icons.inbox} Nenhuma regi\xE3o</div>`;
  let html = '<div class="uarps-matrix__regions">';
  html += regions.map((r) => {
    const isGranted = grantedRegions.includes(r.id);
    const stateClass = isGranted ? "granted" : "denied";
    const icon = isGranted ? Icons.eye : Icons.eyeOff;
    const tooltip = `${r.label || r.id}
ID: ${r.id}
Status: ${isGranted ? "Vis\xEDvel" : "Oculta"}`;
    return `
<div class="uarps-region uarps-region--${stateClass} uarps-tooltip--bottom" data-region-id="${r.id}" data-tooltip="${tooltip}" role="button" tabindex="0">
  <div class="uarps-region__indicator">${icon}</div>
  <div class="uarps-region__content">
    <span class="uarps-region__label">${r.label || r.id}</span>
    <span class="uarps-region__id">${r.id}</span>
  </div>
  <div class="uarps-region__glow"></div>
</div>`;
  }).join("");
  html += "</div>";
  return html;
}
function matrixEmpty() {
  return `
<div class="uarps-matrix__empty">
  <div class="uarps-matrix__empty-icon">${Icons.shield}</div>
  <p>Selecione um usu\xE1rio para visualizar a matriz de permiss\xF5es</p>
</div>`;
}
export {
  MODULE_ID,
  VERSION,
  matrixEmpty,
  regionMatrix
};
