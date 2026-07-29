// screens/FilaMorta.tsx — fila morta: painel e reprocessamento em massa (backlog #41).
// @version 1.0.0  @created 2026-07-28
//
// Antes disto so existia reenfileirar 1 a 1 (POST /queue/requeue). Numa quebra real —
// token expirado, mudanca de contrato na API — os mortos chegam as centenas de uma vez,
// que e exatamente quando 1 a 1 deixa de ser viavel.
//
// A unidade que a tela usa nao e o job morto: e o ALVO (entidade + id externo). Varios
// mortos do mesmo negocio pedem o mesmo re-fetch, entao valem UMA chamada de API. Por
// isso o custo anunciado, o teto do lote e o botao contam alvos, nao linhas.
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiWrite, chaves, ApiError } from '../lib/api';
import { fmtData, fmtNum } from '../lib/format';
import { EstadoErro, EstadoVazio, SkeletonBloco } from './Estados';
import { AcaoCritica } from './Abas';
import { CheckCircle2 } from 'lucide-react';
import type { PipeDeadData, PipeDeadRow, PipeRequeueBulkResult } from '../shell/types';

const POR_PAGINA = 25;

/** Chave do alvo — a mesma identidade que o backend usa para colapsar. */
const alvoDe = (r: PipeDeadRow) => `${r.entity ?? ''}:${r.external_id ?? ''}`;

export function FilaMorta({ jobsDone }: { jobsDone?: number }) {
  const qc = useQueryClient();
  const [entidade, setEntidade] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  // Guarda a LINHA, nao so o id: o custo em chamadas de API depende do alvo dela.
  const [selecao, setSelecao] = useState<Map<number, PipeDeadRow>>(new Map());
  const [ocupado, setOcupado] = useState('');
  const [resultado, setResultado] = useState<PipeRequeueBulkResult | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery<PipeDeadData>({
    queryKey: [...chaves.queueDead, entidade ?? 'todas', pagina],
    queryFn: ({ signal }) =>
      apiGet<PipeDeadData>('/queue/dead',
        { entity: entidade ?? undefined, page: pagina, per_page: POR_PAGINA }, signal),
    refetchInterval: 60_000,
  });

  const stats = data?.stats;
  const lista = data?.lista;
  const itens = lista?.itens ?? [];

  const selecionados = useMemo(() => [...selecao.values()], [selecao]);
  const alvosSelecionados = useMemo(
    () => new Set(selecionados.map(alvoDe)).size, [selecionados]);

  const trocarFiltro = (e: string | null) => { setEntidade(e); setPagina(1); setResultado(null); };
  const alternar = (r: PipeDeadRow) => {
    setSelecao((m) => {
      const n = new Map(m);
      if (n.has(r.id)) n.delete(r.id); else n.set(r.id, r);
      return n;
    });
  };
  const todosDaPagina = itens.length > 0 && itens.every((r) => selecao.has(r.id));
  const alternarPagina = () => {
    setSelecao((m) => {
      const n = new Map(m);
      if (todosDaPagina) itens.forEach((r) => n.delete(r.id));
      else itens.forEach((r) => n.set(r.id, r));
      return n;
    });
  };

  async function reprocessar(corpo: { ids?: number[]; entity?: string }, marca: string) {
    setOcupado(marca); setErro(null); setResultado(null);
    try {
      const { data: r } = await apiWrite<PipeRequeueBulkResult>('/queue/requeue-bulk', 'POST', corpo);
      setResultado(r);
      setSelecao(new Map());
      setPagina(1);
      await refetch();
      // A fila morta e um numero do painel de saude: reprocessar muda os dois.
      await qc.invalidateQueries({ queryKey: chaves.health });
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Falha ao reprocessar o lote.');
    } finally {
      setOcupado('');
    }
  }

  if (error instanceof ApiError) {
    return (
      <div className="pp-card" style={{ maxWidth: 820 }}>
        <h3>Fila morta</h3>
        <EstadoErro detalhe={error.ehAuth ? 'Sua sessão expirou. Recarregue a página e entre novamente.' : 'Falha ao consultar a fila morta.'}
          onRetry={error.ehAuth ? undefined : () => void refetch()} />
      </div>
    );
  }
  if (isLoading || !stats) {
    return <div className="pp-card" style={{ maxWidth: 820 }}><h3>Fila morta</h3><SkeletonBloco linhas={3} /></div>;
  }

  // Estado saudavel — hoje o de producao. Vale dizer o que ele significa, senao um
  // card vazio parece painel quebrado.
  if (stats.total === 0) {
    return (
      <div className="pp-card" style={{ maxWidth: 820 }}>
        <h3>Fila morta</h3>
        <EstadoVazio Icon={CheckCircle2} titulo="Nenhum job descartado"
          descricao={<>
            Todo evento recebido foi aplicado{jobsDone ? <> — {fmtNum(jobsDone)} jobs concluídos</> : null}, nenhum
            esgotou as 5 tentativas. Se algum descartar, ele aparece aqui com o erro e pode ser
            reprocessado em lote.
          </>} />
        {resultado && <ResumoLote r={resultado} />}
      </div>
    );
  }

  const doFiltro = entidade
    ? stats.por_entidade.find((p) => p.entity === entidade)
    : null;
  const alvosDoFiltro = doFiltro ? doFiltro.alvos : stats.alvos;
  const totalDoFiltro = doFiltro ? doFiltro.total : stats.total;

  return (
    <div className="pp-card" style={{ maxWidth: 'none' }}>
      <h3>Fila morta — reprocessamento</h3>

      <div className="pp-tiles" style={{ maxWidth: 'none', marginBottom: 12 }}>
        <Tile n={fmtNum(stats.total)} l="Jobs descartados" cor="var(--pp-danger)" />
        <Tile n={fmtNum(stats.alvos)} l="Alvos distintos" />
        <Tile n={stats.mais_antigo ? fmtData(stats.mais_antigo) : '—'} l="Mais antigo" />
        <Tile n={stats.mais_novo ? fmtData(stats.mais_novo) : '—'} l="Mais recente" />
      </div>

      <div className="pp-note" style={{ marginBottom: 12 }}>
        {fmtNum(stats.total)} jobs descartados apontam para <strong>{fmtNum(stats.alvos)} alvos</strong> distintos.
        Reprocessar custa <strong>uma chamada de API por alvo</strong>, não por job: os descartes
        repetidos do mesmo registro são absorvidos por um só. O lote reprocessa até{' '}
        {fmtNum(stats.teto_lote)} alvos por vez — o que passar disso fica na fila e é informado.
      </div>

      {/* Recorte por entidade — mesmo padrao de seletor do Kanban (#26). */}
      <div className="pp-toolbar" style={{ marginBottom: 10 }}>
        <div className="pp-toolbar-l">
          <label className="pp-k" htmlFor="pp-fm-ent">Entidade</label>
          <select id="pp-fm-ent" className="pp-select" value={entidade ?? 'todas'}
            onChange={(ev) => trocarFiltro(ev.target.value === 'todas' ? null : ev.target.value)}>
            <option value="todas">Todas ({fmtNum(stats.total)} jobs · {fmtNum(stats.alvos)} alvos)</option>
            {stats.por_entidade.map((p) => (
              <option key={p.entity} value={p.entity}>
                {p.entity} ({fmtNum(p.total)} jobs · {fmtNum(p.alvos)} alvos)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Erros mais frequentes — o "por que morreram", que decide se reprocessar adianta */}
      {stats.por_erro.length > 0 && (
        <details style={{ marginBottom: 12 }}>
          <summary className="pp-sub" style={{ cursor: 'pointer' }}>
            Motivos do descarte ({stats.por_erro.length})
          </summary>
          <table className="pp-table" style={{ marginTop: 8 }}>
            <thead><tr><th>Erro</th><th className="ta-r">Jobs</th></tr></thead>
            <tbody>
              {stats.por_erro.map((e) => (
                <tr key={e.erro}><td className="pp-td-sub">{e.erro}</td><td className="ta-r">{fmtNum(e.total)}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      {erro && <div className="pp-msg err" role="alert" style={{ marginBottom: 10 }}>{erro}</div>}
      {resultado && <ResumoLote r={resultado} />}

      {/* Acoes */}
      <AcaoCritica
        titulo={`Reprocessar selecionados (${fmtNum(selecionados.length)})`}
        risco="medio"
        rotulo="Reprocessar"
        rotuloOcupado="Reenfileirando…"
        ocupado={ocupado === 'sel'}
        desabilitado={selecionados.length === 0 || ocupado !== ''}
        motivoDesabilitado="Selecione ao menos um job na tabela abaixo."
        descricao={selecionados.length === 0
          ? <>Marque jobs na tabela para reenfileirá-los.</>
          : <>{fmtNum(selecionados.length)} jobs marcados, em <strong>{fmtNum(alvosSelecionados)} alvos</strong>
            {' '}— custa {fmtNum(alvosSelecionados)} chamada{alvosSelecionados === 1 ? '' : 's'} de API.</>}
        onExecutar={() => void reprocessar({ ids: selecionados.map((r) => r.id) }, 'sel')}
      />

      <AcaoCritica
        titulo={entidade ? `Reprocessar todos de “${entidade}”` : 'Reprocessar todos (por entidade)'}
        risco="alto"
        rotulo={entidade ? 'Reprocessar tudo' : 'Escolha uma entidade'}
        rotuloOcupado="Reenfileirando…"
        ocupado={ocupado === 'ent'}
        desabilitado={entidade === null || ocupado !== ''}
        motivoDesabilitado="Escolha uma entidade acima. O lote nunca reprocessa a fila inteira de uma vez."
        pergunta={<>Reenfileirar <strong>{fmtNum(Math.min(alvosDoFiltro, stats.teto_lote))}</strong> alvos de “{entidade}”
          {' '}({fmtNum(totalDoFiltro)} jobs)? Cada alvo é uma chamada à API do Pipedrive.</>}
        descricao={entidade
          ? <>Reenfileira até {fmtNum(stats.teto_lote)} alvos de <strong>{entidade}</strong>
            {' '}({fmtNum(alvosDoFiltro)} disponíveis, {fmtNum(totalDoFiltro)} jobs).</>
          : <>Selecione uma entidade no filtro acima. Por segurança, não existe “reprocessar tudo”
            sem recorte.</>}
        onExecutar={() => entidade && void reprocessar({ entity: entidade }, 'ent')}
      />

      {/* Tabela */}
      <div className="pp-selbar" style={{ marginTop: 12 }}>
        <span>{fmtNum(selecionados.length)} selecionado{selecionados.length === 1 ? '' : 's'}</span>
        {selecionados.length > 0 && (
          <button type="button" className="pp-btn" onClick={() => setSelecao(new Map())}>Limpar seleção</button>
        )}
      </div>

      <div className="pp-tabela-rolavel">
        <table className="pp-table pp-zebra">
          <thead>
            <tr>
              <th className="pp-th-sel">
                <input type="checkbox" checked={todosDaPagina} onChange={alternarPagina}
                  aria-label="Selecionar todos desta página" />
              </th>
              <th>Entidade</th><th>ID externo</th><th className="ta-r">Tentativas</th>
              <th>Descartado em</th><th>Erro</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((r) => (
              <tr key={r.id} className={selecao.has(r.id) ? 'pp-td-sel' : undefined}>
                <td className="pp-th-sel">
                  <input type="checkbox" checked={selecao.has(r.id)} onChange={() => alternar(r)}
                    aria-label={`Selecionar job ${r.id}`} />
                </td>
                <td className="pp-td-title">{r.entity ?? '—'}</td>
                <td>{r.external_id ?? '—'}</td>
                <td className="ta-r">{r.attempts}</td>
                <td className="pp-td-sub">{r.processed_at ? fmtData(r.processed_at) : '—'}</td>
                <td className="pp-td-sub" title={r.last_error ?? ''}>{r.last_error ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(lista?.paginas ?? 1) > 1 && (
        <div className="pp-pager">
          <button type="button" className="pp-btn" disabled={pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}>Anterior</button>
          <span className="pp-pager-info">
            Página {fmtNum(lista!.page)} de {fmtNum(lista!.paginas)} · {fmtNum(lista!.total)} jobs
          </span>
          <button type="button" className="pp-btn" disabled={pagina >= (lista?.paginas ?? 1)}
            onClick={() => setPagina((p) => p + 1)}>Próxima</button>
        </div>
      )}
    </div>
  );
}

/**
 * Resumo do lote. Os tres numeros contam historias diferentes e nenhum pode sumir:
 * reenfileirados = o que volta a rodar; colapsados = descartes repetidos absorvidos
 * (economia de API, nao perda); restantes = o que o teto deixou para a proxima rodada.
 */
function ResumoLote({ r }: { r: PipeRequeueBulkResult }) {
  if (r.reenfileirados === 0 && r.colapsados === 0) {
    return (
      <div className="pp-msg" role="status" style={{ marginBottom: 10 }}>
        Nada foi reenfileirado — os jobs escolhidos já haviam saído da fila morta.
      </div>
    );
  }
  return (
    <div className="pp-msg ok" role="status" style={{ marginBottom: 10 }}>
      <strong>{fmtNum(r.reenfileirados)}</strong> job{r.reenfileirados === 1 ? '' : 's'} reenfileirado
      {r.reenfileirados === 1 ? '' : 's'} ({fmtNum(r.alvos)} alvo{r.alvos === 1 ? '' : 's'} ={' '}
      {fmtNum(r.alvos)} chamada{r.alvos === 1 ? '' : 's'} de API).
      {r.colapsados > 0 && <> {fmtNum(r.colapsados)} descarte{r.colapsados === 1 ? '' : 's'} repetido
        {r.colapsados === 1 ? '' : 's'} do mesmo registro {r.colapsados === 1 ? 'foi absorvido' : 'foram absorvidos'} —
        sem chamada extra.</>}
      {r.restantes > 0 && <> <strong>{fmtNum(r.restantes)} alvos ficaram para a próxima rodada</strong> (teto do lote).</>}
      {' '}A fila é drenada a cada minuto.
    </div>
  );
}

function Tile({ n, l, cor }: { n: string; l: string; cor?: string }) {
  return (
    <div className="pp-tile">
      <div className="pp-tile-n" style={cor ? { color: cor } : undefined}>{n}</div>
      <div className="pp-tile-l">{l}</div>
    </div>
  );
}
