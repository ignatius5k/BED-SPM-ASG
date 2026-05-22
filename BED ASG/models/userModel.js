const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getUserByUsername(username) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("username", sql.NVarChar(50), username);

    const result = await request.query(`
      SELECT user_id AS id, username, password_hash AS passwordHash, role
      FROM Users
      WHERE username = @username;
    `);

    return result.recordset[0] || null;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function createUser(userData) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("username", sql.NVarChar(50), userData.username);
    request.input("passwordHash", sql.NVarChar(255), userData.passwordHash);
    request.input("role", sql.NVarChar(20), userData.role);

    const result = await request.query(`
      INSERT INTO Users (username, password_hash, role)
      VALUES (@username, @passwordHash, @role);

      SELECT SCOPE_IDENTITY() AS id;
    `);

    return {
      id: result.recordset[0].id,
      username: userData.username,
      role: userData.role,
    };
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = {
  getUserByUsername,
  createUser,
};
