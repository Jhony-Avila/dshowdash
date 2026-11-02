// Bootstrap-V2 Loader - Bootstrap Stage
// @version 6.2.2-CONTRACTS
// @changelog v6.2.2-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.2.2)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   VERSION, hasWindow from ../constants.js
//   setBootstrapInstance from ../state.js
//   log from ../helpers/logger.js
//   exposeGlobal from ../helpers/globals.js
//   createGlobalAPI from ../global-api.js
//   ManifestIntegrity, BootCancellation (domain modules)
// DYNAMIC IMPORTS: /bootstrap-v2/index.js
// WINDOW ACCESS:
//   (window as any).BOOTSTRAP_CONFIG — LEGÍTIMO: config read (guarded by hasWindow)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, hasWindow } from '../constants.js';
import { setBootstrapInstance } from '../state.js';
import type { DynamicInstance } from '../state.js';
import { log } from '../helpers/logger.js';
import { exposeGlobal } from '../helpers/globals.js';
import { createGlobalAPI } from '../global-api.js';

import * as ManifestIntegrity from '../../domain/manifest-integrity.js';
import * as BootCancellation from '../../domain/boot-cancellation.js';

export const MODULE_ID = 'bootstrap-v2.loader.stages.bootstrap';

export function executeBootstrap() {
  log('info', 'Stage 0+: Bootstrap Platform starting');
  
  BootCancellation.reset();
  
  return import('/bootstrap-v2/index.js').then(function(BootstrapV2Module) {
    const config = (hasWindow && (window as any).BOOTSTRAP_CONFIG) || { debug: false, telemetry: { enabled: true } };
    const bootstrap = BootstrapV2Module.getInstance ? BootstrapV2Module.getInstance(config) : BootstrapV2Module.createBootstrapV2(config);
    
    setBootstrapInstance(bootstrap as unknown as DynamicInstance);

    if (bootstrap.getManifest) {
      ManifestIntegrity.storeHash(bootstrap.getManifest());
    }

    const globalAPI = createGlobalAPI(bootstrap as unknown as DynamicInstance, BootstrapV2Module as unknown as DynamicInstance);
    
    exposeGlobal('BootstrapV2', globalAPI);
    log('info', 'BootstrapV2 exposed globally (Complete Stack)', { 
      version: globalAPI.VERSION, 
      loaderVersion: VERSION,
      sprints: '1-9',
      totalImprovements: 26
    });
    
    return bootstrap.boot();
  });
}
