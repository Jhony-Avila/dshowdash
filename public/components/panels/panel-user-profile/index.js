import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { COMPONENT_EVENTS } from "/core/runtime/events/catalog/component.events.js";
import { render, renderAuthBlockedView } from "./ui/renderer.js";
import Store from "./state/store.js";
import { EVENTS } from "./core/constants.js";
const MODULE_ID = "panels/panel-user-profile";
const VERSION = "9.5.0-AVATAR-STUDIO";
const getVersion = () => VERSION;
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();

// Endpoints reais e funcionais (validados 2026-07-08):
// - check.php: autenticação + csrf_token (data.session.csrf_token) + user
// - user/profile.php (singular): leitura de perfil por sessão (o plural users/profile.php
//   consulta colunas inexistentes no schema atual -> quebrado, não usar)
// - avatars/list.php: galeria de avatares {avatars:[{filename,url,name}]}
// - user/avatar.php: persiste avatar (grava app_user_avatars + espelha app_users.avatar_url)
const ENDPOINTS = {
  check: "/api/auth/check.php",
  profile: "/api/user/profile.php",
  avatars: "/api/avatars/list.php",
  avatarSave: "/api/user/avatar.php"
};

const _isAuthenticated = () => {
  const auth = _getPort("auth");
  if (auth?.isAuthenticated?.()) return true;
  if (typeof window === "undefined") return false;
  const strictMode = isStrict();
  if (window.Core?.windowAdapter?.get) {
    const sm = window.Core.windowAdapter.get("SessionManager");
    if (sm?.isAuthenticated?.()) return true;
  }
  if (strictMode) return false;
  if (window.SessionManager?.isAuthenticated?.()) {
    recordViolation("WINDOW_SESSIONMANAGER_FALLBACK", { module: MODULE_ID, method: "_isAuthenticated" });
    return true;
  }
  return false;
};
const _isDocumentVisible = () => typeof document !== "undefined" && !document.hidden;

// Injeta o CSS do painel (.pup) — padrão dos demais painéis. A UI rica é servida crua e
// depende de styles/index.css; sem isto o painel renderiza como texto sem layout.
(() => {
  const cssPath = "/components/panels/panel-user-profile/styles/index.css";
  if (typeof window !== "undefined" && window.AssetLoader) window.AssetLoader.loadCSS(cssPath);
  else if (typeof document !== "undefined" && !document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    link.setAttribute("data-painel", "panel-user-profile");
    document.head.appendChild(link);
  }
})();

function _getEventBus() {
  const eb = _getPort("eventBus");
  if (eb) return eb;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    return window.Core.windowAdapter.get("EventBus");
  }
  return null;
}

function _emit(eventName, data) {
  const eb = _getEventBus();
  if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data || {}));
}

async function _fetchJson(url, options) {
  try {
    const r = await fetch(url, Object.assign({ credentials: "include" }, options || {}));
    const body = await r.json().catch(() => null);
    return { ok: r.ok && !!body && body.ok !== false, status: r.status, body };
  } catch (e) {
    return { ok: false, status: 0, body: null, error: e.message };
  }
}

// Adapta o contrato do backend (user/profile.php + check.php) para o shape que o template espera.
function _mapProfile(p, user) {
  p = p || {};
  user = user || {};
  const rawAvatar = p.avatar || p.avatar_url || user.avatar_url || user.avatar || "";
  const avatarUrl = rawAvatar && !String(rawAvatar).includes("default") ? rawAvatar : "";
  const email = p.email || user.email || "";
  const sessionName = p.name || user.name || user.username || "";
  const fullName = p.nome_completo || p.nome || sessionName;
  const displayName = p.nome_resumido || p.nome || sessionName;
  return {
    id: user.id != null ? user.id : (p.id != null ? p.id : "—"),
    fullName,
    displayName,
    username: user.username || (email ? String(email).split("@")[0] : sessionName),
    email,
    roleName: p.role || user.role || "Usu\xE1rio",
    roleLevel: p.level != null ? p.level : (user.level != null ? user.level : 1),
    status: p.status || user.status || "active",
    locale: user.locale || "pt-BR",
    avatarUrl,
    lastLoginAt: p.last_login || user.last_login_at || null,
    createdAt: user.created_at || null,
    updatedAt: user.updated_at || null,
    department: p.departamento || "",
    jobTitle: p.funcao || ""
  };
}

class UserProfileComponent {
  constructor(options = {}) {
    _initPorts();
    this.container = options.container || null;
    this.config = options.config || {};
    this.eventBus = options.eventBus || _getPort("eventBus");
    this.store = Store;
    this._csrf = null;
    this._unsub = null;
    this._mounted = false;
    this._initialized = false;
    this._suppressRender = false;
    this._metrics = { mountCount: 0, errorCount: 0, fetchCount: 0, saveCount: 0, lastFetchAt: null };
    this._handlers = this._buildHandlers();
  }

  init(ctx = {}) {
    if (this._initialized) return this;
    this._ctx = ctx || {};
    this._initialized = true;
    return this;
  }

  _buildHandlers() {
    const self = this;
    return {
      toggleAvatarPicker: () => self.store.setShowAvatarPicker(!self.store.getState().showAvatarPicker),
      closeAvatarPicker: () => self.store.setShowAvatarPicker(false),
      selectAvatar: (url) => { if (url) self.store.setAvatar(url); },
      openAvatarStudio: () => { if (typeof window !== "undefined") window.location.hash = "#/panel-avatar-studio"; },
      updateField: (field, value) => {
        // Edição de texto: NÃO reconstruir o innerHTML a cada tecla (perderia foco/cursor do input).
        // O input já reflete o valor digitado; aqui só atualizamos o store (dirty) e mostramos o footer.
        if (self.container) { const f = self.container.querySelector(".pup-footer"); if (f) f.classList.add("visible"); }
        self._suppressRender = true;
        self.store.updateProfileField(field, value);
        self._suppressRender = false;
      },
      cancel: () => self._loadData(),
      save: () => self._save(),
      openLogin: () => _emit("auth:login:request", {})
    };
  }

  _renderNow() {
    if (!this.container || this._suppressRender) return;
    render(this.container, this.store.getState(), this._handlers);
  }

  mount(container) {
    if (this._mounted) return Promise.resolve(this);
    this.container = container || this.container;
    if (!this.container) return Promise.resolve(this);
    if (!_isAuthenticated()) {
      renderAuthBlockedView(this.container, this._handlers);
      return Promise.resolve(this);
    }
    this.store.reset();
    this.store.setMounted(true);
    this.store.setLoading(true);
    this._unsub = this.store.subscribe(() => this._renderNow());
    this._renderNow();
    this._mounted = true;
    this._metrics.mountCount++;
    this._loadData();
    this.eventBus?.emit?.(COMPONENT_EVENTS.MOUNTED, { componentId: "user-profile", moduleId: MODULE_ID, timestamp: Date.now() });
    _emit(EVENTS.MOUNTED, {});
    return Promise.resolve(this);
  }

  async _loadData() {
    if (!this._mounted && !this.container) return;
    if (!_isAuthenticated()) { renderAuthBlockedView(this.container, this._handlers); return; }
    this.store.setLoading(true);
    this._metrics.fetchCount++;
    this._metrics.lastFetchAt = Date.now();
    const results = await Promise.all([
      _fetchJson(ENDPOINTS.check),
      _fetchJson(ENDPOINTS.profile),
      _fetchJson(ENDPOINTS.avatars)
    ]);
    const checkR = results[0];
    const profR = results[1];
    const avaR = results[2];
    const user = checkR.body && checkR.body.data ? checkR.body.data.user : null;
    const session = checkR.body && checkR.body.data ? checkR.body.data.session : null;
    if (session && session.csrf_token) this._csrf = session.csrf_token;
    if (avaR.ok && avaR.body && avaR.body.data && Array.isArray(avaR.body.data.avatars)) {
      this.store.setAvatars(avaR.body.data.avatars);
    }
    if (profR.ok && profR.body && profR.body.data) {
      this.store.setProfile(_mapProfile(profR.body.data, user));
      this.store.setError(null);
    } else {
      this._metrics.errorCount++;
      this.store.setError("Falha ao carregar perfil");
    }
    this.store.setLoading(false);
  }

  async _save() {
    const p = this.store.getState().profile;
    if (!p) return;
    this.store.setSaving(true);
    this._metrics.saveCount++;
    try {
      if (!this._csrf) {
        const c = await _fetchJson(ENDPOINTS.check);
        this._csrf = c.body && c.body.data && c.body.data.session ? c.body.data.session.csrf_token : null;
      }
      const headers = { "Content-Type": "application/json", "X-CSRF-Token": this._csrf || "" };

      // 1) Perfil textual (nome) -> app_user_profiles (+ sincroniza sessão p/ header)
      const profileBody = {
        nome_completo: p.fullName || "",
        nome_resumido: p.displayName || "",
        nome: p.displayName || p.fullName || "",
        funcao: p.jobTitle || "",
        departamento: p.department || ""
      };
      const profileRes = await _fetchJson(ENDPOINTS.profile, { method: "PUT", headers, body: JSON.stringify(profileBody) });

      // 2) Avatar -> user/avatar.php (+ espelha app_users.avatar_url)
      const hasAvatar = !!p.avatarUrl;
      const avatarRes = await _fetchJson(ENDPOINTS.avatarSave, {
        method: "POST",
        headers,
        body: JSON.stringify({ avatar_type: hasAvatar ? "image" : "fallback", avatar_image_url: hasAvatar ? p.avatarUrl : null, version: 1 })
      });

      if (!profileRes.ok && !avatarRes.ok) {
        throw new Error((avatarRes.body && avatarRes.body.error) || (profileRes.body && profileRes.body.error) || "SAVE_FAILED");
      }
      this.store.setSaving(false);
      this.store.setDirty(false);
      this._reflectHeaderAvatar(p.avatarUrl || "");
      this._reflectHeaderName(p.displayName || p.fullName || "");
      _emit(EVENTS.AVATAR_CHANGED, { avatarUrl: p.avatarUrl || "" });
      _emit(EVENTS.FIELD_UPDATED, { fullName: p.fullName || "", displayName: p.displayName || "" });
      _emit(EVENTS.SAVE_SUCCESS, {});
      const full = profileRes.ok && avatarRes.ok;
      this._toast(full ? "Perfil atualizado com sucesso" : "Perfil salvo parcialmente", full ? "success" : "warning");
    } catch (e) {
      this.store.setSaving(false);
      this._metrics.errorCount++;
      _emit(EVENTS.SAVE_ERROR, { error: e.message });
      this._toast("N\xE3o foi poss\xEDvel salvar o avatar", "error");
    }
  }

  _toast(message, kind) {
    try {
      const toast = _getPort("toast") || (typeof window !== "undefined" && window.Core?.windowAdapter?.get?.("ToastService"));
      if (toast) {
        const fn = toast[kind] || toast.show || toast.info;
        if (typeof fn === "function") fn.call(toast, message);
      }
    } catch (e) { }
  }

  // Reflexo imediato no header e no dropdown (avatar pequeno .user-avatar e grande .user-avatar-large).
  // A persistência (app_users.avatar_url) garante que o próximo check.php também traga o novo avatar.
  _reflectHeaderAvatar(url) {
    if (typeof document === "undefined") return;
    const imgs = document.querySelectorAll(".user-avatar .avatar-img, .user-avatar-large .avatar-img");
    imgs.forEach((img) => {
      if (url) { img.src = url; img.style.display = "block"; }
      else { img.removeAttribute("src"); img.style.display = "none"; }
    });
    const inits = document.querySelectorAll(".user-avatar .avatar-initials, .user-avatar-large .avatar-initials");
    inits.forEach((el) => { el.style.display = url ? "none" : "flex"; });
  }

  // Reflexo imediato do nome de exibição no header/dropdown. A sessão já foi sincronizada
  // no backend ($_SESSION['name']), então o próximo check.php também traz o novo nome.
  _reflectHeaderName(name) {
    if (typeof document === "undefined" || !name) return;
    document.querySelectorAll(".user-name, .user-name-full").forEach((el) => { el.textContent = name; });
    const initials = String(name).trim().split(/\s+/).map((w) => w[0] || "").slice(0, 2).join("").toUpperCase() || "?";
    document.querySelectorAll(".user-avatar .avatar-initials, .user-avatar-large .avatar-initials").forEach((el) => { el.textContent = initials; });
  }

  unmount() {
    if (!this._mounted) return Promise.resolve(this);
    if (this._unsub) { try { this._unsub(); } catch (e) { } this._unsub = null; }
    if (this.container) this.container.innerHTML = "";
    this._mounted = false;
    this.store.setMounted(false);
    _emit(EVENTS.UNMOUNTED, {});
    return Promise.resolve(this);
  }

  refresh() {
    if (this._mounted && _isDocumentVisible() && _isAuthenticated()) return this._loadData();
    return Promise.resolve();
  }

  getState() { return this.store.getState(); }
  getMetrics() { return { ...this._metrics }; }

  healthCheck() {
    const hasEventBus = !!_getEventBus();
    const checks = { mounted: this._mounted, hasContainer: !!this.container, hasEventBus, storeReady: !!this.store };
    const passed = Object.values(checks).filter(Boolean).length;
    const maxScore = Object.keys(checks).length;
    return { status: passed === maxScore ? "HEALTHY" : "DEGRADED", score: passed, maxScore, version: VERSION, moduleId: MODULE_ID };
  }

  info() {
    const ps = Ports.snapshot();
    return { moduleId: MODULE_ID, version: VERSION, mounted: this._mounted, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), metrics: this._metrics, portsInitialized: ps._initialized, state: this.store.getState() };
  }
}

let _currentInstance = null;
const mount = (container, config) => {
  if (_currentInstance) { try { _currentInstance.unmount(); } catch (e) { } _currentInstance = null; }
  const i = new UserProfileComponent({ container, config });
  i.init();
  i.mount(container);
  _currentInstance = i;
  return { success: true, moduleId: MODULE_ID, instance: i };
};
const unmount = () => {
  if (_currentInstance) {
    const instance = _currentInstance;
    _currentInstance = null;
    instance.unmount();
  }
  return { success: true, moduleId: MODULE_ID };
};
const destroy = () => unmount();
const healthCheck = () => _currentInstance?.healthCheck() ?? { status: "UNHEALTHY", mounted: false, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
var panel_user_profile_default = { UserProfileComponent, mount, unmount, destroy, healthCheck, getVersion, MODULE_ID, VERSION, injectPorts, getPorts };
export {
  MODULE_ID,
  UserProfileComponent,
  VERSION,
  panel_user_profile_default as default,
  destroy,
  getPorts,
  getVersion,
  healthCheck,
  injectPorts,
  mount,
  unmount
};
