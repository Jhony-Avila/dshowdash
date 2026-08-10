# ADR-002 · Política de versionamento de artefatos (bundles/`dist`)

**Status**: PENDENTE · **Prazo**: M3 (política) / M5 (execução)

## Contexto
63 diretórios `dist` no servidor, majoritariamente ignorados; o boot depende deles
(74+ deps do index). O Git hoje não versiona nenhum artefato. O runtime não pode
depender de arquivos ignorados sem mecanismo formal de geração (invariante I4).

## Opções
1. **Artefatos nunca versionados; gerados no release por build reproduzível** (padrão da indústria).
   Vantagens: repo limpo; obriga reprodutibilidade. Riscos: exige M5 completo antes do corte; janela em que rollback depende de `/backup` + hashes.
2. **Versionar temporariamente os artefatos ativos** (snapshot governado) e remover após build canônico.
   Vantagens: fecha BASAL-001 imediatamente; rollback via Git. Riscos: repo incha (~63 dists); risco de consagrar artefato como fonte; conflita com histórico "dist nunca entra" do .gitignore.
3. **Híbrido**: versionar apenas manifesto + hashes (não os bytes), com cópia física preservada em `/backup`.
   Vantagens: rastreabilidade sem inchar o repo. Riscos: restauração depende do `/backup` fora do Git.

## Decisão provisória
Opção 3 já na Onda 1 (hashes no baseline via coletor; bytes preservados em `/backup`),
convergindo para a opção 1 quando o M5 provar o build reproduzível. Nenhum artefato
recebe edição manual em nenhum cenário.

## Evidência necessária
Manifesto de hashes coletado; prova de restauração a partir de `/backup`; primeiro
bundle reproduzido byte-a-byte (ou com diff explicado) por clone limpo.
