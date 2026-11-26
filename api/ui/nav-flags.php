<?php
// api/ui/nav-flags.php — visibilidade do menu lateral por feature flag (usado por api/ui/navigation.php). Sem dependência de sessão.
declare(strict_types=1);

/**
 * Visibilidade por feature flag (18/11, módulo Produtos & Atributos — mudança mínima em arquivo compartilhado):
 *   required_feature_flags (CSV ou JSON) → o item só aparece se TODAS estiverem ligadas para o usuário (fail-closed: erro/anônimo = some);
 *   metadata.hide_when_flags (lista)     → o item SOME se alguma estiver ligada para o usuário (fail-open: erro/anônimo = aparece, como hoje).
 * Sem itens com flag, nada é consultado (o menu de quem não usa flags fica idêntico). O cache já é por usuário (ui:nav:...:u{id}).
 */
function navFiltrarPorFlags($pdo, array $itens, $userId, ?callable $resolver = null) {
    $lista = static function ($v) {
        if ($v === null || $v === '') return [];
        if (is_array($v)) return array_values(array_filter(array_map('strval', $v)));
        $j = json_decode((string) $v, true);
        if (is_array($j)) return array_values(array_filter(array_map('strval', $j)));
        return array_values(array_filter(array_map('trim', explode(',', (string) $v))));
    };
    $precisa = []; $esconde = []; $usadas = [];
    foreach ($itens as $i => $item) {
        $precisa[$i] = $lista($item['required_feature_flags'] ?? null);
        $meta = is_string($item['metadata'] ?? null) ? json_decode($item['metadata'], true) : ($item['metadata'] ?? null);
        $esconde[$i] = $lista(is_array($meta) ? ($meta['hide_when_flags'] ?? null) : null);
        foreach (array_merge($precisa[$i], $esconde[$i]) as $f) $usadas[$f] = true;
    }
    if (!$usadas) return $itens;
    $ligada = [];
    $erro = $userId === null;
    if (!$erro) {
        try {
            if ($resolver === null) {
                require_once __DIR__ . '/../feature-flags/resolver.php';
                $r = new FeatureFlagResolver($pdo);
                $resolver = static fn(string $f, int $u) => $r->resolve($f, $u);
            }
            foreach (array_keys($usadas) as $f) $ligada[$f] = !empty($resolver($f, (int) $userId)['enabled']);
        } catch (Throwable $e) { error_log('[nav] flags do menu: ' . $e->getMessage()); $erro = true; }
    }
    $out = [];
    foreach ($itens as $i => $item) {
        if ($precisa[$i] && ($erro || in_array(false, array_map(fn($f) => $ligada[$f] ?? false, $precisa[$i]), true))) continue;
        if ($esconde[$i] && !$erro && in_array(true, array_map(fn($f) => $ligada[$f] ?? false, $esconde[$i]), true)) continue;
        $out[$i] = $item;
    }
    return array_is_list($itens) ? array_values($out) : $out;   // mantém o formato que cada caminho já devolvia
}

/**
 * 26/11 (ROXO/CIMA; decisão do Jhony: "regra opcional de nível por item, valendo SÓ para o item novo"): metadata.nivel_minimo (inteiro).
 * O item só aparece se o nível do usuário for ≥ nivel_minimo; anônimo ou nível ilegível = SOME (fail-closed). Item SEM nivel_minimo: nada
 * muda (a coluna min_level da tabela continua sem efeito, como hoje; respeitá-la mudaria 7 itens). Primeiro uso: sidebar.integracoes (80 =
 * o mesmo nível exigido por api/geral/v2/integracoes.php). O nível vem da sessão, a mesma fonte do AuthHelpers::requireAuth.
 */
function navFiltrarPorNivel(array $itens, $userId, ?callable $nivelDe = null) {
    $minimo = [];
    foreach ($itens as $i => $item) {
        $meta = is_string($item['metadata'] ?? null) ? json_decode($item['metadata'], true) : ($item['metadata'] ?? null);
        $v = is_array($meta) ? ($meta['nivel_minimo'] ?? null) : null;
        if (is_int($v) || (is_string($v) && ctype_digit($v))) $minimo[$i] = (int) $v;
    }
    if (!$minimo) return $itens;   // sem item com nivel_minimo: nem lê o nível (o menu de hoje fica idêntico)
    $nivel = null;
    if ($userId !== null) {
        try {
            $nivelDe ??= static function (int $u): ?int {
                $l = $_SESSION['level'] ?? ($_SESSION['user']['level'] ?? null);
                return is_numeric($l) ? (int) $l : null;
            };
            $nivel = $nivelDe((int) $userId);
        } catch (Throwable $e) { error_log('[nav] nível do menu: ' . $e->getMessage()); $nivel = null; }
    }
    $out = [];
    foreach ($itens as $i => $item) {
        if (isset($minimo[$i]) && ($nivel === null || $nivel < $minimo[$i])) continue;
        $out[$i] = $item;
    }
    return array_is_list($itens) ? array_values($out) : $out;
}
