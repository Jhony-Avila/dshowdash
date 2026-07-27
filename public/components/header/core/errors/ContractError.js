import { BaseError } from "./BaseError.js";
const MODULE_ID = "header.core.errors.ContractError";
const VERSION = "1.1.0-ES6";
function ContractError(message, componentName, issues, context) {
  BaseError.call(this, message, "CONTRACT_ERROR", Object.assign({ componentName, issues }, context));
  this.name = "ContractError";
  this.componentName = componentName || "unknown";
  this.issues = issues || [];
}
ContractError.prototype = Object.create(BaseError.prototype);
ContractError.prototype.constructor = ContractError;
ContractError.missingMethod = (componentName, methodName) => new ContractError(`M\xE9todo obrigat\xF3rio ausente: ${methodName}`, componentName, [`missing:${methodName}`], { methodName });
ContractError.missingProperty = (componentName, propertyName) => new ContractError(`Propriedade obrigat\xF3ria ausente: ${propertyName}`, componentName, [`missing:${propertyName}`], { propertyName });
ContractError.invalid = (componentName, issues) => new ContractError(`Contrato inv\xE1lido: ${issues.join(", ")}`, componentName, issues);
var ContractError_default = ContractError;
export {
  ContractError,
  MODULE_ID,
  VERSION,
  ContractError_default as default
};
