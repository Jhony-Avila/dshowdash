/**
 * @file Animation API — Core Operations
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/ui/animation-api/core
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./state.js (activeAnimations, incrementMetric, config)
 * 
 * @provides animate, sequence, parallel, stagger
 * 
 * @browserAPI Element.animate(), Animation API, requestAnimationFrame
 * 
 * @description
 * Core animation operations using Web Animations API.
 * Supports sequencing, parallel execution, and staggered animations.
 * Respects prefers-reduced-motion preference.
 * 
 * @example
 * import { animate, sequence, stagger } from './core.js';
 * await animate(element, { opacity: [0, 1] }, { duration: 300 });
 * await sequence([el1, el2], keyframes, { stagger: 100 });
 * ============================================================================
 */
'use strict';

import { activeAnimations, incrementMetric, config } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.animation-api.core';

function _prefersReducedMotion() {
  return typeof window !== 'undefined' && 
         window.matchMedia && 
         window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function animate(element: HTMLElement, keyframes: DynObj, options: DynObj) {
  options = options || {};
  
  if (_prefersReducedMotion() && !options.ignoreReducedMotion) {
    return Promise.resolve({ cancelled: false, reducedMotion: true });
  }
  
  if (!element || !element.animate) {
    return Promise.resolve({ cancelled: false, error: 'Invalid element' });
  }
  
  const duration = options.duration || config.defaultDuration;
  const easing = options.easing || config.defaultEasing;
  const fill = options.fill || 'forwards';
  
  const animation = element.animate(keyframes, {
    duration,
    easing,
    fill,
    delay: options.delay || 0,
    iterations: options.iterations || 1
  });
  
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  activeAnimations.set(id, animation);
  incrementMetric('animationsStarted');
  
  return new Promise(resolve => {
    const timeout = options.timeout || duration + 1000;
    let timeoutId: DynObj = null;
    
    function cleanup(result: DynObj) {
      if (timeoutId) clearTimeout(timeoutId);
      activeAnimations.delete(id);
      resolve(result);
    }
    
    animation.onfinish = () => {
      incrementMetric('animationsCompleted');
      cleanup({ cancelled: false, id });
    };
    
    animation.oncancel = () => {
      incrementMetric('animationsCancelled');
      cleanup({ cancelled: true, id });
    };
    
    timeoutId = setTimeout(() => {
      animation.cancel();
      cleanup({ cancelled: true, timeout: true, id });
    }, timeout);
  });
}

export function sequence(elements: DynObj, keyframes: DynObj, options: DynObj) {
  options = options || {};
  const staggerDelay = options.stagger || 0;
  
  if (!Array.isArray(elements)) {
    elements = Array.from(elements);
  }
  
  let chain = Promise.resolve();
  const results: DynObj[] = [];
  
  for (let i = 0; i < elements.length; i++) {
    (index => {
      chain = chain.then(() => new Promise(resolve => {
        setTimeout(() => {
          animate(elements[index], keyframes, options).then(result => {
            results.push(result);
            resolve();
          });
        }, index > 0 ? staggerDelay : 0);
      }));
    })(i);
  }
  
  return chain.then(() => results);
}

export function parallel(elements: DynObj, keyframes: DynObj, options: DynObj) {
  if (!Array.isArray(elements)) {
    elements = Array.from(elements);
  }
  
  const promises = elements.map((el: HTMLElement) => animate(el, keyframes, options));
  
  return Promise.all(promises);
}

export function stagger(elements: DynObj, keyframes: DynObj, options: DynObj) {
  options = options || {};
  const delay = options.staggerDelay || 50;
  
  if (!Array.isArray(elements)) {
    elements = Array.from(elements);
  }
  
  const promises = elements.map((el: HTMLElement, index: number) => {
    const itemOptions = Object.assign({}, options, {
      delay: (options.delay || 0) + (index * delay)
    });
    return animate(el, keyframes, itemOptions);
  });
  
  return Promise.all(promises);
}

export default {
  animate,
  sequence,
  parallel,
  stagger
};
