<?php
// API: Notification Rules Management
// @version 2.2.0-ENTERPRISE
// @since 2025-01
// @updated 2026-01-25 - Migrado para getConnection() centralizado
// v2.2.0: Removida getDbConnection() local

declare(strict_types=1);

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../../config/db_connection.php';

CorsPolicy::apply();
SessionGate::start();
AuthHelpers::requireAuth();

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
    $userId = $_SESSION['user_id'] ?? null;
    $ruleId = $_GET['id'] ?? null;
    $isGlobal = ($_GET['global'] ?? 'false') === 'true';

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        if ($ruleId) {
            $stmt = $pdo->prepare("
                SELECT id, user_id, rule_name, event_type, conditions, actions, channels, is_active, created_at, updated_at
                FROM app_notification_rules
                WHERE id = ? AND (user_id = ? OR user_id IS NULL)
            ");
            $stmt->execute([$ruleId, $userId]);
            $rule = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$rule) {
                ApiResponse::error('RULE_NOT_FOUND', 404);
                return;
            }

            $rule['is_active'] = (bool)$rule['is_active'];
            $rule['conditions'] = json_decode($rule['conditions'], true);
            $rule['actions'] = json_decode($rule['actions'], true);
            $rule['channels'] = json_decode($rule['channels'], true);

            ApiResponse::success(['rule' => $rule]);
            return;
        }

        $where = $isGlobal ? "user_id IS NULL" : "(user_id = ? OR user_id IS NULL)";
        $params = $isGlobal ? [] : [$userId];

        $stmt = $pdo->prepare("
            SELECT id, user_id, rule_name, event_type, conditions, actions, channels, is_active, created_at, updated_at
            FROM app_notification_rules
            WHERE {$where}
            ORDER BY user_id DESC, rule_name ASC
        ");
        $stmt->execute($params);
        $rules = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rules as &$rule) {
            $rule['is_active'] = (bool)$rule['is_active'];
            $rule['is_global'] = $rule['user_id'] === null;
            $rule['conditions'] = json_decode($rule['conditions'], true);
            $rule['actions'] = json_decode($rule['actions'], true);
            $rule['channels'] = json_decode($rule['channels'], true);
        }

        ApiResponse::success(['rules' => $rules]);

    } catch (Exception $e) {
        error_log("NotificationRules GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleCreateRule(): void {
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $ruleName = $input['rule_name'] ?? null;
    $eventType = $input['event_type'] ?? null;

    if (!$ruleName || !$eventType) {
        ApiResponse::error('MISSING_FIELDS', 400, ['message' => 'rule_name e event_type são obrigatórios']);
        return;
    }

    $isGlobal = ($input['is_global'] ?? false) && isAdmin();

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("
            INSERT INTO app_notification_rules (user_id, rule_name, event_type, conditions, actions, channels, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");

        $stmt->execute([
            $isGlobal ? null : $userId,
            $ruleName,
            $eventType,
            isset($input['conditions']) ? json_encode($input['conditions']) : null,
            isset($input['actions']) ? json_encode($input['actions']) : null,
            isset($input['channels']) ? json_encode($input['channels']) : '["app"]',
            isset($input['is_active']) ? (int)$input['is_active'] : 1
        ]);

        ApiResponse::success([
            'message' => 'Regra criada com sucesso',
            'rule_id' => $pdo->lastInsertId()
        ]);

    } catch (Exception $e) {
        error_log("NotificationRules POST error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleUpdateRule(): void {
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $ruleId = $input['id'] ?? $_GET['id'] ?? null;

    if (!$ruleId) {
        ApiResponse::error('MISSING_RULE_ID', 400);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $checkStmt = $pdo->prepare("SELECT user_id FROM app_notification_rules WHERE id = ?");
        $checkStmt->execute([$ruleId]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            ApiResponse::error('RULE_NOT_FOUND', 404);
            return;
        }

        if ($existing['user_id'] !== null && $existing['user_id'] != $userId && !isAdmin()) {
            ApiResponse::error('FORBIDDEN', 403);
            return;
        }

        $updates = [];
        $params = [];

        if (isset($input['rule_name'])) {
            $updates[] = "rule_name = ?";
            $params[] = $input['rule_name'];
        }

        if (isset($input['event_type'])) {
            $updates[] = "event_type = ?";
            $params[] = $input['event_type'];
        }

        if (isset($input['conditions'])) {
            $updates[] = "conditions = ?";
            $params[] = json_encode($input['conditions']);
        }

        if (isset($input['actions'])) {
            $updates[] = "actions = ?";
            $params[] = json_encode($input['actions']);
        }

        if (isset($input['channels'])) {
            $updates[] = "channels = ?";
            $params[] = json_encode($input['channels']);
        }

        if (isset($input['is_active'])) {
            $updates[] = "is_active = ?";
            $params[] = (int)$input['is_active'];
        }

        if (empty($updates)) {
            ApiResponse::error('NO_UPDATES', 400);
            return;
        }

        $updates[] = "updated_at = NOW()";
        $params[] = $ruleId;

        $sql = "UPDATE app_notification_rules SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        ApiResponse::success(['message' => 'Regra atualizada com sucesso']);

    } catch (Exception $e) {
        error_log("NotificationRules PUT error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleDeleteRule(): void {
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $ruleId = $input['id'] ?? $_GET['id'] ?? null;

    if (!$ruleId) {
        ApiResponse::error('MISSING_RULE_ID', 400);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $checkStmt = $pdo->prepare("SELECT user_id FROM app_notification_rules WHERE id = ?");
        $checkStmt->execute([$ruleId]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            ApiResponse::error('RULE_NOT_FOUND', 404);
            return;
        }

        if ($existing['user_id'] !== null && $existing['user_id'] != $userId && !isAdmin()) {
            ApiResponse::error('FORBIDDEN', 403);
            return;
        }

        $stmt = $pdo->prepare("DELETE FROM app_notification_rules WHERE id = ?");
        $stmt->execute([$ruleId]);

        ApiResponse::success(['message' => 'Regra excluída com sucesso']);

    } catch (Exception $e) {
        error_log("NotificationRules DELETE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function isAdmin(): bool {
    return ($_SESSION['user_level'] ?? 0) >= 9;
}
