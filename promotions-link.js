const API_BASE = "http://localhost:3000";

function createPromotionGroup() {
  const list = document.getElementById("promotions-list");
  const group = document.createElement("section");
  const heading = document.createElement("h3");

  group.className = "group";
  heading.textContent = "Promotions";
  group.appendChild(heading);
  list.replaceChildren(group);

  return group;
}

function showPromotionStatus(group, message, isError) {
  const status = document.createElement("p");
  status.className = isError
    ? "promotion-status promotion-error"
    : "promotion-status";
  status.textContent = message;
  group.appendChild(status);
}

function createPromotionCard(promotion) {
  const card = document.createElement("article");
  const discount = document.createElement("div");
  const title = document.createElement("h4");
  const description = document.createElement("p");
  const stall = document.createElement("p");

  card.className = "promo-card";
  discount.className = "promo-discount-tag";
  title.className = "promo-title";
  description.className = "promo-desc";
  stall.className = "promo-stall";

  discount.textContent = promotion.discount;
  title.textContent = promotion.title;
  description.textContent = promotion.description;
  stall.textContent = promotion.stallName;

  card.appendChild(discount);
  card.appendChild(title);
  card.appendChild(description);
  card.appendChild(stall);

  return card;
}

async function loadPromotions() {
  const group = createPromotionGroup();
  showPromotionStatus(group, "Loading promotions from the database...", false);

  try {
    const response = await fetch(API_BASE + "/promotion");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to retrieve promotions");
    }

    if (!Array.isArray(data)) {
      throw new Error("The promotions response is invalid");
    }

    const status = group.querySelector(".promotion-status");
    if (status) {
      status.remove();
    }

    if (data.length === 0) {
      showPromotionStatus(group, "No promotions currently", false);
      return;
    }

    for (let i = 0; i < data.length; i += 1) {
      group.appendChild(createPromotionCard(data[i]));
    }
  } catch (error) {
    console.error("Could not load SQL promotions:", error);
    const status = group.querySelector(".promotion-status");
    if (status) {
      status.remove();
    }
    showPromotionStatus(
      group,
      "Unable to load promotions from the database. Please try again later.",
      true
    );
  }
}

document.addEventListener("DOMContentLoaded", loadPromotions);
