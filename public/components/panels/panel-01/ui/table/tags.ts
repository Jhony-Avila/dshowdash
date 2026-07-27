// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/tags
// PURPOSE: Panel-01 - Tags/Labels System
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createTagsManager() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/tags';

const STORAGE_KEY = 'p01_tags';
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

export class TagsManager {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    this.onTagAdd = options.onTagAdd || (() => {});
    this.onTagRemove = options.onTagRemove || (() => {});
    this.tags = this._loadTags();
    this.itemTags = this._loadItemTags();
  }

  _loadTags() {
    try { const d = localStorage.getItem(`${STORAGE_KEY}_list`); return d ? JSON.parse(d) : []; } catch { return []; }
  }

  _loadItemTags() {
    try { const d = localStorage.getItem(`${STORAGE_KEY}_items`); return d ? JSON.parse(d) : {}; } catch { return {}; }
  }

  _saveTags() {
    try { localStorage.setItem(`${STORAGE_KEY}_list`, JSON.stringify(this.tags)); } catch {}
  }

  _saveItemTags() {
    try { localStorage.setItem(`${STORAGE_KEY}_items`, JSON.stringify(this.itemTags)); } catch {}
  }

  createTag(name: string, color: string) {
    if (this.tags.find((t: Record<string, unknown>) => (t.name as string).toLowerCase() === name.toLowerCase())) {
      throw new Error('Tag ja existe');
    }
    const tag = { id: `tag_${Date.now()}`, name: name.substring(0, 30), color: color || COLORS[this.tags.length % COLORS.length], createdAt: new Date().toISOString() };
    this.tags.push(tag);
    this._saveTags();
    return tag;
  }

  deleteTag(tagId: string) {
    this.tags = this.tags.filter((t: Record<string, unknown>) => t.id !== tagId);
    for (const itemId of Object.keys(this.itemTags)) {
      this.itemTags[itemId] = this.itemTags[itemId].filter((id: string) => id !== tagId);
    }
    this._saveTags();
    this._saveItemTags();
  }

  updateTag(tagId: string, updates: Record<string, unknown>) {
    const tag = this.tags.find((t: Record<string, unknown>) => t.id === tagId);
    if (!tag) return null;
    if (updates.name) tag.name = (updates.name as string).substring(0, 30);
    if (updates.color) tag.color = updates.color;
    this._saveTags();
    return tag;
  }

  getAllTags() { return [...this.tags]; }
  getTagById(id: string) { return this.tags.find((t: Record<string, unknown>) => t.id === id); }

  addTagToItem(itemId: string, tagId: string) {
    if (!this.itemTags[itemId]) this.itemTags[itemId] = [];
    if (!this.itemTags[itemId].includes(tagId)) {
      this.itemTags[itemId].push(tagId);
      this._saveItemTags();
      this.onTagAdd(itemId, tagId);
    }
  }

  removeTagFromItem(itemId: string, tagId: string) {
    if (!this.itemTags[itemId]) return;
    this.itemTags[itemId] = this.itemTags[itemId].filter((id: string) => id !== tagId);
    this._saveItemTags();
    this.onTagRemove(itemId, tagId);
  }

  getItemTags(itemId: string) {
    const tagIds = this.itemTags[itemId] || [];
    return tagIds.map((id: string) => this.getTagById(id)).filter(Boolean);
  }

  getItemsByTag(tagId: string) {
    return Object.entries(this.itemTags).filter(([_itemId, tags]) => (tags as string[]).includes(tagId)).map(([itemId]) => itemId);
  }

  renderTag(tag: Record<string, unknown>) {
    return `<span class="p01-tag" style="background:${tag.color}20;color:${tag.color};border:1px solid ${tag.color}40" data-tag-id="${tag.id}">${tag.name}<button class="p01-tag-remove" data-action="remove">&times;</button></span>`;
  }

  renderTagsForItem(itemId: string) {
    const tags = this.getItemTags(itemId);
    if (tags.length === 0) return '';
    return `<div class="p01-tags-container">${tags.map((t: unknown) => this.renderTag(t as Record<string, unknown>)).join('')}</div>`;
  }
}

export function createTagsManager(options: Record<string, unknown> = {}) { return new TagsManager(options); }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { TagsManager, createTagsManager };
