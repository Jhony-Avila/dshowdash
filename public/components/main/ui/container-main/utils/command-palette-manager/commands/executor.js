import { getConfig, getRecentCommands, setRecentCommands, incrementMetric } from "../state.js";
import { _log, _emit, _saveState } from "../helpers/index.js";
import { close } from "../api.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.command-palette-manager.commands.executor";
function _executeCommand(command) {
  if (!command) return;
  const config = getConfig();
  let recentCommands = getRecentCommands();
  recentCommands = recentCommands.filter((id) => id !== command.id);
  recentCommands.unshift(command.id);
  recentCommands = recentCommands.slice(0, config.maxRecentCommands);
  setRecentCommands(recentCommands);
  _saveState();
  incrementMetric("commandsExecuted");
  _emit("commandExecuted", { command });
  _log("info", "Executing command:", command.title);
  if (config.closeOnSelect) {
    close();
  }
  if (typeof command.handler === "function") {
    try {
      command.handler(command);
    } catch (error) {
      incrementMetric("errors");
      _log("error", "Command execution failed:", error.message);
    }
  }
}
export {
  MODULE_ID,
  VERSION,
  _executeCommand
};
