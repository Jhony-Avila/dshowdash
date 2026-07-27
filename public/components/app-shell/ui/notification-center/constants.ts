// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file Notification Center — Constants
 * @version 1.1.0-FIX-MISSING-EXPORTS
 * @module app-shell/ui/notification-center/constants
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none
 * 
 * @provides VERSION, MODULE_ID
 * @provides NOTIFICATION_TYPES, NOTIFICATION_POSITIONS, NOTIFICATION_PRIORITIES
 * @provides DEFAULT_DURATION, MAX_VISIBLE
 * 
 * @description
 * Constants and enums for Notification Center.
 * v1.1.0: Added DEFAULT_DURATION and MAX_VISIBLE for core.js compatibility.
 * ============================================================================
 */
'use strict';

export const VERSION = '1.1.0-FIX-MISSING-EXPORTS';
export const MODULE_ID = 'app-shell-notification-center';

export const NOTIFICATION_TYPES = Object.freeze({
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  LOADING: 'loading'
});

export const NOTIFICATION_POSITIONS = Object.freeze({
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  TOP_CENTER: 'top-center',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center'
});

export const NOTIFICATION_PRIORITIES = Object.freeze({
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  URGENT: 4
});

export const DEFAULT_DURATION = 5000;
export const MAX_VISIBLE = 5;
