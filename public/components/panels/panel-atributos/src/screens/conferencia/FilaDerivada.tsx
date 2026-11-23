// CONFERÊNCIA V2 · Parte B (ESQUERDA, 23/11; pranchas 08, 09 e 10): o MESMO componente de fila para "Fora da ficha", "Obrigatórios vazios" e
// "Sem kit". Cada aba mantém a sua unidade de contagem e as suas ações; página de 50 pelo servidor (GET conferencia_fila, total real, cursor
// por chave). Escritas com o contrato "foi salvo" (useGravacoes: chave por intenção, "A conferir" + Conferir gravação; nada reenviado sozinho)
// e origem "conferencia" (chave obrigatória no servidor). A linha gravada fica visível, marcada, até a próxima leitura da página.
import React from 'react';
import { ErroApi, obter } from '../../lib/api';
import { useModulo } from '../../app/contexto';
import { rotuloSubcategoria } from '../../lib/rotulos';
import { Botao, CabecalhoTravado, Erro, Vazio } from '../../ui/Comuns';
import { MenuEscolha } from '../../ui/MenuBarra';
import { TabelaDados, type ColunaTabela } from '../../ui/TabelaDados';
import { useGravacoes } from '../../ui/CelulaEditavel';
import { podeConferir, livre } from '../../ui/celula';
import { anterior, faixa, PAGINAS0, paginasTotais, POR_PAGINA, proxima, textoAtual, type Atual, type Paginas, type RespFila } from './fila';
import './conferencia.css';

export type FilaDerivadaId = 'fora_da_ficha' | 'obrigatorios_vazios' | 'sem_kit';
interface Linha { product_id: number; produto: string; atributo_id?: number; atributo?: string; estado?: string; valor?: Atual; subcategoria?: string | null; legado?: string | null; versao_vinculos?: string | number | null }
const UNIDADE: Record<FilaDerivadaId, [string, string]> = { fora_da_ficha: ['pendência', 'pendências'], obrigatorios_vazios: ['campo pendente', 'campos pendentes'], sem_kit: ['produto', 'produtos'] };
const chaveDe = (f: FilaDerivadaId, x: Linha) => (f === 'sem_kit' ? `${x.product_id}` : `${x.product_id}:${x.atributo_id}`);

export function FilaDerivada({ fila, atributos, subcategorias, kits, podeVincular, aoMudarTotais }: {
  fila: FilaDerivadaId; atributos: readonly { id: number; rotulo: string }[]; subcategorias: readonly string[]; kits: readonly { id: number; nome: string }[];
  podeVincular: boolean; aoMudarTotais: () => void;
}) {
  const m = useModulo();
  const [atr, setAtr] = React.useState('todos'); const [sub, setSub] = React.useState('todas');
  const [busca, setBusca] = React.useState(''); const [q, setQ] = React.useState('');
  const [pags, setPags] = React.useState<Paginas>(PAGINAS0);
  const [resp, setResp] = React.useState<RespFila<Linha> | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [lendo, setLendo] = React.useState(false);
  const [aberta, setAberta] = React.useState<string | null>(null);
  const [escolhas, setEscolhas] = React.useState<Record<number, number>>({});   // Sem kit: Escolher PREPARA (não grava)
  const [feitas, setFeitas] = React.useState<Record<string, string>>({});
  const geracao = React.useRef(0);
  const g = useGravacoes(React.useCallback(async () => { aoMudarTotais(); }, [aoMudarTotais]));   // contadores só com gravação confirmada; a página não é relida (a linha fica, marcada)

  React.useEffect(() => { const t = window.setTimeout(() => setQ(busca.trim()), 300); return () => window.clearTimeout(t); }, [busca]);
  const ler = React.useCallback(() => {
    const gen = ++geracao.current; setLendo(true); setErro(null);
    obter<RespFila<Linha>>('conferencia_fila', { fila, ...(atr !== 'todos' ? { atributo_id: atr } : {}), ...(sub !== 'todas' ? { subcategoria: sub } : {}), ...(q ? { q } : {}),
      ...(pags.cursores[pags.indice] ? { cursor: pags.cursores[pags.indice]! } : {}) })
      .then((r) => { if (gen === geracao.current) { setResp(r); setFeitas({}); } })
      .catch((e) => { if (gen !== geracao.current) return;
        // DSHOW-108 (B): o cursor é de outra consulta (filtros mudaram) → volta à 1ª página, sem erro na tela
        if (e instanceof ErroApi && e.codigo === 'CURSOR_CONTEXT_MISMATCH') { setPags(PAGINAS0); return; }
        setErro(e instanceof ErroApi ? e.message : 'Não foi possível ler a fila.'); })
      .finally(() => { if (gen === geracao.current) setLendo(false); });
  }, [fila, atr, sub, q, pags]);
  React.useEffect(ler, [ler, m.versao]);
  const mudarFiltro = (f: () => void) => { f(); setPags(PAGINAS0); };

  const vincular = async (x: Linha) => {
    const st = await g.gravar(`${chaveDe(fila, x)}:vincular`, 'produto_atributo', { product_id: x.product_id, versao_vinculos: x.versao_vinculos, atributo_id: x.atributo_id, modo: 'incluir', origem: 'conferencia' }, 'atributo_id');
    if (st.fase === 'salvo' || st.fase === 'sem_mudanca') setFeitas((f) => ({ ...f, [chaveDe(fila, x)]: 'Vinculado' }));
  };
  const aplicarKit = async (x: Linha) => {
    const k = escolhas[x.product_id]; if (!k) return;
    const st = await g.gravar(`${chaveDe(fila, x)}:kit`, 'produto_kit', { product_id: x.product_id, versao_vinculos: x.versao_vinculos, grupo_id: k, ativo: 1, origem: 'conferencia' }, 'grupo_id');
    if (st.fase === 'salvo' || st.fase === 'sem_mudanca') setFeitas((f) => ({ ...f, [chaveDe(fila, x)]: 'Kit aplicado' }));   // erro: a escolha continua no seletor
  };
  const kitNome = (id?: number) => kits.find((k) => k.id === id)?.nome ?? '';

  const linkProduto = (x: Linha) => <button type="button" className="at-link-produto cf-1l" title={x.produto} onClick={() => m.abrirProduto(x.product_id, x.atributo_id ? { atributo: x.atributo_id } : undefined)}>{x.produto}</button>;
  const pilula = (rotulo: string, tom: string) => <span className={`cf-pilula cf-pilula--${tom}`} data-situacao={rotulo}>{rotulo}</span>;
  const expandir: ColunaTabela<Linha> = { chave: 'exp', titulo: '', tipo: 'texto', ordenavel: false, classe: 'cf-col-exp', cabecalho: <span className="bl-so-leitor">Detalhes</span>,
    render: (x, ctx) => <button type="button" className="cf-expandir" {...ctx.gatilho} aria-label={`${ctx.expandida ? 'Fechar' : 'Ver'} detalhes de ${x.produto}`}><span aria-hidden>{ctx.expandida ? '▾' : '▸'}</span></button> };
  const id: ColunaTabela<Linha> = { chave: 'product_id', titulo: 'ID', tipo: 'numero', ordenavel: false, classe: 'cf-col-id' };
  const prod: ColunaTabela<Linha> = { chave: 'produto', titulo: 'Produto', tipo: 'texto', ordenavel: false, classe: 'cf-col-prod', render: linkProduto };

  let colunas: ColunaTabela<Linha>[];
  if (fila === 'fora_da_ficha') colunas = [expandir, id, prod,
    { chave: 'atributo', titulo: 'Atributo', tipo: 'texto', ordenavel: false, classe: 'cf-col-atr2', render: (x) => <span className="cf-1l" title={x.atributo}>{x.atributo}</span> },
    { chave: 'valor', titulo: 'Valor gravado', tipo: 'texto', ordenavel: false, classe: 'cf-col-valor', render: (x) => <span className="cf-1l" title={textoAtual(x.valor)}>{textoAtual(x.valor)}</span> },
    { chave: 'situacao', titulo: 'Situação', tipo: 'texto', ordenavel: false, classe: 'cf-col-sit', render: (x) => { const st = g.estadoDe(`${chaveDe(fila, x)}:vincular`);
        return feitas[chaveDe(fila, x)] ? pilula(feitas[chaveDe(fila, x)], 'ativa') : podeConferir(st.fase) ? pilula('A conferir', 'aviso') : st.fase === 'recusada' || st.fase === 'conflito' ? pilula('Não aplicada', 'erro') : pilula('Pendente', 'pendente'); } },
    { chave: 'acoes', titulo: 'Ações', tipo: 'texto', ordenavel: false, classe: 'cf-col-acoes2', render: (x) => { const k = `${chaveDe(fila, x)}:vincular`; const st = g.estadoDe(k);
        if (podeConferir(st.fase) && !feitas[chaveDe(fila, x)]) return <span className="cf-acoes"><button type="button" className="bl-botao cf-btn cf-btn--conferir" onClick={() => void g.conferir(k)}>Conferir gravação</button><button type="button" className="bl-botao cf-btn" onClick={() => setAberta(chaveDe(fila, x))}>Detalhes</button></span>;
        return <span className="cf-acoes">{podeVincular && !feitas[chaveDe(fila, x)] && <button type="button" className="bl-botao cf-btn" disabled={!livre(st.fase)} aria-busy={st.fase === 'salvando'} onClick={() => void vincular(x)}>Vincular</button>}
          <button type="button" className="at-link" onClick={() => m.abrirProduto(x.product_id, { atributo: x.atributo_id })}>Abrir ficha</button></span>; } }];
  else if (fila === 'obrigatorios_vazios') colunas = [id, prod,
    { chave: 'atributo', titulo: 'Atributo obrigatório', tipo: 'texto', ordenavel: false, classe: 'cf-col-obr', render: (x) => <span className="cf-1l" title={x.atributo}>{x.atributo}</span> },
    { chave: 'acoes', titulo: 'Ação', tipo: 'texto', ordenavel: false, classe: 'cf-col-acao1',
      render: (x) => <button type="button" className="bl-botao cf-btn cf-btn--largo" onClick={() => m.abrirProduto(x.product_id, { atributo: x.atributo_id })}>→ Preencher na ficha</button> }];
  else colunas = [expandir, id, prod,
    { chave: 'subcategoria', titulo: 'Subcategoria', tipo: 'texto', ordenavel: false, classe: 'cf-col-sub', render: (x) => <span className="cf-1l">{rotuloSubcategoria(x.subcategoria ?? null)}</span> },
    { chave: 'legado', titulo: 'Kit no legado', tipo: 'texto', ordenavel: false, classe: 'cf-col-leg', render: (x) => <span className="cf-1l cf-fraco" title={x.legado ?? ''}>{x.legado ?? '—'}</span> },
    { chave: 'kit', titulo: 'Kit a aplicar', tipo: 'texto', ordenavel: false, classe: 'cf-col-kit', render: (x) => { const st = g.estadoDe(`${chaveDe(fila, x)}:kit`);
        return podeVincular ? <select className="at-cel__select cf-kit" aria-label={`Kit a aplicar em ${x.produto}`} value={escolhas[x.product_id] ?? ''} disabled={!livre(st.fase) || !!feitas[chaveDe(fila, x)]}
          onChange={(e) => { const v = Number(e.target.value); setEscolhas((s) => { const n = { ...s }; if (v) n[x.product_id] = v; else delete n[x.product_id]; return n; }); if (v) setAberta(chaveDe(fila, x)); }}>
          <option value="">Escolher kit…</option>{kits.map((k) => <option key={k.id} value={k.id}>{k.nome}</option>)}</select> : <span className="cf-fraco">—</span>; } },
    { chave: 'acoes', titulo: 'Ação', tipo: 'texto', ordenavel: false, classe: 'cf-col-acoes', render: (x) => { const k = `${chaveDe(fila, x)}:kit`; const st = g.estadoDe(k);
        if (feitas[chaveDe(fila, x)]) return <span className="cf-acoes">{pilula('Kit aplicado', 'ativa')}</span>;
        if (podeConferir(st.fase)) return <span className="cf-acoes"><button type="button" className="bl-botao cf-btn cf-btn--conferir" onClick={() => void g.conferir(k)}>Conferir gravação</button><button type="button" className="bl-botao cf-btn" onClick={() => setAberta(chaveDe(fila, x))}>Detalhes</button></span>;
        return podeVincular ? <span className="cf-acoes"><button type="button" className="bl-botao bl-botao--primario cf-btn" disabled={!escolhas[x.product_id] || !livre(st.fase)} aria-busy={st.fase === 'salvando'}
          title={!escolhas[x.product_id] ? 'Escolha o kit primeiro' : undefined} onClick={() => void aplicarKit(x)}>✓ Aplicar kit</button>
          {(st.fase === 'recusada' || st.fase === 'conflito') && pilula('Não aplicado', 'erro')}</span> : null; } }];

  const expansao = (x: Linha) => {
    const k = chaveDe(fila, x); const st = g.estadoDe(`${k}:${fila === 'sem_kit' ? 'kit' : 'vincular'}`);
    return (
      <div className="cf-evid" data-detalhe={k}>
        {fila === 'fora_da_ficha' && <><strong className="cf-evid__titulo">Vínculo individual</strong>
          <p className="cf-fraco">“{x.atributo}” passará a fazer parte da ficha deste produto. O valor “{textoAtual(x.valor)}” será preservado.</p></>}
        {fila === 'sem_kit' && (escolhas[x.product_id]
          ? <><strong className="cf-evid__titulo">Escolha preparada: {kitNome(escolhas[x.product_id])}</strong><p className="cf-fraco">Ao aplicar, o kit será vinculado somente a este produto. A escolha no seletor ainda não gravou a alteração.</p></>
          : <p className="cf-fraco">Escolha um kit no seletor para preparar; nada é gravado até “Aplicar kit”.</p>)}
        {podeConferir(st.fase) && <p className="cf-aviso" role="note">Não conseguimos confirmar esta gravação. Confira antes de tentar outra ação.</p>}
        {st.mensagem && !podeConferir(st.fase) && st.fase !== 'salvo' && <p className="cf-aviso" role="note">{st.mensagem}</p>}
      </div>);
  };

  const filtrando = atr !== 'todos' || sub !== 'todas' || !!q;
  const [um, varios] = UNIDADE[fila];
  return (
    <>
      <CabecalhoTravado>
        <div className="cf-barra" role="search">
          <label className="cf-busca"><span className="bl-so-leitor">Buscar produto ou ID</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input type="search" placeholder="Buscar produto ou ID" value={busca} onChange={(e) => { setBusca(e.target.value); setPags(PAGINAS0); }} /></label>
          {fila !== 'sem_kit' ? <MenuEscolha rotulo="Atributo" valor={atr} padrao="todos" aoEscolher={(v) => mudarFiltro(() => setAtr(v))} opcoes={[{ valor: 'todos', rotulo: 'Todos' }, ...atributos.map((a) => ({ valor: String(a.id), rotulo: a.rotulo }))]} />
            : <MenuEscolha rotulo="Subcategoria" valor={sub} padrao="todas" aoEscolher={(v) => mudarFiltro(() => setSub(v))} opcoes={[{ valor: 'todas', rotulo: 'Todas' }, ...subcategorias.map((s) => ({ valor: s, rotulo: rotuloSubcategoria(s) }))]} />}
          <span className="cf-contagem" aria-live="polite" data-total={resp?.total ?? ''}>{resp ? `${resp.total.toLocaleString('pt-BR')} ${resp.total === 1 ? um : varios}` : '…'}</span>
        </div>
      </CabecalhoTravado>
      {erro ? <Erro mensagem={erro} aoTentar={ler} /> : !resp ? <div className="cf-lendo" role="status">Lendo a fila…</div> : resp.itens.length === 0 ? (
        <Vazio titulo={filtrando ? 'Nenhuma pendência encontrada com estes filtros' : 'Nenhuma pendência nesta fila'}
          acao={filtrando ? <Botao aoClicar={() => { setBusca(''); setQ(''); mudarFiltro(() => { setAtr('todos'); setSub('todas'); }); }}>Limpar filtros</Botao> : undefined} />
      ) : (
        <div className="cf-moldura" aria-busy={lendo}>
          <TabelaDados rolagem="container" className={`cf-grade cf-grade--${fila}`} legenda={fila} colunas={colunas} linhas={resp.itens} chaveLinha={(x) => chaveDe(fila, x)}
            {...(fila === 'obrigatorios_vazios' ? {} : { expandida: aberta, aoAlternarExpansao: (x: Linha) => setAberta((a) => (a === chaveDe(fila, x) ? null : chaveDe(fila, x))), renderExpansao: expansao })}
            classeLinha={(x) => (feitas[chaveDe(fila, x)] ? 'cf-linha--concluida' : undefined)} />
        </div>)}
      {resp && (
        <div className="cf-rodape" data-faixa={faixa(pags, resp.itens.length, resp.total)}>
          <span>{faixa(pags, resp.itens.length, resp.total)} {resp.total === 1 ? um : varios}</span>
          <span className="cf-rodape__pag">
            <span className="cf-fraco">{POR_PAGINA} por página</span>
            <Botao desligado={pags.indice === 0 || lendo} aoClicar={() => setPags(anterior)}>Anterior</Botao>
            <span>{pags.indice + 1} de {paginasTotais(resp.total)}</span>
            <Botao desligado={!resp.proximo_cursor || lendo} aoClicar={() => setPags((p) => proxima(p, resp.proximo_cursor))}>Próxima</Botao>
          </span>
        </div>)}
    </>);
}
