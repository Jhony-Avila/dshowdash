<?php
declare(strict_types=1);
/** Onda 1 (Avatar nativo) — testes da PonteAuth: aceita só loopback + HMAC válido + janela + nonce único; recusa o resto. uso: php scripts/avatar/testes/ponte-auth.php */
require_once __DIR__ . '/../../../api/avatar/PonteAuth.php';
$falhas = []; $ok = static function (bool $c, string $m) use (&$falhas): void { if (!$c) { $falhas[] = $m; } };
$dir = sys_get_temp_dir() . '/avst-ponte-teste-' . getmypid(); @mkdir($dir, 0700, true);
$segredo = str_repeat('s', 48); $agora = 1_800_000_000; $corpo = '{"user_id":7,"acao":"ler","payload":{},"request_id":"r1"}';
$pedido = static function (array $sobre = [], string $c = null) use ($segredo, $agora, $corpo): array {
    $c = $c ?? $corpo; $ts = (string) ($sobre['ts'] ?? $agora); $nonce = $sobre['nonce'] ?? 'nonce-0123456789abcdef';
    $srv = ['REMOTE_ADDR' => $sobre['ip'] ?? '127.0.0.1', 'REQUEST_METHOD' => 'POST', 'REQUEST_URI' => '/api/avatar/ponte.php', 'HTTP_X_APP_TS' => $ts, 'HTTP_X_APP_NONCE' => $nonce,
        'HTTP_X_APP_SIG' => $sobre['sig'] ?? PonteAuth::assinar($sobre['segredo'] ?? $segredo, $ts, $nonce, 'POST', $sobre['caminho'] ?? '/api/avatar/ponte.php', $sobre['corpoAssinado'] ?? $c)];
    return $srv;
};
$v = static fn(array $srv, string $c = null, string $seg = null) => PonteAuth::validar($srv, $c ?? $corpo, $seg ?? $segredo, $dir, $agora);
$r = $v($pedido()); $ok($r['ok'] === true, '[1] pedido válido aceito: ' . $r['motivo']);
$r = $v($pedido()); $ok($r['ok'] === false && $r['motivo'] === 'repetido', '[2] mesmo nonce de novo → repetido');
$r = $v($pedido(['nonce' => 'outro-nonce-0123456789'])); $ok($r['ok'] === true, '[3] nonce novo aceito');
$r = $v($pedido(['nonce' => 'n3-0123456789abcdefgh', 'ip' => '10.0.0.5'])); $ok(!$r['ok'] && $r['motivo'] === 'origem', '[4] fora do loopback recusado');
$r = $v($pedido(['nonce' => 'n4-0123456789abcdefgh', 'ts' => $agora - 61])); $ok(!$r['ok'] && $r['motivo'] === 'janela', '[5] ts 61 s atrás → janela');
$r = $v($pedido(['nonce' => 'n5-0123456789abcdefgh', 'ts' => $agora + 59])); $ok($r['ok'], '[6] ts 59 s à frente aceito');
$r = $v($pedido(['nonce' => 'n6-0123456789abcdefgh', 'segredo' => str_repeat('x', 48)])); $ok(!$r['ok'] && $r['motivo'] === 'assinatura', '[7] segredo errado → assinatura');
$r = $v($pedido(['nonce' => 'n7-0123456789abcdefgh', 'corpoAssinado' => $corpo . ' '])); $ok(!$r['ok'] && $r['motivo'] === 'assinatura', '[8] corpo alterado → assinatura');
$r = $v($pedido(['nonce' => 'n8-0123456789abcdefgh', 'caminho' => '/api/avatar/studio.php'])); $ok(!$r['ok'] && $r['motivo'] === 'assinatura', '[9] caminho diferente → assinatura');
$r = $v($pedido(['nonce' => 'curto'])); $ok(!$r['ok'] && $r['motivo'] === 'nonce', '[10] nonce curto recusado');
$r = $v($pedido(['nonce' => 'n9-0123456789abcdefgh', 'sig' => 'zz'])); $ok(!$r['ok'] && $r['motivo'] === 'assinatura', '[11] assinatura malformada');
$r = $v($pedido(['nonce' => 'n10-0123456789abcdefg']), null, ''); $ok(!$r['ok'] && $r['motivo'] === 'segredo_ausente', '[12] sem segredo → recusa');
$r = $v($pedido(['nonce' => 'n11-0123456789abcdefg', 'ip' => '::1'])); $ok($r['ok'], '[13] ::1 aceito');
// segredo em arquivo: permissão aberta recusada; 0600 aceito; curto recusado
$arq = "$dir/seg.key"; file_put_contents($arq, str_repeat('k', 40)); chmod($arq, 0644);
$ok(PonteAuth::segredo($arq) === '', '[14] arquivo 0644 → segredo vazio');
chmod($arq, 0600); $ok(PonteAuth::segredo($arq) === str_repeat('k', 40), '[15] arquivo 0600 lido');
file_put_contents($arq, 'curto'); $ok(PonteAuth::segredo($arq) === '', '[16] segredo curto recusado');
$ok(PonteAuth::segredo("$dir/nao-existe") === '', '[17] arquivo ausente → vazio');
// assinatura determinística e sensível a cada campo
$a = PonteAuth::assinar($segredo, '1', 'n', 'POST', '/p', 'c');
$ok($a === PonteAuth::assinar($segredo, '1', 'n', 'post', '/p', 'c') && strlen($a) === 64, '[18] método normalizado, hex 64');
$ok($a !== PonteAuth::assinar($segredo, '2', 'n', 'POST', '/p', 'c') && $a !== PonteAuth::assinar($segredo, '1', 'm', 'POST', '/p', 'c'), '[19] ts/nonce entram na assinatura');
foreach (glob("$dir/*") ?: [] as $f) { @unlink($f); } @rmdir($dir);
echo $falhas ? "[ponte-auth] FALHAS:\n - " . implode("\n - ", $falhas) . "\n" : "[ponte-auth] OK — 19 casos\n";
exit($falhas ? 1 : 0);
