<?php
// Script de Geração do Manifest Estático - Data-Driven Enterprise
// @version 1.1.0-COMPACT-FORMAT
// @description Gera manifest-generated.js a partir do banco de dados
// @changelog v1.1.0-COMPACT-FORMAT - Output compacto: 1 linha por entry (reduz ~70% do tamanho do arquivo)
// @changelog v1.0.1-ENTERPRISE-ES6 - Migração var→const/let no template JS
// 
// Uso:
//   php /var/www/dshowdash/scripts/generate-orchestrator-manifest.php
//   
// Cron (a cada 5 minutos):
//   0,5,10,15,20,25,30,35,40,45,50,55 * * * * php /var/www/dshowdash/scripts/generate-orchestrator-manifest.php

define('OUTPUT_PATH', '/var/www/dshowdash/public/core/ui-orchestrator/registry/manifest-generated.js');
define('BACKUP_PATH', '/backup/manifest-generated.js.bak_' . date('Ymd_His'));

require_once '/var/www/dshowdash/config/db_connection.php';

function log_msg($msg) {
    echo "[" . date('Y-m-d H:i:s') . "] " . $msg . "\n";
}

/**
 * Formata um array associativo como JSON compacto — 1 linha por entry
 * Ex: { "key1": {"label": "Foo", "icon": "bar"},\n  "key2": {"label": "Baz"} }
 */
function compactJson($data) {
    if (empty($data)) return '{}';

    // Arrays sequenciais (rules) — 1 linha por item
    if (array_keys($data) === range(0, count($data) - 1)) {
        $lines = [];
        foreach ($data as $item) {
            $lines[] = '    ' . json_encode($item, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
        return "[\n" . implode(",\n", $lines) . "\n]";
    }

    // Arrays associativos (intents, panels, routes, triggers) — 1 linha por entry
    $lines = [];
    foreach ($data as $key => $value) {
        if (is_array($value)) {
            $lines[] = '    ' . json_encode($key) . ': ' . json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } else {
            // Triggers: key → string value
            $lines[] = '    ' . json_encode($key) . ': ' . json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }
    return "{\n" . implode(",\n", $lines) . "\n}";
}

function fetchData($pdo) {
    $data = ['intents' => [], 'panels' => [], 'routes' => [], 'rules' => [], 'triggers' => []];
    
    // PANELS
    $stmt = $pdo->query("
        SELECT panel_id, module_name, title, description, category, icon, is_active, sort_order
        FROM panel_registry WHERE is_active = 1 ORDER BY sort_order, panel_id
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $data['panels'][$row['panel_id']] = [
            'id' => $row['panel_id'],
            'path' => '/components/panels/' . $row['panel_id'] . '/index.js',
            'regions' => ['main'],
            'requiresAuth' => true,
            'minLevel' => 0,
            'preload' => false
        ];
    }
    
    // ROUTES
    $stmt = $pdo->query("
        SELECT r.route_clean, r.route_hash, r.description, d.destination_key as panel, rev.layout, rev.min_level
        FROM app_nav_route r
        JOIN app_nav_route_resolution_active a ON r.route_id = a.route_id
        JOIN app_nav_route_resolution_revision rev ON a.resolution_rev_id = rev.resolution_rev_id
        JOIN app_nav_destination d ON rev.destination_id = d.destination_id
        WHERE r.is_active = 1 ORDER BY r.route_id
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $routeId = $row['route_clean'] === '/' ? 'home' : str_replace('/', '-', trim($row['route_clean'], '/'));
        $data['routes'][$routeId] = [
            'id' => $routeId,
            'path' => $row['route_hash'],
            'panel' => $row['panel'],
            'region' => 'main',
            'minLevel' => (int)$row['min_level'],
            'addressable' => true
        ];
    }
    
    // RULES
    $stmt = $pdo->query("
        SELECT rule_key, intent_id, action_type, target, region, priority, conditions
        FROM ui_resolution_rules WHERE is_active = 1 ORDER BY priority DESC, id
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $data['rules'][] = [
            'id' => $row['rule_key'],
            'intent' => $row['intent_id'],
            'action' => $row['action_type'],
            'target' => $row['target'],
            'region' => $row['region'],
            'priority' => (int)$row['priority']
        ];
    }
    
    // TRIGGERS
    $stmt = $pdo->query("SELECT trigger_key, intent_id FROM ui_triggers WHERE is_active = 1 ORDER BY component, order_index");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $data['triggers'][$row['trigger_key']] = $row['intent_id'];
    }
    
    // INTENTS
    $stmt = $pdo->query("
        SELECT DISTINCT intent_id, label, icon, tooltip FROM ui_nav_items WHERE intent_id IS NOT NULL AND intent_id != ''
        UNION
        SELECT DISTINCT intent_id, label, icon_name as icon, NULL as tooltip FROM ui_triggers WHERE intent_id IS NOT NULL AND intent_id != ''
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if ($row['intent_id'] && !isset($data['intents'][$row['intent_id']])) {
            $data['intents'][$row['intent_id']] = [
                'label' => $row['label'] ?? $row['intent_id'],
                'icon' => $row['icon'] ?? 'circle'
            ];
        }
    }
    
    return $data;
}

function generateJS($data, $hash, $timestamp) {
    $intentsJson = compactJson($data['intents']);
    $panelsJson = compactJson($data['panels']);
    $routesJson = compactJson($data['routes']);
    $rulesJson = compactJson($data['rules']);
    $triggersJson = compactJson($data['triggers']);
    
    $js = <<<JAVASCRIPT
// UI Orchestrator - Generated Manifest (Data-Driven)
// @generated {$timestamp}
// @hash {$hash}
// @source database
// DO NOT EDIT - This file is auto-generated from the database
'use strict';

import { REGIONS, ACTION_TYPES, PRIORITIES } from '../core/contracts.js';

export const VERSION = '1.1.0-GENERATED-COMPACT';
export const MODULE_ID = 'ui-orchestrator-manifest-generated';
export const GENERATED_AT = '{$timestamp}';
export const MANIFEST_HASH = '{$hash}';

export const INTENT_REGISTRY = Object.freeze({$intentsJson});

export const PANELS = Object.freeze({$panelsJson});

export const ROUTES = Object.freeze({$routesJson});

export const RULES = Object.freeze({$rulesJson});

export const TRIGGERS = Object.freeze({$triggersJson});

// Helper functions
export function getIntent(intentId) { return INTENT_REGISTRY[intentId] || null; }
export function getPanel(panelId) { return PANELS[panelId] || null; }
export function getRoute(routeId) { return ROUTES[routeId] || null; }
export function getRuleByIntent(intentId) { for (let i = 0; i < RULES.length; i++) { if (RULES[i].intent === intentId) return RULES[i]; } return null; }
export function getTriggerIntent(triggerId) { return TRIGGERS[triggerId] || null; }
export function getRouteByPath(path) { const keys = Object.keys(ROUTES); for (let i = 0; i < keys.length; i++) { if (ROUTES[keys[i]].path === path) return ROUTES[keys[i]]; } return null; }
export function getPanelsByRegion(region) { const result = []; const keys = Object.keys(PANELS); for (let i = 0; i < keys.length; i++) { if (PANELS[keys[i]].regions && PANELS[keys[i]].regions.indexOf(region) >= 0) result.push(PANELS[keys[i]]); } return result; }

export function getManifestInfo() {
    return {
        version: VERSION,
        moduleId: MODULE_ID,
        generatedAt: GENERATED_AT,
        hash: MANIFEST_HASH,
        source: 'database',
        intents: Object.keys(INTENT_REGISTRY).length,
        panels: Object.keys(PANELS).length,
        routes: Object.keys(ROUTES).length,
        rules: RULES.length,
        triggers: Object.keys(TRIGGERS).length
    };
}

export function info() { return getManifestInfo(); }

export function healthCheck() {
    return {
        status: 'HEALTHY',
        moduleId: MODULE_ID,
        version: VERSION,
        hash: MANIFEST_HASH,
        source: 'database-generated',
        checks: {
            intentsReady: Object.keys(INTENT_REGISTRY).length > 0,
            panelsReady: Object.keys(PANELS).length > 0,
            routesReady: Object.keys(ROUTES).length > 0,
            rulesReady: RULES.length > 0,
            triggersReady: Object.keys(TRIGGERS).length > 0
        }
    };
}

export default Object.freeze({
    VERSION, MODULE_ID, GENERATED_AT, MANIFEST_HASH,
    INTENT_REGISTRY, PANELS, ROUTES, RULES, TRIGGERS,
    getIntent, getPanel, getRoute, getRuleByIntent, getTriggerIntent, getRouteByPath, getPanelsByRegion,
    getManifestInfo, info, healthCheck
});
JAVASCRIPT;
    
    return $js;
}

// Main execution
try {
    log_msg("Starting manifest generation...");
    
    $pdo = getDbConnection('DSHOWDASH');
    log_msg("Database connected");
    
    $data = fetchData($pdo);
    log_msg("Data fetched: " . count($data['routes']) . " routes, " . count($data['panels']) . " panels, " . count($data['rules']) . " rules");
    
    $timestamp = date('c');
    $hash = substr(hash('sha256', json_encode($data) . $timestamp), 0, 16);
    
    $js = generateJS($data, $hash, $timestamp);
    log_msg("JavaScript generated (" . strlen($js) . " bytes)");
    
    // Backup existing file
    if (file_exists(OUTPUT_PATH)) {
        copy(OUTPUT_PATH, BACKUP_PATH);
        log_msg("Backup created: " . BACKUP_PATH);

        // Retention: manter apenas os 24 backups mais recentes (2h de historico)
        $old_backups = glob("/backup/manifest-generated.js.bak_*");
        if (count($old_backups) > 24) {
            usort($old_backups, function($a, $b) { return filemtime($a) - filemtime($b); });
            $to_delete = array_slice($old_backups, 0, count($old_backups) - 24);
            foreach ($to_delete as $old_f) { @unlink($old_f); }
            log_msg("Retention: removidos " . count($to_delete) . " backups antigos");
        }
    }
    
    // Write new file
    file_put_contents(OUTPUT_PATH, $js);
    chown(OUTPUT_PATH, 'www-data');
    chgrp(OUTPUT_PATH, 'www-data');
    log_msg("Manifest written to: " . OUTPUT_PATH);
    
    // Invalidate Redis cache
    try {
        require_once '/var/www/dshowdash/config/redis.php';
        $redis = RedisConfig::createConnection();
        if ($redis) {
            $redis->del('ui:orchestrator:manifest:0');
            $redis->del('ui:orchestrator:version');
            $redis->close();
            log_msg("Redis cache invalidated");
        } else {
            log_msg("Redis cache invalidation skipped: connection failed");
        }
    } catch (Exception $e) {
        log_msg("Redis cache invalidation failed: " . $e->getMessage());
    }
    
    log_msg("SUCCESS - Manifest generated with hash: " . $hash);
    exit(0);
    
} catch (Exception $e) {
    log_msg("ERROR: " . $e->getMessage());
    exit(1);
}
