// components/Conquistas.tsx — conquistas reais + eventos sazonais.
// @version 2.0.0  @created 2026-07-30  @updated 2026-07-30 (4.6 §8.3, Onda 4)
//
// v2 — 30 conquistas em 5 CATEGORIAS, cada uma com BARRA DE PROGRESSO
// auditável (atual/alvo vem do servidor, calculado só de dados reais).
import { CalendarDays, Gift, Lock, Trophy } from 'lucide-react';
import type { Conquista } from '../domain/types';
import { RARIDADES, itemPorId } from '../services/AvatarCatalog';
import type { Vida } from '../services/VidaService';

function fmtData(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const CATEGORIAS_CONQ: Array<{ id: string; nome: string }> = [
  { id: 'criacao', nome: 'Criação' },
  { id: 'exploracao', nome: 'Exploração' },
  { id: 'colecao', nome: 'Coleção' },
  { id: 'dedicacao', nome: 'Dedicação' },
  { id: 'maestria', nome: 'Maestria' },
];

function CardConquista({ c }: { c: Conquista }) {
  const recompensa = c.recompensa ? itemPorId(c.recompensa) : undefined;
  const pct = Math.round((c.progresso.atual / c.progresso.alvo) * 100);
  return (
    <article className={`avst-conquista ${c.conquistada ? 'avst-conquista-ok' : ''}`}>
      <span className="avst-conquista-icone">
        {c.conquistada ? <Trophy size={16} aria-hidden /> : <Lock size={14} aria-hidden />}
      </span>
      <div className="avst-conquista-info">
        <strong>{c.nome}</strong>
        <span>{c.descricao}</span>
        {/* barra de progresso (§8.3) — sempre visível, mesmo concluída */}
        <span className="avst-conq-progresso" role="progressbar"
          aria-valuenow={c.progresso.atual} aria-valuemin={0} aria-valuemax={c.progresso.alvo}>
          <span className="avst-conq-barra"><i style={{ width: `${pct}%` }} /></span>
          <em>{c.progresso.atual}/{c.progresso.alvo}</em>
        </span>
        {c.conquistada && c.em && <em>Conquistada em {fmtData(c.em)}</em>}
        {recompensa && (
          <span className="avst-conquista-premio"
            style={{ '--avst-rar': RARIDADES[recompensa.raridade].cor } as React.CSSProperties}>
            <Gift size={11} aria-hidden /> {c.conquistada ? 'Liberou' : 'Libera'}: {recompensa.nome}
          </span>
        )}
      </div>
    </article>
  );
}

export function Conquistas({ vida }: { vida: Vida | null }) {
  if (!vida) {
    return (
      <div className="avst-vazio">
        <Trophy size={26} aria-hidden />
        <p>As conquistas vêm do servidor — não foi possível carregá-las agora.</p>
      </div>
    );
  }

  const feitas = vida.conquistas.filter((c) => c.conquistada).length;
  const pctGeral = vida.conquistas.length > 0 ? Math.round((feitas / vida.conquistas.length) * 100) : 0;

  return (
    <div className="avst-conquistas">
      <p className="avst-conquistas-resumo">
        <Trophy size={13} aria-hidden /> {feitas}/{vida.conquistas.length} conquistas ({pctGeral}%) — todas medidas em dados reais do seu uso.
      </p>

      {CATEGORIAS_CONQ.map((cat) => {
        const doGrupo = vida.conquistas.filter((c) => c.categoria === cat.id);
        if (doGrupo.length === 0) return null;
        const ok = doGrupo.filter((c) => c.conquistada).length;
        return (
          <section key={cat.id} className="avst-conq-grupo" aria-label={cat.nome}>
            <h3 className="avst-cores-titulo avst-conq-cab">
              {cat.nome} <em>{ok}/{doGrupo.length}</em>
            </h3>
            {doGrupo.map((c) => <CardConquista key={c.id} c={c} />)}
          </section>
        );
      })}
      {/* conquistas de categorias futuras (fontes novas, ex.: Pipedrive) */}
      {vida.conquistas.filter((c) => !CATEGORIAS_CONQ.some((k) => k.id === c.categoria))
        .map((c) => <CardConquista key={c.id} c={c} />)}

      <h3 className="avst-cores-titulo" style={{ marginTop: 14 }}>
        <CalendarDays size={14} aria-hidden /> Eventos
      </h3>
      {vida.eventos.map((e) => (
        <article key={e.id} className={`avst-conquista ${e.ativo ? 'avst-conquista-ok' : ''}`}>
          <span className="avst-conquista-icone">
            <CalendarDays size={15} aria-hidden />
          </span>
          <div className="avst-conquista-info">
            <strong>{e.nome} {e.ativo && <span className="avst-evento-ativo">ATIVO</span>}</strong>
            <span>{e.descricao}</span>
            <em>{new Date(e.inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – {new Date(e.fim).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</em>
            <span className="avst-conquista-premio">
              <Gift size={11} aria-hidden /> {e.itens.map((id) => itemPorId(id)?.nome).filter(Boolean).join(', ')}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
