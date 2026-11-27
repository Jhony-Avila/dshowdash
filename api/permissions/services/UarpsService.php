<?php
// UarpsService
// @version 1.1.0-ENTERPRISE
// @created 2026-01-21
// @updated 2026-01-21
// v1.1.0: Atualizado para usar UARPSRepository consolidado do /core/
// v1.0.0: Service com regras de negócio para UARPS

declare(strict_types=1);

require_once __DIR__ . '/../../core/repositories/UARPSRepository.php';
require_once __DIR__ . '/../validators/UarpsValidator.php';
require_once __DIR__ . '/../../core/UARPSGate.php';   // UARPS-INHERIT: mesma decisão do gate
require_once __DIR__ . '/../../core/UarpsEscrita.php';   // UARPS saneamento A (27/11): regra + evento na MESMA transação

use Permissions\Validators\UarpsValidator;

class UarpsService
{
    private UARPSRepository $repository;
    private \PDO $pdo;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->repository = new UARPSRepository($pdo);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CHECK PERMISSIONS
    // ════════════════════════════════════════════════════════════════════════

    public function checkTrigger(int $userId, string $triggerId): array
    {
        // UARPS-INHERIT: decisão vinda do UARPSGate (inherit => padrão do perfil; erro => nega)
        $r = \UARPSGate::checkTrigger($userId, $triggerId);

        $out = [
            'trigger_id' => $triggerId,
            'user_id' => $userId,
            'state' => $r['state'] ?? 'error',
            'allowed' => (bool) ($r['allowed'] ?? false),
            'expires_at' => $r['expires_at'] ?? null
        ];
        if (isset($r['padrao'])) {
            $out['padrao'] = $r['padrao'];
        }
        return $out;
    }

    public function checkRegion(int $userId, string $regionId): array
    {
        $perm = $this->repository->getRegionPermission($userId, $regionId);
        $state = $perm['state'] ?? 'inherit';
        $allowed = ($state === 'allow' || $state === 'inherit');

        return [
            'region_id' => $regionId,
            'user_id' => $userId,
            'state' => $state,
            'allowed' => $allowed,
            'expires_at' => $perm['expires_at'] ?? null
        ];
    }

    public function checkMultiple(int $userId, array $entityIds): array
    {
        $results = [];

        foreach ($entityIds as $entityId) {
            $entityId = trim($entityId);
            if (strpos($entityId, 'trigger:') === 0 || strpos($entityId, 'gate:') === 0 || strpos($entityId, 'api:') === 0) {
                // UARPS-INHERIT: triggers pela mesma decisão do gate
                $r = \UARPSGate::checkTrigger($userId, $entityId);
                $results[$entityId] = ['state' => $r['state'] ?? 'error', 'allowed' => (bool) ($r['allowed'] ?? false)];
                continue;
            }
            $perm = $this->repository->getRegionPermission($userId, $entityId);

            $state = $perm['state'] ?? 'inherit';
            $results[$entityId] = [
                'state' => $state,
                'allowed' => ($state === 'allow' || $state === 'inherit')
            ];
        }

        return ['user_id' => $userId, 'results' => $results];
    }

    // ════════════════════════════════════════════════════════════════════════
    // GET PERMISSIONS
    // ════════════════════════════════════════════════════════════════════════

    public function getMyPermissions(int $userId): array
    {
        $triggers = $this->repository->getUserTriggers($userId, false);
        $regions = $this->repository->getUserRegions($userId, false);

        return [
            'user_id' => $userId,
            'triggers' => $triggers,
            'regions' => $regions,
            'counts' => ['triggers' => count($triggers), 'regions' => count($regions)]
        ];
    }

    public function getUserPermissions(int $userId): array
    {
        $triggers = $this->repository->getUserTriggersWithGranted($userId);
        $regions = $this->repository->getUserRegionsWithGranted($userId);

        return [
            'user_id' => $userId,
            'triggers' => $triggers,
            'regions' => $regions
        ];
    }

    public function getUserMatrix(int $userId): ?array
    {
        $userInfo = $this->repository->getUserInfo($userId);
        if (!$userInfo) return null;

        $triggers = $this->repository->getUserTriggersWithGranted($userId);
        $regions = $this->repository->getUserRegionsWithGranted($userId);

        $triggerMap = [];
        foreach ($triggers as $t) {
            $triggerMap[$t['trigger_id']] = $t['state'];
        }

        $regionMap = [];
        foreach ($regions as $r) {
            $regionMap[$r['region_id']] = $r['state'];
        }

        return [
            'user' => $userInfo,
            'triggers' => $triggerMap,
            'regions' => $regionMap,
            'details' => ['triggers' => $triggers, 'regions' => $regions]
        ];
    }

    // ════════════════════════════════════════════════════════════════════════
    // GET USERS
    // ════════════════════════════════════════════════════════════════════════

    public function getUsersWithPermissions(): array
    {
        return ['users' => $this->repository->getUsersWithPermissions()];
    }

    public function getAllUsers(): array
    {
        return ['users' => $this->repository->getAllUsers()];
    }

    // ════════════════════════════════════════════════════════════════════════
    // GET AUDIT
    // ════════════════════════════════════════════════════════════════════════

    public function getAuditLogs(int $limit, ?int $targetUserId = null): array
    {
        $logs = $this->repository->getAuditLogs($limit, $targetUserId);
        return ['logs' => $logs];
    }

    // ═════════════════════════════════════════════════════════════
    // ESCRITA — UARPS · saneamento, item A (AZUL, 27/11/2026)
    // Toda escrita passa por UarpsEscrita::executar (regra + evento em app_uarps_audit_log na MESMA transação; falha = rollback e
    // UarpsEscritaErro com HTTP explícito; idempotência por id de operação). Validação COMPLETA antes da 1ª gravação.
    // Vencimento: campo `expires_at` AUSENTE preserva o valor atual; `null`/"" remove o prazo (operação explícita); data = novo prazo
    // (só futuro). O lote nunca mexe no vencimento. Reset = um evento por regra removida (entity_type gatilho/região, dentro do ENUM).
    // ═════════════════════════════════════════════════════════════

    public function setTrigger(array $input, int $actorId, string $ip, string $operacaoId): array
    {
        return $this->setUma('trigger', $input, $actorId, $ip, $operacaoId);
    }

    public function setRegion(array $input, int $actorId, string $ip, string $operacaoId): array
    {
        return $this->setUma('region', $input, $actorId, $ip, $operacaoId);
    }

    public function bulkSetTriggers(array $input, int $actorId, string $ip, string $operacaoId): array
    {
        return $this->setLote('trigger', $input, $actorId, $ip, $operacaoId);
    }

    public function bulkSetRegions(array $input, int $actorId, string $ip, string $operacaoId): array
    {
        return $this->setLote('region', $input, $actorId, $ip, $operacaoId);
    }

    public function removeTrigger(int $targetUserId, string $triggerId, int $actorId, string $ip, string $operacaoId, ?string $reason = null): array
    {
        return $this->remover('trigger', $targetUserId, $triggerId, $actorId, $ip, $operacaoId, $reason);
    }

    public function removeRegion(int $targetUserId, string $regionId, int $actorId, string $ip, string $operacaoId, ?string $reason = null): array
    {
        return $this->remover('region', $targetUserId, $regionId, $actorId, $ip, $operacaoId, $reason);
    }

    public function resetUser(int $targetUserId, int $actorId, string $ip, ?string $reason, string $operacaoId): array
    {
        if ($targetUserId <= 0) { throw new \UarpsEscritaErro('VALIDATION_ERROR', 400, 'user_id obrigatório.', ['user_id' => 'obrigatório']); }
        $motivo = self::motivo($reason) ?? 'Reset para o padrão do perfil';
        $escrita = new \UarpsEscrita($this->pdo);
        return $escrita->executar($operacaoId, 'reset_user', $actorId, $targetUserId, ['motivo' => $motivo], function (\UarpsEscrita $e) use ($targetUserId, $actorId, $ip, $motivo, $operacaoId): array {
            $removidas = ['trigger' => 0, 'region' => 0];
            foreach (['trigger', 'region'] as $ent) {
                foreach ($this->repository->travarTodas($ent, $targetUserId) as $chave => $linha) {
                    $this->repository->removerPar($ent, $targetUserId, (string) $chave, $ip);
                    $e->evento($operacaoId, 'reset_user', $ent, (string) $chave, $targetUserId, $actorId, self::foto($linha), null, $motivo, 'reset', $ip);
                    $removidas[$ent]++;
                }
            }
            return ['triggers_reset' => $removidas['trigger'], 'regions_reset' => $removidas['region']];
        });
    }

    private function setUma(string $ent, array $input, int $actorId, string $ip, string $operacaoId): array
    {
        $errors = $ent === 'trigger' ? UarpsValidator::validateSetTrigger($input) : UarpsValidator::validateSetRegion($input);
        if (!empty($errors)) { throw new \UarpsEscritaErro('VALIDATION_ERROR', 400, 'Dados inválidos.', $errors); }
        $targetUserId = (int) $input['user_id'];
        $chave = trim((string) ($input[$ent === 'trigger' ? 'trigger_id' : 'region_id'] ?? ''));
        $state = (string) $input['state'];
        $motivo = self::motivo($input['reason'] ?? null);
        $temPrazo = array_key_exists('expires_at', $input);
        $prazo = $temPrazo ? self::prazo($input['expires_at']) : null;   // valida ANTES de abrir a transação
        $acao = $ent === 'trigger' ? 'set_trigger' : 'set_region';
        $pedido = ['chave' => $chave, 'state' => $state, 'motivo' => $motivo] + ($temPrazo ? ['expires_at' => $prazo] : []);
        $escrita = new \UarpsEscrita($this->pdo);
        return $escrita->executar($operacaoId, $acao, $actorId, $targetUserId, $pedido, function (\UarpsEscrita $e) use ($ent, $targetUserId, $chave, $state, $motivo, $temPrazo, $prazo, $actorId, $ip, $acao, $operacaoId): array {
            $linhas = $this->repository->travarPar($ent, $targetUserId, $chave);
            $antes = $linhas ? self::foto($linhas[0]) : null;
            $depois = ['state' => $state, 'expires_at' => $temPrazo ? $prazo : ($antes['expires_at'] ?? null), 'reason' => $motivo];
            $mudou = $antes === null || $antes['state'] !== $depois['state'] || $antes['expires_at'] !== $depois['expires_at'] || $antes['reason'] !== $depois['reason'];
            if ($mudou) {
                $this->repository->gravarPar($ent, $targetUserId, $chave, $antes !== null, $state, $depois['expires_at'], $motivo, $actorId, $ip);
                $e->evento($operacaoId, $acao, $ent, $chave, $targetUserId, $actorId, $antes, $depois, $motivo, 'editor', $ip);
            }
            return [($ent === 'trigger' ? 'trigger_id' : 'region_id') => $chave, 'state' => $state, 'expires_at' => $depois['expires_at'], 'alterado' => $mudou];
        });
    }

    private function setLote(string $ent, array $input, int $actorId, string $ip, string $operacaoId): array
    {
        $errors = UarpsValidator::validateBulkSet($input);
        if (!empty($errors)) { throw new \UarpsEscritaErro('VALIDATION_ERROR', 400, 'Dados inválidos.', $errors); }
        $targetUserId = (int) $input['user_id'];
        $itens = [];
        $invalidos = [];
        foreach ((array) $input['permissions'] as $chave => $state) {   // valida TODO o lote antes da 1ª gravação
            $k = trim((string) $chave);
            if ($k === '' || strlen($k) > 100 || !is_string($state) || !UarpsValidator::isValidState($state)) { $invalidos[] = $k; continue; }
            $itens[$k] = $state;
        }
        if ($invalidos !== [] || $itens === []) {
            throw new \UarpsEscritaErro('VALIDATION_ERROR', 400, $itens === [] && $invalidos === [] ? 'Lote vazio.' : 'Lote com itens inválidos: nada foi aplicado.', ['invalidos' => array_slice($invalidos, 0, 50)]);
        }
        ksort($itens);
        $motivo = self::motivo($input['reason'] ?? null) ?? 'Alteração em lote';
        $acao = $ent === 'trigger' ? 'bulk_set_trigger' : 'bulk_set_region';
        $escrita = new \UarpsEscrita($this->pdo);
        return $escrita->executar($operacaoId, $acao, $actorId, $targetUserId, ['itens' => $itens, 'motivo' => $motivo], function (\UarpsEscrita $e) use ($ent, $targetUserId, $itens, $motivo, $actorId, $ip, $acao, $operacaoId): array {
            $alterados = [];
            $inalterados = 0;
            foreach ($itens as $chave => $state) {
                $linhas = $this->repository->travarPar($ent, $targetUserId, $chave);
                $antes = $linhas ? self::foto($linhas[0]) : null;
                if ($antes !== null && $antes['state'] === $state) { $inalterados++; continue; }   // nada a gravar = nada a auditar
                $depois = ['state' => $state, 'expires_at' => $antes['expires_at'] ?? null, 'reason' => $motivo];   // lote PRESERVA o vencimento
                $this->repository->gravarPar($ent, $targetUserId, $chave, $antes !== null, $state, $depois['expires_at'], $motivo, $actorId, $ip);
                $e->evento($operacaoId, $acao, $ent, $chave, $targetUserId, $actorId, $antes, $depois, $motivo, 'lote', $ip);
                $alterados[] = $chave;
            }
            return ['updated' => count($alterados), 'unchanged' => $inalterados, 'requested' => count($itens), 'alterados' => $alterados];
        });
    }

    private function remover(string $ent, int $targetUserId, string $chave, int $actorId, string $ip, string $operacaoId, ?string $reason): array
    {
        $chave = trim($chave);
        if ($targetUserId <= 0 || $chave === '' || strlen($chave) > 100) {
            throw new \UarpsEscritaErro('VALIDATION_ERROR', 400, 'user_id e a chave são obrigatórios.');
        }
        $motivo = self::motivo($reason);
        $acao = $ent === 'trigger' ? 'remove_trigger' : 'remove_region';
        $escrita = new \UarpsEscrita($this->pdo);
        return $escrita->executar($operacaoId, $acao, $actorId, $targetUserId, ['chave' => $chave, 'motivo' => $motivo], function (\UarpsEscrita $e) use ($ent, $targetUserId, $chave, $actorId, $ip, $motivo, $acao, $operacaoId): array {
            $linhas = $this->repository->travarPar($ent, $targetUserId, $chave);
            if ($linhas === []) { return ['removida' => false]; }   // não havia regra: nada a gravar
            $this->repository->removerPar($ent, $targetUserId, $chave, $ip);
            $e->evento($operacaoId, $acao, $ent, $chave, $targetUserId, $actorId, self::foto($linhas[0]), null, $motivo, 'remocao', $ip);
            return ['removida' => true, 'linhas' => count($linhas)];
        });
    }

    /** Vencimento explícito: null/"" = sem prazo; data futura (AAAA-MM-DD, com hora opcional) = novo prazo. */
    private static function prazo(mixed $v): ?string
    {
        if ($v === null || $v === '') { return null; }
        if (!is_string($v) || preg_match('/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?\z/', $v) !== 1) {
            throw new \UarpsEscritaErro('VALIDATION_ERROR', 400, 'Vencimento inválido (use AAAA-MM-DD ou AAAA-MM-DD HH:MM).', ['expires_at' => 'formato']);
        }
        $d = \DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', strlen($v) === 10 ? $v . ' 23:59:59' : str_replace('T', ' ', strlen($v) === 16 ? $v . ':00' : $v));
        if ($d === false || $d->format('Y-m-d') !== substr($v, 0, 10)) {
            throw new \UarpsEscritaErro('VALIDATION_ERROR', 400, 'Vencimento inválido.', ['expires_at' => 'data']);
        }
        if ($d <= new \DateTimeImmutable('now')) {
            throw new \UarpsEscritaErro('VALIDATION_ERROR', 400, 'Vencimento no passado: para remover a regra use a remoção.', ['expires_at' => 'passado']);
        }
        return $d->format('Y-m-d H:i:s');
    }

    private static function motivo(mixed $v): ?string
    {
        if (!is_string($v)) { return null; }
        $t = trim($v);
        return $t === '' ? null : mb_substr($t, 0, 255);
    }

    /** Fotografia de uma regra para o evento: estado, vencimento e motivo (só esses — sem ip nem autor). */
    private static function foto(array $linha): array
    {
        // DATETIME(3) volta como "…:59.000": normalizado para segundos, senão o mesmo prazo pareceria mudança (evento à toa)
        $prazo = $linha['expires_at'] === null ? null : substr((string) $linha['expires_at'], 0, 19);
        return ['state' => (string) $linha['state'], 'expires_at' => $prazo, 'reason' => $linha['reason'] === null ? null : (string) $linha['reason']];
    }
}
