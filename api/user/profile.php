<?php
declare(strict_types=1);

// /api/user/profile.php - User Profile API (self-service)
// @version 4.0.0-ENTERPRISE
// @updated 2026-07-08
// v4.0.0: GET agora enriquece com app_user_profiles (nome/nome_resumido/nome_completo/funcao/
//         departamento) e passa a aceitar POST/PUT/PATCH para o próprio usuário editar seu perfil
//         (via UserProfileRepository, upsert). Sincroniza $_SESSION['name'] p/ o header (check.php)
//         refletir o nome de exibição sem exigir novo login. CSRF obrigatório na escrita.
// v3.0.0: P0.1 CorsPolicy::setupApiEndpoint(); P1.1 contrato padronizado

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/repositories/UserProfileRepository.php';

CorsPolicy::setupApiEndpoint([
    'methods' => ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS'],
    'no_cache' => true
]);

$session = SessionGate::validate();
if (!$session) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401, ['authenticated' => false]);
}

$user = SessionGate::getUser();
$userId = SessionGate::getUserId();
if (!$user || !$userId) {
    ApiResponse::error('USER_NOT_FOUND', 401, ['message' => 'Usuário não encontrado na sessão']);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Lê o perfil estendido (app_user_profiles). Falha de leitura NÃO derruba o GET base.
function loadProfileRow(int $userId): ?array {
    try {
        $pdo = getConnection('DSHOWDASH');
        $repo = new UserProfileRepository($pdo);
        return $repo->findByUserId($userId);
    } catch (Throwable $e) {
        error_log('[user/profile.php] loadProfileRow: ' . $e->getMessage());
        return null;
    }
}

// ─────────────────────────────────────────────────────────────
// WRITE — POST/PUT/PATCH: edita o próprio perfil
// ─────────────────────────────────────────────────────────────
if (in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
    requireCsrf();

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        ApiResponse::error(ApiResponse::ERR_INVALID_JSON, 400, ['message' => 'JSON inválido']);
    }

    $allowed = ['nome', 'nome_resumido', 'nome_completo', 'funcao', 'departamento'];
    $clean = [];
    foreach ($allowed as $f) {
        if (!array_key_exists($f, $input)) continue;
        $v = $input[$f];
        if ($v === null) { $clean[$f] = null; continue; }
        $v = strip_tags(trim((string)$v));
        if (mb_strlen($v) > 128) $v = mb_substr($v, 0, 128);
        $clean[$f] = $v;
    }

    if (empty($clean)) {
        ApiResponse::error('NO_FIELDS', 400, ['message' => 'Nenhum campo válido para atualizar']);
    }

    try {
        $pdo = getConnection('DSHOWDASH');
        $repo = new UserProfileRepository($pdo);
        $repo->update((int)$userId, $clean);

        // Sincroniza o nome exibido na sessão (header lê $_SESSION['name'] via check.php).
        // Preferência: nome_resumido (o que o header mostra) -> nome -> nome_completo.
        $display = $clean['nome_resumido'] ?? $clean['nome'] ?? $clean['nome_completo'] ?? null;
        if ($display !== null && $display !== '') {
            $_SESSION['name'] = $display;
        }

        $fresh = loadProfileRow((int)$userId);
        ApiResponse::success(
            ['message' => 'Perfil atualizado com sucesso', 'profile' => $fresh],
            ['timestamp' => date('c')]
        );
    } catch (Throwable $e) {
        error_log('[user/profile.php] update: ' . $e->getMessage());
        ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500, ['message' => 'Erro ao salvar perfil']);
    }
}

// ─────────────────────────────────────────────────────────────
// READ — GET: base (sessão) + campos persistíveis (app_user_profiles)
// ─────────────────────────────────────────────────────────────
$profile = loadProfileRow((int)$userId);

ApiResponse::success([
    'status'        => 'online',
    'name'          => $user['name'] ?? $user['username'] ?? '',
    'email'         => $user['email'] ?? '',
    'role'          => $user['role'] ?? 'User',
    'level'         => (int)($user['level'] ?? 0),
    'avatar'        => $user['avatar'] ?? $user['avatar_url'] ?? '/assets/images/avatar-default.png',
    'last_login'    => $user['last_login_at'] ?? date('Y-m-d H:i:s'),
    // Campos persistíveis do perfil estendido (null quando ainda não há linha)
    'nome'          => $profile['nome'] ?? null,
    'nome_resumido' => $profile['nome_resumido'] ?? null,
    'nome_completo' => $profile['nome_completo'] ?? null,
    'funcao'        => $profile['funcao'] ?? null,
    'departamento'  => $profile['departamento'] ?? null,
], ['timestamp' => date('c')]);
