# BRIEFING — Governança de Tokens (Container-Main + main.tokens.css)

## 1. Contexto

Durante o P0/P1 de Performance (eliminação de waterfall CSS), os tokens do container-main
foram inlined em `components/main/main.tokens.css`, eliminando o @import que causava cascata.

O comportamento visual foi preservado e a performance otimizada. Porém, o arquivo fonte
original `_tokens.css` foi removido de `/public/` (movido para `/backup/`).

Simultaneamente, a modularização CSS criou `modules/01-tokens.css` dentro do container-main,
que contém os mesmos tokens como fonte canônica do build script.

## 2. Problema Identificado

`main.tokens.css` contém tokens inline mas não tem build script associado.
Se alguém editar `modules/01-tokens.css` e rodar `build-bundle.sh`, o container-main
atualiza — mas `main.tokens.css` fica desatualizado. Duas fontes divergentes.

Riscos:
- Divergência silenciosa entre `modules/01-tokens.css` e `main.tokens.css`
- Sem automação, a governança depende de memória humana
- Violação do princípio: fonte canônica única com artefato gerado

## 3. Objetivo

Criar build script para `main.tokens.css` que leia de `modules/01-tokens.css`,
garantindo fonte canônica única e artefato gerado automaticamente.

## 4. Ação

### 4.1 — Criar build script para main.tokens.css

Arquivo: `/var/www/dshowdash/public/components/main/build-tokens.sh`

Comportamento:
- Lê `ui/container-main/styles/modules/01-tokens.css` como fonte canônica
- Gera `main.tokens.css` como artefato (mesmo padrão dos outros build scripts)
- Adiciona header com timestamp, versão e fonte
- Zero @import no output

### 4.2 — Atualizar comentário em main.tokens.css

Remover referência ao caminho antigo. Novo header deve indicar:
- Que é artefato gerado por build-tokens.sh
- Qual é a fonte canônica (modules/01-tokens.css)
- Que não deve ser editado diretamente

### 4.3 — Validar equivalência

Após gerar, comparar conteúdo funcional (sem header) via MD5:
- Conteúdo CSS do main.tokens.css atual vs gerado deve ser idêntico
- Zero diferença visual

## 5. O que NÃO deve ser feito

- Não recriar `_tokens.css` como arquivo separado (duplicação sem automação)
- Não reintroduzir @import
- Não alterar nomes ou valores de variáveis
- Não alterar ordem do bloco :root
- Não editar main.tokens.css diretamente (é artefato)

## 6. Critérios de Aceite

1. Build script existe e funciona:
```bash
bash /var/www/dshowdash/public/components/main/build-tokens.sh
```

2. main.tokens.css é gerado sem @import:
```bash
grep -n "@import" /var/www/dshowdash/public/components/main/main.tokens.css
```
Resultado esperado: zero.

3. Fonte canônica é modules/01-tokens.css:
```bash
ls -la /var/www/dshowdash/public/components/main/ui/container-main/styles/modules/01-tokens.css
```

4. Conteúdo funcional idêntico ao atual (diff apenas no header)

5. Tokens --cm-* presentes:
```bash
grep -c "\-\-cm-" /var/www/dshowdash/public/components/main/main.tokens.css
```

## 7. Resultado Esperado

Após execução:
- Fonte canônica: `modules/01-tokens.css` (editável)
- Artefato: `main.tokens.css` (gerado por build-tokens.sh)
- Performance: inalterada (zero @import)
- Governança: fonte única, artefato automatizado, zero duplicação
- Fluxo de edição: edita módulo → roda build script → artefato atualizado
