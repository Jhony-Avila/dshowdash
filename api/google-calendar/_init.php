<?php
// Google Calendar / _init.php - bootstrap do modulo
// @module google-calendar.init
// @version 1.0.0
// @created 2026-07-29
//
// Molde: api/outlook/_init.php (que por sua vez espelha api/pipedrive/_init.php).
// Concentra requires, CORS e helpers de body/acesso.
declare(strict_types=1);

// ── Nucleo compartilhado ────────────────────────────────────────
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';

// ── Bibliotecas do modulo ───────────────────────────────────────
require_once __DIR__ . '/lib/Tz.php';
require_once __DIR__ . '/lib/GcalProvider.php';
require_once __DIR__ . '/lib/GcalCrypto.php';
require_once __DIR__ . '/lib/GoogleOAuth.php';
require_once __DIR__ . '/lib/GcalTransport.php';
require_once __DIR__ . '/lib/GcalNormalizer.php';
require_once __DIR__ . '/lib/GoogleCalendarClient.php';
require_once __DIR__ . '/lib/GcalLinks.php';
require_once __DIR__ . '/lib/GcalReports.php';
require_once __DIR__ . '/lib/GcalXlsx.php';
require_once __DIR__ . '/lib/GcalGoLive.php';
require_once __DIR__ . '/lib/GcalProviderBase.php';
require_once __DIR__ . '/lib/GcalMock.php';
require_once __DIR__ . '/lib/GcalReal.php';
require_once __DIR__ . '/lib/GcalDb.php';

// ── Persistencia e servicos (Fase 4) ────────────────────────────
// Carregados sempre: sao baratos (so definicoes) e o /status precisa saber se
// o banco esta de pe para dizer o que ainda falta.
require_once __DIR__ . '/repositories/GcalRepository.php';
require_once __DIR__ . '/services/GcalAuthService.php';
require_once __DIR__ . '/services/GcalSyncService.php';
require_once __DIR__ . '/services/GcalWatchService.php';
require_once __DIR__ . '/services/GcalQueueService.php';

// ── Controllers ─────────────────────────────────────────────────
require_once __DIR__ . '/controllers/StatusController.php';
require_once __DIR__ . '/controllers/CalendarController.php';
require_once __DIR__ . '/controllers/EventController.php';
require_once __DIR__ . '/controllers/FreeBusyController.php';
require_once __DIR__ . '/controllers/InvitationController.php';
require_once __DIR__ . '/controllers/ConflictController.php';
require_once __DIR__ . '/controllers/AlertController.php';
require_once __DIR__ . '/controllers/OverviewController.php';
require_once __DIR__ . '/controllers/SyncController.php';
require_once __DIR__ . '/controllers/WebhookController.php';
require_once __DIR__ . '/controllers/AccountController.php';
require_once __DIR__ . '/controllers/ReportController.php';
require_once __DIR__ . '/controllers/LinkController.php';

CorsPolicy::setupApiEndpoint([
    'methods'  => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'no_cache' => true,
]);

/** Body JSON do request. [] se vazio; 400 se malformado. */
function gcal_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        ApiResponse::error(ApiResponse::ERR_INVALID_JSON, 400, ['message' => 'Corpo JSON invalido']);
    }
    return $data;
}

/**
 * Acesso ao modulo: qualquer usuario autenticado (nivel 0). O isolamento e por
 * user_id: cada usuario ve apenas as proprias contas e calendarios. Visoes de
 * equipe (§37) exigem nivel de gestor e sao checadas no proprio controller.
 */
function gcal_require_access(): void
{
    AuthHelpers::requireAuth();
}

/** Modo de testes (dados ficticios, sem Google API/DB) — ligado por GCAL_PROVIDER=mock. */
function gcal_is_mock(): bool
{
    return GcalMock::isEnabled();
}

/**
 * Provedor ativo. A troca NAO muda rota, contrato nem tela — e esse o ponto do
 * desenho (§87 do briefing).
 *
 *   GCAL_PROVIDER=mock    -> GcalMock  (dados ficticios, sem rede nem banco)
 *   GCAL_PROVIDER=google  -> GcalDb    (le GCAL_DSHOW, escreve via Google API)
 *
 * Se `google` estiver pedido mas faltar peca (banco fora do ar, GCAL_CRYPTO_KEY
 * ausente, OAuth nao configurado), cai em GcalReal — que responde 503 dizendo
 * EXATAMENTE o que falta. Sem isso o sintoma seria erro 500 generico, e a
 * pessoa que estiver ligando as credenciais nao teria como saber onde parou.
 */
function gcal_provider(): GcalProvider
{
    if (gcal_is_mock()) return new GcalMock();

    try {
        $repo = new GcalRepository();
        return new GcalDb($repo, new GcalAuthService($repo), AuthHelpers::getCurrentUserId());
    } catch (\Throwable $e) {
        error_log('[gcal] provedor real indisponivel, caindo para 503: ' . $e->getMessage());
        return new GcalReal();
    }
}

/** Inteiro de query com faixa; devolve o default quando ausente/invalido. */
function gcal_qint(string $key, int $default, int $min, int $max): int
{
    $v = $_GET[$key] ?? null;
    if ($v === null || $v === '' || !is_numeric($v)) return $default;
    $n = (int)$v;
    return $n < $min ? $min : ($n > $max ? $max : $n);
}

/**
 * Filtros comuns de janela, lidos da query string.
 *
 * A janela e OBRIGATORIAMENTE limitada (teto de 400 dias): o §77 proibe carregar
 * todo o historico de todos os calendarios, e sem teto um `?de=1970-01-01` na
 * barra de endereco derruba o modulo. O fuso vem do cliente e cai no padrao
 * quando invalido — nunca no default do processo PHP (§47.1).
 */
function gcal_filtros(): array
{
    $tz  = Tz::normalizar(gcal_qstr('tz', 64));
    $hoje = (new \DateTimeImmutable('now', new \DateTimeZone($tz)));

    $data = static function (?string $v, \DateTimeImmutable $fallback): \DateTimeImmutable {
        if ($v !== null && preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) {
            $d = \DateTimeImmutable::createFromFormat('Y-m-d|', $v);
            if ($d instanceof \DateTimeImmutable) return $d;
        }
        return $fallback;
    };

    $de  = $data(gcal_qstr('de', 10), $hoje);
    $ate = $data(gcal_qstr('ate', 10), $hoje);
    if ($ate < $de) { [$de, $ate] = [$ate, $de]; }
    if ($de->diff($ate)->days > 400) { $ate = $de->modify('+400 days'); }

    $cals = gcal_qstr('calendars', 2000);
    $lista = $cals === null ? null : array_values(array_filter(array_map('trim', explode(',', $cals))));

    return [
        'de'        => $de->format('Y-m-d'),
        'ate'       => $ate->format('Y-m-d'),
        'tz'        => $tz,
        'calendars' => $lista,
        'q'         => gcal_qstr('q', 200),
        'tipo'      => gcal_qstr('tipo', 30),
        'resposta'  => gcal_qstr('resposta', 20),
        'categoria' => gcal_qstr('categoria', 30),
        'severidade' => gcal_qstr('severidade', 10),
        'incluir_cancelados' => (gcal_qstr('incluir_cancelados', 5) === '1'),
    ];
}

/** String de query saneada (trim + teto de tamanho); null quando ausente. */
function gcal_qstr(string $key, int $max = 200): ?string
{
    $v = $_GET[$key] ?? null;
    if (!is_string($v)) return null;
    $v = trim($v);
    if ($v === '') return null;
    return mb_substr($v, 0, $max);
}
