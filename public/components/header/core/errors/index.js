import { BaseError } from "./BaseError.js";
import { MountError } from "./MountError.js";
import { TimeoutError } from "./TimeoutError.js";
import { ContractError } from "./ContractError.js";
import { NetworkError } from "./NetworkError.js";
import { ConfigError } from "./ConfigError.js";
import { PluginError } from "./PluginError.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/core/errors";
var errors_default = {
  VERSION,
  MODULE_ID
};
export {
  BaseError,
  ConfigError,
  ContractError,
  MODULE_ID,
  MountError,
  NetworkError,
  PluginError,
  TimeoutError,
  VERSION,
  errors_default as default
};
