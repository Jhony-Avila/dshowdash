// screens/Publicos.tsx — públicos com sobreposição/saturação (briefing §13)
// e posicionamentos (§14).
// @version 1.0.0  @created 2026-07-28
import { useState } from 'react';
import { Users } from 'lucide-react';
import { getService } from '../services/MetaAdsService';
import { useDados } from '../components/useDados';
import { MAGrid, type ColunaMA } from '../components/MAGrid';
import {
  Barras, Drawer, Secao, fmtDec, fmtMoeda, fmtNumero, fmtPct,
} from '../components/ui';
import type { FiltrosGlobais, Posicionamento, Publico } from '../domain/types';

const TIPO_ROTULO: Record<Publico['tipo'], string> = {
  salvo: 'Salvo', personalizado: 'Personalizado', semelhante: 'Semelhante (LAL)', remarketing: 'Remarketing',
};
const PLATAFORMA_ROTULO: Record<Posicionamento['plataforma'], string> = {
  facebook: 'Facebook', instagram: 'Instagram', messenger: 'Messenger', audience_network: 'Audience Network',
};

// ── Públicos (§13) ──────────────────────────────────────────────────
export function Publicos({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando } = useDados(
    () => getService().getPublicos(filtros),
    [filtros.contaId, filtros.periodo]
  );
  const [sel, setSel] = useState<Publico | null>(null);

  const saturados = (dados ?? []).filter((p) => p.saturacaoPct >= 60).length;

  const colunas: ColunaMA<Publico>[] = [
    { id: 'nome', titulo: 'Público', valor: (p) => p.nome, largura: 240 },
    { id: 'tipo', titulo: 'Tipo', valor: (p) => TIPO_ROTULO[p.tipo], alinhar: 'centro' },
    { id: 'tam', titulo: 'Tamanho estimado', valor: (p) => p.tamanho, render: (p) => fmtNumero(p.tamanho), alinhar: 'direita' },
    {
      id: 'sat', titulo: 'Saturação', valor: (p) => p.saturacaoPct, alinhar: 'direita',
      render: (p) => <span className={p.saturacaoPct >= 60 ? 'mads-neg' : p.saturacaoPct >= 40 ? 'mads-warn-txt' : undefined}>{p.saturacaoPct}%</span>,
    },
    { id: 'freq', titulo: 'Freq.', valor: (p) => Math.round(p.frequencia * 10) / 10, render: (p) => fmtDec(p.frequencia), alinhar: 'direita' },
    { id: 'inv', titulo: 'Investimento', valor: (p) => Math.round(p.investimento), render: (p) => fmtMoeda(p.investimento), alinhar: 'direita' },
    { id: 'leads', titulo: 'Leads', valor: (p) => p.leads, alinhar: 'direita' },
    { id: 'cpl', titulo: 'CPL', valor: (p) => Math.round(p.cpl), render: (p) => (p.leads > 0 ? fmtMoeda(p.cpl) : '—'), alinhar: 'direita' },
  ];

  return (
    <div className="mads-tela">
      <div className="mads-chips">
        <span className="mads-chip"><strong>{dados?.length ?? 0}</strong> públicos em uso</span>
        {saturados > 0 && <span className="mads-chip mads-chip-bad"><strong>{saturados}</strong> saturando (≥60%)</span>}
      </div>

      <Secao titulo="Públicos" sub="tamanho, saturação e sobreposição — clique para ver com quem o público disputa leilão">
        <MAGrid dados={dados ?? []} colunas={colunas} carregando={carregando}
          exportarNome="meta-publicos" onLinha={setSel}
          vazio={{ titulo: 'Nenhum público no filtro' }} />
      </Secao>

      <Drawer titulo={sel?.nome ?? ''} aberto={!!sel} onFechar={() => setSel(null)}>
        {sel && (
          <div className="mads-det">
            <div className="mads-det-grid">
              <div><span className="mads-det-rotulo">Tipo</span>{TIPO_ROTULO[sel.tipo]}</div>
              <div><span className="mads-det-rotulo">Tamanho estimado</span>{fmtNumero(sel.tamanho)}</div>
              <div><span className="mads-det-rotulo">Saturação</span>{sel.saturacaoPct}%</div>
              <div><span className="mads-det-rotulo">Frequência</span>{fmtDec(sel.frequencia)}</div>
              <div><span className="mads-det-rotulo">Investimento</span>{fmtMoeda(sel.investimento)}</div>
              <div><span className="mads-det-rotulo">Leads / CPL</span>{fmtNumero(sel.leads)} / {sel.leads > 0 ? fmtMoeda(sel.cpl) : '—'}</div>
            </div>

            <h4 className="mads-det-h"><Users size={14} aria-hidden /> Sobreposição com outros públicos</h4>
            <p className="mads-det-nota">
              Sobreposição alta significa que conjuntos diferentes disputam as mesmas pessoas no leilão,
              inflando o custo. Acima de ~30%, considere consolidar os conjuntos ou excluir um público do outro.
            </p>
            <div className="mads-barras">
              {sel.sobreposicao.map((s) => (
                <div key={s.com} className="mads-barra-row">
                  <span className="mads-barra-rotulo" title={s.com}>{s.com}</span>
                  <span className="mads-barra-track" aria-hidden>
                    <span className={`mads-barra-fill${s.pct >= 30 ? ' is-bad' : ''}`} style={{ width: `${Math.min(100, s.pct)}%` }} />
                  </span>
                  <span className={`mads-barra-valor${s.pct >= 30 ? ' mads-neg' : ''}`}>{s.pct}%</span>
                </div>
              ))}
            </div>

            {sel.saturacaoPct >= 60 && (
              <div className="mads-diag">
                <strong>Público saturando</strong>
                <span>Frequência e CPL tendem a subir. Caminhos: ampliar o percentual do semelhante, abrir a segmentação ou renovar criativos.</span>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ── Posicionamentos (§14) ───────────────────────────────────────────
export function Posicionamentos({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando } = useDados(
    () => getService().getPosicionamentos(filtros),
    [filtros.contaId, filtros.periodo, filtros.objetivo]
  );

  const ordenados = [...(dados ?? [])].sort((a, b) => b.investimento - a.investimento);

  const colunas: ColunaMA<Posicionamento>[] = [
    { id: 'nome', titulo: 'Posicionamento', valor: (p) => p.nome, largura: 190 },
    { id: 'plat', titulo: 'Plataforma', valor: (p) => PLATAFORMA_ROTULO[p.plataforma], alinhar: 'centro' },
    { id: 'inv', titulo: 'Investimento', valor: (p) => Math.round(p.investimento), render: (p) => fmtMoeda(p.investimento), alinhar: 'direita' },
    { id: 'imp', titulo: 'Impressões', valor: (p) => p.impressoes, render: (p) => fmtNumero(p.impressoes), alinhar: 'direita' },
    { id: 'cliques', titulo: 'Cliques', valor: (p) => p.cliques, render: (p) => fmtNumero(p.cliques), alinhar: 'direita' },
    { id: 'ctr', titulo: 'CTR', valor: (p) => Math.round(p.ctr * 100) / 100, render: (p) => fmtPct(p.ctr), alinhar: 'direita' },
    { id: 'cpc', titulo: 'CPC', valor: (p) => Math.round(p.cpc * 100) / 100, render: (p) => fmtMoeda(p.cpc), alinhar: 'direita' },
    { id: 'leads', titulo: 'Leads', valor: (p) => p.leads, alinhar: 'direita' },
    { id: 'cpl', titulo: 'CPL', valor: (p) => Math.round(p.cpl), render: (p) => (p.leads > 0 ? fmtMoeda(p.cpl) : '—'), alinhar: 'direita' },
  ];

  return (
    <div className="mads-tela">
      <Secao titulo="Investimento por posicionamento" sub="onde os anúncios estão sendo entregues">
        <Barras dados={ordenados.map((p) => ({ rotulo: p.nome, valor: Math.round(p.investimento) }))} />
      </Secao>

      <Secao titulo="Desempenho por posicionamento" sub="compare o CPL entre Feed, Reels e Stories antes de excluir posicionamentos">
        <MAGrid dados={ordenados} colunas={colunas} carregando={carregando}
          exportarNome="meta-posicionamentos"
          vazio={{ titulo: 'Sem dados de posicionamento' }} />
      </Secao>
    </div>
  );
}
