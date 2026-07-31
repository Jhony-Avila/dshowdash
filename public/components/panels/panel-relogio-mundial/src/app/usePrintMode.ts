/**
 * app/usePrintMode.ts — libera o painel da casca do shell durante a impressão.
 * @version 3.1.0
 *
 * O PROBLEMA, MEDIDO: a documentação diz que o PDF sai pelo "Salvar como PDF" do
 * navegador. Ao verificar, o documento impresso tinha 940px de altura — UMA página,
 * com todo o resto cortado. A folha `@media print` do painel já devolvia o host ao
 * fluxo, mas isso não bastava: o painel vive dentro de `#main`, que o app-shell
 * declara `position: fixed` com `overflow: hidden auto`. Um contêiner fixo com altura
 * de viewport recorta o conteúdo no papel exatamente como recorta na tela.
 *
 * A SOLUÇÃO E SEU LIMITE: aqui se marca `<html class="wcm-printing">` em
 * `beforeprint` e se remove em `afterprint`. As regras que neutralizam os contêineres
 * do shell vivem sob essa classe E dentro de `@media print`, ou seja: só existem
 * durante uma impressão, e só quando este painel está montado (o efeito é removido no
 * unmount). Fora disso o shell segue intocado.
 *
 * É uma exceção consciente ao escopo do módulo — a folha do painel encosta em
 * seletores do shell. A alternativa era aceitar que "exportar PDF" entregasse um
 * recorte de tela, o que a documentação já prometia não ser.
 */
'use strict';

import { useEffect } from 'react';

const CLASSE = 'wcm-printing';

export function usePrintMode(): void {
  useEffect(() => {
    const antes = () => document.documentElement.classList.add(CLASSE);
    const depois = () => document.documentElement.classList.remove(CLASSE);

    window.addEventListener('beforeprint', antes);
    window.addEventListener('afterprint', depois);

    // Safari/iOS não disparam beforeprint; a media query cobre esses casos.
    const mq = window.matchMedia?.('print');
    const onMq = (e: MediaQueryListEvent) => (e.matches ? antes() : depois());
    mq?.addEventListener?.('change', onMq);

    return () => {
      window.removeEventListener('beforeprint', antes);
      window.removeEventListener('afterprint', depois);
      mq?.removeEventListener?.('change', onMq);
      // Sair do painel no meio de uma impressão não pode deixar a classe grudada.
      depois();
    };
  }, []);
}
