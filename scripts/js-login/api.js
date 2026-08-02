const API_BASE = "http://localhost:3000";

/**
 * Central fetch wrapper for every backend call.
 * Turns network failures and server errors into a friendly message
 * so the user never sees a raw "Failed to fetch".
 */
async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    // Server not running, database unreachable, or no network
    throw new Error("Unable to connect. Please try again later.");
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Unable to connect. Please try again later.");
  }

  if (!res.ok) {
    // 500 and above means something broke on the server side
    if (res.status >= 500) {
      throw new Error("Unable to connect. Please try again later.");
    }
    // Keep the full response body on the error, so callers can react to
    // flags like needsVerification instead of parsing the message text.
    const err = new Error(data.error || "Request failed");
    err.data = data;
    err.status = res.status;
    throw err;
  }

  return data;
}

/* =========================
   REGISTER
========================= */
export async function registerUser(username, email, password, role, badgeNumber) {
  const body = { username, email, password, role };

  // The backend only accepts badgeNumber for inspectors, so it is
  // left out entirely for customers and vendors.
  if (role === "inspector" && badgeNumber) {
    body.badgeNumber = badgeNumber;
  }

  return await request(`${API_BASE}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

/* =========================
   LOGIN
========================= */
export async function loginUser(email, password) {
  const data = await request(`${API_BASE}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  // Store the token so later pages can prove who this user is.
  localStorage.setItem("token", data.token);
  localStorage.setItem("userId", data.id);
  localStorage.setItem("role", data.role);
  localStorage.setItem("username", data.username);
  localStorage.setItem("email", data.email);
  localStorage.removeItem("guest"); // a real login cancels guest mode

  return data;
}

/* =========================
   EMAIL VERIFICATION
   Asks the server to email a fresh verification link. Used when the
   first one expired or never arrived.
========================= */
export async function resendVerification(email) {
  return await request(`${API_BASE}/users/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
}

/* =========================
   GUEST MODE
   No backend call at all. Guest activity is kept in the browser
   and is never linked to a Users record.
========================= */
export function continueAsGuest() {
  localStorage.setItem("guest", "true");
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
  localStorage.removeItem("username");
}

export function isGuest() {
  return localStorage.getItem("guest") === "true";
}

/* =========================
   SESSION HELPERS
========================= */
export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
  localStorage.removeItem("username");
  localStorage.removeItem("guest");
}

export function getToken() {
  return localStorage.getItem("token");
}

export function isLoggedIn() {
  return !!getToken();
}

export function getRole() {
  return localStorage.getItem("role");
}

/**
 * Asks the server who the current user is, based on the token.
 * The identity comes from the verified token, not from an ID
 * sitting in the browser that a user could change.
 */
export async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;

  try {
    return await request(`${API_BASE}/users/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
  } catch {
    return null;
  }
}

/* =========================
   UPDATE PROFILE
========================= */
export async function updateProfile(userId, updates) {
  return await request(`${API_BASE}/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`
    },
    body: JSON.stringify(updates)
  });
}

/* =========================
   CHANGE PASSWORD
========================= */
export async function changePassword(currentPassword, newPassword) {
  return await request(`${API_BASE}/users/change-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });
}

/* =========================
   DELETE ACCOUNT
========================= */
export async function deleteAccount(userId) {
  return await request(`${API_BASE}/users/${userId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${getToken()}` }
  });
}