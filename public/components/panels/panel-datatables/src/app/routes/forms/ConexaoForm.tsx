// forms/ConexaoForm.tsx — cadastro/edição de conexão (§24, escrita).
// @version 1.1.0  @created 2026-07-20
// Senha vazia na EDIÇÃO = chave AUSENTE no payload = mantém a atual (nunca
// apaga sem querer). Ao salvar, o backend verifica na hora.
//
// ⚠️ EDIÇÃO CARREGA O REGISTRO COMPLETO antes de montar o form. O update do
// backend trata `'' → null`: se enviássemos username/ambiente vazios (que a
// LISTAGEM não traz) apagaríamos esses campos. Por isso buscamos GET /{id}.
import { useState, type JSX, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiWrite, ApiError } from '../../../lib/api';
import { useLookups } from '../../../shell/useLookups';
import { Modal } from '../../../components/ui/Modal';
import { Skeleton } from '../../../components/ui/Estados';
import { Campo, Texto, Selecao, Interruptor, AcoesForm, Linha, ErroForm } from '../../../components/ui/Campo';

interface ConexaoRec {
  id: number; name: string; source_type: string; host: string; port: number;
  db_name: string | null; username: string | null; environment_id: number | null;
  monitoring_enabled: boolean | number;
}
const TIPOS = ['mysql', 'api', 'file', 'cache', 'queue', 'integration'].map((t) => ({ valor: t, rotulo: t }));

export function ConexaoForm({ conexaoId, aberto, aoFechar, prefill, nota }: {
  conexaoId: number | null; aberto: boolean; aoFechar: () => void;
  // Cadastro pré-preenchido a partir de uma descoberta (§13). A senha NUNCA é
  // pré-preenchida — `nota` só informa onde a credencial foi identificada.
  prefill?: Partial<ConexaoRec>; nota?: ReactNode;
}): JSX.Element {
  const isEdit = conexaoId !== null;
  const rec = useQuery({
    queryKey: ['dt', 'connection-edit', conexaoId],
    queryFn: ({ signal }) => apiGet<ConexaoRec>(`/connections/${conexaoId}`, undefined, signal),
    enabled: isEdit,
  });

  return (
    <Modal titulo={isEdit ? `Editar conexão #${conexaoId}` : 'Nova conexão'} aberto={aberto} aoFechar={aoFechar} largura={620}>
      {isEdit && rec.isPending ? <Skeleton linhas={5} altura={34} />
        : isEdit && rec.isError ? <p style={{ color: 'var(--dt-danger)' }}>Não foi possível carregar a conexão.</p>
        : <Corpo inicial={isEdit ? (rec.data ?? null) : (prefill ?? null)} conexaoId={conexaoId} aoFechar={aoFechar} nota={nota} />}
    </Modal>
  );
}

function Corpo({ inicial, conexaoId, aoFechar, nota }: {
  inicial: Partial<ConexaoRec> | null; conexaoId: number | null; aoFechar: () => void; nota?: ReactNode;
}): JSX.Element {
  const qc = useQueryClient();
  const lookups = useLookups();
  const isEdit = conexaoId !== null;

  const [f, setF] = useState(() => ({
    name: inicial?.name ?? '', source_type: inicial?.source_type ?? 'mysql',
    host: inicial?.host ?? '', port: String(inicial?.port ?? 3306),
    db_name: inicial?.db_name ?? '', username: inicial?.username ?? '',
    password: '', environment_id: inicial?.environment_id ? String(inicial.environment_id) : '',
    monitoring_enabled: inicial ? !!inicial.monitoring_enabled : true,
  }));
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]): void => setF((s) => ({ ...s, [k]: v }));
  const [erro, setErro] = useState<string | null>(null);

  const salvar = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        name: f.name.trim(), source_type: f.source_type, host: f.host.trim(),
        port: f.port ? Number(f.port) : 3306, db_name: f.db_name.trim(),
        username: f.username.trim(), environment_id: f.environment_id || null,
        monitoring_enabled: f.monitoring_enabled ? 1 : 0,
      };
      // A distinção que evita apagar a senha: chave AUSENTE = manter a atual.
      if (!isEdit || f.password !== '') payload.password = f.password;
      return isEdit
        ? apiWrite(`/connections/${conexaoId}`, 'PATCH', payload)
        : apiWrite('/connections', 'POST', payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dt'] }); aoFechar(); },
    onError: (e: ApiError) => setErro(e.message),
  });

  const enviar = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!f.name.trim() || !f.host.trim()) { setErro('Nome e host são obrigatórios.'); return; }
    setErro(null); salvar.mutate();
  };
  const envs = (lookups.data?.environments ?? []).map((a) => ({ valor: String(a.id), rotulo: a.label }));

  return (
    <form onSubmit={enviar}>
      <ErroForm mensagem={erro} />
      {nota && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', marginBottom: 14,
          borderLeft: '3px solid var(--dt-info)', borderRadius: '0 6px 6px 0', background: 'var(--dt-bg-canvas)',
          fontSize: 12.5, color: 'var(--dt-text-secondary)', lineHeight: 1.5 }}>
          {nota}
        </div>
      )}
      <Linha>
        <Campo rotulo="Nome" obrigatorio>{(id) => <Texto id={id} valor={f.name} aoMudar={(v) => set('name', v)} autoComplete="off" />}</Campo>
        <Campo rotulo="Tipo de fonte">{(id) => <Selecao id={id} valor={f.source_type} aoMudar={(v) => set('source_type', v)} opcoes={TIPOS} />}</Campo>
      </Linha>
      <Linha>
        <Campo rotulo="Host" obrigatorio>{(id) => <Texto id={id} valor={f.host} aoMudar={(v) => set('host', v)} autoComplete="off" />}</Campo>
        <Campo rotulo="Porta">{(id) => <Texto id={id} tipo="number" valor={f.port} aoMudar={(v) => set('port', v)} />}</Campo>
      </Linha>
      <Linha>
        <Campo rotulo="Banco" dica="vazio = todos os schemas">{(id) => <Texto id={id} valor={f.db_name} aoMudar={(v) => set('db_name', v)} autoComplete="off" />}</Campo>
        <Campo rotulo="Ambiente">{(id) => <Selecao id={id} valor={f.environment_id} aoMudar={(v) => set('environment_id', v)} opcoes={envs} placeholder="— ambiente —" />}</Campo>
      </Linha>
      <Linha>
        <Campo rotulo="Usuário">{(id) => <Texto id={id} valor={f.username} aoMudar={(v) => set('username', v)} autoComplete="off" />}</Campo>
        <Campo rotulo="Senha" dica={isEdit ? 'em branco = manter a atual' : undefined}>
          {(id) => <Texto id={id} tipo="password" valor={f.password} aoMudar={(v) => set('password', v)} autoComplete="new-password" placeholder={isEdit ? '••••••' : ''} />}
        </Campo>
      </Linha>
      <Linha>
        <Interruptor marcado={f.monitoring_enabled} aoMudar={(v) => set('monitoring_enabled', v)} rotulo="Monitorar a cada 5 min" />
      </Linha>
      <p style={{ fontSize: 12, color: 'var(--dt-text-muted)', margin: '0 0 14px' }}>
        Ao salvar, a conexão é verificada imediatamente — você sabe na hora se a credencial funciona.
      </p>
      <AcoesForm salvarRotulo={isEdit ? 'Salvar alterações' : 'Cadastrar e verificar'}
        aoCancelar={aoFechar} salvando={salvar.isPending} />
    </form>
  );
}
