// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navigation-adapter-legacy
// PURPOSE: Navigation Adapter Legacy - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   TRIGGER_PATTERNS — exported value
//   DEFAULT_REGION — exported value
//   SECTION_MAPPING — exported value
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

export const VERSION = '1.2.0-ES6';
export const MODULE_ID = 'navigation-adapter-legacy';

export const TRIGGER_PATTERNS = {
    V1_ITEM: /^trigger:navigation:item-(.+)$/,
    V1_SECTION: /^trigger:navigation:section-(.+)$/,
    LEGACY_SIDEBAR: /^trigger:sidebar:(.+)$/,
    LEGACY_ACCORDION: /^trigger:accordion:item-(.+)$/,
    LEGACY_ACCORDION_SECTION: /^trigger:accordion:section-(.+)$/,
    LEGACY_PLAIN: /^([a-z0-9-]+)$/,
    LEGACY_4SEG_ITEM: /^trigger:navigation:item:(.+)$/,
    LEGACY_4SEG_SECTION: /^trigger:navigation:section:(.+)$/
};

export const DEFAULT_REGION = 'region:app:accordion-ncs';

export const SECTION_MAPPING = {
    'principal': 'principal',
    'main': 'principal',
    'dashboard': 'principal',
    'operacional': 'operacional',
    'operational': 'operacional',
    'admin': 'admin',
    'administracao': 'admin',
    'financeiro': 'financeiro',
    'financial': 'financeiro',
    'integracao': 'integracao',
    'integration': 'integracao',
    'default': 'principal'
};

export default {
    VERSION,
    MODULE_ID,
    TRIGGER_PATTERNS,
    DEFAULT_REGION,
    SECTION_MAPPING
};
