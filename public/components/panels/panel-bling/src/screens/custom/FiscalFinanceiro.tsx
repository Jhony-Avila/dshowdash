// panel-bling/src/screens/custom/FiscalFinanceiro.tsx — Notas Fiscais e Fluxo de Caixa
// @version 1.0.0  @created 2026-07-30

import React from 'react';
import {
  DataGrid, EstadoGrid, ColunaGrid, GradeKpis, Kpi, Secao, BarraFiltros,
  EstadoErro, BlocoCarregando, Drawer, Badge, LinhaDoTempo, EtapaLinha,
  EstadoVazio, moeda, inteiro, data as fmtData,
} from '@shared';
import { api, RespostaRecurso } from '../../services/api';
import { useCarga, useDebounce } from '../../app/estado';
import { PropsTela } from '../generic/TelaCatalogo';
// A tela financeira reusa o MESMO componente D3 do fluxo empresarial —
// não existe um segundo Sankey no projeto.
import { SankeyD3 as SankeyFinanceiro } from '../../viz/D3';
import { numOuNulo, TEXTO_INDISPONIVEL, motivoIndisponivel } from '../../lib/ausencia';
import { Grafico, tokens, opcaoFunil } from '../../viz/Echarts';

const GRID_INICIAL: EstadoGrid = { ordenar: '', direcao: 'desc', pagina: 1, limite: 50, busca: '' };

/* ═══════════════════════ Notas Fiscais (§30, §31) ═══════════════════════ */

/**
 * Diagnóstico de rejeição (§30.3).
 * Causa provável e recomendação são conhecimento do operador fiscal, não vêm da
 * API. Ficam aqui, num mapa auditável, em vez de espalhadas pela interface.
 */
const DIAGNOSTICO: Record<string, { causa: string; recomendacao: string; campos: string[] }> = {
  '539': {
    causa: 'Já existe uma NF-e autorizada com a mesma numeração, mas chave de acesso diferente.',
    recomendacao: 'Verificar a numeração em uso e inutilizar a faixa duplicada antes de reemitir.',
    campos: ['número', 'série', 'chave de acesso'],
  },
  '204': {
    causa: 'A nota já foi transmitida e autorizada anteriormente.',
    recomendacao: 'Consultar a nota pela chave antes de reenviar — provavelmente já está autorizada.',
    campos: ['chave de acesso'],
  },
  '610': {
    causa: 'O total declarado não corresponde à soma dos itens (arredondamento ou desconto rateado).',
    recomendacao: 'Conferir desconto e frete rateados por item no pedido de origem.',
    campos: ['valor total', 'valor dos itens', 'desconto', 'frete'],
  },
  '778': {
    causa: 'O NCM informado no produto não existe na tabela vigente.',
    recomendacao: 'Corrigir o NCM no cadastro do produto — não apenas na nota.',
    campos: ['NCM', 'cadastro do produto'],
  },
  '225': {
    causa: 'O XML gerado não obedece ao schema exigido pela SEFAZ.',
    recomendacao: 'Verificar campos obrigatórios em branco no cadastro do cliente ou do produto.',
    campos: ['XML', 'cadastro do destinatário'],
  },
  '215': {
    causa: 'Campo obrigatório ausente no XML.',
    recomendacao: 'Completar o cadastro do destinatário (endereço, inscrição estadual) e reemitir.',
    campos: ['destinatário', 'endereço', 'inscrição estadual'],
  },
};

export function NotasFiscais({ filtros, aoMudarFiltros, larguraPainel }: PropsTela) {
  const [grid, setGrid] = React.useState(GRID_INICIAL);
  const [nota, setNota] = React.useState<Record<string, unknown> | null>(null);
  const busca = useDebounce(grid.busca);

  const params = React.useMemo(() => ({
    periodo: filtros.periodo, situacao: filtros.situacao, q: busca,
    ordenar: grid.ordenar, direcao: grid.direcao, pagina: grid.pagina, limite: grid.limite,
  }), [filtros, busca, grid]);

  const carga = useCarga<RespostaRecurso>(s => api.recurso('invoices', params, s), [JSON.stringify(params)]);
  const funil = useCarga<any>(s => api.funilFiscal({ periodo: filtros.periodo }, s), [filtros.periodo]);
  const t = React.useMemo(() => tokens(document.querySelector('[data-bl-root]')), []);

  const linhas = carga.dados?.itens ?? [];
  const facetas = carga.dados?.facetas ?? {};
  const totais = carga.dados?.totais ?? {};
  const conta = (s: string) => facetas.situacao?.find(x => x.valor === s)?.quantidade ?? 0;

  // Erros recorrentes: agrupa a página por código e ordena por frequência.
  //
  // ⚠️ TODO hook fica ACIMA de qualquer `return` condicional. Colocar um useMemo
  // depois do early-return de erro faz a contagem de hooks mudar entre renders e
  // derruba a tela com "React error #310". Aconteceu aqui em 2026-07-30 — o build
  // e o tsc passaram; só o navegador acusou.
  const recorrentes = React.useMemo(() => {
    const m = new Map<string, { codigo: string; mensagem: string; n: number }>();
    linhas.forEach(l => {
      const c = l.erro_codigo as string | null;
      if (!c) return;
      const at = m.get(c) ?? { codigo: c, mensagem: String(l.erro_mensagem ?? ''), n: 0 };
      at.n += 1;
      m.set(c, at);
    });
    return [...m.values()].sort((a, b) => b.n - a.n);
  }, [linhas]);

  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      aoTentarNovamente={carga.recarregar} />;
  }

  const duas = larguraPainel >= 1080;

  return (
    <div style={{ minWidth: 0 }}>
      <BarraFiltros filtros={filtros as any} aoMudar={aoMudarFiltros as any}
        facetas={facetas} camposExtras={['situacao']}
        aoLimpar={() => aoMudarFiltros({ periodo: '30d', situacao: '' })} />

      <GradeKpis kpis={[
        // 115C trilha B (P10.1): "Emitidas" é a contagem FISCAL do servidor (b8e4309b), não o meta.total da paginação — com o filtro
        // "situação não mapeada" as não mapeadas viravam "Emitidas". Campo ausente ou não numérico → null ("Indisponível", a convenção do
        // GradeKpis para ausência), nunca 0 nem meta.total.
        kpi('emitidas', 'Emitidas', emitidasFiscais(carga.dados), 'inteiro', 'ok',
          emitidasFiscais(carga.dados) === null && carga.dados ? 'A resposta não trouxe a contagem fiscal de notas emitidas' : null),
        kpi('autorizadas', 'Autorizadas', conta('autorizada'), 'inteiro'),
        kpi('pendentes', 'Pendentes', conta('pendente'), 'inteiro', conta('pendente') > 0 ? 'atencao' : 'ok'),
        kpi('rejeitadas', 'Rejeitadas', conta('rejeitada'), 'inteiro', conta('rejeitada') > 0 ? 'critico' : 'ok'),
        kpi('canceladas', 'Canceladas', conta('cancelada'), 'inteiro'),
        kpi('inutilizadas', 'Inutilizadas', conta('inutilizada'), 'inteiro'),
        // Ausência ≠ zero: total desconhecido é "—" (a fonte está no ar), nunca R$ 0,00.
        { ...kpi('valor', 'Valor emitido', numOuNulo(totais.valor), 'moeda'), rotuloNulo: '—' },
      ]} />

      <div style={{ display: 'grid', gridTemplateColumns: duas ? '1fr 1fr' : '1fr', gap: 14, marginTop: 18 }}>
        <section style={{ minWidth: 0 }}>
          <h2 className="bl-titulo-secao">Funil fiscal</h2>
          <div className="bl-cartao" style={{ padding: '12px 14px' }}>
            {funil.dados ? (
              <>
                <Grafico altura={230} opcao={opcaoFunil(t, funil.dados.etapas)}
                  descricao="Do pedido aprovado até a nota enviada, com a perda de cada etapa." />
                <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, fontSize: 11.5 }}>
                  {funil.dados.etapas.filter((e: any) => e.perda > 0).map((e: any) => (
                    <li key={e.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--bl-texto-2)' }}>
                      <span>perda em “{e.rotulo}”</span>
                      <strong style={{ color: 'var(--bl-erro)' }}>{e.perda} pedido(s)</strong>
                    </li>
                  ))}
                </ul>
              </>
            ) : <BlocoCarregando linhas={4} />}
          </div>
        </section>

        <section style={{ minWidth: 0 }}>
          <h2 className="bl-titulo-secao">Erros recorrentes</h2>
          <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
            {recorrentes.length === 0 ? (
              <div style={{ padding: '28px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--bl-texto-2)' }}>
                Nenhuma rejeição nos registros carregados.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {recorrentes.slice(0, 5).map(r => {
                  const d = DIAGNOSTICO[r.codigo];
                  return (
                    <div key={r.codigo} style={{
                      padding: '9px 11px', borderRadius: 'var(--bl-raio-sm)',
                      background: 'var(--bl-superficie-2)', border: '1px solid var(--bl-borda)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{
                          fontFamily: 'var(--bl-fonte-mono)', fontSize: 11, fontWeight: 700,
                          padding: '1px 6px', borderRadius: 4,
                          background: 'var(--bl-erro-bg)', color: 'var(--bl-erro)',
                        }}>{r.codigo}</span>
                        <span style={{ fontSize: 12, flex: 1 }}>{r.mensagem}</span>
                        <span style={{ fontSize: 11, color: 'var(--bl-texto-3)' }}>{r.n}×</span>
                      </div>
                      {d && (
                        <div style={{ fontSize: 11, color: 'var(--bl-texto-2)', marginTop: 4 }}>
                          <div><strong>Causa provável:</strong> {d.causa}</div>
                          <div style={{ marginTop: 2 }}><strong>O que fazer:</strong> {d.recomendacao}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <Secao titulo="Notas emitidas" descricao="Clique numa linha para abrir o diagnóstico completo.">
        <DataGrid
          colunas={(carga.dados?.colunas ?? []) as ColunaGrid[]}
          linhas={linhas}
          total={carga.meta?.total ?? 0}
          estado={grid}
          aoMudarEstado={p => setGrid(g => ({ ...g, ...p }))}
          carregando={carga.carregando}
          totais={totais}
          chavePreferencias="notas-fiscais"
          aoAbrirLinha={setNota}
          selecionaveis
          alturaMax={larguraPainel < 980 ? 420 : 520}
        />
      </Secao>

      <Drawer
        aberto={nota !== null}
        titulo={nota ? `Nota ${nota.numero} · série ${nota.serie}` : ''}
        subtitulo={nota ? String(nota.cliente) : undefined}
        aoFechar={() => setNota(null)}
      >
        {nota && <DetalheNota nota={nota} />}
      </Drawer>
    </div>
  );
}

function DetalheNota({ nota }: { nota: Record<string, unknown> }) {
  const codigo = nota.erro_codigo as string | null;
  const d = codigo ? DIAGNOSTICO[codigo] : null;

  const etapas: EtapaLinha[] = [
    { id: 'gerada', rotulo: 'Nota gerada', quando: fmtData(String(nota.emissao)), estado: 'concluida' },
    { id: 'transmitida', rotulo: 'Transmitida à SEFAZ',
      estado: nota.situacao === 'pendente' ? 'atual' : 'concluida' },
    { id: 'autorizada', rotulo: 'Autorizada',
      estado: nota.situacao === 'autorizada' ? 'concluida'
        : nota.situacao === 'rejeitada' ? 'falha' : 'pendente',
      detalhe: nota.situacao === 'rejeitada' ? String(nota.erro_mensagem ?? '') : undefined },
    { id: 'documentos', rotulo: 'DANFE e XML disponíveis',
      estado: nota.danfe ? 'concluida' : 'pendente' },
  ];

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(132px,1fr))', gap: 12 }}>
        <Campo rotulo="Situação" valor={<Badge info={nota.situacao_info as any} />} />
        <Campo rotulo="Emissão" valor={fmtData(String(nota.emissao))} />
        <Campo rotulo="Valor" valor={moeda(Number(nota.valor))} />
        <Campo rotulo="Pedido" valor={String(nota.pedido ?? '—')} />
        <Campo rotulo="Finalidade" valor={String(nota.finalidade ?? '—')} />
        <Campo rotulo="Tentativas" valor={inteiro(Number(nota.tentativas ?? 0))} />
      </div>

      <div>
        <div className="bl-titulo-secao">Chave de acesso</div>
        <div style={{
          fontFamily: 'var(--bl-fonte-mono)', fontSize: 11.5, wordBreak: 'break-all',
          padding: '8px 10px', background: 'var(--bl-superficie-2)',
          border: '1px solid var(--bl-borda)', borderRadius: 'var(--bl-raio-sm)',
        }}>
          {String(nota.chave ?? '—')}
        </div>
      </div>

      <div>
        <div className="bl-titulo-secao">Andamento</div>
        <LinhaDoTempo etapas={etapas} />
      </div>

      {codigo && (
        <div>
          <div className="bl-titulo-secao">Diagnóstico da rejeição</div>
          <div style={{
            padding: 12, borderRadius: 'var(--bl-raio-sm)',
            background: 'var(--bl-erro-bg)', border: '1px solid var(--bl-erro)',
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span style={{
                fontFamily: 'var(--bl-fonte-mono)', fontSize: 12, fontWeight: 700,
                padding: '2px 7px', borderRadius: 4,
                background: 'var(--bl-erro)', color: '#fff',
              }}>{codigo}</span>
              <span style={{ fontSize: 12.5 }}>{String(nota.erro_mensagem ?? '')}</span>
            </div>
            {d ? (
              <div style={{ fontSize: 12, display: 'grid', gap: 6 }}>
                <div><strong>Causa provável:</strong> {d.causa}</div>
                <div><strong>Recomendação:</strong> {d.recomendacao}</div>
                <div><strong>Campos relacionados:</strong> {d.campos.join(', ')}</div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--bl-texto-2)' }}>
                Código sem diagnóstico mapeado. Consulte a tabela de rejeições da SEFAZ.
              </div>
            )}
          </div>
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--bl-texto-3)', margin: 0 }}>
        Reenvio e cancelamento de nota são operações de escrita e entram apenas na Fase 6,
        após homologação.
      </p>
    </div>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10.5, color: 'var(--bl-texto-3)', marginBottom: 2 }}>{rotulo}</div>
      <div style={{ fontSize: 12.5 }}>{valor}</div>
    </div>
  );
}

/** 115C (P10.1): contagem fiscal "Emitidas" da resposta de /resources/invoices; ausência → null ("Indisponível"), nunca 0. */
function emitidasFiscais(dados: RespostaRecurso | null | undefined): number | null {
  const v = dados?.contagem_fiscal?.emitidas;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function kpi(id: string, rotulo: string, valor: number | null, formato: string,
  semantica: 'ok' | 'atencao' | 'critico' = 'ok', tooltip: string | null = null): Kpi {
  return {
    id, rotulo, valor, formato: formato as any, variacao: null, tendencia: 'estavel',
    sparkline: null, drilldown: null, semantica, tooltip,
  };
}

/* ═══════════════════════ Fluxo de Caixa (§34, §35) ═══════════════════════ */

export function FluxoCaixa({ filtros, aoMudarFiltros, larguraPainel }: PropsTela) {
  const [granularidade, setGranularidade] = React.useState<'dia' | 'semana' | 'mes'>('dia');

  const params = React.useMemo(() => ({
    periodo: filtros.periodo, granularidade,
  }), [filtros.periodo, granularidade]);

  const carga = useCarga<any>(s => api.fluxoCaixa(params, s), [JSON.stringify(params)]);
  const sankey = useCarga<any>(s => api.fluxoFinanceiro({ periodo: filtros.periodo }, s), [filtros.periodo]);
  const t = React.useMemo(() => tokens(document.querySelector('[data-bl-root]')), []);

  const pontos: any[] = carga.dados?.pontos ?? [];
  const r = carga.dados?.resumo ?? {};
  // DSHOW-012 (origem: Codex DSHOW-011): disponibilidade da fonte vinda da API (zero legítimo ≠ sem dados ≠ indisponível)
  const disp = carga.dados?.disponibilidade ?? null;
  const dispEntradas: string = disp?.entradas?.estado ?? 'ok';
  const dicaEntradas = dispEntradas === 'ok' ? null : (dispEntradas === 'indisponivel' ? 'Indisponível nesta fonte' : dispEntradas === 'parcial' ? 'Coleta parcial' : 'Sem dados nesta fonte');

  // ⚠️ useMemo ACIMA dos returns condicionais — ver nota em NotasFiscais.
  const opcao = React.useMemo(() => ({
    color: [t.sucesso, t.erro, t.serie[1], t.texto3],
    grid: { left: 8, right: 8, top: 34, bottom: 40, containLabel: true },
    legend: { textStyle: { color: t.texto2, fontSize: 11 }, top: 0, itemHeight: 8, itemWidth: 14 },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      backgroundColor: t.fundo, borderColor: t.borda,
      textStyle: { color: t.texto, fontSize: 11.5 },
      formatter: (ps: any[]) => {
        const i = ps[0]?.dataIndex ?? 0;
        const p = pontos[i];
        const fm = (v: number) => new Intl.NumberFormat('pt-BR',
          { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v);
        return `<div style="font-weight:600;margin-bottom:4px">${p.data}${p.projetado ? ' (projetado)' : ''}</div>
          entradas: ${fm(p.projetado ? p.entradas_previsto : p.entradas_realizado)}<br/>
          saídas: ${fm(p.projetado ? p.saidas_previsto : p.saidas_realizado)}<br/>
          saldo do dia: ${fm(p.saldo_dia)}<br/>
          <strong>acumulado: ${fm(p.saldo_acumulado)}</strong>`;
      },
    },
    dataZoom: [{ type: 'inside' }, {
      type: 'slider', height: 15, bottom: 4, borderColor: t.borda,
      fillerColor: `${t.verde}22`, textStyle: { color: t.texto3, fontSize: 9 },
    }],
    xAxis: {
      type: 'category', data: pontos.map(p => p.data),
      axisLine: { lineStyle: { color: t.borda } }, axisTick: { show: false },
      axisLabel: { color: t.texto3, fontSize: 10 }, splitLine: { show: false },
    },
    yAxis: [
      { type: 'value', axisLine: { lineStyle: { color: t.borda } },
        splitLine: { lineStyle: { color: t.borda, type: 'dashed' } },
        axisLabel: { color: t.texto3, fontSize: 10,
          formatter: (v: number) => new Intl.NumberFormat('pt-BR',
            { notation: 'compact', maximumFractionDigits: 1 }).format(v) } },
    ],
    series: [
      { name: 'Entradas', type: 'bar', stack: 'mov', barMaxWidth: 22,
        data: pontos.map(p => p.projetado ? p.entradas_previsto : p.entradas_realizado),
        itemStyle: { opacity: 0.9 } },
      { name: 'Saídas', type: 'bar', stack: 'mov', barMaxWidth: 22,
        data: pontos.map(p => -(p.projetado ? p.saidas_previsto : p.saidas_realizado)),
        itemStyle: { opacity: 0.9 } },
      { name: 'Saldo acumulado', type: 'line', smooth: true, symbol: 'none',
        lineStyle: { width: 2 }, data: pontos.map(p => p.saldo_acumulado) },
      { name: 'Projetado', type: 'line', symbol: 'none', lineStyle: { width: 0 },
        data: pontos.map(p => p.projetado ? p.saldo_acumulado : null),
        areaStyle: { color: t.texto3, opacity: .07 } },
    ],
  }), [pontos, t]);

  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      aoTentarNovamente={carga.recarregar} />;
  }
  if (!carga.dados) return <BlocoCarregando linhas={8} rotulo="Carregando fluxo de caixa" />;

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <BarraFiltros filtros={filtros as any} aoMudar={aoMudarFiltros as any}
          aoLimpar={() => aoMudarFiltros({ periodo: '30d' })} />
        <div role="group" aria-label="Granularidade" style={{ display: 'flex', gap: 2 }}>
          {(['dia', 'semana', 'mes'] as const).map(g => (
            <button key={g} type="button" className="bl-botao" onClick={() => setGranularidade(g)}
              aria-pressed={granularidade === g}
              style={{
                height: 28, fontSize: 11.5,
                background: granularidade === g ? 'var(--bl-verde-suave)' : undefined,
                borderColor: granularidade === g ? 'var(--bl-verde-borda)' : undefined,
                color: granularidade === g ? 'var(--bl-verde)' : undefined,
              }}>
              {g === 'dia' ? 'Diário' : g === 'semana' ? 'Semanal' : 'Mensal'}
            </button>
          ))}
        </div>
      </div>

      {dispEntradas !== 'ok' && (
        <div role="status" style={{ margin: '0 0 10px', padding: '8px 12px', borderRadius: 8,
          background: 'var(--bl-fundo-2)', color: 'var(--bl-texto-2)', fontSize: 13 }}>
          {dispEntradas === 'indisponivel'
            ? <>Entradas indisponíveis nesta fonte: {disp?.entradas?.motivo ?? 'contas a receber desativadas'}{disp?.entradas?.fonte ? <> (fonte oficial: {disp.entradas.fonte})</> : null}. O saldo fica incompleto; as saídas continuam reais.</>
            : dispEntradas === 'parcial'
              ? <>Entradas parciais: a última coleta de contas a receber não foi concluída. O saldo fica incompleto; as saídas continuam reais.</>
              : <>Entradas ainda sem dados nesta fonte (nunca sincronizadas). O saldo fica incompleto; as saídas continuam reais.</>}
        </div>
      )}
      {disp?.realizado?.estado === 'aproximado' && (
        <div role="note" style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--bl-texto-3)' }}>
          Realizado agrupado pelo vencimento: o espelho do Bling ainda não guarda a data de liquidação. Previsto = vencimento.
        </div>
      )}
      <GradeKpis kpis={[
        kpi('e_real', 'Entradas realizadas', r.entradas_realizado ?? null, 'moeda', 'ok', dicaEntradas),
        kpi('e_prev', 'Entradas previstas', r.entradas_previsto ?? null, 'moeda', 'ok', dicaEntradas),
        kpi('s_real', 'Saídas realizadas', r.saidas_realizado ?? 0, 'moeda'),
        kpi('s_prev', 'Saídas previstas', r.saidas_previsto ?? 0, 'moeda'),
        kpi('saldo', 'Saldo final do período', r.saldo_final ?? null, 'moeda',
          r.saldo_final == null ? 'atencao' : (r.saldo_final < 0 ? 'critico' : 'ok'),
          r.saldo_final == null ? 'Incompleto: as entradas não estão disponíveis nesta fonte.' : null),
      ]} />

      <Secao titulo="Entradas, saídas e saldo"
        descricao="Até hoje o saldo acumula pelo realizado; a partir de hoje, pelo previsto.">
        <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
          <Grafico altura={larguraPainel < 980 ? 260 : 320} opcao={opcao}
            descricao="Fluxo de caixa com entradas, saídas e saldo acumulado, separando realizado de projetado." />
        </div>
      </Secao>

      <Secao titulo="Para onde vai o valor"
        descricao="Do canal de venda à margem, mostrando onde o valor é reduzido.">
        <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
          {sankey.dados ? (
            <>
              {/* DSHOW-115: "indisponível" SÓ pelo campo explícito do backend (`indisponivel` com motivo). Sem nós e sem `indisponivel` =
                  período com valores CONHECIDOS e zerados — tela própria, nunca "indisponível" deduzido de zeros. */}
              {sankey.dados.nos.length === 0 && fluxoMarcadoIndisponivel(sankey.dados)
                ? <span data-bl-fluxo="indisponivel"><EstadoVazio titulo="Fluxo indisponível" descricao={textoFluxoIndisponivel(sankey.dados)} /></span>
                : sankey.dados.nos.length === 0
                  ? <span data-bl-fluxo="zerado"><EstadoVazio titulo="Nenhum valor no período" descricao="As vendas do período foram lidas por completo e somam zero: não há valor para distribuir (zero conhecido, não é falta de dado)." /></span>
                  : <SankeyFinanceiro dados={sankey.dados} altura={larguraPainel < 980 ? 260 : 320} />}
              {sankey.dados.nos.length > 0 && (sankey.dados.custo_desconhecido || motivoIndisponivel((sankey.dados as any).indisponivel)) && (
              <p data-bl-aviso="fluxo-custo-desconhecido" style={{ fontSize: 12, color: 'var(--bl-texto-2)', margin: '8px 0 0' }}>
                {motivoIndisponivel((sankey.dados as any).indisponivel) === 'valores_desconhecidos'
                  ? TEXTO_INDISPONIVEL.valores_desconhecidos
                  : 'Parte dos pedidos tem custo de produto desconhecido: o fluxo não mostra custo nem margem (não é zero).'}
              </p>
              )}
              {sankey.dados.nos.length > 0 && Array.isArray((sankey.dados as any).links_zero) && (sankey.dados as any).links_zero.length > 0 && (
              <p data-bl-aviso="fluxo-links-zero" style={{ fontSize: 12, color: 'var(--bl-texto-3)', margin: '6px 0 0' }}>
                Zero no período (valor conhecido): {(sankey.dados as any).links_zero.map((l: { origem: string; destino: string }) => `${l.origem} → ${l.destino}`).join(' · ')}.
              </p>
              )}
              {/* 32e46b62: ligações com valor desconhecido NUNCA somem em silêncio — cada uma é listada (não é zero) */}
              {Array.isArray((sankey.dados as any).links_desconhecidos) && (sankey.dados as any).links_desconhecidos.length > 0 && (
              <p data-bl-aviso="fluxo-links-desconhecidos" style={{ fontSize: 12, color: 'var(--bl-texto-2)', margin: '6px 0 0' }}>
                Valor desconhecido (fora do desenho, não é zero): {(sankey.dados as any).links_desconhecidos
                  .map((l: { origem: string; destino: string }) => `${l.origem} → ${l.destino}`).join(' · ')}.
              </p>
              )}
              {!sankey.dados.custo_desconhecido && !(sankey.dados as any).indisponivel && sankey.dados.prejuizo_total > 0 && (
                <div style={{
                  marginTop: 10, padding: '7px 10px', fontSize: 11.5,
                  borderRadius: 'var(--bl-raio-sm)', background: 'var(--bl-erro-bg)',
                  color: 'var(--bl-erro)', border: '1px solid var(--bl-erro)',
                }}>
                  O resultado do período é negativo em {moeda(sankey.dados.prejuizo_total)} —
                  por isso não há nó de margem no fluxo.
                </div>
              )}
              <p style={{ fontSize: 10.5, color: 'var(--bl-texto-3)', margin: '8px 0 0' }}>
                {sankey.dados.nota}
              </p>
            </>
          ) : <BlocoCarregando linhas={4} />}
        </div>
      </Secao>
    </div>
  );
}

/** Fluxo "indisponível" SÓ pelos indicadores EXPLÍCITOS do backend (DSHOW-115, B a03ec6cd): `fluxo_indisponivel` / `fluxo_zerado`.
 *  Backend sem esses campos (anterior ao a03ec6cd): `indisponivel` com qualquer valor, ou ligações desconhecidas. Nunca deduzido de zeros. */
function fluxoMarcadoIndisponivel(d: unknown): boolean {
  const x = d as { indisponivel?: unknown; links_desconhecidos?: unknown; fluxo_indisponivel?: unknown; fluxo_zerado?: unknown };
  if (x.fluxo_indisponivel === true) return true;
  if (x.fluxo_zerado === true) return false;
  if (typeof x.fluxo_indisponivel === 'boolean') return false;   // contrato novo: false explícito = não indisponível
  return (x.indisponivel !== null && x.indisponivel !== undefined && x.indisponivel !== '')
    || (Array.isArray(x.links_desconhecidos) && x.links_desconhecidos.length > 0);
}
/** Texto do fluxo indisponível: o motivo do backend quando vem (`motivo_indisponivel`, ex.: leitura sem cobertura do período). */
function textoFluxoIndisponivel(d: unknown): string {
  const x = d as { indisponivel?: unknown; motivo_indisponivel?: unknown };
  const m = motivoIndisponivel(x.indisponivel);
  if (m) return TEXTO_INDISPONIVEL[m];
  if (x.indisponivel === 'leitura_sem_cobertura') {
    return `A leitura dos pedidos do Bling não cobre o período inteiro${typeof x.motivo_indisponivel === 'string' && x.motivo_indisponivel ? ` (${x.motivo_indisponivel})` : ''}: o fluxo não é desenhado e não é zero.`;
  }
  return 'O Bling não informou todos os valores do período: o fluxo não é desenhado (não é zero).';
}
