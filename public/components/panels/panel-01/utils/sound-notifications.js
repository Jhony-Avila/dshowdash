const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/sound-notifications";
const SOUNDS = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
  NEW_ITEM: "new_item",
  MESSAGE: "message",
  COMPLETE: "complete"
};
const SOUND_DATA = {
  success: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onq+wr6qej31wYVlVWGFtfImboq+zsqylmIt+cmhiYGFlamx2foaOlZqenZuXk46JhIB9e3p6e3x9f4CCg4SEhIODgoF/fn18e3t7fH1+f4CBgoODg4ODgoKBgH9+fn19fX1+fn9/gICBgYGBgYGBgYB/",
  error: "data:audio/wav;base64,UklGRjIBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4BAAB7e35+gYGEhIaGh4eIiImJiYmKioqKioqKiomJiYmIiIeHhoaFhYODgYGAfn58fHt7ent7e3t8fH19fn5/f4CAgYGCgoODhISFhYaGhoeHiIiIiYmJiYmJioqKioqKiomJiYmIiIeHhoaFhYODgYGAfn58fHt7ent7",
  warning: "data:audio/wav;base64,UklGRl4BAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YToBAAB7e3x8fX1+fn9/gICBgYKCg4OEhIWFhoaHh4iIiYmJiYqKioqKioqKiomJiYmIiIeHhoaFhYODgYGAfn58fHt7ent7e3t8fH19fn5/f4CAgYGCgoODhISFhYaGhoeHiIiIiYmJiYmJioqKioqKiomJiYmIiIeH",
  info: "data:audio/wav;base64,UklGRl4BAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YToBAACAgoSGiIqMjpCSlJaYmpyen6ChoqOko6KhoJ6cmpiWlJKQjo6MioiGhIOCgYB/f39/gIGCg4WGiImLjI6PkJGSk5OUlJSUk5OSkZCPjoyLiYeGhIOBgH9+fn19fX1+fn+AgYKDhIWGh4iJiouMjY6Oj5CQ",
  new_item: "data:audio/wav;base64,UklGRpQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YXABAAB+foGBhISHh4qKjY2QkJOTlpaZmZycn5+ioqWlp6eoqKmpqqqqqqmpqKinp6WloqKfn5ycmZmWlpOTkJCNjYqKh4eEhIGBfn57e3l5eHh4eHl5e3t+foGBhISHh4qKjY2QkJOTlpaZmZycn5+ioqWlp6eoqKmpqqqqqqmp",
  message: "data:audio/wav;base64,UklGRl4BAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YToBAAB9fX5+f3+AgIGBgoKDg4SEhYWGhoeHiIiJiYmJioqKioqKioqJiYmJiIiHh4aGhYWEhIODgoKBgYCAf39+fn19fHx8fHx8fX1+fn9/gICBgYKCg4OEhIWFhoaHh4iIiYmJiYqKioqKioqKiYmJiYiIh4eGhoWF",
  complete: "data:audio/wav;base64,UklGRqoBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YYYBAABzdXh7foGEh4qNkJOWmZyfoqWoq66xsbKzsrGwr62qp6ShnpuYlZKPjImGg4B9enl4eHl5e3x+gIOGiYyPkpWYm56ho6aoqqutrrCwsLCvrauppaKfnJmWk5CNioeEgX58e3p5eXl6e31/goWIi46RlJeam56ho6WnqKqr"
};
function SoundNotificationManager(options = {}) {
  options = options || {};
  this.enabled = options.enabled !== false;
  this.volume = options.volume || 0.5;
  this.storageKey = options.storageKey || "p01_sound_settings";
  this._audioContext = null;
  this._sounds = {};
  this._muted = false;
  this._loadSettings();
  this.init();
}
SoundNotificationManager.prototype._loadSettings = function() {
  try {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      const settings = JSON.parse(saved);
      this.enabled = settings.enabled !== false;
      this.volume = settings.volume || 0.5;
      this._muted = settings.muted || false;
    }
  } catch (e) {
  }
};
SoundNotificationManager.prototype._saveSettings = function() {
  try {
    localStorage.setItem(this.storageKey, JSON.stringify({
      enabled: this.enabled,
      volume: this.volume,
      muted: this._muted
    }));
  } catch (e) {
  }
};
SoundNotificationManager.prototype.init = function() {
  const self = this;
  Object.keys(SOUND_DATA).forEach((key) => {
    self._sounds[key] = new Audio(SOUND_DATA[key]);
    self._sounds[key].volume = self.volume;
  });
  return true;
};
SoundNotificationManager.prototype.play = function(soundType) {
  if (!this.enabled || this._muted) return;
  const sound = this._sounds[soundType];
  if (!sound) return;
  try {
    sound.currentTime = 0;
    sound.volume = this.volume;
    sound.play().catch(() => {
    });
  } catch (e) {
  }
};
SoundNotificationManager.prototype.playSuccess = function() {
  this.play(SOUNDS.SUCCESS);
};
SoundNotificationManager.prototype.playError = function() {
  this.play(SOUNDS.ERROR);
};
SoundNotificationManager.prototype.playWarning = function() {
  this.play(SOUNDS.WARNING);
};
SoundNotificationManager.prototype.playInfo = function() {
  this.play(SOUNDS.INFO);
};
SoundNotificationManager.prototype.playNewItem = function() {
  this.play(SOUNDS.NEW_ITEM);
};
SoundNotificationManager.prototype.playMessage = function() {
  this.play(SOUNDS.MESSAGE);
};
SoundNotificationManager.prototype.playComplete = function() {
  this.play(SOUNDS.COMPLETE);
};
SoundNotificationManager.prototype.setVolume = function(volume) {
  this.volume = Math.max(0, Math.min(1, volume));
  const self = this;
  Object.keys(this._sounds).forEach((key) => {
    self._sounds[key].volume = self.volume;
  });
  this._saveSettings();
};
SoundNotificationManager.prototype.getVolume = function() {
  return this.volume;
};
SoundNotificationManager.prototype.mute = function() {
  this._muted = true;
  this._saveSettings();
};
SoundNotificationManager.prototype.unmute = function() {
  this._muted = false;
  this._saveSettings();
};
SoundNotificationManager.prototype.toggleMute = function() {
  this._muted = !this._muted;
  this._saveSettings();
  return this._muted;
};
SoundNotificationManager.prototype.isMuted = function() {
  return this._muted;
};
SoundNotificationManager.prototype.enable = function() {
  this.enabled = true;
  this._saveSettings();
};
SoundNotificationManager.prototype.disable = function() {
  this.enabled = false;
  this._saveSettings();
};
SoundNotificationManager.prototype.isEnabled = function() {
  return this.enabled && !this._muted;
};
SoundNotificationManager.prototype.getStatus = function() {
  return { enabled: this.enabled, muted: this._muted, volume: this.volume, active: this.enabled && !this._muted };
};
SoundNotificationManager.prototype.destroy = function() {
  this._sounds = {};
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var sound_notifications_default = { SoundNotificationManager, SOUNDS, info, healthCheck };
export {
  MODULE_ID,
  SOUNDS,
  SoundNotificationManager,
  VERSION,
  sound_notifications_default as default,
  healthCheck,
  info
};
