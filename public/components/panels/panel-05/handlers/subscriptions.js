import { store } from "../state/store.js";
import * as Cliente360View from "../managers/cliente360-view.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:handlers:subscriptions";
let _unsubscribes = [];
const setup = (ctx) => {
  _unsubscribes.push(store.subscribe("cliente360", (data) => {
    if (data) Cliente360View.show(ctx.refs, data, ctx.moduleId, ctx.version);
    else Cliente360View.hide(ctx.refs, ctx.moduleId, ctx.version);
  }));
  _unsubscribes.push(store.subscribe("kpis", (data) => {
    if (data && ctx.renderKPIs) ctx.renderKPIs(data);
  }));
  _unsubscribes.push(store.subscribe("charts", (data) => {
    if (data && ctx.refs?.chartsArea && ctx.refs.chartsArea?.style.display !== "none" && ctx.renderCharts) ctx.renderCharts(data);
  }));
  _unsubscribes.push(store.subscribe("insights", (data) => {
    if (data && ctx.renderInsights) ctx.renderInsights(data);
  }));
  _unsubscribes.push(store.subscribe("comparativo", (data) => {
    if (data && ctx.renderComparativo) ctx.renderComparativo(data);
  }));
  _unsubscribes.push(store.subscribe("funil", (data) => {
    if (data && ctx.renderFunil) ctx.renderFunil(data);
  }));
  _unsubscribes.push(store.subscribe("churn", (data) => {
    if (data && ctx.renderChurn) ctx.renderChurn(data);
  }));
};
const clear = () => {
  _unsubscribes.forEach((fn) => {
    if (fn) fn();
  });
  _unsubscribes = [];
};
const add = (unsubFn) => {
  _unsubscribes.push(unsubFn);
};
const count = () => _unsubscribes.length;
const healthCheck = () => {
  const checks = { storeAvailable: !!store, cliente360ViewAvailable: !!Cliente360View, subscriptionsArray: Array.isArray(_unsubscribes) };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, subscriptionsCount: _unsubscribes.length, timestamp: Date.now() };
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, subscriptions: _unsubscribes.length });
var subscriptions_default = { setup, clear, add, count, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  add,
  clear,
  count,
  subscriptions_default as default,
  healthCheck,
  info,
  setup
};
