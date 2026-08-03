<?php
declare(strict_types=1);

/**
 * /api/avatar/estado.php — API DE ESTADO do Avatar Studio 5.0 (AS5 F1, §619).
 * @version 1.0.0  @created 2026-07-31
 *
 * Opera as tabelas NOVAS (§610–§612) ao lado do studio.php legado — o corte
 * do front chega atrás de flag; até lá isto é infra pronta e testável.
 *
 *   GET                       → { perfil, estado, versoes[≤50] } (perfil é
 *                               criado LAZY na 1ª chamada do usuário)
 *   POST {draft:{...}}        → upsert do estado editável (§611) c/ lock
 *                               otimista (checksum_base) — 409 se divergir
 *   POST {salvar:{resumo?, publicar?}} → snapshot imutável em
 *                               avatar_state_versions (§612), versão N+1
 *   POST {restaurar:{versao}} → volta o estado ao snapshot (nova versão
 *                               com source='restauracao')
 *
 * SEGURANÇA (herança integral do studio.php): posse SEMPRE pela sessão,
 * CSRF na escrita, domínios JSON com teto de tamanho e chaves whitelist,
 * schema_version obrigatório. Auditoria §656: toda versão registra
 * source/created_by; escrita idempotente por checksum (repetir o mesmo
 * save não cria versão duplicada).
 */
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'POST', 'OPTIONS'], 'no_cache' => true]);
$metodo = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($metodo, ['GET', 'POST'], true)) {
    header('Allow: GET, POST, OPTIONS');
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}
SessionGate::start();
if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}
$userId = (int) SessionGate::getUserId();

const AVEST_DOMINIOS = ['identity', 'body', 'appearance', 'equipment',
    'presentation', 'environment', 'animation', 'renderer'];
const AVEST_MAX_DOMINIO = 16384;   // 16KB por domínio — teto §611.1
const AVEST_MAX_VERSOES_LISTA = 50;

function avest_responder(bool $ok, ?array $dados, array $meta = [], array $erros = [], int $http = 200): void
{
    http_response_code($http);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => $ok, 'data' => $dados,
        'meta' => $meta + ['endpoint' => 'avatar/estado', 'version' => '1.0.0'],
        'errors' => $erros, 'traceId' => bin2hex(random_bytes(8))],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function avest_erro(string $codigo, string $msg, int $http = 400): void
{
    avest_responder(false, null, [], [['code' => $codigo, 'message' => $msg]], $http);
}

/** checksum curto e determinístico do estado (mesma família do front). */
function avest_checksum(array $estado): string
{
    ksort($estado);
    return substr(hash('crc32b', json_encode($estado, JSON_UNESCAPED_UNICODE) ?: ''), 0, 8);
}

/** valida e normaliza os domínios vindos do cliente (fail-closed). */
function avest_dominios(array $bruto): array
{
    $saida = [];
    foreach (AVEST_DOMINIOS as $dom) {
        $valor = $bruto[$dom] ?? null;
        if ($valor === null) { $saida[$dom] = null; continue; }
        if (!is_array($valor)) avest_erro('DOMINIO_INVALIDO', "Domínio {$dom} deve ser objeto.");
        $json = json_encode($valor, JSON_UNESCAPED_UNICODE);
        if ($json === false || strlen($json) > AVEST_MAX_DOMINIO) {
            avest_erro('DOMINIO_GRANDE', "Domínio {$dom} excede o limite.");
        }
        $saida[$dom] = $valor;
    }
    return $saida;
}

/** perfil do usuário (cria LAZY na 1ª chamada — §610). */
function avest_perfil(PDO $pdo, int $userId): array
{
    $st = $pdo->prepare("SELECT * FROM avatar_profiles WHERE user_id = ? AND status = 'active' AND deleted_at IS NULL ORDER BY id LIMIT 1");
    $st->execute([$userId]);
    $p = $st->fetch(PDO::FETCH_ASSOC);
    if ($p) return $p;
    $pdo->prepare('INSERT INTO avatar_profiles (user_id) VALUES (?)')->execute([$userId]);
    $st->execute([$userId]);
    return $st->fetch(PDO::FETCH_ASSOC);
}

function avest_estado_linha(PDO $pdo, int $perfilId): ?array
{
    $st = $pdo->prepare('SELECT * FROM avatar_states WHERE avatar_profile_id = ? ORDER BY id LIMIT 1');
    $st->execute([$perfilId]);
    $l = $st->fetch(PDO::FETCH_ASSOC);
    return $l ?: null;
}

function avest_estado_de_linha(?array $l): ?array
{
    if (!$l) return null;
    $estado = ['schemaVersion' => (int) $l['schema_version']];
    foreach (AVEST_DOMINIOS as $dom) {
        $estado[$dom] = isset($l[$dom . '_json']) && $l[$dom . '_json'] !== null
            ? json_decode((string) $l[$dom . '_json'], true) : null;
    }
    return $estado;
}

try {
    $pdo = getConnection('DSHOWDASH');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // ── GET: perfil + estado + versões ──────────────────────────────
    if ($metodo === 'GET') {
        session_write_close();
        $perfil = avest_perfil($pdo, $userId);
        $linha = avest_estado_linha($pdo, (int) $perfil['id']);
        $st = $pdo->prepare('SELECT version_number, change_summary, source, is_published, checksum, created_at
                             FROM avatar_state_versions WHERE avatar_profile_id = ?
                             ORDER BY version_number DESC LIMIT ' . AVEST_MAX_VERSOES_LISTA);
        $st->execute([(int) $perfil['id']]);
        avest_responder(true, [
            'perfil' => ['id' => (int) $perfil['id'], 'nome' => $perfil['name'],
                'renderer' => $perfil['preferred_renderer'], 'visibilidade' => $perfil['visibility']],
            'estado' => avest_estado_de_linha($linha),
            'checksum' => $linha['checksum'] ?? null,
            'versoes' => $st->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    // ── POST (escrita): CSRF obrigatório ────────────────────────────
    requireCsrf();
    $corpo = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($corpo)) avest_erro('JSON_INVALIDO', 'Corpo inválido.');

    $perfil = avest_perfil($pdo, $userId);
    $perfilId = (int) $perfil['id'];

    // — draft: upsert com lock otimista por checksum_base (§619.1) —
    if (isset($corpo['draft'])) {
        $draft = is_array($corpo['draft']) ? $corpo['draft'] : [];
        $schema = (int) ($draft['schemaVersion'] ?? 0);
        if ($schema < 1 || $schema > 99) avest_erro('SCHEMA_INVALIDO', 'schemaVersion obrigatório.');
        $dominios = avest_dominios($draft);
        $estadoCompleto = ['schemaVersion' => $schema] + $dominios;
        $novoChecksum = avest_checksum($estadoCompleto);

        $linha = avest_estado_linha($pdo, $perfilId);
        $base = (string) ($corpo['checksum_base'] ?? '');
        if ($linha && $base !== '' && $base !== $linha['checksum']) {
            avest_erro('CONFLITO', 'O estado mudou em outra aba — recarregue.', 409);
        }
        $campos = [];
        $par = [];
        foreach (AVEST_DOMINIOS as $dom) {
            $campos[] = $dom . '_json = ?';
            $par[] = $dominios[$dom] === null ? null : json_encode($dominios[$dom], JSON_UNESCAPED_UNICODE);
        }
        if ($linha) {
            $par2 = array_merge([$schema], $par, [$novoChecksum, (int) $linha['id']]);
            $pdo->prepare('UPDATE avatar_states SET schema_version = ?, ' . implode(', ', $campos)
                . ', checksum = ? WHERE id = ?')->execute($par2);
        } else {
            $cols = implode(', ', array_map(static fn ($d) => $d . '_json', AVEST_DOMINIOS));
            $par2 = array_merge([$perfilId, $schema], $par, [$novoChecksum]);
            $pdo->prepare('INSERT INTO avatar_states (avatar_profile_id, schema_version, ' . $cols
                . ', checksum) VALUES (?, ?' . str_repeat(', ?', count(AVEST_DOMINIOS)) . ', ?)')->execute($par2);
        }
        avest_responder(true, ['checksum' => $novoChecksum]);
    }

    // — salvar: snapshot imutável §612 (idempotente por checksum) —
    if (isset($corpo['salvar'])) {
        $op = is_array($corpo['salvar']) ? $corpo['salvar'] : [];
        $linha = avest_estado_linha($pdo, $perfilId);
        if (!$linha) avest_erro('SEM_ESTADO', 'Nenhum draft para salvar.');
        $estado = avest_estado_de_linha($linha);
        $checksum = (string) $linha['checksum'];

        $st = $pdo->prepare('SELECT version_number FROM avatar_state_versions
                             WHERE avatar_profile_id = ? AND checksum = ? ORDER BY version_number DESC LIMIT 1');
        $st->execute([$perfilId, $checksum]);
        $repetida = $st->fetchColumn();
        if ($repetida !== false) {
            avest_responder(true, ['versao' => (int) $repetida, 'reaproveitada' => true]);
        }

        $st = $pdo->prepare('SELECT COALESCE(MAX(version_number), 0) FROM avatar_state_versions WHERE avatar_profile_id = ?');
        $st->execute([$perfilId]);
        $proxima = ((int) $st->fetchColumn()) + 1;
        $resumo = mb_substr(trim((string) ($op['resumo'] ?? '')), 0, 160) ?: null;
        $publicar = !empty($op['publicar']);

        $pdo->prepare('INSERT INTO avatar_state_versions
            (avatar_profile_id, state_snapshot_json, schema_version, version_number, change_summary, created_by, source, is_published, checksum)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute([$perfilId, json_encode($estado, JSON_UNESCAPED_UNICODE), (int) $linha['schema_version'],
                $proxima, $resumo, $userId, 'manual', $publicar ? 1 : 0, $checksum]);
        if ($publicar) {
            $pdo->prepare('UPDATE avatar_state_versions SET is_published = 0
                           WHERE avatar_profile_id = ? AND version_number <> ?')->execute([$perfilId, $proxima]);
            $pdo->prepare('UPDATE avatar_profiles SET published_version_id =
                           (SELECT id FROM avatar_state_versions WHERE avatar_profile_id = ? AND version_number = ?)
                           WHERE id = ?')->execute([$perfilId, $proxima, $perfilId]);
        }
        avest_responder(true, ['versao' => $proxima, 'reaproveitada' => false]);
    }

    // — restaurar: snapshot → estado atual + versão source='restauracao' —
    if (isset($corpo['restaurar'])) {
        $alvo = (int) (($corpo['restaurar']['versao'] ?? 0));
        if ($alvo < 1) avest_erro('VERSAO_INVALIDA', 'Informe a versão.');
        $st = $pdo->prepare('SELECT state_snapshot_json, schema_version, checksum FROM avatar_state_versions
                             WHERE avatar_profile_id = ? AND version_number = ? LIMIT 1');
        $st->execute([$perfilId, $alvo]);
        $v = $st->fetch(PDO::FETCH_ASSOC);
        if (!$v) avest_erro('NAO_ENCONTRADA', 'Versão inexistente.', 404);
        $estado = json_decode((string) $v['state_snapshot_json'], true);
        if (!is_array($estado)) avest_erro('SNAPSHOT_CORROMPIDO', 'Snapshot ilegível.', 500);

        $dominios = avest_dominios($estado);
        $linha = avest_estado_linha($pdo, $perfilId);
        $campos = [];
        $par = [];
        foreach (AVEST_DOMINIOS as $dom) {
            $campos[] = $dom . '_json = ?';
            $par[] = $dominios[$dom] === null ? null : json_encode($dominios[$dom], JSON_UNESCAPED_UNICODE);
        }
        if ($linha) {
            $pdo->prepare('UPDATE avatar_states SET schema_version = ?, ' . implode(', ', $campos)
                . ', checksum = ? WHERE id = ?')
                ->execute(array_merge([(int) $v['schema_version']], $par, [(string) $v['checksum'], (int) $linha['id']]));
        }
        $st = $pdo->prepare('SELECT COALESCE(MAX(version_number), 0) FROM avatar_state_versions WHERE avatar_profile_id = ?');
        $st->execute([$perfilId]);
        $proxima = ((int) $st->fetchColumn()) + 1;
        $pdo->prepare('INSERT INTO avatar_state_versions
            (avatar_profile_id, state_snapshot_json, schema_version, version_number, change_summary, created_by, source, checksum)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute([$perfilId, (string) $v['state_snapshot_json'], (int) $v['schema_version'],
                $proxima, "Restaurada da versão {$alvo}", $userId, 'restauracao', (string) $v['checksum']]);
        avest_responder(true, ['versao' => $proxima, 'restauradaDe' => $alvo]);
    }

    avest_erro('OPERACAO_INVALIDA', 'Use draft, salvar ou restaurar.');
} catch (Throwable $e) {
    error_log('[avatar/estado] ' . $e->getMessage());
    avest_erro('ERRO_INTERNO', 'Não foi possível processar o estado agora.', 500);
}
