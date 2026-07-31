const jwt = require("jsonwebtoken");

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // Frontend sends: "Authorization: Bearer <token>"
  // No header, or wrong format = reject immediately, don't even try to verify.
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1]; // grabs everything after "Bearer "

  try {
    // JWT STEP 2: "Check the ID card is genuine."
    // Re-computes the signature using JWT_SECRET and compares it to the
    // token's signature. Also checks it hasn't expired.
    // If either check fails, this throws - caught below.
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach the identity so the controller knows who is making this call.
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.role = decoded.role;

    next(); // card is genuine, let the request continue to the controller
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Restricts a route to specific roles.
 * Runs after requireAuth, which sets req.role from the verified token.
 * Example: app.post("/orders", requireAuth, requireRole("customer"), ...)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({
        error: "You do not have permission to perform this action"
      });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };