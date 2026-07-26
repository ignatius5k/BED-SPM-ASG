import { isLoggedIn, isGuest } from "./js-login/api.js";
import { getMyOrders } from "./js-login/ordersApi.js";
import { getGuestOrders } from "./js-login/guestOrders.js";

const listEl = document.getElementById("history-list");
const statTotal = document.getElementById("stat-total");
const statCompleted = document.getElementById("stat-completed");
const statSpent = document.getElementById("stat-spent");

async function loadHistory() {
  // Not logged in and not browsing as guest -> send to login
  if (!isLoggedIn() && !isGuest()) {
    window.location.href =
      `hawkers-app-ignatius/login.html?redirect=${encodeURIComponent("../history.html")}`;
    return;
  }

  let orders = [];

  try {
    if (isGuest()) {
      // Guest orders live entirely in localStorage
      orders = getGuestOrders().map(o => ({
        OrderID: o.id,
        StallName: "Guest Order",
        OrderDate: o.date,
        Status: "completed",
        TotalAmount: o.total,
        items: o.items.map(i => ({
          ItemName: i.name,
          Quantity: i.quantity,
          UnitPrice: i.price
        }))
      }));
    } else {
      // Registered customer - fetch from backend
      orders = await getMyOrders();
      // Fetch full item details for each order (getMyOrders only returns summaries)
      // If you want item-level detail per card, call getOrderById per order here.
    }
  } catch (err) {
    listEl.innerHTML = `<p class="empty">Failed to load order history: ${err.message}</p>`;
    return;
  }

  if (orders.length === 0) {
    listEl.innerHTML = `<p class="empty">No orders yet</p>`;
    return;
  }

  let totalOrders = 0;
  let completedOrders = 0;
  let totalSpent = 0;

  orders.forEach(order => {
    totalOrders++;
    if (order.Status === "completed" || order.Status === "paid") completedOrders++;
    totalSpent += order.TotalAmount ?? 0;

    const firstItemName = order.items?.[0]?.ItemName ?? "Order";
    const timeText = order.OrderDate
      ? new Date(order.OrderDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

    const card = document.createElement("div");
    card.className = "history-card";

    card.innerHTML = `
      <div class="status">${order.Status ?? "Completed"}</div>

      <div class="history-row main-row">
        <div>
          <div class="title">${firstItemName}</div>
          <div class="meta">
            <span>🕒 ${timeText}</span>
            <span>📍 ${order.StallName ?? "Unknown Stall"}</span>
          </div>
        </div>
        <div class="price">$${(order.TotalAmount ?? 0).toFixed(2)}</div>
      </div>

      <div class="history-details" style="display:none;">
        ${(order.items || []).map(i => `
          <div class="detail-item">
            ${i.Quantity}× ${i.ItemName} — $${(i.Quantity * i.UnitPrice).toFixed(2)}
          </div>
        `).join("")}
        <div class="detail-total">
          Total: $${(order.TotalAmount ?? 0).toFixed(2)}
        </div>
      </div>
    `;

    card.querySelector(".main-row").onclick = () => {
      const details = card.querySelector(".history-details");
      details.style.display = details.style.display === "none" ? "block" : "none";
    };

    listEl.appendChild(card);
  });

  statTotal.textContent = `Total Order: ${totalOrders}`;
  statCompleted.textContent = `Completed: ${completedOrders}`;
  statSpent.textContent = `Total Spent: $${totalSpent.toFixed(2)}`;
}

loadHistory();