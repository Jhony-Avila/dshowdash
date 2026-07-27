const VERSION = "1.0.0-AAA";
const MODULE_ID = "app-shell-region-slots";
const SLOT_POSITIONS = Object.freeze({
  PREPEND: "prepend",
  APPEND: "append",
  REPLACE: "replace",
  BEFORE: "before",
  AFTER: "after"
});
const SLOT_ATTRIBUTE = "data-slot";
const SLOT_ID_ATTRIBUTE = "data-slot-id";
const SLOT_PRIORITY_ATTRIBUTE = "data-slot-priority";
var constants_default = {
  VERSION,
  MODULE_ID,
  SLOT_POSITIONS,
  SLOT_ATTRIBUTE,
  SLOT_ID_ATTRIBUTE,
  SLOT_PRIORITY_ATTRIBUTE
};
export {
  MODULE_ID,
  SLOT_ATTRIBUTE,
  SLOT_ID_ATTRIBUTE,
  SLOT_POSITIONS,
  SLOT_PRIORITY_ATTRIBUTE,
  VERSION,
  constants_default as default
};
