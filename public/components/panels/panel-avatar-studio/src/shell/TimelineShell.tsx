// shell/TimelineShell.tsx — LINHA DO TEMPO unificada no shell (mega 228 · §220).
// @version 1.0.0  @created 2026-08-05
//
// A jornada da identidade num só lugar (§220: "2026 → Primeiro Avatar →
// Cyber → …"): MARCOS de evolução (§241–§246, com memórias) + BADGES de
// missões concluídas (§250/§224), agrupados por MÊS, mais recentes
// primeiro. 100% local (mesmas fontes da Evolução/Missões — aqui é a
// NARRATIVA; a gestão de marcos continua no drawer Evolução). Flag
// as5.timeline_shell (§651 desliga).
import { useMemo } from 'react';
import { Award, History, X } from 'lucide-react';
import { dataUriDe } from '../services/AvatarCatalog';
import { ROTULO_ORIGEM, marcosEvolucao } from '../services/Evolucao';
import type { MarcoEvolucao } from '../services/Evolucao';
import { MISSOES, missoesFeitas } from '../services/Missoes';

const mesAno = (ms: number): string =>
  new Date(ms).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

const dataCurta = (ms: number): string =>
  new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

export function TimelineShell({ aoFechar, aoAbrirEvolucao }: {
  aoFechar: () => void;
  /** atalho: gestão dos marcos (comparar/aplicar/excluir) fica na Evolução */
  aoAbrirEvolucao: () => void;
}) {
  // marcos por MÊS, mais recentes primeiro (§220: leitura cronológica)
  const grupos = useMemo(() => {
    const porMes = new Map<string, MarcoEvolucao[]>();
    for (const m of [...marcosEvolucao()].reverse()) {
      const chave = mesAno(m.quando);
      porMes.set(chave, [...(porMes.get(chave) ?? []), m]);
    }
    return [...porMes.entries()];
  }, []);

  const badges = useMemo(() => {
    const feitas = missoesFeitas();
    return MISSOES.filter((m) => feitas.has(m.id));
  }, []);

  return (
    <div className="avst5-detalhe-fundo" role="dialog" aria-modal="true" aria-label="Linha do tempo do avatar">
      <button type="button" className="avst-fpop-fundo" aria-label="Fechar" onClick={aoFechar} />
      <aside className="avst5-detalhe avst5-evolucao" data-teste="timeline-shell">
        <header className="avst5-det-cab">
          <strong><History size={14} aria-hidden /> Linha do tempo</strong>
          <button type="button" className="avst5-painel-btn" title="Fechar" onClick={aoFechar}><X size={14} aria-hidden /></button>
        </header>

        {badges.length > 0 && (
          <div className="avst5-tl-badges" data-teste="tl-badges" aria-label="Badges conquistados">
            {badges.map((m) => (
              <span key={m.id} className="avst-perfil-badge" title={m.titulo}>
                <Award size={12} aria-hidden /> {m.badge} {m.titulo}
              </span>
            ))}
          </div>
        )}

        {grupos.length === 0 && (
          <p className="avst5-cons-nota" data-teste="tl-vazia">
            Sua linha do tempo nasce com o primeiro salvamento — cada mudança real vira um capítulo (§220).
          </p>
        )}

        {grupos.map(([mes, marcos]) => (
          <section key={mes} className="avst5-tl-mes" data-teste="tl-mes">
            <h4 className="avst5-tl-mes-titulo">{mes}</h4>
            <ol className="avst5-evo-lista">
              {marcos.map((m) => (
                <li key={m.id} className="avst5-evo-marco" data-teste="tl-marco" data-origem={m.origem}>
                  <span className="avst5-evo-thumb" aria-hidden>
                    <img src={dataUriDe(m.config, { estatico: true, tamanho: 96 })} alt="" width={64} height={64} />
                  </span>
                  <div className="avst5-evo-info">
                    <strong>{ROTULO_ORIGEM[m.origem]}</strong>
                    <time>{dataCurta(m.quando)}</time>
                    {m.nota && <em className="avst5-tl-nota" data-teste="tl-nota">“{m.nota}”</em>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <div className="avst-foto-acoes">
          <button type="button" className="avst-botao" data-teste="tl-abrir-evolucao"
            title="Comparar, aplicar ou excluir marcos (§241–§246)"
            onClick={() => { aoFechar(); aoAbrirEvolucao(); }}>
            Gerenciar na Evolução
          </button>
        </div>
      </aside>
    </div>
  );
}
