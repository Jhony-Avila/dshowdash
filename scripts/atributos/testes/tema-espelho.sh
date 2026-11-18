#!/usr/bin/env bash
# UX-1b: o espelho dos tokens ESCUROS em modulo.css tem de ser idêntico (sem comentários) ao bloco padrão [data-bl-root] do tokens.css.
R=$(cd "$(dirname "$0")/../../.." && pwd)
python3 - "$R/public/components/_shared-react/styles/tokens.css" "$R/public/components/panels/panel-atributos/src/styles/modulo.css" <<'PY'
import sys,re
def decl(txt): txt=re.sub(r"/\*.*?\*/","",txt,flags=re.S); return [re.sub(r"\s+"," ",l).strip() for l in txt.splitlines() if l.strip().startswith("--bl-")]
t=open(sys.argv[1]).read(); c=open(sys.argv[2]).read()
a=decl(re.search(r"^\[data-bl-root\] \{\n(.*?)^\}", t, re.S|re.M).group(1))
m=re.search(r'^html\[data-theme="dark"\] body \[data-bl-root\] \{[^\n]*\n(.*?)^\}', c, re.S|re.M); b=decl(m.group(1)) if m else []
if a and a==b: print(f"[OK]   tema-espelho: {len(a)} tokens escuros idênticos ao tokens.css")
else: print("[FALHA] tema-espelho: modulo.css diverge do tokens.css", set(a)^set(b)); sys.exit(1)
PY
