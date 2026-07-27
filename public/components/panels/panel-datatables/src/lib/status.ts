// lib/status.ts — semantica visual de status (§6.4 / §13.8).
// @version 1.0.0  @created 2026-07-20
// Regra inviolavel: status NUNCA e comunicado so por cor. Sempre cor + icone +
// texto + tooltip. Herdado do painel vanilla, que ja seguia isso.

export type StatusConexao =
  | 'online' | 'slow' | 'unstable' | 'offline'
  | 'untested' | 'maintenance' | 'credential_expired';

export interface StatusVisual {
  rotulo: string;
  /** Nome do icone Lucide. */
  icone: string;
  /** Token de cor (nunca literal). */
  cor: string;
  fundo: string;
  descricao: string;
}

export const STATUS: Record<StatusConexao, StatusVisual> = {
  online: { rotulo: 'Online', icone: 'CircleCheck', cor: 'var(--dt-success)', fundo: 'var(--dt-success-bg)',
    descricao: 'Conexão estabelecida e todos os testes essenciais concluídos.' },
  slow: { rotulo: 'Lento', icone: 'Clock', cor: 'var(--dt-slow)', fundo: 'var(--dt-slow-bg)',
    descricao: 'Funciona, mas a verificação ultrapassou o limite configurado.' },
  unstable: { rotulo: 'Instável', icone: 'Activity', cor: 'var(--dt-warning)', fundo: 'var(--dt-warning-bg)',
    descricao: 'Falhas intermitentes ou alternância frequente de estado.' },
  offline: { rotulo: 'Offline', icone: 'CircleX', cor: 'var(--dt-danger)', fundo: 'var(--dt-danger-bg)',
    descricao: 'Não foi possível estabelecer ou manter a conexão.' },
  untested: { rotulo: 'Não testado', icone: 'CircleHelp', cor: 'var(--dt-neutral)', fundo: 'var(--dt-neutral-bg)',
    descricao: 'A conexão ainda não foi verificada.' },
  maintenance: { rotulo: 'Manutenção', icone: 'Wrench', cor: 'var(--dt-info)', fundo: 'var(--dt-info-bg)',
    descricao: 'Colocada manualmente em manutenção; alertas suspensos.' },
  credential_expired: { rotulo: 'Credencial expirada', icone: 'KeyRound', cor: 'var(--dt-cred)', fundo: 'var(--dt-cred-bg)',
    descricao: 'Credencial inválida, vencida ou sem permissão suficiente.' },
};

export function statusVisual(s: string | null | undefined): StatusVisual {
  return STATUS[(s ?? 'untested') as StatusConexao] ?? STATUS.untested;
}
