import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '../api/client';

export function AdminItemCatalog({ canWrite }: { canWrite: boolean }) {
  const [cats, setCats] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [catName, setCatName] = useState('');
  const [itemName, setItemName] = useState('');
  const [brl, setBrl] = useState('');

  async function load() {
    try {
      setCats(await apiGet('/item-categories'));
      setItems(await apiGet('/items'));
    } catch (e: any) {
      setMsg('Erro: ' + e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function addCat() {
    try {
      await apiSend('POST', '/item-categories', { name: catName });
      setCatName('');
      setMsg('Categoria criada.');
      load();
    } catch (e: any) {
      setMsg('Erro: ' + e.message);
    }
  }

  async function addItem() {
    try {
      await apiSend('POST', '/items', { name: itemName, default_unit_price_brl: brl ? Number(brl) : null });
      setItemName('');
      setBrl('');
      setMsg('Item criado.');
      load();
    } catch (e: any) {
      setMsg('Erro: ' + e.message);
    }
  }

  return (
    <div className="k-card">
      <h2>Catálogo de Itens</h2>
      {msg && <div className="k-msg">{msg}</div>}

      {canWrite && (
        <div className="k-row">
          <input className="k-input" placeholder="Nova categoria" value={catName} onChange={(e) => setCatName(e.target.value)} />
          <button className="k-btn" onClick={addCat} disabled={!catName}>+ Categoria</button>
        </div>
      )}
      <h3>Categorias ({cats.length})</h3>
      <ul className="k-list">
        {cats.map((c) => <li key={c.id}>{c.name}</li>)}
      </ul>

      {canWrite && (
        <div className="k-row">
          <input className="k-input" placeholder="Novo item" value={itemName} onChange={(e) => setItemName(e.target.value)} />
          <input className="k-input" placeholder="Preço BRL" value={brl} onChange={(e) => setBrl(e.target.value)} />
          <button className="k-btn" onClick={addItem} disabled={!itemName}>+ Item</button>
        </div>
      )}
      <h3>Itens ({items.length})</h3>
      <table className="k-table">
        <thead><tr><th>Nome</th><th>BRL</th><th>USD</th></tr></thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}><td>{i.name}</td><td>{i.default_unit_price_brl ?? '—'}</td><td>{i.default_unit_price_usd ?? '—'}</td></tr>
          ))}
        </tbody>
      </table>
      {!canWrite && <p className="k-muted">Somente administradores cadastram itens.</p>}
    </div>
  );
}
