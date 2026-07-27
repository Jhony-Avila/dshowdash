// screens/Regras.tsx — regras automáticas (§16).
// @version 1.0.0  @created 2026-07-21
//
// Condições (remetente/assunto/corpo/anexo/importância/categoria) → ações
// (mover/categorizar/marcar lida/importante/excluir/parar). Ativar/desativar,
// reordenar, testar (conta matches) e "Aplicar agora" (roda na Caixa de Entrada).
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiWrite, chaves, ApiError } from '../lib/api';
import type { OutlookRule, RulesResponse, CategoriesResponse } from '../shell/types';

const PASTAS_MOVE = [
  { key: '', label: '— não mover —' },
  { key: 'archive', label: 'Arquivados' },
  { key: 'junkemail', label: 'Spam' },
  { key: 'deleteditems', label: 'Lixeira' },
];
const FOLDER_LABEL: Record<string, string> = {
  archive: 'Arquivados', junkemail: 'Spam', deleteditems: 'Lixeira', inbox: 'Caixa de Entrada',
};

function ruleVazia(): OutlookRule {
  return {
    id: 0, name: '', enabled: true, order: 0,
    conditions: { from_contains: '', subject_contains: '', body_contains: '', has_attachment: false, importance: '', category: '' },
    actions: { move_to: '', assign_category: '', mark_read: false, mark_important: false, delete: false, stop: false },
  };
}

function resumirCond(c: OutlookRule['conditions']): string {
  const p: string[] = [];
  if (c.from_contains) p.push(`remetente contém "${c.from_contains}"`);
  if (c.subject_contains) p.push(`assunto contém "${c.subject_contains}"`);
  if (c.body_contains) p.push(`corpo contém "${c.body_contains}"`);
  if (c.has_attachment) p.push('tem anexo');
  if (c.importance === 'high') p.push('importância alta');
  if (c.category) p.push(`categoria "${c.category}"`);
  return p.length ? p.join(' e ') : 'sem condições';
}
function resumirAcao(a: OutlookRule['actions']): string {
  const p: string[] = [];
  if (a.move_to) p.push(`mover p/ ${FOLDER_LABEL[a.move_to] ?? a.move_to}`);
  if (a.assign_category) p.push(`categoria "${a.assign_category}"`);
  if (a.mark_read) p.push('marcar lida');
  if (a.mark_important) p.push('marcar importante');
  if (a.delete) p.push('excluir');
  if (a.stop) p.push('parar');
  return p.length ? p.join(', ') : 'nenhuma ação';
}

export function Regras() {
  const qc = useQueryClient();
  const [editor, setEditor] = useState<{ modo: 'new' | 'edit'; rule: OutlookRule } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [testes, setTestes] = useState<Record<number, number>>({});
  const [ocupado, setOcupado] = useState(false);

  const q = useQuery<RulesResponse>({
    queryKey: chaves.rules,
    queryFn: ({ signal }) => apiGet<RulesResponse>('/rules', undefined, signal),
  });
  const catQ = useQuery<CategoriesResponse>({
    queryKey: chaves.categories,
    queryFn: ({ signal }) => apiGet<CategoriesResponse>('/categories', undefined, signal),
  });
  const categorias = (catQ.data?.categories ?? []).map((c) => c.name);

  const invalidar = () => qc.invalidateQueries({ queryKey: ['outlook', 'rules'] });
  const invalidarMsgs = () => { qc.invalidateQueries({ queryKey: ['outlook', 'messages'] }); qc.invalidateQueries({ queryKey: ['outlook', 'status'] }); };

  const acao = async (fn: () => Promise<unknown>) => {
    setOcupado(true);
    try { await fn(); } catch { /* toast futuro */ } finally { setOcupado(false); }
  };

  async function toggle(r: OutlookRule) { await acao(async () => { await apiWrite('/rules/toggle', 'POST', { id: r.id, enabled: !r.enabled }); invalidar(); }); }
  async function reordenar(r: OutlookRule, dir: 'up' | 'down') { await acao(async () => { await apiWrite('/rules/reorder', 'POST', { id: r.id, dir }); invalidar(); }); }
  async function excluir(r: OutlookRule) {
    if (!window.confirm(`Excluir a regra "${r.name}"?`)) return;
    await acao(async () => { await apiWrite('/rules/delete', 'POST', { id: r.id }); invalidar(); });
  }
  async function testar(r: OutlookRule) {
    await acao(async () => {
      const { data } = await apiWrite<{ matches: number }>('/rules/test', 'POST', { id: r.id });
      setTestes((t) => ({ ...t, [r.id]: data.matches }));
    });
  }
  async function aplicar() {
    setAviso(null);
    await acao(async () => {
      const { data } = await apiWrite<{ affected: number; actions: number; rules: number }>('/rules/apply', 'POST');
      setAviso(`${data.affected} mensagem(ns) afetada(s) por ${data.rules} regra(s) ativa(s).`);
      invalidar(); invalidarMsgs();
    });
  }

  const rules = q.data?.rules ?? [];

  return (
    <div className="ol-page">
      <header className="ol-page-head">
        <div>
          <h1 className="ol-h1">Regras</h1>
          <p className="ol-sub">Automatize a organização das mensagens recebidas.</p>
        </div>
        {q.data?.available && (
          <div className="ol-page-head-acts">
            <button className="ol-btn ol-btn-ghost" onClick={aplicar} disabled={ocupado || rules.length === 0}>▶ Aplicar agora</button>
            <button className="ol-btn ol-btn-primary" onClick={() => setEditor({ modo: 'new', rule: ruleVazia() })}>+ Nova regra</button>
          </div>
        )}
      </header>

      {aviso && <div className="ol-alert ol-alert-ok">{aviso}</div>}

      {!q.isLoading && !q.data?.available ? (
        <div className="ol-empty">
          <div className="ol-empty-icon" aria-hidden>⚙️</div>
          <h2 className="ol-empty-title">Regras em preparação</h2>
          <p className="ol-empty-desc">{q.data?.message ?? 'As regras automáticas usam o Microsoft Graph (Fase 3).'}</p>
          <span className="ol-badge-fase">Fase 3</span>
        </div>
      ) : q.isLoading ? (
        <div className="ol-skel-page"><div className="ol-spinner" /> Carregando…</div>
      ) : rules.length === 0 ? (
        <div className="ol-empty ol-empty-sm">
          <div className="ol-empty-icon" aria-hidden>📿</div>
          <p className="ol-empty-desc">Nenhuma regra ainda. Crie a primeira.</p>
        </div>
      ) : (
        <ul className="ol-regras">
          {rules.map((r, i) => (
            <li key={r.id} className={`ol-regra${r.enabled ? '' : ' is-off'}`}>
              <label className="ol-switch" title={r.enabled ? 'Ativa' : 'Inativa'}>
                <input type="checkbox" checked={r.enabled} onChange={() => toggle(r)} disabled={ocupado} />
                <span className="ol-switch-track"><span className="ol-switch-thumb" /></span>
              </label>
              <div className="ol-regra-body">
                <div className="ol-regra-nome">{r.name}</div>
                <div className="ol-regra-desc"><strong>Se</strong> {resumirCond(r.conditions)} <strong>então</strong> {resumirAcao(r.actions)}</div>
                {testes[r.id] !== undefined && <div className="ol-regra-teste">🔎 {testes[r.id]} mensagem(ns) correspondem hoje</div>}
              </div>
              <div className="ol-regra-acoes">
                <button className="ol-icon-btn" title="Subir" disabled={ocupado || i === 0} onClick={() => reordenar(r, 'up')}>▲</button>
                <button className="ol-icon-btn" title="Descer" disabled={ocupado || i === rules.length - 1} onClick={() => reordenar(r, 'down')}>▼</button>
                <button className="ol-btn ol-btn-sm ol-btn-ghost" disabled={ocupado} onClick={() => testar(r)}>Testar</button>
                <button className="ol-btn ol-btn-sm ol-btn-ghost" disabled={ocupado} onClick={() => setEditor({ modo: 'edit', rule: r })}>Editar</button>
                <button className="ol-btn ol-btn-sm ol-btn-ghost ol-btn-danger" disabled={ocupado} onClick={() => excluir(r)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editor && (
        <EditorRegra modo={editor.modo} inicial={editor.rule} categorias={categorias}
          onFechar={() => setEditor(null)}
          onSalvo={() => { setEditor(null); invalidar(); }} />
      )}
    </div>
  );
}

function EditorRegra({ modo, inicial, categorias, onFechar, onSalvo }: {
  modo: 'new' | 'edit'; inicial: OutlookRule; categorias: string[];
  onFechar: () => void; onSalvo: () => void;
}) {
  const [nome, setNome] = useState(inicial.name);
  const [cond, setCond] = useState(inicial.conditions);
  const [act, setAct] = useState(inicial.actions);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const setC = (k: keyof typeof cond, v: string | boolean) => setCond((c) => ({ ...c, [k]: v }) as typeof cond);
  const setA = (k: keyof typeof act, v: string | boolean) => setAct((a) => ({ ...a, [k]: v }) as typeof act);

  async function salvar() {
    setErro(null);
    if (nome.trim() === '') { setErro('Dê um nome à regra.'); return; }
    const temCond = cond.from_contains || cond.subject_contains || cond.body_contains || cond.has_attachment || cond.importance || cond.category;
    if (!temCond) { setErro('Defina ao menos uma condição.'); return; }
    setSalvando(true);
    try {
      const payload = { name: nome, enabled: inicial.enabled, conditions: cond, actions: act };
      if (modo === 'edit') await apiWrite('/rules/update', 'POST', { id: inicial.id, ...payload });
      else await apiWrite('/rules', 'POST', payload);
      onSalvo();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Falha ao salvar.');
      setSalvando(false);
    }
  }

  return (
    <div className="ol-composer-overlay" role="dialog" aria-modal="true">
      <div className="ol-composer ol-regra-modal">
        <div className="ol-composer-head">
          <span>{modo === 'edit' ? 'Editar regra' : 'Nova regra'}</span>
          <button className="ol-icon-btn" onClick={onFechar} aria-label="Fechar" disabled={salvando}>✕</button>
        </div>
        <div className="ol-composer-body">
          {erro && <div className="ol-alert ol-alert-danger">{erro}</div>}
          <div className="ol-field">
            <label className="ol-field-lbl">Nome</label>
            <input className="ol-inp" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Arquivar newsletters" autoFocus />
          </div>

          <div className="ol-regra-sec">Se (todas as condições)</div>
          <div className="ol-regra-grid">
            <label className="ol-rg-lbl">Remetente contém</label>
            <input className="ol-inp" value={cond.from_contains} onChange={(e) => setC('from_contains', e.target.value)} />
            <label className="ol-rg-lbl">Assunto contém</label>
            <input className="ol-inp" value={cond.subject_contains} onChange={(e) => setC('subject_contains', e.target.value)} />
            <label className="ol-rg-lbl">Corpo contém</label>
            <input className="ol-inp" value={cond.body_contains} onChange={(e) => setC('body_contains', e.target.value)} />
            <label className="ol-rg-lbl">Categoria</label>
            <select className="ol-inp" value={cond.category} onChange={(e) => setC('category', e.target.value)}>
              <option value="">—</option>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="ol-regra-checks">
            <label><input type="checkbox" checked={cond.has_attachment} onChange={(e) => setC('has_attachment', e.target.checked)} /> Tem anexo</label>
            <label><input type="checkbox" checked={cond.importance === 'high'} onChange={(e) => setC('importance', e.target.checked ? 'high' : '')} /> Importância alta</label>
          </div>

          <div className="ol-regra-sec">Então (ações)</div>
          <div className="ol-regra-grid">
            <label className="ol-rg-lbl">Mover para</label>
            <select className="ol-inp" value={act.move_to} onChange={(e) => setA('move_to', e.target.value)}>
              {PASTAS_MOVE.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
            <label className="ol-rg-lbl">Atribuir categoria</label>
            <select className="ol-inp" value={act.assign_category} onChange={(e) => setA('assign_category', e.target.value)}>
              <option value="">—</option>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="ol-regra-checks">
            <label><input type="checkbox" checked={act.mark_read} onChange={(e) => setA('mark_read', e.target.checked)} /> Marcar como lida</label>
            <label><input type="checkbox" checked={act.mark_important} onChange={(e) => setA('mark_important', e.target.checked)} /> Marcar importante</label>
            <label><input type="checkbox" checked={act.delete} onChange={(e) => setA('delete', e.target.checked)} /> Excluir</label>
            <label><input type="checkbox" checked={act.stop} onChange={(e) => setA('stop', e.target.checked)} /> Parar outras regras</label>
          </div>
        </div>
        <div className="ol-composer-foot">
          <button className="ol-btn ol-btn-primary" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
          <button className="ol-btn ol-btn-ghost" onClick={onFechar} disabled={salvando}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
