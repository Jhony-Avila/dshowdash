// Cobrancas.tsx — tela "Cobranças vencidas · Asaas" (ROXO/CIMA, 26/11; prioridade 1 do Jhony: usada para cobrar o financeiro).
// Contrato v1 do VINHO/ACIMA_ESQUERDA (PARA-STATUS 13:40): /api/asaas/?r=vencidas_resumo | vencidas_lista | vencida&id=. Substitui o
// drill-down simples da P34 (tabela HTML). Layout pelo parecer UX (13:00): UM bloco travado (topo + big numbers + faixas de atraso + total);
// só a tabela rola (AG Grid, tema DSHOW da P50: zebra, hover ≠ seleção, cabeçalho fixo). Clique na linha → painel lateral de ~480 px que
// não desmonta a tabela (filtro, ordenação e rolagem preservados). Desconhecido = "—", nunca 0. Carregada sob demanda (AG Grid em chunk próprio).
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { DSKpiCardV2 } from '@shared/des/DSKpiCardV2';
import { CurrencyDollarCircle, Receipt, Wallet02 } from '@shared/des/icones-pro';
import { criarGrade, exportarCsv, type ColDef, type GridApi, type ICellRendererParams } from '@shared/ag-grid/grade';
import { ClientSideRowModelApiModule, ModuleRegistry } from 'ag-grid-community';
import '@shared/styles/tokens.css';
// os totais do topo somam as linhas DEPOIS dos filtros de coluna (forEachNodeAfterFilter): módulo de API do modelo do cliente (Community),
// registrado só por esta tela — o grade.ts compartilhado não muda
ModuleRegistry.registerModules([ClientSideRowModelApiModule]);
import {
  ErroV2, LIMITE_CV, dinheiro, lerAsaas, fmtData, fmtHora, fmtMoeda2, fmtMoedaCurta, fmtN, fmtQuando, lerDetalheCv, lerListaCv, lerResumoCv,
  type DetalheCv, type EmpresaCv, type FaixaCv, type ItemCv, type PorEmpresaCv, type ResumoCv,
} from './servico';
import { Problema, useBloco } from './comuns';
import { DSSidePanel } from '@shared/des/DSSidePanel';
import './cobrancas.css';

const FAIXAS: { id: FaixaCv; rotulo: string; curto: string; de: number; ate: number }[] = [
  { id: '1-30', rotulo: '1–30 dias', curto: '1–30', de: 1, ate: 30 }, { id: '31-90', rotulo: '31–90 dias', curto: '31–90', de: 31, ate: 90 },
  { id: '91-180', rotulo: '91–180 dias', curto: '91–180', de: 91, ate: 180 }, { id: '180+', rotulo: 'Mais de 180 dias', curto: '180+', de: 181, ate: Infinity },
];
const faixaDe = (d: number | null) => (d === null ? null : FAIXAS.find((f) => d >= f.de && d <= f.ate) ?? null);
const plural = (n: number | null, um: string, varios: string) => (n === null ? `— ${varios}` : `${fmtN(n)} ${n === 1 ? um : varios}`);
/** valor curto da faixa, sem "R$" (o nome completo e o valor exato estão no rótulo acessível e no title): 110,8 mil · 1,2 mi */
/** Data válida (ISO) ou null: o resumo real não manda gerado_em ("Invalid Date" no ar, 26/11). */
const dataOk = (iso: unknown): string | null => (typeof iso === 'string' && iso !== '' && !Number.isNaN(new Date(iso).getTime()) ? iso : null);
/** Big number em reais inteiros SEM arredondar para cima (AZUL, QI-008: R$ 999.999.999,99 virava "R$ 1.000.000.000", outra casa): trunca os
 *  centavos; o valor exato fica no tooltip, na tabela e no detalhe. */
const inteiro = (v: number | null) => (v === null ? null : Math.trunc(v));
const curta = (v: number | null) => (v === null ? '—' : fmtMoedaCurta(v).replace(/^R\$\s?/, ''));
const negativacao = (x: ItemCv) => (x.situacao?.negativacao === true ? 'Pedida' : x.situacao?.negativacao === false ? 'Não' : '—');
const ORDEM_NULO = (a: number | null, b: number | null) => (a === b ? 0 : a === null ? -1 : b === null ? 1 : a - b);
const MOTIVO: Record<string, string> = { sem_conexao: 'sem conexão', desatualizado: 'leitura desatualizada', sem_leitura: 'sem leitura', nunca_sincronizada: 'nunca sincronizada' };
const textoMotivo = (m: string | null) => (m === null ? 'sem leitura' : MOTIVO[m] ?? m);

/** Faixa da tela que fica fora da rolagem do shell: tudo acima do topo da tela (shell + trilhas). A tela ocupa o resto da janela. */
function useAlturaDisponivel(ref: React.RefObject<HTMLElement | null>) {
  const [alt, setAlt] = useState<number | null>(null);
  useLayoutEffect(() => {
    let quadro = 0;
    // 1ª conta: do topo da tela ao fim da janela; 2ª (no quadro seguinte): desconta o que ainda sobrar de rolagem da página (os paddings do
    // miolo e do shell abaixo da tela), sem mexer em nenhum ancestral — o único dono de rolagem fica sendo a tabela.
    const medir = () => { const el = ref.current; if (!el) return; const t = el.getBoundingClientRect().top + (document.scrollingElement?.scrollTop ?? 0);
      const h = Math.floor(window.innerHeight - Math.max(0, t)); if (h < 480) { setAlt(null); return; }   // < 480 px (celular, zoom 200%): fluxo normal
      setAlt(h); cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => { const se = document.scrollingElement; const sobra = se ? se.scrollHeight - se.clientHeight : 0; if (sobra > 0) setAlt(h - sobra - 1); }); };
    medir(); window.addEventListener('resize', medir); return () => { window.removeEventListener('resize', medir); cancelAnimationFrame(quadro); };
  }, [ref]);
  return alt;
}

function celulaAtraso(p: ICellRendererParams<ItemCv>) {
  const d = p.data?.dias_atraso ?? null; const f = faixaDe(d); const s = document.createElement('span');
  s.className = `cv-atraso${f ? ` cv-atraso--${FAIXAS.indexOf(f) + 1}` : ''}`;
  s.textContent = d === null ? '—' : `${fmtN(d)} ${d === 1 ? 'dia' : 'dias'}`;
  if (f) s.title = `Faixa ${f.rotulo}`;
  return s;
}

function somarApi(api: GridApi<ItemCv>) { let n = 0, soma = 0, desc = 0;
  api.forEachNodeAfterFilter((r) => { if (!r.data) return; n++; const v = dinheiro(r.data.valor_original); if (v === null) desc++; else soma += v; }); return { n, soma, desconhecidos: desc }; }
/** Larguras (26/11, pedido do Jhony): Empresa pelo rótulo curto; Cliente flexível SÓ quando há nomes — com todos "—" (cache de nomes
 *  ainda vazio) ela fica estreita e o espaço vai para as colunas da direita, sem um vão vazio no meio da tabela. */
function larguras(temNome: boolean): Record<string, Partial<ColDef<ItemCv>>> {
  return temNome
    ? { empresa: { width: 130, flex: 0 }, cliente: { flex: 1, minWidth: 200, maxWidth: undefined, width: undefined }, forma: { width: 120, flex: 0 }, negativacao: { width: 130, flex: 0 } }
    : { empresa: { width: 130, flex: 0 }, cliente: { flex: 0, width: 120, minWidth: 100 }, forma: { flex: 1, minWidth: 120 }, negativacao: { flex: 1, minWidth: 130 } };
}
function Grade({ itens, aoAbrir, aoTotais, apiRef, selecionada }: {
  itens: ItemCv[]; aoAbrir: (id: string) => void; aoTotais: (t: { n: number; soma: number; desconhecidos: number }) => void;
  apiRef: React.MutableRefObject<GridApi<ItemCv> | null>; selecionada: string | null;
}) {
  const el = useRef<HTMLDivElement>(null); const temNomeRef = useRef<boolean | null>(null);
  const abrir = useRef(aoAbrir); abrir.current = aoAbrir; const totais = useRef(aoTotais); totais.current = aoTotais;
  useEffect(() => {
    if (!el.current) return;
    const somar = (api: GridApi<ItemCv>) => totais.current(somarApi(api));
    const dir = { cellClass: 'ag-right-aligned-cell', headerClass: 'ag-right-aligned-header' };
    const colunas: ColDef<ItemCv>[] = [
      { colId: 'empresa', headerName: 'Empresa', width: 140, valueGetter: (p) => p.data?.empresa?.rotulo ?? '—' },
      { colId: 'cliente', headerName: 'Cliente', flex: 1, minWidth: 200, valueGetter: (p) => p.data?.cliente_nome ?? '—',
        tooltipValueGetter: (p) => (p.data && p.data.cliente_nome === null ? 'Nome ainda não lido do cadastro do Asaas' : p.data?.cliente_nome ?? null) },
      { colId: 'vencimento', headerName: 'Vencimento', width: 124, valueGetter: (p) => p.data?.vencimento ?? null,
        valueFormatter: (p) => (p.value ? fmtData(p.value) : '—') },
      { colId: 'valor', headerName: 'Valor', width: 144, sort: 'desc', ...dir, valueGetter: (p) => (p.data ? dinheiro(p.data.valor_original) : null),
        comparator: ORDEM_NULO, valueFormatter: (p) => fmtMoeda2(p.value ?? null),
        tooltipValueGetter: (p) => { const a = p.data ? dinheiro(p.data.valor_atualizado) : null; return a === null ? 'Valor original (sem juros nem multa)' : `Atualizado com juros e multa: ${fmtMoeda2(a)}`; } },
      { colId: 'dias', headerName: 'Dias de atraso', width: 150, ...dir, valueGetter: (p) => p.data?.dias_atraso ?? null, comparator: ORDEM_NULO,
        cellRenderer: celulaAtraso, valueFormatter: (p) => (p.value === null ? '—' : String(p.value)) },
      { colId: 'forma', headerName: 'Forma', width: 120, valueGetter: (p) => p.data?.forma?.rotulo ?? '—' },
      { colId: 'negativacao', headerName: 'Negativação', width: 130, valueGetter: (p) => (p.data ? negativacao(p.data) : '—') },
    ];
    const api = criarGrade<ItemCv>(el.current, {
      columnDefs: colunas, rowData: [], getRowId: (p) => p.data.id, rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
      onRowClicked: (e) => { if (e.data) abrir.current(e.data.id); },
      onCellKeyDown: (e) => { const k = (e.event as KeyboardEvent | null)?.key; if ((k === 'Enter' || k === ' ') && e.data) { e.event?.preventDefault(); abrir.current(e.data.id); } },
      onFilterChanged: (e) => somar(e.api), onRowDataUpdated: (e) => somar(e.api),
      overlayNoRowsTemplate: '<span class="cv-vazio">Nenhuma cobrança vencida neste filtro.</span>',
    });
    apiRef.current = api;
    return () => { apiRef.current = null; api.destroy(); };
  }, [apiRef]);
  useEffect(() => { const api = apiRef.current; if (!api) return;
    // CB-UX-AC17 (CLS, 27/11): as larguras (com ou sem nomes) são aplicadas ANTES das linhas — antes, as linhas entravam e as colunas
    // mudavam de largura depois, deslocando todas as células (medido: 0,1994 de CLS em 2200 claro quando a troca caía na janela de leitura)
    const tem = itens.some((x) => x.cliente_nome !== null);
    if (temNomeRef.current !== tem) { temNomeRef.current = tem;   // só quando muda: não desfaz a ordenação
      const L = larguras(tem);
      api.setGridOption('columnDefs', (api.getColumnDefs() ?? []).map((c) => { const id = (c as ColDef<ItemCv>).colId ?? ''; const sem: ColDef<ItemCv> = { ...(c as ColDef<ItemCv>) }; delete sem.sort; return L[id] ? { ...sem, ...L[id] } : sem; }));   // sort ausente = mantém o atual
    }
    api.setGridOption('rowData', itens); totais.current(somarApi(api));
  }, [itens, apiRef]);
  useEffect(() => { const api = apiRef.current; if (!api) return; if (!selecionada) api.deselectAll(); else api.getRowNode(selecionada)?.setSelected(true, true); }, [selecionada, apiRef]);
  return <div ref={el} className="cv-grade" data-cv-grade role="region" aria-label="Cobranças vencidas" />;
}

/** CB-UX-001 D3 (contrato VINHO 6e7ebd6): distribuição POR EMPRESA, compacta. Valor alinhado à direita; participação % só com cobertura completa
 *  (todas lidas + resumo completo); sem leitura = "—" + motivo (nunca 0). Clicar FILTRA a tela por aquela empresa (explícito: aria-pressed; o mesmo
 *  seletor de empresa do topo); com o filtro, a quebra é a da empresa filtrada (não mistura total global com filtrado). Ausente = não aparece. */
function PorEmpresa({ itens, total, completo, selecionada, aoSelecionar }: { itens: PorEmpresaCv[] | null; total: number | null; completo: boolean;
  selecionada: string | null; aoSelecionar: (conta: string | null) => void }) {
  if (!itens || itens.length === 0) return null;
  const cobertura = completo && itens.every((e) => e.lida) && total !== null && total > 0;
  return (
    <div className="cv-emps" role="group" aria-label="Distribuição por empresa (clique filtra a tela)" data-cv-por-empresa>
      {itens.map((e) => { const v = e.lida ? dinheiro(e.valor) : null; const pct = cobertura && v !== null ? (v / (total as number)) * 100 : null;
        const ativo = selecionada === e.empresa.conta;
        return (
          <button key={e.empresa.conta} type="button" className={`cv-emp-chip${e.lida ? '' : ' cv-emp-chip--sem'}`} aria-pressed={ativo} data-cv-emp={e.empresa.conta}
            onClick={() => aoSelecionar(ativo ? null : e.empresa.conta)}
            title={e.lida ? `${e.empresa.rotulo}: ${fmtMoeda2(v)} · ${plural(e.cobrancas, 'cobrança', 'cobranças')} · ${plural(e.clientes, 'cliente', 'clientes')}${e.negativadas ? ` · em negativação ${fmtMoeda2(dinheiro(e.negativadas.valor))}` : ''}`
              : `${e.empresa.rotulo}: sem leitura (${textoMotivo(e.motivo ?? null)}) — fora das somas`}>
            <span className="cv-emp-nome">{e.empresa.rotulo}</span>
            <span className="cv-emp-v cv-num">{e.lida ? curta(v) : '—'}</span>
            <span className="cv-emp-q">{e.lida ? `${fmtN(e.cobrancas ?? 0)} cobr. · ${fmtN(e.clientes ?? 0)} cli.` : textoMotivo(e.motivo ?? null)}</span>
            {pct !== null && <span className="cv-emp-pct">{pct > 0 && pct < 0.1 ? '<0,1' : pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>}
          </button>); })}
      {!cobertura && <span className="cv-dim cv-emps-nota" data-cv-emps-sem-pct>participação: — (cobertura incompleta)</span>}
    </div>
  );
}

// CB-UX-001 · LIB-03 (VERDE, 27/11): o painel do detalhe é o DSSidePanel compartilhado (modo NÃO modal: a grade continua utilizável —
// filtro, ordenação, seleção e rolagem preservados; Esc fecha; o foco volta à linha de origem). Os dados e a ação continuam aqui.
function Detalhe({ id, aoFechar, aoAbrir }: { id: string; aoFechar: () => void; aoAbrir: (id: string) => void }) {
  const b = useBloco((s) => lerDetalheCv(id, s), [id], { reconsultarAoVoltar: true });
  const d: DetalheCv | null = b.dados;
  const orig = d ? dinheiro(d.valor_original) : null, atu = d ? dinheiro(d.valor_atualizado) : null, jm = d ? dinheiro(d.juros_multa) : null;
  const f = faixaDe(d?.dias_atraso ?? null);
  return (
    <DSSidePanel key={id} aberto modo="nao-modal" largura={520} aoFechar={aoFechar} rotuloFechar="Fechar o detalhe"
      titulo={d ? d.cliente_nome ?? 'Cliente —' : 'Cobrança vencida'}
      subtitulo={d ? <>{d.empresa?.rotulo ?? '—'} · cliente <code>{d.cliente_codigo ?? '—'}</code> · cobrança <code>{d.id}</code></> : undefined}
      estado={d?.situacao?.negativacao === true ? 'Negativação pedida' : undefined}
      carregando={b.carregando && !d}
      erro={!b.carregando && !d ? <Problema motivo={b.erro instanceof ErroV2 && b.erro.http === 404 ? 'Esta cobrança não está mais entre as vencidas lidas.' : 'Não foi possível ler o detalhe agora.'} quando={null} onTentar={b.recarregar} tentando={b.atualizando} /> : undefined}
      rodape={d?.link_fatura ? <a className="des-btn cv-det-link" href={d.link_fatura} target="_blank" rel="noopener noreferrer">Abrir no Asaas (fatura/boleto) <ExternalLink size={13} aria-hidden /></a> : undefined}
      dados={{ 'data-cv-detalhe': id }}>
      {d && (
        <>
        <div className="cv-det-valores">
          <div><span className="cv-det-rot">Valor original</span><strong className="cv-det-num">{fmtMoeda2(orig)}</strong></div>
          <div><span className="cv-det-rot">Atualizado (juros e multa)</span><strong className="cv-det-num">{fmtMoeda2(atu)}</strong>
            <span className="cv-det-nota">{atu === null ? 'o Asaas não informou juros/multa' : `+ ${fmtMoeda2(jm)}`}</span></div>
        </div>
        <dl className="cv-det-dl">
          <dt>Vencimento</dt><dd>{d.vencimento ? fmtData(d.vencimento) : '—'}{d.vencimento_original && d.vencimento_original !== d.vencimento ? ` (original ${fmtData(d.vencimento_original)})` : ''}</dd>
          <dt>Atraso</dt><dd><span className={`cv-atraso${f ? ` cv-atraso--${FAIXAS.indexOf(f) + 1}` : ''}`}>{d.dias_atraso === null ? '—' : `${fmtN(d.dias_atraso)} dias`}</span>{f ? ` · ${f.rotulo}` : ''}</dd>
          <dt>Forma</dt><dd>{d.forma?.rotulo ?? '—'}</dd>
          <dt>Negativação</dt><dd>{negativacao(d)}</dd>
          <dt>Fatura</dt><dd>{d.numero_fatura ?? '—'}</dd>
          <dt>Criada em</dt><dd>{d.criada_em ? fmtData(d.criada_em) : '—'}</dd>
          <dt>Descrição</dt><dd>{d.descricao ?? <span className="cv-dim">— · não gravada no Dash (pode conter dado do cliente)</span>}</dd>
        </dl>
        {!d.link_fatura && <p className="cv-dim">Link da fatura: — (o Asaas não informou)</p>}
        <h3 className="cv-det-h3">Histórico</h3>
        {d.eventos && d.eventos.length ? <ul className="cv-det-lista">{d.eventos.map((e, k) => <li key={k}><span>{fmtQuando(e.data)}</span><span>{e.evento}</span></li>)}</ul>
          : <p className="cv-dim">— · o Asaas não fornece histórico por cobrança</p>}
        <h3 className="cv-det-h3">Outras vencidas deste cliente</h3>
        {d.outras_do_cliente === null ? <p className="cv-dim">—</p> : d.outras_do_cliente.itens.length === 0 ? <p className="cv-dim">Nenhuma outra vencida.</p> : (
          <>
            <p className="cv-det-soma" data-cv-outras>{plural(d.outras_do_cliente.cobrancas, 'cobrança', 'cobranças')} · {fmtMoeda2(dinheiro(d.outras_do_cliente.valor))}</p>
            <ul className="cv-det-lista">{d.outras_do_cliente.itens.map((o) => (
              <li key={o.id}><button type="button" className="des-link" onClick={() => aoAbrir(o.id)}>{o.vencimento ? fmtData(o.vencimento) : '—'}</button>
                <span>{o.dias_atraso === null ? '—' : `${fmtN(o.dias_atraso)} dias`}</span><span className="cv-num">{fmtMoeda2(dinheiro(o.valor_original))}</span></li>))}</ul>
          </>
        )}
        </>
      )}
    </DSSidePanel>
  );
}

export default function CobrancasVencidas({ aoVoltar }: { aoVoltar: () => void }) {
  const [empresa, setEmpresa] = useState<string | null>(null);
  const [faixa, setFaixa] = useState<FaixaCv | null>(null);
  const [aberta, setAberta] = useState<string | null>(null);
  const [totais, setTotais] = useState<{ n: number; soma: number; desconhecidos: number } | null>(null);
  const resumo = useBloco((s) => lerResumoCv(empresa, s), [empresa], { reconsultarAoVoltar: true });
  const lista = useBloco((s) => lerListaCv(empresa, s), [empresa], { reconsultarAoVoltar: true });
  const r: ResumoCv | null = resumo.dados;
  // "conferido às": a hora do resumo, se vier; senão a da última sincronização das empresas que a Geral já lê (asaas.php · atualizado_em,
  // a MAIS ANTIGA entre as empresas com leitura = até quando tudo está conferido); nenhuma → "—"
  const asaas = useBloco((s) => lerAsaas(s), [], { reconsultarAoVoltar: true });
  const conferido = dataOk(r?.gerado_em) ?? (asaas.dados?.empresas ?? []).filter((e) => e.estado !== 'indisponivel').map((e) => dataOk(e.atualizado_em))
    .filter((x): x is string => x !== null).sort()[0] ?? null;
  const apiRef = useRef<GridApi<ItemCv> | null>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const alt = useAlturaDisponivel(raiz);
  // empresas do filtro: as do serviço (se mandar) ou as vistas na lista sem filtro + as sem leitura; guardadas ao filtrar
  const [empresas, setEmpresas] = useState<EmpresaCv[]>([]);
  useEffect(() => {
    if (empresa !== null) return;
    const m = new Map<string, EmpresaCv>();
    (r?.empresas ?? []).forEach((e) => m.set(e.conta, e));
    (lista.dados?.itens ?? []).forEach((x) => x.empresa && m.set(x.empresa.conta, x.empresa));
    (r?.empresas_sem_leitura ?? []).forEach((x) => m.set(x.empresa.conta, x.empresa));
    if (m.size) setEmpresas([...m.values()].sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR')));
  }, [r, lista.dados, empresa]);
  const itens = useMemo(() => {
    const todos = lista.dados?.itens ?? []; const f = FAIXAS.find((x) => x.id === faixa);
    return f ? todos.filter((x) => x.dias_atraso !== null && x.dias_atraso >= f.de && x.dias_atraso <= f.ate) : todos;
  }, [lista.dados, faixa]);
  // ao fechar, o foco volta para a linha que estava aberta (a tabela não desmontou: filtro, ordem e rolagem ficam)
  const fechar = useCallback(() => { setAberta((id) => { const api = apiRef.current; const n = id ? api?.getRowNode(id) : null;
    if (api && n && n.rowIndex !== null) requestAnimationFrame(() => api.setFocusedCell(n.rowIndex!, 'cliente')); return null; }); }, []);
  const semAcesso = [resumo.erro, lista.erro].some((e) => e instanceof ErroV2 && (e.http === 404 || e.semAcesso)) && !r && !lista.dados;
  const semLeitura = r?.empresas_sem_leitura ?? lista.dados?.empresas_sem_leitura ?? [];
  const total = lista.dados?.total ?? null; const truncada = total !== null && lista.dados !== null && total > lista.dados.itens.length;
  const estado = (b: typeof resumo) => (b.carregando && !b.dados ? 'carregando' as const : !b.dados ? 'erro' as const : 'ok' as const);
  // na faixa de 56 px os big numbers vão em reais inteiros (o centavo fica na tabela, no detalhe e no tooltip do cartão)
  const kpi = { formato: 'moeda-inteira' as const, dominio: 'financeiro' as const, compacto: true, animar: true, fonte: 'Asaas', estado: estado(resumo),
    onTentar: resumo.recarregar, tentando: resumo.atualizando, motivo: estado(resumo) === 'erro' ? 'Não foi possível ler agora.' : undefined, quando: undefined };
  const soma = (x: { valor: string | null; cobrancas: number | null } | null | undefined) => { const v = x ? dinheiro(x.valor) : null;
    return { valor: inteiro(v), sub: x ? plural(x.cobrancas, 'cobrança', 'cobranças') : undefined, dica: v === null ? undefined : `Valor exato: ${fmtMoeda2(v)}` }; };
  const pv = r?.por_vencimento ?? null; const mx = r?.maior ?? null;

  if (semAcesso) return (
    <div className="cv des-escopo" data-cv-tela><nav className="cv-topo"><button type="button" className="des-link" onClick={aoVoltar}><ArrowLeft size={13} aria-hidden /> Geral</button></nav>
      <p className="cv-dim">Seu acesso não inclui as cobranças do Asaas.</p></div>);

  return (
    <div ref={raiz} className={`cv des-escopo${alt ? ' cv--travada' : ''}`} style={alt ? { height: alt } : undefined} data-cv-tela>
      <div className="cv-fixo" data-cv-fixo>
        <div className="cv-topo">
          <button type="button" className="des-link cv-voltar" onClick={aoVoltar}><ArrowLeft size={13} aria-hidden /> Geral</button>
          <h1 className="cv-h1">Cobranças vencidas</h1>
          <label className="cv-emp"><span className="des-sr">Empresa</span>
            <select value={empresa ?? ''} onChange={(e) => { setEmpresa(e.target.value || null); setAberta(null); }} data-cv-empresa>
              <option value="">Todas as empresas</option>
              {empresas.map((e) => <option key={e.conta} value={e.conta}>{e.rotulo}</option>)}
            </select></label>
          {r && !r.completo && <span className="des-selo des-selo--aviso" data-cv-parcial title={semLeitura.map((x) => `${x.empresa.rotulo}: ${textoMotivo(x.motivo)}`).join(' · ')}>
            Parcial · {semLeitura.length} sem leitura<span className="des-sr"> (fora das somas: {semLeitura.map((x) => x.empresa.rotulo).join(', ')})</span></span>}
          <span className="cv-conferido" data-cv-conferido title={conferido ? `Última conferência: ${fmtQuando(conferido)}` : 'Hora da última conferência não informada'}>
            {resumo.carregando && !r ? 'lendo…' : `conferido às ${conferido ? fmtHora(conferido) : '—'}`}</span>
          <div className="cv-total cv-dir" data-cv-total aria-live="polite">
            {totais ? <><strong>{plural(totais.n, 'cobrança', 'cobranças')} · {fmtMoeda2(totais.soma)}</strong>{totais.desconhecidos ? ` · ${totais.desconhecidos} sem valor` : ''}{faixa ? ' na faixa' : ''}</> : '—'}
            {truncada && <span className="cv-dim" data-cv-truncada> · as {fmtN(LIMITE_CV)} maiores de {fmtN(total)}</span>}
            <button type="button" className="des-btn cv-csv" onClick={() => apiRef.current && exportarCsv(apiRef.current, `cobrancas-vencidas-${new Date().toISOString().slice(0, 10)}.csv`)} disabled={!lista.dados}>
              <Download size={13} aria-hidden /> CSV</button>
          </div>
        </div>
        {resumo.erro && r && <Problema motivo="A atualização falhou; mostrando a última leitura." quando={resumo.okEm} onTentar={resumo.recarregar} tentando={resumo.atualizando} />}
        <div className="cv-kpis" data-cv-kpis>
          <DSKpiCardV2 {...kpi} rotulo="Total vencido" icone={<Wallet02 size={14} />} valor={r?.total ? inteiro(dinheiro(r.total.valor)) : null}
            sub={r?.total ? `${plural(r.total.cobrancas, 'cobrança', 'cobranças')} · ${plural(r.total.clientes, 'cliente', 'clientes')}` : undefined}
            dica={r?.total ? `Valor exato: ${fmtMoeda2(dinheiro(r.total.valor))} · ${plural(r.total.cobrancas, 'cobrança', 'cobranças')} de ${plural(r.total.clientes, 'cliente', 'clientes')}` : undefined} dados={{ 'data-cv-kpi': 'total' }} />
          <DSKpiCardV2 {...kpi} rotulo="Vencido neste mês" icone={<Receipt size={14} />} {...soma(pv?.mes_atual)} dados={{ 'data-cv-kpi': 'mes' }} />
          <DSKpiCardV2 {...kpi} rotulo="Últimos 30 dias" icone={<Receipt size={14} />} {...soma(pv?.ultimos_30_dias)} dados={{ 'data-cv-kpi': 'd30' }} />
          <DSKpiCardV2 {...kpi} rotulo="Últimos 3 meses" icone={<Receipt size={14} />} {...soma(pv?.ultimos_3_meses)} dados={{ 'data-cv-kpi': 'd90' }} />
          <DSKpiCardV2 {...kpi} rotulo="Maior em aberto" icone={<CurrencyDollarCircle size={14} />} valor={mx ? inteiro(dinheiro(mx.valor)) : null}
            estado={kpi.estado === 'ok' && !mx ? 'vazio' : kpi.estado} selo={null} motivo={kpi.estado === 'ok' && !mx ? 'Nenhuma vencida' : kpi.motivo}
            sub={mx ? <button type="button" className="des-link cv-maior" onClick={() => setAberta(mx.id)} data-cv-maior title={`${mx.cliente_nome ?? 'Cliente —'} · ${mx.empresa?.rotulo ?? '—'} · ${fmtMoeda2(dinheiro(mx.valor))}`}>{mx.dias_atraso === null ? '—' : `${fmtN(mx.dias_atraso)} dias`} · {mx.cliente_nome ?? 'cliente —'}</button> : undefined}
            dados={{ 'data-cv-kpi': 'maior' }} />
          {/* CB-UX-001 D2/AC08: negativação = SUBCONJUNTO do total (nunca somada); servidor sem o campo = indisponível, nunca 0 */}
          <DSKpiCardV2 {...kpi} rotulo="Em negativação" icone={<Receipt size={14} />}
            {...(r?.total && r.total.negativadas !== undefined ? soma(r.total.negativadas) : { valor: null, sub: undefined, dica: undefined })}
            motivo={kpi.estado === 'ok' && (!r?.total || r.total.negativadas === undefined || r.total.negativadas === null) ? 'Indisponível nesta leitura' : kpi.motivo}
            dica={r?.total?.negativadas ? `Parte do total vencido (já incluída nele): ${fmtMoeda2(dinheiro(r.total.negativadas.valor))}` : 'A leitura atual não informa a negativação'}
            dados={{ 'data-cv-kpi': 'negativacao' }} />
          <div className="cv-faixas" role="group" aria-labelledby="cv-faixas-rot" data-cv-faixas>
            <span id="cv-faixas-rot" className="des-sr">Faixas de atraso: clique filtra a tabela</span>
            <div className="cv-faixas-barra">
            {FAIXAS.map((f, i) => { const x = r?.faixas?.find((y) => y.faixa === f.id) ?? null; const v = x ? dinheiro(x.valor) : null;
              return (
                <button key={f.id} type="button" className={`cv-faixa cv-faixa--${i + 1}`} aria-pressed={faixa === f.id} data-cv-faixa={f.id}
                  onClick={() => setFaixa(faixa === f.id ? null : f.id)}
                  title={`${f.rotulo}: ${fmtMoeda2(v)} · ${x ? plural(x.cobrancas, 'cobrança', 'cobranças') : '—'}`}>
                  <span className="cv-faixa-rot">{f.curto} d<span className="des-sr"> de atraso: {x ? plural(x.cobrancas, 'cobrança', 'cobranças') : '— cobranças'},</span></span>
                  <span className="cv-faixa-v">{curta(v)}</span>
                </button>); })}
          </div>
          </div>
        </div>
        <PorEmpresa itens={r?.por_empresa ?? null} total={r?.total ? dinheiro(r.total.valor) : null} completo={!!r?.completo} selecionada={empresa}
          aoSelecionar={(c) => { setEmpresa(c); setAberta(null); }} />
      </div>
      <div className="cv-corpo" data-bl-root>
        {lista.carregando && !lista.dados ? <div className="cv-carregando" aria-busy>Lendo as cobranças…</div>
          : !lista.dados ? <Problema motivo="Não foi possível ler as cobranças vencidas agora." quando={null} onTentar={lista.recarregar} tentando={lista.atualizando} />
          : null}
        <div className="cv-grade-caixa" hidden={!lista.dados}>
          <Grade itens={itens} aoAbrir={setAberta} aoTotais={setTotais} apiRef={apiRef} selecionada={aberta} />
        </div>
      </div>
      {aberta && <Detalhe id={aberta} aoFechar={fechar} aoAbrir={setAberta} />}
      {/* a soma dos totais não troca de empresa sem leitura: as listadas em "Parcial" ficam fora de todos os números */}
      {lista.dados && !lista.dados.completo && semLeitura.length > 0 && <span className="des-sr">Empresas sem leitura: {semLeitura.map((x) => x.empresa.rotulo).join(', ')}</span>}
    </div>
  );
}
