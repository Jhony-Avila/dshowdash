<?php
declare(strict_types=1);

/**
 * /api/cadastro/previa.php?r=… — C1 · fila genérica de revisão cadastral (contrato CONTRATO-C1-PREVIA-CADASTRAL.md v1.1) · VINHO, 26/11/2026.
 *   GET  r=lote[&id=] · r=linhas&lote=&filtro=&campo=&fila=&busca=&pagina=&por_pagina= · r=selecao&lote=
 *   POST r=gerar {filas:[…]} (só LÊ as fontes; grava só o lote nas tabelas novas do consultar_io) · r=decisao {lote, linha, evidencia_versao, decisao, grafia, origem}
 *   r=execucao → 404 até a C3. Sessão + nível 100 (sem acesso = 404). POST com CSRF. Nenhuma rota dispara compra nem escreve no Pipedrive/Precifica.
 */
@ini_set('display_errors', '0');
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/PreviaRepositorio.php';

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
SessionGate::start();
$s = SessionGate::validate();
if (!is_array($s) || empty($s['user_id']) || AuthHelpers::getCurrentUserLevel() < 100) ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
$operador = AuthHelpers::getCurrentUserId();
$r = is_string($_GET['r'] ?? null) ? $_GET['r'] : '';
$rotas = ['GET' => ['lote', 'linhas', 'selecao'], 'POST' => ['gerar', 'decisao']];
if (!in_array($r, $rotas[$metodo] ?? [], true)) ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
if ($metodo === 'POST') AuthHelpers::requireCsrfForWrite();
$txt = static fn(string $k, ?string $re = null): ?string => is_string($_GET[$k] ?? null) && $_GET[$k] !== '' && ($re === null || preg_match($re, $_GET[$k]) === 1) ? $_GET[$k] : null;
$corpo = $metodo === 'POST' ? (json_decode((string) file_get_contents('php://input'), true) ?: []) : [];

try {
    $pipe = null; try { $pipe = getConnection('PIPE_DSHOW'); $pipe->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); } catch (Throwable $e) { error_log('[cadastro] PIPE: ' . get_class($e)); }
    $rds = null; try { $rds = CadastroConexoes::rds(); } catch (Throwable $e) { error_log('[cadastro] RDS: ' . ($e instanceof RuntimeException ? $e->getMessage() : get_class($e))); }
    $repo = new PreviaRepositorio($pipe, $rds);
    $semBase = static fn() => ApiResponse::error('dados_indisponiveis', 503);
    switch ($r) {
        case 'gerar':
            $filas = array_values(array_intersect((array) ($corpo['filas'] ?? ['ganhos', 'sem_cnpj_id_precifica']), ['ganhos', 'sem_cnpj_id_precifica']));
            if ($filas === []) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400);
            if ($rds === null) $semBase();
            $f = $repo->fontes();
            $res = PreviaCadastral::montar($f['orgs'], $f['prec'], $f['precCliente'], $f['leg'], $f['fontes'], $filas, (new DateTimeImmutable('now', new DateTimeZone('America/Sao_Paulo')))->format(DATE_ATOM), $repo->decididas());
            $repo->salvar($res, $filas, $operador);
            ApiResponse::success($res['lote']);
        case 'lote':
            if ($rds === null) $semBase();
            $l = $repo->lote($txt('id', '/^L-\d{14}-[0-9a-f]{12}\z/')); $l === null ? ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404) : ApiResponse::success($l);
        case 'linhas':
            if ($rds === null) $semBase();
            $lote = $txt('lote', '/^L-\d{14}-[0-9a-f]{12}\z/') ?? ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400);
            ApiResponse::success($repo->linhas($lote, ['filtro' => $txt('filtro', '/^(com_sugestao|divergem|sem_valor|consulta_paga|revisar)\z/'), 'campo' => $txt('campo', '/^(4022|4025|4036)\z/'),
                'fila' => $txt('fila', '/^(ganhos|sem_cnpj_id_precifica)\z/'), 'busca' => mb_substr((string) $txt('busca'), 0, 80), 'pagina' => (int) ($txt('pagina', '/^\d{1,4}\z/') ?? 1), 'por_pagina' => (int) ($txt('por_pagina', '/^\d{1,3}\z/') ?? 100)]));
        case 'selecao':
            if ($rds === null) $semBase();
            ApiResponse::success($repo->selecao($txt('lote', '/^L-\d{14}-[0-9a-f]{12}\z/') ?? ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400)));
        case 'decisao':
            if ($rds === null) $semBase();
            $c = static fn(string $k, string $re): ?string => is_string($corpo[$k] ?? null) && preg_match($re, $corpo[$k]) === 1 ? $corpo[$k] : null;
            $lote = $c('lote', '/^L-\d{14}-[0-9a-f]{12}\z/'); $linha = $c('linha', '/^ln_[0-9a-f]{20}\z/'); $ev = $c('evidencia_versao', '/^[0-9a-f]{40}\z/'); $dec = $c('decisao', '/^(aprovar|adiar)\z/');
            if (!$lote || !$linha || !$ev || !$dec) ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400);
            // revalidação DIRECIONADA da linha (CNPJ + ficha; teto de 4 s no RDS): 'ok' | 'mudou' (409 evidencia_mudou) | 'indisponivel' (503, sem invalidar)
            $atual = static fn(array $x): string => $repo->revalidar($x);
            $out = $repo->decidir($lote, $linha, $ev, $dec, is_string($corpo['grafia'] ?? null) ? $corpo['grafia'] : null, is_string($corpo['origem'] ?? null) ? $corpo['origem'] : null, $operador, $atual);
            $out['http'] === 200 ? ApiResponse::success($out['data']) : ApiResponse::error($out['code'], $out['http']);
    }
} catch (Throwable $e) {
    error_log('[cadastro] ' . $r . ': ' . get_class($e));
    ApiResponse::error('dados_indisponiveis', 503);
}
