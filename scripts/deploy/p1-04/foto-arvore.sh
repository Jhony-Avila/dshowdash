#!/usr/bin/env bash
# foto-arvore.sh <raiz-dir> <saida> — fotografia para provar identidade: conteúdo (sha256), tipo, dono, grupo, modo, alvo de symlink e ACL.
# Não inclui mtime/ctime (mudam com rename do pai). Ordenada; caminhos relativos.
set -euo pipefail
R=$(readlink -f "$1"); O=$2; cd "$R"
nice -n 19 ionice -c3 python3 -I - "$R" > "$O.meta" <<'PY'
import os,sys,hashlib,stat
r=sys.argv[1]; out=[]
for dp,dn,fn in os.walk(r):
    dn.sort()
    for n in sorted(dn+fn):
        p=os.path.join(dp,n); s=os.lstat(p); rel=os.path.relpath(p,r)
        if stat.S_ISLNK(s.st_mode): c='L:'+os.readlink(p)
        elif stat.S_ISREG(s.st_mode):
            h=hashlib.sha256()
            with open(p,'rb') as f:
                for b in iter(lambda:f.read(1<<20),b''): h.update(b)
            c='F:'+h.hexdigest()
        elif stat.S_ISDIR(s.st_mode): c='D'
        else: c='O'
        out.append(f'{rel}\t{oct(s.st_mode)}\t{s.st_uid}:{s.st_gid}\t{c}')
out.sort(); print('\n'.join(out))
PY
nice -n 19 ionice -c3 getfacl -R -P -p . 2>/dev/null > "$O.acl"
sha256sum "$O.meta" "$O.acl" | sed "s#  .*/#  #" > "$O.sha"
echo "foto: $(wc -l < "$O.meta") entradas; meta $(cut -c1-16 "$O.sha" | head -1) acl $(cut -c1-16 "$O.sha" | tail -1)"
