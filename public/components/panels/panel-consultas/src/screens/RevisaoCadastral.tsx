// screens/RevisaoCadastral.tsx — "Revisão cadastral" (C2, APIs para consulta). Prévia privada: campos vazios de organizações do Pipedrive
// com negócio ganho que podem ser preenchidos com dados que a DSHOW já tem. Referência: consultas-cadastrais/PILOTO-CADASTRAL-DSHOW.md §5.
// FASE DE LEITURA: nada é gravado e nada é comprado; não existe botão de aplicar. "Gerar prévia" só lê as fontes de novo.
// Contrato espacial (Jhony 13:44): um bloco de topo único (título + ações, faixa ≤ 56 px, filtros) e UMA região de rolagem (as linhas da grade).
import React from 'react';
import { criarGrade, type GridApi, type ColDef, type ICellRendererParams } from '@shared/ag-grid/grade';
import { lerPrevia, gerarPrevia, type Resultado } from '../lib/api';
import { ROTULO_CLASSE, ROTULO_DOADORA, ROTULO_FONTE, ROTULO_ORIGEM, type Classe, type Fontes, type Linha, type Lote, type Previa } from '../lib/tipos';

type Filtro = 'todas' | 'com_sugestao' | 'divergem' | 'revisar' | 'sem_valor' | 'paga_opcional';
// Os 4 filtros pedidos (+ "Todos"); "Razão = nome: revisar" (v1.1 da C1) só aparece quando existir caso no lote.
const FILTROS: { id: Filtro; rotulo: string; dica: string; casa: (c: Classe) => boolean; soComCaso?: boolean }[] = [
  { id: 'todas', rotulo: 'Todos os campos vazios', dica: 'Todos os destinos (ficha + campo) do lote', casa: () => true },
  { id: 'com_sugestao', rotulo: 'Com sugestão', dica: 'Há valor proposto por uma fonte interna (ou mais, concordando)', casa: (c) => c === 'sugestao' },
  { id: 'divergem', rotulo: 'Fontes divergem', dica: 'Conteúdos diferentes ou identidade duvidosa: nada é proposto até a escolha humana', casa: (c) => c === 'fontes_divergem' || c === 'identidade_duvidosa' },
  { id: 'revisar', rotulo: 'Razão = nome: revisar', dica: 'A razão social é igual ao nome de exibição e as fontes trazem outra: nunca entra sozinha', casa: (c) => c === 'nome_para_razao_revisar', soComCaso: true },
  { id: 'sem_valor', rotulo: 'Sem valor nas bases', dica: 'Nenhuma fonte interna tem valor (com o CNPJ no legado ou fora dele)', casa: (c) => c === 'sem_valor_legado_presente' || c === 'sem_valor_legado_ausente' },
  { id: 'paga_opcional', rotulo: 'Consulta paga opcional', dica: 'CNPJ fora do legado: uma consulta paga poderia trazer o valor (nunca é disparada aqui)', casa: (c) => c === 'sem_valor_legado_ausente' },
];

/** Linha da grade: a linha da prévia OU o detalhe (linha de largura total logo abaixo da expandida). */
type LinhaGrade = Linha & { __detalhe?: false } | { __detalhe: true; id: string; pai: Linha };

const n = (v: number | null | undefined) => (v === null || v === undefined ? '—' : v.toLocaleString('pt-BR'));
const reais = (v: number | null | undefined) => (v === null || v === undefined || Number.isNaN(v) ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
const decimal = (s: string | null | undefined) => (s === null || s === undefined || s === '' ? null : Number(s));
const dataHora = (iso: string | null | undefined) => {
  if (!iso) return '—'; const d = new Date(iso); if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const data = (iso: string | null | undefined) => {
  if (!iso) return '—'; const d = new Date(iso); if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};
/** Soma uma chave de todas as filas do lote; nenhuma fila com a chave = desconhecido (null), nunca 0. */
const somaFilas = (lote: Lote, k: string): number | null => {
  const v = Object.values(lote.filas ?? {}).map((f) => f[k]).filter((x): x is number => typeof x === 'number');
  return v.length ? v.reduce((a, b) => a + b, 0) : null;
};
const retrato = (f: Fontes[keyof Fontes]) => ('ultimo_sync' in f ? f.ultimo_sync : f.lido_em);

function textoProposto(l: Linha): string {
  if (l.classificacao === 'sugestao') return l.proposto?.valor ?? '—';
  if (l.classificacao === 'nome_para_razao_revisar') return `${l.proposto?.valor ?? '—'} · revisar (não pré-selecionada)`;
  if (l.classificacao === 'fontes_divergem') return 'Fontes divergem · escolha humana';
  if (l.classificacao === 'identidade_duvidosa') return 'Identidade duvidosa · sem sugestão';
  if (l.classificacao === 'sem_valor_legado_ausente') return 'Sem valor · consulta paga opcional';
  if (l.classificacao === 'fonte_indisponivel') return 'Fonte indisponível · não conta como ausência';
  return 'Sem valor nas bases';
}
function textoOrigem(l: Linha): string {
  const origens = [...new Set(l.grafias.map((g) => g.origem))];
  if (l.classificacao !== 'sugestao' && l.classificacao !== 'nome_para_razao_revisar') return origens.length ? `${origens.length} fonte${origens.length > 1 ? 's' : ''}` : '—';
  // RC-008 F25: "=" (as fontes CONCORDAM) só numa sugestão; num caso para revisar as origens aparecem listadas, sem declarar concordância
  if (origens.length > 1) return origens.map((o) => ROTULO_ORIGEM[o]).join(l.classificacao === 'sugestao' ? ' = ' : ' · ');
  return l.proposto ? ROTULO_ORIGEM[l.proposto.origem] : '—';
}

/** Detalhe (linha expandida): destino, ficha doadora, outras fichas com o mesmo CNPJ e as grafias. DOM por textContent (sem HTML injetado). */
function detalhe(l: Linha): HTMLElement {
  const el = (tag: string, cls: string, txt?: string) => { const e = document.createElement(tag); e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const raiz = el('div', 'cs-det'); raiz.setAttribute('data-cs-detalhe', l.id); raiz.setAttribute('role', 'region'); raiz.setAttribute('aria-label', `Detalhe de ${l.empresa}, ${l.campo_rotulo}`);
  const col1 = el('div', 'cs-det__col');
  col1.append(el('h4', 'cs-det__tit', 'Destino'), el('p', 'cs-det__txt', `Organização #${l.org_id} · CNPJ ${l.cnpj || '—'} · campo ${l.campo_rotulo} (${l.campo})`));
  if (l.cnpj_compartilhado_com.length) {
    const p = el('p', 'cs-det__aviso', `Mesmo CNPJ em outras fichas ativas: ${l.cnpj_compartilhado_com.map((x) => `#${x}`).join(', ')}. O destino desta linha é a #${l.org_id}.`);
    p.setAttribute('data-cs-cnpj-compartilhado', ''); col1.append(p);
  }
  col1.append(el('h4', 'cs-det__tit', 'Ficha doadora'));
  const doadora = l.proposto ? l.grafias.find((g) => g.origem === l.proposto!.origem && g.valor === l.proposto!.valor)?.doadora ?? l.grafias.find((g) => g.origem === l.proposto!.origem)?.doadora : undefined;
  col1.append(el('p', 'cs-det__txt', doadora
    ? `${ROTULO_DOADORA[doadora.tipo] ?? doadora.tipo} · ${doadora.tipo === 'crm' ? '#' : 'id '}${doadora.id}${doadora.consultado_em ? ` · consultado em ${data(doadora.consultado_em)}` : ''}`
    : l.classificacao === 'fontes_divergem' ? 'Nenhuma: as fontes divergem e a escolha é humana.'
    : l.classificacao === 'fonte_indisponivel' ? 'Nenhuma: uma fonte estava indisponível (não conta como ausência).' : 'Nenhuma fonte interna tem valor para este campo.'));
  col1.append(el('p', 'cs-det__txt cs-det__txt--dim', `Valor atual: ${l.valor_anterior && l.valor_anterior.trim() ? l.valor_anterior : 'vazio'}`));
  const col2 = el('div', 'cs-det__col');
  col2.append(el('h4', 'cs-det__tit', `Grafias e origens (${l.grafias.length})`));
  if (l.grafias.length) {
    const ul = el('ul', 'cs-det__lista');
    l.grafias.forEach((g) => { const li = el('li', 'cs-det__grafia'); const t = el('span', 'cs-det__valor', g.valor);
      const f = el('span', 'cs-det__fonte', `${ROTULO_ORIGEM[g.origem] ?? g.origem}${g.doadora?.consultado_em ? ` · ${data(g.doadora.consultado_em)}` : ''}`);
      if (l.proposto && g.valor === l.proposto.valor && g.origem === l.proposto.origem) { li.classList.add('cs-det__grafia--proposta'); f.textContent += ' · forma proposta'; }
      li.append(t, f); ul.append(li); });
    col2.append(ul);
  } else col2.append(el('p', 'cs-det__txt', '—'));
  if (l.classificacao === 'fontes_divergem') col2.append(el('p', 'cs-det__aviso', 'Os conteúdos são diferentes (não é só caixa ou espaço): nada é proposto até alguém escolher.'));
  else if (l.classificacao === 'nome_para_razao_revisar') col2.append(el('p', 'cs-det__aviso', 'A razão social atual é igual ao nome de exibição. A troca só vale se alguém aprovar esta linha.'));
  else if (l.precisa_escolha) col2.append(el('p', 'cs-det__aviso', 'Há alternativas na mesma prioridade: a grafia precisa ser escolhida.'));
  else if (l.grafias.length > 1 && l.classificacao === 'sugestao') col2.append(el('p', 'cs-det__txt cs-det__txt--dim', 'As grafias só variam em caixa/espaços. A forma proposta segue a precedência Precifica → legado → JSON confirmado → outra ficha do CRM.'));
  col2.append(el('p', 'cs-det__txt cs-det__txt--dim', `Fila ${l.fila} · evidência ${l.evidencia_versao.slice(0, 12)}`));
  raiz.append(col1, col2);
  return raiz;
}

export function RevisaoCadastral() {
  const [previa, setPrevia] = React.useState<Previa | null>(null);
  const [estado, setEstado] = React.useState<'carregando' | 'pronto' | 'sem_lote' | 'erro'>('carregando');
  const [motivo, setMotivo] = React.useState('');
  const [gerando, setGerando] = React.useState(false);
  const [aviso, setAviso] = React.useState<string | null>(null);
  const [filtro, setFiltro] = React.useState<Filtro>('todas');
  const [abertas, setAbertas] = React.useState<Set<string>>(new Set());
  const caixa = React.useRef<HTMLDivElement>(null);
  const api = React.useRef<GridApi<LinhaGrade> | null>(null);
  const [altura, setAltura] = React.useState(420);

  const carregar = React.useCallback(async (gerar: boolean, signal?: AbortSignal) => {
    if (gerar) setGerando(true); else setEstado('carregando');
    const r: Resultado = gerar ? await gerarPrevia(signal) : await lerPrevia(signal);
    if (signal?.aborted) return;
    setGerando(false);
    if (r.tipo === 'ok') { setPrevia(r.previa); setEstado('pronto'); setAbertas(new Set()); if (gerar) setAviso('Gerada agora · leu as fontes; nada foi gravado no CRM nem comprado.'); }
    else if (r.tipo === 'sem_lote') { if (!gerar || !previa) setEstado('sem_lote'); else setAviso('A API não respondeu à geração (404).'); }
    else if (gerar && previa) setAviso(`Não foi possível gerar a prévia (${r.motivo}). A anterior continua na tela.`);
    else { setMotivo(r.motivo); setEstado('erro'); }
  }, [previa]);
  React.useEffect(() => { const c = new AbortController(); carregar(false, c.signal); return () => c.abort(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const contagem = React.useMemo(() => {
    const m = new Map<Filtro, number>(); const ls = previa?.linhas ?? [];
    FILTROS.forEach((f) => m.set(f.id, ls.filter((l) => f.casa(l.classificacao)).length)); return m;
  }, [previa]);

  const linhasGrade = React.useMemo<LinhaGrade[]>(() => {
    const f = FILTROS.find((x) => x.id === filtro)!; const out: LinhaGrade[] = [];
    (previa?.linhas ?? []).filter((l) => f.casa(l.classificacao)).forEach((l) => { out.push(l); if (abertas.has(l.id)) out.push({ __detalhe: true, id: `${l.id}::detalhe`, pai: l }); });
    return out;
  }, [previa, filtro, abertas]);

  const alternar = React.useCallback((id: string) => setAbertas((s) => { const t = new Set(s); if (t.has(id)) t.delete(id); else t.add(id); return t; }), []);
  const alternarRef = React.useRef(alternar); alternarRef.current = alternar;
  const abertasRef = React.useRef(abertas); abertasRef.current = abertas;

  // grade (uma vez)
  React.useEffect(() => {
    if (estado !== 'pronto' || !caixa.current || api.current) return;
    const linha = (p: { data?: LinhaGrade }) => (p.data && !p.data.__detalhe ? p.data : null);
    const colunas: ColDef<LinhaGrade>[] = [
      { headerName: 'Empresa', colId: 'empresa', flex: 2, minWidth: 220, valueGetter: (p) => linha(p)?.empresa ?? '',
        cellRenderer: (p: ICellRendererParams<LinhaGrade>) => {
          const l = linha(p); if (!l) return '';
          const w = document.createElement('span'); w.className = 'cs-empresa';
          const b = document.createElement('button'); b.type = 'button'; b.className = 'cs-expandir';
          const aberta = abertasRef.current.has(l.id); b.setAttribute('aria-expanded', String(aberta)); b.setAttribute('data-cs-expandir', l.id);
          b.setAttribute('aria-label', `${aberta ? 'Recolher' : 'Expandir'} ficha doadora e grafias de ${l.empresa}`); b.textContent = aberta ? '▾' : '▸';
          b.addEventListener('click', (e) => { e.stopPropagation(); alternarRef.current(l.id); });
          const t = document.createElement('span'); t.className = 'cs-empresa__nome'; t.textContent = l.empresa; t.title = l.empresa;
          w.append(b, t); return w; } },
      { headerName: 'ID da organização', colId: 'org', width: 140, valueGetter: (p) => linha(p)?.org_id ?? null, filter: 'agNumberColumnFilter',
        valueFormatter: (p) => (p.value === null || p.value === undefined ? '' : `#${p.value}`),
        tooltipValueGetter: (p) => { const l = linha(p); return l && l.cnpj_compartilhado_com.length ? `Mesmo CNPJ em: ${l.cnpj_compartilhado_com.map((x) => `#${x}`).join(', ')}` : null; },
        cellClassRules: { 'cs-org--compartilhado': (p) => !!linha(p)?.cnpj_compartilhado_com.length } },
      { headerName: 'Último ganho', colId: 'ganho', width: 136, valueGetter: (p) => linha(p)?.ultimo_ganho ?? null, valueFormatter: (p) => data(p.value as string | null), sort: 'desc' },
      { headerName: 'Campo', colId: 'campo', width: 140, valueGetter: (p) => linha(p)?.campo_rotulo ?? '' },
      { headerName: 'Atual', colId: 'atual', flex: 1, minWidth: 110, valueGetter: (p) => { const l = linha(p); return l ? (l.valor_anterior && l.valor_anterior.trim() ? l.valor_anterior : 'vazio') : ''; },
        cellClassRules: { 'cs-dim': (p) => { const l = linha(p); return !!l && !(l.valor_anterior && l.valor_anterior.trim()); } } },
      { headerName: 'Proposto', colId: 'proposto', flex: 2, minWidth: 220, valueGetter: (p) => { const l = linha(p); return l ? textoProposto(l) : ''; },
        tooltipValueGetter: (p) => { const l = linha(p); return l ? ROTULO_CLASSE[l.classificacao] : null; },
        cellClassRules: { 'cs-proposto': (p) => linha(p)?.classificacao === 'sugestao',
          'cs-dim': (p) => { const c = linha(p)?.classificacao; return !!c && c !== 'sugestao' && c !== 'fontes_divergem' && c !== 'nome_para_razao_revisar'; },
          'cs-divergem': (p) => { const c = linha(p)?.classificacao; return c === 'fontes_divergem' || c === 'nome_para_razao_revisar'; } } },
      { headerName: 'Origem', colId: 'origem', flex: 1, minWidth: 170, valueGetter: (p) => { const l = linha(p); return l ? textoOrigem(l) : ''; },
        tooltipValueGetter: (p) => { const l = linha(p); return l && l.classificacao === 'sugestao' && new Set(l.grafias.map((g) => g.origem)).size > 1 ? 'As fontes concordam (só caixa/espaços variam)' : null; } },
    ];
    api.current = criarGrade<LinhaGrade>(caixa.current, {
      columnDefs: colunas, rowData: [], getRowId: (p) => p.data.id, rowHeight: 32, headerHeight: 34, suppressCellFocus: false,
      isFullWidthRow: (p) => !!p.rowNode.data?.__detalhe,
      fullWidthCellRenderer: (p: ICellRendererParams<LinhaGrade>) => (p.data && p.data.__detalhe ? detalhe(p.data.pai) : document.createElement('div')),
      getRowHeight: (p) => (p.data?.__detalhe ? Math.max(132, 64 + 24 * Math.max(p.data.pai.grafias.length, 2) + (p.data.pai.cnpj_compartilhado_com.length ? 24 : 0)) : 32),
      onRowDoubleClicked: (p) => { if (p.data && !p.data.__detalhe) alternarRef.current(p.data.id); },
      // o detalhe não tem valor próprio: depois de QUALQUER ordenação ele volta para logo abaixo da linha-mãe (senão a ordenação o manda para o fim)
      postSortRows: (p) => {
        const det = new Map<string, (typeof p.nodes)[number]>(); const resto: typeof p.nodes = [];
        p.nodes.forEach((nd) => { const d = nd.data; if (d && d.__detalhe) det.set(d.pai.id, nd); else resto.push(nd); });
        if (!det.size) return;
        const out: typeof p.nodes = []; resto.forEach((nd) => { out.push(nd); const d = nd.data && !nd.data.__detalhe ? det.get(nd.data.id) : undefined; if (d) out.push(d); });
        p.nodes.splice(0, p.nodes.length, ...out);
      },
      overlayNoRowsTemplate: '<span class="cs-vazio">Nenhum campo neste filtro.</span>',
    }, (d) => (d.__detalhe ? null : abertasRef.current.has(d.id) ? 'expandida' : ['fontes_divergem', 'identidade_duvidosa', 'nome_para_razao_revisar', 'fonte_indisponivel'].includes(d.classificacao) ? 'pendente' : null));
    return () => { api.current?.destroy(); api.current = null; };
  }, [estado]);

  React.useEffect(() => { if (api.current) { api.current.setGridOption('rowData', linhasGrade); api.current.redrawRows(); } }, [linhasGrade, estado]);

  // altura: do topo da grade até o fim da janela; a grade rola por dentro (uma região de rolagem). 2º passo: encolhe o excesso do documento.
  React.useLayoutEffect(() => {
    if (estado !== 'pronto') return;
    const medir = () => {
      const t = caixa.current?.getBoundingClientRect().top ?? 0; const base = Math.max(280, Math.round(window.innerHeight - Math.max(0, t) - 4)); setAltura(base);
      requestAnimationFrame(() => requestAnimationFrame(() => { const excesso = document.documentElement.scrollHeight - window.innerHeight; if (excesso > 0) setAltura(Math.max(280, base - excesso)); }));
    };
    medir(); window.addEventListener('resize', medir); return () => window.removeEventListener('resize', medir);
  }, [estado, previa]);

  if (estado === 'carregando') return <div className="cs-estado" role="status">Carregando a prévia…</div>;
  if (estado === 'sem_lote') return (
    <div className="cs-estado" role="status" data-cs-sem-lote><strong>Nenhuma prévia disponível.</strong> A Revisão cadastral é restrita a nível 100; com acesso, gere a primeira prévia
      (só lê as fontes; nada é gravado no CRM nem comprado).{' '}
      <button type="button" className="cs-botao cs-botao--primario" onClick={() => carregar(true)} disabled={gerando} data-cs-gerar>{gerando ? 'Gerando…' : 'Gerar prévia'}</button></div>);
  if (estado === 'erro') return (
    <div className="cs-estado" role="alert"><strong>Não foi possível ler a prévia.</strong> <span className="cs-dim">({motivo})</span>{' '}
      <button type="button" className="cs-botao" onClick={() => carregar(false)}>Tentar novamente</button></div>);

  const lote = previa!.lote;
  const fontes = (Object.keys(ROTULO_FONTE) as (keyof Fontes)[]).filter((k) => lote.fontes?.[k]).map((k) => ({ k, rotulo: ROTULO_FONTE[k], estado: lote.fontes[k].estado, em: retrato(lote.fontes[k]) }));
  const falhas = fontes.filter((f) => f.estado !== 'ok');
  const custoOpc = decimal(lote.custo_opcional?.total);
  return (
    <div className="cs-tela" data-cs-tela="revisao-cadastral">
      <div className="cs-topo">
        <div className="cs-topo__linha">
          <div className="cs-titulo">
            <span className="cs-titulo__trilha">APIs para consulta</span>
            <h1 className="cs-titulo__h1">Revisão cadastral</h1>
            <span className="cs-selo" title="Fase de leitura: nada é gravado no CRM nem comprado">Só leitura</span>
          </div>
          <div className="cs-filtros" role="radiogroup" aria-label="Filtrar campos">
            {FILTROS.filter((f) => !f.soComCaso || (contagem.get(f.id) ?? 0) > 0).map((f) => (
              <button key={f.id} type="button" role="radio" aria-checked={filtro === f.id} className={`cs-chip${filtro === f.id ? ' cs-chip--ativo' : ''}`}
                onClick={() => setFiltro(f.id)} title={f.dica} data-cs-filtro={f.id}>
                {f.rotulo} <span className="cs-chip__n">{contagem.get(f.id) ?? 0}</span></button>))}
          </div>
          <div className="cs-acoes">
            <button type="button" className="cs-botao cs-botao--primario" onClick={() => carregar(true)} disabled={gerando} data-cs-gerar
              title="Lê de novo o Pipedrive, o Precifica e o legado (só leitura nas fontes) e cria um lote novo. Nada é gravado no CRM nem comprado.">{gerando ? 'Gerando…' : 'Gerar prévia'}</button>
          </div>
        </div>
        <div className="cs-faixa" data-cs-faixa aria-label="Resumo do lote">
          <div className="cs-kpi" data-cs-kpi="leitura" title={fontes.map((f) => `${f.rotulo}: ${f.estado}, retrato ${dataHora(f.em)}`).join('\n')}>
            <span className="cs-kpi__num cs-kpi__num--txt">{dataHora(lote.gerado_em)}</span>
            {aviso ? <span className="cs-kpi__rot cs-kpi__rot--aviso" role="status">{aviso}</span>
              : <span className="cs-kpi__rot">Leitura · {fontes.length - falhas.length}/{fontes.length} fontes · regras {lote.regras_versao}</span>}</div>
          <div className="cs-kpi" data-cs-kpi="estabelecimentos" title="Estabelecimentos: conta CNPJs"><span className="cs-kpi__num">{n(somaFilas(lote, 'cnpjs_no_lote'))}<span className="cs-kpi__un">CNPJs</span></span><span className="cs-kpi__rot">Estabelecimentos</span></div>
          <div className="cs-kpi" data-cs-kpi="fichas" title="Fichas de destino: conta fichas"><span className="cs-kpi__num">{n(somaFilas(lote, 'fichas'))}<span className="cs-kpi__un">fichas</span></span><span className="cs-kpi__rot">Fichas de destino</span></div>
          <div className="cs-kpi" data-cs-kpi="vazios" title="Campos vazios: conta campos"><span className="cs-kpi__num">{n(lote.totais?.destinos ?? null)}<span className="cs-kpi__un">campos</span></span><span className="cs-kpi__rot">Campos vazios</span></div>
          <div className="cs-kpi" data-cs-kpi="sugestoes" title="Com sugestão: conta campos"><span className="cs-kpi__num">{n(lote.totais?.sugestoes ?? null)}<span className="cs-kpi__un">campos</span></span><span className="cs-kpi__rot">Com sugestão</span></div>
          <div className="cs-kpi" data-cs-kpi="custo"><span className="cs-kpi__num">{reais(0)}</span>
            <span className="cs-kpi__rot" title="A prévia só lê (custo zero). A consulta paga é OPCIONAL e nunca é disparada aqui.">Prévia · opcional {n(lote.custo_opcional?.cnpjs_distintos ?? null)} CNPJs = {reais(custoOpc)}</span></div>
        </div>
        {(lote.completa === false || falhas.length > 0) && (
          <div className="cs-incompleta" role="alert" data-cs-incompleta>
            <strong>Prévia incompleta.</strong> {(falhas.length ? falhas : fontes).map((f) => `${f.rotulo}: ${f.estado === 'indisponivel' ? 'indisponível' : f.estado}`).join(' · ')}. Falha não conta como ausência.
          </div>)}
      </div>
      <div ref={caixa} className="cs-grade" style={{ height: altura }} data-cs-grade="ag" />
    </div>
  );
}
