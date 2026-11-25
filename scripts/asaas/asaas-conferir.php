<?php
declare(strict_types=1);

// scripts/asaas/asaas-conferir.php — CONFERÊNCIA do Asaas no banco local (ACIMA_DIREITA, 23/11/2026): total e detalhe por empresa, com o
// MESMO cálculo do painel. Não chama o Asaas, não grava nada, nunca mostra chave. Uso (portão, passos 6 e 7):
//   sudo -u www-data php scripts/asaas/asaas-conferir.php [--conta=<rótulo>]
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../../api/asaas/AsaasDados.php';
require_once __DIR__ . '/../../api/asaas/AsaasConferencia.php';
$so = null;
foreach (array_slice($argv, 1) as $a) {
    if (preg_match('/^--conta=([a-z0-9][a-z0-9-]{1,31})\z/', $a, $m) === 1) { $so = $m[1]; continue; }
    fwrite(STDERR, "argumento desconhecido (não exibido)\n"); exit(2);
}
$rotulos = AsaasChaves::padrao()->rotulos();
if ($rotulos === []) { fwrite(STDERR, "nenhuma empresa com chave guardada\n"); exit(2); }
if ($so !== null && !in_array($so, $rotulos, true)) { fwrite(STDERR, "empresa sem chave: $so\n"); exit(2); }
echo AsaasConferencia::texto((new AsaasResumo(getConnection('DSHOWDASH')))->montar($rotulos, new DateTimeImmutable('now')), $so);
