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