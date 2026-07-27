// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger
// PURPOSE: Logger Helper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLoggerHelper from ../../_shared/create-logger-helper.js
//   MODULE_ID from ../constants.js
//   _listeners, incrementMetric from ../state.js
//
// PROVIDES:
//   _log() — exported function
//   _emit() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLoggerHelper } from '../../_shared/create-logger-helper.js';
import { MODULE_ID } from '../constants.js';
import { _listeners, incrementMetric } from '../state.js';

const VERSION = '15.2.0-MODULAR';

// @ts-expect-error TS migration - TS2345
const { _log, _emit } = createLoggerHelper(MODULE_ID, _listeners, incrementMetric);
export { _log, _emit };
