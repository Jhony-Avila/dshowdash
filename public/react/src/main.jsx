import React from "react";
import { createRoot } from "react-dom/client";

const App = () => {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>React está funcionando</h1>
      <p>Este React está rodando isolado dentro do DshowDash.</p>
    </div>
  );
};

const container = document.getElementById("react-root");

if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
