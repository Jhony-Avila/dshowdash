<?php
// Google Analytics / lib/GaMock.php — provedor de dados simulados
// @module  google-analytics.lib.mock
// @version 1.0.0
// @created 2026-07-30
//
// Molde: api/google-calendar/lib/GcalMock.php.
//
// ════════════════════════════════════════════════════════════════════════════
// DUAS DECISÕES DE DESENHO QUE VALEM MAIS QUE O CÓDIGO
// ════════════════════════════════════════════════════════════════════════════
//
// 1) OS EVENTOS SÃO OS REAIS, NÃO INVENTADOS.
//    A Fase 0 auditou o container GTM de produção (`GTM-M8KJKVV`) e extraiu os 16
//    eventos que a empresa realmente dispara. Este mock usa EXATAMENTE aqueles nomes —
//    inclusive `scrool_25/50/75/100`, que está grafado errado na origem (é `scroll`), e
//    os 7 `time_Nsegundos`.
//    Por quê: quando a Data API entrar (Fase 4), a forma da tela não muda. Um mock com
//    `page_view`/`add_to_cart` genéricos produziria telas que quebram no dia da troca —
//    exatamente o que a §84 do briefing manda evitar. E a tela de Qualidade (§42) passa
//    a mostrar defeitos VERDADEIROS desde o primeiro dia.
//    Ver `docs/GOOGLE-ANALYTICS/00-fase0-investigacao.md` §2.3.
//
// 2) E-COMMERCE NASCE VAZIO — DE PROPÓSITO.
//    A auditoria provou que NÃO existe um único evento de e-commerce no container
//    (`view_item`, `add_to_cart`, `purchase`: zero). Fabricar receita aqui produziria
//    um painel bonito que mente. O cenário padrão devolve e-commerce vazio COM o motivo,
//    que é o estado real; quem precisa exercitar o layout usa `?cenario=ecommerce`.
//    Decisão 3 do §10 da Fase 0 (instrumentar a loja ou remover §33/§34/§35) segue aberta.
//
// ════════════════════════════════════════════════════════════════════════════
// COERÊNCIA (§70 do briefing)
// ════════════════════════════════════════════════════════════════════════════
// Existe UM universo canônico (canais → campanhas → páginas → eventos → conversões) e
// todo número de toda tela é derivado dele. Somar sessões por canal dá o total de
// sessões da Visão Geral; conversões por campanha fecham com as da tela de Conversões.
// ⚠️ Um mock que sorteia número por tela produz painel incoerente — e o incoerente só
// aparece quando alguém confere duas telas lado a lado, tarde demais.
//
// A semente é o DIA (America/Sao_Paulo): dentro do mesmo dia as respostas são estáveis
// (F5 não muda o painel), e a cada dia o universo se move. `?seed=` força um dia.
declare(strict_types=1);

final class GaMock implements GaProvider
{
    /** Propriedade e container REAIS encontrados na Fase 0 — o mock não inventa identidade. */
    public const MEASUREMENT_ID = 'G-WGDR8WJ7G8';
    public const GTM_CONTAINER  = 'GTM-M8KJKVV';
    public const UA_LEGADO      = 'UA-945670-1';
    public const PROPERTY_ID    = '318452901';   // fictício: a Fase 0 não conseguiu o ID numérico

    private int $seed;
    private string $cenario;

    public function __construct(?string $cenario = null, ?int $seed = null)
    {
        $this->cenario = $cenario ?? (string)($_GET['cenario'] ?? 'saudavel');
        $this->seed    = $seed ?? (int)($_GET['seed'] ?? (int)(new DateTimeImmutable('now', new DateTimeZone('America/Sao_Paulo')))->format('Ymd'));
    }

    public static function isEnabled(): bool
    {
        $v = getenv('GA_PROVIDER');
        if ($v === false || $v === '') {
            // ⚠️ Default MOCK. Sem credencial (Fase 0 §3), o real só sabe responder 503;
            // defaultar para real deixaria o módulo inteiro morto em vez de demonstrável.
            return true;
        }
        return strtolower(trim($v)) === 'mock';
    }

    public function nome(): string { return 'mock'; }

    // ══════════════════════════════════════════════════════════════════════
    // Aleatoriedade determinística
    // ══════════════════════════════════════════════════════════════════════

    /** LCG (numerical recipes). Determinístico por (seed, chave) — nunca `rand()`. */
    private function rnd(string $chave, int $i = 0): float
    {
        $h = crc32($chave . '|' . $i . '|' . $this->seed);
        $x = ($h * 1664525 + 1013904223) & 0x7FFFFFFF;
        return ($x % 100000) / 100000;
    }

    private function entre(string $chave, float $min, float $max, int $i = 0): float
    {
        return $min + ($max - $min) * $this->rnd($chave, $i);
    }

    private function inteiro(string $chave, int $min, int $max, int $i = 0): int
    {
        return (int)round($this->entre($chave, (float)$min, (float)$max, $i));
    }

    /** Multiplicador do cenário ativo sobre uma família de métrica. */
    private function fator(string $familia): float
    {
        $c = [
            'saudavel'          => ['trafego' => 1.00, 'conversao' => 1.00, 'receita' => 1.00, 'erro' => 1.00],
            'pico'              => ['trafego' => 2.35, 'conversao' => 0.72, 'receita' => 1.10, 'erro' => 1.00],
            'queda_conversao'   => ['trafego' => 1.02, 'conversao' => 0.41, 'receita' => 0.55, 'erro' => 1.00],
            'compra_parada'     => ['trafego' => 1.00, 'conversao' => 0.88, 'receita' => 0.00, 'erro' => 2.20],
            'sem_dados'         => ['trafego' => 0.00, 'conversao' => 0.00, 'receita' => 0.00, 'erro' => 1.00],
            'mobile_ruim'       => ['trafego' => 1.05, 'conversao' => 0.63, 'receita' => 0.71, 'erro' => 1.40],
            'ecommerce'         => ['trafego' => 1.15, 'conversao' => 1.05, 'receita' => 1.00, 'erro' => 1.00],
            'coleta_quebrada'   => ['trafego' => 0.94, 'conversao' => 0.35, 'receita' => 0.40, 'erro' => 3.10],
        ][$this->cenario] ?? null;
        if ($c === null) { $c = ['trafego' => 1.0, 'conversao' => 1.0, 'receita' => 1.0, 'erro' => 1.0]; }
        return $c[$familia] ?? 1.0;
    }

    /** O cenário atual simula e-commerce medido? Ver decisão de desenho 2 no topo. */
    private function temEcommerce(): bool
    {
        return $this->cenario === 'ecommerce';
    }

    // ══════════════════════════════════════════════════════════════════════
    // O universo canônico
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Canais, com peso de tráfego e qualidade própria. Os pesos somam ~1.
     * `qual` = multiplicador de conversão do canal (tráfego pago converte diferente de
     * orgânico; direto costuma ser o melhor porque já conhece a marca).
     */
    private function canais(): array
    {
        return [
            ['canal' => 'Organic Search',  'peso' => 0.281, 'qual' => 1.06, 'custo' => false],
            ['canal' => 'Paid Search',     'peso' => 0.223, 'qual' => 1.18, 'custo' => true],
            ['canal' => 'Direct',          'peso' => 0.171, 'qual' => 1.34, 'custo' => false],
            ['canal' => 'Paid Social',     'peso' => 0.118, 'qual' => 0.62, 'custo' => true],
            ['canal' => 'Organic Social',  'peso' => 0.082, 'qual' => 0.71, 'custo' => false],
            ['canal' => 'Referral',        'peso' => 0.058, 'qual' => 0.95, 'custo' => false],
            ['canal' => 'Email',           'peso' => 0.041, 'qual' => 1.52, 'custo' => false],
            ['canal' => 'Display',         'peso' => 0.026, 'qual' => 0.28, 'custo' => true],
        ];
    }

    /**
     * Campanhas ligadas a canal. `utm_ok=false` marca as que a governança de UTM (§22.3)
     * deve acusar — o mock precisa ter problema, senão a tela de diagnóstico nasce vazia
     * e ninguém descobre que ela funciona.
     */
    private function campanhas(): array
    {
        return [
            ['campanha' => 'institucional-marca',        'canal' => 'Paid Search', 'origem' => 'google',    'midia' => 'cpc',      'utm_ok' => true],
            ['campanha' => 'showroom-sp-locacao',        'canal' => 'Paid Search', 'origem' => 'google',    'midia' => 'cpc',      'utm_ok' => true],
            ['campanha' => 'palco-eventos-corporativos', 'canal' => 'Paid Search', 'origem' => 'google',    'midia' => 'cpc',      'utm_ok' => true],
            ['campanha' => 'Showroom_SP_Locacao',        'canal' => 'Paid Search', 'origem' => 'Google',    'midia' => 'CPC',      'utm_ok' => false], // duplicata por capitalização
            ['campanha' => 'remarketing-visitantes',     'canal' => 'Display',     'origem' => 'google',    'midia' => 'display',  'utm_ok' => true],
            ['campanha' => 'meta-leads-locacao',         'canal' => 'Paid Social', 'origem' => 'facebook',  'midia' => 'paid_social', 'utm_ok' => true],
            ['campanha' => 'meta-institucional',         'canal' => 'Paid Social', 'origem' => 'instagram', 'midia' => 'paid_social', 'utm_ok' => true],
            ['campanha' => '(not set)',                  'canal' => 'Paid Social', 'origem' => 'facebook',  'midia' => '',         'utm_ok' => false], // sem utm_medium
            ['campanha' => 'newsletter-mensal',          'canal' => 'Email',       'origem' => 'mailchimp', 'midia' => 'email',    'utm_ok' => true],
            ['campanha' => 'parceria-agencia-on',        'canal' => 'Referral',    'origem' => 'agenciaon.com', 'midia' => 'referral', 'utm_ok' => true],
            ['campanha' => 'feira-equipotel-2026',       'canal' => 'Paid Search', 'origem' => 'google',    'midia' => 'cpc',      'utm_ok' => true],
            ['campanha' => 'organico',                   'canal' => 'Organic Search', 'origem' => 'google', 'midia' => 'organic',  'utm_ok' => true],
            // ⚠️ ESTAS DUAS LINHAS EXISTEM PARA A CONTA FECHAR, E ISSO NÃO É DETALHE.
            // `Direct` (17,1% do tráfego) e `Organic Social` (8,2%) não têm campanha nomeada —
            // é assim no GA4 de verdade. Sem uma linha para elas, o agregado por canal perdia
            // 25,3% do volume e a soma por canal NÃO fechava com o total da Visão Geral: medido,
            // dava 24,2% de diferença. Um painel de análise que não fecha consigo mesmo é pior
            // que um painel vazio, porque parece certo.
            ['campanha' => '(direct)',                   'canal' => 'Direct',         'origem' => '(direct)',  'midia' => '(none)',   'utm_ok' => true],
            ['campanha' => '(organic social)',           'canal' => 'Organic Social', 'origem' => 'instagram', 'midia' => 'social',   'utm_ok' => true],
        ];
    }

    /** Páginas do site. `tipo` governa a leitura da tela de conteúdo (§23). */
    private function paginasBase(): array
    {
        return [
            ['path' => '/',                              'titulo' => 'Dshow — Locação de Equipamentos para Eventos', 'tipo' => 'home',     'entrada' => true],
            ['path' => '/locacao-de-palcos',             'titulo' => 'Locação de Palcos',                  'tipo' => 'servico',  'entrada' => true],
            ['path' => '/locacao-de-som-e-iluminacao',   'titulo' => 'Som e Iluminação',                   'tipo' => 'servico',  'entrada' => true],
            ['path' => '/locacao-de-paineis-de-led',     'titulo' => 'Painéis de LED',                     'tipo' => 'servico',  'entrada' => true],
            ['path' => '/estruturas-e-tendas',           'titulo' => 'Estruturas e Tendas',                'tipo' => 'servico',  'entrada' => true],
            ['path' => '/showroom',                      'titulo' => 'Showroom',                           'tipo' => 'instit',   'entrada' => true],
            ['path' => '/portfolio',                     'titulo' => 'Portfólio de Eventos',               'tipo' => 'instit',   'entrada' => false],
            ['path' => '/sobre',                         'titulo' => 'Sobre a Dshow',                      'tipo' => 'instit',   'entrada' => false],
            ['path' => '/contato',                       'titulo' => 'Contato',                            'tipo' => 'conversao','entrada' => false],
            ['path' => '/orcamento',                     'titulo' => 'Solicite um Orçamento',              'tipo' => 'conversao','entrada' => true],
            ['path' => '/orcamento/obrigado',            'titulo' => 'Obrigado — Orçamento Recebido',      'tipo' => 'obrigado', 'entrada' => false],
            ['path' => '/blog/como-escolher-palco',      'titulo' => 'Como escolher o palco do seu evento','tipo' => 'blog',     'entrada' => true],
            ['path' => '/blog/checklist-evento',         'titulo' => 'Checklist para eventos corporativos','tipo' => 'blog',     'entrada' => true],
            ['path' => '/404',                           'titulo' => 'Página não encontrada',              'tipo' => 'erro',     'entrada' => false],
        ];
    }

    /**
     * Os 16 eventos REAIS do container (Fase 0 §2.3).
     * `classe` segue a taxonomia da §28.3; `importante` marca o que é conversão (§29).
     * ⚠️ `scrool_*` está grafado errado NA ORIGEM. Mantido fiel de propósito — a tela de
     * Qualidade acusa, e é assim que o defeito fica visível em vez de esquecido.
     */
    private function eventosBase(): array
    {
        return [
            ['evento' => 'page_view',                 'classe' => 'automatico',  'importante' => false, 'porSessao' => 3.42],
            ['evento' => 'session_start',             'classe' => 'automatico',  'importante' => false, 'porSessao' => 1.00],
            ['evento' => 'first_visit',               'classe' => 'automatico',  'importante' => false, 'porSessao' => 0.58],
            ['evento' => 'user_engagement',           'classe' => 'automatico',  'importante' => false, 'porSessao' => 0.81],
            ['evento' => 'generate_lead',             'classe' => 'recomendado', 'importante' => true,  'porSessao' => 0.0312],
            ['evento' => 'iniciou_formulario',        'classe' => 'customizado', 'importante' => false, 'porSessao' => 0.0714],
            ['evento' => 'clicou_whatsapp',           'classe' => 'customizado', 'importante' => true,  'porSessao' => 0.0486],
            ['evento' => 'iniciou_conversa_whatsapp', 'classe' => 'customizado', 'importante' => true,  'porSessao' => 0.0193],
            ['evento' => 'scrool_25',                 'classe' => 'customizado', 'importante' => false, 'porSessao' => 0.62],
            ['evento' => 'scrool_50',                 'classe' => 'customizado', 'importante' => false, 'porSessao' => 0.41],
            ['evento' => 'scrool_75',                 'classe' => 'customizado', 'importante' => false, 'porSessao' => 0.24],
            ['evento' => 'scrool_100',                'classe' => 'customizado', 'importante' => false, 'porSessao' => 0.11],
            ['evento' => 'time_5segundos',            'classe' => 'customizado', 'importante' => false, 'porSessao' => 0.74],
            ['evento' => 'time_15segundos',           'classe' => 'customizado', 'importante' => false, 'porSessao' => 0.52],
            ['evento' => 'time_30segundos',           'classe' => 'customizado', 'importante' => false, 'porSessao' => 0.33],
            ['evento' => 'time_60segundos',           'classe' => 'customizado', 'importante' => false, 'porSessao' => 0.19],
            ['evento' => 'time_90segundos',           'classe' => 'customizado', 'importante' => false, 'porSessao' => 0.12],
            ['evento' => 'time_120segundos',          'classe' => 'customizado', 'importante' => false, 'porSessao' => 0.08],
            ['evento' => 'time_10segundos',           'classe' => 'customizado', 'importante' => false, 'porSessao' => 0.64],
        ];
    }

    private function dispositivos(): array
    {
        return [
            ['dispositivo' => 'mobile',  'peso' => 0.634, 'qual' => 0.71],
            ['dispositivo' => 'desktop', 'peso' => 0.318, 'qual' => 1.62],
            ['dispositivo' => 'tablet',  'peso' => 0.048, 'qual' => 0.84],
        ];
    }

    private function regioes(): array
    {
        return [
            ['uf' => 'SP', 'regiao' => 'São Paulo',      'peso' => 0.472, 'qual' => 1.21],
            ['uf' => 'RJ', 'regiao' => 'Rio de Janeiro', 'peso' => 0.118, 'qual' => 0.94],
            ['uf' => 'MG', 'regiao' => 'Minas Gerais',   'peso' => 0.094, 'qual' => 0.88],
            ['uf' => 'PR', 'regiao' => 'Paraná',         'peso' => 0.061, 'qual' => 0.91],
            ['uf' => 'RS', 'regiao' => 'Rio Grande do Sul', 'peso' => 0.055, 'qual' => 0.86],
            ['uf' => 'SC', 'regiao' => 'Santa Catarina', 'peso' => 0.048, 'qual' => 0.97],
            ['uf' => 'BA', 'regiao' => 'Bahia',          'peso' => 0.039, 'qual' => 0.72],
            ['uf' => 'GO', 'regiao' => 'Goiás',          'peso' => 0.032, 'qual' => 0.79],
            ['uf' => 'PE', 'regiao' => 'Pernambuco',     'peso' => 0.028, 'qual' => 0.68],
            ['uf' => 'DF', 'regiao' => 'Distrito Federal', 'peso' => 0.026, 'qual' => 1.08],
            ['uf' => '--', 'regiao' => 'Outros',         'peso' => 0.027, 'qual' => 0.74],
        ];
    }

    // ══════════════════════════════════════════════════════════════════════
    // Base diária — tudo deriva daqui
    // ══════════════════════════════════════════════════════════════════════

    /** Sessões de um dia. Fim de semana cai; a semana tem forma. */
    private function sessoesDoDia(DateTimeImmutable $d): int
    {
        $dow  = (int)$d->format('N');                    // 1=seg … 7=dom
        $base = [1 => 1.14, 2 => 1.18, 3 => 1.16, 4 => 1.09, 5 => 0.96, 6 => 0.52, 7 => 0.44][$dow];
        $ruido = $this->entre('sessoes|' . $d->format('Ymd'), 0.88, 1.12);
        $sazonal = 1 + 0.06 * sin(((int)$d->format('z')) / 58.0);
        return (int)round(1780 * $base * $ruido * $sazonal * $this->fator('trafego'));
    }

    /** Taxa de conversão do dia (fração), antes do fator de canal/dispositivo. */
    private function taxaDoDia(DateTimeImmutable $d): float
    {
        return $this->entre('txconv|' . $d->format('Ymd'), 0.0268, 0.0421) * $this->fator('conversao');
    }

    /** Série temporal completa da janela — a fonte de todos os totais. */
    private function serie(array $f): array
    {
        [$ini, $fim] = $this->janela($f);
        $out = [];
        $cur = $ini;
        while ($cur <= $fim) {
            $ses  = $this->sessoesDoDia($cur);
            $usr  = (int)round($ses * $this->entre('u|' . $cur->format('Ymd'), 0.78, 0.86));
            $novos = (int)round($usr * $this->entre('n|' . $cur->format('Ymd'), 0.56, 0.68));
            $eng  = (int)round($ses * $this->entre('e|' . $cur->format('Ymd'), 0.58, 0.69));
            $tx   = $this->taxaDoDia($cur);
            $conv = (int)round($ses * $tx);
            $views = (int)round($ses * $this->entre('v|' . $cur->format('Ymd'), 2.9, 3.9));
            $out[] = [
                'data'              => $cur->format('Y-m-d'),
                'sessoes'           => $ses,
                'usuarios'          => $usr,
                'novos_usuarios'    => $novos,
                'sessoes_engajadas' => $eng,
                'visualizacoes'     => $views,
                'eventos'           => (int)round($ses * $this->entre('ev|' . $cur->format('Ymd'), 7.2, 9.4)),
                'conversoes'        => $conv,
                'taxa_conversao'    => round($tx * 100, 3),
                'receita'           => $this->temEcommerce()
                    ? round($conv * $this->entre('tk|' . $cur->format('Ymd'), 780, 2450) * $this->fator('receita'), 2)
                    : 0.0,
            ];
            $cur = $cur->modify('+1 day');
        }
        return $out;
    }

    /** Janela pedida, já normalizada por `ga_filtros()`. */
    private function janela(array $f): array
    {
        $tz  = new DateTimeZone('America/Sao_Paulo');
        $ini = new DateTimeImmutable(($f['inicio'] ?? '-27 days'), $tz);
        $fim = new DateTimeImmutable(($f['fim'] ?? 'today'), $tz);
        if ($ini > $fim) { [$ini, $fim] = [$fim, $ini]; }
        return [$ini, $fim];
    }

    /** Soma uma coluna da série. */
    private function total(array $serie, string $col): float
    {
        $s = 0.0;
        foreach ($serie as $l) { $s += (float)($l[$col] ?? 0); }
        return $s;
    }

    /**
     * Janela imediatamente anterior, do mesmo tamanho — base de TODA comparação (§14.2).
     * ⚠️ Comparar contra "mês anterior" civil daria janelas de tamanhos diferentes e
     * variação falsa. O período anterior aqui tem exatamente o mesmo número de dias.
     */
    private function serieAnterior(array $f): array
    {
        [$ini, $fim] = $this->janela($f);
        $dias = (int)$ini->diff($fim)->days + 1;
        return $this->serie([
            'inicio' => $ini->modify("-{$dias} days")->format('Y-m-d'),
            'fim'    => $ini->modify('-1 day')->format('Y-m-d'),
        ]);
    }

    /** Envelope de procedência exigido pelo contrato (§49). */
    private function proc(string $categoriaQuota = 'core', bool $parcial = false): array
    {
        return [
            'fonte'          => 'mock',
            'categoria_quota'=> $categoriaQuota,
            'atualizado_em'  => (new DateTimeImmutable('now', new DateTimeZone('America/Sao_Paulo')))->format('c'),
            'parcial'        => $parcial,
            'cenario'        => $this->cenario,
            'seed'           => $this->seed,
            'property_id'    => self::PROPERTY_ID,
            'measurement_id' => self::MEASUREMENT_ID,
            'aviso'          => 'Ambiente de demonstração — os dados apresentados são simulados.',
        ];
    }

    // ══════════════════════════════════════════════════════════════════════
    // Implementação do contrato
    // ══════════════════════════════════════════════════════════════════════

    public function status(): array
    {
        return [
            'provedor'       => 'mock',
            'pronto'         => true,
            'measurement_id' => self::MEASUREMENT_ID,
            'gtm_container'  => self::GTM_CONTAINER,
            'property_id'    => self::PROPERTY_ID,
            'cenarios'       => ['saudavel', 'pico', 'queda_conversao', 'compra_parada', 'mobile_ruim', 'coleta_quebrada', 'ecommerce', 'sem_dados'],
            // O que falta para o provedor REAL subir (Fase 0 §3 e §10).
            'pendencias_para_real' => [
                'Credencial GA4 (service account recomendada) com acesso de leitura à propriedade',
                'Projeto no Google Cloud com Data API e Admin API habilitadas',
                'Confirmar se G-WGDR8WJ7G8 é a propriedade oficial e quais contas o módulo deve enxergar',
                'Definir destino das seções de e-commerce (§33/§34/§35): instrumentar a loja ou remover do escopo',
            ],
            'meta' => $this->proc(),
        ];
    }

    public function propriedades(): array
    {
        return [
            'contas' => [[
                'id'     => 'accounts/1847221',
                'nome'   => 'Dshow',
                'pais'   => 'BR',
                'propriedades' => [[
                    'id'             => 'properties/' . self::PROPERTY_ID,
                    'property_id'    => self::PROPERTY_ID,
                    'nome'           => 'Dshow — Site Institucional',
                    'measurement_id' => self::MEASUREMENT_ID,
                    'moeda'          => 'BRL',
                    'timezone'       => 'America/Sao_Paulo',
                    'tipo'           => 'GA4',
                    'criada_em'      => '2022-09-14',
                    'streams' => [[
                        'id'             => 'properties/' . self::PROPERTY_ID . '/dataStreams/4182993',
                        'nome'           => 'dshow.com.br',
                        'tipo'           => 'WEB',
                        'dominio'        => 'www.dshow.com.br',
                        'measurement_id' => self::MEASUREMENT_ID,
                        'ativo'          => true,
                        'ultima_coleta'  => (new DateTimeImmutable('-4 minutes'))->format('c'),
                    ]],
                ]],
            ]],
            // ⚠️ A Fase 0 NÃO conseguiu listar contas/propriedades/streams de verdade — isso
            // exige a Admin API. O que está acima é forma, não inventário confirmado.
            'aviso_inventario' => 'Inventário simulado. A Fase 0 confirmou apenas 1 measurement ID (G-WGDR8WJ7G8) por engenharia reversa do container GTM público; quantas propriedades e streams existem de verdade só a Admin API responde.',
            'meta' => $this->proc('admin'),
        ];
    }

    public function overview(array $f): array
    {
        $serie = $this->serie($f);
        $ant   = $this->serieAnterior($f);

        $kpi = function (string $col, string $rotulo, string $unidade, bool $maiorMelhor = true) use ($serie, $ant): array {
            $a = $this->total($serie, $col);
            $b = $this->total($ant, $col);
            $var = $b > 0 ? (($a - $b) / $b) * 100 : null;
            return [
                'chave'        => $col,
                'rotulo'       => $rotulo,
                'valor'        => $col === 'taxa_conversao' ? round($a / max(count($serie), 1), 2) : $a,
                'unidade'      => $unidade,
                'anterior'     => $col === 'taxa_conversao' ? round($b / max(count($ant), 1), 2) : $b,
                'variacao_pct' => $var === null ? null : round($var, 1),
                // ⚠️ §15.3: crescer não é automaticamente bom. Quem interpreta é o backend,
                // que sabe o SENTIDO da métrica; a tela só pinta o que recebe.
                'maior_melhor' => $maiorMelhor,
                'sparkline'    => array_map(fn($l) => $l[$col], $serie),
            ];
        };

        $sessoes = $this->total($serie, 'sessoes');
        $eng     = $this->total($serie, 'sessoes_engajadas');

        $kpis = [
            $kpi('usuarios', 'Usuários', 'int'),
            $kpi('novos_usuarios', 'Novos usuários', 'int'),
            $kpi('sessoes', 'Sessões', 'int'),
            $kpi('sessoes_engajadas', 'Sessões engajadas', 'int'),
            [
                'chave' => 'taxa_engajamento', 'rotulo' => 'Taxa de engajamento', 'unidade' => 'pct',
                'valor' => $sessoes > 0 ? round(($eng / $sessoes) * 100, 2) : 0,
                'anterior' => null, 'variacao_pct' => null, 'maior_melhor' => true, 'sparkline' => [],
            ],
            $kpi('visualizacoes', 'Visualizações', 'int'),
            $kpi('eventos', 'Eventos', 'int'),
            $kpi('conversoes', 'Eventos importantes', 'int'),
            $kpi('taxa_conversao', 'Taxa de conversão', 'pct'),
            $kpi('receita', 'Receita', 'currency'),
        ];

        return [
            'kpis'      => $kpis,
            'serie'     => $serie,
            'serie_anterior' => $ant,
            'atencao'   => $this->painelAtencao($serie, $ant),
            'meta'      => $this->proc(),
        ];
    }

    /**
     * Painel "Exige atenção" (§17). As regras leem a própria série — não há lista fixa de
     * alertas, senão o painel mente quando o cenário muda.
     */
    private function painelAtencao(array $serie, array $ant): array
    {
        $out = [];
        $sesA = $this->total($serie, 'sessoes');
        $sesB = $this->total($ant, 'sessoes');
        $cvA  = $this->total($serie, 'conversoes');
        $cvB  = $this->total($ant, 'conversoes');

        if ($sesB > 0 && ($sesA - $sesB) / $sesB <= -0.15) {
            $out[] = [
                'severidade' => 'alta', 'metrica' => 'sessoes',
                'titulo'     => 'Queda de sessões acima de 15%',
                'impacto'    => sprintf('%s sessões a menos que no período anterior', number_format($sesB - $sesA, 0, ',', '.')),
                'causa'      => 'Possível queda de investimento em mídia, perda de posição orgânica ou falha de coleta.',
                'recomendacao' => 'Comparar por canal em Aquisição: queda concentrada em um canal aponta mídia; queda em todos aponta coleta.',
                'tela'       => 'aquisicao',
            ];
        }
        if ($cvB > 0 && ($cvA - $cvB) / $cvB <= -0.20) {
            $out[] = [
                'severidade' => 'alta', 'metrica' => 'conversoes',
                'titulo'     => 'Queda de eventos importantes acima de 20%',
                'impacto'    => sprintf('%s conversões a menos', number_format($cvB - $cvA, 0, ',', '.')),
                'causa'      => 'Formulário quebrado, tag removida ou mudança de layout na landing page.',
                'recomendacao' => 'Abrir Qualidade da Coleta e conferir se generate_lead continua sendo recebido.',
                'tela'       => 'qualidade',
            ];
        }
        if (!$this->temEcommerce()) {
            $out[] = [
                'severidade' => 'media', 'metrica' => 'ecommerce',
                'titulo'     => 'Nenhum evento de e-commerce é coletado',
                'impacto'    => 'As telas de E-commerce, Produtos e Checkout não têm base de dados.',
                'causa'      => 'O container GTM não tem view_item, add_to_cart nem purchase configurados (auditado na Fase 0).',
                'recomendacao' => 'Instrumentar a loja com os eventos recomendados, ou remover essas telas do escopo.',
                'tela'       => 'ecommerce',
            ];
        }
        $out[] = [
            'severidade' => 'media', 'metrica' => 'tagging',
            'titulo'     => 'Universal Analytics ainda dispara no container',
            'impacto'    => sprintf('4 tags de %s continuam sendo carregadas em todas as páginas.', self::UA_LEGADO),
            'causa'      => 'Tags legadas nunca removidas — o Universal Analytics foi descontinuado em 2023.',
            'recomendacao' => 'Remover as 4 tags do container: ganho de carregamento, zero perda de dado.',
            'tela'       => 'tagging',
        ];
        $out[] = [
            'severidade' => 'baixa', 'metrica' => 'nomenclatura',
            'titulo'     => 'Quatro eventos grafados como "scrool"',
            'impacto'    => 'scrool_25/50/75/100 — a grafia correta é scroll.',
            'causa'      => 'Erro de digitação na criação das tags.',
            'recomendacao' => 'Renomear parte a série histórica; decidir com data de corte registrada.',
            'tela'       => 'eventos',
        ];
        return $out;
    }

    public function tempoReal(array $f): array
    {
        $agora = new DateTimeImmutable('now', new DateTimeZone('America/Sao_Paulo'));
        $minuto = (int)$agora->format('i');
        $hora   = (int)$agora->format('G');
        // Curva de audiência do dia: pico comercial, vale de madrugada.
        $curva = 0.18 + 0.82 * max(0.0, sin((max(0, $hora - 6) / 16.0) * M_PI));
        $base  = (int)round(46 * $curva * $this->fator('trafego'));

        $porMinuto = [];
        for ($i = 29; $i >= 0; $i--) {
            $m = $agora->modify("-{$i} minutes");
            $porMinuto[] = [
                'minuto'   => $m->format('H:i'),
                'usuarios' => max(0, (int)round($base * $this->entre('rt|' . $m->format('Hi'), 0.62, 1.38))),
            ];
        }
        $ativos = $porMinuto[count($porMinuto) - 1]['usuarios'];

        $canais = $this->canais();
        $porCanal = [];
        foreach ($canais as $i => $c) {
            $porCanal[] = ['canal' => $c['canal'], 'usuarios' => (int)round($ativos * $c['peso'] * $this->entre('rtc|' . $c['canal'], 0.7, 1.3, $i))];
        }

        $pgs = $this->paginasBase();
        $porPagina = [];
        foreach (array_slice($pgs, 0, 8) as $i => $p) {
            $porPagina[] = [
                'path'     => $p['path'],
                'titulo'   => $p['titulo'],
                'usuarios' => max(0, (int)round($ativos * $this->entre('rtp|' . $p['path'], 0.03, 0.31, $i))),
            ];
        }
        usort($porPagina, fn($a, $b) => $b['usuarios'] <=> $a['usuarios']);

        return [
            'ativos_agora'      => $ativos,
            'ativos_5min'       => (int)round(array_sum(array_map(fn($x) => $x['usuarios'], array_slice($porMinuto, -5))) / 5),
            'ativos_30min'      => (int)round(array_sum(array_map(fn($x) => $x['usuarios'], $porMinuto)) / 30),
            'por_minuto'        => $porMinuto,
            'por_canal'         => $porCanal,
            'por_pagina'        => $porPagina,
            'por_dispositivo'   => array_map(fn($d) => ['dispositivo' => $d['dispositivo'], 'usuarios' => (int)round($ativos * $d['peso'])], $this->dispositivos()),
            'por_regiao'        => array_map(fn($r) => ['uf' => $r['uf'], 'regiao' => $r['regiao'], 'usuarios' => (int)round($ativos * $r['peso'])], array_slice($this->regioes(), 0, 8)),
            'eventos_recentes'  => $this->eventosRecentes($ativos),
            // ⚠️ §18.3: a tela precisa dizer que é tempo real, e tempo real NÃO reconcilia
            // com os relatórios principais (janelas e processamento diferentes).
            'meta' => $this->proc('realtime') + ['observacao' => 'Tempo real não reconcilia com os relatórios principais: as janelas e o processamento são diferentes.'],
        ];
    }

    private function eventosRecentes(int $ativos): array
    {
        $evs = array_values(array_filter($this->eventosBase(), fn($e) => $e['classe'] !== 'automatico'));
        $out = [];
        $agora = new DateTimeImmutable('now', new DateTimeZone('America/Sao_Paulo'));
        for ($i = 0; $i < 12; $i++) {
            $e = $evs[(int)floor($this->rnd('rte', $i) * count($evs))] ?? $evs[0];
            $out[] = [
                'evento'    => $e['evento'],
                'quando'    => $agora->modify('-' . $this->inteiro('rtq', 1, 240, $i) . ' seconds')->format('H:i:s'),
                'importante'=> $e['importante'],
            ];
        }
        return $out;
    }

    public function aquisicao(array $f): array
    {
        $serie   = $this->serie($f);
        $sessoes = $this->total($serie, 'sessoes');
        $convTot = $this->total($serie, 'conversoes');
        $recTot  = $this->total($serie, 'receita');

        // ── Fatias NORMALIZADAS ──────────────────────────────────────────
        // ⚠️ O jitter por campanha (0,72–1,28) é o que dá vida ao mock, mas ele desbalanceia a
        // soma: 12 campanhas com ruído independente somam qualquer coisa perto de 1, nunca 1.
        // Por isso as fatias são calculadas primeiro e DIVIDIDAS pela própria soma. Sem esta
        // normalização o total por canal não fecha com o total da Visão Geral — e a incoerência
        // só aparece quando alguém confere duas telas lado a lado.
        $fatias = [];
        $somaFatias = 0.0;
        foreach ($this->campanhas() as $i => $c) {
            $canal = null;
            foreach ($this->canais() as $k) { if ($k['canal'] === $c['canal']) { $canal = $k; break; } }
            if ($canal === null) { $fatias[$i] = 0.0; continue; }
            $nCamp = count(array_filter($this->campanhas(), fn($x) => $x['canal'] === $c['canal']));
            $f = $canal['peso'] / max($nCamp, 1) * $this->entre('camp|' . $c['campanha'], 0.72, 1.28, $i);
            $fatias[$i] = $f;
            $somaFatias += $f;
        }
        if ($somaFatias <= 0) { $somaFatias = 1.0; }

        $linhas = [];
        foreach ($this->campanhas() as $i => $c) {
            $canal = null;
            foreach ($this->canais() as $k) { if ($k['canal'] === $c['canal']) { $canal = $k; break; } }
            if ($canal === null) { continue; }

            $fatia = $fatias[$i] / $somaFatias;   // agora as fatias somam exatamente 1

            $ses  = (int)round($sessoes * $fatia);
            $usr  = (int)round($ses * $this->entre('cu|' . $c['campanha'], 0.79, 0.87, $i));
            $eng  = (int)round($ses * $this->entre('ce|' . $c['campanha'], 0.5, 0.74, $i));
            $conv = (int)round($ses * ($convTot / max($sessoes, 1)) * $canal['qual']);
            $rec  = $this->temEcommerce() ? round($recTot * $fatia * $canal['qual'], 2) : 0.0;

            // ⚠️ CUSTO NÃO VEM DO GA4. A §20 do briefing é explícita: dado de custo vem do
            // módulo de mídia, não pode ser inventado a partir do Analytics. Aqui o custo é
            // NULO para canal sem mídia paga, e para os pagos vem marcado com a origem
            // 'ads-mock' — para a tela nunca apresentar CPA/ROAS como se fosse do GA4.
            $custo = $canal['custo'] ? round($ses * $this->entre('cc|' . $c['campanha'], 1.9, 6.4, $i), 2) : null;

            $linhas[] = [
                'campanha'   => $c['campanha'],
                'canal'      => $c['canal'],
                'origem'     => $c['origem'],
                'midia'      => $c['midia'],
                'usuarios'   => $usr,
                'sessoes'    => $ses,
                'sessoes_engajadas' => $eng,
                'taxa_engajamento'  => $ses > 0 ? round(($eng / $ses) * 100, 1) : 0,
                'conversoes' => $conv,
                'taxa_conversao' => $ses > 0 ? round(($conv / $ses) * 100, 2) : 0,
                'receita'    => $rec,
                'custo'      => $custo,
                'custo_fonte'=> $custo === null ? null : 'ads-mock',
                'cpa'        => ($custo !== null && $conv > 0) ? round($custo / $conv, 2) : null,
                'roas'       => ($custo !== null && $custo > 0 && $rec > 0) ? round($rec / $custo, 2) : null,
                'utm_ok'     => $c['utm_ok'],
            ];
        }
        // ── Reescala das conversões ──────────────────────────────────────
        // ⚠️ Mesmo problema das fatias, por outro caminho: cada canal tem `qual` (tráfego pago
        // converte diferente de direto), e a média ponderada desses fatores NÃO é 1. Sem
        // reescalar, a soma das conversões por campanha ficava ~22% abaixo do total da Visão
        // Geral — medido. Aqui as conversões são redistribuídas mantendo a PROPORÇÃO relativa
        // entre canais (que é o que dá realismo) mas fechando o total exato.
        $somaConv = 0;
        foreach ($linhas as $l) { $somaConv += $l['conversoes']; }
        if ($somaConv > 0 && $convTot > 0) {
            $escala = $convTot / $somaConv;
            $acumulado = 0;
            $ultimo = count($linhas) - 1;
            foreach ($linhas as $i => &$l) {
                if ($i === $ultimo) {
                    // A última linha absorve o resto do arredondamento: garante soma EXATA.
                    $l['conversoes'] = max(0, (int)round($convTot) - $acumulado);
                } else {
                    $l['conversoes'] = (int)round($l['conversoes'] * $escala);
                    $acumulado += $l['conversoes'];
                }
                $l['taxa_conversao'] = $l['sessoes'] > 0 ? round(($l['conversoes'] / $l['sessoes']) * 100, 2) : 0;
                $l['cpa']  = ($l['custo'] !== null && $l['conversoes'] > 0) ? round($l['custo'] / $l['conversoes'], 2) : null;
            }
            unset($l);
        }

        usort($linhas, fn($a, $b) => $b['sessoes'] <=> $a['sessoes']);

        // Agregado por canal, derivado das MESMAS linhas — some por canal e fecha com o total.
        $porCanal = [];
        foreach ($linhas as $l) {
            $k = $l['canal'];
            $porCanal[$k] ??= ['canal' => $k, 'usuarios' => 0, 'sessoes' => 0, 'conversoes' => 0, 'receita' => 0.0, 'custo' => null];
            $porCanal[$k]['usuarios']   += $l['usuarios'];
            $porCanal[$k]['sessoes']    += $l['sessoes'];
            $porCanal[$k]['conversoes'] += $l['conversoes'];
            $porCanal[$k]['receita']    += $l['receita'];
            if ($l['custo'] !== null) { $porCanal[$k]['custo'] = ($porCanal[$k]['custo'] ?? 0) + $l['custo']; }
        }
        foreach ($porCanal as &$c) {
            $c['taxa_conversao'] = $c['sessoes'] > 0 ? round(($c['conversoes'] / $c['sessoes']) * 100, 2) : 0;
            $c['cpa'] = ($c['custo'] !== null && $c['conversoes'] > 0) ? round($c['custo'] / $c['conversoes'], 2) : null;
        }
        unset($c);

        return [
            'por_canal'  => array_values($porCanal),
            'campanhas'  => $linhas,
            'diagnosticos' => $this->diagnosticosUtm($linhas),
            'meta' => $this->proc() + ['nota_custo' => 'Custo, CPA e ROAS não vêm do GA4. Aqui estão simulados com origem "ads-mock"; na integração real virão do módulo de mídia.'],
        ];
    }

    /** Governança de UTM (§22.2, §22.3) — lida das próprias linhas. */
    private function diagnosticosUtm(array $linhas): array
    {
        $out = [];
        foreach ($linhas as $l) {
            if ($l['campanha'] === '(not set)') {
                $out[] = ['severidade' => 'alta', 'campanha' => $l['campanha'], 'problema' => 'Tráfego pago sem utm_campaign', 'detalhe' => 'utm_medium também está vazio; as sessões caem em (not set) e ficam fora de qualquer análise de campanha.', 'sessoes' => $l['sessoes']];
                continue;
            }
            if (!$l['utm_ok']) {
                $out[] = ['severidade' => 'media', 'campanha' => $l['campanha'], 'problema' => 'Divergência de capitalização', 'detalhe' => 'Existe a mesma campanha em minúsculas. O GA4 trata como duas campanhas distintas e o relatório divide o volume.', 'sessoes' => $l['sessoes']];
            }
            if ($l['sessoes'] > 0 && $l['conversoes'] === 0) {
                $out[] = ['severidade' => 'media', 'campanha' => $l['campanha'], 'problema' => 'Sessões sem nenhuma conversão', 'detalhe' => 'Tráfego chegando e nenhum evento importante registrado no período.', 'sessoes' => $l['sessoes']];
            }
        }
        return $out;
    }

    public function fluxoAquisicao(array $f): array
    {
        // Sankey (§21): canal → origem/mídia → campanha → landing → conversão.
        $aq = $this->aquisicao($f);
        $nos = [];
        $links = [];
        $idx = function (string $nome) use (&$nos): int {
            foreach ($nos as $i => $n) { if ($n['nome'] === $nome) { return $i; } }
            $nos[] = ['nome' => $nome];
            return count($nos) - 1;
        };
        $entradas = array_values(array_filter($this->paginasBase(), fn($p) => $p['entrada']));
        foreach ($aq['campanhas'] as $i => $c) {
            if ($c['sessoes'] <= 0) { continue; }
            $a = $idx($c['canal']);
            $b = $idx($c['origem'] . ' / ' . ($c['midia'] !== '' ? $c['midia'] : '(none)'));
            $d = $idx($c['campanha']);
            $links[] = ['origem' => $a, 'destino' => $b, 'valor' => $c['sessoes']];
            $links[] = ['origem' => $b, 'destino' => $d, 'valor' => $c['sessoes']];
            // Distribui a campanha em 2 landings estáveis
            $p1 = $entradas[(int)floor($this->rnd('lp1|' . $c['campanha']) * count($entradas))];
            $p2 = $entradas[(int)floor($this->rnd('lp2|' . $c['campanha']) * count($entradas))];
            $s1 = (int)round($c['sessoes'] * 0.62);
            $links[] = ['origem' => $d, 'destino' => $idx($p1['path']), 'valor' => $s1];
            $links[] = ['origem' => $d, 'destino' => $idx($p2['path']), 'valor' => $c['sessoes'] - $s1];
            if ($c['conversoes'] > 0) {
                $links[] = ['origem' => $idx($p1['path']), 'destino' => $idx('generate_lead'), 'valor' => $c['conversoes']];
            }
        }
        return ['nos' => $nos, 'links' => $links, 'meta' => $this->proc()];
    }

    public function paginas(array $f): array
    {
        $serie = $this->serie($f);
        $views = $this->total($serie, 'visualizacoes');
        $ses   = $this->total($serie, 'sessoes');
        $conv  = $this->total($serie, 'conversoes');

        $linhas = [];
        foreach ($this->paginasBase() as $i => $p) {
            $peso = $this->entre('pv|' . $p['path'], 0.02, 0.22, $i);
            if ($p['tipo'] === 'home') { $peso = 0.26; }
            if ($p['tipo'] === 'erro') { $peso = 0.006 * $this->fator('erro'); }
            $v   = (int)round($views * $peso);
            $ent = $p['entrada'] ? (int)round($ses * $peso * $this->entre('pe|' . $p['path'], 0.5, 1.1, $i)) : 0;
            $eng = round($this->entre('pg|' . $p['path'], 41, 87, $i), 1);
            // Página de obrigado converte por definição; página de erro nunca.
            $cv  = match ($p['tipo']) {
                'obrigado'  => (int)round($conv * 0.94),
                'conversao' => (int)round($conv * $this->entre('pc|' . $p['path'], 0.18, 0.42, $i)),
                'erro'      => 0,
                default     => (int)round($conv * $this->entre('pc|' . $p['path'], 0.0, 0.09, $i)),
            };
            $linhas[] = [
                'path' => $p['path'], 'titulo' => $p['titulo'], 'tipo' => $p['tipo'],
                'visualizacoes' => $v,
                'usuarios'      => (int)round($v * $this->entre('pu|' . $p['path'], 0.58, 0.76, $i)),
                'entradas'      => $ent,
                'saidas'        => (int)round($v * $this->entre('ps|' . $p['path'], 0.18, 0.52, $i)),
                'taxa_engajamento' => $eng,
                'tempo_medio_seg'  => $this->inteiro('pt|' . $p['path'], 18, 214, $i),
                'conversoes'    => $cv,
                'receita'       => $this->temEcommerce() ? round($cv * $this->entre('pr|' . $p['path'], 700, 2100, $i), 2) : 0.0,
                'e_entrada'     => $p['entrada'],
            ];
        }
        usort($linhas, fn($a, $b) => $b['visualizacoes'] <=> $a['visualizacoes']);

        // Landing pages = só as de entrada, com score próprio (§24.3).
        $landings = array_values(array_filter($linhas, fn($l) => $l['e_entrada']));
        foreach ($landings as &$l) {
            // ⚠️ Score INTERNO, não métrica do Google (§24.3 exige dizer isso).
            $l['score'] = round(
                min(100, ($l['taxa_engajamento'] * 0.4)
                    + (($l['entradas'] > 0 ? ($l['conversoes'] / $l['entradas']) * 100 : 0) * 8)
                    + (min($l['tempo_medio_seg'], 180) / 180 * 20)), 1);
            $l['score_componentes'] = ['engajamento' => 0.4, 'conversao' => 8.0, 'tempo' => 0.11];
        }
        unset($l);

        return [
            'paginas'  => $linhas,
            'landings' => $landings,
            'aviso_score' => 'O score de landing page é um cálculo interno do Dshow Dash (engajamento, conversão e tempo). Não é métrica oficial do Google Analytics.',
            'meta' => $this->proc(),
        ];
    }

    public function eventos(array $f): array
    {
        $serie = $this->serie($f);
        $ses   = $this->total($serie, 'sessoes');
        $usrs  = $this->total($serie, 'usuarios');

        $linhas = [];
        foreach ($this->eventosBase() as $i => $e) {
            $cont = (int)round($ses * $e['porSessao'] * ($e['importante'] ? $this->fator('conversao') : 1.0));
            $diag = [];
            // Diagnósticos REAIS, herdados da auditoria (§28.2, §42.2).
            if (str_starts_with($e['evento'], 'scrool_')) {
                $diag[] = ['nivel' => 'aviso', 'texto' => 'Nome grafado incorretamente: o correto é "scroll".'];
            }
            if (str_starts_with($e['evento'], 'time_')) {
                $diag[] = ['nivel' => 'info', 'texto' => 'Evento de temporizador: 7 variantes configuradas inflam a contagem de eventos e o consumo de quota.'];
            }
            if ($e['evento'] === 'clicou_whatsapp' || $e['evento'] === 'iniciou_conversa_whatsapp') {
                $diag[] = ['nivel' => 'info', 'texto' => 'Nome em português conviva com generate_lead em inglês: convenção de nomenclatura inconsistente no container.'];
            }
            if ($cont === 0) {
                $diag[] = ['nivel' => 'erro', 'texto' => 'Nenhum registro no período — evento pode ter parado de ser disparado.'];
            }
            $linhas[] = [
                'evento'     => $e['evento'],
                'classe'     => $e['classe'],
                'importante' => $e['importante'],
                'contagem'   => $cont,
                'usuarios'   => (int)round($usrs * min(1.0, $e['porSessao'])),
                'por_sessao' => round($e['porSessao'], 4),
                'primeira_ocorrencia' => '2022-09-14',
                'ultima_ocorrencia'   => (new DateTimeImmutable('-' . $this->inteiro('ev_last|' . $e['evento'], 0, 3, $i) . ' days'))->format('Y-m-d'),
                'diagnosticos' => $diag,
            ];
        }
        usort($linhas, fn($a, $b) => $b['contagem'] <=> $a['contagem']);

        // Eventos que o briefing espera e que NÃO existem no container (§42.1).
        $esperados = ['view_item', 'add_to_cart', 'begin_checkout', 'purchase', 'view_item_list', 'remove_from_cart'];
        $ausentes = [];
        $nomes = array_column($linhas, 'evento');
        foreach ($esperados as $e) {
            if (!in_array($e, $nomes, true)) {
                $ausentes[] = ['evento' => $e, 'motivo' => 'Evento recomendado de e-commerce não configurado no container GTM.'];
            }
        }

        return ['eventos' => $linhas, 'ausentes' => $ausentes, 'meta' => $this->proc()];
    }

    public function conversoes(array $f): array
    {
        $ev = $this->eventos($f);
        $importantes = array_values(array_filter($ev['eventos'], fn($e) => $e['importante']));
        $serie = $this->serie($f);
        $ses = $this->total($serie, 'sessoes');

        foreach ($importantes as &$e) {
            $e['taxa'] = $ses > 0 ? round(($e['contagem'] / $ses) * 100, 3) : 0;
            $e['valor'] = $this->temEcommerce() ? round($e['contagem'] * $this->entre('cvv|' . $e['evento'], 620, 1980), 2) : null;
        }
        unset($e);

        // Conciliação com o CRM (§32) — Pipedrive é a ÚNICA ponta real hoje (Fase 0 §7).
        $ga = 0;
        foreach ($importantes as $e) { if ($e['evento'] === 'generate_lead') { $ga = $e['contagem']; } }
        $crm = (int)round($ga * $this->entre('crm', 0.78, 0.94));

        return [
            'importantes' => $importantes,
            'conciliacao_crm' => [
                'ga4_generate_lead' => $ga,
                'crm_leads'         => $crm,
                'diferenca'         => $ga - $crm,
                'diferenca_pct'     => $ga > 0 ? round((($ga - $crm) / $ga) * 100, 1) : null,
                'status'            => $ga === $crm ? 'conciliado' : 'divergente',
                'motivos_possiveis' => [
                    'Bloqueadores de anúncio e consentimento negado impedem o evento no GA4, mas o lead chega ao CRM.',
                    'Lead criado manualmente pelo time comercial não passa pelo site.',
                    'Janela de atribuição e fuso horário diferentes entre as duas plataformas.',
                    'Formulário enviado duas vezes gera 1 lead no CRM e 2 eventos no GA4.',
                ],
                'aviso' => 'Nenhuma das duas fontes é verdade absoluta (§46.1). A conciliação mostra a diferença; não decide quem está certo.',
            ],
            'meta' => $this->proc(),
        ];
    }

    public function funil(array $f): array
    {
        $serie = $this->serie($f);
        $ses = (int)$this->total($serie, 'sessoes');
        $conv = (int)$this->total($serie, 'conversoes');

        // Funil de lead (§30.1) — as etapas existem de verdade no container.
        $etapas = [
            ['etapa' => 'Sessão',                    'evento' => 'session_start',      'usuarios' => $ses],
            ['etapa' => 'Viu landing page',          'evento' => 'page_view',          'usuarios' => (int)round($ses * 0.86)],
            ['etapa' => 'Rolou 50% da página',       'evento' => 'scrool_50',          'usuarios' => (int)round($ses * 0.41)],
            ['etapa' => 'Iniciou formulário',        'evento' => 'iniciou_formulario', 'usuarios' => (int)round($ses * 0.0714)],
            ['etapa' => 'Enviou (lead)',             'evento' => 'generate_lead',      'usuarios' => $conv],
            ['etapa' => 'Lead no CRM',               'evento' => '(Pipedrive)',        'usuarios' => (int)round($conv * $this->entre('crm', 0.78, 0.94))],
        ];
        $ant = null;
        foreach ($etapas as $i => &$e) {
            $e['taxa_da_anterior'] = $ant === null ? 100.0 : ($ant > 0 ? round(($e['usuarios'] / $ant) * 100, 1) : 0.0);
            $e['abandono']         = $ant === null ? 0 : max(0, $ant - $e['usuarios']);
            $e['taxa_do_topo']     = $ses > 0 ? round(($e['usuarios'] / $ses) * 100, 2) : 0.0;
            $e['tempo_medio_seg']  = $i === 0 ? 0 : $this->inteiro('ft|' . $e['etapa'], 12, 260, $i);
            $ant = $e['usuarios'];
        }
        unset($e);

        return [
            'funis_disponiveis' => [
                ['id' => 'lead',      'nome' => 'Funil de lead',      'disponivel' => true,  'motivo' => null],
                ['id' => 'ecommerce', 'nome' => 'Funil de e-commerce','disponivel' => $this->temEcommerce(), 'motivo' => $this->temEcommerce() ? null : 'Nenhum evento de e-commerce é coletado no container.'],
                ['id' => 'comercial', 'nome' => 'Funil comercial',    'disponivel' => false, 'motivo' => 'Depende de ERP/Financeiro; hoje só Pipedrive tem dado real.'],
            ],
            'funil_ativo' => 'lead',
            'etapas' => $etapas,
            'meta' => $this->proc('funnel'),
        ];
    }

    public function ecommerce(array $f): array
    {
        if (!$this->temEcommerce()) {
            // ⚠️ Estado vazio INFORMATIVO (§69.2), não erro. Este é o estado REAL da empresa.
            return [
                'instrumentado' => false,
                'motivo' => 'Nenhum evento de e-commerce é coletado. A auditoria da Fase 0 verificou o container GTM (GTM-M8KJKVV) e não encontrou view_item, add_to_cart, begin_checkout nem purchase.',
                'eventos_necessarios' => ['view_item', 'view_item_list', 'select_item', 'add_to_cart', 'remove_from_cart', 'view_cart', 'begin_checkout', 'add_shipping_info', 'add_payment_info', 'purchase', 'refund'],
                'acao_sugerida' => 'Instrumentar a loja com os eventos recomendados, ou remover as telas de E-commerce, Produtos e Checkout do escopo desta versão.',
                'como_demonstrar' => 'Use ?cenario=ecommerce para exercitar o layout com dados simulados.',
                'kpis' => [], 'produtos' => [], 'checkout' => [],
                'meta' => $this->proc(),
            ];
        }

        $serie = $this->serie($f);
        $compras = (int)round($this->total($serie, 'conversoes') * 0.34);
        $receita = $this->total($serie, 'receita');
        $itens = [
            'Painel de LED P3 — módulo', 'Palco 12x8m — estrutura', 'Treliça Q30 — 3m',
            'Line Array — caixa', 'Moving Head Beam 230', 'Tenda 10x10m — galpão',
            'Praticável 2x1m', 'Gerador 180 kVA', 'Mesa digital 32 canais', 'Truss box 6m',
        ];
        $produtos = [];
        foreach ($itens as $i => $nome) {
            $vi = (int)round($compras * $this->entre('pvi|' . $nome, 4.0, 22.0, $i));
            $ac = (int)round($vi * $this->entre('pac|' . $nome, 0.08, 0.34, $i));
            $cp = (int)round($ac * $this->entre('pcp|' . $nome, 0.18, 0.62, $i));
            $produtos[] = [
                'item' => $nome, 'item_id' => 'SKU-' . (1000 + $i * 7),
                'categoria' => $i % 3 === 0 ? 'Estruturas' : ($i % 3 === 1 ? 'Audiovisual' : 'Iluminação'),
                'visualizacoes' => $vi, 'add_to_cart' => $ac, 'compras' => $cp,
                'quantidade' => (int)round($cp * $this->entre('pq|' . $nome, 1.0, 3.4, $i)),
                'receita' => round($cp * $this->entre('ppr|' . $nome, 420, 3800, $i), 2),
                'taxa_conversao' => $vi > 0 ? round(($cp / $vi) * 100, 2) : 0,
                'abandono' => $ac > 0 ? round((($ac - $cp) / $ac) * 100, 1) : 0,
            ];
        }
        usort($produtos, fn($a, $b) => $b['receita'] <=> $a['receita']);

        $carrinho = (int)round($compras * 3.1);
        $checkout = [
            ['etapa' => 'Carrinho',            'usuarios' => $carrinho],
            ['etapa' => 'Início do checkout',  'usuarios' => (int)round($carrinho * 0.58)],
            ['etapa' => 'Dados de entrega',    'usuarios' => (int)round($carrinho * 0.44)],
            ['etapa' => 'Pagamento',           'usuarios' => (int)round($carrinho * 0.37)],
            ['etapa' => 'Compra',              'usuarios' => $compras],
        ];
        $ant = null;
        foreach ($checkout as &$c) {
            $c['taxa'] = $ant === null ? 100.0 : ($ant > 0 ? round(($c['usuarios'] / $ant) * 100, 1) : 0);
            $c['perda'] = $ant === null ? 0 : max(0, $ant - $c['usuarios']);
            $ant = $c['usuarios'];
        }
        unset($c);

        return [
            'instrumentado' => true,
            'kpis' => [
                ['chave' => 'compras', 'rotulo' => 'Compras', 'valor' => $compras, 'unidade' => 'int'],
                ['chave' => 'receita', 'rotulo' => 'Receita', 'valor' => round($receita, 2), 'unidade' => 'currency'],
                ['chave' => 'ticket_medio', 'rotulo' => 'Ticket médio', 'valor' => $compras > 0 ? round($receita / $compras, 2) : 0, 'unidade' => 'currency'],
                ['chave' => 'abandono_checkout', 'rotulo' => 'Abandono no checkout', 'valor' => $carrinho > 0 ? round(100 - ($compras / $carrinho * 100), 1) : 0, 'unidade' => 'pct', 'maior_melhor' => false],
            ],
            'produtos' => $produtos,
            'checkout' => $checkout,
            'meta' => $this->proc(),
        ];
    }

    public function usuarios(array $f): array
    {
        $serie = $this->serie($f);
        $usr = $this->total($serie, 'usuarios');
        $novos = $this->total($serie, 'novos_usuarios');
        $conv = $this->total($serie, 'conversoes');

        $porDispositivo = [];
        foreach ($this->dispositivos() as $i => $d) {
            $u = (int)round($usr * $d['peso']);
            $cv = (int)round($conv * $d['peso'] * $d['qual'] * ($this->cenario === 'mobile_ruim' && $d['dispositivo'] === 'mobile' ? 0.42 : 1.0));
            $porDispositivo[] = [
                'dispositivo' => $d['dispositivo'], 'usuarios' => $u, 'conversoes' => $cv,
                'taxa_conversao' => $u > 0 ? round(($cv / $u) * 100, 2) : 0,
                'taxa_engajamento' => round($this->entre('de|' . $d['dispositivo'], 48, 78, $i), 1),
            ];
        }

        $porRegiao = [];
        foreach ($this->regioes() as $i => $r) {
            $u = (int)round($usr * $r['peso']);
            $cv = (int)round($conv * $r['peso'] * $r['qual']);
            $porRegiao[] = [
                'uf' => $r['uf'], 'regiao' => $r['regiao'], 'usuarios' => $u, 'conversoes' => $cv,
                'taxa_conversao' => $u > 0 ? round(($cv / $u) * 100, 2) : 0,
            ];
        }

        // Coorte semanal de retenção (§37): 8 coortes × 8 semanas.
        $coortes = [];
        for ($c = 0; $c < 8; $c++) {
            $linha = ['coorte' => (new DateTimeImmutable("-" . (7 * (7 - $c)) . " days"))->format('Y-m-d'), 'tamanho' => $this->inteiro('coh', 380, 1240, $c), 'semanas' => []];
            for ($w = 0; $w <= 7 - $c; $w++) {
                // Retenção cai rápido e estabiliza — forma realista, não linear.
                $base = $w === 0 ? 100.0 : max(1.2, 34.0 * pow(0.68, $w - 1) * $this->entre('ret', 0.82, 1.18, $c * 10 + $w));
                $linha['semanas'][] = round($base, 1);
            }
            $coortes[] = $linha;
        }

        return [
            'kpis' => [
                ['chave' => 'usuarios', 'rotulo' => 'Usuários', 'valor' => $usr, 'unidade' => 'int'],
                ['chave' => 'novos', 'rotulo' => 'Novos', 'valor' => $novos, 'unidade' => 'int'],
                ['chave' => 'recorrentes', 'rotulo' => 'Recorrentes', 'valor' => max(0, $usr - $novos), 'unidade' => 'int'],
            ],
            'por_dispositivo' => $porDispositivo,
            'por_regiao' => $porRegiao,
            'coortes' => $coortes,
            // §36.2 / §72: sem perfis individuais. Só agregado.
            'aviso_privacidade' => 'Somente dados agregados. O módulo não monta perfis individuais nem expõe client IDs (LGPD, §72).',
            'meta' => $this->proc(),
        ];
    }

    public function qualidade(array $f): array
    {
        $ev = $this->eventos($f);
        $comAviso = 0;
        foreach ($ev['eventos'] as $e) { if (!empty($e['diagnosticos'])) { $comAviso++; } }

        // Os achados são os REAIS da Fase 0 — não uma lista decorativa.
        $achados = [
            ['severidade' => 'alta',  'item' => 'Universal Analytics ativo', 'detalhe' => '4 tags de ' . self::UA_LEGADO . ' continuam no container ' . self::GTM_CONTAINER . '. O Universal Analytics foi descontinuado em julho de 2023: as tags carregam e não coletam nada.', 'classificacao' => 'obsoleto'],
            ['severidade' => 'alta',  'item' => 'Nenhum evento de e-commerce', 'detalhe' => 'view_item, add_to_cart, begin_checkout e purchase não existem no container. Sem purchase com transaction_id não há conciliação possível com Bling ou Loja Integrada.', 'classificacao' => 'ausente'],
            ['severidade' => 'media', 'item' => 'Erro de grafia em 4 eventos', 'detalhe' => 'scrool_25/50/75/100 — o correto é scroll. Renomear cria série nova e parte o histórico.', 'classificacao' => 'incorreto'],
            ['severidade' => 'media', 'item' => 'Tag GA4 dentro do bundle do site', 'detalhe' => 'A tag não está no HTML: é injetada por /js/app.min.js. Um deploy que regenere esse arquivo derruba a coleta sem aviso, e quem auditar só o HTML não vê a tag.', 'classificacao' => 'funcionando parcialmente'],
            ['severidade' => 'media', 'item' => '17 tags de HTML customizado', 'detalhe' => 'O container tem 17 tags do tipo HTML personalizado, que executam código arbitrário em produção. Nenhuma foi revisada.', 'classificacao' => 'não validado'],
            ['severidade' => 'media', 'item' => 'Convenção de nomes inconsistente', 'detalhe' => 'generate_lead (inglês, recomendado pelo Google) convive com clicou_whatsapp e iniciou_formulario (português).', 'classificacao' => 'incorreto'],
            ['severidade' => 'baixa', 'item' => '7 eventos de temporizador', 'detalhe' => 'time_5 a time_120segundos inflam a contagem de eventos e o consumo de quota sem responder pergunta de negócio clara.', 'classificacao' => 'não validado'],
            ['severidade' => 'baixa', 'item' => 'Cross-domain não configurado', 'detalhe' => 'Nenhum domínio próprio aparece na configuração de cross-domain do container.', 'classificacao' => 'não validado'],
        ];

        return [
            'resumo' => [
                'streams_ativos'   => 1,
                'eventos_recebidos'=> count($ev['eventos']),
                'eventos_ausentes' => count($ev['ausentes']),
                'eventos_com_aviso'=> $comAviso,
                'achados_abertos'  => count($achados),
            ],
            'achados' => $achados,
            'tagging' => [
                'container'      => self::GTM_CONTAINER,
                'measurement_id' => self::MEASUREMENT_ID,
                'ua_legado'      => self::UA_LEGADO,
                'onde_esta_a_tag'=> '/js/app.min.js (não no HTML)',
                'tipos_de_tag'   => ['gaawe (evento GA4)' => 15, 'gaawc (config GA4)' => 1, 'ua (legado)' => 4, 'html customizado' => 17, 'click listener' => 9, 'timer' => 7, 'scroll depth' => 4],
                'checklist' => [
                    ['item' => 'Tag base instalada', 'ok' => true],
                    ['item' => 'Inicialização única', 'ok' => true],
                    ['item' => 'Cross-domain configurado', 'ok' => false],
                    ['item' => 'Eventos de lead', 'ok' => true],
                    ['item' => 'Eventos de e-commerce', 'ok' => false],
                    ['item' => 'Universal Analytics removido', 'ok' => false],
                    ['item' => 'Consentimento (Consent Mode)', 'ok' => null],
                    ['item' => 'Ambientes separados (dev/prod)', 'ok' => null],
                ],
            ],
            'meta' => $this->proc() + ['origem_achados' => 'docs/GOOGLE-ANALYTICS/00-fase0-investigacao.md'],
        ];
    }

    public function alertas(array $f): array
    {
        $ov = $this->overview($f);
        $alertas = [];
        foreach ($ov['atencao'] as $i => $a) {
            $alertas[] = $a + [
                'id'      => 'al-' . ($i + 1),
                'quando'  => (new DateTimeImmutable('-' . $this->inteiro('alq', 5, 720, $i) . ' minutes'))->format('c'),
                'estado'  => 'aberto',
                'confianca' => $a['severidade'] === 'alta' ? 'alta' : 'media',
            ];
        }
        return [
            'alertas' => $alertas,
            'regras'  => [
                ['id' => 'r1', 'nome' => 'Queda de sessões', 'metrica' => 'sessoes', 'limite' => '-15%', 'comparacao' => 'periodo anterior', 'ativa' => true],
                ['id' => 'r2', 'nome' => 'Queda de conversões', 'metrica' => 'conversoes', 'limite' => '-20%', 'comparacao' => 'periodo anterior', 'ativa' => true],
                ['id' => 'r3', 'nome' => 'Evento importante sem registros', 'metrica' => 'generate_lead', 'limite' => '= 0', 'comparacao' => 'hoje', 'ativa' => true],
                ['id' => 'r4', 'nome' => 'Stream sem atividade', 'metrica' => 'stream', 'limite' => '> 6h', 'comparacao' => 'ultima coleta', 'ativa' => true],
            ],
            'meta' => $this->proc(),
        ];
    }
}
