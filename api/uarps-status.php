<?php
declare(strict_types=1);

// /api/uarps-status.php
// Endpoint de diagnóstico do sistema UARPS
// @version 1.1.0-ENTERPRISE
// @updated 2026-01-20
// @phase P3 - UARPS PURO
// P3.1: Migrado de requireAdmin() para UARPSGate::enforceTrigger()

require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../config/uarps.php';
require_once __DIR__ . '/core/UARPSGate.php';
require_once __DIR__ . '/core/UARPSShadow.php';
require_once __DIR__ . '/_helpers/ApiResponse.php';
require_once __DIR__ . '/_helpers/AuthHelpers.php';
require_once __DIR__ . '/core/CorsPolicy.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS']]);

$action = $_GET['action'] ?? 'status';

// P3.1: UARPS PURO - Substituído requireAdmin() por UARPSGate
// P3.4: Padronizado trigger para gate:admin:*
$user = requireAuth();
$userId = (int)$user['user_id'];
UARPSGate::enforceTrigger($userId, 'gate:admin:uarps-status');

try {
    $pdo = getConnection('DSHOWDASH');
    
    if ($action === 'status') {
        $status = [
            'uarps_config' => UARPSConfig::info(),
            'uarps_gate' => UARPSGate::healthCheck(),
            'uarps_shadow' => UARPSShadow::healthCheck(),
            'phase' => 'P3 - UARPS PURO',
            'migration' => 'Backend migrated to UARPSGate',
            'timestamp' => date('c')
        ];
        ApiResponse::success($status);
    }
    
    if ($action === 'inventory') {
        $stmtTriggers = $pdo->query("SELECT component, COUNT(*) as total FROM ui_triggers GROUP BY component ORDER BY total DESC");
        $triggersByComponent = $stmtTriggers->fetchAll(PDO::FETCH_ASSOC);
        
        $stmtRegions = $pdo->query("SELECT scope, COUNT(*) as total FROM ui_regions GROUP BY scope ORDER BY total DESC");
        $regionsByScope = $stmtRegions->fetchAll(PDO::FETCH_ASSOC);
        
        $stmtTotals = $pdo->query("
            SELECT 'triggers' as tipo, COUNT(*) as total FROM ui_triggers
            UNION ALL SELECT 'regions', COUNT(*) FROM ui_regions
            UNION ALL SELECT 'user_trigger_perms', COUNT(*) FROM app_user_trigger_permissions WHERE deleted_at IS NULL
            UNION ALL SELECT 'user_region_perms', COUNT(*) FROM app_user_region_permissions WHERE deleted_at IS NULL
        ");
        $totals = $stmtTotals->fetchAll(PDO::FETCH_KEY_PAIR);
        
        ApiResponse::success([
            'totals' => $totals,
            'triggers_by_component' => $triggersByComponent,
            'regions_by_scope' => $regionsByScope
        ]);
    }
    
    if ($action === 'divergences') {
        $limit = min((int)($_GET['limit'] ?? 50), 200);
        
        $stmt = $pdo->prepare("
            SELECT d.*, u.username
            FROM app_uarps_divergence_log d
            LEFT JOIN app_users u ON u.id = d.user_id
            ORDER BY d.created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        $divergences = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $stmtStats = $pdo->query("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN legacy_result = 'allow' AND uarps_result = 'deny' THEN 1 ELSE 0 END) as legacy_allow_uarps_deny,
                SUM(CASE WHEN legacy_result = 'deny' AND uarps_result = 'allow' THEN 1 ELSE 0 END) as legacy_deny_uarps_allow,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT endpoint) as unique_endpoints
            FROM app_uarps_divergence_log
        ");
        $stats = $stmtStats->fetch(PDO::FETCH_ASSOC);
        
        ApiResponse::success([
            'stats' => $stats,
            'divergences' => $divergences
        ]);
    }
    
    if ($action === 'test') {
        $userLevel = 0;
        $stmtLevel = $pdo->prepare("
            SELECT MAX(r.level) as max_level
            FROM app_user_roles ur
            JOIN app_roles r ON r.id = ur.role_id
            WHERE ur.user_id = ? AND ur.deleted_at IS NULL AND r.deleted_at IS NULL
        ");
        $stmtLevel->execute([$userId]);
        $levelRow = $stmtLevel->fetch(PDO::FETCH_ASSOC);
        $userLevel = (int)($levelRow['max_level'] ?? 0);
        
        $triggerTest = UARPSGate::checkTrigger($userId, 'header:btn-settings');
        $regionTest = UARPSGate::checkRegion($userId, 'region:panel:permissions-admin');
        
        $shadowTest = UARPSShadow::observe(
            $userId,
            $userLevel,
            80,
            true,
            'header:btn-settings',
            null,
            '/api/uarps-status.php?action=test'
        );
        
        ApiResponse::success([
            'tests' => [
                'trigger_check' => $triggerTest,
                'region_check' => $regionTest,
                'shadow_observe' => $shadowTest
            ],
            'user' => [
                'id' => $userId,
                'level' => $userLevel
            ],
            'shadow_stats' => UARPSShadow::getStats()
        ]);
    }
    
    ApiResponse::error('INVALID_ACTION', 400, ['action' => $action, 'valid' => ['status', 'inventory', 'divergences', 'test']]);
    
} catch (Exception $e) {
    ApiResponse::error('INTERNAL_ERROR', 500, ['message' => 'Erro interno']);
}
