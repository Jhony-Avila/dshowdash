import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiSend } from '../api/client';
import { money, dateTimeBr } from '../format';
import { DataGrid, type BulkAction } from './DataGrid';
import type { ColumnDef } from './dataGrid';

const byText = (f: (r: any) => any) => (a: any, b: any) => String(f(a) || '').localeCompare(String(f(b) || ''), 'pt-BR');
const byNum = (f: (r: any) => any) => (a: any, b: any) => (Number(f(a)) || 0) - (Number(f(b)) || 0);
const byDate = (f: (r: any) => any) => (a: any, b: any) => String(f(a) || '').localeCompare(String(f(b) || ''));

// Colunas declarativas do catálogo de Itens (6 padrão + extras opcionais). Adicionar coluna = 1 entrada.
const ITEM_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Nome', width: 'minmax(160px,1.6fr)', defaultVisible: true, sticky: 'left', fixed: true, filter: 'text', cmp: byText((r) => r.name), accessor: (r) => r.name, render: (r) => ({ text: r.name || '—', title: r.name || undefined }) },
  { key: 'category', label: 'Categoria', width: 'minmax(120px,1fr)', defaultVisible: true, filter: 'text', cmp: byText((r) => r.category_name), accessor: (r) => r.category_name, render: (r) => ({ text: r.category_name || '—', title: r.category_name || undefined }) },
  { key: 'unit', label: 'Unidade', width: '90px', defaultVisible: true, filter: 'text', cmp: byText((r) => r.unit_measure), accessor: (r) => r.unit_measure, render: (r) => ({ text: r.unit_measure || '—' }) },
  { key: 'brl', label: 'Preço BRL', width: '112px', num: true, defaultVisible: true, cmp: byNum((r) => r.default_unit_price_brl), render: (r) => ({ text: r.default_unit_price_brl == null ? '—' : money(r.default_unit_price_brl, 'BRL') }) },
  { key: 'usd', label: 'Preço USD', width: '112px', num: true, defaultVisible: true, cmp: byNum((r) => r.default_unit_price_usd), render: (r) => ({ text: r.default_unit_price_usd == null ? '—' : money(r.default_unit_price_usd, 'USD') }) },
  { key: 'status', label: 'Status', width: '96px', defaultVisible: true, cmp: (a, b) => Number(b.is_active) - Number(a.is_active), render: (r) => ({ text: Number(r.is_active) === 1 ? 'Ativo' : 'Inativo', badge: Number(r.is_active) === 1 ? 'k-badge-ok' : 'k-badge-off' }) },
  // extras (do endpoint /items)
  { key: 'sku', label: 'SKU', width: '110px', defaultVisible: false, filter: 'text', cmp: byText((r) => r.sku), accessor: (r) => r.sku, render: (r) => ({ text: r.sku || '—', title: r.sku || undefined }) },
  { key: 'description', label: 'Descrição', width: 'minmax(140px,1.4fr)', defaultVisible: false, filter: 'text', cmp: byText((r) => r.description), accessor: (r) => r.description, render: (r) => ({ text: r.description || '—', title: r.description || undefined }) },
  { key: 'created_at', label: 'Criado em', width: '132px', defaultVisible: false, filter: 'daterange', cmp: byDate((r) => r.created_at), accessor: (r) => r.created_at, render: (r) => ({ text: r.created_at ? dateTimeBr(r.created_at) : '—' }) },
  { key: 'updated_at', label: 'Atualizado em', width: '132px', defaultVisible: false, filter: 'daterange', cmp: byDate((r) => r.updated_at), accessor: (r) => r.updated_at, render: (r) => ({ text: r.updated_at ? dateTimeBr(r.updated_at) : '—' }) },
];

const norm = (s: any) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function AdminItemCatalog({ canWrite }: { canWrite: boolean }) {
  const [cats, setCats] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [catName, setCatName] = useState('');
  const [f, setF] = useState<any>({ name: '', category_id: '', unit_measure: '', brl: '', usd: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [ef, setEf] = useState<any>({});

  async function load() {
    setLoading(true);
    try { setCats(await apiGet('/item-categories')); setItems(await apiGet('/items')); setErr(''); }
    catch (e: any) { setErr(e.message || 'Falha ao carregar'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function addCat() {
    try { await apiSend('POST', '/item-categories', { name: catName }); setCatName(''); setMsg('Categoria criada.'); load(); }
    catch (e: any) { setMsg('Erro: ' + e.message); }
  }
  async function addItem() {
    try {
      await apiSend('POST', '/items', { name: f.name, category_id: f.category_id ? Number(f.category_id) : null, unit_measure: f.unit_measure || null, default_unit_price_brl: f.brl ? Number(f.brl) : null, default_unit_price_usd: f.usd ? Number(f.usd) : null });
      setF({ name: '', category_id: '', unit_measure: '', brl: '', usd: '' }); setMsg('Item criado.'); load();
    } catch (e: any) { setMsg('Erro: ' + e.message); }
  }
  function startEdit(i: any) { setEditId(i.id); setEf({ name: i.name, category_id: i.category_id || '', unit_measure: i.unit_measure || '', brl: i.default_unit_price_brl ?? '', usd: i.default_unit_price_usd ?? '' }); }
  async function saveEdit() {
    try {
      await apiSend('PUT', '/items/' + editId, { name: ef.name, category_id: ef.category_id ? Number(ef.category_id) : null, unit_measure: ef.unit_measure || null, default_unit_price_brl: ef.brl !== '' ? Number(ef.brl) : null, default_unit_price_usd: ef.usd !== '' ? Number(ef.usd) : null });
      setEditId(null); setMsg('Item atualizado.'); load();
    } catch (e: any) { setMsg('Erro: ' + e.message); }
  }
  async function removeItem(i: any) {
    if (!window.confirm(`Remover "${i.name}" do catálogo? (soft-delete — dados preservados)`)) return;
    try { await apiSend('DELETE', '/items/' + i.id); setMsg('Item removido.'); load(); }
    catch (e: any) { setMsg('Erro: ' + e.message); }
  }

  const bulk: BulkAction[] = [{ key: 'deactivate', label: 'Desativar selecionados', danger: true, confirm: (n) => `Desativar ${n} item(ns)? (soft-delete)`, perId: (id) => apiSend('DELETE', '/items/' + id) }];

  const toolbarLeft = (
    <select className="k-input" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
      <option value="">Todas as categorias</option>
      {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  );

  const rowActions = canWrite ? (i: any) => (<>
    <button type="button" className="k-icon-btn" title="Editar" onClick={() => startEdit(i)}>✎</button>
    <button type="button" className="k-icon-btn k-danger-ink" title="Excluir (desativar)" onClick={() => removeItem(i)}>🗑</button>
  </>) : undefined;

  const renderEditRow = (i: any) => (<>
    <input className="k-input k-input-sm" style={{ minWidth: 160 }} value={ef.name} onChange={(e) => setEf({ ...ef, name: e.target.value })} placeholder="Nome" />
    <select className="k-input k-input-sm" value={ef.category_id} onChange={(e) => setEf({ ...ef, category_id: e.target.value })}><option value="">Categoria…</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
    <input className="k-input k-input-sm" style={{ maxWidth: 90 }} value={ef.unit_measure} onChange={(e) => setEf({ ...ef, unit_measure: e.target.value })} placeholder="Un" />
    <input className="k-input k-input-sm" style={{ maxWidth: 100 }} value={ef.brl} onChange={(e) => setEf({ ...ef, brl: e.target.value })} placeholder="BRL" />
    <input className="k-input k-input-sm" style={{ maxWidth: 100 }} value={ef.usd} onChange={(e) => setEf({ ...ef, usd: e.target.value })} placeholder="USD" />
    <span className="k-grow" />
    <button type="button" className="k-btn k-btn-sm" onClick={saveEdit}>Salvar</button>
    <button type="button" className="k-btn k-btn-sm k-btn-ghost" onClick={() => setEditId(null)}>Cancelar</button>
  </>);

  const catFilterFn = useMemo(() => (catFilter ? (i: any) => Number(i.category_id) === Number(catFilter) : undefined), [catFilter]);

  return (
    <div className="k-card">
      <div className="k-list-head"><h2>Catálogo de Itens</h2></div>
      {msg && <div className="k-msg">{msg}</div>}

      {canWrite && (
        <div className="k-item-create">
          <div className="k-row">
            <input className="k-input" placeholder="Nova categoria" value={catName} onChange={(e) => setCatName(e.target.value)} />
            <button className="k-btn k-btn-sm" onClick={addCat} disabled={!catName}>+ Categoria</button>
          </div>
          <div className="k-row">
            <input className="k-input" placeholder="Nome do item" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <select className="k-input" value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}><option value="">Categoria…</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <input className="k-input k-input-sm" placeholder="Un (m2/un…)" value={f.unit_measure} onChange={(e) => setF({ ...f, unit_measure: e.target.value })} />
            <input className="k-input k-input-sm" placeholder="BRL" value={f.brl} onChange={(e) => setF({ ...f, brl: e.target.value })} />
            <input className="k-input k-input-sm" placeholder="USD" value={f.usd} onChange={(e) => setF({ ...f, usd: e.target.value })} />
            <button className="k-btn k-btn-sm" onClick={addItem} disabled={!f.name}>+ Item</button>
          </div>
        </div>
      )}

      <DataGrid
        columns={ITEM_COLUMNS}
        rows={items}
        getRowId={(i) => i.id}
        storageKey="koala.items"
        defaultSort={[{ key: 'name', dir: 'asc' }]}
        loading={loading}
        error={err}
        onRetry={load}
        onReload={load}
        emptyText="Nenhum item no catálogo."
        search={{ placeholder: 'Buscar por nome, categoria ou SKU…', highlightText: true, predicate: (i, q) => norm(i.name).includes(norm(q)) || norm(i.category_name).includes(norm(q)) || norm(i.sku).includes(norm(q)) }}
        preFilter={catFilterFn}
        toolbarLeft={toolbarLeft}
        csvName="itens"
        selectable={canWrite}
        bulkActions={bulk}
        rowActions={rowActions}
        editRowId={editId}
        renderEditRow={renderEditRow}
      />
      {!canWrite && <p className="k-muted k-sm" style={{ marginTop: 10 }}>Somente administradores cadastram/editam itens.</p>}
    </div>
  );
}
