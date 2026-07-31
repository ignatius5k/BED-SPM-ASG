import {
  isLoggedIn,
  isGuest,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteAccount,
  logoutUser
} from "./api.js";

/* =========================
   DOM ELEMENTS
========================= */
const els = {
  username: document.getElementById("profileUsername"),
  email: document.getElementById("profileEmail"),
  role: document.getElementById("profileRole"),

  message: document.getElementById("profileMessage"),

  editor: document.getElementById("editor"),
  editLabel: document.getElementById("editLabel"),
  editInput: document.getElementById("editInput"),
  saveEditBtn: document.getElementById("saveEditBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),

  passwordEdit: document.getElementById("passwordEdit"),
  currentPassword: document.getElementById("currentPassword"),
  newPassword: document.getElementById("newPassword"),
  confirmPassword: document.getElementById("confirmPassword"),
  passwordChecklist: document.getElementById("passwordChecklist"),
  savePasswordBtn: document.getElementById("savePasswordBtn"),
  cancelPasswordBtn: document.getElementById("cancelPasswordBtn"),
  editPasswordBtn: document.getElementById("editPasswordBtn"),

  deleteBtn: document.getElementById("deleteAccountBtn"),
  logoutBtn: document.getElementById("logoutBtn")
};

let currentEdit = null;  // which field is being edited
let cachedUser = null;   // the profile loaded from the server

/* =========================
   MESSAGES
========================= */
function showMessage(text, type = "error") {
  if (!els.message) return;
  els.message.textContent = text;
  els.message.className = `form-message ${type}`;
}

function clearMessage() {
  if (els.message) els.message.className = "form-message";
}

/* =========================
   EDITOR VISIBILITY
========================= */
function closeAllEditors() {
  if (els.editor) els.editor.style.display = "none";
  if (els.passwordEdit) els.passwordEdit.style.display = "none";
  currentEdit = null;
}

/* =========================
   ACCESS CONTROL
   Guests have no stored account, so there is no profile to show.
========================= */
if (!isLoggedIn()) {
  if (isGuest()) {
    alert("Guests do not have a saved profile. Please sign in or create an account.");
  }
  window.location.href = "login.html";
} else {
  init();
}

/* =========================
   READ - load the profile
========================= */
async function init() {
  const user = await getCurrentUser();

  if (!user) {
    // Token expired or was tampered with
    logoutUser();
    window.location.href = "login.html";
    return;
  }

  cachedUser = user;
  renderProfile();

  // Edit buttons for username and email
  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openEditor(btn.dataset.edit));
  });

  els.saveEditBtn?.addEventListener("click", saveEdit);
  els.cancelEditBtn?.addEventListener("click", closeAllEditors);

  els.editPasswordBtn?.addEventListener("click", togglePasswordEditor);
  els.savePasswordBtn?.addEventListener("click", savePassword);
  els.cancelPasswordBtn?.addEventListener("click", closeAllEditors);

  // Live checklist updates as the user types either password field
  els.newPassword?.addEventListener("input", updatePasswordChecklist);
  els.confirmPassword?.addEventListener("input", updatePasswordChecklist);

  els.deleteBtn?.addEventListener("click", handleDeleteAccount);
  els.logoutBtn?.addEventListener("click", handleLogout);
}

function renderProfile() {
  if (els.username) els.username.textContent = cachedUser.username || "Not set";
  if (els.email) els.email.textContent = cachedUser.email || "Not set";
  if (els.role) els.role.textContent = cachedUser.role || "Not set";
}

/* =========================
   UPDATE - username or email
========================= */
function openEditor(field) {
  clearMessage();

  // Clicking the same Edit button again closes the editor
  if (currentEdit === field && els.editor.style.display === "block") {
    closeAllEditors();
    return;
  }

  closeAllEditors();
  currentEdit = field;

  els.editLabel.textContent = field === "username" ? "New username" : "New email";
  els.editInput.type = field === "email" ? "email" : "text";
  els.editInput.value = cachedUser[field] || "";
  els.editor.style.display = "block";
  els.editInput.focus();
}

async function saveEdit() {
  clearMessage();
  const value = els.editInput.value.trim();

  if (!value) {
    showMessage(`${currentEdit === "username" ? "Username" : "Email"} cannot be empty.`);
    return;
  }

  if (currentEdit === "username" && value.length < 3) {
    showMessage("Username must be at least 3 characters long.");
    return;
  }

  if (currentEdit === "email" && !/^\S+@\S+\.\S+$/.test(value)) {
    showMessage("Please enter a valid email address.");
    return;
  }

  try {
    els.saveEditBtn.disabled = true;

    // The backend requires both fields together, so the unchanged
    // one is sent along with the edited one.
    const updates = {
      username: cachedUser.username,
      email: cachedUser.email
    };
    updates[currentEdit] = value;

    cachedUser = await updateProfile(cachedUser.id, updates);

    // Keep the session banner name in sync with the new username
    localStorage.setItem("username", cachedUser.username);

    renderProfile();
    closeAllEditors();
    showMessage("Profile updated successfully.", "success");
  } catch (err) {
    showMessage(err.message);
  } finally {
    els.saveEditBtn.disabled = false;
  }
}

/* =========================
   LIVE PASSWORD CHECKLIST
   Mirrors the rules the server enforces, so the user sees what is
   still missing before they submit. The server checks again anyway,
   since anything in the browser can be bypassed.
========================= */
function updatePasswordChecklist() {
  if (!els.passwordChecklist) return;

  const val = els.newPassword.value;
  const confirmVal = els.confirmPassword.value;

  const checks = {
    checkLength: val.length >= 8,
    checkUpper: /[A-Z]/.test(val),
    checkLower: /[a-z]/.test(val),
    checkNumber: /\d/.test(val),
    checkMatch: val.length > 0 && val === confirmVal
  };

  els.passwordChecklist.querySelectorAll("li").forEach(li => {
    const passed = checks[li.id];
    li.textContent = `${passed ? "✓" : "✗"} ${li.dataset.label}`;
    li.classList.toggle("ok", passed);
    // Stay neutral until the user has actually typed something
    li.classList.toggle("fail", !passed && val.length > 0);
  });
}

function isPasswordValid(pw) {
  return pw.length >= 8
    && /[A-Z]/.test(pw)
    && /[a-z]/.test(pw)
    && /\d/.test(pw);
}

/* =========================
   UPDATE - password
========================= */
function togglePasswordEditor() {
  clearMessage();

  if (els.passwordEdit.style.display === "block") {
    closeAllEditors();
    return;
  }

  closeAllEditors();
  els.currentPassword.value = "";
  els.newPassword.value = "";
  els.confirmPassword.value = "";
  updatePasswordChecklist(); // reset the ticks back to neutral
  els.passwordEdit.style.display = "block";
  els.currentPassword.focus();
}

async function savePassword() {
  clearMessage();

  const current = els.currentPassword.value;
  const next = els.newPassword.value;
  const confirm = els.confirmPassword.value;

  if (!current) {
    showMessage("Please enter your current password.");
    return;
  }
  if (!next) {
    showMessage("Please enter a new password.");
    return;
  }
  if (!isPasswordValid(next)) {
    showMessage("New password does not meet all the requirements listed above.");
    return;
  }
  if (next !== confirm) {
    showMessage("New passwords do not match.");
    return;
  }
  if (next === current) {
    showMessage("New password must be different from your current password.");
    return;
  }

  try {
    els.savePasswordBtn.disabled = true;

    // The server verifies the current password against the stored
    // hash before applying the change.
    await changePassword(current, next);

    closeAllEditors();
    showMessage("Password changed successfully. Use it the next time you sign in.", "success");
  } catch (err) {
    showMessage(err.message);
  } finally {
    els.savePasswordBtn.disabled = false;
  }
}

/* =========================
   DELETE - remove the account
========================= */
async function handleDeleteAccount() {
  clearMessage();

  // Two-step confirmation, since deletion cannot be undone
  const confirmed = confirm("Delete your account permanently? This cannot be undone.");
  if (!confirmed) return;

  const typed = prompt(`Type your username "${cachedUser.username}" to confirm:`);
  if (typed !== cachedUser.username) {
    showMessage("Username did not match. Account was not deleted.");
    return;
  }

  try {
    els.deleteBtn.disabled = true;
    await deleteAccount(cachedUser.id);

    logoutUser();
    alert("Your account has been deleted.");
    window.location.href = "signup.html";
  } catch (err) {
    showMessage(err.message);
    els.deleteBtn.disabled = false;
  }
}

/* =========================
   LOGOUT
========================= */
function handleLogout() {
  logoutUser();
  window.location.href = "login.html";
}