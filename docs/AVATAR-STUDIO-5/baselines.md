# Baselines §605 — Avatar Studio

Gerado por `node scripts/avatar/gerar-baselines.mjs` (determinístico —
regenerar após cada build; o diff no git É o relatório de regressão).

## Peso dos chunks × gate

| chunk | real | teto | uso |
|---|---|---|---|
| catalogo-arte | 290.6KB | 345KB | 84% |
| entry | 278.6KB | 295KB | 94% |
| Estudio3D | 37.3KB | 50KB | 75% |
| motor3d | 1020.7KB | 1180KB | 87% |
| react-vendor | 188KB | 225KB | 84% |
| Renderizador3d | 16.9KB | 20KB | 85% |
| vendor | 33KB | 40KB | 83% |

## Cobertura

- Suíte de navegador/node: **41 arquivos** (rodar-todos) + nucleo.test.
- Catálogo 2D: **344 itens** em 12 categorias · 30 títulos · 12 coleções.
- Personagens 3D publicados: **6**.
