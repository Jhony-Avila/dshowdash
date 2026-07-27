var MODULE_ID = "panel-nav-admin-handlers-column-sort";
var VERSION = "2.0.0-GRID-12COL";
var SORT_FIELD_MAP = {
  "label": "label",
  "status": "isActive",
  "id": "id",
  "href": "displayHref",
  "context": "section",
  "group": "parentLabel",
  "level": "minLevel"
};
var COL_WIDTHS = {
  "bulk": "36px",
  "order": "50px",
  "icon": "44px",
  "label": "1.4fr",
  "display-title": "1fr",
  "status": "72px",
  "id": "1.2fr",
  "href": "1fr",
  "context": "90px",
  "group": "110px",
  "level": "70px",
  "actions": "80px"
};
var FIXED_COLS = { "bulk": true, "order": true, "actions": true };
function createColumnSortHandlers(deps) {
  var container = deps.container;
  var _sortState = { col: null, dir: "asc" };
  var _colOrder = ["bulk", "order", "icon", "label", "display-title", "status", "id", "href", "context", "group", "level", "actions"];
  var _draggingCol = null;
  var _dragGhost = null;
  var _dragStartX = 0;
  var _dragStartY = 0;
  var _isDragging = false;
  var _currentHeader = null;
  var _boundMouseMove = null;
  var _boundMouseUp = null;
  var DRAG_THRESHOLD = 5;
  function handleHeaderClick(e) {
    if (_isDragging) return;
    var target = e.target;
    var col = target.closest("[data-sort]");
    if (!col) return;
    var sortKey = col.dataset.sort;
    if (_sortState.col === sortKey) {
      _sortState.dir = _sortState.dir === "asc" ? "desc" : "asc";
    } else {
      _sortState.col = sortKey;
      _sortState.dir = "asc";
    }
    _updateSortIndicators(col.closest(".pna-list-header"));
    _sortItems(sortKey, _sortState.dir);
  }
  function _sortItems(sortKey, dir) {
    var ul = container.querySelector('ul.pna-list[data-sortable="items"]');
    if (!ul) return;
    var items = Array.from(ul.querySelectorAll("li.pna-list-item"));
    items.sort(function(a, b) {
      var aVal = _getItemValue(a, sortKey);
      var bVal = _getItemValue(b, sortKey);
      if (sortKey === "level") {
        return dir === "asc" ? aVal - bVal : bVal - aVal;
      }
      var cmp = String(aVal).localeCompare(String(bVal), "pt-BR");
      return dir === "asc" ? cmp : -cmp;
    });
    items.forEach(function(item) {
      ul.appendChild(item);
    });
    items.forEach(function(item, idx) {
      var orderNum = item.querySelector(".pna-order-num");
      if (orderNum) orderNum.textContent = String(idx + 1);
    });
  }
  function _getItemValue(row, sortKey) {
    switch (sortKey) {
      case "label":
        return row.querySelector(".pna-item-label")?.textContent || "";
      case "status":
        return row.querySelector(".pna-badge-status")?.textContent || "";
      case "id":
        return row.querySelector(".pna-item-id")?.textContent || "";
      case "href":
        return row.querySelector(".pna-item-href")?.textContent || "";
      case "context":
        return row.querySelector(".pna-badge-context")?.textContent || "";
      case "group":
        return row.querySelector(".pna-badge-group")?.textContent || "";
      case "level":
        return parseInt(row.querySelector(".pna-badge-level")?.textContent || "0") || 0;
      default:
        return "";
    }
  }
  function _updateSortIndicators(header) {
    if (!header) return;
    header.querySelectorAll("[data-sort]").forEach(function(col) {
      col.classList.remove("pna-col-sort-asc", "pna-col-sort-desc");
      var icon2 = col.querySelector(".pna-sort-icon");
      if (icon2) icon2.textContent = "";
    });
    var activeCol = header.querySelector('[data-sort="' + _sortState.col + '"]');
    if (activeCol) {
      var cls = _sortState.dir === "asc" ? "pna-col-sort-asc" : "pna-col-sort-desc";
      activeCol.classList.add(cls);
      var icon = activeCol.querySelector(".pna-sort-icon");
      if (icon) icon.textContent = _sortState.dir === "asc" ? " \u25B2" : " \u25BC";
    }
  }
  function setupColumnDrag(header) {
    _currentHeader = header;
    header.querySelectorAll("[data-col]").forEach(function(col) {
      var colEl = col;
      if (FIXED_COLS[colEl.dataset.col || ""]) return;
      colEl.removeAttribute("draggable");
      colEl.classList.add("pna-col-draggable");
      if (colEl.dataset.colDragBound) return;
      colEl.dataset.colDragBound = "1";
      colEl.addEventListener("mousedown", function(e) {
        if (e.button !== 0) return;
        if (e.target.closest(".pna-sort-icon")) return;
        _draggingCol = colEl.dataset.col || null;
        _dragStartX = e.clientX;
        _dragStartY = e.clientY;
        _isDragging = false;
        _boundMouseMove = _handleMouseMove.bind(null, colEl);
        _boundMouseUp = _handleMouseUp.bind(null, colEl);
        document.addEventListener("mousemove", _boundMouseMove);
        document.addEventListener("mouseup", _boundMouseUp);
        e.preventDefault();
      });
    });
  }
  function _handleMouseMove(sourceEl, e) {
    if (!_draggingCol || !_currentHeader) return;
    var dx = e.clientX - _dragStartX;
    var dy = e.clientY - _dragStartY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (!_isDragging && dist < DRAG_THRESHOLD) return;
    if (!_isDragging) {
      _isDragging = true;
      sourceEl.classList.add("pna-col-dragging");
      _createGhost(sourceEl, e);
    }
    if (_dragGhost) {
      _dragGhost.style.left = e.clientX + 12 + "px";
      _dragGhost.style.top = e.clientY - 14 + "px";
    }
    _currentHeader.querySelectorAll(".pna-col-drop-target").forEach(function(c) {
      c.classList.remove("pna-col-drop-target");
    });
    var targetCol = _getColumnAtPoint(e.clientX, e.clientY);
    if (targetCol && targetCol.dataset.col !== _draggingCol && !FIXED_COLS[targetCol.dataset.col || ""]) {
      targetCol.classList.add("pna-col-drop-target");
    }
  }
  function _handleMouseUp(sourceEl, e) {
    if (_boundMouseMove) document.removeEventListener("mousemove", _boundMouseMove);
    if (_boundMouseUp) document.removeEventListener("mouseup", _boundMouseUp);
    _boundMouseMove = null;
    _boundMouseUp = null;
    _removeGhost();
    sourceEl.classList.remove("pna-col-dragging");
    if (_currentHeader) {
      _currentHeader.querySelectorAll(".pna-col-drop-target").forEach(function(c) {
        c.classList.remove("pna-col-drop-target");
      });
    }
    if (_isDragging && _draggingCol && _currentHeader) {
      var targetCol = _getColumnAtPoint(e.clientX, e.clientY);
      if (targetCol && targetCol.dataset.col && targetCol.dataset.col !== _draggingCol && !FIXED_COLS[targetCol.dataset.col]) {
        _reorderColumns(_draggingCol, targetCol.dataset.col);
      }
    }
    var wasDragging = _isDragging;
    setTimeout(function() {
      if (wasDragging) _isDragging = false;
    }, 0);
    _draggingCol = null;
    if (!wasDragging) _isDragging = false;
  }
  function _getColumnAtPoint(x, y) {
    if (!_currentHeader) return null;
    var cols = _currentHeader.querySelectorAll("[data-col]");
    for (var i = 0; i < cols.length; i++) {
      var rect = cols[i].getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top - 10 && y <= rect.bottom + 10) {
        return cols[i];
      }
    }
    return null;
  }
  function _createGhost(colEl, e) {
    _removeGhost();
    _dragGhost = document.createElement("div");
    _dragGhost.className = "pna-col-drag-ghost";
    _dragGhost.textContent = colEl.textContent || colEl.dataset.col || "";
    _dragGhost.style.left = e.clientX + 12 + "px";
    _dragGhost.style.top = e.clientY - 14 + "px";
    document.body.appendChild(_dragGhost);
  }
  function _removeGhost() {
    if (_dragGhost && _dragGhost.parentNode) {
      _dragGhost.parentNode.removeChild(_dragGhost);
    }
    _dragGhost = null;
  }
  function _reorderColumns(fromCol, toCol) {
    var fromIdx = _colOrder.indexOf(fromCol);
    var toIdx = _colOrder.indexOf(toCol);
    if (fromIdx === -1 || toIdx === -1) return;
    _colOrder.splice(fromIdx, 1);
    _colOrder.splice(toIdx, 0, fromCol);
    _applyColumnOrder();
  }
  function _applyColumnOrder() {
    var template = _colOrder.map(function(col) {
      return COL_WIDTHS[col];
    }).join(" ");
    var header = container.querySelector(".pna-list-header");
    var items = container.querySelectorAll(".pna-list-item");
    if (header) header.style.gridTemplateColumns = template;
    items.forEach(function(item) {
      item.style.gridTemplateColumns = template;
    });
    _reorderSpans(header, _colOrder);
    items.forEach(function(item) {
      _reorderSpans(item, _colOrder);
    });
  }
  function _reorderSpans(el, order) {
    if (!el) return;
    var spans = {};
    el.querySelectorAll("[data-col]").forEach(function(span) {
      spans[span.dataset.col] = span;
    });
    order.forEach(function(col) {
      if (spans[col]) el.appendChild(spans[col]);
    });
  }
  function init() {
    var header = container.querySelector(".pna-list-header[data-grid-header]");
    if (header) setupColumnDrag(header);
  }
  return {
    handleHeaderClick,
    setupColumnDrag,
    init
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var column_sort_default = { MODULE_ID, VERSION, createColumnSortHandlers, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  createColumnSortHandlers,
  column_sort_default as default,
  healthCheck,
  info
};
