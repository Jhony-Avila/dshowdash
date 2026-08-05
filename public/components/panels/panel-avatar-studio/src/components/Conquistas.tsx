// components/Conquistas.tsx — conquistas reais + eventos sazonais.
// @version 3.0.0  @created 2026-07-30  @updated 2026-08-04 (mega 68:
// FILTROS todas/feitas/pendentes + faixa de estatísticas §218–§221)
import { useMemo, useState } from 'react';
import { BarChart3, CalendarDays, Gift, Lock, Trophy } from 'lucide-react';
import type { AvatarConfig, Conquista } from '../domain/types';
import { COLECOES, RARIDADES, itemPorId, progressoColecao } from '../services/AvatarCatalog';
// megas 243–246 (§217/§218/§219/§221): tiers, ordenação, elo com coleção
// e "seus números" — tudo derivado de dados locais/já exibidos
import { itensUsados } from '../services/Progresso';
import { listarPresets } from '../services/PresetsPessoais';
import { listarProjetosFoto } from '../services/ProjetosFoto';
import { marcosEvolucao } from '../services/Evolucao';
import { lerContadores } from '../services/Contadores';
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

// mega 245 (§217): TIER derivado do esforço real (alvo) — determinístico
export function tierConquista(c: Conquista): { id: string; nome: string; cor: string } {
  const alvo = c.progresso.alvo;
  if (alvo <= 1) return { id: 'bronze', nome: 'Bronze', cor: '#b07a4a' };
  if (alvo <= 5) return { id: 'prata', nome: 'Prata', cor: '#aeb6c9' };
  if (alvo <= 12) return { id: 'ouro', nome: 'Ouro', cor: '#e8b64c' };
  if (alvo <= 25) return { id: 'platina', nome: 'Platina', cor: '#7cd9ff' };
  return { id: 'diamante', nome: 'Diamante', cor: '#7c5cff' };
}

function CardConquista({ c }: { c: Conquista }) {
  const recompensa = c.recompensa ? itemPorId(c.recompensa) : undefined;
  const pct = Math.round((c.progresso.atual / c.progresso.alvo) * 100);
  const v2 = flag('as5.progressao_v2');
  // mega 243 (§219): a COLEÇÃO ligada à conquista (via recompensa)
  const colecaoLigada = v2 && recompensa
    ? COLECOES.find((col) => col.itens.includes(recompensa.id))
    : undefined;
  const tier = v2 ? tierConquista(c) : null;
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
        {tier && (
          <span className="avst-conq-tier" data-teste="conq-tier" data-tier={tier.id}
            style={{ color: tier.cor, borderColor: tier.cor }}>{tier.nome}</span>
        )}
        {colecaoLigada && (
          <span className="avst-conquista-premio" data-teste="conq-colecao">
            <Trophy size={11} aria-hidden /> Coleção: {colecaoLigada.nome}
          </span>
        )}
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
  // mega 244 (§218): ORDENAÇÃO — mais difíceis / últimas / mais raras
  const [ordem, setOrdem] = useState<'padrao' | 'dificeis' | 'ultimas' | 'raras'>('padrao');
  const v2 = flag('as5.progressao_v2');
  // mega 246 (§221): SEUS NÚMEROS — contadores locais derivados
  const numeros = useMemo(() => {
    if (!v2) return null;
    const usados2 = itensUsados();
    const contadores = lerContadores();
    return [
      ['Marcos do avatar', marcosEvolucao().length],
      ['Presets salvos', listarPresets().length],
      ['Projetos de foto', listarProjetosFoto().length],
      ['Itens explorados', usados2.size],
      ['Coleções completas', COLECOES.filter((col) => { const pr = progressoColecao(col, usados2); return pr.usados === pr.total; }).length],
      ['Poderes ativados', contadores.poderes ?? 0],
    ] as Array<[string, number]>;
  }, [v2]);
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

      {/* mega 244 (§218): ordenações — com ordem ativa a lista vira ÚNICA
          (rankeada), sem os grupos por categoria */}
      {v2 && (
        <div className="avst-conq-filtros" role="radiogroup" aria-label="Ordenar conquistas (§218)" data-teste="conq-ordem">
          {([['padrao', 'Por categoria'], ['dificeis', 'Mais difíceis'], ['ultimas', 'Últimas'], ['raras', 'Mais raras']] as const).map(([id, nome]) => (
            <button key={id} type="button" role="radio" aria-checked={ordem === id}
              className={`avst-ft-chip ${ordem === id ? 'avst-ft-chip-ativo' : ''}`}
              data-teste={`ordem-${id}`}
              onClick={() => setOrdem(id)}>{nome}</button>
          ))}
        </div>
      )}
      {v2 && ordem !== 'padrao' ? (
        <section className="avst-conq-grupo" aria-label="Conquistas ordenadas" data-teste="conq-rank">
          {vida.conquistas
            .filter((c) => filtro === 'todas' || (filtro === 'feitas' ? c.conquistada : !c.conquistada))
            .sort((a, b2) => {
              if (ordem === 'dificeis') return (a.progresso.atual / a.progresso.alvo) - (b2.progresso.atual / b2.progresso.alvo);
              if (ordem === 'ultimas') return String(b2.em ?? '').localeCompare(String(a.em ?? ''));
              return b2.progresso.alvo - a.progresso.alvo; // raras = maior esforço (tier §217) primeiro
            })
            .map((c) => <CardConquista key={c.id} c={c} />)}
        </section>
      ) : CATEGORIAS_CONQ.map((cat) => {
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
      {/* mega 246 (§221): SEUS NÚMEROS */}
      {numeros && (
        <div className="avst-conq-numeros" data-teste="conq-numeros" role="list" aria-label="Seus números (§221)">
          <h3 className="avst-cores-titulo"><BarChart3 size={14} aria-hidden /> Seus números</h3>
          <div className="avst-conq-numeros-grade">
            {numeros.map(([nome, n]) => (
              <span key={nome} role="listitem"><strong>{n}</strong> {nome}</span>
            ))}
          </div>
        </div>
      )}
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
