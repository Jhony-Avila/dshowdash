# Status do Projeto — Avatar Studio (no repo)

> Atualizado a cada lote. Fonte viva: docs do projeto Claude "Avatar Studio"
> (04-status-do-projeto). Última atualização: **2026-08-06, onda 261–310**.

## Marco atual

- **260 megas EM PRODUÇÃO** (deploy `00782ac → 72d1993`, 2026-08-05).
- **Onda 261–310 PRONTA nesta árvore** (50 megas, 5 commits temáticos):
  261–270 PALCO 3D v2 (§440–§458, `as5.palco3d_v2`) · 271–280 FUNDAÇÕES
  (§267/§274–§277/§283/§287/§290–§291, `as5.fundacoes_v2`) · 281–290
  PODERES POR FAMÍLIA (§153.1–.4/§156, `as5.poderes_familia`) · 291–300
  PROGRESSÃO v3 + microinterações (§216/§222–§224/§548/§566/§568,
  `as5.microinteracoes`) · 301–310 A11y/QA/consolidação (P10).
- Suíte: **54 arquivos** + nucleo.test — verdes antes da entrega.
  Novos: palco3d-v2, fundacoes-v2, poderes-familia, progressao-v3.
- Lazy §275: 8 painéis do shell viram chunks sob demanda; entry
  380→~362KB. Gate cobre os chunks novos (pesos-esperados).
- Decisões #55 (escopo da onda) e #56 (adaptações vs. mapa) nos docs do
  projeto Claude; espelho operacional em `claude/decisoes.md`.

## Como retomar (sessão nova)

1. Clonar; ler `claude/*.md`. 2. Briefing: `git show 006a394b:docs/BRF_AVATAR_STUDIO.md`.
3. Infra de testes no `claude/contexto-geral.md` (harness da Home exige build
   do panel-dashboard; vite build DENTRO do dir do painel; harness da RAIZ).
4. Rota de push: dry-run; 403 → bloco SSH (comprovado 3×).
5. Próxima onda: mega **311+**; decisões a partir de **#57**; candidatos
   em `claude/mapa-lacunas.md` (foto fina §333/§340–341/§369/§372 ficou
   de fora da 281–290 — registrado na decisão #56).

## Pendências (Jhony)

Validação visual 221–230, 231–260 e 261–310 · webhook: rotacionar o secret
NOVAMENTE (o 1º vazou no chat) + Update no GitHub + Redeliver · chave IA ·
zip UBC · rotação PAT · nexatechs.com.br · trilho C.
