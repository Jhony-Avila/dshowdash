# Pipeline de Assets 3D — Avatar Studio (AS5 F5 · P8 §406–§517)

Preparado para MILHARES de assets desde o dia 1: nomenclatura estável,
manifesto por asset (§478/§517), licença rastreada (§511/§512), fonte
bruta FORA do público (§513) e LODs/previews como cidadãos de primeira
classe (§461/§509).

## 1. O que baixar (uma única vez)

| Item | Valor |
|---|---|
| Pacote | **Ultimate Base Characters — [Standard]** |
| Autor/loja | Quaternius · https://quaternius.itch.io/ (buscar "Ultimate Base Characters") |
| Arquivo | o zip da versão **Standard** (rigged, formato **glTF/GLB** incluído) |
| Licença | CC0 — mesmo assim guardamos o comprovante (§511) |
| Onde colocar | `/var/www/dshowdash/storage/assets-3d-fonte/ubc-standard-v1/` (extraído, com o zip original ao lado) |

Do pacote, o que USAMOS de fato: os `.glb`/`.gltf` dos personagens base
(masc/fem/neutro), o rig/skeleton, as animações idle/walk/pose e as
texturas base. O que DESCARTAMOS (fica só na fonte, nunca copiado ao
público): formatos duplicados (FBX/OBJ/Blend), cenas de exemplo e arquivos
de engine (Unity/Unreal).

## 2. Estrutura de diretórios (contrato)

```
storage/assets-3d-fonte/            ← BRUTO (nunca servido; §513)
  ubc-standard-v1/
    original.zip                    ← zip intocado (proveniência §512)
    LICENSE.txt                     ← comprovante da licença (§511)
    extraido/…                      ← conteúdo original sem edição

public/assets/avatars/3d/           ← SERVIDO (política: CURADOS versionados como no AS4 — poucos MB; a FARM UBC em massa fica fora do git)
  personagens/<slug>/               ← ex.: base_humano_m
    modelo.lod0.glb                 ← qualidade máxima (§423.3 premium)
    modelo.lod1.glb                 ← padrão (§423.2)
    modelo.lod2.glb                 ← econômico/mobile (§423.1)
    thumb.webp                      ← 128px (grade)
    preview.webp                    ← 512px (drawer/hero)
    manifest.json                   ← contrato §517 (abaixo)
  animacoes/<slug>.glb              ← clipes compartilhados (idle, walk…)
  texturas/<slug>/…                 ← KTX2/Basis quando o pipeline comprimir (§465)
```

## 3. Manifesto por asset (§478/§517 — validado antes de publicar)

```json
{
  "id": "base_humano_m",
  "tipo": "personagem_base",
  "versao": 1,
  "rig": "ubc-v1",
  "lods": { "lod0": "modelo.lod0.glb", "lod1": "modelo.lod1.glb", "lod2": "modelo.lod2.glb" },
  "hashes": { "lod0": "sha256:…", "lod1": "sha256:…", "lod2": "sha256:…" },
  "triangulos": { "lod0": 0, "lod1": 0, "lod2": 0 },
  "animacoes": ["idle", "walk"],
  "licenca": { "tipo": "CC0", "fonte": "quaternius.itch.io", "comprovante": "storage/assets-3d-fonte/ubc-standard-v1/LICENSE.txt" },
  "origem": "ubc-standard-v1",
  "criado_em": "AAAA-MM-DD"
}
```

## 4. Regras de nomenclatura

`snake_case`, ASCII, sem espaços (lição do GLTFLoader que sanitiza nomes:
'Wrist.R' → 'WristR' — nomes de bones NUNCA são renomeados por nós, o
retargeting §436 depende deles). Slug = `tipo_tema_variacao`
(ex.: `roupa_executivo_terno`, `cabelo_cyber_moicano`).

## 5. Fluxo de publicação de um asset (quando o zip chegar)

1. Extrair na FONTE (`storage/assets-3d-fonte/...`) — nada é editado ali.
2. Converter/exportar o GLB por LOD (lod0 original; lod1/lod2 via
   decimação — documentar a ferramenta usada no manifest).
3. Gerar thumb/preview (captura determinística §508 — o Renderizador do
   contrato §401 fará isso no F5; até lá, captura manual padronizada).
4. Calcular hashes sha256 e preencher o `manifest.json`.
5. Validar (validador §487 — próximo passo do F5: script
   `scripts/avatar/assets3d/validar-asset.mjs` que confere manifesto,
   hashes, tamanho, nomes de bones do rig ubc-v1 e limites de triângulos
   §468 por LOD).
6. Publicar em `public/assets/avatars/3d/` + registrar no asset registry
   (§614 — tabelas `avatar_asset_versions`/`avatar_asset_files` do
   as5_schema, com hash e status; é por isso que o passo root vem antes).

## 6. Limites de qualidade (gate §631 · §468/§469)

lod0 ≤ 60k triângulos · lod1 ≤ 25k · lod2 ≤ 8k · textura ≤ 2048px (lod0)
/ 1024px (lod1) / 512px (lod2) · nenhum material com mais de 4 mapas ·
FPS alvo: 60 desktop / 30 mobile no palco com 1 personagem + cenário.

## 7. FERRAMENTAS PRONTAS (mega 5 · 2026-08-03) — publicar é UM comando por asset

Quando o zip UBC estiver em `storage/assets-3d-fonte/ubc-standard-v1/`:

```bash
# 1. publicar (LODs no gate §631 + hashes + manifest §517 + validador §487)
node scripts/avatar/assets3d/publicar-asset.mjs \
  --fonte storage/assets-3d-fonte/ubc-standard-v1/extraido/<PERSONAGEM>.glb \
  --saida public/assets/avatars/3d/personagens/<slug> --id <slug> \
  --animacoes idle,walk --data $(date +%F)

# 2. thumbs determinísticos §508 (Chromium headless)
node scripts/avatar/assets3d/gerar-thumbs-3d.mjs public/assets/avatars/3d/personagens/<slug>

# 3. conferir (agora sem pendências)
node scripts/avatar/assets3d/validar-asset.mjs public/assets/avatars/3d/personagens/<slug>

# 4. registro §614 → SQL p/ o runner do servidor
node scripts/avatar/assets3d/gerar-registro-sql.mjs \
  public/assets/avatars/3d/personagens/<slug> --saida sql/avatar/registro-<slug>.sql
```

No PRIMEIRO personagem real: preencher `scripts/avatar/assets3d/rig-ubc-v1.json`
com os nomes de bones do GLB (o validador passa a exigir presença exata).
Manequim de desenvolvimento: `gerar-manequim.mjs <saida.glb> [--denso]`.
Teste E2E de tudo: `node scripts/avatar/testes/pipeline3d.test.mjs`.
