import { createLoggerHelper } from "../../_shared/create-logger-helper.js";
import { MODULE_ID } from "../constants.js";
import { _listeners, incrementMetric } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const { _log, _emit } = createLoggerHelper(MODULE_ID, _listeners, incrementMetric);
export {
  _emit,
  _log
};
