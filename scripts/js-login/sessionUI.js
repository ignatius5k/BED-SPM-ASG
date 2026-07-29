import { isLoggedIn, isGuest, logoutUser } from "./api.js";

/**
 * Adds a banner at the top of the page showing whether the visitor is
 * signed in or browsing as a guest, so the state is always visible.
 */
export function renderSessionBanner() {
  document.getElementById("sessionBanner")?.remove();

  const banner = document.createElement("div");
  banner.id = "sessionBanner";

  if (isGuest()) {
    banner.className = "session-banner guest";
    banner.innerHTML = `
      <span>You are browsing as a <strong>Guest</strong>.
      Your order history is saved to this browser only.</span>
      <a href="hawkers-app-ignatius/login.html">Sign in</a>
    `;
  } else if (isLoggedIn()) {
    const name = localStorage.getItem("username") || "there";
    banner.className = "session-banner user";
    banner.innerHTML = `
      <span>Signed in as <strong>${name}</strong></span>
      <button id="bannerLogout" type="button">Log out</button>
    `;
  } else {
    return; // neither signed in nor a guest, show nothing
  }

  document.body.prepend(banner);

  document.getElementById("bannerLogout")?.addEventListener("click", () => {
    logoutUser();
    window.location.href = "hawkers-app-ignatius/login.html";
  });
}

renderSessionBanner();