<?php
// Google Analytics / lib/GaProvider.php — contrato do provedor de dados
// @module  google-analytics.lib.provider
// @version 1.0.0
// @created 2026-07-30
//
// Molde: api/google-calendar/lib/GcalProvider.php.
//
// Este é o contrato da §54 do briefing, do lado do PHP. O front conversa com a API
// interna; a API conversa com ESTA interface. Trocar `GaMock` por `GaReal` (Data API +
// Admin API) não muda rota, contrato nem tela — é o ponto do desenho (§4.3, §83).
//
// ⚠️ Toda implementação DEVE devolver, junto com os dados, a procedência: `fonte`
// ('mock' | 'ga4-data-api' | 'bigquery' | 'cache'), `atualizado_em` e `parcial`. A §49 do
// briefing é explícita: divergência entre a Data API e a interface do GA4 existe e NÃO
// deve ser escondida. Quem consome precisa saber de onde veio o número.
declare(strict_types=1);

interface GaProvider
{
    /** Identificador curto do provedor — vai no `meta.fonte` de toda resposta. */
    public function nome(): string;

    /** Prontidão da integração: o que está configurado e o que falta. */
    public function status(): array;

    // ── Administração (Admin API) ────────────────────────────────────────
    /** Contas, propriedades e streams acessíveis (§13, §48). */
    public function propriedades(): array;

    // ── Relatórios principais (Data API — categoria de quota Core) ───────
    /** KPIs + série temporal + "exige atenção" da Visão Geral (§15, §16, §17). */
    public function overview(array $f): array;

    /** Aquisição: KPIs por canal/origem/mídia/campanha + grid (§19, §20, §22). */
    public function aquisicao(array $f): array;

    /** Sankey canal → origem/mídia → campanha → landing → evento → conversão (§21). */
    public function fluxoAquisicao(array $f): array;

    /** Páginas e landing pages (§23, §24). */
    public function paginas(array $f): array;

    /** Central de eventos, com classificação e diagnóstico (§28). */
    public function eventos(array $f): array;

    /** Eventos importantes / conversões (§29). */
    public function conversoes(array $f): array;

    /** E-commerce, produtos e checkout (§33, §34, §35). */
    public function ecommerce(array $f): array;

    /** Usuários, retenção, coortes, dispositivos e localizações (§36–§40). */
    public function usuarios(array $f): array;

    /** Qualidade da coleta e diagnóstico de instrumentação (§42). */
    public function qualidade(array $f): array;

    /** Insights, anomalias e alertas (§50, §52). */
    public function alertas(array $f): array;

    // ── Relatórios especializados (categorias de quota SEPARADAS) ────────
    // ⚠️ A Data API cobra Core, Realtime e Funnel em categorias de quota DIFERENTES
    // (§57). Manter os três em métodos distintos é o que permite medir e limitar cada
    // um sem derrubar os outros — não é separação cosmética.

    /** Tempo real (§18). Categoria de quota: Realtime. */
    public function tempoReal(array $f): array;

    /** Funil (§30, §31). Categoria de quota: Funnel. */
    public function funil(array $f): array;
}
