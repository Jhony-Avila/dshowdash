<?php
// /api/anuncios/conversas.php
// Histórico de conversas do Consultor de Anúncios (somente do usuário logado).
// @module  anuncios.conversas
// @version 2.0.0  (1.0.0 = listar/carregar; 2.0.0 = ações do workspace)
// @created 2026-07-27
//
//   GET                 → lista conversas ativas (até 30; favoritas primeiro)
//   GET ?arquivadas=1   → lista conversas arquivadas
//   GET ?id=N           → mensagens da conversa N (com fontes e feedback)
//   POST {action, id, titulo?} → renomear | favoritar | desfavoritar |
//                                arquivar | desarquivar
//
// Não existe exclusão física: "arquivar" é o caminho de remoção (filosofia
// da casa: nada some, vai para o arquivo).

declare(strict_types=1);

require_once __DIR__ . '/_lib.php';

$userId = anuncios_user_id();
$pdo    = anuncios_pdo();
$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// ── Ações de escrita ────────────────────────────────────────────────────────
if ($metodo === 'POST') {
    $body = anuncios_body();
    $id   = isset($body['id']) && is_numeric($body['id']) ? (int) $body['id'] : 0;
    $acao = is_string($body['action'] ?? null) ? $body['action'] : '';

    if ($id <= 0 || $acao === '') {
        ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['message' => 'Informe id e action.']);
    }
    anuncios_conversa_do_usuario($pdo, $id, $userId); // posse

    switch ($acao) {
        case 'renomear':
            $titulo = trim((string) ($body['titulo'] ?? ''));
            if ($titulo === '') {
                ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['message' => 'Informe o novo titulo.']);
            }
            if (function_exists('mb_substr')) { $titulo = mb_substr($titulo, 0, 200); }
            else { $titulo = substr($titulo, 0, 200); }
            $pdo->prepare('UPDATE anuncios_conversas SET titulo = ? WHERE id = ?')->execute([$titulo, $id]);
            ApiResponse::success(['id' => $id, 'titulo' => $titulo]);
            break;
        case 'favoritar':
        case 'desfavoritar':
            $valor = $acao === 'favoritar' ? 1 : 0;
            $pdo->prepare('UPDATE anuncios_conversas SET is_favorita = ? WHERE id = ?')->execute([$valor, $id]);
            ApiResponse::success(['id' => $id, 'is_favorita' => $valor === 1]);
            break;
        case 'arquivar':
        case 'desarquivar':
            $valor = $acao === 'arquivar' ? 1 : 0;
            $pdo->prepare('UPDATE anuncios_conversas SET arquivada = ? WHERE id = ?')->execute([$valor, $id]);
            ApiResponse::success(['id' => $id, 'arquivada' => $valor === 1]);
            break;
        default:
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                'message' => 'action invalida (renomear|favoritar|desfavoritar|arquivar|desarquivar).',
            ]);
    }
    exit;
}

if ($metodo !== 'GET') {
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, ['message' => 'Use GET ou POST.']);
}

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
        'conversa' => [
            'id'          => (int) $conversa['id'],
            'titulo'      => $conversa['titulo'],
            'profile'     => (string) ($conversa['profile'] ?? 'consultor'),
            'is_favorita' => (bool) ($conversa['is_favorita'] ?? false),
            'arquivada'   => (bool) ($conversa['arquivada'] ?? false),
        ],
        'mensagens' => $mensagens,
    ]);
}

// ── Lista: conversas do usuário (favoritas primeiro) ───────────────────────
$arquivadas = isset($_GET['arquivadas']) && $_GET['arquivadas'] === '1' ? 1 : 0;
$st = $pdo->prepare(
    'SELECT c.id, c.titulo, c.profile, c.is_favorita, c.updated_at,
            (SELECT COUNT(*) FROM anuncios_mensagens m
              WHERE m.conversa_id = c.id AND m.role = "user") AS perguntas
     FROM anuncios_conversas c
     WHERE c.user_id = ? AND c.arquivada = ?
     ORDER BY c.is_favorita DESC, c.updated_at DESC
     LIMIT 30'
);
$st->execute([$userId, $arquivadas]);
$conversas = [];
foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $c) {
    $conversas[] = [
        'id'          => (int) $c['id'],
        'titulo'      => $c['titulo'],
        'profile'     => (string) ($c['profile'] ?? 'consultor'),
        'is_favorita' => (bool) $c['is_favorita'],
        'updated_at'  => $c['updated_at'],
        'perguntas'   => (int) $c['perguntas'],
    ];
}
ApiResponse::success(['conversas' => $conversas]);
