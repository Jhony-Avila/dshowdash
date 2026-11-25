<?php
declare(strict_types=1);

// scripts/asaas/asaas-sincronizar.php — sincronização SÓ LEITURA do Asaas → banco local (ACIMA_DIREITA, 23/11/2026).
// NÃO está em cron: instalar o cron é passo de PORTÃO. Uso (como o usuário do php-fpm, nunca root):
//   sudo -u www-data php scripts/asaas/asaas-sincronizar.php [--conta=<rótulo>]
// Uma execução por vez (flock); contas em sequência; uma requisição por vez. Saída: uma linha por conta, sem valores e sem chave.
// Código de saída: 0 = todas ok · 1 = alguma conta falhou · 2 = já rodando / sem contas / erro de ambiente.

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../../api/asaas/AsaasDados.php';

$conta = null;
foreach (array_slice($argv, 1) as $a) {
    if (preg_match('/^--conta=([a-z0-9][a-z0-9-]{1,31})\z/', $a, $m) === 1) { $conta = $m[1]; continue; }
    fwrite(STDERR, "argumento desconhecido (não exibido)\n"); exit(2);
}
$trava = fopen(sys_get_temp_dir() . '/dshow-asaas-sincronizar.lock', 'c');
if ($trava === false || !flock($trava, LOCK_EX | LOCK_NB)) { fwrite(STDERR, "já há uma sincronização em andamento\n"); exit(2); }

$chaves = AsaasChaves::padrao();
$rotulos = $chaves->rotulos();
if ($rotulos === []) { fwrite(STDERR, "nenhuma conta com chave guardada (scripts/asaas/asaas-chaves.sh)\n"); exit(2); }
if ($conta !== null && !in_array($conta, $rotulos, true)) { fwrite(STDERR, "conta sem chave: $conta\n"); exit(2); }

$pdo = getConnection('DSHOWDASH');
$transporte = new AsaasTransporteCurl();
$dormir = static function (int $s): void { sleep($s); };
$sync = new AsaasSincronizador(
    new AsaasRepositorio($pdo),
    $chaves,
    static function (string $r) use ($chaves, $transporte, $dormir): AsaasCliente { $k = $chaves->ler($r); return new AsaasCliente($transporte, $k['chave'], $k['base'], $dormir); },
    static function (int $ms): void { usleep($ms * 1000); },
);
$agora = new DateTimeImmutable('now');
$res = $conta !== null ? [$conta => $sync->sincronizar($conta, $agora)] : $sync->sincronizarTodas($agora);
$falhou = false;
foreach ($res as $r => $x) {
    $falhou = $falhou || $x['resultado'] !== 'ok';
    echo date('c'), " asaas conta=$r resultado={$x['resultado']}", isset($x['erro']) ? " erro={$x['erro']}" : '',
         isset($x['cobrancas']) ? " cobrancas={$x['cobrancas']} extrato={$x['extrato']}" : '', " requisicoes={$x['requisicoes']}\n";
}
exit($falhou ? 1 : 0);
