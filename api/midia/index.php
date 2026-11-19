<?php
// /api/midia/index.php — FOTOS-1 (19/11, DIREITA): galeria de fotos do produto no Dash, gravando SÓ pelo app (canal HMAC Dash → app).
// Regras: FotosCanal.php (cabeçalho). Rotas (?r=):
//   GET  galeria&product_id=            → galeria do app (fotos ativas, removidas, versao_galeria, limite)
//   GET  imagem&id=&t=256|768|1536|2048[&removida=1] → bytes WebP (proxy; Cache-Control private; ETag/304; nunca expõe caminho)
//   GET  conferir&chave=                → "Conferir gravação" (GET /operacoes/:chave no app; nunca reexecuta)
//   POST publicar&product_id=           → corpo = BYTES da imagem (≤ 15 MB; tipo pelos bytes); cabeçalho X-Chave-Operacao (1 chave por arquivo)
//   POST capa {id, versao} · ordem {product_id, versao, ordem:[ids]} · remover {id, versao} · restaurar {id, versao}  (X-Chave-Operacao)
// Mesma ordem de portas do /api/atributos: flag `panel_atributos_enabled` antes da sessão (desligada para todos → 404), sessão (401),
// pessoa fora da flag → 404, escrita exige `panel_atributos_escrita` + CSRF; depois a porta de publicar (FotosPermissoes: SÓ o usuário 75 no piloto) → 403.
// Respostas: envelope do Dash (ApiResponse); erros com meta.desfecho (recusada/conflito/em_andamento/desconhecido), meta.chave e meta.message.
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

const MD_FLAG = 'panel_atributos_enabled';
const MD_FLAG_ESCRITA = 'panel_atributos_escrita';

function mdFlag(array $f): bool
{
    if ((string) ($f['source'] ?? 'error') === 'error') {
        error_log('[midia] flag ilegível (' . (string) ($f['key'] ?? '?') . ')');
        ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'Configuração do recurso indisponível.']);
    }
    return ($f['enabled'] ?? false) === true;
}

function mdErro(FotosErro $e): void
{
    ApiResponse::error($e->codigo, $e->http, ['message' => $e->getMessage()] + $e->meta);
}

CorsPolicy::apply();
SessionGate::start();

try {
    $resolver = new FeatureFlagResolver(getConnection('DSHOWDASH'));
    $pre = $resolver->resolve(MD_FLAG, null);
    mdFlag($pre);
    if ($p = FotosPortas::antesDaSessao((string) $pre['source'])) ApiResponse::error($p[1], $p[0]);
} catch (Throwable $e) {
    error_log('[midia] ' . get_class($e) . ': ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'Erro interno.']);
}

$user = AuthHelpers::requireAuth();
$uid = (int) ($user['id'] ?? 0);
$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$rota = (string) ($_GET['r'] ?? '');
if (!in_array($rota, FotosPortas::ROTAS[$metodo] ?? [], true)) ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);

try {
    $flagPessoa = mdFlag($resolver->resolve(MD_FLAG, $uid));
    $flagEscrita = $metodo === 'POST' ? mdFlag($resolver->resolve(MD_FLAG_ESCRITA, $uid)) : false;
    if ($p = FotosPortas::rotaEFlags($metodo, $rota, $flagPessoa, $flagEscrita)) ApiResponse::error($p[1], $p[0]);
    AuthHelpers::requireCsrfForWrite();
    if (FotosPortas::publicador($uid)) ApiResponse::error(ApiResponse::ERR_NOT_AUTHORIZED, 403, ['message' => 'Você não tem permissão para gerenciar as fotos.', 'desfecho' => 'recusada']);

    $porta = getenv('DSHOW_FOTOS_APP_PORTA');
    $canal = new FotosCanal(new FotosAppCliente(is_string($porta) && ctype_digit($porta) ? (int) $porta : null), $uid);
    $chave = (string) ($_SERVER['HTTP_X_CHAVE_OPERACAO'] ?? '');

    if ($metodo === 'GET') {
        switch ($rota) {
            case 'galeria':
                ApiResponse::success($canal->galeria((int) ($_GET['product_id'] ?? 0)));
            case 'conferir':
                ApiResponse::success($canal->conferir((string) ($_GET['chave'] ?? '')));
            case 'imagem':
                $img = $canal->imagem((int) ($_GET['id'] ?? 0), (int) ($_GET['t'] ?? 768), ($_GET['removida'] ?? '') === '1', $_SERVER['HTTP_IF_NONE_MATCH'] ?? null);
                header('Cache-Control: private, max-age=86400');
                header('X-Content-Type-Options: nosniff');
                if ($img['etag'] !== '') header('ETag: ' . $img['etag']);
                if ($img['status'] === 304) { http_response_code(304); exit; }
                header('Content-Type: ' . $img['tipo']);
                header('Content-Length: ' . strlen($img['corpo']));
                echo $img['corpo'];
                exit;
        }
    }

    // POST
    if ($rota === 'publicar') {
        $tam = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
        if ($tam > FotosCanal::MAX_BYTES) mdErro(new FotosErro('PAYLOAD_TOO_LARGE', 413, 'Arquivo maior que 15 MB.', ['desfecho' => 'recusada', 'campos' => ['arquivo']]));
        $bytes = (string) file_get_contents('php://input', false, null, 0, FotosCanal::MAX_BYTES + 1);
        $r = $canal->publicar((int) ($_GET['product_id'] ?? 0), $chave, $bytes);
        ApiResponse::success($r, null, $r['desfecho'] === 'aplicada' ? 201 : 200);
    }
    $b = json_decode((string) file_get_contents('php://input', false, null, 0, 65536), true);
    if (!is_array($b)) ApiResponse::error(ApiResponse::ERR_INVALID_JSON, 400, ['message' => 'Corpo inválido.', 'desfecho' => 'recusada']);
    $versao = (int) ($b['versao'] ?? 0);
    $r = match ($rota) {
        'capa' => $canal->capa((int) ($b['id'] ?? 0), $chave, $versao),
        'ordem' => $canal->ordem((int) ($b['product_id'] ?? 0), $chave, $versao, is_array($b['ordem'] ?? null) ? $b['ordem'] : []),
        'remover' => $canal->remover((int) ($b['id'] ?? 0), $chave, $versao),
        'restaurar' => $canal->restaurar((int) ($b['id'] ?? 0), $chave, $versao),
    };
    ApiResponse::success($r);
} catch (FotosErro $e) {
    mdErro($e);
} catch (Throwable $e) {
    error_log('[midia] ' . get_class($e) . ': ' . $e->getMessage());
    // escrita com exceção inesperada: pode ter saído para o app → desconhecido (a tela oferece "Conferir gravação" com a mesma chave)
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'Erro interno.'] + ($metodo === 'POST' ? ['desfecho' => 'desconhecido'] : []));
}
