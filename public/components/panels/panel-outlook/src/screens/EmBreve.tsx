// screens/EmBreve.tsx — placeholder de aba planejada para fase futura.
// @version 1.0.0  @created 2026-07-21

export function EmBreve({ titulo, descricao, fase }: { titulo: string; descricao: string; fase: string }) {
  return (
    <div className="ol-empty">
      <div className="ol-empty-icon" aria-hidden>🚧</div>
      <h2 className="ol-empty-title">{titulo}</h2>
      <p className="ol-empty-desc">{descricao}</p>
      <span className="ol-badge-fase">{fase}</span>
    </div>
  );
}
