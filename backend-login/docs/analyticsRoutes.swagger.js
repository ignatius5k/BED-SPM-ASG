/**
 * Swagger documentation for SA2-35 sales analytics, SA2-36 customer
 * satisfaction and SA2-37 hygiene history.
 * This file contains comments only and does not change runtime behaviour.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SalesItem:
 *       type: object
 *       properties:
 *         menuItemId: { type: string, example: MENU001 }
 *         itemName: { type: string, example: Steamed Chicken Rice }
 *         price: { type: number, format: double, example: 5.5 }
 *         stallId: { type: string, example: STALL001 }
 *         stallName: { type: string, example: "Ben's Chicken Rice" }
 *         cuisine: { type: string, example: Chinese }
 *         quantitySold: { type: integer, example: 7 }
 *         revenue: { type: number, format: double, example: 38.5 }
 *     PeakHour:
 *       type: object
 *       properties:
 *         hourOfDay: { type: integer, minimum: 0, maximum: 23, example: 15 }
 *         totalOrders: { type: integer, example: 16 }
 *         totalSales: { type: number, format: double, example: 1076.3 }
 *     InspectionRecord:
 *       type: object
 *       properties:
 *         inspectionId: { type: integer, example: 13 }
 *         stallId: { type: string, example: STALL001 }
 *         stallName: { type: string, example: "Ben's Chicken Rice" }
 *         inspectionDate: { type: string, format: date, example: "2025-08-27" }
 *         cleanlinessScore: { type: integer, minimum: 0, maximum: 100, example: 74 }
 *         foodHandlingScore: { type: integer, minimum: 0, maximum: 100, example: 76 }
 *         remarks: { type: string, example: General hygiene was satisfactory. }
 *         grade: { type: string, example: C }
 *         inspectorName: { type: string, example: neaofficer03 }
 */

/**
 * @swagger
 * /sales-analytics:
 *   get:
 *     summary: SA2-35 - Get customer-facing sales analytics
 *     description: Returns popular items and peak hours from paid and completed SQL orders.
 *     tags: [SA2-35 Sales Analytics]
 *     responses:
 *       200:
 *         description: Popular items, hourly order totals and the busiest hour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 popularItems:
 *                   type: array
 *                   maxItems: 5
 *                   items: { $ref: '#/components/schemas/SalesItem' }
 *                 peakHours:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/PeakHour' }
 *                 busiestHour:
 *                   allOf:
 *                     - $ref: '#/components/schemas/PeakHour'
 *                   nullable: true
 *       500: { description: Database error }
 */

/**
 * @swagger
 * /vendor-satisfaction:
 *   get:
 *     summary: SA2-36 - Get the vendor customer-satisfaction dashboard
 *     description: Returns feedback and complaint analytics only for stalls owned by the JWT vendor.
 *     tags: [SA2-36 Customer Satisfaction]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *         example: "2026-01-01"
 *         description: Must be supplied together with endDate; defaults to the latest six months
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *         example: "2026-08-02"
 *         description: Must be supplied together with startDate
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Cleanliness, Food Quality, Service Quality, Waiting Time, Others]
 *         example: Cleanliness
 *     responses:
 *       200:
 *         description: Satisfaction summary, trends, feedback and complaints
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stalls:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/StallSummary' }
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalFeedback: { type: integer, example: 13 }
 *                     averageRating: { type: number, format: double, example: 4.15 }
 *                     totalComplaints: { type: integer, example: 10 }
 *                     openComplaints: { type: integer, example: 5 }
 *                 ratingTrend:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       periodStart: { type: string, format: date-time }
 *                       periodLabel: { type: string, example: Jan 2026 }
 *                       feedbackCount: { type: integer, example: 1 }
 *                       averageRating: { type: number, format: double, example: 5 }
 *                 complaintCategories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category: { type: string, example: Cleanliness }
 *                       complaintCount: { type: integer, example: 3 }
 *                 recentFeedback:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       feedbackId: { type: integer, example: 17 }
 *                       customerName: { type: string, example: alicetan }
 *                       stallName: { type: string, example: "Ben's Chicken Rice" }
 *                       rating: { type: integer, minimum: 1, maximum: 5, example: 5 }
 *                       comments: { type: string }
 *                       feedbackDate: { type: string, format: date-time }
 *                 recentComplaints:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       complaintId: { type: integer, example: 16 }
 *                       customerName: { type: string, example: alicetan }
 *                       stallName: { type: string, example: "Ben's Chicken Rice" }
 *                       category: { type: string, example: Cleanliness }
 *                       description: { type: string, example: Dining area was not clean. }
 *                       status: { type: string, example: pending }
 *                       complaintDate: { type: string, format: date-time }
 *       400: { description: Invalid dates or complaint category }
 *       401:
 *         description: Missing, invalid or expired token
 *       403: { description: Signed-in user is not a vendor }
 *       404: { description: No stall found for this vendor }
 *       500: { description: Database error }
 */

/**
 * @swagger
 * /vendor-inspection-history:
 *   get:
 *     summary: SA2-37 - Get vendor hygiene and inspection history
 *     description: Returns read-only inspection results for a stall owned by the JWT vendor.
 *     tags: [SA2-37 Hygiene History]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           enum: [0, 3, 6, 12]
 *           default: 12
 *         description: Use 0 for all history
 *       - in: query
 *         name: stallId
 *         schema: { type: string, maxLength: 10 }
 *         example: STALL001
 *         description: Must belong to the signed-in vendor
 *     responses:
 *       200:
 *         description: Vendor stalls and filtered inspection history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stalls:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/StallSummary' }
 *                 selectedStallId: { type: string, example: STALL001 }
 *                 periodMonths: { type: integer, example: 12 }
 *                 inspections:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/InspectionRecord' }
 *       400: { description: Invalid period or stall ID }
 *       401:
 *         description: Missing, invalid or expired token
 *       403: { description: Signed-in user is not a vendor }
 *       404: { description: Stall not found or not owned by this vendor }
 *       500: { description: Database error }
 */
