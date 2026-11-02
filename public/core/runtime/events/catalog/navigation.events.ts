// Migrado para TypeScript: 2026-02-25
// Re-export from events-catalog.bundle.js (Lote 11)
export * from "./dist/events-catalog.bundle.js";

import { NAVIGATION_EVENTS, ACCORDION_EVENTS, BRIDGE_TO_ACCORDION, BRIDGE_FROM_ACCORDION } from "./dist/events-catalog.bundle.js";

// Exports missing from bundle — navigation/accordion bridge helpers

const _navigationValues: Set<string> = new Set(Object.values(NAVIGATION_EVENTS as Record<string, string>));
const _accordionValues: Set<string> = new Set(Object.values(ACCORDION_EVENTS as Record<string, string>));

/**
 * Translates a navigation event name to its corresponding accordion event name.
 */
export function getAccordionEvent(navigationEventName: string): string | null {
  return (BRIDGE_TO_ACCORDION as Record<string, string>)[navigationEventName] || null;
}

/**
 * Translates an accordion event name to its corresponding navigation event name.
 */
export function getNavigationEvent(accordionEventName: string): string | null {
  return (BRIDGE_FROM_ACCORDION as Record<string, string>)[accordionEventName] || null;
}

/**
 * Checks if a given event name is a valid navigation event.
 */
export function isNavigationEvent(eventName: string): boolean {
  return _navigationValues.has(eventName);
}

/**
 * Checks if a given event name is a valid accordion event.
 */
export function isAccordionEvent(eventName: string): boolean {
  return _accordionValues.has(eventName);
}

interface NavigationEventBridge {
  translate: (eventName: string) => string | null;
  isValid: (eventName: string) => boolean;
}

/**
 * Creates a bidirectional bridge translator for navigation <-> accordion events.
 */
export function createNavigationEventBridge(direction: 'to_accordion' | 'from_accordion'): NavigationEventBridge {
  if (direction === 'to_accordion') {
    return {
      translate: (eventName: string): string | null => getAccordionEvent(eventName),
      isValid: (eventName: string): boolean => isNavigationEvent(eventName)
    };
  }
  return {
    translate: (eventName: string): string | null => getNavigationEvent(eventName),
    isValid: (eventName: string): boolean => isAccordionEvent(eventName)
  };
}
