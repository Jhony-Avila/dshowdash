import { getConfig, setConfig, isPrinting, setIsPrinting, incrementMetric } from "../state.js";
import { _log, _emit } from "../helpers/logger.js";
import { _injectPrintStylesheet, _removePrintStylesheet } from "../dom/stylesheet.js";
import { _createPrintWrapper } from "../dom/wrapper.js";
import { configure } from "../api.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.print-manager.operations.print";
async function print(options = {}) {
  if (isPrinting()) {
    _log("warn", "Print already in progress");
    return false;
  }
  setIsPrinting(true);
  incrementMetric("printAttempts");
  _emit("printStart", {});
  try {
    const originalConfig = { ...getConfig() };
    if (Object.keys(options).length > 0) {
      configure(options);
    }
    _injectPrintStylesheet();
    const printPromise = new Promise((resolve) => {
      const handleAfterPrint = () => {
        window.removeEventListener("afterprint", handleAfterPrint);
        _removePrintStylesheet();
        setConfig(originalConfig);
        setIsPrinting(false);
        incrementMetric("printSuccesses");
        _emit("printEnd", { success: true });
        resolve(true);
      };
      window.addEventListener("afterprint", handleAfterPrint);
      setTimeout(() => {
        window.removeEventListener("afterprint", handleAfterPrint);
        if (isPrinting()) {
          _removePrintStylesheet();
          setConfig(originalConfig);
          setIsPrinting(false);
          _emit("printEnd", { success: false, reason: "timeout" });
          resolve(false);
        }
      }, 6e4);
    });
    window.print();
    return await printPromise;
  } catch (error) {
    incrementMetric("errors");
    setIsPrinting(false);
    _removePrintStylesheet();
    _emit("printError", { error: error.message });
    _log("error", "Print failed:", error.message);
    return false;
  }
}
async function printElement(element, options = {}) {
  const el = typeof element === "string" ? document.querySelector(element) : element;
  if (!el) {
    _log("error", "Element not found");
    return false;
  }
  if (isPrinting()) {
    _log("warn", "Print already in progress");
    return false;
  }
  setIsPrinting(true);
  incrementMetric("printAttempts");
  _emit("printStart", { element: el });
  try {
    const originalContents = document.body.innerHTML;
    const originalTitle = document.title;
    if (options.title) {
      document.title = options.title;
    }
    const wrapper = _createPrintWrapper(el);
    document.body.innerHTML = "";
    document.body.appendChild(wrapper);
    _injectPrintStylesheet();
    const printPromise = new Promise((resolve) => {
      const handleAfterPrint = () => {
        window.removeEventListener("afterprint", handleAfterPrint);
        document.body.innerHTML = originalContents;
        document.title = originalTitle;
        _removePrintStylesheet();
        setIsPrinting(false);
        incrementMetric("printSuccesses");
        _emit("printEnd", { success: true });
        resolve(true);
      };
      window.addEventListener("afterprint", handleAfterPrint);
      setTimeout(() => {
        window.removeEventListener("afterprint", handleAfterPrint);
        if (isPrinting()) {
          document.body.innerHTML = originalContents;
          document.title = originalTitle;
          _removePrintStylesheet();
          setIsPrinting(false);
          _emit("printEnd", { success: false, reason: "timeout" });
          resolve(false);
        }
      }, 6e4);
    });
    window.print();
    return await printPromise;
  } catch (error) {
    incrementMetric("errors");
    setIsPrinting(false);
    _removePrintStylesheet();
    _emit("printError", { error: error.message });
    _log("error", "Print element failed:", error.message);
    return false;
  }
}
export {
  MODULE_ID,
  VERSION,
  print,
  printElement
};
