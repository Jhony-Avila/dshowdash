<?php
// Ads / AdsMock - provedor MOCK (sem Google Ads API, sem banco) para testes de UI
// @module  ads.mock
// @version 1.0.0
// @created 2026-07-21
// @app     Ads Intelligence (Google Ads)
//
// Habilitado por ADS_PROVIDER=mock no .env. Estado mutavel por sessao
// ($_SESSION['ads_mock']): favoritar/definir-padrao/conectar "grudam" durante o teste.
// NAO toca Google Ads API nem ADS_DSHOW. Escopo natural: por sessao = por usuario.
// Reset: AdsMock::reset() (rota /mock/reset).
//
// Dados DETERMINISTICOS (mt_srand por conta+entidade): recarregar da mesma semente
// produz os mesmos numeros, entao dashboards/DataGrids sao estaveis entre requisicoes.
// Custo/valor ja NORMALIZADOS (BRL) — o front consome numeros prontos (nao micros).
declare(strict_types=1);

final class AdsMock
{
    public static function isEnabled(): bool
    {
        $v = getenv('ADS_PROVIDER');
        if ($v === false || $v === '') { $v = $_ENV['ADS_PROVIDER'] ?? ''; }
        return strtolower(trim((string)$v)) === 'mock';
    }

    /** @return array referencia ao estado (semeia se ausente) */
    private static function &state(): array
    {
        if (!isset($_SESSION['ads_mock']) || !is_array($_SESSION['ads_mock'])) {
            $_SESSION['ads_mock'] = self::seed();
        }
        return $_SESSION['ads_mock'];
    }

    public static function reset(): void
    {
        unset($_SESSION['ads_mock']);
    }

    // ── Semente (mutavel): so contas ficam no estado; o resto e derivado deterministicamente ──
    private static function seed(): array
    {
        return [
            'seeded' => true,
            'accounts' => [
                self::mkAccount(1, '4738105926', 'Dshow — Institucional', true, true),
                self::mkAccount(2, '9152730684', 'Dshow — Eventos & Feiras', false, false),
            ],
            'next_account_id' => 3,
            'connected_extra' => false,
        ];
    }

    private static function mkAccount(int $id, string $cid, string $name, bool $default, bool $fav): array
    {
        $now = time();
        return [
            'id' => $id,
            'customer_id' => $cid,
            'descriptive_name' => $name,
            'currency_code' => 'BRL',
            'time_zone' => 'America/Sao_Paulo',
            'manager_customer_id' => '2200330044',
            'is_manager' => false,
            'is_test_account' => false,
            'status' => 'enabled',
            'is_default' => $default,
            'is_favorite' => $fav,
            'last_synced_at' => date('c', $now - 1200),
            'created_at' => date('c', $now - 86400 * 120),
        ];
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Status / Contas
    // ─────────────────────────────────────────────────────────────────────
    public static function status(): array
    {
        $s = &self::state();
        $accs = $s['accounts'];
        return [
            'provider' => 'mock',
            'phase' => 1,
            'db_ready' => true,
            'oauth_configured' => true,
            'developer_token_ready' => true,
            'accounts_total' => count($accs),
            'accounts_active' => count(array_filter($accs, fn($a) => $a['status'] === 'enabled')),
            'accounts' => array_map([self::class, 'accountPublic'], $accs),
            'currency' => 'BRL',
            'message' => 'Modo de testes (dados fictícios). Provisione o developer token do Google Ads para dados reais.',
        ];
    }

    public static function accountsPublic(): array
    {
        $s = &self::state();
        return array_map([self::class, 'accountPublic'], $s['accounts']);
    }

    private static function accountPublic(array $a): array
    {
        $sum = self::accountSummary($a['id']);
        return [
            'id' => $a['id'],
            'customer_id' => self::fmtCid($a['customer_id']),
            'customer_id_raw' => $a['customer_id'],
            'descriptive_name' => $a['descriptive_name'],
            'currency_code' => $a['currency_code'],
            'time_zone' => $a['time_zone'],
            'status' => $a['status'],
            'is_default' => $a['is_default'],
            'is_favorite' => $a['is_favorite'],
            'last_synced_at' => $a['last_synced_at'],
            'active_campaigns' => $sum['active_campaigns'],
            'cost' => $sum['cost'],
            'conversions' => $sum['conversions'],
        ];
    }

    private static function fmtCid(string $cid): string
    {
        return preg_replace('/(\d{3})(\d{3})(\d{4})/', '$1-$2-$3', $cid) ?? $cid;
    }

    public static function ownsAccount(int $id): bool
    {
        $s = &self::state();
        foreach ($s['accounts'] as $a) { if ($a['id'] === $id) { return true; } }
        return false;
    }

    public static function setDefault(int $id): bool
    {
        $s = &self::state();
        $ok = false;
        foreach ($s['accounts'] as &$a) { $a['is_default'] = ($a['id'] === $id); if ($a['id'] === $id) { $ok = true; } }
        unset($a);
        return $ok;
    }

    public static function setFavorite(int $id, bool $fav): bool
    {
        $s = &self::state();
        foreach ($s['accounts'] as &$a) { if ($a['id'] === $id) { $a['is_favorite'] = $fav; unset($a); return true; } }
        unset($a);
        return false;
    }

    /** "Conecta" uma terceira conta demonstrativa (callback do fluxo mock). */
    public static function connectAccount(): int
    {
        $s = &self::state();
        if ($s['connected_extra']) {
            foreach ($s['accounts'] as $a) { if ($a['id'] === 3) { return 3; } }
        }
        $id = $s['next_account_id']++;
        $s['accounts'][] = self::mkAccount($id, '6604821179', 'Dshow — Performance (nova)', false, false);
        $s['connected_extra'] = true;
        return $id;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Geradores determinísticos de estrutura + métrica
    // ─────────────────────────────────────────────────────────────────────
    private const CAMPAIGNS = [
        // nome, canal, status, orçamento/dia, estratégia, peso (volume relativo), saúde
        ['Institucional — Marca',            'SEARCH',   'ENABLED', 120.0, 'TARGET_SPEND',    0.9, 'healthy'],
        ['Search — Serviços [Exata]',        'SEARCH',   'ENABLED', 300.0, 'MAXIMIZE_CONVERSIONS', 1.6, 'excellent'],
        ['Search — Serviços [Ampla]',        'SEARCH',   'ENABLED', 260.0, 'MAXIMIZE_CONVERSIONS', 1.3, 'wasting'],
        ['Performance Max — Geral',          'PERFORMANCE_MAX', 'ENABLED', 400.0, 'MAXIMIZE_CONVERSION_VALUE', 1.8, 'scale_opportunity'],
        ['Display — Remarketing',            'DISPLAY',  'ENABLED', 90.0,  'TARGET_CPA',      0.7, 'attention'],
        ['YouTube — Awareness',              'VIDEO',    'PAUSED',  150.0, 'TARGET_CPM',      0.5, 'no_data'],
        ['Search — Concorrentes',            'SEARCH',   'ENABLED', 110.0, 'MAXIMIZE_CLICKS', 0.8, 'critical'],
        ['Search — Institucional [Ampla]',   'SEARCH',   'ENABLED', 80.0,  'TARGET_SPEND',    0.6, 'budget_limited'],
    ];

    private const ADGROUP_NAMES = [
        'Genérico', 'Marca', 'Serviços — Estruturas', 'Serviços — Montagem', 'Cidade — SP',
        'Cidade — RJ', 'Alta intenção', 'Institucional',
    ];

    private const KEYWORDS = [
        ['montagem de estandes', 'EXACT'], ['locação de estruturas para eventos', 'PHRASE'],
        ['empresa de eventos corporativos', 'BROAD'], ['stand para feira preço', 'EXACT'],
        ['aluguel de tendas', 'PHRASE'], ['produtora de eventos sp', 'EXACT'],
        ['estrutura para show', 'BROAD'], ['palco para evento', 'PHRASE'],
        ['dshow eventos', 'EXACT'], ['montagem de feira', 'BROAD'],
    ];

    private const SEARCH_TERMS = [
        ['montagem de estandes para feira', 'converting', 'ADDED'],
        ['empresa montagem stand sp', 'converting', 'ADDED'],
        ['locação estrutura evento preço', 'commercial', 'NONE'],
        ['como montar um estande', 'informational', 'NONE'],
        ['montagem de estande gratis', 'waste', 'EXCLUDED'],
        ['dshow reclame aqui', 'competitor', 'NONE'],
        ['vagas montador de estande', 'waste', 'EXCLUDED'],
        ['aluguel de tenda para casamento', 'commercial', 'NONE'],
        ['estrutura metálica para show', 'converting', 'ADDED'],
        ['curso de montagem de estandes', 'waste', 'EXCLUDED'],
        ['palco para evento corporativo', 'converting', 'ADDED'],
        ['produtora de eventos zona sul', 'commercial', 'NONE'],
        ['dshow telefone', 'competitor', 'NONE'],
        ['montagem stand barato', 'commercial', 'NONE'],
        ['feira agishow 2026 estande', 'converting', 'ADDED'],
    ];

    /** RNG determinístico [0,1) a partir de uma string. */
    private static function rng(string $seed, int $i): float
    {
        $h = crc32($seed . ':' . $i);
        return ($h % 100000) / 100000.0;
    }

    /** Campanhas de uma conta com métricas derivadas. */
    public static function campaigns(int $accountId): array
    {
        $mult = $accountId === 1 ? 1.0 : 0.62;   // conta 2 é menor
        $out = [];
        foreach (self::CAMPAIGNS as $idx => $c) {
            [$name, $channel, $st, $budget, $bid, $weight, $health] = $c;
            $cid = $accountId * 1000 + $idx + 1;
            $seed = "acc{$accountId}-camp{$idx}";
            if ($st === 'PAUSED') {
                $m = ['impressions' => 0, 'clicks' => 0, 'cost' => 0.0, 'conversions' => 0.0, 'conv_value' => 0.0];
            } else {
                $impr = (int)round((4200 + self::rng($seed, 1) * 26000) * $weight * $mult);
                $ctr = 0.018 + self::rng($seed, 2) * 0.085;
                $clicks = (int)round($impr * $ctr);
                $cpc = 1.1 + self::rng($seed, 3) * 4.2;
                $cost = round($clicks * $cpc, 2);
                // taxa de conversão pior nas campanhas "ruins"
                $badness = in_array($health, ['wasting', 'critical', 'budget_limited'], true) ? 0.35 : 1.0;
                $convRate = (0.02 + self::rng($seed, 4) * 0.09) * $badness;
                $conv = round($clicks * $convRate, 1);
                // valor por conversão (lead/micro-conversão) — mantém ROAS em faixa crível (~2-8x)
                $ticket = 160 + self::rng($seed, 5) * 520;
                $convValue = round($conv * $ticket, 2);
                $m = ['impressions' => $impr, 'clicks' => $clicks, 'cost' => $cost, 'conversions' => $conv, 'conv_value' => $convValue];
            }
            $out[] = self::shapeCampaign($accountId, $cid, $name, $channel, $st, $budget, $bid, $health, $m, $seed);
        }
        return $out;
    }

    private static function shapeCampaign(int $accId, int $cid, string $name, string $channel, string $st, float $budget, string $bid, string $health, array $m, string $seed): array
    {
        $clicks = $m['clicks']; $impr = $m['impressions']; $cost = $m['cost']; $conv = $m['conversions']; $cv = $m['conv_value'];
        return [
            'account_id' => $accId,
            'campaign_id' => $cid,
            'name' => $name,
            'status' => $st,
            'channel' => $channel,
            'budget' => $budget,
            'bidding_strategy' => $bid,
            'optimization_score' => round(0.55 + self::rng($seed, 9) * 0.44, 2),
            'health_class' => $st === 'PAUSED' ? 'no_data' : $health,
            'impressions' => $impr,
            'clicks' => $clicks,
            'ctr' => $impr > 0 ? round($clicks / $impr, 4) : 0.0,
            'avg_cpc' => $clicks > 0 ? round($cost / $clicks, 2) : 0.0,
            'cost' => $cost,
            'conversions' => $conv,
            'conv_rate' => $clicks > 0 ? round($conv / $clicks, 4) : 0.0,
            'cpa' => $conv > 0 ? round($cost / $conv, 2) : 0.0,
            'conv_value' => $cv,
            'roas' => $cost > 0 ? round($cv / $cost, 2) : 0.0,
            'search_impression_share' => $st === 'PAUSED' ? 0.0 : round(0.35 + self::rng($seed, 7) * 0.6, 3),
            'start_date' => date('Y-m-d', time() - 86400 * (int)(60 + self::rng($seed, 8) * 300)),
        ];
    }

    public static function accountSummary(int $accountId): array
    {
        $camps = self::campaigns($accountId);
        $cost = 0.0; $conv = 0.0; $active = 0;
        foreach ($camps as $c) {
            $cost += $c['cost']; $conv += $c['conversions'];
            if ($c['status'] === 'ENABLED') { $active++; }
        }
        return ['active_campaigns' => $active, 'cost' => round($cost, 2), 'conversions' => round($conv, 1)];
    }

    public static function adGroups(int $accountId, ?int $campaignId = null): array
    {
        $out = [];
        foreach (self::campaigns($accountId) as $c) {
            if ($campaignId !== null && $c['campaign_id'] !== $campaignId) { continue; }
            if ($c['status'] === 'PAUSED') { continue; }
            $n = 2 + (int)floor(self::rng("ag{$c['campaign_id']}", 1) * 2); // 2-3 grupos
            for ($g = 0; $g < $n; $g++) {
                $seed = "acc{$accountId}-ag{$c['campaign_id']}-{$g}";
                $share = ($g === 0) ? 0.55 : (0.45 / max(1, $n - 1));
                $impr = (int)round($c['impressions'] * $share);
                $clicks = (int)round($c['clicks'] * $share);
                $cost = round($c['cost'] * $share, 2);
                $conv = round($c['conversions'] * $share, 1);
                $cv = round($c['conv_value'] * $share, 2);
                $name = self::ADGROUP_NAMES[($c['campaign_id'] + $g) % count(self::ADGROUP_NAMES)];
                $out[] = [
                    'account_id' => $accountId,
                    'ad_group_id' => $c['campaign_id'] * 100 + $g + 1,
                    'campaign_id' => $c['campaign_id'],
                    'campaign_name' => $c['name'],
                    'name' => $name,
                    'status' => 'ENABLED',
                    'impressions' => $impr,
                    'clicks' => $clicks,
                    'ctr' => $impr > 0 ? round($clicks / $impr, 4) : 0.0,
                    'avg_cpc' => $clicks > 0 ? round($cost / $clicks, 2) : 0.0,
                    'cost' => $cost,
                    'conversions' => $conv,
                    'cpa' => $conv > 0 ? round($cost / $conv, 2) : 0.0,
                    'conv_value' => $cv,
                    'roas' => $cost > 0 ? round($cv / $cost, 2) : 0.0,
                    'ads_count' => 2 + (int)floor(self::rng($seed, 2) * 2),
                    'keywords_count' => 4 + (int)floor(self::rng($seed, 3) * 6),
                    'quality_score' => 5 + (int)floor(self::rng($seed, 4) * 5),
                    'cannibalization_flag' => self::rng($seed, 5) > 0.82,
                    'split_opportunity' => self::rng($seed, 6) > 0.78,
                ];
            }
        }
        return $out;
    }

    private const HEADLINES = [
        'Montagem de Estandes', 'Estruturas para Eventos', 'Projeto + Execução', 'Feiras e Congressos',
        'Entrega no Prazo', 'Orçamento em 24h', '+500 Eventos Realizados', 'Do Projeto à Montagem',
    ];
    private const DESCRIPTIONS = [
        'Estandes e estruturas sob medida para sua marca. Solicite um orçamento sem compromisso.',
        'Equipe própria, montagem no prazo e acabamento premium. Fale com um especialista.',
    ];

    public static function ads(int $accountId): array
    {
        $out = [];
        foreach (self::adGroups($accountId) as $ag) {
            $n = min(3, max(1, (int)$ag['ads_count']));
            for ($a = 0; $a < $n; $a++) {
                $seed = "acc{$accountId}-ad{$ag['ad_group_id']}-{$a}";
                $share = $a === 0 ? 0.6 : (0.4 / max(1, $n - 1));
                $impr = (int)round($ag['impressions'] * $share);
                $clicks = (int)round($ag['clicks'] * $share);
                $cost = round($ag['cost'] * $share, 2);
                $conv = round($ag['conversions'] * $share, 1);
                $strengthRoll = self::rng($seed, 1);
                $strength = $strengthRoll > 0.7 ? 'EXCELLENT' : ($strengthRoll > 0.4 ? 'GOOD' : ($strengthRoll > 0.18 ? 'AVERAGE' : 'POOR'));
                $approved = self::rng($seed, 2) > 0.12;
                $out[] = [
                    'account_id' => $accountId,
                    'ad_id' => $ag['ad_group_id'] * 10 + $a + 1,
                    'ad_group_id' => $ag['ad_group_id'],
                    'ad_group_name' => $ag['name'],
                    'campaign_name' => $ag['campaign_name'],
                    'status' => 'ENABLED',
                    'ad_type' => 'RESPONSIVE_SEARCH_AD',
                    'ad_strength' => $strength,
                    'headlines' => array_slice(self::HEADLINES, ($ag['ad_group_id'] + $a) % 3, 4),
                    'descriptions' => self::DESCRIPTIONS,
                    'final_url' => 'https://dshow.com.br/' . ['estandes', 'estruturas', 'eventos', 'orcamento'][($ag['ad_group_id'] + $a) % 4],
                    'approval_status' => $approved ? 'APPROVED' : 'DISAPPROVED',
                    'policy_topics' => $approved ? [] : ['Marca registrada de terceiros no título'],
                    'impressions' => $impr,
                    'clicks' => $clicks,
                    'ctr' => $impr > 0 ? round($clicks / $impr, 4) : 0.0,
                    'cost' => $cost,
                    'conversions' => $conv,
                    'cpa' => $conv > 0 ? round($cost / $conv, 2) : 0.0,
                ];
            }
        }
        return $out;
    }

    public static function keywords(int $accountId): array
    {
        $out = [];
        foreach (self::adGroups($accountId) as $ag) {
            $n = min(count(self::KEYWORDS), max(3, (int)$ag['keywords_count']));
            for ($k = 0; $k < $n; $k++) {
                $seed = "acc{$accountId}-kw{$ag['ad_group_id']}-{$k}";
                [$text, $match] = self::KEYWORDS[$k % count(self::KEYWORDS)];
                $share = 1.0 / $n * (0.6 + self::rng($seed, 0));
                $impr = (int)round($ag['impressions'] * $share);
                $clicks = (int)round($ag['clicks'] * $share);
                $cost = round($ag['cost'] * $share, 2);
                $conv = round($ag['conversions'] * $share, 1);
                $qs = 3 + (int)floor(self::rng($seed, 1) * 8);
                $cpa = $conv > 0 ? round($cost / $conv, 2) : 0.0;
                $class = self::kwClass($conv, $cost, $qs, $cpa, $clicks);
                $out[] = [
                    'account_id' => $accountId,
                    'criterion_id' => $ag['ad_group_id'] * 100 + $k + 1,
                    'ad_group_id' => $ag['ad_group_id'],
                    'ad_group_name' => $ag['name'],
                    'campaign_name' => $ag['campaign_name'],
                    'keyword_text' => $text,
                    'match_type' => $match,
                    'status' => 'ENABLED',
                    'quality_score' => $qs,
                    'impressions' => $impr,
                    'clicks' => $clicks,
                    'ctr' => $impr > 0 ? round($clicks / $impr, 4) : 0.0,
                    'avg_cpc' => $clicks > 0 ? round($cost / $clicks, 2) : 0.0,
                    'cost' => $cost,
                    'conversions' => $conv,
                    'cpa' => $cpa,
                    'kw_class' => $class,
                ];
            }
        }
        return $out;
    }

    private static function kwClass(float $conv, float $cost, int $qs, float $cpa, int $clicks): string
    {
        if ($clicks < 3) { return 'low_volume'; }
        if ($conv <= 0 && $cost > 60) { return 'wasting'; }
        if ($conv <= 0) { return 'no_conversion'; }
        if ($qs <= 4) { return 'low_quality'; }
        if ($cpa > 220) { return 'expensive'; }
        if ($cpa > 0 && $cpa < 90 && $conv >= 2) { return 'profitable'; }
        return 'promising';
    }

    public static function searchTerms(int $accountId): array
    {
        $out = [];
        $base = self::campaigns($accountId);
        $campNames = array_column(array_filter($base, fn($c) => $c['status'] === 'ENABLED'), 'name');
        foreach (self::SEARCH_TERMS as $i => $t) {
            [$term, $class, $status] = $t;
            $seed = "acc{$accountId}-st{$i}";
            $impr = (int)round(40 + self::rng($seed, 1) * 900);
            $clicks = (int)round($impr * (0.02 + self::rng($seed, 2) * 0.12));
            $cost = round($clicks * (0.9 + self::rng($seed, 3) * 3.5), 2);
            $conv = $class === 'converting' ? round(1 + self::rng($seed, 4) * 4, 1) : ($class === 'commercial' ? round(self::rng($seed, 4) * 1.5, 1) : 0.0);
            $out[] = [
                'account_id' => $accountId,
                'search_term' => $term,
                'campaign_name' => $campNames[$i % max(1, count($campNames))] ?? '—',
                'matched_keyword' => self::KEYWORDS[$i % count(self::KEYWORDS)][0],
                'term_class' => $class,
                'status' => $status,
                'impressions' => $impr,
                'clicks' => $clicks,
                'ctr' => $impr > 0 ? round($clicks / $impr, 4) : 0.0,
                'cost' => $cost,
                'conversions' => $conv,
                'cpa' => $conv > 0 ? round($cost / $conv, 2) : 0.0,
            ];
        }
        return $out;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Dashboard (Visão Geral) — §7/§8/§9
    // ─────────────────────────────────────────────────────────────────────
    public static function dashboard(int $accountId, string $period): array
    {
        $days = $period === '30d' ? 30 : ($period === '90d' ? 90 : ($period === 'today' ? 1 : 7));
        $camps = self::campaigns($accountId);
        $tot = self::sumMetrics($camps);
        $prev = self::sumMetricsScaled($tot, 0.86 + self::rng("prev{$accountId}", 1) * 0.22); // período anterior

        $win = max($days, 7);
        $series = self::dailySeries($accountId, $win);
        $seriesPrev = self::dailySeries($accountId, $win, $win); // janela imediatamente anterior
        $prevF = 0.86 + self::rng("prevser{$accountId}", 2) * 0.22; // ~0,86–1,08× (diferença visível)
        $distribution = [];
        foreach ($camps as $c) {
            if ($c['cost'] > 0) { $distribution[] = ['name' => $c['name'], 'value' => $c['cost']]; }
        }
        usort($distribution, fn($a, $b) => $b['value'] <=> $a['value']);

        $ranked = array_values(array_filter($camps, fn($c) => $c['status'] === 'ENABLED' && $c['cost'] > 0));
        usort($ranked, fn($a, $b) => $b['roas'] <=> $a['roas']);
        $top = array_slice($ranked, 0, 3);
        $bottom = array_slice(array_reverse($ranked), 0, 3);

        $spark = fn(string $k) => array_map(fn($p) => $p[$k], $series);

        return [
            'available' => true,
            'provider' => 'mock',
            'period' => $period,
            'big' => self::bigNumbers($tot, $prev, $spark),
            'series' => [
                'dates' => array_map(fn($p) => $p['date'], $series),
                'cost' => array_map(fn($p) => $p['cost'], $series),
                'clicks' => array_map(fn($p) => $p['clicks'], $series),
                'conversions' => array_map(fn($p) => $p['conversions'], $series),
                'impressions' => array_map(fn($p) => $p['impressions'], $series),
            ],
            'series_prev' => [
                'cost' => array_map(fn($p) => round($p['cost'] * $prevF, 2), $seriesPrev),
                'clicks' => array_map(fn($p) => (int)round($p['clicks'] * $prevF), $seriesPrev),
                'conversions' => array_map(fn($p) => round($p['conversions'] * $prevF, 1), $seriesPrev),
                'impressions' => array_map(fn($p) => (int)round($p['impressions'] * $prevF), $seriesPrev),
            ],
            'series_by_channel' => self::dailyByChannel($accountId, $win),
            'distribution' => array_slice($distribution, 0, 6),
            'top_campaigns' => array_map([self::class, 'miniCamp'], $top),
            'bottom_campaigns' => array_map([self::class, 'miniCamp'], $bottom),
        ];
    }

    private static function miniCamp(array $c): array
    {
        return ['name' => $c['name'], 'cost' => $c['cost'], 'conversions' => $c['conversions'],
                'roas' => $c['roas'], 'cpa' => $c['cpa'], 'health_class' => $c['health_class']];
    }

    private static function sumMetrics(array $camps): array
    {
        $t = ['impressions' => 0, 'clicks' => 0, 'cost' => 0.0, 'conversions' => 0.0, 'conv_value' => 0.0];
        foreach ($camps as $c) {
            $t['impressions'] += $c['impressions']; $t['clicks'] += $c['clicks'];
            $t['cost'] += $c['cost']; $t['conversions'] += $c['conversions']; $t['conv_value'] += $c['conv_value'];
        }
        $t['cost'] = round($t['cost'], 2); $t['conversions'] = round($t['conversions'], 1); $t['conv_value'] = round($t['conv_value'], 2);
        return $t;
    }

    private static function sumMetricsScaled(array $t, float $f): array
    {
        return [
            'impressions' => (int)round($t['impressions'] * $f),
            'clicks' => (int)round($t['clicks'] * $f),
            'cost' => round($t['cost'] * $f, 2),
            'conversions' => round($t['conversions'] * $f, 1),
            'conv_value' => round($t['conv_value'] * $f, 2),
        ];
    }

    /** Um Big Number com direção e sinal semântico (§7.2). good=true => aumento é bom. */
    private static function big(string $key, string $label, $cur, $prev, string $unit, bool $goodUp, array $spark): array
    {
        $delta = $cur - $prev;
        $pct = $prev != 0 ? ($delta / $prev) : 0.0;
        $dir = $delta > 0 ? 'up' : ($delta < 0 ? 'down' : 'flat');
        // sinal: se "aumento é bom", up=positivo; senão up=negativo.
        $sign = $dir === 'flat' ? 'neutral' : ((($dir === 'up') === $goodUp) ? 'positive' : 'negative');
        return [
            'key' => $key, 'label' => $label, 'value' => $cur, 'prev' => $prev,
            'unit' => $unit, 'delta_pct' => round($pct, 4), 'dir' => $dir, 'sign' => $sign,
            'spark' => $spark,
        ];
    }

    private static function bigNumbers(array $t, array $p, callable $spark): array
    {
        $ctr = $t['clicks'] > 0 && $t['impressions'] > 0 ? $t['clicks'] / $t['impressions'] : 0;
        $ctrP = $p['clicks'] > 0 && $p['impressions'] > 0 ? $p['clicks'] / $p['impressions'] : 0;
        $cpc = $t['clicks'] > 0 ? $t['cost'] / $t['clicks'] : 0;
        $cpcP = $p['clicks'] > 0 ? $p['cost'] / $p['clicks'] : 0;
        $cpa = $t['conversions'] > 0 ? $t['cost'] / $t['conversions'] : 0;
        $cpaP = $p['conversions'] > 0 ? $p['cost'] / $p['conversions'] : 0;
        $roas = $t['cost'] > 0 ? $t['conv_value'] / $t['cost'] : 0;
        $roasP = $p['cost'] > 0 ? $p['conv_value'] / $p['cost'] : 0;
        $convRate = $t['clicks'] > 0 ? $t['conversions'] / $t['clicks'] : 0;
        $convRateP = $p['clicks'] > 0 ? $p['conversions'] / $p['clicks'] : 0;
        return [
            self::big('cost', 'Custo', $t['cost'], $p['cost'], 'currency', false, $spark('cost')),
            self::big('impressions', 'Impressões', $t['impressions'], $p['impressions'], 'int', true, $spark('impressions')),
            self::big('clicks', 'Cliques', $t['clicks'], $p['clicks'], 'int', true, $spark('clicks')),
            self::big('ctr', 'CTR', round($ctr, 4), round($ctrP, 4), 'pct', true, $spark('clicks')),
            self::big('avg_cpc', 'CPC médio', round($cpc, 2), round($cpcP, 2), 'currency', false, $spark('cost')),
            self::big('conversions', 'Conversões', $t['conversions'], $p['conversions'], 'decimal', true, $spark('conversions')),
            self::big('conv_rate', 'Taxa de conversão', round($convRate, 4), round($convRateP, 4), 'pct', true, $spark('conversions')),
            self::big('cpa', 'CPA', round($cpa, 2), round($cpaP, 2), 'currency', false, $spark('conversions')),
            self::big('conv_value', 'Valor de conversão', $t['conv_value'], $p['conv_value'], 'currency', true, $spark('conversions')),
            self::big('roas', 'ROAS', round($roas, 2), round($roasP, 2), 'ratio', true, $spark('conversions')),
        ];
    }

    /** Série diária determinística (com leve tendência + sazonalidade semanal). */
    private static function dailySeries(int $accountId, int $days, int $offsetDays = 0): array
    {
        // $offsetDays desloca a janela para trás (0 = período atual; $days = período anterior).
        $tot = self::sumMetrics(self::campaigns($accountId));
        $baseCost = $tot['cost'] / 30.0; // custo total representa ~30d
        $baseClicks = $tot['clicks'] / 30.0;
        $baseConv = $tot['conversions'] / 30.0;
        $baseImpr = $tot['impressions'] / 30.0;
        $out = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $ts = time() - 86400 * ($i + $offsetDays);
            $dow = (int)date('N', $ts); // 1..7
            $weekend = ($dow >= 6) ? 0.68 : 1.0;
            $noise = 0.8 + self::rng("acc{$accountId}-day", (int)date('Ymd', $ts) % 100000) * 0.5;
            $trend = 1.0 + (($days - $i) / max(1, $days)) * 0.12; // leve crescimento
            $f = $weekend * $noise * $trend;
            $out[] = [
                'date' => date('Y-m-d', $ts),
                'cost' => round($baseCost * $f, 2),
                'clicks' => (int)round($baseClicks * $f),
                'conversions' => round($baseConv * $f, 1),
                'impressions' => (int)round($baseImpr * $f),
            ];
        }
        return $out;
    }

    /**
     * Matriz dia × canal (para o streamgraph): distribui o custo diário total entre os
     * canais pela participação agregada, com deriva lenta distinta por canal + ruído
     * determinístico; renormaliza por dia para o total bater com o custo diário.
     */
    public static function dailyByChannel(int $accountId, int $days): array
    {
        $series = self::dailySeries($accountId, $days);
        $dates = array_map(fn($p) => $p['date'], $series);

        $byCh = [];
        foreach (self::campaigns($accountId) as $c) {
            if ($c['cost'] <= 0) { continue; }
            $byCh[$c['channel']] = ($byCh[$c['channel']] ?? 0) + $c['cost'];
        }
        arsort($byCh);
        $byCh = array_slice($byCh, 0, 6, true);
        $totalCh = array_sum($byCh);
        if ($totalCh <= 0) { return ['dates' => $dates, 'channels' => []]; }

        $canais = array_keys($byCh);
        $matriz = [];
        foreach ($canais as $j => $ch) {
            $share = $byCh[$ch] / $totalCh;
            $vals = [];
            for ($i = 0; $i < $days; $i++) {
                $dateInt = (int) (str_replace('-', '', $dates[$i]) % 100000);
                $ruido = 0.72 + self::rng("ch-{$ch}-{$accountId}", $dateInt) * 0.56;
                $deriva = 1.0 + 0.34 * sin(($i / max(1, $days)) * 2 * M_PI + $j * 1.1);
                $vals[$i] = $series[$i]['cost'] * $share * $ruido * $deriva;
            }
            $matriz[$ch] = $vals;
        }
        // renormaliza por dia p/ a soma dos canais == custo diário
        for ($i = 0; $i < $days; $i++) {
            $soma = 0.0;
            foreach ($canais as $ch) { $soma += $matriz[$ch][$i]; }
            if ($soma <= 0) { continue; }
            $escala = $series[$i]['cost'] / $soma;
            foreach ($canais as $ch) { $matriz[$ch][$i] = round($matriz[$ch][$i] * $escala, 2); }
        }
        $channels = [];
        foreach ($canais as $ch) { $channels[] = ['channel' => $ch, 'values' => array_values($matriz[$ch])]; }
        return ['dates' => $dates, 'channels' => $channels];
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Diretoria (§10) — funil investimento → lead → oportunidade → venda
    // ─────────────────────────────────────────────────────────────────────
    public static function board(int $accountId, string $period): array
    {
        $tot = self::sumMetrics(self::campaigns($accountId));
        $cost = $tot['cost'];
        $leads = (int)round($tot['conversions']);                 // conversões ≈ leads (Ads)
        $opportunities = (int)round($leads * (0.22 + self::rng("b{$accountId}", 1) * 0.10)); // CRM
        $sales = (int)round($opportunities * (0.15 + self::rng("b{$accountId}", 2) * 0.08));
        $ticket = 12500 + self::rng("b{$accountId}", 3) * 9000;
        $revenue = round($sales * $ticket, 2);

        $cpl = $leads > 0 ? round($cost / $leads, 2) : 0.0;
        $cpo = $opportunities > 0 ? round($cost / $opportunities, 2) : 0.0;
        $cac = $sales > 0 ? round($cost / $sales, 2) : 0.0;
        $roasReal = $cost > 0 ? round($revenue / $cost, 2) : 0.0;

        // por canal
        $byChannel = [];
        foreach (self::campaigns($accountId) as $c) {
            if ($c['cost'] <= 0) { continue; }
            $ch = $c['channel'];
            if (!isset($byChannel[$ch])) { $byChannel[$ch] = ['channel' => $ch, 'cost' => 0.0, 'conversions' => 0.0, 'conv_value' => 0.0]; }
            $byChannel[$ch]['cost'] += $c['cost'];
            $byChannel[$ch]['conversions'] += $c['conversions'];
            $byChannel[$ch]['conv_value'] += $c['conv_value'];
        }
        $byChannel = array_map(function ($r) {
            $r['cost'] = round($r['cost'], 2); $r['conversions'] = round($r['conversions'], 1);
            $r['roas'] = $r['cost'] > 0 ? round($r['conv_value'] / $r['cost'], 2) : 0.0;
            return $r;
        }, array_values($byChannel));

        return [
            'available' => true, 'provider' => 'mock', 'period' => $period,
            'note' => 'Vendas/receita cruzadas do CRM (mock). Na versão real vêm do módulo Pipedrive (PIPE_DSHOW) via GCLID/UTM.',
            'kpis' => [
                ['key' => 'cost', 'label' => 'Investimento', 'value' => $cost, 'unit' => 'currency'],
                ['key' => 'leads', 'label' => 'Leads', 'value' => $leads, 'unit' => 'int'],
                ['key' => 'cpl', 'label' => 'Custo por lead', 'value' => $cpl, 'unit' => 'currency'],
                ['key' => 'opportunities', 'label' => 'Oportunidades', 'value' => $opportunities, 'unit' => 'int'],
                ['key' => 'cpo', 'label' => 'Custo por oportunidade', 'value' => $cpo, 'unit' => 'currency'],
                ['key' => 'sales', 'label' => 'Vendas', 'value' => $sales, 'unit' => 'int'],
                ['key' => 'revenue', 'label' => 'Receita atribuída', 'value' => $revenue, 'unit' => 'currency'],
                ['key' => 'cac', 'label' => 'CAC', 'value' => $cac, 'unit' => 'currency'],
                ['key' => 'roas_real', 'label' => 'ROAS real', 'value' => $roasReal, 'unit' => 'ratio'],
                ['key' => 'ticket', 'label' => 'Ticket médio', 'value' => round($ticket, 2), 'unit' => 'currency'],
            ],
            'funnel' => [
                ['stage' => 'investment', 'label' => 'Investimento', 'value' => $cost, 'unit' => 'currency'],
                ['stage' => 'clicks', 'label' => 'Cliques', 'value' => $tot['clicks'], 'unit' => 'int'],
                ['stage' => 'leads', 'label' => 'Leads', 'value' => $leads, 'unit' => 'int'],
                ['stage' => 'opportunities', 'label' => 'Oportunidades', 'value' => $opportunities, 'unit' => 'int'],
                ['stage' => 'sales', 'label' => 'Vendas', 'value' => $sales, 'unit' => 'int'],
            ],
            'by_channel' => $byChannel,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Recomendações / IA (§26)
    // ─────────────────────────────────────────────────────────────────────
    public static function recommendations(int $accountId): array
    {
        $camps = self::campaigns($accountId);
        $wasteful = array_values(array_filter($camps, fn($c) => in_array($c['health_class'], ['wasting', 'critical'], true)));
        $scale = array_values(array_filter($camps, fn($c) => $c['health_class'] === 'scale_opportunity'));
        $limited = array_values(array_filter($camps, fn($c) => $c['health_class'] === 'budget_limited'));
        $recs = [];

        if ($wasteful) {
            $c = $wasteful[0];
            $recs[] = self::rec('ai', 'crítica', 0.9,
                'Adicionar negativas na campanha "' . $c['name'] . '"',
                'Termos sem intenção comercial (ex.: "grátis", "vagas", "curso") consumiram '
                . 'R$ ' . number_format($c['cost'] * 0.22, 2, ',', '.') . ' sem conversão nos últimos 30 dias.',
                ['economia_mensal_estimada' => round($c['cost'] * 0.22, 2)],
                'Excluir 7 termos de baixa intenção como palavras-chave negativas de campanha.',
                'Baixo — negativas afetam só os termos listados; tráfego convertedor é preservado.',
                [$c['name']]);
        }
        if ($scale) {
            $c = $scale[0];
            $recs[] = self::rec('google', 'alta', 0.82,
                'Aumentar orçamento de "' . $c['name'] . '"',
                'A campanha atinge ROAS ' . number_format($c['roas'], 1, ',', '.') . 'x e está limitada pela verba '
                . 'em horários de pico. Há demanda não atendida.',
                ['conversoes_adicionais_estimadas' => round($c['conversions'] * 0.3, 1)],
                'Elevar o orçamento diário em 30% (de R$ ' . number_format($c['budget'], 0, ',', '.') . ' para R$ ' . number_format($c['budget'] * 1.3, 0, ',', '.') . ').',
                'Médio — aumenta o gasto; monitorar CPA na primeira semana.',
                [$c['name']]);
        }
        if ($limited) {
            $c = $limited[0];
            $recs[] = self::rec('google', 'média', 0.7,
                'Campanha limitada por orçamento: "' . $c['name'] . '"',
                'Perdendo parcela de impressões por verba. Impression share atual: '
                . number_format($c['search_impression_share'] * 100, 0, ',', '.') . '%.',
                ['impression_share_perdido' => round((1 - $c['search_impression_share']) * 100, 1)],
                'Redistribuir verba de campanhas com ROAS baixo ou elevar o teto diário.',
                'Baixo — ajuste de verba, reversível.',
                [$c['name']]);
        }
        // Recomendação de anúncio (força fraca)
        $recs[] = self::rec('ai', 'média', 0.75,
            'Melhorar a força dos anúncios responsivos',
            'Alguns grupos têm anúncios com força "Média/Ruim" — poucos títulos e descrições genéricas, '
            . 'sem correspondência com a palavra-chave.',
            ['ctr_estimado_ganho_pct' => 12],
            'Adicionar 4 títulos com o termo pesquisado e 1 descrição com chamada para ação clara.',
            'Baixo — o Google testa as variações automaticamente (A/B interno).',
            ['Search — Serviços [Ampla]']);

        $recs[] = self::rec('ai', 'baixa', 0.68,
            'Ajustar lances por dispositivo',
            'Mobile converte 28% pior que desktop nesta conta, com CPA maior. '
            . 'Ajuste de lance por dispositivo pode melhorar a eficiência.',
            ['cpa_reducao_estimada_pct' => 9],
            'Aplicar ajuste de lance de -15% em mobile nas campanhas de Search.',
            'Médio — pode reduzir volume em mobile; avaliar por 14 dias.',
            ['Search — Serviços [Exata]', 'Search — Concorrentes']);

        // reindexa com ids
        foreach ($recs as $i => &$r) { $r['id'] = $accountId * 100 + $i + 1; }
        unset($r);
        return $recs;
    }

    private static function rec(string $source, string $priority, float $confidence, string $title, string $problem, array $impact, string $action, string $risks, array $affected): array
    {
        return [
            'source' => $source, 'priority' => $priority, 'confidence' => $confidence,
            'title' => $title, 'problem' => $problem, 'impact' => $impact,
            'recommended_action' => $action, 'risks' => $risks, 'affected' => $affected,
            'needs_approval' => true, 'state' => 'open',
        ];
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Dispositivos (§19)
    // ─────────────────────────────────────────────────────────────────────
    public static function devices(int $accountId): array
    {
        $t = self::sumMetrics(self::campaigns($accountId));
        // share, ctrMod, convMod (mobile converte pior; desktop melhor)
        $defs = [
            ['MOBILE', 'Celular', 0.58, 0.92, 0.78],
            ['DESKTOP', 'Computador', 0.33, 1.15, 1.30],
            ['TABLET', 'Tablet', 0.09, 0.95, 0.9],
        ];
        $out = [];
        foreach ($defs as $d) {
            [$key, $label, $share, $ctrMod, $convMod] = $d;
            $impr = (int)round($t['impressions'] * $share);
            $clicks = (int)round($t['clicks'] * $share * $ctrMod);
            $cost = round($t['cost'] * $share, 2);
            $conv = round($t['conversions'] * $share * $convMod, 1);
            $cv = round($t['conv_value'] * $share * $convMod, 2);
            $out[] = [
                'device' => $key, 'label' => $label,
                'impressions' => $impr, 'clicks' => $clicks,
                'ctr' => $impr > 0 ? round($clicks / $impr, 4) : 0.0,
                'cost' => $cost, 'conversions' => $conv,
                'conv_rate' => $clicks > 0 ? round($conv / $clicks, 4) : 0.0,
                'cpa' => $conv > 0 ? round($cost / $conv, 2) : 0.0,
                'conv_value' => $cv, 'roas' => $cost > 0 ? round($cv / $cost, 2) : 0.0,
            ];
        }
        return $out;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Localizações (§20)
    // ─────────────────────────────────────────────────────────────────────
    private const STATES = [
        ['SP', 'São Paulo', 0.34], ['RJ', 'Rio de Janeiro', 0.14], ['MG', 'Minas Gerais', 0.11],
        ['PR', 'Paraná', 0.08], ['RS', 'Rio Grande do Sul', 0.07], ['SC', 'Santa Catarina', 0.06],
        ['BA', 'Bahia', 0.05], ['DF', 'Distrito Federal', 0.045], ['GO', 'Goiás', 0.04],
        ['PE', 'Pernambuco', 0.035], ['CE', 'Ceará', 0.03], ['ES', 'Espírito Santo', 0.02],
    ];
    public static function locations(int $accountId): array
    {
        $t = self::sumMetrics(self::campaigns($accountId));
        $out = [];
        foreach (self::STATES as $i => $s) {
            [$uf, $name, $share] = $s;
            $seed = "loc{$accountId}-{$i}";
            $convMod = 0.4 + self::rng($seed, 1) * 1.3;   // algumas regiões convertem mal (perto de 0)
            $impr = (int)round($t['impressions'] * $share);
            $clicks = (int)round($t['clicks'] * $share);
            $cost = round($t['cost'] * $share, 2);
            $conv = round($t['conversions'] * $share * $convMod, 1);
            $cv = round($t['conv_value'] * $share * $convMod, 2);
            $out[] = [
                'uf' => $uf, 'name' => $name,
                'impressions' => $impr, 'clicks' => $clicks,
                'ctr' => $impr > 0 ? round($clicks / $impr, 4) : 0.0,
                'cost' => $cost, 'conversions' => $conv,
                'cpa' => $conv > 0 ? round($cost / $conv, 2) : 0.0,
                'conv_value' => $cv, 'roas' => $cost > 0 ? round($cv / $cost, 2) : 0.0,
            ];
        }
        return $out;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Horários e dias (§21) — matriz dia×hora
    // ─────────────────────────────────────────────────────────────────────
    public static function hours(int $accountId): array
    {
        $t = self::sumMetrics(self::campaigns($accountId));
        $hourW = [];
        for ($h = 0; $h < 24; $h++) { $hourW[$h] = ($h >= 8 && $h <= 20) ? (1.0 - abs(14 - $h) * 0.045) : 0.22; }
        $dowW = [1 => 1.0, 2 => 1.06, 3 => 1.05, 4 => 1.0, 5 => 0.94, 6 => 0.5, 7 => 0.38];
        $totalW = 0.0;
        for ($d = 1; $d <= 7; $d++) { for ($h = 0; $h < 24; $h++) { $totalW += $hourW[$h] * $dowW[$d]; } }

        $matrix = []; $byHour = array_fill(0, 24, ['cost' => 0.0, 'conversions' => 0.0]);
        $byDow = []; $best = null; $worst = null;
        for ($d = 1; $d <= 7; $d++) {
            $cells = []; $dc = 0.0; $dv = 0.0;
            for ($h = 0; $h < 24; $h++) {
                $w = $hourW[$h] * $dowW[$d] / $totalW;
                $noise = 0.85 + self::rng("hr{$accountId}", $d * 24 + $h) * 0.3;
                $convNoise = 0.55 + self::rng("hrc{$accountId}", $d * 24 + $h) * 1.0;   // eficiência varia por faixa
                $cost = round($t['cost'] * $w * $noise, 2);
                $conv = round($t['conversions'] * $w * $convNoise, 2);
                $cpa = $conv > 0 ? $cost / $conv : 0;
                $cells[] = ['hour' => $h, 'cost' => $cost, 'conversions' => $conv];
                $byHour[$h]['cost'] += $cost; $byHour[$h]['conversions'] += $conv;
                $dc += $cost; $dv += $conv;
                if ($conv >= 1) {
                    if ($best === null || $cpa < $best['cpa']) { $best = ['dow' => $d, 'hour' => $h, 'cpa' => round($cpa, 2)]; }
                    if ($worst === null || $cpa > $worst['cpa']) { $worst = ['dow' => $d, 'hour' => $h, 'cpa' => round($cpa, 2)]; }
                }
            }
            $matrix[] = ['dow' => $d, 'cells' => $cells];
            $byDow[] = ['dow' => $d, 'cost' => round($dc, 2), 'conversions' => round($dv, 1)];
        }
        $byHourArr = [];
        for ($h = 0; $h < 24; $h++) { $byHourArr[] = ['hour' => $h, 'cost' => round($byHour[$h]['cost'], 2), 'conversions' => round($byHour[$h]['conversions'], 1)]; }
        return ['matrix' => $matrix, 'by_hour' => $byHourArr, 'by_dow' => $byDow, 'best' => $best, 'worst' => $worst];
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Conversões (§23)
    // ─────────────────────────────────────────────────────────────────────
    public static function conversions(int $accountId): array
    {
        $t = self::sumMetrics(self::campaigns($accountId));
        $totConv = max(1.0, $t['conversions']);
        $defs = [
            ['Formulário — Orçamento', 'Lead (formulário)', 'WEBSITE', 0.34, 320, 'DATA_DRIVEN', 'good'],
            ['WhatsApp', 'Contato (WhatsApp)', 'WEBSITE', 0.28, 260, 'DATA_DRIVEN', 'good'],
            ['Ligação do site', 'Ligação', 'CALL', 0.16, 300, 'LAST_CLICK', 'good'],
            ['Lead — download de material', 'Lead (secundária)', 'WEBSITE', 0.12, 90, 'DATA_DRIVEN', 'warn'],
            ['Início de solicitação', 'Micro-conversão', 'WEBSITE', 0.10, 40, 'LAST_CLICK', 'warn'],
        ];
        $out = [];
        foreach ($defs as $i => $d) {
            [$name, $cat, $origin, $share, $val, $attr, $quality] = $d;
            $count = round($totConv * $share, 1);
            $out[] = [
                'name' => $name, 'category' => $cat, 'origin' => $origin,
                'status' => 'ENABLED', 'primary' => $i < 3,
                'count' => $count, 'value' => round($count * $val, 2),
                'value_per' => $val,
                'attribution' => $attr, 'window_days' => 30,
                'tracking_quality' => $quality,
            ];
        }
        return $out;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Públicos (§22)
    // ─────────────────────────────────────────────────────────────────────
    public static function audiences(int $accountId): array
    {
        $t = self::sumMetrics(self::campaigns($accountId));
        // nome, tipo, estágio, share de custo, convMod
        $defs = [
            ['Remarketing — visitantes do site', 'remarketing', 'Remarketing', 0.16, 1.6, 240000],
            ['Remarketing — abandono de orçamento', 'remarketing', 'Remarketing', 0.10, 2.2, 38000],
            ['Clientes (lista carregada)', 'customer', 'Clientes', 0.08, 1.9, 12500],
            ['Semelhantes a clientes', 'similar', 'Prospecção', 0.20, 0.9, 1800000],
            ['Em mercado — Eventos e feiras', 'in_market', 'Prospecção', 0.26, 1.0, 920000],
            ['Afinidade — Marketing e Publicidade', 'affinity', 'Prospecção', 0.20, 0.6, 3400000],
        ];
        $out = [];
        foreach ($defs as $i => $d) {
            [$name, $type, $stage, $share, $convMod, $size] = $d;
            $seed = "aud{$accountId}-{$i}";
            $impr = (int)round($t['impressions'] * $share);
            $clicks = (int)round($t['clicks'] * $share * (0.9 + self::rng($seed, 1) * 0.3));
            $cost = round($t['cost'] * $share, 2);
            $conv = round($t['conversions'] * $share * $convMod, 1);
            $cv = round($t['conv_value'] * $share * $convMod, 2);
            $out[] = [
                'name' => $name, 'type' => $type, 'stage' => $stage, 'size' => $size,
                'impressions' => $impr, 'clicks' => $clicks,
                'ctr' => $impr > 0 ? round($clicks / $impr, 4) : 0.0,
                'cost' => $cost, 'conversions' => $conv,
                'cpa' => $conv > 0 ? round($cost / $conv, 2) : 0.0,
                'conv_value' => $cv, 'roas' => $cost > 0 ? round($cv / $cost, 2) : 0.0,
            ];
        }
        return $out;
    }

    /**
     * Sobreposição de públicos (chord): matriz simétrica determinística de usuários
     * compartilhados entre segmentos. O fator cresce quando os públicos estão no mesmo
     * estágio do funil; a base é o menor dos dois tamanhos.
     */
    public static function audienceOverlap(int $accountId): array
    {
        $auds = self::audiences($accountId);
        $n = count($auds);
        $labels = array_map(static function ($a) {
            $partes = explode('—', $a['name']);
            return trim(end($partes));
        }, $auds);
        $matrix = array_fill(0, $n, array_fill(0, $n, 0));
        for ($i = 0; $i < $n; $i++) {
            for ($j = $i + 1; $j < $n; $j++) {
                $minSize = min((int)$auds[$i]['size'], (int)$auds[$j]['size']);
                $mesmoEstagio = $auds[$i]['stage'] === $auds[$j]['stage'];
                $fator = 0.03 + ($mesmoEstagio ? 0.05 : 0.0) + self::rng("ov-{$accountId}-{$i}-{$j}", 1) * 0.06;
                $ov = (int) round($minSize * $fator);
                $matrix[$i][$j] = $ov;
                $matrix[$j][$i] = $ov;
            }
        }
        return ['labels' => $labels, 'matrix' => $matrix];
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Landing Pages (§16)
    // ─────────────────────────────────────────────────────────────────────
    public static function landingPages(int $accountId): array
    {
        $t = self::sumMetrics(self::campaigns($accountId));
        $defs = [
            ['/montagem-de-estandes', 0.26, 1.3, 88, 2.1, 0.04, true],
            ['/estruturas-para-eventos', 0.20, 1.1, 82, 2.6, 0.06, true],
            ['/locacao-de-tendas', 0.16, 0.8, 71, 3.4, 0.11, false],
            ['/orcamento', 0.18, 1.5, 91, 1.8, 0.03, true],
            ['/feiras-e-congressos', 0.12, 0.9, 76, 2.9, 0.08, true],
            ['/', 0.08, 0.5, 68, 3.8, 0.14, false],
        ];
        $out = [];
        foreach ($defs as $i => $d) {
            [$url, $share, $convMod, $speed, $lcp, $cls, $match] = $d;
            $seed = "lp{$accountId}-{$i}";
            $sessions = (int)round($t['clicks'] * $share * (0.9 + self::rng($seed, 1) * 0.2));
            $cost = round($t['cost'] * $share, 2);
            $conv = round($t['conversions'] * $share * $convMod, 1);
            $convRate = $sessions > 0 ? round($conv / $sessions, 4) : 0.0;
            $out[] = [
                'url' => $url,
                'sessions' => $sessions,
                'conversions' => $conv,
                'conv_rate' => $convRate,
                'cost' => $cost,
                'cpa' => $conv > 0 ? round($cost / $conv, 2) : 0.0,
                'speed_score' => $speed,
                'cwv_lcp' => $lcp,
                'cwv_cls' => $cls,
                'mobile_score' => max(40, $speed - (int)round(self::rng($seed, 2) * 18)),
                'match_intent' => $match,
            ];
        }
        return $out;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Orçamentos (§24)
    // ─────────────────────────────────────────────────────────────────────
    public static function budgets(int $accountId): array
    {
        $dim = (int)date('t');
        $day = (int)date('j');
        $frac = max(0.03, $day / $dim);
        $out = [];
        foreach (self::campaigns($accountId) as $c) {
            if ($c['status'] !== 'ENABLED') { continue; }
            $monthBudget = round($c['budget'] * $dim, 2);
            $spentMonth = round($c['cost'] * $frac, 2);         // custo (30d) proporcional ao mês corrente
            $spentToday = round($c['cost'] / 30 * (0.7 + self::rng("bud{$c['campaign_id']}", 1) * 0.6), 2);
            $projection = round($spentMonth / $frac, 2);
            $pacing = $monthBudget > 0 ? round($projection / $monthBudget, 3) : 0.0;
            $status = $c['health_class'] === 'budget_limited' ? 'limited' : ($pacing > 1.05 ? 'overpacing' : ($pacing < 0.7 ? 'underpacing' : 'ok'));
            $out[] = [
                'campaign' => $c['name'], 'daily_budget' => $c['budget'],
                'spent_today' => $spentToday, 'spent_month' => $spentMonth,
                'month_budget' => $monthBudget, 'projection' => $projection,
                'pacing' => $pacing, 'status' => $status,
                'conversions' => $c['conversions'], 'cpa' => $c['cpa'],
            ];
        }
        return $out;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Qualidade (§25)
    // ─────────────────────────────────────────────────────────────────────
    public static function quality(int $accountId): array
    {
        $ads = self::ads($accountId);
        $kw = self::keywords($accountId);
        $lp = self::landingPages($accountId);

        $strength = ['EXCELLENT' => 0, 'GOOD' => 0, 'AVERAGE' => 0, 'POOR' => 0];
        $disapproved = 0;
        foreach ($ads as $a) { $strength[$a['ad_strength']] = ($strength[$a['ad_strength']] ?? 0) + 1; if ($a['approval_status'] === 'DISAPPROVED') { $disapproved++; } }

        $qsBuckets = ['baixo' => 0, 'medio' => 0, 'alto' => 0];
        $qsSum = 0;
        foreach ($kw as $k) { $qsSum += $k['quality_score']; if ($k['quality_score'] <= 4) { $qsBuckets['baixo']++; } elseif ($k['quality_score'] <= 7) { $qsBuckets['medio']++; } else { $qsBuckets['alto']++; } }
        $qsAvg = count($kw) > 0 ? round($qsSum / count($kw), 1) : 0.0;

        // piores anúncios (força fraca) e piores palavras (QS baixo)
        $weakAds = array_values(array_filter($ads, fn($a) => in_array($a['ad_strength'], ['POOR', 'AVERAGE'], true)));
        usort($weakAds, fn($a, $b) => $b['cost'] <=> $a['cost']);
        $weakKw = array_values(array_filter($kw, fn($k) => $k['quality_score'] <= 4));
        usort($weakKw, fn($a, $b) => $b['cost'] <=> $a['cost']);

        $slowPages = array_values(array_filter($lp, fn($p) => $p['speed_score'] < 80 || !$p['match_intent']));

        // Perfil de qualidade (radar, 5 eixos 0-100) — derivado dos agregados; "atual" vs "meta".
        $nAds = max(1, count($ads));
        $nKw = max(1, count($kw));
        $nLp = max(1, count($lp));
        $clamp = fn(float $v): int => (int) max(0, min(100, round($v)));
        $forcaScore = $clamp((($strength['EXCELLENT'] ?? 0) * 100 + ($strength['GOOD'] ?? 0) * 72 + ($strength['AVERAGE'] ?? 0) * 45 + ($strength['POOR'] ?? 0) * 18) / $nAds);
        $ctrEsperada = $clamp($qsBuckets['alto'] / $nKw * 100);                                  // % de palavras com QS alto
        $relevancia = $clamp($qsAvg / 10 * 100);                                                 // QS médio (0-10) → 0-100
        $lpExperiencia = $clamp(array_sum(array_map(fn($p) => $p['speed_score'], $lp)) / $nLp);   // velocidade média das LPs
        $correspondencia = $clamp(count(array_filter($lp, fn($p) => $p['match_intent'])) / $nLp * 100);
        $radar = [
            'eixos' => ['CTR esperada', 'Relevância do anúncio', 'Experiência na LP', 'Força criativa', 'Correspondência de intenção'],
            'atual' => [$ctrEsperada, $relevancia, $lpExperiencia, $forcaScore, $correspondencia],
            'meta' => [80, 85, 85, 78, 90],
        ];

        return [
            'ads_total' => count($ads), 'strength' => $strength, 'disapproved' => $disapproved,
            'kw_total' => count($kw), 'qs_avg' => $qsAvg, 'qs_buckets' => $qsBuckets, 'radar' => $radar,
            'weak_ads' => array_slice(array_map(fn($a) => ['label' => implode(' · ', array_slice($a['headlines'], 0, 2)), 'group' => $a['ad_group_name'], 'strength' => $a['ad_strength'], 'cost' => $a['cost']], $weakAds), 0, 6),
            'weak_keywords' => array_slice(array_map(fn($k) => ['keyword' => $k['keyword_text'], 'group' => $k['ad_group_name'], 'qs' => $k['quality_score'], 'cost' => $k['cost']], $weakKw), 0, 6),
            'slow_pages' => array_slice(array_map(fn($p) => ['url' => $p['url'], 'speed' => $p['speed_score'], 'mobile' => $p['mobile_score'], 'match' => $p['match_intent']], $slowPages), 0, 6),
        ];
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Funil comercial completo (§16.3 / §18) — correspondência ponta a ponta
    // ─────────────────────────────────────────────────────────────────────
    public static function funnelFull(int $accountId): array
    {
        $t = self::sumMetrics(self::campaigns($accountId));
        $b = self::board($accountId, '30d');
        $k = [];
        foreach ($b['kpis'] as $x) { $k[$x['key']] = $x['value']; }
        $leads = (int)$k['leads'];
        $sessions = (int)round($t['clicks'] * 0.94);
        $formStarts = (int)round($leads * 2.4);
        $steps = [
            ['label' => 'Impressões', 'value' => $t['impressions'], 'unit' => 'int'],
            ['label' => 'Cliques', 'value' => $t['clicks'], 'unit' => 'int'],
            ['label' => 'Sessões (LP)', 'value' => $sessions, 'unit' => 'int'],
            ['label' => 'Formulários iniciados', 'value' => $formStarts, 'unit' => 'int'],
            ['label' => 'Leads', 'value' => $leads, 'unit' => 'int'],
            ['label' => 'Oportunidades', 'value' => (int)$k['opportunities'], 'unit' => 'int'],
            ['label' => 'Vendas', 'value' => (int)$k['sales'], 'unit' => 'int'],
            ['label' => 'Receita', 'value' => $k['revenue'], 'unit' => 'currency'],
        ];
        return [
            'steps' => $steps,
            'note' => 'Correspondência termo → clique → página → formulário → lead → oportunidade → venda. Vendas/receita do CRM (mock; real = Pipedrive/PIPE_DSHOW via GCLID/UTM).',
        ];
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Alertas (§27)
    // ─────────────────────────────────────────────────────────────────────
    public static function alerts(int $accountId): array
    {
        $camps = self::campaigns($accountId);
        $byHealth = fn($h) => array_values(array_filter($camps, fn($c) => $c['health_class'] === $h));
        $now = time();
        $ev = [];
        $add = function (string $sev, string $title, string $msg, int $minsAgo) use (&$ev, $now) {
            $ev[] = ['id' => count($ev) + 1, 'severity' => $sev, 'title' => $title, 'message' => $msg,
                     'when' => date('c', $now - $minsAgo * 60), 'state' => 'open'];
        };
        $limited = $byHealth('budget_limited'); $critical = $byHealth('critical'); $wasting = $byHealth('wasting'); $excellent = $byHealth('excellent');
        if ($limited) { $add('critical', 'Orçamento esgotado', 'A campanha "' . $limited[0]['name'] . '" atingiu o orçamento diário e parou de exibir antes do fim do dia.', 42); }
        if ($critical) { $add('warning', 'CPC subiu +18%', 'O CPC médio de "' . $critical[0]['name'] . '" subiu 18% nos últimos 7 dias sem aumento de conversões.', 130); }
        if ($wasting) { $add('warning', 'Gasto sem conversão', '"' . $wasting[0]['name'] . '" acumulou custo relevante com poucas conversões — revisar termos e página.', 260); }
        $disap = 0; foreach (self::ads($accountId) as $a) { if ($a['approval_status'] === 'DISAPPROVED') { $disap++; } }
        if ($disap > 0) { $add('critical', 'Anúncio reprovado', $disap . ' anúncio(s) reprovado(s) por política — deixaram de exibir.', 320); }
        if ($excellent) { $add('info', 'ROAS acima da meta', '"' . $excellent[0]['name'] . '" está com ROAS ' . number_format($excellent[0]['roas'], 1, ',', '.') . 'x — candidata a escala.', 90); }

        $rules = [
            ['key' => 'cpc_up', 'name' => 'CPC subiu acima do limite', 'metric' => 'CPC', 'condition' => '> +15%', 'window' => '7 dias', 'severity' => 'warning', 'enabled' => true, 'channel' => 'painel'],
            ['key' => 'conv_drop', 'name' => 'Conversões caíram', 'metric' => 'Conversões', 'condition' => '< −25%', 'window' => '7 dias', 'severity' => 'critical', 'enabled' => true, 'channel' => 'e-mail'],
            ['key' => 'budget_out', 'name' => 'Orçamento esgotado', 'metric' => 'Orçamento', 'condition' => '= 100% antes das 18h', 'window' => 'diário', 'severity' => 'warning', 'enabled' => true, 'channel' => 'painel'],
            ['key' => 'roas_drop', 'name' => 'ROAS abaixo da meta', 'metric' => 'ROAS', 'condition' => '< 2,0×', 'window' => '14 dias', 'severity' => 'warning', 'enabled' => true, 'channel' => 'e-mail'],
            ['key' => 'zero_conv', 'name' => 'Campanha zerou conversões', 'metric' => 'Conversões', 'condition' => '= 0', 'window' => '3 dias', 'severity' => 'critical', 'enabled' => false, 'channel' => 'painel'],
            ['key' => 'ad_disapproved', 'name' => 'Anúncio reprovado', 'metric' => 'Aprovação', 'condition' => 'reprovado', 'window' => 'imediato', 'severity' => 'critical', 'enabled' => true, 'channel' => 'e-mail'],
        ];
        return ['events' => $ev, 'rules' => $rules];
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Relatórios (§28) — modelos disponíveis
    // ─────────────────────────────────────────────────────────────────────
    public static function reports(): array
    {
        $mk = fn(string $key, string $name, string $desc, array $fmt) => ['key' => $key, 'name' => $name, 'description' => $desc, 'formats' => $fmt];
        return [
            $mk('executivo', 'Relatório executivo', 'Visão consolidada para a diretoria: investimento, leads, vendas e ROAS.', ['pdf', 'pptx']),
            $mk('performance', 'Relatório de performance', 'Métricas e evolução de todas as campanhas no período.', ['pdf', 'xlsx', 'csv']),
            $mk('campanhas', 'Relatório de campanhas', 'Detalhe por campanha com comparativo de período.', ['xlsx', 'csv']),
            $mk('palavras', 'Relatório de palavras-chave', 'Palavras com Quality Score, custo e conversões.', ['xlsx', 'csv']),
            $mk('termos', 'Relatório de termos', 'Termos de pesquisa e classificação de intenção.', ['xlsx', 'csv']),
            $mk('landing', 'Relatório de landing pages', 'Desempenho e Core Web Vitals das páginas de destino.', ['pdf', 'xlsx']),
            $mk('conversoes', 'Relatório de conversões', 'Ações de conversão, contagem, valor e atribuição.', ['xlsx', 'csv']),
            $mk('desperdicios', 'Relatório de desperdícios', 'Termos, palavras e campanhas gastando sem retorno.', ['pdf', 'xlsx']),
            $mk('oportunidades', 'Relatório de oportunidades', 'Campanhas para escalar e recomendações priorizadas.', ['pdf']),
            $mk('comercial', 'Relatório comercial', 'Funil investimento → lead → venda cruzado com CRM.', ['pdf', 'pptx']),
            $mk('mensal', 'Relatório mensal da diretoria', 'Fechamento do mês com metas e projeção.', ['pdf', 'pptx']),
        ];
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Histórico de alterações (§34)
    // ─────────────────────────────────────────────────────────────────────
    public static function history(int $accountId): array
    {
        $camps = self::campaigns($accountId);
        $now = time();
        $nCamps = max(1, count($camps));
        $nome = static function (int $k) use ($camps, $nCamps): string {
            return $camps[$k % $nCamps]['name'] ?? 'Campanha';
        };
        $c0 = $nome(1); $c1 = $nome(3); $c2 = $nome(2);

        // Entradas recentes curadas (mantidas): dão o "topo" realista da trilha.
        $curados = [
            ['user' => 'Jhony', 'object' => $c2, 'object_type' => 'campaign', 'action' => 'Pausou a campanha', 'old' => 'Ativa', 'new' => 'Pausada', 'origin' => 'manual', 'mins' => 95],
            ['user' => 'Jhony', 'object' => $c0, 'object_type' => 'budget', 'action' => 'Alterou o orçamento diário', 'old' => 'R$ 260', 'new' => 'R$ 300', 'origin' => 'manual', 'mins' => 240],
            ['user' => 'Ana (Analista)', 'object' => $c1, 'object_type' => 'keyword', 'action' => 'Adicionou 5 palavras-chave negativas', 'old' => '—', 'new' => '5 negativas', 'origin' => 'bulk', 'mins' => 400],
            ['user' => 'IA', 'object' => $c0, 'object_type' => 'bid', 'action' => 'Aplicou ajuste de lance (aprovado)', 'old' => 'CPA R$ 120', 'new' => 'CPA R$ 100', 'origin' => 'ai_suggestion', 'mins' => 720],
            ['user' => 'Jhony', 'object' => $c1, 'object_type' => 'ad', 'action' => 'Editou títulos do anúncio', 'old' => '3 títulos', 'new' => '7 títulos', 'origin' => 'manual', 'mins' => 1500],
            ['user' => 'Sistema', 'object' => $c2, 'object_type' => 'campaign', 'action' => 'Alteração externa detectada (feita no Google Ads)', 'old' => 'Lance manual', 'new' => 'Maximizar conversões', 'origin' => 'external_detected', 'mins' => 2600],
            ['user' => 'Jhony', 'object' => $c0, 'object_type' => 'campaign', 'action' => 'Ativou a campanha', 'old' => 'Pausada', 'new' => 'Ativa', 'origin' => 'manual', 'mins' => 4300],
        ];

        // Entradas históricas geradas (determinísticas) — espalham a trilha por ~30 dias
        // para dar substância à linha do tempo e ao donut de origens (§34).
        $origens = ['manual', 'manual', 'manual', 'ai_suggestion', 'ai_suggestion', 'bulk', 'automation', 'manual', 'external_detected', 'import', 'manual', 'ai_suggestion'];
        $usuariosManual = ['Jhony', 'Ana (Analista)', 'Bruno (Gestor)', 'Carla (Analista)'];
        $gerados = [];
        for ($i = 0; $i < 40; $i++) {
            $origin = $origens[$i % count($origens)];
            $tipo = ['campaign', 'budget', 'keyword', 'bid', 'ad', 'campaign'][$i % 6];
            $obj = $nome($i + 1);
            switch ($origin) {
                case 'ai_suggestion':     $user = 'IA'; break;
                case 'automation':        $user = 'Sistema'; break;
                case 'external_detected': $user = 'Sistema'; break;
                case 'import':            $user = 'Bruno (Gestor)'; break;
                case 'bulk':              $user = 'Ana (Analista)'; break;
                default:                  $user = $usuariosManual[$i % 4];
            }
            // ação + valores anterior/novo por tipo de objeto (determinísticos por índice)
            switch ($tipo) {
                case 'budget':
                    $b = 150 + ($i % 8) * 40;
                    $act = 'Alterou o orçamento diário'; $old = 'R$ ' . $b; $new = 'R$ ' . ($b + 40);
                    break;
                case 'keyword':
                    $act = 'Adicionou palavras-chave negativas'; $old = '—'; $new = (3 + $i % 6) . ' negativas';
                    break;
                case 'bid':
                    $cpa = 90 + ($i % 6) * 15;
                    $act = 'Aplicou ajuste de lance'; $old = 'CPA R$ ' . $cpa; $new = 'CPA R$ ' . ($cpa - 10);
                    break;
                case 'ad':
                    $act = 'Editou títulos do anúncio'; $old = (2 + $i % 4) . ' títulos'; $new = (5 + $i % 4) . ' títulos';
                    break;
                default: // campaign
                    if ($origin === 'external_detected') { $act = 'Alteração externa detectada (feita no Google Ads)'; $old = 'Lance manual'; $new = 'Maximizar conversões'; }
                    elseif ($i % 2 === 0) { $act = 'Pausou a campanha'; $old = 'Ativa'; $new = 'Pausada'; }
                    else { $act = 'Ativou a campanha'; $old = 'Pausada'; $new = 'Ativa'; }
            }
            $gerados[] = [
                'user' => $user, 'object' => $obj, 'object_type' => $tipo, 'action' => $act,
                'old' => $old, 'new' => $new, 'origin' => $origin,
                // espalha de ~5.000 min (≈3,5 dias) a ~43.000 min (≈30 dias)
                'mins' => 5000 + $i * 950 + ($i % 5) * 120,
            ];
        }

        $rows = array_merge($curados, $gerados);
        $out = [];
        foreach ($rows as $i => $r) {
            $out[] = [
                'id' => $i + 1, 'when' => date('c', $now - $r['mins'] * 60),
                'user' => $r['user'], 'object' => $r['object'], 'object_type' => $r['object_type'],
                'action' => $r['action'], 'old_value' => $r['old'], 'new_value' => $r['new'],
                'origin' => $r['origin'], 'exec_status' => 'applied',
            ];
        }
        return $out;
    }
}
