<?php
declare(strict_types=1);

/**
 * /api/avatar/vitrine.php — vitrine do Avatar Studio.
 * @version 2.0.0  @created 2026-07-30  @updated 2026-07-30 (briefing 4.6 §23, decisão #42)
 *
 * v2 — a vitrine deixa de ser só o leaderboard e vira a HOME do catálogo:
 * GET → { equipe: [...], secoes: [ {id, nome, descricao, itens[]} ] }.
 *
 * Seções calculadas SERVER-SIDE a partir do catálogo normalizado (Trilha A):
 *   destaques (is_featured + raridade), novidades (published_at), colecoes,
 *   eventos (unlock_rules event + janela ativa via VidaLib), mais_usados
 *   (agregado dos avatares ATIVOS — dado auditável), raros (level >= 4),
 *   dshow_originals, em_alta (favoritos recentes), recomendados (rotação
 *   determinística por usuário+dia) e recem_desbloqueados (do usuário).
 *
 * GRACIOSO: qualquer seção que falhe (catálogo não migrado no ambiente) é
 * OMITIDA — a tela nunca quebra. Ids internos não vazam (chave pública = key).
 * Mantém 'vitrine' como alias de 'equipe' para clientes com JS antigo em cache.
 */
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/VidaLib.php';

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

/** SELECT base dos itens de seção (sempre os MESMOS campos públicos). */
const AVST_VT_CAMPOS = "a.`key`, a.name AS nome, c.`key` AS categoria, r.`key` AS raridade";
const AVST_VT_JOINS = ' FROM avatar_assets a
    JOIN avatar_categories c ON c.id = a.category_id
    JOIN avatar_rarities  r ON r.id = a.rarity_id';
const AVST_VT_PUBLICADO = " a.status = 'published' AND a.is_active = 1 ";

/** Executa uma query de seção; falhou (catálogo ausente) → []. */
function avst_vt_itens(PDO $pdo, string $sql, array $binds = []): array
{
    try {
        $st = $pdo->prepare($sql);
        $st->execute($binds);
        $saida = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $l) {
            $item = [
                'key' => (string) $l['key'],
                'nome' => (string) $l['nome'],
                'categoria' => (string) $l['categoria'],
                'raridade' => (string) $l['raridade'],
            ];
            foreach (['usos', 'favs'] as $extra) {
                if (isset($l[$extra])) {
                    $item[$extra] = (int) $l[$extra];
                }
            }
            if (isset($l['evento'])) {
                $item['evento'] = (string) $l['evento'];
            }
            $saida[] = $item;
        }
        return $saida;
    } catch (Throwable $e) {
        return [];
    }
}

try {
    $pdo = getConnection('DSHOWDASH');

    // ── Leaderboard da equipe (v1, inalterado — coleção, nunca produtividade) ─
    $equipe = [];
    $st = $pdo->query("
        SELECT u.id, u.username, a.avatar_image_url AS url, a.updated_at,
               (SELECT COUNT(*) FROM app_user_avatars x
                 WHERE x.user_id = u.id AND x.avatar_type IN ('generated','image')) AS versoes
        FROM app_user_avatars a
        JOIN app_users u ON u.id = a.user_id AND u.deleted_at IS NULL
        WHERE a.is_active = 1
          AND a.avatar_type IN ('generated','image')
          AND a.avatar_image_url IS NOT NULL
        ORDER BY versoes DESC, a.updated_at DESC
        LIMIT 12
    ");
    foreach ($st as $l) {
        $equipe[] = [
            'usuario' => (string) $l['username'],
            'url' => (string) $l['url'],
            'versoes' => (int) $l['versoes'],
            'atualizado_em' => (string) $l['updated_at'],
            'sou_eu' => ((int) $l['id']) === $userId,
        ];
    }

    // ── Seções do catálogo (briefing 4.6 §23) ────────────────────────────────
    $secoes = [];
    $add = static function (string $id, string $nome, string $desc, array $itens) use (&$secoes): void {
        if ($itens !== []) {
            $secoes[] = ['id' => $id, 'nome' => $nome, 'descricao' => $desc, 'itens' => $itens];
        }
    };

    // 1. Destaques — curadoria: featured primeiro, depois peso de raridade.
    $add('destaques', 'Destaques', 'A curadoria da casa: o melhor do catálogo agora.',
        avst_vt_itens($pdo, 'SELECT ' . AVST_VT_CAMPOS . AVST_VT_JOINS . '
            WHERE' . AVST_VT_PUBLICADO . '
            ORDER BY a.is_featured DESC, r.level DESC, a.published_at DESC, a.sort_order
            LIMIT 10'));

    // 2. Novidades — o que entrou por último no catálogo.
    $add('novidades', 'Novidades', 'Acabaram de chegar ao estúdio.',
        avst_vt_itens($pdo, 'SELECT ' . AVST_VT_CAMPOS . AVST_VT_JOINS . '
            WHERE' . AVST_VT_PUBLICADO . '
            ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.id DESC
            LIMIT 10'));

    // 3. Eventos — itens de janela sazonal + estado da janela (VidaLib).
    $eventosAtivos = [];
    foreach (vida_eventos() as $ev) {
        if (!empty($ev['ativo'])) {
            $eventosAtivos[] = (string) $ev['id'];
        }
    }
    $itensEvento = avst_vt_itens($pdo, 'SELECT DISTINCT ' . AVST_VT_CAMPOS . ', ur.reference_id AS evento
        ' . AVST_VT_JOINS . '
        JOIN avatar_unlock_rules ur ON ur.asset_id = a.id
        WHERE' . AVST_VT_PUBLICADO . " AND ur.unlock_type = 'event'
        ORDER BY r.level DESC");
    foreach ($itensEvento as &$ie) {
        $ie['evento_ativo'] = in_array($ie['evento'] ?? '', $eventosAtivos, true);
    }
    unset($ie);
    $add('eventos', 'Eventos', 'Itens de janela sazonal — fora da janela, ficam trancados.', $itensEvento);

    // 4. Mais usados — agregado dos avatares ATIVOS (auditável; só camadas 2D).
    $usos = [];
    try {
        $st = $pdo->query("SELECT avatar_config FROM app_user_avatars
            WHERE is_active = 1 AND avatar_type = 'generated' AND avatar_config IS NOT NULL
            LIMIT 500");
        foreach ($st as $l) {
            $json = (string) $l['avatar_config'];
            if (strpos($json, '"formato":"3d"') !== false) {
                continue; // config 3D tem outro vocabulário de ids
            }
            $cfg = json_decode($json, true);
            if (!is_array($cfg)) {
                continue;
            }
            $ids = [];
            if (isset($cfg['base']) && is_string($cfg['base'])) {
                $ids[] = $cfg['base'];
            }
            if (isset($cfg['titulo']) && is_string($cfg['titulo'])) {
                $ids[] = $cfg['titulo'];
            }
            foreach ((array) ($cfg['camadas'] ?? []) as $id) {
                if (is_string($id)) {
                    $ids[] = $id;
                }
            }
            foreach ($ids as $id) {
                $usos[$id] = ($usos[$id] ?? 0) + 1;
            }
        }
    } catch (Throwable $e) {
        $usos = [];
    }
    $maisUsados = [];
    if ($usos !== []) {
        arsort($usos);
        $top = array_slice($usos, 0, 10, true);
        $marc = implode(',', array_fill(0, count($top), '?'));
        $porKey = [];
        foreach (avst_vt_itens($pdo, 'SELECT ' . AVST_VT_CAMPOS . AVST_VT_JOINS . "
            WHERE a.`key` IN ($marc)", array_keys($top)) as $item) {
            $porKey[$item['key']] = $item;
        }
        foreach ($top as $key => $qtd) { // preserva a ordem do ranking
            if (isset($porKey[$key])) {
                $porKey[$key]['usos'] = (int) $qtd;
                $maisUsados[] = $porKey[$key];
            }
        }
    }
    $add('mais_usados', 'Mais usados', 'O que o time mais está vestindo agora.', $maisUsados);

    // 5. Raros — só o topo da pirâmide (lendário, mítico, exclusivo).
    $add('raros', 'Raros', 'Lendários para cima — os itens mais difíceis de ver por aí.',
        avst_vt_itens($pdo, 'SELECT ' . AVST_VT_CAMPOS . AVST_VT_JOINS . '
            WHERE' . AVST_VT_PUBLICADO . ' AND r.level >= 4
            ORDER BY r.level DESC, a.sort_order
            LIMIT 10'));

    // 6. Dshow Originals — assinatura da casa (marca no id ou raridade exclusiva).
    $add('dshow_originals', 'Dshow Originals', 'Feitos aqui dentro, com a assinatura da casa.',
        avst_vt_itens($pdo, 'SELECT ' . AVST_VT_CAMPOS . AVST_VT_JOINS . "
            WHERE" . AVST_VT_PUBLICADO . " AND (a.`key` LIKE '%dshow%' OR r.`key` = 'exclusivo')
            ORDER BY r.level DESC, a.sort_order
            LIMIT 10"));

    // 7. Em alta — favoritos dos últimos 14 dias (fallback: todos os tempos).
    // GROUP BY explícito em TODAS as colunas não agregadas — compatível com
    // ONLY_FULL_GROUP_BY (MariaDB não infere dependência funcional da PK).
    $grpItem = ' GROUP BY a.`key`, a.name, c.`key`, r.`key` ';
    $emAlta = avst_vt_itens($pdo, 'SELECT ' . AVST_VT_CAMPOS . ', COUNT(*) AS favs
        ' . AVST_VT_JOINS . '
        JOIN avatar_user_favorites f ON f.asset_id = a.id
        WHERE' . AVST_VT_PUBLICADO . ' AND f.created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
        ' . $grpItem . ' ORDER BY favs DESC LIMIT 10');
    if ($emAlta === []) {
        $emAlta = avst_vt_itens($pdo, 'SELECT ' . AVST_VT_CAMPOS . ', COUNT(*) AS favs
            ' . AVST_VT_JOINS . '
            JOIN avatar_user_favorites f ON f.asset_id = a.id
            WHERE' . AVST_VT_PUBLICADO . '
            ' . $grpItem . ' ORDER BY favs DESC LIMIT 10');
    }
    $add('em_alta', 'Em alta', 'Os favoritos que mais cresceram no time.', $emAlta);

    // 8. Recomendados — rotação DETERMINÍSTICA por usuário+dia (reproduzível),
    //    excluindo o que a pessoa já favoritou (novidade de verdade para ela).
    $semente = crc32($userId . '|' . date('Y-m-d')) % 1000000;
    $add('recomendados', 'Para você', 'Uma rodada nova por dia — sem repetir seus favoritos.',
        avst_vt_itens($pdo, 'SELECT ' . AVST_VT_CAMPOS . AVST_VT_JOINS . "
            WHERE" . AVST_VT_PUBLICADO . "
              AND a.id NOT IN (SELECT f.asset_id FROM avatar_user_favorites f WHERE f.user_id = ?)
            ORDER BY RAND($semente)
            LIMIT 10", [$userId]));

    // 9. Recém-desbloqueados — conquistas/eventos/admin DESTE usuário.
    $add('recem_desbloqueados', 'Recém-desbloqueados', 'O que você destravou por último.',
        avst_vt_itens($pdo, 'SELECT ' . AVST_VT_CAMPOS . AVST_VT_JOINS . '
            JOIN avatar_user_unlocks uu ON uu.asset_id = a.id
            WHERE uu.user_id = ?
            ORDER BY uu.unlocked_at DESC
            LIMIT 10', [$userId]));

    // ── Coleções (cards próprios — ação "abrir coleção") ─────────────────────
    $colecoes = [];
    try {
        $st = $pdo->query("SELECT col.`key`, col.name AS nome, col.description AS descricao,
                   COALESCE(r.`key`, 'raro') AS raridade, COUNT(ci.asset_id) AS total
            FROM avatar_collections col
            LEFT JOIN avatar_rarities r ON r.id = col.rarity_id
            LEFT JOIN avatar_collection_items ci ON ci.collection_id = col.id
            WHERE col.status = 'published'
            GROUP BY col.`key`, col.name, col.description, r.`key`, r.level, col.is_featured
            ORDER BY col.is_featured DESC, r.level DESC, col.name
            LIMIT 8");
        foreach ($st as $l) {
            $colecoes[] = [
                'key' => (string) $l['key'],
                'nome' => (string) $l['nome'],
                'descricao' => (string) ($l['descricao'] ?? ''),
                'raridade' => (string) $l['raridade'],
                'total' => (int) $l['total'],
            ];
        }
    } catch (Throwable $e) {
        $colecoes = [];
    }

    session_write_close();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'data' => [
        'equipe' => $equipe,
        'vitrine' => $equipe, // compat: clientes com JS v1 em cache
        'secoes' => $secoes,
        'colecoes' => $colecoes,
        'eventos_ativos' => $eventosAtivos,
    ], 'error' => null,
        'meta' => ['endpoint' => 'avatar/vitrine', 'version' => '2.0.0']], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    error_log('[avatar/vitrine.php] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'data' => null, 'error' => 'ERRO_INTERNO']);
}
