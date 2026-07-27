// screens/Categorias.tsx — categorias e cores (§15): chips, aplicação e gestão.
// @version 1.0.0  @created 2026-07-21
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiWrite, ApiError } from '../lib/api';
import type { OutlookCategory } from '../shell/types';

const PALETA = ['#16a34a', '#dc2626', '#2563eb', '#7c3aed', '#d97706', '#0891b2', '#db2777', '#65a30d', '#475569'];

/** Chips coloridos de categorias (lista/leitura). */
export function ChipsCategorias({ nomes, colorMap }: { nomes: string[]; colorMap: Record<string, string> }) {
  if (!nomes || nomes.length === 0) return null;
  return (
    <span className="ol-cat-chips">
      {nomes.map((n) => {
        const cor = colorMap[n] ?? '#64748b';
        return (
          <span key={n} className="ol-cat-chip" style={{ color: cor, background: `color-mix(in srgb, ${cor} 16%, transparent)`, borderColor: `color-mix(in srgb, ${cor} 40%, transparent)` }}>
            {n}
          </span>
        );
      })}
    </span>
  );
}

/** Menu para aplicar/remover categorias da mensagem aberta. */
export function MenuCategorias({ atuais, categorias, onAplicar, onFechar }: {
  atuais: string[]; categorias: OutlookCategory[];
  onAplicar: (cats: string[]) => void; onFechar: () => void;
}) {
  const [sel, setSel] = useState<Set<string>>(new Set(atuais));
  const toggle = (n: string) => setSel((prev) => {
    const s = new Set(prev);
    if (s.has(n)) s.delete(n); else s.add(n);
    onAplicar(Array.from(s));
    return s;
  });
  return (
    <div className="ol-catmenu">
      <div className="ol-catmenu-head">Categorias <button className="ol-icon-btn" onClick={onFechar} aria-label="Fechar">✕</button></div>
      {categorias.length === 0 ? (
        <div className="ol-picker-empty">Nenhuma categoria.</div>
      ) : (
        <ul className="ol-catmenu-list">
          {categorias.map((c) => (
            <li key={c.name}>
              <label className="ol-catmenu-item">
                <input type="checkbox" checked={sel.has(c.name)} onChange={() => toggle(c.name)} />
                <span className="ol-cat-dot" style={{ background: c.color }} />
                {c.name}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Modal de gestão de categorias (criar/renomear/cor/excluir). */
export function GerenciarCategorias({ categorias, disponivel, onFechar }: {
  categorias: OutlookCategory[]; disponivel: boolean; onFechar: () => void;
}) {
  const qc = useQueryClient();
  const [novoNome, setNovoNome] = useState('');
  const [novaCor, setNovaCor] = useState(PALETA[0]);
  const [erro, setErro] = useState<string | null>(null);
  const [editNome, setEditNome] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState('');

  const invalidar = () => { qc.invalidateQueries({ queryKey: ['outlook', 'categories'] }); qc.invalidateQueries({ queryKey: ['outlook', 'messages'] }); };
  const acao = async (fn: () => Promise<unknown>) => {
    setErro(null);
    try { await fn(); invalidar(); } catch (e) { setErro(e instanceof ApiError ? e.message : 'Falha na operação.'); }
  };

  return (
    <div className="ol-composer-overlay" role="dialog" aria-modal="true">
      <div className="ol-composer ol-catmodal">
        <div className="ol-composer-head">
          <span>Gerenciar categorias</span>
          <button className="ol-icon-btn" onClick={onFechar} aria-label="Fechar">✕</button>
        </div>
        <div className="ol-composer-body">
          {erro && <div className="ol-alert ol-alert-danger">{erro}</div>}
          {!disponivel ? (
            <div className="ol-empty ol-empty-sm">
              <div className="ol-empty-icon" aria-hidden>🏷️</div>
              <p className="ol-empty-desc">A gestão de categorias usa o Microsoft Graph (Fase 3).</p>
              <span className="ol-badge-fase">Fase 3</span>
            </div>
          ) : (<>
            <ul className="ol-catadmin">
              {categorias.map((c) => (
                <li key={c.name} className="ol-catadmin-item">
                  <span className="ol-cat-dot" style={{ background: c.color }} />
                  {editNome === c.name ? (
                    <>
                      <input className="ol-inp ol-catadmin-inp" value={rascunho} onChange={(e) => setRascunho(e.target.value)} autoFocus />
                      <button className="ol-btn ol-btn-sm ol-btn-primary" onClick={() => acao(async () => { await apiWrite('/categories/rename', 'POST', { name: c.name, new_name: rascunho }); setEditNome(null); })}>OK</button>
                      <button className="ol-btn ol-btn-sm ol-btn-ghost" onClick={() => setEditNome(null)}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <span className="ol-catadmin-nome">{c.name}</span>
                      <div className="ol-catadmin-paleta">
                        {PALETA.map((p) => (
                          <button key={p} className={`ol-swatch${c.color === p ? ' is-on' : ''}`} style={{ background: p }}
                            title="Alterar cor" onClick={() => acao(() => apiWrite('/categories/color', 'POST', { name: c.name, color: p }))} />
                        ))}
                      </div>
                      <button className="ol-btn ol-btn-sm ol-btn-ghost" onClick={() => { setEditNome(c.name); setRascunho(c.name); }}>Renomear</button>
                      <button className="ol-btn ol-btn-sm ol-btn-ghost ol-btn-danger" onClick={() => { if (window.confirm(`Excluir a categoria "${c.name}"? Ela será removida das mensagens.`)) acao(() => apiWrite('/categories/delete', 'POST', { name: c.name })); }}>Excluir</button>
                    </>
                  )}
                </li>
              ))}
            </ul>

            <div className="ol-catadmin-novo">
              <span className="ol-cat-dot" style={{ background: novaCor }} />
              <input className="ol-inp ol-catadmin-inp" placeholder="Nova categoria…" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
              <div className="ol-catadmin-paleta">
                {PALETA.map((p) => <button key={p} className={`ol-swatch${novaCor === p ? ' is-on' : ''}`} style={{ background: p }} onClick={() => setNovaCor(p)} />)}
              </div>
              <button className="ol-btn ol-btn-sm ol-btn-primary" disabled={novoNome.trim() === ''}
                onClick={() => acao(async () => { await apiWrite('/categories', 'POST', { name: novoNome, color: novaCor }); setNovoNome(''); })}>Adicionar</button>
            </div>
          </>)}
        </div>
        <div className="ol-composer-foot">
          <button className="ol-btn ol-btn-ghost" onClick={onFechar}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
