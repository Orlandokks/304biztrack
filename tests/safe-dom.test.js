import { describe, expect, it, vi } from "vitest";

async function loadSafeDOM() {
  vi.resetModules();
  await import("../safe-dom.js");
  return window.BizTrackSafeDOM;
}

describe("BizTrackSafeDOM", () => {
  it("clears elements without using HTML parsing", async () => {
    const safeDOM = await loadSafeDOM();
    document.body.innerHTML = "<div id='target'><span>One</span><span>Two</span></div>";

    safeDOM.clearElement(document.getElementById("target"));

    expect(document.getElementById("target").children).toHaveLength(0);
  });

  it("normalizes display text and formats currency defensively", async () => {
    const safeDOM = await loadSafeDOM();

    expect(safeDOM.toDisplayText(null)).toBe("");
    expect(safeDOM.toDisplayText(undefined)).toBe("");
    expect(safeDOM.toDisplayText(42)).toBe("42");
    expect(safeDOM.formatCurrency("12.5")).toBe("$12.50");
    expect(safeDOM.formatCurrency("not-a-number")).toBe("$0.00");
  });

  it("renders table cells as text rather than executable markup", async () => {
    const safeDOM = await loadSafeDOM();
    const row = document.createElement("tr");

    safeDOM.appendTextCell(row, "<img src=x onerror=alert(1)>", "danger");

    expect(row.querySelector("td").className).toBe("danger");
    expect(row.querySelector("td").textContent).toBe("<img src=x onerror=alert(1)>");
    expect(row.querySelector("img")).toBeNull();
  });

  it("creates labeled icon buttons with event listeners", async () => {
    const safeDOM = await loadSafeDOM();
    const onClick = vi.fn();

    const button = safeDOM.createIconButton({
      label: "Delete product PD001",
      iconClassName: "fas fa-trash-alt",
      title: "Delete",
      onClick,
    });

    button.click();

    expect(button.type).toBe("button");
    expect(button.getAttribute("aria-label")).toBe("Delete product PD001");
    expect(button.title).toBe("Delete");
    expect(button.querySelector("i").getAttribute("aria-hidden")).toBe("true");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("appends action cells, status cells, and summary spans", async () => {
    const safeDOM = await loadSafeDOM();
    const row = document.createElement("tr");
    const button = document.createElement("button");
    const summary = document.createElement("div");
    summary.innerHTML = "<strong>old</strong>";

    safeDOM.appendActionCell(row, [button]);
    safeDOM.appendStatusCell(row, "Pending", "pending");
    safeDOM.setSingleTextSpan(summary, "Total Revenue: $10.00");

    expect(row.querySelector(".action button")).toBe(button);
    expect(row.querySelector(".status.pending span").textContent).toBe("Pending");
    expect(summary.children).toHaveLength(1);
    expect(summary.textContent).toBe("Total Revenue: $10.00");
  });
});
