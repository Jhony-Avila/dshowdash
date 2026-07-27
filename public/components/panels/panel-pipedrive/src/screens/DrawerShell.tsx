// screens/DrawerShell.tsx — casca reutilizavel do painel lateral (overlay + fechar + Esc).
// @version 2.0.0  @created 2026-07-21  (v1.1.0: AbrirNoPipedrive + LinhaLink)
// v2.0.0 (Elevacao visual — Fase 3): ABAS opcionais (Resumo/Dados/Relacionamentos/Atividades/
//        Notas/Campos personalizados) com navegacao por teclado e memoria da ultima aba.
//        Sem `abas`, o drawer segue exatamente como antes (children direto).
import { useEffect, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useCompanyDomain, pipedriveUrl, type PipeKind } from '../lib/pipedrive-url';

export interface DrawerAba {
  id: string;
  label: string;
  Icon?: LucideIcon;
  contagem?: number;         // vira um chip ao lado do rotulo
  conteudo: ReactNode;
}

export function DrawerShell({ title, subtitle, onClose, abas, lembrarComo, children }: {
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  abas?: DrawerAba[];
  lembrarComo?: string;      // chave p/ lembrar a ultima aba (ex.: 'deal')
  children?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const chave = lembrarComo ? `pp:aba:${lembrarComo}` : null;
  const [ativa, setAtiva] = useState<string>(() => {
    if (chave) { try { const s = localStorage.getItem(chave); if (s) return s; } catch { /* ignora */ } }
    return abas?.[0]?.id ?? '';
  });
  useEffect(() => { if (chave && ativa) { try { localStorage.setItem(chave, ativa); } catch { /* ignora */ } } }, [chave, ativa]);

  // A aba lembrada pode nao existir neste drawer (ex.: produto nao tem "Notas").
  const aba = abas?.find((a) => a.id === ativa) ?? abas?.[0];

  function porTeclado(e: React.KeyboardEvent) {
    if (!abas || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    e.preventDefault();
    const i = abas.findIndex((a) => a.id === aba?.id);
    const j = (i + (e.key === 'ArrowRight' ? 1 : abas.length - 1)) % abas.length;
    setAtiva(abas[j].id);
  }

  return (
    <div className="pp-drawer-overlay" onClick={onClose}>
      <div className="pp-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="pp-drawer-top">
          <div style={{ minWidth: 0 }}>
            <h2>{title}</h2>
            {subtitle}
          </div>
          <button className="pp-drawer-x" onClick={onClose} title="Fechar (Esc)">✕</button>
        </div>

        {abas && abas.length > 0 ? (
          <>
            <div className="pp-abas" role="tablist" aria-label="Seções do detalhe" onKeyDown={porTeclado}>
              {abas.map((a) => (
                <button key={a.id} role="tab" id={`pp-aba-${a.id}`} aria-controls={`pp-painel-${a.id}`}
                  aria-selected={aba?.id === a.id} tabIndex={aba?.id === a.id ? 0 : -1}
                  className={`pp-aba${aba?.id === a.id ? ' is-on' : ''}`} onClick={() => setAtiva(a.id)}>
                  {a.Icon && <a.Icon size={14} />}{a.label}
                  {a.contagem != null && <span className="pp-aba-n">{a.contagem}</span>}
                </button>
              ))}
            </div>
            <div role="tabpanel" id={`pp-painel-${aba?.id}`} aria-labelledby={`pp-aba-${aba?.id}`} className="pp-aba-painel">
              {aba?.conteudo}
            </div>
          </>
        ) : children}
      </div>
    </div>
  );
}

/** Botao "Abrir no Pipedrive" (#22) — so aparece quando ha dominio + deep-link do tipo. */
export function AbrirNoPipedrive({ kind, id, label = 'Abrir no Pipedrive' }: { kind: PipeKind; id: string | number | null | undefined; label?: string }) {
  const domain = useCompanyDomain();
  const url = pipedriveUrl(kind, id, domain);
  if (!url) return null;
  return (
    <div className="pp-actions" style={{ marginTop: 16 }}>
      <a className="pp-btn" href={url} target="_blank" rel="noopener noreferrer">{label} ↗</a>
    </div>
  );
}

/** Linha de vinculo clicavel (abre outro drawer). */
export function LinhaLink({ k, texto, onClick }: { k: string; texto: string; onClick: () => void }) {
  return (
    <div className="pp-row pp-clik" onClick={onClick} style={{ cursor: 'pointer' }}>
      <span className="pp-k">{k}</span>
      <span className="pp-v" style={{ color: 'var(--pp-primary)' }}>{texto} →</span>
    </div>
  );
}

/** Secao "Campos personalizados" (nomes/rotulos reais) reutilizavel nos drawers. */
export function CamposPersonalizados({ campos, comTitulo = true }: { campos: { name: string; value: string }[]; comTitulo?: boolean }) {
  if (!campos || campos.length === 0) {
    return comTitulo ? null : <p className="pp-placeholder">Nenhum campo personalizado preenchido.</p>;
  }
  return (
    <>
      {comTitulo && <h4>Campos personalizados</h4>}
      {campos.map((cf, i) => (
        <div className="pp-row" key={i}>
          <span className="pp-k" title={cf.name}>{cf.name}</span>
          <span className="pp-v" style={{ maxWidth: 320, textAlign: 'right', whiteSpace: 'normal' }}>{cf.value}</span>
        </div>
      ))}
    </>
  );
}

/** Linha simples chave/valor — usada pelas abas dos drawers. */
export function Linha({ k, v }: { k: string; v: ReactNode }) {
  return <div className="pp-row"><span className="pp-k">{k}</span><span className="pp-v">{v}</span></div>;
}

/** Lista de notas (aba "Notas" dos drawers). */
export function ListaNotas({ notas, fmtData }: {
  notas: { content: string | null; add_time: string | null; author: string | null }[];
  fmtData: (v?: string | null) => string;
}) {
  if (!notas || notas.length === 0) return <p className="pp-placeholder">Nenhuma nota registrada.</p>;
  return (
    <div className="pp-tl">
      {notas.map((n, i) => (
        <div className="pp-tl-item" key={i}>
          <span className="pp-tl-ic">📝</span>
          <div className="pp-tl-body">
            <div className="pp-tl-title" style={{ whiteSpace: 'pre-wrap' }}>
              {n.content && n.content.trim() !== '' ? n.content : '(nota sem texto)'}
            </div>
            <div className="pp-tl-meta">{fmtData(n.add_time)}{n.author ? ` · ${n.author}` : ''}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Lista de atividades (aba "Atividades" dos drawers). */
export function ListaAtividades({ atividades, rotuloTipo, fmtData }: {
  atividades: { subject: string | null; type: string | null; done: number; due_date: string | null }[];
  rotuloTipo: (t?: string | null) => string;
  fmtData: (v?: string | null) => string;
}) {
  if (!atividades || atividades.length === 0) return <p className="pp-placeholder">Nenhuma atividade vinculada.</p>;
  return (
    <div className="pp-tl">
      {atividades.map((a, i) => (
        <div className="pp-tl-item" key={i}>
          <span className="pp-tl-ic">{a.done ? '✅' : '📌'}</span>
          <div className="pp-tl-body">
            <div className="pp-tl-title">{a.subject && a.subject.trim() !== '' ? a.subject : '(sem assunto)'}</div>
            <div className="pp-tl-meta">
              {rotuloTipo(a.type)}{a.due_date ? ` · ${fmtData(a.due_date).slice(0, 10)}` : ''} · {a.done ? 'Concluída' : 'Pendente'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Lista de mini-negocios reutilizavel dentro de drawers (pessoa/org). */
export function MiniDeals({ deals, fmtBRL, onOpenDeal }: {
  deals: { id: number; title: string | null; value: number | null; currency: string | null; status: string | null; stage: string | null }[];
  fmtBRL: (v?: number | null, c?: string) => string;
  onOpenDeal?: (id: number) => void;
}) {
  const cor = (s?: string | null) => (s === 'won' ? 'var(--pp-ok)' : (s === 'lost' ? 'var(--pp-danger)' : 'var(--pp-sync)'));
  if (deals.length === 0) return <p className="pp-placeholder">Nenhum negócio.</p>;
  return (
    <div>
      {deals.map((d) => (
        <div className="pp-row" key={d.id} style={onOpenDeal ? { cursor: 'pointer' } : undefined} onClick={onOpenDeal ? () => onOpenDeal(d.id) : undefined}>
          <span className="pp-k" title={d.title ?? ''} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span className="pp-dot" style={{ background: cor(d.status), width: 7, height: 7, borderRadius: '50%' }} />
            {d.title ?? '—'}
          </span>
          <span className="pp-v">{d.value != null ? fmtBRL(d.value, d.currency ?? 'BRL') : '—'}</span>
        </div>
      ))}
    </div>
  );
}

/** Rotulo legivel do tipo de atividade (a API devolve em ingles nos tipos padrao). */
export const ROTULO_TIPO_ATIVIDADE: Record<string, string> = {
  call: 'Ligação', meeting: 'Reunião', task: 'Tarefa', deadline: 'Prazo',
  email: 'E-mail', lunch: 'Almoço', send_email: 'Enviar e-mail',
};
export const rotuloTipoAtividade = (t?: string | null): string =>
  (t ? (ROTULO_TIPO_ATIVIDADE[t] ?? t.replace(/_/g, ' ')) : '—');
