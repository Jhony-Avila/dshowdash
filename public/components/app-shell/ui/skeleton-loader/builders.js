import { templateConfigs } from "./templates.js";
import { customTemplates } from "./state.js";
import { createSkeletonElement } from "./elements.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.skeleton-loader.builders";
function buildShapes(container, shapes) {
  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];
    if (shape.type === "column") {
      const col = document.createElement("div");
      col.className = "skeleton-container";
      if (shape.flex) col.style.flex = shape.flex;
      if (shape.shapes) buildShapes(col, shape.shapes);
      container.appendChild(col);
    } else {
      container.appendChild(createSkeletonElement(shape));
    }
  }
}
function createListItem(cfg) {
  const item = document.createElement("div");
  item.className = cfg.layout === "row" ? "skeleton-row" : "skeleton-container";
  if (cfg.gap) item.style.gap = cfg.gap;
  if (cfg.shapes) {
    buildShapes(item, cfg.shapes);
  }
  return item;
}
function buildTable(container, cfg) {
  const header = document.createElement("div");
  header.className = "skeleton-row";
  header.style.gap = "8px";
  for (let h = 0; h < cfg.cols; h++) {
    const th = createSkeletonElement({ width: "100%", height: cfg.header.height, flex: 1 });
    header.appendChild(th);
  }
  container.appendChild(header);
  for (let r = 0; r < cfg.rows; r++) {
    const row = document.createElement("div");
    row.className = "skeleton-row";
    row.style.gap = "8px";
    row.style.marginTop = "4px";
    for (let c = 0; c < cfg.cols; c++) {
      const td = createSkeletonElement({ width: "100%", height: cfg.rowHeight, flex: 1 });
      row.appendChild(td);
    }
    container.appendChild(row);
  }
}
function buildForm(container, cfg) {
  for (let i = 0; i < cfg.fields.length; i++) {
    const field = cfg.fields[i];
    const fieldEl = document.createElement("div");
    fieldEl.className = "skeleton-container";
    fieldEl.style.gap = "4px";
    if (i > 0 && cfg.gap) fieldEl.style.marginTop = cfg.gap;
    if (field.label) {
      fieldEl.appendChild(createSkeletonElement({ width: "100px", height: "14px" }));
    }
    if (field.input) {
      fieldEl.appendChild(createSkeletonElement(field.input));
    }
    if (field.button) {
      fieldEl.appendChild(createSkeletonElement(field.button));
    }
    container.appendChild(fieldEl);
  }
}
function createFromTemplate(templateName) {
  const cfg = templateConfigs[templateName] || customTemplates.get(templateName);
  if (!cfg) return null;
  const container = document.createElement("div");
  container.className = "skeleton-container";
  container.setAttribute("data-skeleton-template", templateName);
  if (cfg.gap) container.style.gap = cfg.gap;
  if (cfg.lines) {
    for (let i = 0; i < cfg.lines.length; i++) {
      container.appendChild(createSkeletonElement(cfg.lines[i]));
    }
  }
  if (cfg.shapes) {
    buildShapes(container, cfg.shapes);
  }
  if (cfg.repeat && cfg.item) {
    for (let j = 0; j < cfg.repeat; j++) {
      const item = createListItem(cfg.item);
      if (j > 0 && cfg.gap) item.style.marginTop = cfg.gap;
      container.appendChild(item);
    }
  }
  if (cfg.header && cfg.rows) {
    buildTable(container, cfg);
  }
  if (cfg.fields) {
    buildForm(container, cfg);
  }
  return container;
}
export {
  MODULE_ID,
  VERSION,
  buildForm,
  buildShapes,
  buildTable,
  createFromTemplate,
  createListItem
};
