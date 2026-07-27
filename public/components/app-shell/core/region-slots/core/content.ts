// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file Region Slots — Content Operations
 * @version 1.0.1-FIX-IMPORT
 * @module app-shell/core/region-slots/core/content
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ../../region-events/constants.js (REGION_EVENTS)
 * @requires ../../dom-regions/index.js (getRegion)
 * @requires ../state.js (slots, incrementMetric, notifySubscribers)
 * @requires ../constants.js (SLOT_POSITIONS)
 * 
 * @provides injectContent, clearSlot, clearRegionSlots, updateSlot
 * 
 * @description
 * Content injection and management for region slots.
 * Supports multiple insertion positions and priority-based ordering.
 * 
 * @example
 * import { injectContent, clearSlot } from './content.js';
 * injectContent('main', 'widget-1', '<div>Content</div>', { position: 'APPEND' });
 * clearSlot('main', 'widget-1');
 * ============================================================================
 */
'use strict';

import { REGION_EVENTS } from '../../region-events/constants.js';
import { getRegion } from '../../dom-regions/index.js';
import { slots, incrementMetric, notifySubscribers } from '../state.js';
import { SLOT_POSITIONS } from '../constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.region-slots.core.content';

export function injectContent(regionName: string, slotId: string, content: DynObj, options?: DynObj) {
  options = options || {};
  const position = options.position || SLOT_POSITIONS.APPEND;
  const priority = options.priority || 0;
  
  const region = getRegion(regionName);
  if (!region) {
    incrementMetric('errors');
    return { ok: false, error: `Region not found: ${regionName}` };
  }
  
  let slotElement = region.querySelector(`[data-slot-id="${slotId}"]`);
  
  if (!slotElement) {
    slotElement = document.createElement('div');
    slotElement.setAttribute('data-slot-id', slotId);
    slotElement.setAttribute('data-slot-priority', priority);
    slotElement.className = 'region-slot';
  }
  
  if (typeof content === 'string') {
    slotElement.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    slotElement.innerHTML = '';
    slotElement.appendChild(content);
  }
  
  if (!slotElement.parentNode) {
    const existingSlots = region.querySelectorAll('[data-slot-id]');
    let inserted = false;
    
    for (let i = 0; i < existingSlots.length; i++) {
      const existingPriority = parseInt(existingSlots[i].getAttribute('data-slot-priority') || '0', 10);
      if (priority > existingPriority) {
        region.insertBefore(slotElement, existingSlots[i]);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      switch (position) {
        case SLOT_POSITIONS.PREPEND:
          region.insertBefore(slotElement, region.firstChild);
          break;
        case SLOT_POSITIONS.BEFORE:
          if (options.reference) {
            const ref = region.querySelector(options.reference);
            if (ref) region.insertBefore(slotElement, ref);
            else region.appendChild(slotElement);
          } else {
            region.appendChild(slotElement);
          }
          break;
        case SLOT_POSITIONS.AFTER:
          if (options.reference) {
            const ref = region.querySelector(options.reference);
            if (ref && ref.nextSibling) region.insertBefore(slotElement, ref.nextSibling);
            else region.appendChild(slotElement);
          } else {
            region.appendChild(slotElement);
          }
          break;
        case SLOT_POSITIONS.REPLACE:
          region.innerHTML = '';
          region.appendChild(slotElement);
          break;
        default:
          region.appendChild(slotElement);
      }
    }
  }
  
  if (!slots.has(regionName)) {
    slots.set(regionName, new Map());
  }
  slots.get(regionName).set(slotId, {
    element: slotElement,
    priority,
    position,
    persistent: options.persistent || false
  });
  
  incrementMetric('contentInjections');
  notifySubscribers(REGION_EVENTS.CONTENT_UPDATED, { region: regionName, slot: slotId });
  
  return { ok: true, element: slotElement };
}

export function clearSlot(regionName: string, slotId: string) {
  const regionSlots = slots.get(regionName);
  if (!regionSlots) return false;
  
  const slotInfo = regionSlots.get(slotId);
  if (!slotInfo) return false;
  
  if (slotInfo.element && slotInfo.element.parentNode) {
    slotInfo.element.parentNode.removeChild(slotInfo.element);
  }
  
  regionSlots.delete(slotId);
  incrementMetric('contentClears');
  notifySubscribers(REGION_EVENTS.CONTENT_CLEARED, { region: regionName, slot: slotId });
  
  return true;
}

export function clearRegionSlots(regionName: string) {
  const regionSlots = slots.get(regionName);
  if (!regionSlots) return 0;
  
  let cleared = 0;
  regionSlots.forEach((slotInfo: DynObj, slotId: string) => {
    if (!slotInfo.persistent) {
      clearSlot(regionName, slotId);
      cleared++;
    }
  });
  
  return cleared;
}

export function updateSlot(regionName: string, slotId: string, content: DynObj) {
  const regionSlots = slots.get(regionName);
  if (!regionSlots) return false;
  
  const slotInfo = regionSlots.get(slotId);
  if (!slotInfo || !slotInfo.element) return false;
  
  if (typeof content === 'string') {
    slotInfo.element.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    slotInfo.element.innerHTML = '';
    slotInfo.element.appendChild(content);
  }
  
  notifySubscribers(REGION_EVENTS.CONTENT_UPDATED, { region: regionName, slot: slotId });
  return true;
}
