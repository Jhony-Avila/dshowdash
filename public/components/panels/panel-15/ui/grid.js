const MODULE_ID = "panel-15.ui.grid";
const VERSION = "9.3.0-P2-ENTERPRISE";
function renderGrid(container, { items = [], columns = 3, renderItem }) {
  if (!container) return;
  const gridHTML = `
        <div class="panel-grid" style="grid-template-columns: repeat(${columns}, 1fr)">
            ${items.map((item, index) => `
                <div class="grid-item" data-index="${index}">
                    ${typeof renderItem === "function" ? renderItem(item, index) : JSON.stringify(item)}
                </div>
            `).join("")}
        </div>
    `;
  container.innerHTML = gridHTML;
}
function updateGridItem(container, index, content) {
  const item = container.querySelector(`.grid-item[data-index="${index}"]`);
  if (item) item.innerHTML = content;
}
var grid_default = { renderGrid, updateGridItem };
export {
  MODULE_ID,
  VERSION,
  grid_default as default,
  renderGrid,
  updateGridItem
};
