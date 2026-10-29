<?php
declare(strict_types=1);

/**
 * /api/ponte/libs/AgendaLib.php — ESCRITA no Google Calendar pela Ponte v2 (Programa PARIDADE TOTAL, W4): o app pede, o Dash grava pelo
 * MESMO pipeline do painel (GcalDb → GoogleCalendarClient → espelho GCAL_DSHOW + auditoria). Nenhuma regra nova: posse da conta
 * (gcal_accounts.user_id), papel de acesso do calendário (owner|writer) e validação do payload continuam sendo os do módulo
 * (GcalDb::exigirEscrita/contaDo, GcalEventController::validar). Exige GCAL_OAUTH_STAGE=write (escopo calendar.events) — em `read` responde
 * 409 CONFLITO com a explicação, sem tentar o Google.
 *
 *  - agenda_responder {calendar_id, event_id, resposta accepted|declined|tentative, comentario?} → GcalDb::responderConvite
 *  - agenda_criar     {calendar_id, summary, start, end, all_day?, time_zone?, description?, location?, attendees?[{email}], notificar?} → GcalDb::criarEvento
 *  - agenda_atualizar {calendar_id, event_id, escopo this|all, + campos} → GcalDb::atualizarEvento
 *  - agenda_excluir   {calendar_id, event_id, notificar?, escopo?} → GcalDb::excluirEvento
 * Provedor injetável nos testes: $GLOBALS['PV2_AGENDA_PROVIDER'] = fn(int $userId): GcalProvider.
 */
require_once __DIR__ . '/../PonteErro.php';
require_once __DIR__ . '/../../_helpers/ApiResponse.php';

/** Carrega o módulo do Google Calendar sem os efeitos do _init.php (sessão/CORS): só libs, repositório, serviço de auth e o controller (validação). */
function agenda_carregar_modulo(): void
{
    static $ok = false;
    if ($ok) { return; }
    $g = __DIR__ . '/../../google-calendar';
    foreach (['lib/Tz.php', 'lib/GcalProvider.php', 'lib/GcalCrypto.php', 'lib/GoogleOAuth.php', 'lib/GcalTransport.php', 'lib/GcalNormalizer.php',
              'lib/GoogleCalendarClient.php', 'lib/GcalLinks.php', 'lib/GcalProviderBase.php', 'lib/GcalDb.php', 'repositories/GcalRepository.php',
              'services/GcalAuthService.php', 'controllers/EventController.php'] as $f) {
        require_once "$g/$f";
    }
    $ok = true;
}

function agenda_stage(): string
{
    return strtolower((string)(getenv('GCAL_OAUTH_STAGE') ?: 'read'));
}

/** Provedor REAL do usuário (GcalDb com o user_id do app) — ou o injetado nos testes. */
function agenda_provider(int $userId): object   // GcalDb em produção; objeto com a mesma assinatura nos testes
{
    $f = $GLOBALS['PV2_AGENDA_PROVIDER'] ?? null;
    if (is_callable($f)) { return $f($userId); }
    agenda_carregar_modulo();
    $repo = new GcalRepository();
    return new GcalDb($repo, new GcalAuthService($repo), $userId);
}

function agenda_exigir_escrita(): void
{
    if (agenda_stage() !== 'write') {
        throw new PonteErro('CONFLITO', 409, ['message' => 'Google Calendar conectado só para leitura (GCAL_OAUTH_STAGE=read). Para gravar, o administrador precisa ligar a etapa de escrita e reconectar a conta.', 'stage' => agenda_stage()]);
    }
}

function agenda_str(array $p, string $k, int $max = 2000): ?string
{
    $v = $p[$k] ?? null;
    if (!is_string($v)) { return null; }
    $v = trim($v);
    return $v === '' ? null : mb_substr($v, 0, $max);
}

/** Erros do módulo → códigos da ponte (mesma leitura que os controllers do painel fazem). */
function agenda_traduzir(Throwable $e): PonteErro
{
    if ($e instanceof PonteErro) { return $e; }
    if ($e instanceof InvalidArgumentException) { return new PonteErro('VALIDACAO', 422, ['campos' => ['payload' => $e->getMessage()]]); }
    if ($e instanceof RuntimeException) {
        $m = $e->getMessage();
        if (stripos($m, 'permiss') !== false) { return new PonteErro('PERMISSAO_NEGADA', 403, ['message' => $m]); }
        return new PonteErro(ApiResponse::ERR_NOT_FOUND, 404, ['message' => $m]);
    }
    if (class_exists('GcalApiException') && $e instanceof GcalApiException) {
        return new PonteErro('ORIGEM_INDISPONIVEL', 503, ['message' => 'Google Calendar: ' . $e->getMessage(), 'motivo' => $e->motivo]);
    }
    return new PonteErro('ORIGEM_INDISPONIVEL', 503, ['message' => 'Google Calendar indisponível no momento.']);
}

/** Payload do app → corpo do módulo (nomes do GcalEventController::validar). */
function agenda_corpo(array $p): array
{
    $b = [];
    foreach (['summary', 'description', 'location', 'time_zone', 'start', 'end'] as $k) {
        $v = agenda_str($p, $k, $k === 'description' ? 8000 : 500);
        if ($v !== null) { $b[$k] = $v; }
    }
    if (array_key_exists('all_day', $p)) { $b['all_day'] = (bool)$p['all_day']; }
    if (array_key_exists('notificar', $p)) { $b['notificar'] = (bool)$p['notificar']; }
    if (isset($p['attendees']) && is_array($p['attendees'])) {
        $b['attendees'] = [];
        foreach (array_slice($p['attendees'], 0, 50) as $a) {
            $mail = is_array($a) ? ($a['email'] ?? null) : $a;
            if (is_string($mail) && $mail !== '') { $b['attendees'][] = ['email' => mb_substr(trim($mail), 0, 254)]; }
        }
    }
    if (isset($p['calendar_id']) && is_string($p['calendar_id'])) { $b['calendar_id'] = trim($p['calendar_id']); }
    return $b;
}

function agenda_calendar_event(array $p): array
{
    $cal = agenda_str($p, 'calendar_id', 254);
    $ev = agenda_str($p, 'event_id', 1024);
    $erros = [];
    if ($cal === null) { $erros['calendar_id'] = 'obrigatório'; }
    if ($ev === null) { $erros['event_id'] = 'obrigatório'; }
    if ($erros !== []) { throw new PonteErro('VALIDACAO', 422, ['campos' => $erros]); }
    return [$cal, $ev];
}

function agenda_responder(int $userId, array $p): array
{
    agenda_exigir_escrita();
    [$cal, $ev] = agenda_calendar_event($p);
    $resposta = agenda_str($p, 'resposta', 20);
    if (!in_array($resposta, ['accepted', 'declined', 'tentative'], true)) {
        throw new PonteErro('VALIDACAO', 422, ['campos' => ['resposta' => 'accepted|declined|tentative']]);
    }
    try {
        return agenda_provider($userId)->responderConvite($cal, $ev, $resposta, agenda_str($p, 'comentario', 480));
    } catch (Throwable $e) {
        throw agenda_traduzir($e);
    }
}

function agenda_criar(int $userId, array $p): array
{
    agenda_exigir_escrita();
    $b = agenda_corpo($p);
    $erros = [];
    if (($b['calendar_id'] ?? '') === '') { $erros['calendar_id'] = 'obrigatório'; }
    agenda_carregar_modulo_validacao();
    $erros += GcalEventController::validar($b);
    if ($erros !== []) { throw new PonteErro('VALIDACAO', 422, ['campos' => $erros]); }
    try {
        return agenda_provider($userId)->criarEvento($b);
    } catch (Throwable $e) {
        throw agenda_traduzir($e);
    }
}

function agenda_atualizar(int $userId, array $p): array
{
    agenda_exigir_escrita();
    [$cal, $ev] = agenda_calendar_event($p);
    $b = agenda_corpo($p);
    unset($b['calendar_id']);
    if ($b === []) { throw new PonteErro('VALIDACAO', 422, ['campos' => ['payload' => 'Envie pelo menos um campo.']]); }
    if (isset($b['start']) || isset($b['end'])) {
        agenda_carregar_modulo_validacao();
        $erros = GcalEventController::validarPeriodo($b);
        if ($erros !== []) { throw new PonteErro('VALIDACAO', 422, ['campos' => $erros]); }
    }
    $escopo = agenda_str($p, 'escopo', 10) ?? 'this';
    if (!in_array($escopo, ['this', 'all'], true)) { $escopo = 'this'; }
    try {
        return agenda_provider($userId)->atualizarEvento($cal, $ev, $b, $escopo);
    } catch (Throwable $e) {
        throw agenda_traduzir($e);
    }
}

function agenda_excluir(int $userId, array $p): array
{
    agenda_exigir_escrita();
    [$cal, $ev] = agenda_calendar_event($p);
    $escopo = agenda_str($p, 'escopo', 10) ?? 'this';
    if (!in_array($escopo, ['this', 'all'], true)) { $escopo = 'this'; }
    try {
        agenda_provider($userId)->excluirEvento($cal, $ev, !empty($p['notificar']), $escopo);
    } catch (Throwable $e) {
        throw agenda_traduzir($e);
    }
    return ['calendar_id' => $cal, 'event_id' => $ev, 'deleted' => true];
}

/** A validação é a do controller do painel (uma implementação); nos testes sem o módulo carregado, usa a cópia mínima abaixo. */
function agenda_carregar_modulo_validacao(): void
{
    if (class_exists('GcalEventController')) { return; }
    if (!empty($GLOBALS['PV2_AGENDA_SEM_MODULO'])) {
        require_once __DIR__ . '/AgendaValidacaoFallback.php';
        return;
    }
    agenda_carregar_modulo();
}
