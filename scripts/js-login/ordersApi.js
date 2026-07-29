import { getToken } from "./api.js";

const API_BASE = "http://localhost:3000";

/**
 * Creates an order for the logged-in customer.
 * items = [{ menuItemId, quantity }]
 */
export async function createOrder(stallId, items) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`
    },
    body: JSON.stringify({ stallId, items })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create order");
  return data;
}

/** Gets every order belonging to the logged-in customer. */
export async function getMyOrders() {
  const res = await fetch(`${API_BASE}/orders`, {
    headers: { "Authorization": `Bearer ${getToken()}` }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load orders");
  return data;
}

/** Gets one order in full, including its items. */
export async function getOrderById(orderId) {
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    headers: { "Authorization": `Bearer ${getToken()}` }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load order");
  return data;
}