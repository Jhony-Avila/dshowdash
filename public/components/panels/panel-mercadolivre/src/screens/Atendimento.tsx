// screens/Atendimento.tsx — Perguntas (§14), Reclamações (§16) e Devoluções.
// @version 1.0.0  @created 2026-07-28
import { useState } from 'react';
import { MessageCircleQuestion, Send } from 'lucide-react';
import { getService } from '../services/MercadoLivreService';
import { useDados } from '../components/useDados';
import { MLGrid, type ColunaML } from '../components/MLGrid';
import {
  Barras, Carregando, EstadoVazio, Secao, StatusBadge, fmtDataHora, fmtMoeda,
} from '../components/ui';
import type { FiltrosGlobais, Ocorrencia, Pergunta } from '../domain/types';

// ── Perguntas ───────────────────────────────────────────────────────

export function Perguntas({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando, recarregar } = useDados(
    () => getService().getPerguntas(filtros), [filtros.contaId]
  );
  const [respondendo, setRespondendo] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [respondidasLocal, setRespondidasLocal] = useState<Record<string, string>>({});

  if (carregando || !dados) return <Carregando altura={360} />;

  const pendentes = dados.filter((q) => q.status === 'pendente' && !respondidasLocal[q.id]);
  const respondidas = dados.filter((q) => q.status === 'respondida' || respondidasLocal[q.id]);
  const tempoMedio = 3.4; // mock: horas

  const responder = (q: Pergunta) => {
    // Fase mock: registra localmente e deixa claro que é simulação.
    setRespondidasLocal((r) => ({ ...r, [q.id]: texto }));
    setRespondendo(null);
    setTexto('');
  };

  const assuntos = Object.entries(dados.reduce((m, q) => {
    m[q.assunto] = (m[q.assunto] ?? 0) + 1; return m;
  }, {} as Record<string, number>)).map(([rotulo, valor]) => ({ rotulo, valor }))
    .sort((a, b) => b.valor - a.valor);

  return (
    <div className="ml-tela">
      <div className="ml-chips">
        <span className="ml-chip">Pendentes: <strong>{pendentes.length}</strong></span>
        <span className="ml-chip">Respondidas: <strong>{respondidas.length}</strong></span>
        <span className="ml-chip">Tempo médio de resposta: <strong>{tempoMedio}h</strong></span>
        <span className="ml-chip">% respondidas: <strong>{dados.length ? Math.round((respondidas.length / dados.length) * 100) : 0}%</strong></span>
      </div>

      <div className="ml-duplo">
        <Secao titulo="Perguntas pendentes" sub="responda rápido — tempo de resposta afeta conversão e reputação">
          {pendentes.length === 0
            ? <EstadoVazio titulo="Nenhuma pergunta pendente 🎉" />
            : (
              <div className="ml-perguntas">
                {pendentes.map((q) => (
                  <div key={q.id} className="ml-pergunta">
                    <div className="ml-pergunta-head">
                      <strong>{q.comprador}</strong>
                      <span className="ml-tl-meta">{q.produto} · {fmtDataHora(q.data)} · aguardando {q.horasAguardando}h</span>
                    </div>
                    <p className="ml-pergunta-texto"><MessageCircleQuestion size={14} aria-hidden /> {q.texto}</p>
                    {respondendo === q.id ? (
                      <div className="ml-responder">
                        <textarea rows={2} value={texto} autoFocus
                          placeholder="Escreva a resposta… (simulação — nada é enviado ao Mercado Livre)"
                          onChange={(e) => setTexto(e.target.value)} />
                        <button className="ml-btn ml-btn-primario" disabled={texto.trim().length < 3}
                          onClick={() => responder(q)}>
                          <Send size={13} aria-hidden /> Responder (simulado)
                        </button>
                      </div>
                    ) : (
                      <button className="ml-btn" onClick={() => { setRespondendo(q.id); setTexto(''); }}>
                        Responder
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
        </Secao>

        <Secao titulo="Assuntos mais frequentes" sub="candidatos a melhorar título, descrição e fotos do anúncio">
          <Barras dados={assuntos} formato="numero" />
          <button className="ml-btn" onClick={recarregar} style={{ marginTop: 10 }}>↻ Atualizar</button>
        </Secao>
      </div>
    </div>
  );
}

// ── Ocorrências (Reclamações / Devoluções) ──────────────────────────

function GridOcorrencias({ filtros, tipos, titulo, sub }: {
  filtros: FiltrosGlobais;
  tipos: Ocorrencia['tipo'][];
  titulo: string;
  sub: string;
}) {
  const { dados, carregando } = useDados(
    () => getService().getOcorrencias(filtros), [filtros.contaId]
  );
  const lista = (dados ?? []).filter((o) => tipos.includes(o.tipo));

  const colunas: ColunaML<Ocorrencia>[] = [
    { id: 'id', titulo: 'ID', valor: (o) => o.id, largura: 84 },
    { id: 'tipo', titulo: 'Tipo', valor: (o) => o.tipo, render: (o) => <StatusBadge valor={o.tipo} />, alinhar: 'centro', largura: 110 },
    { id: 'pedido', titulo: 'Pedido', valor: (o) => o.pedidoId, largura: 110 },
    { id: 'cliente', titulo: 'Cliente', valor: (o) => o.cliente },
    { id: 'produto', titulo: 'Produto', valor: (o) => o.produto },
    { id: 'motivo', titulo: 'Motivo', valor: (o) => o.motivo },
    { id: 'valor', titulo: 'Valor', valor: (o) => o.valor, render: (o) => fmtMoeda(o.valor), alinhar: 'direita', largura: 110 },
    { id: 'abertura', titulo: 'Abertura', valor: (o) => o.abertura, render: (o) => fmtDataHora(o.abertura), largura: 104 },
    { id: 'status', titulo: 'Status', valor: (o) => o.status, render: (o) => <StatusBadge valor={o.status} />, alinhar: 'centro', largura: 110 },
  ];

  const motivos = Object.entries(lista.reduce((m, o) => {
    m[o.motivo] = (m[o.motivo] ?? 0) + 1; return m;
  }, {} as Record<string, number>)).map(([rotulo, valor]) => ({ rotulo, valor }))
    .sort((a, b) => b.valor - a.valor);

  const valorImpactado = lista.filter((o) => o.status !== 'resolvida').reduce((s, o) => s + o.valor, 0);

  return (
    <div className="ml-tela">
      <div className="ml-chips">
        <span className="ml-chip">Abertas: <strong>{lista.filter((o) => o.status === 'aberta').length}</strong></span>
        <span className="ml-chip">Em andamento: <strong>{lista.filter((o) => o.status === 'em_andamento').length}</strong></span>
        <span className="ml-chip">Resolvidas: <strong>{lista.filter((o) => o.status === 'resolvida').length}</strong></span>
        <span className="ml-chip">Valor em aberto: <strong>{fmtMoeda(valorImpactado)}</strong></span>
      </div>

      <Secao titulo={titulo} sub={sub}>
        <MLGrid dados={lista} colunas={colunas} carregando={carregando}
          exportarNome={titulo.toLowerCase().replace(/\s/g, '-')}
          vazio={{ titulo: 'Nenhuma ocorrência 🎉' }} />
      </Secao>

      {motivos.length > 0 && (
        <Secao titulo="Pareto de motivos" sub="ataque as causas mais frequentes primeiro">
          <Barras dados={motivos} formato="numero" />
        </Secao>
      )}
    </div>
  );
}

export function Reclamacoes({ filtros }: { filtros: FiltrosGlobais }) {
  return <GridOcorrencias filtros={filtros} tipos={['reclamacao', 'mediacao']}
    titulo="Reclamações e mediações" sub="responder antes do prazo evita mediação e protege a reputação" />;
}

export function Devolucoes({ filtros }: { filtros: FiltrosGlobais }) {
  return <GridOcorrencias filtros={filtros} tipos={['cancelamento', 'devolucao']}
    titulo="Cancelamentos e devoluções" sub="acompanhe a logística reversa e o impacto financeiro" />;
}
