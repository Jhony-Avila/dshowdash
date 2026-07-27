const VERSION = "1.0.1-AAA";
const MODULE_ID = "app-shell-region-events";
const REGION_EVENTS = Object.freeze({
  MOUNTED: "region:mounted",
  UNMOUNTED: "region:unmounted",
  READY: "region:ready",
  SHOW: "region:show",
  HIDE: "region:hide",
  VISIBILITY_CHANGED: "region:visibility-changed",
  CONTENT_LOADED: "region:content-loaded",
  CONTENT_UPDATED: "region:content-updated",
  CONTENT_CLEARED: "region:content-cleared",
  LOADING_START: "region:loading-start",
  LOADING_END: "region:loading-end",
  RESIZE_START: "region:resize-start",
  RESIZE: "region:resize",
  RESIZE_END: "region:resize-end",
  FOCUS_ENTER: "region:focus-enter",
  FOCUS_LEAVE: "region:focus-leave",
  CLICK: "region:click",
  HOVER_ENTER: "region:hover-enter",
  HOVER_LEAVE: "region:hover-leave",
  ERROR: "region:error"
});
export {
  MODULE_ID,
  REGION_EVENTS,
  VERSION
};
