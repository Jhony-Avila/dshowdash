const VERSION = "5.3.1-ENTERPRISE-MODULAR";
const MODULE_ID = "carousel";
import { getState, setState, setCurrentSlide, setAutoplay } from "./state.js";
import { init, next, prev, goTo, getCurrent, getTotal } from "./navigation.js";
import { add, remove, get, getAll, count, clear } from "./slides.js";
import { on, off, emit } from "./events.js";
import { createTemplate, createSlide } from "./template.js";
import { getState as getState2, setCurrentSlide as setCurrentSlide2, setAutoplay as setAutoplay2 } from "./state.js";
import { init as navInit, next as next2, prev as prev2, goTo as goTo2, getCurrent as getCurrent2, getTotal as getTotal2 } from "./navigation.js";
import { add as add2, remove as remove2, get as get2, getAll as getAll2, count as count2, clear as clear2 } from "./slides.js";
import { on as on2, off as off2, emit as emit2 } from "./events.js";
import { createTemplate as createTemplate2 } from "./template.js";
class DashboardCarousel {
  static VERSION = VERSION;
  static MODULE_ID = MODULE_ID;
  container;
  options;
  constructor(container, options = {}) {
    if (typeof container === "string") this.container = document.querySelector(container);
    else this.container = container;
    if (!this.container) throw new Error("Container n\xE3o encontrado");
    this.options = { autoplay: false, interval: 5e3, ...options };
    this.init();
  }
  init() {
    const state = getState2();
    if (state.totalSlides > 0) return this;
    this.container.innerHTML = createTemplate2(this.options);
    const track = this.container.querySelector(".carousel-track");
    if (track) {
      const slides = track.querySelectorAll(".carousel-slide");
      navInit(slides.length);
      slides.forEach((slide, i) => add2(slide));
    }
    this.setupControls();
    if (this.options.autoplay) {
      setAutoplay2(true);
    }
    setCurrentSlide2(0);
    return this;
  }
  setupControls() {
    const prevBtn = this.container.querySelector("[data-carousel-prev]");
    if (prevBtn) prevBtn.addEventListener("click", () => this.prev());
    const nextBtn = this.container.querySelector("[data-carousel-next]");
    if (nextBtn) nextBtn.addEventListener("click", () => this.next());
    const indicators = this.container.querySelectorAll("[data-carousel-indicator]");
    indicators.forEach((indicator, index) => {
      indicator.addEventListener("click", () => this.goTo(index));
    });
  }
  destroy() {
    setAutoplay2(false);
    clear2();
  }
  goTo(index) {
    return goTo2(index);
  }
  next() {
    return next2();
  }
  prev() {
    return prev2();
  }
  getCurrent() {
    return getCurrent2();
  }
  getTotal() {
    return getTotal2();
  }
  getSlide(index) {
    return get2(index);
  }
  getAllSlides() {
    return getAll2();
  }
  addSlide(element) {
    return add2(element);
  }
  removeSlide(index) {
    return remove2(index);
  }
  on(event, callback) {
    return on2(event, callback);
  }
  off(event, callback) {
    return off2(event, callback);
  }
  emit(event, data) {
    return emit2(event, data);
  }
  getState() {
    return getState2();
  }
  healthCheck() {
    const state = getState2();
    const checks = {
      hasSlides: count2() > 0,
      hasContainer: !!this.container
    };
    const passed = Object.values(checks).filter(Boolean).length;
    return {
      status: passed === 2 ? "healthy" : passed >= 1 ? "degraded" : "unhealthy",
      checks,
      currentIndex: getCurrent2(),
      totalSlides: count2(),
      version: VERSION
    };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, state: getState2(), healthCheck: this.healthCheck() };
  }
}
function createCarousel(container, options = {}) {
  return new DashboardCarousel(container, options);
}
function mount(container, options = {}) {
  return createCarousel(container, options);
}
function unmount(carousel) {
  if (carousel && typeof carousel.destroy === "function") carousel.destroy();
}
var carousel_default = DashboardCarousel;
export {
  DashboardCarousel,
  MODULE_ID,
  VERSION,
  add,
  clear,
  count,
  createCarousel,
  createSlide,
  createTemplate,
  carousel_default as default,
  emit,
  get,
  getAll,
  getCurrent,
  getState,
  getTotal,
  goTo,
  mount,
  init as navInit,
  next,
  off,
  on,
  prev,
  remove,
  setAutoplay,
  setCurrentSlide,
  setState,
  unmount
};
