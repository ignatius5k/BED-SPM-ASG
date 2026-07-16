const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getAllInspections() {
    let connection;

    try {
        connection = await sql.connect(dbConfig);

        const result = await connection.request().query(`
            SELECT
                i.InspectionID,
                i.InspectionDate,
                i.CleanlinessScore,
                i.FoodHandlingScore,
                i.Remarks,
                i.Grade,
                s.StallName,
                s.Cuisine,
                u.username AS InspectorName
            FROM Inspections i
            JOIN Stalls s
                ON i.StallID = s.StallID
            JOIN Users u
                ON i.InspectorID = u.id
            ORDER BY i.InspectionDate DESC
        `);

        return result.recordset;

    } finally {
        if(connection) await connection.close();
    }
}

module.exports = {
    getAllInspections
};