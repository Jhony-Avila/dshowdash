<?php
/**
 * Geral V2 — bootstrap dos endpoints em api/geral/v2/*.php (contrato da CIMA, 23/11). Arquivos .php diretos: NÃO precisam de bloco novo
 * no nginx (só `/api/<módulo>/…` sem .php precisaria). Só GET. Sessão + nível ≥ 50 (a mesma regra do /api/pipedrive/overview).
 * Só LEITURA da base local (PIPE_DSHOW, GCAL_DSHOW, BLING e, desde 25/11, APP_DSHOW.fin_pcf_* do coletor do Precifica). Nenhuma API externa.
 */
declare(strict_types=1);

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/GeralV2.php';
require_once __DIR__ . '/GeralV2Contrato.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => true]);

/** Portão comum: método → sessão → nível ≥ 50. Devolve o id do usuário logado (401/403 = "Sem acesso" na tela). */
function geral_v2_portao(): int
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
    SessionGate::start();
    AuthHelpers::requireAuth(50);
    return AuthHelpers::getCurrentUserId();
}

/** Conexão que falha vira null (aquela fonte responde "erro"; as outras seguem). Nunca expõe a mensagem. */
function geral_v2_pdo(string $fonte): ?PDO
{
    try {
        if ($fonte === 'BLING') {
            // 26/11 (404 da Geral V2 em produção): o BlingRepository encerra com 404 quando incluído fora de uma entrada declarada.
            // A Geral V2 é uma entrada autenticada (sessão + nível ≥ 50, acima), como a do /api/status: declara a entrada antes de incluir.
            if (!defined('BLING_ENTRADA')) define('BLING_ENTRADA', true);
            require_once __DIR__ . '/../bling/repositories/BlingRepository.php';
            return (new BlingRepository())->pdo();   // o próprio repositório fixa a sessão em UTC
        }
        $pdo = getConnection($fonte);
        if ($fonte === 'GCAL_DSHOW') $pdo->exec("SET time_zone = '+00:00'");   // o GCAL guarda UTC
        return $pdo;
    } catch (Throwable $e) {
        error_log('[geral-v2] conexão ' . $fonte . ': ' . get_class($e));
        return null;
    }
}

/**
 * Provedor da agenda do usuário = o GcalDb do módulo do Calendar (conflitos pela MESMA regra da central de conflitos; eventos do espelho).
 * Carregado só quando pedido. Modo de demonstração (GCAL_PROVIDER=mock) ou peça faltando → null ("erro"): a Geral nunca mostra agenda fictícia.
 */
function geral_v2_provedor_agenda(?PDO $gcal, int $usuario): ?Closure
{
    if ($gcal === null) return null;
    return static function () use ($gcal, $usuario): ?object {
        $g = __DIR__ . '/../google-calendar';
        foreach (['lib/Tz.php', 'lib/GcalProvider.php', 'lib/GcalCrypto.php', 'lib/GoogleOAuth.php', 'lib/GcalTransport.php', 'lib/GcalNormalizer.php',
                  'lib/GoogleCalendarClient.php', 'lib/GcalLinks.php', 'lib/GcalProviderBase.php', 'lib/GcalMock.php', 'lib/GcalDb.php',
                  'repositories/GcalRepository.php', 'services/GcalAuthService.php'] as $f) {
            require_once "$g/$f";
        }
        if (GcalMock::isEnabled()) return null;
        $repo = new GcalRepository($gcal);
        return new GcalDb($repo, new GcalAuthService($repo), $usuario);
    };
}

function geral_v2_contrato(int $usuario): GeralV2Contrato
{
    $gcal = geral_v2_pdo('GCAL_DSHOW');
    // 25/11: o "Recebido" lê APP_DSHOW.fin_pcf_* pela conexão do Dash (DSHOWDASH), com GRANT SELECT SÓ nessas tabelas (portão GERAL-V2-PRECIFICA-ACESSO).
    // Sem o GRANT a consulta falha → "—" com "Não foi possível ler…" (nunca zero).
    // 26/11 F03 (P0): o "Recebido" (financeiro) só para quem tem a flag POR PESSOA financeiro_asaas_leitura; sem ela (ou flag ilegível) nem a conexão é passada.
    $fin = GeralV2::podeFinanceiro($usuario, static function (string $k, int $u): array {
        require_once __DIR__ . '/../feature-flags/resolver.php';
        return (new FeatureFlagResolver(getConnection('DSHOWDASH')))->resolve($k, $u);
    });
    return new GeralV2Contrato(new GeralV2(geral_v2_pdo('PIPE_DSHOW'), $gcal, geral_v2_pdo('BLING'), $usuario, null, geral_v2_provedor_agenda($gcal, $usuario),
        fin: $fin ? geral_v2_pdo('DSHOWDASH') : null, financeiro: $fin));
}


/** Texto da query (ou null). */
function geral_v2_q(string $k): ?string
{
    return is_string($_GET[$k] ?? null) ? $_GET[$k] : null;
}
