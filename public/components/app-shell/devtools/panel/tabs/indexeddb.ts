/**
 * @file Debug Panel — IndexedDB Tab
 * @version 1.1.0-P2-ENTERPRISE
 * @module app-shell/devtools/panel/tabs/indexeddb
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ../helpers.js (icon, sanitizeAttr)
 * 
 * @provides renderIndexedDBTab, scanDatabases
 * 
 * @browserAPI indexedDB, indexedDB.databases()
 * 
 * @description
 * IndexedDB explorer for debug panel. Scans databases, lists stores,
 * shows record counts and indexes. Firefox fallback for databases() API.
 * 
 * @example
 * import { renderIndexedDBTab, scanDatabases } from './indexeddb.js';
 * const html = renderIndexedDBTab();
 * await scanDatabases();
 * ============================================================================
 */
'use strict';

import { icon, sanitizeAttr } from '../helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.devtools.panel.tabs.indexeddb';

let _databases: DynObj[] = [];
let _lastScan: DynObj = null;
const _knownDbNames = ['app-shell-state', 'dshowdash-cache', 'workbox-precache'];

export function scanDatabases() {
  return new Promise(resolve => {
    if (!indexedDB) {
      resolve([]);
      return;
    }
    
    if (typeof indexedDB.databases === 'function') {
      indexedDB.databases().then(dbs => {
        const promises = dbs.map(dbInfo => _processDatabase(dbInfo.name, dbInfo.version));
        Promise.all(promises).then(results => {
          _databases = results.filter(Boolean);
          _lastScan = Date.now();
          resolve(_databases);
        });
      }).catch(() => {
        _scanFallback().then(resolve);
      });
    } else {
      _scanFallback().then(resolve);
    }
  });
}

function _scanFallback() {
  const promises = _knownDbNames.map(name => _processDatabase(name, null));
  
  return Promise.all(promises).then(results => {
    _databases = results.filter(Boolean);
    _lastScan = Date.now();
    return _databases;
  });
}

function _processDatabase(name: DynObj, version: DynObj) {
  return new Promise(resolve => {
    try {
      const request = indexedDB.open(name);
      
      request.onerror = () => {
        resolve(null);
      };
      
      request.onsuccess = event => {
        const db = (event.target as any).result;
        const stores = [];
        
        for (let i = 0; i < db.objectStoreNames.length; i++) {
          const storeName = db.objectStoreNames[i];
          stores.push({
            name: storeName,
            recordCount: null,
            indexes: []
          });
        }
        
        const storePromises = stores.map(store => _countRecords(db, store.name).then(count => {
          // @ts-expect-error strict migration — TS2322
          store.recordCount = count;
          return store;
        }));
        
        Promise.all(storePromises).then(processedStores => {
          db.close();
          resolve({
            name,
            version: db.version,
            stores: processedStores
          });
        });
      };
    } catch (e) {
      resolve(null);
    }
  });
}

function _countRecords(db: DynObj, storeName: string) {
  return new Promise(resolve => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const countRequest = store.count();
      
      countRequest.onsuccess = () => {
        resolve(countRequest.result);
      };
      countRequest.onerror = () => {
        resolve(0);
      };
    } catch (e) {
      resolve(0);
    }
  });
}

export function renderIndexedDBTab() {
  let html = '<div class="dsd-ui-section">';
  html += `<div class="dsd-ui-section__title">${icon('database', 16)} IndexedDB Explorer</div>`;
  
  html += `<button class="dsd-ui-btn dsd-ui-btn--primary" id="dsd-debug-scan-idb">${icon('refresh', 14)} Scan Databases</button>`;
  
  if (_lastScan) {
    html += `<span class="dsd-ui-text-muted" style="margin-left:8px">Last scan: ${new Date(_lastScan).toLocaleTimeString()}</span>`;
  }
  
  html += '</div>';
  
  if (_databases.length === 0) {
    html += '<div class="dsd-ui-empty">No databases found. Click "Scan Databases" to discover IndexedDB databases.</div>';
    return html;
  }
  
  for (let i = 0; i < _databases.length; i++) {
    const db = _databases[i];
    html += '<div class="dsd-ui-card">';
    html += `<div class="dsd-ui-card__title">${icon('database', 14)} ${sanitizeAttr(db.name)} <span class="dsd-ui-badge">v${db.version}</span></div>`;
    
    if (db.stores.length === 0) {
      html += '<div class="dsd-ui-text-muted">No object stores</div>';
    } else {
      html += '<div class="dsd-ui-list">';
      for (let j = 0; j < db.stores.length; j++) {
        const store = db.stores[j];
        html += '<div class="dsd-ui-list-item">';
        html += `<span>${icon('folder', 12)} ${sanitizeAttr(store.name)}</span>`;
        html += `<span class="dsd-ui-badge">${store.recordCount !== null ? `${store.recordCount} records` : 'N/A'}</span>`;
        html += '</div>';
      }
      html += '</div>';
    }
    
    html += '</div>';
  }
  
  return html;
}

export default {
  renderIndexedDBTab,
  scanDatabases
};
