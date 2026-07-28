<?php
// /api/anuncios/conversas.php
// Histórico de conversas do Consultor de Anúncios (somente do usuário logado).
// @module  anuncios.conversas
// @version 1.0.0
// @created 2026-07-27
//
//   GET            → lista as conversas recentes (até 30)
//   GET ?id=N      → mensagens da conversa N (com fontes e feedback)

declare(strict_types=1);

require_once __DIR__ . '/_lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, ['message' => 'Use GET.']);
}

$userId = anuncios_user_id();
$pdo    = anuncios_pdo();

$conversaId = isset($_GET['id']) && is_numeric($_GET['id']) ? (int) $_GET['id'] : 0;

// ── Detalhe: mensagens de uma conversa ──────────────────────────────────────
if ($conversaId > 0) {
    $conversa = anuncios_conversa_do_usuario($pdo, $conversaId, $userId);
    $st = $pdo->prepare(
        'SELECT id, role, content, mode, units_json, feedback, created_at
         FROM anuncios_mensagens WHERE conversa_id = ? ORDER BY id'
    );
    $st->execute([$conversaId]);
    $mensagens = [];
    foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $m) {
        $mensagens[] = [
            'id'         => (int) $m['id'],
            'role'       => $m['role'],
            'content'    => $m['content'],
            'mode'       => $m['mode'],
            'units'      => $m['units_json'] !== null ? (json_decode($m['units_json'], true) ?: []) : [],
            'feedback'   => $m['feedback'] !== null ? (int) $m['feedback'] : null,
            'created_at' => $m['created_at'],
        ];
    }
    ApiResponse::success([
        'conversa'  => ['id' => (int) $conversa['id'], 'titulo' => $conversa['titulo']],
        'mensagens' => $mensagens,
    ]);
}

// ── Lista: conversas recentes do usuário ────────────────────────────────────
$st = $pdo->prepare(
    'SELECT c.id, c.titulo, c.updated_at,
            (SELECT COUNT(*) FROM anuncios_mensagens m
              WHERE m.conversa_id = c.id AND m.role = "user") AS perguntas
     FROM anuncios_conversas c
     WHERE c.user_id = ?
     ORDER BY c.updated_at DESC
     LIMIT 30'
);
$st->execute([$userId]);
$conversas = [];
foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $c) {
    $conversas[] = [
        'id'         => (int) $c['id'],
        'titulo'     => $c['titulo'],
        'updated_at' => $c['updated_at'],
        'perguntas'  => (int) $c['perguntas'],
    ];
}
ApiResponse::success(['conversas' => $conversas]);
