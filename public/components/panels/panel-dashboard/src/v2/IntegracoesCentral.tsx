// IntegracoesCentral.tsx — INT-001, Central de Integrações (Fase 2) · ROXO (CIMA), 26/11 noite. Referência: LOTE7/DSHOW-INT-001 (ChatGPT; só
// contrato + protótipo, nada aplicado direto). Contrato v2 proposto ao VINHO (INT-001-PLANO.md). Carregada sob demanda (AG Grid no chunk dela).
// Layout (contrato espacial): DSWorkspaceTop (título + ← Geral · busca + "pedem atenção" + conferido) → faixa KPI de 56 px → lista em AG Grid
// (tema DSHOW, altura pelo conteúdo: ~12 linhas, sem rolagem interna) → painel lateral de 480 px. Desconhecido = "—" com o motivo; nunca segredo.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Plug, Search, X } from 'lucide-react';
import { ClientSideRowModelApiModule, ModuleRegistry } from 'ag-grid-community';
import { DSWorkspaceTop } from '@shared/des/DSWorkspaceTop';
import { DSKpiCardV2 } from '@shared/des/DSKpiCardV2';
import { criarGrade, type ColDef, type GridApi, type ICellRendererParams } from '@shared/ag-grid/grade';
import { AvisoDesatualizado, EstadoVazio } from '@shared/components/Primitivos';
import '@shared/styles/tokens.css';
import { fmtDiaHora, fmtHora, fmtN, fmtQuando, type CategoriaInt, type EstadoIntegracaoV2, type EstadoPrincipalInt, type IntegracaoV2, type IntegracoesV2 } from './servico';
import './integracoes-central.css';
ModuleRegistry.registerModules([ClientSideRowModelApiModule]);

export const ESTADO_V2: Record<EstadoIntegracaoV2, [string, 'ok' | 'aviso' | 'erro' | 'neutro']> = {
  ok: ['Em dia', 'ok'], atrasado: ['Atrasada', 'aviso'], parcial: ['Parcial', 'aviso'], com_problema: ['Com problema', 'erro'],
  aguardando: ['Aguardando conexão', 'neutro'], sem_acesso: ['Sem acesso', 'neutro'], nao_integrado: ['Não integrada', 'neutro'], desconhecido: ['Desconhecido', 'neutro'],
};
// INT-UX-001 (Manager Visual, 27/11): UM estado principal por integração, pela precedência do SERVIDOR (P124 GeralV2Integracoes::classificar);
// a MESMA classificação alimenta tabela, KPIs e "Pedem atenção". Sem os campos novos (serviço antigo), a regra espelhada abaixo — nunca em_dia sem prova.
export const PRECEDENCIA: EstadoPrincipalInt[] = ['credencial_expirada', 'com_falha', 'atrasada', 'parcial', 'desconhecida', 'aguardando_conexao', 'nao_integrada', 'em_dia'];
const CATEGORIA: Record<EstadoPrincipalInt, CategoriaInt> = { credencial_expirada: 'com_falha', com_falha: 'com_falha', atrasada: 'atencao', parcial: 'atencao',
  desconhecida: 'atencao', aguardando_conexao: 'nao_conectada', nao_integrada: 'nao_conectada', em_dia: 'em_dia' };
export const ESTADO_INT: Record<EstadoPrincipalInt, [string, 'ok' | 'aviso' | 'erro' | 'neutro']> = {
  credencial_expirada: ['Credencial expirada', 'erro'], com_falha: ['Com falha', 'erro'], atrasada: ['Atrasada', 'aviso'], parcial: ['Parcial', 'aviso'],
  desconhecida: ['Desconhecida', 'aviso'], aguardando_conexao: ['Aguardando conexão', 'neutro'], nao_integrada: ['Não integrada', 'neutro'], em_dia: ['Em dia', 'ok'] };
const DO_V2: Partial<Record<EstadoIntegracaoV2, EstadoPrincipalInt>> = { com_problema: 'com_falha', atrasado: 'atrasada', parcial: 'parcial', aguardando: 'aguardando_conexao', nao_integrado: 'nao_integrada' };
export function classe(x: IntegracaoV2): { principal: EstadoPrincipalInt; categoria: CategoriaInt; gravidade: number } {
  const principal: EstadoPrincipalInt = x.estado_principal && x.estado_principal in CATEGORIA ? x.estado_principal
    : x.estado === 'ok' ? (x.ultimo_sucesso ? 'em_dia' : 'desconhecida') : DO_V2[x.estado] ?? 'desconhecida';
  return { principal, categoria: CATEGORIA[principal], gravidade: PRECEDENCIA.indexOf(principal) + 1 };
}
/** "Pedem atenção" = Com falha + Atenção (INT-UX-001 §4); não conectadas NÃO são incidente */
const pedeAtencao = (x: IntegracaoV2) => { const c = classe(x).categoria; return c === 'com_falha' || c === 'atencao'; };
/** a DSHOW não usa mais o Outlook (Jhony, 27/11): fora da lista mesmo que o serviço ainda o mande */
export const FORA_DA_LISTA = new Set(['outlook']);
const GMAIL: IntegracaoV2 = { id: 'gmail', nome: 'Gmail', recurso: 'E-mail', estado: 'nao_integrado', ultima_tentativa: null, ultimo_sucesso: null,
  cobertas: null, esperadas: null, erro: null, proximo_passo: 'Integração com o Gmail em preparação.', acao: null };
/** a URL da ação vem do serviço: só https: ou caminho/rota relativa do Dash (nunca javascript:, data: …) — defesa sugerida pelo VERDE (P88) */
export const urlSegura = (u: string | null | undefined): string | null => {
  if (!u) return null; const t = u.trim();
  if (/^(\/(?!\/)|#\/?|\?)/.test(t)) return t;                      // relativa do próprio Dash ("/api/…", "#/panel-…", "?…"); "//host" não
  try { return new URL(t).protocol === 'https:' ? t : null; } catch { return null; }
};
/** INT-UX-001 §7: "Hoje, 21:37"; sem registro = "Nunca sincronizada" (ainda não conectada) ou "Não informado" (a origem não comprova) */
const quando = (iso: string | null, x?: IntegracaoV2) => (iso ? fmtDiaHora(iso) : x && classe(x).categoria === 'nao_conectada' ? 'Nunca sincronizada' : 'Não informado');
/** "Estados consultados hoje, às 21:50." — a hora da CONSULTA ao painel, não o sucesso das integrações */
export const consultados = (iso: string) => { const t = fmtDiaHora(iso); const [d, h] = t.split(', ');
  return `Estados consultados ${d === 'Hoje' ? 'hoje' : d === 'Ontem' ? 'ontem' : `em ${d}`}, às ${h}.`; };
/** código do erro da conta → texto curto (o serviço manda só o código; "erro:…"/"ultima_tentativa_falhou:…" como no cartão do Asaas) */
const textoErro = (c: string | null) => (c === null ? null : c.startsWith('ultima_tentativa_falhou') ? 'a última tentativa falhou' : c.startsWith('erro') ? 'a sincronização falhou' : c.replace(/[_:]+/g, ' ').trim());
const cobertura = (x: IntegracaoV2) => (x.cobertas === null || x.esperadas === null ? '—' : `${fmtN(x.cobertas)} de ${fmtN(x.esperadas)}`);

function celEstado(p: ICellRendererParams<IntegracaoV2>) {
  const [rot, tom] = p.data ? ESTADO_INT[classe(p.data).principal] : ['—', 'neutro'];
  const s = document.createElement('span'); s.className = `ic-pilula ic-pilula--${tom}`; s.textContent = rot; return s;
}
/** Integração: nome + a dependência ("via Bling"), sem inferir cobertura (INT-UX-AC05) */
function celNome(p: ICellRendererParams<IntegracaoV2>) {
  const f = document.createDocumentFragment(); f.append(p.data?.nome ?? '—');
  if (p.data?.dependencia) { const d = document.createElement('span'); d.className = 'ic-dep'; d.textContent = ` · via ${nomeDep(p.data.dependencia)}`; f.append(d); }
  return f;
}
const nomeDep = (d: string) => (d === 'bling' ? 'Bling' : d);

function Detalhe({ x, aoFechar }: { x: IntegracaoV2; aoFechar: () => void }) {
  const t = useRef<HTMLHeadingElement>(null);
  useEffect(() => { t.current?.focus(); const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar(); }; window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc); }, [x.id, aoFechar]);
  const k = classe(x); const [rot, tom] = ESTADO_INT[k.principal];
  const outros = (x.estados_detalhe ?? []).filter((e) => e in ESTADO_INT).map((e) => ESTADO_INT[e][0]);
  const [topo] = useState(() => Math.max(0, ...[...document.querySelectorAll('.dsd-shell__region--header, .dsd-shell__region--ticker')]
    .map((e) => { const q = e.getBoundingClientRect(); return getComputedStyle(e).position === 'fixed' && q.height > 0 ? q.bottom : 0; })));
  return (
    <aside style={{ top: topo }} className="ic-detalhe" role="dialog" aria-modal="false" aria-labelledby="ic-det-tit" data-ic-detalhe={x.id}>
      <header className="ic-det-cab">
        <h2 id="ic-det-tit" ref={t} tabIndex={-1} className="ic-det-tit">{x.nome}</h2>
        <button type="button" className="ic-fechar" onClick={aoFechar} aria-label="Fechar o detalhe"><X size={16} aria-hidden /></button>
      </header>
      <div className="ic-det-corpo">
        <p className="ic-det-sub">{x.recurso ?? '—'}{x.dependencia ? ` · via ${nomeDep(x.dependencia)}` : ''} · <span className={`ic-pilula ic-pilula--${tom}`} data-ic-det-estado>{rot}</span>{outros.length > 0 && <span className="ic-dim">também: {outros.join(', ')}</span>}</p>
        {x.erro && <p className="ic-det-erro" data-ic-erro>{x.erro}</p>}
        {x.proximo_passo && <p className="ic-det-passo"><strong>Próximo passo:</strong> {x.proximo_passo}</p>}
        <dl className="ic-det-dl">
          <dt>Último sucesso</dt><dd>{x.ultimo_sucesso ? fmtDiaHora(x.ultimo_sucesso) : <span className="ic-dim">{quando(null, x)}</span>}</dd>
          <dt>Última tentativa</dt><dd>{x.ultima_tentativa ? fmtDiaHora(x.ultima_tentativa) : <span className="ic-dim">{quando(null, x)}</span>}</dd>
          <dt>Cobertura</dt><dd>{cobertura(x)}{x.cobertas !== null && x.esperadas !== null && x.cobertas < x.esperadas ? ' · leitura parcial' : ''}</dd>
        </dl>
        {x.acao && urlSegura(x.acao.url) && <a className="des-btn ic-det-acao" href={urlSegura(x.acao.url)!}>{x.acao.rotulo} <ExternalLink size={13} aria-hidden /></a>}
        {x.contas && x.contas.length > 0 && (
          <>
            <h3 className="ic-det-h3">Contas ({fmtN(x.contas.length)})</h3>
            <ul className="ic-det-lista">{x.contas.map((c) => { const [r, t2] = ESTADO_V2[c.estado] ?? ['—', 'neutro']; const err = textoErro(c.erro_codigo);
              return <li key={c.conta} data-ic-conta={c.conta}><span>{c.rotulo ?? c.conta}</span><span className={`ic-pilula ic-pilula--${t2}`}>{r}</span><span className="ic-dim" title={c.ultima_tentativa ? `Última tentativa ${fmtQuando(c.ultima_tentativa)}` : undefined}>{quando(c.ultimo_sucesso)}</span>{err && <span className="ic-det-erro ic-conta-erro">{err}</span>}</li>; })}</ul>
          </>
        )}
      </div>
    </aside>
  );
}

/** erroAtualizar: a última atualização falhou e os dados na tela são da consulta anterior (INT-UX-001 §7/§11: nunca vira "tudo em dia" nem zero) */
export default function IntegracoesCentral({ dados, aoAtualizar, atualizando, erroAtualizar = false }: { dados: IntegracoesV2; aoVoltar?: () => void; aoAtualizar: () => void; atualizando: boolean; erroAtualizar?: boolean }) {
  const [busca, setBusca] = useState(''); const [atencao, setAtencao] = useState(false); const [aberta, setAberta] = useState<string | null>(null);
  // o Gmail entra no lugar do Outlook (Jhony, 27/11): enquanto o serviço não o listar, a linha é a do catálogo, "Não integrada" (fato, não leitura)
  const todas = useMemo(() => { const l = dados.integracoes.filter((x) => !FORA_DA_LISTA.has(x.id));
    return l.some((x) => x.id === 'gmail') ? l : [...l, GMAIL]; }, [dados.integracoes]);
  const conta = (f: (x: IntegracaoV2) => boolean) => todas.filter(f).length;
  // revisão da VINHO (09:43, ponto 2): com o `resumo` do SERVIDOR, os KPIs e "Pedem atenção" são OS DELE (a mesma regra do selo do menu,
  // inclusive se um dia o servidor filtrar o catálogo por permissão); sem ele (serviço antigo), a contagem local pela mesma classe().
  // parecer R27 (Manager Visual, 27/11): os KPIs NUNCA misturam fontes em silêncio. Contrato: soma das 4 = total autorizado; Pedem atenção =
  // Com falha + Atenção; resumo e registros da MESMA consulta. fonte 'resumo' (confere com os registros) · 'registros' (sem resumo: serviço antigo)
  // · 'parcial' (resumo sem algum campo: só os que vieram, os outros "—") · 'inconsistente' (resumo ≠ registros: nenhum número, aviso visível).
  const CATS: CategoriaInt[] = ['em_dia', 'com_falha', 'atencao', 'nao_conectada'];
  const local = Object.fromEntries(CATS.map((c) => [c, conta((y) => classe(y).categoria === c)])) as Record<CategoriaInt, number>;
  const rs = (dados.resumo ?? null) as Partial<Record<CategoriaInt | 'total' | 'pedem_atencao', unknown>> | null;
  // KPI-V3 (P1 do Manager Visual, 27/11): ordem de decisão AUSENTE → INCONSISTENTE → PARCIAL → RESUMO. Todo campo PRESENTE tem de ser inteiro
  // não negativo e bater com os registros da mesma consulta (inclusive num resumo incompleto: contradição vence a incompletude).
  const num = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
  const presente = (k: string) => !!rs && rs[k as keyof typeof rs] !== undefined && rs[k as keyof typeof rs] !== null;
  const CAMPOS_R = [...CATS, 'total', 'pedem_atencao'] as const;
  const contradiz = !!rs && (
    CAMPOS_R.some((k) => presente(k) && !num(rs[k]))                                                    // presente mas não inteiro ≥ 0
    || CATS.some((c) => presente(c) && rs[c] !== local[c])                                                // categoria ≠ registros
    || (presente('total') && rs.total !== todas.length)                                                   // total ≠ registros
    || (CATS.every((c) => presente(c)) && presente('total') && CATS.reduce((a, c) => a + (rs[c] as number), 0) !== rs.total)
    || (presente('pedem_atencao') && rs.pedem_atencao !== (presente('com_falha') && presente('atencao') ? (rs.com_falha as number) + (rs.atencao as number) : local.com_falha + local.atencao)));
  const kpiFonte: 'resumo' | 'registros' | 'parcial' | 'inconsistente' = !rs ? 'registros' : contradiz ? 'inconsistente' : CAMPOS_R.some((k) => !presente(k)) ? 'parcial' : 'resumo';
  const porCat = (c: CategoriaInt): number | null => (kpiFonte === 'registros' ? local[c] : kpiFonte === 'inconsistente' ? null : num(rs?.[c]) ? (rs![c] as number) : null);
  const nAtencao: number | null = kpiFonte === 'registros' ? conta(pedeAtencao) : kpiFonte === 'inconsistente' ? null : num(rs?.pedem_atencao) ? (rs!.pedem_atencao as number) : null;
  const estKpi = (v: number | null) => (kpiFonte === 'inconsistente' ? 'erro' as const : kpiFonte === 'parcial' ? (v === null ? 'vazio' as const : 'parcial' as const) : 'ok' as const);
  const motKpi = kpiFonte === 'inconsistente' ? 'totais ≠ lista desta consulta' : kpiFonte === 'parcial' ? 'resumo incompleto do servidor' : undefined;
  const linhas = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase('pt-BR');
    return todas.filter((x) => (!atencao || pedeAtencao(x)) && (!q || `${x.nome} ${x.recurso ?? ''}`.toLocaleLowerCase('pt-BR').includes(q)));
  }, [todas, busca, atencao]);
  const el = useRef<HTMLDivElement>(null); const api = useRef<GridApi<IntegracaoV2> | null>(null);
  useEffect(() => {
    if (!el.current) return;
    const colunas: ColDef<IntegracaoV2>[] = [
      { colId: 'nome', headerName: 'Integração', flex: 1, minWidth: 170, field: 'nome', cellRenderer: celNome },
      // 27/11 (capturas do Panorama): a 390 o Estado ficava fora da tela, depois de Integração e Recurso → em tela estreita o Recurso sai
      { colId: 'recurso', headerName: 'Recurso', flex: 1, minWidth: 170, hide: typeof window !== 'undefined' && window.matchMedia('(max-width: 600px)').matches, valueGetter: (p) => p.data?.recurso ?? '—' },
      // ordenação inicial pela gravidade (INT-UX-001 §5) e, dentro do estado, alfabética estável
      { colId: 'estado', headerName: 'Estado', width: 170, sort: 'asc', cellRenderer: celEstado, valueGetter: (p) => (p.data ? classe(p.data).gravidade : 99),
        comparator: (a, b, na, nb) => (a - b) || (na.data?.nome ?? '').localeCompare(nb.data?.nome ?? '', 'pt-BR'),
        valueFormatter: (p) => (p.data ? ESTADO_INT[classe(p.data).principal][0] : '—') },
      { colId: 'sucesso', headerName: 'Último sucesso', width: 170, valueGetter: (p) => p.data?.ultimo_sucesso ?? null, valueFormatter: (p) => quando(p.value ?? null, p.data) },
      { colId: 'tentativa', headerName: 'Última tentativa', width: 170, valueGetter: (p) => p.data?.ultima_tentativa ?? null, valueFormatter: (p) => quando(p.value ?? null, p.data) },
      { colId: 'cobertura', headerName: 'Cobertura', width: 120, cellClass: 'ag-right-aligned-cell', headerClass: 'ag-right-aligned-header', valueGetter: (p) => (p.data ? cobertura(p.data) : '—') },
    ];
    const g = criarGrade<IntegracaoV2>(el.current, { columnDefs: colunas, rowData: [], getRowId: (p) => p.data.id, domLayout: 'autoHeight',
      rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
      onRowClicked: (e) => { if (e.data) setAberta(e.data.id); },
      onCellKeyDown: (e) => { const k = (e.event as KeyboardEvent | null)?.key; if ((k === 'Enter' || k === ' ') && e.data) { e.event?.preventDefault(); setAberta(e.data.id); } },
      suppressNoRowsOverlay: true });
    api.current = g; return () => { api.current = null; g.destroy(); };
  }, []);
  useEffect(() => { api.current?.setGridOption('rowData', linhas); }, [linhas]);
  const x = aberta ? todas.find((y) => y.id === aberta) ?? null : null;
  const fechar = () => { const id = aberta; setAberta(null); const g = api.current; const n = id ? g?.getRowNode(id) : null; if (g && n && n.rowIndex !== null) requestAnimationFrame(() => g.setFocusedCell(n.rowIndex!, 'nome')); };
  const kpi = { formato: 'inteiro' as const, estado: 'ok' as const, compacto: true, fonte: 'Integrações', animar: false };
  const filtrando = atencao || busca.trim() !== '';
  const limpar = () => { setBusca(''); setAtencao(false); };
  return (
    <div className="ic des-escopo" data-ic-central>
      {/* INT-UX-001 §10: sem "← Geral" e sem o título repetido (o shell já identifica o destino; o h1 fica para o leitor de tela) */}
      <DSWorkspaceTop titulo="Integrações" tituloOculto icone={<Plug size={18} aria-hidden />} dados={{ 'data-gv2-integ-topo': '1' }}
        controles={<>
          <label className="ic-busca"><Search size={14} aria-hidden /><span className="des-sr">Buscar integração</span>
            <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar integração" data-ic-busca /></label>
          <button type="button" className="ic-filtro" aria-pressed={atencao} onClick={() => setAtencao(!atencao)} data-ic-atencao>Pedem atenção · {nAtencao === null ? '—' : fmtN(nAtencao)}</button>
          <span className="des-wt__mola" />
          <span className="ic-conferido" data-ic-conferido title={`Consulta de ${fmtHora(dados.gerado_em)}; não é o horário de sucesso das integrações`}>{consultados(dados.gerado_em)}</span>
          <button type="button" className="des-btn" onClick={aoAtualizar} disabled={atualizando}>{atualizando ? 'Atualizando…' : 'Atualizar'}</button>
        </>} />
      {erroAtualizar && <AvisoDesatualizado ultimaAtualizacao={fmtDiaHora(dados.gerado_em)} classeBotao="des-btn"
        texto={`Não foi possível atualizar os estados. Exibindo a última consulta disponível (${fmtDiaHora(dados.gerado_em)}).`} aoAtualizar={atualizando ? undefined : aoAtualizar} />}
      {kpiFonte === 'inconsistente' && <AvisoDesatualizado ultimaAtualizacao={fmtDiaHora(dados.gerado_em)} classeBotao="des-btn" aoAtualizar={atualizando ? undefined : aoAtualizar}
        texto="Os totais do servidor não conferem com a lista desta consulta. Os indicadores ficam indisponíveis; a lista abaixo é a da consulta." />}
      {kpiFonte === 'parcial' && <AvisoDesatualizado ultimaAtualizacao={fmtDiaHora(dados.gerado_em)} texto="O servidor mandou o resumo incompleto: os indicadores sem valor aparecem como “—”." />}
      {/* INT-UX-001 §2: 4 categorias EXCLUSIVAS que somam o catálogo (AC01) */}
      <div className="ic-kpis" data-ic-kpis data-ic-desatualizado={erroAtualizar ? '1' : undefined} data-ic-kpi-fonte={kpiFonte}>
        <DSKpiCardV2 {...kpi} rotulo="Em dia" dominio="operacao" valor={porCat('em_dia')} estado={estKpi(porCat('em_dia'))} motivo={motKpi} dados={{ 'data-ic-kpi': 'em_dia' }} />
        <DSKpiCardV2 {...kpi} rotulo="Com falha" valor={porCat('com_falha')} estado={estKpi(porCat('com_falha'))} motivo={motKpi} dados={{ 'data-ic-kpi': 'com_falha' }} />
        <DSKpiCardV2 {...kpi} rotulo="Atenção" valor={porCat('atencao')} estado={estKpi(porCat('atencao'))} motivo={motKpi} dados={{ 'data-ic-kpi': 'atencao' }} />
        <DSKpiCardV2 {...kpi} rotulo="Não conectadas" valor={porCat('nao_conectada')} estado={estKpi(porCat('nao_conectada'))} motivo={motKpi} dados={{ 'data-ic-kpi': 'nao_conectada' }} />
      </div>
      <p className="ic-contagem" aria-live="polite" data-ic-contagem>{filtrando ? `${fmtN(linhas.length)} de ${fmtN(todas.length)} integrações` : `${fmtN(todas.length)} integrações`}</p>
      {linhas.length === 0 && (atencao && !busca.trim()
        ? <EstadoVazio titulo="Nenhuma falha confirmada." descricao="Nenhuma integração com falha ou que peça atenção nesta consulta." acao={<button type="button" className="des-btn" onClick={limpar}>Limpar filtros</button>} />
        : <EstadoVazio titulo="Nenhuma integração corresponde aos filtros." filtroAtivo acao={<button type="button" className="des-btn" onClick={limpar} data-ic-limpar>Limpar filtros</button>} />)}
      <div className="ic-grade-caixa" data-bl-root hidden={linhas.length === 0}><div ref={el} className="ic-grade" data-ic-grade role="region" aria-label="Integrações" /></div>
      {x && <Detalhe x={x} aoFechar={fechar} />}
    </div>
  );
}
