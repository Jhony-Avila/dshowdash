// _shared-react/components/Primitivos.tsx — estados de tela e blocos básicos
// @version 1.0.0  @created 2026-07-30
//
// Cobre os estados obrigatórios do §59: carregando, sem dados, erro, dado
// desatualizado e ambiente simulado. Toda tela do módulo usa estes — é o que
// impede uma tela mostrar "carregando..." e a vizinha mostrar spinner.

import React from 'react';

/* ─────────────────────────── Badge ─────────────────────────── */

export type CorSemantica = 'sucesso' | 'aviso' | 'erro' | 'info' | 'neutro' | 'verde';

export interface InfoSituacao {
  chave: string;
  rotulo: string;
  cor: CorSemantica | string;
  desconhecida?: boolean;
}

const CORES: Record<string, { fg: string; bg: string }> = {
  sucesso: { fg: 'var(--bl-sucesso)', bg: 'var(--bl-sucesso-bg)' },
  aviso:   { fg: 'var(--bl-aviso)',   bg: 'var(--bl-aviso-bg)' },
  erro:    { fg: 'var(--bl-erro)',    bg: 'var(--bl-erro-bg)' },
  info:    { fg: 'var(--bl-info)',    bg: 'var(--bl-info-bg)' },
  neutro:  { fg: 'var(--bl-neutro)',  bg: 'var(--bl-neutro-bg)' },
  verde:   { fg: 'var(--bl-verde)',   bg: 'var(--bl-verde-suave)' },
};

/**
 * Badge de situação.
 * O ponto colorido à esquerda existe para o §67: o status não pode depender
 * só da cor. Quem não distingue as cores lê o rótulo; quem usa leitor de tela
 * recebe o texto completo.
 */
export function Badge({ info, titulo }: { info: InfoSituacao | null | undefined; titulo?: string }) {
  if (!info) return <span style={{ color: 'var(--bl-texto-3)' }}>—</span>;
  const c = CORES[info.cor] ?? CORES.neutro;
  return (
    <span
      title={titulo ?? (info.desconhecida ? `Situação não mapeada: ${info.chave}` : info.rotulo)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
        color: c.fg, background: c.bg,
        border: `1px solid ${c.fg}33`,
        whiteSpace: 'nowrap', maxWidth: '100%',
      }}
    >
      <span aria-hidden style={{ width: 5, height: 5, borderRadius: 999, background: c.fg, flex: '0 0 auto' }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{info.rotulo}</span>
      {info.desconhecida && <span aria-hidden style={{ opacity: .7 }}>?</span>}
    </span>
  );
}

/* ─────────────────────────── Skeleton ─────────────────────────── */

export function Skeleton({ altura = 14, largura = '100%', raio = 6 }:
  { altura?: number | string; largura?: number | string; raio?: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'block', height: altura, width: largura, borderRadius: raio,
        background: 'linear-gradient(90deg, var(--bl-superficie-2) 25%, var(--bl-borda) 37%, var(--bl-superficie-2) 63%)',
        backgroundSize: '400% 100%',
        animation: 'bl-brilho 1.4s ease infinite',
      }}
    />
  );
}

export function BlocoCarregando({ linhas = 5, rotulo = 'Carregando' }: { linhas?: number; rotulo?: string }) {
  return (
    <div role="status" aria-live="polite" style={{ display: 'grid', gap: 8, padding: 4 }}>
      <span className="bl-so-leitor">{rotulo}…</span>
      {Array.from({ length: linhas }, (_, i) => (
        <Skeleton key={i} altura={i === 0 ? 20 : 14} largura={i === 0 ? '38%' : `${100 - (i % 3) * 7}%`} />
      ))}
    </div>
  );
}

/* ─────────────────────────── Estados ─────────────────────────── */

export function EstadoVazio({ titulo, descricao, acao, filtroAtivo }: {
  titulo: string; descricao?: string; acao?: React.ReactNode; filtroAtivo?: boolean;
}) {
  return (
    <div style={{ padding: '44px 24px', textAlign: 'center', color: 'var(--bl-texto-2)' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--bl-texto)', marginBottom: 6 }}>{titulo}</div>
      {descricao && <div style={{ fontSize: 12.5, maxWidth: 460, margin: '0 auto 14px' }}>{descricao}</div>}
      {filtroAtivo && (
        <div style={{ fontSize: 12, color: 'var(--bl-aviso)', marginBottom: 14 }}>
          Há filtros aplicados. Pode haver dados fora do recorte atual.
        </div>
      )}
      {acao}
    </div>
  );
}

/**
 * Estado de erro (§59). O correlation ID fica visível e copiável de propósito:
 * é o que liga a queixa do usuário à linha de log do servidor.
 */
export function EstadoErro({ erro, correlationId, quando, aoTentarNovamente }: {
  erro: string; correlationId?: string | null; quando?: string; aoTentarNovamente?: () => void;
}) {
  const [aberto, setAberto] = React.useState(false);
  return (
    <div
      role="alert"
      style={{
        padding: '22px', border: '1px solid var(--bl-erro)', background: 'var(--bl-erro-bg)',
        borderRadius: 'var(--bl-raio)', maxWidth: 560, margin: '24px auto', textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Não foi possível carregar estes dados</div>
      <div style={{ fontSize: 12.5, color: 'var(--bl-texto-2)', marginBottom: 14 }}>
        Tente novamente. Se continuar, informe o código abaixo ao suporte.
      </div>
      {aoTentarNovamente && (
        <button type="button" className="bl-botao bl-botao--primario" onClick={aoTentarNovamente}>
          Tentar novamente
        </button>
      )}
      <div style={{ marginTop: 14 }}>
        <button
          type="button"
          onClick={() => setAberto(v => !v)}
          aria-expanded={aberto}
          style={{
            background: 'none', border: 'none', color: 'var(--bl-texto-2)',
            font: 'inherit', fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline',
          }}
        >
          {aberto ? 'Ocultar detalhes' : 'Ver detalhes'}
        </button>
      </div>
      {aberto && (
        <div style={{
          marginTop: 10, padding: 10, textAlign: 'left', fontSize: 11.5,
          fontFamily: 'var(--bl-fonte-mono)', background: 'var(--bl-superficie)',
          border: '1px solid var(--bl-borda)', borderRadius: 'var(--bl-raio-sm)',
          wordBreak: 'break-word',
        }}>
          <div>{erro}</div>
          {correlationId && <div style={{ marginTop: 6 }}>correlation_id: {correlationId}</div>}
          {quando && <div>quando: {quando}</div>}
        </div>
      )}
    </div>
  );
}

/**
 * Tarja de ambiente simulado (§59).
 * Fica sempre visível quando o provedor é mock. Não é dispensável: o dia em que
 * alguém tomar decisão com número simulado achando que é real, o problema é este.
 */
export function TarjaSimulado({ visivel }: { visivel: boolean }) {
  if (!visivel) return null;
  return (
    <div
      role="note"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 14px', fontSize: 12,
        color: 'var(--bl-aviso)', background: 'var(--bl-aviso-bg)',
        borderBottom: '1px solid var(--bl-aviso)',
      }}
    >
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--bl-aviso)' }} />
      <strong style={{ fontWeight: 600 }}>Ambiente de demonstração</strong>
      <span style={{ color: 'var(--bl-texto-2)' }}>— os dados apresentados são simulados.</span>
    </div>
  );
}

/** Aviso de dado desatualizado (§59). */
export function AvisoDesatualizado({ ultimaAtualizacao, motivo, aoAtualizar }: {
  ultimaAtualizacao: string; motivo?: string; aoAtualizar?: () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '7px 12px', fontSize: 12, borderRadius: 'var(--bl-raio-sm)',
      color: 'var(--bl-aviso)', background: 'var(--bl-aviso-bg)',
      border: '1px solid var(--bl-aviso)', margin: '0 0 12px',
    }}>
      <span>Dados de {ultimaAtualizacao}.</span>
      {motivo && <span style={{ color: 'var(--bl-texto-2)' }}>{motivo}</span>}
      {aoAtualizar && (
        <button type="button" className="bl-botao" onClick={aoAtualizar} style={{ height: 24, fontSize: 11 }}>
          Atualizar
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────── Medidor ─────────────────────────── */

/** Barra de 0–100 usada em score de qualidade e atingimento de meta. */
export function Medidor({ valor, rotulo }: { valor: number | null | undefined; rotulo?: string }) {
  if (valor === null || valor === undefined) return <span style={{ color: 'var(--bl-texto-3)' }}>—</span>;
  const v = Math.max(0, Math.min(100, valor));
  const cor = v >= 80 ? 'var(--bl-sucesso)' : v >= 60 ? 'var(--bl-aviso)' : 'var(--bl-erro)';
  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, width: '100%' }}
      title={rotulo ?? `${v}%`}
      role="meter"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={rotulo ?? 'Indicador'}
    >
      <span style={{
        flex: 1, height: 5, minWidth: 34, borderRadius: 999,
        background: 'var(--bl-superficie-2)', overflow: 'hidden',
      }}>
        <span style={{ display: 'block', height: '100%', width: `${v}%`, background: cor }} />
      </span>
      <span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', color: 'var(--bl-texto-2)', minWidth: 26, textAlign: 'right' }}>
        {Math.round(v)}
      </span>
    </span>
  );
}

/* ─────────────────────────── Tabs ─────────────────────────── */

export interface Aba { id: string; rotulo: string; contador?: number | null }

export function Abas({ abas, ativa, aoTrocar }: {
  abas: Aba[]; ativa: string; aoTrocar: (id: string) => void;
}) {
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  // Setas navegam entre abas (§67) — comportamento esperado de tablist.
  const aoTeclar = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const prox = e.key === 'ArrowRight' ? (i + 1) % abas.length : (i - 1 + abas.length) % abas.length;
    aoTrocar(abas[prox].id);
    refs.current[abas[prox].id]?.focus();
  };

  return (
    <div role="tablist" className="bl-rola-x" style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--bl-borda)' }}>
      {abas.map((a, i) => {
        const sel = a.id === ativa;
        return (
          <button
            key={a.id}
            ref={el => { refs.current[a.id] = el; }}
            role="tab"
            type="button"
            aria-selected={sel}
            tabIndex={sel ? 0 : -1}
            onClick={() => aoTrocar(a.id)}
            onKeyDown={e => aoTeclar(e, i)}
            style={{
              padding: '8px 13px', font: 'inherit', fontSize: 12.5,
              fontWeight: sel ? 600 : 500,
              color: sel ? 'var(--bl-texto)' : 'var(--bl-texto-2)',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${sel ? 'var(--bl-verde)' : 'transparent'}`,
              marginBottom: -1, whiteSpace: 'nowrap',
            }}
          >
            {a.rotulo}
            {a.contador !== null && a.contador !== undefined && (
              <span style={{
                marginLeft: 6, fontSize: 11, padding: '1px 6px', borderRadius: 999,
                background: 'var(--bl-superficie-2)', color: 'var(--bl-texto-2)',
              }}>{a.contador}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── Drawer ─────────────────────────── */

/**
 * Painel lateral. Usa --bl-overlay (OPACO) de propósito: superfície translúcida
 * em position:fixed deixa o conteúdo de trás aparecer — foi um bug real no
 * módulo DataTables e não vale a pena repetir.
 */
export function Drawer({ aberto, titulo, subtitulo, aoFechar, largura = 620, children }: {
  aberto: boolean; titulo: string; subtitulo?: string;
  aoFechar: () => void; largura?: number; children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!aberto) return;
    const antes = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); antes?.focus?.(); };
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return (
    <>
      <div
        onClick={aoFechar}
        aria-hidden
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 4000 }}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: `min(${largura}px, 96vw)`, zIndex: 4001,
          background: 'var(--bl-overlay)',
          borderLeft: '1px solid var(--bl-borda)',
          boxShadow: '-8px 0 32px rgba(0,0,0,.34)',
          display: 'flex', flexDirection: 'column', outline: 'none',
        }}
      >
        <header style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '14px 18px', borderBottom: '1px solid var(--bl-borda)', flex: '0 0 auto',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{titulo}</div>
            {subtitulo && <div style={{ fontSize: 12, color: 'var(--bl-texto-2)', marginTop: 2 }}>{subtitulo}</div>}
          </div>
          <button type="button" className="bl-botao bl-botao--icone" onClick={aoFechar} aria-label="Fechar">✕</button>
        </header>
        <div style={{ flex: 1, overflow: 'auto', padding: 18, minHeight: 0 }}>{children}</div>
      </div>
    </>
  );
}

/* ─────────────────────────── Timeline ─────────────────────────── */

export interface EtapaLinha {
  id: string; rotulo: string; quando?: string | null;
  estado: 'concluida' | 'atual' | 'pendente' | 'falha';
  detalhe?: string;
}

export function LinhaDoTempo({ etapas }: { etapas: EtapaLinha[] }) {
  const cor = (e: EtapaLinha['estado']) =>
    e === 'concluida' ? 'var(--bl-sucesso)'
    : e === 'atual'   ? 'var(--bl-verde)'
    : e === 'falha'   ? 'var(--bl-erro)'
    : 'var(--bl-borda-forte)';

  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {etapas.map((e, i) => (
        <li key={e.id} style={{ display: 'flex', gap: 12, minHeight: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto' }}>
            <span style={{
              width: 11, height: 11, borderRadius: 999, marginTop: 4,
              background: e.estado === 'pendente' ? 'transparent' : cor(e.estado),
              border: `2px solid ${cor(e.estado)}`,
            }} />
            {i < etapas.length - 1 && (
              <span style={{ flex: 1, width: 2, background: 'var(--bl-borda)', marginTop: 2 }} />
            )}
          </div>
          <div style={{ paddingBottom: 14, minWidth: 0 }}>
            <div style={{
              fontSize: 12.5, fontWeight: e.estado === 'atual' ? 600 : 500,
              color: e.estado === 'pendente' ? 'var(--bl-texto-3)' : 'var(--bl-texto)',
            }}>
              {e.rotulo}
            </div>
            {e.quando && <div style={{ fontSize: 11.5, color: 'var(--bl-texto-2)' }}>{e.quando}</div>}
            {e.detalhe && <div style={{ fontSize: 11.5, color: 'var(--bl-texto-3)' }}>{e.detalhe}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
