const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const BREVO_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";
const REQUIRED_BREVO_VARIABLES = [
  "BREVO_API_KEY",
  "BREVO_SENDER_EMAIL",
  "PROMO_RECIPIENT_EMAIL",
];

function loadLegacyBrevoEnvironment() {
  const alreadyConfigured = REQUIRED_BREVO_VARIABLES.every(
    (name) => String(process.env[name] || "").trim().length > 0
  );

  if (alreadyConfigured) {
    return;
  }

  const legacyEnvironment = path.resolve(__dirname, "../../Feedback/.env");

  if (fs.existsSync(legacyEnvironment)) {
    dotenv.config({
      path: legacyEnvironment,
      override: false,
      quiet: true,
    });
  }
}

function readBrevoConfiguration() {
  loadLegacyBrevoEnvironment();

  const configuration = {
    apiKey: String(process.env.BREVO_API_KEY || "").trim(),
    senderEmail: String(process.env.BREVO_SENDER_EMAIL || "").trim(),
    recipientEmail: String(process.env.PROMO_RECIPIENT_EMAIL || "").trim(),
  };

  const configured = Object.values(configuration).every(
    (value) => value.length > 0 && !value.startsWith("your_")
  );

  return {
    configured,
    ...configuration,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendPromotionEmail(promotion) {
  const configuration = readBrevoConfiguration();

  if (!configuration.configured) {
    console.warn("Promotion saved, but Brevo email is not configured.");
    return { sent: false, reason: "not_configured" };
  }

  try {
    const response = await fetch(BREVO_EMAIL_URL, {
      method: "POST",
      headers: {
        "api-key": configuration.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Hawkers",
          email: configuration.senderEmail,
        },
        to: [{ email: configuration.recipientEmail }],
        subject: `New Promotion: ${promotion.title}`,
        htmlContent:
          `<h2>${escapeHtml(promotion.title)}</h2>` +
          `<p>${escapeHtml(promotion.description)}</p>` +
          `<p><strong>Deal: ${escapeHtml(promotion.discount)}</strong></p>` +
          "<p>Visit us on the Hawkers app to enjoy this promotion!</p>",
      }),
    });

    const responseBody = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Brevo rejected the promotion email request.");
      return { sent: false, reason: "provider_error" };
    }

    console.log("Promotion email sent:", responseBody.messageId || "accepted");
    return {
      sent: true,
      messageId: responseBody.messageId || null,
    };
  } catch (error) {
    console.error("Promotion email request failed:", error.message);
    return { sent: false, reason: "request_failed" };
  }
}

module.exports = {
  sendPromotionEmail,
};
