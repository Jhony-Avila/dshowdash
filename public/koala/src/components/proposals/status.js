const STATUS_LABELS = {
  draft: "Rascunho",
  generated: "Gerada",
  sent: "Enviada",
  viewed: "Visualizada",
  expired: "Expirada",
  won: "Ganha",
  lost: "Perdida",
  canceled: "Cancelada",
  user_deleted: "Exclu\xEDda pelo usu\xE1rio"
};
const STATUS_ORDER = Object.keys(STATUS_LABELS);
export {
  STATUS_LABELS,
  STATUS_ORDER
};
