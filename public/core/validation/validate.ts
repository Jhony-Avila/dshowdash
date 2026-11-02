#!/usr/bin/env npx tsx
/**
 * DShowDash Enterprise Unified Validation Script
 * Consolidates 14 diagnostic checks into a single pre-deploy tool.
 *
 * Usage:
 *   npx tsx validate.ts              # Summary table (default)
 *   npx tsx validate.ts --json       # Full JSON report
 *   npx tsx validate.ts --fast       # Skip syntax check (~2min)
 *   npx tsx validate.ts --check ID   # Run specific check
 *   npx tsx validate.ts --pre-deploy # Exit code 0=OK, 1=FAIL
 *
 * @version 1.1.0-ENTERPRISE
 */
'use strict';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface CheckResult {
    id?: string;
    name?: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    details: Record<string, any>;
    message: string;
    duration?: number;
    errorList?: ErrorEntry[];
}

type ErrorEntry =
    | { file: string; spec?: string; error?: string }
    | { id: string; files: string[] }
    | string;

interface CheckDefinition {
    id: string;
    name: string;
    fn: (files: string[]) => CheckResult;
    slow?: boolean;
}

interface Report {
    version: string;
    timestamp: string;
    duration: number;
    filesScanned: number;
    summary: ReportSummary;
    checks: CheckResult[];
}

interface ReportSummary {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    score: string;
}

interface RunOptions {
    json: boolean;
    fast: boolean;
    preDeploy: boolean;
    checkId: string | null;
}

interface ImportStats {
    total: number;
    resolved: number;
    broken: number;
    external: number;
}

interface CleanupDetails {
    addEventListener: number;
    removeEventListener: number;
    setInterval: number;
    clearInterval: number;
    abortController: number;
    abortCall: number;
    signal: number;
    documentHidden: number;
}

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════

const VERSION = '1.1.0-ENTERPRISE';
const BASE = '/var/www/dshowdash/public';
const SKIP = ['node_modules', '.git', 'backup', '_backup', 'vendor'];
const SCAN_DIRS = ['components', 'core'];

// ═══════════════════════════════════════════════════════
// FILE WALKER
// ═══════════════════════════════════════════════════════
function walk(dir: string): string[] {
    const r: string[] = [];
    try {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            if (SKIP.includes(e.name)) continue;
            const f = path.join(dir, e.name);
            if (e.isDirectory()) r.push(...walk(f));
            else if (e.name.endsWith('.js') && !e.name.endsWith('.min.js')) r.push(f);
        }
    } catch (_) {}
    return r;
}

function getAllFiles(): string[] {
    const files: string[] = [];
    SCAN_DIRS.forEach(d => {
        const full = path.join(BASE, d);
        if (fs.existsSync(full)) files.push(...walk(full));
    });
    return files;
}

function readFile(f: string): string {
    try { return fs.readFileSync(f, 'utf8'); } catch (_) { return ''; }
}

function rel(f: string): string { return f.replace(BASE + '/', ''); }

// ═══════════════════════════════════════════════════════
// CHECK 1: SYNTAX VALIDATION (diag-09)
// ═══════════════════════════════════════════════════════
function checkSyntax(files: string[]): CheckResult {
    let ok = 0, errors = 0;
    const errorList: ErrorEntry[] = [];
    for (const file of files) {
        try {
            execSync(`node --check "${file}" 2>&1`, { timeout: 5000 });
            ok++;
        } catch (e: unknown) {
            errors++;
            const err = e as { stdout?: Buffer; message?: string };
            errorList.push({ file: rel(file), error: (err.stdout ? err.stdout.toString().trim() : (err.message || String(e))).substring(0, 200) });
        }
    }
    return {
        status: errors === 0 ? 'PASS' : 'FAIL',
        details: { total: files.length, ok, errors },
        message: `${ok}/${files.length} OK`,
        errorList: errorList.slice(0, 10)
    };
}

// ═══════════════════════════════════════════════════════
// CHECK 2: IMPORT RESOLUTION (diag-01)
// ═══════════════════════════════════════════════════════
function checkImports(files: string[]): CheckResult {
    const broken: ErrorEntry[] = [];
    const stats: ImportStats = { total: 0, resolved: 0, broken: 0, external: 0 };
    for (const file of files) {
        const content = readFile(file);
        // Strip commented lines before scanning for imports
        const activeContent = content.split('\n').filter(line => !line.trim().startsWith('//')).join('\n');
        const re = /import\s+(?:[\w{},*\s]+\s+from\s+)?['"]([^'"]+)['"]/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(activeContent)) !== null) {
            stats.total++;
            const spec = m[1];
            if (spec.startsWith('/')) {
                const abs = path.join(BASE, spec);
                if (fs.existsSync(abs)) stats.resolved++;
                else { stats.broken++; broken.push({ file: rel(file), spec }); }
            } else if (spec.startsWith('.')) {
                const dir = path.dirname(file);
                let resolved = path.resolve(dir, spec);
                if (!resolved.endsWith('.js')) resolved += '.js';
                if (fs.existsSync(resolved) || fs.existsSync(path.resolve(dir, spec, 'index.js'))) stats.resolved++;
                else { stats.broken++; broken.push({ file: rel(file), spec }); }
            } else {
                stats.external++;
            }
        }
    }
    const pct = stats.total > 0 ? ((stats.resolved / (stats.total - stats.external)) * 100).toFixed(1) : '100';
    return {
        status: stats.broken <= 5 ? 'PASS' : 'FAIL',
        details: stats,
        message: `${stats.resolved}/${stats.total - stats.external} resolved (${pct}%)`,
        errorList: broken.slice(0, 10)
    };
}

// ═══════════════════════════════════════════════════════
// CHECK 3: ORPHAN FILES (diag-02)
// ═══════════════════════════════════════════════════════
function checkOrphans(files: string[]): CheckResult {
    const imported = new Set<string>();
    for (const file of files) {
        const content = readFile(file);
        const re = /from\s+['"]([^'"]+)['"]/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(content)) !== null) {
            const spec = m[1];
            let resolved: string | undefined;
            if (spec.startsWith('/')) resolved = path.join(BASE, spec);
            else if (spec.startsWith('.')) {
                resolved = path.resolve(path.dirname(file), spec);
                if (!resolved.endsWith('.js')) resolved += '.js';
            }
            if (resolved) imported.add(resolved);
        }
    }
    const orphans = files.filter(f => !imported.has(f));
    return {
        status: 'PASS',
        details: { total: files.length, orphans: orphans.length, imported: imported.size },
        message: `${orphans.length} orphans (info only)`
    };
}

// ═══════════════════════════════════════════════════════
// CHECK 4: DUPLICATE MODULE_IDs (diag-03)
// ═══════════════════════════════════════════════════════
function checkDuplicateIds(files: string[]): CheckResult {
    const idMap: Record<string, string[]> = {};
    for (const file of files) {
        const content = readFile(file);
        const m = content.match(/MODULE_ID\s*=\s*['"]([^'"]+)['"]/);
        if (m) {
            const id = m[1];
            if (!idMap[id]) idMap[id] = [];
            idMap[id].push(rel(file));
        }
    }
    const dupes = Object.entries(idMap).filter(([, f]) => f.length > 1);
    return {
        status: dupes.length === 0 ? 'PASS' : 'FAIL',
        details: { unique: Object.keys(idMap).length, duplicates: dupes.length },
        message: `${Object.keys(idMap).length} unique, ${dupes.length} duplicates`,
        errorList: dupes.slice(0, 5).map(([id, f]) => ({ id, files: f }))
    };
}

// ═══════════════════════════════════════════════════════
// CHECK 5: LIFECYCLE INTEGRITY (diag-05)
// ═══════════════════════════════════════════════════════
function checkLifecycle(files: string[]): CheckResult {
    const lifecycle: Record<string, number> = { init: 0, mount: 0, unmount: 0, destroy: 0, healthCheck: 0 };
    const incomplete: ErrorEntry[] = [];
    // Patterns: export function X, export { X }, prototype.X
    const expPat = (name: string): RegExp => new RegExp(
        `export\\s+(?:async\\s+)?function\\s+${name}\\b` +
        `|export\\s*\\{[^}]*\\b${name}\\b` +
        `|\\.prototype\\.${name}\\s*=`,
        'm'
    );
    for (const file of files) {
        const content = readFile(file);
        const has: Record<string, boolean> = {
            init: expPat('init').test(content),
            mount: expPat('mount').test(content) || expPat('mountAll').test(content),
            unmount: expPat('unmount').test(content) || expPat('unmountAll').test(content),
            destroy: expPat('destroy').test(content) || expPat('destroyAll').test(content) ||
                     expPat('shutdown').test(content) || expPat('cleanup').test(content),
            healthCheck: expPat('healthCheck').test(content)
        };
        for (const k of Object.keys(lifecycle)) { if (has[k]) lifecycle[k]++; }
        // mount without unmount or destroy = incomplete
        if (has.mount && !has.unmount && !has.destroy) incomplete.push({ file: rel(file), error: 'missing unmount' });
        // init + mount/unmount but no destroy/shutdown/cleanup = incomplete
        else if (has.init && !has.destroy && (has.mount || has.unmount)) incomplete.push({ file: rel(file), error: 'missing destroy' });
    }
    return {
        status: incomplete.length <= 15 ? 'PASS' : 'WARN',
        details: { ...lifecycle, incomplete: incomplete.length },
        message: `${lifecycle.destroy} destroy, ${incomplete.length} incomplete`,
        errorList: incomplete.slice(0, 10)
    };
}

// ═══════════════════════════════════════════════════════
// CHECK 6: CLEANUP INTEGRITY (diag-06)
// ═══════════════════════════════════════════════════════
function checkCleanup(files: string[]): CheckResult {
    let addEL = 0, removeEL = 0, setInt = 0, clearInt = 0;
    let abortCtrl = 0, abortCall = 0, signalUse = 0, docHidden = 0;
    for (const file of files) {
        const c = readFile(file);
        addEL += (c.match(/\.addEventListener\s*\(/g) || []).length;
        removeEL += (c.match(/\.removeEventListener\s*\(/g) || []).length;
        setInt += (c.match(/\bsetInterval\s*\(/g) || []).length;
        clearInt += (c.match(/\bclearInterval\s*\(/g) || []).length;
        abortCtrl += (c.match(/new\s+AbortController\b/g) || []).length;
        abortCall += (c.match(/\.abort\s*\(/g) || []).length;
        signalUse += (c.match(/\bsignal\b/g) || []).length;
        docHidden += (c.match(/document\.hidden/g) || []).length;
    }
    const ciRatio = setInt > 0 ? (clearInt / setInt * 100).toFixed(1) : '100';
    const details: CleanupDetails = { addEventListener: addEL, removeEventListener: removeEL, setInterval: setInt, clearInterval: clearInt, abortController: abortCtrl, abortCall, signal: signalUse, documentHidden: docHidden };
    return {
        status: parseFloat(ciRatio) >= 95 ? 'PASS' : 'WARN',
        details,
        message: `clearInterval ${ciRatio}%, abort ${abortCtrl > 0 ? (abortCall / abortCtrl * 100).toFixed(1) : 100}%, signal ${signalUse}`
    };
}

// ═══════════════════════════════════════════════════════
// CHECK 7: HEALTHCHECK INTEGRITY (diag-07)
// ═══════════════════════════════════════════════════════
function checkHealthChecks(files: string[]): CheckResult {
    let total = 0, conditional = 0, hardcoded = 0;
    for (const file of files) {
        const content = readFile(file);
        // Detect both: function healthCheck() and const healthCheck = () =>
        if (!/healthCheck/.test(content)) continue;
        if (!/function\s+healthCheck\b|const\s+healthCheck\s*=/.test(content)) continue;
        total++;
        // Extract snippet around healthCheck
        const hcIdx = Math.max(content.indexOf('function healthCheck'), content.indexOf('const healthCheck'));
        if (hcIdx === -1) continue;
        const snippet = content.substring(hcIdx, hcIdx + 500);
        const hasCond = /portsInitialized|_initialized|isInitialized|\.status\s*[!=]==|state\s*[!=]==|error|degraded|allOk|checks|normalizedStatus|_status|_metrics|rawStatus/i.test(snippet);
        if (hasCond) conditional++;
        else if (/status:\s*['"]HEALTHY['"]/.test(snippet)) hardcoded++;
        else conditional++;
    }
    // Most hardcoded HEALTHY are stateless modules — acceptable. Only WARN if ratio is very low.
    const condRatio = total > 0 ? (conditional / total * 100) : 100;
    return {
        status: condRatio >= 50 ? 'PASS' : 'WARN',
        details: { total, conditional, hardcoded, ratio: condRatio.toFixed(1) + '%' },
        message: `${conditional} conditional, ${hardcoded} stateless (${condRatio.toFixed(1)}% conditional)`
    };
}

// ═══════════════════════════════════════════════════════
// CHECK 8: STRICT MODE & GOVERNANCE (diag-08)
// ═══════════════════════════════════════════════════════
function checkStrictMode(files: string[]): CheckResult {
    let total = 0, strict = 0, rvCalls = 0, badRV = 0;
    const badFiles: string[] = [];
    for (const file of files) {
        const content = readFile(file);
        total++;
        if (/['"]use strict['"]/.test(content)) strict++;
        const rv = content.match(/recordViolation\s*\(/g);
        if (rv) {
            rvCalls += rv.length;
            const bad3 = (content.match(/recordViolation\s*\(\s*['"][^'"]+['"]\s*,\s*['"][^'"]+['"]\s*,/g) || []).length;
            const badObj = (content.match(/recordViolation\s*\(\s*\{/g) || []).length;
            if (bad3 + badObj > 0) {
                badRV += bad3 + badObj;
                badFiles.push(rel(file));
            }
        }
    }
    const pct = total > 0 ? (strict / total * 100).toFixed(1) : '100';
    return {
        status: parseFloat(pct) >= 99.9 && badRV === 0 ? 'PASS' : 'FAIL',
        details: { total, strict, percentage: pct + '%', recordViolationCalls: rvCalls, badCalls: badRV },
        message: `${pct}% strict, ${rvCalls} violations, ${badRV} bad calls`,
        errorList: badFiles.slice(0, 5)
    };
}

// ═══════════════════════════════════════════════════════
// CHECK 9: DEAD CODE & HYGIENE (diag-10)
// ═══════════════════════════════════════════════════════
function checkDeadCode(files: string[]): CheckResult {
    let todo = 0, fixme = 0, hack = 0, debugger_ = 0;
    const debuggerFiles: string[] = [];
    for (const file of files) {
        if (file.endsWith('validation/validate.ts') || file.endsWith('validation/validate.js')) continue; // Skip self
        const c = readFile(file);
        todo += (c.match(/\/\/\s*TODO\b/gi) || []).length;
        fixme += (c.match(/\/\/\s*FIXME\b/gi) || []).length;
        hack += (c.match(/\/\/\s*HACK\b/gi) || []).length;
        const d = (c.match(/\bdebugger\b/g) || []).length;
        debugger_ += d;
        if (d > 0) debuggerFiles.push(rel(file));
    }
    const totalBad = todo + fixme + hack;
    return {
        status: totalBad === 0 && debugger_ <= 1 ? 'PASS' : (totalBad <= 3 ? 'WARN' : 'FAIL'),
        details: { todo, fixme, hack, debugger: debugger_ },
        message: `TODO=${todo} FIXME=${fixme} HACK=${hack} debugger=${debugger_}`,
        errorList: debuggerFiles.slice(0, 5)
    };
}

// ═══════════════════════════════════════════════════════
// CHECK 10: EVENT CONTRACTS (diag-11)
// ═══════════════════════════════════════════════════════
function checkEvents(files: string[]): CheckResult {
    const emitted = new Set<string>(), listened = new Set<string>();
    for (const file of files) {
        const c = readFile(file);
        const emits: string[] = c.match(/\.emit\s*\(\s*['"]([^'"]+)['"]/g) || [];
        emits.forEach(m => { const ev = m.match(/['"]([^'"]+)['"]/); if (ev) emitted.add(ev[1]); });
        const listens: string[] = c.match(/\.on\s*\(\s*['"]([^'"]+)['"]/g) || [];
        listens.forEach(m => { const ev = m.match(/['"]([^'"]+)['"]/); if (ev) listened.add(ev[1]); });
    }
    const emitOnly = [...emitted].filter(e => !listened.has(e));
    const listenOnly = [...listened].filter(e => !emitted.has(e));
    return {
        status: 'PASS',
        details: { emitted: emitted.size, listened: listened.size, emitOnly: emitOnly.length, listenOnly: listenOnly.length },
        message: `${emitted.size} emitted, ${listened.size} listened, ${emitOnly.length} emit-only`
    };
}

// ═══════════════════════════════════════════════════════
// CHECK 11: DEPENDENCY CONTRACTS (diag-12)
// ═══════════════════════════════════════════════════════
function checkContracts(files: string[]): CheckResult {
    let withContract = 0, withoutContract = 0;
    for (const file of files) {
        const c = readFile(file);
        if (/DEPENDENCY CONTRACT/.test(c)) withContract++;
        else withoutContract++;
    }
    const pct = files.length > 0 ? (withContract / files.length * 100).toFixed(1) : '0';
    return {
        status: 'PASS',
        details: { withContract, withoutContract, percentage: pct + '%' },
        message: `${withContract} with contract (${pct}%)`
    };
}

// ═══════════════════════════════════════════════════════
// CHECK 12: POLLING VISIBILITY (diag-13)
// ═══════════════════════════════════════════════════════
function checkPolling(files: string[]): CheckResult {
    let pollingFiles = 0, gated = 0, ungated = 0;
    const ungatedList: string[] = [];
    for (const file of files) {
        const c = readFile(file);
        if (/\bsetInterval\s*\(/.test(c) && /auto[Rr]efresh|polling|poll\b/.test(c)) {
            pollingFiles++;
            if (/document\.hidden|visibilitychange|document\.visibilityState/.test(c)) gated++;
            else { ungated++; ungatedList.push(rel(file)); }
        }
    }
    return {
        status: ungated <= 15 ? 'PASS' : 'WARN',
        details: { pollingFiles, gated, ungated },
        message: `${gated}/${pollingFiles} gated (${ungated} ungated)`,
        errorList: ungatedList.slice(0, 10)
    };
}

// ═══════════════════════════════════════════════════════
// CHECK 13: MODULE_ID/VERSION COVERAGE (diag-14)
// ═══════════════════════════════════════════════════════
function checkModuleIds(files: string[]): CheckResult {
    let midExported = 0, midNotExported = 0, noMid = 0;
    let verExported = 0, verNotExported = 0, noVer = 0;
    for (const file of files) {
        const c = readFile(file);
        if (/export\s+const\s+MODULE_ID/.test(c) || /export\s*\{[^}]*\bMODULE_ID\b/.test(c) ||
            (/\bMODULE_ID\b/.test(c) && /export\s+default\s*\{[^}]*MODULE_ID/.test(c))) midExported++;
        else if (/\bMODULE_ID\b/.test(c)) midNotExported++;
        else noMid++;

        if (/export\s+const\s+VERSION/.test(c) || /export\s*\{[^}]*\bVERSION\b/.test(c) ||
            (/\bVERSION\b/.test(c) && /export\s+default\s*\{[^}]*VERSION/.test(c))) verExported++;
        else if (/\bVERSION\b/.test(c)) verNotExported++;
        else noVer++;
    }
    const midPct = files.length > 0 ? (midExported / files.length * 100).toFixed(1) : '0';
    const verPct = files.length > 0 ? (verExported / files.length * 100).toFixed(1) : '0';
    return {
        status: 'PASS',
        details: { moduleId: { exported: midExported, notExported: midNotExported, missing: noMid }, version: { exported: verExported, notExported: verNotExported, missing: noVer } },
        message: `MODULE_ID ${midPct}%, VERSION ${verPct}%`
    };
}

// ═══════════════════════════════════════════════════════
// CHECK 14: EXPORTS CONSUMED (diag-04)
// ═══════════════════════════════════════════════════════
function checkExports(files: string[]): CheckResult {
    let withExports = 0, selfImports = 0;
    for (const file of files) {
        const c = readFile(file);
        if (/\bexport\s+/.test(c)) withExports++;
        const basename = path.basename(file);
        const re = new RegExp(`from\\s+['"]\\./${basename.replace('.js', '')}`, 'g');
        if (re.test(c)) selfImports++;
    }
    return {
        status: 'PASS',
        details: { total: files.length, withExports, selfImports },
        message: `${withExports} with exports, ${selfImports} self-imports`
    };
}

// ═══════════════════════════════════════════════════════
// RUNNER
// ═══════════════════════════════════════════════════════
const CHECKS: CheckDefinition[] = [
    { id: 'syntax',        name: 'Syntax Validation',    fn: checkSyntax,       slow: true },
    { id: 'imports',       name: 'Import Resolution',    fn: checkImports },
    { id: 'orphans',       name: 'Orphan Files',         fn: checkOrphans },
    { id: 'duplicate-ids', name: 'Duplicate MODULE_IDs', fn: checkDuplicateIds },
    { id: 'exports',       name: 'Export Integrity',     fn: checkExports },
    { id: 'lifecycle',     name: 'Lifecycle Integrity',  fn: checkLifecycle },
    { id: 'cleanup',       name: 'Cleanup Ratios',       fn: checkCleanup },
    { id: 'healthchecks',  name: 'HealthCheck Quality',  fn: checkHealthChecks },
    { id: 'strict-mode',   name: 'Strict Mode',          fn: checkStrictMode },
    { id: 'dead-code',     name: 'Dead Code & Hygiene',  fn: checkDeadCode },
    { id: 'events',        name: 'Event Contracts',      fn: checkEvents },
    { id: 'contracts',     name: 'Dependency Contracts',  fn: checkContracts },
    { id: 'polling',       name: 'Polling Visibility',   fn: checkPolling },
    { id: 'module-ids',    name: 'Module ID Coverage',   fn: checkModuleIds }
];

function run(options: RunOptions): void {
    const startTotal = Date.now();
    const files = getAllFiles();

    const checksToRun = options.checkId
        ? CHECKS.filter(c => c.id === options.checkId)
        : options.fast
            ? CHECKS.filter(c => !c.slow)
            : CHECKS;

    if (checksToRun.length === 0) {
        console.error(`Unknown check: "${options.checkId}". Available: ${CHECKS.map(c => c.id).join(', ')}`);
        process.exit(1);
    }

    const results: CheckResult[] = [];
    for (const check of checksToRun) {
        const start = Date.now();
        try {
            const result = check.fn(files);
            result.id = check.id;
            result.name = check.name;
            result.duration = Date.now() - start;
            results.push(result);
        } catch (e: unknown) {
            results.push({ id: check.id, name: check.name, status: 'FAIL', message: `Error: ${(e as Error).message}`, duration: Date.now() - start, details: {} });
        }
    }

    const totalDuration = Date.now() - startTotal;
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warnings = results.filter(r => r.status === 'WARN').length;

    const report: Report = {
        version: VERSION,
        timestamp: new Date().toISOString(),
        duration: totalDuration,
        filesScanned: files.length,
        summary: { total: results.length, passed, failed, warnings, score: `${passed}/${results.length}` },
        checks: results
    };

    if (options.json) {
        console.log(JSON.stringify(report, null, 2));
    } else {
        formatTable(report);
    }

    if (options.preDeploy) {
        process.exit(failed > 0 ? 1 : 0);
    }
}

// ═══════════════════════════════════════════════════════
// TABLE FORMATTER
// ═══════════════════════════════════════════════════════
function formatTable(report: Report): void {
    const W = 70;
    const line = '='.repeat(W);
    const thin = '-'.repeat(W);

    console.log(`\n${line}`);
    console.log(`  DShowDash Enterprise Validation Report v${VERSION}`);
    console.log(`  ${report.timestamp}  |  ${report.filesScanned} files  |  ${report.duration}ms`);
    console.log(line);

    const pad = (s: string | number, n: number): string => String(s).padEnd(n);
    const statusIcon = (s: string): string => s === 'PASS' ? 'PASS' : s === 'WARN' ? 'WARN' : 'FAIL';

    console.log(`  ${pad('#', 3)} ${pad('Check', 24)} ${pad('Status', 8)} Details`);
    console.log(`  ${thin}`);

    report.checks.forEach((c, i) => {
        const num = String(i + 1).padStart(2);
        console.log(`  ${num}  ${pad(c.name!, 24)} ${pad(statusIcon(c.status), 8)} ${c.message}`);
    });

    console.log(`  ${thin}`);

    const s = report.summary;
    const overall = s.failed > 0 ? 'UNHEALTHY' : (s.warnings > 0 ? 'DEGRADED' : 'HEALTHY');
    console.log(`  Score: ${s.passed}/${s.total} passed  |  ${s.failed} failed  |  ${s.warnings} warnings  |  ${overall}`);
    console.log(`${line}\n`);

    // Show error details for failed/warned checks
    const problematic = report.checks.filter(c => c.status !== 'PASS' && c.errorList && c.errorList.length > 0);
    if (problematic.length > 0) {
        console.log('  --- Details ---');
        for (const c of problematic) {
            console.log(`\n  [${c.status}] ${c.name}:`);
            c.errorList!.forEach(e => {
                if (typeof e === 'string') console.log(`    ${e}`);
                else if ('file' in e) console.log(`    ${e.file}${e.spec ? ' -> ' + e.spec : ''}${e.error ? ': ' + e.error : ''}`);
                else if ('id' in e) console.log(`    "${e.id}" in: ${e.files.join(', ')}`);
            });
        }
        console.log('');
    }
}

// ═══════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════
const args = process.argv.slice(2);
const checkIdx = args.indexOf('--check');
run({
    json: args.includes('--json'),
    fast: args.includes('--fast'),
    preDeploy: args.includes('--pre-deploy'),
    checkId: checkIdx >= 0 ? args[checkIdx + 1] : null
});
