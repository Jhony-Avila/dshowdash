// screens/Sistema.tsx — Clientes (§21), Concorrência (§22), Relatórios (§23),
// Alertas (§24), Automações (§25), Sincronização (§37) e Configurações.
// @version 1.0.0  @created 2026-07-28
import { useState } from 'react';
import { Bell, FileSpreadsheet, RefreshCw, Settings2, Zap } from 'lucide-react';
import { getCenario, getService, setCenario } from '../services/MercadoLivreService';
import { useDados } from '../components/useDados';
import { MLGrid, type ColunaML } from '../components/MLGrid';
import {
  Carregando, EmPreparacao, EstadoVazio, Secao, StatusBadge,
  fmtDataHora, fmtMoeda, fmtNumero,
} from '../components/ui';
import type { CenarioId, FiltrosGlobais, SecaoId, SyncJob } from '../domain/types';

// ── Clientes ────────────────────────────────────────────────────────

interface ClienteAgg {
  nome: string; pedidos: number; valor: number; ultimo: string;
  recorrente: boolean; comOcorrencia: boolean; ufs: string;
}

export function Clientes({ filtros }: { filtros: FiltrosGlobais }) {
  const svc = getService();
  const { dados, carregando } = useDados(async () => {
    const [pedidos, ocorrencias] = await Promise.all([
      svc.getPedidos({ ...filtros, periodo: '12m' }), svc.getOcorrencias(filtros),
    ]);
    const mapa = new Map<string, ClienteAgg>();
    for (const p of pedidos.filter((x) => x.status !== 'cancelado')) {
      const c = mapa.get(p.comprador) ?? { nome: p.comprador, pedidos: 0, valor: 0, ultimo: p.data, recorrente: false, comOcorrencia: false, ufs: p.uf };
      c.pedidos += 1; c.valor += p.valorBruto;
      if (p.data > c.ultimo) c.ultimo = p.data;
      if (!c.ufs.includes(p.uf)) c.ufs += `, ${p.uf}`;
      mapa.set(p.comprador, c);
    }
    for (const o of ocorrencias) {
      const c = mapa.get(o.cliente);
      if (c) c.comOcorrencia = true;
    }
    for (const c of mapa.values()) c.recorrente = c.pedidos > 1;
    return [...mapa.values()].sort((a, b) => b.valor - a.valor);
  }, [filtros.contaId]);

  const colunas: ColunaML<ClienteAgg>[] = [
    { id: 'nome', titulo: 'Cliente', valor: (c) => c.nome },
    { id: 'pedidos', titulo: 'Pedidos', valor: (c) => c.pedidos, alinhar: 'direita', largura: 76 },
    { id: 'valor', titulo: 'Valor acumulado', valor: (c) => c.valor, render: (c) => fmtMoeda(c.valor), alinhar: 'direita', largura: 140 },
    { id: 'ultimo', titulo: 'Última compra', valor: (c) => c.ultimo, render: (c) => fmtDataHora(c.ultimo), largura: 120 },
    { id: 'uf', titulo: 'UF(s)', valor: (c) => c.ufs, largura: 90 },
    { id: 'perfil', titulo: 'Perfil', valor: (c) => (c.recorrente ? 'recorrente' : 'novo'), render: (c) => (
      <span className="ml-status-col">
        <span className={`ml-status ml-status-${c.recorrente ? 'ok' : 'info'}`}>{c.recorrente ? 'Recorrente' : 'Novo'}</span>
        {c.comOcorrencia && <span className="ml-status ml-status-bad">Ocorrência</span>}
      </span>
    ), alinhar: 'centro', largura: 160 },
  ];

  return (
    <div className="ml-tela">
      <Secao titulo="Clientes" sub="visão agregada dos últimos 12 meses — dados pessoais minimizados (§21)">
        <MLGrid dados={dados ?? []} colunas={colunas} carregando={carregando}
          exportarNome="clientes-mercadolivre" vazio={{ titulo: 'Nenhum cliente no período' }} />
      </Secao>
    </div>
  );
}

// ── Concorrência ────────────────────────────────────────────────────

export function Concorrencia() {
  return (
    <div className="ml-tela">
      <EmPreparacao secao="Concorrência e mercado"
        detalhe="Esta área depende de dados competitivos fornecidos legalmente pela API oficial (sem scraping). Cada dado virá marcado com fonte, data de coleta e nível de confiança — briefing §22." />
    </div>
  );
}

// ── Relatórios ──────────────────────────────────────────────────────

const RELATORIOS: { titulo: string; desc: string; secao: SecaoId }[] = [
  { titulo: 'Vendas por período', desc: 'Evolução, ABC e mapa de calor', secao: 'vendas' },
  { titulo: 'Pedidos', desc: 'Lista completa com exportação CSV', secao: 'pedidos' },
  { titulo: 'Anúncios', desc: 'Desempenho, qualidade e margem', secao: 'anuncios' },
  { titulo: 'Estoque', desc: 'Cobertura, matriz giro×margem e alertas', secao: 'estoque' },
  { titulo: 'Rentabilidade', desc: 'Lucro por produto (com custos)', secao: 'rentabilidade' },
  { titulo: 'Financeiro', desc: 'Waterfall e lançamentos', secao: 'financeiro' },
  { titulo: 'Logística', desc: 'Envios, prazos e atrasos', secao: 'envios' },
  { titulo: 'Ocorrências', desc: 'Reclamações, cancelamentos e devoluções', secao: 'reclamacoes' },
];

export function Relatorios({ aoNavegar }: { aoNavegar: (s: SecaoId) => void }) {
  return (
    <div className="ml-tela">
      <Secao titulo="Central de relatórios" sub="cada relatório abre a seção com filtros e exportação CSV; agendamento e PDF chegam na fase de integração">
        <div className="ml-cards-rel">
          {RELATORIOS.map((r) => (
            <button key={r.titulo} className="ml-card-rel" onClick={() => aoNavegar(r.secao)}>
              <FileSpreadsheet size={16} aria-hidden />
              <strong>{r.titulo}</strong>
              <span>{r.desc}</span>
            </button>
          ))}
        </div>
      </Secao>
    </div>
  );
}

// ── Alertas ─────────────────────────────────────────────────────────

export function Alertas({ filtros, aoNavegar }: {
  filtros: FiltrosGlobais; aoNavegar: (s: SecaoId) => void;
}) {
  const { dados, carregando, recarregar } = useDados(
    () => getService().getAlertas(filtros), [filtros.contaId, filtros.periodo]
  );
  const [tratados, setTratados] = useState<Record<string, boolean>>({});

  if (carregando || !dados) return <Carregando altura={300} />;
  const ativos = dados.filter((a) => !tratados[a.id]);

  return (
    <div className="ml-tela">
      <Secao titulo="Central de alertas" sub="limites e canais configuráveis chegam com a integração — hoje os alertas derivam dos dados simulados"
        acoes={<button className="ml-btn" onClick={recarregar}><RefreshCw size={13} aria-hidden /> Atualizar</button>}>
        {ativos.length === 0
          ? <EstadoVazio titulo="Nenhum alerta ativo 🎉" detalhe="Tudo tratado — ou o cenário atual está saudável." />
          : (
            <div className="ml-atencao">
              {ativos.map((a) => (
                <div key={a.id} className={`ml-atencao-item ml-prio-${a.prioridade}`}>
                  <Bell size={15} aria-hidden />
                  <span className="ml-atencao-corpo">
                    <strong>{a.mensagem}</strong>
                    <span>{fmtDataHora(a.data)}</span>
                  </span>
                  <span className="ml-alerta-acoes">
                    <button className="ml-btn" onClick={() => aoNavegar(a.secao)}>Abrir</button>
                    <button className="ml-btn" onClick={() => setTratados((t) => ({ ...t, [a.id]: true }))}>Marcar tratado</button>
                  </span>
                </div>
              ))}
            </div>
          )}
      </Secao>
    </div>
  );
}

// ── Automações ──────────────────────────────────────────────────────

const AUTOMACOES = [
  { nome: 'Pausar anúncio ao zerar estoque', gatilho: 'Estoque = 0', status: 'planejada' },
  { nome: 'Alerta de pergunta sem resposta > 2h', gatilho: 'Pergunta pendente', status: 'planejada' },
  { nome: 'Sincronizar estoque com o ERP', gatilho: 'A cada 15 min', status: 'planejada' },
  { nome: 'Resposta sugerida por IA (Decision Engine)', gatilho: 'Nova pergunta', status: 'planejada' },
  { nome: 'Reprecificação por margem mínima', gatilho: 'Margem < limite', status: 'planejada' },
];

export function Automacoes() {
  return (
    <div className="ml-tela">
      <Secao titulo="Automações" sub="catálogo planejado — execução real exige a integração homologada (Fase 5 do briefing)">
        <div className="ml-atencao">
          {AUTOMACOES.map((a) => (
            <div key={a.nome} className="ml-atencao-item ml-prio-3">
              <Zap size={15} aria-hidden />
              <span className="ml-atencao-corpo">
                <strong>{a.nome}</strong>
                <span>Gatilho: {a.gatilho}</span>
              </span>
              <span className="ml-status ml-status-dim">Planejada</span>
            </div>
          ))}
        </div>
      </Secao>
    </div>
  );
}

// ── Sincronização ───────────────────────────────────────────────────

export function Sincronizacao() {
  const { dados, carregando, recarregar } = useDados(() => getService().getSyncJobs(), []);

  const colunas: ColunaML<SyncJob>[] = [
    { id: 'recurso', titulo: 'Recurso', valor: (j) => j.recurso },
    { id: 'status', titulo: 'Status', valor: (j) => j.status, render: (j) => <StatusBadge valor={j.status === 'ok' ? 'ok' : j.status} />, alinhar: 'centro', largura: 100 },
    { id: 'ultima', titulo: 'Última execução', valor: (j) => j.ultima, render: (j) => fmtDataHora(j.ultima), largura: 130 },
    { id: 'proxima', titulo: 'Próxima', valor: (j) => j.proxima, render: (j) => fmtDataHora(j.proxima), largura: 120 },
    { id: 'proc', titulo: 'Processados', valor: (j) => j.processados, render: (j) => fmtNumero(j.processados), alinhar: 'direita', largura: 100 },
    { id: 'novos', titulo: 'Novos', valor: (j) => j.novos, alinhar: 'direita', largura: 70 },
    { id: 'erros', titulo: 'Erros', valor: (j) => j.erros, render: (j) => (
      <span className={j.erros > 0 ? 'ml-neg' : ''}>{j.erros}</span>
    ), alinhar: 'direita', largura: 66 },
  ];

  return (
    <div className="ml-tela">
      <Secao titulo="Sincronização" sub="na fase mock estes jobs são simulados; a arquitetura real usa fila + reconciliação (§37)"
        acoes={<button className="ml-btn" onClick={recarregar}><RefreshCw size={13} aria-hidden /> Atualizar</button>}>
        <MLGrid dados={dados ?? []} colunas={colunas} carregando={carregando}
          exportarNome="sync-mercadolivre" vazio={{ titulo: 'Sem jobs registrados' }} />
      </Secao>
    </div>
  );
}

// ── Configurações (inclui o seletor de cenário da fase mock) ────────

const CENARIOS: { id: CenarioId; rotulo: string; desc: string }[] = [
  { id: 'saudavel', rotulo: 'Operação saudável', desc: 'Crescimento moderado, poucas ocorrências' },
  { id: 'pico_vendas', rotulo: 'Pico de vendas', desc: 'Volume 2×, estoque pressionado' },
  { id: 'crise_logistica', rotulo: 'Crise logística', desc: 'Atrasos e reclamações em alta' },
  { id: 'queda_reputacao', rotulo: 'Queda de reputação', desc: 'Nível laranja, tendência negativa' },
  { id: 'estoque_critico', rotulo: 'Estoque crítico', desc: 'Rupturas e anúncios pausados' },
  { id: 'falha_sync', rotulo: 'Falha de sincronização', desc: 'Dados desatualizados há horas' },
  { id: 'sem_dados', rotulo: 'Sem dados', desc: 'Conta recém-conectada' },
];

export function Config({ aoTrocarCenario }: { aoTrocarCenario: () => void }) {
  const { dados: contas, carregando } = useDados(() => getService().getContas(), []);
  const atual = getCenario();

  return (
    <div className="ml-tela">
      <Secao titulo="Contas conectadas" sub="a arquitetura já suporta múltiplas contas (§5.2)">
        {carregando || !contas ? <Carregando altura={120} /> : (
          <div className="ml-contas">
            {contas.map((c) => (
              <div key={c.id} className="ml-conta">
                <span className="ml-conta-avatar" aria-hidden>{c.nome.slice(0, 1)}</span>
                <span className="ml-atencao-corpo">
                  <strong>{c.nome} <span className="ml-tl-meta">({c.nickname} · {c.site})</span></strong>
                  <span>Última sincronização: {fmtDataHora(c.ultimaSincronizacao)}</span>
                </span>
                <StatusBadge valor={c.status === 'ativa' ? 'ok' : 'pendente'} />
              </div>
            ))}
          </div>
        )}
      </Secao>

      <Secao titulo="Cenário de demonstração" sub="recurso da fase mock (§35.3) — não existirá em produção">
        <div className="ml-cenarios">
          {CENARIOS.map((c) => (
            <button key={c.id} className={`ml-cenario${atual === c.id ? ' is-on' : ''}`}
              onClick={() => { setCenario(c.id); aoTrocarCenario(); }}>
              <Settings2 size={14} aria-hidden />
              <strong>{c.rotulo}</strong>
              <span>{c.desc}</span>
            </button>
          ))}
        </div>
      </Secao>

      <div className="ml-obs">
        A conexão real (OAuth do Mercado Livre, backend de sincronização e ações operacionais)
        é a próxima grande fase — a interface acima já está pronta para recebê-la sem reconstrução.
      </div>
    </div>
  );
}
