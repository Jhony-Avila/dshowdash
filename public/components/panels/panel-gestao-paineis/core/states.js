const PHASES = {
  IDLE: "IDLE",
  LOADING: "LOADING",
  READY: "READY",
  ERROR: "ERROR",
  SAVING: "SAVING"
};
function isValidTransition(from, to) {
  const transitions = {
    IDLE: ["LOADING"],
    LOADING: ["READY", "ERROR"],
    READY: ["LOADING", "SAVING", "ERROR"],
    SAVING: ["READY", "ERROR"],
    ERROR: ["LOADING", "IDLE"]
  };
  return transitions[from]?.includes(to) ?? false;
}
export {
  PHASES,
  isValidTransition
};
