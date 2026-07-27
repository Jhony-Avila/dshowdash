const MODULE_ID = "panel-16.ui.render.pagination";
const VERSION = "9.3.0-P2-ENTERPRISE";
function renderPagination(container, opts = {}) {
  const { currentPage, totalPages, onPageChange } = opts;
  const nav = document.createElement("nav");
  nav.className = "pagination-nav";
  nav.setAttribute("aria-label", "Navega\xE7\xE3o de p\xE1ginas");
  const prevDisabled = Number(currentPage) <= 1;
  const nextDisabled = Number(currentPage) >= Number(totalPages);
  nav.innerHTML = `
        <button class="pagination-btn prev" ${prevDisabled ? "disabled" : ""} data-page="${Number(currentPage) - 1}">
            <i class="fas fa-chevron-left"></i> Anterior
        </button>
        <span class="pagination-info">P\xE1gina ${currentPage} de ${totalPages}</span>
        <button class="pagination-btn next" ${nextDisabled ? "disabled" : ""} data-page="${Number(currentPage) + 1}">
            Pr\xF3xima <i class="fas fa-chevron-right"></i>
        </button>
    `;
  nav.querySelectorAll(".pagination-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = parseInt(btn.dataset.page, 10);
      if (!isNaN(page) && typeof onPageChange === "function") {
        onPageChange(page);
      }
    });
  });
  container.innerHTML = "";
  container.appendChild(nav);
}
export {
  MODULE_ID,
  VERSION,
  renderPagination
};
