import { describe, expect, it, vi } from "vitest";

async function loadAccessibility() {
  vi.resetModules();
  await import("../accessibility.js");
  return window.BizTrackAccessibility;
}

describe("BizTrackAccessibility", () => {
  it("opens and closes the sidebar while updating aria-expanded", async () => {
    document.body.innerHTML = `
      <button data-sidebar-toggle aria-expanded="false">Menu</button>
      <div id="sidebar" style="display: none"></div>
    `;

    const accessibility = await loadAccessibility();
    const toggle = document.querySelector("[data-sidebar-toggle]");

    accessibility.openSidebar();
    expect(document.getElementById("sidebar").style.display).toBe("block");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    accessibility.closeSidebar();
    expect(document.getElementById("sidebar").style.display).toBe("none");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);
  });

  it("fails safely when the sidebar is absent", async () => {
    const accessibility = await loadAccessibility();

    expect(() => accessibility.openSidebar()).not.toThrow();
    expect(() => accessibility.closeSidebar()).not.toThrow();
  });

  it("updates sortable table state after a header button is clicked", async () => {
    document.body.innerHTML = `
      <table>
        <thead>
          <tr>
            <th data-sortable="true" aria-sort="none">
              <button class="sort-button" data-sort-column="prodName">Product Name</button>
            </th>
            <th data-sortable="true" aria-sort="none">
              <button class="sort-button" data-sort-column="prodPrice">Price</button>
            </th>
          </tr>
        </thead>
      </table>
    `;
    window.sortTable = vi.fn();

    const accessibility = await loadAccessibility();
    accessibility.initializeSortableTableHeaders();

    document.querySelector("[data-sort-column='prodPrice']").click();

    expect(window.sortTable).toHaveBeenCalledWith("prodPrice");
    expect(document.querySelectorAll("th")[0].getAttribute("aria-sort")).toBe("none");
    expect(document.querySelectorAll("th")[1].getAttribute("aria-sort")).toBe("ascending");
  });

  it("ignores missing active sort buttons", async () => {
    const accessibility = await loadAccessibility();

    expect(() => accessibility.updateSortState(null)).not.toThrow();
  });
});
