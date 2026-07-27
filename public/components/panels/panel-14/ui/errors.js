const MODULE_ID = "panel-14.ui.errors";
const VERSION = "9.3.0-P2-ENTERPRISE";
const ErrorTypes = {
  NETWORK: "NETWORK",
  VALIDATION: "VALIDATION",
  SERVER: "SERVER",
  UNKNOWN: "UNKNOWN"
};
function getErrorMessage(type, details = "") {
  const messages = {
    [ErrorTypes.NETWORK]: "Erro de conex\xE3o. Verifique sua internet.",
    [ErrorTypes.VALIDATION]: "Dados inv\xE1lidos. Verifique os campos.",
    [ErrorTypes.SERVER]: "Erro no servidor. Tente novamente.",
    [ErrorTypes.UNKNOWN]: "Erro desconhecido. Contate o suporte."
  };
  return details ? `${messages[type] || messages[ErrorTypes.UNKNOWN]} ${details}` : messages[type] || messages[ErrorTypes.UNKNOWN];
}
export {
  ErrorTypes,
  MODULE_ID,
  VERSION,
  getErrorMessage
};
