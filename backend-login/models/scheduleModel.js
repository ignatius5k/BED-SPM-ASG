const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getAllSchedules() {
    const connection = await sql.connect(dbConfig);

    const result = await connection.request().query(`
        SELECT
            s.ScheduleID,
            s.ScheduledDate,
            s.ScheduledTime,
            s.Status,
            st.StallID,
            st.StallName,
            u.id AS InspectorID,
            u.username AS InspectorName

        FROM InspectionSchedule s

        JOIN Stalls st
        ON s.StallID = st.StallID

        JOIN Users u
        ON s.InspectorID = u.id

        ORDER BY s.ScheduledDate
    `);

    return result.recordset;
}

async function createSchedule(schedule) {

    const connection = await sql.connect(dbConfig);

    await connection.request()

        .input("stall", sql.VarChar, schedule.StallID)

        .input("inspector", sql.VarChar, schedule.InspectorID)

        .input("date", sql.Date, schedule.ScheduledDate)

        .input("time", sql.VarChar, schedule.ScheduledTime)

        .query(`
            INSERT INTO InspectionSchedule
            (StallID,InspectorID,ScheduledDate,ScheduledTime)

            VALUES

            (@stall,@inspector,@date,@time)
        `);
}

async function updateSchedule(id, schedule) {

    const connection = await sql.connect(dbConfig);

    await connection.request()

        .input("id", sql.Int, id)

        .input("stall", sql.VarChar, schedule.StallID)

        .input("inspector", sql.VarChar, schedule.InspectorID)

        .input("date", sql.Date, schedule.ScheduledDate)

        .input("time", sql.Time, schedule.ScheduledTime)

        .input("status", sql.VarChar, schedule.Status)

        .query(`
            UPDATE InspectionSchedule

            SET

            StallID=@stall,

            InspectorID=@inspector,

            ScheduledDate=@date,

            ScheduledTime=@time,

            Status=@status

            WHERE ScheduleID=@id
        `);
}

async function deleteSchedule(id) {

    const connection = await sql.connect(dbConfig);

    await connection.request()

        .input("id", sql.Int, id)

        .query(`
            DELETE FROM InspectionSchedule
            WHERE ScheduleID=@id
        `);
}

module.exports = {
    getAllSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule
};