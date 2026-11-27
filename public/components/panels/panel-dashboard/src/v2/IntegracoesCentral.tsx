// IntegracoesCentral.tsx — INT-001, Central de Integrações (Fase 2) · ROXO (CIMA), 26/11 noite. Referência: LOTE7/DSHOW-INT-001 (ChatGPT; só
// contrato + protótipo, nada aplicado direto). Contrato v2 proposto ao VINHO (INT-001-PLANO.md). Carregada sob demanda (AG Grid no chunk dela).
// Layout (contrato espacial): DSWorkspaceTop (título + ← Geral · busca + "pedem atenção" + conferido) → faixa KPI de 56 px → lista em AG Grid
// (tema DSHOW, altura pelo conteúdo: ~12 linhas, sem rolagem interna) → painel lateral de 480 px. Desconhecido = "—" com o motivo; nunca segredo.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ExternalLink, Plug, Search, X } from 'lucide-react';
import { ClientSideRowModelApiModule, ModuleRegistry } from 'ag-grid-community';
import { DSWorkspaceTop } from '@shared/des/DSWorkspaceTop';
import { DSKpiCardV2 } from '@shared/des/DSKpiCardV2';
import { criarGrade, type ColDef, type GridApi, type ICellRendererParams } from '@shared/ag-grid/grade';
import '@shared/styles/tokens.css';
import { fmtHora, fmtN, fmtQuando, type EstadoIntegracaoV2, type IntegracaoV2, type IntegracoesV2 } from './servico';
import './integracoes-central.css';
ModuleRegistry.registerModules([ClientSideRowModelApiModule]);

export const ESTADO_V2: Record<EstadoIntegracaoV2, [string, 'ok' | 'aviso' | 'erro' | 'neutro']> = {
  ok: ['Em dia', 'ok'], atrasado: ['Atrasada', 'aviso'], parcial: ['Parcial', 'aviso'], com_problema: ['Com problema', 'erro'],
  aguardando: ['Aguardando conexão', 'neutro'], sem_acesso: ['Sem acesso', 'neutro'], nao_integrado: ['Não integrada', 'neutro'], desconhecido: ['Desconhecido', 'neutro'],
};
const ORDEM: EstadoIntegracaoV2[] = ['com_problema', 'atrasado', 'parcial', 'desconhecido', 'sem_acesso', 'aguardando', 'nao_integrado', 'ok'];
// "Pedem atenção" (Jhony, 27/11): erro, atraso/parcial (inclui token expirando, que o serviço reporta como atrasado/com_problema), aguardando conexão e desconhecido
const ATENCAO = new Set<EstadoIntegracaoV2>(['com_problema', 'atrasado', 'parcial', 'aguardando', 'desconhecido']);
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
const quando = (iso: string | null) => (iso ? fmtQuando(iso) : '—');
/** código do erro da conta → texto curto (o serviço manda só o código; "erro:…"/"ultima_tentativa_falhou:…" como no cartão do Asaas) */
const textoErro = (c: string | null) => (c === null ? null : c.startsWith('ultima_tentativa_falhou') ? 'a última tentativa falhou' : c.startsWith('erro') ? 'a sincronização falhou' : c.replace(/[_:]+/g, ' ').trim());
const cobertura = (x: IntegracaoV2) => (x.cobertas === null || x.esperadas === null ? '—' : `${fmtN(x.cobertas)} de ${fmtN(x.esperadas)}`);

function celEstado(p: ICellRendererParams<IntegracaoV2>) {
  const e = p.data?.estado ?? 'desconhecido'; const [rot, tom] = ESTADO_V2[e] ?? ['—', 'neutro'];
  const s = document.createElement('span'); s.className = `ic-pilula ic-pilula--${tom}`; s.textContent = rot; return s;
}

function Detalhe({ x, aoFechar }: { x: IntegracaoV2; aoFechar: () => void }) {
  const t = useRef<HTMLHeadingElement>(null);
  useEffect(() => { t.current?.focus(); const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar(); }; window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc); }, [x.id, aoFechar]);
  const [rot, tom] = ESTADO_V2[x.estado] ?? ['—', 'neutro'];
  const [topo] = useState(() => Math.max(0, ...[...document.querySelectorAll('.dsd-shell__region--header, .dsd-shell__region--ticker')]
    .map((e) => { const q = e.getBoundingClientRect(); return getComputedStyle(e).position === 'fixed' && q.height > 0 ? q.bottom : 0; })));
  return (
    <aside style={{ top: topo }} className="ic-detalhe" role="dialog" aria-modal="false" aria-labelledby="ic-det-tit" data-ic-detalhe={x.id}>
      <header className="ic-det-cab">
        <h2 id="ic-det-tit" ref={t} tabIndex={-1} className="ic-det-tit">{x.nome}</h2>
        <button type="button" className="ic-fechar" onClick={aoFechar} aria-label="Fechar o detalhe"><X size={16} aria-hidden /></button>
      </header>
      <div className="ic-det-corpo">
        <p className="ic-det-sub">{x.recurso ?? '—'} · <span className={`ic-pilula ic-pilula--${tom}`}>{rot}</span></p>
        {x.erro && <p className="ic-det-erro" data-ic-erro>{x.erro}</p>}
        {x.proximo_passo && <p className="ic-det-passo"><strong>Próximo passo:</strong> {x.proximo_passo}</p>}
        <dl className="ic-det-dl">
          <dt>Último sucesso</dt><dd>{x.ultimo_sucesso ? fmtQuando(x.ultimo_sucesso) : <span className="ic-dim">— · a origem não informa</span>}</dd>
          <dt>Última tentativa</dt><dd>{x.ultima_tentativa ? fmtQuando(x.ultima_tentativa) : <span className="ic-dim">— · a origem não informa</span>}</dd>
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

export default function IntegracoesCentral({ dados, aoVoltar, aoAtualizar, atualizando }: { dados: IntegracoesV2; aoVoltar: () => void; aoAtualizar: () => void; atualizando: boolean }) {
  const [busca, setBusca] = useState(''); const [atencao, setAtencao] = useState(false); const [aberta, setAberta] = useState<string | null>(null);
  // o Gmail entra no lugar do Outlook (Jhony, 27/11): enquanto o serviço não o listar, a linha é a do catálogo, "Não integrada" (fato, não leitura)
  const todas = useMemo(() => { const l = dados.integracoes.filter((x) => !FORA_DA_LISTA.has(x.id));
    return l.some((x) => x.id === 'gmail') ? l : [...l, GMAIL]; }, [dados.integracoes]);
  const conta = (f: (x: IntegracaoV2) => boolean) => todas.filter(f).length;
  const nAtencao = conta((x) => ATENCAO.has(x.estado));
  const linhas = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase('pt-BR');
    return todas.filter((x) => (!atencao || ATENCAO.has(x.estado)) && (!q || `${x.nome} ${x.recurso ?? ''}`.toLocaleLowerCase('pt-BR').includes(q)));
  }, [todas, busca, atencao]);
  const el = useRef<HTMLDivElement>(null); const api = useRef<GridApi<IntegracaoV2> | null>(null);
  useEffect(() => {
    if (!el.current) return;
    const colunas: ColDef<IntegracaoV2>[] = [
      { colId: 'nome', headerName: 'Integração', flex: 1, minWidth: 170, field: 'nome' },
      // 27/11 (capturas do Panorama): a 390 o Estado ficava fora da tela, depois de Integração e Recurso → em tela estreita o Recurso sai
      { colId: 'recurso', headerName: 'Recurso', flex: 1, minWidth: 170, hide: typeof window !== 'undefined' && window.matchMedia('(max-width: 600px)').matches, valueGetter: (p) => p.data?.recurso ?? '—' },
      { colId: 'estado', headerName: 'Estado', width: 170, sort: 'asc', cellRenderer: celEstado, valueGetter: (p) => ORDEM.indexOf(p.data?.estado ?? 'desconhecido'),
        valueFormatter: (p) => (p.data ? ESTADO_V2[p.data.estado]?.[0] ?? '—' : '—') },
      { colId: 'sucesso', headerName: 'Último sucesso', width: 170, valueGetter: (p) => p.data?.ultimo_sucesso ?? null, valueFormatter: (p) => quando(p.value ?? null),
        tooltipValueGetter: (p) => (p.data && p.data.ultimo_sucesso === null ? 'A origem não informa' : null) },
      { colId: 'tentativa', headerName: 'Última tentativa', width: 170, valueGetter: (p) => p.data?.ultima_tentativa ?? null, valueFormatter: (p) => quando(p.value ?? null) },
      { colId: 'cobertura', headerName: 'Cobertura', width: 120, cellClass: 'ag-right-aligned-cell', headerClass: 'ag-right-aligned-header', valueGetter: (p) => (p.data ? cobertura(p.data) : '—') },
    ];
    const g = criarGrade<IntegracaoV2>(el.current, { columnDefs: colunas, rowData: [], getRowId: (p) => p.data.id, domLayout: 'autoHeight',
      rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
      onRowClicked: (e) => { if (e.data) setAberta(e.data.id); },
      onCellKeyDown: (e) => { const k = (e.event as KeyboardEvent | null)?.key; if ((k === 'Enter' || k === ' ') && e.data) { e.event?.preventDefault(); setAberta(e.data.id); } },
      overlayNoRowsTemplate: '<span class="ic-vazio">Nenhuma integração neste filtro.</span>' });
    api.current = g; return () => { api.current = null; g.destroy(); };
  }, []);
  useEffect(() => { api.current?.setGridOption('rowData', linhas); }, [linhas]);
  const x = aberta ? todas.find((y) => y.id === aberta) ?? null : null;
  const fechar = () => { const id = aberta; setAberta(null); const g = api.current; const n = id ? g?.getRowNode(id) : null; if (g && n && n.rowIndex !== null) requestAnimationFrame(() => g.setFocusedCell(n.rowIndex!, 'nome')); };
  const kpi = { formato: 'inteiro' as const, estado: 'ok' as const, compacto: true, fonte: 'Integrações', animar: false };
  return (
    <div className="ic des-escopo" data-ic-central>
      <DSWorkspaceTop titulo="Integrações" icone={<Plug size={18} aria-hidden />} dados={{ 'data-gv2-integ-topo': '1' }}
        trilha={<button type="button" className="gv2-link" onClick={aoVoltar}><ArrowLeft size={13} aria-hidden /> Geral</button>}
        controles={<>
          <label className="ic-busca"><Search size={14} aria-hidden /><span className="des-sr">Buscar integração</span>
            <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar integração" data-ic-busca /></label>
          <button type="button" className="ic-filtro" aria-pressed={atencao} onClick={() => setAtencao(!atencao)} data-ic-atencao>Pedem atenção · {fmtN(nAtencao)}</button>
          <span className="des-wt__mola" />
          <span className="ic-conferido" data-ic-conferido>{todas.length} integrações · conferido às {fmtHora(dados.gerado_em)}</span>
          <button type="button" className="des-btn" onClick={aoAtualizar} disabled={atualizando}>{atualizando ? 'Atualizando…' : 'Atualizar'}</button>
        </>} />
      <div className="ic-kpis" data-ic-kpis>
        <DSKpiCardV2 {...kpi} rotulo="Em dia" dominio="operacao" valor={conta((y) => y.estado === 'ok')} dados={{ 'data-ic-kpi': 'ok' }} />
        <DSKpiCardV2 {...kpi} rotulo="Com problema" valor={conta((y) => y.estado === 'com_problema')} dados={{ 'data-ic-kpi': 'problema' }} />
        <DSKpiCardV2 {...kpi} rotulo="Atrasadas ou parciais" valor={conta((y) => y.estado === 'atrasado' || y.estado === 'parcial')} dados={{ 'data-ic-kpi': 'atraso' }} />
        <DSKpiCardV2 {...kpi} rotulo="Sem conexão ou desconhecidas" valor={conta((y) => ['aguardando', 'sem_acesso', 'nao_integrado', 'desconhecido'].includes(y.estado))} dados={{ 'data-ic-kpi': 'sem' }} />
      </div>
      <div className="ic-grade-caixa" data-bl-root><div ref={el} className="ic-grade" data-ic-grade role="region" aria-label="Integrações" /></div>
      {x && <Detalhe x={x} aoFechar={fechar} />}
    </div>
  );
}
