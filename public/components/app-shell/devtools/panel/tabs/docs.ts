// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: devtools/panel/tabs/docs
// PURPOSE: Tab de documentação do Debug Panel
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   icon, sanitizeAttr, getAppShell, makeSectionHtml from ../helpers.js
// EXPORTS:
//   renderDocsTab — Renderiza tab de documentação
// ═══════════════════════════════════════════════════════════════
/**
 * @module DevToolsPanelTabsDocs
 * @description Tab de documentação
 * @version 2.0.0-AAA-ES6
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'app-shell.devtools.panel.tabs.docs';

import { icon, sanitizeAttr, getAppShell, makeSectionHtml } from '../helpers.js';


function _renderAppShellAPIs(shell: DynObj) {
    if (!shell) return '';
    try {
        const sections = [
            { id: 'overview', title: 'Overview', icon: 'overview', apis: [
                { name: 'AppShell.version', desc: 'Current version' },
                { name: 'AppShell.info()', desc: 'Full module info' },
                { name: 'AppShell.healthCheck()', desc: 'Health status' }
            ]},
            { id: 'regions', title: 'Regions', icon: 'regions', apis: [
                { name: 'region(name)', desc: 'Get region by name' },
                { name: 'visibility.show(r)', desc: 'Show region' },
                { name: 'visibility.hide(r)', desc: 'Hide region' },
                { name: 'resize.setSize(r, px)', desc: 'Set size' }
            ]},
            { id: 'theme', title: 'Theme', icon: 'sun', apis: [
                { name: 'theme.getTheme()', desc: 'Current theme' },
                { name: 'theme.setTheme(t)', desc: 'Set theme' },
                { name: 'theme.toggleTheme()', desc: 'Toggle theme' }
            ]},
            { id: 'devtools', title: 'DevTools', icon: 'terminal', apis: [
                { name: 'debugPanel.open()', desc: 'Open panel' },
                { name: 'stateSnapshots.capture(l)', desc: 'Capture state' },
                { name: 'debugPresets.apply(p)', desc: 'Apply preset' },
                { name: 'regionMetrics.getAllMetrics()', desc: 'All metrics' }
            ]}
        ];
        return sections.map(section => {
            const apisHtml = section.apis.map(api => `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label" style="font-family:var(--ui-font-mono)">${sanitizeAttr(api.name)}</span><span class="dsd-ui-list-item__value">${sanitizeAttr(api.desc)}</span></div>`).join('');
            return makeSectionHtml(`docs-shell-${section.id}`, section.icon, `AppShell: ${section.title}`, `<div class="dsd-ui-list">${apisHtml}</div>`, true);
        }).join('');
    } catch (e) { return ''; }
}

export function renderDocsTab() {
    const shell = getAppShell();

    return makeSectionHtml('docs-shortcuts', 'keyboard', 'Keyboard Shortcuts',
        '<div class="dsd-ui-list">' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>Alt+F12</kbd></span><span class="dsd-ui-list-item__value">Toggle Debug Panel</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>Escape</kbd></span><span class="dsd-ui-list-item__value">Close panel</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>Alt+1</kbd> - <kbd>Alt+0</kbd></span><span class="dsd-ui-list-item__value">Jump to tab 1-10</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>\u2190</kbd> <kbd>\u2192</kbd></span><span class="dsd-ui-list-item__value">Navigate tabs</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>R</kbd></span><span class="dsd-ui-list-item__value">Force refresh data</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>F</kbd></span><span class="dsd-ui-list-item__value">Focus search field</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>C</kbd></span><span class="dsd-ui-list-item__value">Copy tab data to clipboard</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>P</kbd></span><span class="dsd-ui-list-item__value">Pin/unpin current tab</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><kbd>T</kbd></span><span class="dsd-ui-list-item__value">Toggle dark/light theme</span></div>' +
        '</div>') +

    makeSectionHtml('docs-api', 'api', 'Public API Reference',
        '<div class="dsd-ui-list">' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>init()</code></span><span class="dsd-ui-list-item__value">Initialize panel. Auto-called on DOMContentLoaded.</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>open(tab?)</code></span><span class="dsd-ui-list-item__value">Open panel. Respects pinned tab if set.</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>close()</code></span><span class="dsd-ui-list-item__value">Close panel, stop auto-refresh.</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>toggle()</code></span><span class="dsd-ui-list-item__value">Toggle panel open/closed.</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>isOpen()</code></span><span class="dsd-ui-list-item__value">Returns boolean.</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>setActiveTab(id)</code></span><span class="dsd-ui-list-item__value">Switch to tab by id.</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>refresh()</code></span><span class="dsd-ui-list-item__value">Force re-render bypassing rate limit.</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>exportDiagnostic()</code></span><span class="dsd-ui-list-item__value">Export JSON diagnostic file.</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>healthCheck()</code></span><span class="dsd-ui-list-item__value">Returns status, score, checks, metrics, history.</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>info()</code></span><span class="dsd-ui-list-item__value">Module metadata, features, architecture.</span></div>' +
        '</div>') +

    makeSectionHtml('docs-tabs', 'overview', 'Tab Descriptions',
        `<div class="dsd-ui-list"><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${icon('overview', 14)} Overview</span><span class="dsd-ui-list-item__value">Shell health, capabilities, adapters, history.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${icon('zap', 14)} Bootstrap</span><span class="dsd-ui-list-item__value">Bootstrap-v2 status, network, lazy loading, OTel.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${icon('regions', 14)} Regions</span><span class="dsd-ui-list-item__value">Region health, visibility, sizes.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${icon('events', 14)} Events</span><span class="dsd-ui-list-item__value">Event system metrics and history.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${icon('wifi', 14)} Network</span><span class="dsd-ui-list-item__value">Intercepted fetch/XHR requests, status, duration.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${icon('performance', 14)} Performance</span><span class="dsd-ui-list-item__value">Boot timing, memory, render metrics.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${icon('state', 14)} State</span><span class="dsd-ui-list-item__value">Shell state, theme, layout prefs.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${icon('snapshots', 14)} Snapshots</span><span class="dsd-ui-list-item__value">Capture, restore, auto-snapshot.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${icon('metrics', 14)} Metrics</span><span class="dsd-ui-list-item__value">Per-region render metrics.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${icon('presets', 14)} Presets</span><span class="dsd-ui-list-item__value">Debug preset configurations.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${icon('api', 14)} APIs</span><span class="dsd-ui-list-item__value">API usage tracking and errors.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${icon('memory', 14)} Memory</span><span class="dsd-ui-list-item__value">Leak detection, heap analysis.</span></div><div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${icon('docs', 14)} Docs</span><span class="dsd-ui-list-item__value">This page. Shortcuts, API, features.</span></div></div>`) +

    makeSectionHtml('docs-console', 'terminal', 'Console Quick Access',
        '<div class="dsd-ui-list">' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>DSD.debugPanel.open()</code></span><span class="dsd-ui-list-item__value">Open panel</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>DSD.debugPanel.healthCheck()</code></span><span class="dsd-ui-list-item__value">Health status</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>DSD.debugPanel.exportDiagnostic()</code></span><span class="dsd-ui-list-item__value">Export JSON</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>DSD.debugPanel.info()</code></span><span class="dsd-ui-list-item__value">Module info</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>AppShell.healthCheck()</code></span><span class="dsd-ui-list-item__value">Shell health</span></div>' +
            '<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label"><code>BootstrapV2.healthCheck()</code></span><span class="dsd-ui-list-item__value">Bootstrap health</span></div>' +
        '</div>', true) +

    _renderAppShellAPIs(shell);
}

export default { renderDocsTab };
