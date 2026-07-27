// forms/AplicacaoForm.tsx — cadastro/edição de aplicação (§38.3, escrita).
// @version 1.0.0  @created 2026-07-20
import { useState, type JSX } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiWrite, ApiError } from '../../../lib/api';
import { Modal } from '../../../components/ui/Modal';
import { Campo, Texto, AcoesForm, Linha, ErroForm } from '../../../components/ui/Campo';

export interface AplicacaoEdit { id: number; label: string; app_key?: string | null }

export function AplicacaoForm({ aplicacao, aberto, aoFechar }: {
  aplicacao: AplicacaoEdit | null; aberto: boolean; aoFechar: () => void;
}): JSX.Element {
  const qc = useQueryClient();
  const isEdit = !!aplicacao;
  const [label, setLabel] = useState(aplicacao?.label ?? '');
  const [appKey, setAppKey] = useState(aplicacao?.app_key ?? '');
  const [erro, setErro] = useState<string | null>(null);

  const salvar = useMutation({
    mutationFn: () => {
      const payload = { label: label.trim(), app_key: appKey.trim() };
      return isEdit ? apiWrite(`/applications/${aplicacao!.id}`, 'PATCH', payload) : apiWrite('/applications', 'POST', payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dt'] }); aoFechar(); },
    onError: (e: ApiError) => setErro(e.message),
  });

  const enviar = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!label.trim()) { setErro('O nome da aplicação é obrigatório.'); return; }
    setErro(null); salvar.mutate();
  };

  return (
    <Modal titulo={isEdit ? `Editar aplicação #${aplicacao!.id}` : 'Nova aplicação'} aberto={aberto} aoFechar={aoFechar} largura={520}>
      <form onSubmit={enviar}>
        <ErroForm mensagem={erro} />
        <Linha>
          <Campo rotulo="Nome" obrigatorio>{(id) => <Texto id={id} valor={label} aoMudar={setLabel} autoComplete="off" />}</Campo>
        </Linha>
        <Linha>
          <Campo rotulo="Chave" dica="vazio = gerada do nome">{(id) => <Texto id={id} valor={appKey} aoMudar={setAppKey} autoComplete="off" />}</Campo>
        </Linha>
        <AcoesForm salvarRotulo={isEdit ? 'Salvar' : 'Cadastrar aplicação'} aoCancelar={aoFechar} salvando={salvar.isPending} />
      </form>
    </Modal>
  );
}
