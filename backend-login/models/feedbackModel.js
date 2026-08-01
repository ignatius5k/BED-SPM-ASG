const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function openConnection() {
  const connection = new sql.ConnectionPool(dbConfig);
  return connection.connect();
}

async function findPublicStall(connection, centreId, customerStallId) {
  const request = connection.request();
  request.input("centreId", sql.VarChar(10), centreId);
  request.input("customerStallId", sql.VarChar(20), customerStallId);

  const result = await request.query(`
    SELECT TOP (1)
      StallID AS stallId,
      StallName AS stallName
    FROM Stalls
    WHERE HawkerCentreID = @centreId
      AND CustomerStallID = @customerStallId
    ORDER BY
      CASE WHEN StallID LIKE 'FBS%' THEN 0 ELSE 1 END,
      StallID;
  `);

  return result.recordset[0] || null;
}

async function selectFeedbackById(connection, feedbackId, currentUserId) {
  const request = connection.request();
  request.input("feedbackId", sql.Int, feedbackId);
  request.input("currentUserId", sql.VarChar(10), currentUserId || null);

  const result = await request.query(`
    SELECT
      f.feedback_id AS feedbackId,
      f.stall_id AS stallId,
      u.username AS displayName,
      f.rating,
      f.comments,
      f.created_at AS createdAt,
      CAST(
        CASE WHEN f.customer_id = @currentUserId THEN 1 ELSE 0 END
        AS BIT
      ) AS isOwner
    FROM Feedback f
    INNER JOIN Users u ON f.customer_id = u.id
    WHERE f.feedback_id = @feedbackId;
  `);

  return result.recordset[0] || null;
}

async function getFeedbackForStall(centreId, customerStallId, currentUserId) {
  let connection;

  try {
    connection = await openConnection();
    const stall = await findPublicStall(
      connection,
      centreId,
      customerStallId
    );

    if (!stall) {
      return null;
    }

    const request = connection.request();
    request.input("stallId", sql.VarChar(10), stall.stallId);
    request.input("currentUserId", sql.VarChar(10), currentUserId || null);

    const result = await request.query(`
      SELECT
        f.feedback_id AS feedbackId,
        f.stall_id AS stallId,
        u.username AS displayName,
        f.rating,
        f.comments,
        f.created_at AS createdAt,
        CAST(
          CASE WHEN f.customer_id = @currentUserId THEN 1 ELSE 0 END
          AS BIT
        ) AS isOwner
      FROM Feedback f
      INNER JOIN Users u ON f.customer_id = u.id
      WHERE f.stall_id = @stallId
      ORDER BY f.created_at DESC, f.feedback_id DESC;
    `);

    return {
      stall: stall,
      reviews: result.recordset,
    };
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function createFeedback(customerId, feedback) {
  let connection;

  try {
    connection = await openConnection();
    const stall = await findPublicStall(
      connection,
      feedback.centreId,
      feedback.customerStallId
    );

    if (!stall) {
      return null;
    }

    const request = connection.request();
    request.input("customerId", sql.VarChar(10), customerId);
    request.input("stallId", sql.VarChar(10), stall.stallId);
    request.input("rating", sql.Int, feedback.rating);
    request.input("comments", sql.VarChar(500), feedback.comments || null);

    const result = await request.query(`
      INSERT INTO Feedback (customer_id, stall_id, rating, comments)
      OUTPUT INSERTED.feedback_id AS feedbackId
      VALUES (@customerId, @stallId, @rating, @comments);
    `);

    return await selectFeedbackById(
      connection,
      result.recordset[0].feedbackId,
      customerId
    );
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function updateFeedback(customerId, feedbackId, feedback) {
  let connection;

  try {
    connection = await openConnection();
    const request = connection.request();
    request.input("feedbackId", sql.Int, feedbackId);
    request.input("customerId", sql.VarChar(10), customerId);
    request.input("rating", sql.Int, feedback.rating);
    request.input("comments", sql.VarChar(500), feedback.comments || null);

    const result = await request.query(`
      UPDATE Feedback
      SET rating = @rating,
          comments = @comments
      WHERE feedback_id = @feedbackId
        AND customer_id = @customerId;
    `);

    if (result.rowsAffected[0] === 0) {
      return null;
    }

    return await selectFeedbackById(connection, feedbackId, customerId);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function deleteFeedback(customerId, feedbackId) {
  let connection;

  try {
    connection = await openConnection();
    const request = connection.request();
    request.input("feedbackId", sql.Int, feedbackId);
    request.input("customerId", sql.VarChar(10), customerId);

    const result = await request.query(`
      DELETE FROM Feedback
      WHERE feedback_id = @feedbackId
        AND customer_id = @customerId;
    `);

    return result.rowsAffected[0] > 0;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = {
  getFeedbackForStall,
  createFeedback,
  updateFeedback,
  deleteFeedback,
};
