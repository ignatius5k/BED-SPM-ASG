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


async function createInspection(inspection) {

    const pool = await sql.connect(dbConfig);

    await pool.request()

        .input("stallID", sql.VarChar(10), inspection.StallID)

        .input("inspectorID", sql.VarChar(10), inspection.InspectorID)

        .input("inspectionDate", sql.Date, inspection.InspectionDate)

        .input("cleanlinessScore", sql.Int, inspection.CleanlinessScore)

        .input("foodHandlingScore", sql.Int, inspection.FoodHandlingScore)

        .input("remarks", sql.VarChar(500), inspection.Remarks)

        .input("grade", sql.Char(1), inspection.Grade)

        .query(`
            INSERT INTO Inspections
            (
                StallID,
                InspectorID,
                InspectionDate,
                CleanlinessScore,
                FoodHandlingScore,
                Remarks,
                Grade
            )

            VALUES
            (
                @stallID,
                @inspectorID,
                @inspectionDate,
                @cleanlinessScore,
                @foodHandlingScore,
                @remarks,
                @grade
            )
        `);

}

async function deleteInspection(id) {

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            DELETE FROM Inspections
            WHERE InspectionID = @id
        `);

    return result.rowsAffected[0] > 0;
}

module.exports = {
    getAllInspections,
    createInspection,
    deleteInspection
};