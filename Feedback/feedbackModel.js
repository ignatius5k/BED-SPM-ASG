const sql = require("mssql");
const dbConfig = require("./dbConfig");

// Get all feedback
async function getAllFeedback() {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM Feedback";
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

// Get feedback by ID
async function getFeedbackById(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM Feedback WHERE feedback_id = @id";
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

// Create new feedback
async function createFeedback(feedbackData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `INSERT INTO Feedback (customer_id, stall_id, rating, comments)
                   VALUES (@customer_id, @stall_id, @rating, @comments);
                   SELECT SCOPE_IDENTITY() AS id;`;
    const request = connection.request();
    request.input("customer_id", feedbackData.customer_id);
    request.input("stall_id", feedbackData.stall_id);
    request.input("rating", feedbackData.rating);
    request.input("comments", feedbackData.comments || null);
    const result = await request.query(query);
    const newFeedbackId = result.recordset[0].id;
    return await getFeedbackById(newFeedbackId);
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

// Update feedback
async function updateFeedback(id, feedbackData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `UPDATE Feedback
                   SET rating = @rating, comments = @comments
                   WHERE feedback_id = @id`;
    const request = connection.request();
    request.input("id", id);
    request.input("rating", feedbackData.rating);
    request.input("comments", feedbackData.comments || null);
    await request.query(query);
    return await getFeedbackById(id);
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

// Delete feedback
async function deleteFeedback(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "DELETE FROM Feedback WHERE feedback_id = @id";
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
  getAllFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
};