// panel-atributos/src/screens/Vincular.tsx — VINCULAR atributos a produtos (redesenho 18/11, ESQUERDA). Vínculo ≠ valor: valores e unidades
// ficam na Ficha e no Preencher. O título "Vincular" vem do cabeçalho do módulo. Alternância Aplicar | Matriz como no ar (a MATRIZ V2, pedido do
// Jhony em 19/11, está em VincularMatriz.tsx); aqui dentro não há descrição nem passos.
//
// Layout: FAIXA (busca nome/ID, subcategoria, kit, "N produtos · N selecionados" e, com seleção, a barra de ações) e, abaixo, a TabelaDados
// com TODOS os produtos filtrados (☐ | ID | Produto | Subcategoria | Atributos vinculados). v3 (sobre o UX-1b-v2 da CIMA, a6c1cc95): a faixa
// vai para o slot <CabecalhoTravado> (sticky, junto do título e das abas) e a tabela usa rolagem="container" — quem rola é a PÁGINA, como nas
// outras abas; o cabeçalho das colunas gruda abaixo do bloco fixo (--at-topo-fixo). Nenhuma altura calculada em JS (a medição da
// altura restante do v2 saiu com o layout antigo).
//
// Linha expansível (clicar no NOME): atributos vinculados ao produto com a ORIGEM — kit (cadeado: não se remove aqui) ou "Avulso"
// (remover). Fonte: GET ficha_produto (a MESMA aplicabilidade da ficha: kits gerais, por escopo, diretos, avulsos incluir/excluir),
// sob demanda por produto, com resposta atrasada descartada. "+ Vincular atributo…" grava NA HORA como avulso (POST produto_atributo
// com a versao_vinculos da leitura vigente). Vários produtos: massa_previa → frase curta → massa_aplicar com o RETRATO da intenção e a
// chave de idempotência (resultado incerto reaproveita a chave). Servidor inalterado.
//
// Acréscimos 18/11 (aceite): (1) a confirmação mostra o ALCANCE com os números e os destinos (ID + nome) da MESMA prévia que vai no
// massa_aplicar (mesmo retrato/versao_previa; a prévia precisa cobrir exatamente os produtos do pedido); (2) remover um avulso pede
// confirmação curta NA LINHA, dizendo o efeito real (kit que continua, valor salvo que fica — fraseRemocao); (3) "N selecionados · M
// fora do filtro" + "Rever seleção" (lista todos os selecionados, inclusive os fora do filtro, para desmarcar); (4) a linha expandida
// mostra o ID e o nome do produto junto do "+ Vincular atributo…".
// Acréscimos 18/11 (2ª rodada): (5) a remoção do avulso diz o efeito na UNIDADE quando o produto tem unidade própria (fraseUnidadeRemocao:
// regra D3 de Aplicabilidade.php, unidade_sem_ajuste da ficha); (6) nunca confirmar o que não está visível — o "+ Vincular atributo…"
// passa a ser ESCOLHER (clique) + "Vincular <nome>"; se a busca muda e o escolhido sai da lista, a escolha é limpa e o botão desliga
// (escolhaVigente). Na massa (escolha múltipla) os escolhidos persistem fora da busca, mas sempre visíveis em chips "N escolhidos", e o
// Confirmar nomeia o que será gravado (rotuloConfirmarMassa).
// v2 (18/11, P1 parecer externo + Codex): (7) "foi salvo ou não" — as escritas usam o api.ts e o contrato da CIMA/ESQUERDA: só "Salvo"
// com `recibo`; resposta perdida/ilegível/2xx sem recibo = "Não conseguimos confirmar se foi salvo." + "Conferir gravação"
// (GET conferir_gravacao&chave=); a chave pendente (avulso: X-Chave-Operacao; massa: a `chave` do lote) fica no estado da TELA, então
// sobrevive a fechar e reabrir o diálogo, e a MESMA intenção reenviada reaproveita a chave. (8) prévia × gravação pela mesma regra do
// servidor: "Já aplicável" (nada é gravado) × "Entra na ficha"; 0 efeitos = "Nada mudou". (9) atributo desativado entre a prévia e a
// confirmação: 422 "O atributo foi desativado. Atualize a seleção." — a prévia cai e o dicionário é relido. (10) o resultado da massa
// mostra os destinos com o link da ficha focando o atributo (#/panel-atributos/produto/<id>?atributo=<id>).
import React from 'react';
import './vincular.css';   // regras do Vincular v4 (antes no modulo.css da CIMA)
import type { AtributoDicionario, Ficha, KitResumo, Previa, ProdutoResumo, Vitrine } from '../lib/tipos';
import { conferirGravacao, enviar, ErroApi, MSG_DESCONHECIDO, novaChave, novaChaveOperacao, obter, type Recibo } from '../lib/api';
import { rotuloSubcategoria } from '../lib/rotulos';
import { useModulo } from '../app/contexto';
import { Botao, Carregando, ChipKit, Dialogo, Erro, Etiqueta, CabecalhoTravado, Vazio } from '../ui/Comuns';
import { TabelaDados, type ColunaTabela } from '../ui/TabelaDados';
import { VincularMatriz } from './VincularMatriz';
import type { Ordenacao } from '../lib/ordenar';
import { iniciarGravacao } from '../lib/integridade';
import {
  resultadoIncerto, alcanceMassa, alternarExpansao, alternarSelecao, candidatosVincular, chaveParaPedido, concluirCarga, corpoMassa, desmarcarFiltrados,
  estadoMarcarTodos, falharCarga, filtrarPorIdNome, filtrarProdutos, foraDoFiltro, fraseAtributos, fraseKit, fraseRemocao, fraseRemovido, escolhaVigente, rotuloConfirmarMassa, rotuloConfirmarVincular, textoEscolhidos,
  fraseSalvo, iniciarCarga, marcarFiltrados, previaCobrePedido, selecaoParaRever, selecaoValida, SEM_KIT, temOpostos, textoContagem,
  vinculosDaFicha, type Cargas, type FiltroVincular, type IntencaoMassa, type Vinculo, type VinculosProduto,
  fraseConferencia, linkFichaAtributo, type PreviaV2, type DestinoMassa, kitsEspecificos, textoKits,
} from '../lib/vincular';

type Status = { tom: 'andando' | 'ok' | 'erro' | 'aviso'; texto: string; link?: { pid: number; atributo: number } };
/** Gravação de resultado INCERTO de UM produto (avulso): a chave de operação e o pedido exato (reenvio igual = mesma chave). */
type PendenteAvulso = { pedido: string; chave: string };
/** Lote de resultado INCERTO (massa): guardado na TELA — sobrevive a fechar e reabrir o diálogo. */
export type PendenteMassa = { pedido: string; chave: string; tipo: 'atributos' | 'kit'; produtos: number[]; intencao: IntencaoMassa; destinos: DestinoMassa[]; atributo: number | null };
type Gravado = { kits_aplicados: number; inclusoes: number };
/** Link da ficha focando o atributo: href real (abrir em nova aba/copiar) + clique simples navega dentro do módulo sem remontar o painel. */
function LinkFicha({ pid, atributo, children }: { pid: number; atributo: number | null; children: React.ReactNode }) {
  const m = useModulo();
  return <a href={linkFichaAtributo(pid, atributo)} data-link-ficha={`${pid}${atributo ? `:${atributo}` : ''}`} className="at-link"
    onClick={(e) => { if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); m.abrirProduto(pid, atributo ? { atributo } : undefined); }}>{children}</a>;
}
const ID_TABELA = 'vinc-produtos';

export function Vincular() {
  const m = useModulo();
  const [vit, setVit] = React.useState<Vitrine | null>(null);
  const [kits, setKits] = React.useState<KitResumo[] | null>(null);
  const [dic, setDic] = React.useState<AtributoDicionario[] | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [filtro, setFiltro] = React.useState<FiltroVincular>({ busca: '', subcategoria: '', kit: '' });
  const [ordenacao, setOrdenacao] = React.useState<Ordenacao>({ chave: 'nome', direcao: 'asc' });
  const [abertos, setAbertos] = React.useState<number[]>([]);
  const [cargas, setCargas] = React.useState<Cargas<VinculosProduto>>({});
  const [gravando, setGravando] = React.useState<Record<number, number | null>>({});   // produto → atributo em gravação
  const [status, setStatus] = React.useState<Record<number, Status>>({});
  const [massa, setMassa] = React.useState<{ tipo: 'atributos' | 'kit'; produtos: number[] } | null>(null);
  const [revendo, setRevendo] = React.useState<number[] | null>(null);   // "Rever seleção": retrato dos ids ao abrir (desmarcar não some da lista)
  const [pendentes, setPendentes] = React.useState<Record<number, PendenteAvulso>>({});   // produto → gravação avulsa de resultado incerto
  const [pendenteMassa, setPendenteMassa] = React.useState<PendenteMassa | null>(null);
  const [modo, setModo] = React.useState<'aplicar' | 'matriz'>('aplicar');   // Aplicar | Matriz, como no ar (e4ee5f48)
  const seqCarga = React.useRef(0);
  const seqVitrine = React.useRef(0);
  const travas = React.useRef(new Set<number>());   // clique duplo: uma gravação por produto

  // ── leituras ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const lerVitrine = React.useCallback(() => {   // recarga em segundo plano: mantém a tabela; resposta atrasada é ignorada
    const seq = ++seqVitrine.current;
    obter<Vitrine>('vitrine').then((v) => { if (seq === seqVitrine.current) setVit(v); }).catch(() => { /* a tabela continua com a leitura anterior */ });
  }, []);
  const carregar = React.useCallback(() => {
    setErro(null); const seq = ++seqVitrine.current;
    Promise.all([obter<Vitrine>('vitrine'), obter<{ kits: KitResumo[] }>('kits'), obter<{ atributos: AtributoDicionario[] }>('dicionario')])
      .then(([v, k, d]) => { if (seq !== seqVitrine.current) return; setVit(v); setKits(k.kits.filter((x) => x.ativo && x.itens > 0)); setDic(d.atributos.filter((a) => Number(a.ativo) === 1)); })
      .catch((e) => { if (seq === seqVitrine.current) setErro(e instanceof Error ? e.message : 'Falha.'); });
  }, []);
  React.useEffect(carregar, [carregar, m.versao]);
  const recarregarDic = React.useCallback(() => {   // atributo desativado no meio do caminho: relê o dicionário (a seleção se atualiza)
    obter<{ atributos: AtributoDicionario[] }>('dicionario').then((d) => setDic(d.atributos.filter((a) => Number(a.ativo) === 1))).catch(() => { /* fica o anterior */ });
  }, []);

  const lerVinculos = React.useCallback((pid: number) => {
    const seq = ++seqCarga.current;
    setCargas((c) => iniciarCarga(c, pid, seq));
    obter<Ficha>('ficha_produto', { product_id: pid })
      .then((f) => setCargas((c) => concluirCarga(c, pid, seq, vinculosDaFicha(f))))
      .catch((e) => setCargas((c) => falharCarga(c, pid, seq, e instanceof ErroApi ? e.message : 'Sem resposta do servidor.')));
  }, []);

  // Intenção vinda de Produtos ("Aplicar kit" / "Adicionar atributo" com seleção): abre a ação certa UMA vez
  const intencaoUsada = React.useRef(false);
  React.useEffect(() => {
    if (intencaoUsada.current || !vit || !kits || !dic || !vit.pode_vincular) return;
    intencaoUsada.current = true;
    const sel = selecaoValida(m.selecao, vit.produtos);
    if (m.intencaoVincular && sel.length) setMassa({ tipo: m.intencaoVincular === 'kit' ? 'kit' : 'atributos', produtos: sel });
  }, [vit, kits, dic, m.intencaoVincular, m.selecao]);

  // ── gravação por produto (avulso) ────────────────────────────────────────────────────────────────────────────────────────
  const gravarAvulso = React.useCallback(async (pid: number, v: Pick<Vinculo, 'atributo_id' | 'rotulo'> & Partial<Pick<Vinculo, 'origens'>>, modo: 'incluir' | null) => {
    const atual = cargas[pid];
    if (!atual || atual.fase !== 'pronto') return;                    // só com a leitura vigente (nunca versão velha com dado novo)
    if (travas.current.has(pid)) return;                               // clique duplo: já há uma gravação deste produto
    travas.current.add(pid);
    const corpo = { product_id: pid, atributo_id: v.atributo_id, modo, versao_vinculos: atual.dados.versao_vinculos };
    const pedido = JSON.stringify(corpo);
    const chave = chaveParaPedido(pedido, pendentes[pid] ?? null, novaChaveOperacao);   // reenvio da MESMA intenção = mesma chave
    setGravando((g) => ({ ...g, [pid]: v.atributo_id }));
    setStatus((s) => ({ ...s, [pid]: { tom: 'andando', texto: modo ? `Vinculando ${v.rotulo}…` : `Removendo ${v.rotulo}…` } }));
    try {
      const r = await enviar<{ desfecho?: string; recibo: Recibo }>('produto_atributo', corpo, { chave });   // só volta aqui COM recibo
      setPendentes((p) => { const { [pid]: _, ...resto } = p; return resto; });
      const nada = r.desfecho === 'sem_mudanca' || r.recibo.desfecho === 'sem_mudanca';
      const texto = nada ? `Nada mudou: ${v.rotulo} já estava assim.` : modo ? `Salvo: ${v.rotulo} vinculado como avulso.` : fraseRemovido({ rotulo: v.rotulo, origens: v.origens ?? [] });
      setStatus((s) => ({ ...s, [pid]: { tom: 'ok', texto, ...(modo ? { link: { pid, atributo: v.atributo_id } } : {}) } }));
      m.aviso(texto);
    } catch (e) {
      const err = e instanceof ErroApi ? e : null;
      if (!err || resultadoIncerto(err)) {   // não sabemos se gravou (inclui 5xx): guarda a chave para conferir (nunca "Salvo" nem "Não foi salvo")
        setPendentes((p) => ({ ...p, [pid]: { pedido, chave } }));
        const texto = err?.emAndamento ? 'A gravação ainda está em andamento. Use "Conferir gravação".' : `${MSG_DESCONHECIDO} Use "Conferir gravação" antes de tentar de novo.`;
        setStatus((s) => ({ ...s, [pid]: { tom: 'aviso', texto } }));
        m.aviso(texto, 'info');
      } else {
        setPendentes((p) => { const { [pid]: _, ...resto } = p; return resto; });
        const texto = err.conflito ? 'Os vínculos deste produto mudaram desde a leitura. A lista foi recarregada: confira e tente de novo.' : `Não foi salvo: ${err.message}`;
        setStatus((s) => ({ ...s, [pid]: { tom: 'erro', texto } }));
        m.aviso(texto, 'erro');
        if (err.campos.includes('atributo_id')) recarregarDic();
      }
    } finally {
      travas.current.delete(pid);
      setGravando((g) => ({ ...g, [pid]: null }));
      lerVinculos(pid); lerVitrine();
    }
  }, [cargas, pendentes, lerVinculos, lerVitrine, recarregarDic, m]);

  /** "Conferir gravação" de UM produto: GET conferir_gravacao&chave= (não grava nada). */
  const conferirAvulso = React.useCallback(async (pid: number) => {
    const p = pendentes[pid]; if (!p) return;
    setStatus((s) => ({ ...s, [pid]: { tom: 'andando', texto: 'Conferindo a gravação…' } }));
    try {
      const c = await conferirGravacao(p.chave);
      const f = fraseConferencia(c.resultado, c.erro?.mensagem);
      if (f.final) setPendentes((x) => { const { [pid]: _, ...resto } = x; return resto; });
      setStatus((s) => ({ ...s, [pid]: { tom: f.tom, texto: f.texto } }));
      if (f.gravado) { m.aviso(f.texto); lerVinculos(pid); lerVitrine(); }
    } catch (e) {
      setStatus((s) => ({ ...s, [pid]: { tom: 'aviso', texto: `Não foi possível conferir agora${e instanceof ErroApi ? ` (${e.message})` : ''}. Tente de novo.` } }));
    }
  }, [pendentes, lerVinculos, lerVitrine, m]);

  const produtos = vit?.produtos ?? [];
  const filtrados = React.useMemo(() => filtrarProdutos(produtos, filtro), [produtos, filtro]);
  const idsFiltrados = React.useMemo(() => filtrados.map((p) => p.id), [filtrados]);
  const sel = React.useMemo(() => selecaoValida(m.selecao, produtos), [m.selecao, produtos]);
  const selSet = React.useMemo(() => new Set(sel), [sel]);
  const contagem = React.useCallback((p: ProdutoResumo) => { const c = cargas[p.id]; return c?.dados ? c.dados.vinculos.length : p.geral.total; }, [cargas]);

  const alternarLinha = React.useCallback((p: ProdutoResumo) => {
    if (!abertos.includes(p.id)) { const c = cargas[p.id]; if (!c || c.fase === 'erro') lerVinculos(p.id); }
    setAbertos((a) => alternarExpansao(a, p.id));
  }, [abertos, cargas, lerVinculos]);

  const marcar = m.setSelecao;
  const estadoTodos = estadoMarcarTodos(sel, idsFiltrados);
  const colunas = React.useMemo<ColunaTabela<ProdutoResumo>[]>(() => [
    { chave: 'sel', titulo: 'Selecionar', tipo: 'texto', ordenavel: false, alinhamento: 'centro', classe: 'at-td--curta',
      cabecalho: <CaixaTodos estado={estadoTodos} total={idsFiltrados.length} aoMudar={(todos) => marcar(todos ? marcarFiltrados(sel, idsFiltrados) : desmarcarFiltrados(sel, idsFiltrados))} />,
      render: (p) => <input type="checkbox" className="at-td__caixa" aria-label={`Selecionar ${p.nome}`} checked={selSet.has(p.id)} onChange={() => marcar(alternarSelecao(sel, p.id))} /> },
    { chave: 'id', titulo: 'ID', tipo: 'numero', classe: 'at-td--curta' },
    { chave: 'nome', titulo: 'Produto', tipo: 'texto', classe: 'at-vincular__nome',
      render: (p, ctx) => <button type="button" className="at-td__gatilho" {...ctx.gatilho} title={ctx.expandida ? 'Fechar os vínculos' : 'Ver os atributos vinculados'}><span className="at-td__gatilho-seta" aria-hidden>▶</span><span>{p.nome}</span></button> },
    { chave: 'subcategoria', titulo: 'Subcategoria', tipo: 'texto', valor: (p) => (p.subcategoria ? rotuloSubcategoria(p.subcategoria) : ''), classe: 'at-td--curta', render: (p) => (p.subcategoria ? rotuloSubcategoria(p.subcategoria) : '—') },
    // v4 (19/11, pedido do Jhony): coluna Kit ordenável — kits ESPECÍFICOS (mesma regra do filtro "Sem kit específico"); até 2 selos + "+N"
    { chave: 'kit', titulo: 'Kit', tipo: 'texto', valor: textoKits, classe: 'at-td--curta at-vincular__kits',
      render: (p) => { const ks = kitsEspecificos(p); if (!ks.length) return <span className="at-fraco" title="Sem kit específico">—</span>;
        return <span className="at-vincular__kits-lista" title={ks.map((k) => k.nome).join(', ')}>{ks.slice(0, 2).map((k) => <ChipKit key={k.id} nome={k.nome} pequeno />)}{ks.length > 2 && <span className="at-fraco">+{ks.length - 2}</span>}</span>; } },
    { chave: 'vinculados', titulo: 'Atributos vinculados', tipo: 'numero', valor: contagem, render: (p) => contagem(p).toLocaleString('pt-BR') },
  ], [estadoTodos, idsFiltrados, sel, selSet, marcar, contagem]);

  if (erro) return <Erro mensagem={erro} aoTentar={carregar} />;
  if (!vit || !kits || !dic) return <Carregando rotulo="Carregando produtos" />;
  if (!vit.pode_vincular) return <Vazio titulo="Seu nível não permite vincular">Peça a alguém com nível de administração (80).</Vazio>;

  const ativos = vit.produtos.filter((p) => p.ativo);
  const subcats = [...new Set(ativos.map((p) => p.subcategoria ?? ''))].sort((a, b) => rotuloSubcategoria(a || null).localeCompare(rotuloSubcategoria(b || null), 'pt-BR'));
  const fora = foraDoFiltro(sel, idsFiltrados);
  const mudar = (p: Partial<FiltroVincular>) => setFiltro((f) => ({ ...f, ...p }));
  const aposMassa = () => {   // dados novos: relê a vitrine e os produtos abertos; os fechados perdem a leitura antiga
    lerVitrine();
    setCargas((c) => Object.fromEntries(Object.entries(c).filter(([id]) => abertos.includes(Number(id)))));
    abertos.forEach((id) => lerVinculos(id));
  };

  return (
    <div className="at-vincular">
      <CabecalhoTravado>{/* alternância Aplicar | Matriz no bloco travado, como no ar (o h2 fica escondido pelo CSS do cabeçalho travado) */}
        <div className="at-titulo-tela"><div><h2>Vincular</h2></div>
          <div className="at-alternador" role="group" aria-label="Visão">
            <button type="button" className={modo === 'aplicar' ? 'ativo' : ''} aria-pressed={modo === 'aplicar'} onClick={() => setModo('aplicar')}>Aplicar</button>
            <button type="button" className={modo === 'matriz' ? 'ativo' : ''} aria-pressed={modo === 'matriz'} onClick={() => setModo('matriz')}>Matriz</button>
          </div></div>
      </CabecalhoTravado>
      {modo === 'matriz' ? <VincularMatriz vit={vit} kits={kits} sel={selSet} /> : (<>
      <CabecalhoTravado>
      <div className="at-td-faixa" role="region" aria-label="Busca, filtros e ações">
        <div className="at-td-faixa__linha" role="search">
          <label className="at-busca">
            <span className="bl-so-leitor">Buscar produto por nome ou ID</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input type="search" placeholder="Buscar por nome ou ID" value={filtro.busca} onChange={(e) => mudar({ busca: e.target.value })} />
          </label>
          <select className="at-select" aria-label="Subcategoria" value={filtro.subcategoria} onChange={(e) => mudar({ subcategoria: e.target.value })}>
            <option value="">Todas as subcategorias</option>{subcats.map((s) => <option key={s} value={s}>{rotuloSubcategoria(s || null)}</option>)}
          </select>
          <select className="at-select" aria-label="Kit" value={filtro.kit} onChange={(e) => mudar({ kit: e.target.value })}>
            <option value="">Todos os kits</option><option value={SEM_KIT}>Sem kit específico</option>
            {vit.kits.map((k) => <option key={k.id} value={String(k.id)}>{k.nome}</option>)}
          </select>
          <span className="at-td-faixa__contagem" role="status" aria-live="polite" data-contagem>{textoContagem(filtrados.length, ativos.length, sel.length, fora)}</span>
        </div>
        {sel.length > 0 && (
          <div className="at-td-faixa__acoes" role="group" aria-label="Ações para os produtos selecionados">
            <strong data-selecao-resumo>{sel.length.toLocaleString('pt-BR')} {sel.length === 1 ? 'selecionado' : 'selecionados'}{fora > 0 && <span className="at-fraco" style={{ fontWeight: 400 }}> · {fora.toLocaleString('pt-BR')} fora do filtro</span>}</strong>
            <button type="button" className="at-link" data-rever-selecao onClick={() => setRevendo([...sel])}>Rever seleção</button>
            <Botao primario aoClicar={() => setMassa({ tipo: 'atributos', produtos: [...sel] })}>Vincular atributo aos {sel.length.toLocaleString('pt-BR')} selecionados</Botao>
            <Botao aoClicar={() => setMassa({ tipo: 'kit', produtos: [...sel] })}>Aplicar kit aos selecionados</Botao>
            <button type="button" className="at-link" onClick={() => marcar([])}>Limpar seleção</button>
          </div>
        )}
        {pendenteMassa && !massa && (
          <p className="at-salvo at-salvo--aviso" role="status" data-pendente-massa style={{ margin: 0 }}>
            Gravação em massa com resultado incerto ({pendenteMassa.produtos.length.toLocaleString('pt-BR')} produtos).{' '}
            <button type="button" className="at-link" data-abrir-pendente onClick={() => setMassa({ tipo: pendenteMassa.tipo, produtos: pendenteMassa.produtos })}>Conferir gravação</button>
          </p>
        )}
      </div>
      </CabecalhoTravado>
      <div>
        <TabelaDados rolagem="container" colunas={colunas} linhas={filtrados} chaveLinha={(p) => p.id} legenda="Produtos para vincular atributos" idTabela={ID_TABELA}
          ordenacao={ordenacao} aoOrdenar={setOrdenacao} classeLinha={(p) => (selSet.has(p.id) ? 'at-td__linha--marcada' : undefined)}
          expandida={(p) => abertos.includes(p.id)} aoAlternarExpansao={alternarLinha}
          renderExpansao={(p) => (
            <DetalheVinculos produto={p} carga={cargas[p.id]} dic={dic} gravando={gravando[p.id] ?? null} status={status[p.id] ?? null}
              aoTentar={() => lerVinculos(p.id)} aoVincular={(a) => void gravarAvulso(p.id, { atributo_id: a.id, rotulo: a.rotulo }, 'incluir')}
              aoRemover={(v) => void gravarAvulso(p.id, v, null)} pendente={!!pendentes[p.id]} aoConferir={() => void conferirAvulso(p.id)} />
          )} />
        {filtrados.length === 0 && <p className="at-fraco" style={{ padding: 12 }}>Nenhum produto com estes filtros.</p>}
      </div>
      </>)}
      {massa && (
        <DialogoMassa tipo={massa.tipo} produtos={massa.produtos} dic={dic} kits={kits} foraDoFiltro={massa.produtos.filter((id) => !idsFiltrados.includes(id))} aoFechar={() => setMassa(null)}
          aoFeito={() => { setMassa(null); aposMassa(); }} pendente={pendenteMassa} aoPendente={setPendenteMassa} aoRecarregarDic={recarregarDic} />
      )}
      {revendo && (
        <DialogoRever itens={selecaoParaRever(revendo, produtos, idsFiltrados)} marcados={selSet} aoAlternar={(id) => marcar(alternarSelecao(sel, id))} aoFechar={() => setRevendo(null)} />
      )}
    </div>
  );
}

/** Caixa "marcar todos os FILTRADOS" no cabeçalho (indeterminada quando só parte está marcada). */
function CaixaTodos({ estado, total, aoMudar }: { estado: 'nenhum' | 'alguns' | 'todos'; total: number; aoMudar: (todos: boolean) => void }) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = estado === 'alguns'; }, [estado]);
  return <input ref={ref} type="checkbox" className="at-td__caixa" disabled={!total} checked={estado === 'todos'} aria-label={`Marcar todos os ${total} produtos filtrados`}
    onChange={() => aoMudar(estado !== 'todos')} />;
}

const Cadeado = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden style={{ verticalAlign: '-1px', marginLeft: 3 }}>
    <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

/** Linha expandida: atributos vinculados (só o nome) com a origem; "+ Vincular atributo…" grava como avulso na hora. */
function DetalheVinculos({ produto, carga, dic, gravando, status, aoTentar, aoVincular, aoRemover, pendente = false, aoConferir }: {
  produto: ProdutoResumo; carga: Cargas<VinculosProduto>[number] | undefined; dic: AtributoDicionario[]; gravando: number | null; status: Status | null;
  aoTentar: () => void; aoVincular: (a: AtributoDicionario) => void; aoRemover: (v: Vinculo) => void; pendente?: boolean; aoConferir?: () => void;
}) {
  const [busca, setBusca] = React.useState<string | null>(null);   // null = seletor fechado
  const [escolhido, setEscolhido] = React.useState<number | null>(null);   // escolha ÚNICA: só vale enquanto está na lista visível
  const [confirmar, setConfirmar] = React.useState<number | null>(null);   // atributo com a confirmação de remoção aberta NA LINHA
  const enviado = React.useRef(false);
  // a confirmação fica aberta (com "removendo…") até a gravação terminar: o 2º clique de um clique duplo cai no botão desligado
  React.useEffect(() => { if (gravando === null && enviado.current) { enviado.current = false; setConfirmar(null); } }, [gravando]);
  const campo = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (busca !== null) campo.current?.focus(); }, [busca !== null]);   // eslint-disable-line react-hooks/exhaustive-deps
  const dados = carga?.dados ?? null;
  const ocupado = gravando !== null || carga?.fase === 'carregando';
  if (!carga || (carga.fase === 'carregando' && !dados)) return <div className="at-carregando" role="status" aria-live="polite"><span className="at-giro" aria-hidden />Carregando os vínculos de {produto.nome}…</div>;
  if (carga.fase === 'erro' && !dados) return (
    <div role="alert" data-erro-vinculos>
      <span className="at-salvo at-salvo--erro">Não foi possível carregar os vínculos deste produto. {carga.erro}</span>{' '}
      <Botao aoClicar={aoTentar}>Tentar novamente</Botao>
    </div>
  );
  const v = dados!;
  const cand = busca !== null ? candidatosVincular(dic, v.vinculos.map((x) => x.atributo_id), busca) : null;
  // a escolha só vale se está na lista VISÍVEL: derivada a cada render (confirmar desliga na hora) e LIMPA quando a busca muda (onChange)
  const vigente = cand ? escolhaVigente(escolhido, cand.lista) : null;
  const atrEscolhido = vigente !== null ? cand!.lista.find((a) => a.id === vigente) ?? null : null;
  const fecharSeletor = () => { setBusca(null); setEscolhido(null); };
  return (
    <div data-vinculos-de={produto.id}>
      {carga.fase === 'erro' && <p className="at-salvo at-salvo--erro" role="alert">Não foi possível atualizar a lista ({carga.erro}). <button type="button" className="at-link" onClick={aoTentar}>Tentar novamente</button></p>}
      {v.vinculos.length === 0 ? <p className="at-fraco" style={{ margin: '4px 0' }}>Nenhum atributo vinculado a este produto.</p> : (
        <ul className="at-tags" aria-label={`Atributos vinculados a ${produto.nome}`}>
          {v.vinculos.map((x) => (
            <li key={x.atributo_id} data-atributo={x.atributo_id}>
              <span>{x.rotulo}</span>{' '}
              {x.origens.map((o) => o.tipo === 'kit'
                ? <span key={`k${o.kit_id}`} data-origem="kit" className="at-td__origem" title={`Vem do kit ${o.nome}: não se remove aqui (mude o kit ou registre uma exceção na Ficha).`}><ChipKit nome={o.nome} pequeno titulo={`Kit ${o.nome} (não se remove aqui)`} /><Cadeado /></span>
                : <span key="avulso" data-origem="avulso" className="at-td__origem"><Etiqueta tom="info">Avulso</Etiqueta>{' '}
                    {confirmar !== x.atributo_id && <button type="button" className="at-link" disabled={ocupado || !v.pode_vincular} aria-label={`Remover o vínculo avulso de ${x.rotulo}`} onClick={() => setConfirmar(x.atributo_id)}>
                      remover</button>}</span>)}
              {confirmar === x.atributo_id && x.avulso && (
                <div data-confirmar-remocao={x.atributo_id} role="group" aria-label={`Confirmar a remoção do vínculo avulso de ${x.rotulo}`}
                  style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, margin: '4px 0 2px', padding: '6px 8px', border: '1px solid var(--bl-borda)', borderRadius: 6, background: 'var(--bl-superficie-2)', color: 'var(--bl-texto-2)', fontSize: 12.5 }}
                  onKeyDown={(e) => { if (e.key === 'Escape' && gravando === null) { e.stopPropagation(); setConfirmar(null); } }} data-esc-local>
                  <span data-efeito-remocao>{fraseRemocao(x)}</span>
                  <button type="button" className="at-link" style={{ color: 'var(--bl-erro)', fontWeight: 600 }} disabled={ocupado} data-confirma-remover
                    onClick={() => { enviado.current = true; aoRemover(x); }}>{gravando === x.atributo_id ? 'removendo…' : 'Remover avulso'}</button>
                  <button type="button" className="at-link" disabled={gravando !== null} onClick={() => setConfirmar(null)}>cancelar</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {v.pode_vincular && (busca === null
        ? (
          <div data-identidade={produto.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <span style={{ color: 'var(--bl-texto-2)' }}><span className="at-fraco">ID</span> <strong data-identidade-id>{produto.id}</strong> · <span data-identidade-nome>{produto.nome}</span></span>
            <button type="button" className="at-link" disabled={ocupado} onClick={() => setBusca('')}>+ Vincular atributo…</button>
          </div>
        ) : (
          <div data-seletor-atributo style={{ marginTop: 6, maxWidth: 560 }} data-esc-local onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); fecharSeletor(); } }}>
            <p data-identidade={produto.id} style={{ margin: '0 0 4px', color: 'var(--bl-texto-2)' }}>Vincular a <span className="at-fraco">ID</span> <strong data-identidade-id>{produto.id}</strong> · <span data-identidade-nome>{produto.nome}</span></p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input ref={campo} className="at-campo" style={{ flex: 1 }} type="search" placeholder="Buscar atributo por rótulo ou código" aria-label={`Buscar atributo para vincular a ${produto.nome}`}
                value={busca} onChange={(e) => { const q = e.target.value; setBusca(q); setEscolhido((x) => escolhaVigente(x, candidatosVincular(dic, v.vinculos.map((y) => y.atributo_id), q).lista)); }} />
              <button type="button" className="at-link" onClick={fecharSeletor}>fechar</button>
            </div>
            <p className="at-fraco" style={{ margin: '4px 0' }}>{cand!.total === 0 ? 'Nenhum atributo ativo disponível com esta busca.' : cand!.total > cand!.lista.length ? `${cand!.lista.length} de ${cand!.total} — refine a busca.` : `${cand!.total} atributo(s) ainda não vinculado(s).`}</p>
            <ul className="at-escolha at-escolha--curta" aria-label="Atributos para vincular">
              {cand!.lista.map((a) => (
                <li key={a.id}>
                  <button type="button" className={`at-link${vigente === a.id ? ' ativo' : ''}`} style={vigente === a.id ? { fontWeight: 700 } : undefined} aria-pressed={vigente === a.id}
                    disabled={ocupado} data-vincular={a.id} onClick={() => setEscolhido(a.id)}>{vigente === a.id ? `✓ ${a.rotulo}` : a.rotulo}</button>{' '}
                  <span className="at-fraco">{a.codigo}{a.grupo_atributos ? ` · ${a.grupo_atributos}` : ''}</span>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <Botao primario desligado={!atrEscolhido || ocupado} aoClicar={() => { if (atrEscolhido) aoVincular(atrEscolhido); }}>
                <span data-confirmar-vincular={atrEscolhido?.id ?? ''}>{rotuloConfirmarVincular(atrEscolhido?.rotulo ?? null)}</span></Botao>
            </div>
          </div>
        ))}
      {status && <p className={`at-salvo at-salvo--${status.tom}`} role={status.tom === 'erro' ? 'alert' : 'status'} data-status-vinculo style={{ margin: '6px 0 0' }}>{status.texto}
        {status.link && <> <LinkFicha pid={status.link.pid} atributo={status.link.atributo}>Ver na ficha</LinkFicha></>}
        {pendente && aoConferir && <> <button type="button" className="at-link" data-conferir-gravacao disabled={gravando !== null} onClick={aoConferir}>Conferir gravação</button></>}</p>}
    </div>
  );
}

/**
 * Vários produtos: escolher atributo(s) ou kit → prévia (massa_previa) em frase curta → confirmar (massa_aplicar, idempotente).
 * "Foi salvo ou não": só "Salvo" com recibo; incerto = pendência na TELA (`pendente`/`aoPendente`, sobrevive a fechar e reabrir) com
 * "Conferir gravação"; o resultado mostra os destinos com o link da ficha focando o atributo.
 */
function DialogoMassa({ tipo, produtos, dic, kits, foraDoFiltro, aoFechar, aoFeito, pendente, aoPendente, aoRecarregarDic }: {
  tipo: 'atributos' | 'kit'; produtos: number[]; dic: AtributoDicionario[]; kits: KitResumo[]; foraDoFiltro: number[]; aoFechar: () => void; aoFeito: () => void;
  pendente: PendenteMassa | null; aoPendente: (p: PendenteMassa | null) => void; aoRecarregarDic: () => void;
}) {
  const m = useModulo();
  const [busca, setBusca] = React.useState('');
  const [atrs, setAtrs] = React.useState<number[]>([]);
  const [kit, setKit] = React.useState<number | null>(null);
  const [previa, setPrevia] = React.useState<{ dados: PreviaV2; pedido: string; chave: string } | null>(null);
  const [trab, setTrab] = React.useState(false);
  const [msg, setMsg] = React.useState<Status | null>(null);
  const [resultado, setResultado] = React.useState<{ texto: string; destinos: DestinoMassa[]; atributo: number | null } | null>(null);
  const seq = React.useRef(0);
  const gravandoRef = React.useRef(false);
  const intencao: IntencaoMassa | null = tipo === 'kit' ? (kit ? { tipo: 'kit', kit } : null) : (atrs.length ? { tipo: 'atributos', atributos: atrs } : null);
  const pedidoAtual = intencao ? JSON.stringify(corpoMassa(produtos, intencao)) : null;
  // DSHOW-056: a prévia vale só para o RETRATO que a gerou; mudou a escolha → a prévia cai
  React.useEffect(() => { if (previa && previa.pedido !== pedidoAtual) { seq.current++; setPrevia(null); } }, [pedidoAtual, previa]);
  // atributo desativado (dicionário relido): sai da escolha — o operador vê a seleção atualizada
  React.useEffect(() => { setAtrs((a) => { const vivos = a.filter((id) => dic.some((x) => x.id === id)); return vivos.length === a.length ? a : vivos; }); }, [dic]);
  const rot = (id: number) => dic.find((a) => a.id === id)?.rotulo ?? `#${id}`;
  const nomeKit = kits.find((k) => k.id === kit)?.nome ?? '';
  const n = produtos.length;

  const verPrevia = async () => {
    if (!pedidoAtual || trab) return;
    const pedido = pedidoAtual; const s = ++seq.current;
    if (temOpostos(JSON.parse(pedido))) { setMsg({ tom: 'erro', texto: 'O mesmo item não pode ir para os dois lados. Escolha uma ação.' }); return; }
    setTrab(true); setMsg(null);
    try {
      const r = await enviar<PreviaV2>('massa_previa', JSON.parse(pedido));
      if (s !== seq.current) return;                                     // atrasada ou a escolha mudou: ignora
      if (!previaCobrePedido(r, JSON.parse(pedido))) { setMsg({ tom: 'erro', texto: 'A prévia não corresponde aos produtos escolhidos. Gere a prévia de novo.' }); return; }
      setPrevia({ dados: r, pedido, chave: chaveParaPedido(pedido, pendente, novaChave) });   // pendência da MESMA intenção = mesma chave
    } catch (e) {
      if (s !== seq.current) return;
      setMsg({ tom: 'erro', texto: e instanceof ErroApi ? e.message : 'Sem resposta do servidor. Tente de novo.' });
      if (e instanceof ErroApi && e.campos.includes('atributos_incluir')) aoRecarregarDic();
    } finally { if (s === seq.current) setTrab(false); }
  };
  const mostrarResultado = (g: Gravado, repetido: boolean | undefined, i: IntencaoMassa, destinos: DestinoMassa[], atributo: number | null) => {
    const texto = fraseSalvo(g, repetido, i);
    m.aviso(texto); setResultado({ texto, destinos, atributo });
  };
  const confirmar = async () => {
    if (!previa || previa.pedido !== pedidoAtual || !intencao) return;    // só confirma o retrato da prévia vigente (o MESMO que foi mostrado)
    if (!iniciarGravacao(gravandoRef)) return;                           // clique duplo não grava duas vezes
    const { pedido, chave, dados } = previa;
    const destinos = alcanceMassa(intencao, nomeKit, dados, foraDoFiltro).destinos;
    const atributo = intencao.tipo === 'atributos' ? [...intencao.atributos].sort((a, b) => a - b)[0] ?? null : null;
    setTrab(true); setMsg({ tom: 'andando', texto: 'Gravando…' });
    try {
      const r = await enviar<{ gravado: Gravado; repetido?: boolean; recibo: Recibo }>('massa_aplicar', { ...JSON.parse(pedido), chave, versao_previa: dados.versao_previa });   // só volta aqui COM recibo
      aoPendente(null); setMsg(null);
      mostrarResultado(r.gravado, r.repetido, intencao, destinos, atributo);
    } catch (e) {
      const err = e instanceof ErroApi ? e : null;
      if (!err || resultadoIncerto(err)) {                // incerto (inclui 5xx e `interrompida`): a pendência fica na TELA (sobrevive a fechar e reabrir)
        aoPendente({ pedido, chave, tipo, produtos: [...produtos], intencao, destinos, atributo });
        setMsg({ tom: 'aviso', texto: err?.codigo === 'OPERATION_INTERRUPTED'
          ? 'A gravação foi interrompida no meio: parte pode ter sido salva. Use "Conferir gravação" ou confirme de novo: a mesma chave retoma o que faltou.'
          : `${MSG_DESCONHECIDO} Use "Conferir gravação" antes de tentar de novo: a mesma chave evita gravar duas vezes.` });
      } else {
        aoPendente(null);
        if (err.http === 409) { setMsg({ tom: 'erro', texto: `${err.message} A escolha foi mantida: gere a prévia de novo.` }); seq.current++; setPrevia(null); }
        else {
          setMsg({ tom: 'erro', texto: `Não foi salvo: ${err.message}` });
          if (err.campos.includes('atributos_incluir')) { seq.current++; setPrevia(null); aoRecarregarDic(); }   // desativado: a prévia cai; a seleção é atualizada
        }
      }
    } finally { gravandoRef.current = false; setTrab(false); }
  };
  const conferir = async () => {
    if (!pendente || trab) return;
    setTrab(true); setMsg({ tom: 'andando', texto: 'Conferindo a gravação…' });
    try {
      const c = await conferirGravacao(pendente.chave);
      const f = fraseConferencia(c.resultado, c.erro?.mensagem);
      if (f.final) aoPendente(null);
      if (f.gravado) {
        const g = (c.recibo?.gravado as Gravado | undefined) ?? { kits_aplicados: 0, inclusoes: 0 };
        setMsg({ tom: 'ok', texto: f.texto });
        mostrarResultado(g, false, pendente.intencao, pendente.destinos, pendente.atributo);
      } else setMsg({ tom: f.tom, texto: f.texto });
    } catch (e) {
      setMsg({ tom: 'aviso', texto: `Não foi possível conferir agora${e instanceof ErroApi ? ` (${e.message})` : ''}. Tente de novo.` });
    } finally { setTrab(false); }
  };

  const titulo = tipo === 'kit' ? `Aplicar kit aos ${n} selecionados` : `Vincular atributo aos ${n} selecionados`;
  const cand = tipo === 'atributos' ? candidatosVincular(dic, [], busca, 60) : null;
  const frase = previa ? (tipo === 'kit' ? fraseKit(nomeKit, previa.dados.resumo) : fraseAtributos(atrs.map(rot), previa.dados.resumo)) : '';
  const alcance = previa && intencao ? alcanceMassa(intencao, nomeKit, previa.dados, foraDoFiltro) : null;
  const fechar = () => { if (gravandoRef.current) return; if (resultado) aoFeito(); else aoFechar(); };
  if (resultado) return (
    <Dialogo titulo={titulo} aberto aoFechar={fechar} largura={620} rodape={<Botao primario aoClicar={fechar}>Fechar</Botao>}>
      <div data-resultado-massa>
        {msg && msg.tom === 'ok' && <p className="at-salvo at-salvo--ok" style={{ margin: '0 0 4px' }}>{msg.texto}</p>}
        <p className="at-previa-frase" role="status" data-frase-resultado>{resultado.texto}</p>
        {resultado.destinos.length > 0 && (
          <ul aria-label="Produtos gravados" data-destinos-resultado style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 260, overflowY: 'auto', border: '1px solid var(--bl-borda)', borderRadius: 6 }}>
            {resultado.destinos.map((d) => (
              <li key={d.product_id} data-destino-resultado={d.product_id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '4px 8px', borderBottom: '1px solid var(--bl-borda)' }}>
                <strong style={{ minWidth: 56, fontVariantNumeric: 'tabular-nums' }}>{d.product_id}</strong>
                <span style={{ flex: 1, color: 'var(--bl-texto)' }}>{d.nome}</span>
                <span className="at-fraco">{d.efeito}</span>
                <LinkFicha pid={d.product_id} atributo={resultado.atributo}>Abrir na ficha</LinkFicha>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialogo>
  );
  return (
    <Dialogo titulo={titulo} aberto aoFechar={fechar} largura={620}
      rodape={previa
        ? <><Botao aoClicar={() => { seq.current++; setPrevia(null); }} desligado={trab}>Voltar</Botao><Botao primario trabalhando={trab} aoClicar={() => void confirmar()}>{intencao ? rotuloConfirmarMassa(intencao, atrs.map(rot), nomeKit) : 'Confirmar'}</Botao></>
        : <><Botao aoClicar={aoFechar} desligado={trab}>Cancelar</Botao><Botao primario desligado={!intencao} trabalhando={trab} aoClicar={() => void verPrevia()}>Continuar</Botao></>}>
      {pendente && (
        <div className="at-salvo at-salvo--aviso" role="status" data-pendente-dialogo style={{ margin: '0 0 8px', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
          <span>Uma gravação em massa anterior ficou com resultado incerto: {MSG_DESCONHECIDO}</span>
          <button type="button" className="at-link" data-conferir-gravacao disabled={trab} onClick={() => void conferir()}>Conferir gravação</button>
        </div>
      )}
      {previa ? (
        <div data-previa-massa>
          <p className="at-previa-frase" role="status" data-frase>{frase}</p>
          {alcance && <ListaDestinos alcance={alcance} tipo={tipo} />}
          {tipo === 'kit' && <p className="at-fraco">Nada é removido. Vínculo produto–kit e atributos são contados separadamente.</p>}
        </div>
      ) : tipo === 'kit' ? (
        <ul className="at-escolha" role="radiogroup" aria-label="Kit a aplicar">
          {kits.map((k) => (
            <li key={k.id}><label className={kit === k.id ? 'ativo' : ''}><input type="radio" name="kit-massa" checked={kit === k.id} onChange={() => setKit(k.id)} />
              <span><ChipKit nome={k.nome} pequeno /> <span className="at-fraco">{k.itens} atributos</span></span></label></li>
          ))}
        </ul>
      ) : (
        <div>
          <input className="at-campo" style={{ width: '100%' }} type="search" placeholder="Buscar atributo por rótulo ou código" aria-label="Buscar atributo" value={busca} onChange={(e) => setBusca(e.target.value)} />
          {atrs.length > 0 && <p className="at-fraco" style={{ margin: '6px 0 2px' }} data-escolhidos-n>{textoEscolhidos(atrs.length)} (continuam escolhidos mesmo fora da busca):</p>}
          {atrs.length > 0 && <ul className="at-tags" aria-label="Escolhidos" data-escolhidos>{atrs.map((id) => <li key={id} data-escolhido={id}>{rot(id)} <button type="button" className="at-link" aria-label={`Tirar ${rot(id)}`} onClick={() => setAtrs(atrs.filter((x) => x !== id))}>✕</button></li>)}</ul>}
          <p className="at-fraco" style={{ margin: '4px 0' }}>{cand!.total > cand!.lista.length ? `${cand!.lista.length} de ${cand!.total} atributos — refine a busca.` : `${cand!.total} atributo(s).`}</p>
          <ul className="at-escolha at-escolha--curta" aria-label="Atributos">
            {cand!.lista.map((a) => (
              <li key={a.id}><label className={atrs.includes(a.id) ? 'ativo' : ''}><input type="checkbox" checked={atrs.includes(a.id)} onChange={() => setAtrs(atrs.includes(a.id) ? atrs.filter((x) => x !== a.id) : [...atrs, a.id])} />
                <span><strong>{a.rotulo}</strong> <span className="at-fraco">{a.codigo}</span></span></label></li>
            ))}
          </ul>
        </div>
      )}
      {msg && <p className={`at-salvo at-salvo--${msg.tom}`} role={msg.tom === 'erro' ? 'alert' : 'status'} data-msg-massa>{msg.texto}</p>}
    </Dialogo>
  );
}

/** Alcance da prévia (números + destinos). Pesquisável quando passa de 10 produtos. Os destinos são os da PRÓPRIA prévia. */
function ListaDestinos({ alcance, tipo }: { alcance: ReturnType<typeof alcanceMassa>; tipo: 'atributos' | 'kit' }) {
  const [q, setQ] = React.useState('');
  const muitos = alcance.destinos.length > 10;
  const vis = muitos ? filtrarPorIdNome(alcance.destinos, q, (d) => d.product_id) : alcance.destinos;
  const nFora = alcance.destinos.filter((d) => d.fora).length;
  return (
    <div data-alcance style={{ margin: '8px 0' }}>
      <p data-alcance-numeros style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--bl-texto)' }}>{alcance.texto}</p>
      {nFora > 0 && <p className="at-fraco" style={{ margin: '0 0 6px' }} data-alcance-fora>{nFora.toLocaleString('pt-BR')} {nFora === 1 ? 'destino está' : 'destinos estão'} fora do filtro atual da tabela e {nFora === 1 ? 'está' : 'estão'} incluído{nFora === 1 ? '' : 's'} abaixo.</p>}
      {muitos && <input className="at-campo" style={{ width: '100%', marginBottom: 6 }} type="search" placeholder="Buscar destino por ID ou nome" aria-label="Buscar destino por ID ou nome" value={q} onChange={(e) => setQ(e.target.value)} />}
      {muitos && q && <p className="at-fraco" style={{ margin: '0 0 4px' }}>{vis.length.toLocaleString('pt-BR')} de {alcance.destinos.length.toLocaleString('pt-BR')} destinos.</p>}
      <ul aria-label="Produtos de destino" data-destinos style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 220, overflowY: 'auto', border: '1px solid var(--bl-borda)', borderRadius: 6 }}>
        {vis.map((d) => (
          <li key={d.product_id} data-destino={d.product_id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '4px 8px', borderBottom: '1px solid var(--bl-borda)' }}>
            <strong style={{ minWidth: 56, fontVariantNumeric: 'tabular-nums' }}>{d.product_id}</strong>
            <span style={{ flex: 1, color: 'var(--bl-texto)' }}>{d.nome}</span>
            {d.fora && <Etiqueta tom="aviso">fora do filtro</Etiqueta>}
            <span className="at-fraco" data-destino-efeito>{d.efeito}</span>
          </li>
        ))}
      </ul>
      {tipo === 'atributos' && <p className="at-fraco" style={{ margin: '6px 0 0' }} data-alcance-nota>“Entra na ficha”: o atributo entra como vínculo avulso. “Já aplicável”: já está na ficha (por kit ou avulso) — nada é gravado nesse produto.</p>}
    </div>
  );
}

/** "Rever seleção": todos os selecionados (os fora do filtro primeiro), com caixa para desmarcar. Pesquisável quando passa de 10. */
function DialogoRever({ itens, marcados, aoAlternar, aoFechar }: {
  itens: ReturnType<typeof selecaoParaRever>; marcados: ReadonlySet<number>; aoAlternar: (id: number) => void; aoFechar: () => void;
}) {
  const [q, setQ] = React.useState('');
  const muitos = itens.length > 10;
  const vis = muitos ? filtrarPorIdNome(itens, q, (x) => x.id) : itens;
  const n = itens.filter((x) => marcados.has(x.id)).length; const nFora = itens.filter((x) => x.fora && marcados.has(x.id)).length;
  return (
    <Dialogo titulo="Rever seleção" aberto aoFechar={aoFechar} largura={620} rodape={<Botao primario aoClicar={aoFechar}>Pronto</Botao>}>
      <div data-rever>
        <p data-rever-resumo style={{ margin: '0 0 6px' }}>{n.toLocaleString('pt-BR')} {n === 1 ? 'selecionado' : 'selecionados'}{nFora ? ` · ${nFora.toLocaleString('pt-BR')} fora do filtro` : ''}. Desmarque o que não deve entrar.</p>
        {muitos && <input className="at-campo" style={{ width: '100%', marginBottom: 6 }} type="search" placeholder="Buscar por ID ou nome" aria-label="Buscar na seleção por ID ou nome" value={q} onChange={(e) => setQ(e.target.value)} />}
        <ul className="at-escolha" aria-label="Produtos selecionados" style={{ maxHeight: 360, overflowY: 'auto' }}>
          {vis.map((x) => (
            <li key={x.id} data-rever-item={x.id}><label className={marcados.has(x.id) ? 'ativo' : ''}>
              <input type="checkbox" checked={marcados.has(x.id)} aria-label={`Selecionado: ${x.id} ${x.nome}`} onChange={() => aoAlternar(x.id)} />
              <span><strong>{x.id}</strong> · {x.nome} <span className="at-fraco">{rotuloSubcategoria(x.subcategoria)}</span>{x.fora && <> <Etiqueta tom="aviso">fora do filtro</Etiqueta></>}</span>
            </label></li>
          ))}
        </ul>
      </div>
    </Dialogo>
  );
}
