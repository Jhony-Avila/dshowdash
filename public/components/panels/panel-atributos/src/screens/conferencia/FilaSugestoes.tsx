// CONFERÊNCIA V2 · aba "Sugestões do nome" (ESQUERDA, 23/11; pranchas 04–07 e 12; contrato da Parte C, PARA-STATUS §94).
// - Página de 50 pelo servidor (GET conferencia_fila: total REAL, cursor por chave; nunca lista cortada em silêncio).
// - Seleção só da página; Aceitar/Recusar/Ignorar (Em aberto), Devolver à fila (Ignoradas), Reabrir (Recusadas, só admin, com motivo):
//   confirmação NA PRÓPRIA PÁGINA (sem modal) com o escopo explicado ("… não serão enviadas").
// - UM motor de lote para tudo (também a ação de uma linha = lote de 1): POST sugestoes_decidir com chave por INTENÇÃO e corpo congelado;
//   resultado por item; resposta perdida = "A conferir" (nada é reenviado sem pedido); Rodando (só conferir) × Parado ("Concluir este lote").
// - Linhas concluídas ficam visíveis até "Ocultar concluídas"; contadores das abas só mudam com resultado confirmado.
import React from 'react';
import { conferirGravacao, enviar, ErroApi, MSG_DESCONHECIDO, novaChaveOperacao, obter } from '../../lib/api';
import { marcarPendencia } from '../../lib/pendencias';
import { useModulo } from '../../app/contexto';
import { Botao, CabecalhoTravado, Erro, Vazio } from '../../ui/Comuns';
import { MenuEscolha } from '../../ui/MenuBarra';
import { TabelaDados, type ColunaTabela } from '../../ui/TabelaDados';
import { aConferir, anterior, concluida, contar, elegiveis, faixa, motivoLegivel, PAGINAS0, paginasTotais, POR_PAGINA, proxima, resultadoDaConferencia, resultadoDoLote,
  situacao, textoAtual, textoFora, textoSugerido, type Acao, type EstadoSugestao, type ItemFila, type Paginas, type RespFila, type ResultadoItem } from './fila';
import './conferencia.css';

const SITUACOES: { valor: EstadoSugestao; rotulo: string }[] = [
  { valor: 'pendente', rotulo: 'Em aberto' }, { valor: 'ignorada', rotulo: 'Ignoradas' }, { valor: 'recusada', rotulo: 'Recusadas' }, { valor: 'aceita', rotulo: 'Aceitas' }];
const VERBO: Record<Acao, [string, string]> = { aceitar: ['Aceitar', 'aceite'], recusar: ['Recusar', 'recusa'], ignorar: ['Ignorar', 'ignorar'], devolver: ['Devolver à fila', 'devolução'], reabrir: ['Reabrir', 'reabertura'] };
type FaseLote = 'enviando' | 'concluido' | 'desconhecido' | 'rodando' | 'parado' | 'nao_encontrada' | 'conferindo' | 'recusado';
interface Intencao { readonly chave: string; readonly acao: Acao; readonly corpo: Readonly<Record<string, unknown>>; readonly enviados: readonly number[]; readonly naoEnviados: readonly number[] }
interface EstadoLote { intencao: Intencao; fase: FaseLote; msg: string | null }
type Pedido = { acao: Acao; vao: ItemFila[]; fora: { it: ItemFila; motivo: string }[] } | null;

/** Largura ≥ 1800 px (2200): Evidência em coluna; abaixo, só na linha expandida (briefing Parte B). */
function useLarga(): boolean {
  const q = '(min-width: 1800px)';
  const [l, setL] = React.useState(() => typeof matchMedia === 'function' && matchMedia(q).matches);
  React.useEffect(() => { if (typeof matchMedia !== 'function') return; const m = matchMedia(q); const f = () => setL(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f); }, []);
  return l;
}

export function FilaSugestoes({ atributos, podeDecidir, administra, aoMudarTotais }: {
  atributos: readonly { id: number; rotulo: string }[]; podeDecidir: boolean; administra: boolean; aoMudarTotais: () => void;
}) {
  const m = useModulo(); const larga = useLarga();
  const [estado, setEstado] = React.useState<EstadoSugestao>('pendente');
  const [atr, setAtr] = React.useState<string>('todos');
  const [busca, setBusca] = React.useState(''); const [q, setQ] = React.useState('');
  const [pags, setPags] = React.useState<Paginas>(PAGINAS0);
  const [resp, setResp] = React.useState<RespFila<ItemFila> | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [lendo, setLendo] = React.useState(false);
  const [sel, setSel] = React.useState<Set<number>>(new Set());
  const [aberta, setAberta] = React.useState<number | null>(null);
  const [pedido, setPedido] = React.useState<Pedido>(null);
  const [motivo, setMotivo] = React.useState('');
  const [lote, setLote] = React.useState<EstadoLote | null>(null);
  const [ultimos, setUltimos] = React.useState<Record<number, ResultadoItem>>({});
  const [ocultas, setOcultas] = React.useState<Set<number>>(new Set());
  const geracao = React.useRef(0);

  React.useEffect(() => { const t = window.setTimeout(() => setQ(busca.trim()), 300); return () => window.clearTimeout(t); }, [busca]);
  const ler = React.useCallback(() => {
    const g = ++geracao.current; setLendo(true); setErro(null);
    obter<RespFila<ItemFila>>('conferencia_fila', { fila: 'nome', estado, ...(atr !== 'todos' ? { atributo_id: atr } : {}), ...(q ? { q } : {}), ...(pags.cursores[pags.indice] ? { cursor: pags.cursores[pags.indice]! } : {}) })
      .then((r) => { if (g === geracao.current) { setResp(r); setSel(new Set()); } })
      .catch((e) => { if (g !== geracao.current) return;
        // DSHOW-108 (B): o cursor é de outra consulta (filtros mudaram) → volta à 1ª página, sem erro na tela
        if (e instanceof ErroApi && e.codigo === 'CURSOR_CONTEXT_MISMATCH') { setPags(PAGINAS0); return; }
        setErro(e instanceof ErroApi ? e.message : 'Não foi possível ler a fila.'); })
      .finally(() => { if (g === geracao.current) setLendo(false); });
  }, [estado, atr, q, pags]);
  React.useEffect(ler, [ler, m.versao]);
  // filtro mudou = volta à 1ª página, limpa seleção e resultados (o "Último lote" fica até a próxima leitura)
  const mudarFiltro = (f: () => void) => { f(); setPags(PAGINAS0); setPedido(null); setUltimos({}); setOcultas(new Set()); };

  const linhas = (resp?.itens ?? []).filter((x) => !ocultas.has(x.id));
  const selecionados = linhas.filter((x) => sel.has(x.id));
  const ocupado = lote?.fase === 'enviando' || lote?.fase === 'conferindo';
  const loteAberto = !!lote && lote.fase !== 'concluido' && lote.fase !== 'recusado';   // há gravação sem desfecho final: nada de nova decisão

  // ── motor do lote (envio, conferir, concluir) ─────────────────────────────────────────────────────────────────────────────────────
  const aplicarResultado = (r: Record<number, ResultadoItem>) => {
    setUltimos((u) => ({ ...u, ...r }));
    if (Object.values(r).some((x) => x.desfecho === 'aplicada')) aoMudarTotais();   // contadores só com resultado CONFIRMADO
  };
  const enviarIntencao = async (i: Intencao) => {
    marcarPendencia(i.chave, true); setLote({ intencao: i, fase: 'enviando', msg: null });
    try {
      const r = await enviar<{ itens?: { id: number; desfecho: string }[] }>('sugestoes_decidir', i.corpo, { chave: i.chave });
      aplicarResultado(resultadoDoLote(r.itens as never, i.enviados, i.naoEnviados)); marcarPendencia(i.chave, false);
      setLote({ intencao: i, fase: 'concluido', msg: null });
    } catch (e) {
      const er = e instanceof ErroApi ? e : null;
      const itensErro = (er?.extra.itens as unknown as { id?: number; item?: string; desfecho: string }[] | undefined)?.map((x) => ({ ...x, id: Number(x.id ?? x.item) }));
      if (er?.interrompida) { aplicarResultado(resultadoDoLote(itensErro as never, i.enviados, i.naoEnviados)); setLote({ intencao: i, fase: 'parado', msg: er.message }); }
      else if (er?.emAndamento) setLote({ intencao: i, fase: 'rodando', msg: null });
      else if (er && (er.recusada || er.conflito)) { marcarPendencia(i.chave, false); setLote({ intencao: i, fase: 'recusado', msg: er.message }); }
      else { setUltimos((u) => ({ ...u, ...Object.fromEntries(i.enviados.map((id) => [id, { id, desfecho: 'a_conferir' } as ResultadoItem])) })); setLote({ intencao: i, fase: 'desconhecido', msg: null }); }
    }
  };
  const conferir = async (chave?: string) => {
    const i = lote?.intencao; const k = chave ?? i?.chave; if (!k) return;
    if (i && k === i.chave) setLote((l) => (l ? { ...l, fase: 'conferindo' } : l));
    try {
      const c = await conferirGravacao(k);
      if (!i || k !== i.chave) { if (c.resultado === 'aplicada' || c.resultado === 'sem_mudanca' || c.resultado === 'nao_aplicada') ler(); else m.aviso('Ainda sem resultado final para esta gravação.', 'info'); return; }   // "a conferir" vindo do servidor (outra visita)
      const r = resultadoDaConferencia(c.itens, i.enviados);
      if (c.resultado === 'aplicada' || c.resultado === 'sem_mudanca') { aplicarResultado(r); marcarPendencia(i.chave, false); setLote({ intencao: i, fase: 'concluido', msg: null }); }
      else if (c.resultado === 'interrompida' || (c.resultado === 'em_andamento' && c.reenvio_seguro)) { aplicarResultado(r); setLote({ intencao: i, fase: 'parado', msg: null }); }
      else if (c.resultado === 'em_andamento') setLote({ intencao: i, fase: 'rodando', msg: null });
      else if (c.resultado === 'nao_aplicada') { marcarPendencia(i.chave, false); setUltimos((u) => { const n = { ...u }; for (const id of i.enviados) delete n[id]; return n; }); setLote({ intencao: i, fase: 'recusado', msg: c.erro?.mensagem ?? 'O servidor recusou o pedido. Nada foi gravado.' }); }
      else setLote({ intencao: i, fase: 'nao_encontrada', msg: null });
    } catch { if (i && k === i.chave) setLote((l) => (l ? { ...l, fase: 'desconhecido', msg: 'Não foi possível conferir agora. Tente de novo.' } : l)); }
  };
  const concluir = () => { if (lote) void enviarIntencao(lote.intencao); };   // MESMA chave e MESMO corpo: o servidor só processa os pendentes

  // ── pedidos (seleção ou linha) → confirmação na página → intenção congelada ───────────────────────────────────────────────────────
  const pedir = (acao: Acao, its: readonly ItemFila[]) => { setMotivo(''); setPedido({ acao, ...elegiveis(acao, its, ultimos) }); };
  const confirmar = () => {
    if (!pedido || pedido.vao.length === 0) return;
    if (pedido.acao === 'reabrir' && motivo.trim().length < 3) return;
    const itens = pedido.vao.map((x) => ({ id: x.id, versao: x.versao }));
    const corpo = Object.freeze({ acao: pedido.acao, itens, confirmar: true, origem: 'conferencia', ...(motivo.trim() ? { motivo: motivo.trim().slice(0, 255) } : {}) });
    const i: Intencao = Object.freeze({ chave: novaChaveOperacao(), acao: pedido.acao, corpo, enviados: Object.freeze(itens.map((x) => x.id)), naoEnviados: Object.freeze(pedido.fora.map((f) => f.it.id)) });
    setPedido(null); setSel(new Set()); void enviarIntencao(i);
  };
  const ocultarConcluidas = () => { setOcultas((o) => new Set([...o, ...Object.values(ultimos).filter((x) => x.desfecho === 'aplicada').map((x) => x.id)])); setLote(null); setUltimos((u) => Object.fromEntries(Object.entries(u).filter(([, x]) => x.desfecho !== 'aplicada'))); ler(); };

  // ── barra de seleção (prancha 05) ─────────────────────────────────────────────────────────────────────────────────────────────────
  const acoesDaSituacao: Acao[] = estado === 'pendente' ? ['aceitar', 'recusar', 'ignorar'] : estado === 'ignorada' ? ['devolver'] : estado === 'recusada' && administra ? ['reabrir'] : [];
  const contaAcao = (a: Acao) => elegiveis(a, selecionados, ultimos).vao.length;

  const colunas: ColunaTabela<ItemFila>[] = [
    { chave: 'sel', titulo: '', tipo: 'texto', ordenavel: false, classe: 'cf-col-sel',
      cabecalho: podeDecidir ? <input type="checkbox" aria-label="Selecionar todas desta página" checked={linhas.length > 0 && linhas.every((x) => sel.has(x.id))} disabled={loteAberto}
        onChange={(e) => setSel(e.target.checked ? new Set(linhas.map((x) => x.id)) : new Set())} /> : <span className="bl-so-leitor">Seleção</span>,
      render: (it) => podeDecidir ? <input type="checkbox" aria-label={`Selecionar ${it.produto} · ${it.atributo}`} checked={sel.has(it.id)} disabled={loteAberto}
        onChange={(e) => setSel((s) => { const n = new Set(s); if (e.target.checked) n.add(it.id); else n.delete(it.id); return n; })} /> : null },
    { chave: 'exp', titulo: '', tipo: 'texto', ordenavel: false, classe: 'cf-col-exp', cabecalho: <span className="bl-so-leitor">Detalhes</span>,
      render: (it, ctx) => <button type="button" className="cf-expandir" {...ctx.gatilho} aria-label={`${ctx.expandida ? 'Fechar' : 'Ver'} a evidência de ${it.produto}`}><span aria-hidden>{ctx.expandida ? '▾' : '▸'}</span></button> },
    { chave: 'product_id', titulo: 'ID', tipo: 'numero', ordenavel: false, classe: 'cf-col-id' },
    { chave: 'produto', titulo: 'Produto', tipo: 'texto', ordenavel: false, classe: 'cf-col-prod',
      render: (it) => <button type="button" className="at-link-produto cf-1l" title={it.produto} onClick={() => m.abrirProduto(it.product_id, { atributo: it.atributo_id })}>{it.produto}</button> },
    { chave: 'atributo', titulo: 'Atributo', tipo: 'texto', ordenavel: false, classe: 'cf-col-atr', render: (it) => <span className="cf-1l" title={it.atributo ?? ''}>{it.atributo ?? '—'}</span> },
    { chave: 'atual', titulo: 'Atual', tipo: 'texto', ordenavel: false, classe: 'cf-col-atual',
      render: (it) => { const u = ultimos[it.id]; const t = aConferir(it, u) ? 'Não confirmado' : textoAtual(it.destino_atual);
        return <span className={`cf-1l ${it.destino_atual.estado === 'vazio' && !aConferir(it, u) ? 'cf-fraco' : ''}`} title={t}>{t}</span>; } },
    { chave: 'sugerido', titulo: 'Sugerido', tipo: 'texto', ordenavel: false, alinhamento: 'direita', classe: 'cf-col-sug', render: (it) => <span className="cf-1l">{textoSugerido(it)}</span> },
    ...(larga ? [{ chave: 'evidencia', titulo: 'Evidência', tipo: 'texto' as const, ordenavel: false, classe: 'cf-col-evid',
      render: (it: ItemFila) => <span className="cf-1l cf-fraco" title={it.evidencia ?? ''}>{it.evidencia ?? '—'}</span> }] : []),
    { chave: 'situacao', titulo: 'Situação', tipo: 'texto', ordenavel: false, classe: 'cf-col-sit',
      render: (it) => { const s = situacao(it, ultimos[it.id]); return <span className={`cf-pilula cf-pilula--${s.tom}`} data-situacao={s.rotulo}>{s.rotulo}</span>; } },
    { chave: 'acoes', titulo: 'Ações', tipo: 'texto', ordenavel: false, classe: 'cf-col-acoes',
      render: (it) => <AcoesLinha it={it} ultimo={ultimos[it.id]} estado={estado} pode={podeDecidir} administra={administra} bloqueado={loteAberto || ocupado}
        aoAcao={(a) => pedir(a, [it])} aoConferir={() => void conferir(it.a_conferir?.chave ?? (lote?.intencao.enviados.includes(it.id) ? lote.intencao.chave : undefined))}
        aoDetalhes={() => setAberta((x) => (x === it.id ? null : it.id))} aoFicha={() => m.abrirProduto(it.product_id, { atributo: it.atributo_id })} /> },
  ];

  const filtrando = estado !== 'pendente' || atr !== 'todos' || !!q;
  const c = contar(ultimos);
  return (
    <>
      <CabecalhoTravado>
        <div className="cf-barra" role="search">
          <label className="cf-busca"><span className="bl-so-leitor">Buscar produto ou ID</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input type="search" placeholder="Buscar produto ou ID" value={busca} onChange={(e) => { setBusca(e.target.value); setPags(PAGINAS0); }} /></label>
          <MenuEscolha rotulo="Atributo" valor={atr} padrao="todos" aoEscolher={(v) => mudarFiltro(() => setAtr(v))} opcoes={[{ valor: 'todos', rotulo: 'Todos' }, ...atributos.map((a) => ({ valor: String(a.id), rotulo: a.rotulo }))]} />
          <MenuEscolha rotulo="Situação" valor={estado} aoEscolher={(v) => mudarFiltro(() => setEstado(v as EstadoSugestao))} opcoes={SITUACOES} />
          <span className="cf-contagem" aria-live="polite" data-total={resp?.total ?? ''}>{resp ? `${resp.total.toLocaleString('pt-BR')} ${estado === 'pendente' ? 'em aberto' : SITUACOES.find((s) => s.valor === estado)!.rotulo.toLowerCase()}` : '…'}</span>
        </div>
        {estado === 'ignorada' && <p className="cf-nota" data-nota-ignoradas>Ignoradas por agora. Nenhum valor foi alterado; você pode devolver estas sugestões à fila.</p>}
        {estado === 'recusada' && <p className="cf-nota">Recusadas são decisões finais e ficam aqui para consulta.{administra ? ' Quem administra o catálogo pode reabrir, com motivo.' : ''}</p>}
        {podeDecidir && selecionados.length > 0 && !pedido && acoesDaSituacao.length > 0 && (
          <div className="cf-selecao" role="region" aria-label="Seleção desta página" data-selecao={selecionados.length}>
            <span><strong>{selecionados.length}</strong> selecionada{selecionados.length > 1 ? 's' : ''}
              {estado === 'pendente' && <> · <strong>{contaAcao('aceitar')}</strong> pode{contaAcao('aceitar') === 1 ? '' : 'm'} ser aceita{contaAcao('aceitar') === 1 ? '' : 's'} · {selecionados.length - contaAcao('aceitar')} fora do aceite</>}</span>
            <span className="cf-selecao__acoes">
              {acoesDaSituacao.map((a) => <Botao key={a} primario={a === 'aceitar' || a === 'devolver'} desligado={contaAcao(a) === 0 || loteAberto} aoClicar={() => pedir(a, selecionados)}>{VERBO[a][0]} {contaAcao(a)}</Botao>)}
              <button type="button" className="at-link" onClick={() => setSel(new Set())}>Limpar seleção</button>
            </span>
          </div>)}
        {pedido && (
          <div className="cf-confirmar" role="region" aria-label="Confirmar decisão" data-confirmar={pedido.acao}>
            <div>
              <strong>{tituloConfirmacao(pedido.acao, pedido.vao.length)}</strong>
              <p className="cf-fraco">Escopo: {pedido.vao.length + pedido.fora.length} sugest{pedido.vao.length + pedido.fora.length === 1 ? 'ão' : 'ões'} desta página.
                {pedido.fora.length > 0 && <> {textoFora(pedido.fora)} não ser{pedido.fora.length === 1 ? 'á enviada' : 'ão enviadas'}.</>}</p>
              <p className="cf-fraco">{pedido.acao === 'recusar' ? 'Recusar é final: esta decisão não tem desfazer.' : pedido.acao === 'aceitar' ? 'As sugestões só saem de pendentes após a confirmação de cada gravação.' : 'Nenhum valor do produto é alterado.'}</p>
              {pedido.acao === 'reabrir' && <label className="cf-motivo"><span>Motivo (obrigatório)</span><input value={motivo} maxLength={255} onChange={(e) => setMotivo(e.target.value)} placeholder="Por que reabrir" /></label>}
            </div>
            <span className="cf-confirmar__acoes">
              <Botao primario={pedido.acao !== 'recusar'} perigo={pedido.acao === 'recusar'} desligado={pedido.vao.length === 0 || (pedido.acao === 'reabrir' && motivo.trim().length < 3)} aoClicar={confirmar}>
                Confirmar {VERBO[pedido.acao][1]} de {pedido.vao.length}</Botao>
              <Botao aoClicar={() => setPedido(null)}>Cancelar</Botao>
            </span>
          </div>)}
        {lote && <FaixaLote lote={lote} c={c} aoConferir={() => void conferir()} aoConcluir={concluir} aoOcultar={ocultarConcluidas} ocupado={ocupado} />}
      </CabecalhoTravado>
      {erro ? <Erro mensagem={erro} aoTentar={ler} /> : !resp ? <div className="cf-lendo" role="status">Lendo a fila…</div> : linhas.length === 0 ? (
        <Vazio titulo={filtrando ? 'Nenhuma pendência encontrada com estes filtros' : 'Nenhuma pendência nesta fila'}
          acao={filtrando ? <Botao aoClicar={() => { setBusca(''); setQ(''); mudarFiltro(() => { setAtr('todos'); setEstado('pendente'); }); }}>Limpar filtros</Botao> : undefined} />
      ) : (
        <div className="cf-moldura" aria-busy={lendo}>
          <TabelaDados rolagem="container" className="cf-grade" legenda="Sugestões do nome" colunas={colunas} linhas={linhas} chaveLinha={(it) => it.id}
            expandida={aberta} aoAlternarExpansao={(it) => setAberta((x) => (x === it.id ? null : it.id))}
            classeLinha={(it) => (concluida(ultimos[it.id]) ? 'cf-linha--concluida' : aConferir(it, ultimos[it.id]) ? 'cf-linha--conferir' : undefined)}
            renderExpansao={(it) => <Evidencia it={it} ultimo={ultimos[it.id]} larga={larga} />} />
        </div>)}
      {resp && (
        <div className="cf-rodape" data-faixa={faixa(pags, resp.itens.length, resp.total)}>
          <span>{faixa(pags, resp.itens.length, resp.total)} {estado === 'pendente' ? 'sugestões' : SITUACOES.find((s) => s.valor === estado)!.rotulo.toLowerCase()}</span>
          <span className="cf-fraco">Seleção restrita a esta página</span>
          <span className="cf-rodape__pag">
            <span className="cf-fraco">{POR_PAGINA} por página</span>
            <Botao desligado={pags.indice === 0 || lendo} aoClicar={() => setPags(anterior)}>Anterior</Botao>
            <span>{pags.indice + 1} de {paginasTotais(resp.total)}</span>
            <Botao desligado={!resp.proximo_cursor || lendo} aoClicar={() => setPags((p) => proxima(p, resp.proximo_cursor))}>Próxima</Botao>
          </span>
        </div>)}
    </>);
}

function tituloConfirmacao(a: Acao, n: number): string {
  const s = n === 1 ? 'sugestão' : 'sugestões';
  return a === 'aceitar' ? `Aceitar ${n} ${s} sem valor atual?` : a === 'recusar' ? `Recusar ${n} ${s}?` : a === 'ignorar' ? `Ignorar ${n} ${s} por agora?`
    : a === 'devolver' ? `Devolver ${n} ${s} à fila?` : `Reabrir ${n} ${s} recusada${n === 1 ? '' : 's'}?`;
}

function AcoesLinha({ it, ultimo, estado, pode, administra, bloqueado, aoAcao, aoConferir, aoDetalhes, aoFicha }: {
  it: ItemFila; ultimo?: ResultadoItem; estado: EstadoSugestao; pode: boolean; administra: boolean; bloqueado: boolean;
  aoAcao: (a: Acao) => void; aoConferir: () => void; aoDetalhes: () => void; aoFicha: () => void;
}) {
  const det = <button type="button" className="bl-botao cf-btn" onClick={aoDetalhes}>Detalhes</button>;
  if (aConferir(it, ultimo)) return <span className="cf-acoes"><button type="button" className="bl-botao cf-btn cf-btn--conferir" onClick={aoConferir}>Conferir gravação</button>{det}</span>;
  if (concluida(ultimo)) return <span className="cf-acoes"><span className="cf-fraco cf-feito">Decisão confirmada</span>{det}</span>;
  if (ultimo?.desfecho === 'nao_aplicada' && ultimo.motivo === 'VALUE_EXISTS') return <span className="cf-acoes"><button type="button" className="bl-botao cf-btn" onClick={aoDetalhes}>Revisar valor</button><button type="button" className="bl-botao cf-btn" onClick={aoFicha}>Abrir ficha</button></span>;
  if (!pode) return <span className="cf-acoes">{det}</span>;
  if (estado === 'pendente') return (
    <span className="cf-acoes">
      <button type="button" className="bl-botao bl-botao--primario cf-btn" disabled={bloqueado || !!it.aceite_bloqueado}
        title={it.aceite_bloqueado === 'COM_VALOR' ? 'O campo já tem valor: a sugestão não sobrescreve' : it.aceite_bloqueado ? 'Aceite indisponível' : undefined} onClick={() => aoAcao('aceitar')}>Aceitar</button>
      <button type="button" className="bl-botao cf-btn" disabled={bloqueado} onClick={() => aoAcao('recusar')}>Recusar</button>
      <button type="button" className="bl-botao cf-btn" disabled={bloqueado} onClick={() => aoAcao('ignorar')}>Ignorar</button>
    </span>);
  if (estado === 'ignorada') return <span className="cf-acoes"><button type="button" className="bl-botao cf-btn cf-btn--largo" disabled={bloqueado} onClick={() => aoAcao('devolver')}>↺ Devolver à fila</button>{det}</span>;
  if (estado === 'recusada' && administra) return <span className="cf-acoes"><button type="button" className="bl-botao cf-btn" disabled={bloqueado} onClick={() => aoAcao('reabrir')}>Reabrir</button>{det}</span>;
  return <span className="cf-acoes">{det}</span>;
}

function Evidencia({ it, ultimo, larga }: { it: ItemFila; ultimo?: ResultadoItem; larga: boolean }) {
  return (
    <div className="cf-evid" data-evidencia={it.id}>
      <div className="cf-evid__cab"><span className="cf-fraco">Evidência do nome</span><span className="cf-fraco">Origem: {it.fonte === 'nome_produto' ? 'Nome do produto' : it.fonte}</span></div>
      <p className="cf-evid__texto">{it.evidencia ?? it.produto}</p>
      {!larga && <p className="cf-fraco">Atual: {textoAtual(it.destino_atual)} → Sugerido: {textoSugerido(it)}</p>}
      {aConferir(it, ultimo) && <p className="cf-aviso" role="note">Não conseguimos confirmar esta decisão. Confira a gravação antes de tentar outra ação.</p>}
      {!aConferir(it, ultimo) && it.aceite_bloqueado === 'COM_VALOR' && <p className="cf-aviso" role="note">Atual: {textoAtual(it.destino_atual)} · Sugerido: {textoSugerido(it)} · O valor atual será preservado. Revise na ficha para alterá-lo.</p>}
      {ultimo?.desfecho === 'nao_aplicada' && <p className="cf-aviso" role="note">Não aplicada: {motivoLegivel(ultimo)}</p>}
      {(it.estado === 'recusada' || it.estado === 'ignorada' || it.estado === 'aceita') && it.decidido_em && <p className="cf-fraco">Decidido por {it.decidido_por ?? '—'} em {new Date(it.decidido_em.replace(' ', 'T')).toLocaleString('pt-BR')}{it.motivo ? ` · ${it.motivo}` : ''}</p>}
      {it.substitui_id && <p className="cf-fraco">Substitui a sugestão #{it.substitui_id} (conteúdo novo).</p>}
    </div>);
}

function FaixaLote({ lote, c, aoConferir, aoConcluir, aoOcultar, ocupado }: { lote: EstadoLote; c: ReturnType<typeof contar>; aoConferir: () => void; aoConcluir: () => void; aoOcultar: () => void; ocupado: boolean }) {
  const n = lote.intencao.enviados.length; const f = lote.fase;
  const resumo = `${c.aplicadas} ${c.aplicadas === 1 ? 'feita' : 'feitas'} · ${c.nao_aplicadas} não aplicada${c.nao_aplicadas === 1 ? '' : 's'} · ${c.a_conferir} a conferir`;
  return (
    <div className={`cf-lote cf-lote--${f}`} role="status" aria-live="polite" data-lote={f} data-chave={lote.intencao.chave}>
      <div>
        {f === 'enviando' && <strong>Gravando {n} decis{n === 1 ? 'ão' : 'ões'}…</strong>}
        {f === 'conferindo' && <strong>Conferindo no servidor…</strong>}
        {f === 'concluido' && <><strong>Último lote · {n} tentativa{n === 1 ? '' : 's'}: {resumo}</strong>
          <p className="cf-fraco">{lote.intencao.naoEnviados.length > 0 ? `${lote.intencao.naoEnviados.length} selecionada${lote.intencao.naoEnviados.length === 1 ? ' não foi enviada' : 's não foram enviadas'}. ` : ''}As linhas concluídas ficam visíveis até você ocultá-las.</p></>}
        {f === 'desconhecido' && <><strong>{MSG_DESCONHECIDO}</strong><p className="cf-fraco">Nada será reenviado sem você pedir. Use “Conferir gravação”.{lote.msg ? ` ${lote.msg}` : ''}</p></>}
        {f === 'rodando' && <><strong>Ainda gravando no servidor.</strong><p className="cf-fraco">Confira de novo em instantes.</p></>}
        {f === 'parado' && <><strong>O lote parou no meio: {resumo}.</strong><p className="cf-fraco">“Concluir este lote” envia de novo o MESMO pedido: só as pendentes são processadas e nada é duplicado.</p></>}
        {f === 'nao_encontrada' && <><strong>Ainda não encontramos o resultado desta gravação.</strong><p className="cf-fraco">Você pode conferir de novo ou concluir com segurança (mesmo pedido, nada é duplicado).</p></>}
        {f === 'recusado' && <><strong>Não foi gravado.</strong><p className="cf-fraco">{lote.msg}</p></>}
      </div>
      <span className="cf-lote__acoes">
        {(f === 'desconhecido' || f === 'rodando' || f === 'parado' || f === 'nao_encontrada' || f === 'conferindo') && <Botao trabalhando={f === 'conferindo'} desligado={ocupado} aoClicar={aoConferir}>Conferir gravação</Botao>}
        {(f === 'parado' || f === 'nao_encontrada') && <Botao primario desligado={ocupado} aoClicar={aoConcluir}>Concluir este lote</Botao>}
        {f === 'concluido' && c.aplicadas > 0 && <Botao aoClicar={aoOcultar}>Ocultar concluídas</Botao>}
      </span>
    </div>);
}
