const API_BASE = "http://localhost:3000";

export async function registerUser(username, email, password, role) {
  const res = await fetch(`${API_BASE}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password, role })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data;
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");

  localStorage.setItem("token", data.token);
  localStorage.setItem("userId", data.id);
  localStorage.setItem("role", data.role);
  localStorage.removeItem("guest"); // real login overrides any guest state

  return data;
}

// --- GUEST MODE ---
// No backend call at all - per the brief, guest order history is stored
// locally, not tied to a Users row. Only valid for the customer role.
export function continueAsGuest() {
  localStorage.setItem("guest", "true");
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
}

export function isGuest() {
  return localStorage.getItem("guest") === "true";
}

export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
  localStorage.removeItem("guest");
}

export function getToken() {
  return localStorage.getItem("token");
}

export function isLoggedIn() {
  return !!getToken();
}

export async function getCurrentUser() {
  const userId = localStorage.getItem("userId");
  const token = getToken();
  if (!userId || !token) return null;

  const res = await fetch(`${API_BASE}/users/${userId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function updateProfile(userId, updates) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Update failed");
  return data;
}