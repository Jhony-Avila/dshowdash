// panel-atributos/src/screens/kits/EditorKit.tsx — KITS V2 · DETALHE (MOCKUP-KIT-DETALHE: elo rompido; "Todos" em cinza, como a Matriz).
// Travado: da barra verde até a faixa de identificação (← Kits, nome, situação, Duplicar, Desativar). Dentro de cada grade o cabeçalho gruda.
// TRÊS salvamentos separados (exceção deliberada do briefing §2.4): Salvar identificação · Salvar atributos do kit · Salvar escopo; cada um
// confirma SÓ a própria seção ("Salvo" só com recibo; erro/conflito na seção, sem apagar os rascunhos das outras). Avulsos: cada adição ou
// remoção grava NA HORA, individualmente. Composição SEM ordenação por coluna (a ordem é dado do kit: arrastar ou ▲▼). Unidade herdada =
// "Padrão (mês)" e continua herdada ao salvar (null). Elo rompido = remover do kit (o atributo continua no cadastro). Produtos alcançados =
// grade de consulta com a legenda da Matriz (Subcat. azul, Direto lavanda, Todos cinza). Regras de integridade preservadas: DSHOW-064
// (base do rascunho), DSHOW-065 (escopo + aplica a todos num POST só), máximo de destaques do servidor (4), recém-criado (UX-1).
import React from 'react';
import { obter } from '../../lib/api';
import type { AtributoDicionario, Importancia, ItemKit, KitDetalhe, TipoAtributo, Unidade } from '../../lib/tipos';
import { IMPORTANCIA, IMPORTANCIAS, TIPO, rotuloCategoria, rotuloSubcategoria } from '../../lib/rotulos';
import { assinaturaEscopo, avancarBase, decidirEnvio, manterNovos, type BaseSecao } from '../../lib/integridade';
import {
  alternarColuna, CHAVE_COLUNAS_ALCANCE, CHAVE_COLUNAS_ITENS, COLUNAS_ALCANCE, COLUNAS_ITENS_OPCIONAIS, colunasPadrao, colunasValidas, corpoItens, moverItem, normalizar,
  ordenarEscopos, plural, podeDescer, podeSubir, rotuloEscopoCurto, textoOrigens, type ColunaAlcance, type ColunaItens, type Situacao,
} from '../../lib/kits';
import type { Ordenacao } from '../../lib/ordenar';
import { useModulo } from '../../app/contexto';
import { Botao, CabecalhoTravado, Carregando, Dialogo, Erro } from '../../ui/Comuns';
import { TabelaDados, type ColunaTabela } from '../../ui/TabelaDados';
import { BotaoIcone, Ic, LegendaOrigens, MenuEscolha, Origens, PilulaSituacao, SeletorColunas, usePreferencia } from './comuns';
import { EstadoGravacao, useGravacao, type Gravacao } from './gravacao';
import { DialogoDuplicar } from './ListaKits';

const MAX_DESTAQUES = 4;   // = KitsService::MAX_DESTAQUES (o servidor decide; aqui só evita uma ida inútil)
type ItemRascunho = ItemKit & { novo?: boolean };
interface SubcatAtivos { categoria: string; subcategoria: string; ativos: number }
interface ProdutoVitrine { id: number; nome: string; categoria: string; subcategoria: string | null; ativo: boolean }
const chaveEscopo = (e: { categoria: string; subcategoria: string }) => `${e.categoria}|${e.subcategoria}`;
const ordenarItens = (l: ItemKit[]) => [...l].sort((a, b) => a.posicao - b.posicao);
const assinaturaItens = (l: ItemKit[]) => JSON.stringify(corpoItens(l).map((i) => [i.atributo_id, i.obrigatorio, i.visivel, i.destaque, i.importancia, i.unidade_id]));

/** Produtos ativos cobertos por um conjunto de escopos (sem contar duas vezes subcategoria + categoria inteira). PREVISÃO local, rotulada. */
function contarCobertos(escopos: Set<string>, subcats: SubcatAtivos[], todos: boolean): number {
  let n = 0;
  for (const s of subcats) if (todos || escopos.has(`${s.categoria}|`) || (s.subcategoria !== '' && escopos.has(`${s.categoria}|${s.subcategoria}`))) n += s.ativos;
  return n;
}

export function EditorKit({ id, recemCriado = false, aoVoltar, aoAbrir }: { id: number; recemCriado?: boolean; aoVoltar: () => void; aoAbrir: (id: number) => void }) {
  const nav = useModulo();
  const [det, setDet] = React.useState<KitDetalhe | null>(null);
  const [erroCarga, setErroCarga] = React.useState<string | null>(null);
  const [nome, setNome] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [itens, setItens] = React.useState<ItemRascunho[]>([]);
  const [todos, setTodos] = React.useState(false);
  const [escopos, setEscopos] = React.useState<Set<string>>(new Set());
  const [duplicando, setDuplicando] = React.useState(false);
  const [confirmarAtivo, setConfirmarAtivo] = React.useState(false);
  const [motivoAtivo, setMotivoAtivo] = React.useState('');
  const baseItens = React.useRef<BaseSecao>({ versao: -1, assinatura: '' });
  const baseEscopo = React.useRef<BaseSecao>({ versao: -1, assinatura: '' });
  const [baseMudou, setBaseMudou] = React.useState<{ itens?: boolean; escopo?: boolean }>({});
  const serial = React.useRef(false);   // uma escrita por vez neste kit (cada uma sobe a versão)
  const gDados = useGravacao('dados', serial);
  const gItens = useGravacao('itens', serial);
  const gEscopo = useGravacao('escopo', serial);
  const gAvulsos = useGravacao<{ adicionados?: number; removidos?: number }>('avulsos', serial);
  const gAtivo = useGravacao('ativo', serial);

  type Secao = 'dados' | 'itens' | 'escopo';
  const iniciar = React.useCallback((d: KitDetalhe, secoes: Secao[], preservarNovos = false) => {
    if (secoes.includes('dados')) { setNome(d.kit.nome); setDescricao(d.kit.descricao ?? ''); }
    const ai = avancarBase(baseItens.current, { versao: d.kit.versao, assinatura: assinaturaItens(ordenarItens(d.kit.atributos)) }, secoes.includes('itens'));
    const ae = avancarBase(baseEscopo.current, { versao: d.kit.versao, assinatura: assinaturaEscopo(!!d.kit.aplica_a_todos, d.kit.escopos.map(chaveEscopo)) }, secoes.includes('escopo'));
    baseItens.current = ai.base; baseEscopo.current = ae.base;
    setBaseMudou({ itens: ai.mudou, escopo: ae.mudou });
    if (ai.reiniciar) setItens((r) => (preservarNovos ? manterNovos<ItemRascunho>(ordenarItens(d.kit.atributos), r) : ordenarItens(d.kit.atributos)));
    if (ae.reiniciar) { setTodos(!!d.kit.aplica_a_todos); setEscopos(new Set(d.kit.escopos.map(chaveEscopo))); }
  }, []);
  const carregar = React.useCallback(async (secoes: Secao[] = ['dados', 'itens', 'escopo']): Promise<KitDetalhe | null> => {
    setErroCarga(null);
    try { const d = await obter<KitDetalhe>('kit', { id }); setDet(d); iniciar(d, secoes, true); return d; }
    catch (e) { setErroCarga(e instanceof Error ? e.message : 'Falha ao carregar o kit.'); return null; }
  }, [id, iniciar]);
  React.useEffect(() => { void carregar(); }, [carregar]);

  if (erroCarga && !det) return <div className="at-kv"><button type="button" className="at-kv__voltar" onClick={aoVoltar}><Ic nome="voltar" />Kits</button><Erro mensagem={erroCarga} aoTentar={() => void carregar()} /></div>;
  if (!det) return <Carregando rotulo="Carregando kit" />;

  const k = det.kit;
  const pode = det.pode_editar;
  const sujoDados = nome.trim() !== k.nome || descricao.trim() !== (k.descricao ?? '').trim();
  const sujoItens = assinaturaItens(itens) !== baseItens.current.assinatura;
  const sujoEscopo = assinaturaEscopo(todos, escopos) !== baseEscopo.current.assinatura;
  const pendentes = [sujoDados && 'identificação', sujoItens && 'atributos do kit', sujoEscopo && 'escopo'].filter(Boolean) as string[];
  const sair = (acao: () => void) => {
    if (pendentes.length && !window.confirm(`Há alterações não salvas (${pendentes.join(', ')}). Sair mesmo assim e descartá-las?`)) return;
    acao();
  };

  // ── gravações (cada seção confirma SÓ a si mesma) ──
  const salvarDados = () => {
    if (!nome.trim()) return;
    void gDados.gravar('kit', { id: k.id, versao: k.versao, nome: nome.trim(), descricao: descricao.trim() || null }, async () => { await carregar(['dados']); });
  };
  const salvarItens = async () => {
    if (itens.filter((i) => +i.destaque).length > MAX_DESTAQUES || gItens.ocupada || gItens.incerta || serial.current) return;
    // DSHOW-064: relê o kit; se os itens persistidos mudaram desde a base do rascunho → conflito local, sem enviar (rascunho preservado)
    let fresco: KitDetalhe;
    try { fresco = await obter<KitDetalhe>('kit', { id: k.id }); } catch { nav.aviso('Não foi possível conferir o kit antes de salvar. Tente de novo.', 'erro'); return; }
    const dec = decidirEnvio(baseItens.current, { versao: fresco.kit.versao, assinatura: assinaturaItens(ordenarItens(fresco.kit.atributos)) }, { baseMudou: !!baseMudou.itens });
    if (dec.acao === 'conflito') { setDet(fresco); iniciar(fresco, []); setBaseMudou((x) => ({ ...x, itens: true })); return; }
    void gItens.gravar('kit_itens', { id: k.id, versao: dec.versao, itens: corpoItens(itens) }, async () => { await carregar(['itens']); });
  };
  const salvarEscopo = () => {
    if (baseMudou.escopo) return;   // DSHOW-064: o persistido mudou por baixo do rascunho — primeiro recarregar
    const lista = [...escopos].map((c) => { const [categoria, subcategoria = ''] = c.split('|'); return { categoria, subcategoria }; });
    // DSHOW-065: escopo + "aplica a todos" num POST só, com a versão da BASE do rascunho
    void gEscopo.gravar('kit_escopos', { id: k.id, versao: baseEscopo.current.versao, escopos: lista, aplica_a_todos: todos ? 1 : 0 }, async () => { await carregar(['escopo']); });
  };
  const mudarAvulso = (adicionar: number[], remover: number[], aoOk?: () => void) =>
    gAvulsos.gravar('kit_produtos', { id: k.id, versao: k.versao, adicionar, remover }, async (d) => {
      await carregar([]);
      nav.aviso(d?.adicionados ? 'Produto avulso adicionado.' : d?.removidos ? 'Produto avulso removido.' : 'Vínculo direto conferido.');
      aoOk?.();
    });
  const confirmarSituacao = () => void gAtivo.gravar('kit_ativo', { id: k.id, versao: k.versao, ativo: k.ativo ? 0 : 1, motivo: motivoAtivo.trim() || undefined }, async () => {
    setConfirmarAtivo(false); setMotivoAtivo(''); await carregar([]); nav.aviso(k.ativo ? 'Kit desativado.' : 'Kit ativado.');
  });

  return (
    <div className="at-kv at-kv--detalhe">
      <CabecalhoTravado>
        <div className="at-kv__ident" data-ident-kit>
          <button type="button" className="at-kv__voltar" onClick={() => sair(aoVoltar)} data-voltar-kits><Ic nome="voltar" />Kits</button>
          <div className="at-kv__ident-linha">
            <h2 className="at-kv__titulo" title={k.nome}>{k.nome}</h2>
            <PilulaSituacao ativo={!!k.ativo} />
            {!pode && <span className="at-kv__pilula at-kv__pilula--info" title="Seu nível permite ver, não alterar">Somente leitura</span>}
            {pendentes.length > 0 && <span className="at-kv__pendente" role="status" data-pendentes>Alterações não salvas: {pendentes.join(', ')}</span>}
            <span className="at-kv__espaco" />
            {pode && <button type="button" className="at-kv__botao" onClick={() => setDuplicando(true)} data-duplicar><Ic nome="copiar" />Duplicar</button>}
            {pode && <button type="button" className={`at-kv__botao ${k.ativo ? 'at-kv__botao--aviso' : ''}`} onClick={() => setConfirmarAtivo((v) => !v)} aria-expanded={confirmarAtivo} data-situacao-kit>
              <Ic nome="energia" />{k.ativo ? 'Desativar kit' : 'Ativar kit'}</button>}
          </div>
          {confirmarAtivo && (
            <div className="at-kv-linha-edicao at-kv__confirma-ativo" role="group" aria-label={k.ativo ? 'Confirmar desativação' : 'Confirmar ativação'} data-confirma-ativo>
              <p className="at-kv__antes-depois">situação <PilulaSituacao ativo={!!k.ativo} /> → <PilulaSituacao ativo={!k.ativo} />
                <span className="at-kv__fraco">{k.ativo ? ' O kit deixa de valer para os produtos. Nada é apagado: atributos, escopo e valores ficam guardados.' : ' O kit volta a valer para o escopo, os avulsos e o "aplica a todos" configurados.'}</span></p>
              <label className="at-kv__campo at-kv__campo--larga"><span>Motivo (opcional)</span><input className="at-campo" value={motivoAtivo} maxLength={300} onChange={(e) => setMotivoAtivo(e.target.value)} /></label>
              <div className="at-kv__acoes-form">
                <EstadoGravacao g={gAtivo} aoRecarregar={() => void carregar([])} />
                <Botao aoClicar={() => setConfirmarAtivo(false)} desligado={gAtivo.ocupada}>Cancelar</Botao>
                <Botao primario={!k.ativo} perigo={!!k.ativo} desligado={gAtivo.incerta} trabalhando={gAtivo.sit.fase === 'salvando'} aoClicar={confirmarSituacao}>{k.ativo ? 'Desativar' : 'Ativar'}</Botao>
              </div>
            </div>)}
        </div>
      </CabecalhoTravado>
      {!k.ativo && <p className="at-kv__aviso-inativo">Este kit está desativado e não vale para nenhum produto enquanto estiver assim.</p>}

      {/* 1 · Identificação */}
      <section className="at-kv__cartao at-kv__cartao--ident" aria-label="Nome e descrição" data-secao="dados">
        <form className="at-kv__ident-form" onSubmit={(e) => { e.preventDefault(); salvarDados(); }}>
          <label className="at-kv__campo at-kv__campo--nome"><span>Nome</span>
            <input className="at-campo" value={nome} maxLength={160} readOnly={!pode} onChange={(e) => setNome(e.target.value)} aria-invalid={!nome.trim()} />
          </label>
          <CampoDescricao valor={descricao} aoMudar={setDescricao} somenteLeitura={!pode} />
          {pode && <div className="at-kv__acoes-form">
            <EstadoGravacao g={gDados} aoRecarregar={() => void carregar(['dados'])} rotuloRecarregar="Descartar meu rascunho e recarregar" />
            {sujoDados && !gDados.ocupada && <Botao aoClicar={() => iniciar(det, ['dados'])}>Descartar</Botao>}
            <Botao primario tipo="submit" desligado={!sujoDados || !nome.trim() || gDados.incerta} trabalhando={gDados.sit.fase === 'salvando'}>Salvar identificação</Botao>
          </div>}
        </form>
      </section>

      {/* 2 · Atributos do kit */}
      <PainelItens itens={itens} setItens={setItens} base={det.kit.atributos} unidades={det.unidades} pode={pode} sujo={sujoItens} recemCriado={recemCriado}
        g={gItens} baseMudou={!!baseMudou.itens} aoSalvar={() => void salvarItens()} aoDescartar={() => iniciar(det, ['itens'])} aoRecarregar={() => void carregar(['itens'])} />

      <div className="at-kv__duas">
        {/* 3 · Onde o kit vale */}
        <PainelEscopo det={det} todos={todos} setTodos={setTodos} escopos={escopos} setEscopos={setEscopos} pode={pode} sujo={sujoEscopo} g={gEscopo}
          baseMudou={!!baseMudou.escopo} aoSalvar={salvarEscopo} aoDescartar={() => iniciar(det, ['escopo'])} aoRecarregar={() => void carregar(['escopo'])} />
        {/* 4 · Produtos avulsos (gravação imediata) */}
        <PainelAvulsos det={det} pode={pode} g={gAvulsos} aoMudar={mudarAvulso} aoAbrirProduto={(pid) => sair(() => nav.abrirProduto(pid))} aoRecarregar={() => void carregar([])} />
      </div>

      {/* 5 · Produtos alcançados (consulta) */}
      <PainelAlcance det={det} aoAbrirProduto={(pid) => sair(() => nav.abrirProduto(pid))} />

      <DialogoDuplicar kit={duplicando ? k : null} serial={serial} aoFechar={() => setDuplicando(false)}
        aoDuplicado={(novo) => { setDuplicando(false); nav.aviso(`Kit criado a partir de "${k.nome}".`); if (novo) sair(() => aoAbrir(novo)); else sair(aoVoltar); }} />
    </div>);
}

/** Descrição compacta em repouso; amplia durante a edição (todo o conteúdo acessível — nada é cortado do dado). */
function CampoDescricao({ valor, aoMudar, somenteLeitura }: { valor: string; aoMudar: (v: string) => void; somenteLeitura: boolean }) {
  const [ampla, setAmpla] = React.useState(false);
  return (
    <label className="at-kv__campo at-kv__campo--larga"><span>Descrição</span>
      <textarea className={`at-campo at-kv__descricao ${ampla ? 'at-kv__descricao--ampla' : ''}`} value={valor} maxLength={500} readOnly={somenteLeitura} rows={ampla ? 4 : 1}
        title={!ampla && valor ? valor : undefined} onFocus={() => setAmpla(true)}
        // não recolhe quando o foco vai para um botão do MESMO formulário (ex.: Salvar identificação): recolher no mousedown mudava a altura
        // da linha e o clique caía fora do botão (achado do teste de gravação, 19/11)
        onBlur={(e) => { if (!e.currentTarget.form?.contains(e.relatedTarget as Node | null)) setAmpla(false); }} onChange={(e) => aoMudar(e.target.value)} data-descricao />
    </label>);
}

// ── 2 · Atributos do kit: SEM ordenação por coluna ──────────────────────────────────────────────────────────────────────────────────────
function PainelItens({ itens, setItens, base, unidades, pode, sujo, recemCriado, g, baseMudou, aoSalvar, aoDescartar, aoRecarregar }: {
  itens: ItemRascunho[]; setItens: React.Dispatch<React.SetStateAction<ItemRascunho[]>>; base: ItemKit[]; unidades: Unidade[]; pode: boolean; sujo: boolean; recemCriado: boolean;
  g: Gravacao; baseMudou: boolean; aoSalvar: () => void; aoDescartar: () => void; aoRecarregar: () => void;
}) {
  const [adicionando, setAdicionando] = React.useState(false);
  const [anuncio, setAnuncio] = React.useState('');
  const [focar, setFocar] = React.useState<{ aid: number; dir: 'sobe' | 'desce' } | null>(null);
  const [arrastado, setArrastado] = React.useState<number | null>(null);
  const [alvo, setAlvo] = React.useState<number | null>(null);
  const [opcionais, setOpcionais] = usePreferencia<ColunaItens>(CHAVE_COLUNAS_ITENS, (v) => colunasValidas(COLUNAS_ITENS_OPCIONAIS, v));
  const corpo = React.useRef<HTMLTableSectionElement>(null);
  const nDest = itens.filter((i) => +i.destaque).length;
  const noRascunho = new Set(itens.map((i) => i.atributo_id));
  const removidos = ordenarItens(base).filter((i) => !noRascunho.has(i.atributo_id));

  React.useEffect(() => {
    if (!focar || !corpo.current) return;
    const outro = focar.dir === 'sobe' ? 'desce' : 'sobe';
    const b = corpo.current.querySelector<HTMLButtonElement>(`[data-mover="${focar.aid}-${focar.dir}"]:not(:disabled)`) ?? corpo.current.querySelector<HTMLButtonElement>(`[data-mover="${focar.aid}-${outro}"]`);
    b?.focus(); setFocar(null);
  }, [focar, itens]);

  const mover = (de: number, para: number, viaTeclado?: 'sobe' | 'desce') => {
    if (para < 0 || para >= itens.length || de === para) return;
    const x = itens[de]; setItens(moverItem(itens, de, para)); setAnuncio(`${x.rotulo} movido para a posição ${para + 1} de ${itens.length}.`);
    if (viaTeclado) setFocar({ aid: x.atributo_id, dir: viaTeclado });
  };
  const alterar = (aid: number, campo: Partial<ItemKit>) => setItens((l) => l.map((i) => (i.atributo_id === aid ? { ...i, ...campo } : i)));
  const remover = (i: ItemKit) => { setItens((l) => l.filter((x) => x.atributo_id !== i.atributo_id)); setAnuncio(`${i.rotulo} sai do kit ao salvar. O atributo continua no cadastro.`); };
  const desfazer = (i: ItemKit) => {
    const pos = Math.min(ordenarItens(base).findIndex((x) => x.atributo_id === i.atributo_id), itens.length);
    setItens((l) => { const n = [...l]; n.splice(Math.max(0, pos), 0, i); return n; }); setAnuncio(`${i.rotulo} voltou ao kit.`);
  };
  /** Unidades oferecidas: as da mesma grandeza da unidade padrão do atributo; sem unidade padrão, todas (agrupadas por grandeza). */
  const opcoesUnidade = (i: ItemKit): { grupo: string; lista: Unidade[] }[] => {
    const padrao = i.unidade_padrao_id != null ? unidades.find((u) => u.id === Number(i.unidade_padrao_id)) : undefined;
    const usaveis = unidades.filter((u) => Number(u.ativo) === 1 || u.id === i.unidade_id);
    if (padrao?.grandeza) return [{ grupo: padrao.grandeza, lista: usaveis.filter((u) => u.grandeza === padrao.grandeza) }];
    if (padrao) return [{ grupo: 'unidade', lista: usaveis.filter((u) => u.id === padrao.id || u.id === i.unidade_id) }];
    const grupos = new Map<string, Unidade[]>();
    for (const u of usaveis) { const gr = u.grandeza ?? 'outras'; grupos.set(gr, [...(grupos.get(gr) ?? []), u]); }
    return [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR')).map(([grupo, lista]) => ({ grupo, lista }));
  };
  const comCodigo = opcionais.includes('codigo'); const comTipo = opcionais.includes('tipo');
  const nCols = 7 + (pode ? 1 : 0) + (comCodigo ? 1 : 0) + (comTipo ? 1 : 0);

  return (
    <section className="at-kv__cartao" aria-labelledby="kv-itens" data-secao="itens">
      <div className="at-kv__cabeca">
        <h3 id="kv-itens">Atributos do kit <span className="at-kv__n">· {itens.length}</span></h3>
        <span className="at-kv__fraco" data-destaques>Destaques: {nDest} de {MAX_DESTAQUES}</span>
        <span className="at-kv__espaco" />
        <EstadoGravacao g={g} aoRecarregar={aoRecarregar} rotuloRecarregar="Recarregar atributos (descarta este rascunho)" />
        {sujo && <span className="at-kv__pendente">Alterações não salvas</span>}
        {pode && <button type="button" className="at-kv__botao" onClick={() => setAdicionando(true)} data-adicionar-atributos><Ic nome="mais" />Adicionar atributos</button>}
        <SeletorColunas catalogo={COLUNAS_ITENS_OPCIONAIS} visiveis={opcionais} legenda="Colunas opcionais da composição"
          aoMudar={(id) => setOpcionais(alternarColuna(COLUNAS_ITENS_OPCIONAIS, opcionais, id))} aoRestaurar={() => setOpcionais(colunasPadrao(COLUNAS_ITENS_OPCIONAIS))} />
        {pode && sujo && !g.ocupada && <Botao aoClicar={aoDescartar}>Descartar</Botao>}
        {pode && <Botao primario desligado={!sujo || g.incerta || nDest > MAX_DESTAQUES} trabalhando={g.sit.fase === 'salvando'} aoClicar={aoSalvar}>Salvar atributos do kit</Botao>}
      </div>
      {baseMudou && <p className="at-kv__erro" role="alert">Os atributos do kit mudaram desde que você começou. <button type="button" className="at-link" onClick={aoRecarregar}>Recarregar atributos</button> (descarta este rascunho).</p>}
      {nDest > MAX_DESTAQUES && <p className="at-kv__erro" role="alert">No máximo {MAX_DESTAQUES} destaques por kit.</p>}
      <span className="bl-so-leitor" aria-live="polite">{anuncio}</span>
      {itens.length === 0 ? (
        <div className={`at-kv__vazio ${recemCriado ? 'at-kv__vazio--destaque' : ''}`} role="status">
          <strong>{recemCriado ? 'Kit criado. Escolha os atributos que ele terá.' : 'Este kit ainda não tem atributos.'}</strong>
          {pode && <Botao primario aoClicar={() => setAdicionando(true)}>Escolher atributos</Botao>}
        </div>
      ) : (
        <div className="at-td at-kv__comp" data-rolagem="container" data-larga="0">
          <table className="at-td__tabela at-kv__tabela at-kv__tabela--comp" aria-label="Composição do kit (ordem do kit; sem ordenação por coluna)">
            <thead>
              <tr>
                <th scope="col" className="at-td__th at-td--centro at-kv__c-ordem">Ordem</th>
                <th scope="col" className="at-td__th at-td--esquerda at-kv__c-atributo">Atributo</th>
                {comCodigo && <th scope="col" className="at-td__th at-td--esquerda at-kv__c-codigo">Código técnico</th>}
                {comTipo && <th scope="col" className="at-td__th at-td--esquerda at-kv__c-tipo">Tipo</th>}
                <th scope="col" className="at-td__th at-td--centro at-kv__c-check">Obrigatório</th>
                <th scope="col" className="at-td__th at-td--centro at-kv__c-check">Visível no app</th>
                <th scope="col" className="at-td__th at-td--centro at-kv__c-check">Destaque</th>
                <th scope="col" className="at-td__th at-td--esquerda at-kv__c-imp">Importância</th>
                <th scope="col" className="at-td__th at-td--esquerda at-kv__c-unid">Unidade do kit</th>
                {pode && <th scope="col" className="at-td__th at-td--centro at-kv__c-acoes">Ações</th>}
              </tr>
            </thead>
            <tbody ref={corpo} className="at-td__corpo">
              {itens.map((i, n) => {
                const numerico = i.tipo === 'numero' || i.tipo === 'inteiro';
                const travaDest = !+i.destaque && nDest >= MAX_DESTAQUES;
                const cls = ['at-td__linha', n % 2 ? 'at-td__linha--par' : 'at-td__linha--impar', arrastado === n ? 'at-kv__arrastando' : '', alvo === n && arrastado !== null && arrastado !== n ? 'at-kv__alvo' : '', i.novo ? 'at-kv__novo' : ''].join(' ');
                return (
                  <tr key={i.atributo_id} className={cls} data-atributo={i.atributo_id} draggable={pode}
                    onDragStart={(e) => { setArrastado(n); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i.atributo_id)); }}
                    onDragOver={(e) => { if (arrastado === null) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (alvo !== n) setAlvo(n); }}
                    onDrop={(e) => { e.preventDefault(); if (arrastado !== null) mover(arrastado, n); setArrastado(null); setAlvo(null); }}
                    onDragEnd={() => { setArrastado(null); setAlvo(null); }}>
                    <td className="at-td--centro">
                      <span className="at-kv__ordem">
                        {pode && <span className="at-kv__pega" title="Arraste para reordenar" aria-hidden><Ic nome="pega" tam={14} /></span>}
                        <span className="at-kv__ordem-n">{n + 1}</span>
                        {pode && <>
                          <button type="button" className="at-kv__mover" data-mover={`${i.atributo_id}-sobe`} disabled={!podeSubir(n)} aria-label={`Subir ${i.rotulo}`} title="Subir" onClick={() => mover(n, n - 1, 'sobe')}><Ic nome="sobe" tam={14} /></button>
                          <button type="button" className="at-kv__mover" data-mover={`${i.atributo_id}-desce`} disabled={!podeDescer(n, itens.length)} aria-label={`Descer ${i.rotulo}`} title="Descer" onClick={() => mover(n, n + 1, 'desce')}><Ic nome="desce" tam={14} /></button>
                        </>}
                      </span>
                    </td>
                    <td className="at-td--esquerda">
                      <span className="at-kv__corta" title={`${i.rotulo} · ${i.codigo}`}>{i.rotulo}</span>
                      {!Number(i.atributo_ativo) && <span className="at-kv__pilula at-kv__pilula--aviso" title="Atributo desativado no cadastro: não aparece nas fichas"> inativo</span>}
                      {i.novo && <span className="at-kv__pilula at-kv__pilula--novo">novo</span>}
                    </td>
                    {comCodigo && <td className="at-td--esquerda"><span className="at-kv__corta at-codigo" title={i.codigo}>{i.codigo}</span></td>}
                    {comTipo && <td className="at-td--esquerda">{TIPO[i.tipo] ?? i.tipo}</td>}
                    <td className="at-td--centro"><input type="checkbox" checked={!!+i.obrigatorio} disabled={!pode} aria-label={`${i.rotulo}: obrigatório`} onChange={(e) => alterar(i.atributo_id, { obrigatorio: e.target.checked ? 1 : 0 })} /></td>
                    <td className="at-td--centro"><input type="checkbox" checked={!!+i.visivel} disabled={!pode} aria-label={`${i.rotulo}: visível no app`} onChange={(e) => alterar(i.atributo_id, { visivel: e.target.checked ? 1 : 0 })} /></td>
                    <td className="at-td--centro"><input type="checkbox" checked={!!+i.destaque} disabled={!pode || travaDest} aria-label={`${i.rotulo}: destaque`}
                      title={travaDest ? `Já há ${MAX_DESTAQUES} destaques; desmarque um para escolher outro.` : undefined} onChange={(e) => alterar(i.atributo_id, { destaque: e.target.checked ? 1 : 0 })} /></td>
                    <td className="at-td--esquerda">
                      <select className="at-campo at-kv__sel" value={i.importancia ?? ''} disabled={!pode} aria-label={`${i.rotulo}: importância no kit`}
                        onChange={(e) => alterar(i.atributo_id, { importancia: (e.target.value || null) as Importancia | null })}>
                        <option value="">Padrão{i.importancia_padrao ? ` (${IMPORTANCIA[i.importancia_padrao] ?? i.importancia_padrao})` : ''}</option>
                        {IMPORTANCIAS.map((v) => <option key={v} value={v}>{IMPORTANCIA[v]}</option>)}
                      </select>
                    </td>
                    <td className="at-td--esquerda">
                      {numerico ? (
                        <select className="at-campo at-kv__sel" value={i.unidade_id ?? ''} disabled={!pode} aria-label={`${i.rotulo}: unidade do kit`} data-unidade={i.unidade_id == null ? 'herdada' : 'kit'}
                          onChange={(e) => alterar(i.atributo_id, { unidade_id: e.target.value ? Number(e.target.value) : null, unidade: e.target.value ? (unidades.find((u) => u.id === Number(e.target.value))?.simbolo ?? null) : null })}>
                          <option value="">{i.unidade_padrao ? `Padrão (${i.unidade_padrao})` : 'Padrão do atributo'}</option>
                          {opcoesUnidade(i).map((gr) => <optgroup key={gr.grupo} label={gr.grupo}>{gr.lista.map((u) => <option key={u.id} value={u.id}>{u.simbolo} — {u.nome}</option>)}</optgroup>)}
                        </select>
                      ) : <span className="at-kv__fraco" aria-label="Sem unidade">—</span>}
                    </td>
                    {pode && <td className="at-td--centro"><BotaoIcone nome="eloRompido" tom="borda" rotulo={`Remover ${i.rotulo} do kit (o atributo continua no cadastro)`} aoClicar={() => remover(i)} data-remover={String(i.atributo_id)} /></td>}
                  </tr>);
              })}
            </tbody>
            {removidos.length > 0 && (
              <tfoot><tr><td colSpan={nCols} className="at-kv__removidos" data-removidos>
                Saem do kit ao salvar: {removidos.map((i, x) => <React.Fragment key={i.atributo_id}>{x > 0 && ', '}<span>{i.rotulo}</span> (<button type="button" className="at-link" onClick={() => desfazer(i)}>desfazer</button>)</React.Fragment>)}
              </td></tr></tfoot>)}
          </table>
        </div>
      )}
      <DialogoAdicionar aberto={adicionando} aoFechar={() => setAdicionando(false)} jaNoKit={noRascunho}
        aoAdicionar={(lista) => {
          setAdicionando(false);
          setItens((l) => [...l, ...lista.map((a): ItemRascunho => ({
            atributo_id: a.id, rotulo: a.rotulo, codigo: a.codigo, tipo: a.tipo, atributo_ativo: Number(a.ativo), posicao: 0, obrigatorio: 0, visivel: 1, destaque: 0,
            importancia: null, unidade_id: null, unidade: null, unidade_padrao: a.unidade, unidade_padrao_id: a.unidade_id, importancia_padrao: a.importancia_padrao,
            legado_id: null, versao: 0, novo: true,
          }))]);
          setAnuncio(`${plural(lista.length, 'atributo adicionado', 'atributos adicionados')} ao rascunho. Salve os atributos do kit para gravar.`);
        }} />
    </section>);
}

function DialogoAdicionar({ aberto, aoFechar, jaNoKit, aoAdicionar }: { aberto: boolean; aoFechar: () => void; jaNoKit: Set<number>; aoAdicionar: (l: AtributoDicionario[]) => void }) {
  const [dic, setDic] = React.useState<AtributoDicionario[] | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [busca, setBusca] = React.useState('');
  const [tipo, setTipo] = React.useState<TipoAtributo | ''>('');
  const [marcados, setMarcados] = React.useState<Set<number>>(new Set());
  const LIMITE = 200;
  const carregar = React.useCallback(() => {
    setErro(null);
    obter<{ atributos: AtributoDicionario[] }>('dicionario').then((d) => setDic(d.atributos)).catch((e) => setErro(e instanceof Error ? e.message : 'Falha ao carregar.'));
  }, []);
  const carregado = dic !== null;
  React.useEffect(() => { if (!aberto) return; setBusca(''); setTipo(''); setMarcados(new Set()); if (!carregado) carregar(); }, [aberto, carregado, carregar]);
  const termo = normalizar(busca.trim());
  const candidatos = (dic ?? []).filter((a) => Number(a.ativo) === 1 && !jaNoKit.has(a.id) && (!tipo || a.tipo === tipo)
    && (!termo || normalizar(a.rotulo).includes(termo) || normalizar(a.codigo).includes(termo)));
  const mostrados = candidatos.slice(0, LIMITE);
  const alternar = (aid: number) => setMarcados((s) => { const n = new Set(s); if (n.has(aid)) n.delete(aid); else n.add(aid); return n; });
  return (
    <Dialogo titulo="Adicionar atributos do cadastro" aberto={aberto} aoFechar={aoFechar} largura={760}
      rodape={<>
        <span className="at-kits-dic-rodape">{plural(marcados.size, 'selecionado', 'selecionados')}</span>
        <Botao aoClicar={aoFechar}>Cancelar</Botao>
        <Botao primario desligado={marcados.size === 0} aoClicar={() => dic && aoAdicionar(dic.filter((a) => marcados.has(a.id)))}>{`Usar seleção (${marcados.size})`}</Botao>
      </>}>
      {erro ? <Erro mensagem={erro} aoTentar={carregar} /> : !dic ? <Carregando rotulo="Carregando atributos" /> : (
        <>
          <div className="at-kits-dic-filtros">
            <input className="at-campo" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por rótulo ou código" aria-label="Buscar por rótulo ou código" />
            <select className="at-campo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoAtributo | '')} aria-label="Filtrar por tipo">
              <option value="">Todos os tipos</option>
              {Object.entries(TIPO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
            </select>
          </div>
          <p className="at-kv__fraco" style={{ margin: '0 0 8px' }}>
            {plural(candidatos.length, 'atributo disponível', 'atributos disponíveis')} (os que já estão no kit e os inativos não aparecem){candidatos.length > LIMITE ? `; mostrando os ${LIMITE} primeiros, refine a busca.` : '.'}
          </p>
          {mostrados.length === 0 ? <p className="at-kv__fraco">Nenhum atributo encontrado.</p> : (
            <div className="at-kits-dic-lista" role="group" aria-label="Atributos disponíveis">
              {mostrados.map((a) => (
                <label key={a.id} className="at-kits-dic-item">
                  <input type="checkbox" checked={marcados.has(a.id)} onChange={() => alternar(a.id)} />
                  <span className="at-kits-dic-item__txt">
                    <span>{a.rotulo}</span>
                    <span className="at-kits-dic-item__meta">
                      <span className="at-codigo">{a.codigo}</span><span className="at-kv__fraco">{TIPO[a.tipo] ?? a.tipo}</span>
                      {a.unidade && <span className="at-kv__fraco">{a.unidade}</span>}{a.grupo_atributos && <span className="at-kv__fraco">{a.grupo_atributos}</span>}
                      <span className="at-kv__fraco">· em {plural(Number(a.em_kits) || 0, 'kit', 'kits')}</span>
                    </span>
                  </span>
                </label>))}
            </div>)}
        </>)}
    </Dialogo>);
}

// ── 3 · Onde o kit vale ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function PainelEscopo({ det, todos, setTodos, escopos, setEscopos, pode, sujo, g, baseMudou, aoSalvar, aoDescartar, aoRecarregar }: {
  det: KitDetalhe; todos: boolean; setTodos: (v: boolean) => void; escopos: Set<string>; setEscopos: React.Dispatch<React.SetStateAction<Set<string>>>;
  pode: boolean; sujo: boolean; g: Gravacao; baseMudou: boolean; aoSalvar: () => void; aoDescartar: () => void; aoRecarregar: () => void;
}) {
  const [verSalvas, setVerSalvas] = React.useState(false);
  const subcats: SubcatAtivos[] = React.useMemo(() => {
    const m = new Map<string, SubcatAtivos>();
    for (const s of det.subcategorias) m.set(`${s.categoria}|${s.subcategoria}`, s);
    for (const e of det.kit.escopos) if (e.subcategoria !== '' && !m.has(chaveEscopo(e))) m.set(chaveEscopo(e), { categoria: e.categoria, subcategoria: e.subcategoria, ativos: e.produtos });
    return [...m.values()];
  }, [det]);
  const categorias = React.useMemo(() => {
    const m = new Map<string, SubcatAtivos[]>();
    for (const s of subcats) m.set(s.categoria, [...(m.get(s.categoria) ?? []), s]);
    for (const e of det.kit.escopos) if (!m.has(e.categoria)) m.set(e.categoria, []);
    return [...m.entries()].map(([categoria, l]) => ({
      categoria, total: l.reduce((t, s) => t + s.ativos, 0), semSub: l.filter((s) => s.subcategoria === '').reduce((t, s) => t + s.ativos, 0),
      subs: l.filter((s) => s.subcategoria !== '').sort((a, b) => rotuloSubcategoria(a.subcategoria).localeCompare(rotuloSubcategoria(b.subcategoria), 'pt-BR')),
    })).sort((a, b) => rotuloCategoria(a.categoria).localeCompare(rotuloCategoria(b.categoria), 'pt-BR'));
  }, [subcats, det]);
  const alternar = (c: string) => setEscopos((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; });
  const totalAtivos = subcats.reduce((t, s) => t + s.ativos, 0);
  const real = det.alcance.filter((p) => p.ativo).length;
  const previsto = contarCobertos(escopos, subcats, todos);
  const salvas = ordenarEscopos([...escopos].map((c) => { const [categoria, subcategoria = ''] = c.split('|'); return { categoria, subcategoria }; }));
  const resumoSalvas = salvas.length ? salvas.map(rotuloEscopoCurto).join(' · ') : 'nenhuma';
  const mostrarLista = !todos || verSalvas;

  return (
    <section className="at-kv__cartao" aria-labelledby="kv-escopo" data-secao="escopo">
      <div className="at-kv__cabeca">
        <h3 id="kv-escopo">Onde o kit vale</h3>
        <span className="at-kv__espaco" />
        <EstadoGravacao g={g} aoRecarregar={aoRecarregar} rotuloRecarregar="Recarregar escopo (descarta este rascunho)" />
        {sujo && <span className="at-kv__pendente">Alterações não salvas</span>}
        {pode && sujo && !g.ocupada && <Botao aoClicar={aoDescartar}>Descartar</Botao>}
        {pode && <Botao primario desligado={!sujo || g.incerta || baseMudou} trabalhando={g.sit.fase === 'salvando'} aoClicar={aoSalvar}>Salvar escopo</Botao>}
      </div>
      {baseMudou && <p className="at-kv__erro" role="alert">O escopo do kit mudou desde que você começou. <button type="button" className="at-link" onClick={aoRecarregar}>Recarregar escopo</button> (descarta este rascunho).</p>}
      <label className="at-kv__todos">
        <input type="checkbox" checked={todos} disabled={!pode} onChange={(e) => setTodos(e.target.checked)} data-aplica-todos />
        <span>Aplica a todos os produtos</span><span className="at-kv__fraco">{plural(totalAtivos, 'produto ativo', 'produtos ativos')}</span>
      </label>
      <p className="at-kv__efeito" aria-live="polite" data-efeito>
        {sujo ? <>Hoje vale para {plural(real, 'produto ativo', 'produtos ativos')}. <strong>Previsão ao salvar: {plural(previsto, 'produto ativo', 'produtos ativos')}{todos ? ' (todos)' : ' pelas subcategorias'}</strong>{det.produtos_diretos.length ? `, mais os avulsos` : ''}.</>
          : <>Hoje vale para {plural(real, 'produto ativo', 'produtos ativos')}{todos ? ' (todos).' : '.'}{!det.kit.ativo ? ' O kit está desativado.' : ''}</>}
      </p>
      {todos && (
        <div className="at-kv__salvas">
          <p className="at-kv__fraco">Subcategorias salvas são preservadas.</p>
          <button type="button" className="at-kv__expansor" aria-expanded={verSalvas} onClick={() => setVerSalvas((v) => !v)} data-ver-salvas>
            <Ic nome={verSalvas ? 'desce' : 'direita'} tam={14} /><span>Subcategorias salvas</span><span className="at-kv__corta at-kv__fraco" title={resumoSalvas}>{resumoSalvas}</span>
          </button>
        </div>)}
      {mostrarLista && (
        <div className={`at-kv__cats ${todos ? 'at-kv__cats--guardadas' : ''}`} data-categorias>
          {categorias.length === 0 ? <p className="at-kv__fraco">Nenhuma categoria no catálogo.</p> : categorias.map((c) => {
            const inteira = escopos.has(`${c.categoria}|`);
            return (
              <fieldset key={c.categoria} className="at-kv__cat" disabled={!pode}>
                <legend className="bl-so-leitor">{rotuloCategoria(c.categoria)}</legend>
                <div className="at-kv__cat-cabeca">
                  <span>{rotuloCategoria(c.categoria)} <span className="at-kv__fraco">· {plural(c.total, 'ativo', 'ativos')}</span></span>
                  <label className="at-kv__op"><input type="checkbox" checked={inteira} onChange={() => alternar(`${c.categoria}|`)} /><span>Categoria inteira</span></label>
                </div>
                <div className="at-kv__subs">
                  {c.subs.map((s) => {
                    const ch = `${s.categoria}|${s.subcategoria}`;
                    return (
                      <label key={ch} className={`at-kv__op ${inteira ? 'at-kv__op--coberto' : ''}`} title={inteira ? 'Já incluída pela categoria inteira' : undefined}>
                        <input type="checkbox" checked={inteira || escopos.has(ch)} disabled={inteira} onChange={() => alternar(ch)} />
                        <span>{rotuloSubcategoria(s.subcategoria)}</span><span className="at-kv__fraco">{s.ativos}</span>
                      </label>);
                  })}
                </div>
                {c.semSub > 0 && <p className="at-kv__fraco">{plural(c.semSub, 'produto ativo sem subcategoria só entra', 'produtos ativos sem subcategoria só entram')} com a categoria inteira.</p>}
              </fieldset>);
          })}
        </div>)}
    </section>);
}

// ── 4 · Produtos avulsos: cada adição/remoção grava NA HORA ─────────────────────────────────────────────────────────────────────────────
function PainelAvulsos({ det, pode, g, aoMudar, aoAbrirProduto, aoRecarregar }: {
  det: KitDetalhe; pode: boolean; g: Gravacao;
  aoMudar: (adicionar: number[], remover: number[], aoOk?: () => void) => Promise<boolean>; aoAbrirProduto: (id: number) => void; aoRecarregar: () => void;
}) {
  const [vitrine, setVitrine] = React.useState<ProdutoVitrine[] | null>(null);
  const [erroVit, setErroVit] = React.useState<string | null>(null);
  const [pedido, setPedido] = React.useState(false);
  const [busca, setBusca] = React.useState('');
  const [emCurso, setEmCurso] = React.useState<number | null>(null);
  const carregarVitrine = React.useCallback(() => {
    setErroVit(null); setPedido(true);
    obter<{ produtos: ProdutoVitrine[] }>('vitrine').then((d) => setVitrine(d.produtos)).catch((e) => { setErroVit(e instanceof Error ? e.message : 'Falha ao carregar.'); setPedido(false); });
  }, []);
  const garantirVitrine = () => { if (!vitrine && !pedido) carregarVitrine(); };
  const diretos = new Set(det.produtos_diretos.map((p) => p.id));
  const termo = normalizar(busca.trim());
  const idBusca = termo.replace(/^(id\s*:?\s*|#)/, '');
  const resultados = termo && vitrine ? vitrine.filter((p) => !diretos.has(p.id) && (String(p.id) === idBusca || normalizar(p.nome).includes(termo))).sort((a, b) => Number(b.ativo) - Number(a.ativo)).slice(0, 12) : [];
  const fazer = (pid: number, add: boolean) => {
    setEmCurso(pid);
    void aoMudar(add ? [pid] : [], add ? [] : [pid], () => { if (add) setBusca(''); }).finally(() => setEmCurso(null));
  };
  const travado = g.ocupada || g.incerta;
  return (
    <section className="at-kv__cartao" aria-labelledby="kv-avulsos" data-secao="avulsos">
      <div className="at-kv__cabeca">
        <h3 id="kv-avulsos">Produtos avulsos <span className="at-kv__n">· {det.produtos_diretos.length}</span></h3>
        <span className="at-kv__espaco" />
        <EstadoGravacao g={g} aoRecarregar={aoRecarregar} rotuloRecarregar="Recarregar o kit" />
      </div>
      {pode && (
        <div className="at-kv__pop at-kv__avulso-busca">
          <label className="at-kv__busca at-kv__busca--larga"><Ic nome="busca" />
            <input type="search" value={busca} onFocus={garantirVitrine} onChange={(e) => { setBusca(e.target.value); garantirVitrine(); }} placeholder="Buscar produto por nome ou ID" aria-label="Adicionar produto avulso: buscar por nome ou ID" data-busca-avulso />
          </label>
          {termo && (
            <div className="at-kv__menu at-kv__menu--resultados" data-resultados-avulso>
              {erroVit ? <p className="at-kv__erro" role="alert">{erroVit} <button type="button" className="at-link" onClick={carregarVitrine}>Tentar de novo</button></p>
                : !vitrine ? <p className="at-kv__fraco">Carregando produtos…</p>
                : resultados.length === 0 ? <p className="at-kv__fraco">Nenhum produto encontrado (ou já é avulso deste kit).</p>
                : <ul aria-label="Resultados da busca de produtos">{resultados.map((p) => (
                  <li key={p.id}><span className="at-kv__corta" title={p.nome}>{p.id} · {p.nome}{p.ativo ? '' : ' · inativo'}</span>
                    <Botao desligado={travado} trabalhando={emCurso === p.id} aoClicar={() => fazer(p.id, true)} titulo={`Adicionar ${p.nome} como avulso (grava na hora)`}>Adicionar</Botao></li>))}</ul>}
            </div>)}
        </div>)}
      {det.produtos_diretos.length === 0 ? (
        <p className="at-kv__vazio-avulsos" data-avulsos-vazio>Nenhum vínculo direto.<br /><span className="at-kv__fraco">Adições e remoções são gravadas na hora, individualmente.</span></p>
      ) : (
        <>
          <ul className="at-kv__avulsos" data-avulsos>
            {det.produtos_diretos.map((p) => (
              <li key={p.id} className="at-kv__avulso" data-avulso={p.id}>
                <button type="button" className="at-kv__nome at-kv__corta" onClick={() => aoAbrirProduto(p.id)} title={p.nome}>{p.id} · {p.nome}</button>
                <span className="at-kv__fraco at-kv__corta">{rotuloSubcategoria(p.subcategoria)}</span>
                {pode && <BotaoIcone nome="fechar" rotulo={`Remover o vínculo direto de ${p.nome} (grava na hora)`} desligado={travado} aoClicar={() => fazer(p.id, false)} data-remover-avulso={String(p.id)} />}
              </li>))}
          </ul>
          <p className="at-kv__fraco">Adições e remoções são gravadas na hora, individualmente.</p>
        </>)}
    </section>);
}

// ── 5 · Produtos alcançados (consulta; vínculos PERSISTIDOS) ────────────────────────────────────────────────────────────────────────────
type Alcance = KitDetalhe['alcance'][number];
function PainelAlcance({ det, aoAbrirProduto }: { det: KitDetalhe; aoAbrirProduto: (id: number) => void }) {
  const [situacao, setSituacao] = React.useState<Situacao>('ativos');
  const [busca, setBusca] = React.useState('');
  const [ordenacao, setOrdenacao] = React.useState<Ordenacao | null>({ chave: 'id', direcao: 'asc' });
  const [colunas, setColunas] = usePreferencia<ColunaAlcance>(CHAVE_COLUNAS_ALCANCE, (v) => colunasValidas(COLUNAS_ALCANCE, v));
  const termo = normalizar(busca.trim());
  const nAtivos = det.alcance.filter((p) => p.ativo).length;
  const lista = det.alcance.filter((p) => (situacao === 'todos' || (situacao === 'ativos') === !!p.ativo) && (!termo || String(p.id) === termo || normalizar(p.nome).includes(termo)));
  const cols = React.useMemo<ColunaTabela<Alcance>[]>(() => {
    const todas: Record<ColunaAlcance, ColunaTabela<Alcance>> = {
      id: { chave: 'id', titulo: 'ID', tipo: 'numero', alinhamento: 'esquerda', valor: (p) => p.id, classe: 'at-kv__a-id' },
      produto: { chave: 'produto', titulo: 'Produto', tipo: 'texto', valor: (p) => p.nome, classe: 'at-kv__a-produto',
        render: (p) => <button type="button" className="at-kv__nome at-kv__corta" title={p.nome} onClick={() => aoAbrirProduto(p.id)}>{p.nome}</button> },
      subcategoria: { chave: 'subcategoria', titulo: 'Subcategoria', tipo: 'texto', valor: (p) => (p.subcategoria ? rotuloSubcategoria(p.subcategoria) : null), classe: 'at-kv__a-sub',
        render: (p) => <span className="at-kv__corta">{rotuloSubcategoria(p.subcategoria)}</span> },
      origem: { chave: 'origem', titulo: 'Origem do vínculo', tipo: 'texto', valor: (p) => textoOrigens(p.motivos), render: (p) => <Origens motivos={p.motivos} />, classe: 'at-kv__a-origem' },
      situacao: { chave: 'situacao', titulo: 'Situação', tipo: 'texto', alinhamento: 'centro', valor: (p) => (p.ativo ? 'Ativo' : 'Inativo'), render: (p) => <PilulaSituacao ativo={!!p.ativo} /> },
    };
    return colunas.map((c) => todas[c]);
  }, [colunas, aoAbrirProduto]);
  return (
    <section className="at-kv__cartao" aria-labelledby="kv-alcance" data-secao="alcance">
      <div className="at-kv__cabeca">
        <h3 id="kv-alcance">Produtos alcançados <span className="at-kv__n">· {plural(nAtivos, 'ativo', 'ativos')}</span></h3>
        <LegendaOrigens />
        <span className="at-kv__espaco" />
        <label className="at-kv__busca"><Ic nome="busca" /><input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto ou ID" aria-label="Buscar nos produtos alcançados" /></label>
        <MenuEscolha rotulo="Situação" valor={situacao} aoEscolher={setSituacao} data-menu="situacao-alcance"
          opcoes={[{ valor: 'ativos', rotulo: 'Ativos' }, { valor: 'inativos', rotulo: 'Inativos' }, { valor: 'todos', rotulo: 'Todos' }]} />
        <SeletorColunas catalogo={COLUNAS_ALCANCE} visiveis={colunas} legenda="Colunas dos produtos alcançados"
          aoMudar={(id) => setColunas(alternarColuna(COLUNAS_ALCANCE, colunas, id))} aoRestaurar={() => setColunas(colunasPadrao(COLUNAS_ALCANCE))} />
      </div>
      {lista.length === 0 ? (
        <p className="at-kv__vazio">{det.alcance.length === 0 ? 'Este kit ainda não alcança nenhum produto.' : <>Nenhum produto com esses filtros. <button type="button" className="at-link" onClick={() => { setBusca(''); setSituacao('ativos'); }}>Limpar filtros</button></>}</p>
      ) : (
        <TabelaDados<Alcance> colunas={cols} linhas={lista} chaveLinha={(p) => p.id} rolagem="propria" className="at-kv__tabela at-kv__tabela--alcance"
          legenda="Produtos alcançados pelo kit" ordenacao={ordenacao} aoOrdenar={setOrdenacao} classeLinha={(p) => (p.ativo ? undefined : 'at-kv__linha--inativa')} />
      )}
    </section>);
}

