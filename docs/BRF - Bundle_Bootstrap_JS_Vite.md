# BRIEFING — Bundle do Bootstrap JS via Vite

## 1. Contexto e Problema

O bootstrap-v2 contém 205 arquivos JS que geram 148 requests HTTP no first load.
Cada `import` em um ES Module dispara um request separado no browser — isso cria
waterfall de requests que leva ~1.3 segundos antes da aplicação ficar interativa.

O CSS já foi resolvido (92 requests eliminados via bundles). O JS é o próximo gargalo.

Diferente de CSS, JS não pode ser concatenado simplesmente — imports/exports, escopos
e hoisting impedem concatenação manual. É necessário um bundler real.

## 2. Recurso Disponível

Já existe uma instalação React+Vite em /var/www/dshowdash/public/react/
com Vite 5.x instalado. O Vite será usado APENAS como bundler — não como
framework React. O Vite resolve imports, faz tree-shaking e gera bundles otimizados.

## 3. Objetivo

Usar o Vite para gerar um bundle único (ou poucos bundles) do bootstrap-v2,
reduzindo 148 requests JS para ~1-3 requests no first load.

Comportamento funcional deve ser 100% idêntico ao atual.

## 4. Estratégia

### 4.1 — Configuração do Vite como Bundler

Criar configuração Vite dedicada para o bootstrap (separada do React):
/var/www/dshowdash/public/bootstrap-v2/vite.bundle.config.js

Configuração deve:
- Entry point: bootstrap-v2/loader/index.js
- Output: bootstrap-v2/dist/bootstrap.bundle.js
- Format: ES module (para manter compatibilidade com type="module" no index.html)
- Resolver alias para paths absolutos (/core/*, /config/*, /components/*)
- Sem minificação na primeira versão (facilita debug e diff)
- External: dependências fora do bootstrap (core/runtime/*, components/*, etc.)
  que já são carregadas separadamente

### 4.2 — Resolução de Imports Externos

O bootstrap importa de fora do seu diretório:
- /core/runtime/enterprise/strict-mode.js
- /core/runtime/events/catalog/boot.events.js
- /core/runtime/enterprise/governance-telemetry-bridge.js
- /core/services/toast-service.js (indireto via phases)

Estas dependências externas devem ser marcadas como `external` no Vite config,
pois continuam sendo carregadas como módulos separados pelo browser.
O bundle agrupa apenas os ~148 arquivos INTERNOS do bootstrap-v2.

### 4.3 — Build Script

Criar: /var/www/dshowdash/public/bootstrap-v2/build-bundle.sh
```bash
#!/bin/bash
cd /var/www/dshowdash/public/react
npx vite build --config ../bootstrap-v2/vite.bundle.config.js
```

### 4.4 — Atualização do index.html

Substituir:
```html
<script type="module" src="/bootstrap-v2/loader/index.js"></script>
```

Por:
```html
<script type="module" src="/bootstrap-v2/dist/bootstrap.bundle.js"></script>
```

## 5. Fases de Execução

### FASE 1 — Diagnóstico (obrigatório antes de qualquer ação)
1. Mapear TODOS os imports externos do bootstrap-v2 (fora do diretório)
2. Mapear o grafo de dependências interno (quem importa quem)
3. Verificar se o Vite/node está funcional: `cd /var/www/dshowdash/public/react && npx vite --version`
4. Apresentar diagnóstico completo antes de criar config

### FASE 2 — Configuração e Build
1. Criar vite.bundle.config.js
2. Criar build-bundle.sh
3. Executar primeiro build
4. Validar output: verificar que o bundle existe e tem conteúdo
5. Verificar syntax: node --check no bundle (se possível) ou análise manual

### FASE 3 — Integração
1. Backup do index.html
2. Atualizar referência do script
3. Hard reload no browser
4. Validar no DevTools que o bootstrap funciona (console sem erros)
5. Medir requests JS antes/depois

### FASE 4 — Validação
1. Toda a sequência de boot deve completar sem erros
2. Console deve mostrar "All bridges initialized"
3. Navegação deve funcionar
4. Número de requests JS deve cair de ~148 para ~15-20 (bootstrap bundled + external deps)

## 6. O que NÃO fazer
- Não migrar código para React/TypeScript
- Não alterar lógica do bootstrap
- Não minificar na primeira versão
- Não bundlar dependências externas (core/*, components/*)
- Não remover os arquivos fonte do bootstrap (continuam como código-fonte editável)
- Não alterar imports dentro dos arquivos fonte

## 7. Critérios de Aceite
1. `ls -la /var/www/dshowdash/public/bootstrap-v2/dist/bootstrap.bundle.js` existe
2. Bootstrap inicia sem erros no console
3. Requests JS no Network tab: redução de 148 bootstrap requests para 1
4. "All bridges initialized" aparece no console
5. Navegação funciona normalmente
6. Build script reproduzível: `bash build-bundle.sh` gera o bundle

## 8. Rollback
Se algo falhar:
1. Restaurar index.html do backup
2. O bootstrap original (205 arquivos) continua intacto — nunca é alterado
3. O bundle é apenas um artefato de build

## 9. Resultado Esperado
- Antes: 148 requests JS do bootstrap, ~286KB fragmentado, ~1.3s waterfall
- Depois: 1 request JS do bootstrap, ~286KB bundle, ~200-400ms single load
- Fonte editável: 205 arquivos originais preservados
- Artefato: dist/bootstrap.bundle.js gerado por build script
