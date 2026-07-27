const MODULE_ID = "panel-01.ui.table.render-virtual";
const VERSION = "9.3.0-P2-ENTERPRISE";
function createVirtualRenderer(container, { rowHeight = 40, bufferSize = 5 } = {}) {
  let data = [];
  let columns = [];
  let scrollTop = 0;
  const viewport = container.querySelector(".table-viewport") || container;
  const calculateVisibleRange = () => {
    const viewportHeight = viewport.clientHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - bufferSize);
    const visibleCount = Math.ceil(viewportHeight / rowHeight) + bufferSize * 2;
    const endIndex = Math.min(data.length, startIndex + visibleCount);
    return { startIndex, endIndex };
  };
  const render = () => {
    const { startIndex, endIndex } = calculateVisibleRange();
    const visibleData = data.slice(startIndex, endIndex);
    const offsetY = startIndex * rowHeight;
    const tbody = container.querySelector("tbody");
    if (tbody) {
      tbody.style.transform = `translateY(${offsetY}px)`;
      tbody.innerHTML = visibleData.map(
        (row, i) => `<tr data-index="${startIndex + i}">${columns.map((c) => `<td>${row[c.key] ?? ""}</td>`).join("")}</tr>`
      ).join("");
    }
  };
  return {
    setData: (d) => {
      data = d;
      render();
    },
    setColumns: (c) => {
      columns = c;
    },
    onScroll: (top) => {
      scrollTop = top;
      render();
    },
    render
  };
}
var render_virtual_default = { createVirtualRenderer };
export {
  MODULE_ID,
  VERSION,
  createVirtualRenderer,
  render_virtual_default as default
};
