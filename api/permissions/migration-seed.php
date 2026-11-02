<?php
// UARPS Migration Seed Script
// @version 1.3.0-ENTERPRISE
// @description Migra roles/level para UARPS e cria permissões default
// @updated 2026-01-21
// Uso: php migration-seed.php [--dry-run] [--verbose]
//
// v1.3.0: P0.1 FIX - Bloqueio de execução via web (somente CLI)
// v1.2.0: P0.1 FIX - Removidas credenciais hardcoded, usa db_connection.php

// SECURITY: Bloquear execução via web
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'error' => 'CLI only']);
    exit(1);
}

error_reporting(E_ALL);
ini_set('display_errors', 1);

define('VERSION', '1.2.0-ENTERPRISE');

// P0.1 FIX: Usa conexão centralizada
require_once __DIR__ . '/../../config/db_connection.php';

try {
    $pdo = getConnection('DSHOWDASH');
} catch (Exception $e) {
    // FIX: Log detalhado para arquivo, mensagem genérica para stdout
    error_log("migration-seed.php DB Error: " . $e->getMessage());
    die("Database connection failed. Verifique os logs para detalhes.\n");
}

// Argumentos
$dryRun = in_array('--dry-run', $argv ?? []);
$verbose = in_array('--verbose', $argv ?? []);

function logMsg($msg, $type = 'info') {
    global $verbose;
    $prefix = match($type) {
        'error' => '[ERROR]',
        'success' => '[OK]',
        'warning' => '[WARN]',
        'skip' => '[SKIP]',
        default => '[INFO]'
    };
    if ($verbose || $type !== 'info') {
        fwrite(STDOUT, "$prefix $msg\n");
    }
}

// Triggers críticos por nível mínimo
$LEVEL_TRIGGERS = [
    100 => [
        'trigger:navrail:admin-settings',
        'trigger:footer:security',
        'trigger:panel:permissions-admin',
        'trigger:panel:orchestrator',
        'trigger:panel:enterprise',
        'trigger:panel:nav-admin',
        'trigger:panel:panel-19'
    ],
    90 => [
        'trigger:navrail:admin-users',
        'trigger:footer:database',
        'trigger:footer:server',
        'trigger:navrail:database',
        'trigger:navrail:api',
        'trigger:navrail:code',
        'trigger:panel:user-management',
        'trigger:panel:feature-flags-admin',
        'trigger:panel:health-dashboard',
        'trigger:panel:panel-17',
        'trigger:panel:panel-18'
    ],
    70 => [
        'trigger:panel:session-admin',
        'trigger:panel:audit-trail'
    ],
    60 => [
        'trigger:panel:panel-15',
        'trigger:panel:panel-16'
    ],
    50 => [
        'trigger:navrail:analytics',
        'trigger:navrail:comercial',
        'trigger:navrail:financeiro'
    ],
    20 => [
        'trigger:footer:logout',
        'trigger:footer:settings',
        'trigger:footer:language',
        'trigger:navrail:home',
        'trigger:navrail:dashboard',
        'trigger:navrail:clientes',
        'trigger:sidebar:home',
        'trigger:sidebar:dashboard',
        'trigger:panel:cards',
        'trigger:panel:dashboard',
        'trigger:panel:user-preferences'
    ]
];

$LEVEL_REGIONS = [
    100 => [
        'region:panel:permissions-admin',
        'region:panel:orchestrator',
        'region:panel:enterprise',
        'region:panel:nav-admin'
    ],
    90 => [
        'region:panel:user-management',
        'region:panel:feature-flags-admin',
        'region:panel:health-dashboard'
    ],
    70 => [
        'region:panel:session-admin',
        'region:panel:audit-trail'
    ],
    20 => [
        'region:app:header',
        'region:app:sidebar',
        'region:app:footer',
        'region:app:main',
        'region:panel:cards',
        'region:panel:dashboard',
        'region:panel:user-preferences'
    ]
];

function getUsersWithRoles($pdo) {
    $stmt = $pdo->prepare("
        SELECT 
            u.id, 
            u.username, 
            u.email,
            COALESCE(MAX(r.level), 0) as max_level,
            GROUP_CONCAT(r.role_key) as roles
        FROM app_users u 
        LEFT JOIN app_user_roles ur ON u.id = ur.user_id AND ur.deleted_at IS NULL
        LEFT JOIN app_roles r ON ur.role_id = r.id AND r.deleted_at IS NULL
        WHERE u.deleted_at IS NULL
        GROUP BY u.id, u.username, u.email
        ORDER BY max_level DESC
    ");
    $stmt->execute();
    return $stmt->fetchAll();
}

function grantTrigger($pdo, $userId, $triggerId, $dryRun) {
    if ($dryRun) {
        logMsg("  [DRY-RUN] Would grant trigger: $triggerId to user $userId", 'info');
        return true;
    }
    
    $stmt = $pdo->prepare("SELECT id FROM app_user_trigger_permissions WHERE user_id = ? AND trigger_id = ? AND deleted_at IS NULL");
    $stmt->execute([$userId, $triggerId]);
    if ($stmt->fetch()) {
        logMsg("  Skip trigger (already exists): $triggerId", 'skip');
        return false;
    }
    
    $stmt = $pdo->prepare("INSERT INTO app_user_trigger_permissions (user_id, trigger_id, state, granted_at, granted_by, reason, created_at, ip_user) VALUES (?, ?, 'allow', NOW(3), 1, 'Migration from roles/level', NOW(3), '127.0.0.1')");
    $stmt->execute([$userId, $triggerId]);
    
    logMsg("  Granted trigger: $triggerId", 'success');
    return true;
}

function grantRegion($pdo, $userId, $regionId, $dryRun) {
    if ($dryRun) {
        logMsg("  [DRY-RUN] Would grant region: $regionId to user $userId", 'info');
        return true;
    }
    
    $stmt = $pdo->prepare("SELECT id FROM app_user_region_permissions WHERE user_id = ? AND region_id = ? AND deleted_at IS NULL");
    $stmt->execute([$userId, $regionId]);
    if ($stmt->fetch()) {
        logMsg("  Skip region (already exists): $regionId", 'skip');
        return false;
    }
    
    $stmt = $pdo->prepare("INSERT INTO app_user_region_permissions (user_id, region_id, state, granted_at, granted_by, reason, created_at, ip_user) VALUES (?, ?, 'allow', NOW(3), 1, 'Migration from roles/level', NOW(3), '127.0.0.1')");
    $stmt->execute([$userId, $regionId]);
    
    logMsg("  Granted region: $regionId", 'success');
    return true;
}

function auditMigration($pdo, $userId, $entityType, $entityId, $dryRun) {
    if ($dryRun) return;
    
    $stmt = $pdo->prepare("INSERT INTO app_uarps_audit_log (user_id, action, entity_type, entity_id, target_user_id, old_state, new_state, reason, ip_address, created_at) VALUES (1, 'migration_seed', ?, ?, ?, NULL, 'allow', 'Migration from roles/level system', '127.0.0.1', NOW(3))");
    $stmt->execute([$entityType, $entityId, $userId]);
}

fwrite(STDOUT, "\n");
fwrite(STDOUT, "================================================================\n");
fwrite(STDOUT, "    UARPS Migration Seed Script v" . VERSION . "\n");
fwrite(STDOUT, "================================================================\n");
fwrite(STDOUT, "  Mode: " . ($dryRun ? "DRY-RUN (no changes)" : "LIVE (will modify database)") . "\n");
fwrite(STDOUT, "================================================================\n");
fwrite(STDOUT, "\n");

$stats = [
    'users_processed' => 0,
    'triggers_granted' => 0,
    'regions_granted' => 0,
    'skipped' => 0
];

$users = getUsersWithRoles($pdo);

if (empty($users)) {
    logMsg("No users found!", 'warning');
    exit(0);
}

fwrite(STDOUT, "Found " . count($users) . " users\n");
fwrite(STDOUT, "----------------------------------------------------------------\n\n");

$allLevels = array_keys($LEVEL_TRIGGERS);
rsort($allLevels);

foreach ($users as $user) {
    $stats['users_processed']++;
    $userLevel = (int)$user['max_level'];
    
    logMsg("User: {$user['username']} (ID: {$user['id']}, Level: $userLevel, Roles: {$user['roles']})", 'info');
    
    foreach ($allLevels as $grantLevel) {
        if ($userLevel < $grantLevel) continue;
        
        $triggers = $LEVEL_TRIGGERS[$grantLevel] ?? [];
        foreach ($triggers as $triggerId) {
            if (grantTrigger($pdo, $user['id'], $triggerId, $dryRun)) {
                $stats['triggers_granted']++;
                auditMigration($pdo, $user['id'], 'trigger', $triggerId, $dryRun);
            } else {
                $stats['skipped']++;
            }
        }
        
        $regions = $LEVEL_REGIONS[$grantLevel] ?? [];
        foreach ($regions as $regionId) {
            if (grantRegion($pdo, $user['id'], $regionId, $dryRun)) {
                $stats['regions_granted']++;
                auditMigration($pdo, $user['id'], 'region', $regionId, $dryRun);
            } else {
                $stats['skipped']++;
            }
        }
    }
    
    fwrite(STDOUT, "\n");
}

fwrite(STDOUT, "\n");
fwrite(STDOUT, "================================================================\n");
fwrite(STDOUT, "                    MIGRATION SUMMARY\n");
fwrite(STDOUT, "================================================================\n");
fwrite(STDOUT, sprintf("  Users processed:     %d\n", $stats['users_processed']));
fwrite(STDOUT, sprintf("  Triggers granted:    %d\n", $stats['triggers_granted']));
fwrite(STDOUT, sprintf("  Regions granted:     %d\n", $stats['regions_granted']));
fwrite(STDOUT, sprintf("  Skipped (existing):  %d\n", $stats['skipped']));
fwrite(STDOUT, "----------------------------------------------------------------\n");
if ($dryRun) {
    fwrite(STDOUT, "  [WARNING] DRY-RUN MODE - No changes were made\n");
    fwrite(STDOUT, "  Run without --dry-run to apply changes\n");
} else {
    fwrite(STDOUT, "  [SUCCESS] Migration completed!\n");
}
fwrite(STDOUT, "================================================================\n");
fwrite(STDOUT, "\n");
