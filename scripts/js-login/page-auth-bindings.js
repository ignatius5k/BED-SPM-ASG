import { registerUser, loginUser } from "./api.js";

function getRole(){
  const form = document.querySelector("form[data-role]");
  return form?.dataset.role || "";
}

function getRedirect(role){
  if (role === "user") return "./hawkers-app-ignatius/step1-user.html";
  if (role === "vendor") return "./vendor_menu.html";
  if (role === "user_login") return "../home.html";
  if (role === "vendor_login") return "../vendor_menu.html";
  return "../index.html";
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
  const redirect = getRedirect(role);
  const isSignup = role === "user" || role === "vendor";

  if (!email || !password) return alert("Please fill in email + password.");
  if (isSignup && !terms) return alert("Please agree to the terms & policy.");
  if (isSignup && !name) return alert("Please enter your name.");

  try {
    if (isSignup) {
      await registerUser(name, email, password, toBackendRole(role));
      await loginUser(email, password); // auto-login right after signup
    } else {
      await loginUser(email, password);
    }
    window.location.href = redirect;
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById("btnPrimary")?.addEventListener("click", handleSubmit);