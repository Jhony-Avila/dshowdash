<?php
// UarpsService
// @version 1.1.0-ENTERPRISE
// @created 2026-01-21
// @updated 2026-01-21
// v1.1.0: Atualizado para usar UARPSRepository consolidado do /core/
// v1.0.0: Service com regras de negócio para UARPS

declare(strict_types=1);
require_once __DIR__ . '/../../core/UarpsRegrasDono.php';   // NAV-04 × UARPS (27/11): antibloqueio, congelados, concedente/revogador

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
        // comparação de chaves pela COLAÇÃO DA COLUNA (alias por maiúsculas/acentos/espaços no fim não escapa da guarda)
        $col = null;
        try { $col = $pdo->query("SELECT collation_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'app_user_trigger_permissions' AND column_name = 'trigger_id'")->fetchColumn() ?: null; } catch (\Throwable) {}
        $col = is_string($col) && preg_match('/^[a-z0-9_]+$/', $col) ? $col : 'utf8mb4_unicode_ci';
        $pdoC = $pdo;
        \UarpsRegrasDono::definirComparador(
            static function (string $a, string $b) use ($pdoC, $col): bool { $st = $pdoC->prepare("SELECT CONVERT(? USING utf8mb4) COLLATE $col = CONVERT(? USING utf8mb4) COLLATE $col"); $st->execute([$a, $b]); return (int) $st->fetchColumn() === 1; },
            static function (string $a, string $p) use ($pdoC, $col): bool { $st = $pdoC->prepare("SELECT CONVERT(? USING utf8mb4) COLLATE $col LIKE CONVERT(? USING utf8mb4) COLLATE $col"); $st->execute([$a, $p . '%']); return (int) $st->fetchColumn() === 1; });
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
        // B6 J8 (VERDE, 27/11): vigência calculada NO SERVIDOR (relógio do banco) — vencida nunca aparece como vigente; a tela não deduz
        [$triggers, $regions] = $this->comVigencia($this->repository->getUserTriggersWithGranted($userId), $this->repository->getUserRegionsWithGranted($userId));
        [$triggers, $regions] = [$this->comAlcada($triggers, 'trigger_id'), $this->comAlcada($regions, 'region_id')];

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

        [$triggers, $regions] = $this->comVigencia($this->repository->getUserTriggersWithGranted($userId), $this->repository->getUserRegionsWithGranted($userId));

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
        // B6 J11 (VERDE, 27/11): o histórico sai SEM IP e sem e-mail (o evento continua guardado no banco; a resposta não expõe)
        $logs = array_map(static fn (array $l): array => array_filter($l, static fn ($k) => !preg_match('/(^|_)(ip|email)(_|$)|ip_address/i', (string) $k), ARRAY_FILTER_USE_KEY), $logs);
        return ['logs' => $logs];
    }

    /**
     * R28 do GPT Warps (prova focal da v4.5): para CADA regra, o concedente ORIGINAL (concedente_id = granted_by), o nível EXATO dele agora
     * (concedente_nivel_atual: MAX(level) dos papéis ativos de conta ativa; null = sem papel/conta inativa) e a ALÇADA dele AGORA sobre AQUELA
     * capacidade (concedente_alcada_atual): o Dono sempre tem; outro concedente só se a decisão VIGENTE do Gate lhe dá gate:admin:permissions E
     * o nível dele alcança o mínimo da capacidade (UARPSPadrao::nivelMinimo; região = administração de permissões, mínimo 80). perdeu_alcada =
     * !concedente_alcada_atual. A concessão NÃO muda por isso (continua valendo até o prazo); é informação para a tela. Sem nome/e-mail.
     */
    private function comAlcada(array $linhas, ?string $chaveCol): array
    {
        $cache = [];
        $ent = $chaveCol === 'region_id' ? 'region' : 'trigger';
        return array_map(function (array $r) use ($chaveCol, $ent, &$cache): array {
            $c = isset($r['granted_by']) && $r['granted_by'] !== null && $r['granted_by'] !== '' ? (int) $r['granted_by'] : null;
            unset($r['concedente_nivel_atual']);
            if ($c === null || $chaveCol === null) { return $r + ['concedente_id' => $c, 'concedente_nivel_atual' => null, 'concedente_alcada_atual' => null, 'perdeu_alcada' => null]; }
            $k = $c . '|' . (string) $r[$chaveCol];
            $a = $cache[$k] ??= \UarpsRegrasDono::alcada($this->pdo, $c, $ent, (string) $r[$chaveCol]);
            // a MESMA regra que autoriza a concessão (UarpsRegrasDono::exigirAlcada); indeterminada = null (nunca "perdeu")
            return $r + ['concedente_id' => $c, 'concedente_nivel_atual' => $a['nivel'], 'concedente_alcada_atual' => $a['alcada'], 'perdeu_alcada' => $a['alcada'] === null ? null : !$a['alcada'], 'alcada_estado' => $a['alcada'] === null ? 'indeterminado' : ($a['alcada'] ? 'com_alcada' : 'sem_alcada'),
                'alcada_motivo' => $a['motivo'], 'concedente_administra_permissoes' => $a['administra'], 'concedente_possui_capacidade' => $a['possui'], 'nivel_minimo_capacidade' => $a['minimo']];
        }, $linhas);
    }

    /** Acrescenta `vigente`/`vencida` e `estado_efetivo` (vencida = 'expirada') com o relógio do BANCO — o mesmo que o UARPSGate usa. */
    private function comVigencia(array ...$listas): array
    {
        $agora = (string) $this->pdo->query("SELECT DATE_FORMAT(NOW(3), '%Y-%m-%d %H:%i:%s.%f')")->fetchColumn();
        return array_map(static fn (array $l): array => array_map(static function (array $r) use ($agora): array {
            $exp = $r['expires_at'] ?? null;
            $n = preg_match('/^(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d)(?:\.(\d{1,6}))?/', (string) $exp, $m) ? $m[1] . '.' . str_pad($m[2] ?? '', 6, '0') : null;
            $venc = $n !== null && strcmp($n, $agora) <= 0;   // sem prazo ou formato inesperado = sem vencimento conhecido (não inventa "vencida")
            return $r + ['vigente' => !$venc, 'vencida' => $venc, 'estado_efetivo' => $venc ? 'expirada' : ($r['state'] ?? null)];
        }, $l), $listas);
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
        \UarpsRegrasDono::exigirLista();   // lista fixa ausente/incompleta/sha divergente = 503, nada passa
        $r = $escrita->executar($operacaoId, 'reset_user', $actorId, $targetUserId, ['motivo' => $motivo], function (\UarpsEscrita $e) use ($targetUserId, $actorId, $ip, $motivo, $operacaoId): array {
            $removidas = ['trigger' => 0, 'region' => 0];
            // NAV-04 (27/11): o reset é EFEITO INDIRETO — confere TUDO antes da 1ª remoção: congelada = 409 com a lista; antibloqueio = 403
            $porEnt = ['trigger' => $this->repository->travarTodas('trigger', $targetUserId), 'region' => $this->repository->travarTodas('region', $targetUserId)];
            $todas = ['trigger' => $this->repository->travarTodasAgrupadas('trigger', $targetUserId), 'region' => $this->repository->travarTodasAgrupadas('region', $targetUserId)];
            $congeladas = [];
            foreach ($todas as $ent => $regras) {   // R26-C: antibloqueio primeiro (precedência); depois TODAS as linhas de cada chave
                foreach ($regras as $chave => $linhas) {
                    if (\UarpsRegrasDono::antibloqueio($targetUserId, $ent, (string) $chave, null)) { throw \UarpsRegrasDono::erroAntibloqueio(); }
                }
            }
            if ($porEnt['trigger'] !== [] || $porEnt['region'] !== []) { \UarpsRegrasDono::exigirAutoridade($actorId, $targetUserId, true); }
            foreach ($todas as $ent => $regras) {
                foreach ($regras as $chave => $linhas) {
                    if (\UarpsRegrasDono::algumaCongelada($ent, (string) $chave, $linhas)) { $congeladas[] = (string) $chave; }
                }
            }
            if ($congeladas !== []) { throw \UarpsRegrasDono::erroCongelado($congeladas); }
            foreach (['trigger', 'region'] as $ent) {
                foreach ($porEnt[$ent] as $chave => $linha) {
                    $this->repository->removerPar($ent, $targetUserId, (string) $chave, $ip);
                    $e->evento($operacaoId, 'reset_user', $ent, (string) $chave, $targetUserId, $actorId, self::foto($linha) + ['concedente_id' => self::idOuNulo($linha['granted_by'] ?? null), 'concedido_em' => self::data($linha['granted_at'] ?? null)], ['revogador_id' => $actorId], $motivo, 'reset', $ip);
                    $removidas[$ent]++;
                }
            }
            return ['triggers_reset' => $removidas['trigger'], 'regions_reset' => $removidas['region'], 'chaves_trigger' => array_map('strval', array_keys($porEnt['trigger']))];
        });
        // VERDE E2 (1): releitura também depois do reset — uma por gatilho que existia
        $r['acesso_efetivo'] = [];
        foreach ((array) ($r['chaves_trigger'] ?? []) as $k) { $r['acesso_efetivo'][(string) $k] = \UarpsRegrasDono::acessoEfetivo($targetUserId, 'trigger', (string) $k, $this->pdo); }
        return $r;
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
        \UarpsRegrasDono::exigirLista();   // lista fixa ausente/incompleta/sha divergente = 503, nada passa
        $r = $escrita->executar($operacaoId, $acao, $actorId, $targetUserId, $pedido, function (\UarpsEscrita $e) use ($ent, $targetUserId, $chave, $state, $motivo, $temPrazo, $prazo, $actorId, $ip, $acao, $operacaoId): array {
            $linhas = $this->repository->travarPar($ent, $targetUserId, $chave);
            $antes = $linhas ? self::foto($linhas[0]) : null;
            $depois = ['state' => $state, 'expires_at' => $temPrazo ? $prazo : ($antes['expires_at'] ?? null), 'reason' => $motivo];
            $mudou = $antes === null || $antes['state'] !== $depois['state'] || $antes['expires_at'] !== $depois['expires_at'] || $antes['reason'] !== $depois['reason'];
            if ($mudou && \UarpsRegrasDono::antibloqueio($targetUserId, $ent, $chave, $state, $depois['expires_at'])) { throw \UarpsRegrasDono::erroAntibloqueio(); }
            // revogação = tirar um allow, ou pôr/encurtar prazo
            $revoga = $antes !== null && $antes['state'] === 'allow' && ($state !== 'allow' || ($temPrazo && $prazo !== null && ($antes['expires_at'] === null || $prazo < $antes['expires_at'])));
            // mesma precedência do lote: ANTIBLOQUEIO → CONGELADO → hierarquia → alçada
            if ($mudou && \UarpsRegrasDono::algumaCongelada($ent, $chave, $linhas)) { throw \UarpsRegrasDono::erroCongelado([$chave]); }
            if ($mudou) { \UarpsRegrasDono::exigirAutoridade($actorId, $targetUserId, $revoga); }
            if ($mudou && $state === 'allow') { \UarpsRegrasDono::exigirAlcada($this->pdo, $actorId, $ent, $chave); }   // Warps R28: só concede quem tem alçada sobre ESTA capacidade
            if ($mudou) {
                $this->repository->gravarPar($ent, $targetUserId, $chave, $antes !== null, $state, $depois['expires_at'], $motivo, $actorId, $ip, $antes === null || $temPrazo);
                $e->evento($operacaoId, $acao, $ent, $chave, $targetUserId, $actorId, $antes, $depois, $motivo, 'editor', $ip);
            }
            return [($ent === 'trigger' ? 'trigger_id' : 'region_id') => $chave, 'state' => $state, 'expires_at' => $depois['expires_at'], 'alterado' => $mudou];
        });
        $r['acesso_efetivo'] = \UarpsRegrasDono::acessoEfetivo($targetUserId, $ent, $chave, $this->pdo);   // VERDE E2 (1): também depois do set
        return $r;
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
        \UarpsRegrasDono::exigirLista();   // lista fixa ausente/incompleta/sha divergente = 503, nada passa
        $r = $escrita->executar($operacaoId, $acao, $actorId, $targetUserId, ['itens' => $itens, 'motivo' => $motivo], function (\UarpsEscrita $e) use ($ent, $targetUserId, $itens, $motivo, $actorId, $ip, $acao, $operacaoId): array {
            $alterados = [];
            $inalterados = 0;
            // R26-C / GPT Warps: VARRE O LOTE INTEIRO sob lock antes de gravar — antibloqueio tem precedência (403); depois, se ALGUMA regra
            // congelada for atingida, o lote INTEIRO é recusado (inclusive os itens livres) com 409 listando TODAS as congeladas atingidas
            $travadas = []; $congeladas = []; $pendentes = [];
            foreach ($itens as $chave => $state) {
                $travadas[$chave] = $this->repository->travarPar($ent, $targetUserId, $chave);
                $ant = $travadas[$chave] ? self::foto($travadas[$chave][0]) : null;
                if ($ant !== null && $ant['state'] === $state) { continue; }
                if (\UarpsRegrasDono::antibloqueio($targetUserId, $ent, $chave, $state, $ant['expires_at'] ?? null)) { throw \UarpsRegrasDono::erroAntibloqueio(); }
                // precedência pactuada (Warps): ANTIBLOQUEIO interrompe na hora; fora dele, a coleta das congeladas vai até o FIM do lote —
                // hierarquia e alçada (outros 403) só são cobradas DEPOIS, para nunca esconder o 409 com a lista completa
                $pendentes[] = [(string) $chave, $ant !== null && $ant['state'] === 'allow' && $state !== 'allow', $state === 'allow'];
                if (\UarpsRegrasDono::algumaCongelada($ent, $chave, $travadas[$chave])) { $congeladas[] = $chave; }
            }
            if ($congeladas !== []) { throw \UarpsRegrasDono::erroCongelado($congeladas); }
            foreach ($pendentes as [$k, $revogaItem, $concede]) {
                \UarpsRegrasDono::exigirAutoridade($actorId, $targetUserId, $revogaItem);
                if ($concede) { \UarpsRegrasDono::exigirAlcada($this->pdo, $actorId, $ent, $k); }
            }
            foreach ($itens as $chave => $state) {
                $linhas = $travadas[$chave];
                $antes = $linhas ? self::foto($linhas[0]) : null;
                if ($antes !== null && $antes['state'] === $state) { $inalterados++; continue; }   // nada a gravar = nada a auditar
                $depois = ['state' => $state, 'expires_at' => $antes['expires_at'] ?? null, 'reason' => $motivo];   // lote PRESERVA o vencimento
                $this->repository->gravarPar($ent, $targetUserId, $chave, $antes !== null, $state, $depois['expires_at'], $motivo, $actorId, $ip, $antes === null);   // lote PRESERVA o prazo de cada linha
                $e->evento($operacaoId, $acao, $ent, $chave, $targetUserId, $actorId, $antes, $depois, $motivo, 'lote', $ip);
                $alterados[] = $chave;
            }
            return ['updated' => count($alterados), 'unchanged' => $inalterados, 'requested' => count($itens), 'alterados' => $alterados];
        });
        $r['acesso_efetivo'] = [];   // VERDE E2 (1): uma releitura por item do lote
        foreach (array_keys($itens) as $k) { $r['acesso_efetivo'][(string) $k] = \UarpsRegrasDono::acessoEfetivo($targetUserId, $ent, (string) $k, $this->pdo); }
        return $r;
    }

    /**
     * VERDE E2 (3) / 09-DESENHO passo 4: PRÉVIA só de leitura — resultado ATUAL × FUTURO para a mesma pessoa/capacidade, e o BLOQUEIO que a
     * gravação teria (lista fixa, antibloqueio, hierarquia, congelado), na mesma ordem e com os mesmos códigos do escritor. Nada é gravado:
     * as linhas são lidas numa transação que termina em ROLLBACK.
     */
    public function previewTrigger(int $targetUserId, string $chave, string $futuro, int $actorId): array
    {
        $chave = trim($chave);
        if ($targetUserId <= 0 || $chave === '' || strlen($chave) > 100 || !in_array($futuro, ['allow', 'deny', 'inherit'], true)) {
            throw new \UarpsEscritaErro('VALIDATION_ERROR', 400, 'user_id, trigger_id e state (allow|deny|inherit) são obrigatórios.');
        }
        $atual = \UarpsRegrasDono::acessoEfetivo($targetUserId, 'trigger', $chave, $this->pdo);
        $bloqueio = null; $linhas = [];
        $this->pdo->beginTransaction();
        try {
            $linhas = $this->repository->lerPar('trigger', $targetUserId, $chave);   // SEM lock: a prévia não segura o par do escritor
            $antes = $linhas ? self::foto($linhas[0]) : null;
            $revoga = $antes !== null && $antes['state'] === 'allow' && $futuro !== 'allow';
            \UarpsRegrasDono::exigirLista();
            if (\UarpsRegrasDono::antibloqueio($targetUserId, 'trigger', $chave, $futuro === 'inherit' ? null : $futuro)) { throw \UarpsRegrasDono::erroAntibloqueio(); }
            if (\UarpsRegrasDono::algumaCongelada('trigger', $chave, $linhas)) { throw \UarpsRegrasDono::erroCongelado([$chave]); }
            \UarpsRegrasDono::exigirAutoridade($actorId, $targetUserId, $revoga);
            if ($futuro === 'allow') { \UarpsRegrasDono::exigirAlcada($this->pdo, $actorId, 'trigger', $chave); }
        } catch (\UarpsEscritaErro $e) {
            $bloqueio = ['codigo' => $e->codigo, 'http' => $e->http, 'mensagem' => $e->getMessage()] + ($e->detalhes ? ['detalhes' => $e->detalhes] : []);
        } finally {
            $this->pdo->rollBack();   // prévia: nada gravado
        }
        if ($futuro === 'allow' || $futuro === 'deny') {
            $fut = ['ainda_permitido' => $futuro === 'allow', 'origem' => 'regra_pessoal', 'autoridade' => ['modo' => 'aplicado', 'permitido' => $futuro === 'allow'],
                    'mensagem' => $futuro === 'allow' ? 'Permitido pela regra pessoal' : 'Negado pela regra pessoal'];
        } else {
            // Warps R27-1: o MESMO decisor do Gate (UARPSGate::decisaoSemRegra), inclusive a exigência de concessão pessoal explícita
            if (!class_exists('UARPSGate')) { require_once __DIR__ . '/../../core/UARPSGate.php'; }
            try { $dec = \UARPSGate::decisaoSemRegra($targetUserId, $chave, false); $pad = $dec['padrao']; } catch (\Throwable) { $dec = null; $pad = null; }
            if ($dec !== null && ($pad['regra'] ?? '') === 'gate-admin-explicito') {
                $fut = ['ainda_permitido' => false, 'origem' => 'exige_concessao_explicita', 'regra' => 'gate-admin-explicito', 'autoridade' => ['modo' => 'aplicado', 'permitido' => false],
                        'mensagem' => 'Negado: esta capacidade exige concessão pessoal explícita'];
            } elseif ($dec === null || !is_array($pad) || ($pad['nivel'] ?? null) === null) {
                $fut = ['ainda_permitido' => false, 'origem' => 'indeterminado', 'mensagem' => 'Não foi possível calcular o resultado futuro: tratado como NEGADO'];
            } else {
                $modo = ($pad['modo'] ?? 'aplicar') === 'aplicar' ? 'aplicado' : 'sombra';
                $perm = (bool) $dec['allowed'];
                $fut = ['ainda_permitido' => $perm, 'origem' => $pad['allowed'] ? 'perfil' : ($modo === 'sombra' ? 'sombra' : 'padrao'), 'nivel' => $pad['nivel'], 'minimo' => $pad['minimo'] ?? null,
                        'autoridade' => ['modo' => $modo, 'permitido' => $perm]] + ($modo === 'sombra' ? ['sombra' => ['permitido' => (bool) $pad['allowed'], 'origem' => (string) ($pad['regra'] ?? '')]] : [])
                     + ['mensagem' => $pad['allowed'] ? 'Sem regra pessoal: permitido pelo nível/perfil' : ($modo === 'sombra' ? 'Permitido agora · em sombra, o UARPS negaria' : 'Sem regra pessoal e sem perfil que conceda: negado')];
            }
        }
        return ['trigger_id' => $chave, 'user_id' => $targetUserId, 'futuro_pedido' => $futuro, 'atual' => $atual, 'futuro' => $fut,
                'muda' => ($atual['ainda_permitido'] ?? null) !== ($fut['ainda_permitido'] ?? null), 'bloqueio' => $bloqueio, 'gravaria' => $bloqueio === null];
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
        \UarpsRegrasDono::exigirLista();   // lista fixa ausente/incompleta/sha divergente = 503, nada passa
        $r = $escrita->executar($operacaoId, $acao, $actorId, $targetUserId, ['chave' => $chave, 'motivo' => $motivo], function (\UarpsEscrita $e) use ($ent, $targetUserId, $chave, $actorId, $ip, $motivo, $acao, $operacaoId): array {
            $linhas = $this->repository->travarPar($ent, $targetUserId, $chave);
            if ($linhas === []) { return ['removida' => false]; }   // não havia regra: nada a gravar
            if (\UarpsRegrasDono::antibloqueio($targetUserId, $ent, $chave, null)) { throw \UarpsRegrasDono::erroAntibloqueio(); }
            \UarpsRegrasDono::exigirAutoridade($actorId, $targetUserId, true);
            if (\UarpsRegrasDono::algumaCongelada($ent, $chave, $linhas)) { throw \UarpsRegrasDono::erroCongelado([$chave]); }
            $concedente = self::idOuNulo($linhas[0]['granted_by'] ?? null);
            $this->repository->removerPar($ent, $targetUserId, $chave, $ip);
            // NAV-04 (27/11): o evento leva quem CONCEDEU (granted_by da regra) e quem REVOGOU (o ator)
            $e->evento($operacaoId, $acao, $ent, $chave, $targetUserId, $actorId, self::foto($linhas[0]) + ['concedente_id' => $concedente, 'concedido_em' => self::data($linhas[0]['granted_at'] ?? null)], ['revogador_id' => $actorId], $motivo, 'remocao', $ip);
            return ['removida' => true, 'linhas' => count($linhas), 'concedente_id' => $concedente, 'revogador_id' => $actorId];
        });
        // NAV-04 (27/11): DEPOIS de gravar, relê o acesso efetivo (sem cache) e devolve se outra regra vigente ainda permite
        if (($r['removida'] ?? false) === true) { $r['acesso_efetivo'] = \UarpsRegrasDono::acessoEfetivo($targetUserId, $ent, $chave, $this->pdo); }
        return $r;
    }

    /** Warps R27-2 (A2): o instante COMPLETO, com os milissegundos do DATETIME(3) — sem cortar a fração em recibo, comparação ou evento. */
    private static function instante(mixed $v): ?string
    {
        if ($v === null || $v === '') { return null; }
        if (preg_match('/^(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d)(?:\.(\d{1,6}))?$/', (string) $v, $m) !== 1) { return (string) $v; }
        return $m[1] . '.' . substr(str_pad($m[2] ?? '', 3, '0'), 0, 3);
    }

    private static function data(mixed $v): ?string
    {
        return self::instante($v);
    }

    private static function idOuNulo(mixed $v): ?int
    {
        return $v === null || $v === '' ? null : (int) $v;
    }

    /**
     * Vencimento explícito: null/"" = sem prazo; data futura (AAAA-MM-DD, com hora opcional e, desde a v4.7, FRAÇÃO de segundo opcional).
     * GPT Warps (cópia de permissões): o instante COMPLETO é preservado até o milissegundo (DATETIME(3)) — cortar a fração ANTECIPA o fim de uma
     * negação copiada. Mais de 3 casas: só os milissegundos ficam (a precisão do banco); nunca arredonda para cima nem estende.
     */
    private static function prazo(mixed $v): ?string
    {
        if ($v === null || $v === '') { return null; }
        if (!is_string($v) || preg_match('/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?)?\z/', $v, $m) !== 1) {
            throw new \UarpsEscritaErro('VALIDATION_ERROR', 400, 'Vencimento inválido (use AAAA-MM-DD, AAAA-MM-DD HH:MM ou AAAA-MM-DD HH:MM:SS[.mmm]).', ['expires_at' => 'formato']);
        }
        $hora = isset($m[2]) && $m[2] !== '' ? $m[2] . ':' . (isset($m[3]) && $m[3] !== '' ? $m[3] : '00') : '23:59:59';
        $d = \DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', $m[1] . ' ' . $hora);
        if ($d === false || $d->format('Y-m-d H:i:s') !== $m[1] . ' ' . $hora) {
            throw new \UarpsEscritaErro('VALIDATION_ERROR', 400, 'Vencimento inválido.', ['expires_at' => 'data']);
        }
        $ms = substr(str_pad($m[4] ?? '', 3, '0'), 0, 3);
        $inst = $d->format('Y-m-d H:i:s') . '.' . $ms;
        if (\DateTimeImmutable::createFromFormat('Y-m-d H:i:s.v', $inst) <= new \DateTimeImmutable('now')) {
            throw new \UarpsEscritaErro('VALIDATION_ERROR', 400, 'Vencimento no passado: para remover a regra use a remoção.', ['expires_at' => 'passado']);
        }
        return $inst;   // mesmo formato do instante gravado (DATETIME(3)): comparação sem corte
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
        // Warps R27-2: o prazo com o instante COMPLETO (milissegundos); o prazo novo vem no mesmo formato (.000), então igual continua igual
        $prazo = self::instante($linha['expires_at']);
        return ['state' => (string) $linha['state'], 'expires_at' => $prazo, 'reason' => $linha['reason'] === null ? null : (string) $linha['reason']];
    }
}
