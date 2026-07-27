import { setDragging, setDropTarget } from "../renderer/items.js";
const MODULE_ID = "panel-nav-admin-handlers-drag-drop";
const VERSION = "15.2.0-GROUP-REORDER";
let _draggedItemId = null;
let _documentListenerAttached = false;
function createDragDropHandlers(deps) {
  const store = deps.store;
  const navAdapter = deps.navAdapter;
  const showToast = deps.showToast;
  const loadData = deps.loadData;
  let _isDragging = false;
  let _dragStartX = 0;
  let _dragStartY = 0;
  let _dragGhost = null;
  let _sourceRow = null;
  const DRAG_THRESHOLD = 5;
  let _groupDragging = false;
  let _groupDragSource = null;
  let _groupDragGhost = null;
  function _onGroupDragStart(e) {
    var groupHandle = e.target.closest(".pna-group-drag-handle");
    if (!groupHandle) return null;
    var separator = e.target.closest("[data-group-drag]");
    if (!separator) return null;
    return separator;
  }
  function _handleGroupDrop(source, targetSep) {
    var sourceKey = source.dataset.groupKey || source.dataset.groupSeparator || "";
    var targetKey = targetSep.dataset.groupKey || targetSep.dataset.groupSeparator || "";
    if (!sourceKey || !targetKey || sourceKey === targetKey) return;
    var container = source.closest("ul.pna-list") || source.parentElement;
    if (!container) return;
    var allSeps = Array.from(container.querySelectorAll("[data-group-drag][data-group-key]"));
    var groupKeys = allSeps.map(function(s) {
      return s.dataset.groupKey || s.dataset.groupSeparator || "";
    });
    var fromIdx = groupKeys.indexOf(sourceKey);
    var toIdx = groupKeys.indexOf(targetKey);
    if (fromIdx === -1 || toIdx === -1) return;
    groupKeys.splice(fromIdx, 1);
    groupKeys.splice(toIdx, 0, sourceKey);
    var reorderPayload = groupKeys.map(function(key, idx) {
      return { group_key: key, order_index: idx + 1 };
    });
    var promises = reorderPayload.map(function(item) {
      return fetch("/api/admin/navigation/sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.content || "" },
        body: JSON.stringify({
          source_table: "ui_nav_items",
          source_id: 0,
          // Will be resolved by group_key
          group_key: item.group_key,
          order_index: item.order_index
        })
      });
    });
    fetch("/api/admin/navigation/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.content || "" },
      body: JSON.stringify({
        type: "groups",
        items: reorderPayload
      })
    }).then(function() {
      showToast("Ordem dos grupos atualizada", "success");
      window.dispatchEvent(new CustomEvent("navigation:items:changed", {
        detail: { source: "panel-nav-admin", action: "group-reorder" }
      }));
      loadData();
    }).catch(function(err) {
      showToast("Erro ao reordenar grupos: " + err.message, "error");
      loadData();
    });
  }
  function _onDocumentMouseDown(e) {
    if (e.button !== 0) return;
    var groupSep = _onGroupDragStart(e);
    if (groupSep) {
      _groupDragSource = groupSep;
      _dragStartX = e.clientX;
      _dragStartY = e.clientY;
      _groupDragging = false;
      document.addEventListener("mousemove", _onGroupMouseMove);
      document.addEventListener("mouseup", _onGroupMouseUp);
      e.preventDefault();
      return;
    }
    var handle = e.target.closest(".pna-drag-handle");
    if (!handle) return;
    var row = e.target.closest(".pna-list-item[data-item-id]");
    if (!row) return;
    _draggedItemId = row.dataset.itemId || null;
    _sourceRow = row;
    _dragStartX = e.clientX;
    _dragStartY = e.clientY;
    _isDragging = false;
    document.addEventListener("mousemove", _onDocumentMouseMove);
    document.addEventListener("mouseup", _onDocumentMouseUp);
    e.preventDefault();
  }
  function _onDocumentMouseMove(e) {
    if (!_draggedItemId || !_sourceRow) return;
    var dx = e.clientX - _dragStartX;
    var dy = e.clientY - _dragStartY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (!_isDragging && dist < DRAG_THRESHOLD) return;
    if (!_isDragging) {
      _isDragging = true;
      setDragging(_draggedItemId, true);
      _createGhost(_sourceRow, e);
    }
    if (_dragGhost) {
      _dragGhost.style.left = e.clientX + 12 + "px";
      _dragGhost.style.top = e.clientY - 14 + "px";
    }
    if (_dragGhost) _dragGhost.style.pointerEvents = "none";
    var elementUnder = document.elementFromPoint(e.clientX, e.clientY);
    if (_dragGhost) _dragGhost.style.pointerEvents = "";
    var targetRow = elementUnder ? elementUnder.closest(".pna-list-item[data-item-id]") : null;
    if (targetRow && targetRow.dataset.itemId !== _draggedItemId) {
      var rect = targetRow.getBoundingClientRect();
      var midY = rect.top + rect.height / 2;
      var isAbove = e.clientY < midY;
      setDropTarget(targetRow.dataset.itemId || null, isAbove);
    } else {
      setDropTarget(null, null);
    }
  }
  function _onDocumentMouseUp(e) {
    document.removeEventListener("mousemove", _onDocumentMouseMove);
    document.removeEventListener("mouseup", _onDocumentMouseUp);
    _removeGhost();
    if (_draggedItemId) setDragging(_draggedItemId, false);
    setDropTarget(null, null);
    if (_isDragging && _draggedItemId) {
      var elementUnder = document.elementFromPoint(e.clientX, e.clientY);
      var targetRow = elementUnder ? elementUnder.closest(".pna-list-item[data-item-id]") : null;
      if (targetRow && targetRow.dataset.itemId && targetRow.dataset.itemId !== _draggedItemId) {
        var targetId = targetRow.dataset.itemId;
        var items = store.get("items") || [];
        var draggedIndex = items.findIndex(function(i) {
          return i.id === _draggedItemId;
        });
        var targetIndex = items.findIndex(function(i) {
          return i.id === targetId;
        });
        if (draggedIndex !== -1 && targetIndex !== -1) {
          var rect = targetRow.getBoundingClientRect();
          var midY = rect.top + rect.height / 2;
          var insertBefore = e.clientY < midY;
          var sourceGroupKey = _sourceRow ? _sourceRow.dataset.groupKey || "" : "";
          var targetGroupKey = targetRow.dataset.groupKey || "";
          var isCrossGroup = sourceGroupKey !== targetGroupKey && targetGroupKey !== "";
          var newItems = items.slice();
          var removed = newItems.splice(draggedIndex, 1)[0];
          var newIndex = insertBefore ? targetIndex : targetIndex + 1;
          newItems.splice(newIndex > draggedIndex ? newIndex - 1 : newIndex, 0, removed);
          var allRows = document.querySelectorAll(".pna-list-item[data-source-table]");
          var domMap = {};
          allRows.forEach(function(r) {
            var el = r;
            if (el.dataset.itemId) {
              domMap[el.dataset.itemId] = {
                sourceTable: el.dataset.sourceTable || "ui_nav_items",
                sourceId: el.dataset.sourceId || el.dataset.itemId
              };
            }
          });
          newItems.forEach(function(item, index) {
            item.order = index + 1;
            var id = String(item.id || "");
            if (!item.sourceTable && domMap[id]) {
              item.sourceTable = domMap[id].sourceTable;
              item.sourceId = domMap[id].sourceId;
            }
          });
          var reorderPromise;
          if (isCrossGroup) {
            var draggedItem = removed;
            var patchPayload = {
              sourceTable: draggedItem.sourceTable || (domMap[String(draggedItem.id)] ? domMap[String(draggedItem.id)].sourceTable : "ui_nav_items"),
              sourceId: draggedItem.sourceId || (domMap[String(draggedItem.id)] ? domMap[String(draggedItem.id)].sourceId : draggedItem.id),
              parentKey: targetGroupKey
            };
            draggedItem.parentKey = targetGroupKey;
            draggedItem.parent_key = targetGroupKey;
            reorderPromise = navAdapter.updateItem(draggedItem.id, patchPayload).then(function(result) {
              if (!(result.ok || result.success)) {
                throw new Error(result.error || "Erro ao mover para outro grupo");
              }
              return navAdapter.reorderItems(newItems);
            });
          } else {
            reorderPromise = navAdapter.reorderItems(newItems);
          }
          reorderPromise.then(function() {
            var ul = document.querySelector('ul.pna-list[data-sortable="items"]');
            if (ul) {
              for (var ri = 0; ri < newItems.length; ri++) {
                var itemId = String(newItems[ri].id || "");
                var row = ul.querySelector('.pna-list-item[data-item-id="' + itemId + '"]');
                if (row) {
                  ul.appendChild(row);
                  var orderNum = row.querySelector(".pna-order-num");
                  if (orderNum) orderNum.textContent = String(ri + 1);
                }
              }
            }
            showToast(isCrossGroup ? "Item movido para outro grupo" : "Ordem atualizada", "success");
            window.dispatchEvent(new CustomEvent("navigation:items:changed", {
              detail: { source: "panel-nav-admin", action: isCrossGroup ? "cross-group-move" : "reorder" }
            }));
            loadData();
          }).catch(function(error) {
            showToast("Erro ao reordenar: " + error.message, "error");
            loadData();
          });
        }
      }
    }
    _isDragging = false;
    _draggedItemId = null;
    _sourceRow = null;
  }
  function _createGhost(row, e) {
    _removeGhost();
    _dragGhost = document.createElement("div");
    _dragGhost.className = "pna-drag-ghost";
    var label = row.querySelector(".pna-item-label");
    var labelText = label ? label.textContent || "" : row.dataset.itemId || "";
    _dragGhost.innerHTML = '<div class="pna-drag-ghost-content"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg><span>' + labelText + "</span></div>";
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
  function _onGroupMouseMove(e) {
    if (!_groupDragSource) return;
    var dx = e.clientX - _dragStartX;
    var dy = e.clientY - _dragStartY;
    if (!_groupDragging && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
    if (!_groupDragging) {
      _groupDragging = true;
      _groupDragSource.style.opacity = "0.5";
      _groupDragGhost = document.createElement("div");
      _groupDragGhost.className = "pna-drag-ghost";
      var gLabel = _groupDragSource.querySelector('span[style*="text-transform"]');
      _groupDragGhost.innerHTML = '<div class="pna-drag-ghost-content"><span>' + (gLabel ? gLabel.textContent : "Grupo") + "</span></div>";
      _groupDragGhost.style.left = e.clientX + 12 + "px";
      _groupDragGhost.style.top = e.clientY - 14 + "px";
      document.body.appendChild(_groupDragGhost);
    }
    if (_groupDragGhost) {
      _groupDragGhost.style.left = e.clientX + 12 + "px";
      _groupDragGhost.style.top = e.clientY - 14 + "px";
    }
    if (_groupDragGhost) _groupDragGhost.style.pointerEvents = "none";
    var under = document.elementFromPoint(e.clientX, e.clientY);
    if (_groupDragGhost) _groupDragGhost.style.pointerEvents = "";
    var targetSep = under ? under.closest("[data-group-drag]") : null;
    document.querySelectorAll(".pna-group-drop-target").forEach(function(el) {
      el.classList.remove("pna-group-drop-target");
    });
    if (targetSep && targetSep !== _groupDragSource) {
      targetSep.classList.add("pna-group-drop-target");
      targetSep.style.background = "rgba(99,102,241,0.15)";
    }
  }
  function _onGroupMouseUp(e) {
    document.removeEventListener("mousemove", _onGroupMouseMove);
    document.removeEventListener("mouseup", _onGroupMouseUp);
    if (_groupDragGhost && _groupDragGhost.parentNode) _groupDragGhost.parentNode.removeChild(_groupDragGhost);
    _groupDragGhost = null;
    document.querySelectorAll(".pna-group-drop-target").forEach(function(el) {
      el.classList.remove("pna-group-drop-target");
      el.style.background = "";
    });
    if (_groupDragSource) _groupDragSource.style.opacity = "";
    if (_groupDragging && _groupDragSource) {
      if (_groupDragGhost) _groupDragGhost.style.pointerEvents = "none";
      var under = document.elementFromPoint(e.clientX, e.clientY);
      var targetSep = under ? under.closest("[data-group-drag]") : null;
      if (targetSep && targetSep !== _groupDragSource) {
        _handleGroupDrop(_groupDragSource, targetSep);
      }
    }
    _groupDragging = false;
    _groupDragSource = null;
  }
  function init() {
    if (_documentListenerAttached) return;
    document.addEventListener("mousedown", _onDocumentMouseDown);
    _documentListenerAttached = true;
  }
  function destroy() {
    if (!_documentListenerAttached) return;
    document.removeEventListener("mousedown", _onDocumentMouseDown);
    document.removeEventListener("mousemove", _onDocumentMouseMove);
    document.removeEventListener("mouseup", _onDocumentMouseUp);
    _removeGhost();
    _documentListenerAttached = false;
    _isDragging = false;
    _draggedItemId = null;
    _sourceRow = null;
  }
  function handleMouseDown(_e) {
  }
  function handleMouseUp(_e) {
  }
  init();
  return { handleMouseDown, handleMouseUp, init, destroy };
}
function getDraggedItemId() {
  return _draggedItemId;
}
function clearDragState() {
  if (_draggedItemId) setDragging(_draggedItemId, false);
  setDropTarget(null, null);
  _draggedItemId = null;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { dragDropReady: _documentListenerAttached } };
}
export {
  MODULE_ID,
  VERSION,
  clearDragState,
  createDragDropHandlers,
  getDraggedItemId,
  healthCheck,
  info
};
