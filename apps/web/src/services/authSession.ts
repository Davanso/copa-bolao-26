export const sessionExpiredEventName = "bolao:session-expired";

export function storedToken() {
  return localStorage.getItem("bolao.token");
}

export function clearStoredSession() {
  localStorage.removeItem("bolao.token");
  localStorage.removeItem("bolao.user");
}

export function notifySessionExpired() {
  clearStoredSession();
  window.dispatchEvent(new Event(sessionExpiredEventName));
}
