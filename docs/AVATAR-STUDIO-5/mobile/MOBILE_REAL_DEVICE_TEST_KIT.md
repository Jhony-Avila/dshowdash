# Track C Mobile — Kit de Validação em Device Real

> `REAL_DEVICE_VALIDATION = PENDING`. Este kit é o roteiro para o Jhony validar
> em iPhone e Android físicos. Chromium desktop **não** substitui esta etapa.

## 1. Subir o ambiente local (mesma rede Wi-Fi do celular)

```bash
cd public/components/panels/panel-avatar-studio && npx vite build && cd -
node scripts/avatar/gerar-harness.mjs avatar
cd public && python3 -m http.server 8901 --bind 0.0.0.0
```

Descobrir o IP da máquina na LAN e montar a URL:

```bash
IP=$(hostname -I 2>/dev/null | awk '{print $1}'); echo "http://$IP:8901/avst-harness.html"
```

QR code (opcional, se `qrencode` disponível):

```bash
qrencode -t ANSIUTF8 "http://$IP:8901/avst-harness.html"
```

Para o **produto autenticado real** (não o harness), usar a URL de produção do
DShowDash com a flag `as6.mobile_studio` ligada só para a sessão de teste.

## 2. Ligar a composição mobile no device

No console do navegador do celular (ou via flag remota):
```js
localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true }));
location.reload();
```

## 3. Checklist retrato

- [ ] Shell carrega, palco emoldurado e visível no topo.
- [ ] Trilho de categorias rola na horizontal e faz snap.
- [ ] Rosto/Olhos/Cabelo/Roupa/Calçados alcançáveis; palco reenquadra.
- [ ] Grade de assets 2 colunas; toque seleciona.
- [ ] Cores/variantes por toque.
- [ ] Barra de salvar fixa no rodapé, sempre visível.
- [ ] Notch/safe-area respeitados no topo e no rodapé.

## 4. Checklist paisagem

- [ ] Palco menor, tudo cabe, sem overflow horizontal.
- [ ] Notch lateral respeitado.
- [ ] Girar o device liga/desliga sem recarregar; estado preservado.

## 5. Login / sessão

- [ ] Fazer login real; sessão autenticada persiste.
- [ ] Estado do avatar carrega do backend.

## 6. Edição e save

- [ ] Editar → estado "pendente" aparece.
- [ ] Salvar → confirmação; recarregar mantém as mudanças.
- [ ] Sem duplo-envio perceptível (nota P2 sobre duplo-clique).

## 7. Leitor de tela

- [ ] VoiceOver (iOS) / TalkBack (Android): navegação por categorias anuncia nome
      e estado (ativa).
- [ ] Ferramenta abre como diálogo; foco entra; fechar anuncia.

## 8. Teclado virtual

- [ ] Focar campo (ex.: Títulos/busca): teclado abre, campo visível.
- [ ] Barra de salvar sai de cima do teclado.
- [ ] Sem zoom automático ao focar (campos 16px).

## 9. Captura de evidência

- [ ] Console/rede via Safari (Web Inspector) ou Chrome (chrome://inspect).
- [ ] Screenshots retrato + paisagem.
- [ ] Gravação de tela do fluxo entry→save.

## 10. Formulário de aprovação

```
Device:            [iPhone modelo / Android modelo]
OS/Browser:        [iOS xx Safari / Android xx Chrome]
Retrato:           [ APROVADO / REPROVADO ]  obs:
Paisagem:          [ APROVADO / REPROVADO ]  obs:
Login/sessão:      [ APROVADO / REPROVADO ]  obs:
Edição/save:       [ APROVADO / REPROVADO ]  obs:
Leitor de tela:    [ APROVADO / REPROVADO ]  obs:
Teclado:           [ APROVADO / REPROVADO ]  obs:
Notch/safe-area:   [ APROVADO / REPROVADO ]  obs:
VEREDITO FINAL:    [ APROVADO / REPROVADO ]
Assinatura/data:
```

## 11. Verificação de porta e firewall
```bash
PORTA=8901; (exec 3<>/dev/tcp/127.0.0.1/$PORTA) 2>/dev/null && echo "porta ocupada, escolha outra" || echo "porta livre"
```
Se o celular não abrir a URL LAN: liberar a porta no firewall do host
(ex.: `sudo ufw allow 8901/tcp`) e garantir host+celular na MESMA rede Wi-Fi.

## 12. HTTPS local (se algum recurso exigir contexto seguro)
Alguns recursos (ex.: certos sensores) exigem HTTPS. Opção local SEM publicar:
`mkcert` para um certificado de dev + servir com um proxy TLS local
(`http-server -S -C cert.pem -K key.pem`), ou túnel local confinado à LAN.
Não publicar o ambiente na internet.

## 13. Exportação de evidências
- Screenshots: retrato + paisagem por device.
- Gravação de tela do fluxo entry→save.
- Console/rede: Safari Web Inspector (iOS) / chrome://inspect (Android).
- Consolidar num zip por device com o formulário de aprovação preenchido.

## 14. Roteiro Tablet
- [ ] 768×1024 retrato = stack mobile; 1024×768 paisagem = grid desktop.
- [ ] Sem overflow; palco e catálogo confortáveis.
