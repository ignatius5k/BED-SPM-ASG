import { registerUser, loginUser } from "./api.js";

function getRole(){
  const form = document.querySelector("form[data-role]");
  return form?.dataset.role || "";
}

function getSignupRedirect(role){
  if (role === "user") return "./home.html";
  if (role === "vendor") return "./vendor_menu.html";
  return "signup.html";
}

function getLoginRedirect(backendRole){
  if (backendRole === "customer") return "../home.html";
  if (backendRole === "vendor") return "../vendor_menu.html";
  if (backendRole === "inspector") return "../inspector_dashboard.html";
  return "../signup.html";
}

function toBackendRole(role){
  if (role.includes("vendor")) return "vendor";
  if (role.includes("inspector")) return "inspector";
  return "customer";
}

function getInputs(){
  return {
    name: document.getElementById("name")?.value?.trim() || "",
    email: document.getElementById("email")?.value?.trim() || "",
    password: document.getElementById("password")?.value || "",
    terms: document.getElementById("terms")?.checked ?? true
  };
}

async function handleSubmit(){
  const role = getRole();
  const { name, email, password, terms } = getInputs();
  const isSignup = role === "user" || role === "vendor";

  if (!email || !password) return alert("Please fill in email + password.");
  if (isSignup && !terms) return alert("Please agree to the terms & policy.");
  if (isSignup && !name) return alert("Please enter your name.");

  try {
    if (isSignup) {
      await registerUser(name, email, password, toBackendRole(role));
      window.location.href = getSignupRedirect(role);
    } else {
      const data = await loginUser(email, password);
      window.location.href = getLoginRedirect(data.role);
    }
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById("btnPrimary")?.addEventListener("click", handleSubmit);