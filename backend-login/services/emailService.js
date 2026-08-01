require("dotenv").config();

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_NAME = process.env.EMAIL_FROM_NAME || "Hawkers";
const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS;
const API_URL = process.env.API_URL || "http://localhost:3000";

/**
 * Low-level send.
 * If no API key is configured the email is printed to the terminal instead
 * of failing, so the flow can still be demonstrated without credentials.
 */
async function sendEmail({ to, toName, subject, html, text }) {
  if (!BREVO_API_KEY) {
    console.warn("\n[emailService] BREVO_API_KEY not set - printing email instead of sending.");
    console.warn(`[emailService] To: ${to}`);
    console.warn(`[emailService] Subject: ${subject}`);
    console.warn(`[emailService] ${text || html}\n`);
    return { skipped: true };
  }

  let response;
  try {
    response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_ADDRESS },
        to: [{ email: to, name: toName || to }],
        subject,
        htmlContent: html
      })
    });
  } catch (error) {
    // Could not reach the provider at all (no internet, DNS failure)
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

  return sendEmail({
    to,
    toName: username,
    subject: "Verify your Hawkers account",
    html,
    text: `Verify your Hawkers account: ${link}`
  });
}

module.exports = { sendEmail, sendVerificationEmail };