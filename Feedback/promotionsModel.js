const sql = require("mssql");
const dbConfig = require("./dbConfig");
const { sendPromotionEmail } = require("./emailService");

async function getAllPromotions() {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM Promotion";
    const result = await connection.request().query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

async function getPromotionById(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM Promotion WHERE promotion_id = @id";
    const request = connection.request();
    request.input("id", id);
    const result = await request.query(query);
    if (result.recordset.length === 0) {
      return null;
    }
    return result.recordset[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

async function createPromotion(promotionData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `INSERT INTO Promotion (stall_id, title, description, discount)
                   VALUES (@stall_id, @title, @description, @discount);
                   SELECT SCOPE_IDENTITY() AS id;`;
    const request = connection.request();
    request.input("stall_id", promotionData.stall_id);
    request.input("title", promotionData.title);
    request.input("description", promotionData.description);
    request.input("discount", promotionData.discount);
    const result = await request.query(query);
    const newPromotionId = result.recordset[0].id;

    const newPromotion = await getPromotionById(newPromotionId);

    // Third-party API: send a notification email about the new promotion.
    await sendPromotionEmail(newPromotion);

    return newPromotion;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

async function updatePromotion(id, promotionData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `UPDATE Promotion
                   SET title = @title, description = @description, discount = @discount
                   WHERE promotion_id = @id`;
    const request = connection.request();
    request.input("id", id);
    request.input("title", promotionData.title);
    request.input("description", promotionData.description);
    request.input("discount", promotionData.discount);
    await request.query(query);
    return await getPromotionById(id);
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

async function deletePromotion(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "DELETE FROM Promotion WHERE promotion_id = @id";
    const request = connection.request();
    request.input("id", id);
    const result = await request.query(query);
    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

module.exports = {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
};