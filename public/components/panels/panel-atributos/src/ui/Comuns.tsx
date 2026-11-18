// panel-atributos/src/ui/Comuns.tsx — peças visuais comuns (linguagem do app iOS sobre os tokens do Dash).
import React from 'react';
import { createPortal } from 'react-dom';
import { corKit } from '../lib/rotulos';
import { urlFoto } from '../lib/api';
import { Contexto } from '../app/contexto';

/** Texto legível sobre a cor média (#rrggbb). */
function contraste(hex: string | null): string {
  if (!hex || !/^[0-9a-f]{6}$/i.test(hex)) return 'var(--bl-texto-3)';
  const n = parseInt(hex, 16); const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6 ? 'rgba(20,25,40,.55)' : 'rgba(255,255,255,.7)';
}

/** Foto do produto: miniatura autenticada (A6) sobre a cor média; sem foto → moldura tracejada. */
export function Foto({ mediaId, cor, proporcao = '4 / 3', idCapsula, lado = 480, compacta = false, ajuste = 'contain' }: {
  mediaId: number | null; cor: string | null; proporcao?: string; idCapsula?: number; lado?: 480 | 1280; compacta?: boolean; ajuste?: 'contain' | 'cover';
}) {
  const [falhou, setFalhou] = React.useState(false);
  React.useEffect(() => setFalhou(false), [mediaId]);
  const tem = mediaId !== null;
  return (
    <div className={`at-foto ${tem ? '' : 'at-foto--vazia'}`} style={{ aspectRatio: proporcao, background: tem ? (cor ? `#${cor}` : 'var(--bl-superficie-2)') : undefined }}>
      {tem && !falhou && <img src={urlFoto(mediaId, lado)} alt="" loading="lazy" decoding="async" style={{ objectFit: ajuste }} onError={() => setFalhou(true)} />}
      {(!tem || falhou) && (
        <div className="at-foto__miolo" style={{ color: tem ? contraste(cor) : 'var(--bl-texto-3)' }} role="img" aria-label={tem ? 'Foto indisponível' : 'Produto sem foto'}>
          <svg width={compacta ? 18 : 26} height={compacta ? 18 : 26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="M21 16l-5-5-8 8" />{!tem && <path d="M4 4l16 16" />}
          </svg>
          {!compacta && <span>{tem ? 'foto indisponível' : 'sem foto'}</span>}
        </div>
      )}
      {idCapsula !== undefined && <CapsulaId id={idCapsula} />}
    </div>
  );
}

export function CapsulaId({ id, flutuante = true }: { id: number; flutuante?: boolean }) {
  return <span className={`at-capsula ${flutuante ? 'at-capsula--sobre' : ''}`}>ID: {id}</span>;
}

export function ChipKit({ nome, titulo, pequeno }: { nome: string; titulo?: string; pequeno?: boolean }) {
  const cor = corKit(nome);
  return (
    <span className={`at-chip ${pequeno ? 'at-chip--p' : ''}`} title={titulo ?? `Kit ${nome}`}
      style={{ color: cor, borderColor: `color-mix(in srgb, ${cor} 45%, transparent)`, background: `color-mix(in srgb, ${cor} 13%, transparent)` }}>
      <span className="at-chip__ponto" style={{ background: cor }} />{nome}
    </span>
  );
}

export type Tom = 'neutro' | 'info' | 'aviso' | 'sucesso' | 'erro' | 'verde';
export function Etiqueta({ children, tom = 'neutro', titulo }: { children: React.ReactNode; tom?: Tom; titulo?: string }) {
  return <span className={`at-etiqueta at-etiqueta--${tom}`} title={titulo}>{children}</span>;
}

/** Barra de preenchimento "12 de 27" (A3: essencial por padrão). */
export function Barra({ feitos, total, rotulo, compacta = false }: { feitos: number; total: number; rotulo?: string; compacta?: boolean }) {
  const p = total > 0 ? Math.round((feitos / total) * 100) : 0;
  const cor = total === 0 ? 'var(--bl-neutro)' : p >= 80 ? 'var(--bl-sucesso)' : p >= 35 ? 'var(--bl-aviso)' : 'var(--bl-erro)';
  return (
    <div className="at-barra" title={total ? `${rotulo ?? 'Preenchimento'}: ${feitos} de ${total} (${p}%)` : 'Sem atributos nesta medida'}>
      {rotulo && <span className="at-barra__rot">{rotulo}</span>}
      <div className="at-barra__trilho" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={feitos} aria-label={rotulo ?? 'Preenchimento'}>
        <div className="at-barra__valor" style={{ width: `${total ? Math.max(p, feitos ? 3 : 0) : 0}%`, background: cor }} />
      </div>
      <span className="at-barra__texto">{total ? `${feitos} de ${total}` : '—'}{!compacta && total ? ` · ${p}%` : ''}</span>
    </div>
  );
}

export function Carregando({ rotulo = 'Carregando' }: { rotulo?: string }) {
  return <div className="at-carregando" role="status" aria-live="polite"><span className="at-giro" aria-hidden />{rotulo}…</div>;
}

export function Vazio({ titulo, children, acao }: { titulo: string; children?: React.ReactNode; acao?: React.ReactNode }) {
  return <div className="at-vazio-bloco"><strong>{titulo}</strong>{children && <p>{children}</p>}{acao}</div>;
}

export function Erro({ mensagem, aoTentar }: { mensagem: string; aoTentar?: () => void }) {
  return (
    <div className="at-erro-bloco" role="alert">
      <strong>Não foi possível carregar.</strong><p>{mensagem}</p>
      {aoTentar && <button type="button" className="bl-botao" onClick={aoTentar}>Tentar de novo</button>}
    </div>
  );
}

/** Diálogo modal acessível (foco inicial, Esc fecha, fundo opaco). */
export function Dialogo({ titulo, aberto, aoFechar, children, rodape, largura = 520 }: { titulo: string; aberto: boolean; aoFechar: () => void; children: React.ReactNode; rodape?: React.ReactNode; largura?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!aberto) return;
    const ant = document.activeElement as HTMLElement | null;
    const foco = ref.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-fechar])');
    (foco ?? ref.current)?.focus();
    const tecla = (e: KeyboardEvent) => { if (e.key !== 'Escape') return; if ((e.target as HTMLElement | null)?.closest?.('[data-esc-local]')) return; /* campo interno trata o próprio Esc */ e.stopPropagation(); aoFechar(); };
    window.addEventListener('keydown', tecla, true);
    return () => { window.removeEventListener('keydown', tecla, true); ant?.focus?.(); };
  }, [aberto, aoFechar]);
  if (!aberto) return null;
  // UX-1b: o diálogo vai para um PORTAL no <body> (com o próprio [data-bl-root], para os tokens valerem). Dentro do painel, os
  // ancestrais do shell criam contexto de empilhamento e o diálogo ficava cortado por baixo da barra do Dash (achado da ESQUERDA, Vincular).
  return createPortal(
    <div data-bl-root className="at-portal-modal">
    <div className="at-modal-fundo" onMouseDown={(e) => { if (e.target === e.currentTarget) aoFechar(); }}>
      <div className="at-modal" role="dialog" aria-modal="true" aria-label={titulo} ref={ref} tabIndex={-1} style={{ width: `min(${largura}px, calc(100vw - 32px))` }}>
        <div className="at-modal__cabeca"><h2>{titulo}</h2><button type="button" className="bl-botao bl-botao--icone" data-fechar aria-label="Fechar" onClick={aoFechar}>✕</button></div>
        <div className="at-modal__corpo">{children}</div>
        {rodape && <div className="at-modal__rodape">{rodape}</div>}
      </div>
    </div>
    </div>, document.body);
}

/** Botão com estado de trabalho. */
export function Botao({ children, aoClicar, primario, perigo, desligado, trabalhando, titulo, tipo = 'button' }: {
  children: React.ReactNode; aoClicar?: () => void; primario?: boolean; perigo?: boolean; desligado?: boolean; trabalhando?: boolean; titulo?: string; tipo?: 'button' | 'submit';
}) {
  return (
    <button type={tipo} className={`bl-botao ${primario ? 'bl-botao--primario' : ''} ${perigo ? 'at-botao--perigo' : ''}`} onClick={aoClicar} disabled={desligado || trabalhando} title={titulo} aria-busy={trabalhando}>
      {trabalhando && <span className="at-giro at-giro--p" aria-hidden />}{children}
    </button>
  );
}

/** UX-1b: bloco que fica FIXO junto do título e das abas (só o resto da tela rola). Ex.: big numbers, busca e filtros.
 *  Uso: <FaixaFixa>…</FaixaFixa> em qualquer lugar da tela. Um bloco que encolhe ao rolar marca data-encolhivel e
 *  data-altura-compacta="56" (a regra dos 40% conta a altura compacta). Sem área fixa (fora do módulo), desenha no lugar. */
export function FaixaFixa({ children }: { children: React.ReactNode }) {
  const m = React.useContext(Contexto);
  const alvo = m?.faixaFixa ?? null;
  return alvo ? createPortal(<div className="at-faixa-fixa__bloco">{children}</div>, alvo) : <>{children}</>;
}
