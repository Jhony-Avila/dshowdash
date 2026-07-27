const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-02/ui/pagination";
class PaginationComponent {
  constructor(options = {}) {
    this.onPageChange = options.onPageChange || (() => {
    });
    this.onPageSizeChange = options.onPageSizeChange || (() => {
    });
    this.element = null;
    this.currentPage = 1;
    this.pageSize = 20;
    this.totalItems = 0;
    this._clickHandler = null;
    this._changeHandler = null;
  }
  get totalPages() {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }
  get startIndex() {
    return (this.currentPage - 1) * this.pageSize;
  }
  get endIndex() {
    return Math.min(this.startIndex + this.pageSize, this.totalItems);
  }
  render(container) {
    this.element = document.createElement("div");
    this.element.className = "p02-pagination";
    this.update();
    this._clickHandler = (e) => {
      const pageBtn = e.target.closest("[data-page]");
      if (pageBtn) {
        e.preventDefault();
        e.stopPropagation();
        const page = pageBtn.dataset.page;
        if (page === "prev") this.goTo(this.currentPage - 1);
        else if (page === "next") this.goTo(this.currentPage + 1);
        else if (page === "first") this.goTo(1);
        else if (page === "last") this.goTo(this.totalPages);
        else this.goTo(parseInt(page));
      }
    };
    this._changeHandler = (e) => {
      const sizeSelect = e.target.closest("[data-page-size]");
      if (sizeSelect) {
        e.preventDefault();
        e.stopPropagation();
        this.setPageSize(parseInt(sizeSelect.value));
      }
    };
    this.element.addEventListener("click", this._clickHandler);
    this.element.addEventListener("change", this._changeHandler);
    container.appendChild(this.element);
    return this.element;
  }
  update() {
    if (!this.element) return;
    const start = this.totalItems > 0 ? this.startIndex + 1 : 0;
    const end = this.endIndex;
    this.element.innerHTML = `<div class="p02-pagination-info">Exibindo ${start}-${end} de ${this.totalItems}</div><div class="p02-pagination-controls"><div class="p02-page-size"><label>Por pagina:</label><select data-page-size><option value="10" ${this.pageSize === 10 ? "selected" : ""}>10</option><option value="20" ${this.pageSize === 20 ? "selected" : ""}>20</option><option value="50" ${this.pageSize === 50 ? "selected" : ""}>50</option><option value="100" ${this.pageSize === 100 ? "selected" : ""}>100</option></select></div><div class="p02-page-btns"><button class="p02-page-btn" data-page="first" ${this.currentPage === 1 ? "disabled" : ""} type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg></button><button class="p02-page-btn" data-page="prev" ${this.currentPage === 1 ? "disabled" : ""} type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>${this.renderPageNumbers()}<button class="p02-page-btn" data-page="next" ${this.currentPage === this.totalPages ? "disabled" : ""} type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button><button class="p02-page-btn" data-page="last" ${this.currentPage === this.totalPages ? "disabled" : ""} type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg></button></div></div>`;
  }
  renderPageNumbers() {
    const pages = [];
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, "...", total);
      } else if (current >= total - 2) {
        pages.push(1, "...", total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, "...", current - 1, current, current + 1, "...", total);
      }
    }
    return pages.map((p) => {
      if (p === "...") return '<span class="p02-page-btn" style="border:none;cursor:default;">...</span>';
      return `<button class="p02-page-btn ${p === current ? "active" : ""}" data-page="${p}" type="button">${p}</button>`;
    }).join("");
  }
  setTotal(total) {
    this.totalItems = total;
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    this.update();
  }
  setPageSize(size) {
    const oldStart = this.startIndex;
    this.pageSize = size;
    this.currentPage = Math.floor(oldStart / size) + 1;
    this.update();
    this.onPageSizeChange(size);
    this.onPageChange(this.currentPage, this.startIndex, this.endIndex);
  }
  goTo(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.update();
    this.onPageChange(page, this.startIndex, this.endIndex);
  }
  destroy() {
    if (this.element) {
      if (this._clickHandler) this.element.removeEventListener("click", this._clickHandler);
      if (this._changeHandler) this.element.removeEventListener("change", this._changeHandler);
      this.element.remove();
    }
    this.element = null;
  }
}
var pagination_default = PaginationComponent;
export {
  MODULE_ID,
  PaginationComponent,
  VERSION,
  pagination_default as default
};
