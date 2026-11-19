<?php
// /api/midia/index.php — FOTOS-1 (19/11, DIREITA) + DSHOW-103 (19/11, ACIMA_DIREITA): galeria de fotos do produto no Dash, gravando SÓ pelo app
// (canal HMAC Dash → app). O fluxo e a ORDEM das portas estão em FotosProxy::atender (testado com dependências falsas); aqui só se montam as
// dependências REAIS e se emite a resposta. Rotas (?r=):
//   GET  galeria&product_id=            → galeria do app (fotos ativas, removidas, versao_galeria, limite)
//   GET  imagem&id=&t=256|768|1536|2048[&removida=1] → bytes WebP (proxy; Cache-Control: private, no-store; ETag/304; nunca expõe caminho)
//   GET  conferir&chave=                → "Conferir gravação" (GET /operacoes/:chave no app; nunca reexecuta)
//   POST publicar&product_id=           → corpo = BYTES da imagem (≤ 15 MB; tipo pelos bytes); cabeçalho X-Chave-Operacao (1 chave por arquivo)
//   POST capa {id, versao} · ordem {product_id, versao, ordem:[ids ≤ 100]} · remover {id, versao} · restaurar {id, versao}  (X-Chave-Operacao)
// Portas: flag EXCLUSIVA `panel_fotos_enabled` (ausente/desligada → 404, zero chamadas ao app, corpo não lido) → sessão COMPLETA (FotosSessao)
// → flag da pessoa (+ `panel_fotos_escrita` no POST) → CSRF → publicador (piloto explícito). Respostas: envelope do Dash (ApiResponse).
declare(strict_types=1);

@ini_set('display_errors', '0');
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../feature-flags/resolver.php';
require_once __DIR__ . '/FotosAppCliente.php';
require_once __DIR__ . '/FotosCanal.php';
require_once __DIR__ . '/FotosPortas.php';
require_once __DIR__ . '/FotosSessao.php';
require_once __DIR__ . '/FotosProxy.php';

CorsPolicy::apply();
SessionGate::start();

$resolver = null;
$pdo = null;
$db = static function () use (&$pdo): PDO { return $pdo ??= getConnection('DSHOWDASH'); };
$porta = getenv('DSHOW_FOTOS_APP_PORTA');
$deps = new FotosProxyDeps(
    flag: static function (string $k, ?int $uid) use (&$resolver, $db): array {
        try { $resolver ??= new FeatureFlagResolver($db()); return $resolver->resolve($k, $uid); }
        catch (Throwable $e) { error_log('[midia] flags: ' . get_class($e)); return ['key' => $k, 'enabled' => false, 'source' => 'error']; }
    },
    sessao: static fn(): ?array => SessionGate::validate(),
    tokenSessao: static fn(): string => (string) session_id(),
    repo: new class($db) implements FotosSessaoRepositorio {
        public function __construct(private readonly Closure $db) {}
        public function situacao(string $t, int $u): array { return (new FotosSessaoPdo(($this->db)()))->situacao($t, $u); }
    },
    csrf: static function (): bool { AuthHelpers::requireCsrfForWrite(); return true; },   // inválido → 403 do próprio helper (mesmo ponto da ordem)
    canal: static fn(int $uid): FotosCanal => new FotosCanal(new FotosAppCliente(is_string($porta) && ctype_digit($porta) ? (int) $porta : null), $uid),
    corpo: static fn(int $max): string => (string) file_get_contents('php://input', false, null, 0, $max),
);
$cab = ['chave' => (string) ($_SERVER['HTTP_X_CHAVE_OPERACAO'] ?? ''), 'tamanho' => (string) ($_SERVER['CONTENT_LENGTH'] ?? '0')];
if (isset($_SERVER['HTTP_IF_NONE_MATCH'])) $cab['se_nao_bater'] = (string) $_SERVER['HTTP_IF_NONE_MATCH'];

$r = FotosProxy::atender((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'), $_GET, $cab, $deps);
FotosProxyEmissor::emitir($r);
