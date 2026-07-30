<?php
declare(strict_types=1);

/**
 * /api/avatar/catalog.php — catálogo agnóstico de UI (Expansão, Trilha A).
 * @version 1.0.0  @created 2026-07-30
 *
 * Leitura do catálogo genérico normalizado (decisão oficial do banco):
 *   GET ?taxonomia=1                     → grupos + categorias + raridades +
 *                                          bibliotecas + versão do catálogo
 *   GET ?assets=1&categoria=cabelo       → assets publicados da categoria
 *       [&busca=…][&pagina=1][&por_pagina=60]   (paginado — NUNCA milhares
 *                                                de uma vez; regras juntas)
 *
 * Cache: alta leitura/baixa escrita → ETag derivada de avatar_catalog_meta
 * (invalidação por publicação). If-None-Match → 304 sem tocar nas tabelas
 * grandes. Enquanto a feature flag avatar_catalog_db estiver desligada, o
 * front continua no catálogo TS — este endpoint serve homologação/comparação
 * (etapas 8–10 do plano de migração).
 */
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => true]);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET, OPTIONS');
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}
SessionGate::start();
if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}
session_write_close();

/** Responde JSON com ETag versionada (304 quando o cliente já tem). */
function catx_responder(array $data, int $versaoCatalogo, string $sufixoEtag): void
{
    $etag = 'W/"avcat-' . $versaoCatalogo . '-' . $sufixoEtag . '"';
    header('ETag: ' . $etag);
    header('Cache-Control: private, max-age=60');
    $recebida = trim($_SERVER['HTTP_IF_NONE_MATCH'] ?? '');
    if ($recebida !== '' && $recebida === $etag) {
        http_response_code(304);
        exit;
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'data' => $data, 'error' => null,
        'meta' => ['endpoint' => 'avatar/catalog', 'version' => '1.0.0',
            'catalog_version' => $versaoCatalogo]],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

try {
    $pdo = getConnection('DSHOWDASH');
    $versao = (int) ($pdo->query('SELECT version FROM avatar_catalog_meta WHERE id = 1')
        ->fetchColumn() ?: 1);

    // ── Taxonomia (sidebar/filtros nascem daqui) ─────────────────────────
    if (($_GET['taxonomia'] ?? '') === '1') {
        $grupos = $pdo->query("
            SELECT `key`, name, description, icon, sort_order, is_collapsible,
                   default_expanded
            FROM avatar_category_groups
            WHERE is_active = 1 ORDER BY sort_order
        ")->fetchAll(PDO::FETCH_ASSOC);

        $categorias = $pdo->query("
            SELECT c.`key`, g.`key` AS grupo, c.name, c.slot_key, c.category_type,
                   c.selection_mode, c.sort_order, c.is_active, c.is_required,
                   c.supports_colors, c.supports_materials, c.supports_morphs,
                   c.supports_search, c.supports_favorites, c.supported_renderers,
                   (SELECT COUNT(*) FROM avatar_assets a
                     WHERE a.category_id = c.id AND a.status = 'published'
                       AND a.is_active = 1) AS total_assets
            FROM avatar_categories c
            JOIN avatar_category_groups g ON g.id = c.group_id
            ORDER BY g.sort_order, c.sort_order
        ")->fetchAll(PDO::FETCH_ASSOC);

        $raridades = $pdo->query("
            SELECT `key`, name, level, color_token, effect_key, sound_key
            FROM avatar_rarities ORDER BY sort_order
        ")->fetchAll(PDO::FETCH_ASSOC);

        $bibliotecas = $pdo->query("
            SELECT `key`, name, provider, art_style, default_renderer, version
            FROM avatar_libraries WHERE status = 'published' ORDER BY id
        ")->fetchAll(PDO::FETCH_ASSOC);

        catx_responder([
            'groups' => $grupos,
            'categories' => $categorias,
            'rarities' => $raridades,
            'libraries' => $bibliotecas,
        ], $versao, 'tax');
    }

    // ── Assets por categoria (paginado + regras dos itens da página) ─────
    if (($_GET['assets'] ?? '') === '1') {
        $categoria = (string) ($_GET['categoria'] ?? '');
        if (!preg_match('/^[a-z0-9_]{1,60}$/', $categoria)) {
            ApiResponse::error('CATEGORIA_INVALIDA', 422);
        }
        $pagina = max(1, (int) ($_GET['pagina'] ?? 1));
        $porPagina = min(120, max(1, (int) ($_GET['por_pagina'] ?? 60)));
        $busca = trim((string) ($_GET['busca'] ?? ''));

        $sql = "
            SELECT a.id, a.`key`, a.name, a.short_description, a.lore, a.asset_type,
                   a.thumbnail_url, a.supported_renderers, a.default_renderer,
                   a.fallback_strategy, a.is_exclusive, a.is_randomizable,
                   a.sort_order, a.tags, a.metadata,
                   r.`key` AS raridade, b.`key` AS biblioteca,
                   col.`key` AS colecao
            FROM avatar_assets a
            JOIN avatar_categories c ON c.id = a.category_id
            JOIN avatar_rarities r ON r.id = a.rarity_id
            JOIN avatar_libraries b ON b.id = a.library_id
            LEFT JOIN avatar_collections col ON col.id = a.collection_id
            WHERE c.`key` = :categoria AND a.status = 'published' AND a.is_active = 1";
        $par = ['categoria' => $categoria];
        if ($busca !== '') {
            // FULLTEXT quando possível; curinga simples é aceitável até ~milhares
            $sql .= ' AND MATCH(a.name, a.short_description, a.lore, a.tags)
                      AGAINST (:busca IN NATURAL LANGUAGE MODE)';
            $par['busca'] = $busca;
        }
        $sql .= ' ORDER BY a.sort_order, a.id LIMIT :lim OFFSET :off';

        $st = $pdo->prepare($sql);
        foreach ($par as $k => $v) {
            $st->bindValue(':' . $k, $v);
        }
        $st->bindValue(':lim', $porPagina, PDO::PARAM_INT);
        $st->bindValue(':off', ($pagina - 1) * $porPagina, PDO::PARAM_INT);
        $st->execute();
        $assets = $st->fetchAll(PDO::FETCH_ASSOC);

        $regras = [];
        if ($assets !== []) {
            $ids = array_column($assets, 'id');
            $marcadores = implode(',', array_fill(0, count($ids), '?'));
            $rs = $pdo->prepare("
                SELECT origem.`key` AS source_asset_key, rr.rule_type, rr.target_type,
                       alvo.`key` AS target_asset_key, rr.target_key,
                       rr.`condition`, rr.message
                FROM avatar_asset_rules rr
                JOIN avatar_assets origem ON origem.id = rr.source_asset_id
                LEFT JOIN avatar_assets alvo ON alvo.id = rr.target_id
                WHERE rr.is_active = 1 AND rr.source_asset_id IN ($marcadores)
            ");
            $rs->execute($ids);
            $regras = $rs->fetchAll(PDO::FETCH_ASSOC);
        }
        foreach ($assets as &$a) {
            unset($a['id']); // ids internos não vazam — a chave pública é `key`
        }
        unset($a);

        catx_responder([
            'assets' => $assets,
            'rules' => $regras,
            'pagina' => $pagina,
            'por_pagina' => $porPagina,
        ], $versao, 'a-' . md5($categoria . '|' . $busca . '|' . $pagina . '|' . $porPagina));
    }

    ApiResponse::error('PARAMETRO_OBRIGATORIO', 422);
} catch (Throwable $e) {
    error_log('[avatar/catalog.php] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'data' => null, 'error' => 'ERRO_INTERNO']);
}
