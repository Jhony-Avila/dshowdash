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
);
AsaasPortao::emitir(AsaasPortao::atender((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'), $_GET, $deps));
