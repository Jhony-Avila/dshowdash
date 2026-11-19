// panel-atributos/src/app/App.tsx — casca do módulo: navegação (Visão geral · Produtos · Vincular · Preencher · Kits · Atributos · Unidades ·
// Conferência), ficha do produto por cima da aba atual, avisos. Cada tela carrega os próprios dados (estados carregando/vazio/erro).
import React from 'react';
import { ABAS, Aba, Contexto, FiltroProdutos, Navegar } from './contexto';
import { lerRota, rotaDe } from '../lib/rota';
import { VisaoGeral } from '../screens/VisaoGeral';
import { Produtos } from '../screens/Produtos';
import { Ficha } from '../screens/Ficha';
import { Vincular } from '../screens/Vincular';
import { Preencher } from '../screens/Preencher';
import { Kits } from '../screens/Kits';
import { Dicionario } from '../screens/Dicionario';
import { Unidades } from '../screens/Unidades';
import { Conferencia } from '../screens/Conferencia';
import { Icone, ICONE_ABA } from '../ui/Icones';

/** UX-1b: título e descrição de cada tela (mapa ÚNICO; as telas não desenham mais o próprio título/descrição). Na ficha: "Produtos", sem descrição. */
export const TELAS: Record<Aba, { titulo: string; descricao: string }> = {
  visao: { titulo: 'Visão geral', descricao: 'Como está a especificação técnica dos produtos ativos. Cada número leva à lista correspondente.' },
  produtos: { titulo: 'Produtos', descricao: 'Busque pelo nome ou código. Clique no produto para abrir a ficha.' },
  vincular: { titulo: 'Vincular', descricao: 'Aplique kits ou atributos avulsos a vários produtos de uma vez. Nada é gravado antes da prévia.' },
  preencher: { titulo: 'Preencher', descricao: 'Escolha um kit ou uma subcategoria. Setas ↑↓ mudam de linha, Tab muda de coluna, Enter grava e desce. Sugestões aparecem apagadas na célula.' },
  kits: { titulo: 'Kits', descricao: 'Cada kit é um conjunto de atributos que vale para as subcategorias escolhidas, para produtos avulsos ou para todos os produtos. Kits não são apagados: só desativados.' },
  atributos: { titulo: 'Atributos', descricao: 'Dicionário de características dos produtos. O código é gerado pelo sistema na criação e nunca muda (é o contrato com o app).' },
  unidades: { titulo: 'Unidades', descricao: 'Unidades de medida usadas nos atributos numéricos, agrupadas por grandeza. Fator: valor × fator = valor na unidade base da grandeza.' },
  conferencia: { titulo: 'Conferência', descricao: 'Filas com ação direta. Nada vira valor sem decisão; cada decisão fica no histórico do produto.' },
};


export function App({ rotaInicial }: { rotaInicial?: string } = {}) {
  // Endereço próprio por tela (18/11): o estado inicial vem do hash (#/panel-atributos/<tela> · /produto/<id> · /kits/<id>)
  // tela inicial: a rota que o menu lateral mandou (config.route) > o endereço atual > Produtos
  const inicial = React.useMemo(() => lerRota(rotaInicial ?? '') ?? lerRota(window.location.hash) ?? { aba: 'produtos' as Aba, produto: null, kit: null }, [rotaInicial]);
  const [aba, setAba] = React.useState<Aba>(inicial.aba);
  const [produto, setProduto] = React.useState<number | null>(inicial.produto);
  const [kit, setKit] = React.useState<number | null>(inicial.kit);
  const [filtro, setFiltro] = React.useState<FiltroProdutos>({});
  const [intencaoVincular, setIntencaoVincular] = React.useState<'kit' | 'atributo' | null>(null);
  // UX-1: atributo a focar na ficha — de m.abrirProduto(id, { atributo }) ou do endereço #/panel-atributos/produto/<id>?atributo=<id>
  const [atributoFoco, setAtributoFoco] = React.useState<number | null>(() => { const m = /[?&]atributo=([1-9][0-9]{0,9})\b/.exec(window.location.hash); return m ? Number(m[1]) : null; });
  const [selecao, setSelecao] = React.useState<number[]>([]);
  const [preencher, setPreencher] = React.useState<{ kit?: number; subcategoria?: string }>({});
  const [avisos, setAvisos] = React.useState<{ id: number; texto: string; tom: string }[]>([]);
  const [versao, setVersao] = React.useState(0);
  // UX-1b (refeito, 18/11 à noite): SEM cálculo de altura em JS. Quem rola é a PÁGINA (no shell: main#main). O bloco do topo
  // (título + abas + faixa fixa) é position: sticky; top: 0. O sticky só funciona se nenhum ancestral entre o módulo e o elemento que
  // rola for "contêiner de rolagem" (overflow ≠ visible/clip). Medido no harness: .dsd-container__body (auto) e #container-main
  // (hidden) quebram o sticky. Quando o 1º evento de rolagem revela QUEM rola, esses intermediários passam a overflow: clip (recorta
  // igual, sem virar contêiner de rolagem) e voltam ao original quando o módulo desmonta. Se nada disso funcionar, o cabeçalho só
  // não gruda: o layout não quebra (nenhuma altura é fixada).
  // Única medição: a altura do bloco fixo (ResizeObserver) → --at-topo-fixo, onde grudam os cabeçalhos das tabelas.
  const fixo = React.useRef<HTMLDivElement>(null);
  const [slot, setSlot] = React.useState<HTMLDivElement | null>(null);
  const rolador = React.useRef<Element | null>(null);
  const [roladorEl, setRoladorEl] = React.useState<Element | null>(null);
  React.useEffect(() => {
    const r = raiz.current; if (!r) return;
    const trocados: [HTMLElement, string][] = [];
    const aoRolar = (ev: Event) => {
      const t = ev.target === document ? document.scrollingElement : ev.target;
      if (!(t instanceof Element) || !t.contains(r)) return;   // rolagem de dentro do módulo (carrossel, tabela larga): não é a página
      window.removeEventListener('scroll', aoRolar, true);
      rolador.current = t; setRoladorEl(t);
      for (let e = r.parentElement; e && e !== t; e = e.parentElement) {
        const c = getComputedStyle(e);
        if (!/^(visible|clip)$/.test(c.overflowY) || !/^(visible|clip)$/.test(c.overflowX)) { trocados.push([e, e.style.overflow]); e.style.overflow = 'clip'; }
      }
    };
    window.addEventListener('scroll', aoRolar, true);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => { if (fixo.current) r.style.setProperty('--at-topo-fixo', `${fixo.current.offsetHeight}px`); });
    if (ro && fixo.current) ro.observe(fixo.current);
    return () => { window.removeEventListener('scroll', aoRolar, true); ro?.disconnect(); for (const [e, v] of trocados) e.style.overflow = v; };
  }, []);
  const topo = () => { const t = rolador.current; if (t) t.scrollTo({ top: 0 }); };
  const raiz = React.useRef<HTMLDivElement>(null);

  // estado → endereço: troca de tela = NOVA entrada no histórico (pushState; Voltar funciona); só normalizar o mesmo estado
  // (#/panel-atributos → #/panel-atributos/produtos) usa replaceState. pushState não dispara evento: nem o shell nem este painel
  // reagem ao próprio registro. O shell trata Voltar/Avançar dentro do MESMO painel sem remontar (guarda do mesmo painel).
  React.useEffect(() => {
    const alvo = rotaDe({ aba, produto, kit });
    if (window.location.hash === alvo) return;
    const atual = lerRota(window.location.hash);
    const url = window.location.pathname + window.location.search + alvo;
    if (atual && atual.aba === aba && atual.produto === produto && atual.kit === kit) window.history.replaceState(window.history.state, '', url);
    // SEMPRE pushState (sem evento). Medido: qualquer evento de endereço (location.hash → hashchange/popstate) faz o shell REMONTAR o
    // painel e o estado se perde (filtro vindo da Visão geral, seleção de produtos). Efeito aceito: trocar de aba DENTRO do módulo não
    // muda o destaque do menu lateral (o clique no menu continua destacando o item).
    else window.history.pushState(window.history.state, '', url);
  }, [aba, produto, kit]);
  // endereço → estado: Voltar/Avançar (popstate), link colado ou hash editado (hashchange)
  React.useEffect(() => {
    const aoMudar = () => {
      const r = lerRota(window.location.hash); if (!r) return;
      setAba(r.aba); setProduto(r.produto); setKit(r.kit);
    };
    window.addEventListener('hashchange', aoMudar);
    window.addEventListener('popstate', aoMudar);
    return () => { window.removeEventListener('hashchange', aoMudar); window.removeEventListener('popstate', aoMudar); };
  }, []);

  const nav: Navegar = React.useMemo(() => ({
    aba, produto, kit, filtroInicial: filtro, selecao, setSelecao, preencher, versao,
    recarregar: () => setVersao((v) => v + 1),
    ir: (a, o = {}) => {
      setAba(a); setProduto(o.produto ?? null); setKit(o.kit ?? null);   // clicar na aba volta à lista (sem kit aberto)
      if (o.filtro) setFiltro(o.filtro); if (o.selecao) setSelecao(o.selecao); if (o.preencher) setPreencher(o.preencher);
      setIntencaoVincular(a === 'vincular' ? o.intencao ?? null : null);
      topo();
    },
    abrirProduto: (id, opc) => { setAtributoFoco(opc?.atributo ?? null); setProduto(id); topo(); },
    atributoFoco, limparAtributoFoco: () => setAtributoFoco(null), intencaoVincular,
    fecharProduto: () => setProduto(null),
    aviso: (texto, tom = 'sucesso') => { const id = Date.now() + Math.random(); setAvisos((a) => [...a, { id, texto, tom }]); window.setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4500); },
    faixaFixa: slot, rolador: roladorEl,
  }), [aba, produto, kit, filtro, selecao, preencher, versao, atributoFoco, intencaoVincular, slot, roladorEl]);   // eslint-disable-line react-hooks/exhaustive-deps

  const tela = produto !== null ? <Ficha id={produto} />
    : aba === 'visao' ? <VisaoGeral /> : aba === 'produtos' ? <Produtos /> : aba === 'vincular' ? <Vincular /> : aba === 'preencher' ? <Preencher />
    : aba === 'kits' ? <Kits /> : aba === 'atributos' ? <Dicionario /> : aba === 'unidades' ? <Unidades /> : <Conferencia />;

  return (
    <Contexto.Provider value={nav}>
      <div data-bl-root className="at-raiz" ref={raiz}>
        <div className="at-fixo" ref={fixo}>
          <header className={`at-cabecalho ${produto !== null ? 'at-cabecalho--uma-linha' : ''}`}>
            <div className="at-cabecalho__titulo">
              <h1>{produto !== null ? 'Produtos' : TELAS[aba].titulo}</h1>
              {produto === null && <p>{TELAS[aba].descricao}</p>}
            </div>
            <nav className="at-nav" aria-label="Seções do módulo">
              {ABAS.map((a) => (
                <button key={a.id} type="button" className={`at-nav__item ${aba === a.id && produto === null ? 'ativo' : ''}`} aria-current={aba === a.id && produto === null ? 'page' : undefined}
                  onClick={() => nav.ir(a.id)}><Icone nome={ICONE_ABA[a.id]} />{a.rotulo}</button>
              ))}
            </nav>
          </header>
          <div className="at-faixa-fixa" ref={setSlot} />
        </div>
        <main className="at-conteudo">{tela}</main>
        <div className="at-avisos" aria-live="polite">{avisos.map((a) => <div key={a.id} className={`at-aviso at-aviso--${a.tom}`}>{a.texto}</div>)}</div>
      </div>
    </Contexto.Provider>
  );
}
