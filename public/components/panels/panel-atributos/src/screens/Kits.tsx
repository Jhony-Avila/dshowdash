// panel-atributos/src/screens/Kits.tsx — KITS (dona: ESQUERDA desde 19/11, troca aprovada pelo Jhony). KITS V2: lista e detalhe em
// screens/kits/ (ListaKits, EditorKit, gravacao, comuns, kits-v2.css; regras puras em lib/kits.ts). Aqui só a navegação lista ⇄ detalhe.
import React from 'react';
import '../styles/kits.css';   // diálogo "Adicionar atributos" (classes at-kits-dic-*) continua com o estilo de sempre
import './kits/kits-v2.css';
import { useModulo } from '../app/contexto';
import { ListaKits } from './kits/ListaKits';
import { EditorKit } from './kits/EditorKit';

export function Kits(_: Record<string, unknown> = {}) {
  const nav = useModulo();
  const id = nav.aba === 'kits' ? nav.kit : null;
  const abrir = (k: number | null) => nav.ir('kits', { kit: k });
  const [recemCriado, setRecemCriado] = React.useState<number | null>(null);   // UX-1: "Kit criado. Escolha os atributos…"
  return id ? <EditorKit key={id} id={id} recemCriado={recemCriado === id} aoVoltar={() => abrir(null)} aoAbrir={abrir} />
    : <ListaKits aoAbrir={abrir} aoCriado={(k) => { setRecemCriado(k); abrir(k); }} />;
}
