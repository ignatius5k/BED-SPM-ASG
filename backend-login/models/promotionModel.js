const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function selectPromotionById(connection, promotionId) {
  const request = connection.request();
  request.input("promotionId", sql.Int, promotionId);

  const result = await request.query(`
    SELECT
      p.promotion_id AS promotionId,
      p.stall_id AS stallId,
      s.StallName AS stallName,
      p.title,
      p.description,
      p.discount
    FROM Promotion p
    INNER JOIN Stalls s ON s.StallID = p.stall_id
    WHERE p.promotion_id = @promotionId;
  `);

  return result.recordset[0] || null;
}

async function getAllPromotions() {
  let connection;

  try {
    connection = new sql.ConnectionPool(dbConfig);
    await connection.connect();

    const result = await connection.request().query(`
      SELECT
        p.promotion_id AS promotionId,
        p.stall_id AS stallId,
        s.StallName AS stallName,
        p.title,
        p.description,
        p.discount
      FROM Promotion p
      INNER JOIN Stalls s ON s.StallID = p.stall_id
      ORDER BY p.promotion_id;
    `);

    return result.recordset;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function createPromotion(promotion) {
  let connection;

  try {
    connection = new sql.ConnectionPool(dbConfig);
    await connection.connect();

    const request = connection.request();
    request.input("stallId", sql.VarChar(10), promotion.stallId);
    request.input("title", sql.VarChar(100), promotion.title);
    request.input("description", sql.VarChar(500), promotion.description);
    request.input("discount", sql.VarChar(50), promotion.discount);

    const result = await request.query(`
      INSERT INTO Promotion (stall_id, title, description, discount)
      OUTPUT INSERTED.promotion_id AS promotionId
      SELECT @stallId, @title, @description, @discount
      WHERE EXISTS (
        SELECT 1
        FROM Stalls
        WHERE StallID = @stallId
      );
    `);

    if (result.recordset.length === 0) {
      return null;
    }

    return await selectPromotionById(
      connection,
      result.recordset[0].promotionId
    );
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = {
  getAllPromotions,
  createPromotion,
};
