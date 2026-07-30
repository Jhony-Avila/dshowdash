<?php
declare(strict_types=1);

/**
 * api/avatar/VidaLib.php — conquistas, eventos e desbloqueios (funções puras).
 * @version 2.0.0  @created 2026-07-30  @updated 2026-07-30 (4.6 §8.3)
 * @changelog 2.0.0 — CONQUISTAS COM PROGRESSO (Onda 4): 6 → 30 conquistas em
 *   5 categorias (criacao/exploracao/colecao/dedicacao/maestria), cada uma
 *   com progresso {atual, alvo} calculado SÓ de dados verificáveis do
 *   próprio usuário. Métricas novas: formatos salvos (3d/foto estilizada),
 *   dias distintos, itens/categorias/espécies distintas usadas (parse dos
 *   ≤100 configs retidos), lendários usados e coleções completas (JOIN no
 *   catálogo, GRACIOSO), favoritos/desbloqueios/metadados de versão.
 *   4 recompensas novas: mol_glitch, ace_capa_heroica, efe_moedas, emb_fenix.
 *
 * Extraída do vida.php (Expansão): o MESMO cálculo auditável alimenta o GET
 * do vida.php e o ENFORCEMENT no salvamento do studio.php — uma fonte, nunca
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

/** Contagem simples com guarda (tabela pode não existir no ambiente). */
function vida_contar(PDO $pdo, string $sql, array $binds): int
{
    try {
        $st = $pdo->prepare($sql);
        $st->execute($binds);
        return (int) $st->fetchColumn();
    } catch (Throwable $e) {
        return 0;
    }
}

// ── Conquistas (registro: cada entrada = cálculo auditável) ─────────
function vida_conquistas(PDO $pdo, int $userId): array
{
    // ── métricas base (uma passada na tabela de versões) ────────────
    $st = $pdo->prepare("
        SELECT
            COUNT(*) AS total,
            SUM(avatar_type = 'image') AS fotos,
            SUM(avatar_config LIKE '%\"formato\":\"3d\"%') AS tres_d,
            SUM(avatar_config LIKE '%\"formato\":\"foto_estilizada\"%') AS estilizadas,
            SUM(avatar_type = 'generated' AND (avatar_config IS NULL
                OR avatar_config LIKE '%\"formato\":\"camadas\"%')) AS camadas_qtd,
            COUNT(DISTINCT DATE(created_at)) AS dias,
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

    $stA = $pdo->prepare('SELECT updated_at FROM app_user_avatars WHERE user_id = ? AND is_active = 1 ORDER BY updated_at DESC LIMIT 1');
    $stA->execute([$userId]);
    $ativoEm = (string) ($stA->fetchColumn() ?: '');

    $enesimo = function (int $n) use ($pdo, $userId): ?string {
        $st = $pdo->prepare("SELECT created_at FROM app_user_avatars WHERE user_id = ? AND avatar_type IN ('generated','image') ORDER BY id ASC LIMIT 1 OFFSET " . ($n - 1));
        $st->execute([$userId]);
        return $st->fetchColumn() ?: null;
    };

    // ── métricas de EXPLORAÇÃO: parse dos configs retidos (≤100) ────
    $usados = [];          // ids de itens já usados em qualquer versão
    $categoriasUsadas = []; // chaves de camada usadas
    $basesUsadas = [];
    $usouTitulo = false;
    $poderoso = false;      // aura+banner+emblema na MESMA versão
    $tresSlots = false;     // 3 acessórios simultâneos (decisão #41)
    try {
        $stC = $pdo->prepare("SELECT avatar_config FROM app_user_avatars
            WHERE user_id = ? AND avatar_config IS NOT NULL");
        $stC->execute([$userId]);
        foreach ($stC as $l) {
            $cfg = json_decode((string) $l['avatar_config'], true);
            if (!is_array($cfg) || ($cfg['formato'] ?? '') !== 'camadas') {
                continue;
            }
            if (is_string($cfg['base'] ?? null)) {
                $usados[$cfg['base']] = true;
                $basesUsadas[$cfg['base']] = true;
            }
            $camadas = (array) ($cfg['camadas'] ?? []);
            $acessorios = 0;
            foreach ($camadas as $chave => $id) {
                if (!is_string($id)) {
                    continue;
                }
                $usados[$id] = true;
                $categoriasUsadas[strpos((string) $chave, 'acessorio') === 0 ? 'acessorio' : (string) $chave] = true;
                if (strpos((string) $chave, 'acessorio') === 0) {
                    $acessorios++;
                }
            }
            if ($acessorios >= 3) {
                $tresSlots = true;
            }
            if (isset($camadas['aura'], $camadas['banner'], $camadas['emblema'])) {
                $poderoso = true;
            }
            if (is_string($cfg['titulo'] ?? null)) {
                $usouTitulo = true;
                $categoriasUsadas['titulo'] = true;
            }
        }
    } catch (Throwable $e) {
        // sem tabela/erro de parse → métricas de exploração ficam em zero
    }
    $idsUsados = array_keys($usados);

    // ── métricas de CATÁLOGO (graciosas — catálogo pode não existir) ─
    $lendariosUsados = 0;
    $colecoesCompletas = 0;
    if ($idsUsados !== []) {
        try {
            $marc = implode(',', array_fill(0, count($idsUsados), '?'));
            $stL = $pdo->prepare("
                SELECT COUNT(DISTINCT a.`key`)
                FROM avatar_assets a
                JOIN avatar_rarities r ON r.id = a.rarity_id
                WHERE a.`key` IN ($marc) AND r.level >= 4
            ");
            $stL->execute($idsUsados);
            $lendariosUsados = (int) $stL->fetchColumn();
        } catch (Throwable $e) {
            $lendariosUsados = 0;
        }
        try {
            $stCol = $pdo->query("
                SELECT col.id AS cid, a.`key` AS k
                FROM avatar_collections col
                JOIN avatar_collection_items ci ON ci.collection_id = col.id
                    AND ci.is_required_for_completion = 1
                JOIN avatar_assets a ON a.id = ci.asset_id
                WHERE col.status = 'published'
            ");
            $porColecao = [];
            foreach ($stCol as $l) {
                $porColecao[(string) $l['cid']][] = (string) $l['k'];
            }
            foreach ($porColecao as $itens) {
                $faltam = array_diff($itens, $idsUsados);
                if ($itens !== [] && $faltam === []) {
                    $colecoesCompletas++;
                }
            }
        } catch (Throwable $e) {
            $colecoesCompletas = 0;
        }
    }

    $favoritos = vida_contar($pdo, 'SELECT COUNT(*) FROM avatar_user_favorites WHERE user_id = ?', [$userId]);
    $desbloqueiosReg = vida_contar($pdo, 'SELECT COUNT(*) FROM avatar_user_unlocks WHERE user_id = ?', [$userId]);
    $arquivadas = vida_contar($pdo, 'SELECT COUNT(*) FROM avatar_version_meta WHERE user_id = ? AND (label IS NOT NULL OR is_pinned = 1)', [$userId]);

    // ── números derivados ────────────────────────────────────────────
    $total = (int) ($m['total'] ?? 0);
    $fotos = (int) ($m['fotos'] ?? 0);
    $tresD = (int) ($m['tres_d'] ?? 0);
    $estilizadas = (int) ($m['estilizadas'] ?? 0);
    $camadasQtd = (int) ($m['camadas_qtd'] ?? 0);
    $dias = (int) ($m['dias'] ?? 0);
    $madrugadas = (int) ($m['madrugadas'] ?? 0);
    $formatos = ($camadasQtd > 0 ? 1 : 0) + ($fotos > 0 ? 1 : 0) + ($tresD > 0 ? 1 : 0);
    $diasCasa = $contaEm !== '' ? max(0, (int) floor((time() - strtotime($contaEm)) / 86400)) : 0;
    $diasFiel = $ativoEm !== '' ? max(0, (int) floor((time() - strtotime($ativoEm)) / 86400)) : 0;

    /** Monta uma entrada do registro (progresso SEMPRE presente — §8.3). */
    $c = function (string $id, string $nome, string $desc, string $categoria,
                   int $atual, int $alvo, ?string $recompensa = null, ?string $em = null): array {
        $ok = $atual >= $alvo;
        return [
            'id' => $id, 'nome' => $nome, 'descricao' => $desc,
            'categoria' => $categoria,
            'conquistada' => $ok,
            'em' => $ok ? $em : null,
            'recompensa' => $recompensa,
            'progresso' => ['atual' => min($atual, $alvo), 'alvo' => $alvo],
        ];
    };

    return [
        // ── CRIAÇÃO ──────────────────────────────────────────────────
        $c('primeiro_avatar', 'Primeira Identidade', 'Salve seu primeiro avatar no estúdio.',
            'criacao', $total, 1, 'mol_pioneiro', $m['primeiro'] ?? null),
        $c('colecionador_5', 'Colecionador', 'Chegue a 5 versões salvas (camadas ou fotos).',
            'criacao', $total, 5, 'efe_confete', $total >= 5 ? $enesimo(5) : null),
        $c('colecionador_25', 'Colecionador Sênior', 'Chegue a 25 versões salvas.',
            'criacao', $total, 25, null, $total >= 25 ? $enesimo(25) : null),
        $c('colecionador_50', 'Arquivo Vivo', 'Chegue a 50 versões salvas.',
            'criacao', $total, 50, null, $total >= 50 ? $enesimo(50) : null),
        $c('centuriao_100', 'Centurião', '100 versões salvas — a poda respeita as fixadas.',
            'criacao', $total, 100, 'mol_glitch', $total >= 100 ? $enesimo(100) : null),
        $c('fotografo', 'Fotogênico', 'Use uma foto real como avatar pelo menos uma vez.',
            'criacao', $fotos, 1),
        $c('estilista', 'Estilista', 'Salve uma FOTO ESTILIZADA (fundo, moldura, título…).',
            'criacao', $estilizadas, 1),
        $c('tridimensional', 'Tridimensional', 'Salve um avatar vindo do Estúdio 3D.',
            'criacao', $tresD, 1),
        $c('multiverso', 'Multiverso', 'Tenha versões nos 3 formatos: camadas, foto e 3D.',
            'criacao', $formatos, 3),

        // ── EXPLORAÇÃO ───────────────────────────────────────────────
        $c('explorador_25', 'Explorador', 'Use 25 itens diferentes do catálogo.',
            'exploracao', count($idsUsados), 25),
        $c('explorador_60', 'Cartógrafo', 'Use 60 itens diferentes do catálogo.',
            'exploracao', count($idsUsados), 60, 'ace_capa_heroica'),
        $c('explorador_100', 'Enciclopédia Viva', 'Use 100 itens diferentes do catálogo.',
            'exploracao', count($idsUsados), 100),
        $c('todas_as_frentes', 'Todas as Frentes', 'Use 10 categorias diferentes de item.',
            'exploracao', count($categoriasUsadas), 10),
        $c('lenda_viva', 'Toque Lendário', 'Use 3 itens lendários (ou acima) diferentes.',
            'exploracao', $lendariosUsados, 3),
        $c('camaleao', 'Camaleão', 'Experimente 5 rostos/espécies diferentes.',
            'exploracao', count($basesUsadas), 5),
        $c('poderoso', 'Presença Total', 'Salve com aura + banner + emblema juntos.',
            'exploracao', $poderoso ? 1 : 0, 1),
        $c('tres_slots', 'Equipado até os Dentes', 'Salve com 3 acessórios simultâneos.',
            'exploracao', $tresSlots ? 1 : 0, 1),
        $c('com_titulo', 'Assinatura Própria', 'Salve um avatar com um TÍTULO escolhido.',
            'exploracao', $usouTitulo ? 1 : 0, 1),

        // ── COLEÇÃO ──────────────────────────────────────────────────
        $c('colecao_completa', 'Primeira Estante', 'Complete uma coleção inteira.',
            'colecao', $colecoesCompletas, 1),
        $c('curador', 'Curador', 'Complete 3 coleções.',
            'colecao', $colecoesCompletas, 3),
        $c('museu', 'Museu Particular', 'Complete 6 coleções.',
            'colecao', $colecoesCompletas, 6),
        $c('favoritador_10', 'Gosto Refinado', 'Marque 10 itens como favoritos.',
            'colecao', $favoritos, 10),
        $c('favoritador_25', 'Colecionador de Estrelas', 'Marque 25 itens como favoritos.',
            'colecao', $favoritos, 25, 'efe_moedas'),
        $c('chaveiro', 'Chaveiro', 'Registre 3 desbloqueios (conquistas, eventos, admin…).',
            'colecao', $desbloqueiosReg, 3),

        // ── DEDICAÇÃO ────────────────────────────────────────────────
        $c('veterano_30d', 'Veterano', 'Complete 30 dias de casa no Dshow Dash.',
            'dedicacao', $diasCasa, 30, 'ace_medalha',
            $diasCasa >= 30 && $contaEm !== '' ? date('Y-m-d H:i:s', strtotime($contaEm . ' +30 days')) : null),
        $c('madrugador', 'Madrugador', 'Salve um avatar entre 5h e 9h da manhã.',
            'dedicacao', min($madrugadas, 1), 1),
        $c('identidade_fiel', 'Identidade Fiel', 'Mantenha o mesmo avatar por 7 dias seguidos.',
            'dedicacao', min($diasFiel, 7), 7),
        $c('assiduo_7', 'Presença Semanal', 'Salve avatares em 7 dias diferentes.',
            'dedicacao', $dias, 7),
        $c('assiduo_30', 'Ritual Diário', 'Salve avatares em 30 dias diferentes.',
            'dedicacao', $dias, 30, 'emb_fenix'),

        // ── MAESTRIA ─────────────────────────────────────────────────
        $c('arquivista', 'Arquivista', 'Nomeie ou fixe 3 versões no Histórico.',
            'maestria', $arquivadas, 3),
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
