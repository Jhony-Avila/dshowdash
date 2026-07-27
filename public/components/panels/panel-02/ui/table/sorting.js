import { STATUS_ORDER } from "./constants.js";
function getSortValue(job, column) {
  switch (column) {
    case "job_name":
      return job.job_name || job.name || "";
    case "job_type":
      return job.job_type || job.type || "";
    case "health_status":
      return STATUS_ORDER[job.health_status] ?? 4;
    case "last_execution":
      return job.last_execution ? new Date(job.last_execution).getTime() : 0;
    case "total_executions":
      return parseInt(String(job.total_executions || 0));
    case "success_rate":
      return parseFloat(String(job.success_rate || 0));
    case "avg_execution_time":
      return parseFloat(String(job.avg_execution_time || 0));
    case "error_count":
      return parseInt(String(job.error_count || 0));
    default:
      return "";
  }
}
function sortJobs(jobs, sortColumns) {
  return [...jobs].sort((a, b) => {
    for (const { column, direction } of sortColumns) {
      let valA = getSortValue(a, column);
      let valB = getSortValue(b, column);
      if (valA === null || valA === void 0) valA = "";
      if (valB === null || valB === void 0) valB = "";
      let result = 0;
      if (typeof valA === "number" && typeof valB === "number") result = valA - valB;
      else result = String(valA).localeCompare(String(valB), "pt-BR", { numeric: true });
      if (result !== 0) return direction === "desc" ? -result : result;
    }
    return 0;
  });
}
function getSortInfo(sortColumns, columnId) {
  const idx = sortColumns.findIndex((s) => s.column === columnId);
  if (idx === -1) return { sorted: false, direction: null, index: 0 };
  return { sorted: true, direction: sortColumns[idx].direction, index: idx + 1 };
}
function handleSortClick(sortColumns, column, isMulti) {
  const newSortColumns = [...sortColumns];
  if (isMulti) {
    const existingIdx = newSortColumns.findIndex((s) => s.column === column);
    if (existingIdx >= 0) {
      if (newSortColumns[existingIdx].direction === "asc") newSortColumns[existingIdx].direction = "desc";
      else newSortColumns.splice(existingIdx, 1);
    } else {
      newSortColumns.push({ column, direction: "asc" });
    }
  } else {
    const existing = newSortColumns.find((s) => s.column === column);
    if (existing) {
      if (existing.direction === "asc") return [{ column, direction: "desc" }];
      else return [];
    } else {
      return [{ column, direction: "asc" }];
    }
  }
  return newSortColumns;
}
function updateSortIndicators(element, sortColumns) {
  if (!element) return;
  const headers = element.querySelectorAll("th[data-sort]");
  headers.forEach((th) => {
    const col = th.dataset.sort || "";
    const sortInfo = getSortInfo(sortColumns, col);
    th.classList.remove("sorted", "sorted-asc", "sorted-desc");
    th.setAttribute("aria-sort", "none");
    const badge = th.querySelector(".p02-sort-badge");
    if (badge) badge.remove();
    if (sortInfo.sorted) {
      th.classList.add("sorted", `sorted-${sortInfo.direction}`);
      th.setAttribute("aria-sort", sortInfo.direction === "asc" ? "ascending" : "descending");
      if (sortColumns.length > 1) {
        const newBadge = document.createElement("span");
        newBadge.className = "p02-sort-badge";
        newBadge.textContent = String(sortInfo.index);
        th.querySelector(".p02-sort-icon")?.after(newBadge);
      }
    }
  });
}
var sorting_default = { getSortValue, sortJobs, getSortInfo, handleSortClick, updateSortIndicators };
const MODULE_ID = "panel-02/ui/table/sorting";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { sortingReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  sorting_default as default,
  getSortInfo,
  getSortValue,
  handleSortClick,
  healthCheck,
  info,
  sortJobs,
  updateSortIndicators
};
