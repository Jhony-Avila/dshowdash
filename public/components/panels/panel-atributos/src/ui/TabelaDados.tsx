// panel-atributos/src/ui/TabelaDados.tsx — tabela padrão do módulo Produtos & Atributos.
// Cabeçalho fixo (sticky top 0 na área de rolagem do módulo), ordenação por clique no título (ícone ↑ crescente / ↓ decrescente / ↑↓ não ativa,
// aria-sort, título é <button>), linhas zebradas com hover, colunas numéricas à direita, linha clicável acessível.
// A ordenação é pura (lib/ordenar.ts). Estado da ordenação: INTERNO por padrão (ordenacaoPadrao) ou CONTROLADO
// (ordenacao + aoOrdenar) — use o controlado quando a tabela pode desmontar (ex.: lista vazia por filtro) e a ordem
// precisa sobreviver.
//
// Rolagem (o <th> é sticky top 0 no ancestral rolável mais próximo):
//  · rolagem="propria" (PADRÃO hoje): a moldura da tabela é o container rolável (altura máxima = --at-td-altura-max,
//    padrão max(320px, 100dvh − 240px); rola nos dois eixos). Motivo, medido no harness 8113 em 18/11: a raiz do módulo
//    `[data-bl-root].at-raiz` tem overflow:auto mas NÃO tem altura limitada (scrollHeight = clientHeight), e quem rola de
//    fato é o <main class="dsd-shell__region--main"> do app-shell. Como o overflow da .at-raiz a torna o container do
//    sticky, um cabeçalho "fixo na página" não gruda em lugar nenhum.
//  · rolagem="container": a moldura não tem overflow e o cabeçalho gruda no ancestral rolável (a .at-raiz, quando a CIMA
//    limitar a altura dela). Só quando a tabela não cabe na largura a moldura ganha rolagem horizontal (data-larga="1") e,
//    nesse caso, o cabeçalho deixa de ser fixo.
//
// Grupos (opcional): `grupos` (ordem dada = ordem exibida) + `grupoDaLinha`. Cada grupo é um <tbody> com uma linha de
// cabeçalho (<th scope="rowgroup" colSpan=total>: título + contagem). A ordenação vale DENTRO de cada grupo; os grupos nunca são
// reordenados pela coluna. Grupo vazio some (mostrarVazios = mostra com "Nenhum item."). Linha com grupo fora da lista → "Outros".
//
// Células editáveis: `render` pode devolver input/select/textarea. A key da linha é SEMPRE chaveLinha (nunca o índice), então
// re-renderizar/reordenar não remonta o campo. Enquanto o foco estiver num campo editável do <tbody> (ou com congelarOrdem),
// a ORDEM FICA CONGELADA: os valores atualizam, mas nenhuma linha muda de lugar; a ordem nova (de um clique no título, de dados
// novos ou de uma ordenação controlada) se aplica quando o foco sai dos campos da tabela. Ir de um campo para outro da tabela
// (Tab, inclusive para uma linha clicável) mantém congelado; descongela quando o foco sai do <tbody>. Clique/Enter/Espaço num campo da linha não dispara aoClicarLinha.
//
// Linha expansível (opcional): `expandida(linha)` diz se a linha está aberta e `renderExpansao(linha)` desenha o detalhe, numa <tr>
// logo abaixo com uma única <td colSpan=total>. O estado é da TELA, pela chave estável (chaveLinha) — reordenar, filtrar ou recarregar
// não fecha nem troca a expansão de linha. O gatilho (ex.: o nome) vem no 2º argumento de `render`: `ctx.gatilho` = { aria-expanded,
// aria-controls, onClick } para espalhar num <button>; o clique chama `aoAlternarExpansao(linha)`. id da linha de detalhe = idExpansao().
// Compat (pedido da DIREITA §31.4, 18/11): também aceita `expandida` como a CHAVE da linha aberta (React.Key | null — uma linha por vez)
// e `detalheLinha(linha)` no lugar de `renderExpansao` (sinônimo). As duas formas convivem; função continua valendo (várias abertas).
import React from 'react';
import { agruparOrdenado, alternarOrdenacao, ariaSort, manterOrdem, ordenarLinhas, type DefGrupo, type GrupoLinhas, type Ordenacao, type TipoColuna } from '../lib/ordenar';
import './tabela-dados.css';

export interface ColunaTabela<T> {
  chave: string;
  titulo: string;
  tipo: TipoColuna;
  /** Padrão: 'direita' para 'numero', 'esquerda' para 'texto'. */
  alinhamento?: 'esquerda' | 'direita' | 'centro';
  /** Conteúdo da célula. Padrão: o valor. O 2º argumento traz o estado/gatilho da linha expansível. */
  render?: (linha: T, ctx: ContextoLinha) => React.ReactNode;
  /** Conteúdo do <th> quando a coluna NÃO é ordenável (ex.: caixa "marcar todos"). Padrão: o título. */
  cabecalho?: React.ReactNode;
  /** Compara dois valores NÃO vazios em ordem crescente (vazios vão para o fim sem passar por ele). */
  comparador?: (a: any, b: any) => number;
  /** Valor usado na ordenação. Padrão: linha[chave]. */
  valor?: (linha: T) => unknown;
  /** Classe extra da célula (td). */
  classe?: string;
  /** false = título sem botão de ordenar. */
  ordenavel?: boolean;
}

/** Estado da linha passado ao `render` das colunas. */
export interface ContextoLinha {
  expandida: boolean;
  /** Para espalhar no <button> que abre/fecha a linha (aria-expanded + aria-controls + onClick). Vazio sem aoAlternarExpansao. */
  gatilho: { 'aria-expanded'?: boolean; 'aria-controls'?: string; onClick?: () => void };
}

/** id da <tr> de detalhe de uma linha (para aria-controls fora do render). */
export const idExpansao = (idTabela: string, chave: React.Key) => `${idTabela}-exp-${String(chave).replace(/[^A-Za-z0-9_-]/g, '_')}`;

export interface TabelaDadosProps<T> {
  colunas: ColunaTabela<T>[];
  linhas: readonly T[];
  chaveLinha: (linha: T) => React.Key;
  /** Ordenação inicial no modo interno. */
  ordenacaoPadrao?: Ordenacao | null;
  /** Modo controlado: a ordenação vem de fora e cada clique chama aoOrdenar. */
  ordenacao?: Ordenacao | null;
  aoOrdenar?: (o: Ordenacao) => void;
  /** Linha clicável (mouse, Enter e Espaço). */
  aoClicarLinha?: (linha: T) => void;
  /** Rótulo acessível da linha clicável (ex.: "Abrir Comprimento"). */
  rotuloLinha?: (linha: T) => string;
  classeLinha?: (linha: T) => string | undefined;
  /** Classe extra da <table>. */
  className?: string;
  /** Legenda para leitores de tela. */
  legenda?: string;
  /** 'propria' (padrão): a moldura rola e o cabeçalho gruda nela. 'container': gruda no ancestral rolável (ver topo do arquivo). */
  rolagem?: 'propria' | 'container';
  /** Grupos de linhas, na ordem em que aparecem (ver topo do arquivo). */
  grupos?: DefGrupo[];
  /** Chave do grupo de cada linha (obrigatório com `grupos`). */
  grupoDaLinha?: (linha: T) => string | null | undefined;
  /** Mostra grupos sem linhas (com "Nenhum item."). Padrão: false. */
  mostrarVazios?: boolean;
  /** Congela a ordem atual (além do congelamento automático por foco num campo do <tbody>). */
  congelarOrdem?: boolean;
  /**
   * Linha expansível (estado da tela, pela chave estável). Duas formas: função `(linha) => boolean` (várias abertas) OU a chave da
   * ÚNICA linha aberta (`React.Key | null`, compat DIREITA §31.4 — compara com `chaveLinha(linha)`).
   */
  expandida?: ((linha: T) => boolean) | React.Key | null;
  /** Conteúdo da linha de detalhe (uma <td colSpan=total>). */
  renderExpansao?: (linha: T) => React.ReactNode;
  /** Sinônimo de `renderExpansao` (compat DIREITA §31.4). Se os dois vierem, vale `renderExpansao`. */
  detalheLinha?: (linha: T) => React.ReactNode;
  /** Chamado pelo gatilho (ctx.gatilho.onClick) para abrir/fechar a linha. */
  aoAlternarExpansao?: (linha: T) => void;
  /** Prefixo estável dos ids (linhas de detalhe). Padrão: React.useId(). */
  idTabela?: string;
}

/**
 * Indicador de ordenação (19/11, parecer do Jhony: as setas antigas ▲ ▼ ↕ pareciam pontuação). Família Lucide (a do módulo), 13 px, traço 2:
 * coluna NÃO ativa = duas setas (↑↓) em cinza legível; ativa = UMA seta (↑ crescente / ↓ decrescente) na cor de destaque. Exportado para as telas
 * que desenham o próprio cabeçalho (ex.: Matriz do Vincular) usarem o MESMO ícone.
 */
export function IconeOrdenacao({ estado }: { estado: 'ascending' | 'descending' | 'none' }) {
  const p = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <span className={`at-td__seta ${estado === 'none' ? 'at-td__seta--inativa' : 'at-td__seta--ativa'}`} aria-hidden data-ordem={estado}>
      <svg {...p} focusable="false">{estado === 'ascending' ? <><path d="m5 11 7-7 7 7" /><path d="M12 20V4" /></>
        : estado === 'descending' ? <><path d="M12 4v16" /><path d="m19 13-7 7-7-7" /></>
        : <><path d="m21 16-4 4-4-4" /><path d="M17 20V4" /><path d="m3 8 4-4 4 4" /><path d="M7 4v16" /></>}</svg>
    </span>);
}

const CAMPO = 'input, select, textarea, [contenteditable=""], [contenteditable="true"]';
const INTERATIVO = `${CAMPO}, button, a[href], label`;
const ehCampo = (el: EventTarget | null): boolean => el instanceof Element && !!el.closest('tbody') && el.matches(CAMPO);
const TODAS = '__todas';

const valorPadrao = (chave: string) => (linha: unknown) => (linha as Record<string, unknown>)[chave];

/** Ancestral rolável mais próximo (o "container" do sticky). */
function rolavel(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement ?? null; p; p = p.parentElement) {
    const s = getComputedStyle(p);
    if (/(auto|scroll|overlay|hidden)/.test(s.overflowY) || /(auto|scroll|overlay|hidden)/.test(s.overflowX)) return p;
  }
  return null;
}

export function TabelaDados<T>({ colunas, linhas, chaveLinha, ordenacaoPadrao = null, ordenacao, aoOrdenar, aoClicarLinha, rotuloLinha, classeLinha, className, legenda, rolagem = 'propria',
  grupos, grupoDaLinha, mostrarVazios = false, congelarOrdem = false, expandida, renderExpansao: renderExpansaoProp, detalheLinha, aoAlternarExpansao, idTabela }: TabelaDadosProps<T>) {
  const renderExpansao = renderExpansaoProp ?? detalheLinha;
  const estaAberta = (l: T, chave: React.Key): boolean => typeof expandida === 'function' ? !!expandida(l) : expandida !== undefined && expandida !== null && String(expandida) === String(chave);
  const controlado = ordenacao !== undefined;
  const [interna, setInterna] = React.useState<Ordenacao | null>(ordenacaoPadrao);
  const atual = controlado ? ordenacao : interna;
  const ordenar = (chave: string) => { const o = alternarOrdenacao(atual, chave); if (!controlado) setInterna(o); aoOrdenar?.(o); };

  const comGrupos = !!grupos && !!grupoDaLinha;
  const calculado = React.useMemo<GrupoLinhas<T>[]>(() => {
    const col = atual ? colunas.find((c) => c.chave === atual.chave) : undefined;
    const espec = atual && col ? { valor: col.valor ?? (valorPadrao(col.chave) as (l: T) => unknown), tipo: col.tipo, comparador: col.comparador } : null;
    if (comGrupos) return agruparOrdenado(linhas, grupos!, grupoDaLinha!, espec, atual?.direcao ?? 'asc', mostrarVazios);
    return [{ chave: TODAS, titulo: '', linhas: espec ? ordenarLinhas(linhas, espec, atual!.direcao) : [...linhas] }];
  }, [linhas, colunas, atual, comGrupos, grupos, grupoDaLinha, mostrarVazios]);

  // Congelamento: enquanto um campo do <tbody> tem o foco (ou congelarOrdem), as linhas ficam onde estavam.
  const [editando, setEditando] = React.useState(false);
  const congelar = congelarOrdem || editando;
  const anterior = React.useRef<GrupoLinhas<T>[] | null>(null);
  const exibido = React.useMemo(() => (congelar && anterior.current ? manterOrdem(anterior.current, calculado, chaveLinha) : calculado),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [congelar, calculado]);
  React.useEffect(() => { anterior.current = exibido; });
  const uid = React.useId();
  const idBase = idTabela ?? `td${uid.replace(/[^A-Za-z0-9_-]/g, '')}`;

  // Sombra do cabeçalho quando a tabela já rolou para baixo do topo do container; rolagem horizontal só se não couber.
  const moldura = React.useRef<HTMLDivElement>(null);
  const tabela = React.useRef<HTMLTableElement>(null);
  const [rolando, setRolando] = React.useState(false);
  const [larga, setLarga] = React.useState(false);
  React.useEffect(() => {
    const m = moldura.current, t = tabela.current; if (!m || !t) return;
    const raiz = rolagem === 'propria' ? m : rolavel(m);
    let quadro = 0;
    const medir = () => {
      quadro = 0;
      const topo = raiz ? raiz.getBoundingClientRect().top : 0;
      const r = t.getBoundingClientRect();
      setRolando(r.top < topo - 0.5 && r.bottom > topo);
      setLarga(t.offsetWidth > m.clientWidth + 1);
    };
    const agendar = () => { if (!quadro) quadro = requestAnimationFrame(medir); };
    const alvo: HTMLElement | Window = raiz ?? window;
    alvo.addEventListener('scroll', agendar, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(agendar) : null;
    ro?.observe(m); ro?.observe(t);
    medir();
    return () => { alvo.removeEventListener('scroll', agendar); ro?.disconnect(); if (quadro) cancelAnimationFrame(quadro); };
  }, [rolagem]);

  const alinhar = (c: ColunaTabela<T>) => c.alinhamento ?? (c.tipo === 'numero' ? 'direita' : 'esquerda');
  const clicavel = !!aoClicarLinha;
  const linha = (l: T, par: boolean) => {
    const chave = chaveLinha(l);
    const aberta = estaAberta(l, chave) && !!renderExpansao;
    const idExp = idExpansao(idBase, chave);
    const ctx: ContextoLinha = {
      expandida: aberta,
      gatilho: aoAlternarExpansao ? { 'aria-expanded': aberta, 'aria-controls': idExp, onClick: () => aoAlternarExpansao(l) } : {},
    };
    const classeZebra = par ? 'at-td__linha--par' : '';
    return (
      <React.Fragment key={chave}>
        <tr data-chave={String(chave)} data-expandida={aberta ? '1' : undefined} className={`at-td__linha ${classeZebra} ${clicavel ? 'at-td__linha--clicavel' : ''} ${aberta ? 'at-td__linha--aberta' : ''} ${classeLinha?.(l) ?? ''}`}
          tabIndex={clicavel ? 0 : undefined} aria-label={clicavel ? rotuloLinha?.(l) : undefined}
          onClick={clicavel ? (e) => { if (!(e.target instanceof Element && e.target !== e.currentTarget && e.target.closest(INTERATIVO))) aoClicarLinha!(l); } : undefined}
          onKeyDown={clicavel ? (e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); aoClicarLinha!(l); } } : undefined}>
          {colunas.map((c) => (
            <td key={c.chave} className={`at-td--${alinhar(c)} ${c.classe ?? ''}`}>
              {c.render ? c.render(l, ctx) : String((c.valor ?? valorPadrao(c.chave))(l) ?? '')}
            </td>
          ))}
        </tr>
        {aberta && (
          <tr id={idExp} data-detalhe-de={String(chave)} className={`at-td__expansao ${classeZebra}`}>
            <td colSpan={colunas.length} className="at-td__expansao-cel">{renderExpansao!(l)}</td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <div ref={moldura} className="at-td" data-rolagem={rolagem} data-rolando={rolando ? '1' : '0'} data-larga={larga ? '1' : '0'}>
      <table ref={tabela} className={`at-td__tabela ${className ?? ''}`}
        onFocus={(e) => { if (ehCampo(e.target)) setEditando(true); }}
        onBlur={(e) => { const r = e.relatedTarget; if (!(r instanceof Element && r.closest('tbody') && e.currentTarget.contains(r))) setEditando(false); }}>
        {legenda && <caption className="bl-so-leitor">{legenda}</caption>}
        <thead>
          <tr>
            {colunas.map((c) => {
              const sort = ariaSort(atual, c.chave);
              const ordenavel = c.ordenavel !== false;
              return (
                <th key={c.chave} scope="col" className={`at-td__th at-td--${alinhar(c)}`} aria-sort={ordenavel ? sort : undefined} data-coluna={c.chave}>
                  {ordenavel ? (
                    <button type="button" className="at-td__ordenar" onClick={() => ordenar(c.chave)}>
                      <span>{c.titulo}</span>
                      <IconeOrdenacao estado={sort} />
                    </button>
                  ) : (c.cabecalho ?? c.titulo)}
                </th>
              );
            })}
          </tr>
        </thead>
        {exibido.map((g, gi) => (
          <tbody key={g.chave} className="at-td__corpo" data-grupo={comGrupos ? g.chave : undefined}>
            {comGrupos && (
              <tr className="at-td__grupo">
                <th scope="rowgroup" colSpan={colunas.length} id={`${uid}g${gi}`}>
                  <span className="at-td__grupo-titulo">{g.titulo}</span> <span className="at-td__grupo-n" aria-label={`${g.linhas.length} ${g.linhas.length === 1 ? 'item' : 'itens'}`}>{g.linhas.length}</span>
                </th>
              </tr>
            )}
            {g.linhas.map((l, i) => linha(l, i % 2 === 1))}
            {comGrupos && g.linhas.length === 0 && <tr className="at-td__linha"><td colSpan={colunas.length} className="at-td__vazio">Nenhum item.</td></tr>}
          </tbody>
        ))}
      </table>
    </div>
  );
}
