import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '../api/client';

export function AdminCommercialTerms({ canWrite }: { canWrite: boolean }) {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  async function load() {
    try {
      setRows(await apiGet('/commercial-terms'));
    } catch (e: any) {
      setMsg('Erro: ' + e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    try {
      await apiSend('POST', '/commercial-terms', { name, content });
      setName('');
      setContent('');
      setMsg('Condição criada.');
      load();
    } catch (e: any) {
      setMsg('Erro: ' + e.message);
    }
  }

  return (
    <div className="k-card">
      <h2>Condições Comerciais</h2>
      {msg && <div className="k-msg">{msg}</div>}
      {canWrite && (
        <div className="k-row">
          <input className="k-input" placeholder="Nome da condição" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="k-input" placeholder="Texto" value={content} onChange={(e) => setContent(e.target.value)} />
          <button className="k-btn" onClick={add} disabled={!name}>+ Condição</button>
        </div>
      )}
      <h3>Cadastradas ({rows.length})</h3>
      <ul className="k-list">
        {rows.map((r) => <li key={r.id}><b>{r.name}</b>{r.content ? ' — ' + r.content : ''}</li>)}
      </ul>
      {!canWrite && <p className="k-muted">Somente administradores cadastram condições.</p>}
    </div>
  );
}
