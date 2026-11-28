<?php
// API: Admin Users Management
// @version 3.0.0-SCHEMA-FIX
// @since 2025-01
// @updated 2026-07-08 - RECONNECT: alinhado ao schema REAL do banco (app_users +
//          app_user_profiles + app_user_roles + app_roles). A geração anterior (2.2.0)
//          consultava colunas inexistentes (name/avatar/user_level/last_login/status='deleted')
//          -> todo GET dava SQLSTATE 42S22 -> 500 DATABASE_ERROR -> painel em branco.
// v3.0.0: - GET despacha por ?action (list|get|roles|export|user-sessions|user-preferences)
//         - nome vem de app_user_profiles (nome_completo/nome) com fallback username
//         - user_level derivado de MAX(app_roles.level) via app_user_roles
//         - roles agregadas por usuário; avatar_url; last_login_at; soft-delete via deleted_at
// v2.2.0: Migrado para UARPSGate + getConnection() centralizado
// v2.1.0: Migrado para AuthHelpers::requireCsrf()

declare(strict_types=1);

require_once __DIR__ . '/../../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../_helpers/GuardaDono.php';   // UARPS-DONO (P0 17/11/2026)
require_once __DIR__ . '/../../core/CorsPolicy.php';
require_once __DIR__ . '/../../core/SessionGate.php';
require_once __DIR__ . '/../../core/UARPSGate.php';
require_once __DIR__ . '/../../core/AuditLogger.php';
require_once __DIR__ . '/../../../config/db_connection.php';

CorsPolicy::apply();
SessionGate::start();
AuthHelpers::requireAuth();

$user = getCurrentUser();
$userId = (int)($user['id'] ?? 0);

UARPSGate::enforceTrigger($userId, 'gate:admin:users');
// UARPS-DONO (P0 17/11/2026): nível de antes da P3 (requireAdmin = 80) + nenhuma escrita sobre o dono (75) por terceiros.
dshow_exigir_nivel($userId, 80, 'admin/users');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    dshow_proteger_dono($userId, ['id', 'user_id', 'user_ids', 'ids', 'target_user_id'], 'admin/users');
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        switch ($action) {
            case 'roles':
                handleGetRoles();
                break;
            case 'export':
                handleExportUsers();
                break;
            case 'user-sessions':
                handleGetUserSessions();
                break;
            case 'user-preferences':
                handleGetUserPreferences();
                break;
            case 'get':
            case 'list':
            default:
                handleGetUsers();
        }
        break;
    case 'POST':
        AuthHelpers::requireCsrf();
        switch ($action) {
            case 'bulk-update-status':
                handleBulkUpdateStatus();
                break;
            case 'reset-password':
                handleResetPassword();
                break;
            case 'assign-role':
                handleAssignRole();
                break;
            case 'terminate-session':
            case 'terminate-user-sessions':
                handleTerminateSessions($action);   // P0 LOGS-010 / LOGS-021: encerra de verdade (antes: 200 NOT_IMPLEMENTED, terminated 0)
                break;
            case 'create':
            default:
                handleCreateUser();
        }
        break;
    case 'PUT':
    case 'PATCH':
        AuthHelpers::requireCsrf();
        handleUpdateUser();
        break;
    case 'DELETE':
        AuthHelpers::requireCsrf();
        handleDeleteUser();
        break;
    default:
        ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

// ── Fragmento SELECT compartilhado (lista + detalhe) ─────────────────────────
function usersSelectSql(string $whereClause = '', string $extra = ''): string {
    return "
        SELECT
            u.id,
            u.username,
            COALESCE(NULLIF(p.nome_completo, ''), NULLIF(p.nome, ''), u.username) AS name,
            p.nome,
            p.nome_completo,
            p.funcao,
            p.departamento,
            u.email,
            u.avatar_url,
            u.avatar_url AS avatar,
            u.status,
            u.last_login_at AS last_login,
            u.created_at,
            u.updated_at,
            (SELECT COALESCE(MAX(r.level), 0)
               FROM app_user_roles ur
               JOIN app_roles r ON r.id = ur.role_id AND r.deleted_at IS NULL
              WHERE ur.user_id = u.id AND ur.deleted_at IS NULL) AS user_level
        FROM app_users u
        LEFT JOIN app_user_profiles p ON p.user_id = u.id AND p.deleted_at IS NULL
        {$whereClause}
        {$extra}
    ";
}

// Anexa o array de roles a cada usuário (2 queries no total, sem N+1)
function attachRoles(PDO $pdo, array &$users): void {
    if (empty($users)) return;
    $ids = array_map(static fn($u) => (int)$u['id'], $users);
    $in = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("
        SELECT ur.user_id, r.id AS role_id, r.role_key, r.role_name, r.level
          FROM app_user_roles ur
          JOIN app_roles r ON r.id = ur.role_id AND r.deleted_at IS NULL
         WHERE ur.deleted_at IS NULL AND ur.user_id IN ({$in})
         ORDER BY r.level DESC
    ");
    $stmt->execute($ids);
    $byUser = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $byUser[(int)$row['user_id']][] = [
            'role_id'   => (int)$row['role_id'],
            'role_key'  => $row['role_key'],
            'role_name' => $row['role_name'],
            'level'     => (int)$row['level'],
        ];
    }
    foreach ($users as &$u) {
        $u['roles'] = $byUser[(int)$u['id']] ?? [];
        $u['user_level'] = (int)($u['user_level'] ?? 0);
    }
    unset($u);
}

/**
 * P0 LOGS-010 (AZUL 28/11, desenho aprovado pelo arquiteto 01:12): conta que deixa de estar ativa perde TODAS as sessões na MESMA transação
 * da mudança (desativar, bloquear, pendente, excluir, em massa). A reativação NÃO revive sessão antiga: exige login novo.
 * Também marca a revisão F1 pendente (regra CL3 do Warps 00:23) quando a tabela app_usuario_f1 já existe (antes da DDL v2b: só pula).
 */
function contaRevogarSessoes(PDO $pdo, array $ids, string $motivo): int {
    $ids = array_values(array_unique(array_filter(array_map('intval', $ids), static fn(int $i): bool => $i > 0)));
    if ($ids === []) return 0;
    $in = implode(',', array_fill(0, count($ids), '?'));
    $st = $pdo->prepare("UPDATE app_user_sessions SET is_active = 0, logout_at = NOW(3), logout_reason = ? WHERE user_id IN ({$in}) AND is_active = 1");
    $st->execute(array_merge([substr($motivo, 0, 50)], $ids));
    return $st->rowCount();
}
function contaMarcarF1Pendente(PDO $pdo, array $ids): void {
    $ids = array_values(array_unique(array_filter(array_map('intval', $ids), static fn(int $i): bool => $i > 0)));
    if ($ids === []) return;
    $existe = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'app_usuario_f1'")->fetchColumn();
    if ($existe !== 1) return;   // DDL v2b ainda não aplicada: a regra CL3 só passa a valer com ela
    $in = implode(',', array_fill(0, count($ids), '?'));
    // QI VINHO 01:16 (P1-1) + re-QI (arquiteto 01:45): cada desativação VOLTA a pendente e ZERA a revisão anterior (revisado_em, revisor_id,
    // revisao_vazia) — senão o CHECK da DDL v2b (pendente_f1 ⇒ revisado_em IS NULL) rejeita e a 2ª desativação falha inteira
    $pdo->prepare("INSERT INTO app_usuario_f1 (user_id, situacao, desde, origem) SELECT id, 'pendente_f1', NOW(3), 'admin-desativar' FROM app_users WHERE id IN ({$in})
                   ON DUPLICATE KEY UPDATE situacao = 'pendente_f1', desde = NOW(3), origem = 'admin-desativar', revisado_em = NULL, revisor_id = NULL, revisao_vazia = NULL")->execute($ids);
}

/** LOGS-021: encerra UMA sessão (session_id + user_id) ou TODAS as de uma conta (user_id). Alçada = a deste endpoint (gate:admin:users + nível 80 + GuardaDono). */
/** P0 LOGS-010 (condições B/E do GPT LOGS/Warps): auditoria DENTRO da transação, sem engolir erro — se falhar, nada é confirmado (rollback).
 *  Autor = sessão do admin; alvo = ids; horário = NOW(3); quantidade real de sessões revogadas em new_values. Nunca token. */
function contaAuditarNaTransacao(PDO $pdo, string $acao, array $ids, array $detalhe): void {
    $pdo->prepare("INSERT INTO app_audit_trail (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at) VALUES (?, ?, 'users', ?, NULL, ?, ?, ?, NOW(3))")
        ->execute([$_SESSION['user_id'] ?? null, $acao, implode(',', array_map('intval', $ids)), json_encode($detalhe, JSON_UNESCAPED_UNICODE),
                   $_SERVER['REMOTE_ADDR'] ?? null, substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255)]);
}

function handleTerminateSessions(string $action): void {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $uid = (int) ($input['user_id'] ?? $_GET['user_id'] ?? 0);
    if ($uid <= 0) { ApiResponse::error('MISSING_USER_ID', 400); return; }
    try {
        $pdo = getConnection('DSHOWDASH');
        $sid = (int) ($input['session_id'] ?? 0);
        if ($action === 'terminate-session' && $sid <= 0) { ApiResponse::error('MISSING_SESSION_ID', 400); return; }
        $pdo->beginTransaction();   // encerramento + auditoria = UMA transação; a resposta traz a quantidade REAL persistida
        try {
            if ($action === 'terminate-session') {
                $st = $pdo->prepare("UPDATE app_user_sessions SET is_active = 0, logout_at = NOW(3), logout_reason = 'admin_terminated' WHERE id = ? AND user_id = ? AND is_active = 1");
                $st->execute([$sid, $uid]); $n = $st->rowCount();
            } else {
                $n = contaRevogarSessoes($pdo, [$uid], 'admin_terminated_all');
            }
            if ($n > 0) contaAuditarNaTransacao($pdo, $action === 'terminate-session' ? 'user_session_terminated' : 'user_sessions_terminated', [$uid], ['sessoes_encerradas' => $n] + ($action === 'terminate-session' ? ['sessao_id' => $sid] : []));
            $pdo->commit();
        } catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $e; }
        ApiResponse::success(['terminated' => $n]);   // repetir = terminated 0 e nenhum evento novo (sem falso sucesso)
    } catch (Throwable $e) {
        error_log('[admin/users] terminate: ' . get_class($e));
        ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500, ['message' => 'Erro ao encerrar sessões']);
    }
}

function handleGetUsers(): void {
    $singleId = $_GET['id'] ?? null;
    $page   = max(1, (int)($_GET['page'] ?? 1));
    $limit  = min(500, max(1, (int)($_GET['limit'] ?? 50)));
    $search = $_GET['search'] ?? null;
    $status = $_GET['status'] ?? null;
    $level  = $_GET['level'] ?? null;
    $offset = ($page - 1) * $limit;

    try {
        $pdo = getConnection('DSHOWDASH');

        // Detalhe de um usuário
        if ($singleId) {
            $stmt = $pdo->prepare(usersSelectSql('WHERE u.id = ? AND u.deleted_at IS NULL'));
            $stmt->execute([(int)$singleId]);
            $one = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$one) {
                ApiResponse::error('USER_NOT_FOUND', 404);
                return;
            }
            $arr = [$one];
            attachRoles($pdo, $arr);
            ApiResponse::success(['user' => $arr[0]]);
            return;
        }

        // Filtros (colunas reais)
        $where  = ['u.deleted_at IS NULL'];
        $params = [];

        if ($search !== null && $search !== '') {
            $where[] = "(u.username LIKE ? OR u.email LIKE ? OR p.nome_completo LIKE ? OR p.nome LIKE ?)";
            $like = "%{$search}%";
            array_push($params, $like, $like, $like, $like);
        }
        if ($status !== null && $status !== '') {
            $where[] = "u.status = ?";
            $params[] = $status;
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);
        $having = '';
        $havingParams = [];
        if ($level !== null && $level !== '') {
            $having = 'HAVING user_level = ?';
            $havingParams[] = (int)$level;
        }

        // Total (derived table para respeitar o HAVING sobre user_level)
        $countSql = "SELECT COUNT(*) FROM (" . usersSelectSql($whereClause, $having) . ") t";
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute(array_merge($params, $havingParams));
        $total = (int)$countStmt->fetchColumn();

        // Página
        $listSql = usersSelectSql($whereClause, $having . " ORDER BY u.created_at DESC LIMIT {$limit} OFFSET {$offset}");
        $stmt = $pdo->prepare($listSql);
        $stmt->execute(array_merge($params, $havingParams));
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        attachRoles($pdo, $users);

        ApiResponse::success([
            'users' => $users,
            'pagination' => [
                'page'  => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => (int)ceil($total / max(1, $limit)),
            ],
        ]);
    } catch (Exception $e) {
        error_log("AdminUsers GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleGetRoles(): void {
    try {
        $pdo = getConnection('DSHOWDASH');
        $stmt = $pdo->query("
            SELECT id, role_key, role_name, description, level, is_system
              FROM app_roles
             WHERE deleted_at IS NULL
             ORDER BY level DESC, role_name ASC
        ");
        $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        ApiResponse::success(['roles' => $roles]);
    } catch (Exception $e) {
        error_log("AdminUsers ROLES error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleExportUsers(): void {
    try {
        $pdo = getConnection('DSHOWDASH');
        $search = $_GET['search'] ?? null;
        $status = $_GET['status'] ?? null;
        $where  = ['u.deleted_at IS NULL'];
        $params = [];
        if ($search !== null && $search !== '') {
            $where[] = "(u.username LIKE ? OR u.email LIKE ? OR p.nome_completo LIKE ? OR p.nome LIKE ?)";
            $like = "%{$search}%";
            array_push($params, $like, $like, $like, $like);
        }
        if ($status !== null && $status !== '') {
            $where[] = "u.status = ?";
            $params[] = $status;
        }
        $stmt = $pdo->prepare(usersSelectSql('WHERE ' . implode(' AND ', $where), 'ORDER BY u.created_at DESC'));
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="users-export.csv"');
        $out = fopen('php://output', 'w');
        require_once __DIR__ . '/../../_helpers/CsvSeguro.php';   // CSV/Excel Injection: nome/função/departamento são texto livre
        fputcsv($out, CsvSeguro::linha(['id', 'username', 'nome', 'email', 'status', 'user_level', 'funcao', 'departamento', 'last_login', 'created_at']));
        foreach ($rows as $r) {
            fputcsv($out, CsvSeguro::linha([
                $r['id'], $r['username'], $r['name'], $r['email'], $r['status'],
                $r['user_level'], $r['funcao'], $r['departamento'], $r['last_login'], $r['created_at'],
            ]));
        }
        fclose($out);
        exit;
    } catch (Exception $e) {
        error_log("AdminUsers EXPORT error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

// Sessões/preferências por usuário: ainda não modeladas aqui — resposta vazia segura.
function handleGetUserSessions(): void {
    ApiResponse::success(['sessions' => []]);
}
function handleGetUserPreferences(): void {
    ApiResponse::success(['preferences' => new stdClass()]);
}

function handleCreateUser(): void {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        ApiResponse::error('INVALID_INPUT', 400);
        return;
    }

    $name     = trim((string)($input['nome'] ?? $input['nome_completo'] ?? $input['name'] ?? ''));
    $username = trim((string)($input['username'] ?? ''));
    $email    = trim((string)($input['email'] ?? ''));
    $password = (string)($input['password'] ?? '');

    if ($username === '' && $name !== '') {
        // deriva um username a partir do email quando não informado
        $username = strstr($email, '@', true) ?: $name;
    }

    if ($username === '' || $email === '' || $password === '') {
        ApiResponse::error('MISSING_FIELDS', 400, ['message' => 'username/nome, email e password são obrigatórios']);
        return;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        ApiResponse::error('INVALID_EMAIL', 400);
        return;
    }
    if (strlen($password) < 8) {
        ApiResponse::error('PASSWORD_TOO_SHORT', 400, ['message' => 'Senha deve ter pelo menos 8 caracteres']);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $checkStmt = $pdo->prepare("SELECT id FROM app_users WHERE email = ? OR username = ?");
        $checkStmt->execute([$email, $username]);
        if ($checkStmt->fetch()) {
            ApiResponse::error('EMAIL_EXISTS', 409, ['message' => 'Email ou username já cadastrado']);
            return;
        }

        $status = $input['status'] ?? 'active';
        $hashed = password_hash($password, PASSWORD_DEFAULT);

        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            INSERT INTO app_users (username, email, password, avatar_url, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))
        ");
        $stmt->execute([$username, $email, $hashed, $input['avatar_url'] ?? $input['avatar'] ?? null, $status]);
        $newUserId = (int)$pdo->lastInsertId();

        if ($name !== '') {
            $prof = $pdo->prepare("
                INSERT INTO app_user_profiles (user_id, nome, nome_completo, funcao, departamento, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))
            ");
            $prof->execute([
                $newUserId,
                $name,
                $input['nome_completo'] ?? $name,
                $input['funcao'] ?? null,
                $input['departamento'] ?? null,
            ]);
        }

        if (!empty($input['role_id'])) {
            $rs = $pdo->prepare("INSERT INTO app_user_roles (user_id, role_id, assigned_by, assigned_at, created_at, updated_at) VALUES (?, ?, ?, NOW(3), NOW(3), NOW(3))");
            $rs->execute([$newUserId, (int)$input['role_id'], (int)($_SESSION['user_id'] ?? 0) ?: null]);
        }

        $pdo->commit();
        logAudit($pdo, 'user_created', 'users', $newUserId);

        ApiResponse::success(['message' => 'Usuário criado com sucesso', 'user_id' => $newUserId]);
    } catch (Exception $e) {
        if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
        error_log("AdminUsers POST error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleUpdateUser(): void {
    $input = json_decode(file_get_contents('php://input'), true);
    $uid = $input['id'] ?? $_GET['id'] ?? null;
    if (!$uid) {
        ApiResponse::error('MISSING_USER_ID', 400);
        return;
    }
    $uid = (int)$uid;

    try {
        $pdo = getConnection('DSHOWDASH');

        $checkStmt = $pdo->prepare("SELECT id, email FROM app_users WHERE id = ? AND deleted_at IS NULL");
        $checkStmt->execute([$uid]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
        if (!$existing) {
            ApiResponse::error('USER_NOT_FOUND', 404);
            return;
        }

        $userUpdates = [];
        $userParams  = [];

        if (isset($input['username']) && $input['username'] !== '') {
            $userUpdates[] = "username = ?";
            $userParams[]  = $input['username'];
        }
        if (isset($input['email'])) {
            if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
                ApiResponse::error('INVALID_EMAIL', 400);
                return;
            }
            if ($input['email'] !== $existing['email']) {
                $emailCheck = $pdo->prepare("SELECT id FROM app_users WHERE email = ? AND id != ?");
                $emailCheck->execute([$input['email'], $uid]);
                if ($emailCheck->fetch()) {
                    ApiResponse::error('EMAIL_EXISTS', 409);
                    return;
                }
            }
            $userUpdates[] = "email = ?";
            $userParams[]  = $input['email'];
        }
        if (isset($input['password']) && !empty($input['password'])) {
            if (strlen($input['password']) < 8) {
                ApiResponse::error('PASSWORD_TOO_SHORT', 400);
                return;
            }
            $userUpdates[] = "password = ?";
            $userParams[]  = password_hash($input['password'], PASSWORD_DEFAULT);
        }
        if (isset($input['avatar_url']) || isset($input['avatar'])) {
            $userUpdates[] = "avatar_url = ?";
            $userParams[]  = $input['avatar_url'] ?? $input['avatar'];
        }
        if (isset($input['status']) && !in_array($input['status'], ['active', 'disabled', 'locked', 'pending'], true)) {
            ApiResponse::error('INVALID_STATUS', 400, ['message' => 'status inválido']);
            return;
        }
        if (isset($input['status'])) {
            $userUpdates[] = "status = ?";
            $userParams[]  = $input['status'];
        }

        $pdo->beginTransaction();

        if (!empty($userUpdates)) {
            $userUpdates[] = "updated_at = NOW(3)";
            $userParams[]  = $uid;
            $sql = "UPDATE app_users SET " . implode(', ', $userUpdates) . " WHERE id = ?";
            $pdo->prepare($sql)->execute($userParams);
        }

        // Nome/função/departamento -> app_user_profiles (upsert)
        $name = $input['nome'] ?? $input['nome_completo'] ?? $input['name'] ?? null;
        if ($name !== null || isset($input['funcao']) || isset($input['departamento'])) {
            $has = $pdo->prepare("SELECT id FROM app_user_profiles WHERE user_id = ? AND deleted_at IS NULL");
            $has->execute([$uid]);
            if ($has->fetch()) {
                $pu = [];
                $pp = [];
                if ($name !== null) { $pu[] = "nome = ?"; $pp[] = $name; $pu[] = "nome_completo = ?"; $pp[] = $input['nome_completo'] ?? $name; }
                if (isset($input['funcao'])) { $pu[] = "funcao = ?"; $pp[] = $input['funcao']; }
                if (isset($input['departamento'])) { $pu[] = "departamento = ?"; $pp[] = $input['departamento']; }
                if (!empty($pu)) {
                    $pu[] = "updated_at = NOW(3)";
                    $pp[] = $uid;
                    $pdo->prepare("UPDATE app_user_profiles SET " . implode(', ', $pu) . " WHERE user_id = ?")->execute($pp);
                }
            } else {
                $pdo->prepare("INSERT INTO app_user_profiles (user_id, nome, nome_completo, funcao, departamento, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))")
                    ->execute([$uid, $name ?? '', $input['nome_completo'] ?? $name ?? '', $input['funcao'] ?? null, $input['departamento'] ?? null]);
            }
        }

        if (isset($input['status']) && $input['status'] !== 'active') {   // P0 LOGS-010: status + revogação + F1 + auditoria = UMA transação
            $revogadas = contaRevogarSessoes($pdo, [$uid], 'conta_' . $input['status']);
            if ($input['status'] === 'disabled') contaMarcarF1Pendente($pdo, [$uid]);
            contaAuditarNaTransacao($pdo, 'user_status_sessions_revoked', [$uid], ['status' => $input['status'], 'sessoes_revogadas' => $revogadas]);
        }
        $pdo->commit();
        logAudit($pdo, 'user_updated', 'users', $uid);

        ApiResponse::success(['message' => 'Usuário atualizado com sucesso']);
    } catch (Exception $e) {
        if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
        error_log("AdminUsers PUT error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleBulkUpdateStatus(): void {
    $input = json_decode(file_get_contents('php://input'), true);
    $ids = $input['user_ids'] ?? [];
    $status = $input['status'] ?? null;
    if (!is_array($ids) || empty($ids) || !$status) {
        ApiResponse::error('MISSING_FIELDS', 400, ['message' => 'user_ids[] e status são obrigatórios']);
        return;
    }
    $allowed = ['active', 'disabled', 'locked', 'pending'];
    if (!in_array($status, $allowed, true)) {
        ApiResponse::error('INVALID_STATUS', 400, ['message' => 'status inválido']);
        return;
    }
    try {
        $pdo = getConnection('DSHOWDASH');
        $ids = array_map('intval', $ids);
        $in = implode(',', array_fill(0, count($ids), '?'));
        $pdo->beginTransaction();   // P0 LOGS-010: status em massa + revogação das sessões numa transação só
        try {
            $stmt = $pdo->prepare("UPDATE app_users SET status = ?, updated_at = NOW(3) WHERE id IN ({$in}) AND deleted_at IS NULL");
            $stmt->execute(array_merge([$status], $ids));
            if ($status !== 'active') {
                $revogadas = contaRevogarSessoes($pdo, $ids, 'conta_' . $status);
                if ($status === 'disabled') contaMarcarF1Pendente($pdo, $ids);
                contaAuditarNaTransacao($pdo, 'users_bulk_status_sessions_revoked', $ids, ['status' => $status, 'sessoes_revogadas' => $revogadas]);
            }
            $pdo->commit();
        } catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $e; }
        logAudit($pdo, 'users_bulk_status', 'users', implode(',', $ids));
        ApiResponse::success(['message' => 'Status atualizado', 'affected' => $stmt->rowCount()]);
    } catch (Exception $e) {
        error_log("AdminUsers BULK error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleResetPassword(): void {
    $input = json_decode(file_get_contents('php://input'), true);
    $uid = $input['user_id'] ?? $input['id'] ?? null;
    if (!$uid) {
        ApiResponse::error('MISSING_USER_ID', 400);
        return;
    }
    try {
        $pdo = getConnection('DSHOWDASH');
        $chk = $pdo->prepare("SELECT id FROM app_users WHERE id = ? AND deleted_at IS NULL");
        $chk->execute([(int)$uid]);
        if (!$chk->fetch()) {
            ApiResponse::error('USER_NOT_FOUND', 404);
            return;
        }
        // Senha temporária (>=8 chars); o admin repassa ao usuário.
        $temp = bin2hex(random_bytes(5)); // 10 hex chars
        $stmt = $pdo->prepare("UPDATE app_users SET password = ?, updated_at = NOW(3) WHERE id = ?");
        $stmt->execute([password_hash($temp, PASSWORD_DEFAULT), (int)$uid]);
        logAudit($pdo, 'user_password_reset', 'users', (int)$uid);
        ApiResponse::success(['message' => 'Senha redefinida', 'temp_password' => $temp]);
    } catch (Exception $e) {
        error_log("AdminUsers RESETPW error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleAssignRole(): void {
    $input = json_decode(file_get_contents('php://input'), true);
    $uid = (int)($input['user_id'] ?? 0);
    $roleId = (int)($input['role_id'] ?? 0);
    if (!$uid || !$roleId) {
        ApiResponse::error('MISSING_FIELDS', 400, ['message' => 'user_id e role_id são obrigatórios']);
        return;
    }
    try {
        $pdo = getConnection('DSHOWDASH');
        $exists = $pdo->prepare("SELECT id FROM app_user_roles WHERE user_id = ? AND role_id = ? AND deleted_at IS NULL");
        $exists->execute([$uid, $roleId]);
        if (!$exists->fetch()) {
            $pdo->prepare("INSERT INTO app_user_roles (user_id, role_id, assigned_by, assigned_at, created_at, updated_at) VALUES (?, ?, ?, NOW(3), NOW(3), NOW(3))")
                ->execute([$uid, $roleId, (int)($_SESSION['user_id'] ?? 0) ?: null]);
        }
        logAudit($pdo, 'role_assigned', 'users', $uid);
        ApiResponse::success(['message' => 'Role atribuída']);
    } catch (Exception $e) {
        error_log("AdminUsers ASSIGNROLE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleDeleteUser(): void {
    $input = json_decode(file_get_contents('php://input'), true);
    $uid = $input['id'] ?? $_GET['id'] ?? null;
    if (!$uid) {
        ApiResponse::error('MISSING_USER_ID', 400);
        return;
    }
    $uid = (int)$uid;

    $current = getCurrentUser();
    $currentUserId = (int)($current['id'] ?? ($_SESSION['user_id'] ?? 0));
    if ($uid === $currentUserId) {
        ApiResponse::error('CANNOT_DELETE_SELF', 400, ['message' => 'Não é possível excluir seu próprio usuário']);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $checkStmt = $pdo->prepare("
            SELECT u.id,
                   (SELECT COALESCE(MAX(r.level),0) FROM app_user_roles ur JOIN app_roles r ON r.id=ur.role_id AND r.deleted_at IS NULL WHERE ur.user_id=u.id AND ur.deleted_at IS NULL) AS user_level
              FROM app_users u WHERE u.id = ? AND u.deleted_at IS NULL
        ");
        $checkStmt->execute([$uid]);
        $target = $checkStmt->fetch(PDO::FETCH_ASSOC);
        if (!$target) {
            ApiResponse::error('USER_NOT_FOUND', 404);
            return;
        }
        if ((int)$target['user_level'] >= 90) {
            ApiResponse::error('CANNOT_DELETE_SUPERADMIN', 403, ['message' => 'Não é possível excluir super administradores']);
            return;
        }

        $softDelete = $input['soft_delete'] ?? true;
        if ($softDelete) {
            $pdo->beginTransaction();   // P0 LOGS-010: exclusão lógica + revogação das sessões numa transação só
            try {
                $stmt = $pdo->prepare("UPDATE app_users SET status = 'disabled', deleted_at = NOW(3), updated_at = NOW(3) WHERE id = ?");
                $stmt->execute([$uid]);
                $revogadas = contaRevogarSessoes($pdo, [$uid], 'conta_excluida');
                contaMarcarF1Pendente($pdo, [$uid]);
                contaAuditarNaTransacao($pdo, 'user_deleted_sessions_revoked', [$uid], ['sessoes_revogadas' => $revogadas]);
                $pdo->commit();
            } catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $e; }
        } else {
            $stmt = $pdo->prepare("DELETE FROM app_users WHERE id = ?");
            $stmt->execute([$uid]);
        }

        logAudit($pdo, $softDelete ? 'user_deactivated' : 'user_deleted', 'users', $uid);
        ApiResponse::success(['message' => 'Usuário excluído com sucesso']);
    } catch (Exception $e) {
        error_log("AdminUsers DELETE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function logAudit(PDO $pdo, string $action, string $entityType, $entityId): void {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO app_audit_trail (user_id, action, entity_type, entity_id, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW(3))
        ");
        $stmt->execute([
            $_SESSION['user_id'] ?? null,
            $action,
            $entityType,
            (string)$entityId,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
        ]);
    } catch (Exception $e) {
        error_log("Audit log error: " . $e->getMessage());
    }
}
