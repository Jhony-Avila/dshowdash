// Navigation Audit Script - Enterprise P25
// @version 8.3.0-ENTERPRISE
// @changelog 8.3.0 - Migrado para TypeScript com interfaces tipadas
// @changelog 8.2.0 - Migrado console.log para Logger Enterprise
// Script read-only para validar conformidade do pipeline
'use strict';

import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface Finding {
    pattern: string;
    file: string;
}

interface AuditResult {
    violations: Finding[];
    allowedExceptions: Finding[];
    mainInternal: Finding[];
    total: number;
}

interface ModuleInfo {
    moduleId: string;
    version: string;
}

interface HealthStatus {
    status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    moduleId: string;
    version: string;
}

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════

const MODULE_ID = 'audit-navigation';
const VERSION = '8.3.0-ENTERPRISE';

const COMPONENTS_DIR = '/var/www/dshowdash/public/components';

const HARD_NAV_ALLOWLIST: string[] = ['pages/login', 'pages/logout', 'pages/maintenance', 'pages/forbidden', 'pages/404', 'login-modal/core/router-adapters.js', 'header/components/user-menu', 'nav-rail/core/router-bridge.js', 'pages/bling', 'pages/geral'];

const PATTERNS: Record<string, RegExp> = {
  routerGlobalNavigate: /RouterGlobal\.navigate\s*\(/g,
  locationHref: /window\.location\.href\s*=/g,
  locationAssign: /window\.location\.assign\s*\(/g,
  locationReplace: /window\.location\.replace\s*\(/g,
  locationHash: /window\.location\.hash\s*=/g
};

// Logger interno para Node.js (script de auditoria)
const _logger = {
  _format: function(level: string, msg: string): string {
    return '[' + MODULE_ID + '] [' + level.toUpperCase() + '] ' + msg;
  },
  info: function(msg: string): void { process.stdout.write(this._format('info', msg) + '\n'); },
  warn: function(msg: string): void { process.stdout.write(this._format('warn', msg) + '\n'); },
  error: function(msg: string): void { process.stderr.write(this._format('error', msg) + '\n'); }
};

function isAllowlisted(filePath: string): boolean {
  for (let i = 0; i < HARD_NAV_ALLOWLIST.length; i++) {
    if (filePath.indexOf(HARD_NAV_ALLOWLIST[i]) !== -1) return true;
  }
  return false;
}

function isInMain(filePath: string): boolean {
  return filePath.indexOf('/main/') !== -1;
}

function scanFile(filePath: string): Finding[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings: Finding[] = [];
  for (const patternName in PATTERNS) {
    if (PATTERNS.hasOwnProperty(patternName)) {
      const matches = content.match(PATTERNS[patternName]);
      if (matches) {
        for (let i = 0; i < matches.length; i++) {
          findings.push({ pattern: patternName, file: filePath });
        }
      }
    }
  }
  return findings;
}

function walkDir(dir: string, fileList?: string[]): string[] {
  fileList = fileList || [];
  const files = fs.readdirSync(dir);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && file.indexOf('node_modules') === -1 && file.indexOf('.bak') === -1) {
      walkDir(filePath, fileList);
    } else if (file.indexOf('.js') !== -1 && file.indexOf('.bak') === -1) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function runAudit(): AuditResult {
  _logger.info('NAVIGATION AUDIT - P25');
  _logger.info('Timestamp: ' + new Date().toISOString());
  const allFiles = walkDir(COMPONENTS_DIR);
  let allFindings: Finding[] = [];
  for (let i = 0; i < allFiles.length; i++) {
    allFindings = allFindings.concat(scanFile(allFiles[i]));
  }
  const violations: Finding[] = [];
  const allowedExceptions: Finding[] = [];
  const mainInternal: Finding[] = [];
  for (let j = 0; j < allFindings.length; j++) {
    const finding = allFindings[j];
    if (isInMain(finding.file)) mainInternal.push(finding);
    else if (isAllowlisted(finding.file)) allowedExceptions.push(finding);
    else violations.push(finding);
  }
  _logger.info('Total arquivos: ' + allFiles.length);
  _logger.info('Main (interno): ' + mainInternal.length);
  _logger.info('Exceções permitidas: ' + allowedExceptions.length);
  _logger.info('VIOLAÇÕES: ' + violations.length);
  return { violations, allowedExceptions, mainInternal, total: allFindings.length };
}

function info(): ModuleInfo { return { moduleId: MODULE_ID, version: VERSION }; }
function healthCheck(): HealthStatus { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

// CLI entry point
const isMain = typeof require !== 'undefined' && require.main === module;
if (isMain) { runAudit(); }

export { MODULE_ID, VERSION, runAudit, HARD_NAV_ALLOWLIST, PATTERNS, info, healthCheck };
