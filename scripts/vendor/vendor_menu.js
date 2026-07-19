const MENU_API_URL = "http://localhost:3000/menu-items";

// =========================================================
// MOCK PREVIEW DATA
// Used automatically on Live Server, or when the URL includes ?mock=true.
// Add ?mock=false to test the real login/API flow.
// Normal use requires a vendor JWT and MSSQL.
// =========================================================
const MOCK_CUISINES = [
  "Chinese",
  "Drinks",
  "Hainanese",
  "Indian",
  "Malay",
  "Singaporean",
  "Vegetarian",
  "Western",
];

const MOCK_VENDOR_MENU = {
  stalls: [
    {
      stallId: "STALL001",
      stallName: "Ben's Chicken Rice",
      primaryCuisine: "Chinese",
    },
  ],
  menuItems: [
    {
      menuItemId: "MENU001",
      stallId: "STALL001",
      stallName: "Ben's Chicken Rice",
      itemName: "Steamed Chicken Rice",
      description: "Classic steamed chicken with fragrant rice",
      price: 5.5,
      category: "Main",
      isAvailable: true,
      cuisines: ["Chinese", "Hainanese", "Singaporean"],
    },
    {
      menuItemId: "MENU002",
      stallId: "STALL001",
      stallName: "Ben's Chicken Rice",
      itemName: "Roasted Chicken Rice",
      description: "Roasted chicken served with fragrant rice",
      price: 6,
      category: "Main",
      isAvailable: true,
      cuisines: ["Chinese", "Hainanese", "Singaporean"],
    },
    {
      menuItemId: "MENU004",
      stallId: "STALL001",
      stallName: "Ben's Chicken Rice",
      itemName: "Fried Rice",
      description: "Wok-fried rice with egg",
      price: 5,
      category: "Main",
      isAvailable: true,
      cuisines: ["Chinese", "Singaporean"],
    },
    {
      menuItemId: "MENU003",
      stallId: "STALL001",
      stallName: "Ben's Chicken Rice",
      itemName: "Chicken Soup",
      description: "Clear chicken soup",
      price: 3,
      category: "Side",
      isAvailable: false,
      cuisines: ["Chinese", "Hainanese"],
    },
    {
      menuItemId: "MENU005",
      stallId: "STALL001",
      stallName: "Ben's Chicken Rice",
      itemName: "Lime Juice",
      description: "Fresh lime drink",
      price: 2,
      category: "Drink",
      isAvailable: true,
      cuisines: ["Drinks", "Singaporean"],
    },
  ],
};

let menuItems = [];
let stalls = [];
let cuisines = [];
let mockMode = false;

// =========================================================
// STEP 1: Small display helpers
// =========================================================
function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCurrency(value) {
  return `S$${Number(value || 0).toFixed(2)}`;
}

function showMenuMessage(message, isError = false) {
  const messageElement = document.getElementById("menuMessage");
  messageElement.textContent = message;
  messageElement.classList.toggle("error", isError);
}

function refreshIcons() {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// =========================================================
// STEP 2: Fill the stall banner and filter controls
// =========================================================
function renderStallBanner() {
  const stallName = document.getElementById("vendorStallName");
  const stallDetails = document.getElementById("vendorStallDetails");

  if (stalls.length === 0) {
    stallName.textContent = "No vendor stall found";
    stallDetails.textContent = "Create a stall before adding menu items.";
    document.getElementById("addMenuButton").disabled = true;
    return;
  }

  stallName.textContent =
    stalls.length === 1 ? stalls[0].stallName : `${stalls.length} vendor stalls`;
  stallDetails.textContent =
    stalls.length === 1
      ? `${stalls[0].primaryCuisine || "Hawker"} cuisine · SQL menu management`
      : "Use the stall filter to manage each menu.";
}

function renderFilterOptions() {
  const stallFilter = document.getElementById("stallFilter");
  const cuisineFilter = document.getElementById("cuisineFilter");

  stallFilter.innerHTML = '<option value="all">All stalls</option>';
  cuisineFilter.innerHTML = '<option value="all">All cuisines</option>';

  for (let i = 0; i < stalls.length; i += 1) {
    const option = document.createElement("option");
    option.value = stalls[i].stallId;
    option.textContent = stalls[i].stallName;
    stallFilter.appendChild(option);
  }

  for (let i = 0; i < cuisines.length; i += 1) {
    const option = document.createElement("option");
    option.value = cuisines[i];
    option.textContent = cuisines[i];
    cuisineFilter.appendChild(option);
  }
}

// =========================================================
// STEP 3: Filter and display menu items with cuisine tags
// =========================================================
function getFilteredItems() {
  const searchValue = document
    .getElementById("menuSearch")
    .value.toLowerCase()
    .trim();
  const stallValue = document.getElementById("stallFilter").value;
  const cuisineValue = document.getElementById("cuisineFilter").value;
  const filteredItems = [];

  for (let i = 0; i < menuItems.length; i += 1) {
    const item = menuItems[i];
    const searchText = `${item.itemName} ${item.category} ${item.description}`.toLowerCase();
    const matchesSearch = searchText.includes(searchValue);
    const matchesStall = stallValue === "all" || item.stallId === stallValue;
    const matchesCuisine =
      cuisineValue === "all" || item.cuisines.includes(cuisineValue);

    if (matchesSearch && matchesStall && matchesCuisine) {
      filteredItems.push(item);
    }
  }

  return filteredItems;
}

function createCuisineTags(cuisineNames) {
  let html = "";

  for (let i = 0; i < cuisineNames.length; i += 1) {
    html += `<span class="cuisine-tag">${escapeHtml(cuisineNames[i])}</span>`;
  }

  return html;
}

function createMenuCard(item) {
  const card = document.createElement("article");
  card.className = "menu-item-card";
  card.innerHTML = `
    <div class="item-card-top">
      <div class="item-symbol" aria-hidden="true">
        <img src="./icons/home/main-dish.svg" alt="">
      </div>
      <span class="badge ${item.isAvailable ? "badge-available" : "badge-unavailable"}">
        ${item.isAvailable ? "Available" : "Unavailable"}
      </span>
    </div>
    <div>
      <h4 class="item-title">${escapeHtml(item.itemName)}</h4>
      <p class="item-description">${escapeHtml(
        item.description || "No description"
      )}</p>
    </div>
    <div class="cuisine-tags" aria-label="Cuisine categories">
      ${createCuisineTags(item.cuisines)}
    </div>
    <div class="item-card-bottom">
      <span class="item-category">${escapeHtml(item.category)}</span>
      <span class="item-price">${formatCurrency(item.price)}</span>
    </div>
    <div class="item-actions">
      <button class="btn btn-outline btn-edit" type="button" data-id="${escapeHtml(
        item.menuItemId
      )}">
        Edit
      </button>
      <button class="btn btn-delete" type="button" data-id="${escapeHtml(
        item.menuItemId
      )}">
        Remove
      </button>
    </div>
  `;
  return card;
}

function renderMenuCategories() {
  const container = document.getElementById("menu-categories");
  const filteredItems = getFilteredItems();
  const categories = [];
  container.innerHTML = "";

  for (let i = 0; i < filteredItems.length; i += 1) {
    if (!categories.includes(filteredItems[i].category)) {
      categories.push(filteredItems[i].category);
    }
  }

  if (filteredItems.length === 0) {
    container.innerHTML = `
      <div class="menu-empty">
        <strong>No menu items match these filters.</strong>
        <p>Try another cuisine, stall, or search term.</p>
      </div>
    `;
    renderStats(filteredItems);
    return;
  }

  for (let i = 0; i < categories.length; i += 1) {
    const category = categories[i];
    const section = document.createElement("section");
    const categoryItems = filteredItems.filter(
      (item) => item.category === category
    );
    section.className = "category-section";
    section.innerHTML = `
      <div class="category-header">
        <h3 class="category-title">${escapeHtml(category)}</h3>
        <span class="badge badge-count">${categoryItems.length} item${
          categoryItems.length === 1 ? "" : "s"
        }</span>
      </div>
      <div class="menu-grid"></div>
    `;

    const grid = section.querySelector(".menu-grid");
    for (let j = 0; j < categoryItems.length; j += 1) {
      grid.appendChild(createMenuCard(categoryItems[j]));
    }

    container.appendChild(section);
  }

  renderStats(filteredItems);
  refreshIcons();
}

function renderStats(items) {
  const statsGrid = document.getElementById("stats-grid");
  let availableCount = 0;
  let totalPrice = 0;
  const usedCuisines = [];

  for (let i = 0; i < items.length; i += 1) {
    if (items[i].isAvailable) {
      availableCount += 1;
    }

    totalPrice += Number(items[i].price || 0);

    for (let j = 0; j < items[i].cuisines.length; j += 1) {
      if (!usedCuisines.includes(items[i].cuisines[j])) {
        usedCuisines.push(items[i].cuisines[j]);
      }
    }
  }

  const averagePrice = items.length === 0 ? 0 : totalPrice / items.length;
  const stats = [
    { label: "Visible items", value: items.length },
    { label: "Cuisine tags", value: usedCuisines.length },
    { label: "Available", value: availableCount },
    { label: "Average price", value: formatCurrency(averagePrice) },
  ];
  statsGrid.innerHTML = "";

  for (let i = 0; i < stats.length; i += 1) {
    const card = document.createElement("div");
    card.className = "card stats-card";
    card.innerHTML = `
      <span class="stat-marker" aria-hidden="true"></span>
      <p class="stat-label">${stats[i].label}</p>
      <p class="stat-value">${stats[i].value}</p>
    `;
    statsGrid.appendChild(card);
  }
}

// =========================================================
// STEP 4: Add and edit form
// =========================================================
function createCuisineOptions(selectedCuisines) {
  let html = "";

  for (let i = 0; i < cuisines.length; i += 1) {
    const cuisine = cuisines[i];
    const checked = selectedCuisines.includes(cuisine) ? "checked" : "";
    html += `
      <label class="cuisine-option">
        <input type="checkbox" name="cuisines" value="${escapeHtml(
          cuisine
        )}" ${checked}>
        ${escapeHtml(cuisine)}
      </label>
    `;
  }

  return html;
}

function createStallOptions(selectedStallId) {
  let html = "";

  for (let i = 0; i < stalls.length; i += 1) {
    const selected = stalls[i].stallId === selectedStallId ? "selected" : "";
    html += `<option value="${escapeHtml(stalls[i].stallId)}" ${selected}>${escapeHtml(
      stalls[i].stallName
    )}</option>`;
  }

  return html;
}

function openMenuForm(item = null) {
  const editing = item !== null;
  const selectedStallId = editing ? item.stallId : stalls[0].stallId;
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "menuItemModal";
  modal.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="menuFormTitle">
      <h3 id="menuFormTitle">${editing ? "Edit menu item" : "Add menu item"}</h3>
      <p class="modal-intro">Add one to five cuisines so customers can find this food.</p>
      <form id="menuItemForm">
        <div class="form-group">
          <label for="formStall">Stall</label>
          <select id="formStall" ${editing ? "disabled" : ""} required>
            ${createStallOptions(selectedStallId)}
          </select>
        </div>
        <div class="form-group">
          <label for="formItemName">Item name</label>
          <input id="formItemName" type="text" minlength="2" maxlength="100" value="${escapeHtml(
            editing ? item.itemName : ""
          )}" required>
        </div>
        <div class="form-group">
          <label for="formDescription">Description</label>
          <textarea id="formDescription" maxlength="500" required>${escapeHtml(
            editing ? item.description : ""
          )}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="formPrice">Price (SGD)</label>
            <input id="formPrice" type="number" min="0.50" max="9999.99" step="0.01" value="${
              editing ? Number(item.price).toFixed(2) : ""
            }" required>
          </div>
          <div class="form-group">
            <label for="formCategory">Menu category</label>
            <input id="formCategory" type="text" minlength="2" maxlength="50" value="${escapeHtml(
              editing ? item.category : ""
            )}" placeholder="Main, Side, Drink" required>
          </div>
        </div>
        <div class="form-group">
          <span>Cuisine categories</span>
          <div class="cuisine-options">
            ${createCuisineOptions(editing ? item.cuisines : [])}
          </div>
        </div>
        <div class="form-group">
          <label class="availability-option">
            <input id="formAvailable" type="checkbox" ${
              !editing || item.isAvailable ? "checked" : ""
            }>
            Available for customers
          </label>
        </div>
        <p id="formError" class="form-error" role="alert"></p>
        <div class="modal-buttons">
          <button class="btn btn-outline" type="button" data-close-modal>Cancel</button>
          <button class="btn btn-primary" type="submit">${
            editing ? "Save changes" : "Add item"
          }</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById("formItemName").focus();

  document.getElementById("menuItemForm").addEventListener("submit", (event) => {
    saveMenuItem(event, item);
  });
}

function getFormPayload(existingItem) {
  const selectedCuisines = Array.from(
    document.querySelectorAll('input[name="cuisines"]:checked')
  ).map((checkbox) => checkbox.value);

  const payload = {
    itemName: document.getElementById("formItemName").value.trim(),
    description: document.getElementById("formDescription").value.trim(),
    price: Number(document.getElementById("formPrice").value),
    category: document.getElementById("formCategory").value.trim(),
    cuisines: selectedCuisines,
    isAvailable: document.getElementById("formAvailable").checked,
  };

  if (!existingItem) {
    payload.stallId = document.getElementById("formStall").value;
  }

  return payload;
}

function validateFormPayload(payload) {
  if (payload.itemName.length < 2 || payload.category.length < 2) {
    return "Enter an item name and menu category of at least two characters.";
  }

  if (payload.description.length === 0) {
    return "Enter a short food description.";
  }

  if (!Number.isFinite(payload.price) || payload.price < 0.5) {
    return "Price must be at least S$0.50.";
  }

  if (payload.cuisines.length < 1 || payload.cuisines.length > 5) {
    return "Select between one and five cuisine categories.";
  }

  return "";
}

async function saveMenuItem(event, existingItem) {
  event.preventDefault();
  const payload = getFormPayload(existingItem);
  const validationMessage = validateFormPayload(payload);
  const formError = document.getElementById("formError");

  if (validationMessage) {
    formError.textContent = validationMessage;
    return;
  }

  if (mockMode) {
    if (existingItem) {
      Object.assign(existingItem, payload);
    } else {
      menuItems.push({
        menuItemId: `MOCK${Date.now()}`,
        stallName: stalls.find((stall) => stall.stallId === payload.stallId)
          .stallName,
        ...payload,
      });
    }

    closeModal();
    renderMenuCategories();
    showMenuMessage("Mock menu updated. Live mode writes these changes to MSSQL.");
    return;
  }

  const token = localStorage.getItem("token");
  const editing = existingItem !== null;
  const url = editing
    ? `${MENU_API_URL}/${existingItem.menuItemId}`
    : MENU_API_URL;

  try {
    const response = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors ? data.errors.join(" ") : data.message);
    }

    closeModal();
    await loadVendorMenu();
    showMenuMessage(data.message);
  } catch (error) {
    console.error("Save menu item error:", error);
    formError.textContent = error.message || "Unable to save this menu item.";
  }
}

// =========================================================
// STEP 5: Remove an item without deleting its order history
// =========================================================
async function removeMenuItem(menuItemId) {
  const item = menuItems.find(
    (menuItem) => menuItem.menuItemId === menuItemId
  );

  if (!item || !confirm(`Remove ${item.itemName} from the active menu?`)) {
    return;
  }

  if (mockMode) {
    menuItems = menuItems.filter(
      (menuItem) => menuItem.menuItemId !== menuItemId
    );
    renderMenuCategories();
    showMenuMessage("Mock item removed. Historical orders remain unchanged.");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${MENU_API_URL}/${menuItemId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to remove menu item");
    }

    await loadVendorMenu();
    showMenuMessage(data.message);
  } catch (error) {
    console.error("Remove menu item error:", error);
    showMenuMessage(error.message, true);
  }
}

// =========================================================
// STEP 6: Load vendor data from the Express and MSSQL backend
// =========================================================
async function loadVendorMenu() {
  const query = new URLSearchParams(window.location.search);
  const mockPreference = query.get("mock");
  const isLiveServerPreview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  mockMode = mockPreference === "true" || (mockPreference !== "false" && isLiveServerPreview);

  if (mockMode) {
    stalls = MOCK_VENDOR_MENU.stalls.map((stall) => ({ ...stall }));
    menuItems = MOCK_VENDOR_MENU.menuItems.map((item) => ({
      ...item,
      cuisines: [...item.cuisines],
    }));
    cuisines = [...MOCK_CUISINES];
    renderStallBanner();
    renderFilterOptions();
    renderMenuCategories();
    showMenuMessage("Mock preview data. Connect MSSQL for live menu management.");

    if (query.get("openForm") === "edit" && menuItems.length > 0) {
      openMenuForm(menuItems[0]);
    } else if (query.get("openForm") === "true") {
      openMenuForm();
    }

    return;
  }

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "vendor") {
    showMenuMessage("Please log in with a vendor account to manage a menu.", true);
    return;
  }

  try {
    const responses = await Promise.all([
      fetch(`${MENU_API_URL}/cuisines`),
      fetch(`${MENU_API_URL}/vendor`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);
    const cuisineData = await responses[0].json();
    const menuData = await responses[1].json();

    if (!responses[0].ok || !responses[1].ok) {
      throw new Error(
        menuData.message || cuisineData.message || "Unable to load vendor menu"
      );
    }

    cuisines = cuisineData.map((cuisine) => cuisine.cuisineName);
    stalls = menuData.stalls;
    menuItems = menuData.menuItems;
    renderStallBanner();
    renderFilterOptions();
    renderMenuCategories();
    showMenuMessage("Menu items loaded from MSSQL.");
  } catch (error) {
    console.error("Load vendor menu error:", error);
    showMenuMessage(error.message, true);
  }
}

function closeModal() {
  const modal = document.getElementById("menuItemModal");
  if (modal) {
    modal.remove();
  }
}

document.addEventListener("click", (event) => {
  const editButton = event.target.closest(".btn-edit");
  const deleteButton = event.target.closest(".btn-delete");
  const closeButton = event.target.closest("[data-close-modal]");

  if (editButton) {
    const item = menuItems.find(
      (menuItem) => menuItem.menuItemId === editButton.dataset.id
    );
    if (item) {
      openMenuForm(item);
    }
  }

  if (deleteButton) {
    removeMenuItem(deleteButton.dataset.id);
  }

  if (closeButton) {
    closeModal();
  }
});

document.getElementById("addMenuButton").addEventListener("click", () => {
  if (stalls.length > 0) {
    openMenuForm();
  }
});

document.getElementById("menuSearch").addEventListener("input", renderMenuCategories);
document.getElementById("stallFilter").addEventListener("change", renderMenuCategories);
document.getElementById("cuisineFilter").addEventListener("change", renderMenuCategories);

document.addEventListener("DOMContentLoaded", loadVendorMenu);
