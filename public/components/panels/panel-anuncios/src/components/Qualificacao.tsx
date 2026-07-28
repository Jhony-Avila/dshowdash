// components/Qualificacao.tsx — formulário de entrada do modo Qualificação.
// @version 1.0.0  @created 2026-07-28
//
// Coleta segmento + contexto do lead e monta a primeira pergunta da conversa
// (perfil 'qualificacao' no engine — Fases 14/15). Depois do roteiro inicial,
// o vendedor segue conversando normalmente (memória já cobre o contexto).
import { useEffect, useState } from 'react';
import { HeartHandshake, Sparkles } from 'lucide-react';
import { listarSegmentos } from '../lib/api';

const ROTULO_SEGMENTO: Record<string, string> = {
  igrejas: 'Igrejas', varejo: 'Varejo', corporativo: 'Corporativo',
  hospitais: 'Hospitais', shopping_centers: 'Shopping Centers',
  fachadas_externas: 'Fachadas Externas', centros_de_controle: 'Centros de Controle',
  eventos: 'Eventos', outdoor: 'Outdoor / DOOH', indoor: 'Indoor',
};

function rotuloSegmento(s: string): string {
  const conhecido = ROTULO_SEGMENTO[s];
  if (conhecido) return conhecido;
  // Fallback: "novo_segmento" → "Novo Segmento" (a base pode crescer).
  return s.split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export function Qualificacao({ onIniciar, ocupado }: {
  onIniciar: (pergunta: string, segmento: string | null) => void;
  ocupado: boolean;
}) {
  const [segmentos, setSegmentos] = useState<string[]>([]);
  const [segmento, setSegmento] = useState('');
  const [lead, setLead] = useState('');
  const [contexto, setContexto] = useState('');

  useEffect(() => {
    let ativo = true;
    listarSegmentos().then((s) => { if (ativo) setSegmentos(s); }).catch(() => { /* dropdown fica livre */ });
    return () => { ativo = false; };
  }, []);

  const pronto = contexto.trim().length >= 10;

  const iniciar = () => {
    if (!pronto || ocupado) return;
    const partes = ['Qualificação de lead.'];
    if (segmento) partes.push(`Segmento: ${rotuloSegmento(segmento)}.`);
    if (lead.trim()) partes.push(`Lead: ${lead.trim()}.`);
    partes.push(`O que o vendedor sabe até agora: ${contexto.trim()}`);
    partes.push('Monte o roteiro de qualificação para a próxima conversa com esse lead.');
    onIniciar(partes.join('\n'), segmento || null);
  };

  return (
    <div className="anx-qual">
      <div className="anx-qual-head">
        <span className="anx-qual-ic" aria-hidden><HeartHandshake size={22} /></span>
        <div>
          <h2>Qualificação comercial consultiva</h2>
          <p>
            Informe o que você já sabe do lead e receba o roteiro pelas Fases 14/15 da
            metodologia: perguntas na ordem certa, sinais de aderência, objeções prováveis
            com tratamento e próximos passos.
          </p>
        </div>
      </div>

      <div className="anx-qual-form">
        <label className="anx-qual-campo">
          <span>Segmento do lead</span>
          <select value={segmento} onChange={(e) => setSegmento(e.target.value)} disabled={ocupado}>
            <option value="">Não sei ainda / outro</option>
            {segmentos.map((s) => <option key={s} value={s}>{rotuloSegmento(s)}</option>)}
          </select>
        </label>

        <label className="anx-qual-campo">
          <span>Lead / empresa <em>(opcional)</em></span>
          <input value={lead} maxLength={120} disabled={ocupado}
            onChange={(e) => setLead(e.target.value)}
            placeholder="Ex.: Igreja Batista Central — Pr. Marcos" />
        </label>

        <label className="anx-qual-campo">
          <span>O que você já sabe sobre o lead</span>
          <textarea value={contexto} rows={4} maxLength={1500} disabled={ocupado}
            onChange={(e) => setContexto(e.target.value)}
            placeholder="Ex.: chegou pelo site, quer um painel para o templo novo de 800 lugares, mencionou orçamento apertado e já usa projetor…" />
        </label>

        <button className="anx-qual-btn" onClick={iniciar} disabled={!pronto || ocupado}>
          <Sparkles size={15} aria-hidden /> Gerar roteiro de qualificação
        </button>
        <p className="anx-qual-hint">
          Depois do roteiro, continue a conversa normalmente: "ele disse que o orçamento é X, e agora?"
        </p>
      </div>
    </div>
  );
}
