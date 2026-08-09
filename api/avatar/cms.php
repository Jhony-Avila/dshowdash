<?php
declare(strict_types=1);

/**
 * api/avatar/cms.php — CMS READ-ONLY do catálogo (AS6 Parte 15,
 * lote 1061–1070, decisão #108, flag as6.cms_ro no front).
 * @version 1.0.0  @created 2026-08-09
 *
 * SOMENTE LEITURA por construção: GET, zero escrita, AdminGate
 * fail-closed (mesma allowlist do admin.php). Lista o que o banco JÁ
 * tem — assets (com joins de categoria/raridade/biblioteca), licenças e
 * a trilha de auditoria do admin. Escritas continuam exclusivas do
 * admin.php (POST + CSRF). Paginação defensiva (≤100 por página).
 *
 *   GET ?listar=assets[&pagina=N][&status=x]
 *   GET ?listar=licencas
 *   GET ?listar=auditoria[&pagina=N]
 */

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/AdminGate.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => true]);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET, OPTIONS');
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}
SessionGate::start();
if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}
$userId = (int) SessionGate::getUserId();
if (!AdminGate::autorizado($userId)) {
    ApiResponse::error('SEM_PERMISSAO', 403);
}

function avcms_ok(array $data): void
{
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(
        ['ok' => true, 'data' => $data, 'error' => null, 'meta' => ['endpoint' => 'avatar/cms', 'version' => '1.0.0']],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

$listar = (string) ($_GET['listar'] ?? 'assets');
$pagina = max(1, (int) ($_GET['pagina'] ?? 1));
$porPagina = 100;
$off = ($pagina - 1) * $porPagina;

try {
    $pdo = getConnection('DSHOWDASH');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    session_write_close();

    if ($listar === 'assets') {
        $sql = "SELECT a.id, a.`key`, a.name, a.asset_type, a.status, a.is_active,
                       a.is_exclusive, a.sort_order,
                       c.`key` AS categoria, r.`key` AS raridade, b.`key` AS biblioteca,
                       col.`key` AS colecao
                FROM avatar_assets a
                JOIN avatar_categories c ON c.id = a.category_id
                JOIN avatar_rarities r ON r.id = a.rarity_id
                JOIN avatar_libraries b ON b.id = a.library_id
                LEFT JOIN avatar_collections col ON col.id = a.collection_id";
        $par = [];
        $status = (string) ($_GET['status'] ?? '');
        if ($status !== '' && preg_match('/^[a-z_]{1,20}$/', $status)) {
            $sql .= ' WHERE a.status = :status';
            $par['status'] = $status;
        }
        $sql .= " ORDER BY a.id LIMIT $porPagina OFFSET $off";
        $st = $pdo->prepare($sql);
        $st->execute($par);
        $total = (int) $pdo->query('SELECT COUNT(*) FROM avatar_assets')->fetchColumn();
        avcms_ok(['itens' => $st->fetchAll(PDO::FETCH_ASSOC), 'total' => $total, 'pagina' => $pagina, 'por_pagina' => $porPagina]);
    }

    if ($listar === 'licencas') {
        $st = $pdo->query("SELECT * FROM avatar_licenses ORDER BY id LIMIT $porPagina");
        avcms_ok(['itens' => $st->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($listar === 'auditoria') {
        $st = $pdo->query("SELECT id, user_id, action, entity_type, entity_id, ip, created_at
                           FROM avatar_catalog_audit
                           ORDER BY id DESC LIMIT $porPagina OFFSET $off");
        $total = (int) $pdo->query('SELECT COUNT(*) FROM avatar_catalog_audit')->fetchColumn();
        avcms_ok(['itens' => $st->fetchAll(PDO::FETCH_ASSOC), 'total' => $total, 'pagina' => $pagina, 'por_pagina' => $porPagina]);
    }

    ApiResponse::error('LISTAGEM_DESCONHECIDA', 422);
} catch (Throwable $e) {
    error_log('avatar/cms: ' . $e->getMessage());
    ApiResponse::error('ERRO_INTERNO', 500);
}
