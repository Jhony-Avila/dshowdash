const VERSION = "1.0.0";
const MODULE_ID = "container-main:export-content";
const EXPORT_FORMATS = Object.freeze({
  PNG: "png",
  JPEG: "jpeg",
  PDF: "pdf",
  SVG: "svg"
});
const EXPORT_QUALITY = Object.freeze({
  LOW: 0.6,
  MEDIUM: 0.8,
  HIGH: 0.92,
  MAXIMUM: 1
});
const DEFAULT_CONFIG = Object.freeze({
  format: "png",
  quality: 0.92,
  scale: 2,
  backgroundColor: null,
  filename: "export",
  includeDateInFilename: true,
  maxWidth: null,
  maxHeight: null,
  watermark: null,
  excludeSelectors: [".dsd-no-export", ".dsd-debug-panel"],
  onProgress: null
});
export {
  DEFAULT_CONFIG,
  EXPORT_FORMATS,
  EXPORT_QUALITY,
  MODULE_ID,
  VERSION
};
