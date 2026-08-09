<?php
declare(strict_types=1);

/**
 * api/avatar/cms.php — CMS READ-ONLY do catálogo (AS6 Parte 15,
 * lote 1061–1070, decisão #108, flag as6.cms_ro no front).
 * @version 1.1.0  @created 2026-08-09  @updated 2026-08-09 (lote
 * 1181-1190, decisão #120, flag as6.cms_ro2 no front: busca sanitizada,
 * filtro por categoria e DETALHE de asset — segue GET-only/AdminGate)
 *
 * SOMENTE LEITURA por construção: GET, zero escrita, AdminGate
 * fail-closed (mesma allowlist do admin.php). Lista o que o banco JÁ
 * tem — assets (com joins de categoria/raridade/biblioteca), licenças e
 * a trilha de auditoria do admin. Escritas continuam exclusivas do
 * admin.php (POST + CSRF). Paginação defensiva (≤100 por página).
 *
 *   GET ?listar=assets[&pagina=N][&status=x][&busca=txt][&categoria=key]
 *   GET ?listar=detalhe&id=N
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
        $onde = [];
        $status = (string) ($_GET['status'] ?? '');
        if ($status !== '' && preg_match('/^[a-z_]{1,20}$/', $status)) {
            $onde[] = 'a.status = :status';
            $par['status'] = $status;
        }
        // lote 1181-1190 (#120): busca e filtro de categoria — entrada
        // SANITIZADA por whitelist (espelho da regra do front §636)
        $busca = (string) ($_GET['busca'] ?? '');
        if ($busca !== '' && preg_match('/^[\p{L}\p{N} _\-\.]{1,40}$/u', $busca)) {
            $onde[] = '(a.name LIKE :busca OR a.`key` LIKE :busca)';
            $par['busca'] = '%' . $busca . '%';
        }
        $categoria = (string) ($_GET['categoria'] ?? '');
        if ($categoria !== '' && preg_match('/^[a-z0-9_\-]{1,30}$/', $categoria)) {
            $onde[] = 'c.`key` = :categoria';
            $par['categoria'] = $categoria;
        }
        if ($onde !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $onde);
        }
        $sql .= " ORDER BY a.id LIMIT $porPagina OFFSET $off";
        $st = $pdo->prepare($sql);
        $st->execute($par);
        $sqlTotal = 'SELECT COUNT(*) FROM avatar_assets a JOIN avatar_categories c ON c.id = a.category_id'
            . ($onde !== [] ? ' WHERE ' . implode(' AND ', $onde) : '');
        $stTotal = $pdo->prepare($sqlTotal);
        $stTotal->execute($par);
        $total = (int) $stTotal->fetchColumn();
        avcms_ok(['itens' => $st->fetchAll(PDO::FETCH_ASSOC), 'total' => $total, 'pagina' => $pagina, 'por_pagina' => $porPagina]);
    }

    if ($listar === 'detalhe') {
        // #120: ficha completa de UM asset (ainda leitura pura)
        $id = (int) ($_GET['id'] ?? 0);
        if ($id < 1) {
            ApiResponse::error('ID_INVALIDO', 422);
        }
        $st = $pdo->prepare(
            "SELECT a.*, c.`key` AS categoria, r.`key` AS raridade, b.`key` AS biblioteca,
                    col.`key` AS colecao, l.`key` AS licenca
             FROM avatar_assets a
             JOIN avatar_categories c ON c.id = a.category_id
             JOIN avatar_rarities r ON r.id = a.rarity_id
             JOIN avatar_libraries b ON b.id = a.library_id
             LEFT JOIN avatar_collections col ON col.id = a.collection_id
             LEFT JOIN avatar_licenses l ON l.id = a.license_id
             WHERE a.id = :id"
        );
        $st->execute(['id' => $id]);
        $asset = $st->fetch(PDO::FETCH_ASSOC);
        if ($asset === false) {
            ApiResponse::error('NAO_ENCONTRADO', 404);
        }
        $arquivos = $pdo->prepare('SELECT COUNT(*) FROM avatar_asset_files WHERE asset_id = :id');
        $arquivos->execute(['id' => $id]);
        $versoes = $pdo->prepare('SELECT COUNT(*) FROM avatar_asset_versions WHERE asset_id = :id');
        $versoes->execute(['id' => $id]);
        avcms_ok(['asset' => $asset, 'arquivos' => (int) $arquivos->fetchColumn(), 'versoes' => (int) $versoes->fetchColumn()]);
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
