import { registerUser, loginUser, continueAsGuest } from "./api.js";

/* =========================
   MESSAGE DISPLAY
========================= */
function showMessage(text, type = "error"){
  const el = document.getElementById("formMessage");
  if (!el) { alert(text); return; }
  el.textContent = text;
  el.className = `form-message ${type}`;
}

function clearMessage(){
  const el = document.getElementById("formMessage");
  if (el) el.className = "form-message";
}

/* =========================
   PAGE TYPE DETECTION
========================= */
function isSignupPage(){
  return !!document.querySelector('form[data-role="signup"]');
}

/* =========================
   REDIRECTS
========================= */
function getRedirect(backendRole, fromSignupPage){
  if (backendRole === "customer") return fromSignupPage ? "../home.html" : "home.html".replace("home.html", "../home.html");
  if (backendRole === "vendor")   return fromSignupPage ? "../vendor_menu.html" : "../vendor_menu.html";
  if (backendRole === "inspector")return fromSignupPage ? "../inspector_dashboard.html" : "../inspector_dashboard.html";
  return fromSignupPage ? "../login.html" : "../signup.html";
}

/* =========================
   LIVE PASSWORD VALIDATION
========================= */
function setupPasswordChecklist(){
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
      checkNumber: /\d/.test(val),
    };

    items.forEach(li => {
      const passed = checks[li.id];
      const symbol = passed ? "✓" : "✗";
      li.textContent = `${symbol} ${li.dataset.label}`;
      li.classList.toggle("ok", passed);
      li.classList.toggle("fail", !passed && val.length > 0);
    });
  });
}

function isPasswordValid(password){
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
}

/* =========================
   ROLE SELECT -> SHOW/HIDE BADGE FIELD
========================= */
function setupRoleToggle(){
  const roleSelect = document.getElementById("accountRole");
  const badgeField = document.getElementById("badgeField");
  if (!roleSelect || !badgeField) return;

  roleSelect.addEventListener("change", () => {
    badgeField.style.display = roleSelect.value === "inspector" ? "block" : "none";
  });
}

/* =========================
   FORM INPUT COLLECTION
========================= */
function getInputs(){
  return {
    role: document.getElementById("accountRole")?.value || "",
    name: document.getElementById("name")?.value?.trim() || "",
    email: document.getElementById("email")?.value?.trim() || "",
    password: document.getElementById("password")?.value || "",
    badgeNumber: document.getElementById("badgeNumber")?.value?.trim() || "",
    terms: document.getElementById("terms")?.checked ?? true
  };
}

/* =========================
   SUBMIT HANDLERS
========================= */
async function handleSignup(){
  clearMessage();
  const { role, name, email, password, badgeNumber, terms } = getInputs();

  if (!role) return showMessage("Please select an account type.");
  if (!name) return showMessage("Please enter your name.");
  if (!email) return showMessage("Please enter your email.");
  if (!isPasswordValid(password)) return showMessage("Password does not meet the requirements above.");
  if (!terms) return showMessage("Please agree to the terms & policy.");
  if (role === "inspector" && !badgeNumber) return showMessage("Badge number is required for inspectors.");

  try {
    await registerUser(name, email, password, role, badgeNumber);
    const loginData = await loginUser(email, password);

    showMessage(`Account created! Welcome, ${loginData.username} (${loginData.role}). Redirecting...`, "success");

    setTimeout(() => {
      window.location.href = getRedirect(loginData.role, true);
    }, 1200);
  } catch (err) {
    showMessage(err.message);
  }
}

async function handleLogin(){
  clearMessage();
  const { email, password } = getInputs();

  if (!email || !password) return showMessage("Please fill in email + password.");

  try {
    const data = await loginUser(email, password);
    showMessage(`Welcome back, ${data.username}!`, "success");
    setTimeout(() => {
      window.location.href = getRedirect(data.role, false);
    }, 800);
  } catch (err) {
    showMessage(err.message);
  }
}

function handleGuest(){
  continueAsGuest();
  window.location.href = "../home.html";
}

/* =========================
   INIT
========================= */
if (isSignupPage()) {
  setupPasswordChecklist();
  setupRoleToggle();
  document.getElementById("btnPrimary")?.addEventListener("click", handleSignup);
} else {
  document.getElementById("btnPrimary")?.addEventListener("click", handleLogin);
  document.getElementById("btnGuest")?.addEventListener("click", handleGuest);
}