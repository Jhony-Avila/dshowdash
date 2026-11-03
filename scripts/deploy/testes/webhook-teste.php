<?php
// Teste por CLI do webhook (P1-04a). Usa uma raiz TEMPORÁRIA com segredo de TESTE gerado na hora.
// Nunca lê config/webhook-secret.txt real. Uso: php scripts/deploy/testes/webhook-teste.php
declare(strict_types=1);
require dirname(__DIR__, 3) . '/api/deploy/webhook-lib.php';
$raiz = sys_get_temp_dir() . '/webhook-teste-' . bin2hex(random_bytes(6));
mkdir($raiz . '/config', 0700, true); mkdir($raiz . '/storage', 0700, true);
$seg = bin2hex(random_bytes(32)); file_put_contents($raiz . '/config/webhook-secret.txt', $seg);
$sha = str_repeat('a1', 20); $sha2 = str_repeat('b2', 20);
function corpo(array $o): string { return json_encode($o + ['ref' => 'refs/heads/main', 'after' => str_repeat('a1', 20), 'repository' => ['full_name' => 'Jhony-Avila/dshowdash']]); }
function srv(string $c, string $seg, string $ev = 'push', ?string $ent = null, ?string $sig = null): array {
  $s = ['HTTP_X_GITHUB_EVENT' => $ev, 'HTTP_X_HUB_SIGNATURE_256' => $sig ?? ('sha256=' . hash_hmac('sha256', $c, $seg))];
  if ($ent !== '') { $s['HTTP_X_GITHUB_DELIVERY'] = $ent ?? bin2hex(random_bytes(8)); }
  return $s;
}
function fila(string $raiz): array { return array_values(array_filter(scandir($raiz . '/storage/deploy-fila') ?: [], fn($f) => str_starts_with($f, 'pedido-'))); }
$casos = []; $ok = 0; $falhas = 0;
$t = function (string $nome, array $r, int $st, string $c) use (&$ok, &$falhas) {
  $passou = $r[0] === $st && $r[1] === $c; $passou ? $ok++ : $falhas++;
  printf("%s %-46s esperado %d %-11s obtido %d %s\n", $passou ? 'PASSOU' : 'FALHOU', $nome, $st, $c, $r[0], $r[1]);
};
$c1 = corpo([]); $ent1 = 'entrega-0001-abcdef';
$t('repositório certo + ref certo + assinatura ok', dshow_webhook_processar(srv($c1, $seg, 'push', $ent1), $c1, $raiz), 202, 'na-fila');
$t('replay da mesma entrega', dshow_webhook_processar(srv($c1, $seg, 'push', $ent1), $c1, $raiz), 409, 'replay');
$c3 = corpo(['repository' => ['full_name' => 'Outro/repo']]);
$t('repositório errado', dshow_webhook_processar(srv($c3, $seg), $c3, $raiz), 403, 'repositorio');
$c4 = corpo(['ref' => 'refs/heads/feature-x', 'after' => $sha2]);
$t('ref errado', dshow_webhook_processar(srv($c4, $seg), $c4, $raiz), 204, '');
$c5 = corpo(['after' => $sha2]);
$t('assinatura inválida (outro segredo)', dshow_webhook_processar(srv($c5, $seg, 'push', null, 'sha256=' . hash_hmac('sha256', $c5, 'segredo-errado-0123456789')), $c5, $raiz), 403, 'assinatura');
$t('assinatura de outro corpo', dshow_webhook_processar(srv($c5, $seg, 'push', null, 'sha256=' . hash_hmac('sha256', $c1, $seg)), $c5, $raiz), 403, 'assinatura');
$t('sem assinatura', dshow_webhook_processar(srv($c5, $seg, 'push', null, ''), $c5, $raiz), 403, 'assinatura');
$c8 = corpo(['after' => str_repeat('0', 40)]);
$t('SHA nulo', dshow_webhook_processar(srv($c8, $seg), $c8, $raiz), 422, 'sem-sha');
$c9 = corpo(['deleted' => true, 'after' => str_repeat('0', 40)]);
$t('push que remove o branch', dshow_webhook_processar(srv($c9, $seg), $c9, $raiz), 204, '');
$t('ping', dshow_webhook_processar(srv('{}', $seg, 'ping'), '{}', $raiz), 200, 'pong');
$t('sem X-GitHub-Delivery', dshow_webhook_processar(srv($c1, $seg, 'push', ''), $c1, $raiz), 400, 'sem-entrega');
$t('entrega nova, mesmo SHA (idempotente na fila)', dshow_webhook_processar(srv($c1, $seg), $c1, $raiz), 202, 'na-fila');
$antes = count(fila($raiz));
touch($raiz . '/config/auto-deploy.off');
$t('interruptor ligado', dshow_webhook_processar(srv($c5, $seg), $c5, $raiz), 202, 'desligado');
unlink($raiz . '/config/auto-deploy.off');
$f = fila($raiz);
$t('fila: 1 pedido, só do SHA aceito', [count($f) === 1 && $f[0] === 'pedido-' . $sha && $antes === 1 ? 1 : 0, ''], 1, '');
rename($raiz . '/config/webhook-secret.txt', $raiz . '/config/webhook-secret.txt.fora');
$t('sem segredo', dshow_webhook_processar(srv($c1, $seg), $c1, $raiz), 503, 'sem-secret');
// a raiz temporária é do teste e fica em sys_get_temp_dir() para inspeção
printf("\nRESULTADO: %d passaram, %d falharam (raiz de teste: %s)\n", $ok, $falhas, $raiz);
exit($falhas ? 1 : 0);
