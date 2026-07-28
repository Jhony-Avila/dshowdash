// screens/Catalogo.tsx — Anúncios (§10), Produtos (§11) e Estoque (§12).
// @version 1.0.0  @created 2026-07-28
import { useState } from 'react';
import { BadgeCheck, PackageSearch } from 'lucide-react';
import { getService } from '../services/MercadoLivreService';
import { useDados } from '../components/useDados';
import { MLGrid, type ColunaML } from '../components/MLGrid';
import {
  Carregando, Drawer, Secao, StatusBadge, fmtMoeda, fmtNumero, fmtPct,
} from '../components/ui';
import type { Anuncio, FiltrosGlobais, Produto } from '../domain/types';

// ── Anúncios ────────────────────────────────────────────────────────

export function Anuncios({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando } = useDados(
    () => getService().getAnuncios(filtros), [filtros.contaId]
  );
  const [aberto, setAberto] = useState<Anuncio | null>(null);

  const resumo = (dados ?? []).reduce((r, a) => {
    r[a.status] = (r[a.status] ?? 0) + 1;
    if (a.estoque === 0) r.sem_estoque = (r.sem_estoque ?? 0) + 1;
    if (a.margemPct < 12) r.margem_baixa = (r.margem_baixa ?? 0) + 1;
    return r;
  }, {} as Record<string, number>);

  const colunas: ColunaML<Anuncio>[] = [
    { id: 'titulo', titulo: 'Anúncio', valor: (a) => a.titulo },
    { id: 'tipo', titulo: 'Tipo', valor: (a) => a.tipo, render: (a) => <StatusBadge valor={a.tipo} />, alinhar: 'centro', largura: 86 },
    { id: 'preco', titulo: 'Preço', valor: (a) => a.preco, render: (a) => (
      <span>{fmtMoeda(a.precoPromocional ?? a.preco)}{a.precoPromocional && <s className="ml-preco-antigo">{fmtMoeda(a.preco)}</s>}</span>
    ), alinhar: 'direita', largura: 130 },
    { id: 'estoque', titulo: 'Estoque', valor: (a) => a.estoque, alinhar: 'direita', largura: 76 },
    { id: 'visitas', titulo: 'Visitas', valor: (a) => a.visitas, render: (a) => fmtNumero(a.visitas), alinhar: 'direita', largura: 80 },
    { id: 'vendas', titulo: 'Vendas', valor: (a) => a.vendas, alinhar: 'direita', largura: 72 },
    { id: 'conv', titulo: 'Conv.', valor: (a) => a.conversaoPct, render: (a) => fmtPct(a.conversaoPct), alinhar: 'direita', largura: 70 },
    { id: 'fat', titulo: 'Faturamento', valor: (a) => a.faturamento, render: (a) => fmtMoeda(a.faturamento), alinhar: 'direita', largura: 120 },
    { id: 'margem', titulo: 'Margem', valor: (a) => a.margemPct, render: (a) => (
      <span className={a.margemPct < 12 ? 'ml-neg' : ''}>{fmtPct(a.margemPct)}</span>
    ), alinhar: 'direita', largura: 78 },
    { id: 'qual', titulo: 'Qualidade', valor: (a) => a.qualidade, render: (a) => (
      <span className={`ml-score ml-score-${a.qualidade >= 75 ? 'ok' : a.qualidade >= 50 ? 'warn' : 'bad'}`}>{a.qualidade}</span>
    ), alinhar: 'centro', largura: 86 },
    { id: 'status', titulo: 'Status', valor: (a) => a.status, render: (a) => <StatusBadge valor={a.status} />, alinhar: 'centro', largura: 100 },
  ];

  return (
    <div className="ml-tela">
      <div className="ml-chips">
        {Object.entries({ ativo: 'Ativos', pausado: 'Pausados', em_revisao: 'Em revisão', sem_estoque: 'Sem estoque', margem_baixa: 'Margem baixa' })
          .map(([k, rotulo]) => (
            <span key={k} className="ml-chip">{rotulo}: <strong>{resumo[k] ?? 0}</strong></span>
          ))}
      </div>

      <Secao titulo="Anúncios" sub="clique num anúncio para o score de qualidade explicado">
        <MLGrid dados={dados ?? []} colunas={colunas} carregando={carregando}
          onLinha={setAberto} exportarNome="anuncios-mercadolivre"
          vazio={{ titulo: 'Nenhum anúncio para os filtros' }} />
      </Secao>

      <Drawer titulo={aberto ? aberto.titulo : ''} aberto={!!aberto} onFechar={() => setAberto(null)}>
        {aberto && (
          <div className="ml-pedido-det">
            <div className="ml-score-hero">
              <span className={`ml-score-big ml-score-${aberto.qualidade >= 75 ? 'ok' : aberto.qualidade >= 50 ? 'warn' : 'bad'}`}>
                {aberto.qualidade}
              </span>
              <div>
                <strong>Score de qualidade do anúncio</strong>
                <span className="ml-tl-meta">Composto pelos fatores abaixo (o que soma e o que reduz a nota).</span>
              </div>
            </div>
            <div className="ml-fatores">
              {aberto.fatoresQualidade.map((f) => (
                <div key={f.fator} className="ml-fator">
                  <span className={`ml-fator-imp ${f.impacto >= 0 ? 'ml-pos' : 'ml-neg'}`}>
                    {f.impacto >= 0 ? '+' : ''}{f.impacto}
                  </span>
                  <span>{f.fator}</span>
                </div>
              ))}
            </div>
            <div className="ml-det-grid">
              <div><span className="ml-det-rotulo">Categoria</span><strong>{aberto.categoria}</strong></div>
              <div><span className="ml-det-rotulo">SKU</span><strong>{aberto.sku}</strong></div>
              <div><span className="ml-det-rotulo">Conversão</span><strong>{fmtPct(aberto.conversaoPct)}</strong></div>
              <div><span className="ml-det-rotulo">Tarifa</span><strong>{fmtPct(aberto.tarifaPct)}</strong></div>
            </div>
            <div className="ml-obs"><BadgeCheck size={14} aria-hidden /> Ações operacionais (pausar, alterar preço/estoque) chegam com a integração real — por enquanto tudo aqui é leitura simulada.</div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ── Produtos ────────────────────────────────────────────────────────

export function Produtos({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando } = useDados(
    () => getService().getProdutos(filtros), [filtros.contaId]
  );

  const colunas: ColunaML<Produto>[] = [
    { id: 'nome', titulo: 'Produto', valor: (p) => p.nome },
    { id: 'sku', titulo: 'SKU', valor: (p) => p.sku, largura: 110 },
    { id: 'cat', titulo: 'Categoria', valor: (p) => p.categoria, largura: 130 },
    { id: 'disp', titulo: 'Disponível', valor: (p) => p.estoqueDisponivel, alinhar: 'direita', largura: 86 },
    { id: 'res', titulo: 'Reservado', valor: (p) => p.estoqueReservado, alinhar: 'direita', largura: 84 },
    { id: 'custo', titulo: 'Custo', valor: (p) => p.custo, render: (p) => fmtMoeda(p.custo), alinhar: 'direita', largura: 100 },
    { id: 'preco', titulo: 'Preço médio', valor: (p) => p.precoMedio, render: (p) => fmtMoeda(p.precoMedio), alinhar: 'direita', largura: 110 },
    { id: 'un', titulo: 'Vendidos', valor: (p) => p.unidadesVendidas, alinhar: 'direita', largura: 80 },
    { id: 'fat', titulo: 'Faturamento', valor: (p) => p.faturamento, render: (p) => fmtMoeda(p.faturamento), alinhar: 'direita', largura: 120 },
    { id: 'margem', titulo: 'Margem', valor: (p) => p.margemPct, render: (p) => fmtPct(p.margemPct), alinhar: 'direita', largura: 78 },
    { id: 'cob', titulo: 'Cobertura', valor: (p) => p.coberturaDias, render: (p) => (p.coberturaDias > 900 ? '—' : `${p.coberturaDias}d`), alinhar: 'direita', largura: 84 },
    { id: 'status', titulo: 'Status', valor: (p) => p.status, render: (p) => <StatusBadge valor={p.status} />, alinhar: 'centro', largura: 92 },
  ];

  return (
    <div className="ml-tela">
      <Secao titulo="Produtos" sub="visão por produto interno (SKU) — anúncios, estoque e resultado">
        <MLGrid dados={dados ?? []} colunas={colunas} carregando={carregando}
          exportarNome="produtos-mercadolivre" vazio={{ titulo: 'Nenhum produto' }} />
      </Secao>
      <div className="ml-obs"><PackageSearch size={14} aria-hidden /> A conciliação com o ERP (estoque oficial, custos e notas) entra na fase de integração — a coluna de custo aqui é referência do cadastro.</div>
    </div>
  );
}

// ── Estoque ─────────────────────────────────────────────────────────

export function Estoque({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando } = useDados(
    () => getService().getProdutos(filtros), [filtros.contaId]
  );
  if (carregando || !dados) return <Carregando altura={360} />;

  const valorEstoque = dados.reduce((s, p) => s + p.estoqueDisponivel * p.custo, 0);
  const criticos = dados.filter((p) => p.status === 'critico' || p.status === 'zerado');
  const quadrante = (giro: 'alto' | 'baixo', margem: 'alta' | 'baixa') =>
    dados.filter((p) => p.giro === giro && p.margem === margem && p.unidadesVendidas > 0);

  const celula = (titulo: string, classe: string, lista: Produto[]) => (
    <div className={`ml-mx-cel ${classe}`}>
      <div className="ml-mx-titulo">{titulo}</div>
      {lista.length === 0 ? <span className="ml-mx-vazio">—</span> : lista.map((p) => (
        <span key={p.sku} className="ml-mx-item" title={`${p.nome} · margem ${fmtPct(p.margemPct)} · ${p.unidadesVendidas} un.`}>
          {p.nome.length > 34 ? p.nome.slice(0, 34) + '…' : p.nome}
        </span>
      ))}
    </div>
  );

  return (
    <div className="ml-tela">
      <div className="ml-chips">
        <span className="ml-chip">Valor em estoque: <strong>{fmtMoeda(valorEstoque)}</strong></span>
        <span className="ml-chip">Críticos/zerados: <strong>{criticos.length}</strong></span>
        <span className="ml-chip">Excesso: <strong>{dados.filter((p) => p.status === 'excesso').length}</strong></span>
        <span className="ml-chip">Parados: <strong>{dados.filter((p) => p.status === 'parado').length}</strong></span>
      </div>

      <Secao titulo="Matriz giro × margem" sub="onde investir estoque e onde reduzir (§12.3)">
        <div className="ml-mx">
          <div className="ml-mx-eixo-y">Giro ↑</div>
          <div className="ml-mx-grid">
            {celula('Proteger estoque (alto giro, alta margem)', 'ml-mx-otimo', quadrante('alto', 'alta'))}
            {celula('Revisar preço (alto giro, baixa margem)', 'ml-mx-planejar', quadrante('alto', 'baixa'))}
            {celula('Nicho rentável (baixo giro, alta margem)', 'ml-mx-baixo', quadrante('baixo', 'alta'))}
            {celula('Candidatos a saída (baixo giro, baixa margem)', 'ml-mx-evitar', quadrante('baixo', 'baixa'))}
          </div>
          <div className="ml-mx-eixo-x">Margem →</div>
        </div>
      </Secao>

      {criticos.length > 0 && (
        <Secao titulo="Alertas de estoque" sub="repor antes da ruptura pausar o anúncio">
          <div className="ml-atencao">
            {criticos.map((p) => (
              <div key={p.sku} className={`ml-atencao-item ml-prio-${p.status === 'zerado' ? 1 : 2}`}>
                <span className="ml-atencao-corpo">
                  <strong>{p.nome}</strong>
                  <span>{p.status === 'zerado' ? 'Estoque ZERADO — anúncio pausado automaticamente.' : `Cobertura de ~${p.coberturaDias} dia(s) ao ritmo atual.`}</span>
                </span>
                <span className="ml-atencao-acao">{p.estoqueDisponivel} un.</span>
              </div>
            ))}
          </div>
        </Secao>
      )}
    </div>
  );
}
