import { createUiPorts } from "/core/runtime/ports-profiles.js";
import * as ModalAdapter from "./modal-adapter.js";
import * as LoadingAdapter from "./loading-adapter.js";
import * as PreloaderAdapter from "./preloader-adapter.js";
import * as LoginModalAdapter from "./login-modal-adapter.js";
import * as ToastAdapter from "./toast-adapter.js";
import * as DrawerAdapter from "./drawer-adapter.js";
import * as ConfirmationFactory from "./confirmation-factory.js";
const VERSION = "4.1.0-P17WI";
const MODULE_ID = "overlay-layer.adapters.index";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function connectAll() {
  const results = {
    preloader: PreloaderAdapter.connectToPreloader(),
    loginModal: LoginModalAdapter.connectToLoginModal(),
    toast: ToastAdapter.connectToToastService(),
    drawer: DrawerAdapter.connectToDrawerEvents()
  };
  let connected = 0;
  const keys = Object.keys(results);
  for (let i = 0; i < keys.length; i++) {
    if (results[keys[i]].ok) connected++;
  }
  return { ok: connected > 0, connected, total: keys.length, results };
}
function disconnectAll() {
  PreloaderAdapter.disconnect();
  LoginModalAdapter.disconnect();
  ToastAdapter.disconnect();
  DrawerAdapter.disconnect();
  return { ok: true };
}
function healthCheck() {
  const checks = { modalAdapterAvailable: !!ModalAdapter, loadingAdapterAvailable: !!LoadingAdapter, preloaderAdapterAvailable: !!PreloaderAdapter, loginModalAdapterAvailable: !!LoginModalAdapter, toastAdapterAvailable: !!ToastAdapter, drawerAdapterAvailable: !!DrawerAdapter, confirmationFactoryAvailable: !!ConfirmationFactory, portsInitialized: Ports.isInitialized() };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  const adapterHealth = {
    modal: ModalAdapter.healthCheck ? ModalAdapter.healthCheck() : { status: "UNKNOWN" },
    loading: LoadingAdapter.healthCheck ? LoadingAdapter.healthCheck() : { status: "UNKNOWN" },
    preloader: PreloaderAdapter.healthCheck ? PreloaderAdapter.healthCheck() : { status: "UNKNOWN" },
    loginModal: LoginModalAdapter.healthCheck ? LoginModalAdapter.healthCheck() : { status: "UNKNOWN" },
    toast: ToastAdapter.healthCheck ? ToastAdapter.healthCheck() : { status: "UNKNOWN" },
    drawer: DrawerAdapter.healthCheck ? DrawerAdapter.healthCheck() : { status: "UNKNOWN" },
    confirmation: ConfirmationFactory.healthCheck ? ConfirmationFactory.healthCheck() : { status: "UNKNOWN" }
  };
  return { status: passed === keys.length ? "HEALTHY" : "DEGRADED", score: `${passed}/${keys.length}`, checks, adapterHealth, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    adapters: ["modal-adapter", "loading-adapter", "preloader-adapter", "login-modal-adapter", "toast-adapter", "drawer-adapter", "confirmation-factory"],
    adapterInfo: {
      modal: ModalAdapter.info ? ModalAdapter.info() : null,
      loading: LoadingAdapter.info ? LoadingAdapter.info() : null,
      preloader: PreloaderAdapter.info ? PreloaderAdapter.info() : null,
      loginModal: LoginModalAdapter.info ? LoginModalAdapter.info() : null,
      toast: ToastAdapter.info ? ToastAdapter.info() : null,
      drawer: DrawerAdapter.info ? DrawerAdapter.info() : null,
      confirmation: ConfirmationFactory.info ? ConfirmationFactory.info() : null
    },
    portsInitialized: Ports.isInitialized(),
    timestamp: Date.now()
  };
}
var adapters_default = { ModalAdapter, LoadingAdapter, PreloaderAdapter, LoginModalAdapter, ToastAdapter, DrawerAdapter, ConfirmationFactory, connectAll, disconnectAll, healthCheck, info, VERSION, MODULE_ID, injectPorts, getPorts };
export {
  ConfirmationFactory,
  DrawerAdapter,
  LoadingAdapter,
  LoginModalAdapter,
  MODULE_ID,
  ModalAdapter,
  PreloaderAdapter,
  ToastAdapter,
  VERSION,
  connectAll,
  adapters_default as default,
  disconnectAll,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
