<?php
declare(strict_types=1);

/**
 * /api/ponte/PonteV2Core.php — núcleo da PONTE v2 servidor-a-servidor do APP DSHOW (Programa PARIDADE TOTAL, ADR-013, W1).
 * Generaliza api/avatar/PonteCore.php: MESMO transporte (PonteAuth: loopback + HMAC ts/nonce/sig, segredo 0600) e o que a v1 não tinha:
 *   contrato {user_id, modulo, acao, payload, request_id, contexto?} · ALLOWLIST explícita (Allowlist.php) · flags por módulo e tipo
 *   (`ponte.v2` geral antes do HMAC → inerte; `ponte.<modulo>.<tipo>` por ação) · user_id validado (app_users ativo) · autorização por NÍVEL
 *   REAL (MAX(app_roles.level), nunca o UARPS que libera por padrão) · idempotência em TABELA (app_ponte_ops: replay devolve a mesma
 *   resposta; corpo diferente → 409; em andamento → 409) · auditoria em app_audit_log (AuditLogger) E app_audit_trail (painel) ·
 *   catálogo de erros estável. index.php só liga HTTP ↔ pv2_executar(); tudo aqui é testável sem HTTP (scripts/ponte/testes/).
 */
require_once __DIR__ . '/../avatar/PonteAuth.php';
require_once __DIR__ . '/PonteErro.php';
require_once __DIR__ . '/Allowlist.php';
require_once __DIR__ . '/../core/AuditLogger.php';
require_once __DIR__ . '/../core/repositories/UserRolesRepository.php';

const PV2_VERSAO = '2.0.0';
const PV2_FLAG_GERAL = 'ponte.v2';
const PV2_CORPO_MAX = 262_144;      // 256 KB — nenhuma ação da W1 carrega mais que alguns KB
const PV2_EM_ANDAMENTO_S = 60;      // após isso, um pedido "em andamento" pode ser retomado (processo morreu)
const PV2_REQUEST_ID_RE = '/^[A-Za-z0-9_-]{16,64}$/';

function pv2_envelope(bool $ok, ?array $data, ?string $erro, array $meta = []): array
{
    return ['ok' => $ok, 'data' => $data, 'error' => $erro, 'meta' => $meta + ['endpoint' => 'ponte', 'version' => PV2_VERSAO]];
}

/** Linha única de log por pedido (grep PV2_PONTE) — sem payload, sem dados pessoais. */
function pv2_log(int $userId, string $modulo, string $acao, string $reqId, int $status, string $erro = ''): void
{
    error_log(sprintf('PV2_PONTE user=%d modulo=%s acao=%s req=%s status=%d%s', $userId, preg_replace('/[^a-z_]/', '', $modulo),
        preg_replace('/[^a-z_]/', '', $acao), preg_replace('/[^A-Za-z0-9_-]/', '', $reqId), $status, $erro !== '' ? " erro=$erro" : ''));
}

/** Flag server-side pelo resolver do Dash; ausência de arquivo/tabela/erro = DESLIGADA (fail-closed). Rollout tem de ser 100 (userId null). */
function pv2_flag(PDO $pdo, string $chave, ?string $resolverArquivo = null): bool
{
    $resolver = $resolverArquivo ?? (__DIR__ . '/../feature-flags/resolver.php');
    if (!is_file($resolver)) {
        return false;
    }
    try {
        require_once $resolver;
        $r = new FeatureFlagResolver($pdo);
        return (($r->resolve($chave, null)['enabled'] ?? false) === true);
    } catch (Throwable $e) {
        return false;
    }
}

/** Usuário do Dash ativo? (status = 'active' e não excluído) — a ponte NUNCA confia só no número que o app mandou. */
function pv2_usuario_ativo(PDO $pdo, int $userId): bool
{
    $st = $pdo->prepare('SELECT id, status, deleted_at FROM app_users WHERE id = ?');
    $st->execute([$userId]);
    $u = $st->fetch(PDO::FETCH_ASSOC);
    return is_array($u) && ($u['status'] ?? '') === 'active' && ($u['deleted_at'] ?? null) === null;
}

/** Nível real = MAX(app_roles.level) (mesma regra do login do Dash e do token do app); sem papel = 0. */
function pv2_nivel(PDO $pdo, int $userId): int
{
    return (new UserRolesRepository($pdo))->getUserMaxLevel($userId);
}

/**
 * Idempotência: reserva (user_id, request_id) em app_ponte_ops.
 * @return array{estado:'novo'|'replay'|'divergente'|'em_andamento', status?:int, envelope?:array}
 */
function pv2_idem_iniciar(PDO $pdo, int $userId, string $reqId, string $modulo, string $acao, string $hash, int $agora): array
{
    $ins = $pdo->prepare('INSERT IGNORE INTO app_ponte_ops (user_id, request_id, modulo, acao, corpo_hash, status, criado_em) VALUES (?, ?, ?, ?, ?, 0, FROM_UNIXTIME(?))');
    $ins->execute([$userId, $reqId, $modulo, $acao, $hash, $agora]);
    if ($ins->rowCount() > 0) {
        return ['estado' => 'novo'];
    }
    $sel = $pdo->prepare('SELECT corpo_hash, status, resposta_json, UNIX_TIMESTAMP(criado_em) AS criado FROM app_ponte_ops WHERE user_id = ? AND request_id = ?');
    $sel->execute([$userId, $reqId]);
    $r = $sel->fetch(PDO::FETCH_ASSOC);
    if (!is_array($r)) {
        return ['estado' => 'novo'];   // corrida improvável: linha sumiu entre o INSERT e o SELECT
    }
    if (!hash_equals((string)$r['corpo_hash'], $hash)) {
        return ['estado' => 'divergente'];
    }
    if ((int)$r['status'] === 0) {
        $retoma = $pdo->prepare('UPDATE app_ponte_ops SET criado_em = FROM_UNIXTIME(?) WHERE user_id = ? AND request_id = ? AND status = 0 AND criado_em < FROM_UNIXTIME(?)');
        $retoma->execute([$agora, $userId, $reqId, $agora - PV2_EM_ANDAMENTO_S]);
        return ['estado' => $retoma->rowCount() > 0 ? 'novo' : 'em_andamento'];
    }
    $env = json_decode((string)$r['resposta_json'], true);
    return ['estado' => 'replay', 'status' => (int)$r['status'], 'envelope' => is_array($env) ? $env : pv2_envelope(false, null, 'ERRO_INTERNO')];
}

function pv2_idem_concluir(PDO $pdo, int $userId, string $reqId, int $status, array $envelope): void
{
    if ($status >= 500) {
        // falha transitória: libera a chave para a próxima tentativa
        $pdo->prepare('DELETE FROM app_ponte_ops WHERE user_id = ? AND request_id = ?')->execute([$userId, $reqId]);
        return;
    }
    $pdo->prepare('UPDATE app_ponte_ops SET status = ?, resposta_json = ?, concluido_em = NOW(3) WHERE user_id = ? AND request_id = ?')
        ->execute([$status, json_encode($envelope, JSON_UNESCAPED_UNICODE), $userId, $reqId]);
}

/** Auditoria dupla: app_audit_log (AuditLogger, o que a central de auditoria do núcleo usa) + app_audit_trail (o que o painel Audit Trail lê). */
function pv2_auditar(PDO $pdo, int $userId, string $modulo, string $acao, string $reqId, int $status, ?array $recurso, ?array $antes, ?array $depois, array $ctx): void
{
    $evento = "ponte.$modulo.$acao";
    $tipo = (string)($recurso[0] ?? $modulo);
    $id = $recurso[1] ?? null;
    $contexto = ['request_id' => $reqId, 'status' => $status, 'origem' => 'app-dshow', 'ip_app' => $ctx['ip_app'] ?? null, 'app_versao' => $ctx['app_versao'] ?? null];
    try {
        AuditLogger::log($pdo, $userId, $evento, $tipo, $id, $antes, $depois, $contexto);
    } catch (Throwable $e) {
        error_log('[ponte] auditoria app_audit_log falhou: ' . $e->getMessage());
    }
    try {
        $pdo->prepare('INSERT INTO app_audit_trail (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())')
            ->execute([$userId, $evento, $tipo, $id, $antes ? json_encode($antes) : null, json_encode(($depois ?? []) + ['request_id' => $reqId, 'status' => $status]),
                substr((string)($ctx['ip_app'] ?? '127.0.0.1'), 0, 45), substr('app-dshow/' . (string)($ctx['app_versao'] ?? '?'), 0, 500)]);
    } catch (Throwable $e) {
        error_log('[ponte] auditoria app_audit_trail falhou: ' . $e->getMessage());
    }
}

/**
 * Executa um pedido. Devolve [status HTTP, envelope]. Não escreve saída, não encerra.
 * @param array $amb ambiente injetável (testes): flagGeral?:bool, flagsModulo?:array<string,bool>, segredo?, dirNonces?, agora?, resolver?, usuarioAtivo?:bool, nivel?:int
 */
function pv2_executar(?PDO $pdo, array $server, string $corpo, array $amb = []): array
{
    $metodo = (string)($server['REQUEST_METHOD'] ?? '');
    if ($metodo !== 'POST') {
        return [405, pv2_envelope(false, null, 'METODO')];
    }
    if ($pdo === null) {
        return [503, pv2_envelope(false, null, 'PONTE_INDISPONIVEL')];
    }
    $geral = $amb['flagGeral'] ?? pv2_flag($pdo, PV2_FLAG_GERAL, $amb['resolver'] ?? null);
    if ($geral !== true) {
        return [404, pv2_envelope(false, null, 'NAO_ENCONTRADO')];
    }
    if (strlen($corpo) > PV2_CORPO_MAX) {
        return [413, pv2_envelope(false, null, 'CORPO_GRANDE')];
    }
    $segredo = $amb['segredo'] ?? PonteAuth::segredo();
    if ($segredo === '') {
        error_log('PV2_PONTE segredo indisponível');
        return [503, pv2_envelope(false, null, 'PONTE_INDISPONIVEL')];
    }
    $auth = PonteAuth::validar($server, $corpo, $segredo, $amb['dirNonces'] ?? null, $amb['agora'] ?? null);
    if (!$auth['ok']) {
        error_log('PV2_PONTE recusada motivo=' . $auth['motivo'] . ' ip=' . (string)($server['REMOTE_ADDR'] ?? '?'));
        return [403, pv2_envelope(false, null, 'PONTE_RECUSADA')];
    }

    $pedido = json_decode($corpo, true);
    $userId = is_array($pedido) ? (int)($pedido['user_id'] ?? 0) : 0;
    $modulo = is_array($pedido) && is_string($pedido['modulo'] ?? null) ? $pedido['modulo'] : '';
    $acao = is_array($pedido) && is_string($pedido['acao'] ?? null) ? $pedido['acao'] : '';
    $reqId = is_array($pedido) && is_string($pedido['request_id'] ?? null) ? $pedido['request_id'] : '';
    $payload = is_array($pedido) && is_array($pedido['payload'] ?? null) ? $pedido['payload'] : [];
    $ctx = is_array($pedido) && is_array($pedido['contexto'] ?? null) ? $pedido['contexto'] : [];
    if (!is_array($pedido) || $userId <= 0 || $modulo === '' || $acao === '' || !preg_match(PV2_REQUEST_ID_RE, $reqId)) {
        pv2_log($userId, $modulo, $acao, $reqId, 400, 'PEDIDO_INVALIDO');
        return [400, pv2_envelope(false, null, 'PEDIDO_INVALIDO')];
    }
    $def = PV2_ALLOWLIST[$modulo][$acao] ?? null;
    if ($def === null) {
        pv2_log($userId, $modulo, $acao, $reqId, 400, 'ACAO_INVALIDA');
        return [400, pv2_envelope(false, null, 'ACAO_INVALIDA')];
    }
    $flagModulo = "ponte.$modulo." . $def['tipo'];
    $ligada = $amb['flagsModulo'][$flagModulo] ?? pv2_flag($pdo, $flagModulo, $amb['resolver'] ?? null);
    if ($ligada !== true) {
        pv2_log($userId, $modulo, $acao, $reqId, 404, 'MODULO_DESLIGADO');
        return [404, pv2_envelope(false, null, 'MODULO_DESLIGADO')];
    }

    try {
        $ativo = $amb['usuarioAtivo'] ?? pv2_usuario_ativo($pdo, $userId);
        if ($ativo !== true) {
            pv2_log($userId, $modulo, $acao, $reqId, 403, 'USUARIO_INVALIDO');
            return [403, pv2_envelope(false, null, 'USUARIO_INVALIDO')];
        }
        $nivel = $amb['nivel'] ?? pv2_nivel($pdo, $userId);
        if ($nivel < (int)$def['nivel']) {
            pv2_log($userId, $modulo, $acao, $reqId, 403, 'PERMISSAO_NEGADA');
            return [403, pv2_envelope(false, null, 'PERMISSAO_NEGADA', ['nivel_minimo' => (int)$def['nivel']])];
        }

        $agora = (int)($amb['agora'] ?? time());
        $hash = hash('sha256', $modulo . "\n" . $acao . "\n" . json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        $idem = pv2_idem_iniciar($pdo, $userId, $reqId, $modulo, $acao, $hash, $agora);
        if ($idem['estado'] === 'replay') {
            pv2_log($userId, $modulo, $acao, $reqId, $idem['status'], 'REPLAY');
            $env = $idem['envelope'];
            $env['meta'] = ($env['meta'] ?? []) + ['replay' => true];
            return [$idem['status'], $env];
        }
        if ($idem['estado'] === 'divergente') {
            pv2_log($userId, $modulo, $acao, $reqId, 409, 'IDEMPOTENCIA_DIVERGENTE');
            return [409, pv2_envelope(false, null, 'IDEMPOTENCIA_DIVERGENTE')];
        }
        if ($idem['estado'] === 'em_andamento') {
            pv2_log($userId, $modulo, $acao, $reqId, 409, 'EM_ANDAMENTO');
            return [409, pv2_envelope(false, null, 'EM_ANDAMENTO')];
        }

        $status = 200; $envelope = null;
        try {
            $r = ($def['handler'])($pdo, $userId, $payload);
            $envelope = pv2_envelope(true, $r['data'] ?? [], null);
            pv2_auditar($pdo, $userId, $modulo, $acao, $reqId, 200, $r['recurso'] ?? null, $r['antes'] ?? null, $r['depois'] ?? null, $ctx);
        } catch (PonteErro $e) {
            if ($pdo->inTransaction()) { $pdo->rollBack(); }
            $status = $e->status;
            $envelope = pv2_envelope(false, $e->extra ?: null, $e->codigo);
            pv2_auditar($pdo, $userId, $modulo, $acao, $reqId, $status, null, null, ['erro' => $e->codigo], $ctx);
        }
        pv2_idem_concluir($pdo, $userId, $reqId, $status, $envelope);
        pv2_log($userId, $modulo, $acao, $reqId, $status, $status === 200 ? '' : (string)$envelope['error']);
        return [$status, $envelope];
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) { $pdo->rollBack(); }
        error_log('[ponte] ' . get_class($e) . ': ' . $e->getMessage());
        try { pv2_idem_concluir($pdo, $userId, $reqId, 500, []); } catch (Throwable $e2) { /* já em falha */ }
        pv2_log($userId, $modulo, $acao, $reqId, 500, 'ERRO_INTERNO');
        return [500, pv2_envelope(false, null, 'ERRO_INTERNO')];
    }
}
