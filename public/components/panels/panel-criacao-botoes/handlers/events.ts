/* ═══════════════════════════════════════════════════════════════
 * panel-criacao-botoes/handlers/events.ts
 * @version 1.1.0
 * Wiring de eventos (delegação + AbortController para cleanup).
 * Escrita SÓ via adapter compartilhado (createItem/updateItem) —
 * lazy import. PNR: nenhuma chamada a deleteItem.
 * ═══════════════════════════════════════════════════════════════ */

import { store } from '../state/store.js';
import { validateCreate, buildCreatePayload, buildUpdatePayload } from '../core/form-logic.js';
import type { CreateFormValues } from '../core/form-logic.js';
import { findItem } from '../core/transform.js';
import { renderSidebarPreview } from '../ui/preview/button-preview.js';
import { loadData } from './data.js';
import { trackAction } from '../telemetry/tracker.js';

const ADAPTER_URL = '../core/nav-data-adapter.js';

function collectForm(form: HTMLFormElement): CreateFormValues {
  const fd = new FormData(form);
  return {
    label: String(fd.get('label') ?? ''),
    icon: String(fd.get('icon') ?? ''),
    group: String(fd.get('group') ?? ''),
    panel_id: String(fd.get('panel_id') ?? ''),
    route_path: String(fd.get('route_path') ?? ''),
    is_active: fd.get('is_active') != null,
  };
}

function showError(form: HTMLElement, msg: string): void {
  const box = form.querySelector<HTMLElement>('[data-role="form-error"]');
  if (box) {
    box.hidden = false;
    box.textContent = msg;
  }
}
function clearError(form: HTMLElement): void {
  const box = form.querySelector<HTMLElement>('[data-role="form-error"]');
  if (box) box.hidden = true;
}

/** Liga os eventos no container; retorna função de cleanup. */
export function setupEvents(container: HTMLElement): () => void {
  const ac = new AbortController();
  const { signal } = ac;

  container.addEventListener(
    'click',
    (e) => {
      const target = (e.target as HTMLElement)?.closest('[data-action]');
      if (!target) return;
      const action = target.getAttribute('data-action');

      if (action === 'new') {
        trackAction('open-create');
        store.setMode('create');
      } else if (action === 'cancel') {
        store.setMode('list');
      } else if (action === 'edit') {
        const id = target.getAttribute('data-item-id') || '';
        const item = findItem(store.getState().groups, id);
        if (item) {
          trackAction('open-edit', { id });
          store.setMode('edit', item);
        }
      } else if (action === 'toggle') {
        const id = target.getAttribute('data-item-id') || '';
        void toggleItem(id);
      }
    },
    { signal }
  );

  // Preview ao vivo (sem I/O): re-renderiza só o nó de preview conforme o form muda.
  container.addEventListener(
    'input',
    (e) => {
      const form = (e.target as HTMLElement)?.closest('[data-form]') as HTMLFormElement | null;
      if (!form) return;
      const node = form.querySelector<HTMLElement>('[data-role="preview"]');
      if (!node) return;
      const f = collectForm(form);
      node.innerHTML = renderSidebarPreview({ label: f.label, icon: f.icon, panel_id: f.panel_id, is_active: f.is_active });
    },
    { signal }
  );

  container.addEventListener(
    'submit',
    (e) => {
      const form = (e.target as HTMLElement)?.closest('[data-form]') as HTMLFormElement | null;
      if (!form) return;
      const kind = form.getAttribute('data-form');
      if (kind !== 'create' && kind !== 'edit') return;
      e.preventDefault();
      void submitForm(form, kind);
    },
    { signal }
  );

  return () => ac.abort();
}

async function submitForm(form: HTMLFormElement, kind: 'create' | 'edit'): Promise<void> {
  const values = collectForm(form);
  const v = validateCreate(values);
  if (!v.valid) {
    showError(form, v.errors.join(' '));
    return;
  }
  clearError(form);

  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const adapter = await import(ADAPTER_URL);
    let res: { success?: boolean; ok?: boolean; error?: string };

    if (kind === 'create') {
      const payload = buildCreatePayload(values);
      res = await adapter.createItem(payload);
      if (res && (res.success || res.ok)) trackAction('create-ok', { itemKey: payload.id });
    } else {
      const editing = store.getState().editing;
      if (!editing) {
        showError(form, 'Item em edição não encontrado.');
        if (submitBtn) submitBtn.disabled = false;
        return;
      }
      const payload = buildUpdatePayload(editing, values);
      res = await adapter.updateItem(editing.id, payload);
      if (res && (res.success || res.ok)) trackAction('update-ok', { itemKey: editing.id });
    }

    if (res && (res.success || res.ok)) {
      store.setMode('list');
      await loadData();
    } else {
      showError(form, (res && res.error) || 'Falha ao salvar.');
      if (submitBtn) submitBtn.disabled = false;
    }
  } catch (err) {
    showError(form, err instanceof Error ? err.message : String(err));
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function toggleItem(id: string): Promise<void> {
  const item = findItem(store.getState().groups, id);
  if (!item) return;
  try {
    const adapter = await import(ADAPTER_URL);
    const { buildTogglePayload } = await import('../core/form-logic.js');
    const payload = buildTogglePayload(item);
    const res = await adapter.updateItem(item.id, payload);
    if (res && (res.success || res.ok)) {
      trackAction('toggle-ok', { id, isActive: payload.isActive });
      await loadData();
    } else {
      store.setError((res && res.error) || 'Falha ao alternar status.');
    }
  } catch (err) {
    store.setError(err instanceof Error ? err.message : String(err));
  }
}
