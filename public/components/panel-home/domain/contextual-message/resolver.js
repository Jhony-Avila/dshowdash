import { MESSAGE_CATEGORIES } from "../../core/constants.js";
import { CONFIG } from "../../core/config.js";
import { buildContext } from "./context-builder.js";
import { parsePlaceholders } from "./placeholder-parser.js";
const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "panel-home.domain.contextual-message.resolver";
const _messageHistory = {
  lastMessageId: null,
  lastCategory: null,
  displayCount: {},
  sessionMessages: []
};
function filterBySystemState(messages, systemState) {
  return messages.filter((msg) => {
    if (!msg.system_state) return true;
    return msg.system_state === systemState;
  });
}
function filterByTime(messages, timeContext) {
  const { hour, dayOfWeek } = timeContext;
  return messages.filter((msg) => {
    if (msg.start_time !== null && msg.end_time !== null) {
      const startHour = parseInt(msg.start_time, 10);
      const endHour = parseInt(msg.end_time, 10);
      if (startHour <= endHour) {
        if (hour < startHour || hour >= endHour) return false;
      } else {
        if (hour < startHour && hour >= endHour) return false;
      }
    }
    if (msg.days_of_week && msg.days_of_week.length > 0) {
      if (!msg.days_of_week.includes(dayOfWeek)) return false;
    }
    return true;
  });
}
function filterBySession(messages, sessionContext) {
  const { duration, isFirstAccess } = sessionContext;
  return messages.filter((msg) => {
    if (msg.min_session_time !== null && duration < msg.min_session_time) {
      return false;
    }
    if (msg.max_session_time !== null && duration > msg.max_session_time) {
      return false;
    }
    return true;
  });
}
function filterByUserRequirements(messages, userContext) {
  return messages.filter((msg) => {
    if (msg.requires_user_name && !userContext.name) {
      return false;
    }
    return true;
  });
}
function filterByRepetition(messages) {
  return messages.filter((msg) => {
    if (msg.id === _messageHistory.lastMessageId) {
      return false;
    }
    if (msg.category === _messageHistory.lastCategory) {
      if (msg.category !== MESSAGE_CATEGORIES.TEMPORAL && msg.category !== MESSAGE_CATEGORIES.ACOLHIMENTO) {
        return false;
      }
    }
    return true;
  });
}
function sortByRelevance(messages, context) {
  const weights = CONFIG.weights;
  return [...messages].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    scoreA += (a.priority || 50) * (weights.category / 100);
    scoreB += (b.priority || 50) * (weights.category / 100);
    if (a.category === MESSAGE_CATEGORIES.TEMPORAL) {
      scoreA += weights.temporal;
    }
    if (b.category === MESSAGE_CATEGORIES.TEMPORAL) {
      scoreB += weights.temporal;
    }
    if (context.session.isFirstAccess) {
      if (a.category === MESSAGE_CATEGORIES.ACOLHIMENTO) scoreA += 30;
      if (b.category === MESSAGE_CATEGORIES.ACOLHIMENTO) scoreB += 30;
    }
    if (context.session.isReturning) {
      if (a.category === MESSAGE_CATEGORIES.CONTEXTO) scoreA += 25;
      if (b.category === MESSAGE_CATEGORIES.CONTEXTO) scoreB += 25;
    }
    scoreA += Math.random() * weights.variation;
    scoreB += Math.random() * weights.variation;
    return scoreB - scoreA;
  });
}
function selectBestMessage(candidates, context) {
  if (!candidates || candidates.length === 0) {
    return null;
  }
  let filtered = candidates;
  filtered = filterBySystemState(filtered, context.system.state);
  if (filtered.length === 0) return null;
  filtered = filterBySession(filtered, context.session);
  if (filtered.length === 0) return null;
  filtered = filterByTime(filtered, context.time);
  if (filtered.length === 0) return null;
  filtered = filterByUserRequirements(filtered, context.user);
  if (filtered.length === 0) return null;
  filtered = filterByRepetition(filtered);
  if (filtered.length === 0) {
    filtered = filterByUserRequirements(
      filterByTime(
        filterBySession(
          filterBySystemState(candidates, context.system.state),
          context.session
        ),
        context.time
      ),
      context.user
    );
  }
  if (filtered.length === 0) return null;
  const sorted = sortByRelevance(filtered, context);
  return sorted[0];
}
function recordMessageDisplay(message) {
  if (!message) return;
  _messageHistory.lastMessageId = message.id;
  _messageHistory.lastCategory = message.category;
  _messageHistory.displayCount[message.id] = (_messageHistory.displayCount[message.id] || 0) + 1;
  _messageHistory.sessionMessages.push({
    id: message.id,
    category: message.category,
    timestamp: Date.now()
  });
}
function resolve(candidates, customContext = null) {
  try {
    const context = customContext || buildContext();
    const activeCandidates = (candidates || []).filter((msg) => msg.active !== false);
    if (activeCandidates.length === 0) {
      return null;
    }
    const selected = selectBestMessage(activeCandidates, context);
    if (!selected) {
      return null;
    }
    const processedText = parsePlaceholders(selected.message || selected.text, context);
    recordMessageDisplay(selected);
    return {
      id: selected.id,
      text: processedText,
      category: selected.category,
      priority: selected.priority || 50,
      key: selected.key || null
    };
  } catch (error) {
    console.debug("[ContextualMessageResolver] Error resolving message:", error.message);
    return null;
  }
}
function resolveFallback(context = null) {
  const ctx = context || buildContext();
  return resolve(CONFIG.fallbackMessages, ctx);
}
function clearHistory() {
  _messageHistory.lastMessageId = null;
  _messageHistory.lastCategory = null;
  _messageHistory.displayCount = {};
  _messageHistory.sessionMessages = [];
}
function getStats() {
  return {
    lastMessageId: _messageHistory.lastMessageId,
    lastCategory: _messageHistory.lastCategory,
    totalDisplayed: _messageHistory.sessionMessages.length,
    displayCount: { ..._messageHistory.displayCount }
  };
}
var resolver_default = {
  resolve,
  resolveFallback,
  clearHistory,
  getStats,
  buildContext
};
export {
  MODULE_ID,
  VERSION,
  clearHistory,
  resolver_default as default,
  getStats,
  resolve,
  resolveFallback
};
