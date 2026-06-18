import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifySessionExpired, sessionExpiredEventName } from "../authSession";

describe("authSession", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("limpa sessão local e notifica expiração", () => {
    const listener = vi.fn();
    localStorage.setItem("bolao.token", "token");
    localStorage.setItem("bolao.user", JSON.stringify({ id: "user-1" }));
    window.addEventListener(sessionExpiredEventName, listener);

    notifySessionExpired();

    expect(localStorage.getItem("bolao.token")).toBeNull();
    expect(localStorage.getItem("bolao.user")).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(sessionExpiredEventName, listener);
  });
});
