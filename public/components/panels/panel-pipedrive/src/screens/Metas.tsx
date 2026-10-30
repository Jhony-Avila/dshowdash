// screens/Metas.tsx — aba "Metas" (EC Fase 2, item 1; DASH-APP-V1 DC-2): metas comerciais mensais, global e por vendedor.
// @version 1.0.0  @created 2026-10-30
//
// Mesma regra do app (api/ponte/libs/MetaLib.php via /api/pipedrive/metas, nível 80): valor em centavos de BRL, 0 = meta zero explícita,
// linha ausente = "não definida", concorrência otimista por versão (409 → recarregar), histórico append-only com quem e origem.
// Toda alteração mostra antes/depois e pede confirmação; remover é reversível (o valor fica no histórico e pode ser definido de novo).
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Goal, RefreshCw } from 'lucide-react';
import { apiGet, apiWrite, ApiError } from '../lib/api';
import { fmtData } from '../lib/format';
import { PageHeader } from './PageHeader';
import { EstadoErro, SkeletonBloco } from './Estados';

interface MetaRow { id: number; ano: number; mes: number; escopo: 'global' | 'vendedor'; owner_pd_id: number; valor_cents: number; versao: number; updated_at: string | null }
interface Vendedor { id: number; nome: string; ativo: boolean }
interface HistRow { id: number; meta_id: number; versao: number; valor_anterior_cents: number | null; valor_novo_cents: number | null; origem: string; created_at: string; por: string | null }
interface MetasResp { ano: number; mes: number; metas: MetaRow[]; vendedores: Vendedor[]; historico: HistRow[] }

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const brl = (c: number | null | undefined): string => (c == null ? '—' : (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

/** "1.234,56" / "1234.5" / "1234" → centavos; null se inválido. */
export function paraCentavos(txt: string): number | null {
  const t = txt.trim().replace(/^R\$\s*/, '');
  if (t === '') return null;
  const norm = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
  if (!/^\d+(\.\d{1,2})?$/.test(norm)) return null;
  const c = Math.round(Number(norm) * 100);
  return Number.isSafeInteger(c) && c >= 0 && c <= 999_999_999_999 ? c : null;
}

interface Edicao { escopo: 'global' | 'vendedor'; ownerId: number; nome: string; atual: MetaRow | null; texto: string }

export function Metas() {
  const qc = useQueryClient();
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const [confirmar, setConfirmar] = useState<null | { tipo: 'definir' | 'remover'; novo: number | null }>(null);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const chave = ['pipe', 'metas', ano, mes] as const;
  const q = useQuery({ queryKey: chave, queryFn: ({ signal }) => apiGet<MetasResp>('/metas', { ano: String(ano), mes: String(mes) }, signal) });

  const linhas = useMemo(() => {
    const d = q.data;
    if (!d) return [];
    const metaDe = (owner: number) => d.metas.find((m) => (owner === 0 ? m.escopo === 'global' : m.escopo === 'vendedor' && m.owner_pd_id === owner)) ?? null;
    const comMeta = new Set(d.metas.filter((m) => m.escopo === 'vendedor').map((m) => m.owner_pd_id));
    const vend = d.vendedores.filter((v) => v.ativo || comMeta.has(v.id));
    return [{ escopo: 'global' as const, ownerId: 0, nome: 'Meta global (empresa)', ativo: true, meta: metaDe(0) },
      ...vend.map((v) => ({ escopo: 'vendedor' as const, ownerId: v.id, nome: v.nome, ativo: v.ativo, meta: metaDe(v.id) }))];
  }, [q.data]);

  const nomeDaMeta = (metaId: number): string => {
    const m = q.data?.metas.find((x) => x.id === metaId);
    if (!m) return 'meta removida';
    if (m.escopo === 'global') return 'Global';
    return q.data?.vendedores.find((v) => v.id === m.owner_pd_id)?.nome ?? `#${m.owner_pd_id}`;
  };

  async function executar() {
    if (!edicao || !confirmar) return;
    setSalvando(true);
    setAviso(null);
    try {
      if (confirmar.tipo === 'definir') {
        await apiWrite('/metas', 'PUT', { ano, mes, escopo: edicao.escopo, owner_pd_id: edicao.ownerId, valor_cents: confirmar.novo, ...(edicao.atual ? { versao_esperada: edicao.atual.versao } : { versao_esperada: 0 }) });
        setAviso({ tipo: 'ok', texto: `Meta salva: ${edicao.nome} — ${brl(confirmar.novo)}.` });
      } else if (edicao.atual) {
        await apiWrite(`/metas/${edicao.atual.id}?versao_esperada=${edicao.atual.versao}`, 'DELETE');
        setAviso({ tipo: 'ok', texto: `Meta removida: ${edicao.nome}. O valor anterior fica no histórico.` });
      }
      setEdicao(null);
    } catch (e) {
      const conflito = e instanceof ApiError && e.status === 409;
      setAviso({ tipo: 'erro', texto: conflito ? 'A meta mudou desde que você abriu (outra pessoa ou o app). Recarreguei os dados — confira e tente de novo.' : e instanceof Error ? e.message : 'Não foi possível salvar.' });
      if (conflito) setEdicao(null);
    } finally {
      setConfirmar(null);
      setSalvando(false);
      await qc.invalidateQueries({ queryKey: ['pipe', 'metas'] });
    }
  }

  const novoValor = edicao ? paraCentavos(edicao.texto) : null;

  return (
    <div>
      <PageHeader Icon={Goal} titulo="Metas" atualizando={q.isFetching}
        descricao="Metas comerciais mensais em R$ (vendas ganhas no Pipedrive). As mesmas do app DSHOW; toda mudança fica no histórico."
        acoes={<>
          <select className="pp-select" aria-label="Mês" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className="pp-select" aria-label="Ano" value={ano} onChange={(e) => setAno(Number(e.target.value))}>
            {[hoje.getFullYear() - 1, hoje.getFullYear(), hoje.getFullYear() + 1].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button className="pp-btn" onClick={() => void q.refetch()} title="Atualizar"><RefreshCw size={14} /> Atualizar</button>
        </>} />

      {aviso && <div className="pp-note" role="status" style={{ color: aviso.tipo === 'erro' ? 'var(--pp-danger)' : 'var(--pp-ok)' }}>{aviso.texto}</div>}

      {q.isLoading ? <SkeletonBloco linhas={6} />
        : q.isError ? <EstadoErro detalhe={q.error instanceof Error ? q.error.message : undefined} onRetry={() => void q.refetch()} />
        : (
          <div className="pp-g12">
            <div className="pp-card pp-c-8">
              <div className="pp-tabela-rolavel">
                <table className="pp-table">
                  <thead><tr><th>Escopo</th><th style={{ textAlign: 'right' }}>Meta de {MESES[mes - 1]}/{ano}</th><th>Atualizada</th><th /></tr></thead>
                  <tbody>
                    {linhas.map((l) => (
                      <tr key={`${l.escopo}-${l.ownerId}`}>
                        <td><span className="pp-td-title">{l.nome}</span>{!l.ativo && <span className="pp-badge" style={{ marginLeft: 6 }}>inativo</span>}</td>
                        <td style={{ textAlign: 'right' }}>{l.meta ? brl(l.meta.valor_cents) : <span className="pp-td-sub">não definida</span>}</td>
                        <td className="pp-td-sub">{l.meta ? `${fmtData(l.meta.updated_at)} · v${l.meta.versao}` : '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="pp-btn" onClick={() => { setAviso(null); setEdicao({ escopo: l.escopo, ownerId: l.ownerId, nome: l.nome, atual: l.meta, texto: l.meta ? (l.meta.valor_cents / 100).toFixed(2).replace('.', ',') : '' }); }}>
                            {l.meta ? 'Editar' : 'Definir'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pp-card pp-c-4">
              {edicao ? (
                <div>
                  <div className="pp-pref-tit">{edicao.nome}</div>
                  <div className="pp-pref-desc">{MESES[mes - 1]}/{ano} · atual: {edicao.atual ? brl(edicao.atual.valor_cents) : 'não definida'}</div>
                  <label className="pp-label" htmlFor="meta-valor">Nova meta (R$)</label>
                  <input id="meta-valor" className="pp-input" inputMode="decimal" value={edicao.texto} onChange={(e) => setEdicao({ ...edicao, texto: e.target.value })} placeholder="0,00" />
                  {edicao.texto !== '' && novoValor === null && <div className="pp-note" style={{ color: 'var(--pp-danger)' }}>Valor inválido (use até 2 casas decimais).</div>}
                  {confirmar ? (
                    <div className="pp-confirma" role="alertdialog" aria-label="Confirmar">
                      <p>{confirmar.tipo === 'definir'
                        ? <>Antes: <b>{edicao.atual ? brl(edicao.atual.valor_cents) : 'não definida'}</b> → depois: <b>{brl(confirmar.novo)}</b></>
                        : <>Remover a meta de <b>{brl(edicao.atual?.valor_cents)}</b>? Ela passa a "não definida"; o valor fica no histórico.</>}</p>
                      <div className="pp-actions">
                        <button className="pp-btn pp-primary" disabled={salvando} onClick={() => void executar()}>{salvando ? 'Salvando…' : 'Confirmar'}</button>
                        <button className="pp-btn" disabled={salvando} onClick={() => setConfirmar(null)}>Voltar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="pp-actions">
                      <button className="pp-btn pp-primary" disabled={novoValor === null || novoValor === edicao.atual?.valor_cents} onClick={() => setConfirmar({ tipo: 'definir', novo: novoValor })}>Salvar</button>
                      {edicao.atual && <button className="pp-btn" onClick={() => setConfirmar({ tipo: 'remover', novo: null })}>Remover</button>}
                      <button className="pp-btn" onClick={() => setEdicao(null)}>Cancelar</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pp-placeholder">Escolha uma linha para definir ou editar a meta.</div>
              )}
            </div>

            <div className="pp-card pp-c-12" style={{ gridColumn: '1 / -1' }}>
              <div className="pp-pref-tit">Histórico de {MESES[mes - 1]}/{ano}</div>
              {q.data && q.data.historico.length > 0 ? (
                <div className="pp-tabela-rolavel">
                  <table className="pp-table">
                    <thead><tr><th>Quando</th><th>Meta</th><th style={{ textAlign: 'right' }}>Antes</th><th style={{ textAlign: 'right' }}>Depois</th><th>Por</th><th>Origem</th></tr></thead>
                    <tbody>
                      {q.data.historico.map((h) => (
                        <tr key={h.id}>
                          <td className="pp-td-sub">{fmtData(h.created_at)}</td>
                          <td>{nomeDaMeta(h.meta_id)}</td>
                          <td style={{ textAlign: 'right' }}>{brl(h.valor_anterior_cents)}</td>
                          <td style={{ textAlign: 'right' }}>{h.valor_novo_cents == null ? 'removida' : brl(h.valor_novo_cents)}</td>
                          <td>{h.por ?? '—'}</td>
                          <td><span className="pp-badge">{h.origem === 'dash' ? 'painel' : h.origem}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="pp-placeholder">Nenhuma alteração neste mês.</div>}
            </div>
          </div>
        )}
    </div>
  );
}
