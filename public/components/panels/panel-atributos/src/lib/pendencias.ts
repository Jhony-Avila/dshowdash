// "FOI SALVO OU NÃO" (item 5): beforeunload SÓ enquanto houver rascunho não enviado ou operação pendente (resultado ainda não confirmado).
// Cada campo registra/retira a própria pendência; o ouvinte existe só com pendência > 0 e sai quando a última resolve.
const ativas = new Set<string>();
const aoSair = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
export function marcarPendencia(chave: string, ativa: boolean): void {
  const antes = ativas.size;
  if (ativa) ativas.add(chave); else ativas.delete(chave);
  if (antes === 0 && ativas.size > 0) window.addEventListener('beforeunload', aoSair);
  if (antes > 0 && ativas.size === 0) window.removeEventListener('beforeunload', aoSair);
}
export const pendenciasAtivas = () => ativas.size;
