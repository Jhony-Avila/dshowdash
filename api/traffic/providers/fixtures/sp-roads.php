<?php
/**
 * Fixture — principais vias monitoradas de São Paulo (mock).
 * Geometria aproximada (LineString [lng,lat]) para desenhar o fluxo no mapa.
 * freeFlowKmh = velocidade em fluxo livre; baseCongestion 0..1 = tendência de lentidão da via.
 * Coordenadas dentro do bounding box do município. NÃO são dados oficiais.
 */
return [
    ['id'=>'sp-marginal-tiete','road'=>'Marginal Tietê','from'=>'Ponte das Bandeiras','to'=>'Ponte do Limão','freeFlowKmh'=>90,'baseCongestion'=>0.55,
        'geometry'=>['type'=>'LineString','coordinates'=>[[-46.6205,-23.5165],[-46.6360,-23.5140],[-46.6530,-23.5150]]]],
    ['id'=>'sp-marginal-pinheiros','road'=>'Marginal Pinheiros','from'=>'Cebolão','to'=>'Ponte Cidade Jardim','freeFlowKmh'=>90,'baseCongestion'=>0.6,
        'geometry'=>['type'=>'LineString','coordinates'=>[[-46.7340,-23.5470],[-46.7015,-23.5820],[-46.6960,-23.6010]]]],
    ['id'=>'sp-bandeirantes','road'=>'Avenida dos Bandeirantes','from'=>'Av. Jornalista Roberto Marinho','to'=>'Marginal Pinheiros','freeFlowKmh'=>60,'baseCongestion'=>0.7,
        'geometry'=>['type'=>'LineString','coordinates'=>[[-46.6580,-23.6120],[-46.6720,-23.6050],[-46.6900,-23.6010]]]],
    ['id'=>'sp-23-de-maio','road'=>'Avenida Vinte e Três de Maio','from'=>'Paraíso','to'=>'Aeroporto de Congonhas','freeFlowKmh'=>60,'baseCongestion'=>0.5,
        'geometry'=>['type'=>'LineString','coordinates'=>[[-46.6410,-23.5720],[-46.6440,-23.5980],[-46.6560,-23.6260]]]],
    ['id'=>'sp-radial-leste','road'=>'Radial Leste (Av. Alcântara Machado)','from'=>'Brás','to'=>'Tatuapé','freeFlowKmh'=>60,'baseCongestion'=>0.45,
        'geometry'=>['type'=>'LineString','coordinates'=>[[-46.6180,-23.5450],[-46.6000,-23.5400],[-46.5760,-23.5390]]]],
    ['id'=>'sp-paulista','road'=>'Avenida Paulista','from'=>'Consolação','to'=>'Paraíso','freeFlowKmh'=>40,'baseCongestion'=>0.4,
        'geometry'=>['type'=>'LineString','coordinates'=>[[-46.6600,-23.5560],[-46.6520,-23.5620],[-46.6440,-23.5710]]]],
    ['id'=>'sp-reboucas','road'=>'Avenida Rebouças','from'=>'Pinheiros','to'=>'Consolação','freeFlowKmh'=>45,'baseCongestion'=>0.55,
        'geometry'=>['type'=>'LineString','coordinates'=>[[-46.6870,-23.5670],[-46.6720,-23.5610],[-46.6600,-23.5570]]]],
    ['id'=>'sp-faria-lima','road'=>'Avenida Brigadeiro Faria Lima','from'=>'Pinheiros','to'=>'Itaim Bibi','freeFlowKmh'=>45,'baseCongestion'=>0.5,
        'geometry'=>['type'=>'LineString','coordinates'=>[[-46.6980,-23.5670],[-46.6880,-23.5780],[-46.6830,-23.5860]]]],
    ['id'=>'sp-nove-de-julho','road'=>'Avenida Nove de Julho','from'=>'Centro','to'=>'Ibirapuera','freeFlowKmh'=>50,'baseCongestion'=>0.45,
        'geometry'=>['type'=>'LineString','coordinates'=>[[-46.6470,-23.5560],[-46.6520,-23.5720],[-46.6560,-23.5850]]]],
    ['id'=>'sp-do-estado','road'=>'Avenida do Estado','from'=>'Bom Retiro','to'=>'Ipiranga','freeFlowKmh'=>60,'baseCongestion'=>0.5,
        'geometry'=>['type'=>'LineString','coordinates'=>[[-46.6250,-23.5330],[-46.6180,-23.5560],[-46.6090,-23.5820]]]],
    ['id'=>'sp-aricanduva','road'=>'Avenida Aricanduva','from'=>'Carrão','to'=>'Cidade Líder','freeFlowKmh'=>60,'baseCongestion'=>0.4,
        'geometry'=>['type'=>'LineString','coordinates'=>[[-46.5350,-23.5560],[-46.5150,-23.5620],[-46.4980,-23.5680]]]],
    ['id'=>'sp-sumare','road'=>'Avenida Sumaré','from'=>'Perdizes','to'=>'Sumaré','freeFlowKmh'=>45,'baseCongestion'=>0.35,
        'geometry'=>['type'=>'LineString','coordinates'=>[[-46.6820,-23.5380],[-46.6900,-23.5430],[-46.6970,-23.5470]]]],
];
