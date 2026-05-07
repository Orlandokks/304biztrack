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
    "Hats": "帽子",
    "Drinkware": "饮具",
    "Clothing": "服装",
    "Accessories": "配件",
    "Home decor": "家居装饰",
    "Baseball caps": "棒球帽",
    "Snapbacks": "平檐帽",
    "Beanies": "针织帽",
    "Bucket hats": "渔夫帽",
    "Mugs": "马克杯",
    "Water bottles": "水瓶",
    "Tumblers": "随行杯",
    "T-shirts": "T 恤",
    "Sweatshirts": "卫衣",
    "Hoodies": "连帽衫",
    "Pillow cases": "枕套",
    "Tote bags": "托特包",
    "Stickers": "贴纸",
    "Posters": "海报",
    "Framed posters": "装框海报",
    "Canvas prints": "帆布画",
    "Peace embroidered cap": "平安刺绣帽",
    "Floral lotus printed bottle": "花卉莲花印花水瓶",
    "Palestine sweater": "巴勒斯坦主题毛衣",
    "Vibes printed poster": "氛围感印花海报",
    "Morrocan print pillow case": "摩洛哥风格印花枕套",
    "January Rent": "一月租金",
    "Order #1005": "订单 #1005",
    "Internet": "网络费用",
    "Embroidery Machine": "刺绣机器",
    "Pizza": "披萨",
    "Travel Mug": "旅行杯",
    "Power bill": "电费账单",
    "Edit": "编辑",
    "Delete": "删除",
    "Sort by Product ID": "按产品 ID 排序",
    "Sort by Product Name": "按产品名称排序",
    "Sort by Description": "按描述排序",
    "Sort by Category": "按类别排序",
    "Sort by Price": "按价格排序",
    "Sort by Units Sold": "按已售数量排序",
    "Sort by serial number": "按序号排序",
    "Sort by Date": "按日期排序",
    "Sort by Expense Category": "按支出类别排序",
    "Sort by Amount": "按金额排序",
    "Sort by Notes": "按备注排序",
    "Open Sumayyah Musa's LinkedIn profile in a new tab": "在新标签页打开 Sumayyah Musa 的 LinkedIn 主页",
    "Open Sumayyah Musa's GitHub profile in a new tab": "在新标签页打开 Sumayyah Musa 的 GitHub 主页",
    "Send an email to Sumayyah Musa": "给 Sumayyah Musa 发送邮件",
    "BizTrack is your go-to business management tool designed with small business owners in mind. It's an all-in-one platform that helps you effortlessly manage your products, track orders, and stay on top of your finances. Let me walk you through the basics:": "BizTrack 是面向小型企业主设计的业务管理工具。它把产品管理、订单跟踪和财务记录整合在一个平台中，帮助你更轻松地掌握业务情况。下面是基本使用方式：",
    "The Dashboard is your central hub, giving you a snapshot of your business's overall performance. Here, you'll find key metrics like total expenses, revenues, profits and the number of orders. It's your command center for a quick overview.": "仪表盘是业务概览中心，会展示整体经营表现。你可以在这里查看总支出、收入、利润和订单数量等关键指标，用它快速了解业务状态。",
    "Record Your Expenses:": "记录支出：",
    "Head to the Expenses page to add your business expenses. Fill in the date, choose a category, enter the amount, and jot down any notes. It's that simple.": "进入支出页面即可添加业务支出。填写日期、选择类别、输入金额并补充备注即可完成记录。",
    "Edit or Delete Expenses:": "编辑或删除支出：",
    "Edit or Delete Expenses: Made a mistake? No worries! You can easily edit or delete expense records right from the Expenses page.": "记录有误也没关系。你可以直接在支出页面编辑或删除支出记录。",
    "Track Your Orders:": "跟踪订单：",
    "On the Orders page, you can keep tabs on all your orders. Each entry details the product, quantity, and order status.": "在订单页面，你可以跟踪所有订单。每条记录都会显示商品、数量和订单状态。",
    "Effortless Editing:": "轻松编辑：",
    "Need to update an order status? Click the \"Edit\" button and make your changes. It's hassle-free.": "需要更新订单状态时，点击“编辑”按钮并修改即可。",
    "Click on \"Add Expense\" or the equivalent button on the order or product page.": "点击“添加支出”，或在订单/产品页面点击对应的添加按钮。",
    "Fill in the product details or order details or transaction date, category, amount, and any notes.": "填写产品详情、订单详情，或填写交易日期、类别、金额和备注。",
    "Hit \"Done,\" and you're all set. Your order, product or transaction will now appear in the respective page and on the Dashboard.": "完成后，新的订单、产品或交易记录会出现在对应页面和仪表盘中。",
    "Click on any column heading (headers) to sort the entries in the table by that column in either ascending order or alphabetical order.": "点击任意列标题，即可按该列对表格记录进行升序或字母顺序排序。",
    "You can also search for a particular product, order or expense by entrering the value in the search box at the top of the respective page.": "你也可以在页面顶部搜索框输入内容，查找指定的产品、订单或支出记录。",
    "Want to keep a backup or analyze your data elsewhere? Simply click on \"Export to CSV\" to download a CSV file with all your business data.": "如果需要备份或在其他工具中分析数据，只需点击“导出 CSV”，即可下载包含业务数据的 CSV 文件。",
    "BizTrack is designed to be intuitive, user-friendly, and adaptable to your business needs. Explore the different pages, try out the features, and let BizTrack simplify your small business management.": "BizTrack 注重直观、易用和可扩展性。你可以浏览不同页面、尝试各项功能，让 BizTrack 简化小型业务管理。",
    "Have questions, feedback, or just want to connect? Feel free to reach out!": "如果有问题、反馈，或只是想联系，欢迎随时交流。",
    "Welcome to my little corner of the internet, where I'm rolling up my sleeves and diving into the coding world. I’m not your typical tech guru – I’m just a small business owner navigating the hustle and bustle of entrepreneurship. Oh, and did I mention I’m also part of the": "欢迎来到我的互联网小角落。在这里，我开始认真学习并投入编程世界。我不是传统意义上的技术专家，而是一名正在经营小生意、应对创业日常的小型企业主。顺便说一句，我也是",
    "program? Yeah, it's been quite the journey, and I owe a huge shoutout to my coding coach, Sam.": "项目的一员。这段学习经历很充实，我也非常感谢我的编程导师 Sam。",
    "Let me spill the tea on BizTrack, my brainchild. So, picture this: I'm running a small business, trying to keep tabs on products, orders, and the never-ending finances - It’s a lot. That's when the light bulb moment happened, and BizTrack was born. It's not just a project; it's my answer to the chaos that comes with managing a business.": "说说 BizTrack 这个项目的由来吧。经营小生意时，我需要同时管理产品、订单和持续变化的财务数据，工作量很大。于是我产生了开发 BizTrack 的想法。它不只是一个课程项目，也是我对业务管理混乱问题的回应。",
    "BizTrack is my attempt at making life a bit more straightforward for small business owners like me. You know, the ones who are constantly multitasking and could use a break. It's a manifestation of my passion for leveraging technology to enhance the efficiency and effectiveness of business operations. It's not polished; it's not perfect, it's just a real solution for real-world challenges.": "BizTrack 是我尝试让小型企业主的日常管理更简单的一步。许多小企业主需要同时处理很多任务，而技术可以帮助提升业务运作的效率和效果。它可能还不完美，但它面向的是真实业务场景中的实际问题。",
    "I'm a student at GetCoding NL, a software development program that's turning me from someone who googles how websites work into someone who actually understands and builds them. And guess what? BizTrack is my first module project, allowing me to practically apply the skills and knowledge gained in the program. Learning by doing, they say, and that’s exactly what I'm doing.": "我是 GetCoding NL 软件开发项目的学生。这个项目让我从只会搜索网页如何运行，逐步变成能够理解并构建网页的人。BizTrack 是我的第一个模块项目，让我能把课程中学到的技能和知识应用到实际开发中。",
    "But none of this would be possible without the guidance of my amazing coach,": "如果没有我的导师",
    ". Sam has been the compass in my coding journey. Patient, encouraging, and always ready with a helpful tip – he has made navigating the coding seas a whole lot less daunting.": "的指导，这一切都不会这么顺利。Sam 在我的编程学习过程中给予了耐心、鼓励和实用建议，让学习过程变得更清晰、更容易坚持。",
    "So, why spill all this in an about me section? Well, I’m not just sharing my story; I’m inviting you to join me on my journey. Whether you're into the chaos of small business life, curious about coding escapades, or just want to see where the two collide – you're welcome here.": "为什么在 About 页面写这些？因为我不仅是在分享自己的经历，也是在邀请你了解这个项目背后的学习和业务背景。无论你关注小型企业管理、编程学习，还是两者的结合，都欢迎来到这里。",
    "Here's to coding, chaos, everything in between and heartfelt thanks to Sam!": "致编程、业务挑战，以及这段学习旅程中的一切，也真诚感谢 Sam！",
  };

  const dynamicPrefixes = {
    "Total Revenue:": "总收入：",
    "Total Expenses:": "总支出：",
    "Edit product ": "编辑产品 ",
    "Delete product ": "删除产品 ",
    "Edit order ": "编辑订单 ",
    "Delete order ": "删除订单 ",
    "Edit expense ": "编辑支出 ",
    "Delete expense ": "删除支出 ",
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
