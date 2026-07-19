import { resolveHawkerCenterImage, setImageBackground } from "./image-paths.js";

const SAMPLE_HAWKER_CENTERS = [
  { id: "069184", name: "Maxwell Food Centre", imagePath: "user_pages/hawker.jpg" },
  { id: "390051", name: "Old Airport Road Food Centre", imagePath: "user_pages/hawker.jpg" },
  { id: "168898", name: "Tiong Bahru Market", imagePath: "user_pages/hawker.jpg" },
  { id: "050335", name: "Chinatown Complex Market", imagePath: "user_pages/hawker.jpg" },
];

function createItem(center) {
  const item = document.createElement("div");
  item.className = "item";
  setImageBackground(
    item,
    resolveHawkerCenterImage(center.id, center.name, center.imagePath),
    "user_pages/hawker.jpg"
  );

  const id = document.createElement("p");
  id.className = "highlight";
  id.textContent = `#${center.id}`;

  const name = document.createElement("p");
  name.textContent = center.name;
  item.append(id, name);
  item.addEventListener("click", () => {
    window.location.href = `food_stalls.html?centerId=${center.id}`;
  });
  return item;
}

function initialiseHawkerCentresPreview() {
  const container = document.querySelector(".container");
  const cards = SAMPLE_HAWKER_CENTERS.map(createItem);
  cards.forEach((card) => container.appendChild(card));

  document.getElementById("search").addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase().trim();
    cards.forEach((card) => {
      card.style.display = card.textContent.toLowerCase().includes(query) ? "" : "none";
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiseHawkerCentresPreview);
} else {
  initialiseHawkerCentresPreview();
}
