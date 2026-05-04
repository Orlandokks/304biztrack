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