// panel-bling/src/shell/SubSidebar.tsx — navegação interna do módulo (§11)
// @version 1.0.0  @created 2026-07-30
//
// 240px expandida / 72px colapsada, persistida em `dshow.bling.sidebar.collapsed`
// exatamente como o §11.2 pede.
//
// ⚠️ ESPAÇO DISPONÍVEL: a sidebar do app-shell é 312px FIXOS e não cede. Em
// janelas de 600–820px o painel inteiro recebe 208–258px — menos que um celular.
// Por isso, abaixo de 1100px esta sub-sidebar colapsa sozinha, e abaixo de 860px
// vira um seletor: uma segunda coluna de 240px ali dentro deixaria o conteúdo
// com largura negativa.

import React from 'react';
import { GRUPOS, TELAS_POR_GRUPO, TelaSpec } from '../screens/catalog';
import { Icone } from './Icone';
import { CHAVE_SIDEBAR } from '../app/estado';

function lerColapsada(): boolean {
  try { return localStorage.getItem(CHAVE_SIDEBAR) === '1'; } catch { return false; }
}

/** Observa a largura do próprio painel — não a da janela. O que importa é o
 *  espaço que sobrou depois da sidebar do shell, não o tamanho do monitor. */
function useLarguraPainel(ref: React.RefObject<HTMLElement | null>) {
  const [l, setL] = React.useState<number>(1200);
  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(e => {
      const w = e[0]?.contentRect.width ?? 1200;
      if (w > 0) setL(w);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return l;
}

export interface PropsSubSidebar {
  telaAtiva: string;
  aoNavegar: (id: string) => void;
  badges?: Record<string, number>;
  larguraPainel: number;
}

export function SubSidebar({ telaAtiva, aoNavegar, badges, larguraPainel }: PropsSubSidebar) {
  const [colapsadaManual, setColapsadaManual] = React.useState(lerColapsada);
  const estreito = larguraPainel < 1100;
  const muitoEstreito = larguraPainel < 860;
  const colapsada = colapsadaManual || estreito;

  const alternar = () => {
    const nova = !colapsadaManual;
    setColapsadaManual(nova);
    try { localStorage.setItem(CHAVE_SIDEBAR, nova ? '1' : '0'); } catch { /* ignora */ }
  };

  // Abaixo de 860px a navegação vira um <select>: é a única forma de manter as
  // 52 telas acessíveis sem roubar largura do conteúdo.
  if (muitoEstreito) {
    return (
      <nav aria-label="Seções do Bling" style={{ padding: '8px 0' }}>
        <select
          value={telaAtiva}
          onChange={e => aoNavegar(e.target.value)}
          aria-label="Ir para a seção"
          style={{
            width: '100%', height: 34, padding: '0 10px', font: 'inherit', fontSize: 13,
            color: 'var(--bl-texto)', background: 'var(--bl-superficie)',
            border: '1px solid var(--bl-borda)', borderRadius: 'var(--bl-raio-sm)',
          }}
        >
          {GRUPOS.map(g => (
            <optgroup key={g.id} label={g.rotulo}>
              {TELAS_POR_GRUPO[g.id].map(t => (
                <option key={t.id} value={t.id}>
                  {t.titulo}{badges?.[t.id] ? ` (${badges[t.id]})` : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </nav>
    );
  }

  const L = colapsada ? 'var(--bl-sidebar-estreita)' : 'var(--bl-sidebar-larga)';

  return (
    <nav
      aria-label="Seções do Bling"
      style={{
        width: L, minWidth: L, flex: `0 0 ${L}`,
        borderRight: '1px solid var(--bl-borda)',
        background: 'var(--bl-bg-elevado)',
        display: 'flex', flexDirection: 'column',
        transition: 'width .16s ease, min-width .16s ease, flex-basis .16s ease',
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 10px', borderBottom: '1px solid var(--bl-borda)', flex: '0 0 auto',
      }}>
        {!colapsada && (
          <span style={{
            fontSize: 10.5, fontWeight: 600, letterSpacing: '.06em',
            textTransform: 'uppercase', color: 'var(--bl-texto-3)', flex: 1,
          }}>
            Seções
          </span>
        )}
        <button
          type="button"
          onClick={alternar}
          disabled={estreito}
          title={estreito
            ? 'A largura disponível não comporta o menu expandido'
            : colapsada ? 'Expandir menu' : 'Recolher menu'}
          aria-label={colapsada ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!colapsada}
          className="bl-botao bl-botao--icone"
          style={{ height: 24, width: 24, margin: colapsada ? '0 auto' : undefined }}
        >
          <span aria-hidden style={{ fontSize: 11 }}>{colapsada ? '»' : '«'}</span>
        </button>
      </div>

      {/* Scroll independente do conteúdo (§11) */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px 0' }}>
        {GRUPOS.map(g => (
          <div key={g.id} style={{ marginBottom: 4 }}>
            {!colapsada ? (
              <div style={{
                padding: '7px 12px 4px', fontSize: 10, fontWeight: 700,
                letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--bl-texto-3)',
              }}>
                {g.rotulo}
              </div>
            ) : (
              <div title={g.rotulo} style={{
                display: 'flex', justifyContent: 'center', padding: '8px 0 5px',
                color: 'var(--bl-texto-3)',
              }}>
                <Icone nome={g.icone} tamanho={13} />
              </div>
            )}

            {TELAS_POR_GRUPO[g.id].map(t => (
              <ItemMenu
                key={t.id} tela={t} ativa={t.id === telaAtiva}
                colapsada={colapsada} badge={badges?.[t.id]}
                aoClicar={() => aoNavegar(t.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}

function ItemMenu({ tela, ativa, colapsada, badge, aoClicar }: {
  tela: TelaSpec; ativa: boolean; colapsada: boolean;
  badge?: number; aoClicar: () => void;
}) {
  const estrutural = tela.profundidade === 'estrutural';
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-current={ativa ? 'page' : undefined}
      title={colapsada ? `${tela.titulo}${estrutural ? ' — em construção' : ''}` : tela.subtitulo}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        width: '100%', padding: colapsada ? '7px 0' : '6px 12px',
        justifyContent: colapsada ? 'center' : 'flex-start',
        font: 'inherit', fontSize: 12.5, textAlign: 'left',
        fontWeight: ativa ? 600 : 400,
        color: ativa ? 'var(--bl-verde)' : 'var(--bl-texto-2)',
        background: ativa ? 'var(--bl-verde-suave)' : 'transparent',
        border: 'none',
        borderLeft: `2px solid ${ativa ? 'var(--bl-verde)' : 'transparent'}`,
        cursor: 'pointer',
      }}
      onMouseEnter={e => { if (!ativa) e.currentTarget.style.background = 'var(--bl-superficie-2)'; }}
      onMouseLeave={e => { if (!ativa) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ flex: '0 0 auto', display: 'flex' }}>
        <Icone nome={tela.icone} tamanho={15} />
      </span>
      {!colapsada && (
        <>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tela.titulo}
          </span>
          {estrutural && (
            <span
              title="Tela funcional, mas sem visualização dedicada ainda"
              style={{
                width: 5, height: 5, borderRadius: 999,
                background: 'var(--bl-texto-3)', flex: '0 0 auto',
              }}
            />
          )}
          {badge !== undefined && badge > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 999,
              background: 'var(--bl-erro-bg)', color: 'var(--bl-erro)', flex: '0 0 auto',
            }}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
      {colapsada && badge !== undefined && badge > 0 && (
        <span aria-hidden style={{
          position: 'absolute', marginLeft: 16, marginTop: -12,
          width: 6, height: 6, borderRadius: 999, background: 'var(--bl-erro)',
        }} />
      )}
    </button>
  );
}

export { useLarguraPainel };
