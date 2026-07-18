const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getVendorSatisfaction(vendorId, dateFilter, category) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    // STEP 1: Find the stalls owned by the logged-in vendor.
    const stallRequest = connection.request();
    stallRequest.input("vendorId", sql.VarChar(10), vendorId);

    const stallResult = await stallRequest.query(`
      SELECT
        StallID AS stallId,
        StallName AS stallName
      FROM Stalls
      WHERE OwnerID = @vendorId
      ORDER BY StallName;
    `);

    if (stallResult.recordset.length === 0) {
      return null;
    }

    // STEP 2: Calculate the feedback summary for the selected date range.
    const feedbackSummaryRequest = connection.request();
    feedbackSummaryRequest.input("vendorId", sql.VarChar(10), vendorId);
    feedbackSummaryRequest.input("startDate", sql.Date, dateFilter.startDate);
    feedbackSummaryRequest.input("endDate", sql.Date, dateFilter.endDate);

    const feedbackSummaryResult = await feedbackSummaryRequest.query(`
      SELECT
        COUNT(f.feedback_id) AS totalFeedback,
        CAST(COALESCE(AVG(CAST(f.rating AS DECIMAL(10, 2))), 0) AS DECIMAL(4, 2)) AS averageRating
      FROM Stalls s
      LEFT JOIN Feedback f
        ON s.StallID = f.stall_id
        AND f.created_at >= @startDate
        AND f.created_at < DATEADD(DAY, 1, @endDate)
      WHERE s.OwnerID = @vendorId;
    `);

    // STEP 3: Calculate complaint totals. The category filter only applies to complaints.
    const complaintSummaryRequest = connection.request();
    complaintSummaryRequest.input("vendorId", sql.VarChar(10), vendorId);
    complaintSummaryRequest.input("startDate", sql.Date, dateFilter.startDate);
    complaintSummaryRequest.input("endDate", sql.Date, dateFilter.endDate);

    let complaintCategoryCondition = "";

    if (category) {
      complaintSummaryRequest.input("category", sql.VarChar(50), category);
      complaintCategoryCondition = "AND c.category = @category";
    }

    const complaintSummaryResult = await complaintSummaryRequest.query(`
      SELECT
        COUNT(c.complaint_id) AS totalComplaints,
        COUNT(CASE WHEN c.status IN ('pending', 'in progress') THEN 1 END) AS openComplaints
      FROM Stalls s
      LEFT JOIN Complaints c
        ON s.StallID = c.stall_id
        AND c.complaint_date >= @startDate
        AND c.complaint_date < DATEADD(DAY, 1, @endDate)
        ${complaintCategoryCondition}
      WHERE s.OwnerID = @vendorId;
    `);

    // STEP 4: Group ratings by week for short ranges and by month for longer ranges.
    const trendRequest = connection.request();
    trendRequest.input("vendorId", sql.VarChar(10), vendorId);
    trendRequest.input("startDate", sql.Date, dateFilter.startDate);
    trendRequest.input("endDate", sql.Date, dateFilter.endDate);

    let trendResult;

    if (dateFilter.granularity === "week") {
      trendResult = await trendRequest.query(`
        WITH WeeklyFeedback AS (
          SELECT
            DATEDIFF(DAY, @startDate, CAST(f.created_at AS DATE)) / 7 AS weekNumber,
            f.rating
          FROM Stalls s
          INNER JOIN Feedback f ON s.StallID = f.stall_id
          WHERE s.OwnerID = @vendorId
            AND f.created_at >= @startDate
            AND f.created_at < DATEADD(DAY, 1, @endDate)
        )
        SELECT
          DATEADD(DAY, weekNumber * 7, @startDate) AS periodStart,
          FORMAT(DATEADD(DAY, weekNumber * 7, @startDate), 'd MMM')
            + ' - '
            + FORMAT(
                CASE
                  WHEN DATEADD(DAY, weekNumber * 7 + 6, @startDate) > @endDate
                  THEN @endDate
                  ELSE DATEADD(DAY, weekNumber * 7 + 6, @startDate)
                END,
                'd MMM'
              ) AS periodLabel,
          COUNT(rating) AS feedbackCount,
          CAST(AVG(CAST(rating AS DECIMAL(10, 2))) AS DECIMAL(4, 2)) AS averageRating
        FROM WeeklyFeedback
        GROUP BY weekNumber
        ORDER BY periodStart;
      `);
    } else {
      trendResult = await trendRequest.query(`
        SELECT
          DATEFROMPARTS(YEAR(f.created_at), MONTH(f.created_at), 1) AS periodStart,
          FORMAT(f.created_at, 'MMM yyyy') AS periodLabel,
          COUNT(f.feedback_id) AS feedbackCount,
          CAST(AVG(CAST(f.rating AS DECIMAL(10, 2))) AS DECIMAL(4, 2)) AS averageRating
        FROM Stalls s
        INNER JOIN Feedback f ON s.StallID = f.stall_id
        WHERE s.OwnerID = @vendorId
          AND f.created_at >= @startDate
          AND f.created_at < DATEADD(DAY, 1, @endDate)
        GROUP BY
          YEAR(f.created_at),
          MONTH(f.created_at),
          FORMAT(f.created_at, 'MMM yyyy')
        ORDER BY periodStart;
      `);
    }

    // STEP 5: Count complaints by category for the selected filters.
    const categoryRequest = connection.request();
    categoryRequest.input("vendorId", sql.VarChar(10), vendorId);
    categoryRequest.input("startDate", sql.Date, dateFilter.startDate);
    categoryRequest.input("endDate", sql.Date, dateFilter.endDate);

    let categoryCondition = "";

    if (category) {
      categoryRequest.input("category", sql.VarChar(50), category);
      categoryCondition = "AND c.category = @category";
    }

    const categoryResult = await categoryRequest.query(`
      SELECT
        c.category,
        COUNT(c.complaint_id) AS complaintCount
      FROM Stalls s
      INNER JOIN Complaints c ON s.StallID = c.stall_id
      WHERE s.OwnerID = @vendorId
        AND c.complaint_date >= @startDate
        AND c.complaint_date < DATEADD(DAY, 1, @endDate)
        ${categoryCondition}
      GROUP BY c.category
      ORDER BY complaintCount DESC, c.category;
    `);

    // STEP 6: Retrieve the newest feedback comments.
    const recentFeedbackRequest = connection.request();
    recentFeedbackRequest.input("vendorId", sql.VarChar(10), vendorId);
    recentFeedbackRequest.input("startDate", sql.Date, dateFilter.startDate);
    recentFeedbackRequest.input("endDate", sql.Date, dateFilter.endDate);

    const recentFeedbackResult = await recentFeedbackRequest.query(`
      SELECT TOP 5
        f.feedback_id AS feedbackId,
        u.username AS customerName,
        s.StallName AS stallName,
        f.rating,
        f.comments,
        f.created_at AS feedbackDate
      FROM Stalls s
      INNER JOIN Feedback f ON s.StallID = f.stall_id
      INNER JOIN Users u ON f.customer_id = u.id
      WHERE s.OwnerID = @vendorId
        AND f.created_at >= @startDate
        AND f.created_at < DATEADD(DAY, 1, @endDate)
        AND NULLIF(LTRIM(RTRIM(f.comments)), '') IS NOT NULL
      ORDER BY f.created_at DESC, f.feedback_id DESC;
    `);

    // STEP 7: Retrieve the newest complaints for the action table.
    const recentComplaintRequest = connection.request();
    recentComplaintRequest.input("vendorId", sql.VarChar(10), vendorId);
    recentComplaintRequest.input("startDate", sql.Date, dateFilter.startDate);
    recentComplaintRequest.input("endDate", sql.Date, dateFilter.endDate);

    let recentComplaintCondition = "";

    if (category) {
      recentComplaintRequest.input("category", sql.VarChar(50), category);
      recentComplaintCondition = "AND c.category = @category";
    }

    const recentComplaintResult = await recentComplaintRequest.query(`
      SELECT TOP 10
        c.complaint_id AS complaintId,
        u.username AS customerName,
        s.StallName AS stallName,
        c.category,
        c.description,
        c.status,
        c.complaint_date AS complaintDate
      FROM Stalls s
      INNER JOIN Complaints c ON s.StallID = c.stall_id
      INNER JOIN Users u ON c.customer_id = u.id
      WHERE s.OwnerID = @vendorId
        AND c.complaint_date >= @startDate
        AND c.complaint_date < DATEADD(DAY, 1, @endDate)
        ${recentComplaintCondition}
      ORDER BY c.complaint_date DESC, c.complaint_id DESC;
    `);

    return {
      stalls: stallResult.recordset,
      summary: {
        totalFeedback: feedbackSummaryResult.recordset[0].totalFeedback,
        averageRating: feedbackSummaryResult.recordset[0].averageRating,
        totalComplaints: complaintSummaryResult.recordset[0].totalComplaints,
        openComplaints: complaintSummaryResult.recordset[0].openComplaints,
      },
      ratingTrend: trendResult.recordset,
      complaintCategories: categoryResult.recordset,
      recentFeedback: recentFeedbackResult.recordset,
      recentComplaints: recentComplaintResult.recordset,
    };
  } catch (error) {
    console.error("Database error in getVendorSatisfaction:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = {
  getVendorSatisfaction,
};
