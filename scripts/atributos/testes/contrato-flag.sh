#!/bin/bash
# Equipamentos › Atributos — teste do CONTRATO da flag do piloto (api/atributos/index.php do branch p1-piloto/atributos).
# Raiz temporária: endpoint, AtributosService, ApiResponse, AuthHelpers e CorsPolicy REAIS; stubs: resolvedor de flags
# (fonte controlada por T_FLAGS), SessionGate (sessão na pasta do teste), UARPSGate, conexão e repositório (memória).
set -u
CL="$(cd "$(dirname "$0")/../../.." && pwd)"; T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
mkdir -p $T/api/atributos $T/api/_helpers $T/api/core $T/api/feature-flags $T/config $T/scripts/atributos/testes $T/tmp $T/sess
cp $CL/api/atributos/index.php $CL/api/atributos/AtributosService.php $CL/api/atributos/CatalogoPdo.php $CL/api/atributos/ProdutosLeitura.php $CL/api/atributos/KitsLegado.php $T/api/atributos/   # Etapa 7: + leitor do catálogo; E1: + leitura rica
cp $CL/api/_helpers/ApiResponse.php $CL/api/_helpers/AuthHelpers.php $T/api/_helpers/
cp $CL/api/core/*.php $T/api/core/   # todas as dependências do core (CorsPolicy → BaseUrl etc.); os stubs abaixo sobrescrevem SessionGate e UARPSGate
cp $CL/scripts/atributos/testes/_executar-rota.php $T/scripts/atributos/testes/
python3 - "$CL" "$T" <<'PY'
import sys; cl,t=sys.argv[1:3]
s=open(f'{cl}/scripts/atributos/testes/_memoria.php').read()   # V5 Lote 3: RepoMemoria mora em _memoria.php
a=s.index('final class RepoMemoria'); b=s.index('\n}\n',a)+3
open(f'{t}/api/atributos/AtributosRepo.php','w').write("<?php // STUB de teste: repositório em memória (copiado de _memoria.php)\nrequire_once __DIR__ . '/AtributosService.php';\n"+s[a:b].replace('final class RepoMemoria implements','class RepoMemoria implements')+"\nfinal class AtributosRepoPdo extends RepoMemoria { public function __construct($pdo = null) {} }\n")
PY
cat > $T/api/atributos/LeituraVitrinePdo.php <<'PHP'
<?php // STUB de teste (E1): leitura vazia
require_once __DIR__ . '/ProdutosLeitura.php';
final class LeituraVitrinePdo implements LeituraVitrine {
  public function __construct($pdo = null, $a = '', $b = '') {}
  public function catalogo(): array { return []; } public function fotosResumo(): array { return []; } public function fotos(int $p): array { return []; }
  public function familiasPrecifica(): array { return []; } public function specs(int $p): ?array { return null; } public function valoresResumo(): array { return []; }
  public function valoresDetalhe(int $p): array { return []; } public function legadoResumo(): array { return []; } public function legadoDoItem(int $i): array { return []; }
  public function vinculos(): array { return []; } public function atributos(): array { return []; } public function modelos(): array { return []; }
}
PHP
cat > $T/api/core/SessionGate.php <<'PHP'
<?php // STUB de teste: sessão só na pasta do teste
class SessionGate { public static function start(): void { if (session_status() !== PHP_SESSION_ACTIVE) { session_save_path(getenv('T_SESS')); session_start(); } } }
PHP
echo '<?php class UARPSGate {}' > $T/api/core/UARPSGate.php
echo '<?php function getConnection($n) { return null; }' > $T/config/db_connection.php
cat > $T/api/feature-flags/resolver.php <<'PHP'
<?php // STUB de teste: fonte da flag controlada por T_FLAGS = {"chave":{"anon":fonte,"user":fonte}}
class FeatureFlagResolver {
  public function __construct($pdo) {}
  public function resolve(string $k, ?int $u = null): array {
    $cfg = json_decode((string) getenv('T_FLAGS'), true) ?: [];
    $src = $cfg[$k][($u ?? 0) > 0 ? 'user' : 'anon'] ?? 'not_found';
    return ['key' => $k, 'source' => $src, 'enabled' => in_array($src, ['global', 'rollout', 'user_override'], true)];
  }
}
PHP
caso(){ local nome=$1 esperado=$2 flags=$3 m=$4 r=$5 nivel=$6
  local c; c=$(cd $T && env -i PATH=/usr/bin:/bin TMPDIR=$T/tmp T_SESS=$T/sess T_FLAGS="$flags" php -d error_log=/dev/null -d display_errors=0 scripts/atributos/testes/_executar-rota.php $m $r $nivel 2>&1 >/dev/null | grep -o 'HTTP=[0-9]*' | cut -d= -f2)
  local ok=FALHOU; [ "$c" = "$esperado" ] && ok=passou
  printf '%-58s esperado=%s obtido=%s  %s\n' "$nome" "$esperado" "$c" "$ok"; [ $ok = passou ] || FALHAS=$((FALHAS+1)); }
FALHAS=0
OFF='{"panel_atributos_enabled":{"anon":"disabled","user":"disabled"}}'
AUS='{}'
ERR='{"panel_atributos_enabled":{"anon":"error","user":"error"}}'
ON='{"panel_atributos_enabled":{"anon":"global","user":"global"},"panel_atributos_escrita":{"user":"not_found"}}'
ONW='{"panel_atributos_enabled":{"anon":"global","user":"global"},"panel_atributos_escrita":{"user":"global"}}'
ONWERR='{"panel_atributos_enabled":{"anon":"global","user":"global"},"panel_atributos_escrita":{"user":"error"}}'
ROLL='{"panel_atributos_enabled":{"anon":"rollout_no_identity","user":"rollout_excluded"}}'
UERR='{"panel_atributos_enabled":{"anon":"global","user":"error"}}'
caso "A desligado, sem sessão → 404 (oculto, não 401)" 404 "$OFF" GET atributos sem-sessao
caso "B desligado, nível 100 → 404" 404 "$OFF" GET atributos 100
caso "C ausente, sem sessão → 404" 404 "$AUS" GET grupos sem-sessao
caso "C2 ausente, POST nível 100 → 404" 404 "$AUS" POST atributo 100
caso "D flag ilegível (source=error), sem sessão → 500" 500 "$ERR" GET atributos sem-sessao
caso "D2 flag ilegível, nível 80 → 500" 500 "$ERR" GET atributos 80
caso "E ativo, sem sessão → 401 (política vigente)" 401 "$ON" GET atributos sem-sessao
caso "F ativo, nível 10 → 403 (autorização)" 403 "$ON" GET atributos 10
caso "G ativo, nível 80, definições → 200" 200 "$ON" GET atributos 80
caso "G2 ativo, nível 50, definições (consulta) → 200" 200 "$ON" GET unidades 50
caso "H rollout parcial, sem sessão → 401" 401 "$ROLL" GET atributos sem-sessao
caso "H2 rollout parcial, pessoa fora do rollout → 404" 404 "$ROLL" GET atributos 80
caso "I escrita ausente, POST nível 100 → 404" 404 "$ON" POST atributo 100
caso "J escrita ausente, GET valores nível 50 → 404" 404 "$ON" GET valores 50
# E1 (ATRIBUTOS-WEB 18/11): API só leitura — POST e GET valores respondem 404 mesmo com a escrita ligada (ATR_ESCRITA_LIBERADA=false)
caso "K E1: escrita LIGADA, POST nível 100 → 404 (só leitura)" 404 "$ONW" POST atributo 100
caso "K2 E1: escrita LIGADA, POST valor nível 100 → 404" 404 "$ONW" POST valor 100
caso "K3 E1: escrita LIGADA, GET valores nível 80 → 404" 404 "$ONW" GET valores 80
caso "L E1: escrita ilegível, POST → 404 (nem lê a flag)" 404 "$ONWERR" POST atributo 100
caso "V vitrine, nível 50 → 200" 200 "$ON" GET vitrine 50
caso "V2 vitrine, nível 49 → 403" 403 "$ON" GET vitrine 49
caso "V3 vitrine, sem sessão → 401" 401 "$ON" GET vitrine sem-sessao
caso "V4 vitrine, flag desligada → 404" 404 "$OFF" GET vitrine 80
caso "V5 vitrine, pessoa fora do rollout (só o 75) → 404" 404 "$ROLL" GET vitrine 80
caso "W ficha_produto sem product_id, nível 50 → 422" 422 "$ON" GET ficha_produto 50
caso "W2 ficha_produto, nível 10 → 403" 403 "$ON" GET ficha_produto 10
caso "M flag da pessoa ilegível → 500" 500 "$UERR" GET atributos 80
# Etapa 7 — ficha aplicável: exige SÓ a flag de leitura (escrita ausente não esconde a rota); no stub não há conexão → catálogo 503 (nunca 404/200)
caso "N ficha, escrita ausente, nível 50, sem product_id → 422 (rota existe; não 404)" 422 "$ON" GET ficha 50
caso "N2 ficha, flag de leitura desligada → 404" 404 "$OFF" GET ficha 50
caso "N3 ficha, nível 10 → 403" 403 "$ON" GET ficha 10
echo "falhas: $FALHAS"; exit $FALHAS
