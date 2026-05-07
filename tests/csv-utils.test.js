import { describe, expect, it, vi } from "vitest";

async function loadCSV() {
  vi.resetModules();
  await import("../csv-utils.js");
  return window.BizTrackCSV;
}

describe("BizTrackCSV", () => {
  it("quotes cells and hardens formula-like values", async () => {
    const csv = await loadCSV();

    expect(csv.escapeCSVCell('A "quoted", value')).toBe('"A ""quoted"", value"');
    expect(csv.escapeCSVCell("=SUM(A1:A2)")).toBe('"\'=SUM(A1:A2)"');
    expect(csv.escapeCSVCell(null)).toBe('""');
  });

  it("generates header-only CSV for empty datasets", async () => {
    const csv = await loadCSV();

    const result = csv.generateCSV([], [
      { header: "Product ID", value: (record) => record.prodID },
      { header: "Description", value: (record) => record.prodDesc },
    ]);

    expect(result).toBe('"Product ID","Description"\r\n');
  });

  it("generates robust CSV rows and recovers from cell extraction errors", async () => {
    const csv = await loadCSV();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = csv.generateCSV(
      [{ id: "PD001", desc: "Line 1\nLine 2" }],
      [
        { header: "ID", value: (record) => record.id },
        { header: "Description", value: (record) => record.desc },
        {
          header: "Broken",
          value: () => {
            throw new Error("bad getter");
          },
        },
      ]
    );

    expect(result).toContain('"Line 1\nLine 2"');
    expect(result).toContain('""');
    expect(warnSpy).toHaveBeenCalled();
  });

  it("throws when no columns are provided", async () => {
    const csv = await loadCSV();

    expect(() => csv.generateCSV([], [])).toThrow(
      "CSV export requires at least one column definition."
    );
  });

  it("downloads CSV content and revokes temporary object URLs", async () => {
    const csv = await loadCSV();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const createObjectURL = vi.fn(() => "blob:biztrack-csv");
    const revokeObjectURL = vi.fn();

    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = revokeObjectURL;

    csv.exportRecordsToCSV({
      filename: "products.csv",
      records: [{ id: "PD001" }],
      columns: [{ header: "ID", value: (record) => record.id }],
    });

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:biztrack-csv");
    expect(document.querySelector("a[download='products.csv']")).toBeNull();
  });
});
