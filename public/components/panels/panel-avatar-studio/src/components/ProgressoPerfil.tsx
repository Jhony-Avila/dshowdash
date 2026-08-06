// components/ProgressoPerfil.tsx — perfil de progressão (AS5 F7; §220–§224 + §89;
// lote 291–300: XP por uso §222–§223, títulos de nível §222, badges por
// tier §224 v2 e extrato transparente §634 — flag as5.microinteracoes).
// @version 2.0.0  @created 2026-07-31  @updated 2026-08-05
//
// GAMIFICAÇÃO RESPONSÁVEL (§634): tudo aqui é DERIVADO de dados que o
// usuário já vê (conquistas do servidor + itens explorados + contadores
// locais) com fórmula TRANSPARENTE exibida na própria UI. Sem ranking,
// sem punição, sem perda silenciosa — XP só cresce.
//   XP  = 40 × conquistas + 2 × itens explorados
//       + (v3 §223) 3 × poderes + 5 × apresentações + 2 × capturas
//   Nível N exige N×N×60 XP acumulado (curva suave, sem paywall)
//   Badge (§224) = categoria de conquistas: 50% bronze · 80% prata · 100% ouro
// §220: timeline das conquistas com data, mais recentes primeiro.
// §89: recomendação CONTEXTUAL — a coleção mais perto de completar.
import { Award, Flag, Sparkles, TrendingUp } from 'lucide-react';
import type { Conquista } from '../domain/types';
import { COLECOES, itemPorId, progressoColecao } from '../services/AvatarCatalog';
import { itensUsados } from '../services/Progresso';
import { lerContadores } from '../services/Contadores';
import { flag } from '../nucleo/flags';

const XP_CONQUISTA = 40;
const XP_ITEM = 2;
// mega 292 (§222–§223): USO entra na fórmula — pesos pequenos e visíveis
const XP_PODER = 3;
const XP_APRESENTACAO = 5;
const XP_CAPTURA = 2;

/** mega 292 (§223): XP por uso a partir dos contadores locais (§221). */
export function xpDeUso(contadores: Record<string, number>): number {
  return (contadores.poderes ?? 0) * XP_PODER
    + (contadores.apresentacoes ?? 0) * XP_APRESENTACAO
    + (contadores.capturas ?? 0) * XP_CAPTURA;
}

export function calcularXp(conquistas: Conquista[], itensExplorados: number, contadores?: Record<string, number>): number {
  return conquistas.filter((c) => c.conquistada).length * XP_CONQUISTA
    + itensExplorados * XP_ITEM
    + (contadores ? xpDeUso(contadores) : 0);
}

/** Nível N exige N²×60 XP acumulado — devolve nível atual e a janela dele. */
export function nivelDe(xp: number): { nivel: number; base: number; teto: number } {
  let nivel = 1;
  while ((nivel + 1) * (nivel + 1) * 60 <= xp) nivel += 1;
  return { nivel, base: nivel * nivel * 60, teto: (nivel + 1) * (nivel + 1) * 60 };
}

/** mega 293 (§222): TÍTULO textual do nível (título ≠ badge — §224). */
export function tituloDoNivel(nivel: number): string {
  if (nivel >= 30) return 'Lenda do Estúdio';
  if (nivel >= 20) return 'Mestre de Estúdio';
  if (nivel >= 12) return 'Estilista Sênior';
  if (nivel >= 7) return 'Artesão de Avatares';
  if (nivel >= 3) return 'Aprendiz de Estúdio';
  return 'Iniciante';
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

// mega 294 (§224 v2): tier do badge pela fração concluída da categoria
const TIERS_BADGE: Array<{ id: string; nome: string; minimo: number; cor: string }> = [
  { id: 'ouro', nome: 'Ouro', minimo: 1, cor: '#e8b64c' },
  { id: 'prata', nome: 'Prata', minimo: 0.8, cor: '#aeb6c9' },
  { id: 'bronze', nome: 'Bronze', minimo: 0.5, cor: '#b07a4a' },
];

export function ProgressoPerfil({ conquistas }: { conquistas: Conquista[] }) {
  const v3 = flag('as5.microinteracoes'); // lote 291–300
  const usados = itensUsados();
  const contadores = v3 ? lerContadores() : undefined;
  const xp = calcularXp(conquistas, usados.size, contadores);
  const { nivel, base, teto } = nivelDe(xp);
  const pct = Math.min(100, Math.round(((xp - base) / (teto - base)) * 100));

  // §224: badges por categoria — v2 (mega 294) com tiers 50/80/100%
  const badges = Object.entries(NOME_CATEGORIA).map(([id, nome]) => {
    const grupo = conquistas.filter((c) => c.categoria === id);
    if (grupo.length === 0) return null;
    const fracao = grupo.filter((c) => c.conquistada).length / grupo.length;
    const tier = v3
      ? TIERS_BADGE.find((t) => fracao >= t.minimo)
      : (fracao === 1 ? TIERS_BADGE[0] : undefined);
    return tier ? { id, nome, tier } : null;
  }).filter((b): b is NonNullable<typeof b> => b !== null);

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

  // mega 295 (§634): EXTRATO do XP — de onde veio cada ponto
  const extrato = v3 ? [
    ['Conquistas', conquistas.filter((c) => c.conquistada).length * XP_CONQUISTA],
    ['Itens explorados', usados.size * XP_ITEM],
    ['Poderes ativados', (contadores?.poderes ?? 0) * XP_PODER],
    ['Apresentações', (contadores?.apresentacoes ?? 0) * XP_APRESENTACAO],
    ['Capturas', (contadores?.capturas ?? 0) * XP_CAPTURA],
  ].filter(([, v]) => (v as number) > 0) as Array<[string, number]> : [];

  return (
    <section className="avst-perfil" aria-label="Seu progresso" data-teste="perfil-progresso">
      <div className="avst-perfil-nivel">
        <span className="avst-perfil-selo">
          <TrendingUp size={15} aria-hidden /> Nível {nivel}
          {/* mega 293 (§222): título textual do nível */}
          {v3 && <em className="avst-perfil-titulo-nivel" data-teste="titulo-nivel">{tituloDoNivel(nivel)}</em>}
        </span>
        <div className="avst-perfil-xp">
          <span className="avst-conq-barra"><i style={{ width: `${pct}%` }} /></span>
          <em>{xp} XP · faltam {teto - xp} para o nível {nivel + 1}</em>
        </div>
        <small className="avst-perfil-formula">
          Fórmula aberta (§634): {XP_CONQUISTA} XP por conquista + {XP_ITEM} XP por item explorado
          {v3 && <> + uso real ({XP_PODER}/poder · {XP_APRESENTACAO}/apresentação · {XP_CAPTURA}/captura §223)</>}
          {' '}— XP nunca diminui.
        </small>
        {/* mega 295 (§634): extrato transparente */}
        {extrato.length > 0 && (
          <ul className="avst-perfil-extrato" data-teste="xp-extrato" aria-label="De onde veio seu XP">
            {extrato.map(([nome, v]) => (
              <li key={nome}><span>{nome}</span><strong>+{v}</strong></li>
            ))}
          </ul>
        )}
      </div>

      {badges.length > 0 && (
        <div className="avst-perfil-badges" aria-label="Insígnias">
          {badges.map((b) => (
            <span key={b.id} className="avst-perfil-badge" data-tier={b.tier.id}
              style={v3 ? { borderColor: b.tier.cor } : undefined}>
              <Award size={12} aria-hidden /> {b.nome}{v3 ? ` · ${b.tier.nome}` : ' completa'}
            </span>
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
