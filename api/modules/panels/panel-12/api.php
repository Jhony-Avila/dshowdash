<?php
// API: Panel 12 - Custom Panel
// @version 2.2.0-ENTERPRISE
// @since 2025-01
// @updated 2026-01-25 - Migrado para getConnection() centralizado
// v2.2.0: Removida getDbConnection() local

declare(strict_types=1);

require_once __DIR__ . '/../../../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../../core/CorsPolicy.php';
require_once __DIR__ . '/../../../core/SessionGate.php';
require_once __DIR__ . '/../../../../config/db_connection.php';

CorsPolicy::apply();
SessionGate::start();
AuthHelpers::requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetData();
        break;
    case 'POST':
        AuthHelpers::requireCsrf();
        handlePostData();
        break;
    case 'PUT':
    case 'PATCH':
        AuthHelpers::requireCsrf();
        handleUpdateData();
        break;
    case 'DELETE':
        AuthHelpers::requireCsrf();
        handleDeleteData();
        break;
    default:
        ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

function handleGetData(): void {
    $userId = $_SESSION['user_id'] ?? null;
    $panelId = 'panel-12';

    try {
        $pdo = getConnection('DSHOWDASH');

        $configStmt = $pdo->prepare("
            SELECT config_data
            FROM app_panel_configs
            WHERE panel_id = ? AND (user_id = ? OR user_id IS NULL)
            ORDER BY user_id DESC
            LIMIT 1
        ");
        $configStmt->execute([$panelId, $userId]);
        $config = $configStmt->fetch(PDO::FETCH_ASSOC);

        $dataStmt = $pdo->prepare("
            SELECT 
                id,
                title,
                content,
                metadata,
                status,
                created_at,
                updated_at
            FROM app_panel_data
            WHERE panel_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        ");
        $dataStmt->execute([$panelId]);
        $data = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($data as &$item) {
            if ($item['metadata']) {
                $item['metadata'] = json_decode($item['metadata'], true);
            }
        }

        ApiResponse::success([
            'panel_id' => $panelId,
            'config' => $config ? json_decode($config['config_data'], true) : null,
            'data' => $data
        ]);

    } catch (Exception $e) {
        error_log("Panel-12 GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handlePostData(): void {
    $userId = $_SESSION['user_id'] ?? null;
    $panelId = 'panel-12';

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        ApiResponse::error('INVALID_INPUT', 400);
        return;
    }

    $title = $input['title'] ?? null;
    $content = $input['content'] ?? null;

    if (!$title) {
        ApiResponse::error('MISSING_TITLE', 400, ['message' => 'title é obrigatório']);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("
            INSERT INTO app_panel_data (panel_id, user_id, title, content, metadata, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");

        $stmt->execute([
            $panelId,
            $userId,
            $title,
            $content,
            isset($input['metadata']) ? json_encode($input['metadata']) : null,
            $input['status'] ?? 'active'
        ]);

        ApiResponse::success([
            'message' => 'Dados criados com sucesso',
            'id' => $pdo->lastInsertId()
        ]);

    } catch (Exception $e) {
        error_log("Panel-12 POST error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleUpdateData(): void {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? $_GET['id'] ?? null;

    if (!$id) {
        ApiResponse::error('MISSING_ID', 400);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $updates = [];
        $params = [];

        if (isset($input['title'])) {
            $updates[] = "title = ?";
            $params[] = $input['title'];
        }

        if (isset($input['content'])) {
            $updates[] = "content = ?";
            $params[] = $input['content'];
        }

        if (isset($input['metadata'])) {
            $updates[] = "metadata = ?";
            $params[] = json_encode($input['metadata']);
        }

        if (isset($input['status'])) {
            $updates[] = "status = ?";
            $params[] = $input['status'];
        }

        if (empty($updates)) {
            ApiResponse::error('NO_UPDATES', 400);
            return;
        }

        $updates[] = "updated_at = NOW()";
        $params[] = $id;

        $sql = "UPDATE app_panel_data SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            ApiResponse::error('NOT_FOUND', 404);
            return;
        }

        ApiResponse::success(['message' => 'Dados atualizados com sucesso']);

    } catch (Exception $e) {
        error_log("Panel-12 PUT error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleDeleteData(): void {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? $_GET['id'] ?? null;

    if (!$id) {
        ApiResponse::error('MISSING_ID', 400);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("DELETE FROM app_panel_data WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            ApiResponse::error('NOT_FOUND', 404);
            return;
        }

        ApiResponse::success(['message' => 'Dados excluídos com sucesso']);

    } catch (Exception $e) {
        error_log("Panel-12 DELETE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}
