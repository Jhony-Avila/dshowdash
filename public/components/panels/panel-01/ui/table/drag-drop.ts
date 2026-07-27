// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/drag-drop
// PURPOSE: Panel-01 - Drag & Drop de Colunas
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createColumnDragDrop() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'dragend'
//   'dragenter'
//   'dragleave'
//   'dragover'
//   'dragstart'
//   'drop'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table/drag-drop';

export class ColumnDragDrop {
  [key: string]: any;
  constructor(tableEl: HTMLElement, options: Record<string, unknown> = {}) {
    this.table = tableEl;
    this.onReorder = options.onReorder || (() => {});
    this.draggedEl = null;
    this.draggedIndex = null;
    this.placeholder = null;
    this._enabled = true;
  }

  init() {
    if (!this.table) return;
    const headers = this.table.querySelectorAll('th[data-draggable="true"]');
    headers.forEach((th: Element, index: number) => {
      th.setAttribute('draggable', 'true');
      th.addEventListener('dragstart', (e) => this._onDragStart(e as DragEvent, index));
      th.addEventListener('dragover', (e) => this._onDragOver(e as DragEvent));
      th.addEventListener('dragenter', (e) => this._onDragEnter(e as DragEvent));
      th.addEventListener('dragleave', (e) => this._onDragLeave(e as DragEvent));
      th.addEventListener('drop', (e) => this._onDrop(e as DragEvent, index));
      th.addEventListener('dragend', (e) => this._onDragEnd(e as DragEvent));
    });
  }

  _onDragStart(e: DragEvent, index: number) {
    if (!this._enabled) { e.preventDefault(); return; }
    this.draggedEl = (e.target as Element).closest('th');
    this.draggedIndex = index;
    this.draggedEl.classList.add('p01-dragging');
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', String(index));
  }

  _onDragOver(e: DragEvent) {
    e.preventDefault();
    // @ts-expect-error strict migration — TS18047
    e.dataTransfer.dropEffect = 'move';
  }

  _onDragEnter(e: DragEvent) {
    const th = (e.target as Element).closest('th');
    if (th && th !== this.draggedEl) th.classList.add('p01-drag-over');
  }

  _onDragLeave(e: DragEvent) {
    const th = (e.target as Element).closest('th');
    if (th) th.classList.remove('p01-drag-over');
  }

  _onDrop(e: DragEvent, targetIndex: number) {
    e.preventDefault();
    const th = (e.target as Element).closest('th');
    if (th) th.classList.remove('p01-drag-over');
    if (this.draggedIndex !== null && this.draggedIndex !== targetIndex) {
      this.onReorder(this.draggedIndex, targetIndex);
    }
  }

  _onDragEnd(_e: DragEvent) {
    if (this.draggedEl) this.draggedEl.classList.remove('p01-dragging');
    this.table.querySelectorAll('.p01-drag-over').forEach((el: Element) => el.classList.remove('p01-drag-over'));
    this.draggedEl = null;
    this.draggedIndex = null;
  }

  enable() { this._enabled = true; }
  disable() { this._enabled = false; }
  destroy() { this._enabled = false; }
}

export function createColumnDragDrop(table: HTMLElement, options: Record<string, unknown> = {}) { return new ColumnDragDrop(table, options); }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { ColumnDragDrop, createColumnDragDrop };
