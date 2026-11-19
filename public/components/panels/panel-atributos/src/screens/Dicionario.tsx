// panel-atributos/src/screens/Dicionario.tsx — tela "Atributos" (dicionário, missão 18/11 §11.6).
// Tabela dos atributos (TabelaDados: todos os filtrados, ordenados antes de exibir; ordem padrão Rótulo ▲, mantida ao mudar
// busca/filtros) com filtros no cliente; título e descrição da tela ficam no cabeçalho do módulo; editor em diálogo largo (criar/editar, unidades permitidas, opções).
// Regras do servidor respeitadas: o código é GERADO na criação e nunca muda; tipo travado com valores (409 TYPE_CHANGE_BLOCKED);
// trocar unidade com valores exige motivo (422 UNIT_CHANGE_REQUIRES_REASON → a tela pede o motivo e reenvia). Sem interface otimista.
import React from 'react';
import { obter, enviar, ErroApi } from '../lib/api';
import type { AtributoDicionario, Unidade, TipoAtributo } from '../lib/tipos';
import { IMPORTANCIA, IMPORTANCIAS, TIPO } from '../lib/rotulos';
import { decimal, numeroParaApi } from '../lib/formatar';
import { Botao, CabecalhoTravado, Dialogo, Etiqueta, Carregando, Vazio, Erro } from '../ui/Comuns';
import { useModulo } from '../app/contexto';
import { TabelaDados, type ColunaTabela } from '../ui/TabelaDados';
import { comparadorPorLista, type Ordenacao } from '../lib/ordenar';
import { precondicaoRenomear, type RascunhoRenomear } from '../lib/integridade';
import '../styles/dicionario.css';

interface RespDicionario { atributos: AtributoDicionario[]; unidades: Unidade[]; pode_administrar: boolean }
interface OpcaoApi { id: number; rotulo: string; posicao: number; ativo: number | boolean }
interface RespDetalhe { atributo: { id: number; versao: number; tipo: TipoAtributo }; opcoes: OpcaoApi[]; valores_preenchidos: number }

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

// Colunas da tabela (ordem lógica da importância: Obrigatório → … → Opcional → Sem importância; sem padrão = vazio, no fim).
const ORDENACAO_PADRAO: Ordenacao = { chave: 'rotulo', direcao: 'asc' };
const COLUNAS: ColunaTabela<AtributoDicionario>[] = [
  { chave: 'rotulo', titulo: 'Rótulo', tipo: 'texto', classe: 'at-dic-rotulo', render: (a) => <>{a.rotulo}{a.descricao && <small>{a.descricao}</small>}</> },
  { chave: 'codigo', titulo: 'Código', tipo: 'texto', render: (a) => <span className="at-dic-codigo">{a.codigo}</span> },
  { chave: 'tipo', titulo: 'Tipo', tipo: 'texto', classe: 'at-td--curta', valor: (a) => TIPO[a.tipo] ?? a.tipo },
  { chave: 'unidade', titulo: 'Unidade padrão', tipo: 'texto',
    render: (a) => <>{a.unidade ?? <span className="at-dic-zero">—</span>}{a.unidades_extras.length > 0 && <span className="at-dic-auxiliar">+{a.unidades_extras.length} permitida{a.unidades_extras.length > 1 ? 's' : ''}</span>}</> },
  { chave: 'grupo_atributos', titulo: 'Grupo', tipo: 'texto', classe: 'at-td--palavras', render: (a) => a.grupo_atributos ?? <span className="at-dic-zero">—</span> },
  { chave: 'importancia_padrao', titulo: 'Importância padrão', tipo: 'texto', comparador: comparadorPorLista(IMPORTANCIAS),
    render: (a) => (a.importancia_padrao ? IMPORTANCIA[a.importancia_padrao] : <span className="at-dic-zero">—</span>) },
  { chave: 'em_kits', titulo: 'Em kits', tipo: 'numero', render: (a) => <span className={a.em_kits ? '' : 'at-dic-zero'}>{n(a.em_kits)}</span> },
  { chave: 'produtos_com_valor', titulo: 'Produtos com valor', tipo: 'numero', render: (a) => <span className={a.produtos_com_valor ? '' : 'at-dic-zero'}>{n(a.produtos_com_valor)}</span> },
  { chave: 'situacao', titulo: 'Situação', tipo: 'texto', classe: 'at-td--curta', valor: (a) => (ligado(a.ativo) ? 'Ativo' : 'Inativo'),
    render: (a) => (ligado(a.ativo) ? <Etiqueta tom="sucesso">Ativo</Etiqueta> : <Etiqueta>Inativo</Etiqueta>) },
];

type EstadoEditor = null | { modo: 'novo' } | { modo: 'editar'; id: number; recemCriado?: boolean };

export function Dicionario() {
  const [dados, setDados] = React.useState<RespDicionario | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [filtros, setFiltros] = React.useState<Filtros>(FILTROS_PADRAO);
  const [ordenacao, setOrdenacao] = React.useState<Ordenacao>(ORDENACAO_PADRAO);   // aqui (não na tabela): sobrevive à lista vazia por filtro
  const [editor, setEditor] = React.useState<EstadoEditor>(null);
  const busca = React.useDeferredValue(filtros.busca);

  const carregar = React.useCallback(async (sinal?: AbortSignal) => {
    setErro(null);
    try { setDados(await obter<RespDicionario>('dicionario', {}, sinal)); }
    catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) setErro(mensagemErro(e)); }
  }, []);
  React.useEffect(() => { const c = new AbortController(); void carregar(c.signal); return () => c.abort(); }, [carregar]);

  const fecharEditor = React.useCallback(() => setEditor(null), []);
  const recarregar = React.useCallback(() => carregar(), [carregar]);
  const criado = React.useCallback((id: number, comOpcoes: boolean) => setEditor(comOpcoes ? { modo: 'editar', id, recemCriado: true } : null), []);
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

  if (erro && !dados) return <Erro mensagem={erro} aoTentar={() => void carregar()} />;
  if (!dados) return <Carregando rotulo="Carregando o dicionário" />;

  const pode = dados.pode_administrar;
  const filtrando = JSON.stringify(filtros) !== JSON.stringify(FILTROS_PADRAO);
  const atual = editor?.modo === 'editar' ? dados.atributos.find((a) => a.id === editor.id) ?? null : null;
  const abrir = (id: number) => setEditor({ modo: 'editar', id });

  return (
    <div>
      <CabecalhoTravado>{/* CABEÇALHO TRAVADO (exceção do Jhony, 19/11): só envolve; nada de lógica */}
      <div className="at-dic-filtros" role="search">
        <label className="at-busca">
          <span className="bl-so-leitor">Buscar por rótulo ou código</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input type="search" placeholder="Buscar por rótulo ou código" value={filtros.busca} onChange={(e) => mudar({ busca: e.target.value })} />
        </label>
        <label className="at-dic-filtro">Tipo
          <select className="at-select" value={filtros.tipo} onChange={(e) => mudar({ tipo: e.target.value })}>
            <option value="">Todos</option>
            {TIPOS.map((t) => <option key={t} value={t}>{TIPO[t]}</option>)}
          </select>
        </label>
        <label className="at-dic-filtro">Grupo
          <select className="at-select" value={filtros.grupo} onChange={(e) => mudar({ grupo: e.target.value })}>
            <option value="">Todos</option>
            {grupos.lista.map((g) => <option key={g} value={g}>{g}</option>)}
            {grupos.semGrupo && <option value={SEM_GRUPO}>Sem grupo</option>}
          </select>
        </label>
        <label className="at-dic-filtro">Importância
          <select className="at-select" value={filtros.importancia} onChange={(e) => mudar({ importancia: e.target.value })}>
            <option value="">Todas</option>
            {IMPORTANCIAS.map((i) => <option key={i} value={i}>{IMPORTANCIA[i]}</option>)}
            <option value={SEM_IMPORTANCIA}>Sem padrão</option>
          </select>
        </label>
        <label className="at-dic-filtro">Uso
          <select className="at-select" value={filtros.uso} onChange={(e) => mudar({ uso: e.target.value as Filtros['uso'] })}>
            <option value="">Todos</option>
            <option value="usados">Usados (em kit ou com valor)</option>
            <option value="nao_usados">Não usados</option>
          </select>
        </label>
        <label className="at-dic-filtro">Situação
          <select className="at-select" value={filtros.ativo} onChange={(e) => mudar({ ativo: e.target.value as Filtros['ativo'] })}>
            <option value="ativos">Só ativos</option>
            <option value="inativos">Só inativos</option>
            <option value="todos">Ativos e inativos</option>
          </select>
        </label>
        {filtrando && <Botao aoClicar={() => mudar(FILTROS_PADRAO)}>Limpar filtros</Botao>}
        {pode && <div className="at-acoes" style={{ marginLeft: 'auto' }}><Botao primario aoClicar={() => setEditor({ modo: 'novo' })}>Novo atributo</Botao></div>}
      </div>

      <div className="at-dic-contagem" aria-live="polite">
        <span>{n(filtrados.length)} de {n(dados.atributos.length)} atributos{!pode && <span className="at-fraco"> · seu nível permite apenas consultar</span>}</span>
        {erro && <span className="at-alerta" role="alert">{erro}</span>}
      </div>
      </CabecalhoTravado>

      {filtrados.length === 0 ? (
        <Vazio titulo="Nenhum atributo encontrado" acao={filtrando ? <Botao aoClicar={() => mudar(FILTROS_PADRAO)}>Limpar filtros</Botao> : undefined}>
          {filtrando ? 'Nenhum atributo atende aos filtros escolhidos.' : 'O dicionário ainda não tem atributos.'}
        </Vazio>
      ) : (
        <div className="at-dic-moldura">
          <TabelaDados rolagem="container" className="at-dic-tabela" legenda="Atributos do dicionário" colunas={COLUNAS} linhas={filtrados} chaveLinha={(a) => a.id}
            ordenacao={ordenacao} aoOrdenar={setOrdenacao} aoClicarLinha={(a) => abrir(a.id)} rotuloLinha={(a) => `Abrir ${a.rotulo}`}
            classeLinha={(a) => (ligado(a.ativo) ? undefined : 'at-linha--inativa')} />
        </div>
      )}

      {editor && (editor.modo === 'novo' || atual) && (
        <EditorAtributo key={editor.modo === 'novo' ? 'novo' : `e${editor.id}`} atributo={atual} recemCriado={editor.modo === 'editar' && !!editor.recemCriado}
          unidades={dados.unidades} pode={pode} aoFechar={fecharEditor} aoRecarregar={recarregar} aoCriado={criado} />
      )}
    </div>
  );
}

// ── Editor ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
interface Form {
  rotulo: string; tipo: TipoAtributo; unidade_id: string; casas: string; minimo: string; maximo: string; descricao: string;
  importancia_padrao: string; aceita: boolean; extras: number[];
}
function formDe(a: AtributoDicionario | null): Form {
  if (!a) return { rotulo: '', tipo: 'texto', unidade_id: '', casas: '', minimo: '', maximo: '', descricao: '', importancia_padrao: '', aceita: true, extras: [] };
  return {
    rotulo: a.rotulo, tipo: a.tipo, unidade_id: a.unidade_id === null ? '' : String(a.unidade_id), casas: a.casas === null ? '' : String(a.casas),
    minimo: a.minimo === null ? '' : decimal(a.minimo), maximo: a.maximo === null ? '' : decimal(a.maximo), descricao: a.descricao ?? '',
    importancia_padrao: a.importancia_padrao ?? '', aceita: ligado(a.aceita_nao_se_aplica), extras: [...a.unidades_extras].sort((x, y) => x - y),
  };
}
function mesmoConjunto(a: number[], b: number[]) {
  const x = [...a].sort((p, q) => p - q), y = [...b].sort((p, q) => p - q);
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

function EditorAtributo({ atributo, recemCriado, unidades, pode, aoFechar, aoRecarregar, aoCriado }: {
  atributo: AtributoDicionario | null; recemCriado: boolean; unidades: Unidade[]; pode: boolean; aoFechar: () => void;
  aoRecarregar: () => Promise<void>; aoCriado: (id: number, comOpcoes: boolean) => void;
}) {
  const { aviso } = useModulo();
  const inicial = React.useMemo(() => formDe(atributo), [atributo]);
  const [form, setForm] = React.useState<Form>(inicial);
  const [detalhe, setDetalhe] = React.useState<RespDetalhe | null>(null);
  const [erroDetalhe, setErroDetalhe] = React.useState<string | null>(null);
  const [opcoes, setOpcoes] = React.useState<OpcaoApi[]>([]);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<{ texto: string; campos: string[]; conflito: boolean } | null>(null);
  const [pedidoMotivo, setPedidoMotivo] = React.useState<string | null>(null);
  const [motivo, setMotivo] = React.useState('');
  const [confirmarAtivo, setConfirmarAtivo] = React.useState(false);
  const [motivoAtivo, setMotivoAtivo] = React.useState('');

  // Depois de salvar, o dicionário é relido e a versão muda: o formulário volta a refletir o que está gravado.
  React.useEffect(() => { setForm(inicial); setPedidoMotivo(null); setMotivo(''); setErro(null); }, [inicial]);

  const idAtual = atributo?.id ?? null;
  const carregarDetalhe = React.useCallback(async () => {
    if (idAtual === null) return;
    setErroDetalhe(null);
    try { const d = await obter<RespDetalhe>('atributo', { id: idAtual }); setDetalhe(d); setOpcoes(d.opcoes); }
    catch (e) { setErroDetalhe(mensagemErro(e)); }
  }, [idAtual]);
  React.useEffect(() => { void carregarDetalhe(); }, [carregarDetalhe]);

  const ativo = atributo ? ligado(atributo.ativo) : true;
  const valores = Math.max(atributo?.produtos_com_valor ?? 0, detalhe?.valores_preenchidos ?? 0);
  const tipoTravado = atributo !== null && valores > 0;
  const numerico = NUMERICOS.includes(form.tipo);
  const somenteLeitura = !pode;
  const set = (p: Partial<Form>) => { setForm((f) => ({ ...f, ...p })); setErro(null); };
  const invalido = (c: string) => (erro?.campos.includes(c) ? true : undefined);

  // Unidades oferecidas como "permitidas": ativas (e as já marcadas, mesmo inativas), menos a padrão; agrupadas por grandeza.
  const gruposUnidades = React.useMemo(() => {
    const m = new Map<string, Unidade[]>();
    for (const u of unidades) {
      if (String(u.id) === form.unidade_id) continue;
      if (!ligado(u.ativo) && !form.extras.includes(u.id)) continue;
      const g = u.grandeza ?? 'Sem grandeza';
      m.set(g, [...(m.get(g) ?? []), u]);
    }
    return [...m.entries()].sort(([a], [b]) => (a === 'Sem grandeza' ? 1 : b === 'Sem grandeza' ? -1 : a.localeCompare(b, 'pt-BR')));
  }, [unidades, form.unidade_id, form.extras]);
  const unidadePadrao = unidades.find((u) => String(u.id) === form.unidade_id) ?? null;
  const unidadesSelect = unidades.filter((u) => ligado(u.ativo) || String(u.id) === inicial.unidade_id);

  function validar(): string | null {
    if (!form.rotulo.trim()) return 'Informe o rótulo.';
    if (numerico) {
      if (form.casas.trim() && !/^[0-6]$/.test(form.casas.trim())) return 'Casas decimais: um número inteiro de 0 a 6.';
      for (const [k, v] of [['Mínimo', form.minimo], ['Máximo', form.maximo]] as const) if (v.trim() && !decimalValido(numeroParaApi(v))) return `${k}: número inválido (use vírgula para decimais).`;
    }
    return null;
  }

  async function salvar(comMotivo?: string) {
    const falha = validar();
    if (falha) { setErro({ texto: falha, campos: [], conflito: false }); return; }
    const num = (s: string) => (s.trim() ? numeroParaApi(s) : null);
    setSalvando(true); setErro(null);
    try {
      if (atributo === null) {
        const corpo: Record<string, unknown> = { rotulo: form.rotulo.trim(), tipo: form.tipo, aceita_nao_se_aplica: form.aceita ? 1 : 0 };
        if (form.descricao.trim()) corpo.descricao = form.descricao.trim();
        if (form.importancia_padrao) corpo.importancia_padrao = form.importancia_padrao;
        if (numerico) {
          if (form.unidade_id) corpo.unidade_id = Number(form.unidade_id);
          if (form.casas.trim()) corpo.casas = Number(form.casas);
          if (num(form.minimo) !== null) corpo.minimo = num(form.minimo);
          if (num(form.maximo) !== null) corpo.maximo = num(form.maximo);
        }
        const r = await enviar<{ atributo: { id: number } }>('atributo', corpo);
        const extras = form.extras.filter((u) => String(u) !== form.unidade_id);
        if (numerico && extras.length) {
          try { await enviar('atributo_unidades', { atributo_id: r.atributo.id, unidades: extras, unidades_antes: [] }); }
          catch (e) { aviso(`Atributo criado, mas as unidades permitidas não foram gravadas: ${mensagemErro(e)}`, 'erro'); }
        }
        aviso(`Atributo "${form.rotulo.trim()}" criado.`);
        await aoRecarregar();
        aoCriado(r.atributo.id, COM_OPCOES.includes(form.tipo));
        return;
      }
      const corpo: Record<string, unknown> = { id: atributo.id, versao: atributo.versao };
      if (form.rotulo.trim() !== inicial.rotulo) corpo.rotulo = form.rotulo.trim();
      if (!tipoTravado && form.tipo !== inicial.tipo) corpo.tipo = form.tipo;
      if (form.descricao.trim() !== inicial.descricao.trim()) corpo.descricao = form.descricao.trim() || null;
      if (form.importancia_padrao !== inicial.importancia_padrao) corpo.importancia_padrao = form.importancia_padrao || null;
      if (form.aceita !== inicial.aceita) corpo.aceita_nao_se_aplica = form.aceita ? 1 : 0;
      if (numerico) {
        if (form.unidade_id !== inicial.unidade_id) corpo.unidade_id = form.unidade_id ? Number(form.unidade_id) : null;
        if (form.casas.trim() !== inicial.casas) corpo.casas = form.casas.trim() ? Number(form.casas) : null;
        if (form.minimo.trim() !== inicial.minimo) corpo.minimo = num(form.minimo);
        if (form.maximo.trim() !== inicial.maximo) corpo.maximo = num(form.maximo);
      }
      const extrasAlvo = form.extras.filter((u) => String(u) !== form.unidade_id);
      const mudouCampos = Object.keys(corpo).length > 2;
      const mudouExtras = numerico && !mesmoConjunto(extrasAlvo, inicial.extras);
      if (!mudouCampos && !mudouExtras) { aviso('Nada mudou.', 'info'); return; }
      if (mudouCampos) {
        if (comMotivo) corpo.motivo = comMotivo;
        try { await enviar('atributo', corpo); }
        catch (e) {
          if (e instanceof ErroApi && e.codigo === 'UNIT_CHANGE_REQUIRES_REASON') { setPedidoMotivo(e.message); return; }
          throw e;
        }
      }
      if (mudouExtras) {
        try { await enviar('atributo_unidades', { atributo_id: atributo.id, unidades: extrasAlvo, unidades_antes: inicial.extras }); }   // DSHOW-045: unidades_antes = a lista que esta tela viu
        catch (e) {
          if (!mudouCampos) throw e;
          aviso(`Atributo salvo, mas as unidades permitidas não foram gravadas: ${mensagemErro(e)}`, 'erro');
          await aoRecarregar(); aoFechar(); return;
        }
      }
      aviso('Atributo salvo.');
      await aoRecarregar();
      aoFechar();
    } catch (e) {
      setErro({ texto: mensagemErro(e), campos: e instanceof ErroApi ? e.campos : [], conflito: e instanceof ErroApi && e.codigo === 'CONFLICT' });
    } finally { setSalvando(false); }
  }

  async function alternarAtivo() {
    if (!atributo) return;
    setSalvando(true); setErro(null);
    try {
      const corpo: Record<string, unknown> = { id: atributo.id, versao: atributo.versao, ativo: ativo ? 0 : 1 };
      if (motivoAtivo.trim()) corpo.motivo = motivoAtivo.trim();
      await enviar('atributo_ativo', corpo);
      aviso(ativo ? 'Atributo desativado.' : 'Atributo reativado.');
      await aoRecarregar();
      aoFechar();
    } catch (e) {
      setErro({ texto: mensagemErro(e), campos: [], conflito: e instanceof ErroApi && e.codigo === 'CONFLICT' });
      setConfirmarAtivo(false);
    } finally { setSalvando(false); }
  }

  const titulo = atributo === null ? 'Novo atributo' : `${somenteLeitura ? 'Atributo' : 'Editar atributo'}: ${atributo.rotulo}`;
  const rodape = confirmarAtivo ? (
    <div className="at-dic-rodape">
      <span className="at-dic-rodape__esq">{ativo ? 'Confirmar a desativação?' : 'Confirmar a reativação?'}</span>
      <Botao aoClicar={() => setConfirmarAtivo(false)} desligado={salvando}>Voltar</Botao>
      <Botao perigo={ativo} primario={!ativo} trabalhando={salvando} aoClicar={() => void alternarAtivo()}>{ativo ? 'Desativar' : 'Reativar'}</Botao>
    </div>
  ) : (
    <div className="at-dic-rodape">
      <span className="at-dic-rodape__esq">
        {atributo !== null && pode && <Botao perigo={ativo} desligado={salvando} aoClicar={() => { setConfirmarAtivo(true); setMotivoAtivo(''); }}>{ativo ? 'Desativar atributo' : 'Reativar atributo'}</Botao>}
      </span>
      <Botao aoClicar={aoFechar} desligado={salvando}>{somenteLeitura ? 'Fechar' : 'Cancelar'}</Botao>
      {pode && !pedidoMotivo && <Botao primario trabalhando={salvando} aoClicar={() => void salvar()}>{atributo === null ? (COM_OPCOES.includes(form.tipo) ? 'Criar e cadastrar opções' : 'Criar atributo') : 'Salvar'}</Botao>}
      {pode && pedidoMotivo && <Botao primario trabalhando={salvando} desligado={motivo.trim().length < 5} aoClicar={() => void salvar(motivo.trim())}>Salvar com motivo</Botao>}
    </div>
  );

  return (
    <Dialogo titulo={titulo} aberto aoFechar={aoFechar} largura={860} rodape={rodape}>
      <div className="at-dic-editor">
        {recemCriado && <div className="at-dic-caixa at-dic-caixa--info">Atributo criado. Agora cadastre as opções na lista abaixo.</div>}
        {erro && (
          <div className="at-dic-caixa at-dic-caixa--erro" role="alert">
            <p>{erro.texto}</p>
            {erro.conflito && <Botao aoClicar={() => { void aoRecarregar(); void carregarDetalhe(); setErro(null); }}>Recarregar o atributo</Botao>}
          </div>
        )}
        {confirmarAtivo && atributo && (
          <div className="at-dic-caixa at-dic-caixa--aviso" role="alert">
            {ativo
              ? <p>Desativar <strong>{atributo.rotulo}</strong>? Ele deixa de ser oferecido para novos kits e preenchimentos. Os valores já gravados ({n(valores)} produto{valores === 1 ? '' : 's'}) e os vínculos em {n(atributo.em_kits)} kit{atributo.em_kits === 1 ? '' : 's'} não são apagados.</p>
              : <p>Reativar <strong>{atributo.rotulo}</strong>? Ele volta a ser oferecido nos kits e no preenchimento.</p>}
            <label className="at-rotulo-campo">Motivo (opcional, fica na auditoria)
              <input className="at-campo" value={motivoAtivo} maxLength={255} onChange={(e) => setMotivoAtivo(e.target.value)} />
            </label>
          </div>
        )}
        {pedidoMotivo && (
          <div className="at-dic-caixa at-dic-caixa--aviso" role="alert">
            <p>{pedidoMotivo}</p>
            <label className="at-rotulo-campo">Motivo da troca de unidade (mínimo 5 caracteres)
              <textarea className="at-campo" rows={2} value={motivo} autoFocus maxLength={255} onChange={(e) => setMotivo(e.target.value)} />
            </label>
          </div>
        )}

        <section className="at-dic-secao" aria-labelledby="dic-sec-ident">
          <h3 id="dic-sec-ident">Identificação</h3>
          <div className="at-dic-form">
            <label className="at-rotulo-campo at-dic-form--largo">Nome do atributo
              <input className="at-campo" value={form.rotulo} maxLength={128} readOnly={somenteLeitura} aria-invalid={invalido('rotulo')} required onChange={(e) => set({ rotulo: e.target.value })} />
            </label>
            <div className="at-rotulo-campo">Código
              {atributo === null
                ? <span className="at-dic-dica">Código gerado automaticamente</span>
                : <span><code className="at-codigo">{atributo.codigo}</code> <span className="at-dic-dica">gerado automaticamente; nunca muda</span></span>}
            </div>
            <label className="at-rotulo-campo">Como será preenchido?
              <select className="at-campo" value={form.tipo} disabled={somenteLeitura || tipoTravado} aria-invalid={invalido('tipo')} aria-describedby={tipoTravado ? 'dic-tipo-trava' : undefined}
                onChange={(e) => set({ tipo: e.target.value as TipoAtributo })}>
                {TIPOS.map((t) => <option key={t} value={t}>{TIPO[t]}</option>)}
              </select>
              {tipoTravado && <span className="at-dic-dica" id="dic-tipo-trava">Travado: {n(valores)} produto{valores === 1 ? ' tem' : 's têm'} valor. Mudar o tipo exige migração revisada.</span>}
            </label>
            <label className="at-rotulo-campo">Importância padrão
              <select className="at-campo" value={form.importancia_padrao} disabled={somenteLeitura} aria-invalid={invalido('importancia_padrao')} onChange={(e) => set({ importancia_padrao: e.target.value })}>
                <option value="">Sem padrão</option>
                {IMPORTANCIAS.map((i) => <option key={i} value={i}>{IMPORTANCIA[i]}</option>)}
              </select>
            </label>
            <label className="at-rotulo-campo at-dic-form--largo">Descrição
              <textarea className="at-campo" rows={2} maxLength={500} value={form.descricao} readOnly={somenteLeitura} aria-invalid={invalido('descricao')} onChange={(e) => set({ descricao: e.target.value })} />
            </label>
            <label className="at-check at-dic-form--largo">
              <input type="checkbox" checked={form.aceita} disabled={somenteLeitura} onChange={(e) => set({ aceita: e.target.checked })} />
              Aceita "não se aplica" (o produto pode marcar que esta característica não existe nele)
            </label>
            {atributo !== null && (
              <p className="at-dic-dica at-dic-form--largo">
                Grupo: {atributo.grupo_atributos ?? '—'} · em {n(atributo.em_kits)} kit{atributo.em_kits === 1 ? '' : 's'} · {n(valores)} produto{valores === 1 ? '' : 's'} com valor · {ativo ? 'ativo' : 'inativo'}
              </p>
            )}
          </div>
        </section>

        {numerico && (
          <section className="at-dic-secao" aria-labelledby="dic-sec-num">
            <h3 id="dic-sec-num">Número e unidade</h3>
            <div className="at-dic-form">
              <label className="at-rotulo-campo">Unidade padrão
                <select className="at-campo" value={form.unidade_id} disabled={somenteLeitura} aria-invalid={invalido('unidade_id')} onChange={(e) => set({ unidade_id: e.target.value })}>
                  <option value="">Sem unidade</option>
                  {unidadesSelect.map((u) => <option key={u.id} value={u.id}>{rotuloUnidade(u)}</option>)}
                </select>
                {atributo !== null && valores > 0 && form.unidade_id !== inicial.unidade_id && <span className="at-dic-dica">Atenção: trocar a unidade não converte os {n(valores)} valores já gravados; será pedido um motivo.</span>}
              </label>
              <label className="at-rotulo-campo">Casas decimais
                <input className="at-campo" inputMode="numeric" value={form.casas} readOnly={somenteLeitura} placeholder="livre" aria-invalid={invalido('casas')} onChange={(e) => set({ casas: e.target.value })} />
                <span className="at-dic-dica">De 0 a 6; vazio = livre.</span>
              </label>
              <label className="at-rotulo-campo">Mínimo
                <input className="at-campo" inputMode="decimal" value={form.minimo} readOnly={somenteLeitura} placeholder="sem mínimo" aria-invalid={invalido('minimo')} onChange={(e) => set({ minimo: e.target.value })} />
              </label>
              <label className="at-rotulo-campo">Máximo
                <input className="at-campo" inputMode="decimal" value={form.maximo} readOnly={somenteLeitura} placeholder="sem máximo" aria-invalid={invalido('maximo')} onChange={(e) => set({ maximo: e.target.value })} />
              </label>
            </div>
            <div className="at-dic-secao">
              <span className="at-rotulo-campo">Unidades permitidas além da padrão</span>
              <span className="at-dic-dica">
                {unidadePadrao?.grandeza
                  ? `Unidades da mesma grandeza (${unidadePadrao.grandeza}) já são aceitas pela regra da grandeza. Marque aqui as exceções que também podem ser usadas.`
                  : 'Marque as unidades que também podem ser usadas ao preencher este atributo.'}
              </span>
              {gruposUnidades.length === 0 ? <span className="at-fraco">Nenhuma outra unidade ativa.</span> : (
                <div className="at-dic-unidades">
                  {gruposUnidades.map(([g, lista]) => (
                    <fieldset key={g}>
                      <legend>{g}</legend>
                      {lista.map((u) => (
                        <label key={u.id} className="at-check">
                          <input type="checkbox" disabled={somenteLeitura} checked={form.extras.includes(u.id)}
                            onChange={(e) => set({ extras: e.target.checked ? [...form.extras, u.id] : form.extras.filter((x) => x !== u.id) })} />
                          <span>{u.simbolo} — {u.nome}{ligado(u.ativo) ? '' : ' (inativa)'}</span>
                        </label>
                      ))}
                    </fieldset>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {COM_OPCOES.includes(form.tipo) && (
          <section className="at-dic-secao" aria-labelledby="dic-sec-op">
            <h3 id="dic-sec-op">Opções</h3>
            {atributo === null ? <p className="at-dic-dica">Crie o atributo para cadastrar as opções.</p>
              : !COM_OPCOES.includes(atributo.tipo) ? <p className="at-dic-dica">Salve o atributo como "{TIPO[form.tipo]}" para cadastrar as opções.</p>
              : erroDetalhe ? <Erro mensagem={erroDetalhe} aoTentar={() => void carregarDetalhe()} />
              : !detalhe ? <Carregando rotulo="Carregando as opções" />
              : <ListaOpcoes atributoId={atributo.id} opcoes={opcoes} setOpcoes={setOpcoes} pode={pode} focarNova={recemCriado} />}
          </section>
        )}
      </div>
    </Dialogo>
  );
}

// ── Opções (criar, renomear inline, reordenar por botões/teclado, desativar/reativar) ─────────────────────────────────────────
function ListaOpcoes({ atributoId, opcoes, setOpcoes, pode, focarNova = false }: { atributoId: number; opcoes: OpcaoApi[]; setOpcoes: (o: OpcaoApi[]) => void; pode: boolean; focarNova?: boolean }) {
  const { aviso } = useModulo();
  const [nova, setNova] = React.useState('');
  // UX-1: atributo recém-criado com opções → o foco vai direto para "Nova opção"
  const refNova = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (focarNova && refNova.current) { refNova.current.scrollIntoView({ block: 'center' }); refNova.current.focus(); } }, [focarNova]);
  const [ocupado, setOcupado] = React.useState<string | null>(null);
  const [renomeando, setRenomeando] = React.useState<RascunhoRenomear | null>(null);   // DSHOW-070: `original` fixado ao clicar Renomear
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
    try { const r = await f(); focoDepois.current = foco ?? null; setOpcoes(r.opcoes); aviso(ok); return true; }
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
    void executar(`ordem${opcoes[i].id}`, () => enviar('opcao_reordenar', { atributo_id: atributoId, ordem, ordem_antes: opcoes.map((o) => o.id) }), 'Ordem salva.', { id: opcoes[i].id, acao: d < 0 ? 'subir' : 'descer' });
  };
  const renomear = async (o: OpcaoApi) => {
    if (!renomeando) return;
    const p = precondicaoRenomear(renomeando);
    if (p.acao === 'nada') { setRenomeando(null); return; }
    const st = { conflito: false };
    const enviarRenomear = () => enviar<{ opcoes: OpcaoApi[] }>('opcao_renomear', { id: p.id, rotulo: p.rotulo, rotulo_atual: p.rotulo_atual })
      .catch((e: unknown) => { st.conflito = e instanceof ErroApi && e.conflito; throw e; });
    if (await executar(`ren${o.id}`, enviarRenomear, 'Opção renomeada (vale para todos os produtos).', { id: o.id, acao: 'renomear' })) { setRenomeando(null); return; }
    if (!st.conflito) return;
    // DSHOW-070: 409 = alguém renomeou antes; a mensagem já foi mostrada — fecha o rascunho e relê as opções
    setRenomeando(null);
    try { setOpcoes((await obter<RespDetalhe>('atributo', { id: atributoId })).opcoes); } catch { /* a lista fica como estava; o aviso do 409 já orienta */ }
  };

  return (
    <>
      {opcoes.length === 0 ? <p className="at-fraco">Nenhuma opção cadastrada.</p> : (
        <ul className="at-dic-opcoes" ref={lista} aria-label="Opções do atributo">
          {opcoes.map((o, i) => {
            const at = ligado(o.ativo);
            const editando = renomeando?.id === o.id;
            return (
              <li key={o.id} className={`at-dic-opcao ${at ? '' : 'at-dic-opcao--inativa'}`}
                onKeyDown={(e) => { if (pode && e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); mover(i, e.key === 'ArrowUp' ? -1 : 1); } }}>
                <span className="at-dic-opcao__pos" aria-hidden>{i + 1}.</span>
                {editando && renomeando ? (
                  <input className="at-campo" data-esc-local aria-label={`Novo rótulo para ${o.rotulo}`} autoFocus maxLength={160} value={renomeando.texto}
                    onChange={(e) => { const texto = e.target.value; setRenomeando((r) => (r ? { ...r, texto } : r)); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void renomear(o); } else if (e.key === 'Escape') { e.preventDefault(); setRenomeando(null); } }} />
                ) : (
                  <span className="at-dic-opcao__rotulo">{o.rotulo}{!at && <> <Etiqueta>Inativa</Etiqueta></>}</span>
                )}
                {pode && (
                  <span className="at-dic-opcao__acoes">
                    {editando ? (
                      <>
                        <Botao primario trabalhando={ocupado === `ren${o.id}`} aoClicar={() => void renomear(o)}>Salvar</Botao>
                        <Botao aoClicar={() => setRenomeando(null)}>Cancelar</Botao>
                      </>
                    ) : (
                      <>
                        <button type="button" className="bl-botao bl-botao--icone" data-op={o.id} data-acao="subir" aria-label={`Subir ${o.rotulo}`} title="Subir (Alt+↑)" disabled={i === 0 || !!ocupado} onClick={() => mover(i, -1)}>↑</button>
                        <button type="button" className="bl-botao bl-botao--icone" data-op={o.id} data-acao="descer" aria-label={`Descer ${o.rotulo}`} title="Descer (Alt+↓)" disabled={i === opcoes.length - 1 || !!ocupado} onClick={() => mover(i, 1)}>↓</button>
                        <button type="button" className="bl-botao" data-op={o.id} data-acao="renomear" disabled={!!ocupado} onClick={() => setRenomeando({ id: o.id, texto: o.rotulo, original: o.rotulo })}>Renomear</button>
                        <button type="button" className={`bl-botao ${at ? 'at-botao--perigo' : ''}`} data-op={o.id} data-acao="ativa" disabled={!!ocupado}
                          onClick={() => void executar(`at${o.id}`, () => enviar('opcao_ativa', { id: o.id, ativo: !at }), at ? 'Opção desativada.' : 'Opção reativada.', { id: o.id, acao: 'ativa' })}>
                          {at ? 'Desativar' : 'Reativar'}
                        </button>
                      </>
                    )}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {pode && (
        <>
          <span className="at-dic-dica">Renomear vale para todos os produtos que usam a opção. Reordene com os botões ↑ ↓ ou Alt+↑ / Alt+↓.</span>
          <div className="at-dic-nova-opcao">
            <input ref={refNova} className="at-campo" aria-label="Nova opção" placeholder="Nova opção" maxLength={160} value={nova} onChange={(e) => setNova(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void adicionar(); } }} />
            <Botao trabalhando={ocupado === 'nova'} desligado={!nova.trim()} aoClicar={() => void adicionar()}>Adicionar opção</Botao>
          </div>
        </>
      )}
    </>
  );
}
