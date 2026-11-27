// _shared-react/components/Primitivos.tsx — estados de tela e blocos básicos
// @version 1.0.0  @created 2026-07-30
//
// Cobre os estados obrigatórios do §59: carregando, sem dados, erro, dado
// desatualizado e ambiente simulado. Toda tela do módulo usa estes — é o que
// impede uma tela mostrar "carregando..." e a vizinha mostrar spinner.

import React from 'react';
import { DSSidePanel } from '../des/DSSidePanel';

/* ─────────────────────────── Badge ─────────────────────────── */

export type CorSemantica = 'sucesso' | 'aviso' | 'erro' | 'info' | 'neutro' | 'verde';

export interface InfoSituacao {
  chave: string;
  rotulo: string;
  cor: CorSemantica | string;
  desconhecida?: boolean;
}

const CORES: Record<string, { fg: string; bg: string }> = {
  sucesso: { fg: 'var(--bl-sucesso, var(--des-ok-txt, #166534))', bg: 'var(--bl-sucesso-bg, var(--des-ok, #f0fdf4))' },
  aviso:   { fg: 'var(--bl-aviso, var(--des-aviso-txt, #92400e))',   bg: 'var(--bl-aviso-bg, var(--des-aviso, #fffbeb))' },
  erro:    { fg: 'var(--bl-erro, var(--des-erro-txt, #b91c1c))',    bg: 'var(--bl-erro-bg, var(--des-erro, #fef2f2))' },
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
  if (!info) return <span style={{ color: 'var(--bl-texto-3, var(--des-dim, #6b7280))' }}>—</span>;
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
        background: 'linear-gradient(90deg, var(--bl-superficie-2, var(--des-sup2, #f3f4f6)) 25%, var(--bl-borda, var(--des-borda, #e5e7eb)) 37%, var(--bl-superficie-2, var(--des-sup2, #f3f4f6)) 63%)',
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
    <div style={{ padding: '44px 24px', textAlign: 'center', color: 'var(--bl-texto-2, var(--des-dim, #4b5563))' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--bl-texto, var(--des-texto, #1f2937))', marginBottom: 6 }}>{titulo}</div>
      {descricao && <div style={{ fontSize: 12.5, maxWidth: 460, margin: '0 auto 14px' }}>{descricao}</div>}
      {filtroAtivo && (
        <div style={{ fontSize: 12, color: 'var(--bl-aviso, var(--des-aviso-txt, #92400e))', marginBottom: 14 }}>
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
export function EstadoErro({ erro, correlationId, quando, aoTentarNovamente, titulo = 'Não foi possível carregar estes dados',
  descricao = 'Tente novamente. Se continuar, informe o código abaixo ao suporte.', classeBotao = 'bl-botao bl-botao--primario' }: {
  erro: string; correlationId?: string | null; quando?: string; aoTentarNovamente?: () => void;
  /** LIB-06 (27/11): texto da tela (ex.: INT-UX-001 "Não foi possível consultar as integrações.") — padrões = os de antes */
  titulo?: string; descricao?: string; classeBotao?: string;
}) {
  const [aberto, setAberto] = React.useState(false);
  return (
    <div
      role="alert"
      style={{
        padding: '22px', border: '1px solid var(--bl-erro, var(--des-erro-txt, #b91c1c))', background: 'var(--bl-erro-bg, var(--des-erro, #fef2f2))',
        borderRadius: 'var(--bl-raio, var(--des-raio, 10px))', maxWidth: 560, margin: '24px auto', textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{titulo}</div>
      <div style={{ fontSize: 12.5, color: 'var(--bl-texto-2, var(--des-dim, #4b5563))', marginBottom: 14 }}>
        {descricao}
      </div>
      {aoTentarNovamente && (
        <button type="button" className={classeBotao} onClick={aoTentarNovamente}>
          Tentar novamente
        </button>
      )}
      <div style={{ marginTop: 14 }}>
        <button
          type="button"
          onClick={() => setAberto(v => !v)}
          aria-expanded={aberto}
          style={{
            background: 'none', border: 'none', color: 'var(--bl-texto-2, var(--des-dim, #4b5563))',
            font: 'inherit', fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline',
          }}
        >
          {aberto ? 'Ocultar detalhes' : 'Ver detalhes'}
        </button>
      </div>
      {aberto && (
        <div style={{
          marginTop: 10, padding: 10, textAlign: 'left', fontSize: 11.5,
          fontFamily: 'var(--bl-fonte-mono, ui-monospace, monospace)', background: 'var(--bl-superficie, var(--des-sup, #ffffff))',
          border: '1px solid var(--bl-borda, var(--des-borda, #e5e7eb))', borderRadius: 'var(--bl-raio-sm, 6px)',
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
        color: 'var(--bl-aviso, var(--des-aviso-txt, #92400e))', background: 'var(--bl-aviso-bg, var(--des-aviso, #fffbeb))',
        borderBottom: '1px solid var(--bl-aviso, var(--des-aviso-txt, #92400e))',
      }}
    >
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--bl-aviso, var(--des-aviso-txt, #92400e))' }} />
      <strong style={{ fontWeight: 600 }}>Ambiente de demonstração</strong>
      <span style={{ color: 'var(--bl-texto-2, var(--des-dim, #4b5563))' }}>— os dados apresentados são simulados.</span>
    </div>
  );
}

/** Aviso de dado desatualizado (§59). */
export function AvisoDesatualizado({ ultimaAtualizacao, motivo, aoAtualizar, texto, classeBotao = 'bl-botao' }: {
  ultimaAtualizacao: string; motivo?: string; aoAtualizar?: () => void;
  /** LIB-06 (27/11): frase completa no lugar de "Dados de X." (ex.: "Não foi possível atualizar os estados. Exibindo a última consulta disponível.") */
  texto?: string; classeBotao?: string;
}) {
  return (
    <div role="status" style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '7px 12px', fontSize: 12, borderRadius: 'var(--bl-raio-sm, 6px)',
      color: 'var(--bl-aviso, var(--des-aviso-txt, #92400e))', background: 'var(--bl-aviso-bg, var(--des-aviso, #fffbeb))',
      border: '1px solid var(--bl-aviso, var(--des-aviso-txt, #92400e))', margin: '0 0 12px',
    }}>
      <span>{texto ?? `Dados de ${ultimaAtualizacao}.`}</span>
      {motivo && <span style={{ color: 'var(--bl-texto-2, var(--des-dim, #4b5563))' }}>{motivo}</span>}
      {aoAtualizar && (
        <button type="button" className={classeBotao} onClick={aoAtualizar} style={{ height: 24, fontSize: 11 }}>
          Atualizar
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────── Medidor ─────────────────────────── */

/** Barra de 0–100 usada em score de qualidade e atingimento de meta. */
export function Medidor({ valor, rotulo }: { valor: number | null | undefined; rotulo?: string }) {
  if (valor === null || valor === undefined) return <span style={{ color: 'var(--bl-texto-3, var(--des-dim, #6b7280))' }}>—</span>;
  const v = Math.max(0, Math.min(100, valor));
  const cor = v >= 80 ? 'var(--bl-sucesso, var(--des-ok-txt, #166534))' : v >= 60 ? 'var(--bl-aviso, var(--des-aviso-txt, #92400e))' : 'var(--bl-erro, var(--des-erro-txt, #b91c1c))';
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
        background: 'var(--bl-superficie-2, var(--des-sup2, #f3f4f6))', overflow: 'hidden',
      }}>
        <span style={{ display: 'block', height: '100%', width: `${v}%`, background: cor }} />
      </span>
      <span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', color: 'var(--bl-texto-2, var(--des-dim, #4b5563))', minWidth: 26, textAlign: 'right' }}>
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
    <div role="tablist" className="bl-rola-x" style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--bl-borda, var(--des-borda, #e5e7eb))' }}>
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
              color: sel ? 'var(--bl-texto, var(--des-texto, #1f2937))' : 'var(--bl-texto-2, var(--des-dim, #4b5563))',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${sel ? 'var(--bl-verde)' : 'transparent'}`,
              marginBottom: -1, whiteSpace: 'nowrap',
            }}
          >
            {a.rotulo}
            {a.contador !== null && a.contador !== undefined && (
              <span style={{
                marginLeft: 6, fontSize: 11, padding: '1px 6px', borderRadius: 999,
                background: 'var(--bl-superficie-2, var(--des-sup2, #f3f4f6))', color: 'var(--bl-texto-2, var(--des-dim, #4b5563))',
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
 * Painel lateral. DES · LIB-03 (27/11, VERDE): EVOLUÍDO para o DSSidePanel (_shared-react/des/DSSidePanel.tsx) — uma só infraestrutura.
 * A API deste Drawer não mudou (aberto, titulo, subtitulo, aoFechar, largura=620, children): ele delega em modo `modal`, com superfície
 * OPACA (lição do DataTables), foco contido, Esc, retorno do foco e começo abaixo da faixa fixa do shell. Telas novas usam o DSSidePanel
 * direto (rodapé, estado, modo não modal, carregando/erro/indisponível).
 */
export function Drawer({ aberto, titulo, subtitulo, aoFechar, largura = 620, children }: {
  aberto: boolean; titulo: string; subtitulo?: string;
  aoFechar: () => void; largura?: number; children: React.ReactNode;
}) {
  return <DSSidePanel aberto={aberto} titulo={titulo} subtitulo={subtitulo} aoFechar={aoFechar} largura={largura} modo="modal">{children}</DSSidePanel>;
}

/* ─────────────────────────── Timeline ─────────────────────────── */

export interface EtapaLinha {
  id: string; rotulo: string; quando?: string | null;
  estado: 'concluida' | 'atual' | 'pendente' | 'falha';
  detalhe?: string;
}

export function LinhaDoTempo({ etapas }: { etapas: EtapaLinha[] }) {
  const cor = (e: EtapaLinha['estado']) =>
    e === 'concluida' ? 'var(--bl-sucesso, var(--des-ok-txt, #166534))'
    : e === 'atual'   ? 'var(--bl-verde)'
    : e === 'falha'   ? 'var(--bl-erro, var(--des-erro-txt, #b91c1c))'
    : 'var(--bl-borda-forte, var(--des-borda, #d1d5db))';

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
              <span style={{ flex: 1, width: 2, background: 'var(--bl-borda, var(--des-borda, #e5e7eb))', marginTop: 2 }} />
            )}
          </div>
          <div style={{ paddingBottom: 14, minWidth: 0 }}>
            <div style={{
              fontSize: 12.5, fontWeight: e.estado === 'atual' ? 600 : 500,
              color: e.estado === 'pendente' ? 'var(--bl-texto-3, var(--des-dim, #6b7280))' : 'var(--bl-texto, var(--des-texto, #1f2937))',
            }}>
              {e.rotulo}
            </div>
            {e.quando && <div style={{ fontSize: 11.5, color: 'var(--bl-texto-2, var(--des-dim, #4b5563))' }}>{e.quando}</div>}
            {e.detalhe && <div style={{ fontSize: 11.5, color: 'var(--bl-texto-3, var(--des-dim, #6b7280))' }}>{e.detalhe}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
