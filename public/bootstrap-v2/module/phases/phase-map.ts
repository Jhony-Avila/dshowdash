// Phase Map
// @version 2.6.1-CONTRACTS
// @changelog v2.6.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   phase0..phase6 from ../../phases/phase-{0..6}-*.js
// PROVIDES: PHASE_MAP, CONFIG_KEY_MAP
// WINDOW ACCESS: None (pure data mapping)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { phase0 } from '../../phases/phase-0-critical.js';
import { phase1 } from '../../phases/phase-1-core.js';
import { phase2 } from '../../phases/phase-2-auth.js';
import { phase3 } from '../../phases/phase-3-shell.js';
import { phase4 } from '../../phases/phase-4-main.js';
import { phase5 } from '../../phases/phase-5-ui.js';
import { phase6 } from '../../phases/phase-6-platform.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.phases.phase-map';

export const PHASE_MAP = {
  'phase-0-critical': phase0,
  'phase-1-core': phase1,
  'phase-2-auth': phase2,
  'phase-3-shell': phase3,
  'phase-4-main': phase4,
  'phase-5-ui': phase5,
  'phase-6-platform': phase6
};

export const CONFIG_KEY_MAP = {
  'phase-0-critical': 'critical',
  'phase-1-core': 'core',
  'phase-2-auth': 'auth',
  'phase-3-shell': 'shell',
  'phase-4-main': 'main',
  'phase-5-ui': 'ui',
  'phase-6-platform': 'platform'
};

export default { PHASE_MAP, CONFIG_KEY_MAP };
