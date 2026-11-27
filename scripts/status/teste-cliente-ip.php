<?php
// ClienteIp + api/health.php (AZUL, 26/11 noite) — o acesso completo ao health NÃO pode ser obtido com um X-Forwarded-For forjado.
// (1) resolver: sem proxy de confiança, o XFF é ignorado; com proxy de confiança, conta da direita; cadeia corrompida = ''; inválido = '';
// (2) naLista: IPv4/IPv6, CIDR, máscara inválida ignorada, família diferente nunca casa;
// (3) health.php: usa ClienteIp e não lê HTTP_X_FORWARDED_FOR direto.
// Contraprova: a lógica da P91 (1º item do XFF) autoriza o forjado — reproduzida aqui em (4).
declare(strict_types=1);
$raiz = realpath(__DIR__ . '/../..');
require $raiz . '/api/core/ClienteIp.php';
$f = []; $n = 0; $ok = static function (bool $c, string $nome) use (&$f, &$n): void { $n++; if (!$c) { $f[] = $nome; } };
$perm = ['127.0.0.1', '::1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];
$r = static fn (array $s, array $p = []) => ClienteIp::resolver($s, $p);
// (1)
$forjado = ['REMOTE_ADDR' => '203.0.113.9', 'HTTP_X_FORWARDED_FOR' => '127.0.0.1'];
$ok($r($forjado) === '203.0.113.9' && !ClienteIp::naLista($r($forjado), $perm), 'XFF forjado sem proxy de confiança: vale o REMOTE_ADDR, NÃO autorizado');
$ok($r(['REMOTE_ADDR' => '127.0.0.1']) === '127.0.0.1' && ClienteIp::naLista('127.0.0.1', $perm), 'smoke do trem (127.0.0.1 sem XFF) continua autorizado');
$cf = ['173.245.48.0/20'];
$ok($r(['REMOTE_ADDR' => '173.245.48.5', 'HTTP_X_FORWARDED_FOR' => '127.0.0.1, 198.51.100.7'], $cf) === '198.51.100.7', 'atrás de proxy de confiança: o 1º item (do cliente) é ignorado, vale o da direita');
$ok($r(['REMOTE_ADDR' => '173.245.48.5', 'HTTP_X_FORWARDED_FOR' => '198.51.100.7, lixo'], $cf) === '', 'cadeia corrompida: vazio (nunca adivinha)');
$ok($r(['REMOTE_ADDR' => '173.245.48.5', 'HTTP_X_FORWARDED_FOR' => '173.245.48.9'], $cf) === '173.245.48.5', 'só proxies na cadeia: vale o REMOTE_ADDR');
$ok($r(['REMOTE_ADDR' => 'abc']) === '' && $r([]) === '', 'REMOTE_ADDR inválido/ausente: vazio');
// (2)
$ok(ClienteIp::naLista('10.1.2.3', $perm) && ClienteIp::naLista('172.31.255.255', $perm) && !ClienteIp::naLista('172.32.0.1', $perm), 'CIDR IPv4');
$ok(ClienteIp::naLista('::1', $perm) && !ClienteIp::naLista('::2', $perm) && ClienteIp::naLista('2001:db8::5', ['2001:db8::/32']), 'IPv6 exato e CIDR');
$ok(!ClienteIp::naLista('10.0.0.1', ['10.0.0.0/99', '10.0.0.0/x', '::/0']) && !ClienteIp::naLista('', $perm), 'máscara inválida e família diferente não casam; vazio nunca');
// (3)
$h = (string)file_get_contents($raiz . '/api/health.php');
$ok(str_contains($h, 'ClienteIp::resolver($_SERVER') && !str_contains($h, 'HTTP_X_FORWARDED_FOR') && !str_contains($h, 'HTTP_X_REAL_IP'), 'health.php decide pelo ClienteIp, sem ler XFF/X-Real-IP direto');
// (3b) os outros leitores de acesso/limite por IP
foreach (['api/health/status.php', 'api/server/health.php'] as $arq) {
  $c = (string)file_get_contents($raiz . '/' . $arq);
  $ok(str_contains($c, 'ClienteIp::resolver($_SERVER') && !str_contains($c, 'HTTP_X_FORWARDED_FOR') && !str_contains($c, 'HTTP_X_REAL_IP'), "$arq decide pelo ClienteIp");
}
// koala/public.php fica FORA deste ramo só de health (vai com o conjunto SEC-002); a verificação dele está no teste do conjunto.
require_once $raiz . '/api/auth/helpers/DeviceDetector.php';
$sv = $_SERVER;
$_SERVER = ['REMOTE_ADDR' => '203.0.113.9', 'HTTP_CF_CONNECTING_IP' => '198.51.100.1', 'HTTP_X_FORWARDED_FOR' => '198.51.100.2'];
$ok(DeviceDetector::getRealClientIp() === '203.0.113.9', 'DeviceDetector: CF-Connecting-IP/XFF de origem fora do Cloudflare são ignorados (vale o REMOTE_ADDR)');
$_SERVER = ['REMOTE_ADDR' => '173.245.48.5', 'HTTP_CF_CONNECTING_IP' => '198.51.100.1'];
$ok(DeviceDetector::getRealClientIp() === '198.51.100.1', 'DeviceDetector: atrás do Cloudflare vale o CF-Connecting-IP');
$_SERVER = $sv;
// (4) contraprova: a regra antiga
$antiga = static function (array $s): string { $c = $s['HTTP_X_FORWARDED_FOR'] ?? $s['HTTP_X_REAL_IP'] ?? $s['REMOTE_ADDR'] ?? ''; return trim(explode(',', $c)[0]); };
$ok($antiga($forjado) === '127.0.0.1', 'contraprova: a regra da P91 tomava o XFF forjado (127.0.0.1) como IP do cliente');
if ($f) { echo "[ERRO] teste-cliente-ip:\n - " . implode("\n - ", $f) . "\n"; exit(1); }
echo "[OK]   teste-cliente-ip: $n verificações (XFF forjado não autoriza; trem 127.0.0.1 segue; proxy de confiança conta da direita; IPv4/IPv6/CIDR)\n";
