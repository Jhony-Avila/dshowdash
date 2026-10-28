<?php
// Google Calendar / GcalProvider - contrato unico de fonte de dados
// @module google-calendar.provider
// @version 1.0.0
// @created 2026-07-29
//
// Espelha o contrato GoogleCalendarService do §52 do briefing, do lado do PHP.
// Os controllers falam SO com esta interface — por isso trocar GcalMock por
// GcalReal (Fase 4) nao mexe em rota, envelope de resposta nem tela (§87).
//
// Convencoes que valem para TODAS as implementacoes:
//   · toda data/hora que entra ou sai e ISO-8601 COM offset (ver lib/Tz.php);
//   · evento de dia inteiro usa `all_day: true` + datas puras (yyyy-mm-dd);
//   · IDs externos do Google (event_id, calendar_id, ical_uid, recurring_event_id)
//     sao preservados sem reescrita (§58);
//   · nenhum metodo devolve token, refresh token ou segredo (§75.2).
declare(strict_types=1);

interface GcalProvider
{
    /** Identificacao do provedor, para o rodape de status e a faixa de mock. */
    public function nome(): string;

    /** Estado da integracao: conectado, escopos, contas, ultima sincronizacao. */
    public function status(): array;

    /** Contas Google conectadas pelo usuario (§55). Sem tokens. */
    public function contas(): array;

    /** Lista de calendarios acessiveis, com cor, papel de acesso e favoritos (§27). */
    public function calendarios(): array;

    /**
     * Eventos de uma janela.
     * @param array{de:string,ate:string,tz:string,calendars?:array<string>,q?:?string,
     *              tipo?:?string,resposta?:?string,somente_conflito?:bool} $f
     */
    public function eventos(array $f): array;

    /** Um evento com todos os detalhes (participantes, recorrencia, vinculos). */
    public function evento(string $calendarId, string $eventId): ?array;

    /** Cria evento. Devolve o evento criado. */
    public function criarEvento(array $payload): array;

    /** Atualiza evento. `escopo` = this|following|all para series recorrentes (§19). */
    public function atualizarEvento(string $calendarId, string $eventId, array $payload, string $escopo = 'this'): array;

    /** Remove/cancela evento. `notificar` controla o aviso aos participantes (§59). */
    public function excluirEvento(string $calendarId, string $eventId, bool $notificar, string $escopo = 'this'): void;

    /** Disponibilidade agregada + melhores horarios sugeridos (§22). */
    public function freeBusy(array $f): array;

    /** Convites do usuario por categoria (§44). */
    public function convites(array $f): array;

    /** Responde a um convite: accepted|declined|tentative (§44.2). */
    public function responderConvite(string $calendarId, string $eventId, string $resposta, ?string $comentario): array;

    /** Conflitos detectados na janela (§23). */
    public function conflitos(array $f): array;

    /** Alertas de agenda/organizacao/tecnicos (§62). */
    public function alertas(array $f): array;

    /** KPIs + series do dashboard Hoje e Visao Geral (§15, §16, §38). */
    public function overview(array $f): array;

    /** Estado da sincronizacao por calendario (§51). */
    public function sincronizacao(): array;

    /** Anexa um vinculo interno ao evento (§57). Devolve o evento atualizado. */
    public function vincular(string $calendarId, string $eventId, array $link): array;

    /** Remove um vinculo interno do evento. */
    public function desvincular(string $calendarId, string $eventId, string $tipo, string $id): array;

    /** Catalogo de relatorios disponiveis (§64). */
    public function tiposRelatorio(): array;

    /**
     * Um relatorio agregado.
     *
     * Devolve SEMPRE o mesmo formato — {colunas, linhas, totais, serie} — para
     * que a tela seja generica. Doze relatorios com doze formatos exigiriam doze
     * telas; com contrato unico, um relatorio novo e so mais um `case` aqui.
     */
    public function relatorio(string $tipo, array $f): array;
}
