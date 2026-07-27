const MODULE_ID = "header.core.errors.BaseError";
const VERSION = "1.1.0-ES6";
function BaseError(message, code, context) {
  Error.call(this, message);
  this.name = "BaseError";
  this.message = message || "Erro desconhecido";
  this.code = code || "UNKNOWN_ERROR";
  this.context = context || {};
  this.timestamp = Date.now();
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  }
}
BaseError.prototype = Object.create(Error.prototype);
BaseError.prototype.constructor = BaseError;
BaseError.prototype.toJSON = function() {
  return {
    name: this.name,
    message: this.message,
    code: this.code,
    context: this.context,
    timestamp: this.timestamp,
    stack: this.stack
  };
};
BaseError.prototype.toString = function() {
  return `${this.name} [${this.code}]: ${this.message}`;
};
var BaseError_default = BaseError;
export {
  BaseError,
  MODULE_ID,
  VERSION,
  BaseError_default as default
};
