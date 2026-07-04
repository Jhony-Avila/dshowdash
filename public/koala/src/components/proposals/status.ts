// Rótulos PT dos 9 status da proposta (keys internas = enum do backend).
export const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  generated: 'Gerada',
  sent: 'Enviada',
  viewed: 'Visualizada',
  expired: 'Expirada',
  won: 'Ganha',
  lost: 'Perdida',
  canceled: 'Cancelada',
  user_deleted: 'Excluída pelo usuário',
};
export const STATUS_ORDER = Object.keys(STATUS_LABELS);
