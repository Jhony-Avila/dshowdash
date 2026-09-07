// poc3d/Estudio3D.tsx — ROTEADOR CENTRALIZADO do 3D (decisao #161).
// Todo acesso ao "Estudio 3D" (App, MaisPainel, rota direta, atalhos) importa
// este default. Com o Visual Composer ativo (as6.visual_composer OU as6.shell_vc3d),
// abre o VisualComposer3D COMPARTILHADO — nunca o PoC legado. Flag OFF = PoC legado
// byte a byte (Estudio3DLegado, preservado por git mv). Ponto unico de decisao:
// nenhum outro componente decide entre legado e VC3D.
import type { ComponentProps } from 'react';
import { flag } from '../nucleo/flags';
import EstudioLegado from './Estudio3DLegado';
import { Estudio3DPonteVC } from './Estudio3DPonteVC';

export default function Estudio3D(props: ComponentProps<typeof EstudioLegado>) {
  if (flag('as6.visual_composer') || flag('as6.shell_vc3d')) {
    return <Estudio3DPonteVC corDestaque={props.corDestaque} versaoBase={props.versaoBase} aoSalvar={props.aoSalvar} />;
  }
  return <EstudioLegado {...props} />;
}
