# leitura-runtime.sh — biblioteca (source): o usuário do RUNTIME (www-data: nginx + PHP-FPM) consegue servir a árvore?
# Origem: INCIDENTE-DIA-B-20261110 — /srv/dshow-releases/dash/releases nasceu 0700 root (instalador: mkdir -m 0700) e o
# corte serviu 404 por 30 s ("open() … failed (13: Permission denied)"). Nenhuma checagem testava COMO www-data.
# Uso: leitura_runtime <raiz-da-release> [usuario]   → rc 0 = travessia de toda a cadeia + nada ilegível dentro;
#      rc 1 = bloqueado (imprime até 10 caminhos em stderr). Só leitura: nunca altera permissão.
# Instalação (depois do dia B): /usr/local/lib/dshow/leitura-runtime.sh (mesmo laço de busca do lock-publicacao.sh).
leitura_runtime() {
  local r=$1 u=${2:-${DSHOW_RUNTIME_USER:-www-data}} c=/ parte n
  [ -d "$r" ] || { echo "leitura_runtime: $r não é diretório" >&2; return 1; }
  # 1) cada componente do caminho real precisa de travessia (x) para o usuário do runtime
  for parte in $(readlink -f "$r" | tr '/' ' '); do
    c="${c%/}/$parte"
    runuser -u "$u" -- test -x "$c" || { echo "sem travessia para $u: $c ($(stat -c '%A %U:%G' "$c"))" >&2; return 1; }
  done
  # 2) o ponto de entrada do site
  runuser -u "$u" -- test -r "$r/public/index.html" || { echo "$u não lê $r/public/index.html" >&2; return 1; }
  # 3) nada dentro da release ilegível: pasta sem r/x ou arquivo sem r (links não são seguidos: o estado é conferido à parte)
  n=$(runuser -u "$u" -- find "$r" -xdev \( \( -type d \( ! -readable -o ! -executable \) \) -o \( ! -type d ! -type l ! -readable \) \) -print 2>/dev/null \
      | head -10 | tee /dev/stderr | wc -l)
  [ "$n" -eq 0 ] || { echo "^ $n caminho(s) ilegível(is) para $u em $r" >&2; return 1; }
  return 0
}
