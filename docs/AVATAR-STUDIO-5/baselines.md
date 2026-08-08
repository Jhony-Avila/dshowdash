# Baselines §605 — Avatar Studio

Gerado por `node scripts/avatar/gerar-baselines.mjs` (determinístico —
regenerar após cada build; o diff no git É o relatório de regressão).

## Peso dos chunks × gate

| chunk | real | teto | uso |
|---|---|---|---|
| Atalhos | 2.2KB | 4KB | 55% |
| catalogo-arte | 290.6KB | 345KB | 84% |
| Consultor | 2.7KB | 9KB | 30% |
| DetalheAsset | 10.2KB | 15KB | 68% |
| entry | 381.3KB | 410KB | 93% |
| Estudio3D | 37.3KB | 50KB | 75% |
| Missoes | 2.2KB | 4KB | 55% |
| motor3d | 1036.1KB | 1180KB | 88% |
| PaletaComandos | 2.5KB | 5KB | 50% |
| react-vendor | 188KB | 225KB | 84% |
| Renderizador3d | 21.3KB | 24KB | 89% |
| TelemetriaDev | 5.7KB | 7KB | 81% |
| TimelineShell | 2.6KB | 5KB | 52% |
| vendor | 34.3KB | 40KB | 86% |
| VersoesAvatar | 2.7KB | 5KB | 54% |

## Cobertura

- Suíte de navegador/node: **72 arquivos** (rodar-todos) + nucleo.test.
- Catálogo 2D: **344 itens** em 12 categorias · 30 títulos · 12 coleções.
- Personagens 3D publicados: **8** (6 legados + base_superhero_m/f do UBC, megas 617-618).
- Feature flags: **61** — 60 `as5.*` + 1 `as6.*` (§605 v2 — nova flag = diff aqui; onda 721+: +foto3d +ual_extra; onda 751+: +as6.estado_vnext com DEPENDENCIAS_FLAGS §3398).
- Chaves de storage conhecidas: **57** locais + IDB (§629):
  - `dshow.avatar.aro.v1`
  - `dshow.avatar.config.v1`
  - `dshow.avatar.conquistas.v1`
  - `dshow.avatar.favoritos.v1`
  - `dshow.avatar.grade.modo.v1`
  - `dshow.avatar.grupos.v1`
  - `dshow.avatar.painel.larg.v1`
  - `dshow.avatar.palco.enq.v1`
  - `dshow.avatar.render.v1`
  - `dshow.avatar.som.v1`
  - `dshow.avatar.usados.v1`
  - `dshow.avst.flags.v1`
  - `dshow.avst.foto.estilo.v1`
  - `dshow.avst5.aba` (sessão; migrada p/ `.v1` — §299, chave antiga permanece)
  - `dshow.avst5.aba.v1` (sessão)
  - `dshow.avst5.apresentacao.ultima.v1`
  - `dshow.avst5.apresentacao.v1`
  - `dshow.avst5.arquivados.v1`
  - `dshow.avst5.bloqueios.v1`
  - `dshow.avst5.consultor.v1`
  - `dshow.avst5.contadores.v1`
  - `dshow.avst5.criticos.v1`
  - `dshow.avst5.evolucao.v1`
  - `dshow.avst5.favoritos.permanentes.v1`
  - `dshow.avst5.foto.export.v1`
  - `dshow.avst5.foto.projetos.v1`
  - `dshow.avst5.foto.tpl.fav.v1`
  - `dshow.avst5.fundo.v1`
  - `dshow.avst5.galerias.v1`
  - `dshow.avst5.gatilho.v1`
  - `dshow.avst5.idioma.v1`
  - `dshow.avst5.larguras.v1`
  - `dshow.avst5.listas.v1`
  - `dshow.avst5.missoes.v1`
  - `dshow.avst5.p3d.cenas.v1`
  - `dshow.avst5.p3d.marca.v1`
  - `dshow.avst5.p3d.personagem.v1`
  - `dshow.avst5.p3d.poses.v1`
  - `dshow.avst5.p3d.qualidade.v1`
  - `dshow.avst5.p3d.roteiros.v1`
  - `dshow.avst5.palco.cenario.v1`
  - `dshow.avst5.palco.clima.v1`
  - `dshow.avst5.palco.hist.v1`
  - `dshow.avst5.palco.hora.v1`
  - `dshow.avst5.palco.luz.v1`
  - `dshow.avst5.palco.luzauto.v1`
  - `dshow.avst5.palco.luzint.v1`
  - `dshow.avst5.palco.titulo.v1`
  - `dshow.avst5.presets.v1`
  - `dshow.avst5.rascunho.v1`
  - `dshow.avst5.recentes.v1`
  - `dshow.avst5.recordes.v1`
  - `dshow.avst5.som.prefs.v1` (§178.2 — só o não-neutro; neutro = chave ausente)
  - `dshow.avst5.som.v1` (§299 — espelho migrado de `dshow.avatar.som.v1`; escrita dual)
  - `dshow.avst5.tema.v1`
  - `dshow.avst5.tour.v1`
  - `dshow.avst5.vitrine.ordem.v1`
- IndexedDB `avst-cache-v1/kv` (§277): manifest remoto + `foto-thumb:<id>` (thumb 96px de projeto de foto, TTL 90d, removida com o projeto).
