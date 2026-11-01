<?php
// /api/anuncios/stats.php
// Painel de aprendizado (Fase 22 — aprendizado contínuo): agregados de uso
// e avaliações do Consultor de Anúncios.
// @module  anuncios.stats
// @version 1.1.0
// @created 2026-07-28
//
//   GET [?escopo=meus] → { totais, por_modo, dominios, sem_cobertura, negativas, recentes, atividade, escopo }
//
// 1.1.0 (31/10/2026 — isolamento por usuário, aprovado pelo Jhony): antes qualquer sessão via o TEXTO das
// perguntas/respostas de todos. Agora:
//   - listas com texto (negativas, sem_cobertura, recentes) = SEMPRE só das conversas do próprio usuário;
//   - agregados (totais, por_modo, dominios, atividade) = do próprio usuário; gestão (nível ≥ 80) vê os
//     agregados de TODOS (números, nunca texto de terceiros). `?escopo=meus` força o recorte pessoal.
//   - `escopo` na resposta diz o que foi aplicado: { agregados: todos|meus, listas: meus }.
// O formato dos demais campos não muda (painéis Anúncios e Geral seguem iguais).

declare(strict_types=1);

require_once __DIR__ . '/_lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, ['message' => 'Use GET.']);
}

/** Nível da gestão: vê os agregados de todos os usuários (sem texto de terceiros). */
const ANUNCIOS_STATS_GESTAO_MIN_LEVEL = 80;

$userId = anuncios_user_id(); // exige sessão válida
$nivel = (int) ((getCurrentUser() ?? [])['level'] ?? 0);
$agregadosTodos = $nivel >= ANUNCIOS_STATS_GESTAO_MIN_LEVEL && ($_GET['escopo'] ?? '') !== 'meus';
$pdo = anuncios_pdo();

/**
 * Filtro de posse sobre anuncios_mensagens (alias m). $todos = sem filtro (só agregados da gestão).
 * Retorna [sql, params]; o sql começa com "AND".
 */
function anuncios_stats_posse(bool $todos, int $userId): array
{
    if ($todos) { return ['', []]; }
    return [' AND m.conversa_id IN (SELECT c.id FROM anuncios_conversas c WHERE c.user_id = ?)', [$userId]];
}

[$posseAgr, $pAgr] = anuncios_stats_posse($agregadosTodos, $userId);
[$posseMeus, $pMeus] = anuncios_stats_posse(false, $userId);

function anuncios_stats_um(PDO $pdo, string $sql, array $params): int
{
    $st = $pdo->prepare($sql);
    $st->execute($params);
    return (int) $st->fetchColumn();
}

// ── Totais ──────────────────────────────────────────────────────────────────
$totais = [
    'conversas' => $agregadosTodos
        ? anuncios_stats_um($pdo, 'SELECT COUNT(*) FROM anuncios_conversas', [])
        : anuncios_stats_um($pdo, 'SELECT COUNT(*) FROM anuncios_conversas WHERE user_id = ?', [$userId]),
    'perguntas'     => anuncios_stats_um($pdo, 'SELECT COUNT(*) FROM anuncios_mensagens m WHERE m.role = "user"' . $posseAgr, $pAgr),
    'positivas'     => anuncios_stats_um($pdo, 'SELECT COUNT(*) FROM anuncios_mensagens m WHERE m.feedback = 1' . $posseAgr, $pAgr),
    'negativas'     => anuncios_stats_um($pdo, 'SELECT COUNT(*) FROM anuncios_mensagens m WHERE m.feedback = -1' . $posseAgr, $pAgr),
    'sem_cobertura' => anuncios_stats_um($pdo, 'SELECT COUNT(*) FROM anuncios_mensagens m
          WHERE m.role = "assistant" AND (m.units_json IS NULL OR m.units_json = "[]")' . $posseAgr, $pAgr),
];

// ── Por modo (consultant × retrieval_only) ─────────────────────────────────
$porModo = [];
$st = $pdo->prepare(
    'SELECT m.mode, COUNT(*) AS n FROM anuncios_mensagens m
     WHERE m.role = "assistant" AND m.mode IS NOT NULL AND m.mode <> ""' . $posseAgr . '
     GROUP BY m.mode'
);
$st->execute($pAgr);
foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
    $porModo[$r['mode']] = (int) $r['n'];
}

// ── Domínios mais consultados (decodifica units_json das últimas 500) ──────
$dominios = [];
$st = $pdo->prepare(
    'SELECT m.units_json FROM anuncios_mensagens m
     WHERE m.role = "assistant" AND m.units_json IS NOT NULL AND m.units_json <> "[]"' . $posseAgr . '
     ORDER BY m.id DESC LIMIT 500'
);
$st->execute($pAgr);
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
 * SEMPRE recortado pelas conversas do usuário ($posse/$params de anuncios_stats_posse(false, …)).
 */
function anuncios_stats_linhas(PDO $pdo, string $where, string $posse, array $params, int $limite): array
{
    $st = $pdo->prepare(
        "SELECT m.id, m.conversa_id, m.content, m.mode, m.feedback,
                m.feedback_comment, m.created_at,
                (SELECT content FROM anuncios_mensagens p
                  WHERE p.conversa_id = m.conversa_id AND p.role = 'user' AND p.id < m.id
                  ORDER BY p.id DESC LIMIT 1) AS pergunta
         FROM anuncios_mensagens m
         WHERE m.role = 'assistant' AND $where$posse
         ORDER BY m.id DESC LIMIT $limite"
    );
    $st->execute($params);
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

// ── Respostas negativas (lacunas confirmadas por humano) — só as do usuário ─
$negativas = anuncios_stats_linhas($pdo, 'm.feedback = -1', $posseMeus, $pMeus, 20);

// ── Perguntas sem cobertura (nenhuma unidade recuperada) — só as do usuário ─
$semCobertura = anuncios_stats_linhas($pdo, '(m.units_json IS NULL OR m.units_json = "[]")', $posseMeus, $pMeus, 20);

// ── Últimas perguntas — só as do usuário ────────────────────────────────────
$recentes = anuncios_stats_linhas($pdo, '1=1', $posseMeus, $pMeus, 20);

// ── Atividade: perguntas por dia (últimos 30 dias) ─────────────────────────
$atividade = [];
$st = $pdo->prepare(
    'SELECT DATE(m.created_at) AS dia, COUNT(*) AS n FROM anuncios_mensagens m
     WHERE m.role = "user" AND m.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)' . $posseAgr . '
     GROUP BY DATE(m.created_at) ORDER BY dia'
);
$st->execute($pAgr);
foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
    $atividade[] = ['dia' => (string) $r['dia'], 'n' => (int) $r['n']];
}

ApiResponse::success([
    'totais'        => $totais,
    'por_modo'      => $porModo,
    'dominios'      => $dominiosOut,
    'negativas'     => $negativas,
    'sem_cobertura' => $semCobertura,
    'recentes'      => $recentes,
    'atividade'     => $atividade,
    'escopo'        => ['agregados' => $agregadosTodos ? 'todos' : 'meus', 'listas' => 'meus'],
]);
