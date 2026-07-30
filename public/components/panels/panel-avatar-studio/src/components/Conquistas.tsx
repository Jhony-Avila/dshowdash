// components/Conquistas.tsx — conquistas reais + eventos sazonais (AS3 F3).
// @version 1.0.0  @created 2026-07-30
import { CalendarDays, Gift, Lock, Trophy } from 'lucide-react';
import { RARIDADES, itemPorId } from '../services/AvatarCatalog';
import type { Vida } from '../services/VidaService';

function fmtData(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
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

  return (
    <div className="avst-conquistas">
      <p className="avst-conquistas-resumo">
        <Trophy size={13} aria-hidden /> {feitas}/{vida.conquistas.length} conquistas — todas medidas em dados reais do seu uso.
      </p>

      {vida.conquistas.map((c) => {
        const recompensa = c.recompensa ? itemPorId(c.recompensa) : undefined;
        return (
          <article key={c.id} className={`avst-conquista ${c.conquistada ? 'avst-conquista-ok' : ''}`}>
            <span className="avst-conquista-icone">
              {c.conquistada ? <Trophy size={16} aria-hidden /> : <Lock size={14} aria-hidden />}
            </span>
            <div className="avst-conquista-info">
              <strong>{c.nome}</strong>
              <span>{c.descricao}</span>
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
      })}

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
