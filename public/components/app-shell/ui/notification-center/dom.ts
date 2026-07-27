/**
 * @file Notification Center — DOM Operations
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/ui/notification-center/dom
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./state.js (containerElement, config)
 * @requires ./element.js (createNotificationElement as _createElement)
 * 
 * @provides createNotificationElement, removeNotificationElement, updateProgressBar
 * @provides ensureContainer, getContainer
 * 
 * @browserAPI document.createElement, document.body.appendChild
 * 
 * @description
 * DOM manipulation for notification center. Creates, removes and updates
 * notification elements in the DOM.
 * ============================================================================
 */
'use strict';

import { containerElement, config } from './state.js';
import { createNotificationElement as _createElement } from './element.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.notification-center.dom';

const CONTAINER_ID = 'app-shell-notification-center';

export function ensureContainer() {
  if (containerElement.value) return containerElement.value;
  
  if (typeof document === 'undefined') return null;
  
  let container = document.getElementById(CONTAINER_ID);
  
  if (!container) {
    container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.className = `notification-center notification-center--${config.position}`;
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(container);
  }
  
  containerElement.value = container;
  return container;
}

export function getContainer() {
  return containerElement.value || ensureContainer();
}

export function createNotificationElement(notification: DynObj) {
  const container = ensureContainer();
  if (!container) return null;
  
  const dismissFn = (id: DynObj) => {
    // Will be handled by core.js dismiss function
    const event = new CustomEvent('notification-dismiss', { detail: { id } });
    container.dispatchEvent(event);
  };
  
  const element = _createElement(notification, dismissFn);
  
  element.classList.add('notification--entering');
  container.appendChild(element);
  
  // Trigger reflow for animation
  element.offsetHeight;
  
  setTimeout(() => {
    element.classList.remove('notification--entering');
  }, config.animationDuration || 300);
  
  return element;
}

export function removeNotificationElement(element: HTMLElement) {
  if (!element) return;
  
  element.classList.add('notification--leaving');
  
  setTimeout(() => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }, config.animationDuration || 300);
}

export function updateProgressBar(element: HTMLElement, progress: DynObj) {
  if (!element) return;
  
  const progressBar = element.querySelector('.shell-notification-progress');
  if (progressBar) {
    (progressBar as DynObj).style.width = `${Math.max(0, Math.min(100, progress))}%`;
  }
}
