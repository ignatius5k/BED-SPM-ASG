const sql = require("mssql");
const dbConfig = require("../../backend-login/dbConfig");

async function getVendorComplaints(vendorId) {

    const connection = await sql.connect(dbConfig);

    const result = await connection
        .request()
        .input("vendorId", sql.VarChar, vendorId)
        .query(`
            SELECT
                c.complaint_id,
                c.customer_id,
                c.category,
                c.description,
                c.status,
                c.complaint_date
            FROM Complaints c
            INNER JOIN Stalls s
                ON c.stall_id = s.StallID
            WHERE s.OwnerID = @vendorId
            ORDER BY c.complaint_date DESC
        `);

    return result.recordset;
}

async function updateComplaintStatus(id, status) {

    const connection = await sql.connect(dbConfig);

    await connection
        .request()
        .input("id", sql.Int, id)
        .input("status", sql.VarChar, status)
        .query(`
            UPDATE Complaints
            SET status = @status
            WHERE complaint_id = @id
        `);

    return true;
}

module.exports = {
    getVendorComplaints,
    updateComplaintStatus
};