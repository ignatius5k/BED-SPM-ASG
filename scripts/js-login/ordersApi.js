import { getToken } from "./api.js";

const API_BASE = "http://localhost:3000";

async function request(path, options = {}) {
  const token = getToken();
  if (!token) {
    throw new Error("Please sign in to view your orders.");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Unable to load orders.");
  }

  return data;
}

export function getMyOrders() {
  return request("/orders");
}

export function getOrderById(orderId) {
  return request(`/orders/${encodeURIComponent(orderId)}`);
}

export function createOrder(stallId, items) {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify({ stallId, items })
  });
}
