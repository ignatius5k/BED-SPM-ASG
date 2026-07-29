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
      <a href="login.html">Sign in</a>
    `;
  } else if (isLoggedIn()) {
    const name = localStorage.getItem("username") || "there";
    banner.className = "session-banner user";
    const label = document.createElement("span");
    label.append("Signed in as ");
    const strong = document.createElement("strong");
    strong.textContent = name;
    label.append(strong);

    const logoutButton = document.createElement("button");
    logoutButton.id = "bannerLogout";
    logoutButton.type = "button";
    logoutButton.textContent = "Log out";

    banner.append(label, logoutButton);
  } else {
    return; // neither signed in nor a guest, show nothing
  }

  document.body.prepend(banner);

  document.getElementById("bannerLogout")?.addEventListener("click", () => {
    logoutUser();
    window.location.href = "login.html";
  });
}

renderSessionBanner();
