import { resolveHawkerCenterImage, resolveStallImage, setImageBackground, setImageSrc } from "./image-paths.js";

const DATA = {
  "069184": {
    name: "Maxwell Food Centre",
    description: "A popular Singapore hawker centre with local favourites and heritage stalls.",
    stalls: [
      ["01-01", "Ben's Chicken Rice", "Chinese|Hainanese|Singaporean"],
      ["01-02", "Zhen Zhen Porridge", "Chinese|Porridge|Singaporean"],
      ["01-03", "Maxwell Fuzhou Oyster Cake", "Chinese|Fuzhou|Snacks"],
      ["01-04", "Taste Fusion Hainanese Chicken Chop", "Hainanese|Singaporean|Western"],
    ],
  },
  "390051": {
    name: "Old Airport Road Food Centre",
    description: "A long-standing favourite known for noodles, local snacks and classic comfort food.",
    stalls: [
      ["02-01", "Nam Sing Hokkien Mee", "Chinese|Noodles|Singaporean"],
      ["02-02", "Xin Mei Xiang Lor Mee", "Chinese|Noodles"],
      ["02-03", "Super Shiok Nasi Lemak", "Malay|Rice|Singaporean"],
      ["02-04", "Wang Wang Crispy Curry Puff", "Snacks|Singaporean"],
    ],
  },
  "168898": {
    name: "Tiong Bahru Market",
    description: "A neighbourhood market serving beloved breakfast dishes and hawker classics.",
    stalls: [
      ["03-01", "Jian Bo Shui Kueh", "Chinese|Breakfast|Snacks"],
      ["03-02", "Lor Mee 178", "Chinese|Noodles"],
      ["03-03", "Tiong Bahru Fried Kway Teow", "Chinese|Noodles|Singaporean"],
      ["03-04", "Western Stall", "Western|Grill"],
    ],
  },
  "050335": {
    name: "Chinatown Complex Market",
    description: "A large food centre showcasing traditional recipes from across Singapore.",
    stalls: [
      ["04-01", "Chang Ji Gourmet", "Chinese|Rice|Noodles"],
      ["04-02", "Lian He Ben Ji Claypot", "Chinese|Claypot|Rice"],
      ["04-03", "Shin Okaya", "Japanese|Grill"],
      ["04-04", "Woo Ji Cooked Food", "Chinese|Singaporean"],
    ],
  },
};

const params = new URLSearchParams(window.location.search);
const centerId = params.get("centerId") || "069184";
const center = DATA[centerId] || DATA["069184"];
let selectedCuisine = "all";
let cards = [];

function applyFilters() {
  const search = document.getElementById("search").value.toLowerCase().trim();
  cards.forEach((card) => {
    const cuisineMatch = selectedCuisine === "all" || card.dataset.cuisines.split("|").includes(selectedCuisine);
    card.style.display = cuisineMatch && card.dataset.search.includes(search) ? "" : "none";
  });
}

function createCard(stall) {
  const [id, name, cuisines] = stall;
  const card = document.createElement("div");
  card.className = "item";
  card.dataset.search = `${name} ${cuisines}`.toLowerCase();
  card.dataset.cuisines = cuisines;
  setImageBackground(card, resolveStallImage(centerId, name), "user_pages/hawker.jpg");
  const idText = document.createElement("p");
  idText.className = "highlight";
  idText.textContent = `#${id}`;
  const nameText = document.createElement("p");
  nameText.textContent = name;
  const tags = document.createElement("div");
  tags.className = "merchant-cuisine-tags";
  cuisines.split("|").forEach((cuisine) => {
    const tag = document.createElement("span");
    tag.className = "merchant-cuisine-tag";
    tag.textContent = cuisine;
    tags.appendChild(tag);
  });
  card.append(idText, nameText, tags);
  card.addEventListener("click", () => {
    window.location.href = `order.html?centerId=${centerId}&stallId=${id}`;
  });
  return card;
}

function initialiseFoodStallsPreview() {
  document.querySelector("#hawker-center-description h2").textContent = center.name;
  document.querySelector("#hawker-center-description p").textContent = center.description;
  setImageSrc(document.querySelector("#hawker-center-info img"), resolveHawkerCenterImage(centerId, center.name), "user_pages/hawker.jpg");

  const cuisines = [...new Set(center.stalls.flatMap((stall) => stall[2].split("|")))].sort();
  const filters = document.getElementById("cuisine-filters");
  ["all", ...cuisines].forEach((cuisine) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `cuisine-filter-button${cuisine === "all" ? " active" : ""}`;
    button.textContent = cuisine === "all" ? "All cuisines" : cuisine;
    button.addEventListener("click", () => {
      selectedCuisine = cuisine;
      filters.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
      applyFilters();
    });
    filters.appendChild(button);
  });
  document.getElementById("cuisine-filter-message").textContent = "Presentation data from the current sample dataset.";
  const container = document.querySelector(".container");
  cards = center.stalls.map(createCard);
  cards.forEach((card) => container.appendChild(card));
  document.getElementById("search").addEventListener("input", applyFilters);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiseFoodStallsPreview);
} else {
  initialiseFoodStallsPreview();
}
