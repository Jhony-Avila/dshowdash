const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.update-notifier.styles";
function injectStyles() {
  if (document.getElementById("update-notifier-styles")) return;
  const styles = document.createElement("style");
  styles.id = "update-notifier-styles";
  styles.textContent = `
    .dsd-update-notification {
      position: fixed;
      z-index: 10000;
      padding: 16px;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: none;
    }
    
    .dsd-update-notification--visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    
    .dsd-update-notification--bottom-right {
      bottom: 0;
      right: 0;
    }
    
    .dsd-update-notification--bottom-left {
      bottom: 0;
      left: 0;
    }
    
    .dsd-update-notification--top-right {
      top: 0;
      right: 0;
    }
    
    .dsd-update-notification--top-left {
      top: 0;
      left: 0;
    }
    
    .dsd-update-notification__content {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(109, 40, 217, 0.95));
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(8px);
      color: white;
      font-family: var(--cm-font-family, system-ui, sans-serif);
      font-size: 14px;
      max-width: 400px;
    }
    
    .dsd-update-notification__icon {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
    }
    
    .dsd-update-notification__text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .dsd-update-notification__text strong {
      font-weight: 600;
    }
    
    .dsd-update-notification__version {
      font-size: 12px;
      opacity: 0.8;
    }
    
    .dsd-update-notification__actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
    
    .dsd-update-notification__btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .dsd-update-notification__btn--primary {
      background: white;
      color: #6d28d9;
    }
    
    .dsd-update-notification__btn--primary:hover {
      background: #f3f4f6;
      transform: translateY(-1px);
    }
    
    .dsd-update-notification__btn--secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
    
    .dsd-update-notification__btn--secondary:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    @media (max-width: 480px) {
      .dsd-update-notification {
        left: 0;
        right: 0;
        padding: 12px;
      }
      
      .dsd-update-notification__content {
        max-width: none;
        flex-wrap: wrap;
      }
      
      .dsd-update-notification__actions {
        width: 100%;
        margin-top: 8px;
      }
      
      .dsd-update-notification__btn {
        flex: 1;
      }
    }
    
    @media (prefers-reduced-motion: reduce) {
      .dsd-update-notification {
        transition: none;
      }
    }
  `;
  document.head.appendChild(styles);
}
export {
  MODULE_ID,
  VERSION,
  injectStyles
};
