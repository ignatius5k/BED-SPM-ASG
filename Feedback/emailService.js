const axios = require("axios");

async function sendPromotionEmail(promotion) {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Hawkers",
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email: process.env.PROMO_RECIPIENT_EMAIL }],
        subject: "New Promotion: " + promotion.title,
        htmlContent:
          "<h2>" + promotion.title + "</h2>" +
          "<p>" + promotion.description + "</p>" +
          "<p><strong>Deal: " + promotion.discount + "</strong></p>" +
          "<p>Visit us on the Hawkers app to enjoy this promotion!</p>",
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Promotion email sent:", response.data.messageId);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error.response ? error.response.data : error.message);
    return false;
  }
}

module.exports = { sendPromotionEmail };