<?php
// DSHOW-103 (ACIMA_DIREITA) — roteador de TESTE para `php -S 127.0.0.1:<porta>` (NUNCA em produção; fora do docroot do Dash): o MESMO
// FotosProxy::atender + FotosProxyEmissor do index.php, com flags/sessão/repositório/CSRF FALSOS vindos do cabeçalho X-Harness-Estado
// (base64 de JSON, só o harness lê) e o FotosAppCliente REAL falando com o app FALSO em 127.0.0.1:<HARNESS_APP_PORTA>.
// Cada leitura do corpo é registrada em HARNESS_LOG (prova de "corpo nunca lido" quando uma porta recusa).
declare(strict_types=1);
if (PHP_SAPI !== 'cli-server') { http_response_code(404); exit; }
foreach (['_helpers/ApiResponse', 'midia/FotosAppCliente', 'midia/FotosCanal', 'midia/FotosPortas', 'midia/FotosSessao', 'midia/FotosProxy'] as $c) require_once __DIR__ . "/../../../api/$c.php";
if (parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) !== '/api/midia/index.php') { http_response_code(404); exit; }
$e = json_decode(base64_decode((string) ($_SERVER['HTTP_X_HARNESS_ESTADO'] ?? '')), true);
$e = is_array($e) ? $e : [];
$log = (string) getenv('HARNESS_LOG');
// regra de 23/11: só grava no registro DENTRO do temporário do teste (nunca caminho vazio ou fora do tmp do sistema)
$tmpBase = realpath(sys_get_temp_dir());
if ($log === '' || $tmpBase === false || !str_starts_with($log, $tmpBase . '/') || str_contains($log, '..') || !is_dir(dirname($log))) { http_response_code(500); echo 'HARNESS_LOG inválido'; exit; }
$flags = $e['flags'] ?? [];
$sit = $e['situacao'] ?? ['sessao_ativa' => true, 'usuario_ativo' => true];
$repo = new class($sit, !empty($e['repoFalha'])) implements FotosSessaoRepositorio {
    public function __construct(private array $s, private bool $falha) {}
    public function situacao(string $t, int $u): array { if ($this->falha) throw new RuntimeException('banco fora'); return $this->s; }
};
$deps = new FotosProxyDeps(
    flag: fn(string $k, ?int $uid): array => ['key' => $k] + ($flags[$k] ?? ['enabled' => false, 'source' => 'not_found']),
    sessao: fn(): ?array => array_key_exists('sess', $e) ? $e['sess'] : ['user_id' => 75],
    tokenSessao: fn(): string => (string) ($e['token'] ?? 'tok-harness-sintetico'),
    repo: $repo,
    csrf: fn(): bool => ($e['csrf'] ?? true) === true,
    canal: fn(int $uid): FotosCanal => new FotosCanal(new FotosAppCliente((int) getenv('HARNESS_APP_PORTA')), $uid),
    corpo: function (int $max) use ($log): string { file_put_contents($log, "corpo-lido\n", FILE_APPEND); return (string) file_get_contents('php://input', false, null, 0, $max); },
    // C: `publicadoresEnv` passa pela MESMA leitura da configuração real (FotosPermissoes::publicadores) — prova que "*" nunca habilita
    publicadores: array_key_exists('publicadoresEnv', $e) ? @FotosPermissoes::publicadores((string) $e['publicadoresEnv']) : (array_key_exists('publicadores', $e) ? $e['publicadores'] : [75]),
);
$cab = ['chave' => (string) ($_SERVER['HTTP_X_CHAVE_OPERACAO'] ?? ''), 'tamanho' => (string) ($_SERVER['CONTENT_LENGTH'] ?? '0')];
if (isset($_SERVER['HTTP_IF_NONE_MATCH'])) $cab['se_nao_bater'] = (string) $_SERVER['HTTP_IF_NONE_MATCH'];
FotosProxyEmissor::emitir(FotosProxy::atender((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'), $_GET, $cab, $deps));
