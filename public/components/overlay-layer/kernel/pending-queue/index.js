import { VERSION, MODULE_ID } from "./constants.js";
import { inject } from "./events.js";
import { enqueue, dequeue, peek, getAll, remove, clear } from "./queue.js";
import { cleanExpired } from "./expiration.js";
import { process, startAutoProcess, stopAutoProcess, isAutoProcessEnabled } from "./process.js";
import { size, isEmpty, isFull } from "./size.js";
import { configure, getConfig, enable, disable, isEnabled } from "./config.js";
import { getMetrics, healthCheck, info } from "./health.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2 } from "./constants.js";
import { inject as inject2 } from "./events.js";
import { enqueue as enqueue2, dequeue as dequeue2, peek as peek2, getAll as getAll2, remove as remove2, clear as clear2 } from "./queue.js";
import { cleanExpired as cleanExpired2 } from "./expiration.js";
import { process as process2, startAutoProcess as startAutoProcess2, stopAutoProcess as stopAutoProcess2, isAutoProcessEnabled as isAutoProcessEnabled2 } from "./process.js";
import { size as size2, isEmpty as isEmpty2, isFull as isFull2 } from "./size.js";
import { configure as configure2, getConfig as getConfig2, enable as enable2, disable as disable2, isEnabled as isEnabled2 } from "./config.js";
import { getMetrics as getMetrics2, healthCheck as healthCheck2, info as info2 } from "./health.js";
var pending_queue_default = {
  inject: inject2,
  enqueue: enqueue2,
  dequeue: dequeue2,
  peek: peek2,
  getAll: getAll2,
  remove: remove2,
  clear: clear2,
  cleanExpired: cleanExpired2,
  process: process2,
  startAutoProcess: startAutoProcess2,
  stopAutoProcess: stopAutoProcess2,
  isAutoProcessEnabled: isAutoProcessEnabled2,
  size: size2,
  isEmpty: isEmpty2,
  isFull: isFull2,
  configure: configure2,
  getConfig: getConfig2,
  enable: enable2,
  disable: disable2,
  isEnabled: isEnabled2,
  getMetrics: getMetrics2,
  healthCheck: healthCheck2,
  info: info2,
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2
};
export {
  MODULE_ID,
  VERSION,
  cleanExpired,
  clear,
  configure,
  pending_queue_default as default,
  dequeue,
  disable,
  enable,
  enqueue,
  getAll,
  getConfig,
  getMetrics,
  healthCheck,
  info,
  inject,
  isAutoProcessEnabled,
  isEmpty,
  isEnabled,
  isFull,
  peek,
  process,
  remove,
  size,
  startAutoProcess,
  stopAutoProcess
};
