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

export function App({ rotaInicial }: { rotaInicial?: string } = {}) {
  // Endereço próprio por tela (18/11): o estado inicial vem do hash (#/panel-atributos/<tela> · /produto/<id> · /kits/<id>)
  // tela inicial: a rota que o menu lateral mandou (config.route) > o endereço atual > Produtos
  const inicial = React.useMemo(() => lerRota(rotaInicial ?? '') ?? lerRota(window.location.hash) ?? { aba: 'produtos' as Aba, produto: null, kit: null }, [rotaInicial]);
  const [aba, setAba] = React.useState<Aba>(inicial.aba);
  const [produto, setProduto] = React.useState<number | null>(inicial.produto);
  const [kit, setKit] = React.useState<number | null>(inicial.kit);
  const [filtro, setFiltro] = React.useState<FiltroProdutos>({});
  const [selecao, setSelecao] = React.useState<number[]>([]);
  const [preencher, setPreencher] = React.useState<{ kit?: number; subcategoria?: string }>({});
  const [avisos, setAvisos] = React.useState<{ id: number; texto: string; tom: string }[]>([]);
  const [versao, setVersao] = React.useState(0);
  const raiz = React.useRef<HTMLDivElement>(null);

  // estado → endereço: troca de tela = NOVA entrada no histórico (pushState; Voltar funciona); só normalizar o mesmo estado
  // (#/panel-atributos → #/panel-atributos/produtos) usa replaceState. pushState não dispara evento: nem o shell nem este painel
  // reagem ao próprio registro. O shell trata Voltar/Avançar dentro do MESMO painel sem remontar (guarda do mesmo painel).
  const montado = React.useRef(false);
  React.useEffect(() => { const t = window.setTimeout(() => { montado.current = true; }, 0); return () => window.clearTimeout(t); }, []);
  React.useEffect(() => {
    const alvo = rotaDe({ aba, produto, kit });
    if (window.location.hash === alvo) return;
    const atual = lerRota(window.location.hash);
    const url = window.location.pathname + window.location.search + alvo;
    if (atual && atual.aba === aba && atual.produto === produto && atual.kit === kit) window.history.replaceState(window.history.state, '', url);
    else if (!montado.current) window.history.pushState(window.history.state, '', url);   // na MONTAGEM: sem evento (um evento aqui faria o shell remontar)
    else window.location.hash = alvo;   // troca de tela DEPOIS de montado: nova entrada + hashchange/popstate → o destaque do menu acompanha (mesmo painel: o shell não remonta)
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
      raiz.current?.scrollTo({ top: 0 });
    },
    abrirProduto: (id) => { setProduto(id); raiz.current?.scrollTo({ top: 0 }); },
    fecharProduto: () => setProduto(null),
    aviso: (texto, tom = 'sucesso') => { const id = Date.now() + Math.random(); setAvisos((a) => [...a, { id, texto, tom }]); window.setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4500); },
  }), [aba, produto, kit, filtro, selecao, preencher, versao]);

  const tela = produto !== null ? <Ficha id={produto} />
    : aba === 'visao' ? <VisaoGeral /> : aba === 'produtos' ? <Produtos /> : aba === 'vincular' ? <Vincular /> : aba === 'preencher' ? <Preencher />
    : aba === 'kits' ? <Kits /> : aba === 'atributos' ? <Dicionario /> : aba === 'unidades' ? <Unidades /> : <Conferencia />;

  return (
    <Contexto.Provider value={nav}>
      <div data-bl-root className="at-raiz" ref={raiz}>
        <header className="at-cabecalho">
          <div className="at-cabecalho__titulo">
            <h1>Produtos &amp; Atributos</h1>
            <p>Especificação técnica (banco de atributos DSHOW) · preço e valores comerciais vêm do Precifica</p>
          </div>
          <nav className="at-nav" aria-label="Seções do módulo">
            {ABAS.map((a) => (
              <button key={a.id} type="button" className={`at-nav__item ${aba === a.id && produto === null ? 'ativo' : ''}`} aria-current={aba === a.id && produto === null ? 'page' : undefined}
                onClick={() => nav.ir(a.id)}>{a.rotulo}</button>
            ))}
          </nav>
        </header>
        <main className="at-conteudo">{tela}</main>
        <div className="at-avisos" aria-live="polite">{avisos.map((a) => <div key={a.id} className={`at-aviso at-aviso--${a.tom}`}>{a.texto}</div>)}</div>
      </div>
    </Contexto.Provider>
  );
}
