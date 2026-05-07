/**
 * privacy-consent.js
 *
 * Cookie/privacy banner for BizTrack. The application stores data in
 * localStorage rather than browser cookies, but the coursework baseline asks
 * for explicit privacy consent evidence. This banner provides that visible
 * consent flow and links to the dedicated privacy page.
 */

(function exposePrivacyConsentUtilities(global) {
  "use strict";

  const CONSENT_STORAGE_KEY = "bizTrackCookieConsent";

  function getConsentDecision() {
    try {
      const storedDecision = global.localStorage.getItem(CONSENT_STORAGE_KEY);
      return storedDecision ? JSON.parse(storedDecision) : null;
    } catch (error) {
      console.warn("Cookie consent data could not be parsed.", error);
      return null;
    }
  }

  function saveConsentDecision(decision) {
    global.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        decision,
        savedAt: new Date().toISOString(),
      })
    );
  }

  function removeBanner() {
    const banner = document.querySelector(".cookie-banner");

    if (banner) {
      banner.remove();
    }
  }

  function handleConsent(decision) {
    saveConsentDecision(decision);
    removeBanner();
  }

  function createCookieBanner() {
    if (document.querySelector(".cookie-banner") || getConsentDecision()) {
      return null;
    }

    const banner = document.createElement("section");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.setAttribute("aria-live", "polite");

    const content = document.createElement("div");
    content.className = "cookie-banner-content";

    const title = document.createElement("h2");
    title.textContent = "Cookie preferences";

    const message = document.createElement("p");
    message.textContent =
      "BizTrack uses localStorage to remember app data, language preference, and cookie consent.";

    const privacyLink = document.createElement("a");
    privacyLink.href = "./privacy.html";
    privacyLink.textContent = "Review the Privacy Policy.";

    const actions = document.createElement("div");
    actions.className = "cookie-banner-actions";

    const acceptButton = document.createElement("button");
    acceptButton.type = "button";
    acceptButton.className = "cookie-accept-button";
    acceptButton.textContent = "Accept";
    acceptButton.addEventListener("click", () => handleConsent("accepted"));

    const declineButton = document.createElement("button");
    declineButton.type = "button";
    declineButton.className = "cookie-decline-button";
    declineButton.textContent = "Decline";
    declineButton.addEventListener("click", () => handleConsent("declined"));

    actions.append(acceptButton, declineButton);
    content.append(title, message, privacyLink);
    banner.append(content, actions);

    document.body.appendChild(banner);

    return banner;
  }

  function initializePrivacyConsent() {
    createCookieBanner();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePrivacyConsent);
  } else {
    initializePrivacyConsent();
  }

  global.BizTrackPrivacyConsent = {
    CONSENT_STORAGE_KEY,
    createCookieBanner,
    getConsentDecision,
    handleConsent,
    saveConsentDecision,
  };
})(window);
