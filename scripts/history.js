import { isLoggedIn, isGuest } from "./js-login/api.js";
import { getMyOrders, searchOrders } from "./js-login/ordersApi.js";
import { getGuestOrders } from "./js-login/guestOrders.js";

const listEl = document.getElementById("history-list");
const statTotal = document.getElementById("stat-total");
const statCompleted = document.getElementById("stat-completed");
const statSpent = document.getElementById("stat-spent");
const searchInput = document.getElementById("orderSearch");
const btnSearch = document.getElementById("btnSearch");
const btnClearSearch = document.getElementById("btnClearSearch");

// Neither signed in nor browsing as a guest, so send them to login
if (!isLoggedIn() && !isGuest()) {
  window.location.href = `login.html?redirect=${encodeURIComponent("history.html")}`;
}

/**
 * Converts a guest order from browser storage into the same shape the
 * backend returns, so one render function can handle both.
 */
function normaliseGuestOrder(o) {
  return {
    OrderID: o.id,
    StallName: o.stallName || "Guest Order",
    OrderDate: o.date,
    Status: "completed",
    TotalAmount: o.total,
    items: (o.items || []).map(i => ({
      ItemName: i.name,
      Quantity: i.quantity,
      UnitPrice: i.price
    }))
  };
}

/** Filters guest orders in the browser, since guests have no backend to query. */
function filterGuestOrders(orders, term) {
  const lower = term.toLowerCase();
  return orders.filter(o =>
    (o.stallName || "").toLowerCase().includes(lower) ||
    (o.items || []).some(i => (i.name || "").toLowerCase().includes(lower))
  );
}

function updateStats(orders) {
  let completed = 0;
  let spent = 0;

  orders.forEach(o => {
    if (o.Status === "completed" || o.Status === "paid") completed++;
    spent += Number(o.TotalAmount) || 0;
  });

  statTotal.textContent = `Total Order: ${orders.length}`;
  statCompleted.textContent = `Completed: ${completed}`;
  statSpent.textContent = `Total Spent: $${spent.toFixed(2)}`;
}

function renderOrders(orders) {
  listEl.innerHTML = "";

  if (orders.length === 0) {
    listEl.innerHTML = `<p class="empty">No orders found.</p>`;
    updateStats([]);
    return;
  }

  orders.forEach(order => {
    const firstItemName = order.items?.[0]?.ItemName ?? "Order";
    const dateText = order.OrderDate
      ? new Date(order.OrderDate).toLocaleDateString()
      : "";
    const timeText = order.OrderDate
      ? new Date(order.OrderDate).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })
      : "";

    const card = document.createElement("div");
    card.className = "history-card";

    card.innerHTML = `
      <div class="status">${order.Status ?? "Completed"}</div>

      <div class="history-row main-row">
        <div>
          <div class="title">${firstItemName}</div>
          <div class="meta">
            <span>${dateText} ${timeText}</span>
            <span>${order.StallName ?? "Unknown Stall"}</span>
          </div>
        </div>
        <div class="price">$${(Number(order.TotalAmount) || 0).toFixed(2)}</div>
      </div>

      <div class="history-details" style="display:none;">
        ${(order.items || []).map(i => `
          <div class="detail-item">
            ${i.Quantity} x ${i.ItemName} — $${(i.Quantity * i.UnitPrice).toFixed(2)}
          </div>
        `).join("")}
        <div class="detail-total">
          Total: $${(Number(order.TotalAmount) || 0).toFixed(2)}
        </div>
      </div>
    `;

    // Clicking an order expands or collapses its item list
    card.querySelector(".main-row").onclick = () => {
      const details = card.querySelector(".history-details");
      details.style.display = details.style.display === "none" ? "block" : "none";
    };

    listEl.appendChild(card);
  });

  updateStats(orders);
}

async function loadHistory(searchTerm = "") {
  listEl.innerHTML = `<p class="empty">Loading orders...</p>`;

  try {
    let orders;

    if (isGuest()) {
      // Guests: read and filter entirely in the browser, no backend call
      const raw = getGuestOrders();
      const filtered = searchTerm ? filterGuestOrders(raw, searchTerm) : raw;
      orders = filtered.map(normaliseGuestOrder);
    } else {
      // Registered: the backend filters, scoped to this user's own orders
      orders = searchTerm ? await searchOrders(searchTerm) : await getMyOrders();
    }

    renderOrders(orders);
  } catch (err) {
    listEl.innerHTML = `<p class="empty">Failed to load order history: ${err.message}</p>`;
    updateStats([]);
  }
}

btnSearch?.addEventListener("click", () => {
  const term = searchInput.value.trim();
  loadHistory(term);
});

// Pressing Enter in the search box searches too
searchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnSearch.click();
});

btnClearSearch?.addEventListener("click", () => {
  searchInput.value = "";
  loadHistory();
});

loadHistory();