// components/Inicio.tsx — tela inicial densa (painel de entrada inteligente).
// @version 1.0.0  @created 2026-07-28
//
// Substitui a tela de boas-vindas vazia: hero + cards de início rápido
// (preenchem o composer com um template editável) + histórico recente.
import { useEffect, useState } from 'react';
import {
  AlertTriangle, Brain, ChartNoAxesCombined, FileSearch, HeartHandshake,
  History, KeyRound, Megaphone, ShieldX, Target,
} from 'lucide-react';
import { listarConversas } from '../lib/api';
import type { Conversa } from '../shell/types';

interface CardRapido {
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
  template: string;
}

const CARDS: CardRapido[] = [
  {
    icone: <Target size={18} aria-hidden />, titulo: 'Diagnosticar campanha',
    descricao: 'Encontre a causa raiz de uma campanha com desempenho fraco.',
    template: 'Minha campanha [nome da campanha] gera cliques mas poucas conversões. Como diagnosticar a causa raiz seguindo a metodologia?',
  },
  {
    icone: <KeyRound size={18} aria-hidden />, titulo: 'Analisar palavras-chave',
    descricao: 'Avalie alinhamento com a intenção de compra.',
    template: 'Como avaliar se minhas palavras-chave estão alinhadas à intenção de compra do meu público?',
  },
  {
    icone: <FileSearch size={18} aria-hidden />, titulo: 'Avaliar landing page',
    descricao: 'Critérios da metodologia antes de mandar tráfego.',
    template: 'Quais critérios da metodologia devo usar para avaliar se uma landing page está pronta para receber tráfego?',
  },
  {
    icone: <AlertTriangle size={18} aria-hidden />, titulo: 'Encontrar desperdícios',
    descricao: 'Onde o orçamento costuma vazar numa conta.',
    template: 'Quais são os principais pontos de desperdício de orçamento que devo procurar em uma conta de Google Ads?',
  },
  {
    icone: <Megaphone size={18} aria-hidden />, titulo: 'Criar anúncios',
    descricao: 'Estruture RSAs alinhados à metodologia.',
    template: 'Como estruturar anúncios responsivos de pesquisa seguindo a metodologia, para o produto [produto/segmento]?',
  },
  {
    icone: <ShieldX size={18} aria-hidden />, titulo: 'Sugerir negativas',
    descricao: 'Reduza tráfego desqualificado com método.',
    template: 'Como montar uma estratégia de palavras-chave negativas para reduzir tráfego desqualificado?',
  },
  {
    icone: <HeartHandshake size={18} aria-hidden />, titulo: 'Objeções por segmento',
    descricao: 'Antecipe e responda objeções típicas.',
    template: 'Quais objeções são comuns de clientes do segmento [igrejas/varejo/eventos] e como a metodologia orienta responder?',
  },
  {
    icone: <ChartNoAxesCombined size={18} aria-hidden />, titulo: 'Plano de mensuração',
    descricao: 'O que medir antes de escalar o investimento.',
    template: 'O que preciso configurar de mensuração antes de escalar o investimento em Google Ads?',
  },
];

function fmtData(mysqlDt: string): string {
  const d = new Date(mysqlDt.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return mysqlDt;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function Inicio({ onUsarTemplate, onAbrirConversa }: {
  onUsarTemplate: (texto: string) => void;
  onAbrirConversa: (id: number) => void;
}) {
  const [recentes, setRecentes] = useState<Conversa[] | null>(null);

  useEffect(() => {
    let ativo = true;
    listarConversas()
      .then((lista) => { if (ativo) setRecentes(lista.slice(0, 5)); })
      .catch(() => { if (ativo) setRecentes([]); });
    return () => { ativo = false; };
  }, []);

  return (
    <div className="anx-inicio">
      <div className="anx-welcome">
        <div className="anx-welcome-ic" aria-hidden><Brain size={34} /></div>
        <h2>Pergunte ao especialista em Google Ads da Dshow</h2>
        <p>
          Auditoria, diagnóstico, palavras-chave, landing pages, lances e
          qualificação comercial — sempre fundamentado na metodologia
          (~1.500 regras), com as fontes citadas em cada resposta.
        </p>
      </div>

      <div className="anx-cards">
        {CARDS.map((c) => (
          <button key={c.titulo} className="anx-card" onClick={() => onUsarTemplate(c.template)} type="button">
            <span className="anx-card-ic">{c.icone}</span>
            <span className="anx-card-tit">{c.titulo}</span>
            <span className="anx-card-desc">{c.descricao}</span>
          </button>
        ))}
      </div>

      {recentes !== null && recentes.length > 0 && (
        <div className="anx-recentes">
          <div className="anx-recentes-head"><History size={14} aria-hidden /> Conversas recentes</div>
          {recentes.map((c) => (
            <button key={c.id} className="anx-recente" onClick={() => onAbrirConversa(c.id)} type="button">
              <span className="anx-recente-tit">{c.titulo || `Conversa #${c.id}`}</span>
              <span className="anx-recente-meta">
                {fmtData(c.updated_at)} · {c.perguntas} pergunta{c.perguntas === 1 ? '' : 's'} · continuar →
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
