const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/tags";
const STORAGE_KEY = "p01_tags";
const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];
class TagsManager {
  constructor(options = {}) {
    this.onTagAdd = options.onTagAdd || (() => {
    });
    this.onTagRemove = options.onTagRemove || (() => {
    });
    this.tags = this._loadTags();
    this.itemTags = this._loadItemTags();
  }
  _loadTags() {
    try {
      const d = localStorage.getItem(`${STORAGE_KEY}_list`);
      return d ? JSON.parse(d) : [];
    } catch {
      return [];
    }
  }
  _loadItemTags() {
    try {
      const d = localStorage.getItem(`${STORAGE_KEY}_items`);
      return d ? JSON.parse(d) : {};
    } catch {
      return {};
    }
  }
  _saveTags() {
    try {
      localStorage.setItem(`${STORAGE_KEY}_list`, JSON.stringify(this.tags));
    } catch {
    }
  }
  _saveItemTags() {
    try {
      localStorage.setItem(`${STORAGE_KEY}_items`, JSON.stringify(this.itemTags));
    } catch {
    }
  }
  createTag(name, color) {
    if (this.tags.find((t) => t.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("Tag ja existe");
    }
    const tag = { id: `tag_${Date.now()}`, name: name.substring(0, 30), color: color || COLORS[this.tags.length % COLORS.length], createdAt: (/* @__PURE__ */ new Date()).toISOString() };
    this.tags.push(tag);
    this._saveTags();
    return tag;
  }
  deleteTag(tagId) {
    this.tags = this.tags.filter((t) => t.id !== tagId);
    for (const itemId of Object.keys(this.itemTags)) {
      this.itemTags[itemId] = this.itemTags[itemId].filter((id) => id !== tagId);
    }
    this._saveTags();
    this._saveItemTags();
  }
  updateTag(tagId, updates) {
    const tag = this.tags.find((t) => t.id === tagId);
    if (!tag) return null;
    if (updates.name) tag.name = updates.name.substring(0, 30);
    if (updates.color) tag.color = updates.color;
    this._saveTags();
    return tag;
  }
  getAllTags() {
    return [...this.tags];
  }
  getTagById(id) {
    return this.tags.find((t) => t.id === id);
  }
  addTagToItem(itemId, tagId) {
    if (!this.itemTags[itemId]) this.itemTags[itemId] = [];
    if (!this.itemTags[itemId].includes(tagId)) {
      this.itemTags[itemId].push(tagId);
      this._saveItemTags();
      this.onTagAdd(itemId, tagId);
    }
  }
  removeTagFromItem(itemId, tagId) {
    if (!this.itemTags[itemId]) return;
    this.itemTags[itemId] = this.itemTags[itemId].filter((id) => id !== tagId);
    this._saveItemTags();
    this.onTagRemove(itemId, tagId);
  }
  getItemTags(itemId) {
    const tagIds = this.itemTags[itemId] || [];
    return tagIds.map((id) => this.getTagById(id)).filter(Boolean);
  }
  getItemsByTag(tagId) {
    return Object.entries(this.itemTags).filter(([_itemId, tags]) => tags.includes(tagId)).map(([itemId]) => itemId);
  }
  renderTag(tag) {
    return `<span class="p01-tag" style="background:${tag.color}20;color:${tag.color};border:1px solid ${tag.color}40" data-tag-id="${tag.id}">${tag.name}<button class="p01-tag-remove" data-action="remove">&times;</button></span>`;
  }
  renderTagsForItem(itemId) {
    const tags = this.getItemTags(itemId);
    if (tags.length === 0) return "";
    return `<div class="p01-tags-container">${tags.map((t) => this.renderTag(t)).join("")}</div>`;
  }
}
function createTagsManager(options = {}) {
  return new TagsManager(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var tags_default = { TagsManager, createTagsManager };
export {
  MODULE_ID,
  TagsManager,
  VERSION,
  createTagsManager,
  tags_default as default,
  healthCheck,
  info
};
