<?php
/**
 * UarpsRegrasDono — regras do escritor do UARPS para revogação (contrato NAV-04 × UARPS 100% fechado, decisão do Jhony 06:57), AZUL 27/11/2026.
 *  1. O Dono revoga QUALQUER concessão, inclusive as dele mesmo, sem exigir superior (o escritor já permitia; aqui só não há trava a mais).
 *  2. ANTIBLOQUEIO: o Dono, como beneficiário, pode retirar de si direito operacional ou financeiro, mas NUNCA a capacidade essencial de
 *     administrar permissões (gate:admin:permissions — o gatilho que o próprio editor do UARPS exige) → 403 ANTIBLOQUEIO, com motivo.
 *  3. Revogação grava concedente_id (granted_by da regra) e revogador_id (o ator) no evento; depois relê o acesso efetivo e o devolve.
 *  4. CONGELADOS — as concessões gate:* de 17/11 (as 11 do Dono) e o deny trigger:navrail:clientes: nenhuma escrita os toca, nem por
 *     efeito indireto (reset, lote), sem portão específico → 409 CONGELADO, com a lista. Reconhecidos por critério verificável (não por lista
 *     digitada): gatilho `gate:*` concedido em 2026-11-17, ou `trigger:navrail:clientes` em deny.
 */
declare(strict_types=1);

final class UarpsRegrasDono
{
    public const GATILHO_ADMIN = 'gate:admin:permissions';
    public const DIA_CONGELADO = '2026-11-17';
    public const NEGACAO_CONGELADA = 'trigger:navrail:clientes';
    /**
     * LISTA FIXA das 12 regras congeladas — LIDA NA PRODUÇÃO pelo Jhony em 27/11/2026 07:41 (CONGELADOS-1711-LEITURA v1, só leitura;
     * saída em /srv/dshow-docs/painel/CONGELADOS-1711-SAIDA.txt): 11 gate:* allow do titular 75 (1725–1735, 2026-11-17 20:57:22) + o deny
     * trigger:navrail:clientes do titular 153 (regra 218). Identidade lógica = id + titular + chave + estado + data da concessão.
     * Conferida NA CARGA pelo sha256 da lista canônica "id|user_id|trigger_id|state|concedida_em" (ordenada por id, linhas separadas por \n).
     * Lista ausente, incompleta ou com sha divergente → 503 CONGELADOS_INDISPONIVEIS e NENHUMA alteração de permissão passa.
     */
    public const LISTA_FIXA = [
        218  => [153, 'trigger:navrail:clientes', 'deny', '2025-12-24 14:39:11'],
        1725 => [75, 'gate:admin:users', 'allow', '2026-11-17 20:57:22'],
        1726 => [75, 'gate:admin:settings', 'allow', '2026-11-17 20:57:22'],
        1727 => [75, 'gate:admin:settings:super', 'allow', '2026-11-17 20:57:22'],
        1728 => [75, 'gate:admin:feature-flags', 'allow', '2026-11-17 20:57:22'],
        1729 => [75, 'gate:admin:uarps-status', 'allow', '2026-11-17 20:57:22'],
        1730 => [75, 'gate:admin:audit', 'allow', '2026-11-17 20:57:22'],
        1731 => [75, 'gate:admin:logs', 'allow', '2026-11-17 20:57:22'],
        1732 => [75, 'gate:admin:security-events', 'allow', '2026-11-17 20:57:22'],
        1733 => [75, 'gate:admin:panels', 'allow', '2026-11-17 20:57:22'],
        1734 => [75, 'gate:admin:panels:edit', 'allow', '2026-11-17 20:57:22'],
        1735 => [75, 'gate:admin:panels:screenshot', 'allow', '2026-11-17 20:57:22'],
    ];
    public const LISTA_SHA = '388794ecd5ff6e39241c62b3e0a0d13ef8c48e9c0c9b2a38166da42da06738d8';
    public const LISTA_TOTAL = 12;
    public const LISTA_ALLOW = 11; public const LISTA_DENY = 1;
    private static ?array $listaTeste = null;
    /** Comparação de chaves PELA COLAÇÃO DA COLUNA (definida pelo serviço com o PDO): utf8mb4_unicode_ci iguala maiúsculas, acentos e espaços no
     *  fim — sem isto, "GATE:Admin:Permissions" passaria pela guarda e alcançaria a mesma linha no banco (o "alias" do GPT Warps). */
    private static ?\Closure $igual = null; private static ?\Closure $comeca = null;
    public static function definirComparador(\Closure $igual, \Closure $comeca): void { self::$igual = $igual; self::$comeca = $comeca; }
    private static function eq(string $a, string $b): bool { return self::$igual ? (bool) (self::$igual)($a, $b) : strcasecmp(trim($a), $b) === 0; }
    private static function prefixo(string $a, string $p): bool { return self::$comeca ? (bool) (self::$comeca)($a, $p) : stripos(ltrim($a), $p) === 0; }

    /** SÓ testes (CLI): substitui a LISTA para provar a recusa; o sha, o total e a composição esperados NUNCA são substituíveis. */
    public static function definirListaParaTeste(?array $lista): void { if (PHP_SAPI === 'cli') { self::$listaTeste = $lista; } }

    public static function canonica(array $l): string
    {
        ksort($l);
        return implode("\n", array_map(static fn ($id, $r) => "$id|{$r[0]}|{$r[1]}|{$r[2]}|{$r[3]}", array_keys($l), $l));
    }

    /** Carrega e CONFERE a lista (sha + total). Qualquer falha = 503 e nada é alterado. */
    private static function lista(): array
    {
        $l = self::$listaTeste ?? self::LISTA_FIXA;
        $motivo = null;
        $allow = count(array_filter($l, static fn ($r) => is_array($r) && ($r[2] ?? null) === 'allow'));
        $deny = count(array_filter($l, static fn ($r) => is_array($r) && ($r[2] ?? null) === 'deny'));
        if ($l === []) { $motivo = 'ausente'; }
        elseif (count($l) !== self::LISTA_TOTAL) { $motivo = 'incompleta (' . count($l) . ' de ' . self::LISTA_TOTAL . ')'; }
        elseif ($allow !== self::LISTA_ALLOW || $deny !== self::LISTA_DENY) { $motivo = "composição divergente ($allow allow + $deny deny; esperado 11 + 1)"; }
        elseif (!hash_equals(self::LISTA_SHA, hash('sha256', self::canonica($l)))) { $motivo = 'sha divergente (identidade de alguma regra difere)'; }
        if ($motivo !== null) {
            error_log('[UARPS] ALERTA congelados: lista fixa ' . $motivo . ' — escrita de permissões BLOQUEADA');
            throw new \UarpsEscritaErro('CONGELADOS_INDISPONIVEIS', 503, 'Lista fixa de regras congeladas ' . $motivo . ': nenhuma alteração de permissão até corrigir.', ['motivo' => $motivo]);
        }
        return $l;
    }

    /** Chamado no início de TODA escrita de permissões (antes da idempotência): lista inválida = nada passa. */
    public static function exigirLista(): void { self::lista(); }

    /** Prova de carga: o que o escritor carregou (total, sha, ids por titular). */
    public static function listaCarregada(): array
    {
        $l = self::lista(); $por = [];
        foreach ($l as $id => $r) { $por[$r[0]][] = $id; }
        ksort($por); foreach ($por as &$ids) { sort($ids); } unset($ids);
        return ['total' => count($l), 'sha256' => hash('sha256', self::canonica($l)), 'por_titular' => $por];
    }

    public static function dono(): int
    {
        if (!defined('DSHOW_DONO_ID')) { require_once __DIR__ . '/../_helpers/GuardaDono.php'; }
        return (int) DSHOW_DONO_ID;
    }

    /** Critério por data/estado (conferência secundária quando a lista fixa existe). */
    private static function porCriterio(string $chave, array $linha): bool
    {
        if (self::eq($chave, self::NEGACAO_CONGELADA) && ($linha['state'] ?? null) === 'deny') { return true; }
        return self::prefixo($chave, 'gate:') && str_starts_with((string) ($linha['granted_at'] ?? ''), self::DIA_CONGELADO);
    }

    /** A regra (UMA linha travada) é congelada? Lista fixa decide; o critério confere — divergência entre os dois = congelada + alerta. */
    public static function congelada(string $entidade, string $chave, ?array $linha): bool
    {
        if ($entidade !== 'trigger' || $linha === null) { return false; }
        $l = self::lista();
        // R28 (GPT Accordion): SEM fallback por data em produção — decide SÓ a identidade COMPLETA da lista fixa (id + titular + chave + estado +
        // data da concessão, ao segundo, a mesma precisão da lista lida na produção). Id da lista com outro atributo = BLOQUEIA (alerta: a regra
        // congelada foi alterada por fora). O critério antigo (gate:* de 17/11, deny de Clientes) só gera ALERTA de observação, não decide.
        $id = (int) ($linha['id'] ?? 0); $fix = $l[$id] ?? null;
        if ($fix !== null) {
            $identica = (int) ($linha['user_id'] ?? -1) === (int) $fix[0] && self::eq($chave, $fix[1])
                && ($linha['state'] ?? null) === $fix[2] && substr((string) ($linha['granted_at'] ?? ''), 0, 19) === $fix[3];
            if (!$identica) { error_log(sprintf('[UARPS] ALERTA congelados: regra id=%d da lista fixa com atributos divergentes — bloqueado', $id)); }
            return true;
        }
        if (self::porCriterio($chave, $linha)) {
            error_log(sprintf('[UARPS] ALERTA congelados (observação): regra id=%d casa com o critério de 17/11 mas está FORA da lista fixa — não bloqueada', $id));
        }
        return false;
    }

    /** R26-C: TODAS as linhas atingidas do par (não só a primeira) — alguma congelada? */
    public static function algumaCongelada(string $entidade, string $chave, array $linhas): bool
    {
        foreach ($linhas as $linha) { if (self::congelada($entidade, $chave, $linha)) { return true; } }
        return false;
    }

    /** A operação tiraria do Dono a capacidade de administrar permissões? ($novoEstado null = remoção; prazo = vai expirar). */
    public static function antibloqueio(int $alvo, string $entidade, string $chave, ?string $novoEstado, ?string $novoPrazo = null): bool
    {
        if ($alvo !== self::dono() || $entidade !== 'trigger' || !self::eq($chave, self::GATILHO_ADMIN)) { return false; }
        return $novoEstado !== 'allow' || $novoPrazo !== null;
    }

    /**
     * Hierarquia (confirmada pelo arquiteto): o DONO revoga qualquer concessão. Não-Dono só revoga com autoridade superior APLICÁVEL à operação e
     * ao escopo — enquanto essa relação não estiver resolvida/aprovada, a revogação por não-Dono é BLOQUEADA (403). O administrador delegado
     * nunca edita as PRÓPRIAS permissões (403), nem para conceder.
     */
    public static function exigirAutoridade(int $ator, int $alvo, bool $revogacao): void
    {
        if ($ator === self::dono()) { return; }
        if ($ator === $alvo) { throw new \UarpsEscritaErro('AUTOEDICAO', 403, 'Um administrador delegado não edita as próprias permissões. Nada foi alterado.', []); }
        if ($revogacao) { throw new \UarpsEscritaErro('HIERARQUIA_NAO_RESOLVIDA', 403, 'Revogação só pelo Dono ou por autoridade superior aplicável à operação e ao escopo (ainda não definida). Nada foi alterado.', []); }
    }

    // ───────── ALÇADA (GPT Warps R28, regra de delegação do Jhony): UM critério para AUTORIZAR a concessão e para dizer se o concedente a mantém ─────────
    /** @var null|callable(string,int,string):array dublê do Gate SÓ em CLI (teste da falha de consulta) */
    private static $gateTeste = null;
    public static function definirGateParaTeste(?callable $f): void { if (PHP_SAPI === 'cli') { self::$gateTeste = $f; } }

    /** Decisão VIGENTE do Gate (sem cache): true/false; consulta que falhou ou estado 'error' = null (INDETERMINADA, nunca false). */
    private static function gate(string $tipo, int $u, string $chave): ?bool
    {
        try {
            if (self::$gateTeste !== null) { $r = (self::$gateTeste)($tipo, $u, $chave); }
            else {
                if (!class_exists('UARPSGate')) { require_once __DIR__ . '/UARPSGate.php'; }
                \UARPSGate::clearCache();
                $r = $tipo === 'region' ? \UARPSGate::checkRegion($u, $chave) : \UARPSGate::checkTrigger($u, $chave);
            }
        } catch (\Throwable) { return null; }
        if (!is_array($r) || ($r['state'] ?? '') === 'error' || !array_key_exists('allowed', $r) || !is_bool($r['allowed'])) { return null; }
        return $r['allowed'];
    }

    /**
     * Alçada de $c sobre AQUELA capacidade ($ent = trigger|region, $chave) AGORA. O Dono sempre tem. Outro concedente precisa das TRÊS:
     * nível ≥ mínimo da capacidade (região = 80), decisão vigente de gate:admin:permissions e POSSUIR a própria capacidade no mesmo escopo
     * (o delegado só concede o que tem). Qualquer uma negada = false (com o motivo); nenhuma negada mas alguma consulta falhou = null.
     * @return array{alcada:?bool, motivo:string, nivel:?int, minimo:int, administra:?bool, possui:?bool}
     */
    public static function alcada(\PDO $pdo, int $c, string $ent, string $chave): array
    {
        if (!class_exists('UARPSPadrao')) { require_once __DIR__ . '/UARPSPadrao.php'; }
        $min = $ent === 'trigger' ? max((int) (\UARPSPadrao::nivelMinimo($chave)[0] ?? 80), 80) : 80;
        $nivel = null; $nivelOk = null;
        try {
            $st = $pdo->prepare("SELECT MAX(r.level) FROM app_user_roles ur JOIN app_roles r ON r.id = ur.role_id AND r.deleted_at IS NULL
                                 JOIN app_users u ON u.id = ur.user_id AND u.deleted_at IS NULL AND u.status = 'active'
                                 WHERE ur.user_id = ? AND ur.deleted_at IS NULL AND (ur.expires_at IS NULL OR ur.expires_at > NOW())");
            $st->execute([$c]); $v = $st->fetchColumn();
            $nivel = ($v === null || $v === false) ? null : (int) $v; $nivelOk = $nivel !== null && $nivel >= $min;
        } catch (\Throwable) { $nivelOk = null; }
        if ($c === self::dono()) { return ['alcada' => true, 'motivo' => 'dono', 'nivel' => $nivel, 'minimo' => $min, 'administra' => true, 'possui' => true]; }
        $adm = self::gate('trigger', $c, self::GATILHO_ADMIN);
        $pos = self::gate($ent === 'region' ? 'region' : 'trigger', $c, $chave);
        foreach ([['nivel_insuficiente', $nivelOk], ['sem_administracao', $adm], ['sem_a_capacidade', $pos]] as [$m, $x]) {
            if ($x === false) { return ['alcada' => false, 'motivo' => $m, 'nivel' => $nivel, 'minimo' => $min, 'administra' => $adm, 'possui' => $pos]; }
        }
        $ind = $nivelOk === null || $adm === null || $pos === null;
        return ['alcada' => $ind ? null : true, 'motivo' => $ind ? 'indeterminado' : 'delegado', 'nivel' => $nivel, 'minimo' => $min, 'administra' => $adm, 'possui' => $pos];
    }

    /** Concessão (gravar allow) por quem não é o Dono: exige alçada = true. false → 403 SEM_ALCADA; null → 403 ALCADA_INDETERMINADA. */
    public static function exigirAlcada(\PDO $pdo, int $ator, string $ent, string $chave): void
    {
        if ($ator === self::dono()) { return; }
        $a = self::alcada($pdo, $ator, $ent, $chave);
        if ($a['alcada'] === true) { return; }
        if ($a['alcada'] === null) { throw new \UarpsEscritaErro('ALCADA_INDETERMINADA', 403, 'Não foi possível confirmar a sua alçada sobre esta capacidade agora. Nada foi alterado.', ['chave' => $chave]); }
        throw new \UarpsEscritaErro('SEM_ALCADA', 403, 'Você não tem alçada para conceder esta capacidade (é preciso possuí-la, administrar permissões e ter o nível mínimo). Nada foi alterado.', ['chave' => $chave, 'motivo' => $a['motivo']]);
    }

    public static function erroCongelado(array $chaves): \UarpsEscritaErro
    {
        return new \UarpsEscritaErro('CONGELADO', 409, 'Regra congelada (concessões gate:* de 17/11 ou a negação de Clientes): só com portão específico. Nada foi alterado.', ['congeladas' => array_values($chaves)]);
    }

    public static function erroAntibloqueio(): \UarpsEscritaErro
    {
        return new \UarpsEscritaErro('ANTIBLOQUEIO', 403, 'O Dono não pode retirar de si a capacidade de administrar permissões (gate:admin:permissions). Direitos operacionais e financeiros podem ser retirados. Nada foi alterado.', ['gatilho' => self::GATILHO_ADMIN]);
    }

    /** Acesso efetivo DEPOIS da gravação (sem cache): se outra regra vigente ainda permite. Indisponível = null (nunca "permitido" por omissão). */
    public static function acessoEfetivo(int $alvo, string $entidade, string $chave, ?\PDO $pdo = null): array
    {
        // B6 (GPT Warps): nunca null — o servidor diz SE ainda permite e POR QUÊ (regra pessoal, perfil X, padrão negado ou indeterminado)
        if ($entidade !== 'trigger') { return ['ainda_permitido' => null, 'origem' => 'nao_aplicavel', 'mensagem' => 'Região: releitura não se aplica']; }
        try {
            if (!class_exists('UARPSGate')) { require_once __DIR__ . '/UARPSGate.php'; }
            \UARPSGate::clearCache();
            $r = \UARPSGate::checkTrigger($alvo, $chave);
            if (is_array($r) && (($r['padrao'] ?? [])['regra'] ?? '') === 'gate-admin-explicito' && ($r['state'] ?? '') !== 'error') {
                // Warps R27-1: capacidade que EXIGE concessão pessoal explícita — sem ela, negado em qualquer nível (não é "indeterminado")
                return ['ainda_permitido' => false, 'origem' => 'exige_concessao_explicita', 'regra' => 'gate-admin-explicito', 'autoridade' => ['modo' => 'aplicado', 'permitido' => false],
                        'mensagem' => 'Negado: esta capacidade exige concessão pessoal explícita'];
            }
            if (!is_array($r) || ($r['state'] ?? null) === 'error' || (($r['padrao'] ?? [])['nivel'] ?? 0) === null) {
                return ['ainda_permitido' => false, 'origem' => 'indeterminado', 'mensagem' => 'Não foi possível confirmar o acesso efetivo: tratado como NEGADO'];
            }
            $ok = ($r['allowed'] ?? null) === true; $pad = $r['padrao'] ?? null;
            // VERDE E2 (2): AUTORIDADE (o que vale agora) e SOMBRA (o que o UARPS decidiria) separados, para a mesma pessoa/capacidade/instante
            $modo = is_array($pad) && ($pad['modo'] ?? 'aplicar') !== 'aplicar' ? 'sombra' : 'aplicado';
            $aut = ['modo' => $modo, 'permitido' => $ok];
            $som = $modo === 'sombra' ? ['permitido' => (bool) ($pad['allowed'] ?? false), 'origem' => (string) ($pad['regra'] ?? '')] : null;
            if (($r['state'] ?? '') === 'allow' || ($r['state'] ?? '') === 'deny') {
                return ['ainda_permitido' => $ok, 'origem' => 'regra_pessoal', 'autoridade' => ['modo' => 'aplicado', 'permitido' => $ok],
                        'mensagem' => $ok ? 'Continua permitido por outra regra pessoal vigente' : 'Negado por regra pessoal vigente'];
            }
            if ($ok && is_array($pad) && ($pad['allowed'] ?? false) !== true && $modo === 'sombra') {
                return ['ainda_permitido' => true, 'origem' => 'sombra', 'autoridade' => $aut, 'sombra' => $som, 'nivel' => $pad['nivel'] ?? null, 'minimo' => $pad['minimo'] ?? null,
                        'mensagem' => 'Permitido agora · em sombra, o UARPS negaria'];
            }
            if ($ok && is_array($pad)) {
                $perfil = null;
                if ($pdo !== null) {
                    $st = $pdo->prepare('SELECT r.role_key, r.level FROM app_user_roles ur JOIN app_roles r ON r.id = ur.role_id AND r.deleted_at IS NULL
                                          WHERE ur.user_id = ? AND ur.deleted_at IS NULL AND (ur.expires_at IS NULL OR ur.expires_at > NOW()) AND r.level >= ?
                                          ORDER BY r.level DESC, r.role_key LIMIT 1');
                    $st->execute([$alvo, (int) ($pad['minimo'] ?? 0)]);
                    $perfil = $st->fetch(\PDO::FETCH_ASSOC) ?: null;
                }
                return ['ainda_permitido' => true, 'origem' => 'perfil', 'perfil' => $perfil['role_key'] ?? null, 'nivel' => $pad['nivel'] ?? null, 'minimo' => $pad['minimo'] ?? null,
                        'autoridade' => $aut] + ($som !== null ? ['sombra' => $som] : []) + [
                        'mensagem' => 'Continua permitido pelo perfil ' . ($perfil['role_key'] ?? ('de nível ' . ($pad['nivel'] ?? '?')))];
            }
            return ['ainda_permitido' => false, 'origem' => 'padrao', 'nivel' => $pad['nivel'] ?? null, 'minimo' => $pad['minimo'] ?? null, 'autoridade' => $aut] + ($som !== null ? ['sombra' => $som] : [])
                 + ['mensagem' => 'Sem regra pessoal e sem perfil que conceda: negado'];
        } catch (\Throwable $e) {
            error_log('[UARPS] acesso efetivo indisponível: ' . get_class($e));
            return ['ainda_permitido' => false, 'origem' => 'indeterminado', 'mensagem' => 'Não foi possível confirmar o acesso efetivo: tratado como NEGADO'];
        }
    }
}
