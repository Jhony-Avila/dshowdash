import { useEffect, useRef, useState } from 'react';
import { apiGet, apiSend, apiUpload } from '../api/client';
import { dateTimeBr } from '../format';
import { DataGrid, type BulkAction } from './DataGrid';
import type { ColumnDef } from './dataGrid';

function backendMsg(e: any): string { return e?.meta?.message || e?.message || 'Erro'; }
function fmtSize(n: any): string { const b = Number(n) || 0; return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB'; }
const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX = 10 * 1024 * 1024;
const norm = (s: any) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const byText = (f: (r: any) => any) => (a: any, b: any) => String(f(a) || '').localeCompare(String(f(b) || ''), 'pt-BR');
const byNum = (f: (r: any) => any) => (a: any, b: any) => (Number(f(a)) || 0) - (Number(f(b)) || 0);
const byDate = (f: (r: any) => any) => (a: any, b: any) => String(f(a) || '').localeCompare(String(f(b) || ''));

// Colunas declarativas de Seções (5 padrão + extras). Adicionar coluna = 1 entrada.
const SECTION_COLUMNS: ColumnDef[] = [
  { key: 'order', label: '#', width: '56px', num: true, defaultVisible: true, cmp: byNum((r) => r.display_order), render: (r) => ({ text: r.display_order == null ? '—' : String(r.display_order) }) },
  { key: 'name', label: 'Seção', width: 'minmax(160px,1.6fr)', defaultVisible: true, sticky: 'left', fixed: true, filter: 'text', cmp: byText((r) => r.name), accessor: (r) => r.name, render: (r) => ({ text: r.name || '—', title: r.name || undefined }) },
  { key: 'key', label: 'Chave', width: 'minmax(120px,1fr)', defaultVisible: true, filter: 'text', cmp: byText((r) => r.section_key), accessor: (r) => r.section_key, render: (r) => ({ text: r.section_key || '—', title: r.section_key || undefined }) },
  { key: 'images', label: 'Imagens', width: '90px', num: true, defaultVisible: true, cmp: byNum((r) => r.image_count), render: (r) => ({ text: String(r.image_count ?? 0) }) },
  { key: 'status', label: 'Status', width: '96px', defaultVisible: true, cmp: (a, b) => Number(b.is_active) - Number(a.is_active), render: (r) => ({ text: Number(r.is_active) === 1 ? 'Ativo' : 'Inativo', badge: Number(r.is_active) === 1 ? 'k-badge-ok' : 'k-badge-off' }) },
  // extras (do endpoint /sections)
  { key: 'type', label: 'Tipo', width: '120px', defaultVisible: false, filter: 'text', cmp: byText((r) => r.section_type), accessor: (r) => r.section_type, render: (r) => ({ text: r.section_type || '—' }) },
  { key: 'description', label: 'Descrição', width: 'minmax(140px,1.4fr)', defaultVisible: false, filter: 'text', cmp: byText((r) => r.description), accessor: (r) => r.description, render: (r) => ({ text: r.description || '—', title: r.description || undefined }) },
  { key: 'updated_at', label: 'Atualizada em', width: '132px', defaultVisible: false, filter: 'daterange', cmp: byDate((r) => r.updated_at), accessor: (r) => r.updated_at, render: (r) => ({ text: r.updated_at ? dateTimeBr(r.updated_at) : '—' }) },
];

// ── Modal "Nova Seção" ──
function NewSectionModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const [name, setName] = useState(''); const [key, setKey] = useState(''); const [description, setDescription] = useState('');
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true); setMsg('');
    try { const s = await apiSend('POST', '/sections', { name, section_key: key || undefined, description: description || undefined }); onCreated(s.id); }
    catch (e: any) { setMsg('Erro: ' + backendMsg(e)); } finally { setBusy(false); }
  }
  return (
    <div className="k-modal-overlay" onClick={onClose}>
      <div className="k-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="k-modal-title">Nova Seção</h3>
        {msg && <div className="k-msg k-msg-err">{msg}</div>}
        <div className="k-field"><label className="k-label">Nome</label><input className="k-input k-w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Apresentação da empresa" /></div>
        <div className="k-field"><label className="k-label">Chave <span className="k-muted k-sm">(vazio = gerada do nome)</span></label><input className="k-input k-w-full" value={key} onChange={(e) => setKey(e.target.value)} placeholder="ex.: apresentacao" /></div>
        <div className="k-field"><label className="k-label">Descrição</label><input className="k-input k-w-full" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" /></div>
        <div className="k-modal-actions"><button className="k-btn k-btn-ghost" onClick={onClose} disabled={busy}>Cancelar</button><button className="k-btn" onClick={create} disabled={busy || !name}>{busy ? 'Criando…' : 'Criar'}</button></div>
      </div>
    </div>
  );
}

// ── Detalhe da seção: metadados + galeria + upload (inalterado) ──
function SectionEditPanel({ id, onChanged }: { id: number; onChanged: () => void }) {
  const [sec, setSec] = useState<any>(null);
  const [name, setName] = useState(''); const [description, setDescription] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [msg, setMsg] = useState(''); const [msgErr, setMsgErr] = useState(false);
  const [uploading, setUploading] = useState(false); const [drag, setDrag] = useState(false); const [previewBump, setPreviewBump] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  async function load() {
    const s = await apiGet('/sections/' + id); setSec(s); setName(s.name || ''); setDescription(s.description || '');
    setImages(await apiGet(`/sections/${id}/images`)); setPreviewBump((b) => b + 1);
  }
  function fitFrame(el: HTMLIFrameElement | null) { if (!el) return; try { const doc = el.contentWindow?.document; if (doc && doc.body) el.style.height = doc.body.scrollHeight + 'px'; } catch { /* same-origin */ } }
  useEffect(() => { load(); }, [id]);
  function flash(m: string, err = false) { setMsg(m); setMsgErr(err); }
  async function saveMeta() { try { await apiSend('PUT', '/sections/' + id, { name, description }); await load(); onChanged(); flash('Metadados salvos.'); } catch (e: any) { flash('Erro: ' + backendMsg(e), true); } }
  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files); if (list.length === 0) return; setUploading(true); let ok = 0;
    for (const f of list) {
      if (!ACCEPT.split(',').includes(f.type)) { flash(`"${f.name}": tipo não aceito (use JPG, PNG ou WebP).`, true); continue; }
      if (f.size > MAX) { flash(`"${f.name}": maior que 10MB.`, true); continue; }
      try { const form = new FormData(); form.append('image', f); form.append('title', f.name); await apiUpload(`/sections/${id}/images`, form); ok++; }
      catch (e: any) { flash(`"${f.name}": ` + backendMsg(e), true); }
    }
    setUploading(false); if (ok > 0) { await load(); onChanged(); flash(`${ok} imagem(ns) enviada(s).`); } if (fileRef.current) fileRef.current.value = '';
  }
  async function removeImage(img: any) { if (!window.confirm('Remover esta imagem? (o arquivo é preservado no servidor)')) return; try { await apiSend('DELETE', `/sections/${id}/images/${img.id}`); await load(); onChanged(); } catch (e: any) { flash('Erro: ' + backendMsg(e), true); } }
  if (!sec) return <div className="k-center k-acc-loading">Carregando seção…</div>;
  return (
    <div className="k-sec-edit">
      {msg && <div className={'k-msg' + (msgErr ? ' k-msg-err' : '')}>{msg}</div>}
      <div className="k-card">
        <div className="k-row">
          <div className="k-field k-f-half"><label className="k-label">Nome</label><input className="k-input k-w-full" value={name} onChange={(e) => setName(e.target.value)} onBlur={saveMeta} /></div>
          <div className="k-field k-f-half"><label className="k-label">Descrição</label><input className="k-input k-w-full" value={description} onChange={(e) => setDescription(e.target.value)} onBlur={saveMeta} /></div>
        </div>
        <h3>Imagens da seção ({images.length})</h3>
        <div className={'k-dropzone' + (drag ? ' is-drag' : '')} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); uploadFiles(e.dataTransfer.files); }} onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
          {uploading ? 'Enviando…' : 'Arraste imagens aqui ou clique para escolher (JPG, PNG, WebP — até 10MB)'}
        </div>
        <div className="k-gallery">
          {images.map((img) => (
            <div className="k-gal-item" key={img.id}>
              <img className="k-gal-thumb" src={`/api/koala/sections/${id}/images/${img.id}/raw`} alt={img.title || img.file_name} loading="lazy" />
              <div className="k-gal-meta"><span className="k-sm">{img.width}×{img.height} · {fmtSize(img.file_size)}</span><button className="k-btn-x" title="Remover" onClick={() => removeImage(img)}>×</button></div>
            </div>
          ))}
          {images.length === 0 && !uploading && <p className="k-muted">Nenhuma imagem ainda.</p>}
        </div>
      </div>
      <div className="k-card">
        <div className="k-list-head"><h3 className="k-sec-preview-title">Preview da seção</h3><button className="k-btn k-btn-sm k-btn-ghost" onClick={() => setPreviewBump((b) => b + 1)}>Recarregar</button></div>
        <p className="k-muted k-sm">Fragmento renderizado pelo motor único (largura A4, altura conforme o conteúdo) com dados de exemplo.</p>
        <div className="k-sec-frame"><iframe key={previewBump} className="k-sec-iframe" title={`Preview da seção ${sec.name}`} src={`/api/koala/sections/${id}/preview?v=${previewBump}`} onLoad={(e) => fitFrame(e.currentTarget)} /></div>
      </div>
    </div>
  );
}

// ── Raiz: grid plano + drawer de edição ──
export function SectionsManager() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try { setRows(await apiGet('/sections')); setErr(''); }
    catch (e: any) { setErr(backendMsg(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function toggleActive(s: any) {
    const act = Number(s.is_active) !== 1;
    try { await apiSend('POST', `/sections/${s.id}/${act ? 'activate' : 'deactivate'}`); await load(); }
    catch (e: any) { setMsg('Erro: ' + backendMsg(e)); }
  }
  async function remove(s: any) {
    if (!window.confirm(`Excluir a seção "${s.name}"? (soft-delete)`)) return;
    try { await apiSend('DELETE', '/sections/' + s.id); await load(); }
    catch (e: any) { setMsg('Erro: ' + backendMsg(e)); }
  }

  const bulk: BulkAction[] = [
    { key: 'activate', label: 'Ativar', perId: (id) => apiSend('POST', `/sections/${id}/activate`) },
    { key: 'deactivate', label: 'Desativar', perId: (id) => apiSend('POST', `/sections/${id}/deactivate`) },
    { key: 'delete', label: 'Excluir', danger: true, confirm: (n) => `Excluir ${n} seção(ões)? (soft-delete)`, perId: (id) => apiSend('DELETE', '/sections/' + id) },
  ];

  const rowActions = (s: any) => (<>
    <button type="button" className="k-icon-btn" title="Editar (imagens/metadados)" onClick={() => setEditId(s.id)}>✎</button>
    <button type="button" className="k-icon-btn" title={Number(s.is_active) === 1 ? 'Desativar' : 'Ativar'} onClick={() => toggleActive(s)}>{Number(s.is_active) === 1 ? '⏸' : '▶'}</button>
    <button type="button" className="k-icon-btn k-danger-ink" title="Excluir" onClick={() => remove(s)}>🗑</button>
  </>);

  return (
    <div className="k-card">
      <div className="k-list-head"><h2>Seções</h2><button className="k-btn" onClick={() => setShowNew(true)}>+ Nova Seção</button></div>
      <p className="k-muted">Blocos de construção reutilizáveis dos templates (capa, apresentação, itens, condições…) e suas imagens.</p>
      {msg && <div className="k-msg k-msg-err">{msg}</div>}

      <DataGrid
        columns={SECTION_COLUMNS}
        rows={rows}
        getRowId={(s) => s.id}
        storageKey="koala.sections"
        defaultSort={[{ key: 'order', dir: 'asc' }]}
        loading={loading}
        error={err}
        onRetry={load}
        onReload={load}
        emptyText="Nenhuma seção ainda."
        search={{ placeholder: 'Buscar por nome ou chave…', highlightText: true, predicate: (s, q) => norm(s.name).includes(norm(q)) || norm(s.section_key).includes(norm(q)) }}
        csvName="secoes"
        selectable
        bulkActions={bulk}
        onRowClick={(s) => setEditId(s.id)}
        rowActions={rowActions}
      />

      {showNew && <NewSectionModal onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); load(); }} />}
      {editId != null && (
        <div className="k-drawer-overlay" onClick={() => setEditId(null)}>
          <div className="k-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="k-drawer-head"><h3>Editar seção</h3><button className="k-btn-x" title="Fechar" onClick={() => setEditId(null)}>×</button></div>
            <div className="k-drawer-body"><SectionEditPanel id={editId} onChanged={load} /></div>
          </div>
        </div>
      )}
    </div>
  );
}
