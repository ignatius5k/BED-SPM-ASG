const sql = require("mssql");
const dbConfig = require("../dbConfig");

const rolePrefix = { customer: "CUST", vendor: "VEND", inspector: "INSP" };

async function generateNextUserId(connection, role) {
  const prefix = rolePrefix[role];
  const req = connection.request();
  req.input("pattern", prefix + "%");
  const result = await req.query(`
    SELECT MAX(CAST(SUBSTRING(id, 5, 10) AS INT)) AS maxNum
    FROM Users
    WHERE id LIKE @pattern
  `);
  const nextNum = (result.recordset[0].maxNum || 0) + 1;
  return prefix + String(nextNum).padStart(3, "0");
}

async function createUser(user) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const newId = await generateNextUserId(connection, user.role || "customer");

    const insertReq = connection.request();
    insertReq.input("id", newId);
    insertReq.input("username", user.username);
    insertReq.input("email", user.email);
    insertReq.input("password", user.password);
    insertReq.input("role", user.role || "customer");
    await insertReq.query(`
      INSERT INTO Users (id, username, email, password, role)
      VALUES (@id, @username, @email, @password, @role)
    `);

    if (user.role === "inspector") {
      const req = connection.request();
      req.input("userId", newId);
      req.input("badgeNumber", user.badgeNumber);
      req.input("department", user.department || "NEA Food Safety Division");
      await req.query(`
        INSERT INTO InspectorProfiles (UserID, BadgeNumber, Department)
        VALUES (@userId, @badgeNumber, @department)
      `);
    }

    return await getUserById(newId);
  } catch (error) {
    console.error("Database error in createUser:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function getUserByEmail(email) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const req = connection.request();
    req.input("email", email);
    const result = await req.query("SELECT * FROM Users WHERE email = @email");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Database error in getUserByEmail:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function getUserById(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const req = connection.request();
    req.input("id", id);
    const result = await req.query(
      "SELECT id, username, email, role FROM Users WHERE id = @id"
    );
    const user = result.recordset[0];
    if (!user) return null;

    if (user.role === "inspector") {
      const r = connection.request();
      r.input("id", id);
      const res = await r.query(
        "SELECT BadgeNumber, Department FROM InspectorProfiles WHERE UserID = @id"
      );
      user.inspectorProfile = res.recordset[0] || null;
    }

    if (user.role === "vendor") {
      const r = connection.request();
      r.input("id", id);
      const res = await r.query(
        "SELECT StallID, StallName, Cuisine FROM Stalls WHERE OwnerID = @id"
      );
      user.stalls = res.recordset;
    }

    return user;
  } catch (error) {
    console.error("Database error in getUserById:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function updatePassword(id, newHashedPassword) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const req = connection.request();
    req.input("id", id);
    req.input("password", newHashedPassword);
    await req.query("UPDATE Users SET password = @password WHERE id = @id");
  } catch (error) {
    console.error("Database error in updatePassword:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function getAllUsers() {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request().query(
      "SELECT id, username, email, role FROM Users"
    );
    return result.recordset;
  } catch (error) {
    console.error("Database error in getAllUsers:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function updateUser(id, updates) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const req = connection.request();
    req.input("id", id);
    req.input("username", updates.username);
    req.input("email", updates.email);
    await req.query(`
      UPDATE Users
      SET username = @username, email = @email
      WHERE id = @id
    `);
    return await getUserById(id);
  } catch (error) {
    console.error("Database error in updateUser:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function deleteUser(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const req = connection.request();
    req.input("id", id);
    const result = await req.query(
      "DELETE FROM Users OUTPUT DELETED.id, DELETED.username WHERE id = @id"
    );
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Database error in deleteUser:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  createUser, getUserByEmail, getUserById, updatePassword,
  getAllUsers, updateUser, deleteUser
};