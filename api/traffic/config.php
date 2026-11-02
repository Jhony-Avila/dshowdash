<?php
/**
 * Traffic API - Configuration (SSOT)
 * @version 1.0.0
 * @description Configuração centralizada do módulo de trânsito de São Paulo.
 *   Todos os "números mágicos" (bounds, TTLs, pesos do índice, thresholds) vivem AQUI.
 *   Provider selecionável por env TRAFFIC_PROVIDER=mock|tomtom (default: mock enquanto
 *   não houver TOMTOM_TRAFFIC_API_KEY). Ver providers/ProviderFactory.php.
 */

$__provider = getenv('TRAFFIC_PROVIDER');
$__tomtomKey = getenv('TOMTOM_TRAFFIC_API_KEY');
if ($__provider === false || $__provider === '') {
    // Sem escolha explícita: usa tomtom só se houver chave; senão mock.
    $__provider = ($__tomtomKey !== false && $__tomtomKey !== '') ? 'tomtom' : 'mock';
}

return [
    // Qual implementação de TrafficProvider usar
    'provider' => $__provider,           // 'mock' | 'tomtom'
    'city'     => 'sao-paulo',

    // Bounding box do MUNICÍPIO de São Paulo. Referência inicial do briefing;
    // confirmar/ajustar com dados reais. Toda consulta é limitada a esta caixa.
    'bounds' => [
        'north' => -23.356,
        'south' => -23.82,
        'west'  => -46.826,
        'east'  => -46.365,
    ],
    // Centro aproximado (para enquadrar o mapa)
    'center' => ['lat' => -23.5505, 'lng' => -46.6333],

    // TomTom (usado só quando provider=tomtom). A chave NUNCA aparece aqui — vem do .env.
    'tomtom' => [
        'base_url'  => 'https://api.tomtom.com',
        'endpoints' => [
            'flow_segment'     => '/traffic/services/4/flowSegmentData/absolute/10/json',
            'incident_details' => '/traffic/services/5/incidentDetails',
        ],
        'timeout_flow'      => 8,
        'timeout_incidents' => 9,
        'language'          => 'pt-PT',  // TomTom não aceita pt-BR nos incidentes; pt-PT é o pt suportado
    ],

    // Cache Redis (prefixo 'traffic:'). Trânsito é "ao vivo" → TTL curto.
    'cache' => [
        // TTL do payload compartilhado (governa a frequência de chamadas EXTERNAS).
        // 300s = 5 min → prudente p/ o plano gratuito: cada refresh = ~13 chamadas TomTom (12 flow + 1
        // incidents). ~12h de uso contínuo ≈ 1.900 chamadas/dia (< 2.500 do free tier). O cache é
        // COMPARTILHADO (server-side) → nº de usuários NÃO multiplica as chamadas. Baixe se o plano permitir.
        'ttl_summary'   => 300,
        'ttl_dashboard' => 300,
        'ttl_incidents' => 300,
        'ttl_flow'      => 300,
        'ttl_health'    => 300,  // s
        'ttl_stale'     => 1800, // s — quanto tempo um dado "velho" ainda serve em fallback
        'key_prefix'    => 'traffic:sao-paulo:',
    ],

    // Índice geral de trânsito (0-100). Documentado em README + calc/TrafficIndex.php.
    'index' => [
        // Penalidades por ocorrência crítica (somadas ao score-base, com teto).
        'closure_penalty'         => 1.5,
        'severe_accident_penalty' => 1.0,
        'major_roadwork_penalty'  => 0.5,
        'max_incident_penalty'    => 15,
        // Segmento é "congestionado" quando currentSpeed < freeFlow * ratio.
        'congestion_speed_ratio'  => 0.65,
    ],

    // Faixas de classificação do índice (configuráveis).
    'levels' => [
        'normal'   => ['min' => 0,  'max' => 34],
        'moderate' => ['min' => 35, 'max' => 69],
        'intense'  => ['min' => 70, 'max' => 100],
    ],

    // Limites de apresentação
    'display' => [
        'max_roads'     => 10,
        'max_incidents' => 500, // geometria de ocorrência = 1 ponto → payload leve mesmo com centenas
    ],

    // Resiliência
    'resilience' => [
        'retry_attempts'  => 2,
        'retry_delay_ms'  => 500,
    ],

    // Segurança/acesso. Os endpoints expõem só dados PÚBLICOS de trânsito (sem dado de
    // usuário) e a chave fica server-side — por isso, como os proxies de cotação, ficam
    // abertos por padrão. Ligue require_auth=true para exigir sessão DShowDash.
    'security' => [
        'require_auth' => false,
    ],
];
