// screens/Abas.tsx — abas de página + ação com nível de risco (Elevação visual — Fase 6).
// @version 1.0.0  @created 2026-07-27
//
// `AbasPagina`: barra de abas acessível (role=tablist/tab/tabpanel) com navegação por
// seta ←/→ e Home/End, e memória da última aba. Mesma gramática do `DrawerShell v2`,
// que já usa abas dentro dos drawers — a tela não pode ter um padrão de aba diferente.
//
// `AcaoCritica`: ação de escrita rotulada por RISCO. Risco alto não dispara no primeiro
// clique: exige confirmação explícita, porque desconectar a integração ou remover um
// webhook não têm "desfazer".
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ShieldAlert, TriangleAlert, Info } from 'lucide-react';

// ── Abas ─────────────────────────────────────────────────────────────────────

export interface Aba {
  id: string;
  label: string;
  /** Marcador colorido à esquerda do rótulo (ex.: estado da conexão). */
  cor?: string;
}

export function AbasPagina({ abas, ativa, onMudar, idPrefixo }: {
  abas: Aba[];
  ativa: string;
  onMudar: (id: string) => void;
  idPrefixo: string;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const mover = (delta: number) => {
    const i = abas.findIndex((a) => a.id === ativa);
    if (i < 0) return;
    const alvo = abas[(i + delta + abas.length) % abas.length];
    onMudar(alvo.id);
    refs.current[alvo.id]?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); mover(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); mover(-1); }
    else if (e.key === 'Home') { e.preventDefault(); onMudar(abas[0].id); refs.current[abas[0].id]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); const u = abas[abas.length - 1]; onMudar(u.id); refs.current[u.id]?.focus(); }
  };

  return (
    <div className="pp-tabs" role="tablist" aria-label="Seções da página" onKeyDown={onKey}>
      {abas.map((a) => {
        const sel = a.id === ativa;
        return (
          <button key={a.id} type="button" role="tab" id={`${idPrefixo}-tab-${a.id}`}
            aria-selected={sel} aria-controls={`${idPrefixo}-painel-${a.id}`}
            tabIndex={sel ? 0 : -1}
            ref={(el) => { refs.current[a.id] = el; }}
            className="pp-tab" onClick={() => onMudar(a.id)}>
            {a.cor && <span className="pp-dot" style={{ background: a.cor }} aria-hidden />}
            {a.label}
          </button>
        );
      })}
    </div>
  );
}

export function PainelAba({ id, ativa, idPrefixo, children }: {
  id: string; ativa: string; idPrefixo: string; children: ReactNode;
}) {
  if (id !== ativa) return null;
  return (
    <div role="tabpanel" id={`${idPrefixo}-painel-${id}`} aria-labelledby={`${idPrefixo}-tab-${id}`} tabIndex={0}>
      {children}
    </div>
  );
}

/** Lê/guarda a aba ativa por tela (`pp:aba:{escopo}`), validando contra as abas atuais. */
export function useAbaLembrada(escopo: string, abas: Aba[], padrao: string): [string, (id: string) => void] {
  const chave = `pp:aba:${escopo}`;
  const [ativa, setAtiva] = useState<string>(() => {
    try {
      const s = localStorage.getItem(chave);
      if (s && abas.some((a) => a.id === s)) return s;
    } catch { /* ignora */ }
    return padrao;
  });
  useEffect(() => { try { localStorage.setItem(chave, ativa); } catch { /* ignora */ } }, [chave, ativa]);
  // Se a aba lembrada sumir (ex.: seção some quando desconecta), cai no padrão.
  useEffect(() => {
    if (!abas.some((a) => a.id === ativa)) setAtiva(padrao);
  }, [abas, ativa, padrao]);
  return [ativa, setAtiva];
}

// ── Ação com nível de risco ──────────────────────────────────────────────────

export type Risco = 'baixo' | 'medio' | 'alto';

const ROTULO_RISCO: Record<Risco, string> = { baixo: 'seguro', medio: 'atenção', alto: 'crítico' };
const ICONE_RISCO: Record<Risco, typeof Info> = { baixo: Info, medio: TriangleAlert, alto: ShieldAlert };

export interface AcaoCriticaProps {
  titulo: string;
  descricao: ReactNode;
  risco: Risco;
  rotulo: string;
  /** Texto do botão enquanto executa. */
  rotuloOcupado?: string;
  ocupado?: boolean;
  desabilitado?: boolean;
  motivoDesabilitado?: string;
  /** Pergunta da confirmação (só risco alto). Sem ela, usa uma pergunta genérica. */
  pergunta?: ReactNode;
  onExecutar: () => void;
  /** Conteúdo extra abaixo da ação (resumo do último resultado, por exemplo). */
  children?: ReactNode;
}

export function AcaoCritica({
  titulo, descricao, risco, rotulo, rotuloOcupado, ocupado, desabilitado,
  motivoDesabilitado, pergunta, onExecutar, children,
}: AcaoCriticaProps) {
  const [confirmando, setConfirmando] = useState(false);
  const Icone = ICONE_RISCO[risco];

  // Risco alto não dispara no primeiro clique — não há desfazer do outro lado.
  const clicar = () => { if (risco === 'alto') setConfirmando(true); else onExecutar(); };
  const confirmar = () => { setConfirmando(false); onExecutar(); };

  return (
    <div className="pp-acao">
      <div className="pp-acao-txt">
        <div className="pp-acao-tit">
          {titulo}
          <span className={`pp-risco ${risco}`}><Icone size={11} aria-hidden />{ROTULO_RISCO[risco]}</span>
        </div>
        <div className="pp-acao-desc">{descricao}</div>
        {confirmando && (
          <div className="pp-confirma" role="alertdialog" aria-label={`Confirmar: ${titulo}`}>
            <span>{pergunta ?? <>Confirmar “{titulo}”? Esta ação não tem desfazer.</>}</span>
            <button type="button" className="pp-btn risco-alto" onClick={confirmar} disabled={ocupado}>
              Sim, {rotulo.toLowerCase()}
            </button>
            <button type="button" className="pp-btn" onClick={() => setConfirmando(false)} disabled={ocupado}>
              Cancelar
            </button>
          </div>
        )}
        {children}
      </div>
      {!confirmando && (
        <div className="pp-acao-bts">
          <button type="button"
            className={`pp-btn${risco === 'alto' ? ' risco-alto' : ''}${risco === 'baixo' ? '' : ''}`}
            onClick={clicar} disabled={ocupado || desabilitado}
            title={desabilitado ? motivoDesabilitado : undefined}>
            {ocupado ? (rotuloOcupado ?? 'Executando…') : rotulo}
          </button>
        </div>
      )}
    </div>
  );
}
