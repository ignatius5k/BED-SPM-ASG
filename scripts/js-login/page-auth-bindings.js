import { registerUser, loginUser, continueAsGuest } from "./api.js";

/* =========================
   MESSAGE DISPLAY
========================= */
function showMessage(text, type = "error") {
  const el = document.getElementById("formMessage");
  if (!el) { alert(text); return; }
  el.textContent = text;
  el.className = `form-message ${type}`;
}

function clearMessage() {
  const el = document.getElementById("formMessage");
  if (el) el.className = "form-message";
}

/* =========================
   PER-FIELD VALIDATION
   Marks the exact field that is wrong and shows its own message,
   instead of one shared error for the whole form.
========================= */
const FIELDS = ["accountRole", "name", "email", "password", "badgeNumber"];

function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  if (!input) return;

  input.classList.add("input-error");

  let errEl = document.getElementById(`${fieldId}Error`);
  if (!errEl) {
    errEl = document.createElement("small");
    errEl.id = `${fieldId}Error`;
    errEl.className = "field-error";
    input.insertAdjacentElement("afterend", errEl);
  }

  errEl.textContent = message;
  errEl.style.display = "block";
}

function clearFieldError(fieldId) {
  document.getElementById(fieldId)?.classList.remove("input-error");
  const errEl = document.getElementById(`${fieldId}Error`);
  if (errEl) errEl.style.display = "none";
}

function clearAllFieldErrors() {
  FIELDS.forEach(clearFieldError);
}

// Removes a field's error as soon as the user starts fixing it
function bindLiveErrorClearing() {
  FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const eventName = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(eventName, () => clearFieldError(id));
  });
}

/* =========================
   PAGE TYPE
========================= */
function isSignupPage() {
  return !!document.querySelector('form[data-role="signup"]');
}

/* =========================
   REDIRECTS
   Both login.html and signup.html sit at the project root.
========================= */
function getRedirect(role) {
  const requested = new URLSearchParams(window.location.search).get("redirect");
  if (role === "vendor" && requested === "vendor_stores.html") {
    return "vendor_stores.html";
  }

  if (role === "customer")  return "home.html";
  if (role === "vendor")    return "vendor_menu.html";
  if (role === "inspector") return "regulatory%20and%20compliance/inspection-dashboard.html";
  return "home.html";
}

/* =========================
   LIVE PASSWORD CHECKLIST (signup page only)
   Updates on every keystroke so the user sees problems before
   submitting, matching the rules the server enforces.
========================= */
function setupPasswordChecklist() {
  const passwordInput = document.getElementById("password");
  const checklist = document.getElementById("passwordChecklist");
  if (!passwordInput || !checklist) return;

  const items = checklist.querySelectorAll("li");

  passwordInput.addEventListener("input", () => {
    const val = passwordInput.value;
    const checks = {
      checkLength: val.length >= 8,
      checkUpper: /[A-Z]/.test(val),
      checkLower: /[a-z]/.test(val),
      checkNumber: /\d/.test(val)
    };

    items.forEach(li => {
      const passed = checks[li.id];
      li.textContent = `${passed ? "✓" : "✗"} ${li.dataset.label}`;
      li.classList.toggle("ok", passed);
      li.classList.toggle("fail", !passed && val.length > 0);
    });
  });
}

function isPasswordValid(password) {
  return password.length >= 8
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /\d/.test(password);
}

/* =========================
   BADGE FIELD
   Only inspectors need a badge number, so the field is hidden
   until that role is selected.
========================= */
function setupRoleToggle() {
  const roleSelect = document.getElementById("accountRole");
  const badgeField = document.getElementById("badgeField");
  if (!roleSelect || !badgeField) return;

  roleSelect.addEventListener("change", () => {
    badgeField.style.display = roleSelect.value === "inspector" ? "block" : "none";
  });
}

/* =========================
   FORM INPUTS
========================= */
function getInputs() {
  return {
    role: document.getElementById("accountRole")?.value || "",
    name: document.getElementById("name")?.value?.trim() || "",
    email: document.getElementById("email")?.value?.trim() || "",
    password: document.getElementById("password")?.value || "",
    badgeNumber: document.getElementById("badgeNumber")?.value?.trim() || "",
    terms: document.getElementById("terms")?.checked ?? true
  };
}

function setButtonLoading(isLoading, label) {
  const btn = document.getElementById("btnPrimary");
  if (!btn) return;
  btn.disabled = isLoading;
  btn.textContent = isLoading ? "Please wait..." : label;
}

/* =========================
   SIGNUP
========================= */
async function handleSignup() {
  clearMessage();
  clearAllFieldErrors();

  const { role, name, email, password, badgeNumber, terms } = getInputs();
  let hasError = false;

  if (!role) {
    setFieldError("accountRole", "Account type is required");
    hasError = true;
  }
  if (!name) {
    setFieldError("name", "Name is required");
    hasError = true;
  }
  if (!email) {
    setFieldError("email", "Email is required");
    hasError = true;
  }
  if (!password) {
    setFieldError("password", "Password is required");
    hasError = true;
  } else if (!isPasswordValid(password)) {
    setFieldError("password", "Password does not meet the requirements above");
    hasError = true;
  }
  if (role === "inspector" && !badgeNumber) {
    setFieldError("badgeNumber", "Badge number is required for inspectors");
    hasError = true;
  }

  if (hasError) return showMessage("Please fix the highlighted fields.");
  if (!terms) return showMessage("Please agree to the terms & policy.");

  try {
    setButtonLoading(true, "Sign Up");

    // Create the account
    await registerUser(name, email, password, role, badgeNumber);

    // Log in straight away, which reads the stored account back
    // from the database and confirms it was created properly
    const loginData = await loginUser(email, password);

    showMessage(
      `Account created. Welcome, ${loginData.username} (${loginData.role}). Redirecting...`,
      "success"
    );

    setTimeout(() => {
      window.location.href = getRedirect(loginData.role);
    }, 1200);
  } catch (err) {
    showMessage(err.message);
  } finally {
    setButtonLoading(false, "Sign Up");
  }
}

/* =========================
   LOGIN
========================= */
async function handleLogin() {
  clearMessage();
  clearAllFieldErrors();

  const { email, password } = getInputs();
  let hasError = false;

  if (!email) {
    setFieldError("email", "Email is required");
    hasError = true;
  }
  if (!password) {
    setFieldError("password", "Password is required");
    hasError = true;
  }
  if (hasError) return showMessage("Please fix the highlighted fields.");

  try {
    setButtonLoading(true, "Sign In");

    const data = await loginUser(email, password);

    showMessage(`Welcome back, ${data.username}!`, "success");

    setTimeout(() => {
      window.location.href = getRedirect(data.role);
    }, 800);
  } catch (err) {
    showMessage(err.message);
  } finally {
    setButtonLoading(false, "Sign In");
  }
}

/* =========================
   GUEST
   The guest flag must be set before navigating away. A plain link
   would skip this and the rest of the app would not know the
   visitor is a guest.
========================= */
function handleGuest() {
  continueAsGuest();
  window.location.href = "home.html";
}

/* =========================
   INIT
========================= */
bindLiveErrorClearing();

if (isSignupPage()) {
  setupPasswordChecklist();
  setupRoleToggle();
  document.getElementById("btnPrimary")?.addEventListener("click", handleSignup);
} else {
  document.getElementById("btnPrimary")?.addEventListener("click", handleLogin);
}

document.getElementById("btnGuest")?.addEventListener("click", handleGuest);
