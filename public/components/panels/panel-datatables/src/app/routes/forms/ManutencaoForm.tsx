// forms/ManutencaoForm.tsx — abrir janela de manutenção (§27, escrita).
// @version 1.0.0  @created 2026-07-20
// Enquanto aberta, o período sai do denominador da disponibilidade e o alerta
// da conexão é suprimido (suppress_alerts).
import { useState, type JSX } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiWrite, ApiError } from '../../../lib/api';
import { Modal } from '../../../components/ui/Modal';
import { Campo, Texto, Selecao, AcoesForm, Linha, ErroForm } from '../../../components/ui/Campo';

interface ConexaoLite { id: number; name: string }

export function ManutencaoForm({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }): JSX.Element {
  const qc = useQueryClient();
  const conns = useQuery({
    queryKey: ['dt', 'connections'],
    queryFn: ({ signal }) => apiGet<ConexaoLite[]>('/connections', { is_active: 1 }, signal),
  });

  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const abrir = useMutation({
    mutationFn: () => apiWrite('/maintenance', 'POST', {
      target_type: 'connection', target_id: Number(targetId), reason: reason.trim(), suppress_alerts: true,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dt'] }); aoFechar(); },
    onError: (e: ApiError) => setErro(e.message),
  });

  const enviar = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!targetId) { setErro('Escolha a conexão em manutenção.'); return; }
    setErro(null); abrir.mutate();
  };

  const opcoes = (conns.data ?? []).map((c) => ({ valor: String(c.id), rotulo: c.name }));

  return (
    <Modal titulo="Abrir janela de manutenção" aberto={aberto} aoFechar={aoFechar}>
      <form onSubmit={enviar}>
        <ErroForm mensagem={erro} />
        <Linha>
          <Campo rotulo="Conexão" obrigatorio>
            {(id) => <Selecao id={id} valor={targetId} aoMudar={setTargetId} opcoes={opcoes}
              placeholder={conns.isPending ? 'carregando…' : '— escolha —'} />}
          </Campo>
        </Linha>
        <Linha>
          <Campo rotulo="Motivo" dica="opcional, mas ajuda a auditar depois">
            {(id) => <Texto id={id} valor={reason} aoMudar={setReason} placeholder="ex.: upgrade do MySQL" />}
          </Campo>
        </Linha>
        <p style={{ fontSize: 12, color: 'var(--dt-text-muted)', margin: '0 0 14px' }}>
          Durante a janela os alertas da conexão são suprimidos e o período não conta como indisponibilidade.
        </p>
        <AcoesForm salvarRotulo="Abrir janela" aoCancelar={aoFechar} salvando={abrir.isPending} />
      </form>
    </Modal>
  );
}
