<?php
declare(strict_types=1);

/**
 * /api/ponte/libs/MetaLib.php — METAS COMERCIAIS mensais (DSHOWDASH.app_metas_comerciais + app_metas_comerciais_hist).
 * Programa DASH-APP-V1 · MVP Dashboard Comercial (Q-DASH.2: dono do dado = Dash; escrita só por aqui). UMA implementação para dois
 * chamadores: a Ponte v2 (app, Allowlist `metas.definir`/`metas.remover`, nível 80) e, quando existir, o controller do painel Pipedrive.
 *
 * Regras (docs/44-DASH-COMERCIAL-DIARIO.md §E/§G, Q-DC.5): chave (ano, mes, escopo, owner_pd_id) com owner_pd_id = 0 para a meta global
 * (UNIQUE no banco); valor em centavos de BRL, 0 = meta zero explícita; linha ausente = "não definida"; concorrência otimista por `versao`
 * (`versao_esperada` ≠ atual → 409 CONFLITO com a versão e o valor atuais); toda mudança grava UMA linha append-only em `_hist`
 * (antes, depois, quem, origem, request_id); remover = DELETE da meta + linha na hist com valor_novo NULL (o valor anterior fica na
 * trilha — reversível por um novo definir). A existência do vendedor em PIPE_DSHOW.pipe_users é conferida pelo CHAMADOR que tem esse
 * dado (o backend do app, grant RO) — esta lib valida forma e faixas, nunca lê outro schema.
 */
require_once __DIR__ . '/../PonteErro.php';

const META_ANO_MIN = 2020;
const META_ANO_MAX = 2100;
/** R$ 9.999.999.999,99 em centavos (faixa do contrato dash-comercial.md). */
const META_VALOR_MAX_CENTS = 999999999999;

/** Inteiro vindo de JSON (int ou string de dígitos); null se não for. */
function meta_int(mixed $v): ?int
{
    if (is_int($v)) { return $v; }
    if (is_string($v) && $v !== '' && ctype_digit($v)) { return (int)$v; }
    return null;
}

/** Valida a chave da meta no payload → ['ano','mes','escopo','owner_pd_id','versao_esperada'] (422 VALIDACAO com os campos). */
function meta_validar_chave(array $payload): array
{
    $erros = [];
    $ano = meta_int($payload['ano'] ?? null);
    if ($ano === null || $ano < META_ANO_MIN || $ano > META_ANO_MAX) { $erros['ano'] = 'inteiro ' . META_ANO_MIN . '–' . META_ANO_MAX; }
    $mes = meta_int($payload['mes'] ?? null);
    if ($mes === null || $mes < 1 || $mes > 12) { $erros['mes'] = 'inteiro 1–12'; }
    $escopo = $payload['escopo'] ?? null;
    if (!is_string($escopo) || !in_array($escopo, ['global', 'vendedor'], true)) { $erros['escopo'] = 'global|vendedor'; $escopo = null; }
    $owner = 0;
    if ($escopo === 'vendedor') {
        $owner = meta_int($payload['owner_pd_id'] ?? null);
        if ($owner === null || $owner <= 0) { $erros['owner_pd_id'] = 'inteiro positivo (pipe_users.pipedrive_id)'; $owner = 0; }
    } elseif ($escopo === 'global' && array_key_exists('owner_pd_id', $payload) && $payload['owner_pd_id'] !== null && meta_int($payload['owner_pd_id']) !== 0) {
        $erros['owner_pd_id'] = 'não se aplica à meta global';
    }
    $ve = null;
    if (array_key_exists('versao_esperada', $payload) && $payload['versao_esperada'] !== null) {
        $ve = meta_int($payload['versao_esperada']);
        if ($ve === null || $ve < 0) { $erros['versao_esperada'] = 'inteiro ≥ 0'; }
    }
    if ($erros !== []) {
        throw new PonteErro('VALIDACAO', 422, ['campos' => $erros]);
    }
    return ['ano' => $ano, 'mes' => $mes, 'escopo' => $escopo, 'owner_pd_id' => $owner, 'versao_esperada' => $ve];
}

/** request_id (Idempotency-Key do app) opcional no payload, só para a trilha. */
function meta_request_id(array $payload): ?string
{
    $r = $payload['request_id'] ?? null;
    return is_string($r) && preg_match('/^[A-Za-z0-9._:-]{8,64}$/', $r) ? $r : null;
}

/**
 * metas.definir — cria ou atualiza a meta do período (transação; SELECT … FOR UPDATE; hist). `$origem` = 'app' (ponte) | 'dash' (painel).
 * Devolve {id, ano, mes, escopo, owner_pd_id, valor_cents, versao, valor_anterior_cents}.
 */
function meta_definir(PDO $pdo, int $userId, array $payload, string $origem = 'app'): array
{
    $k = meta_validar_chave($payload);
    $valor = meta_int($payload['valor_cents'] ?? null);
    if ($valor === null || $valor < 0 || $valor > META_VALOR_MAX_CENTS) {
        throw new PonteErro('VALIDACAO', 422, ['campos' => ['valor_cents' => 'inteiro 0–' . META_VALOR_MAX_CENTS]]);
    }
    if (!in_array($origem, ['app', 'dash'], true)) { $origem = 'app'; }
    $reqId = meta_request_id($payload);

    $pdo->beginTransaction();
    $sel = $pdo->prepare('SELECT id, valor_cents, versao FROM app_metas_comerciais WHERE ano = ? AND mes = ? AND escopo = ? AND owner_pd_id = ? FOR UPDATE');
    $sel->execute([$k['ano'], $k['mes'], $k['escopo'], $k['owner_pd_id']]);
    $atual = $sel->fetch(PDO::FETCH_ASSOC) ?: null;

    if ($atual !== null) {
        $versaoAtual = (int)$atual['versao'];
        if ($k['versao_esperada'] !== null && $k['versao_esperada'] !== $versaoAtual) {
            $pdo->rollBack();
            throw new PonteErro('CONFLITO', 409, ['versao_atual' => $versaoAtual, 'valor_atual_cents' => (int)$atual['valor_cents']]);
        }
        $novaVersao = $versaoAtual + 1;
        $pdo->prepare('UPDATE app_metas_comerciais SET valor_cents = ?, versao = ?, atualizado_por = ?, updated_at = NOW(3) WHERE id = ?')
            ->execute([$valor, $novaVersao, $userId, (int)$atual['id']]);
        $id = (int)$atual['id'];
        $anterior = (int)$atual['valor_cents'];
    } else {
        if ($k['versao_esperada'] !== null && $k['versao_esperada'] !== 0) {
            $pdo->rollBack();
            throw new PonteErro('CONFLITO', 409, ['versao_atual' => 0, 'valor_atual_cents' => null]);
        }
        $pdo->prepare('INSERT INTO app_metas_comerciais (ano, mes, escopo, owner_pd_id, valor_cents, versao, criado_por, atualizado_por, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?, NOW(3), NOW(3))')
            ->execute([$k['ano'], $k['mes'], $k['escopo'], $k['owner_pd_id'], $valor, $userId, $userId]);
        $id = (int)$pdo->lastInsertId();
        $novaVersao = 1;
        $anterior = null;
    }
    $pdo->prepare('INSERT INTO app_metas_comerciais_hist (meta_id, versao, valor_anterior_cents, valor_novo_cents, alterado_por, origem, request_id, motivo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NOW(3))')
        ->execute([$id, $novaVersao, $anterior, $valor, $userId, $origem, $reqId]);
    $pdo->commit();

    return ['id' => $id, 'ano' => $k['ano'], 'mes' => $k['mes'], 'escopo' => $k['escopo'], 'owner_pd_id' => $k['owner_pd_id'],
        'valor_cents' => $valor, 'versao' => $novaVersao, 'valor_anterior_cents' => $anterior];
}

/** metas.remover — payload {id, versao_esperada?}: apaga a meta e grava na hist (valor_novo NULL). 404 NAO_ENCONTRADO · 409 CONFLITO. */
function meta_remover(PDO $pdo, int $userId, array $payload, string $origem = 'app'): array
{
    $id = meta_int($payload['id'] ?? null);
    if ($id === null || $id <= 0) {
        throw new PonteErro('VALIDACAO', 422, ['campos' => ['id' => 'inteiro positivo']]);
    }
    $ve = null;
    if (array_key_exists('versao_esperada', $payload) && $payload['versao_esperada'] !== null) {
        $ve = meta_int($payload['versao_esperada']);
        if ($ve === null || $ve < 0) { throw new PonteErro('VALIDACAO', 422, ['campos' => ['versao_esperada' => 'inteiro ≥ 0']]); }
    }
    if (!in_array($origem, ['app', 'dash'], true)) { $origem = 'app'; }
    $reqId = meta_request_id($payload);

    $pdo->beginTransaction();
    $sel = $pdo->prepare('SELECT id, ano, mes, escopo, owner_pd_id, valor_cents, versao FROM app_metas_comerciais WHERE id = ? FOR UPDATE');
    $sel->execute([$id]);
    $atual = $sel->fetch(PDO::FETCH_ASSOC) ?: null;
    if ($atual === null) {
        $pdo->rollBack();
        throw new PonteErro('NAO_ENCONTRADO', 404, ['message' => 'Meta nao encontrada']);
    }
    $versaoAtual = (int)$atual['versao'];
    if ($ve !== null && $ve !== $versaoAtual) {
        $pdo->rollBack();
        throw new PonteErro('CONFLITO', 409, ['versao_atual' => $versaoAtual, 'valor_atual_cents' => (int)$atual['valor_cents']]);
    }
    $pdo->prepare('INSERT INTO app_metas_comerciais_hist (meta_id, versao, valor_anterior_cents, valor_novo_cents, alterado_por, origem, request_id, motivo, created_at) VALUES (?, ?, ?, NULL, ?, ?, ?, NULL, NOW(3))')
        ->execute([$id, $versaoAtual + 1, (int)$atual['valor_cents'], $userId, $origem, $reqId]);
    $pdo->prepare('DELETE FROM app_metas_comerciais WHERE id = ?')->execute([$id]);
    $pdo->commit();

    return ['id' => $id, 'removed' => true, 'ano' => (int)$atual['ano'], 'mes' => (int)$atual['mes'], 'escopo' => (string)$atual['escopo'],
        'owner_pd_id' => (int)$atual['owner_pd_id'], 'valor_anterior_cents' => (int)$atual['valor_cents']];
}

/** Leitura para o painel (o app lê pelo grant RO): metas do mês + histórico. */
function meta_listar(PDO $pdo, int $ano, int $mes): array
{
    $m = $pdo->prepare('SELECT id, ano, mes, escopo, owner_pd_id, valor_cents, versao, criado_por, atualizado_por, created_at, updated_at FROM app_metas_comerciais WHERE ano = ? AND mes = ? ORDER BY escopo, owner_pd_id');
    $m->execute([$ano, $mes]);
    $h = $pdo->prepare('SELECT h.id, h.meta_id, h.versao, h.valor_anterior_cents, h.valor_novo_cents, h.alterado_por, h.origem, h.request_id, h.created_at FROM app_metas_comerciais_hist h JOIN app_metas_comerciais m ON m.id = h.meta_id WHERE m.ano = ? AND m.mes = ? ORDER BY h.created_at DESC, h.id DESC LIMIT 200');
    $h->execute([$ano, $mes]);
    return ['metas' => $m->fetchAll(PDO::FETCH_ASSOC), 'historico' => $h->fetchAll(PDO::FETCH_ASSOC)];
}
