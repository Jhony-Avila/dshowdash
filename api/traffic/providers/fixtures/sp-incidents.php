<?php
/**
 * Fixture — ocorrências de trânsito de São Paulo (mock).
 * Tipos: accident|closure|roadworks|congestion|hazard|other. Coordenadas dentro do município.
 * offsetMinStart/offsetMinEnd = minutos relativos a "agora" (o MockProvider converte em timestamps).
 * NÃO são dados oficiais da CET.
 */
return [
    ['id'=>'inc-1','type'=>'accident','title'=>'Colisão entre veículos','description'=>'Acidente na faixa da direita, tráfego lento no local.',
        'road'=>'Marginal Pinheiros','from'=>'Ponte Eusébio Matoso','to'=>'Ponte Cidade Jardim','direction'=>'Bairro-Centro','severity'=>'high',
        'delaySeconds'=>720,'lengthMeters'=>1200,'offsetMinStart'=>-35,'offsetMinEnd'=>null,'lng'=>-46.7000,'lat'=>-23.5900],
    ['id'=>'inc-2','type'=>'closure','title'=>'Interdição para evento','description'=>'Via interditada para evento cultural.',
        'road'=>'Avenida Paulista','from'=>'Rua da Consolação','to'=>'Rua Vergueiro','direction'=>'Ambos','severity'=>'critical',
        'delaySeconds'=>null,'lengthMeters'=>2600,'offsetMinStart'=>-120,'offsetMinEnd'=>240,'lng'=>-46.6520,'lat'=>-23.5620],
    ['id'=>'inc-3','type'=>'roadworks','title'=>'Obra na pista','description'=>'Recapeamento noturno, faixa interditada.',
        'road'=>'Avenida dos Bandeirantes','from'=>'Av. Santo Amaro','to'=>'Marginal Pinheiros','direction'=>'Centro-Bairro','severity'=>'moderate',
        'delaySeconds'=>480,'lengthMeters'=>900,'offsetMinStart'=>-200,'offsetMinEnd'=>120,'lng'=>-46.6800,'lat'=>-23.6030],
    ['id'=>'inc-4','type'=>'congestion','title'=>'Congestionamento intenso','description'=>'Lentidão acima do normal para o horário.',
        'road'=>'Avenida Vinte e Três de Maio','from'=>'Paraíso','to'=>'Congonhas','direction'=>'Bairro','severity'=>'high',
        'delaySeconds'=>900,'lengthMeters'=>3100,'offsetMinStart'=>-25,'offsetMinEnd'=>null,'lng'=>-46.6470,'lat'=>-23.5990],
    ['id'=>'inc-5','type'=>'hazard','title'=>'Objeto na pista','description'=>'Carga caiu na via, equipe a caminho.',
        'road'=>'Radial Leste','from'=>'Brás','to'=>'Tatuapé','direction'=>'Leste','severity'=>'moderate',
        'delaySeconds'=>300,'lengthMeters'=>400,'offsetMinStart'=>-12,'offsetMinEnd'=>null,'lng'=>-46.5980,'lat'=>-23.5400],
    ['id'=>'inc-6','type'=>'roadworks','title'=>'Manutenção de sinalização','description'=>'Equipe da CET em campo.',
        'road'=>'Avenida Rebouças','from'=>'Pinheiros','to'=>'Consolação','direction'=>'Centro','severity'=>'low',
        'delaySeconds'=>180,'lengthMeters'=>500,'offsetMinStart'=>-90,'offsetMinEnd'=>90,'lng'=>-46.6720,'lat'=>-23.5610],
    ['id'=>'inc-7','type'=>'accident','title'=>'Tombamento','description'=>'Veículo tombado, uma faixa liberada.',
        'road'=>'Marginal Tietê','from'=>'Ponte das Bandeiras','to'=>'Ponte do Limão','direction'=>'Ayrton Senna','severity'=>'critical',
        'delaySeconds'=>1500,'lengthMeters'=>1800,'offsetMinStart'=>-18,'offsetMinEnd'=>null,'lng'=>-46.6360,'lat'=>-23.5140],
];
