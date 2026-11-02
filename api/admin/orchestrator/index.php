<?php
// API: Orchestrator Admin
// @version 2.2.0-ENTERPRISE
// @since 2025-01
// @updated 2026-01-25 - P0.1 FIX: Migrado requireAdmin() para UARPSGate::enforceTrigger()
// v2.2.0: Migrado para UARPSGate + getConnection() centralizado + removido use statements

declare(strict_types=1);

require_once __DIR__ . '/../../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../core/CorsPolicy.php';
require_once __DIR__ . '/../../core/SessionGate.php';
require_once __DIR__ . '/../../core/UARPSGate.php';
require_once __DIR__ . '/../../../config/db_connection.php';

CorsPolicy::apply();
SessionGate::start();
AuthHelpers::requireAuth();

$user = getCurrentUser();
$userId = (int)($user['id'] ?? 0);

UARPSGate::enforceTrigger($userId, 'gate:admin:orchestrator');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetOrchestrator();
        break;
    case 'POST':
        AuthHelpers::requireCsrf();
        handleOrchestratorAction();
        break;
    default:
        ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

function handleGetOrchestrator(): void {
    $action = $_GET['action'] ?? 'status';

    try {
        $pdo = getConnection('DSHOWDASH');

        switch ($action) {
            case 'status':
                $flagsStmt = $pdo->query("SELECT COUNT(*) as total, SUM(is_active) as active FROM app_orchestrator_flags");
                $flags = $flagsStmt->fetch(PDO::FETCH_ASSOC);

                $rulesStmt = $pdo->query("SELECT COUNT(*) as total, SUM(is_active) as active FROM app_orchestrator_rules");
                $rules = $rulesStmt->fetch(PDO::FETCH_ASSOC);

                ApiResponse::success([
                    'status' => 'healthy',
                    'flags' => [
                        'total' => (int)$flags['total'],
                        'active' => (int)$flags['active']
                    ],
                    'rules' => [
                        'total' => (int)$rules['total'],
                        'active' => (int)$rules['active']
                    ],
                    'last_sync' => date('Y-m-d H:i:s')
                ]);
                break;

            case 'manifest':
                $flagsStmt = $pdo->query("SELECT flag_key, flag_value, is_active FROM app_orchestrator_flags WHERE is_active = 1");
                $flags = $flagsStmt->fetchAll(PDO::FETCH_ASSOC);

                $rulesStmt = $pdo->query("SELECT rule_name, rule_type, conditions, actions, priority FROM app_orchestrator_rules WHERE is_active = 1 ORDER BY priority");
                $rules = $rulesStmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($flags as &$flag) {
                    $flag['flag_value'] = json_decode($flag['flag_value'], true) ?? $flag['flag_value'];
                    $flag['is_active'] = (bool)$flag['is_active'];
                }

                foreach ($rules as &$rule) {
                    $rule['conditions'] = json_decode($rule['conditions'], true);
                    $rule['actions'] = json_decode($rule['actions'], true);
                }

                ApiResponse::success([
                    'version' => '2.2.0',
                    'generated_at' => date('Y-m-d H:i:s'),
                    'flags' => $flags,
                    'rules' => $rules
                ]);
                break;

            default:
                ApiResponse::error('INVALID_ACTION', 400);
        }

    } catch (Exception $e) {
        error_log("Orchestrator GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleOrchestratorAction(): void {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        ApiResponse::error('INVALID_INPUT', 400);
        return;
    }

    $action = $input['action'] ?? null;

    if (!$action) {
        ApiResponse::error('MISSING_ACTION', 400);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        switch ($action) {
            case 'sync':
                $result = syncOrchestrator($pdo);
                ApiResponse::success($result);
                break;

            case 'reload':
                $pdo->query("UPDATE app_orchestrator_flags SET updated_at = NOW()");
                ApiResponse::success(['message' => 'Orchestrator reloaded', 'timestamp' => date('Y-m-d H:i:s')]);
                break;

            case 'reset':
                $pdo->query("UPDATE app_orchestrator_flags SET is_active = 1");
                $pdo->query("UPDATE app_orchestrator_rules SET is_active = 1");
                ApiResponse::success(['message' => 'Orchestrator reset to defaults']);
                break;

            case 'backup':
                $flags = $pdo->query("SELECT * FROM app_orchestrator_flags")->fetchAll(PDO::FETCH_ASSOC);
                $rules = $pdo->query("SELECT * FROM app_orchestrator_rules")->fetchAll(PDO::FETCH_ASSOC);

                $backup = [
                    'version' => '2.2.0',
                    'created_at' => date('Y-m-d H:i:s'),
                    'flags' => $flags,
                    'rules' => $rules
                ];

                ApiResponse::success(['backup' => $backup]);
                break;

            default:
                ApiResponse::error('INVALID_ACTION', 400, ['message' => "Ação '{$action}' não reconhecida"]);
        }

    } catch (Exception $e) {
        error_log("Orchestrator POST error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function syncOrchestrator(PDO $pdo): array {
    $synced = [
        'flags' => 0,
        'rules' => 0
    ];

    $flagsStmt = $pdo->query("SELECT COUNT(*) FROM app_orchestrator_flags WHERE is_active = 1");
    $synced['flags'] = (int)$flagsStmt->fetchColumn();

    $rulesStmt = $pdo->query("SELECT COUNT(*) FROM app_orchestrator_rules WHERE is_active = 1");
    $synced['rules'] = (int)$rulesStmt->fetchColumn();

    return [
        'message' => 'Sync completed',
        'synced' => $synced,
        'timestamp' => date('Y-m-d H:i:s')
    ];
}
