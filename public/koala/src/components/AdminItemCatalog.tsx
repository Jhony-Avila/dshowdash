import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '../api/client';
import { money } from '../format';
import { useGridSort, sortRows, DataGridHeader, type GridCol } from './dataGrid';

const norm = (s: any) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const ITEM_COLS: GridCol[] = [
  { key: 'name', label: 'Nome' }, { key: 'category', label: 'Categoria' }, { key: 'unit', label: 'Unidade' },
  { key: 'brl', label: 'Preço BRL', num: true }, { key: 'usd', label: 'Preço USD', num: true }, { key: 'status', label: 'Status' }, {},
];
const ITEM_CMP: Record<string, (a: any, b: any) => number> = {
  name: (a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'),
  category: (a, b) => (a.category_name || '').localeCompare(b.category_name || '', 'pt-BR') || (a.name || '').localeCompare(b.name || '', 'pt-BR'),
  unit: (a, b) => (a.unit_measure || '').localeCompare(b.unit_measure || '', 'pt-BR'),
  brl: (a, b) => (Number(a.default_unit_price_brl) || 0) - (Number(b.default_unit_price_brl) || 0),
  usd: (a, b) => (Number(a.default_unit_price_usd) || 0) - (Number(b.default_unit_price_usd) || 0),
  status: (a, b) => (Number(b.is_active) - Number(a.is_active)) || (a.name || '').localeCompare(b.name || '', 'pt-BR'),
};

export function AdminItemCatalog({ canWrite }: { canWrite: boolean }) {
  const [cats, setCats] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const { sort, cycle } = useGridSort('koala.items.sort', { key: 'name', dir: 'asc' });

  // criação
  const [catName, setCatName] = useState('');
  const [f, setF] = useState<any>({ name: '', category_id: '', unit_measure: '', brl: '', usd: '' });
  // edição inline
  const [editId, setEditId] = useState<number | null>(null);
  const [ef, setEf] = useState<any>({});

  async function load() {
    try { setCats(await apiGet('/item-categories')); setItems(await apiGet('/items')); }
    catch (e: any) { setMsg('Erro: ' + e.message); }
  }
  useEffect(() => { load(); }, []);

  async function addCat() {
    try { await apiSend('POST', '/item-categories', { name: catName }); setCatName(''); setMsg('Categoria criada.'); load(); }
    catch (e: any) { setMsg('Erro: ' + e.message); }
  }
  async function addItem() {
    try {
      await apiSend('POST', '/items', {
        name: f.name, category_id: f.category_id ? Number(f.category_id) : null, unit_measure: f.unit_measure || null,
        default_unit_price_brl: f.brl ? Number(f.brl) : null, default_unit_price_usd: f.usd ? Number(f.usd) : null,
      });
      setF({ name: '', category_id: '', unit_measure: '', brl: '', usd: '' }); setMsg('Item criado.'); load();
    } catch (e: any) { setMsg('Erro: ' + e.message); }
  }
  function startEdit(i: any) {
    setEditId(i.id);
    setEf({ name: i.name, category_id: i.category_id || '', unit_measure: i.unit_measure || '', brl: i.default_unit_price_brl ?? '', usd: i.default_unit_price_usd ?? '' });
  }
  async function saveEdit() {
    try {
      await apiSend('PUT', '/items/' + editId, {
        name: ef.name, category_id: ef.category_id ? Number(ef.category_id) : null, unit_measure: ef.unit_measure || null,
        default_unit_price_brl: ef.brl !== '' ? Number(ef.brl) : null, default_unit_price_usd: ef.usd !== '' ? Number(ef.usd) : null,
      });
      setEditId(null); setMsg('Item atualizado.'); load();
    } catch (e: any) { setMsg('Erro: ' + e.message); }
  }
  async function removeItem(i: any) {
    if (!window.confirm(`Remover "${i.name}" do catálogo? (soft-delete — dados preservados)`)) return;
    try { await apiSend('DELETE', '/items/' + i.id); setMsg('Item removido.'); load(); }
    catch (e: any) { setMsg('Erro: ' + e.message); }
  }

  const catName_ = (id: any) => cats.find((c) => c.id === Number(id))?.name || '—';
  const needle = norm(q.trim());
  const filtered = items.filter((i) =>
    (!catFilter || Number(i.category_id) === Number(catFilter)) &&
    (!needle || norm(i.name).includes(needle) || norm(i.category_name).includes(needle)));
  const sorted = sortRows(filtered, sort, ITEM_CMP);

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
            <select className="k-input" value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
              <option value="">Categoria…</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="k-input k-input-sm" placeholder="Un (m2/un…)" value={f.unit_measure} onChange={(e) => setF({ ...f, unit_measure: e.target.value })} />
            <input className="k-input k-input-sm" placeholder="BRL" value={f.brl} onChange={(e) => setF({ ...f, brl: e.target.value })} />
            <input className="k-input k-input-sm" placeholder="USD" value={f.usd} onChange={(e) => setF({ ...f, usd: e.target.value })} />
            <button className="k-btn k-btn-sm" onClick={addItem} disabled={!f.name}>+ Item</button>
          </div>
        </div>
      )}

      <div className="k-sec-toolbar">
        <select className="k-input" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">Todas as categorias</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="k-input k-sec-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou categoria…" />
        <span className="k-muted k-sm">{sorted.length} de {items.length}</span>
      </div>

      <div className="k-item-grid">
        <DataGridHeader cols={ITEM_COLS} sort={sort} onSort={cycle} />
        <div className="k-dg-body">
          {sorted.map((i) => (editId === i.id ? (
            <div className="k-dg-row k-dg-row-edit" key={i.id}>
              <input className="k-input" value={ef.name} onChange={(e) => setEf({ ...ef, name: e.target.value })} />
              <select className="k-input" value={ef.category_id} onChange={(e) => setEf({ ...ef, category_id: e.target.value })}>
                <option value="">—</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className="k-input" value={ef.unit_measure} onChange={(e) => setEf({ ...ef, unit_measure: e.target.value })} />
              <input className="k-input k-dg-num" value={ef.brl} onChange={(e) => setEf({ ...ef, brl: e.target.value })} />
              <input className="k-input k-dg-num" value={ef.usd} onChange={(e) => setEf({ ...ef, usd: e.target.value })} />
              <span className="k-dg-cell k-muted k-sm">editando</span>
              <div className="k-acc-actions">
                <button className="k-btn k-btn-sm" onClick={saveEdit}>Salvar</button>
                <button className="k-btn k-btn-sm k-btn-ghost" onClick={() => setEditId(null)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="k-dg-row k-dg-row-static" key={i.id}>
              <span className="k-dg-cell">{i.name}</span>
              <span className="k-dg-cell">{i.category_name || catName_(i.category_id)}</span>
              <span className="k-dg-cell">{i.unit_measure || '—'}</span>
              <span className="k-dg-cell k-dg-num">{i.default_unit_price_brl == null ? '—' : money(i.default_unit_price_brl, 'BRL')}</span>
              <span className="k-dg-cell k-dg-num">{i.default_unit_price_usd == null ? '—' : money(i.default_unit_price_usd, 'USD')}</span>
              <span className="k-dg-cell"><span className={'k-badge ' + (Number(i.is_active) === 1 ? 'k-badge-ok' : 'k-badge-off')}>{Number(i.is_active) === 1 ? 'Ativo' : 'Inativo'}</span></span>
              <div className="k-acc-actions">
                {canWrite && <button className="k-btn k-btn-sm k-btn-ghost" onClick={() => startEdit(i)}>Editar</button>}
                {canWrite && <button className="k-btn k-btn-sm k-btn-danger" onClick={() => removeItem(i)}>Excluir</button>}
              </div>
            </div>
          )))}
          {sorted.length === 0 && <p className="k-muted k-acc-empty">{items.length === 0 ? 'Nenhum item no catálogo.' : 'Nenhum item corresponde ao filtro/busca.'}</p>}
        </div>
      </div>
      {!canWrite && <p className="k-muted k-sm" style={{ marginTop: 10 }}>Somente administradores cadastram/editam itens.</p>}
    </div>
  );
}
