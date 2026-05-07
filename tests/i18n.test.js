import { describe, expect, it, vi } from "vitest";

function nextFrame() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

async function loadI18n() {
  vi.resetModules();
  await import("../i18n.js");
  await nextFrame();
  return window.BizTrackI18n;
}

describe("BizTrackI18n", () => {
  it("inserts a language switcher and translates visible text", async () => {
    localStorage.setItem("bizTrackLanguage", "zh");
    document.body.innerHTML = `
      <div class="header-wrapper">
        <h2>Dashboard</h2>
        <div class="user-info">
          <input placeholder="Search" aria-label="Search products">
        </div>
      </div>
    `;

    await loadI18n();

    expect(document.documentElement.lang).toBe("zh-CN");
    expect(document.querySelector(".language-switcher")).not.toBeNull();
    expect(document.querySelector("h2").textContent).toBe("仪表盘");
    expect(document.querySelector("input").placeholder).toBe("搜索");
    expect(document.querySelector("input").getAttribute("aria-label")).toBe("搜索产品");
  });

  it("switches back to English using the stored original text", async () => {
    document.body.innerHTML = `
      <div class="header-wrapper">
        <h2>Products</h2>
        <div class="user-info"></div>
      </div>
    `;

    const i18n = await loadI18n();
    i18n.setLanguage("zh");
    expect(document.querySelector("h2").textContent).toBe("产品");

    i18n.setLanguage("en");
    expect(document.querySelector("h2").textContent).toBe("Products");
    expect(localStorage.getItem("bizTrackLanguage")).toBe("en");
  });

  it("translates dynamic summary prefixes inserted after initialization", async () => {
    localStorage.setItem("bizTrackLanguage", "zh");
    document.body.innerHTML = `
      <div class="header-wrapper"><div class="user-info"></div></div>
      <div id="summary"></div>
    `;

    await loadI18n();
    document.getElementById("summary").textContent = "Total Revenue: $320.90";
    await nextFrame();

    expect(document.getElementById("summary").textContent).toBe("总收入： $320.90");
  });

  it("ignores unsupported languages and exposes direct text translation", async () => {
    document.body.innerHTML = `<div class="header-wrapper"><div class="user-info"></div></div>`;
    const i18n = await loadI18n();

    i18n.setLanguage("fr");

    expect(localStorage.getItem("bizTrackLanguage")).toBeNull();
    expect(i18n.translateText("Orders", "zh")).toBe("订单");
  });
});
