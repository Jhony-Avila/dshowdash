// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-events/user-menu/updater
// PURPOSE: Manages user-menu component state updates (set/clear user)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   log from ../helpers/logger.js
// PROVIDES:
//   getUserMenu(header) — retrieves user-menu component from componentsLoader
//   updateUserMenu(header, userData) — updates user-menu via setUser() or store fallback
// ═══════════════════════════════════════════════════════════════
// Header Events - User Menu Updater
// @version 6.1.0-ES6
// @changelog v6.1.0-ES6 - Task 10.1 B02: var → const
'use strict';

import { log } from '../helpers/logger.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header.core.header-events.user-menu.updater';

export function getUserMenu(header: Record<string,unknown>) {
  if (!header) return null;
  if (!header.componentsLoader) return null;
  // @ts-expect-error TS migration - TS2339
  if (typeof header.componentsLoader.getComponent !== 'function') return null;
  // @ts-expect-error TS migration - TS2339
  return header.componentsLoader.getComponent('user-menu') || null;
}

export function updateUserMenu(header: Record<string,unknown>, userData: Record<string,unknown>) {
  const userMenu = getUserMenu(header);
  if (!userMenu) {
    log('warn', 'User-menu não disponível para atualização');
    return false;
  }
  
  if (typeof userMenu.setUser === 'function') {
    userMenu.setUser(userData);
    // @ts-expect-error TS migration - TS2345
    log('debug', 'User-menu atualizado via setUser()', userData ? userData.email : 'null');
    return true;
  }
  
  if (userMenu.store && typeof userMenu.store.setState === 'function') {
    if (userData) {
      userMenu.store.setState({ user: userData, status: 'ok' });
    } else {
      userMenu.store.setState({ user: null, status: 'guest' });
    }
    log('debug', 'User-menu atualizado via store.setState() (fallback)');
    return true;
  }
  
  log('warn', 'User-menu sem método de atualização disponível');
  return false;
}
