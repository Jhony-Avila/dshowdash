// HTTPS Guard - Protocol Enforcer
// @version 1.0.1-CONTRACTS
// @changelog v1.0.1-CONTRACTS: Dependency Contract formalizado
// @description QW#21 - HTTPS guard separado para melhor modularidade
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: enforce(), check(), info()
// WINDOW ACCESS:
//   window.location — LEGÍTIMO: browser API (protocol/hostname detection)
//   window.location.replace() — LEGÍTIMO: HTTPS redirect
// ═══════════════════════════════════════════════════════════════
'use strict';

const MODULE_ID = 'https-guard';
const VERSION = '1.0.1-CONTRACTS';

let _redirected = false;
let _checked = false;

// Executar verificação e redirecionamento
function enforce() {
  if (_checked) {
    return { redirected: _redirected, alreadyChecked: true };
  }
  
  _checked = true;
  
  if (typeof window === 'undefined' || !window.location) {
    return { redirected: false, reason: 'no-window' };
  }
  
  // Permitir localhost para desenvolvimento
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.indexOf('192.168.') === 0) {
    return { redirected: false, reason: 'localhost-allowed' };
  }
  
  if (window.location.protocol !== 'https:') {
    _redirected = true;
    const newUrl = 'https://' + window.location.host + window.location.pathname + window.location.search + window.location.hash;
    window.location.replace(newUrl);
    return { redirected: true, newUrl: newUrl };
  }
  
  return { redirected: false, reason: 'already-https' };
}

// Verificar sem redirecionar
function check() {
  if (typeof window === 'undefined' || !window.location) {
    return { secure: false, reason: 'no-window' };
  }
  
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.indexOf('192.168.') === 0;
  const isHttps = window.location.protocol === 'https:';
  
  return {
    secure: isHttps || isLocalhost,
    protocol: window.location.protocol,
    hostname: hostname,
    isLocalhost: isLocalhost,
    isHttps: isHttps
  };
}

function info() {
  const status = check();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    checked: _checked,
    redirected: _redirected,
    secure: status.secure,
    protocol: status.protocol
  };
}

export {
  enforce,
  check,
  info,
  MODULE_ID,
  VERSION
};

export default {
  enforce: enforce,
  check: check,
  info: info,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};
