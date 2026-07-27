import { isLoggedIn, isGuest } from "./js-login/api.js";
import { getMyOrders } from "./js-login/ordersApi.js";
import { getGuestOrders } from "./js-login/guestOrders.js";

const listEl = document.getElementById("history-list");
const statTotal = document.getElementById("stat-total");
const statCompleted = document.getElementById("stat-completed");
const statSpent = document.getElementById("stat-spent");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeGuestOrder(order) {
  return {
    OrderID: order.id,
    StallName: order.stallName || "Guest Order",
    OrderDate: order.date,
    Status: order.status || "completed",
    TotalAmount: Number(order.total) || 0,
    items: Array.isArray(order.items)
      ? order.items.map((item) => ({
          ItemName: item.name,
          Quantity: Number(item.quantity) || 0,
          UnitPrice: Number(item.price) || 0
        }))
      : []
  };
}

function renderOrder(order) {
  const total = Number(order.TotalAmount) || 0;
  const items = Array.isArray(order.items) ? order.items : [];
  const firstItemName = items[0]?.ItemName || `Order ${order.OrderID || ""}`.trim();
  const timeText = order.OrderDate
    ? new Date(order.OrderDate).toLocaleString()
    : "Time unavailable";

  const details = items.length > 0
    ? items.map((item) => {
        const quantity = Number(item.Quantity) || 0;
        const unitPrice = Number(item.UnitPrice) || 0;
        return `
          <div class="detail-item">
            ${quantity} x ${escapeHtml(item.ItemName)} - $${(quantity * unitPrice).toFixed(2)}
          </div>
        `;
      }).join("")
    : '<div class="detail-item">Item details are unavailable for this order.</div>';

  const card = document.createElement("div");
  card.className = "history-card";
  card.innerHTML = `
    <div class="status">${escapeHtml(order.Status || "Completed")}</div>
    <div class="history-row main-row">
      <div>
        <div class="title">${escapeHtml(firstItemName)}</div>
        <div class="meta">
          <span>${escapeHtml(timeText)}</span>
          <span>${escapeHtml(order.StallName || "Unknown Stall")}</span>
        </div>
      </div>
      <div class="price">$${total.toFixed(2)}</div>
    </div>
    <div class="history-details" style="display:none;">
      ${details}
      <div class="detail-total">Total: $${total.toFixed(2)}</div>
    </div>
  `;

  card.querySelector(".main-row").addEventListener("click", () => {
    const detailsEl = card.querySelector(".history-details");
    detailsEl.style.display = detailsEl.style.display === "none" ? "block" : "none";
  });

  listEl.appendChild(card);
}

async function loadHistory() {
  if (!isLoggedIn() && !isGuest()) {
    window.location.href = `login.html?redirect=${encodeURIComponent("history.html")}`;
    return;
  }

  let orders;
  try {
    orders = isGuest()
      ? getGuestOrders().map(normalizeGuestOrder)
      : await getMyOrders();
  } catch (error) {
    listEl.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
    return;
  }

  listEl.innerHTML = "";
  if (orders.length === 0) {
    listEl.innerHTML = '<p class="empty">No orders yet</p>';
    return;
  }

  let completedOrders = 0;
  let totalSpent = 0;

  orders.forEach((order) => {
    const status = String(order.Status || "").toLowerCase();
    if (status === "completed" || status === "paid") completedOrders += 1;
    totalSpent += Number(order.TotalAmount) || 0;
    renderOrder(order);
  });

  statTotal.textContent = `Total Orders: ${orders.length}`;
  statCompleted.textContent = `Completed: ${completedOrders}`;
  statSpent.textContent = `Total Spent: $${totalSpent.toFixed(2)}`;
}

loadHistory();
