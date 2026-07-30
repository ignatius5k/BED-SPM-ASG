// Loads promotions from the backend and shows them on the promotions page.

const API_BASE = "http://localhost:3000";

async function loadPromotions() {
  try {
    const res = await fetch(API_BASE + "/promotion");
    const promotions = await res.json();

    const list = document.getElementById("promotions-list");
    list.innerHTML = '<section class="group"><h3>Promotions</h3></section>';

    const group = list.querySelector(".group");

    if (promotions.length === 0) {
      const none = document.createElement("p");
      none.textContent = "No promotions currently";
      group.appendChild(none);
      return;
    }

    for (let i = 0; i < promotions.length; i++) {
      const p = promotions[i];
      const card = document.createElement("div");
      card.className = "promo-card";
      card.innerHTML =
        '<div class="promo-discount-tag">' + p.discount + '</div>' +
        '<h4 class="promo-title">' + p.title + '</h4>' +
        '<p class="promo-desc">' + p.description + '</p>';
      group.appendChild(card);
    }
  } catch (err) {
    console.error("Could not load promotions:", err);
  }
}

loadPromotions();