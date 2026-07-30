<?php
// Google Analytics / lib/GaReal.php — provedor real (Data API + Admin API)
// @module  google-analytics.lib.real
// @version 1.0.0
// @created 2026-07-30
//
// Molde: api/google-calendar/lib/GcalReal.php.
//
// Este arquivo existe para que a troca de provedor seja uma variável de ambiente, não uma
// refatoração. Hoje ele responde **503 dizendo exatamente o que falta** — que é muito mais
// útil que um 500 genérico ou, pior, um fallback silencioso para dados simulados.
//
// ⚠️ NUNCA fazer este provedor cair para o mock quando faltar credencial. Um painel que
// mostra número inventado sem avisar é o pior defeito possível num módulo de análise: já
// aconteceu neste projeto (a telemetria ficou 15 dias com ZERO 200 e ninguém viu, porque o
// erro voltava como `success:true`).
//
// O que a Fase 4 precisa implementar aqui, por método:
//   status()          → GET  /v1beta/properties/{id}/metadata            (valida credencial)
//   propriedades()    → Admin API: accountSummaries.list                 (quota: admin)
//   overview()        → Data API: properties.runReport                   (quota: core)
//   aquisicao()       → runReport com dimensões de sessão/campanha       (quota: core)
//   paginas()         → runReport com pagePath/pageTitle                 (quota: core)
//   eventos()         → runReport com eventName                          (quota: core)
//   conversoes()      → runReport + keyEvents da Admin API               (quota: core+admin)
//   ecommerce()       → runReport com itemName/itemId                    (quota: core)
//   usuarios()        → runReport + runReport de coorte                  (quota: core)
//   tempoReal()       → properties.runRealtimeReport                     (quota: REALTIME)
//   funil()           → properties.runFunnelReport                       (quota: FUNNEL)
//   qualidade()       → composto: metadata + eventos + Admin API
//
// ⚠️ Sem composer neste projeto (não há autoloader nem `vendor/`), o cliente HTTP tem de ser
// escrito à mão no molde de `api/pipedrive/lib/PipedriveClient.php`, que já resolve retry de
// 429, paginação e contabilidade de custo por chamada.
declare(strict_types=1);

final class GaReal implements GaProvider
{
    public function nome(): string { return 'ga4'; }

    /** O que falta para este provedor sair do 503. Ordem = ordem de resolução. */
    private static function pendencias(): array
    {
        $p = [];

        if (self::env('GA_OAUTH_CLIENT_ID') === '' && self::env('GA_SERVICE_ACCOUNT_JSON') === '') {
            $p[] = 'Credencial ausente: defina GA_SERVICE_ACCOUNT_JSON (recomendado) ou GA_OAUTH_CLIENT_ID/SECRET no .env';
        }
        if (self::env('GA_PROPERTY_ID') === '') {
            $p[] = 'GA_PROPERTY_ID não definido: informe o ID numérico da propriedade GA4 (a Fase 0 só confirmou o measurement ID G-WGDR8WJ7G8)';
        }
        if (self::env('GA_CRYPTO_KEY') === '') {
            $p[] = 'GA_CRYPTO_KEY não definida: o token só pode ser gravado cifrado (AES-GCM, molde de GcalCrypto)';
        }
        if (!self::temBancoLocal()) {
            $p[] = 'Banco analítico ausente: nenhuma tabela ga_* existe (o schema DSHOW_BI_ANALYTICS está vazio)';
        }
        $p[] = 'Projeto no Google Cloud com Google Analytics Data API e Admin API habilitadas';
        return $p;
    }

    private static function env(string $k): string
    {
        $v = getenv($k);
        return $v === false ? '' : trim($v);
    }

    /** Existe pelo menos uma tabela do módulo? (a Fase 0 mediu: zero) */
    private static function temBancoLocal(): bool
    {
        return self::env('DB_GA_DSHOW_NAME') !== '' && self::env('DB_GA_DSHOW_USER') !== '';
    }

    /**
     * 503 padronizado. Sempre com a lista de pendências — quem chamou precisa saber o que
     * fazer, e a tela mostra isso em vez de "erro desconhecido".
     */
    private function indisponivel(string $recurso): void
    {
        ApiResponse::error('GA_PROVIDER_NAO_CONFIGURADO', 503, [
            'message'    => 'A integração real com o Google Analytics ainda não está configurada.',
            'recurso'    => $recurso,
            'pendencias' => self::pendencias(),
            'como_demonstrar' => 'Defina GA_PROVIDER=mock no .env para navegar o módulo com dados simulados.',
            'documentacao'    => 'docs/GOOGLE-ANALYTICS/00-fase0-investigacao.md',
        ]);
    }

    public function status(): array
    {
        // ⚠️ O status NÃO lança 503: a tela de status precisa poder dizer "não configurado"
        // sem que a requisição falhe, senão o usuário fica sem diagnóstico nenhum.
        $pend = self::pendencias();
        return [
            'provedor'   => 'ga4',
            'pronto'     => $pend === [],
            'pendencias_para_real' => $pend,
            'meta' => [
                'fonte'         => 'ga4-data-api',
                'atualizado_em' => (new DateTimeImmutable('now', new DateTimeZone('America/Sao_Paulo')))->format('c'),
                'parcial'       => true,
            ],
        ];
    }

    public function propriedades(): array          { $this->indisponivel('propriedades'); }
    public function overview(array $f): array      { $this->indisponivel('overview'); }
    public function aquisicao(array $f): array     { $this->indisponivel('aquisicao'); }
    public function fluxoAquisicao(array $f): array{ $this->indisponivel('fluxo-aquisicao'); }
    public function paginas(array $f): array       { $this->indisponivel('paginas'); }
    public function eventos(array $f): array       { $this->indisponivel('eventos'); }
    public function conversoes(array $f): array    { $this->indisponivel('conversoes'); }
    public function ecommerce(array $f): array     { $this->indisponivel('ecommerce'); }
    public function usuarios(array $f): array      { $this->indisponivel('usuarios'); }
    public function qualidade(array $f): array     { $this->indisponivel('qualidade'); }
    public function alertas(array $f): array       { $this->indisponivel('alertas'); }
    public function insights(array $f): array      { $this->indisponivel('insights'); }
    public function tempoReal(array $f): array     { $this->indisponivel('tempo-real'); }
    public function funil(array $f): array         { $this->indisponivel('funil'); }
    // ⚠️ Na Fase 4 este método NÃO tem endpoint direto na Data API: caminho entre páginas se
    // monta com `runReport` sequencial ou, de verdade, com BigQuery (evento bruto por sessão).
    public function jornada(array $f): array       { $this->indisponivel('jornada'); }
}
