import { BaseError } from "./BaseError.js";
const MODULE_ID = "header.core.errors.NetworkError";
const VERSION = "1.1.0-ES6";
function NetworkError(message, endpoint, statusCode, context) {
  BaseError.call(this, message, "NETWORK_ERROR", Object.assign({ endpoint, statusCode }, context));
  this.name = "NetworkError";
  this.endpoint = endpoint || "unknown";
  this.statusCode = statusCode || null;
}
NetworkError.prototype = Object.create(BaseError.prototype);
NetworkError.prototype.constructor = NetworkError;
NetworkError.offline = () => new NetworkError("Sem conex\xE3o com a internet", null, null, { reason: "OFFLINE" });
NetworkError.serverError = (endpoint, statusCode) => new NetworkError(`Erro do servidor: ${statusCode}`, endpoint, statusCode, { reason: "SERVER_ERROR" });
NetworkError.unauthorized = (endpoint) => new NetworkError("N\xE3o autorizado", endpoint, 401, { reason: "UNAUTHORIZED" });
NetworkError.forbidden = (endpoint) => new NetworkError("Acesso negado", endpoint, 403, { reason: "FORBIDDEN" });
NetworkError.notFound = (endpoint) => new NetworkError("Recurso n\xE3o encontrado", endpoint, 404, { reason: "NOT_FOUND" });
var NetworkError_default = NetworkError;
export {
  MODULE_ID,
  NetworkError,
  VERSION,
  NetworkError_default as default
};
