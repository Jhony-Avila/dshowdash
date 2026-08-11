<?php
// api/avatar/taxonomia.php — CMS read-only da TAXONOMIA v2 (mega
// programa P3, onda 1381, decisão #148).
// Serve a hierarquia de categorias do BANCO (avatar_category_groups /
// avatar_categories) para o registry client-side hidratar quando a
// flag as6.tax_cms estiver ligada. SÓ LEITURA — escrita/migração é
// RUNBOOK-BANCO. Sem dados no banco → 204 e o client segue no registry
// estático (fallback sempre seguro).
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../db_connection.php';

try {
    $pdo = db_connection();
    $grupos = $pdo->query(
        'SELECT id, slug, name, sort_order, status FROM avatar_category_groups ORDER BY sort_order, id'
    )->fetchAll(PDO::FETCH_ASSOC);
    if (!$grupos) { http_response_code(204); exit; }
    $cats = $pdo->query(
        'SELECT id, group_id, slug, name, sort_order, status FROM avatar_categories ORDER BY sort_order, id'
    )->fetchAll(PDO::FETCH_ASSOC);
    $porGrupo = [];
    foreach ($cats as $c) { $porGrupo[$c['group_id']][] = $c; }
    $saida = [];
    foreach ($grupos as $g) {
        $saida[] = [
            'id' => $g['slug'] ?: (string) $g['id'],
            'nome' => $g['name'],
            'estado' => $g['status'] === 'active' ? 'ativa' : ($g['status'] === 'hidden' ? 'oculta' : 'em_breve'),
            'principais' => array_map(static function ($c) {
                return [
                    'id' => $c['slug'] ?: (string) $c['id'],
                    'nome' => $c['name'],
                    'estado' => $c['status'] === 'active' ? 'ativa' : ($c['status'] === 'hidden' ? 'oculta' : 'em_breve'),
                ];
            }, $porGrupo[$g['id']] ?? []),
        ];
    }
    echo json_encode(['v' => 1, 'taxonomia' => $saida], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    // nunca vaza detalhe de banco; client cai no registry estático
    http_response_code(204);
}
