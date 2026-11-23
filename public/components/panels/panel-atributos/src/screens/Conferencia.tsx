// panel-atributos/src/screens/Conferencia.tsx — conferência (§11.9): filas com ação direta. 1 legado (inclui D5 Profundidade × Comprimento),
// 2 sugestões do nome, 3 valores fora da ficha, 4 obrigatórios vazios, 5 produtos sem kit.
import React from 'react';
import type { Conferencia as TConf, ItemConferencia, KitResumo } from '../lib/tipos';
import { conferirGravacao, enviar, enviarLoteSugestoes, ErroApi, MSG_DESCONHECIDO, novaIntencaoLote, obter, resumoDaConferencia, resumoDoErroLote, resumoDoLote, type IntencaoLote, type ResumoLote } from '../lib/api';
import { marcarPendencia } from '../lib/pendencias';
import { decimal } from '../lib/formatar';
import { FONTE_SUGESTAO, rotuloSubcategoria } from '../lib/rotulos';
import { useModulo } from '../app/contexto';
import { Botao, CabecalhoTravado, CapsulaId, Carregando, Dialogo, Erro, Etiqueta, Vazio } from '../ui/Comuns';
import { TabelaDados, type ColunaTabela } from '../ui/TabelaDados';
import type { Ordenacao } from '../lib/ordenar';
import { MenuColunas, MenuEscolha } from '../ui/MenuBarra';
import { IconeEstado, useGravacoes } from '../ui/CelulaEditavel';
import { podeConferir } from '../ui/celula';
import { PAGINA_SUGESTOES, type ConfirmacaoLote } from '../ui/conferencia-lote';
import { FilaSugestoes } from './conferencia/FilaSugestoes';
import { FilaDerivada } from './conferencia/FilaDerivada';
import { livre } from '../ui/celula';
import '../ui/celula.css';

type Fila = 'legado' | 'nome' | 'fora_da_ficha' | 'obrigatorios_vazios' | 'sem_kit';
const FILAS: { id: Fila; rotulo: string; desc: string }[] = [
  { id: 'legado', rotulo: 'Legado (decisões)', desc: 'Valores do legado de 2025 que dependem de decisão, como Profundidade × Comprimento dos cabos (D5).' },
  { id: 'nome', rotulo: 'Sugestões do nome', desc: 'Tiradas do nome do produto (largura, altura, pitch, taxa, tipo de LED). Nunca viram valor sem aceite.' },
  { id: 'fora_da_ficha', rotulo: 'Fora da ficha', desc: 'Há valor gravado, mas o atributo não está vinculado ao produto.' },
  { id: 'obrigatorios_vazios', rotulo: 'Obrigatórios vazios', desc: 'Atributos obrigatórios sem valor em produtos ativos.' },
  { id: 'sem_kit', rotulo: 'Sem kit', desc: 'Produtos ativos que só têm o kit Base (nenhum kit específico).' },
];
// textos da linha de explicação (pranchas 04, 08, 09 e 10)
const DESC_V2: Partial<Record<Fila, string>> = { nome: 'Valores extraídos do nome do produto. Só são gravados após aceite.',
  fora_da_ficha: 'Valores gravados em atributos que ainda não fazem parte da ficha destes produtos.', obrigatorios_vazios: 'Campos obrigatórios ainda sem valor em produtos ativos.',
  sem_kit: 'Produtos ativos sem kit específico. O kit Base continua aplicado.' };
const valorTxt = (v: string | null) => (v && /^-?\d+(\.\d+)?$/.test(v) ? decimal(v) : v ?? '—');

export function Conferencia() {
  const m = useModulo();
  const [d, setD] = React.useState<TConf | null>(null);
  const [kits, setKits] = React.useState<KitResumo[]>([]);
  const [erro, setErro] = React.useState<string | null>(null);
  const [fila, setFila] = React.useState<Fila>('legado');
  const [lote, setLote] = React.useState<number[] | null>(null);
  const [confirmacao, setConfirmacao] = React.useState<ConfirmacaoLote | null>(null);   // DSHOW-105: ids + versões congelados ao confirmar
  // DSHOW-096: aceitar em LOTE com chave por intenção (criada ao CONFIRMAR; corpo e IDs congelados; a MESMA chave em todo reenvio).
  type FaseLote = 'confirmar' | 'enviando' | 'concluido' | 'desconhecido' | 'conferindo' | 'em_andamento' | 'interrompida' | 'nao_encontrada' | 'recusada';
  type EstadoLote = { fase: FaseLote; intencao: IntencaoLote | null; resumo: ResumoLote | null; msg: string | null; reenvioSeguro: boolean };
  const LOTE0: EstadoLote = { fase: 'confirmar', intencao: null, resumo: null, msg: null, reenvioSeguro: false };
  const [estLote, setEstLote] = React.useState<EstadoLote>(LOTE0);
  const [trabLote, setTrabLote] = React.useState(false);
  const geracaoLote = React.useRef(0);   // cada abertura/fechamento do diálogo = nova geração: resposta antiga não mexe no diálogo novo
  const carregar = React.useCallback(() => { setErro(null); obter<TConf>('conferencia').then(setD).catch((e) => setErro(e.message)); obter<{ kits: KitResumo[] }>('kits').then((k) => setKits(k.kits.filter((x) => x.ativo && x.itens > 0 && !x.aplica_a_todos))).catch(() => undefined); }, []);
  React.useEffect(carregar, [carregar, m.versao]);
  if (erro) return <Erro mensagem={erro} aoTentar={carregar} />;
  if (!d) return <Carregando rotulo="Montando as filas de conferência" />;
  // Parte C: contadores das abas = totais REAIS do servidor (COUNT), nunca o tamanho de uma lista cortada (D-1)
  const totais = d.totais as unknown as Partial<Record<Fila, number>>;
  const total = (f: Fila) => totais[f] ?? (f === 'obrigatorios_vazios' ? d.totais.obrigatorios_vazios : d.filas[f].length);
  const atributosNome = [...new Map(d.filas.nome.map((x) => [x.atributo_id, x.atributo ?? `#${x.atributo_id}`])).entries()].map(([id, rotulo]) => ({ id, rotulo })).sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
  const abrirLote = (ids: number[], conf: ConfirmacaoLote | null = null) => {
    // DSHOW-105: nada de cortar em silêncio (o .slice(0, 200) mandava um subconjunto que a tela não mostrava). Acima do limite = não abre.
    if (ids.length === 0 || ids.length > PAGINA_SUGESTOES) { m.aviso(`Escolha de 1 a ${PAGINA_SUGESTOES} sugestões.`, 'erro'); return; }
    geracaoLote.current++; setEstLote(LOTE0); setConfirmacao(conf); setLote([...(conf?.ids ?? ids)]);
  };
  const ocupadoLote = estLote.fase === 'enviando' || estLote.fase === 'conferindo';
  const fecharLote = () => { if (ocupadoLote) return; geracaoLote.current++; if (estLote.intencao) marcarPendencia(estLote.intencao.chave, false); setLote(null); setConfirmacao(null); };
  const terminarLote = (i: IntencaoLote, g: number, resumo: ResumoLote | null) => {
    marcarPendencia(i.chave, false); if (g !== geracaoLote.current) return;
    setEstLote((l) => ({ ...l, fase: 'concluido', resumo, msg: null }));
    if (resumo) m.aviso(`${resumo.aceitas.length} aceita(s)${resumo.rejeitadas.length ? `; ${resumo.rejeitadas.length} rejeitada(s)` : ''}${resumo.ignoradas.length ? `; ${resumo.ignoradas.length} ignorada(s)` : ''}.`, resumo.rejeitadas.length ? 'info' : 'sucesso');
    carregar();
  };
  /** Envia (1ª vez: cria a intenção com os IDs congelados) ou RETOMA com a MESMA intenção (mesma chave, mesmo corpo). */
  const aceitarLote = async () => {
    if (!lote || trabLote) return;
    // DSHOW-105: no 1º envio, as versões têm de ser as congeladas na confirmação; se a lista mudou nesse meio-tempo, NÃO envia e pede nova confirmação.
    if (!estLote.intencao && confirmacao) {
      const agora = new Map(d.filas.nome.map((x) => [x.id, x.versao]));
      const mudou = confirmacao.ids.filter((id) => agora.get(id) !== confirmacao.versoes[id]);
      if (mudou.length) { setEstLote((l) => ({ ...l, fase: 'recusada', msg: `${mudou.length} sugestão(ões) mudou(aram) desde a confirmação. Nada foi enviado: feche e confirme de novo.` })); return; }
    }
    const g = geracaoLote.current; const i = estLote.intencao ?? novaIntencaoLote(lote);
    marcarPendencia(i.chave, true); setTrabLote(true); setEstLote((l) => ({ ...l, fase: 'enviando', intencao: i, msg: null }));
    try { const r = await enviarLoteSugestoes(i); terminarLote(i, g, resumoDoLote(r)); }
    catch (e) {
      if (g !== geracaoLote.current) return;
      const er = e instanceof ErroApi ? e : null;
      if (er?.interrompida) setEstLote((l) => ({ ...l, fase: 'interrompida', resumo: resumoDoErroLote(er, i.ids), msg: null }));
      else if (er?.emAndamento) setEstLote((l) => ({ ...l, fase: 'em_andamento', resumo: resumoDoErroLote(er, i.ids), msg: null, reenvioSeguro: false }));
      else if (er && (er.recusada || er.conflito)) { marcarPendencia(i.chave, false); setEstLote((l) => ({ ...l, fase: 'recusada', intencao: null, msg: er.message })); }
      else setEstLote((l) => ({ ...l, fase: 'desconhecido', msg: null }));   // resposta perdida, 5xx, 2xx sem recibo: NUNCA "salvo" nem "não salvo"
    } finally { if (g === geracaoLote.current) setTrabLote(false); }
  };
  /** Conferir gravação: só GET; nada é reenviado. Desfecho por item. */
  const conferirLote = async () => {
    const i = estLote.intencao; if (!i || trabLote) return; const g = geracaoLote.current;
    setTrabLote(true); setEstLote((l) => ({ ...l, fase: 'conferindo' }));
    try {
      const c = await conferirGravacao(i.chave); if (g !== geracaoLote.current) return;
      const resumo = resumoDaConferencia(c, i.ids);
      if (c.resultado === 'aplicada' || c.resultado === 'sem_mudanca') terminarLote(i, g, resumo);
      else if (c.resultado === 'interrompida') setEstLote((l) => ({ ...l, fase: 'interrompida', resumo }));
      else if (c.resultado === 'em_andamento') setEstLote((l) => ({ ...l, fase: 'em_andamento', resumo, reenvioSeguro: !!c.reenvio_seguro }));
      else if (c.resultado === 'nao_aplicada') { marcarPendencia(i.chave, false); setEstLote((l) => ({ ...l, fase: 'recusada', intencao: null, msg: c.erro?.mensagem ?? 'O servidor recusou o pedido. Nada foi salvo.' })); }
      else setEstLote((l) => ({ ...l, fase: 'nao_encontrada', resumo: null }));
    } catch { if (g === geracaoLote.current) setEstLote((l) => ({ ...l, fase: 'desconhecido', msg: 'Não foi possível conferir agora. Tente de novo.' })); }
    finally { if (g === geracaoLote.current) setTrabLote(false); }
  };
  const atual = FILAS.find((x) => x.id === fila)!;

  return (
    <div className="at-conferencia">
      <div className="at-titulo-tela"><div><h2>Conferência</h2><p>Filas com ação direta. Nada vira valor sem decisão; cada decisão fica no histórico do produto.</p></div></div>
      <CabecalhoTravado>{/* CABEÇALHO TRAVADO (exceção do Jhony, 19/11): só envolve; nada de lógica */}
      <div className="at-abas" role="tablist" aria-label="Filas">
        {FILAS.map((x) => <button key={x.id} type="button" role="tab" aria-selected={fila === x.id} className={fila === x.id ? 'ativo' : ''} onClick={() => setFila(x.id)}>{x.rotulo} <span className="at-filtro__n" data-total-fila={x.id}>{total(x.id).toLocaleString('pt-BR')}</span></button>)}
      </div>
        {fila !== 'legado' && <div className="at-painel__cabeca"><span className="at-fraco">{DESC_V2[fila] ?? atual.desc}</span></div>}</CabecalhoTravado>
      <section className="at-painel">
        {fila === 'legado' && <LegadoGrade itens={d.filas.legado} pode={!!d.pode_decidir} aoRecarregar={async () => { carregar(); }} aoLote={abrirLote} abrirProduto={m.abrirProduto} />}
        {fila === 'nome' && <FilaSugestoes atributos={atributosNome} podeDecidir={!!d.pode_decidir} administra={!!d.pode_vincular} aoMudarTotais={carregar} />}
        {(fila === 'fora_da_ficha' || fila === 'obrigatorios_vazios' || fila === 'sem_kit') && <FilaDerivada key={fila} fila={fila} kits={kits} podeVincular={!!d.pode_vincular} aoMudarTotais={carregar}
          atributos={[...new Map((fila === 'fora_da_ficha' ? d.filas.fora_da_ficha : d.filas.obrigatorios_vazios).map((x) => [x.atributo_id, x.atributo])).entries()].map(([id, rotulo]) => ({ id, rotulo })).sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'))}
          subcategorias={[...new Set(d.filas.sem_kit.map((x) => x.subcategoria).filter((x): x is string => !!x))].sort()} />}
      </section>
      <Dialogo titulo="Aceitar sugestões em lote?" aberto={lote !== null} aoFechar={fecharLote}
        rodape={<>
          <Botao aoClicar={fecharLote} desligado={ocupadoLote}>{estLote.fase === 'confirmar' ? 'Cancelar' : 'Fechar'}</Botao>
          {estLote.fase === 'confirmar' && <Botao primario trabalhando={trabLote} aoClicar={aceitarLote}>Aceitar {lote?.length ?? 0}</Botao>}
          {(estLote.fase === 'desconhecido' || estLote.fase === 'em_andamento' || estLote.fase === 'conferindo' || estLote.fase === 'nao_encontrada') && <Botao primario={estLote.fase !== 'em_andamento' && estLote.fase !== 'nao_encontrada' || (estLote.fase === 'em_andamento' && !estLote.reenvioSeguro)} trabalhando={estLote.fase === 'conferindo'} aoClicar={conferirLote}>{estLote.fase === 'nao_encontrada' ? 'Consultar de novo' : 'Conferir gravação'}</Botao>}
          {(estLote.fase === 'interrompida' || estLote.fase === 'nao_encontrada' || (estLote.fase === 'em_andamento' && estLote.reenvioSeguro)) && <Botao primario trabalhando={trabLote} aoClicar={aceitarLote}>{estLote.fase === 'nao_encontrada' ? 'Tentar de novo com segurança' : 'Retomar os pendentes'}</Botao>}
        </>}>
        <div data-at-lote={estLote.fase} data-at-chave={estLote.intencao?.chave ?? ''}>
          {estLote.fase === 'confirmar' && <p>Cada sugestão vira valor do produto, com histórico ("sugestão #id"). Só atinge campos sem valor; nada cadastrado à mão é sobrescrito.</p>}
          {estLote.fase === 'confirmar' && confirmacao && <p className="at-fraco" data-lote-congelado={confirmacao.ids.length}>Vão exatamente as {confirmacao.ids.length} sugestões desta página, como estão agora (IDs e versões congelados).</p>}
          <div role="status" aria-live="polite">
            {estLote.fase === 'enviando' && <p>Aceitando {estLote.intencao?.ids.length} sugestões…</p>}
            {estLote.fase === 'conferindo' && <p>Conferindo no servidor…</p>}
            {estLote.fase === 'concluido' && <p className="at-salvo">Pronto. Confirmado pelo servidor.</p>}
            {estLote.fase === 'desconhecido' && <p className="at-salvo--aviso"><strong>{MSG_DESCONHECIDO}</strong> Nada será reenviado sem você pedir. Use “Conferir gravação”.{estLote.msg ? ` ${estLote.msg}` : ''}</p>}
            {estLote.fase === 'em_andamento' && <p className="at-salvo--aviso"><strong>Ainda em andamento no servidor.</strong> {estLote.reenvioSeguro ? 'Está demorando; retomar com o mesmo pedido é seguro (nada é duplicado).' : 'Confira de novo em instantes.'}</p>}
            {estLote.fase === 'interrompida' && <p className="at-salvo--aviso"><strong>O lote parou no meio.</strong> As aceitas já estão salvas; as pendentes não. “Retomar os pendentes” reenvia o MESMO pedido: nada é duplicado.</p>}
            {estLote.fase === 'nao_encontrada' && <p className="at-salvo--aviso"><strong>Ainda não encontramos o resultado desta gravação.</strong> Você pode consultar de novo ou tentar de novo com segurança: o reenvio usa o MESMO pedido (mesma chave), então nada é duplicado.</p>}
            {estLote.fase === 'recusada' && <p className="at-alerta"><strong>Não foi salvo.</strong> {estLote.msg}</p>}
          </div>
          {estLote.resumo && <ResumoLoteConferencia r={estLote.resumo} />}
        </div>
      </Dialogo>
    </div>);
}

/** Desfecho POR ITEM do lote (aceitas · rejeitadas · ignoradas · pendentes). Mesma marcação do Preencher (CIMA); unificar quando ela exportar o componente. */
function ResumoLoteConferencia({ r }: { r: ResumoLote }) {
  const lista = (xs: { id: number; motivo: string }[]) => xs.slice(0, 8).map((x) => <li key={x.id}>Sugestão {x.id}{x.motivo ? `: ${x.motivo}` : ''}</li>);
  return (
    <div className="at-lote-resumo" data-at-lote-resumo>
      <p><strong data-n="aceitas">{r.aceitas.length}</strong> aceita(s) · <strong data-n="rejeitadas">{r.rejeitadas.length}</strong> rejeitada(s) · <strong data-n="ignoradas">{r.ignoradas.length}</strong> ignorada(s) · <strong data-n="pendentes">{r.pendentes.length}</strong> pendente(s)</p>
      {r.rejeitadas.length > 0 && <><p className="at-fraco">Rejeitadas (continuam como sugestão):</p><ul>{lista(r.rejeitadas)}</ul></>}
      {r.ignoradas.length > 0 && <><p className="at-fraco">Ignoradas:</p><ul>{lista(r.ignoradas)}</ul></>}
      {r.pendentes.length > 0 && <p className="at-fraco">Pendentes (ainda não decididas): {r.pendentes.slice(0, 12).join(', ')}{r.pendentes.length > 12 ? '…' : ''}</p>}
    </div>);
}

// ── CONFERÊNCIA · LEGADO (MOCKUP-CONFERENCIA-LEGADO, 19/11) ─────────────────────────────────────────────────────────────────────
// Grade: [seleção + evidência] · ID · Produto · Atributo de origem · Valor do legado · Destino · Situação · Ações (Gravar / Recusar).
// "Escolher destino" não grava; Gravar fica desabilitado até escolher. Cada decisão = UMA intenção com chave (contrato "foi salvo"): ícone e
// pílula de situação pelo desfecho real; resposta perdida = "A conferir" + Conferir gravação (GET, mesma chave). O valor do legado nunca é
// reinterpretado pelo nome do produto. Destino que já tem valor: a linha mostra o valor ATUAL (lido da ficha) e não grava (D10: sugestão não
// sobrescreve). LOTE (com chave, resultado por item): só itens selecionados com destino = atributo de ORIGEM e sem valor — é o que o
// sugestoes_lote do servidor faz hoje; destino alternativo vai pela linha (o lote não leva destino por item; mudar isso = pacote de servidor).
type DestinoLegado = { id: number; rotulo: string };
const destinosDe = (it: ItemConferencia): DestinoLegado[] => [
  { id: it.atributo_id, rotulo: it.atributo ?? `#${it.atributo_id}` },
  ...(it.atributo_alternativo_id ? [{ id: it.atributo_alternativo_id, rotulo: it.atributo_alternativo ?? `#${it.atributo_alternativo_id}` }] : []),
];
const temValorNo = (it: ItemConferencia, destino: number) => (destino === it.atributo_id ? it.ja_tem_valor : destino === it.atributo_alternativo_id ? it.alternativo_ja_tem_valor : false);
const situacaoLegado = (fase: string): { rotulo: string; tom: string } => {
  switch (fase) {
    case 'salvando': return { rotulo: 'Gravando…', tom: 'neutro' };
    case 'salvo': case 'sem_mudanca': return { rotulo: 'Gravado', tom: 'ativa' };
    case 'desconhecido': case 'em_andamento': case 'conferindo': return { rotulo: 'A conferir', tom: 'aviso' };
    case 'conflito': return { rotulo: 'Conflito', tom: 'aviso' };
    case 'recusada': return { rotulo: 'Erro', tom: 'erro' };
    default: return { rotulo: 'Pendente', tom: 'pendente' };
  }
};

const PREF_COLUNAS_LEG = 'at-legado-colunas-v1';
const OPCIONAIS_LEG = [{ chave: 'product_id', titulo: 'ID' }, { chave: 'atributo', titulo: 'Atributo de origem' }, { chave: 'valor_proposto', titulo: 'Valor do legado' }, { chave: 'situacao', titulo: 'Situação' }] as const;
function LegadoGrade({ itens, pode, aoRecarregar, aoLote, abrirProduto }: {
  itens: ItemConferencia[]; pode: boolean; aoRecarregar: () => Promise<unknown>; aoLote: (ids: number[]) => void; abrirProduto: (id: number) => void;
}) {
  const g = useGravacoes(aoRecarregar);
  const [busca, setBusca] = React.useState('');
  const [atrFiltro, setAtrFiltro] = React.useState('todos');
  const [destinos, setDestinos] = React.useState<Record<number, number>>({});
  const [sel, setSel] = React.useState<Set<number>>(new Set());
  const [aberto, setAberto] = React.useState<number | null>(null);
  const [atuais, setAtuais] = React.useState<Record<string, string>>({});   // "pid:aid" → valor atual lido da ficha (só quando o destino já tem valor)
  const [ordenacao, setOrdenacao] = React.useState<Ordenacao>({ chave: 'product_id', direcao: 'asc' });
  const [decididos, setDecididos] = React.useState<Record<number, string>>({});
  const [ocultas, setOcultas] = React.useState<string[]>(() => { try { const v = JSON.parse(localStorage.getItem(PREF_COLUNAS_LEG) ?? 'null'); return Array.isArray(v) ? v : []; } catch { return []; } });
  const mudarOcultas = (o: string[]) => { setOcultas(o); try { localStorage.setItem(PREF_COLUNAS_LEG, JSON.stringify(o)); } catch { /* sem armazenamento: vale só nesta visita */ } };   // id → desfecho recém-confirmado (a linha some na releitura)
  const atrs = React.useMemo(() => [...new Set(itens.map((x) => x.atributo ?? ''))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR')), [itens]);
  const filtrados = React.useMemo(() => {
    const t = busca.trim().toLowerCase();
    return itens.filter((x) => (atrFiltro === 'todos' || x.atributo === atrFiltro) && (!t || String(x.product_id) === t || x.produto.toLowerCase().includes(t)));
  }, [itens, busca, atrFiltro]);
  // seleção só do que está na lista filtrada (nunca amplia para linhas fora dela)
  React.useEffect(() => { setSel((s) => new Set([...s].filter((id) => filtrados.some((x) => x.id === id)))); }, [filtrados]);
  const lerAtual = React.useCallback(async (it: ItemConferencia, destino: number) => {
    const k = `${it.product_id}:${destino}`; if (atuais[k] !== undefined) return;
    try {
      const f = await obter<{ itens: { atributo_id: number; valor?: { texto?: string | null; numero?: string | number | null } | null; unidade_efetiva?: { simbolo?: string } | null }[] }>('ficha_produto', { product_id: it.product_id });
      const item = f.itens.find((x) => x.atributo_id === destino);
      const v = item?.valor; const txt = v ? `${v.numero ?? v.texto ?? '—'}${item?.unidade_efetiva?.simbolo ? ` ${item.unidade_efetiva.simbolo}` : ''}` : '—';
      setAtuais((m) => ({ ...m, [k]: String(txt) }));
    } catch { setAtuais((m) => ({ ...m, [k]: 'não foi possível ler agora' })); }
  }, [atuais]);
  const escolher = (it: ItemConferencia, destino: number) => {
    setDestinos((m) => ({ ...m, [it.id]: destino }));
    if (temValorNo(it, destino)) { setAberto(it.id); void lerAtual(it, destino); }
  };
  const gravar = async (it: ItemConferencia) => {
    const destino = destinos[it.id]; if (!destino || temValorNo(it, destino)) return;
    const st = await g.gravar(`${it.id}:decidir`, 'sugestao', { id: it.id, versao: it.versao, decisao: 'aceitar', atributo_id: destino, vincular: true }, 'atributo_id');
    if (st.fase === 'salvo' || st.fase === 'sem_mudanca') setDecididos((m) => ({ ...m, [it.id]: 'Gravado' }));
  };
  const recusar = async (it: ItemConferencia) => {
    const st = await g.gravar(`${it.id}:decidir`, 'sugestao', { id: it.id, versao: it.versao, decisao: 'recusar' }, 'decisao');
    if (st.fase === 'salvo' || st.fase === 'sem_mudanca') setDecididos((m) => ({ ...m, [it.id]: 'Recusado' }));
  };
  // lote: elegíveis = selecionados com destino escolhido = ORIGEM e sem valor
  const selecionados = filtrados.filter((x) => sel.has(x.id));
  const elegiveis = selecionados.filter((x) => destinos[x.id] === x.atributo_id && !x.ja_tem_valor);
  const naoElegiveis = selecionados.length - elegiveis.length;

  const colunas: ColunaTabela<ItemConferencia>[] = [
    { chave: 'sel', titulo: '', tipo: 'texto', ordenavel: false, classe: 'at-leg-col-sel', cabecalho: pode ? (
        <input type="checkbox" aria-label="Selecionar todas as decisões da lista" checked={filtrados.length > 0 && filtrados.every((x) => sel.has(x.id))}
          onChange={(e) => setSel(e.target.checked ? new Set(filtrados.map((x) => x.id)) : new Set())} />) : <span className="bl-so-leitor">Seleção</span>,
      render: (it, ctx) => (
        <span className="at-leg-sel">
          {pode && <input type="checkbox" aria-label={`Selecionar ${it.produto}`} checked={sel.has(it.id)} onChange={(e) => setSel((s) => { const n = new Set(s); if (e.target.checked) n.add(it.id); else n.delete(it.id); return n; })} />}
          <button type="button" className="at-leg-expandir" {...ctx.gatilho} aria-label={`${ctx.expandida ? 'Fechar' : 'Ver'} a evidência de ${it.produto}`}>
            <span aria-hidden>{ctx.expandida ? '▾' : '▸'}</span>
          </button>
        </span>) },
    { chave: 'product_id', titulo: 'ID', tipo: 'numero', classe: 'at-leg-col-id' },
    { chave: 'produto', titulo: 'Produto', tipo: 'texto', classe: 'at-leg-col-prod',
      render: (it) => <button type="button" className="at-link-produto" title={it.produto} onClick={() => abrirProduto(it.product_id)}>{it.produto}</button> },
    { chave: 'atributo', titulo: 'Atributo de origem', tipo: 'texto', render: (it) => <span className="at-dic-1l" title={it.atributo ?? ''}>{it.atributo ?? '—'}</span> },
    { chave: 'valor_proposto', titulo: 'Valor do legado', tipo: 'numero', valor: (it) => Number(it.valor_proposto),
      render: (it) => { const v = `${valorTxt(it.valor_proposto)}${it.unidade ? ` ${it.unidade}` : ''}`; return <span className="at-leg-valor" title={v}>{v}</span>; } },
    { chave: 'destino', titulo: 'Destino', tipo: 'texto', ordenavel: false, classe: 'at-leg-col-dest',
      render: (it) => pode ? (
        <select className="at-cel__select at-leg-destino" aria-label={`Destino de ${it.produto}`} value={destinos[it.id] ?? ''}
          disabled={g.estadoDe(`${it.id}:decidir`).fase === 'salvando'} onClick={(e) => e.stopPropagation()}
          onChange={(e) => { const v = Number(e.target.value); if (v) escolher(it, v); else setDestinos((m) => { const x = { ...m }; delete x[it.id]; return x; }); }}>
          <option value="">Escolher destino</option>
          {destinosDe(it).map((d) => <option key={d.id} value={d.id}>{d.rotulo}{temValorNo(it, d.id) ? ' (já tem valor)' : ''}</option>)}
        </select>) : <span className="at-fraco">só leitura</span> },
    { chave: 'situacao', titulo: 'Situação', tipo: 'texto', ordenavel: false, alinhamento: 'centro', classe: 'at-leg-col-sit',
      render: (it) => { const st = g.estadoDe(`${it.id}:decidir`); const s = decididos[it.id] ? { rotulo: decididos[it.id], tom: 'ativa' } : situacaoLegado(st.fase);
        return <span className={`at-und-pilula at-leg-pilula--${s.tom} ${s.tom === 'ativa' ? 'at-und-pilula--ativa' : ''}`} title={st.mensagem ?? undefined} data-fase={st.fase}>{s.rotulo}</span>; } },
    { chave: 'acoes', titulo: 'Ações', tipo: 'texto', ordenavel: false, alinhamento: 'centro', classe: 'at-leg-col-acoes', cabecalho: <span>Ações</span>,
      render: (it) => { const st = g.estadoDe(`${it.id}:decidir`); const destino = destinos[it.id]; const bloqueado = !destino || temValorNo(it, destino);
        return pode ? (
          <span className="at-leg-acoes">
            {podeConferir(st.fase) && !decididos[it.id] ? (
              // "A conferir": a ação PRINCIPAL é conferir (GET com a mesma chave; nada é reenviado), do mesmo tamanho de Gravar/Recusar
              <button type="button" className="bl-botao bl-botao--primario at-leg-btn at-leg-btn--conferir" aria-label="Conferir gravação" title={st.mensagem ?? 'Não conseguimos confirmar a gravação'}
                onClick={() => void g.conferir(`${it.id}:decidir`)}>Conferir gravação</button>
            ) : (
            <button type="button" className="bl-botao bl-botao--primario at-leg-btn" disabled={bloqueado || !livre(st.fase) || !!decididos[it.id]} aria-busy={st.fase === 'salvando'}
              title={!destino ? 'Escolha o destino primeiro' : temValorNo(it, destino) ? 'O destino já tem valor: a sugestão não sobrescreve (edite na ficha ou recuse)' : 'Gravar no destino escolhido'}
              onClick={() => void gravar(it)}>Gravar</button>)}
            <button type="button" className="bl-botao at-leg-btn" disabled={!livre(st.fase) || !!decididos[it.id]} onClick={() => void recusar(it)}>Recusar</button>
            {!podeConferir(st.fase) && <IconeEstado estado={st} />}
          </span>) : null; } },
  ];

  return (
    <>
      <CabecalhoTravado>
        <div className="at-und-barra-ferr at-leg-barra" role="search">
          <label className="at-und-busca">
            <span className="bl-so-leitor">Buscar produto ou ID</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input type="search" placeholder="Buscar produto ou ID" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
          <MenuEscolha rotulo="Atributo" valor={atrFiltro} aoEscolher={setAtrFiltro} opcoes={[{ valor: 'todos', rotulo: 'Todos' }, ...atrs.map((a) => ({ valor: a, rotulo: a }))]} />
          <span className="at-und-contagem" aria-live="polite">{filtrados.length.toLocaleString('pt-BR')} decis{filtrados.length === 1 ? 'ão' : 'ões'}</span>
          <span className="at-und-barra-dir"><MenuColunas opcionais={OPCIONAIS_LEG} ocultas={ocultas} aoMudar={mudarOcultas} /></span>
        </div>
        {pode && selecionados.length > 0 && (
          <div className="at-leg-lote" role="region" aria-label="Seleção">
            <span><strong>{selecionados.length}</strong> selecionada{selecionados.length > 1 ? 's' : ''} (só nesta lista filtrada) · <strong>{elegiveis.length}</strong> elegíve{elegiveis.length === 1 ? 'l' : 'is'} para o lote
              {naoElegiveis > 0 && <span className="at-fraco"> · {naoElegiveis} fora do lote (sem destino, destino alternativo ou destino com valor: grave na linha)</span>}</span>
            <button type="button" className="bl-botao bl-botao--primario" disabled={elegiveis.length === 0} title="Grava no atributo de origem; destino e restrições no resumo ao lado" onClick={() => aoLote(elegiveis.map((x) => x.id))}>Gravar {elegiveis.length} selecionado{elegiveis.length === 1 ? '' : 's'}</button>
            <button type="button" className="at-link" onClick={() => setSel(new Set())}>Limpar seleção</button>
          </div>)}
      </CabecalhoTravado>
      {filtrados.length === 0 ? (
        <Vazio titulo={itens.length ? 'Nenhuma decisão encontrada' : 'Nenhuma decisão pendente'} acao={itens.length ? <Botao aoClicar={() => { setBusca(''); setAtrFiltro('todos'); }}>Limpar busca</Botao> : undefined}>
          {itens.length ? 'Nenhuma decisão atende à busca.' : 'O legado não tem decisões pendentes.'}
        </Vazio>
      ) : (
        <div className="at-dic-moldura at-leg-moldura">
          <TabelaDados rolagem="container" className="at-leg-grade" legenda="Decisões do legado" colunas={colunas.filter((c) => !ocultas.includes(c.chave))} linhas={filtrados} chaveLinha={(it) => it.id}
            ordenacao={ordenacao} aoOrdenar={setOrdenacao} congelarOrdem={Object.keys(destinos).length > 0}
            expandida={(it) => aberto === it.id} aoAlternarExpansao={(it) => setAberto((x) => (x === it.id ? null : it.id))}
            renderExpansao={(it) => { const destino = destinos[it.id]; const k = destino ? `${it.product_id}:${destino}` : '';
              return (
                <div className="at-leg-evid">
                  <dl className="at-leg-pares">
                    <div><dt>Origem</dt><dd>{it.atributo}</dd></div>
                    <div><dt>Valor do legado</dt><dd><strong>{valorTxt(it.valor_proposto)}{it.unidade ? ` ${it.unidade}` : ''}</strong></dd></div>
                    <div><dt>Destinos possíveis</dt><dd>{destinosDe(it).map((d) => d.rotulo).join(' ou ')}</dd></div>
                  </dl>
                  {destino && temValorNo(it, destino) && (
                    <div className="at-leg-conflito" role="note">
                      <span className="at-leg-conflito__par"><span>Atual</span><strong>{atuais[k] ?? 'lendo…'}</strong></span>
                      <span className="at-leg-conflito__x" aria-hidden>×</span>
                      <span className="at-leg-conflito__par"><span>Legado</span><strong>{valorTxt(it.valor_proposto)}{it.unidade ? ` ${it.unidade}` : ''}</strong></span>
                      <span className="at-leg-conflito__fazer">O destino já tem valor e a sugestão não sobrescreve: <strong>edite na ficha</strong> se o legado estiver certo, ou <strong>Recuse</strong>.</span>
                    </div>)}
                  {g.estadoDe(`${it.id}:decidir`).mensagem && g.estadoDe(`${it.id}:decidir`).fase !== 'salvo' && <p className="at-leg-aviso">{g.estadoDe(`${it.id}:decidir`).mensagem}</p>}
                  <p className="at-leg-evid__tec">Evidência: {FONTE_SUGESTAO[it.fonte] ?? it.fonte} · confiança {it.confianca}{it.evidencia ? ` · ${it.evidencia}` : ''}</p>
                </div>); }}
            classeLinha={(it) => (decididos[it.id] ? 'at-leg-linha--decidida' : undefined)} />
        </div>
      )}
    </>
  );
}
