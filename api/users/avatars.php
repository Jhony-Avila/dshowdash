<?php
// API: User Avatars
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
        handleGetAvatar();
        break;
    case 'POST':
        AuthHelpers::requireCsrf();
        handleUploadAvatar();
        break;
    case 'DELETE':
        AuthHelpers::requireCsrf();
        handleDeleteAvatar();
        break;
    default:
        ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

function handleGetAvatar(): void {
    $userId = $_GET['user_id'] ?? $_SESSION['user_id'] ?? null;

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("SELECT avatar_url FROM app_users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            ApiResponse::error('USER_NOT_FOUND', 404);
            return;
        }

        ApiResponse::success([
            'avatar' => $user['avatar_url'],
            'avatar_url' => $user['avatar_url'] ? '/storage/avatars/' . $user['avatar_url'] : null
        ]);

    } catch (Exception $e) {
        error_log("Avatar GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleUploadAvatar(): void {
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
        ApiResponse::error('UPLOAD_ERROR', 400, ['message' => 'Erro no upload do arquivo']);
        return;
    }

    $file = $_FILES['avatar'];

    $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedMimes)) {
        ApiResponse::error('INVALID_FILE_TYPE', 400, ['message' => 'Tipo de arquivo não permitido']);
        return;
    }

    $maxSize = 5 * 1024 * 1024;
    if ($file['size'] > $maxSize) {
        ApiResponse::error('FILE_TOO_LARGE', 400, ['message' => 'Arquivo excede 5MB']);
        return;
    }

    try {
        $uploadDir = '/var/www/dshowdash/storage/avatars';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'avatar_' . $userId . '_' . time() . '.' . $extension;
        $filePath = $uploadDir . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            ApiResponse::error('MOVE_ERROR', 500);
            return;
        }

        $pdo = getConnection('DSHOWDASH');

        $oldStmt = $pdo->prepare("SELECT avatar_url FROM app_users WHERE id = ?");
        $oldStmt->execute([$userId]);
        $old = $oldStmt->fetch(PDO::FETCH_ASSOC);

        if ($old && $old['avatar_url']) {
            $oldPath = $uploadDir . '/' . $old['avatar_url'];
            if (file_exists($oldPath)) {
                unlink($oldPath);
            }
        }

        $stmt = $pdo->prepare("UPDATE app_users SET avatar_url = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$filename, $userId]);

        ApiResponse::success([
            'message' => 'Avatar atualizado com sucesso',
            'avatar' => $filename,
            'avatar_url' => '/storage/avatars/' . $filename
        ]);

    } catch (Exception $e) {
        error_log("Avatar Upload error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleDeleteAvatar(): void {
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("SELECT avatar_url FROM app_users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && $user['avatar_url']) {
            $filePath = '/var/www/dshowdash/storage/avatars/' . $user['avatar_url'];
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }

        $stmt = $pdo->prepare("UPDATE app_users SET avatar_url = NULL, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$userId]);

        ApiResponse::success(['message' => 'Avatar removido com sucesso']);

    } catch (Exception $e) {
        error_log("Avatar Delete error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}
