import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
  document.body.innerHTML = "";
  document.head.innerHTML = "";
  localStorage.clear();
  vi.restoreAllMocks();

  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
});

afterEach(() => {
  window.BizTrackI18n?.destroyI18n();
});
