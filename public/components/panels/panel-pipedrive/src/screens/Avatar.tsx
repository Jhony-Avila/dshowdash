// screens/Avatar.tsx — avatar de iniciais com cor determinística (Elevação visual — Fase 3).
// @version 1.0.0  @created 2026-07-24
//
// Sem imagem: o Pipedrive não replica foto na base local. A cor sai de um hash do nome,
// então a mesma pessoa tem sempre a mesma cor (útil para varrer a lista com o olho).
// Luminosidade fixa: legível no tema claro e no escuro sem variante por tema.

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

export function Avatar({ nome, tamanho = 26 }: { nome?: string | null; tamanho?: number }) {
  const txt = (nome ?? '').trim();
  const partes = txt.split(/\s+/).filter(Boolean);
  const iniciais = partes.length === 0 ? '?'
    : (partes.length === 1 ? partes[0].slice(0, 2) : partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  const matiz = txt ? hash(txt) % 360 : 220;
  return (
    <span className="pp-avatar" aria-hidden
      style={{ width: tamanho, height: tamanho, background: `hsl(${matiz} 52% 46%)`, fontSize: tamanho * 0.4 }}>
      {iniciais}
    </span>
  );
}

/** Célula "avatar + título + subtítulo" usada nos grids de pessoas/organizações/usuários. */
export function CelulaComAvatar({ nome, sub }: { nome?: string | null; sub?: string | null }) {
  return (
    <div className="pp-celav">
      <Avatar nome={nome} />
      <div className="pp-celav-txt">
        <div className="pp-td-title">{nome && nome.trim() !== '' ? nome : '—'}</div>
        {sub && <div className="pp-td-sub">{sub}</div>}
      </div>
    </div>
  );
}
