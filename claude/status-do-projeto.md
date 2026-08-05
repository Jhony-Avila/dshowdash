# Status do Projeto — Avatar Studio (no repo)

> Atualizado a cada lote. Fonte viva: docs do projeto Claude "Avatar Studio"
> (04-status-do-projeto). Última atualização: **2026-08-05, lote 221–230**.

## Marco atual

- **220 megas** entregues até `32eb4a30` (211–220 no main; verificação de
  deploy do webhook pendia na criação desta sessão).
- **Lote 221–230 PRONTO nesta árvore**: 3 commits temáticos
  (megas 221–225 Photo PRO · 226–227 editor showcase · 228–230 timeline/
  favoritos/vitrine) + gate/baselines + esta pasta `claude/`.
- Suíte: **47 arquivos** em `rodar-todos.mjs` (3 novos: foto-canvas-pro,
  showcase-editor, onda-230) + nucleo.test.
- Byte-stability do render da foto VERIFICADA contra HEAD anterior com
  fixture determinística (estilos legados byte a byte).

## Rota de entrega desta sessão

Push direto NEGADO (403 do proxy — repo não conectado na criação da
sessão). Rota: **bloco único no terminal SSH do servidor** — patch do lote
em base64 embutido → /tmp → sha256 → worktree de origin/main → `git am` →
push pelo servidor → webhook #47 deploya sozinho.

## Como retomar (sessão nova)

1. Clonar o repo; ler `claude/*.md` (esta pasta).
2. Briefing: `git show 006a394b:docs/BRF_AVATAR_STUDIO.md > /tmp/briefing.md`.
3. Infra de testes: ver `claude/contexto-geral.md` (harness da Home exige
   build do panel-dashboard).
4. Testar rota de push (`git push --dry-run origin HEAD:refs/heads/teste-acesso-push`);
   403 → rota patch/bloco SSH.
5. Próxima onda: mega **231+** — sequência recomendada em
   `claude/mapa-lacunas.md`; decisões novas a partir de **#53**.

## Pendências (Jhony)

Validação visual 201–210 / 211–220 / 221–230 · confirmação do deploy do
webhook (bloco no doc 08 do projeto) · chave IA · zip UBC · rotação PAT +
secret do webhook · nexatechs.com.br · trilho C.
