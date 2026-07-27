// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-contracts-visual
// PURPOSE: Sidebar Feature Contracts - Visual Features
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CATEGORIES from ../categories.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   VISUAL_CONTRACTS — exported value
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

import { CATEGORIES } from '../categories.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const MODULE_ID = 'sidebar-contracts-visual';
export const VERSION = '1.3.0-ES6';

export const VISUAL_CONTRACTS = {
  effects: {
    module: 'parallax',
    version: '5.0.0',
    category: CATEGORIES.VISUAL,
    methods: {
      parallax: { original: 'enable', args: ['container?'], returns: 'void', requiresEl: true },
      disableParallax: { original: 'disable', args: [] as DynObj[], returns: 'void' }
    },
    legacyMethods: {
      enableParallax: 'parallax', disableParallax: 'disableParallax'
    }
  },

  transitions: {
    module: 'animated-transitions',
    version: '5.0.0',
    category: CATEGORIES.VISUAL,
    methods: {
      animate: { original: 'animateElement', args: ['element', 'direction', 'type?'], returns: 'void' },
      expand: { original: 'animateSectionExpand', args: ['sectionEl'], returns: 'void' },
      collapse: { original: 'animateSectionCollapse', args: ['sectionEl'], returns: 'void' },
      enable: { original: 'enable', args: [] as DynObj[], returns: 'void' },
      disable: { original: 'disable', args: [] as DynObj[], returns: 'void' }
    },
    legacyMethods: {
      animateElement: 'animate', animateSectionExpand: 'expand',
      animateSectionCollapse: 'collapse', enableAnimations: 'enable', disableAnimations: 'disable'
    }
  }
};

export default VISUAL_CONTRACTS;
