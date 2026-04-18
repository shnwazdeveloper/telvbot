// In-memory session store (replace with Redis in production if needed)
const sessions = new Map();

function getSession(userId) {
  if (!sessions.has(userId)) sessions.set(userId, {});
  return sessions.get(userId);
}

function setSession(userId, data) {
  sessions.set(userId, { ...getSession(userId), ...data });
}

function clearSession(userId) {
  sessions.set(userId, {});
}

function getState(userId) {
  return getSession(userId).state || null;
}

function setState(userId, state, extra = {}) {
  setSession(userId, { state, ...extra });
}

module.exports = { getSession, setSession, clearSession, getState, setState };
