// panel-atributos/src/screens/Produtos.tsx — lista de produtos (§11.2) · PACOTE A "Produtos · Tabela e Cartões" (briefing 23/11, pranchas 01/02/03/11).
// Faixa de ferramentas numa linha (busca · contagem · Situação · Filtros · [2200: Categoria e Kit] · Tabela|Cartões · Ordenar em Cartões), painel
// Filtros ancorado ao botão (não é modal; Esc fecha e devolve o foco), linha de etiquetas só com filtro ativo. Tabela (TabelaDados, larguras pela área
// real) e Cartões (grade auto-fill 340 px, altura fixa 250). Busca, filtros, ordem e página de 48 continuam NO CLIENTE sobre o `GET vitrine` (o
// endpoint não aceita parâmetros — A.0 §91): nenhuma ordenação nova (nome, ID, menos preenchidos), nenhuma mudança de servidor.
// UX-1c preservado: memória da lista ao voltar da Ficha (busca, filtros, modo, ordem, página, posição) e os estados de vazio (b).
// 26/11 (decisão do Jhony): o modo Tabela usa a tabela padrão do Dash — AG Grid Community (ProdutosGrade.tsx) no lugar da TabelaDados;
// a lista inteira filtrada (sem página de 48 neste modo), ordenação/filtro por coluna, colunas fixas, mostrar/ocultar, CSV. Mesma API.
import React from 'react';
import type { ProdutoResumo, Vitrine } from '../lib/tipos';
import { obter, urlFoto } from '../lib/api';
import { casaBusca, comparaMenosPreenchidos } from '../lib/formatar';
import { rotuloCategoria, rotuloSubcategoria, tituloFamilia } from '../lib/rotulos';
import { useModulo } from '../app/contexto';
import { CabecalhoTravado, ChipKit, Erro, Etiqueta, Botao } from '../ui/Comuns';
// AG Grid só carrega quando alguém abre o modo Tabela (chunk próprio `ag-grid`; o primeiro paint do painel não muda)
const ProdutosGrade = React.lazy(() => import('./ProdutosGrade').then((x) => ({ default: x.ProdutosGrade })));
import './produtos.css';

const POR_PAGINA = 48;   // §0.3: vale 48 (as pranchas mostram 50)
type Ordem = 'nome' | 'id' | 'preenchimento';
const SEM_SUB = '__sem__';   // "Sem subcategoria" (subcategoria nula) — diferente de "Todas"
const ROT_ORDEM: Record<Ordem, string> = { nome: 'Nome', id: 'ID', preenchimento: 'Menos preenchidos' };
/** Os seis filtros rápidos (A.1), na ordem do briefing. */
const RAPIDOS = [
  ['essencial', 'Essencial incompleto', 'Produtos com atributos essenciais aplicáveis ainda não preenchidos (os 0/0 ficam fora)'],
  ['semFoto', 'Sem foto', 'Produtos sem nenhuma foto publicada'],
  ['semKit', 'Sem kit', 'Produtos que só têm o kit Base (todos os produtos): nenhum kit específico'],
  ['obrigatorios', 'Com obrigatórios vazios', 'Produtos com algum atributo obrigatório sem valor'],
  ['fora', 'Com valores fora da ficha', 'Produtos com valores gravados em atributos que não estão na ficha deles'],
  ['precifica', 'Com ficha do Precifica', 'Produtos que têm ficha técnica no Precifica'],
] as const;

// Larguras de referência (A.2) com o menu aberto: área 1096 (1440) e 1856 (2200). Entre as duas, interpola; acima, a sobra vai para "ID e produto".
const COLS = ['sel', 'produto', 'subcategoria', 'kit', 'essenciais', 'obrigatorios', 'fotos', 'precifica'] as const;
const L1440 = [36, 340, 140, 132, 160, 104, 64, 120];
const L2200 = [36, 680, 230, 200, 220, 130, 90, 270];
const LARGURA_SITUACAO = 96;
export function largurasColunas(area: number, comSituacao: boolean): Record<string, number> {
  const t = Math.max(0, Math.min(1, (area - 1096) / (1856 - 1096)));
  const w = L1440.map((a, i) => Math.round(a + t * (L2200[i] - a)));
  const soma = w.reduce((s, x) => s + x, 0);
  w[1] = Math.max(200, w[1] + area - soma);   // a sobra (acima de 1856) vai para o nome; a FALTA (área < 1096, ex.: 1440 real) sai dele — senão a tabela vira "larga" e o cabeçalho não gruda
  const out: Record<string, number> = {}; COLS.forEach((c, i) => { out[c] = w[i]; });
  if (comSituacao) { out.produto = Math.max(200, out.produto - LARGURA_SITUACAO); out.situacao = LARGURA_SITUACAO; }
  return out;
}
/** A faixa mostra Categoria e Kit fora do painel Filtros só quando a área é larga (2200 com o menu aberto). Em 1440 tudo vai para Filtros. */
const AREA_LARGA = 1500;

export function Produtos() {
  const m = useModulo();
  const [dados, setDados] = React.useState<Vitrine | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  // UX-1: filtros da Visão geral (categoria, "Sem subcategoria" = '__sem__' ≠ Todas, essencial incompleto, ordem) → o número do cartão = o total da lista
  const inicialF = { busca: m.filtroInicial.busca ?? '', categoria: m.filtroInicial.categoria ?? '', subcategoria: m.filtroInicial.semSubcategoria ? SEM_SUB : (m.filtroInicial.subcategoria ?? ''), kit: m.filtroInicial.kit ?? '', situacao: 'ativos',
    semFoto: !!m.filtroInicial.semFoto, semKit: !!m.filtroInicial.semKit, obrigatorios: !!m.filtroInicial.obrigatoriosVazios, fora: !!m.filtroInicial.foraDaFicha,
    precifica: !!m.filtroInicial.comPrecifica, essencial: !!m.filtroInicial.essencialIncompleto, ordem: (m.filtroInicial.ordem ?? 'nome') as Ordem, modo: 'grade' as 'grade' | 'tabela' };
  // UX-1c (c): ao voltar da Ficha, a lista volta como estava (busca, filtros, modo, página e posição). Um filtro NOVO vence a memória.
  const mem = m.memoriaProdutos.current && JSON.stringify(m.memoriaProdutos.current.filtroDe) === JSON.stringify(m.filtroInicial) ? m.memoriaProdutos.current : null;   // pelo CONTEÚDO (o painel remontado cria outro objeto)
  const [f, setF] = React.useState<typeof inicialF>(() => (mem ? { ...inicialF, ...(mem.f as Partial<typeof inicialF>) } : inicialF));
  const [pagina, setPagina] = React.useState(mem?.pagina ?? 0);
  const rolagemPendente = React.useRef(mem?.rolagem ?? 0);
  const sel = React.useMemo(() => new Set(m.selecao), [m.selecao]);
  const [aviso, setAviso] = React.useState<string | null>(null);
  const [painel, setPainel] = React.useState(false);
  const botaoFiltros = React.useRef<HTMLButtonElement>(null);
  const caixaFiltros = React.useRef<HTMLDivElement>(null);
  const raiz = React.useRef<HTMLDivElement>(null);
  const [area, setArea] = React.useState(1096);

  const carregar = React.useCallback(() => {
    setErro(null);
    obter<Vitrine>('vitrine').then(setDados).catch((e) => setErro(e instanceof Error ? e.message : 'Falha ao ler a lista.'));
  }, []);
  React.useEffect(carregar, [carregar, m.versao]);
  // largura REAL do contêiner (A.2): define as colunas da Tabela e se Categoria/Kit ficam na faixa
  React.useLayoutEffect(() => {
    const el = raiz.current; if (!el) return;
    const medir = () => setArea(Math.round(el.getBoundingClientRect().width));
    medir(); const ro = new ResizeObserver(medir); ro.observe(el); return () => ro.disconnect();
  }, []);

  const lista = React.useMemo(() => {
    if (!dados) return [];
    const q = f.busca.trim(); const idQ = /^\d+$/.test(q) ? Number(q.replace(/^0+(?=\d)/, '')) : null;
    const out = dados.produtos.filter((p) => (f.situacao === 'todos' || (f.situacao === 'ativos') === p.ativo)
      && (!f.categoria || p.categoria === f.categoria) && (!f.subcategoria || (f.subcategoria === SEM_SUB ? p.subcategoria === null : (p.subcategoria ?? '') === f.subcategoria))
      && (!f.kit || p.kits.some((k) => String(k.id) === f.kit)) && (!f.semFoto || p.fotos === 0) && (!f.semKit || p.kits_especificos === 0)
      && (!f.obrigatorios || p.obrigatorios_vazios > 0) && (!f.fora || p.fora_da_ficha > 0) && (!f.precifica || p.precifica.length > 0) && (!f.essencial || (p.essencial.total > 0 && p.essencial.feitos < p.essencial.total))
      && casaBusca(q, p.id, p.nome));
    out.sort((a, b) => (idQ !== null ? Number(b.id === idQ) - Number(a.id === idQ) : 0)
      || (f.ordem === 'id' ? a.id - b.id
        : f.ordem === 'preenchimento' ? comparaMenosPreenchidos(a, b)   // UX-1: 0/0 vão para o fim (lib/formatar, testado em front-puras)
        : a.nome.localeCompare(b.nome, 'pt-BR')));
    return out;
  }, [dados, f]);

  // A.5: trocar Tabela ↔ Cartões NÃO mexe em página nem seleção. Busca/filtro novo → 1ª página e desmarca o que ficaria invisível (com aviso).
  // Ordem nova → 1ª página (a seleção fica). Na restauração (volta da Ficha) nada disso roda.
  const chaveFiltro = JSON.stringify([f.busca, f.categoria, f.subcategoria, f.kit, f.situacao, f.semFoto, f.semKit, f.obrigatorios, f.fora, f.precifica, f.essencial]);
  const filtroAntes = React.useRef(chaveFiltro); const ordemAntes = React.useRef(f.ordem);
  React.useEffect(() => {
    if (filtroAntes.current === chaveFiltro) return; filtroAntes.current = chaveFiltro; setPagina(0);
    if (!dados || !m.selecao.length) return;
    const visiveis = new Set((f.modo === 'tabela' ? lista : lista.slice(0, POR_PAGINA)).map((p) => p.id));   // Tabela (AG Grid): a lista inteira está na grade
    const fica = m.selecao.filter((id) => visiveis.has(id)); const saiu = m.selecao.length - fica.length;
    if (saiu > 0) { m.setSelecao(fica); setAviso(`${saiu} produto${saiu === 1 ? '' : 's'} selecionado${saiu === 1 ? '' : 's'} ficaria${saiu === 1 ? '' : 'm'} fora da lista e ${saiu === 1 ? 'foi desmarcado' : 'foram desmarcados'}.`); }
  }, [chaveFiltro]);   // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => { if (ordemAntes.current === f.ordem) return; ordemAntes.current = f.ordem; setPagina(0); }, [f.ordem]);
  React.useEffect(() => { if (!aviso) return; const t = window.setTimeout(() => setAviso(null), 8000); return () => window.clearTimeout(t); }, [aviso]);
  React.useEffect(() => { m.memoriaProdutos.current = { f, pagina, rolagem: m.memoriaProdutos.current?.rolagem ?? 0, filtroDe: m.filtroInicial }; }, [f, pagina]);   // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {   // posição da página: depois que a lista existe
    if (!dados || !rolagemPendente.current) return; const y = rolagemPendente.current; rolagemPendente.current = 0;
    const ir = () => { document.querySelector('main#main')?.scrollTo({ top: y }); document.scrollingElement?.scrollTo({ top: y }); };
    requestAnimationFrame(() => { ir(); window.setTimeout(ir, 120); });   // 2ª vez: depois que imagens/cabeçalho travado assentam
  }, [dados]);
  // painel Filtros: Esc fecha e devolve o foco ao botão; clique fora fecha
  React.useEffect(() => {
    if (!painel) return;
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setPainel(false); botaoFiltros.current?.focus(); } };
    const fora = (e: MouseEvent) => { const t = e.target as Node; if (!caixaFiltros.current?.contains(t) && !botaoFiltros.current?.contains(t)) setPainel(false); };
    document.addEventListener('keydown', tecla, true); document.addEventListener('mousedown', fora);
    return () => { document.removeEventListener('keydown', tecla, true); document.removeEventListener('mousedown', fora); };
  }, [painel]);

  const larga = area >= AREA_LARGA;
  const conta = (s: { produtos: number; ativos: number }) => (f.situacao === 'inativos' ? s.produtos - s.ativos : f.situacao === 'todos' ? s.produtos : s.ativos);
  const facetas = dados?.facetas ?? [];
  const categorias = [...new Set(facetas.map((x) => x.categoria))];
  const subcats = facetas.filter((x) => x.subcategoria !== null && (!f.categoria || x.categoria === f.categoria) && conta(x) > 0)   // nula = opção "Sem subcategoria"
    .sort((a, b) => rotuloSubcategoria(a.subcategoria).localeCompare(rotuloSubcategoria(b.subcategoria), 'pt-BR'));
  // A.1: ao trocar a categoria, revalidar a subcategoria escolhida (só fica se existir na categoria nova)
  const trocarCategoria = (categoria: string) => {
    const valida = !f.subcategoria || f.subcategoria === SEM_SUB || facetas.some((x) => x.subcategoria === f.subcategoria && (!categoria || x.categoria === categoria));
    setF({ ...f, categoria, subcategoria: valida ? f.subcategoria : '' });
  };
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const vis = lista.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);
  const semEssencial = (p: ProdutoResumo) => f.ordem === 'preenchimento' && p.essencial.total === 0;
  const alternar = (id: number) => m.setSelecao(sel.has(id) ? m.selecao.filter((x) => x !== id) : [...m.selecao, id]);
  const paginaToda = vis.length > 0 && vis.every((p) => sel.has(p.id));
  const algumaDaPagina = vis.some((p) => sel.has(p.id));
  const marcarPagina = () => { const ids = vis.map((p) => p.id); m.setSelecao(paginaToda ? m.selecao.filter((x) => !ids.includes(x)) : [...new Set([...m.selecao, ...ids])]); };
  // UX-1c (b): "Buscar em todo o catálogo" só quando há o que tirar (algum filtro, ou a Situação não é "todos")
  const restricao = !!(f.categoria || f.subcategoria || f.kit || f.semFoto || f.semKit || f.obrigatorios || f.fora || f.precifica || f.essencial || f.situacao !== 'todos');
  const buscarEmTudo = () => setF({ ...f, categoria: '', subcategoria: '', kit: '', situacao: 'todos', semFoto: false, semKit: false, obrigatorios: false, fora: false, precifica: false, essencial: false });
  const limparFiltros = () => setF({ ...f, categoria: '', subcategoria: '', kit: '', semFoto: false, semKit: false, obrigatorios: false, fora: false, precifica: false, essencial: false });
  // etiquetas removíveis (uma por condição ativa) e a contagem do botão "Filtros · N"
  const nomeKit = (id: string) => dados?.kits.find((k) => String(k.id) === id)?.nome ?? `Kit ${id}`;
  const etiquetas: { rotulo: string; tirar: () => void }[] = [
    ...(f.categoria ? [{ rotulo: `Categoria: ${rotuloCategoria(f.categoria)}`, tirar: () => setF({ ...f, categoria: '' }) }] : []),
    ...(f.subcategoria ? [{ rotulo: `Subcategoria: ${f.subcategoria === SEM_SUB ? 'Sem subcategoria' : rotuloSubcategoria(f.subcategoria)}`, tirar: () => setF({ ...f, subcategoria: '' }) }] : []),
    ...(f.kit ? [{ rotulo: `Kit: ${nomeKit(f.kit)}`, tirar: () => setF({ ...f, kit: '' }) }] : []),
    ...RAPIDOS.filter(([k]) => f[k]).map(([k, rot]) => ({ rotulo: rot, tirar: () => setF({ ...f, [k]: false }) })),
  ];
  const especificos = (p: ProdutoResumo) => p.kits.filter((k) => !k.motivos.includes('todos'));
  const comSituacao = f.situacao !== 'ativos';   // A.2/A.3: situação só quando o resultado pode ter inativos
  const podeSel = !!dados?.pode_vincular;
  // 2 px de folga: a soma exata das colunas, arredondada para cima, marcaria a tabela como "larga" (rolagem horizontal) e o cabeçalho deixaria de grudar
  const larguras = largurasColunas(area - 2, comSituacao);

  const selCategoria = (
    <select className="at-select at-pl-select" aria-label="Categoria" value={f.categoria} onChange={(e) => trocarCategoria(e.target.value)}>
      <option value="">Categoria: Todas</option>
      {categorias.map((c) => <option key={c} value={c}>{rotuloCategoria(c)}</option>)}
    </select>);
  const selSub = (
    <select className="at-select at-pl-select" aria-label="Subcategoria" value={f.subcategoria} onChange={(e) => setF({ ...f, subcategoria: e.target.value })}>
      <option value="">Subcategoria: Todas</option>
      <option value={SEM_SUB}>Sem subcategoria</option>
      {subcats.map((s) => <option key={`${s.categoria}|${s.subcategoria}`} value={s.subcategoria ?? ''}>{rotuloSubcategoria(s.subcategoria)} ({conta(s)})</option>)}
    </select>);
  const selKit = (
    <select className="at-select at-pl-select" aria-label="Kit" value={f.kit} onChange={(e) => setF({ ...f, kit: e.target.value })}>
      <option value="">Kit: Qualquer</option>
      {(dados?.kits ?? []).map((k) => <option key={k.id} value={k.id}>{k.nome}</option>)}
    </select>);

  return (
    <div className="at-produtos at-pl" ref={raiz} data-pl-modo={f.modo} data-pl-larga={larga ? '1' : '0'}>
      <CabecalhoTravado>
        <div className="at-pl-faixa" role="toolbar" aria-label="Ferramentas da lista de produtos">
          <label className="at-busca at-pl-busca">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input type="search" value={f.busca} placeholder="Buscar produto ou ID" aria-label="Buscar produto por nome ou ID" onChange={(e) => setF({ ...f, busca: e.target.value })} />
          </label>
          {dados ? <span className="at-filtros__total at-pl-total" aria-live="polite">{lista.length} produto{lista.length === 1 ? '' : 's'}</span>
            : <span className="at-pl-total at-pl-total--carregando" aria-hidden />}
          <select className="at-select at-pl-select" aria-label="Situação" value={f.situacao} onChange={(e) => setF({ ...f, situacao: e.target.value })}>
            <option value="ativos">Situação: Ativos</option><option value="inativos">Situação: Inativos</option><option value="todos">Situação: Ativos e inativos</option>
          </select>
          <div className="at-pl-filtros-ancora">
            <button ref={botaoFiltros} type="button" className={`bl-botao at-pl-btn-filtros ${etiquetas.length ? 'at-pl-btn-filtros--ativo' : ''}`} aria-expanded={painel} aria-controls="at-pl-painel-filtros" onClick={() => setPainel(!painel)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
              {etiquetas.length ? `Filtros · ${etiquetas.length}` : 'Filtros'}
            </button>
            {painel && (
              <div ref={caixaFiltros} id="at-pl-painel-filtros" className="at-pl-painel" role="group" aria-label="Filtros da lista">
                <div className="at-pl-painel__campos">{!larga && selCategoria}{selSub}{!larga && selKit}</div>
                <div className="at-pl-painel__rapidos">
                  {RAPIDOS.map(([k, rot, dica]) => (
                    <label key={k} className="at-pl-alternancia" title={dica}>
                      <input type="checkbox" role="switch" checked={f[k]} onChange={() => setF({ ...f, [k]: !f[k] })} /> <span>{rot}</span>
                    </label>))}
                </div>
                {etiquetas.length > 0 && <button type="button" className="at-link at-pl-painel__limpar" onClick={limparFiltros}>Limpar filtros</button>}
              </div>)}
          </div>
          {larga && selCategoria}
          {larga && selKit}
          <span className="at-pl-faixa__mola" />
          {f.modo === 'grade' && podeSel && vis.length > 0 && (
            <label className="at-pl-selpagina"><input type="checkbox" checked={paginaToda} ref={(el) => { if (el) el.indeterminate = !paginaToda && algumaDaPagina; }} onChange={marcarPagina} /> Selecionar página</label>)}
          {m.selecao.length > 0 && <span className="at-pl-sel" data-pl-sel>{m.selecao.length} selecionado{m.selecao.length === 1 ? '' : 's'} · <button type="button" className="at-link" onClick={() => m.setSelecao([])}>Limpar seleção</button></span>}
          <div className="at-alternador at-pl-alternador" role="group" aria-label="Modo de exibição">
            <button type="button" className={f.modo === 'tabela' ? 'ativo' : ''} aria-pressed={f.modo === 'tabela'} onClick={() => setF({ ...f, modo: 'tabela' })}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M3 15h18M9 4v16" /></svg>Tabela</button>
            <button type="button" className={f.modo === 'grade' ? 'ativo' : ''} aria-pressed={f.modo === 'grade'} onClick={() => setF({ ...f, modo: 'grade' })}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>Cartões</button>
          </div>
          {f.modo === 'grade' && (
            <select className="at-select at-pl-select" aria-label="Ordenar por" value={f.ordem} onChange={(e) => setF({ ...f, ordem: e.target.value as Ordem })}>
              {(Object.keys(ROT_ORDEM) as Ordem[]).map((o) => <option key={o} value={o}>Ordenar: {ROT_ORDEM[o]}</option>)}
            </select>)}
        </div>
        {etiquetas.length > 0 && (
          <div className="at-pl-etiquetas" aria-label="Filtros ativos">
            {etiquetas.map((e) => (
              <span key={e.rotulo} className="at-pl-etiqueta">{e.rotulo}
                <button type="button" className="at-pl-etiqueta__x" aria-label={`Remover filtro: ${e.rotulo}`} onClick={e.tirar}>×</button></span>))}
            <button type="button" className="at-link" onClick={limparFiltros}>Limpar filtros</button>
          </div>)}
        {aviso && <div className="at-pl-aviso" role="status">{aviso}</div>}
      </CabecalhoTravado>

      {erro ? (
        <Erro mensagem={`A lista de produtos não pôde ser lida agora (${erro}). A busca e os filtros foram mantidos.`} aoTentar={carregar} />
      ) : !dados ? (
        <Esqueleto modo={f.modo} larguras={larguras} />
      ) : lista.length === 0 ? (
        <VazioLista busca={f.busca} situacao={f.situacao} restricao={restricao} nFiltros={etiquetas.length} aoBuscarEmTudo={buscarEmTudo} aoLimparFiltros={limparFiltros} aoLimparBusca={() => setF({ ...f, busca: '' })} />
      ) : f.modo === 'grade' ? (
        <div className="at-pl-cartoes">
          {vis.map((p, k) => (<React.Fragment key={p.id}>
            {semEssencial(p) && (k === 0 ? (pagina === 0 || lista[pagina * POR_PAGINA - 1]?.essencial.total !== 0) : !semEssencial(vis[k - 1]))
              && <div className="at-pl-cartoes__grupo" role="separator">Sem atributos essenciais definidos</div>}
            <Cartao p={p} kits={especificos(p)} selecionado={sel.has(p.id)} podeSel={podeSel} comSituacao={comSituacao} aoSelecionar={() => alternar(p.id)} aoAbrir={() => m.abrirProduto(p.id)} />
          </React.Fragment>))}
        </div>
      ) : (
        <React.Suspense fallback={<Esqueleto modo="tabela" larguras={larguras} />}>
          <ProdutosGrade linhas={lista} comSituacao={comSituacao} podeSel={podeSel} selecao={m.selecao} aoSelecionar={(ids) => m.setSelecao(ids)}
            aoAbrir={(id) => m.abrirProduto(id)} especificos={especificos} />
        </React.Suspense>
      )}

      {dados && lista.length > 0 && f.modo === 'grade' && (
        <nav className="at-paginas at-pl-rodape" aria-label="Páginas">
          <span className="at-pl-rodape__faixa">{pagina * POR_PAGINA + 1}–{Math.min(lista.length, (pagina + 1) * POR_PAGINA)} de {lista.length} produto{lista.length === 1 ? '' : 's'}</span>
          <span className="at-pl-rodape__mola" />
          <span className="at-fraco">{POR_PAGINA} por página</span>
          <button type="button" className="bl-botao" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>Anterior</button>
          <span>{pagina + 1} de {paginas}</span>
          <button type="button" className="bl-botao" disabled={pagina >= paginas - 1} onClick={() => setPagina(pagina + 1)}>Próxima</button>
        </nav>)}
      {m.selecao.length > 0 && (
        <div className="at-barra-selecao" role="region" aria-label="Ações para os produtos selecionados">
          <strong>{m.selecao.length} selecionado{m.selecao.length === 1 ? '' : 's'}</strong>
          <Botao primario aoClicar={() => m.ir('vincular', { selecao: m.selecao, intencao: 'kit' })}>Aplicar kit</Botao>
          <Botao aoClicar={() => m.ir('vincular', { selecao: m.selecao, intencao: 'atributo' })}>Adicionar atributo</Botao>
          <Botao aoClicar={() => m.ir('preencher', { selecao: m.selecao, preencher: {} })}>Abrir na grade</Botao>
          <Botao aoClicar={() => m.setSelecao([])}>Limpar seleção</Botao>
        </div>)}
    </div>
  );
}

// ── pedaços ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** Texto numa linha com reticências; o completo no hover (title) e no foco de teclado (rótulo flutuante do CSS, data-completo). */
function Corta({ texto, className }: { texto: string; className?: string }) {
  return <span className={`at-pl-corta ${className ?? ''}`} title={texto}>{texto}</span>;
}
/** Essenciais: barra discreta + "x de y". 0/0 = sem essenciais definidos (não é 0%). */
function Essenciais({ feitos, total }: { feitos: number; total: number }) {
  const p = total > 0 ? Math.round((feitos / total) * 100) : 0;
  return (
    <span className="at-pl-ess" title={total ? `Essenciais: ${feitos} de ${total} (${p}%)` : 'Sem atributos essenciais definidos'}>
      <span className="at-pl-ess__trilho" role="progressbar" aria-label="Essenciais preenchidos" aria-valuemin={0} aria-valuemax={total} aria-valuenow={feitos}>
        <span className={`at-pl-ess__barra ${total > 0 && feitos === total ? 'at-pl-ess__barra--completa' : ''}`} style={{ width: `${p}%` }} />
      </span>
      <span className="at-pl-ess__txt">{feitos} de {total}</span>
    </span>);
}
/** Kit: pílula do 1º kit específico (+N) ou a neutra "Sem kit específico" (o Base continua aplicado; não escrever "Sem kit"). */
function Kit({ kits }: { kits: { id: number; nome: string }[] }) {
  if (!kits.length) return <span className="at-pl-semkit" title="Só o kit Base (todos os produtos) está aplicado">Sem kit específico</span>;
  return <span className="at-pl-kits"><ChipKit nome={kits[0].nome} pequeno />{kits.length > 1 && <Etiqueta titulo={kits.slice(1).map((k) => k.nome).join(', ')}>+{kits.length - 1}</Etiqueta>}</span>;
}
const situacao = (ativo: boolean) => <span className={`at-pl-situacao at-pl-situacao--${ativo ? 'ativo' : 'inativo'}`}>{ativo ? 'Ativo' : 'Inativo'}</span>;
const precificaTexto = (p: ProdutoResumo) => (p.precifica.length ? p.precifica.map(tituloFamilia).join(', ') : '—');

/** Miniatura de tamanho fixo (contain). Sem foto conhecida → "Sem foto"; foto que existe e falhou ao carregar → "Foto indisponível" (outro tratamento). */
function Miniatura({ p }: { p: ProdutoResumo }) {
  const [falhou, setFalhou] = React.useState(false);
  React.useEffect(() => setFalhou(false), [p.capa_id]);
  if (p.fotos === 0 || p.capa_id === null) return <div className="at-pl-mini at-pl-mini--sem" data-pl-mini="sem"><span>Sem foto</span></div>;
  if (falhou) return <div className="at-pl-mini at-pl-mini--falhou" data-pl-mini="falhou" title="A foto existe, mas não carregou agora"><span>Foto indisponível</span></div>;
  return <div className="at-pl-mini" data-pl-mini="ok"><img src={urlFoto(p.capa_id, 480)} alt="" loading="lazy" decoding="async" onError={() => setFalhou(true)} /></div>;
}

function Cartao({ p, kits, selecionado, podeSel, comSituacao, aoSelecionar, aoAbrir }: {
  p: ProdutoResumo; kits: { id: number; nome: string }[]; selecionado: boolean; podeSel: boolean; comSituacao: boolean; aoSelecionar: () => void; aoAbrir: () => void;
}) {
  const n = p.obrigatorios_vazios;
  return (
    <article className={`at-pl-cartao ${selecionado ? 'at-pl-cartao--sel' : ''} ${p.ativo ? '' : 'at-pl-cartao--inativo'}`} data-produto={p.id}>
      <div className="at-pl-cartao__topo">
        {podeSel ? <label className="at-pl-cartao__sel"><input type="checkbox" checked={selecionado} onChange={aoSelecionar} aria-label={`Selecionar ${p.nome}`} /> <span>ID {p.id}</span></label>
          : <span className="at-pl-cartao__id">ID {p.id}</span>}
        {comSituacao && situacao(p.ativo)}
      </div>
      <div className="at-pl-cartao__meio">
        <Miniatura p={p} />
        <div className="at-pl-cartao__texto">
          <Corta texto={rotuloSubcategoria(p.subcategoria)} className="at-pl-cartao__sub" />
          <button type="button" className="at-link-produto at-pl-cartao__nome" title={p.nome} data-completo={p.nome} onClick={aoAbrir}>{p.nome}</button>
        </div>
      </div>
      <div className="at-pl-cartao__kit"><Kit kits={kits} /></div>
      <div className="at-pl-cartao__ess"><span className="at-pl-rot">Essenciais</span><Essenciais feitos={p.essencial.feitos} total={p.essencial.total} /></div>
      <div className="at-pl-cartao__linha">
        <span className={n > 0 ? 'at-pl-pendente' : 'at-pl-zero'} data-pl-obrigatorios={n}>{n} obrigatório{n === 1 ? '' : 's'} pendente{n === 1 ? '' : 's'}</span>
        <span className={`at-pl-fotos ${p.fotos === 0 ? 'at-pl-pendente' : ''}`} title={`${p.fotos} foto${p.fotos === 1 ? '' : 's'}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></svg>
          <span className="bl-so-leitor">Fotos:</span> {p.fotos}</span>
      </div>
      <div className="at-pl-cartao__rodape">
        <Corta texto={`Precifica: ${precificaTexto(p)}`} className="at-pl-cartao__precifica" />
        <button type="button" className="at-link at-pl-cartao__abrir" onClick={aoAbrir} aria-label={`Abrir ficha: ${p.nome}`}>Abrir ficha</button>
      </div>
    </article>);
}

/** Carregando: esqueleto do MESMO tamanho da estrutura (nunca "0 produtos" antes da resposta). */
function Esqueleto({ modo, larguras }: { modo: 'grade' | 'tabela'; larguras: Record<string, number> }) {
  if (modo === 'grade') return <div className="at-pl-cartoes" role="status" aria-label="Carregando produtos">{Array.from({ length: 6 }, (_, i) => <div key={i} className="at-pl-cartao at-pl-esq" />)}</div>;
  const cols = Object.keys(larguras);
  return (
    <div className="at-pl-esq-tabela" role="status" aria-label="Carregando produtos">
      <div className="at-pl-esq-tabela__cab">{cols.map((k) => <span key={k} style={{ width: larguras[k] }} />)}</div>
      {Array.from({ length: 12 }, (_, i) => <div key={i} className="at-pl-esq-tabela__linha">{cols.map((k) => <span key={k} style={{ width: larguras[k] }}><i /></span>)}</div>)}
    </div>);
}

/** Vazio (A.4 + UX-1c b): com recorte → explica e oferece limpar (e "buscar em todo o catálogo" quando há termo); catálogo inteiro → frase fixa + "Limpar busca". */
function VazioLista({ busca, situacao: sit, restricao, nFiltros, aoBuscarEmTudo, aoLimparFiltros, aoLimparBusca }: {
  busca: string; situacao: string; restricao: boolean; nFiltros: number; aoBuscarEmTudo: () => void; aoLimparFiltros: () => void; aoLimparBusca: () => void;
}) {
  const termo = busca.trim();
  const icone = <svg className="at-pl-vazio__icone" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>;
  if (!restricao) return (
    <div className="at-pl-vazio">{icone}<strong>Nenhum produto ativo ou inativo encontrado</strong>
      <p>{termo ? `Não há correspondência para “${termo}” no catálogo inteiro.` : 'O catálogo não tem produtos.'}</p>
      {termo && <Botao aoClicar={aoLimparBusca}>Limpar busca</Botao>}
    </div>);
  const situacaoTxt = sit === 'ativos' ? 'só produtos ativos' : sit === 'inativos' ? 'só produtos inativos' : '';
  const recorte = [termo && `a busca “${termo}”`, nFiltros > 0 && `${nFiltros} filtro${nFiltros === 1 ? '' : 's'}`, situacaoTxt].filter(Boolean).join(', ');
  return (
    <div className="at-pl-vazio">{icone}<strong>Nenhum produto encontrado com estes filtros.</strong>
      <p>O recorte atual ({recorte}) não tem produtos.</p>
      <div className="at-pl-vazio__acoes">
        {termo && <Botao primario aoClicar={aoBuscarEmTudo}>{`Buscar ‘${termo}’ em todo o catálogo`}</Botao>}
        {nFiltros > 0 && <Botao aoClicar={aoLimparFiltros}>Limpar filtros</Botao>}
        {termo && <Botao aoClicar={aoLimparBusca}>Limpar busca</Botao>}
      </div>
      {termo && <span className="at-fraco">“Buscar em todo o catálogo” inclui produtos inativos, tira os filtros e mantém o termo.</span>}
    </div>);
}
