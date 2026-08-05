// components/Conquistas.tsx — conquistas reais + eventos sazonais.
// @version 3.0.0  @created 2026-07-30  @updated 2026-08-04 (mega 68:
// FILTROS todas/feitas/pendentes + faixa de estatísticas §218–§221)
import { useState } from 'react';
import { CalendarDays, Gift, Lock, Trophy } from 'lucide-react';
import type { AvatarConfig, Conquista } from '../domain/types';
import { RARIDADES, itemPorId } from '../services/AvatarCatalog';
import type { Vida } from '../services/VidaService';
import { ProgressoPerfil } from './ProgressoPerfil';
// mega 230 (§1076/§1077): Minha Vitrine no perfil (flag as5.vitrine_pessoal)
import { MinhaVitrine } from './MinhaVitrine';
import { flag } from '../nucleo/flags';

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

type FiltroConq = 'todas' | 'feitas' | 'pendentes';

export function Conquistas({ vida, carregando = false, config }: {
  vida: Vida | null;
  carregando?: boolean;
  /** mega 230 (§1076): habilita a Minha Vitrine (ausente = perfil clássico) */
  config?: AvatarConfig;
}) {
  // mega 68 (§218): filtro — hooks ANTES de qualquer early return
  const [filtro, setFiltro] = useState<FiltroConq>('todas');
  // §557: carregar ≠ falhar — enquanto a vida não RESOLVE, skeleton
  if (!vida && carregando) {
    return (
      <div className="avst-conquistas" role="status" aria-label="Carregando conquistas"
        data-teste="esqueleto-conquistas">
        <span className="avst-esqueleto" style={{ height: 92 }} />
        <span className="avst-esqueleto" style={{ height: 18, width: '60%' }} />
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className="avst-esqueleto" style={{ height: 58 }} />
        ))}
      </div>
    );
  }
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
      {/* AS5 F7 (§220-§224 + §89): nível/XP transparentes, badges, timeline */}
      <ProgressoPerfil conquistas={vida.conquistas} />
      {/* mega 230 (§1076/§1077): Minha Vitrine + galerias locais */}
      {config && flag('as5.vitrine_pessoal') && (
        <MinhaVitrine config={config} conquistas={vida.conquistas} />
      )}
      <p className="avst-conquistas-resumo">
        <Trophy size={13} aria-hidden /> {feitas}/{vida.conquistas.length} conquistas ({pctGeral}%) — todas medidas em dados reais do seu uso.
      </p>

      {/* mega 68 (§221): faixa de ESTATÍSTICAS por categoria */}
      <div className="avst-conq-stats" data-teste="conq-stats" role="list" aria-label="Estatísticas por categoria">
        {CATEGORIAS_CONQ.map((cat) => {
          const doGrupo = vida.conquistas.filter((c) => c.categoria === cat.id);
          if (doGrupo.length === 0) return null;
          const ok = doGrupo.filter((c) => c.conquistada).length;
          return (
            <span key={cat.id} role="listitem" title={`${cat.nome}: ${ok}/${doGrupo.length}`}>
              {cat.nome} <strong>{Math.round((ok / doGrupo.length) * 100)}%</strong>
            </span>
          );
        })}
      </div>

      {/* mega 68 (§218): FILTRO todas/feitas/pendentes */}
      <div className="avst-conq-filtros" role="radiogroup" aria-label="Filtrar conquistas" data-teste="conq-filtros">
        {([['todas', 'Todas'], ['feitas', 'Conquistadas'], ['pendentes', 'Pendentes']] as Array<[FiltroConq, string]>).map(([id, nome]) => (
          <button key={id} type="button" role="radio" aria-checked={filtro === id}
            className={`avst-ft-chip ${filtro === id ? 'avst-ft-chip-ativo' : ''}`}
            onClick={() => setFiltro(id)}>{nome}</button>
        ))}
      </div>

      {CATEGORIAS_CONQ.map((cat) => {
        const doGrupo = vida.conquistas.filter((c) => c.categoria === cat.id
          && (filtro === 'todas' || (filtro === 'feitas' ? c.conquistada : !c.conquistada)));
        if (doGrupo.length === 0) return null;
        const ok = doGrupo.filter((c) => c.conquistada).length;
        return (
          <section key={cat.id} className="avst-conq-grupo" aria-label={cat.nome}>
            <h3 className="avst-cores-titulo avst-conq-cab">
              {cat.nome} <em>{filtro === 'todas' ? `${ok}/${doGrupo.length}` : `${doGrupo.length}`}</em>
            </h3>
            {doGrupo.map((c) => <CardConquista key={c.id} c={c} />)}
          </section>
        );
      })}
      {/* conquistas de categorias futuras (fontes novas, ex.: Pipedrive) */}
      {vida.conquistas.filter((c) => !CATEGORIAS_CONQ.some((k) => k.id === c.categoria)
        && (filtro === 'todas' || (filtro === 'feitas' ? c.conquistada : !c.conquistada)))
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
