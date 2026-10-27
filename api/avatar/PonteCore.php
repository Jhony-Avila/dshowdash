<?php
declare(strict_types=1);

/**
 * /api/avatar/PonteCore.php — lógica da PONTE servidor-a-servidor do APP DSHOW (Programa "Avatar nativo", Onda 1), testável fora do HTTP.
 * ponte.php (entrada) só obtém a conexão, resolve a flag e chama avpt_executar(); aqui vive o despacho para a StudioLib
 * (MESMO pipeline do studio.php) e para as consultas de favoritos/vida/flags. Nenhuma validação, trava, sanitização, versão
 * ou poda é reimplementada: avst_persistir / avst_meta / avst_historico / avst_estado são as do studio.php.
 */

require_once __DIR__ . '/SvgSanitizer.php';
require_once __DIR__ . '/VidaLib.php';
require_once __DIR__ . '/StudioLib.php';
require_once __DIR__ . '/PonteAuth.php';

const AVPT_FLAG = 'avatar.ponte_app';
const AVPT_CORPO_MAX = 1_048_576; // 1 MB (SVG ≤ 300 KB + config)
const AVPT_VERSAO = '0.1.0';

/** Envelope (mesma forma do studio.php). */
function avpt_envelope(bool $ok, ?array $data, ?string $erro): array
{
    return ['ok' => $ok, 'data' => $data, 'error' => $erro, 'meta' => ['endpoint' => 'avatar/ponte', 'version' => AVPT_VERSAO]];
}

function avpt_auditar(int $userId, string $acao, string $reqId, int $status, string $erro = ''): void
{
    error_log(sprintf('AVST_PONTE user=%d acao=%s req=%s status=%d%s', $userId, preg_replace('/[^a-z_]/', '', $acao), preg_replace('/[^A-Za-z0-9_-]/', '', $reqId), $status, $erro !== '' ? " erro=$erro" : ''));
}

/** Favoritos — mesmas consultas de favoritos.php (GET e POST), com a identidade vinda da ponte. */
function avpt_favoritos(PDO $pdo, int $userId): array
{
    try {
        $st = $pdo->prepare('
                SELECT a.`key` FROM avatar_user_favorites f
                JOIN avatar_assets a ON a.id = f.asset_id
                WHERE f.user_id = ? ORDER BY f.created_at
            ');
        $st->execute([$userId]);
        return ['itens' => $st->fetchAll(PDO::FETCH_COLUMN), 'fonte' => 'servidor'];
    } catch (Throwable $e) {
        return ['itens' => [], 'fonte' => 'indisponivel'];
    }
}

function avpt_favorito_alternar(PDO $pdo, int $userId, string $item): array
{
    if (!preg_match('/^[a-z0-9_]{1,80}$/', $item)) {
        throw new AvstErro('ITEM_INVALIDO', 422);
    }
    try {
        $st = $pdo->prepare('SELECT id FROM avatar_assets WHERE `key` = ?');
        $st->execute([$item]);
        $assetId = (int) ($st->fetchColumn() ?: 0);
        if ($assetId === 0) {
            return ['favorito' => false, 'sincronizado' => false];
        }
        $del = $pdo->prepare('DELETE FROM avatar_user_favorites WHERE user_id = ? AND asset_id = ?');
        $del->execute([$userId, $assetId]);
        if ($del->rowCount() > 0) {
            return ['favorito' => false, 'sincronizado' => true];
        }
        $ins = $pdo->prepare('INSERT IGNORE INTO avatar_user_favorites (user_id, asset_id, created_at) VALUES (?, ?, NOW())');
        $ins->execute([$userId, $assetId]);
        return ['favorito' => true, 'sincronizado' => true];
    } catch (Throwable $e) {
        return ['favorito' => false, 'sincronizado' => false];
    }
}

/** Flag server-side: resolver do Dash quando existir; ausência de arquivo/tabela/erro = DESLIGADA (fail-closed). */
function avpt_flag_ligada(PDO $pdo, ?string $resolverArquivo = null): bool
{
    $resolver = $resolverArquivo ?? (__DIR__ . '/../feature-flags/resolver.php');
    if (!is_file($resolver)) {
        return false;
    }
    try {
        require_once $resolver;
        $r = new FeatureFlagResolver($pdo);
        $f = $r->resolve(AVPT_FLAG, null);
        return ($f['enabled'] ?? false) === true;
    } catch (Throwable $e) {
        return false;
    }
}

/** Flags remotas do Studio resolvidas para o usuário (lista pedida pelo app, vinda do motor.json). Falha = vazio (padrões do motor). */
function avpt_flags(PDO $pdo, int $userId, array $pedidas, ?string $resolverArquivo = null): array
{
    $saida = [];
    $resolver = $resolverArquivo ?? (__DIR__ . '/../feature-flags/resolver.php');
    if (!is_file($resolver)) {
        return $saida;
    }
    try {
        require_once $resolver;
        $r = new FeatureFlagResolver($pdo);
        foreach ($pedidas as $k) {
            if (is_string($k) && preg_match('/^[a-z0-9_.]{1,64}$/', $k)) {
                $saida[$k] = (($r->resolve($k, $userId)['enabled'] ?? false) === true);
            }
        }
    } catch (Throwable $e) {
        // fail-closed
    }
    return $saida;
}

/**
 * Executa um pedido da ponte. Devolve [status HTTP, envelope]. Não escreve saída, não encerra.
 * @param array<string,mixed> $server  $_SERVER (REMOTE_ADDR, REQUEST_METHOD, REQUEST_URI, HTTP_X_APP_*)
 * @param array{flag?:bool,segredo?:string,dirNonces?:?string,agora?:?int,dirFisico?:?string,resolver?:?string} $amb ambiente injetável (testes)
 */
function avpt_executar(?PDO $pdo, array $server, string $corpo, array $amb = []): array
{
    $metodo = (string) ($server['REQUEST_METHOD'] ?? '');
    if ($metodo !== 'POST') {
        return [405, avpt_envelope(false, null, 'METODO')];
    }
    if ($pdo === null) {
        return [503, avpt_envelope(false, null, 'PONTE_INDISPONIVEL')];
    }
    $ligada = $amb['flag'] ?? avpt_flag_ligada($pdo, $amb['resolver'] ?? null);
    if ($ligada !== true) {
        return [404, avpt_envelope(false, null, 'NAO_ENCONTRADO')];
    }
    if (strlen($corpo) > AVPT_CORPO_MAX) {
        return [413, avpt_envelope(false, null, 'CORPO_GRANDE')];
    }
    $segredo = $amb['segredo'] ?? PonteAuth::segredo();
    if ($segredo === '') {
        error_log('AVST_PONTE segredo indisponível');
        return [503, avpt_envelope(false, null, 'PONTE_INDISPONIVEL')];
    }
    $auth = PonteAuth::validar($server, $corpo, $segredo, $amb['dirNonces'] ?? null, $amb['agora'] ?? null);
    if (!$auth['ok']) {
        error_log('AVST_PONTE recusada motivo=' . $auth['motivo'] . ' ip=' . (string) ($server['REMOTE_ADDR'] ?? '?'));
        return [403, avpt_envelope(false, null, 'PONTE_RECUSADA')];
    }

    $pedido = json_decode($corpo, true);
    $userId = is_array($pedido) ? (int) ($pedido['user_id'] ?? 0) : 0;
    $acao = is_array($pedido) && is_string($pedido['acao'] ?? null) ? $pedido['acao'] : '';
    $reqId = is_array($pedido) && is_string($pedido['request_id'] ?? null) ? substr($pedido['request_id'], 0, 64) : '';
    $payload = is_array($pedido) && is_array($pedido['payload'] ?? null) ? $pedido['payload'] : [];
    if (!is_array($pedido) || $userId <= 0 || $acao === '' || $reqId === '') {
        avpt_auditar($userId, $acao, $reqId, 400, 'PEDIDO_INVALIDO');
        return [400, avpt_envelope(false, null, 'PEDIDO_INVALIDO')];
    }

    try {
        switch ($acao) {
            case 'ler':
                $flagsPedidas = is_array($pedido['flags'] ?? null) ? $pedido['flags'] : [];
                $dados = [
                    'estado'    => avst_estado($pdo, $userId),
                    'historico' => avst_historico($pdo, $userId),
                    'favoritos' => avpt_favoritos($pdo, $userId),
                    'vida'      => [
                        'conquistas'    => vida_conquistas($pdo, $userId),
                        'eventos'       => vida_eventos(),
                        'desbloqueados' => vida_desbloqueados($pdo, $userId),
                    ],
                    'flags'     => avpt_flags($pdo, $userId, $flagsPedidas, $amb['resolver'] ?? null),
                    'limites'   => [
                        'por_hora'      => AVST_LIMITE_HORA,
                        'retencao'      => AVST_RETENCAO_VERSOES,
                        'nome_max'      => AVST_NOME_VERSAO_MAX,
                        'svg_bytes_max' => SvgSanitizer::MAX_BYTES,
                    ],
                ];
                break;
            case 'salvar':
                if (isset($payload['foto']) || isset($payload['config3d']) || isset($payload['reativar_id'])) {
                    throw new AvstErro('FUNCAO_DESLIGADA', 403);
                }
                $dados = avst_persistir($pdo, $userId, [
                    'config'       => $payload['config'] ?? null,
                    'svg'          => $payload['svg'] ?? null,
                    'base_version' => $payload['base_version'] ?? null,
                ], $amb['dirFisico'] ?? null);
                break;
            case 'reativar':
                $dados = avst_persistir($pdo, $userId, [
                    'reativar_id'  => (int) ($payload['id'] ?? 0),
                    'base_version' => $payload['base_version'] ?? null,
                ], $amb['dirFisico'] ?? null);
                break;
            case 'meta':
                $dados = avst_meta($pdo, $userId, $payload);
                break;
            case 'favorito':
                $dados = avpt_favorito_alternar($pdo, $userId, (string) ($payload['item'] ?? ''));
                break;
            default:
                throw new AvstErro('ACAO_INVALIDA', 400);
        }
        avpt_auditar($userId, $acao, $reqId, 200);
        return [200, avpt_envelope(true, $dados, null)];
    } catch (AvstErro $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        avpt_auditar($userId, $acao, $reqId, $e->status, $e->codigo);
        return [$e->status, avpt_envelope(false, $e->extra ?: null, $e->codigo)];
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('[avatar/ponte.php] ' . $e->getMessage());
        avpt_auditar($userId, $acao, $reqId, 500, 'ERRO_INTERNO');
        return [500, avpt_envelope(false, null, 'ERRO_INTERNO')];
    }
}
