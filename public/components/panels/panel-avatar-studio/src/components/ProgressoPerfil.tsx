// components/ProgressoPerfil.tsx — perfil de progressão (AS5 F7; §220–§224 + §89).
// @version 1.0.0  @created 2026-07-31
//
// GAMIFICAÇÃO RESPONSÁVEL (§634): tudo aqui é DERIVADO de dados que o
// usuário já vê (conquistas do servidor + itens explorados) com fórmula
// TRANSPARENTE exibida na própria UI. Sem ranking, sem punição, sem
// perda silenciosa — XP só cresce.
//   XP  = 40 × conquistas concluídas + 2 × itens explorados
//   Nível N exige N×N×60 XP acumulado (curva suave, sem paywall)
//   Badge (§224) = categoria de conquistas 100% completa
// §220: timeline das conquistas com data, mais recentes primeiro.
// §89: recomendação CONTEXTUAL — a coleção mais perto de completar.
import { Award, Flag, Sparkles, TrendingUp } from 'lucide-react';
import type { Conquista } from '../domain/types';
import { COLECOES, itemPorId, progressoColecao } from '../services/AvatarCatalog';
import { itensUsados } from '../services/Progresso';

const XP_CONQUISTA = 40;
const XP_ITEM = 2;

export function calcularXp(conquistas: Conquista[], itensExplorados: number): number {
  return conquistas.filter((c) => c.conquistada).length * XP_CONQUISTA
    + itensExplorados * XP_ITEM;
}

/** Nível N exige N²×60 XP acumulado — devolve nível atual e a janela dele. */
export function nivelDe(xp: number): { nivel: number; base: number; teto: number } {
  let nivel = 1;
  while ((nivel + 1) * (nivel + 1) * 60 <= xp) nivel += 1;
  return { nivel, base: nivel * nivel * 60, teto: (nivel + 1) * (nivel + 1) * 60 };
}

function fmtData(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const NOME_CATEGORIA: Record<string, string> = {
  criacao: 'Criação', exploracao: 'Exploração', colecao: 'Coleção',
  dedicacao: 'Dedicação', maestria: 'Maestria',
};

export function ProgressoPerfil({ conquistas }: { conquistas: Conquista[] }) {
  const usados = itensUsados();
  const xp = calcularXp(conquistas, usados.size);
  const { nivel, base, teto } = nivelDe(xp);
  const pct = Math.min(100, Math.round(((xp - base) / (teto - base)) * 100));

  // §224: badge por categoria 100% completa
  const badges = Object.entries(NOME_CATEGORIA).filter(([id]) => {
    const grupo = conquistas.filter((c) => c.categoria === id);
    return grupo.length > 0 && grupo.every((c) => c.conquistada);
  });

  // §220: timeline — conquistadas com data, mais recentes primeiro (top 8)
  const linha = conquistas
    .filter((c) => c.conquistada && c.em)
    .sort((a, b) => String(b.em).localeCompare(String(a.em)))
    .slice(0, 8);

  // §89: coleção INCOMPLETA mais próxima de completar (recomendação honesta)
  const proxima = COLECOES
    .map((col) => ({ col, p: progressoColecao(col, usados) }))
    .filter(({ p }) => p.usados < p.total)
    .sort((a, b) => (b.p.usados / b.p.total) - (a.p.usados / a.p.total))[0];
  const faltantes = proxima
    ? proxima.col.itens.filter((id) => !usados.has(id)).map((id) => itemPorId(id)?.nome ?? id)
    : [];

  return (
    <section className="avst-perfil" aria-label="Seu progresso" data-teste="perfil-progresso">
      <div className="avst-perfil-nivel">
        <span className="avst-perfil-selo"><TrendingUp size={15} aria-hidden /> Nível {nivel}</span>
        <div className="avst-perfil-xp">
          <span className="avst-conq-barra"><i style={{ width: `${pct}%` }} /></span>
          <em>{xp} XP · faltam {teto - xp} para o nível {nivel + 1}</em>
        </div>
        <small className="avst-perfil-formula">
          Fórmula aberta (§634): {XP_CONQUISTA} XP por conquista + {XP_ITEM} XP por item explorado — XP nunca diminui.
        </small>
      </div>

      {badges.length > 0 && (
        <div className="avst-perfil-badges" aria-label="Insígnias">
          {badges.map(([id, nome]) => (
            <span key={id} className="avst-perfil-badge"><Award size={12} aria-hidden /> {nome} completa</span>
          ))}
        </div>
      )}

      {proxima && (
        <p className="avst-perfil-dica" data-teste="recomendacao">
          <Sparkles size={12} aria-hidden /> Quase lá: <strong>{proxima.col.nome}</strong>{' '}
          ({proxima.p.usados}/{proxima.p.total}) — falta explorar {faltantes.slice(0, 3).join(', ')}
          {faltantes.length > 3 ? '…' : ''}.
        </p>
      )}

      {linha.length > 0 && (
        <div className="avst-perfil-timeline" aria-label="Linha do tempo de conquistas">
          <h4 className="avst-props-titulo-claro"><Flag size={12} aria-hidden /> Últimas conquistas</h4>
          <ol>
            {linha.map((c) => (
              <li key={c.id}><em>{fmtData(c.em)}</em> <span>{c.nome}</span></li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
