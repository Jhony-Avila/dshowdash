import { getConfig, getSkipLinksContainer, setSkipLinksContainer } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.accessibility-manager.ui.skip-links";
function _createSkipLinks() {
  const config = getConfig();
  if (getSkipLinksContainer() || !config.enableSkipLinks) return;
  const container = document.createElement("nav");
  container.id = "dsd-skip-links";
  container.setAttribute("aria-label", "Skip navigation");
  container.innerHTML = `
    <style>
      #dsd-skip-links {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 100000;
      }
      #dsd-skip-links a {
        position: absolute;
        top: -100%;
        left: 0;
        padding: 12px 24px;
        background: var(--cm-accent-primary, #8b5cf6);
        color: white;
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;
        border-radius: 0 0 8px 0;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        transition: top 0.2s ease;
      }
      #dsd-skip-links a:focus {
        top: 0;
        outline: none;
      }
    </style>
    <a href="#main-content">Pular para conte\xFAdo principal</a>
    <a href="#main-navigation">Pular para navega\xE7\xE3o</a>
  `;
  document.body.insertBefore(container, document.body.firstChild);
  setSkipLinksContainer(container);
}
export {
  MODULE_ID,
  VERSION,
  _createSkipLinks
};
