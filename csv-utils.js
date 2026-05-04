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