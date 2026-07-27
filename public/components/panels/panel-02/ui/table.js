import { VERSION, MODULE_ID, TableComponent, TableComponent as TableComponent2 } from "./table/index.js";
function info() {
  return { moduleId: "panel-02/ui/table", version: "8.1.0-ENTERPRISE" };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: "panel-02/ui/table", version: "8.1.0-ENTERPRISE", checks: { tableReady: true } };
}
export {
  MODULE_ID,
  TableComponent,
  VERSION,
  TableComponent2 as default,
  healthCheck,
  info
};
