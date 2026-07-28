// screens/Estrutura.tsx — hierarquia campanha → conjunto → anúncio (briefing §8–§10).
// @version 1.0.0  @created 2026-07-28
//
// O drill entre níveis é feito pelo App (estado campanhaSel/conjuntoSel):
// Campanhas → "Ver conjuntos" → Conjuntos (filtrados) → "Ver anúncios" → Anúncios.
import { useState } from 'react';
import { Filter, Layers, X } from 'lucide-react';
import { getService } from '../services/MetaAdsService';
import { useDados } from '../components/useDados';
import { MAGrid, type ColunaMA } from '../components/MAGrid';
import {
  Drawer, Secao, StatusBadge, fmtDec, fmtMoeda, fmtNumero, fmtPct,
} from '../components/ui';
import type { Anuncio, Campanha, Conjunto, FiltrosGlobais } from '../domain/types';

const resultado = (m: { leads: number; conversoes: number }, objetivo: string) =>
  objetivo === 'leads' ? `${fmtNumero(m.leads)} leads`
  : objetivo === 'conversao' ? `${fmtNumero(m.conversoes)} vendas`
  : `${fmtNumero(m.leads)} leads`;

// ── Campanhas (§8) ──────────────────────────────────────────────────
export function Campanhas({ filtros, aoVerConjuntos }: {
  filtros: FiltrosGlobais;
  aoVerConjuntos: (campanhaId: string) => void;
}) {
  const { dados, carregando } = useDados(
    () => getService().getCampanhas(filtros),
    [filtros.contaId, filtros.periodo, filtros.objetivo]
  );
  const [sel, setSel] = useState<Campanha | null>(null);

  const ativas = (dados ?? []).filter((c) => c.status === 'ativa').length;
  const problemas = (dados ?? []).filter((c) => c.diagnostico).length;

  const colunas: ColunaMA<Campanha>[] = [
    { id: 'nome', titulo: 'Campanha', valor: (c) => c.nome, largura: 250 },
    { id: 'objetivo', titulo: 'Objetivo', valor: (c) => c.objetivo, render: (c) => <StatusBadge valor={c.objetivo} />, alinhar: 'centro' },
    { id: 'status', titulo: 'Status', valor: (c) => c.status, render: (c) => <StatusBadge valor={c.status} />, alinhar: 'centro' },
    { id: 'inv', titulo: 'Investimento', valor: (c) => Math.round(c.investimento), render: (c) => fmtMoeda(c.investimento), alinhar: 'direita' },
    { id: 'orc', titulo: 'Orç. diário', valor: (c) => c.orcamentoDiario, render: (c) => `${fmtMoeda(c.orcamentoDiario)} · ${Math.round(c.orcamentoUtilizadoPct)}%`, alinhar: 'direita' },
    { id: 'res', titulo: 'Resultado', valor: (c) => (c.objetivo === 'conversao' ? c.conversoes : c.leads), render: (c) => resultado(c, c.objetivo), alinhar: 'direita' },
    { id: 'custo', titulo: 'CPL / CPA', valor: (c) => Math.round(c.cpl), render: (c) => (c.objetivo === 'conversao' ? fmtMoeda(c.cpa) : c.leads > 0 ? fmtMoeda(c.cpl) : '—'), alinhar: 'direita' },
    { id: 'ctr', titulo: 'CTR', valor: (c) => Math.round(c.ctr * 100) / 100, render: (c) => fmtPct(c.ctr), alinhar: 'direita' },
    { id: 'roas', titulo: 'ROAS', valor: (c) => Math.round(c.roas * 100) / 100, render: (c) => (c.receita > 0 ? fmtDec(c.roas) : '—'), alinhar: 'direita' },
  ];

  return (
    <div className="mads-tela">
      <div className="mads-chips">
        <span className="mads-chip"><strong>{dados?.length ?? 0}</strong> campanhas</span>
        <span className="mads-chip mads-chip-ok"><strong>{ativas}</strong> ativas</span>
        {problemas > 0 && <span className="mads-chip mads-chip-bad"><strong>{problemas}</strong> com diagnóstico</span>}
      </div>

      <Secao titulo="Campanhas" sub="clique na linha para métricas completas e diagnóstico">
        <MAGrid dados={dados ?? []} colunas={colunas} carregando={carregando}
          exportarNome="meta-campanhas" onLinha={setSel}
          vazio={{ titulo: 'Nenhuma campanha no filtro', detalhe: 'Ajuste conta, período ou objetivo no topo.' }} />
      </Secao>

      <Drawer titulo={sel?.nome ?? ''} aberto={!!sel} onFechar={() => setSel(null)}>
        {sel && (
          <div className="mads-det">
            <div className="mads-det-linha-status">
              <StatusBadge valor={sel.status} />
              <StatusBadge valor={sel.objetivo} />
            </div>
            {sel.diagnostico && (
              <div className="mads-diag">
                <strong>Diagnóstico</strong>
                <span>{sel.diagnostico}</span>
              </div>
            )}
            <div className="mads-det-grid">
              <div><span className="mads-det-rotulo">Investimento</span>{fmtMoeda(sel.investimento)}</div>
              <div><span className="mads-det-rotulo">Orçamento diário</span>{fmtMoeda(sel.orcamentoDiario)} ({Math.round(sel.orcamentoUtilizadoPct)}% usado)</div>
              <div><span className="mads-det-rotulo">Alcance</span>{fmtNumero(sel.alcance)}</div>
              <div><span className="mads-det-rotulo">Impressões</span>{fmtNumero(sel.impressoes)}</div>
              <div><span className="mads-det-rotulo">Frequência</span>{fmtDec(sel.frequencia)}</div>
              <div><span className="mads-det-rotulo">Cliques</span>{fmtNumero(sel.cliques)} (CTR {fmtPct(sel.ctr)})</div>
              <div><span className="mads-det-rotulo">CPC / CPM</span>{fmtMoeda(sel.cpc)} / {fmtMoeda(sel.cpm)}</div>
              <div><span className="mads-det-rotulo">Leads</span>{fmtNumero(sel.leads)}{sel.leads > 0 && ` (CPL ${fmtMoeda(sel.cpl)})`}</div>
              <div><span className="mads-det-rotulo">Conversões</span>{fmtNumero(sel.conversoes)}{sel.conversoes > 0 && ` (CPA ${fmtMoeda(sel.cpa)})`}</div>
              <div><span className="mads-det-rotulo">Receita / ROAS</span>{fmtMoeda(sel.receita)} / {fmtDec(sel.roas)}</div>
            </div>
            <button className="mads-btn mads-btn-primario" onClick={() => { aoVerConjuntos(sel.id); setSel(null); }}>
              <Layers size={13} aria-hidden /> Ver conjuntos desta campanha
            </button>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ── Conjuntos (§9) ──────────────────────────────────────────────────
export function Conjuntos({ filtros, campanhaId, aoLimpar, aoVerAnuncios }: {
  filtros: FiltrosGlobais;
  campanhaId: string | null;
  aoLimpar: () => void;
  aoVerAnuncios: (conjuntoId: string) => void;
}) {
  const { dados, carregando } = useDados(
    () => getService().getConjuntos(filtros, campanhaId ?? undefined),
    [filtros.contaId, filtros.periodo, campanhaId]
  );
  const [sel, setSel] = useState<Conjunto | null>(null);
  const nomeCampanha = dados?.[0]?.campanha;

  const colunas: ColunaMA<Conjunto>[] = [
    { id: 'nome', titulo: 'Conjunto (público)', valor: (c) => c.nome, largura: 230 },
    { id: 'campanha', titulo: 'Campanha', valor: (c) => c.campanha, largura: 210 },
    { id: 'status', titulo: 'Status', valor: (c) => c.status, render: (c) => <StatusBadge valor={c.status} />, alinhar: 'centro' },
    { id: 'lance', titulo: 'Lance', valor: (c) => c.estrategiaLance },
    { id: 'pos', titulo: 'Posicionamento', valor: (c) => c.posicionamento, render: (c) => <StatusBadge valor={c.posicionamento} />, alinhar: 'centro' },
    { id: 'inv', titulo: 'Investimento', valor: (c) => Math.round(c.investimento), render: (c) => fmtMoeda(c.investimento), alinhar: 'direita' },
    { id: 'leads', titulo: 'Leads', valor: (c) => c.leads, alinhar: 'direita' },
    { id: 'cpl', titulo: 'CPL', valor: (c) => Math.round(c.cpl), render: (c) => (c.leads > 0 ? fmtMoeda(c.cpl) : '—'), alinhar: 'direita' },
    { id: 'ctr', titulo: 'CTR', valor: (c) => Math.round(c.ctr * 100) / 100, render: (c) => fmtPct(c.ctr), alinhar: 'direita' },
    { id: 'freq', titulo: 'Freq.', valor: (c) => Math.round(c.frequencia * 10) / 10, render: (c) => fmtDec(c.frequencia), alinhar: 'direita' },
  ];

  return (
    <div className="mads-tela">
      {campanhaId && (
        <div className="mads-chips">
          <span className="mads-chip mads-chip-filtro">
            <Filter size={11} aria-hidden /> Campanha: <strong>{nomeCampanha ?? campanhaId}</strong>
            <button className="mads-icbtn" onClick={aoLimpar} title="Remover filtro"><X size={12} /></button>
          </span>
        </div>
      )}

      <Secao titulo="Conjuntos de anúncios" sub="público, estratégia de lance e entrega — clique para detalhar">
        <MAGrid dados={dados ?? []} colunas={colunas} carregando={carregando}
          exportarNome="meta-conjuntos" onLinha={setSel}
          vazio={{ titulo: 'Nenhum conjunto no filtro' }} />
      </Secao>

      <Drawer titulo={sel?.nome ?? ''} aberto={!!sel} onFechar={() => setSel(null)}>
        {sel && (
          <div className="mads-det">
            <div className="mads-det-linha-status"><StatusBadge valor={sel.status} /></div>
            <div className="mads-det-grid">
              <div><span className="mads-det-rotulo">Campanha</span>{sel.campanha}</div>
              <div><span className="mads-det-rotulo">Público</span>{sel.publico}</div>
              <div><span className="mads-det-rotulo">Estratégia de lance</span>{sel.estrategiaLance}</div>
              <div><span className="mads-det-rotulo">Posicionamento</span>{sel.posicionamento === 'automatico' ? 'Automático (Advantage+)' : 'Manual'}</div>
              <div><span className="mads-det-rotulo">Investimento</span>{fmtMoeda(sel.investimento)}</div>
              <div><span className="mads-det-rotulo">Alcance / Freq.</span>{fmtNumero(sel.alcance)} / {fmtDec(sel.frequencia)}</div>
              <div><span className="mads-det-rotulo">Leads / CPL</span>{fmtNumero(sel.leads)} / {sel.leads > 0 ? fmtMoeda(sel.cpl) : '—'}</div>
              <div><span className="mads-det-rotulo">CTR / CPC</span>{fmtPct(sel.ctr)} / {fmtMoeda(sel.cpc)}</div>
            </div>
            {sel.status === 'aprendizado_limitado' && (
              <div className="mads-diag">
                <strong>Aprendizado limitado</strong>
                <span>O conjunto não atinge ~50 conversões/semana. Caminhos típicos: consolidar conjuntos irmãos, ampliar público ou subir o evento de otimização no funil.</span>
              </div>
            )}
            <button className="mads-btn mads-btn-primario" onClick={() => { aoVerAnuncios(sel.id); setSel(null); }}>
              <Layers size={13} aria-hidden /> Ver anúncios deste conjunto
            </button>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ── Anúncios (§10) ──────────────────────────────────────────────────
export function Anuncios({ filtros, conjuntoId, aoLimpar }: {
  filtros: FiltrosGlobais;
  conjuntoId: string | null;
  aoLimpar: () => void;
}) {
  const { dados, carregando } = useDados(
    () => getService().getAnuncios(filtros, conjuntoId ?? undefined),
    [filtros.contaId, filtros.periodo, conjuntoId]
  );
  const nomeConjunto = dados?.[0]?.conjunto;

  const colunas: ColunaMA<Anuncio>[] = [
    { id: 'nome', titulo: 'Anúncio', valor: (a) => a.nome, largura: 240 },
    { id: 'formato', titulo: 'Formato', valor: (a) => a.formato, render: (a) => <StatusBadge valor={a.formato} />, alinhar: 'centro' },
    { id: 'campanha', titulo: 'Campanha', valor: (a) => a.campanha, largura: 200 },
    { id: 'status', titulo: 'Status', valor: (a) => a.status, render: (a) => <StatusBadge valor={a.status} />, alinhar: 'centro' },
    { id: 'qual', titulo: 'Qualidade', valor: (a) => a.qualidade, render: (a) => <StatusBadge valor={a.qualidade} />, alinhar: 'centro' },
    { id: 'inv', titulo: 'Investimento', valor: (a) => Math.round(a.investimento), render: (a) => fmtMoeda(a.investimento), alinhar: 'direita' },
    { id: 'cliques', titulo: 'Cliques', valor: (a) => a.cliques, render: (a) => fmtNumero(a.cliques), alinhar: 'direita' },
    { id: 'ctr', titulo: 'CTR', valor: (a) => Math.round(a.ctr * 100) / 100, render: (a) => fmtPct(a.ctr), alinhar: 'direita' },
    { id: 'leads', titulo: 'Leads', valor: (a) => a.leads, alinhar: 'direita' },
    { id: 'cpl', titulo: 'CPL', valor: (a) => Math.round(a.cpl), render: (a) => (a.leads > 0 ? fmtMoeda(a.cpl) : '—'), alinhar: 'direita' },
  ];

  return (
    <div className="mads-tela">
      {conjuntoId && (
        <div className="mads-chips">
          <span className="mads-chip mads-chip-filtro">
            <Filter size={11} aria-hidden /> Conjunto: <strong>{nomeConjunto ?? conjuntoId}</strong>
            <button className="mads-icbtn" onClick={aoLimpar} title="Remover filtro"><X size={12} /></button>
          </span>
        </div>
      )}

      <Secao titulo="Anúncios" sub="entrega, qualidade e custo por anúncio — o criativo em si vive na seção Criativos">
        <MAGrid dados={dados ?? []} colunas={colunas} carregando={carregando}
          exportarNome="meta-anuncios"
          vazio={{ titulo: 'Nenhum anúncio no filtro' }} />
      </Secao>
    </div>
  );
}
