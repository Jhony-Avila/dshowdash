import { LOADING_STATES } from "../constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.loading-progress.trickle.manager";
function startTrickle(state, config, setProgress, getProgress) {
  if (state.trickleInterval) return;
  state.trickleInterval = setInterval(() => {
    if (state.loadingState !== LOADING_STATES.LOADING) {
      stopTrickle(state);
      return;
    }
    const currentProgress = getProgress();
    let amount = config.trickleAmount;
    if (currentProgress > 80) amount = 0.5;
    else if (currentProgress > 60) amount = 1;
    else if (currentProgress > 40) amount = 1.5;
    const newProgress = Math.min(95, currentProgress + amount * Math.random());
    setProgress(newProgress);
  }, config.trickleSpeed);
}
function stopTrickle(state) {
  if (state.trickleInterval) {
    clearInterval(state.trickleInterval);
    state.trickleInterval = null;
  }
}
export {
  MODULE_ID,
  VERSION,
  startTrickle,
  stopTrickle
};
