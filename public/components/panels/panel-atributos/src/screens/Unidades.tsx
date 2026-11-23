// panel-atributos/src/screens/Unidades.tsx — tela "Unidades" (missão 18/11 §11.7; UX-2 da DIREITA; UNIDADES V2 de 19/11).
// UNIDADES V2 (Jhony, 19/11 — /srv/dshow-docs/briefings/BRIEFING-UNIDADES-V2.md + MOCKUP-UNIDADES-V2.png; substitui a parte de Unidades
// do UX-2b): datagrid compacto e contínuo (sem linhas de grupo na apresentação inicial; "Agrupar" = Sem agrupamento | Por tipo de medida),
// barra de ferramentas numa linha só (Nova unidade → Busca → contadores → Agrupar → Colunas), colunas separadas (Símbolo, Nome, Tipo de
// medida, Base, Fator, Atributos, Valores gravados, Situação, Ações), linhas de 32 px, 13 px/400 sem negrito, situação em pílula, ações
// por ícone (lápis = editar NA LINHA; energia = desativar com confirmação NA LINHA mostrando o uso; nunca excluir).
// Edição na célula com o recibo do "foi salvo" (como o UX-2b): o nome grava direto (Enter/sair salva, Esc cancela); tipo de medida e
// fator mudam a CONVERSÃO → confirmação na linha com "antes → depois" e o uso. O símbolo é a identidade e não muda.
// "Tipo de medida" é só o RÓTULO da grandeza; nada muda no banco. Base = referência já cadastrada na grandeza (nunca deduzida); ausente = "—".
// Mantido do UX-2: equivalência pelo GRUPO inteiro antes da busca; o servidor compara a fotografia do que foi aberto (DSHOW-071).
import React from 'react';
import { obter, ErroApi } from '../lib/api';
import type { Unidade } from '../lib/tipos';
import { decimal, numeroParaApi } from '../lib/formatar';
import { Carregando, Vazio, Erro, CabecalhoTravado, Botao } from '../ui/Comuns';
import { fotografiaUnidade } from '../lib/integridade';
import { TabelaDados, type ColunaTabela } from '../ui/TabelaDados';
import type { DefGrupo, Ordenacao } from '../lib/ordenar';
import { corpoEdicaoUnidade, equivalencias, filtrarUnidades, mudaInterpretacao, mudancasUnidade, usoUnidade } from '../ui/admin-ux2';
import { AntesDepois } from '../ui/AdminUx2';
import { BarraConfirmacao, CelulaTexto, IconeEstado, useGravacoes, type EstadoCelula } from '../ui/CelulaEditavel';
import { MenuColunas, MenuEscolha } from '../ui/MenuBarra';
import '../ui/celula.css';
import '../styles/dicionario.css';

type UnidadeUso = Unidade & { atributos: number; valores: number; itens_kit?: number; configuracoes_produto?: number };
interface RespUnidades { unidades: UnidadeUso[]; pode_administrar: boolean }

const SEM_TIPO = 'Sem tipo de medida';
const CAMPOS: Record<string, string> = { simbolo: 'Símbolo', nome: 'Nome', grandeza: 'Tipo de medida', fator_base: 'Fator' };
const ligado = (v: unknown) => v === true || Number(v) === 1;
const n = (x: number) => x.toLocaleString('pt-BR');
const ok = (f: { fase: string }) => f.fase === 'salvo' || f.fase === 'sem_mudanca';
const kc = (id: number | string, campo: string) => `${id}:${campo}`;
const pt = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });
function mensagemErro(e: unknown): string {
  if (e instanceof ErroApi) { const c = e.campos.map((k) => CAMPOS[k] ?? k); return c.length ? `${e.message} (${c.join(', ')})` : e.message; }
  return 'Falha de comunicação com o servidor.';
}
const fatorValido = (v: string) => { const t = v.trim(); if (!t) return null; const a = numeroParaApi(t); return /^\d+(\.\d+)?$/.test(a) && /[1-9]/.test(a) ? null : 'Fator: número maior que zero (use vírgula para decimais).'; };

type Agrupar = 'nenhum' | 'tipo';
/** Situação: a tela antiga (UX-2) abria em "Ativas e inativas" — mesmo padrão aqui (parecer do Jhony, 19/11: o filtro sumiu na V2 = regressão). */
type Situacao = 'todas' | 'ativas' | 'inativas';
const SITUACOES = [{ valor: 'todas', rotulo: 'Todas' }, { valor: 'ativas', rotulo: 'Ativas' }, { valor: 'inativas', rotulo: 'Inativas' }] as const;
/** Colunas que a pessoa pode ocultar (Símbolo e Ações ficam sempre). */
const OPCIONAIS: { chave: string; titulo: string }[] = [
  { chave: 'nome', titulo: 'Nome' }, { chave: 'grandeza', titulo: 'Tipo de medida' }, { chave: 'base', titulo: 'Base' }, { chave: 'fator', titulo: 'Fator' },
  { chave: 'atributos', titulo: 'Atributos' }, { chave: 'valores', titulo: 'Valores gravados' }, { chave: 'situacao', titulo: 'Situação' },
];
const PREF = 'at-unidades-v2-colunas';
const lerOcultas = (): string[] => { try { const v = JSON.parse(localStorage.getItem(PREF) ?? '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; } catch { return []; } };
const ORDEM_PADRAO: Ordenacao = { chave: 'grandeza', direcao: 'asc' };   // por Tipo de medida; o símbolo é o critério secundário (pré-ordem estável)
type Pedido = { id: number; campo: 'grandeza' | 'fator' | 'ativo'; valor: string; erro: string | null };

export function Unidades() {
  const [dados, setDados] = React.useState<RespUnidades | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [busca, setBusca] = React.useState('');
  const [ordenacao, setOrdenacao] = React.useState<Ordenacao>(ORDEM_PADRAO);
  const [agrupar, setAgrupar] = React.useState<Agrupar>('nenhum');
  const [ocultas, setOcultas] = React.useState<string[]>(lerOcultas);
  const [situacao, setSituacao] = React.useState<Situacao>('todas');
  const [pedido, setPedido] = React.useState<Pedido | null>(null);
  const [novaLinha, setNovaLinha] = React.useState(false);
  const moldura = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { try { localStorage.setItem(PREF, JSON.stringify(ocultas)); } catch { /* preferência só deste navegador */ } }, [ocultas]);

  const carregar = React.useCallback(async (sinal?: AbortSignal) => {
    setErro(null);
    try { const r = await obter<RespUnidades>('unidades', {}, sinal); setDados(r); return r; }
    catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) setErro(mensagemErro(e)); return null; }
  }, []);
  React.useEffect(() => { const c = new AbortController(); void carregar(c.signal); return () => c.abort(); }, [carregar]);
  const recarregar = React.useCallback(() => carregar(), [carregar]);
  const g = useGravacoes(recarregar);

  const todas = React.useMemo(() => dados?.unidades ?? [], [dados]);
  const equiv = React.useMemo(() => equivalencias(todas), [todas]);   // pelo GRUPO inteiro, ANTES da busca
  const tipos = React.useMemo(() => [...new Set(todas.map((u) => u.grandeza).filter((x): x is string => !!x))].sort(pt.compare), [todas]);
  // pré-ordem por símbolo: a ordenação da TabelaDados é estável → símbolo vira o critério secundário de qualquer coluna
  const filtradas = React.useMemo(() => [...filtrarUnidades(todas, busca)].filter((u) => situacao === 'todas' || (situacao === 'ativas') === ligado(u.ativo))
    .sort((a, b) => pt.compare(a.simbolo, b.simbolo)), [todas, busca, situacao]);
  const tiposVisiveis = React.useMemo(() => new Set(filtradas.map((u) => u.grandeza ?? SEM_TIPO)).size, [filtradas]);
  const grupos: DefGrupo[] = React.useMemo(() => [...tipos.map((x) => ({ chave: x, titulo: x })), { chave: SEM_TIPO, titulo: SEM_TIPO }], [tipos]);

  const pode = !!dados?.pode_administrar;
  const gravarEdicao = React.useCallback((u: UnidadeUso, campo: 'nome' | 'grandeza' | 'fator', valor: string) => {
    const fatorInicial = u.fator_base ? decimal(u.fator_base) : '';
    const form = {
      nome: campo === 'nome' ? valor : u.nome, grandeza: campo === 'grandeza' ? valor : u.grandeza ?? '',
      fatorApi: campo === 'fator' ? (valor.trim() ? numeroParaApi(valor) : '') : u.fator_base ?? '', fatorMudou: campo === 'fator' && valor.trim() !== fatorInicial,
    };
    return g.gravar(kc(u.id, campo), 'unidade', corpoEdicaoUnidade(u, form, fotografiaUnidade(u)), campo === 'fator' ? 'fator_base' : campo);
  }, [g]);
  /** Lápis = editar na linha: abre o Nome dessa linha (Tab segue para Tipo de medida e Fator, que também editam na célula). */
  const editarLinha = (u: UnidadeUso) => { moldura.current?.querySelector<HTMLButtonElement>(`tr[data-chave="${u.id}"] .at-und-nome .at-cel__valor`)?.click(); };

  const todasColunas = React.useMemo<ColunaTabela<UnidadeUso>[]>(() => {
    const est = (u: UnidadeUso, c: string) => g.estadoDe(kc(u.id, c));
    const conf = (u: UnidadeUso, c: string) => () => void g.conferir(kc(u.id, c));
    const emPedido = (u: UnidadeUso, c: Pedido['campo']) => (pedido && pedido.id === u.id && pedido.campo === c ? pedido.valor : null);
    const base = (u: UnidadeUso) => equiv.get(u.id)?.referencia?.simbolo ?? null;
    return [
      { chave: 'simbolo', titulo: 'Símbolo', tipo: 'texto', classe: 'at-und-simbolo', render: (u) => <span className="at-und-txt" title={u.simbolo}>{u.simbolo}</span> },
      { chave: 'nome', titulo: 'Nome', tipo: 'texto', classe: 'at-und-nome',
        render: (u) => <CelulaTexto valor={u.nome} rotulo={`Nome de ${u.simbolo}`} pode={pode} validar={(v) => (v.trim() ? null : 'Informe o nome.')}
          aoSalvar={async (v) => ok(await gravarEdicao(u, 'nome', v))} estado={est(u, 'nome')} aoConferir={conf(u, 'nome')} /> },
      { chave: 'grandeza', titulo: 'Tipo de medida', tipo: 'texto', valor: (u) => u.grandeza ?? '', classe: 'at-und-tipo',
        render: (u) => <CelulaTexto valor={emPedido(u, 'grandeza') ?? u.grandeza} rotulo={`Tipo de medida de ${u.simbolo}`} pode={pode}
          aoSalvar={async (v) => { setPedido({ id: u.id, campo: 'grandeza', valor: v.trim(), erro: null }); return true; }} estado={est(u, 'grandeza')} aoConferir={conf(u, 'grandeza')} /> },
      { chave: 'base', titulo: 'Base', tipo: 'texto', valor: (u) => base(u) ?? '', render: (u) => base(u) ?? <span className="at-und-vazio">—</span> },
      { chave: 'fator', titulo: 'Fator', tipo: 'numero', valor: (u) => u.fator_base,
        render: (u) => <CelulaTexto valor={emPedido(u, 'fator') ?? (u.fator_base === null ? null : decimal(u.fator_base))} rotulo={`Fator de ${u.simbolo}`} pode={pode}
          validar={fatorValido} aoSalvar={async (v) => { setPedido({ id: u.id, campo: 'fator', valor: v.trim(), erro: null }); return true; }} estado={est(u, 'fator')} aoConferir={conf(u, 'fator')} classe="at-cel--direita" /> },
      { chave: 'atributos', titulo: 'Atributos', tipo: 'numero', valor: (u) => Number(u.atributos ?? 0), render: (u) => n(Number(u.atributos ?? 0)) },
      { chave: 'valores', titulo: 'Valores gravados', tipo: 'numero', valor: (u) => Number(u.valores ?? 0), render: (u) => n(Number(u.valores ?? 0)) },
      { chave: 'situacao', titulo: 'Situação', tipo: 'texto', valor: (u) => (ligado(u.ativo) ? 'Ativa' : 'Inativa'),
        render: (u) => <span className={`at-und-pilula ${ligado(u.ativo) ? 'at-und-pilula--ativa' : ''}`}>{ligado(u.ativo) ? 'Ativa' : 'Inativa'}</span> },
      { chave: 'acoes', titulo: 'Ações', tipo: 'texto', ordenavel: false, cabecalho: <span className="at-und-th-acoes">Ações</span>, classe: 'at-und-acoes-cel',
        render: (u) => (
          <span className="at-und-acoes">
            {pode && <button type="button" className="at-icone-acao at-icone-acao--editar" aria-label="Editar unidade" title="Editar unidade" onClick={(e) => { e.stopPropagation(); editarLinha(u); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
            </button>}
            {pode && <button type="button" className={`at-icone-acao at-icone-acao--energia ${ligado(u.ativo) ? '' : 'at-icone-acao--desligada'}`}
              aria-label={ligado(u.ativo) ? 'Desativar unidade' : 'Reativar unidade'} title={ligado(u.ativo) ? 'Desativar unidade' : 'Reativar unidade'}
              onClick={(e) => { e.stopPropagation(); setPedido({ id: u.id, campo: 'ativo', valor: ligado(u.ativo) ? '0' : '1', erro: null }); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M12 3v9" /><path d="M6.4 6.6a8 8 0 1 0 11.2 0" /></svg>
            </button>}
            <IconeEstado estado={est(u, 'ativo')} aoConferir={conf(u, 'ativo')} />
          </span>) },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, pode, pedido, equiv, gravarEdicao]);
  const colunas = todasColunas.filter((c) => !ocultas.includes(c.chave));

  if (erro && !dados) return <Erro mensagem={erro} aoTentar={() => void carregar()} />;
  if (!dados) return <Carregando rotulo="Carregando as unidades" />;

  return (
    <div className="at-und-v2">
      <CabecalhoTravado>
        <div className="at-und-barra-ferr" role="search">
          {pode && <button type="button" className="at-und-nova-btn" disabled={novaLinha} onClick={() => setNovaLinha(true)}><span aria-hidden>+</span> Nova unidade</button>}
          <label className="at-und-busca">
            <span className="bl-so-leitor">Buscar símbolo, nome ou tipo</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input type="search" placeholder="Buscar símbolo, nome ou tipo" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
          <span className="at-und-contagem" aria-live="polite">{n(filtradas.length)} de {n(todas.length)} unidades · {n(tiposVisiveis)} tipo{tiposVisiveis === 1 ? '' : 's'} de medida
            {!pode && ' · só consulta'}{erro && <span className="at-alerta" role="alert"> · {erro}</span>}</span>
          <span className="at-und-direita">
            <MenuEscolha rotulo="Situação" valor={situacao} opcoes={SITUACOES} aoEscolher={setSituacao} />
            <MenuEscolha rotulo="Agrupar" valor={agrupar} mostrarValor={false} aoEscolher={setAgrupar}
              opcoes={[{ valor: 'nenhum', rotulo: 'Sem agrupamento' }, { valor: 'tipo', rotulo: 'Por tipo de medida' }]}
              icone={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M12 3 3 8l9 5 9-5-9-5z" /><path d="m3 13 9 5 9-5" /></svg>} />
            <MenuColunas opcionais={OPCIONAIS} ocultas={ocultas} aoMudar={setOcultas} />
          </span>
        </div>
      </CabecalhoTravado>

      {novaLinha && <NovaUnidade tipos={tipos} gravar={g.gravar} estado={g.estadoDe('novo:unidade')} aoConferir={() => void g.conferir('novo:unidade')}
        aoFechar={() => { g.limpar('novo:unidade'); setNovaLinha(false); }} />}

      {filtradas.length === 0 ? (
        <Vazio titulo={busca ? 'Nenhuma unidade encontrada' : 'Nenhuma unidade cadastrada'} acao={busca ? <Botao aoClicar={() => setBusca('')}>Limpar busca</Botao> : undefined}>
          {busca ? 'Nenhuma unidade corresponde à busca.' : 'Cadastre a primeira unidade de medida.'}
        </Vazio>
      ) : (
        <div className="at-dic-moldura" ref={moldura}>
          <TabelaDados rolagem="container" className="at-und-grid2" legenda="Unidades de medida" colunas={colunas} linhas={filtradas} chaveLinha={(u) => u.id}
            ordenacao={ordenacao} aoOrdenar={setOrdenacao} congelarOrdem={pedido !== null}
            grupos={agrupar === 'tipo' ? grupos : undefined} grupoDaLinha={agrupar === 'tipo' ? (u) => u.grandeza ?? SEM_TIPO : undefined}
            expandida={(u) => pedido?.id === u.id}
            renderExpansao={(u) => pedido?.id === u.id ? (
              <BarraUnidade u={u} p={pedido} estado={g.estadoDe(kc(u.id, pedido.campo))} aoMudar={(x) => setPedido((p) => (p && p.id === u.id ? { ...p, ...x } : p))}
                aoFechar={() => setPedido(null)}
                confirmar={(p) => (p.campo === 'ativo' ? g.gravar(kc(u.id, 'ativo'), 'unidade_ativa', { id: u.id, ativo: p.valor === '1' }) : gravarEdicao(u, p.campo, p.valor))} />) : null}
            classeLinha={(u) => [ligado(u.ativo) ? '' : 'at-linha--inativa', pedido?.id === u.id ? 'at-linha--pedido' : ''].join(' ').trim() || undefined} />
        </div>
      )}
    </div>
  );
}

/** Barra amarela NA LINHA: tipo de medida/fator (antes → depois + uso) ou desativar/reativar (uso). */
function BarraUnidade({ u, p, estado, aoMudar, aoFechar, confirmar }: {
  u: UnidadeUso; p: Pedido; estado: EstadoCelula; aoMudar: (x: Partial<Pedido>) => void; aoFechar: () => void; confirmar: (p: Pedido) => Promise<EstadoCelula>;
}) {
  const uso = usoUnidade(u);
  let texto: string; let extra: React.ReactNode = null;
  if (p.campo === 'ativo') {
    texto = p.valor === '1' ? `Reativar ${u.simbolo} (${u.nome})? Volta a ser oferecida nas escolhas de unidade.`
      : `Desativar ${u.simbolo} (${u.nome})? Deixa de ser oferecida em novas escolhas; nada é apagado nem convertido. Uso hoje: ${uso.linhas.join(' · ')}.`;
  } else {
    const fatorInicial = u.fator_base ? decimal(u.fator_base) : '';
    const corpo = corpoEdicaoUnidade(u, { nome: u.nome, grandeza: p.campo === 'grandeza' ? p.valor : u.grandeza ?? '',
      fatorApi: p.campo === 'fator' ? (p.valor ? numeroParaApi(p.valor) : '') : u.fator_base ?? '', fatorMudou: p.campo === 'fator' && p.valor !== fatorInicial }, null);
    const mud = mudancasUnidade(u, corpo).map((m) => (m.campo === 'Grandeza' ? { ...m, campo: 'Tipo de medida' } : m));
    texto = mud.length === 0 ? 'Nada muda.' : mudaInterpretacao(mudancasUnidade(u, corpo))
      ? `Isto muda como as medidas de ${u.simbolo} são convertidas daqui em diante; os valores gravados não são convertidos. Uso hoje: ${uso.linhas.join(' · ')}.`
      : `Confirmar a mudança em ${u.simbolo}?`;
    extra = mud.length > 0 ? <AntesDepois mudancas={mud} /> : null;
  }
  const ir = async () => { const st = await confirmar(p); if (ok(st)) aoFechar(); else aoMudar({ erro: st.mensagem }); };
  return (
    <div className="at-und-barra">
      {extra}
      <BarraConfirmacao texto={texto} erro={p.erro} trabalhando={estado.fase === 'salvando'}
        rotuloConfirmar={p.campo === 'ativo' ? (p.valor === '1' ? 'Reativar' : 'Desativar') : 'Confirmar'} aoConfirmar={() => void ir()} aoCancelar={aoFechar} />
    </div>
  );
}

/** Linha nova no topo: símbolo (não muda depois), nome, tipo de medida e fator. Só grava ao confirmar. */
function NovaUnidade({ tipos, gravar, estado, aoConferir, aoFechar }: {
  tipos: string[]; gravar: ReturnType<typeof useGravacoes>['gravar']; estado: EstadoCelula; aoConferir: () => void; aoFechar: () => void;
}) {
  const [f, setF] = React.useState({ simbolo: '', nome: '', grandeza: '', fator: '' });
  const [erroLocal, setErroLocal] = React.useState<string | null>(null);
  const [aviso, setAviso] = React.useState<string | null>(null);
  const idLista = React.useId();
  const confirmar = async () => {
    if (!f.simbolo.trim()) { setErroLocal('Informe o símbolo.'); return; }
    if (!f.nome.trim()) { setErroLocal('Informe o nome.'); return; }
    const ef = fatorValido(f.fator); if (ef) { setErroLocal(ef); return; }
    const corpo: Record<string, unknown> = { simbolo: f.simbolo.trim(), nome: f.nome.trim(), grandeza: f.grandeza.trim() || null };
    if (f.fator.trim()) corpo.fator_base = numeroParaApi(f.fator);
    const st = await gravar('novo:unidade', 'unidade', corpo, 'simbolo');
    if (!ok(st)) return;
    if ((st.dados as { ja_existia?: boolean } | undefined)?.ja_existia) { setAviso(`A unidade "${f.simbolo.trim()}" já existia com esse símbolo, nome e tipo de medida; o cadastro existente foi mantido.`); return; }
    aoFechar();
  };
  return (
    <div className="at-dic-nova at-und-nova" role="group" aria-label="Nova unidade" data-at-nova-linha
      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); aoFechar(); } else if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') { e.preventDefault(); void confirmar(); } }}>
      <input className="at-cel__campo" aria-label="Símbolo da nova unidade" placeholder="Símbolo * (não muda depois)" autoFocus maxLength={20} value={f.simbolo} onChange={(e) => { setF({ ...f, simbolo: e.target.value }); setErroLocal(null); }} />
      <input className="at-cel__campo" aria-label="Nome da nova unidade" placeholder="Nome *" maxLength={80} value={f.nome} onChange={(e) => { setF({ ...f, nome: e.target.value }); setErroLocal(null); }} />
      <input className="at-cel__campo" aria-label="Tipo de medida da nova unidade" placeholder="Tipo de medida (ex.: comprimento)" maxLength={40} list={idLista} value={f.grandeza} onChange={(e) => setF({ ...f, grandeza: e.target.value })} />
      <datalist id={idLista}>{tipos.map((x) => <option key={x} value={x} />)}</datalist>
      <input className="at-cel__campo" aria-label="Fator da nova unidade" placeholder="Fator (vazio = não converte)" inputMode="decimal" value={f.fator} onChange={(e) => { setF({ ...f, fator: e.target.value }); setErroLocal(null); }} />
      <span />
      <span className="at-dic-nova__acoes">
        <button type="button" className="bl-botao bl-botao--primario" disabled={estado.fase === 'salvando'} aria-busy={estado.fase === 'salvando'} onClick={() => void confirmar()}>Confirmar</button>
        <button type="button" className="bl-botao" disabled={estado.fase === 'salvando'} onClick={aoFechar}>{aviso ? 'Fechar' : 'Cancelar'}</button>
        <IconeEstado estado={estado} aoConferir={aoConferir} />
      </span>
      {(erroLocal || aviso || (estado.fase !== 'ocioso' && estado.fase !== 'salvando' && estado.fase !== 'salvo' && estado.mensagem)) &&
        <span className={`at-cel__aviso ${erroLocal || estado.fase === 'recusada' ? 'at-cel__aviso--erro' : ''}`} role={erroLocal ? 'alert' : 'status'}>{erroLocal ?? aviso ?? estado.mensagem}</span>}
      <span className="at-dic-dica">Fator: valor × fator = valor na unidade base do tipo de medida (ex.: m = 1; cm = 0,01; mm = 0,001).</span>
    </div>
  );
}
