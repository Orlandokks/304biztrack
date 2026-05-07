/**
 * i18n.js
 *
 * Lightweight internationalization support for the static BizTrack pages.
 * The project does not use a build step, so this module translates existing
 * DOM text in place and keeps the original English text for language changes.
 */

(function exposeI18nUtilities(global) {
  "use strict";

  const LANGUAGE_STORAGE_KEY = "bizTrackLanguage";
  const DEFAULT_LANGUAGE = "en";
  const SUPPORTED_LANGUAGES = ["en", "zh"];

  const zhTranslations = {
    "Dashboard": "仪表盘",
    "Products": "产品",
    "Orders": "订单",
    "Expenses": "支出",
    "Help": "帮助",
    "Meet the Developer": "开发者介绍",
    "Privacy Policy": "隐私政策",
    "Summary": "摘要",
    "Revenue": "收入",
    "Balance": "余额",
    "Analytics": "分析",
    "Sales by Product Category": "按产品类别统计销售额",
    "Total Sales ($)": "总销售额（美元）",
    "Add Product": "添加产品",
    "Add Order": "添加订单",
    "Add Expense": "添加支出",
    "Download CSV": "下载 CSV",
    "Export to CSV": "导出 CSV",
    "Product ID": "产品 ID",
    "Product ID:": "产品 ID：",
    "Product Name": "产品名称",
    "Product Description:": "产品描述：",
    "Description": "描述",
    "Product Category:": "产品类别：",
    "Category": "类别",
    "Price": "价格",
    "Product Price:": "产品价格：",
    "Units Sold": "已售数量",
    "Number of Units Sold:": "已售数量：",
    "Action": "操作",
    "Add": "添加",
    "Update": "更新",
    "Cancel": "取消",
    "Search": "搜索",
    "Choose a product": "选择产品",
    "Choose a category": "选择类别",
    "Choose an item": "选择商品",
    "Choose a status": "选择状态",
    "Choose an expense category": "选择支出类别",
    "Order ID": "订单 ID",
    "Order ID:": "订单 ID：",
    "Order Date": "订单日期",
    "Order Date:": "订单日期：",
    "Item Name": "商品名称",
    "Item Name:": "商品名称：",
    "Item Price": "商品价格",
    "Item Price:": "商品价格：",
    "Quantity Bought": "购买数量",
    "Quantity Bought:": "购买数量：",
    "Qty": "数量",
    "Shipping Fee": "运费",
    "Shipping fee:": "运费：",
    "Taxes": "税费",
    "Taxes (VAT/GST/HST):": "税费（VAT/GST/HST）：",
    "Order Total": "订单总额",
    "Order Status": "订单状态",
    "Order Status:": "订单状态：",
    "Total Order Amount:": "订单总金额：",
    "(Calculated)": "（自动计算）",
    "Pending": "待处理",
    "Processing": "处理中",
    "Shipped": "已发货",
    "Delivered": "已送达",
    "S/N": "序号",
    "Date": "日期",
    "Date:": "日期：",
    "Expense Category": "支出类别",
    "Amount": "金额",
    "Amount:": "金额：",
    "Notes": "备注",
    "Notes:": "备注：",
    "Rent": "租金",
    "Utilities": "公用事业",
    "Supplies": "用品",
    "Order Fulfillment": "订单履约",
    "Miscellaneous": "杂项",
    "Using BizTrack: A Quick Guide": "BizTrack 快速使用指南",
    "What is BizTrack?": "什么是 BizTrack？",
    "Navigating the Dashboard": "浏览仪表盘",
    "Expenses Page": "支出页面",
    "Orders Page": "订单页面",
    "Adding a New Expense, Order or Product": "添加新的支出、订单或产品",
    "Sorting and Searching Entries/Tables": "排序和搜索记录/表格",
    "Export to CSV": "导出 CSV",
    "My Coding Journey": "我的编程旅程",
    "Hey, I'm Sumayyah!": "你好，我是 Sumayyah！",
    "Cookie preferences": "Cookie 偏好设置",
    "BizTrack uses localStorage to remember app data, language preference, and cookie consent.": "BizTrack 使用 localStorage 保存应用数据、语言偏好和 Cookie 同意状态。",
    "Review the Privacy Policy.": "查看隐私政策。",
    "Accept": "接受",
    "Decline": "拒绝",
    "This page explains what data BizTrack stores in the browser and how that data is used.": "本页面说明 BizTrack 在浏览器中存储哪些数据，以及这些数据如何被使用。",
    "Stored Data": "存储的数据",
    "BizTrack stores products, orders, expenses, language preference, and cookie consent in localStorage on your device.": "BizTrack 会在你的设备 localStorage 中存储产品、订单、支出、语言偏好和 Cookie 同意状态。",
    "Purpose": "用途",
    "The stored data keeps the dashboard, tables, CSV export, language toggle, and consent banner working between page visits.": "这些数据用于让仪表盘、表格、CSV 导出、语言切换和同意横幅在再次访问时保持可用。",
    "No Third-Party Sale": "不出售给第三方",
    "The project does not sell personal data. It uses external CDNs only to load fonts, icons, and charts required by the interface.": "本项目不会出售个人数据，只使用外部 CDN 加载界面所需的字体、图标和图表。",
    "User Control": "用户控制",
    "You can clear the stored data at any time by clearing this site's browser storage.": "你可以随时通过清除此网站的浏览器存储来删除这些数据。",
    "Last updated: 7 May 2026": "最后更新：2026 年 5 月 7 日",
    "Open navigation menu": "打开导航菜单",
    "Close navigation menu": "关闭导航菜单",
    "Search products": "搜索产品",
    "Search orders": "搜索订单",
    "Search expenses": "搜索支出",
    "Download products as a CSV file": "将产品导出为 CSV 文件",
    "Export orders as a CSV file": "将订单导出为 CSV 文件",
    "Export expenses as a CSV file": "将支出导出为 CSV 文件",
    "Cookie consent": "Cookie 同意",
  };

  const dynamicPrefixes = {
    "Total Revenue:": "总收入：",
    "Total Expenses:": "总支出：",
  };

  const textNodeOriginals = new WeakMap();
  let observer = null;
  let isTranslating = false;
  let isDestroyed = false;
  let languageButtons = [];

  function getStoredLanguage() {
    if (!global.localStorage) {
      return DEFAULT_LANGUAGE;
    }

    const storedLanguage = global.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return SUPPORTED_LANGUAGES.includes(storedLanguage)
      ? storedLanguage
      : DEFAULT_LANGUAGE;
  }

  function preserveWhitespace(originalText, translatedText) {
    const leadingWhitespace = originalText.match(/^\s*/)[0];
    const trailingWhitespace = originalText.match(/\s*$/)[0];
    return `${leadingWhitespace}${translatedText}${trailingWhitespace}`;
  }

  function translateText(text, language) {
    if (language === DEFAULT_LANGUAGE) {
      return text;
    }

    const trimmedText = text.trim();

    if (!trimmedText) {
      return text;
    }

    if (zhTranslations[trimmedText]) {
      return preserveWhitespace(text, zhTranslations[trimmedText]);
    }

    const matchedPrefix = Object.keys(dynamicPrefixes).find((prefix) =>
      trimmedText.startsWith(prefix)
    );

    if (matchedPrefix) {
      return preserveWhitespace(
        text,
        `${dynamicPrefixes[matchedPrefix]}${trimmedText.slice(matchedPrefix.length)}`
      );
    }

    return text;
  }

  function shouldSkipNode(node) {
    if (!node || !node.parentElement) {
      return true;
    }

    return Boolean(
      node.parentElement.closest(
        "script, style, noscript, code, pre, [data-no-i18n]"
      )
    );
  }

  function translateTextNodes(root, language) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          return shouldSkipNode(node) || !node.nodeValue.trim()
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    let currentNode = walker.nextNode();

    while (currentNode) {
      if (!textNodeOriginals.has(currentNode)) {
        textNodeOriginals.set(currentNode, currentNode.nodeValue);
      }

      currentNode.nodeValue = translateText(
        textNodeOriginals.get(currentNode),
        language
      );

      currentNode = walker.nextNode();
    }
  }

  function translateAttributes(root, language) {
    const translatableAttributes = ["placeholder", "aria-label", "title", "label"];
    const elements = root.querySelectorAll("*");

    elements.forEach((element) => {
      if (element.closest("[data-no-i18n]")) {
        return;
      }

      translatableAttributes.forEach((attributeName) => {
        if (!element.hasAttribute(attributeName)) {
          return;
        }

        const storageName = `data-i18n-original-${attributeName}`;

        if (!element.hasAttribute(storageName)) {
          element.setAttribute(storageName, element.getAttribute(attributeName));
        }

        element.setAttribute(
          attributeName,
          translateText(element.getAttribute(storageName), language)
        );
      });
    });
  }

  function updateLanguageButtons(language) {
    languageButtons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.language === language)
      );
    });
  }

  function applyLanguage(language = getStoredLanguage()) {
    isTranslating = true;
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    translateTextNodes(document.body, language);
    translateAttributes(document.body, language);
    updateLanguageButtons(language);
    isTranslating = false;
  }

  function setLanguage(language) {
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return;
    }

    global.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    applyLanguage(language);
  }

  function createLanguageButton(language, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "language-button";
    button.dataset.language = language;
    button.textContent = label;
    button.addEventListener("click", () => setLanguage(language));
    return button;
  }

  function insertLanguageSwitcher() {
    if (document.querySelector(".language-switcher")) {
      languageButtons = Array.from(document.querySelectorAll(".language-button"));
      return;
    }

    const target = document.querySelector(".header-wrapper .user-info");

    if (!target) {
      return;
    }

    const switcher = document.createElement("div");
    switcher.className = "language-switcher";
    switcher.setAttribute("aria-label", "Language switcher");
    switcher.setAttribute("data-no-i18n", "true");

    const englishButton = createLanguageButton("en", "EN");
    const chineseButton = createLanguageButton("zh", "中文");

    switcher.append(englishButton, chineseButton);
    target.appendChild(switcher);

    languageButtons = [englishButton, chineseButton];
  }

  function observeDynamicContent() {
    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver(() => {
      if (isTranslating || isDestroyed) {
        return;
      }

      const scheduleFrame = global.requestAnimationFrame || global.setTimeout;
      scheduleFrame.call(global, () => {
        if (!isDestroyed) {
          applyLanguage();
        }
      }, 0);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function initializeI18n() {
    isDestroyed = false;
    insertLanguageSwitcher();
    applyLanguage();
    observeDynamicContent();
  }

  function destroyI18n() {
    isDestroyed = true;

    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeI18n);
  } else {
    initializeI18n();
  }

  global.BizTrackI18n = {
    applyLanguage,
    getStoredLanguage,
    setLanguage,
    translateText,
    destroyI18n,
  };
})(window);
