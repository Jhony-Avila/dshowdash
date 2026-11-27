#!/bin/bash
# Carrossel aposentado (decisão do Jhony 27/11 05:00) · VINHO. Sobe um php -S LOCAL temporário e confere, nos 4 slides:
# sem sessão vindo de fora → 401 NOT_AUTHENTICATED (a guarda vem ANTES); interno (loopback) → 410 APOSENTADO; nunca 500.
set -u; RAIZ=$(cd "$(dirname "$0")/../.." && pwd); T=$(mktemp -d); PORTA=${PORTA:-18419}; ok=0; f=0
cat > "$T/r.php" <<R
<?php
if (isset(\$_GET['externo'])) \$_SERVER['REMOTE_ADDR'] = '203.0.113.9';
\$a = '$RAIZ' . parse_url(\$_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (!str_starts_with(realpath(\$a) ?: '', '$RAIZ/api/modules/carousel/')) { http_response_code(404); exit; }
chdir(dirname(\$a)); require \$a;
R
php -d session.save_path="$T" -S 127.0.0.1:$PORTA "$T/r.php" >"$T/log" 2>&1 & PID=$!; sleep 1
ck() { if [ "$2" = "$3" ]; then ok=$((ok+1)); echo "ok    $1"; else f=$((f+1)); echo "FALHA $1 · $2 ≠ $3"; fi; }
for s in 01 02 03 04; do
  u="http://127.0.0.1:$PORTA/api/modules/carousel/slide-$s/api.php"
  ck "slide-$s externo sem sessão → 401" "$(curl -s -o "$T/b" -w '%{http_code}' "$u?externo=1"):$(grep -o NOT_AUTHENTICATED "$T/b")" "401:NOT_AUTHENTICATED"
  ck "slide-$s interno → 410 APOSENTADO" "$(curl -s -o "$T/b" -w '%{http_code}' "$u"):$(grep -o APOSENTADO "$T/b")" "410:APOSENTADO"
done
ps -p $PID -o args= | grep -q "127.0.0.1:$PORTA" && kill $PID
echo "teste-carrossel-aposentado: $ok ok, $f falha(s)"; [ $f = 0 ]
