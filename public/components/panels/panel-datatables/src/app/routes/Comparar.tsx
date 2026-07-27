// app/routes/Comparar.tsx — Comparação estrutural de esquemas entre dois bancos
// (detecção de schema drift entre clones prod/staging/dev). @version 1.0.0
// Só metadados já catalogados (DT_Tabela/DT_Campo) — read-only, não toca os
// bancos monitorados. Escolha A e B → tabelas exclusivas de cada lado + tabelas
// comuns com diferença de coluna (ausente de um lado ou tipo divergente).
import { useEffect, useMemo, useState, type JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRota } from '../../shell/useRota';
import { apiGet, ApiError } from '../../lib/api';
import { fmtInt } from '../../lib/format';
import { MetricCard } from '../../components/ui/MetricCard';
import { Badge } from '../../components/ui/Badge';
import { Icone } from '../../components/ui/Icone';
import { ErrorState, EmptyState, SkeletonCartoes } from '../../components/ui/Estados';
import { Revelar } from '../../components/ui/Revelar';
import css from './Comparar.module.css';

interface BancoOpt { id: number; name: string; environment_label: string | null; table_count: number }
interface TipoDif { column: string; a: string; b: string }
interface TabelaDiff { table: string; cols_only_a: string[]; cols_only_b: string[]; type_changed: TipoDif[]; diff_count: number }
interface Comparacao {
  a: { id: number; name: string; environment_label: string | null };
  b: { id: number; name: string; environment_label: string | null };
  summary: { tables_a: number; tables_b: number; only_a: number; only_b: number; common: number; tables_with_diff: number; col_diffs: number; identical: boolean };
  tables_only_a: string[]; tables_only_b: string[]; tables_diff: TabelaDiff[]; truncated: boolean;
}

export function Comparar(): JSX.Element {
  const [rota, ir] = useRota();
  // A comparação é linkável/compartilhável: lê ?a=&b= no mount e mantém a URL em
  // sincronia com a seleção (ex.: mandar o link de um drift específico ao DBA).
  const paramNum = (v: string | undefined): number | null => { const n = Number(v); return n > 0 ? n : null; };
  const [a, setA] = useState<number | null>(() => paramNum(rota.params.a));
  const [b, setB] = useState<number | null>(() => paramNum(rota.params.b));
  const [baixando, setBaixando] = useState(false);

  useEffect(() => {
    const p: Record<string, string> = {};
    if (a !== null) p.a = String(a);
    if (b !== null) p.b = String(b);
    if ((rota.params.a ?? '') !== (p.a ?? '') || (rota.params.b ?? '') !== (p.b ?? '')) {
      ir({ grupo: 'data', tela: 'compare', params: p }, true); // substitui, não polui histórico
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b]);

  // Download do relatório de drift em CSV (entregável p/ o DBA). GET same-origin,
  // sem CSRF (leitura). Espelha o export da Descoberta.
  const baixarCsv = async (): Promise<void> => {
    if (a === null || b === null) return;
    setBaixando(true);
    try {
      const res = await fetch(`/api/datatables/databases/compare/export?a=${a}&b=${b}`, { credentials: 'same-origin' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const el = document.createElement('a');
      el.href = url; el.download = 'comparar-esquemas.csv';
      document.body.appendChild(el); el.click(); el.remove();
      URL.revokeObjectURL(url);
    } finally { setBaixando(false); }
  };

  const bancos = useQuery({
    queryKey: ['dt', 'databases', 'compareOpts'],
    queryFn: ({ signal }) => apiGet<BancoOpt[]>('/databases', { limit: 100 }, signal),
  });

  const pronto = a !== null && b !== null && a !== b;
  const cmp = useQuery({
    queryKey: ['dt', 'compare', a, b],
    queryFn: ({ signal }) => apiGet<Comparacao>('/databases/compare', { a: a!, b: b! }, signal),
    enabled: pronto,
  });

  const opcoes = useMemo(() => [...(bancos.data ?? [])].sort((x, y) => x.name.localeCompare(y.name, 'pt-BR')), [bancos.data]);

  if (bancos.isPending) return <SkeletonCartoes n={3} />;
  if (bancos.isError) {
    const e = bancos.error as ApiError;
    return <ErrorState mensagem="Não foi possível carregar a lista de bancos." codigo={e.code} onRetry={() => bancos.refetch()} />;
  }

  const trocar = (): void => { setA(b); setB(a); };
  const d = cmp.data;

  return (
    <div className={css.raiz}>
      <Revelar>
        <section className={css.seletores}>
          <Selecao rotulo="Banco A" valor={a} aoMudar={setA} opcoes={opcoes} excluir={b} />
          <button type="button" className={css.seta} onClick={trocar} disabled={a === null && b === null}
            title="Trocar A e B" aria-label="Trocar A e B"><Icone nome="ArrowLeftRight" size={16} /></button>
          <Selecao rotulo="Banco B" valor={b} aoMudar={setB} opcoes={opcoes} excluir={a} />
          {pronto && d && (
            <button type="button" className={css.exportar} onClick={baixarCsv} disabled={baixando}
              title="Exportar o relatório de diferenças em CSV — ex.: entregar ao DBA">
              <Icone nome={baixando ? 'Loader' : 'Download'} size={14} /> {baixando ? 'Exportando…' : 'Exportar CSV'}
            </button>
          )}
        </section>
      </Revelar>

      {!pronto ? (
        <EmptyState icone="GitCompare" titulo="Escolha dois bancos para comparar"
          descricao="A comparação é estrutural (tabelas e colunas do catálogo) — ideal para achar drift entre clones de produção, homologação e desenvolvimento." />
      ) : cmp.isPending ? <SkeletonCartoes n={4} />
      : cmp.isError ? <ErrorState mensagem="Não foi possível comparar os esquemas." codigo={(cmp.error as ApiError).code} onRetry={() => cmp.refetch()} />
      : d ? <Resultado d={d} /> : null}
    </div>
  );
}

function Resultado({ d }: { d: Comparacao }): JSX.Element {
  const s = d.summary;
  return (
    <>
      <Revelar atraso={60}>
        <section className={css.cards}>
          <MetricCard icone="Database" rotulo={`Só em ${d.a.name}`} valor={s.only_a} tom={s.only_a > 0 ? 'atencao' : 'ok'} contexto={`de ${fmtInt(s.tables_a)} tabelas`} />
          <MetricCard icone="Database" rotulo={`Só em ${d.b.name}`} valor={s.only_b} tom={s.only_b > 0 ? 'atencao' : 'ok'} contexto={`de ${fmtInt(s.tables_b)} tabelas`} />
          <MetricCard icone="Columns3" rotulo="Tabelas divergentes" valor={s.tables_with_diff} tom={s.tables_with_diff > 0 ? 'atencao' : 'ok'} contexto={`${fmtInt(s.col_diffs)} diferença(s) de coluna`} />
          <MetricCard icone="Equal" rotulo="Tabelas comuns" valor={s.common} contexto="presentes nos dois" />
        </section>
      </Revelar>

      {s.identical && (
        <div className={css.identico}><Icone nome="CircleCheck" size={15} />
          Esquemas <strong>idênticos</strong> — mesmas tabelas e colunas nos dois bancos.</div>
      )}
      {d.truncated && (
        <div className={css.aviso}><Icone nome="TriangleAlert" size={14} />
          Muitas diferenças — listas limitadas a 300 itens.</div>
      )}

      {(d.tables_only_a.length > 0 || d.tables_only_b.length > 0) && (
        <Revelar atraso={90}>
          <div className={css.duasColunas}>
            <ListaTabelas titulo={`Tabelas só em ${d.a.name}`} icone="ArrowLeft" itens={d.tables_only_a} tom="a" />
            <ListaTabelas titulo={`Tabelas só em ${d.b.name}`} icone="ArrowRight" itens={d.tables_only_b} tom="b" />
          </div>
        </Revelar>
      )}

      {d.tables_diff.length > 0 && (
        <Revelar atraso={120}>
          <section className={css.bloco}>
            <div className={css.blocoTopo}>
              <h2 className={css.blocoTitulo}>Tabelas com diferença de coluna</h2>
              <span className={css.blocoSub}>presentes nos dois, mas com colunas ausentes de um lado ou tipo divergente</span>
            </div>
            <div className={css.diffLista}>
              {d.tables_diff.map((t) => <DiffTabela key={t.table} t={t} an={d.a.name} bn={d.b.name} />)}
            </div>
          </section>
        </Revelar>
      )}
    </>
  );
}

function Selecao({ rotulo, valor, aoMudar, opcoes, excluir }: {
  rotulo: string; valor: number | null; aoMudar: (n: number | null) => void; opcoes: BancoOpt[]; excluir: number | null;
}): JSX.Element {
  return (
    <label className={css.campo}>
      <span className={css.campoRotulo}>{rotulo}</span>
      <select className={css.select} value={valor ?? ''} onChange={(e) => aoMudar(e.target.value ? Number(e.target.value) : null)}>
        <option value="">Selecione…</option>
        {opcoes.map((o) => (
          <option key={o.id} value={o.id} disabled={o.id === excluir}>
            {o.name}{o.environment_label ? ` · ${o.environment_label}` : ''} ({fmtInt(o.table_count)} tab.)
          </option>
        ))}
      </select>
    </label>
  );
}

function ListaTabelas({ titulo, icone, itens, tom }: { titulo: string; icone: string; itens: string[]; tom: 'a' | 'b' }): JSX.Element {
  return (
    <section className={css.bloco}>
      <div className={css.blocoTopo}>
        <h2 className={css.blocoTitulo}><Icone nome={icone} size={14} /> {titulo}</h2>
        <Badge texto={fmtInt(itens.length)} tom={tom === 'a' ? 'info' : 'atencao'} fraco />
      </div>
      {itens.length === 0 ? <p className={css.vazio}>Nenhuma.</p> : (
        <div className={css.chips}>{itens.map((n) => <span key={n} className={css.chipTab}>{n}</span>)}</div>
      )}
    </section>
  );
}

function DiffTabela({ t, an, bn }: { t: TabelaDiff; an: string; bn: string }): JSX.Element {
  return (
    <article className={css.diffCard}>
      <header className={css.diffTopo}>
        <span className={css.diffNome}><Icone nome="TableProperties" size={14} /> {t.table}</span>
        <Badge texto={`${fmtInt(t.diff_count)} dif.`} tom="atencao" fraco />
      </header>
      {t.type_changed.length > 0 && (
        <div className={css.diffGrupo}>
          <span className={css.diffLabel}><Icone nome="Shuffle" size={12} /> Tipo divergente</span>
          {t.type_changed.map((c) => (
            <div key={c.column} className={css.tipoLinha}>
              <span className={css.colNome}>{c.column}</span>
              <span className={css.tipoA} title={`${an}: ${c.a}`}>{c.a}</span>
              <Icone nome="ArrowRight" size={12} />
              <span className={css.tipoB} title={`${bn}: ${c.b}`}>{c.b}</span>
            </div>
          ))}
        </div>
      )}
      {t.cols_only_a.length > 0 && (
        <div className={css.diffGrupo}>
          <span className={css.diffLabel}><Icone nome="ArrowLeft" size={12} /> Colunas só em {an}</span>
          <div className={css.chips}>{t.cols_only_a.map((c) => <span key={c} className={css.colChipA}>{c}</span>)}</div>
        </div>
      )}
      {t.cols_only_b.length > 0 && (
        <div className={css.diffGrupo}>
          <span className={css.diffLabel}><Icone nome="ArrowRight" size={12} /> Colunas só em {bn}</span>
          <div className={css.chips}>{t.cols_only_b.map((c) => <span key={c} className={css.colChipB}>{c}</span>)}</div>
        </div>
      )}
    </article>
  );
}
