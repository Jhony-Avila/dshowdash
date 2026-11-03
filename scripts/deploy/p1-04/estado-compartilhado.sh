# _corte-lib.sh — funções comuns do corte (Etapa 6). Carregado por migracao-inicial.sh e rollback-corte.sh.
# Lista ÚNICA do estado compartilhado (ESTADO-COMPARTILHADO-PRELIMINAR.md §1; PRELIMINAR até as 72 h do observador).
ESTADO=(config .env storage logs public/assets/avatars/studio
  public/core/ui-orchestrator/registry/manifest-generated.js
  api/currencies/.cache api/news/.cache api/server/.cache api/weather/.cache
  tools/screenshot/.env tools/koala-pdf/node_modules tools/screenshot/node_modules)
ms(){ date +%s%N; }
dt(){ echo $(( ($2-$1)/1000000 )); }   # ms entre dois carimbos
# troca atômica de dois caminhos no mesmo FS (renameat2 RENAME_EXCHANGE): nunca há instante sem o caminho
trocar(){ python3 -I -c '
import ctypes,os,sys
libc=ctypes.CDLL(None,use_errno=True); AT=-100; EX=2
r=libc.renameat2(AT,os.fsencode(sys.argv[1]),AT,os.fsencode(sys.argv[2]),EX)
if r!=0: e=ctypes.get_errno(); sys.exit("renameat2: "+os.strerror(e))' "$1" "$2"; }
mesmo_fs(){ [ "$(stat -c %d "$1")" = "$(stat -c %d "$2")" ]; }
# liga o estado DENTRO da release (symlinks absolutos para o compartilhado); falha se a release trouxer o caminho
ligar_estado(){ local rel=$1 sh=$2 p
  for p in "${ESTADO[@]}"; do
    if [ -e "$rel/$p" ] && ! [ -L "$rel/$p" ]; then echo "ERRO: $p veio na release (deveria ser estado)"; return 1; fi
    mkdir -p "$(dirname "$rel/$p")"; ln -sfn "$sh/$p" "$rel/$p"
  done; }
# mover_e_trocar <a> <b> <origem1> <destino1> [...] — num ÚNICO processo: renomeia cada origem->destino e então troca a<->b
# (renameat2 EXCHANGE). A janela fica só entre o 1º rename e a troca (sem partida de interpretador no meio).
# Imprime a janela medida em µs. Se um rename falhar, desfaz os anteriores e sai com erro (nada trocado).
mover_e_trocar(){ python3 -I -c '
import ctypes,os,sys,time
libc=ctypes.CDLL(None,use_errno=True); AT=-100; EX=2
a,b=sys.argv[1],sys.argv[2]; pares=list(zip(sys.argv[3::2],sys.argv[4::2])); feitos=[]
t0=time.perf_counter_ns()
try:
    for o,d in pares: os.rename(o,d); feitos.append((o,d))
    if libc.renameat2(AT,os.fsencode(a),AT,os.fsencode(b),EX)!=0: raise OSError(ctypes.get_errno(),"renameat2")
except Exception as e:
    for o,d in reversed(feitos): os.rename(d,o)
    sys.exit("FALHOU (desfeito): %s" % e)
t1=time.perf_counter_ns(); print("janela_us=%d renames=%d" % ((t1-t0)//1000, len(pares)))' "$@"; }
