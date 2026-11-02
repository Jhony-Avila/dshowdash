<?php
// API: Orchestrator Feature Flags
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
        handleGetFlags();
        break;
    case 'POST':
    case 'PUT':
    case 'PATCH':
        AuthHelpers::requireCsrf();
        handleUpdateFlag();
        break;
    case 'DELETE':
        AuthHelpers::requireCsrf();
        handleDeleteFlag();
        break;
    default:
        ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

function handleGetFlags(): void {
    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->query("
            SELECT id, flag_key, flag_value, description, is_active, created_at, updated_at
            FROM app_orchestrator_flags
            ORDER BY flag_key ASC
        ");
        $flags = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($flags as &$flag) {
            $flag['is_active'] = (bool)$flag['is_active'];
            if ($flag['flag_value']) {
                $decoded = json_decode($flag['flag_value'], true);
                $flag['flag_value'] = $decoded !== null ? $decoded : $flag['flag_value'];
            }
        }

        ApiResponse::success(['flags' => $flags]);

    } catch (Exception $e) {
        error_log("Orchestrator Flags GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleUpdateFlag(): void {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        ApiResponse::error('INVALID_INPUT', 400);
        return;
    }

    $flagKey = $input['flag_key'] ?? null;
    $flagValue = $input['flag_value'] ?? null;
    $description = $input['description'] ?? null;
    $isActive = $input['is_active'] ?? true;

    if (!$flagKey) {
        ApiResponse::error('MISSING_FLAG_KEY', 400, ['message' => 'flag_key é obrigatório']);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $valueToStore = is_array($flagValue) || is_object($flagValue)
            ? json_encode($flagValue)
            : $flagValue;

        $stmt = $pdo->prepare("
            INSERT INTO app_orchestrator_flags (flag_key, flag_value, description, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                flag_value = VALUES(flag_value),
                description = VALUES(description),
                is_active = VALUES(is_active),
                updated_at = NOW()
        ");

        $stmt->execute([$flagKey, $valueToStore, $description, (int)$isActive]);

        ApiResponse::success([
            'message' => 'Flag atualizada com sucesso',
            'flag_key' => $flagKey
        ]);

    } catch (Exception $e) {
        error_log("Orchestrator Flags UPDATE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleDeleteFlag(): void {
    $input = json_decode(file_get_contents('php://input'), true);
    $flagKey = $input['flag_key'] ?? $_GET['flag_key'] ?? null;

    if (!$flagKey) {
        ApiResponse::error('MISSING_FLAG_KEY', 400, ['message' => 'flag_key é obrigatório']);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("DELETE FROM app_orchestrator_flags WHERE flag_key = ?");
        $stmt->execute([$flagKey]);

        if ($stmt->rowCount() === 0) {
            ApiResponse::error('FLAG_NOT_FOUND', 404);
            return;
        }

        ApiResponse::success([
            'message' => 'Flag excluída com sucesso',
            'flag_key' => $flagKey
        ]);

    } catch (Exception $e) {
        error_log("Orchestrator Flags DELETE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}
