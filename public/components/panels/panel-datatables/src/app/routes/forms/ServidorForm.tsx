// forms/ServidorForm.tsx — cadastro/edição de servidor (§38.4, escrita).
// @version 1.1.0  @created 2026-07-20
// ⚠️ EDIÇÃO CARREGA O REGISTRO COMPLETO (GET /servers/{id}) antes de montar:
// a listagem só traz o IP MASCARADO e omite identifier/notes/server_type/
// environment_id — enviá-los vazios no PATCH (`'' → null`) os apagaria.
import { useState, type JSX } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiWrite, ApiError } from '../../../lib/api';
import { useLookups } from '../../../shell/useLookups';
import { Modal } from '../../../components/ui/Modal';
import { Skeleton } from '../../../components/ui/Estados';
import { Campo, Texto, Selecao, AcoesForm, Linha, ErroForm } from '../../../components/ui/Campo';

interface ServidorRec {
  id: number; name: string; identifier: string | null; hostname: string | null;
  ip: string | null; provider: string | null; server_type: string | null;
  environment_id: number | null; notes: string | null;
}
const TIPOS = ['vps', 'dedicated', 'cloud', 'managed', 'container', 'outro'].map((t) => ({ valor: t, rotulo: t }));

export function ServidorForm({ servidorId, aberto, aoFechar }: {
  servidorId: number | null; aberto: boolean; aoFechar: () => void;
}): JSX.Element {
  const isEdit = servidorId !== null;
  const rec = useQuery({
    queryKey: ['dt', 'server-edit', servidorId],
    queryFn: ({ signal }) => apiGet<ServidorRec>(`/servers/${servidorId}`, undefined, signal),
    enabled: isEdit,
  });

  return (
    <Modal titulo={isEdit ? `Editar servidor #${servidorId}` : 'Novo servidor'} aberto={aberto} aoFechar={aoFechar} largura={640}>
      {isEdit && rec.isPending ? <Skeleton linhas={4} altura={34} />
        : isEdit && rec.isError ? <p style={{ color: 'var(--dt-danger)' }}>Não foi possível carregar o servidor.</p>
        : <Corpo inicial={rec.data ?? null} servidorId={servidorId} aoFechar={aoFechar} />}
    </Modal>
  );
}

function Corpo({ inicial, servidorId, aoFechar }: {
  inicial: ServidorRec | null; servidorId: number | null; aoFechar: () => void;
}): JSX.Element {
  const qc = useQueryClient();
  const lookups = useLookups();
  const isEdit = servidorId !== null;
  const [f, setF] = useState(() => ({
    name: inicial?.name ?? '', identifier: inicial?.identifier ?? '', hostname: inicial?.hostname ?? '',
    ip: inicial?.ip ?? '', provider: inicial?.provider ?? '', server_type: inicial?.server_type ?? 'vps',
    environment_id: inicial?.environment_id ? String(inicial.environment_id) : '', notes: inicial?.notes ?? '',
  }));
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]): void => setF((s) => ({ ...s, [k]: v }));
  const [erro, setErro] = useState<string | null>(null);

  const salvar = useMutation({
    mutationFn: () => {
      const payload = {
        name: f.name.trim(), identifier: f.identifier.trim(), hostname: f.hostname.trim(),
        ip: f.ip.trim(), provider: f.provider.trim(), server_type: f.server_type,
        environment_id: f.environment_id || null, notes: f.notes.trim(),
      };
      return isEdit ? apiWrite(`/servers/${servidorId}`, 'PATCH', payload) : apiWrite('/servers', 'POST', payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dt'] }); aoFechar(); },
    onError: (e: ApiError) => setErro(e.message),
  });

  const enviar = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!f.name.trim()) { setErro('O nome é obrigatório.'); return; }
    setErro(null); salvar.mutate();
  };
  const envs = (lookups.data?.environments ?? []).map((a) => ({ valor: String(a.id), rotulo: a.label }));

  return (
    <form onSubmit={enviar}>
      <ErroForm mensagem={erro} />
      <Linha>
        <Campo rotulo="Nome" obrigatorio>{(id) => <Texto id={id} valor={f.name} aoMudar={(v) => set('name', v)} autoComplete="off" />}</Campo>
        <Campo rotulo="Identificador" dica="vazio = gerado do nome">{(id) => <Texto id={id} valor={f.identifier} aoMudar={(v) => set('identifier', v)} autoComplete="off" />}</Campo>
        <Campo rotulo="Tipo">{(id) => <Selecao id={id} valor={f.server_type} aoMudar={(v) => set('server_type', v)} opcoes={TIPOS} />}</Campo>
      </Linha>
      <Linha>
        <Campo rotulo="Hostname">{(id) => <Texto id={id} valor={f.hostname} aoMudar={(v) => set('hostname', v)} autoComplete="off" />}</Campo>
        <Campo rotulo="IP" dica="exibido mascarado na lista">{(id) => <Texto id={id} valor={f.ip} aoMudar={(v) => set('ip', v)} autoComplete="off" />}</Campo>
      </Linha>
      <Linha>
        <Campo rotulo="Provedor">{(id) => <Texto id={id} valor={f.provider} aoMudar={(v) => set('provider', v)} placeholder="ex.: Hostinger" autoComplete="off" />}</Campo>
        <Campo rotulo="Ambiente">{(id) => <Selecao id={id} valor={f.environment_id} aoMudar={(v) => set('environment_id', v)} opcoes={envs} placeholder="— ambiente —" />}</Campo>
      </Linha>
      <Linha>
        <Campo rotulo="Observações">{(id) => <Texto id={id} valor={f.notes} aoMudar={(v) => set('notes', v)} autoComplete="off" />}</Campo>
      </Linha>
      <p style={{ fontSize: 12, color: 'var(--dt-text-muted)', margin: '0 0 14px' }}>
        Cadastrar o servidor não cria conexão — vincule-a depois na aba Conexões.
      </p>
      <AcoesForm salvarRotulo={isEdit ? 'Salvar alterações' : 'Cadastrar servidor'} aoCancelar={aoFechar} salvando={salvar.isPending} />
    </form>
  );
}
