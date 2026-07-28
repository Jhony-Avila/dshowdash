<?php
// /api/anuncios/stats.php
// Painel de aprendizado (Fase 22 — aprendizado contínuo): agregados de uso
// e avaliações do Consultor de Anúncios.
// @module  anuncios.stats
// @version 1.0.0
// @created 2026-07-28
//
//   GET → { totais, por_modo, dominios, sem_cobertura, negativas, recentes }
//
// Escopo v1: agregados de TODOS os usuários (ferramenta interna da equipe;
// as perguntas alimentam a evolução da metodologia). Se no futuro for
// necessário restringir a administradores, o gate entra aqui (min_level).

declare(strict_types=1);

require_once __DIR__ . '/_lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, ['message' => 'Use GET.']);
}

anuncios_user_id(); // exige sessão válida
$pdo = anuncios_pdo();

// ── Totais gerais ───────────────────────────────────────────────────────────
$totais = $pdo->query(
    'SELECT
        (SELECT COUNT(*) FROM anuncios_conversas)                                  AS conversas,
        (SELECT COUNT(*) FROM anuncios_mensagens WHERE role = "user")              AS perguntas,
        (SELECT COUNT(*) FROM anuncios_mensagens WHERE feedback = 1)               AS positivas,
        (SELECT COUNT(*) FROM anuncios_mensagens WHERE feedback = -1)              AS negativas,
        (SELECT COUNT(*) FROM anuncios_mensagens
          WHERE role = "assistant" AND (units_json IS NULL OR units_json = "[]"))  AS sem_cobertura'
)->fetch(PDO::FETCH_ASSOC);
$totais = array_map('intval', $totais ?: []);

// ── Por modo (consultant × retrieval_only) ─────────────────────────────────
$porModo = [];
$st = $pdo->query(
    'SELECT mode, COUNT(*) AS n FROM anuncios_mensagens
     WHERE role = "assistant" AND mode IS NOT NULL AND mode <> ""
     GROUP BY mode'
);
foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
    $porModo[$r['mode']] = (int) $r['n'];
}

// ── Domínios mais consultados (decodifica units_json das últimas 500) ──────
$dominios = [];
$st = $pdo->query(
    'SELECT units_json FROM anuncios_mensagens
     WHERE role = "assistant" AND units_json IS NOT NULL AND units_json <> "[]"
     ORDER BY id DESC LIMIT 500'
);
foreach ($st->fetchAll(PDO::FETCH_COLUMN) as $json) {
    $units = json_decode((string) $json, true);
    if (!is_array($units)) { continue; }
    foreach ($units as $u) {
        $d = is_array($u) ? (string) ($u['domain'] ?? '') : '';
        if ($d !== '') { $dominios[$d] = ($dominios[$d] ?? 0) + 1; }
    }
}
arsort($dominios);
$dominios = array_slice($dominios, 0, 12, true);
$dominiosOut = [];
foreach ($dominios as $dom => $n) {
    $dominiosOut[] = ['dominio' => $dom, 'citacoes' => $n];
}

/**
 * Junta a pergunta (mensagem user imediatamente anterior) a cada resposta.
 * Retorna linhas: pergunta, resposta (trecho), mode, feedback, comment, data.
 */
function anuncios_stats_linhas(PDO $pdo, string $where, int $limite): array
{
    $st = $pdo->prepare(
        "SELECT m.id, m.conversa_id, m.content, m.mode, m.feedback,
                m.feedback_comment, m.created_at,
                (SELECT content FROM anuncios_mensagens p
                  WHERE p.conversa_id = m.conversa_id AND p.role = 'user' AND p.id < m.id
                  ORDER BY p.id DESC LIMIT 1) AS pergunta
         FROM anuncios_mensagens m
         WHERE m.role = 'assistant' AND $where
         ORDER BY m.id DESC LIMIT $limite"
    );
    $st->execute();
    $linhas = [];
    foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $resposta = (string) $r['content'];
        if (function_exists('mb_substr')) { $resposta = mb_substr($resposta, 0, 300); }
        else { $resposta = substr($resposta, 0, 300); }
        $linhas[] = [
            'message_id'  => (int) $r['id'],
            'conversa_id' => (int) $r['conversa_id'],
            'pergunta'    => (string) ($r['pergunta'] ?? ''),
            'resposta'    => $resposta,
            'mode'        => $r['mode'],
            'feedback'    => $r['feedback'] !== null ? (int) $r['feedback'] : null,
            'comment'     => $r['feedback_comment'],
            'created_at'  => $r['created_at'],
        ];
    }
    return $linhas;
}

// ── Respostas negativas (lacunas confirmadas por humano) ───────────────────
$negativas = anuncios_stats_linhas($pdo, 'm.feedback = -1', 20);

// ── Perguntas sem cobertura (nenhuma unidade recuperada) ───────────────────
$semCobertura = anuncios_stats_linhas(
    $pdo,
    '(m.units_json IS NULL OR m.units_json = "[]")',
    20
);

// ── Últimas perguntas (visão geral do uso) ─────────────────────────────────
$recentes = anuncios_stats_linhas($pdo, '1=1', 20);

ApiResponse::success([
    'totais'        => $totais,
    'por_modo'      => $porModo,
    'dominios'      => $dominiosOut,
    'negativas'     => $negativas,
    'sem_cobertura' => $semCobertura,
    'recentes'      => $recentes,
]);
