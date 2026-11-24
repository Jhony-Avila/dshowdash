// v2/ListaPrioridade.tsx — lista de uma prioridade da Geral V2 (mockup 02_GERAL_FLUXO_01_LISTA). Reproduz EXATAMENTE a contagem
// da prioridade (total real do serviço), 50 por página, filtros e ordem preservados ao voltar, "Abrir negócio" abre o Pipedrive em
// NOVA aba (sem página de negócio dentro do Dash). Tabela = TabelaDados da casa (cópia idêntica do panel-atributos, conferida por
// hash), dentro de [data-bl-root] com os tokens compartilhados; linha de 36 px, uma linha, reticências (geral-v2.css).
import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { TabelaDados, type ColunaTabela } from '../ui/TabelaDados';
import type { Ordenacao } from '../lib/ordenar';
import { fmtData, fmtMoeda, fmtN, lerLista, type FiltrosLista, type IdPrioridade, type ItemLista, type Lista, type OrdemLista } from './servico';
import { Problema, useBloco } from './comuns';
import '../../../../_shared-react/styles/tokens.css';

const TITULO: Record<IdPrioridade, string> = {
  atividade_vencida: 'Negócios abertos com atividade vencida',
  sem_proxima_atividade: 'Negociações sem próxima atividade',
  conflito_agenda: 'Compromissos com horários conflitantes',
};
const ROTULO_ORDEM: Record<OrdemLista, [string, string]> = { prazo: ['prazo mais antigo', 'prazo mais recente'], valor: ['menor valor', 'maior valor'], responsavel: ['responsável (A–Z)', 'responsável (Z–A)'] };
const PADRAO: FiltrosLista = { pagina: 1, ordem: 'prazo', dir: 'asc', responsavel: null };

// filtros preservados por prioridade (voltar à Geral e abrir de novo mantém página, ordem e responsável)
const K = (id: IdPrioridade) => `dshow.geral.v2.lista.${id}`;
function lerFiltros(id: IdPrioridade): FiltrosLista { try { const r = sessionStorage.getItem(K(id)); return r ? { ...PADRAO, ...JSON.parse(r) } : PADRAO; } catch { return PADRAO; } }
function gravarFiltros(id: IdPrioridade, f: FiltrosLista) { try { sessionStorage.setItem(K(id), JSON.stringify(f)); } catch { /* sem storage */ } }

const hojeIso = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);   // dia de Brasília (UTC−3, sem horário de verão)

export function ListaPrioridade({ id, quantidadeGeral, aoVoltar }: { id: IdPrioridade; quantidadeGeral: number | null; aoVoltar: () => void }) {
  const [f, setF] = useState<FiltrosLista>(() => lerFiltros(id));
  useEffect(() => gravarFiltros(id, f), [id, f]);
  const b = useBloco((s) => lerLista(id, f, s), [id, f.pagina, f.ordem, f.dir, f.responsavel]);
  const l: Lista | null = b.dados; const car = b.carregando && !l;
  const paginas = l && l.total !== null ? Math.max(1, Math.ceil(l.total / l.por_pagina)) : 1;
  const semFonte = !!l && (l.total === null || l.estado === 'aguardando' || l.estado === 'erro');   // a fonte não respondeu: estado, nunca tabela vazia nem "0" 
  const ordenacao: Ordenacao = { chave: f.ordem, direcao: f.dir };
  const aoOrdenar = (o: Ordenacao | null) => { if (!o) return; const ordem = o.chave as OrdemLista; setF((x) => ({ ...x, ordem, dir: o.direcao, pagina: 1 })); };
  const hoje = hojeIso();

  const colunas: ColunaTabela<ItemLista>[] = [
    { chave: 'deal_id', titulo: 'Negócio', tipo: 'numero', alinhamento: 'esquerda', ordenavel: false, classe: 'gv2-td-id', render: (i) => <span className="gv2-fraco">#{i.deal_id}</span> },
    { chave: 'titulo', titulo: 'Proposta / cliente', tipo: 'texto', ordenavel: false, classe: 'gv2-td-larga',
      render: (i) => { const t = i.organizacao ? `${i.titulo} · ${i.organizacao}` : i.titulo; return <span className="gv2-reticencias gv2-td-destaque" title={t}>{t}</span>; } },
    { chave: 'responsavel', titulo: 'Responsável', tipo: 'texto', render: (i) => <span className="gv2-reticencias" title={i.responsavel ?? ''}>{i.responsavel ?? '—'}</span> },
    { chave: 'etapa', titulo: 'Etapa', tipo: 'texto', ordenavel: false, render: (i) => <span className="gv2-reticencias" title={i.etapa ?? ''}>{i.etapa ?? '—'}</span> },
    { chave: 'prazo', titulo: id === 'atividade_vencida' ? 'Atividade vencida em' : 'Fechamento previsto', tipo: 'texto',
      render: (i) => (i.prazo ? <span className={`gv2-pilula ${i.prazo.slice(0, 10) < hoje ? 'gv2-pilula--erro' : 'gv2-pilula--aviso'}`}>{fmtData(i.prazo)}</span> : <span className="gv2-fraco">—</span>) },
    { chave: 'valor', titulo: 'Valor', tipo: 'numero', render: (i) => (i.valor === null ? <span className="gv2-fraco">Sem valor</span> : fmtMoeda(i.valor)) },
    { chave: 'acao', titulo: 'Ação', tipo: 'texto', ordenavel: false, cabecalho: <span className="bl-so-leitor">Ação</span>,
      render: (i) => (i.url_pipedrive
        ? <a className="gv2-btn gv2-btn--mini" href={i.url_pipedrive} target="_blank" rel="noopener noreferrer" aria-label={`Abrir negócio #${i.deal_id} no Pipedrive (nova aba)`}>Abrir negócio <ExternalLink size={12} aria-hidden /></a>
        : <span className="gv2-fraco">Sem link</span>) },
  ];

  const respNome = f.responsavel === null ? 'Todos' : l?.responsaveis?.find((r) => r.id === f.responsavel)?.nome ?? `#${f.responsavel}`;
  const conferencia = l && !semFonte && f.responsavel === null && quantidadeGeral !== null;
  return (
    <div className="gv2-lista" data-gv2-lista={id}>
      <nav className="gv2-trilha" aria-label="Você está em">
        <button type="button" className="gv2-link" onClick={aoVoltar}><ArrowLeft size={13} aria-hidden /> Geral</button>
        <span aria-hidden>›</span><button type="button" className="gv2-link" onClick={aoVoltar}>Prioridades de hoje</button>
        <span aria-hidden>›</span><span className="gv2-fraco" aria-current="page">{TITULO[id]}</span>
      </nav>
      <h1 className="gv2-h1">{TITULO[id]}</h1>
      <p className="gv2-sub">Pipedrive · exatamente os negócios distintos que geraram o alerta da Geral</p>

      <div className="gv2-cartao gv2-filtros">
        {l && <span className="gv2-chip gv2-chip--info">{l.criterios.texto}</span>}
        <label className="gv2-chip">Responsável:
          <select value={f.responsavel ?? ''} onChange={(e) => setF((x) => ({ ...x, responsavel: e.target.value === '' ? null : Number(e.target.value), pagina: 1 }))} aria-label="Filtrar por responsável">
            <option value="">Todos</option>
            {(l?.responsaveis ?? []).map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
        </label>
        <span className="gv2-chip">Ordenação: {ROTULO_ORDEM[f.ordem][f.dir === 'asc' ? 0 : 1]}</span>
        <strong className="gv2-dir" data-gv2-total>{car ? 'Carregando…' : l && !semFonte ? `${fmtN(l.total)} ${l.total === 1 ? 'negócio encontrado' : 'negócios encontrados'}` : '—'}</strong>
      </div>

      {car ? (
        <div className="gv2-cartao gv2-lista-osso" aria-busy="true" data-gv2-estado="carregando"><span className="gv2-selo gv2-selo--neutro">Carregando…</span>
          {Array.from({ length: 6 }, (_, k) => <span key={k} className="ger-osso" style={{ height: 22, width: `${92 - (k % 3) * 6}%` }} aria-hidden />)}</div>
      ) : !l ? (
        <div className="gv2-cartao" data-gv2-estado="problema"><Problema motivo="Não foi possível carregar a lista agora." quando={null} onTentar={b.recarregar} tentando={b.atualizando} /></div>
      ) : (
        <>
          {b.erro && <Problema motivo="A atualização da lista falhou; abaixo, a última leitura válida." quando={b.okEm} onTentar={b.recarregar} tentando={b.atualizando} />}
          {semFonte ? (
            <div className="gv2-cartao" data-gv2-estado={l.estado === 'aguardando' ? 'aguardando' : 'problema'}>
              {l.estado === 'aguardando'
                ? <p className="gv2-vazio">Aguardando conexão · {l.motivo || 'A fonte ainda não está conectada.'} Nenhum número assumido.</p>
                : <Problema motivo={l.motivo || 'Não foi possível ler esta lista agora.'} quando={l.ultimo_sucesso ?? null} onTentar={b.recarregar} tentando={b.atualizando} />}
            </div>
          ) : l.total === 0 ? <p className="gv2-cartao gv2-vazio" data-gv2-estado="zero">Nenhum negócio nesta condição agora{f.responsavel !== null ? ` para ${respNome}` : ''}.</p> : (
            <div data-bl-root className="gv2-tabela-raiz gv2-cartao">
              <TabelaDados colunas={colunas} linhas={l.itens} chaveLinha={(i) => i.deal_id} ordenacao={ordenacao} aoOrdenar={aoOrdenar}
                rolagem="container" legenda={`${TITULO[id]} — página ${l.pagina} de ${paginas}`} className="gv2-tabela" />
            </div>
          )}
          <div className="gv2-lista-rodape">
            {!semFonte && <span className="gv2-fraco" data-gv2-conferencia>
              {l.itens.length} {l.itens.length === 1 ? 'registro exibido' : 'registros exibidos'}
              {paginas > 1 ? ` (página ${l.pagina} de ${paginas})` : ''} · total {fmtN(l.total)} {l.total === 1 ? 'negócio distinto' : 'negócios distintos'}
              {conferencia && (l.total === quantidadeGeral ? ' = número da prioridade na Geral' : ` · ⚠ a Geral mostrava ${fmtN(quantidadeGeral)}; a situação mudou desde então`)}
            </span>}
            {paginas > 1 && (
              <span className="gv2-paginas">
                <button type="button" className="gv2-btn gv2-btn--mini" disabled={l.pagina <= 1} onClick={() => setF((x) => ({ ...x, pagina: x.pagina - 1 }))}><ChevronLeft size={13} aria-hidden /> Anterior</button>
                <button type="button" className="gv2-btn gv2-btn--mini" disabled={l.pagina >= paginas} onClick={() => setF((x) => ({ ...x, pagina: x.pagina + 1 }))}>Próxima <ChevronRight size={13} aria-hidden /></button>
              </span>
            )}
            <span className="gv2-fraco gv2-dir">Critérios preservados: {l.criterios.texto} · responsável: {respNome}</span>
          </div>
        </>
      )}
    </div>
  );
}
