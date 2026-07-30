<?php
declare(strict_types=1);

/**
 * api/avatar/VidaLib.php — conquistas, eventos e desbloqueios (funções puras).
 * @version 1.0.0  @created 2026-07-30
 *
 * Extraída do vida.php (Expansão — critério de aceite: "desbloqueios
 * validados no backend"): o MESMO cálculo auditável alimenta o GET do
 * vida.php e o ENFORCEMENT no salvamento do studio.php — uma fonte, nunca
 * duas (princípio nº 3 do projeto: evitar duplicação de regras).
 */

// ── Eventos sazonais (janelas fixas no fuso de SP) ──────────────────
function vida_eventos(): array
{
    $tz = new DateTimeZone('America/Sao_Paulo');
    $hoje = new DateTimeImmutable('now', $tz);
    $ano = (int) $hoje->format('Y');
    $def = [
        ['id' => 'natal', 'nome' => 'Natal Dshow', 'descricao' => 'Dezembro inteiro com o Gorro de Natal liberado.',
         'inicio' => "$ano-12-01", 'fim' => "$ano-12-31", 'itens' => ['ace_gorro_natal']],
        ['id' => 'halloween', 'nome' => 'Halloween', 'descricao' => 'Fim de outubro com o Chapéu de Bruxa liberado.',
         'inicio' => "$ano-10-15", 'fim' => "$ano-11-02", 'itens' => ['ace_chapeu_bruxa']],
    ];
    $saida = [];
    foreach ($def as $e) {
        $ini = new DateTimeImmutable($e['inicio'] . ' 00:00:00', $tz);
        $fim = new DateTimeImmutable($e['fim'] . ' 23:59:59', $tz);
        $e['ativo'] = $hoje >= $ini && $hoje <= $fim;
        $saida[] = $e;
    }
    return $saida;
}

// ── Conquistas (registro: cada entrada = cálculo auditável) ─────────
function vida_conquistas(PDO $pdo, int $userId): array
{
    // métricas base (uma passada)
    $st = $pdo->prepare("
        SELECT
            COUNT(*) AS total,
            SUM(avatar_type = 'image') AS fotos,
            MIN(created_at) AS primeiro,
            SUM(HOUR(created_at) BETWEEN 5 AND 8) AS madrugadas
        FROM app_user_avatars
        WHERE user_id = ? AND avatar_type IN ('generated','image')
    ");
    $st->execute([$userId]);
    $m = $st->fetch(PDO::FETCH_ASSOC) ?: [];

    $stU = $pdo->prepare('SELECT created_at FROM app_users WHERE id = ?');
    $stU->execute([$userId]);
    $contaEm = (string) ($stU->fetchColumn() ?: '');

    $stA = $pdo->prepare("SELECT updated_at FROM app_user_avatars WHERE user_id = ? AND is_active = 1 ORDER BY updated_at DESC LIMIT 1");
    $stA->execute([$userId]);
    $ativoEm = (string) ($stA->fetchColumn() ?: '');

    $enesimo = function (int $n) use ($pdo, $userId): ?string {
        $st = $pdo->prepare("SELECT created_at FROM app_user_avatars WHERE user_id = ? AND avatar_type IN ('generated','image') ORDER BY id ASC LIMIT 1 OFFSET " . ($n - 1));
        $st->execute([$userId]);
        return $st->fetchColumn() ?: null;
    };

    $total = (int) ($m['total'] ?? 0);
    $fotos = (int) ($m['fotos'] ?? 0);
    $dias30 = $contaEm !== '' && strtotime($contaEm) <= strtotime('-30 days');
    $fiel7 = $ativoEm !== '' && strtotime($ativoEm) <= strtotime('-7 days');

    return [
        ['id' => 'primeiro_avatar', 'nome' => 'Primeira Identidade', 'descricao' => 'Salve seu primeiro avatar no estúdio.',
         'conquistada' => $total >= 1, 'em' => $total >= 1 ? ($m['primeiro'] ?? null) : null, 'recompensa' => 'mol_pioneiro'],
        ['id' => 'colecionador_5', 'nome' => 'Colecionador', 'descricao' => 'Chegue a 5 versões salvas (camadas ou fotos).',
         'conquistada' => $total >= 5, 'em' => $total >= 5 ? $enesimo(5) : null, 'recompensa' => 'efe_confete'],
        ['id' => 'fotografo', 'nome' => 'Fotogênico', 'descricao' => 'Use uma foto real como avatar pelo menos uma vez.',
         'conquistada' => $fotos >= 1, 'em' => null, 'recompensa' => null],
        ['id' => 'veterano_30d', 'nome' => 'Veterano', 'descricao' => 'Complete 30 dias de casa no Dshow Dash.',
         'conquistada' => $dias30, 'em' => $dias30 ? date('Y-m-d H:i:s', strtotime($contaEm . ' +30 days')) : null, 'recompensa' => 'ace_medalha'],
        ['id' => 'madrugador', 'nome' => 'Madrugador', 'descricao' => 'Salve um avatar entre 5h e 9h da manhã.',
         'conquistada' => ((int) ($m['madrugadas'] ?? 0)) >= 1, 'em' => null, 'recompensa' => null],
        ['id' => 'identidade_fiel', 'nome' => 'Identidade Fiel', 'descricao' => 'Mantenha o mesmo avatar por 7 dias seguidos.',
         'conquistada' => $fiel7, 'em' => null, 'recompensa' => null],
    ];
}

/** Ids de itens desbloqueados HOJE para o usuário (conquistas + eventos). */
function vida_desbloqueados(PDO $pdo, int $userId): array
{
    $desbloqueados = [];
    foreach (vida_conquistas($pdo, $userId) as $c) {
        if ($c['conquistada'] && $c['recompensa']) {
            $desbloqueados[] = $c['recompensa'];
        }
    }
    foreach (vida_eventos() as $e) {
        if ($e['ativo']) {
            $desbloqueados = array_merge($desbloqueados, $e['itens']);
        }
    }
    return array_values(array_unique($desbloqueados));
}

/**
 * Subconjunto de $itens que exige desbloqueio (regras do CATÁLOGO no banco).
 * Antes da migração rodar (tabelas ausentes), devolve [] — enforcement
 * gracioso: nunca derruba o salvamento por infraestrutura ausente.
 */
function vida_itens_com_trava(PDO $pdo, array $itens): array
{
    $itens = array_values(array_filter($itens, 'is_string'));
    if ($itens === []) {
        return [];
    }
    try {
        $marc = implode(',', array_fill(0, count($itens), '?'));
        $st = $pdo->prepare("
            SELECT DISTINCT a.`key`
            FROM avatar_assets a
            JOIN avatar_unlock_rules u ON u.asset_id = a.id
            WHERE a.`key` IN ($marc)
        ");
        $st->execute($itens);
        return $st->fetchAll(PDO::FETCH_COLUMN);
    } catch (Throwable $e) {
        return []; // catálogo ainda não migrado neste ambiente
    }
}
