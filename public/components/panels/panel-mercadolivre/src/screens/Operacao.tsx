// screens/Operacao.tsx — Central Operacional (§7) e Pedidos (§8).
// @version 1.0.0  @created 2026-07-28
import { useState } from 'react';
import { ClipboardList, PackageCheck, Timer } from 'lucide-react';
import { getService } from '../services/MercadoLivreService';
import { useDados } from '../components/useDados';
import { MLGrid, type ColunaML } from '../components/MLGrid';
import {
  Carregando, Drawer, EstadoVazio, Secao, StatusBadge,
  fmtData, fmtDataHora, fmtMoeda,
} from '../components/ui';
import type { FiltrosGlobais, Pedido, PedidoDetalhe, SecaoId } from '../domain/types';

// ── Central Operacional ─────────────────────────────────────────────

export function Central({ filtros, aoNavegar }: {
  filtros: FiltrosGlobais; aoNavegar: (s: SecaoId) => void;
}) {
  const svc = getService();
  const { dados, carregando } = useDados(async () => {
    const [pedidos, perguntas, ocorrencias, anuncios] = await Promise.all([
      svc.getPedidos({ ...filtros, periodo: '30d' }),
      svc.getPerguntas(filtros),
      svc.getOcorrencias(filtros),
      svc.getAnuncios(filtros),
    ]);
    return { pedidos, perguntas, ocorrencias, anuncios };
  }, [filtros.contaId]);

  if (carregando || !dados) return <Carregando altura={360} />;

  const filas: { rotulo: string; qtd: number; secao: SecaoId; prio: 1 | 2 | 3; dica: string }[] = [
    { rotulo: 'Pedidos novos', qtd: dados.pedidos.filter((p) => ['novo', 'pago'].includes(p.status)).length, secao: 'pedidos', prio: 2, dica: 'Aguardando faturamento' },
    { rotulo: 'Aguardando separação', qtd: dados.pedidos.filter((p) => p.status === 'faturado').length, secao: 'pedidos', prio: 2, dica: 'Nota emitida, falta separar' },
    { rotulo: 'Aguardando envio', qtd: dados.pedidos.filter((p) => p.status === 'separacao').length, secao: 'pedidos', prio: 2, dica: 'Prontos para despacho' },
    { rotulo: 'Envios atrasados', qtd: dados.pedidos.filter((p) => p.atrasado).length, secao: 'envios', prio: 1, dica: 'Risco de reclamação' },
    { rotulo: 'Perguntas pendentes', qtd: dados.perguntas.filter((q) => q.status === 'pendente').length, secao: 'perguntas', prio: 2, dica: 'Tempo de resposta afeta conversão' },
    { rotulo: 'Reclamações abertas', qtd: dados.ocorrencias.filter((o) => o.status !== 'resolvida' && (o.tipo === 'reclamacao' || o.tipo === 'mediacao')).length, secao: 'reclamacoes', prio: 1, dica: 'Responder antes da mediação' },
    { rotulo: 'Devoluções em andamento', qtd: dados.ocorrencias.filter((o) => o.tipo === 'devolucao' && o.status !== 'resolvida').length, secao: 'devolucoes', prio: 2, dica: 'Acompanhar logística reversa' },
    { rotulo: 'Anúncios com problema', qtd: dados.anuncios.filter((a) => a.status !== 'ativo').length, secao: 'anuncios', prio: 3, dica: 'Pausados, em revisão ou com erro' },
    { rotulo: 'Estoque crítico', qtd: dados.anuncios.filter((a) => a.estoque < 3).length, secao: 'estoque', prio: 1, dica: 'Repor antes da ruptura' },
  ];

  const comItens = filas.filter((f) => f.qtd > 0).sort((a, b) => a.prio - b.prio);

  return (
    <div className="ml-tela">
      <Secao titulo="Central Operacional" sub="todas as filas que exigem ação, priorizadas">
        {comItens.length === 0
          ? <EstadoVazio titulo="Nenhuma pendência operacional 🎉" detalhe="Todas as filas estão zeradas para os filtros atuais." />
          : (
            <div className="ml-filas">
              {comItens.map((f) => (
                <button key={f.rotulo} className={`ml-fila ml-prio-${f.prio}`} onClick={() => aoNavegar(f.secao)}>
                  <span className="ml-fila-qtd">{f.qtd}</span>
                  <span className="ml-fila-corpo">
                    <strong>{f.rotulo}</strong>
                    <span>{f.dica}</span>
                  </span>
                  <ClipboardList size={15} aria-hidden />
                </button>
              ))}
            </div>
          )}
      </Secao>
    </div>
  );
}

// ── Pedidos ─────────────────────────────────────────────────────────

export function Pedidos({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando } = useDados(
    () => getService().getPedidos(filtros),
    [filtros.contaId, filtros.periodo]
  );
  const [detalhe, setDetalhe] = useState<PedidoDetalhe | null>(null);
  const [abrindo, setAbrindo] = useState(false);

  const abrir = async (p: Pedido) => {
    setAbrindo(true);
    try { setDetalhe(await getService().getPedido(p.id)); }
    finally { setAbrindo(false); }
  };

  const colunas: ColunaML<Pedido>[] = [
    { id: 'id', titulo: 'Pedido', valor: (p) => p.id, largura: 110 },
    { id: 'data', titulo: 'Data', valor: (p) => p.data, render: (p) => fmtDataHora(p.data), largura: 100 },
    { id: 'comprador', titulo: 'Comprador', valor: (p) => p.comprador },
    { id: 'produto', titulo: 'Produto', valor: (p) => p.produto },
    { id: 'qtd', titulo: 'Qtd', valor: (p) => p.quantidade, alinhar: 'direita', largura: 50 },
    { id: 'bruto', titulo: 'Valor', valor: (p) => p.valorBruto, render: (p) => fmtMoeda(p.valorBruto), alinhar: 'direita', largura: 110 },
    { id: 'liquido', titulo: 'Líquido', valor: (p) => p.valorLiquido, render: (p) => fmtMoeda(p.valorLiquido), alinhar: 'direita', largura: 110 },
    { id: 'envio', titulo: 'Envio', valor: (p) => p.envio, render: (p) => <StatusBadge valor={p.envio} />, alinhar: 'centro', largura: 84 },
    { id: 'status', titulo: 'Status', valor: (p) => p.status, render: (p) => (
      <span className="ml-status-col">
        <StatusBadge valor={p.status} />
        {p.atrasado && <StatusBadge valor="atrasado" />}
      </span>
    ), alinhar: 'centro', largura: 130 },
    { id: 'uf', titulo: 'UF', valor: (p) => p.uf, alinhar: 'centro', largura: 46 },
  ];

  return (
    <div className="ml-tela">
      <Secao titulo="Pedidos" sub="clique num pedido para o detalhe completo com a linha do tempo">
        <MLGrid dados={dados ?? []} colunas={colunas} carregando={carregando}
          onLinha={(p) => void abrir(p)} exportarNome="pedidos-mercadolivre"
          vazio={{ titulo: 'Nenhum pedido no período', detalhe: 'Ajuste o período ou a conta nos filtros do topo.' }} />
      </Secao>

      <Drawer titulo={detalhe ? `Pedido ${detalhe.id}` : 'Pedido'} aberto={!!detalhe || abrindo}
        onFechar={() => setDetalhe(null)}>
        {!detalhe ? <Carregando altura={200} /> : (
          <div className="ml-pedido-det">
            <div className="ml-det-grid">
              <div><span className="ml-det-rotulo">Comprador</span><strong>{detalhe.comprador}</strong></div>
              <div><span className="ml-det-rotulo">Local</span><strong>{detalhe.endereco}</strong></div>
              <div><span className="ml-det-rotulo">Produto</span><strong>{detalhe.produto}</strong></div>
              <div><span className="ml-det-rotulo">SKU</span><strong>{detalhe.sku}</strong></div>
              <div><span className="ml-det-rotulo">Valor bruto</span><strong>{fmtMoeda(detalhe.valorBruto)}</strong></div>
              <div><span className="ml-det-rotulo">Tarifa</span><strong>-{fmtMoeda(detalhe.tarifa)}</strong></div>
              <div><span className="ml-det-rotulo">Líquido</span><strong>{fmtMoeda(detalhe.valorLiquido)}</strong></div>
              <div><span className="ml-det-rotulo">Pagamento</span><strong>{detalhe.pagamento.metodo} · {detalhe.pagamento.parcelas}x · {detalhe.pagamento.status}</strong></div>
              <div><span className="ml-det-rotulo">Nota fiscal</span><strong>{detalhe.notaFiscal ?? 'não emitida'}</strong></div>
              <div><span className="ml-det-rotulo">Status</span><StatusBadge valor={detalhe.status} /></div>
            </div>

            {detalhe.observacoes.map((o) => (
              <div key={o} className="ml-obs"><Timer size={14} aria-hidden /> {o}</div>
            ))}

            <h4 className="ml-det-h"><PackageCheck size={14} aria-hidden /> Linha do tempo</h4>
            <div className="ml-timeline">
              {detalhe.timeline.map((ev, i) => (
                <div key={i} className="ml-tl-item">
                  <span className="ml-tl-ponto" aria-hidden />
                  <div>
                    <strong>{ev.titulo}</strong>
                    <span className="ml-tl-meta">{fmtData(ev.data)}{ev.detalhe ? ` · ${ev.detalhe}` : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
