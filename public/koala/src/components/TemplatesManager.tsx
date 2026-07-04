import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '../api/client';
import { dateTimeBr } from '../format';

// ── Helpers de apresentação ──
const STATUS: any = {
  published: { label: 'Ativo', cls: 'k-badge-ok' },
  inactive: { label: 'Inativo', cls: 'k-badge-off' },
  draft: { label: 'Rascunho', cls: 'k-badge-draft' },
};
// F7: data padronizada dd/mm/aaaa hh:mm (antes era ISO fatiado).
const fmtDate = dateTimeBr;
function backendMsg(e: any): string {
  return e?.meta?.message || e?.message || 'Erro';
}

// ── Resumo AMIGÁVEL da estrutura (readonly, derivado do structure_json — sem JSON à vista) ──
const PAGE_LABELS: any = { cover: 'Capa', items: 'Itens', financial_summary: 'Financeiro', presentation: 'Apresentação', terms: 'Condições', closing: 'Encerramento' };
const SECTION_LABELS: any = { cover: 'Capa', financial_summary: 'Resumo financeiro', presentation: 'Apresentação', terms: 'Condições', items: 'Itens' };
const COMP_LABELS: any = { title: 'Título', text: 'Texto', price_table: 'Tabela de preços', image: 'Imagem', spacer: 'Espaço' };
function friendlyStructure(struct: any): any[] {
  const pages = struct?.pages || [];
  return pages.map((pg: any, pi: number) => ({
    label: PAGE_LABELS[pg.key] || pg.key || `Página ${pi + 1}`,
    sections: (pg.sections || []).map((s: any) => ({
      label: SECTION_LABELS[s.section_type] || SECTION_LABELS[s.section_key] || s.section_key || s.section_type || 'Seção',
      components: (s.components || []).map((c: any) => COMP_LABELS[c.component_type] || c.component_key || c.component_type),
    })),
  }));
}

// ── Modal "Novo Template" ──
function NewModal({ actives, onClose, onCreated }: { actives: any[]; onClose: () => void; onCreated: (id: number) => void }) {
  const [mode, setMode] = useState<'scratch' | 'duplicate'>('duplicate');
  const [sourceId, setSourceId] = useState<number | ''>(actives[0]?.id ?? '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    setMsg('');
    try {
      const body: any = { mode, name: name || undefined, description: description || undefined };
      if (mode === 'duplicate') {
        if (!sourceId) { setMsg('Escolha um template para duplicar.'); setBusy(false); return; }
        body.source_id = sourceId;
      }
      const t = await apiSend('POST', '/templates', body);
      onCreated(t.id);
    } catch (e: any) {
      setMsg('Erro: ' + backendMsg(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="k-modal-overlay" onClick={onClose}>
      <div className="k-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="k-modal-title">Novo Template</h3>
        {msg && <div className="k-msg k-msg-err">{msg}</div>}
        <div className="k-radio-row">
          <label className={'k-radio' + (mode === 'duplicate' ? ' is-on' : '')}>
            <input type="radio" checked={mode === 'duplicate'} onChange={() => setMode('duplicate')} />
            Duplicar existente
          </label>
          <label className={'k-radio' + (mode === 'scratch' ? ' is-on' : '')}>
            <input type="radio" checked={mode === 'scratch'} onChange={() => setMode('scratch')} />
            Começar do zero
          </label>
        </div>
        {mode === 'duplicate' && (
          <div className="k-field">
            <label className="k-label">Template de origem (ativos)</label>
            <select className="k-input k-w-full" value={sourceId} onChange={(e) => setSourceId(Number(e.target.value))}>
              {actives.length === 0 && <option value="">Nenhum template ativo</option>}
              {actives.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
        <div className="k-field">
          <label className="k-label">Nome {mode === 'duplicate' && <span className="k-muted k-sm">(vazio = "Cópia de …")</span>}</label>
          <input className="k-input k-w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do template" />
        </div>
        <div className="k-field">
          <label className="k-label">Descrição</label>
          <input className="k-input k-w-full" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
        </div>
        <div className="k-modal-actions">
          <button className="k-btn k-btn-ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button className="k-btn" onClick={create} disabled={busy || (mode === 'scratch' && !name)}>
            {busy ? 'Criando…' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Editor de Template (simplificado: metadados + resumo amigável; sem JSON, sem preview) ──
function TemplateEditor({ id, onBack, onSaved }: { id: number; onBack: () => void; onSaved: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [msg, setMsg] = useState('');
  const [msgErr, setMsgErr] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  async function load() {
    const d = await apiGet('/templates/' + id);
    setDetail(d);
    setName(d.name || '');
    setDescription(d.description || '');
  }
  useEffect(() => { load(); }, [id]);

  function flash(m: string, err = false) { setMsg(m); setMsgErr(err); }

  async function saveMeta() {
    try { await apiSend('PUT', '/templates/' + id, { name, description }); await load(); onSaved(); flash('Metadados salvos.'); }
    catch (e: any) { flash('Erro: ' + backendMsg(e), true); }
  }
  async function publish() {
    const vnum = detail?.draft_version?.version_number ?? '?';
    if (!detail?.draft_version) { flash('Nada a publicar: não há rascunho pendente.', true); return; }
    if (!window.confirm(`Publicar congela o rascunho como v${vnum}. Confirmar?`)) return;
    try { await apiSend('POST', '/templates/' + id + '/publish'); await load(); onSaved(); flash(`Publicado como v${vnum}.`); }
    catch (e: any) { flash('Erro ao publicar: ' + backendMsg(e), true); }
  }

  if (!detail) return <div className="k-center">Carregando template…</div>;

  // A estrutura mostrada é a do rascunho pendente (o que será publicado) ou a publicada corrente.
  const struct = detail.draft_version?.structure_json ?? detail.current_version?.structure_json ?? {};
  const pages = friendlyStructure(struct);

  return (
    <div>
      <div className="k-editor-top">
        <button className="k-btn k-btn-ghost" onClick={onBack}>← Templates</button>
        <div className="k-editor-title">
          {detail.name}
          {detail.current_version && <span className="k-badge">v{detail.current_version.version_number} publicada</span>}
          {detail.draft_version && <span className="k-badge k-badge-draft">rascunho v{detail.draft_version.version_number}</span>}
        </div>
        <button className="k-btn k-btn-ghost k-btn-sm" onClick={() => setShowHistory((s) => !s)}>Histórico de versões</button>
      </div>

      {msg && <div className={'k-msg' + (msgErr ? ' k-msg-err' : '')}>{msg}</div>}

      <div className="k-actionbar">
        <button className="k-btn" onClick={saveMeta}>Salvar</button>
        <button className="k-btn k-btn-pub" onClick={publish} disabled={!detail.draft_version}>Publicar versão</button>
        <span className="k-spacer" />
        <button className="k-btn k-btn-soon" disabled title="Em breve — edição visual drag & drop">Builder Visual</button>
      </div>

      {showHistory && (
        <div className="k-card k-history">
          <h3>Histórico de versões</h3>
          <table className="k-table">
            <thead><tr><th>Versão</th><th>Status</th><th>Autor</th><th>Data</th></tr></thead>
            <tbody>
              {(detail.versions || []).map((v: any) => (
                <tr key={v.id}>
                  <td>v{v.version_number}</td>
                  <td><span className={'k-badge ' + (v.status === 'published' ? 'k-badge-ok' : 'k-badge-draft')}>{v.status === 'published' ? 'Publicada' : 'Rascunho'}</span></td>
                  <td>{v.author_name || '—'}</td>
                  <td>{fmtDate(v.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="k-muted k-sm">Somente leitura no MVP. Restauração de versão chega numa fase futura.</p>
        </div>
      )}

      <div className="k-card">
        <div className="k-field">
          <label className="k-label">Nome do template</label>
          <input className="k-input k-w-full" value={name} onChange={(e) => setName(e.target.value)} onBlur={saveMeta} />
        </div>
        <div className="k-field">
          <label className="k-label">Descrição</label>
          <input className="k-input k-w-full" value={description} onChange={(e) => setDescription(e.target.value)} onBlur={saveMeta} />
        </div>

        <h3>Estrutura do template</h3>
        <p className="k-muted k-sm">Composição das páginas e seções (somente leitura). A edição visual chega no Builder.</p>
        <div className="k-struct-list">
          {pages.map((pg: any, i: number) => (
            <div className="k-struct-page" key={i}>
              <div className="k-struct-page-title">📄 Página {pg.label}</div>
              {pg.sections.map((s: any, si: number) => (
                <div className="k-struct-sec" key={si}>
                  <span className="k-struct-sec-name">{s.label}</span>
                  <span className="k-struct-comps">
                    {s.components.map((c: string, ci: number) => <span className="k-chip" key={ci}>{c}</span>)}
                  </span>
                </div>
              ))}
            </div>
          ))}
          {pages.length === 0 && <p className="k-muted">Estrutura vazia.</p>}
        </div>
      </div>
    </div>
  );
}

// ── Componente raiz: Lista ↔ Editor ──
export function TemplatesManager() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    try { setRows(await apiGet('/templates')); setMsg(''); }
    catch (e: any) { setMsg('Erro: ' + backendMsg(e)); }
  }
  useEffect(() => { load(); }, []);

  async function duplicate(id: number) {
    try { const t = await apiSend('POST', '/templates', { mode: 'duplicate', source_id: id }); setEditingId(t.id); }
    catch (e: any) { setMsg('Erro: ' + backendMsg(e)); }
  }
  async function toggleActive(t: any) {
    const act = t.status !== 'published';
    try { await apiSend('POST', `/templates/${t.id}/${act ? 'activate' : 'deactivate'}`); await load(); }
    catch (e: any) { setMsg('Erro: ' + backendMsg(e)); }
  }
  async function remove(t: any) {
    if (!window.confirm(`Excluir o template "${t.name}"? (soft-delete)`)) return;
    try { await apiSend('DELETE', '/templates/' + t.id); await load(); }
    catch (e: any) { setMsg('Erro: ' + backendMsg(e)); }
  }

  if (editingId !== null) {
    return <TemplateEditor id={editingId} onBack={() => { setEditingId(null); load(); }} onSaved={load} />;
  }

  const actives = rows.filter((r) => r.status === 'published');

  return (
    <div className="k-card">
      <div className="k-list-head">
        <h2>Templates</h2>
        <button className="k-btn" onClick={() => setShowNew(true)}>+ Novo Template</button>
      </div>
      <p className="k-muted">Gerencie os modelos de proposta (layout A4). O preview do documento fica na aba Preview.</p>
      {msg && <div className="k-msg k-msg-err">{msg}</div>}

      <div className="k-tpl-grid">
        {rows.map((t) => {
          const st = STATUS[t.status] || { label: t.status, cls: 'k-badge-off' };
          return (
            <div className="k-tpl-card" key={t.id}>
              <div className="k-tpl-thumb">📄</div>
              <div className="k-tpl-body">
                <div className="k-tpl-name">
                  {t.name}
                  {Number(t.is_default) === 1 && <span className="k-badge k-badge-def">padrão</span>}
                </div>
                <div className="k-tpl-meta">
                  <span className={'k-badge ' + st.cls}>{st.label}</span>
                  <span className="k-muted k-sm">
                    {t.published_version ? `v${t.published_version} publicada` : 'sem versão'}
                    {Number(t.has_draft) > 0 && ' · rascunho pendente'}
                  </span>
                </div>
                {t.description && <div className="k-muted k-sm k-tpl-desc">{t.description}</div>}
                <div className="k-muted k-sm">Atualizado: {fmtDate(t.updated_at)}</div>
                <div className="k-tpl-actions">
                  <button className="k-btn k-btn-sm" onClick={() => setEditingId(t.id)}>Editar</button>
                  <button className="k-btn k-btn-sm k-btn-outline" onClick={() => duplicate(t.id)}>Duplicar</button>
                  <button className="k-btn k-btn-sm k-btn-ghost" onClick={() => toggleActive(t)}>
                    {t.status === 'published' ? 'Desativar' : 'Ativar'}
                  </button>
                  <button className="k-btn k-btn-sm k-btn-danger" onClick={() => remove(t)}>Excluir</button>
                </div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p className="k-muted">Nenhum template ainda.</p>}
      </div>

      {showNew && (
        <NewModal
          actives={actives}
          onClose={() => setShowNew(false)}
          onCreated={(id) => { setShowNew(false); setEditingId(id); }}
        />
      )}
    </div>
  );
}
