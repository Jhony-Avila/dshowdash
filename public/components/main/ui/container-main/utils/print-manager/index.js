import { VERSION, MODULE_ID, PRINT_ORIENTATIONS, PRINT_SIZES, PAGE_BREAK_MODES } from "./constants.js";
import {
  createPrintManager,
  getPrintManager,
  configure,
  print,
  printElement,
  printPreview,
  addPageBreak,
  removePageBreaks,
  markAvoidBreak,
  markKeepTogether,
  subscribe,
  healthCheck,
  info
} from "./api.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, PRINT_ORIENTATIONS as PRINT_ORIENTATIONS2, PRINT_SIZES as PRINT_SIZES2, PAGE_BREAK_MODES as PAGE_BREAK_MODES2 } from "./constants.js";
import {
  createPrintManager as createPrintManager2,
  getPrintManager as getPrintManager2,
  configure as configure2,
  print as print2,
  printElement as printElement2,
  printPreview as printPreview2,
  addPageBreak as addPageBreak2,
  removePageBreaks as removePageBreaks2,
  markAvoidBreak as markAvoidBreak2,
  markKeepTogether as markKeepTogether2,
  subscribe as subscribe2,
  healthCheck as healthCheck2,
  info as info2
} from "./api.js";
var print_manager_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  PRINT_ORIENTATIONS: PRINT_ORIENTATIONS2,
  PRINT_SIZES: PRINT_SIZES2,
  PAGE_BREAK_MODES: PAGE_BREAK_MODES2,
  createPrintManager: createPrintManager2,
  getPrintManager: getPrintManager2,
  configure: configure2,
  print: print2,
  printElement: printElement2,
  printPreview: printPreview2,
  addPageBreak: addPageBreak2,
  removePageBreaks: removePageBreaks2,
  markAvoidBreak: markAvoidBreak2,
  markKeepTogether: markKeepTogether2,
  subscribe: subscribe2,
  healthCheck: healthCheck2,
  info: info2
};
export {
  MODULE_ID,
  PAGE_BREAK_MODES,
  PRINT_ORIENTATIONS,
  PRINT_SIZES,
  VERSION,
  addPageBreak,
  configure,
  createPrintManager,
  print_manager_default as default,
  getPrintManager,
  healthCheck,
  info,
  markAvoidBreak,
  markKeepTogether,
  print,
  printElement,
  printPreview,
  removePageBreaks,
  subscribe
};
