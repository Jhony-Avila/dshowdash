<?php
declare(strict_types=1);
/**
 * escopo-cl3.php — CL3 (UARPS v4, regra do arquiteto + GPT Warps 27/11), VINHO (ACIMA_ESQUERDA). O RECORTE DE CARTEIRA no SERVIDOR para o painel 05.
 *  - Responsável CONFIRMADO → o cliente entra na carteira dessa pessoa do Dash.
 *  - NÃO RESOLVIDO (empresa ambígua/conflito) → fora de qualquer carteira individual (só quem vê a base inteira).
 *  - SEM responsável confirmado → só quem tem a autorização específica dessa categoria.
 *  O recorte é aplicado nas TRÊS visões de cliente (organização, orçamento, contas a receber), então vale igual para lista, busca, ficha, totais,
 *  rankings, paginação e exportação. A FONTE da carteira está em aberto (decisão do Jhony): fontes PLUGÁVEIS (p05_fontes), NENHUMA ativa
 *  (P05_FONTE_ATIVA = 'tabela' desde a decisão do Jhony 27/11 22:32; null = todo cliente NÃO RESOLVIDO). A tabela app_cliente_carteira nasce VAZIA (portão de banco). Flag global `clientes_cl3_escopo` DESLIGADA = o painel como hoje.
 *  Falha fechada: com a flag ligada, tabela ausente/ilegível ou decisão indeterminada = carteira VAZIA para quem não vê a base inteira.
 *  Capacidades (UARPS, nomes a ratificar): `clientes:base_inteira` e `clientes:sem_responsavel`.
 */
const P05_API = __DIR__ . '/../../..';   // api/ (este arquivo está em api/modules/panels/panel-05/)
const P05_CAP_BASE = 'clientes:base_inteira';
const P05_CAP_SEM_RESP = 'clientes:sem_responsavel';
/**
 * Flag global lida pelo resolvedor. FALHA FECHADA de verdade: o resolvedor NÃO lança em erro de banco (devolve enabled=false, source=error);
 * aqui, source=error ou exceção = trata como LIGADA (correção 27/11 22:4x: antes, um banco fora desligaria o recorte e mostraria a base inteira).
 */
function p05_flag(string $chave): bool
{
    try { require_once P05_API . '/feature-flags/resolver.php'; $r = (new FeatureFlagResolver(getConnection('DSHOWDASH')))->resolve($chave, null);
          if (($r['source'] ?? '') === 'error') { error_log("[cl3] flag $chave ilegível (resolvedor: error)"); return true; }
          return (bool) ($r['enabled'] ?? false); }
    catch (Throwable $e) { error_log("[cl3] flag $chave: " . get_class($e)); return true; }
}
/** FONTE DA CARTEIRA ATIVA (registrada em p05_fontes()). */
const P05_FONTE_ATIVA = 'tabela';   // 27/11 22:4x: decisão do Jhony (D sem conflitos) → a app_cliente_carteira, preenchida pelo portão CARTEIRA-POPULAR. A flag clientes_cl3_escopo continua mandando (desligada = como hoje).

/**
 * Fontes PLUGÁVEIS da carteira. Contrato: Closure(int $uid, string $origem): iterable de ['cliente_id' => int, 'situacao' => string, 'user_id' => ?int].
 * A fonte pode pré-filtrar, mas NÃO decide: a regra é reaplicada em p05_classificar(), então uma fonte frouxa nunca alarga a carteira.
 * Registrar uma fonte não a ativa. 'tabela' = app_cliente_carteira (preenchida por portão a partir da conciliação).
 * @return array<string, Closure>
 */
function p05_fontes(): array
{
    return [
        'tabela' => static function (int $u, string $o): array {
            // Warps 28/11 00:23: a conta é conferida NA LEITURA (não só quando o portão gravou): confirmado de conta não 'active', apagada ou com F1 pendente = fora.
            $st = getConnection('DSHOWDASH')->prepare("SELECT c.cliente_id, c.situacao, c.user_id FROM app_cliente_carteira c
                LEFT JOIN app_users u ON u.id = c.user_id LEFT JOIN app_usuario_f1 f ON f.user_id = c.user_id AND f.situacao = 'pendente_f1'
                WHERE c.origem = ? AND ((c.situacao = 'confirmado' AND c.user_id = ? AND u.status = 'active' AND u.deleted_at IS NULL AND f.user_id IS NULL) OR c.situacao = 'sem_responsavel')");
            $st->execute([$o, $u]); return $st->fetchAll(PDO::FETCH_ASSOC);
        },
    ];
}

/** A REGRA dos 3 estados. Padrão = 'nao_resolvido': cliente ausente da fonte, situação desconhecida ou "confirmado" sem pessoa válida. */
function p05_classificar(array $l): string
{
    $sit = (string) ($l['situacao'] ?? ''); $u = $l['user_id'] ?? null;
    if ($sit === 'confirmado' && is_numeric($u) && (int) $u > 0) return 'confirmado';
    if ($sit === 'sem_responsavel' && ($u === null || $u === '')) return 'sem_responsavel';
    return 'nao_resolvido';
}

/** @return array{modo:'todos'|'carteira', ids:list<int>, motivo:string} */
function p05_escopo(?int $uid, string $origem, ?Closure $flag = null, ?Closure $cap = null, ?Closure $fonte = null, ?string $fonteAtiva = P05_FONTE_ATIVA): array
{
    $flag ??= static fn(): bool => p05_flag('clientes_cl3_escopo');   // ilegível/erro = LIGADA (falha fechada)
    if (!$flag()) return ['modo' => 'todos', 'ids' => [], 'motivo' => 'escopo_desligado'];
    if ($uid === null || $uid <= 0) return ['modo' => 'carteira', 'ids' => [], 'motivo' => 'sem_identidade'];
    $cap ??= static function (int $u, string $t): bool {
        try { require_once P05_API . '/core/UARPSGate.php'; return (UARPSGate::checkTrigger($u, $t)['allowed'] ?? false) === true; }
        catch (Throwable $e) { error_log('[cl3] capacidade: ' . get_class($e)); return false; }
    };
    if ($cap($uid, P05_CAP_BASE)) return ['modo' => 'todos', 'ids' => [], 'motivo' => 'base_inteira'];
    $semResp = $cap($uid, P05_CAP_SEM_RESP);
    if ($fonte === null) {
        $reg = p05_fontes();
        if ($fonteAtiva === null || !isset($reg[$fonteAtiva])) return ['modo' => 'carteira', 'ids' => [], 'motivo' => 'sem_fonte_ativa'];   // todo cliente "não resolvido"
        $fonte = $reg[$fonteAtiva];
    }
    $ids = [];
    try {
        foreach ($fonte($uid, $origem) as $l) {
            $id = $l['cliente_id'] ?? null; if (!is_numeric($id) || (int) $id <= 0) continue;
            $c = p05_classificar($l);
            if (($c === 'confirmado' && (int) $l['user_id'] === $uid) || ($c === 'sem_responsavel' && $semResp)) $ids[(int) $id] = true;
        }
    } catch (Throwable $e) { error_log('[cl3] fonte ilegível: ' . get_class($e)); return ['modo' => 'carteira', 'ids' => [], 'motivo' => 'carteira_indisponivel']; }
    $ids = array_keys($ids); sort($ids);
    return ['modo' => 'carteira', 'ids' => $ids, 'motivo' => $semResp ? 'carteira_e_sem_responsavel' : 'carteira'];
}

/** O escopo entra na CHAVE do cache (respostas por carteira nunca são compartilhadas entre pessoas). */
function p05_escopo_cache(array $e): string
{
    return $e['modo'] === 'todos' ? '' : 'e' . substr(hash('sha256', $e['motivo'] . '|' . implode(',', $e['ids'])), 0, 16) . ':';
}

/**
 * EX1 (UARPS v4, VINHO 27/11): EXPORTAR exige o direito PRÓPRIO de exportação — a abertura do painel não basta; os VALORES seguem só com o financeiro
 * (exportCSV já tira Receita_Gerada sem p05_fin()). Avaliado a CADA arquivo pedido (nada em cache): retirar o direito com a tela aberta = o próximo
 * arquivo já obedece. Flag global `clientes_ex1_exportar` DESLIGADA = como hoje (abrir o painel basta); flag ilegível = trata como LIGADA (falha fechada).
 * Capacidade UARPS (nome a ratificar): `clientes:exportar`.
 */
const P05_CAP_EXPORTAR = 'clientes:exportar';
function p05_pode_exportar(?int $uid, ?Closure $flag = null, ?Closure $cap = null): bool
{
    $flag ??= static fn(): bool => p05_flag('clientes_ex1_exportar');
    if (!$flag()) return true;
    if ($uid === null || $uid <= 0) return false;
    $cap ??= static function (int $u, string $t): bool {
        try { require_once P05_API . '/core/UARPSGate.php'; return (UARPSGate::checkTrigger($u, $t)['allowed'] ?? false) === true; }
        catch (Throwable $e) { error_log('[ex1] capacidade: ' . get_class($e)); return false; }
    };
    return $cap($uid, P05_CAP_EXPORTAR) === true;
}
