<?php
declare(strict_types=1);

// /api/user/avatar.php - Gerenciamento de avatar do usuario
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
    'methods' => ['GET', 'POST', 'DELETE', 'OPTIONS'],
    'no_cache' => true
]);

// Validar metodo
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'POST', 'DELETE'], true)) {
    header('Allow: GET, POST, DELETE, OPTIONS');
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}

// Inicializar sessao
SessionGate::start();

// Requer autenticacao
if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}

$userId = SessionGate::getUserId();

try {
    $pdo = getConnection('DSHOWDASH');

    // GET - Buscar avatar
    if ($method === 'GET') {
        $targetUserId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : $userId;

        $stmt = $pdo->prepare("
            SELECT
                a.id, a.user_id, a.avatar_type, a.avatar_config, a.avatar_image_url,
                a.is_active, a.version, a.created_at, a.updated_at,
                u.username as user_name, u.email as user_email
            FROM app_user_avatars a
            JOIN app_users u ON u.id = a.user_id
            WHERE a.user_id = ? AND a.is_active = 1
            ORDER BY a.updated_at DESC
            LIMIT 1
        ");
        $stmt->execute([$targetUserId]);
        $avatar = $stmt->fetch(PDO::FETCH_ASSOC);

        session_write_close();

        if ($avatar) {
            ApiResponse::success([
                'id' => (int)$avatar['id'],
                'user_id' => (int)$avatar['user_id'],
                'type' => $avatar['avatar_type'],
                'config' => $avatar['avatar_config'] ? json_decode($avatar['avatar_config'], true) : null,
                'imageUrl' => $avatar['avatar_image_url'],
                'version' => (int)$avatar['version'],
                'isActive' => (bool)$avatar['is_active'],
                'createdAt' => $avatar['created_at'],
                'updatedAt' => $avatar['updated_at'],
                'user' => [
                    'id' => (int)$avatar['user_id'],
                    'name' => $avatar['user_name'],
                    'email' => $avatar['user_email']
                ]
            ], ['timestamp' => date('c')]);
        } else {
            $stmt = $pdo->prepare("SELECT id, username, email FROM app_users WHERE id = ?");
            $stmt->execute([$targetUserId]);
            $userData = $stmt->fetch(PDO::FETCH_ASSOC);

            ApiResponse::success([
                'id' => null,
                'user_id' => $targetUserId,
                'type' => 'fallback',
                'config' => null,
                'imageUrl' => null,
                'version' => 0,
                'isActive' => true,
                'user' => $userData ? [
                    'id' => (int)$userData['id'],
                    'name' => $userData['username'],
                    'email' => $userData['email']
                ] : null,
                'isFallback' => true
            ], ['timestamp' => date('c')]);
        }
    }

    // POST - Criar/atualizar avatar
    if ($method === 'POST') {
        // P1.2: CSRF centralizado
        requireCsrf();

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            session_write_close();
            ApiResponse::error(ApiResponse::ERR_INVALID_JSON, 400, ['message' => 'Dados invalidos']);
        }

        $avatarType = $input['avatar_type'] ?? 'generated';
        $avatarConfig = isset($input['avatar_config']) ? json_encode($input['avatar_config']) : null;
        $avatarImageUrl = $input['avatar_image_url'] ?? null;
        $version = (int)($input['version'] ?? 1);

        $validTypes = ['fallback', 'image', 'generated'];
        if (!in_array($avatarType, $validTypes, true)) {
            session_write_close();
            ApiResponse::error('INVALID_TYPE', 400, ['message' => 'Tipo invalido']);
        }

        // Desativar avatares anteriores
        $stmt = $pdo->prepare("UPDATE app_user_avatars SET is_active = 0 WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Inserir novo avatar
        $stmt = $pdo->prepare("
            INSERT INTO app_user_avatars
            (user_id, avatar_type, avatar_config, avatar_image_url, is_active, version, created_at, updated_at)
            VALUES (?, ?, ?, ?, 1, ?, NOW(), NOW())
        ");
        $stmt->execute([$userId, $avatarType, $avatarConfig, $avatarImageUrl, $version]);

        $avatarId = $pdo->lastInsertId();

        // RECONEXÃO 2026-07-08: espelha o avatar escolhido em app_users.avatar_url,
        // que é a coluna lida por /api/auth/check.php (e portanto pelo header/dropdown).
        // Aditivo e não-destrutivo: só grava quando há URL de imagem (escolha da galeria);
        // p/ 'fallback'/'generated' sem URL, limpa a coluna (volta às iniciais).
        $stmt = $pdo->prepare("UPDATE app_users SET avatar_url = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$avatarImageUrl ?: null, $userId]);

        error_log("AVATAR_CREATED: user_id=$userId, avatar_id=$avatarId, type=$avatarType");

        session_write_close();

        ApiResponse::success([
            'id' => (int)$avatarId,
            'user_id' => $userId,
            'type' => $avatarType,
            'config' => $avatarConfig ? json_decode($avatarConfig, true) : null,
            'imageUrl' => $avatarImageUrl,
            'version' => $version,
            'isActive' => true
        ], ['message' => 'Avatar salvo', 'timestamp' => date('c')]);
    }

    // DELETE - Remover avatar
    if ($method === 'DELETE') {
        // P1.2: CSRF centralizado
        requireCsrf();

        $stmt = $pdo->prepare("UPDATE app_user_avatars SET is_active = 0 WHERE user_id = ?");
        $stmt->execute([$userId]);

        error_log("AVATAR_REMOVED: user_id=$userId");

        session_write_close();

        ApiResponse::success(null, ['message' => 'Avatar removido', 'timestamp' => date('c')]);
    }

} catch (PDOException $e) {
    error_log("[avatar.php] Error: " . $e->getMessage());
    session_write_close();
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500, ['message' => 'Erro interno']);
}
