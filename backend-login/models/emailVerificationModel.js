const sql = require("mssql");
const crypto = require("crypto");
const dbConfig = require("../dbConfig");

// How long a verification link stays valid.
const TOKEN_TTL_HOURS = 24;

/** Random, unguessable token that goes into the email link. */
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/** Only the hash is stored, the same idea as hashing a password. */
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Issues a fresh verification link for a user and returns the RAW token.
 * The raw token exists only in memory and in the email - never in the database.
 */
async function createVerification(userId) {
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);

  let connection;
  try {
    connection = await sql.connect(dbConfig);

    // Any older unused link for this user stops working, so only the
    // newest email in the inbox is the valid one.
    const clearReq = connection.request();
    clearReq.input("userId", userId);
    await clearReq.query(`
      DELETE FROM EmailVerifications
      WHERE UserID = @userId AND UsedAt IS NULL
    `);

    const insertReq = connection.request();
    insertReq.input("userId", userId);
    insertReq.input("tokenHash", tokenHash);
    insertReq.input("hours", TOKEN_TTL_HOURS);
    await insertReq.query(`
      INSERT INTO EmailVerifications (UserID, TokenHash, ExpiresAt)
      VALUES (@userId, @tokenHash, DATEADD(HOUR, @hours, GETDATE()))
    `);

    return rawToken;
  } catch (error) {
    console.error("Database error in createVerification:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

/**
 * Validates a token from a verification link and, if it is good,
 * marks both the token and the user as verified.
 *
 * Returns: { status: "verified" | "already" | "invalid", userId? }
 */
async function consumeVerification(rawToken) {
  const tokenHash = hashToken(rawToken);

  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const lookupReq = connection.request();
    lookupReq.input("tokenHash", tokenHash);
    const result = await lookupReq.query(`
      SELECT v.VerificationID, v.UserID, v.ExpiresAt, v.UsedAt, u.IsVerified
      FROM EmailVerifications v
      JOIN Users u ON u.id = v.UserID
      WHERE v.TokenHash = @tokenHash
    `);

    const row = result.recordset[0];

    // Unknown token, expired token, or a token that was already spent.
    if (!row) return { status: "invalid" };
    if (row.UsedAt) return { status: "already", userId: row.UserID };
    if (new Date(row.ExpiresAt) < new Date()) return { status: "invalid" };

    const markTokenReq = connection.request();
    markTokenReq.input("id", row.VerificationID);
    await markTokenReq.query(`
      UPDATE EmailVerifications SET UsedAt = GETDATE() WHERE VerificationID = @id
    `);

    const markUserReq = connection.request();
    markUserReq.input("userId", row.UserID);
    await markUserReq.query(`
      UPDATE Users SET IsVerified = 1 WHERE id = @userId
    `);

    return { status: "verified", userId: row.UserID };
  } catch (error) {
    console.error("Database error in consumeVerification:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { createVerification, consumeVerification, TOKEN_TTL_HOURS };