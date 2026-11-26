<?php
declare(strict_types=1);

/**
 * api/cadastro/PreviaCadastral.php — C1 · prévia da fila genérica de revisão cadastral · VINHO (ACIMA_ESQUERDA), 26/11/2026.
 * NÚCLEO PURO (sem banco, sem rede): recebe as fontes já lidas e devolve o lote (linhas + contagens) do contrato
 * /srv/dshow-docs/consultas-cadastrais/CONTRATO-C1-PREVIA-CADASTRAL.md v1.1 (briefing PILOTO-CADASTRAL-DSHOW §4/§5/§7 + decisão do arquiteto).
 * Filas: "ganhos" (4025/4036 das fichas com negócio ganho e CNPJ válido) e "sem_cnpj_id_precifica" (4022 das ganhas com Id_Precifica sem CNPJ).
 * Regras-chave: vazio = chave ausente / nulo JSON / objeto com value nulo / "" / só espaços; texto "null", "N/A", formato inesperado e nome igual
 * ao 3993 NÃO são lacuna. Razão = Nome com fonte trazendo razão DIFERENTE → "nome_para_razao_revisar" (nunca pré-selecionada).
 * Comparação: só caixa e espaços (acento e pontuação preservados). Precedência: Precifica > legado (coluna) > legado (JSON confirmado) > outra ficha.
 * Identidade: só o CNPJ completo; JSON do legado só se o CNPJ dele confirmar; mais de uma organização no Precifica com o mesmo CNPJ e conteúdos
 * distintos → identidade_duvidosa. Ordem: CNPJ pelo ganho mais recente, desempate CNPJ crescente; corte em 100 CNPJs DEPOIS de agrupar.
 */
final class PreviaCadastral
{
    public const REGRAS = '2026-11-26.1';
    public const TETO_CNPJ = 100;
    public const PRECEDENCIA = ['precifica' => 1, 'legado' => 2, 'legado_json' => 3, 'crm_outra_ficha' => 4];
    public const CAMPOS = ['4025' => ['razao', 'Razão social'], '4036' => ['fantasia', 'Nome fantasia']];
    public const DESFECHOS = ['so_crm', 'so_precifica', 'so_legado', 'concordam', 'divergem', 'identidade_duvidosa', 'sem_valor_legado_presente', 'sem_valor_legado_ausente', 'nome_para_razao_revisar', 'fonte_indisponivel'];   // F22: indisponível tem categoria própria

    public static function doc(?string $v): string { return strtoupper((string) preg_replace('/[\s.\/-]/', '', (string) $v)); }
    public static function cnpjValido(string $c): bool
    {
        if (preg_match('/^[0-9A-Z]{12}\d{2}\z/', $c) !== 1 || count(array_unique(str_split($c))) === 1) return false;
        foreach ([12 => [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], 13 => [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]] as $n => $p) {
            $s = 0; for ($i = 0; $i < $n; $i++) $s += (ctype_digit($c[$i]) ? (int) $c[$i] : ord($c[$i]) - 48) * $p[$i];
            $r = $s % 11; if ((int) $c[$n] !== ($r < 2 ? 0 : 11 - $r)) return false;
        }
        return true;
    }
    /** só caixa e espaços (acento e pontuação preservados) */
    public static function k(?string $v): string { return mb_strtoupper(trim((string) preg_replace('/\s+/u', ' ', (string) $v))); }
    /** marcador vazio NAS FONTES (descartado): "", espaços, traço, "null", N/A */
    public static function marcador(?string $v): bool { $t = trim((string) $v); return $t === '' || preg_match('/^(-+|null|n\/?a|na)$/iu', $t) === 1; }

    /**
     * Estado do campo NA FICHA: 'vazio' | 'protegido_texto_null' | 'protegido_marcador' | 'igual_nome' | 'preenchido' | 'inesperado'.
     * @param string $tipoJson tipo no JSON local: 'sem_chave' | 'NULL' | 'STRING' | 'OBJECT' | outro
     */
    public static function estadoCampo(string $tipoJson, ?string $valor, ?string $nome): string
    {
        if ($tipoJson === 'sem_chave' || $tipoJson === 'NULL') return 'vazio';
        if ($tipoJson === 'OBJECT') return $valor === null ? 'vazio' : 'inesperado';   // objeto {value:…}: value nulo = vazio
        if ($tipoJson !== 'STRING') return 'inesperado';
        if (trim((string) $valor) === '') return 'vazio';
        if (strcasecmp(trim((string) $valor), 'null') === 0) return 'protegido_texto_null';
        if (preg_match('/^(n\/?a|na|-+)$/iu', trim((string) $valor)) === 1) return 'protegido_marcador';
        if ($nome !== null && self::k($valor) === self::k($nome)) return 'igual_nome';
        return 'preenchido';
    }

    /**
     * @param array $orgs  [{id, nome, doc, idprec, ganho(?string), campos: {'4022'|'4025'|'4036': {tipo, valor}}}] — só organizações ATIVAS
     * @param array $prec  cnpj → [{id, razao, fantasia}] (organizações ativas do Precifica); $precCliente: idprec → cnpj (texto)
     * @param array $leg   cnpj → {razao, fantasia, json_cnpj, json_razao, json_fantasia, consultado_em}
     * @param array $fontes {pipedrive:{estado,…}, precifica:{estado,…}, legado:{estado,…}}
     * @param array $decididas evidencia_versao → true (já decididas com a MESMA evidência: saem antes do corte)
     */
    public static function montar(array $orgs, array $prec, array $precCliente, array $leg, array $fontes, array $filas, string $agoraIso, array $decididas = []): array
    {
        $precOk = ($fontes['precifica']['estado'] ?? '') === 'ok'; $legOk = in_array($fontes['legado']['estado'] ?? '', ['ok'], true);
        $completa = ($fontes['pipedrive']['estado'] ?? '') === 'ok' && $precOk && $legOk;
        $porCnpj = [];   // cnpj → [orgs ativas]
        foreach ($orgs as $o) { $d = self::doc($o['doc']); if (self::cnpjValido($d)) $porCnpj[$d][] = $o; }
        $linhas = []; $resumo = [];
        if (in_array('ganhos', $filas, true)) [$linhas, $resumo['ganhos']] = self::filaGanhos($porCnpj, $prec, $leg, $precOk, $legOk, $decididas);
        if (in_array('sem_cnpj_id_precifica', $filas, true)) {
            [$l2, $resumo['sem_cnpj_id_precifica']] = self::filaSemCnpj($orgs, $porCnpj, $precCliente, $prec, $leg, $precOk, $legOk, $decididas, $fontes['pipedrive'] ?? []);
            $linhas = array_merge($linhas, $l2);
        }
        $ausentes = []; foreach ($linhas as $l) if ($l['classificacao'] === 'sem_valor_legado_ausente') $ausentes[$l['cnpj']] = true;
        $id = 'L-' . str_pad(substr((string) preg_replace('/\D/', '', substr($agoraIso, 0, 19)), 0, 14), 14, '0') . '-' . bin2hex(random_bytes(6));   // F16: lotes no mesmo segundo nunca colidem
        foreach ($linhas as &$l) $l['lote'] = $id; unset($l);
        $tot = ['destinos' => count($linhas), 'sugestoes' => 0, 'divergencias' => 0, 'revisar_nome_razao' => 0, 'sem_valor' => 0];
        foreach ($linhas as $l) {
            if ($l['classificacao'] === 'sugestao') $tot['sugestoes']++;
            elseif ($l['classificacao'] === 'fontes_divergem') $tot['divergencias']++;
            elseif ($l['classificacao'] === 'nome_para_razao_revisar') $tot['revisar_nome_razao']++;
            elseif (str_starts_with($l['classificacao'], 'sem_valor')) $tot['sem_valor']++;
        }
        return ['lote' => ['id' => $id, 'regras_versao' => self::REGRAS, 'gerado_em' => $agoraIso, 'completa' => $completa, 'fontes' => $fontes,
                           'filas' => $resumo, 'totais' => $tot,
                           'custo_opcional' => ['cnpjs_distintos' => count($ausentes), 'unitario' => '0.20', 'total' => number_format(count($ausentes) * 0.20, 2, '.', ''),
                                                'nota' => 'só informativo; nenhuma compra é disparada']],
                'linhas' => $linhas];
    }

    private static function filaGanhos(array $porCnpj, array $prec, array $leg, bool $precOk, bool $legOk, array $decididas): array
    {
        $grupos = [];   // cnpj → [ganho max, linhas]
        $desf = []; foreach (self::CAMPOS as $c => $_) $desf[$c] = array_fill_keys(self::DESFECHOS, 0);
        $protegidos = 0; $vaziosTotal = 0;
        foreach ($porCnpj as $d => $os) {
            $d = (string) $d;   // chave numérica de array vira int no PHP: o CNPJ é TEXTO de 14
            $ganho = null; foreach ($os as $o) if ($o['ganho'] !== null && ($ganho === null || $o['ganho'] > $ganho)) $ganho = $o['ganho'];
            if ($ganho === null) continue;   // fila "ganhos": só CNPJ com ao menos uma ficha ganha
            $ls = [];
            foreach ($os as $o) {
                if ($o['ganho'] === null) continue;   // destino = ficha com ganho
                foreach (self::CAMPOS as $campo => [$nomeCampo, $rot]) {
                    $campo = (string) $campo;   // '4025' vira int como chave de array
                    $at = $o['campos'][$campo] ?? ['tipo' => 'sem_chave', 'valor' => null];
                    $est = self::estadoCampo((string) $at['tipo'], $at['valor'], $o['nome']);
                    $nomeRazao = $campo === '4025' && $est === 'igual_nome';
                    if ($est !== 'vazio' && !$nomeRazao) { if ($est !== 'preenchido') $protegidos++; continue; }
                    $gr = self::grafias($d, $o, $campo, $nomeCampo, $os, $prec, $leg, $precOk, $legOk);
                    $distintos = array_unique(array_map(fn($g) => self::k($g['valor']), $gr['grafias']));
                    if ($nomeRazao) {
                        $dif = array_values(array_filter($distintos, fn($x) => $x !== self::k($o['nome'])));
                        if ($dif === [] || $gr['ambiguo']) continue;   // fonte igual ao nome (ou ambígua): nada a revisar
                        $cl = 'nome_para_razao_revisar'; $desf[$campo]['nome_para_razao_revisar']++;
                    } else {
                        $vaziosTotal++;
                        if (!$gr['fonte_ok']) $cl = 'fonte_indisponivel';
                        elseif ($gr['ambiguo']) $cl = 'identidade_duvidosa';
                        elseif ($distintos === []) $cl = isset($leg[$d]) ? 'sem_valor_legado_presente' : 'sem_valor_legado_ausente';
                        elseif (count($distintos) > 1) $cl = 'fontes_divergem';
                        else $cl = 'sugestao';
                        $desf[$campo][self::desfecho($cl, $gr['grafias'])]++;
                    }
                    $ls[] = self::linha('ganhos', $o, $d, $os, $campo, $rot, $at['valor'], $cl, $gr['grafias'], $ganho);
                }
            }
            $ls = array_values(array_filter($ls, fn($l) => !isset($decididas[$l['evidencia_versao']])));
            usort($ls, fn($a, $b) => [$a['org_id'], $a['campo']] <=> [$b['org_id'], $b['campo']]);   // F21: independe da ordem de entrada
            if ($ls !== []) $grupos[$d] = [$ganho, $ls];
        }
        uksort($grupos, fn($a, $b) => [$grupos[$b][0], (string) $a] <=> [$grupos[$a][0], (string) $b]);
        $todas = []; foreach ($grupos as [, $ls]) foreach ($ls as $l) $todas[] = $l;
        $universo = self::contagem($todas);   // F19: universo (todos os elegíveis, já sem os decididos) × lote (depois do corte), CNPJs e fichas separados
        $grupos = array_slice($grupos, 0, self::TETO_CNPJ, true);
        $linhas = []; foreach ($grupos as [, $ls]) foreach ($ls as $l) $linhas[] = $l;
        $lote = self::contagem($linhas);
        // F15: desfechos e campos vazios contados sobre as MESMAS linhas devolvidas
        $desf = []; foreach (self::CAMPOS as $c => $_) $desf[(string) $c] = array_fill_keys(self::DESFECHOS, 0);
        $vaziosTotal = 0; foreach ($linhas as $l) { $desf[$l['campo']][self::desfecho($l['classificacao'], $l['grafias'])]++; if ($l['classificacao'] !== 'nome_para_razao_revisar') $vaziosTotal++; }
        return [$linhas, ['cnpjs_elegiveis' => $universo['cnpjs'], 'cnpjs_no_lote' => $lote['cnpjs'], 'fichas' => $lote['fichas'], 'campos_vazios' => $vaziosTotal,
                          'protegidos_nao_lacuna' => $protegidos, 'por_desfecho' => $desf, 'universo' => $universo, 'lote' => $lote]];
    }

    /** grafias do campo para o CNPJ, com origem e doadora; ambíguo = Precifica com >1 organização de conteúdos distintos */
    private static function grafias(string $d, array $o, string $campo, string $nomeCampo, array $os, array $prec, array $leg, bool $precOk, bool $legOk): array
    {
        $g = []; $amb = false;
        if ($precOk) {
            $pp = $prec[$d] ?? [];
            $vals = []; foreach ($pp as $p) if (!self::marcador($p[$nomeCampo] ?? null)) $vals[] = $p;   // F17: TODAS as grafias e doadoras (nada colapsa por chave)
            if (count($pp) > 1 && count(array_unique(array_map(fn($p) => self::k($p[$nomeCampo]), $vals))) > 1) $amb = true;
            foreach ($vals as $p) $g[] = ['valor' => trim((string) $p[$nomeCampo]), 'origem' => 'precifica', 'doadora' => ['tipo' => 'precifica', 'id' => (string) $p['id']]];
        }
        if ($legOk && isset($leg[$d])) {
            $l = $leg[$d];
            if (!self::marcador($l[$nomeCampo] ?? null)) $g[] = ['valor' => trim((string) $l[$nomeCampo]), 'origem' => 'legado', 'doadora' => ['tipo' => 'legado', 'id' => $d, 'consultado_em' => $l['consultado_em'] ?? null]];
            elseif (($l['json_cnpj'] ?? null) === $d && !self::marcador($l['json_' . $nomeCampo] ?? null))
                $g[] = ['valor' => trim((string) $l['json_' . $nomeCampo]), 'origem' => 'legado_json', 'doadora' => ['tipo' => 'legado_json', 'id' => $d, 'consultado_em' => $l['consultado_em'] ?? null]];
        }
        foreach ($os as $x) {
            if ((int) $x['id'] === (int) $o['id']) continue;
            $at = $x['campos'][$campo] ?? ['tipo' => 'sem_chave', 'valor' => null];
            if (self::estadoCampo((string) $at['tipo'], $at['valor'], $x['nome']) === 'preenchido')
                $g[] = ['valor' => trim((string) $at['valor']), 'origem' => 'crm_outra_ficha', 'doadora' => ['tipo' => 'crm', 'id' => (string) $x['id']]];
        }
        usort($g, fn($a, $b) => [self::PRECEDENCIA[$a['origem']], $a['valor'], $a['doadora']['id']] <=> [self::PRECEDENCIA[$b['origem']], $b['valor'], $b['doadora']['id']]);   // F21: ordem canônica
        return ['grafias' => $g, 'ambiguo' => $amb, 'fonte_ok' => $precOk && $legOk];
    }

    private static function desfecho(string $cl, array $g): string
    {
        if (in_array($cl, ['sem_valor_legado_presente', 'sem_valor_legado_ausente', 'identidade_duvidosa'], true)) return $cl;
        if ($cl === 'fontes_divergem') return 'divergem';
        if (in_array($cl, ['fonte_indisponivel', 'nome_para_razao_revisar'], true)) return $cl;   // F22: indisponível não é identidade duvidosa
        $o = array_unique(array_map(fn($x) => $x['origem'] === 'legado_json' ? 'legado' : $x['origem'], $g));
        if (count($o) > 1) return 'concordam';
        return ['precifica' => 'so_precifica', 'legado' => 'so_legado', 'crm_outra_ficha' => 'so_crm'][reset($o)] ?? 'concordam';
    }

    private static function linha(string $fila, array $o, string $d, array $os, string $campo, string $rot, ?string $anterior, string $cl, array $g, ?string $ganho): array
    {
        $prop = null; $escolha = false;
        if ($cl === 'sugestao') {
            $top = $g[0]; $prop = ['valor' => $top['valor'], 'origem' => $top['origem']];
            foreach ($g as $x) if ($x['origem'] === $top['origem'] && $x['valor'] !== $top['valor']) $escolha = true;   // alternativas na mesma prioridade
        }
        $outros = []; foreach ($os as $x) if ((int) $x['id'] !== (int) $o['id']) $outros[] = (int) $x['id']; sort($outros);
        $ev = sha1(json_encode([$o['id'], $campo, $d, $anterior, $cl, array_map(fn($x) => [$x['valor'], $x['origem'], $x['doadora']['id']], $g)]));
        return ['id' => 'ln_' . substr(sha1($o['id'] . '|' . $campo . '|' . $ev), 0, 20), 'fila' => $fila, 'org_id' => (int) $o['id'], 'empresa' => $o['nome'],
                'cnpj' => $d, 'cnpj_compartilhado_com' => $outros, 'ultimo_ganho' => $ganho, 'campo' => $campo, 'campo_rotulo' => $rot,
                'valor_anterior' => $anterior, 'classificacao' => $cl, 'proposto' => $prop, 'grafias' => $g, 'precisa_escolha' => $escolha,
                'pre_selecionada' => $cl === 'sugestao' && !$escolha, 'evidencia_versao' => $ev, 'decisao' => null];
    }

    /** F19: CNPJs distintos, fichas distintas e campos distintos (ficha+campo) de um conjunto de linhas */
    private static function contagem(array $ls): array
    {
        $cn = []; $fi = []; $ca = [];
        foreach ($ls as $l) { if ($l['cnpj'] !== '') $cn[$l['cnpj']] = true; $fi[$l['org_id']] = true; $ca[$l['org_id'] . '|' . $l['campo']] = true; }
        return ['cnpjs' => count($cn), 'fichas' => count($fi), 'campos' => count($ca)];
    }

    /** F11/F12: o que pode ser APROVADO. Identidade bloqueada nunca é liberada por grafia; no 4022 só sugestão. */
    public static function aprovavel(array $linha): bool
    {
        if (($linha['campo'] ?? '') === '4022') return ($linha['classificacao'] ?? '') === 'sugestao';
        return in_array($linha['classificacao'] ?? '', ['sugestao', 'fontes_divergem', 'nome_para_razao_revisar'], true);
    }

    /** fila 4022: ganhas com Id_Precifica e SEM CNPJ válido → CNPJ do Precifica confirmado no legado, sem conflito com outra ficha */
    private static function filaSemCnpj(array $orgs, array $porCnpj, array $precCliente, array $prec, array $leg, bool $precOk, bool $legOk, array $decididas, array $fontesPipe = []): array
    {
        if (empty($fontesPipe['campo_4038'])) return [[], ['bloqueada' => 'campo_4038_ausente', 'fichas' => null]];   // F18: sem o campo 4038, nada de falso zero
        // F13: o MESMO CNPJ proposto para mais de uma ficha (calculado ANTES do corte) → identidade duvidosa em todas
        $reivindica = [];
        foreach ($orgs as $o) {
            if ($o['ganho'] === null || trim((string) $o['idprec']) === '' || self::cnpjValido(self::doc($o['doc']))) continue;
            $dd = $precCliente[trim((string) $o['idprec'])] ?? null; if ($dd !== null && self::cnpjValido($dd)) $reivindica[$dd][(int) $o['id']] = true;
        }
        $c = ['fichas' => 0, 'valor_atual_inesperado' => 0, 'sem_cliente_precifica' => 0, 'precifica_sem_cnpj_valido' => 0, 'conflita_outra_ficha' => 0,
              'ausente_legado' => 0, 'legado_razao_diverge' => 0, 'sugestoes' => 0];
        $ls = [];
        foreach ($orgs as $o) {
            if ($o['ganho'] === null || trim((string) $o['idprec']) === '' || self::cnpjValido(self::doc($o['doc']))) continue;
            $c['fichas']++;
            $at = $o['campos']['4022'] ?? ['tipo' => 'sem_chave', 'valor' => null];
            $est = self::estadoCampo((string) $at['tipo'], $at['valor'], null);
            if ($est !== 'vazio') { $c['valor_atual_inesperado']++; continue; }   // lixo/inválido no 4022 nunca é sobrescrito
            if (!$precOk || !$legOk) { $ls[] = self::linha('sem_cnpj_id_precifica', $o, '', [], '4022', 'CNPJ', $at['valor'], 'fonte_indisponivel', [], $o['ganho']); continue; }
            $d = $precCliente[trim((string) $o['idprec'])] ?? null;
            if ($d === null) { $c['sem_cliente_precifica']++; continue; }
            if (!self::cnpjValido($d)) { $c['precifica_sem_cnpj_valido']++; continue; }
            $g = [['valor' => $d, 'origem' => 'precifica', 'doadora' => ['tipo' => 'precifica_cliente', 'id' => trim((string) $o['idprec'])]]];
            if (isset($porCnpj[$d]) || count($reivindica[$d] ?? []) > 1) { $c['conflita_outra_ficha']++; $cl = 'identidade_duvidosa'; }
            elseif (!isset($leg[$d])) { $c['ausente_legado']++; $cl = 'sem_valor_legado_ausente'; }
            else {
                $rz = $prec[$d][0]['razao'] ?? null;
                if ($rz !== null && self::k($leg[$d]['razao'] ?? '') !== '' && self::k($leg[$d]['razao']) !== self::k($rz)) { $c['legado_razao_diverge']++; $cl = 'fontes_divergem'; }
                else { $c['sugestoes']++; $cl = 'sugestao'; $g[] = ['valor' => $d, 'origem' => 'legado', 'doadora' => ['tipo' => 'legado', 'id' => $d, 'consultado_em' => $leg[$d]['consultado_em'] ?? null]]; }
            }
            $l = self::linha('sem_cnpj_id_precifica', $o, $d, $porCnpj[$d] ?? [], '4022', 'CNPJ', $at['valor'], $cl, $g, $o['ganho']);
            if (!isset($decididas[$l['evidencia_versao']])) $ls[] = $l;
        }
        usort($ls, fn($a, $b) => [(string) $b['ultimo_ganho'], $a['org_id']] <=> [(string) $a['ultimo_ganho'], $b['org_id']]);
        $c['universo'] = self::contagem($ls); $ls = array_slice($ls, 0, self::TETO_CNPJ); $c['lote'] = self::contagem($ls);   // F19
        return [$ls, $c];
    }
}
