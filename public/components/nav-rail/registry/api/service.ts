// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-registry-api
// PURPOSE: NavRail Registry - API Service
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   fetchManifest() — exported function
//   createItem() — exported function
//   updateItem() — exported function
//   deleteItem() — exported function
//   toggleItem() — exported function
//   reorderItems() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'navrail-registry-api';
export const VERSION = '4.2.0-ES6';

const API_BASE = '/api/ui/navrail/';

// Fetch manifest from API
export function fetchManifest() {
  return fetch(`${API_BASE}?action=manifest`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });
}

// CRUD Operations
export function createItem(data: unknown) {
  return fetch(`${API_BASE}?action=item`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(response => response.json());
}

export function updateItem(id: string, data: unknown) {
  return fetch(`${API_BASE}?action=item&id=${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(response => response.json());
}

export function deleteItem(id: string) {
  return fetch(`${API_BASE}?action=item&id=${id}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(response => response.json());
}

export function toggleItem(id: string) {
  return fetch(`${API_BASE}?action=toggle&id=${id}`, {
    method: 'POST',
    credentials: 'include'
  }).then(response => response.json());
}

export function reorderItems(itemIds: string[]) {
  return fetch(`${API_BASE}?action=reorder`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: itemIds })
  }).then(response => response.json());
}

export default {
  fetchManifest,
  createItem,
  updateItem,
  deleteItem,
  toggleItem,
  reorderItems
};
