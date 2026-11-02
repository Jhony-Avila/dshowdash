# Prova do .gitignore do P1-01 (sem `git add -f`)

- Gerador: `/srv/dshow-work/p1-01-ferramentas/gerar-gitignore.py` (entradas: inventário, ignorados da produção, rastreados do main, conjunto "não ignorados hoje").
- Prova: repositório de rascunho `/srv/dshow-work/p1-01-prova-gitignore` com os **42 577 caminhos** da produção (rastreados + ignorados, inclusive `node_modules`) criados como **arquivos vazios** — nenhum conteúdo real.
- Medição com `git ls-files --others --exclude-standard`:

| Medida | Valor |
|---|---:|
| não ignorados com o .gitignore atual (hoje) | 14523 |
| não ignorados com o .gitignore novo | 17388 |
| esperado (hoje + 2 865 aprovados) | 17 388 |
| aprovados que continuariam ignorados | 0 |
| excluídos (segredo/dado/gerado/lixo) que ficariam expostos | 0 |
| visíveis hoje que passariam a ser ignorados | 0 |

**Resultado: EXATO** — o novo `.gitignore` muda o status de ignorado só dos 2 865 aprovados.
- Commits de importação usam `git add` simples: sem a re-inclusão, o Git recusa (foi o que aconteceu numa 1ª tentativa em que o `.gitignore` antigo tinha voltado à cópia de trabalho — o comando parou sem adicionar nada).
- Branch anterior feito com `git add -f` preservado como `p1-01/v1-add-f-superado` (não apagado; não usar).
