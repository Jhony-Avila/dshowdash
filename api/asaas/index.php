<?php
declare(strict_types=1);

// /api/asaas/index.php — resumo Asaas SÓ LEITURA (ACIMA_DIREITA, 23/11/2026). Só monta as dependências reais; o fluxo está no AsaasPortao.
// Inerte até a flag `financeiro_asaas_leitura` existir e estar ligada para a pessoa (canário: só o 75). Nunca chama o Asaas daqui:
// lê só o banco local, alimentado por scripts/asaas/asaas-sincronizar.php.

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../feature-flags/resolver.php';
require_once __DIR__ . '/AsaasPortao.php';
require_once __DIR__ . '/AsaasCobrancas.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';

CorsPolicy::apply();
SessionGate::start();

$pdo = null; $resolver = null;
$db = static function () use (&$pdo): PDO { return $pdo ??= getConnection('DSHOWDASH'); };
$deps = new AsaasPortaoDeps(
    flag: static function (string $k, ?int $uid) use (&$resolver, $db): array {
        try { $resolver ??= new FeatureFlagResolver($db()); return $resolver->resolve($k, $uid); }
        catch (Throwable $e) { error_log('[asaas] flags: ' . get_class($e)); return ['key' => $k, 'enabled' => false, 'source' => 'error']; }
    },
    sessao: static fn(): ?array => SessionGate::validate(),
    token: static fn(): string => (string) session_id(),
    repo: new class($db) implements AsaasSessaoRepositorio {
        public function __construct(private readonly Closure $db) {}
        public function situacao(string $t, int $u): array { return (new AsaasSessaoPdo(($this->db)()))->situacao($t, $u); }
    },
    resumo: static fn(): array => (new AsaasResumo($db()))->montar(AsaasChaves::padrao()->rotulos(), new DateTimeImmutable('now')),
    vencidas: static fn(): array => (new AsaasResumo($db()))->vencidas(AsaasChaves::padrao()->rotulos(), new DateTimeImmutable('now')),
    // 26/11 "Cobranças vencidas · Asaas": resumo / lista / detalhe sobre o mesmo retrato do banco local (nunca chama o Asaas daqui)
    cobrancas: static function (string $rota, array $get) use ($db): ?array {
        $txt = static fn(string $k): ?string => is_string($get[$k] ?? null) && $get[$k] !== '' ? $get[$k] : null;
        $int = static function (string $k, int $padrao) use ($txt): int { $v = $txt($k); if ($v === null) return $padrao; if (preg_match('/^[1-9][0-9]{0,3}\z/', $v) !== 1) throw new InvalidArgumentException($k); return (int) $v; };
        $agora = new DateTimeImmutable('now');
        // PERF-001: a lista é paginada NO BANCO (só a página sai do MySQL); resumo e detalhe seguem com o retrato inteiro (precisam de todos os itens)
        if ($rota === 'vencidas_lista') {
            $pag = $int('pagina', 1); $pp = $int('por_pagina', 50);
            $rt = (new AsaasResumo($db()))->vencidasPagina(AsaasChaves::padrao()->rotulos(), $agora, $txt('empresa'), $txt('ordem') ?? 'dias', $txt('dir') ?? 'desc', $pag, $pp);
            return (new AsaasCobrancas($rt, $agora, $txt('empresa')))->listaPaginada($pag, $pp);
        }
        $c = new AsaasCobrancas((new AsaasResumo($db()))->vencidasDetalhadas(AsaasChaves::padrao()->rotulos(), $agora), $agora, $txt('empresa'));
        return match ($rota) {
            'vencidas_resumo' => $c->resumo(),
            'vencida' => $c->detalhe($txt('id') ?? throw new InvalidArgumentException('id')),
        };
    },
    nivel: static fn(): int => (int) AuthHelpers::getCurrentUserLevel(),
);
AsaasPortao::emitir(AsaasPortao::atender((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'), $_GET, $deps));
