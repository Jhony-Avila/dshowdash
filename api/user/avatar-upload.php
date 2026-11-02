<?php
declare(strict_types=1);

// /api/user/avatar-upload.php - Upload de avatar do usuario
// @version 2.1.0-ENTERPRISE - Migrado para requireCsrf()
// @updated 2026-01-21
// P1.2: Migrado CSRF manual para requireCsrf() centralizado

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';

// Setup CORS e headers
CorsPolicy::setupApiEndpoint([
    'methods' => ['POST', 'OPTIONS'],
    'no_cache' => true
]);

// Validar metodo
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST, OPTIONS');
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}

// Inicializar sessao
SessionGate::start();

// Requer autenticacao
if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}

// P1.2: CSRF centralizado
requireCsrf();

$userId = SessionGate::getUserId();

// FIX: Rate Limiting para uploads de avatar (previne abuso)
// Limite: 10 avatares por hora por usuário
$AVATAR_LIMIT = 10;
$AVATAR_WINDOW_MINUTES = 60;

try {
    $pdoCheck = getConnection('DSHOWDASH');
    $cutoffTime = date('Y-m-d H:i:s', time() - ($AVATAR_WINDOW_MINUTES * 60));

    $stmtLimit = $pdoCheck->prepare("
        SELECT COUNT(*) as upload_count
        FROM app_user_avatars
        WHERE user_id = :user_id
        AND created_at > :cutoff
    ");
    $stmtLimit->execute([':user_id' => $userId, ':cutoff' => $cutoffTime]);
    $recentUploads = (int)$stmtLimit->fetchColumn();

    if ($recentUploads >= $AVATAR_LIMIT) {
        error_log("AVATAR_RATE_LIMIT: user_id=$userId exceeded $AVATAR_LIMIT uploads in $AVATAR_WINDOW_MINUTES min");
        session_write_close();
        ApiResponse::error('RATE_LIMIT_EXCEEDED', 429, [
            'message' => 'Limite de uploads excedido. Aguarde alguns minutos.',
            'retry_after' => $AVATAR_WINDOW_MINUTES * 60
        ]);
    }
} catch (PDOException $e) {
    // Rate limit check falhou - permitir upload (fail open)
    error_log("[avatar-upload.php] Rate limit check failed: " . $e->getMessage());
}

$uploadDir = __DIR__ . '/../../storage/avatars/';
$publicPath = '/storage/avatars/';
$maxSize = 5 * 1024 * 1024; // 5MB
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

try {
    if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] === UPLOAD_ERR_NO_FILE) {
        session_write_close();
        ApiResponse::error('NO_FILE', 400, ['message' => 'Nenhum arquivo enviado']);
    }

    $file = $_FILES['avatar'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        session_write_close();
        ApiResponse::error('UPLOAD_ERROR', 400, ['message' => 'Erro no upload: ' . $file['error']]);
    }

    if ($file['size'] > $maxSize) {
        session_write_close();
        ApiResponse::error('FILE_TOO_LARGE', 400, ['message' => 'Arquivo muito grande. Maximo: 5MB']);
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedTypes, true)) {
        session_write_close();
        ApiResponse::error('INVALID_TYPE', 400, ['message' => 'Tipo nao permitido. Use: JPG, PNG, WebP ou GIF']);
    }

    // FIX: Validação de conteúdo de imagem (previne polyglot files)
    $imageInfo = @getimagesize($file['tmp_name']);
    if ($imageInfo === false) {
        session_write_close();
        ApiResponse::error('INVALID_IMAGE', 400, ['message' => 'Arquivo não é uma imagem válida']);
    }

    // Verificar dimensões mínimas/máximas
    $imgWidth = $imageInfo[0];
    $imgHeight = $imageInfo[1];
    if ($imgWidth < 50 || $imgHeight < 50) {
        session_write_close();
        ApiResponse::error('IMAGE_TOO_SMALL', 400, ['message' => 'Imagem muito pequena. Mínimo: 50x50 pixels']);
    }
    if ($imgWidth > 4096 || $imgHeight > 4096) {
        session_write_close();
        ApiResponse::error('IMAGE_TOO_LARGE', 400, ['message' => 'Imagem muito grande. Máximo: 4096x4096 pixels']);
    }

    $extension = match($mimeType) {
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        default => 'jpg'
    };

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $filename = sprintf('avatar_%d_%s.%s', $userId, bin2hex(random_bytes(8)), $extension);
    $filepath = $uploadDir . $filename;
    $publicUrl = $publicPath . $filename;

    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        session_write_close();
        ApiResponse::error('SAVE_ERROR', 500, ['message' => 'Falha ao salvar arquivo']);
    }

    // Remover avatares antigos do usuario
    foreach (glob($uploadDir . "avatar_{$userId}_*") as $oldFile) {
        if ($oldFile !== $filepath) {
            @unlink($oldFile);
        }
    }

    $pdo = getConnection('DSHOWDASH');

    // Desativar avatares anteriores
    $stmt = $pdo->prepare("UPDATE app_user_avatars SET is_active = 0 WHERE user_id = ?");
    $stmt->execute([$userId]);

    // Inserir novo avatar
    $stmt = $pdo->prepare("
        INSERT INTO app_user_avatars
        (user_id, avatar_type, avatar_config, avatar_image_url, is_active, version)
        VALUES (?, 'image', NULL, ?, 1, 1)
    ");
    $stmt->execute([$userId, $publicUrl]);

    $avatarId = $pdo->lastInsertId();

    // Atualizar avatar_url na tabela de usuarios
    $stmt = $pdo->prepare("UPDATE app_users SET avatar_url = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$publicUrl, $userId]);

    // Atualizar sessao
    $_SESSION['user']['avatar_url'] = $publicUrl;

    error_log("AVATAR_UPLOADED: user_id=$userId, avatar_id=$avatarId");

    session_write_close();

    ApiResponse::success([
        'id' => (int)$avatarId,
        'user_id' => $userId,
        'type' => 'image',
        'imageUrl' => $publicUrl,
        'version' => 1,
        'isActive' => true
    ], ['message' => 'Avatar enviado com sucesso', 'timestamp' => date('c')]);

} catch (PDOException $e) {
    error_log("[user/avatar-upload.php] Error: " . $e->getMessage());
    session_write_close();
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500, ['message' => 'Erro ao salvar avatar']);
} catch (Exception $e) {
    error_log("[user/avatar-upload.php] Error: " . $e->getMessage());
    session_write_close();
    ApiResponse::error('INTERNAL_ERROR', 500, ['message' => 'Erro interno']);
}
