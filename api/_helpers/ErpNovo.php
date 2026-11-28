<?php
// ErpNovo.php — leitura do ERP NOVO (RDS do Walter, schema `ds_prod`, tabelas em inglês) pelos 5 pontos do Dash que liam o ERP antigo
// (painéis 01/05/16, Koala e rodapé financeiro). Plano: docs do app `handoff/erp-rds-migracao/PLANO-MIGRACAO-DASH.md` (31/10/2026, Noite 2).
// ⚠️ DESLIGADO por padrão: cada ponto só usa o ERP novo com a flag `erp_novo.<ponto>` LIGADA (ausente = desligada) E com a credencial SÓ LEITURA
// própria do Dash configurada (pergunta W-2 ao Walter). Sem as duas, o ponto continua exatamente como antes.
// Conexão: SESSION READ ONLY + max_execution_time 4 s + time_zone '-03:00' (os DATETIME do ERP novo são UTC — a conversão é feita na própria
// consulta com CONVERT_TZ por deslocamento numérico, que não depende das tabelas de fuso do MySQL). Credencial: arquivo ini 0640 root:www-data
// (DB_ERP_NOVO_CNF, chaves user/password) — nunca no .env, nunca em log. Host/porta/schema: DB_ERP_NOVO_HOST/_PORT/_NAME (túnel wg-erp).
declare(strict_types=1);

const ERP_NOVO_PONTOS = ['painel01', 'painel05', 'painel16', 'koala', 'rodape_financeiro'];

/** O ponto está ligado? (flag do Dash `erp_novo.<ponto>`; qualquer falha = desligado). */
function erp_novo_ligado(string $ponto): bool
{
    if (!in_array($ponto, ERP_NOVO_PONTOS, true)) { return false; }
    $resolver = __DIR__ . '/../feature-flags/resolver.php';
    if (!is_file($resolver) || !function_exists('getConnection')) { return false; }
    try {
        require_once $resolver;
        $r = new FeatureFlagResolver(getConnection('DSHOWDASH'));
        return (($r->resolve('erp_novo.' . $ponto, null)['enabled'] ?? false) === true) && erp_novo_configurado();
    } catch (Throwable $e) {
        return false;
    }
}

/**
 * Autorização POR PESSOA para ver dados financeiros do ERP pela origem nova (PM-007 F02; mesma regra do F03 da Geral): flag por pessoa
 * `financeiro_asaas_leitura`, SÓ com source=user_override. O nível NÃO libera; global/rollout, flag ausente, ilegível ou erro = NEGA (fail-closed).
 * Chamar ANTES do cache e da consulta.
 * @param ?Closure(string,int):array $resolver  injetável nos testes; padrão = FeatureFlagResolver do Dash
 */
function erp_novo_autorizado(int $usuario, ?Closure $resolver = null): bool
{
    // DDI-001 (28/11): o MESMO decisor de todos os leitores de financeiro_asaas_leitura (concessão pessoal vigente; falha nega)
    require_once __DIR__ . '/FinanceiroAcesso.php';
    return FinanceiroAcesso::permite($usuario, $resolver);
}

/** Credencial e destino presentes? (não conecta) */
function erp_novo_configurado(): bool
{
    $cnf = (string)getenv('DB_ERP_NOVO_CNF');
    return $cnf !== '' && is_readable($cnf) && (string)getenv('DB_ERP_NOVO_HOST') !== '' && (string)getenv('DB_ERP_NOVO_NAME') !== '';
}

/** PDO SÓ LEITURA no ERP novo. Lança RuntimeException genérica (sem detalhe de credencial) se indisponível. */
function erp_novo_pdo(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) { return $pdo; }
    if (!erp_novo_configurado()) { throw new RuntimeException('ERP novo não configurado'); }
    $ini = @parse_ini_file((string)getenv('DB_ERP_NOVO_CNF'), true, INI_SCANNER_RAW) ?: [];
    $c = $ini['client'] ?? $ini;
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', getenv('DB_ERP_NOVO_HOST'), (int)(getenv('DB_ERP_NOVO_PORT') ?: 3306), getenv('DB_ERP_NOVO_NAME'));
    try {
        $p = new PDO($dsn, (string)($c['user'] ?? ''), (string)($c['password'] ?? ''), [PDO::ATTR_TIMEOUT => 4, PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
        $p->exec('SET SESSION TRANSACTION READ ONLY');
        $p->exec('SET SESSION max_execution_time=4000');
        $p->exec("SET time_zone='-03:00'");
    } catch (Throwable $e) {
        error_log('[erp-novo] indisponível: ' . get_class($e));
        throw new RuntimeException('ERP novo indisponível');
    }
    return $pdo = $p;
}
