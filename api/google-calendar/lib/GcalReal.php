<?php
// Google Calendar / GcalReal - provedor REAL (Fase 4) — ainda nao implementado
// @module google-calendar.real
// @version 1.0.0
// @created 2026-07-29
// @app Google Calendar
//
// Ativo quando GCAL_PROVIDER != mock. Hoje NADA aqui pode funcionar: nao ha
// projeto no Google Cloud, credencial OAuth, escopo concedido nem banco
// GCAL_DSHOW (achados §3 da Fase 0). Em vez de fingir, cada metodo devolve um
// 503 que diz exatamente o que falta.
//
// Isto e deliberado e segue o que o modulo Ads ja faz: trocar o .env sem ter
// provisionado o resto tem de dar erro CLARO, nunca tela vazia — tela vazia
// leva o operador a procurar bug no front que nao existe.
declare(strict_types=1);

final class GcalReal implements GcalProvider
{
    public function nome(): string { return 'google'; }

    /**
     * O que ainda falta para o provedor real subir.
     *
     * A lista NAO mora aqui: vem de GcalGoLive, o mesmo lugar que alimenta a
     * rota /status e o script de terminal. Tres respostas iguais para a mesma
     * pergunta e o que impede o operador de perseguir pendencia fantasma.
     */
    private static function pendencias(): array
    {
        return GcalGoLive::pendencias();
    }

    /** @return never */
    private static function indisponivel(): void
    {
        ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, [
            'message'    => 'Integração real do Google Calendar ainda não provisionada. '
                          . 'Use GCAL_PROVIDER=mock para o ambiente de demonstração.',
            'pendencias' => self::pendencias(),
        ]);
    }

    /**
     * O status e a UNICA rota que responde 200 sem provisionamento: a tela de
     * Contas precisa poder dizer "não conectado" em vez de quebrar.
     */
    public function status(): array
    {
        return [
            'provider'   => 'google',
            'mock'       => false,
            'configured' => GoogleOAuth::isConfigured() && GcalCrypto::isConfigured(),
            'connected'  => false,
            'accounts'   => 0,
            'accounts_with_problem' => 0,
            'calendars'  => 0,
            'scopes'     => [],
            'oauth_stage' => null,
            'last_sync_at' => null,
            'stale_calendars' => 0,
            'pendencias' => self::pendencias(),
            // `golive` e acrescentado pelo StatusController, para todos os
            // provedores — nao duplicar aqui.
            'message'    => 'Nenhuma conta Google conectada.',
        ];
    }

    public function contas(): array { self::indisponivel(); }
    public function calendarios(): array { self::indisponivel(); }
    public function eventos(array $f): array { self::indisponivel(); }
    public function evento(string $calendarId, string $eventId): ?array { self::indisponivel(); }
    public function criarEvento(array $payload): array { self::indisponivel(); }
    public function atualizarEvento(string $calendarId, string $eventId, array $payload, string $escopo = 'this'): array { self::indisponivel(); }
    public function excluirEvento(string $calendarId, string $eventId, bool $notificar, string $escopo = 'this'): void { self::indisponivel(); }
    public function freeBusy(array $f): array { self::indisponivel(); }
    public function convites(array $f): array { self::indisponivel(); }
    public function responderConvite(string $calendarId, string $eventId, string $resposta, ?string $comentario): array { self::indisponivel(); }
    public function conflitos(array $f): array { self::indisponivel(); }
    public function alertas(array $f): array { self::indisponivel(); }
    public function overview(array $f): array { self::indisponivel(); }
    public function sincronizacao(): array { self::indisponivel(); }

    public function vincular(string $calendarId, string $eventId, array $link): array { self::indisponivel(); }
    public function desvincular(string $calendarId, string $eventId, string $tipo, string $id): array { self::indisponivel(); }

    /** O catalogo nao depende de dado: a tela pode montar o seletor mesmo sem conta. */
    public function tiposRelatorio(): array { return GcalReports::tipos(); }
    public function relatorio(string $tipo, array $f): array { self::indisponivel(); }
}
