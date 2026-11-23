// panel-atributos/src/screens/Dicionario.tsx — tela "Atributos" (dicionário, missão 18/11 §11.6; UX-2 e UX-2b da DIREITA).
// UX-2b (19/11, BRIEFING-UX2B): edição NA PRÓPRIA TABELA, sem modal. Rótulo/importância/descrição na célula (Enter ou sair salva, Esc
// cancela); tipo e unidade padrão com confirmação na linha (barra amarela); liga/desliga com o uso; opções e o resto da definição na linha
// expandida; novo atributo = linha nova no topo. Cada célula grava com versão + chave de operação e mostra o recibo do contrato "foi salvo".
// Regras do servidor: código gerado e fixo; tipo travado com valores (TYPE_CHANGE_BLOCKED, mensagem na linha); trocar unidade com valores exige motivo.
import React from 'react';
import { obter, enviar, ErroApi } from '../lib/api';
import type { AtributoDicionario, Unidade, TipoAtributo } from '../lib/tipos';
import { IMPORTANCIA, IMPORTANCIAS, TIPO } from '../lib/rotulos';
import { dataHora, decimal, numeroParaApi } from '../lib/formatar';
import { Botao, Dialogo, Etiqueta, Carregando, Vazio, Erro, CabecalhoTravado } from '../ui/Comuns';
import { useModulo } from '../app/contexto';
import { TabelaDados, type ColunaTabela } from '../ui/TabelaDados';
import { comparadorPorLista, ordenarLinhas, type Ordenacao } from '../lib/ordenar';
import { precondicaoRenomear, type RascunhoRenomear } from '../lib/integridade';
import { confirmacaoOpcao, criarAtributoComUnidades, linhasHistorico, saidaEditor, usoOpcao, type Confirmacao, type CorpoRenomear, type EventoAuditoria, type SalvoIndividual } from '../ui/admin-ux2';
import { BlocoUx2, DetalheLinhaUx2 } from '../ui/AdminUx2';
import { BarraConfirmacao, BotaoLigaDesliga, CelulaEscolha, CelulaTexto, IconeEstado, useGravacoes, type EstadoCelula } from '../ui/CelulaEditavel';
import { avisoAtivo, avisoTipo, avisoUnidade, corpoCampoAtributo, validarCampoAtributo, type CampoAtributo } from '../ui/celula';
import { MenuColunas, MenuEscolha, MenuFiltros } from '../ui/MenuBarra';
import '../ui/celula.css';
import '../styles/dicionario.css';

interface RespDicionario { atributos: AtributoDicionario[]; unidades: Unidade[]; pode_administrar: boolean }
/** `produtos`: uso da opção — contrato pedido à ESQUERDA (PARA-STATUS §31); ausente = "ainda não conferido", nunca zero. */
interface OpcaoApi { id: number; rotulo: string; posicao: number; ativo: number | boolean; produtos?: number }
interface RespDetalhe { atributo: { id: number; versao: number; tipo: TipoAtributo }; opcoes: OpcaoApi[]; valores_preenchidos: number; auditoria?: EventoAuditoria[] }

const TIPOS: TipoAtributo[] = ['texto', 'numero', 'inteiro', 'booleano', 'opcao', 'multiopcao', 'data'];
const NUMERICOS: TipoAtributo[] = ['numero', 'inteiro'];
const COM_OPCOES: TipoAtributo[] = ['opcao', 'multiopcao'];
const CAMPOS: Record<string, string> = {
  rotulo: 'Rótulo', tipo: 'Tipo', casas: 'Casas decimais', minimo: 'Mínimo', maximo: 'Máximo', descricao: 'Descrição', unidade_id: 'Unidade padrão',
  importancia_padrao: 'Importância padrão', motivo: 'Motivo', codigo: 'Código', aceita_nao_se_aplica: 'Aceita "não se aplica"', unidades: 'Unidades permitidas',
};

const ligado = (v: unknown) => v === true || Number(v) === 1;
const n = (x: number) => x.toLocaleString('pt-BR');
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const rotuloUnidade = (u: Unidade) => `${u.simbolo} — ${u.nome}${u.grandeza ? ` (${u.grandeza})` : ''}${ligado(u.ativo) ? '' : ' · inativa'}`;
const decimalValido = (s: string) => /^-?\d+(\.\d+)?$/.test(s);
function mensagemErro(e: unknown): string {
  if (e instanceof ErroApi) {
    const c = e.campos.filter((k) => k !== 'motivo').map((k) => CAMPOS[k] ?? k);
    return c.length ? `${e.message} (${c.join(', ')})` : e.message;
  }
  return 'Falha de comunicação com o servidor.';
}

// ── Filtros ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
interface Filtros { busca: string; tipo: string; grupo: string; importancia: string; uso: '' | 'usados' | 'nao_usados'; ativo: 'ativos' | 'inativos' | 'todos' }
const FILTROS_PADRAO: Filtros = { busca: '', tipo: '', grupo: '', importancia: '', uso: '', ativo: 'ativos' };
const SEM_GRUPO = '__sem_grupo';
const SEM_IMPORTANCIA = '__sem_importancia';

// ── UX-2b: edição NA TABELA, sem modal (briefing /srv/dshow-docs/briefings/BRIEFING-UX2B.md) ───────────────────────────────────
// Rótulo, importância e descrição: direto na célula (Enter/sair salva, Esc cancela). Tipo e unidade padrão: select na célula com
// confirmação na própria linha (barra amarela). Ativo: liga/desliga com confirmação na linha (quantos produtos usam). Opções e os
// demais campos da definição: na linha expandida. Novo atributo: linha nova no topo, em edição, que só grava ao confirmar.
const ORDENACAO_PADRAO: Ordenacao = { chave: 'rotulo', direcao: 'asc' };
const PREF_COLUNAS = 'at-atributos-colunas-v3';
// ATRIBUTOS V3 (MOCKUP-ATRIBUTOS-V3, 19/11): padrão do mockup; Código técnico e Descrição só em "Colunas" (a busca continua achando pelo código).
const OPCIONAIS_ATR: { chave: string; titulo: string }[] = [
  { chave: 'codigo', titulo: 'Código técnico' }, { chave: 'tipo', titulo: 'Tipo' }, { chave: 'unidade', titulo: 'Unidade padrão' }, { chave: 'grupo_atributos', titulo: 'Grupo' },
  { chave: 'importancia_padrao', titulo: 'Importância padrão' }, { chave: 'descricao', titulo: 'Descrição' }, { chave: 'em_kits', titulo: 'Em kits' },
  { chave: 'produtos_com_valor', titulo: 'Produtos com valor' }, { chave: 'situacao', titulo: 'Situação' },
];
const OCULTAS_PADRAO = ['codigo', 'descricao'];
type AgruparAtr = 'nenhum' | 'grupo' | 'tipo';
/** Parecer do Jhony (P1): a criação é uma LINHA DA GRADE (id NOVO), alinhada às colunas, com rótulos compactos e persistentes em cada campo. */
const NOVO = -1;
type Rascunho = { rotulo: string; tipo: TipoAtributo; unidade_id: string; importancia_padrao: string; descricao: string; erro: string | null };
const RASCUNHO0: Rascunho = { rotulo: '', tipo: 'texto', unidade_id: '', importancia_padrao: '', descricao: '', erro: null };
const ok = (f: { fase: string }) => f.fase === 'salvo' || f.fase === 'sem_mudanca';
/** Histórico legível (parecer do Jhony): nomes de campo e de ação em português; o código técnico fica nos detalhes recolhidos. */
/** Valor do histórico em português (tipo, situação, unidade, importância, sim/não); o valor cru fica nos detalhes. */
function valorHist(campo: string, v: string, unidades: Unidade[]): string {
  if (v === '—' || v === '') return '—';
  switch (campo) {
    case 'tipo': return TIPO[v] ?? v;
    case 'ativo': return v === '1' || v === 'true' ? 'Ativo' : v === '0' || v === 'false' ? 'Inativo' : v;
    case 'unidade_id': return unidades.find((u) => String(u.id) === v)?.simbolo ?? `unidade ${v}`;
    case 'importancia_padrao': return IMPORTANCIA[v] ?? v;
    case 'aceita_nao_se_aplica': return v === '1' || v === 'true' ? 'Sim' : v === '0' || v === 'false' ? 'Não' : v;
    default: return v;
  }
}
/** Grupo sem o prefixo repetido "Atributos " (ex.: "Atributos Físicos" → "Físicos", "Atributos de Vídeo" → "de Vídeo"). */
const grupoCurto = (g: string) => g.replace(/^Atributos\s+/i, '') || g;
const CAMPOS_TECNICOS = new Set(['id', 'versao', 'autoridade', 'codigo', 'criado_em', 'atualizado_em', 'atualizado_por', 'criado_por', 'chave', 'chave_operacao', 'origem']);
const ROTULO_ACAO_CAMPO: Record<string, string> = { ativo: 'Situação', unidades_extras: 'Unidades permitidas', aceita_nao_se_aplica: 'Aceita "não se aplica"' };
const ACAO_HISTORICO: Record<string, string> = { criar: 'criou o atributo', editar: 'editou', desativar: 'desativou', reativar: 'reativou', unidades: 'mudou as unidades permitidas' };
const kc = (id: number | string, campo: string) => `${id}:${campo}`;

/** Confirmação pendente na linha (tipo, unidade padrão ou liga/desliga). */
type Pedido = { id: number; campo: 'tipo' | 'unidade_id' | 'ativo'; valor: string; motivo: string; pedeMotivo: boolean; erro: string | null };

export function Dicionario() {
  const [dados, setDados] = React.useState<RespDicionario | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [filtros, setFiltros] = React.useState<Filtros>(FILTROS_PADRAO);
  const [ordenacao, setOrdenacao] = React.useState<Ordenacao>(ORDENACAO_PADRAO);   // aqui (não na tabela): sobrevive à lista vazia por filtro
  const [aberto, setAberto] = React.useState<number | null>(null);   // linha expandida (opções e detalhes)
  const [pedido, setPedido] = React.useState<Pedido | null>(null);
  const [rascunho, setRascunho] = React.useState<Rascunho | null>(null);
  const mudarRascunho = (x: Partial<Rascunho>) => setRascunho((v) => (v ? { ...v, ...x, erro: null } : v));
  /** campo da linha auxiliar da criação: rótulo pequeno ACIMA do valor (largura do valor + seta) */
  const campoNovoExp = (rotulo: string, ctrl: React.ReactNode) => <label className="at-nova-campo at-nova-campo--exp"><span className="at-nova-campo__rot">{rotulo}</span>{ctrl}</label>;
  const novaLinha = rascunho !== null;
  const setNovaLinha = (v: boolean) => setRascunho(v ? { ...RASCUNHO0 } : null);
  const [focarOpcoes, setFocarOpcoes] = React.useState<number | null>(null);
  const busca = React.useDeferredValue(filtros.busca);
  const [agrupar, setAgrupar] = React.useState<AgruparAtr>('nenhum');
  const [ocultas, setOcultas] = React.useState<string[]>(() => {
    try { const v = JSON.parse(localStorage.getItem(PREF_COLUNAS) ?? 'null'); if (Array.isArray(v)) return v.filter((x) => typeof x === 'string'); } catch { /* preferência só deste navegador */ }
    return OCULTAS_PADRAO;
  });
  const mudarOcultas = (o: string[]) => { setOcultas(o); try { localStorage.setItem(PREF_COLUNAS, JSON.stringify(o)); } catch { /* idem */ } };

  const carregar = React.useCallback(async (sinal?: AbortSignal) => {
    setErro(null);
    try { setDados(await obter<RespDicionario>('dicionario', {}, sinal)); }
    catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) setErro(mensagemErro(e)); }
  }, []);
  React.useEffect(() => { const c = new AbortController(); void carregar(c.signal); return () => c.abort(); }, [carregar]);
  const recarregar = React.useCallback(() => carregar(), [carregar]);
  const g = useGravacoes(recarregar);
  const mudar = (p: Partial<Filtros>) => { setFiltros((f) => ({ ...f, ...p })); };

  const grupos = React.useMemo(() => {
    const s = new Set<string>(); let semGrupo = false;
    for (const a of dados?.atributos ?? []) { if (a.grupo_atributos) s.add(a.grupo_atributos); else semGrupo = true; }
    return { lista: [...s].sort((a, b) => a.localeCompare(b, 'pt-BR')), semGrupo };
  }, [dados]);

  const filtrados = React.useMemo(() => {
    const termos = semAcento(busca.trim()).split(/\s+/).filter(Boolean);
    return (dados?.atributos ?? []).filter((a) => {
      if (filtros.ativo === 'ativos' && !ligado(a.ativo)) return false;
      if (filtros.ativo === 'inativos' && ligado(a.ativo)) return false;
      if (filtros.tipo && a.tipo !== filtros.tipo) return false;
      if (filtros.grupo && (filtros.grupo === SEM_GRUPO ? a.grupo_atributos : a.grupo_atributos !== filtros.grupo)) return false;
      if (filtros.importancia && (filtros.importancia === SEM_IMPORTANCIA ? a.importancia_padrao : a.importancia_padrao !== filtros.importancia)) return false;
      const usado = a.produtos_com_valor > 0 || a.em_kits > 0;
      if (filtros.uso === 'usados' && !usado) return false;
      if (filtros.uso === 'nao_usados' && usado) return false;
      if (termos.length) { const alvo = semAcento(`${a.rotulo} ${a.codigo}`); if (!termos.every((t) => alvo.includes(t))) return false; }
      return true;
    });
  }, [dados, filtros.ativo, filtros.tipo, filtros.grupo, filtros.importancia, filtros.uso, busca]);

  const pode = !!dados?.pode_administrar;
  const unidades = dados?.unidades ?? [];
  const salvarCampo = React.useCallback((a: AtributoDicionario, campo: CampoAtributo, valor: string, motivo?: string) =>
    g.gravar(kc(a.id, campo), 'atributo', corpoCampoAtributo(a, campo, valor, motivo), campo), [g]);

  /** Confirma o rascunho (uma intenção, uma chave). Lista/opções: a linha abre para cadastrar as opções. */
  const criarRascunho = async () => {
    const rd = rascunho; if (!rd) return;
    const e = validarCampoAtributo('rotulo', rd.rotulo) ?? validarCampoAtributo('descricao', rd.descricao);
    if (e) { setRascunho({ ...rd, erro: e }); return; }
    const corpo: Record<string, unknown> = { rotulo: rd.rotulo.trim(), tipo: rd.tipo, aceita_nao_se_aplica: 1 };
    if (NUMERICOS.includes(rd.tipo) && rd.unidade_id) corpo.unidade_id = Number(rd.unidade_id);
    if (rd.importancia_padrao) corpo.importancia_padrao = rd.importancia_padrao;
    if (rd.descricao.trim()) corpo.descricao = rd.descricao.trim();
    const st = await g.gravar('novo:atributo', 'atributo', corpo, 'rotulo');
    const id = Number((st.dados as { atributo?: { id?: number } } | undefined)?.atributo?.id ?? 0);
    if (ok(st) && id) { g.limpar('novo:atributo'); setRascunho(null); if (COM_OPCOES.includes(rd.tipo)) { setAberto(id); setFocarOpcoes(id); } return; }
    setRascunho((v) => (v ? { ...v, erro: st.mensagem } : v));
  };
  const colunas = React.useMemo<ColunaTabela<AtributoDicionario>[]>(() => {
    const est = (a: AtributoDicionario, c: string) => g.estadoDe(kc(a.id, c));
    const conf = (a: AtributoDicionario, c: string) => () => void g.conferir(kc(a.id, c));
    const opUnid = (a: AtributoDicionario) => [{ valor: '', rotulo: 'Sem unidade' },
      ...unidades.filter((u) => ligado(u.ativo) || u.id === a.unidade_id).map((u) => ({ valor: String(u.id), rotulo: rotuloUnidade(u) }))];
    const emPedido = (a: AtributoDicionario, c: Pedido['campo']) => (pedido && pedido.id === a.id && pedido.campo === c ? pedido.valor : null);
    const campoNovo = (rotulo: string, ctrl: React.ReactNode) => <label className="at-nova-campo"><span className="at-nova-campo__rot">{rotulo}</span>{ctrl}</label>;
    const rd = rascunho;
    const mudarRd = (x: Partial<Rascunho>) => setRascunho((v) => (v ? { ...v, ...x, erro: null } : v));
    const celulaNova = (chave: string): React.ReactNode => {
      if (!rd) return null;
      switch (chave) {
        case 'rotulo': return campoNovo('Rótulo', <input className="at-cel__campo" aria-label="Rótulo do novo atributo" autoFocus maxLength={128} value={rd.rotulo} onChange={(e) => mudarRd({ rotulo: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void criarRascunho(); } else if (e.key === 'Escape') { e.preventDefault(); setRascunho(null); } }} />);
        case 'tipo': return campoNovo('Tipo', <select className="at-cel__select" aria-label="Tipo do novo atributo" value={rd.tipo} onChange={(e) => mudarRd({ tipo: e.target.value as TipoAtributo, unidade_id: '' })}>
          {TIPOS.map((t) => <option key={t} value={t}>{TIPO[t]}</option>)}</select>);
        // Unidade padrão e Importância: na grade, só o VALOR escolhido (resumo); os campos ficam na linha auxiliar da criação, com rótulo acima
        case 'unidade': return NUMERICOS.includes(rd.tipo) ? <span className="at-nova-resumo" title="Escolha na linha de baixo">{unidades.find((u) => String(u.id) === rd.unidade_id)?.simbolo ?? 'Sem unidade'}</span> : <span className="at-dic-zero" title="Só atributos numéricos têm unidade">—</span>;
        case 'importancia_padrao': return <span className="at-nova-resumo" title="Escolha na linha de baixo">{rd.importancia_padrao ? IMPORTANCIA[rd.importancia_padrao] : '—'}</span>;
        case 'descricao': return campoNovo('Descrição', <input className="at-cel__campo" aria-label="Descrição do novo atributo" maxLength={500} value={rd.descricao} onChange={(e) => mudarRd({ descricao: e.target.value })} />);
        case 'situacao': return <span className="at-und-pilula at-nova-pilula">Novo</span>;
        case 'acoes': return (
          <span className="at-und-acoes">
            <button type="button" className="at-icone-acao at-icone-acao--confirmar" aria-label="Confirmar o novo atributo" title="Confirmar (Enter)" disabled={!rd.rotulo.trim() || g.estadoDe('novo:atributo').fase === 'salvando'} onClick={() => void criarRascunho()}>✓</button>
            <button type="button" className="at-icone-acao" aria-label="Cancelar o novo atributo" title="Cancelar (Esc)" disabled={g.estadoDe('novo:atributo').fase === 'salvando'} onClick={() => setRascunho(null)}>✕</button>
            <IconeEstado estado={g.estadoDe('novo:atributo')} aoConferir={() => void g.conferir('novo:atributo')} compacto />
          </span>);
        default: return <span className="at-dic-zero">—</span>;
      }
    };
    const base: ColunaTabela<AtributoDicionario>[] = [
      { chave: 'rotulo', titulo: 'Rótulo', tipo: 'texto', classe: 'at-dic-rotulo',
        render: (a) => <CelulaTexto valor={a.rotulo} rotulo={`Rótulo de ${a.rotulo}`} pode={pode} validar={(v) => validarCampoAtributo('rotulo', v)}
          aoSalvar={async (v) => ok(await salvarCampo(a, 'rotulo', v))} estado={est(a, 'rotulo')} aoConferir={conf(a, 'rotulo')} /> },
      { chave: 'codigo', titulo: 'Código técnico', tipo: 'texto', classe: 'at-dic-col-codigo', render: (a) => <span className="at-dic-codigo-wrap" data-codigo={a.codigo}><span className="at-dic-codigo-1l" tabIndex={0} title={a.codigo} aria-label={`Código ${a.codigo}`}>{a.codigo}</span></span> },
      { chave: 'tipo', titulo: 'Tipo', tipo: 'texto', classe: 'at-dic-col-tipo', valor: (a) => TIPO[a.tipo] ?? a.tipo,
        render: (a) => <CelulaEscolha valor={emPedido(a, 'tipo') ?? a.tipo} rotulo={`Tipo de ${a.rotulo}`} pode={pode} opcoes={TIPOS.map((t) => ({ valor: t, rotulo: TIPO[t] }))}
          aoEscolher={(v) => setPedido({ id: a.id, campo: 'tipo', valor: v, motivo: '', pedeMotivo: false, erro: null })} estado={est(a, 'tipo')} aoConferir={conf(a, 'tipo')} /> },
      // unidade em REPOUSO só com o símbolo; o editor mostra nome e tipo de medida
      { chave: 'unidade', titulo: 'Unidade padrão', tipo: 'texto', classe: 'at-dic-col-unid',
        render: (a) => NUMERICOS.includes(a.tipo) ? (
          <CelulaEscolha valor={emPedido(a, 'unidade_id') ?? String(a.unidade_id ?? '')} rotulo={`Unidade padrão de ${a.rotulo}`} pode={pode} opcoes={opUnid(a)}
            repouso={(() => { const v = emPedido(a, 'unidade_id'); const u = v !== null ? unidades.find((x) => String(x.id) === v) : null; return v !== null ? (u?.simbolo ?? null) : a.unidade; })()}
            aoEscolher={(v) => setPedido({ id: a.id, campo: 'unidade_id', valor: v, motivo: '', pedeMotivo: avisoUnidade(a, '', '').pedeMotivo, erro: null })}
            estado={est(a, 'unidade_id')} aoConferir={conf(a, 'unidade_id')} />) : <span className="at-dic-zero">—</span> },
      { chave: 'grupo_atributos', titulo: 'Grupo', tipo: 'texto', classe: 'at-dic-col-grupo', render: (a) => (a.grupo_atributos ? <span className="at-dic-1l at-dic-grupo" title={a.grupo_atributos}>
          {/* parecer 3: em telas estreitas, sem o prefixo repetido "Atributos " (a parte que distingue fica visível); nome completo no title e em telas largas */}
          <span className="at-dic-grupo__longo">{a.grupo_atributos}</span><span className="at-dic-grupo__curto" aria-hidden>{grupoCurto(a.grupo_atributos)}</span></span> : <span className="at-dic-zero">—</span>) },
      { chave: 'importancia_padrao', titulo: 'Importância padrão', tipo: 'texto', classe: 'at-dic-col-imp', comparador: comparadorPorLista(IMPORTANCIAS),
        render: (a) => <CelulaEscolha valor={a.importancia_padrao ?? ''} rotulo={`Importância padrão de ${a.rotulo}`} pode={pode} repouso={a.importancia_padrao ? undefined : '—'}
          opcoes={[{ valor: '', rotulo: 'Sem importância padrão' }, ...IMPORTANCIAS.map((i) => ({ valor: i, rotulo: IMPORTANCIA[i] }))]}
          aoEscolher={(v) => void salvarCampo(a, 'importancia_padrao', v)} estado={est(a, 'importancia_padrao')} aoConferir={conf(a, 'importancia_padrao')} /> },
      { chave: 'descricao', titulo: 'Descrição', tipo: 'texto', classe: 'at-dic-desc',
        render: (a) => <CelulaTexto valor={a.descricao} rotulo={`Descrição de ${a.rotulo}`} pode={pode} validar={(v) => validarCampoAtributo('descricao', v)}
          aoSalvar={async (v) => ok(await salvarCampo(a, 'descricao', v))} estado={est(a, 'descricao')} aoConferir={conf(a, 'descricao')} vazio={pode ? '+ descrição' : '—'} /> },
      { chave: 'em_kits', titulo: 'Em kits', tipo: 'numero', classe: 'at-dic-col-num', render: (a) => n(a.em_kits) },
      { chave: 'produtos_com_valor', titulo: 'Produtos com valor', tipo: 'numero', classe: 'at-dic-col-num', render: (a) => n(a.produtos_com_valor) },
      { chave: 'situacao', titulo: 'Situação', tipo: 'texto', classe: 'at-dic-col-sit', alinhamento: 'centro', valor: (a) => (ligado(a.ativo) ? 'Ativo' : 'Inativo'),
        render: (a) => <span className={`at-und-pilula ${ligado(a.ativo) ? 'at-und-pilula--ativa' : ''}`}>{ligado(a.ativo) ? 'Ativo' : 'Inativo'}</span> },
      { chave: 'acoes', titulo: 'Ações', tipo: 'texto', ordenavel: false, classe: 'at-dic-col-acoes', alinhamento: 'centro', cabecalho: <span>Ações</span>,
        render: (a, ctx) => (
          <span className="at-und-acoes">
            <button type="button" className="at-icone-acao at-icone-acao--editar" {...ctx.gatilho}
              aria-label={`${ctx.expandida ? 'Fechar a edição de' : 'Editar'} ${a.rotulo}${COM_OPCOES.includes(a.tipo) ? ' (inclui as opções)' : ''}`} title={ctx.expandida ? 'Fechar' : 'Editar atributo'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
            </button>
            {pode && <button type="button" className={`at-icone-acao at-icone-acao--energia ${ligado(a.ativo) ? '' : 'at-icone-acao--desligada'}`}
              aria-label={ligado(a.ativo) ? `Desativar ${a.rotulo}` : `Reativar ${a.rotulo}`} title={ligado(a.ativo) ? 'Desativar atributo' : 'Reativar atributo'}
              onClick={(e) => { e.stopPropagation(); setPedido({ id: a.id, campo: 'ativo', valor: ligado(a.ativo) ? '0' : '1', motivo: '', pedeMotivo: false, erro: null }); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M12 3v9" /><path d="M6.4 6.6a8 8 0 1 0 11.2 0" /></svg>
            </button>}
            <IconeEstado estado={est(a, 'ativo')} aoConferir={conf(a, 'ativo')} />
          </span>) },
    ];
    return base.map((c): ColunaTabela<AtributoDicionario> => ({ ...c, render: (a, ctx) => (a.id === NOVO ? celulaNova(c.chave) : c.render ? c.render(a, ctx) : String((c.valor ?? ((l: AtributoDicionario) => (l as unknown as Record<string, unknown>)[c.chave]))(a) ?? '')) }));
  }, [g, pode, unidades, pedido, salvarCampo, rascunho]);

  if (erro && !dados) return <Erro mensagem={erro} aoTentar={() => void carregar()} />;
  if (!dados) return <Carregando rotulo="Carregando o dicionário" />;

  const filtrando = JSON.stringify(filtros) !== JSON.stringify(FILTROS_PADRAO);
  const linhaRascunho = rascunho ? ({ id: NOVO, legado_id: null, codigo: '', rotulo: rascunho.rotulo, tipo: rascunho.tipo, unidade_id: null, unidade: null, casas: null, minimo: null, maximo: null,
    descricao: rascunho.descricao, ativo: 1, versao: 0, autoridade: '', aceita_nao_se_aplica: 1, importancia_padrao: null, importancia_legado: null, grupo_atributos: null, em_kits: 0,
    produtos_com_valor: 0, unidades_extras: [] } as AtributoDicionario) : null;
  const linhasGrade = (() => {
    if (!linhaRascunho) return filtrados;
    const col = colunas.find((c) => c.chave === ordenacao.chave);   // mesma ordem que a tela mostrava, congelada enquanto o rascunho existe
    const ord = col ? ordenarLinhas(filtrados, { valor: col.valor ?? ((l: AtributoDicionario) => (l as unknown as Record<string, unknown>)[col.chave]), tipo: col.tipo, comparador: col.comparador }, ordenacao.direcao) : filtrados;
    return [linhaRascunho, ...ord];
  })();
  const alternar = (a: AtributoDicionario) => setAberto((x) => (x === a.id ? null : a.id));
  const criado = (id: number, comOpcoes: boolean) => { setNovaLinha(false); if (comOpcoes) { setAberto(id); setFocarOpcoes(id); } };

  return (
    <div className="at-dic-v2 at-dic-v3">
      <CabecalhoTravado>
        <div className="at-und-barra-ferr at-dic-barra" role="search">
          {pode && <button type="button" className="at-und-nova-btn" disabled={novaLinha} onClick={() => setNovaLinha(true)}><span aria-hidden>+</span> Novo atributo</button>}
          <label className="at-und-busca">
            <span className="bl-so-leitor">Buscar por rótulo ou código</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input type="search" placeholder="Buscar rótulo ou código" value={filtros.busca} onChange={(e) => mudar({ busca: e.target.value })} />
          </label>
          <span className="at-und-contagem" aria-live="polite">{n(filtrados.length)} de {n(dados.atributos.length)} atributos{!pode && ' · só consulta'}
            {erro && <span className="at-alerta" role="alert"> · {erro}</span>}</span>
          <MenuEscolha rotulo="Situação" valor={filtros.ativo} aoEscolher={(v) => mudar({ ativo: v as Filtros['ativo'] })}
            opcoes={[{ valor: 'ativos', rotulo: 'Só ativos' }, { valor: 'inativos', rotulo: 'Só inativos' }, { valor: 'todos', rotulo: 'Ativos e inativos' }]} />
          <MenuFiltros ativos={[filtros.tipo, filtros.grupo, filtros.importancia, filtros.uso].filter(Boolean).length}
            aoLimpar={() => mudar({ tipo: '', grupo: '', importancia: '', uso: '' })}>
            <label>Tipo<select aria-label="Tipo" value={filtros.tipo} onChange={(e) => mudar({ tipo: e.target.value })}>
              <option value="">Todos</option>{TIPOS.map((t) => <option key={t} value={t}>{TIPO[t]}</option>)}</select></label>
            <label>Grupo<select aria-label="Grupo" value={filtros.grupo} onChange={(e) => mudar({ grupo: e.target.value })}>
              <option value="">Todos</option>{grupos.lista.map((x) => <option key={x} value={x}>{x}</option>)}{grupos.semGrupo && <option value={SEM_GRUPO}>Sem grupo</option>}</select></label>
            <label>Importância<select aria-label="Importância" value={filtros.importancia} onChange={(e) => mudar({ importancia: e.target.value })}>
              <option value="">Todas</option>{IMPORTANCIAS.map((i) => <option key={i} value={i}>{IMPORTANCIA[i]}</option>)}<option value={SEM_IMPORTANCIA}>Sem padrão</option></select></label>
            <label>Uso<select aria-label="Uso" value={filtros.uso} onChange={(e) => mudar({ uso: e.target.value as Filtros['uso'] })}>
              <option value="">Todos</option><option value="usados">Usados (em kit ou com valor)</option><option value="nao_usados">Não usados</option></select></label>
          </MenuFiltros>
          <span className="at-und-direita">
            <MenuEscolha rotulo="Agrupar" valor={agrupar} mostrarValor={false} aoEscolher={setAgrupar}
              opcoes={[{ valor: 'nenhum', rotulo: 'Sem agrupamento' }, { valor: 'grupo', rotulo: 'Por grupo' }, { valor: 'tipo', rotulo: 'Por tipo' }]} />
            <MenuColunas opcionais={OPCIONAIS_ATR} ocultas={ocultas} aoMudar={mudarOcultas} />
          </span>
        </div>
      </CabecalhoTravado>


      {filtrados.length === 0 ? (
        <Vazio titulo="Nenhum atributo encontrado" acao={filtrando ? <Botao aoClicar={() => mudar(FILTROS_PADRAO)}>Limpar filtros</Botao> : undefined}>
          {filtrando ? 'Nenhum atributo atende aos filtros escolhidos.' : 'O dicionário ainda não tem atributos.'}
        </Vazio>
      ) : (
        <div className="at-dic-moldura">
          <TabelaDados rolagem="container" className="at-dic-tabela at-dic-tabela--edicao" legenda="Atributos do dicionário" colunas={colunas.filter((c) => !ocultas.includes(c.chave))}
            grupos={agrupar === 'grupo' ? [...grupos.lista.map((x) => ({ chave: x, titulo: x })), { chave: SEM_GRUPO, titulo: 'Sem grupo' }] : agrupar === 'tipo' ? TIPOS.map((t) => ({ chave: t, titulo: TIPO[t] })) : undefined}
            grupoDaLinha={agrupar === 'grupo' ? (a) => a.grupo_atributos ?? SEM_GRUPO : agrupar === 'tipo' ? (a) => a.tipo : undefined} linhas={linhasGrade} chaveLinha={(a) => a.id}
            ordenacao={linhaRascunho ? null : ordenacao} aoOrdenar={(o) => { if (!linhaRascunho) setOrdenacao(o); }} congelarOrdem={pedido !== null}
            expandida={(a) => a.id === NOVO || aberto === a.id || pedido?.id === a.id} aoAlternarExpansao={alternar}
            renderExpansao={(a) => a.id === NOVO && rascunho ? (
              <div className="at-nova-exp" data-at-nova-linha>
                {NUMERICOS.includes(rascunho.tipo) && campoNovoExp('Unidade padrão', <select className="at-cel__select" aria-label="Unidade padrão do novo atributo" value={rascunho.unidade_id} onChange={(e) => mudarRascunho({ unidade_id: e.target.value })}>
          <option value="">Sem unidade</option>{unidades.filter((u) => ligado(u.ativo)).map((u) => <option key={u.id} value={u.id} title={rotuloUnidade(u)}>{`${u.simbolo} · ${u.nome}`}</option>)}</select>)}
                {campoNovoExp('Importância padrão', <select className="at-cel__select" aria-label="Importância padrão do novo atributo" value={rascunho.importancia_padrao} onChange={(e) => mudarRascunho({ importancia_padrao: e.target.value })}>
          <option value="">Sem importância padrão</option>{IMPORTANCIAS.map((i) => <option key={i} value={i}>{IMPORTANCIA[i]}</option>)}</select>)}
                {!ocultas.includes('descricao') ? null : (
                  <label className="at-nova-campo at-nova-campo--largo"><span className="at-nova-campo__rot">Descrição</span>
                    <input className="at-cel__campo" aria-label="Descrição do novo atributo" maxLength={500} value={rascunho.descricao} onChange={(e) => setRascunho((v) => (v ? { ...v, descricao: e.target.value, erro: null } : v))} /></label>)}
                <span className="at-dic-dica">Só grava ao confirmar (✓ ou Enter). {COM_OPCOES.includes(rascunho.tipo) ? 'Depois de confirmar, a linha abre para cadastrar as opções.' : ''}</span>
                {rascunho.erro && <span className="at-cel__aviso at-cel__aviso--erro" role="alert">{rascunho.erro}</span>}
              </div>) : (
              <>
                {pedido?.id === a.id && <BarraPedido a={a} p={pedido} unidades={unidades} estado={g.estadoDe(kc(a.id, pedido.campo))}
                  aoMudar={(x) => setPedido((p) => (p && p.id === a.id ? { ...p, ...x } : p))} aoFechar={() => setPedido(null)}
                  confirmar={async (p) => (p.campo === 'ativo'
                    ? g.gravar(kc(a.id, 'ativo'), 'atributo_ativo', { id: a.id, ativo: p.valor === '1', versao: a.versao })
                    : salvarCampo(a, p.campo, p.valor, p.campo === 'unidade_id' ? p.motivo : undefined))} />}
                {aberto === a.id && <DetalheAtributo key={a.id} a={a} pode={pode} unidades={unidades} g={g} focarNova={focarOpcoes === a.id} aoFechar={() => setAberto(null)} />}
              </>)}
            classeLinha={(a) => [ligado(a.ativo) ? '' : 'at-linha--inativa', aberto === a.id ? 'at-ux2-linha--aberta' : '', pedido?.id === a.id ? 'at-linha--pedido' : ''].join(' ').trim() || undefined} />
        </div>
      )}
    </div>
  );
}

type Gravacoes = ReturnType<typeof useGravacoes>;

/** Barra amarela de confirmação NA LINHA: tipo, unidade padrão (com motivo quando há valores) ou liga/desliga (com o uso). */
function BarraPedido({ a, p, unidades, estado, aoMudar, aoFechar, confirmar }: {
  a: AtributoDicionario; p: Pedido; unidades: Unidade[]; estado: EstadoCelula; aoMudar: (x: Partial<Pedido>) => void; aoFechar: () => void;
  confirmar: (p: Pedido) => Promise<EstadoCelula>;
}) {
  const nomeUnid = (id: string) => { const u = unidades.find((x) => String(x.id) === id); return u ? u.simbolo : 'sem unidade'; };
  const texto = p.campo === 'tipo' ? avisoTipo(a, TIPO[a.tipo] ?? a.tipo, TIPO[p.valor as TipoAtributo] ?? p.valor)
    : p.campo === 'unidade_id' ? avisoUnidade(a, a.unidade ?? 'sem unidade', nomeUnid(p.valor)).texto
    : avisoAtivo(a, p.valor === '1');
  const ir = async () => {
    const st = await confirmar(p);
    if (ok(st)) { aoFechar(); return; }
    if (st.codigo === 'UNIT_CHANGE_REQUIRES_REASON') { aoMudar({ pedeMotivo: true, erro: 'Há valores gravados: diga o motivo da troca.' }); return; }
    aoMudar({ erro: st.mensagem });   // TYPE_CHANGE_BLOCKED, conflito, desconhecido…: a mensagem fica na linha
  };
  return (
    <BarraConfirmacao texto={texto} erro={p.erro} trabalhando={estado.fase === 'salvando'}
      rotuloConfirmar={p.campo === 'ativo' ? (p.valor === '1' ? 'Reativar' : 'Desativar') : 'Confirmar'}
      motivo={p.motivo} aoMotivo={p.campo === 'unidade_id' && p.pedeMotivo ? (v) => aoMudar({ motivo: v }) : undefined}
      aoConfirmar={() => void ir()} aoCancelar={aoFechar} />
  );
}

/** Linha nova no topo da tabela, em edição. Só grava ao confirmar (uma intenção, uma chave). */
function NovaLinha({ unidades, gravar, estado, aoConferir, aoCancelar, aoCriado }: {
  unidades: Unidade[]; gravar: Gravacoes['gravar']; estado: EstadoCelula; aoConferir: () => void; aoCancelar: () => void; aoCriado: (id: number, comOpcoes: boolean) => void;
}) {
  const [f, setF] = React.useState({ rotulo: '', tipo: 'texto' as TipoAtributo, unidade_id: '', importancia_padrao: '', descricao: '' });
  const [erroLocal, setErroLocal] = React.useState<string | null>(null);
  const numerico = NUMERICOS.includes(f.tipo);
  const confirmar = async () => {
    const e = validarCampoAtributo('rotulo', f.rotulo) ?? validarCampoAtributo('descricao', f.descricao); if (e) { setErroLocal(e); return; }
    const corpo: Record<string, unknown> = { rotulo: f.rotulo.trim(), tipo: f.tipo, aceita_nao_se_aplica: 1 };
    if (numerico && f.unidade_id) corpo.unidade_id = Number(f.unidade_id);
    if (f.importancia_padrao) corpo.importancia_padrao = f.importancia_padrao;
    if (f.descricao.trim()) corpo.descricao = f.descricao.trim();
    const st = await gravar('novo:atributo', 'atributo', corpo, 'rotulo');
    const id = Number((st.dados as { atributo?: { id?: number } } | undefined)?.atributo?.id ?? 0);
    if (ok(st) && id) aoCriado(id, COM_OPCOES.includes(f.tipo));
  };
  const tecla = (e: React.KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); aoCancelar(); } else if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') { e.preventDefault(); void confirmar(); } };
  return (
    <div className="at-dic-nova" role="group" aria-label="Novo atributo" data-at-nova-linha onKeyDown={tecla}>
      <input className="at-cel__campo" aria-label="Rótulo do novo atributo" placeholder="Rótulo *" autoFocus maxLength={128} value={f.rotulo}
        onChange={(e) => { setF({ ...f, rotulo: e.target.value }); setErroLocal(null); }} />
      <select className="at-cel__select" aria-label="Tipo do novo atributo" value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as TipoAtributo, unidade_id: '' })}>
        {TIPOS.map((t) => <option key={t} value={t}>{TIPO[t]}</option>)}
      </select>
      <select className="at-cel__select" aria-label="Unidade padrão do novo atributo" value={f.unidade_id} disabled={!numerico} onChange={(e) => setF({ ...f, unidade_id: e.target.value })}>
        <option value="">{numerico ? 'Sem unidade' : '— (só numéricos)'}</option>
        {numerico && unidades.filter((u) => ligado(u.ativo)).map((u) => <option key={u.id} value={u.id}>{rotuloUnidade(u)}</option>)}
      </select>
      <select className="at-cel__select" aria-label="Importância padrão do novo atributo" value={f.importancia_padrao} onChange={(e) => setF({ ...f, importancia_padrao: e.target.value })}>
        <option value="">Sem padrão</option>{IMPORTANCIAS.map((i) => <option key={i} value={i}>{IMPORTANCIA[i]}</option>)}
      </select>
      <input className="at-cel__campo at-dic-nova__desc" aria-label="Descrição do novo atributo" placeholder="Descrição" maxLength={500} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
      <span className="at-dic-nova__acoes">
        <button type="button" className="bl-botao bl-botao--primario" disabled={estado.fase === 'salvando' || !f.rotulo.trim()} aria-busy={estado.fase === 'salvando'} onClick={() => void confirmar()}>Confirmar</button>
        <button type="button" className="bl-botao" disabled={estado.fase === 'salvando'} onClick={aoCancelar}>Cancelar</button>
        <IconeEstado estado={estado} aoConferir={aoConferir} />
      </span>
      {(erroLocal || (estado.fase !== 'ocioso' && estado.fase !== 'salvando' && estado.mensagem)) &&
        <span className="at-cel__aviso at-cel__aviso--erro" role="alert">{erroLocal ?? estado.mensagem}</span>}
      {COM_OPCOES.includes(f.tipo) && <span className="at-dic-dica">Depois de confirmar, a linha abre para você cadastrar as opções.</span>}
    </div>
  );
}

/** Campos da definição na linha expandida: casas, mínimo, máximo, "aceita não se aplica" e unidades permitidas. */
function DefinicaoNaLinha({ a, pode, unidades, g }: { a: AtributoDicionario; pode: boolean; unidades: Unidade[]; g: Gravacoes }) {
  const numerico = NUMERICOS.includes(a.tipo);
  const est = (c: string) => g.estadoDe(kc(a.id, c));
  const conf = (c: string) => () => void g.conferir(kc(a.id, c));
  const gravarNum = async (c: 'casas' | 'minimo' | 'maximo', v: string) => {
    const t = v.trim(); const dado = t === '' ? null : c === 'casas' ? Number(t) : numeroParaApi(t);
    return ok(await g.gravar(kc(a.id, c), 'atributo', { id: a.id, versao: a.versao, [c]: dado }, c));
  };
  const validarNum = (c: 'casas' | 'minimo' | 'maximo') => (v: string) => {
    const t = v.trim(); if (!t) return null;
    if (c === 'casas') return /^[0-6]$/.test(t) ? null : 'Um número inteiro de 0 a 6.';
    return decimalValido(numeroParaApi(t)) ? null : 'Número inválido (use vírgula para decimais).';
  };
  const [extras, setExtras] = React.useState<number[]>([...a.unidades_extras].sort((x, y) => x - y));
  React.useEffect(() => { setExtras([...a.unidades_extras].sort((x, y) => x - y)); }, [a.unidades_extras]);
  const oferecidas = unidades.filter((u) => u.id !== a.unidade_id && (ligado(u.ativo) || a.unidades_extras.includes(u.id)));
  const mudouExtras = !mesmoConjunto(extras, a.unidades_extras);
  return (
    <BlocoUx2 titulo="Definição">
      <div className="at-dic-def">
        <label className="at-dic-def__campo at-dic-def__campo--largo"><span>Descrição</span>
          <CelulaTexto valor={a.descricao} rotulo={`Descrição de ${a.rotulo}`} pode={pode} validar={(v) => validarCampoAtributo('descricao', v)}
            aoSalvar={async (v) => ok(await g.gravar(kc(a.id, 'descricao'), 'atributo', corpoCampoAtributo(a, 'descricao', v), 'descricao'))}
            estado={g.estadoDe(kc(a.id, 'descricao'))} aoConferir={() => void g.conferir(kc(a.id, 'descricao'))} vazio={pode ? '+ descrição' : '—'} />
        </label>
        {numerico && (['casas', 'minimo', 'maximo'] as const).map((c) => (
          <label key={c} className="at-dic-def__campo"><span>{CAMPOS[c]}</span>
            <CelulaTexto valor={a[c] === null ? null : c === 'casas' ? String(a.casas) : decimal(String(a[c]))} rotulo={`${CAMPOS[c]} de ${a.rotulo}`} pode={pode}
              validar={validarNum(c)} aoSalvar={(v) => gravarNum(c, v)} estado={est(c)} aoConferir={conf(c)} />
          </label>))}
        <span className="at-dic-def__campo"><span>{CAMPOS.aceita_nao_se_aplica}</span>
          <BotaoLigaDesliga ativo={ligado(a.aceita_nao_se_aplica)} rotulo={`"não se aplica" em ${a.rotulo}`} pode={pode} estado={est('aceita')} aoConferir={conf('aceita')}
            aoPedir={() => void g.gravar(kc(a.id, 'aceita'), 'atributo', { id: a.id, versao: a.versao, aceita_nao_se_aplica: ligado(a.aceita_nao_se_aplica) ? 0 : 1 }, 'aceita_nao_se_aplica')} />
        </span>
      </div>
      {numerico && (
        <div className="at-dic-def__unidades">
          <p className="at-fraco">Unidades permitidas além da padrão ({a.unidade ?? 'sem unidade padrão'}):</p>
          <div className="at-dic-def__lista">
            {oferecidas.length === 0 ? <span className="at-fraco">Nenhuma outra unidade ativa.</span> : oferecidas.map((u) => (
              <label key={u.id} className="at-dic-def__unid">
                <input type="checkbox" disabled={!pode} checked={extras.includes(u.id)}
                  onChange={(e) => setExtras((l) => (e.target.checked ? [...l, u.id] : l.filter((x) => x !== u.id)).sort((x, y) => x - y))} /> {u.simbolo}
                <span className="at-fraco"> {u.nome}</span>
              </label>))}
          </div>
          {pode && (
            <span className="at-acoes">
              <button type="button" className="bl-botao bl-botao--primario" disabled={!mudouExtras || est('unidades').fase === 'salvando'}
                onClick={() => void g.gravar(kc(a.id, 'unidades'), 'atributo_unidades', { atributo_id: a.id, unidades: extras, unidades_antes: a.unidades_extras }, 'unidades')}>Salvar unidades permitidas</button>
              {mudouExtras && <button type="button" className="bl-botao" onClick={() => setExtras([...a.unidades_extras].sort((x, y) => x - y))}>Desfazer</button>}
              <IconeEstado estado={est('unidades')} aoConferir={conf('unidades')} />
              {est('unidades').mensagem && est('unidades').fase !== 'salvo' && <span className="at-cel__aviso">{est('unidades').mensagem}</span>}
            </span>)}
        </div>)}
    </BlocoUx2>
  );
}

function mesmoConjunto(a: readonly number[], b: readonly number[]) {
  const x = [...a].sort((p, q) => p - q), y = [...b].sort((p, q) => p - q);
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

// ── Opções (criar, renomear inline, reordenar por botões/teclado, desativar/reativar) ─────────────────────────────────────────
// UX-2: cada ação aqui GRAVA NA HORA (bloco "Opções · alterações salvas individualmente"). Renomear ou desativar uma opção em uso
// (ou de uso ainda não conferido) pede confirmação com o alcance; a confirmação mostra o MESMO corpo que será enviado e o
// Cancelar dela não envia nada. Cada gravação feita é informada ao editor (aoSalvo) para a saída do formulário não sugerir desfazê-la.
type Pendente = { acao: 'renomear'; o: OpcaoApi; corpo: CorpoRenomear; conf: Confirmacao } | { acao: 'desativar'; o: OpcaoApi; corpo: { id: number; ativo: false }; conf: Confirmacao };
function ListaOpcoes({ atributoId, opcoes, setOpcoes, pode, focarNova = false, aoSalvo }: {
  atributoId: number; opcoes: OpcaoApi[]; setOpcoes: (o: OpcaoApi[]) => void; pode: boolean; focarNova?: boolean; aoSalvo: (s: SalvoIndividual) => void;
}) {
  const { aviso } = useModulo();
  const [nova, setNova] = React.useState('');
  // UX-1: atributo recém-criado com opções → o foco vai direto para "Nova opção"
  const refNova = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (focarNova && refNova.current) { refNova.current.scrollIntoView({ block: 'center' }); refNova.current.focus(); } }, [focarNova]);
  const [ocupado, setOcupado] = React.useState<string | null>(null);
  const [renomeando, setRenomeando] = React.useState<RascunhoRenomear | null>(null);   // DSHOW-070: `original` fixado ao clicar Renomear
  const [pendente, setPendente] = React.useState<Pendente | null>(null);
  const lista = React.useRef<HTMLUListElement>(null);
  const focoDepois = React.useRef<{ id: number; acao: string } | null>(null);

  // Depois de uma ação, o foco volta ao mesmo botão da mesma opção (ou a outro botão dela, se aquele ficou desligado).
  React.useEffect(() => {
    const f = focoDepois.current; if (!f || !lista.current || ocupado) return;
    focoDepois.current = null;
    const alvo = lista.current.querySelector<HTMLButtonElement>(`[data-op="${f.id}"][data-acao="${f.acao}"]:not(:disabled)`)
      ?? lista.current.querySelector<HTMLButtonElement>(`[data-op="${f.id}"]:not(:disabled)`);
    alvo?.focus();
  });

  async function executar(chave: string, f: () => Promise<{ opcoes: OpcaoApi[] }>, ok: string, foco?: { id: number; acao: string }) {
    setOcupado(chave);
    try { const r = await f(); focoDepois.current = foco ?? null; setOpcoes(r.opcoes); aviso(ok); aoSalvo({ texto: ok.replace(/\.$/, '') }); return true; }
    catch (e) { aviso(mensagemErro(e), 'erro'); return false; }
    finally { setOcupado(null); }
  }
  const adicionar = async () => {
    const r = nova.trim(); if (!r) return;
    if (await executar('nova', () => enviar('opcao', { atributo_id: atributoId, rotulo: r }), `Opção "${r}" criada.`)) setNova('');
  };
  const mover = (i: number, d: -1 | 1) => {
    const j = i + d; if (j < 0 || j >= opcoes.length || ocupado) return;
    const ordem = opcoes.map((o) => o.id); [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
    void executar(`ordem${opcoes[i].id}`, () => enviar('opcao_reordenar', { atributo_id: atributoId, ordem, ordem_antes: opcoes.map((o) => o.id) }), 'Ordem das opções salva.', { id: opcoes[i].id, acao: d < 0 ? 'subir' : 'descer' });
  };
  /** Envia EXATAMENTE o corpo mostrado na confirmação. */
  const enviarRenomear = async (o: OpcaoApi, corpo: CorpoRenomear) => {
    const st = { conflito: false };
    const f = () => enviar<{ opcoes: OpcaoApi[] }>('opcao_renomear', corpo).catch((e: unknown) => { st.conflito = e instanceof ErroApi && e.conflito; throw e; });
    if (await executar(`ren${o.id}`, f, `Opção "${corpo.rotulo_atual}" renomeada para "${corpo.rotulo}".`, { id: o.id, acao: 'renomear' })) { setRenomeando(null); setPendente(null); return; }
    setPendente(null);
    if (!st.conflito) return;
    // DSHOW-070: 409 = alguém renomeou antes; a mensagem já foi mostrada — fecha o rascunho e relê as opções
    setRenomeando(null);
    try { setOpcoes((await obter<RespDetalhe>('atributo', { id: atributoId })).opcoes); } catch { /* a lista fica como estava; o aviso do 409 já orienta */ }
  };
  const pedirRenomear = (o: OpcaoApi) => {
    if (!renomeando) return;
    const p = precondicaoRenomear(renomeando);
    if (p.acao === 'nada') { setRenomeando(null); return; }
    const corpo: CorpoRenomear = { id: p.id, rotulo: p.rotulo, rotulo_atual: p.rotulo_atual };
    const conf = confirmacaoOpcao('renomear', usoOpcao(o), corpo);
    if (conf.precisa) setPendente({ acao: 'renomear', o, corpo, conf }); else void enviarRenomear(o, corpo);
  };
  const enviarAtiva = (o: OpcaoApi, ativo: boolean) => {
    void executar(`at${o.id}`, () => enviar('opcao_ativa', { id: o.id, ativo }), ativo ? `Opção "${o.rotulo}" reativada.` : `Opção "${o.rotulo}" desativada.`, { id: o.id, acao: 'ativa' })
      .then(() => setPendente(null));
  };
  const pedirDesativar = (o: OpcaoApi) => {
    const conf = confirmacaoOpcao('desativar', usoOpcao(o), { rotulo_atual: o.rotulo });
    if (conf.precisa) setPendente({ acao: 'desativar', o, corpo: { id: o.id, ativo: false }, conf }); else enviarAtiva(o, false);
  };

  return (
    <>
      {opcoes.length === 0 ? <p className="at-fraco">Nenhuma opção cadastrada.</p> : (
        <ul className="at-dic-opcoes" ref={lista} aria-label="Opções do atributo">
          {opcoes.map((o, i) => {
            const at = ligado(o.ativo);
            const editando = renomeando?.id === o.id;
            const uso = usoOpcao(o);
            const conf = pendente?.o.id === o.id ? pendente : null;
            return (
              <li key={o.id} className={`at-dic-opcao ${at ? '' : 'at-dic-opcao--inativa'}`}
                onKeyDown={(e) => { if (pode && e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); mover(i, e.key === 'ArrowUp' ? -1 : 1); } }}>
                <span className="at-dic-opcao__pos" aria-hidden>{i + 1}.</span>
                {editando && renomeando ? (
                  <input className="at-campo" data-esc-local aria-label={`Novo rótulo para ${o.rotulo}`} autoFocus maxLength={160} value={renomeando.texto} disabled={!!conf}
                    onChange={(e) => { const texto = e.target.value; setRenomeando((r) => (r ? { ...r, texto } : r)); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); pedirRenomear(o); } else if (e.key === 'Escape') { e.preventDefault(); setRenomeando(null); } }} />
                ) : (
                  <span className="at-dic-opcao__rotulo">{o.rotulo}{!at && <> <Etiqueta>Inativa</Etiqueta></>}
                    <span className="at-dic-auxiliar">{uso === null ? 'uso ainda não conferido' : `em ${n(uso)} produto${uso === 1 ? '' : 's'}`}</span>
                  </span>
                )}
                {pode && !conf && (
                  <span className="at-dic-opcao__acoes">
                    {editando ? (
                      <>
                        <Botao primario trabalhando={ocupado === `ren${o.id}`} aoClicar={() => pedirRenomear(o)}>Salvar este nome</Botao>
                        <Botao aoClicar={() => setRenomeando(null)}>Cancelar</Botao>
                      </>
                    ) : (
                      <>
                        <button type="button" className="bl-botao bl-botao--icone" data-op={o.id} data-acao="subir" aria-label={`Subir ${o.rotulo}`} title="Subir (Alt+↑) — grava na hora" disabled={i === 0 || !!ocupado} onClick={() => mover(i, -1)}>↑</button>
                        <button type="button" className="bl-botao bl-botao--icone" data-op={o.id} data-acao="descer" aria-label={`Descer ${o.rotulo}`} title="Descer (Alt+↓) — grava na hora" disabled={i === opcoes.length - 1 || !!ocupado} onClick={() => mover(i, 1)}>↓</button>
                        <button type="button" className="bl-botao" data-op={o.id} data-acao="renomear" disabled={!!ocupado} onClick={() => setRenomeando({ id: o.id, texto: o.rotulo, original: o.rotulo })}>Renomear</button>
                        <button type="button" className={`bl-botao ${at ? 'at-botao--perigo' : ''}`} data-op={o.id} data-acao="ativa" disabled={!!ocupado}
                          onClick={() => (at ? pedirDesativar(o) : enviarAtiva(o, true))}>
                          {at ? 'Desativar' : 'Reativar'}
                        </button>
                      </>
                    )}
                  </span>
                )}
                {conf && (
                  <div className="at-dic-caixa at-dic-caixa--aviso" role="alertdialog" aria-label={conf.conf.titulo} style={{ flexBasis: '100%' }}>
                    <p style={{ margin: '0 0 4px' }}><strong>{conf.conf.titulo}</strong></p>
                    <p style={{ margin: '0 0 6px' }}>{conf.conf.texto}</p>
                    <div className="at-acoes">
                      <Botao aoClicar={() => setPendente(null)} desligado={!!ocupado}>Cancelar (nada é enviado)</Botao>
                      <Botao perigo trabalhando={!!ocupado} aoClicar={() => (conf.acao === 'renomear' ? void enviarRenomear(conf.o, conf.corpo) : enviarAtiva(conf.o, conf.corpo.ativo))}>{conf.conf.botao}</Botao>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {pode && (
        <>
          <span className="at-dic-dica">Cada ação desta lista grava na hora e vale para todos os produtos que usam a opção — não depende do "Salvar" do formulário. Para mudar o significado (ex.: Azul → Preto), crie outra opção. Reordene com ↑ ↓ ou Alt+↑ / Alt+↓.</span>
          <div className="at-dic-nova-opcao">
            <input ref={refNova} className="at-campo" aria-label="Nova opção" placeholder="Nova opção" maxLength={160} value={nova} onChange={(e) => setNova(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void adicionar(); } }} />
            <Botao trabalhando={ocupado === 'nova'} desligado={!nova.trim()} aoClicar={() => void adicionar()}>Criar opção agora</Botao>
          </div>
        </>
      )}
    </>
  );
}


// ── Linha expandida: Opções (edição na linha) · Definição · Onde aparece · Histórico deste atributo ─────────────────────────────
function DetalheAtributo({ a, pode, unidades, g, focarNova, aoFechar }: { a: AtributoDicionario; pode: boolean; unidades: Unidade[]; g: Gravacoes; focarNova: boolean; aoFechar: () => void }) {
  const [det, setDet] = React.useState<RespDetalhe | null>(null);
  const [opcoes, setOpcoes] = React.useState<OpcaoApi[]>([]);
  const [erro, setErro] = React.useState<string | null>(null);
  const carregar = React.useCallback(() => {
    setErro(null);
    obter<RespDetalhe>('atributo', { id: a.id }).then((d) => { setDet(d); setOpcoes(d.opcoes); }).catch((e) => setErro(mensagemErro(e)));
  }, [a.id]);
  React.useEffect(() => { carregar(); }, [carregar, a.versao]);
  const comOpcoes = COM_OPCOES.includes(a.tipo);
  const hist = det ? linhasHistorico(det.auditoria ?? []) : [];
  const aoSalvoOpcao = React.useCallback(() => { /* cada ação das opções grava na hora; o histórico relê ao mudar a versão */ }, []);
  return (
    <DetalheLinhaUx2 titulo={`${a.rotulo} · ${a.id}`} aoFechar={aoFechar}>
      {comOpcoes && (
        <BlocoUx2 titulo="Opções · cada ação grava na hora">
          {erro ? <Erro mensagem={erro} aoTentar={carregar} /> : !det ? <Carregando rotulo="Carregando as opções" />
            : <ListaOpcoes atributoId={a.id} opcoes={opcoes} setOpcoes={setOpcoes} pode={pode} focarNova={focarNova} aoSalvo={aoSalvoOpcao} />}
        </BlocoUx2>
      )}
      <DefinicaoNaLinha a={a} pode={pode} unidades={unidades} g={g} />
      <BlocoUx2 titulo="Onde aparece">
        <ul>
          <li>Em {n(a.em_kits)} kit{a.em_kits === 1 ? '' : 's'}</li>
          <li>{n(Math.max(a.produtos_com_valor, det?.valores_preenchidos ?? 0))} produto{a.produtos_com_valor === 1 ? '' : 's'} com valor</li>
          <li>Tipo: {TIPO[a.tipo] ?? a.tipo} · código <code className="at-codigo">{a.codigo}</code></li>
        </ul>
      </BlocoUx2>
      <BlocoUx2 titulo="Histórico deste atributo">
        {erro ? <p className="at-alerta" role="alert">Não foi possível carregar o histórico: {erro}</p>
          : !det ? <Carregando rotulo="Carregando o histórico" />
          : !pode ? <p className="at-fraco">O histórico é visível só para quem administra o dicionário.</p>
          : hist.length === 0 ? <p className="at-fraco">Nenhuma alteração registrada para este atributo.</p>
          : (
            <>
              <p className="at-dic-dica">Últimas {hist.length} alterações do atributo (até 20).</p>
              <ol className="at-ux2-historico at-hist">
                {hist.map((h) => {
                  // um evento por linha: "data · autor — campo: antes → depois" (nome do campo legível); o técnico fica recolhido e em cinza
                  // visível: só "data · autor — campo: antes → depois"; ID, versão, autoridade, motivo e o resto vão para "detalhes"
                  const campo = (m: string) => m.slice(0, m.indexOf(':'));
                  const visiveis = h.mudancas.filter((m) => !CAMPOS_TECNICOS.has(campo(m)));
                  const tecnicos = h.mudancas.filter((m) => CAMPOS_TECNICOS.has(campo(m)));
                  const legivel = h.acao === 'criar' ? [`criou o atributo${(() => { const r = visiveis.find((m) => campo(m) === 'rotulo'); return r ? ` "${r.slice(r.indexOf('→') + 1).trim()}"` : ''; })()}`]
                    : visiveis.map((m) => { const c = campo(m); const [antes, depois] = m.slice(m.indexOf(':') + 1).split(' → ').map((x) => valorHist(c, x.trim(), unidades));
                      return `${CAMPOS[c] ?? ROTULO_ACAO_CAMPO[c] ?? c}: ${antes} → ${depois}`; });
                  return (
                    <li key={h.id} className="at-hist__linha">
                      <span className="at-hist__quando">{dataHora(h.quando)}</span> · <span className="at-hist__quem">{h.quem}</span>
                      {' — '}<span className="at-hist__o-que">{legivel.length ? legivel.join('; ') : ACAO_HISTORICO[h.acao] ?? h.acao}</span>
                      <details className="at-hist__tec"><summary>detalhes</summary>
                        evento #{h.id} · ação <code>{h.acao}</code>{tecnicos.length ? <> · {tecnicos.join('; ')}</> : null}{h.motivo ? <> · motivo: {h.motivo}</> : null}
                        {visiveis.length ? <> · campos <code>{visiveis.map(campo).join(', ')}</code></> : null}
                      </details>
                    </li>);
                })}
              </ol>
            </>
          )}
      </BlocoUx2>
    </DetalheLinhaUx2>
  );
}
