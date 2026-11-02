<?php
// API: Orchestrator Rules Management
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
        handleGetRules();
        break;
    case 'POST':
        AuthHelpers::requireCsrf();
        handleCreateRule();
        break;
    case 'PUT':
    case 'PATCH':
        AuthHelpers::requireCsrf();
        handleUpdateRule();
        break;
    case 'DELETE':
        AuthHelpers::requireCsrf();
        handleDeleteRule();
        break;
    default:
        ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

function handleGetRules(): void {
    $ruleId = $_GET['id'] ?? null;
    $isActive = $_GET['is_active'] ?? null;

    try {
        $pdo = getConnection('DSHOWDASH');

        if ($ruleId) {
            $stmt = $pdo->prepare("
                SELECT id, rule_name, rule_type, conditions, actions, priority, is_active, created_at, updated_at
                FROM app_orchestrator_rules
                WHERE id = ?
            ");
            $stmt->execute([$ruleId]);
            $rule = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$rule) {
                ApiResponse::error('RULE_NOT_FOUND', 404);
                return;
            }

            $rule['is_active'] = (bool)$rule['is_active'];
            $rule['conditions'] = json_decode($rule['conditions'], true);
            $rule['actions'] = json_decode($rule['actions'], true);

            ApiResponse::success(['rule' => $rule]);
            return;
        }

        $where = [];
        $params = [];

        if ($isActive !== null) {
            $where[] = "is_active = ?";
            $params[] = (int)$isActive;
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $stmt = $pdo->prepare("
            SELECT id, rule_name, rule_type, conditions, actions, priority, is_active, created_at, updated_at
            FROM app_orchestrator_rules
            {$whereClause}
            ORDER BY priority ASC, rule_name ASC
        ");
        $stmt->execute($params);
        $rules = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rules as &$rule) {
            $rule['is_active'] = (bool)$rule['is_active'];
            $rule['conditions'] = json_decode($rule['conditions'], true);
            $rule['actions'] = json_decode($rule['actions'], true);
        }

        ApiResponse::success(['rules' => $rules]);

    } catch (Exception $e) {
        error_log("OrchestratorRules GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleCreateRule(): void {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        ApiResponse::error('INVALID_INPUT', 400);
        return;
    }

    $ruleName = $input['rule_name'] ?? null;
    $ruleType = $input['rule_type'] ?? 'custom';
    $conditions = $input['conditions'] ?? null;
    $actions = $input['actions'] ?? null;

    if (!$ruleName) {
        ApiResponse::error('MISSING_RULE_NAME', 400, ['message' => 'rule_name é obrigatório']);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("
            INSERT INTO app_orchestrator_rules (rule_name, rule_type, conditions, actions, priority, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");

        $stmt->execute([
            $ruleName,
            $ruleType,
            $conditions ? json_encode($conditions) : null,
            $actions ? json_encode($actions) : null,
            $input['priority'] ?? 0,
            isset($input['is_active']) ? (int)$input['is_active'] : 1
        ]);

        ApiResponse::success([
            'message' => 'Regra criada com sucesso',
            'rule_id' => $pdo->lastInsertId()
        ]);

    } catch (Exception $e) {
        error_log("OrchestratorRules POST error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleUpdateRule(): void {
    $input = json_decode(file_get_contents('php://input'), true);
    $ruleId = $input['id'] ?? $_GET['id'] ?? null;

    if (!$ruleId) {
        ApiResponse::error('MISSING_RULE_ID', 400);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("SELECT id FROM app_orchestrator_rules WHERE id = ?");
        $stmt->execute([$ruleId]);

        if (!$stmt->fetch()) {
            ApiResponse::error('RULE_NOT_FOUND', 404);
            return;
        }

        $updates = [];
        $params = [];

        if (isset($input['rule_name'])) {
            $updates[] = "rule_name = ?";
            $params[] = $input['rule_name'];
        }

        if (isset($input['rule_type'])) {
            $updates[] = "rule_type = ?";
            $params[] = $input['rule_type'];
        }

        if (isset($input['conditions'])) {
            $updates[] = "conditions = ?";
            $params[] = json_encode($input['conditions']);
        }

        if (isset($input['actions'])) {
            $updates[] = "actions = ?";
            $params[] = json_encode($input['actions']);
        }

        if (isset($input['priority'])) {
            $updates[] = "priority = ?";
            $params[] = (int)$input['priority'];
        }

        if (isset($input['is_active'])) {
            $updates[] = "is_active = ?";
            $params[] = (int)$input['is_active'];
        }

        if (empty($updates)) {
            ApiResponse::error('NO_UPDATES', 400, ['message' => 'Nenhum campo para atualizar']);
            return;
        }

        $updates[] = "updated_at = NOW()";
        $params[] = $ruleId;

        $sql = "UPDATE app_orchestrator_rules SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        ApiResponse::success(['message' => 'Regra atualizada com sucesso']);

    } catch (Exception $e) {
        error_log("OrchestratorRules PUT error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleDeleteRule(): void {
    $input = json_decode(file_get_contents('php://input'), true);
    $ruleId = $input['id'] ?? $_GET['id'] ?? null;

    if (!$ruleId) {
        ApiResponse::error('MISSING_RULE_ID', 400);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("DELETE FROM app_orchestrator_rules WHERE id = ?");
        $stmt->execute([$ruleId]);

        if ($stmt->rowCount() === 0) {
            ApiResponse::error('RULE_NOT_FOUND', 404);
            return;
        }

        ApiResponse::success(['message' => 'Regra excluída com sucesso']);

    } catch (Exception $e) {
        error_log("OrchestratorRules DELETE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}
