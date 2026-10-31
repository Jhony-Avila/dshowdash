<?php
// Google Analytics / lib/GaReal.php — provedor REAL (GA4 Data API v1 + Admin API) com conta de serviço
// @module  google-analytics.lib.real
// @version 2.0.0
// @created 2026-07-30 · 2.0.0 em 2026-10-31 (Noite 2, Q-GA.1): implementado e testado contra um Google FALSO; ATIVAÇÃO só com GA_PROVIDER=real
//          depois que o Jhony configurar a conta de serviço e o ID da propriedade (docs do app: handoff/google-analytics/ATIVACAO.md).
//
// Devolve EXATAMENTE as chaves que o GaMock devolve (as telas não mudam — §4.3/§83), com `meta.fonte = 'ga4-data-api'`. O que a Data API
// não oferece fica explícito: `null` (ex.: entradas/saídas por página, primeira/última ocorrência de evento, custo de mídia) ou lista vazia
// com `meta.parcial = true` e `meta.observacao` (jornada exige BigQuery). NUNCA cai para o mock: sem credencial = 503 com as pendências.
// Cache no Redis: relatórios 10 min, tempo real 1 min, administração 1 h (§57: cada categoria de cota separada).
declare(strict_types=1);

require_once __DIR__ . '/GaGoogleClient.php';

final class GaReal implements GaProvider
{
    private const TTL = ['core' => 600, 'realtime' => 60, 'funnel' => 600, 'admin' => 3600];
    private const AUTOMATICOS = ['page_view', 'session_start', 'user_engagement', 'first_visit', 'scroll', 'click', 'view_search_results', 'file_download', 'form_start', 'form_submit', 'video_start', 'video_progress', 'video_complete'];
    private const RECOMENDADOS = ['generate_lead', 'sign_up', 'login', 'purchase', 'add_to_cart', 'begin_checkout', 'add_payment_info', 'add_shipping_info', 'view_item', 'view_item_list', 'select_item', 'remove_from_cart', 'refund', 'search', 'share'];
    private const ECOMMERCE = ['view_item_list', 'select_item', 'view_item', 'add_to_cart', 'remove_from_cart', 'view_cart', 'begin_checkout', 'add_shipping_info', 'add_payment_info', 'purchase', 'refund'];
    private const ESPERADOS = ['generate_lead', 'iniciou_formulario', 'clicou_whatsapp', 'scrool_50'];
    private const UF = ['Acre' => 'AC', 'Alagoas' => 'AL', 'Amapa' => 'AP', 'Amazonas' => 'AM', 'Bahia' => 'BA', 'Ceara' => 'CE', 'Federal District' => 'DF', 'Espirito Santo' => 'ES', 'Goias' => 'GO',
        'Maranhao' => 'MA', 'Mato Grosso' => 'MT', 'Mato Grosso do Sul' => 'MS', 'Minas Gerais' => 'MG', 'Para' => 'PA', 'Paraiba' => 'PB', 'Parana' => 'PR', 'Pernambuco' => 'PE', 'Piaui' => 'PI',
        'Rio de Janeiro' => 'RJ', 'Rio Grande do Norte' => 'RN', 'Rio Grande do Sul' => 'RS', 'Rondonia' => 'RO', 'Roraima' => 'RR', 'Santa Catarina' => 'SC', 'Sao Paulo' => 'SP', 'State of Sao Paulo' => 'SP',
        'Sergipe' => 'SE', 'Tocantins' => 'TO'];

    private GaGoogleClient $g;

    public function __construct(?GaGoogleClient $cliente = null) { $this->g = $cliente ?? GaGoogleClient::doAmbiente(); }

    public function nome(): string { return 'ga4'; }

    // ── infraestrutura ──────────────────────────────────────────────────
    private function proc(string $categoria, bool $parcial = false, array $extra = []): array
    {
        return ['fonte' => 'ga4-data-api', 'categoria_quota' => $categoria, 'atualizado_em' => (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z'),
            'parcial' => $parcial, 'property_id' => $this->g->propertyId(), 'measurement_id' => GaMock::MEASUREMENT_ID, 'cota' => $this->g->ultimaCota] + $extra;
    }

    /** Cache por método+filtros (só filtros que mudam a consulta). */
    private function cache(string $metodo, string $categoria, array $chave, callable $calc): array
    {
        $k = 'ga:real:' . $metodo . ':' . substr(hash('sha256', json_encode([$this->g->propertyId(), $chave])), 0, 24);
        $semCache = getenv('GA_CACHE_OFF') === '1';   // só testes
        if (!$semCache && class_exists('RedisHelper') && ($c = RedisHelper::tryGetCache($k)) && is_array($v = json_decode($c, true))) { return $v; }
        $v = $calc();
        if (!$semCache && class_exists('RedisHelper')) { RedisHelper::setCache($k, json_encode($v, JSON_UNESCAPED_UNICODE), self::TTL[$categoria] ?? 300); }
        return $v;
    }

    private static function faixa(array $f): array { return ['startDate' => $f['inicio'], 'endDate' => $f['fim']]; }
    private static function anterior(array $f): array
    {
        $tz = new DateTimeZone('America/Sao_Paulo');
        $ini = new DateTimeImmutable($f['inicio'], $tz); $dias = max(1, (int)$f['dias']);
        return ['startDate' => $ini->modify('-' . $dias . ' days')->format('Y-m-d'), 'endDate' => $ini->modify('-1 day')->format('Y-m-d')];
    }
    private static function d(array $nomes): array { return array_map(static fn ($n) => ['name' => $n], $nomes); }
    private static function pct(float $num, float $den, int $casas = 2): float { return $den > 0 ? round($num / $den * 100, $casas) : 0.0; }
    private static function dataIso(string $yyyymmdd): string { return strlen($yyyymmdd) === 8 ? substr($yyyymmdd, 0, 4) . '-' . substr($yyyymmdd, 4, 2) . '-' . substr($yyyymmdd, 6, 2) : $yyyymmdd; }
    private static function tipoPagina(string $path): string
    {
        $p = strtolower($path);
        return match (true) {
            $p === '/' || $p === '' => 'home',
            str_contains($p, 'obrigado') || str_contains($p, 'thank') => 'obrigado',
            str_contains($p, 'contato') => 'contato',
            str_contains($p, 'blog') || str_contains($p, 'noticia') => 'conteudo',
            str_contains($p, 'produto') || str_contains($p, 'painel') || str_contains($p, 'led') => 'produto',
            str_contains($p, '404') || str_contains($p, 'erro') => 'erro',
            default => 'institucional',
        };
    }
    private static function classe(string $ev): string
    {
        return in_array($ev, self::AUTOMATICOS, true) ? 'automatico' : (in_array($ev, self::RECOMENDADOS, true) ? 'recomendado' : 'customizado');
    }
    private static function diagnosticosEvento(string $ev): array
    {
        $d = [];
        if (str_starts_with($ev, 'scrool_')) { $d[] = ['nivel' => 'aviso', 'texto' => 'Nome grafado incorretamente: o correto é "scroll".']; }
        if (preg_match('/^time_\d+segundos$/', $ev)) { $d[] = ['nivel' => 'info', 'texto' => 'Evento de temporizador: variantes configuradas inflam a contagem de eventos e o consumo de quota.']; }
        if (in_array($ev, ['clicou_whatsapp', 'iniciou_conversa_whatsapp'], true)) { $d[] = ['nivel' => 'info', 'texto' => 'Nome em português convive com generate_lead em inglês: convenção de nomenclatura inconsistente.']; }
        return $d;
    }

    private function eventosImportantes(): array
    {
        return $this->cache('keyEvents', 'admin', [], function (): array {
            $r = $this->g->keyEvents();
            return array_values(array_filter(array_map(static fn ($k) => (string)($k['eventName'] ?? ''), $r['keyEvents'] ?? [])));
        });
    }

    // ── status / administração ──────────────────────────────────────────
    public function status(): array
    {
        $pend = $this->g->pendencias();
        $valida = null;
        if ($pend === []) {
            try { $this->g->metadata(); $valida = true; }
            catch (GaIndisponivel $e) { $valida = false; $pend[] = $e->getMessage(); }
        }
        return ['provedor' => 'ga4', 'pronto' => $pend === [] && $valida === true, 'measurement_id' => GaMock::MEASUREMENT_ID, 'gtm_container' => GaMock::GTM_CONTAINER,
            'property_id' => $this->g->propertyId(), 'cenarios' => [], 'pendencias_para_real' => $pend, 'meta' => $this->proc('core')];
    }

    public function propriedades(): array
    {
        return $this->cache('propriedades', 'admin', [], function (): array {
            $r = $this->g->accountSummaries();
            $streams = [];
            try { $s = $this->g->dataStreams(); foreach ($s['dataStreams'] ?? [] as $x) { $streams[] = ['id' => basename((string)($x['name'] ?? '')), 'nome' => (string)($x['displayName'] ?? ''), 'tipo' => (string)($x['type'] ?? ''),
                'measurement_id' => (string)($x['webStreamData']['measurementId'] ?? ''), 'url' => (string)($x['webStreamData']['defaultUri'] ?? '')]; } } catch (GaIndisponivel $e) { /* inventário sem streams */ }
            $contas = [];
            foreach ($r['accountSummaries'] ?? [] as $a) {
                $props = [];
                foreach ($a['propertySummaries'] ?? [] as $p) {
                    $pid = basename((string)($p['property'] ?? ''));
                    $props[] = ['id' => $pid, 'property_id' => $pid, 'nome' => (string)($p['displayName'] ?? ''), 'measurement_id' => $pid === $this->g->propertyId() ? GaMock::MEASUREMENT_ID : null,
                        'moeda' => null, 'timezone' => null, 'tipo' => (string)($p['propertyType'] ?? ''), 'criada_em' => null, 'streams' => $pid === $this->g->propertyId() ? $streams : []];
                }
                $contas[] = ['id' => basename((string)($a['account'] ?? '')), 'nome' => (string)($a['displayName'] ?? ''), 'pais' => null, 'propriedades' => $props];
            }
            return ['contas' => $contas, 'aviso_inventario' => 'Inventário lido da Admin API com a conta de serviço (só o que ela enxerga).', 'meta' => $this->proc('admin')];
        });
    }

    // ── Visão geral ─────────────────────────────────────────────────────
    private const SERIE_MET = ['totalUsers', 'newUsers', 'sessions', 'engagedSessions', 'screenPageViews', 'eventCount', 'keyEvents', 'totalRevenue'];

    private function serieDupla(array $f): array
    {
        return $this->cache('serie', 'core', [$f['inicio'], $f['fim']], function () use ($f): array {
            $r = $this->g->runReport(['dateRanges' => [self::faixa($f), self::anterior($f)], 'dimensions' => self::d(['date']), 'metrics' => self::d(self::SERIE_MET), 'orderBys' => [['dimension' => ['dimensionName' => 'date']]], 'limit' => 1000]);
            $cur = []; $ant = [];
            foreach ($r['rows'] ?? [] as $row) {
                $dims = array_map(static fn ($d) => (string)$d['value'], $row['dimensionValues'] ?? []);
                $vals = array_map(static fn ($m) => (float)($m['value'] ?? 0), $row['metricValues'] ?? []);
                $rangeIdx = count($dims) > 1 ? $dims[1] : 'date_range_0';
                [$u, $n, $s, $se, $pv, $ev, $ke, $rec] = array_pad($vals, 8, 0.0);
                $linha = ['data' => self::dataIso($dims[0]), 'sessoes' => (int)$s, 'usuarios' => (int)$u, 'novos_usuarios' => (int)$n, 'sessoes_engajadas' => (int)$se, 'visualizacoes' => (int)$pv,
                    'eventos' => (int)$ev, 'conversoes' => (int)$ke, 'taxa_conversao' => self::pct($ke, $s, 3), 'receita' => round($rec, 2)];
                if ($rangeIdx === 'date_range_1') { $ant[] = $linha; } else { $cur[] = $linha; }
            }
            usort($cur, static fn ($a, $b) => strcmp($a['data'], $b['data'])); usort($ant, static fn ($a, $b) => strcmp($a['data'], $b['data']));
            return ['cur' => $cur, 'ant' => $ant];
        });
    }

    private static function soma(array $serie, string $c): float { return (float)array_sum(array_column($serie, $c)); }

    public function overview(array $f): array
    {
        $s = $this->serieDupla($f); $cur = $s['cur']; $ant = $s['ant'];
        $kpi = static function (string $chave, string $rotulo, float $v, float $a, string $un, array $spark) {
            return ['chave' => $chave, 'rotulo' => $rotulo, 'valor' => $v, 'unidade' => $un, 'anterior' => $a, 'variacao_pct' => $a > 0 ? round(($v - $a) / $a * 100, 1) : null, 'maior_melhor' => true, 'sparkline' => $spark];
        };
        $col = static fn (string $c) => array_map(static fn ($x) => $x[$c], $cur);
        $sx = self::soma($cur, 'sessoes'); $sa = self::soma($ant, 'sessoes');
        $kpis = [
            $kpi('usuarios', 'Usuários', self::soma($cur, 'usuarios'), self::soma($ant, 'usuarios'), 'int', $col('usuarios')),
            $kpi('novos_usuarios', 'Novos usuários', self::soma($cur, 'novos_usuarios'), self::soma($ant, 'novos_usuarios'), 'int', $col('novos_usuarios')),
            $kpi('sessoes', 'Sessões', $sx, $sa, 'int', $col('sessoes')),
            $kpi('sessoes_engajadas', 'Sessões engajadas', self::soma($cur, 'sessoes_engajadas'), self::soma($ant, 'sessoes_engajadas'), 'int', $col('sessoes_engajadas')),
            $kpi('taxa_engajamento', 'Taxa de engajamento', self::pct(self::soma($cur, 'sessoes_engajadas'), $sx, 1), self::pct(self::soma($ant, 'sessoes_engajadas'), $sa, 1), 'pct', []),
            $kpi('visualizacoes', 'Visualizações', self::soma($cur, 'visualizacoes'), self::soma($ant, 'visualizacoes'), 'int', $col('visualizacoes')),
            $kpi('eventos', 'Eventos', self::soma($cur, 'eventos'), self::soma($ant, 'eventos'), 'int', $col('eventos')),
            $kpi('conversoes', 'Eventos importantes', self::soma($cur, 'conversoes'), self::soma($ant, 'conversoes'), 'int', $col('conversoes')),
            $kpi('taxa_conversao', 'Taxa de conversão', self::pct(self::soma($cur, 'conversoes'), $sx, 2), self::pct(self::soma($ant, 'conversoes'), $sa, 2), 'pct', []),
            $kpi('receita', 'Receita', self::soma($cur, 'receita'), self::soma($ant, 'receita'), 'currency', $col('receita')),
        ];
        return ['kpis' => $kpis, 'serie' => $cur, 'serie_anterior' => $ant, 'atencao' => $this->atencao($cur, $ant), 'meta' => $this->proc('core', $cur === [])];
    }

    /** "Exige atenção": quedas > 15 % contra o período anterior (limiar), mesmas chaves do mock. */
    private function atencao(array $cur, array $ant): array
    {
        $out = [];
        foreach ([['sessoes', 'Sessões', 'aquisicao'], ['conversoes', 'Eventos importantes', 'conversoes'], ['usuarios', 'Usuários', 'visao-geral']] as [$c, $nome, $tela]) {
            $v = self::soma($cur, $c); $a = self::soma($ant, $c);
            if ($a >= 20 && $v < $a * 0.85) {
                $q = round(($a - $v) / $a * 100);
                $out[] = ['severidade' => $q >= 30 ? 'alta' : 'media', 'metrica' => $c, 'titulo' => "$nome caíram {$q}% contra o período anterior", 'impacto' => 'Menos ' . strtolower($nome) . ' no período selecionado.',
                    'causa' => 'Ver Aquisição por canal e as campanhas do período.', 'recomendacao' => 'Comparar canais e páginas de entrada com o período anterior.', 'tela' => $tela];
            }
        }
        return $out;
    }

    // ── Tempo real ──────────────────────────────────────────────────────
    public function tempoReal(array $f): array
    {
        return $this->cache('tempoReal', 'realtime', [], function (): array {
            $tot = $this->g->runRealtimeReport(['metrics' => self::d(['activeUsers']), 'minuteRanges' => [['name' => '30', 'startMinutesAgo' => 29, 'endMinutesAgo' => 0], ['name' => '5', 'startMinutesAgo' => 4, 'endMinutesAgo' => 0]]]);
            $porRange = [];
            foreach ($tot['rows'] ?? [] as $row) { $porRange[(string)($row['dimensionValues'][0]['value'] ?? '30')] = (int)($row['metricValues'][0]['value'] ?? 0); }
            $min = GaGoogleClient::linhas($this->g->runRealtimeReport(['dimensions' => self::d(['minutesAgo']), 'metrics' => self::d(['activeUsers']), 'limit' => 30]));
            $porMin = array_fill(0, 30, 0); foreach ($min as [$m, $u]) { $i = (int)$m; if ($i >= 0 && $i < 30) { $porMin[$i] = (int)$u; } }
            $pag = GaGoogleClient::linhas($this->g->runRealtimeReport(['dimensions' => self::d(['unifiedScreenName']), 'metrics' => self::d(['activeUsers']), 'limit' => 8]));
            $dev = GaGoogleClient::linhas($this->g->runRealtimeReport(['dimensions' => self::d(['deviceCategory']), 'metrics' => self::d(['activeUsers']), 'limit' => 5]));
            $reg = GaGoogleClient::linhas($this->g->runRealtimeReport(['dimensions' => self::d(['region']), 'metrics' => self::d(['activeUsers']), 'limit' => 8]));
            $evs = GaGoogleClient::linhas($this->g->runRealtimeReport(['dimensions' => self::d(['eventName']), 'metrics' => self::d(['eventCount']), 'limit' => 12]));
            $imp = $this->eventosImportantesSeguros();
            return [
                'ativos_agora' => $porMin[0] ?: ($porRange['5'] ?? 0), 'ativos_5min' => $porRange['5'] ?? array_sum(array_slice($porMin, 0, 5)), 'ativos_30min' => $porRange['30'] ?? array_sum($porMin),
                'por_minuto' => array_map(static fn ($i) => ['minuto' => -$i, 'usuarios' => $porMin[$i]], range(29, 0)),
                'por_canal' => [],
                'por_pagina' => array_map(static fn ($l) => ['path' => null, 'titulo' => $l[0], 'usuarios' => (int)$l[1]], $pag),
                'por_dispositivo' => array_map(static fn ($l) => ['dispositivo' => $l[0], 'usuarios' => (int)$l[1]], $dev),
                'por_regiao' => array_map(fn ($l) => ['uf' => self::UF[$l[0]] ?? null, 'regiao' => $l[0], 'usuarios' => (int)$l[1]], $reg),
                'eventos_recentes' => array_map(static fn ($l) => ['evento' => $l[0], 'quando' => null, 'importante' => in_array($l[0], $imp, true), 'contagem' => (int)$l[1]], $evs),
                'meta' => $this->proc('realtime', true, ['observacao' => 'Tempo real da Data API: canal de aquisição não existe nesta API; "eventos recentes" são as contagens dos últimos 30 minutos.']),
            ];
        });
    }

    private function eventosImportantesSeguros(): array { try { return $this->eventosImportantes(); } catch (GaIndisponivel $e) { return ['generate_lead']; } }

    // ── Aquisição ───────────────────────────────────────────────────────
    public function aquisicao(array $f): array
    {
        return $this->cache('aquisicao', 'core', [$f['inicio'], $f['fim'], $f['limite']], function () use ($f): array {
            $can = GaGoogleClient::linhas($this->g->runReport(['dateRanges' => [self::faixa($f)], 'dimensions' => self::d(['sessionDefaultChannelGroup']), 'metrics' => self::d(['totalUsers', 'sessions', 'keyEvents', 'totalRevenue']),
                'orderBys' => [['metric' => ['metricName' => 'sessions'], 'desc' => true]], 'limit' => 20]));
            $camp = GaGoogleClient::linhas($this->g->runReport(['dateRanges' => [self::faixa($f)], 'dimensions' => self::d(['sessionCampaignName', 'sessionDefaultChannelGroup', 'sessionSource', 'sessionMedium']),
                'metrics' => self::d(['totalUsers', 'sessions', 'engagedSessions', 'keyEvents', 'totalRevenue']), 'orderBys' => [['metric' => ['metricName' => 'sessions'], 'desc' => true]], 'limit' => min(100, (int)$f['limite'])]));
            $porCanal = array_map(static fn ($l) => ['canal' => $l[0], 'usuarios' => (int)$l[1], 'sessoes' => (int)$l[2], 'conversoes' => (int)$l[3], 'receita' => round((float)$l[4], 2), 'custo' => null,
                'taxa_conversao' => self::pct((float)$l[3], (float)$l[2]), 'cpa' => null], $can);
            $campanhas = array_map(static fn ($l) => ['campanha' => $l[0], 'canal' => $l[1], 'origem' => $l[2], 'midia' => $l[3], 'usuarios' => (int)$l[4], 'sessoes' => (int)$l[5], 'sessoes_engajadas' => (int)$l[6],
                'taxa_engajamento' => self::pct((float)$l[6], (float)$l[5], 1), 'conversoes' => (int)$l[7], 'taxa_conversao' => self::pct((float)$l[7], (float)$l[5]), 'receita' => round((float)$l[8], 2),
                'custo' => null, 'custo_fonte' => 'indisponivel', 'cpa' => null, 'roas' => null, 'utm_ok' => !in_array($l[0], ['(not set)', '(direct)', '(organic)', '(referral)'], true) || $l[3] === 'organic' || $l[3] === '(none)'], $camp);
            $diag = [];
            foreach ($campanhas as $c) {
                if ($c['campanha'] === '(not set)' && $c['sessoes'] >= 20) { $diag[] = ['severidade' => 'media', 'campanha' => $c['campanha'], 'problema' => 'Tráfego pago/marcado sem nome de campanha', 'detalhe' => "{$c['origem']} / {$c['midia']}", 'sessoes' => $c['sessoes']]; }
            }
            return ['por_canal' => $porCanal, 'campanhas' => $campanhas, 'diagnosticos' => $diag, 'meta' => $this->proc('core', false, ['nota_custo' => 'Custo de mídia não vem do GA4 (depende do módulo de Ads).'])];
        });
    }

    public function fluxoAquisicao(array $f): array
    {
        return $this->cache('fluxo', 'core', [$f['inicio'], $f['fim']], function () use ($f): array {
            $l = GaGoogleClient::linhas($this->g->runReport(['dateRanges' => [self::faixa($f)], 'dimensions' => self::d(['sessionDefaultChannelGroup', 'sessionSourceMedium', 'landingPage']),
                'metrics' => self::d(['sessions', 'keyEvents']), 'orderBys' => [['metric' => ['metricName' => 'sessions'], 'desc' => true]], 'limit' => 40]));
            $nos = []; $links = [];
            $no = static function (string $camada, string $nome) use (&$nos): string { $id = $camada . ':' . $nome; $nos[$id] ??= ['id' => $id, 'nome' => $nome, 'camada' => $camada, 'valor' => 0]; return $id; };
            foreach ($l as [$canal, $om, $land, $s, $k]) {
                $a = $no('canal', $canal); $b = $no('origem_midia', $om); $c = $no('landing', $land); $d = $no('conversao', $k > 0 ? 'Converteu' : 'Não converteu');
                $nos[$a]['valor'] += $s; $nos[$b]['valor'] += $s; $nos[$c]['valor'] += $s; $nos[$d]['valor'] += $s;
                foreach ([[$a, $b], [$b, $c], [$c, $d]] as [$o, $de]) { $kk = $o . '>' . $de; $links[$kk] = ['origem' => $o, 'destino' => $de, 'valor' => ($links[$kk]['valor'] ?? 0) + (int)$s]; }
            }
            return ['nos' => array_values($nos), 'links' => array_values($links), 'camadas' => [['id' => 'canal', 'rotulo' => 'Canal'], ['id' => 'origem_midia', 'rotulo' => 'Origem / mídia'], ['id' => 'landing', 'rotulo' => 'Página de entrada'], ['id' => 'conversao', 'rotulo' => 'Conversão']],
                'meta' => $this->proc('core', false, ['observacao' => 'Top 40 combinações por sessões.'])];
        });
    }

    // ── Comportamento ───────────────────────────────────────────────────
    public function paginas(array $f): array
    {
        return $this->cache('paginas', 'core', [$f['inicio'], $f['fim'], $f['limite']], function () use ($f): array {
            $p = GaGoogleClient::linhas($this->g->runReport(['dateRanges' => [self::faixa($f)], 'dimensions' => self::d(['pagePath', 'pageTitle']),
                'metrics' => self::d(['screenPageViews', 'totalUsers', 'engagementRate', 'userEngagementDuration', 'keyEvents', 'totalRevenue']), 'orderBys' => [['metric' => ['metricName' => 'screenPageViews'], 'desc' => true]], 'limit' => min(200, (int)$f['limite'])]));
            $lp = GaGoogleClient::linhas($this->g->runReport(['dateRanges' => [self::faixa($f)], 'dimensions' => self::d(['landingPage']),
                'metrics' => self::d(['sessions', 'totalUsers', 'engagementRate', 'averageSessionDuration', 'keyEvents', 'totalRevenue']), 'orderBys' => [['metric' => ['metricName' => 'sessions'], 'desc' => true]], 'limit' => 50]));
            $paginas = array_map(static fn ($l) => ['path' => $l[0], 'titulo' => $l[1], 'tipo' => self::tipoPagina($l[0]), 'visualizacoes' => (int)$l[2], 'usuarios' => (int)$l[3], 'entradas' => null, 'saidas' => null,
                'taxa_engajamento' => round((float)$l[4] * 100, 1), 'tempo_medio_seg' => $l[3] > 0 ? (int)round((float)$l[5] / (float)$l[3]) : 0, 'conversoes' => (int)$l[6], 'receita' => round((float)$l[7], 2), 'e_entrada' => false], $p);
            $maxConv = max(1.0, ...array_map(static fn ($l) => $l[1] > 0 ? (float)$l[4] / (float)$l[1] : 0.0, $lp ?: [[0, 1, 0, 0, 0]]));
            $landings = array_map(static function ($l) use ($maxConv) {
                $eng = (float)$l[3]; $conv = $l[1] > 0 ? (float)$l[5] / (float)$l[1] : 0.0; $tempo = min(1.0, (float)$l[4] / 120.0);
                $score = (int)round(100 * (0.4 * $eng + 0.4 * ($conv / $maxConv) + 0.2 * $tempo));
                return ['path' => $l[0], 'titulo' => null, 'tipo' => self::tipoPagina($l[0]), 'visualizacoes' => null, 'usuarios' => (int)$l[2], 'entradas' => (int)$l[1], 'saidas' => null,
                    'taxa_engajamento' => round($eng * 100, 1), 'tempo_medio_seg' => (int)round((float)$l[4]), 'conversoes' => (int)$l[5], 'receita' => round((float)$l[6], 2), 'e_entrada' => true,
                    'score' => $score, 'score_componentes' => ['engajamento' => round($eng * 100), 'conversao' => round($conv / $maxConv * 100), 'tempo' => round($tempo * 100)]];
            }, $lp);
            usort($landings, static fn ($a, $b) => $b['score'] <=> $a['score']);
            return ['paginas' => $paginas, 'landings' => $landings, 'aviso_score' => 'Score = cálculo interno (40% engajamento, 40% conversão relativa, 20% tempo) — não é métrica do GA4.',
                'meta' => $this->proc('core', false, ['observacao' => 'A Data API não tem entradas/saídas por página; "entradas" vêm das páginas de entrada (sessões).'])];
        });
    }

    // ── Eventos e conversões ────────────────────────────────────────────
    private function eventosBrutos(array $f): array
    {
        return $this->cache('eventos', 'core', [$f['inicio'], $f['fim']], function () use ($f): array {
            $e = GaGoogleClient::linhas($this->g->runReport(['dateRanges' => [self::faixa($f)], 'dimensions' => self::d(['eventName']), 'metrics' => self::d(['eventCount', 'totalUsers', 'eventValue']),
                'orderBys' => [['metric' => ['metricName' => 'eventCount'], 'desc' => true]], 'limit' => 200]));
            $s = GaGoogleClient::linhas($this->g->runReport(['dateRanges' => [self::faixa($f)], 'metrics' => self::d(['sessions'])]));
            return ['eventos' => $e, 'sessoes' => (float)($s[0][0] ?? 0)];
        });
    }

    public function eventos(array $f): array
    {
        $b = $this->eventosBrutos($f); $imp = $this->eventosImportantesSeguros();
        $lista = array_map(static fn ($l) => ['evento' => $l[0], 'classe' => self::classe($l[0]), 'importante' => in_array($l[0], $imp, true), 'contagem' => (int)$l[1], 'usuarios' => (int)$l[2],
            'por_sessao' => $b['sessoes'] > 0 ? round((float)$l[1] / $b['sessoes'], 3) : null, 'primeira_ocorrencia' => null, 'ultima_ocorrencia' => null, 'diagnosticos' => self::diagnosticosEvento($l[0])], $b['eventos']);
        $vistos = array_column($lista, 'evento');
        $aus = array_map(static fn ($e) => ['evento' => $e, 'motivo' => 'Esperado pelo plano de medição e sem registros no período.'], array_values(array_diff(self::ESPERADOS, $vistos)));
        return ['eventos' => $lista, 'ausentes' => $aus, 'meta' => $this->proc('core', false, ['observacao' => 'Primeira/última ocorrência não existem na Data API.'])];
    }

    public function conversoes(array $f): array
    {
        $ev = $this->eventos($f); $b = $this->eventosBrutos($f);
        $valores = []; foreach ($b['eventos'] as $l) { $valores[$l[0]] = round((float)$l[3], 2); }
        $imp = array_values(array_filter($ev['eventos'], static fn ($e) => $e['importante']));
        $imp = array_map(static fn ($e) => $e + ['taxa' => $b['sessoes'] > 0 ? self::pct((float)$e['contagem'], $b['sessoes']) : null, 'valor' => $valores[$e['evento']] ?? 0.0], $imp);
        $ga = 0; foreach ($ev['eventos'] as $e) { if ($e['evento'] === 'generate_lead') { $ga = $e['contagem']; } }
        $crm = GaCrm::leads($f['inicio'], $f['fim']);
        $comparavel = ($crm['disponivel'] ?? false) === true;
        $dif = $comparavel ? (int)$crm['total'] - $ga : null;
        return ['importantes' => $imp, 'conciliacao_crm' => [
            'ga4_generate_lead' => $ga, 'ga4_fonte' => 'ga4-data-api', 'crm_leads' => $crm['total'] ?? null, 'crm_fonte' => $crm['fonte'] ?? 'pipedrive', 'crm' => $crm, 'comparavel' => $comparavel,
            'motivo_nao_comparavel' => $comparavel ? null : ($crm['motivo'] ?? 'CRM indisponível'), 'diferenca' => $dif, 'diferenca_pct' => $comparavel && $ga > 0 ? round($dif / $ga * 100, 1) : null,
            'status' => !$comparavel ? 'indisponivel' : (abs((float)$dif) <= max(2, $ga * 0.1) ? 'ok' : 'divergente'),
            'motivos_possiveis' => ['Leads criados à mão no CRM (sem formulário)', 'Bloqueio de cookies/consentimento no site', 'Envio duplicado do formulário', 'Fuso: o GA4 usa o fuso da propriedade', 'Leads vindos de API/integração'],
            'aviso' => 'Comparação entre fontes diferentes: diferença pequena é esperada.'], 'meta' => $this->proc('core')];
    }

    public function funil(array $f): array
    {
        return $this->cache('funil', 'funnel', [$f['inicio'], $f['fim']], function () use ($f): array {
            $passos = [['Sessão', 'session_start'], ['Viu landing page', 'page_view'], ['Rolou 50% da página', 'scrool_50'], ['Iniciou formulário', 'iniciou_formulario'], ['Enviou (lead)', 'generate_lead']];
            $corpo = ['dateRanges' => [self::faixa($f)], 'funnel' => ['isOpenFunnel' => false, 'steps' => array_map(static fn ($p) => ['name' => $p[0], 'filterExpression' => ['funnelEventFilter' => ['eventName' => $p[1]]]], $passos)]];
            $r = $this->g->runFunnelReport($corpo);
            $usuarios = [];
            foreach ($r['funnelTable']['rows'] ?? [] as $row) {
                $nome = (string)($row['dimensionValues'][0]['value'] ?? '');
                $usuarios[preg_replace('/^\d+\.\s*/', '', $nome)] = (int)($row['metricValues'][0]['value'] ?? 0);
            }
            $crm = GaCrm::leads($f['inicio'], $f['fim']);
            $etapas = []; $topo = null; $ant = null;
            foreach ($passos as [$nome, $evento]) {
                $u = $usuarios[$nome] ?? 0; $topo ??= $u;
                $etapas[] = ['etapa' => $nome, 'evento' => $evento, 'usuarios' => $u, 'taxa_da_anterior' => $ant ? self::pct($u, $ant, 1) : 100.0, 'abandono' => $ant !== null ? max(0, $ant - $u) : 0,
                    'taxa_do_topo' => $topo ? self::pct($u, $topo, 1) : 0.0, 'tempo_medio_seg' => null];
                $ant = $u;
            }
            $lead = ($crm['disponivel'] ?? false) ? (int)$crm['total'] : null;
            $etapas[] = ['etapa' => 'Lead no CRM', 'evento' => '(Pipedrive)', 'usuarios' => $lead, 'taxa_da_anterior' => $lead !== null && $ant ? self::pct($lead, $ant, 1) : null, 'abandono' => null,
                'taxa_do_topo' => $lead !== null && $topo ? self::pct($lead, $topo, 1) : null, 'tempo_medio_seg' => null];
            return ['funis_disponiveis' => [['id' => 'lead', 'nome' => 'Funil de lead', 'disponivel' => true, 'motivo' => null], ['id' => 'ecommerce', 'nome' => 'Funil de e-commerce', 'disponivel' => false, 'motivo' => 'Sem eventos de e-commerce.'],
                ['id' => 'comercial', 'nome' => 'Funil comercial', 'disponivel' => false, 'motivo' => 'Depende de ERP/Financeiro.']], 'funil_ativo' => 'lead', 'etapas' => $etapas,
                'meta' => $this->proc('funnel', false, ['observacao' => 'Funil fechado da Data API v1alpha; tempo entre etapas não é exposto.'])];
        });
    }

    public function jornada(array $f): array
    {
        $p = $this->paginas($f);
        $inicios = array_map(static fn ($l) => ['path' => $l['path'], 'titulo' => $l['titulo']], array_slice($p['landings'], 0, 9));
        $raiz = $f['pagina'] ?? ($inicios[0]['path'] ?? '/');
        $u = 0; foreach ($p['landings'] as $l) { if ($l['path'] === $raiz) { $u = (int)$l['usuarios']; } }
        return ['inicio' => $raiz, 'inicios_disponiveis' => $inicios, 'arvore' => ['id' => 'raiz', 'nome' => $raiz, 'titulo' => null, 'tipo' => self::tipoPagina($raiz), 'usuarios' => $u, 'converteu' => false, 'filhos' => []],
            'meta' => $this->proc('core', true, ['observacao' => 'Caminhos página a página exigem exportação do GA4 para o BigQuery; a Data API só entrega a página de entrada.'])];
    }

    public function ecommerce(array $f): array
    {
        $b = $this->eventosBrutos($f); $vistos = array_column($b['eventos'], 0);
        $tem = array_values(array_intersect(self::ECOMMERCE, $vistos));
        if ($tem === []) {
            return ['instrumentado' => false, 'motivo' => 'Nenhum evento de e-commerce do GA4 foi recebido no período.', 'eventos_necessarios' => self::ECOMMERCE,
                'acao_sugerida' => 'Instrumentar a loja com os eventos recomendados de e-commerce do GA4.', 'como_demonstrar' => null, 'kpis' => [], 'produtos' => [], 'checkout' => [], 'meta' => $this->proc('core')];
        }
        $prod = GaGoogleClient::linhas($this->g->runReport(['dateRanges' => [self::faixa($f)], 'dimensions' => self::d(['itemName']), 'metrics' => self::d(['itemsViewed', 'itemsAddedToCart', 'itemsPurchased', 'itemRevenue']), 'limit' => 50]));
        $cont = []; foreach ($b['eventos'] as $l) { $cont[$l[0]] = (int)$l[1]; }
        return ['instrumentado' => true, 'motivo' => null, 'eventos_necessarios' => array_values(array_diff(self::ECOMMERCE, $tem)), 'acao_sugerida' => null, 'como_demonstrar' => null,
            'kpis' => [['chave' => 'compras', 'rotulo' => 'Compras', 'valor' => $cont['purchase'] ?? 0, 'unidade' => 'int'], ['chave' => 'receita', 'rotulo' => 'Receita de itens', 'valor' => round(array_sum(array_column($prod, 4)), 2), 'unidade' => 'currency']],
            'produtos' => array_map(static fn ($l) => ['produto' => $l[0], 'visualizacoes' => (int)$l[1], 'carrinho' => (int)$l[2], 'compras' => (int)$l[3], 'receita' => round((float)$l[4], 2)], $prod),
            'checkout' => array_map(static fn ($e) => ['etapa' => $e, 'eventos' => $cont[$e] ?? 0], ['view_item', 'add_to_cart', 'begin_checkout', 'add_payment_info', 'purchase']), 'meta' => $this->proc('core')];
    }

    // ── Usuários ────────────────────────────────────────────────────────
    public function usuarios(array $f): array
    {
        return $this->cache('usuarios', 'core', [$f['inicio'], $f['fim']], function () use ($f): array {
            $t = GaGoogleClient::linhas($this->g->runReport(['dateRanges' => [self::faixa($f)], 'metrics' => self::d(['totalUsers', 'newUsers'])]));
            $tot = (int)($t[0][0] ?? 0); $novos = (int)($t[0][1] ?? 0);
            $dev = GaGoogleClient::linhas($this->g->runReport(['dateRanges' => [self::faixa($f)], 'dimensions' => self::d(['deviceCategory']), 'metrics' => self::d(['totalUsers', 'keyEvents', 'sessions', 'engagementRate'])]));
            $reg = GaGoogleClient::linhas($this->g->runReport(['dateRanges' => [self::faixa($f)], 'dimensions' => self::d(['region']), 'metrics' => self::d(['totalUsers', 'keyEvents', 'sessions']),
                'dimensionFilter' => ['filter' => ['fieldName' => 'country', 'stringFilter' => ['value' => 'Brazil']]], 'orderBys' => [['metric' => ['metricName' => 'totalUsers'], 'desc' => true]], 'limit' => 27]));
            $coortes = [];
            try {
                $fim = new DateTimeImmutable($f['fim']);
                $cohorts = [];
                for ($i = 7; $i >= 0; $i--) { $ini = $fim->modify('-' . ($i * 7 + 6) . ' days'); $cohorts[] = ['name' => 'S' . (8 - $i), 'dimension' => 'firstSessionDate', 'dateRange' => ['startDate' => $ini->format('Y-m-d'), 'endDate' => $ini->modify('+6 days')->format('Y-m-d')]]; }
                $c = GaGoogleClient::linhas($this->g->runReport(['dimensions' => self::d(['cohort', 'cohortNthWeek']), 'metrics' => self::d(['cohortActiveUsers']),
                    'cohortSpec' => ['cohorts' => $cohorts, 'cohortsRange' => ['granularity' => 'WEEKLY', 'startOffset' => 0, 'endOffset' => 7]]]));
                $mapa = []; foreach ($c as [$nome, $n, $u]) { $mapa[$nome][(int)$n] = (int)$u; }
                foreach ($cohorts as $co) { $semanas = []; $base = $mapa[$co['name']][0] ?? 0; for ($w = 0; $w < 8; $w++) { $semanas[] = $base > 0 && isset($mapa[$co['name']][$w]) ? self::pct($mapa[$co['name']][$w], $base, 1) : null; }
                    $coortes[] = ['coorte' => $co['dateRange']['startDate'], 'tamanho' => $base, 'semanas' => $semanas]; }
            } catch (GaIndisponivel $e) { $coortes = []; }
            return ['kpis' => [['chave' => 'usuarios', 'rotulo' => 'Usuários', 'valor' => $tot, 'unidade' => 'int'], ['chave' => 'novos', 'rotulo' => 'Novos', 'valor' => $novos, 'unidade' => 'int'],
                ['chave' => 'recorrentes', 'rotulo' => 'Recorrentes', 'valor' => max(0, $tot - $novos), 'unidade' => 'int']],
                'por_dispositivo' => array_map(static fn ($l) => ['dispositivo' => $l[0], 'usuarios' => (int)$l[1], 'conversoes' => (int)$l[2], 'taxa_conversao' => self::pct((float)$l[2], (float)$l[3]), 'taxa_engajamento' => round((float)$l[4] * 100, 1)], $dev),
                'por_regiao' => array_map(static fn ($l) => ['uf' => self::UF[$l[0]] ?? null, 'regiao' => $l[0], 'usuarios' => (int)$l[1], 'conversoes' => (int)$l[2], 'taxa_conversao' => self::pct((float)$l[2], (float)$l[3])], $reg),
                'coortes' => $coortes, 'aviso_privacidade' => 'Dados agregados do GA4 (limiares de privacidade do Google podem ocultar linhas pequenas).', 'meta' => $this->proc('core', $coortes === [])];
        });
    }

    // ── Qualidade, alertas e insights ───────────────────────────────────
    public function qualidade(array $f): array
    {
        $base = (new GaMock())->qualidade($f);   // achados da Fase 0 e tagging = fatos do container (não dependem do provedor)
        $ev = $this->eventos($f);
        $streams = 0; try { $streams = count($this->g->dataStreams()['dataStreams'] ?? []); } catch (GaIndisponivel $e) { /* conta só os eventos */ }
        $comAviso = count(array_filter($ev['eventos'], static fn ($e) => $e['diagnosticos'] !== []));
        return ['resumo' => ['streams_ativos' => $streams, 'eventos_recebidos' => count($ev['eventos']), 'eventos_ausentes' => count($ev['ausentes']), 'eventos_com_aviso' => $comAviso, 'achados_abertos' => count($base['achados'] ?? [])],
            'achados' => $base['achados'] ?? [], 'tagging' => $base['tagging'] ?? [], 'meta' => $this->proc('core', false, ['origem_achados' => 'Auditoria do container (Fase 0), fixa no código.'])];
    }

    public function alertas(array $f): array
    {
        $o = $this->overview($f);
        $regras = (new GaMock())->alertas($f)['regras'] ?? [];
        $agora = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z');
        $al = array_map(static fn ($a, $i) => $a + ['id' => 'ga-' . $a['metrica'] . '-' . $i, 'quando' => $agora, 'estado' => 'aberto', 'confianca' => 'media'], $o['atencao'], array_keys($o['atencao']));
        return ['alertas' => $al, 'regras' => $regras, 'meta' => $this->proc('core')];
    }

    public function insights(array $f): array
    {
        $o = $this->overview($f); $serie = $o['serie'];
        $ins = []; $metodo = [];
        if (count($serie) >= 7) {
            foreach ([['sessoes', 'Sessões'], ['conversoes', 'Eventos importantes']] as [$c, $nome]) {
                $v = array_map(static fn ($x) => (float)$x[$c], $serie); $ult = array_pop($v); $n = count($v);
                $media = array_sum($v) / $n; $dp = sqrt(array_sum(array_map(static fn ($x) => ($x - $media) ** 2, $v)) / max(1, $n - 1));
                if ($dp > 0 && abs(($ult - $media) / $dp) >= 2.5) {
                    $z = round(($ult - $media) / $dp, 1);
                    $ins[] = ['id' => 'z-' . $c, 'tipo' => 'anomalia', 'severidade' => abs($z) >= 3.5 ? 'alta' : 'media', 'conclusao' => "$nome do último dia " . ($z < 0 ? 'abaixo' : 'acima') . ' do normal',
                        'evidencia' => sprintf('z = %s (média %.0f, desvio %.0f, último %d)', $z, $media, $dp, (int)$ult), 'periodo' => end($serie)['data'], 'impacto' => null, 'causa' => null,
                        'recomendacao' => 'Conferir canais e páginas do dia.', 'confianca' => $n >= 21 ? 'alta' : 'media', 'tela' => 'visao-geral'];
                }
            }
            $metodo[] = ['regra' => 'Anomalia (z-score)', 'como' => '|z| ≥ 2,5 do último dia contra os anteriores do período; mínimo de 7 dias.'];
            $y = array_map(static fn ($x) => (float)$x['sessoes'], $serie); $n = count($y); $xm = ($n - 1) / 2; $ym = array_sum($y) / $n;
            $num = 0.0; $den = 0.0; foreach ($y as $i => $yy) { $num += ($i - $xm) * ($yy - $ym); $den += ($i - $xm) ** 2; }
            $incl = $den > 0 ? $num / $den : 0.0;
            if ($ym > 0 && abs($incl * $n / $ym) >= 0.2) {
                $ins[] = ['id' => 'tendencia-sessoes', 'tipo' => 'tendencia', 'severidade' => $incl < 0 ? 'media' : 'baixa', 'conclusao' => 'Sessões em ' . ($incl < 0 ? 'queda' : 'alta') . ' no período',
                    'evidencia' => sprintf('inclinação %.1f sessões/dia (%.0f%% do nível médio no período)', $incl, $incl * $n / $ym * 100), 'periodo' => $f['inicio'] . '–' . $f['fim'], 'impacto' => null, 'causa' => null,
                    'recomendacao' => 'Ver Aquisição por canal.', 'confianca' => 'media', 'tela' => 'aquisicao'];
            }
            $metodo[] = ['regra' => 'Tendência (regressão linear)', 'como' => 'Variação acumulada ≥ 20 % do nível médio.'];
        }
        $p = $this->paginas($f);
        foreach (array_slice($p['landings'], 0, 20) as $l) {
            if (($l['entradas'] ?? 0) >= 200 && $l['conversoes'] === 0) {
                $ins[] = ['id' => 'landing-' . substr(md5($l['path']), 0, 8), 'tipo' => 'oportunidade', 'severidade' => 'media', 'conclusao' => "Página de entrada sem conversão: {$l['path']}",
                    'evidencia' => "{$l['entradas']} entradas e 0 eventos importantes", 'periodo' => $f['inicio'] . '–' . $f['fim'], 'impacto' => null, 'causa' => null, 'recomendacao' => 'Revisar chamada para ação da página.', 'confianca' => 'alta', 'tela' => 'paginas'];
            }
        }
        $metodo[] = ['regra' => 'Página de entrada sem conversão', 'como' => '≥ 200 entradas e nenhum evento importante.'];
        return ['insights' => $ins, 'metodo' => $metodo, 'meta' => $this->proc('core')];
    }
}
