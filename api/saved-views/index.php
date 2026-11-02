<?php
// API: Saved Views Management
// @version 2.3.0-ENTERPRISE
// @since 2025-01
// @updated 2026-01-25 - Migrado para getConnection() centralizado
// v2.3.0: Removida getDbConnection() local

declare(strict_types=1);

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../core/helpers/InputValidator.php';
require_once __DIR__ . '/../../config/db_connection.php';

CorsPolicy::apply();
SessionGate::start();
AuthHelpers::requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetViews();
        break;
    case 'POST':
        AuthHelpers::requireCsrf();
        handleCreateView();
        break;
    case 'PUT':
    case 'PATCH':
        AuthHelpers::requireCsrf();
        handleUpdateView();
        break;
    case 'DELETE':
        AuthHelpers::requireCsrf();
        handleDeleteView();
        break;
    default:
        ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

function handleGetViews(): void {
    $validator = InputValidator::fromGet();
    $userId = $_SESSION['user_id'] ?? null;
    $viewId = $validator->id('id', false);
    $module = $validator->string('module', '', ['maxLength' => 100]) ?: null;

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        if ($viewId) {
            $stmt = $pdo->prepare("
                SELECT id, user_id, name, module, config, is_default, created_at, updated_at
                FROM app_saved_views
                WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$viewId, $userId]);
            $view = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$view) {
                ApiResponse::error('VIEW_NOT_FOUND', 404);
                return;
            }

            $view['config'] = json_decode($view['config'], true);
            $view['is_default'] = (bool)$view['is_default'];

            ApiResponse::success(['view' => $view]);
            return;
        }

        $where = ["user_id = ?"];
        $params = [$userId];

        if ($module) {
            $where[] = "module = ?";
            $params[] = $module;
        }

        $whereClause = implode(' AND ', $where);

        $stmt = $pdo->prepare("
            SELECT id, user_id, name, module, config, is_default, created_at, updated_at
            FROM app_saved_views
            WHERE {$whereClause}
            ORDER BY is_default DESC, name ASC
        ");
        $stmt->execute($params);
        $views = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($views as &$view) {
            $view['config'] = json_decode($view['config'], true);
            $view['is_default'] = (bool)$view['is_default'];
        }

        ApiResponse::success(['views' => $views]);

    } catch (Exception $e) {
        error_log("SavedViews GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleCreateView(): void {
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $name = $input['name'] ?? null;
    $module = $input['module'] ?? null;
    $config = $input['config'] ?? [];
    $isDefault = $input['is_default'] ?? false;

    if (!$name || !$module) {
        ApiResponse::error('MISSING_FIELDS', 400, ['message' => 'name e module são obrigatórios']);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        if ($isDefault) {
            $stmt = $pdo->prepare("UPDATE app_saved_views SET is_default = 0 WHERE user_id = ? AND module = ?");
            $stmt->execute([$userId, $module]);
        }

        $stmt = $pdo->prepare("
            INSERT INTO app_saved_views (user_id, name, module, config, is_default, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ");

        $stmt->execute([
            $userId,
            $name,
            $module,
            json_encode($config),
            (int)$isDefault
        ]);

        ApiResponse::success([
            'message' => 'View criada com sucesso',
            'view_id' => $pdo->lastInsertId()
        ]);

    } catch (Exception $e) {
        error_log("SavedViews POST error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleUpdateView(): void {
    $validator = InputValidator::fromGet();
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $viewId = $input['id'] ?? $validator->id('id', false);

    if (!$viewId) {
        ApiResponse::error('MISSING_VIEW_ID', 400);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("SELECT id, module FROM app_saved_views WHERE id = ? AND user_id = ?");
        $stmt->execute([$viewId, $userId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            ApiResponse::error('VIEW_NOT_FOUND', 404);
            return;
        }

        $updates = [];
        $params = [];

        if (isset($input['name'])) {
            $updates[] = "name = ?";
            $params[] = $input['name'];
        }

        if (isset($input['config'])) {
            $updates[] = "config = ?";
            $params[] = json_encode($input['config']);
        }

        if (isset($input['is_default'])) {
            if ($input['is_default']) {
                $resetStmt = $pdo->prepare("UPDATE app_saved_views SET is_default = 0 WHERE user_id = ? AND module = ?");
                $resetStmt->execute([$userId, $existing['module']]);
            }
            $updates[] = "is_default = ?";
            $params[] = (int)$input['is_default'];
        }

        if (empty($updates)) {
            ApiResponse::error('NO_UPDATES', 400, ['message' => 'Nenhum campo para atualizar']);
            return;
        }

        $updates[] = "updated_at = NOW()";
        $params[] = $viewId;
        $params[] = $userId;

        $sql = "UPDATE app_saved_views SET " . implode(', ', $updates) . " WHERE id = ? AND user_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        ApiResponse::success(['message' => 'View atualizada com sucesso']);

    } catch (Exception $e) {
        error_log("SavedViews PUT error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleDeleteView(): void {
    $validator = InputValidator::fromGet();
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $viewId = $input['id'] ?? $validator->id('id', false);

    if (!$viewId) {
        ApiResponse::error('MISSING_VIEW_ID', 400);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("DELETE FROM app_saved_views WHERE id = ? AND user_id = ?");
        $stmt->execute([$viewId, $userId]);

        if ($stmt->rowCount() === 0) {
            ApiResponse::error('VIEW_NOT_FOUND', 404);
            return;
        }

        ApiResponse::success(['message' => 'View excluída com sucesso']);

    } catch (Exception $e) {
        error_log("SavedViews DELETE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}
