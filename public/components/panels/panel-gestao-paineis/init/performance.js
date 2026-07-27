import { MODULE_ID } from "../core/constants.js";
let _mountStart = 0;
function markMountStart() {
  _mountStart = performance.now();
}
function markMountEnd() {
  if (_mountStart > 0) {
    const duration = performance.now() - _mountStart;
    console.debug(`[${MODULE_ID}] Mount completed in ${duration.toFixed(1)}ms`);
    _mountStart = 0;
  }
}
export {
  markMountEnd,
  markMountStart
};
