import {
  VERSION,
  MODULE_ID,
  METRIC_TYPES,
  AGGREGATION_PERIODS,
  DEFAULT_CONFIG
} from "./constants.js";
import { createStorageAdapter } from "./storage-adapter.js";
import { calculateStats, aggregateByPeriod, calculateRate, movingAverage } from "./stats-calculator.js";
import { createMetricsStore } from "./metrics-store.js";
import { createPersistenceIO } from "./persistence-io.js";
export {
  AGGREGATION_PERIODS,
  DEFAULT_CONFIG,
  METRIC_TYPES,
  MODULE_ID,
  VERSION,
  aggregateByPeriod,
  calculateRate,
  calculateStats,
  createMetricsStore,
  createPersistenceIO,
  createStorageAdapter,
  movingAverage
};
