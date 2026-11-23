// panel-atributos/src/screens/VisaoGeral.tsx — VISÃO GERAL V2 (ESQUERDA, dona desde 19/11 com o OK do Jhony; briefing BRIEFING-VISAO-GERAL-V2 +
// MOCKUP-VISAO-GERAL-V2 aprovado). Só APRESENTAÇÃO: os números, as regras e os destinos são os do servidor e os já usados (lib/visaoGeral.ts).
//  · faixa ÚNICA de indicadores (ícone Feather/Lucide de traço fino + número + rótulo + complemento), cada um abre a lista correspondente;
//  · "Cobertura por subcategoria" = TabelaDados (uma linha por subcategoria): Subcategoria | Produtos ▼ | Com kit específico | Essencial médio,
//    ordenação numérica pelo valor de base sobre o conjunto inteiro, controle "Colunas" (só colunas reais por subcategoria; preferência local);
//  · "Obrigatórios sem valor" à direita, alinhado ao topo da grade: Atributo | Produtos ▼; critério no ícone de informação.
// TRAVAMENTO (padrão do Jhony): da barra verde até o cabeçalho das colunas fica tudo travado — título e abas (módulo), faixa de indicadores e a
// linha com as cabeças dos dois cartões vão para o <CabecalhoTravado> (CIMA, e4ee5f48); o cabeçalho das colunas da grade gruda logo abaixo dele
// (TabelaDados rolagem="container") e o painel da direita fica parado na mesma altura. Só as linhas da grade rolam (a página rola).
// Pesos: 400 nas linhas/valores/links; 500 no máximo em títulos, cabeçalhos e números dos indicadores (screens/visao-geral.css).
import React from 'react';
import type { VisaoGeral as TVisao } from '../lib/tipos';
import { obter } from '../lib/api';
import { rotuloCategoria, rotuloSubcategoria } from '../lib/rotulos';
import { useModulo } from '../app/contexto';
import { CabecalhoTravado, Carregando, Erro } from '../ui/Comuns';
import { TabelaDados, type ColunaTabela } from '../ui/TabelaDados';
import {
  alternarColuna, CHAVE_PREFERENCIA_COLUNAS, COLUNAS_COBERTURA, colunasValidas, filtroDaCobertura, indicadores, inteiro, linhasCobertura, pctKit,
  pctServidor, textoSubcategorias, type DestinoIndicador, type IconeIndicador, type IdColuna, type LinhaCobertura,
} from '../lib/visaoGeral';
import './visao-geral.css';

type Obrigatorio = TVisao['obrigatorios_mais_vazios'][number];

/** Ícones dos indicadores: família Feather/Lucide (a do menu lateral e do ui/Icones.tsx), viewBox 24, traço fino (1.5), currentColor. */
const DESENHO: Record<IconeIndicador | 'colunas' | 'seta' | 'info', React.ReactNode> = {
  caixa: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>,
  'camadas-menos': <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 12 12 17 15 15.5" /><polyline points="2 17 12 22 14 21" /><line x1="16" y1="19" x2="22" y2="19" /></>,
  'lista-conferida': <><path d="m3 7 2 2 4-4" /><path d="m3 17 2 2 4-4" /><line x1="13" y1="6" x2="21" y2="6" /><line x1="13" y1="12" x2="21" y2="12" /><line x1="13" y1="18" x2="21" y2="18" /></>,
  'imagem-riscada': <><line x1="2" y1="2" x2="22" y2="22" /><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83" /><line x1="13.5" y1="13.5" x2="6" y2="21" /><line x1="18" y1="12" x2="21" y2="15" /><path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.05-.22 1.41-.59" /><path d="M21 15V5a2 2 0 0 0-2-2H9" /></>,
  prancheta: <><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><line x1="12" y1="11" x2="16" y2="11" /><line x1="12" y1="16" x2="16" y2="16" /><line x1="8" y1="11" x2="8.01" y2="11" /><line x1="8" y1="16" x2="8.01" y2="16" /></>,
  colunas: <><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></>,
  seta: <polyline points="6 9 12 15 18 9" />,
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
};
function Ic({ nome, tam = 18 }: { nome: keyof typeof DESENHO; tam?: number }) {
  return <svg className="at-vg__ic" width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">{DESENHO[nome]}</svg>;
}

/** Popover acessível (botão com aria-expanded; Esc e clique fora fecham e o foco volta ao botão). */
function usePopover() {
  const [aberto, setAberto] = React.useState(false);
  const raiz = React.useRef<HTMLDivElement>(null); const botao = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') { setAberto(false); botao.current?.focus(); } };
    document.addEventListener('mousedown', fora); document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', tecla); };
  }, [aberto]);
  return { aberto, setAberto, raiz, botao };
}

function SeletorColunas({ visiveis, aoMudar }: { visiveis: IdColuna[]; aoMudar: (v: IdColuna[]) => void }) {
  const p = usePopover(); const id = React.useId();
  return (
    <div className="at-vg__pop" ref={p.raiz}>
      <button ref={p.botao} type="button" className="at-vg__botao" aria-haspopup="true" aria-expanded={p.aberto} aria-controls={id} onClick={() => p.setAberto(!p.aberto)} data-botao-colunas>
        <Ic nome="colunas" tam={16} /><span>Colunas</span><Ic nome="seta" tam={14} />
      </button>
      {p.aberto && (
        <fieldset id={id} className="at-vg__menu" data-colunas>
          <legend className="bl-so-leitor">Colunas visíveis da cobertura por subcategoria</legend>
          {COLUNAS_COBERTURA.map((c) => (
            <label key={c.id} className={`at-vg__opcao ${c.fixa ? 'at-vg__opcao--fixa' : ''}`} title={c.fixa ? 'Sempre visível (identifica a linha)' : undefined}>
              <input type="checkbox" checked={visiveis.includes(c.id)} disabled={c.fixa} onChange={() => aoMudar(alternarColuna(visiveis, c.id))} data-coluna-opcao={c.id} />
              <span>{c.rotulo}</span>
            </label>))}
        </fieldset>)}
    </div>);
}

const TEXTO_CRITERIO = 'Obrigatório vem da importância "Campos Obrigatórios" do legado (A3) e pode ser ajustado por kit. Cada número conta os produtos ativos sem valor naquele atributo; um produto pode aparecer em mais de um atributo, então os números não se somam.';
function Informacao() {
  const p = usePopover(); const id = React.useId();
  return (
    <div className="at-vg__pop" ref={p.raiz}>
      <button ref={p.botao} type="button" className="at-vg__info" aria-label="Sobre o critério de obrigatório" aria-expanded={p.aberto} aria-controls={id} title={TEXTO_CRITERIO} onClick={() => p.setAberto(!p.aberto)} data-botao-info>
        <Ic nome="info" tam={16} />
      </button>
      {p.aberto && <div id={id} role="note" className="at-vg__menu at-vg__nota-info" data-criterio>{TEXTO_CRITERIO}</div>}
    </div>);
}

function lerPreferencia(): IdColuna[] {
  try { const v = window.localStorage.getItem(CHAVE_PREFERENCIA_COLUNAS); return colunasValidas(v ? JSON.parse(v) : null); } catch { return colunasValidas(null); }
}

export function VisaoGeral() {
  const m = useModulo();
  const [d, setD] = React.useState<TVisao | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [visiveis, setVisiveis] = React.useState<IdColuna[]>(lerPreferencia);
  const seq = React.useRef(0);   // resposta atrasada não sobrescreve a mais nova (DIREITA)
  const carregar = React.useCallback(() => {
    const t = ++seq.current; setErro(null);
    obter<TVisao>('visao_geral').then((r) => { if (t === seq.current) setD(r); }).catch((e) => { if (t === seq.current) setErro(e.message); });
  }, []);
  React.useEffect(() => { carregar(); return () => { seq.current++; }; }, [carregar, m.versao]);
  const mudarColunas = (v: IdColuna[]) => { setVisiveis(v); try { window.localStorage.setItem(CHAVE_PREFERENCIA_COLUNAS, JSON.stringify(v)); } catch { /* sem armazenamento: vale só nesta visita */ } };
  const ir = (x: DestinoIndicador) => (x.tipo === 'produtos' ? m.ir('produtos', { filtro: x.filtro }) : m.ir('conferencia'));

  const linhas = React.useMemo(() => (d ? linhasCobertura(d.cobertura) : []), [d]);
  const colunas = React.useMemo<ColunaTabela<LinhaCobertura>[]>(() => {
    const todas: Record<IdColuna, ColunaTabela<LinhaCobertura>> = {
      subcategoria: { chave: 'subcategoria', titulo: 'Subcategoria', tipo: 'texto', valor: (l) => rotuloSubcategoria(l.subcategoria), classe: 'at-vg__nome', render: (l) => rotuloSubcategoria(l.subcategoria) },
      categoria: { chave: 'categoria', titulo: 'Categoria', tipo: 'texto', valor: (l) => rotuloCategoria(l.categoria), classe: 'at-vg__nome', render: (l) => rotuloCategoria(l.categoria) },
      produtos: { chave: 'produtos', titulo: 'Produtos', tipo: 'numero', valor: (l) => l.produtos, render: (l) => inteiro(l.produtos) },
      com_kit_pct: { chave: 'com_kit_pct', titulo: 'Com kit específico', tipo: 'numero', valor: (l) => l.comKitRazao, render: (l) => pctKit(l.comKitRazao) },
      com_kit_n: { chave: 'com_kit_n', titulo: 'Com kit específico (produtos)', tipo: 'numero', valor: (l) => l.comKit, render: (l) => inteiro(l.comKit) },
      sem_kit_n: { chave: 'sem_kit_n', titulo: 'Sem kit específico (produtos)', tipo: 'numero', valor: (l) => l.semKit, render: (l) => inteiro(l.semKit) },
      essencial: { chave: 'essencial', titulo: 'Essencial médio', tipo: 'numero', valor: (l) => l.essencial, render: (l) => (l.essencial === null ? <span className="at-vg__fraco" title="Sem base: nenhum produto com atributos essenciais">—</span> : pctServidor(l.essencial)) },
    };
    return COLUNAS_COBERTURA.filter((c) => visiveis.includes(c.id)).map((c) => todas[c.id]);
  }, [visiveis]);
  const colunasObr = React.useMemo<ColunaTabela<Obrigatorio>[]>(() => [
    { chave: 'rotulo', titulo: 'Atributo', tipo: 'texto', classe: 'at-vg__nome',
      render: (o) => <button type="button" className="at-vg__link" onClick={() => m.ir('conferencia')} title={`Abrir a Conferência (obrigatórios vazios): ${o.rotulo}`}>{o.rotulo}</button> },
    { chave: 'produtos', titulo: 'Produtos', tipo: 'numero', render: (o) => inteiro(o.produtos) },
  ], [m]);

  if (erro) return <Erro mensagem={erro} aoTentar={carregar} />;
  if (!d) return <Carregando rotulo="Calculando a visão geral" />;

  return (
    <div className="at-vg">
      <CabecalhoTravado>
        <ul className="at-vg__indicadores" aria-label="Indicadores">
          {indicadores(d.cartoes).map((k) => (
            <li key={k.id}>
              <button type="button" className="at-vg__indicador" onClick={() => ir(k.destino)} title={k.dica} data-indicador={k.id}
                aria-label={`${k.rotulo}: ${k.valor}${k.complemento ? ` (${k.complemento})` : ''}`}>
                <span className="at-vg__indicador-ic"><Ic nome={k.icone} tam={30} /></span>
                <span className={`at-vg__indicador-n ${k.semBase ? 'at-vg__fraco' : ''}`}>{k.valor}</span>
                <span className="at-vg__indicador-txt"><span className="at-vg__indicador-rot">{k.rotulo}</span>{k.complemento && <span className="at-vg__indicador-comp">{k.complemento}</span>}</span>
              </button>
            </li>))}
        </ul>
        <div className="at-vg__colunas at-vg__cabecas">
          <div className="at-vg__cabeca" data-cabeca="cobertura">
            <h3>Cobertura por subcategoria</h3>
            <span className="at-vg__contador" data-contador>{textoSubcategorias(linhas.length)}</span>
            <span className="at-vg__espaco" />
            <span className="at-vg__nota">Essencial: obrigatórios + importantes</span>
            <SeletorColunas visiveis={visiveis} aoMudar={mudarColunas} />
          </div>
          <div className="at-vg__cabeca" data-cabeca="obrigatorios"><h3>Obrigatórios sem valor</h3><Informacao /></div>
        </div>
      </CabecalhoTravado>
      <div className="at-vg__colunas">
        <section className="at-vg__cartao" aria-label="Cobertura por subcategoria" data-cartao="cobertura">
          {linhas.length === 0 ? <p className="at-vg__fraco at-vg__vazio">Nenhum produto ativo para agrupar.</p> : (
            <TabelaDados rolagem="container" colunas={colunas} linhas={linhas} chaveLinha={(l) => l.chave} legenda="Cobertura por subcategoria" idTabela="at-vg-cobertura"
              ordenacaoPadrao={{ chave: 'produtos', direcao: 'desc' }} className="at-vg__tabela"
              aoClicarLinha={(l) => m.ir('produtos', { filtro: filtroDaCobertura(l) })}
              rotuloLinha={(l) => `Abrir os produtos de ${rotuloSubcategoria(l.subcategoria)} (${rotuloCategoria(l.categoria)})`} />)}
        </section>
        <aside className="at-vg__cartao at-vg__cartao--lado" aria-label="Obrigatórios sem valor" data-cartao="obrigatorios">
          {/* janela estreita (≤ 960 px): os cartões empilham e a cabeça vem para o próprio cartão (no bloco travado ela fica escondida) */}
          <div className="at-vg__cabeca at-vg__cabeca--local"><h3>Obrigatórios sem valor</h3><Informacao /></div>
          {d.obrigatorios_mais_vazios.length === 0 ? <p className="at-vg__fraco at-vg__vazio">Nenhum obrigatório sem valor.</p> : (
            <TabelaDados rolagem="container" colunas={colunasObr} linhas={d.obrigatorios_mais_vazios} chaveLinha={(o) => o.atributo_id} legenda="Obrigatórios sem valor"
              idTabela="at-vg-obrigatorios" ordenacaoPadrao={{ chave: 'produtos', direcao: 'desc' }} className="at-vg__tabela" />)}
        </aside>
      </div>
    </div>
  );
}
