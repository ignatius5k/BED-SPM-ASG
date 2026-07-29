/**
 * Guest order history.
 * Guests have no account, so their orders are saved in browser storage
 * instead of the database. This means the history only exists on this
 * browser and this device.
 */

const GUEST_ORDERS_KEY = "guestOrderHistory";

/** Saves one completed guest order. items = [{ name, price, quantity }] */
export function saveGuestOrder(items) {
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const history = getGuestOrders();

  const newOrder = {
    id: `GUEST-${Date.now()}`,
    date: new Date().toISOString(),
    items,
    total
  };

  history.push(newOrder);

  try {
    localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(history));
  } catch {
    throw new Error("Unable to save order. Browser storage may be full or disabled.");
  }

  return newOrder;
}

/** Reads all guest orders back out of browser storage. */
export function getGuestOrders() {
  try {
    const raw = localStorage.getItem(GUEST_ORDERS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    // Guard against corrupted or manually edited storage data
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Clears guest order history. */
export function clearGuestOrders() {
  localStorage.removeItem(GUEST_ORDERS_KEY);
}