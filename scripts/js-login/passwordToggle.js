/**
 * Show / hide password toggle.
 *
 * Shared by login, signup and the profile page. Any input wrapped in
 * .password-field with a matching .toggle-password button gets an eye
 * icon that switches the field between masked and readable.
 *
 * This is a display change only - the value is still sent in the same
 * request and still hashed with bcrypt on the server.
 */

const EYE_OPEN = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>`;

const EYE_CLOSED = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <path d="M14.12 14.12a3 3 0 11-4.24-4.24"/>
    <path d="M1 1l22 22"/>
  </svg>`;

/** Wires up every toggle button currently on the page. */
export function setupPasswordToggles() {
  document.querySelectorAll(".toggle-password").forEach(btn => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;

    btn.innerHTML = EYE_CLOSED;

    btn.addEventListener("click", () => {
      const revealed = input.type === "text";

      input.type = revealed ? "password" : "text";
      btn.innerHTML = revealed ? EYE_CLOSED : EYE_OPEN;
      btn.setAttribute("aria-pressed", String(!revealed));
      btn.setAttribute("aria-label", revealed ? "Show password" : "Hide password");

      // Keep the cursor at the end instead of jumping back to the start
      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
    });
  });
}

/** Forces every password field back to masked, e.g. when reopening a panel. */
export function resetPasswordToggles() {
  document.querySelectorAll(".toggle-password").forEach(btn => {
    const input = document.getElementById(btn.dataset.target);
    if (input) input.type = "password";
    btn.innerHTML = EYE_CLOSED;
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", "Show password");
  });
}