const sql = require("mssql");
const dbConfig = require("./dbConfig");

// Get all complaints
async function getAllComplaints() {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM Complaint";
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

// Get complaint by ID
async function getComplaintById(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM Complaint WHERE complaint_id = @id";
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

// Create new complaint
async function createComplaint(complaintData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `INSERT INTO Complaint (customer_id, stall_id, complaint_type, description)
                   VALUES (@customer_id, @stall_id, @complaint_type, @description);
                   SELECT SCOPE_IDENTITY() AS id;`;
    const request = connection.request();
    request.input("customer_id", complaintData.customer_id);
    request.input("stall_id", complaintData.stall_id);
    request.input("complaint_type", complaintData.complaint_type);
    request.input("description", complaintData.description);
    const result = await request.query(query);
    const newComplaintId = result.recordset[0].id;
    return await getComplaintById(newComplaintId);
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

// Update complaint (status)
async function updateComplaint(id, complaintData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `UPDATE Complaint
                   SET status = @status
                   WHERE complaint_id = @id`;
    const request = connection.request();
    request.input("id", id);
    request.input("status", complaintData.status);
    await request.query(query);
    return await getComplaintById(id);
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

// Delete complaint
async function deleteComplaint(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "DELETE FROM Complaint WHERE complaint_id = @id";
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
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
};