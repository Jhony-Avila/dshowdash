// AplicacoesSecao.tsx — visão por aplicação com CRUD e módulos (§38.3, escrita).
// @version 1.0.0  @created 2026-07-20
// Vive dentro de Servidores. Módulos são carregados sob demanda ao expandir.
import { useState, type JSX } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiWrite, ApiError } from '../../lib/api';
import { fmtInt } from '../../lib/format';
import { Icone } from '../../components/ui/Icone';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Estados';
import { AplicacaoForm, type AplicacaoEdit } from './forms/AplicacaoForm';
import css from './AplicacoesSecao.module.css';

interface Aplicacao { id: number; label: string; app_key: string; module_count: number; connection_count: number }
interface Modulo { id: number; mod_key: string; label: string }

export function AplicacoesSecao(): JSX.Element {
  const qc = useQueryClient();
  const [form, setForm] = useState<{ app: AplicacaoEdit | null } | null>(null);
  const [expandida, setExpandida] = useState<number | null>(null);

  const q = useQuery({
    queryKey: ['dt', 'applications'],
    queryFn: ({ signal }) => apiGet<Aplicacao[]>('/applications', undefined, signal),
  });

  const excluir = useMutation({
    mutationFn: (id: number) => apiWrite(`/applications/${id}`, 'DELETE'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dt'] }),
  });

  return (
    <section className={css.secao}>
      <div className={css.topo}>
        <h2 className={css.titulo}><Icone nome="Boxes" size={15} /> Aplicações</h2>
        <button type="button" className={css.novo} onClick={() => setForm({ app: null })}>
          <Icone nome="Boxes" size={13} /> Nova aplicação
        </button>
      </div>

      {q.isPending ? <Skeleton linhas={3} altura={20} /> : q.isError ? (
        <p className={css.vazio}>Não foi possível carregar as aplicações.</p>
      ) : q.data.length === 0 ? (
        <p className={css.vazio}>Nenhuma aplicação cadastrada. Elas agrupam conexões por sistema (§38.3).</p>
      ) : (
        <ul className={css.lista}>
          {q.data.map((a) => (
            <li key={a.id} className={css.item}>
              <div className={css.linha}>
                <button type="button" className={css.expandir} onClick={() => setExpandida(expandida === a.id ? null : a.id)}
                        aria-expanded={expandida === a.id} aria-label="Ver módulos">
                  <Icone nome="ChevronRight" size={13} className={expandida === a.id ? css.giro : undefined} />
                </button>
                <strong className={css.nome}>{a.label}</strong>
                <span className={css.chave}>{a.app_key}</span>
                <Badge texto={`${fmtInt(a.module_count)} módulo(s)`} fraco />
                <Badge texto={`${fmtInt(a.connection_count)} conexão(ões)`} tom="info" fraco />
                <span className={css.acoes}>
                  <button type="button" className={css.acao} onClick={() => setForm({ app: { id: a.id, label: a.label, app_key: a.app_key } })}>Editar</button>
                  <button type="button" className={`${css.acao} ${css.perigo}`}
                    onClick={() => { if (confirm(`Excluir a aplicação "${a.label}"? As conexões vinculadas são desvinculadas.`)) excluir.mutate(a.id); }}>Excluir</button>
                </span>
              </div>
              {expandida === a.id && <Modulos appId={a.id} />}
            </li>
          ))}
        </ul>
      )}

      {form && <AplicacaoForm aplicacao={form.app} aberto aoFechar={() => setForm(null)} />}
    </section>
  );
}

function Modulos({ appId }: { appId: number }): JSX.Element {
  const qc = useQueryClient();
  const [novo, setNovo] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['dt', 'application', appId],
    queryFn: ({ signal }) => apiGet<{ modules: Modulo[] }>(`/applications/${appId}`, undefined, signal),
  });

  const invalida = (): void => { qc.invalidateQueries({ queryKey: ['dt', 'application', appId] }); qc.invalidateQueries({ queryKey: ['dt', 'applications'] }); };

  const adicionar = useMutation({
    mutationFn: (label: string) => apiWrite(`/applications/${appId}/modules`, 'POST', { label }),
    onSuccess: () => { setNovo(''); setErro(null); invalida(); },
    onError: (e: ApiError) => setErro(e.message),
  });
  const remover = useMutation({
    mutationFn: (modId: number) => apiWrite(`/applications/${appId}/modules/${modId}`, 'DELETE'),
    onSuccess: invalida,
  });

  return (
    <div className={css.modulos}>
      {q.isPending ? <span className={css.discreto}>carregando módulos…</span> : (
        <>
          <div className={css.chips}>
            {(q.data?.modules ?? []).length === 0 && <span className={css.discreto}>sem módulos</span>}
            {(q.data?.modules ?? []).map((m) => (
              <span key={m.id} className={css.chip}>
                {m.label}
                <button type="button" className={css.chipX} onClick={() => remover.mutate(m.id)} aria-label={`Remover ${m.label}`}>
                  <Icone nome="X" size={11} />
                </button>
              </span>
            ))}
          </div>
          <form className={css.addForm} onSubmit={(e) => { e.preventDefault(); if (novo.trim()) adicionar.mutate(novo.trim()); }}>
            <input className={css.addInput} value={novo} onChange={(e) => setNovo(e.target.value)}
                   placeholder="novo módulo…" aria-label="Nome do módulo" />
            <button type="submit" className={css.addBtn} disabled={adicionar.isPending || !novo.trim()}>Adicionar</button>
          </form>
          {erro && <span className={css.erro}>{erro}</span>}
        </>
      )}
    </div>
  );
}
