import { VERSION, MODULE_ID, ANIMATIONS, EASINGS } from "./constants.js";
import { animate, sequence, parallel, stagger } from "./core.js";
import { transitionIn, transitionOut, crossfade } from "./region.js";
import { cancel, cancelAll, pause, resume, pauseAll, resumeAll, getActive } from "./control.js";
import { registerAnimation, unregisterAnimation, listAnimations } from "./custom.js";
import { configure, getConfig } from "./config.js";
import { subscribe } from "./subscription.js";
import { getMetrics, healthCheck, info } from "./health.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, ANIMATIONS as ANIMATIONS2, EASINGS as EASINGS2 } from "./constants.js";
import { animate as animate2, sequence as sequence2, parallel as parallel2, stagger as stagger2 } from "./core.js";
import { transitionIn as transitionIn2, transitionOut as transitionOut2, crossfade as crossfade2 } from "./region.js";
import { cancel as cancel2, cancelAll as cancelAll2, pause as pause2, resume as resume2, pauseAll as pauseAll2, resumeAll as resumeAll2, getActive as getActive2 } from "./control.js";
import { registerAnimation as registerAnimation2, unregisterAnimation as unregisterAnimation2, listAnimations as listAnimations2 } from "./custom.js";
import { configure as configure2, getConfig as getConfig2 } from "./config.js";
import { subscribe as subscribe2 } from "./subscription.js";
import { getMetrics as getMetrics2, healthCheck as healthCheck2, info as info2 } from "./health.js";
var animation_api_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  ANIMATIONS: ANIMATIONS2,
  EASINGS: EASINGS2,
  animate: animate2,
  sequence: sequence2,
  parallel: parallel2,
  stagger: stagger2,
  transitionIn: transitionIn2,
  transitionOut: transitionOut2,
  crossfade: crossfade2,
  cancel: cancel2,
  cancelAll: cancelAll2,
  pause: pause2,
  resume: resume2,
  pauseAll: pauseAll2,
  resumeAll: resumeAll2,
  getActive: getActive2,
  registerAnimation: registerAnimation2,
  unregisterAnimation: unregisterAnimation2,
  listAnimations: listAnimations2,
  configure: configure2,
  getConfig: getConfig2,
  subscribe: subscribe2,
  getMetrics: getMetrics2,
  healthCheck: healthCheck2,
  info: info2
};
export {
  ANIMATIONS,
  EASINGS,
  MODULE_ID,
  VERSION,
  animate,
  cancel,
  cancelAll,
  configure,
  crossfade,
  animation_api_default as default,
  getActive,
  getConfig,
  getMetrics,
  healthCheck,
  info,
  listAnimations,
  parallel,
  pause,
  pauseAll,
  registerAnimation,
  resume,
  resumeAll,
  sequence,
  stagger,
  subscribe,
  transitionIn,
  transitionOut,
  unregisterAnimation
};
