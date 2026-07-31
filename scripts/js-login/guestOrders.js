const STORAGE_KEY = "guestOrders";

function readOrders() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    // Guard against corrupted or manually edited storage data
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function getGuestOrders() {
  return readOrders();
}

/**
 * Saves one completed guest order.
 * items = [{ name, price, quantity }]
 */
export function saveGuestOrder(items, stallName = "Guest Order") {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cannot save an empty order.");
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const newOrder = {
    id: `GUEST-${Date.now()}`,
    date: new Date().toISOString(),
    stallName,
    items,
    total
  };

  const orders = readOrders();
  orders.unshift(newOrder); // newest first

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    throw new Error("Unable to save order. Browser storage may be full or disabled.");
  }

  return newOrder;
}

export function clearGuestOrders() {
  localStorage.removeItem(STORAGE_KEY);
}