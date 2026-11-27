<?php
declare(strict_types=1);
// HL-001 (referência do ChatGPT, LOTE9; incorporada pelo AZUL em 27/11). Rota interna autorizada (api/health.php?contract=4, atrás do
// portão do IP real). Não há conexão, DNS ou sonda neste caminho. Mudança do AZUL: tolerância de relógio de 2 s (amostra até 2 s
// "no futuro" conta como idade 0; antes bloqueava por diferença mínima de relógio entre o coletor e o PHP).
final class HealthOperacionalV4 {
    private const CRITICOS = ['database','disk','memory','session','redis'];
    private const TOLERANCIA = 2;   // segundos de relógio adiantado aceitos
    private static function numero(mixed $v): bool {
        return (is_int($v) || is_float($v)) && is_finite((float)$v) && $v >= 0;
    }
    /** @param ?string $esperado RELEASE_SHA da release servida (ReleaseIdentidade); null = desconhecido */
    public static function avaliar(array $foto, ?string $esperado, int $agora): array {
        $checks=[]; $bloqueios=[]; $avisos=[];
        if (($foto['version']??null)!==4) $bloqueios[]='version';
        // Identidade (decisão do Jhony, 27/11): desconhecida = AVISO informativo, nunca 503 geral; conhecida e diferente = bloqueia.
        $conhecido = is_string($esperado) && preg_match('/^[a-f0-9]{40}$/D',$esperado) === 1;
        // a identidade é do ENVELOPE (campo `identity`), não um check: um "crítico" fora da lista vira criticidade desconhecida no consumidor
        if (!$conhecido) { $identidade='unknown'; $avisos[]='build'; }
        elseif (($foto['build']??null)!==$esperado) { $identidade='failed'; $bloqueios[]='build'; }
        else { $identidade='ok'; }
        foreach ([...self::CRITICOS,'remote_databases'] as $nome) {
            $critico=in_array($nome,self::CRITICOS,true);
            $s=$foto['samples'][$nome]??null;
            $at=is_array($s)?($s['at']??null):null;
            $idade=self::numero($at)&&$at<=$agora+self::TOLERANCIA ? max(0,$agora-$at) : null;
            $frescor=$s===null?'missing':($idade===null?'invalid':($idade<=($critico?15:60)?'fresh':'stale'));
            $ms=$s['durationMs']??null; $estado=$s['state']??'missing';
            if ($s!==null && (!self::numero($ms)||!in_array($estado,['ok','failed','warning','retired'],true))) $estado='invalid';
            if (($critico && $estado==='retired') || ($estado==='warning'&&!in_array($nome,['memory','disk'],true))) $estado='invalid';
            if ($nome==='disk'&&in_array($estado,['ok','warning'],true)) {
                $pct=$s['usedPercent']??null;
                $estado=!self::numero($pct)||$pct>100?'invalid':($pct>=92?'failed':($pct>=85?'warning':'ok'));
            }
            $checks[$nome]=['state'=>$estado,'freshness'=>$frescor,'criticality'=>$critico?'critical':'informational',
                'ageSeconds'=>$idade,'durationMs'=>self::numero($ms)?$ms:null]
                + (in_array($nome,['disk','memory'],true) && is_array($s) && self::numero($s['usedPercent']??null) ? ['usedPercent'=>$s['usedPercent']] : []);   // R1: o consumidor refaz a fronteira
            if ($critico && ($frescor!=='fresh'||!in_array($estado,['ok','warning'],true))) $bloqueios[]=$nome;
            elseif ($estado==='warning'||(!$critico&&($frescor!=='fresh'||!in_array($estado,['ok','retired'],true)))) $avisos[]=$nome;
        }
        $funcoes=[];
        foreach (['DSHOW_PROD','INTEGRACAO','asaas','pipedrive','bling','rdstation'] as $id) {
            $x=$foto['integrations'][$id]??null;
            $at=$x['at']??null; $ms=$x['durationMs']??null;
            $idade=self::numero($at)&&$at<=$agora+self::TOLERANCIA?max(0,$agora-$at):null;
            $valida=is_array($x)&&($x['kind']??null)==='functional_read'&&self::numero($ms)&&$ms<=300;
            $estado=$x===null?'missing':(!$valida||$idade===null?'invalid':($idade>60?'stale':(in_array($x['state']??null,['ok','failed','retired'],true)?$x['state']:'invalid')));
            $funcoes[$id]=['state'=>$estado,'ageSeconds'=>$idade,'durationMs'=>self::numero($ms)?$ms:null];
        }
        return ['version'=>4,'evaluatedAt'=>$agora,'build'=>$conhecido?$esperado:null,'identity'=>$identidade,   // HL-001-R1: instante da avaliação (o consumidor confere a idade no consumo)
           
            'state'=>$bloqueios?'UNHEALTHY':($avisos?'DEGRADED':'HEALTHY'),'checks'=>$checks,'integrations'=>$funcoes,
            'publication'=>['allowed'=>!$bloqueios,'blocking'=>$bloqueios,'warnings'=>$avisos]];
    }
    public static function responder(string $arquivo,?string $build): void {
        // O caminho fixo pertence ao coletor, em volume local, sem permissão de escrita para o usuário web.
        $raw=is_file($arquivo)?@file_get_contents($arquivo,false,null,0,16385):false;
        $foto=is_string($raw)&&strlen($raw)<=16384?json_decode($raw,true):null;
        $r=self::avaliar(is_array($foto)?$foto:[],$build,time());
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        http_response_code($r['publication']['allowed']?200:503);
        echo json_encode($r,JSON_THROW_ON_ERROR);
    }
}
