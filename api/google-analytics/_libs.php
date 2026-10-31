<?php
// Google Analytics / _libs.php — bibliotecas, provedores e filtros do módulo SEM efeito HTTP (nada de headers, sessão ou exit)
// @module  google-analytics.libs
// @created 2026-10-31 (Noite 2): separado do _init.php por movimento textual para a Ponte v2 (leitura `analytics`) reutilizar os
//          provedores; o _init.php continua com CORS, sessão e o gate de nível.
declare(strict_types=1);

// ⚠️ Banco entra aqui por UM motivo só: a conciliação de leads (§32) precisa do lado CRM
// REAL (PIPE_DSHOW). O módulo NÃO tem banco próprio — nenhuma tabela `ga_*` existe.
// Toda leitura daqui é somente-leitura e vive em `GaCrm`.
require_once __DIR__ . '/../../config/db_connection.php';
if (is_file(__DIR__ . '/../core/helpers/RedisHelper.php')) { require_once __DIR__ . '/../core/helpers/RedisHelper.php'; }   // cache do provedor real (falha = sem cache)

// ── Bibliotecas do módulo ───────────────────────────────────────
require_once __DIR__ . '/lib/GaProvider.php';
require_once __DIR__ . '/lib/GaCrm.php';
require_once __DIR__ . '/lib/GaMock.php';
require_once __DIR__ . '/lib/GaGoogleClient.php';
require_once __DIR__ . '/lib/GaReal.php';

/** Modo de demonstração — ligado por GA_PROVIDER=mock (default). */
function ga_is_mock(): bool
{
    return GaMock::isEnabled();
}

/**
 * Provedor ativo. A troca NÃO muda rota, contrato nem tela (§4.3, §83 do briefing).
 * ⚠️ O real responde 503 com a lista de pendências; jamais cai para mock silenciosamente.
 */
function ga_provider(): GaProvider
{
    return ga_is_mock() ? new GaMock() : new GaReal();
}

/** Inteiro de query com faixa; devolve o default quando ausente/inválido. */
function ga_qint_de(array $q, string $key, int $default, int $min, int $max): int
{
    $v = $q[$key] ?? null;
    if ($v === null || $v === '' || !is_numeric($v)) { return $default; }
    $n = (int)$v;
    return $n < $min ? $min : ($n > $max ? $max : $n);
}

/**
 * Filtros globais (§66), lidos da query string e NORMALIZADOS aqui — nunca no provedor.
 *
 * ⚠️ A janela é obrigatoriamente limitada (teto de 400 dias). A Data API cobra por
 * requisição e por linha; deixar o cliente pedir "desde 2022" é o caminho mais curto para
 * estourar a quota Core e derrubar o módulo inteiro (§57).
 *
 * ⚠️ TUDO em America/Sao_Paulo. GA4 tem timezone POR PROPRIEDADE, e este servidor tem as
 * tabelas de fuso do MySQL vazias (`CONVERT_TZ` por nome devolve NULL, e NULL num WHERE de
 * janela faz a linha desaparecer sem erro no log). Regra do projeto: guardar UTC, converter
 * só na borda — aqui, que é a borda.
 */
function ga_filtros_de(array $q): array
{
    $tz  = new DateTimeZone('America/Sao_Paulo');
    $hoje = new DateTimeImmutable('today', $tz);

    $preset = (string)($q['periodo'] ?? '28d');
    $mapa = [
        'hoje'   => [0, 0],
        'ontem'  => [1, 1],
        '7d'     => [6, 0],
        '14d'    => [13, 0],
        '28d'    => [27, 0],
        '30d'    => [29, 0],
        '90d'    => [89, 0],
        '365d'   => [364, 0],
    ];

    if (isset($q['inicio'], $q['fim'])) {
        $ini = DateTimeImmutable::createFromFormat('!Y-m-d', (string)$q['inicio'], $tz);
        $fim = DateTimeImmutable::createFromFormat('!Y-m-d', (string)$q['fim'], $tz);
        if ($ini === false || $fim === false) {
            throw new GaIndisponivel('GA_PERIODO_INVALIDO', 400, 'Datas devem estar no formato YYYY-MM-DD.');
        }
        $preset = 'personalizado';
    } else {
        [$de, $ate] = $mapa[$preset] ?? $mapa['28d'];
        if (!isset($mapa[$preset])) { $preset = '28d'; }
        $ini = $hoje->modify("-{$de} days");
        $fim = $hoje->modify("-{$ate} days");
    }

    if ($ini > $fim) { [$ini, $fim] = [$fim, $ini]; }

    $dias = (int)$ini->diff($fim)->days + 1;
    if ($dias > 400) {
        $ini = $fim->modify('-399 days');
        $dias = 400;
    }
    // Futuro não existe em relatório: corta em hoje.
    if ($fim > $hoje) { $fim = $hoje; }

    return [
        'periodo'    => $preset,
        'inicio'     => $ini->format('Y-m-d'),
        'fim'        => $fim->format('Y-m-d'),
        'dias'       => $dias,
        'comparar'   => (string)($q['comparar'] ?? 'anterior'),
        'cenario'    => (string)($q['cenario'] ?? 'saudavel'),
        // Dimensões de corte (cross-filter, §63) — cada tela usa o que precisa.
        'canal'      => isset($q['canal']) ? (string)$q['canal'] : null,
        'campanha'   => isset($q['campanha']) ? (string)$q['campanha'] : null,
        'dispositivo'=> isset($q['dispositivo']) ? (string)$q['dispositivo'] : null,
        'pagina'     => isset($q['pagina']) ? (string)$q['pagina'] : null,
        'evento'     => isset($q['evento']) ? (string)$q['evento'] : null,
        'limite'     => ga_qint_de($q, 'limite', 100, 5, 500),
    ];
}
