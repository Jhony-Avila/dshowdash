<?php
declare(strict_types=1);

/**
 * /api/pipedrive/controllers/MetasController.php — aba "Metas" do painel Pipedrive (EC Fase 2, item 1; DASH-APP-V1 DC-2 pendência).
 * Usa a MESMA lib da Ponte v2 (api/ponte/libs/MetaLib.php): uma regra para o app e para o painel — chave (ano, mes, escopo, owner_pd_id),
 * concorrência otimista por `versao`, histórico append-only com origem 'dash'. Nível 80 (igual à Allowlist `metas.*` e a
 * DASH_COMERCIAL_ALL_MIN_LEVEL). CSRF pelo gate central do index.php. Vendedor conferido em PIPE_DSHOW.pipe_users antes de definir.
 *
 *   GET    /metas?ano=&mes=        metas do mês + vendedores (ativos e com meta) + histórico (nomes de usuário, nunca e-mail)
 *   PUT    /metas                  {ano, mes, escopo: global|vendedor, owner_pd_id, valor_cents, versao_esperada?}
 *   DELETE /metas/{id}?versao_esperada=
 */
final class PipeMetasController
{
    private const NIVEL = 80;

    public static function route(string $method, array $segments, PDO $pdoPipe): void
    {
        AuthHelpers::requireAuth(self::NIVEL);
        $pdoDash = getConnection('DSHOWDASH');
        try {
            $id = $segments[1] ?? null;
            if ($id === null && $method === 'GET') { self::listar($pdoDash, $pdoPipe); return; }
            if ($id === null && $method === 'PUT') { self::definir($pdoDash, $pdoPipe); return; }
            if ($id !== null && $method === 'DELETE') { self::remover($pdoDash, (string)$id); return; }
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, ['message' => 'Método não permitido']);
        } catch (PonteErro $e) {
            ApiResponse::error($e->codigo, $e->status, $e->extra);
        }
    }

    private static function anoMes(): array
    {
        $q = pipe_query(['ano', 'mes']);
        $ano = meta_int($q['ano'] ?? null) ?? (int)date('Y');
        $mes = meta_int($q['mes'] ?? null) ?? (int)date('n');
        if ($ano < META_ANO_MIN || $ano > META_ANO_MAX || $mes < 1 || $mes > 12) {
            throw new PonteErro('VALIDACAO', 422, ['campos' => ['ano' => 'ano válido', 'mes' => '1–12']]);
        }
        return [$ano, $mes];
    }

    private static function listar(PDO $pdoDash, PDO $pdoPipe): void
    {
        [$ano, $mes] = self::anoMes();
        $r = meta_listar($pdoDash, $ano, $mes);
        $vend = $pdoPipe->query('SELECT pipedrive_id, name, is_active FROM pipe_users ORDER BY name')->fetchAll(PDO::FETCH_ASSOC);
        $ids = array_values(array_unique(array_filter(array_map(static fn($h) => (int)($h['alterado_por'] ?? 0), $r['historico']))));
        $nomes = [];
        if ($ids) {
            $in = implode(',', array_fill(0, count($ids), '?'));
            $st = $pdoDash->prepare("SELECT id, username FROM app_users WHERE id IN ($in)");
            $st->execute($ids);
            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $u) { $nomes[(int)$u['id']] = (string)$u['username']; }
        }
        $historico = array_map(static function (array $h) use ($nomes): array {
            $uid = (int)($h['alterado_por'] ?? 0);
            unset($h['alterado_por']);
            $h['por'] = $nomes[$uid] ?? null;
            return $h;
        }, $r['historico']);
        ApiResponse::success([
            'ano' => $ano,
            'mes' => $mes,
            'metas' => $r['metas'],
            'vendedores' => array_map(static fn($v) => ['id' => (int)$v['pipedrive_id'], 'nome' => (string)$v['name'], 'ativo' => (int)$v['is_active'] === 1], $vend),
            'historico' => $historico,
        ], ['ts' => date('c')]);
    }

    private static function definir(PDO $pdoDash, PDO $pdoPipe): void
    {
        $body = pipe_body();
        if (($body['escopo'] ?? '') === 'vendedor') {
            $owner = meta_int($body['owner_pd_id'] ?? null);
            $st = $pdoPipe->prepare('SELECT COUNT(*) FROM pipe_users WHERE pipedrive_id = ?');
            $st->execute([$owner ?? 0]);
            if ($owner === null || $owner <= 0 || (int)$st->fetchColumn() === 0) {
                throw new PonteErro('VALIDACAO', 422, ['campos' => ['owner_pd_id' => 'vendedor do Pipedrive existente']]);
            }
        }
        $out = meta_definir($pdoDash, AuthHelpers::getCurrentUserId(), $body, 'dash');
        ApiResponse::success($out, ['ts' => date('c')]);
    }

    private static function remover(PDO $pdoDash, string $id): void
    {
        $payload = ['id' => meta_int($id)];
        $q = pipe_query(['versao_esperada']);
        if (isset($q['versao_esperada']) && $q['versao_esperada'] !== '') { $payload['versao_esperada'] = $q['versao_esperada']; }
        $out = meta_remover($pdoDash, AuthHelpers::getCurrentUserId(), $payload, 'dash');
        ApiResponse::success($out, ['ts' => date('c')]);
    }
}
