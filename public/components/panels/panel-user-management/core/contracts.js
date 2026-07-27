const MODULE_ID = "panel-user-management.core.contracts";
const VERSION = "9.3.0-P2-ENTERPRISE";
const UserSchema = {
  id: { type: "string", required: true },
  name: { type: "string", required: true },
  email: { type: "string", required: true },
  role: { type: "string", required: true },
  status: { type: "string", default: "active" },
  createdAt: { type: "date", required: true },
  updatedAt: { type: "date" }
};
function validateUser(user) {
  const errors = [];
  if (!user.name) errors.push("Nome \xE9 obrigat\xF3rio");
  if (!user.email) errors.push("Email \xE9 obrigat\xF3rio");
  if (!user.email?.includes("@")) errors.push("Email inv\xE1lido");
  if (!user.role) errors.push("Perfil \xE9 obrigat\xF3rio");
  return { valid: errors.length === 0, errors };
}
function normalizeUser(user) {
  return {
    ...user,
    name: user.name?.trim(),
    email: user.email?.toLowerCase().trim(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
var contracts_default = { UserSchema, validateUser, normalizeUser };
const PERMISSION_ACTIONS = {
  VIEW: "user-management:view",
  CREATE: "user-management:create",
  UPDATE: "user-management:update",
  DELETE: "user-management:delete",
  ADMIN: "user-management:admin"
};
export {
  MODULE_ID,
  PERMISSION_ACTIONS,
  UserSchema,
  VERSION,
  contracts_default as default,
  normalizeUser,
  validateUser
};
