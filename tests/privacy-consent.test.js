import { describe, expect, it, vi } from "vitest";

async function loadPrivacyConsent() {
  vi.resetModules();
  await import("../privacy-consent.js");
  return window.BizTrackPrivacyConsent;
}

describe("BizTrackPrivacyConsent", () => {
  it("shows a cookie banner when no decision has been saved", async () => {
    await loadPrivacyConsent();

    expect(document.querySelector(".cookie-banner")).not.toBeNull();
    expect(document.querySelector(".cookie-banner").textContent).toContain(
      "Cookie preferences"
    );
    expect(document.querySelector(".cookie-banner a").getAttribute("href")).toBe(
      "./privacy.html"
    );
  });

  it("stores accepted consent and removes the banner", async () => {
    await loadPrivacyConsent();

    document.querySelector(".cookie-accept-button").click();

    const savedDecision = JSON.parse(localStorage.getItem("bizTrackCookieConsent"));
    expect(savedDecision.decision).toBe("accepted");
    expect(document.querySelector(".cookie-banner")).toBeNull();
  });

  it("does not render a banner when a decision already exists", async () => {
    localStorage.setItem(
      "bizTrackCookieConsent",
      JSON.stringify({ decision: "declined", savedAt: "2026-05-07T00:00:00.000Z" })
    );

    const privacyConsent = await loadPrivacyConsent();

    expect(privacyConsent.getConsentDecision().decision).toBe("declined");
    expect(document.querySelector(".cookie-banner")).toBeNull();
  });

  it("handles invalid stored consent data defensively", async () => {
    localStorage.setItem("bizTrackCookieConsent", "{not-json");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const privacyConsent = await loadPrivacyConsent();

    expect(privacyConsent.getConsentDecision()).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });
});
