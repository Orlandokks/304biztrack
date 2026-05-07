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
      <select>
        <optgroup label="Home decor">
          <option>Canvas prints</option>
        </optgroup>
      </select>
    `;

    await loadI18n();

    expect(document.documentElement.lang).toBe("zh-CN");
    expect(document.querySelector(".language-switcher")).not.toBeNull();
    expect(document.querySelector("h2").textContent).toBe("仪表盘");
    expect(document.querySelector("input").placeholder).toBe("搜索");
    expect(document.querySelector("input").getAttribute("aria-label")).toBe("搜索产品");
    expect(document.querySelector("optgroup").getAttribute("label")).toBe("家居装饰");
    expect(document.querySelector("option").textContent).toBe("帆布画");
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

  it("translates long help/about copy and dynamic action labels", async () => {
    localStorage.setItem("bizTrackLanguage", "zh");
    document.body.innerHTML = `
      <div class="header-wrapper"><div class="user-info"></div></div>
      <p>BizTrack is your go-to business management tool designed with small business owners in mind. It's an all-in-one platform that helps you effortlessly manage your products, track orders, and stay on top of your finances. Let me walk you through the basics:</p>
      <p>Welcome to my little corner of the internet, where I'm rolling up my sleeves and diving into the coding world. I’m not your typical tech guru – I’m just a small business owner navigating the hustle and bustle of entrepreneurship. Oh, and did I mention I’m also part of the</p>
      <button aria-label="Edit product PD001" title="Edit">x</button>
    `;

    await loadI18n();

    expect(document.querySelectorAll("p")[0].textContent).toContain(
      "BizTrack 是面向小型企业主设计的业务管理工具"
    );
    expect(document.querySelectorAll("p")[1].textContent).toContain(
      "欢迎来到我的互联网小角落"
    );
    expect(document.querySelector("button[aria-label]").getAttribute("aria-label")).toBe(
      "编辑产品 PD001"
    );
    expect(document.querySelector("button[aria-label]").title).toBe("编辑");
  });

  it("ignores unsupported languages and exposes direct text translation", async () => {
    document.body.innerHTML = `<div class="header-wrapper"><div class="user-info"></div></div>`;
    const i18n = await loadI18n();

    i18n.setLanguage("fr");

    expect(localStorage.getItem("bizTrackLanguage")).toBeNull();
    expect(i18n.translateText("Orders", "zh")).toBe("订单");
  });
});
