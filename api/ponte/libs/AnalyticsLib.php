<?php
declare(strict_types=1);

/**
 * /api/ponte/libs/AnalyticsLib.php — LEITURA do Google Analytics pela Ponte v2 para o app (Noite 2, 31/10/2026; Q-GA.1/Q-GA.2).
 * Usa EXATAMENTE os provedores do módulo (api/google-analytics/_libs.php: GaMock ou GaReal conforme GA_PROVIDER) — nada de cópia de lógica.
 * Filtros pela MESMA normalização do painel (`ga_filtros_de`: períodos fechados, janela ≤ 400 dias, fuso de São Paulo). Erros tipados do
 * provedor (configuração, credencial, cota, Google fora) viram PonteErro com o MESMO código (o app traduz). `meta.fonte` sempre presente:
 * o app NUNCA mostra dado `mock` como real. Nível decidido na Allowlist (50 relatórios; 80 status/propriedades/qualidade — "Status da integração").
 */
require_once __DIR__ . '/../PonteErro.php';
require_once __DIR__ . '/../../google-analytics/_libs.php';

const ANALYTICS_RELATORIOS = [
    'visao_geral' => 'overview', 'tempo_real' => 'tempoReal', 'aquisicao' => 'aquisicao', 'fluxo' => 'fluxoAquisicao', 'paginas' => 'paginas', 'eventos' => 'eventos',
    'conversoes' => 'conversoes', 'funil' => 'funil', 'jornada' => 'jornada', 'ecommerce' => 'ecommerce', 'usuarios' => 'usuarios', 'qualidade' => 'qualidade',
    'alertas' => 'alertas', 'insights' => 'insights',
];

/** Filtros do payload (só strings/inteiros simples; nada de cenário/seed vindo do app: o mock usa o padrão). */
function analytics_filtros(array $payload): array
{
    $in = is_array($payload['filtros'] ?? null) ? $payload['filtros'] : [];
    $q = [];
    foreach (['periodo', 'inicio', 'fim', 'comparar', 'pagina'] as $k) {
        if (isset($in[$k]) && is_string($in[$k]) && strlen($in[$k]) <= 200) { $q[$k] = $in[$k]; }
    }
    if (isset($in['limite']) && (is_int($in['limite']) || (is_string($in['limite']) && ctype_digit($in['limite'])))) { $q['limite'] = (string)$in['limite']; }
    try {
        return ga_filtros_de($q);
    } catch (GaIndisponivel $e) {
        throw new PonteErro('VALIDACAO', 422, ['campos' => ['filtros' => $e->getMessage()]]);
    }
}

/** Executa um relatório do provedor ativo. */
function analytics_ler(string $relatorio, array $payload): array
{
    $p = ga_provider();
    try {
        if ($relatorio === 'status') { return $p->status(); }
        if ($relatorio === 'propriedades') { return $p->propriedades(); }
        $metodo = ANALYTICS_RELATORIOS[$relatorio] ?? null;
        if ($metodo === null) { throw new PonteErro('VALIDACAO', 422, ['campos' => ['relatorio' => 'desconhecido']]); }
        return $p->$metodo(analytics_filtros($payload));
    } catch (GaIndisponivel $e) {
        throw new PonteErro($e->codigo, $e->status === 400 ? 422 : 503, ['message' => $e->getMessage()] + $e->meta);
    }
}
