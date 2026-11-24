<?php
/**
 * Geral V2 — bootstrap dos dois endpoints (resumo.php e lista.php). Arquivos .php diretos: não precisam de bloco novo no nginx.
 * Só GET. Sessão + nível ≥ 50 (a mesma regra do /api/pipedrive/overview que a Geral já usa). Só LEITURA da base local.
 */
declare(strict_types=1);

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/GeralV2.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => true]);

/** Portão comum: método → sessão → nível. Devolve o id do usuário logado. */
function geral_v2_portao(): int
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
    SessionGate::start();
    AuthHelpers::requireAuth(50);
    return AuthHelpers::getCurrentUserId();
}

/** Conexão que falha vira null (o serviço responde "indisponivel" naquela fonte; as outras seguem). Nunca expõe a mensagem. */
function geral_v2_pdo(string $fonte): ?PDO
{
    try {
        if ($fonte === 'BLING') {
            require_once __DIR__ . '/../bling/repositories/BlingRepository.php';
            return (new BlingRepository())->pdo();   // sessão em UTC (o próprio repositório fixa)
        }
        $pdo = getConnection($fonte);
        if ($fonte === 'GCAL_DSHOW') $pdo->exec("SET time_zone = '+00:00'");   // GCAL guarda UTC
        return $pdo;
    } catch (Throwable $e) {
        error_log('[geral-v2] conexão ' . $fonte . ': ' . get_class($e));
        return null;
    }
}

/**
 * Conflitos de hoje pela MESMA regra da central de conflitos do Calendar (GcalProviderBase::conflitos, via GcalDb do usuário).
 * Provedor em modo de demonstração (GCAL_PROVIDER=mock) ou com peça faltando → null ("indisponivel"): a Geral nunca mostra conflito fictício.
 */
function geral_v2_conflitos(?PDO $gcal, int $usuario): ?Closure
{
    if ($gcal === null) return null;
    return static function (string $de, string $ate) use ($gcal, $usuario): ?array {
        $g = __DIR__ . '/../google-calendar';
        foreach (['lib/Tz.php', 'lib/GcalProvider.php', 'lib/GcalCrypto.php', 'lib/GoogleOAuth.php', 'lib/GcalTransport.php', 'lib/GcalNormalizer.php',
                  'lib/GoogleCalendarClient.php', 'lib/GcalLinks.php', 'lib/GcalProviderBase.php', 'lib/GcalMock.php', 'lib/GcalDb.php',
                  'repositories/GcalRepository.php', 'services/GcalAuthService.php'] as $f) {
            require_once "$g/$f";
        }
        if (GcalMock::isEnabled()) return null;
        $repo = new GcalRepository($gcal);
        return (new GcalDb($repo, new GcalAuthService($repo), $usuario))->conflitos(['de' => $de, 'ate' => $ate, 'tz' => GeralV2::FUSO]);
    };
}

function geral_v2_servico(int $usuario): GeralV2
{
    $gcal = geral_v2_pdo('GCAL_DSHOW');
    return new GeralV2(geral_v2_pdo('PIPE_DSHOW'), $gcal, geral_v2_pdo('BLING'), $usuario, null, geral_v2_conflitos($gcal, $usuario));
}
