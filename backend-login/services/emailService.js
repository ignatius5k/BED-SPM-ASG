/**
 * sends email when register for an account
 */
require("dotenv").config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Hawkers <onboarding@resend.dev>";
const API_URL = process.env.API_URL || "http://localhost:3000";

/**
 * Low-level send. Returns the provider's response.
 * If no API key is configured, the email is printed to the terminal instead
 * of crashing the signup flow - useful for local testing and demos.
 */
async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn("[emailService] RESEND_API_KEY not set - printing email instead of sending.");
    console.warn(`[emailService] To: ${to}\nSubject: ${subject}\n${html}`);
    return { skipped: true };
  }

  let response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html })
    });
  } catch (error) {
    // Network failure reaching the provider
    console.error("[emailService] Could not reach the email provider:", error);
    throw new Error("Email service unavailable");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("[emailService] Provider rejected the request:", data);
    throw new Error(data.message || "Email provider rejected the request");
  }

  return data;
}

/** Builds and sends the "confirm your email" message for a new signup. */
async function sendVerificationEmail(to, username, rawToken) {
  const link = `${API_URL}/users/verify-email?token=${encodeURIComponent(rawToken)}`;

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;color:#151515">
      <h2 style="font-family:Georgia,serif;font-style:italic;color:#b23a43">Hawkers</h2>
      <p>Hi ${username},</p>
      <p>Thanks for creating a Hawkers account. Please confirm this email address to activate it.</p>
      <p style="margin:24px 0">
        <a href="${link}"
           style="background:#b23a43;color:#fff;padding:12px 20px;border-radius:8px;
                  text-decoration:none;font-weight:600">Verify my email</a>
      </p>
      <p style="font-size:12px;color:#6b6b6b">
        Or paste this link into your browser:<br>${link}
      </p>
      <p style="font-size:12px;color:#6b6b6b">
        This link expires in 24 hours. If you did not sign up, you can ignore this email.
      </p>
    </div>
  `;

  return sendEmail({ to, subject: "Verify your Hawkers account", html });
}

module.exports = { sendEmail, sendVerificationEmail };