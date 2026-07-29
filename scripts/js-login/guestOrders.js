const STORAGE_KEY = "guestOrders";

function readOrders() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function getGuestOrders() {
  return readOrders();
}

export function saveGuestOrder(order) {
  const orders = readOrders();
  orders.unshift(order);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  return order;
}

export function clearGuestOrders() {
  localStorage.removeItem(STORAGE_KEY);
}
