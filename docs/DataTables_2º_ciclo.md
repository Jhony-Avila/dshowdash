# PROMPT — DataTables (2º ciclo): erro "Unable to preload CSS" PERSISTE IDÊNTICO após as correções de resiliência — auditar por que a correção não surtiu efeito (DSHOWDASH)

## 1. CONTEXTO — LEIA COM ATENÇÃO: É UMA CORREÇÃO QUE NÃO SURTIU EFEITO

Aplicação **DSHOWDASH** (dshowdash.com.br), módulo **DataTables — Infraestrutura de Dados** (painel `panel-datatables`, build Vite próprio em `/components/panels/panel-datatables/dist/`).

**Histórico do ciclo anterior (já executado por você):**
- Diagnóstico: build íntegro (55 chunks batendo com o manifest, `Bancos.Dxw5u2I1.css` respondendo 200); o erro foi atribuído a sessão em voo durante rebuild (`emptyOutDir: true`).
- Correções implementadas: `cache: 'no-store'` no fetch do manifest (index.js), ErrorBoundary movido para envolver só o `<main>` (App.tsx), helper `lazyComRetry` (re-import com cache-bust), listener de `vite:preloadError` com 1 reload automático e guarda anti-loop em sessionStorage, além de "SW bump".

**PROBLEMA:** o erro **continua aparecendo exatamente igual**, com o **MESMO hash** de antes:

> `Unable to preload CSS for /components/panels/panel-datatables/dist/assets/Bancos.Dxw5u2I1.css`

Isso é incompatível com a teoria de "sessão em voo" — sessões novas continuam tentando o mesmo hash e falhando, e **nenhum dos mecanismos de resiliência agiu** (nem o retry do lazy, nem o reload automático do `vite:preloadError`, nem o "Tentar novamente"). Ou seja: **ou a correção não está de fato em produção, ou algo serve conteúdo velho de forma persistente, ou o diagnóstico anterior estava errado.**

## 2. HIPÓTESES PARA A PERSISTÊNCIA (auditar TODAS, em ordem)

1. **As correções não chegaram ao bundle publicado:** as edições foram feitas em `src/` (App.tsx, lazyComRetry.ts, preloadRecovery.ts) mas **o painel não foi rebuildado/publicado depois** — o `dist/` em produção ainda é o build antigo, sem nada da Fase 3. Verificação direta: procurar as strings/funções novas (`lazyComRetry`, `preloadRecovery`, listener `vite:preloadError`, `no-store`) **dentro dos arquivos buildados em `dist/`** — se não estão no bundle publicado, nada do que foi implementado roda.
2. **Service Worker servindo conteúdo velho:** houve menção a "SW bump". Se existe um service worker cacheando entry/manifest/chunks, ele pode estar entregando o **entry antigo** (que referencia o hash velho) para TODAS as sessões, mesmo após rebuilds — explicaria o mesmo hash persistir. Verificar: qual SW está registrado, o que ele cacheia, se o bump foi realmente publicado, e o conteúdo do cache do SW para o entry/manifest do painel.
3. **O arquivo realmente não existe mais:** re-testar AGORA com `curl -I` a URL exata do erro. Se o 200 do ciclo anterior foi medido após um rebuild que recriou o mesmo conteúdo, mas um rebuild posterior apagou de novo (`emptyOutDir: true` + mais builds), o 404 pode ter voltado. Listar os `Bancos.*.css` existentes hoje e o hash que o manifest atual referencia.
4. **Duas fontes de verdade:** o erro mostra o caminho `/components/panels/panel-datatables/dist/...` — confirmar se o que o navegador busca passa pelo mesmo caminho físico auditado no servidor (possível cópia duplicada da pasta do painel, symlink, ou root do nginx apontando para outro diretório).
5. **Cache intermediário (nginx/proxy/CDN/browser):** headers de cache do entry.js e do HTML que o incorpora — se o entry antigo tem cache longo, sessões novas continuam recebendo o código velho com o hash antigo "assado", e como o entry antigo não tem o listener de `vite:preloadError`, nada se recupera.

**Pergunta-chave que o relatório deve responder:** *qual arquivo JS o navegador está executando quando o erro dispara — o entry novo (com resiliência) ou um antigo?* Tudo deriva disso.

## 3. FASE 1 — AUDITORIA (somente leitura; reproduzir e provar)

1. **Estado do disco AGORA:** `ls -la` de `dist/assets/` (hashes e datas), hash de Bancos no manifest atual, `curl -I` na URL exata do erro e no entry.js.
2. **Bundle publicado contém as correções?** `grep` por `lazyComRetry`, `preloadError`, `no-store` nos arquivos de `dist/` (bundle) — não em `src/`. Registrar o resultado.
3. **Service worker:** localizar o SW (arquivo, versão/bump), o que ele intercepta/cacheia, e se a versão publicada é a nova. Se possível, inspecionar via DevTools (linha por linha, blocos separados) os caches do SW no navegador e **qual entry.js a página carrega de fato** (aba Network: servido do SW? do cache do browser? hash de qual build?).
4. **Reproduzir o erro** e capturar: URL exata solicitada, código de resposta real no Network, origem da resposta (SW/cache/servidor), e se o listener `vite:preloadError` chegou a disparar (log/console).
5. **Caminho físico:** confirmar o root do nginx para `/components/panels/panel-datatables/` e se corresponde ao diretório auditado (descartar duplicidade/symlink).

**Entregável da Fase 1:** relatório respondendo — (a) o bundle em produção contém as correções? (b) qual entry o navegador executa e de onde ele vem (SW/cache/servidor)? (c) o asset existe agora? (d) por que nenhum mecanismo de resiliência agiu? — com evidências (comandos e saídas). **Aguarde minha aprovação antes de corrigir.**

## 4. FASE 2 — CORREÇÃO (após aprovação, conforme o cenário provado)

- **Se o painel não foi rebuildado/publicado:** rebuild + publicação íntegra do `dist/` (manifest + assets do mesmo build), e validação de que as strings da resiliência estão no bundle publicado.
- **Se for o SW:** corrigir a estratégia do SW para os assets do painel (não cachear manifest/entry, ou invalidação correta no bump), garantir que o bump publicado força a atualização, e limpar/instruir a limpeza dos caches velhos. Mudanças no SW são sensíveis — apresente a estratégia antes.
- **Se for cache intermediário:** propor ajuste de headers (nginx) — **só com minha aprovação explícita e backup do config antes**.
- **Se o asset não existe de novo:** voltar à hipótese de pipeline (rebuilds apagando assets referenciados por sessões/manifests servidos) e aplicar a correção adequada, mantendo a decisão anterior de `emptyOutDir: true` só se ela continuar defensável — justifique.
- Após corrigir: **re-testar o cenário real** — sessão nova, navegar até Bancos e por todas as abas; simular falha de chunk (renomear asset temporariamente) e provar que retry automático, "Tentar novamente" e navegação livre funcionam de verdade no bundle publicado; restaurar o asset.

## 5. REGRAS OBRIGATÓRIAS

- Fase 1 é somente leitura — nenhuma alteração antes do relatório aprovado.
- **Não repita correções às cegas:** cada mudança deste ciclo precisa estar amarrada a uma evidência da auditoria.
- Leia os arquivos completos antes de alterar. Para cada arquivo: no mesmo bloco, backup para `/backup` (`Arquivo.ext.bak-YYYYMMDD-HHMMSS`) + reescrita do **arquivo inteiro** via `cat << 'EOF'`, sem suprimir trechos.
- Nunca delete arquivos — mova para `/backup`. Nunca restaure backup de imediato. **Nunca consulte pastas com "react" no nome.**
- Terminal primeiro (`grep`/`find`/`cat`/`curl`/`ls`, sem `echo`), em blocos únicos; DevTools linha por linha em blocos separados, apenas onde indicado.
- Sem gambiarras: nada de desregistrar SW na mão do meu navegador como "solução", nada de copiar asset com hash manualmente — corrija o mecanismo.
- Mostre o diff e aguarde minha confirmação. Documentação por último, após validação completa.

## 6. CRITÉRIOS DE ACEITE

- [ ] Relatório da auditoria respondendo às 4 perguntas-chave com evidências (saídas de comandos).
- [ ] Explicação de por que o ciclo anterior não resolveu (o que foi assumido x o que era de fato).
- [ ] Erro eliminado: sessão nova navega por todas as abas (incluindo Bancos), repetidamente, nos dois temas, sem erro e sem perda de estilo.
- [ ] Resiliência comprovada no bundle publicado com teste de falha simulada (retry automático + "Tentar novamente" recuperando + navegação nunca presa).
- [ ] SW (se envolvido) atualizando corretamente sessões antigas, sem exigir limpeza manual de cache do usuário.
- [ ] Nenhuma regressão em outros módulos.
- [ ] Backups em `/backup`; alterações amarradas às evidências da auditoria.

## 7. RELATÓRIO FINAL

Causa real da persistência, diferença entre o diagnóstico anterior e o comprovado agora, correções aplicadas (arquivos + backups), resultado dos testes (incluindo a falha simulada) e recomendações para evitar reincidência em futuros deploys. Documentação por último.