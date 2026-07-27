// screens/Rankings.tsx — rankings dedicados (backlog #28): vendedores, produtos, organizacoes.
// @version 1.0.0  @created 2026-07-22
//
// Le GET /api/pipedrive/rankings (base local ja sincronizada; nao chama a API do Pipedrive).
// Ordenacao por valor ganho. So leitura — sem drawer (as linhas sao agregados, nao negocios).
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves, ApiError } from '../lib/api';
import { fmtBRL, fmtNum } from '../lib/format';
import { PageHeader } from './PageHeader';
import { EstadoErro, SkeletonBloco } from './Estados';
import { Trophy } from 'lucide-react';
import type { PipeStatus, PipeRankings } from '../shell/types';

const MEDALHAS = ['🥇', '🥈', '🥉'];
const pos = (i: number) => (i < 3 ? MEDALHAS[i] : String(i + 1));

export function Rankings({ status }: { status?: PipeStatus }) {
  const [limit, setLimit] = useState(20);
  const conectado = status?.status === 'connected';

  const { data, isLoading, error, refetch } = useQuery<PipeRankings>({
    queryKey: [...chaves.rankings, limit],
    queryFn: ({ signal }) => apiGet<PipeRankings>('/rankings', { limit }, signal),
    enabled: conectado,
    refetchInterval: 120_000,
  });

  if (!conectado) {
    return (
      <div>
        <h1 className="pp-h1">Rankings</h1>
        <div className="pp-card" style={{ maxWidth: 'none' }}><EstadoErro titulo="Integração não conectada" detalhe="Conecte o token do Pipedrive na tela de Configurações para ver estes dados." /></div>
      </div>
    );
  }

  const sellers = data?.sellers ?? [];
  const products = data?.products ?? [];
  const orgs = data?.orgs ?? [];

  return (
    <div>
      <PageHeader Icon={Trophy} titulo="Rankings"
        descricao="Vendedores, produtos e organizações ordenados por valor ganho." />

      <div className="pp-filtros">
        <label className="pp-label" style={{ margin: 0 }}>Mostrar top</label>
        <select className="pp-select" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      {error instanceof ApiError ? (
        <div className="pp-card" style={{ maxWidth: 'none' }}>
          <EstadoErro detalhe={error.ehAuth ? 'Sua sessão expirou. Recarregue a página e entre novamente.' : 'Falha ao consultar a base local.'}
            onRetry={error.ehAuth ? undefined : () => void refetch()} />
        </div>
      ) : isLoading ? (
        <div className="pp-card" style={{ maxWidth: 'none' }}><SkeletonBloco linhas={5} /></div>
      ) : (
        <>
          {/* Vendedores */}
          <div className="pp-card" style={{ maxWidth: 760 }}>
            <h3>Vendedores</h3>
            {sellers.length === 0 ? (
              <p className="pp-placeholder">Sem dados de vendedores.</p>
            ) : (
              <table className="pp-table">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}>#</th><th>Vendedor</th>
                    <th className="ta-r">Ganhos</th><th className="ta-r">Conversão</th>
                    <th className="ta-r">Ticket médio</th><th className="ta-r">Em aberto</th>
                    <th className="ta-r">Valor ganho</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((s, i) => (
                    <tr key={s.owner_id ?? s.name}>
                      <td>{pos(i)}</td>
                      <td className="pp-td-title">{s.name}</td>
                      <td className="ta-r">{fmtNum(s.ganhos)}</td>
                      <td className="ta-r">{s.taxa_conversao != null ? `${s.taxa_conversao}%` : '—'}</td>
                      <td className="ta-r">{fmtBRL(s.ticket_medio)}</td>
                      <td className="ta-r">{fmtBRL(s.valor_aberto)}</td>
                      <td className="ta-r" style={{ fontWeight: 700, color: 'var(--pp-ok)' }}>{fmtBRL(s.valor_ganho)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Produtos */}
          <div className="pp-card" style={{ maxWidth: 760 }}>
            <h3>Produtos</h3>
            {products.length === 0 ? (
              <p className="pp-placeholder">
                Nenhum produto de negócio sincronizado ainda. Um administrador pode puxar os produtos dos
                negócios na aba <strong>Configurações</strong>.
              </p>
            ) : (
              <table className="pp-table">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}>#</th><th>Produto</th>
                    <th className="ta-r">Negócios</th><th className="ta-r">Qtd.</th>
                    <th className="ta-r">Em aberto</th><th className="ta-r">Ganho</th>
                    <th className="ta-r">Valor total</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={p.product_id ?? p.name}>
                      <td>{pos(i)}</td>
                      <td className="pp-td-title">{p.name}</td>
                      <td className="ta-r">{fmtNum(p.deals)}</td>
                      <td className="ta-r">{fmtNum(p.qty)}</td>
                      <td className="ta-r">{fmtBRL(p.valor_aberto)}</td>
                      <td className="ta-r" style={{ color: 'var(--pp-ok)' }}>{fmtBRL(p.valor_ganho)}</td>
                      <td className="ta-r" style={{ fontWeight: 700 }}>{fmtBRL(p.valor_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Organizacoes */}
          <div className="pp-card" style={{ maxWidth: 760 }}>
            <h3>Organizações</h3>
            {orgs.length === 0 ? (
              <p className="pp-placeholder">Sem dados de organizações.</p>
            ) : (
              <table className="pp-table">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}>#</th><th>Organização</th>
                    <th className="ta-r">Negócios</th><th className="ta-r">Ganhos</th>
                    <th className="ta-r">Em aberto</th><th className="ta-r">Valor ganho</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((o, i) => (
                    <tr key={o.org_id ?? o.name}>
                      <td>{pos(i)}</td>
                      <td className="pp-td-title">{o.name}</td>
                      <td className="ta-r">{fmtNum(o.deals)}</td>
                      <td className="ta-r">{fmtNum(o.ganhos)}</td>
                      <td className="ta-r">{fmtBRL(o.valor_aberto)}</td>
                      <td className="ta-r" style={{ fontWeight: 700, color: 'var(--pp-ok)' }}>{fmtBRL(o.valor_ganho)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
