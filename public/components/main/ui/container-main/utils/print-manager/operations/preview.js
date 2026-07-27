import { getConfig, incrementMetric } from "../state.js";
import { _log, _emit } from "../helpers/logger.js";
import { _generatePrintStyles } from "../styles/print-styles.js";
import { _createPrintWrapper } from "../dom/wrapper.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.print-manager.operations.preview";
function printPreview(element = null, options = {}) {
  incrementMetric("previews");
  const el = element ? typeof element === "string" ? document.querySelector(element) : element : document.body;
  if (!el) {
    _log("error", "Element not found");
    return null;
  }
  const config = getConfig();
  const tempConfig = { ...config, ...options };
  const title = tempConfig.title || document.title || "Print Preview";
  const previewWindow = window.open("", "_blank", "width=800,height=600");
  if (!previewWindow) {
    _log("error", "Failed to open preview window (popup blocked?)");
    return null;
  }
  const styles = _generatePrintStyles();
  const wrapper = _createPrintWrapper(el);
  previewWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title} - Preview</title>
      <style>
        ${styles}
        
        body {
          background: #f5f5f5;
          padding: 20px;
          margin: 0;
        }
        
        .preview-container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          padding: 20mm;
        }
        
        .preview-toolbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #333;
          color: white;
          padding: 10px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1000;
        }
        
        .preview-toolbar button {
          background: #8b5cf6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .preview-toolbar button:hover {
          background: #7c3aed;
        }
        
        .preview-content {
          margin-top: 60px;
        }
        
        @media print {
          .preview-toolbar { display: none !important; }
          .preview-content { margin-top: 0; }
          body { background: white; padding: 0; }
          .preview-container { box-shadow: none; max-width: none; }
        }
      </style>
    </head>
    <body>
      <div class="preview-toolbar">
        <span>${title}</span>
        <button onclick="window.print()">\u{1F5A8}\uFE0F Imprimir</button>
      </div>
      <div class="preview-content">
        <div class="preview-container">
          ${wrapper.innerHTML}
        </div>
      </div>
    </body>
    </html>
  `);
  previewWindow.document.close();
  _emit("previewOpened", { title });
  return previewWindow;
}
export {
  MODULE_ID,
  VERSION,
  printPreview
};
