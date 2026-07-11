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

  return data;
}

export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
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