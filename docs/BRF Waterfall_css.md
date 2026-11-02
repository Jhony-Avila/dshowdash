Briefing eliminacão de Waterfall de CSS
Obejtivo: Eliminar Waterfall de CSS (Sidebar + Container-Main) via remoção de @import em runtime

1) Contexto (evidência empírica)

No DevTools, foi medido carregamento de dezenas de arquivos CSS pequenos com initiatorType: "css" (cascata), principalmente em:
/components/sidebar/styles/*
/components/main/ui/container-main/styles/*

Isso foi confirmado no servidor ao localizar vários @import dentro de:
components/sidebar/styles/index.css
components/main/ui/container-main/styles/index.css
components/main/ui/container-main/styles/controls/_index.css
components/main/ui/container-main/styles/enhancements/_index.css
components/main/ui/container-main/styles/_animations.css
e principalmente components/main/main.tokens.css que contém @import para _tokens.css do container-main.

A cascata de @import gera “waterfall” de requests e aumenta o tempo de render/TTI.

2) Objetivo (P0)
Remover @import no runtime para Sidebar e Container-Main, reduzindo drasticamente o número de requisições CSS no first load.
Meta: trocar “muitos CSS pequenos” por poucos bundles (1 por componente crítico), mantendo comportamento visual idêntico.

3) Escopo (P0) — O que deve ser feito
3.1 Sidebar — Bundle único sem @import

Criar arquivo novo: components/sidebar/styles/sidebar.bundle.css

Conteúdo do bundle:
Deve ser a versão “compilada” do components/sidebar/styles/index.css, ou seja:
incluir o conteúdo de todos os arquivos hoje importados por index.css (na mesma ordem)
nenhum @import deve permanecer no bundle

Atualizar pontos de carga do CSS do Sidebar:
1. components/sidebar/core/constants.js
Alterar:
CSS_PATH = '/components/sidebar/styles/index.css'
Para:
CSS_PATH = '/components/sidebar/styles/sidebar.bundle.css'

2. components/sidebar/loader.js
Alterar:
const CSS_FILES = ['/components/sidebar/styles/index.css'];
Para:
const CSS_FILES = ['/components/sidebar/styles/sidebar.bundle.css'];

3.2 Container-Main — Remover @import em main.tokens.css
Arquivo alvo: components/main/main.tokens.css

Problema atual:
este arquivo contém @import apontando para:
./ui/container-main/styles/_tokens.css
isso cria waterfall de CSS do container-main via cadeia de imports.

Correção (sem build/pipeline):
Remover o @import de components/main/main.tokens.css
Copiar/embutir o conteúdo completo de:
components/main/ui/container-main/styles/_tokens.css
para dentro de:
components/main/main.tokens.css
garantindo que main.tokens.css fique sem @import.

4) Regras (não negociáveis)
Não restaurar arquivos por backup.
Mudanças incrementais, mínimo de superfície.
Manter compatibilidade visual (nenhuma quebra de layout/cores/tema).
Proibido deixar @import dentro dos bundles criados.
Não criar novos carregamentos paralelos duplicados (evitar double-load do mesmo CSS).

5) Critérios de aceite (mensuráveis)
5.1 No servidor (validação objetiva)
1. Sidebar não pode ter @import no bundle:

grep -n "@import" components/sidebar/styles/sidebar.bundle.css deve retornar zero.

2. components/main/main.tokens.css não pode conter @import:
grep -n "@import" components/main/main.tokens.css deve retornar zero.

3. Sidebar não pode mais carregar styles/index.css:
grep -RIn "sidebar/styles/index\.css" components/sidebar/core/constants.js components/sidebar/loader.js deve retornar zero (ou apenas comentário, se existir).

5.2 No DevTools (validação empírica)
Após hard reload (Ctrl+F5) e cache disabled:
a lista de resources .css em:
/components/sidebar/styles/
deve reduzir para 1 request (o bundle).
e deve reduzir drasticamente a quantidade de .css em:
/components/main/ui/container-main/styles/
especialmente _tokens.css não deve mais ser puxado via cascade de main.tokens.css.

6) Entregáveis do agente
1. Arquivos alterados/criados:

components/sidebar/styles/sidebar.bundle.css (novo)
components/sidebar/core/constants.js (editado)
components/sidebar/loader.js (editado)
components/main/main.tokens.css (editado)

2. Evidências anexadas:
outputs dos grep de aceite (sem @import)
print/console do DevTools mostrando queda de requests CSS (antes/depois)

7) Observações (P1 futuro, não fazer agora)
Container-Main ainda tem cascatas internas (ex.: styles/index.css, controls/_index.css, enhancements/_index.css, _animations.css).
Depois do P0, planejar:
container-main.bundle.css (core)
container-main.enhancements.bundle.css (lazy pós-auth)

P0 termina quando:
Sidebar está 1 bundle
main.tokens.css não tem @import e não aciona cascade do container-main
