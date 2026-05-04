好的，我们现在只处理 **Deficiency 1：Unsafe DOM Rendering / XSS Risk**。我会按“你可以直接照着改”的方式来写，并且会给你一个中文版 README 模板，方便你之后直接交给 report 同学。

这次修改的核心目标是：

> **把用户可控数据从不安全的 `innerHTML` 渲染方式，改为安全的 DOM API 渲染方式，例如 `textContent`、`createElement()`、`appendChild()` 和 `addEventListener()`。**

这正好符合 coursework 的要求：你们需要从原始源码中识别 4 个具体 deficiencies，并用 Detection–Literature–Implementation 的结构说明“发现了什么、为什么这样修、如何修”。课程 workshop 也明确说 D–L–I 应该回答 What、Why、How，并且 Implementation 部分要展示 old-vs-new code 和 logic bridge。

---

# 一、这个 deficiency 到底是什么？

你现在的代码里，Products、Orders、Finances 三个页面都存在类似逻辑：

```js
row.innerHTML = `
  <td>${userControlledValue}</td>
`;
```

这类代码的问题是：如果 `userControlledValue` 不是普通文本，而是 HTML 或带事件的标签，浏览器可能会把它当成 HTML 解析。

例如用户在 Product Description 里输入：

```html
<img src=x onerror=alert('XSS')>
```

原代码会把它拼进：

```js
<td>${product.prodDesc}</td>
```

浏览器可能会把它当成真正的 `<img>` 元素，并执行 `onerror`。这就是典型的 DOM-based XSS 风险。

OWASP 对 XSS 的定义是：当应用把来自不可信来源的数据包含进动态内容，并且没有进行适当验证或编码时，攻击者可能注入浏览器端脚本。OWASP 的 XSS Prevention Cheat Sheet 也明确建议开发者移除对不安全 sink，例如 `innerHTML`，的依赖，并优先使用 `textContent` 等安全 sink。([OWASP][1]) OWASP DOM-based XSS Prevention Cheat Sheet 也直接指出，如果要把用户输入写入 `div` 等元素，不应使用 `innerHTML`，而应使用 `innerText` 或 `textContent`。([OWASP Cheat Sheet Series][2])

---

# 二、修改前你先做一件事：保存 baseline

你现在先在项目根目录执行：

```bash
git status
git add .
git commit -m "chore: save original BizTrack baseline before XSS fix"
```

然后做一张 before screenshot：

1. 打开 `http://localhost:5173/products.html`
2. 点击 `Add Product`
3. Product ID 输入：

   ```text
   PD999
   ```
4. Product Description 输入：

   ```html
   <img src=x onerror=alert('XSS')>
   ```
5. 提交后截图，保存为：

   ```text
   evidence/before-xss-products.png
   ```

如果没有弹窗，也请打开 DevTools → Elements，看它是否作为真实 `<img>` 标签进入 DOM。因为 XSS 风险不仅仅看是否弹窗，还看 **用户输入是否被当作 HTML 解释**。

---

# 三、你需要新增一个文件：`safe-dom.js`

请在项目根目录新建文件：

```text
safe-dom.js
```

然后把下面完整代码复制进去。

```js
/**
 * safe-dom.js
 *
 * Security-focused DOM utility functions for BizTrack.
 *
 * Academic rationale:
 * This file centralizes safe DOM rendering practices used by the Products,
 * Orders, and Expenses pages. The original implementation rendered
 * user-controlled values with `innerHTML`, which is an unsafe DOM sink when
 * the inserted string contains untrusted data. In contrast, `textContent`
 * inserts the value as text rather than parsing it as HTML. This design
 * follows the security principle of output encoding / safe sink selection:
 * data should be displayed as data, not executed as code.
 *
 * Scope of this file:
 * - Prevent user-controlled product/order/transaction fields from being
 *   interpreted as HTML.
 * - Avoid dynamically generated inline event handlers such as
 *   onclick="editRow('${userInput}')".
 * - Provide small reusable helpers so that the same defensive rendering
 *   strategy is applied consistently across multiple pages.
 *
 * Note:
 * This file intentionally does not use ES modules because the original
 * BizTrack project is a simple static multi-page application. To minimize
 * architectural disruption, the helpers are exposed through one global
 * namespace: window.BizTrackSafeDOM.
 */

(function exposeSafeDOMUtilities(global) {
  "use strict";

  /**
   * Removes all child nodes from a DOM element.
   *
   * Security rationale:
   * Setting `element.innerHTML = ""` is commonly used to clear a container.
   * Although clearing with an empty string is not directly dangerous, using
   * DOM node removal keeps the rendering style consistent: this project now
   * avoids `innerHTML` in dynamic table-rendering code altogether.
   *
   * @param {Element} element - The DOM element to clear.
   */
  function clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  /**
   * Converts any value into a display-safe string.
   *
   * Security rationale:
   * User input may be null, undefined, numeric, or string-based. Normalizing
   * values before rendering prevents accidental insertion of JavaScript values
   * such as `undefined` into the UI, while still treating the final result as
   * plain text.
   *
   * @param {*} value - The value to normalize for text display.
   * @returns {string} A safe string representation for textContent.
   */
  function toDisplayText(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value);
  }

  /**
   * Formats a value as currency for display.
   *
   * Defensive programming rationale:
   * Data from localStorage can be modified by users or become inconsistent.
   * Therefore, values are converted to numbers and checked before formatting.
   * This reduces the likelihood of runtime errors during table rendering.
   *
   * @param {*} value - The value expected to represent a number.
   * @returns {string} A formatted currency string.
   */
  function formatCurrency(value) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return "$0.00";
    }

    return `$${numericValue.toFixed(2)}`;
  }

  /**
   * Appends a table cell whose content is inserted as text, not HTML.
   *
   * Security rationale:
   * `textContent` is used instead of `innerHTML`. This means that a payload
   * such as `<img src=x onerror=alert(1)>` will be displayed literally as text
   * rather than parsed into an executable HTML element.
   *
   * @param {HTMLTableRowElement} row - The table row receiving the new cell.
   * @param {*} value - The value to display inside the cell.
   * @param {string} [className] - Optional CSS class for the cell.
   * @returns {HTMLTableCellElement} The created table cell.
   */
  function appendTextCell(row, value, className = "") {
    const cell = document.createElement("td");

    if (className) {
      cell.className = className;
    }

    cell.textContent = toDisplayText(value);
    row.appendChild(cell);

    return cell;
  }

  /**
   * Creates an icon-only button using DOM APIs and a programmatic label.
   *
   * Security rationale:
   * The original code generated action controls using inline HTML strings:
   * `<i onclick="editRow('${userInput}')">`. If user input contained quotes
   * or JavaScript syntax, it could break out of the intended string context.
   *
   * This function avoids that risk by:
   * 1. Creating elements with `document.createElement`.
   * 2. Binding behavior with `addEventListener`, not inline JavaScript.
   * 3. Keeping the icon class fixed by the developer, not controlled by users.
   *
   * Accessibility note:
   * The `aria-label` gives icon-only controls a readable name for assistive
   * technologies. This primarily supports accessibility, but it is included
   * here because the XSS fix changes the action controls from icons into
   * real button elements.
   *
   * @param {Object} options - Button construction options.
   * @param {string} options.label - Accessible label for the button.
   * @param {string} options.iconClassName - Font Awesome class names.
   * @param {Function} options.onClick - Click handler.
   * @param {string} [options.title] - Optional visible tooltip.
   * @param {string} [options.className] - Optional CSS class for the button.
   * @returns {HTMLButtonElement} The created button.
   */
  function createIconButton({
    label,
    iconClassName,
    onClick,
    title = "",
    className = "icon-button",
  }) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);

    if (title) {
      button.title = title;
    }

    button.addEventListener("click", onClick);

    const icon = document.createElement("i");
    icon.className = iconClassName;
    icon.setAttribute("aria-hidden", "true");

    button.appendChild(icon);

    return button;
  }

  /**
   * Appends a table cell containing edit/delete action buttons.
   *
   * Security rationale:
   * Action cells used to be generated with a template string containing
   * inline event handlers. This helper ensures that action controls are
   * created as DOM nodes and receive behavior through event listeners.
   *
   * @param {HTMLTableRowElement} row - The row receiving the action cell.
   * @param {HTMLButtonElement[]} buttons - Buttons to place in the action cell.
   * @returns {HTMLTableCellElement} The created action cell.
   */
  function appendActionCell(row, buttons) {
    const cell = document.createElement("td");
    cell.className = "action";

    buttons.forEach((button) => {
      cell.appendChild(button);
    });

    row.appendChild(cell);

    return cell;
  }

  /**
   * Appends an order-status cell using a whitelisted CSS class.
   *
   * Security rationale:
   * The status label is inserted with `textContent`, and the CSS class should
   * come from a developer-controlled whitelist rather than raw user input.
   *
   * @param {HTMLTableRowElement} row - The row receiving the status cell.
   * @param {*} label - The status text to display.
   * @param {string} statusClassName - Whitelisted CSS class for styling.
   * @returns {HTMLTableCellElement} The created status cell.
   */
  function appendStatusCell(row, label, statusClassName) {
    const cell = document.createElement("td");

    const statusWrapper = document.createElement("div");
    statusWrapper.className = `status ${statusClassName || ""}`.trim();

    const statusText = document.createElement("span");
    statusText.textContent = toDisplayText(label);

    statusWrapper.appendChild(statusText);
    cell.appendChild(statusWrapper);
    row.appendChild(cell);

    return cell;
  }

  /**
   * Replaces an element's content with a single text span.
   *
   * Security rationale:
   * This helper is used for summary values such as total revenue and expenses.
   * It preserves simple markup while avoiding dynamic `innerHTML`.
   *
   * @param {Element} element - The element whose content should be replaced.
   * @param {*} value - The text value to display.
   * @returns {HTMLSpanElement} The created span element.
   */
  function setSingleTextSpan(element, value) {
    clearElement(element);

    const span = document.createElement("span");
    span.textContent = toDisplayText(value);
    element.appendChild(span);

    return span;
  }

  global.BizTrackSafeDOM = {
    clearElement,
    toDisplayText,
    formatCurrency,
    appendTextCell,
    createIconButton,
    appendActionCell,
    appendStatusCell,
    setSingleTextSpan,
  };
})(window);
```

---

# 四、修改 HTML：在三个页面里先加载 `safe-dom.js`

你需要修改：

```text
products.html
orders.html
finances.html
```

## 1. `products.html`

把原来的：

```html
<script src="./products.js"></script>
```

改成：

```html
<script src="./safe-dom.js"></script>
<script src="./products.js"></script>
```

## 2. `orders.html`

把原来的：

```html
<script src="./orders.js"></script>
```

改成：

```html
<script src="./safe-dom.js"></script>
<script src="./orders.js"></script>
```

## 3. `finances.html`

把原来的：

```html
<script src="./finances.js"></script>
```

改成：

```html
<script src="./safe-dom.js"></script>
<script src="./finances.js"></script>
```

注意：`safe-dom.js` 必须放在页面自己的 JS 前面，因为 `products.js`、`orders.js`、`finances.js` 会调用 `BizTrackSafeDOM`。

---

# 五、修改 `products.js`

你现在只需要替换 `renderProducts(products)` 这一个函数。

找到原来的：

```js
function renderProducts(products) {
  ...
}
```

把整个函数替换成下面这个版本。

```js
function renderProducts(products) {
  const prodTableBody = document.getElementById("tableBody");

  /*
   * SECURITY FIX:
   * The previous implementation used `prodTableBody.innerHTML = ""` and later
   * assigned a template string to `prodRow.innerHTML`. Because product fields
   * such as `prodID` and `prodDesc` originate from user input and localStorage,
   * rendering them with `innerHTML` could allow DOM-based XSS.
   *
   * The table is now cleared and rebuilt using DOM APIs. User-controlled values
   * are inserted only through `textContent` via BizTrackSafeDOM.appendTextCell().
   */
  BizTrackSafeDOM.clearElement(prodTableBody);

  products.forEach((product) => {
    const prodRow = document.createElement("tr");
    prodRow.className = "product-row";

    /*
     * Dataset values are used only for sorting/searching metadata. They are
     * not interpreted as HTML. Visible table content is handled separately
     * through textContent-based rendering.
     */
    prodRow.dataset.prodID = product.prodID;
    prodRow.dataset.prodName = product.prodName;
    prodRow.dataset.prodDesc = product.prodDesc;
    prodRow.dataset.prodCat = product.prodCat;
    prodRow.dataset.prodPrice = product.prodPrice;
    prodRow.dataset.prodSold = product.prodSold;

    BizTrackSafeDOM.appendTextCell(prodRow, product.prodID);
    BizTrackSafeDOM.appendTextCell(prodRow, product.prodName);
    BizTrackSafeDOM.appendTextCell(prodRow, product.prodDesc);
    BizTrackSafeDOM.appendTextCell(prodRow, product.prodCat);
    BizTrackSafeDOM.appendTextCell(
      prodRow,
      BizTrackSafeDOM.formatCurrency(product.prodPrice)
    );
    BizTrackSafeDOM.appendTextCell(prodRow, product.prodSold);

    /*
     * SECURITY FIX:
     * The original code embedded product IDs inside inline onclick handlers:
     * onclick="editRow('${product.prodID}')".
     *
     * This is unsafe because a crafted ID containing quotes or JavaScript-like
     * syntax could break the intended string context. The new implementation
     * binds behavior through addEventListener(), so product IDs are passed as
     * JavaScript values rather than interpolated into executable HTML.
     */
    const editButton = BizTrackSafeDOM.createIconButton({
      label: `Edit product ${BizTrackSafeDOM.toDisplayText(product.prodID)}`,
      title: "Edit",
      iconClassName: "fa-solid fa-pen-to-square",
      className: "icon-button edit-icon",
      onClick: () => editRow(product.prodID),
    });

    const deleteButton = BizTrackSafeDOM.createIconButton({
      label: `Delete product ${BizTrackSafeDOM.toDisplayText(product.prodID)}`,
      title: "Delete",
      iconClassName: "fas fa-trash-alt",
      className: "icon-button delete-icon",
      onClick: () => deleteProduct(product.prodID),
    });

    BizTrackSafeDOM.appendActionCell(prodRow, [editButton, deleteButton]);

    prodTableBody.appendChild(prodRow);
  });
}
```

---

# 六、修改 `orders.js`

你需要替换两个函数：

```text
renderOrders(orders)
displayRevenue()
```

## 1. 替换 `renderOrders(orders)`

找到原来的：

```js
function renderOrders(orders) {
  ...
}
```

把整个函数替换成下面这个版本。

```js
function renderOrders(orders) {
  const orderTableBody = document.getElementById("tableBody");

  /*
   * SECURITY FIX:
   * The previous implementation rendered order rows through `innerHTML`.
   * Several order fields are user-controlled, especially `orderID`, because
   * it is entered through a free-text input. The old code also inserted
   * `orderID` into inline onclick handlers, creating a dangerous JavaScript
   * execution context.
   *
   * This implementation rebuilds rows with DOM APIs and inserts user data
   * through textContent only.
   */
  BizTrackSafeDOM.clearElement(orderTableBody);

  /*
   * Security rationale:
   * CSS classes should not be built directly from arbitrary user-controlled
   * data. Although the order status normally comes from a select element, data
   * stored in localStorage can be manually modified. This whitelist maps known
   * status labels to developer-controlled CSS class names.
   */
  const statusMap = {
    Pending: "pending",
    Processing: "processing",
    Shipped: "shipped",
    Delivered: "delivered",
  };

  orders.forEach((order) => {
    const orderRow = document.createElement("tr");
    orderRow.className = "order-row";

    orderRow.dataset.orderID = order.orderID;
    orderRow.dataset.orderDate = order.orderDate;
    orderRow.dataset.itemName = order.itemName;
    orderRow.dataset.itemPrice = order.itemPrice;
    orderRow.dataset.qtyBought = order.qtyBought;
    orderRow.dataset.shipping = order.shipping;
    orderRow.dataset.taxes = order.taxes;
    orderRow.dataset.orderTotal = order.orderTotal;
    orderRow.dataset.orderStatus = order.orderStatus;

    BizTrackSafeDOM.appendTextCell(orderRow, order.orderID);
    BizTrackSafeDOM.appendTextCell(orderRow, order.orderDate);
    BizTrackSafeDOM.appendTextCell(orderRow, order.itemName);
    BizTrackSafeDOM.appendTextCell(
      orderRow,
      BizTrackSafeDOM.formatCurrency(order.itemPrice)
    );
    BizTrackSafeDOM.appendTextCell(orderRow, order.qtyBought);
    BizTrackSafeDOM.appendTextCell(
      orderRow,
      BizTrackSafeDOM.formatCurrency(order.shipping)
    );
    BizTrackSafeDOM.appendTextCell(
      orderRow,
      BizTrackSafeDOM.formatCurrency(order.taxes)
    );
    BizTrackSafeDOM.appendTextCell(
      orderRow,
      BizTrackSafeDOM.formatCurrency(order.orderTotal),
      "order-total"
    );

    BizTrackSafeDOM.appendStatusCell(
      orderRow,
      order.orderStatus,
      statusMap[order.orderStatus] || ""
    );

    /*
     * SECURITY FIX:
     * Inline onclick handlers have been replaced with event listeners.
     * This prevents order IDs from being interpolated into executable
     * JavaScript code.
     */
    const editButton = BizTrackSafeDOM.createIconButton({
      label: `Edit order ${BizTrackSafeDOM.toDisplayText(order.orderID)}`,
      title: "Edit",
      iconClassName: "fa-solid fa-pen-to-square",
      className: "icon-button edit-icon",
      onClick: () => editRow(order.orderID),
    });

    const deleteButton = BizTrackSafeDOM.createIconButton({
      label: `Delete order ${BizTrackSafeDOM.toDisplayText(order.orderID)}`,
      title: "Delete",
      iconClassName: "fas fa-trash-alt",
      className: "icon-button delete-icon",
      onClick: () => deleteOrder(order.orderID),
    });

    BizTrackSafeDOM.appendActionCell(orderRow, [editButton, deleteButton]);

    orderTableBody.appendChild(orderRow);
  });

  displayRevenue();
}
```

## 2. 替换 `displayRevenue()`

原来的 `displayRevenue()` 使用了 `innerHTML`：

```js
resultElement.innerHTML = `
    <span>Total Revenue: $${totalRevenue.toFixed(2)}</span>
`;
```

把整个函数替换成：

```js
function displayRevenue() {
  const resultElement = document.getElementById("total-revenue");

  /*
   * SECURITY FIX:
   * Although totalRevenue is calculated numerically, this function now follows
   * the same safe rendering convention as the table rows: DOM nodes are created
   * explicitly and text is inserted through textContent.
   */
  const totalRevenue = orders.reduce(
    (total, order) => total + Number(order.orderTotal || 0),
    0
  );

  BizTrackSafeDOM.setSingleTextSpan(
    resultElement,
    `Total Revenue: $${totalRevenue.toFixed(2)}`
  );
}
```

---

# 七、修改 `finances.js`

你也需要替换两个函数：

```text
renderTransactions(transactions)
displayExpenses()
```

## 1. 替换 `renderTransactions(transactions)`

找到原来的：

```js
function renderTransactions(transactions) {
  ...
}
```

把整个函数替换成下面这个版本。

```js
function renderTransactions(transactions) {
  const transactionTableBody = document.getElementById("tableBody");

  /*
   * SECURITY FIX:
   * The original transaction table was generated with `innerHTML`, and
   * transaction notes are free-text user input. Rendering notes through
   * innerHTML allows user-provided markup to be parsed as HTML.
   *
   * This implementation uses DOM API construction and textContent-based cells
   * so that notes such as `<img src=x onerror=alert(1)>` are displayed as text
   * rather than executed.
   */
  BizTrackSafeDOM.clearElement(transactionTableBody);

  transactions.forEach((transaction) => {
    const transactionRow = document.createElement("tr");
    transactionRow.className = "transaction-row";

    transactionRow.dataset.trID = transaction.trID;
    transactionRow.dataset.trDate = transaction.trDate;
    transactionRow.dataset.trCategory = transaction.trCategory;
    transactionRow.dataset.trAmount = transaction.trAmount;
    transactionRow.dataset.trNotes = transaction.trNotes;

    BizTrackSafeDOM.appendTextCell(transactionRow, transaction.trID);
    BizTrackSafeDOM.appendTextCell(transactionRow, transaction.trDate);
    BizTrackSafeDOM.appendTextCell(transactionRow, transaction.trCategory);
    BizTrackSafeDOM.appendTextCell(
      transactionRow,
      BizTrackSafeDOM.formatCurrency(transaction.trAmount),
      "tr-amount"
    );
    BizTrackSafeDOM.appendTextCell(transactionRow, transaction.trNotes);

    /*
     * SECURITY FIX:
     * The previous action icons used dynamically generated inline onclick
     * handlers. Event listeners avoid embedding transaction IDs inside HTML
     * or JavaScript strings.
     */
    const editButton = BizTrackSafeDOM.createIconButton({
      label: `Edit expense ${BizTrackSafeDOM.toDisplayText(transaction.trID)}`,
      title: "Edit",
      iconClassName: "fa-solid fa-pen-to-square",
      className: "icon-button edit-icon",
      onClick: () => editRow(transaction.trID),
    });

    const deleteButton = BizTrackSafeDOM.createIconButton({
      label: `Delete expense ${BizTrackSafeDOM.toDisplayText(transaction.trID)}`,
      title: "Delete",
      iconClassName: "fas fa-trash-alt",
      className: "icon-button delete-icon",
      onClick: () => deleteTransaction(transaction.trID),
    });

    BizTrackSafeDOM.appendActionCell(transactionRow, [
      editButton,
      deleteButton,
    ]);

    transactionTableBody.appendChild(transactionRow);
  });

  displayExpenses();
}
```

## 2. 替换 `displayExpenses()`

把原来的：

```js
function displayExpenses() {
    const resultElement = document.getElementById("total-expenses");

    const totalExpenses = transactions
        .reduce((total, transaction) => total + transaction.trAmount,0);

    resultElement.innerHTML = `
        <span>Total Expenses: $${totalExpenses.toFixed(2)}</span>
    `;
}
```

替换成：

```js
function displayExpenses() {
  const resultElement = document.getElementById("total-expenses");

  /*
   * SECURITY FIX:
   * Summary output is rendered using textContent-based DOM construction for
   * consistency with the safer rendering model adopted across the CRUD pages.
   */
  const totalExpenses = transactions.reduce(
    (total, transaction) => total + Number(transaction.trAmount || 0),
    0
  );

  BizTrackSafeDOM.setSingleTextSpan(
    resultElement,
    `Total Expenses: $${totalExpenses.toFixed(2)}`
  );
}
```

---

# 八、修改 `styles.css`，让新 button 看起来像原来的图标

因为我们把原来的 `<i onclick="...">` 改成了真正的 `<button>`，需要加一点 CSS。请在 `styles.css` 里找到这段附近：

```css
.edit-icon{
    padding-right: 1rem;
}
.action i {
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.5s ease-out;
}
.action i:hover {
    transform: scale(1.2);
}
```

建议替换成下面这段：

```css
/*
 * Action icon buttons
 *
 * Security-related UI adjustment:
 * Edit/Delete controls are now real <button> elements instead of clickable
 * <i> icons generated through innerHTML. This preserves the original visual
 * appearance while allowing JavaScript behavior to be attached safely through
 * addEventListener().
 */
.icon-button {
    background: transparent;
    color: var(--black-color);
    cursor: pointer;
    padding: 0.25rem;
    margin-right: 0.75rem;
    border: none;
    line-height: 1;
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
```

注意：这里还没有专门修复 `outline: none` 的 accessibility 问题，因为那是 Deficiency 2。现在只保证新按钮视觉上不乱。

---

# 九、修改后你应该如何测试？

完成上面的修改后，先强制刷新：

```text
Cmd + Shift + R
```

或者清除缓存后重新打开：

```text
http://localhost:5173/products.html
```

## Test 1：Products 页面 XSS 测试

在 Product Description 输入：

```html
<img src=x onerror=alert('XSS')>
```

修复后预期结果：

```text
页面不会弹出 alert。
表格中会原样显示这段文本。
DevTools Elements 里不应该出现真正的 <img> 节点。
```

## Test 2：Orders 页面 ID 注入测试

在 Order ID 输入：

```text
1006');alert('XSS');//
```

修复后预期结果：

```text
订单可以作为普通文本显示。
Edit/Delete 按钮仍然可以正常操作。
不会执行 alert。
页面 console 不应出现由 onclick 字符串破坏导致的错误。
```

## Test 3：Finances 页面 notes 测试

在 Notes 输入：

```html
<img src=x onerror=alert('XSS')>
```

修复后预期结果：

```text
不会弹窗。
Notes 单元格中显示普通文本。
Edit/Delete 功能正常。
```

## Test 4：原有功能回归测试

你还需要确认：

```text
Products: add / edit / delete / search / sort 正常。
Orders: add / edit / delete / search / sort / total revenue 正常。
Finances: add / edit / delete / search / sort / total expenses 正常。
localStorage 刷新后数据仍然存在。
```

---

# 十、修改后 commit

测试通过后执行：

```bash
git add .
git commit -m "fix: prevent unsafe DOM rendering in CRUD tables"
```

如果你们不用 branch，也至少保留这个 commit。coursework 里明确说 marker 会结合 contribution form、GitHub commit percentages 和具体任务来核查个人贡献。

---

# 十一、中文版 README：给 report 同学用

你可以新建一个文件：

```text
DEFICIENCY_1_XSS_FIX_README.md
```

然后复制下面内容。

````markdown
# Deficiency 1 修复说明：Unsafe DOM Rendering / XSS Risk

## 1. 缺陷名称

Unsafe DOM Rendering / DOM-based XSS Risk

中文说明：原始代码在 Products、Orders、Finances 三个核心 CRUD 页面中，使用 `innerHTML` 拼接并渲染用户输入数据，导致用户可控内容可能被浏览器当作 HTML 或 JavaScript 解析，从而产生 DOM-based XSS 风险。

---

## 2. 缺陷出现的位置

本缺陷主要出现在以下文件：

- `products.js`
  - `renderProducts(products)`
- `orders.js`
  - `renderOrders(orders)`
  - `displayRevenue()`
- `finances.js`
  - `renderTransactions(transactions)`
  - `displayExpenses()`

原始代码中的典型问题如下：

```js
prodRow.innerHTML = `
    <td>${product.prodID}</td>
    <td>${product.prodName}</td>
    <td>${product.prodDesc}</td>
    <td>${product.prodCat}</td>
    <td>$${product.prodPrice.toFixed(2)}</td>
    <td>${product.prodSold}</td>
    <td class="action">
      <i title="Edit" onclick="editRow('${product.prodID}')" class="edit-icon fa-solid fa-pen-to-square"></i>
      <i onclick="deleteProduct('${product.prodID}')" class="delete-icon fas fa-trash-alt"></i>
    </td>
`;
````

这里的核心问题是：`product.prodID`、`product.prodDesc` 等值来自用户输入或 localStorage，却被直接插入 `innerHTML`。如果用户输入 HTML payload，浏览器可能会将其解释为真实 DOM 节点，而不是普通文本。

---

## 3. 缺陷检测方式 Detection

本缺陷通过 manual security testing 和 source code inspection 发现。

### 3.1 手动复现方式

在 Products 页面中：

1. 打开 `products.html`。
2. 点击 `Add Product`。
3. Product ID 输入：`PD999`。
4. Product Description 输入：

```html
<img src=x onerror=alert('XSS')>
```

5. 点击提交。

### 3.2 修复前风险表现

在修复前，`product.prodDesc` 会通过 `innerHTML` 插入表格中。浏览器可能将 payload 解析为真正的 `<img>` 元素，并执行其中的事件处理器。

即使 payload 未在某些浏览器环境中成功弹窗，DevTools Elements 中仍可以观察到用户输入被解释为 HTML 节点，这说明数据进入了不安全 DOM sink。

### 3.3 建议保存的证据

* `before-xss-products.png`
* `before-xss-products-devtools-elements.png`
* `before-xss-orders-id-injection.png`
* `before-xss-finance-notes.png`

---

## 4. Literature / Research Rationale

本修复遵循前端安全中的 safe sink 思路。

OWASP XSS Prevention Cheat Sheet 指出，开发者应避免将不可信变量放入不安全 DOM sink，例如 `innerHTML`。对于需要显示为文本的内容，推荐使用 `textContent` 等安全 API，因为它会把输入作为文本处理，而不是作为 HTML 解析。

OWASP DOM-based XSS Prevention Cheat Sheet 也指出，如果要把用户输入写入页面元素，不应使用 `innerHTML`，而应使用 `innerText` 或 `textContent`。

因此，本次修复不是简单地“过滤某几个危险字符串”，而是改变输出方式：将用户输入从 HTML context 转换为 text context。

---

## 5. Implementation / Code Changes

### 5.1 新增文件：`safe-dom.js`

新增了一个公共安全 DOM 工具文件：

```text
safe-dom.js
```

该文件提供以下函数：

* `clearElement(element)`
* `toDisplayText(value)`
* `formatCurrency(value)`
* `appendTextCell(row, value, className)`
* `createIconButton(options)`
* `appendActionCell(row, buttons)`
* `appendStatusCell(row, label, statusClassName)`
* `setSingleTextSpan(element, value)`

这些函数的核心目标是让 Products、Orders、Finances 页面统一使用安全 DOM API 渲染数据。

---

### 5.2 修改 HTML script 加载顺序

在以下文件中添加：

```html
<script src="./safe-dom.js"></script>
```

并且必须放在页面自己的 JS 文件之前。

例如 `products.html`：

```html
<script src="./safe-dom.js"></script>
<script src="./products.js"></script>
```

同样修改：

* `orders.html`
* `finances.html`

---

### 5.3 修改 Products table rendering

原始代码：

```js
prodRow.innerHTML = `
    <td>${product.prodID}</td>
    <td>${product.prodName}</td>
    <td>${product.prodDesc}</td>
`;
```

新代码：

```js
BizTrackSafeDOM.appendTextCell(prodRow, product.prodID);
BizTrackSafeDOM.appendTextCell(prodRow, product.prodName);
BizTrackSafeDOM.appendTextCell(prodRow, product.prodDesc);
```

关键区别：

* 修复前：用户输入被插入 `innerHTML`，浏览器可能解析 HTML。
* 修复后：用户输入被插入 `textContent`，浏览器只把它作为文本显示。

---

### 5.4 修改 dynamic inline event handlers

原始代码：

```js
<i title="Edit" onclick="editRow('${product.prodID}')" class="edit-icon fa-solid fa-pen-to-square"></i>
```

新代码：

```js
const editButton = BizTrackSafeDOM.createIconButton({
  label: `Edit product ${BizTrackSafeDOM.toDisplayText(product.prodID)}`,
  title: "Edit",
  iconClassName: "fa-solid fa-pen-to-square",
  className: "icon-button edit-icon",
  onClick: () => editRow(product.prodID),
});
```

关键区别：

* 修复前：用户输入被插入 inline JavaScript 字符串。
* 修复后：事件通过 `addEventListener()` 绑定，用户输入不会被拼接成可执行代码。

---

### 5.5 修改 Orders status rendering

Orders 页面中，订单状态样式通过白名单映射处理：

```js
const statusMap = {
  Pending: "pending",
  Processing: "processing",
  Shipped: "shipped",
  Delivered: "delivered",
};
```

这样 CSS class 不直接来自任意用户输入，而是来自开发者定义的安全映射。

---

### 5.6 修改 summary rendering

`displayRevenue()` 和 `displayExpenses()` 不再使用 `innerHTML`，而是使用：

```js
BizTrackSafeDOM.setSingleTextSpan(...)
```

这样可以让页面整体遵循统一的安全渲染策略。

---

## 6. Before vs After 总结

| 项目             | 修改前                   | 修改后                                  |
| -------------- | --------------------- | ------------------------------------ |
| 表格数据渲染         | 使用 `innerHTML`        | 使用 `createElement()` + `textContent` |
| 用户输入处理         | 可能被解析为 HTML           | 只作为普通文本显示                            |
| Edit/Delete 操作 | 动态生成 inline `onclick` | 使用 `addEventListener()`              |
| 订单状态 class     | 可能由字符串拼接产生            | 使用白名单 `statusMap`                    |
| 代码结构           | 每个页面自行拼 HTML          | 公共 `safe-dom.js` 统一安全渲染              |

---

## 7. 修复后的验证方式

### 7.1 Products 页面

输入：

```html
<img src=x onerror=alert('XSS')>
```

预期结果：

* 不弹窗；
* 表格中原样显示 payload 文本；
* DevTools Elements 中不应出现真实 `<img>` 节点；
* Add/Edit/Delete 功能仍然正常。

### 7.2 Orders 页面

Order ID 输入：

```text
1006');alert('XSS');//
```

预期结果：

* 不执行 JavaScript；
* Order ID 作为普通文本显示；
* Edit/Delete 按钮仍可使用。

### 7.3 Finances 页面

Notes 输入：

```html
<img src=x onerror=alert('XSS')>
```

预期结果：

* 不弹窗；
* Notes 作为普通文本显示；
* Edit/Delete 功能正常。

---

## 8. 与课程内容的对应关系

本次修复符合 coursework 中 Research-Led Software Enhancement 的要求：先通过源码审计和手动测试识别具体 deficiency，再依据安全资料选择修复策略，最后通过代码修改和截图证明修复效果。

本修复也符合 D–L–I 框架：

* Detection：通过源码检查和恶意输入测试发现用户输入进入 `innerHTML`。
* Literature：参考 OWASP XSS Prevention / DOM-based XSS Prevention 中关于 safe sink 的建议。
* Implementation：将 `innerHTML` 动态渲染替换为 `textContent` 和 DOM API，并移除动态 inline event handler。

---

## 9. 可用于 report 的 Implementation Rationale 草稿

The original implementation rendered product, order, and transaction records with `innerHTML`. Since several values were entered by users and persisted in localStorage, malicious strings could be interpreted as HTML rather than displayed as text. Following safe-sink guidance from XSS prevention literature, the implementation was changed to construct table rows using DOM APIs. User-controlled values are now inserted with `textContent`, and edit/delete actions are bound using `addEventListener()` instead of inline `onclick` strings. This directly reduces DOM-based XSS risk while preserving the original CRUD functionality.

---

## 10. 建议 commit message

```bash
git commit -m "fix: prevent unsafe DOM rendering in CRUD tables"
```

```

---

# 十二、你可以交给组员的简短说明

你可以直接把下面这段发给 report 同学：

:::writing{variant="chat_message" id="45310"}
我已经完成 Deficiency 1：Unsafe DOM Rendering / XSS Risk 的代码修复。原始代码在 products.js、orders.js、finances.js 中使用 innerHTML 渲染用户输入数据，例如 product description、order ID、transaction notes 等，这会让恶意 HTML payload 被浏览器解析，存在 DOM-based XSS 风险。

修复方式是新增 safe-dom.js，把表格渲染改成 createElement + textContent，并把动态 inline onclick 改成 addEventListener。这样用户输入只会作为普通文本显示，不再进入 HTML/JavaScript 执行上下文。Products、Orders、Finances 三个页面的 add/edit/delete/search/sort 功能已经保留。

建议 report 中使用 Detection–Literature–Implementation 结构写：Detection 写手动输入 XSS payload 和源码检查；Literature 引用 OWASP XSS Prevention / DOM-based XSS Prevention；Implementation 写 innerHTML → textContent、inline onclick → addEventListener 的 before/after 差异。
:::

下一步你运行测试后，把是否出现报错、截图情况告诉我，我可以继续帮你检查这次 Deficiency 1 的修改是否完整。
::contentReference[oaicite:4]{index=4}
```

[1]: https://owasp.org/www-community/attacks/xss/?utm_source=chatgpt.com "Cross Site Scripting (XSS) | OWASP Foundation"
[2]: https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html?utm_source=chatgpt.com "DOM based XSS Prevention - OWASP Cheat Sheet Series"
