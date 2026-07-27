// screens/Modelos.tsx — biblioteca de modelos de e-mail (§22).
// @version 1.0.0  @created 2026-07-21
//
// CRUD (criar/editar/duplicar/excluir/favoritar), busca e filtro por categoria,
// campos dinâmicos (§22.3). "Usar" abre o compositor pré-preenchido (via App).
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiWrite, chaves, ApiError } from '../lib/api';
import type { EmailTemplate, TemplatesResponse } from '../shell/types';

const CAMPOS = [
  '{{nome_cliente}}', '{{nome_contato}}', '{{nome_usuario}}', '{{email_usuario}}',
  '{{nome_vendedor}}', '{{numero_proposta}}', '{{valor_proposta}}', '{{data_atual}}',
  '{{empresa}}', '{{telefone}}',
];

export function Modelos({ onUsar }: { onUsar: (t: EmailTemplate) => void }) {
  const qc = useQueryClient();
  const [busca, setBusca] = useState('');
  const [cat, setCat] = useState('all');
  const [editor, setEditor] = useState<{ modo: 'new' | 'edit'; tpl?: EmailTemplate } | null>(null);

  const q = useQuery<TemplatesResponse>({
    queryKey: chaves.templates(busca, cat),
    queryFn: ({ signal }) => apiGet<TemplatesResponse>('/templates',
      { q: busca || undefined, category: cat !== 'all' ? cat : undefined }, signal),
  });

  const invalidar = () => qc.invalidateQueries({ queryKey: ['outlook', 'templates'] });

  async function favoritar(t: EmailTemplate) {
    try { await apiWrite('/templates/favorite', 'POST', { id: t.id, favorite: !t.is_favorite }); invalidar(); } catch { /* */ }
  }
  async function duplicar(t: EmailTemplate) {
    try { await apiWrite('/templates/duplicate', 'POST', { id: t.id }); invalidar(); } catch { /* */ }
  }
  async function excluir(t: EmailTemplate) {
    if (!window.confirm(`Excluir o modelo "${t.name}"?`)) return;
    try { await apiWrite('/templates/delete', 'POST', { id: t.id }); invalidar(); } catch { /* */ }
  }

  const categorias = q.data?.categories ?? [];
  const modelos = q.data?.templates ?? [];

  return (
    <div className="ol-page">
      <header className="ol-page-head">
        <div>
          <h1 className="ol-h1">Modelos</h1>
          <p className="ol-sub">Modelos de e-mail com campos dinâmicos. Use-os ao compor uma mensagem.</p>
        </div>
        {q.data?.available && (
          <button className="ol-btn ol-btn-primary" onClick={() => setEditor({ modo: 'new' })}>+ Novo modelo</button>
        )}
      </header>

      {!q.isLoading && !q.data?.available ? (
        <div className="ol-empty">
          <div className="ol-empty-icon" aria-hidden>📝</div>
          <h2 className="ol-empty-title">Modelos em preparação</h2>
          <p className="ol-empty-desc">{q.data?.message ?? 'Os modelos usam o banco local, provisionado na Fase 2.'}</p>
          <span className="ol-badge-fase">Fase 2</span>
        </div>
      ) : (
        <>
          <div className="ol-mod-filtros">
            <div className="ol-busca">
              <span className="ol-busca-ic" aria-hidden>🔍</span>
              <input className="ol-busca-inp" placeholder="Buscar modelos…" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <div className="ol-chips">
              <button className={`ol-chip${cat === 'all' ? ' is-on' : ''}`} onClick={() => setCat('all')}>Todas</button>
              {categorias.map((c) => (
                <button key={c} className={`ol-chip${cat === c ? ' is-on' : ''}`} onClick={() => setCat(c)}>{c}</button>
              ))}
            </div>
          </div>

          {q.isLoading ? (
            <div className="ol-skel-page"><div className="ol-spinner" /> Carregando…</div>
          ) : modelos.length === 0 ? (
            <div className="ol-empty ol-empty-sm">
              <div className="ol-empty-icon" aria-hidden>🔎</div>
              <p className="ol-empty-desc">Nenhum modelo encontrado.</p>
            </div>
          ) : (
            <div className="ol-mod-grid">
              {modelos.map((t) => (
                <div key={t.id} className="ol-mod-card">
                  <div className="ol-mod-card-top">
                    <span className="ol-mod-cat">{t.category}</span>
                    <button className={`ol-star${t.is_favorite ? ' is-on' : ''}`} title="Favoritar" onClick={() => favoritar(t)}>
                      {t.is_favorite ? '★' : '☆'}
                    </button>
                  </div>
                  <h3 className="ol-mod-nome">{t.name}</h3>
                  <div className="ol-mod-assunto">{t.subject || '(sem assunto)'}</div>
                  <div className="ol-mod-prev">{stripHtml(t.body_html).slice(0, 110)}…</div>
                  <div className="ol-mod-acoes">
                    <button className="ol-btn ol-btn-primary ol-btn-sm" onClick={() => onUsar(t)}>Usar</button>
                    <button className="ol-btn ol-btn-ghost ol-btn-sm" onClick={() => setEditor({ modo: 'edit', tpl: t })}>Editar</button>
                    <button className="ol-btn ol-btn-ghost ol-btn-sm" onClick={() => duplicar(t)}>Duplicar</button>
                    <button className="ol-btn ol-btn-ghost ol-btn-sm ol-btn-danger" onClick={() => excluir(t)}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {editor && (
        <EditorModelo modo={editor.modo} tpl={editor.tpl} categorias={categorias}
          onFechar={() => setEditor(null)}
          onSalvo={() => { setEditor(null); invalidar(); }} />
      )}
    </div>
  );
}

function EditorModelo({ modo, tpl, categorias, onFechar, onSalvo }: {
  modo: 'new' | 'edit'; tpl?: EmailTemplate; categorias: string[];
  onFechar: () => void; onSalvo: () => void;
}) {
  const [nome, setNome] = useState(tpl?.name ?? '');
  const [categoria, setCategoria] = useState(tpl?.category ?? (categorias[0] ?? 'Geral'));
  const [assunto, setAssunto] = useState(tpl?.subject ?? '');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const corpoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (corpoRef.current) corpoRef.current.innerHTML = tpl?.body_html ?? '';
  }, [tpl]);

  function inserirCampo(campo: string) {
    const el = corpoRef.current;
    if (!el) return;
    el.focus();
    if (!document.execCommand('insertText', false, campo)) {
      el.innerHTML += campo;
    }
  }

  async function salvar() {
    setErro(null);
    if (nome.trim() === '') { setErro('Dê um nome ao modelo.'); return; }
    const body_html = corpoRef.current?.innerHTML ?? '';
    setSalvando(true);
    try {
      if (modo === 'edit' && tpl) {
        await apiWrite('/templates/update', 'POST', { id: tpl.id, name: nome, category: categoria, subject: assunto, body_html });
      } else {
        await apiWrite('/templates', 'POST', { name: nome, category: categoria, subject: assunto, body_html });
      }
      onSalvo();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Falha ao salvar.');
      setSalvando(false);
    }
  }

  return (
    <div className="ol-composer-overlay" role="dialog" aria-modal="true">
      <div className="ol-composer ol-editor-modelo">
        <div className="ol-composer-head">
          <span>{modo === 'edit' ? 'Editar modelo' : 'Novo modelo'}</span>
          <button className="ol-icon-btn" onClick={onFechar} aria-label="Fechar" disabled={salvando}>✕</button>
        </div>
        <div className="ol-composer-body">
          {erro && <div className="ol-alert ol-alert-danger">{erro}</div>}
          <div className="ol-field">
            <label className="ol-field-lbl">Nome</label>
            <input className="ol-inp" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Envio de proposta" autoFocus />
          </div>
          <div className="ol-field">
            <label className="ol-field-lbl">Categoria</label>
            <select className="ol-inp" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="ol-field">
            <label className="ol-field-lbl">Assunto</label>
            <input className="ol-inp" value={assunto} onChange={(e) => setAssunto(e.target.value)} />
          </div>
          <div className="ol-campos">
            <span className="ol-campos-lbl">Campos dinâmicos:</span>
            {CAMPOS.map((c) => <button key={c} className="ol-campo-chip" onClick={() => inserirCampo(c)}>{c}</button>)}
          </div>
          <div ref={corpoRef} className="ol-composer-editor" contentEditable suppressContentEditableWarning data-placeholder="Conteúdo do modelo…" />
        </div>
        <div className="ol-composer-foot">
          <button className="ol-btn ol-btn-primary" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
          <button className="ol-btn ol-btn-ghost" onClick={onFechar} disabled={salvando}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function stripHtml(html: string): string {
  const d = document.createElement('div');
  d.innerHTML = html;
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
}
