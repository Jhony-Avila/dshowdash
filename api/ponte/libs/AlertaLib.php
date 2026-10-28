<?php
declare(strict_types=1);

/**
 * /api/ponte/libs/AlertaLib.php — ações de ESCRITA em alertas do DataTables compartilhadas entre o painel (DtAlertController /
 * DtAdminController) e a Ponte v2 (Programa PARIDADE TOTAL, W1). Regra: UMA implementação; o endpoint web e a ponte chamam a mesma função.
 *
 *  - alerta_reconhecer  → DtAlertService::acknowledge (serviço já existente; nada reimplementado)
 *  - alerta_resolver    → MOVIMENTO TEXTUAL de DtAlertController::resolve (controllers/AlertController.php, v1.0.0): as duas SQL,
 *                         as mensagens e a regra "já resolvido → 409" são as mesmas, byte a byte; `ApiResponse::error(...)` virou
 *                         `throw new PonteErro(...)` e `ApiResponse::success(...)` virou `return`. Prova: scripts/ponte/testes/libs-equivalencia.php
 *  - alerta_silenciar / alerta_dessilenciar → DtAdminRepository::createSilence / deleteSilence (repositório já existente) +
 *                         validação do payload (que no painel é feita pelo próprio repositório/InvalidArgumentException)
 */
require_once __DIR__ . '/../PonteErro.php';
require_once __DIR__ . '/../../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../datatables/services/AlertService.php';
require_once __DIR__ . '/../../datatables/repositories/AdminRepository.php';

/** POST /alerts/{id}/acknowledge (§28.2) — `$by` é o mesmo que o painel grava: o id do usuário como texto. */
function alerta_reconhecer(PDO $pdo, int $userId, int $id): array
{
    $by = (string)$userId;
    $ok = (new DtAlertService($pdo))->acknowledge($id, $by);

    if (!$ok) {
        throw new PonteErro(ApiResponse::ERR_NOT_FOUND, 404, [
            'message' => 'Alerta nao encontrado ou nao esta ativo',
        ]);
    }
    return ['id' => $id, 'acknowledged' => true];
}

/**
 * POST /alerts/{id}/resolve - encerramento MANUAL.
 * O caminho normal e a resolucao automatica quando a condicao deixa de
 * valer; isto cobre o caso em que o operador sabe que ja foi tratado.
 */
function alerta_resolver(PDO $pdo, int $id): array
{
    $sel = $pdo->prepare('SELECT alert_type, target_type, target_id, status FROM DT_Alerta WHERE id = :id');
    $sel->execute([':id' => $id]);
    $row = $sel->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        throw new PonteErro(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Alerta nao encontrado']);
    }
    if ($row['status'] === 'resolved') {
        throw new PonteErro(ApiResponse::ERR_VALIDATION_ERROR, 409, ['message' => 'Alerta ja resolvido']);
    }

    $pdo->prepare('UPDATE DT_Alerta SET status = "resolved", resolved_at = NOW() WHERE id = :id')
        ->execute([':id' => $id]);

    return ['id' => $id, 'resolved' => true];
}

/** Mensagem que o painel devolve ao resolver (mantida aqui para o endpoint e a ponte dizerem a mesma coisa). */
const ALERTA_MSG_RESOLVIDO = 'Alerta resolvido manualmente. Se a condicao persistir, um novo incidente sera aberto no proximo ciclo.';

/**
 * Valida o payload de silêncio (janela diária OU intervalo absoluto) antes de DtAdminRepository::createSilence, que
 * continua sendo quem grava. Formatos: starts_at/ends_at 'Y-m-d H:i:s' (ou ISO 8601), daily_from/daily_to 'H:i' ou 'H:i:s'.
 */
function alerta_silenciar(PDO $pdo, int $userId, array $payload): array
{
    $erros = [];
    $data = [];
    $cid = $payload['connection_id'] ?? null;
    if ($cid !== null && $cid !== '') {
        if (!is_int($cid) && !(is_string($cid) && ctype_digit($cid))) { $erros['connection_id'] = 'inteiro'; }
        else { $data['connection_id'] = (int)$cid; }
    }
    $tipo = $payload['alert_type'] ?? null;
    if ($tipo !== null && $tipo !== '') {
        if (!is_string($tipo) || !preg_match('/^[a-z0-9_]{1,40}$/', $tipo)) { $erros['alert_type'] = 'formato'; }
        else { $data['alert_type'] = $tipo; }
    }
    $dt = static function ($v): ?string {
        if (!is_string($v) || $v === '') { return null; }
        foreach (['Y-m-d H:i:s', 'Y-m-d\TH:i:sP', 'Y-m-d\TH:i:s.vP', 'Y-m-d\TH:i:s\Z'] as $f) {
            $d = DateTimeImmutable::createFromFormat($f, $v);
            if ($d !== false) { return $d->setTimezone(new DateTimeZone('America/Sao_Paulo'))->format('Y-m-d H:i:s'); }
        }
        return null;
    };
    $hora = static function ($v): ?string {
        if (!is_string($v) || !preg_match('/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/', $v)) { return null; }
        return strlen($v) === 5 ? $v . ':00' : $v;
    };
    $sa = $dt($payload['starts_at'] ?? null); $ea = $dt($payload['ends_at'] ?? null);
    $df = $hora($payload['daily_from'] ?? null); $dto = $hora($payload['daily_to'] ?? null);
    $range = $sa !== null && $ea !== null;
    $daily = $df !== null && $dto !== null;
    if (!$range && !$daily) { $erros['janela'] = 'informe starts_at+ends_at ou daily_from+daily_to'; }
    if ($range && $sa >= $ea) { $erros['ends_at'] = 'deve ser depois de starts_at'; }
    if ($range) { $data['starts_at'] = $sa; $data['ends_at'] = $ea; }
    if ($daily) { $data['daily_from'] = $df; $data['daily_to'] = $dto; }
    $reason = $payload['reason'] ?? null;
    if ($reason !== null) {
        if (!is_string($reason)) { $erros['reason'] = 'texto'; } else { $data['reason'] = mb_substr(trim($reason), 0, 255); }
    }
    if ($erros !== []) {
        throw new PonteErro('VALIDACAO', 422, ['campos' => $erros]);
    }
    try {
        $newId = (new DtAdminRepository($pdo))->createSilence($data, (string)$userId);
    } catch (InvalidArgumentException $e) {
        throw new PonteErro('VALIDACAO', 422, ['campos' => ['janela' => $e->getMessage()]]);
    }
    return ['id' => $newId, 'silenced' => true];
}

function alerta_dessilenciar(PDO $pdo, int $id): array
{
    if (!(new DtAdminRepository($pdo))->deleteSilence($id)) {
        throw new PonteErro(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Janela nao encontrada']);
    }
    return ['id' => $id, 'silenced' => false];
}
