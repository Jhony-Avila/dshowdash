<?php
declare(strict_types=1);

/**
 * /api/avatar/personagens3d.php — catálogo 3D servido pelo REGISTRY §614
 * (AS5 · mega 11). O runtime deixa de depender só do index.json estático:
 * esta API lê avatar_assets + avatar_asset_versions (status aprovado/
 * publicado) e devolve os personagens com o manifest §517 (metadata_json)
 * já digerido para a UI.
 *
 * GET → { personagens: [{ slug, nome, thumb, preview, animacoes,
 *          triangulos, excecoes? }], fonte: 'registry' }
 *
 * FAIL-SAFE por contrato: registry vazio (registro-curados-3d.sql ainda
 * não aplicado) devolve personagens:[] — o front cai na cadeia de
 * fallback (index.json → lista embutida). Erro de banco idem: resposta
 * vazia 200, NUNCA 500 derrubando o palco (§481: o palco só promete o
 * que tem). Somente leitura; sem parâmetros do cliente na query.
 */

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => true]);

$metodo = $_SERVER['REQUEST_METHOD'] ?? '';
if ($metodo !== 'GET') {
    header('Allow: GET, OPTIONS');
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}

SessionGate::start();
if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}

$personagens = [];
try {
    $pdo = getConnection('DSHOWDASH');
    // versão mais RECENTE aprovada/publicada de cada asset 3D (glb)
    $sql = "SELECT a.`key` AS slug, a.name AS nome, a.thumbnail_url, a.preview_url,
                   v.metadata_json
            FROM avatar_assets a
            JOIN avatar_asset_versions v ON v.asset_id = a.id
            WHERE a.asset_type = 'glb' AND a.is_active = 1
              AND v.status IN ('aprovado', 'publicado')
              AND v.version = (SELECT MAX(v2.version) FROM avatar_asset_versions v2
                               WHERE v2.asset_id = a.id AND v2.status IN ('aprovado', 'publicado'))
            ORDER BY a.`key`";
    foreach ($pdo->query($sql) as $linha) {
        $manifest = json_decode((string) ($linha['metadata_json'] ?? '{}'), true) ?: [];
        $personagens[] = [
            'slug'       => (string) $linha['slug'],
            'nome'       => (string) ($linha['nome'] ?? $linha['slug']),
            'thumb'      => (string) ($linha['slug'] . '/thumb.webp'),
            'preview'    => (string) ($linha['slug'] . '/preview.webp'),
            'animacoes'  => array_values(array_filter((array) ($manifest['animacoes'] ?? []), 'is_string')),
            'triangulos' => (array) ($manifest['triangulos'] ?? []),
        ] + (isset($manifest['excecoes']) ? ['excecoes' => (array) $manifest['excecoes']] : []);
    }
} catch (Throwable $e) {
    // registry indisponível = lista vazia; o front tem a cadeia de fallback
    $personagens = [];
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'success' => true,
    'data'    => ['personagens' => $personagens, 'fonte' => 'registry'],
    'errors'  => [],
    'meta'    => ['total' => count($personagens)],
], JSON_UNESCAPED_UNICODE);
