好的，我们现在处理 **Deficiency 4：CSV export robustness and injection problem**。这个 deficiency 非常适合写入 coursework，因为它不是 baseline requirement，而是 BizTrack 原始代码中的真实功能缺陷：**CSV 导出在空数据时会崩溃；字段中包含逗号、双引号、换行时会破坏 CSV 结构；用户输入以 `=`, `+`, `-`, `@` 等字符开头时还可能产生 CSV / Formula Injection 风险。**

这次修改的核心目标是：

> **把 Products、Orders、Finances 三个页面中重复且脆弱的 `generateCSV(data)` 替换成一个统一、安全、可复用的 CSV 导出模块。**

RFC 4180 对 CSV 格式说明中提到，包含逗号、换行或双引号的字段应放入双引号中，字段内部的双引号需要用另一个双引号转义。([RFC Editor][1]) OWASP 也指出，当应用把不可信用户输入嵌入 CSV 文件时，可能产生 CSV Injection / Formula Injection；常见风险字符包括 `=`, `+`, `-`, `@` 等。([OWASP][2])

---

# 一、这个 deficiency 的本质是什么？

你原始代码里，`products.js`、`orders.js`、`finances.js` 都有几乎一样的 CSV 生成函数：

```js
function generateCSV(data) {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(order => Object.values(order).join(','));

  return `${headers}\n${rows.join('\n')}`;
}
```

这个实现看起来简单，但有三个明显问题。

---

## 1.1 空数据会崩溃

如果用户删除所有 products / orders / expenses 后点击导出，`data` 会是空数组：

```js
[]
```

此时：

```js
data[0]
```

是：

```js
undefined
```

所以：

```js
Object.keys(data[0])
```

会直接抛出错误：

```text
Cannot convert undefined or null to object
```

这说明 CSV 导出功能不是 robust 的。

---

## 1.2 字段没有 CSV 转义

当前代码只是简单地：

```js
Object.values(order).join(',')
```

如果字段内容是：

```text
Bottle, Large
```

导出的 CSV 会被拆成两列。

如果字段内容是：

```text
12" Poster
```

双引号没有被转义，CSV 解析可能出错。

如果字段内容含有换行，CSV 会被破坏成多行。

---

## 1.3 可能存在 CSV / Formula Injection 风险

如果用户输入字段以公式触发字符开头，例如：

```text
=SUM(1,1)
+cmd
-10
@HYPERLINK(...)
```

当 CSV 被 Excel、LibreOffice Calc、Google Sheets 等软件打开时，这些内容可能被解释为公式。OWASP 把这类问题称为 CSV Injection，也叫 Formula Injection。([OWASP][2])

BizTrack 是小型业务管理系统，CSV 文件很可能会被用户导入 spreadsheet 软件进行查看或分析，所以这个问题值得作为 security / reliability deficiency 修复。

---

# 二、修改前先保存 before evidence

你现在先做两个 before evidence，后续 report 会非常好写。

## 2.1 空数据崩溃 evidence

以 Products 页面为例：

1. 打开：

```text
http://localhost:5173/products.html
```

2. 删除所有 product rows。
3. 点击 `Download CSV`。
4. 打开 DevTools → Console。
5. 截图错误。

保存为：

```text
evidence/before-empty-products-csv-error.png
```

## 2.2 字段转义问题 evidence

在 Products 页面新增一个 product，让 description 输入：

```text
Bottle, Large "Premium"
```

然后导出 CSV，打开文件观察列是否错乱、引号是否破坏结构。

保存为：

```text
evidence/before-csv-comma-quote-format-error.png
```

## 2.3 Formula injection evidence

在 Product Description 中输入：

```text
=SUM(1,1)
```

导出 CSV 后，用文本编辑器打开，观察它是否原样以 `=` 开头。

保存为：

```text
evidence/before-csv-formula-prefix.png
```

---

# 三、本次要改哪些文件？

这次建议修改：

```text
1. 新增 csv-utils.js
2. 修改 products.html
3. 修改 orders.html
4. 修改 finances.html
5. 修改 products.js
6. 修改 orders.js
7. 修改 finances.js
8. 新增 DEFICIENCY_4_CSV_EXPORT_FIX_README.md
```

如果你已经完成 Deficiency 1 和 2，那么 HTML 里可能已经加载了：

```html
<script src="./safe-dom.js"></script>
<script src="./accessibility.js"></script>
```

这次我们再加：

```html
<script src="./csv-utils.js"></script>
```

---

# 四、第一步：新增 `csv-utils.js`

在项目根目录新建文件：

```text
csv-utils.js
```

然后复制下面完整代码。

```js
/**
 * csv-utils.js
 *
 * Robust and security-aware CSV export utilities for BizTrack.
 *
 * Academic rationale:
 * The original BizTrack implementation generated CSV files by calling
 * Object.keys(data[0]) and Object.values(row).join(","). This approach is
 * fragile because:
 *
 * 1. It crashes when the exported dataset is empty.
 * 2. It does not escape commas, double quotes, or line breaks.
 * 3. It can expose spreadsheet users to CSV / Formula Injection when
 *    user-controlled values begin with characters interpreted as formulas.
 *
 * This file provides a single reusable CSV export module for Products, Orders,
 * and Expenses. Centralizing the logic improves cohesion and reduces the
 * maintenance risk caused by three duplicated generateCSV implementations.
 */

(function exposeCSVUtilities(global) {
  "use strict";

  /**
   * Characters that can cause spreadsheet applications to interpret a cell as
   * a formula rather than as plain text.
   *
   * Security rationale:
   * OWASP identifies CSV Injection / Formula Injection as a risk when
   * untrusted user input is embedded in spreadsheet-compatible files. Values
   * beginning with characters such as "=", "+", "-", or "@" may be interpreted
   * as formulas by spreadsheet applications.
   *
   * Note:
   * This application exports CSV primarily for human viewing in spreadsheet
   * tools. We therefore prefix formula-like cells with a single quote before
   * standard CSV quoting. This makes the value display as text in common
   * spreadsheet tools while preserving readability.
   */
  const FORMULA_INJECTION_PATTERN = /^[=+\-@]/;

  /**
   * Converts nullish values into empty strings and all other values into text.
   *
   * Defensive programming rationale:
   * CSV export should not crash when a field is missing. A missing field is
   * exported as an empty cell instead of throwing a runtime error.
   *
   * @param {*} value - The cell value to normalize.
   * @returns {string} A normalized string value.
   */
  function normalizeCSVValue(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value);
  }

  /**
   * Escapes a single CSV cell according to common CSV rules and reduces
   * spreadsheet formula-injection risk.
   *
   * Format rationale:
   * RFC 4180 describes that fields containing commas, double quotes, or line
   * breaks should be enclosed in double quotes. If a field contains a double
   * quote, the quote should be escaped by placing another double quote before
   * it.
   *
   * Security rationale:
   * If a normalized cell begins with a formula-triggering character, a single
   * quote is prepended before CSV quoting. This reduces the likelihood that
   * spreadsheet software will interpret the cell as a formula.
   *
   * @param {*} value - Raw cell value.
   * @returns {string} Escaped CSV cell text.
   */
  function escapeCSVCell(value) {
    let cell = normalizeCSVValue(value);

    /*
     * Remove leading UTF-8 BOM if present in a user value. The file-level BOM
     * is handled separately by downloadCSV().
     */
    cell = cell.replace(/^\uFEFF/, "");

    /*
     * Security hardening:
     * Prefix values that start with spreadsheet formula characters. This is
     * done before quote escaping so the prefixed value is treated as part of
     * the cell content.
     */
    if (FORMULA_INJECTION_PATTERN.test(cell)) {
      cell = `'${cell}`;
    }

    /*
     * CSV format correctness:
     * Double quotes inside a quoted field are escaped by doubling them.
     */
    const escapedQuotes = cell.replace(/"/g, '""');

    /*
     * Always wrap cells in double quotes.
     *
     * Although RFC 4180 only requires quotes for fields containing commas,
     * quotes, or line breaks, always quoting fields is simpler, consistent,
     * and avoids conditional mistakes.
     */
    return `"${escapedQuotes}"`;
  }

  /**
   * Generates a CSV string from records and explicit column definitions.
   *
   * Robustness rationale:
   * The original generateCSV(data) inferred headers from data[0], causing a
   * crash for empty datasets. This implementation requires explicit headers,
   * so it can export a valid header-only CSV even when there are no records.
   *
   * Maintainability rationale:
   * Each page controls its export schema through a small column definition
   * array. This avoids relying on object property order and makes the exported
   * CSV format intentional and stable.
   *
   * @param {Array<Object>} records - Data records to export.
   * @param {Array<Object>} columns - CSV column definitions.
   * @param {string} columns[].header - Column header text.
   * @param {Function} columns[].value - Function that extracts a cell value.
   * @returns {string} A CSV document string.
   */
  function generateCSV(records, columns) {
    if (!Array.isArray(columns) || columns.length === 0) {
      throw new Error("CSV export requires at least one column definition.");
    }

    const safeRecords = Array.isArray(records) ? records : [];

    const headerRow = columns
      .map((column) => escapeCSVCell(column.header))
      .join(",");

    const dataRows = safeRecords.map((record) =>
      columns
        .map((column) => {
          /*
           * Defensive extraction:
           * A value getter should not crash the whole export. If extraction
           * fails, the affected cell is exported as empty and the problem is
           * logged for debugging.
           */
          try {
            return escapeCSVCell(column.value(record));
          } catch (error) {
            console.warn("CSV cell extraction failed.", {
              column: column.header,
              record,
              error,
            });

            return escapeCSVCell("");
          }
        })
        .join(",")
    );

    return [headerRow, ...dataRows].join("\r\n") + "\r\n";
  }

  /**
   * Downloads CSV content as a file.
   *
   * Robustness rationale:
   * URL.createObjectURL allocates a temporary object URL. The original
   * implementation did not revoke this URL after clicking the download link.
   * Revoking it after use avoids unnecessary memory retention.
   *
   * Encoding rationale:
   * A UTF-8 BOM is prepended to improve compatibility with spreadsheet tools
   * that may otherwise misread non-ASCII characters.
   *
   * @param {string} filename - Name of the downloaded file.
   * @param {string} csvContent - CSV document text.
   */
  function downloadCSV(filename, csvContent) {
    const csvWithBom = `\uFEFF${csvContent}`;
    const blob = new Blob([csvWithBom], {
      type: "text/csv;charset=utf-8",
    });

    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = filename;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(objectUrl);
  }

  /**
   * Generates and downloads a CSV file in one operation.
   *
   * @param {Object} options - Export options.
   * @param {string} options.filename - Download filename.
   * @param {Array<Object>} options.records - Records to export.
   * @param {Array<Object>} options.columns - Column definitions.
   */
  function exportRecordsToCSV({ filename, records, columns }) {
    const csvContent = generateCSV(records, columns);
    downloadCSV(filename, csvContent);
  }

  global.BizTrackCSV = {
    escapeCSVCell,
    generateCSV,
    downloadCSV,
    exportRecordsToCSV,
  };
})(window);
```

---

# 五、第二步：修改 HTML script 加载顺序

你需要在三个 CRUD 页面中加载 `csv-utils.js`。

---

## 5.1 修改 `products.html`

找到底部 script。你现在可能是：

```html
<script src="./safe-dom.js"></script>
<script src="./accessibility.js"></script>
<script src="./products.js"></script>
```

改成：

```html
<script src="./safe-dom.js"></script>
<script src="./accessibility.js"></script>
<script src="./csv-utils.js"></script>
<script src="./products.js"></script>
```

---

## 5.2 修改 `orders.html`

改成：

```html
<script src="./safe-dom.js"></script>
<script src="./accessibility.js"></script>
<script src="./csv-utils.js"></script>
<script src="./orders.js"></script>
```

---

## 5.3 修改 `finances.html`

改成：

```html
<script src="./safe-dom.js"></script>
<script src="./accessibility.js"></script>
<script src="./csv-utils.js"></script>
<script src="./finances.js"></script>
```

`csv-utils.js` 必须在页面自己的 JS 之前加载，因为 `products.js`、`orders.js`、`finances.js` 会调用 `BizTrackCSV`。

---

# 六、第三步：修改 `products.js`

你需要修改两个地方：

```text
1. 替换 exportToCSV()
2. 删除旧的 generateCSV(data)
```

---

## 6.1 替换 `exportToCSV()`

找到原来的：

```js
function exportToCSV() {
  const productsToExport = products.map(product => {
      return {
        prodID: product.prodID,
        prodName: product.prodName,
        prodDesc: product.prodDesc,
        prodCategory: product.prodCat,
        prodPrice: product.prodPrice.toFixed(2),
        QtySold: product.prodSold,
      };
  });

  const csvContent = generateCSV(productsToExport);

  const blob = new Blob([csvContent], { type: 'text/csv' });

  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = 'biztrack_product_table.csv';

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
}
```

替换成：

```js
function exportToCSV() {
  /*
   * CSV ROBUSTNESS FIX:
   * The original export built a temporary array and passed it to a local
   * generateCSV(data) function that inferred headers from data[0]. That caused
   * an exception when there were no products to export.
   *
   * The revised implementation defines the export schema explicitly. This
   * allows a valid header-only CSV to be exported even when the product list is
   * empty, and it avoids relying on object property order.
   */
  const productColumns = [
    {
      header: "Product ID",
      value: (product) => product.prodID,
    },
    {
      header: "Product Name",
      value: (product) => product.prodName,
    },
    {
      header: "Description",
      value: (product) => product.prodDesc,
    },
    {
      header: "Category",
      value: (product) => product.prodCat,
    },
    {
      header: "Price",
      value: (product) => Number(product.prodPrice || 0).toFixed(2),
    },
    {
      header: "Units Sold",
      value: (product) => product.prodSold,
    },
  ];

  /*
   * SECURITY FIX:
   * BizTrackCSV.exportRecordsToCSV() applies CSV quoting and formula-injection
   * hardening to every cell. This is important because product fields such as
   * Product ID and Description are user-controlled.
   */
  BizTrackCSV.exportRecordsToCSV({
    filename: "biztrack_product_table.csv",
    records: products,
    columns: productColumns,
  });
}
```

---

## 6.2 删除旧的 `generateCSV(data)`

把 `products.js` 底部这个函数完整删除：

```js
function generateCSV(data) {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(order => Object.values(order).join(','));

  return `${headers}\n${rows.join('\n')}`;
}
```

删除后，`products.js` 末尾应该仍然保留：

```js
init();
```

---

# 七、第四步：修改 `orders.js`

同样修改两个地方：

```text
1. 替换 exportToCSV()
2. 删除旧的 generateCSV(data)
```

---

## 7.1 替换 `exportToCSV()`

找到原来的：

```js
function exportToCSV() {
    const ordersToExport = orders.map(order => {
        return {
            orderID: order.orderID,
            orderDate: order.orderDate,
            itemName: order.itemName,
            itemPrice: order.itemPrice.toFixed(2),
            qtyBought: order.qtyBought,
            shipping: order.shipping.toFixed(2),
            taxes: order.taxes.toFixed(2),
            orderTotal: order.orderTotal.toFixed(2),
            orderStatus: order.orderStatus,
        };
    });
  
    const csvContent = generateCSV(ordersToExport);
  
    const blob = new Blob([csvContent], { type: 'text/csv' });
  
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'biztrack_order_table.csv';
  
    document.body.appendChild(link);
    link.click();
  
    document.body.removeChild(link);
}
```

替换成：

```js
function exportToCSV() {
  /*
   * CSV ROBUSTNESS FIX:
   * The export schema is now explicit. This prevents crashes when the orders
   * array is empty and keeps the exported column order stable over time.
   */
  const orderColumns = [
    {
      header: "Order ID",
      value: (order) => order.orderID,
    },
    {
      header: "Order Date",
      value: (order) => order.orderDate,
    },
    {
      header: "Item Name",
      value: (order) => order.itemName,
    },
    {
      header: "Item Price",
      value: (order) => Number(order.itemPrice || 0).toFixed(2),
    },
    {
      header: "Quantity Bought",
      value: (order) => order.qtyBought,
    },
    {
      header: "Shipping Fee",
      value: (order) => Number(order.shipping || 0).toFixed(2),
    },
    {
      header: "Taxes",
      value: (order) => Number(order.taxes || 0).toFixed(2),
    },
    {
      header: "Order Total",
      value: (order) => Number(order.orderTotal || 0).toFixed(2),
    },
    {
      header: "Order Status",
      value: (order) => order.orderStatus,
    },
  ];

  /*
   * SECURITY FIX:
   * Order ID is a free-text field and therefore user-controlled. The shared
   * CSV utility escapes every cell and prefixes formula-like values so that
   * exported spreadsheet cells are treated as text rather than formulas.
   */
  BizTrackCSV.exportRecordsToCSV({
    filename: "biztrack_order_table.csv",
    records: orders,
    columns: orderColumns,
  });
}
```

---

## 7.2 删除旧的 `generateCSV(data)`

删除 `orders.js` 底部：

```js
function generateCSV(data) {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(order => Object.values(order).join(','));

    return `${headers}\n${rows.join('\n')}`;
}
```

---

# 八、第五步：修改 `finances.js`

同样修改两个地方：

```text
1. 替换 exportToCSV()
2. 删除旧的 generateCSV(data)
```

---

## 8.1 替换 `exportToCSV()`

找到原来的：

```js
function exportToCSV() {
    const transactionsToExport = transactions.map(transaction => {
        return {
            trID: transaction.trID,
            trDate: transaction.trDate,
            trCategory: transaction.trCategory,
            trAmount: transaction.trAmount.toFixed(2),
            trNotes: transaction.trNotes,
        };
    });
  
    const csvContent = generateCSV(transactionsToExport);
  
    const blob = new Blob([csvContent], { type: 'text/csv' });
  
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'biztrack_expense_table.csv';
  
    document.body.appendChild(link);
    link.click();
  
    document.body.removeChild(link);
}
```

替换成：

```js
function exportToCSV() {
  /*
   * CSV ROBUSTNESS FIX:
   * The original expense export inferred headers from data[0], so exporting
   * an empty transaction list caused a runtime error. Explicit column
   * definitions allow the application to export a valid header-only CSV.
   */
  const transactionColumns = [
    {
      header: "Transaction ID",
      value: (transaction) => transaction.trID,
    },
    {
      header: "Date",
      value: (transaction) => transaction.trDate,
    },
    {
      header: "Expense Category",
      value: (transaction) => transaction.trCategory,
    },
    {
      header: "Amount",
      value: (transaction) => Number(transaction.trAmount || 0).toFixed(2),
    },
    {
      header: "Notes",
      value: (transaction) => transaction.trNotes,
    },
  ];

  /*
   * SECURITY FIX:
   * Transaction notes are free-text user input. The shared CSV utility ensures
   * that commas, quotes, line breaks, and formula-like prefixes are handled
   * consistently before the file is downloaded.
   */
  BizTrackCSV.exportRecordsToCSV({
    filename: "biztrack_expense_table.csv",
    records: transactions,
    columns: transactionColumns,
  });
}
```

---

## 8.2 删除旧的 `generateCSV(data)`

删除 `finances.js` 底部：

```js
function generateCSV(data) {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(order => Object.values(order).join(','));

    return `${headers}\n${rows.join('\n')}`;
}
```

---

# 九、第六步：可选但推荐，给导出按钮添加更清晰的 accessible label

这不是 CSV robustness 的核心，但你已经修了 accessibility，顺手增强一下会更一致。

## 9.1 `products.html`

找到：

```html
<button class="download-button" onclick="exportToCSV()">Download CSV</button>
```

改成：

```html
<button
    class="download-button"
    onclick="exportToCSV()"
    aria-label="Download products as a CSV file"
>
    Download CSV
</button>
```

## 9.2 `orders.html`

```html
<button
    class="download-button"
    onclick="exportToCSV()"
    aria-label="Export orders as a CSV file"
>
    Export to CSV
</button>
```

## 9.3 `finances.html`

```html
<button
    class="download-button"
    onclick="exportToCSV()"
    aria-label="Export expenses as a CSV file"
>
    Export to CSV
</button>
```

---

# 十、修改后你应该如何测试？

完成修改后，强制刷新：

```text
Cmd + Shift + R
```

然后按下面测试。

---

## Test 1：空数据导出不崩溃

以 Products 页面为例：

1. 删除所有 products。
2. 点击 `Download CSV`。
3. 预期：浏览器下载 `biztrack_product_table.csv`。
4. 打开文件，应该至少有 header：

```csv
"Product ID","Product Name","Description","Category","Price","Units Sold"
```

Console 不应该报：

```text
Cannot convert undefined or null to object
```

Orders 和 Finances 也要重复测试。

---

## Test 2：逗号、双引号、换行正确转义

在 Products 页面新增一条数据：

```text
Product ID: PD777
Product Description: Bottle, Large "Premium"
```

导出后，文本编辑器中应该类似：

```csv
"PD777","Water bottles","Bottle, Large ""Premium""","Drinkware","10.00","1"
```

这说明：

```text
逗号被包在 quoted field 中；
双引号被转成两个双引号；
列结构不会错乱。
```

---

## Test 3：Formula injection mitigation

在 Product Description 输入：

```text
=SUM(1,1)
```

导出后应该看到：

```csv
"'=SUM(1,1)"
```

注意最前面有单引号。这样 spreadsheet 软件更可能把它当作文本，而不是公式。

再测试：

```text
+SUM(1,1)
-10
@HYPERLINK("http://example.com","click")
```

导出后也应该变成：

```csv
"'+SUM(1,1)"
"'-10"
"'@HYPERLINK(""http://example.com"",""click"")"
```

---

## Test 4：旧功能回归测试

你要确认：

```text
Products: Add / Edit / Delete / Search / Sort / Export 正常。
Orders: Add / Edit / Delete / Search / Sort / Export 正常。
Finances: Add / Edit / Delete / Search / Sort / Export 正常。
Deficiency 1 的 XSS safe DOM 渲染仍然正常。
Deficiency 2 的 keyboard focus 和 sort button 仍然正常。
Deficiency 3 的 unique transaction ID 仍然正常。
```

---

# 十一、修改后 commit

测试通过后执行：

```bash
git add .
git commit -m "fix: make CSV export robust and injection-resistant"
```

---

# 十二、中文版 README：给 report 同学用

新建文件：

```text
DEFICIENCY_4_CSV_EXPORT_FIX_README.md
```

然后复制下面内容。

````markdown
# Deficiency 4 修复说明：CSV Export Robustness and Injection Problem

## 1. 缺陷名称

CSV Export Robustness and Injection Problem

中文说明：原始 BizTrack 的 Products、Orders、Finances 三个页面都使用重复的 `generateCSV(data)` 函数导出 CSV。该实现会在空数据时崩溃，也没有正确处理逗号、双引号、换行等 CSV 特殊字符。此外，当用户输入以 `=`, `+`, `-`, `@` 等字符开头时，导出的 CSV 可能在 spreadsheet 软件中被解释为公式，产生 CSV / Formula Injection 风险。

---

## 2. 缺陷出现的位置

本缺陷主要出现在以下文件：

- `products.js`
  - `exportToCSV()`
  - `generateCSV(data)`
- `orders.js`
  - `exportToCSV()`
  - `generateCSV(data)`
- `finances.js`
  - `exportToCSV()`
  - `generateCSV(data)`

原始代码如下：

```js
function generateCSV(data) {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(order => Object.values(order).join(','));

  return `${headers}\n${rows.join('\n')}`;
}
````

---

## 3. 为什么这是一个 deficiency？

### 3.1 空数据导出会崩溃

如果用户删除所有 records 后点击 Export CSV，`data` 是空数组。此时：

```js
data[0] === undefined
```

因此：

```js
Object.keys(data[0])
```

会抛出 runtime error：

```text
Cannot convert undefined or null to object
```

这说明 CSV export 功能不 robust。

### 3.2 CSV 字段没有正确转义

原始代码只是简单执行：

```js
Object.values(order).join(',')
```

如果字段包含逗号、双引号或换行，导出的 CSV 结构会被破坏。例如：

```text
Bottle, Large "Premium"
```

可能导致列数量错乱或文件解析失败。

### 3.3 CSV / Formula Injection 风险

如果用户输入以公式字符开头，例如：

```text
=SUM(1,1)
+SUM(1,1)
-10
@HYPERLINK(...)
```

当 CSV 文件被 Excel、LibreOffice Calc 或 Google Sheets 打开时，字段可能被解释为公式，而不是普通文本。这属于 CSV Injection / Formula Injection 风险。

---

## 4. Detection：如何检测这个问题？

### 4.1 空数据崩溃测试

1. 打开 `products.html`。
2. 删除所有 products。
3. 点击 `Download CSV`。
4. 修复前，Console 会出现 error。
5. 修复后，应正常下载 header-only CSV。

建议截图：

* `before-empty-products-csv-error.png`
* `after-empty-products-csv-header-only.png`

### 4.2 CSV 格式破坏测试

1. 新增 product。
2. Description 输入：

```text
Bottle, Large "Premium"
```

3. 点击 Download CSV。
4. 修复前，CSV 可能列结构错乱。
5. 修复后，该字段应被正确包裹和转义：

```csv
"Bottle, Large ""Premium"""
```

### 4.3 Formula injection 测试

1. Product Description 输入：

```text
=SUM(1,1)
```

2. 导出 CSV。
3. 修复前，字段以 `=` 开头。
4. 修复后，字段应被转换为：

```csv
"'=SUM(1,1)"
```

---

## 5. Literature / Research Rationale

本修复参考了两个方面的资料：

### 5.1 CSV 格式规范

RFC 4180 说明，包含逗号、双引号或换行的字段应放在双引号中；字段内部的双引号需要通过双写进行转义。例如：

```csv
"12"" Poster"
```

因此，简单使用 `.join(',')` 并不能生成可靠 CSV。

### 5.2 CSV Injection / Formula Injection

OWASP 指出，当应用把不可信用户输入嵌入 CSV 文件时，如果字段以 `=`, `+`, `-`, `@` 等字符开头，spreadsheet 软件可能将其解释为公式。这可能导致用户欺骗、数据外泄或其他安全风险。

因此，本次修复不仅要保证 CSV 格式正确，还要对 formula-like cell 做安全处理。

---

## 6. Implementation / Code Changes

### 6.1 新增 `csv-utils.js`

新增共享工具文件：

```text
csv-utils.js
```

该文件提供：

* `normalizeCSVValue(value)`
* `escapeCSVCell(value)`
* `generateCSV(records, columns)`
* `downloadCSV(filename, csvContent)`
* `exportRecordsToCSV(options)`

这样 Products、Orders、Finances 三个页面不再各自维护重复的 `generateCSV()`。

---

### 6.2 使用 explicit column definitions

修复前，headers 从第一条数据推断：

```js
Object.keys(data[0])
```

修复后，每个页面明确声明导出 columns。

例如 Products：

```js
const productColumns = [
  { header: "Product ID", value: (product) => product.prodID },
  { header: "Product Name", value: (product) => product.prodName },
  { header: "Description", value: (product) => product.prodDesc },
  { header: "Category", value: (product) => product.prodCat },
  { header: "Price", value: (product) => Number(product.prodPrice || 0).toFixed(2) },
  { header: "Units Sold", value: (product) => product.prodSold },
];
```

这样即使 records 是空数组，也可以导出 header-only CSV。

---

### 6.3 CSV cell escaping

新增函数：

```js
function escapeCSVCell(value) {
  let cell = normalizeCSVValue(value);

  if (/^[=+\-@]/.test(cell)) {
    cell = `'${cell}`;
  }

  const escapedQuotes = cell.replace(/"/g, '""');
  return `"${escapedQuotes}"`;
}
```

该函数做了三件事：

1. 将 null / undefined 转为空字符串；
2. 对公式开头字符添加单引号；
3. 将双引号转义为两个双引号；
4. 总是用双引号包裹字段。

---

### 6.4 Download cleanup

修复前使用：

```js
link.href = window.URL.createObjectURL(blob);
```

但没有调用 `URL.revokeObjectURL()`。

修复后：

```js
const objectUrl = window.URL.createObjectURL(blob);
...
window.URL.revokeObjectURL(objectUrl);
```

这样可以释放临时 object URL，减少不必要的内存占用。

---

## 7. Before vs After 总结

| 项目                  | 修改前                    | 修改后                         |
| ------------------- | ---------------------- | --------------------------- |
| Header 生成           | `Object.keys(data[0])` | Explicit column definitions |
| 空数据导出               | Runtime error          | Header-only CSV             |
| 字段包含逗号              | 破坏列结构                  | 双引号包裹                       |
| 字段包含双引号             | 未转义                    | 双引号双写转义                     |
| 字段包含换行              | 破坏行结构                  | 双引号包裹                       |
| Formula-like values | 可能被 spreadsheet 当公式    | 前缀单引号                       |
| 代码复用                | 三个重复 `generateCSV()`   | 统一 `csv-utils.js`           |
| Object URL          | 未释放                    | `revokeObjectURL()`         |

---

## 8. 修复后的验证方式

### 8.1 空数据测试

1. 删除 Products 页面所有 rows。
2. 点击 Download CSV。
3. 应下载只包含 header 的 CSV。
4. Console 不应报错。

### 8.2 特殊字符测试

输入：

```text
Bottle, Large "Premium"
```

导出后应类似：

```csv
"Bottle, Large ""Premium"""
```

### 8.3 Formula injection 测试

输入：

```text
=SUM(1,1)
```

导出后应类似：

```csv
"'=SUM(1,1)"
```

### 8.4 Regression test

确认以下功能仍然正常：

* Products export；
* Orders export；
* Expenses export；
* Add/Edit/Delete；
* Search/Sort；
* 前三个 deficiencies 的修复未被破坏。

---

## 9. 与课程内容的对应关系

本修复符合 coursework 中 Research-Led Software Enhancement 的要求。该作业要求从原始源码中识别具体 deficiencies，并使用 research-informed implementation 进行修复。

本缺陷对应 D–L–I 框架：

* Detection：通过删除所有 rows 后导出 CSV 发现 runtime error；通过包含逗号、双引号和公式前缀的输入发现 CSV 格式和安全问题。
* Literature：参考 RFC 4180 的 CSV quoting rules，以及 OWASP CSV Injection guidance。
* Implementation：新增 `csv-utils.js`，使用 explicit column definitions、cell escaping、formula-prefix hardening 和 object URL cleanup。

本修复也体现了课程中的 high cohesion / low coupling 思想：原本 Products、Orders、Finances 三个文件各自有重复的 `generateCSV()`；修复后 CSV 逻辑集中到一个公共工具模块中，降低维护成本。

---

## 10. 可用于 report 的 Implementation Rationale 草稿

The original BizTrack CSV export implementation inferred headers from `data[0]` and generated rows with `Object.values(row).join(',')`. This caused a runtime error when exporting an empty dataset and produced invalid CSV when fields contained commas, quotes, or line breaks. In addition, user-controlled fields could begin with formula-triggering characters such as `=`, `+`, `-`, or `@`, creating CSV / Formula Injection risk when opened in spreadsheet software. The implementation was replaced with a shared `csv-utils.js` module that uses explicit column definitions, always quotes cells, escapes double quotes, prefixes formula-like cells with a single quote, supports header-only exports, and revokes temporary object URLs after download. This improves reliability, data correctness, and security while reducing duplicated CSV code across the application.

---

## 11. 建议 commit message

```bash
git commit -m "fix: make CSV export robust and injection-resistant"
```

```

---

# 十三、你可以直接发给 report 同学的简短说明

:::writing{variant="chat_message" id="58624"}
我已经完成 Deficiency 4：CSV export robustness and injection problem 的修复。原始 products.js、orders.js、finances.js 都使用重复的 generateCSV(data)，通过 Object.keys(data[0]) 推断 header，并用 Object.values(row).join(',') 拼接字段。这会导致空数据导出时报错，也无法正确处理逗号、双引号、换行；如果用户输入以 =、+、-、@ 开头，还可能在 spreadsheet 软件中被解释为公式，产生 CSV / Formula Injection 风险。

修复后，我新增了 csv-utils.js，统一处理 CSV 导出。新的实现使用 explicit column definitions，因此空数据也能导出 header-only CSV；所有字段都会被双引号包裹，内部双引号会被双写转义；formula-like values 会加单引号前缀；下载后会 revokeObjectURL。Products、Orders、Finances 三个页面都改为调用 BizTrackCSV.exportRecordsToCSV，不再保留重复的 generateCSV 函数。建议 report 中按 D–L–I 写：Detection 写空数据导出 crash、特殊字符破坏 CSV、公式前缀风险；Literature 引用 RFC 4180 和 OWASP CSV Injection；Implementation 写 data[0]/join(',') → explicit columns + escapeCSVCell + shared csv-utils.js。
:::

你现在可以先按 Test 1–4 跑一遍。如果有某个页面点击 Export 没反应、Console 显示 `BizTrackCSV is not defined`，通常是 `csv-utils.js` 加载顺序不对；如果下载内容仍然没转义，通常是页面还在调用旧的 `generateCSV()`。
::contentReference[oaicite:3]{index=3}
```

[1]: https://www.rfc-editor.org/rfc/rfc4180?utm_source=chatgpt.com "RFC 4180: Common Format and MIME Type for Comma-Separated Values (CSV) Files"
[2]: https://owasp.org/www-community/attacks/CSV_Injection?utm_source=chatgpt.com "CSV Injection | OWASP Foundation"
