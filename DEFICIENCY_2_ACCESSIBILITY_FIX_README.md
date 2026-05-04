好的，我们现在进入 **Deficiency 2：Non-semantic interactive elements and removed focus indicators harm keyboard accessibility** 的修改。这个 deficiency 很适合写入 coursework，因为它完全对应你们作业 guideline 中的 accessibility 示例：用户无法通过 Tab 使用菜单，或 focus indicator 不可见。 同时，课程 workshop 也强调 Accessibility 的 Lighthouse 90+ 不是一个数字，而是一组可以解释、可以验证的 accessibility audits。

这一次的修改目标是：

> 把 BizTrack 中“看起来能点但语义上不是按钮”的元素，改成真正的 `<button>`；恢复并增强键盘 focus indicator；让 table sorting、sidebar open/close、edit/delete 等交互可以被键盘用户清楚操作。

---

# 一、这个 deficiency 的本质是什么？

你现在的原始代码里有三类典型问题。

第一类是 **clickable `<div>`**：

```html
<div class="menu-icon" onclick="openSidebar()">
    <i class="fa-solid fa-bars"></i>
</div>
```

第二类是 **clickable `<i>` icon**：

```html
<i class="fa-solid fa-xmark" title="Close" onclick="closeSidebar()"></i>
```

第三类是 **clickable `<th>` table header**：

```html
<th onclick="sortTable('prodID')">Product ID</th>
```

这些元素对鼠标用户看起来能用，但对键盘用户和辅助技术用户不友好。MDN 的 keyboard accessibility guidance 明确指出，可点击元素应该是 focusable，并且应该具有 interactive semantics；能 focus 的元素也必须有 focus styling。([Mozilla Developer Network][1]) WAI-ARIA Button Pattern 也说明，当按钮获得焦点时，`Space` 和 `Enter` 都应该能激活按钮，而原生 `<button>` 默认就支持这种行为。([W3C][2])

更严重的是，你的 `styles.css` 里有这一句：

```css
* {
    outline: none;
}
```

这会全局移除浏览器默认的键盘焦点轮廓。W3C WCAG 2.2 SC 2.4.7 Focus Visible 的目的就是确保用户知道当前哪个元素拥有键盘焦点；没有可见 focus indicator 时，依赖键盘的用户很难操作页面。([W3C][3])

---

# 二、修改前请先保存证据

你现在先保留 before evidence，这会帮助 report 同学写 Detection。

建议截图或录屏：

```text
evidence/before-keyboard-focus-products.mp4
evidence/before-keyboard-focus-orders.mp4
evidence/before-lighthouse-accessibility.png
```

手动检测方法：

```text
1. 打开 products.html / orders.html / finances.html。
2. 不使用鼠标，只按 Tab。
3. 观察是否可以 Tab 到 menu icon、close icon、table header、edit/delete icons。
4. 观察当前 focus 是否可见。
5. 打开 Chrome DevTools → Lighthouse → 只选 Accessibility → Analyze page load。
```

这也符合课程 D–L–I 框架：Detection 要用工具和技术证据证明问题存在，最好包含 screenshot 或 log。

---

# 三、本次修改总览

我们这次要改这些文件：

```text
1. 新增 accessibility.js
2. 修改 index.html
3. 修改 products.html
4. 修改 orders.html
5. 修改 finances.html
6. 修改 help.html
7. 修改 about.html
8. 修改 products.js
9. 修改 orders.js
10. 修改 finances.js
11. 修改 script.js
12. 修改 help.js
13. 修改 styles.css
14. 新增 DEFICIENCY_2_ACCESSIBILITY_FIX_README.md
```

你已经做过 Deficiency 1，所以项目里应该已经有 `safe-dom.js`。这次我们新增 `accessibility.js`，专门负责 sidebar 状态和 sortable table header 的键盘友好行为。

---

# 四、第一步：新增 `accessibility.js`

在项目根目录新建：

```text
accessibility.js
```

然后复制下面完整代码。

```js
/**
 * accessibility.js
 *
 * Accessibility-focused UI behavior for BizTrack.
 *
 * Academic rationale:
 * The original BizTrack prototype used visually clickable elements such as
 * <div>, <i>, and <th> as controls. These elements do not provide the same
 * built-in keyboard semantics as native HTML buttons. For example, a native
 * <button> can receive keyboard focus and can be activated with Enter or Space
 * without custom keyboard handlers.
 *
 * This file centralizes accessibility-related behavior that is shared across
 * pages:
 * 1. Sidebar open/close state management.
 * 2. Synchronization of aria-expanded with the sidebar visibility state.
 * 3. Keyboard-friendly sortable table header initialization.
 * 4. aria-sort updates after a column is sorted.
 *
 * The implementation intentionally uses progressive enhancement. If a page
 * does not contain a sidebar or sortable table, the functions fail safely
 * without interrupting the rest of the application.
 */

(function exposeAccessibilityUtilities(global) {
  "use strict";

  /**
   * Returns the first sidebar toggle button on the current page.
   *
   * Design rationale:
   * The toggle is selected by a data attribute rather than by visual class name.
   * This separates behavior from presentation and makes the code less fragile
   * if the CSS class is changed later.
   *
   * @returns {HTMLButtonElement | null} The sidebar toggle button, if present.
   */
  function getSidebarToggleButton() {
    return document.querySelector("[data-sidebar-toggle]");
  }

  /**
   * Updates the accessible expanded/collapsed state of the sidebar trigger.
   *
   * Accessibility rationale:
   * aria-expanded communicates whether the controlled region is currently
   * expanded. This is useful for assistive technologies because the visual
   * display state alone may not be available to screen-reader users.
   *
   * @param {boolean} isExpanded - Whether the sidebar is currently visible.
   */
  function setSidebarExpandedState(isExpanded) {
    const toggleButton = getSidebarToggleButton();

    if (toggleButton) {
      toggleButton.setAttribute("aria-expanded", String(isExpanded));
    }
  }

  /**
   * Opens or closes the sidebar.
   *
   * Accessibility rationale:
   * The original implementation placed click behavior on a <div>. The HTML has
   * now been changed so the trigger is a native <button>, while this function
   * only handles state changes. This separation keeps keyboard semantics in
   * HTML and visual state synchronization in JavaScript.
   */
  function openSidebar() {
    const sidebar = document.getElementById("sidebar");

    if (!sidebar) {
      return;
    }

    const isCurrentlyVisible = window.getComputedStyle(sidebar).display !== "none";
    const shouldOpen = !isCurrentlyVisible;

    sidebar.style.display = shouldOpen ? "block" : "none";
    setSidebarExpandedState(shouldOpen);
  }

  /**
   * Closes the sidebar and returns focus to the sidebar toggle button when
   * possible.
   *
   * Accessibility rationale:
   * Returning focus to the control that opened a region helps keyboard users
   * maintain orientation after a panel is closed. This mirrors common dialog
   * and disclosure patterns where focus returns to the triggering control.
   */
  function closeSidebar() {
    const sidebar = document.getElementById("sidebar");

    if (!sidebar) {
      return;
    }

    sidebar.style.display = "none";
    setSidebarExpandedState(false);

    const toggleButton = getSidebarToggleButton();

    if (toggleButton) {
      toggleButton.focus();
    }
  }

  /**
   * Updates aria-sort on sortable table headers.
   *
   * Accessibility rationale:
   * The visual table order changes after sorting. aria-sort gives assistive
   * technologies a programmatic indication of which column is currently sorted.
   * The existing BizTrack sorting behavior sorts in ascending order only, so
   * the active column is marked as "ascending".
   *
   * @param {HTMLButtonElement} activeButton - The sort button that was used.
   */
  function updateSortState(activeButton) {
    if (!activeButton) {
      return;
    }

    const activeHeader = activeButton.closest("th");

    document.querySelectorAll('th[data-sortable="true"]').forEach((header) => {
      header.setAttribute("aria-sort", "none");
    });

    if (activeHeader) {
      activeHeader.setAttribute("aria-sort", "ascending");
    }
  }

  /**
   * Initializes all table sort buttons on the current page.
   *
   * Accessibility rationale:
   * The old code attached click behavior directly to <th> elements. Table
   * headers are structural cells, not command buttons. The revised HTML places
   * a native <button> inside each sortable header. This function binds each
   * button to the existing page-level sortTable(column) function.
   */
  function initializeSortableTableHeaders() {
    const sortButtons = document.querySelectorAll(
      ".sort-button[data-sort-column]"
    );

    sortButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const column = button.dataset.sortColumn;

        if (typeof global.sortTable === "function") {
          global.sortTable(column);
          updateSortState(button);
        }
      });
    });
  }

  /**
   * Initializes accessibility behavior after the DOM is ready.
   *
   * Implementation note:
   * The script is loaded before some page-specific scripts, but the
   * DOMContentLoaded callback runs after those scripts have been parsed. This
   * allows initializeSortableTableHeaders() to call the page's sortTable()
   * function safely.
   */
  document.addEventListener("DOMContentLoaded", () => {
    setSidebarExpandedState(
      document.getElementById("sidebar")
        ? window.getComputedStyle(document.getElementById("sidebar")).display !==
            "none"
        : false
    );

    initializeSortableTableHeaders();
  });

  global.openSidebar = openSidebar;
  global.closeSidebar = closeSidebar;

  global.BizTrackAccessibility = {
    openSidebar,
    closeSidebar,
    updateSortState,
    initializeSortableTableHeaders,
  };
})(window);
```

---

# 五、第二步：删除旧的 sidebar 函数，避免覆盖新实现

因为 `accessibility.js` 已经定义了新的 `openSidebar()` 和 `closeSidebar()`，你必须删除以下文件里的旧函数，否则旧函数会覆盖新函数。

需要修改：

```text
script.js
products.js
orders.js
finances.js
help.js
```

把每个文件开头的这类代码删除：

```js
function openSidebar() {
  var side = document.getElementById('sidebar');
  side.style.display = (side.style.display === "block") ? "none" : "block";
}

function closeSidebar() {
  document.getElementById('sidebar').style.display = 'none';
}
```

`help.js` 可以直接改成下面这样：

```js
/**
 * help.js
 *
 * This file is intentionally minimal.
 *
 * Sidebar behavior was moved to accessibility.js so that all pages share the
 * same keyboard-accessible sidebar implementation. Keeping the sidebar logic
 * in one place avoids inconsistent behavior between Help, About, Dashboard,
 * Products, Orders, and Expenses pages.
 */
```

---

# 六、第三步：修改所有页面的 sidebar open/close markup

你需要在 6 个 HTML 文件中修改：

```text
index.html
products.html
orders.html
finances.html
help.html
about.html
```

## 6.1 替换 sidebar close icon

找到每个页面中的：

```html
<i class="fa-solid fa-xmark" title="Close" onclick="closeSidebar()"></i>
```

替换为：

```html
<button
    type="button"
    class="sidebar-close-button"
    aria-label="Close navigation menu"
    onclick="closeSidebar()"
>
    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
</button>
```

这里的关键变化是：

```text
旧：<i> 被当作按钮使用
新：真正的 <button>，图标只是装饰
```

## 6.2 替换 header menu icon

找到每个页面中的：

```html
<div class="menu-icon" onclick="openSidebar()">
    <i class="fa-solid fa-bars"></i>
</div>
```

替换为：

```html
<button
    type="button"
    class="menu-icon"
    data-sidebar-toggle
    aria-label="Open navigation menu"
    aria-controls="sidebar"
    aria-expanded="false"
    onclick="openSidebar()"
>
    <i class="fa-solid fa-bars" aria-hidden="true"></i>
</button>
```

这里的关键变化是：

```text
旧：clickable div，不能天然被键盘操作
新：native button，天然支持 Tab、Enter、Space
```

---

# 七、第四步：修改 script 加载顺序

你需要让每个 HTML 页面都加载 `accessibility.js`。

## 7.1 `index.html`

把底部改成：

```html
<!-- Shared accessibility behavior -->
<script src="./accessibility.js"></script>

<!-- Apex Charts -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/apexcharts/3.45.2/apexcharts.min.js"></script>
<script src="./script.js"></script>
<script>initializeChart()</script>
```

## 7.2 `products.html`

你应该已经有 `safe-dom.js`。改成：

```html
<script src="./safe-dom.js"></script>
<script src="./accessibility.js"></script>
<script src="./products.js"></script>
```

## 7.3 `orders.html`

```html
<script src="./safe-dom.js"></script>
<script src="./accessibility.js"></script>
<script src="./orders.js"></script>
```

## 7.4 `finances.html`

```html
<script src="./safe-dom.js"></script>
<script src="./accessibility.js"></script>
<script src="./finances.js"></script>
```

## 7.5 `help.html`

把：

```html
<script src="./help.js"></script>
```

改成：

```html
<script src="./accessibility.js"></script>
<script src="./help.js"></script>
```

## 7.6 `about.html`

把：

```html
<script src="./help.js"></script>
```

改成：

```html
<script src="./accessibility.js"></script>
<script src="./help.js"></script>
```

---

# 八、第五步：修改 Products 表格排序 header

在 `products.html` 中，把原来的：

```html
<th onclick="sortTable('prodID')">Product ID</th>
<th onclick="sortTable('prodName')">Product Name</th>
<th onclick="sortTable('prodDesc')">Description</th>
<th onclick="sortTable('prodCat')">Category</th>
<th onclick="sortTable('prodPrice')">Price</th>
<th onclick="sortTable('prodSold')">Units Sold</th>
<th>Action</th>
```

替换成：

```html
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="prodID" aria-label="Sort by Product ID">
        Product ID
    </button>
</th>
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="prodName" aria-label="Sort by Product Name">
        Product Name
    </button>
</th>
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="prodDesc" aria-label="Sort by Description">
        Description
    </button>
</th>
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="prodCat" aria-label="Sort by Category">
        Category
    </button>
</th>
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="prodPrice" aria-label="Sort by Price">
        Price
    </button>
</th>
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="prodSold" aria-label="Sort by Units Sold">
        Units Sold
    </button>
</th>
<th scope="col">Action</th>
```

你不需要再在 HTML 里写 `onclick="sortTable(...)"`。`accessibility.js` 会自动读取 `data-sort-column`，然后调用对应页面里的 `sortTable(column)`。

---

# 九、第六步：修改 Orders 表格排序 header

在 `orders.html` 中，把原来的：

```html
<th onclick="sortTable('orderID')">Order ID</th>
<th onclick="sortTable('orderDate')">Order Date</th>
<th onclick="sortTable('itemName')">Item Name</th>
<th onclick="sortTable('itemPrice')">Item Price</th>
<th onclick="sortTable('qtyBought')">Qty</th>
<th onclick="sortTable('shipping')">Shipping Fee</th>
<th onclick="sortTable('taxes')">Taxes</th>
<th onclick="sortTable('orderTotal')">Order Total</th>
<th onclick="sortTable('orderStatus')">Order Status</th>
<th>Action</th>
```

替换成：

```html
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="orderID" aria-label="Sort by Order ID">
        Order ID
    </button>
</th>
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="orderDate" aria-label="Sort by Order Date">
        Order Date
    </button>
</th>
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="itemName" aria-label="Sort by Item Name">
        Item Name
    </button>
</th>
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="itemPrice" aria-label="Sort by Item Price">
        Item Price
    </button>
</th>
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="qtyBought" aria-label="Sort by Quantity">
        Qty
    </button>
</th>
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="shipping" aria-label="Sort by Shipping Fee">
        Shipping Fee
    </button>
</th>
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="taxes" aria-label="Sort by Taxes">
        Taxes
    </button>
</th>
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="orderTotal" aria-label="Sort by Order Total">
        Order Total
    </button>
</th>
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="orderStatus" aria-label="Sort by Order Status">
        Order Status
    </button>
</th>
<th scope="col">Action</th>
```

---

# 十、第七步：修改 Finances 表格排序 header

在 `finances.html` 中，把原来的：

```html
<th onclick="sortTable('trID')">S/N</th>
<th onclick="sortTable('trDate')">Date</th>
<th onclick="sortTable('trCategory')">Expense Category</th>
<th onclick="sortTable('trAmount')">Amount</th>
<th onclick="sortTable('trNotes')">Notes</th>
<th>Action</th>
```

替换成：

```html
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="trID" aria-label="Sort by serial number">
        S/N
    </button>
</th>
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="trDate" aria-label="Sort by Date">
        Date
    </button>
</th>
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="trCategory" aria-label="Sort by Expense Category">
        Expense Category
    </button>
</th>
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="trAmount" aria-label="Sort by Amount">
        Amount
    </button>
</th>
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="trNotes" aria-label="Sort by Notes">
        Notes
    </button>
</th>
<th scope="col">Action</th>
```

---

# 十一、第八步：给 search input 添加可访问名称

目前搜索框主要依赖 placeholder：

```html
<input type="search" id="searchInput" placeholder="Search">
```

placeholder 不应作为唯一的 accessible name。你可以直接给不同页面加 `aria-label`。

## `products.html`

```html
<input type="search" id="searchInput" aria-label="Search products" placeholder="Search">
```

## `orders.html`

```html
<input type="search" id="searchInput" aria-label="Search orders" placeholder="Search">
```

## `finances.html`

```html
<input type="search" id="searchInput" aria-label="Search expenses" placeholder="Search">
```

同时把搜索图标改成装饰性：

```html
<i class="fas fa-search" aria-hidden="true"></i>
```

---

# 十二、第九步：修复 Help 和 About 页面底部 contact links

这个不是 Deficiency 2 的核心，但它和键盘导航、链接可访问性有关，而且你原始代码中 `<a>` 标签有明显语法问题。建议一并修复。

在 `help.html` 和 `about.html` 中，把 contact-icon 的内容替换成：

```html
<ul class="contact-icon">
    <li>
        <a
            href="https://www.linkedin.com/in/sumayyahmusa/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Sumayyah Musa's LinkedIn profile in a new tab"
        >
            <i class="fa-brands fa-linkedin" aria-hidden="true"></i>
        </a>
    </li>
    <li>
        <a
            href="https://github.com/sumusa/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Sumayyah Musa's GitHub profile in a new tab"
        >
            <i class="fa-brands fa-square-github" aria-hidden="true"></i>
        </a>
    </li>
    <li>
        <a
            href="mailto:info@summeesarts.com"
            aria-label="Send an email to Sumayyah Musa"
        >
            <i class="fa-solid fa-envelope" aria-hidden="true"></i>
        </a>
    </li>
</ul>
```

---

# 十三、第十步：更新 `styles.css`

这是本次修复最关键的 CSS 部分。

## 13.1 删除全局 `outline: none`

找到：

```css
* {
    margin: 0;
    padding: 0;
    border: none;
    outline: none;
    box-sizing: border-box;
    font-family: "Lato", sans-serif;
}
```

替换成：

```css
* {
    margin: 0;
    padding: 0;
    border: none;
    box-sizing: border-box;
    font-family: "Lato", sans-serif;
}
```

## 13.2 添加全局 focus-visible 样式

建议放在 `body` 后面：

```css
/*
 * Keyboard focus visibility
 *
 * Academic rationale:
 * The original prototype removed the browser's default focus outline globally
 * through `outline: none`. This created an accessibility barrier because
 * keyboard users could not reliably determine which control would be activated
 * by Enter or Space.
 *
 * The replacement uses :focus-visible so that keyboard users receive a strong
 * visual indicator while pointer users are not unnecessarily shown focus
 * outlines after ordinary mouse clicks.
 */
:focus-visible {
    outline: 3px solid var(--blue-color);
    outline-offset: 3px;
}
```

## 13.3 修改 form focus，不要再移除 outline

找到：

```css
.form-container input[type=text]:focus, 
.form-container input[type=date]:focus,
.form-container input[type=number]:focus {
    background-color: #ddd;
    outline: none;
}
```

替换成：

```css
.form-container input[type=text]:focus, 
.form-container input[type=date]:focus,
.form-container input[type=number]:focus,
.form-container select:focus {
    background-color: #ddd;
}
```

## 13.4 添加 menu button 和 close button 样式

放在 `.menu-icon i` 附近：

```css
/*
 * Sidebar control buttons
 *
 * Accessibility rationale:
 * The menu trigger and close control are now native buttons. These styles keep
 * the original visual design while preserving button semantics, keyboard
 * focusability, and Enter/Space activation.
 */
.menu-icon,
.sidebar-close-button {
    background: transparent;
    color: inherit;
    cursor: pointer;
    border: none;
    padding: 0.25rem;
    border-radius: 6px;
}

.menu-icon i,
.sidebar-close-button i {
    font-size: 1.5rem;
}

.sidebar-close-button {
    color: var(--light-orange);
}

.sidebar-close-button:hover {
    color: var(--orange-color);
}
```

你原来有：

```css
.fa-xmark {
    cursor: pointer;
    color: var(--light-orange);
}
.fa-xmark:hover {
    color: var(--orange-color);
}
```

可以保留，但新的 `.sidebar-close-button` 会更准确。

## 13.5 修改 table header 和 sort button 样式

找到原来的：

```css
th {
    cursor: pointer;
    transition: background-color 0.5s;
    padding: 15px;
    text-align: left;
}
th:hover {
    color: var(--brown-color);
}
```

替换成：

```css
th {
    transition: background-color 0.5s;
    padding: 15px;
    text-align: left;
}

th:hover {
    color: var(--brown-color);
}

/*
 * Sort buttons inside table headers
 *
 * Accessibility rationale:
 * Sorting is an action, so the interactive target should be a native button
 * rather than the structural <th> element itself. The button is styled to look
 * like the previous header text while preserving keyboard semantics.
 */
.sort-button {
    background: transparent;
    color: inherit;
    cursor: pointer;
    font: inherit;
    font-weight: inherit;
    text-align: left;
    width: 100%;
    padding: 0;
}

.sort-button:hover {
    color: var(--brown-color);
}

.sort-button:focus-visible {
    outline: 3px solid var(--light-orange);
    outline-offset: 4px;
    border-radius: 4px;
}
```

## 13.6 更新 icon-button focus 样式

如果你按照 Deficiency 1 已经有 `.icon-button`，请把它扩展成：

```css
/*
 * Action icon buttons
 *
 * Accessibility rationale:
 * Edit/Delete controls were originally clickable <i> icons. They are now
 * native buttons generated by safe-dom.js. This makes them reachable by Tab
 * and activatable with Enter or Space.
 */
.icon-button {
    background: transparent;
    color: var(--black-color);
    cursor: pointer;
    padding: 0.25rem;
    margin-right: 0.75rem;
    border: none;
    line-height: 1;
    border-radius: 6px;
}

.icon-button:last-child {
    margin-right: 0;
}

.icon-button i {
    font-size: 1rem;
    pointer-events: none;
    transition: all 0.5s ease-out;
}

.icon-button:hover i {
    transform: scale(1.2);
}

.icon-button:focus-visible {
    outline: 3px solid var(--blue-color);
    outline-offset: 3px;
}
```

---

# 十四、检查 `products.js`、`orders.js`、`finances.js` 的排序函数

你不用大改 `sortTable(column)` 的核心排序逻辑，因为 `accessibility.js` 会负责给 `.sort-button` 添加 click listener。

但是建议在每个 `sortTable(column)` 函数上方加一段英文注释，说明这个函数现在由 keyboard-accessible sort buttons 触发。

例如 `products.js`：

```js
/**
 * Sorts the currently rendered product table by the selected column.
 *
 * Accessibility rationale:
 * This function is now triggered by native <button> elements placed inside
 * table headers. Using buttons preserves keyboard activation behavior
 * while keeping the original sorting algorithm unchanged.
 *
 * @param {string} column - The dataset field used for sorting.
 */
function sortTable(column) {
    const tbody = document.getElementById("tableBody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    const isNumeric = column === "prodPrice" || column === "prodSold";

    const sortedRows = rows.sort((a, b) => {
        const aValue = isNumeric ? parseFloat(a.dataset[column]) : a.dataset[column];
        const bValue = isNumeric ? parseFloat(b.dataset[column]) : b.dataset[column];

        if (typeof aValue === "string" && typeof bValue === "string") {
            return aValue.localeCompare(bValue, undefined, { sensitivity: "base" });
        } else {
            return aValue - bValue;
        }
    });

    rows.forEach(row => tbody.removeChild(row));
    sortedRows.forEach(row => tbody.appendChild(row));
}
```

同理给 `orders.js` 和 `finances.js` 的 `sortTable(column)` 加相同风格注释即可。

---

# 十五、修改后你要怎样测试？

完成修改后，强制刷新页面：

```text
Cmd + Shift + R
```

然后测试。

## Test 1：Sidebar keyboard test

```text
1. 打开 index.html。
2. 按 Tab，观察是否能 focus 到 menu button。
3. 按 Enter 或 Space。
4. sidebar 应该可以打开或关闭。
5. focus indicator 应该清楚可见。
```

## Test 2：Close sidebar keyboard test

```text
1. 打开 sidebar。
2. 按 Tab 到 close button。
3. 按 Enter 或 Space。
4. sidebar 应关闭。
5. focus 应返回 menu button。
```

## Test 3：Table sorting keyboard test

```text
1. 打开 products.html。
2. 按 Tab 到 Product ID sort button。
3. 按 Enter。
4. 表格按 Product ID 排序。
5. 对 Price / Units Sold 重复测试。
```

Orders 和 Finances 也同样测试。

## Test 4：Edit/Delete keyboard test

因为 Deficiency 1 已经把 edit/delete 改成 `<button>`，现在你要确认：

```text
1. 按 Tab 可以 focus 到 edit/delete。
2. focus outline 可见。
3. 按 Enter 或 Space 可以触发 edit/delete。
```

## Test 5：Lighthouse Accessibility

```text
1. F12 打开 Chrome DevTools。
2. Lighthouse。
3. Desktop。
4. 只选 Accessibility。
5. Analyze page load。
```

课程 guideline 要求 baseline 里 Lighthouse Accessibility 90+，你这个 deficiency 的修复应该能直接帮助提高分数。

---

# 十六、修改后 commit

测试通过后：

```bash
git add .
git commit -m "fix: improve keyboard accessibility and focus visibility"
```

课程材料提醒，report 需要 old-vs-new code、截图或 preview links，PR/commit 描述最好回答改了什么、为什么改、old-vs-new 在哪里、有哪些截图。

---

# 十七、中文版 README：给 report 同学用

新建：

```text
DEFICIENCY_2_ACCESSIBILITY_FIX_README.md
```

复制下面内容。

````markdown
# Deficiency 2 修复说明：Non-semantic Interactive Elements and Removed Focus Indicators

## 1. 缺陷名称

Non-semantic Interactive Elements and Removed Focus Indicators Harm Keyboard Accessibility

中文说明：原始 BizTrack 代码中存在多个“视觉上可点击，但语义上不是按钮”的元素，例如 clickable `<div>`、clickable `<i>` icon、clickable `<th>` table header。同时，`styles.css` 中全局使用 `outline: none` 移除了浏览器默认键盘焦点样式，导致键盘用户无法清楚知道当前 focus 在哪个控件上。

---

## 2. 缺陷出现的位置

本缺陷主要出现在以下文件：

- `index.html`
- `products.html`
- `orders.html`
- `finances.html`
- `help.html`
- `about.html`
- `styles.css`
- `products.js`
- `orders.js`
- `finances.js`
- `script.js`
- `help.js`

典型原始代码如下：

```html
<div class="menu-icon" onclick="openSidebar()">
    <i class="fa-solid fa-bars"></i>
</div>
````

```html
<i class="fa-solid fa-xmark" title="Close" onclick="closeSidebar()"></i>
```

```html
<th onclick="sortTable('prodID')">Product ID</th>
```

```css
* {
    outline: none;
}
```

---

## 3. 为什么这是一个 deficiency？

这个问题影响 keyboard-only users 和 assistive technology users。

原始实现的问题包括：

1. `<div>` 默认不是 button，不天然支持 Enter / Space 激活。
2. `<i>` 是图标元素，不应该承担按钮职责。
3. `<th>` 是表格结构元素，不应该直接作为 command control 使用。
4. 全局 `outline: none` 移除了键盘 focus indicator。
5. 用户通过 Tab 导航时，很难知道当前选中了哪个控件。
6. Edit/Delete icon 在修复 Deficiency 1 后已变为 button，但仍需要清晰的 focus style。

这与 coursework guideline 中的 Accessibility - Keyboard Focus 示例直接对应：用户无法通过 Tab 使用菜单，或 focus indicator 不可见。

---

## 4. Detection：如何检测这个问题？

### 4.1 Manual keyboard testing

在修复前，只使用键盘操作页面：

1. 打开 `products.html`。
2. 按 `Tab`。
3. 检查是否能 focus 到 menu icon。
4. 检查是否能 focus 到 table headers。
5. 检查是否能 focus 到 edit/delete icons。
6. 检查 focus indicator 是否可见。

修复前常见现象：

* menu icon 是 `<div>`，键盘无法自然 focus。
* close icon 是 `<i>`，键盘无法自然 focus。
* table header 是 `<th onclick>`，不是真正的 button。
* 因为 CSS 中 `outline: none`，即使某些元素可以 focus，也看不到清晰轮廓。

### 4.2 Lighthouse / axe DevTools

可以使用 Chrome Lighthouse 或 axe DevTools 检测 accessibility 问题。

建议保存：

* `before-keyboard-focus-products.mp4`
* `before-keyboard-focus-orders.mp4`
* `before-lighthouse-accessibility.png`
* `after-lighthouse-accessibility.png`

---

## 5. Literature / Research Rationale

本修复主要依据以下 accessibility principles：

1. WCAG 2.2 SC 2.4.7 Focus Visible 要求键盘可操作的界面必须有可见 focus indicator。没有可见 focus 时，键盘用户无法知道当前会被激活的元素。
2. MDN keyboard accessibility guidance 指出，可点击元素应该可以被键盘 focus，并应具有 interactive semantics。
3. WAI-ARIA Button Pattern 指出，button 在获得焦点时应能通过 `Space` 和 `Enter` 激活。使用原生 `<button>` 可以自动获得这些键盘行为，而不需要手写复杂 keyboard handler。

因此，本修复没有通过给 `<div>` 和 `<i>` 强行添加 `tabindex` 与 keydown handler 来“模拟按钮”，而是直接使用原生 `<button>`。这种方式更简单、更可靠，也更符合语义化 HTML。

---

## 6. Implementation / Code Changes

### 6.1 新增 `accessibility.js`

新增文件：

```text
accessibility.js
```

该文件负责：

* `openSidebar()`
* `closeSidebar()`
* `aria-expanded` 状态同步
* close sidebar 后 focus 返回 menu button
* 初始化 table sort buttons
* 更新 `aria-sort`

---

### 6.2 Sidebar menu trigger 从 `<div>` 改为 `<button>`

修复前：

```html
<div class="menu-icon" onclick="openSidebar()">
    <i class="fa-solid fa-bars"></i>
</div>
```

修复后：

```html
<button
    type="button"
    class="menu-icon"
    data-sidebar-toggle
    aria-label="Open navigation menu"
    aria-controls="sidebar"
    aria-expanded="false"
    onclick="openSidebar()"
>
    <i class="fa-solid fa-bars" aria-hidden="true"></i>
</button>
```

关键改进：

* `<button>` 可以被 Tab focus；
* Enter / Space 可以触发；
* `aria-controls` 表明该按钮控制 sidebar；
* `aria-expanded` 表示 sidebar 当前展开状态；
* icon 设置 `aria-hidden="true"`，避免被屏幕阅读器重复读取。

---

### 6.3 Sidebar close icon 从 `<i>` 改为 `<button>`

修复前：

```html
<i class="fa-solid fa-xmark" title="Close" onclick="closeSidebar()"></i>
```

修复后：

```html
<button
    type="button"
    class="sidebar-close-button"
    aria-label="Close navigation menu"
    onclick="closeSidebar()"
>
    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
</button>
```

关键改进：

* close control 现在是语义化 button；
* 键盘用户可以 focus 并激活；
* `aria-label` 提供可访问名称；
* close 后 focus 返回 menu toggle，帮助用户保持导航位置。

---

### 6.4 Table sorting 从 clickable `<th>` 改为 `<button>`

修复前：

```html
<th onclick="sortTable('prodID')">Product ID</th>
```

修复后：

```html
<th scope="col" data-sortable="true" aria-sort="none">
    <button type="button" class="sort-button" data-sort-column="prodID" aria-label="Sort by Product ID">
        Product ID
    </button>
</th>
```

关键改进：

* `<th>` 保留表格结构语义；
* `<button>` 承担 sorting action；
* `scope="col"` 表示列标题；
* `aria-sort` 提供排序状态；
* `data-sort-column` 让 JS 读取排序字段，避免把行为硬编码在结构元素上。

---

### 6.5 删除全局 `outline: none`

修复前：

```css
* {
    outline: none;
}
```

修复后：

```css
:focus-visible {
    outline: 3px solid var(--blue-color);
    outline-offset: 3px;
}
```

关键改进：

* 恢复键盘 focus indicator；
* 使用 `:focus-visible` 避免鼠标点击后出现过多视觉干扰；
* 键盘用户可以清楚看到当前 focus 位置。

---

### 6.6 Search input 添加 accessible name

修复前：

```html
<input type="search" id="searchInput" placeholder="Search">
```

修复后：

```html
<input type="search" id="searchInput" aria-label="Search products" placeholder="Search">
```

关键改进：

* placeholder 不再是唯一可访问名称；
* screen reader 可以明确读出搜索框用途。

---

### 6.7 Contact links 修复

Help 和 About 页面中的 contact links 原本存在 HTML 语法问题和缺少 accessible label 的问题。本次修复统一改为：

```html
<a
    href="https://github.com/sumusa/"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Open Sumayyah Musa's GitHub profile in a new tab"
>
    <i class="fa-brands fa-square-github" aria-hidden="true"></i>
</a>
```

关键改进：

* 修复 `<a>` 标签语法；
* icon-only link 有 `aria-label`；
* 新标签页链接添加 `rel="noopener noreferrer"`。

---

## 7. Before vs After 总结

| 项目                    | 修改前                     | 修改后                               |
| --------------------- | ----------------------- | --------------------------------- |
| Sidebar open control  | clickable `<div>`       | semantic `<button>`               |
| Sidebar close control | clickable `<i>`         | semantic `<button>`               |
| Table sorting         | clickable `<th>`        | `<button>` inside `<th>`          |
| Focus indicator       | global `outline: none`  | visible `:focus-visible` outline  |
| Sort state            | no programmatic state   | `aria-sort` updated after sorting |
| Icon-only controls    | unclear accessible name | `aria-label` provided             |
| Search inputs         | placeholder only        | `aria-label` added                |

---

## 8. 修复后的验证方式

### 8.1 Keyboard-only test

1. 打开 Products 页面。
2. 只使用 `Tab`、`Shift + Tab`、`Enter`、`Space`。
3. 确认 menu button、close button、sort buttons、edit/delete buttons 都可以被 focus。
4. 确认 focus indicator 清楚可见。
5. 确认 Enter / Space 可以触发按钮。

### 8.2 Lighthouse test

1. 打开 Chrome DevTools。
2. 进入 Lighthouse。
3. 选择 Desktop。
4. 只选择 Accessibility。
5. 点击 Analyze page load。
6. 保存 after screenshot。

### 8.3 Regression test

确认原有功能仍然正常：

* sidebar open/close；
* product/order/expense sorting；
* product/order/expense add/edit/delete；
* search；
* CSV export；
* safe DOM rendering from Deficiency 1。

---

## 9. 与课程内容的对应关系

本次修复符合 CPT304 coursework 的 Research-Led Software Enhancement 要求。该作业要求从源码中审计 4 个具体 deficiencies，而不是只补 baseline standards。本缺陷属于 accessibility-related source code deficiency，因为它来自原始代码中的 non-semantic controls 和 removed focus indicator。

本修复也符合 D–L–I 框架：

* Detection：通过 keyboard-only manual testing、Lighthouse、axe DevTools 发现问题。
* Literature：依据 WCAG Focus Visible、MDN keyboard accessibility、WAI-ARIA Button Pattern。
* Implementation：将 clickable div/i/th 改为 native button；恢复 focus-visible；添加 aria-expanded、aria-controls、aria-sort、aria-label。

---

## 10. 可用于 report 的 Implementation Rationale 草稿

The original BizTrack interface used non-semantic elements such as `<div>`, `<i>`, and `<th>` as interactive controls. These elements were clickable with a mouse but did not provide reliable keyboard semantics. In addition, the global CSS rule `outline: none` removed visible focus indicators, making keyboard navigation difficult. Following WCAG Focus Visible and keyboard accessibility guidance, the implementation was refactored to use native `<button>` elements for sidebar controls and table sorting. Visible `:focus-visible` styles were added, and ARIA attributes such as `aria-expanded`, `aria-controls`, and `aria-sort` were introduced to communicate interaction state. This preserves the original visual design while making the interface operable and understandable for keyboard and assistive technology users.

---

## 11. 建议 commit message

```bash
git commit -m "fix: improve keyboard accessibility and focus visibility"
```

```

---

# 十八、你可以发给 report 同学的简短说明

:::writing{variant="chat_message" id="29184"}
我已经完成 Deficiency 2：Non-semantic Interactive Elements and Removed Focus Indicators 的修复。原始代码中 sidebar menu 使用 clickable div，close 使用 clickable i icon，table sorting 使用 clickable th，同时 CSS 全局设置 outline: none，导致键盘用户无法可靠地 Tab 到控件，也无法看到当前 focus 位置。

修复后，我新增了 accessibility.js，把 sidebar 状态和 table sort 初始化集中处理；将 menu/close controls 改成 semantic button；将 table headers 的排序行为改成 th 内部的 button；恢复并增强 :focus-visible 样式；为 search input、icon buttons、contact links 添加 aria-label 或 aria-hidden。这样用户可以只用 Tab、Enter、Space 操作主要交互控件，并且能清楚看到当前焦点。建议 report 按 Detection–Literature–Implementation 写：Detection 用 keyboard-only test、Lighthouse/axe；Literature 引用 WCAG Focus Visible、MDN keyboard accessibility、WAI-ARIA Button Pattern；Implementation 写 div/i/th → button、outline none → focus-visible、增加 aria-expanded/aria-sort 的 before-vs-after。
:::

完成这些修改后，把你遇到的报错、Lighthouse 分数、或者页面显示异常发给我，我可以继续帮你做逐项 debugging。
::contentReference[oaicite:8]{index=8}
```

[1]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Keyboard?utm_source=chatgpt.com "Keyboard accessible - Accessibility | MDN"
[2]: https://www.w3.org/WAI/ARIA/apg/patterns/button/?utm_source=chatgpt.com "Button Pattern | APG | WAI | W3C"
[3]: https://www.w3.org/WAI/WCAG22/UNDERSTANDING/focus-visible.html?utm_source=chatgpt.com "Understanding Success Criterion 2.4.7: Focus Visible | WAI | W3C"
