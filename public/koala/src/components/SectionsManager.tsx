import { useEffect, useRef, useState } from 'react';
import { apiGet, apiSend, apiUpload } from '../api/client';
import { SectionAccordion } from './SectionAccordion';
import { useGridSort, sortRows, DataGridHeader, type GridCol } from './dataGrid';

// Datagrid de Seções: colunas + comparadores (ascendente; direção aplicada por sortRows)
const SECTION_COLS: GridCol[] = [
  {}, { key: 'order', label: '#' }, { key: 'name', label: 'Seção' },
  { key: 'key', label: 'Chave' }, { key: 'images', label: 'Imagens' }, { key: 'status', label: 'Status' }, {},
];
const SECTION_CMP: Record<string, (a: any, b: any) => number> = {
  order: (a, b) => (a.display_order || 0) - (b.display_order || 0),
  name: (a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'),
  key: (a, b) => (a.section_key || '').localeCompare(b.section_key || '', 'pt-BR'),
  images: (a, b) => ((a.image_count || 0) - (b.image_count || 0)) || ((a.display_order || 0) - (b.display_order || 0)),
  status: (a, b) => (Number(b.is_active) - Number(a.is_active)) || ((a.display_order || 0) - (b.display_order || 0)),
};

function backendMsg(e: any): string {
  return e?.meta?.message || e?.message || 'Erro';
}
function fmtSize(n: any): string {
  const b = Number(n) || 0;
  return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
}
const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX = 10 * 1024 * 1024;

// ── Modal "Nova Seção" ──
function NewSectionModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    setMsg('');
    try {
      const s = await apiSend('POST', '/sections', {
        name,
        section_key: key || undefined,
        description: description || undefined,
      });
      onCreated(s.id);
    } catch (e: any) {
      setMsg('Erro: ' + backendMsg(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="k-modal-overlay" onClick={onClose}>
      <div className="k-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="k-modal-title">Nova Seção</h3>
        {msg && <div className="k-msg k-msg-err">{msg}</div>}
        <div className="k-field">
          <label className="k-label">Nome</label>
          <input className="k-input k-w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Apresentação da empresa" />
        </div>
        <div className="k-field">
          <label className="k-label">Chave <span className="k-muted k-sm">(vazio = gerada do nome)</span></label>
          <input className="k-input k-w-full" value={key} onChange={(e) => setKey(e.target.value)} placeholder="ex.: apresentacao" />
        </div>
        <div className="k-field">
          <label className="k-label">Descrição</label>
          <input className="k-input k-w-full" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
        </div>
        <div className="k-modal-actions">
          <button className="k-btn k-btn-ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button className="k-btn" onClick={create} disabled={busy || !name}>{busy ? 'Criando…' : 'Criar'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Detalhe da seção: metadados + galeria + upload ──
function SectionEditPanel({ id, onChanged }: { id: number; onChanged: () => void }) {
  const [sec, setSec] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [msgErr, setMsgErr] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [previewBump, setPreviewBump] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const s = await apiGet('/sections/' + id);
    setSec(s);
    setName(s.name || '');
    setDescription(s.description || '');
    setImages(await apiGet(`/sections/${id}/images`));
    setPreviewBump((b) => b + 1); // re-renderiza o preview quando a seção (re)carrega
  }

  // Auto-altura do iframe do fragmento (same-origin: podemos ler o documento).
  function fitFrame(el: HTMLIFrameElement | null) {
    if (!el) return;
    try {
      const doc = el.contentWindow?.document;
      if (doc && doc.body) el.style.height = doc.body.scrollHeight + 'px';
    } catch { /* cross-origin improvável (same-origin); ignora */ }
  }
  useEffect(() => { load(); }, [id]);

  function flash(m: string, err = false) { setMsg(m); setMsgErr(err); }

  async function saveMeta() {
    try { await apiSend('PUT', '/sections/' + id, { name, description }); await load(); onChanged(); flash('Metadados salvos.'); }
    catch (e: any) { flash('Erro: ' + backendMsg(e), true); }
  }

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    let ok = 0;
    for (const f of list) {
      if (!ACCEPT.split(',').includes(f.type)) { flash(`"${f.name}": tipo não aceito (use JPG, PNG ou WebP).`, true); continue; }
      if (f.size > MAX) { flash(`"${f.name}": maior que 10MB.`, true); continue; }
      try {
        const form = new FormData();
        form.append('image', f);
        form.append('title', f.name);
        await apiUpload(`/sections/${id}/images`, form);
        ok++;
      } catch (e: any) {
        flash(`"${f.name}": ` + backendMsg(e), true);
      }
    }
    setUploading(false);
    if (ok > 0) { await load(); onChanged(); flash(`${ok} imagem(ns) enviada(s).`); }
    if (fileRef.current) fileRef.current.value = '';
  }

  async function removeImage(img: any) {
    if (!window.confirm('Remover esta imagem? (o arquivo é preservado no servidor)')) return;
    try { await apiSend('DELETE', `/sections/${id}/images/${img.id}`); await load(); onChanged(); }
    catch (e: any) { flash('Erro: ' + backendMsg(e), true); }
  }

  if (!sec) return <div className="k-center k-acc-loading">Carregando seção…</div>;

  return (
    <div className="k-sec-edit">
      {msg && <div className={'k-msg' + (msgErr ? ' k-msg-err' : '')}>{msg}</div>}

      <div className="k-card">
        <div className="k-row">
          <div className="k-field k-f-half">
            <label className="k-label">Nome</label>
            <input className="k-input k-w-full" value={name} onChange={(e) => setName(e.target.value)} onBlur={saveMeta} />
          </div>
          <div className="k-field k-f-half">
            <label className="k-label">Descrição</label>
            <input className="k-input k-w-full" value={description} onChange={(e) => setDescription(e.target.value)} onBlur={saveMeta} />
          </div>
        </div>

        <h3>Imagens da seção ({images.length})</h3>
        <div
          className={'k-dropzone' + (drag ? ' is-drag' : '')}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); uploadFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
          {uploading ? 'Enviando…' : 'Arraste imagens aqui ou clique para escolher (JPG, PNG, WebP — até 10MB)'}
        </div>

        <div className="k-gallery">
          {images.map((img) => (
            <div className="k-gal-item" key={img.id}>
              <img className="k-gal-thumb" src={`/api/koala/sections/${id}/images/${img.id}/raw`} alt={img.title || img.file_name} loading="lazy" />
              <div className="k-gal-meta">
                <span className="k-sm">{img.width}×{img.height} · {fmtSize(img.file_size)}</span>
                <button className="k-btn-x" title="Remover" onClick={() => removeImage(img)}>×</button>
              </div>
            </div>
          ))}
          {images.length === 0 && !uploading && <p className="k-muted">Nenhuma imagem ainda.</p>}
        </div>
      </div>

      <div className="k-card">
        <div className="k-list-head">
          <h3 className="k-sec-preview-title">Preview da seção</h3>
          <button className="k-btn k-btn-sm k-btn-ghost" onClick={() => setPreviewBump((b) => b + 1)}>Recarregar</button>
        </div>
        <p className="k-muted k-sm">Fragmento renderizado pelo motor único (largura A4, altura conforme o conteúdo) com dados de exemplo.</p>
        <div className="k-sec-frame">
          <iframe
            key={previewBump}
            className="k-sec-iframe"
            title={`Preview da seção ${sec.name}`}
            src={`/api/koala/sections/${id}/preview?v=${previewBump}`}
            onLoad={(e) => fitFrame(e.currentTarget)}
          />
        </div>
      </div>
    </div>
  );
}

// ── Componente raiz: Lista ↔ Detalhe ──
export function SectionsManager() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [q, setQ] = useState('');
  const { sort, cycle } = useGridSort('koala.sections.sort', { key: 'order', dir: 'asc' });

  async function load() {
    try { setRows(await apiGet('/sections')); setMsg(''); }
    catch (e: any) { setMsg('Erro: ' + backendMsg(e)); }
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

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? rows.filter((s) => (s.name || '').toLowerCase().includes(needle) || (s.section_key || '').toLowerCase().includes(needle))
    : rows;
  // ordenação client-side (reusa o datagrid): ordena o RESULTADO filtrado
  const sorted = sortRows(filtered, sort, SECTION_CMP);

  return (
    <div className="k-card">
      <div className="k-list-head">
        <h2>Seções</h2>
        <button className="k-btn" onClick={() => setShowNew(true)}>+ Nova Seção</button>
      </div>
      <p className="k-muted">Blocos de construção reutilizáveis dos templates (capa, apresentação, itens, condições…) e suas imagens.</p>
      <div className="k-sec-toolbar">
        <input
          className="k-input k-sec-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar seção por nome ou chave…"
        />
        <span className="k-muted k-sm">{filtered.length} de {rows.length}</span>
      </div>
      {msg && <div className="k-msg k-msg-err">{msg}</div>}

      <div className="k-sec-grid">
        <DataGridHeader cols={SECTION_COLS} sort={sort} onSort={cycle} />
        <div className="k-acc-list">
          {sorted.map((s) => (
            <SectionAccordion
              key={s.id + '::' + sort.key + sort.dir}
              section={s}
              onToggleActive={() => toggleActive(s)}
              onRemove={() => remove(s)}
            >
              <SectionEditPanel id={s.id} onChanged={load} />
            </SectionAccordion>
          ))}
          {sorted.length === 0 && <p className="k-muted k-acc-empty">{rows.length === 0 ? 'Nenhuma seção ainda.' : 'Nenhuma seção corresponde à busca.'}</p>}
        </div>
      </div>

      {showNew && <NewSectionModal onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); load(); }} />}
    </div>
  );
}
