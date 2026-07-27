const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.skeleton-loader.templates";
const templateConfigs = {
  text: {
    lines: [{ width: "100%", height: "16px" }]
  },
  paragraph: {
    lines: [
      { width: "100%", height: "16px" },
      { width: "100%", height: "16px" },
      { width: "100%", height: "16px" },
      { width: "75%", height: "16px" }
    ],
    gap: "8px"
  },
  avatar: {
    shapes: [
      { type: "circle", size: "48px" }
    ]
  },
  thumbnail: {
    shapes: [
      { type: "rect", width: "120px", height: "80px", radius: "8px" }
    ]
  },
  card: {
    shapes: [
      { type: "rect", width: "100%", height: "160px", radius: "8px" },
      { type: "rect", width: "60%", height: "20px", marginTop: "12px" },
      { type: "rect", width: "100%", height: "14px", marginTop: "8px" },
      { type: "rect", width: "100%", height: "14px", marginTop: "4px" },
      { type: "rect", width: "40%", height: "14px", marginTop: "4px" }
    ]
  },
  list: {
    repeat: 5,
    item: {
      layout: "row",
      gap: "12px",
      shapes: [
        { type: "circle", size: "40px" },
        { type: "column", flex: 1, shapes: [
          { type: "rect", width: "70%", height: "16px" },
          { type: "rect", width: "50%", height: "12px", marginTop: "4px" }
        ] }
      ]
    },
    gap: "16px"
  },
  table: {
    header: { height: "40px", cols: 4 },
    rows: 5,
    rowHeight: "48px",
    cols: 4
  },
  form: {
    fields: [
      { label: true, input: { width: "100%", height: "40px" } },
      { label: true, input: { width: "100%", height: "40px" } },
      { label: true, input: { width: "100%", height: "100px" } },
      { button: { width: "120px", height: "40px" } }
    ],
    gap: "16px"
  },
  dashboard: {
    layout: "grid",
    cols: 3,
    gap: "16px",
    items: [
      { type: "stat", colspan: 1 },
      { type: "stat", colspan: 1 },
      { type: "stat", colspan: 1 },
      { type: "chart", colspan: 2, height: "200px" },
      { type: "list", colspan: 1, rows: 4 }
    ]
  },
  article: {
    shapes: [
      { type: "rect", width: "80%", height: "32px" },
      { type: "rect", width: "40%", height: "14px", marginTop: "8px" },
      { type: "rect", width: "100%", height: "200px", marginTop: "24px", radius: "8px" },
      { type: "rect", width: "100%", height: "16px", marginTop: "24px" },
      { type: "rect", width: "100%", height: "16px", marginTop: "8px" },
      { type: "rect", width: "100%", height: "16px", marginTop: "8px" },
      { type: "rect", width: "60%", height: "16px", marginTop: "8px" }
    ]
  }
};
export {
  MODULE_ID,
  VERSION,
  templateConfigs
};
