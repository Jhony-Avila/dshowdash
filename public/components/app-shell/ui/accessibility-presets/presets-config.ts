// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file Accessibility Presets - Configuration
 * @version 1.0.1-FIX-ALIAS
 * @module app-shell/ui/accessibility-presets/presets-config
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none (standalone configuration)
 * 
 * @provides PRESETS, presetConfigs (alias), getPresetConfig
 * 
 * @description
 * Accessibility preset configurations. Defines CSS variables, body classes,
 * and settings for each accessibility preset (high-contrast, large-text, etc.).
 * v1.0.1: Added presetConfigs alias for backward compatibility.
 * 
 * @example
 * import { PRESETS, getPresetConfig } from './presets-config.js';
 * const config = getPresetConfig('high-contrast');
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.accessibility-presets.presets-config';

export const PRESETS = {
  default: {
    name: 'Default',
    description: 'Configurações padrão',
    cssVars: {},
    bodyClasses: [] as DynObj,
    settings: {}
  },
  'high-contrast': {
    name: 'High Contrast',
    description: 'Alto contraste para melhor legibilidade',
    cssVars: {
      '--color-background': '#000000',
      '--color-surface': '#1a1a1a',
      '--color-text': '#ffffff',
      '--color-text-muted': '#e0e0e0',
      '--color-primary': '#ffff00',
      '--color-border': '#ffffff'
    },
    bodyClasses: ['a11y-high-contrast'],
    settings: { contrast: 'high' }
  },
  'large-text': {
    name: 'Large Text',
    description: 'Texto ampliado para melhor leitura',
    cssVars: {
      '--font-size-base': '18px',
      '--font-size-sm': '16px',
      '--font-size-lg': '22px',
      '--font-size-xl': '26px',
      '--line-height-base': '1.6'
    },
    bodyClasses: ['a11y-large-text'],
    settings: { fontSize: 'large' }
  },
  'reduced-motion': {
    name: 'Reduced Motion',
    description: 'Remove animações e transições',
    cssVars: {
      '--transition-duration': '0ms',
      '--animation-duration': '0ms'
    },
    bodyClasses: ['a11y-reduced-motion'],
    settings: { reduceMotion: true }
  },
  'focus-visible': {
    name: 'Enhanced Focus',
    description: 'Indicadores de foco mais visíveis',
    cssVars: {
      '--focus-outline-width': '3px',
      '--focus-outline-offset': '2px',
      '--focus-outline-color': '#0066ff'
    },
    bodyClasses: ['a11y-focus-visible'],
    settings: { enhancedFocus: true }
  },
  'dyslexia-friendly': {
    name: 'Dyslexia Friendly',
    description: 'Configurações para dislexia',
    cssVars: {
      '--font-family-base': 'OpenDyslexic, Arial, sans-serif',
      '--letter-spacing': '0.05em',
      '--word-spacing': '0.16em',
      '--line-height-base': '1.8'
    },
    bodyClasses: ['a11y-dyslexia-friendly'],
    settings: { dyslexiaMode: true }
  },
  'low-vision': {
    name: 'Low Vision',
    description: 'Otimizado para baixa visão',
    cssVars: {
      '--font-size-base': '20px',
      '--font-weight-base': '500',
      '--color-text': '#000000',
      '--color-background': '#fffef0',
      '--line-height-base': '1.7'
    },
    bodyClasses: ['a11y-low-vision'],
    settings: { lowVision: true }
  },
  'cognitive': {
    name: 'Cognitive',
    description: 'Interface simplificada',
    cssVars: {
      '--content-max-width': '600px',
      '--paragraph-spacing': '1.5em'
    },
    bodyClasses: ['a11y-cognitive'],
    settings: { simplifiedUI: true }
  }
};

// Alias for backward compatibility
export const presetConfigs = PRESETS;

export function getPresetConfig(presetName: string) {
  return (PRESETS as DynObj)[presetName] || PRESETS.default;
}

export default {
  PRESETS,
  presetConfigs,
  getPresetConfig
};
